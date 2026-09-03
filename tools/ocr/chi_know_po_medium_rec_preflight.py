#!/usr/bin/env python3
"""Run train-only PP-OCRv6 medium recognition preflight checks.

This script intentionally has no held-out, frozen-gold, detection, or
activation input.  It runs only:

* a zero-step checkpoint save/load round-trip with the official PaddleX
  CTCLabelDecode path; and
* a tiny repeated-batch overfit sanity check with a hard step/record cap.

It is a preflight, not a full fine-tuning runner.  The parent process launches
the two phases separately so their resource measurements remain attributable.
"""

from __future__ import annotations

import argparse
import gc
import hashlib
import importlib.util
import json
import math
import os
import platform
import resource
import subprocess
import sys
import time
from pathlib import Path
from typing import Any, Mapping, Sequence


SCHEMA = "chi-know-po-ppocrv6-medium-rec-preflight-v1"
RUN_SCHEMA = "chi-know-po-ppocrv6-medium-rec-preflight-run-v1"
CORPUS_ID = "CHI-KNOW-PO"
MODEL_ID = "PaddlePaddle/PP-OCRv6_medium_rec_safetensors"
MODEL_REVISION = "024cad6a831de75c2c3c26e711ba8c4a82ccd24b"
MODEL_WEIGHTS_SHA256 = "5f43c16f2a684b1d2284662178bdb604febd3d6bfdb5ca73828d08d0f7c0c3e9"
TRAIN_PARQUET_SHA256 = "97f6fcc531cb79c4e0f2f63a042f52317b9299ed2f13785663c8523c7c0bc25b"
TRAIN_DOCUMENT_IDS = (
    "A-1",
    "A-3",
    "A-4",
    "S-2",
    "S-3",
    "S-4",
    "S-6",
    "S-7",
    "T-1",
    "T-3",
)
SEED = 7
IMAGE_SHAPE = (3, 48, 320)
DEFAULT_TINY_RECORDS = 4
DEFAULT_TINY_STEPS = 16
DEFAULT_LEARNING_RATE = 0.0001
MAX_TINY_RECORDS = 4
MAX_TINY_STEPS = 16
RESOURCE_LIMITS = {
    "peakRssMiBMax": 4096.0,
    "swapDeltaMiBMax": 256.0,
    "phaseWallTimeMsMax": 600000.0,
}


def load_trial_runner():
    path = Path(__file__).with_name("chi_know_po_medium_rec_finetune_trial.py").resolve()
    spec = importlib.util.spec_from_file_location("chi_know_po_medium_rec_finetune_trial", path)
    if spec is None or spec.loader is None:
        raise RuntimeError("trial_runner_import_spec_missing")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def canonical_value(value: Any) -> Any:
    if isinstance(value, float) and math.isfinite(value) and value.is_integer() and abs(value) < 1e21:
        return int(value)
    if isinstance(value, list):
        return [canonical_value(item) for item in value]
    if isinstance(value, dict):
        return {key: canonical_value(item) for key, item in value.items()}
    return value


def canonical(value: Any) -> str:
    return json.dumps(
        canonical_value(value),
        ensure_ascii=False,
        sort_keys=True,
        separators=(",", ":"),
        allow_nan=False,
    ) + "\n"


def sha256_bytes(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def sha256_text(value: str) -> str:
    return sha256_bytes(value.encode("utf-8"))


def sha256_json(value: Any) -> str:
    return sha256_text(canonical(value))


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def read_json(path: Path) -> dict[str, Any]:
    value = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(value, dict):
        raise RuntimeError(f"json_object_required:{path}")
    return value


def write_json(path: Path, value: Mapping[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(canonical(value), encoding="utf-8")


def swap_usage() -> dict[str, Any]:
    if platform.system() != "Darwin":
        return {"status": "UNKNOWN", "reason": "vm.swapusage_is_macos_only"}
    try:
        result = subprocess.run(
            ["/usr/sbin/sysctl", "-n", "vm.swapusage"],
            check=False,
            capture_output=True,
            text=True,
            timeout=2,
        )
    except (OSError, subprocess.SubprocessError) as exc:
        return {"status": "UNKNOWN", "reason": f"swap_probe_failed:{type(exc).__name__}"}
    if result.returncode != 0:
        return {"status": "UNKNOWN", "reason": "swap_probe_nonzero"}
    import re

    match = re.search(r"used\s*=\s*([0-9]+(?:\.[0-9]+)?)\s*([MG])", result.stdout)
    if match is None:
        return {"status": "UNKNOWN", "reason": "swap_probe_unparsed"}
    used = float(match.group(1))
    if match.group(2) == "G":
        used *= 1024.0
    return {"status": "OBSERVED", "usedMiB": round(used, 3), "source": "sysctl vm.swapusage"}


def peak_rss_mib() -> float:
    raw = float(resource.getrusage(resource.RUSAGE_SELF).ru_maxrss)
    return raw / (1024.0 * 1024.0) if platform.system() == "Darwin" else raw / 1024.0


def cpu_seconds(before: resource.struct_rusage, after: resource.struct_rusage) -> float:
    return (after.ru_utime - before.ru_utime) + (after.ru_stime - before.ru_stime)


def runtime_descriptor(paddle_version: str | None = None) -> dict[str, Any]:
    system = platform.system().lower()
    architecture = platform.machine().lower()
    return {
        "execution": "local",
        "os": system,
        "architecture": architecture,
        "machine": "apple-silicon-arm64" if system == "darwin" and architecture == "arm64" else architecture,
        "python": platform.python_version(),
        "paddle": paddle_version,
        "device": "cpu",
        "networkAccess": False,
        "compatible": system == "darwin" and architecture == "arm64",
        "observed": True,
    }


def verify_train_input(runner, train_parquet: Path) -> dict[str, Any]:
    path = train_parquet.resolve(strict=True)
    lower = str(path).lower()
    if path.name != "corpus.parquet" or path.parent.name != "train":
        raise RuntimeError("train_only_parquet_path_required")
    if any(token in lower for token in ("untouched-held-out", "heldout", "frozen-gold", "frozen_gold")):
        raise RuntimeError("held_out_or_frozen_path_rejected")
    actual = runner.sha256_file(path)
    if actual != TRAIN_PARQUET_SHA256:
        raise RuntimeError("train_parquet_sha256_mismatch")
    return {
        "corpusId": CORPUS_ID,
        "partition": "train",
        "parquetPath": str(path),
        "parquetSha256": actual,
        "documentIds": list(TRAIN_DOCUMENT_IDS),
        "documentCount": len(TRAIN_DOCUMENT_IDS),
        "heldOutPathArgumentProvided": False,
        "frozenDomainGoldPathArgumentProvided": False,
    }


def import_runtime(runner):
    ctx = runner.import_runtime()
    from paddlex.inference.models.text_recognition.processors import CTCLabelDecode

    ctx["CTCLabelDecode"] = CTCLabelDecode
    return ctx


def model_state_digest(ctx, state: Mapping[str, Any]) -> str:
    digest = hashlib.sha256()
    for name in sorted(state):
        array = state[name].numpy()
        digest.update(name.encode("utf-8"))
        digest.update(b"\0")
        digest.update(str(array.dtype).encode("ascii"))
        digest.update(repr(tuple(array.shape)).encode("ascii"))
        digest.update(array.tobytes(order="C"))
        digest.update(b"\0")
    return digest.hexdigest()


def select_tiny_rows(runner, ctx, train_parquet: Path, model_dir: Path, tiny_records: int):
    selected, selection = runner.select_training_rows(ctx, train_parquet, model_dir, cap_per_doc=1)
    if len(selected) < tiny_records:
        raise RuntimeError("tiny_selection_insufficient")
    selected = selected[:tiny_records]
    selected.sort(key=lambda item: (item["processedWidth"], item["docId"], item["recordIdSha256"]))
    wanted = {item["recordIdSha256"] for item in selected}
    targets = {}
    for rows in runner.iter_rows(ctx, train_parquet, batch_size=256):
        for row in rows:
            record_hash = runner.record_id_sha256(row)
            if record_hash in wanted:
                targets[record_hash] = runner.normalized_text(str(row["transcription"]))
        if len(targets) == len(wanted):
            break
    if len(targets) != len(wanted):
        raise RuntimeError("tiny_target_lookup_incomplete")
    selected = [{**item, "targetText": targets[item["recordIdSha256"]]} for item in selected]
    selected_digest = [
        {
            "docId": item["docId"],
            "recordIdSha256": item["recordIdSha256"],
            "imageSha256": item["imageSha256"],
            "targetSha256": item["targetSha256"],
            "targetLength": item["targetLength"],
            "processedWidth": item["processedWidth"],
        }
        for item in selected
    ]
    return selected, {
        "sourceSelectionMethod": selection["method"],
        "sourceSelectionCapPerDocument": selection["capPerDocument"],
        "sourceSelectedRecordCount": selection["selectedRecordCount"],
        "sourceSelectedRecordsSha256": selection["selectedRecordsSha256"],
        "selectedRecordCount": len(selected),
        "selectedRecordsSha256": sha256_json(selected_digest),
        "selectedRecords": selected_digest,
        "documentIdsInTinyBatch": sorted({item["docId"] for item in selected}),
        "dictionaryExcludedRows": selection["dictionaryExcludedRows"],
        "dictionaryExcludedCharacterOccurrences": selection["dictionaryExcludedCharacterOccurrences"],
        "ctcExcludedRows": selection["ctcExcludedRows"],
        "rawTextRetained": False,
        "rawImagesRetained": False,
    }


def prepare_batch(runner, ctx, rows):
    batch, widths, input_lengths = runner.preprocess_batch(ctx, rows)
    labels, label_lengths = runner.label_batch(ctx, rows)
    return batch, widths, input_lengths, labels, label_lengths


def decode_batch(ctx, probabilities, rows, chars, decoder_descriptor):
    decoder = ctx["CTCLabelDecode"](character_list=chars[1:-1], use_space_char=True)
    texts, scores = decoder([probabilities])
    records = []
    total_edit_distance = 0
    total_target_characters = 0
    exact_count = 0
    confidence_values = []
    for row, text, score in zip(rows, texts, scores):
        target = str(row["targetText"] if "targetText" in row else row.get("transcription", ""))
        distance = levenshtein(str(text), target)
        exact = str(text) == target
        confidence = float(score)
        records.append(
            {
                "docId": row["docId"] if "docId" in row else str(row["doc_id"]),
                "recordIdSha256": row["recordIdSha256"] if "recordIdSha256" in row else record_id_sha256(row),
                "targetTextSha256": sha256_text(target),
                "targetTextLength": len(target),
                "predictionTextSha256": sha256_text(str(text)),
                "predictionTextLength": len(str(text)),
                "exactMatch": exact,
                "editDistance": distance,
                "characterErrorRate": distance / len(target) if target else None,
                "confidence": round(confidence, 9),
                "confidencePresent": math.isfinite(confidence),
            }
        )
        total_edit_distance += distance
        total_target_characters += len(target)
        exact_count += int(exact)
        confidence_values.append(confidence)
    digest_records = [
        {
            key: record[key]
            for key in (
                "docId",
                "recordIdSha256",
                "targetTextSha256",
                "targetTextLength",
                "predictionTextSha256",
                "predictionTextLength",
                "exactMatch",
                "editDistance",
            )
        }
        for record in records
    ]
    output_sha256 = sha256_json({"decoder": decoder_descriptor, "records": digest_records})
    return {
        "metrics": {
            "recordCount": len(records),
            "exactMatchRuns": exact_count,
            "exactMatchRate": exact_count / len(records) if records else None,
            "characterErrorRate": total_edit_distance / total_target_characters if total_target_characters else None,
            "totalEditDistance": total_edit_distance,
            "totalTargetCharacters": total_target_characters,
            "confidencePresentRuns": sum(math.isfinite(value) for value in confidence_values),
            "confidenceMean": sum(confidence_values) / len(confidence_values) if confidence_values else None,
            "confidenceMin": min(confidence_values) if confidence_values else None,
            "confidenceMax": max(confidence_values) if confidence_values else None,
        },
        "reproducibility": {
            "outputSha256": output_sha256,
            "rawPredictionTextRetained": False,
            "rawImagesRetained": False,
        },
        "records": records,
        "outputSha256": output_sha256,
    }


def record_id_sha256(row: Mapping[str, Any]) -> str:
    return sha256_text(f"{row['doc_id']}:{row['file_name']}")


def levenshtein(left: str, right: str) -> int:
    previous = list(range(len(right) + 1))
    for left_index, left_char in enumerate(left, start=1):
        current = [left_index]
        for right_index, right_char in enumerate(right, start=1):
            current.append(
                min(
                    current[-1] + 1,
                    previous[right_index] + 1,
                    previous[right_index - 1] + (left_char != right_char),
                )
            )
        previous = current
    return previous[-1]


def decoder_descriptor(runner, model_descriptor: Mapping[str, Any]) -> dict[str, Any]:
    return {
        "class": "PaddleX CTCLabelDecode",
        "characterListLength": model_descriptor["characterListLength"],
        "characterListSha256": model_descriptor["characterListSha256"],
        "blankIndex": 0,
        "spaceCharacter": True,
        "semanticCorrection": False,
    }


def phase_resources(started, cpu_before, swap_before):
    cpu_after = resource.getrusage(resource.RUSAGE_SELF)
    swap_after = swap_usage()
    return {
        "peakRssMiB": round(peak_rss_mib(), 3),
        "wallTimeMs": round((time.perf_counter() - started) * 1000.0, 3),
        "cpuSeconds": round(cpu_seconds(cpu_before, cpu_after), 6),
        "swapBefore": swap_before,
        "swapAfter": swap_after,
        "limits": RESOURCE_LIMITS,
    }


def common_boundaries() -> dict[str, Any]:
    return {
        "frozenDomainGoldAccessed": False,
        "heldOutAccessed": False,
        "heldOutPathArgumentProvided": False,
        "search": False,
        "historicalSourceJudgment": False,
        "semanticCorrection": False,
        "silentFallback": False,
        "detectionTouched": False,
        "activation": False,
        "fullFineTuningExecuted": False,
        "BLOCK_OCR_ROUTE": True,
        "OCRProvider": {"enabled": False},
        "networkAccess": False,
        "rawTextRetained": False,
        "rawImagesRetained": False,
    }


def zero_step(
    runner,
    model_dir: Path,
    train_parquet: Path,
    checkpoint_path: Path,
    output_path: Path,
    tiny_records: int,
) -> dict[str, Any]:
    started = time.perf_counter()
    cpu_before = resource.getrusage(resource.RUSAGE_SELF)
    swap_before = swap_usage()
    ctx = import_runtime(runner)
    train_input = verify_train_input(runner, train_parquet)
    model_descriptor = runner.verify_model(model_dir)
    selected, selection = select_tiny_rows(runner, ctx, train_parquet, model_dir, tiny_records)
    chars, _ = runner.load_character_index(model_dir)
    decoder = decoder_descriptor(runner, model_descriptor)
    batch, widths, input_lengths, _, _ = prepare_batch(runner, ctx, selected)
    model = runner.load_model(ctx, model_dir)
    model.eval()
    with ctx["paddle"].no_grad():
        logits_before = runner.model_logits(ctx, model, batch)
        probabilities_before = ctx["paddle"].nn.functional.softmax(logits_before, axis=2).numpy()
    decoded_before = decode_batch(ctx, probabilities_before, selected, chars, decoder)
    probability_sha_before = sha256_bytes(probabilities_before.tobytes(order="C"))
    state_before = model.state_dict()
    parameter_sha_before = model_state_digest(ctx, state_before)
    checkpoint_path.parent.mkdir(parents=True, exist_ok=True)
    ctx["paddle"].save(state_before, str(checkpoint_path))
    checkpoint_sha = sha256_file(checkpoint_path)
    del model, state_before, logits_before, probabilities_before
    gc.collect()

    reloaded_model = runner.load_model(ctx, model_dir)
    loaded_state = ctx["paddle"].load(str(checkpoint_path))
    parameter_sha_loaded_state = model_state_digest(ctx, loaded_state)
    reloaded_model.set_state_dict(loaded_state)
    parameter_sha_after = model_state_digest(ctx, reloaded_model.state_dict())
    reloaded_model.eval()
    with ctx["paddle"].no_grad():
        logits_after = runner.model_logits(ctx, reloaded_model, batch)
        probabilities_after = ctx["paddle"].nn.functional.softmax(logits_after, axis=2).numpy()
    decoded_after = decode_batch(ctx, probabilities_after, selected, chars, decoder)
    probability_sha_after = sha256_bytes(probabilities_after.tobytes(order="C"))
    resources = phase_resources(started, cpu_before, swap_before)
    decoder_pass = (
        decoded_before["outputSha256"] == decoded_after["outputSha256"]
        and probability_sha_before == probability_sha_after
        and all(record["confidencePresent"] for record in decoded_before["records"] + decoded_after["records"])
    )
    roundtrip_pass = (
        parameter_sha_before == parameter_sha_loaded_state == parameter_sha_after
        and checkpoint_sha is not None
        and decoder_pass
    )
    result = {
        "schema": RUN_SCHEMA,
        "status": "PASSED" if roundtrip_pass else "FAILED",
        "phase": "zero-step-checkpoint-round-trip",
        "repeat": 1,
        "candidate": {
            "workerId": "pp-ocrv6-medium-rec",
            "component": "rec",
            "model": model_descriptor,
            "loader": "PaddleX PPOCRV6SmallRec.from_pretrained(convert_from_hf=True)",
        },
        "input": {
            **train_input,
            "selection": selection,
            "imageShape": IMAGE_SHAPE,
            "seed": SEED,
            "inputSha256": sha256_json(
                {
                    "trainParquetSha256": train_input["parquetSha256"],
                    "selectionSha256": selection["selectedRecordsSha256"],
                    "modelTreeSha256": model_descriptor["modelTreeSha256"],
                    "imageShape": IMAGE_SHAPE,
                    "seed": SEED,
                }
            ),
        },
        "configuration": {
            "zeroOptimizerSteps": 0,
            "checkpointFormat": "Paddle state_dict pdparams",
            "decoder": decoder,
        },
        "checkpoint": {
            "path": str(checkpoint_path.resolve()),
            "sha256": checkpoint_sha,
            "parameterSha256BeforeSave": parameter_sha_before,
            "parameterSha256LoadedState": parameter_sha_loaded_state,
            "parameterSha256AfterLoad": parameter_sha_after,
            "savedAndLoaded": True,
        },
        "decoderRoundTrip": {
            "before": {
                "outputSha256": decoded_before["outputSha256"],
                "probabilitiesSha256": probability_sha_before,
                "metrics": decoded_before["metrics"],
                "reproducibility": decoded_before["reproducibility"],
                "records": decoded_before["records"],
            },
            "after": {
                "outputSha256": decoded_after["outputSha256"],
                "probabilitiesSha256": probability_sha_after,
                "metrics": decoded_after["metrics"],
                "reproducibility": decoded_after["reproducibility"],
                "records": decoded_after["records"],
            },
            "pass": decoder_pass,
        },
        "resources": resources,
        "boundaries": common_boundaries(),
        "evidenceRefs": [
            "tools/ocr/chi_know_po_medium_rec_preflight.py",
            "tools/ocr/chi_know_po_medium_rec_finetune_trial.py",
        ],
    }
    write_json(output_path, result)
    return result


def tiny_overfit(
    runner,
    model_dir: Path,
    train_parquet: Path,
    checkpoint_path: Path,
    output_path: Path,
    tiny_records: int,
    max_steps: int,
    learning_rate: float,
) -> dict[str, Any]:
    started = time.perf_counter()
    cpu_before = resource.getrusage(resource.RUSAGE_SELF)
    swap_before = swap_usage()
    ctx = import_runtime(runner)
    train_input = verify_train_input(runner, train_parquet)
    model_descriptor = runner.verify_model(model_dir)
    selected, selection = select_tiny_rows(runner, ctx, train_parquet, model_dir, tiny_records)
    chars, _ = runner.load_character_index(model_dir)
    decoder = decoder_descriptor(runner, model_descriptor)
    batch, widths, input_lengths, labels, label_lengths = prepare_batch(runner, ctx, selected)
    paddle = ctx["paddle"]
    F = ctx["F"]
    model = runner.load_model(ctx, model_dir)
    model.eval()
    with paddle.no_grad():
        base_logits = runner.model_logits(ctx, model, batch)
        base_probabilities = paddle.nn.functional.softmax(base_logits, axis=2).numpy()
    base_decoded = decode_batch(ctx, base_probabilities, selected, chars, decoder)
    base_parameter_sha = model_state_digest(ctx, model.state_dict())

    model.train()
    optimizer = paddle.optimizer.Adam(learning_rate=learning_rate, parameters=model.parameters())
    losses: list[float] = []
    steps_completed = 0
    nonfinite_loss_steps = 0
    nonfinite_parameter_steps = 0
    max_gradient_abs = 0.0
    step_trace: list[dict[str, Any]] = []
    expected_steps = max_steps
    for step in range(1, max_steps + 1):
        logits = runner.model_logits(ctx, model, batch)
        actual_time = int(logits.shape[1])
        batch_input_lengths = ctx["np"].minimum(input_lengths, actual_time).astype("int64")
        loss = F.ctc_loss(
            paddle.transpose(logits, [1, 0, 2]),
            paddle.to_tensor(labels),
            paddle.to_tensor(batch_input_lengths),
            paddle.to_tensor(label_lengths),
            blank=0,
            reduction="mean",
            norm_by_times=False,
            zero_infinity=True,
        )
        loss_value = float(loss.numpy().item())
        if not math.isfinite(loss_value):
            nonfinite_loss_steps += 1
            break
        loss.backward()
        step_gradient_abs = 0.0
        gradients_finite = True
        for parameter in model.parameters():
            gradient = parameter.grad
            if gradient is None:
                continue
            gradient_max = float(paddle.max(paddle.abs(gradient)).numpy().item())
            if not math.isfinite(gradient_max):
                gradients_finite = False
            step_gradient_abs = max(step_gradient_abs, gradient_max)
        max_gradient_abs = max(max_gradient_abs, step_gradient_abs)
        optimizer.step()
        optimizer.clear_grad()
        parameters_finite = all(bool(paddle.all(paddle.isfinite(parameter)).numpy().item()) for parameter in model.parameters())
        if not gradients_finite or not parameters_finite:
            nonfinite_parameter_steps += 1
            break
        losses.append(loss_value)
        steps_completed += 1
        step_trace.append(
            {
                "step": step,
                "loss": round(loss_value, 9),
                "gradientMaxAbs": round(step_gradient_abs, 9),
                "inputTimeSteps": actual_time,
                "batchSize": len(selected),
            }
        )

    stable = (
        nonfinite_loss_steps == 0
        and nonfinite_parameter_steps == 0
        and steps_completed == expected_steps
    )
    checkpoint_path.parent.mkdir(parents=True, exist_ok=True)
    if stable:
        paddle.save(model.state_dict(), str(checkpoint_path))
    checkpoint_exists = checkpoint_path.is_file()
    checkpoint_sha = sha256_file(checkpoint_path) if checkpoint_exists else None
    model.eval()
    with paddle.no_grad():
        tuned_logits = runner.model_logits(ctx, model, batch)
        tuned_probabilities = paddle.nn.functional.softmax(tuned_logits, axis=2).numpy()
    tuned_decoded = decode_batch(ctx, tuned_probabilities, selected, chars, decoder)
    tuned_parameter_sha_before_reload = model_state_digest(ctx, model.state_dict())
    del model, base_logits, base_probabilities, tuned_logits, tuned_probabilities
    gc.collect()
    roundtrip_model = runner.load_model(ctx, model_dir)
    loaded_state = paddle.load(str(checkpoint_path)) if checkpoint_exists else {}
    tuned_parameter_sha_loaded_state = model_state_digest(ctx, loaded_state) if checkpoint_exists else None
    if checkpoint_exists:
        roundtrip_model.set_state_dict(loaded_state)
    roundtrip_model.eval()
    with paddle.no_grad():
        roundtrip_logits = runner.model_logits(ctx, roundtrip_model, batch)
        roundtrip_probabilities = paddle.nn.functional.softmax(roundtrip_logits, axis=2).numpy()
    tuned_roundtrip_decoded = decode_batch(ctx, roundtrip_probabilities, selected, chars, decoder)
    tuned_parameter_sha_after_reload = model_state_digest(ctx, roundtrip_model.state_dict())
    resources = phase_resources(started, cpu_before, swap_before)
    output_roundtrip_pass = (
        tuned_decoded["outputSha256"] == tuned_roundtrip_decoded["outputSha256"]
        and checkpoint_exists
        and tuned_parameter_sha_before_reload == tuned_parameter_sha_loaded_state == tuned_parameter_sha_after_reload
        and all(record["confidencePresent"] for record in tuned_decoded["records"] + tuned_roundtrip_decoded["records"])
    )
    loss_decreased = bool(losses) and losses[-1] < losses[0]
    accuracy_signal = (
        tuned_decoded["metrics"]["exactMatchRuns"] > base_decoded["metrics"]["exactMatchRuns"]
        or tuned_decoded["metrics"]["characterErrorRate"] < base_decoded["metrics"]["characterErrorRate"]
    )
    overfit_pass = stable and loss_decreased and accuracy_signal and output_roundtrip_pass
    result = {
        "schema": RUN_SCHEMA,
        "status": "PASSED" if overfit_pass else "FAILED",
        "phase": "tiny-overfit-sanity",
        "repeat": 1,
        "candidate": {
            "workerId": "pp-ocrv6-medium-rec",
            "component": "rec",
            "model": model_descriptor,
            "loader": "PaddleX PPOCRV6SmallRec.from_pretrained(convert_from_hf=True)",
        },
        "input": {
            **train_input,
            "selection": selection,
            "imageShape": IMAGE_SHAPE,
            "seed": SEED,
            "inputSha256": sha256_json(
                {
                    "trainParquetSha256": train_input["parquetSha256"],
                    "selectionSha256": selection["selectedRecordsSha256"],
                    "modelTreeSha256": model_descriptor["modelTreeSha256"],
                    "imageShape": IMAGE_SHAPE,
                    "seed": SEED,
                }
            ),
        },
        "configuration": {
            "tinyRecordCount": tiny_records,
            "maxSteps": max_steps,
            "learningRate": learning_rate,
            "seed": SEED,
            "repeatedSameBatch": True,
            "augmentation": False,
            "decoder": decoder,
            "heldOutVisibleToTrainingProcess": False,
            "heldOutPathArgumentProvided": False,
        },
        "training": {
            "expectedSteps": expected_steps,
            "stepsCompleted": steps_completed,
            "nonfiniteLossSteps": nonfinite_loss_steps,
            "nonfiniteParameterSteps": nonfinite_parameter_steps,
            "lossFirst": round(losses[0], 9) if losses else None,
            "lossLast": round(losses[-1], 9) if losses else None,
            "lossMin": round(min(losses), 9) if losses else None,
            "lossMax": round(max(losses), 9) if losses else None,
            "maxGradientAbs": round(max_gradient_abs, 9),
            "stability": "PASSED" if stable else "FAILED",
            "stepTrace": step_trace,
        },
        "checkpoint": {
            "path": str(checkpoint_path.resolve()) if checkpoint_exists else None,
            "sha256": checkpoint_sha,
            "parameterSha256BeforeReload": tuned_parameter_sha_before_reload,
            "parameterSha256LoadedState": tuned_parameter_sha_loaded_state,
            "parameterSha256AfterReload": tuned_parameter_sha_after_reload,
            "savedAndLoaded": checkpoint_exists and output_roundtrip_pass,
        },
        "baseEvaluation": {
            "parameterSha256": base_parameter_sha,
            "metrics": base_decoded["metrics"],
            "reproducibility": base_decoded["reproducibility"],
            "outputSha256": base_decoded["outputSha256"],
            "records": base_decoded["records"],
        },
        "tunedEvaluation": {
            "metrics": tuned_decoded["metrics"],
            "reproducibility": tuned_decoded["reproducibility"],
            "outputSha256": tuned_decoded["outputSha256"],
            "records": tuned_decoded["records"],
        },
        "tunedCheckpointRoundTrip": {
            "metrics": tuned_roundtrip_decoded["metrics"],
            "reproducibility": tuned_roundtrip_decoded["reproducibility"],
            "outputSha256": tuned_roundtrip_decoded["outputSha256"],
            "records": tuned_roundtrip_decoded["records"],
            "pass": output_roundtrip_pass,
        },
        "sanityGate": {
            "status": "PASSED" if overfit_pass else "FAILED",
            "lossDecreased": loss_decreased,
            "accuracySignal": accuracy_signal,
            "checkpointRoundTrip": output_roundtrip_pass,
            "noNonfinite": nonfinite_loss_steps == 0 and nonfinite_parameter_steps == 0,
        },
        "resources": resources,
        "boundaries": common_boundaries(),
        "evidenceRefs": [
            "tools/ocr/chi_know_po_medium_rec_preflight.py",
            "tools/ocr/chi_know_po_medium_rec_finetune_trial.py",
        ],
    }
    write_json(output_path, result)
    return result


def resource_gate_for_runs(runs: Sequence[Mapping[str, Any]]) -> tuple[bool, list[str]]:
    reasons: list[str] = []
    for run in runs:
        phase = run.get("phase")
        resources = run.get("resources", {})
        peak = resources.get("peakRssMiB")
        if not isinstance(peak, (int, float)) or peak > RESOURCE_LIMITS["peakRssMiBMax"]:
            reasons.append(f"peak_rss_over_limit:{phase}")
        wall = resources.get("wallTimeMs")
        if not isinstance(wall, (int, float)) or wall > RESOURCE_LIMITS["phaseWallTimeMsMax"]:
            reasons.append(f"phase_wall_time_over_limit:{phase}")
        before = resources.get("swapBefore", {})
        after = resources.get("swapAfter", {})
        if before.get("status") != "OBSERVED" or after.get("status") != "OBSERVED":
            reasons.append(f"swap_unknown:{phase}")
        elif float(after["usedMiB"]) - float(before["usedMiB"]) > RESOURCE_LIMITS["swapDeltaMiBMax"]:
            reasons.append(f"swap_delta_over_limit:{phase}")
    return not reasons, sorted(set(reasons))


def run_child(
    script_path: Path,
    mode: str,
    args: Mapping[str, Any],
    output_path: Path,
    timeout_seconds: int,
) -> dict[str, Any]:
    command = [sys.executable, str(script_path), "--mode", mode, "--output", str(output_path)]
    for key, value in args.items():
        if value is None:
            continue
        option = f"--{key.replace('_', '-')}"
        command.extend([option, str(value)])
    environment = os.environ.copy()
    environment.update(
        {
            "PADDLE_PDX_CACHE_HOME": environment.get("PADDLE_PDX_CACHE_HOME", "/private/tmp/chi-know-po-preflight-paddlex-cache"),
            "HF_HUB_OFFLINE": "1",
            "TRANSFORMERS_OFFLINE": "1",
            "HF_DATASETS_OFFLINE": "1",
            "HF_HUB_DISABLE_XET": "1",
            "FLAGS_paddle_num_threads": "1",
            "FLAGS_cpu_deterministic": "1",
            "OMP_NUM_THREADS": "1",
            "MKL_NUM_THREADS": "1",
            "VECLIB_MAXIMUM_THREADS": "1",
            "TOKENIZERS_PARALLELISM": "false",
        }
    )
    started = time.perf_counter()
    try:
        completed = subprocess.run(
            command,
            check=False,
            capture_output=True,
            text=True,
            cwd=str(script_path.parents[2]),
            env=environment,
            timeout=timeout_seconds,
        )
    except subprocess.TimeoutExpired:
        return {
            "schema": RUN_SCHEMA,
            "status": "FAILED",
            "phase": mode,
            "error": "child_timeout",
            "commandSha256": sha256_json(command),
        }
    duration_ms = (time.perf_counter() - started) * 1000.0
    if not output_path.is_file():
        return {
            "schema": RUN_SCHEMA,
            "status": "FAILED",
            "phase": mode,
            "error": "child_failed_or_output_missing",
            "returnCode": completed.returncode,
            "commandSha256": sha256_json(command),
            "durationMs": round(duration_ms, 3),
            "stdoutSha256": sha256_text(completed.stdout),
            "stderrSha256": sha256_text(completed.stderr),
            "stderrTail": completed.stderr[-2000:],
        }
    result = read_json(output_path)
    result["_launcher"] = {
        "commandSha256": sha256_json(command),
        "returnCode": completed.returncode,
        "durationMs": round(duration_ms, 3),
        "stdoutSha256": sha256_text(completed.stdout),
        "stderrSha256": sha256_text(completed.stderr),
    }
    write_json(output_path, result)
    return result


def preflight(
    script_path: Path,
    model_dir: Path,
    train_parquet: Path,
    output_dir: Path,
    tiny_records: int,
    tiny_steps: int,
    learning_rate: float,
    timeout_seconds: int,
) -> dict[str, Any]:
    if tiny_records < 1 or tiny_records > MAX_TINY_RECORDS:
        raise RuntimeError("tiny_records_cap_exceeded")
    if tiny_steps < 1 or tiny_steps > MAX_TINY_STEPS:
        raise RuntimeError("tiny_steps_cap_exceeded")
    runner = load_trial_runner()
    train_input = verify_train_input(runner, train_parquet)
    output_dir = output_dir.resolve()
    existing = list(output_dir.iterdir()) if output_dir.exists() else []
    if any(path.name != "hf-disposable-job-spec.json" for path in existing):
        raise RuntimeError("output_dir_must_be_empty_for_preflight")
    output_dir.mkdir(parents=True, exist_ok=True)
    runs_dir = output_dir / "runs"
    runs_dir.mkdir()
    zero_output = runs_dir / "zero-step-checkpoint-round-trip.json"
    zero_checkpoint = runs_dir / "zero-step-checkpoint" / "model_state.pdparams"
    zero_run = run_child(
        script_path,
        "zero-step",
        {
            "model-dir": model_dir,
            "train-parquet": train_parquet,
            "checkpoint-path": zero_checkpoint,
            "tiny-records": tiny_records,
        },
        zero_output,
        timeout_seconds,
    )
    tiny_output = runs_dir / "tiny-overfit-sanity.json"
    tiny_checkpoint = runs_dir / "tiny-overfit-checkpoint" / "model_state.pdparams"
    tiny_run = run_child(
        script_path,
        "tiny-overfit",
        {
            "model-dir": model_dir,
            "train-parquet": train_parquet,
            "checkpoint-path": tiny_checkpoint,
            "tiny-records": tiny_records,
            "tiny-steps": tiny_steps,
            "learning-rate": learning_rate,
        },
        tiny_output,
        timeout_seconds,
    )
    runs = [zero_run, tiny_run]
    zero_pass = zero_run.get("status") == "PASSED" and zero_run.get("decoderRoundTrip", {}).get("pass") is True
    tiny_pass = tiny_run.get("status") == "PASSED" and tiny_run.get("sanityGate", {}).get("status") == "PASSED"
    functional_pass = zero_pass and tiny_pass
    resource_pass, resource_reasons = resource_gate_for_runs(runs)
    if functional_pass and resource_pass:
        status = "PASSED"
        decision = "PRE_TUNING_SANITY_PASSED"
    elif functional_pass:
        status = "FUNCTIONAL_PASS_RESOURCE_BLOCKED"
        decision = "PRE_TUNING_FUNCTIONAL_PASS_LOCAL_RESOURCE_BLOCKED"
    else:
        status = "FAILED"
        decision = "PRE_TUNING_SANITY_FAILED"
    model = zero_run.get("candidate", {}).get("model") or tiny_run.get("candidate", {}).get("model") or {
        "modelId": MODEL_ID,
        "revision": MODEL_REVISION,
        "weightsSha256": MODEL_WEIGHTS_SHA256,
    }
    trial = {
        "schema": SCHEMA,
        "status": status,
        "decision": decision,
        "trialId": "chi-know-po-ppocrv6-medium-rec-preflight-train-only-2026-09-03",
        "candidate": {
            "workerId": "pp-ocrv6-medium-rec",
            "component": "rec",
            "model": model,
        },
        "input": train_input,
        "protocol": {
            "trainOnly": True,
            "documentCount": 10,
            "documentIds": list(TRAIN_DOCUMENT_IDS),
            "selectionCapPerDocument": 1,
            "tinyRecordCount": tiny_records,
            "tinyOverfitSteps": tiny_steps,
            "learningRate": learning_rate,
            "seed": SEED,
            "zeroOptimizerSteps": 0,
            "fullFineTuningExecuted": False,
            "heldOutAccessed": False,
            "frozenDomainGoldAccessed": False,
        },
        "runs": {
            "zeroStepCheckpointRoundTrip": zero_run,
            "tinyOverfitSanity": tiny_run,
        },
        "gates": {
            "zeroStepCheckpointRoundTrip": {
                "status": "PASSED" if zero_pass else "FAILED",
                "parameterDigestPreserved": zero_run.get("checkpoint", {}).get("parameterSha256BeforeSave")
                == zero_run.get("checkpoint", {}).get("parameterSha256AfterLoad"),
                "decoderOutputPreserved": zero_run.get("decoderRoundTrip", {}).get("pass") is True,
            },
            "tinyOverfitSanity": {
                "status": "PASSED" if tiny_pass else "FAILED",
                "lossDecreased": tiny_run.get("sanityGate", {}).get("lossDecreased") is True,
                "accuracySignal": tiny_run.get("sanityGate", {}).get("accuracySignal") is True,
                "checkpointRoundTrip": tiny_run.get("sanityGate", {}).get("checkpointRoundTrip") is True,
                "trainingFinite": tiny_run.get("sanityGate", {}).get("noNonfinite") is True,
            },
            "functional": "PASSED" if functional_pass else "FAILED",
        },
        "resourceGate": {
            "status": "PASSED" if resource_pass else "UNKNOWN_OR_FAILED",
            "pass": resource_pass,
            "reasons": resource_reasons,
            "limits": RESOURCE_LIMITS,
        },
        "promotion": {
            "fullFineTuning": "BLOCKED_PENDING_CAUSE_CONFIRMATION",
            "nextFineTuningGate": "NOT_OPEN",
            "hfDisposableDesign": "DESIGNED_NOT_SUBMITTED",
            "automaticPromotion": False,
            "operatorReviewRequired": True,
            "activation": "SEPARATE_DECISION_REQUIRED",
        },
        "boundaries": {
            **common_boundaries(),
            "detectionExtension": "DEFERRED",
            "fallbackPolicy": "none",
            "fullFineTuning": "blocked_until_cause_confirmed",
        },
        "evidenceRefs": [
            "tools/ocr/chi_know_po_medium_rec_preflight.py",
            "src/ocr/chiKnowPoMediumRecPreflight.js",
            "docs/historical-ocr-chi-know-po-medium-rec-preflight-v1.md",
            "artifacts/historical-ocr-chi-know-po-medium-rec-preflight/hf-disposable-job-spec.json",
        ],
        "outputDir": str(output_dir),
    }
    trial["contentSha256"] = sha256_json({**trial, "contentSha256": None})
    write_json(output_dir / "preflight.json", trial)
    return trial


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--mode", choices=["preflight", "zero-step", "tiny-overfit"], required=True)
    parser.add_argument("--model-dir", type=Path)
    parser.add_argument("--train-parquet", type=Path)
    parser.add_argument("--output-dir", type=Path)
    parser.add_argument("--checkpoint-path", type=Path)
    parser.add_argument("--output", type=Path)
    parser.add_argument("--tiny-records", type=int, default=DEFAULT_TINY_RECORDS)
    parser.add_argument("--tiny-steps", type=int, default=DEFAULT_TINY_STEPS)
    parser.add_argument("--learning-rate", type=float, default=DEFAULT_LEARNING_RATE)
    parser.add_argument("--timeout-seconds", type=int, default=600)
    return parser.parse_args()


def required_path(args: argparse.Namespace, name: str) -> Path:
    value = getattr(args, name)
    if value is None:
        raise RuntimeError(f"missing_argument:{name}")
    return value


def main() -> int:
    args = parse_args()
    script_path = Path(__file__).resolve()
    if args.mode == "preflight":
        result = preflight(
            script_path,
            required_path(args, "model_dir"),
            required_path(args, "train_parquet"),
            required_path(args, "output_dir"),
            args.tiny_records,
            args.tiny_steps,
            args.learning_rate,
            args.timeout_seconds,
        )
        print(
            json.dumps(
                {
                    "status": result["status"],
                    "decision": result["decision"],
                    "output": str((Path(result["outputDir"]) / "preflight.json").resolve()),
                },
                ensure_ascii=False,
                sort_keys=True,
            )
        )
        return 0

    runner = load_trial_runner()
    model_dir = required_path(args, "model_dir")
    train_parquet = required_path(args, "train_parquet")
    output = required_path(args, "output")
    checkpoint_path = required_path(args, "checkpoint_path")
    if args.mode == "zero-step":
        result = zero_step(runner, model_dir, train_parquet, checkpoint_path, output, args.tiny_records)
    else:
        result = tiny_overfit(
            runner,
            model_dir,
            train_parquet,
            checkpoint_path,
            output,
            args.tiny_records,
            args.tiny_steps,
            args.learning_rate,
        )
    print(
        json.dumps(
            {
                "status": result["status"],
                "phase": result["phase"],
                "output": str(output.resolve()),
                "outputSha256": result.get("outputSha256"),
                "checkpointSha256": result.get("checkpoint", {}).get("sha256"),
            },
            ensure_ascii=False,
            sort_keys=True,
        )
    )
    return 0 if result["status"] == "PASSED" else 2


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (OSError, RuntimeError, ValueError, KeyError, json.JSONDecodeError) as exc:
        print(json.dumps({"status": "FAILED", "error": str(exc)}, ensure_ascii=False, sort_keys=True), file=sys.stderr)
        raise SystemExit(2)

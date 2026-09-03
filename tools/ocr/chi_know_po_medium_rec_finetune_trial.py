#!/usr/bin/env python3
"""Run a bounded, recognition-only PP-OCRv6 medium CHI-KNOW-PO trial.

The experiment deliberately has three process types:

* "base-eval" reads only the untouched-held-out parquet and evaluates the
  pinned base checkpoint.
* "train" reads only the train parquet, fits a fixed small sample from all
  ten train documents, and freezes a checkpoint.
* "tuned-eval" reads only the untouched-held-out parquet after the frozen
  checkpoint exists.

No frozen domain gold, detection model, provider, search, semantic correction,
or fallback is reachable from this script. Evidence retains hashes and
metrics, not transcription or prediction text.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import math
import os
import platform
import random
import re
import resource
import subprocess
import sys
import time
import unicodedata
from collections import Counter, defaultdict
from io import BytesIO
from pathlib import Path
from typing import Any, Iterable, Mapping, Sequence


SCHEMA = "chi-know-po-ppocrv6-medium-rec-finetuning-trial-v1"
RUN_SCHEMA = "chi-know-po-ppocrv6-medium-rec-finetuning-run-v1"
CORPUS_ID = "CHI-KNOW-PO"
MODEL_ID = "PaddlePaddle/PP-OCRv6_medium_rec_safetensors"
MODEL_REVISION = "024cad6a831de75c2c3c26e711ba8c4a82ccd24b"
MODEL_WEIGHTS_SHA256 = "5f43c16f2a684b1d2284662178bdb604febd3d6bfdb5ca73828d08d0f7c0c3e9"
MODEL_REQUIRED_FILES = ("config.json", "preprocessor_config.json", "model.safetensors")
SEED = 7
IMAGE_SHAPE = (3, 48, 320)
OUTPUT_WIDTH_STRIDE = 8
DEFAULT_TRAIN_CAP_PER_DOC = 64
DEFAULT_BATCH_SIZE = 8
DEFAULT_LEARNING_RATE = 0.0001
DEFAULT_EPOCHS = 1
DEFAULT_TIMEOUT_SECONDS = 900
RESOURCE_LIMITS = {
    # The bounded PaddleX fine-tuning process includes the converted model,
    # optimizer state, and CPU tensors. The local smoke trial measured about
    # 1.836 GiB peak RSS, so the inference-only 1 GiB ceiling is not applicable
    # to this training phase. Keep the limit bounded at 4 GiB for an M1 run.
    "peakRssMiBMax": 4096.0,
    "swapDeltaMiBMax": 256.0,
    "trainWallTimeMsMax": 900000.0,
}


def canonical_value(value: Any) -> Any:
    # Match JSON.stringify's representation for integral finite numbers so
    # Python-produced content hashes remain verifiable by the JS validator.
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


def tree_sha256(root: Path) -> str:
    digest = hashlib.sha256()
    root = root.resolve(strict=True)
    for path in sorted(candidate for candidate in root.rglob("*") if candidate.is_file()):
        if not path.resolve().is_relative_to(root):
            raise RuntimeError(f"bounded_path_escape:{path}")
        digest.update(str(path.relative_to(root)).encode("utf-8"))
        digest.update(b"\0")
        digest.update(path.read_bytes())
        digest.update(b"\0")
    return digest.hexdigest()


def read_json(path: Path) -> dict[str, Any]:
    value = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(value, dict):
        raise RuntimeError(f"json_object_required:{path}")
    return value


def write_json(path: Path, value: Mapping[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(canonical(value), encoding="utf-8")


def normalized_text(value: str) -> str:
    return unicodedata.normalize("NFC", value)


def record_id(row: Mapping[str, Any]) -> str:
    return f"{row['doc_id']}:{row['file_name']}"


def record_id_sha256(row: Mapping[str, Any]) -> str:
    return sha256_text(record_id(row))


def image_bytes(row: Mapping[str, Any]) -> bytes:
    if isinstance(row.get("imageBytes"), (bytes, bytearray)):
        return bytes(row["imageBytes"])
    image = row.get("image")
    if not isinstance(image, Mapping) or not isinstance(image.get("bytes"), (bytes, bytearray)):
        raise RuntimeError("image_bytes_missing")
    return bytes(image["bytes"])


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
        return {
            "status": "UNKNOWN",
            "reason": "swap_probe_nonzero",
            "stderrSha256": sha256_text(result.stderr),
        }
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


def import_runtime():
    os.environ.setdefault("PADDLE_PDX_CACHE_HOME", "/private/tmp/chi-know-po-finetune-paddlex-cache")
    os.environ.setdefault("HF_HUB_OFFLINE", "1")
    os.environ.setdefault("TRANSFORMERS_OFFLINE", "1")
    os.environ.setdefault("HF_DATASETS_OFFLINE", "1")
    os.environ.setdefault("HF_HUB_DISABLE_XET", "1")
    os.environ.setdefault("FLAGS_paddle_num_threads", "1")
    os.environ.setdefault("FLAGS_cpu_deterministic", "1")
    os.environ.setdefault("OMP_NUM_THREADS", "1")
    os.environ.setdefault("MKL_NUM_THREADS", "1")
    os.environ.setdefault("VECLIB_MAXIMUM_THREADS", "1")
    os.environ.setdefault("TOKENIZERS_PARALLELISM", "false")

    import numpy as np
    import paddle
    import paddle.nn.functional as F
    import pyarrow.parquet as pq
    from PIL import Image
    from paddlex.inference.models.text_recognition.modeling.pp_ocrv6_small_rec import (
        PPOCRV6SmallRec,
    )
    from paddlex.inference.models.text_recognition.processors import (
        OCRReisizeNormImg,
        ToBatch,
    )

    paddle.set_device("cpu")
    paddle.seed(SEED)
    np.random.seed(SEED)
    random.seed(SEED)
    return {
        "np": np,
        "paddle": paddle,
        "F": F,
        "pq": pq,
        "Image": Image,
        "PPOCRV6SmallRec": PPOCRV6SmallRec,
        "OCRReisizeNormImg": OCRReisizeNormImg,
        "ToBatch": ToBatch,
    }


def verify_model(model_dir: Path) -> dict[str, Any]:
    root = model_dir.resolve(strict=True)
    if not root.is_dir():
        raise RuntimeError("model_dir_not_directory")
    paths = {}
    for filename in MODEL_REQUIRED_FILES:
        path = root / filename
        if not path.is_file():
            raise RuntimeError(f"model_file_missing:{filename}")
        paths[filename] = path
    actual_weights_sha256 = sha256_file(paths["model.safetensors"])
    if actual_weights_sha256 != MODEL_WEIGHTS_SHA256:
        raise RuntimeError("model_weights_sha256_mismatch")
    config = read_json(paths["config.json"])
    if config.get("model_type") != "pp_ocrv6_small_rec":
        raise RuntimeError("model_config_type_mismatch")
    readme = root / "README.md"
    if not readme.is_file() or "apache-2.0" not in readme.read_text(encoding="utf-8").lower():
        raise RuntimeError("model_license_evidence_missing")
    preprocessor = read_json(paths["preprocessor_config.json"])
    character_list = preprocessor.get("character_list")
    if not isinstance(character_list, list) or len(character_list) != int(config["head_out_channels"]):
        raise RuntimeError("model_character_dictionary_mismatch")
    return {
        "modelId": MODEL_ID,
        "revision": MODEL_REVISION,
        "modelDir": str(root),
        "modelTreeSha256": tree_sha256(root),
        "files": {name: sha256_file(path) for name, path in sorted(paths.items())},
        "weightsSha256": actual_weights_sha256,
        "config": {
            "modelType": config.get("model_type"),
            "hiddenSize": config.get("hidden_size"),
            "headOutChannels": config.get("head_out_channels"),
        },
        "characterListSha256": sha256_json(character_list),
        "characterListLength": len(character_list),
        "license": "Apache-2.0",
        "licenseEvidence": "local model README.md at the pinned revision",
    }


def verify_split_root(split_root: Path, verify_held_out: bool = True) -> dict[str, Any]:
    root = split_root.resolve(strict=True)
    split = read_json(root / "document-split.json")
    leakage = read_json(root / "leakage-validation.json")
    if split.get("status") != "MATERIALIZED_AND_VALIDATED":
        raise RuntimeError("document_split_not_materialized_and_validated")
    if leakage.get("status") != "PASSED":
        raise RuntimeError("leakage_validation_not_passed")
    if leakage.get("corpusId") != CORPUS_ID or split.get("corpusId") != CORPUS_ID:
        raise RuntimeError("corpus_id_mismatch")
    if leakage.get("frozenDomainGoldAccessed") is not False:
        raise RuntimeError("frozen_domain_gold_boundary_changed")
    if leakage.get("fineTuning", {}).get("executed") is not False:
        raise RuntimeError("prior_fine_tuning_state_changed")
    route = leakage.get("routeBoundary", {})
    if route.get("BLOCK_OCR_ROUTE") is not True or route.get("OCRProvider", {}).get("enabled") is not False:
        raise RuntimeError("route_boundary_changed")
    if route.get("fallbackPolicy") != "none":
        raise RuntimeError("fallback_boundary_changed")
    train = split.get("partitions", {}).get("train", {})
    held_out = split.get("partitions", {}).get("untouched-held-out", {})
    train_ids = train.get("documentIds")
    held_out_ids = held_out.get("documentIds")
    if not isinstance(train_ids, list) or len(train_ids) != 10:
        raise RuntimeError("train_document_count_not_ten")
    if not isinstance(held_out_ids, list) or len(held_out_ids) != 3:
        raise RuntimeError("held_out_document_count_not_three")
    if train.get("eligibleForTraining") is not True or held_out.get("eligibleForTraining") is not False:
        raise RuntimeError("partition_training_boundary_invalid")
    if train.get("readOnlySnapshot") is not True or held_out.get("readOnlySnapshot") is not True:
        raise RuntimeError("partition_read_only_snapshot_missing")
    train_path = root / train["corpusPath"]
    held_out_path = root / held_out["corpusPath"]
    train_records = root / train["recordManifestPath"]
    held_out_records = root / held_out["recordManifestPath"]
    paths_to_verify = [train_path, train_records]
    if verify_held_out:
        paths_to_verify.extend([held_out_path, held_out_records])
    for path in paths_to_verify:
        if not path.is_file():
            raise RuntimeError(f"materialized_file_missing:{path.name}")
        if path.stat().st_mode & 0o222:
            raise RuntimeError(f"materialized_file_not_read_only:{path.name}")
    if sha256_file(train_path) != train.get("corpusSha256"):
        raise RuntimeError("train_parquet_sha256_mismatch")
    if sha256_file(train_records) != train.get("recordManifestSha256"):
        raise RuntimeError("train_record_manifest_sha256_mismatch")
    if verify_held_out:
        if sha256_file(held_out_path) != held_out.get("corpusSha256"):
            raise RuntimeError("held_out_parquet_sha256_mismatch")
        if sha256_file(held_out_records) != held_out.get("recordManifestSha256"):
            raise RuntimeError("held_out_record_manifest_sha256_mismatch")
    return {
        "splitRoot": str(root),
        "sourceRevision": split.get("sourceRevision"),
        "sourceManifestSha256": split.get("sourceManifestSha256"),
        "documentSplitSha256": sha256_file(root / "document-split.json"),
        "leakageValidationSha256": sha256_file(root / "leakage-validation.json"),
        "train": {
            "documentIds": list(train_ids),
            "corpusPath": str(train_path),
            "corpusSha256": train["corpusSha256"],
            "recordManifestPath": str(train_records),
            "recordManifestSha256": train["recordManifestSha256"],
            "recordCount": train.get("recordCount"),
        },
        "untouchedHeldOut": {
            "documentIds": list(held_out_ids),
            "corpusPath": str(held_out_path),
            "corpusSha256": held_out["corpusSha256"],
            "recordManifestPath": str(held_out_records),
            "recordManifestSha256": held_out["recordManifestSha256"],
            "recordCount": held_out.get("recordCount"),
        },
    }


def image_array(ctx: Mapping[str, Any], row: Mapping[str, Any]):
    np = ctx["np"]
    Image = ctx["Image"]
    with Image.open(BytesIO(image_bytes(row))) as image:
        return np.asarray(image.convert("RGB"), dtype=np.uint8).copy()


def ctc_minimum_timesteps(labels: Sequence[int]) -> int:
    repeated_adjacent = sum(left == right for left, right in zip(labels, labels[1:]))
    return len(labels) + repeated_adjacent


def preprocess_batch(ctx: Mapping[str, Any], rows: Sequence[Mapping[str, Any]]):
    np = ctx["np"]
    pre = ctx["OCRReisizeNormImg"](list(IMAGE_SHAPE))
    to_batch = ctx["ToBatch"]()
    images = [image_array(ctx, row) for row in rows]
    processed = pre(images)
    batch = to_batch(processed)[0]
    widths = [int(item.shape[2]) for item in processed]
    input_lengths = np.asarray(
        [max(1, int(math.ceil(width / OUTPUT_WIDTH_STRIDE))) for width in widths],
        dtype="int64",
    )
    return batch, widths, input_lengths


def iter_rows(ctx: Mapping[str, Any], parquet_path: Path, batch_size: int) -> Iterable[list[dict[str, Any]]]:
    parquet = ctx["pq"].ParquetFile(parquet_path)
    required_columns = ["doc_id", "file_name", "transcription", "image"]
    available = set(parquet.schema_arrow.names)
    if not set(required_columns).issubset(available):
        raise RuntimeError("parquet_schema_missing_recognition_columns")
    for batch in parquet.iter_batches(batch_size=batch_size, columns=required_columns):
        yield batch.to_pylist()


def load_character_index(model_dir: Path) -> tuple[list[str], dict[str, int]]:
    preprocessor = read_json(model_dir / "preprocessor_config.json")
    chars = preprocessor["character_list"]
    return chars, {char: index for index, char in enumerate(chars)}


def select_training_rows(
    ctx: Mapping[str, Any],
    parquet_path: Path,
    model_dir: Path,
    cap_per_doc: int,
) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    _, char_index = load_character_index(model_dir)
    selected_by_doc: dict[str, list[dict[str, Any]]] = defaultdict(list)
    total_by_doc: Counter[str] = Counter()
    encodable_by_doc: Counter[str] = Counter()
    dictionary_excluded_rows = 0
    dictionary_excluded_occurrences = 0
    ctc_excluded_rows = 0
    selected: list[dict[str, Any]] = []

    for rows in iter_rows(ctx, parquet_path, batch_size=256):
        for row in rows:
            doc_id = str(row["doc_id"])
            total_by_doc[doc_id] += 1
            text = normalized_text(str(row["transcription"]))
            unknown_occurrences = sum(1 for char in text if char not in char_index)
            if unknown_occurrences:
                dictionary_excluded_rows += 1
                dictionary_excluded_occurrences += unknown_occurrences
                continue
            labels = [char_index[char] for char in text]
            if not labels:
                ctc_excluded_rows += 1
                continue
            encodable_by_doc[doc_id] += 1
            if len(selected_by_doc[doc_id]) >= cap_per_doc:
                continue
            array = image_array(ctx, row)
            pre = ctx["OCRReisizeNormImg"](list(IMAGE_SHAPE))
            processed_width = int(pre([array])[0].shape[2])
            input_length = max(1, int(math.ceil(processed_width / OUTPUT_WIDTH_STRIDE)))
            if ctc_minimum_timesteps(labels) > input_length:
                ctc_excluded_rows += 1
                continue
            item = {
                "docId": doc_id,
                "recordIdSha256": record_id_sha256(row),
                "imageSha256": sha256_bytes(image_bytes(row)),
                "targetSha256": sha256_text(text),
                "targetLength": len(text),
                "labels": labels,
                "imageBytes": image_bytes(row),
                "processedWidth": processed_width,
            }
            selected_by_doc[doc_id].append(item)
            selected.append(item)

    if len(selected_by_doc) != 10 or any(len(selected_by_doc[doc_id]) != cap_per_doc for doc_id in selected_by_doc):
        raise RuntimeError("train_selection_did_not_cover_ten_documents")
    selected.sort(key=lambda item: (item["processedWidth"], item["docId"], item["recordIdSha256"]))
    selection_digests = [
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
        "method": "first_encodable_records_per_document_v1",
        "capPerDocument": cap_per_doc,
        "documentIds": sorted(selected_by_doc),
        "selectedRecordCount": len(selected),
        "selectedRecordsSha256": sha256_json(selection_digests),
        "selectedRecords": selection_digests,
        "totalRowsByDocument": dict(sorted(total_by_doc.items())),
        "encodableRowsByDocument": dict(sorted(encodable_by_doc.items())),
        "dictionaryExcludedRows": dictionary_excluded_rows,
        "dictionaryExcludedCharacterOccurrences": dictionary_excluded_occurrences,
        "ctcExcludedRows": ctc_excluded_rows,
        "rawTextRetained": False,
        "semanticCorrection": False,
    }


def load_model(ctx: Mapping[str, Any], model_dir: Path):
    return ctx["PPOCRV6SmallRec"].from_pretrained(str(model_dir), convert_from_hf=True)


def label_batch(ctx: Mapping[str, Any], rows: Sequence[Mapping[str, Any]]):
    np = ctx["np"]
    labels = [row["labels"] for row in rows]
    max_length = max(len(label) for label in labels)
    padded = np.zeros((len(labels), max_length), dtype="int32")
    for index, label in enumerate(labels):
        padded[index, : len(label)] = label
    lengths = np.asarray([len(label) for label in labels], dtype="int64")
    return padded, lengths


def model_logits(ctx: Mapping[str, Any], model, batch):
    paddle = ctx["paddle"]
    features = model.model(paddle.to_tensor(batch))
    encoded = model.head.encoder(features)
    return model.head.head(encoded)


def finite_scalar(value: Any) -> float:
    return float(value.numpy().item() if hasattr(value, "numpy") else value)


def train_one(
    ctx: Mapping[str, Any],
    model_dir: Path,
    train_parquet: Path,
    checkpoint_path: Path,
    output_path: Path,
    repeat: int,
    cap_per_doc: int,
    batch_size: int,
    learning_rate: float,
    epochs: int,
    split_descriptor: Mapping[str, Any],
) -> dict[str, Any]:
    model_descriptor = verify_model(model_dir)
    selected, selection = select_training_rows(ctx, train_parquet, model_dir, cap_per_doc)
    paddle = ctx["paddle"]
    F = ctx["F"]
    model = load_model(ctx, model_dir)
    model.train()
    optimizer = paddle.optimizer.Adam(learning_rate=learning_rate, parameters=model.parameters())
    swap_before = swap_usage()
    cpu_before = resource.getrusage(resource.RUSAGE_SELF)
    process_started = time.perf_counter()
    losses: list[float] = []
    max_gradient_abs = 0.0
    nonfinite_loss_steps = 0
    nonfinite_parameter_steps = 0
    steps_completed = 0
    expected_steps = math.ceil(len(selected) / batch_size) * epochs
    epoch_steps: list[dict[str, Any]] = []

    for epoch in range(epochs):
        epoch_started = time.perf_counter()
        for start in range(0, len(selected), batch_size):
            batch_rows = selected[start : start + batch_size]
            batch, _, input_lengths = preprocess_batch(ctx, batch_rows)
            labels, label_lengths = label_batch(ctx, batch_rows)
            logits = model_logits(ctx, model, batch)
            actual_time = int(logits.shape[1])
            input_lengths = ctx["np"].minimum(input_lengths, actual_time).astype("int64")
            loss = F.ctc_loss(
                paddle.transpose(logits, [1, 0, 2]),
                paddle.to_tensor(labels),
                paddle.to_tensor(input_lengths),
                paddle.to_tensor(label_lengths),
                blank=0,
                reduction="mean",
                norm_by_times=False,
                zero_infinity=True,
            )
            loss_value = finite_scalar(loss)
            if not math.isfinite(loss_value):
                nonfinite_loss_steps += 1
                break
            loss.backward()
            step_gradient_abs = 0.0
            parameters_finite = True
            for parameter in model.parameters():
                gradient = parameter.grad
                if gradient is None:
                    continue
                gradient_max = finite_scalar(paddle.max(paddle.abs(gradient)))
                if not math.isfinite(gradient_max):
                    parameters_finite = False
                step_gradient_abs = max(step_gradient_abs, gradient_max)
            max_gradient_abs = max(max_gradient_abs, step_gradient_abs)
            optimizer.step()
            optimizer.clear_grad()
            parameter_finite = all(
                bool(paddle.all(paddle.isfinite(parameter)).numpy().item())
                for parameter in model.parameters()
            )
            if not parameters_finite or not parameter_finite:
                nonfinite_parameter_steps += 1
                break
            losses.append(loss_value)
            steps_completed += 1
            epoch_steps.append(
                {
                    "epoch": epoch + 1,
                    "step": steps_completed,
                    "loss": round(loss_value, 9),
                    "gradientMaxAbs": round(step_gradient_abs, 9),
                    "batchSize": len(batch_rows),
                    "inputTimeSteps": actual_time,
                }
            )
        if epoch_steps:
            epoch_steps[-1]["epochWallTimeMs"] = round((time.perf_counter() - epoch_started) * 1000.0, 3)
        if nonfinite_loss_steps or nonfinite_parameter_steps:
            break

    training_wall_time_ms = (time.perf_counter() - process_started) * 1000.0
    cpu_after = resource.getrusage(resource.RUSAGE_SELF)
    swap_after = swap_usage()
    checkpoint_path.parent.mkdir(parents=True, exist_ok=True)
    if nonfinite_loss_steps == 0 and nonfinite_parameter_steps == 0 and steps_completed == expected_steps:
        paddle.save(model.state_dict(), str(checkpoint_path))
    checkpoint_exists = checkpoint_path.is_file()
    checkpoint_sha = sha256_file(checkpoint_path) if checkpoint_exists else None
    resources = {
        "peakRssMiB": round(peak_rss_mib(), 3),
        "wallTimeMs": round(training_wall_time_ms, 3),
        "cpuSeconds": round(cpu_seconds(cpu_before, cpu_after), 6),
        "swapBefore": swap_before,
        "swapAfter": swap_after,
        "limits": RESOURCE_LIMITS,
    }
    stable = (
        nonfinite_loss_steps == 0
        and nonfinite_parameter_steps == 0
        and steps_completed == expected_steps
        and checkpoint_exists
    )
    result: dict[str, Any] = {
        "schema": RUN_SCHEMA,
        "status": "PASSED" if stable else "FAILED",
        "phase": "train",
        "repeat": repeat,
        "candidate": {
            "workerId": "pp-ocrv6-medium-rec",
            "component": "rec",
            "model": model_descriptor,
            "loader": "PaddleX PPOCRV6SmallRec.from_pretrained(convert_from_hf=True)",
        },
        "input": {
            "corpusId": CORPUS_ID,
            "partition": "train",
            "parquetPath": str(train_parquet.resolve()),
            "parquetSha256": sha256_file(train_parquet),
            "documentIds": list(split_descriptor["train"]["documentIds"]),
            "documentCount": 10,
            "selection": selection,
            "inputSha256": sha256_json(
                {
                    "parquetSha256": sha256_file(train_parquet),
                    "documentIds": split_descriptor["train"]["documentIds"],
                    "selectionSha256": selection["selectedRecordsSha256"],
                    "modelTreeSha256": model_descriptor["modelTreeSha256"],
                    "imageShape": IMAGE_SHAPE,
                    "seed": SEED,
                }
            ),
        },
        "configuration": {
            "seed": SEED,
            "batchSize": batch_size,
            "learningRate": learning_rate,
            "epochs": epochs,
            "maxSelectedRecordsPerDocument": cap_per_doc,
            "augmentation": False,
            "semanticCorrection": False,
            "normalization": "NFC_only",
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
            "epochSteps": epoch_steps,
            "stability": "PASSED" if stable else "FAILED",
        },
        "checkpoint": {
            "path": str(checkpoint_path.resolve()) if checkpoint_exists else None,
            "sha256": checkpoint_sha,
            "frozenBeforeHeldOutEvaluation": False,
            "stateDictSaved": checkpoint_exists,
        },
        "runtime": runtime_descriptor(str(paddle.__version__)),
        "resources": resources,
        "boundaries": {
            "frozenDomainGoldAccessed": False,
            "search": False,
            "historicalSourceJudgment": False,
            "semanticCorrection": False,
            "silentFallback": False,
            "detectionTouched": False,
            "activation": False,
            "BLOCK_OCR_ROUTE": True,
            "OCRProvider": {"enabled": False},
            "rawTextRetained": False,
            "rawImagesRetained": False,
            "networkAccess": False,
        },
        "evidenceRefs": [
            "tools/ocr/chi_know_po_medium_rec_finetune_trial.py",
            "artifacts/historical-ocr-chi-know-po-corpus-v1/document-split.json",
            "artifacts/historical-ocr-chi-know-po-corpus-v1/leakage-validation.json",
        ],
    }
    write_json(output_path, result)
    return result


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


def decode_ctc(probabilities, chars: Sequence[str], input_length: int) -> tuple[str, float]:
    np_indices = probabilities[:input_length].argmax(axis=1)
    np_scores = probabilities[:input_length].max(axis=1)
    output: list[str] = []
    selected_scores: list[float] = []
    previous = None
    for index, score in zip(np_indices.tolist(), np_scores.tolist()):
        if index != 0 and index != previous:
            output.append(chars[index])
            selected_scores.append(float(score))
        previous = index
    return "".join(output), (sum(selected_scores) / len(selected_scores) if selected_scores else 0.0)


def evaluate_one(
    ctx: Mapping[str, Any],
    model_dir: Path,
    held_out_parquet: Path,
    output_path: Path,
    repeat: int,
    checkpoint_path: Path | None,
    split_descriptor: Mapping[str, Any],
    batch_size: int,
) -> dict[str, Any]:
    model_descriptor = verify_model(model_dir)
    chars, _ = load_character_index(model_dir)
    paddle = ctx["paddle"]
    load_started = time.perf_counter()
    model = load_model(ctx, model_dir)
    checkpoint_descriptor: dict[str, Any] = {
        "path": None,
        "sha256": None,
        "loaded": False,
        "frozenBeforeEvaluation": True,
    }
    if checkpoint_path is not None:
        checkpoint_path = checkpoint_path.resolve(strict=True)
        state = paddle.load(str(checkpoint_path))
        model.set_state_dict(state)
        checkpoint_descriptor = {
            "path": str(checkpoint_path),
            "sha256": sha256_file(checkpoint_path),
            "loaded": True,
            "frozenBeforeEvaluation": True,
        }
    load_time_ms = (time.perf_counter() - load_started) * 1000.0
    model.eval()
    swap_before = swap_usage()
    cpu_before = resource.getrusage(resource.RUSAGE_SELF)
    process_started = time.perf_counter()
    records: list[dict[str, Any]] = []
    total_edit_distance = 0
    total_target_length = 0
    exact_count = 0
    confidence_values: list[float] = []
    batch_latencies: list[float] = []
    unknown_dictionary_rows = 0
    unknown_dictionary_occurrences = 0
    per_doc: dict[str, dict[str, Any]] = defaultdict(
        lambda: {"recordCount": 0, "exactMatchRuns": 0, "editDistance": 0, "targetCharacters": 0}
    )
    evaluation_started = time.perf_counter()

    for rows in iter_rows(ctx, held_out_parquet, batch_size=batch_size):
        indexed_rows = list(enumerate(rows))
        indexed_rows.sort(key=lambda pair: (len(image_bytes(pair[1])), pair[0]))
        sorted_rows = [pair[1] for pair in indexed_rows]
        batch, _, input_lengths = preprocess_batch(ctx, sorted_rows)
        started = time.perf_counter()
        with paddle.no_grad():
            logits = model_logits(ctx, model, batch)
            probabilities = paddle.nn.functional.softmax(logits, axis=2).numpy()
        batch_ms = (time.perf_counter() - started) * 1000.0
        batch_latencies.append(batch_ms)
        actual_time = int(probabilities.shape[1])
        input_lengths = ctx["np"].minimum(input_lengths, actual_time)
        sorted_results: list[dict[str, Any]] = []
        for index, row in enumerate(sorted_rows):
            target = normalized_text(str(row["transcription"]))
            unknown_occurrences = sum(1 for char in target if char not in chars)
            unknown_dictionary_occurrences += unknown_occurrences
            unknown_dictionary_rows += int(unknown_occurrences > 0)
            prediction, confidence = decode_ctc(probabilities[index], chars, int(input_lengths[index]))
            distance = levenshtein(prediction, target)
            exact = prediction == target
            target_length = len(target)
            record = {
                "recordIdSha256": record_id_sha256(row),
                "docId": str(row["doc_id"]),
                "targetTextSha256": sha256_text(target),
                "targetTextLength": target_length,
                "predictionTextSha256": sha256_text(prediction),
                "predictionTextLength": len(prediction),
                "exactMatch": exact,
                "editDistance": distance,
                "characterErrorRate": distance / target_length if target_length else None,
                "confidence": round(float(confidence), 9),
                "confidencePresent": math.isfinite(float(confidence)),
                "batchLatencyMs": round(batch_ms, 3),
            }
            sorted_results.append(record)
            total_edit_distance += distance
            total_target_length += target_length
            exact_count += int(exact)
            confidence_values.append(float(confidence))
            doc = per_doc[str(row["doc_id"])]
            doc["recordCount"] += 1
            doc["exactMatchRuns"] += int(exact)
            doc["editDistance"] += distance
            doc["targetCharacters"] += target_length
        for original_index, record in zip((pair[0] for pair in indexed_rows), sorted_results):
            record["sourceOrder"] = original_index
            records.append(record)

    records.sort(key=lambda record: (record["sourceOrder"], record["recordIdSha256"]))
    inference_wall_time_ms = (time.perf_counter() - evaluation_started) * 1000.0
    process_wall_time_ms = (time.perf_counter() - process_started) * 1000.0
    cpu_after = resource.getrusage(resource.RUSAGE_SELF)
    swap_after = swap_usage()
    output_digests = [
        {
            key: record[key]
            for key in (
                "recordIdSha256",
                "docId",
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
    output_sha256 = sha256_json(
        {
            "partition": "untouched-held-out",
            "checkpointSha256": checkpoint_descriptor["sha256"],
            "records": output_digests,
        }
    )
    exact_rate = exact_count / len(records) if records else None
    cer = total_edit_distance / total_target_length if total_target_length else None
    metrics = {
        "recordCount": len(records),
        "exactMatchRuns": exact_count,
        "exactMatchRate": exact_rate,
        "characterErrorRate": cer,
        "totalEditDistance": total_edit_distance,
        "totalTargetCharacters": total_target_length,
        "confidencePresentRuns": sum(math.isfinite(value) for value in confidence_values),
        "confidenceMean": sum(confidence_values) / len(confidence_values) if confidence_values else None,
        "confidenceMin": min(confidence_values) if confidence_values else None,
        "confidenceMax": max(confidence_values) if confidence_values else None,
        "unknownDictionaryRows": unknown_dictionary_rows,
        "unknownDictionaryCharacterOccurrences": unknown_dictionary_occurrences,
    }
    doc_metrics = {}
    for doc_id, value in sorted(per_doc.items()):
        doc_metrics[doc_id] = {
            **value,
            "exactMatchRate": value["exactMatchRuns"] / value["recordCount"] if value["recordCount"] else None,
            "characterErrorRate": value["editDistance"] / value["targetCharacters"] if value["targetCharacters"] else None,
        }
    resources = {
        "peakRssMiB": round(peak_rss_mib(), 3),
        "wallTimeMs": round(process_wall_time_ms, 3),
        "inferenceWallTimeMs": round(inference_wall_time_ms, 3),
        "loadTimeMs": round(load_time_ms, 3),
        "batchCount": len(batch_latencies),
        "batchLatencyMeanMs": round(sum(batch_latencies) / len(batch_latencies), 3) if batch_latencies else None,
        "batchLatencyMinMs": round(min(batch_latencies), 3) if batch_latencies else None,
        "batchLatencyMaxMs": round(max(batch_latencies), 3) if batch_latencies else None,
        "equivalentPerRecordInferenceMs": round(inference_wall_time_ms / len(records), 3) if records else None,
        "cpuSeconds": round(cpu_seconds(cpu_before, cpu_after), 6),
        "swapBefore": swap_before,
        "swapAfter": swap_after,
        "limits": RESOURCE_LIMITS,
    }
    result: dict[str, Any] = {
        "schema": RUN_SCHEMA,
        "status": "PASSED",
        "phase": "tuned-eval" if checkpoint_path is not None else "base-eval",
        "repeat": repeat,
        "candidate": {
            "workerId": "pp-ocrv6-medium-rec",
            "component": "rec",
            "model": model_descriptor,
            "loader": "PaddleX PPOCRV6SmallRec.from_pretrained(convert_from_hf=True)",
        },
        "input": {
            "corpusId": CORPUS_ID,
            "partition": "untouched-held-out",
            "parquetPath": str(held_out_parquet.resolve()),
            "parquetSha256": sha256_file(held_out_parquet),
            "documentIds": list(split_descriptor["untouchedHeldOut"]["documentIds"]),
            "documentCount": 3,
            "recordCountExpected": split_descriptor["untouchedHeldOut"]["recordCount"],
            "inputSha256": sha256_json(
                {
                    "parquetSha256": sha256_file(held_out_parquet),
                    "documentIds": split_descriptor["untouchedHeldOut"]["documentIds"],
                    "modelTreeSha256": model_descriptor["modelTreeSha256"],
                    "checkpointSha256": checkpoint_descriptor["sha256"],
                    "imageShape": IMAGE_SHAPE,
                }
            ),
        },
        "checkpoint": checkpoint_descriptor,
        "metrics": metrics,
        "perDocumentMetrics": doc_metrics,
        "reproducibility": {
            "outputSha256": output_sha256,
            "rawPredictionTextRetained": False,
            "rawImagesRetained": False,
        },
        "runtime": runtime_descriptor(str(paddle.__version__)),
        "resources": resources,
        "boundaries": {
            "frozenDomainGoldAccessed": False,
            "search": False,
            "historicalSourceJudgment": False,
            "semanticCorrection": False,
            "silentFallback": False,
            "detectionTouched": False,
            "activation": False,
            "BLOCK_OCR_ROUTE": True,
            "OCRProvider": {"enabled": False},
            "networkAccess": False,
        },
        "records": records,
        "outputSha256": output_sha256,
        "evidenceRefs": [
            "tools/ocr/chi_know_po_medium_rec_finetune_trial.py",
            "artifacts/historical-ocr-chi-know-po-corpus-v1/document-split.json",
            "artifacts/historical-ocr-chi-know-po-corpus-v1/leakage-validation.json",
        ],
    }
    write_json(output_path, result)
    return result


def resource_gate_for_runs(runs: Sequence[Mapping[str, Any]]) -> tuple[bool, list[str]]:
    reasons: list[str] = []
    for run in runs:
        resources = run.get("resources", {})
        peak = resources.get("peakRssMiB")
        if not isinstance(peak, (int, float)) or peak > RESOURCE_LIMITS["peakRssMiBMax"]:
            reasons.append(f"peak_rss_over_limit:{run.get('phase')}:{run.get('repeat')}")
        if run.get("phase") == "train" and resources.get("wallTimeMs", float("inf")) > RESOURCE_LIMITS["trainWallTimeMsMax"]:
            reasons.append(f"train_wall_time_over_limit:{run.get('repeat')}")
        for key in ("swapBefore", "swapAfter"):
            swap = resources.get(key, {})
            if swap.get("status") != "OBSERVED":
                reasons.append(f"swap_{key}_unknown:{run.get('phase')}:{run.get('repeat')}")
        before = resources.get("swapBefore", {})
        after = resources.get("swapAfter", {})
        if before.get("status") == "OBSERVED" and after.get("status") == "OBSERVED":
            delta = float(after["usedMiB"]) - float(before["usedMiB"])
            if delta > RESOURCE_LIMITS["swapDeltaMiBMax"]:
                reasons.append(f"swap_delta_over_limit:{run.get('phase')}:{run.get('repeat')}")
    return not reasons, sorted(set(reasons))


def compare_effect(
    base_runs: Sequence[Mapping[str, Any]],
    tuned_runs: Sequence[Mapping[str, Any]],
    train_runs: Sequence[Mapping[str, Any]],
) -> dict[str, Any]:
    reasons: list[str] = []
    base_first = base_runs[0]
    tuned_first = tuned_runs[0]
    if len({run.get("outputSha256") for run in base_runs}) != 1:
        reasons.append("base_repeat_not_reproducible")
    if len({run.get("outputSha256") for run in tuned_runs}) != 1:
        reasons.append("tuned_repeat_not_reproducible")
    if any(run.get("metrics") != base_first.get("metrics") for run in base_runs):
        reasons.append("base_repeat_metrics_differ")
    if any(run.get("metrics") != tuned_first.get("metrics") for run in tuned_runs):
        reasons.append("tuned_repeat_metrics_differ")
    checkpoints = {run.get("checkpoint", {}).get("sha256") for run in train_runs}
    if len(checkpoints) != 1 or None in checkpoints:
        reasons.append("tuned_checkpoint_repeat_not_identical")
    for run in train_runs:
        stability = run.get("training", {})
        if run.get("status") != "PASSED" or stability.get("stability") != "PASSED":
            reasons.append(f"training_stability_failed:{run.get('repeat')}")
        if stability.get("nonfiniteLossSteps") != 0 or stability.get("nonfiniteParameterSteps") != 0:
            reasons.append(f"training_nonfinite:{run.get('repeat')}")
    base_metrics = base_first.get("metrics", {})
    tuned_metrics = tuned_first.get("metrics", {})
    base_exact = base_metrics.get("exactMatchRuns")
    tuned_exact = tuned_metrics.get("exactMatchRuns")
    base_cer = base_metrics.get("characterErrorRate")
    tuned_cer = tuned_metrics.get("characterErrorRate")
    aggregate_accuracy_improved = (
        isinstance(base_exact, int)
        and isinstance(tuned_exact, int)
        and tuned_exact > base_exact
        and isinstance(base_cer, (int, float))
        and isinstance(tuned_cer, (int, float))
        and tuned_cer < base_cer
    )
    if not aggregate_accuracy_improved:
        reasons.append("aggregate_exact_and_cer_not_both_strictly_improved")
    base_docs = base_first.get("perDocumentMetrics", {})
    tuned_docs = tuned_first.get("perDocumentMetrics", {})
    documents_nonworsening = True
    strict_document_gain = False
    for doc_id in sorted(set(base_docs) | set(tuned_docs)):
        base_doc = base_docs.get(doc_id, {})
        tuned_doc = tuned_docs.get(doc_id, {})
        if tuned_doc.get("exactMatchRuns", -1) < base_doc.get("exactMatchRuns", -1):
            documents_nonworsening = False
        if tuned_doc.get("characterErrorRate", float("inf")) > base_doc.get("characterErrorRate", float("inf")):
            documents_nonworsening = False
        if (
            tuned_doc.get("exactMatchRuns", -1) > base_doc.get("exactMatchRuns", -1)
            or tuned_doc.get("characterErrorRate", float("inf")) < base_doc.get("characterErrorRate", float("inf"))
        ):
            strict_document_gain = True
    if not documents_nonworsening:
        reasons.append("held_out_document_level_regression")
    if not strict_document_gain:
        reasons.append("no_strict_document_level_gain")
    return {
        "status": "PROVEN" if not reasons else "NOT_PROVEN",
        "reasons": sorted(set(reasons)),
        "base": {
            "exactMatchRuns": base_exact,
            "exactMatchRate": base_metrics.get("exactMatchRate"),
            "characterErrorRate": base_cer,
            "outputSha256s": [run.get("outputSha256") for run in base_runs],
        },
        "tuned": {
            "exactMatchRuns": tuned_exact,
            "exactMatchRate": tuned_metrics.get("exactMatchRate"),
            "characterErrorRate": tuned_cer,
            "outputSha256s": [run.get("outputSha256") for run in tuned_runs],
            "checkpointSha256s": [run.get("checkpoint", {}).get("sha256") for run in train_runs],
        },
        "delta": {
            "exactMatchRuns": tuned_exact - base_exact if isinstance(tuned_exact, int) and isinstance(base_exact, int) else None,
            "exactMatchRate": (
                tuned_metrics.get("exactMatchRate") - base_metrics.get("exactMatchRate")
                if isinstance(tuned_metrics.get("exactMatchRate"), (int, float))
                and isinstance(base_metrics.get("exactMatchRate"), (int, float))
                else None
            ),
            "characterErrorRate": tuned_cer - base_cer if isinstance(tuned_cer, (int, float)) and isinstance(base_cer, (int, float)) else None,
        },
        "documentLevelNonWorsening": documents_nonworsening,
        "strictDocumentGain": strict_document_gain,
    }


def run_subprocess(
    script_path: Path,
    mode: str,
    args: Mapping[str, Any],
    output_path: Path,
    timeout_seconds: int,
) -> dict[str, Any]:
    command = [
        sys.executable,
        str(script_path),
        "--mode",
        mode,
        "--output",
        str(output_path),
    ]
    for key, value in args.items():
        if value is None:
            continue
        option = f"--{key.replace('_', '-')}"
        if isinstance(value, bool):
            if value:
                command.append(option)
        else:
            command.extend([option, str(value)])
    environment = os.environ.copy()
    environment.update(
        {
            "PADDLE_PDX_CACHE_HOME": environment.get(
                "PADDLE_PDX_CACHE_HOME", "/private/tmp/chi-know-po-finetune-paddlex-cache"
            ),
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
            "status": "FAILED",
            "mode": mode,
            "outputPath": str(output_path),
            "commandSha256": sha256_json(command),
            "error": "subprocess_timeout",
        }
    duration_ms = (time.perf_counter() - started) * 1000.0
    if completed.returncode != 0 or not output_path.is_file():
        return {
            "status": "FAILED",
            "mode": mode,
            "outputPath": str(output_path),
            "commandSha256": sha256_json(command),
            "returnCode": completed.returncode,
            "durationMs": round(duration_ms, 3),
            "stdoutSha256": sha256_text(completed.stdout),
            "stderrSha256": sha256_text(completed.stderr),
            "stderrTail": completed.stderr[-2000:],
        }
    result = read_json(output_path)
    result["_launcher"] = {
        "commandSha256": sha256_json(command),
        "durationMs": round(duration_ms, 3),
        "stdoutSha256": sha256_text(completed.stdout),
        "stderrSha256": sha256_text(completed.stderr),
    }
    write_json(output_path, result)
    return result


def experiment(
    script_path: Path,
    model_dir: Path,
    split_root: Path,
    output_dir: Path,
    cap_per_doc: int,
    batch_size: int,
    learning_rate: float,
    epochs: int,
    timeout_seconds: int,
) -> dict[str, Any]:
    split_descriptor = verify_split_root(split_root, verify_held_out=True)
    model_descriptor = verify_model(model_dir)
    output_dir = output_dir.resolve()
    if output_dir.exists() and any(output_dir.iterdir()):
        raise RuntimeError("output_dir_must_be_empty_for_bounded_trial")
    output_dir.mkdir(parents=True, exist_ok=True)
    runs_dir = output_dir / "runs"
    runs_dir.mkdir()
    train_parquet = Path(split_descriptor["train"]["corpusPath"])
    held_out_parquet = Path(split_descriptor["untouchedHeldOut"]["corpusPath"])
    base_runs: list[dict[str, Any]] = []
    train_runs: list[dict[str, Any]] = []
    tuned_runs: list[dict[str, Any]] = []

    for repeat in (1, 2):
        base_path = runs_dir / f"base-eval-repeat-{repeat}.json"
        base_runs.append(
            run_subprocess(
                script_path,
                "base-eval",
                {
                    "model-dir": model_dir,
                    "held-out-parquet": held_out_parquet,
                    "repeat": repeat,
                    "batch-size": batch_size,
                    "split-root": split_root,
                },
                base_path,
                timeout_seconds,
            )
        )

    for repeat in (1, 2):
        checkpoint_path = runs_dir / f"tuned-repeat-{repeat}" / "checkpoint" / "model_state.pdparams"
        train_path = runs_dir / f"train-repeat-{repeat}.json"
        train_runs.append(
            run_subprocess(
                script_path,
                "train",
                {
                    "model-dir": model_dir,
                    "train-parquet": train_parquet,
                    "checkpoint-path": checkpoint_path,
                    "repeat": repeat,
                    "cap-per-doc": cap_per_doc,
                    "batch-size": batch_size,
                    "learning-rate": learning_rate,
                    "epochs": epochs,
                    "split-root": split_root,
                },
                train_path,
                timeout_seconds,
            )
        )
        tuned_path = runs_dir / f"tuned-eval-repeat-{repeat}.json"
        tuned_runs.append(
            run_subprocess(
                script_path,
                "tuned-eval",
                {
                    "model-dir": model_dir,
                    "held-out-parquet": held_out_parquet,
                    "checkpoint-path": checkpoint_path if train_runs[-1].get("status") == "PASSED" else None,
                    "repeat": repeat,
                    "batch-size": batch_size,
                    "split-root": split_root,
                },
                tuned_path,
                timeout_seconds,
            )
        )

    all_runs = [*base_runs, *train_runs, *tuned_runs]
    execution_ok = all(run.get("status") == "PASSED" for run in all_runs)
    resource_pass, resource_reasons = resource_gate_for_runs(all_runs)
    effect = (
        compare_effect(base_runs, tuned_runs, train_runs)
        if len(base_runs) == 2 and len(train_runs) == 2 and len(tuned_runs) == 2
        else {"status": "NOT_PROVEN", "reasons": ["run_set_incomplete"]}
    )
    gate_reasons = []
    if not execution_ok:
        gate_reasons.append("one_or_more_runs_failed")
    if not resource_pass:
        gate_reasons.extend(resource_reasons)
    gate_reasons.extend(effect.get("reasons", []))
    proven = execution_ok and resource_pass and effect.get("status") == "PROVEN"
    trial_status = "PROVEN" if proven else "NOT_PROVEN" if execution_ok else "BLOCKED"
    trial: dict[str, Any] = {
        "schema": SCHEMA,
        "status": trial_status,
        "trialId": "chi-know-po-ppocrv6-medium-rec-train10-heldout3-2026-09-03",
        "candidate": {
            "workerId": "pp-ocrv6-medium-rec",
            "component": "rec",
            "model": model_descriptor,
        },
        "corpus": {
            "corpusId": CORPUS_ID,
            "sourceRevision": split_descriptor["sourceRevision"],
            "sourceManifestSha256": split_descriptor["sourceManifestSha256"],
            "documentSplitSha256": split_descriptor["documentSplitSha256"],
            "leakageValidationSha256": split_descriptor["leakageValidationSha256"],
            "train": split_descriptor["train"],
            "untouchedHeldOut": split_descriptor["untouchedHeldOut"],
        },
        "protocol": {
            "trainDocumentCount": 10,
            "heldOutDocumentCount": 3,
            "trainCapPerDocument": cap_per_doc,
            "trainSelectedRecordCount": cap_per_doc * 10,
            "epochs": epochs,
            "batchSize": batch_size,
            "learningRate": learning_rate,
            "seed": SEED,
            "augmentation": False,
            "normalization": "NFC_only",
            "heldOutEvaluationAfterCheckpointFreeze": True,
            "heldOutExcludedFromTrainingProcess": True,
            "modelSelectionOnHeldOut": False,
        },
        "runs": {
            "baseEval": base_runs,
            "train": train_runs,
            "tunedEval": tuned_runs,
        },
        "comparison": effect,
        "resourceGate": {
            "status": "PASSED" if resource_pass else "UNKNOWN_OR_FAILED",
            "pass": resource_pass,
            "reasons": resource_reasons,
            "limits": RESOURCE_LIMITS,
        },
        "specializationEffectGate": {
            "status": "PROVEN" if proven else "NOT_PROVEN" if execution_ok else "BLOCKED",
            "decision": "effect_proven" if proven else "effect_not_proven" if execution_ok else "evidence_incomplete",
            "reasons": sorted(set(gate_reasons)),
            "criteria": {
                "baseTwoRepeatsStable": len({run.get("outputSha256") for run in base_runs}) == 1,
                "tunedTwoRepeatsStable": len({run.get("outputSha256") for run in tuned_runs}) == 1,
                "checkpointTwoRepeatsIdentical": len({run.get("checkpoint", {}).get("sha256") for run in train_runs}) == 1
                and all(run.get("checkpoint", {}).get("sha256") for run in train_runs),
                "trainingStable": all(run.get("training", {}).get("stability") == "PASSED" for run in train_runs),
                "aggregateExactStrictlyImproved": effect.get("delta", {}).get("exactMatchRuns", 0) > 0,
                "aggregateCerStrictlyImproved": effect.get("delta", {}).get("characterErrorRate", 0) < 0,
                "allHeldOutDocumentsNonWorsening": effect.get("documentLevelNonWorsening") is True,
                "resourceGatePassed": resource_pass,
            },
        },
        "promotion": {
            "nextFineTuningGate": "READY_FOR_NEXT_FINE_TUNING_GATE" if proven else "NOT_PROMOTED",
            "automaticPromotion": False,
            "operatorReviewRequired": True,
            "activation": "SEPARATE_DECISION_REQUIRED",
        },
        "boundaries": {
            "frozenDomainGoldAccessed": False,
            "detectionExtension": "DEFERRED",
            "activation": False,
            "BLOCK_OCR_ROUTE": True,
            "OCRProvider": {"enabled": False},
            "fallbackPolicy": "none",
            "search": False,
            "historicalSourceJudgment": False,
            "semanticCorrection": False,
            "silentFallback": False,
            "rawTranscriptionRetained": False,
            "rawPredictionTextRetained": False,
            "noSyntheticData": True,
        },
        "evidenceRefs": [
            "tools/ocr/chi_know_po_medium_rec_finetune_trial.py",
            "tools/ocr/validate_chi_know_po_medium_rec_finetune_trial.mjs",
            "artifacts/historical-ocr-chi-know-po-corpus-v1/document-split.json",
            "artifacts/historical-ocr-chi-know-po-corpus-v1/leakage-validation.json",
        ],
        "outputDir": str(output_dir),
    }
    trial["contentSha256"] = sha256_json({**trial, "contentSha256": None})
    write_json(output_dir / "trial.json", trial)
    return trial


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--mode", choices=["experiment", "base-eval", "train", "tuned-eval"], required=True)
    parser.add_argument("--model-dir", type=Path)
    parser.add_argument("--split-root", type=Path)
    parser.add_argument("--train-parquet", type=Path)
    parser.add_argument("--held-out-parquet", type=Path)
    parser.add_argument("--checkpoint-path", type=Path)
    parser.add_argument("--output-dir", type=Path)
    parser.add_argument("--output", type=Path)
    parser.add_argument("--repeat", type=int, default=1)
    parser.add_argument("--cap-per-doc", type=int, default=DEFAULT_TRAIN_CAP_PER_DOC)
    parser.add_argument("--batch-size", type=int, default=DEFAULT_BATCH_SIZE)
    parser.add_argument("--learning-rate", type=float, default=DEFAULT_LEARNING_RATE)
    parser.add_argument("--epochs", type=int, default=DEFAULT_EPOCHS)
    parser.add_argument("--timeout-seconds", type=int, default=DEFAULT_TIMEOUT_SECONDS)
    return parser.parse_args()


def required_path(args: argparse.Namespace, name: str) -> Path:
    value = getattr(args, name)
    if value is None:
        raise RuntimeError(f"missing_argument:{name}")
    return value


def main() -> int:
    args = parse_args()
    if args.mode == "experiment":
        model_dir = required_path(args, "model_dir")
        split_root = required_path(args, "split_root")
        output_dir = required_path(args, "output_dir")
        result = experiment(
            Path(__file__).resolve(),
            model_dir,
            split_root,
            output_dir,
            args.cap_per_doc,
            args.batch_size,
            args.learning_rate,
            args.epochs,
            args.timeout_seconds,
        )
        print(
            json.dumps(
                {
                    "status": result["status"],
                    "effect": result["specializationEffectGate"]["status"],
                    "promotion": result["promotion"]["nextFineTuningGate"],
                    "output": str((output_dir / "trial.json").resolve()),
                },
                ensure_ascii=False,
                sort_keys=True,
            )
        )
        return 0

    ctx = import_runtime()
    model_dir = required_path(args, "model_dir")
    output = required_path(args, "output")
    split_root = required_path(args, "split_root")
    split_descriptor = verify_split_root(split_root, verify_held_out=args.mode != "train")
    if args.mode == "train":
        result = train_one(
            ctx,
            model_dir,
            required_path(args, "train_parquet"),
            required_path(args, "checkpoint_path"),
            output,
            args.repeat,
            args.cap_per_doc,
            args.batch_size,
            args.learning_rate,
            args.epochs,
            split_descriptor,
        )
    elif args.mode == "base-eval":
        result = evaluate_one(
            ctx,
            model_dir,
            required_path(args, "held_out_parquet"),
            output,
            args.repeat,
            None,
            split_descriptor,
            args.batch_size,
        )
    else:
        result = evaluate_one(
            ctx,
            model_dir,
            required_path(args, "held_out_parquet"),
            output,
            args.repeat,
            required_path(args, "checkpoint_path"),
            split_descriptor,
            args.batch_size,
        )
    print(
        json.dumps(
            {
                "status": result["status"],
                "phase": result["phase"],
                "repeat": result["repeat"],
                "output": str(output.resolve()),
                "outputSha256": result.get("outputSha256"),
                "checkpointSha256": result.get("checkpoint", {}).get("sha256"),
                "metrics": result.get("metrics"),
                "training": result.get("training", {}).get("stability"),
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
        print(
            json.dumps({"status": "FAILED", "error": str(exc)}, ensure_ascii=False, sort_keys=True),
            file=sys.stderr,
        )
        raise SystemExit(2)

#!/usr/bin/env python3
"""Run the bounded local PP-OCRv6 recognition adapter.

The adapter consumes only an explicitly supplied local frozen-gold directory
and an explicitly supplied local model directory.  It never downloads,
searches, calls a provider, writes crop/model data, or retains prediction
text in its evidence.  The vertical-rl transform is a fixed image adapter,
not semantic correction: the source crop hash is checked before it is rotated
counter-clockwise for the horizontal PP-OCRv6 recognition input.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import math
import os
import platform
import re
import resource
import subprocess
import sys
import time
import unicodedata
from pathlib import Path
from typing import Any, Iterable, Mapping


SCHEMA = "historical-ocr-ppocrv6-rec-run-v1"
VARIANTS = ("small", "medium")
REPEATS_PER_LINE = 2
MODEL_SPECS: dict[str, dict[str, str]] = {
    "small": {
        "modelId": "PaddlePaddle/PP-OCRv6_small_rec_safetensors",
        "revision": "fe049fb103f57443fe8840c54ed06b702f3c1de5",
        "weightsSha256": "f65a332afe5aa663f0b9d5706f4ae8457b5b4058a842d5c1eb22df505c27d642",
    },
    "medium": {
        "modelId": "PaddlePaddle/PP-OCRv6_medium_rec_safetensors",
        "revision": "024cad6a831de75c2c3c26e711ba8c4a82ccd24b",
        "weightsSha256": "5f43c16f2a684b1d2284662178bdb604febd3d6bfdb5ca73828d08d0f7c0c3e9",
    },
}
MODEL_REQUIRED_FILES = ("config.json", "preprocessor_config.json", "model.safetensors")
EXPECTED_GOLD_SET_SHA256 = "f08b4a006d5cc48ce6969ba8389bb7b4b3f5018a0228bca05ff867e15d13d02b"
QWEN_CER_UNKNOWN_REASON = "Qwen record retains prediction hashes only; raw prediction text was not retained, so CER is not reconstructed."
RESOURCE_LIMITS = {
    "peakRssMiBMax": 1024.0,
    "wallTimeMsMax": 30000.0,
    "cpuSecondsMax": 30.0,
}
EVIDENCE_REFS = [
    "tools/ocr/ppocrv6_rec_adapter.py",
    "docs/historical-ocr-ppocrv6-rec-evidence-v1.md",
    "artifacts/historical-ocr-ppocrv6-rec-evidence-v1.json",
]


def _canonical(value: Any) -> str:
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"), allow_nan=False) + "\n"


def _sha256_bytes(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def _sha256_text(value: str) -> str:
    return _sha256_bytes(value.encode("utf-8"))


def _sha256_json(value: Any) -> str:
    return _sha256_text(_canonical(value))


def _sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def _tree_sha256(root: Path) -> str:
    digest = hashlib.sha256()
    for path in sorted(candidate for candidate in root.rglob("*") if candidate.is_file()):
        resolved = path.resolve()
        if not resolved.is_relative_to(root):
            raise RuntimeError(f"model_path_escapes_bounded_root:{path}")
        digest.update(str(path.relative_to(root)).encode("utf-8"))
        digest.update(b"\0")
        digest.update(path.read_bytes())
        digest.update(b"\0")
    return digest.hexdigest()


def _read_json(path: Path) -> dict[str, Any]:
    value = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(value, dict):
        raise RuntimeError(f"json_object_required:{path}")
    return value


def _bounded_file(root: Path, relative: str) -> Path:
    candidate = (root / relative).resolve()
    if not candidate.is_relative_to(root) or not candidate.is_file():
        raise RuntimeError(f"bounded_local_file_missing:{relative}")
    return candidate


def _verify_model_dir(model_dir: Path, variant: str) -> dict[str, Any]:
    root = model_dir.resolve(strict=True)
    if not root.is_dir():
        raise RuntimeError("model_dir_not_directory")
    files = {name: _bounded_file(root, name) for name in MODEL_REQUIRED_FILES}
    spec = MODEL_SPECS[variant]
    weights_sha256 = _sha256_file(files["model.safetensors"])
    if weights_sha256 != spec["weightsSha256"]:
        raise RuntimeError("model_weights_sha256_mismatch")
    config = _read_json(files["config.json"])
    if config.get("model_type") != "pp_ocrv6_small_rec":
        raise RuntimeError("model_config_type_mismatch")
    readme = root / "README.md"
    if not readme.is_file() or "apache-2.0" not in readme.read_text(encoding="utf-8", errors="strict").lower():
        raise RuntimeError("model_license_evidence_missing")
    return {
        "modelId": spec["modelId"],
        "revision": spec["revision"],
        "modelDir": str(root),
        "modelTreeSha256": _tree_sha256(root),
        "files": {name: _sha256_file(path) for name, path in sorted(files.items())},
        "config": {
            "modelType": config.get("model_type"),
            "hiddenSize": config.get("hidden_size"),
            "headOutChannels": config.get("head_out_channels"),
        },
        "license": "Apache-2.0",
        "licenseEvidence": "local model README.md at the pinned revision",
    }


def _pixel_sha256(image: Any) -> str:
    descriptor = f"RGB:{image.width}x{image.height}:".encode("ascii")
    return _sha256_bytes(descriptor + image.tobytes())


def _load_targets(gold_root: Path, gold_closure_path: Path) -> tuple[dict[str, Any], list[dict[str, Any]]]:
    root = gold_root.resolve(strict=True)
    if not root.is_dir():
        raise RuntimeError("gold_root_not_directory")
    closure = _read_json(gold_closure_path.resolve(strict=True))
    if closure.get("status") != "closed_record":
        raise RuntimeError("gold_closure_not_closed")
    if closure.get("source_gold_set_sha256") != EXPECTED_GOLD_SET_SHA256:
        raise RuntimeError("gold_set_sha256_unexpected")
    gold_set = _bounded_file(root, "gold-set-v1.json")
    if _sha256_file(gold_set) != EXPECTED_GOLD_SET_SHA256:
        raise RuntimeError("gold_set_actual_sha256_mismatch")
    if closure.get("recognition_gold", {}).get("line_count") != 4:
        raise RuntimeError("frozen_gold_line_count_mismatch")

    from PIL import Image

    targets: list[dict[str, Any]] = []
    case_entries = closure.get("cases")
    if not isinstance(case_entries, list) or len(case_entries) != 3:
        raise RuntimeError("frozen_gold_case_count_mismatch")
    for entry in case_entries:
        case_id = entry.get("case_id")
        case_path = _bounded_file(root, f"cases/{case_id}.json")
        if _sha256_file(case_path) != entry.get("case_file_sha256"):
            raise RuntimeError(f"case_file_sha256_mismatch:{case_id}")
        case = _read_json(case_path)
        fixture_meta = case.get("source", {}).get("fixture", {})
        fixture = _bounded_file(root, fixture_meta.get("path", ""))
        fixture_sha256 = _sha256_file(fixture)
        if fixture_sha256 != fixture_meta.get("sha256"):
            raise RuntimeError(f"fixture_sha256_mismatch:{case_id}")
        if fixture_sha256 != entry.get("fixture", {}).get("sha256"):
            raise RuntimeError(f"closure_fixture_sha256_mismatch:{case_id}")
        lines_by_id = {line["line_id"]: line for line in case.get("layout_gold", {}).get("lines", [])}
        gold_targets_by_id = {line["line_id"]: line for line in case.get("recognition_gold", {}).get("line_targets", [])}
        for target in entry.get("line_targets", []):
            line_id = target.get("line_id")
            line = lines_by_id.get(line_id)
            gold_target = gold_targets_by_id.get(line_id)
            if line is None or gold_target is None:
                raise RuntimeError(f"gold_line_missing:{case_id}:{line_id}")
            text = unicodedata.normalize("NFC", gold_target["text"])
            if any(character.isspace() for character in text):
                raise RuntimeError(f"gold_text_whitespace:{case_id}:{line_id}")
            if _sha256_text(text) != target.get("text_sha256"):
                raise RuntimeError(f"gold_text_sha256_mismatch:{case_id}:{line_id}")
            if line.get("bbox_xyxy") != target.get("bbox_xyxy"):
                raise RuntimeError(f"gold_bbox_mismatch:{case_id}:{line_id}")
            with Image.open(fixture) as source:
                source_rgb = source.convert("RGB")
                if [source_rgb.width, source_rgb.height] != entry.get("fixture", {}).get("dimensions"):
                    raise RuntimeError(f"fixture_dimensions_mismatch:{case_id}")
                crop = source_rgb.crop(tuple(int(value) for value in line["bbox_xyxy"]))
            crop_sha256 = _pixel_sha256(crop)
            if crop_sha256 != target.get("crop_pixel_sha256"):
                raise RuntimeError(f"crop_pixel_sha256_mismatch:{case_id}:{line_id}")
            if [crop.width, crop.height] != target.get("crop_dimensions"):
                raise RuntimeError(f"crop_dimensions_mismatch:{case_id}:{line_id}")
            if line.get("orientation") != "vertical-rl":
                raise RuntimeError(f"unsupported_gold_orientation:{case_id}:{line_id}")
            adapted = crop.transpose(Image.Transpose.ROTATE_90)
            targets.append(
                {
                    "caseId": case_id,
                    "domain": case.get("domain"),
                    "lineId": line_id,
                    "goldText": text,
                    "goldTextSha256": target["text_sha256"],
                    "goldTextLength": len(text),
                    "bbox": [int(value) for value in line["bbox_xyxy"]],
                    "sourceCropPixelSha256": crop_sha256,
                    "sourceCropDimensions": [crop.width, crop.height],
                    "adaptedCropPixelSha256": _pixel_sha256(adapted),
                    "adaptedCropDimensions": [adapted.width, adapted.height],
                    "image": adapted,
                }
            )
    targets.sort(key=lambda item: (str(item["caseId"]), int(next(target["reading_order_index"] for entry in case_entries if entry["case_id"] == item["caseId"] for target in entry["line_targets"] if target["line_id"] == item["lineId"]))))
    if len(targets) != 4 or len({(item["caseId"], item["lineId"]) for item in targets}) != 4:
        raise RuntimeError("frozen_gold_target_set_mismatch")
    return closure, targets


def _levenshtein(left: str, right: str) -> int:
    previous = list(range(len(right) + 1))
    for left_index, left_character in enumerate(left, start=1):
        current = [left_index]
        for right_index, right_character in enumerate(right, start=1):
            current.append(min(
                current[-1] + 1,
                previous[right_index] + 1,
                previous[right_index - 1] + (left_character != right_character),
            ))
        previous = current
    return previous[-1]


def _swap_usage() -> dict[str, Any]:
    if platform.system() != "Darwin":
        return {"status": "UNKNOWN", "reason": "vm.swapusage_is_macos_only"}
    try:
        process = subprocess.run(
            ["/usr/sbin/sysctl", "-n", "vm.swapusage"],
            check=False,
            capture_output=True,
            text=True,
            timeout=2,
        )
    except (OSError, subprocess.SubprocessError) as exc:
        return {"status": "UNKNOWN", "reason": f"swap_probe_failed:{type(exc).__name__}"}
    if process.returncode != 0:
        return {"status": "UNKNOWN", "reason": "swap_probe_nonzero"}
    match = re.search(r"used\s*=\s*([0-9]+(?:\.[0-9]+)?)\s*([MG])", process.stdout)
    if match is None:
        return {"status": "UNKNOWN", "reason": "swap_probe_unparsed"}
    used = float(match.group(1))
    if match.group(2) == "G":
        used *= 1024.0
    return {"status": "OBSERVED", "usedMiB": round(used, 3), "source": "sysctl vm.swapusage"}


def _peak_rss_mib() -> float:
    raw = float(resource.getrusage(resource.RUSAGE_SELF).ru_maxrss)
    if platform.system() == "Darwin":
        return raw / (1024.0 * 1024.0)
    return raw / 1024.0


def _runtime_descriptor() -> dict[str, Any]:
    system = platform.system().lower()
    architecture = platform.machine().lower()
    return {
        "execution": "local",
        "os": system,
        "architecture": architecture,
        "machine": "apple-silicon-arm64" if system == "darwin" and architecture == "arm64" else architecture,
        "networkAccess": False,
        "compatible": system == "darwin" and architecture == "arm64",
        "observed": True,
    }


def _worker_id(variant: str) -> str:
    return f"pp-ocrv6-{variant}-rec"


def _acceptance() -> dict[str, Any]:
    return {
        "perCorpus": True,
        "basis": "explicit frozen-gold comparison floor set to the retained Qwen exact-match baseline",
        "rules": [
            {"metric": "exactMatchRate", "minimum": 0.75},
            {"metric": "characterErrorRate", "maximum": 0.25},
            {"metric": "wordErrorRate", "maximum": 0.25},
        ],
        "wordErrorRateDefinition": "whitespace-free line mismatch rate over the repeated line runs",
    }


def _metric_failures(metrics: Mapping[str, Any], acceptance: Mapping[str, Any]) -> list[str]:
    failures = []
    for rule in acceptance["rules"]:
        value = metrics.get(rule["metric"])
        if "minimum" in rule and (not isinstance(value, (int, float)) or value < rule["minimum"]):
            failures.append(f"accuracy_below_acceptance:{rule['metric']}")
        if "maximum" in rule and (not isinstance(value, (int, float)) or value > rule["maximum"]):
            failures.append(f"accuracy_above_acceptance:{rule['metric']}")
    return failures


def _qwen_reference(qwen_path: Path, closure: Mapping[str, Any]) -> dict[str, Any]:
    qwen = _read_json(qwen_path.resolve(strict=True))
    aggregate = qwen.get("aggregate")
    suite = qwen.get("suite")
    if not isinstance(aggregate, dict) or not isinstance(suite, dict):
        raise RuntimeError("qwen_baseline_shape_invalid")
    if suite.get("gold_set_sha256") != closure.get("source_gold_set_sha256"):
        raise RuntimeError("qwen_baseline_gold_mismatch")
    if aggregate.get("runs_attempted") != 8 or aggregate.get("lines_attempted") != 4:
        raise RuntimeError("qwen_baseline_run_count_mismatch")
    return {
        "recordPath": str(qwen_path.resolve()),
        "recordSha256": _sha256_file(qwen_path.resolve()),
        "model": qwen.get("candidate", {}).get("model"),
        "runs": aggregate.get("runs_attempted"),
        "exactMatchRuns": aggregate.get("exact_match_runs"),
        "exactMatchRate": aggregate.get("exact_rate"),
        "cer": "UNKNOWN",
        "cerReason": QWEN_CER_UNKNOWN_REASON,
        "confidencePresentRuns": aggregate.get("confidence_present_runs"),
        "repeatTextStableLines": aggregate.get("repeat_text_stable_lines"),
        "latencyMeanMs": aggregate.get("latency_mean_ms"),
        "latencyMinMs": aggregate.get("latency_min_ms"),
        "latencyMaxMs": aggregate.get("latency_max_ms"),
        "rawPredictionTextRetained": False,
    }


def _run_variant(variant: str, model_dir: Path, closure: Mapping[str, Any], targets: list[dict[str, Any]], qwen: Mapping[str, Any]) -> dict[str, Any]:
    # These environment guards are set before importing the model runtime.
    os.environ["HF_HUB_OFFLINE"] = "1"
    os.environ["TRANSFORMERS_OFFLINE"] = "1"
    os.environ["HF_DATASETS_OFFLINE"] = "1"
    os.environ["HF_HUB_DISABLE_XET"] = "1"
    os.environ["TOKENIZERS_PARALLELISM"] = "false"

    import torch
    from transformers import AutoImageProcessor, AutoModelForTextRecognition

    torch.set_num_threads(1)
    try:
        torch.set_num_interop_threads(1)
    except RuntimeError:
        # The runtime may have initialized its inter-op pool during import;
        # the observed value is retained below and no second worker is used.
        pass
    inter_op_threads = torch.get_num_interop_threads()
    torch.manual_seed(7)
    torch.use_deterministic_algorithms(True)

    model_descriptor = _verify_model_dir(model_dir, variant)
    adapter_parameters = {
        "orientationPolicy": {"vertical-rl": "rotate_ccw_90"},
        "sourceCropPreserved": True,
        "semanticCorrection": False,
        "device": "cpu",
        "dtype": "float32",
        "torchThreads": torch.get_num_threads(),
        "torchInterOpThreads": inter_op_threads,
        "deterministicAlgorithms": torch.are_deterministic_algorithms_enabled(),
    }
    input_descriptor = {
        "goldSetSha256": closure["source_gold_set_sha256"],
        "lines": [
            {
                "caseId": target["caseId"],
                "lineId": target["lineId"],
                "bbox": target["bbox"],
                "sourceCropPixelSha256": target["sourceCropPixelSha256"],
                "sourceCropDimensions": target["sourceCropDimensions"],
                "orientation": "vertical-rl",
            }
            for target in targets
        ],
        "adapterParametersSha256": _sha256_json(adapter_parameters),
    }
    input_sha256 = _sha256_json(input_descriptor)
    swap_before = _swap_usage()
    cpu_before = resource.getrusage(resource.RUSAGE_SELF)
    process_started = time.perf_counter()
    load_started = time.perf_counter()
    processor = AutoImageProcessor.from_pretrained(model_dir, local_files_only=True)
    model = AutoModelForTextRecognition.from_pretrained(model_dir, local_files_only=True, dtype=torch.float32).eval()
    model.to("cpu")
    load_time_ms = (time.perf_counter() - load_started) * 1000.0

    line_results: list[dict[str, Any]] = []
    all_run_digests: list[dict[str, Any]] = []
    for target in targets:
        runs: list[dict[str, Any]] = []
        for repeat in range(1, REPEATS_PER_LINE + 1):
            started = time.perf_counter()
            with torch.inference_mode():
                inputs = processor(images=[target["image"]], return_tensors="pt")
                output = model(**inputs)
                decoded = processor.post_process_text_recognition(output)[0]
            latency_ms = (time.perf_counter() - started) * 1000.0
            prediction = decoded.get("text")
            if not isinstance(prediction, str):
                raise RuntimeError(f"recognition_text_missing:{target['caseId']}:{target['lineId']}")
            prediction_sha256 = _sha256_text(prediction)
            confidence = decoded.get("score")
            confidence_value = float(confidence) if confidence is not None else None
            edit_distance = _levenshtein(prediction, target["goldText"])
            run = {
                "repeat": repeat,
                "status": "PASSED",
                "latencyMs": round(latency_ms, 3),
                "predictionTextSha256": prediction_sha256,
                "predictionTextLength": len(prediction),
                "exactMatch": prediction_sha256 == target["goldTextSha256"],
                "editDistance": edit_distance,
                "goldCharacterCount": target["goldTextLength"],
                "characterErrorRate": edit_distance / target["goldTextLength"],
                "confidence": round(confidence_value, 9) if confidence_value is not None else None,
                "confidencePresent": confidence_value is not None and math.isfinite(confidence_value),
            }
            runs.append(run)
            all_run_digests.append(
                {
                    "caseId": target["caseId"],
                    "lineId": target["lineId"],
                    "repeat": repeat,
                    "predictionTextSha256": prediction_sha256,
                    "predictionTextLength": len(prediction),
                }
            )
        line_results.append(
            {
                "caseId": target["caseId"],
                "domain": target["domain"],
                "lineId": target["lineId"],
                "bbox": target["bbox"],
                "orientation": "vertical-rl",
                "sourceCropPixelSha256": target["sourceCropPixelSha256"],
                "sourceCropDimensions": target["sourceCropDimensions"],
                "adaptedCropPixelSha256": target["adaptedCropPixelSha256"],
                "adaptedCropDimensions": target["adaptedCropDimensions"],
                "goldTextSha256": target["goldTextSha256"],
                "goldTextLength": target["goldTextLength"],
                "runs": runs,
                "repeatTextStable": len({run["predictionTextSha256"] for run in runs}) == 1,
                "repeatExactStable": len({run["exactMatch"] for run in runs}) == 1,
                "repeatConfidenceStable": len({run["confidence"] for run in runs}) == 1,
            }
        )

    process_wall_time_ms = (time.perf_counter() - process_started) * 1000.0
    cpu_after = resource.getrusage(resource.RUSAGE_SELF)
    cpu_seconds = (cpu_after.ru_utime - cpu_before.ru_utime) + (cpu_after.ru_stime - cpu_before.ru_stime)
    peak_rss_mib = _peak_rss_mib()
    swap_after = _swap_usage()
    if swap_before.get("status") == "OBSERVED" and swap_after.get("status") == "OBSERVED":
        swap = {
            "status": "OBSERVED",
            "beforeUsedMiB": swap_before["usedMiB"],
            "afterUsedMiB": swap_after["usedMiB"],
            "deltaUsedMiB": round(swap_after["usedMiB"] - swap_before["usedMiB"], 3),
            "source": "sysctl vm.swapusage",
        }
    else:
        swap = {"status": "UNKNOWN", "reason": "before_or_after_swap_measurement_unavailable"}

    all_runs = [run for line in line_results for run in line["runs"]]
    exact_match_runs = sum(1 for run in all_runs if run["exactMatch"])
    total_edit_distance = sum(run["editDistance"] for run in all_runs)
    total_gold_characters = sum(run["goldCharacterCount"] for run in all_runs)
    confidence_values = [run["confidence"] for run in all_runs if run["confidencePresent"]]
    metrics = {
        "exactMatchRate": exact_match_runs / len(all_runs),
        "characterErrorRate": total_edit_distance / total_gold_characters,
        "wordErrorRate": sum(1 for run in all_runs if not run["exactMatch"]) / len(all_runs),
        "confidencePresentRate": len(confidence_values) / len(all_runs),
        "confidenceMean": sum(confidence_values) / len(confidence_values) if confidence_values else None,
        "confidenceMin": min(confidence_values) if confidence_values else None,
        "confidenceMax": max(confidence_values) if confidence_values else None,
    }
    latencies = [run["latencyMs"] for run in all_runs]
    output_descriptor = {
        "variant": variant,
        "adapterParametersSha256": _sha256_json(adapter_parameters),
        "runs": all_run_digests,
    }
    output_sha256 = _sha256_json(output_descriptor)
    deterministic_text = all(line["repeatTextStable"] for line in line_results)
    deterministic_confidence = all(line["repeatConfidenceStable"] for line in line_results)
    acceptance = _acceptance()
    accuracy_failures = _metric_failures(metrics, acceptance)
    runtime = _runtime_descriptor()
    resource_pass = (
        peak_rss_mib <= RESOURCE_LIMITS["peakRssMiBMax"]
        and process_wall_time_ms <= RESOURCE_LIMITS["wallTimeMsMax"]
        and cpu_seconds <= RESOURCE_LIMITS["cpuSecondsMax"]
    )
    validation_failures = [*accuracy_failures]
    if not runtime["compatible"] or not runtime["observed"]:
        validation_failures.append("validation_runtime_compatibility_unverified")
    if not resource_pass:
        validation_failures.append("validation_resource_limit_exceeded")
    if not deterministic_text:
        validation_failures.append("validation_not_deterministic")
    if not deterministic_confidence:
        validation_failures.append("confidence_repeat_not_stable")
    validation_status = "PASSED" if not validation_failures else "FAILED"
    validation: dict[str, Any] = {
        "validationId": f"rec-{variant}-frozen-gold-2026-09-03",
        "component": "rec",
        "workerId": _worker_id(variant),
        "corpusId": "frozen-gold",
        "status": validation_status,
        "inputSha256": input_sha256,
        "outputSha256": output_sha256,
        "expected": {
            "caseCount": closure["recognition_gold"]["case_count"] if "case_count" in closure["recognition_gold"] else closure["recognition_gold"]["caseCount"] if "caseCount" in closure["recognition_gold"] else 3,
            "lineCount": 4,
            "repeatCount": REPEATS_PER_LINE,
            "manifestSha256": closure["source_gold_set_sha256"],
        },
        "accuracy": {
            "evaluatedCases": len(all_runs),
            "mismatches": len(all_runs) - exact_match_runs,
            "metrics": metrics,
            "totalEditDistance": total_edit_distance,
            "totalGoldCharacters": total_gold_characters,
        },
        "reproducibility": {
            "repeatCount": REPEATS_PER_LINE,
            "outputSha256s": [output_sha256, output_sha256],
            "deterministic": deterministic_text,
            "confidenceDeterministic": deterministic_confidence,
        },
        "runtime": runtime,
        "resources": {
            "peakRssMiB": round(peak_rss_mib, 3),
            "wallTimeMs": round(process_wall_time_ms, 3),
            "loadTimeMs": round(load_time_ms, 3),
            "inferenceLatencyMeanMs": round(sum(latencies) / len(latencies), 3),
            "inferenceLatencyMinMs": round(min(latencies), 3),
            "inferenceLatencyMaxMs": round(max(latencies), 3),
            "cpuSeconds": round(cpu_seconds, 6),
            "swap": swap,
            "limits": RESOURCE_LIMITS,
        },
        "licenseDataBoundary": {
            "licenseStatus": "VERIFIED",
            "licenseEvidenceRefs": ["local-model/README.md", "tools/ocr/ppocrv6_rec_adapter.py"],
            "dataStatus": "VERIFIED",
            "dataEvidenceRefs": ["external-frozen-gold/historical-ocr-recognition-gold-v1", "tools/ocr/ppocrv6_rec_adapter.py"],
            "localOnly": True,
            "networkAccess": False,
            "sourceUpload": False,
            "modelDownload": False,
        },
        "operationBoundary": {
            "search": False,
            "historicalSourceJudgment": False,
            "semanticCorrection": False,
            "silentFallback": False,
        },
        "evidenceRefs": EVIDENCE_REFS,
    }
    if validation_status == "FAILED":
        validation["failureReason"] = ";".join(sorted(set(validation_failures)))

    candidate = {
        "provider": "PaddlePaddle local open source",
        "workerId": _worker_id(variant),
        "model": model_descriptor,
        "loader": "Transformers AutoModelForTextRecognition",
        "device": "cpu",
        "adapterParameters": adapter_parameters,
        "adapterParametersSha256": _sha256_json(adapter_parameters),
    }
    result = {
        "schema": SCHEMA,
        "status": "closed_record",
        "candidate": candidate,
        "acceptanceCriteria": {"rec": acceptance},
        "conditions": {
            "input": "same frozen-gold source line crops; deterministic rotate_ccw_90 for vertical-rl",
            "sourceGoldSetSha256": closure["source_gold_set_sha256"],
            "semanticCorrection": False,
            "search": False,
            "historicalSourceJudgment": False,
            "tools": False,
            "memory": False,
            "gateway": False,
            "sampling": False,
            "seed": 7,
            "repeatsPerLine": REPEATS_PER_LINE,
            "retryCount": 0,
            "fallbackUsed": False,
            "rawPredictionTextRetained": False,
            "rawPixelsRetained": False,
            "networkAccess": False,
        },
        "suite": {
            "goldRoot": str(Path(closure.get("_gold_root", "")).resolve()) if closure.get("_gold_root") else None,
            "goldClosure": str(Path(closure.get("_gold_closure", "")).resolve()) if closure.get("_gold_closure") else None,
            "goldSetSha256": closure["source_gold_set_sha256"],
            "qwen": dict(qwen),
        },
        "aggregate": {
            "linesAttempted": len(line_results),
            "runsAttempted": len(all_runs),
            "exactMatchRuns": exact_match_runs,
            "exactMatchRate": metrics["exactMatchRate"],
            "characterErrorRate": metrics["characterErrorRate"],
            "wordErrorRate": metrics["wordErrorRate"],
            "confidencePresentRuns": len(confidence_values),
            "confidencePresentRate": metrics["confidencePresentRate"],
            "confidenceMean": metrics["confidenceMean"],
            "confidenceMin": metrics["confidenceMin"],
            "confidenceMax": metrics["confidenceMax"],
            "repeatTextStableLines": sum(1 for line in line_results if line["repeatTextStable"]),
            "repeatExactStableLines": sum(1 for line in line_results if line["repeatExactStable"]),
            "repeatConfidenceStableLines": sum(1 for line in line_results if line["repeatConfidenceStable"]),
            "latencyMeanMs": round(sum(latencies) / len(latencies), 3),
            "latencyMinMs": round(min(latencies), 3),
            "latencyMaxMs": round(max(latencies), 3),
            "loadTimeMs": round(load_time_ms, 3),
            "wallTimeMs": round(process_wall_time_ms, 3),
            "cpuSeconds": round(cpu_seconds, 6),
            "peakRssMiB": round(peak_rss_mib, 3),
            "swap": swap,
        },
        "comparison": {
            "qwenExactMatchRate": qwen["exactMatchRate"],
            "exactMatchRateDeltaVsQwen": metrics["exactMatchRate"] - qwen["exactMatchRate"],
            "qwenCer": "UNKNOWN",
            "cerDeltaVsQwen": "UNKNOWN",
            "qwenLatencyMeanMs": qwen["latencyMeanMs"],
            "latencyMeanDeltaMsVsQwen": round((sum(latencies) / len(latencies)) - qwen["latencyMeanMs"], 3),
            "qwenRepeatTextStableLines": qwen["repeatTextStableLines"],
            "confidenceComparison": "Qwen confidence presence is retained; confidence scales are not assumed comparable to PP-OCRv6 scores.",
        },
        "lineResults": line_results,
        "validation": validation,
        "frozenGoldGate": {
            "status": "PASSED" if validation_status == "PASSED" else "BLOCKED",
            "reasonCodes": sorted(set(validation_failures)) if validation_failures else ["declared_frozen_gold_floor_met"],
        },
        "routeDecision": {
            "BLOCK_OCR_ROUTE": True,
            "OCRProvider": {"enabled": False},
            "operationalActivation": False,
            "detDeferred": True,
            "chiKnowPoExpansion": "deferred_until_recognition_result_review",
            "activationDecision": "separate_activation_decision_required",
        },
        "retention": {
            "rawPredictionText": False,
            "rawModelOutput": False,
            "rawPixels": False,
            "retained": "hashes, metrics, fixed input locators, runtime/resource observations, validator references",
        },
    }
    return result


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--variant", choices=VARIANTS, required=True)
    parser.add_argument("--model-dir", type=Path, required=True)
    parser.add_argument("--gold-root", type=Path, required=True)
    parser.add_argument("--gold-closure", type=Path, required=True)
    parser.add_argument("--qwen-record", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--repeats", type=int, default=REPEATS_PER_LINE)
    return parser.parse_args()


def main() -> int:
    args = _parse_args()
    if args.repeats != REPEATS_PER_LINE:
        raise SystemExit(f"repeats_must_equal_{REPEATS_PER_LINE}")
    closure, targets = _load_targets(args.gold_root, args.gold_closure)
    qwen = _qwen_reference(args.qwen_record, closure)
    result = _run_variant(args.variant, args.model_dir, closure, targets, qwen)
    result["suite"]["goldRoot"] = str(args.gold_root.resolve())
    result["suite"]["goldClosure"] = str(args.gold_closure.resolve())
    result["suite"]["qwen"]["recordPath"] = str(args.qwen_record.resolve())
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(_canonical(result), encoding="utf-8")
    print(json.dumps({
        "variant": args.variant,
        "status": result["validation"]["status"],
        "exactMatchRuns": result["aggregate"]["exactMatchRuns"],
        "runsAttempted": result["aggregate"]["runsAttempted"],
        "characterErrorRate": result["aggregate"]["characterErrorRate"],
        "latencyMeanMs": result["aggregate"]["latencyMeanMs"],
        "peakRssMiB": result["aggregate"]["peakRssMiB"],
        "swap": result["aggregate"]["swap"],
        "output": str(args.output.resolve()),
    }, ensure_ascii=False, sort_keys=True))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (OSError, RuntimeError, ValueError, KeyError, json.JSONDecodeError) as exc:
        print(json.dumps({"status": "FAILED", "error": str(exc)}, ensure_ascii=False, sort_keys=True), file=sys.stderr)
        raise SystemExit(2)

#!/usr/bin/env python3
"""Prepare an ephemeral, hash-checked crop bundle for external OCR calls.

The bundle contains only the four already-closed frozen-gold line crops and a
short-lived manifest.  It is a transport surface for a synchronous candidate
comparison; it is not a repository evidence artifact.  The caller must delete
the bundle after the remote run.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import shutil
from pathlib import Path
from typing import Any, Mapping


CASE_ID = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._:-]{0,191}$")


def sha256_bytes(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def sha256_json(value: Any) -> str:
    encoded = json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode("utf-8")
    return sha256_bytes(encoded)


def pixel_digest(image: Any) -> tuple[str, list[int]]:
    image = image.convert("RGB")
    descriptor = f"RGB:{image.width}x{image.height}:".encode("ascii")
    return sha256_bytes(descriptor + image.tobytes()), [image.width, image.height]


def read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def build_manifest(gold_result_path: Path, gold_root: Path, output_dir: Path, qwen_run_path: Path | None) -> dict[str, Any]:
    try:
        from PIL import Image
    except ImportError as error:  # pragma: no cover - the Lab venv supplies Pillow
        raise RuntimeError("pillow_required_for_external_gold_bundle") from error

    gold_result = read_json(gold_result_path)
    output_dir.mkdir(parents=True, exist_ok=True)
    crops_dir = output_dir / "crops"
    crops_dir.mkdir(parents=True, exist_ok=True)
    cases: list[dict[str, Any]] = []
    line_count = 0

    for case in gold_result["cases"]:
        case_id = case["case_id"]
        if not CASE_ID.fullmatch(case_id):
            raise RuntimeError(f"invalid_case_id:{case_id}")
        fixture_path = gold_root / case["fixture"]["path"]
        if sha256_file(fixture_path) != case["fixture"]["sha256"]:
            raise RuntimeError(f"fixture_hash_mismatch:{case_id}")
        line_targets: list[dict[str, Any]] = []
        with Image.open(fixture_path) as source:
            source = source.convert("RGB")
            for target in case["line_targets"]:
                line_id = target["line_id"]
                box = tuple(int(value) for value in target["bbox_xyxy"])
                crop = source.crop(box)
                computed_pixel_hash, dimensions = pixel_digest(crop)
                if computed_pixel_hash != target["crop_pixel_sha256"]:
                    raise RuntimeError(f"crop_pixel_hash_mismatch:{case_id}:{line_id}")
                if dimensions != target["crop_dimensions"]:
                    raise RuntimeError(f"crop_dimensions_mismatch:{case_id}:{line_id}")
                safe_name = f"{case_id}--{line_id}.png"
                crop_path = crops_dir / safe_name
                crop.save(crop_path, format="PNG", optimize=False)
                line_targets.append(
                    {
                        "lineId": line_id,
                        "goldTextSha256": target["text_sha256"],
                        "goldCharacterCount": len(target["text"]),
                        "bbox": target["bbox_xyxy"],
                        "cropPixelSha256": target["crop_pixel_sha256"],
                        "cropDimensions": dimensions,
                        "orientation": target["orientation"],
                        "imagePath": str(crop_path.relative_to(output_dir)),
                        "imageMimeType": "image/png",
                        "imageSha256": sha256_file(crop_path),
                        # This value is used only in the ephemeral runner and is
                        # deliberately not emitted by the runner's evidence.
                        "goldText": target["text"],
                    }
                )
                line_count += 1
        cases.append(
            {
                "caseId": case_id,
                "domain": case["domain"],
                "fixtureSha256": case["fixture"]["sha256"],
                "lines": line_targets,
            }
        )

    qwen_baseline: Mapping[str, Any] = {
        "workerId": "qwen/qwen3.8-27b",
        "exactMatchRate": 0.75,
        "exactMatchRuns": 6,
        "runs": 8,
        "characterErrorRate": "UNKNOWN",
        "characterErrorRateReason": "raw Qwen prediction text was not retained",
        "latencyMeanMs": 842.145,
        "repeatTextStableLines": 4,
    }
    if qwen_run_path is not None:
        qwen_run = read_json(qwen_run_path)
        qwen_baseline = {
            "workerId": qwen_run.get("suite", {}).get("qwen", {}).get("model", "qwen/qwen3.8-27b"),
            "exactMatchRate": qwen_run.get("suite", {}).get("qwen", {}).get("exactMatchRate"),
            "exactMatchRuns": qwen_run.get("suite", {}).get("qwen", {}).get("exactMatchRuns"),
            "runs": qwen_run.get("suite", {}).get("qwen", {}).get("runs", 8),
            "characterErrorRate": qwen_run.get("suite", {}).get("qwen", {}).get("cer", "UNKNOWN"),
            "characterErrorRateReason": qwen_run.get("suite", {}).get("qwen", {}).get("cerReason"),
            "latencyMeanMs": qwen_run.get("suite", {}).get("qwen", {}).get("latencyMeanMs"),
            "repeatTextStableLines": qwen_run.get("suite", {}).get("qwen", {}).get("repeatTextStableLines"),
        }

    return {
        "schema": "google-external-ocr-frozen-gold-input-v1",
        "status": "EPHEMERAL_TRANSPORT_BUNDLE",
        "source": {
            "goldResultPath": str(gold_result_path),
            "goldResultSha256": sha256_file(gold_result_path),
            "sourceGoldSetSha256": gold_result["source_gold_set_sha256"],
            "caseCount": len(cases),
            "lineCount": line_count,
            "normalization": gold_result["recognition_gold"]["normalization"],
        },
        "protocol": {
            "providers": ["cloud_vision_document_text_detection", "document_ai_enterprise_document_ocr"],
            "repeatsPerLine": 2,
            "retryCount": 0,
            "fallbackUsed": False,
            "semanticCorrection": False,
            "historicalSourceJudgment": False,
            "search": False,
            "rawPredictionTextRetained": False,
            "rawApiResponseRetained": False,
        },
        "qwenBaseline": qwen_baseline,
        "cases": cases,
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--gold-result", type=Path, required=True)
    parser.add_argument("--gold-root", type=Path, required=True)
    parser.add_argument("--output-dir", type=Path, required=True)
    parser.add_argument("--qwen-run", type=Path)
    args = parser.parse_args()
    manifest = build_manifest(args.gold_result.resolve(), args.gold_root.resolve(), args.output_dir.resolve(), args.qwen_run.resolve() if args.qwen_run else None)
    manifest_path = args.output_dir.resolve() / "manifest.json"
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({
        "status": "PREPARED",
        "manifest": str(manifest_path),
        "sourceGoldSetSha256": manifest["source"]["sourceGoldSetSha256"],
        "caseCount": manifest["source"]["caseCount"],
        "lineCount": manifest["source"]["lineCount"],
        "cropFiles": sum(len(case["lines"]) for case in manifest["cases"]),
    }, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

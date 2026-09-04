#!/usr/bin/env python3
"""Run the native GPT-5.6 Luna OCR candidate on the frozen line crops.

The provider receives one cropped image and a transcription-only instruction.
Gold text, Qwen output, and Document AI output are loaded only for the local
post-response comparison.  Each measured repeat is one ephemeral Codex CLI
call; there is no retry, fallback, semantic correction, or route activation.
Only hashes and measurements are written to the closed record.
"""

from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path
import subprocess
import tempfile
import time
import unicodedata
from typing import Any, Mapping


REPO_ROOT = Path(__file__).resolve().parents[2]
LAB_ROOT = Path("/Users/hangyukim/Documents/malang_lab/documents/Web Research Broker Lab")
GOLD_ROOT = LAB_ROOT / "benchmark" / "historical-ocr-gold-v1"
SUITE_PATH = LAB_ROOT / "benchmark" / "historical-ocr-recognition-gemini-3-8-flash-v1" / "suite.json"
OUTPUT_PATH = REPO_ROOT / "artifacts" / "historical-ocr-luna-gpt56-frozen-gold-v1.json"
CODEX_BIN = Path("/Applications/ChatGPT.app/Contents/Resources/codex")
MODEL = "gpt-5.6-luna"
REPEATS = 2
PROMPT = (
    "Read only the attached frozen historical line crop. Return exactly one "
    "JSON object with exactly one key, transcription. The value must copy only "
    "visible glyphs in reading order, preserve traditional Chinese characters, "
    "use NFC, and contain no whitespace. Do not search, infer, translate, "
    "modernize, correct, use a dictionary, add commentary, or emit markdown."
)


def sha256_bytes(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def levenshtein(left: str, right: str) -> int:
    if len(left) < len(right):
        left, right = right, left
    previous = list(range(len(right) + 1))
    for index, left_char in enumerate(left, start=1):
        current = [index]
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


def _numeric_usage(value: Any) -> dict[str, int | None] | None:
    if not isinstance(value, Mapping):
        return None
    keys = {
        "input_tokens": ("input_tokens", "prompt_tokens"),
        "output_tokens": ("output_tokens", "completion_tokens"),
        "total_tokens": ("total_tokens",),
    }
    result: dict[str, int | None] = {}
    for output_key, input_keys in keys.items():
        result[output_key] = next(
            (
                value[name]
                for name in input_keys
                if isinstance(value.get(name), int) and not isinstance(value.get(name), bool) and value[name] >= 0
            ),
            None,
        )
    return result


def _event_text(value: Any) -> str | None:
    if not isinstance(value, Mapping):
        return None
    direct = value.get("text")
    if isinstance(direct, str) and direct:
        return direct
    output_text = value.get("output_text")
    if isinstance(output_text, str) and output_text:
        return output_text
    content = value.get("content")
    if isinstance(content, list):
        parts = [part.get("text") for part in content if isinstance(part, Mapping) and isinstance(part.get("text"), str)]
        if parts:
            return "".join(parts)
    return None


def _extract_cli_result(stdout: bytes) -> tuple[str | None, dict[str, int | None] | None, int]:
    """Extract only the final model text and numeric usage from JSONL events."""

    final_text: str | None = None
    usage: dict[str, int | None] | None = None
    event_count = 0
    for raw_line in stdout.splitlines():
        try:
            event = json.loads(raw_line.decode("utf-8"))
        except (UnicodeDecodeError, json.JSONDecodeError):
            continue
        event_count += 1
        if not isinstance(event, Mapping):
            continue
        event_usage = _numeric_usage(event.get("usage"))
        if event_usage is not None:
            usage = event_usage
        item = event.get("item")
        item_type = item.get("type") if isinstance(item, Mapping) else None
        if item_type in {"agent_message", "assistant_message", "message"}:
            candidate = _event_text(item)
            if candidate:
                final_text = candidate
        if event.get("type") in {"response.output_text.done", "output_text.done"}:
            candidate = _event_text(event)
            if candidate:
                final_text = candidate
    return final_text, usage, event_count


def _parse_transcription(final_text: str | None, gold_text: str) -> dict[str, Any]:
    parsed: Any = None
    if isinstance(final_text, str):
        try:
            parsed = json.loads(final_text)
        except json.JSONDecodeError:
            parsed = None
    json_valid = isinstance(parsed, dict)
    transcription = parsed.get("transcription") if json_valid else None
    strict = (
        json_valid
        and set(parsed.keys()) == {"transcription"}
        and isinstance(transcription, str)
        and unicodedata.normalize("NFC", transcription) == transcription
        and not any(char.isspace() for char in transcription)
    )
    prediction_hash = sha256_bytes(transcription.encode("utf-8")) if isinstance(transcription, str) else None
    cer = None
    if isinstance(transcription, str) and gold_text:
        cer = levenshtein(transcription, gold_text) / len(gold_text)
    return {
        "json_valid": json_valid,
        "strict_format": strict,
        "exact_match": bool(strict and prediction_hash == sha256_bytes(gold_text.encode("utf-8"))),
        "prediction_text_sha256": prediction_hash,
        "prediction_text_retained": False,
        "final_message_retained": False,
        "cer": round(cer, 9) if cer is not None else None,
    }


def _load_targets() -> list[dict[str, Any]]:
    suite = json.loads(SUITE_PATH.read_text(encoding="utf-8"))
    gold_index = json.loads((GOLD_ROOT / "gold-set-v1.json").read_text(encoding="utf-8"))
    by_id = {item["case_id"]: item for item in gold_index["cases"]}
    targets: list[dict[str, Any]] = []
    for case_id in suite["cases"]:
        entry = by_id[case_id]
        case_path = GOLD_ROOT / entry["path"]
        case = json.loads(case_path.read_text(encoding="utf-8"))
        fixture_meta = case["source"]["fixture"]
        fixture_path = GOLD_ROOT / fixture_meta["path"]
        lines = {line["line_id"]: line for line in case["layout_gold"]["lines"]}
        for target in case["recognition_gold"]["line_targets"]:
            line = lines[target["line_id"]]
            gold_text = unicodedata.normalize("NFC", target["text"])
            if any(char.isspace() for char in gold_text):
                raise RuntimeError("gold_text_contains_whitespace")
            targets.append(
                {
                    "case_id": case_id,
                    "domain": case["domain"],
                    "case_file_sha256": sha256_file(case_path),
                    "line_id": target["line_id"],
                    "gold_text": gold_text,
                    "gold_text_sha256": sha256_bytes(gold_text.encode("utf-8")),
                    "bbox_xyxy": line["bbox_xyxy"],
                    "reading_order_index": line["reading_order_index"],
                    "fixture_sha256": fixture_meta["sha256"],
                    "fixture_actual_sha256": sha256_file(fixture_path),
                    "fixture_dimensions": [fixture_meta["width"], fixture_meta["height"]],
                    "fixture_path": fixture_path,
                }
            )
    if len(targets) != 4:
        raise RuntimeError("frozen_suite_did_not_resolve_to_four_lines")
    return targets


def _make_crop(target: Mapping[str, Any], destination: Path) -> dict[str, Any]:
    try:
        from PIL import Image
    except ImportError as exc:  # pragma: no cover
        raise RuntimeError("pillow_required") from exc
    with Image.open(target["fixture_path"]) as image:
        rgb = image.convert("RGB")
        x0, y0, x1, y1 = [int(value) for value in target["bbox_xyxy"]]
        crop = rgb.crop((x0, y0, x1, y1))
        crop.save(destination, format="PNG", optimize=False, compress_level=6)
        pixel_descriptor = ("RGB:%dx%d:" % (crop.width, crop.height)).encode("ascii")
        return {
            "crop_pixel_sha256": sha256_bytes(pixel_descriptor + crop.tobytes()),
            "crop_png_sha256": sha256_file(destination),
            "crop_dimensions": [crop.width, crop.height],
        }


def _call_luna(image_path: Path, schema_path: Path, codex_home: Path) -> dict[str, Any]:
    args = [
        str(CODEX_BIN),
        "exec",
        "--ephemeral",
        "--ignore-user-config",
        "--ignore-rules",
        "--skip-git-repo-check",
        "--sandbox",
        "read-only",
        "--color",
        "never",
        "--json",
        "--model",
        MODEL,
        "--image",
        str(image_path),
        "--output-schema",
        str(schema_path),
        "--cd",
        "/private/tmp",
        PROMPT,
    ]
    started = time.perf_counter_ns()
    child_env = os.environ.copy()
    child_env["CODEX_HOME"] = str(codex_home)
    timed_out = False
    try:
        process = subprocess.run(
            args,
            stdin=subprocess.DEVNULL,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            check=False,
            env=child_env,
            timeout=180,
        )
        stdout = process.stdout
        stderr = process.stderr
        exit_code = int(process.returncode)
    except subprocess.TimeoutExpired as exc:
        timed_out = True
        stdout = exc.stdout if isinstance(exc.stdout, bytes) else (exc.stdout or "").encode("utf-8")
        stderr = exc.stderr if isinstance(exc.stderr, bytes) else (exc.stderr or "").encode("utf-8")
        exit_code = 124
    wall_ms = (time.perf_counter_ns() - started) / 1_000_000
    final_text, usage, event_count = _extract_cli_result(stdout)
    return {
        "transport": "native_codex_cli",
        "model": MODEL,
        "router_used": False,
        "http_status": None,
        "process_exit_code": exit_code,
        "timed_out": timed_out,
        "wall_time_ms": round(wall_ms, 3),
        "stdout_sha256": sha256_bytes(stdout),
        "stderr_sha256": sha256_bytes(stderr),
        "final_output_sha256": sha256_bytes(final_text.encode("utf-8")) if final_text is not None else None,
        "event_count": event_count,
        "usage": usage,
        "provider_response_retained": False,
        "stderr_retained": False,
        "final_message_retained": False,
        "final_text": final_text,
    }


def run() -> dict[str, Any]:
    if not CODEX_BIN.exists():
        raise RuntimeError("codex_cli_not_found")
    targets = _load_targets()
    suite_sha256 = sha256_file(SUITE_PATH)
    gold_sha256 = sha256_file(GOLD_ROOT / "gold-set-v1.json")
    output_lines: list[dict[str, Any]] = []
    dispatch_count = 0
    stop_reason: str | None = None
    with tempfile.TemporaryDirectory(prefix="historical-ocr-luna-") as temporary:
        temp_root = Path(temporary)
        schema_path = temp_root / "transcription-schema.json"
        schema_path.write_text(
            json.dumps(
                {
                    "type": "object",
                    "additionalProperties": False,
                    "required": ["transcription"],
                    "properties": {"transcription": {"type": "string"}},
                },
                separators=(",", ":"),
            ),
            encoding="utf-8",
        )
        isolated_codex_home = temp_root / "codex-home"
        isolated_codex_home.mkdir()
        os.symlink("/Users/hangyukim/.codex/auth.json", isolated_codex_home / "auth.json")
        for target_index, target in enumerate(targets):
            crop_path = temp_root / f"line-{target_index + 1}.png"
            crop_meta = _make_crop(target, crop_path)
            line_record = {
                "case_id": target["case_id"],
                "domain": target["domain"],
                "case_file_sha256": target["case_file_sha256"],
                "line_id": target["line_id"],
                "gold_text_sha256": target["gold_text_sha256"],
                "gold_text_length": len(target["gold_text"]),
                "bbox_xyxy": target["bbox_xyxy"],
                "reading_order_index": target["reading_order_index"],
                "fixture_sha256": target["fixture_sha256"],
                "fixture_actual_sha256": target["fixture_actual_sha256"],
                "fixture_dimensions": target["fixture_dimensions"],
                **crop_meta,
                "runs": [],
            }
            for repeat in range(1, REPEATS + 1):
                if stop_reason is not None:
                    break
                dispatch_count += 1
                call = _call_luna(crop_path, schema_path, isolated_codex_home)
                final_text = call.pop("final_text")
                call.update(_parse_transcription(final_text, target["gold_text"]))
                call.update(
                    {
                        "repeat": repeat,
                        "request_count": 1,
                        "retry_count": 0,
                        "fallback_used": False,
                        "provider_input": {
                            "image_only_source": True,
                            "gold_text_sent": False,
                            "qwen_output_sent": False,
                            "document_ai_output_sent": False,
                            "semantic_correction": False,
                        },
                    }
                )
                line_record["runs"].append(call)
                if call["process_exit_code"] != 0:
                    stop_reason = "provider_request_failed_without_retry"
            runs = line_record["runs"]
            line_record["repeat_text_stable"] = (
                len({run["prediction_text_sha256"] for run in runs}) == 1
                if len(runs) == REPEATS and all(run["prediction_text_sha256"] is not None for run in runs)
                else False
            )
            line_record["repeat_strict_stable"] = (
                len({run["strict_format"] for run in runs}) == 1 if len(runs) == REPEATS else False
            )
            line_record["repeat_exact_stable"] = (
                len({run["exact_match"] for run in runs}) == 1 if len(runs) == REPEATS else False
            )
            output_lines.append(line_record)
            if stop_reason is not None:
                break

    all_runs = [run for line in output_lines for run in line["runs"]]
    exact_runs = sum(1 for run in all_runs if run["exact_match"])
    strict_runs = sum(1 for run in all_runs if run["strict_format"])
    json_runs = sum(1 for run in all_runs if run["json_valid"])
    cer_values = [run["cer"] for run in all_runs if isinstance(run["cer"], (int, float))]
    latency_values = [run["wall_time_ms"] for run in all_runs]
    usage_values = [run["usage"] for run in all_runs if isinstance(run["usage"], Mapping)]
    candidate_status = (
        "observed_but_below_pass_floor"
        if stop_reason is None and exact_runs < len(all_runs)
        else "unproven"
        if stop_reason is not None or not all_runs
        else "passed_observed_cases"
    )
    result = {
        "schema": "hermes-historical-ocr-luna-gpt56-frozen-gold-v1",
        "status": "closed_record",
        "recorded_on": "2026-09-04",
        "candidate": {
            "provider": "OpenAI Codex native",
            "model": MODEL,
            "transport": "codex exec --ephemeral",
            "router_used": False,
            "codex_cli_path": str(CODEX_BIN),
        },
        "source": {
            "suite_path": str(SUITE_PATH),
            "suite_sha256": suite_sha256,
            "gold_set": "historical-ocr-gold-v1",
            "gold_set_sha256": gold_sha256,
            "line_count": 4,
            "repeats_per_line": REPEATS,
        },
        "conditions": {
            "input": "frozen_gold_line_crop_as_attached_image",
            "image_only_source": True,
            "strict_transcription_only": True,
            "output_schema": {"exact_keys": ["transcription"]},
            "gold_text_sent": False,
            "qwen_output_sent": False,
            "document_ai_output_sent": False,
            "semantic_correction": False,
            "fallback_used": False,
            "retry_count": 0,
            "ephemeral_session": True,
            "read_only_workspace": True,
            "temporary_crop_directory_deleted": True,
            "temporary_codex_home_deleted": True,
            "credential_copied": False,
            "requested_dispatches": len(targets) * REPEATS,
            "dispatch_count": dispatch_count,
            "stopped_without_retry": True,
        },
        "lines": output_lines,
        "aggregate": {
            "lines_attempted": len(output_lines),
            "runs_attempted": len(all_runs),
            "json_valid_runs": json_runs,
            "strict_format_runs": strict_runs,
            "exact_match_runs": exact_runs,
            "strict_rate": strict_runs / len(all_runs) if all_runs else None,
            "exact_rate": exact_runs / len(all_runs) if all_runs else None,
            "cer_mean": round(sum(cer_values) / len(cer_values), 9) if cer_values else None,
            "cer_observed_runs": len(cer_values),
            "repeat_text_stable_lines": sum(1 for line in output_lines if line["repeat_text_stable"]),
            "repeat_strict_stable_lines": sum(1 for line in output_lines if line["repeat_strict_stable"]),
            "repeat_exact_stable_lines": sum(1 for line in output_lines if line["repeat_exact_stable"]),
            "latency_mean_ms": round(sum(latency_values) / len(latency_values), 3) if latency_values else None,
            "latency_min_ms": min(latency_values) if latency_values else None,
            "latency_max_ms": max(latency_values) if latency_values else None,
            "input_tokens_total": sum(v["input_tokens"] for v in usage_values if v.get("input_tokens") is not None) or None,
            "output_tokens_total": sum(v["output_tokens"] for v in usage_values if v.get("output_tokens") is not None) or None,
            "total_tokens_total": sum(v["total_tokens"] for v in usage_values if v.get("total_tokens") is not None) or None,
            "cost_basis": "OpenAI Codex subscription route; per-request monetary billing not exposed in this record",
        },
        "decision": {
            "recognition_candidate": candidate_status,
            "hire": False,
            "operational_ocr_candidate": False,
            "stop_reason": stop_reason,
            "route": "BLOCK_OCR_ROUTE",
            "ocr_provider_enabled": False,
            "activation": False,
        },
        "retention": {
            "gold_text_retained": False,
            "prediction_text_retained": False,
            "raw_provider_response_retained": False,
            "raw_prompt_retained": False,
            "raw_pixels_retained": False,
            "credential_retained": False,
            "qwen_or_document_ai_payload_retained": False,
        },
        "non_changes": {
            "BLOCK_OCR_ROUTE": True,
            "OCRProvider.enabled": False,
            "semantic_correction": False,
            "silent_fallback": False,
            "activation": False,
            "detection_changed": False,
        },
    }
    return result


if __name__ == "__main__":
    OUTPUT_PATH.write_text(json.dumps(run(), ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(OUTPUT_PATH)

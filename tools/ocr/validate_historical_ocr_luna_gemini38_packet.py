#!/usr/bin/env python3
"""Independently validate the Luna/Gemini/Document AI candidate packet."""

from __future__ import annotations

import copy
import hashlib
import json
import math
from pathlib import Path
from typing import Any, Mapping


REPO_ROOT = Path(__file__).resolve().parents[2]
LAB_ROOT = Path("/Users/hangyukim/Documents/malang_lab/documents/Web Research Broker Lab")
LUNA_RESULT = REPO_ROOT / "artifacts" / "historical-ocr-luna-gpt56-frozen-gold-v1.json"
PACKET = REPO_ROOT / "artifacts" / "historical-ocr-luna-gemini38-document-ai-comparison-v1.json"
GEMINI_RESULT = LAB_ROOT / "benchmark" / "historical-ocr-recognition-gemini-3-8-flash-v1" / "result-2026-09-03.json"
DOCUMENT_AI_RESULT = REPO_ROOT / "artifacts" / "historical-ocr-bounded-ocr-operational-shadow-v1.json"
GOLD_ROOT = LAB_ROOT / "benchmark" / "historical-ocr-gold-v1"
SUITE_PATH = LAB_ROOT / "benchmark" / "historical-ocr-recognition-gemini-3-8-flash-v1" / "suite.json"
LINE_IDS = [
    "saju-main-title-line",
    "saju-folio-line",
    "ziwei-title-line",
    "astrology-title-line",
]
FORBIDDEN_KEYS = {
    "prompt", "raw_prompt", "response", "response_body", "raw_response", "body",
    "credential", "api_key", "secret", "transcription", "final_text",
    "prediction_text", "response_text", "pixel_bytes", "stdout", "stderr",
}


def sha256_file(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def canonical_bytes(value: Mapping[str, Any]) -> bytes:
    clone = copy.deepcopy(dict(value))
    clone.pop("packet_sha256", None)
    return (json.dumps(clone, ensure_ascii=False, sort_keys=True, separators=(",", ":")) + "\n").encode("utf-8")


def walk_forbidden(value: Any, path: str = "root") -> list[str]:
    errors: list[str] = []
    if isinstance(value, Mapping):
        for key, child in value.items():
            if key in FORBIDDEN_KEYS:
                errors.append(f"{path}.{key}: forbidden raw field")
            errors.extend(walk_forbidden(child, f"{path}.{key}"))
    elif isinstance(value, list):
        for index, child in enumerate(value):
            errors.extend(walk_forbidden(child, f"{path}[{index}]"))
    return errors


def close(value: Any, expected: Any) -> bool:
    if isinstance(value, float) or isinstance(expected, float):
        return isinstance(value, (int, float)) and math.isclose(float(value), float(expected), rel_tol=1e-9, abs_tol=1e-9)
    return value == expected


def luna_line_flags(result: Mapping[str, Any]) -> list[dict[str, Any]]:
    return [
        {
            "line_id": line.get("line_id"),
            "exact_flags": [bool(run.get("exact_match")) for run in line.get("runs", [])],
            "strict_flags": [bool(run.get("strict_format")) for run in line.get("runs", [])],
            "repeat_text_stable": line.get("repeat_text_stable"),
            "repeat_exact_stable": line.get("repeat_exact_stable"),
        }
        for line in result.get("lines", [])
    ]


def gemini_line_flags(result: Mapping[str, Any]) -> list[dict[str, Any]]:
    output = []
    for case in result.get("cases", []):
        for line in case.get("lines", []):
            output.append(
                {
                    "line_id": line.get("line_id"),
                    "exact_flags": [bool(run.get("exact_match")) for run in line.get("runs", [])],
                    "strict_flags": [bool(run.get("strict_format")) for run in line.get("runs", [])],
                    "repeat_text_stable": line.get("repeat_text_stable"),
                    "repeat_exact_stable": line.get("repeat_exact_stable"),
                }
            )
    return output


def document_line_flags(result: Mapping[str, Any]) -> list[dict[str, Any]]:
    return [
        {
            "line_id": line.get("lineId"),
            "exact_flags": list(line.get("documentAi", {}).get("exactFlags", [])),
            "repeat_text_stable": line.get("documentAi", {}).get("repeatStable"),
            "repeat_exact_stable": line.get("documentAi", {}).get("repeatStable"),
        }
        for line in result.get("agreementConflict", {}).get("lineResults", [])
    ]


def compare(candidate: list[dict[str, Any]], document: list[dict[str, Any]]) -> dict[str, Any]:
    candidate_by_id = {line["line_id"]: line for line in candidate}
    document_by_id = {line["line_id"]: line for line in document}
    relations = []
    for line_id in LINE_IDS:
        candidate_flags = candidate_by_id[line_id]["exact_flags"]
        document_flags = document_by_id[line_id]["exact_flags"]
        if candidate_flags == document_flags:
            relation = "AGREEMENT_SAME_EXACT_FLAGS"
        elif all(document_flags) and not all(candidate_flags):
            relation = (
                "COMPLEMENT_DOCUMENT_AI_ONLY_STABLE_EXACT"
                if not any(candidate_flags)
                else "CONFLICT_DOCUMENT_AI_STABLE_EXACT_CANDIDATE_REPEAT_VARIANCE"
            )
        elif all(candidate_flags) and not all(document_flags):
            relation = "COMPLEMENT_CANDIDATE_ONLY_STABLE_EXACT"
        else:
            relation = "CONFLICT_EXACT_FLAGS"
        relations.append(
            {
                "line_id": line_id,
                "candidate_exact_flags": candidate_flags,
                "document_ai_exact_flags": document_flags,
                "paired_record_agreement": sum(a == b for a, b in zip(candidate_flags, document_flags)),
                "paired_record_count": min(len(candidate_flags), len(document_flags)),
                "relation": relation,
            }
        )
    paired_count = sum(item["paired_record_count"] for item in relations)
    paired_agreement = sum(item["paired_record_agreement"] for item in relations)
    agreement_count = sum(item["relation"] == "AGREEMENT_SAME_EXACT_FLAGS" for item in relations)
    return {
        "line_relations": relations,
        "line_agreement_count": agreement_count,
        "line_conflict_count": len(relations) - agreement_count,
        "paired_record_agreement": paired_agreement,
        "paired_record_conflict": paired_count - paired_agreement,
        "paired_record_count": paired_count,
        "complementarity": {
            "document_ai_only_stable_exact_line_ids": [
                item["line_id"] for item in relations if item["relation"] == "COMPLEMENT_DOCUMENT_AI_ONLY_STABLE_EXACT"
            ],
            "candidate_only_stable_exact_line_ids": [
                item["line_id"] for item in relations if item["relation"] == "COMPLEMENT_CANDIDATE_ONLY_STABLE_EXACT"
            ],
            "candidate_repeat_variance_against_document_ai_line_ids": [
                item["line_id"]
                for item in relations
                if item["relation"] == "CONFLICT_DOCUMENT_AI_STABLE_EXACT_CANDIDATE_REPEAT_VARIANCE"
            ],
            "raw_text_complementarity": "NOT_ASSESSABLE_RAW_TEXT_NOT_RETAINED",
        },
    }


def validate_luna(result: Mapping[str, Any]) -> list[str]:
    errors = walk_forbidden(result)
    if result.get("schema") != "hermes-historical-ocr-luna-gpt56-frozen-gold-v1":
        errors.append("luna_schema")
    if result.get("status") != "closed_record":
        errors.append("luna_status")
    candidate = result.get("candidate", {})
    for key, expected in {
        "provider": "OpenAI Codex native",
        "model": "gpt-5.6-luna",
        "transport": "codex exec --ephemeral",
        "router_used": False,
    }.items():
        if candidate.get(key) != expected:
            errors.append("luna_candidate_" + key)
    source = result.get("source", {})
    if source.get("line_count") != 4 or source.get("repeats_per_line") != 2:
        errors.append("luna_source_cardinality")
    if source.get("gold_set") != "historical-ocr-gold-v1" or source.get("gold_set_sha256") != sha256_file(GOLD_ROOT / "gold-set-v1.json"):
        errors.append("luna_gold_binding")
    if source.get("suite_sha256") != sha256_file(SUITE_PATH):
        errors.append("luna_suite_binding")
    conditions = result.get("conditions", {})
    for key, expected in {
        "image_only_source": True,
        "strict_transcription_only": True,
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
        "requested_dispatches": 8,
        "dispatch_count": 8,
        "stopped_without_retry": True,
    }.items():
        if conditions.get(key) != expected:
            errors.append("luna_condition_" + key)
    lines = result.get("lines")
    if not isinstance(lines, list) or [line.get("line_id") for line in lines] != LINE_IDS:
        errors.append("luna_line_order")
        lines = lines if isinstance(lines, list) else []
    all_runs = []
    for line in lines:
        runs = line.get("runs") if isinstance(line, Mapping) else None
        if not isinstance(runs, list) or len(runs) != 2:
            errors.append("luna_repeat_cardinality")
            continue
        for run in runs:
            all_runs.append(run)
            for key, expected in {
                "transport": "native_codex_cli",
                "model": "gpt-5.6-luna",
                "router_used": False,
                "process_exit_code": 0,
                "timed_out": False,
                "request_count": 1,
                "retry_count": 0,
                "fallback_used": False,
                "provider_response_retained": False,
                "stderr_retained": False,
                "final_message_retained": False,
                "prediction_text_retained": False,
            }.items():
                if run.get(key) != expected:
                    errors.append("luna_run_" + key)
            for key in ("stdout_sha256", "stderr_sha256", "final_output_sha256", "prediction_text_sha256"):
                value = run.get(key)
                if value is not None and (not isinstance(value, str) or len(value) != 64 or any(c not in "0123456789abcdef" for c in value)):
                    errors.append("luna_hash_" + key)
            provider_input = run.get("provider_input", {})
            for key, expected in {
                "image_only_source": True,
                "gold_text_sent": False,
                "qwen_output_sent": False,
                "document_ai_output_sent": False,
                "semantic_correction": False,
            }.items():
                if provider_input.get(key) != expected:
                    errors.append("luna_provider_input_" + key)
        exact = [bool(run.get("exact_match")) for run in runs]
        strict = [bool(run.get("strict_format")) for run in runs]
        text_hashes = [run.get("prediction_text_sha256") for run in runs]
        expected_text_stable = text_hashes[0] is not None and text_hashes[0] == text_hashes[1]
        if line.get("repeat_text_stable") != expected_text_stable:
            errors.append("luna_text_stability")
        if line.get("repeat_strict_stable") != (strict[0] == strict[1]):
            errors.append("luna_strict_stability")
        if line.get("repeat_exact_stable") != (exact[0] == exact[1]):
            errors.append("luna_exact_stability")
    aggregate = result.get("aggregate", {})
    cer_values = [run.get("cer") for run in all_runs if isinstance(run.get("cer"), (int, float))]
    latencies = [run.get("wall_time_ms") for run in all_runs if isinstance(run.get("wall_time_ms"), (int, float))]
    usage = [run.get("usage") for run in all_runs if isinstance(run.get("usage"), Mapping)]
    expected_aggregate = {
        "lines_attempted": len(lines),
        "runs_attempted": len(all_runs),
        "json_valid_runs": sum(bool(run.get("json_valid")) for run in all_runs),
        "strict_format_runs": sum(bool(run.get("strict_format")) for run in all_runs),
        "exact_match_runs": sum(bool(run.get("exact_match")) for run in all_runs),
        "strict_rate": sum(bool(run.get("strict_format")) for run in all_runs) / len(all_runs) if all_runs else None,
        "exact_rate": sum(bool(run.get("exact_match")) for run in all_runs) / len(all_runs) if all_runs else None,
        "cer_mean": round(sum(cer_values) / len(cer_values), 9) if cer_values else None,
        "cer_observed_runs": len(cer_values),
        "repeat_text_stable_lines": sum(bool(line.get("repeat_text_stable")) for line in lines),
        "repeat_strict_stable_lines": sum(bool(line.get("repeat_strict_stable")) for line in lines),
        "repeat_exact_stable_lines": sum(bool(line.get("repeat_exact_stable")) for line in lines),
        "latency_mean_ms": round(sum(latencies) / len(latencies), 3) if latencies else None,
        "latency_min_ms": min(latencies) if latencies else None,
        "latency_max_ms": max(latencies) if latencies else None,
        "input_tokens_total": sum(v["input_tokens"] for v in usage if v.get("input_tokens") is not None) or None,
        "output_tokens_total": sum(v["output_tokens"] for v in usage if v.get("output_tokens") is not None) or None,
        "total_tokens_total": sum(v["total_tokens"] for v in usage if v.get("total_tokens") is not None) or None,
    }
    for key, expected in expected_aggregate.items():
        if not close(aggregate.get(key), expected):
            errors.append("luna_aggregate_" + key)
    if result.get("decision", {}).get("route") != "BLOCK_OCR_ROUTE" or result.get("decision", {}).get("ocr_provider_enabled") is not False or result.get("decision", {}).get("activation") is not False:
        errors.append("luna_decision_boundary")
    if result.get("non_changes", {}).get("BLOCK_OCR_ROUTE") is not True or result.get("non_changes", {}).get("OCRProvider.enabled") is not False:
        errors.append("luna_non_changes_boundary")
    return errors


def validate_packet(packet: Mapping[str, Any], luna: Mapping[str, Any], gemini: Mapping[str, Any], document: Mapping[str, Any]) -> list[str]:
    errors = walk_forbidden(packet)
    if packet.get("schema") != "hermes-historical-ocr-luna-gemini38-document-ai-comparison-v1" or packet.get("status") != "CANDIDATE_EVIDENCE_ONLY":
        errors.append("packet_schema_status")
    if packet.get("packet_sha256") != hashlib.sha256(canonical_bytes(packet)).hexdigest():
        errors.append("packet_content_hash")
    for key, source_path in {"luna": LUNA_RESULT, "gemini_3_8": GEMINI_RESULT, "document_ai": DOCUMENT_AI_RESULT}.items():
        entry = packet.get("source_records", {}).get(key, {})
        if entry.get("path") != str(source_path) or entry.get("sha256") != sha256_file(source_path):
            errors.append("packet_source_" + key)
    frozen = packet.get("frozen_input", {})
    if frozen.get("line_ids") != LINE_IDS or frozen.get("repeats_per_line") != 2:
        errors.append("packet_frozen_line_contract")
    if frozen.get("gold_set_sha256") != luna.get("source", {}).get("gold_set_sha256") or frozen.get("suite_sha256") != luna.get("source", {}).get("suite_sha256"):
        errors.append("packet_frozen_hash_binding")
    provider_input = frozen.get("provider_input_contract", {})
    for key, expected in {"image_only": True, "gold_text_sent": False, "qwen_output_sent": False, "document_ai_output_sent": False, "strict_transcription_only": True}.items():
        if provider_input.get(key) != expected:
            errors.append("packet_provider_input_" + key)
    expected_workers = {
        "luna": luna_line_flags(luna),
        "gemini_3_8": gemini_line_flags(gemini),
        "document_ai": document_line_flags(document),
    }
    for name, expected_lines in expected_workers.items():
        actual = packet.get("workers", {}).get(name, {}).get("line_outcomes")
        if actual != expected_lines:
            errors.append("packet_line_outcomes_" + name)
    actual_luna = packet.get("comparisons", {}).get("luna_vs_document_ai")
    actual_gemini = packet.get("comparisons", {}).get("gemini_3_8_vs_document_ai")
    expected_luna = compare(expected_workers["luna"], expected_workers["document_ai"])
    expected_gemini = compare(expected_workers["gemini_3_8"], expected_workers["document_ai"])
    if actual_luna != expected_luna:
        errors.append("packet_luna_comparison")
    if actual_gemini != expected_gemini:
        errors.append("packet_gemini_comparison")
    decision = packet.get("decision", {})
    for key, expected in {"winner": None, "recognition_candidate_promotion": "DO_NOT_PROMOTE", "activation_gate": "DO_NOT_OPEN"}.items():
        if decision.get(key) != expected:
            errors.append("packet_decision_" + key)
    boundary = packet.get("route_boundary", {})
    for key, expected in {"BLOCK_OCR_ROUTE": True, "OCRProvider.enabled": False, "activation": False, "semantic_correction": False, "silent_fallback": False, "detection_slot_touched": False, "processor_mutation": False}.items():
        if boundary.get(key) != expected:
            errors.append("packet_boundary_" + key)
    return errors


def validate() -> dict[str, Any]:
    try:
        luna = json.loads(LUNA_RESULT.read_text(encoding="utf-8"))
        packet = json.loads(PACKET.read_text(encoding="utf-8"))
        gemini = json.loads(GEMINI_RESULT.read_text(encoding="utf-8"))
        document = json.loads(DOCUMENT_AI_RESULT.read_text(encoding="utf-8"))
    except Exception as exc:
        return {"schema": "hermes-historical-ocr-luna-gemini38-validator-v1", "status": "FAIL", "errors": ["load:" + str(exc)]}
    luna_errors = validate_luna(luna)
    packet_errors = validate_packet(packet, luna, gemini, document)
    errors = luna_errors + packet_errors
    return {
        "schema": "hermes-historical-ocr-luna-gemini38-validator-v1",
        "status": "PASS" if not errors else "FAIL",
        "luna_errors": luna_errors,
        "packet_errors": packet_errors,
        "checked_records": {
            "luna_sha256": sha256_file(LUNA_RESULT),
            "packet_sha256": sha256_file(PACKET),
            "gemini_3_8_sha256": sha256_file(GEMINI_RESULT),
            "document_ai_sha256": sha256_file(DOCUMENT_AI_RESULT),
        },
    }


if __name__ == "__main__":
    print(json.dumps(validate(), ensure_ascii=False, sort_keys=True))

#!/usr/bin/env python3
"""Build a recognition-only comparison packet from closed candidate records.

This packet consumes only hashes, metrics, and exact booleans.  It never reads
or reconstructs candidate transcription strings, and it has no routing effect.
"""

from __future__ import annotations

import copy
import hashlib
import json
from pathlib import Path
from typing import Any, Mapping


REPO_ROOT = Path(__file__).resolve().parents[2]
LAB_ROOT = Path("/Users/hangyukim/Documents/malang_lab/documents/Web Research Broker Lab")
LUNA_RESULT = REPO_ROOT / "artifacts" / "historical-ocr-luna-gpt56-frozen-gold-v1.json"
GEMINI_RESULT = LAB_ROOT / "benchmark" / "historical-ocr-recognition-gemini-3-8-flash-v1" / "result-2026-09-03.json"
DOCUMENT_AI_RESULT = REPO_ROOT / "artifacts" / "historical-ocr-bounded-ocr-operational-shadow-v1.json"
OUTPUT_PATH = REPO_ROOT / "artifacts" / "historical-ocr-luna-gemini38-document-ai-comparison-v1.json"
LINE_IDS = [
    "saju-main-title-line",
    "saju-folio-line",
    "ziwei-title-line",
    "astrology-title-line",
]


def sha256_file(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def canonical_bytes(packet: Mapping[str, Any]) -> bytes:
    value = copy.deepcopy(dict(packet))
    value.pop("packet_sha256", None)
    return (json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":")) + "\n").encode("utf-8")


def _mean(values: list[float]) -> float | None:
    return round(sum(values) / len(values), 9) if values else None


def _line_flags(lines: list[Mapping[str, Any]], *, nested: bool = False) -> list[dict[str, Any]]:
    result = []
    for line in lines:
        runs = line.get("runs") if isinstance(line.get("runs"), list) else []
        result.append(
            {
                "line_id": line.get("line_id"),
                "exact_flags": [bool(run.get("exact_match")) for run in runs if isinstance(run, Mapping)],
                "strict_flags": [bool(run.get("strict_format")) for run in runs if isinstance(run, Mapping)],
                "repeat_text_stable": line.get("repeat_text_stable"),
                "repeat_exact_stable": line.get("repeat_exact_stable"),
            }
        )
    return result


def _gemini_lines(result: Mapping[str, Any]) -> list[dict[str, Any]]:
    lines: list[dict[str, Any]] = []
    for case in result.get("cases", []):
        for line in case.get("lines", []):
            lines.append(
                {
                    "line_id": line.get("line_id"),
                    "runs": line.get("runs", []),
                    "repeat_text_stable": line.get("repeat_text_stable"),
                    "repeat_exact_stable": line.get("repeat_exact_stable"),
                }
            )
    return lines


def _document_ai_lines(result: Mapping[str, Any]) -> list[dict[str, Any]]:
    output = []
    for line in result.get("agreementConflict", {}).get("lineResults", []):
        document = line.get("documentAi", {})
        output.append(
            {
                "line_id": line.get("lineId"),
                "exact_flags": list(document.get("exactFlags", [])),
                "repeat_text_stable": document.get("repeatStable"),
                "repeat_exact_stable": document.get("repeatStable"),
            }
        )
    return output


def _compare(candidate: list[dict[str, Any]], document_ai: list[dict[str, Any]]) -> dict[str, Any]:
    by_candidate = {line["line_id"]: line for line in candidate}
    by_document = {line["line_id"]: line for line in document_ai}
    relations = []
    for line_id in LINE_IDS:
        candidate_line = by_candidate[line_id]
        document_line = by_document[line_id]
        candidate_flags = candidate_line["exact_flags"]
        document_flags = document_line["exact_flags"]
        if candidate_flags == document_flags:
            relation = "AGREEMENT_SAME_EXACT_FLAGS"
        elif all(document_flags) and not all(candidate_flags):
            if not any(candidate_flags):
                relation = "COMPLEMENT_DOCUMENT_AI_ONLY_STABLE_EXACT"
            else:
                relation = "CONFLICT_DOCUMENT_AI_STABLE_EXACT_CANDIDATE_REPEAT_VARIANCE"
        elif all(candidate_flags) and not all(document_flags):
            relation = "COMPLEMENT_CANDIDATE_ONLY_STABLE_EXACT"
        else:
            relation = "CONFLICT_EXACT_FLAGS"
        paired_agreement = sum(a == b for a, b in zip(candidate_flags, document_flags))
        relations.append(
            {
                "line_id": line_id,
                "candidate_exact_flags": candidate_flags,
                "document_ai_exact_flags": document_flags,
                "paired_record_agreement": paired_agreement,
                "paired_record_count": min(len(candidate_flags), len(document_flags)),
                "relation": relation,
            }
        )
    paired_agreement = sum(item["paired_record_agreement"] for item in relations)
    paired_count = sum(item["paired_record_count"] for item in relations)
    line_agreement = sum(1 for item in relations if item["relation"] == "AGREEMENT_SAME_EXACT_FLAGS")
    return {
        "line_relations": relations,
        "line_agreement_count": line_agreement,
        "line_conflict_count": len(relations) - line_agreement,
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


def _worker_metrics(luna: Mapping[str, Any], gemini: Mapping[str, Any], document_ai: Mapping[str, Any]) -> dict[str, Any]:
    luna_aggregate = luna.get("aggregate", {})
    gemini_aggregate = gemini.get("aggregate", {})
    document_worker = next(
        worker
        for worker in document_ai.get("workers", [])
        if worker.get("workerId") == "document-ai-enterprise-document-ocr-optimized-request-v2.1.1-adc"
    )
    def basic(record: Mapping[str, Any], aggregate: Mapping[str, Any], *, cer_status: str) -> dict[str, Any]:
        return {
            "model": record.get("candidate", {}).get("model") or record.get("model"),
            "provider": record.get("candidate", {}).get("provider") or record.get("provider"),
            "exact_runs": aggregate.get("exact_match_runs") or aggregate.get("exactRuns"),
            "exact_rate": aggregate.get("exact_rate") or aggregate.get("exactRate"),
            "cer": aggregate.get("cer_mean") if "cer_mean" in aggregate else None,
            "cer_status": cer_status,
            "latency_mean_ms": aggregate.get("latency_mean_ms") or aggregate.get("latencyMs", {}).get("mean"),
            "latency_min_ms": aggregate.get("latency_min_ms") or aggregate.get("latencyMs", {}).get("min"),
            "latency_max_ms": aggregate.get("latency_max_ms") or aggregate.get("latencyMs", {}).get("max"),
            "repeat_text_stable_lines": aggregate.get("repeat_text_stable_lines") or aggregate.get("repeatTextStableLines"),
            "repeat_exact_stable_lines": aggregate.get("repeat_exact_stable_lines") or aggregate.get("repeatExactStableLines"),
        }
    return {
        "luna": {
            **basic(luna, luna_aggregate, cer_status="MEASURED_MACRO_MEAN"),
            "strict_format_runs": luna_aggregate.get("strict_format_runs"),
            "input_tokens_total": luna_aggregate.get("input_tokens_total"),
            "output_tokens_total": luna_aggregate.get("output_tokens_total"),
            "cost": {
                "attempted_units": luna_aggregate.get("runs_attempted"),
                "unit": "ephemeral_codex_call",
                "monetary_amount": None,
                "actual_invoice_checked": False,
                "basis": luna_aggregate.get("cost_basis"),
            },
        },
        "gemini_3_8": {
            **basic(gemini, gemini_aggregate, cer_status="UNKNOWN_RAW_TEXT_NOT_RETAINED"),
            "strict_format_runs": gemini_aggregate.get("strict_format_runs"),
            "input_tokens_total": gemini_aggregate.get("prompt_tokens_total"),
            "output_tokens_total": gemini_aggregate.get("completion_tokens_total"),
            "cost": {
                "attempted_units": gemini_aggregate.get("runs_attempted"),
                "unit": "recognition_request",
                "monetary_amount": None,
                "actual_invoice_checked": False,
                "basis": gemini_aggregate.get("cost_basis"),
            },
        },
        "document_ai": {
            "model": "Enterprise Document OCR",
            "provider": document_worker.get("provider"),
            "processor_version": document_worker.get("processorVersion"),
            "exact_runs": document_worker.get("outcomes", {}).get("exactRuns"),
            "exact_rate": document_worker.get("outcomes", {}).get("exactRate"),
            "cer": document_worker.get("outcomes", {}).get("cer"),
            "cer_status": document_worker.get("outcomes", {}).get("cerStatus"),
            "latency_mean_ms": document_worker.get("latencyMs", {}).get("mean"),
            "latency_min_ms": document_worker.get("latencyMs", {}).get("min"),
            "latency_max_ms": document_worker.get("latencyMs", {}).get("max"),
            "repeat_text_stable_lines": document_worker.get("reproducibility", {}).get("repeatTextStableLines"),
            "repeat_exact_stable_lines": None,
            "geometry_stable_lines": document_worker.get("reproducibility", {}).get("repeatGeometryStableLines"),
            "confidence_stable_lines": document_worker.get("reproducibility", {}).get("repeatConfidenceStableLines"),
            "confidence_mean": document_worker.get("reproducibility", {}).get("confidenceMean"),
            "cost": document_worker.get("cost"),
        },
    }


def build() -> dict[str, Any]:
    luna = json.loads(LUNA_RESULT.read_text(encoding="utf-8"))
    gemini = json.loads(GEMINI_RESULT.read_text(encoding="utf-8"))
    document_ai = json.loads(DOCUMENT_AI_RESULT.read_text(encoding="utf-8"))
    luna_lines = _line_flags(luna.get("lines", []))
    gemini_lines = _line_flags(_gemini_lines(gemini))
    document_lines = _document_ai_lines(document_ai)
    packet: dict[str, Any] = {
        "schema": "hermes-historical-ocr-luna-gemini38-document-ai-comparison-v1",
        "status": "CANDIDATE_EVIDENCE_ONLY",
        "recorded_on": "2026-09-04",
        "source_records": {
            "luna": {"path": str(LUNA_RESULT), "sha256": sha256_file(LUNA_RESULT)},
            "gemini_3_8": {"path": str(GEMINI_RESULT), "sha256": sha256_file(GEMINI_RESULT)},
            "document_ai": {"path": str(DOCUMENT_AI_RESULT), "sha256": sha256_file(DOCUMENT_AI_RESULT)},
        },
        "frozen_input": {
            "gold_set": "historical-ocr-gold-v1",
            "gold_set_sha256": luna.get("source", {}).get("gold_set_sha256"),
            "suite_sha256": luna.get("source", {}).get("suite_sha256"),
            "line_ids": LINE_IDS,
            "repeats_per_line": 2,
            "provider_input_contract": {
                "image_only": True,
                "gold_text_sent": False,
                "qwen_output_sent": False,
                "document_ai_output_sent": False,
                "strict_transcription_only": True,
            },
        },
        "workers": {
            "luna": {
                "worker_id": "openai/gpt-5.6-luna-native-ephemeral-v1",
                "role": "independent_image_only_recognition_candidate",
                "line_outcomes": luna_lines,
            },
            "gemini_3_8": {
                "worker_id": "google/gemini-3.8-flash-existing-frozen-record-v1",
                "role": "independent_image_only_recognition_candidate",
                "line_outcomes": gemini_lines,
            },
            "document_ai": {
                "worker_id": "document-ai-enterprise-document-ocr-optimized-request-v2.1.1-adc",
                "role": "existing_promoted_candidate_evidence_only",
                "line_outcomes": document_lines,
            },
        },
        "metrics": _worker_metrics(luna, gemini, document_ai),
        "comparisons": {
            "luna_vs_document_ai": _compare(luna_lines, document_lines),
            "gemini_3_8_vs_document_ai": _compare(gemini_lines, document_lines),
        },
        "interpretation_boundary": {
            "raw_text_equality": "NOT_CLAIMED_RAW_TEXT_NOT_RETAINED",
            "semantic_correction": False,
            "fallback": False,
            "automatic_winner_selection": False,
            "geometry_complementarity": "NOT_ASSESSABLE_LUNA_AND_GEMINI_HAVE_NO_GEOMETRY_IN_THIS_PACKET",
        },
        "cost_and_privacy_boundary": {
            "luna": "OpenAI Codex subscription route; per-request monetary billing not exposed",
            "gemini_3_8": "Google Gemini Paid Tier 1 route; exact billing not asserted in source record",
            "document_ai": "Existing GCP processor/page-unit evidence; invoice not checked",
            "input_classes": ["public", "synthetic_benchmark", "deidentified"],
            "credential_values_retained": False,
            "raw_api_responses_retained": False,
            "raw_prediction_text_retained": False,
            "raw_pixels_retained": False,
        },
        "decision": {
            "winner": None,
            "recognition_candidate_promotion": "DO_NOT_PROMOTE",
            "activation_gate": "DO_NOT_OPEN",
            "reason_codes": [
                "luna_exact_rate_below_existing_candidate_floor",
                "luna_repeat_text_instability",
                "gemini_existing_record_below_strict_format_floor",
                "raw_text_complementarity_unassessable",
                "automatic_winner_selection_forbidden",
            ],
        },
        "route_boundary": {
            "BLOCK_OCR_ROUTE": True,
            "OCRProvider.enabled": False,
            "activation": False,
            "semantic_correction": False,
            "silent_fallback": False,
            "detection_slot_touched": False,
            "processor_mutation": False,
            "search": False,
        },
    }
    packet["packet_sha256"] = hashlib.sha256(canonical_bytes(packet)).hexdigest()
    return packet


if __name__ == "__main__":
    OUTPUT_PATH.write_text(json.dumps(build(), ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(OUTPUT_PATH)

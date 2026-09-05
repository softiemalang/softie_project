#!/usr/bin/env python3
"""Run a bounded, synchronous frozen-gold comparison against two Google OCR APIs.

The runner intentionally has no retry, fallback, semantic correction, source
judgment, or route mutation.  It keeps prediction text and raw API responses in
memory only and writes hashes, metrics, geometry summaries, and operational
metadata.  The input bundle is ephemeral and must be deleted by the caller
after the run.
"""

from __future__ import annotations

import argparse
import base64
import hashlib
import json
import math
import os
import subprocess
import time
import unicodedata
import urllib.error
import urllib.parse
import urllib.request
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
from statistics import mean
from typing import Any, Iterable, Mapping, Sequence


SOURCE_GOLD_SET_SHA256 = "f08b4a006d5cc48ce6969ba8389bb7b4b3f5018a0228bca05ff867e15d13d02b"
EXPECTED_LINES = 4
EXPECTED_REPEATS = 2


def sha256_bytes(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def sha256_text(value: str) -> str:
    return sha256_bytes(value.encode("utf-8"))


def canonical_hash(value: Any) -> str:
    encoded = json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode("utf-8")
    return sha256_bytes(encoded)


def normalize_text(value: str) -> str:
    return "".join(char for char in unicodedata.normalize("NFC", value) if not char.isspace())


def edit_distance(left: str, right: str) -> int:
    previous = list(range(len(right) + 1))
    for index, left_char in enumerate(left, 1):
        current = [index]
        for right_index, right_char in enumerate(right, 1):
            current.append(min(
                current[-1] + 1,
                previous[right_index] + 1,
                previous[right_index - 1] + (left_char != right_char),
            ))
        previous = current
    return previous[-1]


def read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def active_account_digest() -> str | None:
    try:
        result = subprocess.run(
            ["gcloud", "auth", "list", "--filter=status:ACTIVE", "--format=value(account)"],
            check=True,
            capture_output=True,
            text=True,
        )
    except (OSError, subprocess.CalledProcessError):
        return None
    account = "\n".join(line.strip() for line in result.stdout.splitlines() if line.strip())
    return sha256_text(account) if account else None


def access_token() -> str:
    result = subprocess.run(
        ["gcloud", "auth", "print-access-token"],
        check=True,
        capture_output=True,
        text=True,
    )
    token = result.stdout.strip()
    if not token:
        raise RuntimeError("gcloud_access_token_empty")
    return token


def post_json(url: str, body: Mapping[str, Any], token: str, project: str) -> tuple[dict[str, Any] | None, float, dict[str, Any] | None]:
    encoded = json.dumps(body, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
    request = urllib.request.Request(
        url,
        data=encoded,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "x-goog-user-project": project,
        },
        method="POST",
    )
    started = time.perf_counter_ns()
    try:
        with urllib.request.urlopen(request, timeout=120) as response:
            payload = json.loads(response.read().decode("utf-8"))
            elapsed = (time.perf_counter_ns() - started) / 1_000_000
            return payload, elapsed, None
    except urllib.error.HTTPError as error:
        raw = error.read()
        elapsed = (time.perf_counter_ns() - started) / 1_000_000
        return None, elapsed, {
            "kind": "http_error",
            "httpStatus": error.code,
            "errorBodySha256": sha256_bytes(raw),
        }
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError, OSError) as error:
        elapsed = (time.perf_counter_ns() - started) / 1_000_000
        return None, elapsed, {
            "kind": type(error).__name__,
            "errorBodySha256": sha256_text(str(error)),
        }


def number(value: Any) -> float | None:
    if isinstance(value, bool):
        return None
    if isinstance(value, (int, float)) and math.isfinite(float(value)):
        return float(value)
    return None


def vertices(poly: Mapping[str, Any] | None, dimensions: Sequence[int]) -> list[list[float]]:
    if not isinstance(poly, Mapping):
        return []
    width, height = float(dimensions[0]), float(dimensions[1])
    points: list[list[float]] = []
    normalized = poly.get("normalizedVertices")
    if isinstance(normalized, list) and normalized:
        for point in normalized:
            if isinstance(point, Mapping):
                points.append([
                    round(float(point.get("x", 0.0)) * width, 6),
                    round(float(point.get("y", 0.0)) * height, 6),
                ])
        return points
    raw = poly.get("vertices")
    if isinstance(raw, list):
        for point in raw:
            if isinstance(point, Mapping):
                points.append([
                    round(float(point.get("x", 0.0)), 6),
                    round(float(point.get("y", 0.0)), 6),
                ])
    return points


def bounding_box(points: Iterable[Sequence[float]]) -> list[float] | None:
    values = list(points)
    if not values:
        return None
    xs = [float(item[0]) for item in values]
    ys = [float(item[1]) for item in values]
    return [round(min(xs), 6), round(min(ys), 6), round(max(xs), 6), round(max(ys), 6)]


def geometry_summary(
    elements: Sequence[Mapping[str, Any]],
    dimensions: Sequence[int],
    counts: Mapping[str, int],
    source: str,
) -> dict[str, Any]:
    descriptors: list[dict[str, Any]] = []
    boxes: list[list[float]] = []
    within = 0
    width, height = float(dimensions[0]), float(dimensions[1])
    for element in elements:
        points = vertices(element.get("boundingPoly"), dimensions)
        box = bounding_box(points)
        if box is None:
            continue
        boxes.append(box)
        within += int(all(-1.0 <= point[0] <= width + 1.0 and -1.0 <= point[1] <= height + 1.0 for point in points))
        descriptors.append({"kind": element.get("kind", "unknown"), "box": box})
    union = bounding_box([point for box in boxes for point in ([box[0], box[1]], [box[2], box[3]])])
    coverage = None
    if union is not None and width > 0 and height > 0:
        coverage = round(max(0.0, (union[2] - union[0]) * (union[3] - union[1]) / (width * height)), 6)
    return {
        "source": source,
        "elementCount": len(elements),
        "boxesWithGeometry": len(boxes),
        "bboxWithinInputRate": (within / len(boxes)) if boxes else None,
        "unionBoundingBox": union,
        "unionCoverageRatio": coverage,
        "counts": dict(counts),
        "geometrySha256": canonical_hash(descriptors),
    }


def vision_observation(payload: Mapping[str, Any], dimensions: Sequence[int]) -> tuple[str, dict[str, Any], dict[str, Any]]:
    response = (payload.get("responses") or [{}])[0]
    if not isinstance(response, Mapping):
        response = {}
    annotation = response.get("fullTextAnnotation") or {}
    text = annotation.get("text") if isinstance(annotation, Mapping) else ""
    text = text if isinstance(text, str) else ""
    elements: list[dict[str, Any]] = []
    confidences: list[float] = []
    counts = {"pages": 0, "blocks": 0, "paragraphs": 0, "words": 0, "symbols": 0}
    for page in annotation.get("pages", []) if isinstance(annotation, Mapping) else []:
        if not isinstance(page, Mapping):
            continue
        counts["pages"] += 1
        for block in page.get("blocks", []):
            if not isinstance(block, Mapping):
                continue
            counts["blocks"] += 1
            for paragraph in block.get("paragraphs", []):
                if not isinstance(paragraph, Mapping):
                    continue
                counts["paragraphs"] += 1
                for word in paragraph.get("words", []):
                    if not isinstance(word, Mapping):
                        continue
                    counts["words"] += 1
                    elements.append({"kind": "word", "boundingPoly": word.get("boundingBox")})
                    confidence = number(word.get("confidence"))
                    if confidence is not None:
                        confidences.append(confidence)
                    counts["symbols"] += len(word.get("symbols", [])) if isinstance(word.get("symbols"), list) else 0
    geometry = geometry_summary(elements, dimensions, counts, "word_bounding_boxes")
    confidence = confidence_summary(confidences, "word")
    return text, geometry, confidence


def text_anchor(document_text: str, value: Mapping[str, Any]) -> str:
    anchor = value.get("textAnchor") if isinstance(value, Mapping) else None
    segments = anchor.get("textSegments", []) if isinstance(anchor, Mapping) else []
    parts: list[str] = []
    for segment in segments:
        if not isinstance(segment, Mapping):
            continue
        start = int(segment.get("startIndex", 0))
        end = int(segment.get("endIndex", start))
        parts.append(document_text[start:end])
    return "".join(parts)


def document_ai_observation(payload: Mapping[str, Any], dimensions: Sequence[int]) -> tuple[str, dict[str, Any], dict[str, Any]]:
    document = payload.get("document") or {}
    if not isinstance(document, Mapping):
        document = {}
    document_text = document.get("text") if isinstance(document.get("text"), str) else ""
    pages = document.get("pages", []) if isinstance(document.get("pages"), list) else []
    line_elements: list[dict[str, Any]] = []
    token_elements: list[dict[str, Any]] = []
    line_confidences: list[float] = []
    token_confidences: list[float] = []
    symbol_confidences: list[float] = []
    counts = {"pages": len(pages), "lines": 0, "tokens": 0, "symbols": 0}
    for page in pages:
        if not isinstance(page, Mapping):
            continue
        for line in page.get("lines", []) if isinstance(page.get("lines"), list) else []:
            if not isinstance(line, Mapping):
                continue
            counts["lines"] += 1
            layout = line.get("layout") if isinstance(line.get("layout"), Mapping) else {}
            line_elements.append({"kind": "line", "boundingPoly": layout.get("boundingPoly")})
            confidence = number(layout.get("confidence"))
            if confidence is not None:
                line_confidences.append(confidence)
        for token in page.get("tokens", []) if isinstance(page.get("tokens"), list) else []:
            if not isinstance(token, Mapping):
                continue
            counts["tokens"] += 1
            layout = token.get("layout") if isinstance(token.get("layout"), Mapping) else {}
            token_elements.append({"kind": "token", "boundingPoly": layout.get("boundingPoly")})
            confidence = number(layout.get("confidence"))
            if confidence is not None:
                token_confidences.append(confidence)
        for symbol in page.get("symbols", []) if isinstance(page.get("symbols"), list) else []:
            if not isinstance(symbol, Mapping):
                continue
            counts["symbols"] += 1
            layout = symbol.get("layout") if isinstance(symbol.get("layout"), Mapping) else {}
            confidence = number(layout.get("confidence"))
            if confidence is not None:
                symbol_confidences.append(confidence)
    if not document_text:
        document_text = "\n".join(text_anchor(document_text, line) for page in pages if isinstance(page, Mapping) for line in page.get("lines", []) if isinstance(line, Mapping))
    geometry_elements = line_elements or token_elements
    geometry = geometry_summary(geometry_elements, dimensions, counts, "line_bounding_boxes" if line_elements else "token_bounding_boxes")
    if line_confidences:
        confidence = confidence_summary(line_confidences, "line")
    elif token_confidences:
        confidence = confidence_summary(token_confidences, "token")
    else:
        confidence = confidence_summary(symbol_confidences, "symbol")
    return document_text, geometry, confidence


def confidence_summary(values: Sequence[float], source: str) -> dict[str, Any]:
    return {
        "present": bool(values),
        "source": source if values else None,
        "count": len(values),
        "mean": round(mean(values), 9) if values else None,
        "min": round(min(values), 9) if values else None,
        "max": round(max(values), 9) if values else None,
        "valuesSha256": canonical_hash([round(value, 9) for value in values]) if values else None,
    }


def observation_record(
    provider: str,
    case: Mapping[str, Any],
    line: Mapping[str, Any],
    repeat: int,
    content: bytes,
    text: str,
    geometry: Mapping[str, Any],
    confidence: Mapping[str, Any],
    latency_ms: float,
    error: Mapping[str, Any] | None,
) -> dict[str, Any]:
    normalized = normalize_text(text)
    gold_text = str(line["goldText"])
    normalized_gold = normalize_text(gold_text)
    record: dict[str, Any] = {
        "provider": provider,
        "caseId": case["caseId"],
        "domain": case["domain"],
        "lineId": line["lineId"],
        "repeat": repeat,
        "status": "FAILED" if error else "SUCCEEDED",
        "latencyMs": round(latency_ms, 3),
        "requestBytes": len(content),
        "inputImageSha256": line["imageSha256"],
        "goldTextSha256": line["goldTextSha256"],
        "goldCharacterCount": int(line["goldCharacterCount"]),
        "predictionTextSha256": sha256_text(text),
        "predictionNormalizedTextSha256": sha256_text(normalized),
        "predictionTextLength": len(text),
        "predictionNormalizedLength": len(normalized),
        "exactMatch": normalized == normalized_gold,
        "editDistance": edit_distance(normalized, normalized_gold),
        "characterErrorRate": (edit_distance(normalized, normalized_gold) / len(normalized_gold)) if normalized_gold else None,
        "confidence": dict(confidence),
        "geometry": dict(geometry),
    }
    if error:
        record["error"] = dict(error)
    return record


def line_summary(runs: Sequence[Mapping[str, Any]]) -> dict[str, Any]:
    successful = [run for run in runs if run.get("status") == "SUCCEEDED"]
    text_hashes = [run.get("predictionNormalizedTextSha256") for run in successful]
    geometry_hashes = [run.get("geometry", {}).get("geometrySha256") for run in successful]
    confidence_hashes = [run.get("confidence", {}).get("valuesSha256") for run in successful]
    return {
        "runsAttempted": len(runs),
        "successfulRuns": len(successful),
        "exactMatchRuns": sum(run.get("exactMatch") is True for run in successful),
        "exactMatchRate": (sum(run.get("exactMatch") is True for run in successful) / len(successful)) if successful else None,
        "editDistance": sum(int(run.get("editDistance", 0)) for run in successful),
        "goldCharacters": sum(int(run.get("goldCharacterCount", 0)) for run in successful),
        "characterErrorRate": (
            sum(int(run.get("editDistance", 0)) for run in successful) /
            sum(int(run.get("goldCharacterCount", 0)) for run in successful)
        ) if successful and sum(int(run.get("goldCharacterCount", 0)) for run in successful) else None,
        "repeatTextStable": len(successful) == EXPECTED_REPEATS and len(set(text_hashes)) == 1,
        "repeatGeometryStable": len(successful) == EXPECTED_REPEATS and len(set(geometry_hashes)) == 1,
        "repeatConfidenceStable": len(successful) == EXPECTED_REPEATS and len(set(confidence_hashes)) == 1,
    }


def provider_summary(provider: str, records: Sequence[Mapping[str, Any]], cases: Sequence[Mapping[str, Any]]) -> dict[str, Any]:
    expected = len(cases) * EXPECTED_REPEATS
    by_line: dict[tuple[str, str], list[Mapping[str, Any]]] = defaultdict(list)
    for record in records:
        by_line[(str(record["caseId"]), str(record["lineId"]))].append(record)
    line_results: list[dict[str, Any]] = []
    for case in cases:
        for line in case["lines"]:
            runs = sorted(by_line.get((case["caseId"], line["lineId"]), []), key=lambda item: item["repeat"])
            line_results.append({
                "caseId": case["caseId"],
                "domain": case["domain"],
                "lineId": line["lineId"],
                "orientation": line["orientation"],
                "goldTextSha256": line["goldTextSha256"],
                "runs": runs,
                "summary": line_summary(runs),
            })
    successful = [record for record in records if record.get("status") == "SUCCEEDED"]
    total_gold = sum(int(record.get("goldCharacterCount", 0)) for record in successful)
    total_edit = sum(int(record.get("editDistance", 0)) for record in successful)
    confidence = [record["confidence"]["mean"] for record in successful if record.get("confidence", {}).get("present") and isinstance(record["confidence"].get("mean"), (int, float))]
    latencies = [float(record["latencyMs"]) for record in successful]
    documents: list[dict[str, Any]] = []
    for case in cases:
        lines = [item for item in line_results if item["caseId"] == case["caseId"]]
        line_successes = [run for item in lines for run in item["runs"] if run.get("status") == "SUCCEEDED"]
        doc_gold = sum(int(run.get("goldCharacterCount", 0)) for run in line_successes)
        doc_edit = sum(int(run.get("editDistance", 0)) for run in line_successes)
        documents.append({
            "caseId": case["caseId"],
            "domain": case["domain"],
            "lineCount": len(lines),
            "successfulRuns": len(line_successes),
            "exactMatchRuns": sum(run.get("exactMatch") is True for run in line_successes),
            "exactMatchRate": (sum(run.get("exactMatch") is True for run in line_successes) / len(line_successes)) if line_successes else None,
            "characterErrorRate": (doc_edit / doc_gold) if doc_gold else None,
            "repeatTextStableLines": sum(item["summary"]["repeatTextStable"] for item in lines),
            "repeatGeometryStableLines": sum(item["summary"]["repeatGeometryStable"] for item in lines),
            "repeatConfidenceStableLines": sum(item["summary"]["repeatConfidenceStable"] for item in lines),
        })
    return {
        "provider": provider,
        "expectedRuns": expected,
        "successfulRuns": len(successful),
        "failedRuns": len(records) - len(successful),
        "status": "COMPLETED" if len(successful) == expected else "PARTIAL_OR_BLOCKED",
        "exactMatchRuns": sum(record.get("exactMatch") is True for record in successful),
        "exactMatchRate": (sum(record.get("exactMatch") is True for record in successful) / len(successful)) if successful else None,
        "characterErrorRate": (total_edit / total_gold) if total_gold else None,
        "repeatTextStableLines": sum(item["summary"]["repeatTextStable"] for item in line_results),
        "repeatGeometryStableLines": sum(item["summary"]["repeatGeometryStable"] for item in line_results),
        "repeatConfidenceStableLines": sum(item["summary"]["repeatConfidenceStable"] for item in line_results),
        "confidencePresentRuns": len(confidence),
        "confidencePresentRate": (len(confidence) / len(successful)) if successful else 0.0,
        "confidenceMean": mean(confidence) if confidence else None,
        "confidenceMin": min(confidence) if confidence else None,
        "confidenceMax": max(confidence) if confidence else None,
        "latencyMeanMs": mean(latencies) if latencies else None,
        "latencyMinMs": min(latencies) if latencies else None,
        "latencyMaxMs": max(latencies) if latencies else None,
        "lineResults": line_results,
        "documents": documents,
    }


def cost_metadata(provider: str) -> dict[str, Any]:
    if provider == "cloud_vision_document_text_detection":
        return {
            "billableUnit": "image feature request",
            "attemptedUnits": EXPECTED_LINES * EXPECTED_REPEATS,
            "publishedFirstTier": "first 1000 units/month free",
            "publishedNextTierUsdPer1000": 1.50,
            "estimatedUsdIfFirstTierStillAvailable": 0.0,
            "actualInvoiceChecked": False,
            "pricingUrl": "https://cloud.google.com/vision/pricing",
        }
    return {
        "billableUnit": "page",
        "attemptedUnits": EXPECTED_LINES * EXPECTED_REPEATS,
        "publishedFirstTier": "first 1000 counts/month free",
        "publishedNextTierUsdPer1000": 1.50,
        "estimatedUsdIfFirstTierStillAvailable": 0.0,
        "actualInvoiceChecked": False,
        "pricingUrl": "https://cloud.google.com/products/document-ai/pricing",
    }


def run_provider(
    provider: str,
    token: str,
    manifest: Mapping[str, Any],
    bundle_root: Path,
    project: str,
    docai_location: str,
    docai_processor_id: str,
    docai_processor_version: str,
) -> tuple[dict[str, Any], list[dict[str, Any]]]:
    records: list[dict[str, Any]] = []
    for case in manifest["cases"]:
        for line in case["lines"]:
            image_path = bundle_root / line["imagePath"]
            content = image_path.read_bytes()
            for repeat in range(1, EXPECTED_REPEATS + 1):
                if provider == "cloud_vision_document_text_detection":
                    url = "https://vision.googleapis.com/v1/images:annotate"
                    body = {
                        "requests": [{
                            "image": {"content": base64.b64encode(content).decode("ascii")},
                            "features": [{"type": "DOCUMENT_TEXT_DETECTION"}],
                        }]
                    }
                else:
                    encoded_processor = "/".join(urllib.parse.quote(part, safe="") for part in docai_processor_id.split("/"))
                    encoded_version = urllib.parse.quote(docai_processor_version, safe="")
                    url = (
                        f"https://{docai_location}-documentai.googleapis.com/v1/{encoded_processor}/processorVersions/"
                        f"{encoded_version}:process"
                    )
                    body = {
                        "rawDocument": {
                            "mimeType": line["imageMimeType"],
                            "content": base64.b64encode(content).decode("ascii"),
                        },
                        "processOptions": {"ocrConfig": {"enableSymbol": True}},
                    }
                payload, latency_ms, error = post_json(url, body, token, project)
                if error is not None or payload is None:
                    records.append(observation_record(provider, case, line, repeat, content, "", {
                        "source": "none",
                        "elementCount": 0,
                        "boxesWithGeometry": 0,
                        "bboxWithinInputRate": None,
                        "unionBoundingBox": None,
                        "unionCoverageRatio": None,
                        "counts": {},
                        "geometrySha256": canonical_hash([]),
                    }, confidence_summary([], "none"), latency_ms, error))
                    continue
                if provider == "cloud_vision_document_text_detection":
                    text, geometry, confidence = vision_observation(payload, line["cropDimensions"])
                else:
                    text, geometry, confidence = document_ai_observation(payload, line["cropDimensions"])
                records.append(observation_record(provider, case, line, repeat, content, text, geometry, confidence, latency_ms, None))
    return provider_summary(provider, records, manifest["cases"]), records


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--manifest", type=Path, required=True)
    parser.add_argument("--bundle-root", type=Path)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--project", default=os.environ.get("GOOGLE_CLOUD_PROJECT"))
    parser.add_argument("--document-ai-location", default="asia-southeast1")
    parser.add_argument("--document-ai-processor-id", required=True)
    parser.add_argument("--document-ai-processor-version", required=True)
    args = parser.parse_args()
    if not args.project:
        parser.error("--project or GOOGLE_CLOUD_PROJECT is required")

    manifest_path = args.manifest.resolve()
    bundle_root = (args.bundle_root or manifest_path.parent).resolve()
    manifest = read_json(manifest_path)
    if manifest.get("schema") != "google-external-ocr-frozen-gold-input-v1":
        raise RuntimeError("input_manifest_schema_invalid")
    if manifest.get("source", {}).get("sourceGoldSetSha256") != SOURCE_GOLD_SET_SHA256:
        raise RuntimeError("source_gold_set_hash_mismatch")
    if manifest.get("source", {}).get("lineCount") != EXPECTED_LINES:
        raise RuntimeError("input_line_count_invalid")
    if manifest.get("protocol", {}).get("repeatsPerLine") != EXPECTED_REPEATS:
        raise RuntimeError("input_repeat_count_invalid")
    if len(manifest.get("cases", [])) != 3:
        raise RuntimeError("input_case_count_invalid")

    token = access_token()
    account_digest = active_account_digest()
    started_at = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    provider_summaries: dict[str, dict[str, Any]] = {}
    provider_records: dict[str, list[dict[str, Any]]] = {}
    providers = [
        "cloud_vision_document_text_detection",
        "document_ai_enterprise_document_ocr",
    ]
    for provider in providers:
        summary, records = run_provider(
            provider,
            token,
            manifest,
            bundle_root,
            args.project,
            args.document_ai_location,
            args.document_ai_processor_id,
            args.document_ai_processor_version,
        )
        provider_summaries[provider] = summary
        provider_records[provider] = records

    # Remove the token from local variables before constructing the output; no
    # token or raw API payload is serialized by this runner.
    token = ""
    all_completed = all(summary["status"] == "COMPLETED" for summary in provider_summaries.values())
    result: dict[str, Any] = {
        "schema": "historical-ocr-google-external-frozen-gold-run-v1",
        "status": "COMPLETED" if all_completed else "PARTIAL_OR_BLOCKED",
        "decision": "CANDIDATE_EVIDENCE_ONLY",
        "startedAtUtc": started_at,
        "finishedAtUtc": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "source": {
            "sourceGoldSetSha256": SOURCE_GOLD_SET_SHA256,
            "inputManifestSha256": sha256_bytes(manifest_path.read_bytes()),
            "caseCount": manifest["source"]["caseCount"],
            "lineCount": manifest["source"]["lineCount"],
            "normalization": manifest["source"]["normalization"],
            "sameInputBytesForBothProviders": True,
        },
        "protocol": {
            "providers": providers,
            "repeatsPerLine": EXPECTED_REPEATS,
            "attemptedRequestsPerProvider": EXPECTED_LINES * EXPECTED_REPEATS,
            "retryCount": 0,
            "fallbackUsed": False,
            "semanticCorrection": False,
            "historicalSourceJudgment": False,
            "search": False,
            "rawPredictionTextRetained": False,
            "rawApiResponseRetained": False,
        },
        "baseline": manifest.get("qwenBaseline"),
        "providers": {
            "cloud_vision_document_text_detection": {
                "api": "Cloud Vision API",
                "feature": "DOCUMENT_TEXT_DETECTION",
                "endpoint": "https://vision.googleapis.com/v1/images:annotate",
                "region": "global",
                "summary": provider_summaries["cloud_vision_document_text_detection"],
                "cost": cost_metadata("cloud_vision_document_text_detection"),
            },
            "document_ai_enterprise_document_ocr": {
                "api": "Document AI",
                "processor": "Enterprise Document OCR",
                "processorLocation": args.document_ai_location,
                "processorId": args.document_ai_processor_id,
                "processorVersion": args.document_ai_processor_version,
                "endpoint": f"https://{args.document_ai_location}-documentai.googleapis.com",
                "summary": provider_summaries["document_ai_enterprise_document_ocr"],
                "cost": cost_metadata("document_ai_enterprise_document_ocr"),
            },
        },
        "authentication": {
            "method": "gcloud_user_credentials_print_access_token",
            "activeAccountSha256": account_digest,
            "credentialMaterialRetained": False,
            "serviceAccountKeyUsed": False,
            "billingProject": args.project,
        },
        "privacy": {
            "requestMode": "synchronous_inline_base64",
            "cloudStorageInput": False,
            "cloudStorageOutput": False,
            "batchProcessing": False,
            "rawInputRetainedInArtifact": False,
            "rawPredictionTextRetainedInArtifact": False,
            "rawApiResponseRetainedInArtifact": False,
            "temporaryBundleDeletionRequired": True,
            "dataResidencyNote": "Vision uses the global endpoint; Document AI processor location is recorded separately.",
        },
        "boundaries": {
            "frozenGoldAccessedForThisExplicitComparison": True,
            "detectionSlotTouched": False,
            "activation": False,
            "BLOCK_OCR_ROUTE": True,
            "OCRProvider": {"enabled": False},
            "search": False,
            "historicalSourceJudgment": False,
            "semanticCorrection": False,
            "silentFallback": False,
        },
        "promotion": {
            "status": "NOT_EVALUATED",
            "candidateEvidenceOnly": True,
            "automaticActivation": False,
            "separateActivationDecisionRequired": True,
        },
    }
    result["contentSha256"] = canonical_hash({**result, "contentSha256": None})
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, ensure_ascii=False, sort_keys=True, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({
        "status": result["status"],
        "decision": result["decision"],
        "output": str(args.output),
        "sourceGoldSetSha256": SOURCE_GOLD_SET_SHA256,
        "providers": {name: summary["status"] for name, summary in provider_summaries.items()},
        "contentSha256": result["contentSha256"],
    }, ensure_ascii=False, sort_keys=True, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

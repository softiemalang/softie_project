#!/usr/bin/env python3
"""Validate the closed, non-OCR Groq Qwen SDK probe packet.

The validator is offline and never imports the SDK or calls a provider.
"""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
from typing import Any


HEX64 = set("0123456789abcdef")
EXPECTED_CONTENT_SHA256 = (
    "565339bc4d33d72817b583024112eb7f5cdf3e5eef0252d6ec1b9c9a94e12bb3"
)
EXPECTED_ERROR_SHA256 = (
    "d19f75167dab4112caad4f99fd752110bef0aa3e44a32ef28c0a4ea4f7980e04"
)
EXPECTED_FIXTURE_SHA256 = (
    "bd9715495e7b02200961933e63bc2f48372a538659115f4cd8ccfa3a9e5fea9d"
)


def _require(condition: bool, reason: str) -> None:
    if not condition:
        raise ValueError(reason)


def _hex64(value: Any) -> bool:
    return isinstance(value, str) and len(value) == 64 and set(value) <= HEX64


def validate(path: Path) -> dict[str, Any]:
    packet = json.loads(path.read_text(encoding="utf-8"))
    _require(packet.get("schema") == "historical-ocr-groq-qwen-sdk-probe-v1", "schema")
    _require(packet.get("version") == "1.0.0", "version")
    _require(packet.get("adapter") == "groq_qwen_sdk_v1", "adapter")
    _require(packet.get("model") == "qwen/qwen3.8-27b", "qwen_only_model")

    sdk = packet.get("officialSdk", {})
    _require(sdk.get("package") == "groq", "official_sdk_package")
    _require(sdk.get("version") == "1.7.0", "official_sdk_version")
    _require(sdk.get("official") is True, "official_sdk_marker")

    transport = packet.get("transport", {})
    for key, expected in {
        "client": "Groq",
        "httpBackend": "httpx",
        "method": "POST",
        "endpoint": "https://api.groq.com/openai/v1/chat/completions",
        "requestPath": "/openai/v1/chat/completions",
        "baseUrlSource": "official_sdk_default",
        "baseUrlOverridden": False,
        "maxRetries": 0,
        "clientReusedAcrossProbes": True,
        "customHeaders": False,
        "userAgentOverride": False,
    }.items():
        _require(transport.get(key) == expected, "transport_" + key)
    _require(
        transport.get("headerNamesObservedAtConstruction")
        == [
            "accept",
            "authorization",
            "content-type",
            "user-agent",
            "x-stainless-arch",
            "x-stainless-async",
            "x-stainless-lang",
            "x-stainless-os",
            "x-stainless-package-version",
            "x-stainless-runtime",
            "x-stainless-runtime-version",
        ],
        "sdk_header_names",
    )

    fixture = packet.get("requestContract", {}).get("syntheticFixture", {})
    _require(fixture.get("bytes") == 631, "fixture_bytes")
    _require(fixture.get("sha256") == EXPECTED_FIXTURE_SHA256, "fixture_sha256")
    _require(packet["requestContract"].get("visionContentShape") == "messages[0].content=[text,image_url]", "vision_shape")
    _require(packet["requestContract"].get("imageUrlShape") == "image_url.url", "image_url_shape")

    probes = packet.get("probes")
    _require(isinstance(probes, list) and len(probes) == 3, "probe_count")
    _require([item.get("label") for item in probes] == ["text_only", "public_jpeg_url", "synthetic_base64_jpeg"], "probe_order")
    _require([item.get("status") for item in probes] == ["OK", "OK", "ERROR"], "probe_statuses")
    for item in probes:
        _require(item.get("preflight", {}).get("decision") == "ALLOW", item.get("label", "probe") + "_preflight")
        _require(item.get("preflight", {}).get("classification") == ["synthetic_benchmark"], item.get("label", "probe") + "_classification")
        _require(item.get("preflight", {}).get("secret_patterns") == [], item.get("label", "probe") + "_secret_scan")
        _require(isinstance(item.get("latencyMs"), (int, float)) and item["latencyMs"] >= 0, item.get("label", "probe") + "_latency")

    for label in ("text_only", "public_jpeg_url"):
        item = next(probe for probe in probes if probe["label"] == label)
        for key, expected in {"httpStatus": 200, "choices": 1, "finishReason": "stop", "contentType": "str", "contentSha256": EXPECTED_CONTENT_SHA256}.items():
            _require(item.get(key) == expected, label + "_" + key)
        _require(_hex64(item.get("contentSha256")), label + "_content_digest")

    base64_probe = probes[2]
    for key, expected in {"status": "ERROR", "httpStatus": 503, "bodyFormat": "sdk_error", "exceptionType": "InternalServerError", "responseBodySha256": EXPECTED_ERROR_SHA256}.items():
        _require(base64_probe.get(key) == expected, "base64_" + key)
    _require(_hex64(base64_probe.get("responseBodySha256")), "base64_error_digest")

    budget = packet.get("callBudget", {})
    _require(budget == {"maximum": 3, "probeSlotsUsed": 3, "providerCalls": 3, "retries": 0}, "call_budget")

    parity = packet.get("parity", {})
    _require(parity.get("status") == "PASS_FOR_OBSERVED_FIELDS", "parity_status")
    _require(parity.get("transport", {}).get("endpointAndPathEqual") is True, "endpoint_parity")
    _require(parity.get("transport", {}).get("visionShapeEqual") is True, "shape_parity")
    _require(parity.get("transport", {}).get("sdkAddsStainlessHeaderNames") is True, "sdk_headers")
    _require(parity.get("output", {}).get("successContentDigestEqual") is True, "success_output_parity")
    _require(parity.get("output", {}).get("base64ErrorDigestEqual") is True, "base64_error_parity")

    decision = packet.get("decision", {})
    _require(decision.get("qwenStandardTransport") == "NOT_PROMOTED", "promotion")
    _require(decision.get("stability") == "NOT_PROVEN", "stability")
    _require(decision.get("reason") == "synthetic_base64_jpeg_http_503", "promotion_reason")

    boundaries = packet.get("boundaries", {})
    _require(boundaries.get("BLOCK_OCR_ROUTE") is True, "boundary_BLOCK_OCR_ROUTE")
    _require(boundaries.get("OCRProvider.enabled") is False, "boundary_OCRProvider_enabled")
    for key in (
        "ocrCropAccess",
        "documentAiAccess",
        "gptOssPathChanged",
        "credentialChanged",
        "routingChanged",
        "activationChanged",
        "fallback",
        "semanticCorrection",
    ):
        _require(boundaries.get(key) is False, "boundary_" + key)
    _require(boundaries.get("publicUrlWasProbeNotWorkaround") is True, "public_url_scope")

    retention = packet.get("retention", {})
    for key in ("rawResponses", "rawPrompts", "rawImageBytes", "credentialValue"):
        _require(retention.get(key) is False, "retention_" + key)

    serialized = json.dumps(packet, ensure_ascii=False).lower()
    for marker in ("gsk_", "authorization: bearer", "data:image/jpeg;base64"):
        _require(marker not in serialized, "forbidden_retained_marker:" + marker)

    return {
        "status": "PASS",
        "checks": 44,
        "artifactSha256": hashlib.sha256(path.read_bytes()).hexdigest(),
        "providerCallsReplayed": 0,
        "activation": "BLOCKED",
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("artifact", type=Path)
    args = parser.parse_args()
    print(json.dumps(validate(args.artifact), ensure_ascii=False, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

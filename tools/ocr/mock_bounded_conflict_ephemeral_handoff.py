#!/usr/bin/env python3
"""Exercise the bounded conflict handoff entirely with in-memory fixtures."""

from __future__ import annotations

import base64
import hashlib
import importlib.util
import json
import subprocess
import tempfile
from argparse import Namespace
from pathlib import Path


REPO = Path(__file__).resolve().parents[2]
RUNNER_PATH = REPO / "tools/ocr/run_bounded_conflict_ephemeral_handoff.py"
VALIDATOR_PATH = REPO / "tools/ocr/validate_bounded_conflict_ephemeral_handoff.mjs"


def load_runner():
    spec = importlib.util.spec_from_file_location("bounded_ephemeral_runner", RUNNER_PATH)
    if spec is None or spec.loader is None:
        raise RuntimeError("runner_import_failed")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def run_case(labels: tuple[str, str]) -> dict[str, object]:
    runner = load_runner()
    fixtures = [
        {
            "lineId": "saju-folio-line",
            "caseId": "fixture-saju",
            "domain": "fixture",
            "imageSha256": hashlib.sha256(b"fixture-crop-a").hexdigest(),
            "imageDimensions": [12, 5],
            "imageMimeType": "image/png",
            "gold": "甲乙",
            "imageBytes": b"fixture-crop-a",
        },
        {
            "lineId": "astrology-title-line",
            "caseId": "fixture-astrology",
            "domain": "fixture",
            "imageSha256": hashlib.sha256(b"fixture-crop-b").hexdigest(),
            "imageDimensions": [14, 6],
            "imageMimeType": "image/png",
            "gold": "丙丁",
            "imageBytes": b"fixture-crop-b",
        },
    ]
    qwen_text = {"saju-folio-line": "甲", "astrology-title-line": "丙"}
    document_text = {"saju-folio-line": "乙", "astrology-title-line": "丁"}
    image_to_line = {
        base64.b64encode(item["imageBytes"]).decode("ascii"): item["lineId"]
        for item in fixtures
    }
    line_labels = dict(zip((item["lineId"] for item in fixtures), labels, strict=True))
    calls: list[tuple[str, str]] = []

    def fake_request_json(url, body, _headers, _timeout_seconds):
        if url == runner.QWEN_URL:
            prompt = body["messages"][0]["content"][0]["text"]
            line_id = prompt.rsplit("line identifier is: ", 1)[1]
            image_b64 = body["messages"][0]["content"][1]["image_url"]["url"].split(",", 1)[1]
            assert image_to_line[image_b64] == line_id
            calls.append(("qwen", line_id))
            inner = {
                "line_id": line_id,
                "transcription": qwen_text[line_id],
                "confidence": 0.81,
            }
            raw = json.dumps(
                {"choices": [{"message": {"content": json.dumps(inner, ensure_ascii=False)}}]},
                ensure_ascii=False,
            ).encode("utf-8")
        elif url == runner.DOCUMENT_AI_URL:
            line_id = image_to_line[body["rawDocument"]["content"]]
            assert body["fieldMask"] == "text,pages.pageNumber,pages.dimension,pages.lines,pages.tokens"
            assert body["imagelessMode"] is True
            calls.append(("document-ai", line_id))
            raw = json.dumps({"document": {"text": document_text[line_id]}}, ensure_ascii=False).encode("utf-8")
        elif url == runner.GEMINI_URL:
            prompt = body["contents"][0]["parts"][0]["text"]
            line_id = prompt.rsplit("The line identifier is ", 1)[1].split("\n", 1)[0]
            image_b64 = body["contents"][0]["parts"][1]["inline_data"]["data"]
            assert image_to_line[image_b64] == line_id
            assert qwen_text[line_id] in prompt
            assert document_text[line_id] in prompt
            calls.append(("reviewer", line_id))
            raw = json.dumps(
                {"candidates": [{"content": {"parts": [{"text": line_labels[line_id]}]}}]}
            ).encode("utf-8")
        else:
            raise AssertionError(f"unexpected_endpoint:{url}")
        return {
            "httpStatus": 200,
            "latencyMs": 7.0,
            "responseSha256": hashlib.sha256(raw).hexdigest(),
            "errorCode": None,
            "transportError": None,
        }, raw

    runner.load_targets = lambda _manifest, _bundle_root: [dict(item) for item in fixtures]
    runner.read_secret = lambda _path, _variable, _pattern: ("fixture-token", 0o600)
    runner.adc_access_token = lambda: "fixture-adc-token"
    runner.request_json = fake_request_json

    with tempfile.TemporaryDirectory(prefix="bounded-conflict-mock-", dir="/private/tmp") as temp_dir:
        output = Path(temp_dir) / "packet.json"
        packet = runner.run(
            Namespace(
                manifest=Path("/fixture/manifest.json"),
                bundle_root=Path("/fixture"),
                output=output,
                recorded_on="2026-09-04",
            )
        )
        expected_calls = [
            ("qwen", "saju-folio-line"),
            ("document-ai", "saju-folio-line"),
            ("reviewer", "saju-folio-line"),
            ("qwen", "astrology-title-line"),
            ("document-ai", "astrology-title-line"),
            ("reviewer", "astrology-title-line"),
        ]
        assert calls == expected_calls, calls
        assert packet["scope"]["qwenCallsAttempted"] == 2
        assert packet["scope"]["documentAiCallsAttempted"] == 2
        assert packet["scope"]["reviewHandoffsAttempted"] == 2
        assert packet["scope"]["reviewerCallsAttempted"] == 2
        assert packet["retention"]["rawCandidateStrings"] is False
        assert packet["retention"]["rawCropBytes"] is False
        packet_text = output.read_text(encoding="utf-8")
        assert all(value not in packet_text for value in [*qwen_text.values(), *document_text.values()])
        validator = subprocess.run(
            ["node", str(VALIDATOR_PATH), "--input", str(output)],
            cwd=REPO,
            check=True,
            capture_output=True,
            text=True,
        )
        validation = json.loads(validator.stdout)
        assert validation["status"] == "PASSED", validation
        assert validation["errors"] == [], validation
        return {
            "labels": list(labels),
            "packetStatus": packet["status"],
            "resolvedLineIds": packet["resolution"]["resolvedLineIds"],
            "unresolvedLineIds": packet["resolution"]["unresolvedLineIds"],
            "validator": validation["status"],
            "externalCalls": 0,
        }


def main() -> int:
    cases = [("A", "B"), ("NEITHER", "UNCERTAIN"), ("A", "UNCERTAIN")]
    results = [run_case(case) for case in cases]
    print(json.dumps({"status": "PASSED", "cases": results}, ensure_ascii=False, sort_keys=True, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

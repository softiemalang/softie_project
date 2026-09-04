#!/usr/bin/env python3
"""Qwen-only Groq adapter using the official Python SDK.

This adapter is deliberately separate from the existing direct-HTTP workers.
It is a probe/transport component only: it accepts no OCR crop and does not
perform routing, fallback, semantic correction, or activation decisions.
"""

from __future__ import annotations

import argparse
import base64
import hashlib
import json
import re
import stat
import subprocess
import time
from pathlib import Path
from typing import Any


QWEN_MODEL = "qwen/qwen3.8-27b"
GROQ_API_ORIGIN = "https://api.groq.com"
GROQ_CHAT_PATH = "/openai/v1/chat/completions"
PROBE_PROMPT = (
    "Return exactly OK. Synthetic non-OCR vision transport probe only; "
    "do not transcribe or interpret the image."
)
PUBLIC_JPEG_URL = "https://httpbin.org/image/jpeg"
SYNTHETIC_JPEG_BYTES = 631
SYNTHETIC_JPEG_SHA256 = (
    "bd9715495e7b02200961933e63bc2f48372a538659115f4cd8ccfa3a9e5fea9d"
)
DEFAULT_TIMEOUT_SECONDS = 45.0
DEFAULT_MAX_RETRIES = 0
PREFLIGHT = Path("/Users/hangyukim/Hermes Lab/bin/provider-data-preflight")
DEFAULT_CREDENTIAL_PATH = Path("/Users/hangyukim/Groq Lab/state/credentials.env")


def _sha256(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def _read_api_key(path: Path) -> tuple[str, int]:
    """Read the existing credential without printing, copying, or changing it."""

    mode = stat.S_IMODE(path.stat().st_mode)
    if mode != 0o600:
        raise RuntimeError("credential_mode_not_0600")
    for line in path.read_text(encoding="utf-8").splitlines():
        if line.startswith("GROQ_API_KEY="):
            key = line.split("=", 1)[1].strip()
            if re.fullmatch(r"gsk_[A-Za-z0-9_-]{20,}", key):
                return key, mode
    raise RuntimeError("credential_format_invalid")


def _fixture_bytes(path: Path) -> bytes:
    value = path.read_bytes()
    if len(value) != SYNTHETIC_JPEG_BYTES or _sha256(value) != SYNTHETIC_JPEG_SHA256:
        raise ValueError("fixture is not the previously frozen synthetic JPEG")
    return value


def _messages(image_url: str | None) -> list[dict[str, Any]]:
    if image_url is None:
        return [{"role": "user", "content": PROBE_PROMPT}]
    return [
        {
            "role": "user",
            "content": [
                {"type": "text", "text": PROBE_PROMPT},
                {"type": "image_url", "image_url": {"url": image_url}},
            ],
        }
    ]


def _request_kwargs(image_url: str | None) -> dict[str, Any]:
    """Return the deterministic body used by the previously successful worker."""

    return {
        "model": QWEN_MODEL,
        "messages": _messages(image_url),
        "temperature": 0,
        "seed": 7,
        "max_completion_tokens": 256,
        "reasoning_effort": "none",
        "include_reasoning": False,
        "stream": False,
        "tool_choice": "none",
    }


def _load_sdk() -> tuple[Any, str]:
    try:
        import groq  # type: ignore
        from groq import Groq  # type: ignore
    except ImportError as exc:
        raise RuntimeError(
            "official Groq Python SDK is not installed in this environment"
        ) from exc
    return Groq, str(getattr(groq, "__version__", "unknown"))


def _preflight(label: str) -> dict[str, Any]:
    if not PREFLIGHT.is_file():
        return {"allowed": False, "reason": "preflight_missing", "label": label}
    payload = {
        "provider": "groq",
        "data_class": "synthetic_benchmark",
        "operation": f"qwen_sdk_{label}",
        "policy_ref": "historical-ocr-bounded-team-v1",
    }
    completed = subprocess.run(
        [str(PREFLIGHT)],
        input=json.dumps(payload),
        text=True,
        capture_output=True,
        check=False,
    )
    try:
        result = json.loads(completed.stdout)
    except json.JSONDecodeError:
        result = {"allowed": False, "reason": "preflight_invalid_output"}
    result["allowed"] = result.get("decision") == "ALLOW"
    result["label"] = label
    result["exitCode"] = completed.returncode
    return result


def _success_shape(completion: Any) -> dict[str, Any]:
    choices = list(getattr(completion, "choices", []) or [])
    first = choices[0] if choices else None
    message = getattr(first, "message", None)
    content = getattr(message, "content", None)
    content_bytes = content.encode("utf-8") if isinstance(content, str) else b""
    return {
        "bodyFormat": type(completion).__name__,
        "choices": len(choices),
        "finishReason": getattr(first, "finish_reason", None),
        "model": getattr(completion, "model", None),
        "contentType": type(content).__name__ if content is not None else None,
        "contentBytes": len(content_bytes),
        "contentSha256": _sha256(content_bytes) if content_bytes else None,
    }


def _error_shape(exc: BaseException) -> dict[str, Any]:
    response = getattr(exc, "response", None)
    raw = getattr(response, "content", b"") if response is not None else b""
    if isinstance(raw, str):
        raw = raw.encode("utf-8")
    headers = getattr(response, "headers", {}) if response is not None else {}
    return {
        "bodyFormat": "sdk_error",
        "exceptionType": type(exc).__name__,
        "httpStatus": getattr(exc, "status_code", None),
        "responseContentType": headers.get("content-type") if headers else None,
        "responseBodyBytes": len(raw),
        "responseBodySha256": _sha256(raw) if raw else None,
    }


def _one_probe(client: Any, label: str, image_url: str | None) -> dict[str, Any]:
    preflight = _preflight(label)
    if not preflight.get("allowed", False):
        return {"label": label, "status": "BLOCKED_PREFLIGHT", "preflight": preflight}

    started = time.perf_counter()
    try:
        completion = client.chat.completions.create(**_request_kwargs(image_url))
    except Exception as exc:  # the result is reduced to non-sensitive metadata below
        result = _error_shape(exc)
        result.update({"label": label, "status": "ERROR"})
    else:
        result = _success_shape(completion)
        result.update({"label": label, "status": "OK", "httpStatus": 200})
    result["latencyMs"] = round((time.perf_counter() - started) * 1000, 3)
    result["preflight"] = preflight
    return result


def run_probe_sequence(credential_path: Path, jpeg_path: Path) -> dict[str, Any]:
    """Run exactly one text, one URL, and one base64 probe on one reused client."""

    fixture = _fixture_bytes(jpeg_path)
    Groq, sdk_version = _load_sdk()
    api_key, credential_mode = _read_api_key(credential_path)
    client = Groq(
        api_key=api_key,
        max_retries=DEFAULT_MAX_RETRIES,
        timeout=DEFAULT_TIMEOUT_SECONDS,
    )
    try:
        probes = []
        for label, image_url in (
            ("text_only", None),
            ("public_jpeg_url", PUBLIC_JPEG_URL),
            (
                "synthetic_base64_jpeg",
                "data:image/jpeg;base64," + base64.b64encode(fixture).decode("ascii"),
            ),
        ):
            result = _one_probe(client, label, image_url)
            probes.append(result)
            if result.get("status") != "OK":
                break
    finally:
        close = getattr(client, "close", None)
        if close is not None:
            close()

    return {
        "adapter": "groq_qwen_sdk_v1",
        "model": QWEN_MODEL,
        "sdk": {"package": "groq", "version": sdk_version},
        "transport": {
            "client": "Groq",
            "httpBackend": "httpx",
            "method": "POST",
            "endpoint": GROQ_API_ORIGIN + GROQ_CHAT_PATH,
            "baseUrlSource": "official_sdk_default",
            "requestPath": GROQ_CHAT_PATH,
            "baseUrlOverridden": False,
            "maxRetries": DEFAULT_MAX_RETRIES,
            "timeoutSeconds": DEFAULT_TIMEOUT_SECONDS,
            "clientReusedAcrossProbes": True,
            "customHeaders": False,
            "userAgentOverride": False,
        },
        "requestContract": {
            "model": QWEN_MODEL,
            "promptSha256": _sha256(PROBE_PROMPT.encode("utf-8")),
            "parameters": {
                "temperature": 0,
                "seed": 7,
                "max_completion_tokens": 256,
                "reasoning_effort": "none",
                "include_reasoning": False,
                "stream": False,
                "tool_choice": "none",
            },
            "textContentShape": "messages[0].content=string",
            "visionContentShape": "messages[0].content=[text,image_url]",
            "imageUrlShape": "image_url.url",
            "syntheticFixture": {
                "bytes": len(fixture),
                "sha256": _sha256(fixture),
            },
        },
        "probes": probes,
        "callBudget": {
            "maximum": 3,
            "probeSlotsUsed": len(probes),
            "providerCalls": sum(item.get("status") in {"OK", "ERROR"} for item in probes),
            "retries": 0,
        },
        "boundaries": {
            "qwenVisionOnly": True,
            "ocrCropAccess": False,
            "documentAiAccess": False,
            "gptOssPathChanged": False,
            "credentialChanged": False,
            "routingChanged": False,
            "activationChanged": False,
            "fallback": False,
            "semanticCorrection": False,
        },
        "credential": {
            "source": "preexisting_credentials_env",
            "mode": credential_mode,
            "valueRetained": False,
        },
    }


def _self_test() -> None:
    text = _request_kwargs(None)
    vision = _request_kwargs("https://example.invalid/image.jpg")
    assert text["model"] == QWEN_MODEL
    assert vision["model"] == QWEN_MODEL
    assert isinstance(text["messages"][0]["content"], str)
    content = vision["messages"][0]["content"]
    assert [item["type"] for item in content] == ["text", "image_url"]
    assert content[1]["image_url"]["url"].startswith("https://")
    assert DEFAULT_MAX_RETRIES == 0
    assert "gpt-oss" not in json.dumps(text).lower()
    print("SELF_TEST_PASS")


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--self-test", action="store_true")
    parser.add_argument("--probe", action="store_true")
    parser.add_argument("--credential-path", type=Path, default=DEFAULT_CREDENTIAL_PATH)
    parser.add_argument("--jpeg-path", type=Path)
    args = parser.parse_args(argv)
    if args.self_test:
        _self_test()
        return 0
    if not args.probe or args.jpeg_path is None:
        parser.error("--probe requires --jpeg-path")
    print(json.dumps(run_probe_sequence(args.credential_path, args.jpeg_path), ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

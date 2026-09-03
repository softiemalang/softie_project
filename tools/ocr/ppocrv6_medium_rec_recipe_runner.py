#!/usr/bin/env -S uv run --script
# /// script
# dependencies = [
#   "paddlepaddle-gpu==3.3.1",
#   "paddlex==3.7.2",
#   "pyarrow==21.0.0",
#   "Pillow==11.3.0",
#   "numpy==2.0.2",
#   "huggingface-hub==0.36.2",
# ]
# ///
"""Run the bounded PP-OCRv6 medium recognition recipe on HF disposable GPU.

The source, model, split, and recipe are all pinned in this file on purpose.
The job downloads only the public ``train`` parquet shards, materializes the
inner-train/inner-dev document split in memory, and never accepts a local path
or a held-out/frozen-gold input.  Result records retain hashes and aggregate
metrics, never transcription, prediction, or image bytes.
"""

from __future__ import annotations

import gc
import hashlib
import json
import math
import os
import platform
import random
import resource
import subprocess
import time
import unicodedata
from collections import Counter, defaultdict
from io import BytesIO
from pathlib import Path
from typing import Any, Iterable, Mapping, Sequence


# These environment variables are set before importing Paddle so that the
# same process configuration is used for both repeats.
for _key, _value in {
    "FLAGS_cpu_deterministic": "1",
    "FLAGS_cudnn_deterministic": "1",
    "FLAGS_paddle_num_threads": "1",
    "OMP_NUM_THREADS": "1",
    "MKL_NUM_THREADS": "1",
    "VECLIB_MAXIMUM_THREADS": "1",
    "TOKENIZERS_PARALLELISM": "false",
    "HF_HUB_DISABLE_XET": "1",
    "PADDLE_PDX_CACHE_HOME": "/tmp/ppocrv6-medium-recipe-paddlex-cache",
}.items():
    os.environ.setdefault(_key, _value)


SCHEMA = "chi-know-po-ppocrv6-medium-rec-hf-recipe-run-v1"
CORPUS_ID = "CHI-KNOW-PO"
DATASET_ID = "calfa-ai/chiknowpo"
DATASET_REVISION = "be857420a96e49b009ef0d3b74fbd6d1b28d5c87"
MODEL_ID = "PaddlePaddle/PP-OCRv6_medium_rec_safetensors"
MODEL_REVISION = "024cad6a831de75c2c3c26e711ba8c4a82ccd24b"
MODEL_WEIGHTS_SHA256 = "5f43c16f2a684b1d2284662178bdb604febd3d6bfdb5ca73828d08d0f7c0c3e9"
MODEL_CHARACTER_SHA256 = "ce2cbde4e573b4791facae91eea497d7a2ae245b30bf73563643a0f4971caa3d"
TRAIN_PARQUET_SHA256 = "97f6fcc531cb79c4e0f2f63a042f52317b9299ed2f13785663c8523c7c0bc25b"
INNER_SPLIT_SHA256 = "617f4c6988438a262fc3412b40e5897a01e0ba7d3c32c6b760db3f67dce18aab"
SEED = 7
IMAGE_SHAPE = (3, 48, 320)
OUTPUT_WIDTH_STRIDE = 8
TRAIN_BATCH_SIZE = 8
DEV_BATCH_SIZE = 32
CAP_PER_DOCUMENT = 64
CHECKPOINT_STEPS = (8, 16)
STAGE_MAX_STEPS = 16
INNER_TRAIN_DOCUMENT_IDS = ("A-1", "A-4", "S-2", "S-4", "S-6", "S-7", "T-1")
INNER_DEV_DOCUMENT_IDS = ("A-3", "S-3", "T-3")
ALL_TRAIN_DOCUMENT_IDS = (
    "A-1", "A-3", "A-4", "S-2", "S-3", "S-4", "S-6", "S-7", "T-1", "T-3"
)
EXPECTED_RECORD_COUNTS = {
    "A-1": 1654,
    "A-3": 590,
    "A-4": 492,
    "S-2": 302,
    "S-3": 1267,
    "S-4": 2532,
    "S-6": 356,
    "S-7": 1766,
    "T-1": 1053,
    "T-3": 832,
}
SHARDS = (
    (
        "data/train-00000-of-00002.parquet",
        "a7e73c9d6a4441d8ab8c1a42eed498757ae19ad1f2e015536fa222e90e1f360d",
    ),
    (
        "data/train-00001-of-00002.parquet",
        "568596476bc25bb68a4576207aad6f52c898cfd9884a2e3aab994333c3db19e3",
    ),
)
STAGES = (
    {
        "id": "s0-head-only",
        "learningRate": 0.00001,
        "trainablePrefixes": ("head.head.",),
        "frozenPrefixes": ("head.encoder.", "model."),
        "requires": "base_reference",
    },
    {
        "id": "s1-head-encoder",
        "learningRate": 0.000003,
        "trainablePrefixes": ("head.head.", "head.encoder."),
        "frozenPrefixes": ("model.",),
        "requires": "s0_checkpoint_dev_non_worse",
    },
    {
        "id": "s2-last-backbone-block",
        "learningRate": 0.000001,
        "trainablePrefixes": (
            "head.head.",
            "head.encoder.",
            "model.backbone.encoder.blocks.3.",
        ),
        "frozenPrefixes": (
            "model.backbone.encoder.stem1.",
            "model.backbone.encoder.blocks.0.",
            "model.backbone.encoder.blocks.1.",
            "model.backbone.encoder.blocks.2.",
        ),
        "requires": "s1_checkpoint_dev_non_worse",
    },
)


def canonical_value(value: Any) -> Any:
    if isinstance(value, float) and math.isfinite(value) and value.is_integer() and abs(value) < 1e21:
        return int(value)
    if isinstance(value, list):
        return [canonical_value(item) for item in value]
    if isinstance(value, tuple):
        return [canonical_value(item) for item in value]
    if isinstance(value, dict):
        return {key: canonical_value(item) for key, item in value.items()}
    return value


def canonical(value: Any) -> str:
    return json.dumps(
        canonical_value(value), ensure_ascii=False, sort_keys=True,
        separators=(",", ":"), allow_nan=False
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


def normalized_text(value: str) -> str:
    return unicodedata.normalize("NFC", value)


def record_id_sha256(row: Mapping[str, Any]) -> str:
    return sha256_text(f"{row['doc_id']}:{row['file_name']}")


def levenshtein(left: str, right: str) -> int:
    previous = list(range(len(right) + 1))
    for left_index, left_char in enumerate(left, start=1):
        current = [left_index]
        for right_index, right_char in enumerate(right, start=1):
            current.append(min(
                current[-1] + 1,
                previous[right_index] + 1,
                previous[right_index - 1] + (left_char != right_char),
            ))
        previous = current
    return previous[-1]


def ctc_minimum_timesteps(labels: Sequence[int]) -> int:
    return len(labels) + sum(left == right for left, right in zip(labels, labels[1:]))


def image_bytes(row: Mapping[str, Any]) -> bytes:
    image = row.get("image")
    if not isinstance(image, Mapping) or not isinstance(image.get("bytes"), (bytes, bytearray)):
        raise RuntimeError("image_bytes_missing")
    return bytes(image["bytes"])


def device_swap_usage() -> dict[str, Any]:
    meminfo = Path("/proc/meminfo")
    if not meminfo.is_file():
        return {"status": "UNKNOWN", "reason": "proc_meminfo_missing"}
    values: dict[str, int] = {}
    for line in meminfo.read_text(encoding="utf-8").splitlines():
        key, _, rest = line.partition(":")
        if key in {"SwapTotal", "SwapFree"}:
            try:
                values[key] = int(rest.strip().split()[0])
            except (ValueError, IndexError):
                pass
    if "SwapTotal" not in values or "SwapFree" not in values:
        return {"status": "UNKNOWN", "reason": "proc_swap_fields_missing"}
    return {
        "status": "OBSERVED",
        "swapTotalMiB": round(values["SwapTotal"] / 1024.0, 3),
        "usedMiB": round((values["SwapTotal"] - values["SwapFree"]) / 1024.0, 3),
        "source": "/proc/meminfo",
    }


def peak_rss_mib() -> float:
    # Linux ru_maxrss is KiB.
    return float(resource.getrusage(resource.RUSAGE_SELF).ru_maxrss) / 1024.0


def cpu_seconds(before: resource.struct_rusage, after: resource.struct_rusage) -> float:
    return (after.ru_utime - before.ru_utime) + (after.ru_stime - before.ru_stime)


def import_runtime() -> dict[str, Any]:
    import numpy as np
    import paddle
    import paddle.nn.functional as F
    import pyarrow.parquet as pq
    from PIL import Image
    from paddlex.inference.models.text_recognition.modeling.pp_ocrv6_small_rec import (
        PPOCRV6SmallRec,
    )
    from paddlex.inference.models.text_recognition.processors import (
        CTCLabelDecode,
        OCRReisizeNormImg,
        ToBatch,
    )

    if not paddle.is_compiled_with_cuda() or paddle.device.cuda.device_count() < 1:
        raise RuntimeError("gpu_required_on_t4_small")
    paddle.set_device("gpu:0")
    paddle.seed(SEED)
    np.random.seed(SEED)
    random.seed(SEED)
    try:
        gpu_name = str(paddle.device.cuda.get_device_name(0))
    except Exception:
        gpu_name = None
    return {
        "np": np,
        "paddle": paddle,
        "F": F,
        "pq": pq,
        "Image": Image,
        "PPOCRV6SmallRec": PPOCRV6SmallRec,
        "CTCLabelDecode": CTCLabelDecode,
        "OCRReisizeNormImg": OCRReisizeNormImg,
        "ToBatch": ToBatch,
        "runtime": {
            "execution": "huggingface_jobs_uv",
            "flavorRequested": "t4-small",
            "python": platform.python_version(),
            "paddle": str(paddle.__version__),
            "os": platform.system().lower(),
            "architecture": platform.machine().lower(),
            "device": "gpu:0",
            "cudaCompiled": True,
            "gpuName": gpu_name,
        },
    }


def download_inputs() -> tuple[Path, list[Path], dict[str, Any]]:
    from huggingface_hub import hf_hub_download, snapshot_download

    model_root = Path(snapshot_download(
        MODEL_ID,
        revision=MODEL_REVISION,
        allow_patterns=("config.json", "preprocessor_config.json", "model.safetensors", "README.md"),
    )).resolve(strict=True)
    required = ("config.json", "preprocessor_config.json", "model.safetensors")
    model_files = {}
    for name in required:
        path = model_root / name
        if not path.is_file():
            raise RuntimeError(f"model_file_missing:{name}")
        model_files[name] = sha256_file(path)
    if model_files["model.safetensors"] != MODEL_WEIGHTS_SHA256:
        raise RuntimeError("model_weights_sha256_mismatch")
    config = json.loads((model_root / "config.json").read_text(encoding="utf-8"))
    preprocessor = json.loads((model_root / "preprocessor_config.json").read_text(encoding="utf-8"))
    chars = preprocessor.get("character_list")
    if config.get("model_type") != "pp_ocrv6_small_rec" or not isinstance(chars, list):
        raise RuntimeError("model_config_or_dictionary_invalid")
    if len(chars) != int(config.get("head_out_channels", -1)) or sha256_json(chars) != MODEL_CHARACTER_SHA256:
        raise RuntimeError("model_dictionary_identity_mismatch")
    readme = model_root / "README.md"
    if not readme.is_file() or "apache-2.0" not in readme.read_text(encoding="utf-8").lower():
        raise RuntimeError("model_license_evidence_missing")

    shard_paths: list[Path] = []
    shard_evidence = []
    for filename, expected_sha256 in SHARDS:
        path = Path(hf_hub_download(
            DATASET_ID,
            filename=filename,
            repo_type="dataset",
            revision=DATASET_REVISION,
        )).resolve(strict=True)
        actual_sha256 = sha256_file(path)
        if actual_sha256 != expected_sha256:
            raise RuntimeError(f"dataset_shard_sha256_mismatch:{filename}")
        shard_paths.append(path)
        shard_evidence.append({
            "filename": filename,
            "sha256": actual_sha256,
            "bytes": path.stat().st_size,
        })
    return model_root, shard_paths, {
        "datasetId": DATASET_ID,
        "datasetRevision": DATASET_REVISION,
        "partition": "train",
        "materializedTrainParquetSha256Expected": TRAIN_PARQUET_SHA256,
        "shards": shard_evidence,
        "modelId": MODEL_ID,
        "modelRevision": MODEL_REVISION,
        "modelFilesSha256": model_files,
        "weightsSha256": model_files["model.safetensors"],
        "characterListLength": len(chars),
        "characterListSha256": sha256_json(chars),
        "license": "Apache-2.0",
        "licenseEvidence": "pinned model README.md",
    }


def iter_rows(ctx: Mapping[str, Any], shard_paths: Sequence[Path], batch_size: int = 256) -> Iterable[dict[str, Any]]:
    required = {"doc_id", "file_name", "transcription", "image"}
    for shard_path in shard_paths:
        parquet = ctx["pq"].ParquetFile(shard_path)
        if not required.issubset(set(parquet.schema_arrow.names)):
            raise RuntimeError("parquet_schema_missing_recognition_columns")
        for batch in parquet.iter_batches(batch_size=batch_size, columns=sorted(required)):
            yield from batch.to_pylist()


def prepare_row(ctx: Mapping[str, Any], row: Mapping[str, Any], char_index: Mapping[str, int]) -> dict[str, Any] | None:
    doc_id = str(row["doc_id"])
    target = normalized_text(str(row["transcription"]))
    labels = [char_index[char] for char in target if char in char_index]
    if any(char not in char_index for char in target) or not labels:
        return None
    image = image_bytes(row)
    with ctx["Image"].open(BytesIO(image)) as opened:
        array = ctx["np"].asarray(opened.convert("RGB"), dtype="uint8").copy()
    pre = ctx["OCRReisizeNormImg"](list(IMAGE_SHAPE))
    processed_width = int(pre([array])[0].shape[2])
    input_length = max(1, int(math.ceil(processed_width / OUTPUT_WIDTH_STRIDE)))
    if ctc_minimum_timesteps(labels) > input_length:
        return None
    return {
        "docId": doc_id,
        "recordIdSha256": sha256_text(f"{doc_id}:{row['file_name']}"),
        "imageSha256": sha256_bytes(image),
        "targetSha256": sha256_text(target),
        "targetLength": len(target),
        "targetText": target,
        "labels": labels,
        "imageBytes": image,
        "processedWidth": processed_width,
    }


def collect_partitions(ctx: Mapping[str, Any], shard_paths: Sequence[Path]) -> tuple[list[dict[str, Any]], list[dict[str, Any]], dict[str, Any]]:
    chars = json.loads(Path(ctx["modelRoot"]) .joinpath("preprocessor_config.json").read_text(encoding="utf-8"))["character_list"]
    char_index = {char: index for index, char in enumerate(chars)}
    selected_by_doc: dict[str, list[dict[str, Any]]] = defaultdict(list)
    dev_rows: list[dict[str, Any]] = []
    raw_counts: Counter[str] = Counter()
    encodable_counts: Counter[str] = Counter()
    excluded_dictionary = 0
    excluded_ctc = 0
    for raw in iter_rows(ctx, shard_paths):
        doc_id = str(raw["doc_id"])
        raw_counts[doc_id] += 1
        if doc_id not in ALL_TRAIN_DOCUMENT_IDS:
            raise RuntimeError("unexpected_train_document_id")
        target = normalized_text(str(raw["transcription"]))
        if any(char not in char_index for char in target):
            excluded_dictionary += 1
            continue
        candidate = prepare_row(ctx, raw, char_index)
        if candidate is None:
            excluded_ctc += 1
            continue
        encodable_counts[doc_id] += 1
        if doc_id in INNER_DEV_DOCUMENT_IDS:
            dev_rows.append(candidate)
        elif len(selected_by_doc[doc_id]) < CAP_PER_DOCUMENT:
            selected_by_doc[doc_id].append(candidate)

    if sorted(raw_counts) != sorted(ALL_TRAIN_DOCUMENT_IDS):
        raise RuntimeError("train_document_allowlist_mismatch")
    if any(raw_counts[doc] != EXPECTED_RECORD_COUNTS[doc] for doc in ALL_TRAIN_DOCUMENT_IDS):
        raise RuntimeError("train_document_record_count_mismatch")
    if any(len(selected_by_doc[doc]) != CAP_PER_DOCUMENT for doc in INNER_TRAIN_DOCUMENT_IDS):
        raise RuntimeError("inner_train_selection_did_not_cover_documents")
    if any(sum(row["docId"] == doc for row in dev_rows) != EXPECTED_RECORD_COUNTS[doc] for doc in INNER_DEV_DOCUMENT_IDS):
        raise RuntimeError("inner_dev_encodable_count_mismatch")

    selected = [row for doc in INNER_TRAIN_DOCUMENT_IDS for row in selected_by_doc[doc]]
    selection_digest = [
        {
            "docId": row["docId"],
            "recordIdSha256": row["recordIdSha256"],
            "imageSha256": row["imageSha256"],
            "targetSha256": row["targetSha256"],
            "targetLength": row["targetLength"],
            "processedWidth": row["processedWidth"],
        }
        for row in sorted(selected, key=lambda item: (item["processedWidth"], item["docId"], item["recordIdSha256"]))
    ]
    selection = {
        "method": "first_encodable_records_per_document_v1",
        "capPerDocument": CAP_PER_DOCUMENT,
        "selectedRecordCount": len(selected),
        "selectedRecordsSha256": sha256_json(selection_digest),
        "documentIds": list(INNER_TRAIN_DOCUMENT_IDS),
        "totalRowsByDocument": dict(sorted(raw_counts.items())),
        "encodableRowsByDocument": dict(sorted(encodable_counts.items())),
        "dictionaryExcludedRows": excluded_dictionary,
        "ctcExcludedRows": excluded_ctc,
        "rawTextRetained": False,
        "rawImagesRetained": False,
    }
    train_schedule = []
    for offset in range(CAP_PER_DOCUMENT):
        for doc in INNER_TRAIN_DOCUMENT_IDS:
            train_schedule.append(selected_by_doc[doc][offset])
    train_schedule = train_schedule[: len(selected)]
    dev_rows.sort(key=lambda row: (row["docId"], row["recordIdSha256"]))
    partition_evidence = {
        "trainDocumentIds": list(INNER_TRAIN_DOCUMENT_IDS),
        "devDocumentIds": list(INNER_DEV_DOCUMENT_IDS),
        "trainRecordCount": len(selected),
        "devRecordCount": len(dev_rows),
        "devRecordsByDocument": {doc: sum(row["docId"] == doc for row in dev_rows) for doc in INNER_DEV_DOCUMENT_IDS},
        "selection": selection,
        "scheduleSha256": sha256_json([
            {"docId": row["docId"], "recordIdSha256": row["recordIdSha256"]}
            for row in train_schedule
        ]),
        "innerSplitSha256": INNER_SPLIT_SHA256,
        "heldOutAccessed": False,
        "frozenDomainGoldAccessed": False,
    }
    return train_schedule, dev_rows, partition_evidence


def image_array(ctx: Mapping[str, Any], row: Mapping[str, Any]):
    with ctx["Image"].open(BytesIO(row["imageBytes"])) as opened:
        return ctx["np"].asarray(opened.convert("RGB"), dtype="uint8").copy()


def label_batch(ctx: Mapping[str, Any], rows: Sequence[Mapping[str, Any]]):
    labels = [row["labels"] for row in rows]
    max_length = max(len(label) for label in labels)
    padded = ctx["np"].zeros((len(labels), max_length), dtype="int32")
    for index, label in enumerate(labels):
        padded[index, : len(label)] = label
    lengths = ctx["np"].asarray([len(label) for label in labels], dtype="int64")
    return padded, lengths


def preprocess_batch(ctx: Mapping[str, Any], rows: Sequence[Mapping[str, Any]]):
    pre = ctx["OCRReisizeNormImg"](list(IMAGE_SHAPE))
    processed = pre([image_array(ctx, row) for row in rows])
    batch = ctx["ToBatch"]()(processed)[0]
    input_lengths = ctx["np"].asarray(
        [max(1, int(math.ceil(int(item.shape[2]) / OUTPUT_WIDTH_STRIDE))) for item in processed],
        dtype="int64",
    )
    return batch, input_lengths


def make_batches(ctx: Mapping[str, Any], rows: Sequence[dict[str, Any]], batch_size: int, with_labels: bool):
    batches = []
    for start in range(0, len(rows), batch_size):
        batch_rows = rows[start : start + batch_size]
        batch, input_lengths = preprocess_batch(ctx, batch_rows)
        labels = label_batch(ctx, batch_rows) if with_labels else None
        batches.append({"rows": batch_rows, "batch": batch, "inputLengths": input_lengths, "labels": labels})
    return batches


def load_model(ctx: Mapping[str, Any], model_root: Path):
    return ctx["PPOCRV6SmallRec"].from_pretrained(str(model_root), convert_from_hf=True)


def model_logits(ctx: Mapping[str, Any], model, batch):
    paddle = ctx["paddle"]
    features = model.model(paddle.to_tensor(batch))
    encoded = model.head.encoder(features)
    return model.head.head(encoded)


def state_digest(state: Mapping[str, Any]) -> str:
    digest = hashlib.sha256()
    for name in sorted(state):
        array = state[name].numpy()
        digest.update(name.encode("utf-8"))
        digest.update(b"\0")
        digest.update(str(array.dtype).encode("ascii"))
        digest.update(repr(tuple(array.shape)).encode("ascii"))
        digest.update(array.tobytes(order="C"))
        digest.update(b"\0")
    return digest.hexdigest()


def decoder_descriptor(model_evidence: Mapping[str, Any]) -> dict[str, Any]:
    return {
        "class": "PaddleX CTCLabelDecode",
        "characterListLength": model_evidence["characterListLength"],
        "characterListSha256": model_evidence["characterListSha256"],
        "blankIndex": 0,
        "spaceCharacter": True,
        "semanticCorrection": False,
    }


def evaluate(ctx: Mapping[str, Any], model, dev_batches: Sequence[Mapping[str, Any]], chars: Sequence[str], model_evidence: Mapping[str, Any]) -> dict[str, Any]:
    paddle = ctx["paddle"]
    decoder = ctx["CTCLabelDecode"](character_list=list(chars[1:-1]), use_space_char=True)
    by_doc: dict[str, dict[str, Any]] = {
        doc: {"records": [], "confidences": [], "exactMatchRuns": 0, "totalEditDistance": 0, "totalTargetCharacters": 0}
        for doc in INNER_DEV_DOCUMENT_IDS
    }
    with paddle.no_grad():
        for item in dev_batches:
            probabilities = paddle.nn.functional.softmax(
                model_logits(ctx, model, item["batch"]), axis=2
            ).numpy()
            texts, scores = decoder([probabilities])
            for row, text, score in zip(item["rows"], texts, scores):
                prediction = str(text)
                target = row["targetText"]
                distance = levenshtein(prediction, target)
                confidence_value = float(score)
                confidence = round(confidence_value, 9) if math.isfinite(confidence_value) else None
                doc = by_doc[row["docId"]]
                exact = prediction == target
                doc["records"].append({
                    "docId": row["docId"],
                    "recordIdSha256": row["recordIdSha256"],
                    "targetTextSha256": row["targetSha256"],
                    "targetTextLength": len(target),
                    "predictionTextSha256": sha256_text(prediction),
                    "predictionTextLength": len(prediction),
                    "exactMatch": exact,
                    "editDistance": distance,
                })
                if confidence is not None:
                    doc["confidences"].append(confidence)
                doc["exactMatchRuns"] += int(exact)
                doc["totalEditDistance"] += distance
                doc["totalTargetCharacters"] += len(target)
            del probabilities

    documents = []
    for doc_id in INNER_DEV_DOCUMENT_IDS:
        doc = by_doc[doc_id]
        records = doc["records"]
        confidences = doc["confidences"]
        documents.append({
            "docId": doc_id,
            "recordCount": len(records),
            "exactMatchRuns": doc["exactMatchRuns"],
            "exactMatchRate": doc["exactMatchRuns"] / len(records) if records else None,
            "totalEditDistance": doc["totalEditDistance"],
            "totalTargetCharacters": doc["totalTargetCharacters"],
            "characterErrorRate": (
                doc["totalEditDistance"] / doc["totalTargetCharacters"]
                if doc["totalTargetCharacters"] else None
            ),
            "confidencePresentRuns": len(confidences),
            "confidenceMean": sum(confidences) / len(confidences) if confidences else None,
            "confidenceMin": min(confidences) if confidences else None,
            "confidenceMax": max(confidences) if confidences else None,
            "recordDigestSha256": sha256_json(records),
            "confidenceDigestSha256": sha256_json([
                {"recordIdSha256": record["recordIdSha256"], "confidence": confidence}
                for record, confidence in zip(records, confidences)
            ]) if len(confidences) == len(records) else None,
        })
    record_count = sum(doc["recordCount"] for doc in documents)
    exact_runs = sum(doc["exactMatchRuns"] for doc in documents)
    edit_distance = sum(doc["totalEditDistance"] for doc in documents)
    target_characters = sum(doc["totalTargetCharacters"] for doc in documents)
    all_confidences = [value for doc in by_doc.values() for value in doc["confidences"]]
    # The output identity intentionally contains only hashes and integer
    # counts.  This makes the digest independently reproducible by the local
    # JavaScript validator without relying on language-specific float JSON
    # formatting for confidence aggregates.
    output_payload = {
        "decoder": decoder_descriptor(model_evidence),
        "documents": [
            {
                "docId": doc["docId"],
                "recordCount": doc["recordCount"],
                "exactMatchRuns": doc["exactMatchRuns"],
                "totalEditDistance": doc["totalEditDistance"],
                "totalTargetCharacters": doc["totalTargetCharacters"],
                "recordDigestSha256": doc["recordDigestSha256"],
                "confidenceDigestSha256": doc["confidenceDigestSha256"],
            }
            for doc in documents
        ],
    }
    return {
        "metrics": {
            "recordCount": record_count,
            "exactMatchRuns": exact_runs,
            "exactMatchRate": exact_runs / record_count if record_count else None,
            "totalEditDistance": edit_distance,
            "totalTargetCharacters": target_characters,
            "characterErrorRate": edit_distance / target_characters if target_characters else None,
            "confidencePresentRuns": len(all_confidences),
            "confidenceMean": sum(all_confidences) / len(all_confidences) if all_confidences else None,
            "confidenceMin": min(all_confidences) if all_confidences else None,
            "confidenceMax": max(all_confidences) if all_confidences else None,
        },
        "documents": documents,
        "outputSha256": sha256_json(output_payload),
        "rawTextOrImagesRetained": False,
    }


def set_stage_trainable(model, ctx: Mapping[str, Any], stage: Mapping[str, Any]):
    prefixes = tuple(stage["trainablePrefixes"])
    trainable = []
    counts = Counter()
    for name, parameter in model.named_parameters():
        enabled = any(name.startswith(prefix) for prefix in prefixes)
        parameter.stop_gradient = not enabled
        if enabled:
            trainable.append(parameter)
            counts[prefix_for_name(name, prefixes)] += 1
    model.eval()
    for name, layer in model.named_sublayers():
        if any(name == prefix.rstrip(".") or name.startswith(prefix) for prefix in prefixes):
            layer.train()
    if not trainable:
        raise RuntimeError(f"stage_has_no_trainable_parameters:{stage['id']}")
    return trainable, dict(sorted(counts.items()))


def prefix_for_name(name: str, prefixes: Sequence[str]) -> str:
    for prefix in prefixes:
        if name.startswith(prefix):
            return prefix
    return "unmatched"


def finite_parameters(ctx: Mapping[str, Any], model) -> bool:
    paddle = ctx["paddle"]
    return all(bool(paddle.all(paddle.isfinite(parameter)).numpy().item()) for parameter in model.parameters())


def train_step(ctx: Mapping[str, Any], model, optimizer, item: Mapping[str, Any]) -> tuple[float, float, float, bool]:
    paddle = ctx["paddle"]
    logits = model_logits(ctx, model, item["batch"])
    actual_time = int(logits.shape[1])
    input_lengths = ctx["np"].minimum(item["inputLengths"], actual_time).astype("int64")
    labels, label_lengths = item["labels"]
    loss = ctx["F"].ctc_loss(
        paddle.transpose(logits, [1, 0, 2]),
        paddle.to_tensor(labels),
        paddle.to_tensor(input_lengths),
        paddle.to_tensor(label_lengths),
        blank=0,
        reduction="mean",
        norm_by_times=False,
        zero_infinity=True,
    )
    loss_value = float(loss.numpy().item())
    if not math.isfinite(loss_value):
        return loss_value, float("nan"), float("nan"), False
    loss.backward()
    max_abs = 0.0
    sum_squares = 0.0
    gradients_finite = True
    for parameter in model.parameters():
        gradient = parameter.grad
        if gradient is None:
            continue
        values = gradient.numpy()
        if not bool(ctx["np"].isfinite(values).all()):
            gradients_finite = False
        if values.size:
            max_abs = max(max_abs, float(ctx["np"].abs(values).max()))
            sum_squares += float(ctx["np"].square(values).sum())
    global_norm = math.sqrt(sum_squares)
    optimizer.step()
    optimizer.clear_grad()
    stable = gradients_finite and finite_parameters(ctx, model)
    return loss_value, max_abs, global_norm, stable


def compare_to_base(candidate: Mapping[str, Any], base: Mapping[str, Any]) -> dict[str, Any]:
    base_docs = {doc["docId"]: doc for doc in base["documents"]}
    candidate_docs = {doc["docId"]: doc for doc in candidate["documents"]}
    per_doc = {}
    for doc_id in INNER_DEV_DOCUMENT_IDS:
        before = base_docs[doc_id]
        after = candidate_docs[doc_id]
        per_doc[doc_id] = {
            "cerNonWorse": after["characterErrorRate"] <= before["characterErrorRate"],
            "exactNonWorse": after["exactMatchRuns"] >= before["exactMatchRuns"],
            "cerStrictGain": after["characterErrorRate"] < before["characterErrorRate"],
            "exactStrictGain": after["exactMatchRuns"] > before["exactMatchRuns"],
        }
    aggregate = {
        "cerStrictlyImproved": candidate["metrics"]["characterErrorRate"] < base["metrics"]["characterErrorRate"],
        "exactNonWorse": candidate["metrics"]["exactMatchRuns"] >= base["metrics"]["exactMatchRuns"],
    }
    all_doc_non_worse = all(item["cerNonWorse"] and item["exactNonWorse"] for item in per_doc.values())
    strict_doc_gain = any(item["cerStrictGain"] or item["exactStrictGain"] for item in per_doc.values())
    dev_worsened = (
        not aggregate["exactNonWorse"]
        or candidate["metrics"]["characterErrorRate"] > base["metrics"]["characterErrorRate"]
        or not all_doc_non_worse
    )
    passes = (
        aggregate["cerStrictlyImproved"]
        and aggregate["exactNonWorse"]
        and all_doc_non_worse
        and strict_doc_gain
    )
    return {
        "aggregate": aggregate,
        "perDocument": per_doc,
        "allDocumentsNonWorse": all_doc_non_worse,
        "atLeastOneStrictDocumentGain": strict_doc_gain,
        "devWorsened": dev_worsened,
        "passesPromotionCriteria": passes,
    }


def gpu_peak_memory_mib(ctx: Mapping[str, Any]) -> float | None:
    try:
        return round(float(ctx["paddle"].device.cuda.max_memory_allocated()) / (1024.0 * 1024.0), 3)
    except Exception:
        return None


def resource_evidence(ctx: Mapping[str, Any], started: float, cpu_before: resource.struct_rusage, swap_before: Mapping[str, Any]) -> dict[str, Any]:
    swap_after = device_swap_usage()
    before_used = swap_before.get("usedMiB") if swap_before.get("status") == "OBSERVED" else None
    after_used = swap_after.get("usedMiB") if swap_after.get("status") == "OBSERVED" else None
    return {
        "peak_rss_mib": round(peak_rss_mib(), 3),
        "gpu_peak_memory_mib": gpu_peak_memory_mib(ctx),
        "wall_time_ms": round((time.perf_counter() - started) * 1000.0, 3),
        "cpu_seconds": round(cpu_seconds(cpu_before, resource.getrusage(resource.RUSAGE_SELF)), 6),
        "swap": {
            "before": swap_before,
            "after": swap_after,
            "deltaMiB": round(after_used - before_used, 3) if before_used is not None and after_used is not None else None,
        },
        "telemetryComplete": after_used is not None and gpu_peak_memory_mib(ctx) is not None,
    }


def checkpoint(ctx: Mapping[str, Any], model_root: Path, model, dev_batches, chars, model_evidence, repeat: int, stage_id: str, step: int, base_eval: Mapping[str, Any]) -> dict[str, Any]:
    checkpoint_path = Path(f"/tmp/ppocrv6-medium-recipe-repeat-{repeat}-{stage_id}-step-{step}.pdparams")
    state = model.state_dict()
    live_parameter_sha = state_digest(state)
    ctx["paddle"].save(state, str(checkpoint_path))
    checkpoint_sha = sha256_file(checkpoint_path)
    loaded_state = ctx["paddle"].load(str(checkpoint_path))
    loaded_parameter_sha = state_digest(loaded_state)
    reloaded = load_model(ctx, model_root)
    reloaded.set_state_dict(loaded_state)
    reloaded_parameter_sha = state_digest(reloaded.state_dict())
    live_eval = evaluate(ctx, model, dev_batches, chars, model_evidence)
    reload_eval = evaluate(ctx, reloaded, dev_batches, chars, model_evidence)
    comparison = compare_to_base(live_eval, base_eval)
    output_roundtrip = live_eval["outputSha256"] == reload_eval["outputSha256"]
    result = {
        "repeat": repeat,
        "stageId": stage_id,
        "step": step,
        "checkpointSha256": checkpoint_sha,
        "checkpointPathOmitted": True,
        "checkpointRetention": "job_ephemeral",
        "parameterSha256Live": live_parameter_sha,
        "parameterSha256LoadedState": loaded_parameter_sha,
        "parameterSha256Reloaded": reloaded_parameter_sha,
        "weightDigestRoundTripPass": live_parameter_sha == loaded_parameter_sha == reloaded_parameter_sha,
        "liveEvaluation": live_eval,
        "reloadEvaluation": reload_eval,
        "outputRoundTripPass": output_roundtrip,
        "comparisonToBase": comparison,
        "decoderRoundTripPass": output_roundtrip and live_eval["rawTextOrImagesRetained"] is False,
    }
    del reloaded, loaded_state, state
    gc.collect()
    print("HF_CHECKPOINT_EVIDENCE " + json.dumps({
        "repeat": repeat,
        "stageId": stage_id,
        "step": step,
        "checkpointSha256": checkpoint_sha,
        "parameterSha256": live_parameter_sha,
        "outputSha256": live_eval["outputSha256"],
        "reloadOutputSha256": reload_eval["outputSha256"],
        "cer": live_eval["metrics"]["characterErrorRate"],
        "exact": live_eval["metrics"]["exactMatchRuns"],
    }, sort_keys=True), flush=True)
    return result


def run_repeat(ctx: Mapping[str, Any], model_root: Path, train_batches, dev_batches, chars, model_evidence, repeat: int) -> dict[str, Any]:
    paddle = ctx["paddle"]
    paddle.seed(SEED)
    ctx["np"].random.seed(SEED)
    random.seed(SEED)
    model = load_model(ctx, model_root)
    base_parameter_sha = state_digest(model.state_dict())
    base_eval = evaluate(ctx, model, dev_batches, chars, model_evidence)
    stages = []
    selected = None
    recipe_usable = True
    for stage in STAGES:
        if not recipe_usable:
            break
        trainable, selector_counts = set_stage_trainable(model, ctx, stage)
        optimizer = paddle.optimizer.Adam(
            learning_rate=stage["learningRate"],
            parameters=trainable,
            weight_decay=0,
            grad_clip=paddle.nn.ClipGradByGlobalNorm(clip_norm=1.0),
            beta1=0.9,
            beta2=0.999,
        )
        stage_result = {
            "id": stage["id"],
            "learningRate": stage["learningRate"],
            "maxSteps": STAGE_MAX_STEPS,
            "checkpointEverySteps": list(CHECKPOINT_STEPS),
            "trainablePrefixes": list(stage["trainablePrefixes"]),
            "frozenPrefixes": list(stage["frozenPrefixes"]),
            "selectorParameterCounts": selector_counts,
            "trainableParameterCount": len(trainable),
            "gradientClip": {"implementation": "paddle.nn.ClipGradByGlobalNorm", "maxNorm": 1},
            "optimizerStateReset": True,
            "losses": [],
            "gradientMaxAbs": [],
            "gradientGlobalNormBeforeClip": [],
            "stepsCompleted": 0,
            "stable": True,
            "checkpoints": [],
            "stopReason": None,
        }
        for step in range(1, STAGE_MAX_STEPS + 1):
            item = train_batches[(step - 1) % len(train_batches)]
            loss, gradient_max_abs, gradient_norm, stable = train_step(ctx, model, optimizer, item)
            stage_result["losses"].append(round(loss, 9) if math.isfinite(loss) else None)
            stage_result["gradientMaxAbs"].append(round(gradient_max_abs, 9) if math.isfinite(gradient_max_abs) else None)
            stage_result["gradientGlobalNormBeforeClip"].append(round(gradient_norm, 9) if math.isfinite(gradient_norm) else None)
            stage_result["stepsCompleted"] = step if stable else step - 1
            if not stable:
                stage_result["stable"] = False
                stage_result["stopReason"] = "nonfinite_loss_gradient_or_parameter"
                recipe_usable = False
                break
            if step in CHECKPOINT_STEPS:
                cp = checkpoint(ctx, model_root, model, dev_batches, chars, model_evidence, repeat, stage["id"], step, base_eval)
                stage_result["checkpoints"].append(cp)
                if not cp["weightDigestRoundTripPass"] or not cp["outputRoundTripPass"]:
                    stage_result["stable"] = False
                    stage_result["stopReason"] = "checkpoint_round_trip_failed"
                    recipe_usable = False
                    break
                if cp["comparisonToBase"]["devWorsened"]:
                    stage_result["stopReason"] = "dev_worsened_against_base"
                    recipe_usable = False
                    break
                if cp["comparisonToBase"]["passesPromotionCriteria"]:
                    selected = cp
                    stage_result["stopReason"] = "earliest_passing_checkpoint"
                    recipe_usable = False
                    break
        stages.append(stage_result)
    if selected is None and recipe_usable:
        # All stages completed without a strict passing checkpoint.
        recipe_usable = False
    return {
        "repeat": repeat,
        "seed": SEED,
        "baseParameterSha256": base_parameter_sha,
        "baseEvaluation": base_eval,
        "stages": stages,
        "selectedCheckpoint": selected,
        "baseRetainedExplicitly": selected is None,
        "repeatRecipeUsable": selected is not None,
    }


def comparable_repeat_payload(repeat: Mapping[str, Any]) -> dict[str, Any]:
    return {
        "baseParameterSha256": repeat["baseParameterSha256"],
        "baseOutputSha256": repeat["baseEvaluation"]["outputSha256"],
        "stages": [
            {
                "id": stage["id"],
                "stepsCompleted": stage["stepsCompleted"],
                "stable": stage["stable"],
                "stopReason": stage["stopReason"],
                "checkpoints": [
                    {
                        "stageId": cp["stageId"],
                        "step": cp["step"],
                        "checkpointSha256": cp["checkpointSha256"],
                        "parameterSha256Live": cp["parameterSha256Live"],
                        "parameterSha256LoadedState": cp["parameterSha256LoadedState"],
                        "parameterSha256Reloaded": cp["parameterSha256Reloaded"],
                        "outputSha256": cp["liveEvaluation"]["outputSha256"],
                        "reloadOutputSha256": cp["reloadEvaluation"]["outputSha256"],
                        "metrics": cp["liveEvaluation"]["metrics"],
                        "documents": cp["liveEvaluation"]["documents"],
                    }
                    for cp in stage["checkpoints"]
                ],
            }
            for stage in repeat["stages"]
        ],
        "selected": (
            {"stageId": repeat["selectedCheckpoint"]["stageId"], "step": repeat["selectedCheckpoint"]["step"]}
            if repeat["selectedCheckpoint"] else None
        ),
    }


def boundary_descriptor() -> dict[str, Any]:
    return {
        "BLOCK_OCR_ROUTE": True,
        "OCRProvider": {"enabled": False},
        "activation": False,
        "detectionTouched": False,
        "frozenDomainGoldAccessed": False,
        "heldOutAccessed": False,
        "search": False,
        "historicalSourceJudgment": False,
        "semanticCorrection": False,
        "silentFallback": False,
        "rawTextOrImagesRetained": False,
    }


def failed_result(exc: Exception) -> dict[str, Any]:
    return {
        "schema": SCHEMA,
        "status": "FAILED_EXECUTION",
        "decision": "RECIPE_NOT_PROVEN",
        "baseRetainedExplicitly": True,
        "failureType": type(exc).__name__,
        "failureMessageSha256": sha256_text(str(exc)),
        "boundaries": boundary_descriptor(),
        "execution": {"localTraining": False, "heldOutAccessed": False, "frozenDomainGoldAccessed": False},
    }


def main() -> None:
    started = time.perf_counter()
    cpu_before = resource.getrusage(resource.RUSAGE_SELF)
    swap_before = device_swap_usage()
    try:
        ctx = import_runtime()
        model_root, shard_paths, source_evidence = download_inputs()
        ctx["modelRoot"] = model_root
        train_rows, dev_rows, partition_evidence = collect_partitions(ctx, shard_paths)
        chars = json.loads((model_root / "preprocessor_config.json").read_text(encoding="utf-8"))["character_list"]
        train_batches = make_batches(ctx, train_rows, TRAIN_BATCH_SIZE, with_labels=True)
        dev_batches = make_batches(ctx, dev_rows, DEV_BATCH_SIZE, with_labels=False)
        repeats = [run_repeat(ctx, model_root, train_batches, dev_batches, chars, source_evidence, repeat) for repeat in (1, 2)]
        repeat_payloads = [comparable_repeat_payload(repeat) for repeat in repeats]
        repeat_sha = [sha256_json(payload) for payload in repeat_payloads]
        reproducibility_pass = repeat_sha[0] == repeat_sha[1]
        strict_selected = all(repeat["selectedCheckpoint"] is not None for repeat in repeats)
        selected_same = (
            strict_selected
            and repeats[0]["selectedCheckpoint"]["stageId"] == repeats[1]["selectedCheckpoint"]["stageId"]
            and repeats[0]["selectedCheckpoint"]["step"] == repeats[1]["selectedCheckpoint"]["step"]
        )
        resource_evidence_value = resource_evidence(ctx, started, cpu_before, swap_before)
        resource_pass = resource_evidence_value["telemetryComplete"]
        recipe_proven = reproducibility_pass and strict_selected and selected_same and resource_pass
        result = {
            "schema": SCHEMA,
            "status": "COMPLETED",
            "decision": "RECIPE_PROVEN" if recipe_proven else "RECIPE_NOT_PROVEN",
            "baseRetainedExplicitly": not recipe_proven,
            "candidate": {
                "workerId": "pp-ocrv6-medium-rec",
                "component": "rec",
                "model": source_evidence,
                "loader": "PaddleX PPOCRV6SmallRec.from_pretrained(convert_from_hf=True)",
            },
            "source": {
                **source_evidence,
                "corpusId": CORPUS_ID,
                "sourceSplit": "train",
                "documentUnit": True,
                "innerSplitSha256": INNER_SPLIT_SHA256,
                "innerTrainDocumentIds": list(INNER_TRAIN_DOCUMENT_IDS),
                "innerDevDocumentIds": list(INNER_DEV_DOCUMENT_IDS),
                "heldOutDownloaded": False,
                "frozenDomainGoldDownloaded": False,
                "rawTextOrImagesRetained": False,
            },
            "recipe": {
                "name": "conservative-progressive-unfreeze-v1",
                "seed": SEED,
                "trainPartition": "inner-train",
                "devPartition": "inner-dev",
                "trainSelection": partition_evidence["selection"],
                "stages": [
                    {
                        "id": stage["id"],
                        "learningRate": stage["learningRate"],
                        "maxSteps": STAGE_MAX_STEPS,
                        "checkpointEverySteps": list(CHECKPOINT_STEPS),
                        "trainablePrefixes": list(stage["trainablePrefixes"]),
                        "frozenPrefixes": list(stage["frozenPrefixes"]),
                        "gradientClipping": {"implementation": "paddle.nn.ClipGradByGlobalNorm", "maxNorm": 1},
                    }
                    for stage in STAGES
                ],
                "fullFineTuning": False,
                "augmentation": False,
                "semanticCorrection": False,
            },
            "partition": partition_evidence,
            "runtime": ctx["runtime"],
            "decoder": decoder_descriptor(source_evidence),
            "repeats": repeats,
            "reproducibility": {
                "policy": "two_repeats_same_seed_checkpoint_and_dev_hashes",
                "repeatPayloadSha256": repeat_sha,
                "pass": reproducibility_pass,
            },
            "resource": resource_evidence_value,
            "promotion": {
                "recipeProven": recipe_proven,
                "nextFineTuningGate": "READY_FOR_NEXT_FINE_TUNING_GATE_ONLY" if recipe_proven else "NOT_OPEN",
                "activation": "SEPARATE_DECISION_REQUIRED",
                "automaticActivation": False,
                "baseRetainedExplicitly": not recipe_proven,
            },
            "boundaries": boundary_descriptor(),
            "evidenceRefs": [
                "artifacts/historical-ocr-chi-know-po-medium-rec-recipe-v1/recipe-design.json",
                "artifacts/historical-ocr-chi-know-po-medium-rec-recipe-v1/inner-dev-split.json",
            ],
        }
    except Exception as exc:
        result = failed_result(exc)
    print("HF_RECIPE_RESULT_JSON_BEGIN", flush=True)
    print(canonical(result), end="", flush=True)
    print("HF_RECIPE_RESULT_JSON_END", flush=True)


if __name__ == "__main__":
    main()

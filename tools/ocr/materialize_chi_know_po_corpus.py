#!/usr/bin/env python3
"""Materialize a pinned CHI-KNOW-PO document split without model execution.

The source parquet files are treated as immutable inputs.  This script only
reads the pinned local copy, derives exact hashes/identities, writes a full
train and untouched-held-out parquet snapshot, and emits hash-only locator
manifests.  It does not load a model, fine-tune, read frozen OCR gold, or
change an OCR route.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import sys
from collections import defaultdict
from pathlib import Path
from typing import Any, Dict, Iterable, List, Mapping, MutableMapping, Sequence, Tuple


DATA_FILES = (
    "data/test-00000-of-00001.parquet",
    "data/train-00000-of-00002.parquet",
    "data/train-00001-of-00002.parquet",
    "data/validation-00000-of-00001.parquet",
)
EXPECTED_REVISION = "be857420a96e49b009ef0d3b74fbd6d1b28d5c87"
EXPECTED_DATASET = "calfa-ai/chiknowpo"
EXPECTED_CORPUS_ID = "CHI-KNOW-PO"
HELD_OUT_DOCUMENT_IDS = ("S-1", "S-5", "T-2")
EXPECTED_COLUMNS = (
    "file_name",
    "transcription",
    "source_page",
    "doc_id",
    "title_zh",
    "title_en",
    "title_abbr",
    "author",
    "compiler",
    "main_text_creation",
    "edition",
    "type",
    "library",
    "call_number",
    "image",
)
IDENTITY_FIELDS = (
    "title_zh",
    "title_en",
    "title_abbr",
    "author",
    "compiler",
    "main_text_creation",
    "edition",
    "type",
    "library",
    "call_number",
)
RECORD_ID = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._:-]{0,191}$")


def canonical(value: Any) -> bytes:
    return (json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":")) + "\n").encode("utf-8")


def sha256_bytes(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def sha256_json(value: Any) -> str:
    return sha256_bytes(canonical(value))


def fail(code: str) -> None:
    raise RuntimeError(code)


def read_json(path: Path) -> Any:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception as error:
        fail(f"json_read_failed:{path}:{type(error).__name__}")


def write_json(path: Path, value: Any) -> str:
    path.parent.mkdir(parents=True, exist_ok=True)
    payload = canonical(value)
    path.write_bytes(payload)
    return sha256_bytes(payload)


def write_jsonl(path: Path, values: Iterable[Mapping[str, Any]]) -> str:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("wb") as handle:
        for value in values:
            handle.write(canonical(dict(value)))
    return sha256_file(path)


def check_hash(value: str, label: str) -> None:
    if not isinstance(value, str) or not re.fullmatch(r"[a-f0-9]{64}", value):
        fail(f"{label}_sha256_invalid")


def safe_read_only(path: Path) -> None:
    """Freeze only files/directories created in the explicit source snapshot."""

    for child in sorted(path.rglob("*")):
        if child.is_dir():
            os.chmod(child, 0o555)
        else:
            os.chmod(child, 0o444)
    os.chmod(path, 0o555)


def source_file_inventory(source_root: Path) -> Tuple[Mapping[str, Any], List[Mapping[str, Any]]]:
    revision_record = read_json(source_root / "hub-revision.json")
    tree_record = read_json(source_root / "hub-tree-data.json")
    if revision_record.get("id") != EXPECTED_DATASET:
        fail("hub_dataset_id_mismatch")
    if revision_record.get("sha") != EXPECTED_REVISION:
        fail("hub_revision_mismatch")
    if revision_record.get("private") is not False or revision_record.get("gated") is not False or revision_record.get("disabled") is not False:
        fail("hub_access_boundary_not_public_readable")
    if not isinstance(tree_record, list):
        fail("hub_tree_not_array")

    tree_files = {item.get("path"): item for item in tree_record if item.get("type") == "file"}
    expected_paths = ("README.md", ".gitattributes", *DATA_FILES)
    missing = [path for path in expected_paths if path not in tree_files]
    if missing:
        fail(f"hub_tree_missing:{','.join(missing)}")

    files: List[Mapping[str, Any]] = []
    for relative_path in expected_paths:
        metadata = tree_files[relative_path]
        local_path = source_root / relative_path
        if not local_path.is_file():
            fail(f"source_file_missing:{relative_path}")
        local_size = local_path.stat().st_size
        if local_size != metadata.get("size"):
            fail(f"source_file_size_mismatch:{relative_path}")
        local_sha = sha256_file(local_path)
        lfs = metadata.get("lfs") or {}
        if relative_path.startswith("data/"):
            if lfs.get("oid") != local_sha:
                fail(f"source_file_lfs_sha256_mismatch:{relative_path}")
            if lfs.get("size") != local_size:
                fail(f"source_file_lfs_size_mismatch:{relative_path}")
        files.append(
            {
                "path": relative_path,
                "localPath": f"source/{relative_path}",
                "bytes": local_size,
                "localSha256": local_sha,
                "hubGitObjectId": metadata.get("oid"),
                "hubLfsSha256": lfs.get("oid") or None,
                "hubLfsBytes": lfs.get("size") or None,
                "lastCommit": metadata.get("lastCommit"),
            }
        )
    return revision_record, files


def expected_viewer_rows(source_root: Path) -> Mapping[str, int]:
    value = read_json(source_root / "hub-viewer-size.json")
    sizes = value.get("size", {})
    dataset = sizes.get("dataset", {})
    if dataset.get("dataset") != EXPECTED_DATASET or dataset.get("num_rows") != 13634 or dataset.get("num_columns") is not None and dataset.get("num_columns") != 15:
        # The top-level dataset response has no num_columns on the current API;
        # the per-config entry below is the column-count assertion.
        if dataset.get("dataset") != EXPECTED_DATASET or dataset.get("num_rows") != 13634:
            fail("viewer_size_dataset_summary_mismatch")
    configs = [item for item in sizes.get("configs", []) if item.get("config") == "default"]
    if len(configs) != 1 or configs[0].get("num_rows") != 13634 or configs[0].get("num_columns") != 15:
        fail("viewer_size_config_summary_mismatch")
    splits = {item.get("split"): item for item in sizes.get("splits", [])}
    expected = {"train": 10907, "validation": 1363, "test": 1364}
    if any(splits.get(name, {}).get("num_rows") != rows for name, rows in expected.items()):
        fail("viewer_size_split_summary_mismatch")
    return expected


def source_split_for(path: str) -> str:
    name = Path(path).name
    for split in ("train", "validation", "test"):
        if name.startswith(f"{split}-"):
            return split
    fail(f"source_split_unknown:{path}")


def iter_source_batches(source_root: Path, parquet_module: Any) -> Iterable[Tuple[str, str, int, int, Any, List[Mapping[str, Any]]]]:
    for relative_path in DATA_FILES:
        path = source_root / relative_path
        parquet_file = parquet_module.ParquetFile(path)
        if tuple(parquet_file.schema_arrow.names) != EXPECTED_COLUMNS:
            fail(f"source_schema_mismatch:{relative_path}")
        source_split = source_split_for(relative_path)
        source_row_index = 0
        for row_group_index in range(parquet_file.metadata.num_row_groups):
            row_group_row_index = 0
            for batch in parquet_file.iter_batches(row_groups=[row_group_index], batch_size=128):
                rows = batch.to_pylist()
                yield relative_path, source_split, source_row_index, row_group_index, batch, rows
                source_row_index += len(rows)
                row_group_row_index += len(rows)


def make_record(
    row: Mapping[str, Any],
    relative_path: str,
    source_split: str,
    source_row_index: int,
    row_group_index: int,
    row_group_offset: int,
) -> Tuple[Mapping[str, Any], Mapping[str, Any], str, str]:
    for field in EXPECTED_COLUMNS[:-1]:
        if not isinstance(row.get(field), str):
            fail(f"row_field_not_string:{field}")
    image = row.get("image")
    if not isinstance(image, dict) or not isinstance(image.get("bytes"), (bytes, bytearray)) or len(image.get("bytes")) == 0:
        fail("row_image_bytes_missing")

    document_id = row["doc_id"]
    source_page = row["source_page"]
    file_name = row["file_name"]
    member_id = f"{document_id}:{source_page}:{file_name}"
    if not RECORD_ID.fullmatch(member_id):
        fail(f"member_record_id_invalid:{member_id}")
    image_sha = sha256_bytes(bytes(image["bytes"]))
    transcription_sha = sha256_bytes(row["transcription"].encode("utf-8"))
    identity = {field: row[field] for field in IDENTITY_FIELDS}
    record_content_sha = sha256_json(
        {
            "fileName": file_name,
            "sourcePage": source_page,
            "identity": identity,
            "imageSha256": image_sha,
            "transcriptionSha256": transcription_sha,
        }
    )
    record = {
        "memberRecordId": member_id,
        "documentId": document_id,
        "sourcePage": source_page,
        "fileName": file_name,
        "sourceSplit": source_split,
        "sourceFile": relative_path,
        "sourceRowIndex": source_row_index,
        "sourceRowGroup": row_group_index,
        "sourceRowIndexWithinRowGroup": row_group_offset,
        "imageSha256": image_sha,
        "imageBytes": len(image["bytes"]),
        "transcriptionSha256": transcription_sha,
        "transcriptionCharacters": len(row["transcription"]),
        "recordContentSha256": record_content_sha,
    }
    return record, identity, image_sha, record_content_sha


def document_fingerprint(document_id: str, identity: Mapping[str, str], records: Sequence[Mapping[str, Any]]) -> str:
    # The source document ID is kept as a separate identity key.  Omitting it
    # from this exact content fingerprint lets identical copies form one exact
    # duplicate family without fuzzy or semantic similarity.
    content = {
        "identity": dict(identity),
        "records": [
            {
                "fileName": item["fileName"],
                "sourcePage": item["sourcePage"],
                "imageSha256": item["imageSha256"],
                "transcriptionSha256": item["transcriptionSha256"],
                "recordContentSha256": item["recordContentSha256"],
            }
            for item in sorted(records, key=lambda value: value["memberRecordId"])
        ],
    }
    return sha256_json(content)


def page_fingerprint(source_page: str, records: Sequence[Mapping[str, Any]]) -> str:
    return sha256_json(
        {
            "sourcePage": source_page,
            "records": [
                {
                    "fileName": item["fileName"],
                    "imageSha256": item["imageSha256"],
                    "transcriptionSha256": item["transcriptionSha256"],
                    "recordContentSha256": item["recordContentSha256"],
                }
                for item in sorted(records, key=lambda value: value["memberRecordId"])
            ],
        }
    )


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source-root", type=Path, default=Path("artifacts/historical-ocr-chi-know-po-corpus-v1/source"))
    parser.add_argument("--output-root", type=Path, default=Path("artifacts/historical-ocr-chi-know-po-corpus-v1"))
    args = parser.parse_args()
    source_root = args.source_root.resolve()
    output_root = args.output_root.resolve()
    source_root.mkdir(parents=True, exist_ok=True)
    output_root.mkdir(parents=True, exist_ok=True)

    forbidden_existing = [
        output_root / "corpus-manifest.json",
        output_root / "document-split.json",
        output_root / "materialization-summary.json",
        output_root / "materialized",
    ]
    if any(path.exists() for path in forbidden_existing):
        fail("materialization_output_exists_refusing_overwrite")

    try:
        import pyarrow as pa
        import pyarrow.parquet as pq
    except Exception as error:
        fail(f"pyarrow_required:{type(error).__name__}")

    revision_record, source_files = source_file_inventory(source_root)
    viewer_rows = expected_viewer_rows(source_root)
    source_file_hashes = {
        item["path"]: item["localSha256"] for item in source_files
    }

    materialized_root = output_root / "materialized"
    partition_dirs = {
        "train": materialized_root / "train",
        "untouched-held-out": materialized_root / "untouched-held-out",
    }
    for path in partition_dirs.values():
        path.mkdir(parents=True, exist_ok=False)

    # The explicit stride is only a mechanical document-ID ordering rule.  The
    # IDs are also written into the split manifest, which is the source of
    # truth for any later stage.  This does not consult source train/val/test
    # membership when assigning the new partitions.
    all_document_ids: set[str] = set()
    document_rows: MutableMapping[str, List[Mapping[str, Any]]] = defaultdict(list)
    document_identity: Dict[str, Mapping[str, str]] = {}
    document_pages: MutableMapping[str, MutableMapping[str, List[Mapping[str, Any]]]] = defaultdict(lambda: defaultdict(list))
    member_ids: set[str] = set()
    image_to_documents: MutableMapping[str, set[str]] = defaultdict(set)
    record_hash_to_documents: MutableMapping[str, set[str]] = defaultdict(set)
    source_rows: MutableMapping[str, int] = defaultdict(int)
    source_documents: MutableMapping[str, set[str]] = defaultdict(set)
    source_pages: MutableMapping[str, set[str]] = defaultdict(set)
    total_characters = 0
    total_image_bytes = 0
    writers: Dict[str, Any] = {}
    source_schema = None
    source_row_counts: MutableMapping[str, int] = defaultdict(int)

    def writer_for(partition: str, schema: Any) -> Any:
        if partition not in writers:
            writers[partition] = pq.ParquetWriter(
                partition_dirs[partition] / "corpus.parquet",
                schema,
                compression="zstd",
                use_dictionary=True,
            )
        return writers[partition]

    try:
        for relative_path in DATA_FILES:
            path = source_root / relative_path
            parquet_file = pq.ParquetFile(path)
            if source_schema is None:
                source_schema = parquet_file.schema_arrow
            elif parquet_file.schema_arrow != source_schema:
                fail(f"source_schema_not_identical:{relative_path}")
            source_split = source_split_for(relative_path)
            source_row_index = 0
            for row_group_index in range(parquet_file.metadata.num_row_groups):
                row_group_offset = 0
                for batch in parquet_file.iter_batches(row_groups=[row_group_index], batch_size=128):
                    rows = batch.to_pylist()
                    selected: MutableMapping[str, List[int]] = {"train": [], "untouched-held-out": []}
                    for batch_offset, row in enumerate(rows):
                        record, identity, image_sha, record_sha = make_record(
                            row,
                            relative_path,
                            source_split,
                            source_row_index + batch_offset,
                            row_group_index,
                            row_group_offset + batch_offset,
                        )
                        document_id = record["documentId"]
                        if record["memberRecordId"] in member_ids:
                            fail(f"duplicate_member_record_id:{record['memberRecordId']}")
                        member_ids.add(record["memberRecordId"])
                        if document_id in document_identity and document_identity[document_id] != identity:
                            fail(f"document_identity_inconsistent:{document_id}")
                        document_identity[document_id] = identity
                        document_rows[document_id].append(record)
                        document_pages[document_id][record["sourcePage"]].append(record)
                        all_document_ids.add(document_id)
                        image_to_documents[image_sha].add(document_id)
                        record_hash_to_documents[record_sha].add(document_id)
                        source_rows[source_split] += 1
                        source_documents[source_split].add(document_id)
                        source_pages[source_split].add(record["sourcePage"])
                        source_row_counts[relative_path] += 1
                        total_characters += record["transcriptionCharacters"]
                        total_image_bytes += record["imageBytes"]
                    # The actual parquet partition is materialized as a full
                    # row snapshot; hash-only records are emitted below.
                    for batch_offset, row in enumerate(rows):
                        document_id = row["doc_id"]
                        # This explicit assignment is resolved after the full
                        # catalog is known.  Keep source rows in a temporary
                        # in-memory table-free stream by deferring writes until
                        # the document set is complete is not possible here;
                        # instead collect indices keyed by document for this
                        # batch and use the deterministic provisional rule.
                        # The rule depends only on the final sorted IDs, which
                        # are fixed by this pinned source.
                        selected["train" if document_id not in set(HELD_OUT_DOCUMENT_IDS) else "untouched-held-out"].append(batch_offset)
                    table = pa.Table.from_batches([batch])
                    for partition, indices in selected.items():
                        if indices:
                            writer_for(partition, source_schema).write_table(table.take(pa.array(indices, type=pa.int64())))
                    source_row_index += len(rows)
                    row_group_offset += len(rows)
    finally:
        for writer in writers.values():
            writer.close()

    if source_schema is None:
        fail("source_schema_missing")
    expected_source_rows = {"train": 10907, "validation": 1363, "test": 1364}
    if dict(source_rows) != expected_source_rows:
        fail(f"source_row_count_mismatch:{dict(source_rows)}")
    if set(all_document_ids) != {"A-1", "A-3", "A-4", "S-1", "S-2", "S-3", "S-4", "S-5", "S-6", "S-7", "T-1", "T-2", "T-3"}:
        fail("source_document_id_set_mismatch")
    if sum(source_rows.values()) != sum(viewer_rows.values()):
        fail("source_viewer_row_total_mismatch")
    if len(member_ids) != 13634:
        fail("member_record_count_mismatch")
    if any(len(documents) > 1 for documents in image_to_documents.values()):
        fail("exact_image_duplicate_across_documents")
    if any(len(documents) > 1 for documents in record_hash_to_documents.values()):
        fail("exact_record_duplicate_across_documents")

    sorted_document_ids = sorted(all_document_ids)
    held_out_ids = [sorted_document_ids[index] for index in (3, 7, 11)]
    if held_out_ids != list(HELD_OUT_DOCUMENT_IDS):
        fail("held_out_selection_not_fixed_for_pinned_revision")
    train_ids = [document_id for document_id in sorted_document_ids if document_id not in held_out_ids]
    partition_for_document = {document_id: "untouched-held-out" if document_id in held_out_ids else "train" for document_id in sorted_document_ids}

    documents: List[Mapping[str, Any]] = []
    for document_id in sorted_document_ids:
        records = sorted(document_rows[document_id], key=lambda value: value["memberRecordId"])
        pages = []
        for source_page in sorted(document_pages[document_id]):
            page_records = document_pages[document_id][source_page]
            pages.append({
                "sourcePage": source_page,
                "sourceObjectHash": page_fingerprint(source_page, page_records),
                "memberRecordIds": sorted(item["memberRecordId"] for item in page_records),
            })
        fingerprint = document_fingerprint(document_id, document_identity[document_id], records)
        documents.append({
            "documentId": document_id,
            "documentFingerprint": fingerprint,
            "duplicateFamilyId": f"exact-document-fingerprint:{fingerprint}",
            "identity": dict(document_identity[document_id]),
            "lineCount": len(records),
            "pageCount": len(pages),
            "characterCount": sum(item["transcriptionCharacters"] for item in records),
            "sourceSplits": {split: sum(item["sourceSplit"] == split for item in records) for split in ("train", "validation", "test")},
            "sourceObjectHashes": sorted(item["sourceObjectHash"] for item in pages),
            "pages": pages,
            "memberRecordIds": [item["memberRecordId"] for item in records],
        })

    source_manifest = {
        "schema": "chi-know-po-corpus-source-manifest-v1",
        "corpusId": EXPECTED_CORPUS_ID,
        "source": {
            "provider": "Hugging Face Hub",
            "datasetId": EXPECTED_DATASET,
            "repoType": "dataset",
            "revision": EXPECTED_REVISION,
            "revisionResponsePath": "source/hub-revision.json",
            "revisionResponseSha256": sha256_file(source_root / "hub-revision.json"),
            "treeResponsePath": "source/hub-tree-data.json",
            "treeResponseSha256": sha256_file(source_root / "hub-tree-data.json"),
            "resolvedSourceUrlTemplate": "https://huggingface.co/datasets/calfa-ai/chiknowpo/resolve/be857420a96e49b009ef0d3b74fbd6d1b28d5c87/{path}",
            "acquisition": "read_only_local_copy_at_pinned_revision",
            "uploadPerformed": False,
            "sourceMutationPerformed": False,
        },
        "access": {
            "public": True,
            "gated": False,
            "private": False,
            "disabled": False,
            "viewerApiEvidence": {
                "isValidPath": "source/hub-viewer-is-valid.json",
                "splitsPath": "source/hub-viewer-splits.json",
                "parquetPath": "source/hub-viewer-parquet.json",
                "sizePath": "source/hub-viewer-size.json",
            },
        },
        "licenseDataBoundary": {
            "spdx": "Apache-2.0",
            "declaredBy": "source/README.md front matter and License section",
            "readmeSha256": source_file_hashes["README.md"],
            "datasetContent": ["embedded line-crop image bytes", "line transcription", "source/document metadata"],
            "notAccessed": ["external frozen OCR gold", "model checkpoints", "fine-tuning outputs"],
            "semanticCorrection": False,
            "historicalSourceJudgment": False,
            "search": False,
            "silentFallback": False,
        },
        "dataSchema": {
            "columnCount": len(EXPECTED_COLUMNS),
            "columns": list(EXPECTED_COLUMNS),
            "imageRepresentation": "struct(bytes,path)",
            "hashPolicy": "SHA-256 over exact UTF-8 transcription and embedded image bytes; no fuzzy or semantic matching",
        },
        "files": source_files,
        "sourceTotals": {
            "parquetBytes": sum(item["bytes"] for item in source_files if item["path"].startswith("data/")),
            "lineCount": sum(source_rows.values()),
            "documentCount": len(sorted_document_ids),
            "pageCount": len(set().union(*source_pages.values())),
            "characterCount": total_characters,
            "embeddedImageBytes": total_image_bytes,
            "sourceSplitRows": dict(sorted(source_rows.items())),
            "sourceSplitDocumentIds": {split: sorted(source_documents[split]) for split in sorted(source_documents)},
            "sourceFileRows": dict(sorted(source_row_counts.items())),
        },
        "documentIdentity": {
            "key": "doc_id",
            "fingerprint": "exact SHA-256 of identity fields plus sorted line image/transcription hashes",
            "duplicateFamily": "exact-document-fingerprint:<documentFingerprint>",
            "documentIds": sorted_document_ids,
        },
        "noSyntheticData": True,
        "fineTuning": {"executed": False, "status": "NOT_RUN"},
        "activation": {"enabled": False, "active": False, "status": "BLOCKED"},
        "routeBoundary": {"BLOCK_OCR_ROUTE": True, "OCRProvider": {"enabled": False}, "fallbackPolicy": "none"},
    }
    source_manifest_path = output_root / "corpus-manifest.json"
    source_manifest_sha = write_json(source_manifest_path, source_manifest)

    partition_records: Dict[str, List[Mapping[str, Any]]] = {"train": [], "untouched-held-out": []}
    for document_id in sorted_document_ids:
        partition_records[partition_for_document[document_id]].extend(document_rows[document_id])
    for partition in partition_records:
        partition_records[partition] = sorted(partition_records[partition], key=lambda value: value["memberRecordId"])

    partitions: Dict[str, Mapping[str, Any]] = {}
    for partition, records in partition_records.items():
        partition_dir = partition_dirs[partition]
        record_manifest_path = partition_dir / "records.jsonl"
        record_manifest_sha = write_jsonl(record_manifest_path, records)
        parquet_path = partition_dir / "corpus.parquet"
        if not parquet_path.is_file() or parquet_path.stat().st_size == 0:
            fail(f"partition_parquet_missing:{partition}")
        partition_document_ids = train_ids if partition == "train" else held_out_ids
        pages = sorted({record["sourcePage"] for record in records})
        partitions[partition] = {
            "split": partition,
            "unit": "document",
            "documentIds": partition_document_ids,
            "recordCount": len(records),
            "pageCount": len(pages),
            "characterCount": sum(record["transcriptionCharacters"] for record in records),
            "sourceSplitRows": {split: sum(record["sourceSplit"] == split for record in records) for split in ("train", "validation", "test")},
            "corpusPath": f"materialized/{partition}/corpus.parquet",
            "corpusSha256": sha256_file(parquet_path),
            "recordManifestPath": f"materialized/{partition}/records.jsonl",
            "recordManifestSha256": record_manifest_sha,
            "readOnlySnapshot": True,
            "untouched": partition == "untouched-held-out",
            "eligibleForTraining": partition == "train",
        }

    document_split = {
        "schema": "chi-know-po-materialized-document-split-v1",
        "corpusId": EXPECTED_CORPUS_ID,
        "sourceManifestPath": "corpus-manifest.json",
        "sourceManifestSha256": source_manifest_sha,
        "sourceRevision": EXPECTED_REVISION,
        "status": "MATERIALIZED_LEAKAGE_VALIDATION_PENDING",
        "assignment": {
            "method": "explicit_document_group_manifest_v1",
            "ordering": "lexicographic_document_id",
            "selection": "fixed_lexicographic_stride_v1",
            "heldOutZeroBasedPositions": [3, 7, 11],
            "heldOutDocumentIds": held_out_ids,
            "randomAssignment": False,
            "sourceSplitMembershipUsedForAssignment": False,
            "semanticOrFuzzyMatchingUsed": False,
        },
        "documents": documents,
        "partitions": partitions,
        "leakagePolicy": {
            "splitUnit": "document",
            "pagesLinesCropsStayTogether": True,
            "splitBeforeDecodeOrAugment": True,
            "exactDisjointnessFields": ["documentId", "documentFingerprint", "duplicateFamilyId", "sourceObjectHashes", "memberRecordIds", "imageSha256", "recordContentSha256"],
            "heldOutReadOnly": True,
            "heldOutExcludedFromTrainingPreprocessingAndModelSelection": True,
            "heldOutEvaluationAfterCheckpointFreezeOnly": True,
            "fuzzyOrSemanticLeakageDetection": False,
        },
        "recognitionBoundary": {
            "task": "historical_recognition_only",
            "semanticCorrection": False,
            "historicalSourceJudgment": False,
            "search": False,
            "silentFallback": False,
            "normalization": "NFC_only_preserve_glyphs_and_whitespace_policy",
        },
        "fineTuningGate": {"status": "NOT_RUN", "executed": False},
        "activationGate": {"status": "BLOCKED", "enabled": False, "active": False, "automaticPromotion": False},
        "routeBoundary": {"BLOCK_OCR_ROUTE": True, "OCRProvider": {"enabled": False}, "fallbackPolicy": "none"},
        "noSyntheticData": True,
    }
    split_path = output_root / "document-split.json"
    split_sha = write_json(split_path, document_split)

    summary = {
        "schema": "chi-know-po-materialization-summary-v1",
        "sourceManifestSha256": source_manifest_sha,
        "documentSplitSha256": split_sha,
        "sourceRevision": EXPECTED_REVISION,
        "sourceRows": dict(sorted(source_rows.items())),
        "documentCount": len(documents),
        "train": {"documentCount": len(train_ids), **partitions["train"]},
        "untouched-held-out": {"documentCount": len(held_out_ids), **partitions["untouched-held-out"]},
        "validator": {"status": "PENDING", "path": "leakage-validation.json"},
        "fineTuning": {"status": "NOT_RUN", "executed": False},
        "frozenDomainGoldAccessed": False,
        "ocrActivation": {"status": "BLOCKED", "enabled": False, "active": False},
        "routeBoundary": {"BLOCK_OCR_ROUTE": True, "OCRProvider": {"enabled": False}},
    }
    summary_path = output_root / "materialization-summary.json"
    summary_sha = write_json(summary_path, summary)

    # Materialized snapshots are frozen inputs for the next, separately gated
    # stage.  The source directory is also frozen after all reads complete.
    for partition_dir in partition_dirs.values():
        safe_read_only(partition_dir)
    safe_read_only(source_root)

    print(json.dumps({
        "status": "MATERIALIZED_LEAKAGE_VALIDATION_PENDING",
        "sourceRevision": EXPECTED_REVISION,
        "sourceManifestSha256": source_manifest_sha,
        "documentSplitSha256": split_sha,
        "summarySha256": summary_sha,
        "documents": len(documents),
        "trainDocuments": len(train_ids),
        "heldOutDocuments": len(held_out_ids),
        "trainRecords": partitions["train"]["recordCount"],
        "heldOutRecords": partitions["untouched-held-out"]["recordCount"],
        "BLOCK_OCR_ROUTE": True,
        "OCRProviderEnabled": False,
        "fineTuning": "NOT_RUN",
        "activation": "BLOCKED",
    }, ensure_ascii=False, sort_keys=True, indent=2))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except RuntimeError as error:
        print(str(error), file=sys.stderr)
        raise SystemExit(2)

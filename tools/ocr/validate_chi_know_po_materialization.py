#!/usr/bin/env python3
"""Independent exact validator for the materialized CHI-KNOW-PO snapshot."""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
from collections import defaultdict
from pathlib import Path
from typing import Any, Dict, Iterable, List, Mapping, MutableMapping, Sequence

from materialize_chi_know_po_corpus import (
    DATA_FILES,
    EXPECTED_COLUMNS,
    EXPECTED_CORPUS_ID,
    EXPECTED_DATASET,
    EXPECTED_REVISION,
    IDENTITY_FIELDS,
    canonical,
    expected_viewer_rows,
    sha256_bytes,
    sha256_file,
    sha256_json,
    source_file_inventory,
    write_json,
)


HASH = re.compile(r"^[a-f0-9]{64}$")
RECORD_ID = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._:-]{0,191}$")
PARTITIONS = ("train", "untouched-held-out")
RECORD_KEYS = {
    "memberRecordId",
    "documentId",
    "sourcePage",
    "fileName",
    "sourceSplit",
    "sourceFile",
    "sourceRowIndex",
    "sourceRowGroup",
    "sourceRowIndexWithinRowGroup",
    "imageSha256",
    "imageBytes",
    "transcriptionSha256",
    "transcriptionCharacters",
    "recordContentSha256",
}


def read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def read_jsonl(path: Path) -> List[Mapping[str, Any]]:
    records: List[Mapping[str, Any]] = []
    for line_number, line in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
        if not line.strip():
            continue
        value = json.loads(line)
        if not isinstance(value, dict):
            raise RuntimeError(f"jsonl_record_not_object:{path}:{line_number}")
        records.append(value)
    return records


def write_content_hashed_json(path: Path, value: Mapping[str, Any]) -> str:
    copy = dict(value)
    copy.pop("contentSha256", None)
    copy["contentSha256"] = sha256_json(copy)
    return write_json(path, copy)


def require(condition: bool, code: str) -> None:
    if not condition:
        raise RuntimeError(code)


def require_hash(value: Any, code: str) -> None:
    require(isinstance(value, str) and HASH.fullmatch(value) is not None, code)


def require_read_only(path: Path, code: str) -> None:
    require(path.exists(), f"{code}_missing")
    require(path.stat().st_mode & 0o222 == 0, f"{code}_writable")


def record_content_hash(row: Mapping[str, Any]) -> str:
    image = row["image"]
    image_bytes = bytes(image["bytes"])
    image_sha = sha256_bytes(image_bytes)
    transcription_sha = sha256_bytes(row["transcription"].encode("utf-8"))
    identity = {field: row[field] for field in IDENTITY_FIELDS}
    return sha256_json(
        {
            "fileName": row["file_name"],
            "sourcePage": row["source_page"],
            "identity": identity,
            "imageSha256": image_sha,
            "transcriptionSha256": transcription_sha,
        }
    )


def output_record(row: Mapping[str, Any]) -> Mapping[str, Any]:
    for field in EXPECTED_COLUMNS[:-1]:
        require(isinstance(row.get(field), str), f"output_row_field_not_string:{field}")
    image = row.get("image")
    require(isinstance(image, dict) and isinstance(image.get("bytes"), (bytes, bytearray)) and len(image["bytes"]) > 0, "output_row_image_bytes_missing")
    image_sha = sha256_bytes(bytes(image["bytes"]))
    transcription_sha = sha256_bytes(row["transcription"].encode("utf-8"))
    member_id = f"{row['doc_id']}:{row['source_page']}:{row['file_name']}"
    require(RECORD_ID.fullmatch(member_id) is not None, "output_member_record_id_invalid")
    return {
        "memberRecordId": member_id,
        "documentId": row["doc_id"],
        "sourcePage": row["source_page"],
        "fileName": row["file_name"],
        "imageSha256": image_sha,
        "imageBytes": len(image["bytes"]),
        "transcriptionSha256": transcription_sha,
        "transcriptionCharacters": len(row["transcription"]),
        "recordContentSha256": record_content_hash(row),
    }


def page_hash(source_page: str, records: Sequence[Mapping[str, Any]]) -> str:
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


def document_hash(identity: Mapping[str, Any], records: Sequence[Mapping[str, Any]]) -> str:
    return sha256_json(
        {
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
    )


def exact_overlap(left: Iterable[str], right: Iterable[str]) -> List[str]:
    return sorted(set(left).intersection(right))


def validate(root: Path) -> Mapping[str, Any]:
    source_root = root / "source"
    source_manifest_path = root / "corpus-manifest.json"
    split_path = root / "document-split.json"
    summary_path = root / "materialization-summary.json"
    require(source_manifest_path.is_file(), "corpus_manifest_missing")
    require(split_path.is_file(), "document_split_missing")
    require(summary_path.is_file(), "materialization_summary_missing")
    source_manifest = read_json(source_manifest_path)
    split = read_json(split_path)
    summary = read_json(summary_path)
    source_manifest_sha = sha256_file(source_manifest_path)
    revision_record, inventory = source_file_inventory(source_root)

    require(source_manifest.get("schema") == "chi-know-po-corpus-source-manifest-v1", "source_manifest_schema_invalid")
    require(source_manifest.get("corpusId") == EXPECTED_CORPUS_ID, "source_manifest_corpus_invalid")
    require(source_manifest.get("source", {}).get("datasetId") == EXPECTED_DATASET, "source_manifest_dataset_invalid")
    require(source_manifest.get("source", {}).get("revision") == EXPECTED_REVISION, "source_manifest_revision_invalid")
    require(source_manifest.get("source", {}).get("uploadPerformed") is False, "source_upload_boundary_changed")
    require(source_manifest.get("source", {}).get("sourceMutationPerformed") is False, "source_mutation_boundary_changed")
    require(source_manifest.get("licenseDataBoundary", {}).get("spdx") == "Apache-2.0", "license_boundary_invalid")
    require(source_manifest.get("licenseDataBoundary", {}).get("semanticCorrection") is False, "semantic_correction_boundary_changed")
    require(source_manifest.get("licenseDataBoundary", {}).get("historicalSourceJudgment") is False, "historical_source_judgment_boundary_changed")
    require(source_manifest.get("licenseDataBoundary", {}).get("search") is False, "search_boundary_changed")
    require(source_manifest.get("licenseDataBoundary", {}).get("silentFallback") is False, "silent_fallback_boundary_changed")
    require(source_manifest.get("fineTuning", {}).get("executed") is False, "fine_tuning_boundary_changed")
    require(source_manifest.get("activation", {}).get("active") is False, "activation_boundary_changed")
    require(source_manifest.get("routeBoundary") == {"BLOCK_OCR_ROUTE": True, "OCRProvider": {"enabled": False}, "fallbackPolicy": "none"}, "route_boundary_changed")
    require(revision_record.get("sha") == EXPECTED_REVISION, "hub_revision_response_mismatch")
    require(set(item["path"] for item in inventory) == set(item["path"] for item in source_manifest.get("files", [])), "source_file_inventory_mismatch")
    manifest_files = {item["path"]: item for item in source_manifest["files"]}
    for item in inventory:
        recorded = manifest_files[item["path"]]
        require(recorded.get("bytes") == item["bytes"], f"source_manifest_bytes_mismatch:{item['path']}")
        require(recorded.get("localSha256") == item["localSha256"], f"source_manifest_sha_mismatch:{item['path']}")
    for path in source_root.rglob("*"):
        if path.is_file():
            require_read_only(path, "source_snapshot")

    viewer_rows = expected_viewer_rows(source_root)
    measured_source_rows: MutableMapping[str, int] = defaultdict(int)
    measured_source_file_rows: MutableMapping[str, int] = defaultdict(int)
    import pyarrow.parquet as pq
    for relative_path in DATA_FILES:
        parquet_file = pq.ParquetFile(source_root / relative_path)
        require(tuple(parquet_file.schema_arrow.names) == EXPECTED_COLUMNS, f"source_schema_mismatch:{relative_path}")
        measured_source_file_rows[relative_path] = parquet_file.metadata.num_rows
        source_split = Path(relative_path).name.split("-", 1)[0]
        measured_source_rows[source_split] += parquet_file.metadata.num_rows
    require(dict(measured_source_rows) == viewer_rows, "source_parquet_row_counts_mismatch")
    source_totals = source_manifest.get("sourceTotals", {})
    require(source_totals.get("lineCount") == sum(viewer_rows.values()), "source_total_rows_invalid")
    require(source_totals.get("documentCount") == 13, "source_total_documents_invalid")
    require(source_totals.get("pageCount") == 325, "source_total_pages_invalid")
    require(source_totals.get("characterCount") == 104769, "source_total_characters_invalid")
    require(source_totals.get("sourceFileRows") == dict(measured_source_file_rows), "source_file_row_counts_invalid")

    require(split.get("schema") == "chi-know-po-materialized-document-split-v1", "split_schema_invalid")
    require(split.get("corpusId") == EXPECTED_CORPUS_ID, "split_corpus_invalid")
    require(split.get("sourceManifestSha256") == source_manifest_sha, "split_source_manifest_hash_mismatch")
    require(split.get("sourceRevision") == EXPECTED_REVISION, "split_source_revision_invalid")
    require(split.get("assignment", {}).get("method") == "explicit_document_group_manifest_v1", "split_assignment_method_invalid")
    require(split.get("assignment", {}).get("randomAssignment") is False, "split_random_assignment_enabled")
    require(split.get("assignment", {}).get("sourceSplitMembershipUsedForAssignment") is False, "source_split_used_for_assignment")
    require(split.get("assignment", {}).get("semanticOrFuzzyMatchingUsed") is False, "semantic_or_fuzzy_matching_used")
    require(split.get("leakagePolicy", {}).get("fuzzyOrSemanticLeakageDetection") is False, "fuzzy_or_semantic_leakage_detection_enabled")
    require(split.get("fineTuningGate") == {"status": "NOT_RUN", "executed": False}, "fine_tuning_gate_open")
    require(split.get("activationGate", {}).get("status") == "BLOCKED" and split.get("activationGate", {}).get("active") is False, "activation_gate_open")
    require(split.get("routeBoundary") == {"BLOCK_OCR_ROUTE": True, "OCRProvider": {"enabled": False}, "fallbackPolicy": "none"}, "split_route_boundary_changed")

    documents = split.get("documents")
    require(isinstance(documents, list) and len(documents) == 13, "document_catalog_count_invalid")
    document_by_id = {item.get("documentId"): item for item in documents}
    require(len(document_by_id) == len(documents) and all(isinstance(key, str) for key in document_by_id), "document_catalog_ids_invalid")
    require(sorted(document_by_id) == sorted(source_manifest.get("documentIdentity", {}).get("documentIds", [])), "document_identity_catalog_mismatch")
    require(split.get("assignment", {}).get("heldOutDocumentIds") == ["S-1", "S-5", "T-2"], "held_out_document_ids_invalid")

    partition_records: Dict[str, List[Mapping[str, Any]]] = {}
    parquet_counts: Dict[str, int] = {}
    for partition in PARTITIONS:
        spec = split.get("partitions", {}).get(partition)
        require(isinstance(spec, dict), f"partition_missing:{partition}")
        record_path = root / spec.get("recordManifestPath", "")
        parquet_path = root / spec.get("corpusPath", "")
        require(record_path.is_file(), f"record_manifest_missing:{partition}")
        require(parquet_path.is_file(), f"partition_corpus_missing:{partition}")
        require_read_only(record_path, f"{partition}_record_manifest")
        require_read_only(parquet_path, f"{partition}_corpus_snapshot")
        require(sha256_file(record_path) == spec.get("recordManifestSha256"), f"record_manifest_hash_mismatch:{partition}")
        require(sha256_file(parquet_path) == spec.get("corpusSha256"), f"partition_corpus_hash_mismatch:{partition}")
        records = read_jsonl(record_path)
        require(len(records) == spec.get("recordCount"), f"record_count_mismatch:{partition}")
        require(all(set(record) == RECORD_KEYS for record in records), f"record_manifest_payload_boundary:{partition}")
        member_ids = [record.get("memberRecordId") for record in records]
        require(len(set(member_ids)) == len(member_ids), f"duplicate_partition_member_ids:{partition}")
        for record in records:
            require_hash(record.get("imageSha256"), f"record_image_hash_invalid:{partition}")
            require_hash(record.get("transcriptionSha256"), f"record_transcription_hash_invalid:{partition}")
            require_hash(record.get("recordContentSha256"), f"record_content_hash_invalid:{partition}")
            require(RECORD_ID.fullmatch(record.get("memberRecordId", "")) is not None, f"record_member_id_invalid:{partition}")
            require(record.get("documentId") in spec.get("documentIds", []), f"record_document_not_in_partition:{partition}")
        parquet_file = pq.ParquetFile(parquet_path)
        require(tuple(parquet_file.schema_arrow.names) == EXPECTED_COLUMNS, f"partition_schema_mismatch:{partition}")
        require(parquet_file.metadata.num_rows == len(records), f"partition_parquet_row_count_mismatch:{partition}")
        parquet_counts[partition] = parquet_file.metadata.num_rows
        computed: Dict[str, Mapping[str, Any]] = {}
        for batch in parquet_file.iter_batches(batch_size=128):
            for row in batch.to_pylist():
                value = output_record(row)
                member_id = value["memberRecordId"]
                require(member_id not in computed, f"duplicate_partition_parquet_member:{partition}")
                computed[member_id] = value
        expected = {record["memberRecordId"]: record for record in records}
        require(set(computed) == set(expected), f"partition_parquet_record_set_mismatch:{partition}")
        for member_id, value in computed.items():
            expected_record = expected[member_id]
            for field in ("documentId", "sourcePage", "fileName", "imageSha256", "imageBytes", "transcriptionSha256", "transcriptionCharacters", "recordContentSha256"):
                require(value[field] == expected_record[field], f"partition_parquet_record_content_mismatch:{partition}:{member_id}:{field}")
        partition_records[partition] = records

    train_spec = split["partitions"]["train"]
    held_out_spec = split["partitions"]["untouched-held-out"]
    train_ids = train_spec["documentIds"]
    held_out_ids = held_out_spec["documentIds"]
    require(not set(train_ids).intersection(held_out_ids), "cross_partition_document_id")
    require(set(train_ids).union(held_out_ids) == set(document_by_id), "document_catalog_not_fully_assigned")
    require(len(train_ids) == 10 and len(held_out_ids) == 3, "partition_document_count_invalid")
    for document_id in document_by_id:
        require(sum(document_id in ids for ids in (train_ids, held_out_ids)) == 1, f"document_not_assigned_exactly_once:{document_id}")

    all_records_by_document: MutableMapping[str, List[Mapping[str, Any]]] = defaultdict(list)
    for partition in PARTITIONS:
        for record in partition_records[partition]:
            all_records_by_document[record["documentId"]].append(record)
    for document_id, document in document_by_id.items():
        records = all_records_by_document[document_id]
        require(len(records) == document.get("lineCount"), f"document_line_count_mismatch:{document_id}")
        require(len({record["sourcePage"] for record in records}) == document.get("pageCount"), f"document_page_count_mismatch:{document_id}")
        require(sum(record["transcriptionCharacters"] for record in records) == document.get("characterCount"), f"document_character_count_mismatch:{document_id}")
        require(sorted(record["memberRecordId"] for record in records) == sorted(document.get("memberRecordIds", [])), f"document_member_catalog_mismatch:{document_id}")
        require(document_hash(document.get("identity", {}), records) == document.get("documentFingerprint"), f"document_fingerprint_mismatch:{document_id}")
        require(document.get("duplicateFamilyId") == f"exact-document-fingerprint:{document['documentFingerprint']}", f"document_duplicate_family_mismatch:{document_id}")
        pages_by_name: MutableMapping[str, List[Mapping[str, Any]]] = defaultdict(list)
        for record in records:
            pages_by_name[record["sourcePage"]].append(record)
        page_by_name = {page.get("sourcePage"): page for page in document.get("pages", [])}
        require(set(page_by_name) == set(pages_by_name), f"document_page_catalog_mismatch:{document_id}")
        for source_page, page_records in pages_by_name.items():
            expected_page = page_by_name[source_page]
            require(page_hash(source_page, page_records) == expected_page.get("sourceObjectHash"), f"source_object_hash_mismatch:{document_id}:{source_page}")
            require(sorted(item["memberRecordId"] for item in page_records) == sorted(expected_page.get("memberRecordIds", [])), f"source_object_members_mismatch:{document_id}:{source_page}")

    def document_values(partition: str, field: str) -> List[str]:
        return [document_by_id[document_id].get(field) for document_id in split["partitions"][partition]["documentIds"] if document_by_id[document_id].get(field)]

    def record_values(partition: str, field: str) -> List[str]:
        return [record[field] for record in partition_records[partition]]

    exact_fields = {
        "documentFingerprint": (document_values("train", "documentFingerprint"), document_values("untouched-held-out", "documentFingerprint")),
        "duplicateFamilyId": (document_values("train", "duplicateFamilyId"), document_values("untouched-held-out", "duplicateFamilyId")),
        "sourceObjectHash": (
            [value for document_id in train_ids for value in document_by_id[document_id]["sourceObjectHashes"]],
            [value for document_id in held_out_ids for value in document_by_id[document_id]["sourceObjectHashes"]],
        ),
        "memberRecordId": (record_values("train", "memberRecordId"), record_values("untouched-held-out", "memberRecordId")),
        "imageSha256": (record_values("train", "imageSha256"), record_values("untouched-held-out", "imageSha256")),
        "recordContentSha256": (record_values("train", "recordContentSha256"), record_values("untouched-held-out", "recordContentSha256")),
    }
    overlaps = {field: exact_overlap(left, right) for field, (left, right) in exact_fields.items()}
    require(all(not values for values in overlaps.values()), "cross_partition_exact_overlap")
    require(set(train_ids).isdisjoint(held_out_ids), "cross_partition_document_id")
    require(parquet_counts["train"] == train_spec["recordCount"] == 10844, "train_materialization_count_invalid")
    require(parquet_counts["untouched-held-out"] == held_out_spec["recordCount"] == 2790, "held_out_materialization_count_invalid")
    require(train_spec.get("readOnlySnapshot") is True and held_out_spec.get("readOnlySnapshot") is True, "snapshot_freeze_boundary_invalid")
    require(held_out_spec.get("untouched") is True and held_out_spec.get("eligibleForTraining") is False, "held_out_policy_invalid")
    require(train_spec.get("eligibleForTraining") is True and train_spec.get("untouched") is False, "train_policy_invalid")

    source_split_rows = {split_name: sum(record["sourceSplit"] == split_name for partition in PARTITIONS for record in partition_records[partition]) for split_name in ("train", "validation", "test")}
    require(source_split_rows == {"train": 10907, "validation": 1363, "test": 1364}, "materialized_source_split_counts_invalid")

    return {
        "schema": "chi-know-po-materialization-leakage-validation-v1",
        "status": "PASSED",
        "corpusId": EXPECTED_CORPUS_ID,
        "dataset": EXPECTED_DATASET,
        "sourceRevision": EXPECTED_REVISION,
        "sourceManifestPath": "corpus-manifest.json",
        "sourceManifestSha256": source_manifest_sha,
        "documentSplitPath": "document-split.json",
        "documentSplitSha256BeforeFinalization": sha256_file(split_path),
        "checks": {
            "sourceFilesSizeAndSha256": "PASSED",
            "sourceHubRevisionAndViewerCounts": "PASSED",
            "sourceSchemaAndParquetRows": "PASSED",
            "documentIdentityAndFingerprint": "PASSED",
            "materializedParquetContent": "PASSED",
            "documentLevelPartitionDisjointness": "PASSED",
            "exactImageAndRecordDisjointness": "PASSED",
            "hashOnlyRecordManifestBoundary": "PASSED",
            "untouchedHeldOutReadOnly": "PASSED",
            "forbiddenOperationsNotRun": "PASSED",
        },
        "counts": {
            "sourceDocuments": len(document_by_id),
            "sourceRecords": sum(parquet_counts.values()),
            "trainDocuments": len(train_ids),
            "trainRecords": parquet_counts["train"],
            "heldOutDocuments": len(held_out_ids),
            "heldOutRecords": parquet_counts["untouched-held-out"],
            "trainPages": train_spec["pageCount"],
            "heldOutPages": held_out_spec["pageCount"],
            "sourceSplitRows": source_split_rows,
        },
        "overlaps": overlaps,
        "readOnly": {
            "sourceSnapshot": True,
            "trainSnapshot": True,
            "untouchedHeldOutSnapshot": True,
        },
        "frozenDomainGoldAccessed": False,
        "fineTuning": {"status": "NOT_RUN", "executed": False},
        "activation": {"status": "BLOCKED", "enabled": False, "active": False},
        "routeBoundary": {"BLOCK_OCR_ROUTE": True, "OCRProvider": {"enabled": False}, "fallbackPolicy": "none"},
        "decision": "SAFE_TO_HAND_OFF_TO_SEPARATE_FINE_TUNING_GATE;_FINE_TUNING_NOT_AUTHORIZED_BY_THIS_ARTIFACT",
        "noSyntheticData": True,
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", type=Path, default=Path("artifacts/historical-ocr-chi-know-po-corpus-v1"))
    parser.add_argument("--check-only", action="store_true", help="validate without updating any evidence artifact")
    args = parser.parse_args()
    root = args.root.resolve()
    try:
        import pyarrow  # noqa: F401
    except Exception as error:
        print(f"pyarrow_required:{type(error).__name__}", file=sys.stderr)
        return 2
    try:
        result = dict(validate(root))
        if args.check_only:
            print(json.dumps({
                "status": result["status"],
                "sourceManifestSha256": result["sourceManifestSha256"],
                "documentSplitSha256": result["documentSplitSha256BeforeFinalization"],
                "overlaps": result["overlaps"],
                "counts": result["counts"],
            }, ensure_ascii=False, sort_keys=True, indent=2))
            return 0
        split_path = root / "document-split.json"
        split = read_json(split_path)
        split["status"] = "MATERIALIZED_AND_VALIDATED"
        split["leakageValidationPath"] = "leakage-validation.json"
        split_sha = write_json(split_path, split)
        result["documentSplitSha256"] = split_sha
        result["documentSplitSha256BeforeFinalization"] = result.pop("documentSplitSha256BeforeFinalization")
        validation_path = root / "leakage-validation.json"
        validation_sha = write_content_hashed_json(validation_path, result)
        summary_path = root / "materialization-summary.json"
        summary = read_json(summary_path)
        summary["status"] = "MATERIALIZED_AND_VALIDATED"
        summary["documentSplitSha256"] = split_sha
        summary["validator"] = {"status": "PASSED", "path": "leakage-validation.json", "sha256": validation_sha}
        summary["fineTuning"] = {"status": "NOT_RUN", "executed": False}
        summary["frozenDomainGoldAccessed"] = False
        summary["ocrActivation"] = {"status": "BLOCKED", "enabled": False, "active": False}
        summary["routeBoundary"] = {"BLOCK_OCR_ROUTE": True, "OCRProvider": {"enabled": False}}
        summary_sha = write_json(summary_path, summary)
        print(json.dumps({
            "status": "PASSED",
            "sourceManifestSha256": result["sourceManifestSha256"],
            "documentSplitSha256": split_sha,
            "validationSha256": validation_sha,
            "summarySha256": summary_sha,
            "trainRecords": result["counts"]["trainRecords"],
            "heldOutRecords": result["counts"]["heldOutRecords"],
            "frozenDomainGoldAccessed": False,
            "fineTuning": "NOT_RUN",
            "activation": "BLOCKED",
        }, ensure_ascii=False, sort_keys=True, indent=2))
        return 0
    except Exception as error:
        print(str(error), file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())

# CHI-KNOW-PO pinned corpus materialization v1

Date: 2026-09-03. This is a read-only corpus acquisition, document split,
and leakage-validation record. It is not a fine-tuning run, frozen-domain-gold
evaluation, model promotion, or OCR activation.

## Source freeze

The actual public Hugging Face dataset is `calfa-ai/chiknowpo` at Hub revision
`be857420a96e49b009ef0d3b74fbd6d1b28d5c87`. The local source copy is under
[`source/`](../artifacts/historical-ocr-chi-know-po-corpus-v1/source/) and its
files are read-only snapshots. The four data shards were checked against their
Hub LFS SHA-256 values:

| source file | bytes | LFS SHA-256 |
| --- | ---: | --- |
| `data/train-00000-of-00002.parquet` | 428,424,609 | `a7e73c9d6a4441d8ab8c1a42eed498757ae19ad1f2e015536fa222e90e1f360d` |
| `data/train-00001-of-00002.parquet` | 421,834,653 | `568596476bc25bb68a4576207aad6f52c898cfd9884a2e3aab994333c3db19e3` |
| `data/validation-00000-of-00001.parquet` | 105,801,072 | `feccb32af46c17ee06c95b9e7ec443a314030625d66f96df8ebe6f6fe6feec46` |
| `data/test-00000-of-00001.parquet` | 103,990,077 | `506aa3b3906c7b0d43d7c54a3aebf6d2a2e70552852774de1bbe66d67310d1a8` |

The declared dataset license is Apache-2.0, captured together with the
README SHA-256 `9da6b3b5540d29d0ff8f37a922a19efe74d15666771b1a90d2dc284d3dcb8410`.
The complete source manifest is
[`corpus-manifest.json`](../artifacts/historical-ocr-chi-know-po-corpus-v1/corpus-manifest.json),
SHA-256 `30e5253f4867eade9633542efc6314220a5c59962a534825ff0b8d016b753036`.
It records 15 columns, 13 documents, 325 pages, 13,634 lines, and 104,769
characters. No upload or source mutation was performed.

## Materialized document split

The new split is an explicit lexicographic document manifest. The original
Hub `train`/`validation`/`test` membership was preserved as row metadata and
was not used to assign the new partitions. The fixed held-out IDs are the
fourth, eighth, and twelfth IDs in the lexicographically ordered catalog:
`S-1`, `S-5`, and `T-2`.

| partition | documents | pages | lines | characters | parquet SHA-256 |
| --- | ---: | ---: | ---: | ---: | --- |
| `train` | 10 | 260 | 10,844 | 79,138 | `97f6fcc531cb79c4e0f2f63a042f52317b9299ed2f13785663c8523c7c0bc25b` |
| `untouched-held-out` | 3 | 65 | 2,790 | 25,631 | `529c17ceac790665ce351169501ba59d8e3190069dbc0736d9885ecd427ba66f` |

Each partition contains a full parquet snapshot and a hash-only record
manifest. Record identity is `doc_id:source_page:file_name`; document
fingerprints are exact SHA-256 values over frozen identity metadata plus the
sorted image/transcription hashes. Duplicate families use only exact document
fingerprints. No fuzzy, semantic, or source-judgment operation is used.

The split manifest is
[`document-split.json`](../artifacts/historical-ocr-chi-know-po-corpus-v1/document-split.json),
SHA-256 `401af84fa523582f50cec4554e6f3198477aa8f364e4a1088976751dfb976cf6`.

## Validator and decision

The independent validator reopened the source and materialized parquet files
and passed all of these checks:

- Hub revision, source sizes, LFS SHA-256 values, schema, and row counts;
- document identity, exact document fingerprints, page closures, and member IDs;
- materialized parquet content against the hash-only record manifests;
- zero cross-partition overlap for document IDs, fingerprints,
  duplicate-family IDs, page/source-object hashes, member IDs, image hashes,
  and record-content hashes; and
- read-only source/train/held-out snapshots and the hash-only manifest boundary.

The evidence is
[`leakage-validation.json`](../artifacts/historical-ocr-chi-know-po-corpus-v1/leakage-validation.json),
SHA-256 `5d03368f804aada2c48afbadfdd974a7a1017ba11264b234f3ff2d18be339493`.
Its decision is `SAFE_TO_HAND_OFF_TO_SEPARATE_FINE_TUNING_GATE`; this means
the corpus is safe as input to a separately authorized next gate. It does not
authorize fine-tuning: `fineTuningGate=NOT_RUN`, authorization is not granted,
and no frozen domain gold was accessed. The connected specialization plan is
[`plan.json`](../artifacts/historical-ocr-chi-know-po-corpus-v1/plan.json),
SHA-256 `156b54030fb44e7738840c84f0fd959224546c70f41f4f982c59d4f3d70bd08b`.

The operational boundary remains unchanged:

```text
BLOCK_OCR_ROUTE = true
OCRProvider.enabled = false
fallbackPolicy = none
activation = BLOCKED / inactive
```

The materializer is
[`materialize_chi_know_po_corpus.py`](../tools/ocr/materialize_chi_know_po_corpus.py)
and the validator is
[`validate_chi_know_po_materialization.py`](../tools/ocr/validate_chi_know_po_materialization.py).
Neither script imports a model runtime or starts training.

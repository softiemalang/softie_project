#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import { createHash } from 'node:crypto'

import {
  canonicalHistoricalOcrJson,
  historicalOcrContentSha256,
} from '../../src/ocr/historicalOcrTeam.js'

const CORPUS_ROOT = path.resolve('artifacts/historical-ocr-chi-know-po-corpus-v1')
const TRAIN_PARQUET = path.join(CORPUS_ROOT, 'materialized/train/corpus.parquet')
const TRAIN_RECORDS = path.join(CORPUS_ROOT, 'materialized/train/records.jsonl')
const OUTPUT_DIR = path.resolve('artifacts/historical-ocr-chi-know-po-medium-rec-recipe-v1')
const EXPECTED_TRAIN_PARQUET_SHA256 = '97f6fcc531cb79c4e0f2f63a042f52317b9299ed2f13785663c8523c7c0bc25b'
const EXPECTED_TRAIN_DOCUMENT_IDS = ['A-1', 'A-3', 'A-4', 'S-2', 'S-3', 'S-4', 'S-6', 'S-7', 'T-1', 'T-3']
const DEV_DOCUMENT_IDS = ['A-3', 'S-3', 'T-3']
const FORBIDDEN_KEYS = new Set(['transcription', 'predictionText', 'targetText', 'imageBytes', 'imageData'])

const sha256 = value => createHash('sha256').update(value).digest('hex')
const sha256File = filePath => sha256(fs.readFileSync(filePath))
const readRows = filePath => fs.readFileSync(filePath, 'utf8').split('\n').filter(Boolean).map(line => JSON.parse(line))
const writeJson = (filePath, value) => fs.writeFileSync(filePath, canonicalHistoricalOcrJson(value), 'utf8')
const sorted = values => [...values].sort((left, right) => String(left).localeCompare(String(right)))
const assert = (condition, message) => { if (!condition) throw new Error(message) }

function assertNoForbiddenKeys(value, pathName = '$') {
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoForbiddenKeys(item, `${pathName}[${index}]`))
    return
  }
  if (!value || typeof value !== 'object') return
  for (const [key, nested] of Object.entries(value)) {
    assert(!FORBIDDEN_KEYS.has(key), `raw_text_or_image_retained:${pathName}.${key}`)
    assertNoForbiddenKeys(nested, `${pathName}.${key}`)
  }
}

function rowMembershipDigest(row) {
  return {
    imageSha256: row.imageSha256,
    memberRecordIdSha256: sha256(String(row.memberRecordId)),
    recordContentSha256: row.recordContentSha256,
  }
}

function partitionStats(rows) {
  const byDocument = new Map()
  for (const row of rows) {
    const documentId = String(row.documentId)
    const entry = byDocument.get(documentId) || { recordCount: 0, transcriptionCharacters: 0, membership: [] }
    entry.recordCount += 1
    entry.transcriptionCharacters += Number(row.transcriptionCharacters || 0)
    entry.membership.push(rowMembershipDigest(row))
    byDocument.set(documentId, entry)
  }
  const documents = {}
  for (const documentId of sorted(byDocument.keys())) {
    const entry = byDocument.get(documentId)
    const membership = entry.membership.sort((left, right) => canonicalHistoricalOcrJson(left).localeCompare(canonicalHistoricalOcrJson(right)))
    documents[documentId] = {
      recordCount: entry.recordCount,
      transcriptionCharacters: entry.transcriptionCharacters,
      recordMembershipSha256: historicalOcrContentSha256(membership),
    }
  }
  const membership = rows.map(rowMembershipDigest).sort((left, right) => canonicalHistoricalOcrJson(left).localeCompare(canonicalHistoricalOcrJson(right)))
  return {
    recordCount: rows.length,
    transcriptionCharacters: rows.reduce((sum, row) => sum + Number(row.transcriptionCharacters || 0), 0),
    recordMembershipSha256: historicalOcrContentSha256(membership),
    documents,
  }
}

function chooseStratifiedDevDocuments(documentStats) {
  const groups = new Map()
  for (const [documentId, stats] of Object.entries(documentStats)) {
    const prefix = documentId.slice(0, 1)
    const group = groups.get(prefix) || []
    group.push({ documentId, count: stats.recordCount })
    groups.set(prefix, group)
  }
  const selected = []
  for (const prefix of sorted(groups.keys())) {
    const group = groups.get(prefix).sort((left, right) => left.documentId.localeCompare(right.documentId))
    const total = group.reduce((sum, item) => sum + item.count, 0)
    const target = total * 0.2
    group.sort((left, right) => Math.abs(left.count - target) - Math.abs(right.count - target) || left.documentId.localeCompare(right.documentId))
    selected.push(group[0].documentId)
  }
  return sorted(selected)
}

function main() {
  assert(!/heldout|untouched-held-out|frozen[-_]?gold/i.test(TRAIN_PARQUET), 'non_train_path')
  assert(fs.statSync(TRAIN_PARQUET).isFile(), 'train_parquet_missing')
  assert(fs.statSync(TRAIN_RECORDS).isFile(), 'train_record_manifest_missing')
  const trainParquetSha256 = sha256File(TRAIN_PARQUET)
  assert(trainParquetSha256 === EXPECTED_TRAIN_PARQUET_SHA256, 'train_parquet_sha256_mismatch')
  const rows = readRows(TRAIN_RECORDS)
  assert(rows.length > 0, 'train_record_manifest_empty')
  for (const row of rows) {
    assert(typeof row.documentId === 'string' && EXPECTED_TRAIN_DOCUMENT_IDS.includes(row.documentId), 'unexpected_train_document')
    for (const field of ['imageSha256', 'memberRecordId', 'recordContentSha256']) assert(row[field], `record_field_missing:${field}`)
  }
  const allStats = partitionStats(rows)
  const sourceDocumentIds = sorted(Object.keys(allStats.documents))
  assert(canonicalHistoricalOcrJson(sourceDocumentIds) === canonicalHistoricalOcrJson(EXPECTED_TRAIN_DOCUMENT_IDS), 'train_document_ids_mismatch')
  assert(canonicalHistoricalOcrJson(chooseStratifiedDevDocuments(allStats.documents)) === canonicalHistoricalOcrJson(DEV_DOCUMENT_IDS), 'dev_selection_not_deterministic')
  const devSet = new Set(DEV_DOCUMENT_IDS)
  const innerDevRows = rows.filter(row => devSet.has(row.documentId))
  const innerTrainRows = rows.filter(row => !devSet.has(row.documentId))
  const innerTrainStats = partitionStats(innerTrainRows)
  const innerDevStats = partitionStats(innerDevRows)
  const documentAssignments = {}
  for (const documentId of sourceDocumentIds) documentAssignments[documentId] = devSet.has(documentId) ? 'inner-dev' : 'inner-train'
  const split = {
    schema: 'chi-know-po-ppocrv6-medium-rec-inner-split-v1',
    status: 'MATERIALIZED_TRAIN_ONLY',
    corpus: {
      corpusId: 'CHI-KNOW-PO',
      datasetId: 'calfa-ai/chiknowpo',
      sourceRevision: 'be857420a96e49b009ef0d3b74fbd6d1b28d5c87',
      sourcePartition: 'train',
      trainParquetPath: TRAIN_PARQUET,
      trainParquetSha256,
      sourceRecordManifestPath: TRAIN_RECORDS,
      sourceRecordManifestSha256: sha256File(TRAIN_RECORDS),
      sourceDocumentIds,
      sourceDocumentCount: sourceDocumentIds.length,
      heldOutPathArgumentProvided: false,
      frozenGoldPathArgumentProvided: false,
      sourceUpload: false,
    },
    split: {
      unit: 'document',
      method: 'stratified_prefix_nearest_20pct_v1',
      sourcePartition: 'train',
      innerTrainDocumentIds: sorted(innerTrainStats.documents && Object.keys(innerTrainStats.documents)),
      innerDevDocumentIds: DEV_DOCUMENT_IDS,
      documentAssignments,
      documentDisjoint: true,
      allSourceDocumentsCovered: true,
      innerTrain: innerTrainStats,
      innerDev: innerDevStats,
      devRecordFraction: innerDevStats.recordCount / allStats.recordCount,
      rawTextRetained: false,
      rawImagesRetained: false,
    },
    boundaries: {
      BLOCK_OCR_ROUTE: true,
      OCRProvider: { enabled: false },
      activation: false,
      detectionTouched: false,
      frozenDomainGoldAccessed: false,
      heldOutAccessed: false,
      historicalSourceJudgment: false,
      search: false,
      semanticCorrection: false,
      silentFallback: false,
    },
    evidenceRefs: [
      'artifacts/historical-ocr-chi-know-po-corpus-v1/materialized/train/records.jsonl',
      'artifacts/historical-ocr-chi-know-po-corpus-v1/materialized/train/corpus.parquet',
      'tools/ocr/materialize_chi_know_po_medium_rec_inner_dev.mjs',
    ],
  }
  assertNoForbiddenKeys(split)
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  split.contentSha256 = historicalOcrContentSha256({ ...split, contentSha256: null })
  writeJson(path.join(OUTPUT_DIR, 'inner-dev-split.json'), split)
  console.log(JSON.stringify({
    output: path.join(OUTPUT_DIR, 'inner-dev-split.json'),
    sourceDocumentCount: sourceDocumentIds.length,
    innerTrainDocuments: split.split.innerTrainDocumentIds,
    innerDevDocuments: split.split.innerDevDocumentIds,
    innerTrainRecords: innerTrainStats.recordCount,
    innerDevRecords: innerDevStats.recordCount,
    trainParquetSha256,
    contentSha256: split.contentSha256,
  }, null, 2))
}

main()

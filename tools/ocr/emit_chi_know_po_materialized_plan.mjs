#!/usr/bin/env node

import { createHash } from 'node:crypto'
import { chmodSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  buildChiKnowPoSpecializationPlan,
  checkChiKnowPoSpecializationPlan,
} from '../../src/ocr/chiKnowPoSpecialization.js'
import {
  canonicalHistoricalOcrJson,
  historicalOcrContentSha256,
} from '../../src/ocr/historicalOcrTeam.js'

const root = resolve(process.cwd(), 'artifacts/historical-ocr-chi-know-po-corpus-v1')
const read = name => JSON.parse(readFileSync(resolve(root, name), 'utf8'))
const split = read('document-split.json')
const sourceManifest = read('corpus-manifest.json')
const validation = read('leakage-validation.json')
const sha256File = path => createHash('sha256').update(readFileSync(path)).digest('hex')
if (validation.status !== 'PASSED') throw new Error(`leakage_validation_not_passed:${validation.status}`)
if (!/^[a-f0-9]{64}$/.test(validation.sourceManifestSha256) || validation.sourceManifestSha256 !== split.sourceManifestSha256) throw new Error('source_manifest_hash_invalid')
if (!/^[a-f0-9]{64}$/.test(validation.documentSplitSha256) || validation.documentSplitSha256 !== sha256File(resolve(root, 'document-split.json'))) throw new Error('document_split_hash_invalid')

const plan = buildChiKnowPoSpecializationPlan({
  source: {
    bytesAvailable: true,
    manifestPath: 'artifacts/historical-ocr-chi-know-po-corpus-v1/corpus-manifest.json',
    manifestSha256: validation.sourceManifestSha256,
    revision: split.sourceRevision,
    splitManifestPath: 'artifacts/historical-ocr-chi-know-po-corpus-v1/document-split.json',
    splitManifestSha256: validation.documentSplitSha256,
    readOnlyAcquisition: sourceManifest.source.acquisition === 'read_only_local_copy_at_pinned_revision',
    materializedValidated: true,
    licenseSpdx: sourceManifest.licenseDataBoundary.spdx,
    sourceFileCount: sourceManifest.files.length,
    sourceParquetBytes: sourceManifest.sourceTotals.parquetBytes,
    sourceRowCount: sourceManifest.sourceTotals.lineCount,
    documentCount: sourceManifest.sourceTotals.documentCount,
    partitions: split.partitions,
    safety: {
      status: 'PASSED',
      decision: validation.decision,
      sourceIntegrity: 'PASSED',
      documentIdentity: 'PASSED',
      leakage: 'PASSED',
      safeToStartTrainingDataPreparation: true,
      safeToHandOffToFineTuningGate: true,
      evidenceRefs: [
        'artifacts/historical-ocr-chi-know-po-corpus-v1/corpus-manifest.json',
        'artifacts/historical-ocr-chi-know-po-corpus-v1/document-split.json',
        'artifacts/historical-ocr-chi-know-po-corpus-v1/leakage-validation.json',
      ],
    },
  },
  documents: split.documents.map(document => ({
    documentId: document.documentId,
    documentFingerprint: document.documentFingerprint,
    duplicateFamilyId: document.duplicateFamilyId,
    sourceObjectHashes: document.sourceObjectHashes,
    memberRecordIds: document.memberRecordIds,
  })),
  trainDocumentIds: split.partitions.train.documentIds,
  heldOutDocumentIds: split.partitions['untouched-held-out'].documentIds,
})
const errors = checkChiKnowPoSpecializationPlan(plan)
if (errors.length > 0) throw new Error(`plan_invalid:${errors.join(',')}`)

const planPath = resolve(root, 'plan.json')
writeFileSync(planPath, canonicalHistoricalOcrJson(plan), 'utf8')
const planContentSha256 = historicalOcrContentSha256(plan)
const planFileSha256 = sha256File(planPath)

const nextValidation = {
  ...validation,
  planPath: 'plan.json',
  planSha256: planContentSha256,
  planFileSha256,
  planValidation: { status: 'PASSED', errors: [] },
}
delete nextValidation.contentSha256
nextValidation.contentSha256 = historicalOcrContentSha256({ ...nextValidation, contentSha256: undefined })
const validationPath = resolve(root, 'leakage-validation.json')
writeFileSync(validationPath, canonicalHistoricalOcrJson(nextValidation), 'utf8')
const validationSha256 = sha256File(validationPath)

const summary = read('materialization-summary.json')
summary.status = 'MATERIALIZED_AND_VALIDATED'
summary.documentSplitSha256 = validation.documentSplitSha256
summary.validator = { status: 'PASSED', path: 'leakage-validation.json', sha256: validationSha256 }
summary.plan = { status: 'PASSED', path: 'plan.json', sha256: planFileSha256, contentSha256: planContentSha256 }
summary.fineTuning = { status: 'NOT_RUN', executed: false }
summary.frozenDomainGoldAccessed = false
summary.ocrActivation = { status: 'BLOCKED', enabled: false, active: false }
summary.routeBoundary = { BLOCK_OCR_ROUTE: true, OCRProvider: { enabled: false } }
writeFileSync(resolve(root, 'materialization-summary.json'), canonicalHistoricalOcrJson(summary), 'utf8')

// Freeze all evidence/manifests after the final read/write update.  Source
// parquet and held-out snapshots were already immutable before this step.
for (const name of ['corpus-manifest.json', 'document-split.json', 'leakage-validation.json', 'plan.json', 'materialization-summary.json']) {
  chmodSync(resolve(root, name), 0o444)
}

console.log(JSON.stringify({
  status: plan.status,
  corpusSafety: plan.corpusSafetyGate.status,
  sourceManifestSha256: plan.corpus.manifestSha256,
  splitManifestSha256: plan.corpus.splitManifestSha256,
  planFileSha256,
  planContentSha256,
  validationSha256,
  trainDocuments: plan.partitions.train.documentIds.length,
  heldOutDocuments: plan.partitions['untouched-held-out'].documentIds.length,
  fineTuning: plan.fineTuningGate.status,
  activation: plan.activationGate.status,
  BLOCK_OCR_ROUTE: plan.routeBoundary.BLOCK_OCR_ROUTE,
  OCRProviderEnabled: plan.routeBoundary.OCRProvider.enabled,
}, null, 2))

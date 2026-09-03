import assert from 'node:assert/strict'
import test from 'node:test'
import {
  BLOCK_OCR_ROUTE,
  OCRProvider,
} from '../src/ocr/historicalOcrTeam.js'
import {
  buildChiKnowPoSpecializationPlan,
  checkChiKnowPoSpecializationPlan,
  validateChiKnowPoSpecializationPlan,
} from '../src/ocr/chiKnowPoSpecialization.js'

const hash = character => character.repeat(64)

test('CHI-KNOW-PO design stays explicit and does not invent a corpus or open a gate', () => {
  const plan = buildChiKnowPoSpecializationPlan()
  assert.deepEqual(checkChiKnowPoSpecializationPlan(plan), [])
  assert.equal(plan.status, 'DESIGN_ONLY')
  assert.equal(plan.corpus.bytesAvailable, false)
  assert.equal(plan.corpus.splitMaterialized, false)
  assert.deepEqual(plan.documentCatalog, [])
  assert.equal(plan.fineTuningGate.status, 'NOT_RUN')
  assert.equal(plan.fineTuningGate.executed, false)
  assert.equal(plan.activationGate.status, 'BLOCKED')
  assert.equal(plan.activationGate.active, false)
  assert.equal(plan.routeBoundary.BLOCK_OCR_ROUTE, BLOCK_OCR_ROUTE)
  assert.deepEqual(plan.routeBoundary.OCRProvider, OCRProvider)
})

test('document-level train and untouched-held-out plan rejects no leakage-free group', () => {
  const plan = buildChiKnowPoSpecializationPlan({
    source: { bytesAvailable: true, manifestPath: 'chi-know-po/manifest.json', manifestSha256: hash('a') },
    documents: [
      {
        documentId: 'doc-train',
        documentFingerprint: hash('b'),
        duplicateFamilyId: 'family-train',
        sourceObjectHashes: [hash('c')],
        memberRecordIds: ['doc-train-page-1-line-1', 'doc-train-page-1-line-2'],
      },
      {
        documentId: 'doc-heldout',
        documentFingerprint: hash('d'),
        duplicateFamilyId: 'family-heldout',
        sourceObjectHashes: [hash('e')],
        memberRecordIds: ['doc-heldout-page-1-line-1'],
      },
    ],
    trainDocumentIds: ['doc-train'],
    heldOutDocumentIds: ['doc-heldout'],
  })
  const result = validateChiKnowPoSpecializationPlan(plan)
  assert.equal(result.pass, true)
  assert.deepEqual(result.errors, [])
  assert.deepEqual(plan.partitions.train.documentIds, ['doc-train'])
  assert.deepEqual(plan.partitions['untouched-held-out'].documentIds, ['doc-heldout'])
  assert.equal(plan.partitions['untouched-held-out'].eligibleForTraining, false)
  assert.equal(plan.partitions['untouched-held-out'].readOnly, true)
  assert.equal(plan.partitions['untouched-held-out'].untouched, true)
  assert.equal(plan.partitions['untouched-held-out'].useBoundary.checkpointSelection, false)
})

test('document split validator blocks source-object leakage across partitions', () => {
  const sharedSourceHash = hash('f')
  const plan = buildChiKnowPoSpecializationPlan({
    source: { bytesAvailable: true, manifestSha256: hash('c') },
    documents: [
      { documentId: 'doc-a', documentFingerprint: hash('a'), duplicateFamilyId: 'family-a', sourceObjectHashes: [sharedSourceHash], memberRecordIds: ['a-1'] },
      { documentId: 'doc-b', documentFingerprint: hash('b'), duplicateFamilyId: 'family-b', sourceObjectHashes: [sharedSourceHash], memberRecordIds: ['b-1'] },
    ],
    trainDocumentIds: ['doc-a'],
    heldOutDocumentIds: ['doc-b'],
  })
  const errors = checkChiKnowPoSpecializationPlan(plan)
  assert.ok(errors.some(error => error.startsWith('cross_partition_source_object_hash:')))
})

test('validated corpus safety gate permits only a separate fine-tuning handoff', () => {
  const plan = buildChiKnowPoSpecializationPlan({
    source: {
      bytesAvailable: true,
      manifestPath: 'artifacts/chi/corpus-manifest.json',
      manifestSha256: hash('a'),
      revision: 'be857420a96e49b009ef0d3b74fbd6d1b28d5c87',
      splitManifestPath: 'artifacts/chi/document-split.json',
      splitManifestSha256: hash('b'),
      readOnlyAcquisition: true,
      materializedValidated: true,
      licenseSpdx: 'Apache-2.0',
      safety: {
        status: 'PASSED',
        sourceIntegrity: 'PASSED',
        documentIdentity: 'PASSED',
        leakage: 'PASSED',
        safeToStartTrainingDataPreparation: true,
        safeToHandOffToFineTuningGate: true,
      },
    },
    documents: [
      { documentId: 'doc-train', documentFingerprint: hash('c'), duplicateFamilyId: 'family-train', sourceObjectHashes: [hash('d')], memberRecordIds: ['train-1'] },
      { documentId: 'doc-heldout', documentFingerprint: hash('e'), duplicateFamilyId: 'family-heldout', sourceObjectHashes: [hash('f')], memberRecordIds: ['heldout-1'] },
    ],
    trainDocumentIds: ['doc-train'],
    heldOutDocumentIds: ['doc-heldout'],
  })
  assert.deepEqual(checkChiKnowPoSpecializationPlan(plan), [])
  assert.equal(plan.status, 'MATERIALIZED_AND_VALIDATED')
  assert.equal(plan.corpusSafetyGate.status, 'PASSED')
  assert.equal(plan.corpusSafetyGate.fineTuningAuthorization, 'NOT_GRANTED')
  assert.equal(plan.corpusSafetyGate.fineTuningExecuted, false)
  assert.equal(plan.corpusSafetyGate.frozenDomainGoldAccessed, false)
  assert.equal(plan.fineTuningGate.status, 'NOT_RUN')
  assert.equal(plan.activationGate.status, 'BLOCKED')
})

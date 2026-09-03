import assert from 'node:assert/strict'
import test from 'node:test'
import {
  BLOCK_OCR_ROUTE,
  CHI_KNOW_PO_CORPUS_ID,
  FROZEN_GOLD_CORPUS_ID,
  OCRProvider,
  OCR_REQUIRED,
  PP_OCRV6_REC_WORKERS,
  PP_OCRV6_WORKERS,
  adjudicateHistoricalOcrOutputs,
  buildHistoricalOcrPacket,
  buildHistoricalOcrTeam,
  buildPpOcrV6RecognitionWorkerSlots,
  canonicalHistoricalOcrJson,
  checkHistoricalOcrPacket,
  checkHistoricalOcrTeam,
  evaluateHistoricalOcrComponentPromotion,
  historicalOcrPacketContentSha256,
  selectHistoricalOcrWorker,
} from '../src/ocr/historicalOcrTeam.js'

const hash = character => character.repeat(64)
const handoff = {
  type: OCR_REQUIRED,
  handoffId: 'historical-page-001',
  promotedGeometry: { page: 1, boxes: [{ id: 'b1', x: 0, y: 0, width: 10, height: 10 }] },
  promotedTableGrid: { rows: 2, columns: 3, cells: ['a', 'b', 'c', 'd', 'e', 'f'] },
}
const promotedGeometry = structuredClone(handoff.promotedGeometry)
const promotedTableGrid = structuredClone(handoff.promotedTableGrid)

const corpora = [
  {
    corpusId: CHI_KNOW_PO_CORPUS_ID,
    role: 'chi_know_po_independent_validation',
    required: true,
    frozen: true,
    availability: 'supplied',
    manifestPath: 'test/fixtures/ocr/chi-know-po.manifest.json',
    manifestSha256: hash('a'),
    caseCount: 2,
    evidenceRefs: ['test/fixtures/ocr/chi-know-po.manifest.json'],
    localOnly: true,
  },
  {
    corpusId: FROZEN_GOLD_CORPUS_ID,
    role: 'existing_frozen_gold_independent_validation',
    required: true,
    frozen: true,
    availability: 'supplied',
    manifestPath: 'test/fixtures/ocr/frozen-gold.manifest.json',
    manifestSha256: hash('b'),
    caseCount: 2,
    evidenceRefs: ['test/fixtures/ocr/frozen-gold.manifest.json'],
    localOnly: true,
  },
]

const acceptanceCriteria = {
  det: { perCorpus: true, rules: [{ metric: 'f1', minimum: 0.9 }, { metric: 'geometryMatchRate', minimum: 0.9 }] },
  rec: { perCorpus: true, rules: [{ metric: 'exactMatchRate', minimum: 0.9 }, { metric: 'characterErrorRate', maximum: 0.1 }, { metric: 'wordErrorRate', maximum: 0.1 }] },
}

function validation(component, corpusId, outputSha256) {
  const metrics = component === 'det'
    ? { precision: 1, recall: 1, f1: 1, geometryMatchRate: 1 }
    : { exactMatchRate: 1, characterErrorRate: 0, wordErrorRate: 0 }
  const workerId = component === 'det' ? 'pp-ocrv6-det' : 'pp-ocrv6-rec'
  const corpus = corpora.find(item => item.corpusId === corpusId)
  return {
    validationId: `${component}-${corpusId}-v1`,
    component,
    workerId,
    corpusId,
    status: 'PASSED',
    inputSha256: hash(component === 'det' ? 'c' : 'd'),
    outputSha256,
    expected: { caseCount: 2, manifestSha256: corpus.manifestSha256 },
    accuracy: { evaluatedCases: 2, mismatches: 0, metrics },
    reproducibility: { repeatCount: 2, outputSha256s: [outputSha256, outputSha256], deterministic: true },
    runtime: { execution: 'local', os: 'darwin', architecture: 'arm64', machine: 'apple-m1', networkAccess: false, compatible: true, observed: true },
    resources: {
      peakRssMiB: 128,
      wallTimeMs: 500,
      cpuSeconds: 0.5,
      limits: { peakRssMiBMax: 512, wallTimeMsMax: 5000, cpuSecondsMax: 5 },
    },
    licenseDataBoundary: {
      licenseStatus: 'VERIFIED',
      licenseEvidenceRefs: ['docs/historical-ocr-team-contract-v1.md'],
      dataStatus: 'VERIFIED',
      dataEvidenceRefs: ['docs/historical-ocr-team-contract-v1.md'],
      localOnly: true,
      networkAccess: false,
      sourceUpload: false,
      modelDownload: false,
    },
    operationBoundary: { search: false, historicalSourceJudgment: false, semanticCorrection: false, silentFallback: false },
    evidenceRefs: ['test/fixtures/ocr/validation-record.json'],
  }
}

function validEvidence(component) {
  const outputSha256 = hash(component === 'det' ? 'e' : 'f')
  return {
    component,
    workerId: component === 'det' ? 'pp-ocrv6-det' : 'pp-ocrv6-rec',
    verificationMode: 'independent_per_component',
    acceptance: acceptanceCriteria[component],
    status: 'VERIFIED',
    outcome: 'VERIFIED',
    validations: [
      validation(component, CHI_KNOW_PO_CORPUS_ID, outputSha256),
      validation(component, FROZEN_GOLD_CORPUS_ID, outputSha256),
    ],
    unknowns: [],
    conflicts: [],
  }
}

function validTeam() {
  return buildHistoricalOcrTeam({
    handoff,
    promotedGeometry,
    promotedTableGrid,
    validationCorpora: corpora,
    acceptanceCriteria,
    componentEvidence: { det: validEvidence('det'), rec: validEvidence('rec') },
  })
}

test('PP-OCRv6 is registered as two replaceable candidate slots without activation', () => {
  assert.equal(BLOCK_OCR_ROUTE, true)
  assert.deepEqual(OCRProvider, { enabled: false })
  assert.deepEqual(PP_OCRV6_WORKERS.map(worker => [worker.slotId, worker.component, worker.workerId]), [
    ['det', 'det', 'pp-ocrv6-det'],
    ['rec', 'rec', 'pp-ocrv6-rec'],
  ])
  assert.ok(PP_OCRV6_WORKERS.every(worker => worker.replaceable && worker.fallbackPolicy === 'none' && worker.activation.enabled === false))

  const team = buildHistoricalOcrTeam({ handoff, promotedGeometry, promotedTableGrid })
  assert.equal(team.promotion.det.status, 'UNKNOWN')
  assert.equal(team.promotion.rec.status, 'UNKNOWN')
  assert.equal(team.routePolicy.BLOCK_OCR_ROUTE, true)
  assert.equal(team.routePolicy.OCRProvider.enabled, false)
  assert.equal(team.activation.enabled, false)
  assert.equal(team.activation.active, false)
  assert.equal(team.validationCorpora[0].availability, 'not_supplied')
})

test('PP-OCRv6 recognition variants are explicit replaceable slots without fallback or activation', () => {
  assert.deepEqual(PP_OCRV6_REC_WORKERS.map(worker => [worker.slotId, worker.workerId, worker.modelVariant]), [
    ['rec-small', 'pp-ocrv6-small-rec', 'small'],
    ['rec-medium', 'pp-ocrv6-medium-rec', 'medium'],
  ])
  const slots = buildPpOcrV6RecognitionWorkerSlots()
  assert.deepEqual(slots.map(worker => [worker.slotId, worker.workerId]), [
    ['rec-medium', 'pp-ocrv6-medium-rec'],
    ['rec-small', 'pp-ocrv6-small-rec'],
  ])
  assert.ok(slots.every(worker => worker.component === 'rec' && worker.replaceable && worker.fallbackPolicy === 'none' && worker.activation.active === false))
})

test('each component is independently promoted only after CHI-KNOW-PO and frozen-gold gates pass', () => {
  const team = validTeam()
  assert.deepEqual(checkHistoricalOcrTeam(team), [])
  assert.equal(team.promotion.det.status, 'PROMOTED')
  assert.equal(team.promotion.rec.status, 'PROMOTED')
  assert.deepEqual(team.handoff, handoff)
  assert.deepEqual(team.promotedGeometry, promotedGeometry)
  assert.deepEqual(team.promotedTableGrid, promotedTableGrid)
  assert.equal(team.activation.enabled, false)
  assert.equal(team.activation.decision, 'separate_activation_decision_required')
})

test('deterministic packet preserves promoted inputs and is stable under object-key reordering', () => {
  const firstTeam = validTeam()
  const first = buildHistoricalOcrPacket(firstTeam)
  const reorderedInput = JSON.parse(JSON.stringify(firstTeam, (key, value) => {
    if (value && typeof value === 'object' && !Array.isArray(value)) return Object.fromEntries(Object.entries(value).reverse())
    return value
  }))
  const second = buildHistoricalOcrPacket(reorderedInput)
  assert.equal(canonicalHistoricalOcrJson(first), canonicalHistoricalOcrJson(second))
  assert.equal(historicalOcrPacketContentSha256(first), first.packetContentSha256)
  assert.deepEqual(checkHistoricalOcrPacket(first, { expectedHandoff: handoff, expectedPromotedGeometry: promotedGeometry, expectedPromotedTableGrid: promotedTableGrid }), [])
  assert.equal(first.routePolicy.BLOCK_OCR_ROUTE, true)
  assert.equal(first.routePolicy.OCRProvider.enabled, false)
  assert.equal(first.activation.enabled, false)
  assert.equal(first.outcomes.det.status, 'UNKNOWN')
  assert.equal(first.outcomes.rec.status, 'UNKNOWN')
})

test('conflict never chooses a worker and UNKNOWN never silently falls back', () => {
  const conflict = adjudicateHistoricalOcrOutputs({
    component: 'rec',
    outputs: [
      { component: 'rec', workerId: 'worker-a', status: 'VERIFIED', outputSha256: hash('a') },
      { component: 'rec', workerId: 'worker-b', status: 'VERIFIED', outputSha256: hash('b') },
    ],
  })
  assert.equal(conflict.status, 'CONFLICT')
  assert.equal(conflict.winnerWorkerId, null)
  assert.equal(conflict.consensusOutputSha256, null)
  assert.deepEqual(conflict.conflictingWorkerIds, ['worker-a', 'worker-b'])

  const unknown = adjudicateHistoricalOcrOutputs({
    component: 'rec',
    requiredWorkerIds: ['worker-a', 'worker-b'],
    outputs: [{ component: 'rec', workerId: 'worker-a', status: 'VERIFIED', outputSha256: hash('a') }],
  })
  assert.equal(unknown.status, 'UNKNOWN')
  assert.equal(unknown.winnerWorkerId, null)
  assert.ok(unknown.reasonCodes.includes('required_worker_output_missing'))
})

test('component promotion rejects policy violations and keeps component scopes independent', () => {
  const evidence = validEvidence('det')
  evidence.validations[0].operationBoundary.semanticCorrection = true
  const result = evaluateHistoricalOcrComponentPromotion({
    component: 'det',
    evidence,
    worker: PP_OCRV6_WORKERS.find(worker => worker.component === 'det'),
    corpora,
    acceptance: acceptanceCriteria.det,
  })
  assert.equal(result.status, 'BLOCKED')
  assert.ok(result.reasonCodes.includes('semantic_correction_forbidden'))

  const team = validTeam()
  team.componentEvidence.rec.validations.pop()
  team.promotion.rec = evaluateHistoricalOcrComponentPromotion({
    component: 'rec',
    evidence: team.componentEvidence.rec,
    worker: team.workers.find(worker => worker.component === 'rec'),
    corpora: team.validationCorpora,
    acceptance: acceptanceCriteria.rec,
  })
  assert.equal(team.promotion.det.status, 'PROMOTED')
  assert.equal(team.promotion.rec.status, 'UNKNOWN')
  assert.ok(checkHistoricalOcrTeam(team).some(code => code.includes('required_corpus_missing') || code.includes('component_must_have_two')))

  const unknownEvidence = validEvidence('det')
  unknownEvidence.validations[0].status = 'UNKNOWN'
  const unknownPromotion = evaluateHistoricalOcrComponentPromotion({
    component: 'det',
    evidence: unknownEvidence,
    worker: PP_OCRV6_WORKERS.find(worker => worker.component === 'det'),
    corpora,
    acceptance: acceptanceCriteria.det,
  })
  assert.equal(unknownPromotion.status, 'UNKNOWN')
  assert.ok(unknownPromotion.reasonCodes.includes('validation_result_unknown'))
})

test('worker selection is explicit and has no fallback path', () => {
  const team = validTeam()
  assert.equal(selectHistoricalOcrWorker({ team, component: 'det', workerId: 'pp-ocrv6-det' }).status, 'VERIFIED')
  const missing = selectHistoricalOcrWorker({ team, component: 'det' })
  assert.equal(missing.status, 'UNKNOWN')
  assert.ok(missing.reasonCodes.includes('explicit_worker_id_required'))
  const absent = selectHistoricalOcrWorker({ team, component: 'rec', workerId: 'pp-ocrv6-det' })
  assert.equal(absent.status, 'UNKNOWN')
})

test('route and preservation mutations fail closed', () => {
  const team = validTeam()
  team.routePolicy.BLOCK_OCR_ROUTE = false
  team.routePolicy.OCRProvider.enabled = true
  team.promotedGeometry.boxes[0].x = 999
  const errors = checkHistoricalOcrTeam(team, { expectedHandoff: handoff, expectedPromotedGeometry: promotedGeometry, expectedPromotedTableGrid: promotedTableGrid })
  assert.ok(errors.includes('routePolicy.BLOCK_OCR_ROUTE_promoted'))
  assert.ok(errors.includes('routePolicy.OCRProvider_enabled_or_changed'))
  assert.ok(errors.includes('promoted_geometry_not_preserved'))
})

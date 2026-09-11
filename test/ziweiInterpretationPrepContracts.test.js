import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import {
  buildDeterministicBase,
  projectDeterministicBaseForConsumer,
} from '../src/interpretationPrep/conversationFoundation.js'
import { prepareThreeSystemInterpretationData } from '../src/interpretationPrep/threeSystemPrepPipeline.js'
import {
  ZIWEI_AUTHORIZATION_KIND,
  ZIWEI_AUTHORIZATION_REQUEST_KIND,
  ZIWEI_AUTHORIZATION_REQUEST_SCHEMA,
  ZIWEI_AUTHORIZATION_REQUEST_VERSION,
  ZIWEI_EVIDENCE_SCHEMA,
  ZIWEI_EVIDENCE_VERSION,
  ZIWEI_HYPOTHESIS_SUBMISSION_KIND,
  ZIWEI_HYPOTHESIS_SUBMISSION_SCHEMA,
  ZIWEI_HYPOTHESIS_SUBMISSION_VERSION,
  adaptZiweiEvidenceToConstitution,
  buildZiweiConversationalHandoffPackage,
  buildZiweiEvidenceConsumptionContract,
  buildZiweiEvidenceHandoffEnvelope,
  buildZiweiHypothesisDiscussionAuthorization,
  buildZiweiHypothesisSubmissionValidation,
  consumeZiweiConversationalHandoffPackage,
  consumeZiweiEvidenceHandoffEnvelope,
  consumeZiweiEvidenceConsumptionContract,
  consumeZiweiHypothesisDiscussionAuthorizationRequest,
  consumeZiweiHypothesisSubmission,
  evaluateZiweiInterpretationConstitution,
  exportZiweiConversationalHandoffPackageJson,
  exportZiweiEvidenceConsumptionContractJson,
  exportZiweiEvidenceHandoffEnvelopeJson,
  exportZiweiHypothesisSubmissionJson,
} from '../src/interpretationPrep/ziweiInterpretationPrepContracts.js'

const FIXTURE_INPUT = {
  subjectName: 'ziwei-interpretation-prep-fixture',
  birthDate: '1992-04-18',
  birthTime: '18:30',
  targetDate: '2026-07-26',
  placeName: '대한민국 서울',
  referenceCity: 'seoul',
  timezone: 'Asia/Seoul',
  latitude: '37.57',
  longitude: '126.97',
  gender: 'male',
  calendar: 'solar',
  isLeapMonth: false,
  timeAccuracy: 'exact',
}

const clone = value => JSON.parse(JSON.stringify(value))

function materialize() {
  const prepared = prepareThreeSystemInterpretationData(FIXTURE_INPUT)
  const base = projectDeterministicBaseForConsumer(buildDeterministicBase({
    subjectName: FIXTURE_INPUT.subjectName,
    result: prepared.result,
    unifiedContext: prepared.unifiedContext,
  }))
  const envelopeResult = buildZiweiEvidenceHandoffEnvelope({ base })
  assert.equal(envelopeResult.valid, true, envelopeResult.errors.join('\n'))
  const packageResult = buildZiweiConversationalHandoffPackage({ base, envelope: envelopeResult.envelope })
  assert.equal(packageResult.valid, true, packageResult.errors.join('\n'))
  return { base, envelope: envelopeResult.envelope, package: packageResult.package }
}

function makeSubmission(handoffPackage, { sourceEvidence = null, userContext = { status: 'not_provided', entries: [] } } = {}) {
  const evidence = handoffPackage.evidenceConsumption.constitutionInput.evidence
  const fact = evidence.find(item => item.kind === 'base_fact')
  const source = sourceEvidence || evidence.find(item => item.kind === 'literature_claim' && item.evidenceRole === 'source_observation')
  return {
    schemaVersion: ZIWEI_HYPOTHESIS_SUBMISSION_SCHEMA,
    version: ZIWEI_HYPOTHESIS_SUBMISSION_VERSION,
    kind: ZIWEI_HYPOTHESIS_SUBMISSION_KIND,
    submissionId: 'ziwei-submission-fixture-1',
    userContext,
    hypothesis: {
      id: 'ziwei-hypothesis-fixture-1',
      statement: 'A bounded source observation may be relevant to the included coordinate FACT; this is not a personal conclusion.',
      claimType: 'interpretation_hypothesis',
      status: 'hypothesis',
      userExperienceGate: 'required',
      factRefs: [fact.factRefs[0]],
      evidenceIds: [fact.id, source.id],
      semanticBasisIds: [source.id],
      conflictIds: [],
      userContextIds: userContext.entries.map(entry => entry.id),
      sourceScope: {
        mode: 'exact_referenced_source_scope',
        lineages: [...source.lineages],
        sourceIds: [...source.sourceRefs.sourceIds],
        locatorIds: [...source.sourceRefs.locatorIds],
        generalization: 'forbidden',
        crossLineage: 'forbidden',
      },
      preservation: {
        unresolvedEvidenceIds: [source.id],
        conflictIds: [],
      },
      assertion: {
        mode: 'tentative',
        subjectScope: 'source_bounded_evidence_and_explicit_user_context',
        applicationMode: 'source_bounded_discussion',
        personalConclusion: 'forbidden',
        unstatedPersonalAttributes: 'not_claimed',
      },
    },
  }
}

function makeAuthorizationRequest(hypothesisValidation, state = 'confirmed') {
  const hypothesisId = hypothesisValidation.submission.hypothesis.id
  return {
    schemaVersion: ZIWEI_AUTHORIZATION_REQUEST_SCHEMA,
    version: ZIWEI_AUTHORIZATION_REQUEST_VERSION,
    kind: ZIWEI_AUTHORIZATION_REQUEST_KIND,
    authorizationId: `ziwei-authorization-${state}`,
    hypothesisValidation,
    userConfirmation: {
      hypothesisId,
      state,
      scope: 'this_hypothesis_only',
      basis: 'external_user_confirmation',
    },
    requestedUse: {
      hypothesisId,
      action: 'discussion',
      scope: 'this_hypothesis_only',
      otherHypotheses: 'forbidden',
      personalApplication: 'bounded_user_context_only',
      globalActivation: 'forbidden',
    },
  }
}

test('Ziwei evidence chain round-trips through fresh files and preserves the source frontier', async () => {
  const fixture = materialize()
  const adapter = adaptZiweiEvidenceToConstitution({ base: fixture.base, envelope: fixture.envelope })
  assert.equal(adapter.adapterValidation.valid, true)
  assert.equal(adapter.evidence.filter(item => item.kind === 'base_fact').length, 2)
  assert.ok(adapter.evidence.some(item => item.kind === 'literature_claim' && item.evidenceRole === 'source_observation' && item.status === 'candidate'))
  const nlkTianfu = adapter.evidence.find(item => item.id === 'ziwei.source-observation.nlk-tianfu-axis')
  assert.ok(nlkTianfu)
  assert.deepEqual(nlkTianfu.sourceRefs.sourceIds, ['nlk_cnts_00047996572'])
  assert.deepEqual(nlkTianfu.sourceRefs.locatorIds, ['nlk-p7-tianfu-rule'])
  assert.equal(nlkTianfu.sourceRefs.sourceByteSha256.nlk_cnts_00047996572, 'b21bbf3e2c7cdada4153f847ff9f359dbb29e71998e1f931417d108b571b23c3')
  assert.equal(nlkTianfu.semanticBasisEligible, false)
  const workedCharts = adapter.evidence.find(item => item.id === 'ziwei.source-observation.nlk-gujinmingxingtu-worked-charts')
  assert.ok(workedCharts)
  assert.deepEqual(workedCharts.sourceRefs.sourceIds, ['nlk_cnts_00047981909'])
  assert.deepEqual(workedCharts.sourceRefs.locatorIds, ['nlk-gjms-p2-worked-charts', 'nlk-gjms-p3-worked-charts', 'nlk-gjms-p175-printed-p174'])
  assert.equal(workedCharts.semanticBasisEligible, false)
  const workedChartConflict = adapter.evidence.find(item => item.id === 'ziwei.source-conflict.nlk-gujinmingxingtu-palace-direction')
  assert.equal(workedChartConflict.status, 'conflict')
  const oracleFrontier = adapter.evidence.find(item => item.id === 'ziwei.source-state.nlk-gujinmingxingtu-oracle-frontier')
  assert.equal(oracleFrontier.status, 'unresolved')
  const palaceIdentity = adapter.evidence.find(item => item.id === 'ziwei.source-state.palace-semantic-identity')
  assert.equal(palaceIdentity.status, 'unresolved')
  assert.ok(adapter.evidence.some(item => item.relation === 'conflicts' && item.status === 'conflict'))
  assert.equal(adapter.readiness.sourceSemanticEvidenceAvailable, false)
  assert.equal(adapter.readiness.interpretationHypothesisReady, false)

  const constitution = evaluateZiweiInterpretationConstitution({ base: fixture.base, envelope: fixture.envelope })
  assert.equal(constitution.contractValid, true)
  assert.equal(constitution.interpretationDecision, 'facts_only_no_semantic_interpretation')
  assert.equal(constitution.noCrossSystemMajority, true)

  const directory = await mkdtemp(join(tmpdir(), 'ziwei-interpretation-prep-'))
  try {
    const envelopePath = join(directory, 'envelope.json')
    const consumptionPath = join(directory, 'consumption.json')
    const packagePath = join(directory, 'handoff.json')
    await writeFile(envelopePath, exportZiweiEvidenceHandoffEnvelopeJson(fixture.envelope), 'utf8')
    const freshEnvelope = await readFile(envelopePath, 'utf8')
    const consumedEnvelope = consumeZiweiEvidenceHandoffEnvelope(freshEnvelope, fixture.base)
    assert.equal(consumedEnvelope.valid, true, consumedEnvelope.errors.join('\n'))
    assert.equal(exportZiweiEvidenceHandoffEnvelopeJson(consumedEnvelope.envelope), freshEnvelope)

    const consumptionResult = buildZiweiEvidenceConsumptionContract({ base: fixture.base, envelope: consumedEnvelope.envelope })
    assert.equal(consumptionResult.valid, true, consumptionResult.errors.join('\n'))
    const factGuidance = consumptionResult.contract.consumptionGuidance.entries.find(item => item.evidenceClass === 'fact')
    const sourceGuidance = consumptionResult.contract.consumptionGuidance.entries.find(item => item.evidenceClass === 'literature_evidence')
    const conflictGuidance = consumptionResult.contract.consumptionGuidance.entries.find(item => item.evidenceClass === 'conflict')
    assert.equal(factGuidance.permission.confirmedFact, true)
    assert.equal(factGuidance.permission.definitivePersonalization, false)
    assert.equal(sourceGuidance.permission.confirmedFact, false)
    assert.equal(sourceGuidance.permission.hypothesisProposal, 'blocked_source_semantic_authority_not_closed')
    assert.equal(conflictGuidance.permission.hypothesisProposal, 'blocked_conflict_preserved')
    await writeFile(consumptionPath, exportZiweiEvidenceConsumptionContractJson(consumptionResult.contract), 'utf8')
    const consumedConsumption = consumeZiweiEvidenceConsumptionContract(await readFile(consumptionPath, 'utf8'), { base: fixture.base })
    assert.equal(consumedConsumption.valid, true, consumedConsumption.errors.join('\n'))

    await writeFile(packagePath, exportZiweiConversationalHandoffPackageJson(fixture.package), 'utf8')
    const consumedPackage = consumeZiweiConversationalHandoffPackage(await readFile(packagePath, 'utf8'), { base: fixture.base })
    assert.equal(consumedPackage.valid, true, consumedPackage.errors.join('\n'))
    assert.equal(consumedPackage.package.readiness.conversationalInterpretationActivationReady, false)
    assert.equal(consumedPackage.package.evidenceConsumption.readiness.sourceSemanticEvidenceAvailable, false)
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

test('Ziwei envelope and package fail closed on missing, tampered, and promoted evidence', () => {
  const fixture = materialize()

  const missing = clone(fixture.envelope)
  missing.evidence.baseFacts = []
  const missingResult = consumeZiweiEvidenceHandoffEnvelope(JSON.stringify(missing), fixture.base)
  assert.equal(missingResult.valid, false)
  assert.equal(missingResult.envelope, null)
  assert.ok(missingResult.errors.some(error => error.includes('base_fact_record_count_mismatch')))

  const tampered = clone(fixture.envelope)
  const candidate = tampered.evidence.sourceEvidence.find(item => item.status === 'candidate')
  const sourceId = candidate.sourceRefs.sourceIds[0]
  candidate.sourceRefs.sourceByteSha256[sourceId] = '0'.repeat(64)
  const tamperedResult = consumeZiweiEvidenceHandoffEnvelope(JSON.stringify(tampered), fixture.base)
  assert.equal(tamperedResult.valid, false)
  assert.equal(tamperedResult.envelope, null)
  assert.ok(tamperedResult.errors.some(error => error.includes('source_hash_mismatch')))

  const promoted = clone(fixture.package)
  const promotedItem = promoted.evidenceConsumption.handoffEvidence.evidence.sourceEvidence.find(item => item.status === 'candidate')
  promotedItem.status = 'available'
  const promotedResult = consumeZiweiConversationalHandoffPackage(JSON.stringify(promoted), { base: fixture.base })
  assert.equal(promotedResult.valid, false)
  assert.equal(promotedResult.package, null)
  assert.ok(promotedResult.errors.some(error => error.includes('semantic_promotion_forbidden') || error.includes('source_frontier_item_mismatch')))
})

test('external Ziwei hypothesis is blocked at the source-authority frontier and authorization cannot reopen it', async () => {
  const fixture = materialize()
  const sourceEvidence = fixture.package.evidenceConsumption.constitutionInput.evidence.find(item => item.kind === 'literature_claim' && item.evidenceRole === 'source_observation')
  const submission = makeSubmission(fixture.package, { sourceEvidence })
  const validation = buildZiweiHypothesisSubmissionValidation({ handoffPackage: fixture.package, submission })
  assert.equal(validation.valid, true, validation.errors.join('\n'))
  assert.equal(validation.decision, 'blocked')
  assert.deepEqual(validation.validation.result.semanticBasisIds, [])
  assert.deepEqual(validation.validation.result.semanticBasisUnavailableIds, [sourceEvidence.id])
  assert.equal(validation.validation.readiness.conversationalInterpretationActivationReady, false)

  const reportedValidation = buildZiweiHypothesisSubmissionValidation({
    handoffPackage: fixture.package,
    submission: makeSubmission(fixture.package, {
      sourceEvidence,
      userContext: {
        status: 'reported',
        entries: [{
          id: 'context-1',
          statement: 'synthetic user context supplied by the external consumer',
          relation: 'supports',
          hypothesisIds: ['ziwei-hypothesis-fixture-1'],
        }],
      },
    }),
  })
  assert.equal(reportedValidation.valid, true)
  assert.equal(reportedValidation.decision, 'blocked')
  assert.equal(reportedValidation.validation.readiness.userContextProvided, true)

  const directory = await mkdtemp(join(tmpdir(), 'ziwei-hypothesis-'))
  try {
    const path = join(directory, 'submission.json')
    await writeFile(path, exportZiweiHypothesisSubmissionJson(submission), 'utf8')
    const consumed = consumeZiweiHypothesisSubmission(await readFile(path, 'utf8'), { handoffPackage: fixture.package })
    assert.equal(consumed.valid, true)
    assert.equal(consumed.decision, 'blocked')
  } finally {
    await rm(directory, { recursive: true, force: true })
  }

  for (const state of ['declined', 'uncertain', 'confirmed']) {
    const request = makeAuthorizationRequest(validation.validation, state)
    const authorization = buildZiweiHypothesisDiscussionAuthorization({ handoffPackage: fixture.package, request })
    assert.equal(authorization.valid, true, authorization.errors.join('\n'))
    assert.equal(authorization.permission, 'reject')
    assert.equal(authorization.authorization.readiness.conversationalInterpretationActivationReady, false)
    assert.equal(authorization.authorization.decision.personalApplication, 'forbidden')
  }
})

test('cross-lineage source evidence cannot be submitted as a synthetic consensus', () => {
  const fixture = materialize()
  const evidence = fixture.package.evidenceConsumption.constitutionInput.evidence
  const minorSource = evidence.find(item => item.kind === 'literature_claim' && item.id === 'ziwei.source-observation.minor-stars')
  const submission = makeSubmission(fixture.package, { sourceEvidence: minorSource })
  const result = buildZiweiHypothesisSubmissionValidation({ handoffPackage: fixture.package, submission })
  assert.equal(result.valid, false)
  assert.ok(result.errors.includes('hypothesis_cross_lineage_synthesis_forbidden'))
})

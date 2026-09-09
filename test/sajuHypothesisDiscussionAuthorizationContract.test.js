import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import test from 'node:test'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import {
  buildDeterministicBase,
  projectDeterministicBaseForConsumer,
} from '../src/interpretationPrep/conversationFoundation.js'
import { prepareThreeSystemInterpretationData } from '../src/interpretationPrep/threeSystemPrepPipeline.js'
import {
  deriveSajuLineageSourceSemanticResults,
  deriveSajuLineageStructuralResults,
  deriveSajuSanmingSourceSemanticResults,
  deriveSajuSourceBoundedSemanticLexiconEntries,
  deriveSajuSourceLocalSemanticCompositions,
} from '../src/interpretationPrep/sajuLineageReadingGrammar.js'
import { buildSajuLineageHandoffEvidenceEnvelope } from '../src/interpretationPrep/sajuLineageHandoffEvidence.js'
import { buildSajuConversationalHandoffPackage } from '../src/interpretationPrep/sajuConversationalHandoffPackage.js'
import {
  buildSajuHypothesisSubmissionValidation,
} from '../src/interpretationPrep/sajuHypothesisSubmissionContract.js'
import {
  buildSajuHypothesisDiscussionAuthorization,
  consumeSajuHypothesisDiscussionAuthorizationRequest,
  exportSajuHypothesisDiscussionAuthorizationRequestJson,
  validateSajuHypothesisDiscussionAuthorization,
} from '../src/interpretationPrep/sajuHypothesisDiscussionAuthorizationContract.js'

const REAL_FIXTURE_INPUT = {
  subjectName: 'hypothesis-authorization-fixture',
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

const UNSAFE_STATUSES = new Set(['candidate', 'unverified', 'unsupported', 'blocked', 'unresolved', 'ambiguous', 'not_applicable'])
const clone = value => JSON.parse(JSON.stringify(value))
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const unique = values => [...new Set(values)]

function materializePackage(input = REAL_FIXTURE_INPUT, mutateBase = null) {
  const prepared = prepareThreeSystemInterpretationData(input)
  const base = projectDeterministicBaseForConsumer(buildDeterministicBase({
    subjectName: input.subjectName,
    result: prepared.result,
    unifiedContext: prepared.unifiedContext,
  }))
  if (mutateBase) mutateBase(base)
  const structuralResults = deriveSajuLineageStructuralResults(base)
  const semanticResults = {
    ziping: deriveSajuLineageSourceSemanticResults(base, structuralResults),
    sanming: deriveSajuSanmingSourceSemanticResults(base, structuralResults),
  }
  const envelopeBuild = buildSajuLineageHandoffEvidenceEnvelope({
    base,
    structuralResults,
    semanticResults,
    semanticLexiconResults: deriveSajuSourceBoundedSemanticLexiconEntries(base, structuralResults),
    compositionResults: deriveSajuSourceLocalSemanticCompositions(base),
  })
  assert.equal(envelopeBuild.valid, true)
  const packageBuild = buildSajuConversationalHandoffPackage({ base, envelope: envelopeBuild.envelope })
  assert.equal(packageBuild.valid, true)
  return { base, package: packageBuild.package }
}

function sourceScopeFor(items) {
  const lineages = []
  const sourceIds = []
  const locatorIds = []
  for (const item of items) {
    for (const lineage of item.lineages || []) if (!lineages.includes(lineage)) lineages.push(lineage)
    for (const sourceId of item.sourceRefs?.sourceIds || []) if (!sourceIds.includes(sourceId)) sourceIds.push(sourceId)
    for (const locatorId of item.sourceRefs?.locatorIds || []) if (!locatorIds.includes(locatorId)) locatorIds.push(locatorId)
  }
  return {
    mode: 'exact_referenced_source_scope',
    lineages,
    sourceIds,
    locatorIds,
    generalization: 'forbidden',
    crossLineage: 'forbidden',
  }
}

function makeSubmission(packageValue, {
  sourceItems,
  semanticBasisItems = sourceItems,
  userContextStatus = 'reported',
  userContextRelation = 'supports',
  assertionMode = 'user_context_comparison',
  submissionId = 'authorization-submission-fixture',
} = {}) {
  const evidence = packageValue.evidenceConsumption.constitutionInput.evidence
  const factRefs = unique(sourceItems.flatMap(item => item.factRefs || []))
  const baseFacts = evidence.filter(item => item.kind === 'base_fact' && item.factRefs?.some(ref => factRefs.includes(ref)))
  const selectedIds = new Set([...baseFacts.map(item => item.id), ...sourceItems.map(item => item.id)])
  const referencedEvidence = evidence.filter(item => selectedIds.has(item.id))
  const sourceEvidence = referencedEvidence.filter(item => item.kind === 'literature_claim')
  const conflicts = packageValue.evidenceConsumption.constitutionInput.conflicts
  const conflictEvidenceIds = new Set(sourceEvidence.filter(item => item.relation === 'conflicts').map(item => item.id))
  const conflictIds = conflicts.filter(conflict => conflict.evidenceIds?.some(id => conflictEvidenceIds.has(id))).map(conflict => conflict.id)
  const unresolvedEvidenceIds = sourceEvidence.filter(item => item.evidenceRole === 'lineage_state' || UNSAFE_STATUSES.has(item.status)).map(item => item.id)
  const hypothesisId = `${submissionId}.hypothesis`
  const userContext = userContextStatus === 'reported'
    ? {
        status: 'reported',
        entries: [{
          id: `${submissionId}.context`,
          statement: '사용자가 자신의 경험과 관련된 맥락을 직접 보고했다.',
          relation: userContextRelation,
          hypothesisIds: [hypothesisId],
        }],
      }
    : { status: 'not_provided', entries: [] }
  return {
    schemaVersion: 'saju-hypothesis-submission-v0',
    version: '0.1.0',
    kind: 'external_saju_hypothesis_submission',
    submissionId,
    userContext,
    hypothesis: {
      id: hypothesisId,
      statement: '포함된 source-bounded evidence와 사용자가 보고한 맥락의 관계를 잠정 가설로 대화에서 검토한다.',
      claimType: 'interpretation_hypothesis',
      status: 'hypothesis',
      userExperienceGate: 'required',
      factRefs,
      evidenceIds: referencedEvidence.map(item => item.id),
      semanticBasisIds: evidence.filter(item => new Set(semanticBasisItems.map(candidate => candidate.id)).has(item.id)).map(item => item.id),
      conflictIds,
      userContextIds: userContext.entries.map(entry => entry.id),
      sourceScope: sourceScopeFor(sourceEvidence),
      preservation: {
        unresolvedEvidenceIds,
        conflictIds,
      },
      assertion: {
        mode: 'tentative',
        subjectScope: 'source_bounded_evidence_and_explicit_user_context',
        applicationMode: assertionMode,
        personalConclusion: 'forbidden',
        unstatedPersonalAttributes: 'not_claimed',
      },
    },
  }
}

function findEvidence(packageValue, predicate) {
  const item = packageValue.evidenceConsumption.constitutionInput.evidence.find(predicate)
  assert.ok(item, 'expected evidence fixture is present')
  return item
}

function makeRequest(validation, {
  authorizationId = 'authorization-fixture',
  state = 'confirmed',
} = {}) {
  const hypothesisId = validation.submission.hypothesis.id
  return {
    schemaVersion: 'saju-hypothesis-discussion-authorization-request-v0',
    version: '0.1.0',
    kind: 'external_saju_hypothesis_discussion_authorization_request',
    authorizationId,
    hypothesisValidation: clone(validation),
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

function acceptedFixture() {
  const fixture = materializePackage()
  const semantic = findEvidence(fixture.package, item => item.evidenceRole === 'semantic_result' && item.status === 'available' && item.lineage === 'ziping_local_export')
  const composition = findEvidence(fixture.package, item => item.evidenceRole === 'composition_result' && item.status === 'available' && item.lineage === 'ziping_local_export')
  const submission = makeSubmission(fixture.package, {
    sourceItems: [semantic, composition],
    semanticBasisItems: [semantic, composition],
    submissionId: 'accepted-authorization',
  })
  const validationBuild = buildSajuHypothesisSubmissionValidation({ handoffPackage: fixture.package, submission })
  assert.equal(validationBuild.valid, true)
  assert.equal(validationBuild.decision, 'accepted_bounded_hypothesis')
  return { fixture, validation: validationBuild.validation }
}

test('fresh-file confirmed authorization permits one bounded hypothesis and keeps activation closed', async () => {
  const { fixture, validation } = acceptedFixture()
  const request = makeRequest(validation, { authorizationId: 'fresh-confirmed-authorization' })
  const directory = await mkdtemp(join(tmpdir(), 'saju-hypothesis-authorization-'))
  const filePath = join(directory, 'authorization-request.json')
  try {
    const serialized = exportSajuHypothesisDiscussionAuthorizationRequestJson(request)
    await writeFile(filePath, serialized, 'utf8')
    const freshBytes = await readFile(filePath)
    const consumed = consumeSajuHypothesisDiscussionAuthorizationRequest(freshBytes.toString('utf8'), { handoffPackage: fixture.package })
    assert.equal(consumed.valid, true)
    assert.deepEqual(consumed.errors, [])
    assert.equal(consumed.permission, 'discussion_allowed')
    assert.equal(consumed.authorization.decision.permission, 'discussion_allowed')
    assert.equal(consumed.authorization.decision.personalApplication, 'bounded_user_context_comparison_only')
    assert.deepEqual(consumed.authorization.scope.hypothesisIds, [validation.submission.hypothesis.id])
    assert.deepEqual(consumed.authorization.scope.otherHypothesisIds, [])
    assert.deepEqual(consumed.authorization.scope.factRefs, validation.result.factRefs)
    assert.deepEqual(consumed.authorization.scope.sourceScope, validation.result.sourceScope)
    assert.deepEqual(consumed.authorization.preservation.unresolvedEvidenceIds, validation.result.unresolvedEvidenceIds)
    assert.deepEqual(consumed.authorization.preservation.conflictIds, validation.result.conflictIds)
    assert.equal(consumed.authorization.boundary.noOtherHypotheses, true)
    assert.equal(consumed.authorization.boundary.noPersonalityTraits, true)
    assert.equal(consumed.authorization.boundary.noDefinitivePersonalization, true)
    assert.equal(consumed.authorization.boundary.noCrossLineageSynthesis, true)
    assert.equal(consumed.authorization.boundary.activationMutation, 'forbidden')
    assert.equal(consumed.authorization.readiness.safeBoundedConsumerReady, true)
    assert.equal(consumed.authorization.readiness.boundedDiscussionAllowed, true)
    assert.equal(consumed.authorization.readiness.personalApplicationReady, false)
    assert.equal(consumed.authorization.readiness.conversationalInterpretationActivationReady, false)
    assert.equal(consumed.authorization.readiness.globalActivationPromotion, false)
    assert.ok(consumed.authorization.decision.forbiddenUses.includes('expand_to_other_hypotheses'))
    assert.ok(consumed.authorization.decision.forbiddenUses.includes('state_definitive_personal_conclusion'))
    assert.equal(exportSajuHypothesisDiscussionAuthorizationRequestJson(consumed.authorization.request), freshBytes.toString('utf8'))
    assert.equal(sha256(freshBytes), sha256(Buffer.from(serialized, 'utf8')))

    const outputValidation = validateSajuHypothesisDiscussionAuthorization(consumed.authorization, { handoffPackage: fixture.package })
    assert.equal(outputValidation.valid, true)
    assert.deepEqual(outputValidation.errors, [])
    assert.equal(typeof consumed.authorization.storeUserResponse, 'undefined')
    assert.equal(typeof consumed.authorization.classifyUserResponse, 'undefined')
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

test('declined, uncertain, and confirmed states authorize only their bounded per-hypothesis scope', () => {
  const fixture = materializePackage()
  const semantic = findEvidence(fixture.package, item => item.evidenceRole === 'semantic_result' && item.status === 'available' && item.lineage === 'ziping_local_export')
  const submission = makeSubmission(fixture.package, {
    sourceItems: [semantic],
    semanticBasisItems: [semantic],
    userContextStatus: 'not_provided',
    submissionId: 'state-matrix-authorization',
  })
  const validationBuild = buildSajuHypothesisSubmissionValidation({ handoffPackage: fixture.package, submission })
  assert.equal(validationBuild.valid, true)
  assert.equal(validationBuild.decision, 'requires_user_confirmation')

  const confirmed = buildSajuHypothesisDiscussionAuthorization({
    handoffPackage: fixture.package,
    request: makeRequest(validationBuild.validation, { authorizationId: 'state-confirmed', state: 'confirmed' }),
  })
  assert.equal(confirmed.valid, true)
  assert.equal(confirmed.permission, 'discussion_allowed')
  assert.equal(confirmed.authorization.decision.reason, 'explicit_user_confirmation_for_bounded_hypothesis')
  assert.equal(confirmed.authorization.readiness.personalApplicationReady, false)

  const uncertain = buildSajuHypothesisDiscussionAuthorization({
    handoffPackage: fixture.package,
    request: makeRequest(validationBuild.validation, { authorizationId: 'state-uncertain', state: 'uncertain' }),
  })
  assert.equal(uncertain.valid, true)
  assert.equal(uncertain.permission, 'explore_only')
  assert.equal(uncertain.authorization.decision.personalApplication, 'forbidden')
  assert.equal(uncertain.authorization.readiness.exploreOnly, true)
  assert.ok(uncertain.authorization.readiness.blockers.includes('user_confirmation_uncertain'))
  assert.ok(uncertain.authorization.decision.allowedUses.includes('explore_this_hypothesis_without_personal_application'))

  const declined = buildSajuHypothesisDiscussionAuthorization({
    handoffPackage: fixture.package,
    request: makeRequest(validationBuild.validation, { authorizationId: 'state-declined', state: 'declined' }),
  })
  assert.equal(declined.valid, true)
  assert.equal(declined.permission, 'reject')
  assert.equal(declined.authorization.readiness.hypothesisUsable, false)
  assert.ok(declined.authorization.readiness.blockers.includes('user_confirmation_declined'))
  assert.ok(declined.authorization.decision.forbiddenUses.includes('discuss_rejected_hypothesis_as_usable'))
})

test('confirmed state cannot resolve preserved lineage conflict or unresolved evidence', () => {
  const fixture = materializePackage({ ...REAL_FIXTURE_INPUT, subjectName: 'authorization-conflict-fixture' }, base => {
    base.systems.saju.fact.seasonContext = { season: 'spring', solarTerm: 'explicit-test-context' }
  })
  const semantic = findEvidence(fixture.package, item => item.evidenceRole === 'semantic_result' && item.status === 'available' && item.lineage === 'ziping_local_export')
  const conflict = findEvidence(fixture.package, item => item.relation === 'conflicts')
  const submission = makeSubmission(fixture.package, {
    sourceItems: [semantic, conflict],
    semanticBasisItems: [semantic],
    submissionId: 'preserved-boundary-authorization',
  })
  const validationBuild = buildSajuHypothesisSubmissionValidation({ handoffPackage: fixture.package, submission })
  assert.equal(validationBuild.valid, true)
  assert.equal(validationBuild.decision, 'requires_user_confirmation')
  assert.ok(validationBuild.validation.result.unresolvedEvidenceIds.includes(conflict.id))
  assert.equal(validationBuild.validation.result.conflictState, 'preserved_tension')

  const authorized = buildSajuHypothesisDiscussionAuthorization({
    handoffPackage: fixture.package,
    request: makeRequest(validationBuild.validation, { authorizationId: 'confirmed-preserved-boundary', state: 'confirmed' }),
  })
  assert.equal(authorized.valid, true)
  assert.equal(authorized.permission, 'explore_only')
  assert.equal(authorized.authorization.decision.personalApplication, 'forbidden')
  assert.deepEqual(authorized.authorization.preservation.unresolvedEvidenceIds, validationBuild.validation.result.unresolvedEvidenceIds)
  assert.deepEqual(authorized.authorization.preservation.conflictIds, validationBuild.validation.result.conflictIds)
  assert.equal(authorized.authorization.preservation.conflictState, 'preserved_tension')
  assert.ok(authorized.authorization.decision.forbiddenUses.includes('resolve_or_hide_unresolved_or_conflict_state'))
  assert.ok(authorized.authorization.decision.forbiddenUses.includes('treat_confirmation_as_resolution_of_preserved_boundary'))
  assert.equal(authorized.authorization.readiness.conversationalInterpretationActivationReady, false)
})

test('scope expansion, arbitrary confirmation, and activation promotion attempts fail closed', () => {
  const { fixture, validation } = acceptedFixture()
  const baseline = makeRequest(validation, { authorizationId: 'conformance-baseline' })
  const consume = request => consumeSajuHypothesisDiscussionAuthorizationRequest(JSON.stringify(request), { handoffPackage: fixture.package })

  const otherHypothesis = clone(baseline)
  otherHypothesis.requestedUse.otherHypotheses = 'allowed'
  const rejectedOther = consume(otherHypothesis)
  assert.equal(rejectedOther.valid, false)
  assert.equal(rejectedOther.permission, 'reject')
  assert.ok(rejectedOther.errors.includes('requested_use:other_hypotheses_not_forbidden'))

  const hypothesisScope = clone(baseline)
  hypothesisScope.requestedUse.hypothesisId = 'other-hypothesis'
  const rejectedScope = consume(hypothesisScope)
  assert.equal(rejectedScope.valid, false)
  assert.ok(rejectedScope.errors.includes('requested_use:hypothesis_id_mismatch'))

  const personalScope = clone(baseline)
  personalScope.requestedUse.personalApplication = 'definitive_personalization'
  const rejectedPersonal = consume(personalScope)
  assert.equal(rejectedPersonal.valid, false)
  assert.ok(rejectedPersonal.errors.includes('requested_use:personal_application_scope_invalid'))

  const activation = clone(baseline)
  activation.requestedUse.globalActivation = 'allowed'
  const rejectedActivation = consume(activation)
  assert.equal(rejectedActivation.valid, false)
  assert.ok(rejectedActivation.errors.includes('requested_use:global_activation_not_forbidden'))

  const confirmationScope = clone(baseline)
  confirmationScope.userConfirmation.hypothesisId = 'other-hypothesis'
  const rejectedConfirmation = consume(confirmationScope)
  assert.equal(rejectedConfirmation.valid, false)
  assert.ok(rejectedConfirmation.errors.includes('user_confirmation:hypothesis_id_mismatch'))

  const staleValidation = clone(baseline)
  staleValidation.hypothesisValidation.result.hypothesisId = 'other-hypothesis'
  const rejectedStale = consume(staleValidation)
  assert.equal(rejectedStale.valid, false)
  assert.ok(rejectedStale.errors.includes('hypothesis_validation:not_current_or_tampered'))

  const outputTampered = buildSajuHypothesisDiscussionAuthorization({ handoffPackage: fixture.package, request: baseline })
  assert.equal(outputTampered.valid, true)
  outputTampered.authorization.scope.hypothesisIds.push('other-hypothesis')
  const rejectedOutputScope = validateSajuHypothesisDiscussionAuthorization(outputTampered.authorization, { handoffPackage: fixture.package })
  assert.equal(rejectedOutputScope.valid, false)
  assert.ok(rejectedOutputScope.errors.includes('authorization_not_bound_to_current_request'))

  const outputActivation = buildSajuHypothesisDiscussionAuthorization({ handoffPackage: fixture.package, request: baseline })
  outputActivation.authorization.readiness.conversationalInterpretationActivationReady = true
  const rejectedOutputActivation = validateSajuHypothesisDiscussionAuthorization(outputActivation.authorization, { handoffPackage: fixture.package })
  assert.equal(rejectedOutputActivation.valid, false)
  assert.ok(rejectedOutputActivation.errors.includes('authorization_not_bound_to_current_request'))

  const structural = findEvidence(fixture.package, item => item.evidenceRole === 'structural_result' && item.status === 'structural_result' && item.lineage === 'yuanhai_local_export')
  const blockedSubmission = makeSubmission(fixture.package, {
    sourceItems: [structural],
    semanticBasisItems: [],
    submissionId: 'blocked-basis-authorization',
  })
  const blockedValidation = buildSajuHypothesisSubmissionValidation({ handoffPackage: fixture.package, submission: blockedSubmission })
  assert.equal(blockedValidation.valid, true)
  assert.equal(blockedValidation.decision, 'blocked')
  const blockedByBasis = buildSajuHypothesisDiscussionAuthorization({
    handoffPackage: fixture.package,
    request: makeRequest(blockedValidation.validation, { authorizationId: 'blocked-confirmed', state: 'confirmed' }),
  })
  assert.equal(blockedByBasis.valid, true)
  assert.equal(blockedByBasis.permission, 'reject')
  assert.equal(blockedByBasis.authorization.decision.reason, 'hypothesis_validation_blocked')
  assert.equal(blockedByBasis.authorization.readiness.hypothesisUsable, false)

  const malformed = consume(baseline)
  assert.equal(malformed.valid, true)
  const invalidJson = consumeSajuHypothesisDiscussionAuthorizationRequest('{not-json}', { handoffPackage: fixture.package })
  assert.equal(invalidJson.valid, false)
  assert.equal(invalidJson.permission, 'reject')
  assert.ok(invalidJson.errors.includes('request_json_invalid'))
})

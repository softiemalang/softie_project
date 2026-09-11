import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import test from 'node:test'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { deriveAstrologyRuleChart } from '../src/astrology/astrologyRuleCore.js'
import {
  PTOLEMY_LINEAGE_ID,
  PTOLEMY_SOURCE_ID,
  deriveAstrologySourceBoundedGrammar,
} from '../src/astrology/astrologySourceBoundedGrammar.js'
import {
  buildAstrologyWesternEvidenceEnvelope,
} from '../src/interpretationPrep/astrologyWesternEvidenceHandoff.js'
import {
  buildAstrologyWesternConversationalHandoffPackage,
  consumeAstrologyWesternConversationalHandoffPackage,
  exportAstrologyWesternConversationalHandoffPackageJson,
  validateAstrologyWesternConversationalHandoffPackage,
} from '../src/interpretationPrep/astrologyWesternConversationalHandoffPackage.js'
import {
  buildAstrologyWesternEvidenceConsumptionContract,
  consumeAstrologyWesternEvidenceConsumptionContract,
  exportAstrologyWesternEvidenceConsumptionContractJson,
} from '../src/interpretationPrep/astrologyWesternEvidenceConsumptionContract.js'
import {
  buildAstrologyWesternHypothesisSubmissionValidation,
  consumeAstrologyWesternHypothesisSubmission,
  exportAstrologyWesternHypothesisSubmissionJson,
} from '../src/interpretationPrep/astrologyWesternHypothesisSubmissionContract.js'
import {
  buildAstrologyWesternHypothesisDiscussionAuthorization,
  consumeAstrologyWesternHypothesisDiscussionAuthorizationRequest,
  validateAstrologyWesternHypothesisDiscussionAuthorization,
} from '../src/interpretationPrep/astrologyWesternHypothesisDiscussionAuthorizationContract.js'

const SOURCE_FIXTURE = {
  candidateId: 'western-source-bounded-conversation-fixture-v0',
  zodiac: 'tropical',
  referenceFrame: 'geocentric',
  coordinateBasis: 'ecliptic-of-date',
  bodies: [
    { id: 'sun', longitudeDegrees: 0, longitudeSpeedDegreesPerDay: 0.9 },
    { id: 'moon', longitudeDegrees: 120, longitudeSpeedDegreesPerDay: 13 },
    { id: 'mercury', longitudeDegrees: 30, longitudeSpeedDegreesPerDay: 1 },
    { id: 'venus', longitudeDegrees: 60, longitudeSpeedDegreesPerDay: 1.2 },
    { id: 'mars', longitudeDegrees: 90, longitudeSpeedDegreesPerDay: 0.5 },
    { id: 'jupiter', longitudeDegrees: 180, longitudeSpeedDegreesPerDay: 0.1 },
    { id: 'saturn', longitudeDegrees: 210, longitudeSpeedDegreesPerDay: 0.05 },
    { id: 'uranus', longitudeDegrees: 150, longitudeSpeedDegreesPerDay: 0.02 },
    { id: 'neptune', longitudeDegrees: 87, longitudeSpeedDegreesPerDay: 0.01 },
    { id: 'pluto', longitudeDegrees: 300, longitudeSpeedDegreesPerDay: 0.01 },
  ],
  angles: {
    ascendant: { longitudeDegrees: 0 },
    midheaven: { longitudeDegrees: 90 },
  },
}

const PACKET_FIXTURE = {
  schemaVersion: 'astrology-interpretation-packet-v1',
  packetVersion: '1.0.0',
  packetStatus: 'complete',
  packetContentSha256: '1'.repeat(64),
  identities: {
    providerBundleSha256: '2'.repeat(64),
    rawChartSha256: '3'.repeat(64),
    ruleChartSha256: '4'.repeat(64),
  },
}

const BASE_FIXTURE = {
  schemaVersion: 'tri-system-deterministic-base-v0',
  foundationVersion: 'deterministic-base-v0',
  normalizedInput: { fixture: 'western-source-bounded-conversation' },
  systems: { astrology: { fact: { fixture: 'western-source-bounded-conversation' } } },
  consumerBoundary: {
    factScope: 'verified_claims_only',
    omittedClaims: 'not_provided_as_facts',
    interpretation: 'separate_fact_from_interpretation_and_confirm_personal_context',
  },
}

function clone(value) {
  return structuredClone(value)
}

function makeFixture() {
  const ruleChart = deriveAstrologyRuleChart(SOURCE_FIXTURE)
  const grammar = deriveAstrologySourceBoundedGrammar({ ruleChart })
  const envelopeBuild = buildAstrologyWesternEvidenceEnvelope({
    packet: PACKET_FIXTURE,
    grammarResult: grammar,
    baseFactRefs: ['systems.astrology.fact.fixture'],
  })
  assert.equal(envelopeBuild.valid, true)
  const packageBuild = buildAstrologyWesternConversationalHandoffPackage({
    base: BASE_FIXTURE,
    envelope: envelopeBuild.envelope,
  })
  assert.equal(packageBuild.valid, true)
  return { ruleChart, grammar, envelope: envelopeBuild.envelope, package: packageBuild.package }
}

function evidence(packageValue, predicate) {
  const item = packageValue.evidenceConsumption.constitutionInput.evidence.find(predicate)
  assert.ok(item, 'expected evidence item is present')
  return item
}

function sourceScopeFor(sourceItems) {
  const lineages = []
  const sourceIds = []
  const locatorIds = []
  for (const item of sourceItems) {
    for (const ref of item.sourceRefs || []) {
      if (ref.lineageId && !lineages.includes(ref.lineageId)) lineages.push(ref.lineageId)
      if (ref.sourceId && !sourceIds.includes(ref.sourceId)) sourceIds.push(ref.sourceId)
      if (ref.locatorId && !locatorIds.includes(ref.locatorId)) locatorIds.push(ref.locatorId)
    }
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
  submissionId = 'astrology-conversation-fixture',
} = {}) {
  const constitutionEvidence = packageValue.evidenceConsumption.constitutionInput.evidence
  const baseFact = evidence(packageValue, item => item.kind === 'base_fact')
  const selectedSourceIds = new Set(sourceItems.map(item => item.id))
  const selectedEvidence = constitutionEvidence.filter(item => item.id === baseFact.id || selectedSourceIds.has(item.id))
  const hypothesisId = `${submissionId}.hypothesis`
  const context = userContextStatus === 'reported'
    ? {
        status: 'reported',
        entries: [{
          id: `${submissionId}.context`,
          statement: '사용자가 특정 경험과 질문의 맥락을 직접 보고했다.',
          relation: userContextRelation,
          hypothesisIds: [hypothesisId],
        }],
      }
    : { status: 'not_provided', entries: [] }
  const unsafe = selectedEvidence.filter(item => item.kind === 'literature_claim' && ['candidate', 'unverified', 'unsupported', 'blocked', 'unresolved', 'ambiguous', 'not_applicable'].includes(item.status)).map(item => item.id)
  const conflictEvidenceIds = new Set(selectedEvidence.filter(item => item.relation === 'conflicts' || item.status === 'conflict').map(item => item.id))
  const conflictIds = packageValue.evidenceConsumption.constitutionInput.conflicts
    .filter(item => item.evidenceIds?.some(id => conflictEvidenceIds.has(id)))
    .map(item => item.id)
  return {
    schemaVersion: 'astrology-western-hypothesis-submission-v0',
    version: '0.1.0',
    kind: 'external_astrology_western_hypothesis_submission',
    submissionId,
    userContext: context,
    hypothesis: {
      id: hypothesisId,
      statement: '포함된 동일 lineage source evidence와 명시된 사용자 맥락의 관계를 잠정 가설로만 검토한다.',
      claimType: 'interpretation_hypothesis',
      status: 'hypothesis',
      userExperienceGate: 'required',
      factRefs: baseFact.factRefs,
      evidenceIds: selectedEvidence.map(item => item.id),
      semanticBasisIds: selectedEvidence.filter(item => semanticBasisItems.some(candidate => candidate.id === item.id)).map(item => item.id),
      conflictIds,
      userContextIds: context.entries.map(entry => entry.id),
      sourceScope: sourceScopeFor(sourceItems),
      preservation: {
        unresolvedEvidenceIds: unsafe,
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

function makeAuthorizationRequest(validation, { authorizationId, state = 'confirmed' } = {}) {
  const hypothesisId = validation.submission.hypothesis.id
  return {
    schemaVersion: 'astrology-western-hypothesis-discussion-authorization-request-v0',
    version: '0.1.0',
    kind: 'external_astrology_western_hypothesis_discussion_authorization_request',
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

test('Astrology consumption contract keeps FACT, source evidence, composition, unsupported, unresolved, and conflict lanes distinct', async () => {
  const fixture = makeFixture()
  const built = buildAstrologyWesternEvidenceConsumptionContract({ base: BASE_FIXTURE, envelope: fixture.envelope })
  assert.equal(built.valid, true)
  const contract = built.contract
  assert.equal(contract.boundary.factsAndSourceEvidenceSeparate, true)
  assert.equal(contract.readiness.boundedEvidenceConsumptionReady, true)
  assert.equal(contract.readiness.hypothesisSubmissionValidationAvailable, true)
  assert.equal(contract.readiness.conversationalInterpretationActivationReady, false)

  assert.equal(contract.consumptionGuidance.entries.find(item => item.evidenceKind === 'base_fact').evidenceClass, 'fact')
  assert.ok(contract.consumptionGuidance.entries.some(item => item.evidenceClass === 'literature_evidence' && item.evidenceRole === 'source_semantic_result'))
  assert.ok(contract.consumptionGuidance.entries.some(item => item.evidenceClass === 'source_local_composition' && item.status === 'available'))
  assert.ok(contract.consumptionGuidance.entries.some(item => item.evidenceClass === 'unresolved'))
  assert.ok(contract.consumptionGuidance.entries.some(item => item.evidenceClass === 'unsupported'))
  assert.ok(contract.consumptionGuidance.entries.some(item => item.evidenceClass === 'conflict'))
  const factGuidance = contract.consumptionGuidance.entries.find(item => item.evidenceClass === 'fact')
  assert.equal(factGuidance.permission.hypothesisProposal, 'not_allowed_from_fact_presence')
  const sourceGuidance = contract.consumptionGuidance.entries.find(item => item.evidenceRole === 'source_semantic_result' && item.status === 'available')
  assert.equal(sourceGuidance.permission.sourceBoundedExplanation, true)
  assert.ok(sourceGuidance.permission.forbiddenUses.includes('promote_source_claim_to_base_fact'))
  assert.equal(contract.handoffEvidence.activation.availableForInterpretation, false)

  const directory = await mkdtemp(join(tmpdir(), 'astrology-western-consumption-'))
  const filePath = join(directory, 'consumption.json')
  try {
    const serialized = exportAstrologyWesternEvidenceConsumptionContractJson(contract)
    await writeFile(filePath, serialized, 'utf8')
    const freshText = await readFile(filePath, 'utf8')
    const fresh = consumeAstrologyWesternEvidenceConsumptionContract(freshText, { base: BASE_FIXTURE })
    assert.equal(fresh.valid, true)
    assert.deepEqual(fresh.errors, [])
    assert.deepEqual(fresh.contract, JSON.parse(freshText))
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

test('canonical Astrology conversational package survives fresh-file reconsumption without opening activation', async () => {
  const fixture = makeFixture()
  const packageValue = fixture.package
  assert.deepEqual(validateAstrologyWesternConversationalHandoffPackage(packageValue, { base: BASE_FIXTURE }).errors, [])
  assert.equal(packageValue.boundary.noResponseStorage, true)
  assert.equal(packageValue.boundary.noConversationFlowImplementation, true)
  assert.equal(packageValue.readiness.sourceBoundedEvidenceHandoff, 'ready_source_bounded')
  assert.equal(packageValue.readiness.interpretationHypothesisLayer, 'contract_available_not_activated')
  assert.equal(packageValue.readiness.activation, 'blocked')
  assert.ok(packageValue.evidenceConsumption.consumptionGuidance.modelPolicy.conversationLayerResponsibility.includes('outside'))

  const directory = await mkdtemp(join(tmpdir(), 'astrology-western-package-'))
  const filePath = join(directory, 'package.json')
  try {
    const serialized = exportAstrologyWesternConversationalHandoffPackageJson(packageValue)
    await writeFile(filePath, serialized, 'utf8')
    const fresh = consumeAstrologyWesternConversationalHandoffPackage((await readFile(filePath)).toString('utf8'), { base: BASE_FIXTURE })
    assert.equal(fresh.valid, true)
    assert.deepEqual(fresh.errors, [])
    assert.deepEqual(fresh.package, JSON.parse(serialized))
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

test('bounded hypothesis validation accepts only explicit same-lineage source evidence and preserves boundaries', async () => {
  const fixture = makeFixture()
  const source = evidence(fixture.package, item => item.evidenceRole === 'source_semantic_result' && item.status === 'available')
  const submission = makeSubmission(fixture.package, {
    sourceItems: [source],
    semanticBasisItems: [source],
    submissionId: 'accepted-astrology-hypothesis',
  })
  const built = buildAstrologyWesternHypothesisSubmissionValidation({ handoffPackage: fixture.package, submission })
  assert.equal(built.valid, true)
  assert.equal(built.decision, 'accepted_bounded_hypothesis')
  assert.equal(built.validation.result.constitutionDecision, 'hypothesis_only')
  assert.deepEqual(built.validation.result.sourceScope, {
    mode: 'exact_referenced_source_scope',
    lineages: [PTOLEMY_LINEAGE_ID],
    sourceIds: [PTOLEMY_SOURCE_ID],
    locatorIds: [source.sourceRefs[0].locatorId],
    generalization: 'forbidden',
    crossLineage: 'forbidden',
  })
  assert.equal(built.validation.result.definitivePersonalization, false)
  assert.equal(built.validation.readiness.conversationalInterpretationActivationReady, false)

  const directory = await mkdtemp(join(tmpdir(), 'astrology-western-hypothesis-'))
  const filePath = join(directory, 'submission.json')
  try {
    const serialized = exportAstrologyWesternHypothesisSubmissionJson(submission)
    await writeFile(filePath, serialized, 'utf8')
    const fresh = consumeAstrologyWesternHypothesisSubmission((await readFile(filePath)).toString('utf8'), { handoffPackage: fixture.package })
    assert.equal(fresh.valid, true)
    assert.equal(fresh.decision, 'accepted_bounded_hypothesis')
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

test('missing context, unresolved evidence, and source conflict remain deferred rather than promoted', () => {
  const fixture = makeFixture()
  const source = evidence(fixture.package, item => item.evidenceRole === 'source_semantic_result' && item.status === 'available')
  const unresolved = evidence(fixture.package, item => item.status === 'unresolved')
  const conflict = evidence(fixture.package, item => item.status === 'conflict')
  const withoutContext = makeSubmission(fixture.package, {
    sourceItems: [source],
    semanticBasisItems: [source],
    userContextStatus: 'not_provided',
    submissionId: 'missing-context-astrology-hypothesis',
  })
  const contextResult = buildAstrologyWesternHypothesisSubmissionValidation({ handoffPackage: fixture.package, submission: withoutContext })
  assert.equal(contextResult.valid, true)
  assert.equal(contextResult.decision, 'requires_user_confirmation')

  const withUnresolved = makeSubmission(fixture.package, {
    sourceItems: [source, unresolved],
    semanticBasisItems: [source],
    submissionId: 'unresolved-astrology-hypothesis',
  })
  const unresolvedResult = buildAstrologyWesternHypothesisSubmissionValidation({ handoffPackage: fixture.package, submission: withUnresolved })
  assert.equal(unresolvedResult.valid, true)
  assert.equal(unresolvedResult.decision, 'requires_user_confirmation')
  assert.deepEqual(unresolvedResult.validation.result.unresolvedEvidenceIds, [unresolved.id])

  const withConflict = makeSubmission(fixture.package, {
    sourceItems: [source, conflict],
    semanticBasisItems: [source],
    submissionId: 'conflict-astrology-hypothesis',
  })
  const conflictResult = buildAstrologyWesternHypothesisSubmissionValidation({ handoffPackage: fixture.package, submission: withConflict })
  assert.equal(conflictResult.valid, true)
  assert.equal(conflictResult.decision, 'requires_user_confirmation')
  assert.equal(conflictResult.validation.result.conflictState, 'preserved_tension')
  assert.equal(conflictResult.validation.result.conflictIds.length, 1)
})

test('unsupported, cross-lineage, missing provenance, and tampered submissions fail closed', () => {
  const fixture = makeFixture()
  const source = evidence(fixture.package, item => item.evidenceRole === 'source_semantic_result' && item.status === 'available')
  const unsupported = evidence(fixture.package, item => item.status === 'unsupported')
  const baseline = makeSubmission(fixture.package, {
    sourceItems: [source],
    semanticBasisItems: [source],
    submissionId: 'negative-astrology-hypothesis',
  })

  const unsupportedBasis = clone(baseline)
  unsupportedBasis.hypothesis.evidenceIds.push(unsupported.id)
  unsupportedBasis.hypothesis.semanticBasisIds = [unsupported.id]
  unsupportedBasis.hypothesis.sourceScope = sourceScopeFor([source, unsupported])
  unsupportedBasis.hypothesis.preservation.unresolvedEvidenceIds = [unsupported.id]
  const rejectedUnsupported = buildAstrologyWesternHypothesisSubmissionValidation({ handoffPackage: fixture.package, submission: unsupportedBasis })
  assert.equal(rejectedUnsupported.valid, false)
  assert.ok(rejectedUnsupported.errors.some(error => error.includes('semantic_basis_not_available')))

  const crossLineage = clone(baseline)
  crossLineage.hypothesis.sourceScope.lineages.push('western-early-modern-lilly')
  crossLineage.hypothesis.sourceScope.sourceIds.push('western-source-lilly-christian-astrology')
  const rejectedCrossLineage = buildAstrologyWesternHypothesisSubmissionValidation({ handoffPackage: fixture.package, submission: crossLineage })
  assert.equal(rejectedCrossLineage.valid, false)
  assert.ok(rejectedCrossLineage.errors.includes('hypothesis:source_scope_lineages_mismatch'))

  const missingLocator = clone(baseline)
  missingLocator.hypothesis.sourceScope.locatorIds = []
  const rejectedMissingLocator = buildAstrologyWesternHypothesisSubmissionValidation({ handoffPackage: fixture.package, submission: missingLocator })
  assert.equal(rejectedMissingLocator.valid, false)
  assert.ok(rejectedMissingLocator.errors.includes('hypothesis:source_scope_locators_mismatch'))

  const tamperedPackage = clone(fixture.package)
  tamperedPackage.evidenceConsumption.consumptionGuidance.entries[0].semanticBasisEligible = true
  const rejectedTamperedPackage = buildAstrologyWesternHypothesisSubmissionValidation({ handoffPackage: tamperedPackage, submission: baseline })
  assert.equal(rejectedTamperedPackage.valid, false)
  assert.ok(rejectedTamperedPackage.errors.some(error => error.includes('handoff:consumption:guidance_not_bound_to_evidence')))

  const promotedPackage = clone(fixture.package)
  promotedPackage.readiness.conversationalInterpretationActivationReady = true
  const rejectedPromotedPackage = buildAstrologyWesternHypothesisSubmissionValidation({ handoffPackage: promotedPackage, submission: baseline })
  assert.equal(rejectedPromotedPackage.valid, false)
  assert.ok(rejectedPromotedPackage.errors.some(error => error.includes('handoff:package_readiness_invalid')))
})

test('per-hypothesis discussion authorization maps confirmation state to bounded permission and never opens activation', () => {
  const fixture = makeFixture()
  const source = evidence(fixture.package, item => item.evidenceRole === 'source_semantic_result' && item.status === 'available')
  const submission = makeSubmission(fixture.package, {
    sourceItems: [source],
    semanticBasisItems: [source],
    submissionId: 'authorization-astrology-hypothesis',
  })
  const validation = buildAstrologyWesternHypothesisSubmissionValidation({ handoffPackage: fixture.package, submission })
  assert.equal(validation.valid, true)
  assert.equal(validation.decision, 'accepted_bounded_hypothesis')

  const confirmed = buildAstrologyWesternHypothesisDiscussionAuthorization({
    handoffPackage: fixture.package,
    request: makeAuthorizationRequest(validation.validation, { authorizationId: 'confirmed-astrology', state: 'confirmed' }),
  })
  assert.equal(confirmed.valid, true)
  assert.equal(confirmed.permission, 'discussion_allowed')
  assert.equal(confirmed.authorization.scope.hypothesisIds.length, 1)
  assert.deepEqual(confirmed.authorization.scope.otherHypothesisIds, [])
  assert.equal(confirmed.authorization.readiness.personalApplicationReady, false)
  assert.equal(confirmed.authorization.readiness.conversationalInterpretationActivationReady, false)
  assert.equal(confirmed.authorization.boundary.activationMutation, 'forbidden')
  assert.equal(typeof confirmed.authorization.storeUserResponse, 'undefined')

  const uncertain = buildAstrologyWesternHypothesisDiscussionAuthorization({
    handoffPackage: fixture.package,
    request: makeAuthorizationRequest(validation.validation, { authorizationId: 'uncertain-astrology', state: 'uncertain' }),
  })
  assert.equal(uncertain.valid, true)
  assert.equal(uncertain.permission, 'explore_only')
  assert.equal(uncertain.authorization.decision.personalApplication, 'forbidden')

  const declined = buildAstrologyWesternHypothesisDiscussionAuthorization({
    handoffPackage: fixture.package,
    request: makeAuthorizationRequest(validation.validation, { authorizationId: 'declined-astrology', state: 'declined' }),
  })
  assert.equal(declined.valid, true)
  assert.equal(declined.permission, 'reject')

  const tamperedRequest = makeAuthorizationRequest(validation.validation, { authorizationId: 'tampered-astrology', state: 'confirmed' })
  tamperedRequest.requestedUse.otherHypotheses = 'allowed'
  const rejectedScope = consumeAstrologyWesternHypothesisDiscussionAuthorizationRequest(JSON.stringify(tamperedRequest), { handoffPackage: fixture.package })
  assert.equal(rejectedScope.valid, false)
  assert.ok(rejectedScope.errors.includes('requested_use:other_hypotheses_not_forbidden'))

  const outputValidation = validateAstrologyWesternHypothesisDiscussionAuthorization(confirmed.authorization, { handoffPackage: fixture.package })
  assert.equal(outputValidation.valid, true)
  const tamperedOutput = clone(confirmed.authorization)
  tamperedOutput.scope.otherHypothesisIds.push('other-hypothesis')
  const rejectedOutput = validateAstrologyWesternHypothesisDiscussionAuthorization(tamperedOutput, { handoffPackage: fixture.package })
  assert.equal(rejectedOutput.valid, false)
  assert.ok(rejectedOutput.errors.includes('authorization_not_bound_to_current_request'))
})

test('Ptolemy and Lilly boundaries remain source-local and outer-planet/personal synthesis stays blocked', () => {
  const fixture = makeFixture()
  assert.equal(fixture.grammar.lineageIds.length, 1)
  assert.equal(fixture.grammar.lineageIds[0], PTOLEMY_LINEAGE_ID)
  assert.ok(fixture.grammar.candidates.some(item => item.candidateId === 'candidate.ptolemy.familiarity-composition.v0'))
  assert.ok(fixture.grammar.candidates.some(item => item.candidateId === 'candidate.ptolemy.application-separation.v0'))
  assert.ok(fixture.grammar.candidates.some(item => item.candidateId === 'candidate.lilly.primary-text-lineage.v0'))
  assert.ok(fixture.grammar.unsupported.some(item => item.featureId === 'western.outer_planet_semantics'))
  assert.ok(fixture.package.evidenceConsumption.consumptionGuidance.modelPolicy.personalApplication.includes('personality'))
  assert.equal(fixture.package.readiness.activation, 'blocked')
  assert.equal(fixture.package.readiness.conversationalInterpretationActivationReady, false)
})

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
  consumeSajuHypothesisSubmission,
  exportSajuHypothesisSubmissionJson,
} from '../src/interpretationPrep/sajuHypothesisSubmissionContract.js'

const REAL_FIXTURE_INPUT = {
  subjectName: 'hypothesis-submission-fixture',
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
  submissionId = 'submission-fixture',
} = {}) {
  const evidence = packageValue.evidenceConsumption.constitutionInput.evidence
  const sourceIds = new Set(sourceItems.map(item => item.id))
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
  const userContextIds = userContext.entries.map(entry => entry.id)
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
      userContextIds,
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

test('fresh external submission accepts a bounded hypothesis while keeping personal application closed', async () => {
  const fixture = materializePackage()
  const semantic = findEvidence(fixture.package, item => item.evidenceRole === 'semantic_result' && item.status === 'available' && item.lineage === 'ziping_local_export')
  const composition = findEvidence(fixture.package, item => item.evidenceRole === 'composition_result' && item.status === 'available' && item.lineage === 'ziping_local_export')
  const submission = makeSubmission(fixture.package, {
    sourceItems: [semantic, composition],
    semanticBasisItems: [semantic, composition],
    submissionId: 'accepted-bounded',
  })

  const directory = await mkdtemp(join(tmpdir(), 'saju-hypothesis-submission-'))
  const filePath = join(directory, 'submission.json')
  try {
    const serialized = exportSajuHypothesisSubmissionJson(submission)
    await writeFile(filePath, serialized, 'utf8')
    const freshBytes = await readFile(filePath)
    const consumed = consumeSajuHypothesisSubmission(freshBytes.toString('utf8'), { handoffPackage: fixture.package })
    assert.equal(consumed.valid, true)
    assert.equal(consumed.decision, 'accepted_bounded_hypothesis')
    assert.deepEqual(consumed.errors, [])
    assert.equal(exportSajuHypothesisSubmissionJson(consumed.validation.submission), freshBytes.toString('utf8'))
    assert.equal(sha256(freshBytes), sha256(Buffer.from(serialized, 'utf8')))
    assert.deepEqual(consumed.validation.submission, submission)
    assert.ok(consumed.validation.result.compositionEvidenceIds.includes(composition.id))
    assert.deepEqual(consumed.validation.result.sourceScope.lineages, ['ziping_local_export'])
    assert.equal(consumed.validation.result.userContextDecision, 'reported_context_only_not_confirmation')
    assert.equal(consumed.validation.result.definitivePersonalization, false)
    assert.equal(consumed.validation.result.noHypothesisGenerated, true)
    assert.equal(consumed.validation.result.noRecalculation, true)
    assert.equal(consumed.validation.readiness.submissionValidationReady, true)
    assert.equal(consumed.validation.readiness.boundedHypothesisDiscussionReady, true)
    assert.equal(consumed.validation.readiness.conversationalInterpretationActivationReady, false)
    assert.equal(consumed.validation.readiness.personalApplicationReady, false)
    assert.equal(consumed.constitution.contractValid, true)
    assert.equal(consumed.constitution.interpretationDecision, 'hypothesis_only')
    assert.equal(typeof consumed.validation.storeUserResponse, 'undefined')
    assert.equal(typeof consumed.validation.classifyUserResponse, 'undefined')
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

test('evidence-grounded hypothesis without supporting user context is deferred for confirmation', () => {
  const fixture = materializePackage()
  const semantic = findEvidence(fixture.package, item => item.evidenceRole === 'semantic_result' && item.status === 'available' && item.lineage === 'ziping_local_export')
  const submission = makeSubmission(fixture.package, {
    sourceItems: [semantic],
    semanticBasisItems: [semantic],
    userContextStatus: 'not_provided',
    submissionId: 'needs-context',
  })
  const result = buildSajuHypothesisSubmissionValidation({ handoffPackage: fixture.package, submission })
  assert.equal(result.valid, true)
  assert.equal(result.decision, 'requires_user_confirmation')
  assert.deepEqual(result.errors, [])
  assert.equal(result.validation.result.status, 'user_context_required')
  assert.equal(result.validation.result.userContextDecision, 'user_context_required_before_personal_application')
  assert.ok(result.validation.readiness.blockers.includes('user_context_or_preserved_boundary_requires_confirmation'))
  assert.equal(result.validation.readiness.boundedHypothesisDiscussionReady, false)
  assert.equal(result.validation.readiness.conversationalInterpretationActivationReady, false)
  assert.equal(result.constitution.hypotheses[0].userExperienceDecision, 'user_experience_not_provided_ask_before_personal_application')
})

test('missing semantic basis is blocked even when FACT and structural evidence are present', () => {
  const fixture = materializePackage()
  const structural = findEvidence(fixture.package, item => item.evidenceRole === 'structural_result' && item.status === 'structural_result' && item.lineage === 'yuanhai_local_export')
  const submission = makeSubmission(fixture.package, {
    sourceItems: [structural],
    semanticBasisItems: [],
    submissionId: 'missing-semantic-basis',
  })
  const result = buildSajuHypothesisSubmissionValidation({ handoffPackage: fixture.package, submission })
  assert.equal(result.valid, true)
  assert.equal(result.decision, 'blocked')
  assert.deepEqual(result.errors, [])
  assert.deepEqual(result.blockers, ['semantic_basis_missing'])
  assert.equal(result.validation.result.status, 'blocked')
  assert.equal(result.validation.result.constitutionDecision, 'blocked_semantic_basis_missing')
  assert.equal(result.validation.readiness.boundedHypothesisDiscussionReady, false)
})

test('definitive personalisation and cross-lineage synthesis fail closed', () => {
  const fixture = materializePackage()
  const semantic = findEvidence(fixture.package, item => item.evidenceRole === 'semantic_result' && item.status === 'available' && item.lineage === 'ziping_local_export')
  const overpersonalized = makeSubmission(fixture.package, {
    sourceItems: [semantic],
    semanticBasisItems: [semantic],
    submissionId: 'overpersonalized',
  })
  overpersonalized.hypothesis.assertion.personalConclusion = 'allowed'
  const rejectedPersonalization = buildSajuHypothesisSubmissionValidation({ handoffPackage: fixture.package, submission: overpersonalized })
  assert.equal(rejectedPersonalization.valid, false)
  assert.equal(rejectedPersonalization.decision, 'blocked')
  assert.ok(rejectedPersonalization.errors.includes('hypothesis:definitive_personalization_forbidden'))

  const otherLineage = findEvidence(fixture.package, item => item.evidenceRole === 'semanticLexicon_result' && item.status === 'available' && item.lineage === 'yuanhai_local_export')
  const crossLineage = makeSubmission(fixture.package, {
    sourceItems: [semantic, otherLineage],
    semanticBasisItems: [semantic, otherLineage],
    submissionId: 'cross-lineage',
  })
  const rejectedCrossLineage = buildSajuHypothesisSubmissionValidation({ handoffPackage: fixture.package, submission: crossLineage })
  assert.equal(rejectedCrossLineage.valid, false)
  assert.equal(rejectedCrossLineage.decision, 'blocked')
  assert.ok(rejectedCrossLineage.errors.includes('hypothesis:cross_lineage_synthesis_forbidden'))
})

test('preserved unresolved and conflict evidence defers application and cannot be silently repaired', () => {
  const fixture = materializePackage({ ...REAL_FIXTURE_INPUT, subjectName: 'hypothesis-conflict-fixture' }, base => {
    base.systems.saju.fact.seasonContext = { season: 'spring', solarTerm: 'explicit-test-context' }
  })
  const semantic = findEvidence(fixture.package, item => item.evidenceRole === 'semantic_result' && item.status === 'available' && item.lineage === 'ziping_local_export')
  const conflict = findEvidence(fixture.package, item => item.relation === 'conflicts')
  const submission = makeSubmission(fixture.package, {
    sourceItems: [semantic, conflict],
    semanticBasisItems: [semantic],
    submissionId: 'preserved-conflict',
  })
  const result = buildSajuHypothesisSubmissionValidation({ handoffPackage: fixture.package, submission })
  assert.equal(result.valid, true)
  assert.equal(result.decision, 'requires_user_confirmation')
  assert.equal(result.validation.result.conflictState, 'preserved_tension')
  assert.deepEqual(result.validation.result.conflictIds, submission.hypothesis.conflictIds)
  assert.ok(result.validation.result.unresolvedEvidenceIds.includes(conflict.id))
  assert.equal(result.constitution.conflictsPreserved, true)
  assert.equal(result.constitution.hypotheses[0].conflictStatus, 'tension_preserved')

  const repaired = clone(submission)
  repaired.hypothesis.conflictIds = []
  repaired.hypothesis.preservation.conflictIds = []
  const rejectedRepair = buildSajuHypothesisSubmissionValidation({ handoffPackage: fixture.package, submission: repaired })
  assert.equal(rejectedRepair.valid, false)
  assert.equal(rejectedRepair.decision, 'blocked')
  assert.ok(rejectedRepair.errors.includes('hypothesis:conflicts_not_exactly_preserved'))
})

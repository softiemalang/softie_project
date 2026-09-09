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
import {
  buildSajuConversationalHandoffPackage,
  consumeSajuConversationalHandoffPackage,
  exportSajuConversationalHandoffPackageJson,
} from '../src/interpretationPrep/sajuConversationalHandoffPackage.js'
import { evaluateInterpretationConstitution } from '../src/interpretationConstitution.js'

const REAL_FIXTURE_INPUT = {
  subjectName: 'conversational-handoff-fixture',
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
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')

function materializeFixture(input = REAL_FIXTURE_INPUT, mutateBase = null) {
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
  const semanticLexiconResults = deriveSajuSourceBoundedSemanticLexiconEntries(base, structuralResults)
  const compositionResults = deriveSajuSourceLocalSemanticCompositions(base)
  const envelopeBuild = buildSajuLineageHandoffEvidenceEnvelope({
    base,
    structuralResults,
    semanticResults,
    semanticLexiconResults,
    compositionResults,
  })
  assert.equal(envelopeBuild.valid, true)
  return { base, envelope: envelopeBuild.envelope }
}

test('fresh conversational package preserves evidence and handles a personal-meaning question without personalizing', async () => {
  const fixture = materializeFixture()
  const built = buildSajuConversationalHandoffPackage({ base: fixture.base, envelope: fixture.envelope })
  assert.equal(built.valid, true)
  assert.ok(built.package)

  const packageValue = built.package
  assert.deepEqual(packageValue.evidenceConsumption.handoffEvidence, fixture.envelope)
  assert.equal(packageValue.evidenceConsumption.boundary.noRecalculation, true)
  assert.equal(packageValue.evidenceConsumption.boundary.noPersonalization, true)
  assert.equal(packageValue.evidenceConsumption.constitutionInput.hypotheses.length, 0)
  assert.equal(packageValue.boundary.noResponseStorage, true)
  assert.equal(packageValue.boundary.noResponseClassification, true)
  assert.equal(packageValue.boundary.noPersonalizationEngine, true)
  assert.equal(packageValue.readiness.boundedConversationalUseReady, true)
  assert.equal(packageValue.readiness.conversationalInterpretationActivationReady, false)
  assert.deepEqual(packageValue.readiness.blockers, [
    'user_experience_not_provided',
    'explicit_interpretation_hypothesis_not_submitted',
  ])

  const personalQuestion = '나는 어떤 사람이야?'
  const questionContract = packageValue.conversationalUseContract.personalMeaningQuestion
  assert.equal(personalQuestion, '나는 어떤 사람이야?')
  assert.equal(questionContract.scenario, 'personal_identity_or_trait_question')
  assert.equal(questionContract.noAutomaticClassification, true)
  assert.equal(questionContract.noResponseGeneration, true)
  assert.ok(questionContract.allowedNextSteps.includes('report_relevant_included_fact_values'))
  assert.ok(questionContract.allowedNextSteps.includes('explain_source_bounded_evidence_and_locator_scope'))
  assert.ok(questionContract.allowedNextSteps.includes('ask_user_context_before_personal_application'))
  assert.equal(questionContract.requiredStop, 'do_not_answer_as_a_definitive_personal_trait_or_fortune_judgment')
  assert.equal(packageValue.interpretationHypothesisContract.automaticGeneration, false)
  assert.equal(packageValue.interpretationHypothesisContract.status, 'closed_until_explicit_gate')

  const guidance = packageValue.evidenceConsumption.consumptionGuidance.entries
  assert.ok(guidance.some(item => item.evidenceClass === 'fact' && item.permission.confirmedFact === true))
  assert.ok(guidance.some(item => item.evidenceClass === 'literature_evidence' && item.permission.sourceBoundedExplanation === true))
  assert.ok(guidance.some(item => item.evidenceClass === 'source_local_composition' && item.permission.confirmedFact === false))
  assert.ok(guidance.some(item => item.evidenceClass === 'unresolved' && item.permission.hypothesisProposal.startsWith('blocked_')))
  assert.ok(guidance.every(item => item.permission.definitivePersonalization === false))

  const directory = await mkdtemp(join(tmpdir(), 'saju-conversational-handoff-'))
  const filePath = join(directory, 'conversation-package.json')
  try {
    const serialized = exportSajuConversationalHandoffPackageJson(packageValue)
    await writeFile(filePath, serialized, 'utf8')
    const freshBytes = await readFile(filePath)
    const consumed = consumeSajuConversationalHandoffPackage(freshBytes.toString('utf8'), { base: fixture.base })
    assert.equal(consumed.valid, true)
    assert.deepEqual(consumed.errors, [])
    assert.equal(exportSajuConversationalHandoffPackageJson(consumed.package), freshBytes.toString('utf8'))
    assert.equal(sha256(freshBytes), sha256(Buffer.from(serialized, 'utf8')))
    assert.deepEqual(consumed.package.evidenceConsumption.handoffEvidence, fixture.envelope)

    const constitution = evaluateInterpretationConstitution(consumed.package.evidenceConsumption.constitutionInput)
    assert.equal(constitution.contractValid, true)
    assert.equal(constitution.interpretationDecision, 'facts_only_no_semantic_interpretation')
    assert.deepEqual(constitution.hypotheses, [])
    assert.ok(constitution.evidenceGroups.base_fact.length > 0)
    assert.ok(constitution.evidenceGroups.literature_claim.length > 0)
    assert.deepEqual(constitution.evidenceGroups.modern_synthesis, [])
    assert.deepEqual(constitution.evidenceGroups.ai_inference, [])
    assert.deepEqual(constitution.evidenceGroups.user_experience, [])
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

test('personal-meaning use remains blocked by preserved lineage conflict and never selects a winner', () => {
  const fixture = materializeFixture({ ...REAL_FIXTURE_INPUT, subjectName: 'conversational-conflict-fixture' }, base => {
    base.systems.saju.fact.seasonContext = { season: 'spring', solarTerm: 'explicit-test-context' }
  })
  const built = buildSajuConversationalHandoffPackage({ base: fixture.base, envelope: fixture.envelope })
  assert.equal(built.valid, true)
  const conflictGuidance = built.package.evidenceConsumption.consumptionGuidance.entries.filter(item => item.evidenceClass === 'conflict')
  assert.equal(conflictGuidance.length, 1)
  assert.equal(conflictGuidance[0].permission.confirmedFact, false)
  assert.equal(conflictGuidance[0].permission.hypothesisProposal, 'blocked_conflict_preserved')
  assert.ok(conflictGuidance[0].permission.allowedUses.includes('report_all_conflicting_evidence'))
  assert.ok(conflictGuidance[0].permission.forbiddenUses.includes('select_conflict_winner'))
  assert.equal(built.package.evidenceConsumption.constitutionInput.conflicts.length, 1)
  assert.equal(built.package.evidenceConsumption.constitutionInput.conflicts[0].resolution, 'preserved_tension')
  assert.equal(built.package.readiness.conversationalInterpretationActivationReady, false)

  const constitution = evaluateInterpretationConstitution(built.package.evidenceConsumption.constitutionInput)
  assert.equal(constitution.contractValid, true)
  assert.equal(constitution.interpretationDecision, 'facts_only_no_semantic_interpretation')
  assert.equal(constitution.conflictsPreserved, true)
})

test('canonical conversational package fails closed on missing handoff and policy/evidence tampering', () => {
  const fixture = materializeFixture()
  const missing = buildSajuConversationalHandoffPackage({ base: fixture.base })
  assert.equal(missing.valid, false)
  assert.equal(missing.package, null)

  const built = buildSajuConversationalHandoffPackage({ base: fixture.base, envelope: fixture.envelope })
  assert.equal(built.valid, true)

  const policyTampered = clone(built.package)
  policyTampered.conversationalUseContract.evidenceClasses.fact.directUse = 'unrestricted_personal_use'
  const rejectedPolicy = consumeSajuConversationalHandoffPackage(JSON.stringify(policyTampered), { base: fixture.base })
  assert.equal(rejectedPolicy.valid, false)
  assert.equal(rejectedPolicy.package, null)
  assert.ok(rejectedPolicy.errors.includes('conversational_use_contract_mismatch'))

  const hypothesisTampered = clone(built.package)
  hypothesisTampered.interpretationHypothesisContract.automaticGeneration = true
  const rejectedHypothesis = consumeSajuConversationalHandoffPackage(JSON.stringify(hypothesisTampered), { base: fixture.base })
  assert.equal(rejectedHypothesis.valid, false)
  assert.equal(rejectedHypothesis.package, null)
  assert.ok(rejectedHypothesis.errors.includes('interpretation_hypothesis_contract_mismatch'))

  const evidenceTampered = clone(built.package)
  evidenceTampered.evidenceConsumption.handoffEvidence.state.composition.unresolvedCompositions[0].payload.status = 'available'
  const rejectedEvidence = consumeSajuConversationalHandoffPackage(JSON.stringify(evidenceTampered), { base: fixture.base })
  assert.equal(rejectedEvidence.valid, false)
  assert.equal(rejectedEvidence.package, null)
  assert.ok(rejectedEvidence.errors.includes('consumption:constitution_input_not_lossless'))

  assert.doesNotThrow(() => consumeSajuConversationalHandoffPackage('{not-json}', { base: fixture.base }))
  assert.equal(consumeSajuConversationalHandoffPackage('{not-json}', { base: fixture.base }).valid, false)
})

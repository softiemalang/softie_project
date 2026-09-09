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
import {
  buildSajuLineageHandoffEvidenceEnvelope,
} from '../src/interpretationPrep/sajuLineageHandoffEvidence.js'
import {
  buildSajuEvidenceConsumptionContract,
  consumeSajuEvidenceConsumptionContract,
  exportSajuEvidenceConsumptionContractJson,
} from '../src/interpretationPrep/sajuEvidenceConsumptionContract.js'
import { evaluateInterpretationConstitution } from '../src/interpretationConstitution.js'

const REAL_FIXTURE_INPUT = {
  subjectName: 'consumption-contract-fixture',
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
const byteSha256 = bytes => createHash('sha256').update(bytes).digest('hex')

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
  return { base, envelope: envelopeBuild.envelope, envelopeBuild }
}

test('consumption contract preserves fresh-file evidence and gives each class bounded permissions', async () => {
  const fixture = materializeFixture()
  const built = buildSajuEvidenceConsumptionContract({ base: fixture.base, envelope: fixture.envelope })
  assert.equal(built.valid, true)
  assert.ok(built.contract)

  const contract = built.contract
  assert.deepEqual(contract.handoffEvidence, fixture.envelope)
  assert.deepEqual(contract.constitutionInput.evidence, built.adapter.evidence)
  assert.deepEqual(contract.constitutionInput.conflicts, built.adapter.conflicts)
  assert.deepEqual(contract.constitutionInput.hypotheses, [])
  assert.equal(contract.boundary.factsAndSourceEvidenceSeparate, true)
  assert.equal(contract.boundary.noRecalculation, true)
  assert.equal(contract.boundary.noDefinitivePersonalConclusion, true)
  assert.equal(contract.boundary.noHypothesisGenerated, true)
  assert.equal(contract.readiness.userExperienceProvided, false)
  assert.equal(contract.readiness.boundedEvidenceConsumptionReady, true)
  assert.equal(contract.readiness.interpretationHypothesisReady, false)

  const guidance = contract.consumptionGuidance.entries
  const fact = guidance.find(item => item.evidenceClass === 'fact')
  const structural = guidance.find(item => item.evidenceRole === 'structural_result')
  const semantic = guidance.find(item => item.evidenceRole === 'semantic_result' && item.status === 'available')
  const composition = guidance.find(item => item.evidenceClass === 'source_local_composition')
  const unresolved = guidance.find(item => item.evidenceClass === 'unresolved')
  assert.ok(fact)
  assert.ok(structural)
  assert.ok(semantic)
  assert.ok(composition)
  assert.ok(unresolved)

  assert.equal(fact.permission.confirmedFact, true)
  assert.equal(fact.permission.sourceBoundedExplanation, false)
  assert.equal(fact.permission.hypothesisProposal, 'not_allowed_from_fact')
  assert.equal(fact.permission.userContextRequirement, 'not_required_for_fact_report')
  assert.equal(fact.permission.definitivePersonalization, false)

  assert.equal(structural.permission.confirmedFact, false)
  assert.equal(structural.permission.sourceBoundedExplanation, true)
  assert.equal(structural.permission.hypothesisProposal, 'not_allowed_structural_or_non_available_state')
  assert.equal(structural.semanticBasisEligible, false)
  assert.equal(structural.permission.definitivePersonalization, false)

  assert.equal(semantic.evidenceClass, 'literature_evidence')
  assert.equal(semantic.permission.confirmedFact, false)
  assert.equal(semantic.permission.sourceBoundedExplanation, true)
  assert.equal(semantic.permission.hypothesisProposal, 'conditional_after_explicit_constitution_and_user_gate')
  assert.equal(semantic.permission.userContextRequirement, 'required_before_personal_application')

  assert.equal(composition.permission.confirmedFact, false)
  assert.equal(composition.permission.sourceBoundedExplanation, true)
  assert.equal(composition.permission.hypothesisProposal, 'conditional_after_explicit_constitution_and_user_gate')
  assert.equal(composition.permission.definitivePersonalization, false)

  assert.equal(unresolved.permission.confirmedFact, false)
  assert.equal(unresolved.permission.hypothesisProposal, 'blocked_unresolved_or_unsupported_state')
  assert.match(unresolved.permission.userContextRequirement, /without_filling_the_gap/)
  assert.equal(unresolved.permission.definitivePersonalization, false)
  assert.ok(guidance.every(item => item.permission.definitivePersonalization === false))

  const directory = await mkdtemp(join(tmpdir(), 'saju-consumption-contract-'))
  const filePath = join(directory, 'consumption-contract.json')
  try {
    const serialized = exportSajuEvidenceConsumptionContractJson(contract)
    await writeFile(filePath, serialized, 'utf8')
    const freshBytes = await readFile(filePath)
    const consumed = consumeSajuEvidenceConsumptionContract(freshBytes.toString('utf8'), { base: fixture.base })
    assert.equal(consumed.valid, true)
    assert.deepEqual(consumed.errors, [])
    assert.equal(exportSajuEvidenceConsumptionContractJson(consumed.contract), freshBytes.toString('utf8'))
    assert.equal(byteSha256(freshBytes), byteSha256(Buffer.from(serialized, 'utf8')))
    assert.deepEqual(consumed.contract.handoffEvidence.evidence, fixture.envelope.evidence)
    assert.deepEqual(consumed.contract.constitutionInput.evidence, built.adapter.evidence)

    const constitution = evaluateInterpretationConstitution(consumed.contract.constitutionInput)
    assert.equal(constitution.contractValid, true)
    assert.equal(constitution.interpretationDecision, 'facts_only_no_semantic_interpretation')
    assert.deepEqual(constitution.hypotheses, [])
    assert.equal(constitution.noRecalculation, true)
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

test('conflict and unresolved guidance remain non-authoritative and preserve the Constitution ledger', () => {
  const fixture = materializeFixture({ ...REAL_FIXTURE_INPUT, subjectName: 'consumption-conflict-fixture' }, base => {
    base.systems.saju.fact.seasonContext = { season: 'spring', solarTerm: 'explicit-test-context' }
  })
  const built = buildSajuEvidenceConsumptionContract({ base: fixture.base, envelope: fixture.envelope })
  assert.equal(built.valid, true)
  const conflicts = built.contract.consumptionGuidance.entries.filter(item => item.evidenceClass === 'conflict')
  assert.equal(conflicts.length, 1)
  assert.equal(conflicts[0].relation, 'conflicts')
  assert.equal(conflicts[0].permission.confirmedFact, false)
  assert.equal(conflicts[0].permission.sourceBoundedExplanation, true)
  assert.equal(conflicts[0].permission.hypothesisProposal, 'blocked_conflict_preserved')
  assert.equal(conflicts[0].permission.definitivePersonalization, false)
  assert.ok(conflicts[0].permission.allowedUses.includes('report_all_conflicting_evidence'))
  assert.ok(conflicts[0].permission.forbiddenUses.includes('select_conflict_winner'))
  assert.equal(built.contract.constitutionInput.conflicts.length, 1)
  assert.equal(built.contract.constitutionInput.conflicts[0].resolution, 'preserved_tension')

  const constitution = evaluateInterpretationConstitution(built.contract.constitutionInput)
  assert.equal(constitution.contractValid, true)
  assert.equal(constitution.interpretationDecision, 'facts_only_no_semantic_interpretation')
  assert.equal(constitution.conflictsPreserved, true)
})

test('consumption contract fails closed on missing handoff, policy tampering, and evidence substitution', () => {
  const fixture = materializeFixture()
  const missing = buildSajuEvidenceConsumptionContract({ base: fixture.base })
  assert.equal(missing.valid, false)
  assert.equal(missing.contract, null)

  const built = buildSajuEvidenceConsumptionContract({ base: fixture.base, envelope: fixture.envelope })
  assert.equal(built.valid, true)

  const policyTampered = clone(built.contract)
  const fact = policyTampered.consumptionGuidance.entries.find(item => item.evidenceClass === 'fact')
  fact.permission.definitivePersonalization = true
  const rejectedPolicy = consumeSajuEvidenceConsumptionContract(JSON.stringify(policyTampered), { base: fixture.base })
  assert.equal(rejectedPolicy.valid, false)
  assert.equal(rejectedPolicy.contract, null)
  assert.ok(rejectedPolicy.errors.includes('guidance_not_bound_to_evidence'))

  const evidenceTampered = clone(built.contract)
  evidenceTampered.constitutionInput.evidence[0].factRefs = ['normalizedInput.birthDate']
  const rejectedEvidence = consumeSajuEvidenceConsumptionContract(JSON.stringify(evidenceTampered), { base: fixture.base })
  assert.equal(rejectedEvidence.valid, false)
  assert.equal(rejectedEvidence.contract, null)
  assert.ok(rejectedEvidence.errors.includes('constitution_input_not_lossless'))

  const malformed = clone(built.contract)
  malformed.handoffEvidence.state.semantic = null
  assert.doesNotThrow(() => consumeSajuEvidenceConsumptionContract(JSON.stringify(malformed), { base: fixture.base }))
  const rejectedMalformed = consumeSajuEvidenceConsumptionContract(JSON.stringify(malformed), { base: fixture.base })
  assert.equal(rejectedMalformed.valid, false)
  assert.equal(rejectedMalformed.contract, null)
})

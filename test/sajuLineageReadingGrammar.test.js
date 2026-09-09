import assert from 'node:assert/strict'
import test from 'node:test'

import { buildDeterministicBase, projectDeterministicBaseForConsumer } from '../src/interpretationPrep/conversationFoundation.js'
import { prepareThreeSystemInterpretationData } from '../src/interpretationPrep/threeSystemPrepPipeline.js'
import {
  SAJU_LINEAGE_READING_GRAMMAR,
  SAJU_LINEAGE_RULES,
  SAJU_LINEAGE_STRUCTURAL_CONTRACTS,
  SAJU_QIONGTONG_SHENGWANG_JUE_ANALYSIS,
  checkSajuLineageReadingGrammar,
  checkSajuLineageStructuralResultContract,
  deriveSajuLineageStructuralResults,
  evaluateSajuLineageReadingGrammar,
} from '../src/interpretationPrep/sajuLineageReadingGrammar.js'

const REAL_BIRTH_INPUT = {
  subjectName: 'lineage-grammar-fixture',
  birthDate: '1997-04-21',
  birthTime: '14:40',
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

const JIA_BIRTH_INPUT = {
  ...REAL_BIRTH_INPUT,
  subjectName: 'lineage-grammar-jia-fixture',
  birthDate: '1997-04-22',
}

function buildFrozenBase(input = REAL_BIRTH_INPUT) {
  const prepared = prepareThreeSystemInterpretationData(input)
  const packageBase = buildDeterministicBase({
    subjectName: input.subjectName,
    result: prepared.result,
    unifiedContext: prepared.unifiedContext,
  })
  return projectDeterministicBaseForConsumer(packageBase)
}

test('source-bounded grammar has five identified sources, bounded locators, and no common-rule promotion', () => {
  assert.deepEqual(checkSajuLineageReadingGrammar(), [])
  assert.equal(SAJU_LINEAGE_READING_GRAMMAR.sources.length, 5)
  assert.equal(new Set(SAJU_LINEAGE_READING_GRAMMAR.sources.map(source => source.sourceId)).size, 5)
  assert.equal(SAJU_LINEAGE_READING_GRAMMAR.commonCandidates.length, 0)
  assert.ok(SAJU_LINEAGE_READING_GRAMMAR.commonCandidateReviews.every(review => review.status === 'not_emitted_as_common_candidate'))
  assert.ok(SAJU_LINEAGE_RULES.every(rule => rule.claimPromotion === false && rule.semanticAuthority === 'not_established'))
})

test('real frozen Base executes only bounded structural rules and preserves lineage blockers', () => {
  const base = buildFrozenBase()
  const result = evaluateSajuLineageReadingGrammar(base)

  assert.equal(result.baseValidation.valid, true)
  assert.equal(result.boundary.noRecalculation, true)
  assert.equal(result.boundary.noSemanticInterpretation, true)
  assert.equal(result.boundary.conflictsPreserved, true)
  assert.equal(result.boundary.commonRulePromotion, false)

  const byId = Object.fromEntries(result.rules.map(rule => [rule.ruleId, rule]))
  for (const ruleId of [
    'rule.yuanhai.day-anchor-month-command-frame.v0',
    'rule.yuanhai.hidden-stem-ten-god-label-inventory.v0',
    'rule.sanming.four-pillars-month-hour-frame.v0',
    'rule.sanming.human-element-month-command.v0',
    'rule.sanming.element-generation-control-v0',
    'rule.ziping.branch-relation-inventory.v0',
  ]) assert.equal(byId[ruleId].executionStatus, 'executable_from_frozen_base', ruleId)

  assert.equal(byId['rule.ziping.branch-relation-inventory.v0'].output.precedence, 'none')
  assert.ok(byId['rule.ziping.branch-relation-inventory.v0'].output.relations.some(item => item.name === '충'))
  assert.ok(byId['rule.ziping.branch-relation-inventory.v0'].output.relations.some(item => item.name === '형'))
  assert.equal(byId['rule.qiongtong.five-phase-number-season-state.v0'].executionStatus, 'blocked_missing_base_fact')
  assert.equal(byId['rule.ditian.jia-wood-seasonal-condition.v0'].executionStatus, 'not_applicable_fixture')
  assert.equal(byId['rule.qiongtong.jia-wood-seasonal-clauses.v0'].executionStatus, 'not_applicable_fixture')
  assert.equal(byId['feature.shinsal-source-rule.v0'].executionStatus, 'unsupported')
  assert.deepEqual(result.commonCandidates, [])
})

test('missing hour, timing, and relation facts fail closed without source-rule inference', () => {
  const base = buildFrozenBase()
  base.normalizedInput.timeAccuracy = 'unknown'
  base.systems.saju.fact.pillars.hour = null
  base.systems.saju.fact.pillarFacts.hour = null
  base.systems.saju.fact.timing = null
  base.systems.saju.fact.branchRelations = []

  const result = evaluateSajuLineageReadingGrammar(base)
  const byId = Object.fromEntries(result.rules.map(rule => [rule.ruleId, rule]))
  assert.equal(byId['rule.yuanhai.day-anchor-month-command-frame.v0'].executionStatus, 'blocked_missing_base_fact')
  assert.equal(byId['rule.sanming.four-pillars-month-hour-frame.v0'].executionStatus, 'blocked_missing_base_fact')
  assert.equal(byId['rule.ziping.branch-relation-inventory.v0'].executionStatus, 'executable_from_frozen_base')
  assert.deepEqual(byId['rule.ziping.branch-relation-inventory.v0'].output.relations, [])
  assert.equal(byId['rule.ziping.timing.v0'].executionStatus, 'not_executable_by_contract')
  assert.equal(result.boundary.noRecalculation, true)
  assert.equal(result.boundary.noSemanticInterpretation, true)
})

test('adopted rules have complete structural result contracts and keep common facts separate from lineage outputs', () => {
  assert.deepEqual(checkSajuLineageStructuralResultContract(), [])
  assert.equal(SAJU_LINEAGE_STRUCTURAL_CONTRACTS.length, 9)
  assert.deepEqual(
    SAJU_LINEAGE_STRUCTURAL_CONTRACTS.map(contract => contract.ruleId),
    SAJU_LINEAGE_RULES.filter(rule => rule.status === 'adopted_lineage_rule').map(rule => rule.ruleId),
  )
  for (const contract of SAJU_LINEAGE_STRUCTURAL_CONTRACTS) {
    assert.ok(contract.commonBaseFacts.length > 0, contract.ruleId)
    assert.ok(contract.commonBaseFacts.every(binding => ['frozen_base_common_fact', 'frozen_normalized_input'].includes(binding.origin)), contract.ruleId)
    assert.equal(contract.output.origin, 'lineage_derived_structural_result', contract.ruleId)
    assert.equal(contract.output.semanticExpansion, false, contract.ruleId)
    assert.ok(contract.procedure.length > 0, contract.ruleId)
    assert.ok(contract.stopConditions.length > 0, contract.ruleId)
  }
  assert.ok(SAJU_LINEAGE_STRUCTURAL_CONTRACTS.find(contract => contract.ruleId === 'rule.ziping.root-exposure.v0') === undefined)
  assert.equal(SAJU_LINEAGE_RULES.find(rule => rule.ruleId === 'rule.ziping.root-exposure.v0').status, 'unresolved')
})

test('real frozen Base yields deterministic structural results with explicit prerequisite gaps and unresolved lanes', () => {
  const base = buildFrozenBase()
  const first = deriveSajuLineageStructuralResults(base)
  const second = deriveSajuLineageStructuralResults(base)

  assert.deepEqual(first, second)
  assert.equal(first.contractValidation.valid, true)
  assert.equal(first.baseValidation.valid, true)
  assert.equal(first.categories.executableRules.length, 6)
  assert.equal(first.categories.derivedStructuralResults.length, 6)
  assert.equal(first.categories.prerequisiteGaps.length, 1)
  assert.equal(first.categories.unresolvedRules.length, 5)
  assert.equal(first.categories.unsupportedRules.length, 2)
  assert.equal(first.categories.notApplicableRules.length, 2)
  assert.deepEqual(first.categories.lineageConflicts, [])
  const qiongtongGap = first.categories.prerequisiteGaps.find(item => item.ruleId === 'rule.qiongtong.five-phase-number-season-state.v0')
  assert.deepEqual(qiongtongGap.missingLineagePrerequisiteIds, ['source-specific-shengwang-jue-state'])
  assert.ok(qiongtongGap.unsatisfiedConditions.includes('source_specific_shengwang_jue_state_resolver_unresolved'))
  assert.ok(first.categories.derivedStructuralResults.some(item => item.output?.sourceRoleFrame?.anchor === 'dayMaster'))
  assert.equal(first.boundary.noRecalculation, true)
  assert.equal(first.boundary.noSemanticInterpretation, true)
  assert.equal(first.boundary.lineageMerge, true)
})

test('Qiongtong 生旺/死绝 remains a lineage-only unresolved prerequisite and rejects generic state substitutes', () => {
  assert.equal(SAJU_QIONGTONG_SHENGWANG_JUE_ANALYSIS.stateResolver.status, 'unresolved')
  assert.deepEqual(SAJU_QIONGTONG_SHENGWANG_JUE_ANALYSIS.baseElementNumbers, { 水: 1, 火: 2, 木: 3, 金: 4, 土: 5 })
  assert.deepEqual(SAJU_QIONGTONG_SHENGWANG_JUE_ANALYSIS.stateOperations, { 生旺: 'double', '死绝': 'half' })

  for (const seasonState of [
    { state: '生旺' },
    { state: '死绝' },
    { twelveStage: '長生' },
  ]) {
    const base = buildFrozenBase()
    base.systems.saju.fact.seasonState = seasonState
    const before = JSON.stringify(base)
    const result = deriveSajuLineageStructuralResults(base)
    const qiongtongGap = result.categories.prerequisiteGaps.find(item => item.ruleId === 'rule.qiongtong.five-phase-number-season-state.v0')

    assert.ok(qiongtongGap)
    assert.deepEqual(qiongtongGap.missingLineagePrerequisiteIds, ['source-specific-shengwang-jue-state'])
    assert.equal(result.categories.derivedStructuralResults.some(item => item.ruleId === 'rule.qiongtong.five-phase-number-season-state.v0'), false)
    assert.equal(result.boundary.noSemanticInterpretation, true)
    assert.equal(JSON.stringify(base), before)
  }
})

test('missing deterministic prerequisites and incomplete contracts fail closed', () => {
  const base = buildFrozenBase()
  base.normalizedInput.timeAccuracy = 'unknown'
  base.systems.saju.fact.pillars.hour = null
  base.systems.saju.fact.pillarFacts.hour = null
  const result = deriveSajuLineageStructuralResults(base)
  const gapIds = result.categories.prerequisiteGaps.map(item => item.ruleId)
  assert.ok(gapIds.includes('rule.yuanhai.day-anchor-month-command-frame.v0'))
  assert.ok(gapIds.includes('rule.yuanhai.hidden-stem-ten-god-label-inventory.v0'))
  assert.ok(gapIds.includes('rule.sanming.four-pillars-month-hour-frame.v0'))
  assert.equal(result.categories.derivedStructuralResults.some(item => item.ruleId === 'rule.sanming.four-pillars-month-hour-frame.v0'), false)

  const malformedContracts = JSON.parse(JSON.stringify(SAJU_LINEAGE_STRUCTURAL_CONTRACTS))
  malformedContracts[0].procedure = []
  const malformedResult = deriveSajuLineageStructuralResults(buildFrozenBase(), SAJU_LINEAGE_READING_GRAMMAR, malformedContracts)
  assert.equal(malformedResult.contractValidation.valid, false)
  assert.deepEqual(malformedResult.categories.derivedStructuralResults, [])
  assert.equal(malformedResult.boundary.lineageMerge, false)
})

test('distinct applicable seasonal lineages preserve conflict and emit no merged structural result', () => {
  const base = buildFrozenBase(JIA_BIRTH_INPUT)
  // This test-only supplement models a future explicit prerequisite; it is not added to the public Base generator.
  base.systems.saju.fact.seasonContext = { season: 'spring', solarTerm: 'explicit-test-context' }
  const result = deriveSajuLineageStructuralResults(base)
  const conflict = result.categories.lineageConflicts.find(item => item.conflictGroup === 'jia-wood-seasonal-condition-window')

  assert.equal(result.baseValidation.valid, true)
  assert.ok(result.categories.executableRules.some(item => item.ruleId === 'rule.ditian.jia-wood-seasonal-condition.v0'))
  assert.ok(result.categories.executableRules.some(item => item.ruleId === 'rule.qiongtong.jia-wood-seasonal-clauses.v0'))
  assert.ok(conflict)
  assert.deepEqual(conflict.ruleIds, [
    'rule.ditian.jia-wood-seasonal-condition.v0',
    'rule.qiongtong.jia-wood-seasonal-clauses.v0',
  ])
  assert.equal(conflict.status, 'preserved_tension_fail_closed')
  assert.equal(result.categories.derivedStructuralResults.some(item => item.ruleId === 'rule.ditian.jia-wood-seasonal-condition.v0'), false)
  assert.equal(result.categories.derivedStructuralResults.some(item => item.ruleId === 'rule.qiongtong.jia-wood-seasonal-clauses.v0'), false)
  assert.equal(result.boundary.lineageMerge, false)
  assert.equal(result.boundary.noSemanticInterpretation, true)
})

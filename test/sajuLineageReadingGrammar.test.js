import assert from 'node:assert/strict'
import test from 'node:test'

import { buildDeterministicBase, projectDeterministicBaseForConsumer } from '../src/interpretationPrep/conversationFoundation.js'
import { prepareThreeSystemInterpretationData } from '../src/interpretationPrep/threeSystemPrepPipeline.js'
import {
  SAJU_LINEAGE_READING_GRAMMAR,
  SAJU_LINEAGE_RULES,
  SAJU_LINEAGE_STRUCTURAL_CONTRACTS,
  SAJU_DITIAN_INVENTORY_STATUSES,
  SAJU_DITIAN_RULE_INVENTORY,
  SAJU_FIVE_LINEAGE_COMPOSITION_READINESS,
  SAJU_QIONGTONG_INVENTORY_STATUSES,
  SAJU_QIONGTONG_RULE_INVENTORY,
  SAJU_SANMING_INVENTORY_STATUSES,
  SAJU_SANMING_RULE_INVENTORY,
  SAJU_SANMING_SOURCE_SEMANTIC_CONTRACTS,
  SAJU_SANMING_SOURCE_SEMANTIC_RULES,
  SAJU_QIONGTONG_SHENGWANG_JUE_ANALYSIS,
  SAJU_SOURCE_BOUNDED_SEMANTIC_LEXICON,
  SAJU_SOURCE_BOUNDED_SEMANTIC_LEXICON_STATUSES,
  SAJU_SOURCE_LOCAL_SEMANTIC_COMPOSITION_READINESS,
  SAJU_SOURCE_LOCAL_SEMANTIC_COMPOSITION_RULES,
  SAJU_SOURCE_LOCAL_SEMANTIC_COMPOSITION_CLOSABILITY_REVIEW,
  SAJU_SOURCE_LOCAL_SEMANTIC_COMPOSITION_FREEZE_DECISION,
  SAJU_SOURCE_SEMANTIC_LEXICON_COMPOSITION_READINESS,
  SAJU_ZIPING_CANDIDATE_CLOSABILITY,
  SAJU_ZIPING_EXPLICIT_STEM_BRANCH_ANALYSIS,
  SAJU_ZIPING_ROOT_EXPOSURE_ANALYSIS,
  SAJU_ZIPING_SEMANTIC_COMPOSITION_FRONTIER,
  SAJU_ZIPING_SEMANTIC_RULE_INVENTORY,
  SAJU_ZIPING_SEMANTIC_INVENTORY_STATUSES,
  SAJU_ZIPING_SOURCE_SEMANTIC_CONTRACTS,
  SAJU_ZIPING_SOURCE_SEMANTIC_RULES,
  SAJU_YUANHAI_INVENTORY_STATUSES,
  SAJU_YUANHAI_RULE_INVENTORY,
  checkSajuLineageReadingGrammar,
  checkSajuSourceBoundedSemanticLexicon,
  checkSajuSanmingSourceSemanticResultContract,
  checkSajuLineageSourceSemanticResultContract,
  checkSajuLineageStructuralResultContract,
  checkSajuSourceLocalSemanticComposition,
  checkSajuSourceLocalSemanticCompositionClosabilityReview,
  deriveSajuLineageSourceSemanticResults,
  deriveSajuSanmingSourceSemanticResults,
  deriveSajuLineageStructuralResults,
  deriveSajuSourceLocalSemanticCompositions,
  deriveSajuSourceBoundedSemanticLexiconEntries,
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

const ZIPING_P10_BIRTH_INPUT = {
  ...REAL_BIRTH_INPUT,
  subjectName: 'lineage-grammar-ziping-p10-fixture',
  birthDate: '1997-04-12',
  birthTime: '08:30',
}

const ZIPING_P10_MULTI_BIRTH_INPUT = {
  ...REAL_BIRTH_INPUT,
  subjectName: 'lineage-grammar-ziping-p10-multi-fixture',
  birthDate: '1963-04-11',
  birthTime: '08:30',
}

const ZIPING_P10_COMPOSITION_BIRTH_INPUT = {
  ...REAL_BIRTH_INPUT,
  subjectName: 'lineage-grammar-ziping-p10-composition-fixture',
  birthDate: '1992-04-18',
  birthTime: '18:30',
}

const ZIPING_P10_BRANCH_ONLY_BIRTH_INPUT = {
  ...REAL_BIRTH_INPUT,
  subjectName: 'lineage-grammar-ziping-p10-branch-only-fixture',
  birthDate: '1992-04-18',
  birthTime: '14:30',
}

const ZIPING_P7_BIRTH_INPUT = {
  ...REAL_BIRTH_INPUT,
  subjectName: 'lineage-grammar-ziping-p7-fixture',
  birthDate: '1990-02-07',
  birthTime: '08:30',
}

const DITIAN_FANG_BIRTH_INPUT = {
  ...REAL_BIRTH_INPUT,
  subjectName: 'lineage-grammar-ditian-fang-fixture',
  birthDate: '1986-03-13',
  birthTime: '12:00',
}

const DITIAN_JU_BIRTH_INPUT = {
  ...REAL_BIRTH_INPUT,
  subjectName: 'lineage-grammar-ditian-ju-fixture',
  birthDate: '1983-03-08',
  birthTime: '12:00',
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

test('Ziping full-work semantic inventory keeps only p.7 and p.10 as existing executable lanes', () => {
  assert.ok(SAJU_ZIPING_SEMANTIC_RULE_INVENTORY.length >= 30)
  assert.ok(SAJU_ZIPING_SEMANTIC_RULE_INVENTORY.every(item => SAJU_ZIPING_SEMANTIC_INVENTORY_STATUSES.includes(item.status)))
  assert.deepEqual(
    SAJU_ZIPING_SEMANTIC_RULE_INVENTORY.filter(item => item.status === 'adopted_existing_executable').map(item => item.contractRuleId),
    ['rule.ziping.yin-month-exposure-change.v0', 'rule.ziping.chen-exposure-use-role.v0'],
  )
  assert.deepEqual(SAJU_LINEAGE_READING_GRAMMAR.sourceBoundedSemanticGrammar.newlyAdoptedRuleIds, [])
  assert.equal(SAJU_ZIPING_SEMANTIC_COMPOSITION_FRONTIER.compositionReady, false)
  assert.equal(SAJU_ZIPING_SEMANTIC_COMPOSITION_FRONTIER.sourceProvidesPriority, false)
  assert.equal(SAJU_ZIPING_SEMANTIC_COMPOSITION_FRONTIER.sourceProvidesCombinationRule, false)
  assert.equal(SAJU_ZIPING_SEMANTIC_COMPOSITION_FRONTIER.sourceProvidesTransitionRule, false)

  const p10Semantic = deriveSajuLineageSourceSemanticResults(buildFrozenBase(ZIPING_P10_BIRTH_INPUT))
  const p7Semantic = deriveSajuLineageSourceSemanticResults(buildFrozenBase(ZIPING_P7_BIRTH_INPUT))
  assert.deepEqual(
    p10Semantic.categories.derivedSourceBoundedSemanticResults.map(result => result.ruleId),
    ['rule.ziping.chen-exposure-use-role.v0'],
  )
  assert.deepEqual(
    p7Semantic.categories.derivedSourceBoundedSemanticResults.map(result => result.ruleId),
    ['rule.ziping.yin-month-exposure-change.v0'],
  )
  assert.equal(p10Semantic.categories.contextBoundCandidates.length, 0)
  assert.equal(p10Semantic.categories.unresolvedBoundaries.length, 1)
  assert.ok(SAJU_ZIPING_SEMANTIC_RULE_INVENTORY.some(item => item.status === 'unsupported' && item.inventoryId.includes('six-relations')))
})

test('Ziping context-bound candidates are narrowly classified without forced promotion', () => {
  const candidates = SAJU_ZIPING_SEMANTIC_RULE_INVENTORY.filter(item => item.status === 'context_bound_candidate')
  assert.equal(candidates.length, 23)
  assert.equal(SAJU_ZIPING_CANDIDATE_CLOSABILITY.candidateCount, 23)
  assert.deepEqual(SAJU_ZIPING_CANDIDATE_CLOSABILITY.nearCandidateIds, ['inventory.ziping.p4-stem-combination-nonmerge.v0'])
  assert.equal(SAJU_ZIPING_CANDIDATE_CLOSABILITY.frozenV0CandidateIds.length, 22)
  assert.equal(SAJU_ZIPING_CANDIDATE_CLOSABILITY.entries.filter(entry => entry.closability === 'near_candidate').length, 1)
  assert.equal(SAJU_ZIPING_CANDIDATE_CLOSABILITY.entries.filter(entry => entry.closability === 'v0_frozen').length, 22)
  const near = SAJU_ZIPING_CANDIDATE_CLOSABILITY.entries.find(entry => entry.closability === 'near_candidate')
  assert.ok(near.requiredAdditionalCheck.includes('distance'))
  assert.ok(SAJU_ZIPING_CANDIDATE_CLOSABILITY.entries.filter(entry => entry.closability === 'v0_frozen').every(entry => entry.requiredAdditionalCheck === null))
  assert.deepEqual(SAJU_LINEAGE_READING_GRAMMAR.commonCandidates, [])
})

test('Yuanhai whole-work inventory separates adopted structural frames from semantic and unsupported surfaces', () => {
  assert.ok(SAJU_YUANHAI_RULE_INVENTORY.length >= 15)
  assert.ok(SAJU_YUANHAI_RULE_INVENTORY.every(item => SAJU_YUANHAI_INVENTORY_STATUSES.includes(item.status)))
  assert.deepEqual(
    SAJU_YUANHAI_RULE_INVENTORY.filter(item => item.status === 'adopted_structural_rule').map(item => item.contractRuleId),
    [
      'rule.yuanhai.hidden-stem-ten-god-label-inventory.v0',
      'rule.yuanhai.day-anchor-month-command-frame.v0',
      'rule.yuanhai.dayun-branch-seun-stem-lens.v0',
    ],
  )
  assert.equal(SAJU_YUANHAI_RULE_INVENTORY.filter(item => item.status === 'adopted_semantic_rule').length, 0)
  assert.ok(SAJU_YUANHAI_RULE_INVENTORY.some(item => item.status === 'unsupported' && item.inventoryId.includes('family-gender')))
  assert.ok(SAJU_YUANHAI_RULE_INVENTORY.some(item => item.status === 'unresolved' && item.inventoryId.includes('timing-composition')))
  assert.equal(SAJU_LINEAGE_READING_GRAMMAR.sourceBoundedSemanticGrammar.lineageRuleInventories.yuanhai.length, SAJU_YUANHAI_RULE_INVENTORY.length)
})

test('Sanming whole-work inventory keeps direct structural windows and one narrow role-nomenclature lane separate', () => {
  assert.ok(SAJU_SANMING_RULE_INVENTORY.length >= 14)
  assert.ok(SAJU_SANMING_RULE_INVENTORY.every(item => SAJU_SANMING_INVENTORY_STATUSES.includes(item.status)))
  assert.deepEqual(
    SAJU_SANMING_RULE_INVENTORY.filter(item => item.status === 'adopted_structural_rule').map(item => item.contractRuleId),
    [
      'rule.sanming.element-generation-control-v0',
      'rule.sanming.human-element-month-command.v0',
      'rule.sanming.seasonal-state-inventory.v0',
      'rule.sanming.four-pillars-month-hour-frame.v0',
      'rule.sanming.visible-stem-frame.v0',
    ],
  )
  assert.deepEqual(
    SAJU_SANMING_RULE_INVENTORY.filter(item => item.status === 'adopted_semantic_rule').map(item => item.contractRuleId),
    ['rule.sanming.role-nomenclature.v0'],
  )
  assert.equal(SAJU_SANMING_RULE_INVENTORY.filter(item => item.status === 'context_bound_candidate').length, 4)
  assert.equal(SAJU_SANMING_RULE_INVENTORY.filter(item => item.status === 'unresolved').length, 1)
  assert.equal(SAJU_SANMING_RULE_INVENTORY.filter(item => item.status === 'unsupported').length, 4)
  assert.deepEqual(SAJU_SANMING_SOURCE_SEMANTIC_CONTRACTS.map(contract => contract.ruleId), SAJU_SANMING_SOURCE_SEMANTIC_RULES.map(rule => rule.ruleId))
  assert.deepEqual(checkSajuSanmingSourceSemanticResultContract(), [])
  assert.equal(SAJU_LINEAGE_READING_GRAMMAR.sourceBoundedSemanticGrammar.lineageRuleInventories.sanming.length, SAJU_SANMING_RULE_INVENTORY.length)
  assert.deepEqual(SAJU_LINEAGE_READING_GRAMMAR.commonCandidates, [])
})

test('Ditian and Qiongtong inventories separate closed structural frames from semantic and composition frontiers', () => {
  assert.ok(SAJU_DITIAN_RULE_INVENTORY.length >= 10)
  assert.ok(SAJU_DITIAN_RULE_INVENTORY.every(item => SAJU_DITIAN_INVENTORY_STATUSES.includes(item.status)))
  assert.deepEqual(
    SAJU_DITIAN_RULE_INVENTORY.filter(item => item.status === 'adopted_structural_rule').map(item => item.contractRuleId),
    [
      'rule.ditian.heaven-earth-human-frame.v0',
      'rule.ditian.branch-category-inventory.v0',
      'rule.ditian.shape-example-inventory.v0',
      'rule.ditian.fang-ju-example-inventory.v0',
    ],
  )
  assert.equal(SAJU_DITIAN_RULE_INVENTORY.filter(item => item.status === 'context_bound_candidate').length, 3)
  assert.ok(SAJU_DITIAN_RULE_INVENTORY.some(item => item.status === 'unresolved' && item.inventoryId.includes('tiyong')))
  assert.ok(SAJU_DITIAN_RULE_INVENTORY.every(item => item.status !== 'adopted_semantic_rule'))

  assert.ok(SAJU_QIONGTONG_RULE_INVENTORY.length >= 13)
  assert.ok(SAJU_QIONGTONG_RULE_INVENTORY.every(item => SAJU_QIONGTONG_INVENTORY_STATUSES.includes(item.status)))
  assert.deepEqual(
    SAJU_QIONGTONG_RULE_INVENTORY.filter(item => item.status === 'adopted_structural_rule').map(item => item.contractRuleId),
    ['rule.qiongtong.five-phase-number-inventory.v0', 'rule.qiongtong.day-stem-section-frame.v0'],
  )
  assert.equal(SAJU_QIONGTONG_RULE_INVENTORY.filter(item => item.status === 'context_bound_candidate').length, 10)
  assert.ok(SAJU_QIONGTONG_RULE_INVENTORY.some(item => item.status === 'unresolved' && item.inventoryId.includes('shengwang-jue')))
  assert.equal(SAJU_LINEAGE_READING_GRAMMAR.sourceBoundedSemanticGrammar.lineageSemanticRules.ditian.length, 0)
  assert.equal(SAJU_LINEAGE_READING_GRAMMAR.sourceBoundedSemanticGrammar.lineageSemanticRules.qiongtong.length, 0)
  assert.deepEqual(SAJU_FIVE_LINEAGE_COMPOSITION_READINESS.commonCandidates, [])
  assert.equal(SAJU_FIVE_LINEAGE_COMPOSITION_READINESS.compositionReady, false)
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
    'rule.yuanhai.dayun-branch-seun-stem-lens.v0',
    'rule.sanming.four-pillars-month-hour-frame.v0',
    'rule.sanming.human-element-month-command.v0',
    'rule.sanming.element-generation-control-v0',
    'rule.sanming.seasonal-state-inventory.v0',
    'rule.sanming.visible-stem-frame.v0',
    'rule.ziping.branch-relation-inventory.v0',
    'rule.ziping.explicit-stem-branch-example-match.v0',
    'rule.ziping.jia-root-branch-scan.v0',
  ]) assert.equal(byId[ruleId].executionStatus, 'executable_from_frozen_base', ruleId)

  assert.equal(byId['rule.ziping.branch-relation-inventory.v0'].output.precedence, 'none')
  assert.ok(byId['rule.ziping.branch-relation-inventory.v0'].output.relations.some(item => item.name === '충'))
  assert.ok(byId['rule.ziping.branch-relation-inventory.v0'].output.relations.some(item => item.name === '형'))
  assert.equal(byId['rule.ziping.explicit-stem-branch-example-match.v0'].output.anchorStem, '계')
  assert.deepEqual(byId['rule.ziping.explicit-stem-branch-example-match.v0'].output.matchedExamples, [])
  assert.deepEqual(byId['rule.ziping.jia-root-branch-scan.v0'].output.visibleStemAnchors, [{ position: 'month', stem: '갑' }])
  assert.deepEqual(byId['rule.ziping.jia-root-branch-scan.v0'].output.jiaRootBranchMatches, [{
    position: 'hour',
    branch: '미',
    anchorStem: '갑',
    sourceRelation: '甲木之根',
  }])
  assert.deepEqual(byId['rule.ziping.jia-root-branch-scan.v0'].output.haiVisibleStemRelations, [])
  assert.deepEqual(byId['rule.yuanhai.dayun-branch-seun-stem-lens.v0'].output.focusFrame, { dayun: 'branch', seUn: 'stem' })
  assert.equal(byId['rule.yuanhai.dayun-branch-seun-stem-lens.v0'].output.activeDayun.branch, '축')
  assert.equal(byId['rule.yuanhai.dayun-branch-seun-stem-lens.v0'].output.seUn.stem, '병')
  assert.equal(byId['rule.yuanhai.dayun-branch-seun-stem-lens.v0'].output.sourceScope, 'yuanhai-p9-大运看支-岁君看干-focus-lens-only')
  assert.equal(byId['rule.sanming.seasonal-state-inventory.v0'].output.seasonWindow, 'spring')
  assert.deepEqual(byId['rule.sanming.seasonal-state-inventory.v0'].output.elementStateBySeason, { 목: '旺', 화: '相', 수: '休', 금: '囚', 토: '死' })
  assert.deepEqual(byId['rule.sanming.visible-stem-frame.v0'].output.visibleStemInventory, [
    { position: 'year', visibleStem: '정' },
    { position: 'month', visibleStem: '갑' },
    { position: 'day', visibleStem: '계' },
    { position: 'hour', visibleStem: '기' },
  ])
  assert.equal(byId['rule.qiongtong.five-phase-number-season-state.v0'].executionStatus, 'blocked_missing_base_fact')
  assert.equal(byId['rule.ditian.jia-wood-seasonal-condition.v0'].executionStatus, 'not_applicable_fixture')
  assert.equal(byId['rule.qiongtong.jia-wood-seasonal-clauses.v0'].executionStatus, 'not_applicable_fixture')
  assert.equal(byId['feature.shinsal-source-rule.v0'].executionStatus, 'unsupported')
  assert.deepEqual(result.commonCandidates, [])
})

test('Ditian exact structural examples and Qiongtong section/number frames are deterministic and lineage-separated', () => {
  const jiaBase = buildFrozenBase(JIA_BIRTH_INPUT)
  const firstJia = deriveSajuLineageStructuralResults(jiaBase)
  const secondJia = deriveSajuLineageStructuralResults(jiaBase)
  assert.deepEqual(firstJia, secondJia)

  const jiaById = Object.fromEntries(firstJia.categories.derivedStructuralResults.map(item => [item.ruleId, item]))
  assert.equal(jiaById['rule.ditian.heaven-earth-human-frame.v0'].work, '滴天髓')
  assert.equal(jiaById['rule.ditian.heaven-earth-human-frame.v0'].output.positions[0].sourceLabels.visibleStem, '天元')
  assert.equal(jiaById['rule.ditian.branch-category-inventory.v0'].output.precedence, 'none')
  assert.deepEqual(jiaById['rule.ditian.shape-example-inventory.v0'].output.matchedExamples.map(item => item.result), ['形全'])
  assert.equal(jiaById['rule.qiongtong.five-phase-number-inventory.v0'].output.sourceElementNumbers['水'], 1)
  assert.deepEqual(jiaById['rule.qiongtong.five-phase-number-inventory.v0'].output.stateOperation, { 生旺: 'not_applied', '死绝': 'not_applied' })
  assert.deepEqual(jiaById['rule.qiongtong.day-stem-section-frame.v0'].output.sourceSection, {
    locatorId: 'qiongtong-p3-jia-section',
    pdfPageStart: 3,
    pdfPageEnd: 12,
  })
  assert.ok(firstJia.categories.notApplicableRules.some(item => item.ruleId === 'rule.ditian.fang-ju-example-inventory.v0'))
  assert.ok(firstJia.categories.derivedStructuralResults.every(item => item.noSemanticMeaning === true && item.lineage))

  const fang = deriveSajuLineageStructuralResults(buildFrozenBase(DITIAN_FANG_BIRTH_INPUT))
  const fangResult = fang.categories.derivedStructuralResults.find(item => item.ruleId === 'rule.ditian.fang-ju-example-inventory.v0')
  assert.deepEqual(fangResult.output.matchedExamples.map(item => ({ relation: item.relation, label: item.label })), [{ relation: '方', label: '東方' }])

  const ju = deriveSajuLineageStructuralResults(buildFrozenBase(DITIAN_JU_BIRTH_INPUT))
  const juResult = ju.categories.derivedStructuralResults.find(item => item.ruleId === 'rule.ditian.fang-ju-example-inventory.v0')
  assert.deepEqual(juResult.output.matchedExamples.map(item => ({ relation: item.relation, label: item.label })), [{ relation: '局', label: '木局' }])
})

test('new Ditian/Qiongtong structural prerequisites fail closed without recalculation or cross-lineage completion', () => {
  const base = buildFrozenBase(JIA_BIRTH_INPUT)
  base.systems.saju.fact.pillarFacts.hour.branch = null
  base.systems.saju.fact.elementsDistribution.목 = null
  const before = JSON.stringify(base)
  const result = deriveSajuLineageStructuralResults(base)

  for (const ruleId of [
    'rule.ditian.heaven-earth-human-frame.v0',
    'rule.ditian.branch-category-inventory.v0',
    'rule.ditian.fang-ju-example-inventory.v0',
    'rule.qiongtong.five-phase-number-inventory.v0',
  ]) {
    const gap = result.categories.prerequisiteGaps.find(item => item.ruleId === ruleId)
    assert.ok(gap, ruleId)
    assert.equal(gap.output, null, ruleId)
  }
  assert.equal(result.categories.derivedStructuralResults.some(item => item.ruleId === 'rule.ditian.branch-category-inventory.v0'), false)
  assert.equal(result.categories.derivedStructuralResults.some(item => item.ruleId === 'rule.qiongtong.five-phase-number-inventory.v0'), false)
  assert.equal(result.boundary.lineageMerge, true)
  assert.equal(JSON.stringify(base), before)

  const conflictBase = buildFrozenBase(JIA_BIRTH_INPUT)
  conflictBase.systems.saju.fact.seasonContext = { season: 'spring', solarTerm: 'explicit-test-context' }
  const conflict = deriveSajuLineageStructuralResults(conflictBase)
  assert.ok(conflict.categories.lineageConflicts.some(item => item.conflictGroup === 'jia-wood-seasonal-condition-window'))
  assert.equal(conflict.categories.derivedStructuralResults.some(item => item.ruleId === 'rule.ditian.jia-wood-seasonal-condition.v0'), false)
  assert.equal(conflict.categories.derivedStructuralResults.some(item => item.ruleId === 'rule.qiongtong.jia-wood-seasonal-clauses.v0'), false)
  assert.equal(conflict.boundary.lineageMerge, false)
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
  assert.equal(byId['rule.yuanhai.dayun-branch-seun-stem-lens.v0'].executionStatus, 'blocked_missing_base_fact')
  assert.equal(byId['rule.sanming.four-pillars-month-hour-frame.v0'].executionStatus, 'blocked_missing_base_fact')
  assert.equal(byId['rule.ziping.branch-relation-inventory.v0'].executionStatus, 'executable_from_frozen_base')
  assert.deepEqual(byId['rule.ziping.branch-relation-inventory.v0'].output.relations, [])
  assert.equal(byId['rule.ziping.timing.v0'].executionStatus, 'not_executable_by_contract')
  assert.equal(result.boundary.noRecalculation, true)
  assert.equal(result.boundary.noSemanticInterpretation, true)
})

test('Yuanhai 大運看支/歲君看干 lens is deterministic, provenance-bounded, and fail-closed', () => {
  const base = buildFrozenBase()
  const first = deriveSajuLineageStructuralResults(base)
  const second = deriveSajuLineageStructuralResults(base)
  assert.deepEqual(first, second)

  const result = first.categories.derivedStructuralResults.find(item => item.ruleId === 'rule.yuanhai.dayun-branch-seun-stem-lens.v0')
  assert.ok(result)
  assert.equal(result.work, '淵海子平')
  assert.equal(result.lineage, 'yuanhai_local_export')
  assert.deepEqual(result.locatorIds, ['yuanhai-p9-dayun-focus-lens'])
  assert.deepEqual(result.output.focusFrame, { dayun: 'branch', seUn: 'stem' })
  assert.equal(result.output.activeDayun.branch, '축')
  assert.equal(result.output.seUn.stem, '병')
  assert.equal(result.outputContract.semanticExpansion, false)
  assert.equal(result.noSemanticMeaning, true)
  assert.equal(result.deterministic, true)
  assert.equal(first.categories.lineageConflicts.length, 0)
  assert.equal(first.boundary.lineageMerge, true)

  const blockedBase = buildFrozenBase()
  blockedBase.systems.saju.fact.timing.daYun.cycles[2].branch = null
  const before = JSON.stringify(blockedBase)
  const blocked = deriveSajuLineageStructuralResults(blockedBase)
  const gap = blocked.categories.prerequisiteGaps.find(item => item.ruleId === 'rule.yuanhai.dayun-branch-seun-stem-lens.v0')
  assert.ok(gap)
  assert.ok(gap.unsatisfiedConditions.includes('complete_dayun_branch_seun_stem_lens_missing'))
  assert.equal(blocked.categories.derivedStructuralResults.some(item => item.ruleId === 'rule.yuanhai.dayun-branch-seun-stem-lens.v0'), false)
  assert.equal(JSON.stringify(blockedBase), before)
  assert.equal(blocked.boundary.noSemanticInterpretation, true)
})

test('Sanming p.67 seasonal state and p.162 role nomenclature are deterministic, source-bounded, and fail closed', () => {
  const base = buildFrozenBase(ZIPING_P7_BIRTH_INPUT)
  const firstStructural = deriveSajuLineageStructuralResults(base)
  const secondStructural = deriveSajuLineageStructuralResults(base)
  assert.deepEqual(firstStructural, secondStructural)

  const seasonal = firstStructural.categories.derivedStructuralResults.find(item => item.ruleId === 'rule.sanming.seasonal-state-inventory.v0')
  const visibleFrame = firstStructural.categories.derivedStructuralResults.find(item => item.ruleId === 'rule.sanming.visible-stem-frame.v0')
  assert.ok(seasonal)
  assert.ok(visibleFrame)
  assert.equal(seasonal.work, '三命通會')
  assert.equal(seasonal.lineage, 'sanming_local_export')
  assert.deepEqual(seasonal.locatorIds, ['sanming-p67-seasonal-state', 'sanming-p68-twelve-palace-vocabulary'])
  assert.equal(seasonal.output.seasonWindow, 'spring')
  assert.equal(seasonal.output.sourceScope, 'sanming-p67-seasonal-state-and-p68-vocabulary-only')
  assert.equal(seasonal.output.twelvePalaceVocabulary.length, 12)
  assert.equal(seasonal.outputContract.semanticExpansion, false)
  assert.equal(seasonal.noSemanticMeaning, true)

  const firstSemantic = deriveSajuSanmingSourceSemanticResults(base, firstStructural)
  const secondSemantic = deriveSajuSanmingSourceSemanticResults(base, secondStructural)
  assert.deepEqual(firstSemantic, secondSemantic)
  const semantic = firstSemantic.categories.derivedSourceBoundedSemanticResults.find(item => item.ruleId === 'rule.sanming.role-nomenclature.v0')
  assert.ok(semantic)
  assert.equal(semantic.work, '三命通會')
  assert.equal(semantic.lineage, 'sanming_local_export')
  assert.deepEqual(semantic.provenance.locatorIds, ['sanming-p162-role-nomenclature'])
  assert.deepEqual(semantic.output.sourceRoleLabelInventory, [
    { suppliedLabel: '정인', count: 1, sourceRoleLabel: '印綬' },
    { suppliedLabel: '편재', count: 1, sourceRoleLabel: '妻財' },
    { suppliedLabel: '정관', count: 2, sourceRoleLabel: '正官' },
    { suppliedLabel: '상관', count: 1, sourceRoleLabel: '傷官' },
    { suppliedLabel: '식신', count: 1, sourceRoleLabel: '食神' },
    { suppliedLabel: '정재', count: 1, sourceRoleLabel: '妻財' },
  ])
  assert.equal(semantic.semanticBoundary.sourceRoleLabelsOnly, true)
  assert.equal(semantic.semanticBoundary.personalMeaning, false)
  assert.equal(semantic.semanticBoundary.crossLineageMerge, false)
  assert.equal(semantic.noPersonalMeaning, true)
  assert.equal(semantic.semanticExpansion, false)

  const unknownLabelBase = buildFrozenBase(ZIPING_P10_BIRTH_INPUT)
  const unknownStructural = deriveSajuLineageStructuralResults(unknownLabelBase)
  const unknownSemantic = deriveSajuSanmingSourceSemanticResults(unknownLabelBase, unknownStructural)
  const unknownDescriptor = unknownSemantic.categories.adoptedSemanticRules.find(item => item.ruleId === 'rule.sanming.role-nomenclature.v0')
  assert.ok(unknownDescriptor)
  assert.equal(unknownDescriptor.executionStatus, 'not_executable_by_contract')
  assert.deepEqual(unknownDescriptor.unsupportedSuppliedLabels, ['비견'])
  assert.equal(unknownSemantic.categories.derivedSourceBoundedSemanticResults.length, 0)

  const missingBase = buildFrozenBase(ZIPING_P7_BIRTH_INPUT)
  missingBase.systems.saju.fact.pillarFacts.hour.stem = null
  const missingStructural = deriveSajuLineageStructuralResults(missingBase)
  const missingSemantic = deriveSajuSanmingSourceSemanticResults(missingBase, missingStructural)
  const missingGap = missingSemantic.categories.prerequisiteGaps.find(item => item.ruleId === 'rule.sanming.role-nomenclature.v0')
  assert.ok(missingGap)
  assert.equal(missingGap.requiredStructuralResult.state, 'blocked_missing')

  const conflictedStructural = {
    ...firstStructural,
    categories: {
      ...firstStructural.categories,
      lineageConflicts: [{
        conflictId: 'conflict.test-sanming-role',
        ruleIds: ['rule.sanming.visible-stem-frame.v0', 'rule.synthetic.other-lineage.v0'],
      }],
    },
  }
  const conflictedSemantic = deriveSajuSanmingSourceSemanticResults(base, conflictedStructural)
  const conflicted = conflictedSemantic.categories.adoptedSemanticRules.find(item => item.ruleId === 'rule.sanming.role-nomenclature.v0')
  assert.equal(conflicted.executionStatus, 'not_executable_by_contract')
  assert.equal(conflicted.conflictState.status, 'preserved_tension_fail_closed')
  assert.equal(conflicted.conflictState.winnerSelected, false)
  assert.equal(conflictedSemantic.boundary.crossLineageMerge, false)
})

test('adopted rules have complete structural result contracts and keep common facts separate from lineage outputs', () => {
  assert.deepEqual(checkSajuLineageStructuralResultContract(), [])
  assert.equal(SAJU_LINEAGE_STRUCTURAL_CONTRACTS.length, 22)
  assert.deepEqual(
    SAJU_LINEAGE_STRUCTURAL_CONTRACTS.map(contract => contract.ruleId).sort(),
    SAJU_LINEAGE_RULES.filter(rule => rule.status === 'adopted_lineage_rule').map(rule => rule.ruleId).sort(),
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
  assert.ok(SAJU_LINEAGE_STRUCTURAL_CONTRACTS.find(contract => contract.ruleId === 'rule.ziping.chen-exposure-inventory.v0'))
})

test('Ziping exact stem/branch examples are deterministic without promoting generic rooting or exposure', () => {
  assert.equal(SAJU_ZIPING_EXPLICIT_STEM_BRANCH_ANALYSIS.locatorId, 'ziping-p5-branch-relations-definition-and-examples')
  assert.ok(SAJU_ZIPING_EXPLICIT_STEM_BRANCH_ANALYSIS.unresolved.includes('complete 本气/中气/余气 mapping for every branch'))

  const first = deriveSajuLineageStructuralResults(buildFrozenBase(JIA_BIRTH_INPUT))
  const second = deriveSajuLineageStructuralResults(buildFrozenBase(JIA_BIRTH_INPUT))
  assert.deepEqual(first, second)

  const result = first.categories.derivedStructuralResults.find(item => item.ruleId === 'rule.ziping.explicit-stem-branch-example-match.v0')
  assert.ok(result)
  assert.equal(result.output.anchorStem, '갑')
  assert.deepEqual(result.output.matchedExamples, [{
    position: 'hour',
    anchorStem: '갑',
    branch: '미',
    hiddenStems: ['기', '정', '을'],
    sourceExample: {
      sourceStem: '甲',
      sourceBranch: '未',
      sourceClass: 'explicit_support_example',
      sourceCategory: '墓库',
    },
  }])
  assert.equal(SAJU_LINEAGE_RULES.find(rule => rule.ruleId === 'rule.ziping.root-exposure.v0').status, 'unresolved')
  assert.equal(first.boundary.noSemanticInterpretation, true)
})

test('Ziping exact stem/branch examples fail closed when hidden-stem input is incomplete', () => {
  const base = buildFrozenBase(JIA_BIRTH_INPUT)
  base.systems.saju.fact.pillarFacts.hour.hiddenStems = null
  const result = deriveSajuLineageStructuralResults(base)
  const gap = result.categories.prerequisiteGaps.find(item => item.ruleId === 'rule.ziping.explicit-stem-branch-example-match.v0')

  assert.ok(gap)
  assert.ok(gap.unsatisfiedConditions.includes('complete_stem_branch_example_input_missing'))
  assert.equal(result.categories.derivedStructuralResults.some(item => item.ruleId === 'rule.ziping.explicit-stem-branch-example-match.v0'), false)
  assert.equal(result.boundary.noSemanticInterpretation, true)
})

test('Ziping p.16 closes only the source-bounded 甲 root scan and leaves generic 透干 unresolved', () => {
  assert.equal(SAJU_ZIPING_ROOT_EXPOSURE_ANALYSIS.adoptedPredicate.status, 'resolved_bounded_stem_specific_predicate')
  assert.equal(SAJU_ZIPING_ROOT_EXPOSURE_ANALYSIS.exposurePredicate.status, 'unresolved_general_predicate')

  const base = buildFrozenBase()
  const first = deriveSajuLineageStructuralResults(base)
  const second = deriveSajuLineageStructuralResults(base)
  assert.deepEqual(first, second)

  const result = first.categories.derivedStructuralResults.find(item => item.ruleId === 'rule.ziping.jia-root-branch-scan.v0')
  assert.ok(result)
  assert.deepEqual(result.locatorIds, ['ziping-p3-yang-yin-root-cycle-and-tomb-exception', 'ziping-p16-branch-stem-root-scan'])
  assert.equal(result.output.sourcePredicateScope, 'ziping-p16-jia-and-hai-examples-only')
  assert.equal(result.output.exposedStemMatches, undefined)
  assert.equal(SAJU_LINEAGE_RULES.find(rule => rule.ruleId === 'rule.ziping.root-exposure.v0').status, 'unresolved')
})

test('Ziping p.16 root scan fails closed when the four visible stem/branch frame is incomplete', () => {
  const base = buildFrozenBase()
  base.systems.saju.fact.pillarFacts.hour.branch = null
  const result = deriveSajuLineageStructuralResults(base)
  const gap = result.categories.prerequisiteGaps.find(item => item.ruleId === 'rule.ziping.jia-root-branch-scan.v0')

  assert.ok(gap)
  assert.ok(gap.unsatisfiedConditions.includes('complete_jia_root_scan_input_missing'))
  assert.equal(result.categories.derivedStructuralResults.some(item => item.ruleId === 'rule.ziping.jia-root-branch-scan.v0'), false)
  assert.equal(result.boundary.noSemanticInterpretation, true)
})

test('Ziping p.7 closes only its exact local contrast while p.10–11 do not emit a generic predicate', () => {
  const analysis = SAJU_ZIPING_ROOT_EXPOSURE_ANALYSIS
  assert.deepEqual(
    analysis.directObservations.map(observation => observation.locatorId),
    [
      'ziping-p3-yang-yin-root-cycle-and-tomb-exception',
      'ziping-p16-branch-stem-root-scan',
      'page.local.ziping.p7-yongshin-continuation',
      'ziping-p10-chen-exposed-stem-definition',
      'ziping-p11-exposed-stem-and-branch-context',
    ],
  )
  assert.deepEqual(
    analysis.contextBoundRelations.map(relation => relation.relationId),
    [
      'ziping.p7.yin-month-jia-bing-exposure-change',
      'ziping.p10-chen-three-exposure-examples',
      'ziping.p11-exposure-and-branch-meeting',
    ],
  )
  assert.equal(analysis.exposurePredicate.status, 'unresolved_general_predicate')
  assert.deepEqual(analysis.p7ExactSurface, {
    ruleId: 'rule.ziping.yin-month-exposure-change.v0',
    structuralPrerequisiteRuleId: 'rule.ziping.yin-month-exposure-contrast.v0',
    status: 'adopted_exact_context_clause',
    locatorId: 'page.local.ziping.p7-yongshin-continuation',
    exactCondition: '寅月 with no supplied visible 甲 and exactly one supplied visible 丙 in the four-position frame',
    sourceSelectionStatement: '同知得以作主',
    outputScope: 'source-local selection-change clause only; no global 用神 priority, generic 透/透干 rule, or personal meaning',
  })

  const first = deriveSajuLineageStructuralResults(buildFrozenBase())
  const second = deriveSajuLineageStructuralResults(buildFrozenBase())
  assert.deepEqual(first, second)
  assert.equal(first.categories.derivedStructuralResults.some(item => item.ruleId === 'rule.ziping.root-exposure.v0'), false)
  const unresolved = first.categories.unresolvedRules.find(item => item.ruleId === 'rule.ziping.root-exposure.v0')
  assert.ok(unresolved)
  assert.ok(unresolved.locatorIds.includes('page.local.ziping.p7-yongshin-continuation'))
  assert.ok(unresolved.locatorIds.includes('ziping-p10-chen-exposed-stem-definition'))
  assert.ok(unresolved.locatorIds.includes('ziping-p11-exposed-stem-and-branch-context'))
  assert.deepEqual(first.categories.lineageConflicts, [])
  assert.equal(first.boundary.noSemanticInterpretation, true)
})

test('Ziping p.10 exact 甲生辰月 inventory feeds only its source-bounded role-label semantic result', () => {
  assert.deepEqual(checkSajuLineageSourceSemanticResultContract(), [])
  assert.deepEqual(
    SAJU_ZIPING_SOURCE_SEMANTIC_RULES.map(rule => rule.status),
    ['adopted_lineage_semantic_rule', 'adopted_lineage_semantic_rule', 'unresolved'],
  )
  assert.deepEqual(
    SAJU_ZIPING_SOURCE_SEMANTIC_CONTRACTS.map(contract => contract.ruleId),
    SAJU_ZIPING_SOURCE_SEMANTIC_RULES.map(rule => rule.ruleId),
  )

  const base = buildFrozenBase(ZIPING_P10_BIRTH_INPUT)
  const structural = deriveSajuLineageStructuralResults(base)
  const structuralResult = structural.categories.derivedStructuralResults.find(item => item.ruleId === 'rule.ziping.chen-exposure-inventory.v0')
  assert.ok(structuralResult)
  assert.deepEqual(structuralResult.output.namedExposureMatches, [{
    position: 'hour',
    visibleStem: '무',
    sourceStem: '戊',
    sourceScope: 'ziping-p10-甲生辰月-named-target-only',
  }])

  const first = deriveSajuLineageSourceSemanticResults(base, structural)
  const second = deriveSajuLineageSourceSemanticResults(base, structural)
  assert.deepEqual(first, second)
  assert.equal(first.boundary.baseMutation, false)
  assert.equal(first.boundary.publicBaseMutation, false)
  assert.equal(first.boundary.personalMeaning, true)
  assert.equal(first.boundary.crossLineageMerge, false)
  assert.deepEqual(first.categories.lineageConflicts, [])

  const semantic = first.categories.derivedSourceBoundedSemanticResults.find(item => item.ruleId === 'rule.ziping.chen-exposure-use-role.v0')
  assert.ok(semantic)
  assert.equal(semantic.output.multiplicityPolicy, '一透一用')
  assert.deepEqual(semantic.output.matchedSourceRoleLabels, [{
    position: 'hour',
    visibleStem: '무',
    sourceStem: '戊',
    sourceRole: '偏财',
  }])
  assert.deepEqual(semantic.structuralPrerequisiteResultIds, [structuralResult.resultId])
  assert.deepEqual(semantic.requiredStructuralResult, {
    ruleIds: ['rule.ziping.chen-exposure-inventory.v0'],
    resultIds: [structuralResult.resultId],
    state: 'satisfied',
  })
  assert.deepEqual(semantic.semanticRoleResult, {
    resultKey: 'ziping.chenExposureUseRole',
    fields: ['sourceCondition', 'matchedSourceRoleLabels', 'multiplicityPolicy', 'sourceSemanticScope'],
    origin: 'lineage_derived_source_bounded_semantic_result',
    materialized: true,
  })
  assert.deepEqual(semantic.semanticBoundary, {
    sourceRoleLabelsOnly: true,
    sourceClauseOnly: false,
    personalMeaning: false,
    crossLineageMerge: false,
    commonRulePromotion: false,
  })
  assert.deepEqual(semantic.conflictState, {
    status: 'not_observed',
    conflictId: null,
    policy: 'preserve every source role label and fail closed if another lineage or an unresolved p.11 interaction would be needed',
    winnerSelected: false,
    failClosed: true,
  })
  assert.ok(semantic.forbiddenExtensions.includes('single_symbol_personal_meaning'))
  assert.deepEqual(semantic.provenance, {
    schema: 'saju-lineage-source-bounded-semantic-result-v0',
    version: '0.1.0',
    contractId: 'contract.rule.ziping.chen-exposure-use-role.v0',
    ruleId: 'rule.ziping.chen-exposure-use-role.v0',
    sourceIds: ['saju-source-ziping-zhenquan'],
    lineage: 'ziping_local_export',
    locatorIds: ['ziping-p10-chen-exposed-stem-definition'],
    sourceByteSha256: {
      'saju-source-ziping-zhenquan': '449336b5e35aa6811b0462093d0175c45a0add44065bf2d3845cff75981db692',
    },
  })
  assert.equal(semantic.sourceProvenance['saju-source-ziping-zhenquan'], '449336b5e35aa6811b0462093d0175c45a0add44065bf2d3845cff75981db692')
  assert.equal(semantic.noPersonalMeaning, true)
  assert.equal(semantic.semanticExpansion, false)
  assert.deepEqual(first.categories.contextBoundCandidates, [])
  assert.equal(first.categories.unresolvedBoundaries[0].ruleId, 'rule.ziping.exposure-branch-sentiment.v0')

  const multiBase = buildFrozenBase(ZIPING_P10_MULTI_BIRTH_INPUT)
  const multiStructural = deriveSajuLineageStructuralResults(multiBase)
  const multiSemantic = deriveSajuLineageSourceSemanticResults(multiBase, multiStructural)
  const multiResult = multiSemantic.categories.derivedSourceBoundedSemanticResults.find(item => item.ruleId === 'rule.ziping.chen-exposure-use-role.v0')
  assert.ok(multiResult)
  assert.equal(multiResult.output.multiplicityPolicy, '兼透兼用')
  assert.deepEqual(multiResult.output.matchedSourceRoleLabels, [
    { position: 'year', visibleStem: '계', sourceStem: '癸', sourceRole: '正印' },
    { position: 'hour', visibleStem: '무', sourceStem: '戊', sourceRole: '偏财' },
  ])
})

test('Ziping p.7 exact 不透甲而透丙 clause is deterministic, source-bounded, and separate from generic 透干', () => {
  assert.deepEqual(checkSajuLineageSourceSemanticResultContract(), [])
  const base = buildFrozenBase(ZIPING_P7_BIRTH_INPUT)
  const structural = deriveSajuLineageStructuralResults(base)
  const structuralResult = structural.categories.derivedStructuralResults.find(item => item.ruleId === 'rule.ziping.yin-month-exposure-contrast.v0')
  assert.ok(structuralResult)
  assert.deepEqual(structuralResult.output, {
    sourceCondition: {
      monthBranch: '寅',
      visibleStemFrame: 'four-supplied-pillar-positions',
      absentVisibleStem: '甲',
      exposedVisibleStem: '丙',
    },
    visibleStemInventory: [
      { position: 'year', visibleStem: '경' },
      { position: 'month', visibleStem: '무' },
      { position: 'day', visibleStem: '계' },
      { position: 'hour', visibleStem: '병' },
    ],
    absentVisibleStem: '甲',
    exposedVisibleStem: '丙',
    exposedPositions: [{ position: 'hour', visibleStem: '병', sourceStem: '丙' }],
    sourcePredicateScope: 'ziping-p7-寅月-不透甲而透丙-exact-frame-only',
  })

  const first = deriveSajuLineageSourceSemanticResults(base, structural)
  const second = deriveSajuLineageSourceSemanticResults(base, structural)
  assert.deepEqual(first, second)
  assert.deepEqual(first.categories.contextBoundCandidates, [])
  assert.ok(first.categories.unresolvedBoundaries.some(item => item.ruleId === 'rule.ziping.exposure-branch-sentiment.v0'))
  const semantic = first.categories.derivedSourceBoundedSemanticResults.find(item => item.ruleId === 'rule.ziping.yin-month-exposure-change.v0')
  assert.ok(semantic)
  assert.deepEqual(semantic.output, {
    sourceCondition: {
      monthBranch: '寅',
      visibleStemFrame: 'four-supplied-pillar-positions',
      absentVisibleStem: '甲',
      exposedVisibleStem: '丙',
    },
    absentVisibleStem: '甲',
    exposedVisibleStem: '丙',
    exposedPositions: [{ position: 'hour', visibleStem: '병', sourceStem: '丙' }],
    sourceSelectionStatement: '同知得以作主',
    sourceSemanticScope: 'ziping-p7-寅月-不透甲而透丙-source-clause-only',
  })
  assert.deepEqual(semantic.requiredStructuralResult, {
    ruleIds: ['rule.ziping.yin-month-exposure-contrast.v0'],
    resultIds: [structuralResult.resultId],
    state: 'satisfied',
  })
  assert.deepEqual(semantic.semanticRoleResult, {
    resultKey: 'ziping.yinMonthExposureChange',
    fields: ['sourceCondition', 'absentVisibleStem', 'exposedVisibleStem', 'exposedPositions', 'sourceSelectionStatement', 'sourceSemanticScope'],
    origin: 'lineage_derived_source_bounded_semantic_result',
    materialized: true,
  })
  assert.deepEqual(semantic.semanticBoundary, {
    sourceRoleLabelsOnly: false,
    sourceClauseOnly: true,
    personalMeaning: false,
    crossLineageMerge: false,
    commonRulePromotion: false,
  })
  assert.deepEqual(semantic.provenance, {
    schema: 'saju-lineage-source-bounded-semantic-result-v0',
    version: '0.1.0',
    contractId: 'contract.rule.ziping.yin-month-exposure-change.v0',
    ruleId: 'rule.ziping.yin-month-exposure-change.v0',
    sourceIds: ['saju-source-ziping-zhenquan'],
    lineage: 'ziping_local_export',
    locatorIds: ['page.local.ziping.p7-yongshin-continuation'],
    sourceByteSha256: {
      'saju-source-ziping-zhenquan': '449336b5e35aa6811b0462093d0175c45a0add44065bf2d3845cff75981db692',
    },
  })
  assert.equal(semantic.noPersonalMeaning, true)
  assert.equal(semantic.semanticExpansion, false)
})

test('Ziping p.7 exact clause fails closed on missing, duplicate, or conflicting exposure input', () => {
  const missingBase = buildFrozenBase(ZIPING_P7_BIRTH_INPUT)
  missingBase.systems.saju.fact.pillarFacts.hour.stem = null
  const missingStructural = deriveSajuLineageStructuralResults(missingBase)
  const missingGap = missingStructural.categories.prerequisiteGaps.find(item => item.ruleId === 'rule.ziping.yin-month-exposure-contrast.v0')
  assert.ok(missingGap)
  assert.ok(missingGap.unsatisfiedConditions.includes('complete_yin_month_exposure_contrast_input_missing'))
  const missingSemantic = deriveSajuLineageSourceSemanticResults(missingBase, missingStructural)
  assert.equal(missingSemantic.categories.derivedSourceBoundedSemanticResults.some(item => item.ruleId === 'rule.ziping.yin-month-exposure-change.v0'), false)
  const missingResult = missingSemantic.categories.prerequisiteGaps.find(item => item.ruleId === 'rule.ziping.yin-month-exposure-change.v0')
  assert.equal(missingResult.requiredStructuralResult.state, 'blocked_missing')

  const duplicateBase = buildFrozenBase(ZIPING_P7_BIRTH_INPUT)
  duplicateBase.systems.saju.fact.pillarFacts.day.stem = '병'
  const duplicateStructural = deriveSajuLineageStructuralResults(duplicateBase)
  const duplicateRule = duplicateStructural.categories.unresolvedRules.find(item => item.ruleId === 'rule.ziping.yin-month-exposure-contrast.v0')
  assert.equal(duplicateRule.executionStatus, 'not_executable_by_contract')
  const duplicateSemantic = deriveSajuLineageSourceSemanticResults(duplicateBase, duplicateStructural)
  assert.equal(duplicateSemantic.categories.derivedSourceBoundedSemanticResults.some(item => item.ruleId === 'rule.ziping.yin-month-exposure-change.v0'), false)
  assert.equal(duplicateSemantic.categories.prerequisiteGaps.some(item => item.ruleId === 'rule.ziping.yin-month-exposure-change.v0'), false)

  const conflictBase = buildFrozenBase(ZIPING_P7_BIRTH_INPUT)
  const conflictStructural = deriveSajuLineageStructuralResults(conflictBase)
  const conflictedStructural = {
    ...conflictStructural,
    categories: {
      ...conflictStructural.categories,
      lineageConflicts: [{
        conflictId: 'conflict.test-yin-month-exposure',
        ruleIds: ['rule.ziping.yin-month-exposure-contrast.v0', 'rule.synthetic.other-lineage.v0'],
      }],
    },
  }
  const conflictSemantic = deriveSajuLineageSourceSemanticResults(conflictBase, conflictedStructural)
  assert.equal(conflictSemantic.categories.derivedSourceBoundedSemanticResults.some(item => item.ruleId === 'rule.ziping.yin-month-exposure-change.v0'), false)
  const conflictDescriptor = conflictSemantic.categories.adoptedSemanticRules.find(item => item.ruleId === 'rule.ziping.yin-month-exposure-change.v0')
  assert.equal(conflictDescriptor.requiredStructuralResult.state, 'conflict_preserved')
  assert.equal(conflictDescriptor.conflictState.status, 'preserved_tension_fail_closed')
  assert.equal(conflictDescriptor.conflictState.winnerSelected, false)
  assert.equal(conflictSemantic.boundary.crossLineageMerge, false)
})

test('Ziping p.11 透干 plus 會支 and 有情/無情 remains an unresolved composition boundary', () => {
  const base = buildFrozenBase(ZIPING_P10_BIRTH_INPUT)
  const structural = deriveSajuLineageStructuralResults(base)
  const semantic = deriveSajuLineageSourceSemanticResults(base, structural)
  const unresolved = semantic.categories.unresolvedBoundaries.find(item => item.ruleId === 'rule.ziping.exposure-branch-sentiment.v0')

  assert.ok(unresolved)
  assert.equal(unresolved.ruleStatus, 'unresolved')
  assert.equal(unresolved.executionStatus, 'not_executable_by_contract')
  assert.equal(unresolved.output, null)
  assert.equal(unresolved.requiredStructuralResult.state, 'not_required')
  assert.equal(unresolved.semanticRoleResult.materialized, false)
  assert.ok(unresolved.applicability.some(item => item.includes('source-defined 會支')))
  assert.ok(unresolved.stopConditions.some(item => item.includes('transition')))
  assert.equal(unresolved.provenance.locatorIds[0], 'ziping-p11-exposed-stem-and-branch-context')
  assert.equal(semantic.categories.derivedSourceBoundedSemanticResults.some(item => item.ruleId === 'rule.ziping.exposure-branch-sentiment.v0'), false)
})

test('Ziping p.10 semantic result fails closed when its structural exposure prerequisite is incomplete', () => {
  const base = buildFrozenBase(ZIPING_P10_BIRTH_INPUT)
  base.systems.saju.fact.pillarFacts.hour.stem = null
  const structural = deriveSajuLineageStructuralResults(base)
  const gap = structural.categories.prerequisiteGaps.find(item => item.ruleId === 'rule.ziping.chen-exposure-inventory.v0')
  assert.ok(gap)
  assert.ok(gap.unsatisfiedConditions.includes('complete_chen_exposure_input_missing'))

  const semantic = deriveSajuLineageSourceSemanticResults(base, structural)
  assert.equal(semantic.categories.derivedSourceBoundedSemanticResults.length, 0)
  const semanticGap = semantic.categories.prerequisiteGaps.find(item => item.ruleId === 'rule.ziping.chen-exposure-use-role.v0')
  assert.ok(semanticGap)
  assert.equal(semanticGap.structuralGapResultId, gap.resultId)
  assert.deepEqual(semanticGap.requiredStructuralResult, {
    ruleIds: ['rule.ziping.chen-exposure-inventory.v0'],
    resultIds: [],
    state: 'blocked_missing',
  })
  assert.equal(semanticGap.conflictState.status, 'not_observed')
  assert.equal(semantic.boundary.personalMeaning, true)
  assert.equal(semantic.boundary.publicBaseMutation, false)
})

test('Ziping p.10 semantic result preserves a structural lineage conflict instead of selecting a winner', () => {
  const base = buildFrozenBase(ZIPING_P10_BIRTH_INPUT)
  const structural = deriveSajuLineageStructuralResults(base)
  const conflictedStructural = {
    ...structural,
    categories: {
      ...structural.categories,
      lineageConflicts: [{
        conflictId: 'conflict.test-chen-exposure',
        ruleIds: ['rule.ziping.chen-exposure-inventory.v0', 'rule.synthetic.other-lineage.v0'],
      }],
    },
  }
  const semantic = deriveSajuLineageSourceSemanticResults(base, conflictedStructural)
  assert.equal(semantic.categories.derivedSourceBoundedSemanticResults.length, 0)
  assert.deepEqual(semantic.categories.lineageConflicts, [{
    conflictId: 'conflict.test-chen-exposure',
    classification: 'lineage_conflict',
    ruleIds: ['rule.ziping.chen-exposure-inventory.v0'],
    sourceIds: ['saju-source-ziping-zhenquan'],
    status: 'preserved_tension_fail_closed',
    reason: 'semantic result was not materialized because its structural prerequisite conflict was preserved',
    deterministic: true,
    noPersonalMeaning: true,
  }])
  const adopted = semantic.categories.adoptedSemanticRules.find(item => item.ruleId === 'rule.ziping.chen-exposure-use-role.v0')
  assert.equal(adopted.conflictState.status, 'preserved_tension_fail_closed')
  assert.equal(adopted.conflictState.conflictId, 'conflict.test-chen-exposure')
  assert.equal(adopted.requiredStructuralResult.state, 'conflict_preserved')
  assert.equal(adopted.conflictState.winnerSelected, false)
  assert.equal(semantic.boundary.crossLineageMerge, false)
})

test('real frozen Base yields deterministic structural results with explicit prerequisite gaps and unresolved lanes', () => {
  const base = buildFrozenBase()
  const first = deriveSajuLineageStructuralResults(base)
  const second = deriveSajuLineageStructuralResults(base)

  assert.deepEqual(first, second)
  assert.equal(first.contractValidation.valid, true)
  assert.equal(first.baseValidation.valid, true)
  assert.equal(first.categories.executableRules.length, 15)
  assert.equal(first.categories.derivedStructuralResults.length, 15)
  assert.equal(first.categories.prerequisiteGaps.length, 1)
  assert.equal(first.categories.unresolvedRules.length, 5)
  assert.equal(first.categories.unsupportedRules.length, 2)
  assert.equal(first.categories.notApplicableRules.length, 6)
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

test('source-bounded semantic lexicon preserves five independent vocabularies and common semantic remains empty', () => {
  assert.deepEqual(checkSajuSourceBoundedSemanticLexicon(), [])
  assert.equal(SAJU_SOURCE_BOUNDED_SEMANTIC_LEXICON.length, 43)
  assert.ok(SAJU_SOURCE_BOUNDED_SEMANTIC_LEXICON.every(entry => SAJU_SOURCE_BOUNDED_SEMANTIC_LEXICON_STATUSES.includes(entry.status)))
  assert.deepEqual(
    Object.fromEntries(
      ['ziping_local_export', 'yuanhai_local_export', 'sanming_local_export', 'ditian_local_export', 'qiongtong_local_export']
        .map(lineage => [lineage, Object.fromEntries(
          [...new Set(SAJU_SOURCE_BOUNDED_SEMANTIC_LEXICON.filter(entry => entry.lineage === lineage).map(entry => entry.status))]
            .map(status => [status, SAJU_SOURCE_BOUNDED_SEMANTIC_LEXICON.filter(entry => entry.lineage === lineage && entry.status === status).length]),
        )]),
    ),
    {
      ziping_local_export: { adopted_semantic_entry: 3, context_bound_entry: 3, unresolved: 1, unsupported: 1 },
      yuanhai_local_export: { context_bound_entry: 1, adopted_semantic_entry: 2, unresolved: 1, unsupported: 2 },
      sanming_local_export: { adopted_semantic_entry: 5, unresolved: 1, unsupported: 1 },
      ditian_local_export: { adopted_semantic_entry: 4, context_bound_entry: 2, unresolved: 2 },
      qiongtong_local_export: { adopted_semantic_entry: 1, unresolved: 1, context_bound_entry: 11, unsupported: 1 },
    },
  )
  assert.deepEqual(SAJU_SOURCE_SEMANTIC_LEXICON_COMPOSITION_READINESS.commonSemanticCandidates, [])
  assert.equal(SAJU_SOURCE_SEMANTIC_LEXICON_COMPOSITION_READINESS.compositionReady, false)
  assert.equal(SAJU_LINEAGE_READING_GRAMMAR.sourceBoundedSemanticLexicon.commonSemanticCandidates.length, 0)
  assert.ok(SAJU_SOURCE_BOUNDED_SEMANTIC_LEXICON.every(entry => entry.sourceIds.length === 1 && entry.provenance.sourceIds.length === 1))
})

test('semantic lexicon lookup preserves Base -> lineage result -> source term provenance without personal synthesis', () => {
  const base = buildFrozenBase(ZIPING_P10_BIRTH_INPUT)
  const structural = deriveSajuLineageStructuralResults(base)
  const first = deriveSajuSourceBoundedSemanticLexiconEntries(base, structural)
  const second = deriveSajuSourceBoundedSemanticLexiconEntries(base, structural)

  assert.deepEqual(first, second)
  assert.equal(first.lexiconValidation.valid, true)
  assert.equal(first.boundary.noRecalculation, true)
  assert.equal(first.boundary.noPersonalMeaning, true)
  assert.equal(first.boundary.interpretationHypothesis, false)
  assert.equal(first.boundary.crossLineageMerge, false)
  const p10 = first.categories.resolvedSemanticEntries.find(entry => entry.entryId === 'lexicon.ziping.p10-role-labels.v0')
  assert.ok(p10)
  assert.deepEqual(p10.linkedStructuralRuleIds, ['rule.ziping.chen-exposure-inventory.v0'])
  assert.deepEqual(p10.linkedSemanticRuleIds, ['rule.ziping.chen-exposure-use-role.v0'])
  assert.equal(p10.provenance.chain.structuralRuleIds[0], 'rule.ziping.chen-exposure-inventory.v0')
  assert.equal(p10.provenance.chain.semanticRuleIds[0], 'rule.ziping.chen-exposure-use-role.v0')
  assert.equal(p10.provenance.chain.structuralResultIds.length, 1)
  assert.equal(p10.provenance.chain.semanticResultIds.length, 1)
  assert.equal(p10.sourceTerm, '偏財 · 正印 · 月劫')
  assert.equal(p10.noPersonalMeaning, true)
  assert.equal(p10.interpretationHypothesis, false)
  assert.ok(first.categories.catalogSemanticEntries.some(entry => entry.entryId === 'lexicon.ziping.p3-life-cycle-terms.v0'))
  assert.ok(first.categories.unsupportedEntries.some(entry => entry.entryId === 'lexicon.qiongtong-five-phase-nature.v0'))
  assert.deepEqual(first.categories.commonSemanticCandidates, [])
})

test('semantic lexicon lookup fails closed on missing result and preserved cross-lineage ambiguity', () => {
  const missingBase = buildFrozenBase(ZIPING_P10_BIRTH_INPUT)
  missingBase.systems.saju.fact.pillarFacts.hour.stem = null
  const missingStructural = deriveSajuLineageStructuralResults(missingBase)
  const missing = deriveSajuSourceBoundedSemanticLexiconEntries(missingBase, missingStructural)
  assert.equal(missing.categories.resolvedSemanticEntries.some(entry => entry.entryId === 'lexicon.ziping.p10-role-labels.v0'), false)
  assert.ok(missing.categories.blockedEntries.some(entry => entry.entryId === 'lexicon.ziping.p10-role-labels.v0'))
  assert.equal(missing.boundary.crossLineageMerge, false)

  const base = buildFrozenBase(ZIPING_P10_BIRTH_INPUT)
  const structural = deriveSajuLineageStructuralResults(base)
  const conflictedStructural = {
    ...structural,
    categories: {
      ...structural.categories,
      lineageConflicts: [{
        conflictId: 'conflict.test-semantic-lexicon',
        ruleIds: ['rule.ziping.chen-exposure-inventory.v0', 'rule.ditian.shape-example-inventory.v0'],
        sourceIds: ['saju-source-ziping-zhenquan', 'saju-source-ditian-sui'],
        status: 'preserved_tension_fail_closed',
      }],
    },
  }
  const conflicted = deriveSajuSourceBoundedSemanticLexiconEntries(base, conflictedStructural)
  assert.equal(conflicted.categories.resolvedSemanticEntries.some(entry => entry.entryId === 'lexicon.ziping.p10-role-labels.v0'), false)
  const ambiguous = conflicted.categories.ambiguousEntries.find(entry => entry.entryId === 'lexicon.ziping.p10-role-labels.v0')
  assert.ok(ambiguous)
  assert.equal(ambiguous.conflictState.status, 'preserved_tension_fail_closed')
  assert.equal(ambiguous.conflictState.winnerSelected, false)
  assert.equal(conflicted.boundary.crossLineageMerge, false)
  assert.ok(conflicted.categories.lineageConflicts.some(item => item.entryId === 'lexicon.ziping.p10-role-labels.v0'))
})

test('semantic lexicon rejects a cross-lineage result even when a named rule id is present', () => {
  const base = buildFrozenBase(ZIPING_P10_BIRTH_INPUT)
  const structural = deriveSajuLineageStructuralResults(base)
  const mismatchedStructural = {
    ...structural,
    categories: {
      ...structural.categories,
      derivedStructuralResults: structural.categories.derivedStructuralResults.map(result => result.ruleId === 'rule.ziping.chen-exposure-inventory.v0'
        ? { ...result, lineage: 'ditian_local_export', sourceIds: ['saju-source-ditian-sui'] }
        : result),
    },
  }
  const result = deriveSajuSourceBoundedSemanticLexiconEntries(base, mismatchedStructural)
  assert.equal(result.categories.resolvedSemanticEntries.some(entry => entry.entryId === 'lexicon.ziping.p10-role-labels.v0'), false)
  const ambiguous = result.categories.ambiguousEntries.find(entry => entry.entryId === 'lexicon.ziping.p10-role-labels.v0')
  assert.ok(ambiguous)
  assert.equal(ambiguous.lookupStatus, 'conflict_preserved')
  assert.equal(ambiguous.conflictState.sourceMismatch, true)
  assert.equal(result.boundary.crossLineageMerge, false)
})

test('source-local composition inventory separates adopted composition, bounded transition, unresolved surfaces, and unsupported surfaces', () => {
  assert.deepEqual(checkSajuSourceLocalSemanticComposition(), [])
  assert.deepEqual(
    SAJU_SOURCE_LOCAL_SEMANTIC_COMPOSITION_RULES.filter(rule => rule.status === 'adopted_composition').map(rule => rule.compositionId),
    ['composition.ziping.p10-chen-use-components.v0'],
  )
  assert.deepEqual(
    SAJU_SOURCE_LOCAL_SEMANTIC_COMPOSITION_RULES.filter(rule => rule.status === 'bounded_role_use_transition').map(rule => rule.compositionId),
    ['transition.ziping.p7-yin-month-use-change.v0'],
  )
  assert.equal(SAJU_SOURCE_LOCAL_SEMANTIC_COMPOSITION_RULES.filter(rule => rule.status === 'unresolved').length, 6)
  assert.equal(SAJU_SOURCE_LOCAL_SEMANTIC_COMPOSITION_RULES.filter(rule => rule.status === 'unsupported').length, 2)
  assert.equal(SAJU_SOURCE_LOCAL_SEMANTIC_COMPOSITION_READINESS.localCompositionReady, true)
  assert.equal(SAJU_SOURCE_LOCAL_SEMANTIC_COMPOSITION_READINESS.compositionReady, false)
  assert.equal(SAJU_SOURCE_LOCAL_SEMANTIC_COMPOSITION_READINESS.globalCompositionReady, false)
  assert.equal(SAJU_SOURCE_LOCAL_SEMANTIC_COMPOSITION_READINESS.interpretationHypothesisReady, false)
  assert.equal(SAJU_SOURCE_LOCAL_SEMANTIC_COMPOSITION_READINESS.sourceProvidesLocalCombinationRule, true)
  assert.equal(SAJU_SOURCE_LOCAL_SEMANTIC_COMPOSITION_READINESS.sourceProvidesGlobalCombinationRule, false)
  assert.deepEqual(SAJU_SOURCE_LOCAL_SEMANTIC_COMPOSITION_READINESS.commonCompositionCandidates, [])
  assert.deepEqual(checkSajuLineageReadingGrammar(), [])
  assert.deepEqual(SAJU_LINEAGE_READING_GRAMMAR.sourceLocalSemanticComposition.commonCompositionCandidates, [])
  assert.equal(SAJU_LINEAGE_READING_GRAMMAR.sourceLocalSemanticComposition.interpretationHypothesisReady, false)
})

test('source-local composition closability review freezes unresolved boundaries without promoting near candidates', () => {
  assert.deepEqual(checkSajuSourceLocalSemanticCompositionClosabilityReview(), [])
  assert.deepEqual(
    SAJU_SOURCE_LOCAL_SEMANTIC_COMPOSITION_CLOSABILITY_REVIEW.map(review => review.compositionId),
    SAJU_SOURCE_LOCAL_SEMANTIC_COMPOSITION_RULES.filter(rule => rule.status === 'unresolved').map(rule => rule.compositionId),
  )
  assert.deepEqual(
    SAJU_SOURCE_LOCAL_SEMANTIC_COMPOSITION_CLOSABILITY_REVIEW
      .filter(review => review.closability === 'near_candidate')
      .map(review => review.compositionId),
    [
      'composition.yuanhai.p197-role-prohibition.v0',
      'composition.sanming.stem-branch-transformation.v0',
    ],
  )
  assert.ok(SAJU_SOURCE_LOCAL_SEMANTIC_COMPOSITION_CLOSABILITY_REVIEW.every(review => review.endToEndClosed === false && review.promotionDecision === 'retain_unresolved_v0'))
  assert.ok(SAJU_SOURCE_LOCAL_SEMANTIC_COMPOSITION_CLOSABILITY_REVIEW
    .filter(review => review.closability === 'v0_frozen')
    .every(review => review.requiredAdditionalCheck === null))
  assert.ok(SAJU_SOURCE_LOCAL_SEMANTIC_COMPOSITION_CLOSABILITY_REVIEW
    .filter(review => review.closability === 'near_candidate')
    .every(review => typeof review.requiredAdditionalCheck === 'string' && review.requiredAdditionalCheck.length > 0))

  assert.equal(SAJU_SOURCE_LOCAL_SEMANTIC_COMPOSITION_FREEZE_DECISION.v0FreezeReady, true)
  assert.equal(SAJU_SOURCE_LOCAL_SEMANTIC_COMPOSITION_FREEZE_DECISION.compositionExecutionReady, false)
  assert.deepEqual(SAJU_SOURCE_LOCAL_SEMANTIC_COMPOSITION_FREEZE_DECISION.endToEndClosedCompositionIds, [])
  assert.equal(SAJU_SOURCE_LOCAL_SEMANTIC_COMPOSITION_FREEZE_DECISION.interpretationHypothesisLayerReady, false)
  assert.deepEqual(SAJU_SOURCE_LOCAL_SEMANTIC_COMPOSITION_READINESS.freezeDecision, SAJU_SOURCE_LOCAL_SEMANTIC_COMPOSITION_FREEZE_DECISION)

  const base = buildFrozenBase(ZIPING_P10_COMPOSITION_BIRTH_INPUT)
  const first = deriveSajuSourceLocalSemanticCompositions(base)
  const second = deriveSajuSourceLocalSemanticCompositions(base)
  assert.deepEqual(first, second)
  assert.equal(first.categories.derivedCompositionResults.length, 1)
  assert.deepEqual(first.categories.unresolvedCompositions.map(item => item.compositionId), SAJU_SOURCE_LOCAL_SEMANTIC_COMPOSITION_READINESS.unresolvedCompositionIds)
  assert.ok(first.categories.unresolvedCompositions.every(item => item.output === null && item.executionStatus === 'not_executable_by_contract'))
  assert.equal(first.readiness.v0FreezeReady, true)
  assert.equal(first.readiness.compositionReady, false)
  assert.equal(first.readiness.interpretationHypothesisReady, false)
})

test('Ziping p.10 local composition deterministically preserves single, multiple, branch-only, and combined source components', () => {
  const cases = [
    [ZIPING_P10_BIRTH_INPUT, 'exposure_only_single', 1, 0, 'satisfied', 'satisfied'],
    [ZIPING_P10_MULTI_BIRTH_INPUT, 'exposure_only_multiple', 2, 0, 'satisfied', 'satisfied'],
    [ZIPING_P10_BRANCH_ONLY_BIRTH_INPUT, 'branch_meeting_only', 0, 1, 'not_required_for_no_exposure', 'not_required_for_no_exposure'],
    [ZIPING_P10_COMPOSITION_BIRTH_INPUT, 'exposure_and_branch_meeting', 1, 1, 'satisfied', 'satisfied'],
  ]

  for (const [input, mode, exposureCount, meetingCount, semanticState, lexiconState] of cases) {
    const base = buildFrozenBase(input)
    const before = JSON.stringify(base)
    const first = deriveSajuSourceLocalSemanticCompositions(base)
    const second = deriveSajuSourceLocalSemanticCompositions(base)
    assert.deepEqual(first, second, mode)
    assert.equal(first.compositionValidation.valid, true)
    assert.equal(first.baseValidation.valid, true)
    assert.deepEqual(first.categories.lineageConflicts, [])
    const result = first.categories.derivedCompositionResults.find(item => item.compositionId === 'composition.ziping.p10-chen-use-components.v0')
    assert.ok(result, mode)
    assert.equal(result.executionStatus, 'executable_from_frozen_base', mode)
    assert.equal(result.output.compositionMode, mode)
    assert.equal(result.output.exposureComponents.length, exposureCount, mode)
    assert.equal(result.output.branchMeetingComponents.length, meetingCount, mode)
    assert.equal(result.output.winnerSelected, false, mode)
    assert.equal(result.requiredStructuralResults.state, 'satisfied', mode)
    assert.equal(result.requiredSemanticResults.state, semanticState, mode)
    assert.equal(result.requiredSemanticLexiconEntries.state, lexiconState, mode)
    assert.deepEqual(result.provenance.chain.structuralRuleIds, [
      'rule.ziping.chen-exposure-inventory.v0',
      'rule.ziping.branch-relation-inventory.v0',
    ], mode)
    assert.deepEqual(result.provenance.chain.semanticRuleIds, ['rule.ziping.chen-exposure-use-role.v0'], mode)
    assert.deepEqual(result.provenance.chain.semanticLexiconEntryIds, ['lexicon.ziping.p10-role-labels.v0'], mode)
    assert.equal(result.provenance.sourceIds[0], 'saju-source-ziping-zhenquan', mode)
    assert.equal(result.provenance.lineage, 'ziping_local_export', mode)
    assert.equal(result.noRecalculation, true, mode)
    assert.equal(result.noPersonalMeaning, true, mode)
    assert.equal(result.noCrossLineageMerge, true, mode)
    assert.equal(result.interpretationHypothesis, false, mode)
    assert.equal(JSON.stringify(base), before, mode)
  }

  const combined = deriveSajuSourceLocalSemanticCompositions(buildFrozenBase(ZIPING_P10_COMPOSITION_BIRTH_INPUT))
    .categories.derivedCompositionResults.find(item => item.compositionId === 'composition.ziping.p10-chen-use-components.v0')
  assert.deepEqual(combined.output.exposureComponents, [{ position: 'hour', sourceStem: '癸', sourceRole: '正印' }])
  assert.deepEqual(combined.output.branchMeetingComponents, [{
    relationName: '삼합',
    sourceBranches: ['申', '子', '辰'],
    positions: ['year', 'month', 'day'],
    sourceUseComponent: '水印',
  }])
  assert.equal(combined.output.sourceCombinationStatement, '一透则一用；兼透则兼用；透而又会，则透与会并用')
  assert.equal(combined.requiredSemanticResults.resultIds.length, 1)
  assert.equal(combined.requiredSemanticLexiconEntries.resultIds.length, 2)
})

test('Ziping p.7 source-local transition remains bounded and does not create global 用神 priority', () => {
  const base = buildFrozenBase(ZIPING_P7_BIRTH_INPUT)
  const first = deriveSajuSourceLocalSemanticCompositions(base)
  const second = deriveSajuSourceLocalSemanticCompositions(base)
  assert.deepEqual(first, second)
  const transition = first.categories.derivedCompositionResults.find(item => item.compositionId === 'transition.ziping.p7-yin-month-use-change.v0')
  assert.ok(transition)
  assert.equal(transition.classification, 'derived_bounded_role_use_transition_result')
  assert.equal(transition.status, 'bounded_role_use_transition')
  assert.equal(transition.output.sourceSelectionStatement, '同知得以作主')
  assert.equal(transition.output.winnerSelected, false)
  assert.equal(transition.requiredStructuralResults.state, 'satisfied')
  assert.equal(transition.requiredSemanticResults.state, 'satisfied')
  assert.equal(transition.requiredSemanticLexiconEntries.state, 'satisfied')
  assert.deepEqual(transition.provenance.chain.structuralRuleIds, ['rule.ziping.yin-month-exposure-contrast.v0'])
  assert.deepEqual(transition.provenance.chain.semanticRuleIds, ['rule.ziping.yin-month-exposure-change.v0'])
  assert.deepEqual(transition.provenance.chain.semanticLexiconEntryIds, ['lexicon.ziping.p7-selection-clause.v0'])
  assert.equal(transition.noPersonalMeaning, true)
  assert.equal(transition.interpretationHypothesis, false)
  assert.equal(first.readiness.compositionReady, false)
  assert.equal(first.readiness.interpretationHypothesisReady, false)
})

test('source-local composition fails closed on missing prerequisites, duplicate meetings, source mismatch, and preserves unresolved p.11', () => {
  const base = buildFrozenBase(ZIPING_P10_COMPOSITION_BIRTH_INPUT)
  const structural = deriveSajuLineageStructuralResults(base)
  const branchResult = structural.categories.derivedStructuralResults.find(item => item.ruleId === 'rule.ziping.branch-relation-inventory.v0')
  const missingBranch = {
    ...structural,
    categories: {
      ...structural.categories,
      derivedStructuralResults: structural.categories.derivedStructuralResults.filter(item => item.ruleId !== 'rule.ziping.branch-relation-inventory.v0'),
      prerequisiteGaps: [...structural.categories.prerequisiteGaps, {
        resultId: 'result.rule.ziping.branch-relation-inventory.v0',
        ruleId: 'rule.ziping.branch-relation-inventory.v0',
        reason: 'test missing relation inventory',
      }],
    },
  }
  const blocked = deriveSajuSourceLocalSemanticCompositions(base, missingBranch)
  assert.equal(blocked.categories.derivedCompositionResults.some(item => item.compositionId === 'composition.ziping.p10-chen-use-components.v0'), false)
  const blockedP10 = blocked.categories.blockedCompositions.find(item => item.compositionId === 'composition.ziping.p10-chen-use-components.v0')
  assert.ok(blockedP10)
  assert.equal(blockedP10.executionStatus, 'blocked_missing_base_fact')
  assert.equal(blockedP10.requiredStructuralResults.state, 'blocked_missing')
  assert.equal(blockedP10.noPersonalMeaning, true)

  const duplicateRelation = {
    ...branchResult,
    output: {
      ...branchResult.output,
      relations: [...branchResult.output.relations, {
        name: '삼합',
        branches: ['신', '자', '진'],
        positions: ['year', 'month', 'day'],
      }],
    },
  }
  const duplicateStructural = {
    ...structural,
    categories: {
      ...structural.categories,
      derivedStructuralResults: structural.categories.derivedStructuralResults.map(item => item.ruleId === 'rule.ziping.branch-relation-inventory.v0' ? duplicateRelation : item),
    },
  }
  const ambiguous = deriveSajuSourceLocalSemanticCompositions(base, duplicateStructural)
  assert.equal(ambiguous.categories.derivedCompositionResults.some(item => item.compositionId === 'composition.ziping.p10-chen-use-components.v0'), false)
  const duplicateResult = ambiguous.categories.ambiguousCompositions.find(item => item.compositionId === 'composition.ziping.p10-chen-use-components.v0')
  assert.ok(duplicateResult)
  assert.equal(duplicateResult.executionStatus, 'ambiguous_composition')
  assert.equal(duplicateResult.conflictState.winnerSelected, false)

  const mismatchedStructural = {
    ...structural,
    categories: {
      ...structural.categories,
      derivedStructuralResults: structural.categories.derivedStructuralResults.map(item => item.ruleId === 'rule.ziping.chen-exposure-inventory.v0'
        ? { ...item, work: '滴天髓', lineage: 'ditian_local_export', sourceIds: ['saju-source-ditian-sui'] }
        : item),
    },
  }
  const sourceMismatch = deriveSajuSourceLocalSemanticCompositions(base, mismatchedStructural)
  assert.equal(sourceMismatch.categories.derivedCompositionResults.some(item => item.compositionId === 'composition.ziping.p10-chen-use-components.v0'), false)
  const mismatchResult = sourceMismatch.categories.ambiguousCompositions.find(item => item.compositionId === 'composition.ziping.p10-chen-use-components.v0')
  assert.ok(mismatchResult)
  assert.equal(mismatchResult.conflictState.status, 'preserved_tension_fail_closed')
  assert.equal(mismatchResult.conflictState.sourceMismatch, true)
  assert.equal(sourceMismatch.categories.lineageConflicts[0].status, 'preserved_tension_fail_closed')
  assert.equal(sourceMismatch.boundary.crossLineageMerge, false)

  const p11 = sourceMismatch.categories.unresolvedCompositions.find(item => item.compositionId === 'composition.ziping.p11-exposure-branch-sentiment.v0')
  assert.ok(p11)
  assert.equal(p11.output, null)
  assert.equal(p11.executionStatus, 'not_executable_by_contract')
  assert.equal(sourceMismatch.categories.derivedCompositionResults.some(item => item.compositionId === 'composition.ziping.p11-exposure-branch-sentiment.v0'), false)
})

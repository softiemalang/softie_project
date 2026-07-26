import test from 'node:test'
import assert from 'node:assert/strict'
import {
  createZiweiCalculationContext,
  createZiweiInterpretationContext,
  ZIWEI_PALACE_DEFINITIONS,
  DEFAULT_ZIWEI_RULE_SET,
} from '../src/ziwei/ziweiContract.js'

test('ziweiContract: creates normalized calculation context with fail-closed state on incomplete inputs', () => {
  const context = createZiweiCalculationContext({
    input: { subjectName: '자미테스트', gender: 'female' },
  })

  assert.equal(context.input.subjectName, '자미테스트')
  assert.equal(context.input.ruleSet.calendar, 'traditional_lunar')
  assert.equal(context.chart.palaces.length, 0)
  assert.equal(context.chart.mingGong, null)
  assert.equal(context.chart.fiveElementsBureau, null)
  assert.equal(context.calculationMeta.confidence, 'low')
  assert.equal(context.calculationMeta.verificationStatus, 'needs_external_verification')
  assert.equal(context.calculationMeta.calculationStatus, 'partial')
})

test('ziweiContract: maps calculation context to ZiweiInterpretationContext with consensus & confidence', () => {
  const calcContext = createZiweiCalculationContext({
    input: { subjectName: '불확실자미' },
    chart: {
      mingGong: { id: 'life', name: '명궁', branch: '寅', index: 2 },
      majorStars: [{ id: 'ziwei', name: '자미', category: 'major' }],
    },
    candidates: {
      candidateOrigin: 'unknown_hour_branch',
      alternatives: [{ mingGongBranch: '寅' }, { mingGongBranch: '卯' }],
    },
    calculationMeta: {
      confidence: 'low',
      verificationStatus: 'candidate_required',
      warnings: ['출생시각 미상으로 인해 12개 자미 명반 후보가 존재합니다.'],
    },
  })

  const interpContext = createZiweiInterpretationContext(calcContext)

  assert.equal(interpContext.systemType, 'ziwei')
  assert.equal(interpContext.candidateSetConsensus.factual.mingGongBranch, '寅')
  assert.equal(interpContext.candidateSetConsensus.factual.majorStarCount, 1)
  assert.equal(interpContext.candidateFacts.length, 2)
  assert.equal(interpContext.calculationConfidence.stateContract.confidence, 'low')
  assert.ok(interpContext.interpretationWarnings.some((w) => w.includes('복수의 가능성이 존재하므로')))
})

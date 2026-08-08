import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import {
  calculateTianfuBranch,
  calculateZiweiBranch,
  getTianfuModeConvention,
  TIANFU_MODES,
  TIANFU_SERIES_OFFSETS,
  ZIWEI_SERIES_OFFSETS,
} from '../src/ziwei/starPlacementRules.js'
import { resolve14MajorStars } from '../src/ziwei/starResolver.js'
import { prepareThreeSystemInterpretationData } from '../src/interpretationPrep/threeSystemPrepPipeline.js'
import { compareZiweiFixture } from '../src/interpretationPrep/externalValidationRunner.js'
import { ZIWEI_EXTERNAL_FIXTURES } from '../src/ziwei/externalZiweiFixtures.js'
import { RECONFIRMED_SOURCE_TABLE, branchIndex } from '../src/ziwei/tianfuPlacementDiscrepancyRelations.js'

const BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']
const TIANFU_STAR_IDS = TIANFU_SERIES_OFFSETS.map((star) => star.id)
const ZIWEI_STAR_IDS = ZIWEI_SERIES_OFFSETS.map((star) => star.id)
const MATRIX = Array.from({ length: 5 }, (_, index) => index + 2).flatMap((bureauNumber) => (
  Array.from({ length: 30 }, (_, index) => ({ bureauNumber, lunarDay: index + 1 }))
))

const branchAt = (index) => BRANCHES[(index % 12 + 12) % 12]
const starById = (result, id) => result.majorStars.find((star) => star.id === id)

const placementProjection = (result) => ({
  ziweiBranch: result.ziweiBranch,
  tianfuBranch: result.tianfuBranch,
  majorStars: result.majorStars.map(({ id, series, palaceBranch, palaceId, palaceName }) => ({
    id,
    series,
    palaceBranch,
    palaceId,
    palaceName,
  })),
})

test('Tianfu mode contract exposes exactly legacy and source_aligned', () => {
  assert.deepEqual(Object.values(TIANFU_MODES), ['legacy', 'source_aligned'])
  assert.deepEqual(getTianfuModeConvention(), {
    mode: 'legacy',
    tianfuMethod: 'opposite_yin_shen_axis',
    tianfuFormula: '(10-Z)%12',
  })
  assert.deepEqual(getTianfuModeConvention('source_aligned'), {
    mode: 'source_aligned',
    tianfuMethod: 'opposite_chen_xu_axis',
    tianfuFormula: '(4-Z)%12',
  })
})

test('legacy omission and explicit legacy preserve placement output and tracked baseline', () => {
  const baseline = JSON.parse(readFileSync(
    'artifacts/ziwei-tianfu-star-placement-clean-rule-seed-pilot-v0/complete.json',
    'utf8',
  ))

  for (const { bureauNumber, lunarDay } of MATRIX) {
    const omitted = resolve14MajorStars({ bureauNumber, lunarDay, palaces: [] })
    const explicit = resolve14MajorStars({ bureauNumber, lunarDay, palaces: [], tianfuMode: 'legacy' })
    assert.deepEqual(omitted, explicit, `omitted/explicit legacy drift at ${bureauNumber}/${lunarDay}`)

    const baselineRow = baseline.comparison.domains.integrated.rows.find(
      (row) => row.input.bureauNumber === bureauNumber && row.input.lunarDay === lunarDay,
    )
    assert.ok(baselineRow, `missing tracked baseline row at ${bureauNumber}/${lunarDay}`)
    assert.equal(omitted.ziweiBranch, baselineRow.productionEngine.ziweiBranch)
    assert.equal(omitted.tianfuBranch, baselineRow.productionEngine.branch)
    assert.equal(omitted.starPlacementMeta.tianfuMode, 'legacy')
  }

  assert.deepEqual(placementProjection(
    resolve14MajorStars({ bureauNumber: 2, lunarDay: 1, palaces: [] }),
  ), {
    ziweiBranch: '丑',
    tianfuBranch: '酉',
    majorStars: [
      { id: 'ziwei', series: 'ziwei', palaceBranch: '丑', palaceId: null, palaceName: null },
      { id: 'tianji', series: 'ziwei', palaceBranch: '子', palaceId: null, palaceName: null },
      { id: 'taiyang', series: 'ziwei', palaceBranch: '戌', palaceId: null, palaceName: null },
      { id: 'wugu', series: 'ziwei', palaceBranch: '酉', palaceId: null, palaceName: null },
      { id: 'tiandong', series: 'ziwei', palaceBranch: '申', palaceId: null, palaceName: null },
      { id: 'lianzhen', series: 'ziwei', palaceBranch: '巳', palaceId: null, palaceName: null },
      { id: 'tianfu', series: 'tianfu', palaceBranch: '酉', palaceId: null, palaceName: null },
      { id: 'taiyin', series: 'tianfu', palaceBranch: '戌', palaceId: null, palaceName: null },
      { id: 'tanlang', series: 'tianfu', palaceBranch: '亥', palaceId: null, palaceName: null },
      { id: 'jumen', series: 'tianfu', palaceBranch: '子', palaceId: null, palaceName: null },
      { id: 'tianxiang', series: 'tianfu', palaceBranch: '丑', palaceId: null, palaceName: null },
      { id: 'tianliang', series: 'tianfu', palaceBranch: '寅', palaceId: null, palaceName: null },
      { id: 'qisai', series: 'tianfu', palaceBranch: '卯', palaceId: null, palaceName: null },
      { id: 'pojun', series: 'tianfu', palaceBranch: '未', palaceId: null, palaceName: null },
    ],
  })
})

test('source observation, mathematical relation, and source_aligned implementation remain separate', () => {
  // Source observation: the re-confirmed source cells are tested as cells, not inferred from +6.
  assert.deepEqual(RECONFIRMED_SOURCE_TABLE[0], ['子', '辰'])
  assert.deepEqual(RECONFIRMED_SOURCE_TABLE, [
    ['子', '辰'], ['丑', '卯'], ['寅', '寅'], ['卯', '丑'], ['辰', '子'], ['巳', '亥'],
    ['午', '戌'], ['未', '酉'], ['申', '申'], ['酉', '未'], ['戌', '午'], ['亥', '巳'],
  ])

  // Mathematical relation: this records the known numeric rotation only.
  for (const ziweiBranch of BRANCHES) {
    const legacy = branchIndex(calculateTianfuBranch(ziweiBranch, { tianfuMode: 'legacy' }))
    const sourceAligned = branchIndex(calculateTianfuBranch(ziweiBranch, { tianfuMode: 'source_aligned' }))
    assert.equal(sourceAligned, (legacy + 6) % 12, `rotation-06 relation at ${ziweiBranch}`)
  }

  // Implementation comparison: source_aligned must match the source convention over all 150 inputs.
  for (const { bureauNumber, lunarDay } of MATRIX) {
    const result = resolve14MajorStars({ bureauNumber, lunarDay, palaces: [], tianfuMode: 'source_aligned' })
    const sourceRow = RECONFIRMED_SOURCE_TABLE.find(([ziweiBranch]) => ziweiBranch === result.ziweiBranch)
    assert.equal(result.tianfuBranch, sourceRow[1], `source_aligned mismatch at ${bureauNumber}/${lunarDay}`)
    assert.equal(result.starPlacementMeta.tianfuMode, 'source_aligned')
    assert.equal(result.starPlacementMeta.tianfuMethod, 'opposite_chen_xu_axis')
    assert.equal(result.starPlacementMeta.tianfuFormula, '(4-Z)%12')
  }
})

test('source_aligned preserves Ziwei series and all eight Tianfu-series relative offsets', () => {
  for (const { bureauNumber, lunarDay } of MATRIX) {
    const legacy = resolve14MajorStars({ bureauNumber, lunarDay, palaces: [] })
    const sourceAligned = resolve14MajorStars({ bureauNumber, lunarDay, palaces: [], tianfuMode: 'source_aligned' })

    assert.equal(sourceAligned.ziweiBranch, legacy.ziweiBranch)
    assert.deepEqual(
      ZIWEI_STAR_IDS.map((id) => starById(sourceAligned, id).palaceBranch),
      ZIWEI_STAR_IDS.map((id) => starById(legacy, id).palaceBranch),
    )
    assert.equal(
      (branchIndex(sourceAligned.tianfuBranch) - branchIndex(legacy.tianfuBranch) + 12) % 12,
      6,
    )

    for (const star of TIANFU_SERIES_OFFSETS) {
      const legacyStar = starById(legacy, star.id)
      const sourceStar = starById(sourceAligned, star.id)
      const legacyRelative = (branchIndex(legacyStar.palaceBranch) - branchIndex(legacy.tianfuBranch) + 12) % 12
      const sourceRelative = (branchIndex(sourceStar.palaceBranch) - branchIndex(sourceAligned.tianfuBranch) + 12) % 12
      assert.equal(legacyRelative, (star.offset + 12) % 12, `legacy offset drift for ${star.id}`)
      assert.equal(sourceRelative, (star.offset + 12) % 12, `source offset drift for ${star.id}`)
      assert.equal(
        (branchIndex(sourceStar.palaceBranch) - branchIndex(legacyStar.palaceBranch) + 12) % 12,
        6,
        `mode shift drift for ${star.id} at ${bureauNumber}/${lunarDay}`,
      )
    }
  }
})

test('invalid or malformed modes fail explicitly without legacy fallback', () => {
  for (const invalidMode of ['source', 'aligned', 'v2', '', null, 123, true, {}]) {
    assert.throws(
      () => calculateTianfuBranch('子', { tianfuMode: invalidMode }),
      /invalid_tianfu_mode/,
      `calculateTianfuBranch accepted ${String(invalidMode)}`,
    )
    const result = resolve14MajorStars({ bureauNumber: 2, lunarDay: 1, tianfuMode: invalidMode })
    assert.equal(result.status, 'failed')
    assert.equal(result.reason, 'invalid_tianfu_mode')
    assert.equal(result.tianfuBranch, null)
    assert.equal(result.starPlacementMeta.tianfuMode, null)
  }
  assert.throws(() => calculateTianfuBranch('子', null), /invalid_tianfu_mode_options/)
})

test('pipeline and external validation consumers preserve mode provenance without changing Ziwei anchor', () => {
  const input = {
    subjectName: 'compatibility-test',
    birthDate: '1997-04-21',
    birthTime: '14:40',
    targetDate: '2026-07-26',
    placeName: '대한민국',
    referenceCity: 'seoul',
    timezone: 'Asia/Seoul',
    latitude: '37.57',
    longitude: '126.97',
    gender: 'male',
    calendar: 'solar',
    isLeapMonth: false,
    timeAccuracy: 'exact',
  }
  const legacyPipeline = prepareThreeSystemInterpretationData(input)
  const sourcePipeline = prepareThreeSystemInterpretationData(input, undefined, { tianfuMode: 'source_aligned' })
  const legacyCalculation = legacyPipeline.systems.ziwei.calculationResult
  const sourceCalculation = sourcePipeline.systems.ziwei.calculationResult
  assert.equal(
    sourceCalculation.chart.majorStars.find((star) => star.id === 'ziwei').palaceBranch,
    legacyCalculation.chart.majorStars.find((star) => star.id === 'ziwei').palaceBranch,
  )
  assert.equal(legacyCalculation.calculationMeta.majorStarPlacement.tianfuMode, 'legacy')
  assert.equal(sourceCalculation.calculationMeta.majorStarPlacement.tianfuMode, 'source_aligned')
  assert.equal(sourceCalculation.calculationMeta.majorStarPlacement.tianfuMethod, 'opposite_chen_xu_axis')

  const fixture = ZIWEI_EXTERNAL_FIXTURES.find((candidate) => candidate.fixtureId === 'ziwei-ext-table-ziwei-placement')
  const comparison = compareZiweiFixture(fixture, { tianfuMode: 'source_aligned' })
  assert.equal(comparison.starPlacementProvenance.tianfuMode, 'source_aligned')
  assert.equal(comparison.observedComparison.fields[0].path, 'ziweiStarBranch')
  assert.equal(comparison.observedComparison.fields[0].status, 'matched')
})

test('source_aligned anchor cases match the canonical source convention', () => {
  const cases = [
    { bureauNumber: 2, lunarDay: 1, ziweiBranch: '丑', sourceTianfuBranch: '卯' },
    { bureauNumber: 3, lunarDay: 15, ziweiBranch: '午', sourceTianfuBranch: '戌' },
    { bureauNumber: 6, lunarDay: 22, ziweiBranch: '未', sourceTianfuBranch: '酉' },
  ]
  for (const item of cases) {
    const result = resolve14MajorStars({ ...item, palaces: [], tianfuMode: 'source_aligned' })
    assert.equal(result.ziweiBranch, item.ziweiBranch)
    assert.equal(result.tianfuBranch, item.sourceTianfuBranch)
  }
  assert.equal(calculateZiweiBranch(2, 1), '丑')
  assert.equal(branchAt(branchIndex(calculateTianfuBranch('丑', { tianfuMode: 'source_aligned' }))), '卯')
})

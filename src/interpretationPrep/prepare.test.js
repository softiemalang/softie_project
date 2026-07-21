import assert from 'node:assert/strict'
import test from 'node:test'
import { buildExportPayload, prepareInterpretationData, validatePrepInput } from './prepare.js'
import { DEFAULT_PROFILES } from './schema.js'

const FIXED_INPUT = {
  subjectName: '고정 테스트',
  birthDate: '1997-04-21',
  birthTime: '14:40',
  placeName: '서울',
  timezone: 'Asia/Seoul',
  latitude: '37.5665',
  longitude: '126.9780',
  gender: 'unspecified',
  calendar: 'solar',
  source: 'known fixture',
  timeAccuracy: 'exact',
}

test('fixed birth input produces the known four pillars and traceable features', () => {
  const result = prepareInterpretationData(FIXED_INPUT, DEFAULT_PROFILES)
  const pillars = result.systems.saju.raw.pillars

  assert.equal(`${pillars.year.value} ${pillars.month.value} ${pillars.day.value} ${pillars.hour.value}`, '정축 갑진 계사 기미')
  assert.equal(result.systems.saju.raw.dayMaster.stem, '계')
  assert.ok(result.systems.saju.features.length > 0)
  result.systems.saju.features.forEach((feature) => {
    assert.ok(feature.evidence.length > 0, `${feature.id} should include evidence`)
    feature.evidence.forEach((evidence) => assert.match(evidence.reference, /^systems\.saju\.raw\./))
  })
})

test('same input and profile produce identical calculation data', () => {
  const first = prepareInterpretationData(FIXED_INPUT, DEFAULT_PROFILES)
  const second = prepareInterpretationData(FIXED_INPUT, DEFAULT_PROFILES)

  assert.deepEqual(first, second)
})

test('unsupported systems stay explicit and do not create fake synthesis', () => {
  const result = prepareInterpretationData(FIXED_INPUT, DEFAULT_PROFILES)

  assert.equal(result.systems.ziwei.raw, null)
  assert.equal(result.systems.astrology.raw, null)
  assert.equal(result.synthesis.agreements.length, 0)
  assert.equal(result.synthesis.tensions.length, 0)
  assert.equal(result.synthesis.uncertainties.length, 1)
})

test('conversation export filters by topic and keeps model instructions', () => {
  const result = prepareInterpretationData(FIXED_INPUT, DEFAULT_PROFILES)
  const payload = buildExportPayload(result, {
    type: 'conversation',
    topicId: 'money',
    question: '재정 근거를 보고 싶다',
    generatedAt: '2026-07-21T00:00:00.000Z',
  })

  assert.equal(payload.target.topic, '재정과 가치관')
  assert.equal(payload.calculationSummary.saju.pillars.day.value, '계사')
  assert.ok(payload.instruction.includes('계산값을 임의로 변경하지 말고'))
  assert.ok(payload.uncertainties.length > 0)
})

test('input validation rejects unsupported coordinates and missing birth data', () => {
  assert.match(validatePrepInput({ ...FIXED_INPUT, birthDate: '' }), /birthDate/)
  assert.match(validatePrepInput({ ...FIXED_INPUT, birthTime: '' }), /입력하거나 모름/)
  assert.match(validatePrepInput({ ...FIXED_INPUT, birthDate: '2026-02-30' }), /실제로 존재/)
  assert.match(validatePrepInput({ ...FIXED_INPUT, birthTime: '24:10' }), /시각 범위/)
  assert.match(validatePrepInput({ ...FIXED_INPUT, birthDate: '1900-01-01' }), /1901년부터 2100년/)
  assert.match(validatePrepInput({ ...FIXED_INPUT, latitude: '91' }), /위도/)
})

test('unknown birth time omits the hour pillar and preserves time-sensitive candidates', () => {
  const result = prepareInterpretationData({
    ...FIXED_INPUT,
    birthTime: '',
    timeAccuracy: 'unknown',
  }, DEFAULT_PROFILES)
  const saju = result.systems.saju

  assert.equal(saju.raw.pillars.hour.value, null)
  assert.equal(saju.raw.pillars.hour.status, 'unknown')
  assert.deepEqual(saju.raw.pillars.day.candidates, ['계사', '갑오'])
  assert.deepEqual(saju.raw.dayMaster.candidates, ['계', '갑'])
  assert.equal(saju.inputNormalization.correctedSolarTime, null)
  assert.equal(saju.features.length, 1)
  assert.equal(saju.features[0].confidence, 'low')
  assert.match(saju.warnings.join(' '), /시주를 제외/)
})

test('solar-term boundary inputs expose year and month candidates instead of hiding precision limits', () => {
  const result = prepareInterpretationData({
    ...FIXED_INPUT,
    birthDate: '2014-02-04',
    birthTime: '07:03',
  }, DEFAULT_PROFILES)
  const saju = result.systems.saju

  assert.equal(saju.raw.calculationUncertainty.solarTermBoundary.status, 'candidate_required')
  assert.deepEqual(saju.raw.pillars.year.candidates, ['갑오', '계사'])
  assert.deepEqual(saju.raw.pillars.month.candidates, ['병인', '을축'])
  assert.equal(saju.raw.pillars.year.status, 'solar_term_sensitive')
  assert.match(saju.warnings.join(' '), /하나로 확정하지/)
})

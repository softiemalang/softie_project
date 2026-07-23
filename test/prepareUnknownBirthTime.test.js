import test from 'node:test'
import assert from 'node:assert/strict'

import {
  buildExportPayload,
  exportPayloadToMarkdown,
  prepareInterpretationData,
} from '../src/interpretationPrep/prepare.js'

const UNKNOWN_TIME_INPUT = {
  subjectName: '검증 대상',
  birthDate: '1997-04-21',
  birthTime: '',
  targetDate: '2026-07-23',
  placeName: '대한민국',
  referenceCity: 'gwangmyeong',
  timezone: 'Asia/Seoul',
  latitude: '37.48',
  longitude: '126.87',
  gender: 'male',
  calendar: 'solar',
  isLeapMonth: false,
  timeAccuracy: 'unknown',
}

function createInterpretationExport() {
  const result = prepareInterpretationData(UNKNOWN_TIME_INPUT)
  const payload = buildExportPayload(result, {
    type: 'interpretation',
    topicId: 'overall',
    question: '',
    generatedAt: '2026-07-23T00:00:00.000Z',
  })

  return { result, payload }
}

test('unknown birth time removes experimental conclusions from the structured result', () => {
  const { result } = createInterpretationExport()
  const saju = result.systems.saju
  const experimental = saju.raw.experimental

  assert.equal(saju.status, 'needs_verification')
  assert.equal(experimental.status, 'candidate_required')
  assert.equal(experimental.strength, null)
  assert.equal(experimental.gyeokguk, null)
  assert.equal(experimental.yongShin, null)
  assert.deepEqual(experimental.shinsal, [])
  assert.ok(experimental.description.includes('출생시각 미상'))
  assert.ok(saju.warnings.includes(experimental.description))
})

test('interpretation export preserves candidate-required status instead of presenting defaults', () => {
  const { payload } = createInterpretationExport()
  const saju = payload.calculationSummary.saju

  assert.equal(payload.exportVersion, '1.5.0')
  assert.equal(saju.experimentalStatus, 'candidate_required')
  assert.ok(saju.experimentalReason.includes('출생시각 미상'))
  assert.equal(saju.strength, null)
  assert.equal(saju.gyeokguk, null)
  assert.equal(saju.yongShin, null)
  assert.deepEqual(saju.shinsal, [])
})

test('model instruction forbids inventing unavailable ziwei and astrology calculations', () => {
  const { payload } = createInterpretationExport()

  assert.ok(payload.instruction.includes('현재 실제 계산된 체계는 saju'))
  assert.ok(payload.instruction.includes('ziwei'))
  assert.ok(payload.instruction.includes('astrology'))
  assert.ok(payload.instruction.includes('추정하거나 새로 만들어내지 마라'))
  assert.ok(payload.instruction.includes('후보 또는 검증 필요 상태는 하나로 확정하지 말고'))
})

test('markdown export clearly marks unknown-time experimental fields as pending', () => {
  const { payload } = createInterpretationExport()
  const markdown = exportPayloadToMarkdown(payload)

  assert.ok(markdown.includes('격국**: 후보 확인 필요'))
  assert.ok(markdown.includes('희용신**: 출생시각 후보 확인 전 미산출'))
  assert.ok(markdown.includes('신살**: 출생시각 후보 확인 전 미산출'))
  assert.equal(markdown.includes('학술적 실험 결과물'), false)
})

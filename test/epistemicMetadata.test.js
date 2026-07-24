import test from 'node:test'
import assert from 'node:assert/strict'

import {
  createEpistemicMetadata,
  calculateStrengthScore,
  determineGyeokguk,
} from '../src/interpretationPrep/sajuProfileRules.js'
import { prepareInterpretationData } from '../src/interpretationPrep/prepare.js'
import { sajuValidationFixtures } from '../src/interpretationPrep/fixtures/sajuValidationFixtures.js'
import { calculateSajuSystem } from '../src/interpretationPrep/sajuAdapter.js'

function pillar(branch, stem = '갑') {
  return { stem, branch }
}

test('createEpistemicMetadata validates status and produces normalized structure', () => {
  const meta = createEpistemicMetadata({
    epistemicStatus: 'candidate',
    confidence: 'low',
    method: { id: 'test-method', label: '테스트 방법' },
    evidence: [{ source: 'testSource', value: '100', role: '테스트 역할' }],
    alternatives: ['대안1'],
    limitations: ['제약1'],
    reviewNotes: '테스트 노이식',
  })

  assert.equal(meta.epistemicStatus, 'candidate')
  assert.equal(meta.confidence, 'low')
  assert.equal(meta.method.id, 'test-method')
  assert.equal(meta.method.label, '테스트 방법')
  assert.equal(meta.evidence.length, 1)
  assert.equal(meta.evidence[0].source, 'testSource')
  assert.equal(meta.alternatives[0], '대안1')
  assert.equal(meta.limitations[0], '제약1')
  assert.equal(meta.reviewNotes, '테스트 노이식')
  assert.strictEqual(meta.internalNotes, undefined) // internalNotes는 존재하지 않음

  // 유효하지 않은 status 입력 시 'derived' fallback 검증
  const fallbackMeta = createEpistemicMetadata({ epistemicStatus: 'invalid_status' })
  assert.equal(fallbackMeta.epistemicStatus, 'derived')
  assert.equal(fallbackMeta.confidence, 'medium')
})

test('calculateStrengthScore attaches epistemicMetadata while preserving existing fields', () => {
  // 1) 신강 (Strong) -> derived, medium confidence, empty alternatives
  const strongPillars = {
    year: pillar('인', '갑'),
    month: pillar('인', '갑'),
    day: pillar('인', '갑'),
    hour: pillar('인', '갑'),
  }

  const strongResult = calculateStrengthScore('갑', strongPillars)

  // 기존 필드 보존 검증
  assert.equal(typeof strongResult.score, 'number')
  assert.equal(typeof strongResult.level, 'string')
  assert.equal(typeof strongResult.deungRyeong, 'boolean')
  assert.equal(typeof strongResult.deungJi, 'boolean')
  assert.equal(typeof strongResult.isStrong, 'boolean')
  assert.equal(typeof strongResult.isWeak, 'boolean')
  assert.ok(Array.isArray(strongResult.candidates))

  // 신규 메타데이터 검증
  assert.ok(strongResult.epistemicMetadata)
  assert.equal(strongResult.epistemicMetadata.epistemicStatus, 'derived')
  assert.equal(strongResult.epistemicMetadata.confidence, 'medium')
  assert.equal(strongResult.epistemicMetadata.method.id, 'surface-support-heuristic-v1')
  assert.ok(strongResult.epistemicMetadata.evidence.length >= 3)
  assert.ok(strongResult.epistemicMetadata.limitations.length > 0)
  assert.deepEqual(strongResult.epistemicMetadata.alternatives, []) // 명확한 신강은 대안 후보가 빈 배열
  assert.ok(strongResult.epistemicMetadata.reviewNotes.includes('유도값'))
  assert.strictEqual(strongResult.epistemicMetadata.internalNotes, undefined)

  // 2) 중화 경계 (Borderline: 45~54) -> derived with low confidence & real alternatives
  const borderlinePillars = {
    year: pillar('신', '경'),
    month: pillar('인', '임'),
    day: pillar('오', '갑'),
    hour: pillar('신', '경'),
  }

  const borderResult = calculateStrengthScore('갑', borderlinePillars)
  assert.equal(borderResult.score, 48)
  assert.equal(borderResult.epistemicMetadata.epistemicStatus, 'derived')
  assert.equal(borderResult.epistemicMetadata.confidence, 'low')
  assert.deepEqual(borderResult.epistemicMetadata.alternatives, ['신약', '신강'])
  assert.ok(borderResult.epistemicMetadata.reviewNotes.includes('중화 경계'))
})

test('JSON serialization includes epistemicMetadata and reviewNotes as expected in structured prep dataset', () => {
  const meta = createEpistemicMetadata({
    epistemicStatus: 'derived',
    confidence: 'medium',
    method: { id: 'test-method', label: '테스트' },
    reviewNotes: '개발 검증용 내장 메모',
  })

  const jsonString = JSON.stringify({ epistemicMetadata: meta })
  const parsed = JSON.parse(jsonString)

  assert.ok(jsonString.includes('reviewNotes'))
  assert.strictEqual(jsonString.includes('internalNotes'), false)
  assert.equal(parsed.epistemicMetadata.reviewNotes, '개발 검증용 내장 메모')
  assert.strictEqual(parsed.epistemicMetadata.internalNotes, undefined)
})

test('determineGyeokguk specialStructureCandidate includes candidate epistemicMetadata', () => {
  // 극단적 신강 사주 (종격 후보 유발)
  const extremePillars = {
    year: pillar('인', '갑'),
    month: pillar('인', '갑'),
    day: pillar('인', '갑'),
    hour: pillar('인', '갑'),
  }

  const gyeokgukResult = determineGyeokguk('갑', extremePillars)

  assert.ok(gyeokgukResult.specialStructureCandidate)
  const candidate = gyeokgukResult.specialStructureCandidate

  // 기존 필드 보존 검증
  assert.equal(candidate.name, '종격 가능성 검토 필요')
  assert.equal(candidate.type, '특수격 (종격) 후보')
  assert.ok(candidate.score >= 85)
  assert.ok(Array.isArray(candidate.candidates))

  assert.ok(candidate.epistemicMetadata)
  assert.equal(candidate.epistemicMetadata.epistemicStatus, 'candidate')
  assert.equal(candidate.epistemicMetadata.confidence, 'low')
  assert.equal(candidate.epistemicMetadata.method.id, 'surface-extreme-score-check-v1')
  assert.equal(candidate.epistemicMetadata.evidence[0].source, 'strength.score')
  assert.equal(candidate.epistemicMetadata.evidence[0].value, candidate.score)
})

test('prepareInterpretationData preserves strength epistemicMetadata and specialStructureCandidate in full pipeline', () => {
  const fixtureInput = sajuValidationFixtures[0].input
  const result = prepareInterpretationData(fixtureInput, {})

  const strength = result.systems.saju.raw.experimental.strength

  // 1. 기존 strength 필드 보존 확인
  assert.equal(typeof strength.score, 'number')
  assert.equal(typeof strength.level, 'string')
  assert.equal(typeof strength.isStrong, 'boolean')
  assert.equal(typeof strength.isWeak, 'boolean')
  assert.equal(strength.model, 'surface_support_heuristic')
  assert.ok(typeof strength.basis === 'string')

  // 2. epistemicMetadata 파이프라인 전달 확인
  assert.ok(strength.epistemicMetadata)
  assert.equal(strength.epistemicMetadata.epistemicStatus, 'derived')
  assert.equal(strength.epistemicMetadata.confidence, 'medium')
  assert.equal(strength.epistemicMetadata.method.id, 'surface-support-heuristic-v1')
  assert.ok(Array.isArray(strength.epistemicMetadata.evidence))
  assert.ok(Array.isArray(strength.epistemicMetadata.alternatives))
  assert.ok(Array.isArray(strength.epistemicMetadata.limitations))
  assert.ok(typeof strength.epistemicMetadata.reviewNotes === 'string')

  // 3. 특수격 후보 epistemicMetadata 전달 확인 (극단적 사주 인풋)
  const extremeInput = {
    ...fixtureInput,
    birthDate: '1986-02-14',
    birthTime: '04:00', // 갑인년 갑인월 갑인일 갑인시 계열
  }
  const extremeResult = prepareInterpretationData(extremeInput, {})
  const specialCandidate = extremeResult.systems.saju.raw.experimental.gyeokguk?.specialStructureCandidate

  if (specialCandidate) {
    assert.ok(specialCandidate.epistemicMetadata)
    assert.equal(specialCandidate.epistemicMetadata.epistemicStatus, 'candidate')
  }
})

test('calculateSajuSystem handles objects gracefully when epistemicMetadata is absent', () => {
  const fixtureInput = sajuValidationFixtures[0].input
  const result = calculateSajuSystem(fixtureInput, {})

  assert.ok(result.raw.experimental.strength)
  assert.equal(typeof result.raw.experimental.strength.score, 'number')
})

import assert from 'node:assert/strict'
import test from 'node:test'
import { prepareThreeSystemInterpretationData } from '../src/interpretationPrep/threeSystemPrepPipeline.js'
import { checkEvidenceBoundary } from '../src/interpretationPrep/evidenceBoundary.js'
import { buildChatHandoffPackage } from '../src/interpretationPrep/chatHandoffPackage.js'

const INPUT = {
  subjectName: '경계테스트',
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

test('runtime tri-system descriptors preserve calculation, source, relation, and interpretation boundaries', () => {
  const prepared = prepareThreeSystemInterpretationData(INPUT)
  for (const system of Object.keys(prepared.systems)) {
    const boundary = prepared.unifiedContext.systems[system].evidenceBoundary
    assert.deepEqual(checkEvidenceBoundary(boundary), [])
    assert.equal(boundary.system, system)
    assert.equal(boundary.sourceEvidence.independentAuthority, 'not_claimed')
    assert.equal(boundary.sourceEvidence.claimVerification, 'not_promoted')
    assert.equal(boundary.interpretation.status, 'not_created')
    assert.equal(boundary.interpretation.personalMeaning, 'not_computed')
  }
  assert.equal(prepared.unifiedContext.systems.saju.evidenceBoundary.sourceEvidence.status, 'unverified')
  assert.equal(prepared.unifiedContext.systems.ziwei.evidenceBoundary.sourceEvidence.status, 'unverified')
  assert.equal(prepared.unifiedContext.systems.astrology.evidenceBoundary.calculation.status, 'not_available')
})

test('all handoff copies retain the evidence boundary instead of only raw values', () => {
  const prepared = prepareThreeSystemInterpretationData(INPUT)
  const handoff = buildChatHandoffPackage({ result: prepared.result, unifiedContext: prepared.unifiedContext })
  for (const copy of Object.values(handoff.copies)) {
    assert.match(copy, /source\/provenance/)
    assert.match(copy, /독립 권위 not_claimed/)
    assert.match(copy, /개인 의미 not_computed/)
  }
})

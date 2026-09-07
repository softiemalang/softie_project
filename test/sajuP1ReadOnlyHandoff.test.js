import assert from 'node:assert/strict'
import test from 'node:test'

import {
  SAJU_P1_DAY_REFERENCE_PATH,
  SAJU_P1_READ_ONLY_HANDOFF_SCHEMA,
  buildSajuP1ReadOnlyHandoff,
  checkSajuP1ReadOnlyHandoff,
  validateSajuP1ReadOnlyHandoff,
} from '../src/saju/p1ReadOnlyHandoff.js'

const refs = {
  calculation: {
    inputRefIds: ['calculation-input'],
    resultRefIds: ['calculation-result'],
    policyRefIds: ['calculation-policy'],
  },
  upstream: {
    calculationRefIds: ['upstream-calculation'],
    historicalAuthorityRefIds: ['upstream-history'],
    upstreamBoundaryRefIds: ['upstream-boundary'],
  },
}

function authoritativePayload(overrides = {}) {
  return {
    raw: {
      pillars: {
        day: {
          status: 'calculated',
          candidates: ['계해'],
          referenceValue: '계해',
        },
      },
      candidates: [{
        candidateId: 'primary',
        status: 'calculated',
        pillars: { day: { referenceValue: '계해' } },
        input: { birthDate: '1990-01-01', birthTime: '12:00' },
      }],
    },
    stateContract: {
      calculationStatus: 'calculated',
      verificationStatus: 'verified',
    },
    p1ReadOnlyRefs: structuredClone(refs),
    input: { birthDate: '1990-01-01', birthTime: '12:00' },
    ...overrides,
  }
}

test('projects only the resolved day predicate input and reference IDs', () => {
  const result = buildSajuP1ReadOnlyHandoff(authoritativePayload())

  assert.equal(result.schemaVersion, SAJU_P1_READ_ONLY_HANDOFF_SCHEMA)
  assert.equal(result.status, 'ready')
  assert.equal(result.gate.predicateEligible, true)
  assert.deepEqual(result.calculation.day, {
    status: 'calculated',
    candidateId: 'primary',
    candidateCount: 1,
    candidateStatus: 'calculated',
    candidateValues: ['계해'],
    referenceValue: '계해',
    referencePath: SAJU_P1_DAY_REFERENCE_PATH,
  })
  assert.deepEqual(result.refs, refs)
  assert.deepEqual(checkSajuP1ReadOnlyHandoff(result), [])
  assert.equal(validateSajuP1ReadOnlyHandoff(result).valid, true)
  assert.doesNotMatch(JSON.stringify(result), /birthDate|birthTime|profile_id|candidate\.input|activation|claim|reflection/)
})

test('missing payload is unresolved and cannot become a predicate input', () => {
  const result = buildSajuP1ReadOnlyHandoff(null)

  assert.equal(result.status, 'unresolved')
  assert.equal(result.gate.predicateEligible, false)
  assert.ok(result.gate.reasonCodes.includes('payload_missing'))
  assert.deepEqual(checkSajuP1ReadOnlyHandoff(result), [])
})

test('legacy snapshot columns are never used to reconstruct the raw day path', () => {
  const result = buildSajuP1ReadOnlyHandoff({
    day_stem: '계',
    day_branch: '해',
    natal_data: { dayMaster: '계', policyContract: { status: 'SELECTED' } },
    p1ReadOnlyRefs: refs,
  })

  assert.equal(result.status, 'unresolved')
  assert.equal(result.calculation.day.referenceValue, null)
  assert.ok(result.gate.reasonCodes.includes('raw_payload_missing'))
  assert.ok(result.gate.reasonCodes.includes('day_pillar_missing'))
})

test('a multi-candidate set stays unresolved even when day values are shared', () => {
  const payload = authoritativePayload()
  payload.raw.candidates = [
    payload.raw.candidates[0],
    { candidateId: 'alternative', status: 'calculated', pillars: { day: { referenceValue: '계해' } } },
  ]
  const result = buildSajuP1ReadOnlyHandoff(payload)

  assert.equal(result.status, 'unresolved')
  assert.equal(result.calculation.day.candidateCount, 2)
  assert.ok(result.gate.reasonCodes.includes('candidate_count_not_one'))
  assert.equal(result.gate.predicateEligible, false)
})

test('a day candidate list with more than one value is not collapsed', () => {
  const payload = authoritativePayload()
  payload.raw.pillars.day.candidates = ['계해', '계자']
  const result = buildSajuP1ReadOnlyHandoff(payload)

  assert.equal(result.status, 'unresolved')
  assert.deepEqual(result.calculation.day.candidateValues, ['계해', '계자'])
  assert.ok(result.gate.reasonCodes.includes('day_candidate_count_not_one'))
})

test('candidate identity and resolution are required', () => {
  const payload = authoritativePayload()
  payload.raw.candidates = [{ status: 'candidate_required' }]
  const result = buildSajuP1ReadOnlyHandoff(payload)

  assert.equal(result.status, 'unresolved')
  assert.equal(result.calculation.day.candidateId, null)
  assert.equal(result.calculation.day.candidateStatus, 'candidate_required')
  assert.ok(result.gate.reasonCodes.includes('candidate_identity_missing'))
  assert.ok(result.gate.reasonCodes.includes('candidate_not_resolved'))
})

test('object-valued day candidates are accepted only when they carry identity and resolution', () => {
  const payload = authoritativePayload()
  delete payload.raw.candidates
  payload.raw.pillars.day.candidates = [{ candidateId: 'primary', status: 'resolved', referenceValue: '계해' }]
  const result = buildSajuP1ReadOnlyHandoff(payload)

  assert.equal(result.status, 'ready')
  assert.equal(result.calculation.day.candidateId, 'primary')
  assert.equal(result.calculation.day.candidateCount, 1)
})

test('missing or unresolved reference groups block the handoff', () => {
  const payload = authoritativePayload({
    p1ReadOnlyRefs: {
      calculation: { inputRefIds: ['calculation-input'], resultRefIds: ['calculation-result'] },
      policy: { refIds: [] },
      upstream: {
        calculationRefIds: [{ refId: 'upstream-calculation', resolution: 'unresolved' }],
        historicalAuthorityRefIds: ['upstream-history'],
        upstreamBoundaryRefIds: ['upstream-boundary'],
      },
    },
  })
  const result = buildSajuP1ReadOnlyHandoff(payload)

  assert.equal(result.status, 'unresolved')
  assert.ok(result.gate.reasonCodes.includes('policy_refs_missing'))
  assert.ok(result.gate.reasonCodes.includes('upstream_refs_invalid'))
  assert.equal(result.gate.predicateEligible, false)
})

test('contract-style refs are partitioned by their existing role and axis', () => {
  const payload = authoritativePayload()
  payload.p1ReadOnlyRefs = undefined
  payload.refs = [
    { refId: 'input', role: 'calculation_input', resolution: 'resolved' },
    { refId: 'result', role: 'calculation_result', resolution: 'resolved' },
    { refId: 'policy', role: 'calculation_policy', resolution: 'resolved' },
    { refId: 'status-calculation', role: 'upstream_status', axis: 'calculation', resolution: 'resolved' },
    { refId: 'status-history', role: 'upstream_status', axis: 'historicalAuthority', resolution: 'resolved' },
    { refId: 'status-boundary', role: 'upstream_status', axis: 'upstreamBoundary', resolution: 'resolved' },
  ]

  const result = buildSajuP1ReadOnlyHandoff(payload)
  assert.equal(result.status, 'ready')
  assert.deepEqual(result.refs.calculation.inputRefIds, ['input'])
  assert.deepEqual(result.refs.calculation.resultRefIds, ['result'])
  assert.deepEqual(result.refs.calculation.policyRefIds, ['policy'])
  assert.deepEqual(result.refs.upstream.upstreamBoundaryRefIds, ['status-boundary'])
})

test('explicit parent verification state remains a gate', () => {
  const payload = authoritativePayload({
    stateContract: { calculationStatus: 'calculated', verificationStatus: 'needs_verification' },
  })
  const result = buildSajuP1ReadOnlyHandoff(payload)

  assert.equal(result.status, 'unresolved')
  assert.ok(result.gate.reasonCodes.includes('calculation_verification_not_resolved'))
})

test('projection does not mutate the authoritative payload', () => {
  const payload = authoritativePayload()
  const before = structuredClone(payload)

  buildSajuP1ReadOnlyHandoff(payload)

  assert.deepEqual(payload, before)
})

test('validator rejects claim, activation, and extra payload fields', () => {
  const result = buildSajuP1ReadOnlyHandoff(authoritativePayload())
  result.claim = { id: 'should-not-be-here' }
  result.gate.activation = 'activated'

  const check = checkSajuP1ReadOnlyHandoff(result)
  assert.ok(check.some(code => code.includes('claim_unknown')))
  assert.ok(check.some(code => code.includes('activation_unknown')))
})

import test from 'node:test'
import assert from 'node:assert/strict'
import {
  ASTROLOGY_PROVIDER_EQUIVALENCE_CONTRACT_V1,
  evaluateAstrologyProviderEquivalenceSummary,
} from '../scripts/lib/astrology-provider-equivalence-contract.mjs'

const passingSummary = {
  maxRawPositionAbsDiffKm: 0.0099,
  maxRawPositionNormAbsDiffKm: 0.0099,
  maxRawVelocityAbsDiffKmS: 1.9e-9,
  maxRawVelocityNormAbsDiffKmS: 1.9e-9,
  maxLongitudeAbsDiffDegrees: 0.009,
  maxSpeedAbsDiffDegreesPerDay: 9e-8,
  maxAspectDistanceAbsDegrees: 0.019,
  maxAspectOrbAbsDegrees: 0.019,
  discreteMismatchCount: 0,
  boundaryMismatchCount: 0,
  provenanceMismatchCount: 0,
}

test('provider equivalence separates implementation identity from FACT equivalence', () => {
  const contract = ASTROLOGY_PROVIDER_EQUIVALENCE_CONTRACT_V1
  assert.equal(contract.status, 'candidate_only_not_production')
  assert.equal(contract.implementationParity.providerHashEqualityRequired, false)
  assert.equal(contract.implementationParity.provenanceHashEqualityRequired, false)
  assert.equal(contract.implementationParity.bitIdentityRequired, false)
  assert.equal(contract.factEquivalence.discrete.mismatchCount, 0)
  assert.ok(contract.independentBasis.sourceRefs.includes('test/fixtures/astrology/de405/baseline.json'))
  assert.equal(contract.boundaryPolicy.classificationComparison, 'exact')
  assert.equal(contract.boundaryPolicy.mismatchAction, 'fail_closed')
})

test('raw ceilings are independently based above the frozen CSPICE/JPL baseline', () => {
  const { rawBaseline } = ASTROLOGY_PROVIDER_EQUIVALENCE_CONTRACT_V1.independentBasis
  const { raw } = ASTROLOGY_PROVIDER_EQUIVALENCE_CONTRACT_V1.factEquivalence
  assert.ok(raw.positionComponentMaxAbsKm > rawBaseline.positionComponentMaxAbsKm)
  assert.ok(raw.positionNormMaxAbsKm > rawBaseline.positionNormMaxAbsKm)
  assert.ok(raw.velocityComponentMaxAbsKmPerSec > rawBaseline.velocityComponentMaxAbsKmPerSec)
  assert.ok(raw.velocityNormMaxAbsKmPerSec > rawBaseline.velocityNormMaxAbsKmPerSec)
  assert.equal(raw.positionComponentMaxAbsKm, 0.01)
  assert.equal(raw.positionNormMaxAbsKm, 0.01)
  assert.equal(raw.velocityComponentMaxAbsKmPerSec, 2e-9)
  assert.equal(raw.velocityNormMaxAbsKmPerSec, 2e-9)
})

test('downstream numerical lane is bounded by existing use and Rule Core thresholds', () => {
  const contract = ASTROLOGY_PROVIDER_EQUIVALENCE_CONTRACT_V1
  assert.equal(contract.factEquivalence.derived.longitudeMaxAbsDegrees, 0.01)
  assert.equal(contract.factEquivalence.derived.longitudeSpeedMaxAbsDegreesPerDay, 1e-7)
  assert.equal(contract.factEquivalence.derived.aspectDistanceMaxAbsDegrees, 0.02)
  assert.equal(contract.boundaryPolicy.signBoundaryDegrees, 1 / 60)
  assert.equal(contract.boundaryPolicy.aspectBoundaryDegrees, 1 / 60)
  assert.equal(contract.boundaryPolicy.motionEpsilonDegreesPerDay, 1e-7)
})

test('materialized summary within the declared envelope passes without requiring provider hashes', () => {
  assert.deepEqual(evaluateAstrologyProviderEquivalenceSummary(passingSummary), {
    schemaVersion: 'astrology-provider-equivalence-contract-v1',
    status: 'pass',
    failures: [],
    contractStatus: 'candidate_only_not_production',
  })
})

test('raw, derived, discrete, and boundary violations fail closed', () => {
  const failures = evaluateAstrologyProviderEquivalenceSummary({
    ...passingSummary,
    maxRawPositionAbsDiffKm: 0.0100001,
    maxLongitudeAbsDiffDegrees: 0.0100001,
    discreteMismatchCount: 1,
    boundaryMismatchCount: 1,
  })
  assert.equal(failures.status, 'fail')
  assert.ok(failures.failures.some((item) => item.startsWith('maxRawPositionAbsDiffKm:')))
  assert.ok(failures.failures.some((item) => item.startsWith('maxLongitudeAbsDiffDegrees:')))
  assert.ok(failures.failures.includes('discreteMismatchCount:not_exact'))
  assert.ok(failures.failures.includes('boundaryMismatchCount:not_exact'))
})

test('missing comparison metrics are not inferred', () => {
  const {
    maxRawPositionNormAbsDiffKm: _ignoredPositionNorm,
    maxRawVelocityNormAbsDiffKmS: _ignoredVelocityNorm,
    maxAspectDistanceAbsDegrees: _ignoredAspectDistance,
    maxAspectOrbAbsDegrees: _ignoredAspectOrb,
    ...incomplete
  } = passingSummary
  const result = evaluateAstrologyProviderEquivalenceSummary(incomplete)
  assert.equal(result.status, 'fail')
  assert.ok(result.failures.includes('maxRawPositionNormAbsDiffKm:missing_non_finite_or_negative'))
  assert.ok(result.failures.includes('maxRawVelocityNormAbsDiffKmS:missing_non_finite_or_negative'))
  assert.ok(result.failures.includes('maxAspectDistanceAbsDegrees:missing_non_finite_or_negative'))
  assert.ok(result.failures.includes('maxAspectOrbAbsDegrees:missing_non_finite_or_negative'))
})

test('negative maximums fail closed instead of being treated as better evidence', () => {
  const result = evaluateAstrologyProviderEquivalenceSummary({
    ...passingSummary,
    maxRawPositionAbsDiffKm: -1,
  })
  assert.equal(result.status, 'fail')
  assert.ok(result.failures.includes('maxRawPositionAbsDiffKm:missing_non_finite_or_negative'))
})

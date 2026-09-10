/**
 * Provider-neutral equivalence contract for the verified astrology technical
 * layer. This is an evaluation contract only; it is not a provider selector
 * and is not imported by the production/UI path.
 */

const RAW_BASELINE = Object.freeze({
  positionComponentMaxAbsKm: 0.0090330839,
  positionNormMaxAbsKm: 0.0091509078,
  velocityComponentMaxAbsKmPerSec: 1.8221868e-9,
  velocityNormMaxAbsKmPerSec: 1.8229023e-9,
})

const DOWNSTREAM = Object.freeze({
  astrologyUseLongitudeMaxAbsDegrees: 0.01,
  signBoundaryDegrees: 1 / 60,
  aspectBoundaryDegrees: 1 / 60,
  motionEpsilonDegreesPerDay: 1e-7,
})

/**
 * This contract intentionally has two lanes:
 *
 * - implementationParity records what would be required to claim the same
 *   implementation/bit stream. Alternate providers are not granted that
 *   claim by numerical closeness or by matching provenance hashes.
 * - factEquivalence describes the bounded numerical and exact discrete
 *   agreement needed before an alternate provider can be considered further.
 *
 * The raw ceilings are rounded upward from the pre-existing independent
 * CSPICE/JPL cross-reference baseline, not from an alternate-provider result.
 * The angular ceilings come from the pre-existing downstream Rule Core/use
 * contracts. The status remains candidate-only until provider, platform, and
 * deployment gates are separately closed.
 */
export const ASTROLOGY_PROVIDER_EQUIVALENCE_CONTRACT_V1 = Object.freeze({
  schemaVersion: 'astrology-provider-equivalence-contract-v1',
  status: 'candidate_only_not_production',
  implementationParity: Object.freeze({
    providerHashEqualityRequired: false,
    provenanceHashEqualityRequired: false,
    bitIdentityRequired: false,
    note: 'alternate-provider equivalence is not implementation identity',
  }),
  independentBasis: Object.freeze({
    rawBaseline: RAW_BASELINE,
    downstream: DOWNSTREAM,
    sourceRefs: Object.freeze([
      'test/fixtures/astrology/de405/baseline.json',
      'docs/astrology/solar-position-contract.md:77-87',
      'docs/astrology/solar-validation-plan.md:132-160',
      'src/astrology/astrologySigns.js',
      'src/astrology/astrologyMotion.js',
      'src/astrology/astrologyAspects.js',
    ]),
  }),
  factEquivalence: Object.freeze({
    raw: Object.freeze({
      positionComponentMaxAbsKm: 0.01,
      positionNormMaxAbsKm: 0.01,
      velocityComponentMaxAbsKmPerSec: 2e-9,
      velocityNormMaxAbsKmPerSec: 2e-9,
    }),
    derived: Object.freeze({
      longitudeMaxAbsDegrees: 0.01,
      longitudeSpeedMaxAbsDegreesPerDay: 1e-7,
      aspectDistanceMaxAbsDegrees: 0.02,
      aspectOrbMaxAbsDegrees: 0.02,
    }),
    discrete: Object.freeze({
      mismatchCount: 0,
      boundaryMismatchCount: 0,
      provenanceMismatchCount: 0,
    }),
  }),
  boundaryPolicy: Object.freeze({
    signBoundaryDegrees: 1 / 60,
    aspectBoundaryDegrees: 1 / 60,
    motionEpsilonDegreesPerDay: 1e-7,
    classificationComparison: 'exact',
    nearBoundaryStatus: 'preserve_and_do_not_promote',
    mismatchAction: 'fail_closed',
  }),
  requiredSemanticIdentity: Object.freeze([
    'de405 source identity and coverage',
    'UTC/ET and TDB time semantics',
    'Earth geocenter observer 399',
    'J2000/ICRF geometric NONE state',
    'target and barycenter mapping',
    'same existing Rule Core version and transform contract',
  ]),
})

const REQUIRED_SUMMARY_FIELDS = [
  ['maxRawPositionAbsDiffKm', 'raw.positionComponentMaxAbsKm'],
  ['maxRawPositionNormAbsDiffKm', 'raw.positionNormMaxAbsKm'],
  ['maxRawVelocityAbsDiffKmS', 'raw.velocityComponentMaxAbsKmPerSec'],
  ['maxRawVelocityNormAbsDiffKmS', 'raw.velocityNormMaxAbsKmPerSec'],
  ['maxLongitudeAbsDiffDegrees', 'derived.longitudeMaxAbsDegrees'],
  ['maxSpeedAbsDiffDegreesPerDay', 'derived.longitudeSpeedMaxAbsDegreesPerDay'],
  ['maxAspectDistanceAbsDegrees', 'derived.aspectDistanceMaxAbsDegrees'],
  ['maxAspectOrbAbsDegrees', 'derived.aspectOrbMaxAbsDegrees'],
]

const finite = (value) => typeof value === 'number' && Number.isFinite(value)

/**
 * Evaluates only a materialized comparison summary. It performs no astronomy
 * calculation and does not infer missing metrics or boundary agreement.
 */
export function evaluateAstrologyProviderEquivalenceSummary(summary = {}) {
  const contract = ASTROLOGY_PROVIDER_EQUIVALENCE_CONTRACT_V1.factEquivalence
  const failures = []

  for (const [summaryField, contractPath] of REQUIRED_SUMMARY_FIELDS) {
    const value = summary[summaryField]
    const limit = contractPath.split('.').reduce((node, key) => node?.[key], contract)
    if (!finite(value) || value < 0) {
      failures.push(`${summaryField}:missing_non_finite_or_negative`)
    } else if (value > limit) {
      failures.push(`${summaryField}:exceeds_${limit}`)
    }
  }

  for (const [summaryField, expected] of [
    ['discreteMismatchCount', contract.discrete.mismatchCount],
    ['boundaryMismatchCount', contract.discrete.boundaryMismatchCount],
    ['provenanceMismatchCount', contract.discrete.provenanceMismatchCount],
  ]) {
    if (summary[summaryField] !== expected) failures.push(`${summaryField}:not_exact`)
  }

  return {
    schemaVersion: ASTROLOGY_PROVIDER_EQUIVALENCE_CONTRACT_V1.schemaVersion,
    status: failures.length === 0 ? 'pass' : 'fail',
    failures,
    contractStatus: ASTROLOGY_PROVIDER_EQUIVALENCE_CONTRACT_V1.status,
  }
}

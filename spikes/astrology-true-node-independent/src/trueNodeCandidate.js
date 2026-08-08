import { normalizeDegrees360 } from '../../../src/astrology/astrologyAngles.js'
import { transformDe405State } from '../../../src/astrology/astrologyEphemerisCore.js'

export const TRUE_NODE_CANDIDATE_SCHEMA_VERSION = 'astrology-true-node-osculating-candidate-v0'

function finite(value) {
  return typeof value === 'number' && Number.isFinite(value)
}

function cross(left, right) {
  return [
    left[1] * right[2] - left[2] * right[1],
    left[2] * right[0] - left[0] * right[2],
    left[0] * right[1] - left[1] * right[0],
  ]
}

function blocked(reason, details = {}) {
  return {
    schemaVersion: TRUE_NODE_CANDIDATE_SCHEMA_VERSION,
    availability: 'blocked',
    reason,
    ...details,
  }
}

/**
 * Derive the instantaneous ascending lunar node from a geocentric Moon state.
 *
 * This is deliberately an experimental validation candidate, not a production
 * True Node provider. The input state is the official JPL DE405 geocentric
 * Moon state in J2000/ICRF equatorial axes. The existing repository transform
 * expresses position and inertial velocity in the mean ecliptic/equinox of
 * date. The orbital-plane normal is r x v; the ascending node direction is
 * k x (r x v), where k is the ecliptic north pole.
 */
export function deriveOsculatingLunarNodeLongitude({ stateJ2000KmKmPerSec, jdTt } = {}) {
  if (!Array.isArray(stateJ2000KmKmPerSec) || stateJ2000KmKmPerSec.length !== 6 || stateJ2000KmKmPerSec.some((value) => !finite(value))) {
    return blocked('state_invalid')
  }
  if (!finite(jdTt)) return blocked('epoch_invalid')

  const transformed = transformDe405State(stateJ2000KmKmPerSec, jdTt)
  if (!transformed) return blocked('state_transform_failed')

  // Use inertial velocity expressed in the date axes. The moving-frame
  // derivative is appropriate for longitude speed, not for an instantaneous
  // physical orbital-plane normal.
  const angularMomentum = cross(transformed.positionKm, transformed.frozenFrameVelocityKmPerSecond)
  const ascendingNodeVector = [-angularMomentum[1], angularMomentum[0], 0]
  const nodeMagnitude = Math.hypot(ascendingNodeVector[0], ascendingNodeVector[1])
  if (!(nodeMagnitude > 0) || !finite(nodeMagnitude)) return blocked('node_degenerate')

  return {
    schemaVersion: TRUE_NODE_CANDIDATE_SCHEMA_VERSION,
    availability: 'available',
    candidateStatus: 'experimental_not_production',
    nodeType: 'osculating_lunar_ascending_node',
    longitudeDegrees: normalizeDegrees360(Math.atan2(ascendingNodeVector[1], ascendingNodeVector[0]) * 180 / Math.PI),
    frame: 'mean_ecliptic_and_equinox_of_date',
    sourceState: 'geocentric_moon_j2000_icrf',
    velocitySemantics: 'inertial_velocity_expressed_in_date_axes',
    jdTt,
    angularMomentumKm2PerSecond: angularMomentum,
    ascendingNodeVectorKm2PerSecond: ascendingNodeVector,
    transform: {
      model: 'repository_de405_iau2006_fukushima_williams_transform',
      frozenVelocityField: 'frozenFrameVelocityKmPerSecond',
    },
  }
}

export function angularDifferenceDegrees(left, right) {
  const difference = normalizeDegrees360(left - right + 180) - 180
  return difference === -180 ? 180 : difference
}

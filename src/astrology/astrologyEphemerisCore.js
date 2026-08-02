/**
 * Research-only DE405 -> astrology-raw-chart-v0 composer.
 *
 * This module is deliberately evaluator-agnostic. The only accepted state
 * source is an injected, verified DE405 canonical-v2 evaluator; it never
 * synthesizes a position or falls back to the legacy simulation resolver.
 */

import { deriveAstrologyTimeAngle } from './astrologyTimeAngleCore.js'
import { normalizeDegrees360 } from './astrologyAngles.js'

export const EPHEMERIS_SCHEMA_VERSION = 'astrology-ephemeris-core-v1'
export const RAW_CHART_SCHEMA_VERSION = 'astrology-raw-chart-v1'
export const BODY_ORDER = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto']

export const DE405_BODY_MAPPING = Object.freeze([
  { id: 'sun', targetId: 10, targetType: 'body', targetName: 'SUN' },
  { id: 'moon', targetId: 301, targetType: 'body', targetName: 'MOON' },
  { id: 'mercury', targetId: 1, targetType: 'barycenter', targetName: 'MERCURY BARYCENTER' },
  { id: 'venus', targetId: 2, targetType: 'barycenter', targetName: 'VENUS BARYCENTER' },
  { id: 'mars', targetId: 4, targetType: 'barycenter', targetName: 'MARS BARYCENTER' },
  { id: 'jupiter', targetId: 5, targetType: 'barycenter', targetName: 'JUPITER BARYCENTER' },
  { id: 'saturn', targetId: 6, targetType: 'barycenter', targetName: 'SATURN BARYCENTER' },
  { id: 'uranus', targetId: 7, targetType: 'barycenter', targetName: 'URANUS BARYCENTER' },
  { id: 'neptune', targetId: 8, targetType: 'barycenter', targetName: 'NEPTUNE BARYCENTER' },
  { id: 'pluto', targetId: 9, targetType: 'barycenter', targetName: 'PLUTO BARYCENTER' },
])

const ARCSEC_TO_RAD = Math.PI / (180 * 3600)
const RAD_TO_DEG = 180 / Math.PI
const DAY_SECONDS = 86400
const J2000 = 2451545.0

function blocked(reason, details = {}) {
  return {
    schemaVersion: RAW_CHART_SCHEMA_VERSION,
    availability: 'blocked',
    reason,
    availableForInterpretation: false,
    integrationStatus: 'not_connected',
    ...details,
  }
}

function finite(value) {
  return typeof value === 'number' && Number.isFinite(value)
}

function multiply3(a, b) {
  return a.map((row, i) => b[0].map((_, j) => row[0] * b[0][j] + row[1] * b[1][j] + row[2] * b[2][j]))
}

function add3(a, b) {
  return a.map((row, i) => row.map((value, j) => value + b[i][j]))
}

function scale3(a, scalar) {
  return a.map((row) => row.map((value) => value * scalar))
}

function rx(angle) {
  const c = Math.cos(angle); const s = Math.sin(angle)
  return [[1, 0, 0], [0, c, s], [0, -s, c]]
}

function drx(angle) {
  const c = Math.cos(angle); const s = Math.sin(angle)
  return [[0, 0, 0], [0, -s, c], [0, -c, -s]]
}

function rz(angle) {
  const c = Math.cos(angle); const s = Math.sin(angle)
  return [[c, s, 0], [-s, c, 0], [0, 0, 1]]
}

function drz(angle) {
  const c = Math.cos(angle); const s = Math.sin(angle)
  return [[-s, c, 0], [-c, -s, 0], [0, 0, 0]]
}

function apply(m, v) {
  return m.map((row) => row[0] * v[0] + row[1] * v[1] + row[2] * v[2])
}

function polynomial(coefficients, t) {
  return coefficients.reduceRight((value, coefficient) => coefficient + t * value, 0)
}

function polynomialDerivative(coefficients, t) {
  let result = 0
  for (let i = coefficients.length - 1; i > 0; i--) result = i * coefficients[i] + t * result
  return result
}

// IAU 2006 Fukushima-Williams precession angles, arcseconds. The matrix is
// the documented mean-equator/equinox-of-date rotation from J2000/ICRF.
function precessionMatrix(jdTt) {
  const t = (jdTt - J2000) / 36525
  const gambCoefficients = [-0.052928, 10.556378, 0.4932044, -0.00031238, -0.000002788, 0.0000000260]
  const phibCoefficients = [84381.412819, -46.811016, 0.0511268, 0.00053289, -0.000000440, -0.0000000176]
  const psibCoefficients = [-0.041775, 5038.481484, 1.5584175, -0.00018522, -0.000026452, -0.0000000148]
  const gamb = polynomial(gambCoefficients, t) * ARCSEC_TO_RAD
  const phib = polynomial(phibCoefficients, t) * ARCSEC_TO_RAD
  const psib = polynomial(psibCoefficients, t) * ARCSEC_TO_RAD
  // Fukushima-Williams convention used by IAU SOFA pmat06/pfw06.
  // The final rx(epsa) is the J2000 mean-equator basis term; the separate
  // mean-obliquity rotation below changes mean equator-of-date to ecliptic.
  const epsa = meanObliquityRadians(jdTt)
  const centurySeconds = 36525 * DAY_SECONDS
  const rates = {
    gamb: polynomialDerivative(gambCoefficients, t) * ARCSEC_TO_RAD / centurySeconds,
    phib: polynomialDerivative(phibCoefficients, t) * ARCSEC_TO_RAD / centurySeconds,
    psib: polynomialDerivative(psibCoefficients, t) * ARCSEC_TO_RAD / centurySeconds,
    epsa: meanObliquityRateRadiansPerSecond(jdTt),
  }
  const a = rx(-phib); const b = rz(-psib); const c = rx(epsa); const d = rz(gamb)
  const da = scale3(drx(-phib), -rates.phib)
  const db = scale3(drz(-psib), -rates.psib)
  const dc = scale3(drx(epsa), rates.epsa)
  const dd = scale3(drz(gamb), rates.gamb)
  const ab = multiply3(a, b); const abc = multiply3(ab, c)
  const matrix = multiply3(abc, d)
  const derivative = add3(add3(add3(multiply3(multiply3(da, b), c), multiply3(multiply3(a, db), c)), multiply3(multiply3(a, b), dc)), multiply3(abc, dd))
  return { matrix, derivative, t, angles: { gamb, phib, psib }, rates }
}

function meanObliquityRadians(jdTt) {
  const t = (jdTt - J2000) / 36525
  const arcsec = polynomial([84381.406, -46.836769, -0.0001831, 0.00200340, -0.000000576, -0.0000000434], t)
  return arcsec * ARCSEC_TO_RAD
}

function meanObliquityRateRadiansPerSecond(jdTt) {
  const t = (jdTt - J2000) / 36525
  const coefficients = [84381.406, -46.836769, -0.0001831, 0.00200340, -0.000000576, -0.0000000434]
  return polynomialDerivative(coefficients, t) * ARCSEC_TO_RAD / (36525 * DAY_SECONDS)
}

function convertState(state, jdTt) {
  if (!Array.isArray(state) || state.length !== 6 || state.some((value) => !finite(value))) return null
  const { matrix, derivative } = precessionMatrix(jdTt)
  const positionEquatorial = apply(matrix, state.slice(0, 3))
  const frozenVelocityEquatorial = apply(matrix, state.slice(3, 6))
  const movingFrameVelocityEquatorial = add3([frozenVelocityEquatorial], [apply(derivative, state.slice(0, 3))])[0]
  const epsilon = meanObliquityRadians(jdTt)
  const ce = Math.cos(epsilon); const se = Math.sin(epsilon)
  const position = [positionEquatorial[0], ce * positionEquatorial[1] + se * positionEquatorial[2], -se * positionEquatorial[1] + ce * positionEquatorial[2]]
  const frozenVelocity = [frozenVelocityEquatorial[0], ce * frozenVelocityEquatorial[1] + se * frozenVelocityEquatorial[2], -se * frozenVelocityEquatorial[1] + ce * frozenVelocityEquatorial[2]]
  const velocity = [movingFrameVelocityEquatorial[0], ce * movingFrameVelocityEquatorial[1] + se * movingFrameVelocityEquatorial[2], -se * movingFrameVelocityEquatorial[1] + ce * movingFrameVelocityEquatorial[2]]
  const xy2 = position[0] ** 2 + position[1] ** 2
  if (!(xy2 > 0) || !finite(xy2)) return null
  const longitude = normalizeDegrees360(Math.atan2(position[1], position[0]) * RAD_TO_DEG)
  const speed = ((position[0] * velocity[1] - position[1] * velocity[0]) / xy2) * RAD_TO_DEG * DAY_SECONDS
  const frozenSpeed = ((position[0] * frozenVelocity[1] - position[1] * frozenVelocity[0]) / xy2) * RAD_TO_DEG * DAY_SECONDS
  return { longitude, speed, longitudeSpeedDegreesPerDay: speed, frozenFrameSpeedDegreesPerDay: frozenSpeed, positionKm: position, velocityKmPerSecond: velocity, frozenFrameVelocityKmPerSecond: frozenVelocity }
}

export function transformDe405State(state, jdTt) {
  return convertState(state, jdTt)
}

export function etSecondsFromTimeAngle(timeAngleResult, tdbMinusTtSeconds) {
  if (typeof tdbMinusTtSeconds !== 'number' || !Number.isFinite(tdbMinusTtSeconds)) return null
  const jdTt = timeAngleResult?.timeScales?.julianDateTt?.value
  if (!finite(jdTt)) return null
  return (jdTt - J2000) * DAY_SECONDS + tdbMinusTtSeconds
}

export function composeAstrologyRawChart({ timeAngleInput, tdbMinusTtSeconds, evaluateStates, kernelProvenance = {} } = {}) {
  if (typeof evaluateStates !== 'function') return blocked('de405_evaluator_unavailable')
  const timeAngle = deriveAstrologyTimeAngle(timeAngleInput)
  if (timeAngle.calendar?.availability !== 'available' || timeAngle.timeScales?.julianDateTt?.availability !== 'available') {
    return blocked('time_angle_core_unavailable', { timeAngle })
  }
  const etSeconds = etSecondsFromTimeAngle(timeAngle, tdbMinusTtSeconds)
  if (!finite(etSeconds)) return blocked('tdb_minus_tt_unavailable', { timeAngle })
  const evaluated = evaluateStates({ etSeconds, bodyMapping: DE405_BODY_MAPPING, observerId: 399, frame: 'J2000', aberrationCorrection: 'NONE' })
  if (!evaluated || evaluated.availability !== 'available' || evaluated.states == null) return blocked(evaluated?.reason || 'de405_state_unavailable', { timeAngle, etSeconds })

  const bodies = []
  for (const mapping of DE405_BODY_MAPPING) {
    const row = evaluated.states[mapping.id]
    if (!row || row.selectionEvidenceStatus !== 'verified') return blocked('de405_state_evidence_unverified', { timeAngle, etSeconds, failedBody: mapping.id })
    const converted = convertState(row.stateKmKmPerSec, timeAngle.timeScales.julianDateTt.value)
    if (!converted) return blocked('coordinate_transform_failed', { timeAngle, etSeconds, failedBody: mapping.id })
    bodies.push({ id: mapping.id, longitudeDegrees: converted.longitude, longitudeSpeedDegreesPerDay: converted.speed, state: converted })
  }

  return {
    schemaVersion: RAW_CHART_SCHEMA_VERSION,
    availability: 'available',
    candidateId: timeAngleInput?.candidateId || null,
    inputStatus: timeAngleInput?.inputStatus || null,
    verificationStatus: 'verified',
    availableForInterpretation: false,
    integrationStatus: 'not_connected',
    zodiac: 'tropical',
    referenceFrame: 'geocentric',
    coordinateBasis: 'ecliptic-of-date',
    geometry: 'geometric',
    bodies,
    angles: {
      ascendant: { longitudeDegrees: timeAngle.rawAngles.ascendant?.longitudeDegrees ?? null },
      midheaven: { longitudeDegrees: timeAngle.rawAngles.midheaven?.longitudeDegrees ?? null },
    },
    provenance: {
      timeAngleCore: { schemaVersion: timeAngle.schemaVersion, ruleSetVersion: timeAngle.ruleSetVersion, modelId: timeAngle.modelId },
      ephemerisTime: { inputScale: 'TT', suppliedTdbMinusTtSeconds: tdbMinusTtSeconds, etSeconds, model: 'explicit_offset_v0' },
      de405: { evaluator: 'de405-canonical-v2', ...kernelProvenance, observerId: 399, observer: 'EARTH', frame: 'J2000', aberrationCorrection: 'NONE', units: { position: 'km', velocity: 'km/s' }, bodyMapping: DE405_BODY_MAPPING },
      transform: { model: 'iau2006_fukushima_williams_precession_plus_mean_obliquity', input: 'J2000/ICRF_mean_equator', output: 'mean_ecliptic_and_equinox_of_date', speed: 'analytic_moving_date_frame_derivative', frozenFrameDiagnostic: 'frozen_frame_xy_angular_rate_only' },
    },
  }
}

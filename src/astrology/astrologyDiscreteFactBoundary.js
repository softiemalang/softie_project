/**
 * Fail-closed boundary assessor for the existing Astrology Rule Core outputs.
 *
 * This module never changes a calculation FACT. It only decides whether the
 * central Rule Core result remains stable over an explicitly supplied,
 * source-referenced final-observable uncertainty interval. Formal error,
 * provider agreement, and time-representation budgets are metadata unless an
 * upstream contract independently materializes the final observable bound.
 */

import { deriveSignPlacement, SIGN_BOUNDARY_THRESHOLD_DEGREES } from './astrologySigns.js'
import { deriveMotionState, MOTION_EPSILON_DEGREES_PER_DAY } from './astrologyMotion.js'
import {
  angularDistanceDegrees,
  isValidDegreeNumber,
} from './astrologyAngles.js'
import {
  deriveAspectPhase,
  deriveMajorAspects,
  MAJOR_ASPECTS,
  ORB_BOUNDARY_THRESHOLD_DEGREES,
  POINT_ORDER,
} from './astrologyAspects.js'
import { calculateWholeSignHouse } from './astrologyHouses.js'
import { deriveChartRulers } from './astrologyRulers.js'
import { deriveDistribution, SUPPORTED_DISTRIBUTION_BODIES } from './astrologyDistribution.js'

export const DISCRETE_FACT_BOUNDARY_SCHEMA = 'astrology-discrete-fact-boundary-v1'
export const DISCRETE_FACT_BOUNDARY_CONTRACT_SCHEMA = 'astrology-discrete-fact-boundary-contract-v1'
export const DISCRETE_FACT_BOUNDARY_CONTRACT_VERSION = '1.0.0'
export const DISCRETE_FACT_BOUNDARY_RULE_SET_VERSION = 'mallang-astrology-rule-core-v0'
export const TIME_SCALE_BUNDLE_CANONICAL_SHA256 = 'eec8801b2c7b4a0c002a3bf24a76714f60c2c334c5ea63113c37a24ef6f6cf2b'
export const SOURCE_RELATIVE_FACT_FRAME = Object.freeze({
  mode: 'source_relative_deterministic',
  physicalTruthGuarantee: false,
  universalAbsoluteBoundRequired: false,
})

export { MOTION_EPSILON_DEGREES_PER_DAY, SIGN_BOUNDARY_THRESHOLD_DEGREES }

export const EXISTING_FACT_TOLERANCES = Object.freeze({
  longitudeMaxAbsDegrees: 0.01,
  longitudeSpeedMaxAbsDegreesPerDay: 1e-7,
  aspectDistanceMaxAbsDegrees: 0.02,
  aspectOrbMaxAbsDegrees: 0.02,
})

export const ACCEPTED_UNCERTAINTY_BASES = Object.freeze([
  'source_relative_model_interval',
  'source_absolute_bound',
  'model_absolute_bound',
  'numerical_rounding_bound',
  'conservative_sum_of_accepted_bounds',
])

export const REJECTED_UNCERTAINTY_BASES = Object.freeze([
  'c04_formal_error_only',
  'empirical_provider_equivalence',
  'tdb_two_part_representation_only',
  'fixture_agreement',
  'unbounded_model_or_numerical_claim',
])

const ANGLE_IDS = new Set(['ascendant', 'midheaven'])
const SUPPORTED_POINT_IDS = new Set([...SUPPORTED_DISTRIBUTION_BODIES, ...ANGLE_IDS])

function finite(value) {
  return typeof value === 'number' && Number.isFinite(value)
}

function finiteNonNegative(value) {
  return finite(value) && value >= 0
}

function unique(values) {
  return [...new Set(values.filter(Boolean))]
}

function sameNumber(a, b, epsilon = 1e-12) {
  return finite(a) && finite(b) && Math.abs(a - b) <= epsilon
}

function hasSourceRefs(value) {
  return Array.isArray(value) && value.length > 0 && value.every(ref => typeof ref === 'string' && ref.length > 0)
}

function blocked(reason, details = {}) {
  return { status: 'blocked', reason, ...details }
}

function unavailable(reason, details = {}) {
  return { status: 'unavailable', reason, ...details }
}

function unsupported(reason, details = {}) {
  return { status: 'unsupported', reason, ...details }
}

function indeterminate(reason, details = {}) {
  return { status: 'indeterminate', reason, ...details }
}

function confirmed(details = {}) {
  return { status: 'confirmed', ...details }
}

function pointFromChart(ruleChart, id) {
  if (SUPPORTED_DISTRIBUTION_BODIES.includes(id)) {
    return Array.isArray(ruleChart?.bodies) ? ruleChart.bodies.find(point => point?.id === id) || null : null
  }
  if (ANGLE_IDS.has(id)) return ruleChart?.angles?.[id] ? { id, ...ruleChart.angles[id] } : null
  return null
}

function pointAvailability(point, id) {
  if (!point) return blocked('required_point_missing', { pointId: id })
  if (point.availability === 'unsupported') return unsupported('unsupported_point', { pointId: id })
  if (point.availability === 'unavailable') return unavailable(point.reason || 'point_unavailable', { pointId: id })
  if (point.availability !== 'available') return blocked('point_availability_invalid', { pointId: id })
  return null
}

function validateProvenance(uncertainty) {
  const provenance = uncertainty?.provenance
  const failures = []
  if (!provenance || typeof provenance !== 'object' || Array.isArray(provenance)) {
    failures.push('provider_or_source_provenance_missing')
    return failures
  }
  if (provenance.timeScaleBundleSchemaVersion !== 'astrology-time-scale-bundle-v1') failures.push('time_scale_bundle_identity_missing_or_mismatch')
  if (provenance.timeScaleBundleCanonicalSha256 !== TIME_SCALE_BUNDLE_CANONICAL_SHA256) failures.push('time_scale_bundle_identity_missing_or_mismatch')
  if (provenance.ruleSetVersion !== DISCRETE_FACT_BOUNDARY_RULE_SET_VERSION) failures.push('rule_core_version_mismatch')
  if (typeof provenance.providerIdentity !== 'string' || provenance.providerIdentity.length === 0) failures.push('provider_or_source_provenance_missing')
  if (!hasSourceRefs(provenance.sourceRefs)) failures.push('provider_or_source_provenance_missing')

  const components = provenance.timeScaleComponents
  for (const component of ['dut1', 'ttMinusUtc', 'tdbMinusTt']) {
    if (!components?.[component] || typeof components[component].identity !== 'string' || components[component].identity.length === 0) {
      failures.push(`time_scale_component_identity_missing:${component}`)
    }
  }
  return unique(failures)
}

function validateBound(uncertainty, pointId, kind) {
  const raw = uncertainty?.points?.[pointId]?.[kind]
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return indeterminate('uncertainty_interval_missing', { pointId, kind })
  }

  const field = kind === 'longitude' ? 'absoluteErrorDegrees' : 'absoluteErrorDegreesPerDay'
  const value = raw[field]
  if (!finiteNonNegative(value)) {
    return blocked('uncertainty_nonfinite_negative_or_exceeds_existing_tolerance', { pointId, kind, field })
  }
  if (!ACCEPTED_UNCERTAINTY_BASES.includes(raw.basis)) {
    return blocked('uncertainty_basis_rejected', { pointId, kind, basis: raw.basis || null })
  }
  if (!hasSourceRefs(raw.sourceRefs)) {
    return blocked('provider_or_source_provenance_missing', { pointId, kind })
  }

  const limit = kind === 'longitude'
    ? EXISTING_FACT_TOLERANCES.longitudeMaxAbsDegrees
    : EXISTING_FACT_TOLERANCES.longitudeSpeedMaxAbsDegreesPerDay
  if (value > limit) {
    return blocked('uncertainty_nonfinite_negative_or_exceeds_existing_tolerance', {
      pointId,
      kind,
      field,
      value,
      limit,
    })
  }
  return { status: 'valid', value, basis: raw.basis, sourceRefs: raw.sourceRefs }
}

function projectBound(bound, field) {
  if (bound?.status === 'valid') {
    return {
      status: 'valid',
      [field]: bound.value,
      basis: bound.basis,
      sourceRefs: [...bound.sourceRefs],
    }
  }
  return {
    status: bound?.status || 'indeterminate',
    reason: bound?.reason || 'uncertainty_interval_missing',
    ...(bound?.basis ? { basis: bound.basis } : {}),
    ...(bound?.sourceRefs ? { sourceRefs: [...bound.sourceRefs] } : {}),
  }
}

function centralSign(point, pointId) {
  if (!isValidDegreeNumber(point.longitudeDegrees)) return blocked('central_rule_output_mismatch', { pointId, reasonDetail: 'longitude_missing_or_invalid' })
  const derived = deriveSignPlacement(point.longitudeDegrees)
  const fieldsMatch = point.signId === derived.signId
    && point.signIndex === derived.signIndex
    && point.boundaryStatus === derived.boundaryStatus
    && sameNumber(point.distanceToNearestBoundaryDegrees, derived.distanceToNearestBoundaryDegrees)
  if (!fieldsMatch) return blocked('central_rule_output_mismatch', { pointId, expected: derived, actual: point })
  return derived
}

function assessSignPoint(point, pointId, uncertainty) {
  const availability = pointAvailability(point, pointId)
  if (availability) return availability
  const central = centralSign(point, pointId)
  if (central.status === 'blocked') return central
  const bound = validateBound(uncertainty, pointId, 'longitude')
  const base = {
    pointId,
    signId: central.signId,
    signIndex: central.signIndex,
    degreeInSign: central.degreeInSign,
    centerLongitudeDegrees: central.normalizedLongitudeDegrees,
    absoluteErrorDegrees: bound.status === 'valid' ? bound.value : null,
    uncertainty: projectBound(bound, 'absoluteErrorDegrees'),
    boundaryGuardDegrees: SIGN_BOUNDARY_THRESHOLD_DEGREES,
  }
  if (bound.status !== 'valid') return { ...bound, ...base }

  const margin = central.distanceToNearestBoundaryDegrees - bound.value
  if (central.boundaryStatus !== 'normal' || !(margin > SIGN_BOUNDARY_THRESHOLD_DEGREES)) {
    return indeterminate('sign_interval_crosses_or_approaches_boundary', {
      ...base,
      distanceToNearestBoundaryDegrees: central.distanceToNearestBoundaryDegrees,
      marginAfterUncertaintyDegrees: margin,
      interval: {
        centerDegrees: central.normalizedLongitudeDegrees,
        absoluteErrorDegrees: bound.value,
      },
    })
  }
  return confirmed({
    ...base,
    distanceToNearestBoundaryDegrees: central.distanceToNearestBoundaryDegrees,
    marginAfterUncertaintyDegrees: margin,
    interval: {
      centerDegrees: central.normalizedLongitudeDegrees,
      absoluteErrorDegrees: bound.value,
    },
  })
}

function assessMotionPoint(point, pointId, uncertainty) {
  const availability = pointAvailability(point, pointId)
  if (availability) return availability
  if (!isValidDegreeNumber(point.longitudeSpeedDegreesPerDay)) return unavailable('speed_unavailable', { pointId })

  const central = deriveMotionState(point.longitudeSpeedDegreesPerDay)
  if (point.motionState !== central.motionState || point.retrograde !== central.retrograde) {
    return blocked('central_rule_output_mismatch', { pointId, expected: central, actual: { motionState: point.motionState, retrograde: point.retrograde } })
  }

  const bound = validateBound(uncertainty, pointId, 'speed')
  const base = {
    pointId,
    centerSpeedDegreesPerDay: point.longitudeSpeedDegreesPerDay,
    motionState: central.motionState,
    retrograde: central.retrograde,
    epsilonDegreesPerDay: MOTION_EPSILON_DEGREES_PER_DAY,
    absoluteErrorDegreesPerDay: bound.status === 'valid' ? bound.value : null,
    uncertainty: projectBound(bound, 'absoluteErrorDegreesPerDay'),
  }
  if (bound.status !== 'valid') return { ...bound, ...base }

  const lower = point.longitudeSpeedDegreesPerDay - bound.value
  const upper = point.longitudeSpeedDegreesPerDay + bound.value
  let stableState = null
  if (lower > MOTION_EPSILON_DEGREES_PER_DAY) stableState = 'direct'
  else if (upper < -MOTION_EPSILON_DEGREES_PER_DAY) stableState = 'retrograde'
  else if (lower >= -MOTION_EPSILON_DEGREES_PER_DAY && upper <= MOTION_EPSILON_DEGREES_PER_DAY) stableState = 'stationary'

  const interval = { lower, upper }
  if (stableState !== central.motionState) {
    return indeterminate('motion_interval_crosses_epsilon_boundary', { ...base, interval })
  }
  return confirmed({ ...base, interval })
}

function collectPoints(ruleChart) {
  return Object.fromEntries([...SUPPORTED_DISTRIBUTION_BODIES, 'ascendant', 'midheaven'].map(id => [id, pointFromChart(ruleChart, id)]))
}

function angularDistanceInterval(pointA, pointB, errorA, errorB) {
  const width = errorA + errorB
  if (width >= 180) return { minimum: 0, maximum: 180 }
  const center = angularDistanceDegrees(pointA.longitudeDegrees, pointB.longitudeDegrees)
  return {
    minimum: Math.max(0, center - width),
    maximum: Math.min(180, center + width),
  }
}

function aspectRegion(aspect) {
  return {
    lower: Math.max(0, aspect.exactAngleDegrees - aspect.maxOrbDegrees),
    upper: Math.min(180, aspect.exactAngleDegrees + aspect.maxOrbDegrees),
  }
}

function safeAspectMatch(range, aspect) {
  const region = aspectRegion(aspect)
  const lowerSafe = region.lower === 0 || range.minimum > region.lower + ORB_BOUNDARY_THRESHOLD_DEGREES
  const upperSafe = region.upper === 180 || range.maximum < region.upper - ORB_BOUNDARY_THRESHOLD_DEGREES
  return lowerSafe && upperSafe
}

function safeAspectAbsence(range, aspect) {
  const region = aspectRegion(aspect)
  const below = region.lower > 0 && range.maximum < region.lower - ORB_BOUNDARY_THRESHOLD_DEGREES
  const above = region.upper < 180 && range.minimum > region.upper + ORB_BOUNDARY_THRESHOLD_DEGREES
  return below || above
}

function orbInterval(range, exactAngleDegrees) {
  const minimum = range.minimum <= exactAngleDegrees && exactAngleDegrees <= range.maximum
    ? 0
    : Math.min(Math.abs(range.minimum - exactAngleDegrees), Math.abs(range.maximum - exactAngleDegrees))
  const maximum = Math.max(Math.abs(range.minimum - exactAngleDegrees), Math.abs(range.maximum - exactAngleDegrees))
  return { minimum, maximum }
}

function compareAspectRecord(actual, expected) {
  if (!actual && !expected) return true
  if (!actual || !expected) return false
  return actual.id === expected.id
    && actual.aspectId === expected.aspectId
    && sameNumber(actual.angularDistanceDegrees, expected.angularDistanceDegrees)
    && sameNumber(actual.orbDegrees, expected.orbDegrees)
    && actual.orbBoundaryStatus === expected.orbBoundaryStatus
    && actual.phase === expected.phase
}

function phaseIntervalAssessment(pointA, pointB, centralAspect, longitudeError, speedErrorA, speedErrorB) {
  if (ANGLE_IDS.has(pointA.id) || ANGLE_IDS.has(pointB.id)) {
    return { phaseStatus: 'unavailable', phase: 'unavailable', reason: 'angle_phase_not_supported_v0' }
  }
  if (!isValidDegreeNumber(pointA.longitudeSpeedDegreesPerDay) || !isValidDegreeNumber(pointB.longitudeSpeedDegreesPerDay)) {
    return { phaseStatus: 'unavailable', phase: 'unavailable', reason: 'speed_unavailable' }
  }
  if (speedErrorA.status !== 'valid' || speedErrorB.status !== 'valid') {
    const source = speedErrorA.status === 'blocked' ? speedErrorA : speedErrorB
    return {
      phaseStatus: source.status === 'blocked' ? 'blocked' : 'indeterminate',
      phase: null,
      reason: source.reason || 'uncertainty_interval_missing',
    }
  }

  const offsetError = longitudeError
  const offsetLower = centralAspect.signedOffsetDegrees - offsetError
  const offsetUpper = centralAspect.signedOffsetDegrees + offsetError
  const relativeSpeed = pointB.longitudeSpeedDegreesPerDay - pointA.longitudeSpeedDegreesPerDay
  const relativeError = speedErrorA.value + speedErrorB.value
  const relativeLower = relativeSpeed - relativeError
  const relativeUpper = relativeSpeed + relativeError
  const epsilon = MOTION_EPSILON_DEGREES_PER_DAY

  let stablePhase = null
  if (offsetLower >= -epsilon && offsetUpper <= epsilon) {
    stablePhase = 'exact'
  } else {
    const offsetPositive = offsetLower > epsilon
    const offsetNegative = offsetUpper < -epsilon
    const speedPositive = relativeLower > epsilon
    const speedNegative = relativeUpper < -epsilon
    if (offsetPositive && speedNegative) stablePhase = 'applying'
    else if (offsetNegative && speedPositive) stablePhase = 'applying'
    else if (offsetPositive && speedPositive) stablePhase = 'separating'
    else if (offsetNegative && speedNegative) stablePhase = 'separating'
    else if (offsetLower >= -epsilon && offsetUpper <= epsilon) stablePhase = 'exact'
    else stablePhase = 'indeterminate'
  }

  const details = {
    phase: centralAspect.phase,
    signedOffsetInterval: { lower: offsetLower, upper: offsetUpper },
    relativeSpeedInterval: { lower: relativeLower, upper: relativeUpper },
    epsilonDegreesPerDay: epsilon,
  }
  if (stablePhase === 'indeterminate' || stablePhase !== centralAspect.phase) {
    return { phaseStatus: 'indeterminate', ...details }
  }
  return { phaseStatus: 'confirmed', ...details }
}

function assessAspectPair(pointA, pointB, chartAspects, uncertainty) {
  const availabilityA = pointAvailability(pointA, pointA?.id)
  const availabilityB = pointAvailability(pointB, pointB?.id)
  if (availabilityA || availabilityB) {
    return blocked('aspect_point_unavailable', {
      pointA: pointA?.id,
      pointB: pointB?.id,
      dependencies: [availabilityA, availabilityB].filter(Boolean),
    })
  }

  const longitudeErrorA = validateBound(uncertainty, pointA.id, 'longitude')
  const longitudeErrorB = validateBound(uncertainty, pointB.id, 'longitude')
  const key = `${pointA.id}__${pointB.id}`
  const actualRecords = Array.isArray(chartAspects)
    ? chartAspects.filter(aspect => aspect?.pointA === pointA.id && aspect?.pointB === pointB.id)
    : null
  const expectedRecords = deriveMajorAspects([
    { id: pointA.id, longitudeDegrees: pointA.longitudeDegrees, speedDegreesPerDay: pointA.longitudeSpeedDegreesPerDay },
    { id: pointB.id, longitudeDegrees: pointB.longitudeDegrees, speedDegreesPerDay: pointB.longitudeSpeedDegreesPerDay },
  ])
  const expected = expectedRecords[0] || null
  const actual = actualRecords?.length === 1 ? actualRecords[0] : actualRecords?.length === 0 ? null : undefined
  if (actual === undefined || !compareAspectRecord(actual, expected)) {
    return blocked('central_rule_output_mismatch', { pointA: pointA.id, pointB: pointB.id, key })
  }

  const base = {
    key,
    pointA: pointA.id,
    pointB: pointB.id,
    selectedAspectId: expected?.aspectId || null,
    geometryGuardDegrees: ORB_BOUNDARY_THRESHOLD_DEGREES,
    longitudeErrorDegrees: longitudeErrorA.status === 'valid' && longitudeErrorB.status === 'valid'
      ? longitudeErrorA.value + longitudeErrorB.value
      : null,
    longitudeUncertainty: {
      [pointA.id]: projectBound(longitudeErrorA, 'absoluteErrorDegrees'),
      [pointB.id]: projectBound(longitudeErrorB, 'absoluteErrorDegrees'),
    },
  }
  if (longitudeErrorA.status !== 'valid' || longitudeErrorB.status !== 'valid') {
    const source = longitudeErrorA.status === 'blocked' ? longitudeErrorA : longitudeErrorB
    return { ...source, ...base, geometryStatus: source.status === 'blocked' ? 'blocked' : 'indeterminate' }
  }

  const range = angularDistanceInterval(pointA, pointB, longitudeErrorA.value, longitudeErrorB.value)
  const stableResults = MAJOR_ASPECTS.map(aspect => ({
    aspectId: aspect.id,
    selected: expected?.aspectId === aspect.id,
    stableMatch: safeAspectMatch(range, aspect),
    stableAbsence: safeAspectAbsence(range, aspect),
  }))
  const geometryStable = stableResults.every(result => result.selected ? result.stableMatch : result.stableAbsence)
  const orb = expected ? orbInterval(range, expected.exactAngleDegrees) : null
  const geometryDetails = {
    ...base,
    geometryStatus: geometryStable ? 'confirmed' : 'indeterminate',
    angularDistanceIntervalDegrees: range,
    orbIntervalDegrees: orb,
    stableResults,
  }
  if (!geometryStable) return indeterminate('aspect_interval_overlaps_or_approaches_orb_boundary', geometryDetails)

  if (!expected) {
    return confirmed({ ...geometryDetails, classification: 'none', phaseStatus: 'confirmed', phase: 'not_applicable' })
  }

  const phase = phaseIntervalAssessment(
    pointA,
    pointB,
    expected,
    longitudeErrorA.value + longitudeErrorB.value,
    validateBound(uncertainty, pointA.id, 'speed'),
    validateBound(uncertainty, pointB.id, 'speed'),
  )
  const speedErrorA = validateBound(uncertainty, pointA.id, 'speed')
  const speedErrorB = validateBound(uncertainty, pointB.id, 'speed')
  return confirmed({
    ...geometryDetails,
    classification: expected.aspectId,
    phaseStatus: phase.phaseStatus,
    phase: phase.phase,
    phaseReason: phase.reason || null,
    signedOffsetInterval: phase.signedOffsetInterval || null,
    relativeSpeedInterval: phase.relativeSpeedInterval || null,
    phaseEpsilonDegreesPerDay: phase.epsilonDegreesPerDay || MOTION_EPSILON_DEGREES_PER_DAY,
    speedUncertainty: {
      [pointA.id]: projectBound(speedErrorA, 'absoluteErrorDegreesPerDay'),
      [pointB.id]: projectBound(speedErrorB, 'absoluteErrorDegreesPerDay'),
    },
  })
}

function assessAspects(ruleChart, points, uncertainty) {
  const results = []
  for (let i = 0; i < POINT_ORDER.length; i += 1) {
    const pointA = points[POINT_ORDER[i]]
    for (let j = i + 1; j < POINT_ORDER.length; j += 1) {
      if (ANGLE_IDS.has(POINT_ORDER[i]) && ANGLE_IDS.has(POINT_ORDER[j])) continue
      const pointB = points[POINT_ORDER[j]]
      if (!pointA || !pointB) {
        results.push(blocked('aspect_point_unavailable', { pointA: POINT_ORDER[i], pointB: POINT_ORDER[j] }))
        continue
      }
      results.push(assessAspectPair(pointA, pointB, ruleChart.aspects, uncertainty))
    }
  }
  return results
}

function assessHouses(ruleChart, signAssessments, points) {
  const houses = ruleChart?.houses
  if (!houses || houses.availability !== 'available' || houses.houseSystem !== 'whole_sign') {
    return blocked('house_or_ruler_dependency_unconfirmed', { reasonDetail: houses?.reason || 'whole_sign_house_unavailable_or_mismatched' })
  }
  const ascSign = signAssessments.ascendant
  if (ascSign?.status !== 'confirmed') {
    return ascSign?.status === 'indeterminate'
      ? indeterminate('house_or_ruler_dependency_unconfirmed', { dependency: 'ascendant_sign', ascendant: ascSign })
      : blocked('house_or_ruler_dependency_unconfirmed', { dependency: 'ascendant_sign', ascendant: ascSign })
  }

  if (!Array.isArray(houses.placements)) return blocked('central_rule_output_mismatch', { reasonDetail: 'house_placements_missing' })
  const placements = []
  let hasIndeterminate = false
  for (const id of SUPPORTED_DISTRIBUTION_BODIES) {
    const point = points[id]
    const sign = signAssessments[id]
    const placement = houses.placements.find(item => item?.id === id)
    if (!placement || !point) return blocked('house_or_ruler_dependency_unconfirmed', { bodyId: id, reasonDetail: 'house_dependency_missing' })
    if (sign.status !== 'confirmed') {
      if (sign.status === 'indeterminate') hasIndeterminate = true
      placements.push({ id, status: sign.status, reason: sign.reason || 'body_sign_unconfirmed', house: null })
      continue
    }
    const expectedHouse = calculateWholeSignHouse(sign.signIndex, ascSign.signIndex)
    if (placement.availability !== 'available' || placement.houseSystem !== 'whole_sign' || placement.house !== expectedHouse) {
      return blocked('central_rule_output_mismatch', { bodyId: id, expectedHouse, actual: placement })
    }
    placements.push({ id, status: 'confirmed', house: placement.house, houseSystem: 'whole_sign' })
  }
  if (hasIndeterminate) return indeterminate('house_or_ruler_dependency_unconfirmed', { houseSystem: 'whole_sign', placements })
  return confirmed({ houseSystem: 'whole_sign', ascendantSignId: ascSign.signId, placements })
}

function assessChartRulers(ruleChart, ascendantSign) {
  if (ascendantSign?.status !== 'confirmed') {
    return ascendantSign?.status === 'indeterminate'
      ? indeterminate('house_or_ruler_dependency_unconfirmed', { dependency: 'ascendant_sign' })
      : blocked('house_or_ruler_dependency_unconfirmed', { dependency: 'ascendant_sign' })
  }
  const actual = ruleChart?.chartRulers
  const expected = deriveChartRulers({ signId: ascendantSign.signId, signIndex: ascendantSign.signIndex })
  if (!actual || actual.availability !== expected.availability || actual.ascendantSignId !== expected.ascendantSignId || actual.traditionalChartRuler !== expected.traditionalChartRuler || actual.modernChartRuler !== expected.modernChartRuler) {
    return blocked('central_rule_output_mismatch', { component: 'chartRulers', expected, actual })
  }
  return confirmed({
    ascendantSignId: ascendantSign.signId,
    traditionalChartRuler: actual.traditionalChartRuler,
    modernChartRuler: actual.modernChartRuler,
  })
}

function distributionProjection(value) {
  return {
    totalBodiesCount: value?.totalBodiesCount,
    elements: value?.elements,
    modalities: value?.modalities,
    polarities: value?.polarities,
  }
}

function assessDistribution(ruleChart, signAssessments, points) {
  const current = ruleChart?.distribution
  if (!current?.overall || !current?.personal) return blocked('central_rule_output_mismatch', { component: 'distribution', reasonDetail: 'distribution_missing' })

  const required = [...SUPPORTED_DISTRIBUTION_BODIES]
  const missingOrUnconfirmed = required.filter(id => signAssessments[id]?.status !== 'confirmed')
  if (missingOrUnconfirmed.length > 0) {
    const hasIndeterminate = missingOrUnconfirmed.some(id => signAssessments[id]?.status === 'indeterminate')
    return hasIndeterminate
      ? indeterminate('distribution_required_body_missing_or_unconfirmed', { bodyIds: missingOrUnconfirmed })
      : blocked('distribution_required_body_missing_or_unconfirmed', { bodyIds: missingOrUnconfirmed })
  }

  const expected = deriveDistribution(required.map(id => points[id]))
  if (JSON.stringify(distributionProjection(current.overall)) !== JSON.stringify(distributionProjection(expected.overall))
    || JSON.stringify(distributionProjection(current.personal)) !== JSON.stringify(distributionProjection(expected.personal))) {
    return blocked('central_rule_output_mismatch', { component: 'distribution', expected, actual: current })
  }
  return confirmed({
    overall: distributionProjection(current.overall),
    personal: distributionProjection(current.personal),
  })
}

function summarize(results) {
  const counts = { confirmed: 0, indeterminate: 0, blocked: 0, unavailable: 0, unsupported: 0 }
  for (const result of results) {
    if (result?.status && counts[result.status] !== undefined) counts[result.status] += 1
  }
  return counts
}

function topStatus(results, provenanceFailures) {
  if (provenanceFailures.length > 0 || results.some(result => result.status === 'blocked' || result.phaseStatus === 'blocked')) return 'blocked'
  if (results.some(result => result.status === 'indeterminate' || result.phaseStatus === 'indeterminate')) return 'indeterminate'
  return 'confirmed'
}

/**
 * Assess existing discrete Rule Core results against an explicit final-value
 * uncertainty envelope. The result is evidence about stability only.
 *
 * @param {{ruleChart: object, uncertainty: object}} input
 * @returns {object}
 */
export function assessAstrologyDiscreteFactBoundaries({ ruleChart = {}, uncertainty = {} } = {}) {
  const provenanceFailures = validateProvenance(uncertainty)
  if (provenanceFailures.length > 0) {
    return {
      schemaVersion: DISCRETE_FACT_BOUNDARY_SCHEMA,
      contractVersion: DISCRETE_FACT_BOUNDARY_CONTRACT_VERSION,
      factFrame: { ...SOURCE_RELATIVE_FACT_FRAME },
      status: 'blocked',
      reasonCodes: provenanceFailures,
      points: {},
      aspects: [],
      wholeSignHouses: blocked('house_or_ruler_dependency_unconfirmed'),
      chartRulers: blocked('house_or_ruler_dependency_unconfirmed'),
      distribution: blocked('distribution_required_body_missing_or_unconfirmed'),
      summary: {
        pointResults: { confirmed: 0, indeterminate: 0, blocked: 0, unavailable: 0, unsupported: 0 },
        aspectResults: { confirmed: 0, indeterminate: 0, blocked: 0, unavailable: 0, unsupported: 0 },
        compositionResults: { confirmed: 0, indeterminate: 0, blocked: 0, unavailable: 0, unsupported: 0 },
        overall: { confirmed: 0, indeterminate: 0, blocked: 1, unavailable: 0, unsupported: 0 },
      },
      promotion: { calculationFactsChanged: false, existingToleranceChanged: false, activationChanged: false, semanticMeaningAdded: false },
    }
  }

  const points = collectPoints(ruleChart)
  const signAssessments = {}
  const motionAssessments = {}
  const pointResults = []
  for (const id of [...SUPPORTED_DISTRIBUTION_BODIES, 'ascendant', 'midheaven']) {
    signAssessments[id] = assessSignPoint(points[id], id, uncertainty)
    pointResults.push(signAssessments[id])
    if (SUPPORTED_DISTRIBUTION_BODIES.includes(id)) {
      motionAssessments[id] = assessMotionPoint(points[id], id, uncertainty)
      pointResults.push(motionAssessments[id])
    }
  }

  const aspectResults = assessAspects(ruleChart, points, uncertainty)
  const houses = assessHouses(ruleChart, signAssessments, points)
  const chartRulers = assessChartRulers(ruleChart, signAssessments.ascendant)
  const distribution = assessDistribution(ruleChart, signAssessments, points)
  const resultSet = [...pointResults, ...aspectResults, houses, chartRulers, distribution]
  const status = topStatus(resultSet, [])
  const reasonCodes = unique(resultSet.map(result => result.reason))

  return {
    schemaVersion: DISCRETE_FACT_BOUNDARY_SCHEMA,
    contractVersion: DISCRETE_FACT_BOUNDARY_CONTRACT_VERSION,
    factFrame: { ...SOURCE_RELATIVE_FACT_FRAME },
    status,
    candidateId: ruleChart.candidateId || null,
    ruleSetVersion: DISCRETE_FACT_BOUNDARY_RULE_SET_VERSION,
    source: {
      timeScaleBundleSchemaVersion: uncertainty.provenance.timeScaleBundleSchemaVersion,
      timeScaleBundleCanonicalSha256: uncertainty.provenance.timeScaleBundleCanonicalSha256,
      ruleSetVersion: uncertainty.provenance.ruleSetVersion,
      providerIdentity: uncertainty.provenance.providerIdentity,
      sourceRefs: [...uncertainty.provenance.sourceRefs],
      timeScaleComponents: Object.fromEntries(['dut1', 'ttMinusUtc', 'tdbMinusTt'].map(component => [
        component,
        { ...uncertainty.provenance.timeScaleComponents[component] },
      ])),
      uncertaintyBases: [...ACCEPTED_UNCERTAINTY_BASES],
    },
    points: Object.fromEntries(Object.keys(signAssessments).map(id => [id, {
      sign: signAssessments[id],
      ...(motionAssessments[id] ? { motion: motionAssessments[id] } : {}),
    }])),
    aspects: aspectResults,
    wholeSignHouses: houses,
    chartRulers,
    distribution,
    summary: {
      pointResults: summarize(pointResults),
      aspectResults: summarize(aspectResults),
      compositionResults: summarize([houses, chartRulers, distribution]),
      overall: summarize(resultSet),
    },
    reasonCodes,
    promotion: { calculationFactsChanged: false, existingToleranceChanged: false, activationChanged: false, semanticMeaningAdded: false },
  }
}

export function makeSyntheticBoundaryProvenance(providerIdentity = 'synthetic-bounded-provider-v1') {
  return {
    timeScaleBundleSchemaVersion: 'astrology-time-scale-bundle-v1',
    timeScaleBundleCanonicalSha256: TIME_SCALE_BUNDLE_CANONICAL_SHA256,
    ruleSetVersion: DISCRETE_FACT_BOUNDARY_RULE_SET_VERSION,
    providerIdentity,
    sourceRefs: ['test/fixtures/astrology/discrete-boundary-synthetic-v1'],
    timeScaleComponents: {
      dut1: { identity: 'iers-eop-c04-20u24-dpsi-deps-0hutc-1962-now', status: 'formal_error_not_absolute_bound' },
      ttMinusUtc: { identity: 'iers-utc-tai-history-plus-tai-tt-32.184s', status: 'frozen_snapshot' },
      tdbMinusTt: { identity: 'HF2002_IERS_TN36_10_5_IAU2006_B3_TDB_MINUS_TT', status: 'source_bounded_model' },
    },
  }
}

export function makeSyntheticPointUncertainty(ruleChart, { longitudeErrorDegrees = 0, speedErrorDegreesPerDay = 0, basis = 'numerical_rounding_bound' } = {}) {
  const ids = [...SUPPORTED_DISTRIBUTION_BODIES, 'ascendant', 'midheaven']
  return {
    provenance: makeSyntheticBoundaryProvenance(),
    points: Object.fromEntries(ids.map(id => [id, {
      longitude: { absoluteErrorDegrees: longitudeErrorDegrees, basis, sourceRefs: [`synthetic.${id}.longitude`] },
      ...(SUPPORTED_DISTRIBUTION_BODIES.includes(id) ? { speed: { absoluteErrorDegreesPerDay: speedErrorDegreesPerDay, basis, sourceRefs: [`synthetic.${id}.speed`] } } : {}),
    }])),
  }
}

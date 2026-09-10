import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import test from 'node:test'

import { deriveAstrologyRuleChart } from '../src/astrology/astrologyRuleCore.js'
import {
  assessAstrologyDiscreteFactBoundaries,
  makeSyntheticPointUncertainty,
  MOTION_EPSILON_DEGREES_PER_DAY,
  SIGN_BOUNDARY_THRESHOLD_DEGREES,
  SOURCE_RELATIVE_FACT_FRAME,
  TIME_SCALE_BUNDLE_CANONICAL_SHA256,
} from '../src/astrology/astrologyDiscreteFactBoundary.js'

const ROOT = resolve('.')
const CONTRACT = resolve('api/provider/astrology-discrete-fact-boundary-contract-v1.json')
const CHECKER = resolve('scripts/check-astrology-discrete-fact-boundary-v1.mjs')

function stableRaw(overrides = {}) {
  return {
    schemaVersion: 'astrology-raw-chart-v0',
    zodiac: 'tropical',
    referenceFrame: 'geocentric',
    coordinateBasis: 'ecliptic-of-date',
    candidateId: 'synthetic_discrete_boundary_stable',
    inputStatus: 'confirmed',
    verificationStatus: 'confirmed',
    bodies: [
      { id: 'sun', longitudeDegrees: 11, longitudeSpeedDegreesPerDay: 0.9 },
      { id: 'moon', longitudeDegrees: 47, longitudeSpeedDegreesPerDay: 13 },
      { id: 'mercury', longitudeDegrees: 83, longitudeSpeedDegreesPerDay: -0.4 },
      { id: 'venus', longitudeDegrees: 119, longitudeSpeedDegreesPerDay: 1.2 },
      { id: 'mars', longitudeDegrees: 151, longitudeSpeedDegreesPerDay: 0.6 },
      { id: 'jupiter', longitudeDegrees: 187, longitudeSpeedDegreesPerDay: 0.2 },
      { id: 'saturn', longitudeDegrees: 223, longitudeSpeedDegreesPerDay: 0.05 },
      { id: 'uranus', longitudeDegrees: 259, longitudeSpeedDegreesPerDay: 0.02 },
      { id: 'neptune', longitudeDegrees: 295, longitudeSpeedDegreesPerDay: -0.03 },
      { id: 'pluto', longitudeDegrees: 331, longitudeSpeedDegreesPerDay: 0.001 },
    ],
    angles: {
      ascendant: { longitudeDegrees: 17 },
      midheaven: { longitudeDegrees: 77 },
    },
    ...overrides,
  }
}

function boundaryInput(chart, options = {}) {
  return makeSyntheticPointUncertainty(chart, options)
}

function chartFor(overrides = {}) {
  return deriveAstrologyRuleChart({ ...stableRaw(), ...overrides })
}

test('discrete FACT boundary contract is fresh-file valid and preserves the current readiness/public gates', async () => {
  const result = spawnSync(process.execPath, [CHECKER, CONTRACT], { cwd: ROOT, encoding: 'utf8' })
  assert.equal(result.status, 0, result.stderr)
  const report = JSON.parse(result.stdout)
  assert.equal(report.status, 'valid')
  assert.equal(report.timeScaleBundleCanonicalSha256, TIME_SCALE_BUNDLE_CANONICAL_SHA256)
  assert.deepEqual(report.factFrame, SOURCE_RELATIVE_FACT_FRAME)
  assert.equal(report.arbitraryDateDiscreteFactReadiness, 'ready_source_relative')
  assert.equal(report.intervalBackedBoundaryReadiness, 'available_fail_closed_when_interval_supplied')
  assert.equal(report.publicRedistribution, false)
  const fresh = JSON.parse(await readFile(CONTRACT, 'utf8'))
  assert.equal(fresh.references.timeScaleBundle.bundleCanonicalSha256, TIME_SCALE_BUNDLE_CANONICAL_SHA256)
  assert.equal(fresh.currentProductionAssessment.activation, 'unchanged_and_blocked')
})

test('stable explicit final-observable intervals confirm sign, motion, aspects, houses, rulers, and distribution', () => {
  const chart = chartFor()
  const assessment = assessAstrologyDiscreteFactBoundaries({ ruleChart: chart, uncertainty: boundaryInput(chart) })
  assert.equal(assessment.status, 'confirmed')
  assert.deepEqual(assessment.factFrame, SOURCE_RELATIVE_FACT_FRAME)
  assert.equal(assessment.points.sun.sign.status, 'confirmed')
  assert.equal(assessment.points.sun.motion.status, 'confirmed')
  assert.equal(assessment.points.mercury.motion.motionState, 'retrograde')
  assert.equal(assessment.wholeSignHouses.status, 'confirmed')
  assert.equal(assessment.chartRulers.status, 'confirmed')
  assert.equal(assessment.distribution.status, 'confirmed')

  const opposition = assessment.aspects.find(item => item.key === 'sun__jupiter')
  assert.equal(opposition.status, 'confirmed')
  assert.equal(opposition.classification, 'opposition')
  assert.equal(opposition.phaseStatus, 'confirmed')

  const noAspect = assessment.aspects.find(item => item.key === 'sun__moon')
  assert.equal(noAspect.status, 'confirmed')
  assert.equal(noAspect.classification, 'none')
  assert.equal(noAspect.phaseStatus, 'confirmed')
  assert.equal(assessment.promotion.calculationFactsChanged, false)
  assert.equal(assessment.promotion.existingToleranceChanged, false)
  assert.equal(assessment.promotion.activationChanged, false)
  assert.equal(assessment.source.timeScaleBundleSchemaVersion, 'astrology-time-scale-bundle-v1')
  assert.equal(assessment.source.ruleSetVersion, 'mallang-astrology-rule-core-v0')
  assert.equal(assessment.source.timeScaleComponents.dut1.identity, 'iers-eop-c04-20u24-dpsi-deps-0hutc-1962-now')
  assert.equal(assessment.points.sun.sign.uncertainty.basis, 'numerical_rounding_bound')
  assert.deepEqual(assessment.points.sun.sign.uncertainty.sourceRefs, ['synthetic.sun.longitude'])
  assert.equal(opposition.longitudeUncertainty.sun.status, 'valid')
  assert.equal(opposition.longitudeUncertainty.sun.basis, 'numerical_rounding_bound')
  assert.deepEqual(opposition.longitudeUncertainty.sun.sourceRefs, ['synthetic.sun.longitude'])
})

test('source-relative final-observable evidence does not require an absolute physical bound', () => {
  const chart = chartFor({ candidateId: 'synthetic_source_relative_interval' })
  const uncertainty = boundaryInput(chart, { basis: 'source_relative_model_interval' })
  const assessment = assessAstrologyDiscreteFactBoundaries({ ruleChart: chart, uncertainty })
  assert.equal(assessment.status, 'confirmed')
  assert.equal(assessment.points.sun.sign.uncertainty.basis, 'source_relative_model_interval')
  assert.equal(assessment.factFrame.physicalTruthGuarantee, false)
  assert.equal(assessment.factFrame.universalAbsoluteBoundRequired, false)
})

test('sign confirmation requires the frozen one-arcminute guard and never treats a near boundary as confirmed', () => {
  const chart = chartFor({
    candidateId: 'synthetic_sign_boundary_guard',
    bodies: stableRaw().bodies.map(body => body.id === 'sun' ? { ...body, longitudeDegrees: 30.005 } : body),
  })
  const assessment = assessAstrologyDiscreteFactBoundaries({ ruleChart: chart, uncertainty: boundaryInput(chart) })
  assert.equal(assessment.points.sun.sign.status, 'indeterminate')
  assert.equal(assessment.points.sun.sign.reason, 'sign_interval_crosses_or_approaches_boundary')
  assert.equal(assessment.points.sun.sign.boundaryGuardDegrees, SIGN_BOUNDARY_THRESHOLD_DEGREES)
  assert.equal(assessment.distribution.status, 'indeterminate')

  const safelyAway = chartFor({
    candidateId: 'synthetic_sign_boundary_margin',
    bodies: stableRaw().bodies.map(body => body.id === 'sun' ? { ...body, longitudeDegrees: 30.1 } : body),
  })
  const safeUncertainty = boundaryInput(safelyAway)
  safeUncertainty.points.sun.longitude.absoluteErrorDegrees = 0.01
  const safeAssessment = assessAstrologyDiscreteFactBoundaries({ ruleChart: safelyAway, uncertainty: safeUncertainty })
  assert.equal(safeAssessment.points.sun.sign.status, 'confirmed')
})

test('motion confirmation keeps direct, retrograde, and stationary separate at the frozen epsilon boundary', () => {
  const chart = chartFor({
    candidateId: 'synthetic_motion_guard',
    bodies: stableRaw().bodies.map(body => body.id === 'sun' ? { ...body, longitudeSpeedDegreesPerDay: 1.5e-7 } : body),
  })
  const uncertainty = boundaryInput(chart)
  uncertainty.points.sun.speed.absoluteErrorDegreesPerDay = 0.6e-7
  const assessment = assessAstrologyDiscreteFactBoundaries({ ruleChart: chart, uncertainty })
  assert.equal(assessment.points.sun.motion.status, 'indeterminate')
  assert.equal(assessment.points.sun.motion.epsilonDegreesPerDay, MOTION_EPSILON_DEGREES_PER_DAY)

  const stationaryChart = chartFor({
    candidateId: 'synthetic_stationary_guard',
    bodies: stableRaw().bodies.map(body => body.id === 'sun' ? { ...body, longitudeSpeedDegreesPerDay: 0 } : body),
  })
  const stationaryAssessment = assessAstrologyDiscreteFactBoundaries({ ruleChart: stationaryChart, uncertainty: boundaryInput(stationaryChart, { speedErrorDegreesPerDay: 0.5e-7 }) })
  assert.equal(stationaryAssessment.points.sun.motion.status, 'confirmed')
  assert.equal(stationaryAssessment.points.sun.motion.motionState, 'stationary')
})

test('aspect geometry becomes indeterminate at the existing max-orb boundary while phase can remain separately unavailable/indeterminate', () => {
  const boundaryChart = chartFor({
    candidateId: 'synthetic_aspect_orb_boundary',
    bodies: stableRaw().bodies.map(body => body.id === 'moon' ? { ...body, longitudeDegrees: 76 } : body),
  })
  const boundaryAssessment = assessAstrologyDiscreteFactBoundaries({ ruleChart: boundaryChart, uncertainty: boundaryInput(boundaryChart) })
  const boundaryAspect = boundaryAssessment.aspects.find(item => item.key === 'sun__moon')
  assert.equal(boundaryAspect.status, 'indeterminate')
  assert.equal(boundaryAspect.reason, 'aspect_interval_overlaps_or_approaches_orb_boundary')

  const phaseChart = chartFor({
    candidateId: 'synthetic_aspect_phase_guard',
    bodies: stableRaw().bodies.map(body => body.id === 'moon'
      ? { ...body, longitudeDegrees: 69, longitudeSpeedDegreesPerDay: 0.9 }
      : body.id === 'sun' ? { ...body, longitudeSpeedDegreesPerDay: 0.9 } : body),
  })
  const phaseAssessment = assessAstrologyDiscreteFactBoundaries({ ruleChart: phaseChart, uncertainty: boundaryInput(phaseChart) })
  const phaseAspect = phaseAssessment.aspects.find(item => item.key === 'sun__moon')
  assert.equal(phaseAspect.status, 'confirmed')
  assert.equal(phaseAspect.geometryStatus, 'confirmed')
  assert.equal(phaseAspect.phaseStatus, 'indeterminate')
  assert.equal(phaseAspect.phase, 'indeterminate')
  assert.equal(phaseAssessment.status, 'indeterminate')
})

test('houses and chart rulers inherit ASC uncertainty, while body-only distribution stays independently assessable', () => {
  const chart = chartFor({
    candidateId: 'synthetic_ascendant_uncertain',
    angles: { ascendant: { longitudeDegrees: 30.005 }, midheaven: { longitudeDegrees: 71 } },
  })
  const assessment = assessAstrologyDiscreteFactBoundaries({ ruleChart: chart, uncertainty: boundaryInput(chart) })
  assert.equal(assessment.points.ascendant.sign.status, 'indeterminate')
  assert.equal(assessment.wholeSignHouses.status, 'indeterminate')
  assert.equal(assessment.chartRulers.status, 'indeterminate')
  assert.equal(assessment.distribution.status, 'confirmed')
})

test('missing or rejected uncertainty is never inferred from C04 formal error or provider-equivalence agreement', () => {
  const chart = chartFor()
  const missing = boundaryInput(chart)
  delete missing.points.sun.longitude
  const missingAssessment = assessAstrologyDiscreteFactBoundaries({ ruleChart: chart, uncertainty: missing })
  assert.equal(missingAssessment.points.sun.sign.status, 'indeterminate')
  assert.equal(missingAssessment.points.sun.sign.reason, 'uncertainty_interval_missing')
  assert.equal(missingAssessment.status, 'indeterminate')

  const rejected = boundaryInput(chart)
  rejected.points.sun.longitude.basis = 'c04_formal_error_only'
  const rejectedAssessment = assessAstrologyDiscreteFactBoundaries({ ruleChart: chart, uncertainty: rejected })
  assert.equal(rejectedAssessment.points.sun.sign.status, 'blocked')
  assert.equal(rejectedAssessment.points.sun.sign.reason, 'uncertainty_basis_rejected')
  assert.equal(rejectedAssessment.status, 'blocked')

  const empirical = boundaryInput(chart)
  empirical.points.sun.longitude.basis = 'empirical_provider_equivalence'
  const empiricalAssessment = assessAstrologyDiscreteFactBoundaries({ ruleChart: chart, uncertainty: empirical })
  assert.equal(empiricalAssessment.status, 'blocked')
  assert.equal(empiricalAssessment.points.sun.sign.reason, 'uncertainty_basis_rejected')
})

test('provenance and central Rule Core tampering fail closed before any discrete confirmation', () => {
  const chart = chartFor()
  const missingProvenance = boundaryInput(chart)
  delete missingProvenance.provenance.timeScaleBundleCanonicalSha256
  const provenanceAssessment = assessAstrologyDiscreteFactBoundaries({ ruleChart: chart, uncertainty: missingProvenance })
  assert.equal(provenanceAssessment.status, 'blocked')
  assert.equal(provenanceAssessment.reasonCodes.includes('time_scale_bundle_identity_missing_or_mismatch'), true)
  assert.equal(provenanceAssessment.summary.overall.confirmed, 0)

  const tamperedChart = structuredClone(chart)
  tamperedChart.chartRulers.traditionalChartRuler = 'sun'
  const tamperAssessment = assessAstrologyDiscreteFactBoundaries({ ruleChart: tamperedChart, uncertainty: boundaryInput(tamperedChart) })
  assert.equal(tamperAssessment.status, 'blocked')
  assert.equal(tamperAssessment.chartRulers.status, 'blocked')
  assert.equal(tamperAssessment.chartRulers.reason, 'central_rule_output_mismatch')
})

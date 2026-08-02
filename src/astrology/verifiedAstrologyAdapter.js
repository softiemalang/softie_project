/**
 * Verified Astrology Adapter v1.
 *
 * This is an additive, dry-run-only boundary. It accepts already verified raw
 * and Rule Core documents; it never calculates, simulates, prompts, persists,
 * or promotes the result into a service path.
 */

import { createHash } from 'node:crypto'

export const VERIFIED_ASTROLOGY_ADAPTER_VERSION = 'verified-astrology-adapter-v1'
export const VERIFIED_CALCULATION_CONTEXT_SCHEMA = 'astrology-verified-calculation-context-v1'
export const VERIFIED_INTERPRETATION_CONTEXT_SCHEMA = 'astrology-verified-interpretation-preparation-context-v1'
export const EXPECTED_RAW_SCHEMA = 'astrology-raw-chart-v1'
export const EXPECTED_RULE_SCHEMA = 'astrology-rule-chart-v0'

const REQUIRED_COMPLETENESS = ['time', 'location', 'evidence']
const BODY_IDS = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto']

export function canonicalSha256(value) {
  return createHash('sha256').update(JSON.stringify(value) + '\n').digest('hex')
}

function blocked(reason, details = {}) {
  return {
    adapterVersion: VERIFIED_ASTROLOGY_ADAPTER_VERSION,
    calculationContext: null,
    interpretationPreparationContext: null,
    status: { calculationStatus: 'blocked', availableForInterpretation: false, integrationStatus: 'not_connected', serviceEligibility: 'blocked', reason },
    ...details,
  }
}

function exact(value, expected) { return value === expected }

function validateInput({ rawChart, ruleChart, rawChartHash, ruleChartHash, provenance = {}, inputCompleteness = {} }) {
  if (!rawChart || !ruleChart) return 'missing_raw_or_rule_chart'
  if (rawChart.schemaVersion !== EXPECTED_RAW_SCHEMA) return 'raw_schema_not_v1'
  if (ruleChart.schemaVersion !== EXPECTED_RULE_SCHEMA) return 'rule_schema_not_v0'
  if (rawChartHash !== canonicalSha256(rawChart)) return 'raw_hash_mismatch'
  if (ruleChartHash !== canonicalSha256(ruleChart)) return 'rule_hash_mismatch'
  if (rawChart.availability !== 'available' || rawChart.verificationStatus !== 'verified') return 'raw_availability_or_verification_incomplete'
  if (ruleChart.verificationStatus !== 'verified' || ruleChart.epistemicStatus !== 'derived') return 'rule_availability_or_verification_incomplete'
  if (!exact(rawChart.zodiac, 'tropical') || !exact(rawChart.referenceFrame, 'geocentric') || !exact(rawChart.coordinateBasis, 'ecliptic-of-date') || !exact(rawChart.geometry, 'geometric')) return 'raw_chart_system_mismatch'
  if (!exact(ruleChart.metadata?.zodiac, 'tropical') || !exact(ruleChart.metadata?.referenceFrame, 'geocentric') || !exact(ruleChart.metadata?.coordinateBasis, 'ecliptic-of-date') || !exact(ruleChart.metadata?.houseSystem, 'whole_sign')) return 'rule_chart_system_mismatch'
  if (!exact(ruleChart.houses?.houseSystem, 'whole_sign')) return 'whole_sign_house_contract_missing'
  if (!exact(rawChart.provenance?.de405?.evaluator, 'de405-canonical-v2')) return 'de405_canonical_provenance_missing'
  if (!exact(rawChart.provenance?.transform?.output, 'mean_ecliptic_and_equinox_of_date')) return 'mean_ecliptic_provenance_missing'
  if (!exact(rawChart.provenance?.transform?.speed, 'analytic_moving_date_frame_derivative')) return 'moving_frame_speed_provenance_missing'
  if (!BODY_IDS.every((id) => rawChart.bodies?.some((body) => body.id === id && Number.isFinite(body.longitudeDegrees) && Number.isFinite(body.longitudeSpeedDegreesPerDay)))) return 'body_longitude_or_moving_speed_incomplete'
  if (!ruleChart.angles?.ascendant || !ruleChart.angles?.midheaven || ruleChart.angles.ascendant.availability !== 'available' || ruleChart.angles.midheaven.availability !== 'available') return 'angles_incomplete'
  if (!Array.isArray(ruleChart.aspects) || ruleChart.aspects.some((aspect) => !aspect.phaseRuleId || !aspect.phase)) return 'aspect_phase_provenance_incomplete'
  if (provenance.rawChartSha256 !== rawChartHash || provenance.ruleChartSha256 !== ruleChartHash) return 'provenance_hash_mismatch'
  if (!REQUIRED_COMPLETENESS.every((key) => inputCompleteness[key] === 'complete')) return 'input_completeness_incomplete'
  return null
}

function buildCalculationContext(input) {
  const { rawChart, ruleChart, rawChartHash, ruleChartHash, provenance, inputCompleteness } = input
  return {
    schemaVersion: VERIFIED_CALCULATION_CONTEXT_SCHEMA,
    adapterVersion: VERIFIED_ASTROLOGY_ADAPTER_VERSION,
    calculationStatus: 'verified',
    availableForInterpretation: false,
    integrationStatus: 'not_connected',
    serviceEligibility: 'blocked',
    reason: 'verified_adapter_not_activated',
    inputCompleteness,
    chartSystem: {
      zodiac: 'tropical', coordinateBasis: 'mean_ecliptic/equinox-of-date', geometry: 'geometric',
      referenceFrame: 'geocentric', houseSystem: 'whole_sign', ephemeris: 'DE405 canonical-v2',
    },
    sourceDocuments: {
      rawSchema: rawChart.schemaVersion, rawChartHash, ruleSchema: ruleChart.schemaVersion, ruleChartHash,
    },
    bodies: rawChart.bodies.map(({ id, longitudeDegrees, longitudeSpeedDegreesPerDay, state }) => ({
      id, longitudeDegrees, movingFrameSpeedDegreesPerDay: longitudeSpeedDegreesPerDay, motion: ruleChart.bodies.find((body) => body.id === id)?.motionState || null, state,
    })),
    angles: { ascendant: ruleChart.angles.ascendant, midheaven: ruleChart.angles.midheaven },
    houses: ruleChart.houses,
    aspects: ruleChart.aspects,
    distribution: ruleChart.distribution,
    chartRulers: ruleChart.chartRulers,
    provenance,
    sourceRefs: { raw: 'rawChart', rule: 'ruleChart', bodies: 'rawChart.bodies[*]', aspects: 'ruleChart.aspects[*]' },
  }
}

export function createVerifiedAstrologyAdapterContext(input = {}) {
  const reason = validateInput(input)
  if (reason) return blocked(reason, { sourceDocuments: { rawChartHash: input.rawChartHash || null, ruleChartHash: input.ruleChartHash || null } })
  const calculationContext = buildCalculationContext(input)
  return {
    adapterVersion: VERIFIED_ASTROLOGY_ADAPTER_VERSION,
    calculationContext,
    interpretationPreparationContext: {
      schemaVersion: VERIFIED_INTERPRETATION_CONTEXT_SCHEMA,
      adapterVersion: VERIFIED_ASTROLOGY_ADAPTER_VERSION,
      calculationStatus: 'verified',
      availableForInterpretation: false,
      integrationStatus: 'not_connected',
      serviceEligibility: 'blocked',
      reason: 'verified_adapter_not_activated',
      calculationContextSchema: VERIFIED_CALCULATION_CONTEXT_SCHEMA,
      verifiedFacts: { bodies: calculationContext.bodies, angles: calculationContext.angles, houses: calculationContext.houses, aspects: calculationContext.aspects, distribution: calculationContext.distribution, chartRulers: calculationContext.chartRulers },
      sourceDocuments: calculationContext.sourceDocuments,
      provenance: input.provenance,
      sourceRefs: calculationContext.sourceRefs,
    },
    status: { calculationStatus: 'verified', availableForInterpretation: false, integrationStatus: 'not_connected', serviceEligibility: 'blocked', reason: 'verified_adapter_not_activated' },
  }
}

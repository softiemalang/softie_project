export const INTERPRETATION_EPISTEMIC_CLASSES = Object.freeze([
  'observed_or_calculated',
  'deterministically_derived',
  'unsupported',
  'blocked',
])

export const INTERPRETATION_CLAIM_VOCABULARY = Object.freeze({
  allowed: [
    { claimType: 'body.longitude', description: 'verified ecliptic longitude', sourcePaths: ['rawChart.bodies[*].longitudeDegrees'] },
    { claimType: 'body.moving_frame_motion', description: 'verified moving-frame speed and Rule Core motion state', sourcePaths: ['rawChart.bodies[*].longitudeSpeedDegreesPerDay', 'ruleChart.bodies[*].motionState'] },
    { claimType: 'angle.placement', description: 'verified angle placement', sourcePaths: ['ruleChart.angles.ascendant', 'ruleChart.angles.midheaven'] },
    { claimType: 'house.whole_sign_placement', description: 'Whole Sign house placement', sourcePaths: ['ruleChart.houses.placements[*]'] },
    { claimType: 'aspect.major', description: 'major aspect type, orb, phase, and phase rule', sourcePaths: ['ruleChart.aspects[*]'] },
    { claimType: 'distribution.elements_modalities_polarity', description: 'element, modality, and polarity distribution', sourcePaths: ['ruleChart.distribution'] },
    { claimType: 'chart_ruler', description: 'chart ruler and the Rule Core rule identity', sourcePaths: ['ruleChart.chartRulers'] },
  ],
  forbidden: [
    { claimType: 'psychological_diagnosis', reason: 'not calculated or sourced by Rule Core' },
    { claimType: 'event_or_fate_assertion', reason: 'deterministic prediction is outside the packet' },
    { claimType: 'unsupported_house_or_aspect', reason: 'unsupported values cannot be promoted to available' },
    { claimType: 'retrograde_or_applying_reinference', reason: 'motion and phase must remain Rule Core outputs' },
    { claimType: 'legacy_simulation_fallback', reason: 'date-seed or simulated values are contaminated' },
    { claimType: 'provenance_free_number', reason: 'every claim must resolve through sourceRefs' },
    { claimType: 'confidence_or_probability', reason: 'the packet does not invent confidence or probability' },
    { claimType: 'generative_sentence', reason: 'natural-language interpretation is a later boundary' },
  ],
})

export function isAllowedClaimType(claimType) {
  return INTERPRETATION_CLAIM_VOCABULARY.allowed.some(item => item.claimType === claimType)
}

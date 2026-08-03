#!/usr/bin/env node
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { INTERPRETATION_CLAIM_VOCABULARY } from '../src/astrology/interpretationClaimVocabulary.js'
import { INTERPRETATION_CONTEXT_SCHEMA, INTERPRETATION_CONTEXT_VERSION, CONTEXT_BLOCK_REASON } from '../src/astrology/interpretationConsumer.js'
import { INTERPRETATION_PACKET_SCHEMA, INTERPRETATION_PACKET_VERSION } from '../src/astrology/interpretationPacket.js'

const path = process.argv[2] || 'artifacts/astrology-interpretation-context-v1/complete.json'
const bytes = await readFile(path)
const evidence = JSON.parse(bytes)
const context = evidence.context
const fail = message => { throw new Error(message) }
const hash = value => /^[a-f0-9]{64}$/.test(value || '')
const sha256 = value => createHash('sha256').update(value).digest('hex')
const ordered = value => { if (Array.isArray(value)) return value.map(ordered); if (!value || typeof value !== 'object') return value; return Object.fromEntries(Object.keys(value).sort().map(key => [key, ordered(value[key])])) }
const contextContentSha256 = value => { const copy = structuredClone(value); delete copy.contextContentSha256; return sha256(`${JSON.stringify(ordered(copy))}\n`) }
const activation = { availableForInterpretation: false, integrationStatus: 'not_connected', serviceEligibility: 'blocked', reason: CONTEXT_BLOCK_REASON }
const allowed = new Set(INTERPRETATION_CLAIM_VOCABULARY.allowed.map(item => item.claimType))
const forbidden = new Set(INTERPRETATION_CLAIM_VOCABULARY.forbidden.map(item => item.claimType))
const claims = []
const walk = value => { if (!value || typeof value !== 'object') return; if (value.claimType && ('value' in value || 'sourceRefs' in value || 'epistemic' in value)) claims.push(value); for (const child of Object.values(value)) walk(child) }
const refsFor = claim => {
  if (!Array.isArray(claim.sourceRefs) || claim.sourceRefs.length === 0) return false
  return claim.sourceRefs.every(ref => {
    if (claim.claimType === 'body.longitude') return /^rawChart\.bodies\.[a-z_]+\.longitudeDegrees$/.test(ref)
    if (claim.claimType === 'body.moving_frame_motion') return /^rawChart\.bodies\.[a-z_]+\.longitudeSpeedDegreesPerDay$/.test(ref) || /^ruleChart\.bodies\.[a-z_]+\.motionState$/.test(ref)
    if (claim.claimType === 'angle.placement') return /^ruleChart\.angles\.(ascendant|midheaven)$/.test(ref)
    if (claim.claimType === 'house.whole_sign_placement') return ref === 'ruleChart.houses'
    if (claim.claimType === 'aspect.major') return /^ruleChart\.aspects\.[a-z_]+\.[a-z_]+$/.test(ref)
    if (claim.claimType === 'distribution.elements_modalities_polarity') return ref === 'ruleChart.distribution'
    if (claim.claimType === 'chart_ruler') return ref === 'ruleChart.chartRulers'
    return false
  })
}

if (evidence.schemaVersion !== 'astrology-interpretation-context-evidence-v1') fail('context evidence schema mismatch')
if (!context || context.schemaVersion !== INTERPRETATION_CONTEXT_SCHEMA || context.contextVersion !== INTERPRETATION_CONTEXT_VERSION) fail('context schema or version mismatch')
if (context.contextStatus !== 'complete' || context.usable !== false) fail('complete context status or usable boundary invalid')
if (JSON.stringify(context.activation) !== JSON.stringify(activation) || context.availableForInterpretation !== false || context.integrationStatus !== 'not_connected' || context.serviceEligibility !== 'blocked' || context.reason !== CONTEXT_BLOCK_REASON) fail('context activation boundary promoted')
if (!hash(context.contextContentSha256) || context.contextContentSha256 !== evidence.contextContentSha256 || contextContentSha256(context) !== evidence.contextContentSha256) fail('context content hash mismatch')
if (context.sourcePacket?.schemaVersion !== INTERPRETATION_PACKET_SCHEMA || context.sourcePacket.packetVersion !== INTERPRETATION_PACKET_VERSION || !hash(context.sourcePacket.packetContentSha256)) fail('source packet identity missing')
if (!Array.isArray(context.provenance?.sourceRefs) || context.provenance.sourceRefs.length === 0) fail('context provenance missing')
if (context.provenance.sourceIdentities?.rawChartSha256 !== context.provenance.sourceDocuments?.rawChartHash || context.provenance.sourceIdentities?.ruleChartSha256 !== context.provenance.sourceDocuments?.ruleChartHash) fail('context provenance identity mismatch')
if (JSON.stringify(context.claimVocabulary) !== JSON.stringify(INTERPRETATION_CLAIM_VOCABULARY)) fail('context vocabulary mismatch')
walk(context)
if (!claims.length) fail('context claims missing')
if (claims.some(claim => !allowed.has(claim.claimType) || forbidden.has(claim.claimType))) fail('claim vocabulary boundary failure')
if (claims.some(claim => !Array.isArray(claim.sourceRefs) || !refsFor(claim) || claim.sourceRefs.some(ref => !context.provenance.sourceRefs.includes(ref) && !ref.startsWith('rawChart.bodies.') && !ref.startsWith('ruleChart.')))) fail('claim sourceRefs resolution failure')
if (claims.some(claim => !['observed_or_calculated', 'deterministically_derived'].includes(claim.epistemic))) fail('claim epistemic class invalid')
if (context.observedOrCalculated.bodies.some(body => body.longitudeDegrees.epistemic !== 'observed_or_calculated' || body.movingFrameSpeedDegreesPerDay.epistemic !== 'observed_or_calculated')) fail('observed/calculated boundary mixed')
if (context.ruleCoreDerived.bodies.some(body => body.motion.epistemic !== 'deterministically_derived') || Object.values(context.ruleCoreDerived.angles).some(claim => claim.epistemic !== 'deterministically_derived')) fail('derived boundary mixed')
if (context.ruleCoreDerived.wholeSignHouses.value.houseSystem !== 'whole_sign' || context.provenance.sourceIdentities.evaluator?.evaluator !== 'de405-canonical-v2') fail('Whole Sign or ephemeris contract invalid')
if (JSON.stringify(context).includes('frozenFrameSpeed') || Object.keys(context).some(key => ['simulation', 'placidus', 'legacyPrep', 'frozenSpeed'].includes(key))) fail('contaminated value promoted')
if (!context.unsupported.some(item => item.status === 'unsupported') || !context.blocked.some(item => item.status === 'blocked' && item.reason === CONTEXT_BLOCK_REASON)) fail('unsupported or blocked boundary missing')
if (context.consumer.externalLlm !== false || context.consumer.naturalLanguageGeneration !== false || context.consumer.psychologicalAssessment !== false || context.consumer.prediction !== false || context.consumer.advice !== false || context.consumer.scoring !== false || context.consumer.productionConnection !== false) fail('consumer capability boundary promoted')
const requiredCases = ['complete', 'wrongVersion', 'activationPromoted', 'forbiddenClaim', 'missingClaimSourceRefs', 'mixedEpistemicBoundary', 'placidusContamination', 'simulationContamination', 'frozenSpeedContamination', 'legacyPrepContamination', 'packetContentHashMismatch', 'provenanceMismatch', 'packetVocabularyMismatch']
if (!evidence.cases || requiredCases.some(name => !evidence.cases[name])) fail('negative evidence cases incomplete')
if (evidence.cases.complete.contextStatus !== 'complete' || requiredCases.slice(1).some(name => evidence.cases[name].contextStatus !== 'blocked')) fail('negative evidence not fail-closed')
const reasonChecks = { wrongVersion: 'packet_schema_or_version_mismatch', activationPromoted: 'packet_usable_or_activation_boundary_invalid', forbiddenClaim: 'claim_type_not_allowed', missingClaimSourceRefs: 'claim_shape_invalid', mixedEpistemicBoundary: 'claim_epistemic_boundary_invalid', placidusContamination: 'whole_sign_contract_invalid', simulationContamination: 'calculation_contamination', frozenSpeedContamination: 'calculation_contamination', legacyPrepContamination: 'calculation_contamination', packetContentHashMismatch: 'packet_content_hash_missing_or_mismatch', provenanceMismatch: 'packet_provenance_mismatch', packetVocabularyMismatch: 'packet_claim_vocabulary_invalid' }
for (const [name, reason] of Object.entries(reasonChecks)) if (!evidence.cases[name].blockedReasons.includes(reason)) fail(`negative evidence reason missing: ${name}`)
console.log(JSON.stringify({ pass: true, claims: claims.length, artifactByteSha256: sha256(bytes), contextContentSha256: evidence.contextContentSha256, packetContentSha256: context.sourcePacket.packetContentSha256, activation }, null, 2))

#!/usr/bin/env node
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { ASTROLOGY_INTERPRETATION_READINESS_SCHEMA, ASTROLOGY_INTERPRETATION_READINESS_VERSION, READINESS_REASON_CODES, astrologyInterpretationReadinessContentSha256 } from '../src/astrology/interpretationReadiness.js'

const path = process.argv[2] || 'artifacts/astrology-interpretation-readiness-v1/complete.json'
const bytes = await readFile(path)
const evidence = JSON.parse(bytes)
const fail = message => { throw new Error(message) }
const readiness = evidence.readiness
if (evidence.schemaVersion !== 'astrology-interpretation-readiness-evidence-v1') fail('readiness evidence schema mismatch')
if (!readiness || readiness.schemaVersion !== ASTROLOGY_INTERPRETATION_READINESS_SCHEMA || readiness.readinessVersion !== ASTROLOGY_INTERPRETATION_READINESS_VERSION) fail('readiness schema or version mismatch')
if (readiness.readinessContentSha256 !== evidence.readinessContentSha256 || readiness.readinessContentSha256 !== astrologyInterpretationReadinessContentSha256(readiness)) fail('readiness content hash mismatch')
if (readiness.readinessStatus !== 'complete') fail('complete readiness is blocked')
if (readiness.decisions.localInterpretationResearch !== 'eligible_for_local_interpretation_research' || readiness.decisions.userDelivery !== 'not_eligible_for_user_delivery' || readiness.decisions.productionActivation !== 'production_activation_blocked' || readiness.decisions.humanReview !== 'human_review_required') fail('readiness decision separation invalid')
if (readiness.activation.availableForInterpretation !== false || readiness.activation.integrationStatus !== 'not_connected' || readiness.activation.serviceEligibility !== 'blocked' || readiness.activation.reason !== 'interpretation_packet_not_activated') fail('readiness activation boundary promoted')
if (readiness.connected !== false) fail('readiness connected boundary promoted')
if (readiness.consumerBoundary.externalLlm !== false || readiness.consumerBoundary.userDelivery !== false || readiness.consumerBoundary.ui !== false || readiness.consumerBoundary.production !== false || readiness.consumerBoundary.database !== false) fail('readiness consumer boundary promoted')
if (readiness.claimCounts.total !== 53 || readiness.claimCounts.observedOrCalculated !== 20 || readiness.claimCounts.deterministicallyDerived !== 33) fail('claim counts invalid')
const requiredChecks = ['context_schema', 'context_status', 'context_content_hash', 'packet_identity', 'provenance_source_refs', 'claim_counts', 'claim_vocabulary', 'epistemic_boundary', 'calculation_contamination', 'activation_boundary', 'consumer_boundary']
if (!Array.isArray(readiness.checks) || requiredChecks.some(id => !readiness.checks.some(check => check.id === id && check.status === 'passed'))) fail('complete readiness checks incomplete')
if (readiness.blockedReasons.some(reason => !READINESS_REASON_CODES.includes(reason))) fail('unknown readiness reason code')
const requiredCases = ['complete', 'wrongSchemaVersion', 'packetContextHashMismatch', 'provenanceTampered', 'sourceRefsTampered', 'claimCountTampered', 'vocabularyTampered', 'epistemicBoundaryMixed', 'activationInjected', 'placidusContamination', 'simulationContamination', 'frozenSpeedContamination', 'legacyPrepContamination', 'userDeliveryClaim', 'productionClaim']
if (!evidence.cases || requiredCases.some(name => !evidence.cases[name])) fail('negative readiness cases incomplete')
if (evidence.cases.complete.readinessStatus !== 'complete' || requiredCases.slice(1).some(name => evidence.cases[name].readinessStatus !== 'blocked')) fail('negative readiness did not fail closed')
const reasonChecks = {
  wrongSchemaVersion: 'packet_schema_or_version_mismatch', packetContextHashMismatch: 'packet_content_hash_missing_or_mismatch', provenanceTampered: 'packet_provenance_mismatch', sourceRefsTampered: 'claim_source_refs_missing_or_unresolvable', claimCountTampered: 'claim_count_invalid', vocabularyTampered: 'packet_claim_vocabulary_invalid', epistemicBoundaryMixed: 'claim_epistemic_boundary_invalid', activationInjected: 'packet_usable_or_activation_boundary_invalid', placidusContamination: 'whole_sign_contract_invalid', simulationContamination: 'calculation_contamination', frozenSpeedContamination: 'calculation_contamination', legacyPrepContamination: 'calculation_contamination', userDeliveryClaim: 'consumer_boundary_promoted', productionClaim: 'consumer_boundary_promoted',
}
for (const [name, reason] of Object.entries(reasonChecks)) if (!evidence.cases[name].blockedReasons.includes(reason) && !evidence.cases[name].checks.some(check => check.reasonCodes.includes(reason))) fail(`negative readiness reason missing: ${name}`)
console.log(JSON.stringify({ pass: true, readinessContentSha256: evidence.readinessContentSha256, artifactByteSha256: createHash('sha256').update(bytes).digest('hex'), decisions: readiness.decisions, activation: readiness.activation }, null, 2))

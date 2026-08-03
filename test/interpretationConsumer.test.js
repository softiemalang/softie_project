import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { buildAstrologyInterpretationContext, canonicalInterpretationContextJson, interpretationContextContentSha256 } from '../src/astrology/interpretationConsumer.js'

const packet = JSON.parse(readFileSync('artifacts/astrology-interpretation-packet-v1/complete.json', 'utf8')).packet

test('local consumer creates deterministic, source-backed, activation-blocked context', () => {
  const first = buildAstrologyInterpretationContext(packet)
  const second = buildAstrologyInterpretationContext(structuredClone(packet))
  assert.deepEqual(first, second)
  assert.equal(first.contextStatus, 'complete')
  assert.equal(first.usable, false)
  assert.equal(first.availableForInterpretation, false)
  assert.equal(first.integrationStatus, 'not_connected')
  assert.equal(first.serviceEligibility, 'blocked')
  assert.equal(first.reason, 'interpretation_packet_not_activated')
  assert.equal(first.contextContentSha256, interpretationContextContentSha256(first))
  assert.equal(first.observedOrCalculated.bodies[0].longitudeDegrees.epistemic, 'observed_or_calculated')
  assert.equal(first.ruleCoreDerived.bodies[0].motion.epistemic, 'deterministically_derived')
  assert.ok(first.ruleCoreDerived.majorAspects.every(claim => claim.value.orbDegrees !== undefined && claim.value.phase && claim.value.phaseRuleId))
  assert.equal(JSON.stringify(first).includes('frozenFrameSpeed'), false)
  assert.equal(canonicalInterpretationContextJson(JSON.parse(JSON.stringify(first, (key, value) => value && typeof value === 'object' && !Array.isArray(value) ? Object.fromEntries(Object.entries(value).reverse()) : value))), canonicalInterpretationContextJson(first))
})

for (const [name, mutate, reason] of [
  ['wrong version', value => { value.packetVersion = '9.9.9' }, 'packet_schema_or_version_mismatch'],
  ['activation promotion', value => { value.activation.availableForInterpretation = true }, 'packet_usable_or_activation_boundary_invalid'],
  ['forbidden claim', value => { value.verifiedBodies[0].extra = { claimType: 'psychological_diagnosis', value: 'x', sourceRefs: ['ruleChart.bodies.sun.motionState'], epistemic: 'deterministically_derived' } }, 'claim_type_not_allowed'],
  ['source refs missing', value => { delete value.verifiedBodies[0].longitudeDegrees.sourceRefs }, 'claim_shape_invalid'],
  ['epistemic mixing', value => { value.verifiedBodies[0].motion.epistemic = 'observed_or_calculated' }, 'claim_epistemic_boundary_invalid'],
  ['placidus contamination', value => { value.wholeSignHouses.value.houseSystem = 'placidus' }, 'whole_sign_contract_invalid'],
  ['simulation contamination', value => { value.simulation = true }, 'calculation_contamination'],
  ['frozen speed contamination', value => { value.speedModel = 'frozen' }, 'calculation_contamination'],
  ['legacy prep contamination', value => { value.legacyPrep = true }, 'calculation_contamination'],
  ['content hash mismatch', value => { value.packetContentSha256 = '0'.repeat(64) }, 'packet_content_hash_missing_or_mismatch'],
  ['provenance mismatch', value => { value.identities.ruleChartSha256 = '1'.repeat(64) }, 'packet_provenance_mismatch'],
  ['packet vocabulary mismatch', value => { value.claimVocabulary.allowed[0].claimType = 'unregistered_claim' }, 'packet_claim_vocabulary_invalid'],
  ['missing body section', value => { delete value.verifiedBodies }, 'claim_shape_invalid'],
]) test(`consumer fails closed: ${name}`, (t) => {
  const value = structuredClone(packet)
  mutate(value)
  const context = buildAstrologyInterpretationContext(value)
  assert.equal(context.contextStatus, 'blocked', t.name)
  assert.equal(context.usable, false)
  assert.ok(context.blockedReasons.includes(reason), `${t.name}: ${context.blockedReasons.join(',')}`)
})

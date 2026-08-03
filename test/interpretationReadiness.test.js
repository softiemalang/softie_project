import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { buildAstrologyInterpretationContext } from '../src/astrology/interpretationConsumer.js'
import { evaluateAstrologyInterpretationReadiness, astrologyInterpretationReadinessContentSha256 } from '../src/astrology/interpretationReadiness.js'

const packet = JSON.parse(readFileSync('artifacts/astrology-interpretation-packet-v1/complete.json', 'utf8')).packet

test('readiness separates local research eligibility from delivery and production blocks', () => {
  const context = buildAstrologyInterpretationContext(packet)
  const first = evaluateAstrologyInterpretationReadiness({ packet, context })
  const second = evaluateAstrologyInterpretationReadiness({ packet: structuredClone(packet), context: structuredClone(context) })
  assert.deepEqual(first, second)
  assert.equal(first.readinessStatus, 'complete')
  assert.deepEqual(first.claimCounts, { total: 53, observedOrCalculated: 20, deterministicallyDerived: 33 })
  assert.equal(first.decisions.localInterpretationResearch, 'eligible_for_local_interpretation_research')
  assert.equal(first.decisions.userDelivery, 'not_eligible_for_user_delivery')
  assert.equal(first.decisions.productionActivation, 'production_activation_blocked')
  assert.equal(first.decisions.humanReview, 'human_review_required')
  assert.equal(first.activation.availableForInterpretation, false)
  assert.equal(first.readinessContentSha256, astrologyInterpretationReadinessContentSha256(first))
})

for (const [name, mutate, reason] of [
  ['wrong schema', value => { value.packetVersion = '9.9.9' }, 'packet_schema_or_version_mismatch'],
  ['packet hash', value => { value.packetContentSha256 = '0'.repeat(64) }, 'packet_content_hash_missing_or_mismatch'],
  ['activation promotion', value => { value.activation.availableForInterpretation = true }, 'packet_usable_or_activation_boundary_invalid'],
]) test(`readiness fails closed: ${name}`, () => {
  const value = structuredClone(packet)
  mutate(value)
  const context = buildAstrologyInterpretationContext(value)
  const readiness = evaluateAstrologyInterpretationReadiness({ packet: value, context })
  assert.equal(readiness.readinessStatus, 'blocked')
  assert.ok(readiness.blockedReasons.includes('context_not_complete') || readiness.checks.some(check => check.reasonCodes.includes(reason)))
  assert.equal(readiness.activation.integrationStatus, 'not_connected')
})

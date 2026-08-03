import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { deriveAstrologyRuleChart } from '../src/astrology/astrologyRuleCore.js'
import { canonicalSha256, createVerifiedAstrologyAdapterContext } from '../src/astrology/verifiedAstrologyAdapter.js'
import { buildInterpretationPacket, canonicalPacketJson, packetContentSha256 } from '../src/astrology/interpretationPacket.js'

const evidence = JSON.parse(readFileSync('test/fixtures/astrology/golden/astrology-ephemeris-golden-v1.json', 'utf8'))
const rawChart = evidence.rawChart.value
const ruleChart = deriveAstrologyRuleChart(rawChart)
const rawChartSha256 = canonicalSha256(rawChart)
const ruleChartSha256 = canonicalSha256(ruleChart)
const adapter = createVerifiedAstrologyAdapterContext({ rawChart, ruleChart, rawChartHash: rawChartSha256, ruleChartHash: ruleChartSha256, provenance: { rawChartSha256, ruleChartSha256, sourceRefs: ['rawChart', 'ruleChart'] }, inputCompleteness: { time: 'complete', location: 'complete', evidence: 'complete' } })
const readiness = { schemaVersion: 'verified-astrology-readiness-v1', calculationReady: true, readiness: 'ready', sourceRefs: ['readiness.input'] }
const orchestration = { schemaVersion: 'astrology-local-verified-orchestration-v1', orchestrationVersion: '1.0.0', status: 'completed', providerBundleCanonicalSha256: '4c1814208dacbb2fd86674c15f37c2c70c14485cd031541e3acfd1190df835c5', rawChartHash: rawChartSha256, ruleChartHash: ruleChartSha256, runtime: { bsp: { hash: 'b'.repeat(64) }, runner: { protocolVersion: 'de405-canonical-v2-protocol-v1', runnerIdentity: 'fixture-runner' }, evaluator: { evaluator: 'de405-canonical-v2' } }, sourceRefs: ['orchestration.rawChart'], activation: { availableForInterpretation: false, integrationStatus: 'not_connected', serviceEligibility: 'blocked', reason: 'activation_requires_user_approval' } }
const base = () => ({ orchestration: structuredClone(orchestration), adapter: structuredClone(adapter), readiness: structuredClone(readiness), rawChart, ruleChart, sourceIdentities: { providerBundleSha256: orchestration.providerBundleCanonicalSha256, rawChartSha256, ruleChartSha256, adapterSha256: packetContentSha256(adapter.interpretationPreparationContext), readinessSha256: packetContentSha256(readiness), inputCompleteness: 'complete', sourceRefs: { raw: ['rawChart'], rule: ['ruleChart'], provider: ['orchestration.providerBundle'], adapter: ['orchestration.adapter'], readiness: ['readiness'] } } })

test('complete packet is deterministic, source-backed, and activation-blocked', () => {
  const first = buildInterpretationPacket(base())
  const second = buildInterpretationPacket(base())
  assert.equal(first.packetStatus, 'complete')
  assert.equal(first.usable, false)
  assert.deepEqual(first, second)
  assert.equal(packetContentSha256(first), first.packetContentSha256)
  assert.equal('packetSha256' in first, false)
  assert.equal(first.activation.reason, 'interpretation_packet_not_activated')
  assert.equal(first.verifiedAngles.ascendant.epistemic, 'deterministically_derived')
  assert.ok(first.majorAspects.every(item => item.value.phaseRuleId && item.sourceRefs.length))
  assert.equal(canonicalPacketJson(JSON.parse(JSON.stringify(first, (key, value) => value && typeof value === 'object' && !Array.isArray(value) ? Object.fromEntries(Object.entries(value).reverse()) : value))), canonicalPacketJson(first))
})

for (const [name, mutate, expected] of [
  ['orchestration blocked', v => { v.orchestration.status = 'blocked'; v.orchestration.blockedReasons = ['runtime_identity_or_protocol_mismatch'] }, 'runtime_identity_or_protocol_mismatch'],
  ['provider hash mismatch', v => { v.sourceIdentities.providerBundleSha256 = 'a'.repeat(64) }, 'provider_hash_mismatch'],
  ['raw/rule hash mismatch', v => { v.orchestration.rawChartHash = 'c'.repeat(64) }, 'raw_hash_mismatch'],
  ['adapter/readiness mismatch', v => { v.sourceIdentities.adapterSha256 = 'd'.repeat(64) }, 'adapter_hash_mismatch'],
  ['incomplete sourceRefs', v => { v.sourceIdentities.sourceRefs = {} }, 'provenance_or_source_refs_incomplete'],
  ['unsupported promotion', v => { v.sourceIdentities.unsupportedPromotion = true }, 'unsupported_value_promoted'],
  ['contamination', v => { v.sourceIdentities.contaminationType = 'placidus' }, 'calculation_contamination'],
  ['activation regression', v => { v.orchestration.activation.availableForInterpretation = true }, 'activation_boundary_missing_or_promoted'],
  ['input incomplete', v => { v.sourceIdentities.inputCompleteness = 'pending' }, 'input_completeness_incomplete'],
]) test(`packet fail-closed: ${name}`, (t) => {
  const value = base(); mutate(value)
  const packet = buildInterpretationPacket(value)
  assert.equal(packet.packetStatus, 'blocked')
  assert.equal(packet.usable, false)
  assert.ok(packet.blockedReasons.includes(expected), `${t.name}: ${packet.blockedReasons.join(',')}`)
  assert.equal(packet.activation.integrationStatus, 'not_connected')
})

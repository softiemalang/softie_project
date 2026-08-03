#!/usr/bin/env node
import { createHash } from 'node:crypto'
import { readFile, mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { deriveAstrologyRuleChart } from '../src/astrology/astrologyRuleCore.js'
import { canonicalSha256, createVerifiedAstrologyAdapterContext } from '../src/astrology/verifiedAstrologyAdapter.js'
import { buildInterpretationPacket, packetContentSha256 } from '../src/astrology/interpretationPacket.js'

const evidencePath = 'test/fixtures/astrology/golden/astrology-ephemeris-golden-v1.json'
const evidence = JSON.parse(await readFile(evidencePath, 'utf8'))
const rawChart = evidence.rawChart.value
const ruleChart = deriveAstrologyRuleChart(rawChart)
const rawChartSha256 = canonicalSha256(rawChart)
const ruleChartSha256 = canonicalSha256(ruleChart)
const adapter = createVerifiedAstrologyAdapterContext({
  rawChart, ruleChart, rawChartHash: rawChartSha256, ruleChartHash: ruleChartSha256,
  provenance: { rawChartSha256, ruleChartSha256, sourceRefs: ['rawChart', 'ruleChart', 'goldenEvidence'] },
  inputCompleteness: { time: 'complete', location: 'complete', evidence: 'complete' },
})
const readiness = {
  schemaVersion: 'verified-astrology-readiness-v1', calculationReady: true, readiness: 'ready',
  sourceRefs: ['readiness.input', 'readiness.timeScale', 'readiness.ephemeris', 'readiness.runtime', 'readiness.documents', 'readiness.contamination'],
}
const orchestration = {
  schemaVersion: 'astrology-local-verified-orchestration-v1', orchestrationVersion: '1.0.0', status: 'completed',
  providerBundleCanonicalSha256: '4c1814208dacbb2fd86674c15f37c2c70c14485cd031541e3acfd1190df835c5',
  rawChartHash: rawChartSha256, ruleChartHash: ruleChartSha256,
  runtime: { bsp: { hash: evidence.kernel.sha256, hashStatus: 'verified' }, runner: { protocolVersion: 'de405-canonical-v2-protocol-v1', runnerIdentity: 'sha256:synthetic-runner' }, evaluator: { evaluator: 'de405-canonical-v2' } },
  sourceRefs: ['orchestration.input', 'orchestration.providerBundle', 'orchestration.runtime', 'orchestration.rawChart', 'orchestration.ruleChart', 'orchestration.adapter', 'orchestration.readiness'],
  activation: { availableForInterpretation: false, integrationStatus: 'not_connected', serviceEligibility: 'blocked', reason: 'activation_requires_user_approval' },
}
const sourceIdentities = {
  providerBundleSha256: orchestration.providerBundleCanonicalSha256, rawChartSha256, ruleChartSha256,
  adapterSha256: packetContentSha256(adapter.interpretationPreparationContext), readinessSha256: packetContentSha256(readiness), inputCompleteness: 'complete', contamination: false,
  sourceRefs: { provider: ['orchestration.providerBundle'], raw: ['orchestration.rawChart', 'rawChart'], rule: ['orchestration.ruleChart', 'ruleChart'], adapter: ['orchestration.adapter'], readiness: ['orchestration.readiness'] },
}
const packet = buildInterpretationPacket({ orchestration, adapter, readiness, rawChart, ruleChart, sourceIdentities })
if (packet.packetStatus !== 'complete') throw new Error(`packet blocked: ${packet.blockedReasons.join(',')}`)
const makeCase = mutate => {
  const value = { orchestration: structuredClone(orchestration), adapter: structuredClone(adapter), readiness: structuredClone(readiness), rawChart, ruleChart, sourceIdentities: structuredClone(sourceIdentities) }
  mutate(value)
  return buildInterpretationPacket(value)
}
const cases = {
  complete: packet,
  orchestrationBlocked: makeCase(value => { value.orchestration.status = 'blocked'; value.orchestration.blockedReasons = ['runtime_identity_or_protocol_mismatch'] }),
  rawRuleHashMismatch: makeCase(value => { value.orchestration.rawChartHash = 'a'.repeat(64) }),
  adapterReadinessMismatch: makeCase(value => { value.sourceIdentities.adapterSha256 = 'b'.repeat(64) }),
  incompleteSourceRefs: makeCase(value => { value.sourceIdentities.sourceRefs = {} }),
  unsupportedValuePromotion: makeCase(value => { value.sourceIdentities.unsupportedPromotion = true }),
  contamination: makeCase(value => { value.sourceIdentities.contaminationType = 'placidus' }),
  activationBoundaryRegression: makeCase(value => { value.orchestration.activation.availableForInterpretation = true }),
  inputCompletenessFailure: makeCase(value => { value.sourceIdentities.inputCompleteness = 'pending' }),
}
const output = { schemaVersion: 'astrology-interpretation-packet-evidence-v1', fixture: evidence.fixture.id, packet, cases, packetContentSha256: packetContentSha256(packet) }
const outputDir = resolve(process.env.INTERPRETATION_PACKET_OUTPUT_DIR || 'artifacts/astrology-interpretation-packet-v1')
await mkdir(outputDir, { recursive: true })
const outputPath = resolve(outputDir, 'complete.json')
const outputText = `${JSON.stringify(output, null, 2)}\n`
await writeFile(outputPath, outputText)
console.log(JSON.stringify({ output: outputPath, artifactByteSha256: createHash('sha256').update(outputText).digest('hex'), packetContentSha256: output.packetContentSha256 }, null, 2))

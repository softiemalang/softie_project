#!/usr/bin/env node
import { createHash } from 'node:crypto'
import { readFile, mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { canonicalSha256 } from '../src/astrology/verifiedAstrologyAdapter.js'
import { buildInterpretationPacket, packetContentSha256 } from '../src/astrology/interpretationPacket.js'

const orchestrationEvidencePath = resolve(process.env.ASTROLOGY_ORCHESTRATION_INPUT || 'artifacts/astrology-local-verified-orchestration-v1/evidence.json')
const orchestrationEvidence = JSON.parse(await readFile(orchestrationEvidencePath, 'utf8'))
const evidence = JSON.parse(await readFile('test/fixtures/astrology/golden/astrology-ephemeris-golden-v1.json', 'utf8'))
const orchestration = orchestrationEvidence.cases?.complete
if (!orchestration || orchestration.status !== 'completed' || !orchestration.verifiedDocuments) throw new Error('verified orchestration complete documents missing')
const rawChart = orchestration.verifiedDocuments.rawChart
const ruleChart = orchestration.verifiedDocuments.ruleChart
const adapter = orchestration.verifiedDocuments.adapter
const rawChartSha256 = canonicalSha256(rawChart)
const ruleChartSha256 = canonicalSha256(ruleChart)
if (rawChartSha256 !== orchestration.rawChartHash || ruleChartSha256 !== orchestration.ruleChartHash) throw new Error('verified orchestration document identity mismatch')
const readiness = orchestration.readiness
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
const output = { schemaVersion: 'astrology-interpretation-packet-evidence-v1', fixture: evidence.fixture.id, inputOrchestration: { schemaVersion: orchestrationEvidence.orchestrationSchema, orchestrationVersion: orchestration.orchestrationVersion, providerBundleCanonicalSha256: orchestration.providerBundleCanonicalSha256, rawChartHash: orchestration.rawChartHash, ruleChartHash: orchestration.ruleChartHash }, packet, cases, packetContentSha256: packetContentSha256(packet) }
const outputDir = resolve(process.env.INTERPRETATION_PACKET_OUTPUT_DIR || 'artifacts/astrology-interpretation-packet-v1')
await mkdir(outputDir, { recursive: true })
const outputPath = resolve(outputDir, 'complete.json')
const outputText = `${JSON.stringify(output, null, 2)}\n`
await writeFile(outputPath, outputText)
console.log(JSON.stringify({ output: outputPath, artifactByteSha256: createHash('sha256').update(outputText).digest('hex'), packetContentSha256: output.packetContentSha256 }, null, 2))

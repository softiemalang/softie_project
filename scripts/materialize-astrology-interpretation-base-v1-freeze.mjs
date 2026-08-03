#!/usr/bin/env node
import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve, relative } from 'node:path'
import { astrologyInterpretationHandoffContentSha256, HANDOFF_RELATION_VOCABULARY } from '../src/astrology/astrologyInterpretationHandoff.js'

const root = resolve(process.env.ASTROLOGY_BASE_ROOT || '.')
const outputPath = resolve(root, process.env.ASTROLOGY_BASE_FREEZE_OUTPUT || 'artifacts/astrology-interpretation-base-v1/freeze-manifest.json')
const paths = {
  orchestration: 'artifacts/astrology-local-verified-orchestration-v1/evidence.json',
  packet: 'artifacts/astrology-interpretation-packet-v1/complete.json',
  context: 'artifacts/astrology-interpretation-context-v1/complete.json',
  readiness: 'artifacts/astrology-interpretation-readiness-v1/complete.json',
  graph: 'artifacts/astrology-claim-relation-graph-v1/complete.json',
  handoff: 'artifacts/astrology-interpretation-handoff-v1/complete.json',
}
const bytes = {}; const values = {}
for (const [role, path] of Object.entries(paths)) { bytes[role] = await readFile(resolve(root, path)); values[role] = JSON.parse(bytes[role]) }
const sha256 = value => createHash('sha256').update(value).digest('hex')
const content = {
  orchestration: values.orchestration.cases.complete,
  packet: values.packet.packet,
  context: values.context.context,
  readiness: values.readiness.readiness,
  graph: values.graph.graph,
  handoff: values.handoff.bundle,
}
const component = (role, schemaVersion, version, contentSha256) => ({
  role, path: paths[role], artifactByteSha256: sha256(bytes[role]), schemaVersion, version, contentSha256,
})
const manifest = {
  schemaVersion: 'astrology-interpretation-base-freeze-manifest-v1',
  manifestVersion: '1.0.0',
  baselineStatus: 'audited_and_frozen_uncommitted',
  freezeScope: 'verified orchestration through interpretation handoff v1; deterministic facts and structural relations only',
  components: {
    orchestration: component('orchestration', values.orchestration.orchestrationSchema, content.orchestration.orchestrationVersion, values.orchestration.payloadCanonicalSha256),
    packet: component('packet', content.packet.schemaVersion, content.packet.packetVersion, values.packet.packetContentSha256),
    context: component('context', content.context.schemaVersion, content.context.contextVersion, values.context.contextContentSha256),
    readiness: component('readiness', content.readiness.schemaVersion, content.readiness.readinessVersion, values.readiness.readinessContentSha256),
    graph: component('graph', content.graph.schemaVersion, content.graph.graphVersion, values.graph.graphContentSha256),
    handoff: component('handoff', content.handoff.schemaVersion, content.handoff.handoffVersion, content.handoff.bundleContentSha256),
  },
  upstreamIdentity: {
    providerBundleCanonicalSha256: content.packet.sourceOrchestration.providerBundleSha256,
    rawChartSha256: content.packet.sourceOrchestration.rawChartSha256,
    ruleChartSha256: content.packet.sourceOrchestration.ruleChartSha256,
    kernelSha256: content.packet.identities.kernel.hash,
    runnerIdentity: content.packet.identities.runner.runnerIdentity,
    evaluator: content.packet.identities.evaluator.evaluator,
  },
  crossHashLinks: {
    packetFromOrchestration: { providerBundleSha256: content.packet.sourceOrchestration.providerBundleSha256, rawChartSha256: content.packet.sourceOrchestration.rawChartSha256, ruleChartSha256: content.packet.sourceOrchestration.ruleChartSha256 },
    contextFromPacket: content.context.sourcePacket.packetContentSha256,
    readinessFromPacket: content.readiness.input.packetContentSha256,
    readinessFromContext: content.readiness.input.contextContentSha256,
    graphFromContext: content.graph.input.contextContentSha256,
    graphFromReadiness: content.graph.input.readinessContentSha256,
    handoff: content.handoff.crossHashLinks,
  },
  statistics: { claims: content.graph.claimCounts, graphNodes: content.graph.nodes.length, graphEdges: content.graph.edges.length },
  relationVocabulary: [...HANDOFF_RELATION_VOCABULARY],
  boundaries: {
    activation: content.handoff.activation,
    connected: content.handoff.connected,
    readiness: content.readiness.decisions,
    eligibility: content.handoff.eligibility,
    deliveryPolicy: content.handoff.deliveryPolicy,
  },
  interpretationBoundary: {
    noInterpretationText: true, noPromptTemplate: true, noLlmCall: true,
    structuralRelationsOnly: true, noThemeNarrativePsychologyRankingMeaningWeight: true,
    forbiddenUsages: content.handoff.deliveryPolicy.forbiddenUsages,
  },
  hashScopes: { content: 'component-defined content hash excluding its content hash field, recursively sorted keys, arrays preserved, JSON plus LF', artifactByte: 'exact UTF-8 bytes of each materialized evidence JSON', manifest: 'manifest object excluding manifestContentSha256, recursively sorted keys, JSON plus LF' },
  manifestContentSha256: null,
}
const ordered = value => Array.isArray(value) ? value.map(ordered) : (!value || typeof value !== 'object' ? value : Object.fromEntries(Object.keys(value).sort().map(key => [key, ordered(value[key])])))
const manifestContentSha256 = value => { const copy = structuredClone(value); delete copy.manifestContentSha256; return sha256(`${JSON.stringify(ordered(copy))}\n`) }
manifest.manifestContentSha256 = manifestContentSha256(manifest)
const output = `${JSON.stringify(manifest, null, 2)}\n`
await mkdir(resolve(outputPath, '..'), { recursive: true }); await writeFile(outputPath, output)
console.log(JSON.stringify({ output: relative(root, outputPath), artifactByteSha256: sha256(output), manifestContentSha256: manifest.manifestContentSha256, statistics: manifest.statistics }, null, 2))

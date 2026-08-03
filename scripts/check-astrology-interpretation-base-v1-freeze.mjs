#!/usr/bin/env node
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { HANDOFF_RELATION_VOCABULARY, astrologyInterpretationHandoffContentSha256 } from '../src/astrology/astrologyInterpretationHandoff.js'
import { packetContentSha256 } from '../src/astrology/interpretationPacket.js'
import { interpretationContextContentSha256 } from '../src/astrology/interpretationConsumer.js'
import { astrologyInterpretationReadinessContentSha256 } from '../src/astrology/interpretationReadiness.js'
import { astrologyClaimRelationGraphContentSha256 } from '../src/astrology/astrologyClaimRelationGraph.js'

const root = resolve(process.env.ASTROLOGY_BASE_ROOT || '.')
const manifestPath = resolve(root, process.argv[2] || 'artifacts/astrology-interpretation-base-v1/freeze-manifest.json')
const manifestBytes = await readFile(manifestPath); const manifest = JSON.parse(manifestBytes)
const sha256 = value => createHash('sha256').update(value).digest('hex')
const ordered = value => Array.isArray(value) ? value.map(ordered) : (!value || typeof value !== 'object' ? value : Object.fromEntries(Object.keys(value).sort().map(key => [key, ordered(value[key])])))
const contentHash = value => { const copy = structuredClone(value); delete copy.manifestContentSha256; return sha256(`${JSON.stringify(ordered(copy))}\n`) }
const fail = message => { throw new Error(message) }
if (manifest.schemaVersion !== 'astrology-interpretation-base-freeze-manifest-v1' || manifest.manifestVersion !== '1.0.0') fail('manifest_schema_or_version_mismatch')
if (manifest.baselineStatus !== 'audited_and_frozen_uncommitted') fail('baseline_status_invalid')
if (contentHash(manifest) !== manifest.manifestContentSha256) fail('manifest_content_hash_mismatch')
const specs = { packet: ['packet', packetContentSha256], context: ['context', interpretationContextContentSha256], readiness: ['readiness', astrologyInterpretationReadinessContentSha256], graph: ['graph', astrologyClaimRelationGraphContentSha256], handoff: ['bundle', astrologyInterpretationHandoffContentSha256] }
for (const [role, [key, hashFn]] of Object.entries(specs)) {
  const entry = manifest.components[role]; const bytes = await readFile(resolve(root, entry.path)); const evidence = JSON.parse(bytes); const value = evidence[key]
  if (entry.artifactByteSha256 !== sha256(bytes)) fail(`${role}_artifact_byte_hash_mismatch`)
  if (entry.contentSha256 !== hashFn(value)) fail(`${role}_content_hash_mismatch`)
  if (entry.schemaVersion !== value.schemaVersion || entry.version !== value[`${role}Version`]) fail(`${role}_schema_or_version_mismatch`)
}
const orchestrationEntry = manifest.components.orchestration; const orchestrationBytes = await readFile(resolve(root, orchestrationEntry.path)); const orchestrationEvidence = JSON.parse(orchestrationBytes); const orchestration = orchestrationEvidence.cases.complete
if (orchestrationEntry.artifactByteSha256 !== sha256(orchestrationBytes) || orchestrationEntry.contentSha256 !== orchestrationEvidence.payloadCanonicalSha256) fail('orchestration_hash_mismatch')
const packet = JSON.parse(await readFile(resolve(root, manifest.components.packet.path))).packet
const context = JSON.parse(await readFile(resolve(root, manifest.components.context.path))).context
const readiness = JSON.parse(await readFile(resolve(root, manifest.components.readiness.path))).readiness
const graph = JSON.parse(await readFile(resolve(root, manifest.components.graph.path))).graph
const handoff = JSON.parse(await readFile(resolve(root, manifest.components.handoff.path))).bundle
if (packet.sourceOrchestration.providerBundleSha256 !== orchestration.providerBundleCanonicalSha256 || packet.sourceOrchestration.rawChartSha256 !== orchestration.rawChartHash || packet.sourceOrchestration.ruleChartSha256 !== orchestration.ruleChartHash) fail('upstream_identity_mismatch')
if (manifest.crossHashLinks.contextFromPacket !== context.sourcePacket.packetContentSha256 || manifest.crossHashLinks.readinessFromPacket !== readiness.input.packetContentSha256 || manifest.crossHashLinks.readinessFromContext !== readiness.input.contextContentSha256 || manifest.crossHashLinks.graphFromContext !== graph.input.contextContentSha256 || manifest.crossHashLinks.graphFromReadiness !== graph.input.readinessContentSha256) fail('cross_hash_link_mismatch')
if (JSON.stringify(manifest.relationVocabulary) !== JSON.stringify(HANDOFF_RELATION_VOCABULARY) || JSON.stringify(graph.relationVocabulary) !== JSON.stringify(HANDOFF_RELATION_VOCABULARY)) fail('relation_vocabulary_mismatch')
if (JSON.stringify(manifest.statistics) !== JSON.stringify({ claims: { total: 53, observedOrCalculated: 20, deterministicallyDerived: 33 }, graphNodes: 53, graphEdges: 1753 })) fail('statistics_invalid')
if (packet.usable !== false || context.usable !== false || readiness.readinessStatus !== 'complete' || handoff.usable !== false || handoff.connected !== false || JSON.stringify(handoff.activation) !== JSON.stringify(manifest.boundaries.activation)) fail('activation_or_boundary_invalid')
if (manifest.boundaries.readiness.userDelivery !== 'not_eligible_for_user_delivery' || manifest.boundaries.readiness.productionActivation !== 'production_activation_blocked' || manifest.boundaries.readiness.humanReview !== 'human_review_required') fail('readiness_boundary_invalid')
if (manifest.interpretationBoundary.noInterpretationText !== true || manifest.interpretationBoundary.noPromptTemplate !== true || manifest.interpretationBoundary.noLlmCall !== true || manifest.interpretationBoundary.structuralRelationsOnly !== true) fail('interpretation_boundary_invalid')
console.log(JSON.stringify({ pass: true, manifestContentSha256: manifest.manifestContentSha256, artifactByteSha256: sha256(manifestBytes), upstreamIdentity: manifest.upstreamIdentity, statistics: manifest.statistics, activation: manifest.boundaries.activation }, null, 2))

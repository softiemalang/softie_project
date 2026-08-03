#!/usr/bin/env node
import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { buildAstrologyClaimRelationGraph, assertAstrologyClaimRelationGraph, astrologyClaimRelationGraphContentSha256 } from '../src/astrology/astrologyClaimRelationGraph.js'

const contextEvidence = JSON.parse(await readFile(resolve(process.env.INTERPRETATION_CONTEXT_INPUT || 'artifacts/astrology-interpretation-context-v1/complete.json'), 'utf8'))
const readinessEvidence = JSON.parse(await readFile(resolve(process.env.INTERPRETATION_READINESS_INPUT || 'artifacts/astrology-interpretation-readiness-v1/complete.json'), 'utf8'))
const context = contextEvidence.context
const readiness = readinessEvidence.readiness
const complete = buildAstrologyClaimRelationGraph({ context, readiness })
const checked = graph => { try { assertAstrologyClaimRelationGraph(graph, { context, readiness }); return { status: 'passed', reasonCodes: [] } } catch (error) { return { status: 'blocked', reasonCodes: [error.code || error.message] } } }
const mutate = (fn, { rehash = false } = {}) => { const graph = structuredClone(complete); fn(graph); if (rehash) graph.graphContentSha256 = astrologyClaimRelationGraphContentSha256(graph); return checked(graph) }
const cases = {
  complete: checked(complete),
  wrongSchemaVersion: mutate(graph => { graph.graphVersion = '9.9.9' }),
  graphContentHashMismatch: mutate(graph => { graph.graphContentSha256 = '0'.repeat(64) }),
  nonexistentNodeReference: mutate(graph => { graph.edges[0].from = 'missing:node' }, { rehash: true }),
  nonexistentSourceRef: mutate(graph => { graph.nodes[0].sourceRefs.push('ruleChart.missing') }, { rehash: true }),
  epistemicIdentityTampered: mutate(graph => { graph.nodes[0].epistemic = graph.nodes[0].epistemic === 'observed_or_calculated' ? 'deterministically_derived' : 'observed_or_calculated' }, { rehash: true }),
  unsupportedRelationVocabulary: mutate(graph => { graph.edges[0].relation = 'dominates' }, { rehash: true }),
  missingRelationEvidence: mutate(graph => { delete graph.edges[0].evidence }, { rehash: true }),
  themeInjected: mutate(graph => { graph.theme = 'injected' }, { rehash: true }),
  claimDeleted: mutate(graph => { graph.nodes.pop() }, { rehash: true }),
  claimMerged: mutate(graph => { graph.nodes[1].nodeId = graph.nodes[0].nodeId }, { rehash: true }),
  claimRanked: mutate(graph => { graph.nodes[0].rank = 1 }, { rehash: true }),
  simulationContamination: mutate(graph => { graph.simulation = true }, { rehash: true }),
  placidusContamination: mutate(graph => { graph.placidus = true }, { rehash: true }),
  frozenSpeedContamination: mutate(graph => { graph.frozenSpeed = true }, { rehash: true }),
  legacyPrepContamination: mutate(graph => { graph.legacyPrep = true }, { rehash: true }),
  activationPromoted: mutate(graph => { graph.activation.availableForInterpretation = true }, { rehash: true }),
  userDeliveryPromoted: mutate(graph => { graph.consumerBoundary.userDelivery = true }, { rehash: true }),
  productionPromoted: mutate(graph => { graph.consumerBoundary.production = true }, { rehash: true }),
}
const output = {
  schemaVersion: 'astrology-claim-relation-graph-evidence-v1',
  input: { contextSchemaVersion: context?.schemaVersion || null, contextContentSha256: context?.contextContentSha256 || null, readinessSchemaVersion: readiness?.schemaVersion || null, readinessContentSha256: readiness?.readinessContentSha256 || null },
  graph: complete,
  cases,
  graphContentSha256: complete.graphContentSha256,
}
const outputDir = resolve(process.env.ASTROLOGY_CLAIM_RELATION_GRAPH_OUTPUT_DIR || 'artifacts/astrology-claim-relation-graph-v1')
await mkdir(outputDir, { recursive: true })
const outputPath = resolve(outputDir, 'complete.json')
const outputText = `${JSON.stringify(output, null, 2)}\n`
await writeFile(outputPath, outputText)
console.log(JSON.stringify({ output: outputPath, artifactByteSha256: createHash('sha256').update(outputText).digest('hex'), graphContentSha256: complete.graphContentSha256, nodeCount: complete.nodes.length, edgeCount: complete.edges.length }, null, 2))

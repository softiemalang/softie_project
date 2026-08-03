#!/usr/bin/env node
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { assertAstrologyClaimRelationGraph } from '../src/astrology/astrologyClaimRelationGraph.js'

const path = process.argv[2] || 'artifacts/astrology-claim-relation-graph-v1/complete.json'
const bytes = await readFile(path)
const evidence = JSON.parse(bytes)
const fail = message => { throw new Error(message) }
if (evidence.schemaVersion !== 'astrology-claim-relation-graph-evidence-v1') fail('graph evidence schema mismatch')
const contextEvidence = JSON.parse(await readFile('artifacts/astrology-interpretation-context-v1/complete.json', 'utf8'))
const readinessEvidence = JSON.parse(await readFile('artifacts/astrology-interpretation-readiness-v1/complete.json', 'utf8'))
try { assertAstrologyClaimRelationGraph(evidence.graph, { context: contextEvidence.context, readiness: readinessEvidence.readiness }) } catch (error) { fail(error.code || error.message) }
if (evidence.graphContentSha256 !== evidence.graph.graphContentSha256) fail('graph content hash link mismatch')
if (evidence.graph.claimCounts.total !== 53 || evidence.graph.claimCounts.observedOrCalculated !== 20 || evidence.graph.claimCounts.deterministicallyDerived !== 33) fail('claim counts invalid')
const requiredCases = ['complete', 'wrongSchemaVersion', 'graphContentHashMismatch', 'nonexistentNodeReference', 'nonexistentSourceRef', 'epistemicIdentityTampered', 'unsupportedRelationVocabulary', 'missingRelationEvidence', 'themeInjected', 'claimDeleted', 'claimMerged', 'claimRanked', 'simulationContamination', 'placidusContamination', 'frozenSpeedContamination', 'legacyPrepContamination', 'activationPromoted', 'userDeliveryPromoted', 'productionPromoted']
if (!requiredCases.every(name => evidence.cases?.[name])) fail('negative evidence cases incomplete')
if (evidence.cases.complete.status !== 'passed' || requiredCases.slice(1).some(name => evidence.cases[name].status !== 'blocked')) fail('negative evidence did not fail closed')
const expectedReasons = {
  wrongSchemaVersion: 'graph_schema_or_version_mismatch', graphContentHashMismatch: 'graph_content_hash_mismatch', nonexistentNodeReference: 'edge_node_reference_invalid', nonexistentSourceRef: 'node_identity_or_source_ref_invalid', epistemicIdentityTampered: 'graph_structure_mismatch', unsupportedRelationVocabulary: 'relation_vocabulary_invalid', missingRelationEvidence: 'relation_evidence_missing', themeInjected: 'interpretation_output_present', claimDeleted: 'claim_count_invalid', claimMerged: 'node_identity_or_source_ref_invalid', claimRanked: 'graph_structure_mismatch', simulationContamination: 'calculation_contamination', placidusContamination: 'calculation_contamination', frozenSpeedContamination: 'calculation_contamination', legacyPrepContamination: 'calculation_contamination', activationPromoted: 'activation_boundary_mismatch', userDeliveryPromoted: 'consumer_boundary_promoted', productionPromoted: 'consumer_boundary_promoted',
}
for (const [name, reason] of Object.entries(expectedReasons)) if (!evidence.cases[name].reasonCodes.includes(reason)) fail(`negative evidence reason missing: ${name}`)
console.log(JSON.stringify({ pass: true, nodeCount: evidence.graph.nodes.length, edgeCount: evidence.graph.edges.length, graphContentSha256: evidence.graph.graphContentSha256, artifactByteSha256: createHash('sha256').update(bytes).digest('hex'), activation: evidence.graph.activation }, null, 2))

#!/usr/bin/env node
import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve, relative } from 'node:path'
import { buildAstrologyInterpretationHandoff, checkAstrologyInterpretationHandoff, astrologyInterpretationHandoffContentSha256, componentSpec } from '../src/astrology/astrologyInterpretationHandoff.js'

const root = resolve(process.env.ASTROLOGY_HANDOFF_ROOT || '.')
const defaults = {
  packet: 'artifacts/astrology-interpretation-packet-v1/complete.json',
  context: 'artifacts/astrology-interpretation-context-v1/complete.json',
  readiness: 'artifacts/astrology-interpretation-readiness-v1/complete.json',
  graph: 'artifacts/astrology-claim-relation-graph-v1/complete.json',
}
const paths = Object.fromEntries(Object.entries(defaults).map(([role, path]) => [role, resolve(root, path)]))
const components = {}; const artifactBytes = {}
for (const role of Object.keys(componentSpec)) {
  artifactBytes[role] = await readFile(paths[role])
  components[role] = JSON.parse(artifactBytes[role].toString('utf8'))
}
const artifactPaths = Object.fromEntries(Object.entries(paths).map(([role, path]) => [role, relative(root, path)]))
for (const [role, bytes] of Object.entries(artifactBytes)) components[role].artifactByteSha256 = createHash('sha256').update(bytes).digest('hex')
const bundle = buildAstrologyInterpretationHandoff({ components, artifactPaths })
const negativeCases = [
  ['missing_component', b => { delete b.components.packet }, () => {}, 'component_missing_or_not_object', true],
  ['wrong_version', b => { b.components.context.content.version = '9.9.9' }, () => {}, 'component_schema_or_version_mismatch', true],
  ['content_hash', b => { b.bundleContentSha256 = '0'.repeat(64) }, () => {}, 'bundle_content_hash_mismatch', false],
  ['statistics', b => { b.statistics.graphEdges = 1 }, () => {}, 'statistics_invalid', true],
  ['provenance', b => { b.provenance.context = 'incomplete' }, () => {}, 'provenance_incomplete', true],
  ['interpretation', b => { b.theme = 'injected' }, () => {}, 'interpretation_output_present', true],
  ['claim_deleted', () => {}, c => { c.graph.graph.nodes.pop() }, 'component_content_hash_mismatch', false],
  ['forbidden_relation', b => { b.relationVocabulary[0] = 'dominates' }, () => {}, 'relation_vocabulary_invalid', true],
  ['activation_promoted', b => { b.activation.availableForInterpretation = true }, () => {}, 'activation_boundary_mismatch', true],
  ['user_delivery_promoted', b => { b.eligibility.userDelivery = 'eligible_for_user_delivery' }, () => {}, 'promotion_boundary_invalid', true],
  ['production_promoted', b => { b.eligibility.production = 'production_activation_ready' }, () => {}, 'promotion_boundary_invalid', true],
  ['simulation_contamination', () => {}, c => { c.graph.graph.simulation = true }, 'component_content_hash_mismatch', false],
  ['placidus_contamination', () => {}, c => { c.graph.graph.placidus = true }, 'component_content_hash_mismatch', false],
  ['frozen_speed_contamination', () => {}, c => { c.graph.graph.frozenSpeed = true }, 'component_content_hash_mismatch', false],
  ['legacy_prep_contamination', () => {}, c => { c.graph.graph.legacyPrep = true }, 'component_content_hash_mismatch', false],
]
const negativeEvidence = negativeCases.map(([caseId, mutateBundle, mutateComponents, expectedReasonCode, rehash]) => {
  const candidate = structuredClone(bundle); const values = structuredClone(components); mutateBundle(candidate); mutateComponents(values)
  if (rehash) candidate.bundleContentSha256 = astrologyInterpretationHandoffContentSha256(candidate)
  return { caseId, expectedReasonCode, observedReasonCodes: checkAstrologyInterpretationHandoff(candidate, { components: values, artifactBytes }).reasonCodes }
})
const outputDir = resolve(root, process.env.ASTROLOGY_HANDOFF_OUTPUT_DIR || 'artifacts/astrology-interpretation-handoff-v1')
await mkdir(outputDir, { recursive: true })
const outputPath = resolve(outputDir, 'complete.json')
const outputText = `${JSON.stringify({ schemaVersion: 'astrology-interpretation-handoff-evidence-v1', bundle, inputArtifacts: artifactPaths, negativeEvidence }, null, 2)}\n`
await writeFile(outputPath, outputText)
console.log(JSON.stringify({ output: outputPath, artifactByteSha256: createHash('sha256').update(outputText).digest('hex'), bundleContentSha256: bundle.bundleContentSha256, claimCount: bundle.statistics.claims.total, nodeCount: bundle.statistics.graphNodes, edgeCount: bundle.statistics.graphEdges }, null, 2))

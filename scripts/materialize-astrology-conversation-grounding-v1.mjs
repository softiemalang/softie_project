#!/usr/bin/env node
import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { buildAstrologyConversationGrounding, astrologyConversationGroundingContentSha256, checkAstrologyConversationGrounding } from '../src/astrology/astrologyConversationGrounding.js'

const root = resolve(process.env.ASTROLOGY_GROUNDING_ROOT || '.')
const paths = { packet: 'artifacts/astrology-interpretation-packet-v1/complete.json', context: 'artifacts/astrology-interpretation-context-v1/complete.json', readiness: 'artifacts/astrology-interpretation-readiness-v1/complete.json', graph: 'artifacts/astrology-claim-relation-graph-v1/complete.json' }
const components = {}; const artifactIdentities = {}
for (const role of Object.keys(paths)) {
  const bytes = await readFile(resolve(root, paths[role]))
  components[role] = JSON.parse(bytes)
  artifactIdentities[role] = { path: paths[role], artifactByteSha256: createHash('sha256').update(bytes).digest('hex') }
}
const bundle = buildAstrologyConversationGrounding({ components, artifactIdentities })
const mutate = (name, fn) => { const value = structuredClone(bundle); fn(value); return { caseId: name, expected: name, observed: null, value } }
const cases = [
  mutate('claim_deleted', value => { value.claims.nodes.pop(); value.bundleContentSha256 = astrologyConversationGroundingContentSha256(value) }),
  mutate('provenance_broken', value => { value.claims.nodes[0].sourceRefs = []; value.bundleContentSha256 = astrologyConversationGroundingContentSha256(value) }),
  mutate('unknown_factified', value => { value.epistemicState.unknown[0].status = 'known'; value.bundleContentSha256 = astrologyConversationGroundingContentSha256(value) }),
  mutate('user_dependent_prejudged', value => { value.epistemicState.userDependent[0].status = 'known'; value.bundleContentSha256 = astrologyConversationGroundingContentSha256(value) }),
  mutate('question_injected', value => { value.contextRequirements[0].question = 'injected'; value.bundleContentSha256 = astrologyConversationGroundingContentSha256(value) }),
  mutate('ranking_injected', value => { value.ranking = ['node']; value.bundleContentSha256 = astrologyConversationGroundingContentSha256(value) }),
  mutate('unstable_order', value => { value.claims.nodes.reverse(); value.bundleContentSha256 = astrologyConversationGroundingContentSha256(value) }),
]
const negativeEvidence = cases.map(item => ({ caseId: item.caseId, observedReasonCodes: checkAstrologyConversationGrounding(item.value, { components, artifactIdentities }).reasonCodes, candidate: item.value }))
const outputDir = resolve(root, process.env.ASTROLOGY_GROUNDING_OUTPUT_DIR || 'artifacts/astrology-conversation-grounding-v1')
await mkdir(outputDir, { recursive: true })
const output = { schemaVersion: 'astrology-conversation-grounding-evidence-v1', inputArtifacts: artifactIdentities, bundle, negativeEvidence }
const outputText = `${JSON.stringify(output, null, 2)}\n`
await writeFile(resolve(outputDir, 'complete.json'), outputText)
console.log(JSON.stringify({ output: resolve(outputDir, 'complete.json'), bundleContentSha256: bundle.bundleContentSha256, artifactByteSha256: createHash('sha256').update(outputText).digest('hex'), claimCount: bundle.claims.nodes.length, relationCount: bundle.relations.edges.length }, null, 2))

#!/usr/bin/env node
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { checkAstrologyConversationGrounding, componentSpec } from '../src/astrology/astrologyConversationGrounding.js'

const evidencePath = resolve(process.argv[2] || 'artifacts/astrology-conversation-grounding-v1/complete.json')
const bytes = await readFile(evidencePath); const evidence = JSON.parse(bytes); const root = resolve(process.env.ASTROLOGY_GROUNDING_ROOT || '.')
const components = {}; const artifactIdentities = {}
for (const role of Object.keys(componentSpec)) {
  const identity = evidence.inputArtifacts?.[role]; const artifactBytes = await readFile(resolve(root, identity.path)); components[role] = JSON.parse(artifactBytes); artifactIdentities[role] = { path: identity.path, artifactByteSha256: createHash('sha256').update(artifactBytes).digest('hex') }
}
const result = checkAstrologyConversationGrounding(evidence.bundle, { components, artifactIdentities })
const expected = { claim_deleted: 'claim_inventory_invalid', provenance_broken: 'claim_provenance_broken', unknown_factified: 'epistemic_state_promoted', user_dependent_prejudged: 'epistemic_state_promoted', question_injected: 'context_requirement_invalid', ranking_injected: 'interpretation_output_present', unstable_order: 'claim_inventory_invalid' }
for (const item of evidence.negativeEvidence || []) {
  const candidate = structuredClone(evidence.bundle); const source = item.candidate
  const check = checkAstrologyConversationGrounding(source, { components, artifactIdentities })
  item.observedReasonCodes = check.reasonCodes
  if (!check.reasonCodes.includes(expected[item.caseId])) result.reasonCodes.push(`negative_evidence_invalid:${item.caseId}`)
}
if (evidence.schemaVersion !== 'astrology-conversation-grounding-evidence-v1') result.reasonCodes.push('evidence_schema_mismatch')
if (result.reasonCodes.length) { console.error(JSON.stringify({ pass: false, reasonCodes: [...new Set(result.reasonCodes)].sort() }, null, 2)); process.exitCode = 1 } else console.log(JSON.stringify({ pass: true, artifactByteSha256: createHash('sha256').update(bytes).digest('hex'), bundleContentSha256: evidence.bundle.bundleContentSha256, claimCount: evidence.bundle.claims.nodes.length, relationCount: evidence.bundle.relations.edges.length, activation: evidence.bundle.activation }, null, 2))

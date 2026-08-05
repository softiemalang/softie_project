import { readFile } from 'node:fs/promises'
import { checkArtifact } from './check-ziwei-major-star-claim-readiness-reconciliation-v0.mjs'
const artifact = JSON.parse(await readFile('artifacts/ziwei-major-star-claim-readiness-reconciliation-v0/complete.json', 'utf8'))
const cases = [
  ['claim-value-mutation', x => { x.claims[0].boundedAssertion = 'mutated'; return x }],
  ['status-mutation', x => { x.claims[1].evidenceStatus = 'evidence_sufficient_within_scope'; return x }],
  ['context-count-mutation', x => { x.contextRegistry[0].count.match = 26; return x }],
  ['relation-mutation', x => { x.relationGraph.relations[0].type = 'blocked_by'; return x }],
  ['blocker-mutation', x => { x.blockerRegistry[0].requiredEvidence = 'none'; return x }],
  ['source-ref-mutation', x => { x.evidenceInventory[0].artifactRef.byteSha256 = '0'.repeat(64); return x }],
  ['readiness-mutation', x => { x.layeredReadiness.grounding = 'ready'; return x }]
]
let failures = 0
for (const [name, mutate] of cases) { const errors = await checkArtifact(mutate(structuredClone(artifact))); const detected = errors.length > 0; console.log(JSON.stringify({ name, detected, errors })); if (!detected) failures++ }
if (failures) process.exitCode = 1

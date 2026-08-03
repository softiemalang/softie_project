import fs from 'node:fs'
import { createHash } from 'node:crypto'
import { canonicalSajuReadinessJson, checkSajuConversationGrounding, checkSajuReadiness, buildSajuConversationGrounding, buildSajuReadiness } from '../src/interpretationPrep/sajuReadinessGrounding.js'

const artifact = JSON.parse(fs.readFileSync('artifacts/saju-readiness-grounding-v0.json', 'utf8'))
const provenance = JSON.parse(fs.readFileSync('artifacts/saju-claim-provenance-v0.json', 'utf8'))
const readiness = buildSajuReadiness({ provenance, provenanceIdentity: artifact.input.provenanceIdentity })
const bundle = buildSajuConversationGrounding({ provenance, readiness, provenanceIdentity: artifact.input.provenanceIdentity, readinessIdentity: { contentSha256: readiness.contentSha256 } })
const errors = [
  ...checkSajuReadiness(artifact.readiness, provenance),
  ...checkSajuConversationGrounding(artifact.bundle, { provenance, readiness }),
  ...(canonicalSajuReadinessJson(artifact.readiness) !== canonicalSajuReadinessJson(readiness) ? ['readiness materialization drift'] : []),
  ...(canonicalSajuReadinessJson(artifact.bundle) !== canonicalSajuReadinessJson(bundle) ? ['grounding materialization drift'] : []),
  ...(artifact.readiness.claimCount !== 43 ? ['claim count must remain 43'] : []),
  ...(artifact.readiness.occurrenceCount !== 126 ? ['occurrence count must remain 126'] : []),
  ...(artifact.artifactByteSha256 !== createHash('sha256').update(canonicalSajuReadinessJson({ ...artifact, artifactByteSha256: null })).digest('hex') ? ['artifact byte hash preimage mismatch'] : []),
]
for (const item of artifact.negativeEvidence || []) if (!item.reasonCodes?.length) errors.push(`negative fixture not detected: ${item.caseId}`)
if (errors.length) { console.error(errors.map(error => `FAIL ${error}`).join('\n')); process.exitCode = 1 } else console.log(JSON.stringify({ status: 'pass', claimCount: artifact.readiness.claimCount, occurrenceCount: artifact.readiness.occurrenceCount, readinessStatusDistribution: artifact.readiness.statusDistribution, groundingContentSha256: artifact.bundle.contentSha256 }, null, 2))

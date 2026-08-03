import { createHash } from 'node:crypto'
import fs from 'node:fs'
import { buildSajuConversationGrounding, buildSajuReadiness, canonicalSajuReadinessJson, checkSajuConversationGrounding, checkSajuReadiness, sajuGroundingContentSha256 } from '../src/interpretationPrep/sajuReadinessGrounding.js'

const provenancePath = 'artifacts/saju-claim-provenance-v0.json'
const provenanceBytes = fs.readFileSync(provenancePath)
const provenance = JSON.parse(provenanceBytes)
const provenanceIdentity = { contentSha256: provenance.contentSha256, artifactByteSha256: createHash('sha256').update(provenanceBytes).digest('hex') }
const readiness = buildSajuReadiness({ provenance, provenanceIdentity })
const readinessIdentity = { contentSha256: readiness.contentSha256 }
const bundle = buildSajuConversationGrounding({ provenance, readiness, provenanceIdentity, readinessIdentity })
const cases = [
  ['claim_deleted', value => value.claimRefs.pop()],
  ['unverified_promoted', value => { value.verificationState.overall = 'verified' }],
  ['source_hidden', value => { value.epistemicState.unresolved = [] }],
  ['user_prejudged', value => { value.epistemicState.userDependent[0].status = 'known' }],
  ['frequency_ranked', value => { value.frequencyRanking = ['claim'] }],
  ['tension_removed_or_merged', value => { value.preservedClaimRelations.relatedClaimRefs = ['saju.claim.other'] }],
  ['question_injected', value => { value.question = 'generated question' }],
]
const negativeEvidence = cases.map(([caseId, mutate]) => { const candidate = structuredClone(bundle); mutate(candidate); candidate.contentSha256 = sajuGroundingContentSha256(candidate); return { caseId, reasonCodes: checkSajuConversationGrounding(candidate, { provenance, readiness }) } })
const output = {
  schemaVersion: 'saju-readiness-grounding-evidence-v0',
  input: { provenancePath, provenanceIdentity },
  readiness, bundle, negativeEvidence,
}
const artifactByteSha256 = createHash('sha256').update(canonicalSajuReadinessJson({ ...output, artifactByteSha256: null })).digest('hex')
const materialized = { ...output, artifactByteSha256 }
const outputText = canonicalSajuReadinessJson(materialized)
fs.writeFileSync('artifacts/saju-readiness-grounding-v0.json', outputText)
console.log(JSON.stringify({ status: 'materialized', output: 'artifacts/saju-readiness-grounding-v0.json', claimCount: readiness.claimCount, occurrenceCount: readiness.occurrenceCount, readinessStatusDistribution: readiness.statusDistribution, readinessContentSha256: readiness.contentSha256, groundingContentSha256: bundle.contentSha256, artifactByteSha256, actualFileByteSha256: createHash('sha256').update(outputText).digest('hex'), readinessErrors: checkSajuReadiness(readiness, provenance), groundingErrors: checkSajuConversationGrounding(bundle, { provenance, readiness }) }, null, 2))

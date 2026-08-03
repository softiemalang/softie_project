import fs from 'node:fs'
import crypto from 'node:crypto'
import { checkArtifactIdentity, artifactPayloadWithoutIdentity } from '../src/artifactIdentity.js'

const path = 'artifacts/saju-acceptance-review-v0.json'
const value = JSON.parse(fs.readFileSync(path, 'utf8'))
const provenance = JSON.parse(fs.readFileSync('artifacts/saju-claim-provenance-v0.json', 'utf8'))
const readinessArtifact = JSON.parse(fs.readFileSync('artifacts/saju-readiness-grounding-v0.json', 'utf8'))
const canonical = input => `${JSON.stringify(order(input))}\n`
function order(input) {
  if (Array.isArray(input)) return input.map(order)
  if (!input || typeof input !== 'object') return input
  return Object.fromEntries(Object.keys(input).sort().map(key => [key, order(input[key])]))
}
const sha256 = input => crypto.createHash('sha256').update(input).digest('hex')
const errors = []
if (value.schemaVersion !== 'saju-acceptance-review-v0') errors.push('schema mismatch')
if (value.basisHead !== 'acb1af9f7ad393cea23d8d9949660c9bcfe37beb') errors.push('basis HEAD mismatch')
if (value.verdictToken !== 'saju_acceptance_partial_gap_preserving_boundaries') errors.push('verdict token changed')
if (value.inventory?.claimCount !== 43 || value.inventory?.occurrenceCount !== 126) errors.push('inventory mismatch')
const occurrenceIds = new Set()
for (const claim of provenance.claims || []) {
  if (claim.claimTextContract !== 'representative_only; never substitutes for occurrence raw text' || claim.rawText?.isVerifiedFact !== false) errors.push(`claim raw text contract missing:${claim.claimId}`)
  for (const occurrence of claim.occurrences || []) {
    if (occurrence.claimId !== claim.claimId || occurrenceIds.has(occurrence.occurrenceId) || occurrence.rawText?.text !== occurrence.claimText || occurrence.rawText?.isVerifiedFact !== false || !occurrence.sourceLocation?.contextId) errors.push(`occurrence contract missing:${occurrence.occurrenceId || claim.claimId}`)
    occurrenceIds.add(occurrence.occurrenceId)
  }
}
if (occurrenceIds.size !== 126) errors.push('independent occurrence identity count mismatch')
for (const claim of readinessArtifact.readiness?.claims || []) {
  const gate = claim.conversationGate
  if (!gate || gate.conversationAvailability !== claim.conversationAvailability || gate.rawTextConsumption?.isVerifiedFact !== false || !gate.blockedOrUnsupportedReason?.length || gate.userContextDependency?.length !== 2) errors.push(`readiness gate missing:${claim.claimId}`)
}
for (const ref of readinessArtifact.bundle?.claimRefs || []) if (!ref.conversationGate || ref.conversationGate.rawTextConsumption?.isVerifiedFact !== false || !ref.conversationGate.blockedOrUnsupportedReason?.length) errors.push(`grounding gate missing:${ref.claimId}`)
if (value.reviewSummary?.itemCount !== value.reviewItems?.length) errors.push('review item count mismatch')
for (const status of ['accepted','accepted_with_declared_limit','gap','violation','not_applicable']) {
  const count = value.reviewItems.filter(item => item.status === status).length
  if (value.reviewSummary.distribution[status] !== count) errors.push(`review distribution mismatch: ${status}`)
}
if (value.reviewItems.some(item => !['accepted','accepted_with_declared_limit','gap','violation','not_applicable'].includes(item.status))) errors.push('unknown review status')
if (!value.independentFindings?.includes('claim_text_variants_preserved_without_equivalence')) errors.push('independent occurrence text preservation audit missing')
if (!value.independentFindings?.includes('raw_claim_text_fact_boundary_present')) errors.push('independent raw claim text boundary audit missing')
if (!value.independentFindings?.includes('grounding_claim_refs_have_per_claim_gates')) errors.push('independent per-claim gate audit missing')
if (!value.independentFindings?.includes('closed_world_status_enum_preserved')) errors.push('independent status enum audit missing')
if (!Array.isArray(value.gapClosure) || value.gapClosure.length !== 5 || value.gapClosure.some(item => item.before !== 'gap' || !item.after || !item.evidence?.length)) errors.push('gap closure evidence incomplete')
if (value.negativeResults.length !== 12 || value.negativeResults.some(item => item.detected !== true || !item.reasonCodes?.length)) errors.push('negative fixture coverage incomplete')
const content = artifactPayloadWithoutIdentity(value)
content.deterministic.reviewContentSha256 = null
content.deterministic.artifactByteSha256 = null
if (sha256(canonical(content)) !== value.deterministic.reviewContentSha256) errors.push('review content hash mismatch')
const preimage = artifactPayloadWithoutIdentity(value)
preimage.deterministic.artifactByteSha256 = null
if (sha256(canonical(preimage)) !== value.deterministic.artifactByteSha256) errors.push('artifact byte preimage hash mismatch')
if (value.acceptance?.claimTruth !== 'not assessed' || value.acceptance?.productionReady !== false || value.acceptance?.ziweiStart !== 'blocked_pending_gap_closure_and_independent_acceptance') errors.push('acceptance boundary changed')
errors.push(...checkArtifactIdentity(value, { root: process.cwd(), artifactId: 'saju-acceptance-review-v0', materializerPath: 'scripts/review-saju-acceptance-v0.mjs', materializerVersion: '1.1.0' }))
if (errors.length) { console.error(errors.map(error => `FAIL ${error}`).join('\n')); process.exitCode = 1 } else console.log(JSON.stringify({status:'pass',basisHead:value.basisHead,verdictToken:value.verdictToken,distribution:value.reviewSummary.distribution,negativeCases:value.negativeResults.length,reviewContentSha256:value.deterministic.reviewContentSha256,artifactByteSha256:value.deterministic.artifactByteSha256},null,2))

import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import test from 'node:test'
import { buildSajuConversationGrounding, buildSajuReadiness, canonicalSajuReadinessJson, checkSajuConversationGrounding, checkSajuReadiness } from '../src/interpretationPrep/sajuReadinessGrounding.js'

const provenance = JSON.parse(fs.readFileSync('artifacts/saju-claim-provenance-v0.json', 'utf8'))
const artifact = JSON.parse(fs.readFileSync('artifacts/saju-readiness-grounding-v0.json', 'utf8'))
const identity = { contentSha256: provenance.contentSha256, artifactByteSha256: provenance.artifactByteSha256 }

test('saju readiness and grounding preserve the 43 claim / 126 occurrence inventory', () => {
  const readiness = buildSajuReadiness({ provenance, provenanceIdentity: identity })
  const bundle = buildSajuConversationGrounding({ provenance, readiness, provenanceIdentity: identity, readinessIdentity: { contentSha256: readiness.contentSha256 } })
  assert.deepEqual(checkSajuReadiness(readiness, provenance), [])
  assert.deepEqual(checkSajuConversationGrounding(bundle, { provenance, readiness }), [])
  assert.equal(readiness.claimCount, 43); assert.equal(readiness.occurrenceCount, 126)
  assert.deepEqual(readiness.statusDistribution, { unverified: 38, provenance_partial: 1, rule_implemented_source_unresolved: 4 })
  assert.equal(bundle.claimRefs.length, 43)
  assert.equal(bundle.preservedClaimRelations.relatedClaimRefs.length, 0)
})

test('repeated materialization has identical canonical content and hashes', () => {
  const first = buildSajuReadiness({ provenance, provenanceIdentity: identity })
  const second = buildSajuReadiness({ provenance, provenanceIdentity: identity })
  assert.equal(canonicalSajuReadinessJson(first), canonicalSajuReadinessJson(second))
  assert.equal(first.contentSha256, second.contentSha256)
  const firstBundle = buildSajuConversationGrounding({ provenance, readiness: first, provenanceIdentity: identity, readinessIdentity: { contentSha256: first.contentSha256 } })
  const secondBundle = buildSajuConversationGrounding({ provenance, readiness: second, provenanceIdentity: identity, readinessIdentity: { contentSha256: second.contentSha256 } })
  assert.equal(firstBundle.contentSha256, secondBundle.contentSha256)
})

test('negative grounding fixtures detect unsafe promotion and loss of boundaries', () => {
  for (const item of artifact.negativeEvidence) assert.ok(item.reasonCodes.length > 0, item.caseId)
  const promoted = structuredClone(artifact.readiness); promoted.claims[0].evidence.verificationStatus = 'verified'
  assert.match(checkSajuReadiness(promoted, provenance).join('\n'), /promoted/)
})

test('materializer and checker agree on the committed representative artifact', () => {
  const output = execFileSync(process.execPath, ['scripts/check-saju-readiness-grounding-v0.mjs'], { encoding: 'utf8' })
  assert.match(output, /"status": "pass"/)
})

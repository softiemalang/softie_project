import assert from 'node:assert/strict'
import test from 'node:test'
import { buildArtifact } from '../scripts/materialize-saju-local-source-corpus-observation-v1.mjs'
import { checkArtifact } from '../scripts/check-saju-local-source-corpus-observation-v1.mjs'

test('local Saju corpus observation keeps five files byte-bound and claim verification blocked', async () => {
  const artifact = await buildArtifact()
  assert.equal(artifact.corpus.documents.length, 5)
  assert.equal(artifact.observations.length, 21)
  assert.ok(artifact.corpus.documents.every(document => document.byteSha256.length === 64 && document.editionIdentity === 'unresolved_edition'))
  assert.ok(artifact.observations.every(item => item.admission.allowedUse === 'locator_candidate_only'))
  assert.ok(artifact.observations.every(item => item.admission.claimVerification === 'not_promoted'))
  assert.ok(artifact.claimPacketCoverage.some(packet => packet.observedLocatorCount > 0))
  assert.deepEqual(await checkArtifact(artifact), [])
})

test('local Saju corpus materialization is deterministic and preserves baseline boundaries', async () => {
  const first = await buildArtifact()
  const second = await buildArtifact()
  assert.deepEqual(first, second)
  assert.equal(first.canonicalBaseline.classicalVerification, 'not_established_unchanged')
  assert.equal(first.readiness.availableForInterpretation, false)
  assert.equal(first.readiness.stableClaimBoundary, 0)
})

test('local Saju corpus checker rejects promotion and locator mutations', async () => {
  const artifact = await buildArtifact()
  const promoted = structuredClone(artifact)
  promoted.observations[0].admission.claimVerification = 'verified'
  assert.ok((await checkArtifact(promoted)).some(error => error.includes('observation_promoted') || error.includes('materialized_content')))

  const relocated = structuredClone(artifact)
  relocated.observations[0].locator.pdfPage = 999
  assert.ok((await checkArtifact(relocated)).some(error => error.includes('locator_out_of_range') || error.includes('materialized_content')))
})

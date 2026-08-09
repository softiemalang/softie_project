import assert from 'node:assert/strict'
import test from 'node:test'

import { buildArtifact } from '../scripts/materialize-saju-source-claim-observation-v1.mjs'
import { checkArtifact } from '../scripts/check-saju-source-claim-observation-v1.mjs'

test('Saju branch-relation page observation preserves direct visual transcription without promotion', async () => {
  const artifact = await buildArtifact()
  const observation = artifact.observations[0]
  assert.equal(artifact.sourceIdentity.editionIdentity, 'unresolved_edition')
  assert.equal(observation.locator.pdfPage, 5)
  assert.equal(observation.directObservation.transcriptionStatus, 'direct_observation_candidate_not_canonical_source_text')
  assert.equal(observation.admission.claimVerification, 'not_promoted')
  assert.equal(artifact.claimBoundary.stableClaimCount, 0)
  assert.deepEqual(await checkArtifact(artifact), [])
})

test('Saju direct-transcription successor is deterministic and rejects promotion or transcription drift', async () => {
  const first = await buildArtifact()
  const second = await buildArtifact()
  assert.deepEqual(first, second)

  const promoted = structuredClone(first)
  promoted.observations[0].admission.claimVerification = 'verified'
  assert.ok((await checkArtifact(promoted)).some(error => error.includes('observation_promoted') || error.includes('materialized_content')))

  const mutated = structuredClone(first)
  mutated.observations[0].directObservation.transcription += '错'
  assert.ok((await checkArtifact(mutated)).some(error => error.includes('transcription_drift') || error.includes('materialized_content')))
})

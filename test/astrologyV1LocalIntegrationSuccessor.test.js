import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import { checkTriSystemReadinessContract } from '../src/interpretationPrep/triSystemReadinessContract.js'
import { buildArtifact, PREDECESSOR_PATH } from '../scripts/materialize-astrology-v1-local-integration-milestone-v2.mjs'
import { checkArtifact } from '../scripts/check-astrology-v1-local-integration-milestone-v2.mjs'

test('integration successor attaches latest Saju and Western evidence without promotion', async () => {
  const artifact = await buildArtifact()
  assert.deepEqual(checkTriSystemReadinessContract(artifact), [])
  assert.deepEqual(artifact.successor.latestEvidencePaths.saju, ['artifacts/saju-source-claim-observation-v1/complete.json'])
  assert.deepEqual(artifact.successor.latestEvidencePaths.astrology, [
    'artifacts/astrology-true-node-horizons-erfa-v2/complete.json',
    'artifacts/astrology-true-node-light-time-diagnostic-v1/complete.json',
  ])
  assert.equal(artifact.domains.find(domain => domain.id === 'astrology').frontier.independentTrueNodeReference, 'pending')
  assert.equal(artifact.envelope.availableForInterpretation, false)
  assert.deepEqual(await checkArtifact(artifact), [])
})

test('integration successor is deterministic and preserves predecessor bytes', async () => {
  const predecessorBefore = await readFile(PREDECESSOR_PATH)
  const first = await buildArtifact()
  const second = await buildArtifact()
  assert.deepEqual(first, second)
  assert.deepEqual(await readFile(PREDECESSOR_PATH), predecessorBefore)

  const mutated = structuredClone(first)
  mutated.domains.find(domain => domain.id === 'astrology').evidenceRefs.at(-1).byteSha256 = '0'.repeat(64)
  assert.ok((await checkArtifact(mutated)).some(error => error.includes('evidence_byte_drift') || error.includes('content_hash_mismatch') || error.includes('current_materialized_content_drift')))

  const promoted = structuredClone(first)
  promoted.envelope.availableForInterpretation = true
  assert.ok((await checkArtifact(promoted)).some(error => error.includes('common_envelope_promoted') || error.includes('content_hash_mismatch')))
})

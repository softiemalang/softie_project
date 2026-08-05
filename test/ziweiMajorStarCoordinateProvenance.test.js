import test from 'node:test'
import assert from 'node:assert/strict'
import { buildArtifact } from '../scripts/materialize-ziwei-major-star-coordinate-provenance-v0.mjs'
import { checkArtifact } from '../scripts/check-ziwei-major-star-coordinate-provenance-v0.mjs'
test('Ziwei major-star coordinate packet remains bounded and complete', async () => {
  const artifact = await buildArtifact()
  assert.equal(artifact.inventory.length, 14)
  assert.equal(artifact.comparison.roots.ziwei.rawMatchCount, 150)
  assert.equal(artifact.comparison.roots.tianfu.rotation06MatchCount, 150)
  assert.equal(artifact.comparison.roots.tianfu.rotation06ResidualCount, 0)
  assert.equal(artifact.claims.claims[3].status, 'blocked_semantic_identity_insufficient')
  assert.deepEqual(await checkArtifact(artifact), [])
})

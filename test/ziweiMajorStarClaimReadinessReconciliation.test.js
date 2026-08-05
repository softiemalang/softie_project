import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { buildArtifact } from '../scripts/materialize-ziwei-major-star-claim-readiness-reconciliation-v0.mjs'
import { checkArtifact } from '../scripts/check-ziwei-major-star-claim-readiness-reconciliation-v0.mjs'
test('major-star reconciliation materializes deterministically and checks clean', async () => {
  const first = await buildArtifact(); const second = await buildArtifact()
  assert.deepEqual(first, second)
  assert.equal((await checkArtifact(first)).length, 0)
  assert.equal(first.claims.length, 14)
})
test('materialized packet is byte-identical to checked artifact', async () => {
  const actual = JSON.parse(await readFile('artifacts/ziwei-major-star-claim-readiness-reconciliation-v0/complete.json', 'utf8'))
  const expected = await buildArtifact()
  assert.deepEqual(actual, expected)
})

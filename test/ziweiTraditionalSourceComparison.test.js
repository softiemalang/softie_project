import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { checkArtifact } from '../scripts/check-ziwei-traditional-source-comparison-v0.mjs'

test('traditional source comparison artifact is deterministic and fail-closed', async () => {
  const root = resolve(new URL('..', import.meta.url).pathname)
  const artifact = JSON.parse(await readFile(resolve(root, 'artifacts/ziwei-traditional-source-comparison-v0/complete.json'), 'utf8'))
  assert.deepEqual(await checkArtifact(artifact, root), [])
  assert.equal(artifact.sourceInventory.sources[0].file.sha256, '04e184c4a52cb042dc885c6ccc9135d94ab25de62007506198ee979a33e66bfc')
  assert.equal(artifact.sourceInventory.sources[1].file.sha256, '4786a94ab454acdabf9716d7c0db4756dbcbde99a88bc45fda254863c1961023')
  assert.equal(artifact.comparison.domains.mingShen.matchCount, 144)
  assert.equal(artifact.comparison.domains.fiveElementBureau.matchCount, 1440)
  assert.equal(artifact.comparison.domains.ziwei.matchCount, 150)
  assert.equal(artifact.comparison.domains.tianfu.matchCount, 25)
  assert.equal(artifact.boundaries.productionEngineModified, false)
})

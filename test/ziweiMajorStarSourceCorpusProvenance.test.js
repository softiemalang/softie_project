import test from 'node:test'
import assert from 'node:assert/strict'
import { buildArtifact } from '../scripts/materialize-ziwei-major-star-source-corpus-provenance-v0.mjs'
import { checkArtifact } from '../scripts/check-ziwei-major-star-source-corpus-provenance-v0.mjs'
test('source corpus packet covers every actual PDF page and keeps the 150-row comparison separate', async () => {
  const artifact = await buildArtifact()
  assert.equal(artifact.screening.totalPages, 219)
  assert.equal(artifact.screening.screenedPages, 219)
  assert.equal(artifact.pageInventory.length, 219)
  assert.equal(artifact.pageInventory[0].page, 1)
  assert.equal(artifact.pageInventory[0].screeningStatus, 'screened')
  assert.equal(artifact.pageInventory.every(page => page.directReview === true), true)
  assert.equal(artifact.pageInventory.filter(page => page.relevanceClassification === 'unreadable_or_uncertain').length, 0)
  assert.equal(artifact.source.requestedCorpusPageCount, 150)
  assert.deepEqual(artifact.inventory.find(star => star.starId === 'ziwei').sourcePages, [11, 12])
  assert.deepEqual(artifact.inventory.find(star => star.starId === 'tianfu').sourcePages, [13])
  assert.equal(artifact.screening.coverageGapPages.length, 0)
  assert.equal(artifact.comparison.rowDomain.rowCount, 150)
  assert.equal(artifact.comparison.ziwei.exact, '150/150')
  assert.equal(artifact.comparison.tianfu.transformed, '150/150')
  assert.deepEqual(await checkArtifact(artifact), [])
})

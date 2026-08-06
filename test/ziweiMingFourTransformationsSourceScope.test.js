import test from 'node:test'
import assert from 'node:assert/strict'

import { checkArtifact, loadDocuments, validatePayload } from '../scripts/check-ziwei-ming-four-transformations-source-scope-v1.mjs'

test('Ming source-scope successor preserves direct cells and explicit 36-cell blockers', () => {
  const documents = loadDocuments()
  assert.deepEqual(validatePayload(documents), [])
  assert.equal(documents.direct.rawSourceRows.length, 44)
  assert.equal(documents.direct.rawSourceRows.filter(row => row.edition === 'ming_nanyangtang').length, 4)
  assert.equal(documents.matrix.cells.length, 36)
  assert.equal(documents.matrix.cells.every(cell => cell.rawTarget === null && cell.normalizedStarId === null), true)
  assert.equal(documents.comparison.summary.exactNormalizedMatchCount, 44)
  assert.equal(documents.comparison.summary.mismatchCount, 0)
  assert.equal(documents.comparison.summary.sourceRuleNotLocatedCount, 36)
  assert.equal(documents.complete.verdict, 'blocked_ziwei_ming_four_transformations_tier_a_witness_unavailable')
})

test('Ming source-scope positive checker validates identity, tier boundary, and sidecars', () => {
  assert.deepEqual(checkArtifact(), [])
})

import test from 'node:test'
import assert from 'node:assert/strict'
import { checkArtifact, loadDocuments, validatePayload } from '../scripts/check-ziwei-four-transformations-source-evidence-v0.mjs'

test('four-transformations evidence artifact is complete in shape and explicitly blocked in verdict', () => {
  const documents = loadDocuments()
  assert.deepEqual(validatePayload(documents), [])
  assert.equal(documents.occurrences.sourceOccurrences.length, 80)
  assert.equal(documents.occurrences.productionOccurrences.length, 40)
  assert.equal(documents.comparison.summary.exactNormalizedMatchCount, 44)
  assert.equal(documents.comparison.summary.blockedCount, 36)
  assert.equal(documents.complete.verdict, 'partial_ziwei_four_transformations_evidence_with_explicit_blockers')
})

test('four-transformations evidence positive checker validates source identity, identity contract, and sidecars', () => {
  assert.deepEqual(checkArtifact(), [])
})

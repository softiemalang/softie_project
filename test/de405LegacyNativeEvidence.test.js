import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

test('persisted DE405 legacy native evidence has the bounded canonical-v2 conclusion', async () => {
  const summary = JSON.parse(await readFile('docs/de405-legacy-native-cross-environment-summary.json', 'utf8'))
  const record = JSON.parse(await readFile('docs/de405-legacy-native-cross-environment-remote-record.json', 'utf8'))
  assert.equal(summary.classification, 'canonical_v2_cross_environment_bitwise_identity_established')
  assert.equal(summary.execution.head, '02a85fe40e1cb468eb28046cee00d543df9b5d60')
  assert.deepEqual(summary.corpus, { rowCount: 150671, componentCount: 904026 })
  assert.equal(summary.variants.length, 3)
  assert.equal(summary.pairwise.length, 3)
  for (const pair of summary.pairwise) {
    assert.equal(pair.differingRows, 0)
    assert.equal(pair.differingComponents, 0)
    assert.equal(pair.firstDivergence, null)
    assert.equal(pair.ulp.max, 0)
    assert.equal(pair.absolute.max, 0)
  }
  assert.equal(record.runId, '30768814210')
  assert.equal(record.jobs.analyze, 'success')
  assert.equal(record.setupImage.retentionDays, 14)
  assert.equal(record.rawArtifacts.tracked, false)
  assert.equal(summary.rawArtifacts.tracked, false)
})

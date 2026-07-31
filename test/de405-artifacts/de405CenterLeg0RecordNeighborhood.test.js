import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { test } from 'node:test'
import { analyze, readNeighborhood, serializeCanonicalJson, validateNeighborhoodFreshness } from '../../scripts/lib/de405-center-leg0-record-neighborhood.mjs'

const raw = 'artifacts/de405-center-leg0-record-neighborhood-evidence.jsonl'

test('leg-0 record-neighborhood evidence covers the fixed bounded cohort', async () => {
  const rows = await readNeighborhood(raw)
  assert.equal(rows.length, 154)
  assert.equal(new Set(rows.map(row => row.sampleId)).size, 154)
  assert.ok(rows.every(row => row.legOrdinal === 0 && row.selectedCandidate.status === 'computed'))
  assert.ok(rows.every(row => row.selectedCandidate.segmentIdentityDetails.segmentType === 2))
  assert.ok(rows.every(row => row.selectedCandidate.nativeParity.parityMismatchCount === 0 && row.selectedCandidate.nativeParity.nativeFailureCount === 0 && row.selectedCandidate.nativeParity.jsFallback === false))
  assert.ok(rows.every(row => row.selectedCandidate.state.bits.length === 6 && row.cspicePairState.bits.length === 6))
})

test('leg-0 record-neighborhood analysis preserves bounded classifications and contract state', async () => {
  const result = await analyze({ input: raw })
  assert.equal(result.cohortCount, 154)
  assert.equal(result.type2Count, 154)
  assert.equal(result.candidateEvaluationCount, 462)
  assert.equal(result.notComputableCandidateCount, 0)
  assert.equal(result.nativeExpectedOperationCount, result.nativeExecutedOperationCount)
  assert.equal(result.nativeExpectedOperationCount, result.parityMatchCount)
  assert.equal(result.parityMismatchCount, 0)
  assert.equal(result.nativeFailureCount, 0)
  assert.equal(result.jsFallback, false)
  assert.deepEqual(result.contractState, { selectionUnresolved: 1701, toleranceChanged: false, canonicalSelectionChanged: false, activeTransition: false, scientificApproval: false, productionIntegration: false })
})

test('leg-0 record-neighborhood freshness detects summary and raw identity changes', async () => {
  const freshness = await validateNeighborhoodFreshness()
  assert.equal(freshness.status, 'fresh')
  const source = await readFile(raw, 'utf8')
  const mutated = source.replace('"evidenceLevel":"confirmed"', '"evidenceLevel":"confirmed_mutation"')
  const temp = await mkdtemp(join(tmpdir(), 'de405-leg0-freshness-'))
  try {
    const localRaw = join(temp, 'raw.jsonl')
    await writeFile(localRaw, mutated)
    const changed = await analyze({ input: localRaw })
    const currentSummary = await readFile('docs/de405-center-leg0-record-neighborhood-analysis.json', 'utf8')
    assert.notEqual(serializeCanonicalJson(changed), currentSummary)
  } finally {
    await rm(temp, { recursive: true, force: true })
  }
})

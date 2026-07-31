import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const rawPath = 'artifacts/de405-center-leg0-cspice-type2-evaluation-evidence.jsonl'
const rows = (await readFile(rawPath, 'utf8')).trim().split('\n').filter(Boolean).map(line => JSON.parse(line))

test('center leg-0 CSPICE Type-2 exact-record evidence covers the bounded cohort', () => {
  assert.equal(rows.length, 154)
  assert.equal(new Set(rows.map(row => row.sampleId)).size, 154)
  assert.ok(rows.every((row, index) => index === 0 || rows[index - 1].sampleId.localeCompare(row.sampleId) <= 0))
  assert.ok(rows.every(row => row.selectedCandidate.status === 'computed'))
  assert.ok(rows.every(row => row.selectedCandidate.recordPayloadComparison.status === 'record_payload_exact_match'))
})

test('official reader/evaluator and ET identity are complete for every candidate', () => {
  const candidates = rows.flatMap(row => [row.selectedCandidate, row.previousCandidate, row.nextCandidate])
  assert.equal(candidates.length, 462)
  assert.ok(candidates.every(candidate => candidate.status === 'computed'))
  assert.ok(candidates.every(candidate => candidate.recordPayloadComparison.exact))
  assert.ok(candidates.every(candidate => candidate.officialEvaluation.status === 'computed'))
  assert.ok(candidates.every(candidate => candidate.officialEvaluation.etMutated === false))
  assert.ok(candidates.every(candidate => candidate.officialEvaluation.evidenceQueryEtBits === candidate.officialEvaluation.nativeInputEtBits))
  assert.ok(candidates.every(candidate => candidate.recordNumberConvention === 'project_zero_based_to_spkr02_one_based'))
})

test('official selected evaluation reproduces the audited high-level pair-state', () => {
  assert.ok(rows.every(row => row.primaryClassification === 'official_selected_matches_pair_project_differs'))
  assert.ok(rows.every(row => row.selectedCandidate.officialVsHighLevel.allComponentsBitwiseEqual))
  assert.ok(rows.every(row => !row.selectedCandidate.projectVsOfficial.allComponentsBitwiseEqual))
  assert.equal(rows.filter(row => row.selectedCandidate.projectVsOfficial.componentUlpDistances.every(value => value <= 1)).length, 82)
})

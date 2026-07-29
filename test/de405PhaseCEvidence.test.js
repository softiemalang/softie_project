import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const root = process.cwd()
const readJsonLines = async path => (await readFile(path, 'utf8')).trim().split('\n').filter(Boolean).map(JSON.parse)

test('Phase D candidate evidence contains one official selected JPL candidate per unresolved sample', async () => {
  const rows = await readJsonLines(`${root}/artifacts/de405-jpl-cspice-candidate-state-evidence.jsonl`)
  assert.equal(rows.length, 1701)
  assert.ok(rows.every(row => ['candidate_state_equivalent', 'state_equivalent_selection_different', 'candidate_state_different'].includes(row.classification)))
  assert.ok(rows.every(row => row.sources.jpl.candidates.length === 1))
  assert.ok(rows.every(row => row.sources.jpl.candidates.filter(candidate => candidate.selected).length === 1))
  assert.ok(rows.every(row => row.comparison.finalStateMatchesJplCandidate === true))
  assert.ok(rows.every(row => row.sources.cspice.candidates.length >= 1))
  assert.ok(rows.every(row => row.sources.jpl.candidateStateStatus === 'emitted_by_opt_in_evidence_mode'))
  assert.ok(rows.every(row => row.sources.cspice.candidates.every(candidate => candidate.positionKm.length === 3 && candidate.velocityKmS.length === 3)))
})

test('Phase D out-of-coverage investigation is empty after manifest regeneration', async () => {
  const report = JSON.parse(await readFile(`${root}/artifacts/de405-jpl-cspice-out-of-coverage-investigation.json`, 'utf8'))
  assert.equal(report.sourceCount, 0)
  assert.deepEqual(report.causes, {})
  assert.deepEqual(report.cases, [])
})

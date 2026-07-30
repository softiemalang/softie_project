import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { test } from 'node:test'
import {
  DEFAULT_CAUSE_INPUTS,
  FINDING_STATUSES,
  runUnresolvedSelectionCauseAnalysis,
  serializeCanonicalJson,
  validateUnresolvedSelectionCauseAnalysisFreshness
} from '../../scripts/lib/de405-unresolved-selection-cause-analysis.mjs'

const inputs = Object.fromEntries(Object.entries(DEFAULT_CAUSE_INPUTS).map(([key, value]) => [key, resolve(value)]))

async function writeCanonical(dir, paths = inputs) {
  const path = join(dir, 'cause.json')
  await writeFile(path, serializeCanonicalJson(await runUnresolvedSelectionCauseAnalysis(paths)))
  return path
}

test('unresolved cause analysis preserves coverage, groups, boundary direction, and contract state', async () => {
  const report = await runUnresolvedSelectionCauseAnalysis()
  assert.equal(report.invariants.totalUnresolvedCount, 1701)
  assert.equal(report.invariants.stateEquivalentSelectionDifferentCount, 606)
  assert.equal(report.invariants.candidateStateDifferentCount, 1095)
  assert.equal(report.invariants.crossGroupOverlap, 0)
  assert.equal(report.invariants.missingCandidateEvidence, 0)
  assert.equal(report.invariants.extraCandidateEvidence, 0)
  const second = report.groups.candidate_state_different
  assert.equal(second.distributions.epochKind.next_up_knot, 547)
  assert.equal(second.distributions.epochKind.next_down_knot, 548)
  assert.deepEqual(second.distributions.trigger, { neither: 0, position_and_velocity: 1086, position_only: 0, velocity_only: 9 })
  assert.deepEqual(report.contractState, { selectionUnresolvedBlockerActive: true, selectionUnresolvedCount: 1701, toleranceChanged: false, canonicalSelectionChanged: false, activeTransitionPerformed: false, scientificApproval: false })
  assert.deepEqual(Object.keys(report.findings), FINDING_STATUSES)
  assert.ok(Object.values(report.sources).every(source => source.sizeBytes > 0 && /^[a-f0-9]{64}$/.test(source.sha256)))
})

test('unresolved cause output is canonical and freshness detects source, output, and missing-source changes', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'de405-cause-analysis-'))
  try {
    const output = await writeCanonical(dir)
    assert.equal((await validateUnresolvedSelectionCauseAnalysisFreshness(output, inputs)).status, 'fresh')
    assert.equal(serializeCanonicalJson(await runUnresolvedSelectionCauseAnalysis(inputs)), serializeCanonicalJson(await runUnresolvedSelectionCauseAnalysis(inputs)))
    const mutatedOutput = JSON.parse(await readFile(output, 'utf8')); mutatedOutput.contractState.scientificApproval = true
    await writeFile(output, serializeCanonicalJson(mutatedOutput))
    assert.equal((await validateUnresolvedSelectionCauseAnalysisFreshness(output, inputs)).status, 'stale')
    const cleanOutput = await writeCanonical(dir)
    const alteredClassifications = join(dir, 'classifications.jsonl')
    await writeFile(alteredClassifications, `${await readFile(inputs.classifications, 'utf8')}\n`)
    assert.equal((await validateUnresolvedSelectionCauseAnalysisFreshness(cleanOutput, { ...inputs, classifications: alteredClassifications })).status, 'stale')
    assert.equal((await validateUnresolvedSelectionCauseAnalysisFreshness(cleanOutput, { ...inputs, classifications: join(dir, 'missing.jsonl') })).status, 'invalid')
  } finally { await rm(dir, { recursive: true, force: true }) }
})

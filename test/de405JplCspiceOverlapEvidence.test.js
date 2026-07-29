import test from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { join } from 'node:path'

const root = process.cwd()
const runner = join(root, 'tools/de405-cspice-runner/build/de405-canonical-v2-runner')
const verifier = join(root, 'scripts/verify-de405-jpl-cspice-overlap.mjs')
const spk = join(process.env.HOME, '.local/share/softie-de405/kernels/spk/de405.bsp')

function jsonLines(run) {
  assert.equal(run.stderr, '')
  return run.stdout.trim().split('\n').filter(Boolean).map(line => JSON.parse(line))
}

test('SPK Type 2 metadata is extracted from the raw DAF directory', () => {
  const run = spawnSync(runner, ['--dump-spk-type2-segments', '--spk', spk], { encoding: 'utf8' })
  assert.equal(run.status, 0)
  const segments = jsonLines(run)
  assert.ok(segments.length >= 10)
  assert.ok(segments.every(segment => segment.spkRecordMetadataStatus === 'verified'))
  const venus = segments.find(segment => segment.targetId === 2 && segment.dataType === 2)
  assert.deepEqual({ initEt: venus.initEt, intlenSec: venus.intlenSec, rsize: venus.rsize, recordCount: venus.recordCount, polynomialDegree: venus.polynomialDegree }, {
    initEt: -1578052800,
    intlenSec: 1382400,
    rsize: 32,
    recordCount: 2283,
    polynomialDegree: 9
  })
})

test('CSPICE exact-knot selection evidence is unique on both sides of a Venus knot', () => {
  const run = spawnSync(runner, ['--inspect-spk-type2-knot', '--spk', spk, '--target-id', '2', '--knot-index', '1'], { encoding: 'utf8' })
  assert.equal(run.status, 0)
  const evidence = jsonLines(run)
  assert.deepEqual(evidence.map(item => item.epochKind), ['nextDown', 'exact_record_knot', 'nextUp'])
  assert.deepEqual(evidence.map(item => item.selectionEvidenceStatus), ['verified', 'verified', 'verified'])
  assert.deepEqual(evidence.map(item => item.selectedRecordIndex), [0, 1, 1])
  assert.ok(evidence.every(item => item.candidateEvaluations.some(candidate => candidate.bitwiseStateMatch)))
})

test('overlap verifier consumes metadata evidence and preserves tolerance exit 1', () => {
  const run = spawnSync(process.execPath, [verifier], { encoding: 'utf8', maxBuffer: 1024 * 1024 })
  assert.equal(run.status, 1)
  const evidence = JSON.parse(run.stdout)
  assert.equal(evidence.executionSucceeded, true)
  assert.equal(evidence.comparisonCompleted, true)
  assert.equal(evidence.toleranceStatus, 'candidate')
  assert.equal(evidence.spkRecordMetadataStatus, 'verified')
  assert.equal(evidence.spk_record_metadata_status, 'verified')
  assert.equal(evidence.candidateContractStatus, 'rejected_by_observed_boundary_residuals')
  assert.equal(evidence.activeContractStatus, 'not_established')
  assert.equal(evidence.exitCode, 1)
  assert.ok(evidence.samples.some(sample => sample.spkSelectionEvidenceStatus === 'verified'))
  assert.ok(evidence.samples.every(sample => !Object.hasOwn(sample, 'spkRecordIndex')))
})

import test from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { join } from 'node:path'

const root = process.cwd()
const verifierPath = join(root, 'scripts/verify-de405-jpl-cspice-overlap.mjs')

test('Overlap verifier guarantees independent origin of JPL and CSPICE outcomes', () => {
  const env = { ...process.env, DE405_BSP_PATH: join(process.env.HOME, '.local/share/softie-de405/kernels/spk/de405.bsp') }
  const run = spawnSync(process.execPath, [verifierPath], { encoding: 'utf8', env })
  
  // Exit code 2 is expected for tolerance_blocked
  assert.equal(run.status, 2)
  
  const evidence = JSON.parse(run.stdout)
  
  assert.equal(evidence.executionSucceeded, true)
  assert.equal(evidence.comparisonCompleted, true)
  assert.equal(evidence.conditionParity, true)
  assert.equal(evidence.toleranceStatus, 'undefined')
  assert.equal(evidence.passed, null)
  assert.equal(evidence.verdict, 'overlap_tolerance_blocked')
  
  assert.equal(evidence.jpl.provenance, 'generated-independently-via-jpl-run-mjs')
  assert.equal(evidence.cspice.provenance, 'generated-independently-via-cspice-smoke-runner')
  
  assert.equal(evidence.jpl.runnerPath !== evidence.cspice.runnerPath, true)
  assert.equal(evidence.conditions.independentExecution, true)
  
  assert.ok(evidence.comparisonCount >= 40, 'Should have at least 40 comparisons (4 epochs x 10 targets)')
})

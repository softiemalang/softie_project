import test from 'node:test'
import assert from 'node:assert/strict'
import { buildAcceptanceArtifact, canonicalJson, SCHEMA, BASIS_HEAD } from '../scripts/materialize-ziwei-ziwei-star-placement-clean-rule-seed-acceptance-v0.mjs'
import { checkAcceptanceArtifact } from '../scripts/check-ziwei-ziwei-star-placement-clean-rule-seed-acceptance-v0.mjs'
import { spawnSync } from 'node:child_process'

test('source-first p11-p12 acceptance reconciles all 150 rows without promotion', async () => {
  const { artifact } = await buildAcceptanceArtifact()
  assert.equal(artifact.schemaVersion, SCHEMA)
  assert.equal(artifact.basisHead, BASIS_HEAD)
  assert.equal(artifact.verdictToken, 'ziwei_ziwei_star_placement_seed_accepted_with_declared_limits')
  assert.equal(artifact.comparison.inputCount, 150)
  assert.equal(artifact.comparison.matchCount, 150)
  assert.equal(artifact.comparison.mismatchCount, 0)
  assert.equal(artifact.comparison.firstDivergence, null)
  assert.equal(artifact.comparison.missingCount, 0)
  assert.equal(artifact.comparison.duplicateRowIdCount, 0)
  assert.equal(artifact.acceptance.boundaries.stableClaimCount, 0)
  assert.deepEqual(await checkAcceptanceArtifact(artifact), [])
})

test('acceptance materialization is byte deterministic and negative checker is closed', () => {
  const result = spawnSync(process.execPath, ['scripts/check-ziwei-ziwei-star-placement-clean-rule-seed-acceptance-negative-v0.mjs'], { cwd: process.cwd(), encoding: 'utf8' })
  assert.equal(result.status, 0, result.stdout + result.stderr)
  assert.equal(JSON.parse(result.stdout).undetected.length, 0)
  assert.equal(canonicalJson({ b: 2, a: 1 }), '{\n  "a": 1,\n  "b": 2\n}\n')
})

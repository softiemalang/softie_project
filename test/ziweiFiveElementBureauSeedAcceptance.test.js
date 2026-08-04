import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import test from 'node:test'
import { buildAcceptanceArtifact, canonicalJson, SCHEMA } from '../scripts/materialize-ziwei-five-element-bureau-clean-rule-seed-acceptance-v0.mjs'
import { checkAcceptanceArtifact } from '../scripts/check-ziwei-five-element-bureau-clean-rule-seed-acceptance-v0.mjs'

test('five-element bureau acceptance is bounded and exhaustive', async () => {
  const first = await buildAcceptanceArtifact(); const second = await buildAcceptanceArtifact()
  assert.equal(canonicalJson(first.artifact), canonicalJson(second.artifact))
  assert.equal(first.artifact.schemaVersion, SCHEMA)
  assert.equal(first.artifact.verdictToken, 'ziwei_five_element_bureau_seed_accepted_with_declared_limits')
  assert.equal(first.artifact.comparison.inputCount, 1440)
  assert.equal(first.artifact.comparison.matchCount, 1440)
  assert.equal(first.artifact.comparison.mismatchCount, 0)
  assert.equal(first.artifact.comparison.firstDivergence, null)
  assert.deepEqual(await checkAcceptanceArtifact(first.artifact), [])
})

test('five-element bureau acceptance negative fixture detects shortcut classes', () => {
  const result = spawnSync(process.execPath, ['scripts/check-ziwei-five-element-bureau-clean-rule-seed-acceptance-negative-v0.mjs'], { encoding: 'utf8' })
  assert.equal(result.status, 0, result.stdout + result.stderr)
  assert.deepEqual(JSON.parse(result.stdout).undetected, [])
})

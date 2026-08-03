import test from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const root = new URL('../', import.meta.url).pathname
const artifactPath = new URL('../artifacts/saju-verification-reconciliation-v1.json', import.meta.url).pathname

test('saju reconciliation artifact checker passes against the current HEAD', () => {
  const output = execFileSync(process.execPath, ['scripts/check-saju-verification-reconciliation.mjs'], {
    cwd: root,
    encoding: 'utf8',
  })
  const result = JSON.parse(output)
  assert.equal(result.status, 'pass')
  assert.equal(result.verdictToken, 'saju_scoped_external_matches_but_claim_level_verification_unproven')
  assert.equal(result.circularInternalFixtures, 12)
  assert.equal(result.unresolvedTraditionalRuleSources, true)
})

test('saju reconciliation artifact is deterministic JSON with a fixed-head identity', () => {
  const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'))
  assert.match(artifact.generatedFromHead, /^[0-9a-f]{40}$/)
  assert.equal(artifact.scope, 'read_only_reconciliation_of_existing_saju_evidence')
  assert.equal(artifact.invariants.includes('no calculation, rule, fixture expectation, contract, or tolerance was changed'), true)
  assert.equal(artifact.externalComparison.summary.observedMatches, 7)
  assert.equal(artifact.externalComparison.summary.observedMismatches, 0)
})

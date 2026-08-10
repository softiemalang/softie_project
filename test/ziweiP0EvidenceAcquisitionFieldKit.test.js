import assert from 'node:assert/strict'
import test from 'node:test'
import { execFileSync } from 'node:child_process'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

import { canonicalJson } from '../scripts/materialize-ziwei-p0-evidence-acquisition-field-kit-v1.mjs'
import {
  ARTIFACT_DIR,
  ROOT,
  buildBundle,
  materializeBundle,
} from '../scripts/materialize-ziwei-p0-evidence-acquisition-field-kit-v1.mjs'
import { checkArtifact } from '../scripts/check-ziwei-p0-evidence-acquisition-field-kit-v1.mjs'

test('Ziwei P0 acquisition field kit reconciles all blockers without promotion', () => {
  const first = buildBundle(ROOT)
  const second = buildBundle(ROOT)
  assert.equal(canonicalJson(first), canonicalJson(second))
  assert.equal(first.currentAudit.graph.claims, 30)
  assert.equal(first.currentAudit.graph.sources, 13)
  assert.equal(first.currentAudit.graph.observations, 40)
  assert.equal(first.currentAudit.graph.relations, 130)
  assert.equal(first.blockers.length, 11)
  assert.equal(first.targets.length, 10)
  assert.deepEqual(first.blockers.filter(item => item.boundaryClass === 'human_policy_boundary').map(item => item.id), ['blocker-image-reuse-rights'])
  assert.equal(first.currentAudit.statuses.rotation06, 'representation_only')
  assert.equal(first.currentAudit.sourceInventory.heldButAuthorityInsufficient[0].status, 'held_but_authority_insufficient')
  assert.equal(first.claimImpact.rightsTargetResolvesClaimIds.length, 0)
})

test('Ziwei P0 acquisition field kit materialization is byte-identical on repeated writes', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'ziwei-p0-acquisition-kit-deterministic-'))
  try {
    const first = await materializeBundle(join(directory, 'complete.json'))
    const firstBodies = {}
    for (const path of Object.values(first.outputs)) firstBodies[path] = await readFile(path)
    const second = await materializeBundle(join(directory, 'complete.json'))
    for (const path of Object.values(second.outputs)) assert.deepEqual(await readFile(path), firstBodies[path])
    assert.deepEqual(await checkArtifact(await readFile(first.outputs.complete).then(JSON.parse), { root: ROOT }), [])
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

test('Ziwei P0 acquisition field kit rejects blocker, authority, independence, and layer shortcuts', () => {
  const output = execFileSync(
    'node',
    ['scripts/check-ziwei-p0-evidence-acquisition-field-kit-v1-negative-v0.mjs'],
    { cwd: ROOT, encoding: 'utf8' },
  )
  const result = JSON.parse(output)
  assert.equal(result.mutationCount, 14)
  assert.equal(result.allRejected, true)
  assert.ok(result.results.every(item => item.rejected))
})

test('Ziwei P0 acquisition field kit checker rejects a wrong target claim mapping directly', async () => {
  const candidate = buildBundle(ROOT)
  candidate.targets.find(item => item.id === 'acq-calendar-time-input-authority').resolvesClaimIds.push('claim-major-star-placement-ziwei')
  const failures = await checkArtifact(candidate, { root: ROOT })
  assert.ok(failures.includes('target_claim_scope:acq-calendar-time-input-authority') || failures.includes('materialized_content'))
})

void ARTIFACT_DIR

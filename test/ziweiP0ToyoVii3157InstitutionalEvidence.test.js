import assert from 'node:assert/strict'
import test from 'node:test'
import { execFileSync } from 'node:child_process'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { tmpdir } from 'node:os'

import { canonicalIdentityJson } from '../src/artifactIdentity.js'
import {
  ARTIFACT_DIR,
  ROOT,
  buildBundle,
  materializeBundle,
} from '../scripts/materialize-ziwei-p0-toyo-vii-3-157-institutional-evidence-v1.mjs'
import { checkArtifact } from '../scripts/check-ziwei-p0-toyo-vii-3-157-institutional-evidence-v1.mjs'

test('Toyo VII-3-157 institutional reply is provenance-bound and additive only', () => {
  const first = buildBundle(ROOT)
  const second = buildBundle(ROOT)
  assert.equal(canonicalIdentityJson(first), canonicalIdentityJson(second))
  assert.deepEqual(first.artifact.graphImpact.predecessor, {
    claimCount: 30,
    sourceCount: 13,
    observationCount: 40,
    relationCount: 130,
    blockerCount: 11,
  })
  assert.deepEqual(first.artifact.graphImpact.successor, {
    claimCount: 30,
    sourceCount: 14,
    observationCount: 44,
    relationCount: 134,
    blockerCount: 11,
  })
  assert.equal(first.artifact.sourceLineage.catalogReconciliation.reportedPhysicalItemCount, 1)
  assert.equal(first.artifact.sourceLineage.physicalWitnessCount, 1)
  assert.equal(first.artifact.graphImpact.additive.physicalWitnessCount, 0)
  assert.equal(first.artifact.institutionalEvidence.provenance.messageId, '19ff4725ca62e800')
  assert.equal(first.artifact.institutionalEvidence.provenance.threadId, '19feb2ee1dcf009c')
  assert.equal(first.artifact.observations.find(item => item.observationId === 'obs-toyo-vii-3-157-staff-editorial-inscription').qualification, '一見したところ')
  assert.equal(first.artifact.claimImpact.claimStatusChanges.length, 0)
  assert.deepEqual(first.artifact.graphImpact.blockersClosed, [])
  assert.equal(first.artifact.readinessImpact.readiness, 'not_safe_to_start')
  assert.equal(first.artifact.readinessImpact.grounding, 'blocked')
  assert.equal(first.artifact.readinessImpact.activation, 'experimental_only')
  assert.equal(first.artifact.readinessImpact.rotation06, 'representation_only')
  assert.deepEqual(checkArtifact(ROOT, resolve(ROOT, `${ARTIFACT_DIR}/complete.json`)), [])
})

test('Toyo VII-3-157 institutional evidence materialization is byte-identical on repeated writes', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'ziwei-toyo-vii-3-157-deterministic-'))
  try {
    const target = join(directory, 'complete.json')
    const first = await materializeBundle(target)
    const firstBytes = {}
    for (const path of Object.values(first.outputs)) {
      firstBytes[path] = await readFile(path)
      firstBytes[`${path}.integrity.json`] = await readFile(`${path}.integrity.json`)
    }
    const second = await materializeBundle(target)
    for (const path of Object.values(second.outputs)) {
      assert.deepEqual(await readFile(path), firstBytes[path])
      assert.deepEqual(await readFile(`${path}.integrity.json`), firstBytes[`${path}.integrity.json`])
    }
    assert.deepEqual(checkArtifact(ROOT, target), [])
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

test('Toyo VII-3-157 institutional evidence negative checker rejects authority and boundary shortcuts', () => {
  const output = execFileSync(
    'node',
    ['scripts/check-ziwei-p0-toyo-vii-3-157-institutional-evidence-v1-negative-v0.mjs'],
    { cwd: ROOT, encoding: 'utf8' },
  )
  const result = JSON.parse(output)
  assert.equal(result.mutationCount, 14)
  assert.equal(result.allRejected, true)
  assert.ok(result.results.every(item => item.rejected))
})

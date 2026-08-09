import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { spawnSync } from 'node:child_process'
import { buildArtifact, SCHEMA } from '../scripts/materialize-ziwei-nara-iiif-leafmap-semantic-witness-v1.mjs'
import { checkArtifact } from '../scripts/check-ziwei-nara-iiif-leafmap-semantic-witness-v1.mjs'

const root = process.cwd()
const materializer = `scripts/materialize-${SCHEMA}.mjs`

test('NARA manifests and local PDF have complete deterministic leaf/page coverage', async () => {
  const artifact = await buildArtifact()
  assert.deepEqual(artifact.manifests.volumes.map(volume => volume.leafCount), [129, 137])
  assert.equal(artifact.captureReview.reviewedLeafCount, 266)
  assert.equal(artifact.concordance.localPdfPageCount, 528)
  assert.equal(artifact.concordance.naraSideCount, 532)
  assert.equal(artifact.concordance.omittedSideCount, 4)
  assert.deepEqual(artifact.concordance.relationCounts, { exact_same_leaf: 0, same_text_different_capture: 522, probable_correspondence: 6, unresolved: 4 })
  assert.deepEqual(artifact.concordance.rows.map(row => row.localPdfPage), Array.from({ length: 528 }, (_, index) => index + 1))
})

test('semantic frontier remains blocked and rotation relations stay representational', async () => {
  const artifact = await buildArtifact()
  assert.equal(artifact.semanticWitness.status, 'blocked_semantic_identity_insufficient')
  assert.equal(artifact.semanticWitness.completeBindingCount, 0)
  assert.equal(artifact.semanticWitness.requiredBindingCount, 12)
  assert.equal(artifact.semanticWitness.lineage.independentWitness, false)
  assert.equal(artifact.semanticWitness.representationRelations.rotation06.semanticAuthority, false)
  assert.equal(artifact.boundaries.readiness, 'not_safe_to_start')
  assert.equal(artifact.boundaries.grounding, 'blocked')
  assert.equal(artifact.boundaries.activation, 'experimental')
})

test('NARA leaf-map materialization is byte deterministic and its checker passes', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'ziwei-nara-leafmap-'))
  try {
    const a = join(dir, 'a.json'); const b = join(dir, 'b.json')
    for (const target of [a, b]) assert.equal(spawnSync(process.execPath, [materializer, target], { cwd: root, encoding: 'utf8' }).status, 0)
    assert.deepEqual(await readFile(a), await readFile(b))
    const checked = spawnSync(process.execPath, [`scripts/check-${SCHEMA}.mjs`, a], { cwd: root, encoding: 'utf8' })
    assert.equal(checked.status, 0, checked.stdout + checked.stderr)
    assert.equal(JSON.parse(checked.stdout).pass, true)
  } finally { await rm(dir, { recursive: true, force: true }) }
})

test('NARA leaf-map negative mutations fail closed', () => {
  const result = spawnSync(process.execPath, [`scripts/check-${SCHEMA}-negative.mjs`], { cwd: root, encoding: 'utf8' })
  assert.equal(result.status, 0, result.stdout + result.stderr)
  assert.deepEqual(JSON.parse(result.stdout).findings, [])
})

test('checked repository artifact preserves its current contract', async () => {
  assert.deepEqual(await checkArtifact(), [])
})

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
} from '../scripts/materialize-ziwei-p0-youyi-lu-cadal-01025514-semantic-witness-v1.mjs'
import { checkArtifact } from '../scripts/check-ziwei-p0-youyi-lu-cadal-01025514-semantic-witness-v1.mjs'

test('Youyi Lu scan candidate is additive, source-bounded, and semantically explicit', () => {
  const first = buildBundle(ROOT, { mode: 'historical_reference' })
  const second = buildBundle(ROOT, { mode: 'historical_reference' })
  assert.equal(canonicalIdentityJson(first), canonicalIdentityJson(second))
  assert.deepEqual(first.artifact.graphImpact.predecessor, {
    claimCount: 30,
    sourceCount: 14,
    observationCount: 44,
    relationCount: 134,
    blockerCount: 11,
  })
  assert.deepEqual(first.artifact.graphImpact.successor, {
    claimCount: 30,
    sourceCount: 15,
    observationCount: 50,
    relationCount: 140,
    blockerCount: 11,
  })
  assert.equal(first.artifact.sourceLineage.addedSource.sourceId, 'src-youyi-lu-cadal-01025514-1883')
  assert.equal(first.artifact.sourceLineage.addedSource.sourceFile.sha256, '761a9827a1fe0df8f1aa1e15317b1eb18c528892750fa618f7ed97a5897535ba')
  assert.equal(first.artifact.sourceLineage.physicalWitnessCountAfter, 2)
  assert.equal(first.artifact.sourceLineage.independentPhysicalWitnessesAdmitted, 0)
  assert.equal(first.artifact.sourceLineage.addedSource.edition.physicalCopyTitlePageReviewed, true)
  assert.equal(first.artifact.sourceLineage.addedSource.edition.physicalCopyTitlePagePresent, false)
  assert.equal(first.artifact.sourceLineage.addedSource.edition.colophonReviewed, true)
  assert.equal(first.artifact.sourceLineage.addedSource.edition.colophonPresent, false)
  assert.deepEqual(first.artifact.sourceLineage.addedSource.scanBoundaryReview.reviewedPages, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 177, 178])
  assert.equal(first.artifact.sourceLineage.addedSource.scanBoundaryReview.titlePageObserved, false)
  assert.equal(first.artifact.sourceLineage.addedSource.scanBoundaryReview.colophonObserved, false)
  assert.equal(first.artifact.observations.find(item => item.observationId === 'obs-youyi-p139-tianfu-pair-map').deterministicRelation.sourceAlignedFormulaMatchesAllRecordedRows, true)
  assert.equal(first.artifact.localComparison.tianfu.existingIntegratedIdentity.matchCount, 0)
  assert.equal(first.artifact.localComparison.tianfu.existingIntegratedRotation06.matchCount, 150)
  assert.equal(first.artifact.localComparison.tianfu.referenceSurfaces.mingMingEditionAnTianfuDiagram.youyiExplicitAnchorMatches, true)
  assert.equal(first.artifact.localComparison.tianfu.referenceSurfaces.mingMingEditionAnTianfuDiagram.fullTwelveRowMapComparable, false)
  assert.equal(first.artifact.localComparison.tianfu.referenceSurfaces.nanbeiAnTianfuTable.youyiMapMatchCount, 12)
  assert.equal(first.artifact.localComparison.tianfu.referenceSurfaces.productionLegacy.youyiMapMatchCount, 0)
  assert.equal(first.artifact.localComparison.tianfu.referenceSurfaces.rotation06.status, 'representation_only')
  assert.deepEqual(first.artifact.graphImpact.blockersClosed, [])
  assert.equal(first.artifact.claimImpact.claimsPromoted, 0)
  assert.deepEqual(first.artifact.claimImpact.directSemanticClaimSupportAdded, [])
  assert.equal(first.artifact.readinessImpact.readiness, 'not_safe_to_start')
  assert.equal(first.artifact.readinessImpact.grounding, 'blocked')
  assert.equal(first.artifact.readinessImpact.activation, 'experimental_only')
  assert.equal(first.artifact.readinessImpact.rotation06, 'representation_only')
  assert.deepEqual(checkArtifact(ROOT, resolve(ROOT, ARTIFACT_DIR + '/complete.json')), [])
})

test('Youyi Lu candidate materialization is byte-identical on repeated writes', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'ziwei-youyi-lu-deterministic-'))
  try {
    const target = join(directory, 'complete.json')
    const first = await materializeBundle(target, { mode: 'historical_reference' })
    const firstBytes = {}
    for (const path of Object.values(first.outputs)) {
      firstBytes[path] = await readFile(path)
      firstBytes[path + '.integrity.json'] = await readFile(path + '.integrity.json')
    }
    const second = await materializeBundle(target, { mode: 'historical_reference' })
    for (const path of Object.values(second.outputs)) {
      assert.deepEqual(await readFile(path), firstBytes[path])
      assert.deepEqual(await readFile(path + '.integrity.json'), firstBytes[path + '.integrity.json'])
    }
    assert.deepEqual(checkArtifact(ROOT, target), [])
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

test('Youyi Lu negative checker rejects source, OCR, semantic, and promotion shortcuts', () => {
  const output = execFileSync(
    'node',
    ['scripts/check-ziwei-p0-youyi-lu-cadal-01025514-semantic-witness-v1-negative-v0.mjs'],
    { cwd: ROOT, encoding: 'utf8' },
  )
  const result = JSON.parse(output)
  assert.equal(result.mutationCount, 17)
  assert.equal(result.allRejected, true)
  assert.ok(result.results.every(item => item.rejected))
})

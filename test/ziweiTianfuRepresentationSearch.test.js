import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { buildArtifact, canonicalJson, SCHEMA } from '../scripts/materialize-ziwei-tianfu-representation-search-v1.mjs'
import { checkRepresentationSearchArtifact } from '../scripts/check-ziwei-tianfu-representation-search-v1.mjs'
import { BRANCHES, CORRECTED_SOURCE_TABLE, enumerateRepresentationCandidates } from '../src/ziwei/tianfuRepresentationSearch.js'

test('corrected source cells and finite representation search are complete', async () => {
  const { artifact } = await buildArtifact()
  assert.equal(artifact.schemaVersion, SCHEMA)
  assert.deepEqual(BRANCHES, ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'])
  assert.equal(CORRECTED_SOURCE_TABLE[1][1], '卯')
  assert.equal(artifact.correction.changedRowCount, 10)
  assert.equal(artifact.verdictToken, 'equivalent_representation_proven')
  assert.equal(artifact.predecessor.integratedBaseline.matchCount, 25)
  assert.equal(artifact.predecessor.integratedBaseline.mismatchCount, 125)
  assert.equal(artifact.search.candidateCount, enumerateRepresentationCandidates().length)
  assert.equal(artifact.search.candidateCount, 696)
  assert.deepEqual(artifact.search.allowedTransformContract.rotations.values, Array.from({ length: 12 }, (_, offset) => offset))
  assert.deepEqual(artifact.search.allowedTransformContract.traversalDirection.values, ['clockwise', 'counterclockwise'])
  assert.deepEqual(artifact.search.allowedTransformContract.cyclicReflections.values, ['left_right', 'up_down'])
  assert.deepEqual(artifact.search.allowedTransformContract.indexBase, [0, 1])
  assert.deepEqual(artifact.search.exactFitIds.includes('affine-same-rotation-06'), true)
  assert.equal(artifact.search.sourceDirectionProof.rotation06ResidualCount, 0)
  const mingDiagram = artifact.sourceEvidence.transcription.ming.locators.find(locator => locator.pdfPage === 172)
  assert.equal(mingDiagram.glyphPreservingText, '安天府圖；天府惟寅申二宮；紫府同宮；如紫居丑則府居卯矣')
  assert.deepEqual(mingDiagram.visualReview.dpi, [420, 600])
  assert.deepEqual(mingDiagram.diagram.branchRing, ['巳', '午', '未', '申', '酉', '戌', '亥', '子', '丑', '寅', '卯', '辰'])
  assert.deepEqual(mingDiagram.diagram.anchors.samePalaces, ['寅', '申'])
  assert.deepEqual(mingDiagram.diagram.anchors.explicit, { ziwei: '丑', tianfu: '卯' })
  assert.deepEqual(artifact.sourceEvidence.transcription.nanbei.locator.visualReview.dpi, [420])
  assert.deepEqual(await checkRepresentationSearchArtifact(artifact), [])
})

test('representation search materialization is byte deterministic', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'ziwei-tianfu-representation-'))
  try {
    const a = join(dir, 'a.json'); const b = join(dir, 'b.json')
    for (const target of [a, b]) assert.equal(spawnSync(process.execPath, ['scripts/materialize-ziwei-tianfu-representation-search-v1.mjs', target], { cwd: process.cwd(), encoding: 'utf8' }).status, 0)
    assert.deepEqual(await readFile(a), await readFile(b))
    assert.equal(canonicalJson((await buildArtifact()).artifact), await readFile(a, 'utf8'))
  } finally { await rm(dir, { recursive: true, force: true }) }
})

test('representation search negative mutation is rejected', () => {
  const result = spawnSync(process.execPath, ['scripts/check-ziwei-tianfu-representation-search-v1-negative.mjs'], { cwd: process.cwd(), encoding: 'utf8' })
  assert.equal(result.status, 0, result.stdout + result.stderr)
  assert.equal(JSON.parse(result.stdout).detected, true)
})

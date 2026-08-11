import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { cp, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import test from 'node:test'

import { canonicalIdentityJson } from '../src/artifactIdentity.js'

import {
  checkMaterialized,
} from '../scripts/check-design-reference-low-risk-interaction-foundation-batch-v1.mjs'
import {
  COMPANIONS,
  DEFAULT_DIRECTORY,
  BASELINE_HEAD,
  VERDICT,
  materialize,
} from '../scripts/materialize-design-reference-low-risk-interaction-foundation-batch-v1.mjs'

const currentHead = execFileSync('git', ['-c', 'core.fsmonitor=false', 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim()

test('batch artifact closes six independent frontier decisions without false promotion', async () => {
  assert.deepEqual(await checkMaterialized(DEFAULT_DIRECTORY), [])
  const artifact = JSON.parse(await readFile(join(DEFAULT_DIRECTORY, 'complete.json'), 'utf8'))
  assert.equal(artifact.verdict, VERDICT)
  assert.equal(artifact.provenanceLineage.emilCorpus.independentAuthorityCount, 1)
  assert.equal(artifact.provenanceLineage.emilCorpus.installationIsAdoption, false)
  const decisions = Object.fromEntries(artifact.frontierDecisionLedger.frontiers.map((item) => [item.frontierId, item.decision]))
  assert.deepEqual(decisions, {
    'FRONTIER-PRESS-FEEDBACK': 'pilot',
    'FRONTIER-HOVER-POINTER-GATING': 'adopt',
    'FRONTIER-SMALL-OVERLAY-MOTION': 'hold',
    'FRONTIER-REDUCED-MOTION': 'adopt',
    'FRONTIER-MOTION-TOKEN-COHERENCE': 'adopt',
    'FRONTIER-ANIMATED-GLASS-MATERIAL': 'reject',
  })
  assert.match(artifact.nonGeneralization.async200ms, /not reused/)
})

test('materialization is byte-identical across directories and at the same target', {
  skip: currentHead === BASELINE_HEAD ? false : `frozen baseline materializer is replayed only at ${BASELINE_HEAD}`,
}, async () => {
  const left = await mkdtemp(join(tmpdir(), 'softie-interaction-foundation-left-'))
  const right = await mkdtemp(join(tmpdir(), 'softie-interaction-foundation-right-'))
  try {
    await materialize(left)
    await materialize(right)
    const names = (await readdir(left)).sort()
    assert.deepEqual(names, (await readdir(right)).sort())
    for (const name of names) assert.deepEqual(await readFile(join(left, name)), await readFile(join(right, name)), name)
    const firstPass = Object.fromEntries(await Promise.all(names.map(async (name) => [name, await readFile(join(left, name))])))
    await materialize(left)
    for (const name of names) assert.deepEqual(await readFile(join(left, name)), firstPass[name], `same target: ${name}`)
    assert.deepEqual(await checkMaterialized(left), [])
    assert.deepEqual(await checkMaterialized(right), [])
  } finally {
    await rm(left, { recursive: true, force: true })
    await rm(right, { recursive: true, force: true })
  }
})

test('checker independently rejects every companion tamper', async () => {
  for (const companion of COMPANIONS) {
    const directory = await mkdtemp(join(tmpdir(), 'softie-interaction-foundation-companion-'))
    try {
      await cp(DEFAULT_DIRECTORY, directory, { recursive: true })
      const path = join(directory, companion)
      await writeFile(path, `${await readFile(path, 'utf8')}\n`)
      const failures = await checkMaterialized(directory)
      assert.ok(failures.includes(`companion_mismatch:${companion}`), companion)
      assert.ok(failures.includes(`integrity_hash:${companion}`), companion)
    } finally {
      await rm(directory, { recursive: true, force: true })
    }
  }
})

test('checker rejects lineage inflation, unsupported promotion, device overclaim, and 200ms generalization', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'softie-interaction-foundation-boundaries-'))
  try {
    await cp(DEFAULT_DIRECTORY, directory, { recursive: true })
    const path = join(directory, 'complete.json')
    const artifact = JSON.parse(await readFile(path, 'utf8'))
    artifact.provenanceLineage.emilCorpus.independentAuthorityCount = 2
    artifact.frontierDecisionLedger.frontiers.find((item) => item.frontierId === 'FRONTIER-PRESS-FEEDBACK').decision = 'adopt'
    artifact.frontierDecisionLedger.frontiers.find((item) => item.frontierId === 'FRONTIER-PRESS-FEEDBACK').evidence.product_device_evidence = ['synthetic-pass']
    artifact.nonGeneralization.async200ms = 'Use 200ms universally.'
    await writeFile(path, `${JSON.stringify(artifact, null, 2)}\n`)
    const failures = await checkMaterialized(directory)
    assert.ok(failures.includes('emil_independent_count'))
    assert.ok(failures.includes('press_decision'))
    assert.ok(failures.includes('press_device_boundary'))
    assert.ok(failures.includes('async_200_non_generalization'))
    assert.ok(failures.includes('integrity_hash:complete.json'))
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

test('historical source refs require an exact current, base, or ancestry snapshot', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'softie-interaction-foundation-source-ref-'))
  try {
    await cp(DEFAULT_DIRECTORY, directory, { recursive: true })
    const path = join(directory, 'complete.json')
    const artifact = JSON.parse(await readFile(path, 'utf8'))
    artifact.sourceReferenceLedger.sources.find((item) => item.sourceRef?.kind === 'working_tree_text').sourceRef.byteSha256 = '0'.repeat(64)
    await writeFile(path, canonicalIdentityJson(artifact))
    const failures = await checkMaterialized(directory)
    assert.ok(failures.some((failure) => failure.startsWith('text_snapshot_unverified:')))
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

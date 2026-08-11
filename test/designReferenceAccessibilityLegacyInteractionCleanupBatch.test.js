import assert from 'node:assert/strict'
import { cp, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import test from 'node:test'

import { canonicalIdentityJson } from '../src/artifactIdentity.js'
import { checkMaterialized } from '../scripts/check-design-reference-accessibility-legacy-interaction-cleanup-batch-v1.mjs'
import {
  COMPANIONS,
  DEFAULT_DIRECTORY,
  VERDICT,
  materialize,
} from '../scripts/materialize-design-reference-accessibility-legacy-interaction-cleanup-batch-v1.mjs'

test('accessibility cleanup artifact closes bounded frontiers without device or timing overclaim', async () => {
  assert.deepEqual(await checkMaterialized(DEFAULT_DIRECTORY), [])
  const artifact = JSON.parse(await readFile(join(DEFAULT_DIRECTORY, 'complete.json'), 'utf8'))
  assert.equal(artifact.verdict, VERDICT)
  assert.equal(artifact.provenanceLineage.emilCorpus.independentAuthorityCount, 1)
  assert.equal(artifact.provenanceLineage.emilCorpus.installationIsAdoption, false)
  assert.deepEqual(Object.fromEntries(artifact.frontierDecisionLedger.frontiers.map((item) => [item.frontierId, item.decision])), {
    'FRONTIER-NONSEMANTIC-ACTIONS': 'fix',
    'FRONTIER-FOCUS-VISIBLE': 'fix',
    'FRONTIER-LEGACY-REDUCED-MOTION': 'fix',
    'FRONTIER-TOUCH-KEYBOARD-STATE-SEMANTICS': 'fix',
    'FRONTIER-TRANSITION-PROPERTY-COHERENCE': 'fix',
    'FRONTIER-SCHEDULER-SYNC-TOAST-GLASS': 'fix',
    'FRONTIER-LEGACY-HOVER-GATING': 'fix',
    'FRONTIER-LEAD-SHEET-DENSE-OVERLAYS': 'hold',
  })
  assert.match(artifact.nonGeneralization.async200ms, /not reused/)
  assert.match(artifact.nonGeneralization.pressPilot, /not promoted/)
})

test('cleanup materialization is byte-identical across directories and repeated at one target', async () => {
  const left = await mkdtemp(join(tmpdir(), 'softie-accessibility-cleanup-left-'))
  const right = await mkdtemp(join(tmpdir(), 'softie-accessibility-cleanup-right-'))
  try {
    await materialize(left)
    await materialize(right)
    const names = (await readdir(left)).sort()
    assert.deepEqual(names, (await readdir(right)).sort())
    for (const name of names) assert.deepEqual(await readFile(join(left, name)), await readFile(join(right, name)), name)
    const first = Object.fromEntries(await Promise.all(names.map(async (name) => [name, await readFile(join(left, name))])))
    await materialize(left)
    for (const name of names) assert.deepEqual(await readFile(join(left, name)), first[name], `same target: ${name}`)
    assert.deepEqual(await checkMaterialized(left), [])
    assert.deepEqual(await checkMaterialized(right), [])
  } finally {
    await rm(left, { recursive: true, force: true })
    await rm(right, { recursive: true, force: true })
  }
})

test('cleanup checker independently rejects every companion tamper', async () => {
  for (const companion of COMPANIONS) {
    const directory = await mkdtemp(join(tmpdir(), 'softie-accessibility-cleanup-companion-'))
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

test('cleanup checker rejects source, decision, device, blocker, and role-boundary tamper', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'softie-accessibility-cleanup-boundaries-'))
  try {
    await cp(DEFAULT_DIRECTORY, directory, { recursive: true })
    const path = join(directory, 'complete.json')
    const artifact = JSON.parse(await readFile(path, 'utf8'))
    artifact.sourceReferenceLedger.sources.find((item) => item.sourceRef?.kind === 'working_tree_text').sourceRef.byteSha256 = '0'.repeat(64)
    artifact.frontierDecisionLedger.frontiers.find((item) => item.frontierId === 'FRONTIER-LEAD-SHEET-DENSE-OVERLAYS').decision = 'fix'
    artifact.frontierDecisionLedger.frontiers[0].evidence.product_device_evidence = ['synthetic-pass']
    artifact.validationBlockerLedger.blockers[0].status = 'closed'
    artifact.nonGeneralization.async200ms = 'Use 200ms for every interaction.'
    await writeFile(path, canonicalIdentityJson(artifact))
    const failures = await checkMaterialized(directory)
    assert.ok(failures.some((failure) => failure.startsWith('text_snapshot_unverified:')))
    assert.ok(failures.includes('frontier_decisions'))
    assert.ok(failures.includes('device_evidence_inflation'))
    assert.ok(failures.includes('lead_sheet_hold_boundary'))
    assert.ok(failures.includes('async_200_boundary'))
    assert.ok(failures.includes('integrity_hash:complete.json'))
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

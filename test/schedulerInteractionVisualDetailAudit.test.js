import assert from 'node:assert/strict'
import { cp, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

import { canonicalIdentityJson } from '../src/artifactIdentity.js'
import { checkMaterialized } from '../scripts/check-scheduler-interaction-visual-detail-audit-v1.mjs'
import { COMPANIONS, DEFAULT_DIRECTORY, VERDICT, materialize } from '../scripts/materialize-scheduler-interaction-visual-detail-audit-v1.mjs'

test('Scheduler interaction visual audit covers seven flows with bounded decisions', async () => {
  assert.deepEqual(await checkMaterialized(DEFAULT_DIRECTORY), [])
  const artifact = JSON.parse(await readFile(join(DEFAULT_DIRECTORY, 'complete.json'), 'utf8'))
  assert.equal(artifact.verdict, VERDICT)
  assert.equal(artifact.flowAuditLedger.flows.length, 7)
  assert.equal(artifact.deviceValidationLedger.evidenceStatus, 'unverified')
  assert.deepEqual(Object.fromEntries(artifact.frontierDecisionLedger.frontiers.map((item) => [item.id, item.decision])), {
    'FRONTIER-ASYNC-STATE': 'fix', 'FRONTIER-DUPLICATE-ACTION': 'fix', 'FRONTIER-LIVE-FEEDBACK': 'fix', 'FRONTIER-TOGGLE-GROUP-SEMANTICS': 'fix', 'FRONTIER-DESTRUCTIVE-WORKLOG': 'fix', 'FRONTIER-GLASS-RAW-PRESS-MOTION': 'fix', 'FRONTIER-ACTION-NOW-HIERARCHY': 'pilot', 'FRONTIER-SAVE-DESTINATION': 'hold', 'FRONTIER-MODAL-FOCUS-LIFECYCLE': 'hold', 'FRONTIER-HOURLY-NATIVE-PICKER': 'hold', 'FRONTIER-EVENT-CARD-DENSITY': 'already_good', 'FRONTIER-NEW-SHEET-MOTION': 'reject',
  })
})

test('Scheduler audit materialization is byte-identical across targets and repeated writes', async () => {
  const left = await mkdtemp(join(tmpdir(), 'scheduler-detail-left-'))
  const right = await mkdtemp(join(tmpdir(), 'scheduler-detail-right-'))
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

test('Scheduler audit checker rejects every companion and integrity tamper', async () => {
  for (const companion of COMPANIONS) {
    const directory = await mkdtemp(join(tmpdir(), 'scheduler-detail-companion-'))
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

test('Scheduler audit checker rejects source, decision, device, validation, and verdict tamper', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'scheduler-detail-boundary-'))
  try {
    await cp(DEFAULT_DIRECTORY, directory, { recursive: true })
    const path = join(directory, 'complete.json')
    const artifact = JSON.parse(await readFile(path, 'utf8'))
    artifact.verdict = 'complete_without_evidence'
    artifact.sourceReferenceLedger.sources.find((item) => item.sourceRef?.kind === 'working_tree_text').sourceRef.byteSha256 = '0'.repeat(64)
    artifact.frontierDecisionLedger.frontiers.find((item) => item.id === 'FRONTIER-MODAL-FOCUS-LIFECYCLE').decision = 'fix'
    artifact.deviceValidationLedger.evidenceStatus = 'verified'
    artifact.validationBlockerLedger.validations.find((item) => item.id === 'VAL-FULL-SUITE-AFTER-REMEDIATION').status = 'pass'
    await writeFile(path, canonicalIdentityJson(artifact))
    const failures = await checkMaterialized(directory)
    assert.ok(failures.includes('verdict'))
    assert.ok(failures.some((failure) => failure.startsWith('working_ref_hash:')))
    assert.ok(failures.includes('frontier_decisions'))
    assert.ok(failures.includes('device_evidence_boundary'))
    assert.ok(failures.includes('full_rerun_boundary'))
    assert.ok(failures.includes('integrity_hash:complete.json'))
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

import assert from 'node:assert/strict'
import { cp, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import test from 'node:test'

import { canonicalIdentityJson } from '../src/artifactIdentity.js'
import { checkMaterialized } from '../scripts/check-design-reference-form-modal-async-state-touch-foundation-batch-v1.mjs'
import {
  COMPANIONS,
  DEFAULT_DIRECTORY,
  VERDICT,
  materialize,
} from '../scripts/materialize-design-reference-form-modal-async-state-touch-foundation-batch-v1.mjs'

test('foundation artifact preserves bounded decisions and source authority boundaries', async () => {
  assert.deepEqual(await checkMaterialized(DEFAULT_DIRECTORY), [])
  const artifact = JSON.parse(await readFile(join(DEFAULT_DIRECTORY, 'complete.json'), 'utf8'))
  assert.equal(artifact.verdict, VERDICT)
  assert.equal(artifact.provenanceLineage.emilSiblingCorpus.independentAuthorityCount, 1)
  assert.equal(artifact.provenanceLineage.emilSiblingCorpus.installationIsAdoption, false)
  assert.deepEqual(Object.fromEntries(artifact.frontierDecisionLedger.frontiers.map((item) => [item.frontierId, item.decision])), {
    'FRONTIER-FORM-NATIVE-LABELS': 'fix',
    'FRONTIER-MODAL-DIALOG-NAMES': 'fix',
    'FRONTIER-MODAL-FOCUS-LIFECYCLE': 'hold',
    'FRONTIER-BUSY-DUPLICATE-ACTIONS': 'fix',
    'FRONTIER-ASYNC-STATE-SEPARATION': 'fix',
    'FRONTIER-TOUCH-44': 'fix',
    'FRONTIER-VALIDATION-ASSOCIATION': 'fix',
    'FRONTIER-HISTORICAL-SOURCE-REF-DESCENDANT': 'fix',
    'FRONTIER-NEW-MOTION': 'reject',
    'FRONTIER-LEAD-SHEET-DESTRUCTIVE-ASYNC': 'hold',
    'FRONTIER-INACTIVE-FORTUNE-ROUTE': 'not_applicable',
    'FRONTIER-LAZY-ROUTE-ERROR-BOUNDARY': 'hold',
  })
  assert.match(artifact.nonGeneralization.modality, /not proof/)
  assert.match(artifact.nonGeneralization.runtime, /do not prove/)
})

test('foundation materialization is byte-identical across directories and repeated at one target', async () => {
  const left = await mkdtemp(join(tmpdir(), 'softie-form-foundation-left-'))
  const right = await mkdtemp(join(tmpdir(), 'softie-form-foundation-right-'))
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

test('foundation checker rejects companion, source, decision, validation, and integrity tamper', async () => {
  const companionDirectory = await mkdtemp(join(tmpdir(), 'softie-form-foundation-companion-'))
  try {
    await cp(DEFAULT_DIRECTORY, companionDirectory, { recursive: true })
    const companion = COMPANIONS[0]
    const companionPath = join(companionDirectory, companion)
    await writeFile(companionPath, `${await readFile(companionPath, 'utf8')}\n`)
    const failures = await checkMaterialized(companionDirectory)
    assert.ok(failures.includes(`companion_mismatch:${companion}`))
    assert.ok(failures.includes(`integrity_hash:${companion}`))
  } finally {
    await rm(companionDirectory, { recursive: true, force: true })
  }

  const boundaryDirectory = await mkdtemp(join(tmpdir(), 'softie-form-foundation-boundary-'))
  try {
    await cp(DEFAULT_DIRECTORY, boundaryDirectory, { recursive: true })
    const path = join(boundaryDirectory, 'complete.json')
    const artifact = JSON.parse(await readFile(path, 'utf8'))
    artifact.sourceReferenceLedger.sources.find((item) => item.sourceRef?.kind === 'working_tree_text').sourceRef.byteSha256 = '0'.repeat(64)
    artifact.frontierDecisionLedger.frontiers.find((item) => item.frontierId === 'FRONTIER-MODAL-FOCUS-LIFECYCLE').decision = 'fix'
    artifact.validationBlockerLedger.validations.find((item) => item.id === 'VAL-FULL-NON-PDF-AFTER-REMEDIATION').failureCount = 1
    await writeFile(path, canonicalIdentityJson(artifact))
    const failures = await checkMaterialized(boundaryDirectory)
    assert.ok(failures.some((failure) => failure.startsWith('reference_hash:')))
    assert.ok(failures.includes('frontier_decisions'))
    assert.ok(failures.includes('non_pdf_failure_count'))
    assert.ok(failures.includes('integrity_hash:complete.json'))
  } finally {
    await rm(boundaryDirectory, { recursive: true, force: true })
  }
})

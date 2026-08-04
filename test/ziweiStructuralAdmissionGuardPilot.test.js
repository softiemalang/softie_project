import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { buildStructuralAdmissionGuardPilot } from '../scripts/materialize-ziwei-structural-admission-guard-pilot-v0.mjs'
import { checkStructuralAdmissionGuardPilot } from '../scripts/check-ziwei-structural-admission-guard-pilot-v0.mjs'
const root = process.cwd()
const materializer = 'scripts/materialize-ziwei-structural-admission-guard-pilot-v0.mjs'
const checker = 'scripts/check-ziwei-structural-admission-guard-pilot-v0.mjs'
const negative = 'scripts/check-ziwei-structural-admission-guard-pilot-negative-v0.mjs'

test('pilot selects exactly the audit structural-guard candidates and preserves boundaries', async () => {
  const artifact = await buildStructuralAdmissionGuardPilot()
  assert.match(artifact.artifactIdentity.generation.baseHead, /^[0-9a-f]{40}$/)
  assert.deepEqual(artifact.records.map(x => x.admissionUnit.occurrence.occurrenceId), [
    'ziwei-occ-2260aba6ed2163e3', 'ziwei-occ-a09e10a5495186b8', 'ziwei-occ-a72bdf60ef809b58', 'ziwei-occ-e73f469c5e35e072',
  ])
  assert.deepEqual(artifact.resultDistribution, { limited_admission_possible: 4, additional_structural_restriction_required: 0, pilot_reblocked: 0 })
  for (const record of artifact.records) {
    assert.equal(record.admissionUnit.occurrence.rawText.isVerifiedFact, false)
    assert.equal(record.admissionUnit.guard.isStableClaim, false)
    assert.equal(record.admissionUnit.guard.sourceIdentity.status, 'unresolved_source_identity')
    assert.equal(record.admissionUnit.consumerContract.standaloneConsumptionAllowed, false)
    assert.equal(record.admissionUnit.consumerContract.rawTextOnlyPathAllowed, false)
  }
  assert.deepEqual(await checkStructuralAdmissionGuardPilot(artifact), [])
})

test('pilot materialization bytes and checker are deterministic', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'ziwei-guard-pilot-'))
  try {
    const a = join(dir, 'a.json'); const b = join(dir, 'b.json')
    assert.equal(spawnSync(process.execPath, [materializer, a], { cwd: root, encoding: 'utf8' }).status, 0)
    assert.equal(spawnSync(process.execPath, [materializer, b], { cwd: root, encoding: 'utf8' }).status, 0)
    assert.deepEqual(await readFile(a), await readFile(b))
    const checked = spawnSync(process.execPath, [checker, a], { cwd: root, encoding: 'utf8' })
    assert.equal(checked.status, 0, checked.stdout + checked.stderr)
  } finally { await rm(dir, { recursive: true, force: true }) }
})

test('negative fixture detects every pilot shortcut', () => {
  const result = spawnSync(process.execPath, [negative], { cwd: root, encoding: 'utf8' })
  assert.equal(result.status, 0, result.stdout + result.stderr)
  assert.equal(JSON.parse(result.stdout).findings.length, 12)
})

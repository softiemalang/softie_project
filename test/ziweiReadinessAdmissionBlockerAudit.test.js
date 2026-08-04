import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { buildAdmissionAudit, BASIS_HEAD } from '../scripts/materialize-ziwei-readiness-admission-blocker-audit-v0.mjs'
import { checkAdmissionAudit } from '../scripts/check-ziwei-readiness-admission-blocker-audit-v0.mjs'

const root = process.cwd()
const materializer = 'scripts/materialize-ziwei-readiness-admission-blocker-audit-v0.mjs'
const checker = 'scripts/check-ziwei-readiness-admission-blocker-audit-v0.mjs'
const negative = 'scripts/check-ziwei-readiness-admission-blocker-negative-v0.mjs'

test('admission audit classifies all 19 occurrences without claim promotion', async () => {
  const artifact = await buildAdmissionAudit()
  assert.equal(artifact.basisHead, BASIS_HEAD)
  assert.equal(artifact.occurrenceCount, 19)
  assert.deepEqual(artifact.blockerDistribution, {
    blocked_external_evidence_required: 4,
    blocked_claim_boundary_required: 3,
    blocked_raw_text_misread_risk: 0,
    eligible_occurrence_only_with_limits: 0,
    eligible_after_structural_guard: 4,
    excluded_currently: 8,
    unresolved: 0,
  })
  assert.equal(artifact.baseline.stableClaimBoundary, 0)
  assert.equal(artifact.categoryLists.externalEvidenceRequired.length, 15)
  assert.equal(artifact.categoryLists.structuralGuardPossible.length, 4)
  assert.equal(artifact.categoryLists.excludedCurrently.length, 8)
  assert.deepEqual(await checkAdmissionAudit(artifact), [])
})

test('materialization bytes and checker are deterministic', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'ziwei-admission-audit-'))
  try {
    const a = join(dir, 'a.json'); const b = join(dir, 'b.json')
    assert.equal(spawnSync(process.execPath, [materializer, a], { cwd: root, encoding: 'utf8' }).status, 0)
    assert.equal(spawnSync(process.execPath, [materializer, b], { cwd: root, encoding: 'utf8' }).status, 0)
    assert.deepEqual(await readFile(a), await readFile(b))
    const checked = spawnSync(process.execPath, [checker, a], { cwd: root, encoding: 'utf8' })
    assert.equal(checked.status, 0, checked.stdout + checked.stderr)
  } finally { await rm(dir, { recursive: true, force: true }) }
})

test('negative fixture detects every admission shortcut', () => {
  const result = spawnSync(process.execPath, [negative], { cwd: root, encoding: 'utf8' })
  assert.equal(result.status, 0, result.stdout + result.stderr)
  assert.equal(JSON.parse(result.stdout).findings.length, 9)
})

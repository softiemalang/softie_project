import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import {
  materializeSourceSelection,
  SOURCE_SELECTION_SCHEMA,
  SOURCE_SELECTION_MATERIALIZER_VERSION,
} from '../scripts/materialize-ziwei-clean-rule-corpus-source-selection-baseline-v0.mjs'
import { validateSourceAdmissionRecord } from '../src/ziwei/cleanRuleCorpusSourceSelection.js'
import { checkArtifactIdentity } from '../src/artifactIdentity.js'

const root = process.cwd()
const materializer = join(root, 'scripts/materialize-ziwei-clean-rule-corpus-source-selection-baseline-v0.mjs')
const checker = join(root, 'scripts/check-ziwei-clean-rule-corpus-source-selection-baseline-v0.mjs')
const negative = join(root, 'scripts/check-ziwei-clean-rule-corpus-source-selection-negative-v0.mjs')

test('clean source selection baseline materializes byte-identically and remains blocked', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'ziwei-clean-source-selection-'))
  try {
    const a = join(dir, 'a.json')
    const b = join(dir, 'b.json')
    assert.equal(spawnSync(process.execPath, [materializer, a], { cwd: root, encoding: 'utf8' }).status, 0)
    assert.equal(spawnSync(process.execPath, [materializer, b], { cwd: root, encoding: 'utf8' }).status, 0)
    assert.deepEqual(await readFile(a), await readFile(b))
    const checked = spawnSync(process.execPath, [checker, a], { cwd: root, encoding: 'utf8' })
    assert.equal(checked.status, 0, checked.stdout + checked.stderr)
    const result = JSON.parse(checked.stdout)
    assert.equal(result.pass, true)
    assert.equal(result.candidateCount, 6)
    assert.equal(result.independentCandidateCount, 4)
    assert.equal(result.selectionStatus, 'blocked')
    assert.deepEqual(result.failures, [])
  } finally { await rm(dir, { recursive: true, force: true }) }
})

test('admission contract rejects missing identity/location and all unsafe promotions', async () => {
  const artifact = await materializeSourceSelection()
  assert.equal(artifact.schemaVersion, SOURCE_SELECTION_SCHEMA)
  assert.deepEqual(checkArtifactIdentity(artifact, {
    root,
    artifactId: SOURCE_SELECTION_SCHEMA,
    materializerPath: 'scripts/materialize-ziwei-clean-rule-corpus-source-selection-baseline-v0.mjs',
    materializerVersion: SOURCE_SELECTION_MATERIALIZER_VERSION,
  }), [])
  const candidate = structuredClone(artifact.candidateInventory[0])
  candidate.verdict = 'admissible'
  candidate.sourceIdentity.edition = null
  candidate.locationIdentity.stable = false
  candidate.contentClasses.interpretive_prose.status = 'allowed'
  candidate.legacyOccurrenceLink = 'legacy-occ-001'
  assert.ok(validateSourceAdmissionRecord(candidate).some(error => error.includes('source_identity_not_closed')))
  assert.ok(validateSourceAdmissionRecord(candidate).some(error => error.includes('location_identity_not_closed')))
  assert.ok(validateSourceAdmissionRecord(candidate).some(error => error.includes('interpretive_prose')))
  assert.ok(validateSourceAdmissionRecord(candidate).some(error => error.includes('legacyOccurrenceLink')))
})

test('negative fixture detects every prohibited shortcut in the baseline', () => {
  const result = spawnSync(process.execPath, [negative], { cwd: root, encoding: 'utf8' })
  assert.equal(result.status, 0, result.stdout + result.stderr)
  const parsed = JSON.parse(result.stdout)
  assert.equal(parsed.pass, true)
  assert.equal(parsed.caseCount, 11)
  assert.equal(parsed.findings.length, 11)
})

import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { execFileSync, spawnSync } from 'node:child_process'
import {
  materializeSourceSelection,
  SOURCE_SELECTION_SCHEMA,
  SOURCE_SELECTION_MATERIALIZER_VERSION,
} from '../scripts/materialize-ziwei-clean-rule-corpus-source-selection-baseline-v0.mjs'
import { validateSourceAdmissionRecord } from '../src/ziwei/cleanRuleCorpusSourceSelection.js'
import { artifactPayloadSha256, checkArtifactIdentity } from '../src/artifactIdentity.js'

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
    assert.equal(result.basisHead, '2595e087eaea4adb667a0280a677476aebcb80df')
    assert.equal(result.observedHead, '3bbae92d81fa19107167b288c666f9dc19e2fdf3')
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

test('artifact identity ignores diagnostic checkout-head drift but rejects identity mutations', async () => {
  const artifact = await materializeSourceSelection()
  const diagnosticDrift = structuredClone(artifact)
  diagnosticDrift.observedHead = '2595e087eaea4adb667a0280a677476aebcb80df'
  diagnosticDrift.artifactIdentity.artifactPayloadSha256 = artifactPayloadSha256(diagnosticDrift)
  assert.deepEqual(checkArtifactIdentity(diagnosticDrift, {
    root,
    artifactId: SOURCE_SELECTION_SCHEMA,
    materializerPath: 'scripts/materialize-ziwei-clean-rule-corpus-source-selection-baseline-v0.mjs',
    materializerVersion: SOURCE_SELECTION_MATERIALIZER_VERSION,
  }), [])

  const inputMutation = structuredClone(artifact)
  inputMutation.artifactIdentity.inputs[0].byteSha256 = '0'.repeat(64)
  assert.ok(checkArtifactIdentity(inputMutation, {
    root,
    artifactId: SOURCE_SELECTION_SCHEMA,
    materializerPath: 'scripts/materialize-ziwei-clean-rule-corpus-source-selection-baseline-v0.mjs',
    materializerVersion: SOURCE_SELECTION_MATERIALIZER_VERSION,
  }).some(error => error.includes('input byte identity mismatch')))

  const versionMutation = structuredClone(artifact)
  versionMutation.artifactIdentity.materializer.version = '0.1.0'
  assert.ok(checkArtifactIdentity(versionMutation, {
    root,
    artifactId: SOURCE_SELECTION_SCHEMA,
    materializerPath: 'scripts/materialize-ziwei-clean-rule-corpus-source-selection-baseline-v0.mjs',
    materializerVersion: SOURCE_SELECTION_MATERIALIZER_VERSION,
  }).some(error => error.includes('materializer identity mismatch')))

  const selfReference = structuredClone(artifact)
  selfReference.artifactIdentity.generation.includedCommit = selfReference.artifactIdentity.generation.baseHead
  assert.ok(checkArtifactIdentity(selfReference, {
    root,
    artifactId: SOURCE_SELECTION_SCHEMA,
    materializerPath: 'scripts/materialize-ziwei-clean-rule-corpus-source-selection-baseline-v0.mjs',
    materializerVersion: SOURCE_SELECTION_MATERIALIZER_VERSION,
  }).some(error => error.includes('included commit must remain unknown')))
})

test('identity migration preserves source-selection meaning from the historical artifact', async () => {
  const before = JSON.parse(execFileSync('git', ['show', 'HEAD:artifacts/ziwei-clean-rule-corpus-source-selection-baseline-v0/complete.json'], { cwd: root, encoding: 'utf8' }))
  const after = await materializeSourceSelection()
  const meaning = value => ({
    verdictToken: value.verdictToken,
    candidateInventory: value.candidateInventory,
    candidateCount: value.candidateCount,
    independentCandidateCount: value.independentCandidateCount,
    independentCandidateGroupKeys: value.independentCandidateGroupKeys,
    verdictDistribution: value.verdictDistribution,
    candidateValidation: value.candidateValidation,
    contentClassPolicy: value.contentClassPolicy,
    selectionDecision: value.selectionDecision,
    downstreamBoundaries: value.downstreamBoundaries,
    lineageAccounting: value.lineageAccounting,
  })
  assert.deepEqual(JSON.parse(JSON.stringify(meaning(after))), meaning(before))
  assert.equal(before.artifactIdentity.generation.baseHead, '2595e087eaea4adb667a0280a677476aebcb80df')
  assert.equal(after.artifactIdentity.generation.baseHead, '3bbae92d81fa19107167b288c666f9dc19e2fdf3')
  assert.equal(after.artifactIdentity.generation.includedCommit, null)
})

test('negative fixture detects every prohibited shortcut in the baseline', () => {
  const result = spawnSync(process.execPath, [negative], { cwd: root, encoding: 'utf8' })
  assert.equal(result.status, 0, result.stdout + result.stderr)
  const parsed = JSON.parse(result.stdout)
  assert.equal(parsed.pass, true)
  assert.equal(parsed.caseCount, 20)
  assert.equal(parsed.findings.length, 20)
})

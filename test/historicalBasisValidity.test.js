import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'

import {
  HISTORICAL_BASIS_VALIDITY,
  artifactPayloadSha256,
  classifyHistoricalBasisValidity,
  fileByteIdentity,
  fileByteSha256AtGitCommit,
} from '../src/artifactIdentity.js'
import {
  buildBundle,
  MATERIALIZER_PATH,
  MATERIALIZER_VERSION,
  ROOT,
  SCHEMA,
} from '../scripts/materialize-ziwei-p0-palace-branch-slot-composition-v2.mjs'
import { buildBundle as buildYouyiBundle, ROOT as YOUYI_ROOT } from '../scripts/materialize-ziwei-p0-youyi-lu-cadal-01025514-semantic-witness-v1.mjs'

const root = process.cwd()
const inventory = JSON.parse(readFileSync('artifacts/tri-system-readiness-v1/inventory.json', 'utf8'))
const ziweiArtifact = JSON.parse(readFileSync('artifacts/ziwei-p0-palace-branch-slot-composition-v2/complete.json', 'utf8'))
const checkerIdentity = {
  path: 'scripts/check-tri-system-readiness.mjs',
  byteSha256: fileByteIdentity(root, 'scripts/check-tri-system-readiness.mjs').byteSha256,
}
const options = {
  root,
  artifactId: 'tri-system-readiness-v1',
  materializerPath: 'scripts/materialize-tri-system-readiness.mjs',
  materializerVersion: '1.1.0',
  integrity: true,
  checkerIdentity,
}

test('historical basis classifier distinguishes current compatibility from historical replay validity', () => {
  const current = classifyHistoricalBasisValidity(inventory, options)
  assert.equal(current.status, HISTORICAL_BASIS_VALIDITY.CURRENT_COMPATIBLE)
  assert.equal(current.promotesCurrentArtifact, false)
  assert.equal(current.promotesReadiness, false)
  assert.equal(current.promotesSemanticAuthority, false)
  assert.equal(current.promotesActivation, false)

  const historicalOnly = structuredClone(inventory)
  const changedSinceBasis = historicalOnly.artifactIdentity.inputs.find(item => item.path === 'docs/tri-system-readiness-assessment-v1.md')
  changedSinceBasis.byteSha256 = fileByteSha256AtGitCommit(root, inventory.artifactIdentity.generation.baseHead, changedSinceBasis.path)
  historicalOnly.artifactIdentity.artifactPayloadSha256 = artifactPayloadSha256(historicalOnly)
  const historical = classifyHistoricalBasisValidity(historicalOnly, { ...options, historicalReplay: true })
  assert.equal(historical.status, HISTORICAL_BASIS_VALIDITY.HISTORICAL_VALID)
  assert.equal(historical.allInputsCurrent, false)
  assert.equal(historical.allInputsHistoricallyTraceable, true)
  assert.equal(historical.promotesCurrentArtifact, false)
  assert.equal(historical.promotesReadiness, false)
  assert.equal(historical.promotesSemanticAuthority, false)
  assert.equal(historical.promotesActivation, false)
})

test('missing verifier identity requires replay without calling a sound artifact corrupt', () => {
  const result = classifyHistoricalBasisValidity(inventory, { ...options, checkerIdentity: null })
  assert.equal(result.status, HISTORICAL_BASIS_VALIDITY.REPLAY_REQUIRED)
  assert.notEqual(result.status, HISTORICAL_BASIS_VALIDITY.INVALID)
  assert.deepEqual(result.errors, [])
  assert.ok(result.reasons.includes('checker_identity:verification_required'))
})

test('relevant checker identity drift requires replay without changing artifact integrity status', () => {
  const result = classifyHistoricalBasisValidity(inventory, {
    ...options,
    checkerIdentity: { ...checkerIdentity, byteSha256: '0'.repeat(64) },
  })
  assert.equal(result.status, HISTORICAL_BASIS_VALIDITY.REPLAY_REQUIRED)
  assert.deepEqual(result.errors, [])
  assert.ok(result.reasons.includes('checker_identity:mismatch'))
})

test('latest main does not guess compatibility when the historical materializer bytes are unproven', () => {
  const result = classifyHistoricalBasisValidity(ziweiArtifact, {
    root,
    artifactId: SCHEMA,
    materializerPath: MATERIALIZER_PATH,
    materializerVersion: MATERIALIZER_VERSION,
    integrity: true,
    checkerIdentity: {
      path: 'scripts/check-ziwei-p0-palace-branch-slot-composition-v2.mjs',
      byteSha256: fileByteIdentity(root, 'scripts/check-ziwei-p0-palace-branch-slot-composition-v2.mjs').byteSha256,
    },
  })
  assert.equal(result.status, HISTORICAL_BASIS_VALIDITY.REPLAY_REQUIRED)
  assert.deepEqual(result.errors, [])
  assert.ok(result.reasons.includes(`input_identity:${MATERIALIZER_PATH}`))
})

test('payload, sidecar, and basis mutations are invalid; input drift remains replay-required', () => {
  const payloadMutation = structuredClone(inventory)
  payloadMutation.artifactIdentity.artifactPayloadSha256 = '0'.repeat(64)
  assert.equal(classifyHistoricalBasisValidity(payloadMutation, options).status, HISTORICAL_BASIS_VALIDITY.INVALID)

  assert.equal(classifyHistoricalBasisValidity(inventory, { ...options, integrity: false }).status, HISTORICAL_BASIS_VALIDITY.INVALID)

  const basisMutation = structuredClone(inventory)
  basisMutation.artifactIdentity.generation.baseHead = '0'.repeat(40)
  basisMutation.artifactIdentity.artifactPayloadSha256 = artifactPayloadSha256(basisMutation)
  assert.equal(classifyHistoricalBasisValidity(basisMutation, options).status, HISTORICAL_BASIS_VALIDITY.INVALID)

  const inputMutation = structuredClone(inventory)
  inputMutation.artifactIdentity.inputs[0].byteSha256 = '0'.repeat(64)
  inputMutation.artifactIdentity.artifactPayloadSha256 = artifactPayloadSha256(inputMutation)
  const inputResult = classifyHistoricalBasisValidity(inputMutation, options)
  assert.equal(inputResult.status, HISTORICAL_BASIS_VALIDITY.REPLAY_REQUIRED)
  assert.ok(inputResult.reasons.some(error => error.startsWith('input_identity:')))
})

test('unrelated worktree state does not become an artifact input or promote historical evidence', () => {
  const result = classifyHistoricalBasisValidity(inventory, options)
  assert.equal(result.status, HISTORICAL_BASIS_VALIDITY.CURRENT_COMPATIBLE)
  assert.equal(result.promotesCurrentArtifact, false)
  assert.equal(result.promotesReadiness, false)
  assert.equal(result.promotesSemanticAuthority, false)
  assert.equal(result.promotesActivation, false)
})

test('exact materialization remains strict while historical reference mode is explicit', () => {
  assert.throws(() => buildBundle(ROOT), /composition_basis_must_be_current_head/)
  assert.doesNotThrow(() => buildBundle(ROOT, { mode: 'historical_reference' }))
  assert.throws(() => buildYouyiBundle(YOUYI_ROOT), /semantic_witness_basis_must_be_current_head/)
  assert.doesNotThrow(() => buildYouyiBundle(YOUYI_ROOT, { mode: 'historical_reference' }))
})

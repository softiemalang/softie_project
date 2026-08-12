import assert from 'node:assert/strict'
import test from 'node:test'
import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'

import { checkArtifact } from '../scripts/check-saju-source-derived-evidence-v1.mjs'
import { ROOT, buildArtifact, canonicalJson } from '../scripts/materialize-saju-source-derived-evidence-v1.mjs'
import {
  SAJU_LEGACY_ROOT_ASSET_PATH,
  SAJU_SOURCE_DERIVED_ASSET_IDENTITY,
  SAJU_SOURCE_DERIVED_ASSET_PATH,
} from '../src/interpretationPrep/sajuSourceDerivedEvidenceAsset.js'

test('Saju source-derived asset has explicit provenance and byte-identity reproduction', async () => {
  const artifact = await buildArtifact({ root: ROOT })
  assert.equal(artifact.sourceDerivedAsset.path, SAJU_SOURCE_DERIVED_ASSET_PATH)
  assert.equal(artifact.sourceDerivedAsset.sha256, SAJU_SOURCE_DERIVED_ASSET_IDENTITY.sha256)
  assert.equal(artifact.provenance.sourcePdfPage, 2)
  assert.equal(artifact.provenance.rerenderByteIdentity, true)
  assert.equal(existsSync(`${ROOT}/${SAJU_LEGACY_ROOT_ASSET_PATH}`), false)
  assert.deepEqual((await checkArtifact({ root: ROOT })).failures, [])
})

test('Saju source-derived asset materialization is deterministic', async () => {
  const first = await buildArtifact({ root: ROOT })
  const second = await buildArtifact({ root: ROOT })
  assert.equal(canonicalJson(first), canonicalJson(second))
})

test('Saju source-derived asset negative checker rejects path, provenance, and promotion mutations', () => {
  const output = execFileSync(
    process.execPath,
    ['scripts/check-saju-source-derived-evidence-v1-negative-v0.mjs'],
    { cwd: ROOT, encoding: 'utf8' },
  )
  const result = JSON.parse(output)
  assert.equal(result.mutationCount, 6)
  assert.equal(result.allRejected, true)
})

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import test from 'node:test'

import {
  checkHistoricalArtifact,
  verifyIntegritySidecar,
} from '../scripts/check-saju-five-classics-research-continuation-v1-historical.mjs'

const artifactPath = 'artifacts/saju-five-classics-research-continuation-v1/complete.json'
const sidecarPath = `${artifactPath}.integrity.json`
const checkerPath = 'scripts/check-saju-five-classics-research-continuation-v1-historical.mjs'

test('research continuation replays the stored snapshot without current-head regeneration', async () => {
  const beforeArtifact = readFileSync(artifactPath)
  const beforeSidecar = readFileSync(sidecarPath)
  const candidate = JSON.parse(beforeArtifact.toString('utf8'))
  const result = await checkHistoricalArtifact(candidate)

  assert.deepEqual(result.errors, [])
  assert.equal(result.historicalReplay, true)
  assert.equal(result.artifactSidecar.status, 'pass')
  assert.equal(result.predecessorSidecars.length, 3)
  assert.ok(result.predecessorSidecars.every(sidecar => sidecar.status === 'pass'))
  assert.equal(candidate.readiness.availableForInterpretation, false)
  assert.equal(candidate.readiness.productionActivation, 'blocked')
  assert.deepEqual(candidate.readiness.promotionReadyClaimIds, [])
  assert.deepEqual(readFileSync(artifactPath), beforeArtifact)
  assert.deepEqual(readFileSync(sidecarPath), beforeSidecar)
})

test('historical verifier rejects a predecessor sidecar hash mutation', async () => {
  const predecessorPath = 'artifacts/saju-five-classics-claim-adjudication-v0/complete.json'
  const bytes = await readFile(predecessorPath)
  const integrity = JSON.parse(await readFile(`${predecessorPath}.integrity.json`, 'utf8'))
  integrity.artifactByteSha256 = '0'.repeat(64)

  assert.ok(verifyIntegritySidecar({ artifactPath: predecessorPath, bytes, integrity })
    .includes(`integrity_artifact_byte_sha256:${predecessorPath}`))
})

test('historical checker CLI reports a historical replay and no PDF access', () => {
  const result = spawnSync(process.execPath, [checkerPath], {
    cwd: process.cwd(),
    encoding: 'utf8',
  })
  assert.equal(result.status, 0, result.stdout + result.stderr)
  const report = JSON.parse(result.stdout)
  assert.equal(report.status, 'pass')
  assert.equal(report.mode, 'historical')
  assert.equal(report.historicalSnapshotMode, true)
  assert.equal(report.historicalReplay, true)
  assert.equal(report.externalPdfRead, false)
  assert.equal(report.artifactSidecar.status, 'pass')
  assert.ok(report.predecessorSidecars.every(sidecar => sidecar.status === 'pass'))
})

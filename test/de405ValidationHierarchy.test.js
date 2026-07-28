import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { validateHierarchy, exitCodeForResult } from '../scripts/validate-de405-hierarchy.mjs'

const manifestTemplate = JSON.parse(fs.readFileSync('test/fixtures/astrology/de405/manifest.json', 'utf8'))
const baseline = JSON.parse(fs.readFileSync('test/fixtures/astrology/de405/baseline.json', 'utf8'))
const hash = (char) => char.repeat(64)

function validManifest() {
  const manifest = structuredClone(manifestTemplate)
  manifest.artifacts.jplDe405Binary = { sha256: hash('a'), sizeBytes: 55900416 }
  manifest.timestamps.sha256 = hash('b')
  manifest.officialReader.o0OutputSha256 = hash('c')
  manifest.officialReader.o2OutputSha256 = hash('c')
  manifest.artifactIntegrityEvidence.jplDe405Binary = { sha256: hash('a'), sizeBytes: 55900416 }
  manifest.artifactIntegrityEvidence.timestamps = { sha256: hash('b'), sampleCount: 36525 }
  manifest.officialReaderEvidence = { ...manifest.officialReader }
  manifest.productionEquivalence = {
    positionComponentBitIdentical: true,
    velocityComponentBitIdentical: true,
    statusMismatch: 0,
    sampleCount: 36525,
    timestampSha256: hash('b'),
    coverage: { startJd: 2433282, endJd: 2469806 },
  }
  manifest.crossReferenceStructure = {
    artifactSha256: manifest.artifacts.naifDe405Spk.sha256,
    timestampSha256: hash('b'),
    sampleCount: 36525,
    statusMismatch: 0,
    start: { sampleCount: 12175 }, middle: { sampleCount: 12175 }, end: { sampleCount: 12175 },
    fittedDriftKmPerDay: baseline.fittedDriftKmPerDay,
    adjacentChange: { detected: false },
    segmentBoundaryDiscontinuityDetected: false,
    worstEpochJd: baseline.worstEpochJd,
    worstPositionResidualKm: baseline.worstPositionResidualKm,
    baselineSchemaVersion: 1,
  }
  return manifest
}

test('DE405 normal evidence passes A/B/C/D structure and leaves numeric policy calibratable', () => {
  const result = validateHierarchy(validManifest(), baseline)
  assert.equal(result.provenance.status, 'needs_verification')
  for (const gate of ['artifactIntegrity', 'officialReaderValidation', 'productionEquivalence', 'crossReferenceStructure']) assert.equal(result[gate].status, 'passed')
  assert.equal(result.crossReferenceNumericPolicy.status, 'needs_calibration')
  assert.equal(exitCodeForResult(result), 1)
})

test('manifest schema version mismatch fails closed', () => {
  const manifest = validManifest(); manifest.schemaVersion = 2
  const result = validateHierarchy(manifest, baseline)
  assert.equal(result.artifactIntegrity.status, 'failed')
  assert.equal(exitCodeForResult(result), 1)
})

test('artifact, timestamp, and sample-count mutations fail Gate A', () => {
  for (const mutate of [
    (m) => { m.artifactIntegrityEvidence.naifDe405Spk.sha256 = hash('d') },
    (m) => { m.artifactIntegrityEvidence.timestamps.sha256 = hash('d') },
    (m) => { m.artifactIntegrityEvidence.fixtureSampleCount += 1 },
  ]) {
    const manifest = validManifest(); mutate(manifest)
    assert.equal(validateHierarchy(manifest, baseline).artifactIntegrity.status, 'failed')
  }
})

test('official reader failure count and O0/O2 hash mutations fail Gate B', () => {
  const failure = validManifest(); failure.officialReaderEvidence.failureCount = 1
  assert.equal(validateHierarchy(failure, baseline).officialReaderValidation.status, 'failed')
  const hashes = validManifest(); hashes.officialReaderEvidence.o2OutputSha256 = hash('e')
  assert.equal(validateHierarchy(hashes, baseline).officialReaderValidation.status, 'failed')
})

test('Gate C requires bit identity, zero status mismatch, and matching identity fields', () => {
  for (const mutate of [
    (m) => { m.productionEquivalence.positionComponentBitIdentical = false },
    (m) => { m.productionEquivalence.velocityComponentBitIdentical = false },
    (m) => { m.productionEquivalence.statusMismatch = 1 },
    (m) => { m.productionEquivalence.timestampSha256 = hash('e') },
  ]) {
    const manifest = validManifest(); mutate(manifest)
    assert.equal(validateHierarchy(manifest, baseline).productionEquivalence.status, 'failed')
  }
})

test('Gate D structure fails on status mismatch or missing required statistics', () => {
  const status = validManifest(); status.crossReferenceStructure.statusMismatch = 1
  assert.equal(validateHierarchy(status, baseline).crossReferenceStructure.status, 'failed')
  const missing = validManifest(); delete missing.crossReferenceStructure.worstPositionResidualKm
  assert.equal(validateHierarchy(missing, baseline).crossReferenceStructure.status, 'failed')
  const baselineMismatch = structuredClone(baseline); baselineMismatch.statusMismatch = 1
  assert.equal(validateHierarchy(validManifest(), baselineMismatch).crossReferenceStructure.status, 'failed')
})

test('Gate D shape invariants reject malformed summary metrics', () => {
  const ordering = structuredClone(baseline); ordering.positionNormKm.p99 = ordering.positionNormKm.p95 - 1
  assert.equal(validateHierarchy(validManifest(), ordering).crossReferenceStructure.status, 'failed')
  const nonFinite = structuredClone(baseline); nonFinite.velocityNormKmPerSec.max = null
  assert.equal(validateHierarchy(validManifest(), nonFinite).crossReferenceStructure.status, 'failed')
})

test('runner does not modify fixtures and missing numeric envelope remains calibratable', () => {
  const manifestPath = 'test/fixtures/astrology/de405/manifest.json'
  const baselinePath = 'test/fixtures/astrology/de405/baseline.json'
  const before = [fs.readFileSync(manifestPath), fs.readFileSync(baselinePath)]
  const run = spawnSync(process.execPath, ['scripts/validate-de405-hierarchy.mjs', '--json'], { encoding: 'utf8' })
  const result = JSON.parse(run.stdout)
  assert.equal(result.crossReferenceNumericPolicy.status, 'needs_calibration')
  assert.equal(run.status, 1, 'the committed evidence manifest must not be accepted as verified')
  assert.deepEqual(fs.readFileSync(manifestPath), before[0])
  assert.deepEqual(fs.readFileSync(baselinePath), before[1])
})

test('CLI accepts explicit manifest and baseline paths', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'de405-validation-'))
  const manifestPath = path.join(tempDir, 'manifest.json')
  const baselinePath = path.join(tempDir, 'baseline.json')
  fs.writeFileSync(manifestPath, JSON.stringify(validManifest()))
  fs.writeFileSync(baselinePath, JSON.stringify(baseline))
  const run = spawnSync(process.execPath, ['scripts/validate-de405-hierarchy.mjs', '--manifest', manifestPath, '--baseline', baselinePath, '--json'], { encoding: 'utf8' })
  assert.equal(run.status, 1, run.stderr)
  assert.equal(JSON.parse(run.stdout).crossReferenceNumericPolicy.status, 'needs_calibration')
})

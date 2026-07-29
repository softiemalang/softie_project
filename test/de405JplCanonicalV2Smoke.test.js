import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { validateBytes } from '../scripts/lib/de405-canonical-v2-io.mjs'
import { sha256 } from '../scripts/lib/de405-canonical-v2-hash.mjs'

const root = resolve('.')
const fakeRunner = join(root, 'test/helpers/fake-de405-jpl-reader.mjs')
const generator = join(root, 'scripts/generate-de405-jpl-canonical-v2.mjs')
const validator = join(root, 'scripts/validate-de405-jpl-canonical-v2.mjs')

async function createSmokeFixture() {
  const dir = await mkdtemp(join(tmpdir(), 'de405-jpl-smoke-test-'))
  const manifestFile = join(dir, 'smoke-manifest.json')
  const runnerHash = await sha256(fakeRunner)

  const manifest = {
    manifestSchemaVersion: 2,
    canonicalId: 'de405-canonical-v2-jpl-full-range-smoke',
    materializationProfile: 'jpl-full-range-smoke',
    sourceRole: 'primary_oracle',
    coverageRole: 'full_service_range',
    canonicalEligible: false,
    canonical: false,
    synthetic: true,
    status: 'smoke_draft',
    provenanceStatus: 'synthetic_contract_evidence',
    contractDocument: 'docs/astrology/de405-jpl-official-reader-contract.md',
    primarySource: {
      name: 'lnxp1600p2200.405',
      sizeBytes: 55900416,
      sha256: '7ec77287b6fddd3d7adabb87709ee5e926e3d1123fbae5d1485a42913cf175e7'
    },
    upstreamReferenceSource: {
      name: 'testeph.f',
      sha256: '18f32f073c1a345850d9deebc8b53b06c83a386c066b566f65001b51adeb7120'
    },
    sourceFiles: {
      jplBinary: {
        sizeBytes: 55900416,
        sha256: '7ec77287b6fddd3d7adabb87709ee5e926e3d1123fbae5d1485a42913cf175e7'
      }
    },
    reader: {
      name: 'JPL official testeph.f reader',
      version: 'March 2013',
      targetContractStatus: 'confirmed'
    },
    runner: {
      binarySha256: runnerHash
    },
    requiredKernels: [],
    timeAxis: 'CSPICE_ET',
    targets: [
      { targetId: 1, target: 'MERCURY BARYCENTER', targetType: 'barycenter' },
      { targetId: 2, target: 'VENUS BARYCENTER', targetType: 'barycenter' },
      { targetId: 4, target: 'MARS BARYCENTER', targetType: 'barycenter' },
      { targetId: 5, target: 'JUPITER BARYCENTER', targetType: 'barycenter' },
      { targetId: 6, target: 'SATURN BARYCENTER', targetType: 'barycenter' },
      { targetId: 7, target: 'URANUS BARYCENTER', targetType: 'barycenter' },
      { targetId: 8, target: 'NEPTUNE BARYCENTER', targetType: 'barycenter' },
      { targetId: 9, target: 'PLUTO BARYCENTER', targetType: 'barycenter' },
      { targetId: 10, target: 'SUN', targetType: 'body' },
      { targetId: 301, target: 'MOON', targetType: 'body' }
    ],
    observer: 'EARTH',
    frame: 'J2000',
    aberrationCorrection: 'NONE',
    units: { position: 'km', velocity: 'km/s' },
    serialization: '%.16e',
    jsonlSchemaVersion: 'de405-canonical-v2',
    ordering: 'etSeconds numeric ascending, targetId ascending',
    determinism: { samePlatformByteIdentity: 'required' },
    output: { file: 'de405-canonical-v2-jpl-smoke.jsonl', sizeBytes: 0, rowCount: 10, sha256: '0'.repeat(64), generatedByRunnerSha256: runnerHash },
    generationCommand: 'node scripts/generate-de405-jpl-canonical-v2.mjs',
    createdByCommit: 'fbe50c9',
    evidenceType: 'full_range_smoke',
    sourceCoverageStartEt: '-1.2624811200000000e+10',
    sourceCoverageEndEt: '6.3472464000000000e+09',
    coverageStartReadable: '1599-12-09T00:00:00 TDB',
    coverageEndReadable: '2201-02-20T00:00:00 TDB',
    requestedStartEt: '-3.1557168000000000e+09',
    requestedEndExclusiveEt: '-3.1557168000000000e+09',
    coverageVerified: true,
    coverageTool: 'CONST',
    coverageToolVersion: 'testeph.f',
    coverageCommand: 'CONST',
    coverageOutputSha256: 'a'.repeat(64),
    fallbackAllowed: false,
    testOnly: true,
    smoke: {
      startEt: '-3.1557168000000000e+09',
      stepSeconds: 864000,
      timestampCount: 1,
      targetCount: 10,
      expectedRowCount: 10
    }
  }

  await writeFile(manifestFile, JSON.stringify(manifest, null, 2) + '\n')
  return { dir, manifestFile }
}

async function createFullGridFixture() {
  const dir = await mkdtemp(join(tmpdir(), 'de405-jpl-grid-test-'))
  const manifestFile = join(dir, 'full-manifest.json')
  const runnerHash = await sha256(fakeRunner)

  const manifest = {
    manifestSchemaVersion: 2,
    canonicalId: 'de405-canonical-v2-jpl-full-range-regular-grid',
    materializationProfile: 'jpl-full-range-regular-grid',
    sourceRole: 'primary_oracle',
    coverageRole: 'full_service_range',
    canonicalEligible: true,
    canonical: true,
    synthetic: true,
    status: 'draft',
    provenanceStatus: 'synthetic_contract_evidence',
    contractDocument: 'docs/astrology/de405-jpl-official-reader-contract.md',
    primarySource: {
      name: 'lnxp1600p2200.405',
      sizeBytes: 55900416,
      sha256: '7ec77287b6fddd3d7adabb87709ee5e926e3d1123fbae5d1485a42913cf175e7'
    },
    upstreamReferenceSource: {
      name: 'testeph.f',
      sha256: '18f32f073c1a345850d9deebc8b53b06c83a386c066b566f65001b51adeb7120'
    },
    sourceFiles: {
      jplBinary: {
        sizeBytes: 55900416,
        sha256: '7ec77287b6fddd3d7adabb87709ee5e926e3d1123fbae5d1485a42913cf175e7'
      }
    },
    reader: {
      name: 'JPL official testeph.f reader',
      version: 'March 2013',
      targetContractStatus: 'confirmed'
    },
    runner: {
      binarySha256: runnerHash
    },
    requiredKernels: [],
    timeAxis: 'CSPICE_ET',
    targets: [
      { targetId: 1, target: 'MERCURY BARYCENTER', targetType: 'barycenter' },
      { targetId: 2, target: 'VENUS BARYCENTER', targetType: 'barycenter' },
      { targetId: 4, target: 'MARS BARYCENTER', targetType: 'barycenter' },
      { targetId: 5, target: 'JUPITER BARYCENTER', targetType: 'barycenter' },
      { targetId: 6, target: 'SATURN BARYCENTER', targetType: 'barycenter' },
      { targetId: 7, target: 'URANUS BARYCENTER', targetType: 'barycenter' },
      { targetId: 8, target: 'NEPTUNE BARYCENTER', targetType: 'barycenter' },
      { targetId: 9, target: 'PLUTO BARYCENTER', targetType: 'barycenter' },
      { targetId: 10, target: 'SUN', targetType: 'body' },
      { targetId: 301, target: 'MOON', targetType: 'body' }
    ],
    observer: 'EARTH',
    frame: 'J2000',
    aberrationCorrection: 'NONE',
    units: { position: 'km', velocity: 'km/s' },
    serialization: '%.16e',
    jsonlSchemaVersion: 'de405-canonical-v2',
    ordering: 'etSeconds numeric ascending, targetId ascending',
    determinism: { samePlatformByteIdentity: 'required' },
    output: { file: 'de405-canonical-v2-jpl-regular-grid.jsonl', sizeBytes: 0, rowCount: 73420, sha256: '0'.repeat(64), generatedByRunnerSha256: runnerHash },
    generationCommand: 'node scripts/generate-de405-jpl-canonical-v2.mjs',
    createdByCommit: 'fbe50c9',
    evidenceType: 'canonical',
    sourceCoverageStartEt: '-1.2624811200000000e+10',
    sourceCoverageEndEt: '6.3472464000000000e+09',
    coverageStartReadable: '1599-12-09T00:00:00 TDB',
    coverageEndReadable: '2201-02-20T00:00:00 TDB',
    requestedStartEt: '-3.1557168000000000e+09',
    requestedEndExclusiveEt: '3.1872528000000000e+09',
    coverageVerified: true,
    coverageTool: 'CONST',
    coverageToolVersion: 'testeph.f',
    coverageCommand: 'CONST',
    coverageOutputSha256: 'b'.repeat(64),
    fallbackAllowed: false,
    testOnly: false,
    regularGrid: {
      regularGridStartEt: '-3.1557168000000000e+09',
      regularGridEndExclusiveEt: '3.1872528000000000e+09',
      regularGridStepSeconds: 864000,
      regularGridTimestampCount: 7342,
      targetCount: 10,
      expectedRowCount: 73420
    }
  }

  await writeFile(manifestFile, JSON.stringify(manifest, null, 2) + '\n')
  return { dir, manifestFile }
}

function run(command, args, env = {}) {
  return spawnSync(process.execPath, [command, ...args], { cwd: root, encoding: 'utf8', env: { ...process.env, ...env } })
}

test('JPL smoke generation yields 10 rows and passes validator', async () => {
  const ctx = await createSmokeFixture()
  try {
    const outputDir = join(ctx.dir, 'run-1')
    const result = run(generator, ['--manifest', ctx.manifestFile, '--runner', fakeRunner, '--output-dir', outputDir])
    assert.equal(result.status, 0, result.stderr)

    const outputJsonl = join(outputDir, 'de405-canonical-v2-jpl-smoke.jsonl')
    const generatedManifest = join(outputDir, 'manifest.json')

    const validation = run(validator, ['--manifest', generatedManifest, '--input', outputJsonl])
    assert.equal(validation.status, 0, validation.stderr)
  } finally {
    await rm(ctx.dir, { recursive: true, force: true })
  }
})

test('Two JPL smoke generations are byte-identical', async () => {
  const ctx = await createSmokeFixture()
  try {
    const run1 = join(ctx.dir, 'run-1')
    const run2 = join(ctx.dir, 'run-2')
    run(generator, ['--manifest', ctx.manifestFile, '--runner', fakeRunner, '--output-dir', run1])
    run(generator, ['--manifest', ctx.manifestFile, '--runner', fakeRunner, '--output-dir', run2])

    const file1 = await readFile(join(run1, 'de405-canonical-v2-jpl-smoke.jsonl'))
    const file2 = await readFile(join(run2, 'de405-canonical-v2-jpl-smoke.jsonl'))
    assert.deepEqual(file1, file2)
  } finally {
    await rm(ctx.dir, { recursive: true, force: true })
  }
})

test('Synthetic 73,420 row full grid contract generation succeeds and is byte-identical across runs', async () => {
  const ctx = await createFullGridFixture()
  try {
    const run1 = join(ctx.dir, 'full-run-1')
    const run2 = join(ctx.dir, 'full-run-2')

    // Synthetic manifest must have synthetic: true and canonical: false
    const origManifest = JSON.parse(await readFile(ctx.manifestFile, 'utf8'))
    origManifest.synthetic = true
    origManifest.canonical = false
    origManifest.canonicalEligible = false
    origManifest.testOnly = true
    origManifest.provenanceStatus = 'synthetic_contract_evidence'
    await writeFile(ctx.manifestFile, JSON.stringify(origManifest, null, 2) + '\n')

    const result1 = run(generator, ['--manifest', ctx.manifestFile, '--runner', fakeRunner, '--output-dir', run1])
    assert.equal(result1.status, 0, result1.stderr)

    const result2 = run(generator, ['--manifest', ctx.manifestFile, '--runner', fakeRunner, '--output-dir', run2])
    assert.equal(result2.status, 0, result2.stderr)

    const file1 = await readFile(join(run1, 'de405-canonical-v2-jpl-regular-grid.jsonl'))
    const file2 = await readFile(join(run2, 'de405-canonical-v2-jpl-regular-grid.jsonl'))
    assert.equal(file1.length, file2.length)
    assert.deepEqual(file1, file2)

    const lines = file1.toString('utf8').trimEnd().split('\n')
    assert.equal(lines.length, 73420)
  } finally {
    await rm(ctx.dir, { recursive: true, force: true })
  }
})

test('Generator cleans up staging directory on runner failure', async () => {
  const ctx = await createSmokeFixture()
  try {
    const outputDir = join(ctx.dir, 'failed')
    const result = run(generator, ['--manifest', ctx.manifestFile, '--runner', fakeRunner, '--output-dir', outputDir], { FAKE_DE405_MODE: 'exit-nonzero' })
    assert.notEqual(result.status, 0)
    await assert.rejects(() => stat(outputDir))
    assert.deepEqual((await readdir(ctx.dir)).filter(name => name.startsWith('.canonical-v2-jpl-staging-')), [])
  } finally {
    await rm(ctx.dir, { recursive: true, force: true })
  }
})

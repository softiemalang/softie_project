import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
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
  const dir = await mkdtemp(join(tmpdir(), 'de405-jpl-val-test-'))
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
    output: { file: 'de405-canonical-v2-jpl-smoke.jsonl', sizeBytes: 0, rowCount: 10, sha256: '0'.repeat(64), generatedByRunnerSha256: '0'.repeat(64) },
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

function run(command, args, env = {}) {
  return spawnSync(process.execPath, [command, ...args], { cwd: root, encoding: 'utf8', env: { ...process.env, ...env } })
}

test('Validator rejects synthetic manifest attempting canonical: true or verified status', async () => {
  const ctx = await createSmokeFixture()
  try {
    const outputDir = join(ctx.dir, 'run-1')
    run(generator, ['--manifest', ctx.manifestFile, '--runner', fakeRunner, '--output-dir', outputDir])
    const generatedManifestFile = join(outputDir, 'manifest.json')
    const manifest = JSON.parse(await readFile(generatedManifestFile, 'utf8'))

    manifest.synthetic = true
    manifest.canonical = true
    await writeFile(generatedManifestFile, JSON.stringify(manifest, null, 2) + '\n')

    const res = run(validator, ['--manifest', generatedManifestFile, '--input', join(outputDir, 'de405-canonical-v2-jpl-smoke.jsonl')])
    assert.notEqual(res.status, 0)
    assert.match(res.stderr, /synthetic artifact cannot claim canonical/)
  } finally {
    await rm(ctx.dir, { recursive: true, force: true })
  }
})

test('Validator rejects JPL targetContractStatus unresolved', async () => {
  const ctx = await createSmokeFixture()
  try {
    const outputDir = join(ctx.dir, 'run-1')
    run(generator, ['--manifest', ctx.manifestFile, '--runner', fakeRunner, '--output-dir', outputDir])
    const generatedManifestFile = join(outputDir, 'manifest.json')
    const manifest = JSON.parse(await readFile(generatedManifestFile, 'utf8'))

    manifest.reader.targetContractStatus = 'unresolved'
    await writeFile(generatedManifestFile, JSON.stringify(manifest, null, 2) + '\n')

    const res = run(validator, ['--manifest', generatedManifestFile, '--input', join(outputDir, 'de405-canonical-v2-jpl-smoke.jsonl')])
    assert.notEqual(res.status, 0)
    assert.match(res.stderr, /JPL reader target contract status must be confirmed/)
  } finally {
    await rm(ctx.dir, { recursive: true, force: true })
  }
})

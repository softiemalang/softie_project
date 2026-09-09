import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import test from 'node:test'
import { ASTROLOGY_REFERENCE, COVERAGE, CSPICE_FLAGS, NODE_VERSION, PAYLOAD_FILES, RUNNER, RUNNER_FLAGS, TARGET, manifestIntegritySha256, payloadFilesSha256, sha256Text, sourceIdentity, stableJson } from '../scripts/lib/de405-linux-producer-artifact-contract.mjs'
import { checkProducerDirectory, validateManifest } from '../scripts/check-de405-linux-producer-artifact.mjs'

const root = resolve('.')

function fixtureManifest() {
  const files = Object.fromEntries(PAYLOAD_FILES.map((path) => {
    const content = `fixture:${path}\n`
    return [path, { bytes: Buffer.byteLength(content), sha256: sha256Text(content) }]
  }))
  const manifest = {
    schemaVersion: 'de405-linux-producer-artifact-v0',
    artifactId: 'de405-linux-producer-v0',
    artifactVersion: '0.1.0',
    target: TARGET,
    runner: { ...RUNNER, binarySha256: files['bin/de405-canonical-v2-runner'].sha256, coverage: { coverageStartEt: COVERAGE.startEt, coverageEndEt: COVERAGE.endEt, coverageTool: COVERAGE.tool, coverageToolVersion: COVERAGE.toolVersion, objectCount: COVERAGE.objectCount } },
    source: sourceIdentity(),
    build: {
      sourceCommit: 'a'.repeat(40),
      workflow: '.github/workflows/de405-linux-producer-v0.yml',
      sourceRunnerSha256: RUNNER.sourceSha256,
      flags: { cspice: CSPICE_FLAGS, runner: RUNNER_FLAGS },
      toolchain: { compiler: 'gcc', compilerVersion: 'fixture', compilerTarget: 'x86_64-linux-gnu', libcFamily: 'glibc', libcVersion: 'fixture', nodeVersion: NODE_VERSION },
      cspiceBuild: { sourceManifestSha256: '54a50975a8ea536bd5fc18add2d2fe481c35aaba07bebc1bcc630b76ba8925f1', sourceFileCount: 2439 },
      determinism: { locale: 'C.UTF-8', timezone: 'UTC', sourceDateEpoch: 0, archive: 'sorted-ustar-gzip-no-mtime', runtimeDownload: false },
    },
    verification: {
      reference: { fixturePath: ASTROLOGY_REFERENCE.fixturePath, fixtureId: ASTROLOGY_REFERENCE.fixtureId, packetSha256: ASTROLOGY_REFERENCE.packetSha256, rawChartSha256: ASTROLOGY_REFERENCE.rawChartSha256, ruleCoreSha256: ASTROLOGY_REFERENCE.ruleCoreSha256 },
      linux: { evidencePath: 'verification/astrology-ephemeris-golden-v1.json', availableForInterpretation: false, integrationStatus: 'not_connected', packetSha256: ASTROLOGY_REFERENCE.packetSha256, rawChartSha256: ASTROLOGY_REFERENCE.rawChartSha256, ruleCoreSha256: ASTROLOGY_REFERENCE.ruleCoreSha256, packetParity: 'exact_canonical_packet_bytes_raw_and_rule_core_object_identity' },
    },
    compliance: { status: 'internal_ci_only_pending_external_review', publicReleaseAllowed: false, sourceIncluded: false, artifactScope: 'GitHub Actions retention artifact only' },
    files,
    payloadFilesSha256: payloadFilesSha256(files),
    manifestIntegritySha256: null,
  }
  manifest.manifestIntegritySha256 = manifestIntegritySha256(manifest)
  return manifest
}

async function writeFixtureDirectory(directory, manifest, omit = []) {
  await mkdir(directory, { recursive: true })
  await writeFile(join(directory, 'manifest.json'), stableJson(manifest))
  for (const path of PAYLOAD_FILES) {
    if (omit.includes(path)) continue
    await mkdir(join(directory, path, '..'), { recursive: true })
    await writeFile(join(directory, path), `fixture:${path}\n`)
  }
}

test('Linux producer contract and workflow are source-pinned and activation-neutral', async () => {
  const manifest = fixtureManifest()
  assert.deepEqual(validateManifest(manifest), [])
  const workflow = await readFile(join(root, '.github/workflows/de405-linux-producer-v0.yml'), 'utf8')
  for (const value of ['workflow_dispatch:', 'runs-on: ubuntu-24.04', 'uname -m', 'x86_64-linux-gnu', 'fetch-de405-linux-official-inputs.mjs', 'build-de405-linux-producer-v0.mjs', '--repeat 2', 'actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02', 'retention-days: 14']) assert.match(workflow, new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), value)
  assert.doesNotMatch(workflow, /(?:^|\n)\s*(?:push|pull_request):/)
  assert.doesNotMatch(workflow, /vercel|availableForInterpretation:\s*true|activation/i)
  for (const match of workflow.matchAll(/uses:\s*([^\s#]+)/g)) assert.match(match[1], /@[0-9a-f]{40}$/)
})

test('Mac reference fixture is the fixed numerical and packet parity oracle', async () => {
  const evidence = JSON.parse(await readFile(join(root, ASTROLOGY_REFERENCE.fixturePath), 'utf8'))
  assert.equal(evidence.fixture.id, ASTROLOGY_REFERENCE.fixtureId)
  assert.equal(ASTROLOGY_REFERENCE.packetSha256, 'afabd5542479d761657f461050df649102843b8670d6b985be2a274e2b3209aa')
  assert.equal(evidence.rawChart.sha256, ASTROLOGY_REFERENCE.rawChartSha256)
  assert.equal(evidence.ruleCore.sha256, ASTROLOGY_REFERENCE.ruleCoreSha256)
  assert.equal(evidence.availableForInterpretation, false)
  assert.equal(evidence.integrationStatus, 'not_connected')
})

test('manifest mutation, wrong provider, ABI mismatch, and payload tamper fail closed', async () => {
  const valid = fixtureManifest()
  const mutations = [
    ['wrong provider', (value) => { value.source.spk.sha256 = '0'.repeat(64) }, /source identity mismatch|manifest integrity mismatch/],
    ['ABI mismatch', (value) => { value.target.architecture = 'arm64' }, /Linux x64 target ABI mismatch/],
    ['coverage mismatch', (value) => { value.runner.coverage.objectCount = 9 }, /runner ABI\/source\/coverage contract mismatch/],
    ['canonical packet mismatch', (value) => { value.verification.linux.packetSha256 = '0'.repeat(64) }, /activation\/integration\/parity boundary mismatch/],
    ['tampered manifest', (value) => { value.payloadFilesSha256 = 'f'.repeat(64) }, /payload file inventory hash mismatch|manifest integrity mismatch/],
    ['missing runner linkage', (value) => { value.runner.binarySha256 = '0'.repeat(64) }, /runner binary hash linkage mismatch/],
  ]
  for (const [name, mutate, pattern] of mutations) {
    const candidate = structuredClone(valid)
    mutate(candidate)
    assert.match(validateManifest(candidate).join('\n'), pattern, name)
  }

  const directory = await mkdtemp(join(tmpdir(), 'de405-linux-producer-contract-'))
  try {
    await writeFixtureDirectory(directory, valid)
    await writeFile(join(directory, 'provider/de405.bsp'), 'tampered provider\n')
    const tampered = await checkProducerDirectory(directory, { verifyRuntime: false })
    assert.equal(tampered.status, 'fail')
    assert.ok(tampered.errors.some((error) => error.includes('file integrity mismatch: provider/de405.bsp')))

    await rm(join(directory, 'provider/de405.bsp'))
    const missing = await checkProducerDirectory(directory, { verifyRuntime: false })
    assert.equal(missing.status, 'fail')
    assert.ok(missing.errors.some((error) => error.includes('artifact file set mismatch')))

    await writeFile(join(directory, 'provider/de405.bsp'), 'fixture:provider/de405.bsp\n')
    await writeFile(join(directory, 'unexpected.txt'), 'extra\n')
    const extra = await checkProducerDirectory(directory, { verifyRuntime: false })
    assert.equal(extra.status, 'fail')
    assert.ok(extra.errors.some((error) => error.includes('artifact file set mismatch')))
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

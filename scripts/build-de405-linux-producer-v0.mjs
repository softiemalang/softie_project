#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import { chmod, cp, mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  ARTIFACT_ID,
  ARTIFACT_SCHEMA,
  ARTIFACT_VERSION,
  ASTROLOGY_REFERENCE,
  COVERAGE,
  CSPICE_FLAGS,
  OFFICIAL_SOURCE,
  NODE_VERSION,
  PAYLOAD_FILES,
  RUNNER,
  RUNNER_FLAGS,
  TARGET,
  WORKFLOW_PATH,
  manifestIntegritySha256,
  payloadFilesSha256,
  readJson,
  sha256File,
  sha256Text,
  stableJson,
  sourceIdentity,
} from './lib/de405-linux-producer-artifact-contract.mjs'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const GOLDEN_MATERIALIZER = resolve(ROOT, 'scripts/materialize-astrology-ephemeris-golden.mjs')
const GOLDEN_CHECKER = resolve(ROOT, 'scripts/check-astrology-ephemeris-golden.mjs')
const CSPICE_BUILDER = resolve(ROOT, 'scripts/build-de405-linux-cspice.mjs')
const RUNNER_SOURCE = resolve(ROOT, RUNNER.sourcePath)

function cliOptions(argv) {
  const options = {}
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index]
    if (value === '--inputs' || value === '--output' || value === '--repeat') options[value.slice(2)] = argv[++index]
  }
  return options
}

function fail(message) {
  throw new Error(message)
}

function deterministicEnv() {
  return {
    ...process.env,
    CC: 'gcc',
    LC_ALL: 'C.UTF-8',
    LANG: 'C.UTF-8',
    TZ: 'UTC',
    SOURCE_DATE_EPOCH: '0',
    DE405_CSPICE_CFLAGS: CSPICE_FLAGS.join(' '),
    DE405_CFLAGS: RUNNER_FLAGS.join(' '),
  }
}

function run(command, args, options = {}) {
  try {
    return execFileSync(command, args, { encoding: 'utf8', ...options })
  } catch (error) {
    const detail = `${error.stdout || ''}${error.stderr || ''}`.trim()
    throw new Error(`${command} ${args.join(' ')} failed${detail ? `: ${detail}` : ''}`)
  }
}

function packetSectionDigest(value) {
  const serialized = stableJson(value)
  return { bytes: Buffer.byteLength(serialized), sha256: sha256Text(serialized) }
}

function packetParityDiagnostic(linux, reference) {
  const keys = [...new Set([...Object.keys(linux), ...Object.keys(reference)])].sort()
  const sections = Object.fromEntries(keys.map((key) => {
    const linuxDigest = packetSectionDigest(linux[key])
    const referenceDigest = packetSectionDigest(reference[key])
    return [key, { equal: linuxDigest.sha256 === referenceDigest.sha256, linux: linuxDigest, reference: referenceDigest }]
  }))
  const oracleIds = [...new Set([...Object.keys(linux.oracle || {}), ...Object.keys(reference.oracle || {})])].sort()
  const oracle = Object.fromEntries(oracleIds.map((id) => {
    const left = linux.oracle?.[id]
    const right = reference.oracle?.[id]
    return [id, {
      equal: packetSectionDigest(left).sha256 === packetSectionDigest(right).sha256,
      linux: left ? { selectedStep: left.selectedStep, worstCaseAcrossStepSweep: left.worstCaseAcrossStepSweep } : null,
      reference: right ? { selectedStep: right.selectedStep, worstCaseAcrossStepSweep: right.worstCaseAcrossStepSweep } : null,
    }]
  }))
  return { sections, oracle }
}

async function assertOfficialInputs(inputs) {
  const acquisitionPath = join(inputs, 'acquisition-provenance.json')
  const acquisition = await readJson(acquisitionPath)
  if (acquisition.cspice?.url !== OFFICIAL_SOURCE.cspiceUrl || acquisition.cspice?.sha256 !== OFFICIAL_SOURCE.cspiceArchiveSha256 || acquisition.spk?.url !== OFFICIAL_SOURCE.spkUrl || acquisition.spk?.sha256 !== OFFICIAL_SOURCE.spkSha256) fail('official input URL/SHA contract mismatch')
  if (acquisition.inputs?.sourceManifestSha256 !== OFFICIAL_SOURCE.cspiceSourceManifestSha256 || acquisition.inputs?.sourceFileCount !== OFFICIAL_SOURCE.cspiceSourceFileCount) fail('official CSPICE source manifest identity mismatch')
  const spk = join(inputs, 'de405.bsp')
  const spkInfo = await stat(spk)
  if (spkInfo.size !== OFFICIAL_SOURCE.spkBytes || await sha256File(spk) !== OFFICIAL_SOURCE.spkSha256) fail('unmodified DE405 BSP is missing or hash-invalid')
  const cspice = join(inputs, 'cspice/N0067')
  const sourceManifestPath = join(cspice, 'source-manifest.json')
  const sourceManifest = await readJson(sourceManifestPath)
  if (await sha256File(sourceManifestPath) !== OFFICIAL_SOURCE.cspiceSourceManifestSha256 || sourceManifest.toolkitVersion !== OFFICIAL_SOURCE.cspiceToolkitVersion || sourceManifest.acquisition?.archiveSha256 !== OFFICIAL_SOURCE.cspiceArchiveSha256 || sourceManifest.files?.length !== OFFICIAL_SOURCE.cspiceSourceFileCount) fail('official CSPICE source-only extraction is incomplete')
  for (const path of ['include/SpiceUsr.h', 'src/cspice', 'src/csupport']) await stat(join(cspice, path))
  return { acquisition, cspice, spk, sourceManifestPath }
}

function compilerIdentity() {
  if (process.version !== NODE_VERSION) fail(`unexpected Node build runtime: ${process.version}`)
  const compilerVersion = run('gcc', ['--version']).split('\n')[0]
  const compilerTarget = run('gcc', ['-dumpmachine']).trim()
  if (compilerTarget !== TARGET.compilerTarget) fail(`unexpected GCC target: ${compilerTarget}`)
  const libcVersion = run('ldd', ['--version']).split('\n').find(Boolean) || 'unavailable'
  return { compiler: TARGET.compiler, compilerVersion, compilerTarget, libcFamily: TARGET.libcFamily, libcVersion, nodeVersion: process.version }
}

function commitIdentity() {
  const value = process.env.GITHUB_SHA || run('git', ['rev-parse', 'HEAD'], { cwd: ROOT }).trim()
  if (!/^[0-9a-f]{40}$/.test(value)) fail('source commit must be a full SHA-1')
  return value
}

async function buildOnce({ inputs, packageRoot, sourceCommit, inputIdentity }) {
  if (process.platform !== 'linux' || process.arch !== 'x64') fail(`Linux x64 producer build required; observed ${process.platform}-${process.arch}`)
  const env = deterministicEnv()
  const compiler = compilerIdentity()
  const cspiceInput = inputIdentity.cspice
  const cspiceBuild = join(dirname(packageRoot), `${packageRoot.split('/').at(-1)}-cspice-build/N0067`)
  run(process.execPath, [CSPICE_BUILDER, '--cspice', cspiceInput, '--output', cspiceBuild], { cwd: ROOT, env, stdio: 'inherit' })
  const built = await readJson(join(cspiceBuild, 'build-provenance.json'))
  if (built.compiler !== TARGET.compiler || built.compilerTarget !== TARGET.compilerTarget || built.architecture !== TARGET.architecture || built.sourceManifestSha256 !== OFFICIAL_SOURCE.cspiceBuildSourceManifestSha256 || built.sourceFileCount !== OFFICIAL_SOURCE.cspiceBuildSourceFileCount || !CSPICE_FLAGS.every(flag => built.flags?.includes(flag))) fail('CSPICE Linux build provenance does not match the producer ABI/source identity')

  const runner = join(packageRoot, 'bin/de405-canonical-v2-runner')
  await mkdir(dirname(runner), { recursive: true })
  run('gcc', [...RUNNER_FLAGS, `-I${join(cspiceBuild, 'include')}`, RUNNER_SOURCE, join(cspiceBuild, 'lib/cspice.a'), join(cspiceBuild, 'lib/csupport.a'), '-lm', '-o', runner], { cwd: ROOT, env, stdio: 'inherit' })
  await chmod(runner, 0o755)
  const runnerVersion = JSON.parse(run(runner, ['--version']))
  if (runnerVersion.runnerVersion !== RUNNER.version || runnerVersion.cspiceToolkitVersion !== OFFICIAL_SOURCE.cspiceToolkitVersion || runnerVersion.testOnly !== false) fail('Linux runner ABI/version check failed')
  const coverage = JSON.parse(run(runner, ['--coverage', '--spk', inputIdentity.spk]).trim())
  if (coverage.coverageStartEt !== COVERAGE.startEt || coverage.coverageEndEt !== COVERAGE.endEt || coverage.coverageTool !== COVERAGE.tool || coverage.coverageToolVersion !== COVERAGE.toolVersion || coverage.objectCount !== COVERAGE.objectCount) fail('DE405 coverage/source identity check failed')

  await mkdir(join(packageRoot, 'provider'), { recursive: true })
  await mkdir(join(packageRoot, 'cspice/lib'), { recursive: true })
  await mkdir(join(packageRoot, 'verification'), { recursive: true })
  await cp(inputIdentity.spk, join(packageRoot, 'provider/de405.bsp'))
  await cp(join(cspiceBuild, 'lib/cspice.a'), join(packageRoot, 'cspice/lib/cspice.a'))
  await cp(join(cspiceBuild, 'lib/csupport.a'), join(packageRoot, 'cspice/lib/csupport.a'))
  await cp(inputIdentity.sourceManifestPath, join(packageRoot, 'cspice/source-manifest.json'))
  await cp(join(cspiceBuild, 'source-manifest.json'), join(packageRoot, 'cspice/build-source-manifest.json'))
  await cp(join(cspiceBuild, 'build-provenance.json'), join(packageRoot, 'cspice/build-provenance.json'))

  const goldenPath = join(packageRoot, 'verification/astrology-ephemeris-golden-v1.json')
  run(process.execPath, [GOLDEN_MATERIALIZER], { cwd: ROOT, env: { ...env, DE405_RUNNER: runner, DE405_BSP_PATH: inputIdentity.spk, ASTROLOGY_GOLDEN_OUTPUT: goldenPath }, stdio: 'inherit' })
  run(process.execPath, [GOLDEN_CHECKER, goldenPath], { cwd: ROOT, env, stdio: 'inherit' })
  const reference = await readJson(resolve(ROOT, ASTROLOGY_REFERENCE.fixturePath))
  const golden = await readJson(goldenPath)
  const referencePath = resolve(ROOT, ASTROLOGY_REFERENCE.fixturePath)
  const linuxPacketBytes = await readFile(goldenPath)
  const referencePacketBytes = await readFile(referencePath)
  const packetParityFailed = await sha256File(goldenPath) !== ASTROLOGY_REFERENCE.packetSha256 || !linuxPacketBytes.equals(referencePacketBytes) || golden.rawChart?.sha256 !== ASTROLOGY_REFERENCE.rawChartSha256 || golden.ruleCore?.sha256 !== ASTROLOGY_REFERENCE.ruleCoreSha256 || JSON.stringify(golden.rawChart?.value) !== JSON.stringify(reference.rawChart?.value) || JSON.stringify(golden.ruleCore?.value) !== JSON.stringify(reference.ruleCore?.value)
  if (packetParityFailed) {
    console.error(JSON.stringify({
      error: 'Linux/Mac Astrology canonical packet parity mismatch',
      linuxPacket: { bytes: linuxPacketBytes.length, sha256: sha256Text(linuxPacketBytes) },
      referencePacket: { bytes: referencePacketBytes.length, sha256: sha256Text(referencePacketBytes), expectedSha256: ASTROLOGY_REFERENCE.packetSha256 },
      diagnostic: packetParityDiagnostic(golden, reference),
    }, null, 2))
    fail('Linux/Mac Astrology canonical packet parity mismatch')
  }
  if (golden.availableForInterpretation !== false || golden.integrationStatus !== 'not_connected') fail('Astrology activation boundary changed')

  const files = {}
  for (const path of PAYLOAD_FILES) {
    const file = join(packageRoot, path)
    const info = await stat(file)
    files[path] = { bytes: info.size, sha256: await sha256File(file) }
  }
  const manifest = {
    schemaVersion: ARTIFACT_SCHEMA,
    artifactId: ARTIFACT_ID,
    artifactVersion: ARTIFACT_VERSION,
    target: TARGET,
    runner: {
      ...RUNNER,
      binarySha256: files['bin/de405-canonical-v2-runner'].sha256,
      coverage,
    },
    source: sourceIdentity(),
    build: {
      sourceCommit,
      workflow: WORKFLOW_PATH,
      sourceRunnerSha256: RUNNER.sourceSha256,
      flags: { cspice: CSPICE_FLAGS, runner: RUNNER_FLAGS },
      toolchain: compiler,
      cspiceBuild: {
        sourceManifestSha256: built.sourceManifestSha256,
        sourceFileCount: built.sourceFileCount,
        archiveTool: built.archiveTool,
        cspiceLibrarySha256: files['cspice/lib/cspice.a'].sha256,
        csupportLibrarySha256: files['cspice/lib/csupport.a'].sha256,
      },
      determinism: { locale: 'C.UTF-8', timezone: 'UTC', sourceDateEpoch: 0, archive: 'sorted-ustar-gzip-no-mtime', runtimeDownload: false },
    },
    verification: {
      reference: {
        fixturePath: ASTROLOGY_REFERENCE.fixturePath,
        fixtureId: ASTROLOGY_REFERENCE.fixtureId,
        packetSha256: ASTROLOGY_REFERENCE.packetSha256,
        rawChartSha256: ASTROLOGY_REFERENCE.rawChartSha256,
        ruleCoreSha256: ASTROLOGY_REFERENCE.ruleCoreSha256,
      },
      linux: {
        evidencePath: 'verification/astrology-ephemeris-golden-v1.json',
        availableForInterpretation: false,
        integrationStatus: 'not_connected',
        packetSha256: await sha256File(goldenPath),
        rawChartSha256: golden.rawChart.sha256,
        ruleCoreSha256: golden.ruleCore.sha256,
        packetParity: 'exact_canonical_packet_bytes_raw_and_rule_core_object_identity',
      },
    },
    compliance: { status: 'internal_ci_only_pending_external_review', publicReleaseAllowed: false, sourceIncluded: false, artifactScope: 'GitHub Actions retention artifact only' },
    files,
    payloadFilesSha256: payloadFilesSha256(files),
    manifestIntegritySha256: null,
  }
  manifest.manifestIntegritySha256 = manifestIntegritySha256(manifest)
  await writeFile(join(packageRoot, 'manifest.json'), stableJson(manifest))
  return { packageRoot, manifest, files }
}

const options = cliOptions(process.argv.slice(2))
if (!options.inputs || !options.output) fail('usage: --inputs DIR --output DIR [--repeat N]')
const inputs = resolve(options.inputs)
const output = resolve(options.output)
const repeat = Number(options.repeat || 2)
if (!Number.isInteger(repeat) || repeat < 2 || repeat > 3) fail('--repeat must be 2 or 3')
try { await stat(output); fail('output already exists; immutable output requires a new directory') } catch (error) { if (error.message.includes('immutable output')) throw error; if (error.code !== 'ENOENT') throw error }
const inputIdentity = await assertOfficialInputs(inputs)
const sourceCommit = commitIdentity()
const work = resolve(`${output}.staging`)
await rm(work, { recursive: true, force: true })
await mkdir(work, { recursive: true })
try {
  const builds = []
  for (let index = 0; index < repeat; index += 1) builds.push(await buildOnce({ inputs, packageRoot: join(work, `run-${index + 1}`), sourceCommit, inputIdentity }))
  const firstRecords = builds[0].files
  for (const build of builds.slice(1)) {
    for (const path of PAYLOAD_FILES) if (build.files[path].bytes !== firstRecords[path].bytes || build.files[path].sha256 !== firstRecords[path].sha256) fail(`repeat build identity mismatch: ${path}`)
    if (build.manifest.manifestIntegritySha256 !== builds[0].manifest.manifestIntegritySha256 || build.manifest.payloadFilesSha256 !== builds[0].manifest.payloadFilesSha256) fail('repeat manifest identity mismatch')
    const firstManifest = await readFile(join(builds[0].packageRoot, 'manifest.json'))
    const candidateManifest = await readFile(join(build.packageRoot, 'manifest.json'))
    if (!firstManifest.equals(candidateManifest)) fail('repeat manifest bytes are not identical')
  }
  await cp(builds[0].packageRoot, output, { recursive: true, force: false, errorOnExist: true })
  console.log(JSON.stringify({ output, artifactId: ARTIFACT_ID, artifactVersion: ARTIFACT_VERSION, repeatCount: repeat, payloadFilesSha256: builds[0].manifest.payloadFilesSha256, manifestIntegritySha256: builds[0].manifest.manifestIntegritySha256, rawChartSha256: builds[0].manifest.verification.linux.rawChartSha256, ruleCoreSha256: builds[0].manifest.verification.linux.ruleCoreSha256, complianceStatus: builds[0].manifest.compliance.status }, null, 2))
} finally {
  await rm(work, { recursive: true, force: true })
}

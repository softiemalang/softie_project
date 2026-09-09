#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import { lstat, mkdtemp, readdir, readFile, rm, stat } from 'node:fs/promises'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  ALL_FILES,
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
  isSafeRelativePath,
  manifestIntegritySha256,
  payloadFilesSha256,
  readJson,
  sha256File,
  stableJson,
  sourceIdentity,
} from './lib/de405-linux-producer-artifact-contract.mjs'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const DEFAULT_REFERENCE = resolve(ROOT, ASTROLOGY_REFERENCE.fixturePath)

function same(a, b) {
  return JSON.stringify(a) === JSON.stringify(b)
}

function runnerCoverage() {
  return {
    coverageStartEt: COVERAGE.startEt,
    coverageEndEt: COVERAGE.endEt,
    coverageTool: COVERAGE.tool,
    coverageToolVersion: COVERAGE.toolVersion,
    objectCount: COVERAGE.objectCount,
  }
}

function expectedSourceErrors(manifest) {
  const errors = []
  const expected = sourceIdentity()
  if (!same(manifest.source?.cspice, expected.cspice)) errors.push('CSPICE source identity mismatch')
  if (!same(manifest.source?.spk, expected.spk)) errors.push('DE405 SPK source identity mismatch')
  for (const field of ['sourceRole', 'coverageRole', 'canonicalEligible', 'fallbackAllowed']) {
    if (manifest.source?.[field] !== expected[field]) errors.push(`source.${field} contract mismatch`)
  }
  return errors
}

export function validateManifest(manifest) {
  const errors = []
  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) return ['manifest is not an object']
  if (manifest.schemaVersion !== ARTIFACT_SCHEMA) errors.push('artifact schema mismatch')
  if (manifest.artifactId !== ARTIFACT_ID) errors.push('artifact id mismatch')
  if (manifest.artifactVersion !== ARTIFACT_VERSION) errors.push('artifact version mismatch')
  if (!same(manifest.target, TARGET)) errors.push('Linux x64 target ABI mismatch')
  if (manifest.build?.toolchain?.nodeVersion !== NODE_VERSION) errors.push('Node build runtime version mismatch')
  if (manifest.runner?.version !== RUNNER.version || manifest.runner?.sourcePath !== RUNNER.sourcePath || manifest.runner?.sourceSha256 !== RUNNER.sourceSha256 || manifest.runner?.binaryFormat !== RUNNER.binaryFormat || manifest.runner?.inputMode !== RUNNER.inputMode || manifest.runner?.versionMode !== RUNNER.versionMode || manifest.runner?.coverageMode !== RUNNER.coverageMode || !same(manifest.runner?.coverage, runnerCoverage())) errors.push('runner ABI/source/coverage contract mismatch')
  if (!same(manifest.source, sourceIdentity())) errors.push(...expectedSourceErrors(manifest))
  if (!same(manifest.build?.flags?.cspice, CSPICE_FLAGS) || !same(manifest.build?.flags?.runner, RUNNER_FLAGS)) errors.push('build flags mismatch')
  if (manifest.build?.workflow !== WORKFLOW_PATH || manifest.build?.sourceRunnerSha256 !== RUNNER.sourceSha256) errors.push('build source/workflow linkage mismatch')
  if (manifest.build?.cspiceBuild?.sourceManifestSha256 !== OFFICIAL_SOURCE.cspiceBuildSourceManifestSha256 || manifest.build?.cspiceBuild?.sourceFileCount !== OFFICIAL_SOURCE.cspiceBuildSourceFileCount) errors.push('CSPICE build source identity mismatch')
  if (manifest.build?.determinism?.locale !== 'C.UTF-8' || manifest.build?.determinism?.timezone !== 'UTC' || manifest.build?.determinism?.sourceDateEpoch !== 0 || manifest.build?.determinism?.archive !== 'sorted-ustar-gzip-no-mtime' || manifest.build?.determinism?.runtimeDownload !== false) errors.push('determinism controls mismatch')
  if (manifest.compliance?.status !== 'internal_ci_only_pending_external_review' || manifest.compliance?.publicReleaseAllowed !== false || manifest.compliance?.sourceIncluded !== false || manifest.compliance?.artifactScope !== 'GitHub Actions retention artifact only') errors.push('distribution/compliance boundary mismatch')
  if (manifest.verification?.reference?.fixturePath !== ASTROLOGY_REFERENCE.fixturePath || manifest.verification?.reference?.fixtureId !== ASTROLOGY_REFERENCE.fixtureId || manifest.verification?.reference?.packetSha256 !== ASTROLOGY_REFERENCE.packetSha256 || manifest.verification?.reference?.rawChartSha256 !== ASTROLOGY_REFERENCE.rawChartSha256 || manifest.verification?.reference?.ruleCoreSha256 !== ASTROLOGY_REFERENCE.ruleCoreSha256) errors.push('Mac reference fixture identity mismatch')
  if (manifest.verification?.linux?.availableForInterpretation !== false || manifest.verification?.linux?.integrationStatus !== 'not_connected' || manifest.verification?.linux?.packetSha256 !== ASTROLOGY_REFERENCE.packetSha256 || manifest.verification?.linux?.rawChartSha256 !== ASTROLOGY_REFERENCE.rawChartSha256 || manifest.verification?.linux?.ruleCoreSha256 !== ASTROLOGY_REFERENCE.ruleCoreSha256 || manifest.verification?.linux?.packetParity !== 'exact_canonical_packet_bytes_raw_and_rule_core_object_identity') errors.push('activation/integration/parity boundary mismatch')
  if (!/^[0-9a-f]{40}$/.test(manifest.build?.sourceCommit || '')) errors.push('source commit identity is not a full SHA')

  if (!manifest.files || typeof manifest.files !== 'object' || Array.isArray(manifest.files)) errors.push('file inventory missing')
  else {
    const paths = Object.keys(manifest.files).sort()
    if (!same(paths, [...PAYLOAD_FILES].sort())) errors.push('file inventory mismatch')
    for (const [path, record] of Object.entries(manifest.files)) {
      if (!isSafeRelativePath(path)) errors.push(`unsafe file path: ${path}`)
      if (!record || !/^[0-9a-f]{64}$/.test(record.sha256 || '') || !Number.isInteger(record.bytes) || record.bytes < 1) errors.push(`invalid file record: ${path}`)
    }
    if (manifest.runner?.binarySha256 !== manifest.files['bin/de405-canonical-v2-runner']?.sha256) errors.push('runner binary hash linkage mismatch')
    if (typeof manifest.payloadFilesSha256 !== 'string' || manifest.payloadFilesSha256 !== payloadFilesSha256(manifest.files)) errors.push('payload file inventory hash mismatch')
  }
  if (!/^[0-9a-f]{64}$/.test(manifest.manifestIntegritySha256 || '') || manifest.manifestIntegritySha256 !== manifestIntegritySha256(manifest)) errors.push('manifest integrity mismatch')

  const serialized = JSON.stringify(manifest)
  for (const forbidden of ['/Users/', '/private/tmp', '/home/runner/work/', 'RUNNER_TEMP', 'github.run_id', 'runId', 'generatedAt', 'timestamp']) if (serialized.includes(forbidden)) errors.push(`volatile or local metadata present: ${forbidden}`)
  return [...new Set(errors)]
}

async function walkFiles(root) {
  const files = []
  async function visit(dir) {
    for (const entry of (await readdir(dir, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
      const path = join(dir, entry.name)
      const info = await lstat(path)
      if (info.isDirectory()) await visit(path)
      else if (info.isFile()) files.push({ path, relative: relative(root, path).split('\\').join('/'), info })
      else throw new Error(`symlink or special file is not allowed: ${relative(root, path)}`)
    }
  }
  await visit(root)
  return files
}

function readelfIdentity(binary) {
  try {
    const fileOutput = execFileSync('file', ['-b', binary], { encoding: 'utf8' }).trim()
    if (!fileOutput.includes('ELF 64-bit') || !fileOutput.includes('x86-64')) return `runner binary format mismatch: ${fileOutput}`
    const header = execFileSync('readelf', ['-h', binary], { encoding: 'utf8' })
    if (!/Class:\s+ELF64/.test(header) || !/Machine:\s+x86-64/.test(header)) return 'runner ELF header ABI mismatch'
    return null
  } catch (error) {
    return `runner ABI inspection failed: ${error.message}`
  }
}

function runJson(binary, args) {
  return JSON.parse(execFileSync(binary, args, { encoding: 'utf8' }).trim())
}

async function verifyRuntime(root, manifest, errors) {
  if (process.platform !== 'linux' || process.arch !== 'x64') {
    errors.push(`checker must run on Linux x64; observed ${process.platform}-${process.arch}`)
    return
  }
  const runner = join(root, 'bin/de405-canonical-v2-runner')
  const binaryError = readelfIdentity(runner)
  if (binaryError) errors.push(binaryError)
  try {
    const mode = (await lstat(runner)).mode
    if ((mode & 0o111) === 0) errors.push('runner is not executable')
  } catch (error) { errors.push(`runner mode check failed: ${error.message}`) }
  if (errors.length) return
  try {
    const version = runJson(runner, ['--version'])
    if (version.runnerVersion !== RUNNER.version || version.cspiceToolkitVersion !== OFFICIAL_SOURCE.cspiceToolkitVersion || version.testOnly !== false) errors.push('runner version ABI mismatch')
    const coverage = runJson(runner, ['--coverage', '--spk', join(root, 'provider/de405.bsp')])
    if (coverage.coverageStartEt !== COVERAGE.startEt || coverage.coverageEndEt !== COVERAGE.endEt || coverage.coverageTool !== COVERAGE.tool || coverage.coverageToolVersion !== COVERAGE.toolVersion || coverage.objectCount !== COVERAGE.objectCount) errors.push('DE405 coverage identity mismatch')
  } catch (error) { errors.push(`runner/provider smoke check failed: ${error.message}`) }
  if (manifest.build?.toolchain?.compilerTarget !== TARGET.compilerTarget) errors.push('compiler target ABI mismatch')
}

async function verifyPayloadFiles(root, manifest, errors) {
  let files
  try { files = await walkFiles(root) } catch (error) { errors.push(error.message); return }
  const actualPaths = files.map(item => item.relative).sort()
  if (!same(actualPaths, [...ALL_FILES].sort())) errors.push(`artifact file set mismatch: ${actualPaths.join(',')}`)
  const actualRecords = {}
  for (const item of files) {
    if (item.relative === 'manifest.json') continue
    const sha256 = await sha256File(item.path)
    actualRecords[item.relative] = { sha256, bytes: item.info.size }
    const expected = manifest.files?.[item.relative]
    if (!expected) continue
    if (expected.bytes !== item.info.size || expected.sha256 !== sha256) errors.push(`file integrity mismatch: ${item.relative}`)
  }
  if (Object.keys(actualRecords).length === PAYLOAD_FILES.length && manifest.payloadFilesSha256 !== payloadFilesSha256(actualRecords)) errors.push('actual payload inventory hash mismatch')

  const provider = actualRecords['provider/de405.bsp']
  if (provider && (provider.sha256 !== OFFICIAL_SOURCE.spkSha256 || provider.bytes !== OFFICIAL_SOURCE.spkBytes)) errors.push('unmodified DE405 provider identity mismatch')
  const sourceManifest = actualRecords['cspice/source-manifest.json']
  if (sourceManifest && sourceManifest.sha256 !== OFFICIAL_SOURCE.cspiceSourceManifestSha256) errors.push('CSPICE source manifest identity mismatch')
  if (sourceManifest) {
    try {
      const source = await readJson(join(root, 'cspice/source-manifest.json'))
      if (source.toolkitVersion !== OFFICIAL_SOURCE.cspiceToolkitVersion || source.acquisition?.archiveSha256 !== OFFICIAL_SOURCE.cspiceArchiveSha256 || source.files?.length !== OFFICIAL_SOURCE.cspiceSourceFileCount) errors.push('CSPICE source manifest metadata mismatch')
    } catch (error) { errors.push(`CSPICE source manifest parse failed: ${error.message}`) }
  }
  const buildProvenance = actualRecords['cspice/build-provenance.json']
  if (buildProvenance) {
    try {
      const build = await readJson(join(root, 'cspice/build-provenance.json'))
      if (build.toolkitVersion !== OFFICIAL_SOURCE.cspiceToolkitVersion || build.compiler !== TARGET.compiler || build.compilerTarget !== TARGET.compilerTarget || build.architecture !== TARGET.architecture || build.sourceManifestSha256 !== OFFICIAL_SOURCE.cspiceBuildSourceManifestSha256 || build.sourceFileCount !== OFFICIAL_SOURCE.cspiceBuildSourceFileCount || !CSPICE_FLAGS.every(flag => build.flags?.includes(flag)) || build.libraries?.cspice?.sha256 !== actualRecords['cspice/lib/cspice.a']?.sha256 || build.libraries?.csupport?.sha256 !== actualRecords['cspice/lib/csupport.a']?.sha256 || build.sourceManifestSha256 !== actualRecords['cspice/build-source-manifest.json']?.sha256) errors.push('CSPICE build provenance mismatch')
    } catch (error) { errors.push(`CSPICE build provenance parse failed: ${error.message}`) }
  }
  const golden = actualRecords['verification/astrology-ephemeris-golden-v1.json']
  if (golden) {
    try {
      const evidence = await readJson(join(root, 'verification/astrology-ephemeris-golden-v1.json'))
      if (evidence.schemaVersion !== ASTROLOGY_REFERENCE.schemaVersion || evidence.fixture?.id !== ASTROLOGY_REFERENCE.fixtureId || evidence.availableForInterpretation !== false || evidence.integrationStatus !== 'not_connected' || evidence.rawChart?.sha256 !== ASTROLOGY_REFERENCE.rawChartSha256 || evidence.ruleCore?.sha256 !== ASTROLOGY_REFERENCE.ruleCoreSha256 || golden.sha256 !== ASTROLOGY_REFERENCE.packetSha256) errors.push('Linux Astrology parity/activation contract mismatch')
      if (golden.sha256 !== ASTROLOGY_REFERENCE.packetSha256 || manifest.verification?.linux?.packetSha256 !== ASTROLOGY_REFERENCE.packetSha256) errors.push('Linux Astrology canonical packet hash mismatch')
      const reference = await readJson(DEFAULT_REFERENCE)
      if (!same(evidence.rawChart?.value, reference.rawChart?.value) || !same(evidence.ruleCore?.value, reference.ruleCore?.value)) errors.push('Linux/Mac Astrology numerical packet parity mismatch')
      const referenceBytes = await readFile(DEFAULT_REFERENCE)
      const evidenceBytes = await readFile(join(root, 'verification/astrology-ephemeris-golden-v1.json'))
      if (!referenceBytes.equals(evidenceBytes)) errors.push('Linux/Mac canonical packet bytes mismatch')
      const forbidden = JSON.stringify(evidence)
      for (const value of ['/Users/', '/private/tmp', 'native binary', 'spkBytes']) if (forbidden.includes(value)) errors.push(`forbidden verification metadata: ${value}`)
    } catch (error) { errors.push(`Astrology parity evidence parse failed: ${error.message}`) }
  }
}

export async function checkProducerDirectory(root, { verifyRuntime: shouldVerifyRuntime = true } = {}) {
  const errors = []
  const directory = resolve(root)
  let manifest
  try { manifest = await readJson(join(directory, 'manifest.json')) } catch (error) { return { status: 'fail', errors: [`manifest read failed: ${error.message}`] } }
  errors.push(...validateManifest(manifest))
  try {
    const info = await stat(join(directory, 'manifest.json'))
    if (!info.isFile()) errors.push('manifest is not a regular file')
  } catch (error) { errors.push(`manifest stat failed: ${error.message}`) }
  await verifyPayloadFiles(directory, manifest, errors)
  if (shouldVerifyRuntime && errors.length === 0) await verifyRuntime(directory, manifest, errors)
  return { status: errors.length ? 'fail' : 'pass', errors: [...new Set(errors)], manifest }
}

async function archiveEntries(archive) {
  const listing = execFileSync('tar', ['-tvzf', archive], { encoding: 'utf8' })
  const names = []
  const seen = new Set()
  for (const line of listing.split('\n').filter(Boolean)) {
    const kind = line[0]
    if (kind !== '-' && kind !== 'd') throw new Error(`archive contains non-regular entry: ${line}`)
    const name = line.slice(line.lastIndexOf(' ') + 1)
    const normalized = name.replace(/^\.\//, '').replace(/\/$/, '')
    if (!normalized && kind === 'd') continue
    if (!normalized || !isSafeRelativePath(normalized)) throw new Error(`archive contains unsafe path: ${name}`)
    if (seen.has(normalized)) throw new Error(`archive contains duplicate entry: ${normalized}`)
    seen.add(normalized)
    names.push(name)
  }
  return names
}

export async function checkProducerArchive(archive, options = {}) {
  const names = await archiveEntries(resolve(archive))
  if (!names.some(name => name.replace(/^\.\//, '') === 'manifest.json')) throw new Error('archive manifest missing')
  const extraction = await mkdtemp(join('/tmp', 'de405-linux-producer-check-'))
  try {
    execFileSync('tar', ['-xzf', resolve(archive), '--no-same-owner', '--no-same-permissions', '-C', extraction], { stdio: 'ignore' })
    return checkProducerDirectory(extraction, options)
  } finally {
    await rm(extraction, { recursive: true, force: true })
  }
}

function cliOptions(argv) {
  const options = {}
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index]
    if (value === '--directory' || value === '--archive') options[value.slice(2)] = argv[++index]
    else if (value === '--json') options.json = true
  }
  return options
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  try {
    const options = cliOptions(process.argv.slice(2))
    if (!options.directory && !options.archive) throw new Error('usage: --directory DIR | --archive FILE')
    const result = options.archive ? await checkProducerArchive(options.archive) : await checkProducerDirectory(options.directory)
    if (options.json) console.log(JSON.stringify(result, null, 2))
    else console.log(result.status === 'pass' ? 'ok: DE405 Linux producer artifact' : result.errors.map(error => `error: ${error}`).join('\n'))
    if (result.status !== 'pass') process.exitCode = 1
  } catch (error) {
    console.error(`DE405 Linux producer artifact check failed: ${error.message}`)
    process.exitCode = 1
  }
}

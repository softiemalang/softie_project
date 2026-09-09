import { createHash } from 'node:crypto'
import { createReadStream } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { posix } from 'node:path'

export const ARTIFACT_SCHEMA = 'de405-linux-producer-artifact-v0'
export const ARTIFACT_ID = 'de405-linux-producer-v0'
export const ARTIFACT_VERSION = '0.1.0'
export const WORKFLOW_PATH = '.github/workflows/de405-linux-producer-v0.yml'

export const OFFICIAL_SOURCE = Object.freeze({
  cspiceUrl: 'https://naif.jpl.nasa.gov/pub/naif/toolkit//C/PC_Linux_GCC_64bit/packages/cspice.tar.Z',
  cspiceArchiveSha256: '60a95b51a6472f1afe7e40d77ebdee43c12bb5b8823676ccc74692ddfede06ce',
  cspiceToolkitVersion: 'N0067',
  cspiceSourceManifestSha256: '9921db7667b999253d78bf814c93fda76bb04169abfa2a583d6eecffb43fb229',
  cspiceSourceFileCount: 2547,
  cspiceBuildSourceManifestSha256: '54a50975a8ea536bd5fc18add2d2fe481c35aaba07bebc1bcc630b76ba8925f1',
  cspiceBuildSourceFileCount: 2439,
  spkUrl: 'https://naif.jpl.nasa.gov/pub/naif/generic_kernels/spk/planets/a_old_versions/de405.bsp',
  spkSha256: '30a7113793ee5b6bf1e5546c6dfc21d9682d9ffabfe9b17b4bab27ba2ac75c89',
  spkBytes: 10898432,
})

export const COVERAGE = Object.freeze({
  startEt: '-1.5778799588160586e+09',
  endEt: '1.5778800641839132e+09',
  objectCount: 15,
  startReadable: '1950-01-01 00:00:41.183 ET',
  endReadable: '2050-01-01 00:01:04.183 ET',
  tool: 'spkobj_c+spkcov_c',
  toolVersion: 'N0067',
})

export const TARGET = Object.freeze({
  os: 'linux',
  architecture: 'x64',
  runnerLabel: 'ubuntu-24.04',
  compiler: 'gcc',
  compilerTarget: 'x86_64-linux-gnu',
  libcFamily: 'glibc',
})

export const NODE_VERSION = 'v22.23.1'

export const RUNNER = Object.freeze({
  version: 'de405-canonical-v2-runner',
  sourcePath: 'tools/de405-cspice-runner/src/de405_canonical_v2.c',
  sourceSha256: '798b208f65d17f1bf1972cbe9ad17a1f08b8859baa3880d14e1796b841a89426',
  binaryFormat: 'ELF 64-bit x86-64',
  inputMode: '--evaluate-spk-type2-batch',
  versionMode: '--version',
  coverageMode: '--coverage',
})

export const CSPICE_FLAGS = Object.freeze([
  '-std=c89',
  '-O2',
  '-ffp-contract=off',
  '-fno-fast-math',
  '-fPIC',
  '-DNON_UNIX_STDIO',
])

export const RUNNER_FLAGS = Object.freeze([
  '-std=c11',
  '-O2',
  '-ffp-contract=off',
  '-fno-fast-math',
  '-Wall',
  '-Wextra',
  '-Werror',
])

export const ASTROLOGY_REFERENCE = Object.freeze({
  fixturePath: 'test/fixtures/astrology/golden/astrology-ephemeris-golden-v1.json',
  schemaVersion: 'astrology-ephemeris-golden-evidence-v1',
  fixtureId: 'synthetic-de405-golden-2000-01-01T12:00:00Z',
  packetSha256: 'afabd5542479d761657f461050df649102843b867d6b985be2a274e2b3209aa',
  rawChartSha256: '0236f31d83a98110dca217a1215378d2de7bd2e502a5eee673ba1877d0304d71',
  ruleCoreSha256: 'dcccdcef89549c6b5374abe8b3a78ba58c7fd2bd99cb3bf70631c599ff9e1e2f',
})

export const PAYLOAD_FILES = Object.freeze([
  'bin/de405-canonical-v2-runner',
  'provider/de405.bsp',
  'cspice/lib/cspice.a',
  'cspice/lib/csupport.a',
  'cspice/source-manifest.json',
  'cspice/build-source-manifest.json',
  'cspice/build-provenance.json',
  'verification/astrology-ephemeris-golden-v1.json',
])

export const ALL_FILES = Object.freeze(['manifest.json', ...PAYLOAD_FILES])

export function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`
}

export function sha256Text(value) {
  return createHash('sha256').update(value).digest('hex')
}

export function sha256Bytes(value) {
  return createHash('sha256').update(value).digest('hex')
}

export async function sha256File(path) {
  const hash = createHash('sha256')
  for await (const chunk of createReadStream(path)) hash.update(chunk)
  return hash.digest('hex')
}

export async function readJson(path) {
  return JSON.parse(await readFile(path, 'utf8'))
}

export function isSafeRelativePath(value) {
  if (typeof value !== 'string' || !value || value.includes('\\') || value.startsWith('/')) return false
  const normalized = posix.normalize(value)
  return normalized === value && !value.split('/').includes('..') && normalized !== '.'
}

export function payloadFilesSha256(fileRecords) {
  const lines = Object.entries(fileRecords)
    .filter(([path]) => path !== 'manifest.json')
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([path, record]) => `${path}\0${record.sha256}\n`)
    .join('')
  return sha256Text(lines)
}

export function manifestIntegritySha256(manifest) {
  const candidate = structuredClone(manifest)
  candidate.manifestIntegritySha256 = null
  return sha256Text(stableJson(candidate))
}

export function sourceIdentity() {
  return {
    cspice: {
      sourceUrl: OFFICIAL_SOURCE.cspiceUrl,
      archiveSha256: OFFICIAL_SOURCE.cspiceArchiveSha256,
      toolkitVersion: OFFICIAL_SOURCE.cspiceToolkitVersion,
      sourceManifestSha256: OFFICIAL_SOURCE.cspiceSourceManifestSha256,
      sourceFileCount: OFFICIAL_SOURCE.cspiceSourceFileCount,
      sourceIncluded: false,
    },
    spk: {
      sourceUrl: OFFICIAL_SOURCE.spkUrl,
      sha256: OFFICIAL_SOURCE.spkSha256,
      bytes: OFFICIAL_SOURCE.spkBytes,
      identity: 'unmodified_official_naif_de405_bsp',
      coverage: COVERAGE,
    },
    sourceRole: 'independent_cross_reference',
    coverageRole: 'overlap_only',
    canonicalEligible: false,
    fallbackAllowed: false,
  }
}

import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { generateBuildSource } from './generate-build-source.mjs'

const root = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(root, '../..')

const EXPECTED_READER_SHA256 = '18f32f073c1a345850d9deebc8b53b06c83a386c066b566f65001b51adeb7120'
const EXPECTED_BINARY_SIZE = 55900416
const EXPECTED_BINARY_SHA256 = '7ec77287b6fddd3d7adabb87709ee5e926e3d1123fbae5d1485a42913cf175e7'

async function sha256File(path) {
  return createHash('sha256').update(await readFile(path)).digest('hex')
}

async function main() {
  const compiler = process.env.FC || '/opt/homebrew/bin/gfortran'
  let compilerVersion = 'unknown'

  try {
    const versionOut = execFileSync(compiler, ['--version'], { encoding: 'utf8' })
    compilerVersion = versionOut.split('\n')[0]
  } catch (err) {
    throw new Error(`gfortran compiler check failed (${compiler}): ${err.message}. Please install gfortran.`)
  }

  const readerSourcePath = process.env.JPL_TESTEPH_PATH
    ? resolve(process.env.JPL_TESTEPH_PATH)
    : resolve(root, 'fixtures/testeph.f')

  const jplBinaryPath = process.env.JPL_BINARY_PATH
    ? resolve(process.env.JPL_BINARY_PATH)
    : resolve(root, 'fixtures/lnxp1600p2200.405')

  // Local file & hash checks
  try {
    await stat(readerSourcePath)
  } catch {
    throw new Error(`JPL reader source missing at ${readerSourcePath}. Run 'node scripts/fetch-de405-jpl-sources.mjs' first.`)
  }

  const readerHash = await sha256File(readerSourcePath)
  if (readerHash !== EXPECTED_READER_SHA256) {
    throw new Error(`Reader source hash mismatch: got ${readerHash}, expected ${EXPECTED_READER_SHA256}`)
  }

  try {
    const binaryStat = await stat(jplBinaryPath)
    if (binaryStat.size !== EXPECTED_BINARY_SIZE) {
      throw new Error(`JPL binary size mismatch: got ${binaryStat.size}, expected ${EXPECTED_BINARY_SIZE}`)
    }
  } catch (err) {
    throw new Error(`JPL binary file missing or invalid at ${jplBinaryPath}: ${err.message}. Run 'node scripts/fetch-de405-jpl-sources.mjs' first.`)
  }

  const binaryHash = await sha256File(jplBinaryPath)
  if (binaryHash !== EXPECTED_BINARY_SHA256) {
    throw new Error(`JPL binary hash mismatch: got ${binaryHash}, expected ${EXPECTED_BINARY_SHA256}`)
  }

  const buildDir = resolve(root, 'build')
  await mkdir(buildDir, { recursive: true })

  // Perform deterministic DE405 build tailoring
  const { generatedFile, outputSha256: tailoredSourceSha256, provenance } = await generateBuildSource(readerSourcePath, buildDir)

  const runnerSource = resolve(root, 'src/de405_jpl_reader_runner.f')
  const runnerBinary = resolve(buildDir, 'de405-jpl-canonical-v2-runner')
  const wrapperSourceSha256 = await sha256File(runnerSource)

  const flags = ['-std=f2008', '-ffixed-line-length-none', '-O2', '-Wall', '-Wextra', runnerSource, generatedFile, '-o', runnerBinary]
  console.log(`Compiling native runner: ${compiler} ${flags.join(' ')}`)

  execFileSync(compiler, flags, { stdio: 'inherit', cwd: root })

  const runnerHash = await sha256File(runnerBinary)

  const buildMetadata = {
    toolkitVersion: 'official-testeph.f',
    compiler,
    compilerPath: compiler,
    compilerVersion,
    buildFlags: flags,
    compilerFlags: flags.slice(0, -4),
    platform: process.platform,
    architecture: process.arch,
    KSIZE: 2036,
    NRECL: 4,
    KM: true,
    readerSourceSha256: readerHash,
    originalReaderSourceSha256: provenance.sourceExtraction.sourceSha256,
    extractedReaderSourceSha256: provenance.sourceExtraction.extractedSha256,
    tailoredReaderSourceSha256: tailoredSourceSha256,
    wrapperSourceSha256,
    jplBinarySha256: binaryHash,
    jplBinarySizeBytes: EXPECTED_BINARY_SIZE,
    entryPoint: 'DPLEPH',
    buildCommand: [compiler, ...flags],
    extractionProvenance: provenance.sourceExtraction,
    buildTailoringProvenance: provenance.buildTailoring,
    binarySha256: runnerHash,
    runnerBinarySha256: runnerHash
  }

  await writeFile(resolve(buildDir, 'runner-build.json'), JSON.stringify(buildMetadata, null, 2) + '\n')
  console.log(JSON.stringify({ binary: runnerBinary, binarySha256: runnerHash }, null, 2))
}


main().catch(err => {
  console.error(`Build failed: ${err.message}`)
  process.exitCode = 1
})

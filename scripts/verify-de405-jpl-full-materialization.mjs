import { spawnSync } from 'node:child_process'
import { readFileSync, existsSync } from 'node:fs'
import { resolve, join } from 'node:path'
import readline from 'node:readline'
import { createReadStream } from 'node:fs'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { createHash } from 'node:crypto'

const root = resolve('.')
const generator = join(root, 'scripts/generate-de405-jpl-canonical-v2.mjs')
const validator = join(root, 'scripts/validate-de405-jpl-canonical-v2.mjs')
const manifestTemplate = join(root, 'test/fixtures/astrology/de405/canonical-v2/manifest.template.json')
const jplRunner = join(root, 'tools/de405-jpl-reader/run.mjs')
const officialBinary = join(root, 'tools/de405-jpl-reader/fixtures/lnxp1600p2200.405')
const readerSource = join(root, 'tools/de405-jpl-reader/fixtures/testeph.f')

function runCommand(cmd, args) {
  const result = spawnSync(process.execPath, [cmd, ...args], { encoding: 'utf8', cwd: root })
  return result
}

function sha256File(path) {
  const content = readFileSync(path)
  return createHash('sha256').update(content).digest('hex')
}

async function checkFile(input) {
  const startEt = -3155716800
  const endExEt = 3187252800
  const step = 864000
  const expectedTargets = [1, 2, 4, 5, 6, 7, 8, 9, 10, 301]
  const expectedTimestamps = Math.ceil((endExEt - startEt) / step)
  const expectedRowCount = expectedTimestamps * expectedTargets.length

  const actualSet = new Set()
  let rowCount = 0
  let nonFiniteValues = 0
  let duplicateKeys = 0

  const rl = readline.createInterface({
    input: createReadStream(input),
    crlfDelay: Infinity
  })

  for await (const line of rl) {
    if (!line.trim()) continue
    rowCount++
    const parsed = JSON.parse(line)
    const et = Number(parsed.etSeconds)
    const tid = Number(parsed.targetId)
    const key = `${et}_${tid}`
    if (actualSet.has(key)) {
      duplicateKeys++
    }
    actualSet.add(key)

    // Check NaNs/Infinity
    const numbers = [
      Number(parsed.positionKm.x), Number(parsed.positionKm.y), Number(parsed.positionKm.z),
      Number(parsed.velocityKmPerSecond.x), Number(parsed.velocityKmPerSecond.y), Number(parsed.velocityKmPerSecond.z)
    ]
    for (const n of numbers) {
      if (Number.isNaN(n) || !Number.isFinite(n)) {
        nonFiniteValues++
      }
    }
  }

  let missingKeys = 0
  for (let et = startEt; et < endExEt; et += step) {
    for (const tid of expectedTargets) {
      if (!actualSet.has(`${et}_${tid}`)) {
        missingKeys++
      }
    }
  }
  
  const unexpectedKeys = actualSet.size - (expectedRowCount - missingKeys)

  return { rowCount, duplicateKeys, missingKeys, unexpectedKeys, nonFiniteValues, expectedRowCount, expectedKeyCount: expectedRowCount }
}

async function run() {
  const tmpRoot = mkdtempSync(join(tmpdir(), 'de405-jpl-full-materialization-'))
  
  const runs = []
  let byteIdentical = false
  let cmpExitCode = null
  let nonDeterministicManifestFields = ['createdByCommit', 'generationCommand', 'output.generatedByRunnerSha256']
  
  try {
    for (let i = 1; i <= 2; i++) {
      const outDir = join(tmpRoot, `out${i}`)
      
      const genArgs = ['--manifest', manifestTemplate, '--runner', jplRunner, '--output-dir', outDir, '--jpl-binary', officialBinary, '--reader-source', readerSource]
      const genRun = runCommand(generator, genArgs)
      
      const jsonlPath = join(outDir, 'de405-canonical-v2-jpl-regular-grid.jsonl')
      const manifestPath = join(outDir, 'manifest.json')
      
      const valArgs = ['--manifest', manifestPath, '--input', jsonlPath]
      const valRun = genRun.status === 0 ? runCommand(validator, valArgs) : { status: null }
      
      let fileStats = { rowCount: 0, duplicateKeys: 0, missingKeys: 0, unexpectedKeys: 0, nonFiniteValues: 0 }
      let fileHash = ''
      let manifestOutputSha256 = ''
      let manifestHashMatches = false
      let runnerHashMatches = false
      
      if (genRun.status === 0 && existsSync(jsonlPath)) {
        fileStats = await checkFile(jsonlPath)
        fileHash = sha256File(jsonlPath)
        
        if (existsSync(manifestPath)) {
          const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
          manifestOutputSha256 = manifest.output?.sha256 || ''
          manifestHashMatches = manifestOutputSha256 === fileHash
          
          const runnerHash = sha256File(jplRunner)
          runnerHashMatches = manifest.output?.generatedByRunnerSha256 === manifest.runner?.binarySha256
        }
      }
      
      runs.push({
        generationExitCode: genRun.status,
        validatorExitCode: valRun.status,
        rowCount: fileStats.rowCount,
        duplicateKeys: fileStats.duplicateKeys,
        missingKeys: fileStats.missingKeys,
        unexpectedKeys: fileStats.unexpectedKeys,
        nonFiniteValues: fileStats.nonFiniteValues,
        sha256: fileHash,
        manifestOutputSha256,
        manifestHashMatches,
        runnerHashMatches
      })
      
      if (genRun.status !== 0 || valRun.status !== 0) {
        break // fail fast if generation or validation fails
      }
    }
    
    if (runs.length === 2 && runs[0].generationExitCode === 0 && runs[1].generationExitCode === 0) {
      const cmpRun = spawnSync('cmp', [join(tmpRoot, 'out1', 'de405-canonical-v2-jpl-regular-grid.jsonl'), join(tmpRoot, 'out2', 'de405-canonical-v2-jpl-regular-grid.jsonl')], { encoding: 'utf8' })
      cmpExitCode = cmpRun.status
      byteIdentical = cmpExitCode === 0 && runs[0].sha256 === runs[1].sha256
    }
    
    const passed = runs.length === 2 && byteIdentical && runs.every(r => 
      r.generationExitCode === 0 && r.validatorExitCode === 0 && 
      r.rowCount === 73420 && r.missingKeys === 0 && r.duplicateKeys === 0 && 
      r.unexpectedKeys === 0 && r.nonFiniteValues === 0 && r.manifestHashMatches
    )
    
    console.log(JSON.stringify({
      schemaVersion: 1,
      executionSucceeded: true,
      passed,
      expectedRowCount: 73420,
      expectedKeyCount: 73420,
      runs,
      byteIdentical,
      cmpExitCode,
      nonDeterministicManifestFields,
      failures: passed ? [] : ['Verification failed']
    }, null, 2))
    
    process.exit(passed ? 0 : 1)
  } catch (e) {
    console.error(JSON.stringify({
      schemaVersion: 1,
      executionSucceeded: false,
      passed: false,
      failures: [e.message]
    }))
    process.exit(1)
  } finally {
    rmSync(tmpRoot, { recursive: true, force: true })
  }
}

run()

#!/usr/bin/env node
import { createHash } from 'node:crypto'
import { mkdtemp, readFile, rename, rm, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { readJson, validateBytes, writeJson } from './lib/de405-canonical-v2-io.mjs'
import { assertMaterializationProfile, formatDecimal, TARGETS } from './lib/de405-canonical-v2-contract.mjs'
import { JPL_BINARY_SHA256, JPL_BINARY_SIZE_BYTES, JPL_READER_SOURCE_SHA256 } from './lib/de405-jpl-reader-contract.mjs'
import { sha256 } from './lib/de405-canonical-v2-hash.mjs'

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, val, i, arr) => {
    if (val.startsWith('--')) acc.push([val.slice(2), arr[i + 1]])
    return acc
  }, [])
)

let staging = null

async function processRawStreamToCanonicalJsonl(rawStreamFile, jsonlOutputFile) {
  const content = await readFile(rawStreamFile, 'utf8')
  const lines = content.trimEnd().split('\n').filter(Boolean)
  const rows = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    // Support both raw JSON format (from fake runner) and CSV raw stream (from Fortran runner)
    if (line.startsWith('{')) {
      const parsed = JSON.parse(line)
      const targetObj = TARGETS.find(t => t.targetId === parsed.targetId)
      if (!targetObj) throw new Error(`line ${i + 1}: unknown targetId ${parsed.targetId}`)
      
      const etFormatted = formatDecimal(Number(parsed.etSeconds))
      const x = formatDecimal(Number(parsed.positionKm?.x ?? parsed.x))
      const y = formatDecimal(Number(parsed.positionKm?.y ?? parsed.y))
      const z = formatDecimal(Number(parsed.positionKm?.z ?? parsed.z))
      const vx = formatDecimal(Number(parsed.velocityKmPerSecond?.x ?? parsed.vx))
      const vy = formatDecimal(Number(parsed.velocityKmPerSecond?.y ?? parsed.vy))
      const vz = formatDecimal(Number(parsed.velocityKmPerSecond?.z ?? parsed.vz))

      const rowObj = {
        schemaVersion: 'de405-canonical-v2',
        etSeconds: etFormatted,
        targetId: targetObj.targetId,
        target: targetObj.target,
        targetType: targetObj.targetType,
        observerId: 399,
        observer: 'EARTH',
        frame: 'J2000',
        aberrationCorrection: 'NONE',
        positionKm: { x, y, z },
        velocityKmPerSecond: { x: vx, y: vy, z: vz }
      }
      rows.push(JSON.stringify(rowObj))
    } else {
      // CSV format: etSeconds,targetId,x,y,z,vx,vy,vz
      const parts = line.split(',')
      if (parts.length < 8) throw new Error(`line ${i + 1}: invalid raw CSV stream format`)
      const etNum = Number(parts[0])
      const targetId = Number(parts[1])
      const xNum = Number(parts[2])
      const yNum = Number(parts[3])
      const zNum = Number(parts[4])
      const vxNum = Number(parts[5])
      const vyNum = Number(parts[6])
      const vzNum = Number(parts[7])

      const targetObj = TARGETS.find(t => t.targetId === targetId)
      if (!targetObj) throw new Error(`line ${i + 1}: unknown targetId ${targetId}`)

      const rowObj = {
        schemaVersion: 'de405-canonical-v2',
        etSeconds: formatDecimal(etNum),
        targetId: targetObj.targetId,
        target: targetObj.target,
        targetType: targetObj.targetType,
        observerId: 399,
        observer: 'EARTH',
        frame: 'J2000',
        aberrationCorrection: 'NONE',
        positionKm: {
          x: formatDecimal(xNum),
          y: formatDecimal(yNum),
          z: formatDecimal(zNum)
        },
        velocityKmPerSecond: {
          x: formatDecimal(vxNum),
          y: formatDecimal(vyNum),
          z: formatDecimal(vzNum)
        }
      }
      rows.push(JSON.stringify(rowObj))
    }
  }

  await writeFile(jsonlOutputFile, rows.join('\n') + '\n', 'utf8')
}

async function main() {
  if (!args.manifest || !args.runner || !args['output-dir']) {
    throw new Error('usage: --manifest FILE --runner FILE --output-dir DIR [--jpl-binary FILE] [--reader-source FILE]')
  }

  const manifestPath = resolve(args.manifest)
  const runner = resolve(args.runner)
  const outputDir = resolve(args['output-dir'])
  const manifest = await readJson(manifestPath)
  const profile = assertMaterializationProfile(manifest)

  if (profile.adapter !== 'jpl-official') {
    throw new Error('JPL generator requires jpl-official adapter profile')
  }

  // Validate reader source and JPL binary if provided in args or manifest
  const jplBinaryPath = args['jpl-binary'] ? resolve(args['jpl-binary']) : null
  const readerSourcePath = args['reader-source'] ? resolve(args['reader-source']) : null

  if (jplBinaryPath) {
    const binaryInfo = await stat(jplBinaryPath)
    if (binaryInfo.size !== JPL_BINARY_SIZE_BYTES || (await sha256(jplBinaryPath)) !== JPL_BINARY_SHA256) {
      throw new Error('JPL binary hash or size mismatch')
    }
  }

  if (readerSourcePath) {
    if ((await sha256(readerSourcePath)) !== JPL_READER_SOURCE_SHA256) {
      throw new Error('Reader source SHA-256 mismatch')
    }
  }

  // Check runner hash
  const runnerInfo = await stat(runner)
  const runnerHash = await sha256(runner)
  if (manifest.runner?.binarySha256 && manifest.runner.binarySha256 !== runnerHash) {
    throw new Error('runner hash mismatch')
  }

  try {
    await stat(outputDir)
    throw new Error('final output already exists')
  } catch (error) {
    if (error.message === 'final output already exists') throw error
  }

  staging = await mkdtemp(join(dirname(outputDir), '.canonical-v2-jpl-staging-'))
  const candidates = []

  for (let runIdx = 0; runIdx < 2; runIdx++) {
    const rawFile = join(staging, `raw-stream-${runIdx + 1}.tmp`)
    const candidateJsonl = join(staging, `candidate-${runIdx + 1}.jsonl`)

    const runnerArgs = [
      '--stream-jpl-states',
      '--start-et', profile.startEt,
      '--count', String(profile.timestampCount),
      '--step-seconds', String(profile.stepSeconds),
      '--output', rawFile
    ]
    if (jplBinaryPath) {
      runnerArgs.push('--binary', jplBinaryPath)
    }

    const runnerBin = runner.endsWith('.mjs') ? process.execPath : runner
    const passRunnerArgs = runner.endsWith('.mjs') ? [runner, ...runnerArgs] : runnerArgs
    const run = spawnSync(runnerBin, passRunnerArgs, { encoding: 'utf8' })
    if (run.status !== 0) {
      throw new Error(`runner failed: ${run.stderr || run.stdout}`)
    }

    await processRawStreamToCanonicalJsonl(rawFile, candidateJsonl)
    await validateBytes(candidateJsonl, manifest)
    candidates.push({ file: candidateJsonl, hash: await sha256(candidateJsonl) })
  }

  if (candidates[0].hash !== candidates[1].hash) {
    throw new Error('candidate hash mismatch')
  }

  const isSmoke = profile.name === 'jpl-full-range-smoke' || manifest.materializationProfile === 'jpl-full-range-smoke'
  const isSynthetic = manifest.synthetic === true

  const outputFileName = isSmoke
    ? 'de405-canonical-v2-jpl-smoke.jsonl'
    : 'de405-canonical-v2-jpl-regular-grid.jsonl'

  const outputFile = join(staging, outputFileName)
  await rename(candidates[1].file, outputFile)
  const outputInfo = await stat(outputFile)

  const resultManifest = {
    ...manifest,
    status: isSynthetic ? 'smoke_draft' : (isSmoke ? 'smoke_verified' : 'verified'),
    provenanceStatus: isSynthetic ? 'synthetic_contract_evidence' : (isSmoke ? 'test_only' : 'verified'),
    reader: {
      ...manifest.reader,
      targetContractStatus: 'confirmed'
    },
    runner: {
      ...manifest.runner,
      binarySha256: runnerHash
    },
    output: {
      file: outputFileName,
      sizeBytes: outputInfo.size,
      rowCount: profile.expectedRowCount,
      sha256: candidates[0].hash,
      generatedByRunnerSha256: runnerHash
    }
  }

  await writeJson(join(staging, 'manifest.json'), resultManifest)
  await validateBytes(outputFile, resultManifest)

  await rename(staging, outputDir)
  staging = null
  console.log(JSON.stringify({ outputDir, sha256: candidates[0].hash, byteIdentity: true }))
}

main().catch(error => {
  console.error(`canonical-v2 JPL generation failed: ${error.message}`)
  process.exitCode = 1
}).finally(async () => {
  if (staging) await rm(staging, { recursive: true, force: true }).catch(() => {})
})

#!/usr/bin/env node
import { mkdtemp, rename, rm, stat } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { readJson, validateBytes, writeJson } from './lib/de405-canonical-v2-io.mjs'
import { assertMaterializationProfile, assertRequestedEtCoverage } from './lib/de405-canonical-v2-contract.mjs'
import { sha256 } from './lib/de405-canonical-v2-hash.mjs'

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, val, i, arr) => {
    if (val.startsWith('--')) acc.push([val.slice(2), arr[i + 1]])
    return acc
  }, [])
)

let staging = null

try {
  if (!args.manifest || !args.runner || !args['output-dir']) {
    throw new Error('usage: --manifest FILE --runner FILE --output-dir DIR [--spk FILE] [--jpl-binary FILE] [--reader-source FILE]')
  }

  const manifestPath = resolve(args.manifest)
  const manifest = await readJson(manifestPath)
  const profile = assertMaterializationProfile(manifest)

  if (profile.adapter === 'jpl-official') {
    const jplGeneratorScript = resolve(dirname(fileURLToPath(import.meta.url)), 'generate-de405-jpl-canonical-v2.mjs')
    const passArgs = [
      jplGeneratorScript,
      '--manifest', manifestPath,
      '--runner', resolve(args.runner),
      '--output-dir', resolve(args['output-dir'])
    ]
    if (args['jpl-binary']) passArgs.push('--jpl-binary', resolve(args['jpl-binary']))
    if (args['reader-source']) passArgs.push('--reader-source', resolve(args['reader-source']))

    const run = spawnSync(process.execPath, passArgs, { encoding: 'utf8', stdio: 'inherit' })
    if (run.status !== 0) {
      throw new Error(`JPL generator failed with exit status ${run.status}`)
    }
    process.exit(0)
  }

  if (profile.adapter !== 'cspice-overlap') {
    throw new Error(`Unsupported materialization adapter: ${profile.adapter}`)
  }

  if (!args.spk) throw new Error('CSPICE generator requires --spk FILE')

  const spk = resolve(args.spk)
  const runner = resolve(args.runner)
  const outputDir = resolve(args['output-dir'])

  assertRequestedEtCoverage(manifest)
  if (manifest.materializationProfile !== 'cspice-overlap-smoke') {
    throw new Error('cspice runner is restricted to cspice-overlap-smoke')
  }
  if (manifest.status !== 'smoke_draft' || manifest.provenanceStatus !== 'test_only') {
    throw new Error('manifest is not an eligible overlap-smoke draft')
  }

  const sourceInfo = await stat(spk)
  if (manifest.sourceFiles?.spk?.sizeBytes !== sourceInfo.size || manifest.sourceFiles?.spk?.sha256 !== await sha256(spk)) {
    throw new Error('SPK source hash or size mismatch')
  }

  const runnerInfo = await stat(runner)
  if (manifest.runner?.binarySha256 !== await sha256(runner)) {
    throw new Error('runner hash mismatch')
  }

  try {
    await stat(outputDir)
    throw new Error('final output already exists')
  } catch (error) {
    if (error.message === 'final output already exists') throw error
  }

  const spkHash = await sha256(spk)
  const runnerHash = await sha256(runner)

  staging = await mkdtemp(join(dirname(outputDir), '.canonical-v2-staging-'))
  const candidates = []

  for (let i = 0; i < 2; i++) {
    const file = join(staging, `candidate-${i + 1}.jsonl`)
    const run = spawnSync(runner, [
      '--generate-overlap-smoke',
      '--spk', spk,
      '--start-et', profile.startEt,
      '--count', String(profile.timestampCount),
      '--step-seconds', String(profile.stepSeconds),
      '--output', file
    ], { encoding: 'utf8' })
    if (run.status !== 0) throw new Error(`runner failed: ${run.stderr || run.stdout}`)
    await validateBytes(file, manifest)
    candidates.push({ file, hash: await sha256(file) })
  }

  if (candidates[0].hash !== candidates[1].hash) throw new Error('candidate hash mismatch')

  const outputFileName = 'de405-canonical-v2-overlap-smoke.jsonl'
  const outputFile = join(staging, outputFileName)
  await rename(candidates[1].file, outputFile)
  const outputInfo = await stat(outputFile)

  const resultManifest = {
    ...manifest,
    status: 'smoke_verified',
    provenanceStatus: 'test_only',
    sourceFiles: { ...manifest.sourceFiles, spk: { ...manifest.sourceFiles.spk, sizeBytes: sourceInfo.size, sha256: spkHash } },
    runner: { ...manifest.runner, binarySha256: runnerHash },
    output: { file: outputFileName, sizeBytes: outputInfo.size, rowCount: profile.expectedRowCount, sha256: candidates[0].hash, generatedByRunnerSha256: runnerHash }
  }

  await writeJson(join(staging, 'manifest.json'), resultManifest)
  await validateBytes(outputFile, resultManifest)

  await rename(staging, outputDir)
  staging = null
  console.log(JSON.stringify({ outputDir, sha256: candidates[0].hash, byteIdentity: true }))
} catch (error) {
  console.error(`canonical-v2 generation failed: ${error.message}`)
  process.exitCode = 1
} finally {
  if (staging) await rm(staging, { recursive: true, force: true }).catch(() => {})
}

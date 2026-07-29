#!/usr/bin/env node
import { stat } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { readJson, validateBytes } from './lib/de405-canonical-v2-io.mjs'
import { REQUIRED_MANIFEST_FIELDS, assertMaterializationProfile, assertRequestedEtCoverage } from './lib/de405-canonical-v2-contract.mjs'
import { sha256 } from './lib/de405-canonical-v2-hash.mjs'

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, val, i, arr) => {
    if (val.startsWith('--')) acc.push([val.slice(2), arr[i + 1]])
    return acc
  }, [])
)

try {
  if (!args.manifest || !args.input) throw new Error('usage: --manifest FILE --input JSONL')
  const manifestPath = resolve(args.manifest)
  const manifest = await readJson(manifestPath)

  const profile = assertMaterializationProfile(manifest)

  if (profile.adapter === 'jpl-official') {
    const jplValidatorScript = resolve(dirname(fileURLToPath(import.meta.url)), 'validate-de405-jpl-canonical-v2.mjs')
    const passArgs = [
      jplValidatorScript,
      '--manifest', manifestPath,
      '--input', resolve(args.input)
    ]
    if (args.runner) passArgs.push('--runner', resolve(args.runner))
    if (args['jpl-binary']) passArgs.push('--jpl-binary', resolve(args['jpl-binary']))
    if (args['reader-source']) passArgs.push('--reader-source', resolve(args['reader-source']))

    const run = spawnSync(process.execPath, passArgs, { encoding: 'utf8', stdio: 'inherit' })
    if (run.status !== 0) {
      throw new Error(`JPL validator failed with exit status ${run.status}`)
    }
    process.exit(0)
  }

  if (manifest.manifestSchemaVersion !== 2) throw new Error('manifest schema mismatch')
  if (manifest.canonicalId?.includes('legacy') || manifest.contractDocument?.includes('cross-reference')) throw new Error('Legacy input')
  for (const field of REQUIRED_MANIFEST_FIELDS) if (!(field in manifest)) throw new Error(`missing manifest field: ${field}`)
  assertRequestedEtCoverage(manifest)

  if (manifest.materializationProfile === 'cspice-overlap-smoke') {
    if (manifest.canonical !== false || manifest.status !== 'smoke_verified' || manifest.provenanceStatus !== 'test_only') {
      throw new Error('manifest is not verified smoke evidence')
    }
  }

  const result = await validateBytes(resolve(args.input), manifest)
  if (args.spk) {
    const sourceInfo = await stat(resolve(args.spk))
    if (manifest.sourceFiles?.spk?.sizeBytes !== sourceInfo.size || manifest.sourceFiles?.spk?.sha256 !== await sha256(resolve(args.spk))) {
      throw new Error('SPK source hash or size mismatch')
    }
  }

  if (args.runner && manifest.runner?.binarySha256 !== await sha256(resolve(args.runner))) {
    throw new Error('runner hash mismatch')
  }

  const digest = await sha256(resolve(args.input))
  const info = await stat(resolve(args.input))
  if (manifest.output.rowCount !== result.rowCount || manifest.output.sizeBytes !== info.size || manifest.output.sha256 !== digest) {
    throw new Error('output metadata mismatch')
  }
  console.log(JSON.stringify({ valid: true, rowCount: result.rowCount, sizeBytes: info.size, sha256: digest }))
} catch (error) {
  console.error(`canonical-v2 validation failed: ${error.message}`)
  process.exitCode = 1
}

#!/usr/bin/env node
import { stat } from 'node:fs/promises'
import { resolve } from 'node:path'
import { readJson, validateBytes } from './lib/de405-canonical-v2-io.mjs'
import { REQUIRED_MANIFEST_FIELDS, assertMaterializationProfile } from './lib/de405-canonical-v2-contract.mjs'
import { JPL_BINARY_SHA256, JPL_BINARY_SIZE_BYTES, JPL_READER_SOURCE_SHA256 } from './lib/de405-jpl-reader-contract.mjs'
import { sha256 } from './lib/de405-canonical-v2-hash.mjs'

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, val, i, arr) => {
    if (val.startsWith('--')) acc.push([val.slice(2), arr[i + 1]])
    return acc
  }, [])
)

try {
  if (!args.manifest || !args.input) throw new Error('usage: --manifest FILE --input JSONL [--jpl-binary FILE] [--reader-source FILE]')
  const manifest = await readJson(resolve(args.manifest))
  if (manifest.manifestSchemaVersion !== 2) throw new Error('manifest schema mismatch')
  if (manifest.canonicalId?.includes('legacy') || manifest.contractDocument?.includes('cross-reference')) throw new Error('Legacy input')

  for (const field of REQUIRED_MANIFEST_FIELDS) {
    if (!(field in manifest)) throw new Error(`missing manifest field: ${field}`)
  }

  const profile = assertMaterializationProfile(manifest)

  if (profile.adapter !== 'jpl-official') {
    throw new Error('validate-de405-jpl requires jpl-official adapter profile')
  }

  if (manifest.reader?.targetContractStatus !== 'confirmed') {
    throw new Error('JPL reader target contract status must be confirmed')
  }

  if (manifest.synthetic === true) {
    if (manifest.canonical === true || manifest.canonicalEligible === true || manifest.provenanceStatus !== 'synthetic_contract_evidence') {
      throw new Error('synthetic artifact cannot claim canonical status')
    }
  }

  if (manifest.materializationProfile === 'jpl-full-range-regular-grid' && !manifest.synthetic) {
    if (manifest.canonical !== true || manifest.status !== 'verified' || manifest.provenanceStatus !== 'verified') {
      throw new Error('manifest is not verified canonical JPL v2')
    }
  }

  if (manifest.materializationProfile === 'jpl-full-range-smoke') {
    if (manifest.canonical !== false || !['smoke_verified', 'smoke_draft'].includes(manifest.status) || !['test_only', 'synthetic_contract_evidence'].includes(manifest.provenanceStatus)) {
      throw new Error('manifest is not verified smoke evidence')
    }
  }

  const result = await validateBytes(resolve(args.input), manifest)

  if (args['jpl-binary']) {
    const binaryInfo = await stat(resolve(args['jpl-binary']))
    if (binaryInfo.size !== JPL_BINARY_SIZE_BYTES || (await sha256(resolve(args['jpl-binary']))) !== JPL_BINARY_SHA256) {
      throw new Error('JPL binary hash or size mismatch')
    }
  }

  if (args['reader-source']) {
    if ((await sha256(resolve(args['reader-source']))) !== JPL_READER_SOURCE_SHA256) {
      throw new Error('Reader source SHA-256 mismatch')
    }
  }

  if (args.runner && manifest.runner?.binarySha256 !== (await sha256(resolve(args.runner)))) {
    throw new Error('runner hash mismatch')
  }

  const digest = await sha256(resolve(args.input))
  const info = await stat(resolve(args.input))
  if (manifest.output.rowCount !== result.rowCount || manifest.output.sizeBytes !== info.size || manifest.output.sha256 !== digest) {
    throw new Error('output metadata mismatch')
  }

  console.log(JSON.stringify({ valid: true, rowCount: result.rowCount, sizeBytes: info.size, sha256: digest }))
} catch (error) {
  console.error(`canonical-v2 JPL validation failed: ${error.message}`)
  process.exitCode = 1
}

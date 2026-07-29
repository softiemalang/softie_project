#!/usr/bin/env node
import { stat } from 'node:fs/promises'
import { resolve } from 'node:path'
import { readJson, validateBytes } from './lib/de405-canonical-v2-io.mjs'
import { REQUIRED_MANIFEST_FIELDS, TARGETS, assertGridManifest } from './lib/de405-canonical-v2-contract.mjs'
import { sha256 } from './lib/de405-canonical-v2-hash.mjs'

const args = Object.fromEntries(process.argv.slice(2).reduce((a, v, i, x) => v.startsWith('--') ? (a.push([v.slice(2), x[i + 1]]), a) : a, []))
try {
  if (!args.manifest || !args.input) throw new Error('usage: --manifest FILE --input JSONL')
  const manifest = await readJson(resolve(args.manifest))
  if (manifest.manifestSchemaVersion !== 2 || manifest.canonical !== true || manifest.status !== 'verified' || manifest.provenanceStatus !== 'verified') throw new Error('manifest is not verified canonical v2')
  if (manifest.canonicalId?.includes('legacy') || manifest.contractDocument?.includes('cross-reference')) throw new Error('Legacy input')
  for (const field of REQUIRED_MANIFEST_FIELDS) if (!(field in manifest)) throw new Error(`missing manifest field: ${field}`)
  assertGridManifest(manifest)
  if (JSON.stringify(manifest.targets.map(t => t.targetId)) !== JSON.stringify(TARGETS.map(t => t.targetId))) throw new Error('target list mismatch')
  const result = await validateBytes(resolve(args.input), manifest)
  const digest = await sha256(resolve(args.input)); const info = await stat(resolve(args.input))
  if (manifest.output.rowCount !== result.rowCount || manifest.output.sizeBytes !== info.size || manifest.output.sha256 !== digest) throw new Error('output metadata mismatch')
  console.log(JSON.stringify({ valid: true, rowCount: result.rowCount, sizeBytes: info.size, sha256: digest }))
} catch (error) { console.error(`canonical-v2 validation failed: ${error.message}`); process.exitCode = 1 }

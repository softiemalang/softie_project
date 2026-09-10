#!/usr/bin/env node

import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const args = Object.fromEntries(process.argv.slice(2).map((value, index, all) => value.startsWith('--') ? [value.slice(2), all[index + 1]] : []).filter(Boolean))
const leftPath = resolve(args.left || '')
const rightPath = resolve(args.right || '')
const leftManifestPath = resolve(args['left-manifest'] || '')
const rightManifestPath = resolve(args['right-manifest'] || '')

function fail(message) {
  throw new Error(message)
}

const sha256 = (value) => createHash('sha256').update(value).digest('hex')

async function main() {
  if (!args.left || !args.right || !args['left-manifest'] || !args['right-manifest']) fail('usage: --left FILE --right FILE --left-manifest FILE --right-manifest FILE')
  const [leftBytes, rightBytes, leftManifestBytes, rightManifestBytes] = await Promise.all([readFile(leftPath), readFile(rightPath), readFile(leftManifestPath), readFile(rightManifestPath)])
  const left = JSON.parse(leftBytes); const right = JSON.parse(rightBytes)
  const leftManifest = JSON.parse(leftManifestBytes); const rightManifest = JSON.parse(rightManifestBytes)
  if (left.schemaVersion !== 'astrology-jplephem-producer-output-v1' || right.schemaVersion !== left.schemaVersion) fail('candidate schema mismatch')
  if (left.provider?.id !== 'jplephem' || right.provider?.id !== 'jplephem' || left.provider?.version !== right.provider?.version || left.provider?.numpyVersion !== right.provider?.numpyVersion || left.provider?.pythonVersion !== right.provider?.pythonVersion) fail('candidate runtime identity mismatch')
  if (left.source?.sha256 !== right.source?.sha256 || left.fixture?.sha256 !== right.fixture?.sha256 || left.fixture?.fixtureId !== right.fixture?.fixtureId) fail('candidate source/fixture identity mismatch')
  if (!Buffer.from(leftBytes).equals(Buffer.from(rightBytes))) fail('candidate bytes differ across Linux platforms')
  if (leftManifest.candidateSha256 !== sha256(leftBytes) || rightManifest.candidateSha256 !== sha256(rightBytes)) fail('candidate manifest payload hash mismatch')
  if (leftManifest.candidateSha256 !== rightManifest.candidateSha256 || leftManifest.fixtureSha256 !== rightManifest.fixtureSha256 || leftManifest.sourceSha256 !== rightManifest.sourceSha256) fail('candidate manifest identity mismatch across Linux platforms')
  console.log(JSON.stringify({ status: 'pass', candidateSha256: sha256(leftBytes), fixtureSha256: left.fixture.sha256, sourceSha256: left.source.sha256 }, null, 2))
}

try {
  await main()
} catch (error) {
  console.error(`Astrology jplephem platform check failed: ${error.message}`)
  process.exitCode = 1
}

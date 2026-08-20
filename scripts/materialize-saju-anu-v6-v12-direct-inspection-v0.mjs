#!/usr/bin/env node
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

import {
  attachArtifactIdentity,
  buildArtifactIdentity,
  canonicalIdentityJson,
} from '../src/artifactIdentity.js'
import {
  SAJU_ANU_V6_V12_SCHEMA,
  SAJU_ANU_V6_V12_VERSION,
  buildSajuAnuV6V12DirectInspection,
} from '../src/interpretationPrep/sajuAnuV6V12DirectInspection.js'

export const SCHEMA = SAJU_ANU_V6_V12_SCHEMA
export const VERSION = SAJU_ANU_V6_V12_VERSION
export const ARTIFACT_PATH = 'artifacts/saju-anu-v6-v12-direct-inspection-v0/complete.json'
export const INTEGRITY_PATH = `${ARTIFACT_PATH}.integrity.json`
export const PREDECESSOR_PATHS = [
  'artifacts/saju-gemini-v7-parent-adjudication/complete.json',
  'artifacts/saju-five-classics-typed-readiness-contract-v0/complete.json',
]
export const INPUT_PATHS = [
  'src/artifactIdentity.js',
  'src/interpretationPrep/sajuAnuV6V12DirectInspection.js',
  ...PREDECESSOR_PATHS,
  'scripts/materialize-saju-anu-v6-v12-direct-inspection-v0.mjs',
]

export const ROOT = resolve(new URL('../', import.meta.url).pathname)
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const currentHead = () => execFileSync('git', ['-c', 'core.fsmonitor=false', 'rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim()

async function readJson(path) {
  return JSON.parse(await readFile(resolve(ROOT, path), 'utf8'))
}

const reference = (artifact, artifactPath) => ({
  artifactPath,
  schemaVersion: artifact?.schemaVersion || null,
  version: artifact?.version || null,
  basisHead: artifact?.basisHead || null,
  contentSha256: artifact?.contentSha256 || null,
  artifactPayloadSha256: artifact?.artifactIdentity?.artifactPayloadSha256 || null,
  claimCount: artifact?.claims?.length || 0,
})

export async function buildArtifact() {
  const parentV7 = await readJson(PREDECESSOR_PATHS[0])
  const typedReadinessBaseline = await readJson(PREDECESSOR_PATHS[1])
  const basisHead = currentHead()
  const artifact = buildSajuAnuV6V12DirectInspection({
    basisHead,
    parentV7,
    typedReadinessBaseline,
  })
  return attachArtifactIdentity(artifact, buildArtifactIdentity({
    root: ROOT,
    artifactId: SCHEMA,
    materializerPath: 'scripts/materialize-saju-anu-v6-v12-direct-inspection-v0.mjs',
    materializerVersion: VERSION,
    baseHead: basisHead,
    inputs: INPUT_PATHS,
  }))
}

export async function writeArtifact(outputPath = ARTIFACT_PATH) {
  const artifact = await buildArtifact()
  const bytes = Buffer.from(canonicalIdentityJson(artifact))
  const integrity = {
    schemaVersion: `${SCHEMA}-integrity-v0`,
    artifactPath: outputPath,
    artifactByteSha256: sha256(bytes),
    byteLength: bytes.length,
    hashScope: 'exact UTF-8 bytes of complete.json including final LF',
  }
  await mkdir(dirname(resolve(ROOT, outputPath)), { recursive: true })
  await writeFile(resolve(ROOT, outputPath), bytes)
  await writeFile(resolve(ROOT, `${outputPath}.integrity.json`), canonicalIdentityJson(integrity))
  return {
    status: 'materialized',
    artifactPath: outputPath,
    directVolumeCount: artifact.summary.directVolumeCount,
    directTimingObservationCount: artifact.summary.directTimingObservationCount,
    printedFolioClosedCount: artifact.summary.printedFolioClosedCount,
    promotionCount: artifact.promotion.stableClaimPromotionCount,
    readiness: artifact.readiness,
    artifactPayloadSha256: artifact.artifactIdentity.artifactPayloadSha256,
    artifactByteSha256: integrity.artifactByteSha256,
  }
}

if (process.argv[1] === new URL(import.meta.url).pathname) console.log(JSON.stringify(await writeArtifact(process.argv[2] || ARTIFACT_PATH), null, 2))

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
  SAJU_MINGLI_YUEYAN_SCHEMA,
  SAJU_MINGLI_YUEYAN_VERSION,
  buildSajuMingliYueyanFirstPartyInspection,
} from '../src/interpretationPrep/sajuMingliYueyanFirstPartyInspection.js'

export const SCHEMA = SAJU_MINGLI_YUEYAN_SCHEMA
export const VERSION = SAJU_MINGLI_YUEYAN_VERSION
export const ARTIFACT_PATH = 'artifacts/saju-mingli-yueyan-first-party-inspection-v0/complete.json'
export const INTEGRITY_PATH = `${ARTIFACT_PATH}.integrity.json`
export const PREDECESSOR_PATHS = [
  'artifacts/saju-gemini-v7-parent-adjudication/complete.json',
  'artifacts/saju-five-classics-typed-readiness-contract-v0/complete.json',
]
export const INPUT_PATHS = [
  'src/artifactIdentity.js',
  'src/interpretationPrep/sajuMingliYueyanFirstPartyInspection.js',
  ...PREDECESSOR_PATHS,
  'scripts/materialize-saju-mingli-yueyan-first-party-inspection-v0.mjs',
]

export const ROOT = resolve(new URL('../', import.meta.url).pathname)
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const currentHead = () => execFileSync('git', ['-c', 'core.fsmonitor=false', 'rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim()

async function readJson(path) {
  return JSON.parse(await readFile(resolve(ROOT, path), 'utf8'))
}

export async function buildArtifact() {
  const parentV7 = await readJson(PREDECESSOR_PATHS[0])
  const typedReadinessBaseline = await readJson(PREDECESSOR_PATHS[1])
  const basisHead = currentHead()
  const artifact = buildSajuMingliYueyanFirstPartyInspection({
    basisHead,
    parentV7,
    typedReadinessBaseline,
  })
  return attachArtifactIdentity(artifact, buildArtifactIdentity({
    root: ROOT,
    artifactId: SCHEMA,
    materializerPath: 'scripts/materialize-saju-mingli-yueyan-first-party-inspection-v0.mjs',
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
    firstPartyItemIdentityConfirmed: artifact.summary.firstPartyItemIdentityConfirmed,
    firstPartyTargetPageObtained: artifact.summary.firstPartyTargetPageObtained,
    directTargetPageObservationCount: artifact.summary.directTargetPageObservationCount,
    mirrorLocatorCount: artifact.summary.mirrorLocatorCount,
    unresolvedP0FieldCount: artifact.summary.unresolvedP0FieldCount,
    promotionCount: artifact.promotion.stableClaimPromotionCount,
    readiness: artifact.readiness,
    artifactPayloadSha256: artifact.artifactIdentity.artifactPayloadSha256,
    artifactByteSha256: integrity.artifactByteSha256,
  }
}

if (process.argv[1] === new URL(import.meta.url).pathname) console.log(JSON.stringify(await writeArtifact(process.argv[2] || ARTIFACT_PATH), null, 2))

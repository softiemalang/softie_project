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
  PREDECESSOR_ARTIFACT_BYTE_SHA256,
  PREDECESSOR_ARTIFACT_PATH,
  PREDECESSOR_ARTIFACT_PAYLOAD_SHA256,
  PREDECESSOR_INTEGRITY_PATH,
  SAJU_SHENFENG_NLC_BACK_MATTER_SCHEMA,
  SAJU_SHENFENG_NLC_BACK_MATTER_VERSION,
  buildSajuShenfengNlcWitnessBackMatterAdjudication,
} from '../src/interpretationPrep/sajuShenfengNlcWitnessBackMatterAdjudicationV1.js'

export const SCHEMA = SAJU_SHENFENG_NLC_BACK_MATTER_SCHEMA
export const VERSION = SAJU_SHENFENG_NLC_BACK_MATTER_VERSION
export const ARTIFACT_PATH = 'artifacts/saju-shenfeng-nlc-witness-back-matter-adjudication-v1/complete.json'
export const INTEGRITY_PATH = `${ARTIFACT_PATH}.integrity.json`
export const INPUT_PATHS = [
  'src/artifactIdentity.js',
  'src/interpretationPrep/sajuShenfengNlcWitnessBackMatterAdjudicationV1.js',
  PREDECESSOR_ARTIFACT_PATH,
  PREDECESSOR_INTEGRITY_PATH,
  'scripts/materialize-saju-shenfeng-nlc-witness-back-matter-adjudication-v1.mjs',
]

export const ROOT = resolve(new URL('../', import.meta.url).pathname)
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const currentHead = () => execFileSync('git', ['-c', 'core.fsmonitor=false', 'rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim()

async function readPredecessor() {
  const bytes = await readFile(resolve(ROOT, PREDECESSOR_ARTIFACT_PATH))
  const integrity = JSON.parse(await readFile(resolve(ROOT, PREDECESSOR_INTEGRITY_PATH), 'utf8'))
  const byteSha256 = sha256(bytes)
  if (byteSha256 !== PREDECESSOR_ARTIFACT_BYTE_SHA256 || integrity.artifactByteSha256 !== PREDECESSOR_ARTIFACT_BYTE_SHA256 || integrity.byteLength !== bytes.length) throw new Error('protected Shenfeng v0 predecessor bytes or sidecar changed')
  const predecessor = JSON.parse(bytes.toString('utf8'))
  if (predecessor.artifactIdentity?.artifactPayloadSha256 !== PREDECESSOR_ARTIFACT_PAYLOAD_SHA256) throw new Error('protected Shenfeng v0 predecessor payload changed')
  return {
    predecessor,
    reference: {
      artifactPath: PREDECESSOR_ARTIFACT_PATH,
      schemaVersion: predecessor.schemaVersion || null,
      version: predecessor.version || null,
      basisHead: predecessor.basisHead || null,
      contentSha256: predecessor.contentSha256 || null,
      artifactPayloadSha256: predecessor.artifactIdentity?.artifactPayloadSha256 || null,
      artifactByteSha256: byteSha256,
    },
  }
}

export async function buildArtifact() {
  const { reference } = await readPredecessor()
  const basisHead = currentHead()
  const artifact = buildSajuShenfengNlcWitnessBackMatterAdjudication({ basisHead, predecessorReference: reference })
  return attachArtifactIdentity(artifact, buildArtifactIdentity({
    root: ROOT,
    artifactId: SCHEMA,
    materializerPath: 'scripts/materialize-saju-shenfeng-nlc-witness-back-matter-adjudication-v1.mjs',
    materializerVersion: VERSION,
    baseHead: basisHead,
    inputs: INPUT_PATHS,
  }))
}

export async function writeArtifact(outputPath = ARTIFACT_PATH) {
  const artifact = await buildArtifact()
  const bytes = Buffer.from(canonicalIdentityJson(artifact))
  const integrity = {
    schemaVersion: `${SCHEMA}-integrity-v1`,
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
    newDirectBackMatterObservationCount: artifact.summary.newDirectBackMatterObservationCount,
    blockerReductionCount: artifact.summary.blockerReductionCount,
    promotionCount: artifact.summary.promotionCount,
    readiness: artifact.readiness,
    artifactPayloadSha256: artifact.artifactIdentity.artifactPayloadSha256,
    artifactByteSha256: integrity.artifactByteSha256,
  }
}

if (process.argv[1] === new URL(import.meta.url).pathname) console.log(JSON.stringify(await writeArtifact(process.argv[2] || ARTIFACT_PATH), null, 2))

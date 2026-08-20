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
  PARENT_ARTIFACT_BYTE_SHA256,
  PARENT_ARTIFACT_PATH,
  SAJU_SHENFENG_NLC_SCHEMA,
  SAJU_SHENFENG_NLC_VERSION,
  buildSajuShenfengNlcWitnessAdjudication,
} from '../src/interpretationPrep/sajuShenfengNlcWitnessAdjudication.js'

export const SCHEMA = SAJU_SHENFENG_NLC_SCHEMA
export const VERSION = SAJU_SHENFENG_NLC_VERSION
export const ARTIFACT_PATH = 'artifacts/saju-shenfeng-nlc-witness-adjudication-v0/complete.json'
export const INTEGRITY_PATH = `${ARTIFACT_PATH}.integrity.json`
export const INPUT_PATHS = [
  'src/artifactIdentity.js',
  'src/interpretationPrep/sajuShenfengNlcWitnessAdjudication.js',
  PARENT_ARTIFACT_PATH,
  'scripts/materialize-saju-shenfeng-nlc-witness-adjudication-v0.mjs',
]

export const ROOT = resolve(new URL('../', import.meta.url).pathname)
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const currentHead = () => execFileSync('git', ['-c', 'core.fsmonitor=false', 'rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim()

const parentReference = (parent, bytes) => ({
  artifactPath: PARENT_ARTIFACT_PATH,
  schemaVersion: parent.schemaVersion || null,
  version: parent.version || null,
  basisHead: parent.basisHead || null,
  contentSha256: parent.contentSha256 || null,
  artifactPayloadSha256: parent.artifactIdentity?.artifactPayloadSha256 || null,
  artifactByteSha256: sha256(bytes),
})

export async function buildArtifact() {
  const parentBytes = await readFile(resolve(ROOT, PARENT_ARTIFACT_PATH))
  const parentByteSha256 = sha256(parentBytes)
  if (parentByteSha256 !== PARENT_ARTIFACT_BYTE_SHA256) throw new Error(`protected parent bytes changed:${parentByteSha256}`)
  const parent = JSON.parse(parentBytes.toString('utf8'))
  const basisHead = currentHead()
  const artifact = buildSajuShenfengNlcWitnessAdjudication({
    basisHead,
    predecessorReference: parentReference(parent, parentBytes),
  })
  return attachArtifactIdentity(artifact, buildArtifactIdentity({
    root: ROOT,
    artifactId: SCHEMA,
    materializerPath: 'scripts/materialize-saju-shenfeng-nlc-witness-adjudication-v0.mjs',
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
    targetWitnessCount: artifact.summary.targetWitnessCount,
    targetPageCount: artifact.summary.targetPageCount,
    canonicalShenfengMaleFirstDaYunLiteral: artifact.summary.canonicalShenfengMaleFirstDaYunLiteral,
    readiness: artifact.readiness,
    artifactPayloadSha256: artifact.artifactIdentity.artifactPayloadSha256,
    artifactByteSha256: integrity.artifactByteSha256,
  }
}

if (process.argv[1] === new URL(import.meta.url).pathname) console.log(JSON.stringify(await writeArtifact(process.argv[2] || ARTIFACT_PATH), null, 2))

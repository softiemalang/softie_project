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
  SAJU_GEMINI_WITNESS_DOSSIER_SCHEMA,
  SAJU_GEMINI_WITNESS_DOSSIER_VERSION,
  buildSajuGeminiWitnessDossierAdjudication,
} from '../src/interpretationPrep/sajuGeminiWitnessDossierAdjudication.js'

export const SCHEMA = SAJU_GEMINI_WITNESS_DOSSIER_SCHEMA
export const VERSION = SAJU_GEMINI_WITNESS_DOSSIER_VERSION
export const ARTIFACT_PATH = 'artifacts/saju-gemini-witness-dossier-adjudication-v1/complete.json'
export const INTEGRITY_PATH = `${ARTIFACT_PATH}.integrity.json`
export const PREDECESSOR_PATH = 'artifacts/saju-five-classics-typed-readiness-contract-v0/complete.json'
export const INPUT_PATHS = [
  'src/artifactIdentity.js',
  'src/interpretationPrep/sajuGeminiWitnessDossierAdjudication.js',
  PREDECESSOR_PATH,
  'scripts/materialize-saju-gemini-witness-dossier-adjudication-v1.mjs',
]

export const ROOT = resolve(new URL('../', import.meta.url).pathname)
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const currentHead = () => execFileSync('git', ['-c', 'core.fsmonitor=false', 'rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim()

async function readJson(path) {
  return JSON.parse(await readFile(resolve(ROOT, path), 'utf8'))
}

const predecessorReference = artifact => ({
  artifactPath: PREDECESSOR_PATH,
  schemaVersion: artifact?.schemaVersion || null,
  version: artifact?.version || null,
  basisHead: artifact?.basisHead || null,
  contentSha256: artifact?.contentSha256 || null,
  artifactPayloadSha256: artifact?.artifactIdentity?.artifactPayloadSha256 || null,
  readiness: artifact?.readiness || null,
})

export async function buildArtifact() {
  const predecessor = await readJson(PREDECESSOR_PATH)
  const basisHead = currentHead()
  const artifact = buildSajuGeminiWitnessDossierAdjudication({
    basisHead,
    typedReadinessReference: predecessorReference(predecessor),
  })
  return attachArtifactIdentity(artifact, buildArtifactIdentity({
    root: ROOT,
    artifactId: SCHEMA,
    materializerPath: 'scripts/materialize-saju-gemini-witness-dossier-adjudication-v1.mjs',
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
    claimCount: artifact.summary.claimCount,
    statusCounts: artifact.summary.statusCounts,
    supportedScopeCount: artifact.summary.supportedScope.length,
    promotionReadyClaimCount: artifact.promotion.promotionReadyClaimIds.length,
    artifactPayloadSha256: artifact.artifactIdentity.artifactPayloadSha256,
    artifactByteSha256: integrity.artifactByteSha256,
  }
}

if (process.argv[1] === new URL(import.meta.url).pathname) console.log(JSON.stringify(await writeArtifact(process.argv[2] || ARTIFACT_PATH), null, 2))

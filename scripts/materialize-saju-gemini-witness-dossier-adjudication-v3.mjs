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
  CANDIDATE_PACKET_FILES,
  SAJU_GEMINI_WITNESS_DOSSIER_V3_SCHEMA,
  SAJU_GEMINI_WITNESS_DOSSIER_V3_VERSION,
  buildSajuGeminiWitnessDossierAdjudicationV3,
} from '../src/interpretationPrep/sajuGeminiWitnessDossierAdjudicationV3.js'

export const SCHEMA = SAJU_GEMINI_WITNESS_DOSSIER_V3_SCHEMA
export const VERSION = SAJU_GEMINI_WITNESS_DOSSIER_V3_VERSION
export const ARTIFACT_PATH = 'artifacts/saju-gemini-witness-dossier-adjudication-v3/complete.json'
export const INTEGRITY_PATH = `${ARTIFACT_PATH}.integrity.json`
export const PREDECESSOR_PATHS = [
  'artifacts/saju-gemini-witness-dossier-adjudication-v2/complete.json',
]
export const INPUT_PATHS = [
  'src/artifactIdentity.js',
  'src/interpretationPrep/sajuGeminiWitnessDossierAdjudication.js',
  'src/interpretationPrep/sajuGeminiWitnessDossierAdjudicationV2.js',
  'src/interpretationPrep/sajuGeminiWitnessDossierAdjudicationV3.js',
  ...PREDECESSOR_PATHS,
  'scripts/materialize-saju-gemini-witness-dossier-adjudication-v3.mjs',
]

export const ROOT = resolve(new URL('../', import.meta.url).pathname)
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const currentHead = () => execFileSync('git', ['-c', 'core.fsmonitor=false', 'rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim()

async function readJson(path) {
  return JSON.parse(await readFile(resolve(ROOT, path), 'utf8'))
}

export async function verifyCandidatePacketFiles() {
  const errors = []
  const observations = []
  for (const expected of CANDIDATE_PACKET_FILES) {
    try {
      const bytes = await readFile(expected.path)
      const actual = { path: expected.path, byteLength: bytes.length, byteSha256: sha256(bytes) }
      observations.push({ role: expected.role, ...actual })
      if (actual.byteLength !== expected.byteLength || actual.byteSha256 !== expected.byteSha256) errors.push(`candidate_file_identity:${expected.role}`)
    } catch (error) {
      errors.push(`candidate_file_unreadable:${expected.role}:${error.code || 'unknown'}`)
    }
  }
  return { errors, observations }
}

const reference = (artifact, artifactPath) => ({
  artifactPath,
  schemaVersion: artifact?.schemaVersion || null,
  version: artifact?.version || null,
  basisHead: artifact?.basisHead || null,
  contentSha256: artifact?.contentSha256 || null,
  artifactPayloadSha256: artifact?.artifactIdentity?.artifactPayloadSha256 || null,
  readiness: artifact?.readinessOverlay?.parentVerified || artifact?.readiness || null,
})

export async function buildArtifact() {
  const candidateFiles = await verifyCandidatePacketFiles()
  if (candidateFiles.errors.length) throw new Error(candidateFiles.errors.join(', '))
  const predecessors = await Promise.all(PREDECESSOR_PATHS.map(readJson))
  const basisHead = currentHead()
  const artifact = buildSajuGeminiWitnessDossierAdjudicationV3({
    basisHead,
    predecessorReferences: Object.fromEntries(PREDECESSOR_PATHS.map((path, index) => [path, reference(predecessors[index], path)])),
  })
  return attachArtifactIdentity(artifact, buildArtifactIdentity({
    root: ROOT,
    artifactId: SCHEMA,
    materializerPath: 'scripts/materialize-saju-gemini-witness-dossier-adjudication-v3.mjs',
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

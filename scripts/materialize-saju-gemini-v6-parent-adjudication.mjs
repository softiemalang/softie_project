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
  SAJU_GEMINI_V6_PARENT_SCHEMA,
  SAJU_GEMINI_V6_PARENT_VERSION,
  buildSajuGeminiV6ParentAdjudication,
} from '../src/interpretationPrep/sajuGeminiV6ParentAdjudication.js'

export const SCHEMA = SAJU_GEMINI_V6_PARENT_SCHEMA
export const VERSION = SAJU_GEMINI_V6_PARENT_VERSION
export const ARTIFACT_PATH = 'artifacts/saju-gemini-v6-parent-adjudication/complete.json'
export const INTEGRITY_PATH = `${ARTIFACT_PATH}.integrity.json`
export const PREDECESSOR_PATHS = [
  'artifacts/saju-gemini-witness-dossier-adjudication-v3/complete.json',
  'artifacts/saju-five-classics-source-identity-frontier-v0/complete.json',
  'artifacts/saju-five-classics-research-continuation-v1/complete.json',
  'artifacts/saju-five-classics-typed-readiness-contract-v0/complete.json',
]
export const INPUT_PATHS = [
  'src/artifactIdentity.js',
  'src/interpretationPrep/sajuGeminiV6ParentAdjudication.js',
  'src/interpretationPrep/sajuFiveClassicsSourceIdentityFrontier.js',
  'src/interpretationPrep/sajuFiveClassicsResearchContinuation.js',
  'src/interpretationPrep/sajuFiveClassicsTypedReadinessContract.js',
  ...PREDECESSOR_PATHS,
  'scripts/materialize-saju-gemini-v6-parent-adjudication.mjs',
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
  gateStateCounts: artifact?.summary?.gateStateCounts || artifact?.summary?.after || artifact?.typedReadinessRecalculation?.after || null,
  promotionReadyClaimIds: artifact?.readiness?.promotionReadyClaimIds || artifact?.promotion?.promotionReadyClaimIds || [],
})

export async function buildArtifact() {
  const predecessors = Object.fromEntries(await Promise.all(PREDECESSOR_PATHS.map(async path => [path, await readJson(path)])))
  const basisHead = currentHead()
  const artifact = buildSajuGeminiV6ParentAdjudication({
    basisHead,
    predecessorReferences: Object.fromEntries(PREDECESSOR_PATHS.map(path => [path, reference(predecessors[path], path)])),
    typedReadinessBaseline: predecessors['artifacts/saju-five-classics-typed-readiness-contract-v0/complete.json'],
  })
  return attachArtifactIdentity(artifact, buildArtifactIdentity({
    root: ROOT,
    artifactId: SCHEMA,
    materializerPath: 'scripts/materialize-saju-gemini-v6-parent-adjudication.mjs',
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
    contaminationCount: artifact.summary.contaminationClaimIds.length,
    promotionReadyClaimCount: artifact.promotion.promotionReadyClaimIds.length,
    readiness: artifact.readiness,
    artifactPayloadSha256: artifact.artifactIdentity.artifactPayloadSha256,
    artifactByteSha256: integrity.artifactByteSha256,
  }
}

if (process.argv[1] === new URL(import.meta.url).pathname) console.log(JSON.stringify(await writeArtifact(process.argv[2] || ARTIFACT_PATH), null, 2))


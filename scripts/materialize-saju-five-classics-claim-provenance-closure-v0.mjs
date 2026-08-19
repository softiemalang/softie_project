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
  CLAIM_ADJUDICATION_ARTIFACT_PATH,
  CLAIM_ADJUDICATION_INTEGRITY_PATH,
  CLAIM_MATERIALIZER_PATH,
  CLAIM_MODULE_PATH,
  SAJU_FIVE_CLASSICS_CLAIM_PROVENANCE_CLOSURE_SCHEMA,
  SAJU_FIVE_CLASSICS_CLAIM_PROVENANCE_CLOSURE_VERSION,
  SOURCE_FRONTIER_ARTIFACT_PATH,
  SOURCE_FRONTIER_INTEGRITY_PATH,
  TIMING_AUTHORITY_ARTIFACT_PATH,
  TIMING_AUTHORITY_INTEGRITY_PATH,
  buildProvenanceSnapshot,
  buildSajuFiveClassicsClaimProvenanceClosure,
  buildTimingAuthorityRelation,
} from '../src/interpretationPrep/sajuFiveClassicsClaimProvenanceClosure.js'
import { INPUT_PATHS as CLAIM_INPUT_PATHS } from './materialize-saju-five-classics-claim-adjudication-v0.mjs'

export const SCHEMA = SAJU_FIVE_CLASSICS_CLAIM_PROVENANCE_CLOSURE_SCHEMA
export const VERSION = SAJU_FIVE_CLASSICS_CLAIM_PROVENANCE_CLOSURE_VERSION
export const ARTIFACT_PATH = 'artifacts/saju-five-classics-claim-provenance-closure-v0/complete.json'
export const INTEGRITY_PATH = `${ARTIFACT_PATH}.integrity.json`
export const INPUT_PATHS = [
  'src/artifactIdentity.js',
  'src/interpretationPrep/sajuFiveClassicsClaimAdjudication.js',
  'src/interpretationPrep/sajuFiveClassicsClaimProvenanceClosure.js',
  'src/interpretationPrep/sajuFiveClassicsSourceIdentityFrontier.js',
  'src/interpretationPrep/sajuTimingAuthorityFrontier.js',
  'scripts/check-saju-five-classics-claim-adjudication-v0.mjs',
  'scripts/check-saju-five-classics-claim-provenance-closure-v0.mjs',
  'scripts/check-saju-five-classics-source-identity-frontier-v0.mjs',
  'scripts/check-saju-timing-authority-frontier-v0.mjs',
  'scripts/materialize-saju-five-classics-claim-adjudication-v0.mjs',
  'scripts/materialize-saju-five-classics-claim-provenance-closure-v0.mjs',
  'scripts/materialize-saju-five-classics-source-identity-frontier-v0.mjs',
  'scripts/materialize-saju-timing-authority-frontier-v0.mjs',
  CLAIM_ADJUDICATION_ARTIFACT_PATH,
  CLAIM_ADJUDICATION_INTEGRITY_PATH,
  SOURCE_FRONTIER_ARTIFACT_PATH,
  SOURCE_FRONTIER_INTEGRITY_PATH,
  TIMING_AUTHORITY_ARTIFACT_PATH,
  TIMING_AUTHORITY_INTEGRITY_PATH,
]

export const ROOT = resolve(new URL('../', import.meta.url).pathname)
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const currentHead = () => execFileSync('git', ['-c', 'core.fsmonitor=false', 'rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim()

async function readSnapshot(artifactPath, integrityPath) {
  const [artifactBytes, integrityBytes] = await Promise.all([
    readFile(resolve(ROOT, artifactPath)),
    readFile(resolve(ROOT, integrityPath)),
  ])
  const artifact = JSON.parse(artifactBytes.toString('utf8'))
  const integrity = JSON.parse(integrityBytes.toString('utf8'))
  return buildProvenanceSnapshot({
    artifactPath,
    integrityPath,
    artifact,
    artifactBytes,
    integrity,
    integrityBytes,
  })
}

export async function buildArtifact() {
  const [claimAdjudicationSnapshot, sourceFrontierSnapshot, timingAuthoritySnapshot, claimMaterializerSource, claimModuleSource, sourceMaterializerSource, sourceModuleSource] = await Promise.all([
    readSnapshot(CLAIM_ADJUDICATION_ARTIFACT_PATH, CLAIM_ADJUDICATION_INTEGRITY_PATH),
    readSnapshot(SOURCE_FRONTIER_ARTIFACT_PATH, SOURCE_FRONTIER_INTEGRITY_PATH),
    readSnapshot(TIMING_AUTHORITY_ARTIFACT_PATH, TIMING_AUTHORITY_INTEGRITY_PATH),
    readFile(resolve(ROOT, CLAIM_MATERIALIZER_PATH), 'utf8'),
    readFile(resolve(ROOT, CLAIM_MODULE_PATH), 'utf8'),
    readFile(resolve(ROOT, 'scripts/materialize-saju-five-classics-source-identity-frontier-v0.mjs'), 'utf8'),
    readFile(resolve(ROOT, 'src/interpretationPrep/sajuFiveClassicsSourceIdentityFrontier.js'), 'utf8'),
  ])
  const basisHead = currentHead()
  const timingAuthorityRelation = buildTimingAuthorityRelation({
    claimMaterializerInputPaths: CLAIM_INPUT_PATHS,
    claimMaterializerSource,
    claimModuleSource,
    sourceMaterializerSource,
    sourceModuleSource,
    timingAuthoritySnapshot,
  })
  const payload = buildSajuFiveClassicsClaimProvenanceClosure({
    basisHead,
    claimAdjudicationSnapshot,
    sourceFrontierSnapshot,
    timingAuthorityRelation,
  })
  return attachArtifactIdentity(payload, buildArtifactIdentity({
    root: ROOT,
    artifactId: SCHEMA,
    materializerPath: 'scripts/materialize-saju-five-classics-claim-provenance-closure-v0.mjs',
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
  const target = resolve(ROOT, outputPath)
  await mkdir(dirname(target), { recursive: true })
  await writeFile(target, bytes)
  await writeFile(resolve(ROOT, `${outputPath}.integrity.json`), canonicalIdentityJson(integrity))
  return {
    status: 'materialized',
    artifactPath: outputPath,
    claimArtifactByteSha256: artifact.claimAdjudication.artifactByteSha256,
    sourceArtifactByteSha256: artifact.sourceFrontierPredecessor.artifactByteSha256,
    timingAuthorityGenerationDependency: artifact.timingAuthorityRelation.generationDependency,
    readiness: artifact.readiness,
    artifactByteSha256: integrity.artifactByteSha256,
  }
}

if (process.argv[1] === new URL(import.meta.url).pathname) console.log(JSON.stringify(await writeArtifact(process.argv[2] || ARTIFACT_PATH), null, 2))

#!/usr/bin/env node
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

import {
  artifactPayloadSha256,
  canonicalIdentityJson,
  checkArtifactIdentity,
} from '../src/artifactIdentity.js'
import {
  PREDECESSOR_ARTIFACT_BYTE_SHA256,
  PREDECESSOR_ARTIFACT_PATH,
  PREDECESSOR_ARTIFACT_PAYLOAD_SHA256,
  PREDECESSOR_INTEGRITY_PATH,
  SAJU_SHENFENG_NLC_BACK_MATTER_SCHEMA,
  SAJU_SHENFENG_NLC_BACK_MATTER_VERSION,
  checkSajuShenfengNlcWitnessBackMatterAdjudication,
} from '../src/interpretationPrep/sajuShenfengNlcWitnessBackMatterAdjudicationV1.js'
import {
  ARTIFACT_PATH,
  INTEGRITY_PATH,
  INPUT_PATHS,
  ROOT,
  SCHEMA,
  VERSION,
  buildArtifact,
} from './materialize-saju-shenfeng-nlc-witness-back-matter-adjudication-v1.mjs'

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const currentHead = () => execFileSync('git', ['-c', 'core.fsmonitor=false', 'rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim()

async function checkProtectedPredecessor(root) {
  const errors = []
  try {
    const bytes = await readFile(resolve(root, PREDECESSOR_ARTIFACT_PATH))
    const integrity = JSON.parse(await readFile(resolve(root, PREDECESSOR_INTEGRITY_PATH), 'utf8'))
    if (sha256(bytes) !== PREDECESSOR_ARTIFACT_BYTE_SHA256 || integrity.artifactByteSha256 !== PREDECESSOR_ARTIFACT_BYTE_SHA256 || integrity.byteLength !== bytes.length) errors.push('protected_predecessor')
    const predecessor = JSON.parse(bytes.toString('utf8'))
    if (predecessor.artifactIdentity?.artifactPayloadSha256 !== PREDECESSOR_ARTIFACT_PAYLOAD_SHA256) errors.push('protected_predecessor_payload')
  } catch {
    errors.push('protected_predecessor_missing_or_invalid')
  }
  return errors
}

export async function checkArtifact(candidate, { root = ROOT, historical = false } = {}) {
  const errors = checkSajuShenfengNlcWitnessBackMatterAdjudication(candidate)
  errors.push(...checkArtifactIdentity(candidate, {
    root,
    artifactId: SCHEMA,
    materializerPath: 'scripts/materialize-saju-shenfeng-nlc-witness-back-matter-adjudication-v1.mjs',
    materializerVersion: VERSION,
    allowGenerationBaseInput: true,
    verifierInputPaths: INPUT_PATHS,
  }))
  errors.push(...await checkProtectedPredecessor(root))
  if (candidate.artifactIdentity?.artifactPayloadSha256 !== artifactPayloadSha256(candidate)) errors.push('artifact_payload_hash')
  if (!historical) {
    let expected = null
    try {
      expected = await buildArtifact()
    } catch (error) {
      errors.push(`replay_build:${error.code || 'failed'}`)
    }
    const isCurrentSnapshot = candidate.artifactIdentity?.generation?.baseHead === currentHead()
    if (expected && isCurrentSnapshot && canonicalIdentityJson(candidate) !== canonicalIdentityJson(expected)) errors.push('materialized_content')
    if (expected && !isCurrentSnapshot && candidate.contentSha256 !== expected.contentSha256) errors.push('historical_stable_content')
  }
  return [...new Set(errors)].sort()
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  const artifactArgument = process.argv.slice(2).find(argument => !argument.startsWith('--'))
  const artifactPath = resolve(ROOT, artifactArgument || ARTIFACT_PATH)
  const historical = process.argv.includes('--historical')
  const artifact = JSON.parse(await readFile(artifactPath, 'utf8'))
  const errors = await checkArtifact(artifact, { historical })
  try {
    const bytes = await readFile(artifactPath)
    const integrity = JSON.parse(await readFile(resolve(ROOT, `${artifactArgument || ARTIFACT_PATH}.integrity.json`), 'utf8'))
    if (integrity.artifactByteSha256 !== sha256(bytes) || integrity.byteLength !== bytes.length) errors.push('integrity_sidecar')
  } catch {
    errors.push('integrity_sidecar_missing_or_invalid')
  }
  console.log(JSON.stringify({
    status: errors.length ? 'fail' : 'pass',
    schema: artifact.schemaVersion || null,
    basisHead: artifact.basisHead || null,
    currentHead: currentHead(),
    newDirectBackMatterObservationCount: artifact.summary?.newDirectBackMatterObservationCount || 0,
    blockerReductionCount: artifact.summary?.blockerReductionCount || 0,
    promotionCount: artifact.summary?.promotionCount || 0,
    readiness: artifact.readiness || null,
    blockers: artifact.blockers || [],
    historicalSnapshotMode: historical,
    errors: [...new Set(errors)].sort(),
  }, null, 2))
  if (errors.length) process.exitCode = 1
}

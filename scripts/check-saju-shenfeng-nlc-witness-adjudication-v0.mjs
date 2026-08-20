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
  PARENT_ARTIFACT_BYTE_SHA256,
  PARENT_ARTIFACT_PATH,
  SAJU_SHENFENG_NLC_SCHEMA,
  SAJU_SHENFENG_NLC_VERSION,
  checkSajuShenfengNlcWitnessAdjudication,
} from '../src/interpretationPrep/sajuShenfengNlcWitnessAdjudication.js'
import {
  ARTIFACT_PATH,
  INPUT_PATHS,
  ROOT,
  SCHEMA,
  VERSION,
  buildArtifact,
} from './materialize-saju-shenfeng-nlc-witness-adjudication-v0.mjs'

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const currentHead = () => execFileSync('git', ['-c', 'core.fsmonitor=false', 'rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim()

export async function checkArtifact(candidate, { root = ROOT } = {}) {
  const errors = checkSajuShenfengNlcWitnessAdjudication(candidate)
  errors.push(...checkArtifactIdentity(candidate, {
    root,
    artifactId: SCHEMA,
    materializerPath: 'scripts/materialize-saju-shenfeng-nlc-witness-adjudication-v0.mjs',
    materializerVersion: VERSION,
    allowGenerationBaseInput: true,
    verifierInputPaths: INPUT_PATHS,
  }))
  if (candidate.artifactIdentity?.artifactPayloadSha256 !== artifactPayloadSha256(candidate)) errors.push('artifact_payload_hash')
  try {
    const parentBytes = await readFile(resolve(root, PARENT_ARTIFACT_PATH))
    if (sha256(parentBytes) !== PARENT_ARTIFACT_BYTE_SHA256) errors.push('protected_parent_bytes')
  } catch {
    errors.push('protected_parent_missing')
  }
  let expected = null
  try {
    expected = await buildArtifact()
  } catch (error) {
    errors.push(`replay_build:${error.message || error.code || 'failed'}`)
  }
  const isCurrentSnapshot = candidate.artifactIdentity?.generation?.baseHead === currentHead()
  if (expected && isCurrentSnapshot && canonicalIdentityJson(candidate) !== canonicalIdentityJson(expected)) errors.push('materialized_content')
  if (expected && !isCurrentSnapshot && candidate.contentSha256 !== expected.contentSha256) errors.push('historical_stable_content')
  return [...new Set(errors)].sort()
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  const artifactPath = resolve(ROOT, process.argv[2] || ARTIFACT_PATH)
  const artifact = JSON.parse(await readFile(artifactPath, 'utf8'))
  const errors = await checkArtifact(artifact)
  try {
    const bytes = await readFile(artifactPath)
    const integrity = JSON.parse(await readFile(`${artifactPath}.integrity.json`, 'utf8'))
    if (integrity.artifactByteSha256 !== sha256(bytes) || integrity.byteLength !== bytes.length) errors.push('integrity_sidecar')
  } catch {
    errors.push('integrity_sidecar_missing_or_invalid')
  }
  console.log(JSON.stringify({
    status: errors.length ? 'fail' : 'pass',
    schema: artifact.schemaVersion || null,
    basisHead: artifact.basisHead || null,
    currentHead: currentHead(),
    targetWitnessCount: artifact.summary?.targetWitnessCount || 0,
    targetPageCount: artifact.summary?.targetPageCount || 0,
    canonicalShenfengMaleFirstDaYunLiteral: artifact.summary?.canonicalShenfengMaleFirstDaYunLiteral || null,
    readiness: artifact.readiness || null,
    blockers: artifact.blockers || [],
    errors: [...new Set(errors)].sort(),
  }, null, 2))
  if (errors.length) process.exitCode = 1
}

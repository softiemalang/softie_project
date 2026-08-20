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
  checkSajuLunaDeepCollationAdjudicationV4,
} from '../src/interpretationPrep/sajuLunaDeepCollationAdjudicationV4.js'
import {
  ARTIFACT_PATH,
  INPUT_PATHS,
  ROOT,
  SCHEMA,
  VERSION,
  buildArtifact,
  verifyCandidatePacketFiles,
} from './materialize-saju-luna-deep-collation-adjudication-v4.mjs'

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const currentHead = () => execFileSync('git', ['-c', 'core.fsmonitor=false', 'rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim()

export async function checkArtifact(candidate, { root = ROOT } = {}) {
  const errors = checkSajuLunaDeepCollationAdjudicationV4(candidate)
  const candidateFiles = await verifyCandidatePacketFiles()
  errors.push(...candidateFiles.errors)
  errors.push(...checkArtifactIdentity(candidate, {
    root,
    artifactId: SCHEMA,
    materializerPath: 'scripts/materialize-saju-luna-deep-collation-adjudication-v4.mjs',
    materializerVersion: VERSION,
    allowGenerationBaseInput: true,
    verifierInputPaths: INPUT_PATHS,
  }))
  if (candidate.artifactIdentity?.artifactPayloadSha256 !== artifactPayloadSha256(candidate)) errors.push('artifact_payload_hash')
  let expected = null
  if (!candidateFiles.errors.length) {
    try {
      expected = await buildArtifact()
    } catch (error) {
      errors.push(`replay_build:${error.code || 'failed'}`)
    }
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
    claimCount: artifact.summary?.claimCount || 0,
    statusCounts: artifact.summary?.statusCounts || null,
    variantSummary: {
      verified: artifact.summary?.verifiedVariantCount || 0,
      corrected: artifact.summary?.correctedVariantCount || 0,
      rejected: artifact.summary?.rejectedVariantCount || 0,
      unresolved: artifact.summary?.unresolvedVariantCount || 0,
    },
    readiness: artifact.readinessOverlay?.parentVerified || null,
    errors: [...new Set(errors)].sort(),
  }, null, 2))
  if (errors.length) process.exitCode = 1
}

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
  checkSajuMingliYueyanDirectWitnessAdjudication,
} from '../src/interpretationPrep/sajuMingliYueyanDirectWitnessAdjudicationV1.js'
import {
  ARTIFACT_PATH,
  INPUT_PATHS,
  ROOT,
  SCHEMA,
  VERSION,
  buildArtifact,
} from './materialize-saju-mingli-yueyan-direct-witness-adjudication-v1.mjs'

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const currentHead = () => execFileSync('git', ['-c', 'core.fsmonitor=false', 'rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim()

export async function checkArtifact(candidate, { root = ROOT, historical = false } = {}) {
  const errors = checkSajuMingliYueyanDirectWitnessAdjudication(candidate)
  errors.push(...checkArtifactIdentity(candidate, {
    root,
    artifactId: SCHEMA,
    materializerPath: 'scripts/materialize-saju-mingli-yueyan-direct-witness-adjudication-v1.mjs',
    materializerVersion: VERSION,
    allowGenerationBaseInput: true,
    verifierInputPaths: INPUT_PATHS,
  }))
  if (candidate.artifactIdentity?.artifactPayloadSha256 !== artifactPayloadSha256(candidate)) errors.push('artifact_payload_hash')
  if (!historical) {
    let expected = null
    try {
      expected = await buildArtifact()
    } catch (error) {
      errors.push('replay_build:' + (error.code || 'failed'))
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
  const artifact = JSON.parse(await readFile(artifactPath, 'utf8'))
  const historical = process.argv.includes('--historical')
  const errors = await checkArtifact(artifact, { historical })
  try {
    const bytes = await readFile(artifactPath)
    const integrity = JSON.parse(await readFile(artifactPath + '.integrity.json', 'utf8'))
    if (integrity.artifactByteSha256 !== sha256(bytes) || integrity.byteLength !== bytes.length) errors.push('integrity_sidecar')
  } catch {
    errors.push('integrity_sidecar_missing_or_invalid')
  }
  console.log(JSON.stringify({
    status: errors.length ? 'fail' : 'pass',
    schema: artifact.schemaVersion || null,
    basisHead: artifact.basisHead || null,
    currentHead: currentHead(),
    directTargetPageObservationCount: artifact.summary?.directTargetPageObservationCount || 0,
    directlyObservedP0FieldCount: artifact.summary?.directlyObservedP0FieldCount || 0,
    unresolvedP0FieldCount: artifact.summary?.unresolvedP0FieldCount || 0,
    completeP0FieldClosureCount: artifact.summary?.completeP0FieldClosureCount || 0,
    promotionCount: artifact.summary?.promotionCount || 0,
    readiness: artifact.readiness || null,
    blockers: artifact.blockers || [],
    historicalSnapshotMode: historical,
    errors: [...new Set(errors)].sort(),
  }, null, 2))
  if (errors.length) process.exitCode = 1
}

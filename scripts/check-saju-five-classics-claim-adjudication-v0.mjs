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
  checkSajuFiveClassicsClaimAdjudication,
} from '../src/interpretationPrep/sajuFiveClassicsClaimAdjudication.js'
import {
  ARTIFACT_PATH,
  INPUT_PATHS,
  SCHEMA,
  VERSION,
  buildArtifact,
} from './materialize-saju-five-classics-claim-adjudication-v0.mjs'
import {
  buildArtifact as buildSourceFrontierArtifact,
} from './materialize-saju-five-classics-source-identity-frontier-v0.mjs'

export const ROOT = resolve(new URL('../', import.meta.url).pathname)
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const currentHead = () => execFileSync('git', ['-c', 'core.fsmonitor=false', 'rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim()

export async function checkArtifact(candidate, { root = ROOT, historical = false } = {}) {
  const errors = []
  if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) return ['artifact_shape_invalid']
  let sourceFrontier = null
  if (historical) {
    try {
      sourceFrontier = JSON.parse(await readFile(resolve(root, candidate.sourceFrontier?.artifactPath), 'utf8'))
    } catch (error) {
      errors.push(`historical_source_frontier:${error.code || 'invalid'}`)
    }
  } else {
    sourceFrontier = await buildSourceFrontierArtifact()
  }
  if (sourceFrontier) errors.push(...checkSajuFiveClassicsClaimAdjudication(candidate, { sourceFrontier }))
  errors.push(...checkArtifactIdentity(candidate, {
    root,
    artifactId: SCHEMA,
    materializerPath: 'scripts/materialize-saju-five-classics-claim-adjudication-v0.mjs',
    materializerVersion: VERSION,
    allowGenerationBaseInput: true,
    verifierInputPaths: INPUT_PATHS,
  }))
  if (candidate.artifactIdentity?.artifactPayloadSha256 !== artifactPayloadSha256(candidate)) errors.push('artifact_payload_hash')

  if (!historical) {
    const expected = await buildArtifact()
    const isCurrentSnapshot = candidate.artifactIdentity?.generation?.baseHead === currentHead()
    if (isCurrentSnapshot && canonicalIdentityJson(candidate) !== canonicalIdentityJson(expected)) errors.push('materialized_content')
    if (!isCurrentSnapshot && candidate.contentSha256 !== expected.contentSha256) errors.push('historical_stable_content')
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
    historicalSnapshotMode: historical,
    schema: artifact.schemaVersion || null,
    basisHead: artifact.basisHead || null,
    currentHead: currentHead(),
    claimCount: artifact.claims?.length || 0,
    externalRecordCount: artifact.externalRecordObservations?.length || 0,
    sourceFrontierObservationCount: artifact.inventory?.counts?.sourceFrontierEvidenceObservationIds || 0,
    readiness: artifact.readiness || null,
    adjudicationSummary: artifact.adjudicationSummary || null,
    errors: [...new Set(errors)].sort(),
  }, null, 2))
  if (errors.length) process.exitCode = 1
}

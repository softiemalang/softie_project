#!/usr/bin/env node
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { execFileSync } from 'node:child_process'

import {
  artifactPayloadSha256,
  canonicalIdentityJson,
  checkArtifactIdentity,
} from '../src/artifactIdentity.js'
import {
  checkSajuFiveClassicsResearchContinuation,
} from '../src/interpretationPrep/sajuFiveClassicsResearchContinuation.js'
import {
  ARTIFACT_PATH,
  INPUT_PATHS,
  ROOT,
  SCHEMA,
  VERSION,
  buildArtifact,
} from './materialize-saju-five-classics-research-continuation-v1.mjs'
import { PREDECESSOR_ARTIFACT_PATHS } from '../src/interpretationPrep/sajuFiveClassicsResearchContinuation.js'

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const currentHead = () => execFileSync('git', ['-c', 'core.fsmonitor=false', 'rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim()

async function readJson(path) {
  return JSON.parse(await readFile(resolve(ROOT, path), 'utf8'))
}

export async function checkArtifact(candidate, { root = ROOT } = {}) {
  const errors = []
  if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) return ['artifact_shape_invalid']
  const [sourceFrontier, claimAdjudication, timingAuthority] = await Promise.all([
    readJson(PREDECESSOR_ARTIFACT_PATHS.sourceFrontier),
    readJson(PREDECESSOR_ARTIFACT_PATHS.claimAdjudication),
    readJson(PREDECESSOR_ARTIFACT_PATHS.timingAuthority),
  ])
  errors.push(...checkSajuFiveClassicsResearchContinuation(candidate, { sourceFrontier, claimAdjudication, timingAuthority }))
  errors.push(...checkArtifactIdentity(candidate, {
    root,
    artifactId: SCHEMA,
    materializerPath: 'scripts/materialize-saju-five-classics-research-continuation-v1.mjs',
    materializerVersion: VERSION,
    allowGenerationBaseInput: true,
    verifierInputPaths: INPUT_PATHS,
  }))
  if (candidate.artifactIdentity?.artifactPayloadSha256 !== artifactPayloadSha256(candidate)) errors.push('artifact_payload_hash')
  const expected = await buildArtifact()
  const isCurrentSnapshot = candidate.artifactIdentity?.generation?.baseHead === currentHead()
  if (isCurrentSnapshot && canonicalIdentityJson(candidate) !== canonicalIdentityJson(expected)) errors.push('materialized_content')
  if (!isCurrentSnapshot && candidate.contentSha256 !== expected.contentSha256) errors.push('historical_stable_content')
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
    activeClaimCount: artifact.claims?.length || 0,
    splitClaimCount: artifact.inventory?.counts?.splitClaims || 0,
    sourceCount: artifact.sources?.length || 0,
    observationCount: artifact.observations?.length || 0,
    claimRelationCount: artifact.claimRelations?.length || 0,
    lineageRelationCount: artifact.lineageRelations?.length || 0,
    blockerCount: artifact.blockers?.length || 0,
    readiness: artifact.readiness || null,
    adjudicationSummary: artifact.adjudicationSummary || null,
    errors: [...new Set(errors)].sort(),
  }, null, 2))
  if (errors.length) process.exitCode = 1
}

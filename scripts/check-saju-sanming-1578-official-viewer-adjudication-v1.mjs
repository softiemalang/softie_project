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
  checkSajuSanming1578OfficialViewerAdjudication,
} from '../src/interpretationPrep/sajuSanming1578OfficialViewerAdjudicationV1.js'
import {
  ARTIFACT_PATH,
  INPUT_PATHS,
  ROOT,
  SCHEMA,
  VERSION,
  buildArtifact,
} from './materialize-saju-sanming-1578-official-viewer-adjudication-v1.mjs'

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const currentHead = () => execFileSync('git', ['-c', 'core.fsmonitor=false', 'rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim()

export async function checkArtifact(candidate, { root = ROOT, historical = false } = {}) {
  const errors = checkSajuSanming1578OfficialViewerAdjudication(candidate)
  errors.push(...checkArtifactIdentity(candidate, {
    root,
    artifactId: SCHEMA,
    materializerPath: 'scripts/materialize-saju-sanming-1578-official-viewer-adjudication-v1.mjs',
    materializerVersion: VERSION,
    allowGenerationBaseInput: true,
    verifierInputPaths: INPUT_PATHS,
  }))
  if (candidate.artifactIdentity?.artifactPayloadSha256 !== artifactPayloadSha256(candidate)) errors.push('artifact_payload_hash')

  try {
    const predecessorBytes = await readFile(resolve(root, PREDECESSOR_ARTIFACT_PATH))
    if (sha256(predecessorBytes) !== PREDECESSOR_ARTIFACT_BYTE_SHA256) errors.push('protected_predecessor_bytes')
  } catch {
    errors.push('protected_predecessor_missing')
  }

  if (!historical) {
    let expected = null
    try {
      expected = await buildArtifact()
    } catch (error) {
      errors.push(`replay_build:${error.message || error.code || 'failed'}`)
    }
    const isCurrentSnapshot = candidate.artifactIdentity?.generation?.baseHead === currentHead()
    if (expected && isCurrentSnapshot && canonicalIdentityJson(candidate) !== canonicalIdentityJson(expected)) errors.push('materialized_content')
    if (expected && !isCurrentSnapshot && candidate.contentSha256 !== expected.contentSha256) errors.push('historical_stable_content')
  }

  return [...new Set(errors)].sort()
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  const artifactPath = resolve(ROOT, process.argv.slice(2).find(argument => !argument.startsWith('--')) || ARTIFACT_PATH)
  const historical = process.argv.includes('--historical')
  const artifact = JSON.parse(await readFile(artifactPath, 'utf8'))
  const errors = await checkArtifact(artifact, { historical })
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
    screenshotEvidenceCount: artifact.summary?.screenshotEvidenceCount || 0,
    identityContextPageCount: artifact.summary?.identityContextPageCount || 0,
    volumeSequenceContextCaptureCount: artifact.summary?.volumeSequenceContextCaptureCount || 0,
    folioReadabilityCaptureCount: artifact.summary?.folioReadabilityCaptureCount || 0,
    folioReadabilityResult: artifact.summary?.folioReadabilityResult || null,
    boundedViewerVolumeSequenceObserved: artifact.summary?.boundedViewerVolumeSequenceObserved || false,
    targetPageCount: artifact.summary?.targetPageCount || 0,
    officialPageBytesObtained: artifact.summary?.officialPageBytesObtained ?? null,
    printedFolioClosed: artifact.summary?.printedFolioClosed ?? null,
    copyLineageClosed: artifact.summary?.copyLineageClosed ?? null,
    promotionCount: artifact.summary?.promotionCount || 0,
    blockers: artifact.blockers || [],
    readiness: artifact.readiness || null,
    historicalSnapshotMode: historical,
    errors: [...new Set(errors)].sort(),
  }, null, 2))
  if (errors.length) process.exitCode = 1
}

#!/usr/bin/env node
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

import { checkArtifactIdentity, matchesFileByteIdentity } from '../src/artifactIdentity.js'
import { checkTriSystemReadinessContract, canonicalTriSystemReadinessJson, triSystemReadinessContentSha256 } from '../src/interpretationPrep/triSystemReadinessContract.js'
import { ARTIFACT_PATH, INPUT_PATHS, PREDECESSOR_PATH, SCHEMA, VERSION, buildArtifact } from './materialize-astrology-v1-local-integration-milestone-v2.mjs'

const root = resolve(new URL('../', import.meta.url).pathname)
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const currentHead = () => execFileSync('git', ['-c', 'core.fsmonitor=false', 'rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim()

export async function checkArtifact(candidate, { artifactPath = null } = {}) {
  const errors = []
  if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) return ['artifact_shape_invalid']
  errors.push(...checkTriSystemReadinessContract(candidate))
  if (candidate.successor?.successorVersion !== VERSION || candidate.successor?.predecessor?.artifact !== PREDECESSOR_PATH || candidate.successor?.predecessor?.historicalArtifactRewritten !== false) errors.push('successor_lineage_invalid')
  if (candidate.successor?.boundary?.semanticAuthority !== 'not_promoted' || candidate.successor?.boundary?.interpretation !== 'not_created') errors.push('successor_boundary_invalid')
  if (candidate.localEvidence?.latestEvidenceAttached !== true || candidate.localEvidence?.latestEvidenceChangesReadiness !== false || candidate.localEvidence?.sourceAuthorityPromoted !== false) errors.push('latest_evidence_boundary_invalid')
  const expectedPaths = {
    saju: 'artifacts/saju-source-claim-observation-v1/complete.json',
    horizons: 'artifacts/astrology-true-node-horizons-erfa-v2/complete.json',
    lightTime: 'artifacts/astrology-true-node-light-time-diagnostic-v1/complete.json',
  }
  if (!candidate.successor?.latestEvidencePaths?.saju?.includes(expectedPaths.saju)) errors.push(`successor_evidence_missing:${expectedPaths.saju}`)
  for (const path of [expectedPaths.horizons, expectedPaths.lightTime]) {
    if (!candidate.successor?.latestEvidencePaths?.astrology?.includes(path)) errors.push(`successor_evidence_missing:${path}`)
  }
  const saju = candidate.domains.find(domain => domain.id === 'saju')
  const astrology = candidate.domains.find(domain => domain.id === 'astrology')
  for (const path of [expectedPaths.saju]) if (!saju?.evidenceRefs?.some(ref => ref.path === path)) errors.push(`domain_evidence_missing:${path}`)
  for (const path of [expectedPaths.horizons, expectedPaths.lightTime]) if (!astrology?.evidenceRefs?.some(ref => ref.path === path)) errors.push(`domain_evidence_missing:${path}`)
  if (astrology?.frontier?.independentTrueNodeReference !== 'pending' || astrology?.frontier?.semanticIdentity !== 'blocked_semantic_identity_insufficient' || astrology?.frontier?.numericStatus !== 'diagnostic_only_no_tolerance_pass') errors.push('astrology_frontier_boundary_changed')
  if (saju?.frontier?.claimVerification !== 'not_promoted' || saju?.frontier?.readinessUnchanged !== true) errors.push('saju_frontier_boundary_changed')

  const predecessorBytes = await readFile(resolve(root, PREDECESSOR_PATH))
  if (candidate.successor?.predecessor?.byteSha256 !== sha256(predecessorBytes)) errors.push('predecessor_byte_drift')
  for (const domain of candidate.domains) for (const ref of domain.evidenceRefs || []) {
    if (!matchesFileByteIdentity(root, ref.path, ref.byteSha256, { generationBaseHead: candidate.artifactIdentity?.generation?.baseHead })) errors.push(`evidence_byte_drift:${ref.path}`)
  }
  if (candidate.artifactIdentity?.inputs?.map(item => item.path).sort().join('\n') !== [...INPUT_PATHS].sort().join('\n')) errors.push('input_manifest_mismatch')
  errors.push(...checkArtifactIdentity(candidate, { root, artifactId: SCHEMA, materializerPath: 'scripts/materialize-astrology-v1-local-integration-milestone-v2.mjs', materializerVersion: VERSION, allowGenerationBaseInput: true }))
  if (candidate.contentSha256 !== triSystemReadinessContentSha256(candidate)) errors.push('content_hash_mismatch')
  if (candidate.basisHead === currentHead()) {
    const expected = await buildArtifact()
    if (canonicalTriSystemReadinessJson(candidate) !== canonicalTriSystemReadinessJson(expected)) errors.push('current_materialized_content_drift')
  }
  if (artifactPath) {
    try {
      const bytes = await readFile(resolve(root, artifactPath))
      const integrity = JSON.parse(await readFile(`${resolve(root, artifactPath)}.integrity.json`, 'utf8'))
      if (integrity.artifactByteSha256 !== sha256(bytes) || integrity.byteLength !== bytes.length) errors.push('integrity_sidecar_invalid')
    } catch { errors.push('integrity_sidecar_missing_or_invalid') }
  }
  return [...new Set(errors)].sort()
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  const artifactPath = process.argv[2] || ARTIFACT_PATH
  const candidate = JSON.parse(await readFile(resolve(root, artifactPath), 'utf8'))
  const errors = await checkArtifact(candidate, { artifactPath })
  console.log(JSON.stringify({ pass: errors.length === 0, basisHead: candidate.basisHead, currentHead: currentHead(), errors }, null, 2))
  if (errors.length) process.exitCode = 1
}

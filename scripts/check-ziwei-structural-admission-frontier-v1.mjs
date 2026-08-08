#!/usr/bin/env node
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { execFileSync } from 'node:child_process'

import { canonicalIdentityJson, checkArtifactIdentity } from '../src/artifactIdentity.js'
import { buildArtifact, SCHEMA, VERSION } from './materialize-ziwei-structural-admission-frontier-v1.mjs'

const ROOT = resolve(new URL('..', import.meta.url).pathname)

export async function checkArtifact(candidate, root = ROOT) {
  const errors = []
  if (candidate?.schemaVersion !== SCHEMA) errors.push('schema')
  if (candidate?.verdictToken !== 'complete_ziwei_structural_admission_frontier_advanced_uncommitted') errors.push('verdict')
  const currentHead = execFileSync('git', ['-c', 'core.fsmonitor=false', 'rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim()
  if (candidate?.basisHead !== currentHead || candidate?.currentHead !== currentHead) errors.push('current_head')
  if (candidate?.scope?.readinessMutation !== false || candidate?.scope?.productionRuleMutation !== false || candidate?.scope?.historicalArtifactsRewritten !== false) errors.push('boundary_mutation')
  if (candidate?.compatibilityEvaluation?.domain?.rowCount !== 150) errors.push('tianfu_domain')
  if (candidate?.compatibilityEvaluation?.legacyDefault?.rows !== 150) errors.push('legacy_default_regression')
  if (candidate?.compatibilityEvaluation?.rawComparison?.legacyMatchRows !== 0) errors.push('legacy_raw_contradiction_lost')
  if (candidate?.compatibilityEvaluation?.rawComparison?.sourceAlignedMatchRows !== 150) errors.push('source_aligned_rows')
  if (candidate?.compatibilityEvaluation?.knownRelation?.matchedRows !== 150 || candidate?.compatibilityEvaluation?.knownRelation?.residualRows !== 0) errors.push('rotation_relation')
  if (candidate?.compatibilityEvaluation?.semanticAuthority !== 'unresolved') errors.push('semantic_authority_promoted')
  if (candidate?.dynamicPalaceIdentity?.exactRows !== 144 || candidate?.dynamicPalaceIdentity?.status !== 'supported_in_audited_scope') errors.push('dynamic_palace_identity')
  if (candidate?.dynamicPalaceIdentity?.contract?.includes('static branch-to-palace identity not required') !== true) errors.push('static_identity_boundary')
  if (candidate?.readinessBeforeAfter?.before?.stableClaimBoundary !== 0 || candidate?.readinessBeforeAfter?.after?.stableClaimBoundary !== 0) errors.push('stable_claim_boundary')
  if (candidate?.readinessBeforeAfter?.after?.readiness !== 'not_safe_to_start' || candidate?.readinessBeforeAfter?.after?.grounding !== 'blocked' || candidate?.readinessBeforeAfter?.after?.activation !== 'experimental') errors.push('readiness_boundary')
  if (!candidate?.blockers?.some((blocker) => blocker.id === 'blocker-tianfu-raw-formula-contradiction' && blocker.status === 'still_blocked')) errors.push('tianfu_blocker')
  if (candidate?.blockers?.some((blocker) => blocker.id === 'blocker-palace-semantic-identity')) errors.push('stale_global_palace_blocker')
  if (candidate?.majorStarClaims?.length !== 14) errors.push('major_star_inventory')
  if (candidate?.counts?.domains !== candidate?.domains?.length || candidate?.counts?.blockers !== candidate?.blockers?.length || candidate?.counts?.majorStarClaims !== candidate?.majorStarClaims?.length) errors.push('counts')
  if (candidate?.counts?.stillBlocked !== candidate?.stillBlocked?.length || candidate?.counts?.resolved !== candidate?.resolvedWithExistingEvidence?.length) errors.push('status_counts')
  if (candidate?.historicalArtifactRelation?.predecessorArtifactsRemainHistorical !== true) errors.push('historical_relation')
  if (candidate?.admissionDecision?.canPromoteStableClaims !== false || candidate?.admissionDecision?.canStartReadinessGrounding !== false) errors.push('admission_promotion')
  const expected = await buildArtifact()
  if (canonicalIdentityJson(candidate) !== canonicalIdentityJson(expected)) errors.push('materialized_content')
  errors.push(...checkArtifactIdentity(candidate, {
    root,
    artifactId: SCHEMA,
    materializerPath: `scripts/materialize-${SCHEMA}.mjs`,
    materializerVersion: VERSION,
  }))
  return [...new Set(errors)]
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  const path = resolve(process.argv[2] || `artifacts/${SCHEMA}/complete.json`)
  const candidate = JSON.parse(await readFile(path, 'utf8'))
  const failures = await checkArtifact(candidate)
  console.log(JSON.stringify({ pass: failures.length === 0, currentHead: candidate.currentHead, counts: candidate.counts, failures }, null, 2))
  if (failures.length) process.exitCode = 1
}

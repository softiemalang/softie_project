#!/usr/bin/env node
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { execFileSync } from 'node:child_process'

import { canonicalIdentityJson, checkArtifactIdentity } from '../src/artifactIdentity.js'
import { buildArtifact, SCHEMA, VERSION } from './materialize-ziwei-inherited-evidence-consumption-frontier-v1.mjs'

const ROOT = resolve(new URL('..', import.meta.url).pathname)
const REQUIRED_PACKETS = ['PKT-MINOR-STARS-V1', 'PKT-12-MAJOR-STARS-V1', 'PKT-TIANFU-RAW-CONTRADICTION-V1']
const REQUIRED_RESOLVED = ['blocker-minor-star-source-witness', 'blocker-12-major-star-direct-rules']

export async function checkArtifact(candidate, root = ROOT) {
  const errors = []
  const currentHead = execFileSync('git', ['-c', 'core.fsmonitor=false', 'rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim()
  if (candidate?.schemaVersion !== SCHEMA || candidate?.verdictToken !== 'complete_ziwei_inherited_evidence_consumed_frontier_advanced_uncommitted') errors.push('schema_or_verdict')
  if (candidate?.basisHead !== currentHead || candidate?.currentHead !== currentHead) errors.push('current_head')
  if (candidate?.scope?.networkOrSourceAcquisition !== false || candidate?.scope?.inheritedObservationPagesNewlyObserved !== 0 || candidate?.scope?.productionRuleMutation !== false || candidate?.scope?.readinessMutation !== false || candidate?.scope?.activationMutation !== false || candidate?.scope?.historicalArtifactsRewritten !== false || candidate?.scope?.semanticAuthorityDecision !== false) errors.push('scope_boundary')
  if (candidate?.predecessor?.historicalArtifactRewritten !== false || candidate?.predecessor?.predecessorWasHistoricalAtThisCheckout !== true) errors.push('historical_predecessor_boundary')
  if (candidate?.packetEvidence?.map(packet => packet.packetId).join('|') !== REQUIRED_PACKETS.join('|')) errors.push('packet_inventory')
  for (const packet of candidate?.packetEvidence ?? []) {
    if (packet.provenanceClass !== 'inherited_direct_observation') errors.push(`packet_provenance:${packet.packetId}`)
    if (packet.witnesses.some(witness => witness.inheritedObservationProvenance.newlyObservedThisTask !== false || !witness.inheritedObservationProvenance.observationIds.length || !witness.sourceLocator.sourceSha256)) errors.push(`packet_witness_provenance:${packet.packetId}`)
  }
  if (candidate?.counts?.startingBlockers !== 10 || candidate?.counts?.endingBlockers !== 8 || candidate?.counts?.trackedBlockers !== 10 || candidate?.counts?.resolvedBlockers !== 2 || candidate?.counts?.stillBlocked !== 8) errors.push('blocker_counts')
  const resolved = candidate?.blockers?.filter(blocker => blocker.status === 'resolved_with_existing_evidence').map(blocker => blocker.id) ?? []
  if (resolved.join('|') !== REQUIRED_RESOLVED.join('|')) errors.push('resolved_blockers')
  if (candidate?.stillBlocked?.length !== 8 || candidate.stillBlocked.some(id => REQUIRED_RESOLVED.includes(id))) errors.push('still_blocked_inventory')
  if (candidate?.minorStarCoverage?.byStar?.length !== 6 || candidate?.minorStarCoverage?.allSixExact !== true) errors.push('minor_scope_or_match')
  if (candidate?.minorStarCoverage?.byStar?.some(row => !row.sourceObservation.sourceCellCount || !row.productionMatch.exactMatch || !row.inheritedObservationRefs.length)) errors.push('minor_claim_provenance')
  if (candidate?.minorStarCoverage?.uncoveredProductionStars?.length !== 7) errors.push('minor_uncovered_boundary')
  if (candidate?.majorStarCoverage?.byStar?.length !== 12 || candidate?.majorStarCoverage?.allTwelveDirectWitnesses !== true) errors.push('major_scope_or_witness')
  if (candidate?.majorStarCoverage?.byStar?.some(row => !row.sourceObservation.inheritedObservationRefs.length || row.sourceObservation.directRuleStatus !== 'direct_witness_acquired')) errors.push('major_claim_provenance')
  if (candidate?.majorStarCoverage?.ziweiSeries?.rawExactRows !== 750 || candidate?.majorStarCoverage?.tianfuSeries?.rawRows !== 0 || candidate?.majorStarCoverage?.tianfuSeries?.normalizedRows !== 1050) errors.push('major_match_boundary')
  const tianfu = candidate?.tianfuRawContradiction
  if (!tianfu?.rawContradictionPreserved || tianfu?.semanticAuthority !== 'unresolved' || tianfu?.legacyConvention?.formula !== '(10-Z)%12' || tianfu?.sourceConvention?.formula !== '(4-Z)%12') errors.push('tianfu_raw_or_semantic_boundary')
  if (tianfu?.compatibility?.legacyDefault?.rows !== 150 || tianfu?.compatibility?.modes?.default !== 'legacy' || tianfu?.compatibility?.knownRelation?.transform !== 'rotation-06' || tianfu?.compatibility?.knownRelation?.matchedRows !== 150 || tianfu?.compatibility?.knownRelation?.residualRows !== 0) errors.push('tianfu_compatibility')
  if (candidate?.readinessBeforeAfter?.before?.stableClaimBoundary !== 0 || candidate?.readinessBeforeAfter?.after?.stableClaimBoundary !== 0 || candidate?.readinessBeforeAfter?.after?.readiness !== 'not_safe_to_start' || candidate?.readinessBeforeAfter?.after?.grounding !== 'blocked' || candidate?.readinessBeforeAfter?.after?.activation !== 'experimental') errors.push('readiness_boundary')
  if (candidate?.admissionDecision?.canPromoteStableClaims !== false || candidate?.admissionDecision?.canStartReadinessGrounding !== false) errors.push('admission_promotion')
  if (candidate?.sourceVsImplementation?.semanticAuthority !== 'unresolved where source convention and semantic palace identity are not established') errors.push('epistemic_layer_boundary')
  const expected = await buildArtifact()
  if (canonicalIdentityJson(candidate) !== canonicalIdentityJson(expected)) errors.push('materialized_content')
  errors.push(...checkArtifactIdentity(candidate, { root, artifactId: SCHEMA, materializerPath: `scripts/materialize-${SCHEMA}.mjs`, materializerVersion: VERSION }))
  return [...new Set(errors)]
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  const path = resolve(process.argv[2] || `artifacts/${SCHEMA}/complete.json`)
  const candidate = JSON.parse(await readFile(path, 'utf8'))
  const failures = await checkArtifact(candidate)
  console.log(JSON.stringify({ pass: failures.length === 0, currentHead: candidate.currentHead, counts: candidate.counts, failures }, null, 2))
  if (failures.length) process.exitCode = 1
}

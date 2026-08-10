import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  BEFORE_FIXTURE_PATH,
  COMPARISON_PATH,
  COMPLETE_PATH,
  DELTA_PATH,
  FRONTIER_PATH,
  REPORT_PATH,
  V1_ARTIFACT_DIR,
  V1_BASELINE,
  buildArtifact,
  canonicalJson,
  sameJson,
} from './materialize-saju-lunar2solar-kasi-mismatch-fix-v1.mjs'

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)))
const TIMEZONE_MISMATCH_IDS = ['tz-rok-1951-dst-start', 'tz-seoul-1954-offset-change']
const EXPECTED_AFTER_COUNTS = {
  exact_match: 1386,
  within_defined_tolerance: 29,
  semantic_mismatch: 2,
  oracle_scope_insufficient: 36,
  authority_unresolved: 3,
}

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')

async function readJson(root, path) {
  const bytes = await readFile(resolve(root, path))
  return { bytes, value: JSON.parse(bytes) }
}

function addFailure(failures, id, detail) {
  failures.push({ id, detail })
}

function requireValue(failures, condition, id, detail) {
  if (!condition) addFailure(failures, id, detail)
}

async function checkV1Bytes(root, failures) {
  const current = []
  for (const [relativePath, byteLength, expectedSha256] of V1_BASELINE) {
    const path = `${V1_ARTIFACT_DIR}/${relativePath}`
    const bytes = await readFile(resolve(root, path))
    const row = { path, byteLength: bytes.length, sha256: sha256(bytes) }
    current.push(row)
    requireValue(failures, row.byteLength === byteLength, `v1_byte_length:${relativePath}`, row)
    requireValue(failures, row.sha256 === expectedSha256, `v1_byte_sha256:${relativePath}`, row)
  }
  return current
}

async function checkIntegrity(root, path, failures) {
  const input = await readFile(resolve(root, path))
  const integrity = await readJson(root, `${path}.integrity.json`)
  requireValue(failures, integrity.value?.schemaVersion === 'saju-lunar2solar-kasi-mismatch-fix-v1-integrity', `integrity_schema:${path}`, integrity.value?.schemaVersion)
  requireValue(failures, integrity.value?.path === path, `integrity_path:${path}`, integrity.value?.path)
  requireValue(failures, integrity.value?.byteLength === input.length, `integrity_length:${path}`, integrity.value?.byteLength)
  requireValue(failures, integrity.value?.byteSha256 === sha256(input), `integrity_hash:${path}`, integrity.value?.byteSha256)
}

export async function checkArtifact({ root = ROOT, candidate, beforeFixture, comparison, delta, frontier, report } = {}) {
  const failures = []
  const diskBefore = await readJson(root, BEFORE_FIXTURE_PATH)
  const diskComparison = await readJson(root, COMPARISON_PATH)
  const diskDelta = await readJson(root, DELTA_PATH)
  const diskFrontier = await readJson(root, FRONTIER_PATH)
  const diskReport = await readJson(root, REPORT_PATH)
  const diskComplete = await readJson(root, COMPLETE_PATH)
  const actualCandidate = candidate || diskComplete.value
  const actualBefore = beforeFixture || diskBefore.value
  const actualComparison = comparison || diskComparison.value
  const actualDelta = delta || diskDelta.value
  const actualFrontier = frontier || diskFrontier.value
  const actualReport = report || diskReport.value
  const expectedArtifact = await buildArtifact({ root })

  for (const path of [BEFORE_FIXTURE_PATH, COMPARISON_PATH, DELTA_PATH, FRONTIER_PATH, REPORT_PATH, COMPLETE_PATH]) await checkIntegrity(root, path, failures)
  await checkV1Bytes(root, failures)

  requireValue(failures, sameJson(actualBefore, diskBefore.value), 'before_fixture_disk_content', 'candidate before fixture is not the disk fixture')
  requireValue(failures, sameJson(actualComparison, diskComparison.value), 'comparison_disk_content', 'candidate comparison is not the disk comparison')
  requireValue(failures, sameJson(actualDelta, diskDelta.value), 'delta_disk_content', 'candidate delta is not the disk delta')
  requireValue(failures, sameJson(actualFrontier, diskFrontier.value), 'frontier_disk_content', 'candidate frontier is not the disk frontier')
  requireValue(failures, sameJson(actualReport, diskReport.value), 'report_disk_content', 'candidate report is not the disk report')
  requireValue(failures, sameJson(actualCandidate, expectedArtifact), 'complete_materialized_content', 'complete does not equal deterministic successor materialization')
  requireValue(failures, sameJson(diskComplete.value, expectedArtifact), 'complete_disk_content', 'disk complete differs from deterministic successor materialization')

  requireValue(failures, actualCandidate?.schemaVersion === 'saju-lunar2solar-kasi-mismatch-fix-v1', 'complete_schema', actualCandidate?.schemaVersion)
  requireValue(failures, actualCandidate?.verdictToken === 'complete_saju_lunar2solar_kasi_mismatch_fix_frontier_exhausted_uncommitted', 'verdict_token', actualCandidate?.verdictToken)
  requireValue(failures, actualCandidate?.scope?.branch === 'main', 'scope_branch', actualCandidate?.scope)
  requireValue(failures, actualCandidate?.scope?.expectedHead === '18be2ff336ef8084566b64724da6dccfb9f76054' && actualCandidate.scope.currentHead === actualCandidate.scope.expectedHead && actualCandidate.scope.originMainHead === actualCandidate.scope.expectedHead, 'scope_heads', actualCandidate?.scope)
  for (const flag of ['commit', 'push', 'deploy', 'remoteDatabaseMutation', 'productionActivation', 'readinessPromotion', 'claimPromotion']) requireValue(failures, actualCandidate?.scope?.[flag] === false, `scope_flag:${flag}`, actualCandidate?.scope?.[flag])
  requireValue(failures, sameJson(actualCandidate?.scope?.existingUntrackedPreserved, ['-.jpg']), 'untracked_preservation', actualCandidate?.scope?.existingUntrackedPreserved)

  requireValue(failures, actualBefore?.summary?.caseCount === 28, 'before_fixture_count', actualBefore?.summary)
  requireValue(failures, actualBefore?.summary?.lunarDayRange?.[0] === 2 && actualBefore.summary.lunarDayRange?.[1] === 29, 'before_fixture_range', actualBefore?.summary)
  requireValue(failures, actualDelta?.caseIdentity?.countBefore === 1456 && actualDelta.caseIdentity.countAfter === 1456 && actualDelta.caseIdentity.exactOrderPreserved === true, 'case_identity_1456', actualDelta?.caseIdentity)
  requireValue(failures, actualDelta?.summary?.v1KnownGuardMismatchCount === 28, 'v1_guard_mismatch_count', actualDelta?.summary)
  requireValue(failures, actualDelta?.summary?.resolvedKnownGuardMismatchCount === 28, 'resolved_guard_mismatch_count', actualDelta?.summary)
  requireValue(failures, actualDelta?.summary?.newMismatchCount === 0, 'new_mismatch_count', actualDelta?.summary)
  requireValue(failures, sameJson(actualDelta?.preservedMismatchIds, TIMEZONE_MISMATCH_IDS), 'timezone_mismatch_preservation', actualDelta?.preservedMismatchIds)
  requireValue(failures, sameJson(actualComparison?.summary?.categoryCounts, EXPECTED_AFTER_COUNTS), 'successor_category_counts', actualComparison?.summary?.categoryCounts)
  requireValue(failures, actualComparison?.summary?.caseCount === 1456, 'successor_case_count', actualComparison?.summary?.caseCount)
  requireValue(failures, sameJson(actualComparison?.summary?.mismatchIds, TIMEZONE_MISMATCH_IDS), 'successor_mismatch_ids', actualComparison?.summary?.mismatchIds)
  requireValue(failures, actualComparison?.summary?.authorityUnresolvedIds?.length === 3, 'authority_blocker_count', actualComparison?.summary?.authorityUnresolvedIds)
  requireValue(failures, actualComparison?.summary?.scopeInsufficientIds?.length === 36, 'oracle_scope_count', actualComparison?.summary?.scopeInsufficientIds)

  const resolvedCases = actualDelta.changedCases.filter(item => actualBefore.caseIds.includes(item.caseId))
  requireValue(failures, resolvedCases.length === 28, 'resolved_case_identity_count', resolvedCases.map(item => item.caseId))
  requireValue(failures, resolvedCases.every(item => item.before.category === 'semantic_mismatch' && item.before.actual === -1 && item.after.category === 'exact_match' && item.after.actual?.solarDate === item.oracle?.solarDate), 'before_after_relation', resolvedCases)
  requireValue(failures, actualFrontier?.supportSweep?.failureCount === 0, 'supported_range_round_trip', actualFrontier?.supportSweep)
  const unsupportedProbeIds = new Set(['solar-before-lower-bound', 'lunar-first-month-overflow-day', 'lunar-before-lower-bound', 'lunar-1900-leap-month-overflow-day', 'lunar-invalid-leap-month', 'lunar-after-upper-bound', 'lunar-after-table-year', 'solar-after-upper-bound'])
  const unsupportedProbes = (actualFrontier?.probes || []).filter(probe => unsupportedProbeIds.has(probe.id))
  requireValue(failures, unsupportedProbes.length === unsupportedProbeIds.size && unsupportedProbes.every(probe => probe.expectedStatus === 'unsupported' && probe.actual === -1), 'unsupported_range_fail_closed', unsupportedProbes)
  requireValue(failures, actualFrontier?.semanticRange?.solarMinimumInclusive === '1900-01-31' && actualFrontier.semanticRange.solarMaximumInclusive === '2100-12-31' && actualFrontier.semanticRange.lunarMinimumInclusive === '1900-01-01' && actualFrontier.semanticRange.lunarMaximumInclusive === '2100-12-01', 'support_range_contract', actualFrontier?.semanticRange)
  requireValue(failures, actualCandidate?.predecessor?.v1ArtifactBytesPreserved === true, 'v1_artifact_byte_preservation', actualCandidate?.predecessor)
  requireValue(failures, actualCandidate?.predecessor?.v1FixedHeadDrift?.classification === 'pre_existing_historical_artifact_drift; v1 files are not rewritten', 'v1_fixed_head_drift_classification', actualCandidate?.predecessor?.v1FixedHeadDrift)
  requireValue(failures, actualCandidate?.readinessBoundary?.predecessorStatus === 'still_blocked' && actualCandidate.readinessBoundary.availableForInterpretation === false && actualCandidate.readinessBoundary.productionActivation === 'blocked' && actualCandidate.readinessBoundary.noAutomaticPromotion === true && actualCandidate.readinessBoundary.unchangedFromV1 === true, 'readiness_unchanged_fail_closed', actualCandidate?.readinessBoundary)
  requireValue(failures, actualReport?.authorityBoundary?.readinessPromotion === false && actualReport.authorityBoundary.productionActivation === false && actualReport.authorityBoundary.claimPromotion === false, 'authority_boundary_unchanged', actualReport?.authorityBoundary)

  return {
    pass: failures.length === 0,
    failures,
    path: COMPLETE_PATH,
    summary: actualComparison?.summary,
    delta: actualDelta?.summary,
    frontier: actualFrontier?.supportSweep,
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const result = await checkArtifact()
  process.stdout.write(JSON.stringify(result, null, 2) + '\n')
  if (!result.pass) process.exitCode = 1
}

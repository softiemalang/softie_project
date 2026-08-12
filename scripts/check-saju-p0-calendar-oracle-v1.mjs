import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  ARTIFACT_DIR,
  COMPARISON_PATH,
  COMPLETE_PATH,
  CORPUS_PATH,
  EXCEPTIONS_PATH,
  EXPECTED_HEAD,
  SOURCE_INVENTORY_PATH,
  VERDICT,
  buildArtifact,
  buildComparison,
  buildExceptions,
  canonicalJson,
} from './materialize-saju-p0-calendar-oracle-v1.mjs'
import { checkHistoricalRepositoryBasis, inspectFileByteIdentity, stableArtifactContentEqual } from '../src/artifactIdentity.js'
import {
  SAJU_LEGACY_ROOT_ASSET_PATH,
  SAJU_SOURCE_DERIVED_ASSET_PATH,
} from '../src/interpretationPrep/sajuSourceDerivedEvidenceAsset.js'

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)))
const SOURCE_IDS = [
  'kasi-monthly-lunisolar',
  'kasi-astronomical-almanac-2026',
  'kasi-astronomical-certificate-channel',
  'hko-24-solar-terms-xml',
  'usno-seasons-api',
  'kriss-utc-kris-kst',
  'iana-tzdb-2026c-asia-seoul',
]
const CATEGORY_KEYS = ['exact_match', 'within_defined_tolerance', 'semantic_mismatch', 'oracle_scope_insufficient', 'authority_unresolved']
const REQUIRED_SOURCE_FIELDS = ['id', 'institution', 'title', 'role', 'urls', 'meaning', 'timeBasis', 'calendarDefinition', 'coverage', 'license', 'independence', 'semanticEquivalence']
const PROTECTED_PATHS = [
  SAJU_SOURCE_DERIVED_ASSET_PATH,
  'artifacts/saju-claim-provenance-v0.json',
  'artifacts/saju-readiness-grounding-v0.json',
  'artifacts/saju-v1-local-frontier-v0/complete.json',
  'src/saju/engine/fourPillars.js',
  'src/saju/engine/solarTerms.js',
  'src/interpretationPrep/lunarConverter.js',
  'src/interpretationPrep/sajuAdapter.js',
  'src/saju/engine/externalValidationFixtures.js',
]

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const canonical = value => canonicalJson(value)

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

function equalJson(left, right) {
  return canonical(left) === canonical(right)
}

function validateSourceInventory(inventory, corpus, failures) {
  requireValue(failures, inventory?.schemaVersion === 'saju-p0-calendar-oracle-source-inventory-v1', 'source_schema', inventory?.schemaVersion)
  requireValue(failures, /^\d{4}-\d{2}-\d{2}$/.test(inventory?.capturedAt || ''), 'source_capture_date', inventory?.capturedAt)
  requireValue(failures, Array.isArray(inventory?.sources) && inventory.sources.length === SOURCE_IDS.length, 'source_count', inventory?.sources?.length)
  requireValue(failures, equalJson(inventory?.sources?.map(source => source.id), SOURCE_IDS), 'source_ids', inventory?.sources?.map(source => source.id))
  for (const source of inventory?.sources || []) {
    for (const field of REQUIRED_SOURCE_FIELDS) requireValue(failures, source[field] !== undefined, `source_field:${source.id}:${field}`, 'missing')
    requireValue(failures, Array.isArray(source.urls) && source.urls.length > 0, `source_urls:${source.id}`, source.urls)
    requireValue(failures, source.independence !== undefined && source.semanticEquivalence !== undefined, `source_semantics:${source.id}`, source.independence)
  }
  requireValue(failures, Array.isArray(inventory?.captures) && inventory.captures.length === 26, 'capture_count', inventory?.captures?.length)
  for (const capture of inventory?.captures || []) {
    requireValue(failures, SOURCE_IDS.includes(capture.sourceId), `capture_source:${capture.sourceId}`, 'unknown source')
    requireValue(failures, typeof capture.request?.url === 'string', `capture_url:${capture.sourceId}`, capture.request)
    requireValue(failures, /^[a-f0-9]{64}$/.test(capture.response?.sha256 || ''), `capture_hash:${capture.sourceId}`, capture.response?.sha256)
    requireValue(failures, Number.isInteger(capture.response?.byteLength) && capture.response.byteLength > 0, `capture_length:${capture.sourceId}`, capture.response?.byteLength)
  }
  const captureCounts = Object.fromEntries(SOURCE_IDS.map(id => [id, inventory.captures.filter(capture => capture.sourceId === id).length]))
  requireValue(failures, equalJson(captureCounts, {
    'kasi-monthly-lunisolar': 15,
    'kasi-astronomical-almanac-2026': 2,
    'kasi-astronomical-certificate-channel': 1,
    'hko-24-solar-terms-xml': 3,
    'usno-seasons-api': 3,
    'kriss-utc-kris-kst': 1,
    'iana-tzdb-2026c-asia-seoul': 1,
  }), 'capture_source_counts', captureCounts)
  requireValue(failures, inventory?.rawRetentionPolicy?.includes('raw HTML/XML/API response bodies are not copied'), 'raw_retention_policy', inventory?.rawRetentionPolicy)
  const historicalProtectedPaths = PROTECTED_PATHS.map(path => path === SAJU_SOURCE_DERIVED_ASSET_PATH ? SAJU_LEGACY_ROOT_ASSET_PATH : path)
  requireValue(failures, Array.isArray(inventory?.protectedBaseline) && inventory.protectedBaseline.length === PROTECTED_PATHS.length, 'protected_baseline_count', inventory?.protectedBaseline?.length)
  requireValue(failures, equalJson(inventory?.protectedBaseline?.map(row => row.path), historicalProtectedPaths), 'protected_baseline_paths', inventory?.protectedBaseline?.map(row => row.path))

  requireValue(failures, corpus?.schemaVersion === 'saju-p0-calendar-oracle-corpus-v1', 'corpus_schema', corpus?.schemaVersion)
  requireValue(failures, equalJson(corpus?.contract?.categories, CATEGORY_KEYS), 'category_contract', corpus?.contract?.categories)
  requireValue(failures, corpus?.contract?.timezone === 'Asia/Seoul' && corpus.contract.currentKstOffsetMinutes === 540, 'timezone_contract', corpus?.contract)
  requireValue(failures, Array.isArray(corpus?.kasiRows) && corpus.kasiRows.length === 454, 'kasi_row_count', corpus?.kasiRows?.length)
  requireValue(failures, new Set((corpus?.kasiRows || []).map(row => row.solarDate)).size === 454, 'kasi_unique_dates', 'duplicate solar dates')
  requireValue(failures, Array.isArray(corpus?.hkoRows) && corpus.hkoRows.length === 72, 'hko_row_count', corpus?.hkoRows?.length)
  requireValue(failures, Array.isArray(corpus?.usnoRows) && corpus.usnoRows.length === 12, 'usno_row_count', corpus?.usnoRows?.length)
  requireValue(failures, Array.isArray(corpus?.timezoneRows) && corpus.timezoneRows.length === 7, 'timezone_row_count', corpus?.timezoneRows?.length)
  requireValue(failures, (corpus?.hkoRows || []).filter(row => row.kind === 'month_entry_term').length === 36, 'hko_month_entry_count', 'expected 36')
  requireValue(failures, (corpus?.hkoRows || []).filter(row => row.kind === 'intermediate_term').length === 36, 'hko_intermediate_count', 'expected 36')
  requireValue(failures, (corpus?.kasiRows || []).filter(row => row.sexagenary?.month === null).length === 54, 'kasi_leap_month_scope', 'expected 54 date-only rows without source sexagenary month')
}

async function validateIntegrityFiles(root, failures) {
  for (const path of [SOURCE_INVENTORY_PATH, CORPUS_PATH, COMPARISON_PATH, EXCEPTIONS_PATH, COMPLETE_PATH]) {
    const input = await readFile(resolve(root, path))
    const integrity = await readJson(root, `${path}.integrity.json`)
    requireValue(failures, integrity.value?.schemaVersion === 'saju-p0-calendar-oracle-integrity-v1', `integrity_schema:${path}`, integrity.value?.schemaVersion)
    requireValue(failures, integrity.value?.path === path, `integrity_path:${path}`, integrity.value?.path)
    requireValue(failures, integrity.value?.byteLength === input.length, `integrity_length:${path}`, integrity.value?.byteLength)
    requireValue(failures, integrity.value?.byteSha256 === sha256(input), `integrity_hash:${path}`, integrity.value?.byteSha256)
  }
}

export async function checkArtifact({ root = ROOT, candidate, comparison } = {}) {
  const failures = []
  const inventoryInput = await readJson(root, SOURCE_INVENTORY_PATH)
  const corpusInput = await readJson(root, CORPUS_PATH)
  const diskComparisonInput = await readJson(root, COMPARISON_PATH)
  const diskExceptionsInput = await readJson(root, EXCEPTIONS_PATH)
  const diskCompleteInput = await readJson(root, COMPLETE_PATH)
  const actualCandidate = candidate || diskCompleteInput.value
  const actualComparison = comparison || diskComparisonInput.value
  const expectedComparison = buildComparison(corpusInput.value)
  const expectedExceptions = buildExceptions(expectedComparison)
  const expectedArtifact = await buildArtifact({ root })
  const basis = checkHistoricalRepositoryBasis(root, EXPECTED_HEAD)
  const historicalSnapshot = basis.status === 'descendant_snapshot'
  const declaredEngineInputs = new Map((actualCandidate?.engineInputs || []).map(input => [input.path, input.sha256]))
  const currentDependencyDrift = (expectedArtifact.engineInputs || [])
    .filter(input => declaredEngineInputs.get(input.path) !== input.sha256)
    .map(input => inspectFileByteIdentity(root, input.path, declaredEngineInputs.get(input.path), { generationBaseHead: EXPECTED_HEAD }))
  const canCompareCurrentMaterializer = !historicalSnapshot || currentDependencyDrift.length === 0

  validateSourceInventory(inventoryInput.value, corpusInput.value, failures)
  await validateIntegrityFiles(root, failures)
  if (canCompareCurrentMaterializer) {
    requireValue(failures, equalJson(actualComparison, expectedComparison), 'comparison_materialized_content', 'comparison does not equal deterministic materializer output')
    requireValue(failures, equalJson(diskComparisonInput.value, expectedComparison), 'comparison_disk_content', 'disk comparison differs from deterministic output')
    requireValue(failures, equalJson(diskExceptionsInput.value, expectedExceptions), 'exceptions_disk_content', 'disk exceptions differs from deterministic output')
    requireValue(failures, stableArtifactContentEqual(actualCandidate, expectedArtifact), 'complete_materialized_content', 'complete does not equal deterministic materializer output')
    requireValue(failures, stableArtifactContentEqual(diskCompleteInput.value, expectedArtifact), 'complete_disk_content', 'disk complete differs from deterministic output')
  } else {
    requireValue(failures, equalJson(actualComparison, diskComparisonInput.value), 'comparison_materialized_content', 'candidate comparison differs from frozen historical comparison')
    requireValue(failures, equalJson(actualCandidate, diskCompleteInput.value), 'complete_materialized_content', 'candidate complete differs from frozen historical artifact')
  }
  requireValue(failures, actualCandidate?.schemaVersion === 'saju-p0-calendar-oracle-v1', 'complete_schema', actualCandidate?.schemaVersion)
  requireValue(failures, actualCandidate?.verdictToken === VERDICT, 'verdict_token', actualCandidate?.verdictToken)
  requireValue(failures, actualCandidate?.scope?.branch === 'main', 'scope_branch', actualCandidate?.scope?.branch)
  requireValue(failures, actualCandidate?.scope?.expectedHead === EXPECTED_HEAD && /^[0-9a-f]{40}$/.test(actualCandidate?.scope?.currentHead || '') && /^[0-9a-f]{40}$/.test(actualCandidate?.scope?.originMainHead || '') && basis.errors.length === 0, 'scope_heads', actualCandidate?.scope)
  for (const flag of ['commit', 'push', 'deploy', 'remoteDatabaseMutation', 'productionActivation', 'readinessPromotion', 'claimPromotion']) requireValue(failures, actualCandidate?.scope?.[flag] === false, `scope_flag:${flag}`, actualCandidate?.scope?.[flag])
  requireValue(failures, equalJson(actualCandidate?.scope?.existingUntrackedPreserved, ['-.jpg']), 'untracked_preservation', actualCandidate?.scope?.existingUntrackedPreserved)
  requireValue(failures, actualCandidate?.blocker?.id === 'saju-b-calendar-boundaries' && actualCandidate.blocker.priority === 'P0', 'blocker_identity', actualCandidate?.blocker)
  requireValue(failures, actualCandidate?.blocker?.predecessorStatus === 'still_blocked' && actualCandidate.blocker.readinessAndProduction === 'unchanged_blocked', 'readiness_boundary', actualCandidate?.blocker)
  requireValue(failures, actualCandidate?.readinessBoundary?.availableForInterpretation === false && actualCandidate.readinessBoundary.productionActivation === 'blocked' && actualCandidate.readinessBoundary.noAutomaticPromotion === true, 'fail_closed_readiness', actualCandidate?.readinessBoundary)
  requireValue(failures, actualCandidate?.deterministic?.networkFetchDuringMaterialization === false && actualCandidate.deterministic.sourceAcquisitionPerformedDuringMaterialization === false && actualCandidate.deterministic.inputsAreVersionedCaptures === true, 'deterministic_boundary', actualCandidate?.deterministic)
  requireValue(failures, actualCandidate?.protectedBaselineCheck?.pass === true && Array.isArray(actualCandidate.protectedBaselineCheck.mismatches) && actualCandidate.protectedBaselineCheck.mismatches.length === 0, 'protected_baseline', actualCandidate?.protectedBaselineCheck)
  requireValue(failures, equalJson(actualCandidate?.comparisonArtifact?.summary, actualComparison?.summary), 'comparison_summary', actualCandidate?.comparisonArtifact?.summary)
  requireValue(failures, actualCandidate?.exceptionArtifact?.path === EXCEPTIONS_PATH, 'exception_path', actualCandidate?.exceptionArtifact?.path)
  requireValue(failures, equalJson(actualCandidate?.exceptionArtifact?.summary, diskExceptionsInput.value?.summary), 'exception_summary', actualCandidate?.exceptionArtifact?.summary)
  requireValue(failures, actualCandidate?.exceptionArtifact?.summary?.exceptionCount === 69, 'exception_count', actualCandidate?.exceptionArtifact?.summary)
  requireValue(failures, actualComparison?.summary?.caseCount === 1456, 'comparison_case_count', actualComparison?.summary?.caseCount)
  requireValue(failures, equalJson(actualComparison?.summary?.categoryCounts, {
    exact_match: 1358,
    within_defined_tolerance: 29,
    semantic_mismatch: 30,
    oracle_scope_insufficient: 36,
    authority_unresolved: 3,
  }), 'comparison_category_counts', actualComparison?.summary?.categoryCounts)
  requireValue(failures, actualComparison?.summary?.mismatchIds?.length === 30, 'comparison_mismatch_count', actualComparison?.summary?.mismatchIds?.length)
  requireValue(failures, actualComparison?.summary?.authorityUnresolvedIds?.length === 3, 'comparison_authority_count', actualComparison?.summary?.authorityUnresolvedIds?.length)
  requireValue(failures, actualComparison?.summary?.scopeInsufficientIds?.length === 36, 'comparison_scope_count', actualComparison?.summary?.scopeInsufficientIds?.length)
  return {
    pass: failures.length === 0,
    failures,
    path: `${ARTIFACT_DIR}/complete.json`,
    summary: actualComparison?.summary,
    historicalSnapshotAccepted: historicalSnapshot,
    currentDependencyDrift,
    currentMaterializerMatches: stableArtifactContentEqual(actualCandidate, expectedArtifact),
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const result = await checkArtifact()
  process.stdout.write(JSON.stringify(result, null, 2) + '\n')
  if (!result.pass) process.exitCode = 1
}

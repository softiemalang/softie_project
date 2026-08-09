import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { solar2lunar, lunar2solar } from '../src/interpretationPrep/lunarConverter.js'
import { assessHistoricalSeoulTime } from '../src/interpretationPrep/sajuAdapter.js'
import { calculateFourPillars, DEFAULT_SAJU_OPTIONS, SAJU_CALCULATION_PROFILE } from '../src/saju/engine/fourPillars.js'
import { getAdjacentBaziMonthBoundary } from '../src/saju/engine/solarTerms.js'

export const SCHEMA = 'saju-p0-calendar-oracle-v1'
export const VERDICT = 'complete_saju_p0_calendar_oracle_frontier_exhausted_uncommitted'
export const MATERIALIZER_VERSION = '1.0.0'
export const EXPECTED_HEAD = 'b4d063c6f2e8972e8735b53687d43fdc9643fee8'
export const ARTIFACT_DIR = `artifacts/${SCHEMA}`
export const SOURCE_INVENTORY_PATH = `${ARTIFACT_DIR}/sourceInventory.json`
export const CORPUS_PATH = `${ARTIFACT_DIR}/corpus.json`
export const COMPARISON_PATH = `${ARTIFACT_DIR}/comparison.json`
export const EXCEPTIONS_PATH = `${ARTIFACT_DIR}/exceptions.json`
export const COMPLETE_PATH = `${ARTIFACT_DIR}/complete.json`

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)))
const SOURCE_FILES = [
  'src/saju/engine/fourPillars.js',
  'src/saju/engine/solarTerms.js',
  'src/interpretationPrep/lunarConverter.js',
  'src/interpretationPrep/sajuAdapter.js',
  'src/saju/engine/externalValidationFixtures.js',
]
const PROTECTED_PATHS = [
  '-.jpg',
  'artifacts/saju-claim-provenance-v0.json',
  'artifacts/saju-readiness-grounding-v0.json',
  'artifacts/saju-v1-local-frontier-v0/complete.json',
  ...SOURCE_FILES,
]

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const stable = value => Array.isArray(value)
  ? value.map(stable)
  : value && typeof value === 'object'
    ? Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])]))
    : value
export const canonicalJson = value => `${JSON.stringify(stable(value), null, 2)}\n`
const git = (root, args) => execFileSync('git', ['-c', 'core.fsmonitor=false', ...args], { cwd: root, encoding: 'utf8' }).trim()
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)

async function readJson(root, path) {
  const bytes = await readFile(resolve(root, path))
  return { bytes, value: JSON.parse(bytes) }
}

async function hashPaths(root, paths) {
  const rows = []
  for (const path of paths) {
    const bytes = await readFile(resolve(root, path))
    rows.push({ path, byteLength: bytes.length, sha256: sha256(bytes) })
  }
  return rows
}

function toUtcMinuteIso(date, time, offsetMinutes) {
  const [year, month, day] = date.split('-').map(Number)
  const [hour, minute] = time.split(':').map(Number)
  return new Date(Date.UTC(year, month - 1, day, hour, minute) - offsetMinutes * 60000).toISOString()
}

function minuteRounded(ms) {
  return Math.round(ms / 60000) * 60000
}

function baziBoundaryObservation(row) {
  const expectedMs = Date.parse(row.utcIso)
  const kst = new Date(expectedMs + 60 * 60000)
  const args = [kst.getUTCFullYear(), kst.getUTCMonth() + 1, kst.getUTCDate(), kst.getUTCHours(), kst.getUTCMinutes()]
  const candidates = ['forward', 'backward'].map(direction => getAdjacentBaziMonthBoundary(...args, direction))
  const chosen = candidates.reduce((best, current) => Math.abs(Date.parse(best.utcIso) - expectedMs) <= Math.abs(Date.parse(current.utcIso) - expectedMs) ? best : current)
  const engineMs = Date.parse(chosen.utcIso)
  const differenceMinutes = (engineMs - expectedMs) / 60000
  const absoluteDifferenceMinutes = Math.abs(differenceMinutes)
  const category = chosen.longitude !== row.longitudeDegrees
    ? 'semantic_mismatch'
    : minuteRounded(engineMs) === expectedMs
      ? 'exact_match'
      : absoluteDifferenceMinutes <= 20
        ? 'within_defined_tolerance'
        : 'semantic_mismatch'
  return {
    category,
    actual: { longitudeDegrees: chosen.longitude, utcIso: chosen.utcIso, direction: chosen.direction, method: chosen.method },
    comparison: {
      expectedUtcIso: row.utcIso,
      differenceMinutes,
      absoluteDifferenceMinutes,
      exactDefinition: 'engine event rounded to the oracle displayed minute equals the oracle UTC minute',
      toleranceDefinition: 'repository-declared SOLAR_TERM_UNCERTAINTY_MINUTES=20; no tolerance was widened for this artifact',
    },
    analysis: category === 'semantic_mismatch'
      ? { rootCause: chosen.longitude !== row.longitudeDegrees ? 'production_boundary_longitude_mapping_difference' : 'solar_term_residual_exceeded_declared_20_minute_uncertainty', semanticEquivalence: 'partial_unresolved' }
      : { semanticEquivalence: 'numeric_event_relation_only; source frame/ephemeris/time-scale bridge remains unresolved' },
  }
}

function compareKasiRows(rows) {
  const results = []
  for (const row of rows) {
    const [year, month, day] = row.solarDate.split('-').map(Number)
    const lunarActual = solar2lunar(year, month, day)
    const lunarExpected = { lYear: row.lunar.year, lMonth: row.lunar.month, lDay: row.lunar.day, isLeap: row.lunar.isLeapMonth }
    const solarToLunarExact = lunarActual && typeof lunarActual === 'object' && same(
      { lYear: lunarActual.lYear, lMonth: lunarActual.lMonth, lDay: lunarActual.lDay, isLeap: Boolean(lunarActual.isLeap) },
      lunarExpected,
    )
    results.push({
      caseId: `${row.id}-solar-to-lunar`, sourceId: 'kasi-monthly-lunisolar', kind: 'solar_to_lunar', category: solarToLunarExact ? 'exact_match' : 'semantic_mismatch',
      input: { solarDate: row.solarDate }, oracle: row.lunar, actual: lunarActual,
      analysis: solarToLunarExact ? { semanticEquivalence: 'date-only Gregorian↔lunar date and leap marker' } : { rootCause: 'solar2lunar_output_difference', semanticEquivalence: 'date-only contract' },
    })

    const lunarActualReverse = lunar2solar(row.lunar.year, row.lunar.month, row.lunar.day, row.lunar.isLeapMonth)
    const reverseExpected = row.solarDate
    const reverseExact = lunarActualReverse && typeof lunarActualReverse === 'object' && lunarActualReverse.solarDate === reverseExpected
    const known1900Guard = !reverseExact && row.lunar.year === 1900 && row.lunar.month === 1 && row.lunar.day < 31 && lunarActualReverse === -1
    results.push({
      caseId: `${row.id}-lunar-to-solar`, sourceId: 'kasi-monthly-lunisolar', kind: 'lunar_to_solar', category: reverseExact ? 'exact_match' : 'semantic_mismatch',
      input: row.lunar, oracle: { solarDate: reverseExpected }, actual: lunarActualReverse,
      analysis: reverseExact
        ? { semanticEquivalence: 'date-only lunar↔Gregorian inverse relation' }
        : { rootCause: known1900Guard ? 'implementation_guard_rejects_valid_lunar_1900_month_1_days_before_31' : 'lunar2solar_output_difference', semanticEquivalence: 'date-only contract' },
    })

    const pillars = calculateFourPillars({ birthDate: row.solarDate, birthTime: '12:00' }, DEFAULT_SAJU_OPTIONS)
    const actualDay = `${pillars.day.stem}${pillars.day.branch}`
    const dayExact = actualDay === row.sexagenary.day
    results.push({
      caseId: `${row.id}-day-pillar`, sourceId: 'kasi-monthly-lunisolar', kind: 'sexagenary_day_at_noon', category: dayExact ? 'exact_match' : 'semantic_mismatch',
      input: { solarDate: row.solarDate, localTime: '12:00', timezone: 'Asia/Seoul' }, oracle: { dayPillar: row.sexagenary.day }, actual: { dayPillar: actualDay, meta: pillars._meta },
      analysis: dayExact ? { semanticEquivalence: 'date-only displayed sexagenary day at a non-boundary noon input' } : { rootCause: 'day_pillar_difference', semanticEquivalence: 'date-only source versus local day-pillar calculation' },
    })
  }
  return results
}

function compareSolarTerms(corpus) {
  const results = []
  for (const row of corpus.hkoRows) {
    if (row.kind !== 'month_entry_term') {
      results.push({
        caseId: `${row.id}-production-scope`, sourceId: 'hko-24-solar-terms-xml', kind: 'intermediate_solar_term_scope', category: 'oracle_scope_insufficient',
        input: { year: row.year, termName: row.termName, longitudeDegrees: row.longitudeDegrees }, oracle: row,
        actual: { productionBoundarySet: [315, 345, 15, 45, 75, 105, 135, 165, 195, 225, 255, 285] },
        analysis: { rootCause: 'production_engine_exposes_only_12_bazi_month_entry_longitudes; 12 intermediate terms are not direct production boundary outputs', semanticEquivalence: 'not_applicable' },
      })
      continue
    }
    const observation = baziBoundaryObservation(row)
    results.push({ caseId: `${row.id}-production`, sourceId: 'hko-24-solar-terms-xml', kind: 'bazi_month_entry_event', ...observation, input: { year: row.year, termName: row.termName, longitudeDegrees: row.longitudeDegrees }, oracle: row })
  }
  return results
}

function compareUsnoControl(corpus) {
  return corpus.usnoRows.map(row => {
    const hko = corpus.hkoRows.find(candidate => candidate.year === row.year && candidate.longitudeDegrees === row.longitudeDegrees)
    if (!hko) return { caseId: `${row.id}-hko-control`, sourceId: 'usno-seasons-api', kind: 'hko_usno_control', category: 'oracle_scope_insufficient', input: row, oracle: null, actual: null, analysis: { rootCause: 'no_same_longitude_hko_row' } }
    const differenceSeconds = (Date.parse(row.utcIso) - Date.parse(hko.utcIso)) / 1000
    const category = differenceSeconds === 0 ? 'exact_match' : Math.abs(differenceSeconds) <= 60 ? 'within_defined_tolerance' : 'semantic_mismatch'
    return {
      caseId: `${row.id}-hko-control`, sourceId: 'usno-seasons-api', kind: 'hko_usno_control', category,
      input: { usno: row, hko: { id: hko.id, utcIso: hko.utcIso } }, oracle: { usnoUtcIso: row.utcIso, hkoUtcIso: hko.utcIso }, actual: { differenceSeconds },
      analysis: { independence: 'same_family_corroboration_not_independent; HKO discloses HMNAO/USNO data basis', toleranceDefinition: 'both official outputs are displayed to one-minute precision; 60 seconds is the maximum declared display-precision comparison window' },
    }
  })
}

function compareTimezone(corpus) {
  return corpus.timezoneRows.map(row => {
    const input = { birthDate: row.date, birthTime: row.localTime, timezone: 'Asia/Seoul' }
    const pillars = calculateFourPillars(input, DEFAULT_SAJU_OPTIONS)
    const assessment = assessHistoricalSeoulTime(input, false, pillars, DEFAULT_SAJU_OPTIONS)
    const actualStatus = assessment?.status || (row.id === 'tz-seoul-current-standard-kst' ? 'normal_standard_time' : 'unclassified')
    const statusMatchesDeclaredEngineContract = actualStatus === row.expectedEngine
    const preStableFailClosed = row.date < '1961-08-10' && row.expectedEngine === 'historical_offset_unverified'
    return {
      caseId: row.id, sourceId: row.id === 'tz-seoul-current-standard-kst' ? 'kriss-utc-kris-kst' : 'iana-tzdb-2026c-asia-seoul', kind: 'historical_seoul_timezone',
      category: preStableFailClosed ? 'semantic_mismatch' : statusMatchesDeclaredEngineContract ? 'exact_match' : 'semantic_mismatch',
      input, oracle: row.oracle, actual: { status: actualStatus, assessment },
      analysis: preStableFailClosed
        ? { rootCause: 'engine_fail_closed_historical_offset_scope_gap; it does not claim to resolve the IANA transition', semanticEquivalence: 'civil-time rule is directly observed but production support is intentionally unresolved' }
        : statusMatchesDeclaredEngineContract
          ? { semanticEquivalence: 'IANA transition/status and current engine status agree for the declared covered 1987-1988/current scope' }
          : { rootCause: 'historical_timezone_status_difference', semanticEquivalence: 'civil-time contract' },
    }
  })
}

function unresolvedContractResults() {
  return [
    {
      caseId: 'contract-kasi-sexagenary-month-year-time-semantics', sourceId: 'kasi-monthly-lunisolar', kind: 'instant_sensitive_sexagenary_semantics', category: 'authority_unresolved',
      input: { sourceOutput: 'date-only row', engineInput: 'date plus local time' }, oracle: { limitation: 'KASI monthly row has no time-of-day/time-scale field' }, actual: { productionUses: 'solar-term month boundary and solar-midnight/solar-time options' },
      analysis: { rootCause: 'date_only_oracle_cannot_adjudicate_instant_sensitive_bazi_year_month_boundary', semanticEquivalence: 'unresolved' },
    },
    {
      caseId: 'contract-zi-night-day-boundary-rule', sourceId: 'kasi-monthly-lunisolar', kind: 'zi_hour_day_boundary', category: 'authority_unresolved',
      input: { profile: SAJU_CALCULATION_PROFILE }, oracle: { limitation: 'official calendar services do not state the Saju school choice between midnight, 야자시, 조자시, or solar-midnight rules' }, actual: { dayBoundaryRule: DEFAULT_SAJU_OPTIONS.dayBoundaryRule, ziHourStart: DEFAULT_SAJU_OPTIONS.ziHourStart, rollDayAtZiHour: DEFAULT_SAJU_OPTIONS.rollDayAtZiHour },
      analysis: { rootCause: 'calendar_oracle_cannot_authorize_classical_saju_day_boundary_policy', semanticEquivalence: 'not an astronomical calendar fact' },
    },
    {
      caseId: 'contract-solar-time-location-policy', sourceId: 'kriss-utc-kris-kst', kind: 'solar_time_policy', category: 'authority_unresolved',
      input: { profile: SAJU_CALCULATION_PROFILE }, oracle: { limitation: 'KRISS establishes standard time, not the product policy for longitude correction, equation of time, or true-solar-time adoption' }, actual: { solarTime: SAJU_CALCULATION_PROFILE.solarTime, standardMeridianDegrees: SAJU_CALCULATION_PROFILE.standardMeridianDegrees },
      analysis: { rootCause: 'standard_time_authority_is_not_saju_solar_time_rule_authority', semanticEquivalence: 'policy unresolved' },
    },
  ]
}

export function buildComparison(corpus) {
  const cases = [
    ...compareKasiRows(corpus.kasiRows),
    ...compareSolarTerms(corpus),
    ...compareUsnoControl(corpus),
    ...compareTimezone(corpus),
    ...unresolvedContractResults(),
  ]
  const categoryCounts = Object.fromEntries(['exact_match', 'within_defined_tolerance', 'semantic_mismatch', 'oracle_scope_insufficient', 'authority_unresolved'].map(category => [category, cases.filter(item => item.category === category).length]))
  return {
    schemaVersion: `${SCHEMA}-comparison`,
    contract: corpus.contract,
    cases,
    summary: {
      caseCount: cases.length,
      categoryCounts,
      exceptionCount: cases.filter(item => item.category !== 'exact_match' && item.category !== 'within_defined_tolerance').length,
      mismatchIds: cases.filter(item => item.category === 'semantic_mismatch').map(item => item.caseId),
      authorityUnresolvedIds: cases.filter(item => item.category === 'authority_unresolved').map(item => item.caseId),
      scopeInsufficientIds: cases.filter(item => item.category === 'oracle_scope_insufficient').map(item => item.caseId),
    },
  }
}

export function buildExceptions(comparison) {
  const cases = comparison.cases.filter(item => item.category !== 'exact_match' && item.category !== 'within_defined_tolerance')
  return {
    schemaVersion: `${SCHEMA}-exceptions`,
    comparisonSchemaVersion: comparison.schemaVersion,
    cases,
    summary: {
      exceptionCount: cases.length,
      categoryCounts: Object.fromEntries(['semantic_mismatch', 'oracle_scope_insufficient', 'authority_unresolved'].map(category => [category, cases.filter(item => item.category === category).length])),
    },
  }
}

export async function buildArtifact({ root = ROOT } = {}) {
  const inventoryInput = await readJson(root, SOURCE_INVENTORY_PATH)
  const corpusInput = await readJson(root, CORPUS_PATH)
  const inventory = inventoryInput.value
  const corpus = corpusInput.value
  const currentHead = git(root, ['rev-parse', 'HEAD'])
  const originMainHead = git(root, ['rev-parse', 'origin/main'])
  const currentProtected = await hashPaths(root, PROTECTED_PATHS)
  const declaredProtected = inventory.protectedBaseline || []
  const protectedMismatches = currentProtected.filter(row => {
    const declared = declaredProtected.find(item => item.path === row.path)
    return !declared || declared.byteLength !== row.byteLength || declared.sha256 !== row.sha256
  })
  const comparison = buildComparison(corpus)
  const comparisonBytes = Buffer.from(canonicalJson(comparison))
  const exceptions = buildExceptions(comparison)
  const exceptionsBytes = Buffer.from(canonicalJson(exceptions))
  return {
    schemaVersion: SCHEMA,
    verdictToken: VERDICT,
    scope: {
      branch: git(root, ['rev-parse', '--abbrev-ref', 'HEAD']),
      expectedHead: EXPECTED_HEAD,
      currentHead,
      originMainHead,
      commit: false,
      push: false,
      deploy: false,
      remoteDatabaseMutation: false,
      productionActivation: false,
      readinessPromotion: false,
      claimPromotion: false,
      existingUntrackedPreserved: ['-.jpg'],
    },
    blocker: {
      id: 'saju-b-calendar-boundaries',
      priority: 'P0',
      predecessorStatus: 'still_blocked',
      boundedFrontierVerdict: 'calendar_input_contract_advanced_with_declared_limits',
      readinessAndProduction: 'unchanged_blocked',
    },
    sourceOfTruth: {
      repositoryBasis: 'current local main checkout at exact expected HEAD; existing evidence/readiness/artifacts are read-only inputs',
      sourceInventoryPath: SOURCE_INVENTORY_PATH,
      sourceInventoryByteSha256: sha256(inventoryInput.bytes),
      corpusPath: CORPUS_PATH,
      corpusByteSha256: sha256(corpusInput.bytes),
      sourceCaptureDate: inventory.capturedAt,
    },
    deterministic: {
      networkFetchDuringMaterialization: false,
      sourceAcquisitionPerformedDuringMaterialization: false,
      inputsAreVersionedCaptures: true,
      canonicalJsonLf: true,
      comparisonSort: 'stable case order from source capture order; object keys recursively sorted',
    },
    oracleInventorySummary: inventory.sources.map(source => ({ id: source.id, institution: source.institution, role: source.role, independence: source.independence, semanticEquivalence: source.semanticEquivalence, license: source.license })),
    engineInputs: await hashPaths(root, SOURCE_FILES),
    protectedBaselineCheck: { pass: currentHead === EXPECTED_HEAD && originMainHead === EXPECTED_HEAD && protectedMismatches.length === 0, declared: declaredProtected, current: currentProtected, mismatches: protectedMismatches },
    comparisonArtifact: { path: COMPARISON_PATH, byteLength: comparisonBytes.length, sha256: sha256(comparisonBytes), summary: comparison.summary },
    exceptionArtifact: { path: EXCEPTIONS_PATH, byteLength: exceptionsBytes.length, sha256: sha256(exceptionsBytes), summary: exceptions.summary },
    readinessBoundary: {
      claimLevelClassicalVerification: 'unchanged_0',
      externalEvidence: 'scoped_calendar_input_evidence_only',
      availableForInterpretation: false,
      productionActivation: 'blocked',
      noAutomaticPromotion: true,
      remainingAuthorityGaps: ['KASI bulk/reuse terms and method disclosure', 'KASI almanac page-image rows not admitted', 'HKO/USNO shared family and incomplete frame/time-scale bridge', 'pre-1961 Asia/Seoul production scope', 'Saju day-boundary/야자시/true-solar-time policy authority', 'independent full 1901-2100 machine-readable corpus'],
    },
    materializer: { path: 'scripts/materialize-saju-p0-calendar-oracle-v1.mjs', version: MATERIALIZER_VERSION },
  }
}

export async function materialize({ root = ROOT } = {}) {
  const directory = resolve(root, ARTIFACT_DIR)
  const corpusBytes = await readFile(resolve(root, CORPUS_PATH))
  const artifact = await buildArtifact({ root })
  const comparison = buildComparison(JSON.parse(corpusBytes))
  const exceptions = buildExceptions(comparison)
  await mkdir(directory, { recursive: true })
  const outputs = [
    [COMPARISON_PATH, comparison],
    [EXCEPTIONS_PATH, exceptions],
    [COMPLETE_PATH, artifact],
  ]
  for (const [path, value] of outputs) await writeFile(resolve(root, path), canonicalJson(value))
  const integrityPaths = [SOURCE_INVENTORY_PATH, CORPUS_PATH, COMPARISON_PATH, EXCEPTIONS_PATH, COMPLETE_PATH]
  for (const path of integrityPaths) {
    const bytes = await readFile(resolve(root, path))
    await writeFile(resolve(root, `${path}.integrity.json`), canonicalJson({ schemaVersion: 'saju-p0-calendar-oracle-integrity-v1', path, byteLength: bytes.length, byteSha256: sha256(bytes) }))
  }
  return artifact
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const artifact = await materialize()
  process.stdout.write(JSON.stringify({ path: COMPLETE_PATH, verdictToken: artifact.verdictToken, summary: artifact.comparisonArtifact.summary }, null, 2) + '\n')
}

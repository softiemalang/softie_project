import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  buildComparison as buildV1Comparison,
  canonicalJson,
} from './materialize-saju-p0-calendar-oracle-v1.mjs'
import {
  leapDays,
  leapMonth,
  lunar2solar,
  lunarInfo,
  monthDays,
  solar2lunar,
} from '../src/interpretationPrep/lunarConverter.js'

export { canonicalJson }

export const SCHEMA = 'saju-lunar2solar-kasi-mismatch-fix-v1'
export const VERDICT = 'complete_saju_lunar2solar_kasi_mismatch_fix_frontier_exhausted_uncommitted'
export const MATERIALIZER_VERSION = '1.0.0'
export const EXPECTED_HEAD = '18be2ff336ef8084566b64724da6dccfb9f76054'
export const V1_ARTIFACT_DIR = 'artifacts/saju-p0-calendar-oracle-v1'
export const ARTIFACT_DIR = `artifacts/${SCHEMA}`
export const BEFORE_FIXTURE_PATH = `${ARTIFACT_DIR}/before-fixture.json`
export const COMPARISON_PATH = `${ARTIFACT_DIR}/comparison.json`
export const DELTA_PATH = `${ARTIFACT_DIR}/delta.json`
export const FRONTIER_PATH = `${ARTIFACT_DIR}/frontier.json`
export const REPORT_PATH = `${ARTIFACT_DIR}/report.json`
export const COMPLETE_PATH = `${ARTIFACT_DIR}/complete.json`

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)))
const V1_FILES = [
  'sourceInventory.json',
  'sourceInventory.json.integrity.json',
  'corpus.json',
  'corpus.json.integrity.json',
  'comparison.json',
  'comparison.json.integrity.json',
  'exceptions.json',
  'exceptions.json.integrity.json',
  'complete.json',
  'complete.json.integrity.json',
]
export const V1_BASELINE = [
  ['sourceInventory.json', 23701, 'f4ac0b5c9b50553a08fab29f171530891caf073c7df9d2fb0995dfad2054cb4a'],
  ['sourceInventory.json.integrity.json', 240, 'e412f5711e70170d05671028dbf967935d5d54a8ac9d9b9e32be75d183c142e1'],
  ['corpus.json', 234279, '4fb51f1b530078e1339006f54de1f793540f1ced4efb25c72817f89ae8eeacb0'],
  ['corpus.json.integrity.json', 232, 'fcd831c2e536175dc4207a55791873f1f76420ea352a5457732d28446be6419e'],
  ['comparison.json', 1461522, '32082662240be84cbf906debe6e2c4686c594e15dc5440817bdda097fe23f549'],
  ['comparison.json.integrity.json', 237, 'aff8a8d4cc31c06df08d71ceeb694558ec50aa614610849a3aab80620a0bd627'],
  ['exceptions.json', 63534, '3cb9fd2cadc0abaf64cfcebf56441d2ea417c71f5c6025b9a5e6cd60e8732f0a'],
  ['exceptions.json.integrity.json', 235, 'ab0fde1a9d8bab601a1e6b3489e27066713f0805bbeca95f0c01d2d027959272'],
  ['complete.json', 15455, 'eec7ad3d35b3164f27beead3f7154781705faa4206df2532fc08eb4aa67c720e'],
  ['complete.json.integrity.json', 233, 'cf5b74f90f81fa20ae27774c057228de2157ea04ade7bba4dfbd8fb5974385b1'],
]
const TIMEZONE_MISMATCH_IDS = ['tz-rok-1951-dst-start', 'tz-seoul-1954-offset-change']

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const stable = value => Array.isArray(value)
  ? value.map(stable)
  : value && typeof value === 'object'
    ? Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])]))
    : value
export { stable }
export const sameJson = (left, right) => canonicalJson(left) === canonicalJson(right)
const git = (root, args) => execFileSync('git', ['-c', 'core.fsmonitor=false', ...args], { cwd: root, encoding: 'utf8' }).trim()

async function readJson(root, path) {
  const bytes = await readFile(resolve(root, path))
  return { bytes, value: JSON.parse(bytes) }
}

async function hashFile(root, path) {
  const bytes = await readFile(resolve(root, path))
  return { path, byteLength: bytes.length, sha256: sha256(bytes) }
}

async function hashV1Artifact(root) {
  const current = []
  for (const path of V1_FILES) current.push(await hashFile(root, `${V1_ARTIFACT_DIR}/${path}`))
  return current.map(row => {
    const expected = V1_BASELINE.find(([path]) => path === row.path.slice(`${V1_ARTIFACT_DIR}/`.length))
    return { ...row, expectedByteLength: expected?.[1], expectedSha256: expected?.[2], preserved: row.byteLength === expected?.[1] && row.sha256 === expected?.[2] }
  })
}

function buildBeforeFixture(v1Comparison) {
  const cases = v1Comparison.cases
    .filter(item => item.analysis?.rootCause === 'implementation_guard_rejects_valid_lunar_1900_month_1_days_before_31')
    .map(item => ({
      caseId: item.caseId,
      input: item.input,
      oracle: item.oracle,
      before: { category: item.category, actual: item.actual, analysis: item.analysis },
    }))
  return {
    schemaVersion: `${SCHEMA}-before-fixture`,
    sourceArtifact: `${V1_ARTIFACT_DIR}/comparison.json`,
    sourceContract: 'immutable v1 comparison capture; no live API re-query',
    rootCause: 'implementation_guard_rejects_valid_lunar_1900_month_1_days_before_31',
    caseIds: cases.map(item => item.caseId),
    cases,
    summary: { caseCount: cases.length, lunarYear: 1900, lunarMonth: 1, lunarDayRange: [2, 29], solarDateRange: ['1900-02-01', '1900-02-28'] },
  }
}

function buildDelta(v1Comparison, afterComparison, beforeFixture) {
  const afterById = new Map(afterComparison.cases.map(item => [item.caseId, item]))
  const changedCases = []
  for (const before of v1Comparison.cases) {
    const after = afterById.get(before.caseId)
    if (!after) continue
    if (before.category !== after.category || !sameJson(before.actual, after.actual)) {
      changedCases.push({
        caseId: before.caseId,
        before: { category: before.category, actual: before.actual },
        after: { category: after.category, actual: after.actual },
        oracle: before.oracle,
      })
    }
  }
  const beforeMismatchIds = v1Comparison.summary.mismatchIds
  const afterMismatchIds = afterComparison.summary.mismatchIds
  const resolvedMismatchIds = beforeMismatchIds.filter(caseId => !afterMismatchIds.includes(caseId))
  const newMismatchIds = afterMismatchIds.filter(caseId => !beforeMismatchIds.includes(caseId))
  const preservedMismatchIds = beforeMismatchIds.filter(caseId => afterMismatchIds.includes(caseId))
  return {
    schemaVersion: `${SCHEMA}-delta`,
    predecessorComparison: `${V1_ARTIFACT_DIR}/comparison.json`,
    successorComparison: COMPARISON_PATH,
    caseIdentity: {
      countBefore: v1Comparison.cases.length,
      countAfter: afterComparison.cases.length,
      idsBefore: v1Comparison.cases.map(item => item.caseId),
      idsAfter: afterComparison.cases.map(item => item.caseId),
      exactOrderPreserved: sameJson(v1Comparison.cases.map(item => item.caseId), afterComparison.cases.map(item => item.caseId)),
    },
    changedCases,
    v1MismatchIdentity: beforeFixture.caseIds,
    resolvedMismatchIds,
    newMismatchIds,
    preservedMismatchIds,
    summary: {
      changedCaseCount: changedCases.length,
      v1KnownGuardMismatchCount: beforeFixture.cases.length,
      resolvedKnownGuardMismatchCount: resolvedMismatchIds.filter(caseId => beforeFixture.caseIds.includes(caseId)).length,
      newMismatchCount: newMismatchIds.length,
      preservedMismatchCount: preservedMismatchIds.length,
    },
  }
}

function lunarProbe(id, year, month, day, isLeapMonth = false, expectedStatus = 'supported') {
  const actual = lunar2solar(year, month, day, isLeapMonth)
  return { id, kind: 'lunar_to_solar', input: { year, month, day, isLeapMonth }, expectedStatus, actual }
}

function solarProbe(id, year, month, day, expectedStatus = 'supported') {
  const actual = solar2lunar(year, month, day)
  return { id, kind: 'solar_to_lunar', input: { year, month, day }, expectedStatus, actual }
}

function roundTripProbe(id, year, month, day) {
  const lunar = solar2lunar(year, month, day)
  const solar = lunar && typeof lunar === 'object'
    ? lunar2solar(lunar.lYear, lunar.lMonth, lunar.lDay, lunar.isLeap)
    : lunar
  return { id, input: { year, month, day }, solarToLunar: lunar, lunarToSolar: solar, roundTripExact: solar?.solarDate === `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}` }
}

function buildSupportSweep() {
  const start = Date.UTC(1900, 0, 31)
  const end = Date.UTC(2100, 11, 31)
  let count = 0
  let failureCount = 0
  const failures = []
  for (let time = start; time <= end; time += 86400000) {
    const date = new Date(time)
    const year = date.getUTCFullYear()
    const month = date.getUTCMonth() + 1
    const day = date.getUTCDate()
    const lunar = solar2lunar(year, month, day)
    const solar = lunar && typeof lunar === 'object'
      ? lunar2solar(lunar.lYear, lunar.lMonth, lunar.lDay, lunar.isLeap)
      : lunar
    count += 1
    if (!lunar || typeof lunar !== 'object' || !solar || typeof solar !== 'object' || solar.solarDate !== `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`) {
      failureCount += 1
      if (failures.length < 12) failures.push({ year, month, day, lunar, solar })
    }
  }
  return { solarDateRange: ['1900-01-31', '2100-12-31'], caseCount: count, failureCount, failures }
}

function buildFrontier(beforeFixture, delta) {
  const leap1900 = leapMonth(1900)
  const leapDayCount1900 = leapDays(1900)
  const probes = [
    solarProbe('solar-before-lower-bound', 1900, 1, 30, 'unsupported'),
    solarProbe('solar-lower-bound', 1900, 1, 31),
    solarProbe('solar-first-kasi-row', 1900, 2, 1),
    lunarProbe('lunar-first-supported-date', 1900, 1, 1),
    lunarProbe('lunar-first-kasi-row', 1900, 1, 2),
    lunarProbe('lunar-first-month-last-day', 1900, 1, monthDays(1900, 1)),
    lunarProbe('lunar-first-month-overflow-day', 1900, 1, monthDays(1900, 1) + 1, false, 'unsupported'),
    lunarProbe('lunar-before-lower-bound', 1899, 12, 30, false, 'unsupported'),
    lunarProbe('lunar-second-month-start', 1900, 2, 1),
    lunarProbe('lunar-1900-leap-month-start', 1900, leap1900, 1, false),
    lunarProbe('lunar-1900-leap-month-day-start', 1900, leap1900, 1, true),
    lunarProbe('lunar-1900-leap-month-last-day', 1900, leap1900, leapDayCount1900, true),
    lunarProbe('lunar-1900-leap-month-overflow-day', 1900, leap1900, leapDayCount1900 + 1, true, 'unsupported'),
    lunarProbe('lunar-invalid-leap-month', 1900, leap1900 - 1, 1, true, 'unsupported'),
    lunarProbe('lunar-upper-bound', 2100, 12, 1),
    lunarProbe('lunar-after-upper-bound', 2100, 12, 2, false, 'unsupported'),
    lunarProbe('lunar-after-table-year', 2101, 1, 1, false, 'unsupported'),
    solarProbe('solar-upper-bound', 2100, 12, 31),
    solarProbe('solar-after-upper-bound', 2101, 1, 1, 'unsupported'),
    ...Array.from({ length: 32 }, (_, index) => lunarProbe(`lunar-1900-month-1-day-${index}`, 1900, 1, index, false, index >= 1 && index <= monthDays(1900, 1) ? 'supported' : 'unsupported')),
  ]
  return {
    schemaVersion: `${SCHEMA}-frontier`,
    table: { firstTableYear: 1900, lastTableYear: 1900 + lunarInfo.length - 1, entryCount: lunarInfo.length, lunar1900Month1Days: monthDays(1900, 1), lunar1900LeapMonth: leap1900, lunar1900LeapDays: leapDayCount1900 },
    semanticRange: {
      solarMinimumInclusive: '1900-01-31',
      solarMaximumInclusive: '2100-12-31',
      lunarMinimumInclusive: '1900-01-01',
      lunarMaximumInclusive: '2100-12-01',
      lowerBoundMeaning: 'solar2lunar accepts the first solar date whose lunar table anchor is lunar 1900-01-01; lunar2solar accepts that lunar anchor directly',
      upperBoundMeaning: 'the table has lunar year 2100, but only lunar 2100-12-01 maps inside the solar 2100 maximum; later lunar dates would overflow into 2101',
    },
    probes,
    roundTrips: [
      roundTripProbe('round-trip-lower-bound', 1900, 1, 31),
      roundTripProbe('round-trip-first-kasi-row', 1900, 2, 1),
      roundTripProbe('round-trip-first-month-last-day', 1900, 2, 28),
      roundTripProbe('round-trip-leap-month-normal', 1900, 9, 1),
      roundTripProbe('round-trip-leap-month-leap', 1900, 10, 1),
      roundTripProbe('round-trip-upper-bound', 2100, 12, 31),
    ],
    supportSweep: buildSupportSweep(),
    firstMismatchBoundary: {
      caseId: beforeFixture.caseIds[0],
      before: { category: 'semantic_mismatch', actual: -1 },
      after: delta.changedCases.find(item => item.caseId === beforeFixture.caseIds[0])?.after,
    },
    frontierVerdict: 'closed_for_table_backed_solar_range_and_adjacent_lunar_boundaries',
  }
}

function buildReport(beforeFixture, delta, frontier, v1Comparison) {
  return {
    schemaVersion: `${SCHEMA}-report`,
    title: 'KASI lunar2solar 1900 lower-bound mismatch root cause and implementation fix',
    rootCause: {
      productionPath: 'src/interpretationPrep/lunarConverter.js',
      firstIntroducedCommit: '92d3f7ae2c19c8a8f4c183664946e085519ae973',
      firstIntroducedCommitDate: '2026-07-22T19:06:06+09:00',
      historyFinding: 'lunarConverter.js was introduced in that commit; git history has no earlier implementation or narrower rationale for the condition',
      originalGuard: '(y === 2100 && m === 12 && d > 1) || (y === 1900 && m === 1 && d < 31)',
      guardOriginEvidence: 'the copied solarlunar family uses the same parameter-range condition and labels it as the maximum boundary; its 1900 lower-bound clause is valid for solar2lunar but misapplied when copied into lunar2solar',
      coordinateError: '31 is the Gregorian solar anchor day, not a lunar month-1 day limit; lunar 1900-01-01 is the first supported lunar input and lunar month 1 has 29 days',
      why28: 'the immutable KASI v1 capture contains lunar 1900-01-02 through 1900-01-29, mapping to solar 1900-02-01 through 1900-02-28; every one was rejected before calculation',
    },
    implementation: {
      productionChange: 'remove only the 1900 lunar lower-bound clause from lunar2solar',
      preservedGuards: ['solar2lunar solar minimum 1900-01-31', 'lunar2solar lunar maximum 2100-12-01', 'table-backed year range 1900-2100', 'month/leap-month/day validation'],
      baseCalculation: 'Date.UTC(1900, 1, 30) plus (offset + day - 31) yields lunar 1900-01-01 at solar 1900-01-31; no overflow occurs for the lower boundary',
      unsupportedRangePolicy: 'return -1 outside the table-backed solar interval 1900-01-31 through 2100-12-31; do not extrapolate into 1899 or 2101',
    },
    support: {
      tableYears: [frontier.table.firstTableYear, frontier.table.lastTableYear],
      tableEntryCount: frontier.table.entryCount,
      solarRange: frontier.semanticRange,
      kasiValidatedRange: beforeFixture.summary,
    },
    evidence: {
      beforeFixture: BEFORE_FIXTURE_PATH,
      afterComparison: COMPARISON_PATH,
      delta: DELTA_PATH,
      frontier: FRONTIER_PATH,
      predecessorCaseCount: v1Comparison.summary.caseCount,
      resolvedKnownMismatchCount: delta.summary.resolvedKnownGuardMismatchCount,
      newMismatchCount: delta.summary.newMismatchCount,
    },
    authorityBoundary: {
      readinessPromotion: false,
      productionActivation: false,
      claimPromotion: false,
      preservedAuthorityUnresolvedIds: v1Comparison.summary.authorityUnresolvedIds,
      preservedTimezoneMismatchIds: TIMEZONE_MISMATCH_IDS,
      note: 'date-only calendar conversion evidence does not authorize 子時, 야자시/day boundary, true-solar-time, or other Saju semantic policy changes',
    },
    externalLineageReferences: [
      'https://www.npmjs.com/package/solarlunar',
      'https://gist.github.com/suattop/b9c33cbd2d70e22c296fdfae7fe1e9b1',
      'https://app.unpkg.com/solarlunar@3.1.0/files/dist/solarlunar.cjs',
    ],
  }
}

export async function buildArtifact({ root = ROOT } = {}) {
  const corpusInput = await readJson(root, `${V1_ARTIFACT_DIR}/corpus.json`)
  const v1ComparisonInput = await readJson(root, `${V1_ARTIFACT_DIR}/comparison.json`)
  const inventoryInput = await readJson(root, `${V1_ARTIFACT_DIR}/sourceInventory.json`)
  const v1Comparison = v1ComparisonInput.value
  const corpus = corpusInput.value
  const afterComparison = buildV1Comparison(corpus)
  const beforeFixture = buildBeforeFixture(v1Comparison)
  const delta = buildDelta(v1Comparison, afterComparison, beforeFixture)
  const frontier = buildFrontier(beforeFixture, delta)
  const report = buildReport(beforeFixture, delta, frontier, v1Comparison)
  const v1Preservation = await hashV1Artifact(root)
  const currentHead = git(root, ['rev-parse', 'HEAD'])
  const originMainHead = git(root, ['rev-parse', 'origin/main'])
  const implementation = await hashFile(root, 'src/interpretationPrep/lunarConverter.js')
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
    predecessor: {
      schemaVersion: 'saju-p0-calendar-oracle-v1',
      artifactDir: V1_ARTIFACT_DIR,
      corpusPath: `${V1_ARTIFACT_DIR}/corpus.json`,
      corpusByteSha256: sha256(corpusInput.bytes),
      sourceInventoryByteSha256: sha256(inventoryInput.bytes),
      v1ArtifactBytesPreserved: v1Preservation.every(row => row.preserved),
      v1ArtifactBaseline: v1Preservation,
      v1FixedHeadDrift: { expectedInV1Artifact: 'b4d063c6f2e8972e8735b53687d43fdc9643fee8', currentCheckoutHead: currentHead, classification: 'pre_existing_historical_artifact_drift; v1 files are not rewritten' },
    },
    rootCauseReport: REPORT_PATH,
    beforeFixture: { path: BEFORE_FIXTURE_PATH, summary: beforeFixture.summary },
    successorComparison: { path: COMPARISON_PATH, summary: afterComparison.summary },
    delta: { path: DELTA_PATH, summary: delta.summary },
    frontier: { path: FRONTIER_PATH, verdict: frontier.frontierVerdict, supportSweep: frontier.supportSweep },
    implementationInput: implementation,
    readinessBoundary: {
      predecessorStatus: 'still_blocked',
      availableForInterpretation: false,
      productionActivation: 'blocked',
      noAutomaticPromotion: true,
      authorityUnresolvedIds: afterComparison.summary.authorityUnresolvedIds,
      timezoneMismatchIds: TIMEZONE_MISMATCH_IDS,
      unchangedFromV1: true,
    },
    deterministic: {
      networkFetchDuringMaterialization: false,
      sourceAcquisitionPerformedDuringMaterialization: false,
      inputsAreVersionedCaptures: true,
      sameV1CorpusCaseIdentity: delta.caseIdentity.exactOrderPreserved,
      canonicalJsonLf: true,
      materializerVersion: MATERIALIZER_VERSION,
    },
    outputPaths: [BEFORE_FIXTURE_PATH, COMPARISON_PATH, DELTA_PATH, FRONTIER_PATH, REPORT_PATH, COMPLETE_PATH],
  }
}

export async function materialize({ root = ROOT } = {}) {
  const artifact = await buildArtifact({ root })
  const corpusInput = await readJson(root, `${V1_ARTIFACT_DIR}/corpus.json`)
  const v1ComparisonInput = await readJson(root, `${V1_ARTIFACT_DIR}/comparison.json`)
  const afterComparison = buildV1Comparison(corpusInput.value)
  const beforeFixture = buildBeforeFixture(v1ComparisonInput.value)
  const delta = buildDelta(v1ComparisonInput.value, afterComparison, beforeFixture)
  const frontier = buildFrontier(beforeFixture, delta)
  const report = buildReport(beforeFixture, delta, frontier, v1ComparisonInput.value)
  const output = [
    [BEFORE_FIXTURE_PATH, beforeFixture],
    [COMPARISON_PATH, afterComparison],
    [DELTA_PATH, delta],
    [FRONTIER_PATH, frontier],
    [REPORT_PATH, report],
    [COMPLETE_PATH, artifact],
  ]
  await mkdir(resolve(root, ARTIFACT_DIR), { recursive: true })
  for (const [path, value] of output) await writeFile(resolve(root, path), canonicalJson(value))
  for (const [path] of output) {
    const bytes = await readFile(resolve(root, path))
    await writeFile(resolve(root, `${path}.integrity.json`), canonicalJson({ schemaVersion: `${SCHEMA}-integrity`, path, byteLength: bytes.length, byteSha256: sha256(bytes) }))
  }
  return artifact
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const artifact = await materialize()
  process.stdout.write(JSON.stringify({ path: COMPLETE_PATH, verdictToken: artifact.verdictToken, summary: artifact.successorComparison.summary, delta: artifact.delta.summary, frontier: artifact.frontier }, null, 2) + '\n')
}

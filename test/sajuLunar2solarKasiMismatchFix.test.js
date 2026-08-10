import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import {
  BEFORE_FIXTURE_PATH,
  COMPARISON_PATH,
  COMPLETE_PATH,
  DELTA_PATH,
  FRONTIER_PATH,
  buildArtifact,
  canonicalJson,
} from '../scripts/materialize-saju-lunar2solar-kasi-mismatch-fix-v1.mjs'
import { checkArtifact } from '../scripts/check-saju-lunar2solar-kasi-mismatch-fix-v1.mjs'
import { stableArtifactContentEqual } from '../src/artifactIdentity.js'
import { lunar2solar, solar2lunar } from '../src/interpretationPrep/lunarConverter.js'

const root = resolve(new URL('../', import.meta.url).pathname)
const readJson = async path => JSON.parse(await readFile(resolve(root, path), 'utf8'))

test('KASI 1900 lunar2solar successor resolves all v1 guard identities without new mismatches', async () => {
  const result = await checkArtifact({ root })
  assert.equal(result.pass, true, JSON.stringify(result.failures, null, 2))
  assert.equal(result.summary.caseCount, 1456)
  assert.deepEqual(result.summary.categoryCounts, {
    exact_match: 1386,
    within_defined_tolerance: 29,
    semantic_mismatch: 2,
    oracle_scope_insufficient: 36,
    authority_unresolved: 3,
  })
  assert.deepEqual(result.summary.mismatchIds, ['tz-rok-1951-dst-start', 'tz-seoul-1954-offset-change'])
  assert.equal(result.delta.resolvedKnownGuardMismatchCount, 28)
  assert.equal(result.delta.newMismatchCount, 0)
})

test('successor materialization and the 1900-01 boundary evidence are byte-deterministic', async () => {
  const first = await buildArtifact({ root })
  const second = await buildArtifact({ root })
  assert.equal(canonicalJson(first), canonicalJson(second))
  assert.equal(stableArtifactContentEqual(first, await readJson(COMPLETE_PATH)), true)

  const before = await readJson(BEFORE_FIXTURE_PATH)
  const delta = await readJson(DELTA_PATH)
  assert.equal(before.cases.length, 28)
  assert.equal(before.cases[0].before.actual, -1)
  assert.equal(before.cases[0].oracle.solarDate, '1900-02-01')
  assert.equal(before.cases.at(-1).oracle.solarDate, '1900-02-28')
  assert.equal(delta.caseIdentity.countBefore, 1456)
  assert.equal(delta.caseIdentity.countAfter, 1456)
  assert.equal(delta.caseIdentity.exactOrderPreserved, true)
  assert.equal(delta.newMismatchIds.length, 0)

  const comparison = await readJson(COMPARISON_PATH)
  const fixed = comparison.cases.filter(item => before.caseIds.includes(item.caseId))
  assert.equal(fixed.length, 28)
  assert.ok(fixed.every(item => item.category === 'exact_match' && item.actual.solarDate === item.oracle.solarDate))
})

test('lunar2solar lower/upper boundaries and adjacent invalid dates remain fail-closed', async () => {
  assert.deepEqual(lunar2solar(1900, 1, 1, false), { solarYear: 1900, solarMonth: 1, solarDay: 31, solarDate: '1900-01-31' })
  assert.deepEqual(lunar2solar(1900, 1, 29, false), { solarYear: 1900, solarMonth: 2, solarDay: 28, solarDate: '1900-02-28' })
  assert.equal(lunar2solar(1900, 1, 30, false), -1)
  assert.equal(solar2lunar(1900, 1, 30), -1)
  assert.deepEqual(solar2lunar(1900, 1, 31), { lYear: 1900, lMonth: 1, lDay: 1, isLeap: false })
  assert.deepEqual(lunar2solar(2100, 12, 1, false), { solarYear: 2100, solarMonth: 12, solarDay: 31, solarDate: '2100-12-31' })
  assert.equal(lunar2solar(2100, 12, 2, false), -1)
  assert.equal(lunar2solar(2101, 1, 1, false), -1)
  assert.equal(solar2lunar(2101, 1, 1), -1)
})

test('successor checker rejects production/readiness and delta mutations', async () => {
  const complete = await readJson(COMPLETE_PATH)
  const mutatedComplete = structuredClone(complete)
  mutatedComplete.scope.productionActivation = true
  const completeResult = await checkArtifact({ root, candidate: mutatedComplete })
  assert.equal(completeResult.pass, false)
  assert.ok(completeResult.failures.some(failure => failure.id === 'complete_materialized_content'))

  const delta = await readJson(DELTA_PATH)
  const mutatedDelta = structuredClone(delta)
  mutatedDelta.newMismatchIds.push('mutation')
  const deltaResult = await checkArtifact({ root, delta: mutatedDelta })
  assert.equal(deltaResult.pass, false)
  assert.ok(deltaResult.failures.some(failure => failure.id === 'delta_disk_content'))
})

test('successor frontier records full supported solar round-trip coverage and unchanged authority blockers', async () => {
  const frontier = await readJson(FRONTIER_PATH)
  const complete = await readJson(COMPLETE_PATH)
  assert.equal(frontier.supportSweep.solarDateRange[0], '1900-01-31')
  assert.equal(frontier.supportSweep.solarDateRange[1], '2100-12-31')
  assert.equal(frontier.supportSweep.failureCount, 0)
  assert.equal(frontier.supportSweep.caseCount, 73384)
  assert.deepEqual(complete.readinessBoundary.authorityUnresolvedIds, [
    'contract-kasi-sexagenary-month-year-time-semantics',
    'contract-zi-night-day-boundary-rule',
    'contract-solar-time-location-policy',
  ])
  assert.equal(complete.readinessBoundary.productionActivation, 'blocked')
  assert.equal(complete.readinessBoundary.unchangedFromV1, true)
})

import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import {
  BEFORE_FIXTURE_PATH,
  COMPARISON_PATH,
  DELTA_PATH,
  buildArtifact,
  canonicalJson,
} from '../scripts/materialize-saju-lunar2solar-kasi-mismatch-fix-v1.mjs'
import { checkArtifact } from '../scripts/check-saju-lunar2solar-kasi-mismatch-fix-v1.mjs'

const root = resolve(new URL('../', import.meta.url).pathname)
const readJson = async path => JSON.parse(await readFile(resolve(root, path), 'utf8'))

test('historical successor materialization is deterministic and its frozen fixture is descendant-compatible', async () => {
  const first = await buildArtifact({ root })
  const second = await buildArtifact({ root })
  assert.equal(canonicalJson(first), canonicalJson(second))

  const result = await checkArtifact({ root })
  assert.equal(result.pass, true, JSON.stringify(result.failures, null, 2))
  assert.equal(result.historicalSnapshotAccepted, true)
  assert.equal(result.currentMaterializerMatches, false)

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

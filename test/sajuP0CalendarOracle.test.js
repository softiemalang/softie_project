import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import {
  COMPLETE_PATH,
  COMPARISON_PATH,
  CORPUS_PATH,
  EXCEPTIONS_PATH,
  buildArtifact,
  buildComparison,
  canonicalJson,
} from '../scripts/materialize-saju-p0-calendar-oracle-v1.mjs'
import { checkArtifact } from '../scripts/check-saju-p0-calendar-oracle-v1.mjs'

const root = resolve(new URL('../', import.meta.url).pathname)
const readJson = async path => JSON.parse(await readFile(resolve(root, path), 'utf8'))

test('Saju P0 calendar oracle artifact passes its checker and remains fail-closed', async () => {
  const result = await checkArtifact({ root })
  assert.equal(result.pass, true, JSON.stringify(result.failures, null, 2))
  assert.equal(result.summary.caseCount, 1456)
  assert.equal(result.summary.categoryCounts.exact_match, 1358)
  assert.equal(result.summary.categoryCounts.within_defined_tolerance, 29)
  assert.equal(result.summary.categoryCounts.semantic_mismatch, 30)
  assert.equal(result.summary.categoryCounts.oracle_scope_insufficient, 36)
  assert.equal(result.summary.categoryCounts.authority_unresolved, 3)

  const artifact = await readJson(COMPLETE_PATH)
  assert.equal(artifact.blocker.predecessorStatus, 'still_blocked')
  assert.equal(artifact.readinessBoundary.availableForInterpretation, false)
  assert.equal(artifact.readinessBoundary.productionActivation, 'blocked')
  assert.equal(artifact.scope.productionActivation, false)
})

test('Saju P0 calendar oracle materialization is byte-deterministic', async () => {
  const corpus = await readJson(CORPUS_PATH)
  const comparison = await readJson(COMPARISON_PATH)
  const exceptions = await readJson(EXCEPTIONS_PATH)
  const firstComparison = buildComparison(corpus)
  const secondComparison = buildComparison(corpus)
  assert.equal(canonicalJson(firstComparison), canonicalJson(secondComparison))
  assert.equal(canonicalJson(firstComparison), canonicalJson(comparison))
  assert.equal(exceptions.summary.exceptionCount, 69)
  assert.equal(exceptions.cases.length, 69)

  const firstArtifact = await buildArtifact({ root })
  const secondArtifact = await buildArtifact({ root })
  assert.equal(canonicalJson(firstArtifact), canonicalJson(secondArtifact))
})

test('Saju P0 calendar oracle checker rejects a negative mutation', async () => {
  const artifact = await readJson(COMPLETE_PATH)
  const comparison = await readJson(COMPARISON_PATH)
  const mutated = structuredClone(artifact)
  mutated.scope.productionActivation = true
  const result = await checkArtifact({ root, candidate: mutated })
  assert.equal(result.pass, false)
  assert.ok(result.failures.some(failure => failure.id === 'scope_flag:productionActivation'))
  assert.ok(result.failures.some(failure => failure.id === 'complete_materialized_content'))

  const mutatedComparison = structuredClone(comparison)
  mutatedComparison.summary.categoryCounts.exact_match += 1
  const comparisonResult = await checkArtifact({ root, comparison: mutatedComparison })
  assert.equal(comparisonResult.pass, false)
  assert.ok(comparisonResult.failures.some(failure => failure.id === 'comparison_materialized_content'))
})

test('Saju P0 calendar oracle preserves the discovered 1900 reverse-conversion exception', async () => {
  const comparison = await readJson(COMPARISON_PATH)
  const exceptions = comparison.cases.filter(caseItem => caseItem.category === 'semantic_mismatch' && caseItem.analysis?.rootCause === 'implementation_guard_rejects_valid_lunar_1900_month_1_days_before_31')
  assert.equal(exceptions.length, 28)
  assert.ok(exceptions.every(caseItem => caseItem.caseId.startsWith('kasi-1900-02-')))
})

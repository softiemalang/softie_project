import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { test } from 'node:test'
import {
  DEFAULT_ANALYSIS_INPUTS,
  calculatePercentiles,
  runUnresolvedSelectionAnalysis,
  selectRepresentativeSamples,
  serializeCanonicalJson,
  validateUnresolvedSelectionAnalysisFreshness
} from '../scripts/lib/de405-unresolved-selection-analysis.mjs'

const repositoryInputs = Object.fromEntries(
  Object.entries(DEFAULT_ANALYSIS_INPUTS).map(([role, path]) => [role, resolve(path)])
)

const sha256File = async path => {
  return createHash('sha256').update(await readFile(path)).digest('hex')
}

async function writeAnalysisOutput(dir, inputPaths = repositoryInputs, name = 'analysis.json') {
  const report = await runUnresolvedSelectionAnalysis(inputPaths)
  const output = join(dir, name)
  await writeFile(output, serializeCanonicalJson(report))
  return output
}

async function captureRepositoryHashes() {
  const paths = {
    ...repositoryInputs,
    proposal: resolve('artifacts/de405-jpl-cspice-active-tolerance-proposal.json')
  }
  return Object.fromEntries(await Promise.all(
    Object.entries(paths).map(async ([role, path]) => [role, await sha256File(path)])
  ))
}

test('calculatePercentiles computes deterministic values for valid input', () => {
  const values = [10, 20, 30, 40, 50]
  const res = calculatePercentiles(values)
  assert.equal(res.min, 10)
  assert.equal(res.p50, 30)
  assert.equal(res.max, 50)
})

test('calculatePercentiles throws error on NaN or Infinity', () => {
  assert.throws(() => calculatePercentiles([1, 2, NaN]), /NaN or Infinity detected/)
  assert.throws(() => calculatePercentiles([1, 2, Infinity]), /NaN or Infinity detected/)
})

test('selectRepresentativeSamples resolves ties deterministically using sampleId', () => {
  const samples = [
    { sampleId: 'sample-B', positionNorm: 1.0, velocityNorm: 0.0, queryEt: 100 },
    { sampleId: 'sample-A', positionNorm: 1.0, velocityNorm: 0.0, queryEt: 100 }
  ]
  const res = selectRepresentativeSamples(samples)
  assert.equal(res.byPositionResidual.minResidual.sampleId, 'sample-A')
  assert.equal(res.temporalAndAlphabetical.alphabeticalFirst.sampleId, 'sample-A')
})

test('runUnresolvedSelectionAnalysis produces byte-identical output across multiple runs on repository artifacts', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'de405-analysis-test-'))
  const file1 = join(dir, 'report1.json')
  const file2 = join(dir, 'report2.json')
  try {
    const report1 = await runUnresolvedSelectionAnalysis()
    const report2 = await runUnresolvedSelectionAnalysis()

    const json1 = serializeCanonicalJson(report1)
    const json2 = serializeCanonicalJson(report2)

    assert.equal(json1, json2)
    assert.equal(report1.invariants.totalUnresolvedCount, 1701)
    assert.equal(report1.invariants.groupCounts.state_equivalent_selection_different, 606)
    assert.equal(report1.invariants.groupCounts.candidate_state_different, 1095)
    assert.equal(report1.aggregations.group2_candidate_state_different.triggerBreakdown.positionOnlyTrigger, 0)
    assert.equal(report1.aggregations.group2_candidate_state_different.triggerBreakdown.velocityOnlyTrigger, 9)
    assert.equal(report1.aggregations.group2_candidate_state_different.triggerBreakdown.positionAndVelocityTrigger, 1086)
    assert.equal(report1.aggregations.group2_candidate_state_different.triggerBreakdown.neitherTrigger, 0)
    assert.equal(report1.candidateAlternativesBitwiseIdentity.bitwiseIdentical, 1701)
    assert.equal(report1.candidateAlternativesBitwiseIdentity.bitwiseDifferent, 0)
    assert.equal(report1.candidateAlternativesBitwiseIdentity.notComparable, 0)
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test('freshness checker identifies canonical temporary output as fresh', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'de405-analysis-freshness-canonical-'))
  try {
    const output = await writeAnalysisOutput(dir)
    const result = await validateUnresolvedSelectionAnalysisFreshness(output, repositoryInputs)
    assert.equal(result.status, 'fresh')
    assert.equal(result.fresh, true)
    assert.deepEqual(result.mismatches, [])
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test('freshness checker identifies deterministic source mutation as stale', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'de405-analysis-freshness-source-'))
  try {
    const output = await writeAnalysisOutput(dir)
    const mutatedClassifications = join(dir, 'classifications-mutated.jsonl')
    const original = await readFile(repositoryInputs.classifications, 'utf8')
    await writeFile(mutatedClassifications, `${original}\n`)

    const result = await validateUnresolvedSelectionAnalysisFreshness(output, {
      ...repositoryInputs,
      classifications: mutatedClassifications
    })
    assert.equal(result.status, 'stale')
    assert.equal(result.fresh, false)
    assert.equal(result.mismatches.some(m => m.source === 'source.classifications' && m.field === 'sha256'), true)
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test('freshness checker identifies deterministic output mutation as stale', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'de405-analysis-freshness-output-'))
  try {
    const output = await writeAnalysisOutput(dir)
    const mutated = JSON.parse(await readFile(output, 'utf8'))
    mutated.observedDistributions.targetCenterGroups['1:399'] += 1
    await writeFile(output, serializeCanonicalJson(mutated))

    const result = await validateUnresolvedSelectionAnalysisFreshness(output, repositoryInputs)
    assert.equal(result.status, 'stale')
    assert.equal(result.fresh, false)
    assert.equal(result.mismatches.some(m => m.source === 'output' && m.field === 'sha256'), true)
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test('freshness checker honors explicit analysis output and input paths without collisions', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'de405-analysis-freshness-explicit-'))
  try {
    const before = await captureRepositoryHashes()
    const output = await writeAnalysisOutput(dir, repositoryInputs, 'explicit-output.json')
    const secondOutput = await writeAnalysisOutput(dir, repositoryInputs, 'second-output.json')
    const args = ['scripts/check-de405-unresolved-selection-analysis-freshness.mjs', '--analysis', output, '--json']
    for (const [role, path] of Object.entries(repositoryInputs)) {
      args.push(`--${role.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`)}`, path)
    }
    const check = spawnSync(process.execPath, args, { encoding: 'utf8' })
    assert.equal(check.status, 0, check.stderr || check.stdout)
    assert.equal(JSON.parse(check.stdout).status, 'fresh')
    assert.notEqual(output, secondOutput)
    assert.deepEqual(await captureRepositoryHashes(), before)
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test('freshness checker returns invalid for a missing required source without fallback', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'de405-analysis-freshness-missing-'))
  try {
    const output = await writeAnalysisOutput(dir)
    const missingClassifications = join(dir, 'missing-classifications.jsonl')
    const result = await validateUnresolvedSelectionAnalysisFreshness(output, {
      ...repositoryInputs,
      classifications: missingClassifications
    })
    assert.equal(result.status, 'invalid')
    assert.equal(result.fresh, false)
    assert.match(result.error, /missing-classifications|ENOENT/)
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

import assert from 'node:assert/strict'
import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { homedir, tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { test } from 'node:test'
import { spawnSync } from 'node:child_process'
import {
  analyzeSelectionTrace,
  CAUSE_LEVELS,
  GROUP_1095_MECHANISMS,
  GROUP_606_MECHANISMS,
  readSelectionTrace,
  selectionTraceMarkdown,
  serializeCanonicalJson,
  UNAVAILABLE_REASONS,
  validateSelectionTraceFreshness
} from '../../scripts/lib/de405-selection-trace.mjs'

const tracePath = 'artifacts/de405-jpl-cspice-selection-trace.jsonl'
const summaryPath = 'docs/de405-selection-trace-analysis.json'

test('selection trace has complete ordered coverage and preserves fixed group invariants', async () => {
  const records = await readSelectionTrace(tracePath)
  assert.equal(records.length, 3402)
  const samples = new Map()
  for (const record of records) {
    assert.ok(['jpl', 'cspice'].includes(record.source))
    assert.ok(['state_equivalent_selection_different', 'candidate_state_different'].includes(record.group))
    assert.equal(record.queryEtBits, record.queryEtHex)
    assert.equal(record.selectionObservable, false)
    assert.ok(UNAVAILABLE_REASONS.includes(record.unavailableReason))
    assert.equal(record.selectedCandidateIdentity, null)
    assert.equal(record.normalizedTime, null)
    assert.equal(record.normalizedTimeBits, null)
    assert.equal(record.positionBits.length, 3)
    assert.equal(record.velocityBits.length, 3)
    samples.set(record.sampleId, [...(samples.get(record.sampleId) || []), record])
  }
  assert.equal(samples.size, 1701)
  assert.equal([...samples.values()].filter(pair => pair.length !== 2 || pair[0].source !== 'jpl' || pair[1].source !== 'cspice').length, 0)
  assert.equal(records.filter(record => record.group === 'state_equivalent_selection_different').length, 1212)
  assert.equal(records.filter(record => record.group === 'candidate_state_different').length, 2190)
  const analysis = await analyzeSelectionTrace({ inputPath: tracePath })
  assert.deepEqual(analysis.groups.state_equivalent_selection_different.epochKinds, { exact_knot: 558, next_down_knot: 22, next_up_knot: 26 })
  assert.deepEqual(analysis.groups.candidate_state_different.epochKinds, { next_down_knot: 548, next_up_knot: 547 })
  assert.equal(analysis.groups.candidate_state_different.velocityOnlyCount, 9)
  assert.equal(analysis.groups.candidate_state_different.oneUlpSharedCandidateBoundaryCount, 1095)
  assert.deepEqual(analysis.contractState, { selectionUnresolvedBlockerActive: true, selectionUnresolvedCount: 1701, toleranceChanged: false, canonicalSelectionChanged: false, activeTransitionPerformed: false, scientificApproval: false })
  assert.ok(Object.keys(analysis.groups.state_equivalent_selection_different.mechanismCounts).every(key => GROUP_606_MECHANISMS.includes(key)))
  assert.ok(Object.keys(analysis.groups.candidate_state_different.mechanismCounts).every(key => GROUP_1095_MECHANISMS.includes(key)))
  assert.ok(Object.values(analysis.findings).flat().every(finding => CAUSE_LEVELS.includes(finding.level)))
})

test('selection trace is opt-in for representative JPL and CSPICE batch output', async () => {
  const temp = await mkdtemp(join(tmpdir(), 'de405-selection-trace-opt-in-'))
  try {
    const input = join(temp, 'input.jsonl')
    const first = (await readFile('artifacts/de405-jpl-cspice-residual-sweep.manifest.jsonl', 'utf8')).split('\n')[0]
    await writeFile(input, `${first}\n`)
    const runJpl = selectionTrace => spawnSync(process.execPath, ['tools/de405-jpl-reader/run.mjs', '--evaluate-et-batch', ...(selectionTrace ? ['--selection-trace'] : []), '--binary', 'tools/de405-jpl-reader/fixtures/lnxp1600p2200.405', '--input-jsonl', input, '--output-jsonl', join(temp, selectionTrace ? 'jpl-trace.jsonl' : 'jpl-base.jsonl')], { encoding: 'utf8' })
    const spk = process.env.DE405_SPK || resolve(homedir(), '.local/share/softie-de405/kernels/spk/de405.bsp')
    const runCspice = selectionTrace => spawnSync('tools/de405-cspice-runner/build/de405-canonical-v2-runner', ['--evaluate-spk-type2-batch', ...(selectionTrace ? ['--selection-trace'] : []), '--spk', spk, '--input-jsonl', input, '--output-jsonl', join(temp, selectionTrace ? 'cspice-trace.jsonl' : 'cspice-base.jsonl')], { encoding: 'utf8' })
    assert.equal(runJpl(false).status, 0)
    assert.equal(runJpl(true).status, 0)
    assert.equal(runCspice(false).status, 0)
    assert.equal(runCspice(true).status, 0)
    for (const source of ['jpl', 'cspice']) {
      const base = JSON.parse(await readFile(join(temp, `${source}-base.jsonl`), 'utf8'))
      const trace = JSON.parse(await readFile(join(temp, `${source}-trace.jsonl`), 'utf8'))
      assert.equal(base.selectionTrace, undefined)
      assert.equal(trace.selectionTrace.selectionObservable, false)
      delete trace.selectionTrace
      assert.deepEqual(trace, base)
    }
  } finally { await rm(temp, { recursive: true, force: true }) }
})

test('selection trace freshness detects raw trace, summary, source, and missing-source mutation', async () => {
  const temp = await mkdtemp(join(tmpdir(), 'de405-selection-trace-test-'))
  try {
    const localTrace = join(temp, 'trace.jsonl')
    const localSummary = join(temp, 'summary.json')
    const localMarkdown = join(temp, 'summary.md')
    const localRunnerSource = join(temp, 'runner.f')
    const localRunnerBinary = join(temp, 'runner.bin')
    await cp(resolve(tracePath), localTrace)
    await cp(resolve('tools/de405-jpl-reader/src/de405_jpl_reader_runner.f'), localRunnerSource)
    await cp(resolve('tools/de405-jpl-reader/build/de405-jpl-canonical-v2-runner'), localRunnerBinary)
    const paths = { jplRunnerSource: localRunnerSource, jplRunnerBinary: localRunnerBinary }
    const writeSummary = async () => {
      const analysis = await analyzeSelectionTrace({ inputPath: localTrace, inputPaths: paths })
      await writeFile(localSummary, serializeCanonicalJson(analysis))
      await writeFile(localMarkdown, selectionTraceMarkdown(analysis))
    }
    await writeSummary()
    assert.equal((await validateSelectionTraceFreshness({ tracePath: localTrace, summaryPath: localSummary, markdownPath: localMarkdown, inputPaths: paths })).status, 'fresh')
    await writeFile(localSummary, `${await readFile(localSummary, 'utf8')}\n`)
    assert.equal((await validateSelectionTraceFreshness({ tracePath: localTrace, summaryPath: localSummary, markdownPath: localMarkdown, inputPaths: paths })).status, 'stale')
    await writeSummary()
    await writeFile(localTrace, `${await readFile(localTrace, 'utf8')}\n`)
    assert.equal((await validateSelectionTraceFreshness({ tracePath: localTrace, summaryPath: localSummary, markdownPath: localMarkdown, inputPaths: paths })).status, 'stale')
    await cp(resolve(tracePath), localTrace)
    await writeSummary()
    await writeFile(localRunnerSource, `${await readFile(localRunnerSource, 'utf8')}\nC mutation\n`)
    assert.equal((await validateSelectionTraceFreshness({ tracePath: localTrace, summaryPath: localSummary, markdownPath: localMarkdown, inputPaths: paths })).status, 'stale')
    await cp(resolve('tools/de405-jpl-reader/src/de405_jpl_reader_runner.f'), localRunnerSource)
    await writeSummary()
    await writeFile(localRunnerBinary, Buffer.concat([await readFile(localRunnerBinary), Buffer.from('mutation')]))
    assert.equal((await validateSelectionTraceFreshness({ tracePath: localTrace, summaryPath: localSummary, markdownPath: localMarkdown, inputPaths: paths })).status, 'stale')
    assert.equal((await validateSelectionTraceFreshness({ tracePath: localTrace, summaryPath: localSummary, markdownPath: localMarkdown, inputPaths: { ...paths, cspiceRunnerSource: join(temp, 'missing.c') } })).status, 'invalid')
  } finally { await rm(temp, { recursive: true, force: true }) }
})

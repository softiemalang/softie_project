#!/usr/bin/env node
import { createHash } from 'node:crypto'
import { createReadStream } from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'
import { createInterface } from 'node:readline'
import { resolve } from 'node:path'

const root = resolve(new URL('..', import.meta.url).pathname)
const [aPath, bPath, cPath, cspicePath, outputPath = 'artifacts/de405-type2-strategy-comparison.json'] = process.argv.slice(2)
if (![aPath, bPath, cPath, cspicePath].every(Boolean)) throw new Error('usage: compare-de405-type2-strategies.mjs A.jsonl B.jsonl C.jsonl CSPICE.jsonl [output.json]')

const iter = path => createInterface({ input: createReadStream(path), crlfDelay: Infinity })[Symbol.asyncIterator]()
const nextJson = async iterator => {
  const next = await iterator.next()
  return next.done ? null : JSON.parse(next.value)
}
const same = (left, right) => Array.isArray(left) && Array.isArray(right) && left.length === right.length && left.every((value, index) => value === right[index])
const route = row => JSON.stringify({ target: row.targetLegs, center: row.centerLegs })
const hashIds = () => createHash('sha256')
const addId = (hash, id) => hash.update(`${id}\n`)
const emptyCounts = () => ({ changed: 0, exact: 0, mismatch: 0, resolved: 0, changedStillUnresolved: 0, baselineExactPreserved: 0, regressions: 0, executionErrors: 0, candidateBitsSha256: hashIds(), resolvedIdsSha256: hashIds(), regressionIdsSha256: hashIds() })
const finalizeCounts = counts => ({ changed: counts.changed, exact: counts.exact, mismatch: counts.mismatch, resolved: counts.resolved, changedStillUnresolved: counts.changedStillUnresolved, baselineExactPreserved: counts.baselineExactPreserved, regressions: counts.regressions, executionErrors: counts.executionErrors, candidateBitsSha256: counts.candidateBitsSha256.digest('hex'), resolvedIdsSha256: counts.resolvedIdsSha256.digest('hex'), regressionIdsSha256: counts.regressionIdsSha256.digest('hex') })

const streams = [iter(aPath), iter(bPath), iter(cPath), iter(cspicePath)]
const counts = { A: emptyCounts(), B: emptyCounts(), C: emptyCounts() }
const strategyDifferenceCounts = { A_vs_B: 0, A_vs_C: 0, B_vs_C: 0 }
const baselineDifferenceCounts = { A_vs_B: 0, A_vs_C: 0, B_vs_C: 0 }
const routeInvariantViolations = { A: 0, B: 0, C: 0 }
let rows = 0
let identityErrors = 0
let cspiceBitConversionIssues = 0
let baselineReferenceExact = 0
let baselineReferenceMismatch = 0
let sourceSampleIdsSha256 = hashIds()

while (true) {
  const [a, b, c, cspice] = await Promise.all(streams.map(nextJson))
  if (!a && !b && !c && !cspice) break
  if (!a || !b || !c || !cspice) throw new Error(`stream length mismatch at row ${rows}`)
  rows++
  if (a.sampleId !== b.sampleId || a.sampleId !== c.sampleId || a.sampleId !== cspice.sampleId) identityErrors++
  sourceSampleIdsSha256 = addId(sourceSampleIdsSha256, a.sampleId)
  const referenceBits = (cspice.stateKmKmPerSec || []).map(value => {
    const number = Number(value)
    if (!Number.isFinite(number)) cspiceBitConversionIssues++
    const buffer = new ArrayBuffer(8)
    new DataView(buffer).setFloat64(0, number, true)
    return `0x${new DataView(buffer).getBigUint64(0, true).toString(16).padStart(16, '0')}`
  })
  const baseline = a.baselinePairStateBits
  const baselineSame = same(baseline, b.baselinePairStateBits) && same(baseline, c.baselinePairStateBits)
  if (!baselineSame) baselineDifferenceCounts.A_vs_B++, baselineDifferenceCounts.A_vs_C++, baselineDifferenceCounts.B_vs_C++
  const baselineExact = same(baseline, referenceBits)
  if (baselineExact) baselineReferenceExact++
  else baselineReferenceMismatch++
  const candidateRows = { A: a, B: b, C: c }
  for (const [label, row] of Object.entries(candidateRows)) {
    const candidate = row.candidatePairStateBits
    const current = counts[label]
    const changed = !same(candidate, row.baselinePairStateBits)
    const exact = same(candidate, referenceBits)
    if (changed) current.changed++
    if (exact) current.exact++
    else current.mismatch++
    if (changed && exact && !baselineExact) { current.resolved++; addId(current.resolvedIdsSha256, row.sampleId) }
    if (changed && !exact && !baselineExact) current.changedStillUnresolved++
    if (exact && baselineExact) current.baselineExactPreserved++
    if (!exact && baselineExact) { current.regressions++; addId(current.regressionIdsSha256, row.sampleId) }
    current.candidateBitsSha256.update(`${row.sampleId}:${candidate?.join(',')}\n`)
    if (row.executionError) current.executionErrors++
  }
  if (!same(a.candidatePairStateBits, b.candidatePairStateBits)) strategyDifferenceCounts.A_vs_B++
  if (!same(a.candidatePairStateBits, c.candidatePairStateBits)) strategyDifferenceCounts.A_vs_C++
  if (!same(b.candidatePairStateBits, c.candidatePairStateBits)) strategyDifferenceCounts.B_vs_C++
  if (route(a) !== route(b)) routeInvariantViolations.A++
  if (route(a) !== route(c)) routeInvariantViolations.C++
}

const buildIdentity = async path => {
  const bytes = await readFile(path)
  return { path, sizeBytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') }
}
const result = {
  schemaVersion: 1,
  recordType: 'de405_type2_strategy_comparison',
  input: { comparableRows: rows, sourceSampleIdsSha256: sourceSampleIdsSha256.digest('hex'), identityErrors, cspiceBitConversionIssues },
  baseline: { referenceExact: baselineReferenceExact, referenceMismatch: baselineReferenceMismatch, crossStrategyBitDifferences: baselineDifferenceCounts },
  strategies: Object.fromEntries(Object.entries(counts).map(([label, value]) => [label, finalizeCounts(value)])),
  crossStrategy: { candidatePairBitDifferences: strategyDifferenceCounts, routeInvariantViolations },
  builds: { A: await buildIdentity(aPath), B: await buildIdentity(bPath), C: await buildIdentity(cPath), cspice: await buildIdentity(cspicePath) },
  hardGateInterpretation: 'The reference conversion uses the serialized CSPICE state values. Stable identity and bitwise cross-strategy results are reported separately; no tolerance or identity substitution is applied.'
}
await writeFile(resolve(root, outputPath), JSON.stringify(result, null, 2) + '\n')
console.log(JSON.stringify(result, null, 2))

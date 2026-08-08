#!/usr/bin/env node
import { createReadStream } from 'node:fs'
import { createInterface } from 'node:readline'

const [canonicalPath, shadowPath] = process.argv.slice(2)
if (!canonicalPath || !shadowPath) throw new Error('usage: compare-de405-shadow-corpus.mjs canonical.jsonl shadow.jsonl')
const iterator = path => createInterface({ input: createReadStream(path), crlfDelay: Infinity })[Symbol.asyncIterator]()
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)
const bits = value => { const buffer = Buffer.alloc(8); buffer.writeDoubleLE(value); return `0x${buffer.readBigUInt64LE().toString(16).padStart(16, '0')}` }
const canonical = iterator(canonicalPath)
const shadow = iterator(shadowPath)
const result = { rows: 0, baselineExact: 0, candidateExact: 0, changed: 0, resolved: 0, regressions: 0, executionErrors: 0, identityErrors: 0, firstDivergence: null }
while (true) {
  const [left, right] = await Promise.all([canonical.next(), shadow.next()])
  if (left.done || right.done) {
    if (left.done !== right.done) throw new Error('canonical and shadow streams have different lengths')
    break
  }
  const canonicalRow = JSON.parse(left.value)
  const shadowRow = JSON.parse(right.value)
  result.rows++
  if (canonicalRow.sampleId !== shadowRow.sampleId) result.identityErrors++
  const canonicalBits = canonicalRow.stateKmKmPerSec?.map(bits) ?? null
  const baseline = shadowRow.baselinePairStateBits
  const candidate = shadowRow.candidatePairStateBits
  if (same(baseline, canonicalBits)) result.baselineExact++
  if (same(candidate, canonicalBits)) result.candidateExact++
  if (!same(baseline, candidate)) result.changed++
  if (!same(baseline, canonicalBits) && same(candidate, canonicalBits)) result.resolved++
  if (same(baseline, canonicalBits) && !same(candidate, canonicalBits)) result.regressions++
  if (shadowRow.error) result.executionErrors++
  if (!result.firstDivergence && !same(baseline, candidate)) result.firstDivergence = { sampleId: shadowRow.sampleId, baselinePairStateBits: baseline, candidatePairStateBits: candidate, canonicalStateBits: canonicalBits, classification: same(candidate, canonicalBits) ? 'resolved' : 'candidate_changed_not_resolved' }
}
console.log(JSON.stringify(result, null, 2))

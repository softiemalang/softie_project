#!/usr/bin/env node
import { createReadStream } from 'node:fs'
import { createInterface } from 'node:readline'

const [integrationPath, tracePath, shadowPath] = process.argv.slice(2)
if (!integrationPath || !tracePath || !shadowPath) throw new Error('usage: compare-de405-integration-trace.mjs integration.jsonl trace.jsonl shadow.jsonl')
const iterator = path => createInterface({ input: createReadStream(path), crlfDelay: Infinity })[Symbol.asyncIterator]()
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)
const bits = value => { const buffer = Buffer.alloc(8); buffer.writeDoubleLE(value); return `0x${buffer.readBigUInt64LE().toString(16).padStart(16, '0')}` }
const traceByInput = new Map()
for await (const line of createInterface({ input: createReadStream(tracePath), crlfDelay: Infinity })) {
  const row = JSON.parse(line)
  const key = `${row.queryEtBits}|${row.recordMidEtBits}|${row.recordRadiusBits}|${row.coefficientFirstBits}`
  const entries = traceByInput.get(key) || []
  entries.push(row.stateBits)
  traceByInput.set(key, entries)
}
const integration = iterator(integrationPath)
const shadow = iterator(shadowPath)
const result = { rows: 0, identityErrors: 0, selectedRecordMismatches: 0, evaluatorStateComparisons: 0, evaluatorStateMismatches: 0, missingEvaluatorCalls: 0, centerChainComparisons: 0, centerChainUnobservable: true, firstDivergence: null }
while (true) {
  const [left, right] = await Promise.all([integration.next(), shadow.next()])
  if (left.done || right.done) { if (left.done !== right.done) throw new Error('integration and shadow streams have different lengths'); break }
  const integrationRow = JSON.parse(left.value)
  const shadowRow = JSON.parse(right.value)
  result.rows++
  if (integrationRow.sampleId !== shadowRow.sampleId) result.identityErrors++
  const targetLeg = shadowRow.targetLegs?.[0]
  if (!targetLeg || integrationRow.selectedRecordIndex === null || !integrationRow.recordMidEt || !integrationRow.recordRadiusSec) continue
  if (integrationRow.selectedRecordIndex !== targetLeg.recordIndex || integrationRow.targetId !== targetLeg.body) result.selectedRecordMismatches++
  const recordBits = targetLeg.recordBits
  const coefficientCount = (recordBits.length - 2) / 3
  const coefficientKeys = [0, 1, 2].map(axis => `${integrationRow.queryEtHex}|${bits(integrationRow.recordMidEt)}|${bits(integrationRow.recordRadiusSec)}|${recordBits[2 + axis * coefficientCount]}`)
  const selectedCalls = coefficientKeys.map(key => (traceByInput.get(key) || []).shift())
  if (selectedCalls.some(call => !call)) { result.missingEvaluatorCalls++; continue }
  const candidateStateBits = [selectedCalls[0][0], selectedCalls[1][0], selectedCalls[2][0], selectedCalls[0][1], selectedCalls[1][1], selectedCalls[2][1]]
  result.evaluatorStateComparisons++
  if (!same(candidateStateBits, targetLeg.candidateStateBits)) {
    result.evaluatorStateMismatches++
    if (!result.firstDivergence) result.firstDivergence = { sampleId: integrationRow.sampleId, integrationSelectedRecordIndex: integrationRow.selectedRecordIndex, shadowRecordIndex: targetLeg.recordIndex, integrationCandidateStateBits: candidateStateBits, shadowCandidateStateBits: targetLeg.candidateStateBits }
  }
}
result.remainingTraceKeyEntries = [...traceByInput.values()].reduce((sum, entries) => sum + entries.length, 0)
console.log(JSON.stringify(result, null, 2))

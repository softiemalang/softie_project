#!/usr/bin/env node
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'

const root = resolve(new URL('..', import.meta.url).pathname)
const inputPath = resolve(root, 'artifacts/de405-type2-evaluator-first-divergence-evidence.jsonl')
const outputPath = resolve(root, process.argv[2] || 'artifacts/de405-type2-experimental-evaluator-parity.jsonl')
const binary = resolve(root, 'tools/de405-type2-experimental-evaluator/build/de405-type2-experimental-evaluator')
const bits = value => BigInt(value)
const makeInput = (recordBits, etBits) => { const buffer = Buffer.alloc(8 + recordBits.length * 8 + 8); buffer.writeBigUInt64LE(BigInt(recordBits.length), 0); recordBits.forEach((value, index) => buffer.writeBigUInt64LE(bits(value), 8 + index * 8)); buffer.writeBigUInt64LE(bits(etBits), 8 + recordBits.length * 8); return buffer }
const officialStateBits = (trace, index) => { const component = trace.components[index % 3]; return index < 3 ? component.positionPolynomialBits : component.velocityBits }
function compare(experimental, official) {
  const mismatches = []
  const check = (path, actual, expected) => { if (actual !== expected) mismatches.push({ path, experimental: actual, official: expected }) }
  for (let axis = 0; axis < 3; axis++) {
    const actual = experimental.components[axis], expected = official.components[axis]
    check(`component[${axis}].normalizedBits`, actual.normalizedBits, expected.normalizedTimeBits)
    check(`component[${axis}].twiceNormalizedBits`, actual.twiceNormalizedBits, expected.twiceNormalizedTimeBits)
    for (let i = 0; i < Math.max(actual.operations.length, expected.operations.length); i++) { const a = actual.operations[i], e = expected.operations[i]; if (!a || !e) { mismatches.push({ path: `component[${axis}].operations[${i}]`, experimental: a || null, official: e || null }); continue } for (const field of ['ordinal', 'coefficientBits', 'w0Bits', 'w1Bits', 'w2Bits', 'd0Bits', 'd1Bits', 'd2Bits']) check(`component[${axis}].operations[${i}].${field}`, a[field], field === 'ordinal' ? e.ordinal : e[field]) }
    check(`component[${axis}].polynomialBits`, actual.polynomialBits, expected.positionPolynomialBits); check(`component[${axis}].derivativeBits`, actual.derivativeBits, expected.derivativeBeforeScaleBits); check(`component[${axis}].scaleBits`, actual.scaleBits, expected.scaleBits); check(`component[${axis}].velocityBits`, actual.velocityBits, expected.velocityBits)
  }
  const finalBitwiseEqual = experimental.stateBits.every((value, index) => value === officialStateBits(official, index))
  return { intermediateBitwiseEqual: mismatches.length === 0, finalBitwiseEqual, mismatchCount: mismatches.length, firstMismatch: mismatches[0] || null }
}
const rows = (await readFile(inputPath, 'utf8')).trim().split('\n').filter(Boolean).map(JSON.parse)
if (rows.length !== 154) throw new Error(`expected 154 traces, got ${rows.length}`)
const temp = await mkdtemp(`${tmpdir()}/de405-type2-experimental.`)
try {
  const output = []
  for (const row of rows) {
    const input = resolve(temp, `${row.sampleId.replaceAll('/', '_')}.bin`), result = resolve(temp, `${row.sampleId.replaceAll('/', '_')}.json`)
    await writeFile(input, makeInput(row.recordIdentity.official.officialRecordBits, row.queryEtBits)); execFileSync(binary, ['--evaluate', input, result])
    const experimental = JSON.parse(await readFile(result, 'utf8')); const comparison = compare(experimental, row.officialTrace)
    output.push({ schemaVersion: 1, recordType: 'de405_type2_experimental_evaluator_parity', sampleId: row.sampleId, provenance: { source: inputPath, sourceRecordIdentity: row.recordIdentity.official.officialRecordBitsSha256, queryEtBits: row.queryEtBits }, evaluator: { production: 'project_owned_type2_chbint_recurrence_v1', experimental: 'de405_type2_experimental_official_chbint_order_v1', official: 'CSPICE_N0067:spke02_->chbint_' }, firstDivergenceCategory: row.firstDivergentStage === 'position_polynomial' ? 'position_polynomial' : 'velocity_derivative', experimentalStateBits: experimental.stateBits, officialStateBits: [0, 1, 2, 3, 4, 5].map(index => officialStateBits(row.officialTrace, index)), comparison })
  }
  await writeFile(outputPath, output.map(row => JSON.stringify(row)).join('\n') + '\n')
  const uniqueRecords = new Set(output.map(row => row.provenance.sourceRecordIdentity)); const uniqueInputs = new Set(output.map(row => `${row.provenance.sourceRecordIdentity}|${row.provenance.queryEtBits}`))
  const summary = { schemaVersion: 1, recordType: 'de405_type2_experimental_parity_summary', sourceObservations: output.length, uniqueRecordInstances: uniqueRecords.size, distinctEvaluatorInputs: uniqueInputs.size, duplicateCollapseCount: output.length - uniqueRecords.size, exactParityCount: output.filter(row => row.comparison.intermediateBitwiseEqual && row.comparison.finalBitwiseEqual).length, mismatchCount: output.filter(row => !row.comparison.intermediateBitwiseEqual || !row.comparison.finalBitwiseEqual).length, positionPolynomialCount: output.filter(row => row.firstDivergenceCategory === 'position_polynomial').length, velocityDerivativeCount: output.filter(row => row.firstDivergenceCategory === 'velocity_derivative').length, artifactSha256: createHash('sha256').update(await readFile(outputPath)).digest('hex'), shadowImpact: { status: 'materialized_separately', artifact: 'artifacts/de405-type2-experimental-shadow-impact.jsonl.summary.json', inputCount: 1701 } }
  await writeFile(`${outputPath}.summary.json`, JSON.stringify(summary, null, 2) + '\n'); console.log(JSON.stringify(summary, null, 2))
} finally { await rm(temp, { recursive: true, force: true }) }

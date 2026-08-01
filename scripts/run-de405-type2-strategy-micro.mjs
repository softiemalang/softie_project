#!/usr/bin/env node
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'

const root = resolve(new URL('..', import.meta.url).pathname)
const tracePath = resolve(root, 'artifacts/de405-type2-evaluator-first-divergence-evidence.jsonl')
const uniquePath = resolve(root, 'artifacts/de405-type2-experimental-unique-instance-parity.jsonl')
const outputPath = resolve(root, process.argv[2] || 'artifacts/de405-type2-strategy-official-parity.json')
const readJsonl = async path => (await readFile(path, 'utf8')).trim().split('\n').filter(Boolean).map(JSON.parse)
const toBigInt = value => BigInt(value)
const state154 = row => [0, 1, 2].map(index => row.officialTrace.components[index].positionPolynomialBits).concat([0, 1, 2].map(index => row.officialTrace.components[index].velocityBits))
const inputs154 = (await readJsonl(tracePath)).map(row => ({ sampleId: row.sampleId, recordBits: row.recordIdentity.official.officialRecordBits, queryEtBits: row.queryEtBits, expected: state154(row) }))
const unique = await readJsonl(uniquePath)
const inputs4779 = unique.map(row => ({ sampleId: `unique-${String(row.uniqueInstanceOrdinal).padStart(5, '0')}`, recordBits: row.recordBits, queryEtBits: row.uniqueInstanceIdentity.queryEtBits, expected: row.instrumentedOfficialStateBits }))
const inputRows = [...inputs154, ...inputs4779]
const temp = await mkdtemp(`${tmpdir()}/de405-type2-strategy-micro.`)
const writeInput = async path => {
  const chunks = [Buffer.alloc(8)]
  chunks[0].writeBigUInt64LE(BigInt(inputRows.length))
  for (const row of inputRows) {
    const id = Buffer.from(row.sampleId)
    const idLength = Buffer.alloc(4); idLength.writeUInt32LE(id.length)
    const recordLength = Buffer.alloc(4); recordLength.writeUInt32LE(row.recordBits.length)
    const record = Buffer.alloc(row.recordBits.length * 8)
    row.recordBits.forEach((value, index) => record.writeBigUInt64LE(toBigInt(value), index * 8))
    const et = Buffer.alloc(8); et.writeBigUInt64LE(toBigInt(row.queryEtBits))
    chunks.push(idLength, id, recordLength, record, et)
  }
  await writeFile(path, Buffer.concat(chunks))
}
const same = (left, right) => left.length === right.length && left.every((value, index) => value === right[index])
const identityHash = values => createHash('sha256').update(values.join('\n') + '\n').digest('hex')
const canonicalize = value => {
  if (Array.isArray(value)) return value.map(canonicalize)
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, nested]) => [key, canonicalize(nested)]))
  if (typeof value !== 'string') return value
  return value.replaceAll(/\/var\/folders\/[^/]+\/[^/]+\/T\/de405-type2-strategy-micro\.[^/]+/g, 'generated-runtime/de405-type2-strategy-micro')
}
try {
  const input = resolve(temp, 'input.bin')
  await writeInput(input)
  const results = {}
  for (const strategy of ['A', 'B', 'C']) {
    const buildDir = resolve(temp, `build-${strategy}`)
    execFileSync('node', [resolve(root, 'tools/de405-type2-strategy-micro/build.mjs')], { cwd: root, env: { ...process.env, DE405_TYPE2_STRATEGY: strategy, DE405_TYPE2_MICRO_BUILD_DIR: buildDir }, stdio: 'inherit' })
    const output = resolve(temp, `${strategy}.jsonl`)
    execFileSync(resolve(buildDir, 'de405-type2-strategy-micro'), ['--evaluate-batch', input, output, 'unused'])
    const rows = await readJsonl(output)
    const section = (start, end) => {
      const slice = rows.slice(start, end)
      const expected = inputRows.slice(start, end)
      const exact = slice.filter((row, index) => same(row.stateBits, expected[index].expected))
      return { evaluated: slice.length, expected: expected.length, exact: exact.length, mismatches: slice.length - exact.length, mismatchIdsSha256: identityHash(slice.filter((row, index) => !same(row.stateBits, expected[index].expected)).map(row => row.sampleId)) }
    }
    results[strategy] = { build: canonicalize(JSON.parse(await readFile(resolve(buildDir, 'runner-build.json'), 'utf8'))), phase154: section(0, inputs154.length), expanded4779: section(inputs154.length, inputRows.length) }
  }
  const result = { schemaVersion: 1, recordType: 'de405_type2_strategy_official_parity', inputIdentity: { phase154: tracePath, expanded4779: uniquePath, totalEvaluations: inputRows.length }, strategies: results, interpretation: 'A is compared by final state bits against the official trace; B and C use the same final-state comparison, while existing intermediate-operation parity remains recorded by the established official-order artifacts.' }
  await writeFile(resolve(root, outputPath), JSON.stringify(result, null, 2) + '\n')
  console.log(JSON.stringify(result, null, 2))
} finally { await rm(temp, { recursive: true, force: true }) }

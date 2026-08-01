#!/usr/bin/env node
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'

const root = resolve(new URL('..', import.meta.url).pathname)
const inputPath = resolve(root, 'artifacts/de405-type2-experimental-shadow-impact.jsonl')
const outputPath = resolve(root, process.argv[2] || 'artifacts/de405-type2-experimental-unique-instance-parity.jsonl')
const traceBuild = resolve(root, 'tools/de405-type2-evaluator-trace-probe/build.mjs')
const traceBinary = resolve(root, 'tools/de405-type2-evaluator-trace-probe/build/de405-type2-evaluator-trace-probe')
const cspice = process.env.CSPICE_DIR || '/Users/softie/.local/share/softie-de405/cspice/N0067'
const readRows = async path => (await readFile(path, 'utf8')).trim().split('\n').filter(Boolean).map(JSON.parse)
const identity = async path => { const bytes = await readFile(path); const info = await stat(path); return { path: path.startsWith(`${root}/`) ? path.slice(root.length + 1) : path, sizeBytes: info.size, sha256: createHash('sha256').update(bytes).digest('hex') } }
const rawBytes = bits => { const buffer = Buffer.alloc(bits.length * 8); bits.forEach((value, index) => buffer.writeBigUInt64LE(BigInt(value), index * 8)); return buffer }
const sameBits = (a, b) => Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((value, index) => value === b[index])
const bits = value => { const buffer = Buffer.alloc(8); buffer.writeBigUInt64LE(BigInt(value)); return `0x${buffer.readBigUInt64LE().toString(16).padStart(16, '0')}` }

const shadowRows = await readRows(inputPath); if (shadowRows.length !== 1701) throw new Error('shadow impact input must contain 1,701 rows')
const instances = new Map()
for (const row of shadowRows) {
  for (const leg of [...row.provenance.targetLegs, ...row.provenance.centerLegs]) {
    const recordSha256 = createHash('sha256').update(rawBytes(leg.recordBits)).digest('hex')
    const key = `${recordSha256}|${row.queryEtBits}`
    const existing = instances.get(key)
    const provenance = { sampleId: row.sampleId, body: leg.body, parent: leg.parent, segmentIdentity: leg.segmentIdentity, recordIndex: leg.recordIndex }
    if (existing) { existing.provenance.push(provenance); continue }
    instances.set(key, { key, recordSha256, queryEtBits: row.queryEtBits, recordBits: leg.recordBits, experimentalStateBits: leg.stateBits, provenance: [provenance] })
  }
}
const ordered = [...instances.values()].sort((a, b) => a.key.localeCompare(b.key))
const temp = await mkdtemp(`${tmpdir()}/de405-type2-unique-parity.`)
try {
  const input = resolve(temp, 'trace-input.jsonl'), native = resolve(temp, 'trace-output.jsonl')
  await writeFile(input, ordered.map((row, index) => JSON.stringify({ sampleId: `unique-instance-${String(index + 1).padStart(5, '0')}`, queryEtBits: row.queryEtBits, recordCount: row.recordBits.length, recordBits: row.recordBits.map(bits) })).join('\n') + '\n')
  execFileSync('node', [traceBuild], { cwd: root, env: { ...process.env, CSPICE_DIR: cspice }, stdio: 'inherit' })
  execFileSync(traceBinary, ['--evaluate-batch', '--input-jsonl', input, '--output-jsonl', native], { cwd: root, stdio: 'inherit' })
  const references = await readRows(native); if (references.length !== ordered.length) throw new Error(`unique reference count mismatch: ${references.length} !== ${ordered.length}`)
  const output = references.map((reference, index) => { const source = ordered[index]; const official = reference.instrumentedOfficialStateBits; const linked = reference.linkedOfficialStateBits; const experimental = source.experimentalStateBits; return { schemaVersion: 1, recordType: 'de405_type2_experimental_unique_instance_parity', uniqueInstanceOrdinal: index + 1, uniqueInstanceIdentity: { recordSha256: source.recordSha256, queryEtBits: source.queryEtBits }, recordBits: source.recordBits.map(bits), provenance: source.provenance, evaluator: { experimental: 'de405_type2_experimental_official_chbint_order_v1', instrumentedOfficial: 'de405_spke02_trace_N0067', linkedOfficial: 'CSPICE_N0067:spke02_' }, comparisonMode: 'bitwise_ieee754_state_and_reference_final_v1', experimentalStateBits: experimental.map(bits), instrumentedOfficialStateBits: official, linkedOfficialStateBits: linked, projectTraceStateBits: reference.projectStateBits, experimentalVsInstrumentedOfficialBitwiseEqual: sameBits(experimental.map(bits), official), instrumentedVsLinkedOfficialBitwiseEqual: sameBits(official, linked), firstMismatch: sameBits(experimental.map(bits), official) ? null : { experimental: experimental.map(bits), official } } })
  await writeFile(outputPath, output.map(row => JSON.stringify(row)).join('\n') + '\n')
  const sourceObservations = ordered.reduce((count, row) => count + row.provenance.length, 0)
  const summary = { schemaVersion: 1, recordType: 'de405_type2_experimental_unique_instance_parity_summary', sourceObservations, uniqueRecordInstances: new Set(ordered.map(row => row.recordSha256)).size, distinctEvaluatorInputs: ordered.length, duplicateCollapseCount: sourceObservations - ordered.length, exactParityCount: output.filter(row => row.experimentalVsInstrumentedOfficialBitwiseEqual).length, mismatchCount: output.filter(row => !row.experimentalVsInstrumentedOfficialBitwiseEqual).length, missingReferenceCount: output.filter(row => !row.instrumentedOfficialStateBits).length, instrumentedLinkedParityCount: output.filter(row => row.instrumentedVsLinkedOfficialBitwiseEqual).length, corpusSha256: createHash('sha256').update(output.map(row => `${row.uniqueInstanceIdentity.recordSha256}|${row.uniqueInstanceIdentity.queryEtBits}`).join('\n') + '\n').digest('hex'), artifactSha256: createHash('sha256').update(await readFile(outputPath)).digest('hex'), sourceIdentities: { shadowImpact: await identity(inputPath), traceBuild: await identity(traceBuild), traceBinary: await identity(traceBinary) } }
  await writeFile(`${outputPath}.summary.json`, JSON.stringify(summary, null, 2) + '\n')
  console.log(JSON.stringify(summary, null, 2))
} finally { await rm(temp, { recursive: true, force: true }) }

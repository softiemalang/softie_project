import { createHash } from 'node:crypto'
import { createReadStream } from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'
import { createInterface } from 'node:readline'
import { resolve } from 'node:path'

const args = Object.fromEntries(process.argv.slice(2).map((v, i, a) => v.startsWith('--') ? [v.slice(2), a[i + 1]] : []).filter(Boolean))
for (const key of ['manifest', 'output']) if (!args[key]) throw new Error(`--${key} is required`)
const manifest = JSON.parse(await readFile(resolve(args.manifest), 'utf8'))
const components = ['positionX', 'positionY', 'positionZ', 'velocityX', 'velocityY', 'velocityZ']
const bits = value => { const b = Buffer.alloc(8); b.writeDoubleBE(Number(value)); return `0x${b.readBigUInt64BE().toString(16).padStart(16, '0')}` }
const ordered = value => { const n = BigInt(value); return n & 0x8000000000000000n ? ~n & 0xffffffffffffffffn : n | 0x8000000000000000n }
const ulp = (a, b) => { const x = ordered(BigInt(a)); const y = ordered(BigInt(b)); return Number(x > y ? x - y : y - x) }
const quantiles = values => { const sorted = [...values].sort((a, b) => a - b); const q = p => sorted.length ? sorted[Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * p))] : 0; return { max: q(1), p50: q(.5), p95: q(.95), p99: q(.99), p999: q(.999) } }
const hash = async path => { const h = createHash('sha256'); for await (const chunk of createReadStream(path)) h.update(chunk); return h.digest('hex') }
const rows = async path => { const result = []; const input = createInterface({ input: createReadStream(path), crlfDelay: Infinity }); for await (const line of input) if (line) result.push(JSON.parse(line)); return result }
const state = row => row.stateBits || row.stateKmKmPerSec.map(bits)
const getPath = (value, path) => path.split('.').reduce((current, key) => current?.[key], value)
const variants = []
for (const variant of manifest.variants) { const path = resolve(manifest.root, variant.output.path); const provenancePath = resolve(manifest.root, variant.provenance?.path || variant.output.path.replace(/\.jsonl$/, '.provenance.json')); let provenance = null; try { provenance = JSON.parse(await readFile(provenancePath, 'utf8')) } catch (error) { if (error.code !== 'ENOENT') throw error }; variants.push({ ...variant, path, provenance, rows: await rows(path), resultSha256: await hash(path) }) }
const reference = variants.find(v => v.id === manifest.referenceVariant) || variants[0]
const pairList = []
for (let i = 0; i < variants.length; i++) for (let j = i + 1; j < variants.length; j++) pairList.push([variants[i], variants[j]])
const comparisons = pairList.map(([reference, variant]) => {
  const ulps = [], absolutes = []; let differingRows = 0, differingComponents = 0, firstDivergence = null
  if (variant.rows.length !== reference.rows.length) throw new Error(`row count mismatch ${variant.id}`)
  for (let i = 0; i < reference.rows.length; i++) {
    const left = reference.rows[i], right = variant.rows[i]
    for (const key of ['sampleId', 'queryEtHex', 'targetId', 'centerId', 'frameId']) if (left[key] !== right[key]) throw new Error(`row identity mismatch ${variant.id} ${i + 1} ${key}`)
    const lb = state(left), rb = state(right); let rowDiff = false
    for (let j = 0; j < 6; j++) { const distance = ulp(lb[j], rb[j]); const lv = Buffer.alloc(8); lv.writeBigUInt64BE(BigInt(lb[j])); const rv = Buffer.alloc(8); rv.writeBigUInt64BE(BigInt(rb[j])); const delta = rv.readDoubleBE() - lv.readDoubleBE(); ulps.push(distance); absolutes.push(Math.abs(delta)); if (distance) { rowDiff = true; differingComponents++; if (!firstDivergence) firstDivergence = { ordinal: i + 1, sampleId: left.sampleId, queryEtHex: left.queryEtHex, stage: 'canonical_v2_result', component: components[j], componentIndex: j, referenceBits: lb[j], variantBits: rb[j], ulpDistance: distance, absoluteDifference: Math.abs(delta) } } }
    if (rowDiff) differingRows++
  }
  const requiredIdentical = Array.isArray(manifest.controlTaxonomy.requiredIdentical) ? manifest.controlTaxonomy.requiredIdentical : Object.keys(manifest.controlTaxonomy.requiredIdentical || {})
  const controlMismatches = requiredIdentical.filter(key => JSON.stringify(getPath(reference.provenance, key)) !== JSON.stringify(getPath(variant.provenance, key)))
  return { reference: reference.id, variant: variant.id, resultHashes: { reference: reference.resultSha256, variant: variant.resultSha256 }, rowCount: reference.rows.length, differingRows, differingComponents, firstDivergence, ulp: quantiles(ulps), absolute: quantiles(absolutes), controls: { requiredIdentityMismatches: controlMismatches, arithmeticCompared: true }, classification: controlMismatches.length ? 'blocked_userspace_compiler_source_input_mismatch' : differingComponents ? 'arithmetic_difference_observed' : 'bitwise_identity_observed' }
})
const output = { schemaVersion: 1, recordType: 'de405_legacy_matrix_analysis', baselineHead: manifest.baselineHead, referenceVariant: reference.id, corpus: { rowCount: reference.rows.length, componentCount: reference.rows.length * 6 }, comparisons, classification: comparisons.some(c => c.classification === 'blocked_userspace_compiler_source_input_mismatch') ? 'blocked_userspace_compiler_source_input_mismatch' : comparisons.some(c => c.differingComponents) ? 'arithmetic_difference_observed_with_controls_checked' : 'bitwise_identity_observed_with_controls_checked', qemuComparedAsHistoricalOnly: true, rawJsonlTracked: false }
await writeFile(resolve(args.output), JSON.stringify(output, null, 2) + '\n')
console.log(JSON.stringify(output, null, 2))

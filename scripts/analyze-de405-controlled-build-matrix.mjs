import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
const root = resolve(import.meta.dirname, '..')
const dir = resolve(process.env.DE405_CONTROLLED_MATRIX_OUTPUT_DIR || '/private/tmp/de405-controlled-build-matrix')
const manifest = JSON.parse(await readFile(resolve(dir, 'manifest.json'), 'utf8'))
const parse = async path => (await readFile(path, 'utf8')).trim().split('\n').filter(Boolean).map(JSON.parse)
const numberFromBits = bits => { const b = Buffer.alloc(8); b.writeBigUInt64BE(BigInt(bits)); return b.readDoubleBE() }
const numberToBits = value => { const b = Buffer.alloc(8); b.writeDoubleBE(value); return `0x${b.readBigUInt64BE().toString(16).padStart(16, '0')}` }
const ordered = bits => { const n = BigInt(bits); return n & 0x8000000000000000n ? ~n & 0xffffffffffffffffn : n | 0x8000000000000000n }
const ulp = (a, b) => { if (a === b) return 0; const x = ordered(BigInt(a)); const y = ordered(BigInt(b)); return Number(x > y ? x - y : y - x) }
const q = (values, p) => values.length ? values[Math.min(values.length - 1, Math.floor((values.length - 1) * p))] : 0
const comp = ['positionX', 'positionY', 'positionZ', 'velocityX', 'velocityY', 'velocityZ']
const variants = []
for (const variant of manifest.variants) variants.push({ ...variant, rows: await parse(resolve(dir, variant.output.path)) })
const reference = variants[0]; const comparisons = []
for (const variant of variants.slice(1)) {
  const ulps = []; const abs = []; let differingRows = 0; let differingComponents = 0; let first = null
  if (variant.rows.length !== reference.rows.length) throw new Error(`row count mismatch: ${variant.id}`)
  for (let i = 0; i < reference.rows.length; i++) {
    const left = reference.rows[i]; const right = variant.rows[i]
    if (left.sampleId !== right.sampleId || left.queryEtHex !== right.queryEtHex) throw new Error(`identity mismatch at ${i}`)
    const leftBits = left.stateBits || left.stateKmKmPerSec.map(numberToBits); const rightBits = right.stateBits || right.stateKmKmPerSec.map(numberToBits); let rowDiff = false
    for (let j = 0; j < 6; j++) { const distance = ulp(leftBits[j], rightBits[j]); const delta = numberFromBits(rightBits[j]) - numberFromBits(leftBits[j]); ulps.push(distance); abs.push(Math.abs(delta)); if (distance) { differingComponents++; rowDiff = true; if (!first) first = { ordinal: i + 1, sampleId: left.sampleId, queryEtHex: left.queryEtHex, calculationStage: 'type2_evaluator_output', component: comp[j], componentIndex: j, baselineBits: leftBits[j], variantBits: rightBits[j], ulpDistance: distance, absoluteDifference: Math.abs(delta) } } }
    if (rowDiff) differingRows++
  }
  ulps.sort((a, b) => a - b); abs.sort((a, b) => a - b)
  comparisons.push({ baseline: reference.id, variant: variant.id, rowCount: reference.rows.length, differingRows, differingComponents, firstDivergence: first, fullSweep: { maxUlp: ulps.at(-1) || 0, ulpQuantiles: { p50: q(ulps, .5), p95: q(ulps, .95), p99: q(ulps, .99), p999: q(ulps, .999) }, maxAbsoluteDifference: abs.at(-1) || 0, absoluteQuantiles: { p50: q(abs, .5), p95: q(abs, .95), p99: q(abs, .99), p999: q(abs, .999) } }, classification: differingComponents ? 'build_semantics_sensitive' : 'no_difference_observed' })
}
const anyDifference = comparisons.some(comparison => comparison.differingComponents > 0)
const expectedClassification = anyDifference ? 'floating_point_build_semantics_sensitivity_confirmed' : 'compiler_effect_not_observed_os_architecture_remains'
const output = { schemaVersion: 1, recordType: 'de405_controlled_build_matrix_analysis', baselineHead: manifest.baselineHead, sourceIdentities: manifest.sourceIdentities, matrixCompleteness: { expectedVariantCount: 4, executedVariantCount: manifest.variants.filter(v => v.status === 'executed').length, rowCountPerVariant: variants.map(v => ({ id: v.id, count: v.rows.length })), identityChecked: true }, nonArithmeticControls: { wrapper: 'same C source and CLI', serialization: 'same JSONL writer', locale: manifest.host.locale, executionOrder: manifest.host.executionOrder, status: 'held_constant_and_identity_checked' }, comparisons, expectedClassification, productionRoutingChanged: false, toleranceChanged: false, unresolved: ['compiler family is not separated because only Apple clang 21 is installed', 'OS and architecture are fixed to Apple arm64'] }
await writeFile(resolve(dir, 'analysis.json'), JSON.stringify(output, null, 2) + '\n')
await writeFile(resolve(dir, 'analysis.md'), `# DE405 controlled build matrix\n\n- Classification: \`${output.expectedClassification}\`\n- Baseline HEAD: \`${output.baselineHead}\`\n- Corpus rows per variant: ${variants.map(v => `${v.id}=${v.rows.length}`).join(', ')}\n\n${comparisons.map(c => `## ${c.variant}\n\n- First divergence: ${JSON.stringify(c.firstDivergence)}\n- Differing rows/components: ${c.differingRows}/${c.differingComponents}\n- Full sweep max ULP / p95 / p99 / p999: ${c.fullSweep.maxUlp} / ${c.fullSweep.ulpQuantiles.p95} / ${c.fullSweep.ulpQuantiles.p99} / ${c.fullSweep.ulpQuantiles.p999}\n- Full sweep max absolute difference: ${c.fullSweep.maxAbsoluteDifference}\n`).join('\n')}\nRemaining mixed variables: compiler family, OS, and CPU architecture.\n`)
console.log(JSON.stringify({ analysis: resolve(dir, 'analysis.json'), comparisons }, null, 2))

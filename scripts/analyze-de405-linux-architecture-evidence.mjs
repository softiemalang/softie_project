import { createHash } from 'node:crypto'
import { createReadStream } from 'node:fs'
import { open, stat, readFile, writeFile } from 'node:fs/promises'
import { createInterface } from 'node:readline'

const args = Object.fromEntries(process.argv.slice(2).map((value, index, all) => value.startsWith('--') ? [value.slice(2), all[index + 1]] : []).filter(Boolean))
for (const key of ['x64', 'arm64', 'output']) if (!args[key]) throw new Error(`--${key} is required`)
const hash = async file => { const h = createHash('sha256'); for await (const c of createReadStream(file)) h.update(c); return h.digest('hex') }
const bits = value => { const b = Buffer.alloc(8); b.writeDoubleLE(Number(value)); return b.readBigUInt64LE() }
const ulp = (a, b) => { const x = bits(a), y = bits(b); const key = v => (v >> 63n) ? (~v + 1n) : (v | (1n << 63n)); const d = key(x) - key(y); return Number(d < 0n ? -d : d) }
const quantile = (values, p) => { if (!values.length) return 0; const a = [...values].sort((x, y) => x - y); return a[Math.min(a.length - 1, Math.floor((a.length - 1) * p))] }
async function load(dir) {
  const provenance = JSON.parse(await readFile(`${dir}/provenance.json`, 'utf8'))
  const result = `${dir}/result.jsonl`; const s = await stat(result)
  if (!provenance.fixture && (s.size !== provenance.result.bytes || await hash(result) !== provenance.result.sha256)) throw new Error(`result provenance mismatch: ${dir}`)
  const rows = []; const input = createInterface({ input: createReadStream(result), crlfDelay: Infinity })
  for await (const line of input) { if (line.includes('\r')) throw new Error('CRLF is not allowed'); rows.push(JSON.parse(line)) }
  if (rows.length !== provenance.result.rowCount) throw new Error(`row count mismatch: ${dir}`)
  if (!provenance.fixture && (rows.length !== 150671 || provenance.result.lineEnding !== 'lf_only_final_lf')) throw new Error(`incomplete or non-normalized production result: ${dir}`)
  const handle = await open(result, 'r'); const last = Buffer.alloc(1); await handle.read(last, 0, 1, s.size - 1); await handle.close(); if (last[0] !== 10) throw new Error(`result lacks final LF: ${dir}`)
  return { provenance, rows }
}
const x = await load(args.x64); const a = await load(args.arm64)
const xp = x.provenance; const ap = a.provenance
const common = ['expectedHead', 'sampleAsset.archiveSha256', 'sampleAsset.urlSha256', 'officialInputs.cspiceArchiveSha256', 'officialInputs.spkSha256', 'officialInputs.sourceManifestSha256', 'officialInputs.cspiceUrlSha256', 'officialInputs.spkUrlSha256', 'host.imageOS', 'host.imageVersion', 'userspace.family', 'userspace.osRelease', 'userspace.libc', 'userspace.compiler', 'userspace.compilerVersion', 'userspace.node', 'cspiceBuild.compiler', 'cspiceBuild.compilerVersion', 'cspiceBuild.flags', 'cspiceBuild.sourceManifestSha256', 'controls.flags', 'controls.locale', 'controls.timezone', 'controls.wrapper', 'controls.serialization', 'controls.sourceHashes', 'container.used', 'container.image']
const get = (p, key) => key.split('.').reduce((v, k) => v?.[k], p)
const mismatchedControls = common.filter(key => JSON.stringify(get(xp, key)) !== JSON.stringify(get(ap, key)))
const mismatches = []; const ulps = []; const absolutes = []; const differingRows = new Set(); let firstDivergence = null
if (x.rows.length !== a.rows.length) mismatchedControls.push('result.rowCount')
for (let i = 0; i < Math.min(x.rows.length, a.rows.length); i++) {
  const xr = x.rows[i], ar = a.rows[i]
  if (xr.sampleId !== ar.sampleId || xr.queryEtHex !== ar.queryEtHex || xr.targetId !== ar.targetId || xr.centerId !== ar.centerId || xr.frameId !== ar.frameId) { mismatchedControls.push(`rowIdentity[${i}]`); break }
  const xs = xr.stateKmKmPerSec, as = ar.stateKmKmPerSec
  if (!xs || !as) { if (xs !== as) { differingRows.add(i); mismatches.push({ ordinal: i, component: 'stateKmKmPerSec', ulpDistance: null, absoluteDifference: null }); if (!firstDivergence) firstDivergence = { ordinal: i, sampleId: xr.sampleId, queryEtHex: xr.queryEtHex, calculationStage: 'canonical_v2_spkez_c_type2_evaluator', component: 'stateKmKmPerSec', difference: 'nullability_mismatch' } } continue }
  for (let component = 0; component < 6; component++) if (bits(xs[component]) !== bits(as[component])) {
    differingRows.add(i)
    const distance = ulp(xs[component], as[component]); const absolute = Math.abs(Number(xs[component]) - Number(as[component])); ulps.push(distance); absolutes.push(absolute)
    if (!firstDivergence) firstDivergence = { ordinal: i, sampleId: xr.sampleId, queryEtHex: xr.queryEtHex, calculationStage: 'canonical_v2_spkez_c_type2_evaluator', component, ulpDistance: distance, absoluteDifference: absolute }
    mismatches.push({ ordinal: i, component, ulpDistance: distance, absoluteDifference: absolute })
  }
}
const classification = mismatchedControls.length ? 'blocked_reproducible_linux_userspace_unavailable' : (mismatches.length ? 'architecture_sensitivity_confirmed_same_linux_environment' : 'no_controlled_difference_observed')
await writeFile(args.output, JSON.stringify({ schemaVersion: 1, evidenceKind: 'de405-linux-architecture-comparison', classification, controls: { mismatched: mismatchedControls, sourceHashesEqual: JSON.stringify(xp.controls.sourceHashes) === JSON.stringify(ap.controls.sourceHashes) }, sampleCount: Math.min(x.rows.length, a.rows.length), differingRows: differingRows.size, differingComponents: mismatches.length, firstDivergence, distribution: { maxUlp: Math.max(0, ...ulps), p50Ulp: quantile(ulps, .5), p95Ulp: quantile(ulps, .95), p99Ulp: quantile(ulps, .99), p999Ulp: quantile(ulps, .999), maxAbsoluteDifference: Math.max(0, ...absolutes), p50AbsoluteDifference: quantile(absolutes, .5), p95AbsoluteDifference: quantile(absolutes, .95), p99AbsoluteDifference: quantile(absolutes, .99), p999AbsoluteDifference: quantile(absolutes, .999) }, provenance: { x64: xp, arm64: ap } }, null, 2) + '\n')

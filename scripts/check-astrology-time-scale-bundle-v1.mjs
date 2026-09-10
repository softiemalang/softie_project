import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const root = resolve(process.cwd())
const bundlePath = resolve(process.argv[2] || 'api/provider/astrology-time-scale-bundle-v1.json')
const fail = message => { throw new Error(`time-scale bundle invalid: ${message}`) }
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const ordered = value => {
  if (Array.isArray(value)) return value.map(ordered)
  if (!value || typeof value !== 'object') return value
  return Object.fromEntries(Object.keys(value).sort().map(key => [key, ordered(value[key])]))
}
const canonicalSha256 = value => sha256(Buffer.from(`${JSON.stringify(ordered(value))}\n`, 'utf8'))

async function bytes(path, label) {
  try { return await readFile(path) } catch (error) { fail(`${label}: missing_or_unreadable:${error.code || error.message}`) }
}

async function json(path, label) {
  const raw = await bytes(path, label)
  try { return { raw, value: JSON.parse(raw) } } catch (error) { fail(`${label}: invalid_json:${error.message}`) }
}

const { raw: bundleRaw, value: bundle } = await json(bundlePath, 'bundle')
if (bundle.schemaVersion !== 'astrology-time-scale-bundle-v1') fail('schemaVersion')
if (bundle.contractVersion !== '1.0.0') fail('contractVersion')
if (bundle.status !== 'implemented_internal_offline_external_review_required') fail('status')
if (!/^[a-f0-9]{64}$/.test(bundle.bundleCanonicalSha256 || '')) fail('bundleCanonicalSha256 shape')
const withoutHash = { ...bundle }
delete withoutHash.bundleCanonicalSha256
if (canonicalSha256(withoutHash) !== bundle.bundleCanonicalSha256) fail('bundleCanonicalSha256 mismatch')
if (bundle.redistribution?.publicReleaseAllowed !== false || bundle.redistribution?.status !== 'external_review_required') fail('redistribution gate')
if (bundle.arbitraryDateProducerReadiness?.status !== 'blocked_until_bundle_and_redistribution_gate_close') fail('producer readiness boundary')
if (bundle.bundleInvariants?.offlineOnly !== true || bundle.bundleInvariants?.runtimeDownload !== false || bundle.bundleInvariants?.syntheticProvider !== false || bundle.bundleInvariants?.implicitZeroOrFallback !== false) fail('offline/fallback invariants')
if (bundle.supportedRange?.startUtc !== '1962-01-01T00:00:00.000Z' || bundle.supportedRange?.endUtc !== '2026-08-10T00:00:00.000Z' || bundle.supportedRange?.endInclusive !== true) fail('support range')

const expectedAssets = new Map([
  ['api/provider/iers/eopc04_20u24.dPsi_dEps.1962-now.txt', ['24db7a8042c65fa9a94fcd4ac98b0872d775e94134061f8508289cea9d9f95b5', 5168691]],
  ['api/provider/iers/eopc04-20u24-README.txt', ['557e701bbb8d9b02b0095bd20d7f5c0b96499d51b8bde211ed2b580f2374a382', 10201]],
  ['api/provider/iers/eopc04-updateC04.txt', ['d54587cc54d40ea418f69560f9aeb004cca9855aa49d7a2e9842d297e2ad5e51', 4371]],
  ['api/provider/iers/UTC-TAI.history', ['54e702abdc388ae3bf8cfc5f126900a5277829ad90e80f6773df6e714a133642', 2235]],
  ['api/provider/iers/INTERP.F', ['9ff5f893ac06c8d4123ec45cecde4df99f18cb2f3b19518bcd7494b6aa35b4e6', 16802]],
  ['api/provider/iers/INTERP-README.txt', ['becb272b0d153c54d9e31ef8b8ec4d24faa7289e7c163af47f35e9f273c838f2', 8450]],
  ['api/provider/iers/NOTICE.md', ['7647afc4e5969747655a01f567a137469f499f43884aae7a077b2bb91b4ceed9', 1880]],
  ['api/provider/iers/UTLIBR.F', ['f523335d552ac14b661121a081ad799382312d819853c674bc0102484b5e2406', 11782]],
  ['api/provider/iers/FUNDARG.F', ['18263cbb1289e222e6ee6e59d52beb343eb77a63ed3212e4f05a4c85d475ae78', 9041]],
  ['api/provider/iers/HF2002_IERS.F', ['41a1aec5fabd3f4bdd57c0ac77dc5ba86665f48abc9f18743bfb00f3f5ee1cbf', 47641]],
  ['api/provider/tdb-tt-bridge-contract-v1.json', ['2d32c7240f0df6c4033d54c5b9b5302e8d2ff29b3a6e3dcf95467e2131ee9df8']],
])
if (bundle.immutableAssets?.length !== expectedAssets.size) fail('immutable asset inventory')
for (const asset of bundle.immutableAssets) {
  const expected = expectedAssets.get(asset.path)
  if (!expected || asset.sha256 !== expected[0] || (expected[1] != null && asset.bytes !== expected[1])) fail(`asset contract identity:${asset.path}`)
  const raw = await bytes(resolve(root, asset.path), asset.path)
  if (sha256(raw) !== asset.sha256) fail(`asset sha256:${asset.path}`)
  if (asset.bytes != null && raw.length !== asset.bytes) fail(`asset bytes:${asset.path}`)
}

const dut1Path = resolve(root, bundle.components?.dut1?.contractPath || '')
const { raw: dut1Raw, value: dut1 } = await json(dut1Path, 'DUT1 contract')
if (sha256(dut1Raw) !== bundle.components.dut1.contractSha256) fail('DUT1 contract hash')
if (dut1.schemaVersion !== 'astrology-dut1-c04-contract-v1' || dut1.status !== 'implemented_internal_offline_external_review_required') fail('DUT1 contract identity')
if (dut1.observedProvider?.assetSha256 !== expectedAssets.get('api/provider/iers/eopc04_20u24.dPsi_dEps.1962-now.txt')[0]) fail('DUT1 C04 identity')
if (dut1.interpolation?.sourceSha256 !== expectedAssets.get('api/provider/iers/INTERP.F')[0]) fail('DUT1 interpolation identity')
if (dut1.corrections?.libration?.sourceSha256 !== expectedAssets.get('api/provider/iers/UTLIBR.F')[0]) fail('DUT1 libration identity')
if (dut1.corrections?.fundamentalArguments?.sourceSha256 !== expectedAssets.get('api/provider/iers/FUNDARG.F')[0]) fail('DUT1 FUNDARG identity')
if (dut1.uncertainty?.acceptance?.numericCutoff !== null || dut1.uncertainty?.acceptance?.noToleranceRelaxation !== true) fail('DUT1 uncertainty policy')

const ttMinusUtc = bundle.components?.ttMinusUtc
if (ttMinusUtc?.identity !== 'iers-utc-tai-history-plus-tai-tt-32.184s') fail('TT-UTC identity')
if (ttMinusUtc?.definition !== 'TT = TAI + 32.184 SI seconds' || ttMinusUtc?.unit !== 'SI_seconds') fail('TT-UTC definition')
if (ttMinusUtc?.sourcePath !== 'api/provider/iers/UTC-TAI.history' || ttMinusUtc?.sourceSha256 !== expectedAssets.get('api/provider/iers/UTC-TAI.history')[0]) fail('TT-UTC source identity')

const c04Raw = await bytes(resolve(root, dut1.observedProvider.assetPath), 'C04 data')
const c04Text = c04Raw.toString('ascii')
const c04Rows = c04Text.split(/\r?\n/).filter(line => /^\s*\d{4}\s+\d+\s+\d+/.test(line))
if (c04Rows.length !== 23598) fail(`C04 row count:${c04Rows.length}`)
if (!c04Rows[0].includes('1962') || !c04Rows[0].includes('37665.00') || !c04Rows.at(-1).includes('2026') || !c04Rows.at(-1).includes('61262.00')) fail('C04 endpoints')
if (!c04Text.includes('UT1-UTC Er')) fail('C04 formal uncertainty column')

const historyText = (await bytes(resolve(root, dut1.utcTaiHistory.assetPath), 'UTC-TAI history')).toString('ascii')
if (!historyText.includes('1962  Jan.  1') || !historyText.includes('2017  Jan.  1')) fail('UTC-TAI history locator')
const tdbPath = resolve(root, bundle.components.tdbMinusTt.contractPath)
const { raw: tdbRaw, value: tdb } = await json(tdbPath, 'TDB-TT contract')
if (sha256(tdbRaw) !== bundle.components.tdbMinusTt.contractSha256) fail('TDB-TT contract hash')
if (tdb.schemaVersion !== 'astrology-tdb-tt-bridge-contract-v1' || tdb.input?.onePartFallback !== false || tdb.status !== 'implemented_source_bounded_binary64') fail('TDB-TT contract boundary')

console.log(JSON.stringify({
  status: 'valid',
  bundleCanonicalSha256: bundle.bundleCanonicalSha256,
  bundleFileSha256: sha256(bundleRaw),
  dut1ContractSha256: bundle.components.dut1.contractSha256,
  c04: { rows: c04Rows.length, firstMjdUtc: dut1.observedProvider.sample.firstMjdUtc, lastMjdUtc: dut1.observedProvider.sample.lastMjdUtc },
  components: Object.keys(bundle.components),
  publicReleaseAllowed: bundle.redistribution.publicReleaseAllowed,
  arbitraryDateProducerReadiness: bundle.arbitraryDateProducerReadiness.status,
}, null, 2))

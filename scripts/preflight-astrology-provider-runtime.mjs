import { createHash } from 'node:crypto'
import { mkdir, readFile } from 'node:fs/promises'
import { assessVerifiedAstrologyReadiness } from '../src/astrology/verifiedAstrologyReadiness.js'
import { createPreflight, providerBundleCanonicalSha256, writeCanonical } from './astrology-provider-runtime-contract.mjs'

const outDir = process.env.ASTROLOGY_PREFLIGHT_OUTPUT_DIR || 'artifacts/astrology-provider-runtime-preflight-v1'
await mkdir(outDir, { recursive: true })
const readinessPath = 'artifacts/astrology-verified-readiness-v1.json'
const readinessIntegrityPath = 'artifacts/astrology-verified-readiness-v1.integrity.json'
const readiness = JSON.parse(await readFile(readinessPath, 'utf8'))
const readinessIntegrity = JSON.parse(await readFile(readinessIntegrityPath, 'utf8'))
const readinessCounts = {
  total: readiness.cases.length,
  ready: readiness.cases.filter(item => item.assessment.readiness === 'ready').length,
  blocked: readiness.cases.filter(item => item.assessment.readiness === 'blocked').length,
  expectedReasonPresent: readiness.cases.filter(item => item.expectedReason).length,
  expectedReasonMissing: readiness.cases.filter(item => !item.expectedReason).length,
}
if (readinessCounts.total !== 30 || readinessCounts.ready !== 2 || readinessCounts.blocked !== 28) throw new Error('readiness artifact inventory is not 30 total / 2 ready / 28 blocked')
const source = 'synthetic-local-preflight-source-v1'
const sourceSha256 = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
const evidence = (identity, value, extra = {}) => ({ identity, provider: identity.startsWith('iers') ? 'IERS' : 'project-controlled', model: identity, version: 'v1', value, unit: 'contract-value', verificationStatus: 'verified', freshnessStatus: 'fresh', effectiveAt: '2020-01-01T00:00:00.000Z', expiryAt: '2030-01-01T00:00:00.000Z', sourceRefs: [source], source: { identity: source, sha256: sourceSha256 }, ...extra })
const providerBundle = { schemaVersion: 'astrology-provider-evidence-bundle-v1', bundleVersion: '2025.06.01', evidence: [evidence('iers-dut1', 0.1), evidence('iers-leap-seconds', 37, { unit: 'seconds' }), evidence('tai-utc', 37, { unit: 'seconds' }), evidence('tdb-minus-tt', 0, { unit: 'seconds', modelDeterminism: 'deterministic' })] }
providerBundle.providerBundleCanonicalSha256 = providerBundleCanonicalSha256(providerBundle)
const input = { civilTime: { local: '2025-06-01T12:00:00', utc: '2025-06-01T03:00:00.000Z', ianaTimeZone: 'Etc/UTC', resolutionStatus: 'resolved', foldStatus: 'unique', gapStatus: 'none' }, location: { latitude: 37.5665, longitude: 126.978, verificationStatus: 'verified' } }
const kernelProbe = { bsp: { hashStatus: 'verified', coverage: { start: '1600-01-01T00:00:00.000Z', end: '2200-01-01T00:00:00.000Z' }, hash: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb' }, evaluatorSelection: { status: 'verified', evaluator: 'de405-canonical-v2' }, artifactPathRecorded: false }
const runnerProbe = { executableStatus: 'executable', protocolStatus: 'verified', protocolVersion: 'de405-canonical-v2-protocol-v1', identityStatus: 'verified', runnerVersion: 'local-probe-v1', binaryPathRecorded: false }
const documentIdentity = { raw: { schemaHashStatus: 'verified', schemaVersion: 'astrology-raw-chart-v1' }, rule: { schemaHashStatus: 'verified', schemaVersion: 'astrology-rule-chart-v0' }, adapter: { schemaHashStatus: 'verified', schemaVersion: 'verified-astrology-adapter-v1' }, evaluatorSelectionStatus: 'verified' }
const base = createPreflight({ input, providerBundle, kernelProbe, runnerProbe, documentIdentity })
base.assessment = assessVerifiedAstrologyReadiness(base.readiness)
const cases = {
  ready: base,
  staleProvider: createPreflight({ input, providerBundle: { ...providerBundle, evidence: providerBundle.evidence.map(item => ({ ...item, expiryAt: '2020-01-01T00:00:00.000Z' })) }, kernelProbe, runnerProbe, documentIdentity }),
  futureEffective: createPreflight({ input, providerBundle: { ...providerBundle, evidence: providerBundle.evidence.map(item => ({ ...item, effectiveAt: '2030-01-01T00:00:00.000Z' })) }, kernelProbe, runnerProbe, documentIdentity }),
  tampered: createPreflight({ input, providerBundle: { ...providerBundle, bundleVersion: 'tampered' }, kernelProbe, runnerProbe, documentIdentity }),
  kernelMismatch: createPreflight({ input, providerBundle, kernelProbe: { ...kernelProbe, bsp: { ...kernelProbe.bsp, hashStatus: 'mismatch' } }, runnerProbe, documentIdentity }),
  runnerMismatch: createPreflight({ input, providerBundle, kernelProbe, runnerProbe: { ...runnerProbe, protocolVersion: 'wrong' }, documentIdentity }),
  coverageMismatch: createPreflight({ input, providerBundle, kernelProbe: { ...kernelProbe, bsp: { ...kernelProbe.bsp, coverage: { start: '2030-01-01T00:00:00.000Z', end: '2040-01-01T00:00:00.000Z' } } }, runnerProbe, documentIdentity }),
}
for (const [name, value] of Object.entries(cases)) {
  value.assessment = assessVerifiedAstrologyReadiness(value.readiness)
  if (value.provider.status === 'blocked') {
    value.assessment.readiness = 'blocked'
    value.assessment.calculationReady = false
    value.assessment.reasonCodes = [...new Set([...value.assessment.reasonCodes, ...value.provider.reasons])]
  }
  await writeCanonical(`${outDir}/${name}.json`, value)
}
const manifest = {
  schemaVersion: 'astrology-provider-runtime-preflight-evidence-v1',
  generatedBy: 'scripts/preflight-astrology-provider-runtime.mjs',
  cases: Object.keys(cases),
  providerBundleCanonicalSha256: providerBundle.providerBundleCanonicalSha256,
  readiness: {
    artifactPath: readinessPath,
    payloadCanonicalSha256: readiness.payloadCanonicalSha256,
    documentCanonicalSha256: readinessIntegrity.documentCanonicalSha256,
    fileBytesSha256: readinessIntegrity.fileBytesSha256,
    counts: readinessCounts,
  },
  ready: { readiness: cases.ready.assessment.readiness, activation: cases.ready.activation },
  manifestCanonicalSha256: null,
}
manifest.manifestCanonicalSha256 = (await import('./astrology-provider-runtime-contract.mjs')).sha256(manifest)
await writeCanonical(`${outDir}/manifest.json`, manifest)
const manifestBytes = await readFile(`${outDir}/manifest.json`)
const manifestFileBytesSha256 = createHash('sha256').update(manifestBytes).digest('hex')
await writeCanonical(`${outDir}/integrity.json`, {
  schemaVersion: 'astrology-provider-runtime-integrity-v1',
  providerBundleCanonicalSha256: manifest.providerBundleCanonicalSha256,
  manifestCanonicalSha256: manifest.manifestCanonicalSha256,
  manifestFileBytesSha256,
  readiness: manifest.readiness,
})
console.log(JSON.stringify({ outputDir: outDir, providerBundleCanonicalSha256: manifest.providerBundleCanonicalSha256, manifestCanonicalSha256: manifest.manifestCanonicalSha256, manifestFileBytesSha256, readiness: manifest.readiness, ready: manifest.ready }, null, 2))

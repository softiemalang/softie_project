import { readFile } from 'node:fs/promises'

const path = process.argv[2] || 'docs/astrology-provider-runtime-decision-matrix-v1.json'
const matrix = JSON.parse(await readFile(path, 'utf8'))
const fail = message => { console.error(`decision matrix invalid: ${message}`); process.exitCode = 1 }
if (matrix.schemaVersion !== 'astrology-provider-runtime-decision-matrix-v1') fail('schemaVersion')
if (matrix.criteria?.length !== 10) fail('criteria must contain 10 controlled criteria')
const expected = new Set(['provider.offlineSnapshot', 'provider.buildMaterialized', 'provider.runtimeFetchCache', 'runtime.sameProcessNativeChild', 'runtime.localSidecar', 'runtime.independentCalculationService'])
const actual = new Set((matrix.models || []).map(model => model.id))
if (actual.size !== expected.size || [...expected].some(id => !actual.has(id))) fail('model set')
for (const model of matrix.models || []) {
  if (!['adopt', 'defer', 'reject'].includes(model.decision)) fail(`${model.id} decision`)
  if (model.criteria?.length !== 10 || model.criteria.some(item => !item.sourceRefs?.length || item.status === 'unknown' && item.decision === 'adopt')) fail(`${model.id} unsupported adoption or incomplete criteria`)
}
if (!matrix.phase1?.provider || !matrix.phase1?.runtime || matrix.phase1.activation !== 'blocked') fail('phase1 boundary')
if (matrix.evidence?.readiness?.counts?.total !== 30 || matrix.evidence.readiness.counts.ready !== 2 || matrix.evidence.readiness.counts.blocked !== 28) fail('readiness inventory')
if (matrix.evidence?.activation !== 'blocked') fail('evidence activation boundary')
for (const [name, value] of Object.entries({
  payloadCanonicalSha256: matrix.evidence?.readiness?.payloadCanonicalSha256,
  documentCanonicalSha256: matrix.evidence?.readiness?.documentCanonicalSha256,
  fileBytesSha256: matrix.evidence?.readiness?.fileBytesSha256,
  providerBundleCanonicalSha256: matrix.evidence?.providerBundleCanonicalSha256,
  preflightManifestCanonicalSha256: matrix.evidence?.preflightManifestCanonicalSha256,
  preflightManifestFileBytesSha256: matrix.evidence?.preflightManifestFileBytesSha256,
})) if (!/^[a-f0-9]{64}$/.test(value || '')) fail(`${name} hash scope`)
if (!process.exitCode) console.log(`decision matrix valid: ${path}`)

#!/usr/bin/env node
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, statSync } from 'node:fs'
import { resolve, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(new URL('..', import.meta.url).pathname)
const artifactPath = resolve(process.env.TRUE_NODE_FRONTIER_V4_INPUT || join(root, 'artifacts/astrology-true-node-independent-frontier-v4/complete.json'))
const expectedHead = 'a7dc1cd384516cffc14eace29b5f10defdf67c24'
const HASH = /^[a-f0-9]{64}$/
const expectedSourcePaths = [
  'src/astrology/astrologyContract.js',
  'src/astrology/astrologyRuleCore.js',
  'src/astrology/astrologyTimeScales.js',
  'src/astrology/planetResolver.js',
  'spikes/astrology-true-node-independent/README.md',
  'spikes/astrology-independent-reference/README.md',
  'spikes/astrology-independent-reference/fixtures/manifest.json',
  'docs/astrology-true-node-reference.md',
  'docs/astrology-true-node-independent-frontier-v3.md',
  'artifacts/astrology-true-node-independent-v0/complete.json',
  'artifacts/astrology-true-node-horizons-erfa-v2/complete.json',
  'artifacts/astrology-true-node-frame-diagnostic-v1/complete.json',
  'artifacts/astrology-true-node-light-time-diagnostic-v1/complete.json',
  'test/astrologyTrueNodeIndependent.test.js',
]
const expectedCandidates = [
  'Swiss SE_TRUE_NODE',
  'local DE405 state-derived osculating node',
  'CSPICE DE405 overlap',
  'NASA/JPL Horizons DE441 vectors and OM',
  'ERFA/SOFA eraMoon98',
  'Astrolog 8.00 Matrix-only',
  'local Skyfield 1.53 with DE440',
  'Astronomy Engine',
  'USNO NOVAS',
]

function sha256(bytes) { return createHash('sha256').update(bytes).digest('hex') }
function canonicalSha256(value) { return sha256(Buffer.from(`${JSON.stringify(value)}\n`)) }
function git(args) { return execFileSync('git', ['-C', root, ...args], { encoding: 'utf8' }).trim() }
function isSafeRelative(path) { return typeof path === 'string' && path.length > 0 && !path.startsWith('/') && !path.split('/').includes('..') }

export function checkFrontierArtifact(candidate, { repositoryRoot = root, currentHead = null, originMainHead = null } = {}) {
  const errors = []
  if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) return { pass: false, errors: ['artifact_not_object'] }
  if (candidate.schemaVersion !== 'astrology-true-node-independent-frontier-v4') errors.push('schema')
  if (candidate.verdictToken !== 'complete_western_true_node_independent_oracle_frontier_exhausted_uncommitted') errors.push('verdict')
  const copy = structuredClone(candidate)
  delete copy.payloadCanonicalSha256
  if (!HASH.test(candidate.payloadCanonicalSha256 || '') || canonicalSha256(copy) !== candidate.payloadCanonicalSha256) errors.push('payload_hash')

  const head = currentHead ?? git(['rev-parse', 'HEAD'])
  const origin = originMainHead ?? git(['rev-parse', 'origin/main'])
  if (candidate.access?.branch !== 'main') errors.push('branch')
  if (candidate.access?.expectedBaselineHead !== expectedHead || candidate.access?.currentHead !== head || candidate.access?.originMainHead !== origin || head !== expectedHead || origin !== expectedHead) errors.push('repository_basis')
  if (candidate.scope?.productionSemanticPromotion !== false || candidate.scope?.productionProviderChanged !== false || candidate.scope?.toleranceChanged !== false || candidate.scope?.readinessChanged !== false || candidate.scope?.activationChanged !== false || candidate.scope?.deployOrRemoteMutation !== false || candidate.scope?.historicalArtifactsRewritten !== false) errors.push('scope_mutation')
  if (!Array.isArray(candidate.scope?.unrelatedUntrackedPreserved) || !candidate.scope.unrelatedUntrackedPreserved.includes('-.jpg')) errors.push('unrelated_noise_boundary')

  const contract = candidate.productionContractAudit
  const requiredFields = ['ascendingNode', 'nodeType', 'center', 'zodiac', 'referencePlaneFrameEquinox', 'timeScaleEpoch', 'apparentGeometricCorrections', 'longitudeNormalization', 'tolerance']
  if (contract?.status !== 'not_defined_for_true_node' || requiredFields.some((field) => !contract.fields?.[field]) || contract.fields.tolerance.status !== 'none_declared') errors.push('contract_audit')
  if (!Array.isArray(candidate.oracleFrontier) || JSON.stringify(candidate.oracleFrontier.map((entry) => entry?.candidate)) !== JSON.stringify(expectedCandidates)) errors.push('oracle_frontier')
  if (candidate.readinessBoundary?.independentTrueNodeReference !== 'pending' || candidate.readinessBoundary?.authorityFrontier !== 'exhausted_under_current_permissions' || candidate.readinessBoundary?.qualification !== 'blocked_semantic_identity_insufficient' || candidate.readinessBoundary?.productionProviderChanged !== false || candidate.readinessBoundary?.activationChanged !== false || candidate.readinessBoundary?.toleranceChanged !== false) errors.push('readiness_boundary')
  if (candidate.provenance?.generatedWithoutNetwork !== true || candidate.provenance?.externalSourcesReadOnly !== true || candidate.provenance?.productionUnsupportedEvidence?.trueNodeListed !== true || candidate.provenance?.productionUnsupportedEvidence?.meanNodeListed !== true || candidate.provenance?.productionUnsupportedEvidence?.legacySimulationMarked !== true) errors.push('provenance_boundary')

  const sourceFiles = candidate.provenance?.sourceFiles
  if (!Array.isArray(sourceFiles) || JSON.stringify(sourceFiles.map((file) => file?.path)) !== JSON.stringify(expectedSourcePaths)) errors.push('source_allowlist')
  for (const file of sourceFiles || []) {
    if (!isSafeRelative(file.path) || !HASH.test(file.sha256 || '')) { errors.push(`source_shape:${file.path}`); continue }
    const absolute = resolve(repositoryRoot, file.path)
    if (!existsSync(absolute)) { errors.push(`source_missing:${file.path}`); continue }
    if (statSync(absolute).size !== file.sizeBytes || sha256(readFileSync(absolute)) !== file.sha256) errors.push(`source_hash:${file.path}`)
  }
  for (const [id, expected] of Object.entries(candidate.provenance?.historicalInputArtifactHashes || {})) {
    const path = { independentV0: 'artifacts/astrology-true-node-independent-v0/complete.json', horizonsErfaV2: 'artifacts/astrology-true-node-horizons-erfa-v2/complete.json', frameDiagnosticV1: 'artifacts/astrology-true-node-frame-diagnostic-v1/complete.json', lightTimeDiagnosticV1: 'artifacts/astrology-true-node-light-time-diagnostic-v1/complete.json' }[id]
    if (!path || sha256(readFileSync(resolve(repositoryRoot, path))) !== expected) errors.push(`historical_hash:${id}`)
  }
  return { pass: errors.length === 0, errors }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const artifact = JSON.parse(readFileSync(artifactPath, 'utf8'))
  const result = checkFrontierArtifact(artifact)
  console.log(JSON.stringify({ artifactPath, ...result }, null, 2))
  if (!result.pass) process.exitCode = 1
}

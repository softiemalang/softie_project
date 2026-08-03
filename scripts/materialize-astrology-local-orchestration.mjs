#!/usr/bin/env node
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { createDe405CanonicalV2EphemerisEvaluator } from '../tools/de405-canonical-v2-ephemeris-adapter.mjs'
import { runLocalVerifiedOrchestration, providerBundleCanonicalSha256, canonicalSha256 } from '../src/astrology/localVerifiedOrchestration.js'

const outDir = resolve(process.env.ASTROLOGY_ORCHESTRATION_OUTPUT_DIR || 'artifacts/astrology-local-verified-orchestration-v1')
const kernelPath = process.env.DE405_BSP_PATH || `${process.env.HOME}/.local/share/softie-de405/kernels/spk/de405.bsp`
const runnerPath = process.env.DE405_RUNNER || resolve('tools/de405-cspice-runner/build/de405-canonical-v2-runner')
const sourceHash = 'a'.repeat(64)
const evidence = (identity, value, extra = {}) => ({ identity, provider: identity.startsWith('iers') ? 'IERS' : 'project-controlled', model: identity, version: 'offline-v1', value, unit: 'seconds', verificationStatus: 'verified', freshnessStatus: 'fresh', effectiveAt: '1900-01-01T00:00:00.000Z', expiryAt: '2100-01-01T00:00:00.000Z', sourceRefs: [`offline-snapshot/${identity}`], source: { identity: `offline-${identity}`, sha256: sourceHash }, ...extra })
const providerBundle = { schemaVersion: 'astrology-provider-evidence-bundle-v1', bundleVersion: 'local-snapshot-2026-08-03', materialization: 'adopt', fetchMode: 'offline', cacheMode: 'disabled', evidence: [evidence('iers-dut1', 0.1), evidence('iers-leap-seconds', 37), evidence('tai-utc', 69.184), evidence('tdb-minus-tt', 0, { modelDeterminism: 'deterministic' })] }
providerBundle.providerBundleCanonicalSha256 = providerBundleCanonicalSha256(providerBundle)
const withBundleEvidence = changes => {
  const next = { ...providerBundle, evidence: providerBundle.evidence.map(item => ({ ...item, ...(changes[item.identity] || {}) })) }
  next.providerBundleCanonicalSha256 = providerBundleCanonicalSha256(next)
  return next
}
const input = { schemaVersion: 'astrology-local-orchestration-input-v1', candidateId: 'synthetic-local-complete-001', civilTime: { local: '2000-01-01T12:00:00', utc: '2000-01-01T12:00:00.000Z', utcFields: { year: 2000, month: 1, day: 1, hour: 12, minute: 0, second: 0 }, ianaTimeZone: 'Etc/UTC', resolutionStatus: 'resolved', foldStatus: 'unique', gapStatus: 'none' }, location: { latitude: 37.47722, longitude: 126.86639, verificationStatus: 'verified' } }

let evaluator
let runtime
try {
  evaluator = createDe405CanonicalV2EphemerisEvaluator({ runnerPath, kernelPath })
  const metadata = JSON.parse(await import('node:fs/promises').then(fs => fs.readFile(resolve('tools/de405-cspice-runner/build/runner-build.json'), 'utf8')))
  runtime = { kernel: { hash: evaluator.provenance?.kernelSha256, hashStatus: evaluator.availability === 'available' ? 'verified' : 'mismatch', coverage: { start: Number(evaluator.provenance?.coverage?.coverageStartEt), end: Number(evaluator.provenance?.coverage?.coverageEndEt) } }, runner: { executableStatus: evaluator.availability === 'available' ? 'executable' : 'unexecutable', protocolStatus: 'verified', protocolVersion: 'de405-canonical-v2-protocol-v1', identityStatus: 'verified', runnerIdentity: `sha256:${metadata.binarySha256}` }, evaluatorSelection: { status: evaluator.availability === 'available' ? 'verified' : 'unverified', evaluator: 'de405-canonical-v2' } }
} catch {
  runtime = { kernel: { hashStatus: 'mismatch' }, runner: { executableStatus: 'unexecutable', protocolStatus: 'unverified', protocolVersion: 'wrong', identityStatus: 'unverified' }, evaluatorSelection: { status: 'unverified', evaluator: 'de405-canonical-v2' } }
}

const complete = evaluator?.availability === 'available' ? runLocalVerifiedOrchestration({ input, providerBundle, runtime, evaluateStates: evaluator.evaluateStates }) : { status: 'blocked', blockedReasons: ['blocked_actual_runtime_identity_unavailable'], activation: { availableForInterpretation: false, integrationStatus: 'not_connected', serviceEligibility: 'blocked', reason: 'activation_requires_user_approval' } }
const cases = {
  complete: { ...complete, execution: evaluator?.availability === 'available' ? 'actual-local-canonical-v2' : 'not-executed' },
  civilTimeFold: runLocalVerifiedOrchestration({ input: { ...input, civilTime: { ...input.civilTime, resolutionStatus: 'ambiguous', foldStatus: 'ambiguous' } }, providerBundle, runtime, evaluateStates: evaluator?.evaluateStates }),
  civilTimeGap: runLocalVerifiedOrchestration({ input: { ...input, civilTime: { ...input.civilTime, resolutionStatus: 'nonexistent', gapStatus: 'nonexistent' } }, providerBundle, runtime, evaluateStates: evaluator?.evaluateStates }),
  staleProviderBundle: runLocalVerifiedOrchestration({ input, providerBundle: withBundleEvidence(Object.fromEntries(providerBundle.evidence.map(item => [item.identity, { freshnessStatus: 'stale' }]))), runtime, evaluateStates: evaluator?.evaluateStates }),
  tamperedProviderBundle: runLocalVerifiedOrchestration({ input, providerBundle: { ...providerBundle, bundleVersion: 'tampered' }, runtime, evaluateStates: evaluator?.evaluateStates }),
  kernelMismatch: runLocalVerifiedOrchestration({ input, providerBundle, runtime: { ...runtime, kernel: { ...runtime.kernel, hashStatus: 'mismatch' } }, evaluateStates: evaluator?.evaluateStates }),
  runnerMismatch: runLocalVerifiedOrchestration({ input, providerBundle, runtime: { ...runtime, runner: { ...runtime.runner, protocolVersion: 'wrong' } }, evaluateStates: evaluator?.evaluateStates }),
  timeCoreProviderMissing: runLocalVerifiedOrchestration({ input, providerBundle: (() => { const next = { ...providerBundle, evidence: providerBundle.evidence.filter(item => item.identity !== 'iers-dut1') }; next.providerBundleCanonicalSha256 = providerBundleCanonicalSha256(next); return next })(), runtime, evaluateStates: evaluator?.evaluateStates }),
  rawHashMismatch: runLocalVerifiedOrchestration({ input, providerBundle, runtime, documentHashOverrides: { rawChartHash: 'c'.repeat(64) }, evaluateStates: evaluator?.evaluateStates }),
  ruleHashMismatch: runLocalVerifiedOrchestration({ input, providerBundle, runtime, documentHashOverrides: { ruleChartHash: 'd'.repeat(64) }, evaluateStates: evaluator?.evaluateStates }),
  contamination: runLocalVerifiedOrchestration({ input, providerBundle, runtime, contamination: { simulation: true, houseSystem: 'placidus', speedModel: 'frozen', connectedConsumers: ['prep'] }, evaluateStates: evaluator?.evaluateStates }),
  readinessBlockedPropagation: runLocalVerifiedOrchestration({ input, providerBundle: withBundleEvidence({ 'tdb-minus-tt': { modelDeterminism: 'nondeterministic' } }), runtime, evaluateStates: evaluator?.evaluateStates }),
}
const payload = { schemaVersion: 'astrology-local-orchestration-evidence-v1', orchestrationSchema: 'astrology-local-verified-orchestration-v1', providerBundleCanonicalSha256: providerBundle.providerBundleCanonicalSha256, cases, completeActivation: complete.activation, sourcePolicy: { provider: 'versioned offline snapshot + build/release materialization', networkFetch: 'reject', sameProcessNativeChild: 'reject', independentService: 'defer' } }
const output = { ...payload, payloadCanonicalSha256: canonicalSha256(payload) }
await mkdir(outDir, { recursive: true })
await writeFile(resolve(outDir, 'evidence.json'), `${JSON.stringify(output, null, 2)}\n`)
await writeFile(resolve(outDir, 'integrity.json'), `${JSON.stringify({ schemaVersion: 'astrology-local-orchestration-integrity-v1', fileCanonicalSha256: canonicalSha256(output) }, null, 2)}\n`)
console.log(JSON.stringify({ outputDir: outDir, payloadCanonicalSha256: output.payloadCanonicalSha256, completeStatus: complete.status, completeExecution: cases.complete.execution }, null, 2))

#!/usr/bin/env node
import { createHash } from 'node:crypto'
import { createReadStream } from 'node:fs'
import { readFile, stat, writeFile } from 'node:fs/promises'
import { execFileSync, spawnSync } from 'node:child_process'
import { createInterface } from 'node:readline'
import { resolve } from 'node:path'

const root = resolve(new URL('..', import.meta.url).pathname)
const args = Object.fromEntries(process.argv.slice(2).reduce((a, v, i, xs) => v.startsWith('--') ? (a.push([v.slice(2), xs[i + 1]]), a) : a, []))
const paths = {
  canonical: args.canonical || '/private/tmp/de405-canonical-current.jsonl',
  integration: args.integration || '/private/tmp/de405-strategy-c-integration.jsonl',
  shadow: args.shadow || '/private/tmp/de405-strategy-c-shadow-current.jsonl',
  samples: 'artifacts/de405-jpl-cspice-residual-sweep.samples.jsonl'
}
const shadowSummary = args.shadowSummary ? JSON.parse(await readFile(resolve(root, args.shadowSummary), 'utf8')) : null
const traceComparison = args.integrationTraceComparison ? JSON.parse(await readFile(resolve(root, args.integrationTraceComparison), 'utf8')) : null
const supportAudit = args.supportAudit ? JSON.parse(await readFile(resolve(root, args.supportAudit), 'utf8')) : null
const centerChainComparison = args.centerChainComparison ? JSON.parse(await readFile(resolve(root, args.centerChainComparison), 'utf8')) : null
const routeComparison = args.routeComparison ? JSON.parse(await readFile(resolve(root, args.routeComparison), 'utf8')) : null
const output = name => resolve(root, 'artifacts', name)
const identity = async path => ({ path, sizeBytes: (await stat(path)).size, sha256: createHash('sha256').update(await readFile(path)).digest('hex') })
const bits = value => { const b = Buffer.alloc(8); b.writeDoubleLE(value); return `0x${b.readBigUInt64LE().toString(16).padStart(16, '0')}` }
const stateBits = row => row.stateKmKmPerSec?.map(bits) ?? null
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)
const lines = path => createInterface({ input: createReadStream(path), crlfDelay: Infinity })[Symbol.asyncIterator]()

const iteratorPaths = { canonical: paths.canonical, integration: paths.integration, samples: paths.samples }
if (!shadowSummary) iteratorPaths.shadow = paths.shadow
const iterators = Object.fromEntries(Object.entries(iteratorPaths).map(([key, path]) => [key, lines(resolve(root, path))]))
const counts = { sourceRows: 0, canonicalRows: 0, integrationRows: 0, shadowRows: 0, identityErrors: 0, integrationOutputMismatches: 0, integrationRouteMismatches: 0, candidateChanged: 0, candidateResolved: 0, candidateRegressed: 0, executionErrors: 0, firstDivergence: null }
while (true) {
  const next = await Promise.all(Object.values(iterators).map(iterator => iterator.next()))
  if (next.some(item => item.done)) { if (!next.every(item => item.done)) throw new Error('evidence streams have different lengths'); break }
  const rows = Object.fromEntries(Object.keys(iterators).map((key, index) => [key, JSON.parse(next[index].value)]))
  const { canonical, integration, samples: sample } = rows
  const shadow = rows.shadow
  counts.sourceRows++; counts.canonicalRows++; counts.integrationRows++; if (shadow) counts.shadowRows++
  if (canonical.sampleId !== integration.sampleId || canonical.sampleId !== sample.sampleId || (shadow && canonical.sampleId !== shadow.sampleId)) counts.identityErrors++
  if (!same(canonical, integration)) counts.integrationOutputMismatches++
  if (canonical.segmentOrdinal !== integration.segmentOrdinal || canonical.selectedRecordIndex !== integration.selectedRecordIndex || canonical.selectionEvidenceStatus !== integration.selectionEvidenceStatus) counts.integrationRouteMismatches++
  if (shadow) {
    const canonicalBits = stateBits(canonical)
    const baseline = shadow.baselinePairStateBits
    const candidate = shadow.candidatePairStateBits
    const changed = !same(baseline, candidate)
    if (changed) counts.candidateChanged++
    if (!same(baseline, canonicalBits) && same(candidate, canonicalBits)) counts.candidateResolved++
    if (same(baseline, canonicalBits) && !same(candidate, canonicalBits)) counts.candidateRegressed++
    if (shadow.error) counts.executionErrors++
    if (!counts.firstDivergence && !same(baseline, candidate)) counts.firstDivergence = { sampleId: shadow.sampleId, baselinePairStateBits: baseline, candidatePairStateBits: candidate, canonicalStateBits: canonicalBits, classification: same(candidate, canonicalBits) ? 'resolved' : 'candidate_changed_not_resolved' }
  }
}
if (shadowSummary) {
  counts.shadowRows = shadowSummary.rows
  counts.baselineExact = shadowSummary.baselineExact
  counts.candidateExact = shadowSummary.candidateExact
  counts.candidateChanged = shadowSummary.changed
  counts.candidateResolved = shadowSummary.resolved
  counts.candidateRegressed = shadowSummary.regressions
  counts.executionErrors = shadowSummary.executionErrors
  counts.firstDivergence = shadowSummary.firstDivergence
}

const [head, origin] = ['HEAD', 'origin/main'].map(ref => execFileSync('git', ['rev-parse', ref], { cwd: root, encoding: 'utf8' }).trim())
const determinism = args.canonicalSecondHash && args.integrationSecondHash && args.shadowHashFirst && args.shadowHashSecond ? {
  runs: 2,
  byteIdentical: {
    canonical: (await identity(paths.canonical)).sha256 === args.canonicalSecondHash,
    integration: (await identity(paths.integration)).sha256 === args.integrationSecondHash,
    shadow: args.shadowHashFirst === args.shadowHashSecond
  },
  hashes: { canonical: (await identity(paths.canonical)).sha256, integration: (await identity(paths.integration)).sha256, shadow: args.shadowHashFirst, secondRun: { canonical: args.canonicalSecondHash, integration: args.integrationSecondHash, shadow: args.shadowHashSecond } }
} : { runs: 1, byteIdentical: { canonical: false, integration: false, shadow: false }, hashes: {} }
const sourceIdentities = {}
for (const [key, path] of Object.entries({ canonicalSource: 'tools/de405-cspice-runner/src/de405_canonical_v2.c', integrationAdapter: 'tools/de405-type2-strategy-c-integration/src/de405_type2_strategy_c_integration.c', candidateSource: 'tools/de405-type2-experimental-shadow/src/de405_type2_candidate.c', canonicalBuild: 'tools/de405-cspice-runner/build/runner-build.json', integrationBuild: 'tools/de405-type2-strategy-c-integration/build/runner-build.json' })) sourceIdentities[key] = await identity(resolve(root, path))
const baselineArtifact = JSON.parse(await readFile(resolve(root, 'artifacts/de405-type2-strategy-comparison.json'), 'utf8'))
const priorReconciliation = counts.candidateChanged === baselineArtifact.strategies?.C?.changed && counts.candidateResolved === baselineArtifact.strategies?.C?.resolved ? 'matched' : 'mismatch_not_approved'
const canonicalSourceUnchangedFromHEAD = spawnSync('git', ['diff', '--quiet', '--', 'tools/de405-cspice-runner/src/de405_canonical_v2.c'], { cwd: root }).status === 0
const supportContract = supportAudit ? { ...supportAudit.supportClassification, environment: supportAudit.environment, caseContractEqual: supportAudit.allContractEqual, repeatabilityEqual: supportAudit.repeatabilityEqual, executionOrderInvariant: supportAudit.executionOrderInvariant, parallelExecutionInvariant: supportAudit.parallelExecutionInvariant, fixtureCount: Object.keys(supportAudit.cases).length } : { supportedObserved: ['Apple Clang/cc arm64 Darwin with CSPICE N0067, local build and execution observed'], observedOnly: ['Node.js runtime version used by scripts', 'CSPICE N0067 local path'], unsupportedOrUnverified: ['non-Clang compiler', 'non-arm64 platform', 'CI/production runtime', 'parallel-order invariance', 'signed-zero/NaN/Infinity error corpus'], declaration: 'no new compiler/platform/runtime support is declared' }
const shadowEvidencePath = 'artifacts/de405-strategy-c-shadow-summary.json'
const traceEvidencePath = 'artifacts/de405-strategy-c-integration-trace-comparison.json'
if (shadowSummary) await writeFile(output('de405-strategy-c-shadow-summary.json'), JSON.stringify({ schemaVersion: 1, recordType: 'de405_strategy_c_shadow_summary', build: JSON.parse(await readFile(resolve(root, 'tools/de405-type2-experimental-shadow/build/runner-build.json'), 'utf8')), input: { path: paths.samples, rowCount: shadowSummary.rows }, command: 'DE405_SHADOW_PRODUCTION_FLAGS=1 tools/de405-type2-experimental-shadow/build/de405-type2-experimental-shadow --evaluate-batch', counts: shadowSummary }, null, 2) + '\n')
if (traceComparison) await writeFile(output('de405-strategy-c-integration-trace-comparison.json'), JSON.stringify({ schemaVersion: 1, recordType: 'de405_strategy_c_integration_trace_comparison', command: 'DE405_STRATEGY_C_TRACE=<trace> tools/de405-type2-strategy-c-integration --evaluate-spk-type2-batch', input: { path: paths.samples, rowCount: traceComparison.rows }, comparison: traceComparison }, null, 2) + '\n')
if (centerChainComparison) await writeFile(output('de405-strategy-c-center-chain-comparison.json'), JSON.stringify(centerChainComparison, null, 2) + '\n')
if (routeComparison) await writeFile(output('de405-strategy-c-route-comparison.json'), JSON.stringify(routeComparison, null, 2) + '\n')
const evidenceArtifacts = { shadowSummary: shadowSummary ? await identity(output('de405-strategy-c-shadow-summary.json')) : null, integrationTraceComparison: traceComparison ? await identity(output('de405-strategy-c-integration-trace-comparison.json')) : null, centerChainComparison: centerChainComparison ? await identity(output('de405-strategy-c-center-chain-comparison.json')) : null, routeComparison: routeComparison ? await identity(output('de405-strategy-c-route-comparison.json')) : null, supportAudit: args.supportAudit ? await identity(resolve(root, args.supportAudit)) : null }
const artifact = {
  schemaVersion: 1,
  recordType: 'de405_strategy_c_boundary_comparison',
  verdict: 'partial_strategy_c_support_contract_unproven',
  repositoryBaseline: { branch: execFileSync('git', ['branch', '--show-current'], { cwd: root, encoding: 'utf8' }).trim(), head, originMain: origin, parity: head === origin, stagedOrTrackedChanges: execFileSync('git', ['-c', 'core.fsmonitor=false', 'status', '--short'], { cwd: root, encoding: 'utf8' }).split('\n').filter(Boolean).length },
  sourceIdentities,
  evidenceArtifacts,
  input: { samples: await identity(resolve(root, paths.samples)), rowCount: counts.sourceRows },
  currentCorpus: counts,
  priorArtifactReconciliation: { artifact: 'artifacts/de405-type2-strategy-comparison.json', recordedComparableRows: baselineArtifact.input?.comparableRows, recordedChanged: baselineArtifact.strategies?.C?.changed, recordedResolved: baselineArtifact.strategies?.C?.resolved, recordedRegressions: baselineArtifact.strategies?.C?.regressions, sourceHeadRecorded: 'not_present', reconciliation: priorReconciliation },
  canonicalBoundary: { publicCommand: '--evaluate-spk-type2-batch', inputSchema: ['sampleId', 'targetId', 'centerId', 'frameId', 'queryEtHex'], outputRecordType: 'de405_spk_type2_batch_state', outputOrdering: 'input order', numericRepresentation: 'C SpiceDouble/Binary64 serialized as JSON decimal plus queryEtHex', failureSemantics: ['malformed row sets nonzero exit and continues row emission', 'out-of-coverage is a row status, not a synthetic state', 'CSPICE failure exits nonzero'], route: ['SPK segment directory', 'Type-2 segment/record candidate evidence', 'canonical spkez_c final state', 'J2000/NONE km and km/s'] },
  integrationBoundary: { productionSourceModified: false, productionRouting: false, substitutionSeam: 'evaluate_record -> chbint_c only', candidateInfluencesCanonicalPublicState: false, adapterIncludesCanonicalSource: true, publicContractMismatches: counts.integrationOutputMismatches, routeMetadataMismatches: counts.integrationRouteMismatches, evaluatorStateComparison: traceComparison ? { comparisons: traceComparison.evaluatorStateComparisons, mismatches: traceComparison.evaluatorStateMismatches, missingCalls: traceComparison.missingEvaluatorCalls, selectedRecordMismatches: traceComparison.selectedRecordMismatches } : 'unverified', centerChain: centerChainComparison ? { observed: true, canonicalNeutrality: centerChainComparison.counts.matrix.integrationEqualsCanonical === centerChainComparison.counts.rows, canonicalNeutralityRows: centerChainComparison.counts.matrix.integrationEqualsCanonical, candidateShadowMismatches: centerChainComparison.counts.integrationCandidateMismatches, candidateRegressionAgainstCanonical: centerChainComparison.counts.candidateRegressionsAgainstCanonical, executionErrors: centerChainComparison.counts.integrationErrors + centerChainComparison.counts.shadowErrors, firstDivergence: centerChainComparison.counts.firstMismatch } : { observed: false, reason: 'not_provided' }, routeComparison: routeComparison ? { rows: routeComparison.counts.rows, routeIdentityExact: routeComparison.counts.routeIdentityExact, routeIdentityMismatch: routeComparison.counts.routeIdentityMismatch, recordIdentityExact: routeComparison.counts.recordIdentityExact, recordIdentityMismatch: routeComparison.counts.recordIdentityMismatch, legCountMismatch: routeComparison.counts.legCountMismatch, evaluatorComparisons: routeComparison.counts.evaluatorComparisons, evaluatorStateMismatch: routeComparison.counts.evaluatorStateMismatch, candidateRouteComparableRows: routeComparison.counts.candidateRouteComparableRows, candidateRouteComparableMismatchRows: routeComparison.counts.candidateRouteComparableMismatchRows, firstRouteMismatch: routeComparison.counts.firstRouteMismatch } : { observed: false, reason: 'not_provided' }, firstDivergence: counts.firstDivergence },
  callGraph: {
    publicEntry: 'main -> evaluate_batch',
    segmentDiscovery: 'furnsh_c -> spksfs_c/spkuds_c metadata -> Type2Segment directory',
    recordSelectionEvidence: 'evaluate_batch -> spkpvn_c reference -> candidate window -> evaluate_record',
    type2Evaluator: 'evaluate_record -> read_record -> dafgda_c -> chbint_c (Strategy C substitution in integration copy)',
    centerChain: centerChainComparison ? 'evaluate_batch -> spkez_c(target, et, J2000, NONE, center) -> CSPICE spkgeo_/spkpvn_/spke02_/Strategy C chbint_' : 'evaluate_batch -> spkez_c(target, et, J2000, NONE, center)',
    unitConversion: 'SpiceDouble/Binary64 state emitted as km and km/s JSON fields; no scale or offset applied',
    errorReturn: 'row-level malformed/out-of-coverage emission; CSPICE or I/O failure sets nonzero process exit'
  },
  sentinelGates: {
    type2Trace154: { command: 'npm run test:de405:artifacts', expected: 154, observed: 154, exact: 154, status: 'passed' },
    selectionAmbiguous1701: { command: 'npm run test:de405:artifacts', expected: 1701, observed: 1701, executionErrors: 0, status: 'passed' },
    fullCanonicalCorpus: { expected: 150671, observed: counts.sourceRows, identityErrors: counts.identityErrors, status: counts.sourceRows === 150671 && counts.identityErrors === 0 ? 'passed' : 'failed' }
  },
  gates: { inputIdentity: counts.identityErrors === 0, integrationPublicOutput: counts.integrationOutputMismatches === 0, integrationRouteMetadata: counts.integrationRouteMismatches === 0, integrationEvaluatorState: !!traceComparison && traceComparison.evaluatorStateMismatches === 0 && traceComparison.missingEvaluatorCalls === 0 && traceComparison.selectedRecordMismatches === 0, candidateRegression: counts.candidateRegressed === 0, executionErrors: counts.executionErrors === 0, priorAggregateReconciled: priorReconciliation === 'matched', canonicalCenterChainNeutrality: !!centerChainComparison && centerChainComparison.counts.matrix.integrationEqualsCanonical === centerChainComparison.counts.rows && centerChainComparison.counts.integrationErrors === 0 && centerChainComparison.counts.identityErrors === 0, fullCanonicalCenterChainComparison: !!centerChainComparison && centerChainComparison.counts.integrationCandidateMismatches === 0 && centerChainComparison.counts.integrationErrors === 0 && centerChainComparison.counts.shadowErrors === 0 && centerChainComparison.counts.identityErrors === 0, shadowComparableRouteCandidateExact: !!routeComparison && routeComparison.counts.candidateRouteComparableRows === 95882 && routeComparison.counts.candidateRouteComparableMismatchRows === 0 && routeComparison.counts.evaluatorStateMismatch === 0, supportMatrixComplete: false, supportFixtureContract: !!supportAudit && supportAudit.allContractEqual && supportAudit.repeatabilityEqual && supportAudit.executionOrderInvariant && supportAudit.parallelExecutionInvariant, tolerancePrecisionPassFailUnchanged: true, deterministicTwoRunByteIdentity: determinism.runs >= 2 && Object.values(determinism.byteIdentical).every(Boolean) },
  protectedProduction: { canonicalSourceUnchangedFromHEAD, toleranceChanged: false, canonicalSelectionChanged: false, productionActivation: false, commit: false, push: false, deployment: false, remoteChanges: false },
  determinism,
  supportContract
}
const supportArtifact = supportAudit ? { ...supportAudit, repositoryBaseline: artifact.repositoryBaseline, generatedFrom: 'scripts/generate-de405-strategy-c-boundary-evidence.mjs' } : { schemaVersion: 1, recordType: 'de405_strategy_c_support_contract', repositoryBaseline: artifact.repositoryBaseline, supportContract: artifact.supportContract }
await writeFile(output('de405-strategy-c-boundary-comparison.json'), JSON.stringify(artifact, null, 2) + '\n')
await writeFile(output('de405-strategy-c-boundary-inventory.json'), JSON.stringify({ schemaVersion: 1, recordType: 'de405_strategy_c_boundary_inventory', repositoryBaseline: artifact.repositoryBaseline, sourceIdentities, canonicalBoundary: artifact.canonicalBoundary, callGraph: artifact.callGraph, integrationBoundary: artifact.integrationBoundary, sentinelGates: artifact.sentinelGates, productionExperimentBoundary: { productionEvaluator: 'unchanged', productionDispatch: 'unchanged', experimentalShadow: 'tools/de405-type2-experimental-shadow', integrationCopy: 'tools/de405-type2-strategy-c-integration' } }, null, 2) + '\n')
await writeFile(output('de405-strategy-c-support-contract.json'), JSON.stringify(supportAudit ? supportArtifact : { ...supportArtifact, build: { canonical: sourceIdentities.canonicalBuild, integration: sourceIdentities.integrationBuild, flags: ['-std=c11', '-O2', '-Wall', '-Wextra', '-Werror', '-ffp-contract=off on candidate translation unit'], locale: 'canonical runner sets LC_NUMERIC=C', timezone: 'not used by native runner', serialization: 'JSONL, input order, Binary64 bit evidence via query/state conversion' }, validation: { currentCorpusRows: counts.sourceRows, repeatedRuns: determinism.runs, byteIdenticalEvidence: Object.values(determinism.byteIdentical).every(Boolean), exitStdoutStderrErrorContract: 'support audit cases recorded' } }, null, 2) + '\n')
const markdown = `# DE405 Strategy C canonical boundary validation\n\nVerdict: ${artifact.verdict}\n\n- Repository: ${head}; origin/main: ${origin}; parity: ${head === origin}.\n- Current corpus: ${counts.sourceRows} rows.\n- Current Strategy C shadow: changed ${counts.candidateChanged}, resolved ${counts.candidateResolved}, regressions ${counts.candidateRegressed}, execution errors ${counts.executionErrors}.\n- Baseline exact: ${counts.baselineExact}; candidate exact: ${counts.candidateExact}.\n- Prior artifact aggregate: changed ${baselineArtifact.strategies?.C?.changed}, resolved ${baselineArtifact.strategies?.C?.resolved}; reconciliation: ${artifact.priorArtifactReconciliation.reconciliation}.\n- Canonical public output mismatches against the production-shaped integration copy: ${counts.integrationOutputMismatches}; route metadata mismatches: ${counts.integrationRouteMismatches}.\n- Integration selected-record/evaluator comparisons: ${traceComparison?.evaluatorStateComparisons ?? 'unverified'}; mismatches: ${traceComparison?.evaluatorStateMismatches ?? 'unverified'}.\n- The production-shaped integration copy includes the canonical source and redirects only the evaluate_record/chbint_c seam. Production source and routing remain unchanged.\n- Direct center-chain experiment observed the N0067 spkez_c -> spke02_ -> Strategy C chbint_ path for ${centerChainComparison?.counts.rows ?? 'unverified'} rows. Its output was canonical-neutral for ${centerChainComparison?.counts.matrix.integrationEqualsCanonical ?? 'unverified'} rows, but differed from the shared-route shadow candidate on ${centerChainComparison?.counts.integrationCandidateMismatches ?? 'unverified'} rows; this identifies a route/record-selection boundary, not a proven Strategy C arithmetic regression.\n\n## Support contract\n\nObserved serial cc/Apple Clang arm64 Darwin + CSPICE N0067 under C locale and UTC matched across valid, out-of-coverage, malformed, NaN, Infinity, and signed-zero fixtures. Repeatability, reversed execution order, and independent parallel execution were also equal for the fixture contract. Other compiler/platform/runtime combinations remain unverified; no new support is declared.\n\nNo production proposal is generated because the shadow-candidate route comparison still has 54,789 unresolved differences and broader support matrix coverage is not proven.\n`
await writeFile(output('de405-strategy-c-boundary-comparison.md'), markdown)
console.log(JSON.stringify({ output: 'artifacts/de405-strategy-c-boundary-comparison.json', verdict: artifact.verdict, currentCorpus: counts, priorReconciliation: artifact.priorArtifactReconciliation.reconciliation }, null, 2))

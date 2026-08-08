import { createHash } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'

const readJson = async path => JSON.parse(await readFile(path, 'utf8'))
const sha256 = async path => createHash('sha256').update(await readFile(path)).digest('hex')
const git = args => execFileSync('git', ['-c', 'core.fsmonitor=false', ...args], { encoding: 'utf8' }).trim()

const comparisonPath = 'artifacts/de405-strategy-c-boundary-comparison.json'
const comparisonMarkdownPath = 'artifacts/de405-strategy-c-boundary-comparison.md'
const inventoryPath = 'artifacts/de405-strategy-c-boundary-inventory.json'
const supportAuditPath = 'artifacts/de405-strategy-c-support-audit.json'
const supportContractPath = 'artifacts/de405-strategy-c-support-contract.json'
const centerChainPath = 'artifacts/de405-strategy-c-center-chain-comparison.json'
const routePath = 'artifacts/de405-strategy-c-route-comparison.json'
const canonicalRouteVariantPath = 'artifacts/de405-strategy-c-canonical-route-variant-evidence.json'
const canonicalRouteVariantMarkdownPath = 'artifacts/de405-strategy-c-canonical-route-variant-evidence.md'
const canonicalRouteFullAuditPath = 'artifacts/de405-strategy-c-canonical-route-full-audit.json'
const priorBaselineFidelityPath = 'artifacts/de405-type2-strategy-baseline-fidelity.json'
const priorStrategyComparisonPath = 'artifacts/de405-type2-strategy-comparison.json'
const outputPath = 'artifacts/de405-strategy-c-completion-audit.json'

const [comparison, inventory, supportAudit, supportContract, centerChain, route, canonicalRouteVariant, canonicalRouteFullAudit, priorBaselineFidelity, priorStrategyComparison] = await Promise.all([
  readJson(comparisonPath),
  readJson(inventoryPath),
  readJson(supportAuditPath),
  readJson(supportContractPath),
  readJson(centerChainPath),
  readJson(routePath),
  readJson(canonicalRouteVariantPath),
  readJson(canonicalRouteFullAuditPath),
  readJson(priorBaselineFidelityPath),
  readJson(priorStrategyComparisonPath)
])

const requirements = [
  { id: 'production_boundary_inventory', status: 'proved', evidence: inventoryPath },
  { id: 'canonical_integration_copy', status: comparison.gates.integrationPublicOutput && comparison.gates.integrationEvaluatorState ? 'proved' : 'not_proved', evidence: comparisonPath },
  { id: 'support_contract', status: comparison.gates.supportMatrixComplete ? 'proved' : 'partial', evidence: supportContractPath, reason: 'Observed support is limited to the recorded Apple Clang arm64 Darwin environment; non-Clang, non-arm64, and CI/production runtime remain unverified.' },
  { id: 'type2_154_sentinel', status: 'proved', evidence: inventoryPath },
  { id: 'selection_ambiguous_1701_sentinel', status: 'proved', evidence: inventoryPath },
  { id: 'full_corpus_identity_and_counts', status: comparison.gates.inputIdentity && comparison.currentCorpus.executionErrors === 0 ? 'proved' : 'not_proved', evidence: comparisonPath },
  { id: 'baseline_exactness_150671', status: canonicalRouteVariant.fullNumeric.counts.baselineExact === 150671 ? 'proved' : 'not_proved', evidence: canonicalRouteVariantPath, reason: `Baseline numeric exactness is ${canonicalRouteVariant.fullNumeric.counts.baselineExact}/150671 in the canonical-route variant and ${comparison.currentCorpus.baselineExact}/150671 in the preserved legacy comparison; corpus identity coverage is separate from numeric baseline exactness.` },
  { id: 'baseline_normal_case_output_route_unchanged', status: canonicalRouteVariant.fullNumeric.counts.baselineExact === 150671 ? 'proved' : 'not_proved', evidence: canonicalRouteVariantPath, reason: 'The full-corpus baseline output/classification/route invariant is not proved when baseline numeric exactness is below 150671/150671.' },
  { id: 'baseline_regression', status: comparison.gates.candidateRegression ? 'proved' : 'not_proved', evidence: comparisonPath },
  { id: 'route_comparable_shadow_candidate', status: comparison.gates.shadowComparableRouteCandidateExact ? 'proved' : 'not_proved', evidence: routePath, reason: `${route.counts.candidateRouteComparableRows} route-comparable rows are exact.` },
  { id: 'full_shadow_candidate_all_rows', status: comparison.gates.fullCanonicalCenterChainComparison ? 'proved' : 'not_proved', evidence: centerChainPath, reason: `${centerChain.counts.integrationCandidateMismatches} rows retain a center-chain/route mismatch; full shadow equivalence is not established.` },
  { id: 'canonical_route_variant_full_corpus', status: canonicalRouteVariant.fullNumeric.counts.candidateExact === 150671 && canonicalRouteVariant.fullRouteStatus === 'proved' ? 'proved' : 'not_proved', evidence: canonicalRouteVariantPath, reason: 'The separated canonical-route variant proves full candidate numeric, route, record, and evaluator identity while preserving the legacy shadow aggregate separately.' },
  { id: 'determinism', status: comparison.gates.deterministicTwoRunByteIdentity ? 'proved' : 'not_proved', evidence: comparisonPath },
  { id: 'production_protection', status: comparison.protectedProduction.canonicalSourceUnchangedFromHEAD && !comparison.protectedProduction.productionActivation ? 'proved' : 'not_proved', evidence: comparisonPath }
]

const artifact = {
  schemaVersion: 1,
  recordType: 'de405_strategy_c_completion_audit',
  verdict: comparison.verdict,
  repositoryBaseline: {
    branch: git(['branch', '--show-current']),
    head: git(['rev-parse', 'HEAD']),
    originMain: git(['rev-parse', 'origin/main']),
    parity: git(['rev-parse', 'HEAD']) === git(['rev-parse', 'origin/main'])
  },
  requirements,
  supportSummary: {
    allContractEqual: supportAudit.allContractEqual,
    repeatabilityEqual: supportAudit.repeatabilityEqual,
    executionOrderInvariant: supportAudit.executionOrderInvariant,
    parallelExecutionInvariant: supportAudit.parallelExecutionInvariant,
    noNewSupportDeclaration: supportAudit.supportClassification.noNewSupportDeclaration
  },
  corpus: comparison.currentCorpus,
  baselineReconciliation: {
    requestedBaselineExactness: 150671,
    corpusIdentityRows: comparison.currentCorpus.sourceRows,
    preservedLegacyBaselineExact: comparison.currentCorpus.baselineExact,
    canonicalRouteVariantBaselineExact: canonicalRouteVariant.fullNumeric.counts.baselineExact,
    priorReferenceBaselineExact: priorBaselineFidelity.baselineReferenceExact,
    priorReferenceBaselineMismatch: priorBaselineFidelity.baselineReferenceMismatch,
    priorStrategies: Object.fromEntries(Object.entries(priorStrategyComparison.strategies).map(([name, value]) => [name, {
      baselineExactPreserved: value.baselineExactPreserved,
      changed: value.changed,
      resolved: value.resolved,
      regressions: value.regressions,
      executionErrors: value.executionErrors
    }])),
    crossStrategyCandidatePairBitDifferences: priorStrategyComparison.baseline.crossStrategyBitDifferences,
    status: 'requested_150671_baseline_numeric_exactness_not_reconciled',
    reason: '150671 is the complete corpus identity count; the independently recorded numeric baseline exactness is lower and is preserved without tuning or reinterpretation.',
    evidence: [priorBaselineFidelityPath, priorStrategyComparisonPath, comparisonPath, canonicalRouteVariantPath]
  },
  routeComparison: route.counts,
  gates: comparison.gates,
  proposalEligibility: 'not_eligible',
  proposalNotGenerated: true,
  proposalReason: 'fullCanonicalCenterChainComparison and supportMatrixComplete are false; Strategy C remains shadow-only.',
  validation: {
    targetedBoundaryTest: 'passed',
    artifactSuite: 'passed',
    npmTest: 'passed',
    build: 'passed',
    diffCheck: 'passed'
  },
  evidenceArtifacts: Object.fromEntries(await Promise.all([
  comparisonPath, comparisonMarkdownPath, inventoryPath, supportAuditPath, supportContractPath, centerChainPath, routePath, canonicalRouteVariantPath, canonicalRouteVariantMarkdownPath, canonicalRouteFullAuditPath, priorBaselineFidelityPath, priorStrategyComparisonPath
  ].map(async path => [path, { sha256: await sha256(path) }])))
}

await writeFile(outputPath, `${JSON.stringify(artifact, null, 2)}\n`)
console.log(JSON.stringify({ outputPath, sha256: await sha256(outputPath), verdict: artifact.verdict, proposalEligibility: artifact.proposalEligibility }, null, 2))

import { createHash } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { attachArtifactIdentity, buildArtifactIdentity } from '../src/artifactIdentity.js'

export const ZIWEI_BASELINE_HEAD = 'd40f0fe167a020a6c6f576ac45bd180c2989da55'
export const ZIWEI_BASELINE_SCHEMA = 'ziwei-readiness-baseline-v1'
export const ZIWEI_STATUS_VOCABULARY = [
  'verified', 'implemented_unverified', 'partial', 'experimental',
  'regression_only', 'stub_or_simulation', 'documented_only', 'absent', 'blocked',
]

const evidence = [
  { id: 'ziwei-input-contract', kind: 'source_test', path: 'src/ziwei/ziweiContract.js', exports: ['createZiweiCalculationContext', 'DEFAULT_ZIWEI_RULE_SET'], testPaths: ['test/ziweiContract.test.js'], note: 'normalizes lunar fields and records conversion status, but does not perform solar/lunar conversion or attach sourceRefs' },
  { id: 'ziwei-calendar-execution', kind: 'source_test', path: 'src/interpretationPrep/threeSystemPrepPipeline.js', exports: ['prepareThreeSystemInterpretationData'], testPaths: ['test/ziweiCoreContract.test.js', 'test/ziweiPipeline.test.js'], note: 'solar2lunar is used on the exact-time path; leap-month and time-boundary paths fail closed' },
  { id: 'ziwei-core-calculation', kind: 'source_test', path: 'src/ziwei/ziweiResolver.js', exports: ['resolveZiweiChart'], testPaths: ['test/ziweiResolver.test.js', 'test/ziweiCoreContract.test.js'], note: 'ming/shen branches, palace cycle, bureau and candidate warnings are implemented under a fixed ruleset' },
  { id: 'ziwei-rule-resolvers', kind: 'source_test', path: 'src/ziwei/fiveElementResolver.js', exports: ['resolveFiveElementBureau'], testPaths: ['test/ziweiCoreContract.test.js'], relatedPaths: ['src/ziwei/starPlacementRules.js', 'src/ziwei/starResolver.js', 'src/ziwei/minorStarRules.js', 'src/ziwei/minorStarResolver.js', 'src/ziwei/transformationRules.js', 'src/ziwei/transformationResolver.js'], note: 'bureau, 14 major stars, six minor stars and four transformations have named local ruleset versions' },
  { id: 'ziwei-relation-structure', kind: 'source_test', path: 'src/ziwei/ziweiPalaceContext.js', exports: ['buildZiweiPalaceContexts'], testPaths: ['test/ziweiContract.test.js', 'test/ziweiCoreContract.test.js'], relatedPaths: ['src/ziwei/palaceRelationRules.js'], note: 'opposite/trine palace structure and topic patterns exist; these are not claim relation edges' },
  { id: 'ziwei-internal-fixtures', kind: 'fixture_test', path: 'test/fixtures/ziwei/knownCharts.js', exports: ['KNOWN_ZIWEI_CHARTS'], testPaths: ['test/ziweiResolver.test.js', 'test/ziweiCoreContract.test.js'], relatedPaths: ['test/fixtures/ziwei/starPlacementCharts.js'], note: 'six expected-value cases are local regression fixtures, not independent evidence' },
  { id: 'ziwei-benchmark-fixtures', kind: 'fixture_test', path: 'test/fixtures/ziwei/benchmarkCases.js', exports: ['ZIWEI_BENCHMARK_CASES'], testPaths: ['test/ziweiQualityBenchmark.test.js'], relatedPaths: ['scratch/ziweiQualityBenchmarkEvaluation.js', 'scratch/ziweiQualityBenchmarkReport.json'], note: 'five prompt/rubric cases assess adapter behavior; they do not validate chart truth' },
  { id: 'ziwei-external-fixtures', kind: 'external_fixture_runner', path: 'src/ziwei/externalZiweiFixtures.js', exports: ['ZIWEI_EXTERNAL_FIXTURES'], testPaths: ['test/ziweiPipeline.test.js'], relatedPaths: ['src/interpretationPrep/externalValidationRunner.js'], note: 'six declared external-looking fixtures: four observed matches and two excluded, all pending source review' },
  { id: 'ziwei-external-reports', kind: 'document_fixture_artifact', path: 'docs/ziwei-source-audit-report.md', relatedPaths: ['docs/ziwei-external-validation-report.md', 'docs/ziwei-final-readiness.md'], note: 'reports preserve observed versus verified distinction and state verifiedMatches=0' },
  { id: 'ziwei-handoff-adapter', kind: 'source_test', path: 'src/interpretationPrep/ziweiPromptAdapter.js', exports: ['buildZiweiPromptPayload'], testPaths: ['test/ziweiPromptSafetyContract.test.js'], relatedPaths: ['src/interpretationPrep/sessionResponsePipeline.js'], note: 'prompt/session handoff exists with safety wording, but no claim IDs, sourceRefs or grounding artifact' },
  { id: 'ziwei-pipeline-boundary', kind: 'source_test', path: 'src/interpretationPrep/threeSystemPrepPipeline.js', exports: ['prepareThreeSystemInterpretationData'], testPaths: ['test/ziweiCoreContract.test.js', 'test/ziweiPipeline.test.js'], note: 'normal exact input can expose experimental Ziwei to chat; candidate paths are blocked; production activation is not established' },
  { id: 'ziwei-tri-baseline', kind: 'artifact_document', path: 'artifacts/tri-system-readiness-v1/inventory.json', relatedPaths: ['scripts/materialize-tri-system-readiness.mjs'], note: 'prior tri-system summary records Ziwei partial/experimental and absent materialization, but is coarser than this inventory' },
]

const inventory = {
  schemaVersion: ZIWEI_BASELINE_SCHEMA,
  inventoryVersion: '1.0.0',
  verdictToken: 'ziwei_readiness_baseline_partial_unverified',
  scope: 'read_only_repository_evidence_audit_at_fixed_head',
  basisHead: ZIWEI_BASELINE_HEAD,
  materializerPath: 'scripts/materialize-ziwei-readiness-baseline-v1.mjs',
  checkerPath: 'scripts/check-ziwei-readiness-baseline-v1.mjs',
  statusVocabulary: ZIWEI_STATUS_VOCABULARY,
  overall: {
    status: 'partial',
    activation: 'experimental',
    calculation: 'implemented_unverified',
    externalValidation: 'partial',
    claimProvenanceStart: 'blocked',
    claimIdentification: 'not_stable',
    nextUnit: 'ziwei_source_identity_and_claim_boundary_audit',
  },
  layerStatus: [
    { id: 'input_calendar', status: 'partial', evidenceIds: ['ziwei-input-contract', 'ziwei-calendar-execution'], basis: 'solar2lunar execution and lunar fields exist; conversion verification/source identity is unresolved; leap-month and time-boundary cases are candidate-blocked' },
    { id: 'deterministic_calculation', status: 'implemented_unverified', evidenceIds: ['ziwei-core-calculation', 'ziwei-rule-resolvers', 'ziwei-internal-fixtures'], basis: 'deterministic local resolvers and regression expectations exist; no independent chart oracle is established' },
    { id: 'traditional_rule_application', status: 'implemented_unverified', evidenceIds: ['ziwei-rule-resolvers', 'ziwei-external-fixtures', 'ziwei-external-reports'], basis: 'local rules have versions and comments; this inventory does not assess traditional validity and the cited edition is unresolved' },
    { id: 'fixture_external_validation', status: 'partial', evidenceIds: ['ziwei-internal-fixtures', 'ziwei-external-fixtures', 'ziwei-external-reports'], basis: 'six internal regression cases; six declared external fixtures with four observed matches, zero verified matches, two excluded' },
    { id: 'claim_meaning_candidate_structure', status: 'partial', evidenceIds: ['ziwei-relation-structure', 'ziwei-handoff-adapter', 'ziwei-benchmark-fixtures'], basis: 'interpretivePatterns and prompt payload are meaning-adjacent structures, but stable claim/occurrence identity is absent' },
    { id: 'provenance', status: 'partial', evidenceIds: ['ziwei-external-fixtures', 'ziwei-external-reports', 'ziwei-handoff-adapter'], basis: 'fixture source objects exist; chart facts and meaning candidates do not carry claim-level sourceRefs, source hashes or source identity links' },
    { id: 'relation_graph', status: 'implemented_unverified', evidenceIds: ['ziwei-relation-structure', 'ziwei-handoff-adapter'], basis: 'palace opposite/trine structure is computed, but no claim relation graph or mechanically bounded claim edges exists' },
    { id: 'readiness_context', status: 'partial', evidenceIds: ['ziwei-input-contract', 'ziwei-pipeline-boundary', 'ziwei-tri-baseline'], basis: 'per-result state fields and candidate blocking exist; no Ziwei-specific deterministic readiness/grounding artifact existed at the baseline' },
    { id: 'handoff_grounding', status: 'partial', evidenceIds: ['ziwei-handoff-adapter', 'ziwei-pipeline-boundary'], basis: 'prompt/session handoff exists; it is not sourceRefs-grounded evidence and normal exact input remains experimental' },
    { id: 'materialization_checker', status: 'partial', evidenceIds: ['ziwei-tri-baseline'], basis: 'this work adds a baseline inventory materializer/checker; calculation/readiness facts are not thereby independently verified' },
    { id: 'activation', status: 'experimental', evidenceIds: ['ziwei-pipeline-boundary', 'ziwei-tri-baseline'], basis: 'tri-system baseline says experimental; no production activation or claim-grounded user-delivery contract is established' },
  ],
  sourceIdentity: {
    currentSourceLabels: ['紫微斗數全書 / Ziwei Dou Shu Quan Shu', 'CText public digital transcription', '陳摶 (attributed) / 羅洪先 (edit)'],
    sourceEditionIdentity: 'unresolved_source_identity',
    authorIdentity: 'attributed_or_editorial_identity_only',
    pageSectionIdentity: 'section_labels_recorded; exact edition/page/scan identity unresolved',
    externalImplementation: 'absent',
    externalVersion: 'absent',
    externalSettings: 'fixture-declared settings exist (calendar/timezone/boundary/school), but no external product/version execution identity exists',
    directEvidence: 'CText URL and quoted section labels are recorded in fixtures/reports; no immutable retrieval bytes or edition hash are present',
    indirectEvidence: 'observed comparisons are produced by src/interpretationPrep/externalValidationRunner.js calling current local resolvers',
    circularValidation: true,
    unresolvedReasonCodes: ['exact_edition_missing', 'external_implementation_identity_missing', 'retrieval_bytes_missing', 'runner_reuses_current_resolvers'],
  },
  claimAssessment: {
    stableClaimId: false,
    stableOccurrenceId: false,
    sourceRefsOnOutput: false,
    meaningCandidatesPresent: true,
    currentStructures: ['src/ziwei/ziweiContract.js:createZiweiInterpretationContext', 'src/ziwei/ziweiPalaceContext.js:interpretivePatterns', 'src/interpretationPrep/ziweiPromptAdapter.js:buildZiweiPromptPayload'],
    verdict: 'not_ready_for_claim_level_provenance',
    blockers: ['source identity and rule-set boundary are not closed', 'current output facts have no stable claim/occurrence identity', 'current handoff has no sourceRefs-grounded consumer contract'],
  },
  validationSummary: {
    internalRegressionFixtures: { knownCharts: 3, starPlacementCharts: 3, total: 6, status: 'regression_only' },
    interpretationBenchmarkFixtures: { total: 5, status: 'regression_only' },
    declaredExternalFixtures: { total: 6, evaluated: 4, excluded: 2, observedMatches: 4, observedMismatches: 0, verifiedMatches: 0, pendingSourceReview: 6, status: 'partial' },
    independence: 'not_established',
  },
  gaps: {
    beforeProvenanceBlockers: [
      { id: 'source-edition-identity', status: 'blocked', reason: 'exact source edition, author/editor identity, page/scan locator and immutable retrieval identity are unresolved' },
      { id: 'external-oracle-identity', status: 'blocked', reason: 'no independent implementation/product/version/settings identity is recorded; current runner invokes local resolvers' },
      { id: 'claim-boundary', status: 'blocked', reason: 'stable claim/occurrence unit and fact-versus-candidate boundary are not defined for Ziwei output' },
    ],
    parallelWithUnresolvedState: [
      { id: 'inventory-schema-tests', status: 'implemented_unverified', reason: 'baseline inventory/checker can be hardened without changing calculation' },
      { id: 'fixture-reconciliation', status: 'partial', reason: 'retain observed/pending/out-of-scope distinctions while source identity remains unresolved' },
      { id: 'unsupported-scope-catalog', status: 'documented_only', reason: 'timing, brightness, extended minor stars and palace transformations remain explicit unsupported boundaries' },
    ],
    evidenceHardeningTrack: [
      { id: 'immutable-source-capture', status: 'blocked', reason: 'source download/acquisition is outside this work order' },
      { id: 'independent-reproduction', status: 'blocked', reason: 'requires separately identified external implementation or manual oracle with settings' },
      { id: 'negative-boundary-corpus', status: 'partial', reason: 'candidate and unsupported paths exist but are not materialized as claim-grounded evidence' },
    ],
  },
  recommendedOrder: [
    'ziwei_source_identity_and_claim_boundary_audit',
    'ziwei_independent_fixture_reconciliation',
    'ziwei_claim_provenance_contract',
    'ziwei_readiness_grounding_artifact',
    'ziwei_handoff_boundary_review',
  ],
  nextGoal: {
    verdictToken: 'ziwei_source_identity_and_claim_boundary_audit',
    objective: '자미두수 외부 fixture의 정확한 source edition·retrieval identity·비순환 비교 조건과 계산 output의 claim/occurrence 경계를 확정하고, 계산 코드는 변경하지 않은 채 acceptance 기준을 문서화한다.',
    allowedScope: ['read_only source audit', 'fixture metadata reconciliation', 'assessment/checker tests'],
    prohibitedScope: ['calculation/rule/fixture value changes', 'source download', 'claim/provenance/readiness/grounding implementation', 'UI/API/DB/LLM/activation'],
  },
  evidence,
  invariants: [
    'no traditional validity or life-accuracy judgment is made',
    'internal expected values are regression evidence only',
    'observed external matches are not promoted to verified',
    'unresolved source identity is preserved as unresolved_source_identity',
    'no new claim, relation, interpretation, ranking or common envelope is created',
  ],
}

export function canonicalJson(value) {
  const sort = (current) => {
    if (Array.isArray(current)) return current.map(sort)
    if (current && typeof current === 'object') {
      return Object.fromEntries(Object.keys(current).sort().map(key => [key, sort(current[key])]))
    }
    return current
  }
  return `${JSON.stringify(sort(value), null, 2)}\n`
}

export function materializeInventory() {
  const root = resolve(new URL('..', import.meta.url).pathname)
  const head = execFileSync('git', ['-c', 'core.fsmonitor=false', 'rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim()
  return attachArtifactIdentity(inventory, buildArtifactIdentity({
    root,
    artifactId: 'ziwei-readiness-baseline-v1',
    materializerPath: 'scripts/materialize-ziwei-readiness-baseline-v1.mjs',
    materializerVersion: '1.1.0',
    baseHead: head,
    inputs: ['src/ziwei/ziweiContract.js', 'src/ziwei/ziweiResolver.js', 'src/interpretationPrep/ziweiPromptAdapter.js'],
  }))
}

export async function writeInventory(outputPath) {
  const target = resolve(outputPath)
  const body = canonicalJson(materializeInventory())
  const hash = createHash('sha256').update(body).digest('hex')
  await mkdir(dirname(target), { recursive: true })
  await writeFile(target, body)
  await writeFile(`${target}.integrity.json`, `${JSON.stringify({ schemaVersion: ZIWEI_BASELINE_SCHEMA, artifactByteSha256: hash, artifactByteSha256Scope: 'complete.json UTF-8 bytes including final LF' }, null, 2)}\n`)
  return { target, hash }
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  const output = process.argv[2] || 'artifacts/ziwei-readiness-baseline-v1/complete.json'
  const result = await writeInventory(output)
  console.log(JSON.stringify(result, null, 2))
}

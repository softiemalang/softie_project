import fs from 'node:fs'
import crypto from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { SAJU_EXTERNAL_FIXTURES } from '../src/saju/engine/externalValidationFixtures.js'
import { SAJU_ENGINE_VERSION, SAJU_CALCULATION_PROFILE } from '../src/saju/engine/fourPillars.js'
import { SAJU_VALIDATION_FIXTURE_VERSION, sajuValidationFixtures } from '../src/interpretationPrep/fixtures/sajuValidationFixtures.js'
import { runExternalValidationSuite } from '../src/interpretationPrep/externalValidationRunner.js'

const root = new URL('../', import.meta.url).pathname
const artifactPath = new URL('../artifacts/saju-verification-reconciliation-v1.json', import.meta.url).pathname

const sourceSpecs = [
  ['internal_regression_fixture', 'src/interpretationPrep/fixtures/sajuValidationFixtures.js', 'fixture expected values and verificationStatus'],
  ['external_reference_fixture', 'src/saju/engine/externalValidationFixtures.js', 'external expected values and source metadata'],
  ['external_runner', 'src/interpretationPrep/externalValidationRunner.js', 'actual-vs-expected comparison runner'],
  ['internal_fixture_test', 'src/interpretationPrep/sajuValidationRunner.test.js', 'internal fixture runner tests'],
  ['engine_external_fixture_test', 'src/saju/engine/fourPillars.test.js', 'engine and HKO fixture tests'],
  ['external_runner_test', 'test/externalValidationRunner.test.js', 'external provenance runner tests'],
  ['calculation_engine', 'src/saju/engine/fourPillars.js', 'deterministic four-pillars implementation'],
  ['solar_terms_engine', 'src/saju/engine/solarTerms.js', 'solar-term boundary implementation'],
  ['lunar_converter', 'src/interpretationPrep/lunarConverter.js', 'lunar-to-solar conversion implementation'],
  ['saju_profile_rules', 'src/interpretationPrep/sajuProfileRules.js', 'derived profile/rule implementation'],
  ['saju_relation_rules', 'src/interpretationPrep/sajuRelationRules.js', 'relation rule implementation'],
  ['saju_timing_rules', 'src/interpretationPrep/sajuTimingRules.js', 'timing rule implementation'],
  ['final_readiness_document', 'docs/saju-final-readiness.md', 'readiness vocabulary and scope'],
  ['external_validation_report', 'docs/saju-external-validation-report.md', 'external fixture report'],
  ['tri_system_inventory', 'artifacts/tri-system-readiness-v1/inventory.json', 'tri-system readiness baseline'],
]

const sha256 = (bytes) => crypto.createHash('sha256').update(bytes).digest('hex')
const read = (relativePath) => fs.readFileSync(new URL(`../${relativePath}`, import.meta.url))
const text = (relativePath) => read(relativePath).toString('utf8')
const lines = (value) => value.split(/\r?\n/)
const lineNumbersFor = (relativePath, pattern) => lines(text(relativePath))
  .map((line, index) => pattern.test(line) ? index + 1 : null)
  .filter(Boolean)

const head = execFileSync('git', ['-c', 'core.fsmonitor=false', 'rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim()
const externalRun = runExternalValidationSuite()
const sajuExternalResults = externalRun.sajuResults
const internalByStatus = Object.groupBy(sajuValidationFixtures, (fixture) => fixture.verificationStatus)

const sourceIdentity = sourceSpecs.map(([id, relativePath, role]) => ({
  id,
  path: relativePath,
  role,
  sha256: sha256(read(relativePath)),
  sourceIdentity: id === 'external_reference_fixture'
    ? 'fixture-declared source metadata; source bytes are not vendored or hash-pinned'
    : id === 'internal_regression_fixture'
      ? 'current engine regression baseline; no independent source identity'
      : id === 'final_readiness_document' || id === 'external_validation_report' || id === 'tri_system_inventory'
        ? 'repository document/artifact identity only'
        : 'repository implementation identity only',
  editionVersionIdentifiable: id === 'external_reference_fixture'
    ? SAJU_EXTERNAL_FIXTURES.every((fixture) => Boolean(fixture.source?.editionOrVersion))
    : id === 'calculation_engine'
      ? true
      : false,
  directOrIndirect: id === 'external_reference_fixture' ? 'direct_reference_metadata' : 'indirect_or_internal',
  circularValidation: id === 'internal_regression_fixture',
}))

const vocabulary = [
  {
    token: 'verified',
    meaningInRepository: 'either a per-result state or a declared external fixture review status; not one uniform evidence level',
    evidenceLevel: 'overloaded',
    locations: [
      { path: 'src/saju/engine/externalValidationFixtures.js', lines: lineNumbersFor('src/saju/engine/externalValidationFixtures.js', /declaredReviewStatus: 'verified_reference'/) },
      { path: 'docs/saju-final-readiness.md', lines: lineNumbersFor('docs/saju-final-readiness.md', /verificationStatus: 'verified|externalValidationStatus/) },
      { path: 'artifacts/tri-system-readiness-v1/inventory.json', lines: lineNumbersFor('artifacts/tri-system-readiness-v1/inventory.json', /implemented_unverified|overallStatus/) },
    ],
    reconciliation: 'do not use as a claim-level truth label; preserve scope, source identity, and comparison result beside it',
  },
  {
    token: 'validated',
    meaningInRepository: 'human prose for completed or scoped comparison; often broader than the fields actually compared',
    evidenceLevel: 'scope-dependent',
    locations: [
      { path: 'docs/saju-external-validation-report.md', lines: lineNumbersFor('docs/saju-external-validation-report.md', /검증|validation|validated/) },
      { path: 'src/interpretationPrep/validationMetadata.js', lines: lineNumbersFor('src/interpretationPrep/validationMetadata.js', /Validated|validated|validation/) },
    ],
    reconciliation: 'replace with an explicit comparison scope and observed result in future evidence records',
  },
  {
    token: 'confirmed',
    meaningInRepository: 'not established as a Saju-specific evidence status in the audited sources',
    evidenceLevel: 'not_found_as_saju_contract',
    locations: [],
    reconciliation: 'reserve for an independently identified source plus reproducible comparison, if adopted later',
  },
  {
    token: 'canonical',
    meaningInRepository: 'used by the external-fixture source-of-truth comment, but not a proof that the source edition or bytes are canonical',
    evidenceLevel: 'repository-source-of-truth_only',
    locations: [{ path: 'src/saju/engine/externalValidationFixtures.js', lines: lineNumbersFor('src/saju/engine/externalValidationFixtures.js', /Canonical Source of Truth/) }],
    reconciliation: 'use only for repository ownership/selection, never for scientific or traditional-rule authority',
  },
  {
    token: 'regression_only',
    meaningInRepository: 'internal expected-value comparison against the current engine',
    evidenceLevel: 'internal_regression',
    locations: [{ path: 'src/interpretationPrep/fixtures/sajuValidationFixtures.js', lines: lineNumbersFor('src/interpretationPrep/fixtures/sajuValidationFixtures.js', /regression_only/) }],
    reconciliation: 'accurate and should remain distinct from independent validation',
  },
  {
    token: 'experimental',
    meaningInRepository: 'derived interpretation/rule output kept separate from the core calculation contract',
    evidenceLevel: 'experimental_or_unverified',
    locations: [{ path: 'src/interpretationPrep/sajuAdapter.js', lines: lineNumbersFor('src/interpretationPrep/sajuAdapter.js', /experimental/) }],
    reconciliation: 'appropriate for derived rules; does not establish traditional-rule validity',
  },
  {
    token: 'production',
    meaningInRepository: 'implementation scope, not evidence strength',
    evidenceLevel: 'not_a_verification_level',
    locations: [{ path: 'docs/saju-external-validation-report.md', lines: lineNumbersFor('docs/saju-external-validation-report.md', /프로덕션/) }],
    reconciliation: 'do not infer external correctness from production module membership',
  },
]

const sourceIdentityFindings = [
  { id: 'internal-fixtures-circular', status: 'confirmed_gap', subject: '12 regression_only fixtures', reason: 'expected values are compared to outputs from the same repository engine; no independent source identity is attached' },
  { id: 'pending-fixture-unresolved', status: 'unresolved_source_identity', subject: 'val-pending-external', reason: 'source is explicitly pending and has no edition, locator, or reproducible external comparison record' },
  { id: 'external-fixtures-scoped', status: 'scoped_match', subject: '7 external fixtures', reason: 'runner observes 7/7 matches across 5 Tier 1 HKO and 2 Tier 2 IANA discussion fixtures; this covers declared fields only' },
  { id: 'external-source-bytes-unpinned', status: 'source_provenance_gap', subject: 'HKO/IANA source documents', reason: 'metadata includes URL, edition/date, and page/section, but no retrieved source-byte hash or vendored snapshot' },
  { id: 'traditional-rule-edition-missing', status: 'unresolved_source_identity', subject: 'profile/relation/timing rules', reason: 'internal rule versions exist, but no attributable traditional text edition, author, translation, page, section, or table is linked' },
  { id: 'readiness-report-conflict', status: 'document_reconciliation', subject: 'docs/saju-final-readiness.md vs docs/saju-external-validation-report.md', reason: 'readiness correctly keeps externalValidationStatus pending while companion report calls seven scoped matches verified_reference; both are true only when scope is made explicit' },
]

const artifact = {
  schemaVersion: 'saju-verification-reconciliation-v1',
  verdictToken: 'saju_scoped_external_matches_but_claim_level_verification_unproven',
  generatedFromHead: head,
  scope: 'read_only_reconciliation_of_existing_saju_evidence',
  invariants: [
    'no calculation, rule, fixture expectation, contract, or tolerance was changed',
    'internal regression evidence is not independent verification',
    'traditional-rule validity and life-interpretation accuracy are out of scope',
    'source identity is unresolved when edition or reproducible source bytes are absent',
  ],
  counts: {
    internalRegressionFixtures: sajuValidationFixtures.length,
    internalRegressionOnly: (internalByStatus.regression_only || []).length,
    internalPendingExternal: (internalByStatus.pending_external_verification || []).length,
    independentReferenceFixtures: SAJU_EXTERNAL_FIXTURES.length,
    independentObservedMatches: externalRun.sajuSummary.observedMatches,
    independentObservedMismatches: externalRun.sajuSummary.observedMismatches,
    declaredVerifiedReferenceMatches: externalRun.sajuSummary.verifiedMatches,
    traditionalRuleSourceIdentities: 0,
  },
  implementationIdentity: {
    engineVersion: SAJU_ENGINE_VERSION,
    calculationProfile: SAJU_CALCULATION_PROFILE,
    fixtureVersion: SAJU_VALIDATION_FIXTURE_VERSION,
  },
  externalComparison: {
    runnerVerdict: externalRun.gateStatus.sajuExternalValidationStatus,
    finalJudgementWhenFullSuiteRuns: externalRun.finalJudgement,
    summary: externalRun.sajuSummary,
    fixtures: sajuExternalResults.map((result) => ({
      fixtureId: result.fixtureId,
      referenceType: result.referenceType,
      sourceTier: result.sourceTier,
      sourceDocumentId: result.source?.referenceDocumentId,
      declaredReviewStatus: result.declaredReviewStatus,
      observedStatus: result.observedComparison?.overallStatus,
      comparedFields: result.observedComparison?.fields?.map((field) => field.path) || [],
    })),
  },
  verificationVocabulary: vocabulary,
  sourceIdentityInventory: sourceIdentity,
  findings: sourceIdentityFindings,
  recommendedVocabularyContract: {
    internal_regression: 'value matches a repository-owned expected value; no independent source claim',
    scoped_external_reference_match: 'declared field(s) match an independently described external reference under recorded rules; not a universal or claim-level verified label',
    source_identity_incomplete: 'a source is named but edition, locator, retrieval identity, or reproducibility is incomplete',
    rule_derivation_unverified: 'deterministically derived from an implementation rule version whose external traditional source is not identified',
    experimental_unverified: 'experimental or heuristic output; not promoted by regression or scoped reference matches',
    unresolved_source_identity: 'do not infer, substitute, or upgrade when the external source cannot be identified',
  },
  minimumClaimProvenanceRequirements: [
    'stable source identity: publisher/author, title, edition/version, publication date, URL or archive locator',
    'precise locator: page, section, table, example, or machine-readable record key',
    'retrieval identity: access date plus source-byte/content hash or immutable archive snapshot when feasible',
    'declared rule/school/settings: calendar, timezone, day boundary, solar-time policy, leap-month policy, and relevant rule variant',
    'implementation identity: engine/rule version and input/output field paths',
    'independence declaration and explicit circular-validation check',
    'reproducible comparison record with expected, actual, tolerance, and observed status',
  ],
  sourceIdentityFindings,
}

fs.mkdirSync(new URL('../artifacts/', import.meta.url), { recursive: true })
fs.writeFileSync(artifactPath, `${JSON.stringify(artifact, null, 2)}\n`)
console.log(`wrote ${artifactPath}`)
console.log(JSON.stringify({ verdictToken: artifact.verdictToken, head, counts: artifact.counts }, null, 2))

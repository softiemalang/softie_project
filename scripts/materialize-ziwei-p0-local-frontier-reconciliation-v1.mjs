import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import { readFileSync } from 'node:fs'
import { dirname, relative, resolve } from 'node:path'

import {
  attachArtifactIdentity,
  buildArtifactIdentity,
  canonicalIdentityJson,
} from '../src/artifactIdentity.js'

export const SCHEMA = 'ziwei-p0-local-frontier-reconciliation-v1'
export const VERDICT = 'complete_ziwei_p0_local_frontier_reconciled_external_authority_boundary'
export const MATERIALIZER_VERSION = '1.0.0'
export const BASIS_HEAD = '2d5eb3bb7cde79bcb6a671969280987ffe536965'
export const MATERIALIZER_PATH = `scripts/materialize-${SCHEMA}.mjs`
export const ARTIFACT_DIR = `artifacts/${SCHEMA}`
export const ARTIFACT_PATH = `${ARTIFACT_DIR}/complete.json`
export const NANBEI_ENV = 'PDF_SOURCE_NANBEI_PATH'
export const NANYANGTANG_ENV = 'PDF_SOURCE_NANYANGTANG_PATH'

export const PREDECESSOR_ARTIFACT = 'artifacts/ziwei-p0-toyo-1646-extended-observation-v0/complete.json'
export const TOYO_ARTIFACT = PREDECESSOR_ARTIFACT
export const PREDECESSOR_DOC = 'docs/ziwei-p0-toyo-1646-extended-observation-v0.md'
export const TOYO_MATERIALIZER = 'scripts/materialize-ziwei-p0-toyo-1646-extended-observation-v0.mjs'
export const TOYO_CHECKER = 'scripts/check-ziwei-p0-toyo-1646-extended-observation-v0.mjs'
export const TOYO_NEGATIVE_CHECKER = 'scripts/check-ziwei-p0-toyo-1646-extended-observation-v0-negative-v0.mjs'
export const TOYO_TEST = 'test/ziweiP0Toyo1646ExtendedObservation.test.js'

const ROOT = resolve(new URL('..', import.meta.url).pathname)
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const canonicalJson = value => `${JSON.stringify(sortValue(value), null, 2)}\n`
const sortValue = value => Array.isArray(value)
  ? value.map(sortValue)
  : value && typeof value === 'object'
    ? Object.fromEntries(Object.keys(value).sort().map(key => [key, sortValue(value[key])]))
    : value

const SOURCE_SPECS = Object.freeze([
  {
    key: 'nanbei',
    sourceId: 'src-nanbei-pdf',
    env: NANBEI_ENV,
    expectedSha256: '4786a94ab454acdabf9716d7c0db4756dbcbde99a88bc45fda254863c1961023',
    pageCount: 219,
    edition: '南北山人本',
    role: 'local_hash_verified_rule_witness_candidate',
  },
  {
    key: 'nanyangtang',
    sourceId: 'src-nanyangtang-pdf',
    env: NANYANGTANG_ENV,
    expectedSha256: '04e184c4a52cb042dc885c6ccc9135d94ab25de62007506198ee979a33e66bfc',
    pageCount: 528,
    edition: '明代南阳堂刊本',
    role: 'same_record_derivative_candidate_rule_witness',
  },
])

const INPUT_ARTIFACTS = Object.freeze([
  PREDECESSOR_ARTIFACT,
  PREDECESSOR_DOC,
  TOYO_MATERIALIZER,
  TOYO_CHECKER,
  TOYO_NEGATIVE_CHECKER,
  TOYO_TEST,
  'artifacts/ziwei-four-transformations-source-evidence-v0/complete.json',
  'artifacts/ziwei-four-transformations-source-evidence-v0/comparison.json',
  'artifacts/ziwei-four-transformations-source-evidence-v0/validation.json',
  'artifacts/ziwei-four-transformations-source-evidence-v0/transcription.json',
  'artifacts/ziwei-life-body-palace-ruler-source-evidence-v0/complete.json',
  'artifacts/ziwei-life-body-palace-ruler-source-evidence-v0/comparison.json',
  'artifacts/ziwei-life-body-palace-ruler-source-evidence-v0/locator-inventory.json',
  'artifacts/ziwei-auxiliary-star-placement-core-evidence-v0/complete.json',
  'artifacts/ziwei-auxiliary-star-placement-core-evidence-v0/comparison.json',
  'artifacts/ziwei-auxiliary-star-placement-core-evidence-v0/inventory.json',
  'artifacts/ziwei-twelve-major-star-placement-evidence-v0/complete.json',
  'artifacts/ziwei-major-star-source-corpus-provenance-v0/complete.json',
  'artifacts/ziwei-tianfu-representation-search-v1/complete.json',
  'artifacts/ziwei-tianfu-convention-provenance-v0/complete.json',
  'artifacts/ziwei-fixture-reconciliation-v1/complete.json',
  '-.jpg',
])

const ALL_BLOCKER_IDS = Object.freeze([
  'blocker-source-identity-unresolved',
  'blocker-palace-semantic-identity',
  'blocker-direct-rule-absent',
  'blocker-tianfu-raw-formula-contradiction',
  'blocker-tianfu-rotation06-semantic-authority',
  'blocker-auxiliary-star-source-witness',
  'blocker-four-transform-source-witness',
  'blocker-life-body-ruler-source-legibility',
  'blocker-independent-external-oracle',
  'blocker-calendar-time-source-identity',
  'blocker-image-reuse-rights',
])

const MAJOR_CLAIMS = Object.freeze([
  'claim-major-star-placement-ziwei',
  'claim-major-star-placement-tianji',
  'claim-major-star-placement-taiyang',
  'claim-major-star-placement-wugu',
  'claim-major-star-placement-tiandong',
  'claim-major-star-placement-lianzhen',
  'claim-major-star-placement-tianfu',
  'claim-major-star-placement-taiyin',
  'claim-major-star-placement-tanlang',
  'claim-major-star-placement-jumen',
  'claim-major-star-placement-tianxiang',
  'claim-major-star-placement-tianliang',
  'claim-major-star-placement-qisha',
  'claim-major-star-placement-pojun',
])

const FOUR_TRANSFORM_CLAIMS = Object.freeze([
  'claim-four-transformations-10x4',
  'claim-four-transform-lu',
  'claim-four-transform-quan',
  'claim-four-transform-ke',
  'claim-four-transform-ji',
])

function git(args) {
  return execFileSync('git', ['-c', 'core.fsmonitor=false', ...args], { cwd: ROOT, encoding: 'utf8' }).trim()
}

function readJson(path) {
  return JSON.parse(readFileSync(resolve(ROOT, path), 'utf8'))
}

function fileByteSha256(path) {
  return sha256(readFileSync(resolve(ROOT, path)))
}

function requireValue(condition, message) {
  if (!condition) throw new Error(message)
}

function readExternalSource(spec, sourcePaths) {
  const configuredPath = sourcePaths?.[spec.key] ?? process.env[spec.env]
  requireValue(typeof configuredPath === 'string' && configuredPath.trim() !== '', `${spec.env}_REQUIRED`)
  const path = resolve(configuredPath)
  let bytes
  try {
    bytes = readFileSync(path)
  } catch (error) {
    throw new Error(`${spec.sourceId}_READ_FAILURE:${path}:${error.code ?? error.message}`)
  }
  const actualSha256 = sha256(bytes)
  requireValue(actualSha256 === spec.expectedSha256, `${spec.sourceId}_SHA256_MISMATCH:${actualSha256}`)
  return {
    sourceId: spec.sourceId,
    configuredEnv: spec.env,
    path,
    edition: spec.edition,
    expectedSha256: spec.expectedSha256,
    actualSha256,
    byteLength: bytes.byteLength,
    pageCount: spec.pageCount,
    readOnly: true,
    copiedIntoRepository: false,
    acquiredDuringMaterialization: false,
    authority: spec.key === 'nanbei'
      ? 'hash_verified_local_direct_rule_surface; edition_lineage_and_semantic_authority_not_established'
      : 'hash_verified_local_direct_rule_surface; same_record_derivative_candidate_and_semantic_authority_not_established',
  }
}

function validatePredecessor(predecessor) {
  requireValue(predecessor.schemaVersion === 'ziwei-p0-toyo-1646-extended-observation-v0', 'unexpected_toyo_predecessor_schema')
  requireValue(predecessor.impact?.additiveCoverage?.claimCount === 30, 'unexpected_toyo_claim_count')
  requireValue(predecessor.impact?.additiveCoverage?.sourceCount === 13, 'unexpected_toyo_source_count')
  requireValue(predecessor.impact?.additiveCoverage?.observationCount === 34, 'unexpected_toyo_observation_count')
  requireValue(predecessor.impact?.additiveCoverage?.relationCount === 124, 'unexpected_toyo_relation_count')
  requireValue(predecessor.impact?.additiveCoverage?.blockerCount === 11, 'unexpected_toyo_blocker_count')
  requireValue(predecessor.impact?.stableClaimCount === 0, 'unexpected_toyo_stable_claim_boundary')
  requireValue(predecessor.impact?.semanticAuthorityCount === 0, 'unexpected_toyo_semantic_authority_boundary')
  requireValue(predecessor.impact?.readiness === 'not_safe_to_start', 'unexpected_toyo_readiness')
  requireValue(predecessor.impact?.grounding === 'blocked', 'unexpected_toyo_grounding')
  requireValue(predecessor.impact?.activation === 'experimental_only', 'unexpected_toyo_activation')
  requireValue(predecessor.impact?.rotation06 === 'representation_only', 'unexpected_toyo_rotation06')
  requireValue(predecessor.preservation?.historicalPredecessorBytesRewritten === false, 'toyo_predecessor_rewrite_boundary')
  requireValue(predecessor.preservation?.sourceImagesStoredInGit === false, 'toyo_source_image_storage_boundary')
  return {
    schemaVersion: predecessor.schemaVersion,
    verdictToken: predecessor.verdictToken,
    path: PREDECESSOR_ARTIFACT,
    byteSha256: fileByteSha256(PREDECESSOR_ARTIFACT),
    coverage: predecessor.impact.additiveCoverage,
    claimBoundary: {
      stableClaimCount: predecessor.impact.stableClaimCount,
      semanticAuthorityCount: predecessor.impact.semanticAuthorityCount,
      independentWitnessesAdmitted: predecessor.impact.independentWitnessesAdmitted,
    },
    readiness: {
      readiness: predecessor.impact.readiness,
      grounding: predecessor.impact.grounding,
      activation: predecessor.impact.activation,
      rotation06: predecessor.impact.rotation06,
    },
    preserved: {
      predecessorBytesRewritten: predecessor.preservation.historicalPredecessorBytesRewritten,
      sourceImagesStoredInGit: predecessor.preservation.sourceImagesStoredInGit,
      externalAcquisitionPerformed: predecessor.preservation.externalAcquisitionPerformed,
      networkUsedDuringMaterialization: predecessor.preservation.networkUsedDuringMaterialization,
      untrackedDashJpgPreserved: predecessor.preservation.untrackedDashJpgPreserved,
    },
  }
}

function buildLocalEvidence(sources) {
  const fourComplete = readJson('artifacts/ziwei-four-transformations-source-evidence-v0/complete.json')
  const fourComparison = readJson('artifacts/ziwei-four-transformations-source-evidence-v0/comparison.json')
  const fourValidation = readJson('artifacts/ziwei-four-transformations-source-evidence-v0/validation.json')
  const fourTranscription = readJson('artifacts/ziwei-four-transformations-source-evidence-v0/transcription.json')
  const fourNanbei = fourComparison.summary.sourceByEdition.nanbei_shanren
  const fourMing = fourComparison.summary.sourceByEdition.ming_nanyangtang
  requireValue(fourComparison.summary.rowCount === 80, 'four_transform_row_count')
  requireValue(fourNanbei.sourceOccurrenceCount === 40 && fourNanbei.comparableCount === 40 && fourNanbei.normalizedMatchCount === 40, 'four_transform_nanbei_coverage')
  requireValue(fourMing.sourceOccurrenceCount === 40 && fourMing.comparableCount === 4 && fourMing.blockedCount === 36, 'four_transform_ming_boundary')
  requireValue(fourComparison.summary.mismatchCount === 0, 'four_transform_mismatch_boundary')
  requireValue(fourValidation.sourceCoverage?.allSourceCellsPreserved === true, 'four_transform_source_cell_preservation')
  requireValue(fourTranscription.locators?.some(item => item.id === 'nanbei-p17-printed-42-four-transformations-table'), 'four_transform_nanbei_locator')
  requireValue(fourTranscription.locators?.some(item => item.id === 'ming-full-scan-four-transformations-not-located'), 'four_transform_ming_negative_locator')

  const lifeComplete = readJson('artifacts/ziwei-life-body-palace-ruler-source-evidence-v0/complete.json')
  const lifeComparison = readJson('artifacts/ziwei-life-body-palace-ruler-source-evidence-v0/comparison.json')
  const lifeLocatorInventory = readJson('artifacts/ziwei-life-body-palace-ruler-source-evidence-v0/locator-inventory.json')
  const lifeBody = lifeComparison.lifeBody
  const lifeRulers = lifeComparison.rulers
  const sourceRulerSummary = lifeRulers.sourceEditionComparison.summary
  requireValue(lifeBody.inputCount === 144 && lifeBody.matchCount === 144 && lifeBody.mismatchCount === 0, 'life_body_coverage')
  requireValue(lifeRulers.editions.nanyangtang.inputCount === 144 && lifeRulers.editions.nanbei.inputCount === 144, 'ruler_edition_coverage')
  requireValue(sourceRulerSummary.mingZhuCanonicalMatches === 144, 'ming_zhu_coverage')
  requireValue(sourceRulerSummary.shenZhuCanonicalComparable === 120 && sourceRulerSummary.shenZhuCanonicalBlocked === 24, 'shen_zhu_blocked_boundary')
  requireValue(lifeRulers.production.comparableCount === 0, 'production_ruler_contract_boundary')
  requireValue(lifeLocatorInventory.editions?.every(item => item.rulerStatus === 'direct_tables_located'), 'life_body_locator_boundary')
  requireValue(lifeComplete.boundaries?.stableClaimCount === 0, 'life_body_stable_claim_boundary')

  const auxiliary = readJson('artifacts/ziwei-auxiliary-star-placement-core-evidence-v0/complete.json')
  const auxiliaryComparison = readJson('artifacts/ziwei-auxiliary-star-placement-core-evidence-v0/comparison.json')
  const auxiliaryInventory = readJson('artifacts/ziwei-auxiliary-star-placement-core-evidence-v0/inventory.json')
  requireValue(auxiliary.comparisonSummary.comparableCount === 136 && auxiliary.comparisonSummary.exactMatchCount === 136, 'auxiliary_comparison_boundary')
  requireValue(auxiliary.comparisonSummary.notComparableCount === 684, 'auxiliary_not_comparable_boundary')
  requireValue(auxiliary.occurrenceSummary.sourceByEdition.ming_nanyangtang === 410 && auxiliary.occurrenceSummary.sourceByEdition.nanbei_shanren === 410, 'auxiliary_source_occurrence_boundary')
  requireValue(auxiliary.boundaries?.sourcePromotion === false && auxiliary.boundaries?.stableClaimCount === 0, 'auxiliary_promotion_boundary')
  requireValue(!auxiliaryInventory.locators?.some(item => item.sourceRef === 'nanbei-p17-printed-41-transformations'), 'auxiliary_locator_input_sanity')
  requireValue(auxiliaryComparison.summary?.exactMatchCount === 136, 'auxiliary_comparison_artifact_boundary')

  const major = readJson('artifacts/ziwei-twelve-major-star-placement-evidence-v0/complete.json')
  const majorSeries = major.comparison.bySeries
  requireValue(major.source.coverage.directVisualConfirmation === true, 'major_direct_visual_boundary')
  requireValue(major.source.coverage.coreRuleLocators === 5, 'major_locator_boundary')
  requireValue(major.source.coverage.unlocatedGeneralRule.status === 'source_rule_not_located', 'major_unlocated_rule_boundary')

  const tianfu = readJson('artifacts/ziwei-tianfu-convention-provenance-v0/complete.json')
  const rotation06 = tianfu.comparison.relationResults.find(item => item.candidateId === 'rotation-06')
  const identity = tianfu.comparison.relationResults.find(item => item.candidateId === 'identity')
  requireValue(tianfu.comparison.domain.rowCount === 150, 'tianfu_domain_boundary')
  requireValue(rotation06?.matchCount === 150 && rotation06?.mismatchCount === 0, 'tianfu_rotation06_boundary')
  requireValue(identity?.matchCount === 0 && identity?.mismatchCount === 150, 'tianfu_identity_boundary')
  requireValue(tianfu.comparison.classification.semanticEquivalence === 'blocked_semantic_identity_insufficient', 'tianfu_semantic_boundary')
  requireValue(tianfu.readinessImpact?.stableClaimCount === 0 && tianfu.readinessImpact?.readiness === 'not_safe_to_start' && tianfu.readinessImpact?.grounding === 'blocked', 'tianfu_promotion_boundary')

  const fixtures = readJson('artifacts/ziwei-fixture-reconciliation-v1/complete.json')
  requireValue(fixtures.beforeAfter.after.externalFixtureCount === 6, 'fixture_count_boundary')
  requireValue(fixtures.beforeAfter.after.independentlyVerified === 0 && fixtures.beforeAfter.after.pending === 6, 'fixture_independence_boundary')
  requireValue(fixtures.internalFixtureBoundary.promotedToExternal === false, 'internal_fixture_promotion_boundary')
  requireValue(fixtures.claimBoundaryImpact.stableClaimBoundary === 0, 'fixture_claim_boundary')

  return {
    fourTransformations: {
      sourceArtifact: 'artifacts/ziwei-four-transformations-source-evidence-v0/complete.json',
      comparisonArtifact: 'artifacts/ziwei-four-transformations-source-evidence-v0/comparison.json',
      nanbei: { ...fourNanbei, locator: 'Nanbei PDF p17 / printed folio 四十二 / 四化速檢表', directVisualObservation: true },
      ming: { ...fourMing, locator: 'Nanyang PDF p151 title + p152 甲 example; full-scan negative locator for 乙–癸', directVisualObservation: true },
      exactNormalizedMatchCount: fourComparison.summary.exactNormalizedMatchCount,
      exactRawMatchCount: fourComparison.summary.exactRawMatchCount,
      mismatchCount: fourComparison.summary.mismatchCount,
      sourceCellsPreserved: fourValidation.sourceCoverage.allSourceCellsPreserved,
      localVerdict: 'nanbei_complete_direct_table_ming_partial_source_rule_not_located',
      semanticAuthority: 'not_established',
    },
    lifeBodyRulers: {
      sourceArtifact: 'artifacts/ziwei-life-body-palace-ruler-source-evidence-v0/complete.json',
      comparisonArtifact: 'artifacts/ziwei-life-body-palace-ruler-source-evidence-v0/comparison.json',
      lifeBody: { inputCount: lifeBody.inputCount, matchCount: lifeBody.matchCount, mismatchCount: lifeBody.mismatchCount },
      rulerSourceRowsPerEdition: { nanyangtang: lifeRulers.editions.nanyangtang.inputCount, nanbei: lifeRulers.editions.nanbei.inputCount },
      sourceEditionRulers: {
        mingZhuCanonicalMatches: sourceRulerSummary.mingZhuCanonicalMatches,
        shenZhuCanonicalComparable: sourceRulerSummary.shenZhuCanonicalComparable,
        shenZhuCanonicalBlocked: sourceRulerSummary.shenZhuCanonicalBlocked,
        blockedSurfaceClasses: sourceRulerSummary.blockedSurfaceClasses,
      },
      productionRulerComparison: { inputCount: lifeRulers.production.inputCount, comparableCount: lifeRulers.production.comparableCount },
      locators: ['Nanbei PDF p23 / printed folio 五十五', 'Nanbei PDF p24 / printed folio 五十六', 'Nanyang PDF p145, p159, p160'],
      localVerdict: 'life_body_exact;_shen_zhu_24_rows_blocked;_production_ruler_fields_absent',
      semanticAuthority: 'not_established',
    },
    auxiliaryStars: {
      sourceArtifact: 'artifacts/ziwei-auxiliary-star-placement-core-evidence-v0/complete.json',
      comparisonArtifact: 'artifacts/ziwei-auxiliary-star-placement-core-evidence-v0/comparison.json',
      targetStarCount: auxiliary.targetStars.length,
      sourceOccurrences: auxiliary.occurrenceSummary.source,
      sourceOccurrencesByEdition: auxiliary.occurrenceSummary.sourceByEdition,
      comparableCount: auxiliary.comparisonSummary.comparableCount,
      exactMatchCount: auxiliary.comparisonSummary.exactMatchCount,
      notComparableCount: auxiliary.comparisonSummary.notComparableCount,
      localVerdict: auxiliary.verdict,
      semanticAuthority: 'not_established',
    },
    majorStars: {
      sourceArtifact: 'artifacts/ziwei-twelve-major-star-placement-evidence-v0/complete.json',
      directVisualConfirmation: major.source.coverage.directVisualConfirmation,
      coreRuleLocatorCount: major.source.coverage.coreRuleLocators,
      bySeries: majorSeries,
      unlocatedGeneralRule: major.source.coverage.unlocatedGeneralRule,
      localVerdict: 'bounded_14_star_source_surfaces_without_row_level_semantic_authority',
      semanticAuthority: 'not_established',
    },
    tianfu: {
      sourceArtifact: 'artifacts/ziwei-tianfu-convention-provenance-v0/complete.json',
      testedRows: tianfu.comparison.domain.rowCount,
      identityMatchCount: identity.matchCount,
      rotation06MatchCount: rotation06.matchCount,
      rotation06RawIdentity: 'not_raw_identity; representation_relation_only',
      semanticEquivalence: tianfu.comparison.classification.semanticEquivalence,
      localVerdict: 'formula_and_representation_reconciled_without_semantic_adjudication',
      semanticAuthority: 'not_established',
    },
    externalOracle: {
      sourceArtifact: 'artifacts/ziwei-fixture-reconciliation-v1/complete.json',
      fixtureCount: fixtures.beforeAfter.after.externalFixtureCount,
      independentlyVerified: fixtures.beforeAfter.after.independentlyVerified,
      pending: fixtures.beforeAfter.after.pending,
      primaryClassifications: fixtures.beforeAfter.after.primaryClassifications,
      internalFixturesPromoted: fixtures.internalFixtureBoundary.promotedToExternal,
      localVerdict: 'no_independent_external_oracle_admitted',
    },
    sourcePaths: sources,
  }
}

const observations = Object.freeze([
  {
    observationId: 'obs-local-major-star-rule-surfaces',
    sourceIds: ['src-nanbei-pdf', 'src-nanyangtang-pdf'],
    sourceArtifact: 'artifacts/ziwei-twelve-major-star-placement-evidence-v0/complete.json',
    locator: 'Nanbei p11–p13; Nanyang p148 and p172',
    observationMode: 'existing_hash_verified_pdf_direct_visual_review_reconciled_in_successor',
    detail: 'The local corpus has directly reviewed Ziwei/Tianfu series surfaces and an example diagram for the 14-major-star domain; the general rule identity and complete semantic coordinate authority remain unresolved.',
    evidenceScope: 'bounded_rule_surface_not_complete_row_level_source_authority',
    claimIds: MAJOR_CLAIMS,
    blockerIds: ['blocker-source-identity-unresolved', 'blocker-direct-rule-absent'],
  },
  {
    observationId: 'obs-local-tianfu-rule-surfaces',
    sourceIds: ['src-nanbei-pdf', 'src-nanyangtang-pdf'],
    sourceArtifact: 'artifacts/ziwei-tianfu-convention-provenance-v0/complete.json',
    locator: 'Nanbei p13 / printed folio 三十四; Nanyang p148 and p172',
    observationMode: 'existing_hash_verified_pdf_direct_visual_review_reconciled_in_successor',
    detail: 'The source root table, series surfaces, and example diagram support a deterministic formula/representation comparison. Identity is 0/150 while rotation-06 is 150/150, so the relation remains representation-only.',
    evidenceScope: 'formula_and_diagram_surface_not_semantic_palace_identity',
    claimIds: ['claim-tianfu-anchor-direction', 'claim-tianfu-placement', 'claim-tianfu-rotation06-semantic'],
    blockerIds: ['blocker-tianfu-raw-formula-contradiction', 'blocker-tianfu-rotation06-semantic-authority', 'blocker-palace-semantic-identity'],
  },
  {
    observationId: 'obs-local-auxiliary-rule-surfaces',
    sourceIds: ['src-nanbei-pdf', 'src-nanyangtang-pdf'],
    sourceArtifact: 'artifacts/ziwei-auxiliary-star-placement-core-evidence-v0/complete.json',
    locator: 'Nanbei p14–p18; Nanyang p148–p152 and full-scan negative locator',
    observationMode: 'existing_hash_verified_pdf_direct_visual_review_reconciled_in_successor',
    detail: 'Thirteen auxiliary-star surfaces and selected tables are present; 136/136 comparable local rows match within the declared scope, while 684 rows remain non-comparable and source promotion is forbidden.',
    evidenceScope: 'bounded_auxiliary_surface_and_comparison_not_complete_independent_rule_witness',
    claimIds: ['claim-auxiliary-star-placement-six-lucky', 'claim-auxiliary-star-placement-core'],
    blockerIds: ['blocker-auxiliary-star-source-witness', 'blocker-source-identity-unresolved'],
  },
  {
    observationId: 'obs-local-four-transformations-nanbei-table',
    sourceIds: ['src-nanbei-pdf'],
    sourceArtifact: 'artifacts/ziwei-four-transformations-source-evidence-v0/complete.json',
    locator: 'Nanbei p17 / printed folio 四十二 / 四化速檢表',
    observationMode: 'current_actual_pdf_bytes_hash_verified_and_directly_rendered_visual_review',
    detail: 'The current Nanbei PDF page visibly contains the 年干 rows 甲–癸 and the four columns 化祿、化權、化科、化忌. The 40 source cells are preserved and all 40 compare exactly to the production table within the declared coordinate boundary.',
    evidenceScope: 'complete_single_local_edition_table_surface_not_source_authority',
    claimIds: FOUR_TRANSFORM_CLAIMS,
    blockerIds: ['blocker-four-transform-source-witness', 'blocker-source-identity-unresolved'],
  },
  {
    observationId: 'obs-local-four-transformations-ming-partial',
    sourceIds: ['src-nanyangtang-pdf'],
    sourceArtifact: 'artifacts/ziwei-four-transformations-source-evidence-v0/complete.json',
    locator: 'Nanyang p151 title; p152 directly readable 甲 example; full-scan negative locator for 乙–癸',
    observationMode: 'current_actual_pdf_bytes_hash_verified_and_directly_rendered_visual_review',
    detail: 'The Nanyang source directly closes the 甲 sentence only. Its other 36 cells remain explicit source_rule_not_located nulls; absence is not converted into a contradiction or inferred table.',
    evidenceScope: 'partial_same_record_candidate_surface_with_explicit_unlocated_cells',
    claimIds: FOUR_TRANSFORM_CLAIMS,
    blockerIds: ['blocker-four-transform-source-witness', 'blocker-source-identity-unresolved'],
  },
  {
    observationId: 'obs-local-life-body-ruler-surfaces',
    sourceIds: ['src-nanbei-pdf', 'src-nanyangtang-pdf'],
    sourceArtifact: 'artifacts/ziwei-life-body-palace-ruler-source-evidence-v0/complete.json',
    locator: 'Nanbei p23–p24 / printed folios 五十五–五十六; Nanyang p145, p159–p160',
    observationMode: 'current_actual_pdf_bytes_hash_verified_and_directly_rendered_selected_page_review',
    detail: 'Life/body branch placement is 144/144 comparable. 命主 is 144/144 canonical-comparable, while 身主 is 120/144 canonical-comparable and 24 rows remain blocked by the 火鈴星 surface. Production has no ruler fields, so no contract or output is changed.',
    evidenceScope: 'bounded_life_body_and_ruler_surface_with_24_unresolved_rows',
    claimIds: ['claim-life-body-palace-ruler', 'claim-life-body-ruler-24-ambiguous-rows'],
    blockerIds: ['blocker-life-body-ruler-source-legibility', 'blocker-source-identity-unresolved'],
  },
])

function relation(observation, relationStatus, promotion, doesNotEstablish) {
  return {
    relationId: observation.observationId.replace(/^obs-/, 'relation-'),
    observationId: observation.observationId,
    sourceIds: observation.sourceIds,
    claimIds: observation.claimIds,
    blockerIds: observation.blockerIds,
    relationStatus,
    promotion,
    doesNotEstablish,
  }
}

const relations = Object.freeze([
  relation(observations[0], 'local_direct_rule_surface_reconciled_not_semantic_authority', 'not_admitted_to_stable_claim_or_readiness', ['complete_14_star_row_level_source_rule_identity', 'semantic_palace_coordinate_identity', 'independent_witness'] ),
  relation(observations[1], 'formula_and_representation_relation_reconciled_not_semantic_authority', 'rotation06_remains_representation_only', ['legacy_or_source_aligned_semantic_winner', 'palace_name_branch_slot_identity', 'source_authority'] ),
  relation(observations[2], 'auxiliary_surface_and_comparison_reconciled_not_complete_rule_witness', 'not_admitted_to_source_authority_or_production', ['complete_independent_auxiliary_rule_witness', 'semantic_authority', 'stable_claim'] ),
  relation(observations[3], 'complete_nanbei_10x4_local_table_surface_reconciled', 'local_bounded_evidence_only; blocker_remains', ['edition_authority', 'independent_external_oracle', 'production_promotion'] ),
  relation(observations[4], 'nanyang_10x4_partial_surface_and_unlocated_cells_preserved', 'unlocated_cells_not_inferred; blocker_remains', ['complete_ming_10x4_table', 'cross_edition_authority', 'source_rule_absence'] ),
  relation(observations[5], 'life_body_and_ruler_surface_reconciled_with_24_blocked_rows', 'not_admitted_to_ruler_output_or_readiness', ['24_row_legibility_closure', 'production_contract_change', 'semantic_authority'] ),
])

function acquisition(requirementId, witnessType, identity, locator, independence, resolvesClaimIds, note) {
  return { requirementId, witnessType, identity, locator, independence, resolvesClaimIds, note }
}

function buildBlockerAssessments(localEvidence) {
  return [
    {
      id: 'blocker-source-identity-unresolved',
      status: 'blocked',
      localResult: 'local_pdf_bytes_and_catalog/image_candidates_reconciled; exact edition_lineage_authority remains open',
      evidenceRefs: [PREDECESSOR_ARTIFACT, 'artifacts/ziwei-four-transformations-source-evidence-v0/complete.json', 'artifacts/ziwei-life-body-palace-ruler-source-evidence-v0/complete.json'],
      newObservationIds: observations.filter(item => item.blockerIds.includes('blocker-source-identity-unresolved')).map(item => item.observationId),
      nextAcquisition: acquisition(
        'acq-source-identity-original-scan',
        'institution-supplied or rights-cleared original scan/leaf set',
        'explicit edition/title/date or date range/volume/folio/colophon plus immutable retrieval bytes and SHA-256',
        'the exact leaf/page for each claim occurrence, not only catalog title or viewer route',
        'lineage must distinguish NARA same-record volumes, Nanyang derivative, Nanbei local PDF, and TOYO candidate; no same-record pair counts as independent',
        ['claim-palace-name-branch-ordinal', ...MAJOR_CLAIMS, ...FOUR_TRANSFORM_CLAIMS],
        'Source identity is a prerequisite for promotion but is not inferred from title, catalog metadata, OCR, or numeric agreement.',
      ),
    },
    {
      id: 'blocker-palace-semantic-identity',
      status: 'blocked',
      localResult: 'partial diagrams, traversal prose, NARA charts, and TOYO pages reviewed; no complete 12-way semantic binding',
      evidenceRefs: [PREDECESSOR_ARTIFACT, 'artifacts/ziwei-tianfu-convention-provenance-v0/complete.json'],
      newObservationIds: ['obs-local-tianfu-rule-surfaces'],
      nextAcquisition: acquisition(
        'acq-complete-palace-semantic-map',
        'readable source diagram or adjacent rule/table leaf',
        'source-identified edition/folio and actual image bytes with all 12 palace names and branch glyphs',
        'one context that binds palace name, branch, physical slot, ordinal, base direction, and production coordinate enum',
        'prefer a distinct physical witness or an institution-confirmed same-witness lineage; do not merge NARA volume pair or derivative',
        ['claim-palace-name-branch-ordinal', 'claim-ming-shen-coordinate-frame', 'claim-12-palace-diagram-semantics', 'claim-tianfu-rotation06-semantic'],
        'A chart example or branch ring alone is insufficient.',
      ),
    },
    {
      id: 'blocker-direct-rule-absent',
      status: 'blocked',
      localResult: '14-star source surfaces and deterministic comparisons consumed; complete row-level source rule identity remains open',
      evidenceRefs: ['artifacts/ziwei-twelve-major-star-placement-evidence-v0/complete.json', 'artifacts/ziwei-major-star-source-corpus-provenance-v0/complete.json'],
      newObservationIds: ['obs-local-major-star-rule-surfaces'],
      nextAcquisition: acquisition(
        'acq-complete-14-star-placement-rules',
        'source-identified 14-major-star rule witness',
        'edition/date/volume/folio and immutable page bytes for every rule surface',
        'complete input-bound placement rules for 紫微系 and 天府系, including the coordinate frame and all 14 stars',
        'independent witness or explicitly documented transmission relation; source evaluator remains separate from production resolver',
        MAJOR_CLAIMS,
        'Relative verse agreement and numeric exactness do not replace source authority.',
      ),
    },
    {
      id: 'blocker-tianfu-raw-formula-contradiction',
      status: 'blocked',
      localResult: 'Nanbei root table, Nanyang series/diagram surfaces, legacy and source_aligned modes all preserved; no convention adjudicated',
      evidenceRefs: ['artifacts/ziwei-tianfu-convention-provenance-v0/complete.json', 'artifacts/ziwei-tianfu-representation-search-v1/complete.json'],
      newObservationIds: ['obs-local-tianfu-rule-surfaces'],
      nextAcquisition: acquisition(
        'acq-tianfu-anchor-direction-adjudicator',
        'independent edition with readable 安天府 anchor/direction rule',
        'edition/folio/colophon plus direct page bytes and unambiguous branch-token meaning',
        'at least one anchor and enough rows/examples to distinguish mod(4 - Z) from legacy mod(10 - Z)',
        'not a same-record NARA volume or local derivative unless its lineage is explicitly proven and the transmission question is the target',
        ['claim-tianfu-anchor-direction', 'claim-tianfu-placement', 'claim-major-star-placement-tianfu'],
        'The Nanbei table is a bounded source surface; it does not by itself select the production convention.',
      ),
    },
    {
      id: 'blocker-tianfu-rotation06-semantic-authority',
      status: 'blocked',
      localResult: 'identity 0/150 and rotation-06 150/150 are retained as separate numeric relations; semantic equivalence is blocked',
      evidenceRefs: ['artifacts/ziwei-tianfu-convention-provenance-v0/complete.json', PREDECESSOR_ARTIFACT],
      newObservationIds: ['obs-local-tianfu-rule-surfaces'],
      nextAcquisition: acquisition(
        'acq-tianfu-semantic-coordinate-witness',
        'source page that explicitly names the coordinate frame and Tianfu placement',
        'same identity requirements as the Tianfu adjudicator plus readable palace/branch/slot relation',
        'diagram/table/text that says what the branch tokens denote, not only a mathematically equivalent output',
        'independent physical witness or a documented same-witness transmission chain; numeric fit is never independence',
        ['claim-tianfu-rotation06-semantic', 'claim-12-palace-diagram-semantics'],
        'rotation-06 remains representation_only in the successor boundary.',
      ),
    },
    {
      id: 'blocker-auxiliary-star-source-witness',
      status: 'blocked',
      localResult: '13 auxiliary surfaces, 136/136 comparable matches, and 684 non-comparable rows reconciled; full independent rule witness absent',
      evidenceRefs: ['artifacts/ziwei-auxiliary-star-placement-core-evidence-v0/complete.json', 'artifacts/ziwei-auxiliary-star-placement-core-evidence-v0/comparison.json'],
      newObservationIds: ['obs-local-auxiliary-rule-surfaces'],
      nextAcquisition: acquisition(
        'acq-complete-auxiliary-star-rules',
        'source-identified auxiliary-star rule tables',
        'edition/folio/page identity and actual bytes for every production auxiliary rule surface, including alias variants',
        'complete input-bound rules for the six lucky stars and all auxiliary stars used by the target contract',
        'independent from production resolver and not a same-record duplicate; preserve ambiguous glyphs such as 天空/地空 and 火鈴',
        ['claim-auxiliary-star-placement-six-lucky', 'claim-auxiliary-star-placement-core', 'claim-life-body-ruler-24-ambiguous-rows'],
        'Numeric exactness and normalized aliases remain bounded comparisons only.',
      ),
    },
    {
      id: 'blocker-four-transform-source-witness',
      status: 'blocked',
      localResult: `new_local_frontier_consumed: Nanbei ${localEvidence.fourTransformations.nanbei.comparableCount}/40 direct cells; Nanyang ${localEvidence.fourTransformations.ming.comparableCount}/40 direct cells and 36 explicit unlocated cells`,
      evidenceRefs: ['artifacts/ziwei-four-transformations-source-evidence-v0/complete.json', 'artifacts/ziwei-four-transformations-source-evidence-v0/comparison.json'],
      newObservationIds: ['obs-local-four-transformations-nanbei-table', 'obs-local-four-transformations-ming-partial'],
      nextAcquisition: acquisition(
        'acq-independent-complete-four-transform-table',
        'independently identified or rights-cleared complete 四化 table',
        'edition/date/volume/folio, actual page bytes, exact 甲乙丙丁戊己庚辛壬癸 × 化祿化權化科化忌 cells and column order',
        'complete 10×4 table or a source context that closes every cell without inferred production fill',
        'not merely Nanyang/NARA same-record derivative; provide lineage and independence assessment against Nanbei and current engine',
        FOUR_TRANSFORM_CLAIMS,
        'The Nanbei 40/40 table is a real bounded local advance, but source authority and independent corroboration remain open.',
      ),
    },
    {
      id: 'blocker-life-body-ruler-source-legibility',
      status: 'blocked',
      localResult: `life/body ${localEvidence.lifeBodyRulers.lifeBody.matchCount}/144 exact; 命主 ${localEvidence.lifeBodyRulers.sourceEditionRulers.mingZhuCanonicalMatches}/144; 身主 ${localEvidence.lifeBodyRulers.sourceEditionRulers.shenZhuCanonicalComparable}/144 comparable with ${localEvidence.lifeBodyRulers.sourceEditionRulers.shenZhuCanonicalBlocked} blocked`,
      evidenceRefs: ['artifacts/ziwei-life-body-palace-ruler-source-evidence-v0/complete.json', 'artifacts/ziwei-life-body-palace-ruler-source-evidence-v0/comparison.json'],
      newObservationIds: ['obs-local-life-body-ruler-surfaces'],
      nextAcquisition: acquisition(
        'acq-shen-zhu-compound-surface',
        'higher-resolution or independently identified 身主 table witness',
        'edition/folio/page and actual bytes that resolve the Nanyang 火鈴星 compound surface for the 24 rows',
        'the complete 24-row boundary and the source input relation used to derive 身主',
        'retain both editions as separate witnesses; do not silently reduce 火鈴星 to 火星 or invent production ruler fields',
        ['claim-life-body-palace-ruler', 'claim-life-body-ruler-24-ambiguous-rows'],
        'A future production output field would require a separate explicit contract change and is outside this research unit.',
      ),
    },
    {
      id: 'blocker-independent-external-oracle',
      status: 'blocked',
      localResult: `six declared fixtures remain pending; independently verified ${localEvidence.externalOracle.independentlyVerified}; internal fixtures remain regression_only`,
      evidenceRefs: ['artifacts/ziwei-fixture-reconciliation-v1/complete.json', PREDECESSOR_ARTIFACT],
      newObservationIds: [],
      nextAcquisition: acquisition(
        'acq-independent-ziwei-oracle',
        'independent executable oracle or reproducible published calculation',
        'implementation/version, source/ruleset identity, exact settings, retrieval bytes or stable output hash, and runner provenance',
        'same input cohort with field-level output and configuration identity sufficient to separate rule variant from mismatch',
        'must not import production engine, fixtures, or same source data; independent evaluator and source lineage required',
        ['claim-ziwei-input-calendar-time', ...MAJOR_CLAIMS, ...FOUR_TRANSFORM_CLAIMS],
        'Observed matches are not independently verified until the source and runner are reproducible.',
      ),
    },
    {
      id: 'blocker-calendar-time-source-identity',
      status: 'blocked',
      localResult: 'Ziwei input contract and local calculations are available, but no exact calendar/time source identity closes leap-month, timezone, solar-time, or 子時 boundary',
      evidenceRefs: ['artifacts/ziwei-fixture-reconciliation-v1/complete.json', PREDECESSOR_ARTIFACT],
      newObservationIds: [],
      nextAcquisition: acquisition(
        'acq-calendar-time-input-source',
        'authoritative calendar/time table or reproducible calendar service',
        'edition/version, exact retrieval bytes or immutable release, timezone/locale, leap-month and day/hour boundary rules',
        'Gregorian-to-lunar date, leap status, lunar month/day, and 子時/hour-branch conversion for the exact input cohort',
        'independent of the Ziwei production resolver; any same-service corroboration must disclose shared dependencies',
        ['claim-ziwei-input-calendar-time'],
        'A Saju calendar artifact or local conversion fact is not automatically a Ziwei source oracle.',
      ),
    },
    {
      id: 'blocker-image-reuse-rights',
      status: 'needs_human_review',
      localResult: 'public viewer/catalog access and read-only local PDF/JPEG review recorded; image-level repository reuse permission remains absent',
      evidenceRefs: [PREDECESSOR_ARTIFACT, 'artifacts/ziwei-four-transformations-source-evidence-v0/complete.json'],
      newObservationIds: [],
      nextAcquisition: acquisition(
        'acq-image-level-reuse-permission',
        'institutional permission or explicit image-level reuse license',
        'written terms covering repository redistribution, derivative crops/renders, and research artifact retention',
        'NARA/Toyo/AKS item-level image terms or a rights-cleared scan supplied by the holder',
        'license is a separate judgment from public accessibility, catalog CC0, source authority, and witness independence',
        ['claim-palace-name-branch-ordinal', 'claim-12-palace-diagram-semantics', ...MAJOR_CLAIMS],
        'Until permission is supplied, source images stay outside Git and materializers remain read-only.',
      ),
    },
  ]
}

function buildArtifact(root = ROOT, options = {}) {
  const sourcePaths = options.sourcePaths ?? {}
  const sources = Object.fromEntries(SOURCE_SPECS.map(spec => [spec.key, readExternalSource(spec, sourcePaths)]))
  const predecessor = readJson(PREDECESSOR_ARTIFACT)
  const predecessorSummary = validatePredecessor(predecessor)
  const localEvidence = buildLocalEvidence(sources)
  const blockerAssessments = buildBlockerAssessments(localEvidence)
  requireValue(blockerAssessments.length === ALL_BLOCKER_IDS.length, 'blocker_assessment_count')
  requireValue(blockerAssessments.every(item => ALL_BLOCKER_IDS.includes(item.id)), 'blocker_assessment_id')

  const newCounts = {
    claimCount: predecessorSummary.coverage.claimCount,
    sourceCount: predecessorSummary.coverage.sourceCount,
    observationCount: predecessorSummary.coverage.observationCount + observations.length,
    relationCount: predecessorSummary.coverage.relationCount + relations.length,
    blockerCount: ALL_BLOCKER_IDS.length,
  }
  requireValue(newCounts.claimCount === 30 && newCounts.sourceCount === 13 && newCounts.observationCount === 40 && newCounts.relationCount === 130 && newCounts.blockerCount === 11, 'successor_count_boundary')

  const protectedPaths = [PREDECESSOR_ARTIFACT, TOYO_ARTIFACT, '-.jpg']
  const protectedState = protectedPaths.map(path => ({ path, byteSha256: fileByteSha256(path), exists: true }))
  const observedHead = git(['rev-parse', 'HEAD'])
  const originMainHead = git(['rev-parse', 'origin/main'])
  const artifactBase = {
    schemaVersion: SCHEMA,
    verdictToken: VERDICT,
    basisHead: BASIS_HEAD,
    observedHead,
    originMainHead,
    branch: git(['branch', '--show-current']),
    scope: 'successor_reconciliation_of_all_11_ziwei_p0_blockers_after_toyo_1646_boundary',
    predecessor: predecessorSummary,
    frontierConclusion: {
      predecessorGlobalExhaustion: false,
      predecessorGlobalExhaustionReason: 'TOYO_1646 reached a physical-candidate evidence boundary, but existing hash-verified Nanbei/Nanyang rule artifacts were not yet consumed into the P0 graph.',
      successorLocalFrontier: 'exhausted_after_reconciling_existing_repository_artifacts_and_explicitly_configured_local_original_pdfs',
      remainingBoundary: 'external_identity_lineage_authority_independence_oracle_calendar_and_rights_evidence_required',
      noUnsupportedPromotion: true,
    },
    frontierTransitions: [
      { from: 'TOYO_1646_physical_candidate_surface', to: 'Nanbei_Nanyang_local_rule_evidence', reason: 'TOYO did not close source identity, so the highest-fanout existing local rule surfaces were rechecked.' },
      { from: 'Nanbei_Nanyang_local_rule_evidence', to: 'complete_Nanbei_four_transform_table', reason: 'the 10x4 table was complete and directly locatable at Nanbei p17; it was the strongest unconsumed local frontier.' },
      { from: 'complete_Nanbei_four_transform_table', to: 'life_body_ruler_legibility', reason: 'the next bounded source surface had exhaustive branch rows but an explicit 24-row legibility boundary.' },
      { from: 'life_body_ruler_legibility', to: 'major_auxiliary_tianfu_reconciliation', reason: 'existing rule artifacts were consumed to test whether any source-surface comparison could close a remaining blocker.' },
      { from: 'major_auxiliary_tianfu_reconciliation', to: 'oracle_calendar_rights_external_boundary', reason: 'all locally available candidates remained non-authoritative, non-independent, incomplete, or rights-unresolved.' },
    ],
    researchUnits: [
      { unitId: 'unit-four-transformations-local-table-reconciliation', frontier: 'four_transformations', result: 'bounded_local_frontier_advanced', observationIds: ['obs-local-four-transformations-nanbei-table', 'obs-local-four-transformations-ming-partial'], blockerIds: ['blocker-four-transform-source-witness', 'blocker-source-identity-unresolved'] },
      { unitId: 'unit-life-body-ruler-legibility-reconciliation', frontier: 'life_body_rulers', result: 'bounded_local_frontier_advanced_with_24_rows_blocked', observationIds: ['obs-local-life-body-ruler-surfaces'], blockerIds: ['blocker-life-body-ruler-source-legibility', 'blocker-source-identity-unresolved'] },
      { unitId: 'unit-major-star-source-surface-consumption', frontier: 'major_star_placement', result: 'existing_local_evidence_reconciled_no_authority', observationIds: ['obs-local-major-star-rule-surfaces'], blockerIds: ['blocker-direct-rule-absent', 'blocker-source-identity-unresolved'] },
      { unitId: 'unit-tianfu-representation-authority-reconciliation', frontier: 'tianfu_convention', result: 'numeric_relation_preserved_semantic_authority_blocked', observationIds: ['obs-local-tianfu-rule-surfaces'], blockerIds: ['blocker-tianfu-raw-formula-contradiction', 'blocker-tianfu-rotation06-semantic-authority', 'blocker-palace-semantic-identity'] },
      { unitId: 'unit-auxiliary-source-surface-consumption', frontier: 'auxiliary_stars', result: 'bounded_comparison_reconciled_full_witness_absent', observationIds: ['obs-local-auxiliary-rule-surfaces'], blockerIds: ['blocker-auxiliary-star-source-witness', 'blocker-source-identity-unresolved'] },
      { unitId: 'unit-palace-source_identity_and_semantic_carry_forward', frontier: 'palace_semantics', result: 'existing_partial_diagrams_carry_forward_external_map_required', observationIds: [], blockerIds: ['blocker-palace-semantic-identity', 'blocker-source-identity-unresolved'] },
      { unitId: 'unit-oracle-calendar-rights-boundary-audit', frontier: 'oracle_calendar_and_rights', result: 'external_evidence_boundary_reached', observationIds: [], blockerIds: ['blocker-independent-external-oracle', 'blocker-calendar-time-source-identity', 'blocker-image-reuse-rights'] },
    ],
    sourceIdentity: {
      sources: Object.values(sources),
      newSourceCount: 0,
      reusedSourceIds: ['src-nanbei-pdf', 'src-nanyangtang-pdf', 'src-nara-4468520', 'src-nara-4469314', 'src-toyo-1646', 'src-ctext'],
      independentWitnessesAdmitted: 0,
      sourceAuthorityPromoted: false,
      sameRecordAndDerivativeSeparationPreserved: true,
      actualBytesReadDirectly: true,
      sourceImagesOrPdfsStoredInGit: false,
    },
    evidenceInputs: {
      referencedArtifacts: INPUT_ARTIFACTS.filter(path => path !== '-.jpg').map(path => ({ path, byteSha256: fileByteSha256(path) })),
      protectedBytes: protectedState,
      sourceBytes: 'external_actual_bytes_hash_checked_from_explicit_environment_paths; not copied into repository',
    },
    localEvidence,
    observations,
    relations,
    blockerAssessments,
    claimImpact: {
      predecessorClaimCount: predecessorSummary.coverage.claimCount,
      successorClaimCount: newCounts.claimCount,
      claimsAdded: 0,
      claimsPromoted: 0,
      stableClaimCount: 0,
      semanticAuthorityCount: 0,
      claimStatusChanges: [],
      claimBoundary: 'direct_observation_bounded_and_representation_only_statuses remain; no stable or interpretation-eligible claim is created',
    },
    graphImpact: {
      predecessor: predecessorSummary.coverage,
      additive: { claimCount: 0, sourceCount: 0, observationCount: observations.length, relationCount: relations.length, blockerCount: 0 },
      successor: newCounts,
      addedObservationIds: observations.map(item => item.observationId),
      addedRelationIds: relations.map(item => item.relationId),
      blockersClosed: [],
      blockersStillBlocked: ALL_BLOCKER_IDS,
    },
    readinessImpact: {
      readiness: 'not_safe_to_start',
      grounding: 'blocked',
      activation: 'experimental_only',
      rotation06: 'representation_only',
      productionModified: false,
      publicContractModified: false,
      readinessModified: false,
      interpretationGenerated: false,
    },
    preservation: {
      predecessorArtifactChanged: false,
      historicalPredecessorBytesRewritten: false,
      protectedUntrackedDashJpgPreserved: true,
      sourceImagesStoredInGit: false,
      sourcePdfsStoredInGit: false,
      externalAcquisitionPerformed: false,
      networkUsedDuringMaterialization: false,
      productionChanged: false,
      remoteDatabaseChanged: false,
      commitPerformed: false,
      pushPerformed: false,
      deploymentPerformed: false,
    },
    deterministicContract: {
      generatedAt: 'forbidden',
      requiredSourceConfiguration: [NANBEI_ENV, NANYANGTANG_ENV],
      noImplicitSourceSearch: true,
      sourceHashes: 'actual external PDF bytes SHA-256; mismatch and missing path fail closed',
      artifactInputs: 'actual repository bytes SHA-256; predecessor and protected bytes are not rewritten',
      ordering: 'fixed blocker order, research-unit order, observation order, relation order, and canonical lexicographic object keys',
      visualReviewBoundary: 'OCR/transcription is locator-only; direct page review and deterministic comparison remain separate',
      timestamps: 'forbidden',
      network: 'forbidden',
    },
    negativeContract: {
      rejects: [
        'source_pdf_hash_mutation',
        'source_authority_promotion',
        'independent_witness_admission',
        'four_transform_blocker_closure',
        'life_body_24_row_elision',
        'rotation06_semantic_promotion',
        'claim_or_source_count_fabrication',
        'predecessor_boundary_damage',
        'readiness_grounding_activation_promotion',
        'source_pdf_or_image_git_storage',
        'protected_dash_jpg_removal',
        'generated_timestamp',
      ],
    },
    materializer: MATERIALIZER_PATH,
    checker: `scripts/check-${SCHEMA}.mjs`,
    negativeChecker: `scripts/check-${SCHEMA}-negative-v0.mjs`,
  }
  return attachArtifactIdentity(artifactBase, buildArtifactIdentity({
    root,
    artifactId: SCHEMA,
    materializerPath: MATERIALIZER_PATH,
    materializerVersion: MATERIALIZER_VERSION,
    baseHead: BASIS_HEAD,
    inputs: [MATERIALIZER_PATH, 'src/artifactIdentity.js', ...INPUT_ARTIFACTS],
  }))
}

export function buildBundle(root = ROOT, options = {}) {
  return buildArtifact(root, options)
}

export async function materializeBundle(target = resolve(ROOT, ARTIFACT_PATH), options = {}) {
  const artifact = buildArtifact(ROOT, options)
  const body = Buffer.from(canonicalJson(artifact))
  await mkdir(dirname(target), { recursive: true })
  await writeFile(target, body)
  const sidecar = {
    schemaVersion: `${SCHEMA}-integrity-v0`,
    path: relative(ROOT, target),
    byteSha256: sha256(body),
    byteScope: 'UTF-8 JSON bytes including final LF',
  }
  await writeFile(`${target}.integrity.json`, canonicalJson(sidecar))
  return { artifact, target, byteSha256: sidecar.byteSha256 }
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  const target = resolve(process.argv[2] || ARTIFACT_PATH)
  const result = await materializeBundle(target)
  console.log(JSON.stringify({
    target: result.target,
    schema: SCHEMA,
    verdict: VERDICT,
    basisHead: BASIS_HEAD,
    observedHead: result.artifact.observedHead,
    counts: result.artifact.graphImpact.successor,
    byteSha256: result.byteSha256,
  }, null, 2))
}

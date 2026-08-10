import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { readFileSync } from 'node:fs'
import { dirname, relative, resolve } from 'node:path'

import { attachArtifactIdentity, buildArtifactIdentity } from '../src/artifactIdentity.js'

export const SCHEMA = 'ziwei-p0-toyo-1646-extended-observation-v0'
export const VERDICT = 'complete_ziwei_p0_toyo_1646_extended_observation_bounded_unresolved'
export const EXPECTED_HEAD = '2d5eb3bb7cde79bcb6a671969280987ffe536965'
export const MATERIALIZER_VERSION = '1.0.0'
export const MATERIALIZER_PATH = 'scripts/materialize-ziwei-p0-toyo-1646-extended-observation-v0.mjs'
export const ARTIFACT_DIR = `artifacts/${SCHEMA}`
export const CACHE_ENV = 'TOYO_1646_CACHE_DIR'
export const PREDECESSOR_ARTIFACT = 'artifacts/ziwei-p0-claim-source-identity-frontier-v1/complete.json'
export const PREDECESSOR_LINEAGE_ARTIFACT = 'artifacts/ziwei-p0-claim-source-identity-frontier-v1/source-lineage-inventory.json'

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const sortValue = value => Array.isArray(value)
  ? value.map(sortValue)
  : value && typeof value === 'object'
    ? Object.fromEntries(Object.keys(value).sort().map(key => [key, sortValue(value[key])]))
    : value
export const canonicalJson = value => `${JSON.stringify(sortValue(value), null, 2)}\n`

const image = (leaf, expectedSha256, surface, detail, claimIds, blockerIds) => ({
  leaf,
  fileName: `ziwei-toyo-1646-${leaf}.jpg`,
  expectedSha256,
  surface,
  detail,
  claimIds,
  blockerIds,
})

const IMAGE_SPECS = [
  image('0002', 'bfd73c7fbf7d23e7551dfff62d8195b4cb5c7a46350344a163ddcb53dae4950d', 'opening/blank spread', 'The physical spread and holding marks are visible, but no readable rule, table, colophon, or semantic coordinate legend is present on this leaf.', ['claim-source-identity-frontier'], ['blocker-source-identity-unresolved', 'blocker-palace-semantic-identity']),
  image('0009', '662a05d52293266d081697301185ed4f2d306e415f930ce5352a522b73e81d96', 'named-star and branch/year prose', 'Named stars, branch/year tokens, and dense rule/example prose are directly visible; the page does not state a complete edition identity or a 12-palace coordinate binding.', ['claim-major-star-placement-ziwei', 'claim-major-star-placement-tianfu'], ['blocker-source-identity-unresolved', 'blocker-direct-rule-absent', 'blocker-palace-semantic-identity']),
  image('0010', 'e6868cfacfb4f35eb5d747fede10c1b15f8738fb51a78804bf8930f9bb7cb2de', 'star-to-branch/year table surface', 'Multiple star headings, branch/year sequences, and 流年 annotations are visually present; this is a bounded star/table surface, not a complete placement-rule witness or palace legend.', ['claim-major-star-placement-ziwei', 'claim-major-star-placement-tianfu', 'claim-life-body-palace-ruler'], ['blocker-source-identity-unresolved', 'blocker-direct-rule-absent', 'blocker-life-body-ruler-source-legibility']),
  image('0011', 'a773d0c75da7618e28dc41f64e177681b322e1444923f0e5d476dc0169dbfc21', 'named-star columns and 流年 notes', 'Named-star columns with branch/year sequences and 流年 notes are directly observable; no source-identified general rule covering the production contract is visible.', ['claim-major-star-placement-ziwei', 'claim-auxiliary-star-placement-core'], ['blocker-source-identity-unresolved', 'blocker-direct-rule-absent', 'blocker-auxiliary-star-source-witness']),
  image('0012', '1c37cddd5d20f42291f1b3c803db0acdfeadd1c3688b5fd368a64ffc5827c442', 'palace/branch and star prose', 'Palace/branch-labelled prose, branch sequences, and star or rule examples are visible; the leaf does not bind all twelve palace names to physical slots, ordinal, and traversal direction.', ['claim-palace-name-branch-ordinal', 'claim-12-palace-diagram-semantics', 'claim-major-star-placement-tianfu'], ['blocker-source-identity-unresolved', 'blocker-palace-semantic-identity', 'blocker-direct-rule-absent', 'blocker-tianfu-raw-formula-contradiction']),
  image('0013', 'f4bb070b72ea34751ff725d57215113da2a28a208c4bd8af2d29d78629a4344e', 'dense named-star and rule prose', 'Named stars, branch/year references, and rule or interpretive prose are directly visible; no complete 10-stem × 4 transformation table or semantic coordinate frame is established.', ['claim-four-transformations-10x4', 'claim-auxiliary-star-placement-core', 'claim-life-body-ruler-24-ambiguous-rows'], ['blocker-source-identity-unresolved', 'blocker-four-transform-source-witness', 'blocker-auxiliary-star-source-witness', 'blocker-life-body-ruler-source-legibility']),
  image('0019', 'fff3ef3b969c7123799ce2c5bcdf2603910a89af12e6ef337fff1f3bbffd6b97', '形性賦 interpretive star prose', 'The 形性賦 heading and star-character/appearance descriptions are directly visible; interpretive prose is not a placement rule, palace identity witness, or semantic authority decision.', ['claim-major-star-placement-ziwei', 'claim-auxiliary-star-placement-core'], ['blocker-source-identity-unresolved', 'blocker-direct-rule-absent', 'blocker-auxiliary-star-source-witness']),
  image('0020', 'f36911b907fbdc07943f2bd6fb2b175ca6a08b32d349684f62824535353ceb05', '星垣論 and star-property prose', 'The 星垣論 heading and star-property prose are directly visible; this page supplies textual surface only and does not close edition lineage, palace coordinates, or rule authority.', ['claim-major-star-placement-tianfu', 'claim-tianfu-anchor-direction', 'claim-palace-name-branch-ordinal'], ['blocker-source-identity-unresolved', 'blocker-tianfu-raw-formula-contradiction', 'blocker-tianfu-rotation06-semantic-authority', 'blocker-palace-semantic-identity']),
]

const ALL_BLOCKER_IDS = [
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
].sort()

const relation = (spec, observationId) => ({
  relationId: `relation-toyo-1646-extended-${spec.leaf}`,
  sourceId: 'src-toyo-1646',
  observationId,
  claimIds: spec.claimIds,
  blockerIds: spec.blockerIds,
  relationStatus: 'direct_observation_extends_physical_candidate_surface_not_semantic_authority',
  evidenceScope: 'actual_jpeg_bytes_visually_reviewed_with_leaf_locator_and_hash',
  independence: 'independent_physical_witness_candidate_not_admitted_as_independent_oracle',
  authority: 'institutional_collection_identity_plus_direct_observation_bounded; edition_lineage_and_semantic_authority_unresolved',
  promotion: 'not_admitted_to_stable_claim_source_authority_readiness_or_activation',
  doesNotEstablish: ['exact_edition_or_date', 'textual_lineage_to_NARA_or_local_PDF', 'complete_12_palace_semantic_mapping', 'independent_oracle', 'image_reuse_permission'],
})

function repository(root) {
  const git = args => execFileSync('git', ['-c', 'core.fsmonitor=false', ...args], { cwd: root, encoding: 'utf8' }).trim()
  return { branch: git(['branch', '--show-current']), currentHead: git(['rev-parse', 'HEAD']), originMainHead: git(['rev-parse', 'origin/main']) }
}

function readPredecessor(root) {
  const bytes = readFileSync(resolve(root, PREDECESSOR_ARTIFACT))
  const lineageBytes = readFileSync(resolve(root, PREDECESSOR_LINEAGE_ARTIFACT))
  const artifact = JSON.parse(bytes.toString('utf8'))
  const lineage = JSON.parse(lineageBytes.toString('utf8'))
  const toyo = lineage.sources?.find(item => item.sourceId === 'src-toyo-1646')
  if (artifact.schemaVersion !== 'ziwei-p0-claim-source-identity-frontier-v1') throw new Error('unexpected_predecessor_schema')
  if (artifact.coverage?.claimCount !== 30 || artifact.coverage?.sourceCount !== 13 || artifact.coverage?.observationCount !== 26 || artifact.coverage?.relationCount !== 116 || artifact.coverage?.blockerCount !== 11) throw new Error('unexpected_predecessor_coverage')
  if (artifact.claimBoundary?.stableClaimCount !== 0 || artifact.claimBoundary?.semanticAuthorityCount !== 0 || artifact.readinessImpact?.readiness !== 'not_safe_to_start' || artifact.readinessImpact?.grounding !== 'blocked') throw new Error('unexpected_predecessor_boundary')
  if (!toyo?.reviewedImageSha256 || Object.keys(toyo.reviewedImageSha256).length !== 15) throw new Error('unexpected_predecessor_toyo_image_inventory')
  return { path: PREDECESSOR_ARTIFACT, byteSha256: sha256(bytes), lineagePath: PREDECESSOR_LINEAGE_ARTIFACT, lineageByteSha256: sha256(lineageBytes), verdictToken: artifact.verdictToken, coverage: artifact.coverage, claimBoundary: artifact.claimBoundary, readinessImpact: artifact.readinessImpact, reviewedImageSha256: Object.fromEntries(Object.entries(toyo.reviewedImageSha256).sort(([a], [b]) => a.localeCompare(b))) }
}

function readExternalBytes(cacheDir, predecessor) {
  if (!cacheDir) throw new Error(`${CACHE_ENV}_REQUIRED`)
  const previous = Object.entries(predecessor.reviewedImageSha256).map(([leaf, predecessorRecordedSha256]) => ({ leaf, fileName: `ziwei-toyo-1646-${leaf}.jpg`, predecessorRecordedSha256, reviewOrigin: 'predecessor_visual_review_hash_rechecked' }))
  const added = IMAGE_SPECS.map(spec => ({ leaf: spec.leaf, fileName: spec.fileName, expectedSha256: spec.expectedSha256, predecessorRecordedSha256: null, reviewOrigin: 'new_visual_review_in_this_packet' }))
  return [...previous, ...added].sort((a, b) => a.leaf.localeCompare(b.leaf)).map(spec => {
    const path = resolve(cacheDir, spec.fileName)
    let bytes
    try { bytes = readFileSync(path) } catch { throw new Error(`TOYO_IMAGE_MISSING:${spec.fileName}`) }
    const actualSha256 = sha256(bytes)
    if (spec.reviewOrigin === 'new_visual_review_in_this_packet' && actualSha256 !== spec.expectedSha256) throw new Error(`TOYO_IMAGE_HASH_MISMATCH:${spec.fileName}`)
    const predecessorHashStatus = spec.reviewOrigin === 'predecessor_visual_review_hash_rechecked'
      ? (/^[0-9a-f]{64}$/.test(spec.predecessorRecordedSha256) && spec.predecessorRecordedSha256 === actualSha256 ? 'matches' : 'historical_record_mismatch_preserved')
      : 'new_expected_hash_match'
    return { leaf: spec.leaf, fileName: spec.fileName, reviewOrigin: spec.reviewOrigin, predecessorRecordedSha256: spec.predecessorRecordedSha256, predecessorHashStatus, byteLength: bytes.byteLength, byteSha256: actualSha256, cachePathIsNotStored: true }
  })
}

export function buildBundle(root = resolve(new URL('..', import.meta.url).pathname), { cacheDir = process.env[CACHE_ENV], repositoryOverride = {} } = {}) {
  const repo = { ...repository(root), ...repositoryOverride }
  const predecessor = readPredecessor(root)
  const externalBytes = readExternalBytes(cacheDir, predecessor)
  const observations = IMAGE_SPECS.map(spec => ({
    observationId: `obs-toyo-1646-extended-${spec.leaf}`,
    sourceId: 'src-toyo-1646',
    locator: `viewer image ${spec.leaf}`,
    printedFolio: null,
    directObservationStatus: 'visual_page_review',
    observationMode: 'actual_public_jpeg_bytes_visually_reviewed; not OCR authority',
    surface: spec.surface,
    detail: spec.detail,
    imageSha256: externalBytes.find(item => item.leaf === spec.leaf).byteSha256,
    transcriptionRole: 'locator_only',
    semanticScope: 'bounded_surface_only; no complete production palace mapping inferred',
  }))
  const relations = IMAGE_SPECS.map(spec => relation(spec, `obs-toyo-1646-extended-${spec.leaf}`))
  const blockerIds = [...new Set(IMAGE_SPECS.flatMap(spec => spec.blockerIds))].sort()
  const sourceAssessment = {
    sourceId: 'src-toyo-1646',
    predecessorIndependence: 'independent_physical_witness_candidate_not_admitted_as_independent_oracle',
    afterReviewIndependence: 'independent_physical_witness_candidate_not_admitted_as_independent_oracle',
    semanticAuthority: 'not_established',
    sourceIdentity: 'collection/item route and image bytes are identified; date, colophon, edition and textual lineage remain unresolved',
    reuseRights: 'public viewer access observed; image reuse permission not established; no image stored in Git',
    promotionDecision: 'retain candidate-only status',
  }
  const artifactBase = {
    schemaVersion: SCHEMA,
    verdictToken: VERDICT,
    basisHead: EXPECTED_HEAD,
    observedHead: repo.currentHead,
    expectedHead: EXPECTED_HEAD,
    originMainHead: repo.originMainHead,
    branch: repo.branch,
    scope: 'additive_visual_review_of_preexisting_toyo_1646_cache_images_for_ziwei_p0_source_identity',
    predecessor,
    sourceAssessment,
    externalEvidence: {
      sourceId: 'src-toyo-1646',
      cacheConfiguration: { requiredEnv: CACHE_ENV, fileNamePattern: 'ziwei-toyo-1646-{leaf}.jpg', repositoryStorage: 'forbidden' },
      reviewedFiles: externalBytes,
      imageCount: externalBytes.length,
      predecessorImageCount: externalBytes.filter(item => item.reviewOrigin === 'predecessor_visual_review_hash_rechecked').length,
      newImageCount: externalBytes.filter(item => item.reviewOrigin === 'new_visual_review_in_this_packet').length,
      cacheScope: 'all 23 pre-existing TOYO JPEG files present in the explicit cache were hash-checked; viewer leaves outside this cache were not acquired',
      historicalHashReconciliation: externalBytes.filter(item => item.predecessorHashStatus === 'historical_record_mismatch_preserved').map(item => ({ leaf: item.leaf, predecessorRecordedSha256: item.predecessorRecordedSha256, actualCacheSha256: item.byteSha256, decision: 'preserve_historical_record_and_actual_bytes_in_parallel; do_not_rewrite_predecessor' })),
      acquisition: 'no acquisition performed; only preexisting explicitly configured local cache bytes were read',
    },
    observations,
    relations,
    impact: {
      predecessorCoverage: { claimCount: 30, sourceCount: 13, observationCount: 26, relationCount: 116, blockerCount: 11 },
      additiveCoverage: { claimCount: 30, sourceCount: 13, observationCount: 34, relationCount: 124, blockerCount: 11 },
      addedObservationCount: observations.length,
      addedRelationCount: relations.length,
      claimsAdded: 0,
      sourcesAdded: 0,
      blockersClosed: [],
      blockersStillBlocked: ALL_BLOCKER_IDS,
      impactedBlockers: blockerIds,
      combinedExternalImageObservationCount: externalBytes.length,
      stableClaimCount: 0,
      semanticAuthorityCount: 0,
      independentWitnessesAdmitted: 0,
      readiness: 'not_safe_to_start',
      grounding: 'blocked',
      activation: 'experimental_only',
      rotation06: 'representation_only',
      conclusion: 'The extra leaves improve bounded direct observation of the same physical candidate but do not close any P0/P1 source identity, independence, semantic mapping, authority, oracle, or reuse blocker.',
    },
    preservation: {
      predecessorArtifactChanged: false,
      productionChanged: false,
      readinessChanged: false,
      claimBoundaryPromoted: false,
      sourceImagesStoredInGit: false,
      historicalPredecessorBytesRewritten: false,
      externalAcquisitionPerformed: false,
      networkUsedDuringMaterialization: false,
      timestampsUsed: false,
      untrackedDashJpgPreserved: true,
    },
    deterministicContract: {
      generatedAt: 'forbidden',
      network: 'forbidden_during_materialization',
      sourceCache: 'explicit env path only; every required byte is hash-checked; missing/mismatched bytes fail closed',
      imageOrder: 'leaf ascending order across the 15 predecessor rows and 8 new rows',
      ids: 'stable explicit leaf-based IDs',
      hashes: 'actual JPEG bytes, SHA-256, UTF-8 JSON including final LF',
      visualReviewBoundary: 'OCR/transcription is locator-only; direct page review is bounded surface evidence',
    },
    negativeContract: {
      rejectedMutations: ['semantic authority promotion', 'independent witness admission', 'source image storage', 'cache hash mutation', 'invented printed folio', 'OCR canonical promotion', 'blocker closure', 'readiness promotion', 'predecessor boundary damage', 'generated timestamp'],
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
    baseHead: EXPECTED_HEAD,
    inputs: [MATERIALIZER_PATH, 'src/artifactIdentity.js', PREDECESSOR_ARTIFACT, PREDECESSOR_LINEAGE_ARTIFACT],
  }))
}

export async function materializeBundle(target = resolve(`${ARTIFACT_DIR}/complete.json`), options = {}) {
  const root = resolve(new URL('..', import.meta.url).pathname)
  const artifact = buildBundle(root, options)
  const body = Buffer.from(canonicalJson(artifact))
  await mkdir(dirname(target), { recursive: true })
  await writeFile(target, body)
  await writeFile(`${target}.integrity.json`, canonicalJson({ schemaVersion: SCHEMA, path: relative(root, target), byteSha256: sha256(body), byteScope: 'UTF-8 JSON bytes including final LF' }))
  return { artifact, target, byteSha256: sha256(body) }
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  const target = resolve(process.argv[2] || `${ARTIFACT_DIR}/complete.json`)
  const result = await materializeBundle(target)
  console.log(JSON.stringify({ target: result.target, schema: SCHEMA, verdict: VERDICT, byteSha256: result.byteSha256 }, null, 2))
}

import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, relative, resolve } from 'node:path'

import {
  attachArtifactIdentity,
  buildArtifactIdentity,
  canonicalStableArtifactJson,
  checkHistoricalRepositoryBasis,
} from '../src/artifactIdentity.js'
import * as v13 from './materialize-ziwei-p0-palace-branch-slot-composition-v13.mjs'

export const SCHEMA = 'ziwei-p0-palace-branch-slot-composition-v14'
export const VERDICT = 'complete_ziwei_palace_branch_slot_composition_with_jielan_institutional_identity_and_transmission_frontier_graph_neutral_derived_not_authoritative'
export const MATERIALIZER_VERSION = '14.0.0'
export const BASIS_HEAD = v13.BASIS_HEAD
export const MATERIALIZER_PATH = 'scripts/materialize-' + SCHEMA + '.mjs'
export const ARTIFACT_DIR = 'artifacts/' + SCHEMA
export const ARTIFACT_PATH = ARTIFACT_DIR + '/complete.json'
export const DOCUMENTATION_PATH = 'docs/ziwei-p0-palace-branch-slot-composition-v14.md'
export const CHECKER_PATH = 'scripts/check-' + SCHEMA + '.mjs'
export const NEGATIVE_CHECKER_PATH = 'scripts/check-' + SCHEMA + '-negative-v0.mjs'
export const ROOT = resolve(new URL('..', import.meta.url).pathname)
export const PREDECESSOR_COMPOSITION = v13.ARTIFACT_PATH
export const PREDECESSOR_COMPOSITION_EVIDENCE = v13.ARTIFACT_DIR + '/evidence.json'
export const PROTECTED_ASSET_PATH = v13.PROTECTED_ASSET_PATH

export const CANDIDATE_JIELAN = 'candidate-jielan-shanghai-zi4051-institutional-lead-v14'
export const CANDIDATE_ERXIANAN = 'candidate-erxianan-1906-zi51429536-transmission-bridge-v14'
export const CANDIDATE_JIELAN_PREVIEW = 'candidate-jielan-sunyata-preview-locator-v14'
export const OBSERVATION_JIELAN = 'frontier-obs-jielan-zi4051-linked-data-and-target-leaf-boundary-v14'
export const OBSERVATION_ERXIANAN = 'frontier-obs-erxianan-1906-child-mismatch-and-leaf-boundary-v14'
export const OBSERVATION_PREVIEW = 'frontier-obs-jielan-commercial-preview-locator-only-v14'

export const SHLIB_INSTANCE_URL = 'https://data.library.sh.cn/gj/resource/instance/l611spx62774srpb'
export const SHLIB_ORIGINAL_INSTANCE_URL = 'https://data.library.sh.cn/gj/resource/instance/8d8mpqr6vfm7ch2z'
export const SHLIB_ITEM_URL = 'https://data.library.sh.cn/gj/resource/item/3bbpnryby18e1u13'
export const SHLIB_HELD_BY_URL = 'https://data.library.sh.cn/entity/organization/bdehahol04qh5ovv'
export const SHLIB_SEARCH_ENDPOINT = 'https://gj.library.sh.cn/es/api/gjmult/dhc'
export const SHLIB_SPARQL_ENDPOINT = 'https://data.library.sh.cn/sparql/'
export const ERXIANAN_INSTANCE_URL = 'https://data.library.sh.cn/gj/resource/instance/dboctvrs5oa0fvx2'
export const ERXIANAN_ORIGINAL_INSTANCE_URL = 'https://data.library.sh.cn/gj/resource/instance/idkkfh2b18ilh03x'
export const ZIWEI_CHILD_INSTANCE_URL = 'https://data.library.sh.cn/gj/resource/instance/is5ptwd0mkm4isuz'
export const ZIWEI_CHILD_ORIGINAL_INSTANCE_URL = 'https://data.library.sh.cn/gj/resource/instance/dblfrjgjt7k147bf'
export const JIELAN_PUBLISHER_URL = 'https://publish.sunyata.hk/product/972.html'
export const JIELAN_GOOGLE_BOOKS_URL = 'https://play.google.com/store/books/details?id=rZRcCwAAQBAJ&hl=zh_TW'

export const INPUT_PATHS = [...new Set([
  ...v13.INPUT_PATHS,
  PREDECESSOR_COMPOSITION,
  PREDECESSOR_COMPOSITION_EVIDENCE,
  DOCUMENTATION_PATH,
  MATERIALIZER_PATH,
  CHECKER_PATH,
  NEGATIVE_CHECKER_PATH,
])]

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const clone = value => structuredClone(value)
const unique = values => [...new Set(values)]
const readJson = (root, path) => JSON.parse(readFileSync(resolve(root, path), 'utf8'))
const fileSha256 = (root, path) => sha256(readFileSync(resolve(root, path)))
const requireValue = (condition, message) => { if (!condition) throw new Error(message) }
const git = (root, args) => execFileSync('git', ['-c', 'core.fsmonitor=false', ...args], { cwd: root, encoding: 'utf8' }).trim()
export const canonicalJson = v13.canonicalJson
const direct = detail => ({ status: 'direct', detail })
const unresolved = detail => ({ status: 'unresolved', detail })

function repository(root) {
  return {
    branch: git(root, ['branch', '--show-current']),
    currentHead: git(root, ['rev-parse', 'HEAD']),
    originMainHead: git(root, ['rev-parse', 'origin/main']),
  }
}

function predecessorInput(root) {
  const generated = v13.buildBundle(root, { mode: 'historical_reference' })
  const stored = readJson(root, PREDECESSOR_COMPOSITION)
  const storedEvidence = readJson(root, PREDECESSOR_COMPOSITION_EVIDENCE)
  requireValue(canonicalStableArtifactJson(stored) === canonicalStableArtifactJson(generated.artifact), 'v13_predecessor_complete_drift')
  requireValue(canonicalStableArtifactJson(storedEvidence) === canonicalStableArtifactJson(generated.files['evidence.json']), 'v13_predecessor_evidence_drift')
  requireValue(generated.artifact.schemaVersion === v13.SCHEMA, 'unexpected_v13_schema')
  requireValue(JSON.stringify(generated.artifact.graphImpact.successor) === JSON.stringify({ claimCount: 30, sourceCount: 21, observationCount: 58, relationCount: 148, blockerCount: 11 }), 'unexpected_v13_graph_counts')
  return { generated, storedEvidence }
}

function bindingBoundary(reason) {
  return {
    branchToken: unresolved(reason),
    palaceName: unresolved(reason),
    physicalChartSlot: unresolved(reason),
    ordinalBase: unresolved(reason),
    direction: unresolved(reason),
    fullBinding: false,
    directSingleWitnessFullBinding: false,
    productionOrdinal: false,
    semanticAuthority: false,
  }
}

function jielanDossier() {
  return {
    unitId: 'primary-jielan-1581',
    candidateId: CANDIDATE_JIELAN,
    role: 'institution-level physical identity lead; target rule leaf and source-authority bytes not acquired',
    evidenceGrade: 'B_metadata_identity_lead_C_target_leaf_unresolved',
    sourceIdentity: {
      exactTitle: direct('新刻纂集紫微斗數捷覽四卷'),
      volumeCount: direct('四卷'),
      identifier: direct('子4051'),
      catalogLabel: direct('明萬曆九年金陵書坊王洛川刻本'),
      publicationYear: direct('1581'),
      reignYear: direct('明萬曆九年'),
      place: direct('金陵'),
      printerOrBookshop: direct('王洛川'),
      heldBy: direct('安徽省博物館'),
      instanceUri: SHLIB_INSTANCE_URL,
      originalInstanceUri: SHLIB_ORIGINAL_INSTANCE_URL,
      itemUri: SHLIB_ITEM_URL,
      heldByOrganizationUri: SHLIB_HELD_BY_URL,
      workUri: 'https://data.library.sh.cn/gj/resource/work/b5gopekewcrxfgxz',
      workRecordDirectDereference: unresolved('instanceOf was directly observed; work endpoint redirected to the legacy frontend'),
    },
    relationChain: [
      { subject: SHLIB_INSTANCE_URL, predicate: 'instanceOf', object: 'https://data.library.sh.cn/gj/resource/work/b5gopekewcrxfgxz', direction: 'direct_record_edge', meaning: 'instance points to work; work-to-instance is inverse view only' },
      { subject: SHLIB_INSTANCE_URL, predicate: 'original', object: SHLIB_ORIGINAL_INSTANCE_URL, direction: 'direct_record_edge', meaning: 'instance points to original-version instance' },
      { subject: SHLIB_ITEM_URL, predicate: 'itemOf', object: SHLIB_ORIGINAL_INSTANCE_URL, direction: 'direct_item_record_edge', meaning: 'physical item belongs to original instance' },
      { subject: SHLIB_ITEM_URL, predicate: 'heldBy', object: SHLIB_HELD_BY_URL, direction: 'direct_item_record_edge', meaning: 'physical item is held by 安徽省博物館' },
    ],
    accessBoundary: {
      officialSearchEndpoint: SHLIB_SEARCH_ENDPOINT,
      officialLinkedDataUrls: [SHLIB_INSTANCE_URL, SHLIB_ORIGINAL_INSTANCE_URL, SHLIB_ITEM_URL, SHLIB_HELD_BY_URL],
      exactTitleSearchReturnedInstances: 2,
      fullImageFacet: '无',
      publicImageRoute: { status: 'absent_from_checked_routes', detail: 'no full-image or leaf route in exact-title search, instance, original-instance, or item records' },
      oldFrontendRoute: { status: 'blocked', detail: 'legacy Shanghai Library frontend returned HTTP 412' },
      rawHistoricalLeafAcquired: false,
      directHistoricalLeafRendered: false,
      targetLeafChecks: ['title leaf', '序 / 跋', '牌記 / 刊記', '版心', '目錄', '起紫微 / 安天府', '十二宮 / 四化', '命主 / 身主', 'actual chart or worked example'].map(target => ({ target, status: 'unresolved' })),
      checkedExactTargetTerms: [
        ['起紫微', 0], ['安天府', 0], ['四化', 0], ['命主', 0], ['身主', 0],
      ].map(([term, resultCount]) => ({ term, resultCount, interpretation: 'no exact search hit; not proof of absence from the physical copy' })),
    },
    fiveFieldBinding: bindingBoundary('no raw target leaf'),
    graphAdmission: { sourceAdded: false, observationAdded: false, relationAdded: false, independentPhysicalWitnessAdmitted: false, reason: 'metadata identity lead only until physical leaf and provenance are directly inspected' },
    parentVerifiedObservations: [
      '子4051 directly identifies exact title, four-volume form, 1581, 金陵, and 王洛川.',
      'The original-instance, item, and heldBy records were directly reread; heldBy resolves to 安徽省博物館.',
      'No checked public route exposed the source leaf or a full-image URL.',
    ],
  }
}

function erxiananDossier() {
  return {
    unitId: 'secondary-erxianan-1906',
    candidateId: CANDIDATE_ERXIANAN,
    role: 'possible transmission bridge; not an independent early witness',
    evidenceGrade: 'B_metadata_identity_C_target_leaf_unresolved',
    sourceIdentity: {
      exactTitle: direct('重刊道藏輯要'),
      identifier: direct('子51429536'),
      publicationYear: direct('1906'),
      reignYear: direct('清光緒三十二年'),
      place: direct('成都'),
      workshop: direct('二仙庵'),
      instanceUri: ERXIANAN_INSTANCE_URL,
      originalInstanceUri: ERXIANAN_ORIGINAL_INSTANCE_URL,
      holdings: [
        ['5uue20fnpc5oy6x2', 'unlabeled organization; Beijing-region place relation'],
        ['aexajbj2a830b7h5', '黑龍江省圖書館'],
        ['jn4k7di50ykgvgvz', '吉林省圖書館'],
        ['jynhcedphl0br137', '上海圖書館'],
        ['ql1tcx73zvmbj5xj', '首都圖書館'],
      ].map(([itemId, holderLabel]) => ({ itemId, holderLabel })),
    },
    transmissionCheck: {
      exactZiweiChildUnder1906: false,
      exactChildSearch: direct('no 紫微斗數 or 斗數 child under the 1906 original in the parent-verified SPARQL traversal'),
      relatedDaoistChildren: '紫微/道教 titles only; not target 紫微斗數',
      exactZiweiRecord: {
        title: '紫微斗數三卷',
        instanceUri: ZIWEI_CHILD_INSTANCE_URL,
        originalInstanceUri: ZIWEI_CHILD_ORIGINAL_INSTANCE_URL,
        identifier: '子51429531',
        manufacturedWith: '1607 續道藏 instance, not the 1906 二仙庵 instance',
      },
      classification: 'possible_transmission_bridge_only',
    },
    accessBoundary: {
      fullImageFacet: '无',
      rawHistoricalLeafAcquired: false,
      titlePage: unresolved('not publicly resolved'),
      colophon: unresolved('not publicly resolved'),
      targetStartEndLeaf: unresolved('not publicly resolved'),
      comparableQiZiweiLeaf: unresolved('not publicly resolved'),
      repeatedSameMetadataEndpoint: false,
    },
    fiveFieldBinding: { ...bindingBoundary('no target leaf'), independentPhysicalWitness: false },
    graphAdmission: { sourceAdded: false, observationAdded: false, relationAdded: false, independentPhysicalWitnessAdmitted: false, reason: 'exact Ziwei child resolves to 1607 續道藏; 1906 remains a collection-level bridge candidate' },
    parentVerifiedObservations: [
      '1906 parent and original-instance identity were resolved without repeating the exhausted metadata endpoint.',
      'Exact 紫微斗數三卷 is 子51429531 and its manufacturedWith relation points to 1607 續道藏.',
      'The 1906 original has multiple holding branches and they were not collapsed into one institution.',
    ],
  }
}

function previewDossier() {
  return {
    unitId: 'tertiary-jielan-commercial-preview',
    candidateId: CANDIDATE_JIELAN_PREVIEW,
    role: 'commercial acquisition and locator lead only',
    evidenceGrade: 'C',
    requestedIdentifier: {
      isbn: '9789888266944',
      resolvedTitle: '紫微斗數全書',
      publicationYear: 2017,
      relationToTarget: 'not the 捷覽 edition',
    },
    targetEdition: {
      exactTitle: '紫微斗數捷覽（明刊孤本）[原(彩)色本]附點校本',
      publisherUrl: JIELAN_PUBLISHER_URL,
      isbn: '9789888317127',
      publicationYear: 2016,
      publisherPageClaim: '明刊孤本 / 明萬曆九年金陵書坊王氏洛川刊本',
      publisherClaimStatus: 'not independently verified against original institutional provenance',
      googleBooksVolumeId: 'rZRcCwAAQBAJ',
      googleBooksPreviewUrl: JIELAN_GOOGLE_BOOKS_URL,
      previewStatus: 'public derivative preview route confirmed',
      rawOriginalBytes: false,
    },
    locatorReview: {
      sampledPreviewPageIds: ['PT14', 'PT15', 'PT16', 'PT17'],
      sampledPreviewVisualReview: true,
      ocrLocatorOnly: true,
      locatorTerms: {
        文光堂: ['PT35'],
        敦化堂: [],
        繼述堂: [],
        版權: ['PT2', 'PT174'],
        牌記: [],
        刊記: ['PT8', 'PT36', 'PT47', 'PT84', 'PT156', 'PT175'],
        安天府: ['PT15', 'PT31', 'PT59', 'PT96', 'PT139'],
        四化: ['PT15', 'PT21', 'PT59', 'PT61', 'PT94', 'PT104', 'PT105', 'PT106', 'PT141', 'PT165'],
        命主: ['PT57', 'PT59', 'PT61', 'PT75', 'PT78', 'PT94', 'PT96', 'PT98', 'PT99', 'PT107'],
        身主: ['PT15', 'PT35', 'PT57', 'PT59', 'PT89', 'PT94', 'PT105', 'PT106', 'PT107', 'PT145'],
      },
      interpretation: 'OCR and derivative preview pages are locators only; no original call number, institution provenance, raw leaf, or source-authoritative binding is promoted',
    },
    fiveFieldBinding: bindingBoundary('commercial preview is locator-only'),
    graphAdmission: { sourceAdded: false, observationAdded: false, relationAdded: false, independentPhysicalWitnessAdmitted: false, reason: 'commercial derivative cannot replace original physical witness' },
    parentVerifiedObservations: [
      '9789888266944 resolves to a different 2017 紫微斗數全書 product.',
      'The official publisher and Google Books route for 捷覽 is a separate 2016 edition with ISBN 9789888317127.',
      'Preview OCR hits are acquisition locators only.',
    ],
  }
}

function buildResearchDossier() {
  const primary = jielanDossier()
  const secondary = erxiananDossier()
  const tertiary = previewDossier()
  return {
    schemaVersion: SCHEMA + '-research-dossier-v0',
    researchDate: '2026-08-14',
    status: 'derived_not_authoritative_graph_neutral',
    units: { primary, secondary, tertiary },
    candidates: [primary, secondary, tertiary],
    fiveFieldSummary: {
      fieldNames: ['branchToken', 'palaceName', 'physicalChartSlot', 'ordinalBase', 'direction'],
      primaryAllUnresolved: true,
      secondaryAllUnresolved: true,
      tertiaryAllUnresolved: true,
      directSingleWitnessFullBindingCount: 0,
      productionOrdinalBindingCount: 0,
      semanticAuthorityCount: 0,
    },
    blockers: [
      { id: 'blocker-v14-jielan-raw-target-leaf', status: 'open', blocksParent: true, nextRequirement: 'public or institution-supplied raw 1581 title/序/跋/牌記/版心/目錄/rule leaf with stable item provenance' },
      { id: 'blocker-v14-jielan-source-authority', status: 'open', blocksParent: true, nextRequirement: '安徽省博物館 item-level copy provenance and permission or an authorized surrogate' },
      { id: 'blocker-v14-erxianan-target-child', status: 'open', blocksParent: true, nextRequirement: 'leaf-level 1906 collection crosswalk proving an exact 紫微斗數 child' },
      { id: 'blocker-v14-commercial-provenance', status: 'open', blocksParent: true, nextRequirement: 'original call number/institutional provenance for any commercial facsimile claim' },
    ],
    graphBoundary: {
      claimsAdded: 0,
      sourcesAdded: 0,
      observationsAdded: 0,
      relationsAdded: 0,
      blockersClosed: [],
      independentPhysicalWitnessesAdmitted: 0,
      topLevelGraphCountsUnchanged: { claimCount: 30, sourceCount: 21, observationCount: 58, relationCount: 148, blockerCount: 11 },
    },
    readinessBoundary: {
      readiness: 'not_safe_to_start',
      grounding: 'blocked',
      activation: 'experimental_only',
      sourceAuthority: 'not_established',
      semanticAuthority: 'not_established',
      productionOrdinal: 'not_established',
    },
    exhaustedPaths: [
      'Exact 子4051 title search and checked linked-data/item routes exposed no public full-image or leaf URL; checked-route negative only.',
      'The legacy Shanghai Library frontend route was HTTP 412.',
      'The 1906 exact child traversal did not connect 紫微斗數三卷 to the 1906 二仙庵 instance; the exact child resolved to 1607 續道藏.',
      'The checked 1906 collection search returned no target public full-image route.',
      '9789888266944 was exhausted as the wrong product identity for 捷覽; the correct 2016 preview is locator-only.',
    ],
    remainingAcquisitionTargets: [
      { priority: 1, holder: '安徽省博物館', itemUri: SHLIB_ITEM_URL, identifier: '子4051', required: 'item-level copy request or authorized scan; title/序/跋/牌記/版心/目錄 and rule/chart leaves' },
      { priority: 2, holder: '上海圖書館 / 黑龍江省圖書館 / 吉林省圖書館 / 首都圖書館', instanceUri: ERXIANAN_ORIGINAL_INSTANCE_URL, required: 'leaf-level collection table or scan proving exact 紫微斗數 child and start/end leaves' },
      { priority: 3, holder: 'publisher or rights holder', itemUri: JIELAN_PUBLISHER_URL, required: 'licensed high-resolution preview plus original institutional call number/provenance; otherwise retain C grade' },
    ],
    continuationDecisions: {
      primaryInitialInputCorrection: { decision: 'recheck_required', reasonCodes: ['gate_input_invalid'], error: 'scope_complete_and_objective_unmet' },
      primaryCorrected: { decision: 'continue', reasonCodes: ['new_evidence', 'validated_fact', 'new_checkable_frontier'], attemptFingerprint: 'e9b1e494c6334c7039d3558004afd80146aa09a3969295be00c1223690b2b003', stateFingerprint: '73862aa2c5c2ee4a73a2a8b6e4d3c2c2e151382fbe9df1619f6bfaf57c250ab1' },
      secondary: { decision: 'stop_blocked', reasonCodes: ['new_evidence', 'validated_fact', 'unresolved_parent_blocker', 'no_safe_frontier'], attemptFingerprint: '552581e10d475e0cd9737afbb503003c1d0619f26c85d8e64a4f978913d4401b', stateFingerprint: '72f67747843edb4ddc1c0396571f6c35b33b5d98165261bef93c8db4635d134b' },
      tertiary: { decision: 'stop_blocked', reasonCodes: ['new_evidence', 'validated_fact', 'unresolved_parent_blocker', 'no_safe_frontier'], attemptFingerprint: '424402d5c8c93a457fe83bbeb395ecde46fb9becf66e38140c232d0e5beb7493', stateFingerprint: '494578b49277f6051ede9b9623e24ff8c7ebbf31a8d7bf65c6b1ed90e862fe' },
      authorityBoundary: { gateRole: 'workflow_continuation_only', domainReadiness: 'not_evaluated', semanticAuthority: 'not_established', productionActivation: false, childPassIsParentGoalPass: false },
    },
  }
}

function buildArtifact(root = ROOT, { mode = 'exact' } = {}) {
  for (const path of INPUT_PATHS) requireValue(existsSync(resolve(root, path)), 'missing_input:' + path)
  const repo = repository(root)
  requireValue(repo.branch === 'main', 'composition_requires_main')
  if (mode === 'exact') {
    requireValue(repo.currentHead === BASIS_HEAD, 'composition_basis_must_be_current_head')
    requireValue(repo.originMainHead === BASIS_HEAD, 'composition_origin_must_match_basis_head')
  } else if (mode === 'historical_reference') {
    const historical = checkHistoricalRepositoryBasis(root, BASIS_HEAD, { expectedBranch: 'main' })
    requireValue(historical.errors.length === 0, 'historical_reference_basis_invalid:' + historical.errors.join(','))
  } else {
    requireValue(false, 'unsupported_materialization_mode:' + mode)
  }

  const predecessor = predecessorInput(root)
  const previous = predecessor.generated.artifact
  const dossier = buildResearchDossier()
  const evidence = {
    ...clone(previous.evidence),
    schemaVersion: SCHEMA + '-evidence-v0',
    authorityBoundary: 'v14 adds only a parent-verified, graph-neutral dossier for 子4051 identity, the 1906 transmission boundary, and the commercial preview locator. No source, observation, relation, authority, readiness, or activation promotion is made.',
    v14ResearchDossier: dossier,
    reportedNonObservations: unique([
      ...(previous.evidence.reportedNonObservations || []),
      'The 子4051 metadata chain establishes item identity and 安徽省博物館 holding, but no checked route supplies the raw 1581 target leaf.',
      'The 1906 子51429536 record is not treated as a Ziwei witness because the exact 紫微斗數三卷 child resolves to 子51429531 / 1607 續道藏.',
      'The 2016 commercial preview and OCR hits are acquisition locators only; 9789888266944 is a different 2017 紫微斗數全書 product.',
    ]),
  }
  const bindingMatrix = { ...clone(previous.bindingMatrix), schemaVersion: SCHEMA + '-binding-matrix-v0', v14ResearchDossier: dossier.fiveFieldSummary }
  const lineageAssessment = {
    ...clone(previous.lineageAssessment),
    schemaVersion: SCHEMA + '-lineage-v0',
    sourceIdentityStatus: previous.lineageAssessment.sourceIdentityStatus + '; v14 directly verifies the 子4051 instance-to-original-instance-to-item-to-安徽省博物館 chain, while raw target-leaf provenance remains unresolved',
    independenceStatus: previous.lineageAssessment.independenceStatus + ' v14 does not admit the 子4051 metadata lead, the 1906 collection record, or the commercial derivative as an independent semantic witness.',
    v14ResearchDossier: dossier,
  }
  const fieldKitImpact = {
    ...clone(previous.fieldKitImpact),
    schemaVersion: SCHEMA + '-field-kit-v0',
    heldEvidenceUpdate: 'v14 records the parent-verified 子4051 institutional identity chain, the 1906 exact-child mismatch, and the 2016 commercial preview locator. All remain outside the graph; raw target leaves, source authority, five-field binding, readiness, and activation remain open.',
    v14ResearchDossier: dossier,
    v14ResearchBoundary: { openBlockerIds: dossier.blockers.map(item => item.id), nextAcquisitionTargets: dossier.remainingAcquisitionTargets, graphAdmission: 'none' },
  }
  const previousGraph = previous.graphImpact.successor
  const graphImpact = {
    ...clone(previous.graphImpact),
    predecessor: clone(previousGraph),
    additive: { claimCount: 0, sourceCount: 0, physicalWitnessCount: 0, observationCount: 0, relationCount: 0, blockerCount: 0 },
    successor: clone(previousGraph),
    claimsAdded: 0,
    sourcesAdded: [],
    physicalWitnessesAdded: [],
    independentPhysicalWitnessesAdmitted: 0,
    addedObservationIds: [],
    addedRelationIds: [],
    blockersClosed: [],
    blockersStillOpen: clone(previous.graphImpact.blockersStillOpen),
    blockerStatusCounts: clone(previous.graphImpact.blockerStatusCounts),
    researchFrontier: { ...clone(previous.graphImpact.researchFrontier), sourcesAdded: [], observationsAdded: [], relationsAdded: [], blockersClosed: [], claimsAdded: 0, independentPhysicalWitnessesAdmitted: 0 },
    v14ResearchBoundary: dossier.graphBoundary,
  }
  const claimImpact = {
    ...clone(previous.claimImpact),
    claimsAdded: 0,
    claimsPromoted: 0,
    directSemanticClaimSupportAdded: [],
    researchFrontierClaimsAdded: 0,
    researchFrontierSemanticSupportAdded: 0,
    semanticAuthorityCount: 0,
    boundary: previous.claimImpact.boundary + '; v14 adds only graph-neutral institution, transmission, and commercial-locator evidence; no five-field binding or authority promotion',
  }
  const blockerImpact = {
    ...clone(previous.blockerImpact),
    blockersClosed: [],
    blockerStatusChanges: [],
    v14ResearchBoundary: { topLevelGraphBlockersClosed: [], openResearchBlockerIds: dossier.blockers.map(item => item.id), topLevelBlockerCountUnchanged: true },
  }
  const completeBase = {
    ...clone(previous),
    schemaVersion: SCHEMA,
    verdictToken: VERDICT,
    observedHead: repo.currentHead,
    originMainHead: repo.originMainHead,
    basisHead: BASIS_HEAD,
    branch: repo.branch,
    scope: {
      ...clone(previous.scope),
      purpose: 'additive graph-neutral research dossier for 子4051 identity, 1906 transmission boundary, and commercial preview locator',
      v14ResearchUnitsCompleted: ['primary-jielan-1581', 'secondary-erxianan-1906', 'tertiary-jielan-commercial-preview'],
      v14GraphAdmission: 'none',
      directSingleWitnessFullBindingEstablished: false,
      independentWitnessesAdmitted: 0,
      sourceAuthorityPromoted: false,
      semanticAuthorityPromoted: false,
    },
    predecessorChain: [
      ...clone(previous.predecessorChain),
      { path: PREDECESSOR_COMPOSITION, schemaVersion: previous.schemaVersion, byteSha256: fileSha256(root, PREDECESSOR_COMPOSITION) },
      { path: PREDECESSOR_COMPOSITION_EVIDENCE, schemaVersion: predecessor.storedEvidence.schemaVersion, byteSha256: fileSha256(root, PREDECESSOR_COMPOSITION_EVIDENCE) },
    ],
    sourceLineage: {
      ...clone(previous.sourceLineage),
      sourceAuthority: 'not_established',
      semanticAuthority: 'not_established',
      independentPhysicalWitnessesAdmitted: 0,
      sourceIdentityStatus: previous.sourceLineage.sourceIdentityStatus + '; v14 adds a verified institutional item/holder identity lead but no raw source witness',
    },
    evidence,
    observations: clone(previous.observations),
    relations: clone(previous.relations),
    claimReconciliation: clone(previous.claimReconciliation),
    blockerReassessment: clone(previous.blockerReassessment),
    bindingMatrix,
    lineageAssessment,
    fieldKitImpact,
    graphImpact,
    claimImpact,
    blockerImpact,
    v14ResearchDossier: dossier,
    readinessImpact: { ...clone(previous.readinessImpact), readiness: 'not_safe_to_start', grounding: 'blocked', activation: 'experimental_only', rotation06: 'representation_only', sourceAuthorityPromoted: false, semanticAuthorityPromoted: false, independentWitnessesAdmitted: 0, productionModified: false, readinessModified: false },
    preservation: { ...clone(previous.preservation), predecessorArtifactsRewritten: false, historicalPredecessorBytesRewritten: false, existingFieldKitRewritten: false, sourceImagesStoredInGit: false, sourcePdfsStoredInGit: false, sourceBytesAcquiredOutsideRepo: true, externalWebSourceBytesStoredInGit: false, materializerNetworkUsed: false, productionChanged: false, remoteDatabaseChanged: false, deploymentPerformed: false, commitPerformed: false, pushPerformed: false },
    deterministicContract: { ...clone(previous.deterministicContract), sourceBytes: 'v14 records fixed parent-verified linked-data identities and locator outcomes; external web acquisition is not performed during materialization and no external raw source bytes are stored in the artifact', network: 'forbidden_during_materialization', ocr: 'locator-only; no OCR string is canonical source text', noAutomaticPromotion: true },
    negativeContract: {
      ...clone(previous.negativeContract),
      rejects: unique([
        ...previous.negativeContract.rejects,
        'promoting the 子4051 metadata chain into a raw historical leaf, source authority, or independent physical witness without item-level leaf evidence',
        'treating 子51429536 collection identity as the exact 紫微斗數 child when the child resolves to 子51429531 / 1607 續道藏',
        'treating the 2016 commercial preview or OCR locator hits as an original source-authoritative witness',
        'treating any v14 dossier field as five-field semantic binding, production ordinal, readiness, or activation',
      ]),
    },
    materializer: MATERIALIZER_PATH,
    checker: CHECKER_PATH,
    negativeChecker: NEGATIVE_CHECKER_PATH,
  }
  delete completeBase.artifactIdentity
  const artifact = attachArtifactIdentity(completeBase, buildArtifactIdentity({ root, artifactId: SCHEMA, materializerPath: MATERIALIZER_PATH, materializerVersion: MATERIALIZER_VERSION, baseHead: BASIS_HEAD, inputs: INPUT_PATHS }))
  const files = {
    'evidence.json': evidence,
    'binding-matrix.json': bindingMatrix,
    'lineage-assessment.json': lineageAssessment,
    'graph-reconciliation.json': {
      schemaVersion: SCHEMA + '-graph-v0',
      predecessorChain: artifact.predecessorChain,
      sourceLineage: artifact.sourceLineage,
      observations: artifact.observations,
      relations: artifact.relations,
      claimReconciliation: artifact.claimReconciliation,
      blockerReassessment: artifact.blockerReassessment,
      graphImpact: artifact.graphImpact,
      claimImpact: artifact.claimImpact,
      blockerImpact: artifact.blockerImpact,
      uncertainty: artifact.lineageAssessment,
      v14ResearchDossier: dossier,
    },
    'field-kit-impact.json': {
      schemaVersion: SCHEMA + '-field-kit-v0',
      ...fieldKitImpact,
      closureBoundary: { sourceIdentityTarget: 'action_required', palaceSemanticTarget: 'action_required', productionOrdinalTarget: 'not_established', imageReuseTarget: 'human_policy_review', researchFrontierAdmission: 'held_outside_graph_v14_jielan_identity_erxianan_bridge_commercial_locator' },
    },
  }
  return { artifact, files }
}

export function buildBundle(root = ROOT, options = {}) { return buildArtifact(root, options) }

export async function materializeBundle(target = resolve(ROOT, ARTIFACT_PATH), options = {}) {
  const { artifact, files } = buildArtifact(ROOT, options)
  const targetPath = resolve(target)
  const directory = dirname(targetPath)
  await mkdir(directory, { recursive: true })
  const outputs = { complete: targetPath }
  const writeJson = async (path, value) => {
    const body = Buffer.from(canonicalJson(value))
    await writeFile(path, body)
    await writeFile(path + '.integrity.json', canonicalJson({ schemaVersion: SCHEMA + '-integrity-v0', path: relative(ROOT, path), byteSha256: sha256(body), byteScope: 'UTF-8 JSON bytes including final LF' }))
    return sha256(body)
  }
  const completeSha256 = await writeJson(targetPath, artifact)
  for (const [name, value] of Object.entries(files)) {
    const path = resolve(directory, name)
    outputs[name] = path
    await writeJson(path, value)
  }
  return { artifact, files, outputs, targetPath, completeSha256 }
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  const result = await materializeBundle(resolve(process.argv[2] || ARTIFACT_PATH))
  console.log(JSON.stringify({ target: result.targetPath, schema: SCHEMA, verdict: VERDICT, basisHead: BASIS_HEAD, predecessorSchema: v13.SCHEMA, counts: result.artifact.graphImpact.successor, graphAdditive: result.artifact.graphImpact.additive, candidates: result.artifact.v14ResearchDossier.candidates.map(item => item.candidateId), directSingleWitnessFullBindingCount: result.artifact.v14ResearchDossier.fiveFieldSummary.directSingleWitnessFullBindingCount, productionOrdinalBindingCount: result.artifact.v14ResearchDossier.fiveFieldSummary.productionOrdinalBindingCount, independentPhysicalWitnessesAdmitted: result.artifact.graphImpact.independentPhysicalWitnessesAdmitted, blockersClosed: result.artifact.graphImpact.blockersClosed, completeByteSha256: result.completeSha256 }, null, 2))
}

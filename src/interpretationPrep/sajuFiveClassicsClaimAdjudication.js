import { createHash } from 'node:crypto'

import { canonicalIdentityJson } from '../artifactIdentity.js'

export const SAJU_FIVE_CLASSICS_CLAIM_ADJUDICATION_SCHEMA = 'saju-five-classics-claim-adjudication-v0'
export const SAJU_FIVE_CLASSICS_CLAIM_ADJUDICATION_VERSION = '0.1.0'
export const SAJU_FIVE_CLASSICS_SOURCE_FRONTIER_PATH = 'artifacts/saju-five-classics-source-identity-frontier-v0/complete.json'

export const SAJU_FIVE_CLASSICS_READINESS_KEYS = Object.freeze([
  'historical_witness_observed',
  'edition_collated',
  'local_lineage_resolved',
  'semantic_equivalence_checked',
  'independence_resolved',
  'promotion_ready',
])

export const SAJU_FIVE_CLASSICS_ADJUDICATION_STATUSES = Object.freeze([
  'stable_candidate',
  'lineage_specific',
  'edition_variant',
  'semantic_conflict',
  'independence_unresolved',
  'local_lineage_unresolved',
  'insufficient_evidence',
])

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const proven = (evidenceRefs, note) => ({ status: 'proven', evidenceRefs, missingEdges: [], note })
const missing = (evidenceRefs, missingEdges, note) => ({ status: 'missing', evidenceRefs, missingEdges, note })
const readiness = (values, evidence) => ({ ...values, readinessEvidence: evidence })

const witness = ({ witnessId, role, sourceId, pageObservationIds, exactByteSha256, exactByteLength, scope }) => ({
  witnessId,
  role,
  sourceId,
  pageObservationIds,
  exactByteSha256: exactByteSha256 || null,
  exactByteLength: exactByteLength || null,
  scope,
})

const sourceEvidence = ({ sourceIds = [], pageObservationIds = [], claimRelationIds = [], blockerIds = [] } = {}) => ({
  sourceIds,
  pageObservationIds,
  claimRelationIds,
  blockerIds,
})

const dossierPaths = [
  '/Users/softie/Downloads/명리 고전 PDF 5종의 판본·디지털 계통 독립 검증 연구보고서.md',
  '/Users/softie/Downloads/문헌 관계 분석 메모.md',
  '/Users/softie/Downloads/외부 자료 조사 기록.md',
  '/Users/softie/Downloads/직접 관찰 기록.md',
  '/Users/softie/Downloads/p3_responsibility_crop.png',
]

export const SAJU_FIVE_CLASSICS_EXTERNAL_RECORD_OBSERVATIONS = Object.freeze([
  {
    recordId: 'record.cinii.yuanhai-bb08850892',
    recordType: 'bibliographic_record',
    institution: 'CiNii Books',
    url: 'https://ci.nii.ac.jp/ncid/BB08850892?l=en',
    retrievedOn: '2026-08-15',
    canonicality: 'direct_external_record_revalidation',
    semanticAuthority: 'identity_record_only',
    independenceRole: 'bibliographic_corroboration_only',
    observedFields: [
      '新刋合併官板音義評註淵海子平 5卷',
      '（宋）徐升編 ; （明）楊淙校',
      '崇禎七年孟冬吉日重梓',
      '卷之1巻頭: 宋錢塘 東齋 徐升編 / 明清江 竹亭 楊淙増校 / 福建 余氏 鐫梓',
    ],
    boundary: 'This record corroborates a responsibility display and bibliographic identity; it does not identify the local PDF as the same physical item or establish textual independence.',
  },
  {
    recordId: 'record.aks.yuanhai-yanhaiziping',
    recordType: 'institutional_bibliographic_record',
    institution: 'Academy of Korean Studies Sillokwiki',
    url: 'https://dh.aks.ac.kr/sillokwiki/index.php/%EC%97%B0%ED%95%B4%EC%9E%90%ED%8F%89(%E6%B7%B5%E6%B5%B7%E5%AD%90%E5%B9%B3)',
    retrievedOn: '2026-08-15',
    canonicality: 'direct_external_record_revalidation',
    semanticAuthority: 'identity_record_only',
    independenceRole: 'bibliographic_corroboration_only',
    observedFields: [
      '저편자 서승(徐升) 편, 양종(楊淙) 증교(增校)',
      '간행년일 1634년(명 숭정 7)',
      '권책수 5권 2책',
      '표제 신간합병관판음의평주연해자평',
      '소장처 국립중앙도서관',
    ],
    boundary: 'This record is an external bibliographic identity layer; it does not prove that the local export, the SSID scan, and the cataloged institutional item share a physical or textual lineage.',
  },
])

const CLAIMS = [
  {
    claimId: 'claim.yuanhai-editorial-responsibility',
    workIds: ['yuanhai-zi-ping'],
    claimFamily: 'editorial-responsibility',
    proposition: 'The exact SSID-13003376 and Tianyi Pavilion Ming Chongzhen scan leaf 3 observations both record 徐升編, 楊淙增校, and 福建余氏鐫梓 beside 新刊合併官板音義評註淵海子平卷之一; the local S03 label 楊淙 alone must not be normalized into sole authorship or direct local lineage.',
    scope: 'page-level responsibility display and bibliographic identity only',
    adjudicationStatus: 'local_lineage_unresolved',
    semanticAuthorityStatus: 'not_established',
    sourceFrontierEvidence: sourceEvidence({
      sourceIds: ['source.tianyige.yuanhai-zi-ping.ming-chongzhen.scan-5007', 'source.commons.yuanhai-ziping.sao-ye-shan-fang.ssid-13003376', 'source.local.yuanhai-ziping-pdf'],
      pageObservationIds: ['page.tianyige.yuanhai.ming-chongzhen.scan-5007.leaf-3', 'page.commons.yuanhai.ssid-13003376.leaf-3-responsibility', 'page.commons.yuanhai.ssid-13003376.leaf-3-title'],
      blockerIds: ['blocker.local-to-physical-item', 'blocker.yuanhai-ziping-lineage'],
    }),
    externalRecordIds: ['record.cinii.yuanhai-bb08850892', 'record.aks.yuanhai-yanhaiziping'],
    witnesses: [
      witness({
        witnessId: 'witness.ssid-13003376-leaf-3',
        role: 'historical_scan',
        sourceId: 'source.commons.yuanhai-ziping.sao-ye-shan-fang.ssid-13003376',
        pageObservationIds: ['page.commons.yuanhai.ssid-13003376.leaf-3-responsibility'],
        exactByteSha256: 'c6b261c3dccdb8209809110fc656f326d15b4b9cbc4a627cc657a0ab58fbc2f1',
        exactByteLength: 18023468,
        scope: 'PDF page/scan leaf 3; title and responsibility columns',
      }),
      witness({
        witnessId: 'witness.tianyige-5007-leaf-3',
        role: 'historical_scan',
        sourceId: 'source.tianyige.yuanhai-zi-ping.ming-chongzhen.scan-5007',
        pageObservationIds: ['page.tianyige.yuanhai.ming-chongzhen.scan-5007.leaf-3'],
        exactByteSha256: '93a4fe97798eb7c3c35122f307447ce5e931a9a4012e558520fe9052c16a295f',
        exactByteLength: 133016361,
        scope: 'scan leaf 3; title and responsibility display',
      }),
      witness({
        witnessId: 'witness.local-yuanhai-export',
        role: 'local_text',
        sourceId: 'source.local.yuanhai-ziping-pdf',
        pageObservationIds: ['page.local.yuanhai.title'],
        exactByteSha256: 'c6225b78d9d49282c5699b63315018a1e17ebf091c50ce4feb3dab465ec25a12',
        exactByteLength: 2710282,
        scope: 'local export title/attribution locator; physical item not observed',
      }),
    ],
    collation: {
      scope: 'bounded_page_display',
      observedComparison: 'The exact SSID-13003376 and Tianyi Pavilion scan leaf 3 observations both record the 徐升編 / 楊淙增校 / 福建余氏鐫梓 responsibility display, while the local export exposes only a narrower 楊淙 attribution; this is a bounded two-scan display collation, not proof of a shared item or plate.',
      rawSequence: ['徐升編', '楊淙增校', '福建余氏鐫梓'],
      wordingVariants: ['楊淙校 / 楊淙増校', '鐫梓 / publisher or carving responsibility wording'],
      omissionsAdditions: ['The local S03 label does not expose the full scan responsibility display.', 'The two scan observations do not close printed-folio, plate, physical-item, or transmission identity.'],
      orderingDifferences: [],
      editorialLayer: 'responsibility display and catalog metadata, not semantic text',
      semanticEquivalenceResult: 'not_applicable_to_text_meaning; identity-layer observation only',
    },
    readiness: readiness({
      historical_witness_observed: true,
      edition_collated: true,
      local_lineage_resolved: false,
      semantic_equivalence_checked: false,
      independence_resolved: false,
      promotion_ready: false,
    }, {
      historical_witness_observed: proven(['page.commons.yuanhai.ssid-13003376.leaf-3-responsibility'], 'Exact scan bytes and page 3 were visually reviewed.'),
      edition_collated: proven(['page.tianyige.yuanhai.ming-chongzhen.scan-5007.leaf-3', 'page.commons.yuanhai.ssid-13003376.leaf-3-responsibility'], 'Two exact scan leaves were visually compared for the bounded responsibility display; full printed-folio, plate, and edition identity remain unresolved.'),
      local_lineage_resolved: missing(['blocker.local-to-physical-item', 'blocker.yuanhai-ziping-lineage'], ['local S03 export -> exact historical physical item', 'SSID scan -> cataloged institutional item'], 'The role display does not connect the local bytes to the scan or catalog item.'),
      semantic_equivalence_checked: missing([], ['a semantic text claim distinct from the identity observation'], 'No semantic proposition is being promoted from this page.'),
      independence_resolved: missing(['record.cinii.yuanhai-bb08850892', 'record.aks.yuanhai-yanhaiziping'], ['physical-item identity and transmission relation among scan and records'], 'External records are corroboration only, not independent textual witnesses.'),
      promotion_ready: missing(['blocker.yuanhai-ziping-lineage'], ['all preceding readiness gates'], 'Promotion is fail-closed.'),
    }),
  },
  {
    claimId: 'claim.yuanhai-seasonal-lichun-clause',
    workIds: ['yuanhai-zi-ping'],
    claimFamily: 'lichun-month-command-jie-boundary',
    proposition: 'A bounded local p.4 / NLC-99036 printed p.34–35 / Tianyi leaf 19 correspondence exists for the seasonal clause family 立春念三丙火用 / 餘日甲木旺提綱 and 小暑十日丁火旺 / 後來三日乙木芳.',
    scope: 'bounded raw seasonal-clause correspondence; not a general 立春 or 節 boundary rule',
    adjudicationStatus: 'independence_unresolved',
    semanticAuthorityStatus: 'not_established',
    sourceFrontierEvidence: sourceEvidence({
      sourceIds: ['source.local.yuanhai-ziping-pdf', 'source.nlc.yuanhai-ziping.unknown-date.scan-99036', 'source.tianyige.yuanhai-zi-ping.ming-chongzhen.scan-5007'],
      pageObservationIds: ['page.local.yuanhai.p4-seasonal-calendar', 'page.nlc.yuanhai.99036.leaf-52-seasonal-song', 'page.nlc.yuanhai.99036.leaf-53-seasonal-qi-song', 'page.tianyige.yuanhai.ming-chongzhen.scan-5007.leaf-19'],
      claimRelationIds: ['relation.lichun-month-command-jie-boundary'],
      blockerIds: ['blocker.timing-page-locators', 'blocker.cross-edition-collation', 'blocker.local-to-physical-item'],
    }),
    externalRecordIds: [],
    witnesses: [
      witness({
        witnessId: 'witness.local-yuanhai-p4',
        role: 'local_text',
        sourceId: 'source.local.yuanhai-ziping-pdf',
        pageObservationIds: ['page.local.yuanhai.p4-seasonal-calendar'],
        exactByteSha256: 'c6225b78d9d49282c5699b63315018a1e17ebf091c50ce4feb3dab465ec25a12',
        exactByteLength: 2710282,
        scope: 'local PDF page 4',
      }),
      witness({
        witnessId: 'witness.nlc-99036-seasonal',
        role: 'historical_scan_a',
        sourceId: 'source.nlc.yuanhai-ziping.unknown-date.scan-99036',
        pageObservationIds: ['page.nlc.yuanhai.99036.leaf-52-seasonal-song', 'page.nlc.yuanhai.99036.leaf-53-seasonal-qi-song'],
        exactByteSha256: 'fca66e109aae987a5a04dc623e5168680d227542e13b56cdd7c39b62e55b605f',
        exactByteLength: 6429274,
        scope: 'scan leaves 52–53; printed pages 三四–三五',
      }),
      witness({
        witnessId: 'witness.tianyige-yuanhai-leaf-19',
        role: 'historical_scan_b',
        sourceId: 'source.tianyige.yuanhai-zi-ping.ming-chongzhen.scan-5007',
        pageObservationIds: ['page.tianyige.yuanhai.ming-chongzhen.scan-5007.leaf-19'],
        exactByteSha256: '93a4fe97798eb7c3c35122f307447ce5e931a9a4012e558520fe9052c16a295f',
        exactByteLength: 133016361,
        scope: 'scan leaf 19; printed folio not exposed',
      }),
    ],
    collation: {
      scope: 'bounded_three_witness_raw_text',
      observedComparison: 'Local p.4 and NLC leaves 52–53 visibly share the seasonal clause family; Tianyi leaf 19 independently exposes the same clause family in a different vertical plate/layout.',
      rawSequence: ['立春念三丙火用', '餘日甲木旺提綱', '小暑十日丁火旺', '後來三日乙木芳'],
      wordingVariants: ['local modern punctuation/composition vs traditional scan punctuation', 'local page layout differs from the institutional vertical plates'],
      omissionsAdditions: ['The local page compresses/retains a different layout; full surrounding seasonal text is not normalized here.'],
      orderingDifferences: [],
      editorialLayer: 'seasonal song / page layout',
      semanticEquivalenceResult: 'bounded_text_family_correspondence_only; general 立春/節 boundary meaning remains unchecked',
    },
    readiness: readiness({
      historical_witness_observed: true,
      edition_collated: true,
      local_lineage_resolved: false,
      semantic_equivalence_checked: true,
      independence_resolved: false,
      promotion_ready: false,
    }, {
      historical_witness_observed: proven(['page.nlc.yuanhai.99036.leaf-52-seasonal-song', 'page.tianyige.yuanhai.ming-chongzhen.scan-5007.leaf-19'], 'Two exact scan witnesses were visually reviewed.'),
      edition_collated: proven(['relation.lichun-month-command-jie-boundary', 'page.nlc.yuanhai.99036.leaf-52-seasonal-song', 'page.nlc.yuanhai.99036.leaf-53-seasonal-qi-song'], 'The bounded page/printed-folio correspondence was recorded.'),
      local_lineage_resolved: missing(['blocker.local-to-physical-item', 'blocker.timing-page-locators'], ['local p.4 -> exact historical physical item and printed plate'], 'A local-to-item crosswalk remains open.'),
      semantic_equivalence_checked: proven(['relation.lichun-month-command-jie-boundary'], 'Only bounded raw sequence comparison was checked; no semantic authority is inferred.'),
      independence_resolved: missing(['lineage.commons-yuanhai-trusted-to-tianyige', 'blocker.cross-edition-collation'], ['textual transmission and physical independence of NLC-99036, Tianyi, and local export'], 'Different witnesses are not automatically independent.'),
      promotion_ready: missing(['blocker.cross-edition-collation', 'blocker.local-to-physical-item'], ['local lineage, independence, and authority gates'], 'Promotion is fail-closed.'),
    }),
  },
  {
    claimId: 'claim.yuanhai-dayun-start-age',
    workIds: ['yuanhai-zi-ping'],
    claimFamily: 'three-days-one-year-start-age',
    proposition: 'The local p.9, Tianyi leaf 18, SSID leaf 24, and NLC-99036 leaf 50 locate 起運 / 論大運 / 折除三日以為一歲 material, but the current local start-age calculation is not yet collation-ready.',
    scope: 'section and timing-conversion locator only',
    adjudicationStatus: 'insufficient_evidence',
    semanticAuthorityStatus: 'not_established',
    sourceFrontierEvidence: sourceEvidence({
      sourceIds: ['source.local.yuanhai-ziping-pdf', 'source.tianyige.yuanhai-zi-ping.ming-chongzhen.scan-5007', 'source.commons.yuanhai-ziping.sao-ye-shan-fang.ssid-13003376', 'source.nlc.yuanhai-ziping.unknown-date.scan-99036'],
      pageObservationIds: ['page.local.yuanhai.p9-dayun-section', 'page.tianyige.yuanhai.ming-chongzhen.scan-5007.leaf-18', 'page.commons.yuanhai.ssid-13003376.leaf-24-qiyun', 'page.nlc.yuanhai.99036.leaf-50-start-fortune'],
      claimRelationIds: ['relation.three-days-one-year-start-age', 'relation.dayun-direction', 'relation.dayun-progression'],
      blockerIds: ['blocker.timing-page-locators', 'blocker.cross-edition-collation', 'blocker.local-to-physical-item'],
    }),
    externalRecordIds: [],
    witnesses: [
      witness({
        witnessId: 'witness.local-yuanhai-p9',
        role: 'local_text',
        sourceId: 'source.local.yuanhai-ziping-pdf',
        pageObservationIds: ['page.local.yuanhai.p9-dayun-section'],
        exactByteSha256: 'c6225b78d9d49282c5699b63315018a1e17ebf091c50ce4feb3dab465ec25a12',
        exactByteLength: 2710282,
        scope: 'local PDF page 9',
      }),
      witness({
        witnessId: 'witness.nlc-99036-dayun',
        role: 'historical_scan_a',
        sourceId: 'source.nlc.yuanhai-ziping.unknown-date.scan-99036',
        pageObservationIds: ['page.nlc.yuanhai.99036.leaf-50-start-fortune'],
        exactByteSha256: 'fca66e109aae987a5a04dc623e5168680d227542e13b56cdd7c39b62e55b605f',
        exactByteLength: 6429274,
        scope: 'scan leaf 50; printed page 三二',
      }),
      witness({
        witnessId: 'witness.tianyige-yuanhai-leaf-18',
        role: 'historical_scan_b',
        sourceId: 'source.tianyige.yuanhai-zi-ping.ming-chongzhen.scan-5007',
        pageObservationIds: ['page.tianyige.yuanhai.ming-chongzhen.scan-5007.leaf-18'],
        exactByteSha256: '93a4fe97798eb7c3c35122f307447ce5e931a9a4012e558520fe9052c16a295f',
        exactByteLength: 133016361,
        scope: 'scan leaf 18; printed folio not exposed',
      }),
    ],
    collation: {
      scope: 'bounded_section_locator',
      observedComparison: 'The same broad topic and conversion phrase family is located across witnesses, but no exact local p.9 to printed-folio surrounding-text collation is retained.',
      rawSequence: ['論起大運', '凡起大運俱從所生之日', '過去節俱折除三日以為一歲'],
      wordingVariants: ['section headings and surrounding examples differ by witness/layout'],
      omissionsAdditions: ['Exact local/historical paragraph boundaries and all adjacent examples remain untranscribed.'],
      orderingDifferences: [],
      editorialLayer: 'timing section locator',
      semanticEquivalenceResult: 'not_checked_beyond_locator_level',
    },
    readiness: readiness({
      historical_witness_observed: true,
      edition_collated: false,
      local_lineage_resolved: false,
      semantic_equivalence_checked: false,
      independence_resolved: false,
      promotion_ready: false,
    }, {
      historical_witness_observed: proven(['page.nlc.yuanhai.99036.leaf-50-start-fortune', 'page.tianyige.yuanhai.ming-chongzhen.scan-5007.leaf-18'], 'Historical section locators were directly observed.'),
      edition_collated: missing(['relation.three-days-one-year-start-age'], ['local p.9 -> exact printed folios and surrounding text', 'edition-specific variant record'], 'The current evidence is a locator set, not a full collation.'),
      local_lineage_resolved: missing(['blocker.local-to-physical-item'], ['local p.9 source chain to a historical item'], 'Local PDF lineage remains unresolved.'),
      semantic_equivalence_checked: missing(['blocker.cross-edition-collation'], ['bounded paragraph-level comparison and normalized meaning check'], 'Section names do not establish semantic equivalence.'),
      independence_resolved: missing(['blocker.cross-edition-collation'], ['textual and physical independence across timing witnesses'], 'Witness multiplicity is not independence.'),
      promotion_ready: missing(['blocker.timing-page-locators', 'blocker.cross-edition-collation'], ['all preceding readiness gates'], 'Promotion is fail-closed.'),
    }),
  },
  {
    claimId: 'claim.ziping-yongshin',
    workIds: ['ziping-zhenquan'],
    claimFamily: 'day-master-month-command',
    proposition: 'Local 子平真詮 p.6–p.7, NLC 1926 leaves 23–24, NTL 1926 pages 111–112, and the NLC 35296 pages 26–27 provide a bounded 論用神 / 八字用神 page-sequence correspondence with simplified/traditional and punctuation variants.',
    scope: 'bounded raw text-family and page-sequence collation; not semantic authority',
    adjudicationStatus: 'independence_unresolved',
    semanticAuthorityStatus: 'not_established',
    sourceFrontierEvidence: sourceEvidence({
      sourceIds: ['source.local.ziping-zhenquan-pdf', 'source.nlc.ziping-zhenquan.1926.v2', 'source.ntl.ziping-zhenquan.1926.v2', 'source.nlc.ziping-zhenquan.unknown-republican.scan-35296'],
      pageObservationIds: ['page.local.ziping.p6-yongshin', 'page.local.ziping.p7-yongshin-continuation', 'page.nlc.ziping.v2.leaf-23-yongshin', 'page.nlc.ziping.v2.leaf-24-yongshin-continuation', 'page.ntl.ziping.v2.leaf-111-yongshin', 'page.ntl.ziping.v2.leaf-112-yongshin-continuation', 'page.commons.nlc.ziping.35296.page-26-yongshin', 'page.commons.nlc.ziping.35296.page-27-yongshin-continuation'],
      claimRelationIds: ['relation.day-master-month-command'],
      blockerIds: ['blocker.local-to-physical-item', 'blocker.yuanhai-ziping-lineage', 'blocker.cross-edition-collation'],
    }),
    externalRecordIds: [],
    witnesses: [
      witness({
        witnessId: 'witness.local-ziping-yongshin',
        role: 'local_text',
        sourceId: 'source.local.ziping-zhenquan-pdf',
        pageObservationIds: ['page.local.ziping.p6-yongshin', 'page.local.ziping.p7-yongshin-continuation'],
        exactByteSha256: '449336b5e35aa6811b0462093d0175c45a0add44065bf2d3845cff75981db692',
        exactByteLength: 580320,
        scope: 'local PDF pages 6–7',
      }),
      witness({
        witnessId: 'witness.nlc-ziping-1926-yongshin',
        role: 'historical_scan_a',
        sourceId: 'source.nlc.ziping-zhenquan.1926.v2',
        pageObservationIds: ['page.nlc.ziping.v2.leaf-23-yongshin', 'page.nlc.ziping.v2.leaf-24-yongshin-continuation'],
        exactByteSha256: 'b1ac0a7dd4dc260647b65bd9338ad815fc0855d78e0ea01ed428237b28eb61c8',
        exactByteLength: 2088007,
        scope: 'scan leaves 23–24; printed pages 一○ and continuation',
      }),
      witness({
        witnessId: 'witness.ntl-ziping-1926-yongshin',
        role: 'historical_scan_b',
        sourceId: 'source.ntl.ziping-zhenquan.1926.v2',
        pageObservationIds: ['page.ntl.ziping.v2.leaf-111-yongshin', 'page.ntl.ziping.v2.leaf-112-yongshin-continuation'],
        exactByteSha256: '02f8771f69b6d5650ca3a20e629b9351a1f0f71c24f36f3eb11631495505f483',
        exactByteLength: 68883628,
        scope: 'scan pages 111–112; printed folios 一○–一一',
      }),
      witness({
        witnessId: 'witness.nlc-35296-ziping-yongshin',
        role: 'historical_scan_c',
        sourceId: 'source.nlc.ziping-zhenquan.unknown-republican.scan-35296',
        pageObservationIds: ['page.commons.nlc.ziping.35296.page-26-yongshin', 'page.commons.nlc.ziping.35296.page-27-yongshin-continuation'],
        exactByteSha256: '71402a780b0351b54edf121a51bc4a4a4ce5896496c35b954563ee06f1a6f620',
        exactByteLength: 7126096,
        scope: 'PDF pages 26–27; printed pages 十七–十八',
      }),
    ],
    collation: {
      scope: 'bounded_four_witness_raw_text',
      observedComparison: 'The local incipit and immediate continuation were visually compared with NLC 1926, NTL 1926, and NLC 35296 page sequences.',
      rawSequence: ['八字用神', '專求月令', '以日干配月令地支', '而生克不同', '格局分焉'],
      wordingVariants: ['local simplified: 八字用神，专求月令，以日干配月令地支，而生克不同，格局分焉', 'historical traditional: 八字用神。專求月令。以日干配月令地支。而生克不同。格局分焉'],
      omissionsAdditions: ['Full edition-level surrounding-text and plate comparison is not retained.', 'NLC 35296 is a compound scan whose official 126-page extent is not mapped to the observed 287-page segment.'],
      orderingDifferences: ['The four witnesses expose the same bounded section sequence at different scan/printed-page positions; no broader table-of-contents equivalence is asserted.'],
      editorialLayer: 'modern local export versus 1926 institutional scans and a compound NLC scan',
      semanticEquivalenceResult: 'bounded_same_clause_sequence_with_simplified_traditional_punctuation_variants; semantic authority not established',
    },
    readiness: readiness({
      historical_witness_observed: true,
      edition_collated: true,
      local_lineage_resolved: false,
      semantic_equivalence_checked: true,
      independence_resolved: false,
      promotion_ready: false,
    }, {
      historical_witness_observed: proven(['page.nlc.ziping.v2.leaf-23-yongshin', 'page.ntl.ziping.v2.leaf-111-yongshin', 'page.commons.nlc.ziping.35296.page-26-yongshin'], 'Exact historical scan bytes and page images were visually reviewed.'),
      edition_collated: proven(['relation.day-master-month-command', 'page.nlc.ziping.v2.leaf-24-yongshin-continuation', 'page.ntl.ziping.v2.leaf-112-yongshin-continuation'], 'The bounded clause and immediate continuation were compared across witness pages.'),
      local_lineage_resolved: missing(['blocker.local-to-physical-item', 'lineage.local-ziping-to-nlc-35296'], ['local PDF -> historical physical item/plate', 'local export -> 1926 or later NLC/NTL witness'], 'Digital equality or phrase equality does not close historical lineage.'),
      semantic_equivalence_checked: proven(['relation.day-master-month-command'], 'Character, simplified/traditional, punctuation, and page-sequence variants were checked within a bounded scope.'),
      independence_resolved: missing(['blocker.yuanhai-ziping-lineage', 'blocker.cross-edition-collation'], ['independent witness status of NLC/NTL 1926 pair', 'NLC 35296 physical item, edition, and compound-scan segment'], 'The NLC and NTL 1926 candidates are not counted as independent textual witnesses here.'),
      promotion_ready: missing(['blocker.local-to-physical-item', 'blocker.cross-edition-collation'], ['local lineage, independence, and semantic-authority gates'], 'Promotion is fail-closed.'),
    }),
  },
  {
    claimId: 'claim.ziping-xingyun',
    workIds: ['ziping-zhenquan'],
    claimFamily: 'dayun-progression',
    proposition: 'Direct visual review of the exact local PDF p.15, NLC 35296 PDF p.56 / printed folio 四十七, NLC 1926 leaves 43–44 / printed folios 三○–三一, and NTL v2 PDF p.131–p.132 / printed folios 三○–三一 establishes a bounded 論行運 sequence with historical-pair agreement; local lineage, physical independence, and semantic authority remain open.',
    scope: 'bounded local-to-three-historical-witness raw collation; page-boundary, lineage, independence, and semantic authority unresolved',
    adjudicationStatus: 'independence_unresolved',
    semanticAuthorityStatus: 'not_established',
    sourceFrontierEvidence: sourceEvidence({
      sourceIds: ['source.local.ziping-zhenquan-pdf', 'source.nlc.ziping-zhenquan.unknown-republican.scan-35296', 'source.nlc.ziping-zhenquan.1926.v2', 'source.ntl.ziping-zhenquan.1926.v2'],
      pageObservationIds: ['page.local.ziping.p15-xingyun', 'page.commons.nlc.ziping.35296.page-56-dayun', 'page.nlc.ziping.v2.leaf-43-xingyun', 'page.nlc.ziping.v2.leaf-44-xingyun-continuation', 'page.ntl.ziping.v2.leaf-131-xingyun', 'page.ntl.ziping.v2.leaf-132-xingyun-continuation'],
      claimRelationIds: ['relation.dayun-progression'],
      blockerIds: ['blocker.cross-edition-collation', 'blocker.local-to-physical-item'],
    }),
    externalRecordIds: [],
    witnesses: [
      witness({
        witnessId: 'witness.local-ziping-xingyun',
        role: 'local_text',
        sourceId: 'source.local.ziping-zhenquan-pdf',
        pageObservationIds: ['page.local.ziping.p15-xingyun'],
        exactByteSha256: '449336b5e35aa6811b0462093d0175c45a0add44065bf2d3845cff75981db692',
        exactByteLength: 580320,
        scope: 'local PDF page 15 / 二十五、论行运',
      }),
      witness({
        witnessId: 'witness.nlc-35296-xingyun',
        role: 'historical_scan',
        sourceId: 'source.nlc.ziping-zhenquan.unknown-republican.scan-35296',
        pageObservationIds: ['page.commons.nlc.ziping.35296.page-56-dayun'],
        exactByteSha256: '71402a780b0351b54edf121a51bc4a4a4ce5896496c35b954563ee06f1a6f620',
        exactByteLength: 7126096,
        scope: 'PDF page 56; printed page 四十七',
      }),
      witness({
        witnessId: 'witness.nlc-1926-xingyun',
        role: 'historical_scan',
        sourceId: 'source.nlc.ziping-zhenquan.1926.v2',
        pageObservationIds: ['page.nlc.ziping.v2.leaf-43-xingyun', 'page.nlc.ziping.v2.leaf-44-xingyun-continuation'],
        exactByteSha256: 'b1ac0a7dd4dc260647b65bd9338ad815fc0855d78e0ea01ed428237b28eb61c8',
        exactByteLength: 2088007,
        scope: 'PDF/scan pages 43–44; printed folios 三○–三一',
      }),
      witness({
        witnessId: 'witness.ntl-1926-xingyun',
        role: 'historical_scan',
        sourceId: 'source.ntl.ziping-zhenquan.1926.v2',
        pageObservationIds: ['page.ntl.ziping.v2.leaf-131-xingyun', 'page.ntl.ziping.v2.leaf-132-xingyun-continuation'],
        exactByteSha256: '02f8771f69b6d5650ca3a20e629b9351a1f0f71c24f36f3eb11631495505f483',
        exactByteLength: 68883628,
        scope: 'PDF/scan pages 131–132; printed folios 三○–三一',
      }),
    ],
    collation: {
      scope: 'bounded_local_to_three_historical_witness_raw_collation',
      observedComparison: 'Direct visual comparison of local PDF p.15, exact NLC 35296 PDF p.56 / printed folio 四十七, exact NLC 1926 pages 43–44 / printed folios 三○–三一, and exact NTL v.2 pages 131–132 / printed folios 三○–三一 shows the corresponding 論行運 section and the shared progression sequence 故運中每行一字／即必以此一字配命中八字而統觀之／為喜為忌吉凶判然矣. The NLC 1926 and NTL page pairs agree on the bounded section opening and continuation, while NLC 35296 supplies a separate historical page-56 locator; this closes the minimum local↔historical-A↔historical-B observation frontier without closing lineage or semantic authority.',
      rawSequence: ['論行運', '故運中每運行一字', '即必以此一字', '配命中八字而統觀之', '為喜為忌吉凶判然矣', '如官用印以制傷而運助印', '財生官而身輕而運助身', '印帶財以為忌而運剋財', '食帶煞以成格'],
      wordingVariants: ['local p.15 simplified heading 二十五、论行运 and opening 论运与命无二法也', 'NLC 35296 p.56 traditional heading 論行運 and visible sequence 又以動之干支配八字之喜忌／故運中每運行一字', 'NLC 1926 p.43 and NTL v.2 p.131 both show the traditional 論行運 heading and the same bounded progression sequence across printed folio 三○'],
      omissionsAdditions: ['The local p.15 opening is not visible on the bounded NLC 35296 p.56 image; the NLC 1926 and NTL p.131 images supply a separate historical opening/continuation pair.', 'The local and historical passages use simplified/traditional character and punctuation variants; no full paragraph normalization or edition-level equivalence is admitted.'],
      orderingDifferences: [],
      editorialLayer: 'modern local typeset export versus NLC 35296 direct scan plus NLC/NTL 1926 combined-print candidates',
      semanticEquivalenceResult: 'bounded_same_clause_sequence_with_historical_pair_agreement_and_simplified_traditional_and_page_boundary_variants; semantic authority not established',
    },
    readiness: readiness({
      historical_witness_observed: true,
      edition_collated: true,
      local_lineage_resolved: false,
      semantic_equivalence_checked: true,
      independence_resolved: false,
      promotion_ready: false,
    }, {
      historical_witness_observed: proven(['page.commons.nlc.ziping.35296.page-56-dayun', 'page.nlc.ziping.v2.leaf-43-xingyun', 'page.nlc.ziping.v2.leaf-44-xingyun-continuation', 'page.ntl.ziping.v2.leaf-131-xingyun', 'page.ntl.ziping.v2.leaf-132-xingyun-continuation'], 'The exact NLC 35296 page, NLC 1926 page pair, and NTL 1926 page pair were visually reviewed.'),
      edition_collated: proven(['page.local.ziping.p15-xingyun', 'page.commons.nlc.ziping.35296.page-56-dayun', 'page.nlc.ziping.v2.leaf-43-xingyun', 'page.nlc.ziping.v2.leaf-44-xingyun-continuation', 'page.ntl.ziping.v2.leaf-131-xingyun', 'page.ntl.ziping.v2.leaf-132-xingyun-continuation'], 'The local page and three historical witness sets were directly compared within a bounded section and surrounding-page scope; edition identity and full paragraph mapping remain open.'),
      local_lineage_resolved: missing(['blocker.local-to-physical-item'], ['local 子平真詮 source chain to the historical witness set'], 'The bounded page correspondence does not close local source lineage.'),
      semantic_equivalence_checked: proven(['page.local.ziping.p15-xingyun', 'page.commons.nlc.ziping.35296.page-56-dayun', 'page.nlc.ziping.v2.leaf-43-xingyun', 'page.nlc.ziping.v2.leaf-44-xingyun-continuation', 'page.ntl.ziping.v2.leaf-131-xingyun', 'page.ntl.ziping.v2.leaf-132-xingyun-continuation'], 'The bounded text comparison was performed and retained as a raw sequence; the NLC and NTL 1926 pairs agree within the checked scope, but character, punctuation, page-boundary, lineage, and semantic-authority gates remain separate.'),
      independence_resolved: missing(['blocker.cross-edition-collation'], ['physical and textual independence of NLC 35296 versus the NLC/NTL 1926 candidates'], 'The NLC/NTL 1926 scans are same-lineage candidates and NLC 35296 has unresolved date/edition relation; no independence conclusion is admitted.'),
      promotion_ready: missing(['blocker.cross-edition-collation'], ['all preceding readiness gates'], 'Promotion is fail-closed.'),
    }),
  },
  {
    claimId: 'claim.ziping-xiangshen',
    workIds: ['ziping-zhenquan'],
    claimFamily: 'foundational-xiangshen',
    proposition: 'Direct visual review of the exact local PDF p.10–p.11, NLC 1926 leaves 32–33 / printed folios 一九–二○, NTL v2 PDF p.120–p.121 / printed folios 一九–二○, and the NLC 35296 scan p.39–p.40 / printed pages 三十–三十一 plus p.45 / printed page 三十六 establishes a bounded 論相神緊要 locator set. The NLC/NTL 1926 pair agrees against the local omission/addition and surrounding-order variant; NLC 35296 separately shows 輔我用神者是也 and 財旺生官, while its full role clause, date, and lineage remain unresolved.',
    scope: 'bounded local/1926-pair/NLC-35296 raw collation; NLC 35296 phrase presence is admitted, but its full role clause, local cause, surrounding order, lineage, independence, and semantic authority remain unresolved',
    adjudicationStatus: 'semantic_conflict',
    semanticAuthorityStatus: 'not_established',
    sourceFrontierEvidence: sourceEvidence({
      sourceIds: ['source.local.ziping-zhenquan-pdf', 'source.nlc.ziping-zhenquan.1926.v2', 'source.ntl.ziping-zhenquan.1926.v2', 'source.nlc.ziping-zhenquan.unknown-republican.scan-35296'],
      pageObservationIds: ['page.local.ziping.p10-xiangshen', 'page.local.ziping.p11-xiangshen-continuation', 'page.nlc.ziping.v2.leaf-32-xiangshen', 'page.nlc.ziping.v2.leaf-33-xiangshen-continuation', 'page.ntl.ziping.v2.leaf-120-xiangshen', 'page.ntl.ziping.v2.leaf-121-xiangshen-continuation', 'page.commons.nlc.ziping.35296.page-39-xiangshen', 'page.commons.nlc.ziping.35296.page-40-xiangshen-continuation', 'page.commons.nlc.ziping.35296.page-45-next-heading'],
      blockerIds: ['blocker.local-to-physical-item', 'blocker.cross-edition-collation'],
    }),
    externalRecordIds: [],
    researchDossierBoundary: {
      dossierPaths,
      use: 'candidate_map_only',
      canonicalEvidenceImported: false,
      catalogCandidate: { sourceId: 'source.ncl.ziping.gengcun-06599.catalog-rarecatx0441810', observationId: 'page.ncl.ziping.gengcun-06599.catalog-record', status: 'physical_item_catalog_identity_only', textualWitness: 'unresolved', exactDateStatus: 'unresolved_below_清', targetSections: 'not_observed' },
      note: 'The dossier p.120 statement triggered the check, but the admitted evidence is the independently revalidated exact local p.10–p.11, NLC leaves 32–33, NTL pages 120–121, and NLC 35296 pages 39–40/45 observations, not a dossier conclusion or independence label. The 耕寸集 record is retained as catalog identity only and is not admitted into this claim witness set.',
    },
    witnesses: [
      witness({
        witnessId: 'witness.local-ziping-xiangshen',
        role: 'local_text',
        sourceId: 'source.local.ziping-zhenquan-pdf',
        pageObservationIds: ['page.local.ziping.p10-xiangshen', 'page.local.ziping.p11-xiangshen-continuation'],
        exactByteSha256: '449336b5e35aa6811b0462093d0175c45a0add44065bf2d3845cff75981db692',
        exactByteLength: 580320,
        scope: 'local PDF page 10 / 十五、论相神紧要',
      }),
      witness({
        witnessId: 'witness.nlc-ziping-xiangshen',
        role: 'historical_scan_a',
        sourceId: 'source.nlc.ziping-zhenquan.1926.v2',
        pageObservationIds: ['page.nlc.ziping.v2.leaf-32-xiangshen', 'page.nlc.ziping.v2.leaf-33-xiangshen-continuation'],
        exactByteSha256: 'b1ac0a7dd4dc260647b65bd9338ad815fc0855d78e0ea01ed428237b28eb61c8',
        exactByteLength: 2088007,
        scope: 'scan leaves/PDF pages 32–33 / printed folios 一九–二○ / 論相神 and continuation',
      }),
      witness({
        witnessId: 'witness.ntl-ziping-xiangshen',
        role: 'historical_scan_b',
        sourceId: 'source.ntl.ziping-zhenquan.1926.v2',
        pageObservationIds: ['page.ntl.ziping.v2.leaf-120-xiangshen', 'page.ntl.ziping.v2.leaf-121-xiangshen-continuation'],
        exactByteSha256: '02f8771f69b6d5650ca3a20e629b9351a1f0f71c24f36f3eb11631495505f483',
        exactByteLength: 68883628,
        scope: 'PDF/scan pages 120–121 / printed folios 一九–二○ / 論相神 and continuation',
      }),
      witness({
        witnessId: 'witness.nlc-35296-xiangshen',
        role: 'historical_scan_c_unresolved_date',
        sourceId: 'source.nlc.ziping-zhenquan.unknown-republican.scan-35296',
        pageObservationIds: ['page.commons.nlc.ziping.35296.page-39-xiangshen', 'page.commons.nlc.ziping.35296.page-40-xiangshen-continuation', 'page.commons.nlc.ziping.35296.page-45-next-heading'],
        exactByteSha256: '71402a780b0351b54edf121a51bc4a4a4ce5896496c35b954563ee06f1a6f620',
        exactByteLength: 7126096,
        scope: 'NLC 35296 PDF pages 39–40 / printed pages 三十–三十一 plus PDF page 45 / printed page 三十六; direct phrase/heading locators only, with date and textual lineage unresolved',
      }),
    ],
    collation: {
      scope: 'bounded_local_to_historical_raw_collation',
      observedComparison: 'Direct visual comparison of local PDF p.10–p.11, exact NLC 1926 leaves 32–33, exact NTL v2 PDF pages 120–121, and exact NLC 35296 PDF pages 39–40/45 shows the corresponding 論相神 locator set. NLC and NTL agree across the checked continuation, while the local text differs in omission/addition and surrounding transition/order. NLC 35296 independently confirms phrase-level presence of 輔我用神者是也 and 財旺生官, but the full role clause after 財旺生官 was not safely transcribed.',
      rawSequence: ['論相神緊要', '月令既得用神', '則別位亦必有相', '若君之有相輔我用神者是也', '如官逢財生', '則官為用', '財為相', '煞為用', '食為相', '傷用神甚於傷身', '氣不甚靈', '神之緊要也', '論雜氣如何取用'],
      wordingVariants: ['local p.10 simplified heading 十五、论相神紧要 and sentence 辅者是也', 'local p.10 visibly includes 财旺生官，则财为用，官为相 before 煞逢食制', 'NLC leaf 32 and NTL p.120 both show traditional heading 論相神緊要 and sentence 若君之有相輔我用神者是也', 'NLC 35296 p.39 visibly shows 論相神緊要, 輔我用神者是也, and 財旺生官; its untranscribed role clause is not normalized into the NLC/NTL sequence'],
      omissionsAdditions: ['The local bounded sentence omits the visible 我用神 wording present on both NLC/NTL 1926 pages.', 'Relative to the NLC/NTL 1926 bounded pair, the local bounded passage includes 财旺生官，则财为用，官为相 and a different surrounding order; this is not a claim that 財旺生官 is absent from every historical scan, because NLC 35296 p.39 directly shows the phrase.', 'NLC p.33 and NTL p.121 continue with 氣不甚靈／神之緊要也 and then 論雜氣如何取用; local p.10–p.11 instead exposes expanded examples and a different local section boundary.', 'NLC 35296 p.39 phrase presence is direct, but the complete role clause after 財旺生官 remains not transcribed and cannot resolve the conflict cause.'],
      orderingDifferences: ['Historical p.32→33 and p.120→121 page pairs share the same continuation order; the local p.10→11 surrounding order diverges after the 論相神 examples.'],
      editorialLayer: 'modern local typeset export versus NLC and NTL 1926 direct scans; NLC 35296 is an additional unresolved-date direct scan, not a resolved edition layer',
      witnessScopedObservations: { nlc35296: { sourceId: 'source.nlc.ziping-zhenquan.unknown-republican.scan-35296', pageObservationIds: ['page.commons.nlc.ziping.35296.page-39-xiangshen', 'page.commons.nlc.ziping.35296.page-40-xiangshen-continuation', 'page.commons.nlc.ziping.35296.page-45-next-heading'], observedPhrases: ['輔我用神者是也', '財旺生官'], roleClauseAfterCaiWangShengGuan: { status: 'not_transcribed', text: null } } },
      semanticEquivalenceResult: 'bounded_edition_variant_with_historical_pair_agreement_local_omission_addition_and_surrounding_order_variant_plus_nlc35296_phrase_presence; full_role_clause_and_conflict_cause_unresolved; semantic equivalence not established',
    },
    readiness: readiness({
      historical_witness_observed: true,
      edition_collated: true,
      local_lineage_resolved: false,
      semantic_equivalence_checked: true,
      independence_resolved: false,
      promotion_ready: false,
    }, {
      historical_witness_observed: proven(['page.nlc.ziping.v2.leaf-32-xiangshen', 'page.nlc.ziping.v2.leaf-33-xiangshen-continuation', 'page.ntl.ziping.v2.leaf-120-xiangshen', 'page.ntl.ziping.v2.leaf-121-xiangshen-continuation', 'page.commons.nlc.ziping.35296.page-39-xiangshen', 'page.commons.nlc.ziping.35296.page-40-xiangshen-continuation', 'page.commons.nlc.ziping.35296.page-45-next-heading'], 'Exact NLC and NTL page pairs / printed folios 一九–二○ were visually reviewed, and NLC 35296 pages 39–40/45 add phrase-level and boundary observations. NLC 35296 remains unresolved as to exact date and textual lineage.'),
      edition_collated: proven(['page.local.ziping.p10-xiangshen', 'page.local.ziping.p11-xiangshen-continuation', 'page.nlc.ziping.v2.leaf-32-xiangshen', 'page.nlc.ziping.v2.leaf-33-xiangshen-continuation', 'page.ntl.ziping.v2.leaf-120-xiangshen', 'page.ntl.ziping.v2.leaf-121-xiangshen-continuation', 'page.commons.nlc.ziping.35296.page-39-xiangshen', 'page.commons.nlc.ziping.35296.page-40-xiangshen-continuation', 'page.commons.nlc.ziping.35296.page-45-next-heading'], 'The local p.10–p.11, both 1926 historical page pairs, and the NLC 35296 phrase/boundary pages were reviewed within a bounded raw-collation scope; NLC 35296 full role context remains untranscribed.'),
      local_lineage_resolved: missing(['blocker.local-to-physical-item'], ['local PDF -> NTL physical item/edition/plate', 'source chain for the local typeset export'], 'The page-level correspondence does not close local historical lineage.'),
      semantic_equivalence_checked: proven(['page.local.ziping.p10-xiangshen', 'page.local.ziping.p11-xiangshen-continuation', 'page.nlc.ziping.v2.leaf-32-xiangshen', 'page.nlc.ziping.v2.leaf-33-xiangshen-continuation', 'page.ntl.ziping.v2.leaf-120-xiangshen', 'page.ntl.ziping.v2.leaf-121-xiangshen-continuation', 'page.commons.nlc.ziping.35296.page-39-xiangshen', 'page.commons.nlc.ziping.35296.page-40-xiangshen-continuation', 'page.commons.nlc.ziping.35296.page-45-next-heading'], 'The bounded comparison records the 1926-pair conflict and NLC 35296 phrase presence; the NLC 35296 role clause and conflict cause remain unresolved, so this gate records the check, not a positive equivalence result.'),
      independence_resolved: missing(['blocker.cross-edition-collation'], ['independent textual witness and physical-item relation'], 'One local export and one NTL scan do not establish independence.'),
      promotion_ready: missing([], ['all preceding readiness gates'], 'Promotion is fail-closed.'),
    }),
  },
  {
    claimId: 'claim.qiongtong-spring-jia-wood',
    workIds: ['qiongtong-baojian'],
    claimFamily: 'foundational-seasonal-strength',
    proposition: 'Local 窮通寶鑑 p.3–p.5, NLC 1926 leaves 4–6, NLC 1937 leaves 13–15, and Waseda leaves 7–11 share a bounded seasonal page sequence; the Waseda run additionally exposes 正月甲木 / 二月甲木 / 三月甲木 headings on leaves 9–11.',
    scope: 'bounded raw clause and page-sequence correspondence across four witness sets; not authoritative edition or semantic rule',
    adjudicationStatus: 'independence_unresolved',
    semanticAuthorityStatus: 'not_established',
    sourceFrontierEvidence: sourceEvidence({
      sourceIds: ['source.local.qiongtong-baojian-pdf', 'source.nlc.qiongtong-baojian.1926.v2', 'source.nlc.qiongtong-baojian.1937.scan-48608', 'source.waseda.qiongtong-baojian.undated.scan-f0111'],
      pageObservationIds: ['page.local.qiongtong.p3-wood-section', 'page.local.qiongtong.p4-spring-jia-wood', 'page.local.qiongtong.p5-spring-jia-wood-continuation', 'page.nlc.qiongtong.v2.leaf-4-surrounding', 'page.nlc.qiongtong.v2.leaf-5-spring-jia-wood', 'page.nlc.qiongtong.v2.leaf-6-surrounding', 'page.nlc.qiongtong.1937.scan-48608.leaf-13-surrounding', 'page.nlc.qiongtong.1937.scan-48608.leaf-14-spring-jia-wood', 'page.nlc.qiongtong.1937.scan-48608.leaf-15-surrounding', 'page.waseda.qiongtong.undated.scan-f0111.leaf-7-surrounding', 'page.waseda.qiongtong.undated.scan-f0111.leaf-8', 'page.waseda.qiongtong.undated.scan-f0111.leaf-9-surrounding', 'page.waseda.qiongtong.undated.scan-f0111.leaf-9-zhengyue-jia-mu', 'page.waseda.qiongtong.undated.scan-f0111.leaf-10-eryue-jia-mu', 'page.waseda.qiongtong.undated.scan-f0111.leaf-11-sanyue-jia-mu'],
      claimRelationIds: ['relation.qiongtong-jia-wood-season'],
      blockerIds: ['blocker.ditian-qiongtong-later-edited-print', 'blocker.cross-edition-collation', 'blocker.local-to-physical-item'],
    }),
    externalRecordIds: [],
    witnesses: [
      witness({
        witnessId: 'witness.local-qiongtong-spring-jia',
        role: 'local_text',
        sourceId: 'source.local.qiongtong-baojian-pdf',
        pageObservationIds: ['page.local.qiongtong.p3-wood-section', 'page.local.qiongtong.p4-spring-jia-wood', 'page.local.qiongtong.p5-spring-jia-wood-continuation'],
        exactByteSha256: '36d54cdc995d203fdceafcb52b2a0d4f57093ab1765c532db5418b46a96c4b19',
        exactByteLength: 1547911,
        scope: 'local PDF pages 3–5',
      }),
      witness({
        witnessId: 'witness.nlc-qiongtong-1926',
        role: 'historical_scan_a',
        sourceId: 'source.nlc.qiongtong-baojian.1926.v2',
        pageObservationIds: ['page.nlc.qiongtong.v2.leaf-4-surrounding', 'page.nlc.qiongtong.v2.leaf-5-spring-jia-wood', 'page.nlc.qiongtong.v2.leaf-6-surrounding'],
        exactByteSha256: 'a64fa0d6ec4bfea80fafbcaa230bc65f476bf1efabca232934992bac4eb3f7f2',
        exactByteLength: 4121030,
        scope: 'scan leaves 4–6; printed folios 三–五',
      }),
      witness({
        witnessId: 'witness.nlc-qiongtong-1937',
        role: 'historical_scan_b',
        sourceId: 'source.nlc.qiongtong-baojian.1937.scan-48608',
        pageObservationIds: ['page.nlc.qiongtong.1937.scan-48608.leaf-13-surrounding', 'page.nlc.qiongtong.1937.scan-48608.leaf-14-spring-jia-wood', 'page.nlc.qiongtong.1937.scan-48608.leaf-15-surrounding'],
        exactByteSha256: 'b7f17fc7fcb7d8faa991efa74d0db391c5066a3793b3fc6787d2612bc6b350a8',
        exactByteLength: 7487682,
        scope: 'scan leaves 13–15; printed pages 5–6 where exposed',
      }),
      witness({
        witnessId: 'witness.waseda-qiongtong',
        role: 'historical_scan_c',
        sourceId: 'source.waseda.qiongtong-baojian.undated.scan-f0111',
        pageObservationIds: ['page.waseda.qiongtong.undated.scan-f0111.leaf-7-surrounding', 'page.waseda.qiongtong.undated.scan-f0111.leaf-8', 'page.waseda.qiongtong.undated.scan-f0111.leaf-9-surrounding', 'page.waseda.qiongtong.undated.scan-f0111.leaf-9-zhengyue-jia-mu', 'page.waseda.qiongtong.undated.scan-f0111.leaf-10-eryue-jia-mu', 'page.waseda.qiongtong.undated.scan-f0111.leaf-11-sanyue-jia-mu'],
        exactByteSha256: '123ce84b44bd20ecfdd6538bffc413a5e3948598315cd99f857a5c985c7257ae',
        exactByteLength: 82323986,
        scope: 'scan leaves 7–9; undated institutional scan',
      }),
    ],
    collation: {
      scope: 'bounded_four_witness_raw_text',
      observedComparison: 'The local clause and surrounding page order were visually compared with the NLC 1926, NLC 1937, and Waseda scan runs; Waseda leaves 9–11 were additionally reviewed for the consecutive monthly 甲木 headings.',
      rawSequence: ['春月之木', '漸有生長之象', '初春猶有餘寒', '當以火溫暖', '則木無盤屈之變'],
      wordingVariants: ['local simplified forms versus traditional institutional forms', 'annotation, punctuation, and vertical-layout differences remain witness-specific'],
      omissionsAdditions: ['Full surrounding variants, plate genealogy, and author/editorial history are not resolved.'],
      orderingDifferences: ['The witness runs expose different leaf/page offsets; only bounded local sequence, adjacent-page order, and Waseda leaves 9–11 monthly-heading sequence are recorded.'],
      editorialLayer: 'modern local rendering versus undated/1926/1937 institutional scans',
      semanticEquivalenceResult: 'bounded_same_clause_sequence; no authoritative semantic equivalence or edition selection',
    },
    readiness: readiness({
      historical_witness_observed: true,
      edition_collated: true,
      local_lineage_resolved: false,
      semantic_equivalence_checked: true,
      independence_resolved: false,
      promotion_ready: false,
    }, {
      historical_witness_observed: proven(['page.nlc.qiongtong.v2.leaf-5-spring-jia-wood', 'page.nlc.qiongtong.1937.scan-48608.leaf-14-spring-jia-wood', 'page.waseda.qiongtong.undated.scan-f0111.leaf-8', 'page.waseda.qiongtong.undated.scan-f0111.leaf-9-zhengyue-jia-mu', 'page.waseda.qiongtong.undated.scan-f0111.leaf-10-eryue-jia-mu', 'page.waseda.qiongtong.undated.scan-f0111.leaf-11-sanyue-jia-mu'], 'Three historical scan sets were directly observed; the Waseda seasonal-heading run was extended through scan leaf 11.'),
      edition_collated: proven(['relation.qiongtong-jia-wood-season', 'page.nlc.qiongtong.v2.leaf-4-surrounding', 'page.nlc.qiongtong.1937.scan-48608.leaf-15-surrounding', 'page.waseda.qiongtong.undated.scan-f0111.leaf-9-surrounding', 'page.waseda.qiongtong.undated.scan-f0111.leaf-9-zhengyue-jia-mu', 'page.waseda.qiongtong.undated.scan-f0111.leaf-10-eryue-jia-mu', 'page.waseda.qiongtong.undated.scan-f0111.leaf-11-sanyue-jia-mu'], 'Bounded page order, clause sequence, and Waseda monthly-heading sequence were compared.'),
      local_lineage_resolved: missing(['blocker.local-to-physical-item', 'lineage.waseda-qiongtong-undated-to-nlc-1926'], ['local PDF -> any identified historical item', 'local export -> witness-set transmission path'], 'Local lineage remains open.'),
      semantic_equivalence_checked: proven(['relation.qiongtong-jia-wood-season'], 'Only a bounded raw clause comparison was checked.'),
      independence_resolved: missing(['blocker.ditian-qiongtong-later-edited-print', 'blocker.cross-edition-collation'], ['textual independence and edition relation across Waseda/NLC 1926/NLC 1937'], 'Multiple scans may share a later edited transmission.'),
      promotion_ready: missing(['blocker.ditian-qiongtong-later-edited-print', 'blocker.cross-edition-collation'], ['local lineage, independence, and authority gates'], 'Promotion is fail-closed.'),
    }),
  },
]

export const SAJU_FIVE_CLASSICS_CLAIMS = Object.freeze(CLAIMS)

const summarize = claims => ({
  claimCount: claims.length,
  adjudicationStatusCounts: Object.fromEntries(SAJU_FIVE_CLASSICS_ADJUDICATION_STATUSES.map(status => [status, claims.filter(claim => claim.adjudicationStatus === status).length])),
  readinessTrueCounts: Object.fromEntries(SAJU_FIVE_CLASSICS_READINESS_KEYS.map(key => [key, claims.filter(claim => claim.readiness[key] === true).length])),
  promotionReadyClaimIds: claims.filter(claim => claim.readiness.promotion_ready).map(claim => claim.claimId),
})

const sourceFrontierIdentity = sourceFrontier => ({
  artifactPath: SAJU_FIVE_CLASSICS_SOURCE_FRONTIER_PATH,
  schemaVersion: sourceFrontier?.schemaVersion || null,
  version: sourceFrontier?.version || null,
  basisHead: sourceFrontier?.basisHead || null,
  contentSha256: sourceFrontier?.contentSha256 || null,
  artifactPayloadSha256: sourceFrontier?.artifactIdentity?.artifactPayloadSha256 || null,
  counts: sourceFrontier?.inventory?.counts || null,
})

export function buildSajuFiveClassicsClaimAdjudication({ basisHead, sourceFrontier } = {}) {
  const claims = structuredClone(SAJU_FIVE_CLASSICS_CLAIMS)
  const evidenceObservationIds = [...new Set(claims.flatMap(claim => claim.sourceFrontierEvidence.pageObservationIds))]
  const artifact = {
    schemaVersion: SAJU_FIVE_CLASSICS_CLAIM_ADJUDICATION_SCHEMA,
    version: SAJU_FIVE_CLASSICS_CLAIM_ADJUDICATION_VERSION,
    basisHead,
    sourceFrontier: sourceFrontierIdentity(sourceFrontier),
    researchDossierBoundary: {
      paths: dossierPaths,
      usedAs: 'candidate_map_only',
      canonicalImport: false,
      independenceImport: false,
      authorityImport: false,
      note: 'Attached Manus dossier documents and crop are research inputs only. Their conclusions, independence labels, and authority/readiness claims are not imported as canonical evidence.',
    },
    externalRecordObservations: structuredClone(SAJU_FIVE_CLASSICS_EXTERNAL_RECORD_OBSERVATIONS),
    claims,
    adjudicationSummary: summarize(claims),
    readiness: {
      status: 'blocked',
      availableForInterpretation: false,
      productionActivation: 'blocked',
      semanticAuthority: 'not_established',
      stableClaimPromotionCount: 0,
      reason: 'Claim-level page collations narrow the frontier but local lineage, edition identity, independence, and/or semantic authority remain unresolved for every candidate.',
    },
    inventory: {
      claimIds: claims.map(claim => claim.claimId).sort(),
      externalRecordIds: SAJU_FIVE_CLASSICS_EXTERNAL_RECORD_OBSERVATIONS.map(record => record.recordId).sort(),
      sourceFrontierEvidenceObservationIds: evidenceObservationIds.sort(),
      counts: {
        claims: claims.length,
        externalRecordObservations: SAJU_FIVE_CLASSICS_EXTERNAL_RECORD_OBSERVATIONS.length,
        sourceFrontierEvidenceObservationIds: evidenceObservationIds.length,
      },
    },
    contentSha256: null,
  }
  artifact.contentSha256 = contentHash(artifact)
  return artifact
}

export function contentHash(artifact) {
  const copy = structuredClone(artifact)
  delete copy.contentSha256
  delete copy.artifactIdentity
  return sha256(Buffer.from(canonicalIdentityJson(copy)))
}

const allReferenceIds = sourceFrontier => new Set([
  ...(sourceFrontier?.sources || []).map(item => item.sourceId),
  ...(sourceFrontier?.pageObservations || []).map(item => item.observationId),
  ...(sourceFrontier?.claimRelations || []).map(item => item.relationId),
  ...(sourceFrontier?.lineageRelations || []).map(item => item.relationId),
  ...(sourceFrontier?.blockers || []).map(item => item.blockerId),
  ...(sourceFrontier?.works || []).map(item => item.workId),
])

export function checkSajuFiveClassicsClaimAdjudication(artifact, { sourceFrontier } = {}) {
  const errors = []
  const fail = message => errors.push(message)
  if (!artifact || typeof artifact !== 'object' || Array.isArray(artifact)) return ['artifact_shape_invalid']
  if (artifact.schemaVersion !== SAJU_FIVE_CLASSICS_CLAIM_ADJUDICATION_SCHEMA) fail('schema_version')
  if (artifact.version !== SAJU_FIVE_CLASSICS_CLAIM_ADJUDICATION_VERSION) fail('version')
  if (artifact.researchDossierBoundary?.canonicalImport !== false || artifact.researchDossierBoundary?.independenceImport !== false || artifact.researchDossierBoundary?.authorityImport !== false) fail('dossier_boundary')
  if (artifact.readiness?.availableForInterpretation !== false || artifact.readiness?.productionActivation !== 'blocked' || artifact.readiness?.semanticAuthority !== 'not_established' || artifact.readiness?.stableClaimPromotionCount !== 0) fail('readiness_or_activation')

  const sourceIds = allReferenceIds(sourceFrontier)
  const externalRecordIds = new Set((artifact.externalRecordObservations || []).map(record => record.recordId))
  const claimIds = new Set()
  for (const claim of artifact.claims || []) {
    if (claimIds.has(claim.claimId)) fail('claim_duplicate:' + claim.claimId)
    claimIds.add(claim.claimId)
    if (!SAJU_FIVE_CLASSICS_ADJUDICATION_STATUSES.includes(claim.adjudicationStatus)) fail('adjudication_status:' + claim.claimId)
    if (!Array.isArray(claim.workIds) || !claim.workIds.length) fail('claim_work_missing:' + claim.claimId)
    for (const workId of claim.workIds || []) if (!sourceIds.has(workId)) fail('claim_work_unknown:' + claim.claimId + ':' + workId)
    for (const sourceId of claim.sourceFrontierEvidence?.sourceIds || []) if (!sourceIds.has(sourceId)) fail('claim_source_unknown:' + claim.claimId + ':' + sourceId)
    for (const observationId of claim.sourceFrontierEvidence?.pageObservationIds || []) if (!sourceIds.has(observationId)) fail('claim_observation_unknown:' + claim.claimId + ':' + observationId)
    for (const relationId of claim.sourceFrontierEvidence?.claimRelationIds || []) if (!sourceIds.has(relationId)) fail('claim_relation_unknown:' + claim.claimId + ':' + relationId)
    for (const blockerId of claim.sourceFrontierEvidence?.blockerIds || []) if (!sourceIds.has(blockerId)) fail('claim_blocker_unknown:' + claim.claimId + ':' + blockerId)
    for (const recordId of claim.externalRecordIds || []) if (!externalRecordIds.has(recordId)) fail('claim_record_unknown:' + claim.claimId + ':' + recordId)
    const readinessEvidence = claim.readiness?.readinessEvidence || {}
    for (const key of SAJU_FIVE_CLASSICS_READINESS_KEYS) {
      if (typeof claim.readiness?.[key] !== 'boolean') fail('readiness_boolean:' + claim.claimId + ':' + key)
      const evidence = readinessEvidence[key]
      if (!evidence || !['proven', 'missing'].includes(evidence.status)) fail('readiness_evidence:' + claim.claimId + ':' + key)
      if (claim.readiness?.[key] === true && (evidence.status !== 'proven' || !evidence.evidenceRefs?.length)) fail('readiness_true_without_evidence:' + claim.claimId + ':' + key)
      if (claim.readiness?.[key] === false && evidence.status === 'proven') fail('readiness_false_proven:' + claim.claimId + ':' + key)
      for (const ref of evidence?.evidenceRefs || []) if (!sourceIds.has(ref) && !externalRecordIds.has(ref)) fail('readiness_ref_unknown:' + claim.claimId + ':' + ref)
    }
    if (claim.readiness?.promotion_ready && !SAJU_FIVE_CLASSICS_READINESS_KEYS.filter(key => key !== 'promotion_ready').every(key => claim.readiness[key])) fail('promotion_prerequisite:' + claim.claimId)
    if (claim.adjudicationStatus === 'stable_candidate' && !claim.readiness?.promotion_ready) fail('stable_without_promotion:' + claim.claimId)
    if (claim.readiness?.promotion_ready || claim.semanticAuthorityStatus === 'established') fail('claim_promoted:' + claim.claimId)
    for (const item of claim.witnesses || []) {
      if (!sourceIds.has(item.sourceId)) fail('witness_source_unknown:' + claim.claimId + ':' + item.witnessId)
      for (const observationId of item.pageObservationIds || []) {
        const observation = (sourceFrontier?.pageObservations || []).find(candidate => candidate.observationId === observationId)
        if (!observation) fail('witness_observation_unknown:' + claim.claimId + ':' + item.witnessId + ':' + observationId)
        else if (observation.sourceId !== item.sourceId) fail('witness_observation_source_mismatch:' + claim.claimId + ':' + item.witnessId + ':' + observationId)
      }
    }
  }
  const xiangshen = artifact.claims?.find(claim => claim.claimId === 'claim.ziping-xiangshen')
  const xiangshenRoleClause = xiangshen?.collation?.witnessScopedObservations?.nlc35296?.roleClauseAfterCaiWangShengGuan
  if (xiangshen && (xiangshenRoleClause?.status !== 'not_transcribed' || xiangshenRoleClause?.text !== null)) fail('xiangshen_role_clause_overclaim')
  const catalogCandidate = xiangshen?.researchDossierBoundary?.catalogCandidate
  if (catalogCandidate) {
    if (!sourceIds.has(catalogCandidate.sourceId) || !sourceIds.has(catalogCandidate.observationId)) fail('xiangshen_catalog_candidate_ref_unknown')
    if (catalogCandidate.textualWitness !== 'unresolved' || catalogCandidate.exactDateStatus !== 'unresolved_below_清' || catalogCandidate.targetSections !== 'not_observed') fail('xiangshen_catalog_candidate_boundary')
  }
  if (xiangshen?.adjudicationStatus === 'semantic_conflict' && (xiangshen.semanticAuthorityStatus === 'established' || xiangshen.readiness?.promotion_ready === true)) fail('xiangshen_conflict_promoted')
  if (artifact.inventory?.counts?.claims !== (artifact.claims || []).length) fail('inventory_claim_count')
  if (artifact.inventory?.counts?.externalRecordObservations !== (artifact.externalRecordObservations || []).length) fail('inventory_record_count')
  const summary = summarize(artifact.claims || [])
  if (canonicalIdentityJson(summary) !== canonicalIdentityJson(artifact.adjudicationSummary)) fail('adjudication_summary')
  if (artifact.contentSha256 !== contentHash(artifact)) fail('content_hash')
  return [...new Set(errors)].sort()
}

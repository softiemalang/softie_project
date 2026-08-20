import { createHash } from 'node:crypto'

import { canonicalIdentityJson } from '../artifactIdentity.js'

export const SAJU_GEMINI_V7_PARENT_SCHEMA = 'saju-gemini-v7-parent-adjudication'
export const SAJU_GEMINI_V7_PARENT_VERSION = '7.0.0'

export const GATE_KEYS = Object.freeze(['H', 'E', 'L', 'S', 'I', 'P'])
export const GATE_STATES = Object.freeze(['satisfied', 'unresolved', 'conflicted', 'not_applicable'])
export const CLAIM_STATUSES = Object.freeze(['kept', 'corrected', 'rejected', 'unresolved'])
export const UNITS = Object.freeze(['A', 'B', 'C', 'D', 'E', 'F'])
export const INDEPENDENCE_AXES = Object.freeze([
  'physical-item',
  'digital-derivation',
  'edition/textual-lineage',
  'semantic-corroboration',
])
export const LINEAGE_EDGE_STATES = Object.freeze([
  'DIRECTLY_SUPPORTED',
  'BIBLIOGRAPHIC_CLAIM_ONLY',
  'HYPOTHESIS',
  'UNSUPPORTED',
  'CONFLICTED',
])

const sha256 = value => createHash('sha256').update(value).digest('hex')
const canonicalHash = value => sha256(Buffer.from(canonicalIdentityJson(value)))

export const V7_CANDIDATE_PACKET = Object.freeze({
  campaign: 'GEMINI-V7-WIDE-ACQUISITION',
  modelClaimedByUser: 'Gemini v7',
  source: 'user_supplied_goal_request',
  packetAvailability: 'not_provided_as_readable_file_in_current_workspace',
  packetFiles: [],
  trustBoundary: 'untrusted_candidate_only',
  importedAsCanonicalEvidence: false,
  importedConclusionFields: [],
  actualModelRuntimeVerified: false,
  sourceTextAndVerdictsImported: false,
  staleParentRejectedClaimsReintroduced: false,
  candidateClaimsRecordedAsLabelsOnly: true,
})

const directPolicy = 'A direct scan or first-party record observation is admitted only at its stated locator and source identity; it is not canonical text, semantic authority, interpretation readiness, or production procedure.'
const sameLineagePolicy = 'Different URLs, institutions, or scan files are not independent textual lineages unless physical-item, digital-derivation, edition/textual-lineage, and semantic-corroboration relations are separately closed.'

const evidence = (evidenceId, unit, sourceCategory, status, details = {}) => ({
  evidenceId,
  unit,
  sourceCategory,
  status,
  ...details,
  scopeBoundary: details.scopeBoundary || directPolicy,
})

export const EXTERNAL_EVIDENCE = Object.freeze([
  evidence('ev.A.nlc99036-p50-p51', 'A', 'DIRECT_DERIVATIVE_SCAN', 'parent_verified_bounded_page', {
    sourceId: 'source.nlc.yuanhai-ziping.unknown-date.scan-99036',
    institution: 'National Library of China digital resource represented by a public scan mirror',
    recordUrl: 'http://read.nlc.cn/allSearch/searchDetail?searchType=24&showType=1&indexName=data_416&fid=15jh007754',
    scan: {
      path: '/private/tmp/nlc-99036-yuanhai-ziping.pdf',
      pageCount: 209,
      byteLength: 6429274,
      byteSha256: 'fca66e109aae987a5a04dc623e5168680d227542e13b56cdd7c39b62e55b605f',
      inspectedPages: [50, 51],
    },
    observed: [
      '頁面標題/版心可見評註淵海子平卷一；p.50–51 are the contiguous 大運 passage and worked examples.',
      '乙丑男命: 初一立春後十五日 → 逆數至初一日立春 → 五三十五 → 五歲運逆行丁丑.',
      '甲子女命: 初一立春後十日; 得九日 → 三三單九 literal variant → 三歲運逆行乙丑.',
      '餘皆倣此 is visible in the same bounded passage.',
    ],
    scopeBoundary: 'The two worked chains and their page order are retained as manual visual locator observations. Exact canonical transcription, printed-folio identity, edition date, and transmission relation remain unresolved.',
  }),
  evidence('ev.A.tianyige-p18', 'A', 'DIRECT_OFFICIAL_SCAN', 'parent_verified_bounded_page', {
    sourceId: 'source.tianyige.yuanhai-zi-ping.ming-chongzhen.scan-5007',
    institution: 'Tianyi Pavilion Museum / Ningbo Cultural Management Committee',
    catalogIdentity: '善2875 / 330000-1705-0005007; 明崇禎刻本',
    scan: {
      path: '/private/tmp/tianyige-5007-current.pdf',
      pageCount: 153,
      byteLength: 133016361,
      byteSha256: '93a4fe97798eb7c3c35122f307447ce5e931a9a4012e558520fe9052c16a295f',
      inspectedPages: [17, 18, 19],
    },
    observed: ['凡起大運 surrounding passage', '俱折除三日以為一歲', '順逆 direction discussion and example continuation'],
    scopeBoundary: 'The general method is direct at the stated scan locator; it does not normalize the NLC/神峰 literal variant or prove transmission among the witnesses.',
  }),
  evidence('ev.A.shenfeng-p20-p24', 'A', 'DIRECT_DERIVATIVE_SCAN', 'parent_verified_bounded_page', {
    sourceId: 'source.shenfeng-tongkao.vol2.scan-nlc511',
    institution: 'Public scan mirror; Shanghai Library holding stamp observed in the parent inspection',
    scan: {
      path: '/private/tmp/shenfeng-tongkao-vol2.pdf',
      pageCount: 168,
      byteLength: 6708084,
      byteSha256: 'ccb21cf1215a1e487fe79497839f9343534af42e3af6c1e7dd04f3faea9289',
      inspectedPages: [20, 21, 22, 23, 24],
    },
    page22: {
      volumeHeading: '神峰通考 卷四',
      folioMark: '二〇',
      sectionHeadings: ['月令詳辨', '起大運法陽男陰女', '起大運法陰男陽女', '子平舉要'],
      exampleOrder: ['甲子陽男 forward example in 起大運法陽男陰女', '乙丑男逆行 example', '甲子女逆行 example'],
      targetOrder: ['乙丑男命', '甲子女命'],
      exactVisibleVariants: ['五三十五', '三三單九', '餘皆倣此'],
      surroundingParagraph: 'The target examples sit inside a headed 起大運法 passage with year-stem/month-stem setup text and adjacent 月令詳辨/子平舉要 material.',
      omissionAdditionBoundary: 'Relative to the NLC p.50–51 locator, the Shenfeng page visibly adds/retains section headings and 甲己/乙庚 year-to-month setup in the surrounding layout; absence from the NLC locator is not asserted as absence from the whole work.',
    },
    observed: ['same or near-identical target worked examples occur on the stated page', 'the target examples are not an isolated standard fixture independent of source genealogy'],
    scopeBoundary: 'This is a direct occurrence and layout observation only. Same case sharing is not independent corroboration, and exact textual dependence/edition relation remains unresolved.',
  }),
  evidence('ev.A.anu-v2-p57-p60', 'A', 'DIRECT_OFFICIAL_SCAN', 'parent_verified_bounded_page', {
    sourceId: 'source.anu.sanming-tonghui.e0d2d017.v2',
    institution: 'Australian National University Open Research Repository',
    recordUrl: 'https://openresearch-repository.anu.edu.au/items/e0d2d017-f99d-4818-af29-d18754f7e5cd',
    handle: 'http://hdl.handle.net/1885/206524',
    scan: {
      path: '/private/tmp/anu-b22343921-v2.pdf',
      fileName: 'b22343921_v.2.pdf',
      pageCount: 105,
      byteLength: 116179488,
      byteSha256: 'e757a79c45a6e8a6701ba991ef4a3f2d3a6ce038ed0ab8727a21b319698d1dc8',
      inspectedPages: [57, 58, 59, 60],
    },
    observed: [
      'scan 58–59 contain the 論大運 section and its continuation; adjacent pages were inspected for boundary context.',
      'direction family 陽男陰女順行之 / 陰男陽女逆行之 is visibly present.',
      'the preceding/future 節 selection and distance-counting passage is visibly connected to the worked example.',
      '三日為一歲 relation family and a worked start-age/distance example are visibly present.',
    ],
    literalAudit: {
      threeDaysOneYear: 'direct_bounded_observation',
      oneDayFourMonths: 'derived_restatement_only; exact normalized literal not admitted',
      oneTimeUnitTenDays: 'not_admitted_from_this_inspection',
    },
    scopeBoundary: 'Abstract conversion, direction/節 selection, and worked example remain separate observations. No exact first-start timestamp, rounding policy, implementation rule, or production authority is admitted.',
  }),
  evidence('ev.A.wuxingjingji-v4-v5-baseline', 'A', 'PARENT_BASELINE_REFERENCE', 'parent_baseline_preserved', {
    sourceArtifactPaths: [
      'artifacts/saju-gemini-witness-dossier-adjudication-v3/complete.json',
      'artifacts/saju-luna-deep-collation-adjudication-v4/complete.json',
      'artifacts/saju-five-classics-typed-readiness-contract-v0/complete.json',
    ],
    observed: ['五行精紀 predecessor claims remain in their prior bounded scope.', 'No automatic same-procedure merge with 淵海子平/神峰通考/三命通會 is admitted.'],
    scopeBoundary: 'A predecessor baseline reference is not new direct page evidence and does not close an independence or implementation gate.',
  }),
  evidence('ev.B.anu-current-item-api', 'B', 'FIRST_PARTY_API_RECORD', 'current_first_party_record_verified', {
    sourceId: 'source.anu.sanming-tonghui.e0d2d017.current-api',
    institution: 'Australian National University Open Research Repository',
    recordUrl: 'https://openresearch-repository.anu.edu.au/items/e0d2d017-f99d-4818-af29-d18754f7e5cd',
    apiUrl: 'https://openresearch-repository.anu.edu.au/server/api/core/items/e0d2d017-f99d-4818-af29-d18754f7e5cd',
    observedMetadata: {
      handle: 'http://hdl.handle.net/1885/206524',
      identifier: 'b22343921',
      title: 'San ming tong hui : 12 juan / Yuwushanren zhu 三命通會 : 十二卷 / 育吾山人著',
      extent: '12 v. (double leaves), oriental style in case',
      relationIsPartOf: 'Xu Dishan',
      provenance: 'Digitised by the Australian National University in 2020',
      collection: 'Chinese Rare Books',
      access: 'Open Access',
    },
    invalidHandleProbe: {
      value: 'http://hdl.handle.net/1885/42211',
      firstPartyUrl: 'https://openresearch-repository.anu.edu.au/handle/1885/42211',
      httpStatus: 404,
      disposition: 'reject_as_current_item_identity',
    },
    scopeBoundary: 'The current record confirms item-level metadata only. Metadata does not establish a physical-volume genealogy, printed edition date, semantic authority, or production rule.',
  }),
  evidence('ev.B.anu-current-original-v1-v12', 'B', 'FIRST_PARTY_API_RECORD', 'current_public_file_list_verified', {
    sourceId: 'source.anu.sanming-tonghui.e0d2d017.current-original-bundle',
    apiUrl: 'https://openresearch-repository.anu.edu.au/server/api/core/bundles/c11f2f3d-396b-43b1-b5b1-d2ce29a3f047/bitstreams?size=100',
    originalBundle: 'c11f2f3d-396b-43b1-b5b1-d2ce29a3f047',
    currentBitstreamCount: 24,
    pdfNames: ['b22343921_v.1.pdf', 'b22343921_v.2.pdf', 'b22343921_v.3.pdf', 'b22343921_v.4.pdf', 'b22343921_v.5.pdf', 'b22343921_v.6.pdf', 'b22343921_v.7.pdf', 'b22343921_v.8.pdf', 'b22343921_v.9.pdf', 'b22343921_v.10.pdf', 'b22343921_v.11.pdf', 'b22343921_v.12.pdf'],
    tifNames: ['b22343921_v.1.tif', 'b22343921_v.2.tif', 'b22343921_v.3.tif', 'b22343921_v.4.tif', 'b22343921_v.5.tif', 'b22343921_v.6.tif', 'b22343921_v.7.tif', 'b22343921_v.8.tif', 'b22343921_v.9.tif', 'b22343921_v.10.tif', 'b22343921_v.11.tif', 'b22343921_v.12.tif'],
    v6ToV12HeadStatus: Object.freeze({
      'b22343921_v.6.pdf': 200,
      'b22343921_v.7.pdf': 200,
      'b22343921_v.8.pdf': 200,
      'b22343921_v.9.pdf': 200,
      'b22343921_v.10.pdf': 200,
      'b22343921_v.11.pdf': 200,
      'b22343921_v.12.pdf': 200,
    }),
    scopeBoundary: 'This current API/file-list observation supports public bitstream enumeration and HTTP availability. It does not prove that each file was page-inspected, maps each file to a printed 卷, or establishes independent physical/textual lineages.',
  }),
  evidence('ev.B.parent-anu-v1-v5-snapshot', 'B', 'PARENT_BASELINE_REFERENCE', 'historical_snapshot_preserved', {
    sourceArtifactPaths: [
      'artifacts/saju-five-classics-research-continuation-v1/complete.json',
      'artifacts/saju-gemini-v6-parent-adjudication/complete.json',
    ],
    observed: ['Parent-confirmed direct bytes included ANU V1–V5 and the V2 hash/page audit.', 'The predecessor wording is preserved as a historical snapshot and is not rewritten.'],
    currentDifference: 'The current first-party ORIGINAL bundle API now enumerates V1–V12; this is a current-record correction, not a retroactive rewrite of predecessor artifact bytes.',
    scopeBoundary: 'Historical baseline validity and current repository exposure are separate states.',
  }),
  evidence('ev.C.gengcun-ncl-catalog', 'C', 'INSTITUTIONAL_METADATA', 'parent_verified_catalog_only', {
    sourceId: 'source.ncl.ziping.gengcun-06599.catalog-rarecatx0441810',
    institution: 'National Central Library, Taiwan',
    catalogId: 'rarecatx0441810 / 06599 / 306.5 06599',
    url: 'https://rbook.ncl.edu.tw/NCLSearch/Search/SearchDetail?item=00ccfe6380184da28912a57393deb2d7fDI2NTQ0NQ2.PBlfBdELN3au83ZWddAblOP5Y3FBX8h5SLzXyf79aB4_&page=1030&sourceWhereString=&SourceID=1&HasImage=',
    observed: ['耕寸集不分卷', '清敬一堂鈔本', '清', '線裝1冊', '石研齋／秦氏印', '有微捲'],
    targetPageStatus: 'not_obtained',
    scopeBoundary: 'Catalog identity and the recorded seal/provenance wording are retained; no seal application date, manuscript production date, target-page citation, or explicit 三命通會 relation is admitted.',
  }),
  evidence('ev.C.qin-enfu-authority', 'C', 'INSTITUTIONAL_METADATA', 'parent_verified_person_scope', {
    observed: ['秦恩復 1760–1843', '石研齋 room-name attribution'],
    scopeBoundary: 'Person authority and room-name attribution do not prove seal ownership, seal application chronology, or manuscript production date.',
  }),
  evidence('ev.C.no-new-dating-source', 'C', 'UNRESOLVED', 'dating_gate_unresolved', {
    observed: ['No actual 耕寸集 page with a source/title citation was newly obtained.', 'No authoritative provenance chronology was newly obtained.', 'Content parallel remains a comparison lead, not a dated witness.'],
    scopeBoundary: 'TAQ/TPQ and content-parallel dating cannot be re-promoted without the missing source/title or provenance chronology.',
  }),
  evidence('ev.D.waseda-record-f0111', 'D', 'INSTITUTIONAL_METADATA', 'parent_verified_first_party_record', {
    sourceId: 'source.waseda.qiongtong-baojian.undated.scan-f0111',
    institution: 'Waseda University Library / Fūryō Bunko Special Collections',
    catalogId: '文庫19 F0111',
    url: 'https://www.wul.waseda.ac.jp/kotenseki/html/bunko19/bunko19_f0111/index.html',
    pdfUrl: 'https://archive.wul.waseda.ac.jp/kosho/bunko19/bunko19_f0111/bunko19_f0111.pdf',
    observed: ['窮通宝鑑欄江綱 : 二巻首一巻坿増補月談', '[清]・余星堂監定 ; 清・余春台輯 ; 清・曾寄廛校閲', '[出版地不明 : 出版者不明]', '合1冊 ; 唐小', '封面記:新鐫命理秘訣', '巻第二板心下記:集賢堂'],
    scopeBoundary: 'The official item record separates catalog identity, attribution, imprint boundary, cover note, and plate-heart note from publication date and genealogy.',
  }),
  evidence('ev.D.waseda-pages-f0111', 'D', 'DIRECT_OFFICIAL_SCAN', 'parent_verified_bounded_page', {
    sourceId: 'source.waseda.qiongtong-baojian.undated.scan-f0111',
    scan: {
      path: '/private/tmp/waseda-bunko19-f0111.pdf',
      pageCount: 108,
      byteLength: 82323986,
      byteSha256: '123ce84b44bd20ecfdd6538bffc413a5e3948598315cd99f857a5c985c7257ae',
      inspectedPages: [2, 4, 8, 9, 10, 11],
    },
    observed: ['新鐫命理秘訣', '集賢堂', '楚南余星堂先生鑑定', '繹谷余春臺編輯', '正月甲木', '二月甲木', '三月甲木'],
    scopeBoundary: 'These are direct Waseda record/page observations only; 光緒原刊, copy date, full genealogy, and transmission are not inferred.',
  }),
  evidence('ev.E.mingli-yueyan-public-lead', 'E', 'BIBLIOGRAPHIC_WITNESS', 'acquisition_lead_only', {
    candidateTitle: '《命理約言》',
    relatedPublicObject: '《精選命理約言》, NLC416-17jh002578-109774',
    publicMirrorUrl: 'https://commons.wikimedia.org/wiki/File:NLC416-17jh002578-109774_%E7%B2%BE%E9%81%B8%E5%91%BD%E7%90%86%E7%B4%84%E8%A8%80.pdf',
    observed: ['A public mirror identifies a related 1935 《精選命理約言》 object attributed to NLC metadata.', 'The exact 《命理約言》 institutional item/page required by the candidate gate was not established in this pass.'],
    institutionalItemConfirmed: false,
    actualTargetPageConfirmed: false,
    claimsVerified: [],
    scopeBoundary: 'The lead is not a first-party institutional item plus actual target page. 起運法, 三日一歲, 一日四月, and 一時辰十日 remain unverified acquisition claims.',
  }),
  evidence('ev.F.ziping-1895-1923-search', 'F', 'INSTITUTIONAL_METADATA', 'parent_verified_negative_search', {
    institution: 'Shanghai Library public catalog API',
    url: 'https://vufind.library.sh.cn/api/v1/search',
    queries: [
      { term: '子平真詮 報暉草堂', resultCount: 5, itemLevelTargetFound: false },
      { term: '子平真詮 紹興育新書局', resultCount: 1, itemLevelTargetFound: false },
    ],
    observed: ['No first-party item/catalog ID and date-bearing target scan for the 1895 candidate was parent-verified.', 'No first-party item/catalog ID and date-bearing target scan for the 1923 candidate was parent-verified.'],
    scopeBoundary: 'This bounded search is not proof that the editions do not exist; it is not sufficient for canonical item/date/page admission.',
  }),
  evidence('ev.F.hukun-1776-secondary', 'F', 'BIBLIOGRAPHIC_WITNESS', 'parent_verified_secondary_only', {
    observed: ['A secondary/e-text reading gives 胡焜序 as 乾隆四十一年歲在丙申, i.e. 1776.'],
    rejectedReading: '1773',
    scopeBoundary: 'The 1776 reading corrects the secondary transcription only. The original preface page and relation to either target edition remain unresolved.',
  }),
  evidence('ev.F.no-first-party-target-pages', 'F', 'UNRESOLVED', 'target_page_unresolved', {
    observed: ['No actual 1895 報暉草堂 target page was admitted.', 'No actual 1923 育新書局 target page was admitted.', 'No first-party original preface page was admitted.'],
    scopeBoundary: 'No date, 用神, 相神, 行運, or edition genealogy claim is promoted from the candidate leads.',
  }),
])

export const PAGE_OBSERVATIONS = Object.freeze([
  {
    observationId: 'obs.A.nlc99036-乙丑男-p51',
    unit: 'A',
    evidenceId: 'ev.A.nlc99036-p50-p51',
    sourceId: 'source.nlc.yuanhai-ziping.unknown-date.scan-99036',
    pageLocator: 'scan PDF p.51; printed-folio crosswalk unresolved',
    pageHeader: '評註淵海子平 卷一',
    surroundingText: '陰男陽女逆運…乙丑年…初一立春後十五日生男…逆數至初一日立春…五三十五…五歲運逆行丁丑…餘皆倣此。',
    chain: { birthCondition: '乙丑年; 男命; 初一立春後十五日生', direction: '陰男陽女逆運', selectedJie: '初一立春', distance: '十五日', conversion: '五三十五', startAge: '五歲', firstDaYun: '丁丑; 逆行' },
    canonicalTextObserved: false,
    transcriptionStatus: 'manual_visual_locator_only',
    semanticAuthority: 'not_established',
    scopeBoundary: directPolicy,
  },
  {
    observationId: 'obs.A.nlc99036-甲子女-p51',
    unit: 'A',
    evidenceId: 'ev.A.nlc99036-p50-p51',
    sourceId: 'source.nlc.yuanhai-ziping.unknown-date.scan-99036',
    pageLocator: 'scan PDF p.51; printed-folio crosswalk unresolved',
    pageHeader: '評註淵海子平 卷一',
    surroundingText: '如甲子年…初一立春後十日生女…逆數至初一日立春止…得九日…三三單九…三歲運逆行乙丑…餘皆倣此。',
    chain: { birthCondition: '甲子年; 女命; 初一立春後十日生; 節距九日表記', direction: '陰男陽女逆運', selectedJie: '初一立春', distance: '得九日', conversion: '三三單九 (literal variant observed)', startAge: '三歲', firstDaYun: '乙丑; 逆行' },
    canonicalTextObserved: false,
    transcriptionStatus: 'manual_visual_locator_only',
    semanticAuthority: 'not_established',
    scopeBoundary: directPolicy,
  },
  {
    observationId: 'obs.A.shenfeng-page22-layout',
    unit: 'A',
    evidenceId: 'ev.A.shenfeng-p20-p24',
    sourceId: 'source.shenfeng-tongkao.vol2.scan-nlc511',
    pageLocator: 'scan PDF p.22; printed folio mark 二〇',
    heading: '神峰通考 卷四 / 月令詳辨 / 起大運法陽男陰女 / 起大運法陰男陽女 / 子平舉要',
    exampleOrder: ['甲子陽男 forward example', '乙丑男 reverse example', '甲子女 reverse example'],
    targetExampleOrder: ['乙丑男', '甲子女'],
    exactVariantObservations: ['五三十五', '三三單九', '餘皆倣此'],
    omissionAddition: {
      addedOrVisibleInShenfengContext: ['section headings', '甲己之年丙作首 / 乙庚之歲戊為頭 setup', '正月建丙寅 / 戊寅 setup', 'adjacent 月令詳辨 and 子平舉要 material'],
      notNormalizedAgainstNlc: true,
    },
    canonicalTextObserved: false,
    transcriptionStatus: 'manual_visual_layout_and_locator_only',
    semanticAuthority: 'not_established',
    scopeBoundary: 'The direct page confirms occurrence, order, heading, and surrounding layout only. It does not establish standard-fixture status or independent lineage.',
  },
  {
    observationId: 'obs.A.anu-p58-p59-rule-and-example',
    unit: 'A',
    evidenceId: 'ev.A.anu-v2-p57-p60',
    sourceId: 'source.anu.sanming-tonghui.e0d2d017.v2',
    pageLocator: 'ANU V2 scan pages 58–59; adjacent scan pages 57 and 60 checked',
    sectionHeading: '論大運',
    precedingAndNextJie: 'The visible passage counts toward the future or prior 節 according to the direction family; exact modern normalization is not admitted.',
    observed: ['陽男陰女順行之', '陰男陽女逆行之', '三日為一歲 relation family', 'worked distance/start-age example'],
    literalAudit: { threeDaysOneYear: 'direct_bounded', oneDayFourMonths: 'derived_only', oneTimeUnitTenDays: 'not_admitted' },
    canonicalTextObserved: false,
    transcriptionStatus: 'manual_visual_locator_only',
    semanticAuthority: 'not_established',
    scopeBoundary: 'Rule family, 節 selection, and worked example are separate edges; no production timing procedure follows.',
  },
  {
    observationId: 'obs.D.waseda-f0111-cover-and-seasonal-pages',
    unit: 'D',
    evidenceId: 'ev.D.waseda-pages-f0111',
    sourceId: 'source.waseda.qiongtong-baojian.undated.scan-f0111',
    pageLocator: 'official PDF pages 2, 4, 8–11',
    observed: ['新鐫命理秘訣', '集賢堂', '余星堂/余春臺 attribution wording', '正月甲木', '二月甲木', '三月甲木'],
    canonicalTextObserved: false,
    transcriptionStatus: 'manual_visual_locator_only',
    semanticAuthority: 'not_established',
    scopeBoundary: 'Direct observation only; no 光緒原刊, copy date, or genealogy promotion.',
  },
])

const defaultAxisNote = axisName => axisName === 'edition/textual-lineage'
  ? 'Edition and textual-lineage relation is not closed; same-example agreement is not independent lineage.'
  : axisName === 'digital-derivation'
    ? 'Digital byte identity or a public URL does not establish independent capture or derivation.'
    : axisName === 'physical-item'
      ? 'Institution/item identity is not by itself a second independent physical witness.'
      : 'No independent semantic authority is admitted.'

const axis = (axisName, { state = 'unresolved', refs = [], sameLineageCandidate = false, note = defaultAxisNote(axisName), missingEdges = [] } = {}) => ({
  requirement: 'required',
  policyRequirement: 'required',
  state,
  countedAsIndependent: false,
  sameLineageCandidate,
  evidenceRefs: [...refs],
  missingEdges: state === 'satisfied' ? [] : (missingEdges.length ? [...missingEdges] : [`I.${axisName}:unresolved`]),
  note,
})

const gate = (name, state, refs, note, missingEdges = []) => ({
  gate: name,
  policyRequirement: 'required',
  requirement: 'required',
  state,
  evidenceRefs: [...refs],
  missingEdges: state === 'satisfied' || state === 'not_applicable' ? [] : (missingEdges.length ? [...missingEdges] : [`${name}:${state}`]),
  note,
})

const makeClaim = ({
  claimId,
  unit,
  candidateAssertion,
  status,
  refs = [],
  directRefs = [],
  scopeCorrection,
  gateStates = {},
  axisOptions = {},
  contaminationClassification = null,
  realBlockers = [],
  falseBlockers = [],
  promotionTarget = 'historical_observation_stability',
}) => {
  const axes = Object.fromEntries(INDEPENDENCE_AXES.map(name => [name, axis(name, axisOptions[name])]))
  const gates = {}
  gates.H = gate('H', gateStates.H || (directRefs.length ? 'satisfied' : 'unresolved'), directRefs.length ? directRefs : refs, directRefs.length ? 'Parent directly inspected the stated scan page or first-party record at bounded scope.' : 'No parent-verified historical page closes this candidate assertion.', directRefs.length ? [] : ['H:direct witness missing'])
  gates.E = gate('E', gateStates.E || (directRefs.length ? 'satisfied' : 'unresolved'), directRefs.length ? directRefs : refs, directRefs.length ? 'Edition/record context is recorded without widening the claim.' : 'Edition/record relation remains unresolved.', directRefs.length ? [] : ['E:edition or record relation unresolved'])
  gates.L = gate('L', gateStates.L || 'unresolved', refs, 'Local-to-target-copy or transmission lineage is not closed.', ['L:local-to-target-copy lineage unresolved'])
  gates.S = gate('S', gateStates.S || 'unresolved', refs, 'Semantic equivalence and authority remain outside the bounded observation.', ['S:semantic authority unresolved'])
  gates.I = { ...gate('I', gateStates.I || 'unresolved', refs, sameLineagePolicy, ['I:independence vector unresolved']), axes }
  gates.P = gate('P', gateStates.P || 'unresolved', [], 'Promotion is independently blocked; no lower-level observation changes production authority.', ['P:promotion requires unresolved gates and parent reconciliation'])
  return {
    claimId,
    unit,
    candidateAssertion,
    status,
    candidateEvidenceAccepted: false,
    parentVerifiedEvidenceRefs: [...new Set([...refs, ...directRefs])],
    scopeCorrection,
    contaminationClassification,
    gates,
    independence: { overallState: gates.I.state, axes, rule: sameLineagePolicy },
    blockerAssessment: { falseBlockers: [...falseBlockers], realBlockers: [...realBlockers] },
    promotion: {
      target: promotionTarget,
      status: 'blocked',
      ready: false,
      blockingEdges: ['I:unresolved', 'P:blocked'],
      reason: 'This v7 overlay does not promote candidate observations into the canonical graph or production authority.',
    },
    semanticAuthority: 'not_established',
    productionActivation: 'blocked',
  }
}

export const V7_CLAIM_IDS = Object.freeze([
  'claim.A.yuanhai-乙丑男-chain',
  'claim.A.yuanhai-甲子女-chain',
  'claim.A.shenfeng-page-order-and-wording',
  'claim.A.shenfeng-standard-fixture',
  'claim.A.same-worked-example-independent-corroboration',
  'claim.A.sanming-rule-family',
  'claim.A.sanming-literal-one-day-four-month',
  'claim.A.sanming-literal-time-unit-ten-day',
  'claim.A.wuxingjingji-same-procedure-auto-merge',
  'claim.B.anu-42211-item-identity',
  'claim.B.anu-206524-item-identity',
  'claim.B.anu-12juan-metadata',
  'claim.B.anu-current-original-v1-v12',
  'claim.B.anu-catalog-extent-to-public-count',
  'claim.B.anu-xudishan-collection-relation',
  'claim.C.gengcun-seal-provenance-candidate',
  'claim.C.gengcun-seal-owner-equals-dating',
  'claim.C.gengcun-TAQ-1843',
  'claim.C.gengcun-TPQ-1578',
  'claim.C.gengcun-qin-enfu-dating',
  'claim.C.gengcun-content-parallel-dating',
  'claim.C.gengcun-dating-gate',
  'claim.D.waseda-direct-record',
  'claim.D.waseda-seasonal-pages',
  'claim.D.waseda-cover-to-physical-date',
  'claim.D.digital-physical-map-as-transmission',
  'claim.D.full-genealogy-directly-supported',
  'claim.E.gengcun-seasonal-block',
  'claim.E.ctext-e-text-as-historical-witness',
  'claim.E.preface-cover-as-physical-edition-date',
  'claim.E.mingli-yueyan-direct-observation',
  'claim.F.1895-baohui-first-party-item',
  'claim.F.1923-yuxin-first-party-item',
  'claim.F.hukun-1773',
  'claim.F.hukun-1776-first-party',
  'claim.F.hukun-1776-secondary-reading',
  'claim.F.actual-target-pages',
  'claim.F.gemini-v7-wholesale-resolution',
])

export const NEGATIVE_CHECK_IDS = Object.freeze([
  'gemini-v7-wholesale-import',
  'catalog-extent-to-public-12-volume-transition',
  'same-worked-case-to-independent-lineage',
  'text-abbreviation-to-independence',
  'seal-owner-lifetime-to-manuscript-taq',
  'metadata-to-transmission-genealogy',
  'cover-preface-to-physical-edition-date',
  'ctext-e-text-to-historical-witness',
  'hypothesis-edge-to-canonical-graph',
  'historical-rule-to-production-authority',
])

const buildClaims = () => [
  makeClaim({
    claimId: 'claim.A.yuanhai-乙丑男-chain', unit: 'A', status: 'kept',
    candidateAssertion: '《淵海子平》乙丑男命例包含十五日、五三十五、五歲與逆行丁丑的完整 bounded chain.',
    refs: ['ev.A.nlc99036-p50-p51', 'obs.A.nlc99036-乙丑男-p51', 'ev.A.tianyige-p18'], directRefs: ['obs.A.nlc99036-乙丑男-p51'],
    scopeCorrection: '乙丑男 chain is kept as a source/page-bounded observation only; no canonical transcription, edition relation, or production rule is promoted.',
    axisOptions: { 'edition/textual-lineage': { sameLineageCandidate: true, refs: ['ev.A.nlc99036-p50-p51', 'ev.A.tianyige-p18'] } },
    realBlockers: ['NLC/Tianyige/神峰 edition-transmission relation unresolved', 'printed-folio crosswalk unresolved'],
  }),
  makeClaim({
    claimId: 'claim.A.yuanhai-甲子女-chain', unit: 'A', status: 'kept',
    candidateAssertion: '《淵海子平》甲子女命例包含得九日、三三單九 variant、三歲與逆行乙丑的 complete bounded chain.',
    refs: ['ev.A.nlc99036-p50-p51', 'obs.A.nlc99036-甲子女-p51', 'ev.A.tianyige-p18'], directRefs: ['obs.A.nlc99036-甲子女-p51'],
    scopeCorrection: 'Printed `得九日` and `三三單九` remain page-specific literal observations; arithmetic 3×3=9 is not used to normalize a different glyph string.',
    axisOptions: { 'edition/textual-lineage': { sameLineageCandidate: true, refs: ['ev.A.nlc99036-p50-p51', 'ev.A.tianyige-p18'] } },
    realBlockers: ['edition/transmission relation unresolved', 'exact literal variant scope unresolved outside the inspected pages'],
  }),
  makeClaim({
    claimId: 'claim.A.shenfeng-page-order-and-wording', unit: 'A', status: 'kept',
    candidateAssertion: '《神峰通考》卷四 p.22 contains headed 大運 sections and the target examples in the order 乙丑男 then 甲子女.',
    refs: ['ev.A.shenfeng-p20-p24', 'obs.A.shenfeng-page22-layout'], directRefs: ['obs.A.shenfeng-page22-layout'],
    scopeCorrection: 'The page order, headings, visible variants, and surrounding paragraph are kept as a direct occurrence/layout observation only.',
    axisOptions: { 'edition/textual-lineage': { sameLineageCandidate: true, refs: ['ev.A.shenfeng-p20-p24', 'ev.A.nlc99036-p50-p51'] } },
    realBlockers: ['textual dependence and item-level edition relation unresolved'],
  }),
  makeClaim({
    claimId: 'claim.A.shenfeng-standard-fixture', unit: 'A', status: 'rejected',
    candidateAssertion: 'The shared 《神峰通考》/《淵海子平》 examples establish a standard canonical fixture.',
    refs: ['ev.A.shenfeng-p20-p24', 'ev.A.nlc99036-p50-p51'],
    scopeCorrection: 'The standard-fixture interpretation is removed. Direct page occurrence does not establish canonical fixture status.',
    gateStates: { S: 'conflicted', I: 'conflicted' },
    axisOptions: { 'edition/textual-lineage': { state: 'conflicted', sameLineageCandidate: true, refs: ['ev.A.shenfeng-p20-p24', 'ev.A.nlc99036-p50-p51'], note: 'Same worked case is a dependence candidate, not a canonical fixture.', missingEdges: ['canonical fixture authority absent'] }, 'semantic-corroboration': { state: 'conflicted', sameLineageCandidate: true, refs: ['ev.A.shenfeng-p20-p24', 'ev.A.nlc99036-p50-p51'], note: 'Shared case is not independent semantic corroboration.', missingEdges: ['independent semantic authority absent'] } },
  }),
  makeClaim({
    claimId: 'claim.A.same-worked-example-independent-corroboration', unit: 'A', status: 'rejected',
    candidateAssertion: 'The same worked example in 《淵海子平》 and 《神峰通考》 is independent lineage corroboration.',
    refs: ['ev.A.nlc99036-p50-p51', 'ev.A.shenfeng-p20-p24'],
    scopeCorrection: 'Same-case sharing is retained as occurrence evidence only; it is explicitly rejected as independent lineage or semantic corroboration.',
    gateStates: { I: 'conflicted', P: 'unresolved' },
    axisOptions: { 'edition/textual-lineage': { state: 'conflicted', sameLineageCandidate: true, refs: ['ev.A.nlc99036-p50-p51', 'ev.A.shenfeng-p20-p24'], note: 'Same or near-identical examples may be dependent; no independent edge is admitted.', missingEdges: ['independent textual-lineage evidence absent'] }, 'semantic-corroboration': { state: 'conflicted', sameLineageCandidate: true, refs: ['ev.A.nlc99036-p50-p51', 'ev.A.shenfeng-p20-p24'], note: 'Same case is not independent semantic corroboration.', missingEdges: ['independent semantic authority absent'] } },
  }),
  makeClaim({
    claimId: 'claim.A.sanming-rule-family', unit: 'A', status: 'corrected',
    candidateAssertion: '《三命通會》ANU actual scan directly supplies direction, 節 selection, 三日一歲, and a worked example.',
    refs: ['ev.A.anu-v2-p57-p60', 'obs.A.anu-p58-p59-rule-and-example'], directRefs: ['obs.A.anu-p58-p59-rule-and-example'],
    scopeCorrection: 'Direction, preceding/next 節 selection, the 三日為一歲 relation family, and worked-example presence are separate bounded observations.',
    gateStates: { S: 'unresolved' },
    realBlockers: ['exact printed-folio/edition crosswalk unresolved', 'exact first-start procedure and semantic authority unresolved'],
  }),
  makeClaim({
    claimId: 'claim.A.sanming-literal-one-day-four-month', unit: 'A', status: 'corrected',
    candidateAssertion: 'ANU p.59 directly prints the normalized literal 一日四月.',
    refs: ['ev.A.anu-v2-p57-p60', 'obs.A.anu-p58-p59-rule-and-example'], directRefs: ['obs.A.anu-p58-p59-rule-and-example'],
    scopeCorrection: '一日四月 is retained only as a derived restatement of the direct 三日為一歲 relation; the exact normalized literal is not admitted from this page inspection.',
    gateStates: { S: 'conflicted' },
    realBlockers: ['literal wording and edition-specific reading unresolved'],
  }),
  makeClaim({
    claimId: 'claim.A.sanming-literal-time-unit-ten-day', unit: 'A', status: 'unresolved',
    candidateAssertion: 'ANU p.59 directly prints 一時辰十日 as an authoritative literal rule.',
    refs: ['ev.A.anu-v2-p57-p60', 'obs.A.anu-p58-p59-rule-and-example'],
    scopeCorrection: 'No direct literal admission is made for 一時辰十日; it remains an acquisition/interpretation lead.',
    realBlockers: ['direct target-page literal and semantic binding unavailable'],
  }),
  makeClaim({
    claimId: 'claim.A.wuxingjingji-same-procedure-auto-merge', unit: 'A', status: 'rejected',
    candidateAssertion: '《五行精紀》 uses the same 大運 procedure and can be automatically merged with the three Unit-A witnesses.',
    refs: ['ev.A.wuxingjingji-v4-v5-baseline'],
    scopeCorrection: 'The v4/v5 parent baseline is preserved without automatic procedure or lineage integration.',
    gateStates: { E: 'conflicted', L: 'conflicted', S: 'conflicted', I: 'conflicted' },
    realBlockers: ['source-specific 五行精紀 procedure/crosswalk and independent relation unresolved'],
  }),
  makeClaim({
    claimId: 'claim.B.anu-42211-item-identity', unit: 'B', status: 'rejected',
    candidateAssertion: 'The ANU item is identified by Rare Books handle 1885/42211.',
    refs: ['ev.B.anu-current-item-api'],
    scopeCorrection: 'The current first-party probe for 1885/42211 returned 404; the parent-confirmed 1885/206524 item identity is retained.',
    gateStates: { H: 'conflicted', E: 'conflicted' },
    realBlockers: ['candidate handle is not a current first-party item identity'],
  }),
  makeClaim({
    claimId: 'claim.B.anu-206524-item-identity', unit: 'B', status: 'kept',
    candidateAssertion: 'The ANU item identity is Handle 1885/206524 / item e0d2d017….',
    refs: ['ev.B.anu-current-item-api'], directRefs: ['ev.B.anu-current-item-api'],
    scopeCorrection: 'Item identity is kept at metadata scope; it does not identify a physical item independently from the record.',
    gateStates: { L: 'unresolved', S: 'not_applicable' },
    axisOptions: { 'semantic-corroboration': { state: 'satisfied', refs: ['ev.B.anu-current-item-api'], note: 'Semantic corroboration is outside this metadata identity claim.', missingEdges: [] } },
    realBlockers: ['physical holding and edition relation unresolved'],
  }),
  makeClaim({
    claimId: 'claim.B.anu-12juan-metadata', unit: 'B', status: 'kept',
    candidateAssertion: 'The current ANU first-party item metadata reports 三命通會 : 十二卷 and 12 v.',
    refs: ['ev.B.anu-current-item-api'], directRefs: ['ev.B.anu-current-item-api'],
    scopeCorrection: 'Twelve-juan extent is kept as catalog metadata only; no text/edition completeness is inferred.',
    gateStates: { L: 'unresolved', S: 'not_applicable' },
    axisOptions: { 'semantic-corroboration': { state: 'satisfied', refs: ['ev.B.anu-current-item-api'], note: 'Semantic corroboration is outside this catalog-extent claim.', missingEdges: [] } },
    realBlockers: ['printed volume mapping and physical completeness unresolved'],
  }),
  makeClaim({
    claimId: 'claim.B.anu-current-original-v1-v12', unit: 'B', status: 'kept',
    candidateAssertion: 'The current first-party ORIGINAL bundle enumerates public PDF/TIF files v1–v12.',
    refs: ['ev.B.anu-current-original-v1-v12'], directRefs: ['ev.B.anu-current-original-v1-v12'],
    scopeCorrection: 'This is a current API enumeration plus bounded HTTP availability observation. It does not admit page content, printed 卷 mapping, or independent physical/textual lineages.',
    gateStates: { L: 'unresolved', S: 'not_applicable' },
    axisOptions: { 'digital-derivation': { refs: ['ev.B.anu-current-original-v1-v12'], note: 'The files are one first-party ORIGINAL bundle; no independent derivation is counted.' }, 'semantic-corroboration': { state: 'satisfied', refs: ['ev.B.anu-current-original-v1-v12'], note: 'Semantic corroboration is outside a file-list claim.', missingEdges: [] } },
    realBlockers: ['page inspection and volume/edition crosswalk unresolved'],
  }),
  makeClaim({
    claimId: 'claim.B.anu-catalog-extent-to-public-count', unit: 'B', status: 'rejected',
    candidateAssertion: 'The catalog extent 12 v. alone proves twelve public digital volumes.',
    refs: ['ev.B.anu-current-item-api', 'ev.B.parent-anu-v1-v5-snapshot'],
    scopeCorrection: 'The catalog-to-public transition is rejected as an inference. The current v1–v12 file-list observation is a separate first-party API evidence edge.',
    gateStates: { H: 'conflicted', E: 'conflicted', L: 'conflicted', S: 'conflicted', I: 'conflicted' },
  }),
  makeClaim({
    claimId: 'claim.B.anu-xudishan-collection-relation', unit: 'B', status: 'kept',
    candidateAssertion: 'The ANU item metadata relates the record to Xu Dishan and the Chinese Rare Books collection.',
    refs: ['ev.B.anu-current-item-api'], directRefs: ['ev.B.anu-current-item-api'],
    scopeCorrection: 'The relation is kept as a first-party metadata field only; it is not a physical provenance chronology or textual genealogy.',
    gateStates: { L: 'unresolved', S: 'not_applicable' },
    axisOptions: { 'semantic-corroboration': { state: 'satisfied', refs: ['ev.B.anu-current-item-api'], note: 'Semantic corroboration is outside this collection metadata claim.', missingEdges: [] } },
    realBlockers: ['physical collection history and item genealogy unresolved'],
  }),
  makeClaim({
    claimId: 'claim.C.gengcun-seal-provenance-candidate', unit: 'C', status: 'kept',
    candidateAssertion: 'The 耕寸集 catalog records 石研齋／秦氏印 as a provenance/seal candidate.',
    refs: ['ev.C.gengcun-ncl-catalog'], directRefs: ['ev.C.gengcun-ncl-catalog'],
    scopeCorrection: 'Catalog-level seal/provenance wording is kept without owner, application date, or manuscript production inference.',
    gateStates: { L: 'unresolved', S: 'not_applicable' },
    axisOptions: { 'semantic-corroboration': { state: 'satisfied', refs: ['ev.C.gengcun-ncl-catalog'], note: 'Semantic corroboration is outside this catalog observation.', missingEdges: [] } },
    realBlockers: ['target folios and seal chronology unavailable'],
  }),
  makeClaim({
    claimId: 'claim.C.gengcun-seal-owner-equals-dating', unit: 'C', status: 'corrected',
    candidateAssertion: '石研齋秦氏印 identifies the seal owner and therefore dates the manuscript.',
    refs: ['ev.C.gengcun-ncl-catalog', 'ev.C.qin-enfu-authority'], directRefs: ['ev.C.gengcun-ncl-catalog'],
    scopeCorrection: 'Seal attribution is separated from seal application date, and application date is separated from manuscript production date.',
    gateStates: { E: 'conflicted', S: 'conflicted' },
    realBlockers: ['seal impression chronology and production evidence unavailable'],
  }),
  makeClaim({
    claimId: 'claim.C.gengcun-TAQ-1843', unit: 'C', status: 'rejected',
    candidateAssertion: '耕寸集 TAQ is 1843 from 秦恩復 lifespan.',
    refs: ['ev.C.qin-enfu-authority', 'ev.C.no-new-dating-source'],
    scopeCorrection: 'The 1843 dating conclusion is rejected; the dating gate remains unresolved.',
    gateStates: { H: 'unresolved', E: 'conflicted', S: 'conflicted' },
    realBlockers: ['authoritative provenance chronology and target folios unavailable'],
  }),
  makeClaim({
    claimId: 'claim.C.gengcun-TPQ-1578', unit: 'C', status: 'rejected',
    candidateAssertion: '耕寸集 TPQ is 1578 from a 三命通會/content relation.',
    refs: ['ev.C.gengcun-ncl-catalog', 'ev.C.no-new-dating-source'],
    scopeCorrection: 'No actual source/title citation or target page closes this date; the 1578 candidate is rejected from canonical dating.',
    gateStates: { H: 'unresolved', E: 'conflicted', S: 'conflicted' },
    contaminationClassification: 'CROSS_TEXT_CONTAMINATION',
    realBlockers: ['actual 耕寸集 source citation and independent dating evidence unavailable'],
  }),
  makeClaim({
    claimId: 'claim.C.gengcun-qin-enfu-dating', unit: 'C', status: 'rejected',
    candidateAssertion: '秦恩復 1760–1843 authority record alone dates the manuscript or seal application.',
    refs: ['ev.C.qin-enfu-authority', 'ev.C.no-new-dating-source'],
    scopeCorrection: 'Person lifespan remains person authority only; no manuscript TAQ/TPQ is derived.',
    gateStates: { H: 'conflicted', E: 'conflicted', S: 'conflicted' },
  }),
  makeClaim({
    claimId: 'claim.C.gengcun-content-parallel-dating', unit: 'C', status: 'rejected',
    candidateAssertion: 'Content parallel with another text supplies a canonical 耕寸集 date.',
    refs: ['ev.C.no-new-dating-source'],
    scopeCorrection: 'Content parallel is retained as an acquisition lead only; it does not date a manuscript without source/title or provenance chronology.',
    gateStates: { H: 'unresolved', E: 'conflicted', S: 'conflicted' },
  }),
  makeClaim({
    claimId: 'claim.C.gengcun-dating-gate', unit: 'C', status: 'unresolved',
    candidateAssertion: '耕寸集 dating gate can be closed from the current public evidence.',
    refs: ['ev.C.gengcun-ncl-catalog', 'ev.C.no-new-dating-source'],
    scopeCorrection: 'Dating remains unresolved until an actual source/title citation or authoritative provenance chronology is obtained.',
    realBlockers: ['authorized target folios or authoritative provenance chronology required'],
  }),
  makeClaim({
    claimId: 'claim.D.waseda-direct-record', unit: 'D', status: 'kept',
    candidateAssertion: 'Waseda bunko19_f0111 official record supports the stated title, attribution, imprint boundary, cover note, and plate-heart note.',
    refs: ['ev.D.waseda-record-f0111'], directRefs: ['ev.D.waseda-record-f0111'],
    scopeCorrection: 'Direct record fields are kept separately from date and genealogy.',
    gateStates: { L: 'unresolved', S: 'not_applicable' },
    axisOptions: { 'semantic-corroboration': { state: 'satisfied', refs: ['ev.D.waseda-record-f0111'], note: 'Semantic corroboration is outside this item-record claim.', missingEdges: [] } },
    realBlockers: ['copy date and edition genealogy unresolved'],
  }),
  makeClaim({
    claimId: 'claim.D.waseda-seasonal-pages', unit: 'D', status: 'kept',
    candidateAssertion: 'Waseda official scan directly shows 新鐫命理秘訣, 集賢堂, attribution wording, and 正月/二月/三月甲木 headings.',
    refs: ['ev.D.waseda-pages-f0111', 'obs.D.waseda-f0111-cover-and-seasonal-pages'], directRefs: ['obs.D.waseda-f0111-cover-and-seasonal-pages'],
    scopeCorrection: 'Page observations remain Waseda-specific and are not transferred to 耕寸集 or a wider genealogy.',
    axisOptions: { 'edition/textual-lineage': { sameLineageCandidate: true, refs: ['ev.D.waseda-pages-f0111'] } },
    realBlockers: ['date and edition genealogy unresolved'],
  }),
  makeClaim({
    claimId: 'claim.D.waseda-cover-to-physical-date', unit: 'D', status: 'rejected',
    candidateAssertion: 'Cover/plate-heart wording establishes the physical edition date or 光緒原刊.',
    refs: ['ev.D.waseda-record-f0111', 'ev.D.waseda-pages-f0111'],
    scopeCorrection: 'Cover, plate-heart, and item metadata do not by themselves establish publication or copy date.',
    gateStates: { E: 'conflicted', L: 'conflicted', S: 'conflicted' },
  }),
  makeClaim({
    claimId: 'claim.D.digital-physical-map-as-transmission', unit: 'D', status: 'rejected',
    candidateAssertion: 'The v7 Digital/Physical Relationship Map is itself a direct transmission genealogy.',
    refs: ['ev.D.waseda-record-f0111', 'ev.D.waseda-pages-f0111'],
    scopeCorrection: 'Digital derivation, physical item, edition/textual lineage, and semantic corroboration are separate claim axes; an arrow is not admitted without its own support.',
    gateStates: { H: 'conflicted', E: 'conflicted', L: 'conflicted', S: 'conflicted', I: 'conflicted' },
  }),
  makeClaim({
    claimId: 'claim.D.full-genealogy-directly-supported', unit: 'D', status: 'corrected',
    candidateAssertion: '欄江網 → 造化元鑰 → 窮通寶鑑 → 徐樂吾系 is fully direct from Waseda/metadata.',
    refs: ['ev.D.waseda-record-f0111', 'ev.D.waseda-pages-f0111'],
    scopeCorrection: 'Only the Waseda item/page observations survive. The broader genealogy is decomposed into non-canonical edges below.',
    gateStates: { E: 'unresolved', L: 'unresolved', S: 'unresolved', I: 'conflicted' },
    realBlockers: ['dated witnesses and direct transmission links required'],
  }),
  makeClaim({
    claimId: 'claim.E.gengcun-seasonal-block', unit: 'E', status: 'rejected',
    candidateAssertion: 'The 正月甲木/丙火/癸水 block is an actual 耕寸集 page observation.',
    refs: ['ev.C.gengcun-ncl-catalog', 'ev.D.waseda-pages-f0111'],
    scopeCorrection: 'The matching seasonal structure is directly observed only in Waseda F0111 in this audit. It is removed from the canonical graph as cross-text contamination.',
    gateStates: { H: 'conflicted', E: 'conflicted', L: 'conflicted', S: 'conflicted' },
    contaminationClassification: 'CROSS_TEXT_CONTAMINATION',
    realBlockers: ['authorized 耕寸集 target page required'],
  }),
  makeClaim({
    claimId: 'claim.E.ctext-e-text-as-historical-witness', unit: 'E', status: 'rejected',
    candidateAssertion: 'ctext/e-text transcription is equivalent to a historical physical scan witness.',
    refs: ['ev.E.mingli-yueyan-public-lead'],
    scopeCorrection: 'Electronic text is locator-only until tied to an identity-linked historical scan and target page.',
    gateStates: { H: 'conflicted', E: 'conflicted', L: 'conflicted', S: 'conflicted' },
  }),
  makeClaim({
    claimId: 'claim.E.preface-cover-as-physical-edition-date', unit: 'E', status: 'rejected',
    candidateAssertion: 'A preface, cover, or plate-heart date is the physical edition publication date.',
    refs: ['ev.F.hukun-1776-secondary', 'ev.D.waseda-record-f0111'],
    scopeCorrection: 'Preface/cover/plate-heart date, copy date, and edition/publication date remain distinct fields.',
    gateStates: { H: 'conflicted', E: 'conflicted', S: 'conflicted' },
  }),
  makeClaim({
    claimId: 'claim.E.mingli-yueyan-direct-observation', unit: 'E', status: 'unresolved',
    candidateAssertion: '《命理約言》 directly confirms 起運法, 三日一歲, 一日四月, and 一時辰十日.',
    refs: ['ev.E.mingli-yueyan-public-lead'],
    scopeCorrection: 'No first-party institutional item plus actual target page was established. The object remains a P0 acquisition lead only.',
    realBlockers: ['first-party institutional item and actual target page required'],
  }),
  makeClaim({
    claimId: 'claim.F.1895-baohui-first-party-item', unit: 'F', status: 'unresolved',
    candidateAssertion: '1895 報暉草堂 《子平真詮》 candidate has a first-party item/page/date identity.',
    refs: ['ev.F.ziping-1895-1923-search', 'ev.F.no-first-party-target-pages'],
    scopeCorrection: 'Candidate remains unresolved; secondary/e-text lead is not first-party item/page evidence.',
    realBlockers: ['first-party item/catalog ID, date-bearing page, and target pages unavailable'],
  }),
  makeClaim({
    claimId: 'claim.F.1923-yuxin-first-party-item', unit: 'F', status: 'unresolved',
    candidateAssertion: '1923 育新書局 《子平真詮》 candidate has a first-party item/page/date identity.',
    refs: ['ev.F.ziping-1895-1923-search', 'ev.F.no-first-party-target-pages'],
    scopeCorrection: 'Candidate remains unresolved; secondary/e-text lead is not first-party item/page evidence.',
    realBlockers: ['first-party item/catalog ID, date-bearing page, and target pages unavailable'],
  }),
  makeClaim({
    claimId: 'claim.F.hukun-1773', unit: 'F', status: 'rejected',
    candidateAssertion: '胡焜序 date is 1773.',
    refs: ['ev.F.hukun-1776-secondary'],
    scopeCorrection: 'The parent-verified secondary reading supports 1776 rather than 1773; neither is promoted as first-party edition date.',
    gateStates: { H: 'conflicted', E: 'unresolved', S: 'conflicted' },
  }),
  makeClaim({
    claimId: 'claim.F.hukun-1776-first-party', unit: 'F', status: 'unresolved',
    candidateAssertion: '胡焜序 1776 is first-party verified and dates the 1895/1923 physical editions.',
    refs: ['ev.F.hukun-1776-secondary', 'ev.F.no-first-party-target-pages'],
    scopeCorrection: '1776 remains a secondary reading only; original preface and target-copy relation are unresolved.',
    realBlockers: ['first-party original preface page and edition/copy relation unavailable'],
  }),
  makeClaim({
    claimId: 'claim.F.hukun-1776-secondary-reading', unit: 'F', status: 'corrected',
    candidateAssertion: 'The secondary reading of 胡焜序 is 1776.',
    refs: ['ev.F.hukun-1776-secondary'], directRefs: ['ev.F.hukun-1776-secondary'],
    scopeCorrection: '1776 is kept only as a corrected secondary/e-text locator reading, not a canonical physical date.',
    gateStates: { E: 'unresolved', S: 'unresolved' },
    realBlockers: ['original page and item-level relation unavailable'],
  }),
  makeClaim({
    claimId: 'claim.F.actual-target-pages', unit: 'F', status: 'unresolved',
    candidateAssertion: 'The 1895/1923 target pages for 用神, 相神, and 行運 were directly inspected.',
    refs: ['ev.F.no-first-party-target-pages'],
    scopeCorrection: 'No target page bytes were admitted; page existence and text remain unresolved.',
    realBlockers: ['first-party target scans/pages unavailable'],
  }),
  makeClaim({
    claimId: 'claim.F.gemini-v7-wholesale-resolution', unit: 'F', status: 'rejected',
    candidateAssertion: 'All Gemini v7 acquisition claims are safe for wholesale parent import and activation.',
    refs: ['ev.B.parent-anu-v1-v5-snapshot', 'ev.C.no-new-dating-source', 'ev.E.mingli-yueyan-public-lead', 'ev.F.no-first-party-target-pages'],
    scopeCorrection: 'The packet remains untrusted_candidate_only. Only bounded parent-verified observations are retained; no wholesale import or promotion occurs.',
    gateStates: { H: 'conflicted', E: 'conflicted', L: 'conflicted', S: 'conflicted', I: 'conflicted', P: 'conflicted' },
    realBlockers: ['first-party target pages, dating evidence, textual lineage, semantic authority, and production grounding remain open'],
  }),
]

const countStates = (claims, key) => Object.fromEntries(GATE_STATES.map(state => [state, claims.filter(claim => claim.gates?.[key]?.state === state).length]))

export function recomputeTypedReadiness(baseline) {
  const baselineClaims = baseline?.claims || []
  const summaryCounts = baseline?.summary?.gateStateCounts
  const before = summaryCounts ? structuredClone(summaryCounts) : Object.fromEntries(GATE_KEYS.map(key => [key, countStates(baselineClaims, key)]))
  const after = structuredClone(before)
  return {
    sourceArtifact: 'artifacts/saju-five-classics-typed-readiness-contract-v0/complete.json',
    method: 'Recomputed from the authoritative v1–v5 typed-readiness claim gate records; v7 adds no canonical claim and therefore changes no baseline gate state.',
    before,
    after,
    changedGateStates: [],
    baselineClaimCount: baselineClaims.length || 13,
    baselinePromotionReadyClaimIds: baselineClaims.filter(claim => claim.promotion?.ready === true).map(claim => claim.claimId),
    promotionReadyClaimIds: [],
    stableClaimPromotionCount: 0,
    availableForInterpretation: false,
    semanticAuthority: 'not_established',
    implementationSafeGrounding: 'not_established',
    productionActivation: 'blocked',
    reason: 'New direct observations are bounded source/metadata observations; they do not satisfy local lineage, independence, semantic authority, or production gates.',
  }
}

const lineageEdges = [
  {
    edgeId: 'edge欄江網-to-造化元鑰',
    from: '欄江網',
    to: '造化元鑰',
    status: 'BIBLIOGRAPHIC_CLAIM_ONLY',
    evidenceRefs: ['ev.D.waseda-record-f0111'],
    rationale: 'The Waseda title/metadata does not directly show transmission to 造化元鑰; the relation survives only as a bibliographic/secondary genealogy lead.',
  },
  {
    edgeId: 'edge欄江網-to-耕寸集',
    from: '欄江網',
    to: '耕寸集',
    status: 'UNSUPPORTED',
    evidenceRefs: ['ev.C.gengcun-ncl-catalog', 'ev.D.waseda-record-f0111'],
    rationale: 'No direct source/title citation or item-level transmission record connects the two works.',
  },
  {
    edgeId: 'edge耕寸集-to-子平真詮',
    from: '耕寸集',
    to: '子平真詮',
    status: 'HYPOTHESIS',
    evidenceRefs: ['ev.C.gengcun-ncl-catalog', 'ev.F.ziping-1895-1923-search'],
    rationale: 'Content/title association is a hypothesis only; no direct citation, copy relation, or dated transmission witness is admitted.',
  },
  {
    edgeId: 'edge1776-manuscript-to-1895-edition',
    from: '1776 manuscript/prelude candidate',
    to: '1895 報暉草堂 edition candidate',
    status: 'HYPOTHESIS',
    evidenceRefs: ['ev.F.hukun-1776-secondary', 'ev.F.ziping-1895-1923-search'],
    rationale: 'A secondary preface reading and an unresolved edition lead do not establish a physical or textual transmission edge.',
  },
  {
    edgeId: 'edge1776-manuscript-to-1923-edition',
    from: '1776 manuscript/prelude candidate',
    to: '1923 育新書局 edition candidate',
    status: 'HYPOTHESIS',
    evidenceRefs: ['ev.F.hukun-1776-secondary', 'ev.F.ziping-1895-1923-search'],
    rationale: 'A secondary preface reading and an unresolved edition lead do not establish a physical or textual transmission edge.',
  },
  {
    edgeId: 'edge造化元鑰-to-窮通寶鑑',
    from: '造化元鑰',
    to: '窮通寶鑑',
    status: 'BIBLIOGRAPHIC_CLAIM_ONLY',
    evidenceRefs: ['ev.D.waseda-record-f0111'],
    rationale: 'Later/editorial genealogy is not a direct transmission page or colophon; Waseda metadata alone does not close it.',
  },
  {
    edgeId: 'edge窮通寶鑑-to-徐樂吾系',
    from: '窮通寶鑑',
    to: '徐樂吾系',
    status: 'BIBLIOGRAPHIC_CLAIM_ONLY',
    evidenceRefs: ['ev.D.waseda-record-f0111', 'ev.D.waseda-pages-f0111'],
    rationale: 'A later attribution/genealogy statement is not a direct copy, edition, or editorial transmission proof.',
  },
]

const claimSummary = claims => ({
  claimCount: claims.length,
  statusCounts: Object.fromEntries(CLAIM_STATUSES.map(status => [status, claims.filter(claim => claim.status === status).length])),
  unitStatusCounts: Object.fromEntries(UNITS.map(unit => [unit, Object.fromEntries(CLAIM_STATUSES.map(status => [status, claims.filter(claim => claim.unit === unit && claim.status === status).length]))])),
  parentVerifiedClaimIds: claims.filter(claim => ['kept', 'corrected'].includes(claim.status) && claim.parentVerifiedEvidenceRefs.length > 0).map(claim => claim.claimId),
  contaminationClaimIds: claims.filter(claim => claim.contaminationClassification === 'CROSS_TEXT_CONTAMINATION').map(claim => claim.claimId),
  gateStateCounts: Object.fromEntries(GATE_KEYS.map(key => [key, countStates(claims, key)])),
})

export function contentHash(artifact) {
  const copy = structuredClone(artifact)
  delete copy.contentSha256
  delete copy.artifactIdentity
  return canonicalHash(copy)
}

export function buildSajuGeminiV7ParentAdjudication({ basisHead, predecessorReferences = {}, typedReadinessBaseline } = {}) {
  if (!/^[0-9a-f]{40}$/.test(basisHead || '')) throw new Error('v7 parent adjudication requires a valid basis HEAD')
  const claims = buildClaims()
  const typedReadinessRecalculation = recomputeTypedReadiness(typedReadinessBaseline)
  const artifact = {
    schemaVersion: SAJU_GEMINI_V7_PARENT_SCHEMA,
    version: SAJU_GEMINI_V7_PARENT_VERSION,
    basisHead,
    scope: {
      sourceOfTruth: 'Parent direct page/record observations, current first-party metadata checks, and the authoritative Luna v1–v6 baseline artifacts.',
      candidateBoundary: 'Gemini v7 packet is untrusted_candidate_only; only user-supplied labels and separately parent-verified observations are recorded.',
      units: [...UNITS],
      directVerificationCompleted: [...UNITS],
      canonicalGraphMutation: 'additive_bounded_observations_only',
      prohibited: ['availableForInterpretation=true', 'production activation', 'implementation-safe automatic promotion', 'wholesale candidate import', 'unverified arrow in canonical graph'],
    },
    candidatePacket: structuredClone(V7_CANDIDATE_PACKET),
    evidencePolicy: { directPolicy, sameLineagePolicy, ocr: 'locator_only', sourceText: 'manual visual inspection at stated pages only', sourceCategories: ['DIRECT_OFFICIAL_SCAN', 'DIRECT_DERIVATIVE_SCAN', 'FIRST_PARTY_API_RECORD', 'INSTITUTIONAL_METADATA', 'PARENT_BASELINE_REFERENCE', 'BIBLIOGRAPHIC_WITNESS', 'UNRESOLVED'] },
    externalEvidence: EXTERNAL_EVIDENCE.map(item => structuredClone(item)),
    pageObservations: PAGE_OBSERVATIONS.map(item => structuredClone(item)),
    claims,
    lineageGraph: {
      policy: 'Unverified arrows are not canonical graph edges.',
      edges: lineageEdges.map(edge => ({ ...edge, canonicalGraphIncluded: false })),
      canonicalEdges: [],
      decontamination: {
        status: 'completed_bounded',
        removedOrWithheld: ['欄江網 → 造化元鑰', '欄江網 → 耕寸集', '耕寸集 → 子平真詮', '1776 manuscript → 1895 edition', '1776 manuscript → 1923 edition', '造化元鑰 → 窮通寶鑑', '窮通寶鑑 → 徐樂吾系'],
        reasons: ['book-title similarity is not transmission', 'editor statement is not direct copy evidence', 'later preface is not physical edition evidence', 'secondary genealogy is not a direct edge', 'same case is not independent lineage'],
      },
    },
    digitalPhysicalRelationshipAudit: {
      relationTypes: ['physical-item', 'digital-derivation', 'edition/textual-lineage', 'semantic-corroboration'],
      separated: true,
      observations: [
        'ANU v1–v12 current file list is one first-party ORIGINAL bundle; it is not twelve independent physical witnesses.',
        'Waseda scan pages are direct digital observations of F0111; they do not prove a dated physical edition or genealogy.',
        'NLC/Tianyige/神峰 same-case agreement is a same-lineage/dependence candidate until the four independence axes close.',
      ],
      canonicalTransmissionEdges: [],
    },
    sourceClaimReconciliation: {
      status: 'completed_bounded',
      kept: claims.filter(claim => claim.status === 'kept').map(claim => claim.claimId),
      corrected: claims.filter(claim => claim.status === 'corrected').map(claim => claim.claimId),
      rejected: claims.filter(claim => claim.status === 'rejected').map(claim => claim.claimId),
      unresolved: claims.filter(claim => claim.status === 'unresolved').map(claim => claim.claimId),
      candidateClaimsNotImported: true,
    },
    metadataRegressionAudit: {
      baseline: {
        handle: 'http://hdl.handle.net/1885/206524',
        parentConfirmedPublicPdfNames: ['b22343921_v.1.pdf', 'b22343921_v.2.pdf', 'b22343921_v.3.pdf', 'b22343921_v.4.pdf', 'b22343921_v.5.pdf'],
        parentScope: 'Historical parent snapshot directly verified V1–V5; title extent listed 12 juan but completeness/public V6–V12 was not then admitted.',
      },
      currentFirstParty: {
        recordContinuity: 'same item e0d2d017-f99d-4818-af29-d18754f7e5cd / handle 1885/206524',
        currentApiPdfCount: 12,
        currentApiTifCount: 12,
        currentApiPdfNames: [...EXTERNAL_EVIDENCE.find(item => item.evidenceId === 'ev.B.anu-current-original-v1-v12').pdfNames],
        v6ToV12HttpStatus: { ...EXTERNAL_EVIDENCE.find(item => item.evidenceId === 'ev.B.anu-current-original-v1-v12').v6ToV12HeadStatus },
        invalidCandidateHandle: { handle: '1885/42211', httpStatus: 404 },
        xuDishanMetadata: 'kept as dc.relation.ispartof metadata only',
      },
      disposition: {
        rareBooks1885_42211: 'rejected_current_item_identity',
        twelveJuanCatalogExtent: 'kept_metadata_only',
        currentPublicV1_V12FileEnumeration: 'kept_as_separate_first_party_api_observation',
        publicVolumeContentAndPrintedFolioCrosswalk: 'unresolved',
        xuDishanCollectionRelation: 'kept_metadata_only',
      },
      staleBaselineHandling: 'The predecessor V1–V5 snapshot remains byte-preserved; current API exposure is recorded as a bounded successor observation and does not mutate typed readiness.',
    },
    timingReconciliation: {
      status: 'bounded_reconciled_not_authoritative',
      sourceVariantMap: [
        {
          source: '《淵海子平》',
          locator: 'NLC 99036 scan p.50–51',
          heading: '評註淵海子平 卷一',
          examples: ['乙丑男: 十五日 → 五三十五 → 五歲 → 逆行丁丑', '甲子女: 得九日 → 三三單九 → 三歲 → 逆行乙丑'],
          exactTextStatus: 'manual_visual_locator_only',
        },
        {
          source: '《神峰通考》',
          locator: 'scan p.22; surrounding p.20–24',
          heading: '神峰通考 卷四 / 月令詳辨 / 起大運法陽男陰女 / 起大運法陰男陽女 / 子平舉要',
          exampleOrder: ['甲子陽男 forward example', '乙丑男 reverse example', '甲子女 reverse example'],
          targetOrder: ['乙丑男', '甲子女'],
          variants: ['五三十五', '三三單九', '餘皆倣此'],
          exactTextStatus: 'manual_visual_layout_and_locator_only',
          interpretationRemoved: 'standard fixture / independent corroboration',
        },
        {
          source: '《三命通會》',
          locator: 'ANU V2 scan p.58–59 with p.57/p.60 context',
          direct: ['順逆 direction family', 'preceding/next 節 selection language', '三日為一歲 relation family', 'worked example presence'],
          derivedOnly: ['一日四月'],
          notAdmitted: ['一時辰十日 as exact literal', 'modern exact first-start timestamp', 'production rounding policy'],
        },
        {
          source: '《五行精紀》',
          status: 'parent_v4_v5_baseline_preserved',
          autoIntegration: false,
        },
      ],
      implementationBoundary: 'No calculation, rounding, interpolation, current-calendar conversion, or production timing authority is promoted.',
    },
    newCandidateAudit: {
      title: '《命理約言》',
      status: 'P0_acquisition_lead_only',
      firstPartyInstitutionalItemAndActualPage: false,
      claimsChecked: [],
      leadEvidenceRefs: ['ev.E.mingli-yueyan-public-lead'],
      nextAcceptance: 'Obtain a first-party institutional item identity and inspect the actual target page for 起運法 / 三日一歲 / 一日四月 / 一時辰十日 separately.',
    },
    editionAudit: {
      candidates: [
        { label: '1895 報暉草堂', status: 'unresolved', evidenceRefs: ['ev.F.ziping-1895-1923-search', 'ev.F.no-first-party-target-pages'] },
        { label: '1923 育新書局', status: 'unresolved', evidenceRefs: ['ev.F.ziping-1895-1923-search', 'ev.F.no-first-party-target-pages'] },
        { label: '胡焜序 1773', status: 'rejected', evidenceRefs: ['ev.F.hukun-1776-secondary'] },
        { label: '胡焜序 1776', status: 'secondary_reading_only_unresolved_as_first_party', evidenceRefs: ['ev.F.hukun-1776-secondary', 'ev.F.no-first-party-target-pages'] },
      ],
      dateRule: 'Preface/e-text/cover metadata is not a physical edition date without original page and item relation.',
    },
    independenceReconciliation: {
      axes: INDEPENDENCE_AXES.map(axisName => ({
        axis: axisName,
        state: 'unresolved',
        countedAsIndependent: false,
        sameLineageCandidates: axisName === 'edition/textual-lineage' ? ['淵海子平 ↔ 神峰通考 worked examples', 'ANU v1–v12 within one ORIGINAL bundle', 'Waseda F0111 ↔ 欄江網/造化元鑰/徐樂吾 candidates'] : [],
        evidenceRefs: axisName === 'physical-item' ? ['ev.A.nlc99036-p50-p51', 'ev.A.shenfeng-p20-p24', 'ev.A.anu-v2-p57-p60', 'ev.D.waseda-record-f0111'] : [],
        missingEdges: [`${axisName}:independence relation remains unresolved`],
        note: axisName === 'digital-derivation' ? 'Same bundle, public mirror, or duplicate download does not create independent derivation.' : axisName === 'edition/textual-lineage' ? 'Same examples and bibliographic genealogy are dependence/hypothesis candidates, not independent lineage.' : axisName === 'semantic-corroboration' ? 'No independent semantic oracle or authority was established.' : 'Item identity and cross-item independence remain separate.',
      })),
      overallState: 'unresolved',
      rule: sameLineagePolicy,
    },
    contaminationAudit: {
      status: 'completed_bounded',
      removedFromCanonicalGraph: claims.filter(claim => claim.contaminationClassification === 'CROSS_TEXT_CONTAMINATION').map(claim => claim.claimId),
      findings: [
        { findingId: 'contamination.gengcun-seasonal-block', classification: 'CROSS_TEXT_CONTAMINATION', action: 'removed', evidenceRefs: ['ev.C.gengcun-ncl-catalog', 'ev.D.waseda-pages-f0111'] },
        { findingId: 'contamination.metadata-to-genealogy', classification: 'METADATA_SCOPE_TRANSFER', action: 'rejected', evidenceRefs: ['ev.B.anu-current-item-api', 'ev.D.waseda-record-f0111'] },
        { findingId: 'contamination.preface-cover-date-transfer', classification: 'DATE_SCOPE_TRANSFER', action: 'rejected', evidenceRefs: ['ev.F.hukun-1776-secondary', 'ev.D.waseda-record-f0111'] },
        { findingId: 'contamination.ctext-e-text-witness', classification: 'REPRESENTATION_MISCLASSIFICATION', action: 'rejected_as_historical_witness', evidenceRefs: ['ev.E.mingli-yueyan-public-lead'] },
        { findingId: 'contamination.stale-parent-reentry', classification: 'STALE_PARENT_REJECTED_CLAIM_REINTRODUCTION', action: 'not_imported', evidenceRefs: ['ev.B.parent-anu-v1-v5-snapshot', 'ev.C.no-new-dating-source'] },
      ],
    },
    negativeChecks: {
      status: 'required_and_checker_enforced',
      ids: [...NEGATIVE_CHECK_IDS],
      allMustReject: true,
    },
    typedReadinessRecalculation,
    predecessor: {
      authoritativeBaseline: 'artifacts/saju-five-classics-typed-readiness-contract-v0/complete.json',
      references: structuredClone(predecessorReferences),
      additiveRule: 'Only parent-verified bounded observations may be recorded; no v7 candidate changes the canonical 13-claim typed-readiness population.',
    },
    readiness: {
      availableForInterpretation: false,
      productionActivation: 'blocked',
      semanticAuthority: 'not_established',
      implementationSafeGrounding: 'not_established',
      stableClaimPromotionCount: 0,
      promotionReadyClaimIds: [],
      status: 'blocked',
      reason: 'v7 is an unpromoted parent audit. Direct observations survive only at bounded source/metadata scope; dating, lineage, independence, semantic authority, and production grounding remain open.',
    },
    promotion: {
      status: 'blocked',
      ready: false,
      stableClaimPromotionCount: 0,
      promotionReadyClaimIds: [],
      semanticAuthorityChanged: false,
      productionChanged: false,
      interpretationAvailable: false,
      scope: 'No claim promotion; no canonical procedure, source authority, or production activation.',
      blockingEdges: ['I:unresolved', 'L:unresolved', 'S:unresolved', 'P:blocked', '耕寸集 target folios unavailable', '1895/1923 first-party item pages unavailable', '命理約言 first-party item/page unavailable'],
    },
    summary: claimSummary(claims),
    contentSha256: null,
  }
  artifact.contentSha256 = contentHash(artifact)
  return artifact
}

const isObject = value => Boolean(value && typeof value === 'object' && !Array.isArray(value))

export function checkSajuGeminiV7ParentAdjudication(artifact) {
  const errors = []
  const fail = value => errors.push(value)
  if (!isObject(artifact)) return ['artifact_shape_invalid']
  if (artifact.schemaVersion !== SAJU_GEMINI_V7_PARENT_SCHEMA) fail('schema_version')
  if (artifact.version !== SAJU_GEMINI_V7_PARENT_VERSION) fail('version')
  if (artifact.candidatePacket?.trustBoundary !== 'untrusted_candidate_only') fail('candidate_trust_boundary')
  if (artifact.candidatePacket?.importedAsCanonicalEvidence !== false || artifact.candidatePacket?.sourceTextAndVerdictsImported !== false) fail('candidate_import_boundary')
  if (!Array.isArray(artifact.candidatePacket?.importedConclusionFields) || artifact.candidatePacket.importedConclusionFields.length !== 0) fail('candidate_conclusions_imported')
  if (artifact.candidatePacket?.staleParentRejectedClaimsReintroduced !== false) fail('stale_parent_reintroduction')
  if (artifact.candidatePacket?.candidateClaimsRecordedAsLabelsOnly !== true) fail('candidate_labels_not_only')
  if (!Array.isArray(artifact.claims) || artifact.claims.length !== V7_CLAIM_IDS.length) fail('claim_count')
  const ids = artifact.claims?.map(claim => claim.claimId) || []
  if (ids.length !== new Set(ids).size || ids.sort().join('|') !== [...V7_CLAIM_IDS].sort().join('|')) fail('claim_ids')
  const known = new Set([...(artifact.externalEvidence || []).map(item => item.evidenceId), ...(artifact.pageObservations || []).map(item => item.observationId)])
  for (const observation of artifact.pageObservations || []) {
    if (observation.canonicalTextObserved !== false) fail(`observation:${observation.observationId}:canonical_text_observed`)
    if (observation.canonicalTextAdmitted === true) fail(`observation:${observation.observationId}:canonical_text_admitted`)
    if (observation.semanticAuthority !== 'not_established') fail(`observation:${observation.observationId}:semantic_authority`)
  }
  for (const claim of artifact.claims || []) {
    if (!UNITS.includes(claim.unit) || !CLAIM_STATUSES.includes(claim.status)) fail(`claim:${claim.claimId}:status_or_unit`)
    if (claim.candidateEvidenceAccepted !== false) fail(`claim:${claim.claimId}:candidate_accepted`)
    if (claim.promotion?.ready !== false || claim.promotion?.status !== 'blocked') fail(`claim:${claim.claimId}:promotion_not_blocked`)
    for (const ref of claim.parentVerifiedEvidenceRefs || []) if (!known.has(ref)) fail(`claim:${claim.claimId}:unknown_ref:${ref}`)
    for (const gateName of GATE_KEYS) {
      const item = claim.gates?.[gateName]
      if (!item || item.gate !== gateName || !GATE_STATES.includes(item.state)) fail(`claim:${claim.claimId}:gate:${gateName}`)
      if (item?.state === 'satisfied' && item.evidenceRefs.length === 0) fail(`claim:${claim.claimId}:gate:${gateName}:evidence_required`)
      if (item?.state !== 'satisfied' && item?.state !== 'not_applicable' && item?.missingEdges.length === 0) fail(`claim:${claim.claimId}:gate:${gateName}:missing_edge_required`)
      for (const ref of item?.evidenceRefs || []) if (!known.has(ref)) fail(`claim:${claim.claimId}:gate:${gateName}:unknown_ref:${ref}`)
    }
    for (const axisName of INDEPENDENCE_AXES) {
      const item = claim.independence?.axes?.[axisName]
      if (!item || !GATE_STATES.includes(item.state)) fail(`claim:${claim.claimId}:axis:${axisName}`)
      if (item?.countedAsIndependent === true) fail(`claim:${claim.claimId}:axis:${axisName}:counted_as_independent`)
      if (item?.sameLineageCandidate === true && item.countedAsIndependent === true) fail(`claim:${claim.claimId}:axis:${axisName}:same_lineage_inflated`)
      for (const ref of item?.evidenceRefs || []) if (!known.has(ref)) fail(`claim:${claim.claimId}:axis:${axisName}:unknown_ref:${ref}`)
    }
  }
  const requiredStatuses = {
    'claim.A.yuanhai-乙丑男-chain': 'kept', 'claim.A.yuanhai-甲子女-chain': 'kept', 'claim.A.shenfeng-page-order-and-wording': 'kept',
    'claim.A.shenfeng-standard-fixture': 'rejected', 'claim.A.same-worked-example-independent-corroboration': 'rejected', 'claim.A.sanming-rule-family': 'corrected',
    'claim.A.sanming-literal-one-day-four-month': 'corrected', 'claim.A.sanming-literal-time-unit-ten-day': 'unresolved', 'claim.A.wuxingjingji-same-procedure-auto-merge': 'rejected',
    'claim.B.anu-42211-item-identity': 'rejected', 'claim.B.anu-206524-item-identity': 'kept', 'claim.B.anu-12juan-metadata': 'kept', 'claim.B.anu-current-original-v1-v12': 'kept',
    'claim.B.anu-catalog-extent-to-public-count': 'rejected', 'claim.B.anu-xudishan-collection-relation': 'kept', 'claim.C.gengcun-seal-provenance-candidate': 'kept',
    'claim.C.gengcun-seal-owner-equals-dating': 'corrected', 'claim.C.gengcun-TAQ-1843': 'rejected', 'claim.C.gengcun-TPQ-1578': 'rejected', 'claim.C.gengcun-qin-enfu-dating': 'rejected',
    'claim.C.gengcun-content-parallel-dating': 'rejected', 'claim.C.gengcun-dating-gate': 'unresolved', 'claim.D.waseda-direct-record': 'kept', 'claim.D.waseda-seasonal-pages': 'kept',
    'claim.D.waseda-cover-to-physical-date': 'rejected', 'claim.D.digital-physical-map-as-transmission': 'rejected', 'claim.D.full-genealogy-directly-supported': 'corrected',
    'claim.E.gengcun-seasonal-block': 'rejected', 'claim.E.ctext-e-text-as-historical-witness': 'rejected', 'claim.E.preface-cover-as-physical-edition-date': 'rejected', 'claim.E.mingli-yueyan-direct-observation': 'unresolved',
    'claim.F.1895-baohui-first-party-item': 'unresolved', 'claim.F.1923-yuxin-first-party-item': 'unresolved', 'claim.F.hukun-1773': 'rejected', 'claim.F.hukun-1776-first-party': 'unresolved',
    'claim.F.hukun-1776-secondary-reading': 'corrected', 'claim.F.actual-target-pages': 'unresolved', 'claim.F.gemini-v7-wholesale-resolution': 'rejected',
  }
  for (const [claimId, status] of Object.entries(requiredStatuses)) if (artifact.claims.find(claim => claim.claimId === claimId)?.status !== status) fail(`status_boundary:${claimId}:${status}`)
  if (!artifact.lineageGraph || !Array.isArray(artifact.lineageGraph.edges) || artifact.lineageGraph.canonicalEdges?.length !== 0) fail('lineage_graph_boundary')
  for (const edge of artifact.lineageGraph?.edges || []) {
    if (!LINEAGE_EDGE_STATES.includes(edge.status)) fail(`lineage_edge_status:${edge.edgeId}`)
    if (edge.canonicalGraphIncluded !== false) fail(`lineage_edge_canonical_inclusion:${edge.edgeId}`)
    for (const ref of edge.evidenceRefs || []) if (!known.has(ref)) fail(`lineage_edge_unknown_ref:${edge.edgeId}:${ref}`)
  }
  if (artifact.metadataRegressionAudit?.currentFirstParty?.invalidCandidateHandle?.httpStatus !== 404) fail('anu_42211_not_rejected')
  if (artifact.metadataRegressionAudit?.currentFirstParty?.currentApiPdfCount !== 12 || artifact.metadataRegressionAudit?.currentFirstParty?.currentApiTifCount !== 12) fail('anu_current_volume_list_missing')
  if (artifact.metadataRegressionAudit?.currentFirstParty?.currentApiPdfNames?.length !== 12) fail('anu_current_pdf_names_missing')
  if (artifact.metadataRegressionAudit?.disposition?.publicVolumeContentAndPrintedFolioCrosswalk !== 'unresolved') fail('anu_content_crosswalk_promoted')
  if (artifact.newCandidateAudit?.firstPartyInstitutionalItemAndActualPage !== false || artifact.newCandidateAudit?.status !== 'P0_acquisition_lead_only') fail('mingli_yueyan_promoted')
  if (artifact.claims.find(claim => claim.claimId === 'claim.E.gengcun-seasonal-block')?.contaminationClassification !== 'CROSS_TEXT_CONTAMINATION') fail('gengcun_contamination_missing')
  if (!artifact.contaminationAudit?.removedFromCanonicalGraph?.includes('claim.E.gengcun-seasonal-block')) fail('contamination_missing')
  if (artifact.readiness?.availableForInterpretation !== false || artifact.readiness?.semanticAuthority !== 'not_established' || artifact.readiness?.productionActivation !== 'blocked') fail('readiness_open')
  if (artifact.promotion?.stableClaimPromotionCount !== 0 || artifact.promotion?.promotionReadyClaimIds?.length !== 0 || artifact.promotion?.semanticAuthorityChanged !== false || artifact.promotion?.productionChanged !== false) fail('promotion_side_effect')
  if (artifact.typedReadinessRecalculation?.changedGateStates?.length !== 0 || artifact.typedReadinessRecalculation?.promotionReadyClaimIds?.length !== 0) fail('typed_readiness_changed')
  if (JSON.stringify(artifact.typedReadinessRecalculation?.before) !== JSON.stringify(artifact.typedReadinessRecalculation?.after)) fail('typed_readiness_before_after_differ')
  if (artifact.negativeChecks?.allMustReject !== true || JSON.stringify(artifact.negativeChecks?.ids) !== JSON.stringify([...NEGATIVE_CHECK_IDS])) fail('negative_checks_missing')
  if (artifact.contentSha256 !== contentHash(artifact)) fail('content_hash')
  return [...new Set(errors)].sort()
}

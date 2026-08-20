import { createHash } from 'node:crypto'

import { canonicalIdentityJson } from '../artifactIdentity.js'

export const SAJU_GEMINI_V6_PARENT_SCHEMA = 'saju-gemini-v6-parent-adjudication'
export const SAJU_GEMINI_V6_PARENT_VERSION = '6.0.0'

export const GATE_KEYS = Object.freeze(['H', 'E', 'L', 'S', 'I', 'P'])
export const GATE_STATES = Object.freeze(['satisfied', 'unresolved', 'conflicted', 'not_applicable'])
export const CLAIM_STATUSES = Object.freeze(['kept', 'corrected', 'rejected', 'unresolved'])
export const UNITS = Object.freeze(['A', 'B', 'C', 'D', 'E'])
export const SOURCE_CATEGORIES = Object.freeze([
  'DIRECT_OFFICIAL_SCAN',
  'DIRECT_DERIVATIVE_SCAN',
  'INSTITUTIONAL_METADATA',
  'PHYSICAL_ITEM_CANDIDATE',
  'BIBLIOGRAPHIC_WITNESS',
  'INFERENCE',
  'UNRESOLVED',
])
export const INDEPENDENCE_AXES = Object.freeze([
  'physical-item',
  'digital-derivation',
  'edition/textual-lineage',
  'semantic-corroboration',
])

const sha256 = value => createHash('sha256').update(value).digest('hex')
const canonicalHash = value => sha256(Buffer.from(canonicalIdentityJson(value)))

export const V6_CANDIDATE_PACKET_FILES = Object.freeze([
  {
    role: 'packet/matrix locator',
    path: '/private/tmp/v6-candidates.json',
    byteLength: 0,
    byteSha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    contentAvailable: false,
  },
])

export const V6_CANDIDATE_PACKET = Object.freeze({
  campaign: 'GEMINI-V6-ACQUISITION',
  modelClaimedByUser: 'Gemini 3.7 Flash High v6',
  source: 'user_supplied_goal_request',
  packetAvailability: 'not_available_in_current_workspace',
  packetFiles: V6_CANDIDATE_PACKET_FILES.map(file => ({ ...file })),
  trustBoundary: 'untrusted_candidate_only',
  importedAsCanonicalEvidence: false,
  importedConclusionFields: [],
  actualModelRuntimeVerified: false,
  sourceTextAndVerdictsImported: false,
  staleParentRejectedClaimsReintroduced: false,
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
  evidence('ev.A.tianyige-yuanhai-p18', 'A', 'DIRECT_OFFICIAL_SCAN', 'parent_verified_bounded_page', {
    sourceId: 'source.tianyige.yuanhai-zi-ping.ming-chongzhen.scan-5007',
    institution: 'Tianyi Pavilion Museum / Ningbo Cultural Management Committee',
    catalogIdentity: '善2875 / 330000-1705-0005007; 明崇禎刻本',
    scan: { path: '/private/tmp/tianyige-5007-current.pdf', pageCount: 153, byteLength: 133016361, byteSha256: '93a4fe97798eb7c3c35122f307447ce5e931a9a4012e558520fe9052c16a295f' },
    inspectedPages: [18, 19],
    observed: ['凡起大運', '俱折除三日以為一歲', '順逆方向 discussion', '逆行乙丑餘皆倣此'],
    scopeBoundary: 'Leaf 18 directly bounds the general 起大運 method and examples; the exact small-character variant of 三三...九 is not normalized from this witness, and Tianyi-to-NLC transmission remains unresolved.',
  }),
  evidence('ev.A.nlc99036-yuanhai-p50-p51', 'A', 'DIRECT_DERIVATIVE_SCAN', 'parent_verified_bounded_page', {
    sourceId: 'source.nlc.yuanhai-ziping.unknown-date.scan-99036',
    institution: 'National Library of China (NLC) digital resource represented by a public scan mirror',
    catalogIdentity: '15jh007754 / reader object aid=416,bid=99036.0; [192-?] unresolved',
    recordUrl: 'http://read.nlc.cn/allSearch/searchDetail?searchType=24&showType=1&indexName=data_416&fid=15jh007754',
    scan: { path: '/private/tmp/nlc-99036-yuanhai-ziping.pdf', pageCount: 209, byteLength: 6429274, byteSha256: 'fca66e109aae987a5a04dc623e5168680d227542e13b56cdd7c39b62e55b605f' },
    inspectedPages: [50, 51],
    observed: ['乙丑年...初一立春後十五日生男', '逆數至初一日立春', '五三十五', '五歲運逆行丁丑', '甲子年...初一立春後十日生女', '得九日三三單九', '三歲運逆行乙丑', '餘皆倣此'],
    scopeBoundary: 'Leaf 51 gives the contiguous worked-example chain and surrounding text as a bounded visual observation. It does not close the scan date, edition relation, normalized wording, or semantic authority.',
  }),
  evidence('ev.A.shenfeng-p22', 'A', 'DIRECT_DERIVATIVE_SCAN', 'parent_verified_bounded_page', {
    sourceId: 'source.shenfeng-tongkao.vol2.scan-nlc511',
    institution: 'Shanghai Library holding stamp observed on a public digital scan mirror',
    scan: { path: '/private/tmp/shenfeng-tongkao-vol2.pdf', pageCount: 168, byteLength: 6708084, byteSha256: 'ccb21cf1215a1e487fe79497839f9343534af42e3af6c1e7dd04f3faea9289' },
    inspectedPage: 22,
    observed: ['乙丑年...初一立春後十五日生男', '五三十五', '五歲運逆行丁丑', '甲子年...初一立春後十日生女', '得九日三三單九', '三歲運逆行乙丑', '餘皆倣此'],
    scopeBoundary: 'The same or near-identical worked examples are directly visible in this digital scan, but the item-level record, edition genealogy, and textual dependence relation to 淵海子平 are unresolved; this is not automatic independent corroboration.',
  }),
  evidence('ev.A.anu-sanming-p59', 'A', 'DIRECT_OFFICIAL_SCAN', 'parent_verified_bounded_page', {
    sourceId: 'source.anu.sanming-tonghui.e0d2d017.v2',
    institution: 'Australian National University repository bitstream',
    scan: { path: '/private/tmp/anu-b22343921-v2.pdf', pageCount: 105, byteLength: 116179488, byteSha256: 'e757a79c45a6e8a6701ba991ef4a3f2d3a6ce038ed0ab8727a21b319698d1dc8' },
    inspectedPages: [58, 59],
    observed: ['三日為一歲 conversion family', 'direction family 陽男陰女順 / 陰男陽女逆', 'future/past 節 selection', 'worked distance/time example surrounding the rule'],
    literalBoundary: 'The inspected page does not establish a literal printed string 一日四月 or 一時辰十日 with sufficient confidence. Those are retained as derived restatements of the relation family, not as an admitted exact quotation.',
    scopeBoundary: 'The abstract conversion/direction/節 rule family and a worked example are separate observations. No implementation rounding or production timing procedure is admitted.',
  }),
  evidence('ev.B.shanghai-1895-1923-bounded-search', 'B', 'INSTITUTIONAL_METADATA', 'parent_verified_negative_search', {
    institution: 'Shanghai Library public catalog API',
    url: 'https://vufind.library.sh.cn/api/v1/search',
    queries: [
      { term: '子平真詮 報暉草堂', resultCount: 5, itemLevelTargetFound: false },
      { term: '子平真詮 紹興育新書局', resultCount: 1, itemLevelTargetFound: false },
    ],
    observed: ['No first-party item/catalog ID and target scan for the 1895 Bao Hui Cao Tang candidate', 'No first-party item/catalog ID and target scan for the 1923 Shaoxing Yuxin candidate'],
    scopeBoundary: 'The bounded search is evidence that the cited item-level records were not exposed in this pass; it is not proof that the items do not exist.',
  }),
  evidence('ev.B.hukun-1776-secondary-reading', 'B', 'BIBLIOGRAPHIC_WITNESS', 'parent_verified_secondary_only', {
    observed: ['A secondary/e-text witness reads 胡焜序 as 乾隆四十一年歲在丙申, i.e. 1776'],
    candidateConflict: 'The v6 assertion 1773 is not supported by this reading.',
    scopeBoundary: 'The 1776 reading corrects the v6 transcription only at a secondary locator level. The original preface page, first-party item identity, and relation to a 1895/1923 copy remain unresolved.',
  }),
  evidence('ev.C.gengcun-ncl-catalog', 'C', 'INSTITUTIONAL_METADATA', 'parent_verified_catalog_only', {
    sourceId: 'source.ncl.ziping.gengcun-06599.catalog-rarecatx0441810',
    institution: 'National Central Library, Taiwan',
    catalogId: 'rarecatx0441810 / 06599 / 306.5 06599',
    url: 'https://rbook.ncl.edu.tw/NCLSearch/Search/SearchDetail?item=00ccfe6380184da28912a57393deb2d7fDI2NTQ0NQ2.PBlfBdELN3au83ZWddAblOP5Y3FBX8h5SLzXyf79aB4_&page=1030&whereString=IChOVUxMSUYoQ3JlYXRlcl9OYW1lLCAnICcpIGlzIE5VTEwgYW5kIE5VTExJRihEb2N1bWVudF9Xcml0ZXIsICAnICcpIGlzIE5VTEwgKSA1.cHNKVlDaZLqmac_B_QboEZhR4vv4gJ8MEx7vCx6fK8U_&sourceWhereString=&SourceID=1&HasImage=',
    observed: ['耕寸集不分卷', '清敬一堂鈔本', '清', '線裝1冊', '石研齋／秦氏印', '有微捲'],
    scopeBoundary: 'The catalog record supports item identity and the recorded seal reading only. No target page bytes, exact year, seal application date, or explicit 三命通會 citation was observed.',
  }),
  evidence('ev.C.qin-enfu-authority', 'C', 'INSTITUTIONAL_METADATA', 'parent_verified_person_scope', {
    observed: ['秦恩復 1760–1843', '石研齋 room-name attribution'],
    scopeBoundary: 'Person authority and room-name attribution do not prove that this item seal was applied by Qin Enfu or before 1843.',
  }),
  evidence('ev.C.gengcun-target-pages-missing', 'C', 'UNRESOLVED', 'parent_verified_access_boundary', {
    observed: ['Official viewer target folios were not available in this pass; CAPTCHA/access gate was not bypassed', 'No actual 耕寸集 page visibly citing 三命通會 was obtained'],
    scopeBoundary: 'No target-page text is admitted; this is a real acquisition blocker for dating and cross-text claims.',
  }),
  evidence('ev.D.waseda-record-f0111', 'D', 'INSTITUTIONAL_METADATA', 'parent_verified_first_party_record', {
    sourceId: 'source.waseda.qiongtong-baojian.undated.scan-f0111',
    institution: 'Waseda University Library / Fūryō Bunko Special Collections',
    catalogId: '文庫19 F0111',
    url: 'https://www.wul.waseda.ac.jp/kotenseki/html/bunko19/bunko19_f0111/index.html',
    pdfUrl: 'https://archive.wul.waseda.ac.jp/kosho/bunko19/bunko19_f0111/bunko19_f0111.pdf',
    observed: ['窮通宝鑑欄江綱 : 二巻首一巻坿増補月談', '[清]・余星堂監定 ; 清・余春台輯 ; 清・曾寄廛校閲', '[出版地不明 : 出版者不明]', '合1冊 ; 唐小', '封面記:新鐫命理秘訣', '巻第二板心下記:集賢堂'],
    scopeBoundary: 'Official item/catalog metadata is separated from cover/plate-heart observations and from any edition genealogy or publication date.',
  }),
  evidence('ev.D.waseda-seasonal-pages', 'D', 'DIRECT_OFFICIAL_SCAN', 'parent_verified_bounded_page', {
    sourceId: 'source.waseda.qiongtong-baojian.undated.scan-f0111',
    scan: { path: '/private/tmp/waseda-bunko19-f0111.pdf', pageCount: 108, byteLength: 82323986, byteSha256: '123ce84b44bd20ecfdd6538bffc413a5e3948598315cd99f857a5c985c7257ae' },
    inspectedPages: [2, 4, 8, 9, 10, 11],
    observed: ['新鐫命理秘訣', '集賢堂', '楚南余星堂先生鑑定', '繹谷余春臺編輯', '三春甲木論', '正月甲木', '二月甲木', '三月甲木'],
    scopeBoundary: 'The official PDF confirms bounded cover/title/plate-heart and seasonal page observations. It does not by itself prove the full 欄江綱→造化元鑰→窮通寶鑑→徐樂吾評註 genealogy.',
  }),
  evidence('ev.E.cross-text-gengcun-seasonal-absence', 'E', 'UNRESOLVED', 'parent_verified_contamination_boundary', {
    target: '《耕寸集》 正月甲木 / 丙火 / 癸水 candidate block',
    observed: ['耕寸集 actual target pages were not available', 'The matching seasonal structure is directly observed in the Waseda 窮通寶鑑 witness, not in an actual 耕寸集 page'],
    scopeBoundary: 'The candidate block is removed from the canonical graph as CROSS_TEXT_CONTAMINATION; it cannot be used for 耕寸集 dating, semantic authority, or TPQ promotion.',
  }),
  evidence('ev.E.e-text-and-bibliography-boundaries', 'E', 'BIBLIOGRAPHIC_WITNESS', 'parent_verified_scope_correction', {
    observed: ['ctext/electronic text is locator-only unless tied to a historical scan', 'secondary bibliography is not an item-level record', 'preface/cover/plate-heart date is not automatically edition date', 'previous Gemini transcription was not imported'],
    scopeBoundary: 'Representation, item metadata, page evidence, textual lineage, and semantic authority remain separate fields.',
  }),
])

export const PAGE_OBSERVATIONS = Object.freeze([
  {
    observationId: 'obs.A.yuanhai-乙丑-chain-p51', unit: 'A', evidenceId: 'ev.A.nlc99036-yuanhai-p50-p51',
    sourceId: 'source.nlc.yuanhai-ziping.unknown-date.scan-99036', pageLocator: 'scan PDF p.51 / printed folio not independently crosswalked',
    surroundingText: '陰男陽女逆運。假如乙丑年...初一立春後十五日生男。逆數至初一日立春。五三十五日起五歲運逆行丁丑。餘皆倣此。',
    chain: { birthCondition: '乙丑年; 男命; 初一立春後十五日生', direction: '陰男陽女逆運', selectedJie: '初一立春', distance: '十五日', conversion: '五三十五', startAge: '五歲', firstDaYun: '丁丑; 逆行' },
    canonicalTextObserved: false, ocr: 'locator_only', semanticAuthority: 'not_established',
    scopeBoundary: directPolicy,
  },
  {
    observationId: 'obs.A.yuanhai-甲子-chain-p51', unit: 'A', evidenceId: 'ev.A.nlc99036-yuanhai-p50-p51',
    sourceId: 'source.nlc.yuanhai-ziping.unknown-date.scan-99036', pageLocator: 'scan PDF p.51 / printed folio not independently crosswalked',
    surroundingText: '如甲子年...初一立春後十日生女。逆數至初一日立春止。得九日三三單九日起三歲運逆行乙丑。餘皆倣此。',
    chain: { birthCondition: '甲子年; 女命; 初一立春後十日生; 節距九日表記', direction: '陰男陽女逆運', selectedJie: '初一立春', distance: '得九日', conversion: '三三單九 (literal variant observed)', startAge: '三歲', firstDaYun: '乙丑; 逆行' },
    canonicalTextObserved: false, ocr: 'locator_only', semanticAuthority: 'not_established',
    scopeBoundary: directPolicy,
  },
  {
    observationId: 'obs.A.tianyige-method-p18', unit: 'A', evidenceId: 'ev.A.tianyige-yuanhai-p18',
    sourceId: 'source.tianyige.yuanhai-zi-ping.ming-chongzhen.scan-5007', pageLocator: 'scan PDF p.18 / leaf 18',
    surroundingText: '凡起大運...俱折除三日以為一歲; 順逆方向 and example continuation including 逆行乙丑餘皆倣此.',
    canonicalTextObserved: false, ocr: 'locator_only', semanticAuthority: 'not_established',
    scopeBoundary: directPolicy,
  },
  {
    observationId: 'obs.A.shenfeng-worked-examples-p22', unit: 'A', evidenceId: 'ev.A.shenfeng-p22',
    sourceId: 'source.shenfeng-tongkao.vol2.scan-nlc511', pageLocator: 'scan PDF p.22 / printed folio 二〇',
    surroundingText: '起大運法陰男陽女...乙丑年...五三十五...五歲運逆行丁丑; 甲子年...得九日三三單九...三歲運逆行乙丑。餘皆倣此。',
    canonicalTextObserved: false, ocr: 'locator_only', semanticAuthority: 'not_established',
    scopeBoundary: 'Same-example occurrence is kept as a bounded page observation only; textual dependence and edition relation remain unresolved.',
  },
  {
    observationId: 'obs.A.sanming-abstract-and-example-p59', unit: 'A', evidenceId: 'ev.A.anu-sanming-p59',
    sourceId: 'source.anu.sanming-tonghui.e0d2d017.v2', pageLocator: 'ANU V2 scan pages 58–59; printed folio crosswalk unresolved',
    surroundingText: '三日為一歲 relation family, direction, future/past 節 selection, and a worked distance/time example appear in one surrounding passage.',
    canonicalTextObserved: false, ocr: 'locator_only', semanticAuthority: 'not_established',
    scopeBoundary: 'Abstract conversion and worked example are stored separately; exact 一日四月 / 一時辰十日 literal wording is not admitted from this inspection.',
  },
  {
    observationId: 'obs.B.hukun-date-reading', unit: 'B', evidenceId: 'ev.B.hukun-1776-secondary-reading',
    sourceId: 'secondary.e-text.hukun-preface', pageLocator: 'secondary e-text locator; original page not inspected',
    surroundingText: '乾隆四十一年歲在丙申 ... (1776 reading)',
    canonicalTextObserved: false, ocr: 'not_used', semanticAuthority: 'not_established',
    scopeBoundary: 'Secondary reading only; not a first-party page or edition-date proof.',
  },
  {
    observationId: 'obs.C.gengcun-catalog-seal', unit: 'C', evidenceId: 'ev.C.gengcun-ncl-catalog',
    sourceId: 'source.ncl.ziping.gengcun-06599.catalog-rarecatx0441810', pageLocator: 'official catalog record; target folio unavailable',
    surroundingText: '石研齋／秦氏印 recorded in catalog metadata.',
    canonicalTextObserved: false, ocr: 'not_used', semanticAuthority: 'not_established',
    scopeBoundary: 'Seal/provenance candidate only; owner attribution does not establish lifetime application chronology.',
  },
  {
    observationId: 'obs.D.waseda-metadata-and-seasonal-pages', unit: 'D', evidenceId: 'ev.D.waseda-seasonal-pages',
    sourceId: 'source.waseda.qiongtong-baojian.undated.scan-f0111', pageLocator: 'official PDF p.2, p.4, p.8–p.11',
    surroundingText: 'Cover/title/plate-heart metadata and 正月甲木 / 二月甲木 / 三月甲木 headings are directly visible.',
    canonicalTextObserved: false, ocr: 'locator_only', semanticAuthority: 'not_established',
    scopeBoundary: 'Direct seasonal locator and metadata only; edition genealogy and publication date remain separate unresolved fields.',
  },
])

const defaultAxisNote = axis => axis === 'edition/textual-lineage'
  ? 'Edition and textual-lineage relation is not closed; same-example agreement is not independent corroboration.'
  : axis === 'digital-derivation'
    ? 'Digital byte identity does not establish independent capture or derivation.'
    : axis === 'physical-item'
      ? 'An institution or scan identity is not by itself an independent physical witness relation.'
      : 'No independent semantic corroboration is admitted.'

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
  missingEdges: state === 'satisfied' ? [] : (missingEdges.length ? [...missingEdges] : [`${name}:${state}`]),
  note,
})

const makeClaim = ({
  claimId, unit, candidateAssertion, status, refs = [], directRefs = [], scopeCorrection,
  gateStates = {}, axisOptions = {}, contaminationClassification = null,
  realBlockers = [], falseBlockers = [], promotionTarget = 'historical_observation_stability',
}) => {
  const axes = Object.fromEntries(INDEPENDENCE_AXES.map(name => [name, axis(name, axisOptions[name])]))
  const gates = {}
  gates.H = gate('H', gateStates.H || (directRefs.length ? 'satisfied' : 'unresolved'), directRefs.length ? directRefs : refs, directRefs.length ? 'Parent directly inspected the stated page or first-party record at bounded scope.' : 'No parent-verified historical page closes this candidate assertion.', directRefs.length ? [] : ['H:direct witness missing'])
  gates.E = gate('E', gateStates.E || (directRefs.length ? 'satisfied' : 'unresolved'), directRefs.length ? directRefs : refs, directRefs.length ? 'Edition/editorial metadata or bounded page relation is recorded without widening the claim.' : 'Edition/editorial relation remains unresolved.', directRefs.length ? [] : ['E:edition or editorial relation unresolved'])
  gates.L = gate('L', gateStates.L || 'unresolved', refs, 'Local transmission/target-copy lineage is not closed.', ['L:local-to-target-copy lineage unresolved'])
  gates.S = gate('S', gateStates.S || 'unresolved', refs, 'Semantic equivalence and authority remain outside the bounded observation.', ['S:semantic authority unresolved'])
  gates.I = { ...gate('I', gateStates.I || 'unresolved', refs, sameLineagePolicy, ['I:independence vector unresolved']), axes }
  gates.P = gate('P', gateStates.P || 'unresolved', [], 'Promotion is blocked independently of the claim status.', ['P:promotion requires unresolved gates and parent reconciliation'])
  return {
    claimId, unit, candidateAssertion, status,
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
      reason: 'This v6 overlay does not promote candidate observations into the canonical graph.',
    },
    semanticAuthority: 'not_established',
    productionActivation: 'blocked',
  }
}

export const V6_CLAIM_IDS = Object.freeze([
  'claim.A.yuanhai-甲子女逆-chain',
  'claim.A.yuanhai-乙丑男逆-chain',
  'claim.A.yuanhai-three-three-literal-variant',
  'claim.A.shenfeng-same-worked-examples',
  'claim.A.same-worked-example-independent-lineage',
  'claim.A.sanming-abstract-conversion-direction-jie',
  'claim.A.sanming-literal-restatement-equals-worked-example',
  'claim.B.1895-baohui-first-party-item',
  'claim.B.1923-yuxin-first-party-item',
  'claim.B.hukun-1773',
  'claim.B.hukun-1776',
  'claim.B.actual-yongshen-xiangshen-xingyun-pages',
  'claim.C.gengcun-seal-provenance-candidate',
  'claim.C.gengcun-TAQ-1843',
  'claim.C.gengcun-TPQ-1578',
  'claim.C.seal-owner-equals-lifetime-application',
  'claim.D.waseda-official-metadata',
  'claim.D.waseda-seasonal-pages',
  'claim.D.waseda-lineage-narrative',
  'claim.D.waseda-edition-date',
  'claim.E.gengcun-seasonal-block',
  'claim.E.ctext-e-text-as-historical-scan',
  'claim.E.preface-date-as-edition-date',
  'claim.E.gemini-v6-all-resolved',
])

const buildClaims = () => [
  makeClaim({
    claimId: 'claim.A.yuanhai-甲子女逆-chain', unit: 'A', status: 'kept',
    candidateAssertion: '《淵海子平》甲子年女命例包含節距、折除、三歲起運與逆行乙丑的完整鏈。',
    refs: ['ev.A.nlc99036-yuanhai-p50-p51', 'obs.A.yuanhai-甲子-chain-p51', 'ev.A.tianyige-yuanhai-p18'], directRefs: ['obs.A.yuanhai-甲子-chain-p51'],
    scopeCorrection: 'NLC leaf 51의 bounded scan wording을 유지한다. `過去節9日`은 printed `得九日`로, `三三如九`는 literal canonicalization 없이 변이로 남긴다.',
    axisOptions: { 'edition/textual-lineage': { sameLineageCandidate: true, refs: ['ev.A.nlc99036-yuanhai-p50-p51', 'ev.A.tianyige-yuanhai-p18'] } },
    realBlockers: ['edition/transmission relation among NLC 99036, Tianyi, and Shenfeng is unresolved', 'printed-folio crosswalk and exact literal variant remain unresolved'],
  }),
  makeClaim({
    claimId: 'claim.A.yuanhai-乙丑男逆-chain', unit: 'A', status: 'kept',
    candidateAssertion: '《淵海子平》乙丑年男命例包含節距15日、五三十五、五歲起運與逆行丁丑的完整鏈。',
    refs: ['ev.A.nlc99036-yuanhai-p50-p51', 'obs.A.yuanhai-乙丑-chain-p51', 'ev.A.tianyige-yuanhai-p18'], directRefs: ['obs.A.yuanhai-乙丑-chain-p51'],
    scopeCorrection: '직접 scan에서 `初一立春後十五日生男 → 逆數至初一日立春 → 五三十五 → 五歲運逆行丁丑`을 bounded chain으로 유지한다.',
    axisOptions: { 'edition/textual-lineage': { sameLineageCandidate: true, refs: ['ev.A.nlc99036-yuanhai-p50-p51', 'ev.A.tianyige-yuanhai-p18'] } },
    realBlockers: ['edition/transmission relation among NLC 99036, Tianyi, and Shenfeng is unresolved', 'printed-folio crosswalk remains unresolved'],
  }),
  makeClaim({
    claimId: 'claim.A.yuanhai-three-three-literal-variant', unit: 'A', status: 'corrected',
    candidateAssertion: 'v6의 `三三如九`가 해당 원문에 그대로 존재한다.',
    refs: ['ev.A.nlc99036-yuanhai-p50-p51', 'obs.A.yuanhai-甲子-chain-p51', 'ev.A.shenfeng-p22'], directRefs: ['obs.A.yuanhai-甲子-chain-p51'],
    scopeCorrection: 'NLC/神峰 scan에서 parent가 읽은 literal은 `三三單九` 변이이며, `三三得九`·`三三如九`는 다른 전사/변이 후보다. 3×3=9라는 산술 관계와 literal wording을 분리한다.',
    gateStates: { S: 'conflicted', I: 'unresolved' },
    axisOptions: { 'edition/textual-lineage': { sameLineageCandidate: true, refs: ['ev.A.nlc99036-yuanhai-p50-p51', 'ev.A.shenfeng-p22'] } },
    realBlockers: ['exact edition-specific character variant is unresolved'],
  }),
  makeClaim({
    claimId: 'claim.A.shenfeng-same-worked-examples', unit: 'A', status: 'kept',
    candidateAssertion: '《神峰通考》scan p.22에 같은/유사한 乙丑·甲子 worked examples가 contiguous passage로 보인다.',
    refs: ['ev.A.shenfeng-p22', 'obs.A.shenfeng-worked-examples-p22'], directRefs: ['obs.A.shenfeng-worked-examples-p22'],
    scopeCorrection: '직접 page occurrence만 유지하며 《淵海子平》과의 textual dependence/edition relation은 unresolved로 분리한다.',
    axisOptions: { 'edition/textual-lineage': { sameLineageCandidate: true, refs: ['ev.A.shenfeng-p22', 'ev.A.nlc99036-yuanhai-p50-p51'] } },
    realBlockers: ['same-example wording does not establish independent lineage', 'item-level edition relation is unresolved'],
  }),
  makeClaim({
    claimId: 'claim.A.same-worked-example-independent-lineage', unit: 'A', status: 'rejected',
    candidateAssertion: '《淵海子平》와 《神峰通考》의 같은 worked example은 독립 lineage corroboration이다.',
    refs: ['ev.A.nlc99036-yuanhai-p50-p51', 'ev.A.shenfeng-p22'], directRefs: ['obs.A.yuanhai-甲子-chain-p51', 'obs.A.shenfeng-worked-examples-p22'],
    scopeCorrection: '같은 사례는 direct occurrence로는 kept지만, textual dependence가 unresolved인 동안 independence는 reject한다.',
    gateStates: { I: 'conflicted', P: 'unresolved' },
    axisOptions: { 'edition/textual-lineage': { state: 'conflicted', sameLineageCandidate: true, refs: ['ev.A.nlc99036-yuanhai-p50-p51', 'ev.A.shenfeng-p22'], note: 'Same or near-identical example; dependence is unresolved, so it cannot count as independent.', missingEdges: ['independent textual-lineage evidence absent'] }, 'semantic-corroboration': { state: 'conflicted', sameLineageCandidate: true, refs: ['ev.A.nlc99036-yuanhai-p50-p51', 'ev.A.shenfeng-p22'], note: 'Same example is not independent semantic corroboration.', missingEdges: ['independent semantic authority absent'] } },
  }),
  makeClaim({
    claimId: 'claim.A.sanming-abstract-conversion-direction-jie', unit: 'A', status: 'corrected',
    candidateAssertion: '《三命通會》가 三日一歲·一日四月·一時辰十日 및 順逆·節 선택을 exact literal로 제공한다.',
    refs: ['ev.A.anu-sanming-p59', 'obs.A.sanming-abstract-and-example-p59'], directRefs: ['obs.A.sanming-abstract-and-example-p59'],
    scopeCorrection: 'ANU p.59에서 三日為一歲 relation family, 順逆, 節 선택, worked example은 direct bounded evidence다. `一日四月`·`一時辰十日`은 이 page의 확정 literal이 아니라 derived restatement로만 남긴다.',
    gateStates: { S: 'unresolved' },
    realBlockers: ['literal phrase and printed-folio/edition crosswalk unresolved', 'no production rounding procedure'],
  }),
  makeClaim({
    claimId: 'claim.A.sanming-literal-restatement-equals-worked-example', unit: 'A', status: 'rejected',
    candidateAssertion: 'abstract conversion rule과 worked example이 동일한 direct historical evidence로 자동 결합된다.',
    refs: ['ev.A.anu-sanming-p59', 'obs.A.sanming-abstract-and-example-p59'], directRefs: ['obs.A.sanming-abstract-and-example-p59'],
    scopeCorrection: 'Abstract rule, worked example, modern procedure, and production authority are separate edges; automatic equation is rejected.',
    gateStates: { S: 'conflicted', I: 'unresolved' },
    axisOptions: { 'semantic-corroboration': { state: 'conflicted', refs: ['ev.A.anu-sanming-p59'], note: 'Abstract-to-example semantic equivalence is not independently established.', missingEdges: ['worked-example semantic binding and production procedure absent'] } },
  }),
  makeClaim({
    claimId: 'claim.B.1895-baohui-first-party-item', unit: 'B', status: 'unresolved',
    candidateAssertion: '1895 報暉草堂本의 first-party institution/item/catalog/date/page identity가 확인되었다.',
    refs: ['ev.B.shanghai-1895-1923-bounded-search'], scopeCorrection: 'Third-party bibliographic lead는 first-party item-level witness로 승격하지 않는다.',
    realBlockers: ['first-party item/catalog ID and date-bearing scan page unavailable', 'actual 用神/相神/行運 page unavailable'],
  }),
  makeClaim({
    claimId: 'claim.B.1923-yuxin-first-party-item', unit: 'B', status: 'unresolved',
    candidateAssertion: '1923 紹興育新書局本의 first-party institution/item/catalog/date/page identity가 확인되었다.',
    refs: ['ev.B.shanghai-1895-1923-bounded-search'], scopeCorrection: 'Search hit or secondary bibliography는 first-party item-level witness로 승격하지 않는다.',
    realBlockers: ['first-party item/catalog ID and date-bearing scan page unavailable', 'actual 用神/相神/行運 page unavailable'],
  }),
  makeClaim({
    claimId: 'claim.B.hukun-1773', unit: 'B', status: 'rejected',
    candidateAssertion: '胡焜序의 연대가 1773이다.',
    refs: ['ev.B.hukun-1776-secondary-reading', 'obs.B.hukun-date-reading'], directRefs: ['obs.B.hukun-date-reading'],
    scopeCorrection: '현재 parent가 읽은 secondary text는 1776(乾隆四十一年)이며 1773은 지지되지 않는다. 원면 미확인으로 1776도 first-party 확정은 아니다.',
    gateStates: { H: 'conflicted', E: 'unresolved', S: 'conflicted' },
    realBlockers: ['original preface page and item-level relation unavailable'],
  }),
  makeClaim({
    claimId: 'claim.B.hukun-1776', unit: 'B', status: 'corrected',
    candidateAssertion: '胡焜序 연대는 1776으로 first-party 확정되었다.',
    refs: ['ev.B.hukun-1776-secondary-reading', 'obs.B.hukun-date-reading'], directRefs: ['obs.B.hukun-date-reading'],
    scopeCorrection: '1776은 secondary/e-text reading으로만 corrected 유지한다. 원면과 target copy의 date-bearing metadata를 확인하기 전에는 최종 conflict를 unresolved로 둔다.',
    gateStates: { E: 'unresolved', S: 'unresolved' },
    realBlockers: ['first-party original preface and edition/copy relation unavailable'],
  }),
  makeClaim({
    claimId: 'claim.B.actual-yongshen-xiangshen-xingyun-pages', unit: 'B', status: 'unresolved',
    candidateAssertion: '1895/1923 target copies에서 用神·相神·行運 page가 actual scan으로 확인되었다.',
    refs: ['ev.B.shanghai-1895-1923-bounded-search'], scopeCorrection: 'No target page bytes were admitted; page existence remains unresolved.',
    realBlockers: ['first-party scan/page locators unavailable'],
  }),
  makeClaim({
    claimId: 'claim.C.gengcun-seal-provenance-candidate', unit: 'C', status: 'kept',
    candidateAssertion: '《耕寸集》 catalog에 石研齋／秦氏印이 기록된다.',
    refs: ['ev.C.gengcun-ncl-catalog', 'obs.C.gengcun-catalog-seal'], directRefs: ['obs.C.gengcun-catalog-seal'],
    scopeCorrection: '기록된 seal/provenance candidate만 유지한다. seal owner attribution과 생전 날인 시점은 별도 claim이다.',
    gateStates: { H: 'satisfied', E: 'satisfied', L: 'unresolved', S: 'not_applicable' },
    axisOptions: { 'semantic-corroboration': { state: 'satisfied', refs: ['ev.C.gengcun-ncl-catalog'], note: 'Semantic corroboration is outside the catalog-seal observation target.', missingEdges: [] } },
    realBlockers: ['target page and seal impression provenance not independently observed'],
  }),
  makeClaim({
    claimId: 'claim.C.gengcun-TAQ-1843', unit: 'C', status: 'rejected',
    candidateAssertion: '耕寸集의 TAQ가 1843으로 확정되었다.',
    refs: ['ev.C.gengcun-ncl-catalog', 'ev.C.qin-enfu-authority', 'ev.C.gengcun-target-pages-missing'],
    scopeCorrection: '秦恩復 생몰(1760–1843)과 石研齋 attribution만으로 생전 날인 시점을 자동 산출하지 않는다.',
    gateStates: { H: 'unresolved', E: 'conflicted', S: 'conflicted' },
    realBlockers: ['first-party seal impression chronology and target-page evidence unavailable'],
  }),
  makeClaim({
    claimId: 'claim.C.gengcun-TPQ-1578', unit: 'C', status: 'rejected',
    candidateAssertion: '耕寸集 본문이 三命通會를 명시 인용하므로 TPQ 1578이 확정되었다.',
    refs: ['ev.C.gengcun-ncl-catalog', 'ev.C.gengcun-target-pages-missing'],
    scopeCorrection: 'actual 耕寸集 page에서 명시적인 三命通會 인용을 확인하지 못했으므로 TPQ 1578은 승인하지 않는다. NCL 1578 三命通會 item과 耕寸集을 혼합하지 않는다.',
    gateStates: { H: 'unresolved', E: 'conflicted', S: 'conflicted' },
    contaminationClassification: 'CROSS_TEXT_CONTAMINATION',
    realBlockers: ['actual Gengcun page citation and independent dating evidence unavailable'],
  }),
  makeClaim({
    claimId: 'claim.C.seal-owner-equals-lifetime-application', unit: 'C', status: 'corrected',
    candidateAssertion: '石研齋秦氏印 attribution은 생전 날인 시점을 자동 확정한다.',
    refs: ['ev.C.gengcun-ncl-catalog', 'ev.C.qin-enfu-authority', 'obs.C.gengcun-catalog-seal'], directRefs: ['obs.C.gengcun-catalog-seal'],
    scopeCorrection: 'owner/room-name attribution ≠ seal application chronology. `石研齋秦氏印 = provenance candidate`만 보존한다.',
    gateStates: { H: 'satisfied', E: 'unresolved', S: 'conflicted' },
    realBlockers: ['seal impression/date-bearing provenance page unavailable'],
  }),
  makeClaim({
    claimId: 'claim.D.waseda-official-metadata', unit: 'D', status: 'kept',
    candidateAssertion: 'Waseda F0111 official record에 title, institution/item ID, attribution, imprint boundary, cover/plate-heart notes가 있다.',
    refs: ['ev.D.waseda-record-f0111'], directRefs: ['ev.D.waseda-record-f0111'],
    scopeCorrection: '新鐫命理秘訣/集賢堂은 cover/plate-heart metadata; institution/item/catalog fields는 separate record evidence; date와 genealogy는 unresolved다.',
    gateStates: { H: 'satisfied', E: 'satisfied', S: 'not_applicable' },
    axisOptions: { 'semantic-corroboration': { state: 'satisfied', refs: ['ev.D.waseda-record-f0111'], note: 'Semantic corroboration is outside this item-metadata claim.', missingEdges: [] } },
    realBlockers: ['edition genealogy and publication date unavailable'],
  }),
  makeClaim({
    claimId: 'claim.D.waseda-seasonal-pages', unit: 'D', status: 'kept',
    candidateAssertion: 'Waseda official PDF에서 正月/二月/三月甲木 및 requested metadata wording이 actual pages에 보인다.',
    refs: ['ev.D.waseda-seasonal-pages', 'obs.D.waseda-metadata-and-seasonal-pages'], directRefs: ['obs.D.waseda-metadata-and-seasonal-pages'],
    scopeCorrection: '정확한 page-bound occurrence만 kept하며, seasonal content를 耕寸集에 전이하지 않는다.',
    axisOptions: { 'edition/textual-lineage': { sameLineageCandidate: true, refs: ['ev.D.waseda-seasonal-pages'], note: 'This page is a direct Waseda witness, but its relation to other 窮通寶鑑/欄江綱 witnesses is unresolved.' } },
    realBlockers: ['date and edition genealogy unresolved'],
  }),
  makeClaim({
    claimId: 'claim.D.waseda-lineage-narrative', unit: 'D', status: 'corrected',
    candidateAssertion: '欄江綱 → 造化元鑰 → 窮通寶鑑 → 徐樂吾評註 lineage narrative가 전부 direct evidence다.',
    refs: ['ev.D.waseda-record-f0111', 'ev.D.waseda-seasonal-pages'], directRefs: ['ev.D.waseda-record-f0111', 'ev.D.waseda-seasonal-pages'],
    scopeCorrection: 'Waseda record/page가 직접 보여주는 metadata와 seasonal page만 인정한다. 각 genealogy transition은 direct evidence가 없는 단계마다 unresolved다.',
    gateStates: { E: 'unresolved', L: 'unresolved', S: 'unresolved' },
    realBlockers: ['edition genealogy links and dated witnesses unavailable'],
  }),
  makeClaim({
    claimId: 'claim.D.waseda-edition-date', unit: 'D', status: 'unresolved',
    candidateAssertion: 'Waseda F0111 scan의 publication/edition date가 확정되었다.',
    refs: ['ev.D.waseda-record-f0111'], scopeCorrection: 'official record 자체가 [出版地不明 : 出版者不明]이고 publicationDate unresolved다.',
    realBlockers: ['date-bearing colophon or institutional dating record unavailable'],
  }),
  makeClaim({
    claimId: 'claim.E.gengcun-seasonal-block', unit: 'E', status: 'rejected',
    candidateAssertion: '《耕寸集》 正月甲木 / 丙火 / 癸水 block이 실제 耕寸集 page evidence다.',
    refs: ['ev.E.cross-text-gengcun-seasonal-absence', 'ev.D.waseda-seasonal-pages'],
    scopeCorrection: '실제 耕寸集 판면 근거가 없고 matching seasonal structure는 Waseda 窮通寶鑑 witness에서만 확인되므로 CROSS_TEXT_CONTAMINATION으로 canonical graph에서 제거한다.',
    gateStates: { H: 'conflicted', E: 'conflicted', S: 'conflicted' },
    contaminationClassification: 'CROSS_TEXT_CONTAMINATION',
    realBlockers: ['Gengcun target folio access required before any source assignment'],
  }),
  makeClaim({
    claimId: 'claim.E.ctext-e-text-as-historical-scan', unit: 'E', status: 'rejected',
    candidateAssertion: 'ctext/전자텍스트 transcription은 historical scan/page evidence와 동등하다.',
    refs: ['ev.E.e-text-and-bibliography-boundaries'], scopeCorrection: '전자텍스트는 locator-only; exact historical scan bytes/page identity 없이는 historical witness로 분류하지 않는다.',
    gateStates: { H: 'conflicted', E: 'conflicted', S: 'conflicted' },
  }),
  makeClaim({
    claimId: 'claim.E.preface-date-as-edition-date', unit: 'E', status: 'rejected',
    candidateAssertion: '胡焜序/cover/preface date가 target edition publication date다.',
    refs: ['ev.B.hukun-1776-secondary-reading', 'ev.D.waseda-record-f0111', 'ev.E.e-text-and-bibliography-boundaries'],
    scopeCorrection: 'preface/cover/plate-heart metadata, author/date reading, and copy/edition date are separate fields.',
    gateStates: { H: 'conflicted', E: 'conflicted', S: 'conflicted' },
  }),
  makeClaim({
    claimId: 'claim.E.gemini-v6-all-resolved', unit: 'E', status: 'rejected',
    candidateAssertion: 'Gemini v6 광역 acquisition의 모든 claims가 parent verification을 통과했다.',
    refs: ['ev.E.e-text-and-bibliography-boundaries', 'ev.C.gengcun-target-pages-missing', 'ev.B.shanghai-1895-1923-bounded-search'],
    scopeCorrection: 'v6 packet/matrix bytes and conclusions were not imported. Parent-verified kept/corrected observations coexist with unresolved and rejected claims; overall resolution is rejected.',
    gateStates: { H: 'conflicted', E: 'conflicted', L: 'conflicted', S: 'conflicted', I: 'conflicted' },
    realBlockers: ['first-party 1895/1923 records', 'Gengcun target folios', 'edition/textual-lineage crosswalk', 'semantic authority and production grounding'],
  }),
]

const countStates = (claims, key) => Object.fromEntries(GATE_STATES.map(state => [state, claims.filter(claim => claim.gates?.[key]?.state === state).length]))

export function recomputeTypedReadiness(baseline) {
  const baselineClaims = baseline?.claims || []
  const before = Object.fromEntries(GATE_KEYS.map(key => [key, countStates(baselineClaims, key)]))
  const baselinePromotionIds = baselineClaims.filter(claim => claim.promotion?.ready === true).map(claim => claim.claimId)
  const after = structuredClone(before)
  return {
    sourceArtifact: 'artifacts/saju-five-classics-typed-readiness-contract-v0/complete.json',
    method: 'Recomputed from the 13 authoritative baseline claim gate records; the v6 overlay adds no canonical claim and therefore changes no baseline gate state.',
    before,
    after,
    changedGateStates: [],
    baselineClaimCount: baselineClaims.length,
    baselinePromotionReadyClaimIds: baselinePromotionIds,
    promotionReadyClaimIds: [],
    stableClaimPromotionCount: 0,
    availableForInterpretation: false,
    semanticAuthority: 'not_established',
    implementationSafeGrounding: 'not_established',
    productionActivation: 'blocked',
    reason: 'v6 direct observations remain an unpromoted overlay; unresolved lineage, independence, semantic binding, and production grounding preserve the prior closed readiness state.',
  }
}

export function contentHash(artifact) {
  const copy = structuredClone(artifact)
  delete copy.contentSha256
  delete copy.artifactIdentity
  return canonicalHash(copy)
}

const claimSummary = claims => ({
  claimCount: claims.length,
  statusCounts: Object.fromEntries(CLAIM_STATUSES.map(status => [status, claims.filter(claim => claim.status === status).length])),
  unitStatusCounts: Object.fromEntries(UNITS.map(unit => [unit, Object.fromEntries(CLAIM_STATUSES.map(status => [status, claims.filter(claim => claim.unit === unit && claim.status === status).length]))])),
  parentVerifiedClaimIds: claims.filter(claim => ['kept', 'corrected'].includes(claim.status) && claim.parentVerifiedEvidenceRefs.length > 0).map(claim => claim.claimId),
  contaminationClaimIds: claims.filter(claim => claim.contaminationClassification === 'CROSS_TEXT_CONTAMINATION').map(claim => claim.claimId),
})

export function buildSajuGeminiV6ParentAdjudication({ basisHead, predecessorReferences = {}, typedReadinessBaseline } = {}) {
  if (!/^[0-9a-f]{40}$/.test(basisHead || '')) throw new Error('v6 parent adjudication requires a valid basis HEAD')
  const claims = buildClaims()
  const typedReadinessRecalculation = recomputeTypedReadiness(typedReadinessBaseline)
  const artifact = {
    schemaVersion: SAJU_GEMINI_V6_PARENT_SCHEMA,
    version: SAJU_GEMINI_V6_PARENT_VERSION,
    basisHead,
    scope: {
      sourceOfTruth: 'Parent direct page/record observations and the authoritative v1–v5 typed-readiness/source-identity/timing artifacts.',
      candidateBoundary: 'Gemini v6 packet/matrix is untrusted_candidate_only; no candidate conclusion or transcription is imported as canonical evidence.',
      units: [...UNITS],
      directVerificationCompleted: [...UNITS],
      canonicalGraphMutation: 'additive_bounded_observations_only',
      prohibited: ['availableForInterpretation=true', 'production activation', 'implementation-safe automatic promotion', '정본 declaration'],
    },
    candidatePacket: structuredClone(V6_CANDIDATE_PACKET),
    evidencePolicy: { directPolicy, sameLineagePolicy, ocr: 'locator_only', sourceCategories: [...SOURCE_CATEGORIES] },
    externalEvidence: EXTERNAL_EVIDENCE.map(item => structuredClone(item)),
    pageObservations: PAGE_OBSERVATIONS.map(item => structuredClone(item)),
    claims,
    contaminationAudit: {
      status: 'completed_bounded',
      removedFromCanonicalGraph: claims.filter(claim => claim.contaminationClassification === 'CROSS_TEXT_CONTAMINATION').map(claim => claim.claimId),
      findings: [
        { findingId: 'contamination.gengcun-seasonal-content', classification: 'CROSS_TEXT_CONTAMINATION', sourceCandidate: '耕寸集 正月甲木 / 丙火 / 癸水', observedSource: 'Waseda 窮通寶鑑 pages only', action: 'removed', evidenceRefs: ['ev.E.cross-text-gengcun-seasonal-absence', 'ev.D.waseda-seasonal-pages'] },
        { findingId: 'contamination.e-text-as-scan', classification: 'REPRESENTATION_MISCLASSIFICATION', action: 'rejected_as_historical_witness', evidenceRefs: ['ev.E.e-text-and-bibliography-boundaries'] },
        { findingId: 'contamination.preface-date-transfer', classification: 'DATE_SCOPE_TRANSFER', action: 'rejected_as_edition_date', evidenceRefs: ['ev.B.hukun-1776-secondary-reading', 'ev.D.waseda-record-f0111'] },
        { findingId: 'contamination.bibliography-as-item', classification: 'ITEM_LEVEL_PROMOTION_ERROR', action: 'retained_as_locator_only', evidenceRefs: ['ev.B.shanghai-1895-1923-bounded-search', 'ev.E.e-text-and-bibliography-boundaries'] },
        { findingId: 'contamination.gemini-transcription-reentry', classification: 'STALE_CANDIDATE_REINTRODUCTION', action: 'not_imported', evidenceRefs: ['ev.E.e-text-and-bibliography-boundaries'] },
      ],
    },
    independenceReconciliation: {
      axes: INDEPENDENCE_AXES.map(axisName => ({
        axis: axisName,
        state: 'unresolved',
        countedAsIndependent: false,
        sameLineageCandidates: axisName === 'edition/textual-lineage' ? ['淵海子平 ↔ 神峰通考 worked examples', 'Waseda witness ↔ other 窮通寶鑑/欄江綱 candidates'] : [],
        evidenceRefs: axisName === 'physical-item' ? ['ev.A.tianyige-yuanhai-p18', 'ev.A.nlc99036-yuanhai-p50-p51', 'ev.D.waseda-record-f0111'] : [],
        missingEdges: [`${axisName}:independence relation remains unresolved`],
        note: axisName === 'digital-derivation' ? 'Public mirrors and institutional bitstreams are digital representations; duplicate byte objects are not independent physical/textual witnesses.' : axisName === 'edition/textual-lineage' ? 'Same worked example/wording is a dependence candidate, not independent lineage.' : axisName === 'semantic-corroboration' ? 'No independent semantic oracle or authority was established.' : 'Item identity and cross-item independence are separate claims.',
      })),
      overallState: 'unresolved',
      rule: sameLineagePolicy,
    },
    timingReconciliation: {
      status: 'bounded_reconciled_not_authoritative',
      workedExampleChain: ['birth condition', '順逆', 'selected 節', 'distance', '折除/conversion', '起運歲數', 'first 大運干支'],
      directFindings: ['淵海子平/NLC p.51 乙丑男: 後十五日 → 五三十五 → 五歲 → 逆行丁丑', '淵海子平/NLC p.51 甲子女: 後十日, 得九日 → 三三單九 variant → 三歲 → 逆行乙丑', '神峰通考 p.22 repeats the bounded examples', '三命通會 ANU p.59 separates abstract conversion/direction/節 rule from worked timing example'],
      literalBoundary: '三日為一歲 relation is direct in the inspected ANU page; exact 一日四月 / 一時辰十日 literal wording is not admitted from that page.',
      implementationBoundary: 'No rounding, interpolation, current-calendar conversion, or production timing procedure is promoted.',
      externalEvidencePlan: [{ priority: 'P0', nextAcquisition: 'First-party printed-folio/edition crosswalk for NLC 99036, Tianyi, 神峰通考, and ANU 三命通會; obtain authorized NCL 耕寸集 target folios.', acceptance: 'Direct contiguous pages plus item/edition relation; no same-example independence inflation.', scope: 'timing claims only; no activation' }],
    },
    typedReadinessRecalculation,
    predecessor: {
      authoritativeBaseline: 'artifacts/saju-five-classics-typed-readiness-contract-v0/complete.json',
      references: structuredClone(predecessorReferences),
      additiveRule: 'Only parent-verified bounded observations may be recorded; no v6 candidate changes the canonical 13-claim typed-readiness population.',
    },
    readiness: {
      availableForInterpretation: false,
      productionActivation: 'blocked',
      semanticAuthority: 'not_established',
      implementationSafeGrounding: 'not_established',
      stableClaimPromotionCount: 0,
      promotionReadyClaimIds: [],
      status: 'blocked',
      reason: 'v6 is an unpromoted parent audit. Bounded page observations survive, but source identity, edition/textual lineage, semantic corroboration, and production grounding remain open.',
    },
    promotion: {
      status: 'blocked', ready: false, stableClaimPromotionCount: 0, promotionReadyClaimIds: [],
      semanticAuthorityChanged: false, productionChanged: false, interpretationAvailable: false,
      scope: 'No claim promotion; no canonical procedure or source authority activation.',
      blockingEdges: ['I:unresolved', 'L:unresolved', 'S:unresolved', 'P:blocked', 'Gengcun target folios unavailable', '1895/1923 first-party item pages unavailable'],
    },
    summary: claimSummary(claims),
    contentSha256: null,
  }
  artifact.contentSha256 = contentHash(artifact)
  return artifact
}

const isObject = value => Boolean(value && typeof value === 'object' && !Array.isArray(value))

export function checkSajuGeminiV6ParentAdjudication(artifact) {
  const errors = []
  const fail = value => errors.push(value)
  if (!isObject(artifact)) return ['artifact_shape_invalid']
  if (artifact.schemaVersion !== SAJU_GEMINI_V6_PARENT_SCHEMA) fail('schema_version')
  if (artifact.version !== SAJU_GEMINI_V6_PARENT_VERSION) fail('version')
  if (!artifact.candidatePacket || artifact.candidatePacket.trustBoundary !== 'untrusted_candidate_only') fail('candidate_trust_boundary')
  if (artifact.candidatePacket?.importedAsCanonicalEvidence !== false || artifact.candidatePacket?.sourceTextAndVerdictsImported !== false) fail('candidate_import_boundary')
  if (!Array.isArray(artifact.candidatePacket?.importedConclusionFields) || artifact.candidatePacket.importedConclusionFields.length !== 0) fail('candidate_conclusions_imported')
  if (artifact.candidatePacket?.staleParentRejectedClaimsReintroduced !== false) fail('stale_parent_reintroduction')
  for (const file of artifact.candidatePacket?.packetFiles || []) if (file.contentAvailable !== false) fail(`candidate_content_available:${file.role}`)
  if (!Array.isArray(artifact.claims) || artifact.claims.length !== V6_CLAIM_IDS.length) fail('claim_count')
  const ids = artifact.claims?.map(claim => claim.claimId) || []
  if (ids.length !== new Set(ids).size || ids.sort().join('|') !== [...V6_CLAIM_IDS].sort().join('|')) fail('claim_ids')
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
      if (item?.state !== 'satisfied' && item?.state !== 'not_applicable' && item.missingEdges.length === 0) fail(`claim:${claim.claimId}:gate:${gateName}:missing_edge_required`)
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
    'claim.A.yuanhai-甲子女逆-chain': 'kept', 'claim.A.yuanhai-乙丑男逆-chain': 'kept', 'claim.A.shenfeng-same-worked-examples': 'kept',
    'claim.A.sanming-abstract-conversion-direction-jie': 'corrected', 'claim.A.same-worked-example-independent-lineage': 'rejected',
    'claim.B.hukun-1773': 'rejected', 'claim.B.hukun-1776': 'corrected', 'claim.C.gengcun-seal-provenance-candidate': 'kept',
    'claim.C.gengcun-TAQ-1843': 'rejected', 'claim.C.gengcun-TPQ-1578': 'rejected', 'claim.D.waseda-official-metadata': 'kept',
    'claim.D.waseda-seasonal-pages': 'kept', 'claim.D.waseda-lineage-narrative': 'corrected', 'claim.E.gengcun-seasonal-block': 'rejected',
    'claim.E.gemini-v6-all-resolved': 'rejected',
  }
  for (const [claimId, status] of Object.entries(requiredStatuses)) if (artifact.claims.find(claim => claim.claimId === claimId)?.status !== status) fail(`status_boundary:${claimId}:${status}`)
  if (!artifact.contaminationAudit?.removedFromCanonicalGraph?.includes('claim.E.gengcun-seasonal-block')) fail('contamination_missing')
  if (artifact.claims.find(claim => claim.claimId === 'claim.E.gengcun-seasonal-block')?.contaminationClassification !== 'CROSS_TEXT_CONTAMINATION') fail('contamination_classification')
  if (artifact.readiness?.availableForInterpretation !== false || artifact.readiness?.semanticAuthority !== 'not_established' || artifact.readiness?.productionActivation !== 'blocked') fail('readiness_open')
  if (artifact.promotion?.stableClaimPromotionCount !== 0 || artifact.promotion?.promotionReadyClaimIds?.length !== 0 || artifact.promotion?.semanticAuthorityChanged !== false || artifact.promotion?.productionChanged !== false) fail('promotion_side_effect')
  if (artifact.typedReadinessRecalculation?.changedGateStates?.length !== 0 || artifact.typedReadinessRecalculation?.promotionReadyClaimIds?.length !== 0) fail('typed_readiness_changed')
  if (!artifact.typedReadinessRecalculation?.before || !artifact.typedReadinessRecalculation?.after) fail('typed_readiness_missing')
  if (artifact.contentSha256 !== contentHash(artifact)) fail('content_hash')
  return [...new Set(errors)].sort()
}

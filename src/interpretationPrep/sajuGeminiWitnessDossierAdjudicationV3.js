import { createHash } from 'node:crypto'

import {
  buildSajuGeminiWitnessDossierAdjudicationV2,
  CLAIM_STATUSES,
  GATE_KEYS,
  GATE_STATES,
  INDEPENDENCE_AXES,
  SOURCE_CATEGORIES,
  UNITS,
} from './sajuGeminiWitnessDossierAdjudicationV2.js'

export const SAJU_GEMINI_WITNESS_DOSSIER_V3_SCHEMA = 'saju-gemini-witness-dossier-adjudication-v3'
export const SAJU_GEMINI_WITNESS_DOSSIER_V3_VERSION = '3.0.0'

const sha256 = value => createHash('sha256').update(value).digest('hex')

const candidateRoot = '/Users/softie/.gemini/antigravity-cli/brain/ebb37c1a-b791-4d55-92c3-0d4022511694'

export const CANDIDATE_PACKET_FILES = Object.freeze([
  {
    role: 'packet',
    path: `${candidateRoot}/luna-p0-evidence-packet-v3.md`,
    byteLength: 17710,
    byteSha256: '89b1dd9e26cedce02c9167ea259bb67e4911963afc2aab865ca99c4d384488f5',
  },
  {
    role: 'matrix',
    path: `${candidateRoot}/luna-p0-evidence-matrix-v3.json`,
    byteLength: 9775,
    byteSha256: '5901fb1c2227967a6f791d53777f62544438428c4b6b810fe088c6552d847f69',
  },
  {
    role: 'packet_metadata',
    path: `${candidateRoot}/luna-p0-evidence-packet-v3.md.metadata.json`,
    byteLength: 169,
    byteSha256: '6eb5ba8e1cb90834721b03589f83acb32e7f872d22203276b835733943ca47f3',
  },
  {
    role: 'matrix_metadata',
    path: `${candidateRoot}/luna-p0-evidence-matrix-v3.json.metadata.json`,
    byteLength: 160,
    byteSha256: '31734aaa6aa5fd059836fd10fd961187b025e53226edce8a57968a5b396aad82',
  },
])

export const CANDIDATE_PACKET = Object.freeze({
  campaign: 'LUNA-P0-EVIDENCE-ACQUISITION-V3',
  modelClaimedByUser: 'Gemini 3.7 Flash High v3',
  executionRole: 'Gemini 3.7 Flash High (Evidence Acquisition Agent)',
  packetSchemaVersion: '3.0.0',
  packetFiles: CANDIDATE_PACKET_FILES.map(file => ({ ...file })),
  selfDeclaredAdjudicationBoundary: 'non_adjudicative',
  trustBoundary: 'untrusted_candidate_only',
  importedAsCanonicalEvidence: false,
  importedConclusionFields: [],
  actualModelRuntimeVerified: false,
  sourceTextAndVerdictsImported: false,
})

const jsgRecordUrl = 'https://jsg.aks.ac.kr/dir/view?dataId=JSG_K3-437'
const nlcSearchUrl = 'https://vufind.library.sh.cn/api/v1/search?lookfor='
const sonkeikakuCatalogUrl = 'https://ndlsearch.ndl.go.jp/books/R100000002-I000000779093'
const wasedaPdfUrl = 'https://archive.wul.waseda.ac.jp/kosho/bunko19/bunko19_f0111/bunko19_f0111.pdf'
const wasedaRecordUrl = 'https://www.wul.waseda.ac.jp/kotenseki/html/bunko19/bunko19_f0111/index.html'

const rawObservationPolicy = 'A bounded record or page observation is admitted only at its stated locator and source-category scope; it does not become canonical text, semantic authority, interpretation readiness, or activation.'

export const EXTERNAL_EVIDENCE = Object.freeze([
  {
    evidenceId: 'ev.packet.v3-file-identity',
    unit: 'E',
    sourceCategory: 'UNRESOLVED',
    status: 'parent_verified_byte_identity_only',
    packetFiles: CANDIDATE_PACKET_FILES.map(file => ({ ...file })),
    selfDeclaredFields: ['campaign', 'executionRole', 'packetSchemaVersion', 'adjudicationBoundary'],
    scopeBoundary: 'The parent verified the exact local file paths, byte lengths, and SHA-256 values. The files remain untrusted candidate input: model runtime, agent identity, historical-source authority, and packet conclusions are not independently proved by these bytes.',
  },
  {
    evidenceId: 'ev.A.sonkeikaku-candidate-only',
    unit: 'A',
    sourceCategory: 'PHYSICAL_ITEM_CANDIDATE',
    status: 'candidate_packet_only',
    candidateInstitution: '尊經閣文庫 / 前田育德會',
    candidateDescription: 'The v3 packet reports a 34-volume complete old-book candidate but supplies no shelfmark, item-level official record, page locator, scan URL, or bytes.',
    relatedCollectionCatalogUrl: sonkeikakuCatalogUrl,
    scopeBoundary: 'The National Diet Library catalog link is a collection-level catalog lead, not proof that this 五行精紀 item is present. No Sonkeikaku item identity or target page is admitted.',
  },
  {
    evidenceId: 'ev.A.leaf-layout-and-text-variation',
    unit: 'A',
    sourceCategory: 'INFERENCE',
    status: 'parent_verified_bounded_comparison',
    comparedEvidenceIds: ['ev.A.jangseogak-official-scan', 'ev.A.nlc-vol4-derivative-scan'],
    comparedObservationIds: ['obs.A.jangseogak-vol33-heading-and-passage', 'obs.A.nlc-vol4-vol33-heading-and-passage'],
    scopeBoundary: 'This is a parent comparison of two bounded visual observations. It records locator and layout differences without rekeying either scan into canonical text or proving edition independence.',
  },
  {
    evidenceId: 'ev.C.shanghai-v3-bounded-official-search',
    unit: 'C',
    sourceCategory: 'INSTITUTIONAL_METADATA',
    status: 'parent_verified_bounded_search',
    baseUrl: 'https://vufind.library.sh.cn/',
    queries: [
      {
        term: '子平真詮',
        url: `${nlcSearchUrl}${encodeURIComponent('子平真詮')}`,
        resultCount: 5,
        returnedTitles: ['子平真诠', '子平真诠评注', '子平真诠评注', '子平精粹 5 子平真诠·命理约言', '四库存目子平汇刊 2 秘本子平真诠'],
      },
      { term: '報暉草堂', url: `${nlcSearchUrl}${encodeURIComponent('報暉草堂')}`, resultCount: 0 },
      { term: '育新書局', url: `${nlcSearchUrl}${encodeURIComponent('育新書局')}`, resultCount: 1, returnedTitle: '重修金华丛书 14', unrelated: true },
    ],
    scopeBoundary: 'The bounded official API results did not expose the candidate 1895/1923 date-bearing item records, exact 1052 entry, holdings, or target pages. This is not a global absence claim.',
  },
  {
    evidenceId: 'ev.C.shanghai-1052-item-record-unresolved',
    unit: 'C',
    sourceCategory: 'UNRESOLVED',
    status: 'open_blocker',
    candidatePacketAssertion: 'Shanghai Library catalog entry 1052 for the 1895 報暉草堂 witness',
    missingEvidence: ['exact official catalog record or stable item identifier', 'physical description', 'target-page scan', 'independent edition-lineage comparison'],
    scopeBoundary: 'The candidate packet citation is retained as a lead only; it is not promoted to a first-party item record.',
  },
  {
    evidenceId: 'ev.D.waseda-opening-pages-v3',
    unit: 'D',
    sourceCategory: 'DIRECT_OFFICIAL_SCAN',
    status: 'parent_verified_bounded_negative',
    url: wasedaPdfUrl,
    recordUrl: wasedaRecordUrl,
    pdfPageCount: 108,
    pdfByteSha256: '123ce84b44bd20ecfdd6538bffc413a5e3948598315cd99f857a5c985c7257ae',
    inspectedRenderedPages: [1, 2, 3, 4, 5],
    inspectedPageImageSha256: {
      2: '7bb296744d28274def29bb0a3f224d21693f84c924514c5403d14d2aeb5c58da',
      3: 'e0ed84a943196b49334db457e1fefd148b03bfab2768731c914367bc3799a0bf',
      4: 'cad7e2657dfdc1caee0dfeff403141115e11d3f3d9149d31dc0225ddf22efdfd',
      5: '75bbc8ff60c3174d0ca625f694f680a67b162f4bd55ba294ce16b57338f9903c',
    },
    scopeBoundary: 'The official scan and opening pages were inspected directly. The exact candidate date phrase was not parent-admitted in the bounded opening inspection; the result is not a global absence claim.',
  },
  {
    evidenceId: 'ev.E.princeton-candidate-only',
    unit: 'E',
    sourceCategory: 'PHYSICAL_ITEM_CANDIDATE',
    status: 'candidate_packet_only',
    candidateMetadata: { shelfmark: 'SCSB-4603974', barcode: 'CU51356996', callNumber: '1739 2920', oclc: '502860307', imprint: '上海 春明書局, 民國26年 [1937], 286p, 19cm' },
    missingEvidence: ['independently verified official catalog page', 'open scan or page bytes', 'target-page locator'],
    scopeBoundary: 'The v3 packet self-reports Princeton/ReCAP metadata, but no direct official record or scan was independently observed in this parent pass.',
  },
])

export const PAGE_OBSERVATIONS = Object.freeze([
  {
    observationId: 'obs.packet.v3-file-identity',
    unit: 'E',
    evidenceId: 'ev.packet.v3-file-identity',
    sourceCategory: 'UNRESOLVED',
    files: CANDIDATE_PACKET_FILES.map(file => ({ ...file })),
    directObservation: 'The four v3 packet/matrix files exist at the declared local paths and their current bytes match the declared lengths and SHA-256 values.',
    candidateTextObserved: false,
    canonicalTextObserved: false,
    runtimeIdentityObserved: false,
    scopeBoundary: rawObservationPolicy,
  },
  {
    observationId: 'obs.A.leaf-level-layout-and-text-variation',
    unit: 'A',
    evidenceId: 'ev.A.leaf-layout-and-text-variation',
    sourceCategory: 'INFERENCE',
    comparedEvidenceIds: ['ev.A.jangseogak-official-scan', 'ev.A.nlc-vol4-derivative-scan'],
    layoutObservation: {
      jangseogak: { renderedPages: [71, 72], pageModel: 'one rendered scan page per observed leaf/page image', visiblePrintedStructure: '卷三十三 heading and continuous text block' },
      nlcDerivative: { renderedPages: [105, 106], pageModel: 'photographic two-page spreads with central gutter', visiblePrintedFolios: { page105: '一', page106: '二' }, visiblePrintedStructure: '卷三十三 heading on the right leaf and continuation across the spread' },
    },
    boundedTextVariants: [
      { locator: '甲子陽男 worked-example lead-in', jangseogak: '二十九日申時立春', nlcDerivative: '二十九日立春' },
      { locator: 'later stopping point', jangseogak: 'not used as a normalized equivalent', nlcDerivative: '至二十九日申時止' },
    ],
    directObservation: 'The two bounded scan observations support the same passage family, but their PDF-page/leaf geometry is not aligned and the visible lead-in differs. The comparison preserves the variation instead of forcing a single transcription.',
    canonicalTextObserved: false,
    scopeBoundary: rawObservationPolicy,
  },
  {
    observationId: 'obs.A.sonkeikaku-no-item-scan',
    unit: 'A',
    evidenceId: 'ev.A.sonkeikaku-candidate-only',
    sourceCategory: 'UNRESOLVED',
    directObservation: 'No Sonkeikaku item-level official record, shelfmark, scan URL, page image, or target passage bytes were parent-verified.',
    pageBytesObserved: false,
    canonicalTextObserved: false,
    negativeBoundary: 'The result is bounded to this pass and does not assert that no access route exists.',
  },
  {
    observationId: 'obs.C.shanghai-v3-bounded-search',
    unit: 'C',
    evidenceId: 'ev.C.shanghai-v3-bounded-official-search',
    sourceCategory: 'INSTITUTIONAL_METADATA',
    directObservation: 'The official Shanghai Library API returned five broad 子平真詮 results, zero 報暉草堂 results, and one unrelated 育新書局 result; none supplied the candidate date-bearing item and target pages.',
    canonicalTextObserved: false,
    negativeBoundary: 'This is a bounded result-set observation, not a global absence claim.',
    scopeBoundary: rawObservationPolicy,
  },
  {
    observationId: 'obs.D.waseda-opening-pages-v3',
    unit: 'D',
    evidenceId: 'ev.D.waseda-opening-pages-v3',
    sourceCategory: 'DIRECT_OFFICIAL_SCAN',
    renderedPages: [1, 2, 3, 4, 5],
    directObservation: 'The cover and opening 序 pages were inspected through rendered pages 1–5. The exact 光緒十二年歲次丙戌孟秋之月楚南余春台序 phrase was not confidently observed in that bounded opening set.',
    canonicalTextObserved: false,
    negativeBoundary: 'The result is bounded to rendered pages 1–5 and does not assert global absence from the full 108-page scan.',
    scopeBoundary: rawObservationPolicy,
  },
  {
    observationId: 'obs.E.princeton-no-independent-record',
    unit: 'E',
    evidenceId: 'ev.E.princeton-candidate-only',
    sourceCategory: 'UNRESOLVED',
    directObservation: 'No independently observed official Princeton catalog record, open scan, page image, or target-page locator was available in this pass.',
    pageBytesObserved: false,
    canonicalTextObserved: false,
    negativeBoundary: 'The candidate metadata remains a lead; the physical existence claim is not globally rejected.',
  },
])

const defaultGates = () => Object.fromEntries(GATE_KEYS.map(key => [key, 'unresolved']))
const defaultAxes = () => Object.fromEntries(INDEPENDENCE_AXES.map(axis => [axis, {
  state: 'unresolved',
  countedAsIndependent: false,
  sameLineageCandidate: false,
  missingEdges: [`${axis} independence evidence`],
}]))
const v3Blocker = (blockerId, edge, reason) => ({ blockerId, edge, reason })
const makeV3Claim = ({ claimId, unit, candidateAssertion, status, evidenceRefs, gates = {}, axes = {}, realBlockers = [], scopeCorrection, promotionTarget = 'none' }) => ({
  claimId,
  unit,
  candidateAssertion,
  status,
  candidateEvidenceAccepted: false,
  parentVerifiedEvidenceRefs: [...evidenceRefs],
  gates: { ...defaultGates(), ...gates },
  independence: { ...defaultAxes(), ...axes },
  blockerAssessment: {
    falseBlockers: [v3Blocker('false.v3-candidate-packet-as-historical-proof', 'all-gates', 'The v3 packet is an untrusted acquisition report; its self-declared conclusions are not parent verification.')],
    realBlockers: [...realBlockers],
  },
  scopeCorrection,
  promotion: {
    target: promotionTarget,
    status: 'blocked',
    ready: false,
    reason: 'This parent audit reports bounded evidence only; it does not grant semantic authority, interpretation readiness, or production activation.',
  },
})

const A_SONKEIKAKU_BLOCKER = v3Blocker('blocker.A.sonkeikaku-item-identity', 'H/E/L/S/I/P', 'The v3 packet supplies a Sonkeikaku collection/item candidate without an independently observed item-level record, shelfmark, scan, or target-page bytes.')
const C_1052_BLOCKER = v3Blocker('blocker.C.shanghai-1052-first-party-record', 'H/E/L/S/I/P', 'The bounded Shanghai Library API search did not expose the claimed 1052 item record or target pages, so the packet citation remains a lead only.')
const E_PRINCETON_BLOCKER = v3Blocker('blocker.E.princeton-direct-record-or-scan', 'H/E/I/P', 'The Princeton/ReCAP identifiers are self-reported candidate metadata; no direct official record or scan was independently observed.')
const PACKET_RUNTIME_BLOCKER = v3Blocker('blocker.packet.runtime-provenance', 'H/E', 'The packet/matrix bytes and self-declared role are identified, but the actual Gemini runtime/model invocation is not independently verified.')

const appendRefs = (claim, refs) => ({ ...claim, parentVerifiedEvidenceRefs: [...new Set([...(claim.parentVerifiedEvidenceRefs || []), ...refs])] })

export function buildSajuGeminiWitnessDossierAdjudicationV3({ basisHead, predecessorReferences = {} } = {}) {
  const base = buildSajuGeminiWitnessDossierAdjudicationV2({ basisHead, predecessorReferences })
  const claims = base.claims.map(claim => {
    if (claim.claimId === 'claim.A.second-physical-scan-not-textual-independence') {
      return appendRefs({
        ...claim,
        candidateAssertion: 'Jangseogak K3-437 and NLC 06857 are distinct institutionally identified physical items with bounded scans supporting the same passage family, while page/leaf geometry and at least one lead-in wording differ; textual independence remains unresolved.',
        scopeCorrection: 'The parent comparison records physical-item, digital-derivation, leaf-layout, and bounded wording differences separately. It does not convert them into edition or semantic independence.',
      }, ['ev.A.leaf-layout-and-text-variation', 'obs.A.leaf-level-layout-and-text-variation'])
    }
    if (claim.claimId === 'claim.C.1895-item-level-witness' || claim.claimId === 'claim.C.1923-item-level-witness') {
      return appendRefs(claim, ['ev.C.shanghai-v3-bounded-official-search', 'obs.C.shanghai-v3-bounded-search'])
    }
    if (claim.claimId === 'claim.D.preface-date') {
      return appendRefs({
        ...claim,
        scopeCorrection: 'The exact phrase remains unresolved after the bounded opening-page inspection was extended through rendered pages 1–5; it remains neither imported from the candidate packet nor globally rejected.',
      }, ['ev.D.waseda-opening-pages-v3', 'obs.D.waseda-opening-pages-v3'])
    }
    if (claim.claimId === 'claim.E.gemini-all-units-resolved') {
      return appendRefs(claim, ['ev.packet.v3-file-identity', 'ev.A.sonkeikaku-candidate-only', 'ev.C.shanghai-1052-item-record-unresolved', 'ev.E.princeton-candidate-only'])
    }
    return claim
  })

  claims.push(
    makeV3Claim({
      claimId: 'claim.packet.v3-files-byte-identified',
      unit: 'E',
      candidateAssertion: 'The supplied Gemini v3 packet, matrix, and metadata files exist at the declared local paths with the declared byte identities.',
      status: 'partially_supported',
      evidenceRefs: ['ev.packet.v3-file-identity', 'obs.packet.v3-file-identity'],
      gates: { H: 'satisfied', E: 'satisfied', L: 'not_applicable', S: 'not_applicable', I: 'unresolved', P: 'unresolved' },
      axes: Object.fromEntries(INDEPENDENCE_AXES.map(axis => [axis, {
        state: 'not_applicable',
        countedAsIndependent: false,
        sameLineageCandidate: false,
        missingEdges: [],
      }])),
      realBlockers: [PACKET_RUNTIME_BLOCKER],
      scopeCorrection: 'This proves only local file identity and self-declared packet fields. It does not prove runtime provenance, historical-source authority, any candidate conclusion, or model capability.',
    }),
    makeV3Claim({
      claimId: 'claim.A.sonkeikaku-34-volume-witness',
      unit: 'A',
      candidateAssertion: 'The v3 packet’s reported Sonkeikaku 34-volume 五行精紀 candidate is an independently verified physical witness with a target 卷33 scan.',
      status: 'unresolved',
      evidenceRefs: ['ev.packet.v3-file-identity', 'ev.A.sonkeikaku-candidate-only', 'obs.A.sonkeikaku-no-item-scan'],
      gates: { H: 'unresolved', E: 'unresolved', L: 'unresolved', S: 'unresolved', I: 'unresolved', P: 'unresolved' },
      realBlockers: [A_SONKEIKAKU_BLOCKER],
      scopeCorrection: 'The candidate is retained for follow-up only. A collection catalog or packet assertion cannot substitute for an item-level record and actual target-page bytes.',
      promotionTarget: 'cross_lineage_stability',
    }),
    makeV3Claim({
      claimId: 'claim.C.shanghai-1052-first-party-record',
      unit: 'C',
      candidateAssertion: 'Shanghai Library catalog entry 1052 independently verifies the 1895 報暉草堂 physical item and its target pages.',
      status: 'unresolved',
      evidenceRefs: ['ev.packet.v3-file-identity', 'ev.C.shanghai-v3-bounded-official-search', 'ev.C.shanghai-1052-item-record-unresolved', 'obs.C.shanghai-v3-bounded-search'],
      gates: { H: 'unresolved', E: 'unresolved', L: 'unresolved', S: 'unresolved', I: 'unresolved', P: 'unresolved' },
      realBlockers: [C_1052_BLOCKER],
      scopeCorrection: 'The official bounded API result set did not expose the cited entry or pages. The 1895 label remains a third-party bibliographic lead until an exact first-party record and scan are obtained.',
      promotionTarget: 'lineage_specific_stability',
    }),
    makeV3Claim({
      claimId: 'claim.E.princeton-1937-direct-witness',
      unit: 'E',
      candidateAssertion: 'Princeton/ReCAP SCSB-4603974 independently verifies an open 1937 評註淵海子平 scan and target-page baseline.',
      status: 'unresolved',
      evidenceRefs: ['ev.packet.v3-file-identity', 'ev.E.princeton-candidate-only', 'obs.E.princeton-no-independent-record'],
      gates: { H: 'unresolved', E: 'unresolved', L: 'unresolved', S: 'unresolved', I: 'unresolved', P: 'unresolved' },
      realBlockers: [E_PRINCETON_BLOCKER],
      scopeCorrection: 'The identifiers and imprint remain candidate metadata only. No open scan, page bytes, or direct official catalog record was independently observed.',
      promotionTarget: 'historical_observation_stability',
    }),
  )

  const gateStateCounts = Object.fromEntries(GATE_KEYS.map(gate => [gate, Object.fromEntries(GATE_STATES.map(state => [state, claims.filter(claim => claim.gates[gate] === state).length]))]))
  const parentVerifiedClaimIds = claims.filter(claim => claim.status === 'supported').map(claim => claim.claimId)
  const statusCounts = Object.fromEntries(CLAIM_STATUSES.map(status => [status, claims.filter(claim => claim.status === status).length]))

  return {
    ...base,
    schemaVersion: SAJU_GEMINI_WITNESS_DOSSIER_V3_SCHEMA,
    version: SAJU_GEMINI_WITNESS_DOSSIER_V3_VERSION,
    scope: {
      ...base.scope,
      purpose: 'Parent-direct re-audit of the actual Gemini 3.7 Flash High v3 packet/matrix and historical-witness claims Units A–E.',
      sourceOfTruth: 'Parent-observed first-party records, byte-identified official/derivative scans, bounded visual page comparisons, and byte-identified untrusted candidate packet files.',
    },
    candidatePacket: CANDIDATE_PACKET,
    externalEvidence: [...base.externalEvidence, ...EXTERNAL_EVIDENCE],
    pageObservations: [...base.pageObservations, ...PAGE_OBSERVATIONS],
    claims,
    blockerLedger: {
      ...base.blockerLedger,
      realBlockers: [...base.blockerLedger.realBlockers, A_SONKEIKAKU_BLOCKER, C_1052_BLOCKER, E_PRINCETON_BLOCKER, PACKET_RUNTIME_BLOCKER],
    },
    readinessOverlay: {
      ...base.readinessOverlay,
      parentVerified: {
        ...base.readinessOverlay.parentVerified,
        comparablePopulation: `${claims.length} parent-adjudicated assertions; candidate baseline counts are not numerically comparable.`,
        gateStateCounts,
        parentVerifiedClaimIds,
      },
    },
    summary: {
      ...base.summary,
      claimCount: claims.length,
      statusCounts,
      parentVerifiedClaimCount: parentVerifiedClaimIds.length,
      supportedScope: [...base.summary.supportedScope, 'v3 packet/matrix local byte identity only'],
      unresolvedScope: [...base.summary.unresolvedScope, 'Sonkeikaku item-level identity and target scan', 'Shanghai Library entry 1052 and target pages', 'Princeton direct official record/scan', 'Gemini runtime/model provenance'],
      predecessorDelta: {
        predecessorSchema: 'saju-gemini-witness-dossier-adjudication-v2',
        directEvidenceBoundaryChanged: true,
        changes: [
          'The actual v3 packet, matrix, and metadata bytes are identified without importing their historical conclusions or canonical text.',
          'Unit A adds a parent-observed leaf/layout comparison and preserves the 二十九日申時立春 versus 二十九日立春 variation.',
          'The reported Sonkeikaku candidate remains unresolved because no item-level record or target scan was independently observed.',
          'Unit C records the exact bounded Shanghai API result set; the cited 1052 item remains unresolved.',
          'Unit D extends the bounded opening inspection through rendered pages 1–5; the exact date phrase remains unresolved.',
          'Unit E keeps the Princeton identifiers and the packet runtime/model provenance candidate-only; readiness and activation remain closed.',
        ],
      },
    },
  }
}

const isObject = value => Boolean(value && typeof value === 'object' && !Array.isArray(value))
const expectedStatus = {
  'claim.A.jangseogak-vol33-target-passage': 'partially_supported',
  'claim.A.nlc-vol4-route-correction': 'supported',
  'claim.A.second-physical-scan-not-textual-independence': 'partially_supported',
  'claim.A.kyujanggak-vol33-scan-access': 'unresolved',
  'claim.B.gengcun-seal-provenance-candidate': 'partially_supported',
  'claim.B.qin-enfu-room-name-attribution': 'supported',
  'claim.B.taq-1843-from-seal': 'unsupported',
  'claim.C.1895-bibliographic-witness-only': 'supported',
  'claim.C.1923-bibliographic-witness-only': 'supported',
  'claim.C.1895-item-level-witness': 'unresolved',
  'claim.C.1923-item-level-witness': 'unresolved',
  'claim.C.two-dated-witnesses-establish-two-lineages': 'unsupported',
  'claim.D.waseda-seasonal-headings': 'supported',
  'claim.D.preface-date': 'unresolved',
  'claim.D.current-copy-1886': 'unsupported',
  'claim.E.source-categories-and-gates-typed': 'supported',
  'claim.E.gemini-all-units-resolved': 'unsupported',
  'claim.packet.v3-files-byte-identified': 'partially_supported',
  'claim.A.sonkeikaku-34-volume-witness': 'unresolved',
  'claim.C.shanghai-1052-first-party-record': 'unresolved',
  'claim.E.princeton-1937-direct-witness': 'unresolved',
}

export function checkSajuGeminiWitnessDossierAdjudicationV3(artifact) {
  const errors = []
  if (!isObject(artifact)) return ['artifact_shape_invalid']
  if (artifact.schemaVersion !== SAJU_GEMINI_WITNESS_DOSSIER_V3_SCHEMA) errors.push('schema_version')
  if (artifact.version !== SAJU_GEMINI_WITNESS_DOSSIER_V3_VERSION) errors.push('version')
  if (artifact.candidatePacket?.modelClaimedByUser !== 'Gemini 3.7 Flash High v3') errors.push('candidate_model_claim')
  if (artifact.candidatePacket?.trustBoundary !== 'untrusted_candidate_only') errors.push('candidate_trust_boundary')
  if (artifact.candidatePacket?.importedAsCanonicalEvidence !== false) errors.push('candidate_import_boundary')
  if (artifact.candidatePacket?.importedConclusionFields?.length !== 0) errors.push('candidate_conclusion_import')
  if (artifact.candidatePacket?.actualModelRuntimeVerified !== false) errors.push('candidate_runtime_boundary')
  if (JSON.stringify(artifact.scope?.sourceCategories) !== JSON.stringify(SOURCE_CATEGORIES)) errors.push('source_category_contract')
  if (JSON.stringify(artifact.scope?.gateKeys) !== JSON.stringify(GATE_KEYS)) errors.push('gate_contract')
  if (JSON.stringify(artifact.scope?.independenceAxes) !== JSON.stringify(INDEPENDENCE_AXES)) errors.push('independence_contract')
  if (!Array.isArray(artifact.externalEvidence) || artifact.externalEvidence.length < 27) errors.push('external_evidence_count')
  if (!Array.isArray(artifact.pageObservations) || artifact.pageObservations.length < 18) errors.push('page_observation_count')
  if (!Array.isArray(artifact.claims) || artifact.claims.length !== Object.keys(expectedStatus).length) errors.push('claim_count')

  const evidenceIds = new Set((artifact.externalEvidence || []).map(item => item.evidenceId))
  const observationIds = new Set((artifact.pageObservations || []).map(item => item.observationId))
  if (evidenceIds.size !== (artifact.externalEvidence || []).length) errors.push('duplicate_evidence_id')
  if (observationIds.size !== (artifact.pageObservations || []).length) errors.push('duplicate_observation_id')
  for (const evidence of artifact.externalEvidence || []) {
    if (!SOURCE_CATEGORIES.includes(evidence.sourceCategory)) errors.push(`evidence:${evidence.evidenceId}:source_category`)
    if (evidence.canonicalTextAdmitted === true) errors.push(`evidence:${evidence.evidenceId}:canonical_text_admitted`)
  }
  for (const observation of artifact.pageObservations || []) {
    if (!SOURCE_CATEGORIES.includes(observation.sourceCategory)) errors.push(`observation:${observation.observationId}:source_category`)
    if (observation.canonicalTextObserved === true) errors.push(`observation:${observation.observationId}:canonical_text_observed`)
    if (observation.evidenceId && !evidenceIds.has(observation.evidenceId)) errors.push(`observation:${observation.observationId}:evidence_ref`)
  }
  for (const claim of artifact.claims || []) {
    if (!UNITS.includes(claim.unit)) errors.push(`claim:${claim.claimId}:unit`)
    if (!CLAIM_STATUSES.includes(claim.status)) errors.push(`claim:${claim.claimId}:status`)
    for (const gate of GATE_KEYS) if (!GATE_STATES.includes(claim.gates?.[gate])) errors.push(`claim:${claim.claimId}:gate:${gate}`)
    for (const axis of INDEPENDENCE_AXES) {
      const axisEvidence = claim.independence?.[axis]
      if (!isObject(axisEvidence)) errors.push(`claim:${claim.claimId}:axis:${axis}:missing`)
      if (axisEvidence?.countedAsIndependent === true) errors.push(`claim:${claim.claimId}:axis:${axis}:counted_as_independent`)
    }
    if (claim.candidateEvidenceAccepted !== false) errors.push(`claim:${claim.claimId}:candidate_evidence_accepted`)
    if (claim.promotion?.ready !== false || claim.promotion?.status !== 'blocked') errors.push(`claim:${claim.claimId}:promotion_not_blocked`)
    for (const evidenceRef of claim.parentVerifiedEvidenceRefs || []) if (!evidenceIds.has(evidenceRef) && !observationIds.has(evidenceRef)) errors.push(`claim:${claim.claimId}:evidence_ref:${evidenceRef}`)
  }

  const findClaim = claimId => artifact.claims?.find(claim => claim.claimId === claimId)
  for (const [claimId, status] of Object.entries(expectedStatus)) if (findClaim(claimId)?.status !== status) errors.push(`status_boundary:${claimId}`)
  const leaf = artifact.pageObservations?.find(item => item.observationId === 'obs.A.leaf-level-layout-and-text-variation')
  if (leaf?.sourceCategory !== 'INFERENCE' || leaf?.canonicalTextObserved !== false || leaf?.boundedTextVariants?.[0]?.jangseogak !== '二十九日申時立春' || leaf?.boundedTextVariants?.[0]?.nlcDerivative !== '二十九日立春') errors.push('A_leaf_comparison_boundary')
  const sonkeikaku = findClaim('claim.A.sonkeikaku-34-volume-witness')
  if (sonkeikaku?.status !== 'unresolved') errors.push('A_Sonkeikaku_boundary')
  const shanghai = findClaim('claim.C.shanghai-1052-first-party-record')
  if (shanghai?.status !== 'unresolved') errors.push('C_1052_boundary')
  const dDate = findClaim('claim.D.preface-date')
  if (dDate?.status !== 'unresolved') errors.push('D_preface_boundary')
  const princeton = findClaim('claim.E.princeton-1937-direct-witness')
  if (princeton?.status !== 'unresolved') errors.push('E_Princeton_boundary')

  const candidateFiles = artifact.candidatePacket?.packetFiles || []
  for (const expected of CANDIDATE_PACKET_FILES) {
    const actual = candidateFiles.find(file => file.role === expected.role)
    if (!actual || actual.path !== expected.path || actual.byteLength !== expected.byteLength || actual.byteSha256 !== expected.byteSha256) errors.push(`candidate_file_identity:${expected.role}`)
  }
  const statusCounts = Object.fromEntries(CLAIM_STATUSES.map(status => [status, (artifact.claims || []).filter(claim => claim.status === status).length]))
  for (const status of CLAIM_STATUSES) if (artifact.summary?.statusCounts?.[status] !== statusCounts[status]) errors.push(`summary_status_count:${status}`)
  if (artifact.summary?.claimCount !== artifact.claims?.length) errors.push('summary_claim_count')
  if (artifact.readinessOverlay?.parentVerified?.promotionReadyClaimIds?.length !== 0) errors.push('readiness_promotion')
  if (artifact.readinessOverlay?.parentVerified?.stableClaimPromotionCount !== 0) errors.push('readiness_stable_count')
  if (artifact.readinessOverlay?.parentVerified?.availableForInterpretation !== false) errors.push('readiness_available')
  if (artifact.readinessOverlay?.parentVerified?.semanticAuthority !== 'not_established') errors.push('readiness_semantic_authority')
  if (artifact.readinessOverlay?.parentVerified?.implementationSafeGrounding !== 'not_established') errors.push('readiness_implementation')
  if (artifact.readinessOverlay?.parentVerified?.productionActivation !== 'blocked') errors.push('readiness_activation')
  if (artifact.promotion?.ready !== false || artifact.promotion?.status !== 'blocked') errors.push('promotion_not_blocked')
  if (artifact.promotion?.stableClaimPromotionCount !== 0 || artifact.promotion?.semanticAuthorityChanged !== false || artifact.promotion?.productionChanged !== false || artifact.promotion?.interpretationAvailable !== false) errors.push('promotion_side_effect')
  return [...new Set(errors)].sort()
}

export const EXTERNAL_SOURCE_URLS = Object.freeze({
  jsgRecordUrl,
  sonkeikakuCatalogUrl,
  wasedaRecordUrl,
  wasedaPdfUrl,
  shanghaiSearchBaseUrl: 'https://vufind.library.sh.cn/',
})

export const candidatePacketByteSha256 = value => sha256(value)

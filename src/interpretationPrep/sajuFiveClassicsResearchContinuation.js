import { createHash } from 'node:crypto'

import { canonicalIdentityJson } from '../artifactIdentity.js'
import { evaluateBoundedContinuation } from '../boundedContinuationGate.js'

export const SAJU_FIVE_CLASSICS_RESEARCH_CONTINUATION_SCHEMA = 'saju-five-classics-research-continuation-v1'
export const SAJU_FIVE_CLASSICS_RESEARCH_CONTINUATION_VERSION = '1.0.0'

export const PREDECESSOR_ARTIFACT_PATHS = Object.freeze({
  sourceFrontier: 'artifacts/saju-five-classics-source-identity-frontier-v0/complete.json',
  claimAdjudication: 'artifacts/saju-five-classics-claim-adjudication-v0/complete.json',
  timingAuthority: 'artifacts/saju-timing-authority-frontier-v0/complete.json',
})

export const ANU_V2_SOURCE_ID = 'source.anu.sanming-tonghui.e0d2d017.v2'
export const ANU_V2_RECORD_OBSERVATION_ID = 'obs.anu.sanming-tonghui.record-v2'
export const ANU_V2_BITSTREAM_OBSERVATION_ID = 'obs.anu.sanming-tonghui.v2-bitstream'
export const ANU_V2_SCAN_58_OBSERVATION_ID = 'obs.anu.sanming-tonghui.v2-scan-58-dayun'
export const ANU_V2_SCAN_59_OBSERVATION_ID = 'obs.anu.sanming-tonghui.v2-scan-59-direction-conversion'

export const ANU_V2_BITSTREAM = Object.freeze({
  recordUrl: 'https://openresearch-repository.anu.edu.au/items/e0d2d017-f99d-4818-af29-d18754f7e5cd',
  handle: 'http://hdl.handle.net/1885/206524',
  bitstreamUrl: 'https://openresearch-repository.anu.edu.au/bitstreams/9cfcfcec-1cac-4336-97f7-c5abd7c982c1/download',
  fileName: 'b22343921_v.2.pdf',
  byteLength: 116179488,
  pageCount: 105,
  byteSha256: 'e757a79c45a6e8a6701ba991ef4a3f2d3a6ce038ed0ab8727a21b319698d1dc8',
  scanScope: 'ANU public V2 PDF; scan images 58–59; printed folio crosswalk unresolved',
})

const READINESS_KEYS = Object.freeze([
  'historical_witness_observed',
  'edition_collated',
  'local_lineage_resolved',
  'semantic_equivalence_checked',
  'independence_resolved',
  'promotion_ready',
])

const ADJUDICATION_STATUSES = Object.freeze([
  'stable_candidate',
  'lineage_specific',
  'edition_variant',
  'semantic_conflict',
  'independence_unresolved',
  'local_lineage_unresolved',
  'insufficient_evidence',
])

const proven = (evidenceRefs, note) => ({ status: 'proven', evidenceRefs, missingEdges: [], note })
const missing = (evidenceRefs, missingEdges, note) => ({ status: 'missing', evidenceRefs, missingEdges, note })
const readiness = (values, evidence) => ({ ...values, readinessEvidence: evidence })

const sourceEvidence = ({ sourceIds = [], pageObservationIds = [], claimRelationIds = [], blockerIds = [] } = {}) => ({
  sourceIds,
  pageObservationIds,
  claimRelationIds,
  blockerIds,
})

const witness = ({ witnessId, role, sourceId, pageObservationIds, exactByteSha256 = null, exactByteLength = null, scope }) => ({
  witnessId,
  role,
  sourceId,
  pageObservationIds,
  exactByteSha256,
  exactByteLength,
  scope,
})

const predecessorReference = (artifactPath, artifact) => ({
  artifactPath,
  schemaVersion: artifact?.schemaVersion || null,
  version: artifact?.version || null,
  basisHead: artifact?.basisHead || null,
  contentSha256: artifact?.contentSha256 || null,
  artifactPayloadSha256: artifact?.artifactIdentity?.artifactPayloadSha256 || null,
})

const anuSource = {
  sourceId: ANU_V2_SOURCE_ID,
  workId: 'sanming-tonghui',
  sourceType: 'institutional_record_canonical_bitstream_scan',
  institution: 'Australian National University Open Research Repository',
  recordTitle: 'San ming tong hui : 12 juan / Yuwushanren zhu 三命通會 : 十二卷 / 育吾山人著',
  recordAuthors: ['Wan, Minying 萬民英'],
  publisher: 'China : s.n.',
  access: 'open_access_public_bitstream',
  recordUrl: ANU_V2_BITSTREAM.recordUrl,
  handle: ANU_V2_BITSTREAM.handle,
  bitstream: {
    ...ANU_V2_BITSTREAM,
    volumeNumber: 2,
    publicVolumeSet: 'V1–V5 only in the verified public record view',
  },
  identityBoundary: 'The ANU record and V2 bytes are directly identified; printed edition, colophon, physical completeness, and local-PDF lineage are not established.',
  canonicalUse: 'parent_verified_historical_witness_and_locator',
  independenceRole: 'same-work cross-witness candidate; independence not resolved',
}

const anuObservations = [
  {
    observationId: ANU_V2_RECORD_OBSERVATION_ID,
    sourceId: ANU_V2_SOURCE_ID,
    kind: 'institutional_record',
    locator: { kind: 'ANU_item_record', value: 'item e0d2d017-f99d-4818-af29-d18754f7e5cd; handle 1885/206524' },
    observed: 'The ANU item record names 三命通會 as a 12-juan work by 育吾山人 and exposes five public PDF bitstreams; this observation is identity-layer only.',
    directVerification: 'record URL and V2 bitstream target were used to retrieve the canonical public file; dossier conclusions were not imported as fact.',
    scopeBoundary: 'No physical copy, colophon, printed folio, or 12-juan completeness is inferred from the record alone.',
  },
  {
    observationId: ANU_V2_BITSTREAM_OBSERVATION_ID,
    sourceId: ANU_V2_SOURCE_ID,
    kind: 'canonical_bitstream_identity',
    locator: { kind: 'PDF_file', value: 'b22343921_v.2.pdf; 105 pages' },
    observed: 'The directly retrieved V2 byte stream is 116179488 bytes with SHA-256 e757a79c45a6e8a6701ba991ef4a3f2d3a6ce038ed0ab8727a21b319698d1dc8.',
    directVerification: 'curl download, byte count, SHA-256, and pdfinfo page count were executed by the parent.',
    scopeBoundary: 'The byte identity authenticates the public bitstream, not a printed edition or an independent textual tradition.',
  },
  {
    observationId: ANU_V2_SCAN_58_OBSERVATION_ID,
    sourceId: ANU_V2_SOURCE_ID,
    kind: 'direct_visual_scan_observation',
    locator: { kind: 'ANU_V2_scan', value: 'scan 58; rendered directly from V2 PDF' },
    observed: 'The rendered traditional vertical spread visibly carries 論大運 and its surrounding 大運 discussion.',
    directVerification: 'Parent inspected the rendered scan image; OCR/extracted text is not used as canonical evidence.',
    scopeBoundary: 'Printed folio and exact edition/plate identity remain unresolved.',
  },
  {
    observationId: ANU_V2_SCAN_59_OBSERVATION_ID,
    sourceId: ANU_V2_SOURCE_ID,
    kind: 'direct_visual_scan_observation',
    locator: { kind: 'ANU_V2_scan', value: 'scan 59; rendered directly from V2 PDF' },
    observed: 'The continuation visibly contains the 陽男陰女順而行之 / 陰男陽女逆而行之 direction family, prior/next 節 time-counting language, and the 三日一歲 / 一日四月 conversion family with a worked start-age example.',
    directVerification: 'Parent inspected the rendered scan image; wording is retained only at the bounded visible-sequence level.',
    scopeBoundary: 'The scan does not by itself settle a modern exact first-start timestamp, rounding order, calendar clamping, or independent transmission.',
  },
]

const dayunClaimIds = Object.freeze([
  'claim.sanming-dayun-year-stem-gender-direction',
  'claim.sanming-dayun-term-selection',
  'claim.sanming-dayun-term-distance',
  'claim.sanming-dayun-distance-conversion',
  'claim.sanming-dayun-start-age',
  'claim.sanming-dayun-first-start-time',
  'claim.sanming-dayun-progression',
])

const dayunBlockerIds = Object.freeze({
  completeness: 'blocker.continuation.anu-juan-6-12',
  folio: 'blocker.continuation.anu-printed-folio-crosswalk',
  exactStart: 'blocker.continuation.dayun-exact-first-start-time',
  localLineage: 'blocker.continuation.local-timing-lineage',
  yuanhaiCollation: 'blocker.continuation.yuanhai-cross-edition-collation',
  xiangshenCause: 'blocker.continuation.xiangshen-variant-cause',
  qiongtongTransmission: 'blocker.continuation.qiongtong-transmission',
})

const dayunSourceIds = [
  ANU_V2_SOURCE_ID,
  'source.sanming-tonghui.web-witness',
  'source.yuanhai-zi-ping.web-witness',
]

const dayunPageObservationIds = [
  ANU_V2_SCAN_58_OBSERVATION_ID,
  ANU_V2_SCAN_59_OBSERVATION_ID,
  'obs.sanming.dayun-forward-direction',
  'obs.sanming.dayun-backward-direction',
  'obs.sanming.dayun-distance-conversion',
  'obs.sanming.dayun-start-example',
  'obs.yuanhai.dayun-month-progression',
]

const dayunRelations = [
  {
    relationId: 'relation.continuation.sanming-dayun-direction',
    relationType: 'bounded_semantic_collation',
    claimIds: [dayunClaimIds[0]],
    sourceIds: dayunSourceIds,
    observationIds: dayunPageObservationIds,
    conclusion: 'ANU scan 59 and the predecessor 三命通會 timing observation expose the same direction family; this is a bounded textual comparison, not proof of independent transmission or a universal rule.',
    independenceStatus: 'unresolved',
  },
  {
    relationId: 'relation.continuation.sanming-dayun-term-selection',
    relationType: 'bounded_semantic_collation',
    claimIds: [dayunClaimIds[1]],
    sourceIds: dayunSourceIds,
    observationIds: dayunPageObservationIds,
    conclusion: 'The ANU continuation exposes future/past 節 selection language matching the predecessor timing observation family; exact 節 class and lineage remain open.',
    independenceStatus: 'unresolved',
  },
  {
    relationId: 'relation.continuation.sanming-dayun-term-distance',
    relationType: 'bounded_semantic_collation',
    claimIds: [dayunClaimIds[2]],
    sourceIds: dayunSourceIds,
    observationIds: dayunPageObservationIds,
    conclusion: 'The ANU scan visibly counts time to a preceding or next 節; granularity, rounding, and calendar conversion are not closed.',
    independenceStatus: 'unresolved',
  },
  {
    relationId: 'relation.continuation.sanming-dayun-conversion',
    relationType: 'bounded_semantic_collation',
    claimIds: [dayunClaimIds[3]],
    sourceIds: dayunSourceIds,
    observationIds: dayunPageObservationIds,
    conclusion: 'The ANU scan visibly carries the 三日一歲 / 一日四月 conversion family and a worked example; this does not establish the implementation rounding order.',
    independenceStatus: 'unresolved',
  },
  {
    relationId: 'relation.continuation.sanming-dayun-start-age',
    relationType: 'bounded_semantic_collation',
    claimIds: [dayunClaimIds[4]],
    sourceIds: dayunSourceIds,
    observationIds: dayunPageObservationIds,
    conclusion: 'A 起運 age example is directly observed in the ANU spread and can be separated from the conversion rule; exact local start-age equivalence remains unresolved.',
    independenceStatus: 'unresolved',
  },
  {
    relationId: 'relation.continuation.sanming-dayun-first-start-time-gap',
    relationType: 'scope_gap',
    claimIds: [dayunClaimIds[5]],
    sourceIds: [ANU_V2_SOURCE_ID],
    observationIds: [ANU_V2_SCAN_59_OBSERVATION_ID],
    conclusion: 'The ANU example identifies a textual start-age example but does not provide enough birth-calendar and conversion-policy data to establish an exact first start timestamp.',
    independenceStatus: 'not_applicable',
  },
  {
    relationId: 'relation.continuation.sanming-dayun-progression',
    relationType: 'bounded_semantic_collation',
    claimIds: [dayunClaimIds[6]],
    sourceIds: dayunSourceIds,
    observationIds: dayunPageObservationIds,
    conclusion: 'The surrounding 大運 discussion is sufficient for a bounded progression-family observation; it does not establish a complete later-cycle algorithm or independent lineage.',
    independenceStatus: 'unresolved',
  },
]

const continuationRelations = [
  ...dayunRelations,
  {
    relationId: 'relation.continuation.anu-to-sanming-web-witness',
    relationType: 'same_work_cross_representation_candidate',
    claimIds: dayunClaimIds,
    sourceIds: ['source.sanming-tonghui.web-witness', ANU_V2_SOURCE_ID],
    observationIds: [...dayunPageObservationIds],
    conclusion: 'The ANU canonical bitstream and the predecessor web witness can be compared at a bounded wording-family level, but the web witness is not treated as an independent physical/textual witness.',
    independenceStatus: 'not_resolved_not_counted_as_independent',
  },
  {
    relationId: 'relation.continuation.anu-to-local-sanming-lineage',
    relationType: 'local_to_institutional_lineage_check',
    claimIds: dayunClaimIds,
    sourceIds: ['source.local.sanming-tonghui-pdf', ANU_V2_SOURCE_ID],
    observationIds: [ANU_V2_BITSTREAM_OBSERVATION_ID, ANU_V2_SCAN_58_OBSERVATION_ID, ANU_V2_SCAN_59_OBSERVATION_ID],
    conclusion: 'The local 三命通會 PDF and the ANU V2 bitstream are both available representations, but no byte-level, plate-level, or item-level relation has been established between them.',
    independenceStatus: 'unresolved',
  },
  {
    relationId: 'relation.continuation.nlc-ntl-ziping-1926-same-lineage',
    relationType: 'same_lineage_candidate',
    claimIds: ['claim.ziping-yongshin', 'claim.ziping-xingyun', 'claim.ziping-xiangshen'],
    sourceIds: ['source.nlc.ziping-zhenquan.1926.v2', 'source.ntl.ziping-zhenquan.1926.v2'],
    observationIds: [
      'page.nlc.ziping.v2.leaf-23-yongshin',
      'page.nlc.ziping.v2.leaf-32-xiangshen',
      'page.nlc.ziping.v2.leaf-43-xingyun',
      'page.ntl.ziping.v2.leaf-111-yongshin',
      'page.ntl.ziping.v2.leaf-120-xiangshen',
      'page.ntl.ziping.v2.leaf-131-xingyun',
    ],
    conclusion: 'NLC 1926 and NTL 1926 v2 remain a same-lineage candidate on wording, order, and printed-folio correspondences; they are not counted as two independent witnesses.',
    independenceStatus: 'resolved_as_not_independent_for_current_claims',
  },
  {
    relationId: 'relation.continuation.qiongtong-three-witness-stability',
    relationType: 'bounded_three_witness_collation',
    claimIds: ['claim.qiongtong-spring-jia-wood'],
    sourceIds: ['source.waseda.qiongtong-baojian.undated.scan-f0111', 'source.nlc.qiongtong-baojian.1926.v2', 'source.nlc.qiongtong-baojian.1937.scan-48608'],
    observationIds: [
      'page.waseda.qiongtong.undated.scan-f0111.leaf-8',
      'page.waseda.qiongtong.undated.scan-f0111.leaf-9-zhengyue-jia-mu',
      'page.waseda.qiongtong.undated.scan-f0111.leaf-10-eryue-jia-mu',
      'page.waseda.qiongtong.undated.scan-f0111.leaf-11-sanyue-jia-mu',
      'page.nlc.qiongtong.v2.leaf-5-spring-jia-wood',
      'page.nlc.qiongtong.1937.scan-48608.leaf-14-spring-jia-wood',
    ],
    conclusion: 'The spring Jia wood passage and the adjacent Waseda monthly-heading run are directly observed for a bounded four-witness comparison, while Waseda/NLC 1926/NLC 1937 transmission and local lineage remain unresolved; author attribution is a separate unresolved question.',
    independenceStatus: 'unresolved',
  },
  {
    relationId: 'relation.continuation.xiangshen-conflict-cause',
    relationType: 'semantic_conflict_adjudication',
    claimIds: ['claim.ziping-xiangshen'],
    sourceIds: ['source.local.ziping-zhenquan-pdf', 'source.nlc.ziping-zhenquan.1926.v2', 'source.ntl.ziping-zhenquan.1926.v2', 'source.nlc.ziping-zhenquan.unknown-republican.scan-35296'],
    observationIds: [
      'page.local.ziping.p10-xiangshen',
      'page.local.ziping.p11-xiangshen-continuation',
      'page.nlc.ziping.v2.leaf-32-xiangshen',
      'page.nlc.ziping.v2.leaf-33-xiangshen-continuation',
      'page.ntl.ziping.v2.leaf-120-xiangshen',
      'page.ntl.ziping.v2.leaf-121-xiangshen-continuation',
      'page.commons.nlc.ziping.35296.page-39-xiangshen',
      'page.commons.nlc.ziping.35296.page-40-xiangshen-continuation',
      'page.commons.nlc.ziping.35296.page-45-next-heading',
    ],
    conclusion: 'Locator mismatch is ruled out by matching section/folio sequence; NLC and NTL 1926 historical pair agree within the checked bounded passage, while the local witness omits 我用神 relative to that pair, records a 財旺生官/order difference, and changes surrounding order. NLC 35296 p.39 separately confirms 輔我用神者是也 and 財旺生官, but its full role clause is not safely transcribed. The remaining cause is unresolved between true edition variant, modern transcription/rewriting, and editorial/commentary layer.',
    independenceStatus: 'historical-pair-not_independent; local-cause-unresolved',
  },
]

const continuationLineageRelations = [
  {
    lineageId: 'lineage.continuation.anu-v2-to-yuanhai-web-witness',
    relationId: 'relation.continuation.anu-to-sanming-web-witness',
    sourceIds: ['source.sanming-tonghui.web-witness', ANU_V2_SOURCE_ID],
    status: 'same_work_cross_representation_candidate',
    confidence: 'bounded',
    independence: 'not_resolved_not_counted_as_independent',
    conclusion: 'Same-work identity is plausible at the locator level; textual transmission and physical witness independence are not established.',
  },
  {
    lineageId: 'lineage.continuation.anu-v2-to-local-sanming',
    relationId: 'relation.continuation.anu-to-local-sanming-lineage',
    sourceIds: ['source.local.sanming-tonghui-pdf', ANU_V2_SOURCE_ID],
    status: 'unresolved',
    confidence: 'low',
    independence: 'unresolved',
    conclusion: 'The local PDF cannot be promoted to an ANU-derived or edition-identical witness from the available evidence.',
  },
  {
    lineageId: 'lineage.continuation.nlc-ntl-ziping-1926',
    relationId: 'relation.continuation.nlc-ntl-ziping-1926-same-lineage',
    sourceIds: ['source.nlc.ziping-zhenquan.1926.v2', 'source.ntl.ziping-zhenquan.1926.v2'],
    status: 'same_lineage_candidate',
    confidence: 'high_bounded',
    independence: 'resolved_as_not_independent_for_current_claims',
    conclusion: 'NLC and NTL 1926 v2 are retained as one current textual lineage candidate, not two corroborating witnesses.',
  },
  {
    lineageId: 'lineage.continuation.waseda-nlc1937-qiongtong',
    relationId: 'relation.continuation.qiongtong-three-witness-stability',
    sourceIds: ['source.waseda.qiongtong-baojian.undated.scan-f0111', 'source.nlc.qiongtong-baojian.1926.v2', 'source.nlc.qiongtong-baojian.1937.scan-48608'],
    status: 'independence_unresolved',
    confidence: 'bounded_text_only',
    independence: 'unresolved',
    conclusion: 'Distinct catalog/scan identities and bounded wording stability do not by themselves prove independent transmission.',
  },
]

const blockers = [
  {
    blockerId: dayunBlockerIds.completeness,
    status: 'open',
    blocking: true,
    description: 'ANU record describes a 12-juan work, while the directly verified public set exposes only V1–V5; 卷6–12 and physical completeness remain unverified.',
    nextCheckableQuestion: 'Can ANU staff or the record expose canonical bitstreams/scans for 卷6–12 and a completeness/colophon record?',
  },
  {
    blockerId: dayunBlockerIds.folio,
    status: 'open',
    blocking: true,
    description: 'ANU V2 scan numbering is directly verified, but printed folio, plate, edition, and the dossier note 雍正乙卯花朝 are not resolved from the bitstream alone.',
    nextCheckableQuestion: 'Can the institution supply printed-folio/plate metadata or a title-page/colophon crosswalk for V2?',
  },
  {
    blockerId: dayunBlockerIds.exactStart,
    status: 'open',
    blocking: true,
    description: 'The split 大運 claims now separate direction, 節 selection, distance, conversion, age example, first start time, and later progression, but exact start-time arithmetic, rounding, and calendar clamping remain unproved.',
    nextCheckableQuestion: 'Find a directly readable historical witness or worked example that supplies birth instant, 節 instant, unit conversion, rounding, and resulting first timestamp together.',
  },
  {
    blockerId: dayunBlockerIds.localLineage,
    status: 'open',
    blocking: true,
    description: 'The ANU V2 witness does not close the local 三命通會 or local classical-PDF lineage to a physical item or printed edition.',
    nextCheckableQuestion: 'Obtain a byte/scan/page/plate bridge between the local export and an institutionally identified item.',
  },
  {
    blockerId: dayunBlockerIds.yuanhaiCollation,
    status: 'open',
    blocking: true,
    description: '淵海子平 responsibility, seasonal, and start-age observations remain bounded page collations; exact local-to-item lineage and independent edition transmission are not closed.',
    nextCheckableQuestion: 'Directly collate the local pages against an institutionally identified scan with printed folios and a transmission/edition record.',
  },
  {
    blockerId: dayunBlockerIds.xiangshenCause,
    status: 'open',
    blocking: true,
    description: '相神 locator mismatch is ruled out and the historical 1926 pair agrees, but local omission/addition/order differences cannot yet be assigned uniquely to edition variation, modern rewriting, or commentary/editorial layering.',
    nextCheckableQuestion: 'Inspect a further dated physical witness or editorial apparatus that distinguishes the local text layer from the historical base text.',
  },
  {
    blockerId: dayunBlockerIds.qiongtongTransmission,
    status: 'open',
    blocking: true,
    description: '窮通寶鑑 spring Jia wood is boundedly stable across Waseda/NLC 1926/NLC 1937 observations, but local lineage, transmission independence, and authorship remain separate unresolved edges.',
    nextCheckableQuestion: 'Obtain dated title/colophon and page-level lineage evidence for Waseda, NLC 1926, and NLC 1937, plus a local-to-witness bridge.',
  },
]

const dayunClaim = ({ claimId, family, proposition, scope, relationId, readinessValues, readinessEvidence, missingBlockers, semanticResult, missingEdges }) => ({
  claimId,
  workIds: ['sanming-tonghui'],
  claimFamily: family,
  proposition,
  scope,
  adjudicationStatus: readinessValues.historical_witness_observed && readinessValues.edition_collated && readinessValues.semantic_equivalence_checked
    ? 'independence_unresolved'
    : 'insufficient_evidence',
  semanticAuthorityStatus: 'not_established',
  sourceFrontierEvidence: sourceEvidence({
    sourceIds: dayunSourceIds,
    pageObservationIds: dayunPageObservationIds,
    claimRelationIds: [relationId],
    blockerIds: missingBlockers,
  }),
  externalRecordIds: [],
  witnesses: [witness({
    witnessId: `witness.anu-v2-${claimId.replaceAll('claim.', '')}`,
    role: 'historical_scan',
    sourceId: ANU_V2_SOURCE_ID,
    pageObservationIds: [ANU_V2_SCAN_58_OBSERVATION_ID, ANU_V2_SCAN_59_OBSERVATION_ID],
    exactByteSha256: ANU_V2_BITSTREAM.byteSha256,
    exactByteLength: ANU_V2_BITSTREAM.byteLength,
    scope: 'ANU V2 scan 58–59; printed folio unresolved',
  })],
  collation: {
    scope: 'bounded_ANU_V2_to_predecessor_timing_observation',
    observedComparison: semanticResult,
    rawSequence: ['陽男陰女順而行之', '陰男陽女逆而行之', '三日一歲', '一日四月'],
    wordingVariants: ['ANU scan is visually read; predecessor web observation is OCR/raw locator only'],
    omissionsAdditions: ['The direct scan does not supply the full local implementation policy for exact timestamp arithmetic.'],
    orderingDifferences: [],
    editorialLayer: 'classical timing passage; semantic authority not established',
    semanticEquivalenceResult: readinessValues.semantic_equivalence_checked ? 'bounded_comparison_only' : 'not_checked',
  },
  readiness: readiness(readinessValues, readinessEvidence),
})

const buildDayunClaims = () => [
  dayunClaim({
    claimId: dayunClaimIds[0],
    family: 'year-stem-yin-yang-gender-direction',
    proposition: 'The ANU V2 大運 passage observes the direction family 陽男陰女順而行之 / 陰男陽女逆而行之.',
    scope: 'bounded direction wording in ANU V2 scan 59; not a universal production rule',
    relationId: dayunRelations[0].relationId,
    readinessValues: { historical_witness_observed: true, edition_collated: true, local_lineage_resolved: false, semantic_equivalence_checked: true, independence_resolved: false, promotion_ready: false },
    readinessEvidence: {
      historical_witness_observed: proven([ANU_V2_SCAN_59_OBSERVATION_ID], 'Direct visual review of the canonical ANU V2 scan 59.'),
      edition_collated: proven([ANU_V2_SCAN_59_OBSERVATION_ID, 'obs.sanming.dayun-forward-direction', 'obs.sanming.dayun-backward-direction'], 'Bounded ANU-to-predecessor timing wording comparison; edition identity and independence remain open.'),
      local_lineage_resolved: missing([dayunBlockerIds.localLineage], ['ANU V2 -> local PDF/item lineage'], 'No local-to-institutional bridge is established.'),
      semantic_equivalence_checked: proven([dayunRelations[0].relationId], 'Bounded direction-family comparison only; no authority is inferred.'),
      independence_resolved: missing(['relation.continuation.anu-to-sanming-web-witness'], ['independent historical transmission'], 'The predecessor web witness is not counted as an independent physical witness.'),
      promotion_ready: missing([dayunBlockerIds.localLineage, dayunBlockerIds.exactStart], ['all preceding readiness gates and scoped authority'], 'Promotion remains fail-closed.'),
    },
    missingBlockers: [dayunBlockerIds.localLineage, dayunBlockerIds.exactStart],
    semanticResult: 'ANU V2 scan 59 and the predecessor 三命通會 observation show the same direction family at the bounded wording level.',
  }),
  dayunClaim({
    claimId: dayunClaimIds[1],
    family: 'preceding-next-jie-selection',
    proposition: 'The ANU V2 大運 passage selects a future or preceding 節 according to the direction path described in the surrounding text.',
    scope: 'bounded preceding/next 節 selection language; exact 節 class remains unresolved',
    relationId: dayunRelations[1].relationId,
    readinessValues: { historical_witness_observed: true, edition_collated: true, local_lineage_resolved: false, semantic_equivalence_checked: true, independence_resolved: false, promotion_ready: false },
    readinessEvidence: {
      historical_witness_observed: proven([ANU_V2_SCAN_59_OBSERVATION_ID], 'Direct visual review of the canonical ANU V2 scan 59.'),
      edition_collated: proven([ANU_V2_SCAN_59_OBSERVATION_ID, 'obs.sanming.dayun-forward-direction', 'obs.sanming.dayun-backward-direction'], 'Bounded future/past 節 selection comparison.'),
      local_lineage_resolved: missing([dayunBlockerIds.localLineage], ['ANU V2 -> local PDF/item lineage'], 'No local-to-institutional bridge is established.'),
      semantic_equivalence_checked: proven([dayunRelations[1].relationId], 'The comparison is limited to selection wording, not an implementation interpretation.'),
      independence_resolved: missing(['relation.continuation.anu-to-sanming-web-witness'], ['independent historical transmission'], 'Same-work/cross-representation relation remains unresolved.'),
      promotion_ready: missing([dayunBlockerIds.localLineage, dayunBlockerIds.exactStart], ['all preceding readiness gates'], 'Promotion remains fail-closed.'),
    },
    missingBlockers: [dayunBlockerIds.localLineage, dayunBlockerIds.exactStart],
    semanticResult: 'The ANU continuation visibly carries prior/next 節 time-counting language that matches the predecessor timing locator family.',
  }),
  dayunClaim({
    claimId: dayunClaimIds[2],
    family: 'jie-time-distance',
    proposition: 'The ANU V2 passage counts the time distance from birth to the selected preceding or next 節 as an input to 大運 calculation.',
    scope: 'bounded time-distance operation; hour granularity and rounding order unresolved',
    relationId: dayunRelations[2].relationId,
    readinessValues: { historical_witness_observed: true, edition_collated: true, local_lineage_resolved: false, semantic_equivalence_checked: true, independence_resolved: false, promotion_ready: false },
    readinessEvidence: {
      historical_witness_observed: proven([ANU_V2_SCAN_59_OBSERVATION_ID], 'Direct visual review of the canonical ANU V2 scan 59.'),
      edition_collated: proven([ANU_V2_SCAN_59_OBSERVATION_ID, 'obs.sanming.dayun-distance-conversion'], 'Bounded distance-operation comparison.'),
      local_lineage_resolved: missing([dayunBlockerIds.localLineage], ['ANU V2 -> local PDF/item lineage'], 'No local-to-institutional bridge is established.'),
      semantic_equivalence_checked: proven([dayunRelations[2].relationId], 'Only the existence and direction of time counting are compared.'),
      independence_resolved: missing(['relation.continuation.anu-to-sanming-web-witness'], ['independent historical transmission'], 'Independent transmission is not established.'),
      promotion_ready: missing([dayunBlockerIds.localLineage, dayunBlockerIds.exactStart], ['exact procedure and all preceding readiness gates'], 'Promotion remains fail-closed.'),
    },
    missingBlockers: [dayunBlockerIds.localLineage, dayunBlockerIds.exactStart],
    semanticResult: 'The ANU scan visibly contains preceding/next 節 date/time counting; it does not close granularity or rounding.',
  }),
  dayunClaim({
    claimId: dayunClaimIds[3],
    family: 'three-days-one-year-conversion',
    proposition: 'The ANU V2 passage observes the 三日一歲 / 一日四月 conversion family for converting 節-distance into 起運 age.',
    scope: 'bounded conversion wording and example; implementation rounding policy unresolved',
    relationId: dayunRelations[3].relationId,
    readinessValues: { historical_witness_observed: true, edition_collated: true, local_lineage_resolved: false, semantic_equivalence_checked: true, independence_resolved: false, promotion_ready: false },
    readinessEvidence: {
      historical_witness_observed: proven([ANU_V2_SCAN_59_OBSERVATION_ID], 'Direct visual review of the canonical ANU V2 scan 59.'),
      edition_collated: proven([ANU_V2_SCAN_59_OBSERVATION_ID, 'obs.sanming.dayun-distance-conversion', 'obs.sanming.dayun-start-example'], 'Bounded conversion-family comparison.'),
      local_lineage_resolved: missing([dayunBlockerIds.localLineage], ['ANU V2 -> local PDF/item lineage'], 'No local-to-institutional bridge is established.'),
      semantic_equivalence_checked: proven([dayunRelations[3].relationId], 'The result is a bounded textual equivalence check, not an arithmetic authorization.'),
      independence_resolved: missing(['relation.continuation.anu-to-sanming-web-witness'], ['independent historical transmission'], 'Same-work/cross-representation relation remains unresolved.'),
      promotion_ready: missing([dayunBlockerIds.localLineage, dayunBlockerIds.exactStart], ['rounding and all preceding readiness gates'], 'Promotion remains fail-closed.'),
    },
    missingBlockers: [dayunBlockerIds.localLineage, dayunBlockerIds.exactStart],
    semanticResult: 'The direct scan shows the conversion family and a worked example; no production arithmetic is changed.',
  }),
  dayunClaim({
    claimId: dayunClaimIds[4],
    family: 'qiyun-age',
    proposition: 'The ANU V2 passage contains a 起運 age example derived from the preceding/next 節 distance and conversion family.',
    scope: 'textual 起運 age example only; not an exact local calculation or generalized age rule',
    relationId: dayunRelations[4].relationId,
    readinessValues: { historical_witness_observed: true, edition_collated: true, local_lineage_resolved: false, semantic_equivalence_checked: true, independence_resolved: false, promotion_ready: false },
    readinessEvidence: {
      historical_witness_observed: proven([ANU_V2_SCAN_59_OBSERVATION_ID], 'Direct visual review of the canonical ANU V2 scan 59.'),
      edition_collated: proven([ANU_V2_SCAN_59_OBSERVATION_ID, 'obs.sanming.dayun-start-example'], 'Bounded age-example comparison.'),
      local_lineage_resolved: missing([dayunBlockerIds.localLineage], ['ANU V2 -> local PDF/item lineage'], 'No local-to-institutional bridge is established.'),
      semantic_equivalence_checked: proven([dayunRelations[4].relationId], 'The example is compared as an observed text operation, not as an implementation result.'),
      independence_resolved: missing(['relation.continuation.anu-to-sanming-web-witness'], ['independent historical transmission'], 'Independent transmission remains unresolved.'),
      promotion_ready: missing([dayunBlockerIds.localLineage, dayunBlockerIds.exactStart], ['exact local equivalence and all preceding readiness gates'], 'Promotion remains fail-closed.'),
    },
    missingBlockers: [dayunBlockerIds.localLineage, dayunBlockerIds.exactStart],
    semanticResult: 'The textual age example is directly seen and separated from the broader conversion claim; its exact modern mapping remains open.',
  }),
  dayunClaim({
    claimId: dayunClaimIds[5],
    family: 'first-dayun-start-time',
    proposition: 'The ANU V2 passage provides a textual worked start-age example but does not by itself establish the exact first 大運 start timestamp for a modern birth instant.',
    scope: 'negative evidence boundary for exact first-start timestamp; no semantic promotion',
    relationId: dayunRelations[5].relationId,
    readinessValues: { historical_witness_observed: true, edition_collated: false, local_lineage_resolved: false, semantic_equivalence_checked: false, independence_resolved: false, promotion_ready: false },
    readinessEvidence: {
      historical_witness_observed: proven([ANU_V2_SCAN_59_OBSERVATION_ID], 'The worked example is directly visible in ANU V2 scan 59.'),
      edition_collated: missing([dayunBlockerIds.exactStart], ['a second directly readable witness with the same complete birth-to-first-start mapping'], 'One canonical scan establishes an observed example, not cross-edition equivalence.'),
      local_lineage_resolved: missing([dayunBlockerIds.localLineage], ['ANU V2 -> local PDF/item lineage'], 'No local-to-institutional bridge is established.'),
      semantic_equivalence_checked: missing([dayunRelations[5].relationId], ['exact modern timestamp semantics'], 'The evidence intentionally stops at the insufficiency boundary.'),
      independence_resolved: missing(['relation.continuation.anu-to-sanming-web-witness'], ['independent historical transmission'], 'No independent witness is admitted.'),
      promotion_ready: missing([dayunBlockerIds.exactStart, dayunBlockerIds.localLineage], ['complete exact-start evidence and all preceding readiness gates'], 'Promotion remains fail-closed.'),
    },
    missingBlockers: [dayunBlockerIds.exactStart, dayunBlockerIds.localLineage],
    semanticResult: 'The direct witness narrows the question to exact start-time arithmetic but does not answer it.',
  }),
  dayunClaim({
    claimId: dayunClaimIds[6],
    family: 'later-dayun-progression',
    proposition: 'The surrounding ANU V2 大運 discussion observes progression through later fortune periods as a textual topic, without closing a complete production progression algorithm.',
    scope: 'bounded surrounding-text progression observation; not a general cycle algorithm',
    relationId: dayunRelations[6].relationId,
    readinessValues: { historical_witness_observed: true, edition_collated: true, local_lineage_resolved: false, semantic_equivalence_checked: true, independence_resolved: false, promotion_ready: false },
    readinessEvidence: {
      historical_witness_observed: proven([ANU_V2_SCAN_58_OBSERVATION_ID, ANU_V2_SCAN_59_OBSERVATION_ID], 'Direct visual review of the surrounding ANU V2 大運 spread.'),
      edition_collated: proven([ANU_V2_SCAN_58_OBSERVATION_ID, ANU_V2_SCAN_59_OBSERVATION_ID, 'obs.yuanhai.dayun-month-progression'], 'Bounded surrounding-text comparison only.'),
      local_lineage_resolved: missing([dayunBlockerIds.localLineage], ['ANU V2 -> local PDF/item lineage'], 'No local-to-institutional bridge is established.'),
      semantic_equivalence_checked: proven([dayunRelations[6].relationId], 'The scope is limited to progression as a textual topic, not a production algorithm.'),
      independence_resolved: missing(['relation.continuation.anu-to-sanming-web-witness'], ['independent historical transmission'], 'Independent transmission remains unresolved.'),
      promotion_ready: missing([dayunBlockerIds.localLineage, dayunBlockerIds.exactStart], ['complete progression semantics and all preceding readiness gates'], 'Promotion remains fail-closed.'),
    },
    missingBlockers: [dayunBlockerIds.localLineage, dayunBlockerIds.exactStart],
    semanticResult: 'The surrounding section supports a bounded progression-family observation, not a complete later-cycle implementation rule.',
  }),
]

const buildContinuationGateDecisions = basisHead => {
  const base = {
    branch: 'main',
    basisHead,
    scopedWorktreeState: 'dirty',
    scopedWorktreeDigest: basisHead.padEnd(64, '0'),
    observedHeadRelevant: true,
    observedHead: basisHead,
  }
  const environment = {
    runtime: 'node',
    platform: 'darwin',
    dependencyIdentity: 'repository-installed-runtime',
    sourceIdentity: 'parent-verified-local-ledger-plus-ANU-V2-bitstream',
    networkCondition: 'available',
  }
  const unit1 = evaluateBoundedContinuation({
    attempt: {
      action: { actionId: 'research-unit-1.anu-v2-direct-recheck', kind: 'direct_visual_source_verification', command: 'download-hash-render-inspect-ANU-V2-scans-58-59', args: [] },
      inputs: [
        { refId: 'anu.record', identity: ANU_V2_BITSTREAM.recordUrl, resolution: 'verified' },
        { refId: 'anu.v2', identity: ANU_V2_BITSTREAM.byteSha256, resolution: 'verified' },
        { refId: 'anu.v2.scan-58-59', identity: 'rendered-directly-from-v2', resolution: 'verified' },
      ],
      basis: base,
      environment,
      failure: { class: 'none', stage: 'none', code: 'none' },
    },
    workUnit: {
      progress: {
        newEvidence: [
          { id: ANU_V2_BITSTREAM_OBSERVATION_ID, verified: true },
          { id: ANU_V2_SCAN_58_OBSERVATION_ID, verified: true },
          { id: ANU_V2_SCAN_59_OBSERVATION_ID, verified: true },
        ],
        newArtifacts: [],
        validatedFacts: [],
        blockerReductions: [],
        nextFrontier: { id: 'research-unit-2-5-local-lineage-semantic-cause', actionId: 'research-unit-2-5-bounded-recheck', checkable: true, authorized: true },
      },
      unknowns: [],
      blockers: [{ id: dayunBlockerIds.localLineage, status: 'open', blocksParent: true }],
      scope: { acceptanceComplete: false, objectiveUnmet: true },
    },
  })
  const final = evaluateBoundedContinuation({
    attempt: {
      action: { actionId: 'research-unit-5.bounded-frontier-audit', kind: 'bounded_evidence_audit', command: 'close-unresolved-lineage-and-semantic-frontiers', args: [] },
      inputs: [
        { refId: 'predecessor.claims', identity: 'saju-five-classics-claim-adjudication-v0', resolution: 'verified' },
        { refId: 'predecessor.source', identity: 'saju-five-classics-source-identity-frontier-v0', resolution: 'verified' },
        { refId: 'predecessor.timing', identity: 'saju-timing-authority-frontier-v0', resolution: 'verified' },
      ],
      basis: base,
      environment,
      failure: { class: 'none', stage: 'none', code: 'none' },
    },
    workUnit: {
      progress: {
        newEvidence: [],
        newArtifacts: [],
        validatedFacts: [
          { id: 'unit-2.nlc-ntl-same-lineage-candidate', verified: true },
          { id: 'unit-3.xiangshen-cause-unresolved', verified: true },
          { id: 'unit-4.yuanhai-no-promotion', verified: true },
          { id: 'unit-4.nlc-46442-conversion-clause-only', verified: true },
          { id: 'unit-5.qiongtong-no-promotion', verified: true },
        ],
        blockerReductions: [],
        nextFrontier: null,
      },
      unknowns: [{ id: dayunBlockerIds.exactStart, blocksParent: true }],
      blockers: [{ id: dayunBlockerIds.exactStart, status: 'open', blocksParent: true }],
      scope: { acceptanceComplete: false, objectiveUnmet: true },
    },
  })
  return [
    { unitId: 'research-unit-1', decision: unit1.decision, result: unit1, interpretation: 'continue: direct ANU evidence opened a checkable Unit 2–5 frontier' },
    { unitId: 'research-unit-2-5', decision: final.decision, result: final, interpretation: 'stop_blocked: remaining edges require external institutional/physical evidence; no safe local frontier remains' },
  ]
}

const semanticConflictFindings = [{
  findingId: 'finding.xiangshen-cause-v1',
  claimId: 'claim.ziping-xiangshen',
  classification: 'semantic_conflict',
  locatorMismatch: { status: 'ruled_out', basis: ['page.local.ziping.p10-xiangshen', 'page.nlc.ziping.v2.leaf-32-xiangshen', 'page.ntl.ziping.v2.leaf-120-xiangshen', 'page.commons.nlc.ziping.35296.page-39-xiangshen', 'page.commons.nlc.ziping.35296.page-40-xiangshen-continuation', 'page.commons.nlc.ziping.35296.page-45-next-heading'] },
  historicalPair: { status: 'same_lineage_agreement_candidate', sources: ['source.nlc.ziping-zhenquan.1926.v2', 'source.ntl.ziping-zhenquan.1926.v2'], independence: 'not_counted_as_independent' },
  additionalHistoricalObservation: { sourceId: 'source.nlc.ziping-zhenquan.unknown-republican.scan-35296', pageObservationIds: ['page.commons.nlc.ziping.35296.page-39-xiangshen', 'page.commons.nlc.ziping.35296.page-40-xiangshen-continuation', 'page.commons.nlc.ziping.35296.page-45-next-heading'], status: 'phrase_and_boundary_only_unresolved_date_lineage', observedPhrases: ['輔我用神者是也', '財旺生官'], roleClauseAfterCaiWangShengGuan: { status: 'not_transcribed', text: null } },
  observedDifferences: {
    localOmission: 'local witness does not visibly retain 我用神 in 若君之有相輔我用神者是也',
    localVsNlcNtl1926Difference: 'Against the NLC/NTL 1926 bounded pair, the local witness visibly adds 財旺生官，則財為用，官為相 and changes the surrounding order; this is not generalized to all historical scans.',
    nlc35296PhrasePresence: 'NLC 35296 PDF page 39 / printed page 三十 directly shows 輔我用神者是也 and 財旺生官.',
    nlc35296RoleClause: { status: 'not_transcribed', text: null, reason: 'The complete role clause after 財旺生官 was not safely isolated; no role wording is admitted.' },
    surroundingOrder: 'historical pair continues 氣不甚靈 / 神之緊要也 / 論雜氣如何取用 while the local sequence is ordered differently',
  },
  remainingCauseCandidates: ['edition_variant', 'modern_transcription_or_rewriting', 'editorial_or_commentary_layer'],
  adjudication: 'cause_unresolved; preserve semantic_conflict and do not normalize the local wording into the historical pair',
  evidenceRefs: [
    'relation.continuation.xiangshen-conflict-cause',
    dayunBlockerIds.xiangshenCause,
  ],
}]

const unitFindings = [
  {
    unitId: 'research-unit-1-dayun-cross-witness',
    status: 'closed_bounded_frontier',
    verificationMode: 'parent_direct_record_bitstream_hash_and_rendered_scan_review',
    result: 'ANU V2 scan 58–59 is a directly verified canonical bitstream/page witness. 大運 is decomposed into seven claims; no aggregate timing claim is used for promotion.',
    claimIds: dayunClaimIds,
    evidenceIds: [ANU_V2_RECORD_OBSERVATION_ID, ANU_V2_BITSTREAM_OBSERVATION_ID, ANU_V2_SCAN_58_OBSERVATION_ID, ANU_V2_SCAN_59_OBSERVATION_ID],
    remainingEdges: [dayunBlockerIds.completeness, dayunBlockerIds.folio, dayunBlockerIds.exactStart, dayunBlockerIds.localLineage],
  },
  {
    unitId: 'research-unit-2-ziping-lineage',
    status: 'closed_bounded_blocker_narrowed',
    verificationMode: 'parent_recheck_of_predecessor_exact_page_folio_observations_and_checker',
    result: 'Local 27p, NLC 35296, NLC 1926, and NTL 1926 v2 remain a bounded wording/order/folio comparison. NLC and NTL 1926 are a same-lineage candidate and are not two independent witnesses; local derivation/lineage remains unresolved.',
    evidenceIds: ['relation.continuation.nlc-ntl-ziping-1926-same-lineage', 'page.local.ziping.p6-yongshin', 'page.local.ziping.p15-xingyun', 'page.nlc.ziping.v2.leaf-23-yongshin', 'page.ntl.ziping.v2.leaf-111-yongshin'],
    remainingEdges: ['blocker.yuanhai-ziping-lineage', 'blocker.local-to-physical-item', 'blocker.cross-edition-collation'],
  },
  {
    unitId: 'research-unit-3-xiangshen-conflict',
    status: 'closed_bounded_conflict_preserved',
    verificationMode: 'parent_recheck_of_exact_local_and_historical_pair_locators',
    result: 'Locator mismatch is ruled out; historical NLC/NTL pair agrees; local omission/addition/order differences remain a semantic conflict with cause unresolved.',
    evidenceIds: ['finding.xiangshen-cause-v1', 'relation.continuation.xiangshen-conflict-cause'],
    remainingEdges: [dayunBlockerIds.xiangshenCause],
  },
  {
    unitId: 'research-unit-4-yuanhai-promotion-near',
    status: 'closed_bounded_no_promotion',
    verificationMode: 'parent_recheck_of_predecessor_responsibility_seasonal_and_timing_observations_plus_anu_timing_scope',
    result: '徐升編 / 楊淙增校 remains an identity-layer responsibility display; the seasonal/立春 clause is bounded text correspondence; NLC 46442 PDF pages 79–80 add only a clause-level 珞琚子消息賦 observation for 播四時以為年 / 一辰十載 / 三日為年; the prior bundled timing claim is replaced by seven narrower claims. No local lineage, independent edition relation, exact 起運 procedure, or semantic authority is promoted.',
    evidenceIds: ['claim.yuanhai-editorial-responsibility', 'claim.yuanhai-seasonal-lichun-clause', 'relation.continuation.anu-to-sanming-web-witness', 'page.nlc.yuanhai.v1.leaf-79-qilu-conversion', 'page.nlc.yuanhai.v1.leaf-80-qilu-continuation', 'obs.nlc.yuanhai.qilu-conversion-1926'],
    remainingEdges: [dayunBlockerIds.yuanhaiCollation, dayunBlockerIds.localLineage],
  },
  {
    unitId: 'research-unit-5-qiongtong',
    status: 'closed_bounded_no_promotion',
    verificationMode: 'parent_recheck_of_predecessor_three-witness_page_observations_and_lineage_relations',
    result: 'Waseda leaves 7–11, NLC 1926, and NLC 1937 retain a bounded spring Jia wood comparison, with Waseda leaves 9–11 directly exposing the consecutive 正月甲木 / 二月甲木 / 三月甲木 headings. Independence/transmission and local lineage remain unresolved; authorship is not conflated with semantic stability.',
    evidenceIds: ['relation.continuation.qiongtong-three-witness-stability', 'claim.qiongtong-spring-jia-wood'],
    remainingEdges: [dayunBlockerIds.qiongtongTransmission],
  },
]

const claimDecomposition = {
  previousClaimId: 'claim.yuanhai-dayun-start-age',
  predecessorArtifactPath: 'artifacts/saju-five-classics-claim-adjudication-v0/complete.json',
  disposition: 'retained_in_predecessor_only_not_active_in_v1',
  reason: 'The prior bundled timing locator did not separate direction, 節 selection, distance, conversion, age, exact first start time, and later progression.',
  replacementClaimIds: [...dayunClaimIds],
}

const summarize = claims => ({
  claimCount: claims.length,
  adjudicationStatusCounts: Object.fromEntries(ADJUDICATION_STATUSES.map(status => [status, claims.filter(claim => claim.adjudicationStatus === status).length])),
  readinessTrueCounts: Object.fromEntries(READINESS_KEYS.map(key => [key, claims.filter(claim => claim.readiness?.[key] === true).length])),
  promotionReadyClaimIds: claims.filter(claim => claim.readiness?.promotion_ready === true).map(claim => claim.claimId),
})

const sourceFrontierIdentity = artifact => ({
  artifactPath: PREDECESSOR_ARTIFACT_PATHS.sourceFrontier,
  schemaVersion: artifact?.schemaVersion || null,
  version: artifact?.version || null,
  basisHead: artifact?.basisHead || null,
  contentSha256: artifact?.contentSha256 || null,
  artifactPayloadSha256: artifact?.artifactIdentity?.artifactPayloadSha256 || null,
  counts: artifact?.inventory?.counts || null,
})

const claimAdjudicationIdentity = artifact => ({
  artifactPath: PREDECESSOR_ARTIFACT_PATHS.claimAdjudication,
  schemaVersion: artifact?.schemaVersion || null,
  version: artifact?.version || null,
  basisHead: artifact?.basisHead || null,
  contentSha256: artifact?.contentSha256 || null,
  artifactPayloadSha256: artifact?.artifactIdentity?.artifactPayloadSha256 || null,
  counts: artifact?.inventory?.counts || null,
})

const timingIdentity = artifact => ({
  artifactPath: PREDECESSOR_ARTIFACT_PATHS.timingAuthority,
  schemaVersion: artifact?.schemaVersion || null,
  version: artifact?.version || null,
  basisHead: artifact?.basisHead || null,
  contentSha256: artifact?.contentSha256 || null,
  artifactPayloadSha256: artifact?.artifactIdentity?.artifactPayloadSha256 || null,
  counts: artifact?.inventory ? {
    sources: artifact.inventory.sourceCount,
    observations: artifact.inventory.observationCount,
    claims: artifact.inventory.claimCount,
    relations: artifact.inventory.relationCount,
    blockers: artifact.inventory.blockerCount,
  } : null,
})

const collectPredecessorReferenceIds = ({ sourceFrontier, timingAuthority }) => new Set([
  ...(sourceFrontier?.sources || []).map(item => item.sourceId),
  ...(sourceFrontier?.pageObservations || []).map(item => item.observationId),
  ...(sourceFrontier?.claimRelations || []).map(item => item.relationId),
  ...(sourceFrontier?.lineageRelations || []).map(item => item.lineageId || item.relationId),
  ...(sourceFrontier?.blockers || []).map(item => item.blockerId),
  ...(sourceFrontier?.works || []).map(item => item.workId),
  ...(timingAuthority?.sources || []).map(item => item.sourceId),
  ...(timingAuthority?.observations || []).map(item => item.observationId),
  ...(timingAuthority?.relations || []).map(item => item.relationId),
  ...(timingAuthority?.blockers || []).map(item => item.blockerId),
])

const allIncrementReferenceIds = new Set([
  ANU_V2_SOURCE_ID,
  ...anuObservations.map(item => item.observationId),
  ...continuationRelations.map(item => item.relationId),
  ...continuationLineageRelations.map(item => item.lineageId),
  ...blockers.map(item => item.blockerId),
  ...dayunClaimIds,
  ...semanticConflictFindings.map(item => item.findingId),
])

const clonePreviousClaims = claimAdjudication => (claimAdjudication?.claims || []).filter(claim => claim.claimId !== claimDecomposition.previousClaimId).map(claim => structuredClone(claim))

export function buildSajuFiveClassicsResearchContinuation({ basisHead, sourceFrontier, claimAdjudication, timingAuthority } = {}) {
  const claims = [...clonePreviousClaims(claimAdjudication), ...buildDayunClaims()]
  const artifact = {
    schemaVersion: SAJU_FIVE_CLASSICS_RESEARCH_CONTINUATION_SCHEMA,
    version: SAJU_FIVE_CLASSICS_RESEARCH_CONTINUATION_VERSION,
    basisHead,
    predecessors: {
      sourceFrontier: sourceFrontierIdentity(sourceFrontier),
      claimAdjudication: claimAdjudicationIdentity(claimAdjudication),
      timingAuthority: timingIdentity(timingAuthority),
    },
    researchDossierBoundary: {
      paths: [
        '/Users/softie/Downloads/ANU 《三命通會》 5-volume 공개 자료_ Acquisition Dossier.md',
        '/Users/softie/Downloads/anu_sanming_volume_juan_crosswalk.csv',
        '/Users/softie/Downloads/anu_sanming_volume_juan_crosswalk.json',
        '/Users/softie/Downloads/명리 고전 PDF 5종의 판본·디지털 계통 독립 검증 연구보고서.md',
        '/Users/softie/Downloads/외부 자료 조사 기록.md',
      ],
      usedAs: 'prior_research_and_locator_dossier_only',
      canonicalImport: false,
      independenceImport: false,
      authorityImport: false,
      note: 'Attached dossiers and crosswalks are not canonical facts. Only parent-reverified institutional record, canonical bitstream bytes, and direct rendered scan observations enter this continuation ledger.',
    },
    sources: [structuredClone(anuSource)],
    observations: structuredClone(anuObservations),
    claims,
    claimDecomposition,
    claimRelations: structuredClone(continuationRelations),
    lineageRelations: structuredClone(continuationLineageRelations),
    semanticConflictFindings: structuredClone(semanticConflictFindings),
    unitFindings: structuredClone(unitFindings),
    blockers: structuredClone(blockers),
    continuationDecisions: buildContinuationGateDecisions(basisHead),
    readiness: {
      status: 'blocked',
      availableForInterpretation: false,
      productionActivation: 'blocked',
      semanticAuthority: 'not_established',
      stableClaimPromotionCount: 0,
      promotionReadyClaimIds: [],
      reason: 'The continuation closes bounded observations and narrows blockers, but local lineage, independent transmission, exact edition identity, semantic conflict cause, and/or exact timing procedure remain unresolved.',
    },
    adjudicationSummary: summarize(claims),
    inventory: {
      counts: {
        predecessorClaims: claimAdjudication?.claims?.length || 0,
        activeClaims: claims.length,
        splitClaims: dayunClaimIds.length,
        sources: 1,
        observations: anuObservations.length,
        claimRelations: continuationRelations.length,
        lineageRelations: continuationLineageRelations.length,
        blockers: blockers.length,
        unitFindings: unitFindings.length,
        semanticConflictFindings: semanticConflictFindings.length,
      },
      predecessorReferenceIds: [...collectPredecessorReferenceIds({ sourceFrontier, timingAuthority })].sort(),
      incrementReferenceIds: [...allIncrementReferenceIds].sort(),
      activeClaimIds: claims.map(claim => claim.claimId).sort(),
      promotionReadyClaimIds: [],
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
  return createHash('sha256').update(Buffer.from(canonicalIdentityJson(copy))).digest('hex')
}

const knownReferenceIds = ({ sourceFrontier, claimAdjudication, timingAuthority, artifact }) => new Set([
  ...collectPredecessorReferenceIds({ sourceFrontier, timingAuthority }),
  ...(claimAdjudication?.externalRecordObservations || []).map(item => item.recordId),
  ...(artifact.sources || []).map(item => item.sourceId),
  ...(artifact.observations || []).map(item => item.observationId),
  ...(artifact.claimRelations || []).map(item => item.relationId),
  ...(artifact.lineageRelations || []).map(item => item.lineageId),
  ...(artifact.blockers || []).map(item => item.blockerId),
  ...(artifact.claims || []).map(item => item.claimId),
  ...(artifact.semanticConflictFindings || []).map(item => item.findingId),
])

export function checkSajuFiveClassicsResearchContinuation(artifact, { sourceFrontier, claimAdjudication, timingAuthority } = {}) {
  const errors = []
  const fail = message => errors.push(message)
  if (!artifact || typeof artifact !== 'object' || Array.isArray(artifact)) return ['artifact_shape_invalid']
  if (artifact.schemaVersion !== SAJU_FIVE_CLASSICS_RESEARCH_CONTINUATION_SCHEMA) fail('schema_version')
  if (artifact.version !== SAJU_FIVE_CLASSICS_RESEARCH_CONTINUATION_VERSION) fail('version')
  if (artifact.researchDossierBoundary?.canonicalImport !== false || artifact.researchDossierBoundary?.independenceImport !== false || artifact.researchDossierBoundary?.authorityImport !== false) fail('dossier_boundary')
  if (artifact.readiness?.availableForInterpretation !== false || artifact.readiness?.productionActivation !== 'blocked' || artifact.readiness?.semanticAuthority !== 'not_established' || artifact.readiness?.stableClaimPromotionCount !== 0) fail('readiness_or_activation')
  if (artifact.readiness?.promotionReadyClaimIds?.length !== 0 || artifact.inventory?.promotionReadyClaimIds?.length !== 0) fail('promotion_ids_nonempty')
  if (artifact.sources?.length !== 1 || artifact.sources[0]?.sourceId !== ANU_V2_SOURCE_ID) fail('anu_source_missing')
  if (artifact.sources[0]?.bitstream?.byteSha256 !== ANU_V2_BITSTREAM.byteSha256 || artifact.sources[0]?.bitstream?.byteLength !== ANU_V2_BITSTREAM.byteLength || artifact.sources[0]?.bitstream?.pageCount !== ANU_V2_BITSTREAM.pageCount) fail('anu_bitstream_identity')
  if ((artifact.observations || []).map(item => item.observationId).sort().join('|') !== anuObservations.map(item => item.observationId).sort().join('|')) fail('anu_observation_set')
  if ((artifact.claimDecomposition?.replacementClaimIds || []).join('|') !== dayunClaimIds.join('|')) fail('claim_decomposition')

  const known = knownReferenceIds({ sourceFrontier, claimAdjudication, timingAuthority, artifact })
  const claimIds = new Set()
  for (const claim of artifact.claims || []) {
    if (claimIds.has(claim.claimId)) fail(`claim_duplicate:${claim.claimId}`)
    claimIds.add(claim.claimId)
    if (!ADJUDICATION_STATUSES.includes(claim.adjudicationStatus)) fail(`claim_status:${claim.claimId}`)
    if (!Array.isArray(claim.workIds) || claim.workIds.length === 0) fail(`claim_work:${claim.claimId}`)
    for (const id of claim.sourceFrontierEvidence?.sourceIds || []) if (!known.has(id)) fail(`claim_source_ref:${claim.claimId}:${id}`)
    for (const id of claim.sourceFrontierEvidence?.pageObservationIds || []) if (!known.has(id)) fail(`claim_observation_ref:${claim.claimId}:${id}`)
    for (const id of claim.sourceFrontierEvidence?.claimRelationIds || []) if (!known.has(id)) fail(`claim_relation_ref:${claim.claimId}:${id}`)
    for (const id of claim.sourceFrontierEvidence?.blockerIds || []) if (!known.has(id)) fail(`claim_blocker_ref:${claim.claimId}:${id}`)
    for (const key of READINESS_KEYS) {
      if (typeof claim.readiness?.[key] !== 'boolean') fail(`readiness_boolean:${claim.claimId}:${key}`)
      const evidence = claim.readiness?.readinessEvidence?.[key]
      if (!evidence || !['proven', 'missing'].includes(evidence.status)) fail(`readiness_evidence:${claim.claimId}:${key}`)
      if (claim.readiness?.[key] === true && (evidence.status !== 'proven' || !evidence.evidenceRefs?.length)) fail(`readiness_true_without_evidence:${claim.claimId}:${key}`)
      if (claim.readiness?.[key] === false && evidence.status === 'proven') fail(`readiness_false_proven:${claim.claimId}:${key}`)
      for (const ref of evidence?.evidenceRefs || []) if (!known.has(ref)) fail(`readiness_ref:${claim.claimId}:${key}:${ref}`)
    }
    if (claim.readiness.promotion_ready || claim.semanticAuthorityStatus === 'established') fail(`claim_promoted:${claim.claimId}`)
  }
  if (claimIds.has(claimDecomposition.previousClaimId)) fail('bundled_dayun_claim_still_active')
  for (const claimId of dayunClaimIds) if (!claimIds.has(claimId)) fail(`split_claim_missing:${claimId}`)
  const summary = summarize(artifact.claims || [])
  if (canonicalIdentityJson(summary) !== canonicalIdentityJson(artifact.adjudicationSummary)) fail('adjudication_summary')

  const relationIds = new Set()
  for (const relation of artifact.claimRelations || []) {
    if (relationIds.has(relation.relationId)) fail(`relation_duplicate:${relation.relationId}`)
    relationIds.add(relation.relationId)
    for (const id of relation.claimIds || []) if (!claimIds.has(id)) fail(`relation_claim_ref:${relation.relationId}:${id}`)
    for (const id of relation.sourceIds || []) if (!known.has(id)) fail(`relation_source_ref:${relation.relationId}:${id}`)
    for (const id of relation.observationIds || []) if (!known.has(id)) fail(`relation_observation_ref:${relation.relationId}:${id}`)
  }
  const lineageIds = new Set()
  for (const lineage of artifact.lineageRelations || []) {
    if (lineageIds.has(lineage.lineageId)) fail(`lineage_duplicate:${lineage.lineageId}`)
    lineageIds.add(lineage.lineageId)
    if (!relationIds.has(lineage.relationId)) fail(`lineage_relation_ref:${lineage.lineageId}:${lineage.relationId}`)
    for (const id of lineage.sourceIds || []) if (!known.has(id)) fail(`lineage_source_ref:${lineage.lineageId}:${id}`)
  }
  const blockerIds = new Set((artifact.blockers || []).map(item => item.blockerId))
  for (const claim of artifact.claims || []) for (const id of claim.sourceFrontierEvidence?.blockerIds || []) if (!known.has(id)) fail(`blocker_ref:${claim.claimId}:${id}`)
  for (const finding of artifact.semanticConflictFindings || []) {
    if (finding.classification !== 'semantic_conflict' || finding.adjudication !== 'cause_unresolved; preserve semantic_conflict and do not normalize the local wording into the historical pair') fail(`semantic_conflict_boundary:${finding.findingId}`)
    if (!claimIds.has(finding.claimId)) fail(`semantic_conflict_claim:${finding.findingId}`)
    for (const ref of finding.evidenceRefs || []) if (!known.has(ref) && !blockerIds.has(ref)) fail(`semantic_conflict_ref:${finding.findingId}:${ref}`)
  }
  const xiangshenFinding = artifact.semanticConflictFindings?.find(item => item.findingId === 'finding.xiangshen-cause-v1')
  const nlc35296Observation = xiangshenFinding?.additionalHistoricalObservation
  if (nlc35296Observation) {
    if (nlc35296Observation.status !== 'phrase_and_boundary_only_unresolved_date_lineage' || nlc35296Observation.roleClauseAfterCaiWangShengGuan?.status !== 'not_transcribed' || nlc35296Observation.roleClauseAfterCaiWangShengGuan?.text !== null) fail('xiangshen_finding_role_clause_overclaim')
    if (!known.has(nlc35296Observation.sourceId)) fail('xiangshen_finding_source_ref')
    for (const ref of nlc35296Observation.pageObservationIds || []) if (!known.has(ref)) fail(`xiangshen_finding_observation_ref:${ref}`)
  }
  const xiangshenClaim = artifact.claims?.find(item => item.claimId === 'claim.ziping-xiangshen')
  if (xiangshenClaim?.semanticConflict && (xiangshenClaim.semanticAuthorityStatus === 'established' || xiangshenClaim.readiness?.promotion_ready === true)) fail('xiangshen_conflict_promoted')
  if (artifact.inventory?.counts?.activeClaims !== artifact.claims?.length) fail('inventory_active_claim_count')
  if (artifact.inventory?.counts?.splitClaims !== dayunClaimIds.length) fail('inventory_split_claim_count')
  if (artifact.inventory?.counts?.sources !== artifact.sources?.length) fail('inventory_source_count')
  if (artifact.inventory?.counts?.observations !== artifact.observations?.length) fail('inventory_observation_count')
  if (artifact.inventory?.counts?.claimRelations !== artifact.claimRelations?.length) fail('inventory_claim_relation_count')
  if (artifact.inventory?.counts?.lineageRelations !== artifact.lineageRelations?.length) fail('inventory_lineage_relation_count')
  if (artifact.inventory?.counts?.blockers !== artifact.blockers?.length) fail('inventory_blocker_count')
  if (artifact.contentSha256 !== contentHash(artifact)) fail('content_hash')
  return [...new Set(errors)].sort()
}

export const SAJU_FIVE_CLASSICS_RESEARCH_CONTINUATION_INTERNALS = Object.freeze({
  READINESS_KEYS,
  ADJUDICATION_STATUSES,
  ANU_V2_SOURCE_ID,
  ANU_V2_BITSTREAM,
  ANU_V2_OBSERVATION_IDS: [ANU_V2_RECORD_OBSERVATION_ID, ANU_V2_BITSTREAM_OBSERVATION_ID, ANU_V2_SCAN_58_OBSERVATION_ID, ANU_V2_SCAN_59_OBSERVATION_ID],
  DAYUN_CLAIM_IDS: dayunClaimIds,
})

import { createHash } from 'node:crypto'

import { canonicalIdentityJson } from '../artifactIdentity.js'

export const SAJU_SHENFENG_NLC_BACK_MATTER_SCHEMA = 'saju-shenfeng-nlc-witness-back-matter-adjudication-v1'
export const SAJU_SHENFENG_NLC_BACK_MATTER_VERSION = '0.1.0'
export const PREDECESSOR_ARTIFACT_PATH = 'artifacts/saju-shenfeng-nlc-witness-adjudication-v0/complete.json'
export const PREDECESSOR_INTEGRITY_PATH = `${PREDECESSOR_ARTIFACT_PATH}.integrity.json`
export const PREDECESSOR_ARTIFACT_BYTE_SHA256 = '4c33926a27f5fa96b5ceb37c73c1d4e02469db91ba8009cdef25272868eba94a'
export const PREDECESSOR_ARTIFACT_PAYLOAD_SHA256 = '8e47bca1247702be3e44d0b374995b7a5cad160f74c5cd0d51e5bdbe6d519f71'

export const REQUIRED_BLOCKERS = Object.freeze([
  'physical_copy_or_catalogue_call_number_not_obtained_for_each_NLC_record',
  'original_title_page_colophon_and_imprint_not_page-inspected_for_the_target_copies',
  'NLC_reader_or_reproduction_permission_for_copy-level_collation_not_closed',
  'edition_and_textual_lineage_between_1926_and_1929_not_established',
])

export const OBSERVATION_POLICY = 'Official NLC PDF bytes were hash-verified and the stated back-matter pages were visually inspected. OCR/text extraction, advertisement copy, library marks, and publication notices remain bounded observations, not copy identity or lineage authority.'

const sha256 = value => createHash('sha256').update(value).digest('hex')

const contentHash = artifact => {
  const copy = structuredClone(artifact)
  delete copy.contentSha256
  delete copy.artifactIdentity
  return sha256(Buffer.from(canonicalIdentityJson(copy)))
}

const backMatterObservation = ({ observationId, witnessId, pdfUrl, pdfPage, pdfPageCount, pdfByteLength, pdfByteSha256, observedText, observedMarks, scopeBoundary }) => ({
  observationId,
  witnessId,
  sourceCategory: 'OFFICIAL_NLC_PDF_IMAGE_PAGE',
  directVisualObservation: true,
  officialPdf: {
    pdfUrl,
    pdfPage,
    pdfPageCount,
    pdfByteLength,
    pdfByteSha256,
  },
  pageKind: 'publisher_advertisement_or_back_matter_notice',
  printedFolio: null,
  observedText,
  observedMarks,
  scopeBoundary,
})

export const NEW_BACK_MATTER_OBSERVATIONS = Object.freeze([
  backMatterObservation({
    observationId: 'obs.shenfeng-1926-backmatter-p166-publication-notice',
    witnessId: 'nlc-1926-12jh004266',
    pdfUrl: 'http://read.nlc.cn/doc2/data13/mgts_minguotushu/mgts20140421_01/duixiang/12jh004266/12jh004266/001/12jh004266_001.pdf',
    pdfPage: 166,
    pdfPageCount: 167,
    pdfByteLength: 4337116,
    pdfByteSha256: '47b28d1034e372e52a4289c63607a8e8a11e8e80111dcdcfeeca72ea9d6c6c6d',
    observedText: ['神峰通考（全二冊）', '中華民國十五年一月出版', '此書有著作權翻印必究'],
    observedMarks: [],
    scopeBoundary: 'The page visibly carries a publisher publication/copyright notice in the scanned object. It is not admitted as the target copy\'s original title page, colophon, or complete copy-level imprint.',
  }),
  backMatterObservation({
    observationId: 'obs.shenfeng-1929-backmatter-p167-edition-notice',
    witnessId: 'nlc-1929-027032013020556-v2',
    pdfUrl: 'http://read.nlc.cn/doc2/data13/zjmgwx_zhengjiminguowenxian/20140527_01zjmgwx/duixiang/027032013020556/002/027032013020556_002.pdf',
    pdfPage: 167,
    pdfPageCount: 168,
    pdfByteLength: 6708084,
    pdfByteSha256: 'ccb21cf1215a1e487fe79497839f9343534af42a2e3af6c1e7dd04f3faea9289',
    observedText: ['神峰通考（全二冊）', '中華民國十五年一月初版', '中華民國十八年十月再版', '此書有著作權翻印必究'],
    observedMarks: ['上海图书馆藏书'],
    scopeBoundary: 'The page visibly carries a publisher edition notice and a Shanghai Library collection mark in this scanned object. Neither mark proves NLC call-number identity, copy equivalence with 1926, or textual lineage.',
  }),
])

export function buildSajuShenfengNlcWitnessBackMatterAdjudication({ basisHead, predecessorReference } = {}) {
  if (!/^[0-9a-f]{40}$/.test(basisHead || '')) throw new Error('Shenfeng back-matter adjudication requires a valid basis HEAD')
  if (!predecessorReference || predecessorReference.artifactPath !== PREDECESSOR_ARTIFACT_PATH) throw new Error('Shenfeng back-matter adjudication requires the v0 predecessor reference')
  if (predecessorReference.artifactByteSha256 !== PREDECESSOR_ARTIFACT_BYTE_SHA256) throw new Error('Shenfeng v0 predecessor bytes changed')
  if (predecessorReference.artifactPayloadSha256 !== PREDECESSOR_ARTIFACT_PAYLOAD_SHA256) throw new Error('Shenfeng v0 predecessor payload changed')

  const artifact = {
    schemaVersion: SAJU_SHENFENG_NLC_BACK_MATTER_SCHEMA,
    version: SAJU_SHENFENG_NLC_BACK_MATTER_VERSION,
    basisHead,
    scope: {
      objective: 'Re-evaluate the halted Shenfeng frontier after Mingli v1 and record only newly verified official-NLC back-matter observations.',
      sourceOfTruth: 'The preserved Shenfeng v0 artifact plus the exact official NLC PDF bytes and visually inspected back-matter pages listed in newEvidence.observations.',
      directVerificationCompleted: ['v0 predecessor byte/integrity identity', '1926 official PDF p.166', '1929 official PDF p.167'],
      prohibited: ['publisher-notice-to-copy-identity inference', 'library-mark-to-NLC-call-number inference', '1929 reprint-notice-to-textual-lineage promotion', 'same-layout independence', 'semantic authority', 'interpretation readiness', 'production activation', 'v0 predecessor mutation'],
    },
    evidencePolicy: {
      observation: OBSERVATION_POLICY,
      lineage: 'A publication notice, reprint statement, library mark, shared title, or shared layout does not establish physical-copy equivalence, textual transmission, or independent lineage.',
      readiness: 'This successor records a bounded back-matter frontier only; it does not change calculation, semantic, readiness, or production authority.',
    },
    predecessor: {
      artifactPath: PREDECESSOR_ARTIFACT_PATH,
      artifactByteSha256: predecessorReference.artifactByteSha256,
      artifactPayloadSha256: predecessorReference.artifactPayloadSha256,
      basisHead: predecessorReference.basisHead,
      contentSha256: predecessorReference.contentSha256,
      schemaVersion: predecessorReference.schemaVersion,
      version: predecessorReference.version,
      preserved: true,
      mutation: 'none',
    },
    newEvidence: {
      observations: NEW_BACK_MATTER_OBSERVATIONS.map(item => structuredClone(item)),
      directObservationCount: NEW_BACK_MATTER_OBSERVATIONS.length,
      rawPdfByteIdentityVerified: true,
      canonicalTransmissionEdges: [],
      scopeBoundary: 'The new pages narrow the observable publication/back-matter frontier only. They do not close a full copy lineage or grant semantic authority.',
    },
    blockerReassessment: [
      {
        blocker: REQUIRED_BLOCKERS[0],
        previousStatus: 'unresolved',
        currentStatus: 'unresolved',
        progress: 'partial_copy_mark_only',
        evidenceRefs: ['obs.shenfeng-1929-backmatter-p167-edition-notice'],
        reason: 'A Shanghai Library mark is visible on one scanned page, but no NLC call number or copy-level identity for each target record is established.',
      },
      {
        blocker: REQUIRED_BLOCKERS[1],
        previousStatus: 'unresolved',
        currentStatus: 'unresolved',
        progress: 'back_matter_notice_only',
        evidenceRefs: NEW_BACK_MATTER_OBSERVATIONS.map(item => item.observationId),
        reason: 'The inspected pages carry publisher notices but do not establish each target copy\'s original title page, colophon, or complete imprint.',
      },
      {
        blocker: REQUIRED_BLOCKERS[2],
        previousStatus: 'unresolved',
        currentStatus: 'unresolved',
        progress: 'unchanged',
        evidenceRefs: [],
        reason: 'Successful official PDF access does not establish reproduction permission or authorized copy-level collation.',
      },
      {
        blocker: REQUIRED_BLOCKERS[3],
        previousStatus: 'unresolved',
        currentStatus: 'unresolved',
        progress: 'publisher_reprint_lead_only',
        evidenceRefs: ['obs.shenfeng-1929-backmatter-p167-edition-notice'],
        reason: 'The 1929 page records a fifteen-year first edition and eighteen-year reprint notice, but this does not prove the two target objects share textual lineage or a single physical edition.',
      },
    ],
    preservedV0Frontier: {
      targetWitnessCount: 2,
      targetPageCount: 2,
      canonicalShenfengMaleFirstDaYunLiteral: '五歲運逆行',
      canonicalShenfengMaleFollowingBranch: null,
      v0Readiness: 'blocked',
      v0PromotionCount: 0,
      v0CanonicalTransmissionEdgeCount: 0,
    },
    lineageGraph: {
      edges: [],
      canonicalEdges: [],
      status: 'unresolved',
      policy: 'No edition, transmission, or independent-lineage edge is admitted from back-matter notices or library marks.',
    },
    blockers: [...REQUIRED_BLOCKERS],
    readiness: {
      availableForInterpretation: false,
      implementationSafeGrounding: 'not_established',
      productionActivation: 'blocked',
      promotionReadyClaimIds: [],
      semanticAuthority: 'not_established',
      stableClaimPromotionCount: 0,
      status: 'blocked',
      reason: 'The new back-matter pages add bounded publication and scan-mark observations but do not close copy identity, colophon, textual lineage, semantic authority, or production grounding.',
    },
    promotion: {
      ready: false,
      status: 'blocked',
      interpretationAvailable: false,
      productionChanged: false,
      semanticAuthorityChanged: false,
      stableClaimPromotionCount: 0,
      promotionReadyClaimIds: [],
      scope: 'No calculation, semantic, readiness, or production promotion.',
    },
    summary: {
      predecessorPreserved: true,
      newDirectBackMatterObservationCount: NEW_BACK_MATTER_OBSERVATIONS.length,
      rawPdfIdentityVerifiedCount: NEW_BACK_MATTER_OBSERVATIONS.length,
      publicationNoticeObservationCount: NEW_BACK_MATTER_OBSERVATIONS.length,
      physicalCopyMarkObservationCount: 1,
      blockerCount: REQUIRED_BLOCKERS.length,
      blockerReductionCount: 0,
      targetWitnessCount: 2,
      canonicalShenfengMaleFirstDaYunLiteral: '五歲運逆行',
      promotionCount: 0,
      readiness: 'blocked',
    },
    negativeChecks: {
      allMustReject: true,
      ids: [
        'promote-backmatter-to-copy-identity',
        'close-edition-lineage-from-reprint-notice',
        'promote-library-mark-to-nlc-call-number',
        'add-canonical-lineage-edge',
        'open-readiness-or-production',
        'mutate-v0-predecessor',
      ],
    },
    contentSha256: null,
  }
  artifact.contentSha256 = contentHash(artifact)
  return artifact
}

export function checkSajuShenfengNlcWitnessBackMatterAdjudication(artifact) {
  const errors = []
  const fail = value => errors.push(value)
  if (!artifact || typeof artifact !== 'object' || Array.isArray(artifact)) return ['artifact_shape_invalid']
  if (artifact.schemaVersion !== SAJU_SHENFENG_NLC_BACK_MATTER_SCHEMA) fail('schema_version')
  if (artifact.version !== SAJU_SHENFENG_NLC_BACK_MATTER_VERSION) fail('version')
  if (artifact.scope?.sourceOfTruth !== 'The preserved Shenfeng v0 artifact plus the exact official NLC PDF bytes and visually inspected back-matter pages listed in newEvidence.observations.') fail('source_of_truth')
  if (artifact.predecessor?.artifactPath !== PREDECESSOR_ARTIFACT_PATH || artifact.predecessor?.preserved !== true || artifact.predecessor?.mutation !== 'none') fail('predecessor_preservation')
  if (artifact.predecessor?.artifactByteSha256 !== PREDECESSOR_ARTIFACT_BYTE_SHA256 || artifact.predecessor?.artifactPayloadSha256 !== PREDECESSOR_ARTIFACT_PAYLOAD_SHA256) fail('predecessor_identity')
  if (artifact.newEvidence?.rawPdfByteIdentityVerified !== true || artifact.newEvidence?.canonicalTransmissionEdges?.length !== 0) fail('new_evidence_authority')
  const observations = artifact.newEvidence?.observations || []
  if (observations.length !== 2) fail('observation_count')
  const byId = Object.fromEntries(observations.map(item => [item.observationId, item]))
  const first = byId['obs.shenfeng-1926-backmatter-p166-publication-notice']
  const second = byId['obs.shenfeng-1929-backmatter-p167-edition-notice']
  if (first?.officialPdf?.pdfPage !== 166 || first?.officialPdf?.pdfByteSha256 !== '47b28d1034e372e52a4289c63607a8e8a11e8e80111dcdcfeeca72ea9d6c6c6d') fail('1926_backmatter_identity')
  if (second?.officialPdf?.pdfPage !== 167 || second?.officialPdf?.pdfByteSha256 !== 'ccb21cf1215a1e487fe79497839f9343534af42a2e3af6c1e7dd04f3faea9289') fail('1929_backmatter_identity')
  if (!first?.observedText?.includes('中華民國十五年一月出版') || !second?.observedText?.includes('中華民國十五年一月初版') || !second?.observedText?.includes('中華民國十八年十月再版')) fail('publication_notice_observation')
  if (JSON.stringify(first?.observedMarks || []) !== '[]' || JSON.stringify(second?.observedMarks || []) !== JSON.stringify(['上海图书馆藏书'])) fail('library_mark_observation')
  if (JSON.stringify(artifact.blockers) !== JSON.stringify([...REQUIRED_BLOCKERS])) fail('blockers_changed')
  if ((artifact.blockerReassessment || []).length !== REQUIRED_BLOCKERS.length || artifact.blockerReassessment.some(item => item.previousStatus !== 'unresolved' || item.currentStatus !== 'unresolved')) fail('blocker_reassessment_opened')
  if (artifact.summary?.blockerReductionCount !== 0 || artifact.summary?.promotionCount !== 0) fail('promotion_or_blocker_reduction')
  if (artifact.readiness?.availableForInterpretation !== false || artifact.readiness?.productionActivation !== 'blocked' || artifact.readiness?.semanticAuthority !== 'not_established' || artifact.readiness?.stableClaimPromotionCount !== 0) fail('readiness_open')
  if (artifact.promotion?.ready !== false || artifact.promotion?.productionChanged !== false || artifact.promotion?.semanticAuthorityChanged !== false) fail('promotion_side_effect')
  if (artifact.lineageGraph?.canonicalEdges?.length !== 0 || artifact.lineageGraph?.edges?.length !== 0) fail('lineage_promoted')
  if (artifact.contentSha256 !== contentHash(artifact)) fail('content_hash')
  return [...new Set(errors)].sort()
}

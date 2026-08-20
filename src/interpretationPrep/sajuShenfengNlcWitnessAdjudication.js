import { createHash } from 'node:crypto'

import { canonicalIdentityJson } from '../artifactIdentity.js'

export const SAJU_SHENFENG_NLC_SCHEMA = 'saju-shenfeng-nlc-witness-adjudication-v0'
export const SAJU_SHENFENG_NLC_VERSION = '0.1.0'
export const PARENT_ARTIFACT_PATH = 'artifacts/saju-gemini-v7-parent-adjudication/complete.json'
export const PARENT_ARTIFACT_BYTE_SHA256 = '76add867e33c35286788a5e899a3ee66f626959f657ef6fe11ab0f4dc61e8d0d'

export const REQUIRED_BLOCKERS = Object.freeze([
  'physical_copy_or_catalogue_call_number_not_obtained_for_each_NLC_record',
  'original_title_page_colophon_and_imprint_not_page-inspected_for_the_target_copies',
  'NLC_reader_or_reproduction_permission_for_copy-level_collation_not_closed',
  'edition_and_textual_lineage_between_1926_and_1929_not_established',
])

export const INPUT_PAGE_POLICY = 'PDF image pages were visually inspected from the official NLC PDF routes. OCR/text extraction is locator-only and is not admitted as the page reading.'
export const LINEAGE_POLICY = 'Same title, publisher, wording, page layout, or shared worked example does not establish the same edition, transmission, or independent lineage.'
export const READINESS_POLICY = 'The successor corrects a source-specific literal/locator conflict only; it does not promote semantic authority, calculation procedure, interpretation readiness, or production activation.'

const sha256 = value => createHash('sha256').update(value).digest('hex')
const contentHash = artifact => {
  const copy = structuredClone(artifact)
  delete copy.contentSha256
  delete copy.artifactIdentity
  return sha256(Buffer.from(canonicalIdentityJson(copy)))
}

const nlcRecord = ({
  witnessId,
  role,
  indexName,
  fid,
  aid,
  bid,
  publicationDate,
  publicationStatement,
  publisher,
  carrier,
  pdfUrl,
  readerUrl,
  pdfPageCount,
  pdfByteLength,
  pdfByteSha256,
  pageAudit,
}) => ({
  witnessId,
  role,
  institution: 'National Library of China (NLC)',
  itemIdentity: {
    indexName,
    fid,
    aid,
    bid,
    recordTitle: '神峰通考',
    authorOrEditor: '秦慎安校勘',
    publicationDate,
    publicationStatement,
    publisher,
    carrier,
    recordUrl: `http://read.nlc.cn/allSearch/searchDetail?searchType=24&showType=1&indexName=${indexName}&fid=${fid}`,
    readerUrl,
  },
  officialDigitalObject: {
    pdfUrl,
    accessObserved: 'HTTP 200 from official NLC PDF route during this audit',
    pdfPageCount,
    pdfByteLength,
    pdfByteSha256,
    imageOnly: true,
    pageReadingMethod: INPUT_PAGE_POLICY,
  },
  pageAudit,
})

const commonHeadings = ['月令詳辨', '起大運法陽男陰女', '起大運法陰男陽女', '子平舉要']

const targetPageAudit = ({ pdfPage, femaleDistanceText }) => ({
  targetPageStatus: 'directly_inspected',
  actualPdfPage: pdfPage,
  pdfPageNumbering: 'one_based',
  printedFolio: '二〇',
  pageHeader: ['神峰通考', '卷四'],
  surroundingPdfPagesInspected: [pdfPage - 1, pdfPage, pdfPage + 1],
  sectionHeadingsInObservedSpread: [...commonHeadings],
  targetExampleOrder: ['乙丑男', '甲子女'],
  maleExample: {
    label: '乙丑男',
    visibleText: '如乙丑年。乙庚之歲戊為頭。正月起戊寅。初二立春後十五日生男。逆數至初一日立春。五三十五。五歲運逆行。',
    observedTokens: ['乙庚之歲戊為頭', '正月起戊寅', '初二立春後十五日生男', '逆數至初一日立春', '五三十五', '五歲運逆行'],
    firstDaYunLiteral: '五歲運逆行',
    followingBranch: {
      status: 'not_printed_in_the_target_male_column',
      value: null,
      scope: 'This is a bounded page/column observation, not a negative claim about every copy or every page of the work.',
    },
  },
  femaleExample: {
    label: '甲子女',
    visibleText: `如甲子年。甲己之年丙作首。正月起丙寅。初一立春後十日生女。${femaleDistanceText}得九日三三單九。三歲運逆行。餘倣此。`,
    observedTokens: ['甲己之年丙作首', '正月起丙寅', '初一立春後十日生女', femaleDistanceText.trim(), '得九日', '三三單九', '三歲運逆行', '餘倣此'],
    firstDaYunLiteral: '三歲運逆行',
    followingBranch: '餘倣此',
  },
  readingScope: 'Manual visual reading of the stated target page and adjacent pages; punctuation and the 1926/1929 female-column difference are retained as page-specific observations and are not normalized.',
})

export const NLC_WITNESSES = Object.freeze([
  nlcRecord({
    witnessId: 'nlc-1926-12jh004266',
    role: 'target_bearing_witness',
    indexName: 'data_416',
    fid: '12jh004266',
    aid: '416',
    bid: '48929.0',
    publicationDate: '民国十五年[1926]',
    publicationStatement: '民国十五年[1926]',
    publisher: '文明书局[发行者]',
    carrier: '1册',
    readerUrl: 'http://read.nlc.cn/OutOpenBook/OpenObjectBook?aid=416&bid=48929.0',
    pdfUrl: 'http://read.nlc.cn/doc2/data13/mgts_minguotushu/mgts20140421_01/duixiang/12jh004266/12jh004266/001/12jh004266_001.pdf',
    pdfPageCount: 167,
    pdfByteLength: 4337116,
    pdfByteSha256: '47b28d1034e372e52a4289c63607a8e8a11e8e80111dcdcfeeca72ea9d6c6c6d',
    pageAudit: targetPageAudit({ pdfPage: 21, femaleDistanceText: '逆數至初一日立春止。' }),
  }),
  nlcRecord({
    witnessId: 'nlc-1926-13jh001619',
    role: 'same_title_separate_record_non_target_at_inspected_locator',
    indexName: 'data_416',
    fid: '13jh001619',
    aid: '416',
    bid: '43305.0',
    publicationDate: '[1926]',
    publicationStatement: '[1926]',
    publisher: '上海文明书局[印行者]',
    carrier: '1册',
    readerUrl: 'http://read.nlc.cn/OutOpenBook/OpenObjectBook?aid=416&bid=43305.0',
    pdfUrl: 'http://read.nlc.cn/doc2/data13/mgts_minguotushu/mgts20140421_01/duixiang/13jh001619/13jh001619/001/13jh001619_001.pdf',
    pdfPageCount: 169,
    pdfByteLength: 6160849,
    pdfByteSha256: 'ba8e5408809cac2e9bec8b512e421cdf08c2e83e175323db5dffbe7004a0d569',
    pageAudit: {
      targetPageStatus: 'not_admitted_at_inspected_locator',
      inspectedPdfPages: [22],
      observedAtInspectedLocator: 'PDF p.22 is a separate 神峰通考 卷一 page; the 卷四 起大運法 target was not admitted from this locator.',
      scanWideTargetSearch: 'not_claimed',
      relationToTargetRecord: 'separate NLC record/item identity; do not collapse into 12jh004266',
    },
  }),
  nlcRecord({
    witnessId: 'nlc-1929-027032013020556-v2',
    role: 'target_bearing_witness',
    indexName: 'data_511',
    fid: '027032013020556',
    aid: '511',
    bid: '10361.0',
    publicationDate: '民国十八年十一月[1929.11]',
    publicationStatement: '民国十八年十一月[1929.11] 出版印行分售',
    publisher: '中华书局·文明书局',
    carrier: '上下册',
    readerUrl: 'http://read.nlc.cn/OutOpenBook/OpenObjectBook?aid=511&bid=10361.0',
    pdfUrl: 'http://read.nlc.cn/doc2/data13/zjmgwx_zhengjiminguowenxian/20140527_01zjmgwx/duixiang/027032013020556/002/027032013020556_002.pdf',
    pdfPageCount: 168,
    pdfByteLength: 6708084,
    pdfByteSha256: 'ccb21cf1215a1e487fe79497839f9343534af42a2e3af6c1e7dd04f3faea9289',
    pageAudit: targetPageAudit({ pdfPage: 22, femaleDistanceText: '逆數至初一日立春。' }),
  }),
])

const claim = (claimId, status, assertion, evidenceRefs, scopeCorrection) => ({
  claimId,
  status,
  assertion,
  evidenceRefs,
  evidenceStatus: 'bounded_direct_page_or_first_party_record_observation',
  scopeCorrection,
  semanticAuthority: 'not_established',
  productionActivation: 'blocked',
  promotion: { ready: false, status: 'blocked' },
})

export function buildSajuShenfengNlcWitnessAdjudication({ basisHead, predecessorReference } = {}) {
  if (!/^[0-9a-f]{40}$/.test(basisHead || '')) throw new Error('Shenfeng NLC adjudication requires a valid basis HEAD')
  if (!predecessorReference || predecessorReference.artifactPath !== PARENT_ARTIFACT_PATH) throw new Error('Shenfeng NLC adjudication requires the v7 parent reference')

  const artifact = {
    schemaVersion: SAJU_SHENFENG_NLC_SCHEMA,
    version: SAJU_SHENFENG_NLC_VERSION,
    basisHead,
    scope: {
      objective: 'Close NLC 1926/1929 神峰通考 item identity, target-page locator, and page-bounded variant relation; supersede the parent 丁丑 conflict without rewriting the parent artifact.',
      sourceOfTruth: 'Official NLC item records plus the exact official NLC PDF image pages listed in witnesses[].pageAudit.',
      directVerificationCompleted: ['NLC item metadata', 'official PDF byte identity', '1926 target page PDF p.21 / folio 二〇', '1929 target page PDF p.22 / folio 二〇', 'adjacent-page context'],
      prohibited: ['same-title edition collapse', 'same-publisher lineage inference', 'independence promotion', 'semantic authority', 'interpretation readiness', 'production activation', 'parent artifact mutation'],
    },
    evidencePolicy: {
      pageReading: INPUT_PAGE_POLICY,
      lineage: LINEAGE_POLICY,
      readiness: READINESS_POLICY,
      sourceText: 'The JSON preserves a bounded manual visual transcription/locator; it is not a normalized critical edition.',
    },
    witnesses: NLC_WITNESSES.map(item => structuredClone(item)),
    variantRelation: {
      status: 'page_level_relation_closed_edition_lineage_unresolved',
      confirmedAcrossTargetPages: [
        'Both target pages are 卷四, printed folio 二〇, in a headed 起大運法 spread.',
        'Both target pages order the reverse examples as 乙丑男 then 甲子女.',
        'Both target male columns visibly end the first-start token at 五歲運逆行; 丁丑 is not printed in that target male column.',
        'Both target female columns contain 得九日, 三三單九, 三歲運逆行, and 餘倣此.',
      ],
      pageSpecificDifference: {
        femaleDistanceClause: {
          'nlc-1926-12jh004266': '逆數至初一日立春止。',
          'nlc-1929-027032013020556-v2': '逆數至初一日立春。',
        },
        disposition: 'Retain the 止 difference as a direct page variant; do not silently normalize it or use it to infer edition lineage.',
      },
      notConcluded: [
        'The two target records are not counted as independent textual lineages.',
        'The 1926 and 1929 publication statements do not prove the physical copy or colophon of every surviving copy.',
        'Agreement of wording/layout does not prove direct copying or a canonical semantic source.',
      ],
    },
    comparisonOnly: {
      source: '《淵海子平》',
      nlcRecordUrl: 'http://read.nlc.cn/allSearch/searchDetail?searchType=24&showType=1&indexName=data_416&fid=15jh007754',
      scanLocator: 'NLC scan PDF p.51; printed-folio crosswalk unresolved',
      observedLiteral: '五三十五。五歲運逆行丁丑。',
      disposition: 'The 丁丑 token remains a witness-specific 《淵海子平》 observation. It is not transferred into either NLC 《神峰通考》 target page and does not establish lineage or semantic authority.',
    },
    supersedingEvidence: {
      predecessorArtifact: {
        artifactPath: PARENT_ARTIFACT_PATH,
        schemaVersion: 'saju-gemini-v7-parent-adjudication',
        version: '7.0.0',
        artifactByteSha256: PARENT_ARTIFACT_BYTE_SHA256,
        parentArtifactPreserved: true,
      },
      affectedParentReferences: [
        'src/interpretationPrep/sajuGeminiV7ParentAdjudication.js:EXTERNAL_EVIDENCE[ev.A.nlc99036-p50-p51]',
        'src/interpretationPrep/sajuGeminiV7ParentAdjudication.js:PAGE_OBSERVATIONS[obs.A.nlc99036-乙丑男-p51]',
        'claim.A.shenfeng-page-order-and-wording',
      ],
      conflict: 'The parent audit carried 五歲運逆行丁丑 in its nearby worked-example evidence while the NLC 神峰 target locator was being reconciled; the direct NLC 神峰 target pages show that 丁丑 is not printed in the target male column.',
      decision: 'corrected_at_source_specific_literal_and_locator_scope',
      canonicalShenfengRule: 'For NLC 1926 12jh004266 PDF p.21 / folio 二〇 and NLC 1929 027032013020556 volume 10361.0 PDF p.22 / folio 二〇, the bounded male literal is 五歲運逆行 with no appended 丁丑.',
      parentChange: 'No deletion or byte rewrite. Downstream source-specific readers must use this successor overlay for the Shenfeng target locator and retain the v7 parent as historical input.',
    },
    claims: [
      claim('claim.nlc-1926-12jh004266-target-item-and-page', 'kept', 'NLC data_416/12jh004266 is a distinct 1926 first-party record whose official PDF p.21, printed folio 二〇, contains the target 起大運法 page.', ['nlc-1926-12jh004266'], 'The item identity and target page are kept at bounded record/page scope; no copy-level colophon or lineage is inferred.'),
      claim('claim.nlc-1926-13jh001619-not-collapsed', 'kept', 'NLC data_416/13jh001619 is a separate 1926 record and is not the target-bearing item at the inspected PDF p.22 locator.', ['nlc-1926-13jh001619'], 'Same title and publisher do not merge this item with 12jh004266.'),
      claim('claim.nlc-1929-027032013020556-target-item-and-page', 'kept', 'NLC data_511/027032013020556 volume 10361.0 is a distinct 1929 first-party volume object whose official PDF p.22, printed folio 二〇, contains the target page.', ['nlc-1929-027032013020556-v2'], 'The volume object and target page are kept at bounded record/page scope; no edition/lineage equivalence with 1926 is inferred.'),
      claim('claim.shenfeng-target-male-no-dingchou', 'corrected', 'At both directly inspected NLC 神峰 target pages, the male first-start literal is 五歲運逆行; 丁丑 is not printed in the target male column.', ['nlc-1926-12jh004266', 'nlc-1929-027032013020556-v2'], 'This supersedes the parent conflict only for the NLC 神峰 target locator. It does not erase the separate 《淵海子平》 observation 五歲運逆行丁丑.'),
      claim('claim.shenfeng-female-page-variant', 'kept', 'The two target pages retain the female chain 三三單九 → 三歲運逆行 → 餘倣此, with a page-specific 1926 止 versus 1929 omission after 立春.', ['nlc-1926-12jh004266', 'nlc-1929-027032013020556-v2'], 'The 止 difference is not normalized and is not used as an edition or lineage verdict.'),
    ],
    independenceReconciliation: {
      axes: ['physical-item', 'digital-derivation', 'edition/textual-lineage', 'semantic-corroboration'].map(axis => ({
        axis,
        state: 'unresolved',
        countedAsIndependent: false,
        evidenceRefs: ['nlc-1926-12jh004266', 'nlc-1926-13jh001619', 'nlc-1929-027032013020556-v2'],
        missingEdges: [`${axis}:unresolved`],
        note: axis === 'physical-item' ? 'Three NLC record identities are preserved; a record is not a physical-copy collation.' : axis === 'digital-derivation' ? 'Official URLs and byte hashes identify digital objects but do not establish capture independence.' : axis === 'edition/textual-lineage' ? LINEAGE_POLICY : 'No semantic authority is established by page-level convergence.',
      })),
      overallState: 'unresolved',
      canonicalEdges: [],
      rule: LINEAGE_POLICY,
    },
    lineageGraph: {
      edges: [],
      canonicalEdges: [],
      policy: 'No transmission or independent-lineage edge is admitted from this page comparison.',
    },
    blockers: [...REQUIRED_BLOCKERS],
    readiness: {
      availableForInterpretation: false,
      productionActivation: 'blocked',
      semanticAuthority: 'not_established',
      implementationSafeGrounding: 'not_established',
      stableClaimPromotionCount: 0,
      promotionReadyClaimIds: [],
      status: 'blocked',
      reason: 'The successor closes only NLC item/page identity and a source-specific literal conflict; copy-level collation, edition lineage, semantic authority, and production grounding remain open.',
    },
    promotion: {
      status: 'blocked',
      ready: false,
      stableClaimPromotionCount: 0,
      promotionReadyClaimIds: [],
      semanticAuthorityChanged: false,
      productionChanged: false,
      interpretationAvailable: false,
      scope: 'No semantic, calculation, readiness, or production promotion.',
    },
    predecessor: {
      artifactPath: PARENT_ARTIFACT_PATH,
      reference: structuredClone(predecessorReference),
      mutation: 'none',
      preservationRule: 'The parent bytes and its prior claim history remain recoverable and are not overwritten.',
    },
    negativeChecks: {
      allMustReject: true,
      ids: [
        'append-dingchou-to-shenfeng-male-literal',
        'collapse-1926-nlc-record-identities',
        'move-1926-target-to-parent-p20-locator',
        'count-same-layout-as-independent-lineage',
        'promote-lineage-edge',
        'open-semantic-or-production-readiness',
        'mutate-parent-preservation',
      ],
    },
    summary: {
      targetWitnessCount: 2,
      separateNonTargetSameTitleWitnessCount: 1,
      targetPageCount: 2,
      targetPrintedFolios: ['二〇', '二〇'],
      canonicalShenfengMaleFirstDaYunLiteral: '五歲運逆行',
      canonicalShenfengMaleFollowingBranch: null,
      parentConflictDisposition: 'superseded_for_NLC_Shenfeng_target_locator_parent_bytes_preserved',
      readiness: 'blocked',
    },
    contentSha256: null,
  }
  artifact.contentSha256 = contentHash(artifact)
  return artifact
}

export function checkSajuShenfengNlcWitnessAdjudication(artifact) {
  const errors = []
  const fail = value => errors.push(value)
  if (!artifact || typeof artifact !== 'object' || Array.isArray(artifact)) return ['artifact_shape_invalid']
  if (artifact.schemaVersion !== SAJU_SHENFENG_NLC_SCHEMA) fail('schema_version')
  if (artifact.version !== SAJU_SHENFENG_NLC_VERSION) fail('version')
  if (artifact.scope?.sourceOfTruth !== 'Official NLC item records plus the exact official NLC PDF image pages listed in witnesses[].pageAudit.') fail('source_of_truth')
  if (artifact.evidencePolicy?.lineage !== LINEAGE_POLICY) fail('lineage_policy')
  if (artifact.readiness?.availableForInterpretation !== false || artifact.readiness?.productionActivation !== 'blocked' || artifact.readiness?.semanticAuthority !== 'not_established') fail('readiness_open')
  if (artifact.readiness?.stableClaimPromotionCount !== 0 || artifact.readiness?.promotionReadyClaimIds?.length !== 0) fail('readiness_promotion')
  if (artifact.promotion?.ready !== false || artifact.promotion?.semanticAuthorityChanged !== false || artifact.promotion?.productionChanged !== false) fail('promotion_side_effect')

  const witnesses = artifact.witnesses || []
  if (witnesses.length !== 3) fail('witness_count')
  const byId = Object.fromEntries(witnesses.map(item => [item.witnessId, item]))
  const requiredIds = ['nlc-1926-12jh004266', 'nlc-1926-13jh001619', 'nlc-1929-027032013020556-v2']
  if (requiredIds.some(id => !byId[id])) fail('witness_ids')
  const first = byId['nlc-1926-12jh004266']
  const nonTarget = byId['nlc-1926-13jh001619']
  const second = byId['nlc-1929-027032013020556-v2']
  if (first?.itemIdentity?.fid !== '12jh004266' || first?.itemIdentity?.bid !== '48929.0' || first?.pageAudit?.actualPdfPage !== 21 || first?.pageAudit?.printedFolio !== '二〇') fail('1926_target_identity_or_locator')
  if (nonTarget?.itemIdentity?.fid !== '13jh001619' || nonTarget?.itemIdentity?.bid !== '43305.0' || nonTarget?.role !== 'same_title_separate_record_non_target_at_inspected_locator') fail('1926_separate_record_collapse')
  if (nonTarget?.pageAudit?.targetPageStatus !== 'not_admitted_at_inspected_locator') fail('1926_non_target_promoted')
  if (second?.itemIdentity?.fid !== '027032013020556' || second?.itemIdentity?.bid !== '10361.0' || second?.pageAudit?.actualPdfPage !== 22 || second?.pageAudit?.printedFolio !== '二〇') fail('1929_target_identity_or_locator')
  for (const item of [first, second]) {
    if (item?.itemIdentity?.indexName !== 'data_416' && item?.itemIdentity?.indexName !== 'data_511') fail(`unknown_index:${item?.witnessId}`)
    if (item?.pageAudit?.pageHeader?.join('|') !== '神峰通考|卷四') fail(`target_page_header:${item?.witnessId}`)
    if (JSON.stringify(item?.pageAudit?.sectionHeadingsInObservedSpread) !== JSON.stringify(commonHeadings)) fail(`heading_sequence:${item?.witnessId}`)
    if (JSON.stringify(item?.pageAudit?.targetExampleOrder) !== JSON.stringify(['乙丑男', '甲子女'])) fail(`example_order:${item?.witnessId}`)
    if (item?.pageAudit?.maleExample?.firstDaYunLiteral !== '五歲運逆行') fail(`male_literal:${item?.witnessId}`)
    if (item?.pageAudit?.maleExample?.followingBranch?.status !== 'not_printed_in_the_target_male_column' || item?.pageAudit?.maleExample?.followingBranch?.value !== null) fail(`male_following_branch:${item?.witnessId}`)
    if (item?.pageAudit?.femaleExample?.firstDaYunLiteral !== '三歲運逆行' || item?.pageAudit?.femaleExample?.followingBranch !== '餘倣此') fail(`female_chain:${item?.witnessId}`)
    if (item?.pageAudit?.maleExample?.visibleText?.includes('丁丑')) fail(`dingchou_in_shenfeng_page:${item?.witnessId}`)
  }
  if (!byId['nlc-1926-12jh004266']?.pageAudit?.femaleExample?.visibleText?.includes('立春止。')) fail('1926_female_stop_variant')
  if (byId['nlc-1929-027032013020556-v2']?.pageAudit?.femaleExample?.visibleText?.includes('立春止。')) fail('1929_female_stop_variant')
  if (artifact.variantRelation?.status !== 'page_level_relation_closed_edition_lineage_unresolved') fail('variant_relation_scope')
  if (artifact.variantRelation?.pageSpecificDifference?.femaleDistanceClause?.['nlc-1926-12jh004266'] !== '逆數至初一日立春止。') fail('1926_variant_record')
  if (artifact.variantRelation?.pageSpecificDifference?.femaleDistanceClause?.['nlc-1929-027032013020556-v2'] !== '逆數至初一日立春。') fail('1929_variant_record')
  if (artifact.independenceReconciliation?.overallState !== 'unresolved' || artifact.independenceReconciliation?.canonicalEdges?.length !== 0) fail('independence_promoted')
  for (const item of artifact.independenceReconciliation?.axes || []) if (item.countedAsIndependent !== false || item.state !== 'unresolved') fail(`independence_axis:${item.axis}`)
  if (artifact.lineageGraph?.canonicalEdges?.length !== 0 || (artifact.lineageGraph?.edges || []).some(edge => edge.canonicalGraphIncluded === true)) fail('lineage_graph_promoted')
  if (JSON.stringify(artifact.blockers) !== JSON.stringify([...REQUIRED_BLOCKERS])) fail('blockers_changed')
  if (artifact.supersedingEvidence?.predecessorArtifact?.artifactPath !== PARENT_ARTIFACT_PATH || artifact.supersedingEvidence?.predecessorArtifact?.artifactByteSha256 !== PARENT_ARTIFACT_BYTE_SHA256 || artifact.supersedingEvidence?.predecessorArtifact?.parentArtifactPreserved !== true) fail('parent_preservation')
  if (artifact.predecessor?.mutation !== 'none') fail('parent_mutated')
  if (artifact.summary?.canonicalShenfengMaleFirstDaYunLiteral !== '五歲運逆行' || artifact.summary?.canonicalShenfengMaleFollowingBranch !== null || artifact.summary?.parentConflictDisposition !== 'superseded_for_NLC_Shenfeng_target_locator_parent_bytes_preserved') fail('canonical_summary')
  if (artifact.contentSha256 !== contentHash(artifact)) fail('content_hash')
  for (const item of artifact.claims || []) {
    if (item.promotion?.ready !== false || item.promotion?.status !== 'blocked' || item.semanticAuthority !== 'not_established' || item.productionActivation !== 'blocked') fail(`claim_promotion:${item.claimId}`)
  }
  return [...new Set(errors)].sort()
}

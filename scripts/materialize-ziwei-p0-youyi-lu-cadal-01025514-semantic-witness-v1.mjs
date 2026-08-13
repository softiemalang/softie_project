import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, relative, resolve } from 'node:path'

import {
  attachArtifactIdentity,
  buildArtifactIdentity,
  checkHistoricalRepositoryBasis,
} from '../src/artifactIdentity.js'
import {
  calculateTianfuBranch,
  getTianfuModeConvention,
  TIANFU_MODES,
  TIANFU_SERIES_OFFSETS,
  ZIWEI_SERIES_OFFSETS,
} from '../src/ziwei/starPlacementRules.js'
import {
  evaluateSourceMingShen,
  TRADITIONAL_BRANCH_ORDER,
} from '../src/ziwei/mingShenCleanRuleSeedPilot.js'
import { SAJU_SOURCE_DERIVED_ASSET_PATH } from '../src/interpretationPrep/sajuSourceDerivedEvidenceAsset.js'

export const SCHEMA = 'ziwei-p0-youyi-lu-cadal-01025514-semantic-witness-v1'
export const VERDICT = 'complete_ziwei_youyi_lu_semantic_witness_candidate_bounded'
export const MATERIALIZER_VERSION = '1.0.0'
export const BASIS_HEAD = '43253bdab2582fb005e5c4c114f296ced5609335'
export const MATERIALIZER_PATH = 'scripts/materialize-' + SCHEMA + '.mjs'
export const ARTIFACT_DIR = 'artifacts/' + SCHEMA
export const ARTIFACT_PATH = ARTIFACT_DIR + '/complete.json'
export const ROOT = resolve(new URL('..', import.meta.url).pathname)

export const PREDECESSOR_INSTITUTIONAL = 'artifacts/ziwei-p0-toyo-vii-3-157-institutional-evidence-v1/complete.json'
export const PREDECESSOR_SOURCE_IDENTITY = 'artifacts/ziwei-p0-claim-source-identity-frontier-v1/complete.json'
export const PREDECESSOR_TOYO = 'artifacts/ziwei-p0-toyo-1646-extended-observation-v0/complete.json'
export const PREDECESSOR_FRONTIER = 'artifacts/ziwei-p0-local-frontier-reconciliation-v1/complete.json'
export const PREDECESSOR_FIELD_KIT = 'artifacts/ziwei-p0-evidence-acquisition-field-kit-v1/complete.json'
export const PREDECESSOR_TIANFU_REPRESENTATION = 'artifacts/ziwei-tianfu-representation-search-v1/complete.json'
export const PREDECESSOR_TIANFU_SOURCE_EVIDENCE = 'artifacts/ziwei-tianfu-representation-search-v1/source-evidence.json'
export const PREDECESSOR_TIANFU_INTEGRATED = 'artifacts/ziwei-tianfu-placement-discrepancy-analysis-v0/integrated.json'

export const SOURCE_ID = 'src-youyi-lu-cadal-01025514-1883'
export const SOURCE_DJVU_SHA1 = '0ccb501b8fa86358ec1cae34dca4d56df6a1fbd2'
export const SOURCE_DJVU_SHA256 = '761a9827a1fe0df8f1aa1e15317b1eb18c528892750fa618f7ed97a5897535ba'
export const SOURCE_DJVU_BYTES = 7368126
export const SOURCE_DJVU_PAGES = 178
export const COMMONS_BASE = 'CADAL01025514_%E6%98%A5%E5%9C%A8%E5%A0%82%E5%85%A8%E6%9B%B8%C2%B7%E6%B8%B8%E8%97%9D%E9%8C%84.djvu'
export const COMMONS_FILE_URL = 'https://upload.wikimedia.org/wikipedia/commons/3/3f/' + COMMONS_BASE
export const COMMONS_THUMB_URL_BASE = 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/' + COMMONS_BASE
export const CADAL_URL = 'https://cadal.edu.cn/cardpage/bookCardPage?ssno=01025514'
export const CTEXT_URL = 'https://ctext.org/wiki.pl?chapter=299125&if=gb'
export const CINII_1883_URL = 'https://ci.nii.ac.jp/ncid/BB19945538'
export const CINII_1871_URL = 'https://ci.nii.ac.jp/ncid/BD19656670'

const PAGE_RENDER_SHA256 = Object.freeze({
  130: 'a0a7a185b795225a3b206ac828cc761e046b6028939093b2139835eae9311206',
  131: '05e4d55ad718229036a636ac36da898605a48fd4f40073a8d9c2293845df517f',
  136: '4f20ac6bbf906e1ecfcc2e08e78b4f9f3e5710617eef3d49714dffd153b2b64b',
  139: '22ad4198302e8ffbbdb913ee813f5f6bbb0efb9da41591617719cb764fa9621a',
  140: '556a53e005ad6debb19fef94d939c263349e6b46678df482e91d70a536f295a6',
})

const SCAN_BOUNDARY_REVIEW = Object.freeze({
  reviewedPages: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 177, 178],
  renderWidth: 1920,
  surfaces: [
    {
      scanPage: 1,
      commonsRenderSha256: '7f6332ae04d3569e205f51efcef52d3a659552b6aa4665ae22531eaf4b0f69f3',
      observation: 'blank scan leaf; no title-page text or imprint visible',
    },
    {
      scanPage: 2,
      commonsRenderSha256: '514e9b1e8dbf514f98d3eb148a6f2920d2a90b660c00524d8760e72ccdc43e77',
      observation: 'printed text begins; no title-page or imprint surface visible',
    },
    {
      scanPage: 177,
      commonsRenderSha256: 'c5cc4d329d0f0dd99757e246668a0b78d9ff4763859b49c259cbbb9a64253fac',
      observation: 'printed text and end seal; no colophon or imprint surface visible',
    },
    {
      scanPage: 178,
      commonsRenderSha256: '7f6332ae04d3569e205f51efcef52d3a659552b6aa4665ae22531eaf4b0f69f3',
      observation: 'blank scan leaf; no colophon text visible',
    },
  ],
  titlePageObserved: false,
  colophonObserved: false,
  conclusion: 'The available 178-page digital scan was checked at its front and back boundary; a title page and colophon were not observed. This does not prove that the bound physical copy never contained either leaf.',
})

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
]

const INPUT_PATHS = [
  PREDECESSOR_INSTITUTIONAL,
  PREDECESSOR_SOURCE_IDENTITY,
  PREDECESSOR_TOYO,
  PREDECESSOR_FRONTIER,
  PREDECESSOR_FIELD_KIT,
  PREDECESSOR_TIANFU_REPRESENTATION,
  PREDECESSOR_TIANFU_SOURCE_EVIDENCE,
  PREDECESSOR_TIANFU_INTEGRATED,
  'src/artifactIdentity.js',
  'src/interpretationPrep/sajuSourceDerivedEvidenceAsset.js',
  'src/ziwei/starPlacementRules.js',
  'src/ziwei/mingShenCleanRuleSeedPilot.js',
  MATERIALIZER_PATH,
]

const CLAIM_IDS = Object.freeze({
  palaceNameBranchOrdinal: 'claim-palace-name-branch-ordinal',
  mingShenCoordinateFrame: 'claim-ming-shen-coordinate-frame',
  palaceDiagramSemantics: 'claim-12-palace-diagram-semantics',
  ziweiPlacement: 'claim-major-star-placement-ziwei',
  tianfuPlacement: 'claim-major-star-placement-tianfu',
  tianfuAnchorDirection: 'claim-tianfu-anchor-direction',
  tianfuRelation: 'claim-tianfu-placement',
  tianfuRotation06: 'claim-tianfu-rotation06-semantic',
})

const CLAIM_OBSERVATIONS = Object.freeze({
  [CLAIM_IDS.palaceNameBranchOrdinal]: ['obs-youyi-p130-ming-shen-palace-order', 'obs-youyi-p131-branch-relations'],
  [CLAIM_IDS.mingShenCoordinateFrame]: ['obs-youyi-p130-ming-shen-palace-order'],
  [CLAIM_IDS.palaceDiagramSemantics]: ['obs-youyi-p130-ming-shen-palace-order', 'obs-youyi-p131-branch-relations'],
  [CLAIM_IDS.ziweiPlacement]: ['obs-youyi-p139-tianfu-pair-map', 'obs-youyi-p140-major-star-series'],
  [CLAIM_IDS.tianfuPlacement]: ['obs-youyi-p136-tianfu-diagonal-anchor', 'obs-youyi-p139-tianfu-pair-map'],
  [CLAIM_IDS.tianfuAnchorDirection]: ['obs-youyi-p136-tianfu-diagonal-anchor', 'obs-youyi-p139-tianfu-pair-map'],
  [CLAIM_IDS.tianfuRelation]: ['obs-youyi-p136-tianfu-diagonal-anchor', 'obs-youyi-p139-tianfu-pair-map'],
  [CLAIM_IDS.tianfuRotation06]: ['obs-youyi-p136-tianfu-diagonal-anchor', 'obs-youyi-p139-tianfu-pair-map'],
})

const YOUYI_TIANFU_MAP = Object.freeze([
  { ziwei: '子', tianfu: '辰', basis: '推之; 子與辰對' },
  { ziwei: '丑', tianfu: '卯', basis: 'page139 worked example; 其斜對卯宮' },
  { ziwei: '寅', tianfu: '寅', basis: '推之; 寅申二宮則紫微天府同宮' },
  { ziwei: '卯', tianfu: '丑', basis: 'page139 worked example; 其斜對丑宮' },
  { ziwei: '辰', tianfu: '子', basis: '推之; 子與辰對' },
  { ziwei: '巳', tianfu: '亥', basis: '推之; 亥與巳對' },
  { ziwei: '午', tianfu: '戌', basis: '推之; 戌與午對' },
  { ziwei: '未', tianfu: '酉', basis: '推之; 酉與未對' },
  { ziwei: '申', tianfu: '申', basis: '推之; 寅申二宮則紫微天府同宮' },
  { ziwei: '酉', tianfu: '未', basis: '推之; 酉與未對' },
  { ziwei: '戌', tianfu: '午', basis: '推之; 戌與午對' },
  { ziwei: '亥', tianfu: '巳', basis: '推之; 亥與巳對' },
])

const RAW_VISIBLE_TEXT = Object.freeze({
  130: '凡以紫微斗數推人年命先安命宮次安身宮假如二月辰時生人二月建卯即於卯宮起子時逆數至辰時在亥宮為命宮順數至辰時在未宮為身宮有身命同一宮者如子時生人從月建起子時身命同宮又如午時生人從月建順逆數至午時皆在一宮亦身命同宮乃逆行而布十二宮十二宮者一命宮二兄弟宮三夫妻宮四子息宮五財帛宮六疾厄宮七遷移宮八奴僕宮九官祿宮十田宅宮十一福德宮十二父母宮視命宮所在而逆布之如命立子宮則亥為兄弟宮戌為夫妻宮命立丑宮則子為兄弟宮亥為夫妻宮餘視此',
  131: '有對衝之宮有合照之宮十二宮對衝子午丑未寅申卯酉辰戌巳亥十二宮三合寅午戌巳酉丑申子辰亥卯未如命立子宮則午為對申辰為合如命立午宮則子為對寅戌為合餘視此',
  136: '而於五局中求所生之日日在何宮即於是宮安紫微星於其斜對之宮安天府星',
  139: '假如正月初三日生人命屬金局例三日金局在丑宮即於丑宮安紫微星其斜對卯宮安天府星又如初六日生人命屬木局例六日木局在卯宮即於卯宮安紫微星其斜對丑宮安天府星推之子與辰對亥與巳對戌與午對酉與未對亦如之惟生日在寅申二宮則紫微天府同宮',
  140: '乃依紫微天府而布南斗北斗之星如紫微在寅宮則逆行丑宮安天機隔子宮一位亥宮安太陽戌宮安武曲酉宮安天同又隔申未二位至午宮安廉貞如天府在寅宮則順行卯宮安太陰辰宮安貪狼巳宮安巨門午宮安天相未宮安天梁申宮安七殺隔酉戌亥三位至子宮安破軍',
})

const NORMALIZED_TRANSCRIPTION = Object.freeze({
  130: '凡以紫微斗數推人年命，先安命宮，次安身宮。假如二月辰時生人，二月建卯，即於卯宮起子時，逆數至辰時在亥宮，為命宮，順數至辰時在未宮，為身宮。乃逆行而布十二宮；命立子宮，則亥為兄弟宮、戌為夫妻宮；命立丑宮，則子為兄弟宮、亥為夫妻宮。',
  131: '有對衝之宮，有合照之宮。十二宮對衝：子午、丑未、寅申、卯酉、辰戌、巳亥。十二宮三合：寅午戌、巳酉丑、申子辰、亥卯未；命立子宮，則午為對、申辰為合；命立午宮，則子為對、寅戌為合。',
  136: '而於五局中求所生之日，日在何宮，即於是宮安紫微星，於其斜對之宮安天府星。',
  139: '假如正月初三日生人，命屬金局，例三日金局在丑宮，即於丑宮安紫微星，其斜對卯宮安天府星。又如初六日生人，命屬木局，例六日木局在卯宮，即於卯宮安紫微星，其斜對丑宮安天府星。推之，子與辰對，亥與巳對，戌與午對，酉與未對，亦如之；惟生日在寅、申二宮，則紫微、天府同宮。',
  140: '乃依紫微天府而布南斗北斗之星。如紫微在寅宮，則逆行：丑宮安天機、亥宮安太陽、戌宮安武曲、酉宮安天同、至午宮安廉貞。如天府在寅宮，則順行：卯宮安太陰、辰宮安貪狼、巳宮安巨門、午宮安天相、未宮安天梁、申宮安七殺、至子宮安破軍。',
})

const DOES_NOT_ESTABLISH = [
  'the 1883 scan is the original printing or the earliest edition of 游藝錄',
  'textual transmission independence from Nanbei, Nanyang, NARA, or the existing Toyo candidate',
  'a complete source-authoritative palace name to branch to physical-slot/ordinal binding',
  'a production-safe Tianfu convention or semantic identity for rotation-06',
  'a complete calendar/time oracle, Four Transformations table, or 命主/身主 source rule',
  'image-level repository reuse permission from a public-domain label alone',
  'Ziwei P0 readiness, interpretation grounding, activation, or production behavior',
]

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const sortValue = value => Array.isArray(value)
  ? value.map(sortValue)
  : value && typeof value === 'object'
    ? Object.fromEntries(Object.keys(value).sort().map(key => [key, sortValue(value[key])]))
    : value
export const canonicalJson = value => JSON.stringify(sortValue(value), null, 2) + '\n'

const git = (root, args) => execFileSync(
  'git',
  ['-c', 'core.fsmonitor=false', ...args],
  { cwd: root, encoding: 'utf8' },
).trim()

const readJson = (root, path) => JSON.parse(readFileSync(resolve(root, path), 'utf8'))
const fileSha256 = (root, path) => sha256(readFileSync(resolve(root, path)))
const unique = values => [...new Set(values)]
const requireValue = (condition, message) => {
  if (!condition) throw new Error(message)
}

function repository(root) {
  return {
    branch: git(root, ['branch', '--show-current']),
    currentHead: git(root, ['rev-parse', 'HEAD']),
    originMainHead: git(root, ['rev-parse', 'origin/main']),
  }
}

function renderUrl(page) {
  return COMMONS_THUMB_URL_BASE + '/page' + page + '-3840px-' + COMMONS_BASE + '.jpg'
}

function pageLocator(page) {
  return {
    scanPage: page,
    cadalDigitalPage: page,
    printedFolio: null,
    printedFolioStatus: 'not_asserted; scan folio was not used as an invented locator',
    commonsDjvuPage: page,
    commonsRenderUrl: renderUrl(page),
    reviewedRenderSha256: PAGE_RENDER_SHA256[page],
    ctextLocator: {
      provider: 'Chinese Text Project',
      url: CTEXT_URL,
      chapterTitle: '春在堂全書·游藝錄v5紫微斗數篇',
      libraryFile: '192852',
      page,
      role: 'locator_only',
      canonicalText: false,
    },
  }
}

function sourceLineage() {
  return {
    sourceId: SOURCE_ID,
    sourceKind: 'external_public_digital_scan_of_historical_printed_work',
    role: 'new semantic-witness candidate; bounded direct scan surface',
    work: {
      title: '春在堂全書·游藝錄',
      author: '(清)俞樾',
      section: '游藝錄五·紫微斗數篇',
      chapterPageStart: 130,
      nextChapterPageStart: 166,
      chapterPageRange: 'digital scan pages 130-165; catalog chapter boundary',
    },
    edition: {
      catalogDate: '清光緒九年(1883)',
      catalogDateSource: 'CADAL/Tsinghua metadata and CiNii 1883 record',
      publisher: 'not stated in the inspected CADAL metadata beyond the source record',
      physicalCopyTitlePageReviewed: true,
      physicalCopyTitlePagePresent: false,
      colophonReviewed: true,
      colophonPresent: false,
      printedFolioBindingClosed: false,
      identityStatus: 'digital_resource_identity_confirmed; printed_copy_identity_and_transmission_lineage_not_fully_closed',
    },
    scanBoundaryReview: SCAN_BOUNDARY_REVIEW,
    repositories: {
      cADAL: {
        institution: '清華大學',
        identifier: '01025514',
        url: CADAL_URL,
        metadataObserved: ['title', 'creator', 'date', 'contributor', '178-page count', 'chapter start pages'],
      },
      commons: {
        hostedFileUrl: COMMONS_FILE_URL,
        derivativeRole: 'Commons-hosted copy of the CADAL/Tsinghua DjVu resource',
        filePageMetadataObserved: ['author', 'title', '1883 date', '178 pages', 'dimensions', 'public-domain mark'],
      },
      cinii1883: {
        url: CINII_1883_URL,
        record: '游藝録 6卷; (清)兪樾 [撰]; [光緒9 (1883)]',
        physicalBibliography: '23.4×15.1cm; 13,27,18,6,18,6丁; 10 lines/21 characters',
      },
      earlierEditionCandidate: {
        url: CINII_1871_URL,
        record: '游藝録 6卷; 同治10 [1871]',
        relationship: 'same-work earlier-edition candidate; direct text/leaf comparison not performed',
        lineageStatus: 'unresolved; not merged and not admitted as independent corroboration',
      },
    },
    sourceFile: {
      fileName: 'CADAL01025514_春在堂全書·游藝錄.djvu',
      format: 'DjVu multiple page document',
      byteLength: SOURCE_DJVU_BYTES,
      pageCount: SOURCE_DJVU_PAGES,
      dimensions: '3196×5594',
      sha1: SOURCE_DJVU_SHA1,
      sha256: SOURCE_DJVU_SHA256,
      byteIdentity: 'directly hashed from the downloaded source DjVu bytes outside the repository',
      storedInGit: false,
      acquiredOutsideMaterializer: true,
      materializerNetworkUsed: false,
    },
    locatorPolicy: {
      exactLocator: 'Commons DjVu page index + CADAL digital page + CText library file/page',
      printedFolio: 'not asserted; no physical folio was invented',
      semanticPageRendersReviewed: [130, 131, 136, 139, 140],
    },
    ocrPolicy: {
      provider: 'Chinese Text Project OCR/text layer',
      role: 'locator_only',
      canonicalForClaims: false,
      scanVisualReviewRequired: true,
      observedLocatorCorrections: ['日 versus OCR 曰', '宮 versus OCR 官', '戌 versus OCR 戊', '寅 versus OCR 開', '酉 versus OCR 西'],
    },
    rights: {
      commonsFilePageMark: 'Public Domain Mark reported on the Commons file page',
      sourceImageReuse: 'not automatically granted by catalog access or public-domain label; human/policy review remains required',
      sourceImagesStoredInGit: false,
    },
    physicalWitnessStatus: 'distinct historical-work scan candidate; independent physical/textual lineage not admitted',
    independence: 'repository/file identity is distinct from existing P0 sources, but 1883-to-1871 and cross-corpus transmission independence is unresolved',
    lineage: '1883 catalog/scan identity is bounded; no inference from 1871 catalog record to exact textual continuity',
    authority: 'direct visual scan observations support bounded text surfaces; source authority and semantic authority remain unestablished',
    storedInGit: false,
  }
}

function commonObservation(source, affectedClaimIds, blockerIds) {
  return {
    sourceIds: [SOURCE_ID],
    evidenceSourceId: SOURCE_ID,
    physicalWitnessSourceId: SOURCE_ID,
    researcherDirectObservation: true,
    directObservationStatus: 'bounded_direct_visual_review_of_temporary_scan_render',
    transcriptionRole: 'direct_scan_visual_review; CText OCR locator only',
    lineageStatus: 'digital_scan_identity_bounded; historical textual lineage not observed',
    independenceStatus: 'distinct_scan_candidate; textual_transmission_independence_unresolved',
    authorityStatus: 'bounded_direct_scan_surface; source_authority_and_semantic_authority_not_established',
    affectedClaimIds,
    blockerIds,
    doesNotEstablish: DOES_NOT_ESTABLISH,
    source,
  }
}

function buildEvidence(source) {
  const identityObservation = {
    ...commonObservation(source, [], ['blocker-source-identity-unresolved', 'blocker-image-reuse-rights']),
    observationId: 'obs-youyi-cadal-01025514-source-file-identity',
    observationKind: 'external_scan_file_and_catalog_identity',
    directObservationStatus: 'source-file-byte-hash_and_catalog-metadata_review',
    researcherDirectObservation: false,
    surface: 'title/author/date/repository identity, source DjVu bytes, 178-page structure, and v5 chapter boundary',
    locator: {
      commonsFileUrl: COMMONS_FILE_URL,
      cadalUrl: CADAL_URL,
      cinii1883Url: CINII_1883_URL,
      sourceIdentifier: '01025514',
    },
    facts: [
      'The inspected digital resource identifies 春在堂全書·游藝錄 by (清)俞樾 and has 178 pages.',
      'CADAL metadata places 游藝錄五 at digital page 130 and 游藝錄六 at digital page 166.',
      'The exact downloaded DjVu bytes hash to the recorded SHA-1 and SHA-256; the bytes are not stored in Git.',
      'Commons renders for scan pages 1-10 and 177-178 were visually checked at the scan boundary: page 1 and page 178 are blank leaves, page 2 begins printed text, and page 177 ends with printed text and a seal; no title page or colophon was observed.',
      'The 1871 CiNii record is retained as an earlier-edition lineage candidate, not silently merged or treated as an independent semantic witness.',
    ],
    whatItEstablishes: [
      'bounded identity of the external digital scan resource',
      'a reproducible page locator for the five visually reviewed pages',
      'a distinct physical-witness candidate record without independent admission',
    ],
  }

  const page130 = {
    ...commonObservation(source, [CLAIM_IDS.palaceNameBranchOrdinal, CLAIM_IDS.mingShenCoordinateFrame, CLAIM_IDS.palaceDiagramSemantics], ['blocker-palace-semantic-identity', 'blocker-direct-rule-absent']),
    observationId: 'obs-youyi-p130-ming-shen-palace-order',
    observationKind: 'direct_scan_ming_shen_traversal_and_named_palace_order',
    surface: '命宮/身宮 example, 12 named palaces, and reverse named-palace allocation',
    locator: pageLocator(130),
    rawVisibleText: RAW_VISIBLE_TEXT[130],
    normalizedTranscription: NORMALIZED_TRANSCRIPTION[130],
    facts: [
      'For 二月辰時, the text starts from the 卯 month-building palace, counts 子時, places 命宮 at 亥 and 身宮 at 未.',
      'The named palace sequence is 命宮, 兄弟宮, 夫妻宮, 子息宮, 財帛宮, 疾厄宮, 遷移宮, 奴僕宮, 官祿宮, 田宅宮, 福德宮, 父母宮.',
      'After 命宮 is placed, the text says 乃逆行而布十二宮; 命立子宮 gives 兄弟宮 at 亥 and 夫妻宮 at 戌, while 命立丑宮 gives 兄弟宮 at 子 and 夫妻宮 at 亥.',
    ],
    deterministicRelation: {
      evaluatorPath: 'src/ziwei/mingShenCleanRuleSeedPilot.js',
      input: { lunarMonth: 2, hourBranch: '辰' },
      sourceEvaluatorResult: evaluateSourceMingShen({ lunarMonth: 2, hourBranch: '辰' }),
      relationClass: 'same-source-derived_evaluator_matches_bounded_scan_example; not an independent oracle',
    },
    whatItEstablishes: [
      'bounded direct observation of the named-palace order and reverse traversal wording',
      'one explicit 命宮/身宮 worked example',
    ],
  }

  const page131 = {
    ...commonObservation(source, [CLAIM_IDS.palaceNameBranchOrdinal, CLAIM_IDS.palaceDiagramSemantics], ['blocker-palace-semantic-identity']),
    observationId: 'obs-youyi-p131-branch-relations',
    observationKind: 'direct_scan_opposition_and_triple_branch_relations',
    surface: '十二宮對衝 and 十二宮三合 branch sets',
    locator: pageLocator(131),
    rawVisibleText: RAW_VISIBLE_TEXT[131],
    normalizedTranscription: NORMALIZED_TRANSCRIPTION[131],
    facts: [
      'The text explicitly lists opposites as 子午, 丑未, 寅申, 卯酉, 辰戌, 巳亥.',
      'The text explicitly lists triple groups as 寅午戌, 巳酉丑, 申子辰, 亥卯未.',
      'Worked examples state that 命立子宮 has 午 as 對 and 申、辰 as 合; 命立午宮 has 子 as 對 and 寅、戌 as 合.',
    ],
    deterministicRelation: {
      branchOrder: TRADITIONAL_BRANCH_ORDER,
      relationClass: 'direct_branch_token_relation; physical-slot and ordinal identity remain open',
    },
    whatItEstablishes: ['bounded direct branch-token relations used by the source surface'],
  }

  const page136 = {
    ...commonObservation(source, [CLAIM_IDS.tianfuAnchorDirection, CLAIM_IDS.tianfuRelation, CLAIM_IDS.tianfuPlacement, CLAIM_IDS.tianfuRotation06], ['blocker-tianfu-raw-formula-contradiction', 'blocker-tianfu-rotation06-semantic-authority', 'blocker-direct-rule-absent']),
    observationId: 'obs-youyi-p136-tianfu-diagonal-anchor',
    observationKind: 'direct_scan_tianfu_diagonal_anchor_statement',
    surface: '紫微/天府 placement relation wording',
    locator: pageLocator(136),
    rawVisibleText: RAW_VISIBLE_TEXT[136],
    normalizedTranscription: NORMALIZED_TRANSCRIPTION[136],
    facts: [
      'The source says to find the palace of the birth day in the five bureaus, place 紫微 there, and place 天府 at its 斜對之宮.',
      'The word 斜對 is a source relation token; no modulo formula or production enum is printed in this observation.',
    ],
    whatItEstablishes: ['bounded direct source wording for a diagonal/opposite Tianfu relation'],
  }

  const page139 = {
    ...commonObservation(source, [CLAIM_IDS.ziweiPlacement, CLAIM_IDS.tianfuAnchorDirection, CLAIM_IDS.tianfuRelation, CLAIM_IDS.tianfuPlacement, CLAIM_IDS.tianfuRotation06], ['blocker-tianfu-raw-formula-contradiction', 'blocker-tianfu-rotation06-semantic-authority', 'blocker-direct-rule-absent']),
    observationId: 'obs-youyi-p139-tianfu-pair-map',
    observationKind: 'direct_scan_tianfu_worked_pairs_and_branch_map',
    surface: '紫微/天府 worked examples, branch-pair continuation, and same-palace exceptions',
    locator: pageLocator(139),
    rawVisibleText: RAW_VISIBLE_TEXT[139],
    normalizedTranscription: NORMALIZED_TRANSCRIPTION[139],
    facts: [
      'The source gives 紫微丑 -> 天府卯 and 紫微卯 -> 天府丑 as worked examples.',
      'It continues with 子與辰對, 亥與巳對, 戌與午對, 酉與未對, and says the same relation applies; it states that 寅 and 申 are same-palace exceptions.',
      'The resulting 12-row surface map is recorded as source text normalization, not as a production formula.',
    ],
    sourceSurfaceMap: YOUYI_TIANFU_MAP,
    deterministicRelation: {
      sourceAlignedConvention: getTianfuModeConvention(TIANFU_MODES.SOURCE_ALIGNED),
      sourceAlignedFormulaMatchesAllRecordedRows: YOUYI_TIANFU_MAP.every(row => calculateTianfuBranch(row.ziwei, { tianfuMode: TIANFU_MODES.SOURCE_ALIGNED }) === row.tianfu),
      legacyConvention: getTianfuModeConvention(TIANFU_MODES.LEGACY),
      legacyFormulaMatchCount: YOUYI_TIANFU_MAP.filter(row => calculateTianfuBranch(row.ziwei, { tianfuMode: TIANFU_MODES.LEGACY }) === row.tianfu).length,
      relationClass: 'source_surface_map_matches_source_aligned_numeric_adapter; semantic identity and authority remain blocked',
    },
    whatItEstablishes: [
      'bounded direct source map for the listed branch-token relation',
      'the source surface uses 斜對 and same-palace wording rather than a modulo formula',
    ],
  }

  const page140 = {
    ...commonObservation(source, [CLAIM_IDS.ziweiPlacement, CLAIM_IDS.tianfuPlacement], ['blocker-direct-rule-absent']),
    observationId: 'obs-youyi-p140-major-star-series',
    observationKind: 'direct_scan_ziwei_and_tianfu_series_direction_example',
    surface: '南斗北斗 star-series directions and worked branch placements',
    locator: pageLocator(140),
    rawVisibleText: RAW_VISIBLE_TEXT[140],
    normalizedTranscription: NORMALIZED_TRANSCRIPTION[140],
    facts: [
      'The source says the 南斗北斗 stars are laid out from 紫微 and 天府.',
      'With 紫微 at 寅, the listed 紫微 series moves in reverse: 天機丑, 太陽亥, 武曲戌, 天同酉, 廉貞午.',
      'With 天府 at 寅, the listed 天府 series moves forward: 太陰卯, 貪狼辰, 巨門巳, 天相午, 天梁未, 七殺申, 破軍子.',
    ],
    deterministicRelation: {
      ziweiSeriesOffsets: ZIWEI_SERIES_OFFSETS,
      tianfuSeriesOffsets: TIANFU_SERIES_OFFSETS,
      baseBranch: '寅',
      currentRuleSurfaceMatchesWorkedExample: true,
      relationClass: 'bounded worked-example_to_current_offset-surface comparison; not source-authority promotion',
    },
    whatItEstablishes: [
      'direct observation of reverse versus forward series direction in this worked example',
      'bounded branch placements for the listed stars',
    ],
  }

  return {
    source,
    observations: [identityObservation, page130, page131, page136, page139, page140],
    reportedNonObservations: [
      'No printed folio/丁 was asserted; all locators use digital scan page indices and crosswalks.',
      'The scan front/back boundary was directly reviewed; no title page or colophon was observed in the available 178-page sequence. This is not proof of physical nonexistence.',
      'No direct comparison with the 1871 edition was performed.',
      'No OCR text was treated as canonical; CText was locator-only.',
      'No source-authority, independent-lineage, production, readiness, or activation promotion was performed.',
    ],
  }
}

function readPredecessors(root) {
  const institutional = readJson(root, PREDECESSOR_INSTITUTIONAL)
  const sourceIdentity = readJson(root, PREDECESSOR_SOURCE_IDENTITY)
  const toyo = readJson(root, PREDECESSOR_TOYO)
  const frontier = readJson(root, PREDECESSOR_FRONTIER)
  const fieldKit = readJson(root, PREDECESSOR_FIELD_KIT)
  requireValue(institutional.graphImpact?.successor?.claimCount === 30, 'unexpected_predecessor_claim_count')
  requireValue(institutional.graphImpact?.successor?.sourceCount === 14, 'unexpected_predecessor_source_count')
  requireValue(institutional.graphImpact?.successor?.observationCount === 44 && institutional.graphImpact?.successor?.relationCount === 134, 'unexpected_predecessor_observation_relation_count')
  requireValue(institutional.graphImpact?.successor?.blockerCount === 11, 'unexpected_predecessor_blocker_count')
  requireValue(institutional.sourceLineage?.physicalWitnessCount === 1 && institutional.sourceLineage?.independentPhysicalWitnessesAdmitted === 0, 'unexpected_predecessor_witness_boundary')
  requireValue(institutional.readinessImpact?.readiness === 'not_safe_to_start' && institutional.readinessImpact?.grounding === 'blocked' && institutional.readinessImpact?.activation === 'experimental_only', 'unexpected_predecessor_readiness_boundary')
  requireValue(institutional.readinessImpact?.rotation06 === 'representation_only', 'unexpected_predecessor_rotation_boundary')
  requireValue(frontier.graphImpact?.successor?.observationCount === 40 && frontier.graphImpact?.successor?.relationCount === 130, 'unexpected_frontier_counts')
  requireValue(sourceIdentity.claimSourceMatrix?.length === 30, 'unexpected_claim_matrix_count')
  requireValue(toyo.impact?.additiveCoverage?.observationCount === 34 && toyo.impact?.additiveCoverage?.relationCount === 124, 'unexpected_toyo_counts')
  requireValue(fieldKit.currentAudit?.graph?.claims === 30 && fieldKit.currentAudit?.graph?.blockers === 11, 'unexpected_field_kit_boundary')
  return { institutional, sourceIdentity, toyo, frontier, fieldKit }
}

function buildLocalComparison(root) {
  const representation = readJson(root, PREDECESSOR_TIANFU_REPRESENTATION)
  const sourceEvidence = readJson(root, PREDECESSOR_TIANFU_SOURCE_EVIDENCE)
  const integrated = readJson(root, PREDECESSOR_TIANFU_INTEGRATED)
  const representationRows = representation.rows || []
  const integratedRelations = integrated.relationResults || []
  requireValue(representationRows.length === 150, 'unexpected_tianfu_representation_rows')
  requireValue(integrated.rows?.length === 150, 'unexpected_tianfu_integrated_rows')
  const representationMap = new Map()
  for (const row of representationRows) {
    if (!representationMap.has(row.source.ziweiBranch)) representationMap.set(row.source.ziweiBranch, row.source.tianfuBranch)
  }
  const representationMapMatches = YOUYI_TIANFU_MAP.every(row => representationMap.get(row.ziwei) === row.tianfu)
  const identityRelation = integratedRelations.find(row => row.candidateId === 'identity')
  const rotationRelation = integratedRelations.find(row => row.candidateId === 'rotation-06')
  requireValue(identityRelation?.matchCount === 0 && identityRelation?.mismatchCount === 150, 'unexpected_tianfu_identity_relation')
  requireValue(rotationRelation?.matchCount === 150 && rotationRelation?.mismatchCount === 0, 'unexpected_tianfu_rotation_relation')
  const mingDiagram = sourceEvidence.transcription?.ming?.locators?.find(item => item.section === '安天府圖')
  const nanbeiTable = sourceEvidence.transcription?.nanbei?.table
  const nanbeiMap = (nanbeiTable?.cells || []).map(cell => ({
    ziwei: cell.glyphs?.紫微,
    tianfu: cell.glyphs?.天府,
  }))
  requireValue(sourceEvidence.sourceIdentity?.ming?.sha256 === '04e184c4a52cb042dc885c6ccc9135d94ab25de62007506198ee979a33e66bfc', 'unexpected_ming_source_identity')
  requireValue(sourceEvidence.sourceIdentity?.nanbei?.sha256 === '4786a94ab454acdabf9716d7c0db4756dbcbde99a88bc45fda254863c1961023', 'unexpected_nanbei_source_identity')
  requireValue(mingDiagram?.pdfPage === 172 && mingDiagram.diagram?.anchors?.explicit?.ziwei === '丑' && mingDiagram.diagram?.anchors?.explicit?.tianfu === '卯' && JSON.stringify(mingDiagram.diagram?.anchors?.samePalaces) === JSON.stringify(['寅', '申']), 'unexpected_ming_tianfu_diagram_surface')
  requireValue(nanbeiMap.length === 12, 'unexpected_nanbei_tianfu_map_rows')
  const nanbeiMapMatchCount = nanbeiMap.filter((row, index) => row.ziwei === YOUYI_TIANFU_MAP[index].ziwei && row.tianfu === YOUYI_TIANFU_MAP[index].tianfu).length
  const sourceAlignedMapComparison = YOUYI_TIANFU_MAP.map(row => ({
    ziwei: row.ziwei,
    youyiTianfu: row.tianfu,
    sourceAlignedAdapterTianfu: calculateTianfuBranch(row.ziwei, { tianfuMode: TIANFU_MODES.SOURCE_ALIGNED }),
    legacyProductionTianfu: calculateTianfuBranch(row.ziwei, { tianfuMode: TIANFU_MODES.LEGACY }),
  }))
  return {
    palace: {
      evaluatorPath: 'src/ziwei/mingShenCleanRuleSeedPilot.js',
      exampleInput: { lunarMonth: 2, hourBranch: '辰' },
      exampleResult: evaluateSourceMingShen({ lunarMonth: 2, hourBranch: '辰' }),
      sourceExampleMatch: true,
      relationClass: 'deterministic calculation fact; not an independent source oracle',
    },
    tianfu: {
      youyiSurfaceMap: YOUYI_TIANFU_MAP,
      sourceAlignedMapComparison,
      sourceAlignedMapMatchCount: sourceAlignedMapComparison.filter(row => row.youyiTianfu === row.sourceAlignedAdapterTianfu).length,
      legacyProductionMapMatchCount: sourceAlignedMapComparison.filter(row => row.youyiTianfu === row.legacyProductionTianfu).length,
      existingRepresentationSurfaceMapMatches: representationMapMatches,
      existingRepresentationRows: 150,
      referenceSurfaces: {
        mingMingEditionAnTianfuDiagram: {
          sourceArtifact: PREDECESSOR_TIANFU_SOURCE_EVIDENCE,
          sourceId: 'ming',
          sourceSha256: sourceEvidence.sourceIdentity.ming.sha256,
          locator: 'PDF page 172 / 安天府圖',
          explicitAnchor: { ziwei: mingDiagram.diagram.anchors.explicit.ziwei, tianfu: mingDiagram.diagram.anchors.explicit.tianfu },
          samePalaceAnchors: mingDiagram.diagram.anchors.samePalaces,
          youyiExplicitAnchorMatches: YOUYI_TIANFU_MAP.some(row => row.ziwei === '丑' && row.tianfu === '卯'),
          youyiSamePalaceAnchorsMatch: ['寅', '申'].every(branch => YOUYI_TIANFU_MAP.some(row => row.ziwei === branch && row.tianfu === branch)),
          fullTwelveRowMapComparable: false,
          semanticAuthority: false,
          relationClass: 'direct Ming printed 安天府圖 surface; partial anchor agreement only, no complete palace-coordinate authority',
        },
        nanbeiAnTianfuTable: {
          sourceArtifact: PREDECESSOR_TIANFU_SOURCE_EVIDENCE,
          sourceId: 'nanbei',
          sourceSha256: sourceEvidence.sourceIdentity.nanbei.sha256,
          locator: 'PDF page 13 / printed folio 三十四 / 甲六、安天府',
          sourceRowCount: nanbeiMap.length,
          youyiMapMatchCount: nanbeiMapMatchCount,
          fullMapMatchesYouyi: nanbeiMapMatchCount === YOUYI_TIANFU_MAP.length,
          semanticAuthority: false,
          relationClass: 'direct Nanbei table surface agrees 12/12 with Youyi branch tokens; edition lineage and semantic authority remain blocked',
        },
        productionLegacy: {
          sourceArtifact: 'src/ziwei/starPlacementRules.js',
          convention: getTianfuModeConvention(TIANFU_MODES.LEGACY),
          youyiMapMatchCount: sourceAlignedMapComparison.filter(row => row.youyiTianfu === row.legacyProductionTianfu).length,
          status: 'production_default_legacy_unchanged; disagreement is recorded, not resolved by this candidate',
          productionModified: false,
        },
        rotation06: {
          sourceArtifact: PREDECESSOR_TIANFU_INTEGRATED,
          testedRows: 150,
          matchCount: rotationRelation.matchCount,
          mismatchCount: rotationRelation.mismatchCount,
          status: 'representation_only',
          semanticAuthority: false,
        },
      },
      existingIntegratedIdentity: { matchCount: identityRelation.matchCount, mismatchCount: identityRelation.mismatchCount },
      existingIntegratedRotation06: { matchCount: rotationRelation.matchCount, mismatchCount: rotationRelation.mismatchCount },
      semanticIdentityStatus: 'blocked; rotation-06 remains representation_only',
    },
    starSeries: {
      baseBranch: '寅',
      ziweiSeriesOffsets: ZIWEI_SERIES_OFFSETS,
      tianfuSeriesOffsets: TIANFU_SERIES_OFFSETS,
      workedExampleSurfaceMatchesCurrentOffsets: true,
      relationClass: 'direct worked-example and code-surface agreement; no rule-source promotion',
    },
  }
}

function buildClaimReconciliation(sourceIdentity, relationIdsByClaim) {
  return sourceIdentity.claimSourceMatrix.map(item => {
    const observationIds = CLAIM_OBSERVATIONS[item.claimId] || []
    const relationIds = relationIdsByClaim[item.claimId] || []
    const affected = observationIds.length > 0
    return {
      claimId: item.claimId,
      family: item.family,
      predecessorStatus: item.status,
      successorStatus: item.status,
      predecessorClaimRelation: item.claimRelation,
      successorClaimRelation: item.claimRelation,
      sourceIdsBefore: item.sourceIds,
      sourceIdsAdded: affected ? [SOURCE_ID] : [],
      observationIdsAdded: observationIds,
      evidenceRelationIdsAdded: relationIds,
      directObservationStatus: affected
        ? 'new bounded direct scan observation; semantic authority unchanged'
        : 'unchanged; no new direct scan surface',
      authorityStatus: 'unchanged; source_authority_and_semantic_authority_not_established',
      statusChanged: false,
      sourceRelationPromotion: 'none',
    }
  })
}

function relationRows(evidence) {
  const common = {
    sourceIds: [SOURCE_ID],
    promotion: 'not_admitted_to_claim_status_source_authority_semantic_authority_readiness_or_activation',
    independence: 'distinct scan candidate; textual lineage independence unresolved',
    authority: 'direct scan surface only; source authority and semantic authority not established',
    doesNotEstablish: DOES_NOT_ESTABLISH,
  }
  return [
    {
      ...common,
      relationId: 'relation-youyi-cadal-01025514-source-identity-boundary',
      observationIds: ['obs-youyi-cadal-01025514-source-file-identity'],
      relationKind: 'external_scan_source_identity_candidate',
      relationStatus: '1883 digital resource identity is bounded by catalog crosswalk and exact source-byte hashes; printed lineage remains open',
      claimIds: [],
      affectedClaimIds: [],
      blockerIds: ['blocker-source-identity-unresolved', 'blocker-image-reuse-rights'],
    },
    {
      ...common,
      relationId: 'relation-youyi-p130-palace-reverse-layout',
      observationIds: ['obs-youyi-p130-ming-shen-palace-order'],
      relationKind: 'direct_palace_semantic_surface',
      relationStatus: 'direct scan records named-palace order, reverse allocation wording, and one 命宮/身宮 example; complete coordinate identity remains open',
      claimIds: [CLAIM_IDS.palaceNameBranchOrdinal, CLAIM_IDS.mingShenCoordinateFrame, CLAIM_IDS.palaceDiagramSemantics],
      affectedClaimIds: [CLAIM_IDS.palaceNameBranchOrdinal, CLAIM_IDS.mingShenCoordinateFrame, CLAIM_IDS.palaceDiagramSemantics],
      blockerIds: ['blocker-palace-semantic-identity', 'blocker-direct-rule-absent'],
    },
    {
      ...common,
      relationId: 'relation-youyi-p131-branch-opposition-and-triples',
      observationIds: ['obs-youyi-p131-branch-relations'],
      relationKind: 'direct_branch_relation_surface',
      relationStatus: 'direct scan records opposition and triple-branch sets; branch-token relation is not a complete physical-slot/ordinal witness',
      claimIds: [CLAIM_IDS.palaceNameBranchOrdinal, CLAIM_IDS.palaceDiagramSemantics],
      affectedClaimIds: [CLAIM_IDS.palaceNameBranchOrdinal, CLAIM_IDS.palaceDiagramSemantics],
      blockerIds: ['blocker-palace-semantic-identity'],
    },
    {
      ...common,
      relationId: 'relation-youyi-p136-tianfu-diagonal-anchor',
      observationIds: ['obs-youyi-p136-tianfu-diagonal-anchor'],
      relationKind: 'direct_tianfu_anchor_wording',
      relationStatus: '斜對 wording is directly observed; no formula or coordinate convention is adjudicated',
      claimIds: [CLAIM_IDS.tianfuAnchorDirection, CLAIM_IDS.tianfuRelation, CLAIM_IDS.tianfuPlacement, CLAIM_IDS.tianfuRotation06],
      affectedClaimIds: [CLAIM_IDS.tianfuAnchorDirection, CLAIM_IDS.tianfuRelation, CLAIM_IDS.tianfuPlacement, CLAIM_IDS.tianfuRotation06],
      blockerIds: ['blocker-tianfu-raw-formula-contradiction', 'blocker-tianfu-rotation06-semantic-authority', 'blocker-direct-rule-absent'],
    },
    {
      ...common,
      relationId: 'relation-youyi-p139-tianfu-pair-map',
      observationIds: ['obs-youyi-p139-tianfu-pair-map'],
      relationKind: 'direct_tianfu_pair_and_same_palace_surface',
      relationStatus: 'direct branch-pair map matches source_aligned numeric adapter, while source/production semantic identity remains blocked',
      claimIds: [CLAIM_IDS.ziweiPlacement, CLAIM_IDS.tianfuAnchorDirection, CLAIM_IDS.tianfuRelation, CLAIM_IDS.tianfuPlacement, CLAIM_IDS.tianfuRotation06],
      affectedClaimIds: [CLAIM_IDS.ziweiPlacement, CLAIM_IDS.tianfuAnchorDirection, CLAIM_IDS.tianfuRelation, CLAIM_IDS.tianfuPlacement, CLAIM_IDS.tianfuRotation06],
      blockerIds: ['blocker-tianfu-raw-formula-contradiction', 'blocker-tianfu-rotation06-semantic-authority', 'blocker-direct-rule-absent'],
    },
    {
      ...common,
      relationId: 'relation-youyi-p140-major-star-series-direction',
      observationIds: ['obs-youyi-p140-major-star-series'],
      relationKind: 'direct_major_star_series_direction_surface',
      relationStatus: 'worked example directly distinguishes reverse 紫微-series placement from forward 天府-series placement; complete rule authority remains open',
      claimIds: [CLAIM_IDS.ziweiPlacement, CLAIM_IDS.tianfuPlacement],
      affectedClaimIds: [CLAIM_IDS.ziweiPlacement, CLAIM_IDS.tianfuPlacement],
      blockerIds: ['blocker-direct-rule-absent'],
    },
  ]
}

function blockerReassessment(previous, evidence, relations) {
  const observationByBlocker = new Map(ALL_BLOCKER_IDS.map(id => [id, []]))
  for (const observation of evidence.observations) for (const blockerId of observation.blockerIds) observationByBlocker.get(blockerId).push(observation.observationId)
  const relationByBlocker = new Map(ALL_BLOCKER_IDS.map(id => [id, []]))
  for (const relation of relations) for (const blockerId of relation.blockerIds) relationByBlocker.get(blockerId).push(relation.relationId)
  const reduction = {
    'blocker-source-identity-unresolved': ['1883 digital scan identity and page crosswalk are bounded; printed title page/colophon and 1871 textual lineage remain open'],
    'blocker-palace-semantic-identity': ['direct scan now exposes the full named-palace sequence, reverse traversal wording, opposition/triple sets, and one worked example; physical slot/ordinal binding remains open'],
    'blocker-direct-rule-absent': ['bounded direct rule surfaces now exist for palace traversal and major-star worked examples; complete source-authoritative rule identity remains open'],
    'blocker-tianfu-raw-formula-contradiction': ['direct 斜對 wording and a bounded 12-row branch-pair surface are now observed; source prints no modulo formula and convention adjudication remains open'],
    'blocker-tianfu-rotation06-semantic-authority': ['the scan surface agrees with the source_aligned 4-Z numeric map for the recorded pairs, but identity with production coordinates is not established'],
    'blocker-image-reuse-rights': ['Commons public-domain labeling and temporary review are recorded; image-level Git/repository reuse permission remains a human gate'],
  }
  return previous.institutional.blockerReassessment.map(item => {
    const before = item.statusAfter || item.statusBefore
    const newObservationIds = unique(observationByBlocker.get(item.id))
    const newRelationIds = unique(relationByBlocker.get(item.id))
    const newEvidence = newObservationIds.length || newRelationIds.length
    return {
      ...item,
      statusBefore: before,
      statusAfter: before,
      statusChanged: false,
      newObservationIds,
      newRelationIds,
      localResultAfter: reduction[item.id] ? item.localResultAfter + '; ' + reduction[item.id].join('; ') : item.localResultAfter,
      uncertaintyReduction: [...(item.uncertaintyReduction || []), ...(reduction[item.id] || [])],
      evidenceRefs: newEvidence ? [...item.evidenceRefs, ARTIFACT_DIR + '/evidence.json'] : item.evidenceRefs,
      closureDecision: 'top_level_blocker_remains_open; no automatic closure',
    }
  })
}

function buildFieldKitImpact(root, previous, evidence) {
  const evidencePath = ARTIFACT_DIR + '/evidence.json'
  const targetReassessment = previous.institutional.fieldKitImpact.targetReassessment.map(item => {
    const affected = ['acq-distinct-witness-identity-lineage', 'acq-palace-semantic-map-and-coordinate-witness', 'acq-tianfu-anchor-direction-adjudicator', 'review-image-level-reuse-permission'].includes(item.targetId)
    return {
      ...item,
      newEvidenceRole: item.targetId === 'acq-distinct-witness-identity-lineage'
        ? '1883 scan identity and exact bytes add a distinct witness candidate; printed lineage and identity packet remain action_required'
        : item.targetId === 'acq-palace-semantic-map-and-coordinate-witness'
          ? 'pages 130-131 add bounded direct palace/branch surfaces; complete semantic coordinate binding remains action_required'
          : item.targetId === 'acq-tianfu-anchor-direction-adjudicator'
            ? 'pages 136 and 139 add direct 斜對 and branch-pair surfaces; adjudication remains action_required'
            : item.targetId === 'review-image-level-reuse-permission'
              ? 'Commons public-domain mark is recorded, but image reuse remains human_policy_review'
              : item.newEvidenceRole,
      evidenceRefs: affected ? unique([...(item.evidenceRefs || []), evidencePath]) : item.evidenceRefs,
      statusBefore: item.statusBefore,
      statusAfter: item.statusAfter,
      statusChanged: false,
      closure: 'not_closed',
    }
  })
  return {
    predecessorPath: PREDECESSOR_FIELD_KIT,
    predecessorByteSha256: fileSha256(root, PREDECESSOR_FIELD_KIT),
    existingFieldKitBytesRewritten: false,
    heldEvidenceUpdate: 'The 1883 scan is now held as a distinct external semantic-witness candidate with bounded direct page observations; future work still needs physical edition/lineage closure, human rights review, and independent semantic adjudication.',
    targetReassessment,
    evidenceObservationIds: evidence.observations.map(item => item.observationId),
    semanticTargetStillOpen: true,
    sourceIdentityTargetStillActionRequired: true,
    rightsTargetStillHumanPolicyReview: true,
  }
}

function buildArtifact(root = ROOT, { mode = 'exact' } = {}) {
  for (const path of INPUT_PATHS) requireValue(existsSync(resolve(root, path)), 'missing_input:' + path)
  const repo = repository(root)
  requireValue(repo.branch === 'main', 'semantic_witness_requires_main')
  if (mode === 'exact') {
    requireValue(repo.currentHead === BASIS_HEAD, 'semantic_witness_basis_must_be_current_head')
    requireValue(repo.originMainHead === BASIS_HEAD, 'semantic_witness_origin_must_match_basis_head')
  } else if (mode === 'historical_reference') {
    const historical = checkHistoricalRepositoryBasis(root, BASIS_HEAD, { expectedBranch: 'main' })
    requireValue(historical.errors.length === 0, 'historical_reference_basis_invalid:' + historical.errors.join(','))
  } else {
    requireValue(false, 'unsupported_materialization_mode:' + mode)
  }
  const previous = readPredecessors(root)
  const source = sourceLineage()
  const evidence = buildEvidence(source)
  const relations = relationRows(evidence)
  const relationIdsByClaim = {}
  for (const relation of relations) for (const claimId of relation.claimIds) {
    relationIdsByClaim[claimId] = unique([...(relationIdsByClaim[claimId] || []), relation.relationId])
  }
  const claimReconciliation = buildClaimReconciliation(previous.sourceIdentity, relationIdsByClaim)
  const blockers = blockerReassessment(previous, evidence, relations)
  const fieldKitImpact = buildFieldKitImpact(root, previous, evidence)
  const localComparison = buildLocalComparison(root)
  const protectedAsset = {
    path: '-.jpg',
    canonicalPath: SAJU_SOURCE_DERIVED_ASSET_PATH,
    exists: existsSync(resolve(root, SAJU_SOURCE_DERIVED_ASSET_PATH)),
    byteSha256: fileSha256(root, SAJU_SOURCE_DERIVED_ASSET_PATH),
  }
  requireValue(protectedAsset.exists, 'protected_source_derived_asset_missing')

  const previousGraph = previous.institutional.graphImpact.successor
  const successorGraph = {
    claimCount: previousGraph.claimCount,
    sourceCount: previousGraph.sourceCount + 1,
    observationCount: previousGraph.observationCount + evidence.observations.length,
    relationCount: previousGraph.relationCount + relations.length,
    blockerCount: previousGraph.blockerCount,
  }
  const statusCounts = Object.fromEntries(ALL_BLOCKER_IDS.map(id => [id, blockers.find(item => item.id === id).statusAfter]))
  const boundedClaimIds = claimReconciliation.filter(item => item.observationIdsAdded.length > 0).map(item => item.claimId)
  const completeBase = {
    schemaVersion: SCHEMA,
    verdictToken: VERDICT,
    basisHead: BASIS_HEAD,
    observedHead: repo.currentHead,
    originMainHead: repo.originMainHead,
    branch: repo.branch,
    scope: {
      purpose: 'additive external-scan semantic-witness candidate for Ziwei P0 palace/Tianfu/major-star source surfaces',
      externalScanAcquiredOutsideRepository: true,
      materializerNetworkUsed: false,
      sourceAuthorityPromoted: false,
      semanticAuthorityPromoted: false,
      independentWitnessesAdmitted: 0,
      physicalWitnessCandidatesAdded: 1,
      productionChanged: false,
      readinessChanged: false,
      groundingChanged: false,
      activationChanged: false,
      remoteDatabaseChanged: false,
      deployPerformed: false,
      commitPerformed: false,
      pushPerformed: false,
      protectedUntrackedPreserved: ['-.jpg'],
      predecessorArtifacts: 'read-only inputs; historical bytes are not rewritten',
    },
    predecessorChain: [
      PREDECESSOR_SOURCE_IDENTITY,
      PREDECESSOR_TOYO,
      PREDECESSOR_FRONTIER,
      PREDECESSOR_FIELD_KIT,
      PREDECESSOR_INSTITUTIONAL,
    ].map(path => ({
      path,
      schemaVersion: readJson(root, path).schemaVersion,
      byteSha256: fileSha256(root, path),
    })),
    companionFiles: ['evidence.json', 'graph-reconciliation.json', 'field-kit-impact.json'],
    sourceLineage: {
      predecessorPhysicalWitnessCandidates: ['src-toyo-1646'],
      addedSource: source,
      physicalWitnessCountBefore: previous.institutional.sourceLineage.physicalWitnessCount,
      physicalWitnessCountAfter: previous.institutional.sourceLineage.physicalWitnessCount + 1,
      independentPhysicalWitnessesAdmitted: 0,
      lineageInferencePerformed: false,
      sourceAuthority: 'not_established',
      semanticAuthority: 'not_established',
      sourceIdentityStatus: source.edition.identityStatus,
      independenceStatus: source.independence,
    },
    observations: evidence.observations,
    relations,
    claimReconciliation,
    blockerReassessment: blockers,
    localComparison,
    graphImpact: {
      predecessor: previousGraph,
      additive: {
        claimCount: 0,
        sourceCount: 1,
        physicalWitnessCount: 1,
        observationCount: evidence.observations.length,
        relationCount: relations.length,
        blockerCount: 0,
      },
      successor: successorGraph,
      claimsAdded: 0,
      sourcesAdded: [SOURCE_ID],
      physicalWitnessesAdded: [SOURCE_ID],
      independentPhysicalWitnessesAdmitted: 0,
      addedObservationIds: evidence.observations.map(item => item.observationId),
      addedRelationIds: relations.map(item => item.relationId),
      blockersClosed: [],
      blockersStillOpen: ALL_BLOCKER_IDS,
      blockerStatusCounts: statusCounts,
    },
    claimImpact: {
      predecessorClaimCount: previousGraph.claimCount,
      successorClaimCount: successorGraph.claimCount,
      claimsAdded: 0,
      claimsPromoted: 0,
      claimStatusChanges: [],
      claimSourceMatrixUpdated: false,
      boundedDirectObservationClaimSupportAdded: boundedClaimIds,
      directSemanticClaimSupportAdded: [],
      stableClaimCount: 0,
      semanticAuthorityCount: 0,
      interpretationEligibleClaimCount: 0,
      unsupportedClaimPreserved: true,
      boundary: 'new scan pages add bounded direct observations and source context only; claim status, source authority, semantic authority, readiness, and activation remain unchanged',
    },
    blockerImpact: {
      blockersClosed: [],
      blockerStatusChanges: [],
      openBlockedCount: blockers.filter(item => item.statusAfter === 'blocked').length,
      openHumanReviewCount: blockers.filter(item => item.statusAfter === 'needs_human_review').length,
      resolvedSubBoundaries: [
        '1883 CADAL/Tsinghua digital resource identity and exact DjVu byte identity are bounded',
        'pages 130/131/136/139/140 now have direct scan locators and bounded visual observations',
      ],
      resolvedSubBoundaryIsNotTopLevelClosure: true,
    },
    uncertaintyImpact: {
      reduced: [
        'external scan resource identity: title/author/date/page count/178-page structure and source DjVu hash are bound',
        'page provenance: v5 starts at scan/CADAL/CText page 130 and the five reviewed pages have render hashes',
        'palace surface: named-palace order, reverse wording, opposition/triple sets, and one 命宮/身宮 example are directly observed',
        'Tianfu surface: 斜對 wording, worked pairs, branch continuation, and 寅/申 same-palace exceptions are directly observed',
        'major-star surface: one worked example directly distinguishes reverse 紫微-series and forward 天府-series directions',
      ],
      notReduced: [
        'physical title page/colophon and exact printed folio identity',
        '1883-to-1871 textual transmission lineage and independent semantic authority',
        'complete palace name to branch to physical slot/ordinal/base/direction binding',
        'semantic identity of source_aligned/rotation-06 with production coordinates',
        'calendar/time oracle, Four Transformations, 命主/身主, interpretation readiness, and activation',
        'image-level repository reuse permission',
      ],
    },
    fieldKitImpact,
    readinessImpact: {
      readiness: 'not_safe_to_start',
      grounding: 'blocked',
      activation: 'experimental_only',
      rotation06: 'representation_only',
      sourceAuthorityPromoted: false,
      semanticAuthorityPromoted: false,
      independentWitnessesAdmitted: 0,
      productionModified: false,
      readinessModified: false,
      interpretationGenerated: false,
    },
    preservation: {
      predecessorArtifactsRewritten: false,
      historicalPredecessorBytesRewritten: false,
      existingFieldKitRewritten: false,
      sourceDjvuStoredInGit: false,
      sourcePageRendersStoredInGit: false,
      sourceImagesStoredInGit: false,
      sourcePdfsStoredInGit: false,
      sourceBytesAcquiredOutsideRepo: true,
      externalScanAcquiredOutsideRepo: true,
      materializerNetworkUsed: false,
      protectedUntrackedDashJpgPreserved: protectedAsset.exists,
      protectedAsset,
      productionChanged: false,
      remoteDatabaseChanged: false,
      deploymentPerformed: false,
      commitPerformed: false,
      pushPerformed: false,
    },
    deterministicContract: {
      generatedAt: 'forbidden',
      timestamps: 'forbidden',
      network: 'forbidden_during_materialization',
      sourceBytes: 'external DjVu and page renders are hash-recorded from prior bounded review; no external bytes are acquired during materialization',
      ordering: 'canonical object keys; declared page/evidence/relation/blocker order; stable explicit IDs',
      ocr: 'locator_only; never canonical claim text',
      noImplicitSourceSearch: true,
      noAutomaticPromotion: true,
    },
    negativeContract: {
      rejects: [
        'treating the scan candidate as an admitted independent physical witness',
        'treating catalog identity or public-domain labeling as semantic/source authority or reuse permission',
        'treating CText OCR as canonical text',
        'inventing printed folio/page locators not present in the scan packet',
        'converting 斜對 or the branch-pair surface into an unqualified production formula',
        'promoting source_aligned or rotation-06 numerical agreement to semantic identity',
        'promoting a worked example to complete 14-star source authority',
        'closing any top-level P0 blocker, readiness, grounding, activation, production, DB, deploy, commit, or push boundary',
        'mutating predecessor artifacts or the protected dash-JPG asset',
        'introducing generated timestamps or network acquisition during materialization',
      ],
    },
    materializer: MATERIALIZER_PATH,
    checker: 'scripts/check-' + SCHEMA + '.mjs',
    negativeChecker: 'scripts/check-' + SCHEMA + '-negative-v0.mjs',
  }
  const artifact = attachArtifactIdentity(completeBase, buildArtifactIdentity({
    root,
    artifactId: SCHEMA,
    materializerPath: MATERIALIZER_PATH,
    materializerVersion: MATERIALIZER_VERSION,
    baseHead: BASIS_HEAD,
    inputs: INPUT_PATHS,
  }))
  const files = {
    'evidence.json': {
      schemaVersion: SCHEMA + '-evidence-v0',
      evidenceSource: evidence.source,
      observations: evidence.observations,
      reportedNonObservations: evidence.reportedNonObservations,
    },
    'graph-reconciliation.json': {
      schemaVersion: SCHEMA + '-graph-v0',
      predecessorChain: artifact.predecessorChain,
      sourceLineage: artifact.sourceLineage,
      observations: artifact.observations,
      relations: artifact.relations,
      claimReconciliation: artifact.claimReconciliation,
      blockerReassessment: artifact.blockerReassessment,
      localComparison: artifact.localComparison,
      graphImpact: artifact.graphImpact,
      claimImpact: artifact.claimImpact,
      blockerImpact: artifact.blockerImpact,
      uncertaintyImpact: artifact.uncertaintyImpact,
    },
    'field-kit-impact.json': {
      schemaVersion: SCHEMA + '-field-kit-v0',
      predecessorFieldKit: fieldKitImpact.predecessorPath,
      predecessorByteSha256: fieldKitImpact.predecessorByteSha256,
      existingFieldKitBytesRewritten: fieldKitImpact.existingFieldKitBytesRewritten,
      heldEvidenceUpdate: fieldKitImpact.heldEvidenceUpdate,
      targetReassessment: fieldKitImpact.targetReassessment,
      evidenceObservationIds: fieldKitImpact.evidenceObservationIds,
      closureBoundary: {
        sourceIdentityTarget: 'action_required',
        palaceSemanticTarget: 'action_required',
        tianfuTarget: 'action_required',
        imageReuseTarget: 'human_policy_review',
      },
    },
  }
  return { artifact, files }
}

export function buildBundle(root = ROOT, options = {}) {
  return buildArtifact(root, options)
}

export async function materializeBundle(target = resolve(ROOT, ARTIFACT_PATH), options = {}) {
  const { artifact, files } = buildArtifact(ROOT, options)
  const targetPath = resolve(target)
  const directory = dirname(targetPath)
  await mkdir(directory, { recursive: true })
  const outputs = { complete: targetPath }
  const writeJson = async (path, value) => {
    const body = Buffer.from(canonicalJson(value))
    await writeFile(path, body)
    await writeFile(path + '.integrity.json', canonicalJson({
      schemaVersion: SCHEMA + '-integrity-v0',
      path: relative(ROOT, path),
      byteSha256: sha256(body),
      byteScope: 'UTF-8 JSON bytes including final LF',
    }))
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
  console.log(JSON.stringify({
    target: result.targetPath,
    schema: SCHEMA,
    verdict: VERDICT,
    basisHead: BASIS_HEAD,
    counts: result.artifact.graphImpact.successor,
    blockersClosed: result.artifact.graphImpact.blockersClosed,
    sourceFileSha256: SOURCE_DJVU_SHA256,
    completeByteSha256: result.completeSha256,
  }, null, 2))
}

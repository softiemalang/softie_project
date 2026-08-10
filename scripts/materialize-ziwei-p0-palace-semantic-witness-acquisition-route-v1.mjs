import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { checkHistoricalRepositoryBasis } from '../src/artifactIdentity.js'

export const SCHEMA = 'ziwei-p0-palace-semantic-witness-acquisition-route-v1'
export const VERDICT = 'complete_ziwei_p0_palace_semantic_witness_acquisition_route_exhausted_uncommitted'
export const MATERIALIZER_VERSION = '1.0.0'
export const EXPECTED_HEAD = 'ee833c0607650897aa76ae7a3b3636337e291117'
export const ARTIFACT_PATH = `artifacts/${SCHEMA}/complete.json`
export const OBSERVED_AT_UTC = '2026-08-09T12:31:50Z'

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const stable = value => Array.isArray(value)
  ? value.map(stable)
  : value && typeof value === 'object'
    ? Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])]))
    : value
export const canonicalJson = value => `${JSON.stringify(stable(value), null, 2)}\n`
const git = (root, args) => execFileSync('git', ['-c', 'core.fsmonitor=false', ...args], { cwd: root, encoding: 'utf8' }).trim()

const SOURCE_INPUTS = Object.freeze([
  'docs/tri-system-p0-acquisition-priority-and-dossier-v1.md',
  'artifacts/tri-system-p0-acquisition-priority-and-dossier-v1/complete.json',
  'docs/ziwei-palace-semantic-source-frontier-v1.md',
  'docs/ziwei-palace-coordinate-semantic-identity-v0.md',
])

export const REQUIRED_ACCESS_ROUTES = Object.freeze([
  'immediate_public_download',
  'public_viewer_only',
  'remote_reproduction_request',
  'on_site_only',
  'unknown',
])

const NARA_SECONDARY_USE = 'https://www.digital.archives.go.jp/secondary-use'

const naraVolume = ({ item, volume, canvasCount, manifestSha256, manifestBytes, firstCanvas, firstImage, samples, semanticUsefulness, directObservation }) => ({
  id: `nara-${volume === 1 ? 'volume-one' : 'volume-two'}-iiif`,
  classification: 'confirmed_acquirable',
  accessRoute: 'immediate_public_download',
  authorityStatus: 'official_item_in_same_cataloged_record',
  semanticUsefulness,
  independentWitnessStatus: 'same_record_same_edition_volume_pair_not_independent_second_edition',
  system: 'ziwei',
  role: 'actual_public_image_byte_capture',
  title: `新鋟希夷陳先生紫微斗数全書${volume === 1 ? '１' : '２'}`,
  institution: '国立公文書館デジタルアーカイブ / National Archives of Japan Digital Archive',
  identity: {
    recordId: 'F1000000000000101426',
    fileId: '1078787',
    itemId: item,
    callNumber: `子０６０－０００１-000${volume}`,
    edition: '明刊本',
    selector: '陳搏（宋）',
    supplementer: '潘希尹（明）',
    volumes: '7巻/2冊',
    collection: '紅葉山文庫',
    language: 'Chinese',
  },
  urls: {
    record: 'https://www.digital.archives.go.jp/das/meta/F1000000000000101426.html',
    file: 'https://www.digital.archives.go.jp/file/1078787',
    item: `https://www.digital.archives.go.jp/item/${item}`,
    viewer: `https://www.digital.archives.go.jp/img/${item}`,
    manifest: `https://www.digital.archives.go.jp/api/iiif/${item}/manifest.json`,
    secondaryUse: NARA_SECONDARY_USE,
  },
  observedAtUtc: OBSERVED_AT_UTC,
  fetchObservation: {
    method: 'public GET from IIIF manifest and IIIF image endpoint; no account, form submission, or login used',
    manifestHttpStatus: 200,
    imageHttpStatus: 200,
    manifestBytes,
    manifestSha256,
    canvasCount,
    firstCanvas,
    firstImage,
    sampleImages: samples,
  },
  accessAndRightsBoundary: {
    actualEndpoint: 'publicly fetched in this session',
    viewerLabel: '館内限定閲覧 was present in viewer HTML but hidden by display:none',
    recordVisibility: 'record page reports 公開',
    itemSpecificImageReuse: 'not conclusively closed by this capture; manifest points to the general NARA secondary-use page, while item metadata and viewer restriction fields must remain separate',
    metadataVsImageRule: 'do not treat metadata CC0 or a public endpoint as automatic image-level redistribution permission',
  },
  directVisualObservation: directObservation,
  supports: [
    'catalog-linked edition and volume identity',
    'actual page-image bytes and stable manifest/page locators',
    'diagnostic comparison of printed layout, branch glyphs, charts, and rule headings',
  ],
  doesNotSupport: [
    'automatic palace-name↔branch↔physical-slot↔ordinal semantic closure',
    'automatic source authority for production coordinates',
    'automatic image redistribution or license conclusion',
    'independent second-witness disagreement evidence',
  ],
  evidenceNote: directObservation,
})

export const CANDIDATES = Object.freeze([
  naraVolume({
    item: '4468520', volume: 1, canvasCount: 129,
    manifestSha256: '732991ca47aefc323ea2095a93202fd301421ad8b92994c63caae2a94acf75af',
    manifestBytes: 117876,
    firstCanvas: 'https://www.digital.archives.go.jp/api/iiif/4468520/canvas/C102812178400',
    firstImage: 'https://www.digital.archives.go.jp/api/content/item/da12/C102812178400/iiif/M2019050811103249305_0001.jp2/full/max/0/native.jpg',
    samples: [
      { canvasIndex: 84, canvasId: 'C102812186700', imageSha256: '366f656fd2a51520746543e1cc96d77a8a2e5dc920281684d4543926166de613', bytes: 838573, imageUrl: 'https://www.digital.archives.go.jp/api/content/item/da12/C102812186700/iiif/M2019050811103249305_0084.jp2/full/max/0/native.jpg', observation: '安命/安身 and related rule material was located in this section; no complete 12-palace semantic table was admitted.' },
      { canvasIndex: 87, canvasId: 'C102812187000', imageSha256: '6e8c584cb01dce720c3ef862a23a127af11d987e14ef0df40d841492576d00a9', bytes: 842468, imageUrl: 'https://www.digital.archives.go.jp/api/content/item/da12/C102812187000/iiif/M2019050811103249305_0087.jp2/full/max/0/native.jpg', observation: '安天府圖 heading and star-placement diagram are directly visible.' },
      { canvasIndex: 88, canvasId: 'C102812187100', imageSha256: '01aa70087388237313da09a6038e923e676acda36cfe1e58b3026e817a8eb619', bytes: 825635, imageUrl: 'https://www.digital.archives.go.jp/api/content/item/da12/C102812187100/iiif/M2019050811103249305_0088.jp2/full/max/0/native.jpg', observation: 'Branch headings and star/四化 tables are directly visible; palace-name semantics are not directly bound.' },
      { canvasIndex: 89, canvasId: 'C102812187200', imageSha256: '34e5178b021178cccf3ef61a6513652405db45ed989b2e1393361ba306d101e6', bytes: 859799, imageUrl: 'https://www.digital.archives.go.jp/api/content/item/da12/C102812187200/iiif/M2019050811103249305_0089.jp2/full/max/0/native.jpg', observation: 'Further star/branch table material is directly visible; no complete palace semantic mapping was admitted.' },
    ],
    semanticUsefulness: 'promising_but_insufficient',
    directObservation: 'Pages were inspected as images, not OCR. The route exposes 129 canvases and readable page JPEGs. The observed pages contain rule/chart material, including 安天府圖 and branch/star tables, but no directly visible complete mapping of all required palace names to branches, physical slots, and ordinal/direction semantics.',
  }),
  naraVolume({
    item: '4469314', volume: 2, canvasCount: 137,
    manifestSha256: '3f167e1280527e1c672a72d7ef060c299ce9dffad1f362ddba04575da3df1560',
    manifestBytes: 125132,
    firstCanvas: 'https://www.digital.archives.go.jp/api/iiif/4469314/canvas/C102812191300',
    firstImage: 'https://www.digital.archives.go.jp/api/content/item/da12/C102812191300/iiif/M2019050811103949308_0001.jp2/full/max/0/native.jpg',
    samples: [
      { canvasIndex: 64, canvasId: 'C102812197600', imageSha256: '901dcc10e4fb8863703e0da2c85f883b6e930fd438c05ba1f22a48e44989770a', bytes: 832936, imageUrl: 'https://www.digital.archives.go.jp/api/content/item/da12/C102812197600/iiif/M2019050811103949308_0064.jp2/full/max/0/native.jpg', observation: 'A full-page natal chart example is directly visible; labels are chart/star content rather than an explicit twelve-palace semantic legend.' },
      { canvasIndex: 75, canvasId: 'C102812198700', imageSha256: 'bbf4823b2e4da81db468bed7e45787308d05bd293b8eef9d15a5da41ca9a2e0b', bytes: 864238, imageUrl: 'https://www.digital.archives.go.jp/api/content/item/da12/C102812198700/iiif/M2019050811103949308_0075.jp2/full/max/0/native.jpg', observation: 'A second full-page natal chart example is directly visible; it does not directly bind all palace names to branch/slot/ordinal semantics.' },
    ],
    semanticUsefulness: 'promising_chart_witness_but_insufficient',
    directObservation: 'Pages 1–137 were reviewed as image thumbnails in batches, with full-page captures for representative chart leaves. The large chart section supplies useful layout and star-placement evidence, but the charts do not by themselves provide the required named-palace semantic legend.',
  }),
  {
    id: 'nara-record-parent', classification: 'confirmed_catalog_identity', accessRoute: 'public_viewer_only', authorityStatus: 'official_cataloged_record', semanticUsefulness: 'identity_only', independentWitnessStatus: 'parent_record_of_the_two_nara_volumes', system: 'ziwei', role: 'record_identity_and_rights_locator',
    title: '新鋟希夷陳先生紫微斗数全書', institution: '国立公文書館デジタルアーカイブ',
    urls: ['https://www.digital.archives.go.jp/das/meta/F1000000000000101426.html', 'https://www.digital.archives.go.jp/file/1078787', NARA_SECONDARY_USE],
    identity: '子０６０－０００１; 明刊本; 陳搏（宋）/潘希尹（明）; 7巻/2冊; 紅葉山文庫; 公開 record; metadata CC0 indication',
    observedAtUtc: OBSERVED_AT_UTC,
    supports: ['institutional identity', 'volume relationship', 'catalog metadata and general reuse-policy locator'],
    doesNotSupport: ['target page semantics', 'image-level license conclusion', 'independent witness status'],
    evidenceNote: 'The parent record is stronger than a generic title search but weaker than page-level content evidence.',
  },
  {
    id: 'held-nanyangtang-derivative', classification: 'weak_candidate', accessRoute: 'unknown', authorityStatus: 'derivative_local_bytes_lineage_unresolved', semanticUsefulness: 'comparison_locator_only', independentWitnessStatus: 'not_independent_until_lineage_is_closed', system: 'ziwei', role: 'held_comparison_only',
    title: '新锓希夷陈先生紫微斗数全书.七卷.宋.陈抟撰.明.潘希尹补.明代南阳堂刊本.黑白版.pdf', institution: 'local held PDF / embedded NARA locator',
    urls: ['https://www.digital.archives.go.jp/das/meta/F1000000000000101426.html', 'https://lfglib.cn/variety/daojia/186456.html'],
    identity: '528-page local PDF; predecessor records its actual byte hash; public private-site description exposes only first 20 previews and sells full access; embedded NARA metadata is not provenance proof',
    observedAtUtc: OBSERVED_AT_UTC,
    supports: ['comparison locators p148/p172', 'same-title and page-topology investigation'],
    doesNotSupport: ['independent second witness', 'official NARA byte lineage', 'image reuse permission'],
    evidenceNote: 'The local PDF and the public private-site description are retained as comparison/locator evidence only; do not count them again as a second witness.',
  },
  {
    id: 'held-nanbei-derivative', classification: 'weak_candidate', accessRoute: 'unknown', authorityStatus: 'derivative_local_bytes', semanticUsefulness: 'negative_frontier_evidence', independentWitnessStatus: 'not_independent_authority', system: 'ziwei', role: 'existing_negative_comparison',
    title: '紫微斗数全书 / 南北山人編註 local PDF', institution: 'local held bytes',
    urls: ['https://docs.ndl.go.jp/'],
    identity: 'predecessor frontier records 219 pages and direct observations at p7/p8/p10; institutional edition identity and independent lineage are not closed',
    observedAtUtc: OBSERVED_AT_UTC,
    supports: ['negative evidence that branch diagram/traversal wording alone does not close semantic identity'],
    doesNotSupport: ['official historical witness', 'palace semantic authority', 'independent disagreement count'],
    evidenceNote: 'Preserved negative evidence; no new acquisition was needed.',
  },
  {
    id: 'ndl-japan-catalog-route', classification: 'weak_candidate', accessRoute: 'remote_reproduction_request', authorityStatus: 'national_library_catalog_only_for_target_title', semanticUsefulness: 'bibliographic_lead_only', independentWitnessStatus: 'unresolved', system: 'ziwei', role: 'alternative_catalog_route',
    title: 'NDL Search records for 紫微斗數全書 / 陳希夷', institution: 'National Diet Library, Japan',
    urls: ['https://ndlsearch.ndl.go.jp/search?cs=bib&from=0&q-author=%22%E9%99%B3%2C+%E5%B8%8C%E5%A4%B7%22&size=20'],
    identity: 'Search exposes modern Japanese-held records and a 1975 南北山人 record; no public target Ming page-image route was found in the audit.',
    observedAtUtc: OBSERVED_AT_UTC,
    supports: ['library discovery', 'copy or reading-room request lead'],
    doesNotSupport: ['public image bytes', 'target edition identity', 'independent semantic witness'],
    evidenceNote: 'Catalog access is a legitimate fallback route, but it requires a specific copy/edition and page request before semantic use.',
  },
  {
    id: 'ncl-chinese-ancient-catalog-route', classification: 'weak_candidate', accessRoute: 'on_site_only', authorityStatus: 'national_library_catalog_record_for_different_facsimile', semanticUsefulness: 'textual_comparison_only', independentWitnessStatus: 'potentially_distinct_but_not_target_edition', system: 'ziwei', role: 'alternative_catalog_route',
    title: '紫微斗數, 影印本, 三卷, 民國12–15年', institution: 'National Central Library, Taiwan / Chinese Ancient Books Union Catalog',
    urls: ['https://rbook.ncl.edu.tw/NCLSearch/Search/SearchDetail?HasImage=&SourceID=1&item=1b36e75d6cb348bcafa51089508d41ccfDI3ODUxNA2.T5_fvtPg0BL_gp0oecUpf3kBMYmGj_Zu9aAWwhejGlk_&page=3538&sourceWhereString=&whereString=IChOVUxMSVYoQ3JlYXRlcl9OYW1lLCAnICcpIGlzIE5VTEwgYW5kIE5VTExJRihEb2N1bWVudF9Xcml0ZXIsICcgJykgaXMgTlVMTCkgNQ%3D%3D'],
    identity: 'Record rarecatx0428879; 1923–1926 Shanghai facsimile; three volumes; held by China National Library; source title 正統道藏; not the NARA 明刊本 record.',
    observedAtUtc: OBSERVED_AT_UTC,
    supports: ['possible independent textual/edition comparison after lawful access'],
    doesNotSupport: ['remote public page-image acquisition', 'NARA target witness identity', 'automatic semantic equivalence'],
    evidenceNote: 'Potentially useful for disagreement analysis, but it is a different cataloged facsimile and no public images were exposed by the inspected record.',
  },
  {
    id: 'ctext-zhengtong-daozang', classification: 'weak_candidate', accessRoute: 'public_viewer_only', authorityStatus: 'text_project_transcription_with_stated_base_text', semanticUsefulness: 'textual_locator_only', independentWitnessStatus: 'not_page_image_witness', system: 'ziwei', role: 'secondary_text_locator',
    title: '《正統道藏》本《紫微斗數》', institution: 'Chinese Text Project',
    urls: ['https://ctext.org/library.pl?if=gb&res=85160', 'https://ctext.org/datawiki.pl?if=gb&res=8418262'],
    identity: 'Three-volume 正統道藏/續道藏 text context, separate from the modern 紫微斗數全書 tradition; OCR/transcription is matched to a base text but is not a page-image witness.',
    observedAtUtc: OBSERVED_AT_UTC,
    supports: ['terminology expansion', 'textual comparison lead', 'explicit warning that the 道藏 text differs from the modern tradition'],
    doesNotSupport: ['image byte provenance', 'target Ming edition', 'automatic palace semantic authority'],
    evidenceNote: 'Public text is useful as a locator and a distinct tradition marker, not as the P0 image witness.',
  },
  {
    id: 'wikisource-qing-text', classification: 'weak_candidate', accessRoute: 'public_viewer_only', authorityStatus: 'community_text_mirror', semanticUsefulness: 'chapter_locator_only', independentWitnessStatus: 'not_page_image_witness', system: 'ziwei', role: 'secondary_text_locator',
    title: '紫微斗數全書', institution: 'Chinese Wikisource',
    urls: ['https://zh.wikisource.org/zh-hans/%E7%B4%AB%E5%BE%AE%E6%96%97%E6%95%B8%E5%85%A8%E6%9B%B8'],
    identity: 'Community text page framed as a Qing work, with chapter headings for the twelve palace sections; scan/edition lineage is not established.',
    observedAtUtc: OBSERVED_AT_UTC,
    supports: ['search terms and chapter headings'],
    doesNotSupport: ['cataloged scan identity', 'page/leaf witness', 'independent authority'],
    evidenceNote: 'Text mirror only; useful for navigation and not for admission.',
  },
  {
    id: 'google-books-modern-records', classification: 'rejected', accessRoute: 'public_viewer_only', authorityStatus: 'modern_bibliographic_or_limited_preview', semanticUsefulness: 'non_target_modern_edition', independentWitnessStatus: 'not_premodern_witness', system: 'ziwei', role: 'confusion_control',
    title: 'Google Books same-title modern editions and previews', institution: 'Google Books',
    urls: ['https://books.google.com/books?id=OrgFzQEACAAJ', 'https://books.google.com/books?id=EPJ7zgEACAAJ'],
    identity: '1985, 494-page and 2025 modern records were observed; these are not the NARA 明刊本 image witness.',
    observedAtUtc: OBSERVED_AT_UTC,
    supports: ['same-title confusion control', 'modern commentary comparison if separately authorized'],
    doesNotSupport: ['Ming witness', 'free complete scan', 'independent source admission'],
    evidenceNote: 'Rejected for this P0 target because title match is not edition identity.',
  },
  {
    id: 'private-nanyangtang-preview-route', classification: 'rejected', accessRoute: 'public_viewer_only', authorityStatus: 'private_repository_same-scan-or-lineage-unresolved', semanticUsefulness: 'comparison_only', independentWitnessStatus: 'same-or-related-local-scan_not_independent', system: 'ziwei', role: 'private_mirror_route',
    title: '流芳阁 Nanyangtang page preview/download offer', institution: '流芳阁 / private repository',
    urls: ['https://lfglib.cn/variety/daojia/186456.html'],
    identity: 'The page identifies the same 266-page/明代南阳堂 title family, offers only first 20 page previews, and requires contact/payment for the full scan; its terms prohibit unapproved copying.',
    observedAtUtc: OBSERVED_AT_UTC,
    supports: ['provenance/lineage comparison against the held 528-page derivative', 'human contact fallback if rights are explicitly requested'],
    doesNotSupport: ['immediate lawful full download', 'independent witness until lineage is proven', 'automatic reuse permission'],
    evidenceNote: 'Do not bypass access controls or purchase in this work order; NARA IIIF already supplies a public image route for the cataloged volumes.',
  },
  {
    id: 'internet-archive-hathi-high-yield-search', classification: 'rejected', accessRoute: 'unknown', authorityStatus: 'no_target_record_observed_in_search', semanticUsefulness: 'none_observed', independentWitnessStatus: 'none_observed', system: 'ziwei', role: 'bounded_negative_search',
    title: 'Internet Archive / HathiTrust high-yield title search', institution: 'public repository search surfaces',
    urls: ['https://archive.org/', 'https://www.hathitrust.org/'],
    identity: 'Exact-title searches in the public search pass did not produce a verified target scan record; no candidate was admitted from a generic result.',
    observedAtUtc: OBSERVED_AT_UTC,
    supports: ['bounded negative search result'],
    doesNotSupport: ['absence from every repository', 'semantic or edition conclusion'],
    evidenceNote: 'A future exact catalog hit would be a new candidate; this pass does not turn a no-hit search into global absence.',
  },
])

const inventoryFile = async (root, path) => {
  const absolute = resolve(root, path)
  if (!existsSync(absolute)) return { exists: false, path }
  const bytes = await readFile(absolute)
  return { exists: true, path, bytes: bytes.length, byteSha256: sha256(bytes) }
}

const assertCurrentRepository = root => {
  const branch = git(root, ['branch', '--show-current'])
  const currentHead = git(root, ['rev-parse', 'HEAD'])
  const originMainHead = git(root, ['rev-parse', 'origin/main'])
  if (branch !== 'main') throw new Error(`expected main, got ${branch}`)
  const basis = checkHistoricalRepositoryBasis(root, EXPECTED_HEAD)
  if (basis.errors.length) throw new Error(`historical repository basis invalid: ${basis.errors.join(',')}; got ${currentHead}/${originMainHead}`)
  return {
    branch,
    currentHead,
    originMainHead,
    expectedHead: EXPECTED_HEAD,
    unrelatedUntrackedPreserved: ['-.jpg'],
    staging: false,
    commit: false,
    push: false,
    deploy: false,
    remoteDatabaseMutation: false,
  }
}

export async function buildArtifact({ root = resolve(new URL('..', import.meta.url).pathname) } = {}) {
  const scope = assertCurrentRepository(root)
  const sourceInputs = []
  for (const path of SOURCE_INPUTS) {
    const inventory = await inventoryFile(root, path)
    if (!inventory.exists) throw new Error(`missing source input: ${path}`)
    sourceInputs.push(inventory)
  }
  return {
    schemaVersion: SCHEMA,
    verdictToken: VERDICT,
    materializer: { path: 'scripts/materialize-ziwei-p0-palace-semantic-witness-acquisition-route-v1.mjs', version: MATERIALIZER_VERSION },
    scope,
    sourceOfTruth: {
      currentRepositoryBasis: EXPECTED_HEAD,
      sourceInputs,
      predecessorBoundary: 'The existing P0 priority/dossier, Ziwei source frontier, and coordinate identity artifacts remain unchanged inputs. This is an additive successor.',
    },
    target: {
      id: 'ZIWEI-P0-PALACE-SEMANTIC-WITNESS',
      system: 'ziwei',
      blockers: ['blocker-palace-semantic-identity', 'blocker-source-identity-unresolved', 'blocker-tianfu-rotation06-semantic-authority'],
      requiredSemanticEdges: ['palace name', 'branch glyph', 'physical diagram slot', 'ordinal/order', 'direction/base convention'],
      requiredDirectWitnesses: ['命、兄弟、夫妻、子女、財帛、疾厄、遷移、僕役、官祿、田宅、福德、父母', '12 branches', 'all physical slots', 'direction/order and ordinal', '寅起月', '命宮逆數', '身宮順數', '安紫微', '安天府'],
    },
    acquisitionAudit: {
      observedAtUtc: OBSERVED_AT_UTC,
      scope: 'bounded reasonable public/legal high-yield routes: NARA, NDL, Taiwan NCL, CTP, Wikisource, Google Books, private Nanyangtang preview, Internet Archive and HathiTrust search surfaces',
      exhaustiveMeaning: 'All identified high-yield public/legal routes were checked for an actionable, catalog-linked, non-duplicate witness. This is not a claim of global absence from every web page or private collection.',
      exhaustionDecision: 'bounded_reasonable_public_legal_paths_exhausted',
      noUserActionPerformed: true,
      noAccountOrPaymentUsed: true,
      actualPublicBytesObtained: true,
      semanticGateClosed: true,
      independentSecondWitnessObtained: false,
      imageLevelReuseClosed: false,
      routeStatuses: REQUIRED_ACCESS_ROUTES,
      humanFallback: {
        neededForCurrentPublicImages: false,
        reason: 'NARA IIIF manifest and page JPEG endpoints returned HTTP 200 without login during this capture.',
        useIfHigherResolutionOrTermsAreNeeded: true,
        institution: 'National Archives of Japan Digital Archive',
        reference: 'F1000000000000101426 / 1078787 / 子０６０－０００１ / items 4468520 and 4469314',
        request: 'Ask for permitted high-resolution/native page copies for the exact candidate canvas indices and explicit image-level reuse terms. Do not request or accept a semantic interpretation from the institution.',
        guidance: 'https://www.archives.go.jp/english/gettingstarted/guide.html',
        restrictionHelp: 'https://www.digital.archives.go.jp/howto/helpKbun_04_05',
        submitted: false,
      },
    },
    candidates: CANDIDATES,
    relationshipAudit: {
      naraVolumes: 'same official record, same call number, adjacent volume items; treat as one edition witness with two physical volumes, not two independent editions',
      heldNanyangtang: 'same-title/local derivative relationship is plausible and publicly described, but exact byte lineage is not admitted; do not count as a second witness',
      heldNanbei: 'existing local negative comparison only; no independent official lineage admitted',
      ctextDaozang: 'different textual tradition/edition context, potentially useful for future disagreement but not the target NARA witness',
      modernAndCommunity: 'modern reprints, OCR/transcriptions, and same-title bibliographic records are navigation or confusion-control material only',
    },
    semanticFinding: {
      result: 'candidate_usable_for_locator_and_diagnostic_comparison_but_gate_remains_blocked',
      directlyObserved: ['NARA volume 1 page-index 87 安天府圖 heading and diagram', 'NARA volume 1 page-index 88 branch/star and 四化 tables', 'NARA volume 2 page-index 64 and 75 natal-chart examples'],
      notDirectlyObserved: ['one complete page/leaf or linked leaf set that names all 12 palaces and binds each to branch, physical slot, ordinal, and direction/base semantics'],
      interpretationBoundary: 'Charts and star/rule tables are observations; their relationship to production palace ordinals is a separate semantic adjudication and is not inferred here.',
      tianfuBoundary: '安天府圖 is a direct heading observation, not proof that rotation-06 or any production coordinate convention is authoritative.',
    },
    verificationContract: {
      candidateStatusMeans: 'classification describes acquisition/identity route only; accessRoute, authorityStatus, semanticUsefulness, and independentWitnessStatus remain separate fields',
      confirmedAcquirableMeans: 'actual public byte fetch and hash were observed for the stated URL in this session',
      weakCandidateMeans: 'locator, derivative, text, modern, private, or unresolved lineage; never source witness admission',
      rejectedMeans: 'not suitable for this target under the current edition/access/lineage boundary; a future exact catalog hit must be evaluated afresh',
      promotionBoundary: {
        automaticClaimPromotion: false,
        automaticEvidencePromotion: false,
        automaticReadinessPromotion: false,
        automaticGroundingPromotion: false,
        automaticActivation: false,
        automaticProductionChange: false,
        automaticLicenseConclusion: false,
        humanSemanticReviewRequired: true,
      },
      requiredNextEvidence: ['complete readable source-linked leaf set', 'actual bytes and per-page hashes', 'explicit edition/folio relationship', 'human semantic adjudication', 'separate image reuse decision', 'independent second witness or recorded reason it is not available'],
    },
    deterministic: {
      generatedAt: null,
      networkFetchPerformedByMaterializer: false,
      sourceAcquisitionPerformedByMaterializer: false,
      remoteObservationHashesDerivedFromActualBytes: true,
      canonicalFinalLf: true,
      noProductionOrRemoteMutation: true,
    },
  }
}

export async function materialize({ root = resolve(new URL('..', import.meta.url).pathname) } = {}) {
  const artifact = await buildArtifact({ root })
  const output = resolve(root, ARTIFACT_PATH)
  await mkdir(resolve(root, `artifacts/${SCHEMA}`), { recursive: true })
  await writeFile(output, canonicalJson(artifact))
  return artifact
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  const artifact = await materialize()
  process.stdout.write(JSON.stringify({ artifactPath: ARTIFACT_PATH, schema: artifact.schemaVersion, verdict: artifact.verdictToken, naraConfirmedVolumes: artifact.candidates.filter(candidate => candidate.classification === 'confirmed_acquirable').length, semanticGateClosed: artifact.semanticFinding.result.includes('gate_remains_blocked') }, null, 2) + '\n')
}

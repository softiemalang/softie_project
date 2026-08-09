import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

export const SCHEMA = 'tri-system-p0-acquisition-priority-and-dossier-v1'
export const VERDICT = 'complete_tri_system_p0_acquisition_priority_and_dossier_exhausted_uncommitted'
export const MATERIALIZER_VERSION = '1.0.0'
export const EXPECTED_HEAD = 'ee833c0607650897aa76ae7a3b3636337e291117'
export const ARTIFACT_PATH = `artifacts/${SCHEMA}/complete.json`
export const SOURCE_FIELD_KIT_PATH = 'artifacts/tri-system-evidence-acquisition-field-kit-v1/complete.json'
export const SOURCE_FIELD_KIT_DOC = 'docs/tri-system-evidence-acquisition-field-kit-v1.md'

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const stable = value => Array.isArray(value)
  ? value.map(stable)
  : value && typeof value === 'object'
    ? Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])]))
    : value
export const canonicalJson = value => `${JSON.stringify(stable(value), null, 2)}\n`
const git = (root, args) => execFileSync('git', ['-c', 'core.fsmonitor=false', ...args], { cwd: root, encoding: 'utf8' }).trim()

const SCORE_WEIGHTS = Object.freeze({
  blockerImportance: 15,
  leverage: 15,
  nonDuplication: 15,
  authority: 12,
  acquisition: 8,
  freeAccess: 8,
  scanCertainty: 6,
  licenseReuse: 12,
  deterministicLinkage: 5,
  wrongMaterialRisk: 4,
})

const SCORE_AUDITS = Object.freeze({
  'SAJU-P0-IDENTITY-WITNESS': {
    blockerImportance: 5, leverage: 5, nonDuplication: 3, authority: 2, acquisition: 2,
    freeAccess: 1, scanCertainty: 2, licenseReuse: 2, deterministicLinkage: 5, wrongMaterialRisk: 3,
    notes: '두 개의 P0 blocker와 7개 rule packet에 걸치지만, 현재 후보가 도서관 제한/유료·현대판이며 직접 scan 확보가 불확실하다.',
  },
  'SAJU-P0-CALENDAR-ORACLE': {
    blockerImportance: 5, leverage: 5, nonDuplication: 5, authority: 5, acquisition: 4,
    freeAccess: 4, scanCertainty: 2, licenseReuse: 2, deterministicLinkage: 5, wrongMaterialRisk: 4,
    notes: 'KASI의 공식 공개 질의는 즉시 boundary row를 만들 수 있고 Saju/Ziwei upstream에 재사용되지만, 1901–2100 corpus와 재사용 권리는 미확정이다.',
  },
  'ZIWEI-P0-PALACE-SEMANTIC-WITNESS': {
    blockerImportance: 5, leverage: 5, nonDuplication: 5, authority: 5, acquisition: 4,
    freeAccess: 3, scanCertainty: 4, licenseReuse: 3, deterministicLinkage: 5, wrongMaterialRisk: 4,
    notes: '공식 기관의 특정 明刊本 record와 image/item 경로가 있고 하나의 witness가 palace/source/Tianfu 경계를 함께 검사하게 한다. viewer의 館内限定閲覧 표시는 무료 원본 다운로드를 아직 확정하지 않는다.',
  },
  'ZIWEI-P0-CALENDAR-TIME-ORACLE': {
    blockerImportance: 4, leverage: 5, nonDuplication: 4, authority: 5, acquisition: 4,
    freeAccess: 4, scanCertainty: 2, licenseReuse: 2, deterministicLinkage: 5, wrongMaterialRisk: 4,
    notes: '두 blocker를 건드리지만 SAJU calendar target과 실질적으로 같은 KASI evidence를 재사용한다. palace semantic witness보다 source identity frontier를 덜 전진시킨다.',
  },
  'ZIWEI-P0-CLAIM-SOURCE-IDENTITY': {
    blockerImportance: 5, leverage: 5, nonDuplication: 4, authority: 5, acquisition: 4,
    freeAccess: 3, scanCertainty: 4, licenseReuse: 3, deterministicLinkage: 4, wrongMaterialRisk: 4,
    notes: '모든 occurrence의 provenance gate지만, 새 자료의 직접 내용보다 edition-lineage·duplicate review가 핵심이라 palace target의 identity capture와 중복된다.',
  },
  'ZIWEI-P0-TIANFU-CONVENTION': {
    blockerImportance: 5, leverage: 4, nonDuplication: 4, authority: 5, acquisition: 3,
    freeAccess: 3, scanCertainty: 3, licenseReuse: 3, deterministicLinkage: 4, wrongMaterialRisk: 2,
    notes: '같은 NARA witness가 유력하지만 formula와 coordinate semantics가 실제로 함께 드러나는지 불명확하고, 잘못된 재편집본을 고를 위험이 높다.',
  },
  'WESTERN-P0-SEMANTIC-ADJUDICATION': {
    blockerImportance: 5, leverage: 4, nonDuplication: 5, authority: 4, acquisition: 2,
    freeAccess: 4, scanCertainty: 5, licenseReuse: 3, deterministicLinkage: 2, wrongMaterialRisk: 2,
    notes: 'Swiss/JPL 기술문서는 공개지만 서로 다른 양의 정의를 조정하는 human/product contract가 필요해 자료 하나로 deterministic frontier가 닫히지 않는다.',
  },
  'WESTERN-P0-INDEPENDENT-DIRECT-ORACLE': {
    blockerImportance: 5, leverage: 3, nonDuplication: 5, authority: 1, acquisition: 1,
    freeAccess: 1, scanCertainty: 1, licenseReuse: 1, deterministicLinkage: 2, wrongMaterialRisk: 1,
    notes: '현재 확인된 direct same-semantic candidate가 없고 known near-miss만 있다. 탐색 가치는 크지만 지금 사용자가 바로 확보할 수 있는 target은 아니다.',
  },
})

const QUALITATIVE_AUDITS = Object.freeze({
  'SAJU-P0-IDENTITY-WITNESS': {
    heldOverlap: 'five local Saju PDFs are locator/comparison material only; acquisition must add catalog identity and a non-clone witness',
    authorityPotential: 'medium: NDL records are confirmed but the immediately visible candidates are modern/restricted rather than free historical scans',
    acquisitionFeasibility: 'low-medium: library request, paid copy or physical access likely',
    freeAccessAssessment: 'low: no confirmed free public page-image route',
    scanCertaintyAssessment: 'low-medium: catalog records exist, target rule pages and scan lineage are not closed',
    licenseReuseAssessment: 'low-medium: copying/republication requires institution or publisher permission',
    deterministicLinkageAssessment: 'high after receipt: full-page hash and exact rule locator can feed Saju observation/checkers',
    wrongMaterialRiskAssessment: 'medium-high risk: same-title modern editions and local exports are easy to mistake for classical witnesses',
    nextFrontier: 'edition identity, direct rule witness, non-clone disagreement matrix',
  },
  'SAJU-P0-CALENDAR-ORACLE': {
    heldOverlap: 'local calendar code and internal fixtures are not external authority; KASI rows would be new observations',
    authorityPotential: 'high: KASI is the national astronomy institution and the service declares its calendar range',
    acquisitionFeasibility: 'high for individual rows; low-medium for a broad corpus',
    freeAccessAssessment: 'medium-high for public query, not confirmed for bulk/download',
    scanCertaintyAssessment: 'low-medium: web rows are observable but not a page-image corpus',
    licenseReuseAssessment: 'low-medium: bulk extraction/commercial reuse terms require confirmation',
    deterministicLinkageAssessment: 'high: request/response row, input timezone and output hash map directly to fixtures',
    wrongMaterialRiskAssessment: 'low-medium if calendar system, timezone and coverage are recorded',
    nextFrontier: 'boundary fixture pack plus independent oracle/certificate and terms',
  },
  'ZIWEI-P0-PALACE-SEMANTIC-WITNESS': {
    heldOverlap: 'Nanbei and Nanyangtang bytes are retained as negative/comparison evidence; NARA item acquisition is an identity-link/admission action, not duplicate reacquisition',
    authorityPotential: 'very high: specific institutional Ming print record with collection, call number and volume metadata',
    acquisitionFeasibility: 'medium-high: official record and viewer/item routes are located; remote image access still needs user confirmation',
    freeAccessAssessment: 'medium: catalog metadata is CC0/public but viewer and page-level image terms are not fully confirmed',
    scanCertaintyAssessment: 'high route certainty, medium target-leaf certainty: official image/item path exists but exact semantic leaf is unreviewed',
    licenseReuseAssessment: 'medium: CC0 metadata is promising, image-level terms and derivative redistribution remain separate',
    deterministicLinkageAssessment: 'very high: actual image bytes → page/leaf/hash → glyph/layout/source observation → bounded coordinate comparison',
    wrongMaterialRiskAssessment: 'low-medium with exact title/call-number/edition checks; high if generic modern reprints are accepted',
    nextFrontier: 'complete 12-palace semantic mapping and human adjudication of source vs production coordinate frames',
  },
  'ZIWEI-P0-CALENDAR-TIME-ORACLE': {
    heldOverlap: 'local solar2lunar path and six external-looking fixtures exist but are not independent authority; evidence would overlap SAJU calendar rows',
    authorityPotential: 'high for calendar observation, not for Ziwei rule semantics',
    acquisitionFeasibility: 'high for exact public rows; medium for independent versioned oracle',
    freeAccessAssessment: 'medium-high for query service, unresolved for bulk',
    scanCertaintyAssessment: 'low-medium: service output rather than scan corpus',
    licenseReuseAssessment: 'low-medium: service terms and bulk reuse unresolved',
    deterministicLinkageAssessment: 'high for exact request/response and boundary fixture reconciliation',
    wrongMaterialRiskAssessment: 'low-medium if time scale, timezone, epoch and leap marker are retained',
    nextFrontier: 'Ziwei fixture reconciliation with independent implementation/version and raw outputs',
  },
  'ZIWEI-P0-CLAIM-SOURCE-IDENTITY': {
    heldOverlap: 'existing occurrence provenance and local PDFs are precisely the material whose lineage must be audited; new NARA witness overlaps the selected target',
    authorityPotential: 'very high if NARA leaf identity and a non-clone second witness are admitted',
    acquisitionFeasibility: 'medium-high bundled with palace witness, lower as a separate search',
    freeAccessAssessment: 'medium and subject to NARA viewer/image terms',
    scanCertaintyAssessment: 'high for official route, medium for complete occurrence-relevant leaves',
    licenseReuseAssessment: 'medium; preserve source terms separately from semantic authority',
    deterministicLinkageAssessment: 'high for occurrence→edition/leaf/hash, lower for automatic claim merge',
    wrongMaterialRiskAssessment: 'medium: mirrors/reprints can look like independent occurrences',
    nextFrontier: 'lineage and duplicate matrix, stable-claim boundary review, unresolved/excluded rows',
  },
  'ZIWEI-P0-TIANFU-CONVENTION': {
    heldOverlap: 'existing Tianfu representation, discrepancy and rotation artifacts already cover numeric relations; new material must be source authority, not another transform',
    authorityPotential: 'high if the Ming witness directly states 安紫微/安天府 coordinate meaning',
    acquisitionFeasibility: 'medium: likely same NARA item but target formula leaves are not yet confirmed',
    freeAccessAssessment: 'medium and unresolved at image level',
    scanCertaintyAssessment: 'medium: NARA route exists, exact readable formula/table pages unknown',
    licenseReuseAssessment: 'medium pending image terms',
    deterministicLinkageAssessment: 'high for raw table rows, low for semantic choice without human review',
    wrongMaterialRiskAssessment: 'high: modern convention tables and output-fit artifacts can be mistaken for authority',
    nextFrontier: 'source-stated Tianfu base/direction/coordinate meaning and disagreement-preserving provenance',
  },
  'WESTERN-P0-SEMANTIC-ADJUDICATION': {
    heldOverlap: 'Swiss/JPL/DE405/Horizons diagnostics are already held; new work is contract adjudication, not duplicate numeric comparison',
    authorityPotential: 'high for technical definitions, insufficient alone for product policy',
    acquisitionFeasibility: 'low-medium: public manuals are easy, cross-source human/product decision is not',
    freeAccessAssessment: 'medium-high for documentation',
    scanCertaintyAssessment: 'high for PDFs/manuals, not for a single same-quantity contract',
    licenseReuseAssessment: 'medium: documentation access differs from code/data deployment rights',
    deterministicLinkageAssessment: 'medium-low until semantic fields are fixed; no tolerance or provider choice allowed',
    wrongMaterialRiskAssessment: 'high: state vector, event time and instantaneous longitude are easily conflated',
    nextFrontier: 'complete semantic contract and independent adjudication record',
  },
  'WESTERN-P0-INDEPENDENT-DIRECT-ORACLE': {
    heldOverlap: 'Swiss, DE405/CSPICE, Horizons, ERFA, Astronomy Engine and Astrolog are known near-misses/diagnostics and must not be reacquired as the missing oracle',
    authorityPotential: 'unknown-low: no confirmed direct same-semantic candidate found',
    acquisitionFeasibility: 'very low under current search; likely requires new provider or user-supplied source',
    freeAccessAssessment: 'low/unknown',
    scanCertaintyAssessment: 'low: target is software/data, not a catalog scan',
    licenseReuseAssessment: 'low/unknown until exact source/data license is obtained',
    deterministicLinkageAssessment: 'medium only after semantic contract and pinned release exist',
    wrongMaterialRiskAssessment: 'very high: a numerically close near-miss can be mislabeled independent authority',
    nextFrontier: 'direct output field, independent lineage, pinned source/data, license, boundary corpus',
  },
})

const RESEARCH_CANDIDATES = [
  {
    id: 'nara-ziwei-record', status: 'confirmed', system: 'ziwei', role: 'official_catalog_identity',
    title: '新鋟希夷陳先生紫微斗数全書', institution: '国立公文書館デジタルアーカイブ / National Archives of Japan',
    urls: [
      'https://www.digital.archives.go.jp/das/meta/F1000000000000101426.html',
      'https://www.digital.archives.go.jp/file/1078787',
    ],
    identity: '請求番号 子０６０－０００１; 明刊本; 選者 陳搏（宋）; 補訂者 潘希尹（明）; 7巻; 2冊; 紅葉山文庫; 公開; metadata CC0',
    access: 'catalog/record confirmed; viewer search result says 館内限定閲覧 and page-level second-use setting must be rechecked',
    freeViewOrDownload: 'not_confirmed',
    supports: ['edition/source identity lead', 'official image route lead', 'rights metadata lead'],
    doesNotSupport: ['target leaf content before visual review', 'automatic palace semantic closure', 'automatic CC0 claim for every image derivative'],
    evidenceNote: 'Official catalog identity is confirmed; full semantic witness remains unobserved in this research pass.',
  },
  {
    id: 'nara-ziwei-volume-one-viewer', status: 'strong_candidate', system: 'ziwei', role: 'official_scan_route',
    title: '新鋟希夷陳先生紫微斗数全書１', institution: 'National Archives of Japan Digital Archive',
    urls: ['https://www.digital.archives.go.jp/img/4468520', 'https://www.digital.archives.go.jp/item/4468520'],
    identity: 'item 4468520; 子０６０－０００１-0001; viewer exposes image/content-download controls in the indexed page',
    access: 'official viewer route exists; the indexed viewer is marked 館内限定閲覧, so remote free page download is not closed',
    freeViewOrDownload: 'uncertain',
    supports: ['page-level acquisition route if user can access viewer/download'],
    doesNotSupport: ['exact leaf numbers for requested sections until page review', 'independent second witness'],
    evidenceNote: 'Strong route candidate, not a confirmed target-page witness.',
  },
  {
    id: 'held-nanyangtang-pdf', status: 'weak_candidate', system: 'ziwei', role: 'held_comparison_only',
    title: '新锓希夷陈先生紫微斗数全书.七卷.宋.陈抟撰.明.潘希尹补.明代南阳堂刊本.黑白版.pdf', institution: 'local held bytes; PDF metadata points to 书格 and NARA record',
    urls: ['https://www.digital.archives.go.jp/das/meta/F1000000000000101426.html'],
    identity: '528 pages; local byte SHA-256 is recorded; PDF producer/subject are derivative metadata, not official source identity',
    access: 'already held locally; provenance is not sufficient for independent authority admission',
    freeViewOrDownload: 'held_not_authority',
    supports: ['comparison locators p148/p172 and file-level identity-linkage investigation'],
    doesNotSupport: ['official original status', 'independent witness status', 'page-level CC0 conclusion'],
    evidenceNote: 'Do not count this PDF as a second witness merely because its embedded metadata names NARA.',
  },
  {
    id: 'wikisource-ziwei-text', status: 'weak_candidate', system: 'ziwei', role: 'search_locator_only',
    title: '紫微斗數全書', institution: 'Wikisource',
    urls: ['https://zh.wikisource.org/wiki/紫微斗數全書'],
    identity: 'text mirror with a stated Qing/public-domain framing; source scan lineage is not established',
    access: 'free public text',
    freeViewOrDownload: 'free_text_only',
    supports: ['search terms and chapter headings'],
    doesNotSupport: ['scan identity', 'edition/leaf witness', 'independent authority'],
    evidenceNote: 'Useful only to locate terms; OCR/transcription is not canonical evidence.',
  },
  {
    id: 'ctext-ziwei-locator', status: 'weak_candidate', system: 'ziwei', role: 'secondary_locator',
    title: '紫微斗數 / 紫微斗數全書 context', institution: 'Chinese Text Project',
    urls: ['https://ctext.org/datawiki.pl?if=gb&res=8418262'],
    identity: 'public text/context page; underlying edition and scan lineage for the target witness are not closed',
    access: 'free public web text',
    freeViewOrDownload: 'free_text_only',
    supports: ['chapter terminology and search expansion'],
    doesNotSupport: ['direct page-image witness', 'independent edition identity', 'semantic authority'],
    evidenceNote: 'Locator assistance only; do not promote its summary or transcription.',
  },
  {
    id: 'google-books-ziwei-modern-edition', status: 'weak_candidate', system: 'ziwei', role: 'confusion_control',
    title: '紫微斗數全書 (modern reprints/preview records)', institution: 'Google Books bibliographic previews',
    urls: ['https://books.google.com/books/about/紫微斗數全書.html?id=OrgFzQEACAAJ'],
    identity: '1985, 494p or other modern editions appear under the same title; not the NARA 明刊本 witness',
    access: 'bibliographic/limited preview only',
    freeViewOrDownload: 'not_free_full_scan',
    supports: ['edition confusion detection'],
    doesNotSupport: ['historical NARA witness', 'independent source admission'],
    evidenceNote: 'Reject as the selected target unless a separate edition-comparison question is explicitly authorized.',
  },
  {
    id: 'kasi-calendar-service', status: 'confirmed', system: 'saju+ziwei', role: 'official_calendar_locator',
    title: '월별 음양력', institution: '한국천문연구원 (KASI)',
    urls: ['https://astro.kasi.re.kr/life/pageView/5'],
    identity: 'official public service; indexed page states input range -59년 02월 to 2050년 12월 and returns lunar/sexagenary rows',
    access: 'public query service',
    freeViewOrDownload: 'public_query_not_bulk_download',
    supports: ['exact boundary fixture observation'],
    doesNotSupport: ['1901–2100 corpus by implication', 'bulk reuse license', 'classical rule authority'],
    evidenceNote: 'Shared upstream candidate; not the selected dossier target.',
  },
  {
    id: 'ndl-ziping-catalog', status: 'confirmed', system: 'saju', role: 'restricted_catalog_candidate',
    title: '原本子平真詮考玄評註 上', institution: '国立国会図書館 (NDL)',
    urls: ['https://ndlsearch.ndl.go.jp/books/R100000039-I12282002'],
    identity: '武田考玄; 秀央社; 1983.10; HR511-201; 2冊; image/jp2; NDL digital collection',
    access: 'library/registered-user restricted; overseas personal transmission not available per indexed record',
    freeViewOrDownload: 'not_free_public',
    supports: ['Saju edition identity lead'],
    doesNotSupport: ['free public page images', 'independent classical witness by itself'],
    evidenceNote: 'Confirmed catalog, poor immediate acquisition fit.',
  },
  {
    id: 'ndl-sanming-catalog', status: 'confirmed', system: 'saju', role: 'restricted_catalog_candidate',
    title: '三命通会 : 明朝版', institution: '国立国会図書館 (NDL)',
    urls: ['https://ndlsearch.ndl.go.jp/en/books/R100000002-I027985956'],
    identity: '萬民英; 鈴木基弘訳; 東洋書院; 2017.2; HR511-L127; 866p; ¥27000; paper',
    access: 'physical/paid modern edition with library holdings',
    freeViewOrDownload: 'not_free_public',
    supports: ['Saju edition locator'],
    doesNotSupport: ['free scan', 'unmediated Ming original witness'],
    evidenceNote: 'Catalog-confirmed but not a free scan and not automatically the historical edition it names.',
  },
  {
    id: 'swiss-true-node-manual', status: 'confirmed', system: 'western', role: 'technical_definition_candidate',
    title: 'Swiss Ephemeris documentation', institution: 'Astrodienst Swiss Ephemeris project',
    urls: ['https://www.astro.com/swisseph-download/doc/swisseph.pdf'],
    identity: 'official project documentation; True Node section is a definition/implementation reference',
    access: 'public PDF',
    freeViewOrDownload: 'public_documentation',
    supports: ['semantic contract fields and implementation description'],
    doesNotSupport: ['independent oracle against Swiss', 'production license decision'],
    evidenceNote: 'Public technical source, not an independent direct oracle.',
  },
  {
    id: 'jpl-horizons-manual', status: 'confirmed', system: 'western', role: 'technical_near_miss',
    title: 'Horizons System Manual', institution: 'NASA/JPL Solar System Dynamics',
    urls: ['https://ssd.jpl.nasa.gov/horizons/manual.html'],
    identity: 'official manual; documents TDB, ecliptic/equinox and osculating-element outputs',
    access: 'public web manual/service',
    freeViewOrDownload: 'public_documentation',
    supports: ['frame/time/state diagnostic fields'],
    doesNotSupport: ['direct complete geocentric tropical instantaneous True Node field'],
    evidenceNote: 'Official and useful, but explicitly a supporting technical near-miss.',
  },
]

const TARGET_REASONS = Object.freeze({
  'ZIWEI-P0-PALACE-SEMANTIC-WITNESS': 'selected: best combination of multi-blocker leverage, official identity, public scan route, and immediate page-image → deterministic semantic-review linkage',
  'SAJU-P0-CALENDAR-ORACLE': 'runner_up_1: strongest shared upstream oracle and easy boundary-row acquisition, but no pinned broad corpus or reuse permission',
  'ZIWEI-P0-CALENDAR-TIME-ORACLE': 'runner_up_2: shared upstream value, but it substantially overlaps the Saju calendar target and does not address source/coordinate semantics',
})

function readJson(root, path) {
  const absolute = path.startsWith('/') ? path : resolve(root, path)
  return JSON.parse(readFileSync(absolute, 'utf8'))
}

function score(metrics) {
  return Number(Object.entries(SCORE_WEIGHTS)
    .reduce((sum, [key, weight]) => sum + (metrics[key] / 5) * weight, 0)
    .toFixed(1))
}

function assertCurrentRepository(root) {
  const branch = git(root, ['branch', '--show-current'])
  const currentHead = git(root, ['rev-parse', 'HEAD'])
  const originMainHead = git(root, ['rev-parse', 'origin/main'])
  const statusLines = git(root, ['status', '--short', '--untracked-files=all']).split('\n').filter(Boolean)
  const preservedJpg = statusLines.some(line => /^\?\?\s+-.jpg$/.test(line)) && existsSync(resolve(root, '-.jpg'))
  if (branch !== 'main') throw new Error(`branch must be main, got ${branch}`)
  if (currentHead !== EXPECTED_HEAD || originMainHead !== EXPECTED_HEAD) throw new Error(`expected HEAD/origin/main ${EXPECTED_HEAD}, got ${currentHead}/${originMainHead}`)
  if (!preservedJpg) throw new Error('existing -.jpg must remain an untracked preserved file')
  return { branch, currentHead, originMainHead, expectedHead: EXPECTED_HEAD, unrelatedUntrackedPreserved: ['-.jpg'] }
}

async function inventoryFile(root, path) {
  const absolute = path.startsWith('/') ? path : resolve(root, path)
  if (!existsSync(absolute)) return { path, exists: false }
  const bytes = await readFile(absolute)
  return { path, exists: true, byteLength: bytes.length, byteSha256: sha256(bytes) }
}

function candidateMap() {
  return Object.fromEntries(RESEARCH_CANDIDATES.map(candidate => [candidate.id, candidate]))
}

function buildSelectedDossier(heldComparison) {
  return {
    targetId: 'ZIWEI-P0-PALACE-SEMANTIC-WITNESS',
    system: 'ziwei',
    blockerIds: ['blocker-palace-semantic-identity', 'blocker-source-identity-unresolved', 'blocker-tianfu-rotation06-semantic-authority'],
    exactMaterialType: 'catalog-linked historical/critical page-image witness; a readable scan is required, not OCR or a modern transcription',
    requiredBibliography: {
      titleTraditional: '新鋟希夷陳先生紫微斗數全書',
      titleSimplified: '新鋟希夷陳先生紫微斗数全書',
      selector: '陳搏（宋） / 潘希尹（明） attribution exactly as the NARA record; do not reduce this to generic 紫微斗數全書',
      era: '明刊本',
      volume: '七巻',
      physicalUnits: '二冊',
      collection: '内閣文庫・漢書・子の部',
      callNumber: '子０６０－０００１',
      formerHolder: '紅葉山文庫',
      language: '中文',
      publication: '刊本, 明',
    },
    preferredInstitutionAndCatalogIdentity: {
      institution: '国立公文書館デジタルアーカイブ / National Archives of Japan',
      recordId: 'F1000000000000101426',
      fileId: '1078787',
      volumeOneItem: '4468520',
      preferredRoute: 'record → file → volume item/viewer; retain the exact image/leaf URL returned by the archive',
    },
    actualCandidateRefs: ['nara-ziwei-record', 'nara-ziwei-volume-one-viewer', 'held-nanyangtang-pdf', 'wikisource-ziwei-text', 'ctext-ziwei-locator', 'google-books-ziwei-modern-edition'],
    accessDecision: {
      catalog: 'confirmed_public_record',
      remoteFreeView: 'not_confirmed: indexed viewer says 館内限定閲覧',
      freeDownload: 'not_confirmed: catalog metadata says CC0, but viewer/page-level reuse/download must be checked on the actual item',
      practicalMinimum: 'user obtains official viewer page images or permitted high-resolution copies, even if only for private review; do not assume redistribution rights',
      ideal: 'direct archive page/JP2 bytes with item-level and image-level terms preserved, plus an independently catalogued second witness',
    },
    minimumAcceptableMaterial: [
      'official NARA record identity capture and the exact volume/item route',
      'complete, readable target leaf images, not a cropped diagram',
      'cover/title/author-editor/edition/volume or folio context',
      'target pages that visibly connect palace labels, branch glyphs, diagram slots, ordinal/base and direction; if the witness separates them, capture every linked leaf and its adjacency',
      'original image/PDF bytes or permitted page captures with page/leaf identifiers and SHA-256',
    ],
    idealStrongestMaterial: [
      'lossless/high-resolution NARA page images with a stable item/leaf identifier and explicit image-level reuse terms',
      'a second non-clone catalogued edition with cover/colophon and aligned target leaves',
      'a preserved disagreement matrix for palace-name order, branch order, 命宮·身宮 direction, and 紫微→天府 relation',
      'reviewer-confirmed source/production coordinate comparison, with no compatibility transform chosen automatically',
    ],
    knownComparisonLocators: [
      { source: 'held Nanbei comparison PDF; not the target authority', page: 'PDF p7', printedLeaf: 'not recorded in current packet', section: '十二宮冠蓋', purpose: '12-cell branch diagram; existing negative evidence says palace labels are not visible' },
      { source: 'held Nanbei comparison PDF; not the target authority', page: 'PDF p8', printedLeaf: 'not recorded in current packet', section: '定命、身二宮', purpose: '寅起月 / 命宮逆數 / 身宮順數 traversal vocabulary' },
      { source: 'held Nanbei comparison PDF; not the target authority', page: 'PDF p10', printedLeaf: 'not recorded in current packet', section: '命宮·身宮·五行局', purpose: 'candidate anchor/table context' },
      { source: 'held Nanbei comparison PDF; not the target authority', page: 'PDF p11–p12', printedLeaf: '三十一 / 三十三', section: '起紫微五訣 / 起紫微簡索表', purpose: '紫微 branch/ordinal table context' },
      { source: 'held Nanbei comparison PDF; not the target authority', page: 'PDF p13', printedLeaf: '三十四', section: '甲六、安天府', purpose: '12-row 紫微→天府 table; existing evidence is relation/table order only' },
      { source: 'held Nanyangtang derivative PDF; not an accepted official locator', page: 'PDF p148 and p172', printedLeaf: 'printed page not legible in current direct capture', section: '紫微/天府 series and 安天府圖', purpose: 'search-start hints only; verify against official NARA leaf identity' },
      { source: 'official NARA candidate', page: 'leaf/item number must be captured from volume item 4468520', printedLeaf: 'not yet confirmed; do not guess', section: 'search visually for the headings below', purpose: 'full acceptance requires exact archive leaf IDs after the user obtains the images' },
    ],
    searchAndCaptureTerms: {
      ChineseTraditional: ['十二宮冠蓋', '定命身二宮', '命宮逆數', '身宮順數', '寅起月', '紫微五訣', '安紫微', '安天府', '安天府圖', '命宮', '身宮', '兄弟', '夫妻', '子女', '財帛', '疾厄', '遷移', '僕役', '官祿', '田宅', '福德', '父母'],
      ChineseSimplified: ['十二宫冠盖', '定命身二宫', '命宫逆数', '身宫顺数', '寅起月', '紫微五诀', '安紫微', '安天府', '安天府图'],
      Japanese: ['新鋟希夷陳先生紫微斗数全書', '内閣文庫 子060-0001', '紫微斗数全書 明刊本', '潘希尹 補訂', '陳搏 紫微斗数'],
      Korean: ['자미두수 전서 명간본 남양당', '자미두수 십이궁 관개 명궁 신궁', '명궁 역수 신궁 순수', '안자미 안천부 원문 스캔'],
      English: ['"Xin kan Xi Yi Chen xiansheng Ziwei doushu quanshu"', 'National Archives of Japan Ziwei Dou Shu', 'Ming printed edition Ziwei dou shu quanshu Pan Xiyin', 'palace branch diagram 命宮 身宮'],
      institutionQueries: ['site:digital.archives.go.jp "F1000000000000101426"', 'site:digital.archives.go.jp "子０６０－０００１"', 'site:ndlsearch.ndl.go.jp 紫微斗数全書', 'site:rarebooks.ncl.edu.tw 紫微斗數全書', 'site:archive.org/details 紫微斗數全書 原本 scan'],
      editionKeywords: ['明刊本', '七巻', '二冊', '新鋟', '潘希尹補訂', '内閣文庫', '子０６０－０００１', '紅葉山文庫', '嘉靖', '原刻/影印', '卷一/卷二'],
      avoidConfusions: ['南北山人編註 modern/repaired reprint', '1984/1985/2000/2008/2025 commercial modern editions', 'Wikisource/CTP transcription', 'Shuge or Internet Archive derivative PDF without source lineage', 'OCR-only text, cropped diagram, screenshot without item/leaf identity', 'a second URL serving identical local PDF bytes'],
    },
    mustBeVisible: [
      'all 12 palace names or an explicit linked table that names them',
      'all 12 branch glyphs and their physical diagram slots',
      'orientation/order plus any ordinal/base statement, especially 寅起月',
      '命宮逆數 and 身宮順數 with a clear subject and starting point',
      'where claimed for Tianfu, 安紫微/安天府, 12-row relation, base branch, direction and whether the coordinate is semantic palace or raw slot',
      'page/leaf marker and surrounding source context; no hidden table edge or crop',
    ],
    acceptCriteria: [
      'NARA identity fields, retrieved item/leaf route, page/folio marker and actual bytes agree; no title-only admission',
      'glyphs/layout/table boundaries are directly readable at full-page scale',
      'the witness directly connects the required semantic edges, or every split leaf and cross-reference is captured so a reviewer can reconstruct the connection',
      'the file lineage is documented and any second witness is demonstrably non-clone',
      'authority, observation, licensing and semantic interpretation are separate intake fields',
    ],
    rejectCriteria: [
      'catalog record without target page images or exact leaf IDs',
      'OCR, transcription, modern commentary or numeric rotation fit used as the witness',
      'cropped/partial diagram that hides labels, arrows, subject or table boundary',
      'same local 528-page derivative presented as an independent NARA witness',
      'modern reprint or title match without 明刊本/潘希尹/七巻二冊 identity evidence',
      'CC0 metadata treated as proof that every downloaded image derivative may be redistributed',
      'source/production semantic equivalence inferred from the repository’s `rotation-06` output',
    ],
    wrongEditionDiscrimination: [
      'require the exact long title and attribution pair; generic 紫微斗數全書 is insufficient',
      'require NARA call number 子０６０－０００１, 明刊本, 7巻, 2冊 and collection metadata',
      'check cover,序/跋/刊記/colophon, volume markers and leaf topology against the catalog',
      'record any modern punctuation, annotations, repairs, simplified glyphs or re-pagination as a derivative layer',
      'do not use a same-title 1980s/2000s/2025 commercial edition as a Ming witness',
    ],
    cloneAndReprintRules: [
      'a file hash proves byte identity only; identical page images or identical defects prove shared lineage, not independence',
      'embedded NARA URL/subject in a PDF is locator evidence, not proof the bytes were downloaded from NARA',
      'modern transcription, OCR and a reprint can be retained as navigation aids but never counted as independent witnesses',
      'a second witness must have its own catalog identity and demonstrably different provenance before disagreement counting',
    ],
    fileChecksOnReceipt: {
      pageCount: 'record PDF page count and separately record printed folio/leaf count; do not equate them',
      hash: 'SHA-256 the exact unedited downloaded bytes; hash each extracted/rendered target page only as a derivative',
      metadata: ['title', 'author/creator', 'publisher/collection', 'creation/modification metadata', 'producer/derivative tool', 'encryption', 'file size', 'MIME/container', 'download URL and timestamp'],
      bibliography: ['institution', 'record/item/file ID', 'call number', 'title', 'author/editor', 'era/edition', 'volume/book count', 'language', 'folio/page markers', 'terms/rights'],
      integrity: 'retain original bytes and a manifest; never normalize away glyph/layout evidence before review',
    },
    postAcquisitionBlockerAdvance: [
      { blockerId: 'blocker-source-identity-unresolved', condition: 'catalog/edition/leaf/bytes lineage is complete', boundedAdvance: 'source identity observation may become review-ready; stable claim boundary remains open' },
      { blockerId: 'blocker-palace-semantic-identity', condition: 'all palace-name ↔ branch ↔ slot ↔ ordinal/direction edges are directly visible and semantically reviewed', boundedAdvance: 'may move to pending human adjudication or scoped support; never automatic verified/readiness' },
      { blockerId: 'blocker-tianfu-rotation06-semantic-authority', condition: 'source directly states the Tianfu relation and its coordinate meaning, not only a numeric table match', boundedAdvance: 'formula/source authority discrepancy can be adjudicated; production convention remains unchanged until explicit decision' },
    ],
    noAutomaticPromotion: ['claim promotion', 'stableClaimCount', 'readiness', 'grounding', 'activation', 'production coordinates', 'legacy/source-aligned default', 'deploy or remote state'],
    lunaNextGoalVerificationPlan: [
      'obtain the official NARA volume/item page images or permitted copies and record exact leaf IDs before interpreting content',
      'materialize a successor Ziwei source-observation packet from actual bytes, page count, metadata and page-image hashes',
      'run check-ziwei-archive-scan-source-witness-admission-v0.mjs and check-ziwei-palace-semantic-source-frontier-v1.mjs; preserve all negative findings',
      'run the existing palace-source-acquisition-field-kit checker and source-identity claim-boundary checker with the new intake refs',
      'compare the direct source rows with current production coordinates as a diagnostic only; do not select rotation-06 or modify legacy behavior',
      'write a human adjudication record that separately classifies direct witness, deterministic relation, semantic interpretation and license',
    ],
  }
}

export async function buildArtifact({ root = resolve(new URL('..', import.meta.url).pathname) } = {}) {
  const scope = assertCurrentRepository(root)
  const sourceKitBytes = await readFile(resolve(root, SOURCE_FIELD_KIT_PATH))
  const sourceKit = JSON.parse(sourceKitBytes)
  const sourceDoc = await readFile(resolve(root, SOURCE_FIELD_KIT_DOC))
  const sourceInputPaths = [SOURCE_FIELD_KIT_PATH, SOURCE_FIELD_KIT_DOC, 'docs/ziwei-palace-coordinate-semantic-identity-v0.md', 'docs/astrology-v1-external-evidence-frontier-v1.md']
  const sourceInputs = []
  for (const path of sourceInputPaths) sourceInputs.push({ path, ...(await inventoryFile(root, path)) })
  const heldComparison = sourceKit.evidenceInventory?.alreadyHeld?.find(item => item.id === 'ziwei-local-nanyangtang-528p')
  if (!heldComparison) throw new Error('source Field Kit missing held Nanyangtang comparison candidate')
  const heldActual = await inventoryFile(root, heldComparison.path)
  if (!heldActual.exists || heldActual.byteSha256 !== heldComparison.byteSha256) throw new Error('held Nanyangtang actual bytes do not match predecessor inventory')
  const p0SourceTargets = sourceKit.targets.filter(target => target.priority === 'P0')
  if (p0SourceTargets.length !== 8) throw new Error(`expected exactly 8 P0 source targets, got ${p0SourceTargets.length}`)
  const p0Targets = p0SourceTargets.map(target => {
    const audit = SCORE_AUDITS[target.id]
    if (!audit) throw new Error(`missing score audit for ${target.id}`)
    return { ...target, priorityAudit: { ...audit, ...QUALITATIVE_AUDITS[target.id], weightedScore: score(audit), selectionReason: TARGET_REASONS[target.id] || 'not_selected' } }
  }).sort((a, b) => b.priorityAudit.weightedScore - a.priorityAudit.weightedScore || a.id.localeCompare(b.id))
  const dossier = buildSelectedDossier({ ...heldComparison, actual: heldActual })
  const sourceKitInput = {
    path: SOURCE_FIELD_KIT_PATH,
    byteSha256: sha256(sourceKitBytes),
    predecessorVerdict: sourceKit.verdictToken,
    predecessorGenerationBasis: sourceKit.scope?.expectedHead || null,
    predecessorDocumentSha256: sha256(sourceDoc),
    p0ReconstructedIds: p0Targets.map(target => target.id),
  }
  return {
    schemaVersion: SCHEMA,
    verdictToken: VERDICT,
    materializer: { path: 'scripts/materialize-tri-system-p0-acquisition-priority-and-dossier-v1.mjs', version: MATERIALIZER_VERSION },
    scope: {
      ...scope,
      productionActivation: false,
      readinessPromotion: false,
      claimPromotion: false,
      deploy: false,
      remoteDatabaseMutation: false,
      commit: false,
      push: false,
    },
    sourceOfTruth: {
      predecessorFieldKit: sourceKitInput,
      currentRepositoryBasis: EXPECTED_HEAD,
      sourceInputs,
      method: 'P0 list and blocker mapping are copied from the current predecessor artifact; priority scores and dossier are additive successor data',
    },
    comparisonContract: {
      scale: '0–5; higher is better. wrongMaterialRisk means lower risk. Scores are acquisition-planning judgments, not readiness or claim evidence.',
      weights: SCORE_WEIGHTS,
      scoreFormula: 'sum(metric / 5 * weight), one decimal; sort descending then target ID',
      criteria: ['blocker importance', 'multi-blocker leverage', 'non-duplication against held material', 'authority potential', 'actual acquisition feasibility', 'free/public access', 'catalog/scan certainty', 'license/reuse', 'deterministic evidence linkage', 'wrong-material risk'],
    },
    currentAudit: {
      p0Count: p0Targets.length,
      p0Systems: { saju: 2, ziwei: 4, western: 2 },
      readinessPromotionBoundary: 'unchanged; this artifact cannot advance readiness, claim, evidence authority, activation or production',
      existingUntrackedPreserved: scope.unrelatedUntrackedPreserved,
    },
    rankedP0Targets: p0Targets,
    priorityDecision: {
      rank1: p0Targets[0].id,
      rank2: p0Targets[1].id,
      rank3: p0Targets[2].id,
      runnerUps: [p0Targets[1].id, p0Targets[2].id],
      decisionRule: 'rank only after all eight P0 targets were reconstructed and scored on the same ten criteria; no famous-title or P0-label shortcut',
      selectedReason: TARGET_REASONS[p0Targets[0].id],
    },
    researchCandidates: RESEARCH_CANDIDATES,
    selectedDossier: dossier,
    heldMaterialCheck: { predecessorRecord: heldComparison, actualBytes: heldActual, role: 'comparison/identity-linkage only; not an independent official witness' },
    verificationContract: {
      confirmedMeans: 'official identity or technical source fact was observed in an institutional record/manual; it does not mean target content was accepted',
      strongCandidateMeans: 'institutional route plausibly exposes target material but exact page/leaf/terms remain unconfirmed',
      weakCandidateMeans: 'text mirror, derivative, modern edition or locator only; never a source witness',
      promotionBoundary: { automaticClaimPromotion: false, automaticEvidencePromotion: false, automaticReadinessPromotion: false, automaticActivation: false, automaticProductionChange: false, humanReviewRequired: true },
      requiredPostAcquisitionSeparation: ['authority', 'direct observation', 'deterministic relation', 'semantic interpretation', 'license/reuse'],
    },
    deterministic: { generatedAt: null, networkFetch: false, sourceAcquisitionPerformed: false, actualByteHashes: true, canonicalFinalLf: true },
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
  process.stdout.write(JSON.stringify({ artifactPath: ARTIFACT_PATH, schema: artifact.schemaVersion, verdict: artifact.verdictToken, rank1: artifact.priorityDecision.rank1, rank2: artifact.priorityDecision.rank2, rank3: artifact.priorityDecision.rank3 }, null, 2) + '\n')
}

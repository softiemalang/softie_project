import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

export const SCHEMA = 'tri-system-evidence-acquisition-field-kit-v1'
export const VERDICT = 'complete_tri_system_evidence_acquisition_field_kit_exhausted_uncommitted'
export const MATERIALIZER_VERSION = '1.0.0'
export const EXPECTED_HEAD = 'c327167ad490e808815cda3fe52e06304ca09c52'
export const ARTIFACT_PATH = `artifacts/${SCHEMA}/complete.json`

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const stable = value => Array.isArray(value)
  ? value.map(stable)
  : value && typeof value === 'object'
    ? Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])]))
    : value
export const canonicalJson = value => `${JSON.stringify(stable(value), null, 2)}\n`
const git = (root, args) => execFileSync('git', ['-c', 'core.fsmonitor=false', ...args], { cwd: root, encoding: 'utf8' }).trim()
const isCommit = value => typeof value === 'string' && /^[0-9a-f]{40}$/.test(value)
const isSha256 = value => typeof value === 'string' && /^[0-9a-f]{64}$/.test(value)

const SOURCE_INPUTS = [
  'artifacts/saju-v1-local-frontier-v0/complete.json',
  'artifacts/saju-local-source-corpus-observation-v1/complete.json',
  'artifacts/saju-five-classics-grounding-v0/complete.json',
  'artifacts/saju-readiness-grounding-v0.json',
  'artifacts/ziwei-inherited-evidence-consumption-frontier-v1/complete.json',
  'artifacts/ziwei-palace-semantic-source-frontier-v1/complete.json',
  'artifacts/ziwei-palace-source-acquisition-field-kit-v0/complete.json',
  'artifacts/ziwei-four-transformations-source-evidence-v0/complete.json',
  'artifacts/ziwei-major-star-claim-readiness-reconciliation-v0/complete.json',
  'artifacts/ziwei-readiness-baseline-v1/complete.json',
  'artifacts/astrology-true-node-independent-frontier-v4/complete.json',
  'artifacts/astrology-verified-readiness-v1.json',
  'artifacts/tri-system-readiness-v1/inventory.json',
  'src/interpretationPrep/triSystemReadinessContract.js',
  'src/interpretationPrep/evidenceBoundary.js',
  'src/interpretationPrep/sajuV1LocalFrontier.js',
  'src/ziwei/ziweiContract.js',
  'src/ziwei/ziweiResolver.js',
  'src/ziwei/transformationRules.js',
  'src/astrology/astrologyContract.js',
  'src/astrology/planetResolver.js',
  'docs/astrology-true-node-reference.md',
  'docs/astrology-license-resolution.md',
]

const EXTERNAL_LOCAL_SOURCES = [
  {
    id: 'saju-local-ziping-zhenquan',
    system: 'saju',
    path: '/Users/softie/Documents/malang_lab/documents/子平真诠-沈孝瞻原著.pdf',
    fileName: '子平真诠-沈孝瞻原著.pdf',
    pageCount: 27,
    sourceForm: 'modern_typeset_local_export',
    observedAttribution: '沈孝瞻原著（封面/标题页标识）',
    authorityStatus: 'held_but_authority_insufficient',
    reason: 'actual bytes are hashable, but edition identity, transmission history and independent witness are unresolved',
    reuse: 'compare target sections and identity metadata; do not count as an independent witness',
  },
  {
    id: 'saju-local-ditian-sui',
    system: 'saju',
    path: '/Users/softie/Documents/malang_lab/documents/滴天髓.pdf',
    fileName: '滴天髓.pdf',
    pageCount: 158,
    sourceForm: 'derived_typeset_export_with_linked_attribution',
    observedAttribution: '刘基（导出页标识）',
    authorityStatus: 'held_but_authority_insufficient',
    reason: 'linked attribution is not a catalog-identified edition or independent textual witness',
    reuse: 'strength and yongshin locator candidate only',
  },
  {
    id: 'saju-local-yuanhai-ziping',
    system: 'saju',
    path: '/Users/softie/Documents/malang_lab/documents/淵海子平.pdf',
    fileName: '淵海子平.pdf',
    pageCount: 202,
    sourceForm: 'web_text_export_with_explicit_source_warning',
    observedAttribution: '杨淙（导出页标识）',
    authorityStatus: 'held_but_authority_insufficient',
    reason: 'source warning and web-text derivation prevent primary authority admission',
    reuse: 'ten-god and hidden-stem locator candidate only',
  },
  {
    id: 'saju-local-qiongtong-baojian',
    system: 'saju',
    path: '/Users/softie/Documents/malang_lab/documents/穷通宝鉴.pdf',
    fileName: '穷通宝鉴.pdf',
    pageCount: 92,
    sourceForm: 'modern_typeset_local_export',
    observedAttribution: null,
    authorityStatus: 'held_but_authority_insufficient',
    reason: 'edition and attribution are unresolved in the local byte corpus',
    reuse: 'seasonal-strength locator candidate only',
  },
  {
    id: 'saju-local-sanming-tonghui',
    system: 'saju',
    path: '/Users/softie/Documents/malang_lab/documents/三命通會.pdf',
    fileName: '三命通會.pdf',
    pageCount: 370,
    sourceForm: 'web_text_export_with_public_domain_notice',
    observedAttribution: '万民英（导出页标识；书前说明仍需独立书目核验）',
    authorityStatus: 'held_but_authority_insufficient',
    reason: 'public-domain notice and attribution are not a scan identity or independent edition record',
    reuse: 'five-elements and shinsal locator candidate only',
  },
  {
    id: 'ziwei-local-nanbei-219p',
    system: 'ziwei',
    path: '/Users/softie/Documents/命-南北山人_紫微斗数全书.pdf',
    fileName: '命-南北山人_紫微斗数全书.pdf',
    pageCount: 219,
    sourceForm: 'local_scan_export',
    observedAttribution: '南北山人 / 紫微斗數全書 surface title',
    authorityStatus: 'held_but_authority_insufficient',
    reason: 'actual scan bytes and readable observations exist, but the local file is not a catalog-linked textual authority',
    reuse: 'retain p4, p7, p8, p10 observations; do not infer palace semantic identity',
  },
  {
    id: 'ziwei-local-nanyangtang-528p',
    system: 'ziwei',
    path: '/Users/softie/Documents/malang_lab/documents/新锓希夷陈先生紫微斗数全书.七卷.宋.陈抟撰.明.潘希尹补.明代南阳堂刊本.黑白版.pdf',
    fileName: '新锓希夷陈先生紫微斗数全书.七卷.宋.陈抟撰.明.潘希尹补.明代南阳堂刊本.黑白版.pdf',
    pageCount: 528,
    sourceForm: 'archive_scan_export',
    observedAttribution: '日本内阁文库 / 明代南阳堂刊本 metadata is embedded in the local PDF',
    authorityStatus: 'held_but_authority_insufficient',
    reason: 'the official catalog identity is now locatable, but local byte linkage, page/folio capture and semantic review remain unclosed',
    reuse: 'high-leverage candidate for identity-linked review; not a new independent witness by itself',
  },
]

const SOURCE_RESEARCH = [
  {
    id: 'source-kasi-lunar-calendar',
    system: 'saju',
    status: 'confirmed_official_locator',
    authorityRole: 'official calendar-service and institutional policy locator',
    title: '한국천문연구원 월별 음양력 / 역과시간 자료',
    institution: '한국천문연구원 (KASI)',
    locator: 'https://astro.kasi.re.kr/life/pageView/5',
    access: 'public web service; displayed range is -59 to 2050-12, so 2051-2100 coverage must be requested or sourced separately',
    license: 'service terms and reuse rights for bulk extraction are not established; do not mirror data without confirmation',
    supports: ['lunar-solar correspondence locator', 'leap-month observations', 'sexagenary date display'],
    doesNotSupport: ['classical Saju rule authority', 'automatic 1901-2100 bulk-data license', 'missing-birth-time policy'],
  },
  {
    id: 'source-kasi-ephemeris-certificate',
    system: 'saju',
    status: 'confirmed_official_locator',
    authorityRole: 'official request channel for lunar-solar and astronomical certificate data',
    title: '음양력 대조증명서 및 천문정보자료 신청',
    institution: '한국천문연구원 (KASI)',
    locator: 'https://www.kasi.re.kr/kor/publication/pageView/131',
    access: 'request and fee; not an openly downloadable corpus',
    license: 'individual certificate use is described; bulk/commercial redistribution requires written confirmation',
    supports: ['auditable date-specific calendar evidence', 'official request provenance'],
    doesNotSupport: ['sexagenary hour-stem convention', 'classical text transmission identity'],
  },
  {
    id: 'source-kriss-utc-korea',
    system: 'saju',
    status: 'confirmed_official_locator',
    authorityRole: 'official Korean standard-time reference',
    title: '대한민국표준시 / UTC(KRIS)',
    institution: '한국표준과학연구원 (KRISS)',
    locator: 'https://www.kriss.re.kr/board.es?bid=0031&mid=a10603000000',
    access: 'public institutional documentation; operational service terms apply',
    license: 'not a blanket license for copying or reselling the synchronization service',
    supports: ['UTC(KRIS) and KST relationship', 'time-scale provenance'],
    doesNotSupport: ['true-solar-time astrology rule', 'classical 子時 boundary semantics'],
  },
  {
    id: 'source-ndl-ziping-original-commentary',
    system: 'saju',
    status: 'confirmed_catalog_candidate',
    authorityRole: 'catalog identity and access locator, not a freely reusable original scan',
    title: '原本子平真詮考玄評註',
    institution: '国立国会図書館 (National Diet Library)',
    catalogIdentity: 'NDL BibID 000001683371; call no. HR511-201; digital PID 12282002',
    locator: 'https://ndlsearch.ndl.go.jp/books/R100000002-I000001683371',
    access: 'catalog confirmed; digital view is library/registered-user restricted; physical holdings exist',
    license: 'library access is not a reproduction license; obtain permitted page images or copies through NDL rules',
    supports: ['edition and author/editor identity', 'candidate pages for 格局/用神/行運 comparison'],
    doesNotSupport: ['unrestricted redistribution', 'independent witness until its textual relation to the local export is documented'],
  },
  {
    id: 'source-ndl-sanming-ming-edition',
    system: 'saju',
    status: 'confirmed_catalog_candidate',
    authorityRole: 'catalog identity for a modern reprint explicitly titled 明朝版',
    title: '三命通会 : 明朝版',
    institution: '国立国会図書館 (National Diet Library)',
    catalogIdentity: 'NDL BibID 027985956; call no. HR511-L127; 866p; 東洋書院 2017',
    locator: 'https://ndlsearch.ndl.go.jp/books/R100000002-I027985956',
    access: 'physical/paid modern edition; NDL and cooperating-library holdings',
    license: 'commercial edition; page-image capture and redistribution require permission',
    supports: ['edition comparison and 明朝版 identity lead', 'rules/sections to compare with local export'],
    doesNotSupport: ['proof that the local 370-page export is the same edition', 'open-license scan'],
  },
  {
    id: 'source-ctext-saju-pages',
    system: 'saju',
    status: 'confirmed_project_locator_candidate',
    authorityRole: 'search and section locator only; project states OCR is a draft from a base scan',
    title: '中國哲學書電子化計劃 pages for 三命通會, 淵海子平, 子平真詮評注',
    institution: 'Chinese Text Project',
    locator: 'https://ctext.org/wiki.pl?chapter=548506&if=gb',
    access: 'public web text and linked image context',
    license: 'project/text reuse terms must be checked per page; OCR text is not accepted as the source image',
    supports: ['chapter/section search anchors', 'candidate phrase discovery'],
    doesNotSupport: ['OCR-only claim verification', 'edition identity without the linked base scan and catalog record'],
  },
  {
    id: 'source-japan-archives-ziwei-nanyangtang',
    system: 'ziwei',
    status: 'confirmed_official_open_scan_locator',
    authorityRole: 'official catalog identity, public scan locator and CC0 metadata',
    title: '新鋟希夷陳先生紫微斗数全書',
    institution: '国立公文書館デジタルアーカイブ / National Archives of Japan',
    catalogIdentity: 'F1000000000000101426; call no. 子060-0001; 明刊本; 7卷; 2冊; selected 陳搏（宋）/潘希尹（明）',
    locator: 'https://www.digital.archives.go.jp/das/meta/F1000000000000101426.html',
    imageLocator: 'https://www.digital.archives.go.jp/file/1078787',
    access: 'public; catalog says 公開 and image download is available',
    license: 'catalog metadata says CC0; verify the downloaded image file and any page-level terms before redistribution',
    supports: ['edition identity and page-image witness acquisition', 'palace/branch/major-star/transformation page search'],
    doesNotSupport: ['automatic semantic mapping', 'agreement with production ordinal without page-level review'],
  },
  {
    id: 'source-swiss-true-node-manual',
    system: 'western',
    status: 'confirmed_official_technical_source',
    authorityRole: 'Swiss True Node definition and implementation-description source; not independent of the target quantity',
    title: 'Swiss Ephemeris 2.10 Lunar and Planetary Nodes and Apsides',
    institution: 'Astrodienst Swiss Ephemeris project',
    catalogIdentity: 'official PDF, section 2.2.2 True Node, printed pp. 17-18 / PDF p. 20-21',
    locator: 'https://www.astro.com/swisseph-download/doc/swisseph.pdf',
    access: 'public PDF',
    license: 'documentation access is public; code/data licensing remains dual-license and separate',
    supports: ['traditional osculating-node semantic description', 'JPL/Swiss precision comparison statement'],
    doesNotSupport: ['independent oracle status', 'permission to deploy Swiss code/data'],
  },
  {
    id: 'source-jpl-horizons-manual',
    system: 'western',
    status: 'confirmed_official_technical_source',
    authorityRole: 'official state-vector, frame, time-scale and osculating-element source; not a direct product True Node field',
    title: 'Horizons System Manual',
    institution: 'NASA Jet Propulsion Laboratory Solar System Dynamics',
    locator: 'https://ssd.jpl.nasa.gov/horizons/manual.html',
    access: 'public web manual and service',
    license: 'manual/service terms and JPL data redistribution rules must be checked for retained output',
    supports: ['geometric versus apparent', 'ecliptic of date/J2000', 'TDB and osculating OM/state semantics', 'DE441 provenance'],
    doesNotSupport: ['Swiss SE_TRUE_NODE equivalence', 'direct tropical True Node longitude'],
  },
  {
    id: 'source-astronomy-engine',
    system: 'western',
    status: 'confirmed_open_source_near_miss',
    authorityRole: 'independent open-source event/position library; near-miss, not a direct True Node oracle',
    title: 'Astronomy Engine',
    institution: 'Cosine Kitty project',
    catalogIdentity: 'official repository default branch/release metadata must be pinned at intake',
    locator: 'https://github.com/cosinekitty/astronomy',
    access: 'public repository; MIT license is exposed by the repository',
    license: 'MIT candidate, but verify exact pinned release and third-party model notices',
    supports: ['independent Moon state and coordinate transforms', 'license-usable derivation building block'],
    doesNotSupport: ['instantaneous True Node longitude API', 'semantic bridge to SE_TRUE_NODE'],
  },
  {
    id: 'source-astrolog-pinned',
    system: 'western',
    status: 'held_local_near_miss',
    authorityRole: 'independent labelled approximation observed locally; not production authority',
    title: 'Astrolog 8.00 Matrix-only pinned source',
    institution: 'CruiserOne / Astrolog',
    catalogIdentity: 'commit 5bf172ea231c4b6ea3d7e09ca307571354a41e8a',
    locator: 'https://github.com/CruiserOne/Astrolog/tree/5bf172ea231c4b6ea3d7e09ca307571354a41e8a',
    access: 'public source; local raw fixtures and build audit already held',
    license: 'GPL-2.0-or-later; not adopted as a product dependency',
    supports: ['independent algorithm-path diagnostic', 'label/approximation observation'],
    doesNotSupport: ['high-precision semantic authority', 'license-compatible production dependency under current policy'],
  },
]

const SAJU_TARGETS = [
  {
    id: 'SAJU-P0-IDENTITY-WITNESS', system: 'saju', priority: 'P0', candidateStatus: 'action_required', highLeverage: true,
    blockerIds: ['saju-b-source-identity', 'saju-b-core-rule-scope'], packetIds: [
      'saju-source-packet-core-four-pillars-v0', 'saju-source-packet-core-element-distribution-v0',
      'saju-source-packet-core-ten-god-distribution-v0', 'saju-source-packet-rule-branch-relations-v0',
      'saju-source-packet-rule-gyeokguk-v0', 'saju-source-packet-rule-strength-v0', 'saju-source-packet-rule-yongshin-v0',
    ],
    material: {
      minimumSet: ['catalog record/holding identity for the exact local title', 'cover/title/author/editor/colophon pages', 'full-page images of the local observed sections plus adjacent context', 'one separately identified witness for at least 子平真詮 or 三命通會'],
      idealSet: ['a catalog-linked historical or critical edition for each rule family', 'two non-clone witnesses with page/folio alignment and a preserved disagreement matrix', 'unrestricted or explicitly permitted page-image bytes'],
      namedTargets: ['NDL 000001683371 / PID 12282002 for 子平真詮 identity lead', 'NDL 027985956 HR511-L127 for 三命通会 明朝版 comparison lead', 'official/cultural-heritage catalog or scan of a premodern witness if the NDL modern editions cannot expose the required pages'],
    },
    locator: {
      requiredSections: ['子平真詮 p2 一、論十干十二支; p5 七、論刑沖會合解法; p26 格局/雜格 candidate section', '淵海子平 p2 十干, p4 藏干, p6 日主/日為主, p7 月令, p8 行運', '滴天髓 p2-6 and 穷通宝鉴 seasonal sections', '三命通會 element/神煞 sections'],
      capture: ['page/folio number', 'exact original sentence/table text as visible', 'surface/hidden-stem scope', 'author/editor/edition/colophon context'],
    },
    purpose: 'close edition/transmission identity and provide direct rule witnesses without treating a local export or modern transcription as an independent original.',
    currentGap: 'Five local PDFs have actual byte hashes and locator observations, but all remain edition_unresolved; claim-level classical verification is 0.',
    notDuplicateOf: ['saju-local-ziping-zhenquan', 'saju-local-ditian-sui', 'saju-local-yuanhai-ziping', 'saju-local-qiongtong-baojian', 'saju-local-sanming-tonghui'],
    accept: ['institution/catalog identity matches title, author/editor, volume/page or folio and the retrieved bytes', 'target rule is directly readable in the page image with enough context to identify inputs, outputs and scope', 'independent witness is not merely a mirror, OCR, web transcription or modern table copied from the local file', 'edition disagreement is preserved rather than silently reconciled'],
    reject: ['catalog title without page image or colophon', 'OCR-only or modern summary table', 'same local export mirrored under another URL', 'a page that lists terms but does not state the rule scope', 'numeric agreement used as proof of semantic identity'],
    provenanceChecks: ['record institution, catalog ID, call number, title, author/editor, edition/date, volume/folio/page and retrieval URL', 'hash original downloaded bytes and retain unedited capture', 'compare local PDF hash and page topology; do not call a match an independent witness without lineage review'],
    licensing: { access: 'mixed: restricted/paid catalog candidates plus possible public scan', rights: 'catalog access is not redistribution permission; request page-image/reproduction rights before storing or publishing', policyDecision: 'human review required' },
    verificationPlan: ['materialize source observation packet with actual page-image hashes and exact locators', 'run Saju source-claim observation and five-classics checkers', 'keep source observation, deterministic relation and semantic equivalence as separate edges', 'do not change Saju readiness or production code automatically'],
    expectedChange: { claim: 'source_unresolved may become partially_supported only for directly witnessed fields after review', readiness: 'stable claim boundary may advance only by an explicit native Saju gate; availableForInterpretation remains false by default', production: 'unchanged' },
    rationale: 'single highest-leverage Saju action: identity plus direct rule coverage can support most core packets, while the independent witness prevents re-counting the five local exports.', difficulty: 'high', confidence: 'medium', sourceRefs: ['source-ndl-ziping-original-commentary', 'source-ndl-sanming-ming-edition', 'source-ctext-saju-pages'],
  },
  {
    id: 'SAJU-P0-CALENDAR-ORACLE', system: 'saju', priority: 'P0', candidateStatus: 'action_required', highLeverage: true,
    blockerIds: ['saju-b-calendar-boundaries'], packetIds: ['saju-source-packet-core-four-pillars-v0', 'saju-source-packet-core-candidate-boundary-v0'],
    material: { minimumSet: ['KASI date-specific lunar/solar and leap-month evidence for boundary fixtures', 'official 24절기/역서 output with timezone/epoch metadata', 'independent standard-time record for KST/UTC conversion'], idealSet: ['machine-readable or page-image official 1901-2100 calendar corpus', 'KASI or another national observatory method note plus independent oracle with version/hash', 'explicit historical timezone/DST and solar-term boundary tables'], namedTargets: ['KASI 월별 음양력 service and official certificate request channel', 'KRISS UTC(KRIS)/KST standard-time documentation'] },
    locator: { requiredSections: ['exact date/time rows around 입춘 and all 24 terms', 'leap-month transitions', 'midnight/子時 boundary rows', 'historical timezone/DST rows'], capture: ['input date/time and location', 'calendar system and time scale', 'returned lunar date, sexagenary date and leap marker', 'service/version/output evidence'] },
    purpose: 'separate astronomical/calendar correctness from the classical rule text and test the repository solar-term, lunar, leap-month, historical-time and day-boundary assumptions.',
    currentGap: 'repository has local calendar code and internal fixtures; the broad official 1901-2100 external comparison and source identity are not admitted.', notDuplicateOf: ['local lunar converter and internal regression fixtures'],
    accept: ['official provider identity and exact coverage are recorded', 'boundary cases are returned by the same defined calendar/time semantics as the input contract', 'an independent oracle or certificate covers at least the first/last and adversarial leap/boundary rows', 'raw outputs and terms-of-use are retained'],
    reject: ['a consumer calendar app or unversioned web screenshot', 'a result with no timezone/calendar-system metadata', 'KASI 2050-limited service silently extrapolated to 2100', 'matching output without independent provenance'],
    provenanceChecks: ['record institution, endpoint/request, access date, coverage, output bytes/hash and terms', 'distinguish official observation/data from repository algorithm and from Saju interpretation', 'retain failures and out-of-scope rows'],
    licensing: { access: 'KASI public service plus request/fee certificate; KRISS public documentation with service-use restrictions', rights: 'bulk extraction and commercial reuse require written confirmation', policyDecision: 'coverage and reuse decision required' },
    verificationPlan: ['materialize a calendar fixture reconciliation artifact', 'run lunar converter and Saju external validation checkers with before/after counts', 'do not alter boundary coefficients or fixture expectations merely to match'],
    expectedChange: { claim: 'calendar/date claims may gain scoped independent evidence', readiness: 'input verification can advance for covered rows; classical claim and activation gates remain separate', production: 'unchanged until explicit policy gate' },
    rationale: 'calendar errors contaminate Saju and Ziwei inputs, so this is the strongest shared upstream evidence after edition identity.', difficulty: 'medium-high', confidence: 'high', sourceRefs: ['source-kasi-lunar-calendar', 'source-kasi-ephemeris-certificate', 'source-kriss-utc-korea'],
  },
  {
    id: 'SAJU-P1-MISSING-TIME-POLICY', system: 'saju', priority: 'P1', candidateStatus: 'action_required', highLeverage: false,
    blockerIds: ['saju-b-missing-time-rule'], packetIds: ['saju-source-packet-core-candidate-boundary-v0'],
    material: { minimumSet: ['published domain rule or signed expert adjudication that explicitly states what is determined when birth time is missing', 'candidate-output policy with allowed uncertainty and no forced hour pillar'], idealSet: ['two independently authored policy statements with examples around 子時 and day rollover', 'a source text witness if it explicitly addresses unknown birth time, plus a separate modern operational policy'], namedTargets: ['not a famous-book request: seek an explicit operational policy artifact from an identified practitioner, institution or academic study'] },
    locator: { requiredSections: ['unknown/uncertain birth time', '子時 and day-boundary treatment', 'candidate count and merge policy'], capture: ['verbatim policy sentence', 'scope/authority/author/date', 'example input and allowed output'], },
    purpose: 'resolve missing-time behavior without pretending that a classical text endorses the repository 00:00/12:00/23:59 sampling.', currentGap: 'the code preserves candidate_required status, but no authoritative policy witness defines this uncertainty boundary.', notDuplicateOf: ['existing candidate sampler and unknown-time fixtures'],
    accept: ['policy explicitly says what is unknown and forbids false precision', 'candidate generation and user-facing meaning are distinguished', 'author/date/version and independent review are available'], reject: ['a chart output that chooses one hour', 'general mention of 子時 with no missing-time rule', 'personal anecdote or retrospective accuracy claim'], provenanceChecks: ['record policy authority separately from classical source authority', 'retain exact wording and version/hash', 'mark user-policy dependency'], licensing: { access: 'candidate not yet located; expert or institution contact likely', rights: 'written permission if policy text is not openly reusable', policyDecision: 'user policy approval required' }, verificationPlan: ['add policy observation to Saju source-claim observation artifact', 'negative test must reject forced-hour promotion', 'no readiness promotion from policy text alone'], expectedChange: { claim: 'unknown-time boundary may become a documented policy claim, not a factual hour claim', readiness: 'candidate boundary becomes explicit; interpretation remains blocked for missing-time cases', production: 'unchanged' }, rationale: 'no classical rule can certify a sampling heuristic; this target directly addresses the semantic gap instead of seeking an irrelevant book.', difficulty: 'high', confidence: 'medium', sourceRefs: ['saju-source-packet-core-candidate-boundary-v0'],
  },
  {
    id: 'SAJU-P1-TIMING-RULES', system: 'saju', priority: 'P1', candidateStatus: 'action_required', highLeverage: true,
    blockerIds: ['saju-b-timing-rule'], packetIds: ['saju-source-packet-rule-timing-v0'],
    material: { minimumSet: ['direct rule witness for 大運 direction, adjacent-term selection and 起運 conversion', 'direct rule witness for 12運 direction and period pillar stepping', 'one independent table/example with date and sex/year-polarity inputs'], idealSet: ['edition-identified pages from 子平/大運 texts plus an independent almanac/calendrical oracle', 'all boundary examples for 3日一歲, 1日4개월 and 子初/day rollover'], namedTargets: ['catalog-linked 子平真詮/三命通會 pages where 行運/大運 sections are directly imaged; KASI/official calendar evidence only for astronomical term dates, not divination semantics'] },
    locator: { requiredSections: ['行運, 大運, 順行/逆行, 起運, 三日一歲, 十二運/長生'], capture: ['rule sentence, direction subject, sex/year-polarity condition, conversion units, example table'] },
    purpose: 'separate classical timing rule identity from current numerical solver and boundary sampling.', currentGap: 'timing packet has no observed locator and the local solver coefficients are unverified.', notDuplicateOf: ['internal da-yun cycles and target-date sampling'], accept: ['all direction and conversion inputs are explicit', 'example can be independently recomputed with declared calendar/time semantics', 'edition identity and page/folio are closed'], reject: ['current-cycle agreement', 'modern app output with no rule text', 'one-direction example used to certify all polarities'], provenanceChecks: ['retain original page image and independent recomputation fixture', 'preserve edition disagreement', 'do not let numeric match become semantic authority'], licensing: { access: 'catalog/physical or restricted digital likely', rights: 'permission for page images may be required', policyDecision: 'none for research; production use remains separate' }, verificationPlan: ['materialize Saju timing source observation and external fixture reconciliation', 'run focused timing tests and negative promotion fixtures', 'review before altering any solver rule'], expectedChange: { claim: 'timing rule claims may become scoped supported', readiness: 'covered timing rows may leave source_unresolved only after adjudication; overall readiness stays blocked', production: 'unchanged' }, rationale: 'timing is an independent source family and cannot be inferred from natal rules.', difficulty: 'high', confidence: 'medium', sourceRefs: ['source-ndl-ziping-original-commentary', 'source-ndl-sanming-ming-edition'],
  },
  {
    id: 'SAJU-P1-EXPERIMENTAL-SEMANTIC-BRIDGE', system: 'saju', priority: 'P1', candidateStatus: 'action_required', highLeverage: true,
    blockerIds: ['saju-b-heuristic-semantic-equivalence'], packetIds: ['saju-source-packet-rule-gyeokguk-v0', 'saju-source-packet-rule-strength-v0', 'saju-source-packet-rule-yongshin-v0'],
    material: { minimumSet: ['direct qualitative source passages for 得令/得地/通根/旺衰, 格局 and 用神 precedence', 'a separately authored semantic mapping that states whether the repository score/coefficient is non-equivalent', 'worked chart examples preserving qualitative wording and numeric output separately'], idealSet: ['independent domain review comparing multiple editions and marking true equivalence, partial correspondence or non-equivalence per field', 'formal rule schema with no invented coefficients'], namedTargets: ['identified edition pages from 滴天髓, 子平真詮 and 穷通宝鉴 as qualitative witnesses; a reviewer-authored bridge is required for any numeric mapping'] },
    locator: { requiredSections: ['得令/得地/通根/旺衰', '月令/透干/本氣/格局', '用神/喜神/調候/扶抑'], capture: ['exact qualitative passage', 'chart structure assumptions', 'whether the text permits a number or only a qualitative conclusion'] },
    purpose: 'answer the semantic-equivalence question honestly: a classical qualitative passage cannot by itself authorize a 0-100 score or threshold.', currentGap: 'local packets explicitly mark heuristic coefficients and semantic equivalence unresolved.', notDuplicateOf: ['local experimental strength/gyeokguk/yongshin outputs and locator observations'], accept: ['source text and reviewer explicitly distinguish qualitative principle from numeric heuristic', 'any proposed equivalence is justified field-by-field with counterexamples', 'no coefficient is smuggled in as a quotation'], reject: ['a modern score table with classical labels', 'numeric correlation presented as semantic proof', 'one favorable chart example', 'interpretive success anecdotes'], provenanceChecks: ['separate direct source, reviewer adjudication and deterministic relation edges', 'record reviewer identity/method and dissent', 'keep experimental activation unchanged'], licensing: { access: 'classical pages may be catalog/physical/restricted; reviewer agreement is a separate artifact', rights: 'source page reuse and reviewer report terms must be confirmed', policyDecision: 'explicit policy decision required before any canonical numeric claim' }, verificationPlan: ['materialize qualitative source observations and semantic bridge review', 'run Saju acceptance checker with negative fixtures for numeric-promotion attempts', 'do not modify coefficients as part of acquisition'], expectedChange: { claim: 'qualitative claims may gain scoped support; numeric heuristic remains policy-only unless separately authorized', readiness: 'experimental modules remain candidate/blocked; no automatic promotion', production: 'unchanged' }, rationale: 'this is the only honest target for the requested semantic-equivalence blocker; no famous text can do the reviewer’s job implicitly.', difficulty: 'very_high', confidence: 'high', sourceRefs: ['source-ndl-ziping-original-commentary', 'source-ctext-saju-pages'],
  },
  {
    id: 'SAJU-P1-SHINSAL-WITNESS', system: 'saju', priority: 'P1', candidateStatus: 'action_required', highLeverage: false,
    blockerIds: ['saju-b-shinsal-rule'], packetIds: ['saju-source-packet-rule-shinsal-v0'],
    material: { minimumSet: ['direct table/rule pages for each implemented named shinsal and reference axis', 'page/folio identity and one independent edition comparison'], idealSet: ['complete rule table with day-stem/year-branch alternatives and disagreement notes', 'source text separating presence from outcome/intensity'], namedTargets: ['catalog-linked 三命通會 星曜神煞/神煞 sections, not a modern shinsal summary'] },
    locator: { requiredSections: ['天乙貴人, 華蓋, 空亡, 羊刃 and the exact mapping formula/axis'], capture: ['all relevant stems/branches, direction/table headers, reference axis and scope'] },
    purpose: 'close direct mapping evidence while keeping presence separate from interpretation.', currentGap: 'no shinsal locator was observed in the local source milestone.', notDuplicateOf: ['local six-core shinsal mapping tables'], accept: ['exact mapping and axis are directly visible', 'edition identity and independent comparison are present', 'source does not get used to assert personal outcomes'], reject: ['Korean blog/table', 'label-only mention', 'source with no reference axis', 'presence turned into prediction'], provenanceChecks: ['capture unedited page images and hashes', 'record variant rows separately', 'link only to claim-level source observations'], licensing: { access: 'likely physical/restricted/paid', rights: 'permission needed for page capture/reuse', policyDecision: 'none for research' }, verificationPlan: ['materialize shinsal source observation', 'run source-claim and readiness boundary checks', 'retain `experimental` status'], expectedChange: { claim: 'mapping claims may become scoped supported', readiness: 'shinsal interpretation remains blocked/candidate', production: 'unchanged' }, rationale: 'small scope, but the current source gap is explicit and cannot be filled by local rule tables.', difficulty: 'medium-high', confidence: 'medium', sourceRefs: ['source-ndl-sanming-ming-edition', 'source-ctext-saju-pages'],
  },
]

const ZIWEI_TARGETS = [
  {
    id: 'ZIWEI-P0-PALACE-SEMANTIC-WITNESS', system: 'ziwei', priority: 'P0', candidateStatus: 'action_required', highLeverage: true,
    blockerIds: ['blocker-palace-semantic-identity', 'blocker-tianfu-rotation06-semantic-authority', 'blocker-source-identity-unresolved'], claimIds: ['claim-palace-name-branch-ordinal', 'claim-ming-shen-coordinate-frame', 'claim-major-star-placement-all'],
    material: { minimumSet: ['official Nanyangtang scan page images linked to F1000000000000101426', 'one complete readable diagram/table that directly connects 12 palace names, branch glyphs, physical slots and ordinal/base/direction', 'cover/title/colophon/volume/folio metadata'], idealSet: ['two independently catalogued editions with aligned page/folio review', 'explicit statement of the same coordinate frame used by production or a human adjudication packet that rejects equivalence', 'CC0/openly redistributable page-image bytes'], namedTargets: ['National Archives of Japan F1000000000000101426 / file 1078787 (already local candidate; authority-link and page capture action)', 'independent second catalogued witness, not a mirror of the local PDF'] },
    locator: { requiredSections: ['十二宮冠蓋 or equivalent 12-palace diagram', '定命身二宮 / 寅起月 / 命宮逆數·身宮順數', '紫微五訣/安紫微/安天府 tables where branch and ordinal are explicit'], capture: ['full diagram boundary and orientation', 'all 12 labels and branches', 'direction arrows/words and subject', 'page/folio and edition identity'] },
    purpose: 'close the actual semantic edge palace-name ↔ branch ↔ diagram slot ↔ production ordinal; rotation-06 arithmetic is not enough.', currentGap: 'local Nanbei pages show branch diagrams and traversal wording but no shared palace-name mapping; Nanyangtang identity is catalog-linkable but not yet admitted.', notDuplicateOf: ['ziwei-local-nanbei-219p', 'ziwei-local-nanyangtang-528p'], accept: ['all five connections are directly visible in a readable witness', 'source and production coordinate frames are explicitly compared, not inferred', 'cross-edition disagreement is preserved and human review is recorded'], reject: ['rotation-06 numerical fit', 'OCR/transcription without scan', 'partial/cropped diagram', 'catalog metadata without target pages', 'palace labels assigned from modern convention'], provenanceChecks: ['download original archive bytes, record file URI/catalog ID/page/folio and hash', 'verify CC0/terms separately from semantic authority', 'keep raw glyph/layout and page images'], licensing: { access: 'official public scan; second witness may be restricted', rights: 'official metadata says CC0 for the NARA item; verify image-level terms and second witness rights', policyDecision: 'human semantic adjudication required' }, verificationPlan: ['materialize Ziwei palace semantic source frontier successor with current observed head', 'run palace source acquisition and negative checkers', 'compare current production coordinates without changing them', 'retain stableClaimCount 0 until review closes'], expectedChange: { claim: 'palace coordinate claim can become human-review-ready then scoped supported, never automatically verified', readiness: 'semantic blocker may move to pending adjudication; readiness remains not_safe_to_start until native gates pass', production: 'unchanged' }, rationale: 'highest-leverage Ziwei action: one direct coordinate witness affects palaces, major-star interpretation and Tianfu rotation boundary.', difficulty: 'high', confidence: 'high', sourceRefs: ['source-japan-archives-ziwei-nanyangtang', 'ziwei-palace-semantic-source-frontier-v1'],
  },
  {
    id: 'ZIWEI-P0-CALENDAR-TIME-ORACLE', system: 'ziwei', priority: 'P0', candidateStatus: 'action_required', highLeverage: true,
    blockerIds: ['blocker-calendar-time-source-identity', 'blocker-external-oracle-identity'], claimIds: ['claim-lunar-leap-month', 'claim-zi-time-boundary', 'claim-ming-shen-input'],
    material: { minimumSet: ['KASI or national-observatory lunar/leap-month rows for the exact Ziwei fixture dates', 'independent calendar implementation/version and raw output', 'explicit local-time/UTC/子時 boundary inputs'], idealSet: ['full boundary corpus spanning leap months, solar-term crossings and day rollover', 'source-backed Korean/Chinese calendar convention comparison', 'license-usable oracle with deterministic command and pinned data'], namedTargets: ['KASI official lunar-solar service/certificate channel; local Ziwei fixtures are input cases, not authority'] },
    locator: { requiredSections: ['leap-month row, lunar date, sexagenary date, exact time and timezone', 'day rollover and 子時 boundary', 'source calendar system and epoch'], capture: ['raw request/response', 'service/version/coverage', 'all warnings and out-of-scope rows'] },
    purpose: 'prevent calendar conversion and time-boundary uncertainty from being mistaken for Ziwei rule agreement.', currentGap: 'Ziwei input contract records conversion status but no independent source identity or oracle; candidate paths fail closed.', notDuplicateOf: ['local solar2lunar path and six external-looking fixtures'], accept: ['same input yields reproducible output under explicitly declared calendar/time semantics', 'leap-month and boundary cases are covered', 'oracle independence and license/access are recorded'], reject: ['same local converter wrapped differently', 'calendar screenshot with no input/timezone', 'unversioned commercial app', 'one normal-date match'], provenanceChecks: ['hash raw oracle output and source/version', 'separate calendar evidence from palace/star rules', 'retain mismatch and excluded cases'], licensing: { access: 'KASI public/request; bulk terms unresolved', rights: 'written confirmation required for bulk or production reuse', policyDecision: 'coverage and reuse decision required' }, verificationPlan: ['materialize fixture reconciliation with current source identity', 'run Ziwei fixture and readiness checkers', 'do not promote observed matches to verified'], expectedChange: { claim: 'input calendar claims may become scoped externally supported', readiness: 'input blocker can close only for covered semantics; overall Ziwei remains blocked until rule/semantic gates', production: 'unchanged' }, rationale: 'Ziwei and Saju share upstream calendar risk; independent coverage has more leverage than another chart screenshot.', difficulty: 'medium-high', confidence: 'high', sourceRefs: ['source-kasi-lunar-calendar', 'source-kasi-ephemeris-certificate'],
  },
  {
    id: 'ZIWEI-P0-CLAIM-SOURCE-IDENTITY', system: 'ziwei', priority: 'P0', candidateStatus: 'action_required', highLeverage: true,
    blockerIds: ['blocker-source-identity-unresolved'], claimIds: ['claim-occurrence-source-identity', 'claim-stable-claim-boundary'],
    material: { minimumSet: ['catalog/holding identity, edition, volume/folio/page and actual bytes for each source occurrence', 'raw glyph capture and source-page context', 'claim/occurrence mapping that preserves unresolved and excluded rows'], idealSet: ['independent edition lineage report and duplicate/mirror detection', 'reviewer sign-off for each occurrence before any claim merge'], namedTargets: ['NARA F1000000000000101426 for the already-held Nanyangtang candidate; source-specific catalog records for all additional witnesses'] },
    locator: { requiredSections: ['title/author/editor/colophon', 'occurrence page and adjacent pages', 'table/diagram headers and page/folio markers'], capture: ['unedited bytes, page images, raw transcription, OCR only as locator'] },
    purpose: 'turn “a source occurrence exists” into an auditable identity edge without inventing stable claims.', currentGap: 'occurrence provenance and stable claim boundary remain unresolved; current local evidence is observation-limited.', notDuplicateOf: ['existing occurrence-level provenance artifact and local PDFs'], accept: ['each occurrence has source identity and actual-byte hash', 'mirror/reprint lineage is marked and not double-counted', 'claim merge is independently reviewed'], reject: ['title-page-only identity', 'OCR-only text', 'same scan counted as two witnesses', 'confidence score substituted for identity'], provenanceChecks: ['record catalog ID, edition/lineage, page/folio, byte hash and capture scope', 'preserve raw and normalized forms separately', 'no source adoption in intake'], licensing: { access: 'mixed', rights: 'depends on each institution; catalog is not license', policyDecision: 'per-source permission check' }, verificationPlan: ['feed source observations to Ziwei occurrence/admission checkers', 'run negative fixtures for hidden unresolved source and invented claim boundary', 'retain stableClaimCount 0 until admitted'], expectedChange: { claim: 'occurrence provenance can become reviewable; stable claim remains 0 until adjudication', readiness: 'grounding remains blocked', production: 'unchanged' }, rationale: 'this is the provenance gate beneath all Ziwei rule claims.', difficulty: 'high', confidence: 'high', sourceRefs: ['source-japan-archives-ziwei-nanyangtang', 'ziwei-palace-source-acquisition-field-kit-v0'],
  },
  {
    id: 'ZIWEI-P0-TIANFU-CONVENTION', system: 'ziwei', priority: 'P0', candidateStatus: 'action_required', highLeverage: true,
    blockerIds: ['blocker-tianfu-raw-formula-contradiction', 'blocker-tianfu-rotation06-semantic-authority'], claimIds: ['claim-tianfu-placement', 'claim-tianfu-coordinate-convention'],
    material: { minimumSet: ['direct source page that states Tianfu anchor/base branch and counting direction', 'same witness context showing whether branch labels are palace names or coordinate slots', 'one independent edition comparison'], idealSet: ['multiple premodern page-image witnesses with colophon/folio identity', 'formal adjudication of Chen-anchor versus Xu-anchor and a preserved disagreement packet'], namedTargets: ['NARA Nanyangtang scan pages for 安天府/紫微五訣; second catalogued edition if the page is absent or ambiguous'] },
    locator: { requiredSections: ['安紫微/安天府, 紫微五訣, Tianfu star placement table/formula', 'base branch and direction words'], capture: ['raw glyphs, table orientation, branch sequence, formula and page/folio'] },
    purpose: 'resolve raw formula contradiction and decide whether rotation-06 is a semantic identity or only an output transform.', currentGap: 'both conventions remain available in code; arithmetic 150/150 fit does not establish source authority.', notDuplicateOf: ['existing Tianfu representation search, discrepancy and rotation artifacts'], accept: ['source explicitly states base/direction/coordinate meaning', 'same rule is attributable to an edition and independently reviewed', 'conflict is reported if editions differ'], reject: ['legacy/source-aligned output match', 'rotation-only proof', 'modern resolver output', 'unattributed transcription'], provenanceChecks: ['hash source pages and record edition lineage', 'preserve both formulas and first divergence', 'no production selection at intake'], licensing: { access: 'NARA public candidate plus possible restricted second edition', rights: 'CC0 metadata for NARA; verify page-image reuse and second-edition rights', policyDecision: 'authorized semantic authority decision required' }, verificationPlan: ['materialize Tianfu convention provenance successor', 'run discrepancy and negative checkers', 'keep legacy default and readiness/activation unchanged'], expectedChange: { claim: 'Tianfu source convention may move from unresolved to reviewed with declared limits', readiness: 'semantic authority may advance only through explicit human gate', production: 'unchanged until authorized' }, rationale: 'one witness can address both formula contradiction and rotation-06 semantic overreach.', difficulty: 'very_high', confidence: 'high', sourceRefs: ['source-japan-archives-ziwei-nanyangtang'],
  },
  {
    id: 'ZIWEI-P1-FOUR-TRANSFORMATIONS', system: 'ziwei', priority: 'P1', candidateStatus: 'action_required', highLeverage: true,
    blockerIds: ['blocker-four-transform-source-witness'], claimIds: ['claim-four-transformations-10x4'],
    material: { minimumSet: ['readable 10 heavenly stems × 4 transformations table/formula', 'edition identity and page/folio', 'direction/context if table has variant branches'], idealSet: ['two editions plus variant matrix for 40 cells', 'source statement distinguishing annual stem, natal stem and any school-specific assignments'], namedTargets: ['NARA Nanyangtang scan search for 四化/化祿化權化科化忌 and a second catalogued edition if coverage is incomplete'] },
    locator: { requiredSections: ['四化, 化祿, 化權, 化科, 化忌', '10 stem header and 40 cells/rows', 'variant or school note'], capture: ['full table including headers and footnotes', 'page/folio and raw glyphs'] },
    purpose: 'close direct source coverage for transformationRules without treating current table output as source evidence.', currentGap: 'current artifact preserves the blocker and no direct source witness is admitted.', notDuplicateOf: ['current transformationRules.js and four-transform source-evidence artifact'], accept: ['all 10 stems and four columns are readable or scope is explicitly partial', 'table semantics and applicable stem axis are explicit', 'edition identity and independent review are present'], reject: ['partial four-row table presented as complete', 'modern app chart', 'OCR without image', 'school convention silently generalized'], provenanceChecks: ['hash source page bytes and record table coordinate', 'preserve variants', 'link cell-level observations to rule claims'], licensing: { access: 'NARA public candidate; second witness unknown', rights: 'verify page image rights', policyDecision: 'variant scope decision required' }, verificationPlan: ['run four-transform source checker and negative fixture', 'materialize cell-level observations', 'no resolver change'], expectedChange: { claim: '40-cell source coverage may become partial or complete within a declared edition scope', readiness: 'four-transform gate may advance only after review', production: 'unchanged' }, rationale: '40 direct cells are a bounded high-leverage source target.', difficulty: 'medium-high', confidence: 'high', sourceRefs: ['source-japan-archives-ziwei-nanyangtang'],
  },
  {
    id: 'ZIWEI-P1-EXTERNAL-ORACLE', system: 'ziwei', priority: 'P1', candidateStatus: 'action_required', highLeverage: false,
    blockerIds: ['blocker-external-oracle-identity'], claimIds: ['claim-external-fixture-chart'],
    material: { minimumSet: ['independently authored chart generator/manual oracle', 'pinned version/settings and raw input/output', 'source edition/rule-set identity used by the oracle'], idealSet: ['two independent implementations with source-specific conventions', 'full fixture corpus including excluded/mismatch rows and first divergences'], namedTargets: ['a published or institution-maintained Ziwei calculator whose algorithm/version and source convention are inspectable; otherwise a human-produced page-image chart with reproducible calculation worksheet'] },
    locator: { requiredSections: ['exact birth input, lunar conversion, 命/身宮, bureau, major/minor stars, 四化', 'settings/rule-set/version and source citation'], capture: ['raw chart output, screenshots/page images, input normalization and tool version'] },
    purpose: 'test chart reproduction independently while preserving semantic/source authority as a separate gate.', currentGap: 'four observed matches exist in fixtures but verifiedMatches remains 0 and local runner is not independent.', notDuplicateOf: ['src/ziwei/externalZiweiFixtures.js and local resolver output'], accept: ['oracle is not the repository resolver or a wrapper around it', 'source/rule-set and settings are identifiable', 'raw output is reproducible and licensing allows retention'], reject: ['same implementation under a new name', 'unversioned web calculator', 'only matching rows', 'numeric match treated as semantic proof'], provenanceChecks: ['hash source/release and raw output', 'record evaluator independence and same/different rule semantics', 'preserve mismatch explanations without forcing a winner'], licensing: { access: 'candidate; likely web or manual', rights: 'tool output and screenshots may have restrictions', policyDecision: 'oracle access and reuse decision required' }, verificationPlan: ['run Ziwei fixture reconciliation with independent evaluator field', 'negative checker must reject wrapper diversity as independence', 'no readiness promotion from matches alone'], expectedChange: { claim: 'fixture comparison can become independent evidence only for declared quantity', readiness: 'external-validation layer may advance; semantic claim boundary remains separate', production: 'unchanged' }, rationale: 'external fixture agreement is useful only after oracle identity is proven.', difficulty: 'very_high', confidence: 'medium', sourceRefs: ['source-japan-archives-ziwei-nanyangtang'],
  },
  {
    id: 'ZIWEI-P1-LIFE-BODY-LEGIBILITY', system: 'ziwei', priority: 'P1', candidateStatus: 'action_required', highLeverage: false,
    blockerIds: ['blocker-life-body-ruler-source-legibility'], claimIds: ['claim-life-body-ruler-24-ambiguous-rows'],
    material: { minimumSet: ['higher-resolution original page images for the 24 blocked compound surfaces', 'page/folio/edition identity and adjacent context', 'raw glyph capture without guessing'], idealSet: ['independent reader review by two people or a second edition', 'complete 144-row comparison with blocked/accepted status per row'], namedTargets: ['NARA Nanyangtang original image for the relevant 命/身主 and ruler table pages; a second high-resolution witness if characters remain ambiguous'] },
    locator: { requiredSections: ['命主/身主/五行局 table and 24 compound glyph surfaces'], capture: ['full page, crop plus full-page context, raw glyph alternatives, page/folio and scan metadata'] },
    purpose: 'replace illegible glyphs with actual readable evidence, never with inference.', currentGap: '120/144 rows are comparable but 24 remain ambiguous and glyph guessing is forbidden.', notDuplicateOf: ['existing 144-row life/body/ruler artifact'], accept: ['all 24 surfaces are legible in the original or independently read with evidence', 'ambiguous rows remain blocked if not resolved', 'edition and page identity are closed'], reject: ['OCR guess', 'cropped glyph with no context', 'majority vote without source image', 'production output used to fill a blank'], provenanceChecks: ['hash original image and crop', 'retain raw alternatives and reviewer notes', 'do not collapse ambiguity into a fact'], licensing: { access: 'NARA public candidate; other witness unknown', rights: 'verify image reuse', policyDecision: 'none for local review' }, verificationPlan: ['rerun life/body/ruler source checker and negative ambiguity fixture', 'preserve 24-row before/after counts', 'no production rule mutation'], expectedChange: { claim: 'only resolved rows may become direct observation', readiness: 'blocker count may reduce; stable claim/readiness remain gated', production: 'unchanged' }, rationale: 'bounded, measurable acquisition frontier with no semantic shortcut.', difficulty: 'medium', confidence: 'high', sourceRefs: ['source-japan-archives-ziwei-nanyangtang'],
  },
  {
    id: 'ZIWEI-P2-TIMING-DOMAIN', system: 'ziwei', priority: 'P2', candidateStatus: 'action_required', highLeverage: false,
    blockerIds: ['blocker-timing-domain-absent'], claimIds: ['claim-ziwei-da-xian-liu-nian'],
    material: { minimumSet: ['explicit source rule for 大限/流年/流月 or a declared exclusion boundary', 'production input/output contract and boundary fixtures', 'independent oracle or human worksheet for one complete cycle'], idealSet: ['edition comparison and full time-series fixtures with calendar/time provenance', 'explicit source-approved naming of time domain'], namedTargets: ['source pages in the same catalog-linked Ziwei witness for 大限/流年 and an independent authored implementation; if unavailable, obtain an explicit no-implementation policy decision'] },
    locator: { requiredSections: ['大限, 小限, 流年, 流月, 起限 and direction/base rules'], capture: ['rule text/table, starting point, direction, age/year mapping and exceptions'] },
    purpose: 'prevent a missing production domain from being filled by a natal chart source or assumed scheduler logic.', currentGap: 'current Ziwei contract does not implement this domain or provide external fixtures.', notDuplicateOf: ['natal resolver and prompt adapter'], accept: ['domain is directly specified and independently reproducible', 'or an explicit product policy says it remains unsupported', 'source and implementation scope remain separate'], reject: ['natal star placement used as timing evidence', 'one app output with no rule source', 'silent feature addition'], provenanceChecks: ['record source and product-policy decision separately', 'keep unsupported state explicit', 'hash any new fixture pack'], licensing: { access: 'not yet located; catalog/physical likely', rights: 'per-source', policyDecision: 'product scope decision required' }, verificationPlan: ['add a bounded unsupported/timing artifact or source observation packet', 'run contract negative tests', 'do not implement timing in this acquisition work order'], expectedChange: { claim: 'timing domain may become explicitly supported or explicitly out of scope', readiness: 'no automatic Ziwei readiness advance', production: 'unchanged' }, rationale: 'P2 because it is absent rather than a contradiction in an active natal rule.', difficulty: 'high', confidence: 'medium', sourceRefs: ['source-japan-archives-ziwei-nanyangtang'],
  },
  {
    id: 'ZIWEI-NOACTION-RESOLVED-SCOPES', system: 'ziwei', priority: 'P2', candidateStatus: 'no_action_current_scope', highLeverage: false,
    blockerIds: ['blocker-minor-star-source-witness', 'blocker-12-major-star-direct-rules'], claimIds: ['claim-six-lucky-stars', 'claim-12-nonroot-relative-major-stars'],
    noActionReason: 'Current inherited frontier explicitly resolves six implemented lucky-star rules and twelve non-root relative major-star rules within declared scope. Do not reacquire duplicate copies or promote root/Tianfu/palace semantics.',
    material: { minimumSet: ['none; retain existing artifacts and their declared limits'], idealSet: ['only revisit if a new contradiction or broader scope is authorized'], namedTargets: [] }, locator: { requiredSections: [], capture: [] }, purpose: 'make the no-action boundary explicit so already-closed scoped evidence is not requested again.', currentGap: 'resolved scope is narrower than full Ziwei readiness.', notDuplicateOf: ['existing inherited evidence and major-star reconciliation artifacts'], accept: ['no new material is requested for the resolved scope', 'scope exclusions remain machine-readable'], reject: ['duplicate mirror/reprint counted as a new witness', 'resolved scope silently expanded'], provenanceChecks: ['hash and cite existing artifacts only'], licensing: { access: 'already held locally', rights: 'existing artifact rights unchanged', policyDecision: 'none' }, verificationPlan: ['checker verifies no-action status and preserved scope'], expectedChange: { claim: 'none', readiness: 'unchanged blocked', production: 'unchanged' }, rationale: 'prevents redundant acquisition and false closure.', difficulty: 'low', confidence: 'high', sourceRefs: ['ziwei-inherited-evidence-consumption-frontier-v1'],
  },
]

const WESTERN_TARGETS = [
  {
    id: 'WESTERN-P0-SEMANTIC-ADJUDICATION', system: 'western', priority: 'P0', candidateStatus: 'action_required', highLeverage: true,
    blockerIds: ['western-b-production-contract', 'western-b-frame-time-correction-bridge'], claimIds: ['astrology.true-node'],
    material: { minimumSet: ['source-backed definition that fixes mean/true/osculating, ascending-node convention, center, ecliptic/frame/equinox, time scale and geometric/apparent corrections', 'explicit statement whether the value is instantaneous longitude or crossing-event time', 'independent reviewer or paper bridging the definition to the implementation'], idealSet: ['formal technical specification from the product/provider owner plus an independent astronomical adjudication', 'test vectors at frame/time/correction boundaries with raw source settings'], namedTargets: ['Swiss official True Node documentation as definition baseline, plus an independent adjudication of its semantic bridge; JPL Horizons manual is supporting frame/state evidence only'] },
    locator: { requiredSections: ['Swiss PDF §2.2.2 True Node pp.17-18/PDF p.20-21', 'JPL Horizons geometric/apparent, ecliptic of date/J2000, TDB and osculating elements sections', 'provider contract field definitions'], capture: ['verbatim definition, version/date, coordinate settings, corrections, output field and motion semantics'] },
    purpose: 'turn the product’s name-only True Node field into a complete, reviewable semantic contract.', currentGap: 'production has no True Node provider; research candidates disagree or are only derived state quantities.', notDuplicateOf: ['existing Swiss/JPL/DE405 diagnostic artifacts and docs'], accept: ['every semantic field is explicitly fixed and the same quantity is named in source and oracle', 'event time is not conflated with instantaneous longitude', 'review records dissent and unresolved fields'], reject: ['Swiss name alone', 'close numeric residual', 'JPL state/OM without node contract', 'frame choice inferred from current code'], provenanceChecks: ['pin document edition/source hash and data settings', 'separate source definition, calculation and interpretation', 'record provider/implementation independence'], licensing: { access: 'Swiss/JPL docs public; product-owner adjudication not yet obtained', rights: 'documentation citation is not code/data deployment permission', policyDecision: 'semantic product policy required' }, verificationPlan: ['materialize a semantic contract evidence packet', 'run Western True Node boundary and independent-frontier checkers', 'do not add provider or tolerance'], expectedChange: { claim: 'definition fields can become source-backed and reviewable', readiness: 'production semantic blocker may move to adjudication; activation remains blocked', production: 'unchanged' }, rationale: 'without semantic identity, numeric oracle acquisition cannot be evaluated.', difficulty: 'very_high', confidence: 'high', sourceRefs: ['source-swiss-true-node-manual', 'source-jpl-horizons-manual'],
  },
  {
    id: 'WESTERN-P0-INDEPENDENT-DIRECT-ORACLE', system: 'western', priority: 'P0', candidateStatus: 'action_required', highLeverage: true,
    blockerIds: ['western-b-independent-same-semantic-oracle'], claimIds: ['astrology.true-node'],
    material: { minimumSet: ['independently authored implementation or dataset that directly emits the same complete geocentric tropical instantaneous True Node', 'pinned source/version/data release, reproducible command and raw outputs', 'license that permits local evaluation and clearly states production redistribution conditions'], idealSet: ['two independent implementations or one authoritative dataset plus independent implementation', 'coverage across 1900-2101 and boundary rows with frame/time/correction metadata', 'formal comparison to Swiss only after same-semantic contract is fixed'], namedTargets: ['seek a source-backed direct True Node provider/API with license-usable distribution; Astronomy Engine is a license-usable near-miss because it exposes Moon positions/events but not this field; Astrolog is held and GPL approximation, not a target to adopt'] },
    locator: { requiredSections: ['API/output field named True Node/ascending lunar node', 'center/frame/equinox/time scale/correction metadata', 'release/license/source algorithm and data lineage'], capture: ['raw outputs and settings, source archive hash, license text, independence statement'] },
    purpose: 'supply the missing same-semantic independent oracle, not merely another state-vector wrapper or event calculator.', currentGap: 'Swiss is the comparison target; DE405/CSPICE/Horizons are same-family or derived diagnostics; ERFA/Astronomy Engine do not expose the direct field.', notDuplicateOf: ['Swiss SE_TRUE_NODE outputs, DE405/CSPICE/DE441 overlap, ERFA, Astronomy Engine and Astrolog diagnostics'], accept: ['direct same quantity is documented, reproducible and license-usable', 'independence is from the target provider/data lineage, not just wrapper diversity', 'raw oracle bytes and settings are retained'], reject: ['Moon node crossing event time only', 'state-derived local implementation with no semantic bridge', 'same JPL family labelled independent', 'GPL/unknown license without policy approval', 'numeric closeness alone'], provenanceChecks: ['hash source/release/data and record evaluator lineage', 'test exact quantity identity before residual comparison', 'preserve no-match/unsupported outcomes'], licensing: { access: 'no confirmed direct same-semantic license-usable candidate located; candidate search remains open', rights: 'must obtain written redistribution terms before production consideration', policyDecision: 'user/provider choice required' }, verificationPlan: ['extend isolated Western frontier artifact with direct-oracle intake', 'run source/license/independence checker and 134-row/boundary comparisons', 'keep independentTrueNodeReference pending until all gates pass'], expectedChange: { claim: 'independent oracle status may move pending → qualified only after semantic and license review', readiness: 'True Node production/interpretation remains blocked unless all native gates pass', production: 'unchanged' }, rationale: 'this is the irreducible Western frontier; known near-misses are explicitly not reacquisition targets.', difficulty: 'very_high', confidence: 'high', sourceRefs: ['source-swiss-true-node-manual', 'source-jpl-horizons-manual', 'source-astronomy-engine', 'source-astrolog-pinned'],
  },
  {
    id: 'WESTERN-P1-LICENSE-POLICY', system: 'western', priority: 'P1', candidateStatus: 'action_required', highLeverage: false,
    blockerIds: ['western-b-license-policy'], claimIds: ['astrology.true-node'],
    material: { minimumSet: ['written decision between AGPL strategy and Swiss Professional License', 'official current contract/license text and exact source/data versions', 'written confirmation for browser/server/WASM/data redistribution scope'], idealSet: ['signed contract/payment evidence or approved open-source policy', 'domain/preview/staging/production and wrapper obligations explicitly answered'], namedTargets: ['Astrodienst Swiss Ephemeris licensing information, June 2026 Professional License contract, and written answers to the project’s existing license inquiry questions'] },
    locator: { requiredSections: ['dual-license choice', 'compiled/browser/server use', 'ephemeris data redistribution', 'wrapper/source obligations and contract effective date'], capture: ['official PDF/URL, version/date, signed response, selected release/data hashes'] },
    purpose: 'separate technical availability from a license-usable production oracle.', currentGap: 'official docs and local license analysis leave Professional scope, browser data and user policy pending.', notDuplicateOf: ['docs/astrology-license-resolution.md and local Swiss spike'], accept: ['decision is explicit and applies to this product/deployment shape', 'license covers code, data, wrapper and environments', 'legal/policy owner approval is recorded'], reject: ['public download mistaken for permission', 'unpaid contract treated as active', 'GPL near-miss silently embedded', 'local-only spike used as deployment approval'], provenanceChecks: ['retain exact license/contract bytes and response', 'bind approval to source/data hashes and deployment scope', 'do not alter activation automatically'], licensing: { access: 'official docs public; contract purchase/written confirmation required', rights: 'currently unresolved for public product', policyDecision: 'mandatory user/legal/product decision' }, verificationPlan: ['run existing provider/license readiness checkers', 'record before/after license gate only; no production deployment', 'keep publicSwissArtifactDeploymentAllowed false until approved'], expectedChange: { claim: 'none by itself; only license eligibility edge', readiness: 'provider deployment eligibility may become reviewable', production: 'unchanged and not deployed' }, rationale: 'even a technically adequate oracle cannot be activated without rights and policy.', difficulty: 'high', confidence: 'high', sourceRefs: ['source-swiss-true-node-manual'],
  },
  {
    id: 'WESTERN-NOACTION-NEAR-MISSES', system: 'western', priority: 'P2', candidateStatus: 'no_action_current_scope', highLeverage: false,
    blockerIds: ['western-b-independent-same-semantic-oracle'], claimIds: ['astrology.true-node'],
    noActionReason: 'Do not reacquire Swiss, DE405/CSPICE, Horizons DE441, ERFA eraMoon98, Astronomy Engine or Astrolog as if any were already the missing qualified oracle. Their current roles are target definition, same-family corroboration, analytic negative control, event/state near-miss, or GPL approximation.',
    material: { minimumSet: ['none; preserve existing diagnostic artifacts'], idealSet: ['revisit only after semantic contract or licensing policy changes'], namedTargets: [] }, locator: { requiredSections: [], capture: [] }, purpose: 'make negative evidence operational and prevent duplicate acquisition.', currentGap: 'the Western oracle frontier remains open despite extensive diagnostic coverage.', notDuplicateOf: ['artifacts/astrology-true-node-independent-frontier-v4/complete.json'], accept: ['existing candidates remain classified by role and independence', 'no numeric match is promoted'], reject: ['wrapper diversity counted as independence', 'source presence counted as authority'], provenanceChecks: ['retain current hashes and frontier verdict'], licensing: { access: 'already held or publicly documented', rights: 'unchanged and not production-approved', policyDecision: 'none' }, verificationPlan: ['checker verifies no-action scope and readiness invariants'], expectedChange: { claim: 'none', readiness: 'unchanged blocked', production: 'unchanged' }, rationale: 'prevents the same known near-misses from being requested again.', difficulty: 'low', confidence: 'high', sourceRefs: ['source-astrolog-pinned', 'source-astronomy-engine', 'source-jpl-horizons-manual'],
  },
]

function readJson(root, path) {
  return JSON.parse(readFileSync(resolve(root, path), 'utf8'))
}

function buildSajuBlockers(saju) {
  const packets = new Map((saju.acquisitionPackets || []).map(packet => [packet.packetId, packet]))
  const packetClaims = packetIds => packetIds.flatMap(id => packets.get(id)?.claimIds || []).sort()
  return [
    { id: 'saju-b-source-identity', priority: 'P0', status: 'still_blocked', title: '판본·전승 identity와 claim-level source authority 미해결', packetIds: SAJU_TARGETS[0].packetIds, claimIds: packetClaims(SAJU_TARGETS[0].packetIds) },
    { id: 'saju-b-core-rule-scope', priority: 'P0', status: 'still_blocked', title: '고전 직접 규칙과 현재 계산 scope의 correspondence 미해결', packetIds: SAJU_TARGETS[0].packetIds, claimIds: packetClaims(SAJU_TARGETS[0].packetIds) },
    { id: 'saju-b-calendar-boundaries', priority: 'P0', status: 'still_blocked', title: '절기·음력·윤달·자시·역사 표준시 independent oracle 부재', packetIds: ['saju-source-packet-core-four-pillars-v0', 'saju-source-packet-core-candidate-boundary-v0'], claimIds: packetClaims(['saju-source-packet-core-four-pillars-v0', 'saju-source-packet-core-candidate-boundary-v0']) },
    { id: 'saju-b-missing-time-rule', priority: 'P1', status: 'still_blocked', title: '출생시각 미상 candidate boundary 직접 규칙/정책 부재', packetIds: ['saju-source-packet-core-candidate-boundary-v0'], claimIds: packetClaims(['saju-source-packet-core-candidate-boundary-v0']) },
    { id: 'saju-b-timing-rule', priority: 'P1', status: 'still_blocked', title: '대운 direction·起運·十二運 직접 규칙과 oracle 부재', packetIds: ['saju-source-packet-rule-timing-v0'], claimIds: packetClaims(['saju-source-packet-rule-timing-v0']) },
    { id: 'saju-b-heuristic-semantic-equivalence', priority: 'P1', status: 'still_blocked', title: '질적 고전 서술과 strength·格局·用神 numerical heuristic semantic equivalence 미해결', packetIds: ['saju-source-packet-rule-gyeokguk-v0', 'saju-source-packet-rule-strength-v0', 'saju-source-packet-rule-yongshin-v0'], claimIds: packetClaims(['saju-source-packet-rule-gyeokguk-v0', 'saju-source-packet-rule-strength-v0', 'saju-source-packet-rule-yongshin-v0']) },
    { id: 'saju-b-shinsal-rule', priority: 'P1', status: 'still_blocked', title: '신살 reference axis와 direct mapping witness 부재', packetIds: ['saju-source-packet-rule-shinsal-v0'], claimIds: packetClaims(['saju-source-packet-rule-shinsal-v0']) },
  ]
}

const ZIWEI_BLOCKERS = [
  { id: 'blocker-calendar-time-source-identity', priority: 'P0', status: 'still_blocked', title: '음력·윤달·자시 입력 source identity/독립 대조 부재' },
  { id: 'blocker-source-identity-unresolved', priority: 'P0', status: 'still_blocked', title: 'occurrence source identity와 stable claim boundary 미해결' },
  { id: 'blocker-external-oracle-identity', priority: 'P1', status: 'still_blocked', title: '외부 fixture의 독립 oracle/source identity 부재' },
  { id: 'blocker-four-transform-source-witness', priority: 'P1', status: 'still_blocked', title: '사화 10×4 표의 직접 source witness 부재' },
  { id: 'blocker-timing-domain-absent', priority: 'P2', status: 'still_blocked', title: '대운·세운 timing domain 구현·fixture·외부 대조 부재' },
  { id: 'blocker-tianfu-raw-formula-contradiction', priority: 'P0', status: 'still_blocked', title: 'Tianfu raw formula contradiction' },
  { id: 'blocker-tianfu-rotation06-semantic-authority', priority: 'P0', status: 'still_blocked', title: 'rotation-06 is relation, not semantic authority' },
  { id: 'blocker-life-body-ruler-source-legibility', priority: 'P1', status: 'still_blocked', title: '24/144 身主 source surfaces remain ambiguous' },
  { id: 'blocker-palace-semantic-identity', priority: 'P0', status: 'still_blocked', title: 'palace label/branch/ordinal semantic identity absent' },
  { id: 'blocker-minor-star-source-witness', priority: 'P1', status: 'resolved_with_existing_evidence', title: 'six implemented lucky-star rules resolved only within declared scope' },
  { id: 'blocker-12-major-star-direct-rules', priority: 'P0', status: 'resolved_with_existing_evidence', title: '12 non-root relative major-star rules resolved only within declared scope' },
]

const WESTERN_BLOCKERS = [
  { id: 'western-b-production-contract', priority: 'P0', status: 'still_blocked', title: 'production True Node semantic contract not defined' },
  { id: 'western-b-independent-same-semantic-oracle', priority: 'P0', status: 'still_blocked', title: 'same-semantic independent high-precision oracle absent' },
  { id: 'western-b-frame-time-correction-bridge', priority: 'P0', status: 'still_blocked', title: 'center/frame/equinox/time-scale/correction bridge unresolved' },
  { id: 'western-b-license-policy', priority: 'P1', status: 'still_blocked', title: 'license and redistribution policy unresolved' },
]

async function inventoryFile(root, path) {
  const absolute = path.startsWith('/') ? path : resolve(root, path)
  if (!existsSync(absolute)) return { path, pathKind: path.startsWith('/') ? 'external_local' : 'repository', exists: false, authorityStatus: 'missing' }
  const bytes = await readFile(absolute)
  return { path, pathKind: path.startsWith('/') ? 'external_local' : 'repository', exists: true, byteLength: bytes.length, byteSha256: sha256(bytes), authorityStatus: 'observed_bytes_only' }
}

function assertCurrentRepository(root) {
  const currentHead = git(root, ['rev-parse', 'HEAD'])
  const originMainHead = git(root, ['rev-parse', 'origin/main'])
  if (currentHead !== EXPECTED_HEAD || originMainHead !== EXPECTED_HEAD) throw new Error(`expected main and origin/main ${EXPECTED_HEAD}; got ${currentHead} / ${originMainHead}`)
  if (git(root, ['branch', '--show-current']) !== 'main') throw new Error('field kit requires main branch')
  return { branch: 'main', currentHead, originMainHead, expectedHead: EXPECTED_HEAD }
}

function enrichSajuTargets(saju) {
  return SAJU_TARGETS.map(target => ({ ...target, claimIds: [...new Set(target.claimIds || target.packetIds.flatMap(id => saju.acquisitionPackets.find(packet => packet.packetId === id)?.claimIds || []))].sort() }))
}

export async function buildFieldKit({ root = resolve(new URL('..', import.meta.url).pathname) } = {}) {
  const repository = assertCurrentRepository(root)
  const sourceInputs = []
  for (const path of SOURCE_INPUTS) sourceInputs.push(await inventoryFile(root, path))
  const external = []
  for (const descriptor of EXTERNAL_LOCAL_SOURCES) external.push({ ...descriptor, ...(await inventoryFile(root, descriptor.path)) })
  const saju = readJson(root, 'artifacts/saju-v1-local-frontier-v0/complete.json')
  const sajuLocal = readJson(root, 'artifacts/saju-local-source-corpus-observation-v1/complete.json')
  const sajuGrounding = readJson(root, 'artifacts/saju-five-classics-grounding-v0/complete.json')
  const ziweiFrontier = readJson(root, 'artifacts/ziwei-palace-semantic-source-frontier-v1/complete.json')
  const western = readJson(root, 'artifacts/astrology-true-node-independent-frontier-v4/complete.json')
  const blockers = [...buildSajuBlockers(saju), ...ZIWEI_BLOCKERS, ...WESTERN_BLOCKERS]
  const targets = [...enrichSajuTargets(saju), ...ZIWEI_TARGETS, ...WESTERN_TARGETS]
  return {
    schemaVersion: SCHEMA,
    verdictToken: VERDICT,
    scope: {
      purpose: 'read-only external evidence acquisition planning from current main checkout',
      branch: repository.branch,
      expectedHead: repository.expectedHead,
      currentHead: repository.currentHead,
      originMainHead: repository.originMainHead,
      externalResearch: 'read_only',
      productionActivation: false,
      deploy: false,
      remoteDatabaseMutation: false,
      commit: false,
      push: false,
      unrelatedUntrackedPreserved: ['-.jpg'],
      historicalArtifacts: 'inputs_with_declared_base_heads; never treated as current-head authority without current source checks',
    },
    currentAudit: {
      sourceOfTruth: 'current checkout at expected HEAD plus actual local source bytes; prior artifacts are evidence inputs with recorded historical bases',
      overallReadiness: { saju: 'blocked', ziwei: 'not_safe_to_start', westernTrueNode: 'blocked', commonEnvelope: 'blocked' },
      systems: [
        { id: 'saju', currentVerdict: 'partial_saju_v1_local_frontier_advanced_uncommitted', claimCount: 43, occurrenceCount: 126, classicalVerification: 0, taxonomy: { locallySupported: 0, partiallySupported: 1, sourceUnresolved: 36, implementationPolicyOnly: 2, interpretationNoncanonical: 4 }, readiness: 'availableForInterpretation:false; productionActivation:blocked', localAuthority: 'five actual PDFs hashable; edition identity unresolved; independent authority not established' },
        { id: 'ziwei', currentVerdict: 'blocked_semantic_identity_insufficient', stableClaimCount: 0, inheritedBlockerCounts: { starting: 10, ending: 8, resolvedScoped: 2, stillBlocked: 8 }, readiness: 'not_safe_to_start; grounding:blocked; activation:experimental', localAuthority: 'Nanbei and Nanyangtang scans held; official NARA identity now confirmed for Nanyangtang, but semantic/page admission incomplete' },
        { id: 'western', currentVerdict: 'blocked_semantic_identity_insufficient', readiness: 'independentTrueNodeReference:pending; production provider absent; activation unchanged', localAuthority: 'DE405/CSPICE/Horizons/ERFA/Swiss/Astrolog diagnostics held; no same-semantic independent license-usable oracle' },
      ],
      invariants: ['source presence is not claim verification', 'numeric agreement is not semantic authority', 'fixture match is not independent authority', 'domain readiness does not propagate', 'blocked evidence is not fallback', 'no target can auto-promote readiness or production'],
      blockers,
    },
    evidenceInventory: {
      alreadyHeld: external.filter(item => item.exists).map(item => ({ id: item.id, system: item.system, path: item.path, byteLength: item.byteLength, byteSha256: item.byteSha256, pageCount: item.pageCount, authorityStatus: item.authorityStatus, reuse: item.reuse })),
      heldButAuthorityInsufficient: [
        { id: 'saju-local-observation-artifacts', system: 'saju', paths: ['artifacts/saju-local-source-corpus-observation-v1/complete.json', 'artifacts/saju-five-classics-grounding-v0/complete.json'], reason: 'direct observations and locator candidates exist; edition identity, independent witness and semantic equivalence remain open' },
        { id: 'ziwei-local-source-witness-artifacts', system: 'ziwei', paths: ['artifacts/ziwei-palace-semantic-source-frontier-v1/complete.json', 'artifacts/ziwei-inherited-evidence-consumption-frontier-v1/complete.json'], reason: 'page observations and transforms exist; palace semantics, Tianfu authority, independent oracle and claim boundary remain open' },
        { id: 'western-local-diagnostics', system: 'western', paths: ['artifacts/astrology-true-node-independent-frontier-v4/complete.json', 'artifacts/astrology-true-node-horizons-erfa-v2/complete.json', 'artifacts/astrology-true-node-frame-diagnostic-v1/complete.json'], reason: 'rich numeric/frame diagnostics exist; they do not prove same semantic quantity or licensing' },
      ],
      notHeldOrNotConfirmed: [
        { id: 'saju-official-1901-2100-calendar-corpus', system: 'saju', reason: 'KASI public service is range-limited in the observed page and bulk/reuse terms are unresolved' },
        { id: 'ziwei-independent-second-palace-witness', system: 'ziwei', reason: 'no independent non-clone witness with complete readable mapping has been admitted' },
        { id: 'western-direct-same-semantic-oracle', system: 'western', reason: 'no confirmed license-usable direct oracle located; known candidates are near-misses or target quantity itself' },
        { id: 'western-license-written-decision', system: 'western', reason: 'AGPL/professional choice and deployment-scope confirmation are pending' },
      ],
      duplicateAvoidance: ['do not reacquire the five local Saju PDFs as if they were independent witnesses', 'do not count Nanbei/Nanyangtang mirrors or reprints twice without lineage', 'do not count Swiss/DE405/CSPICE/Horizons wrappers as independent True Node authority', 'do not reacquire resolved six-lucky-star and twelve-non-root relative-rule scope'],
    },
    targets: targets.map(target => ({ ...target, blockerIds: [...target.blockerIds].sort(), claimIds: [...new Set(target.claimIds || [])].sort(), sourceRefs: [...(target.sourceRefs || [])].sort() })),
    noAction: targets.filter(target => target.candidateStatus === 'no_action_current_scope').map(target => ({ targetId: target.id, blockerIds: target.blockerIds, reason: target.noActionReason })),
    sourceResearch: SOURCE_RESEARCH,
    verificationContract: {
      requiredPerTarget: ['stable target ID', 'system and blocker/claim mapping', 'minimum/ideal material', 'edition/catalog identity', 'volume/page/folio/table/observation locator', 'purpose', 'current gap and non-duplication', 'accept criteria', 'reject criteria', 'provenance/edition/license checks', 'post-acquisition artifact/checker/test plan', 'expected claim/readiness effect', 'priority rationale', 'difficulty and confidence'],
      checkerRules: ['every current blocker maps to one or more action target or explicit no-action record', 'every target has non-empty accept and reject criteria', 'every target has authority/observation/licensing fields', 'held material is not requested again as a duplicate', 'readiness/grounding/activation/production fields cannot be promoted by this artifact', 'no-action targets must state their preserved scope'],
      promotionBoundary: { automaticReadinessPromotion: false, automaticProductionPromotion: false, automaticClaimPromotion: false, humanReviewRequired: true },
    },
    provenance: {
      materializer: `scripts/${SCHEMA === 'tri-system-evidence-acquisition-field-kit-v1' ? 'materialize-tri-system-evidence-acquisition-field-kit-v1.mjs' : ''}`,
      materializerVersion: MATERIALIZER_VERSION,
      generatedAt: 'forbidden',
      externalResearchDate: '2026-08-09',
      externalResearchNetwork: 'read_only',
      sourceInputs,
      sourceResearchIds: SOURCE_RESEARCH.map(source => source.id).sort(),
      localExternalSources: external,
    },
    deterministic: { ordering: 'stable key order; target arrays sorted by id; blocker arrays sorted by id', hashes: 'SHA-256 of actual UTF-8 bytes including final LF', timestamps: 'not serialized except fixed externalResearchDate' },
  }
}

function parse(argv) {
  if (argv.length > 1) throw new Error('only one output path is allowed')
  return { target: resolve(argv[0] || ARTIFACT_PATH) }
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  const { target } = parse(process.argv.slice(2))
  const artifact = await buildFieldKit()
  const directory = dirname(target)
  await mkdir(directory, { recursive: true })
  const outputs = {
    complete: artifact,
    blockers: artifact.currentAudit.blockers,
    targets: artifact.targets,
    evidenceInventory: artifact.evidenceInventory,
    sourceResearch: artifact.sourceResearch,
  }
  for (const [name, value] of Object.entries(outputs)) {
    const bytes = Buffer.from(canonicalJson(value))
    const outputPath = name === 'complete' ? target : resolve(directory, `${name}.json`)
    await writeFile(outputPath, bytes)
    await writeFile(`${outputPath}.integrity.json`, canonicalJson({ schemaVersion: SCHEMA, artifactByteSha256: sha256(bytes), artifactByteSha256Scope: 'UTF-8 bytes including final LF' }))
  }
  console.log(JSON.stringify({ verdict: VERDICT, targetCount: artifact.targets.length, blockerCount: artifact.currentAudit.blockers.length, noActionCount: artifact.noAction.length }, null, 2))
}

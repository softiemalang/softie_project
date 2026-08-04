import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { attachArtifactIdentity, buildArtifactIdentity } from '../src/artifactIdentity.js'

export const SCHEMA = 'ziwei-guarded-occurrence-exact-source-identity-pilot-v0'
export const VERDICT = 'source_lineage_partial'
export const MATERIALIZER_VERSION = '1.0.0'
export const BASIS_HEAD = '70a1ed69bc1d46ac70b283af7d722f01b47846b5'
const SOURCE_ARTIFACT = 'artifacts/ziwei-guarded-occurrence-source-evidence-hardening-v0/complete.json'
const ACCESS_DATE = '2026-08-04'
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const sortValue = value => Array.isArray(value) ? value.map(sortValue) : value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort().map(k => [k, sortValue(value[k])])) : value
export const canonicalJson = value => `${JSON.stringify(sortValue(value), null, 2)}\n`

const EVIDENCE = [
  { evidenceId: 'source-wikisource-quan-shu-volume-one', role: 'public transcription / text comparison', title: '紫微斗數全書/卷一', authorOrEditor: 'traditional attribution; exact editor unresolved', edition: null, year: null, url: 'https://zh.wikisource.org/zh-hant/%E7%B4%AB%E5%BE%AE%E6%96%97%E6%95%B8%E5%85%A8%E6%9B%B8/%E5%8D%B7%E4%B8%80', location: '卷一: 斗數準繩 lines 296-323; 諸星問答論 lines 397-403, 424-444; page image not identified', file: null, fileSizeBytes: null, immutableHash: null, relation: 'textual transcription candidate; not proven to be a particular catalogued scan', independence: 'primary_text_candidate_not_edition_locked' },
  { evidenceId: 'source-ctext-ziwei-volume-one', role: 'parallel transcription / text comparison', title: '紫微斗數卷一', authorOrEditor: 'Chinese Text Project', edition: null, year: null, url: 'https://ctext.org/wiki.pl?chapter=729141&if=en', location: '卷一 chapter page; OCR-matched textual edition, no scan identity for this occurrence', file: null, fileSizeBytes: null, immutableHash: null, relation: 'parallel/derived text lineage; not independent of the classical transcription', independence: 'same_or_parallel_transcription_not_independent' },
  { evidenceId: 'source-ncl-catalog', role: 'library catalogue / edition candidate', title: '紫微斗數', authorOrEditor: 'not stated in catalogue record', edition: '影印本, 正統道藏, three volumes', year: '1923-1926 (民國12-15)', url: 'https://rbook.ncl.edu.tw/NCLSearch/Search/SearchDetail?HasImage=&SourceID=1&item=1b36e75d6cb348bcafa51089508d41ccfDI3ODUxNA2.T5_fvtPg0BL_gp0oecUpf3kBMYmGj_Zu9aAWwhejGlk_&page=3538', location: 'catalog record: Shanghai; 1 volume record of 1114 pages; holding China National Library; registration rarecatx0428879', file: null, fileSizeBytes: null, immutableHash: null, relation: 'catalogued facsimile candidate; no scan/file was retrieved and no identity link to Wikisource was proven', independence: 'bibliographic_record_not_textual_corroboration' },
  { evidenceId: 'source-cinii-1975-edition', role: 'library catalogue / reprint candidate', title: '紫微斗數全書', authorOrEditor: '陳希夷 original; 南北山人編註; 校梓 童彭年', edition: 'hardcover, publisher not stated', year: '1975-08', url: 'https://ci.nii.ac.jp/ncid/BA73215996', location: 'Taipei; 448 pages; NII Books NCID BA73215996; Tokyo Metropolitan Central Library holding', file: null, fileSizeBytes: null, immutableHash: null, relation: 'catalogued later reprint candidate; not proven identical to public transcription', independence: 'bibliographic_record_not_textual_corroboration' },
  { evidenceId: 'source-mcu-taxonomy-paper', role: 'academic secondary taxonomy', title: '紫微斗數主星曜代表人物圖像創作之初探', authorOrEditor: '林聖芬', edition: 'conference repository PDF', year: '2020', url: 'https://web.sdsymposia.mcu.edu.tw/sites/default/files/u3/2020/A2/PAPER/A216_%E6%9E%97%E8%81%96%E8%8A%AC-%E7%B4%AB%E5%BE%AE%E斗數主星曜代表人物圖像創作之初探.pdf', location: 'PDF p. 1; twelve-palace taxonomy only', file: null, fileSizeBytes: null, immutableHash: null, relation: 'secondary taxonomy; does not establish the selected wording or edition', independence: 'independent_secondary_taxonomy_only' },
]

const TARGETS = {
  'ziwei-occ-2260aba6ed2163e3': { slot: 'career', palace: '官祿宮', specificity: 2, lineage: 2, edition: 2, repositoryComparison: 2, reason: '官祿 occurs as a named palace and in multiple conditional passages; exact local gloss remains broader than the text.' },
  'ziwei-occ-a09e10a5495186b8': { slot: 'siblings', palace: '兄弟宮', specificity: 1, lineage: 2, edition: 2, repositoryComparison: 1, reason: 'direct palace-name correspondence, but the added colleague/acquaintance wording lacks a matching passage.' },
  'ziwei-occ-a72bdf60ef809b58': { slot: 'friends', palace: '奴僕宮', specificity: 1, lineage: 2, edition: 2, repositoryComparison: 1, reason: 'alias family is traceable, but the local social scope is not one closed classical configuration.' },
  'ziwei-occ-e73f469c5e35e072': { slot: 'mind', palace: '福德宮', specificity: 1, lineage: 2, edition: 2, repositoryComparison: 1, reason: '福德 appears in conditional wording, but the modern satisfaction/taste/rest gloss is not reproduced.' },
}

export async function buildPilotArtifact() {
  const root = resolve(new URL('..', import.meta.url).pathname)
  const source = JSON.parse(await readFile(resolve(root, SOURCE_ARTIFACT), 'utf8'))
  const candidates = source.records.map(record => {
    const id = record.occurrenceId; const score = TARGETS[id]
    if (!score) throw new Error(`unexpected_target:${id}`)
    return { occurrenceId: id, score: score.specificity + score.lineage + score.edition + score.repositoryComparison, scoreBreakdown: { mostSpecificTextAndLocation: score.specificity, reprintLineage: score.lineage, editionOrScanCandidate: score.edition, repositoryTextComparison: score.repositoryComparison }, rationale: score.reason }
  }).sort((a, b) => b.score - a.score || a.occurrenceId.localeCompare(b.occurrenceId))
  const selected = candidates[0]
  const sourceRecord = source.records.find(record => record.occurrenceId === selected.occurrenceId)
  const score = TARGETS[selected.occurrenceId]
  const selectedRecord = {
    occurrenceId: selected.occurrenceId,
    rawText: sourceRecord.rawText,
    provenance: sourceRecord.provenance,
    guard: sourceRecord.guardPreservation,
    currentEvidenceLedger: sourceRecord.evidenceLedger,
    sourceIdentityInventory: EVIDENCE.map(item => ({ evidenceId: item.evidenceId, role: item.role, title: item.title, authorOrEditor: item.authorOrEditor, edition: item.edition, year: item.year, url: item.url, location: item.location, file: item.file, fileSizeBytes: item.fileSizeBytes, immutableHash: item.immutableHash, relation: item.relation, independence: item.independence })),
    selectedPalace: { slot: score.slot, palace: score.palace },
    textComparison: { exactTextMatch: false, normalizedTextMatch: false, conditionalPhraseMatch: true, palaceOrStarAliasMatch: true, omittedQualifier: ['star identity and configuration', 'conditional polarity and qualifier', 'scope of career/social position/capability'], wordingDrift: ['repository Korean gloss is not a translation of one located sentence', '官祿 is used in source as a configuration-dependent palace reference'], configurationMismatch: ['star, brightness, trine/opposite, transformation, time and school settings are absent'], insufficientEvidence: true, opposingEvidence: [{ sourceLocation: '卷一 斗數準繩 lines 296-300', observation: 'the source contrasts 官星居於福地 and 福星居於官宮, showing conditional configuration rather than an unconditional career definition' }] },
    editionAssessment: { title: '紫微斗數全書 / 紫微斗數', authorsEditors: ['traditional attribution to 陳希夷 is recorded by catalogues; authorship is not independently resolved', '羅洪先署名序 is visible in the transcription'], candidates: [{ evidenceId: 'source-ncl-catalog', edition: '影印本 / 正統道藏', publicationPlace: '上海', year: '1923-1926', location: 'catalog record, 1114 pages, 3 volumes' }, { evidenceId: 'source-cinii-1975-edition', edition: '南北山人編註, 童彭年校梓', publicationPlace: '台北', year: '1975', location: '448 pages' }], status: 'candidate_editions_not_linked_to_transcription' },
    scanAssessment: { status: 'scan_unavailable', provider: null, fileUrl: null, fileSizeBytes: null, immutableHash: null, pageReference: 'No legally accessible scan/file identity linking the selected Wikisource text to either catalogue candidate was confirmed.', limitation: 'URL and catalogue metadata do not establish immutable file identity.' },
    citationLineage: { nodes: ['source-ncl-catalog', 'source-cinii-1975-edition', 'source-wikisource-quan-shu-volume-one', 'source-ctext-ziwei-volume-one', 'source-mcu-taxonomy-paper'], edges: [{ from: 'source-ncl-catalog', to: 'source-wikisource-quan-shu-volume-one', relation: 'unproven_possible_edition_relation' }, { from: 'source-cinii-1975-edition', to: 'source-wikisource-quan-shu-volume-one', relation: 'unproven_later_reprint_relation' }, { from: 'source-wikisource-quan-shu-volume-one', to: 'source-ctext-ziwei-volume-one', relation: 'parallel_or_reprint_transcription; not_independent' }, { from: 'source-mcu-taxonomy-paper', to: 'source-wikisource-quan-shu-volume-one', relation: 'secondary_taxonomy_only' }], duplicateLineageNotIndependent: true },
    verdict: VERDICT,
    boundaryEvidenceCandidate: { candidateId: `boundary-${selected.occurrenceId.slice('ziwei-occ-'.length)}`, basis: '官祿 palace name plus conditional source wording only', notAStableClaim: true, cannotSupport: ['real-world truth', 'predictive validity', 'user application', 'stable claim', 'readiness', 'grounding'] },
  }
  const sourceBytes = await readFile(resolve(root, SOURCE_ARTIFACT))
  const artifact = { schemaVersion: SCHEMA, verdictToken: VERDICT, basisHead: BASIS_HEAD, observedHead: execFileSync('git', ['-c', 'core.fsmonitor=false', 'rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(), scope: 'one occurrence; literature source identity only; no claim or readiness promotion', accessDate: ACCESS_DATE, sourceArtifact: SOURCE_ARTIFACT, candidates, selection: { rule: 'descending sum of four evidence-axis scores, then occurrenceId ascending', selectedOccurrenceId: selected.occurrenceId, rejectedOccurrenceIds: candidates.slice(1).map(x => x.occurrenceId), selectedScore: selected.score }, record: selectedRecord, globalBoundary: { stableClaimCount: 0, readiness: 'not_safe_to_start', grounding: 'not_safe_to_start', groundingSubset: 'blocked', activation: 'experimental', calculationChanged: false, wholeZiweiExpansion: false }, negativeContract: { fixture: 'test/fixtures/ziwei/guarded-occurrence-exact-source-identity-pilot-negative-v0.json', detects: ['target replacement or multiple targets', 'resolved without edition/page', 'reprint mistaken for original scan', 'URL-only immutable identity', 'same-lineage double count', 'hidden text drift or qualifier omission', 'literature identity represented as truth', 'stable claim/ready/grounded promotion', 'fake citation or guessed metadata', 'nondeterministic selection/IDs/sort'] }, inputByteEvidence: [{ path: SOURCE_ARTIFACT, sha256: sha256(sourceBytes), scope: 'actual repository bytes' }], deterministicContract: { candidateOrder: 'score descending then occurrenceId ascending', selectedId: 'derived from existing four records only', rawText: 'copied without modification', timestamps: 'fixed accessDate; generation timestamp forbidden', externalFileHash: 'null when scan/file unavailable' }, materializer: `scripts/materialize-${SCHEMA}.mjs`, checker: `scripts/check-${SCHEMA}.mjs` }
  return attachArtifactIdentity(artifact, buildArtifactIdentity({ root, artifactId: SCHEMA, materializerPath: artifact.materializer, materializerVersion: MATERIALIZER_VERSION, baseHead: BASIS_HEAD, inputs: [SOURCE_ARTIFACT] }))
}

if (process.argv[1] === new URL(import.meta.url).pathname) { const target = resolve(process.argv[2] || `artifacts/${SCHEMA}/complete.json`); const body = canonicalJson(await buildPilotArtifact()); await mkdir(dirname(target), { recursive: true }); await writeFile(target, body); await writeFile(`${target}.integrity.json`, `${JSON.stringify({ schemaVersion: SCHEMA, artifactByteSha256: sha256(Buffer.from(body)), artifactByteSha256Scope: 'complete.json UTF-8 bytes including final LF' }, null, 2)}\n`); console.log(JSON.stringify({ target, selectedOccurrenceId: JSON.parse(body).selection.selectedOccurrenceId, artifactByteSha256: sha256(Buffer.from(body)) }, null, 2)) }

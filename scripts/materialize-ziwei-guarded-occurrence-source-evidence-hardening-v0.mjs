import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { attachArtifactIdentity, buildArtifactIdentity } from '../src/artifactIdentity.js'

export const SCHEMA = 'ziwei-guarded-occurrence-source-evidence-hardening-v0'
export const VERDICT = 'ziwei_guarded_occurrence_source_evidence_partial_unresolved'
export const MATERIALIZER_VERSION = '1.0.0'
export const BASIS_HEAD = 'ba3b516549afb98054033b778a07e241e2c13e83'
export const PILOT_PATH = 'artifacts/ziwei-structural-admission-guard-pilot-v0/complete.json'
const ACCESS_DATE = '2026-08-04'
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const sortValue = value => Array.isArray(value) ? value.map(sortValue) : value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort().map(k => [k, sortValue(value[k])])) : value
export const canonicalJson = value => `${JSON.stringify(sortValue(value), null, 2)}\n`

const SOURCE_LINEAGE = [
  {
    evidenceId: 'evidence-ctext-ziwei-palace-index', evidenceType: 'public_text_project', independence: 'same_or_parallel_transcription_not_independent',
    title: '紫微斗數 (Zi Wei Dou Shu)', authorOrEditor: 'Chinese Text Project', edition: null, year: null,
    url: 'https://ctext.org/datawiki.pl?if=gb&res=8418262', accessed: ACCESS_DATE, location: 'datawiki palace index; stable page anchor, no page image',
    excerpt: '兄弟宮; 奴僕宮（又名僕役宮及交友宮）; 官祿宮（又名事業宮）; 福德宮（又名福壽宮）',
    role: 'alias and twelve-palace correspondence only', immutableRetrievalHash: null,
  },
  {
    evidenceId: 'evidence-wikisource-quan-shu-volume-one', evidenceType: 'public_transcription_of_classic', independence: 'primary_text_candidate_not_edition_locked',
    title: '紫微斗數全書/卷一', authorOrEditor: 'traditional attribution shown by repository; exact editor not established', edition: null, year: null,
    url: 'https://zh.wikisource.org/zh/%E7%B4%AB%E5%BE%AE%E6%96%97%E6%95%B8%E5%85%A8%E6%9B%B8/%E5%8D%B7%E4%B8%80', accessed: ACCESS_DATE, location: '卷一, 斗數準繩 / 斗數發微論 / 諸星問答論, stable HTML line locations 284-324, 392, 397-412, 438-444',
    excerpt: '惡星應八宮，奴僕無助。\n官祿遇紫府，富而且貴。\n福德遇空劫，奔走無力。\n天機兄弟主。\n為福德宮之主宰。',
    role: 'direct textual occurrence and conditional rule wording; not a modern palace definition', immutableRetrievalHash: null,
  },
  {
    evidenceId: 'evidence-mcu-palace-taxonomy-paper', evidenceType: 'academic_institution_public_pdf', independence: 'independent_secondary_taxonomy_only',
    title: '紫微斗數主星曜代表人物圖像創作之初探', authorOrEditor: '林聖芬', edition: 'conference PDF, repository copy', year: '2020',
    url: 'https://web.sdsymposia.mcu.edu.tw/sites/default/files/u3/2020/A2/PAPER/A216_%E6%9E%97%E8%81%96%E8%8A%AC-%E7%B4%AB%E5%BE%AE%E斗數主星曜代表人物圖像創作之初探.pdf', accessed: ACCESS_DATE, location: 'PDF p. 1 / section listing twelve palaces; repository pagination only',
    excerpt: '十二宮位包括：命宮、身宮、兄弟宮、夫妻宮、子女宮、財帛宮、疾厄宮、遷移宮、奴僕宮（交友宮）、官祿宮（事業宮）、田宅宮、福德宮（小命宮）、父母宮等。',
    role: 'independent secondary confirmation of palace names and aliases; no exact local description corroboration', immutableRetrievalHash: null,
  },
]

const OCCURRENCES = {
  'ziwei-occ-2260aba6ed2163e3': { slot: 'career', palace: '官祿宮', aliases: ['事業宮'], text: '직업, 사회적 위치, 역량 발휘', sourceEvidence: ['evidence-wikisource-quan-shu-volume-one', 'evidence-ctext-ziwei-palace-index', 'evidence-mcu-palace-taxonomy-paper'], mapping: 'local career -> 官祿/事業; classic text associates 官祿 with conditional office/status rules', candidate: 'palace-name-and-domain correspondence only', limits: ['social position and capability wording is broader than cited text', 'no exact edition or page image', 'no independent worked chart for this semantic occurrence'] },
  'ziwei-occ-a09e10a5495186b8': { slot: 'siblings', palace: '兄弟宮', aliases: [], text: '형제자매, 동료, 친밀한 지인 관계', sourceEvidence: ['evidence-wikisource-quan-shu-volume-one', 'evidence-ctext-ziwei-palace-index', 'evidence-mcu-palace-taxonomy-paper'], mapping: 'local siblings -> 兄弟; direct palace-name match, with no cited text for the added colleague/acquaintance scope', candidate: 'palace-name correspondence only', limits: ['added colleague and close-acquaintance scope is not directly corroborated', 'no exact edition or page image', 'star/configuration conditions are absent'] },
  'ziwei-occ-a72bdf60ef809b58': { slot: 'friends', palace: '奴僕宮', aliases: ['僕役宮', '交友宮'], text: '부하, 대중, 일반 인간관계', sourceEvidence: ['evidence-wikisource-quan-shu-volume-one', 'evidence-ctext-ziwei-palace-index', 'evidence-mcu-palace-taxonomy-paper'], mapping: 'local friends -> 奴僕/僕役/交友 alias family; local label is not itself an independent rule source', candidate: 'alias correspondence; semantic scope unresolved', limits: ['subordinates/public/general relationships are not one closed classical configuration', 'no exact edition or page image', 'classic wording is conditional and star-dependent'] },
  'ziwei-occ-e73f469c5e35e072': { slot: 'mind', palace: '福德宮', aliases: ['福壽宮'], text: '정신적 만족, 취향, 내면의 휴식', sourceEvidence: ['evidence-wikisource-quan-shu-volume-one', 'evidence-ctext-ziwei-palace-index', 'evidence-mcu-palace-taxonomy-paper'], mapping: 'local mind -> 福德/福壽 alias family; cited classic text uses 福德 in conditional rules, not this complete modern gloss', candidate: 'palace-name correspondence only', limits: ['mental satisfaction/taste/rest wording lacks exact independent citation', 'no exact edition or page image', 'no configuration or star conditions supplied'] },
}

export async function buildHardeningArtifact() {
  const root = resolve(new URL('..', import.meta.url).pathname)
  const pilot = JSON.parse(await readFile(resolve(root, PILOT_PATH), 'utf8'))
  const selected = [...pilot.records].sort((a, b) => a.admissionUnit.occurrence.occurrenceId.localeCompare(b.admissionUnit.occurrence.occurrenceId))
  const records = selected.map(record => {
    const id = record.admissionUnit.occurrence.occurrenceId; const item = OCCURRENCES[id]
    if (!item) throw new Error(`unexpected_target:${id}`)
    return {
      occurrenceId: id, rawText: { text: record.admissionUnit.occurrence.rawText.text, source: record.admissionUnit.occurrence.provenanceReference.source, isVerifiedFact: false, epistemicBoundary: 'raw_meaning_candidate_only' },
      provenance: { pilotArtifact: PILOT_PATH, pilotSelection: 'categoryLists.structuralGuardPossible', guardStatus: record.admissionUnit.guard.status, sourceIdentityBefore: record.admissionUnit.guard.sourceIdentity, fixtureReferences: record.admissionUnit.occurrence.provenanceReference.fixtureReferences, existingSourceReferences: record.admissionUnit.occurrence.provenanceReference.evidenceReferences },
      sourceIdentityAssessment: { status: 'source_identity_partial', title: '紫微斗數全書', authorOrEditor: 'traditional attribution; exact editor unresolved', edition: null, year: null, location: 'public repository URL and named section/line anchors recorded; exact edition/page image unresolved', originalTranslationReprintLineage: 'public transcription/parallel datawiki and independent secondary taxonomy; same-source duplicates are not counted independently', unresolvedReasons: ['exact_edition_unresolved', 'immutable_retrieval_bytes_unavailable', 'original_author_editor_identity_not_closed'] },
      evidenceIds: item.sourceEvidence,
      ruleCorrespondence: { localPalaceSlot: item.slot, localPalaceName: item.palace, aliases: item.aliases, mapping: item.mapping, configurationAssessment: 'configuration_match_for_palace_alias_only', conditions: ['palace identity alone is insufficient; cited classic text is star/configuration conditional', 'local description contains a modern gloss whose scope is not fully reproduced by the evidence'], result: 'insufficient_evidence' },
      calculationFixtureReconciliation: { localCalculationChanged: false, fixtureReferencesPreserved: true, comparedCalculation: 'not applicable to semantic palace description; existing fixtures remain regression_only', result: 'not_independently_verified', reason: 'no independent chart oracle or immutable external fixture bytes' },
      evidenceLedger: item.sourceEvidence.map(evidenceId => ({ evidenceId, correspondence: evidenceId === 'evidence-wikisource-quan-shu-volume-one' ? 'direct_or_near_direct_textual occurrence; conditional and configuration-bound' : evidenceId === 'evidence-ctext-ziwei-palace-index' ? 'palace name/alias correspondence' : 'independent secondary taxonomy correspondence', match: evidenceId === 'evidence-mcu-palace-taxonomy-paper' ? 'partial' : 'partial', limitation: evidenceId === 'evidence-ctext-ziwei-palace-index' ? 'parallel source lineage; not independent corroboration' : 'does not establish the whole local Korean description or reality-based truth' })),
      independentRuleCorroboration: { status: 'insufficient_evidence', independentEvidenceIds: ['evidence-mcu-palace-taxonomy-paper'], sameRuleMatch: false, configuration: 'palace alias only; star, brightness, trine/opposite, transformation, time and school settings absent', mismatch: null, opposingEvidence: [], unresolvedReasons: ['independent source confirms taxonomy but not exact semantic rule', 'no independently reproducible worked chart with identical configuration'] },
      verdict: 'source_identity_partial', boundaryEvidenceCandidates: [{ candidateId: `boundary-${id.slice('ziwei-occ-'.length)}`, basis: 'palace name/alias and conditional textual wording only', text: item.candidate, notAStableClaim: true, cannotSupport: ['real-world truth', 'personality prediction', 'user application', 'ranking', 'grounding'] }],
      guardPreservation: { stableClaim: false, readiness: 'not_safe_to_start', grounding: 'not_safe_to_start', activation: 'experimental', rawTextMeaningUnchanged: true, provenanceMeaningUnchanged: true, guardMeaningUnchanged: true },
      limits: item.limits,
    }
  })
  const sourceByteEvidence = Object.fromEntries(await Promise.all(['src/ziwei/ziweiContract.js', PILOT_PATH].map(async path => [path, { sha256: sha256(await readFile(resolve(root, path))), scope: 'actual repository bytes' }])))
  const artifact = { schemaVersion: SCHEMA, verdictToken: VERDICT, basisHead: BASIS_HEAD, observedHead: execFileSync('git', ['-c', 'core.fsmonitor=false', 'rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(), scope: 'exactly four mechanically selected guarded occurrences; source evidence and claim-boundary review only', accessDate: ACCESS_DATE, sourceLineage: SOURCE_LINEAGE, targetSelection: { sourceArtifact: PILOT_PATH, selector: 'records whose occurrence IDs equal audit categoryLists.structuralGuardPossible', occurrenceCount: 4, occurrenceIds: records.map(x => x.occurrenceId) }, records, distribution: { source_identity_resolved_and_independently_corrobated: 0, source_identity_resolved_evidence_partial: 0, source_identity_partial: 4, configuration_mismatch: 0, source_identity_unresolved: 0, evidence_conflict: 0, independentCorroborationInsufficient: 4, boundaryEvidenceCandidateCount: 4 }, globalBoundary: { stableClaimBoundary: 0, readiness: 'not_safe_to_start', grounding: 'not_safe_to_start', activation: 'experimental', groundingSubset: 'blocked', wholeSystemExpansion: false, reason: 'source evidence does not establish stable claims, reality truth, user applicability, or readiness' }, citationLineage: { duplicateSourcesNotCountedAsIndependent: true, lineage: { 'evidence-ctext-ziwei-palace-index': 'parallel public taxonomy transcription; do not count independently from classic transcription', 'evidence-wikisource-quan-shu-volume-one': 'public transcription of classic candidate', 'evidence-mcu-palace-taxonomy-paper': 'independent secondary taxonomy only' } }, calculationBoundary: { changed: false, existingFixtureReconciliation: 'preserved; no new independent calculation claim', externalFixtureBytes: null }, unresolvedNextEvidence: ['exact edition/editor/year and scan identity for 紫微斗數全書', 'immutable retrieval bytes/hash or library scan', 'independent rule source with exact palace semantic wording and conditions', 'independent worked chart reproducing identical palace/configuration settings'], negativeContract: { fixture: 'test/fixtures/ziwei/guarded-occurrence-source-evidence-hardening-negative-v0.json', detects: ['target outside four', 'blog/republication promoted as independent original', 'duplicate source double-counted', 'resolved without edition/location', 'configuration mismatch or opposing evidence hidden', 'literature correspondence represented as reality truth', 'stable claim/ready/grounded promotion', 'fake citation', 'nondeterministic IDs/sort'] }, sourceByteEvidence, deterministicContract: { recordOrder: 'lexicographic occurrenceId', evidenceOrder: 'declared evidence ID order', occurrenceId: 'preserved from pilot; no manual replacement', rawText: 'exact pilot bytes; no normalization', timestamps: 'accessDate fixed; generation timestamp forbidden', hashes: ['artifactPayloadSha256', 'complete.json UTF-8 bytes including final LF'] }, materializer: `scripts/materialize-${SCHEMA}.mjs`, checker: `scripts/check-${SCHEMA}.mjs` }
  return attachArtifactIdentity(artifact, buildArtifactIdentity({ root, artifactId: SCHEMA, materializerPath: artifact.materializer, materializerVersion: MATERIALIZER_VERSION, baseHead: BASIS_HEAD, inputs: [PILOT_PATH, 'src/ziwei/ziweiContract.js'] }))
}

if (process.argv[1] === new URL(import.meta.url).pathname) { const target = resolve(process.argv[2] || `artifacts/${SCHEMA}/complete.json`); const body = canonicalJson(await buildHardeningArtifact()); await mkdir(dirname(target), { recursive: true }); await writeFile(target, body); await writeFile(`${target}.integrity.json`, `${JSON.stringify({ schemaVersion: SCHEMA, artifactByteSha256: sha256(Buffer.from(body)), artifactByteSha256Scope: 'complete.json UTF-8 bytes including final LF' }, null, 2)}\n`); console.log(JSON.stringify({ target, occurrenceCount: 4, artifactByteSha256: sha256(Buffer.from(body)) }, null, 2)) }

import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { attachArtifactIdentity, buildArtifactIdentity } from '../src/artifactIdentity.js'

export const SCHEMA = 'ziwei-selected-occurrence-public-scan-edition-linkage-follow-up-v0'
export const VERDICT = 'public_scan_linkage_unresolved'
export const MATERIALIZER_VERSION = '1.0.0'
export const BASIS_HEAD = '42632ff6eb8331b588f4b857c976036d0771a388'
export const TARGET_OCCURRENCE = 'ziwei-occ-2260aba6ed2163e3'
export const SOURCE_ARTIFACT = 'artifacts/ziwei-guarded-occurrence-source-evidence-hardening-v0/complete.json'
export const ACCESS_DATE = '2026-08-04'
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const sortValue = value => Array.isArray(value) ? value.map(sortValue) : value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort().map(k => [k, sortValue(value[k])])) : value
export const canonicalJson = value => `${JSON.stringify(sortValue(value), null, 2)}\n`

const EVIDENCE = {
  wikisource: { evidenceId: 'source-wikisource-quan-shu-volume-one', role: 'public transcription / text comparison', url: 'https://zh.wikisource.org/zh-hant/%E7%B4%AB%E5%BE%AE%E6%96%97%E6%95%B8%E5%85%A8%E6%9B%B8/%E5%8D%B7%E4%B8%80', recordOrFileId: null, edition: null, volume: '卷一', page: null, fileUrl: null, fileSizeBytes: null, checksum: null, etag: null },
  ncl: { evidenceId: 'source-ncl-catalog', role: 'catalog and holding', url: 'https://rbook.ncl.edu.tw/NCLSearch/Search/SearchDetail?HasImage=&SourceID=1&item=1b36e75d6cb348bcafa51089508d41ccfDI3ODUxNA2.T5_fvtPg0BL_gp0oecUpf3kBMYmGj_Zu9aAWwhejGlk_&page=3538', recordOrFileId: 'rarecatx0428879', edition: '影印本 / 正統道藏', volume: '三卷', page: null, fileUrl: null, fileSizeBytes: null, checksum: null, etag: null },
  cinii: { evidenceId: 'source-cinii-1975-edition', role: 'catalog and holding', url: 'https://ci.nii.ac.jp/ncid/BA73215996', recordOrFileId: 'BA73215996; Tokyo Metropolitan Central Library C1488||5002||75 400005729', edition: '南北山人編註 / 童彭年校梓', volume: null, page: null, fileUrl: null, fileSizeBytes: null, checksum: null, etag: null },
}

const editionTrace = (item, finding) => ({
  editionFamily: item.editionFamily,
  catalog: { provider: item.provider, stableUrl: item.catalogUrl, recordId: item.catalogRecordId, edition: item.edition, publicationPlace: item.publicationPlace, publicationYear: item.publicationYear, accessDate: ACCESS_DATE },
  holding: { provider: item.holdingProvider, itemId: item.holdingId, stableUrl: item.holdingUrl, status: 'holding_resolved', accessDate: ACCESS_DATE },
  viewerFile: { status: 'not_exposed_by_public_record', viewerUrl: null, fileUrl: null, imageManifestUrl: null, fileViewId: null, fileSizeBytes: null, checksum: null, etag: null, accessDate: ACCESS_DATE },
  editionVolumePage: { edition: item.edition, volume: item.volume, page: null, status: 'page_not_located', reason: finding },
  wikisourceTextLinkage: { sourceUrl: EVIDENCE.wikisource.url, exactMatch: false, normalizedMatch: false, status: 'lineage_insufficient', reason: 'No edition page or scan bytes were available for comparison.' },
  publicAccessFinding: finding,
})

export async function buildFollowUpArtifact() {
  const root = resolve(new URL('..', import.meta.url).pathname)
  const source = JSON.parse(await readFile(resolve(root, SOURCE_ARTIFACT), 'utf8'))
  const record = source.records.find(item => item.occurrenceId === TARGET_OCCURRENCE)
  if (!record) throw new Error(`missing_target:${TARGET_OCCURRENCE}`)
  const nclFinding = 'Catalog and holding are visible; no public viewer, fixed PDF, page image, or manifest linkage is exposed in the record.'
  const ciniiFinding = 'Catalog and one library holding are visible; CiNii exposes an OPAC link only, not a public viewer, fixed PDF, page image, or manifest.'
  const editions = [
    editionTrace({ editionFamily: 'ncl-1923-1926-shanghai-facsimile', provider: 'NCL', catalogUrl: EVIDENCE.ncl.url, catalogRecordId: 'rarecatx0428879', edition: '影印本 / 正統道藏', publicationPlace: '上海', publicationYear: '1923-1926', holdingProvider: '中國國家圖書館', holdingId: 'rarecatx0428879', holdingUrl: EVIDENCE.ncl.url, volume: '三卷 / 1冊（1114）' }, nclFinding),
    editionTrace({ editionFamily: 'cinii-1975-taipei-reprint', provider: 'CiNii Books', catalogUrl: EVIDENCE.cinii.url, catalogRecordId: 'BA73215996', edition: '南北山人編註 / 童彭年校梓', publicationPlace: '台北', publicationYear: '1975-08', holdingProvider: '東京都立中央図書館', holdingId: 'C1488||5002||75 400005729', holdingUrl: EVIDENCE.cinii.url, volume: '448p' }, ciniiFinding),
  ]
  const sourceBytes = await readFile(resolve(root, SOURCE_ARTIFACT))
  const artifact = {
    schemaVersion: SCHEMA, verdictToken: VERDICT, basisHead: BASIS_HEAD, scope: { occurrenceIds: [TARGET_OCCURRENCE], editionFamilies: editions.map(x => x.editionFamily), expansion: 'none' }, accessDate: ACCESS_DATE, sourceArtifact: SOURCE_ARTIFACT,
    existingEvidenceLedger: record.evidenceLedger, selectedOccurrence: { occurrenceId: record.occurrenceId, rawText: record.rawText, provenance: record.provenance, guard: record.guardPreservation, sourceIdentityAssessment: record.sourceIdentityAssessment },
    linkageTrace: editions,
    textComparison: { wikisource: { section: '卷一 / 斗數準繩 and 諸星問答論', page: null, exactMatch: false, normalizedMatch: false, observedCorrespondence: ['官祿 palace-name occurrence', 'conditional star/configuration wording', 'partial star-question correspondence'], qualifierDifferences: ['conditional polarity and configuration qualifiers are not equivalent to the local gloss', 'star identity and configuration are not present in the local text'], wordingDrift: ['직업, 사회적 위치, 역량 발휘 is broader than the located conditional classical wording'], status: 'page_not_located_lineage_insufficient' }, ncl: { status: 'not_comparable_without_page' }, cinii: { status: 'not_comparable_without_page' } },
    immutableIdentity: { scanBytesObtained: false, fileSizeBytes: null, sha256: null, checksum: null, etag: null, basis: 'catalog URLs, dynamic HTML, and viewer absence do not identify immutable bytes' },
    globalBoundary: { stableClaimCount: 0, verifiedFactCount: 0, readiness: 'not_safe_to_start', grounding: 'not_safe_to_start', groundingSubset: 'blocked', activation: 'experimental', rawTextChanged: false, provenanceChanged: false, guardChanged: false, interpretationCreated: false, scopeExpanded: false },
    assessment: { finalVerdict: VERDICT, unresolvedReasons: ['NCL catalog-to-holding is resolved but public scan/page linkage is not exposed', 'CiNii catalog-to-holding is resolved but public scan/page linkage is not exposed', 'neither edition page can be compared to Wikisource', 'direct Wikisource-to-specific-edition genealogy remains unproven'], legacySourceRecovery: 'frozen', nextTrack: 'clean Ziwei rule corpus', noFurtherScanRecommendation: true },
    negativeContract: { fixture: 'test/fixtures/ziwei/selected-occurrence-public-scan-edition-linkage-follow-up-negative-v0.json', detects: ['scope expansion', 'catalog promoted to scan identity', 'viewer-only immutable bytes', 'resolved without page', 'Wikisource genealogy inference', 'hidden qualifier drift', 'stable/verified/ready/grounded promotion', 'fake hash or metadata', 'nondeterministic IDs or sort'] },
    inputByteEvidence: [{ path: SOURCE_ARTIFACT, sha256: sha256(sourceBytes), scope: 'actual repository bytes' }],
    deterministicContract: { target: TARGET_OCCURRENCE, editionOrder: 'fixed NCL then CiNii order', ids: 'explicit stable catalog/holding IDs only', timestamps: 'fixed accessDate; generation timestamp forbidden', externalFileHash: 'null unless scan bytes are directly obtained' },
    materializer: `scripts/materialize-${SCHEMA}.mjs`, checker: `scripts/check-${SCHEMA}.mjs`, sourceRawTextAndGuardsCopied: true,
  }
  return attachArtifactIdentity(artifact, buildArtifactIdentity({ root, artifactId: SCHEMA, materializerPath: artifact.materializer, materializerVersion: MATERIALIZER_VERSION, baseHead: BASIS_HEAD, inputs: [SOURCE_ARTIFACT] }))
}

if (process.argv[1] === new URL(import.meta.url).pathname) { const target = resolve(process.argv[2] || `artifacts/${SCHEMA}/complete.json`); const body = canonicalJson(await buildFollowUpArtifact()); await mkdir(dirname(target), { recursive: true }); await writeFile(target, body); await writeFile(`${target}.integrity.json`, `${JSON.stringify({ schemaVersion: SCHEMA, artifactByteSha256: sha256(Buffer.from(body)), artifactByteSha256Scope: 'complete.json UTF-8 bytes including final LF' }, null, 2)}\n`); console.log(JSON.stringify({ target, verdict: VERDICT, artifactByteSha256: sha256(Buffer.from(body)) }, null, 2)) }

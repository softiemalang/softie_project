import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { attachArtifactIdentity, buildArtifactIdentity, checkHistoricalRepositoryBasis } from '../src/artifactIdentity.js'
import { getPdfSourceMetadata, resolvePdfSourcePathSync } from './lib/pdf-source-resolver.mjs'

export const SCHEMA = 'ziwei-palace-semantic-source-frontier-v1'
export const VERDICT = 'partial_ziwei_palace_source_authority_with_semantic_identity_blocker'
export const MATERIALIZER_VERSION = '1.0.0'
export const BASIS_HEAD = '45ceb1d27143ed4d61487e2dce0dfc35ef872d1b'

const PDFINFO = '/Users/softie/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin/override/pdfinfo'
const NANBEI = Object.freeze({
  editionId: 'nanbei', sourceId: 'nanbei_quanbao_219p',
  label: '命-南北山人_紫微斗数全书.pdf',
  sha256: '4786a94ab454acdabf9716d7c0db4756dbcbde99a88bc45fda254863c1961023',
  pageCount: 219, encrypted: 'no',
  renderedPages: {
    1: 'bb81c99d73fc9c5c569bd97e0b2e7482249de291d0d1de12a4b6e8e09e51504f',
    4: '2f60195d77ba98b922132367c7f8c01587133a07850dbc0414a17ed2e09b8e4b',
    7: 'ebbdcf1a35d21e0fcf4339182af2df3ad290c279b8627bab9dc7f80156083bac',
    8: 'd740c6ed5191e516f40ee61bda7f95ff2081954b21b091c22bee9c0249e8acea',
    10: '2e16be712ffffa3de884b95afbf1fc5837a5c59a801114ecea4c2365d0192ffb',
  },
})
const NANYANG = Object.freeze({
  editionId: 'nanyangtang', sourceId: 'nanyangtang_quanbao_528p',
  label: '新锓希夷陈先生紫微斗数全书…明代南阳堂刊本…pdf',
  sha256: '04e184c4a52cb042dc885c6ccc9135d94ab25de62007506198ee979a33e66bfc',
  pageCount: 528, encrypted: 'no',
  renderedPages: {
    1: '3d59ff59aa8be6bd189277ac287f6f61590b5066add5d701f27bbdb07442e79c',
    2: '90a878b4db1644f885593fdfdaccd6cae38f280201adaf34860c599fb46f6e8a',
  },
})

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const stable = value => Array.isArray(value) ? value.map(stable) : value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])])) : value
export const canonicalJson = value => `${JSON.stringify(stable(value), null, 2)}\n`

function inspectPdf(source) {
  const path = resolvePdfSourcePathSync(source.sourceId)
  const bytes = readFileSync(path)
  const info = execFileSync(PDFINFO, [path], { encoding: 'utf8' })
  const pageCount = Number(info.match(/^Pages:\s+(\d+)$/m)?.[1] || 0)
  const encrypted = info.match(/^Encrypted:\s+(.+)$/m)?.[1]?.trim().toLowerCase() || 'unknown'
  if (sha256(bytes) !== source.sha256) throw new Error(`source_pdf_sha256_mismatch:${source.editionId}`)
  if (pageCount !== source.pageCount) throw new Error(`source_pdf_page_count_mismatch:${source.editionId}:${pageCount}`)
  if (encrypted !== source.encrypted) throw new Error(`source_pdf_encryption_mismatch:${source.editionId}:${encrypted}`)
  return { editionId: source.editionId, sourceId: source.sourceId, label: source.label, path, sha256: source.sha256, byteLength: bytes.length, pageCount, encrypted, pdfInfo: info.split('\n').filter(Boolean) }
}

function visualObservation({ id, editionId, pdfPage, role, reading, supports, doesNotSupport, renderSha256 }) {
  return { id, editionId, pdfPage, role, visualReview: { tool: 'bundled pdftoppm', dpi: 110, fullPagePngSha256: renderSha256, renderStorage: 'external_temp_only_not_in_git' }, reading, supports, doesNotSupport }
}

function observations() {
  return [
    visualObservation({ id: 'nanbei-p1-title', editionId: 'nanbei', pdfPage: 1, role: 'title_page_identity', renderSha256: NANBEI.renderedPages[1], reading: '표지에서 紫微斗數全書, 南北山人, 陳希夷先生 등의 표면 title/editor 문자열을 직접 읽었다.', supports: ['title_surface_identity'], doesNotSupport: ['edition_lineage_beyond_visible_page', 'palace_semantic_mapping'] }),
    visualObservation({ id: 'nanyang-p1-title', editionId: 'nanyangtang', pdfPage: 1, role: 'title_page_identity', renderSha256: NANYANG.renderedPages[1], reading: '표지에서 紫微斗數全書 표면 title을 직접 읽었다.', supports: ['title_surface_identity'], doesNotSupport: ['edition_lineage_beyond_visible_page', 'palace_semantic_mapping'] }),
    visualObservation({ id: 'nanyang-p2-title-imprint', editionId: 'nanyangtang', pdfPage: 2, role: 'title_editor_identity', renderSha256: NANYANG.renderedPages[2], reading: '본문 앞면에서 陳抟先生, 南陽堂刊本 계열의 표면 title/editor·刊本 문자열을 직접 읽었다.', supports: ['visible_editor_or_print_identity'], doesNotSupport: ['complete_bibliographic_lineage', 'palace_semantic_mapping'] }),
    visualObservation({ id: 'nanbei-p4-branch-trigram-diagram', editionId: 'nanbei', pdfPage: 4, role: 'branch_diagram_witness', renderSha256: NANBEI.renderedPages[4], reading: '命盤構成 도식의 외곽에 지지와 팔괘/방위 표기가 보인다. 궁명 12개와 production ordinal의 대응표는 보이지 않는다.', supports: ['branch_and_diagram_position_observation'], doesNotSupport: ['palace_name_to_branch_mapping', 'production_ordinal_semantic_identity'] }),
    visualObservation({ id: 'nanbei-p7-twelve-cell-diagram', editionId: 'nanbei', pdfPage: 7, role: 'twelve_cell_branch_diagram_witness', renderSha256: NANBEI.renderedPages[7], reading: '十二宮冠蓋 도식은 12칸과 巳午未申 / 酉戌 / 亥子丑寅 / 卯辰 지지 표기를 보인다. 칸별 命·兄弟·夫妻 등 궁명은 보이지 않는다.', supports: ['twelve_cell_branch_slot_observation'], doesNotSupport: ['palace_name_to_branch_mapping', 'shared_source_production_coordinate_frame'] }),
    visualObservation({ id: 'nanbei-p8-ming-shen-rule', editionId: 'nanbei', pdfPage: 8, role: 'ming_shen_traversal_witness', renderSha256: NANBEI.renderedPages[8], reading: '九、定命、身二宮에서 寅起正月, 生月 순수, 命宮 역수, 身宮 순수의 방향·기점 설명을 직접 읽었다.', supports: ['ming_shen_branch_traversal_rule'], doesNotSupport: ['12_palace_name_semantics', 'shared_diagram_to_production_ordinal_mapping'] }),
    visualObservation({ id: 'nanbei-p10-ming-shen-bureau-table', editionId: 'nanbei', pdfPage: 10, role: 'branch_bureau_table_witness', renderSha256: NANBEI.renderedPages[10], reading: '命宮地支·生時와 五行局을 연결하는 표 및 命宮/身宮 지지 표기가 보인다. 12궁명 전체와 production palace enum의 대응은 보이지 않는다.', supports: ['branch_input_and_bureau_table_observation'], doesNotSupport: ['palace_name_to_branch_mapping', 'production_ordinal_semantic_identity'] }),
  ].sort((a, b) => a.id.localeCompare(b.id))
}

function buildClaims(sourceWitnesses, sourceObservations, predecessorHashes) {
  return [
    { id: 'scan_witness_identity', status: 'direct_within_scope', statement: '두 허용 PDF의 실제 bytes, page count, encryption 상태와 표지/편집·刊本 표면 문자열을 확인했다.', evidence: { sourceWitnesses: sourceWitnesses.map(item => item.editionId), observations: sourceObservations.filter(item => item.role.includes('identity')).map(item => item.id) }, semanticLimit: 'visible title/print identity is not complete edition lineage or textual authority' },
    { id: 'branch_diagram_observation', status: 'direct_within_scope', statement: 'Nanbei p4와 p7에서 지지·도식 칸을 직접 관찰했다.', evidence: { observations: ['nanbei-p4-branch-trigram-diagram', 'nanbei-p7-twelve-cell-diagram'] }, semanticLimit: 'branch slots are not palace-name semantics' },
    { id: 'ming_shen_traversal_observation', status: 'direct_within_scope', statement: 'Nanbei p8에서 명궁·신궁의 기점과 순·역수 어휘를 직접 관찰했다.', evidence: { observations: ['nanbei-p8-ming-shen-rule'] }, semanticLimit: 'traversal rule does not identify all 12 palace labels or production ordinal meaning' },
    { id: 'palace_semantic_identity', status: 'blocked_semantic_identity_insufficient', statement: '현재 허용 원전의 직접 검토 범위는 지지/도식 슬롯/명신 방향을 보여주지만 궁명↔지지↔production ordinal의 shared semantic mapping을 보여주지 않는다.', evidence: { observations: ['nanbei-p4-branch-trigram-diagram', 'nanbei-p7-twelve-cell-diagram', 'nanbei-p8-ming-shen-rule', 'nanbei-p10-ming-shen-bureau-table'], predecessor: predecessorHashes }, semanticLimit: 'must remain unresolved; no numeric transform or circular production comparison may promote it' },
    { id: 'cross_edition_semantic_identity', status: 'blocked_cross_edition_identity_unresolved', statement: '두 PDF의 visible title/print identity는 확인되지만 같은 semantic coordinate convention 또는 edition lineage를 직접 증명하지 않는다.', evidence: { sourceWitnesses: sourceWitnesses.map(item => item.editionId), observations: ['nanbei-p1-title', 'nanyang-p1-title', 'nanyang-p2-title-imprint'] }, semanticLimit: 'requires an independently reviewable shared mapping witness' },
    { id: 'production_source_authority', status: 'blocked_source_authority_not_established', statement: 'source presence, page identity, visual observations, repository conventions, and prior numeric transforms remain separate; no production semantic authority is established.', evidence: { repositoryConvention: ['src/ziwei/ziweiContract.js', 'src/ziwei/ziweiResolver.js'], predecessor: predecessorHashes }, semanticLimit: 'no readiness, interpretation, or production activation' },
  ]
}

export async function buildArtifact() {
  const root = resolve(new URL('..', import.meta.url).pathname)
  const observedHead = execFileSync('git', ['-c', 'core.fsmonitor=false', 'rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim()
  const basis = checkHistoricalRepositoryBasis(root, BASIS_HEAD)
  if (basis.errors.length) throw new Error(`historical repository basis invalid:${basis.errors.join(',')}`)
  const sourceWitnesses = [inspectPdf(NANBEI), inspectPdf(NANYANG)]
  const sourceObservations = observations()
  const predecessorPaths = [
    'artifacts/ziwei-palace-coordinate-semantic-identity-v0/complete.json',
    'artifacts/ziwei-life-body-palace-ruler-source-evidence-v0/complete.json',
    'artifacts/ziwei-system-evidence-readiness-coverage-map-v0/complete.json',
    'src/ziwei/ziweiContract.js', 'src/ziwei/ziweiResolver.js', 'src/ziwei/palaceRelationRules.js',
  ]
  const predecessorHashes = Object.fromEntries(predecessorPaths.map(path => [path, sha256(readFileSync(resolve(root, path)))]))
  const claims = buildClaims(sourceWitnesses, sourceObservations, predecessorHashes)
  const artifact = {
    schemaVersion: SCHEMA, verdictToken: VERDICT, basisHead: BASIS_HEAD, observedHead,
    sourceWitnesses, sourceObservations, claims,
    frontierAssessment: {
      investigated: ['scan/title identity', 'branch diagram coordinate', '12-cell palace diagram', '命宮·身宮 traversal', '命宮·身宮·五行局 table', 'cross-edition source identity'],
      closedWithinScope: ['actual PDF byte identity', 'page count and encryption metadata', 'visible title/editor/print surface identity', 'direct observation of branch/diagram/traversal evidence'],
      stillBlocked: ['palace name to branch mapping', 'source diagram to production ordinal semantic equivalence', 'cross-edition semantic identity', 'textual authority for production interpretation'],
      nextRequiredEvidence: 'one readable, immutable, edition-identified witness that directly binds all 12 palace names to branches/diagram slots and states the same coordinate frame used by production; independent oracle remains separate',
    },
    boundaries: {
      sourcePresenceIsNotClaimVerification: true, numericAgreementIsNotSemanticAuthority: true, titlePageIsNotTextualAuthority: true,
      branchDiagramIsNotPalaceIdentity: true, crossEditionAgreementIsNotSemanticIdentity: true,
      productionRuleModified: false, publicContractModified: false, readinessModified: false, existingArtifactsModified: false,
      stableClaimCount: 0, readiness: 'not_safe_to_start', grounding: 'blocked', activation: 'experimental', interpretationGenerated: false,
      pdfStoredInGit: false, renderStoredInGit: false,
    },
    predecessorProtection: predecessorHashes,
    deterministicContract: { generatedAt: 'forbidden', sourceBytes: 'actual bytes read and hashed', visualReview: 'full-page PNG hashes from external 110 dpi pdftoppm review', ordering: 'lexicographic observation and claim IDs', finalLf: true },
    materializer: `scripts/materialize-${SCHEMA}.mjs`,
  }
  return attachArtifactIdentity(artifact, buildArtifactIdentity({ root, artifactId: SCHEMA, materializerPath: artifact.materializer, materializerVersion: MATERIALIZER_VERSION, baseHead: BASIS_HEAD, inputs: [...predecessorPaths, 'scripts/lib/pdf-source-resolver.mjs', 'src/artifactIdentity.js'] }))
}

export async function writeArtifact(target) {
  const artifact = await buildArtifact(); const dir = dirname(target); await mkdir(dir, { recursive: true })
  const body = Buffer.from(canonicalJson(artifact)); await writeFile(target, body)
  const auxiliaries = { 'source-witnesses.json': artifact.sourceWitnesses, 'source-observations.json': artifact.sourceObservations, 'claim-ledger.json': artifact.claims, 'frontier-assessment.json': artifact.frontierAssessment }
  for (const [name, value] of Object.entries(auxiliaries)) { const bytes = Buffer.from(canonicalJson(value)); const path = resolve(dir, name); await writeFile(path, bytes); await writeFile(`${path}.integrity.json`, `${JSON.stringify({ schemaVersion: SCHEMA, artifactByteSha256: sha256(bytes), artifactByteSha256Scope: 'UTF-8 bytes including final LF' }, null, 2)}\n`) }
  await writeFile(`${target}.integrity.json`, `${JSON.stringify({ schemaVersion: SCHEMA, artifactByteSha256: sha256(body), artifactByteSha256Scope: 'complete.json UTF-8 bytes including final LF' }, null, 2)}\n`)
  return artifact
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  const target = resolve(process.argv[2] || `artifacts/${SCHEMA}/complete.json`); const artifact = await writeArtifact(target)
  console.log(JSON.stringify({ schema: SCHEMA, verdict: artifact.verdictToken, basisHead: artifact.basisHead, sourcePages: artifact.sourceWitnesses.map(item => ({ editionId: item.editionId, pageCount: item.pageCount, sha256: item.sha256 })), claimStatuses: Object.fromEntries(artifact.claims.map(item => [item.id, item.status])) }, null, 2))
}

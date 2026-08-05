import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

export const SCHEMA = 'ziwei-palace-source-acquisition-field-kit-v0'
export const VERDICT = 'complete_ziwei_palace_source_acquisition_field_kit_uncommitted'
export const MATERIALIZER_VERSION = '0.1.0'
export const SEALED_PATH = 'artifacts/ziwei-palace-coordinate-semantic-identity-v0/complete.json'
export const BASIS_HEAD = 'f7060c6d4f659679466213b144976809e5671db9'
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const stable = value => Array.isArray(value) ? value.map(stable) : value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort().map(k => [k, stable(value[k])])) : value
export const canonicalJson = value => `${JSON.stringify(stable(value), null, 2)}\n`
const git = (root, args) => execFileSync('git', ['-c', 'core.fsmonitor=false', ...args], { cwd: root, encoding: 'utf8' }).trim()
const isCommit = value => typeof value === 'string' && /^[0-9a-f]{40}$/.test(value)

export function validateObservedHead({ root, observedHead, currentHead = git(root, ['rev-parse', 'HEAD']) }) {
  if (!isCommit(observedHead)) throw new Error('observedHead must be an explicit 40-hex commit')
  git(root, ['cat-file', '-e', `${observedHead}^{commit}`])
  try { git(root, ['merge-base', '--is-ancestor', observedHead, currentHead]) } catch { throw new Error('observedHead must be an ancestor of or equal to current HEAD') }
  return { observedHead, currentHead }
}

const targetDefinitions = [
  { id: 'palace_names', label: '12궁명', connection: 'palace name ↔ branch ↔ diagram position ↔ ordinal ↔ direction', requiredWitness: ['main_text_sentence', 'table', 'rule_formula', 'original_diagram', 'edition_note'], sourceRefs: ['source-p7-shi-er-gong-guan-gai', 'source-p8-ming-shen-rule'], acceptance: 'directly readable source witness connects all five fields; no inferred label assignment' },
  { id: 'earthly_branches', label: '子丑寅… 지지', connection: 'branch token ↔ named palace and physical slot', requiredWitness: ['main_text_sentence', 'table', 'original_diagram'], sourceRefs: ['source-p7-shi-er-gong-guan-gai', 'source-p11-ziwei-five-jue', 'source-p12-ziwei-jian-suo'], acceptance: 'all relevant branch glyphs and their order are visible in context' },
  { id: 'diagram_positions', label: '도식 실제 위치', connection: 'palace/branch label ↔ physical diagram slot', requiredWitness: ['original_diagram', 'edition_note'], sourceRefs: ['source-p7-shi-er-gong-guan-gai'], acceptance: 'complete diagram boundary, orientation and all 12 cells are reviewable' },
  { id: 'ordinal_origin', label: 'ordinal·기산점', connection: 'declared starting point ↔ ordinal/order', requiredWitness: ['main_text_sentence', 'table', 'rule_formula'], sourceRefs: ['source-p8-ming-shen-rule', 'source-p11-ziwei-five-jue', 'source-p12-ziwei-jian-suo'], acceptance: 'starting point and counting/order are stated, not reconstructed from output' },
  { id: 'direction', label: '순행·역행 방향', connection: 'named operation ↔ direction/order', requiredWitness: ['main_text_sentence', 'rule_formula', 'original_diagram'], sourceRefs: ['source-p8-ming-shen-rule', 'source-p12-ziwei-jian-suo'], acceptance: 'direction words/arrows and their subject are visible in the same witness context' },
]

const canonicalSearch = [
  { id: 'palace-mapping', terms: ['紫微斗數 十二宮 宮位 地支', '十二宮冠蓋 宮名', '命宮 身宮 十二宮 表'], variants: { traditional: ['紫微斗數 十二宮 宮位 地支', '十二宮冠蓋 宮名', '命宮 身宮 十二宮 表'], simplified: ['紫微斗数 十二宫 宫位 地支', '十二宫冠盖 宫名', '命宫 身宫 十二宫 表'], korean_hanja: ['紫微斗數 十二宮 宮位 地支', '十二宮冠蓋 宮名', '命宮 身宮 十二宮 表'] } },
  { id: 'ming-shen-direction', terms: ['定命身二宮', '命宮逆數 身宮順數', '寅起月'], variants: { traditional: ['定命身二宮', '命宮逆數 身宮順數', '寅起月'], simplified: ['定命身二宫', '命宫逆数 身宫顺数', '寅起月'], korean_hanja: ['定命身二宮', '命宮逆數 身宮順數', '寅起月'] } },
  { id: 'edition-identity', terms: ['書名 作者 版本 刊年 卷一', '紫微斗數全書 南北山人'], variants: { traditional: ['書名 作者 版本 刊年 卷一', '紫微斗數全書 南北山人'], simplified: ['书名 作者 版本 刊年 卷一', '紫微斗数全书 南北山人'], korean_hanja: ['書名 作者 版本 刊年 卷一', '紫微斗數全書 南北山人'] } },
]

const witnessTypes = [
  ['main_text_sentence', '본문 문장', '원문 문장이 연결 관계를 직접 말하는 면'],
  ['table', '표', '12행/12칸 또는 대응 관계가 잘리지 않은 표'],
  ['rule_formula', '가결', '방향·기산점·순역을 명시하는 규칙/가결'],
  ['original_diagram', '원도식', '전체 도식의 실제 위치·방향·경계'],
  ['edition_note', '판본 주석', '서명·저자·판권/간기·권책·쪽/엽 식별'],
].map(([id, label, use]) => ({ id, label, use, evidenceClass: 'candidate_source_witness' }))

const quickMissionCard = {
  title: '궁 좌표 semantic identity — P0 quick mission',
  screenLimit: '휴대폰 한 화면용 요약',
  find: '12궁명·子丑寅… 지지·도식 실제 위치·ordinal/기산점·순행/역행을 한 원문 witness가 직접 이어주는 readable scan/page image.',
  checkImmediately: ['서명·저자·판본/간기와 페이지/엽이 식별되는가?', '12개 전체와 앞뒤 문맥이 보이는가?', '누가 무엇을 기준으로 어느 방향으로 세는지 원문에 있는가?', 'OCR이 아니라 실제 글자·선·화살표가 보이는가?'],
  mustPhotograph: ['표지 또는 서명면', '서명·저자/편자 식별면', '판권/간기·판본 식별면', '목차/권책 식별면', '대상 면 전체(표/도식 경계 포함)', '대상 면 앞뒤 문맥', '페이지/엽 번호가 보이는 촬영'],
  notEvidence: ['catalog/preview만', 'OCR·전사만', '잘린 도식·표·라벨', '출처 identity를 추측한 캡처', '방향·기산점 없는 결과표', '재작성/정규화한 도식'],
  handoff: '사진을 편집·해석하지 말고 intake form과 원본 파일을 함께 제출한다.',
}

const guide = {
  scope: '수색·촬영·기록만 수행한다. 원문 채택, production 선택, readiness/grounding/activation 변경은 하지 않는다.',
  search: { rule: 'terms는 기존 sealed packet의 sourceAcquisitionBrief.requestedMaterial에서만 materialize한다.', families: canonicalSearch, ungroundedVariants: [{ language: 'korean_spoken_or_translated', status: 'requires_human_definition', reason: '기존 packet에 해당 번역어가 없어 자동 생성하지 않음' }] },
  witnessTypes,
  acquisitionSteps: ['도서관/고서점/온라인 아카이브에서 canonical term으로 찾는다.', '발견 즉시 표지·서명/저자·판권/간기·목차를 먼저 촬영한다.', '대상 면은 전체 면, 앞뒤 문맥, 페이지/엽 번호를 포함해 촬영한다.', '표·도식의 선·화살표·방향·기산점이 프레임 안에 있도록 한다.', '디지털 자료는 원본 URL/소장처, 파일명, 페이지 수, 다운로드 시각을 기록하고 가능하면 실제 다운로드 bytes의 SHA-256을 계산한다.', '원본 bytes와 촬영 파일을 변경하지 않고 intake form을 채운다.'],
  minimumCapture: ['cover', 'title_author', 'copyright_colophon', 'table_of_contents', 'target_page_full', 'adjacent_context_before_after', 'page_or_folio_marker'],
  rejection: quickMissionCard.notEvidence,
  fiveConnections: targetDefinitions.map(({ id, label, connection, acceptance }) => ({ id, label, connection, acceptance })),
}

const intakeForm = {
  formVersion: '0.1.0',
  oneRecordPerMaterial: true,
  fields: [
    ['intakeId', '고정 intake 식별자', true], ['sourceIdentity', '소장처/기관·원본 URL 또는 서가/청구기호·원본 파일명', true], ['titleAuthor', '서명·저자/편자·권책', true], ['edition', '판본·간행/인쇄 연도·판권/간기·언어', true], ['location', '도서관/고서점/아카이브 위치·열람/다운로드 위치·쪽/엽', true], ['discoveryText', '발견한 원문 문구(보이는 대로, 정규화 금지)', true], ['diagramDirection', '도식 방향·위/아래·시계/반시계·화살표와 그 주어', true], ['correspondence', '지지↔궁명↔diagram slot↔ordinal↔기산점↔순역 대응', true], ['captureFiles', '촬영/다운로드 원본 파일명·파일 목록·각 파일 SHA-256(가능하면)', true], ['digitalMetadata', 'URL·소장처·파일명·페이지 수·다운로드 시각·bytes hash', false], ['uncertainties', '읽기 불명 glyph·잘림·판본/identity·방향·연결 미확정 사항', true], ['triage', 'candidate/promising/review_ready/potentially_sufficient/rejected 및 근거', true],
  ].map(([id, label, required]) => ({ id, label, required, userSupplied: true })),
  forbidden: ['OCR-only submission', 'invented citation/page/edition', 'normalized transcription replacing image', 'confidence score', 'semantic acceptance verdict'],
}

const triageRubric = {
  purpose: '수색 진행 상태를 표시하는 operational triage이며 confidence 점수나 원문 채택 판정이 아니다.',
  levels: [
    { id: 'candidate', rule: '키워드만 관련; witness/판본 identity 미확보' },
    { id: 'promising', rule: '연결 요소 일부 존재; identity 또는 문맥이 아직 부족' },
    { id: 'review_ready', rule: '판본 identity와 필요한 문맥·전체 면을 확보했으나 다섯 요소 직접 연결은 미심사' },
    { id: 'potentially_sufficient', rule: '다섯 연결 요소를 직접 이어주는 witness가 있어 human review에 제출 가능; 채택 아님' },
    { id: 'rejected', rule: '출처 불명, 재작성 도식, OCR-only, 잘린 표, 방향·기산점 부재 등' },
  ],
  transitionGuard: 'level은 intake 증거의 보유 상태만 표현하며 semantic truth/readiness/production으로 승격하지 않는다.',
}

const handoffSchema = {
  schema: 'ziwei-palace-source-acquisition-analyst-handoff-v0',
  required: ['kitVersion', 'intakeRecord', 'sourceIdentity', 'edition', 'location', 'witnessFiles', 'targetCoverage', 'rawObservedText', 'diagramDirection', 'correspondence', 'uncertainties', 'triage'],
  witnessFiles: { each: ['fileName', 'kind', 'byteSha256', 'pageOrFolio', 'captureScope', 'uneditedOriginal'] },
  targetCoverage: { each: ['targetId', 'status', 'intakeFieldRefs', 'sourceRefBasis'] },
  analystConstraints: ['preserve raw glyphs/layout and occurrence-level observations', 'do not select identity/rotation/production rule', 'do not alter sealed packet', 'report conflicts without reconciliation', 'human review required'],
  outputBoundary: { allowed: ['analyst review packet', 'bounded sourceRefs', 'provenance audit'], forbidden: ['source adoption', 'production change', 'readiness/grounding/activation change', 'interpretation/ranking/LLM'] },
}

function buildArtifact(sealed, sealedBytes, root, observedHead) {
  const sealedSha = sha256(sealedBytes)
  const sealedRefs = sealed.sourceWitnessIndex.sourceRefs.map(x => x.id)
  const blocker = sealed.blockerRegistry.find(x => x.id === 'blocker-palace-semantic-identity')
  return {
    namespace: SCHEMA, schemaVersion: SCHEMA, verdictToken: VERDICT, basisHead: BASIS_HEAD,
    sourceBasis: { sealedNamespace: sealed.schemaVersion, sealedArtifact: SEALED_PATH, sealedArtifactByteSha256: sealedSha, sealedVerdict: sealed.verdictToken, sealedSemanticStatus: sealed.conclusions.semanticStatus, sourceRefs: sealedRefs, blockerRef: blocker.id, coverageMap: 'artifacts/ziwei-system-evidence-readiness-coverage-map-v0/complete.json', majorStarReconciliation: 'artifacts/ziwei-major-star-claim-readiness-reconciliation-v0/complete.json', rotation06Boundary: 'numeric transform only; never semantic identity' },
    blockerStatement: '현재 P0 blocker는 12궁명이 子丑寅… 지지와 도식의 실제 칸에 어떻게 대응하고, 어느 ordinal·기산점에서 순행·역행하는지를 한 readable 원문 witness가 직접 이어주지 못한다는 것이다. 기존 p7은 지지와 도식 위치만, p8은 命宮·身宮의 방향 어휘만 보여 주므로 palace-name semantic identity는 막혀 있다. 따라서 rotation-06의 수학적 exact fit은 semantic identity가 아니며, 새 자료를 가져오기 전 blocker·readiness·production 선택은 그대로다.',
    targetCriteria: { requiredTargetCount: targetDefinitions.length, targets: targetDefinitions, sourceRefClosure: targetDefinitions.every(t => t.sourceRefs.every(id => sealedRefs.includes(id))) },
    quickMissionCard, sourceAcquisitionGuide: guide, evidenceIntakeForm: intakeForm, triageRubric, analystHandoffSchema: handoffSchema,
    preservation: { sealedPacketUnchanged: true, sourceRefsVerdictsHashesUnchanged: true, productionMutation: false, readinessMutation: false, activationMutation: false, newMaterialAccepted: false, rotation06SemanticPromotion: false, preAcquisitionState: { blocker: blocker.status, decision: blocker.decision, readiness: sealed.readinessImpact.readiness, grounding: sealed.readinessImpact.grounding, activation: sealed.readinessImpact.activation } },
    observedHead,
    deterministic: { generatedAt: 'forbidden', ordering: 'stable key order; arrays declared order', hashes: 'UTF-8 bytes including final LF' },
  }
}

export async function buildFieldKit({ root = resolve(new URL('..', import.meta.url).pathname), observedHead = BASIS_HEAD } = {}) {
  validateObservedHead({ root, observedHead })
  const sealedBytes = await readFile(resolve(root, SEALED_PATH)); const sealed = JSON.parse(sealedBytes)
  if (sealed.schemaVersion !== 'ziwei-palace-coordinate-semantic-identity-v0') throw new Error('sealed source namespace mismatch')
  return buildArtifact(sealed, sealedBytes, root, observedHead)
}

function parse(argv) { const i = argv.indexOf('--observed-head'); if (i < 0 || !argv[i + 1]) throw new Error('--observed-head <40-hex-commit> is required'); const rest = argv.filter((_, n) => n !== i && n !== i + 1); if (rest.length > 1) throw new Error('only one output path is allowed'); return { observedHead: argv[i + 1], target: resolve(rest[0] || `artifacts/${SCHEMA}/complete.json`) } }
if (process.argv[1] === new URL(import.meta.url).pathname) {
  const { observedHead, target } = parse(process.argv.slice(2)); const artifact = await buildFieldKit({ observedHead }); const dir = dirname(target); await mkdir(dir, { recursive: true })
  const outputs = { complete: artifact, targetCriteria: artifact.targetCriteria, quickMissionCard: artifact.quickMissionCard, sourceAcquisitionGuide: artifact.sourceAcquisitionGuide, evidenceIntakeForm: artifact.evidenceIntakeForm, triageRubric: artifact.triageRubric, analystHandoffSchema: artifact.analystHandoffSchema }
  for (const [name, value] of Object.entries(outputs)) { const bytes = Buffer.from(canonicalJson(value)); const path = name === 'complete' ? target : resolve(dir, `${name}.json`); await writeFile(path, bytes); await writeFile(`${path}.integrity.json`, `${JSON.stringify({ schemaVersion: SCHEMA, artifactByteSha256: sha256(bytes), artifactByteSha256Scope: 'UTF-8 bytes including final LF' }, null, 2)}\n`) }
  console.log(JSON.stringify({ verdict: VERDICT, targetCount: artifact.targetCriteria.requiredTargetCount, witnessTypes: witnessTypes.map(x => x.id), triageLevels: triageRubric.levels.map(x => x.id) }, null, 2))
}

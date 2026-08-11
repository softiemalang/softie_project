import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'

import {
  attachArtifactIdentity,
  buildArtifactIdentity,
  canonicalIdentityJson,
} from '../src/artifactIdentity.js'

export const ROOT = resolve(new URL('..', import.meta.url).pathname)
export const ARTIFACT_ID = 'design-reference-async-content-enter-200ms-promotion'
export const MATERIALIZER_PATH = 'scripts/materialize-design-reference-async-content-enter-200ms-promotion.mjs'
export const MATERIALIZER_VERSION = 'design-reference-async-content-enter-200ms-promotion-materializer-1'
export const DEFAULT_DIRECTORY = join(ROOT, 'artifacts', ARTIFACT_ID)
export const VERDICT = 'complete_softie_async_content_enter_200ms_house_rule_promoted_uncommitted'

export const PRE_PILOT_V1_GENERATION_BASE = 'cf4042f5827639029b15997e07f191614d19e2c4'
export const EMIL_INCREMENTAL_GENERATION_BASE = 'e5ce1a426c627a070b80c662edb032792d84a82f'
export const PILOT_COMMIT = 'a49a626bf64d37c81be0b6f2f10cb52cd577f03e'
export const GLASS_SCOPE_FIX_COMMIT = '0a267d071fd44901471cfd8dfcaeb7937d37c22a'

const REPO_INPUTS = [
  'DESIGN.md',
  'src/artifactIdentity.js',
  'src/scheduler/TodaySchedulerPage.jsx',
  'src/scheduler/SchedulerEventSection.jsx',
  'src/scheduler/schedulerAsyncContentEnter.js',
  'src/styles.css',
  'test/schedulerAsyncContentEnter.test.js',
  'docs/design-reference-audit-v1.md',
  'docs/design-reference-audit-v1-emil10-incremental.md',
  'artifacts/design-reference-audit-v1/complete.json',
  'artifacts/design-reference-audit-v1/complete.json.integrity.json',
  'artifacts/design-reference-audit-v1-emil10-incremental/complete.json',
  'artifacts/design-reference-audit-v1-emil10-incremental/complete.json.integrity.json',
  MATERIALIZER_PATH,
]

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex')
}

function gitText(args) {
  try {
    return execFileSync('git', ['-c', 'core.fsmonitor=false', ...args], {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim()
  } catch {
    return null
  }
}

function gitBytes(commit, path) {
  return execFileSync('git', ['-c', 'core.fsmonitor=false', 'show', `${commit}:${path}`], {
    cwd: ROOT,
    stdio: ['ignore', 'pipe', 'ignore'],
  })
}

function lineLocation(text, quote) {
  const index = text.indexOf(quote)
  if (index < 0) throw new Error(`quote not found: ${quote.slice(0, 80)}`)
  const lineStart = text.slice(0, index).split('\n').length
  const lineEnd = lineStart + quote.split('\n').length - 1
  return { lineStart, lineEnd, quote }
}

function workingTreeTextRef(path, quote) {
  const bytes = readFileSync(join(ROOT, path))
  return {
    kind: 'working_tree_text',
    path,
    byteLength: bytes.byteLength,
    byteSha256: sha256(bytes),
    ...lineLocation(bytes.toString('utf8'), quote),
  }
}

function gitCommitTextRef(commit, path, quote) {
  const bytes = gitBytes(commit, path)
  return {
    kind: 'git_commit_text',
    commit,
    path,
    byteLength: bytes.byteLength,
    byteSha256: sha256(bytes),
    ...lineLocation(bytes.toString('utf8'), quote),
  }
}

function artifactJsonRef(path, jsonAssertions) {
  const bytes = readFileSync(join(ROOT, path))
  return {
    kind: 'historical_artifact_json',
    path,
    byteLength: bytes.byteLength,
    byteSha256: sha256(bytes),
    jsonAssertions,
  }
}

function commitRecord(commit, role, sourceRefs) {
  const parents = gitText(['rev-list', '--parents', '-n', '1', commit])?.split(' ').slice(1) || []
  if (!gitText(['rev-parse', `${commit}^{commit}`])) throw new Error(`missing lineage commit: ${commit}`)
  return { commit, parents, role, sourceRefs }
}

function frozenArtifactRefs() {
  return {
    v1: artifactJsonRef('artifacts/design-reference-audit-v1/complete.json', [
      { path: '#/verdict', equals: 'complete_softie_design_reference_audit_v1_uncommitted' },
      { path: '#/conflictCompatibilityMatrix/rows/2/area', equals: 'async_loading_loaded_reveal' },
      { path: '#/conflictCompatibilityMatrix/rows/2/recommendedStatus', equals: 'candidate_for_pilot' },
      { path: '#/artifactIdentity/generation/baseHead', equals: PRE_PILOT_V1_GENERATION_BASE },
    ]),
    emil: artifactJsonRef('artifacts/design-reference-audit-v1-emil10-incremental/complete.json', [
      { path: '#/verdict', equals: 'complete_softie_design_reference_incremental_emil10_audit_uncommitted' },
      { path: '#/durationEasingCandidateMatrix/recommendationClass', equals: 'insufficient_to_prefer' },
      { path: '#/durationEasingCandidateMatrix/directLoadingDurationEvidence', equals: false },
      { path: '#/durationEasingCandidateMatrix/rows/3/candidate', equals: '200ms' },
      { path: '#/durationEasingCandidateMatrix/rows/3/directRoleMatch', equals: false },
      { path: '#/newSkillObservationLedger/observations/6/id', equals: 'OBS-EMIL10-ADJACENT-200' },
      { path: '#/newSkillObservationLedger/observations/6/value/duration', equals: '200ms' },
      { path: '#/newSkillObservationLedger/observations/2/id', equals: 'OBS-EMIL10-ENTER-EASE-OUT' },
      { path: '#/newSkillObservationLedger/observations/2/value/customCurve', equals: 'cubic-bezier(0.23, 1, 0.32, 1)' },
      { path: '#/loadingRevealRecommendation/duration/pilotPair/1', equals: '200ms' },
      { path: '#/artifactIdentity/generation/baseHead', equals: EMIL_INCREMENTAL_GENERATION_BASE },
    ]),
  }
}

function recipe() {
  return {
    role: 'async content enter / conditional content swap',
    trigger: 'first successful arrival of actual new async content after a loading state',
    duration: '200ms',
    durationMs: 200,
    easing: 'cubic-bezier(0.23, 1, 0.32, 1)',
    properties: ['opacity'],
    artificialDelay: false,
    prohibitedProperties: ['transform', 'translate', 'scale', 'blur', 'filter', 'clip-path', 'layout', 'stagger'],
    targetBoundary: 'actual entering content only; never a glass/backdrop-filter surface or its ancestor',
    repeatBoundary: 'no replay for refetch, date/filter change, background refresh, mutation update, or later same-surface update',
    emptyBoundary: 'successful empty results settle without a reveal because no content enters',
    errorBoundary: 'error does not settle; the first successful retry remains eligible',
    reducedMotion: 'static/non-movement; no animation',
    generalizationBoundary: 'role-scoped; not a universal 200ms rule for other interaction types',
  }
}

function currentImplementationRefs() {
  return [
    workingTreeTextRef('src/scheduler/TodaySchedulerPage.jsx', "setEvents(rows)\n      setStatus('')\n      settleInitialAsyncContentEnter(rows)"),
    workingTreeTextRef('src/scheduler/TodaySchedulerPage.jsx', 'const initialAsyncContentEnterStateRef = useRef(createSchedulerAsyncContentEnterState())'),
    workingTreeTextRef('src/scheduler/TodaySchedulerPage.jsx', '<div className={`scheduler-async-content${shouldAnimateInitialContent ? \' scheduler-async-content--initial-enter\' : \'\'}`}>' ),
    workingTreeTextRef('src/scheduler/schedulerAsyncContentEnter.js', 'export function settleSchedulerAsyncContentEnter(state, result) {\n  if (state.hasSuccessfullySettled || result.status !== \'success\') return state'),
    workingTreeTextRef('src/scheduler/SchedulerEventSection.jsx', '<div className={sectionContentClassName}>\n        {shouldRenderEmptyText() ? <p className="subtle scheduler-empty-note">{normalizedEmptyText}</p> : null}\n        <div className="scheduler-event-list">'),
    workingTreeTextRef('src/styles.css', '/* Async content enter house rule; role-scoped to conditional content arrival. */\n  --ag-scheduler-async-content-enter-duration: 200ms;\n  --ag-scheduler-async-content-enter-easing: cubic-bezier(0.23, 1, 0.32, 1);'),
    workingTreeTextRef('src/styles.css', '/* First successful Today event fetch only; section shells stay static and event content uses opacity only. */\n.scheduler-theme-shell .scheduler-async-content--initial-enter .scheduler-event-list {\n  animation: scheduler-async-content-enter'),
    workingTreeTextRef('src/styles.css', '@media (prefers-reduced-motion: reduce) {\n  .scheduler-theme-shell .scheduler-async-content--initial-enter .scheduler-event-list {\n    animation: none;'),
    workingTreeTextRef('DESIGN.md', '### Async content enter / conditional content swap'),
    workingTreeTextRef('DESIGN.md', '- 승인된 역할 레시피는 `opacity` only, `200ms`, `cubic-bezier(0.23, 1, 0.32, 1)`입니다.'),
  ]
}

function pilotLineage() {
  return commitRecord(PILOT_COMMIT, 'Scheduler async content enter pilot implementation', [
    gitCommitTextRef(PILOT_COMMIT, 'src/scheduler/TodaySchedulerPage.jsx', "setEvents(rows)\n      setStatus('')\n      settleInitialAsyncContentEnter(rows)"),
    gitCommitTextRef(PILOT_COMMIT, 'src/scheduler/schedulerAsyncContentEnter.js', 'export function settleSchedulerAsyncContentEnter(state, result) {\n  if (state.hasSuccessfullySettled || result.status !== \'success\') return state'),
    gitCommitTextRef(PILOT_COMMIT, 'src/styles.css', '/* First successful Today event fetch only; data is rendered immediately and opacity is the only animated property. */\n.scheduler-theme-shell .scheduler-async-content--initial-enter {'),
  ])
}

function glassFixLineage() {
  return commitRecord(GLASS_SCOPE_FIX_COMMIT, 'glass-scope compositing fix and focused contract test', [
    gitCommitTextRef(GLASS_SCOPE_FIX_COMMIT, 'src/scheduler/SchedulerEventSection.jsx', '<div className={sectionContentClassName}>\n        {shouldRenderEmptyText() ? <p className="subtle scheduler-empty-note">{normalizedEmptyText}</p> : null}\n        <div className="scheduler-event-list">'),
    gitCommitTextRef(GLASS_SCOPE_FIX_COMMIT, 'src/styles.css', '/* First successful Today event fetch only; section shells stay static and event content uses opacity only. */\n.scheduler-theme-shell .scheduler-async-content--initial-enter .scheduler-event-list {'),
    gitCommitTextRef(GLASS_SCOPE_FIX_COMMIT, 'test/schedulerAsyncContentEnter.test.js', "test('event lists stay stable while the glass section shell remains outside the animation target', () => {"),
  ])
}

function deviceObservations() {
  return [
    {
      id: 'OBS-DEVICE-SCHEDULER-200MS-PILOT-FEEL',
      phase: 'pilot',
      evidenceClass: 'device_observed',
      validationClass: 'product_context_validation',
      observer: 'user_report',
      surface: 'Scheduler Today on iPhone',
      observation: 'The 200ms content enter felt smoother and more stable than the previous immediate appearance, without feeling slow or delayed.',
      authorityBoundary: 'Human product observation, not an external objective oracle or independent timing authority.',
    },
    {
      id: 'OBS-DEVICE-SCHEDULER-GLASS-REGRESSION',
      phase: 'pilot_regression',
      evidenceClass: 'device_observed',
      validationClass: 'compositing_regression_observation',
      observer: 'user_report',
      surface: 'Scheduler Today glass sections on iPhone',
      observation: 'During initial loading, the glass blur of the event sections appeared to drop and then recover after loading completed.',
      authorityBoundary: 'A device observation that identified a product regression; it does not by itself prove a browser compositor mechanism.',
    },
    {
      id: 'OBS-DEVICE-SCHEDULER-GLASS-FIX-REVALIDATION',
      phase: 'post_scope_fix_revalidation',
      evidenceClass: 'device_observed',
      validationClass: 'product_context_validation',
      observer: 'user_report',
      surface: 'Scheduler Today on iPhone after content-only scope fix',
      observation: 'After the glass-scope fix, the experience was acceptable: the 200ms smoothness remained, and the animation did not feel like a delay.',
      authorityBoundary: 'Human acceptance evidence for this product context and recipe; not a general device matrix or universal motion oracle.',
    },
  ]
}

function promotionDecision() {
  return {
    status: 'promoted',
    ruleId: 'motion.async-content-enter.conditional-content-swap.200ms',
    decisionClass: 'product_context_validated_house_rule',
    rationale: 'Promote the bounded role recipe after preserving the external candidate boundary, passing runtime semantic and compositing contracts, and receiving post-fix iPhone acceptance.',
    gates: [
      { id: 'external_role_evidence', status: 'pass_with_boundary', result: 'Emil provides adjacent-role 200ms evidence, not loading-specific direct support.' },
      { id: 'incremental_duration_verdict', status: 'preserved', result: 'The frozen incremental audit remains insufficient_to_prefer; 200ms was a bounded candidate.' },
      { id: 'runtime_semantic_contract', status: 'pass', result: 'First successful non-empty settle only; refetches do not replay; empty and error boundaries remain explicit.' },
      { id: 'glass_compositing_scope', status: 'pass', result: 'The animated node is the stable event list; section glass shells and their backdrop-filter surfaces remain outside animation.' },
      { id: 'reduced_motion', status: 'pass', result: 'The scoped rule disables animation under prefers-reduced-motion: reduce.' },
      { id: 'device_observation', status: 'pass_as_product_context_validation', result: 'The user accepted the post-fix feel on iPhone without delay perception.' },
      { id: 'generalization_boundary', status: 'pass', result: 'The rule is limited to this motion role and does not authorize other interaction types.' },
    ],
    sourceRefs: ['OBS-DEVICE-SCHEDULER-200MS-PILOT-FEEL', 'OBS-DEVICE-SCHEDULER-GLASS-REGRESSION', 'OBS-DEVICE-SCHEDULER-GLASS-FIX-REVALIDATION'],
  }
}

function buildPayload() {
  const currentHead = gitText(['rev-parse', 'HEAD'])
  const originMainHead = gitText(['rev-parse', 'origin/main'])
  if (!currentHead || !originMainHead) throw new Error('repository heads could not be resolved')
  if (gitText(['branch', '--show-current']) !== 'main') throw new Error('promotion evidence requires main')
  if (currentHead !== originMainHead) throw new Error('promotion evidence requires local main and origin/main parity')

  const frozenArtifacts = frozenArtifactRefs()
  const pilot = pilotLineage()
  const glassFix = glassFixLineage()
  const payload = {
    schemaVersion: 'design-reference-async-content-enter-200ms-promotion-v1',
    verdict: VERDICT,
    auditDate: '2026-08-11',
    title: 'Softie async content enter 200ms post-pilot promotion evidence',
    scope: {
      promotionOnly: true,
      uiMutation: false,
      businessDataFlowMutation: false,
      databaseMutation: false,
      auditArtifactRewrite: false,
      skillSourceMutation: false,
      stagingCommitPush: false,
      deployment: false,
    },
    repository: {
      branch: gitText(['branch', '--show-current']),
      currentHead,
      originMainHead,
      anchorCommit: GLASS_SCOPE_FIX_COMMIT,
      preExistingChangeBoundary: 'The user-owned untracked -.jpg remains outside this evidence scope and is preserved.',
    },
    frozenPredecessors: {
      v1: frozenArtifacts.v1,
      emil10Incremental: frozenArtifacts.emil,
      historicalBytesPreserved: true,
      historicalMismatchResolution: 'The Emil checker compares stable semantic payload while separately verifying generation-base Git bytes for protected inputs; descendant source hashes are not rewritten into the frozen artifact.',
    },
    externalEvidence: {
      corpus: 'emilkowalski/skills',
      revision: '78761e1b57f97dce65b983d640c70a68f39e8163',
      lineageId: 'LG-EMIL10-78761e1b57f9',
      independentAuthorityCount: 1,
      durationEvidence: {
        value: '200ms',
        classification: 'adjacent_role_guidance',
        directLoadingDurationProvenance: false,
        sourceObservationId: 'OBS-EMIL10-ADJACENT-200',
      },
      easingEvidence: {
        value: 'cubic-bezier(0.23, 1, 0.32, 1)',
        classification: 'direct_role_match_for_easing_not_for_duration',
        sourceObservationId: 'OBS-EMIL10-ENTER-EASE-OUT',
      },
    },
    auditDecision: {
      incrementalVerdict: 'insufficient_to_prefer',
      boundedCandidate: '200ms',
      candidateBoundary: 'Emil10 incremental audit recorded 200ms as an adjacent-role candidate only; it did not select it for loading.',
      preservedArtifactId: 'design-reference-audit-v1-emil10-incremental',
    },
    pilot: {
      implementationCommit: pilot,
      targetSurface: 'Scheduler Today event list',
      role: 'async content enter / conditional content swap',
      runtimeContract: 'First successful non-empty content arrival enters once; empty success settles without reveal; error leaves first retry eligible; subsequent updates do not replay.',
      implementationSourceRefs: currentImplementationRefs(),
    },
    glassScopeFix: {
      implementationCommit: glassFix,
      observedFailure: 'On iPhone, the glass blur of the event sections appeared to drop during initial loading and recover after loading completed.',
      causalAssessment: 'The pilot code animated an ancestor wrapper around backdrop-filter section shells; this supports an ancestor-compositing cause, but no Safari computed-style or compositor trace is claimed.',
      correction: 'Keep the wrapper as a state marker and animate only the stable .scheduler-event-list content node; keep the section shell and glass surface static.',
      sourceRefs: glassFix.sourceRefs,
    },
    deviceObservations: deviceObservations(),
    recipe: recipe(),
    promotionDecision: promotionDecision(),
    lineage: {
      schemaVersion: 'softie-motion-provenance-lineage-v1',
      relations: [
        { from: 'design-reference-audit-v1', to: 'design-reference-audit-v1-emil10-incremental', relation: 'incremental_predecessor_preserved' },
        { from: 'design-reference-audit-v1-emil10-incremental', to: PILOT_COMMIT, relation: 'bounded_candidate_implemented_as_pilot' },
        { from: PILOT_COMMIT, to: GLASS_SCOPE_FIX_COMMIT, relation: 'compositing_regression_fixed_with_narrower_content_scope' },
        { from: GLASS_SCOPE_FIX_COMMIT, to: 'OBS-DEVICE-SCHEDULER-GLASS-FIX-REVALIDATION', relation: 'post_fix_device_revalidation' },
        { from: 'OBS-DEVICE-SCHEDULER-GLASS-FIX-REVALIDATION', to: 'motion.async-content-enter.conditional-content-swap.200ms', relation: 'product_context_validated_house_rule_promotion' },
      ],
      notGeneralized: 'This lineage authorizes only the named async content enter / conditional content swap role; it does not promote 200ms for route transitions, press feedback, modals, gestures, or unrelated surfaces.',
    },
    validationContract: {
      sourceRefs: 'Every working-tree and git-commit text reference is checked against exact bytes, line location, and quoted text.',
      frozenArtifacts: 'Historical predecessor artifact bytes and JSON assertions are checked without rewriting them.',
      commitLineage: 'Pilot and glass-scope-fix commits must exist and pilot must be an ancestor of the fix.',
      deterministicMaterialization: 'Complete evidence bytes and generated document are stable on repeat materialization at the same repository state.',
      tamperRejection: 'Companion, complete payload, source reference, and protected input tampering must fail closed.',
    },
  }
  const inputBytesByPath = Object.fromEntries([...new Set(REPO_INPUTS)].map((path) => [path, readFileSync(join(ROOT, path))]))
  return attachArtifactIdentity(payload, buildArtifactIdentity({
    root: ROOT,
    artifactId: ARTIFACT_ID,
    materializerPath: MATERIALIZER_PATH,
    materializerVersion: MATERIALIZER_VERSION,
    baseHead: currentHead,
    inputs: [...new Set(REPO_INPUTS)],
    inputBytesByPath,
  }))
}

export function buildPromotionPayload() {
  return buildPayload()
}

function markdownFromArtifact(artifact) {
  return [
    '# Softie async content enter 200ms promotion evidence',
    '',
    `- Verdict: \`${artifact.verdict}\``,
    `- Role: \`${artifact.recipe.role}\``,
    '- Decision: promoted as a role-scoped Softie house rule after post-fix iPhone product-context validation.',
    '',
    '## Rule boundary',
    '',
    `- Recipe: \`${artifact.recipe.properties.join(' + ')}\`, \`${artifact.recipe.duration}\`, \`${artifact.recipe.easing}\`.`,
    '- Render actual content immediately; add no artificial delay, transform, layout motion, stagger, or intentional crossfade.',
    '- Animate only entering content. Keep glass/backdrop-filter surfaces and ancestors static.',
    '- Do not replay on refetch or later same-surface updates; empty success has no reveal; error waits for successful retry.',
    '- Reduced motion is static/non-movement.',
    '- The value is not a universal 200ms rule for other interaction roles.',
    '',
    '## Provenance chain',
    '',
    '| Stage | Evidence | Boundary |',
    '| --- | --- | --- |',
    '| External | Emil10 corpus revision `78761e1b57f97dce65b983d640c70a68f39e8163` | 200ms is adjacent-role guidance, not loading-specific direct provenance; easing has entering-role support. |',
    '| Audit | Frozen v1 and Emil10 incremental artifacts | Emil duration verdict remains `insufficient_to_prefer`; 200ms remains a bounded candidate. |',
    `| Pilot | \`${PILOT_COMMIT}\` | Scheduler Today first-success runtime contract. |`,
    `| Scope fix | \`${GLASS_SCOPE_FIX_COMMIT}\` | Glass section shells remain static; only stable event content animates. |`,
    '| Device observation | User iPhone observation | Product-context validation, not an objective external oracle or general device matrix. |',
    '| Promotion | This artifact and DESIGN.md | Role-scoped house rule with explicit non-generalization boundary. |',
    '',
    '## Historical mismatch resolution',
    '',
    '- Frozen predecessor artifacts and integrity sidecars are not rewritten.',
    '- The Emil checker now separates stable semantic replay from descendant source-input observations and verifies protected input bytes at the historical generation base.',
    '- A non-descendant basis, altered historical bytes, altered complete payload, or altered companion remains a failure.',
    '',
    '## Validation boundary',
    '',
    '- Automated checks prove source/commit/artifact contracts, deterministic materialization, and tamper rejection.',
    '- The iPhone observations remain human product-context evidence; they do not prove all Safari devices or all motion roles.',
  ].join('\n')
}

function filesForArtifact(artifact) {
  return {
    'complete.json': canonicalIdentityJson(artifact),
  }
}

function integrityForFiles(files) {
  const entries = {}
  for (const [name, content] of Object.entries(files)) {
    const bytes = Buffer.from(content, 'utf8')
    entries[`artifacts/${ARTIFACT_ID}/${name}`] = {
      byteLength: bytes.byteLength,
      byteSha256: sha256(bytes),
      hashScope: 'exact UTF-8 file bytes including final LF',
    }
  }
  return {
    schemaVersion: 'design-reference-audit-integrity-v1',
    artifactId: ARTIFACT_ID,
    completeArtifactPath: `artifacts/${ARTIFACT_ID}/complete.json`,
    files: entries,
  }
}

export async function materialize(outputDirectory = DEFAULT_DIRECTORY) {
  const artifact = buildPayload()
  const files = filesForArtifact(artifact)
  const integrity = canonicalIdentityJson(integrityForFiles(files))
  mkdirSync(outputDirectory, { recursive: true })
  for (const [name, content] of Object.entries(files)) writeFileSync(join(outputDirectory, name), content)
  writeFileSync(join(outputDirectory, 'complete.json.integrity.json'), integrity)
  if (resolve(outputDirectory) === resolve(DEFAULT_DIRECTORY)) {
    const documentPath = join(ROOT, 'docs', 'design-reference-async-content-enter-200ms-promotion.md')
    mkdirSync(dirname(documentPath), { recursive: true })
    writeFileSync(documentPath, `${markdownFromArtifact(artifact)}\n`)
  }
  return { artifact, files, integrity }
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(new URL(import.meta.url).pathname)) {
  const outputDirectory = process.argv[2] ? resolve(process.argv[2]) : DEFAULT_DIRECTORY
  materialize(outputDirectory)
    .then(({ artifact }) => {
      process.stdout.write(`${artifact.verdict}\n`)
      process.stdout.write(`${join(outputDirectory, 'complete.json')}\n`)
    })
    .catch((error) => {
      process.stderr.write(`${error.stack || error.message}\n`)
      process.exitCode = 1
    })
}

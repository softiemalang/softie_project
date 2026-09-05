import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

import { attachArtifactIdentity, buildArtifactIdentity, canonicalIdentityJson } from '../src/artifactIdentity.js'

export const ROOT = resolve(new URL('..', import.meta.url).pathname)
export const ARTIFACT_ID = 'scheduler-interaction-visual-detail-audit-v1'
export const MATERIALIZER_PATH = 'scripts/materialize-scheduler-interaction-visual-detail-audit-v1.mjs'
export const MATERIALIZER_VERSION = `${ARTIFACT_ID}-materializer-1`
export const BASELINE_HEAD = '2922ccca1bd566ff7312470bc34e67b24f4bae6c'
export const VERDICT = 'complete_scheduler_interaction_visual_detail_audit_v1_uncommitted'
export const DEFAULT_DIRECTORY = join(ROOT, 'artifacts', ARTIFACT_ID)
export const COMPANIONS = [
  'source-reference-ledger.json',
  'flow-audit-ledger.json',
  'frontier-decision-ledger.json',
  'motion-review-ledger.json',
  'validation-blocker-ledger.json',
  'device-validation-ledger.json',
]

const INPUTS = [
  'AGENTS.md',
  'DESIGN.md',
  '.agents/skills/apple-design/SKILL.md',
  '.agents/skills/emil-design-eng/SKILL.md',
  '.agents/skills/review-animations/SKILL.md',
  '.agents/skills/review-animations/STANDARDS.md',
  'src/artifactIdentity.js',
  'src/styles.css',
  'src/scheduler/TodaySchedulerPage.jsx',
  'src/scheduler/SchedulerEventSection.jsx',
  'src/scheduler/SchedulerEventCard.jsx',
  'src/scheduler/ReservationEditorPage.jsx',
  'src/scheduler/WorkLogDetailView.jsx',
  'test/schedulerInteractionVisualDetail.test.js',
  'test/accessibilityLegacyInteractionCleanup.test.js',
  'test/formModalAsyncStateTouchFoundation.test.js',
  'docs/scheduler-interaction-visual-detail-audit-v1.md',
  'scripts/check-design-reference-audit-v1-emil10-incremental.mjs',
  'scripts/check-design-reference-form-modal-async-state-touch-foundation-batch-v1.mjs',
  'scripts/materialize-design-reference-accessibility-legacy-interaction-cleanup-batch-v1.mjs',
  'scripts/materialize-design-reference-async-content-enter-200ms-promotion.mjs',
  'scripts/check-scheduler-interaction-visual-detail-audit-v1.mjs',
  'test/schedulerInteractionVisualDetailAudit.test.js',
  MATERIALIZER_PATH,
]

const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex')

function gitBytes(commit, path) {
  return execFileSync('git', ['-c', 'core.fsmonitor=false', 'show', `${commit}:${path}`], {
    cwd: ROOT,
    stdio: ['ignore', 'pipe', 'ignore'],
  })
}

function locate(text, quote) {
  const index = text.indexOf(quote)
  if (index < 0) throw new Error(`quote not found: ${quote.slice(0, 100)}`)
  const lineStart = text.slice(0, index).split('\n').length
  return { lineStart, lineEnd: lineStart + quote.split('\n').length - 1, quote }
}

function workingRef(path, quote) {
  const bytes = readFileSync(join(ROOT, path))
  return { kind: 'working_tree_text', path, byteLength: bytes.byteLength, byteSha256: sha256(bytes), ...locate(bytes.toString('utf8'), quote) }
}

function baselineRef(path, quote) {
  const bytes = gitBytes(BASELINE_HEAD, path)
  return { kind: 'git_commit_text', commit: BASELINE_HEAD, path, byteLength: bytes.byteLength, byteSha256: sha256(bytes), ...locate(bytes.toString('utf8'), quote) }
}

function sourceReferenceLedger() {
  return {
    schemaVersion: 'scheduler-interaction-visual-source-reference-ledger-v1',
    sources: [
      { id: 'SRC-REPO-AGENTS', authority: 'repository_authority', lineage: 'softie_repository', sourceRef: workingRef('AGENTS.md', '- UI tokens, patterns, legacy-screen preservation, and promotion rules come from [`DESIGN.md`](DESIGN.md), [`src/styles.css`](src/styles.css), and [`docs/ui-workflow.md`](docs/ui-workflow.md); do not replace them with external design values.') },
      { id: 'SRC-REPO-DESIGN', authority: 'softie_house_rule', lineage: 'softie_repository', sourceRef: workingRef('DESIGN.md', '## 7. Shape, depth, and motion') },
      { id: 'SRC-APPLE-ACCESSIBILITY', authority: 'apple_official_primary', lineage: 'apple_official', url: 'https://developer.apple.com/design/human-interface-guidelines/accessibility', boundary: 'Supports control size, clarity, and Reduce Motion; not Softie timing authority.' },
      { id: 'SRC-APPLE-FEEDBACK', authority: 'apple_official_primary', lineage: 'apple_official', url: 'https://developer.apple.com/design/human-interface-guidelines/feedback', boundary: 'Supports timely understandable feedback; not a web implementation recipe.' },
      { id: 'SRC-W3C-STATUS', authority: 'web_standard_primary', lineage: 'w3c_wcag22', url: 'https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html', boundary: 'Supports programmatic status messages without moving focus.' },
      { id: 'SRC-W3C-TARGET', authority: 'web_standard_primary', lineage: 'w3c_wcag22', url: 'https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum', boundary: 'Standards floor; Softie retains its stricter 44px house target.' },
      { id: 'SRC-W3C-DIALOG', authority: 'web_standard_primary', lineage: 'w3c_aria_apg', url: 'https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/', boundary: 'Modal lifecycle guidance; source inspection is not runtime proof.' },
      { id: 'SRC-EMIL', authority: 'external_design_engineering_guidance', lineage: 'emil_corpus_single_lineage', independentAuthorityCount: 1, sourceRef: workingRef('.agents/skills/emil-design-eng/SKILL.md', '## Accessibility') },
    ],
  }
}

function flowAuditLedger() {
  return {
    schemaVersion: 'scheduler-interaction-visual-flow-audit-ledger-v1',
    flows: [
      { flowId: 'FLOW-1-TODAY-LOAD', outcome: 'fix', result: 'loading/error/empty meanings separated; stale error cleared', sourceRefs: [workingRef('src/scheduler/TodaySchedulerPage.jsx', 'aria-busy={isLoading}')] },
      { flowId: 'FLOW-2-PUSH-STATUS', outcome: 'fix', result: 'synchronous lock plus modal-scoped busy and live success/error status', sourceRefs: [workingRef('src/scheduler/TodaySchedulerPage.jsx', 'if (pushActionLockRef.current || pushPreferencesLockRef.current) return'), workingRef('src/scheduler/TodaySchedulerPage.jsx', 'className={`scheduler-push-status-note is-${pushStatusMeta.tone}`}')] },
      { flowId: 'FLOW-3-EVENT-ACTIONS', outcome: 'fix', result: 'per-row synchronous exclusion and stable toggle semantics', sourceRefs: [workingRef('src/scheduler/TodaySchedulerPage.jsx', 'if (pendingStatusIdsRef.current.has(eventRow.id)) return'), workingRef('src/scheduler/SchedulerEventCard.jsx', 'aria-label="완료"')] },
      { flowId: 'FLOW-4-RESERVATION-CREATE', outcome: 'fix_and_hold', result: 'immediate result scroll; destination intent held', sourceRefs: [workingRef('src/scheduler/ReservationEditorPage.jsx', "window.scrollTo({ top: 0, left: 0, behavior: 'auto' })")] },
      { flowId: 'FLOW-5-RESERVATION-EDIT-DELETE', outcome: 'fix_and_hold', result: 'editor back and delete use immediate backPath return; save destination held', sourceRefs: [workingRef('src/scheduler/ReservationEditorPage.jsx', 'navigate(backPath)')] },
      { flowId: 'FLOW-6-FILTER-WORK-TIME', outcome: 'fix_and_hold', result: 'named group fixed; picker semantics and modal lifecycle held', sourceRefs: [workingRef('src/scheduler/TodaySchedulerPage.jsx', 'role="group" aria-label="보기 설정"')] },
      { flowId: 'FLOW-7-WORK-LOG', outcome: 'fix', result: 'exact confirmation, per-row lock, busy state, recoverable live result', sourceRefs: [workingRef('src/scheduler/TodaySchedulerPage.jsx', '근무 기록을 삭제할까요?'), workingRef('src/scheduler/WorkLogDetailView.jsx', 'aria-busy={isDeleting}')] },
    ],
  }
}

function frontierDecisionLedger() {
  return {
    schemaVersion: 'scheduler-interaction-visual-frontier-decision-ledger-v1',
    frontiers: [
      { id: 'FRONTIER-ASYNC-STATE', decision: 'fix' },
      { id: 'FRONTIER-DUPLICATE-ACTION', decision: 'fix' },
      { id: 'FRONTIER-LIVE-FEEDBACK', decision: 'fix' },
      { id: 'FRONTIER-TOGGLE-GROUP-SEMANTICS', decision: 'fix' },
      { id: 'FRONTIER-DESTRUCTIVE-WORKLOG', decision: 'fix' },
      { id: 'FRONTIER-GLASS-RAW-PRESS-MOTION', decision: 'fix' },
      { id: 'FRONTIER-ACTION-NOW-HIERARCHY', decision: 'pilot' },
      { id: 'FRONTIER-SAVE-DESTINATION', decision: 'hold', blocker: 'Rapid-entry versus return-to-list intent is not established.' },
      { id: 'FRONTIER-MODAL-FOCUS-LIFECYCLE', decision: 'hold', blocker: 'No browser, VoiceOver, inert, Escape, or focus-restoration proof.' },
      { id: 'FRONTIER-HOURLY-NATIVE-PICKER', decision: 'hold', blocker: 'iPhone picker behavior is unverified.' },
      { id: 'FRONTIER-EVENT-CARD-DENSITY', decision: 'already_good' },
      { id: 'FRONTIER-NEW-SHEET-MOTION', decision: 'reject' },
    ],
  }
}

function motionReviewLedger() {
  return {
    schemaVersion: 'scheduler-interaction-visual-motion-review-ledger-v1',
    verdict: 'approve_bounded_removals_and_role_separation',
    reviews: [
      { id: 'MOTION-FAB', before: baselineRef('src/styles.css', 'transition: transform 0.2s ease;'), after: workingRef('src/styles.css', '.scheduler-fab-button:active {\n  box-shadow:'), decision: 'remove_raw_press_transform' },
      { id: 'MOTION-SETTING-GLASS', before: baselineRef('src/styles.css', 'transform: scale(0.98);'), after: workingRef('src/styles.css', '.scheduler-setting-card:active {\n  background-color:'), decision: 'keep_glass_static' },
      { id: 'MOTION-EVENT-PRESS-PILOT', after: workingRef('src/styles.css', 'transform 160ms cubic-bezier(0.23, 1, 0.32, 1),'), decision: 'preserve_scoped_pilot' },
      { id: 'MOTION-ROUTE-CROSSFADE', after: workingRef('DESIGN.md', '`180ms ease`는 기존의 빠른 일반 전환 baseline이며 모든 interaction role의 보편 duration/easing이 아닙니다.'), decision: 'preserve_180ms_role' },
      { id: 'MOTION-CREATE-SCROLL', before: baselineRef('src/scheduler/ReservationEditorPage.jsx', "window.scrollTo({ top: 0, behavior: 'smooth' })"), after: workingRef('src/scheduler/ReservationEditorPage.jsx', "window.scrollTo({ top: 0, left: 0, behavior: 'auto' })"), decision: 'remove_unbounded_scroll_motion' },
    ],
  }
}

function validationBlockerLedger() {
  return {
    schemaVersion: 'scheduler-interaction-visual-validation-blocker-ledger-v1',
    validations: [
      { id: 'VAL-FOCUSED-SCHEDULER-MOTION-A11Y', status: 'pass', testCount: 38 },
      { id: 'VAL-HISTORICAL-REPLAY-REMEDIATION', status: 'pass', testCount: 13 },
      { id: 'VAL-FULL-SUITE-BEFORE-REMEDIATION', status: 'fail', pass: 617, fail: 40, skip: 2 },
      { id: 'VAL-FULL-SUITE-AFTER-REMEDIATION', status: 'blocked_environment', tests: 663, pass: 626, fail: 35, skip: 2, newNonPdfFailureCount: 0 },
      { id: 'VAL-FULL-PDF-SOURCE-RECONCILIATION', status: 'blocked_environment', expectedFailureCount: 35, codes: ['MISSING_SOURCE_FILE', 'PDF_SOURCE_NANBEI_PATH_REQUIRED'] },
      { id: 'VAL-BROWSER-RUNTIME', status: 'unverified', reason: 'No browser executable or agent-browser verifier was available.' },
    ],
    claimBoundary: 'The final full-suite rerun recorded 626 pass, 35 fail, and 2 skip across 663 tests; all 35 failures match missing explicit Ziwei PDF source inputs, with zero new non-PDF failures.',
  }
}

function deviceValidationLedger() {
  return {
    schemaVersion: 'scheduler-interaction-visual-device-validation-ledger-v1',
    evidenceStatus: 'unverified',
    targets: ['iPhone 375x667 Safari', 'iPhone 393x852 Safari', 'installed iOS PWA'],
    checks: ['44x44 targets and safe-area FAB', 'double-tap mutation exclusion', 'VoiceOver toggle name/state', 'hardware keyboard focus order', 'native date/time picker values', 'modal focus/inert/Escape/restore', 'push status in installed PWA', 'work-log confirm/busy/recovery'],
  }
}

export function buildAuditPayload() {
  return {
    schemaVersion: ARTIFACT_ID,
    verdict: VERDICT,
    repository: { branch: 'main', baselineHead: BASELINE_HEAD, sourceOfTruth: 'local_working_tree' },
    scope: { schedulerOnly: true, businessDataAuthApiMutation: false, dependencyMutation: false, designMdMutation: false, frozenArtifactRewrite: false, stagingCommitPushDeployRemoteMutation: false, preExistingChangeBoundary: 'Preserve untracked ?? -.jpg outside the work order.' },
    sourceReferenceLedger: sourceReferenceLedger(),
    flowAuditLedger: flowAuditLedger(),
    frontierDecisionLedger: frontierDecisionLedger(),
    motionReviewLedger: motionReviewLedger(),
    validationBlockerLedger: validationBlockerLedger(),
    deviceValidationLedger: deviceValidationLedger(),
    nonGeneralization: { route: '180ms browser-default route crossfade remains route-only.', async: '200ms opacity-only enter remains first-success content-only.', press: '160ms transform-only event-action feedback remains a pilot.', glass: 'Backdrop-filter owners stay static.', installation: 'Skill installation and repeated corpus claims are not adoption.' },
  }
}

function buildArtifact() {
  const inputBytesByPath = Object.fromEntries(INPUTS.map((path) => [path, readFileSync(join(ROOT, path))]))
  return attachArtifactIdentity(buildAuditPayload(), buildArtifactIdentity({ root: ROOT, artifactId: ARTIFACT_ID, materializerPath: MATERIALIZER_PATH, materializerVersion: MATERIALIZER_VERSION, baseHead: BASELINE_HEAD, inputs: INPUTS, inputBytesByPath }))
}

export async function materialize(directory = DEFAULT_DIRECTORY) {
  mkdirSync(directory, { recursive: true })
  const artifact = buildArtifact()
  const companions = {
    'source-reference-ledger.json': artifact.sourceReferenceLedger,
    'flow-audit-ledger.json': artifact.flowAuditLedger,
    'frontier-decision-ledger.json': artifact.frontierDecisionLedger,
    'motion-review-ledger.json': artifact.motionReviewLedger,
    'validation-blocker-ledger.json': artifact.validationBlockerLedger,
    'device-validation-ledger.json': artifact.deviceValidationLedger,
  }
  const output = { 'complete.json': canonicalIdentityJson(artifact) }
  for (const name of COMPANIONS) output[name] = canonicalIdentityJson(companions[name])
  for (const [name, text] of Object.entries(output)) writeFileSync(join(directory, name), text)
  const integrity = {
    schemaVersion: 'softie-artifact-integrity-v1', artifactId: ARTIFACT_ID, completeArtifactPath: `artifacts/${ARTIFACT_ID}/complete.json`,
    files: Object.fromEntries(Object.entries(output).sort(([a], [b]) => a.localeCompare(b)).map(([name, text]) => [`artifacts/${ARTIFACT_ID}/${name}`, { byteLength: Buffer.byteLength(text), byteSha256: sha256(text) }])),
  }
  writeFileSync(join(directory, 'complete.json.integrity.json'), canonicalIdentityJson(integrity))
  return artifact
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(new URL(import.meta.url).pathname)) {
  const directory = process.argv[2] ? resolve(process.argv[2]) : DEFAULT_DIRECTORY
  await materialize(directory)
  process.stdout.write(`${directory}\n`)
}

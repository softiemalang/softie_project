import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

import {
  attachArtifactIdentity,
  buildArtifactIdentity,
  canonicalIdentityJson,
} from '../src/artifactIdentity.js'

export const ROOT = resolve(new URL('..', import.meta.url).pathname)
export const ARTIFACT_ID = 'design-reference-form-modal-async-state-touch-foundation-batch-v1'
export const MATERIALIZER_PATH = 'scripts/materialize-design-reference-form-modal-async-state-touch-foundation-batch-v1.mjs'
export const MATERIALIZER_VERSION = `${ARTIFACT_ID}-materializer-1`
export const DEFAULT_DIRECTORY = join(ROOT, 'artifacts', ARTIFACT_ID)
export const BASELINE_HEAD = '59bcc1eee06147b3b486d7c3a1599c66fce42c59'
export const VERDICT = 'complete_softie_form_modal_async_state_touch_foundation_batch_v1_uncommitted'

export const COMPANIONS = [
  'source-reference-ledger.json',
  'provenance-lineage.json',
  'frontier-decision-ledger.json',
  'implementation-observation-ledger.json',
  'validation-blocker-ledger.json',
]

const REPO_INPUTS = [
  'AGENTS.md',
  'DESIGN.md',
  'src/artifactIdentity.js',
  'src/pages/HomePage.jsx',
  'src/pages/BandGoogleCompactPage.jsx',
  'src/pages/RehearsalCalendarPage.jsx',
  'src/pages/SpotifyMusicPage.jsx',
  'src/rehearsals/rehearsals.css',
  'src/saju/SoftieFortunePage.jsx',
  'src/saju/fortune.css',
  'src/scheduler/helpers.js',
  'src/scheduler/NativePickerField.jsx',
  'src/scheduler/ReservationEditorPage.jsx',
  'src/scheduler/SyncConfirmationModal.jsx',
  'src/scheduler/TodaySchedulerPage.jsx',
  'src/styles.css',
  'public/band-polish.css',
  'public/band-hub-account-actions.css',
  'scripts/check-design-reference-audit-v1-emil10-incremental.mjs',
  'test/formModalAsyncStateTouchFoundation.test.js',
  'test/lowRiskInteractionFoundation.test.js',
  'test/designReferenceFormModalAsyncStateTouchFoundationBatch.test.js',
  'docs/design-reference-form-modal-async-state-touch-foundation-batch-v1.md',
  'artifacts/design-reference-accessibility-legacy-interaction-cleanup-batch-v1/complete.json',
  'artifacts/design-reference-accessibility-legacy-interaction-cleanup-batch-v1/complete.json.integrity.json',
  '.agents/skills/apple-design/SKILL.md',
  '.agents/skills/emil-design-eng/SKILL.md',
  '.agents/skills/animate/SKILL.md',
  '.agents/skills/animate/RECIPES.md',
  '.agents/skills/improve-animations/SKILL.md',
  '.agents/skills/improve-animations/AUDIT.md',
  '.agents/skills/review-animations/SKILL.md',
  '.agents/skills/review-animations/STANDARDS.md',
  MATERIALIZER_PATH,
  'scripts/check-design-reference-form-modal-async-state-touch-foundation-batch-v1.mjs',
]

const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex')

function lineLocation(text, quote) {
  const index = text.indexOf(quote)
  if (index < 0) throw new Error(`quote not found: ${quote.slice(0, 100)}`)
  const lineStart = text.slice(0, index).split('\n').length
  return { lineStart, lineEnd: lineStart + quote.split('\n').length - 1, quote }
}

function workingTextRef(path, quote) {
  const bytes = readFileSync(join(ROOT, path))
  return {
    kind: 'working_tree_text',
    path,
    byteLength: bytes.byteLength,
    byteSha256: sha256(bytes),
    ...lineLocation(bytes.toString('utf8'), quote),
  }
}

function frozenRef(path, assertions = []) {
  const bytes = readFileSync(join(ROOT, path))
  return {
    kind: 'historical_artifact_json',
    path,
    byteLength: bytes.byteLength,
    byteSha256: sha256(bytes),
    assertions,
  }
}

function sourceReferenceLedger() {
  return {
    schemaVersion: 'softie-form-modal-async-state-touch-source-reference-ledger-v1',
    sources: [
      {
        sourceId: 'SRC-SOFTIE-AGENTS',
        authority: 'repository_authority',
        lineageGroup: 'LG-SOFTIE-REPOSITORY',
        sourceRef: workingTextRef('AGENTS.md', '- Prefer practical, mobile-friendly UI. This app is used in short sessions and should stay easy to use on a phone.'),
      },
      {
        sourceId: 'SRC-SOFTIE-DESIGN',
        authority: 'softie_house_rule',
        lineageGroup: 'LG-SOFTIE-REPOSITORY',
        sourceRef: workingTextRef('DESIGN.md', '- loading, empty success, filter no-result, error는 서로 다른 상태입니다.'),
      },
      {
        sourceId: 'SRC-W3C-FORMS-LABELS',
        authority: 'web_standard_primary',
        lineageGroup: 'LG-W3C-WAI',
        url: 'https://www.w3.org/WAI/tutorials/forms/labels/',
        claimBoundary: 'Supports programmatic labels; it does not prescribe Softie visual styling.',
      },
      {
        sourceId: 'SRC-W3C-FORMS-VALIDATION',
        authority: 'web_standard_primary',
        lineageGroup: 'LG-W3C-WAI',
        url: 'https://www.w3.org/WAI/tutorials/forms/validation/',
        claimBoundary: 'Supports identifying and describing errors without changing business validation rules.',
      },
      {
        sourceId: 'SRC-W3C-DIALOG-APG',
        authority: 'web_standard_primary',
        lineageGroup: 'LG-W3C-WAI',
        url: 'https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/',
        claimBoundary: 'Defines modal focus and background interaction expectations; a dialog role alone is not proof of modality.',
      },
      {
        sourceId: 'SRC-W3C-STATUS-MESSAGES',
        authority: 'web_standard_primary',
        lineageGroup: 'LG-W3C-WAI',
        url: 'https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html',
        claimBoundary: 'Supports programmatic status notification without focus movement.',
      },
      {
        sourceId: 'SRC-W3C-TARGET-SIZE',
        authority: 'web_standard_primary',
        lineageGroup: 'LG-W3C-WCAG22',
        url: 'https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum',
        claimBoundary: 'Provides the standards floor; Softie retains its stricter 44px house target.',
      },
      {
        sourceId: 'SRC-APPLE-ACCESSIBILITY',
        authority: 'apple_official_primary_guidance',
        lineageGroup: 'LG-APPLE-OFFICIAL',
        url: 'https://developer.apple.com/design/human-interface-guidelines/accessibility',
        claimBoundary: 'Supports operable and understandable controls without supplying Softie web motion values.',
      },
      {
        sourceId: 'SRC-EMIL-SIBLING-CORPUS',
        authority: 'external_design_engineering_guidance',
        lineageGroup: 'LG-EMIL-INSTALLED-SIBLINGS',
        independentAuthorityCount: 1,
        sourceRef: workingTextRef('.agents/skills/emil-design-eng/SKILL.md', '## Accessibility'),
      },
      {
        sourceId: 'SRC-PREDECESSOR-ACCESSIBILITY',
        authority: 'historical_softie_evidence',
        lineageGroup: 'LG-SOFTIE-INTERACTION-EVIDENCE',
        sourceRef: frozenRef('artifacts/design-reference-accessibility-legacy-interaction-cleanup-batch-v1/complete.json', [
          { path: '#/verdict', equals: 'complete_softie_accessibility_legacy_interaction_cleanup_batch_v1_uncommitted' },
        ]),
      },
    ],
  }
}

function provenanceLineage() {
  return {
    schemaVersion: 'softie-form-modal-async-state-touch-provenance-lineage-v1',
    authorityPriority: ['AGENTS.md / DESIGN.md', 'current_work_order', 'current_repository_evidence', 'official_external_guidance', 'external_skill_guidance'],
    evidenceClasses: ['direct_repository_observation', 'official_guidance', 'softie_house_rule', 'runtime_or_device_evidence'],
    emilSiblingCorpus: {
      lineageGroup: 'LG-EMIL-INSTALLED-SIBLINGS',
      independentAuthorityCount: 1,
      repeatedClaimsCountOnce: true,
      installationIsAdoption: false,
    },
    predecessor: frozenRef('artifacts/design-reference-accessibility-legacy-interaction-cleanup-batch-v1/complete.json.integrity.json'),
    historicalBytesPreserved: true,
  }
}

function frontierDecisionLedger() {
  return {
    schemaVersion: 'softie-form-modal-async-state-touch-frontier-decision-ledger-v1',
    frontiers: [
      { frontierId: 'FRONTIER-FORM-NATIVE-LABELS', decision: 'fix', sourceRefs: [workingTextRef('src/pages/RehearsalCalendarPage.jsx', '<label htmlFor="rehearsal-title">합주명 *</label>'), workingTextRef('src/pages/HomePage.jsx', '<label className="visually-hidden" htmlFor="home-memo-text">메모 내용</label>')] },
      { frontierId: 'FRONTIER-MODAL-DIALOG-NAMES', decision: 'fix', sourceRefs: [workingTextRef('src/pages/SpotifyMusicPage.jsx', 'role="dialog" aria-label="Spotify 기기 볼륨 조절"'), workingTextRef('src/saju/SoftieFortunePage.jsx', 'role="dialog" aria-label="운세 히스토리"')] },
      { frontierId: 'FRONTIER-MODAL-FOCUS-LIFECYCLE', decision: 'hold', blocker: 'Repository overlays do not share a proven focus-containment and background-inert lifecycle; aria-modal expansion is rejected until that lifecycle is implemented and browser-tested.' },
      { frontierId: 'FRONTIER-BUSY-DUPLICATE-ACTIONS', decision: 'fix', sourceRefs: [workingTextRef('src/pages/HomePage.jsx', 'if (!text || isSendingMemoRef.current) return'), workingTextRef('src/saju/SoftieFortunePage.jsx', 'if (!activeProfile || isLoading || reportRefreshLockRef.current) return'), workingTextRef('src/scheduler/TodaySchedulerPage.jsx', 'if (!syncConfirmation || workLogSyncLockRef.current) return')] },
      { frontierId: 'FRONTIER-ASYNC-STATE-SEPARATION', decision: 'fix', sourceRefs: [workingTextRef('src/pages/BandGoogleCompactPage.jsx', 'isLoadingRooms ? null : roomLoadError ? ('), workingTextRef('src/scheduler/TodaySchedulerPage.jsx', "? '현재 조건에 맞는 일정이 없어요.'")] },
      { frontierId: 'FRONTIER-TOUCH-44', decision: 'fix', sourceRefs: [workingTextRef('public/band-polish.css', '.band-week-nav-button {\n  display: flex;'), workingTextRef('src/styles.css', '.music-save-button {')] },
      { frontierId: 'FRONTIER-VALIDATION-ASSOCIATION', decision: 'fix', sourceRefs: [workingTextRef('src/scheduler/helpers.js', 'export function getReservationValidationIssue(formValues) {'), workingTextRef('src/scheduler/ReservationEditorPage.jsx', '?.querySelector(`[data-validation-field="${validationIssue.field}"]`)')] },
      { frontierId: 'FRONTIER-HISTORICAL-SOURCE-REF-DESCENDANT', decision: 'fix', sourceRefs: [workingTextRef('scripts/check-design-reference-audit-v1-emil10-incremental.mjs', 'function verifyTextRef(errors, reference, generationBaseHead) {')] },
      { frontierId: 'FRONTIER-NEW-MOTION', decision: 'reject', boundary: 'No new animation, duration, easing, stagger, or glass motion was introduced. Existing 180ms route, 200ms async-enter, 160ms press, hover gating, and reduced-motion boundaries remain separate.' },
      { frontierId: 'FRONTIER-LEAD-SHEET-DESTRUCTIVE-ASYNC', decision: 'hold', blocker: 'Cloud backup/restore can overwrite data and requires a separately authorized, recovery-preserving workflow change and authenticated runtime verification.' },
      { frontierId: 'FRONTIER-INACTIVE-FORTUNE-ROUTE', decision: 'not_applicable', boundary: 'The disabled /fortune entry and inactive FortunePage.jsx were observed but not edited.' },
      { frontierId: 'FRONTIER-LAZY-ROUTE-ERROR-BOUNDARY', decision: 'hold', blocker: 'A route-level retry boundary changes shared application architecture and is not required for this focused active-surface batch.' },
    ],
  }
}

function implementationObservationLedger() {
  return {
    schemaVersion: 'softie-form-modal-async-state-touch-implementation-observation-ledger-v1',
    baselineHead: BASELINE_HEAD,
    observations: [
      { observationId: 'OBS-VALIDATION-MESSAGE-PARITY', sourceRef: workingTextRef('test/formModalAsyncStateTouchFoundation.test.js', "test('reservation validation keeps its messages while exposing the first invalid field'") },
      { observationId: 'OBS-MOTION-BOUNDARY-PRESERVED', sourceRef: workingTextRef('DESIGN.md', '- 이 `200ms`는 `async content enter / conditional content swap` 역할에 한정된 Softie house rule이며 다른 interaction 유형의 전역 duration 기본값이 아닙니다.'), newMotion: false },
      { observationId: 'OBS-DESIGN-CONTRACT-2-10', sourceRef: workingTextRef('DESIGN.md', 'version: 2.10.0') },
    ],
  }
}

function validationBlockerLedger() {
  return {
    schemaVersion: 'softie-form-modal-async-state-touch-validation-blocker-ledger-v1',
    validations: [
      { id: 'VAL-FOCUSED-MOTION-REGRESSION', status: 'pass', passCount: 23, failureCount: 0 },
      { id: 'VAL-FOCUSED-FOUNDATION', status: 'pass', passCount: 7, failureCount: 0 },
      { id: 'VAL-HISTORICAL-DESCENDANT-CHECKER', status: 'pass', failureCount: 0 },
      { id: 'VAL-BUILD', status: 'pass' },
      { id: 'VAL-DIFF-CHECK', status: 'pass' },
      { id: 'VAL-FULL-SUITE-OBSERVED', status: 'environment_blocked', tests: 651, passCount: 614, failureCount: 35, skippedCount: 2 },
      { id: 'VAL-FULL-NON-PDF-AFTER-REMEDIATION', status: 'pass', failureCount: 0, note: 'The final full default suite had zero non-PDF failures; every observed failure was a PDF source blocker.' },
      { id: 'VAL-FULL-PDF-SOURCE', status: 'blocked_pre_existing', expectedFailureCount: 35, requiredInputs: ['PDF_SOURCE_NANBEI_PATH', 'PDF_SOURCE_NANYANGTANG_PATH'] },
      { id: 'VAL-BROWSER-KEYBOARD-SCREENREADER', status: 'unverified' },
    ],
    blockers: [
      { blockerId: 'BLK-MODAL-FOCUS-LIFECYCLE', status: 'open', frontierId: 'FRONTIER-MODAL-FOCUS-LIFECYCLE' },
      { blockerId: 'BLK-LEAD-SHEET-DESTRUCTIVE-ASYNC', status: 'open', frontierId: 'FRONTIER-LEAD-SHEET-DESTRUCTIVE-ASYNC' },
      { blockerId: 'BLK-LAZY-ROUTE-ERROR-BOUNDARY', status: 'open', frontierId: 'FRONTIER-LAZY-ROUTE-ERROR-BOUNDARY' },
      { blockerId: 'BLK-PDF-SOURCE-FILES', status: 'environment_blocked', validationId: 'VAL-FULL-PDF-SOURCE' },
      { blockerId: 'BLK-RUNTIME-A11Y-PILOT', status: 'unverified', validationId: 'VAL-BROWSER-KEYBOARD-SCREENREADER' },
    ],
  }
}

export function buildFoundationPayload() {
  return {
    schemaVersion: ARTIFACT_ID,
    verdict: VERDICT,
    repository: { branch: 'main', baselineHead: BASELINE_HEAD },
    scope: {
      businessDataAuthApiMutation: false,
      dependencyMutation: false,
      frozenArtifactRewrite: false,
      stagingCommitPushDeployRemoteMutation: false,
      preExistingChangeBoundary: 'Preserve untracked ?? -.jpg byte-for-byte and outside staging.',
    },
    sourceReferenceLedger: sourceReferenceLedger(),
    provenanceLineage: provenanceLineage(),
    frontierDecisionLedger: frontierDecisionLedger(),
    implementationObservationLedger: implementationObservationLedger(),
    validationBlockerLedger: validationBlockerLedger(),
    nonGeneralization: {
      modality: 'A dialog role and name are not proof of modal focus containment or inert background behavior.',
      motion: 'No new motion values were adopted; existing role-specific timing remains separate.',
      touch: '44px is a Softie house target informed by Apple guidance, not a value attributed to WCAG 2.2 Target Size Minimum.',
      runtime: 'Source and build checks do not prove keyboard, screen-reader, authenticated remote, or physical-device behavior.',
    },
  }
}

export function buildFoundationArtifact() {
  const inputBytesByPath = Object.fromEntries(REPO_INPUTS.map((path) => [path, readFileSync(join(ROOT, path))]))
  const identity = buildArtifactIdentity({
    root: ROOT,
    artifactId: ARTIFACT_ID,
    materializerPath: MATERIALIZER_PATH,
    materializerVersion: MATERIALIZER_VERSION,
    baseHead: BASELINE_HEAD,
    inputs: REPO_INPUTS,
    inputBytesByPath,
  })
  return attachArtifactIdentity(buildFoundationPayload(), identity)
}

export async function materialize(directory = DEFAULT_DIRECTORY) {
  mkdirSync(directory, { recursive: true })
  const artifact = buildFoundationArtifact()
  const companionMap = {
    'source-reference-ledger.json': artifact.sourceReferenceLedger,
    'provenance-lineage.json': artifact.provenanceLineage,
    'frontier-decision-ledger.json': artifact.frontierDecisionLedger,
    'implementation-observation-ledger.json': artifact.implementationObservationLedger,
    'validation-blocker-ledger.json': artifact.validationBlockerLedger,
  }
  const output = { 'complete.json': canonicalIdentityJson(artifact) }
  for (const name of COMPANIONS) output[name] = canonicalIdentityJson(companionMap[name])
  for (const [name, text] of Object.entries(output)) writeFileSync(join(directory, name), text)
  const integrity = {
    schemaVersion: 'softie-artifact-integrity-v1',
    artifactId: ARTIFACT_ID,
    completeArtifactPath: `artifacts/${ARTIFACT_ID}/complete.json`,
    files: Object.fromEntries(Object.entries(output).sort(([a], [b]) => a.localeCompare(b)).map(([name, text]) => [
      `artifacts/${ARTIFACT_ID}/${name}`,
      { byteLength: Buffer.byteLength(text), byteSha256: sha256(text) },
    ])),
  }
  writeFileSync(join(directory, 'complete.json.integrity.json'), canonicalIdentityJson(integrity))
  return artifact
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(new URL(import.meta.url).pathname)) {
  const directory = process.argv[2] ? resolve(process.argv[2]) : DEFAULT_DIRECTORY
  await materialize(directory)
  process.stdout.write(`${directory}\n`)
}

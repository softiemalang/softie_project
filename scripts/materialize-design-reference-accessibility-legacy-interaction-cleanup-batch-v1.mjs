import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

import {
  attachArtifactIdentity,
  buildArtifactIdentity,
  canonicalIdentityJson,
} from '../src/artifactIdentity.js'

export const ROOT = resolve(new URL('..', import.meta.url).pathname)
export const ARTIFACT_ID = 'design-reference-accessibility-legacy-interaction-cleanup-batch-v1'
export const MATERIALIZER_PATH = 'scripts/materialize-design-reference-accessibility-legacy-interaction-cleanup-batch-v1.mjs'
export const MATERIALIZER_VERSION = `${ARTIFACT_ID}-materializer-1`
export const DEFAULT_DIRECTORY = join(ROOT, 'artifacts', ARTIFACT_ID)
export const BASELINE_HEAD = 'fe39120e5c3c703038c6d957a376dc64cd62a5fd'
export const VERDICT = 'complete_softie_accessibility_legacy_interaction_cleanup_batch_v1_uncommitted'
export const EMIL_REVISION = '78761e1b57f97dce65b983d640c70a68f39e8163'

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
  'src/styles.css',
  'src/rehearsals/rehearsals.css',
  'src/pages/RehearsalCalendarPage.jsx',
  'src/pages/LeadSheetPage.jsx',
  'src/pages/BandGooglePage.jsx',
  'src/pages/BandGoogleCompactPage.jsx',
  'src/interpretationPrep/InterpretationPrepPage.jsx',
  'src/interpretationPrep/interpretationPrep.css',
  'src/saju/fortune.css',
  'src/scheduler/TodaySchedulerPage.jsx',
  'public/band-polish.css',
  'public/band-hub-account-actions.css',
  'scripts/check-design-reference-low-risk-interaction-foundation-batch-v1.mjs',
  'test/lowRiskInteractionFoundation.test.js',
  'test/accessibilityLegacyInteractionCleanup.test.js',
  'test/designReferenceAccessibilityLegacyInteractionCleanupBatch.test.js',
  'docs/design-reference-accessibility-legacy-interaction-cleanup-batch-v1.md',
  'docs/design-reference-low-risk-interaction-foundation-batch-v1.md',
  'artifacts/design-reference-low-risk-interaction-foundation-batch-v1/complete.json',
  'artifacts/design-reference-low-risk-interaction-foundation-batch-v1/complete.json.integrity.json',
  '.agents/skills/apple-design/SKILL.md',
  '.agents/skills/emil-design-eng/SKILL.md',
  '.agents/skills/improve-animations/SKILL.md',
  '.agents/skills/improve-animations/AUDIT.md',
  '.agents/skills/review-animations/SKILL.md',
  '.agents/skills/review-animations/STANDARDS.md',
  MATERIALIZER_PATH,
]

const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex')

function gitBytes(commit, path) {
  return execFileSync('git', ['-c', 'core.fsmonitor=false', 'show', `${commit}:${path}`], {
    cwd: ROOT,
    stdio: ['ignore', 'pipe', 'ignore'],
  })
}

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

function gitTextRef(commit, path, quote) {
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

function frozenRef(path, assertions) {
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
    schemaVersion: 'softie-accessibility-legacy-source-reference-ledger-v1',
    sources: [
      {
        sourceId: 'SRC-SOFTIE-AGENTS',
        authority: 'repository_authority',
        lineageGroup: 'LG-SOFTIE-REPOSITORY',
        sourceRef: workingTextRef('AGENTS.md', '- Keep a change within the requested behavior and the smallest necessary file surface. Do not make adjacent cleanup, refactors, or design changes without authorization.'),
      },
      {
        sourceId: 'SRC-SOFTIE-DESIGN',
        authority: 'softie_house_rule',
        lineageGroup: 'LG-SOFTIE-REPOSITORY',
        sourceRef: workingTextRef('DESIGN.md', '- 동작을 실행하는 target은 가능한 한 native `button`을 사용합니다.'),
      },
      {
        sourceId: 'SRC-W3C-WCAG-KEYBOARD',
        authority: 'web_standard_primary',
        lineageGroup: 'LG-W3C-WCAG22',
        url: 'https://www.w3.org/WAI/WCAG22/Understanding/keyboard.html',
        claimBoundary: 'Functionality must be operable through a keyboard interface; it does not prescribe Softie CSS values.',
      },
      {
        sourceId: 'SRC-W3C-WCAG-FOCUS-VISIBLE',
        authority: 'web_standard_primary',
        lineageGroup: 'LG-W3C-WCAG22',
        url: 'https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html',
        claimBoundary: 'Keyboard-operable controls require a visible focus indicator; it does not prescribe the local ring recipe.',
      },
      {
        sourceId: 'SRC-W3C-WCAG-TARGET-SIZE',
        authority: 'web_standard_primary',
        lineageGroup: 'LG-W3C-WCAG22',
        url: 'https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html',
        claimBoundary: 'Provides a standards floor; Softie keeps its stricter 44px house target where layout permits.',
      },
      {
        sourceId: 'SRC-W3C-ARIA-BUTTON',
        authority: 'web_standard_primary',
        lineageGroup: 'LG-W3C-ARIA-APG',
        url: 'https://www.w3.org/WAI/ARIA/apg/patterns/button/',
        claimBoundary: 'Supports native button keyboard semantics and pressed state; APG examples do not override HTML-native preference.',
      },
      {
        sourceId: 'SRC-APPLE-ACCESSIBILITY',
        authority: 'apple_official_primary_guidance',
        lineageGroup: 'LG-APPLE-OFFICIAL',
        url: 'https://developer.apple.com/design/human-interface-guidelines/accessibility',
        claimBoundary: 'Supports understandable, operable controls and reduced motion without supplying Softie web timing values.',
      },
      {
        sourceId: 'SRC-EMIL-CORPUS',
        authority: 'external_design_engineering_guidance',
        lineageGroup: `LG-EMIL10-${EMIL_REVISION.slice(0, 12)}`,
        sourceRef: workingTextRef('.agents/skills/emil-design-eng/SKILL.md', '## Accessibility'),
        independentAuthorityCount: 1,
      },
      {
        sourceId: 'SRC-PREDECESSOR-FOUNDATION',
        authority: 'historical_softie_evidence',
        lineageGroup: 'LG-SOFTIE-INTERACTION-EVIDENCE',
        sourceRef: frozenRef('artifacts/design-reference-low-risk-interaction-foundation-batch-v1/complete.json', [
          { path: '#/verdict', equals: 'complete_softie_low_risk_interaction_foundation_batch_v1_uncommitted' },
          { path: '#/frontierDecisionLedger/frontiers/5/decision', equals: 'reject' },
        ]),
      },
    ],
  }
}

function provenanceLineage() {
  return {
    schemaVersion: 'softie-accessibility-legacy-provenance-lineage-v1',
    authorityPriority: ['AGENTS.md / DESIGN.md', 'current_work_order', 'repository_evidence', 'external_skill'],
    evidenceClasses: ['direct_evidence', 'adjacent_role_evidence', 'softie_house_evidence', 'product_device_evidence'],
    emilCorpus: {
      revision: EMIL_REVISION,
      installedSkillCount: 10,
      independentAuthorityCount: 1,
      repeatedClaimsCountOnce: true,
      installationIsAdoption: false,
    },
    predecessor: frozenRef('artifacts/design-reference-low-risk-interaction-foundation-batch-v1/complete.json.integrity.json', []),
    historicalBytesPreserved: true,
  }
}

function frontierDecisionLedger() {
  return {
    schemaVersion: 'softie-accessibility-legacy-frontier-decision-ledger-v1',
    frontiers: [
      {
        frontierId: 'FRONTIER-NONSEMANTIC-ACTIONS',
        decision: 'fix',
        surfaces: ['Rehearsal month reset action', 'Rehearsal date cells'],
        sourceRefs: [
          workingTextRef('src/pages/RehearsalCalendarPage.jsx', 'aria-label={`${currentDate.getFullYear()}년 ${currentDate.getMonth() + 1}월, 오늘 날짜로 이동`}'),
          workingTextRef('src/pages/RehearsalCalendarPage.jsx', 'aria-current={isToday ? \'date\' : undefined}'),
        ],
        evidence: { direct_evidence: ['native controls now provide focus and Enter/Space activation'], adjacent_role_evidence: [], softie_house_evidence: ['DESIGN Buttons'], product_device_evidence: [] },
      },
      {
        frontierId: 'FRONTIER-FOCUS-VISIBLE',
        decision: 'fix',
        surfaces: ['Rehearsal date/month controls', 'Rehearsal time picker', 'Rehearsal native date/time picker shell'],
        sourceRefs: [
          workingTextRef('src/rehearsals/rehearsals.css', '.rehearsal-time-period-toggle button:focus-visible,\n.rehearsal-time-hour-grid button:focus-visible {'),
          workingTextRef('src/rehearsals/rehearsals.css', '.rehearsal-native-picker-shell:focus-within .rehearsal-picker-field {'),
        ],
        blocker: null,
      },
      {
        frontierId: 'FRONTIER-LEGACY-REDUCED-MOTION',
        decision: 'fix',
        surfaces: ['Scheduler legacy press families', 'Spotify controls and progress', 'Interpretation Prep press/lift and strength meters'],
        sourceRefs: [
          gitTextRef('59bcc1eee06147b3b486d7c3a1599c66fce42c59', 'src/styles.css', '.scheduler-fab-button:active,\n  .scheduler-setting-card:active,'),
          workingTextRef('src/interpretationPrep/interpretationPrep.css', '.strength-meter-fill,\n  .prep-strength-bar {\n    transition: none !important;'),
        ],
        boundary: 'Movement and interpolation stop; existing color, background, opacity, and state text remain.',
      },
      {
        frontierId: 'FRONTIER-TOUCH-KEYBOARD-STATE-SEMANTICS',
        decision: 'fix',
        surfaces: ['Rehearsal controls', 'Band availability and compact groups', 'Interpretation Prep gender selection'],
        sourceRefs: [
          workingTextRef('src/pages/BandGooglePage.jsx', 'aria-pressed={Boolean(availabilityMap[key])}'),
          workingTextRef('src/pages/BandGoogleCompactPage.jsx', '<div className="band-tabbar" role="group" aria-label="방 메뉴">'),
          workingTextRef('src/interpretationPrep/InterpretationPrepPage.jsx', '<div className="prep-gender-control" role="group" aria-labelledby="prep-gender-label">'),
        ],
        boundary: 'Incomplete tab/radio semantics were removed instead of adding missing composite-widget keyboard behavior.',
      },
      {
        frontierId: 'FRONTIER-TRANSITION-PROPERTY-COHERENCE',
        decision: 'fix',
        surfaces: ['audited legacy CSS declarations across shared, Prep, Rehearsal, and Fortune styles'],
        sourceRefs: [
          workingTextRef('src/rehearsals/rehearsals.css', 'transition: background-color 0.15s ease, border-color 0.15s ease;'),
          workingTextRef('src/interpretationPrep/interpretationPrep.css', 'transition: border-color var(--ag-duration-fast) ease;'),
        ],
        boundary: 'Removed transition:all and undefined token names without forcing role-specific raw durations into one universal token. Width-to-transform rewrites remain out of scope.',
      },
      {
        frontierId: 'FRONTIER-SCHEDULER-SYNC-TOAST-GLASS',
        decision: 'fix',
        surfaces: ['Scheduler sync status toast'],
        sourceRefs: [
          gitTextRef(BASELINE_HEAD, 'src/styles.css', 'animation: scheduler-sync-toast-in 180ms ease-out both;'),
          workingTextRef('src/styles.css', '.scheduler-theme-shell .scheduler-sync-toast {'),
          workingTextRef('src/scheduler/TodaySchedulerPage.jsx', '<div className="scheduler-sync-toast" role="status" aria-live="polite">'),
        ],
        boundary: 'The glass stays static. The 1800ms mount timer is status lifecycle, not a motion token, and is unchanged.',
      },
      {
        frontierId: 'FRONTIER-LEGACY-HOVER-GATING',
        decision: 'fix',
        surfaces: ['Spotify', 'Interpretation Prep', 'Lead Sheet', 'Band compact navigation', 'Fortune history'],
        sourceRefs: [
          workingTextRef('src/styles.css', '@media (hover: hover) and (pointer: fine) {\n  .music-save-button:hover:not(:disabled) {'),
          workingTextRef('src/interpretationPrep/interpretationPrep.css', '@media (hover: hover) and (pointer: fine) {\n  .prep-shell input:hover,'),
        ],
        boundary: 'Active, focus, and semantic state paths remain independent; no information becomes hover-only.',
      },
      {
        frontierId: 'FRONTIER-LEAD-SHEET-DENSE-OVERLAYS',
        decision: 'hold',
        surfaces: ['Lead Sheet full-screen page touch zones', 'backup badge', 'dense performance controls'],
        sourceRefs: [
          workingTextRef('src/pages/LeadSheetPage.jsx', 'className="lead-sheet-touch-zone"'),
          workingTextRef('src/pages/LeadSheetPage.jsx', 'className="lead-sheet-backup-badge"'),
        ],
        blocker: 'Changing focus order or target geometry in the performance-use surface requires separate layout and physical-device validation.',
      },
    ],
  }
}

function implementationObservationLedger() {
  return {
    schemaVersion: 'softie-accessibility-legacy-implementation-observation-ledger-v1',
    baselineHead: BASELINE_HEAD,
    observations: [
      {
        observationId: 'OBS-SYNC-TOAST-BEFORE-AFTER',
        before: gitTextRef(BASELINE_HEAD, 'src/styles.css', '@keyframes scheduler-sync-toast-in {'),
        after: workingTextRef('src/styles.css', 'pointer-events: none;\n}\n\n@media (prefers-reduced-motion: reduce) {'),
        lifecycleMutation: false,
      },
      {
        observationId: 'OBS-ASYNC-200-PRESERVED',
        sourceRef: workingTextRef('src/styles.css', 'animation: scheduler-async-content-enter\n    var(--ag-scheduler-async-content-enter-duration)\n    var(--ag-scheduler-async-content-enter-easing)\n    both;'),
        generalized: false,
      },
      {
        observationId: 'OBS-PRESS-PILOT-PRESERVED',
        sourceRef: workingTextRef('src/styles.css', 'transform 160ms cubic-bezier(0.23, 1, 0.32, 1),'),
        promoted: false,
      },
    ],
  }
}

function validationBlockerLedger() {
  return {
    schemaVersion: 'softie-accessibility-legacy-validation-blocker-ledger-v1',
    validations: [
      { id: 'VAL-FOCUSED-INTERACTION', status: 'pass' },
      { id: 'VAL-PREDECESSOR-CHECKERS', status: 'pass' },
      { id: 'VAL-DETERMINISTIC-MATERIALIZATION', status: 'pass' },
      { id: 'VAL-TAMPER-REJECTION', status: 'pass' },
      { id: 'VAL-SCHEDULER-REGRESSION', status: 'pass' },
      { id: 'VAL-BUILD', status: 'pass' },
      { id: 'VAL-DIFF-CHECK', status: 'pass' },
      { id: 'VAL-FULL-NON-PDF', status: 'pass', failureCount: 0 },
      { id: 'VAL-FULL-PDF-SOURCE', status: 'blocked_pre_existing', expectedFailureCount: 35 },
    ],
    blockers: [
      { blockerId: 'BLK-LEAD-SHEET-DEVICE-LAYOUT', status: 'open', frontierId: 'FRONTIER-LEAD-SHEET-DENSE-OVERLAYS' },
    ],
  }
}

export function buildCleanupPayload() {
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
      async200ms: 'The Scheduler async content enter 200ms role is preserved and not reused for these interactions.',
      pressPilot: 'The 160ms Scheduler press recipe remains pilot-scoped and is not promoted here.',
      roleValues: 'Existing raw durations are not inferred to be equivalent merely because values repeat.',
      syncToastLifecycle: 'The unchanged 1800ms status lifetime is not a motion duration or token.',
    },
  }
}

function buildArtifact() {
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
  return attachArtifactIdentity(buildCleanupPayload(), identity)
}

export async function materialize(directory = DEFAULT_DIRECTORY) {
  mkdirSync(directory, { recursive: true })
  const artifact = buildArtifact()
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

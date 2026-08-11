import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import {
  attachArtifactIdentity,
  buildArtifactIdentity,
  canonicalIdentityJson,
} from '../src/artifactIdentity.js'

const ROOT = resolve(new URL('..', import.meta.url).pathname)
const ARTIFACT_ID = 'design-reference-audit-v1-emil10-incremental'
const MATERIALIZER_VERSION = 'design-reference-audit-v1-emil10-incremental-materializer-1'
const DEFAULT_OUTPUT_DIR = join(ROOT, 'artifacts', ARTIFACT_ID)
const AUDIT_DATE = '2026-08-11'
const VERDICT = 'complete_softie_design_reference_incremental_emil10_audit_uncommitted'
const CORPUS_REVISION = '78761e1b57f97dce65b983d640c70a68f39e8163'
const CORPUS_REPOSITORY = 'emilkowalski/skills'
const LINEAGE_ID = `LG-EMIL10-${CORPUS_REVISION.slice(0, 12)}`

const EXPECTED_FILES = {
  animate: ['RECIPES.md', 'SKILL.md'],
  'animation-vocabulary': ['SKILL.md'],
  'apple-design': ['SKILL.md'],
  'ask-sonner': ['API.md', 'SKILL.md'],
  'emil-design-eng': ['SKILL.md'],
  'find-animation-opportunities': ['SKILL.md'],
  'improve-animations': ['AUDIT.md', 'PLAN-TEMPLATE.md', 'SKILL.md'],
  'pick-ui-library': ['SKILL.md'],
  prototype: ['PICKER.md', 'SKILL.md'],
  'review-animations': ['SKILL.md', 'STANDARDS.md'],
}

const NEW_SKILLS = [
  'animation-vocabulary',
  'ask-sonner',
  'emil-design-eng',
  'find-animation-opportunities',
  'improve-animations',
  'pick-ui-library',
  'prototype',
]

const REPO_INPUTS = [
  'AGENTS.md',
  'DESIGN.md',
  'THIRD_PARTY_NOTICES.md',
  'skills-lock.json',
  'docs/design-reference-audit-v1.md',
  'artifacts/design-reference-audit-v1/complete.json',
  'artifacts/design-reference-audit-v1/source-reference-ledger.json',
  'artifacts/design-reference-audit-v1/observation-value-ledger.json',
  'artifacts/design-reference-audit-v1/provenance-lineage.json',
  'artifacts/design-reference-audit-v1/conflict-compatibility-matrix.json',
  'artifacts/design-reference-audit-v1/pilot-candidate-shortlist.json',
  'src/scheduler/TodaySchedulerPage.jsx',
  'src/scheduler/SchedulerEventSection.jsx',
  'src/scheduler/SchedulerEventCard.jsx',
  'src/scheduler/SchedulerApp.jsx',
  'src/lib/router.js',
  'src/styles.css',
  'src/artifactIdentity.js',
  'scripts/materialize-design-reference-audit-v1-emil10-incremental.mjs',
  ...Object.entries(EXPECTED_FILES).flatMap(([skill, files]) => files.map((file) => `.agents/skills/${skill}/${file}`)),
]

const TIER_DEFINITIONS = [
  { id: 'T1', code: 'apple_official_artifact', name: 'Apple official artifact', boundary: 'Direct local observation only; originality and reuse rights remain separate.' },
  { id: 'T2', code: 'apple_derived_guidance', name: 'Apple-derived guidance', boundary: 'A translation layer, never Apple primary authority.' },
  { id: 'T3', code: 'independent_design_engineering_guidance', name: 'Independent design-engineering guidance', boundary: 'Emil-style web practice; all files in this corpus share one upstream author/repository lineage.' },
  { id: 'T4', code: 'softie_house_rule', name: 'Softie house rule', boundary: 'Current DESIGN.md or deliberately observed implementation value.' },
  { id: 'T5', code: 'proposed_candidate', name: 'Proposed candidate', boundary: 'Pilot hypothesis only; never an adopted rule.' },
]

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex')
}

function readRepoFile(path) {
  return readFileSync(join(ROOT, path))
}

function readRepoText(path) {
  return readRepoFile(path).toString('utf8')
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

function textRef(path, lineStart, lineEnd, quote) {
  return { kind: 'text', path, lineStart, lineEnd, quote }
}

function jsonRef(path, jsonPath) {
  return { kind: 'json', path, jsonPath }
}

function source(id, tier, title, role, path, extra = {}) {
  return { id, tier, title, role, path, accessMode: 'local_repository_read', ...extra }
}

function skillSourceId(skill) {
  return `SRC-EMIL10-${skill.toUpperCase().replaceAll('-', '_')}`
}

function corpusFileInventory() {
  const lock = JSON.parse(readRepoText('skills-lock.json'))
  const notices = readRepoText('THIRD_PARTY_NOTICES.md')
  if (!notices.includes(`\`sourceRevision\`: \`${CORPUS_REVISION}\``)) throw new Error('pinned corpus revision is absent from THIRD_PARTY_NOTICES.md')
  if (!notices.includes('for each skill, sort all regular files by relative path')) throw new Error('lock hash rule is absent from THIRD_PARTY_NOTICES.md')

  const entries = Object.keys(EXPECTED_FILES).sort().map((skill) => {
    const lockEntry = lock.skills?.[skill]
    if (!lockEntry) throw new Error(`missing lock entry: ${skill}`)
    const expectedFiles = [...EXPECTED_FILES[skill]].sort()
    const localFiles = expectedFiles.map((file) => `.agents/skills/${skill}/${file}`)
    const fileDetails = expectedFiles.map((file) => {
      const path = `.agents/skills/${skill}/${file}`
      const bytes = readRepoFile(path)
      return {
        relativePath: file,
        path,
        byteLength: bytes.byteLength,
        byteSha256: sha256(bytes),
      }
    })
    const hash = createHash('sha256')
    for (const file of expectedFiles) {
      hash.update(Buffer.from(file, 'utf8'))
      hash.update(readRepoFile(`.agents/skills/${skill}/${file}`))
    }
    const actualComputedHash = hash.digest('hex')
    return {
      skill,
      source: lockEntry.source,
      sourceType: lockEntry.sourceType,
      skillPath: lockEntry.skillPath,
      computedHash: lockEntry.computedHash,
      actualComputedHash,
      lockHashMatchesLocalBytes: actualComputedHash === lockEntry.computedHash,
      files: fileDetails,
      localFiles,
    }
  })
  if (entries.length !== 10 || entries.some((entry) => !entry.lockHashMatchesLocalBytes)) throw new Error('installed corpus does not satisfy the pinned lock hashes')
  return {
    repository: CORPUS_REPOSITORY,
    sourceRef: 'refs/heads/main',
    sourceRevision: CORPUS_REVISION,
    sourceCommitSubject: 'Update README.md',
    sourceObservedAt: '2026-08-10T23:18:45Z',
    localRoot: '.agents/skills/',
    lockFile: 'skills-lock.json',
    lockHashRule: 'For each skill, sort all regular files by relative path, concatenate each relative path UTF-8 byte sequence immediately followed by that file raw bytes, then compute SHA-256.',
    exactlyTenSkills: entries.length === 10,
    entries,
    provenanceRefs: [
      textRef('THIRD_PARTY_NOTICES.md', 60, 71, 'sourceRevision'),
      textRef('THIRD_PARTY_NOTICES.md', 73, 86, 'The installed corpus contains exactly these upstream directories and companion files'),
      textRef('skills-lock.json', 1, 8, 'computedHash'),
    ],
  }
}

function skillObservations() {
  return [
    {
      id: 'OBS-EMIL10-TELEPORTING-STATE',
      skill: 'find-animation-opportunities',
      sourceId: skillSourceId('find-animation-opportunities'),
      tier: 'independent_design_engineering_guidance',
      lineageGroup: LINEAGE_ID,
      subject: 'Loading placeholder to loaded content as a teleporting conditional state seam',
      classification: 'direct_role_match',
      value: {
        purpose: 'preventing_a_jarring_change',
        mechanism: 'fade_or_scale_entrance',
        initialScale: '0.95-0.97',
        initialOpacity: 0,
        easing: 'ease-out',
        loadingSpecificDuration: false,
      },
      sourceRefs: [
        textRef('.agents/skills/find-animation-opportunities/SKILL.md', 77, 78, 'Content that swaps, appears, or vanishes instantly'),
        textRef('.agents/skills/find-animation-opportunities/SKILL.md', 78, 78, 'scale(0.95–0.97)'),
      ],
      interpretation: 'Directly matches the conditional loaded-content seam, but supplies no loading-specific duration.',
      status: 'reference',
    },
    {
      id: 'OBS-EMIL10-VOCAB-ENTER-EXIT',
      skill: 'animation-vocabulary',
      sourceId: skillSourceId('animation-vocabulary'),
      tier: 'independent_design_engineering_guidance',
      lineageGroup: LINEAGE_ID,
      subject: 'Vocabulary for loaded content entering after a state change',
      classification: 'adjacent_role_guidance',
      value: {
        primaryTerm: 'Enter / Exit',
        opacityTerm: 'Fade in / Fade out',
        conditionalTerm: 'Crossfade only when old and new states overlap in the same spot',
        revealTerm: 'Reveal only when content is uncovered by a clip-path or mask',
      },
      sourceRefs: [
        textRef('.agents/skills/animation-vocabulary/SKILL.md', 61, 61, 'Fade in / Fade out'),
        textRef('.agents/skills/animation-vocabulary/SKILL.md', 65, 66, 'Reveal'),
        textRef('.agents/skills/animation-vocabulary/SKILL.md', 89, 89, 'Crossfade'),
        textRef('.agents/skills/animation-vocabulary/SKILL.md', 101, 102, 'Page transition'),
      ],
      interpretation: 'Naming/glossary evidence, not a loading implementation prescription.',
      status: 'reference',
    },
    {
      id: 'OBS-EMIL10-ENTER-EASE-OUT',
      skill: 'emil-design-eng',
      sourceId: skillSourceId('emil-design-eng'),
      tier: 'independent_design_engineering_guidance',
      lineageGroup: LINEAGE_ID,
      subject: 'Easing role for an entering or exiting element',
      classification: 'direct_role_match',
      value: { enteringOrExiting: 'ease-out', customCurve: 'cubic-bezier(0.23, 1, 0.32, 1)', avoid: 'ease-in' },
      sourceRefs: [
        textRef('.agents/skills/emil-design-eng/SKILL.md', 97, 106, 'ease-out (starts fast, feels responsive)'),
        textRef('.agents/skills/emil-design-eng/SKILL.md', 112, 112, 'cubic-bezier(0.23, 1, 0.32, 1)'),
      ],
      interpretation: 'Direct role-matched easing evidence; it does not select a duration.',
      status: 'reference',
    },
    {
      id: 'OBS-EMIL10-DURATION-ROLE-RANGES',
      skill: 'emil-design-eng',
      sourceId: skillSourceId('emil-design-eng'),
      tier: 'independent_design_engineering_guidance',
      lineageGroup: LINEAGE_ID,
      subject: 'Role-specific duration ranges',
      classification: 'adjacent_role_guidance',
      value: { press: '100-160ms', tooltipPopover: '125-200ms', dropdownSelect: '150-250ms', modalDrawer: '200-500ms', generalUi: 'under 300ms' },
      sourceRefs: [
        textRef('.agents/skills/emil-design-eng/SKILL.md', 129, 132, 'Button press feedback'),
        textRef('.agents/skills/emil-design-eng/SKILL.md', 135, 135, 'UI animations should stay under 300ms'),
      ],
      interpretation: 'The corpus has role ranges but no async loaded-content role.',
      status: 'reference',
    },
    {
      id: 'OBS-EMIL10-SELECT-180',
      skill: 'emil-design-eng',
      sourceId: skillSourceId('emil-design-eng'),
      tier: 'independent_design_engineering_guidance',
      lineageGroup: LINEAGE_ID,
      subject: 'Exact 180ms example in a select interaction',
      classification: 'adjacent_role_guidance',
      value: { duration: '180ms', role: 'select', comparison: '400ms' },
      sourceRefs: [
        textRef('.agents/skills/emil-design-eng/SKILL.md', 142, 142, 'A **180ms select** animation feels more responsive'),
      ],
      interpretation: 'A select value cannot be promoted to loading reveal evidence.',
      status: 'reference',
    },
    {
      id: 'OBS-EMIL10-PRESS-160',
      skill: 'emil-design-eng',
      sourceId: skillSourceId('emil-design-eng'),
      tier: 'independent_design_engineering_guidance',
      lineageGroup: LINEAGE_ID,
      subject: 'Exact 160ms example in button press feedback',
      classification: 'adjacent_role_guidance',
      value: { duration: '160ms', role: 'button_press', property: 'transform', easing: 'ease-out' },
      sourceRefs: [
        textRef('.agents/skills/emil-design-eng/SKILL.md', 205, 205, 'transition: transform 160ms ease-out;'),
      ],
      interpretation: 'Button press context only; it is not a loading reveal candidate by direct role match.',
      status: 'reference',
    },
    {
      id: 'OBS-EMIL10-ADJACENT-200',
      skill: 'emil-design-eng',
      sourceId: skillSourceId('emil-design-eng'),
      tier: 'independent_design_engineering_guidance',
      lineageGroup: LINEAGE_ID,
      subject: 'Exact 200ms examples outside the loading role',
      classification: 'adjacent_role_guidance',
      value: { duration: '200ms', contexts: ['button-content blur/opacity transition', 'clip-path overlay reveal', 'release snap-back'] },
      sourceRefs: [
        textRef('.agents/skills/emil-design-eng/SKILL.md', 308, 308, 'transition: filter 200ms ease, opacity 200ms ease;'),
        textRef('.agents/skills/emil-design-eng/SKILL.md', 415, 415, 'transition: clip-path 200ms ease-out;'),
      ],
      interpretation: '200ms is present in adjacent component recipes, not directly for async content arrival.',
      status: 'reference',
    },
    {
      id: 'OBS-EMIL10-PICKER-HIGHLIGHT-250',
      skill: 'prototype',
      sourceId: skillSourceId('prototype'),
      tier: 'independent_design_engineering_guidance',
      lineageGroup: LINEAGE_ID,
      subject: 'Exact 250ms picker highlight transition',
      classification: 'adjacent_role_guidance',
      value: { duration: '250ms', role: 'picker_highlight', properties: ['transform', 'width'], loadingReveal: false },
      sourceRefs: [
        textRef('.agents/skills/prototype/PICKER.md', 63, 67, 'transition:'),
        textRef('.agents/skills/prototype/PICKER.md', 127, 127, 'The highlight slides; the variant swap stays instant.'),
      ],
      interpretation: 'Picker spatial feedback only; the deliberate width exception and initial-load no-animation rule do not transfer to Scheduler loading reveal.',
      status: 'reference',
    },
    {
      id: 'OBS-EMIL10-TOAST-LIFETIME-4000',
      skill: 'ask-sonner',
      sourceId: skillSourceId('ask-sonner'),
      tier: 'independent_design_engineering_guidance',
      lineageGroup: LINEAGE_ID,
      subject: 'Toast auto-close lifetime',
      classification: 'not_applicable',
      value: { duration: '4000ms', role: 'toast_auto_close', animationDuration: false },
      sourceRefs: [
        textRef('.agents/skills/ask-sonner/API.md', 35, 35, 'Milliseconds before auto-close'),
      ],
      interpretation: 'A toast lifetime is not a loading-to-loaded content animation duration and is not applicable to the inline Today list.',
      status: 'reference',
    },
    {
      id: 'OBS-EMIL10-PROPERTIES',
      skill: 'improve-animations',
      sourceId: skillSourceId('improve-animations'),
      tier: 'independent_design_engineering_guidance',
      lineageGroup: LINEAGE_ID,
      subject: 'Performance property constraint',
      classification: 'general_guidance',
      value: { preferredProperties: ['transform', 'opacity'], layoutProperties: 'avoid', clipPath: 'sanctioned_exception_in_animate_recipe' },
      sourceRefs: [
        textRef('.agents/skills/improve-animations/AUDIT.md', 73, 74, 'Animate `transform` and `opacity` only'),
        textRef('.agents/skills/improve-animations/AUDIT.md', 50, 50, 'Never `scale(0)`'),
      ],
      interpretation: 'Supports a compositor-friendly constraint, but does not require both transform and opacity for every content reveal.',
      status: 'reference',
    },
    {
      id: 'OBS-EMIL10-DENSE-READING',
      skill: 'find-animation-opportunities',
      sourceId: skillSourceId('find-animation-opportunities'),
      tier: 'independent_design_engineering_guidance',
      lineageGroup: LINEAGE_ID,
      subject: 'Function gate for information-dense content',
      classification: 'general_guidance',
      value: { rule: 'data users read or act on should not move for style' },
      sourceRefs: [
        textRef('.agents/skills/find-animation-opportunities/SKILL.md', 65, 67, 'Data the user is trying to *read* or *act on* should not move for style.'),
      ],
      interpretation: 'Combined with the Scheduler context, this supports an opacity-only pilot choice as a bounded product inference, not an external loading rule.',
      status: 'reference',
    },
    {
      id: 'OBS-EMIL10-REDUCED-MOTION',
      skill: 'emil-design-eng',
      sourceId: skillSourceId('emil-design-eng'),
      tier: 'independent_design_engineering_guidance',
      lineageGroup: LINEAGE_ID,
      subject: 'Reduced-motion substitution',
      classification: 'general_guidance',
      value: { preserve: ['opacity', 'color'], remove: ['movement', 'position'], principle: 'fewer_and_gentler_not_zero' },
      sourceRefs: [
        textRef('.agents/skills/emil-design-eng/SKILL.md', 527, 529, 'Reduced motion means fewer and gentler animations, not zero.'),
      ],
      interpretation: 'Confirms the v1 audit gate; it does not override the current Softie rule because corpus installation is not adoption.',
      status: 'reference',
    },
    {
      id: 'OBS-EMIL10-NO-STAGGER',
      skill: 'find-animation-opportunities',
      sourceId: skillSourceId('find-animation-opportunities'),
      tier: 'independent_design_engineering_guidance',
      lineageGroup: LINEAGE_ID,
      subject: 'Stagger boundary for list entrances',
      classification: 'general_guidance',
      value: { delayRange: '30-80ms', decorative: true, mustNotBlockInteraction: true, loadingRevealDefault: false },
      sourceRefs: [
        textRef('.agents/skills/find-animation-opportunities/SKILL.md', 86, 88, '30–80ms stagger; decorative, must never block interaction'),
      ],
      interpretation: 'The corpus permits stagger for occasional list entrances, but this does not authorize a Scheduler Today data-list stagger.',
      status: 'reference',
    },
    {
      id: 'OBS-EMIL10-STARTING-STYLE',
      skill: 'emil-design-eng',
      sourceId: skillSourceId('emil-design-eng'),
      tier: 'independent_design_engineering_guidance',
      lineageGroup: LINEAGE_ID,
      subject: 'CSS entry mechanism for mounted content',
      classification: 'adjacent_role_guidance',
      value: { mechanism: '@starting-style', fallback: 'data-mounted attribute' },
      sourceRefs: [
        textRef('.agents/skills/emil-design-eng/SKILL.md', 319, 321, 'Animate enter states with @starting-style'),
        textRef('.agents/skills/emil-design-eng/SKILL.md', 336, 336, 'Use `@starting-style` when browser support allows'),
      ],
      interpretation: 'A technical entry mechanism is relevant to mounted loaded content, but browser support and product implementation remain unverified.',
      status: 'reference',
    },
    {
      id: 'OBS-EMIL10-SKELETON-NAME',
      skill: 'animation-vocabulary',
      sourceId: skillSourceId('animation-vocabulary'),
      tier: 'independent_design_engineering_guidance',
      lineageGroup: LINEAGE_ID,
      subject: 'Skeleton/shimmer loading vocabulary',
      classification: 'not_applicable',
      value: { term: 'Skeleton / Shimmer', loadingDuration: null, currentSchedulerUsesIt: false },
      sourceRefs: [
        textRef('.agents/skills/animation-vocabulary/SKILL.md', 151, 151, 'placeholder with a moving sheen shown while content loads'),
      ],
      interpretation: 'Names a different placeholder pattern; it does not supply a loaded-content reveal duration or authorize adding one.',
      status: 'reference',
    },
    {
      id: 'OBS-EMIL10-SONNER-LOADING',
      skill: 'ask-sonner',
      sourceId: skillSourceId('ask-sonner'),
      tier: 'independent_design_engineering_guidance',
      lineageGroup: LINEAGE_ID,
      subject: 'Toast loading-to-success state semantics',
      classification: 'not_applicable',
      value: { loadingToast: true, promiseToast: true, durationForReveal: null, role: 'toast' },
      sourceRefs: [
        textRef('.agents/skills/ask-sonner/SKILL.md', 28, 29, 'toast.promise(promise'),
      ],
      interpretation: 'The Scheduler Today surface is an inline data list, not a Sonner toast; no loading-reveal motion value is provided.',
      status: 'reference',
    },
    {
      id: 'OBS-EMIL10-CSS-TOOL',
      skill: 'pick-ui-library',
      sourceId: skillSourceId('pick-ui-library'),
      tier: 'independent_design_engineering_guidance',
      lineageGroup: LINEAGE_ID,
      subject: 'Tool selection for a simple fade',
      classification: 'general_guidance',
      value: { simpleFade: 'plain CSS transitions', motionLibrary: 'not needed' },
      sourceRefs: [
        textRef('.agents/skills/pick-ui-library/SKILL.md', 41, 41, "A simple hover or fade doesn't need it"),
      ],
      interpretation: 'Supports a no-new-dependency implementation boundary only; it supplies no duration or loading-role authority.',
      status: 'reference',
    },
    {
      id: 'OBS-EMIL10-PROTOTYPE-INSTANT-SWAP',
      skill: 'prototype',
      sourceId: skillSourceId('prototype'),
      tier: 'independent_design_engineering_guidance',
      lineageGroup: LINEAGE_ID,
      subject: 'Prototype picker variant switching',
      classification: 'not_applicable',
      value: { variantSwap: 'instant', reason: '100+ per session picker action', loadingReveal: false },
      sourceRefs: [
        textRef('.agents/skills/prototype/SKILL.md', 57, 57, 'variant swap gets no animation'),
      ],
      interpretation: 'This is picker chrome behavior, not a product loading-to-loaded recommendation.',
      status: 'reference',
    },
    {
      id: 'OBS-EMIL10-LINEAGE-DECLARATION',
      skill: 'improve-animations',
      sourceId: skillSourceId('improve-animations'),
      tier: 'independent_design_engineering_guidance',
      lineageGroup: LINEAGE_ID,
      subject: 'Corpus lineage declaration',
      classification: 'general_guidance',
      value: { authorLineage: 'Emil Kowalski', independentAuthorityGroups: 1 },
      sourceRefs: [
        textRef('.agents/skills/improve-animations/SKILL.md', 16, 16, "The bar comes from Emil Kowalski's animation philosophy"),
        textRef('.agents/skills/improve-animations/PLAN-TEMPLATE.md', 71, 71, 'Pull every value from [AUDIT.md](AUDIT.md)'),
      ],
      interpretation: 'Repeated values across these files are derivation/repetition inside one lineage, not independent quorum.',
      status: 'reference',
    },
  ]
}

function sourceReferenceLedger(corpus) {
  const skillSources = Object.keys(EXPECTED_FILES).sort().map((skill) => source(
    skillSourceId(skill),
    'independent_design_engineering_guidance',
    `Installed ${skill} skill and companions`,
    'Local upstream corpus file(s); reference guidance only, not Softie adoption',
    `.agents/skills/${skill}/`,
    { skill, lineageGroup: LINEAGE_ID, files: corpus.entries.find((entry) => entry.skill === skill).files },
  ))
  return {
    schemaVersion: 'design-reference-source-ledger-emil10-incremental-v1',
    provenanceTiers: TIER_DEFINITIONS,
    sources: [
      source('SRC-EMIL10-CORPUS-PROVENANCE', 'independent_design_engineering_guidance', 'Pinned emilkowalski/skills provenance record', 'Upstream revision and retained-file inventory; provenance only', 'THIRD_PARTY_NOTICES.md', { lineageGroup: LINEAGE_ID }),
      source('SRC-EMIL10-LOCK', 'independent_design_engineering_guidance', 'Installed Skill lock file', 'Computed hashes and source paths for the ten installed skills', 'skills-lock.json', { lineageGroup: LINEAGE_ID }),
      ...skillSources,
      source('SRC-V1-AUDIT', 'predecessor_artifact', 'Softie Design Reference Audit v1', 'Frozen predecessor claims and pilot status; not rewritten by this artifact', 'docs/design-reference-audit-v1.md'),
      source('SRC-SOFTIE-DESIGN', 'softie_house_rule', 'Softie DESIGN.md', 'Repository source of truth; unchanged in this work unit', 'DESIGN.md'),
      source('SRC-SOFTIE-SCHEDULER-CODE', 'softie_house_rule_observed_code', 'Scheduler Today and motion implementation', 'Observed product code; not automatically normative', 'src/scheduler/TodaySchedulerPage.jsx'),
    ],
    repositoryInputIdentities: [...new Set(REPO_INPUTS)].map((path) => {
      const bytes = readRepoFile(path)
      return { id: path, path, byteLength: bytes.byteLength, byteSha256: sha256(bytes) }
    }),
    externalResearchBoundary: {
      upstreamRevisionTakenFrom: 'THIRD_PARTY_NOTICES.md:60-86 and skills-lock.json:1-64',
      noNetworkRefreshDuringMaterialization: true,
      installedCorpusOnly: true,
      skillInstallationIsNotSoftieAdoption: true,
      originalSourceRightsDecision: 'not_reopened; no source asset reuse is involved',
    },
  }
}

function provenanceLineage(observations, corpus) {
  const members = corpus.entries.flatMap((entry) => [
    skillSourceId(entry.skill),
    ...observations.filter((observation) => observation.skill === entry.skill).map((observation) => observation.id),
  ])
  const durationIds = observations.filter((observation) => ['OBS-EMIL10-DURATION-ROLE-RANGES', 'OBS-EMIL10-SELECT-180', 'OBS-EMIL10-PRESS-160', 'OBS-EMIL10-ADJACENT-200'].includes(observation.id)).map((observation) => observation.id)
  return {
    schemaVersion: 'design-reference-provenance-lineage-emil10-incremental-v1',
    lineageGroups: [{
      id: LINEAGE_ID,
      sourceRepository: CORPUS_REPOSITORY,
      sourceRef: corpus.sourceRef,
      sourceRevision: corpus.sourceRevision,
      members,
      independentAuthorityCount: 1,
      independenceBoundary: 'All ten installed skills and companions are one upstream repository revision and one author lineage; repeated prose or values are not independent votes.',
    }],
    crossSkillRelations: [
      {
        id: 'XREL-EMIL10-001',
        skills: ['animate', 'emil-design-eng', 'improve-animations', 'review-animations'],
        relation: 'same_lineage_role_range_and_property_repetition',
        independent: false,
        evidenceIds: ['OBS-EMIL10-DURATION-ROLE-RANGES', 'OBS-EMIL10-PROPERTIES'],
        note: 'The existing three Skill files and the new audit files repeat or derive the same Emil role ranges and transform/opacity rules; they are not four authorities.',
      },
      {
        id: 'XREL-EMIL10-002',
        skills: ['animate', 'apple-design', 'emil-design-eng', 'review-animations'],
        relation: 'same_lineage_reduced_motion_overlap',
        independent: false,
        evidenceIds: ['OBS-EMIL10-REDUCED-MOTION'],
        note: 'Reduced-motion direction overlaps across the installed corpus, but repetition does not create an independent Emil quorum or Softie adoption.',
      },
      {
        id: 'XREL-EMIL10-003',
        skills: ['animate', 'prototype', 'review-animations'],
        relation: 'role_specific_recipe_boundary',
        independent: false,
        evidenceIds: ['OBS-EMIL10-PICKER-HIGHLIGHT-250', 'OBS-EMIL10-NO-STAGGER'],
        note: 'Picker and recipe values remain role-scoped; the existing Skill recipes reinforce, rather than independently authorize, the loading boundary.',
      },
    ],
    rules: [
      { id: 'LIN-EMIL10-001', from: durationIds, relation: 'same_lineage_repetition_or_derivation', independent: false, to: ['loading_reveal_duration_preference'], note: 'Role ranges and exact values remain role-scoped; they do not form independent loading evidence.' },
      { id: 'LIN-EMIL10-002', from: observations.filter((observation) => observation.classification === 'direct_role_match').map((observation) => observation.id), relation: 'same_lineage_role_match', independent: false, to: ['loading_reveal_type'], note: 'The type/intent evidence is coherent within one corpus, not an independent multi-source consensus.' },
      { id: 'LIN-EMIL10-003', from: ['OBS-EMIL10-REDUCED-MOTION', 'OBS-EMIL10-PROPERTIES', 'OBS-EMIL10-NO-STAGGER'], relation: 'same_lineage_constraint_cluster', independent: false, to: ['loading_reveal_pilot_constraints'], note: 'Accessibility, property, and stagger guidance is one lineage cluster.' },
    ],
    nonRules: [
      'A skill installation does not change DESIGN.md or adopt any external value as a Softie rule.',
      'Numeric repetition across Emil files is relation/derivation, not independent authority.',
      'A button, tooltip, dropdown, modal, toast, picker, or scroll-reveal value is not promoted to loading reveal without a role match.',
    ],
  }
}

function claimRelations() {
  return {
    schemaVersion: 'design-reference-claim-relations-emil10-incremental-v1',
    predecessor: {
      artifactId: 'design-reference-audit-v1',
      document: 'docs/design-reference-audit-v1.md',
      artifact: 'artifacts/design-reference-audit-v1/complete.json',
      preserved: true,
    },
    relations: [
      {
        id: 'REL-EMIL10-001',
        type: 'confirm',
        target: { v1MatrixId: 'MAT-03', v1PilotId: 'PILOT-01', area: 'async_loading_loaded_reveal' },
        newEvidenceIds: ['OBS-EMIL10-TELEPORTING-STATE', 'OBS-EMIL10-VOCAB-ENTER-EXIT'],
        independentLineageGroups: [LINEAGE_ID],
        independentEvidenceCount: 1,
        effect: 'The pilot seam is confirmed as a conditional content-enter/prevent-jarring-change opportunity; candidate status remains candidate_for_pilot.',
      },
      {
        id: 'REL-EMIL10-002',
        type: 'amend',
        target: { v1MatrixId: 'MAT-03', v1PilotId: 'PILOT-01', area: 'async_loading_loaded_reveal' },
        newEvidenceIds: ['OBS-EMIL10-TELEPORTING-STATE', 'OBS-EMIL10-STARTING-STYLE', 'OBS-EMIL10-DENSE-READING'],
        independentLineageGroups: [LINEAGE_ID],
        independentEvidenceCount: 1,
        effect: 'Name the motion precisely as state-triggered content enter after async fetch; scroll reveal, page transition, skeleton/shimmer, and generic crossfade are not automatic classifications.',
      },
      {
        id: 'REL-EMIL10-003',
        type: 'amend',
        target: { v1MatrixId: 'MAT-11', area: 'duration_easing_roles' },
        newEvidenceIds: ['OBS-EMIL10-DURATION-ROLE-RANGES', 'OBS-EMIL10-SELECT-180', 'OBS-EMIL10-PRESS-160', 'OBS-EMIL10-ADJACENT-200'],
        independentLineageGroups: [LINEAGE_ID],
        independentEvidenceCount: 1,
        effect: 'The seven-Skill increment adds no loading-specific duration. 150/160/180/200ms remain adjacent-role or Softie-applied values; duration preference stays insufficient_to_prefer.',
      },
      {
        id: 'REL-EMIL10-004',
        type: 'confirm',
        target: { v1MatrixId: 'MAT-07', v1PilotId: 'PILOT-01', area: 'opacity_transform' },
        newEvidenceIds: ['OBS-EMIL10-PROPERTIES', 'OBS-EMIL10-DENSE-READING'],
        independentLineageGroups: [LINEAGE_ID],
        independentEvidenceCount: 1,
        effect: 'Transform/opacity remains the external performance boundary, while Scheduler-specific opacity-only is recorded as a contextual pilot inference; no global retrofit is authorized.',
      },
      {
        id: 'REL-EMIL10-005',
        type: 'confirm',
        target: { v1MatrixId: 'MAT-06', v1PilotId: 'PILOT-01', area: 'reduced_motion' },
        newEvidenceIds: ['OBS-EMIL10-REDUCED-MOTION'],
        independentLineageGroups: [LINEAGE_ID],
        independentEvidenceCount: 1,
        effect: 'Reduced motion should preserve status comprehension with static or opacity/color-only feedback and remove movement; the v1 audit gate remains.',
      },
      {
        id: 'REL-EMIL10-006',
        type: 'confirm',
        target: { v1MatrixId: 'MAT-03', v1PilotId: 'PILOT-01', area: 'async_loading_loaded_reveal' },
        newEvidenceIds: ['OBS-EMIL10-NO-STAGGER', 'OBS-EMIL10-DENSE-READING'],
        independentLineageGroups: [LINEAGE_ID],
        independentEvidenceCount: 1,
        effect: 'No stagger and no stale-refetch animation remain correct for the dense operational Today list.',
      },
      {
        id: 'REL-EMIL10-007',
        type: 'amend',
        target: { v1ObservationId: 'OBS-SOFTIE-DURATION-FAST', v1MatrixId: 'MAT-02', area: '180ms_status' },
        newEvidenceIds: ['OBS-EMIL10-SELECT-180'],
        independentLineageGroups: [LINEAGE_ID],
        independentEvidenceCount: 1,
        effect: '180ms remains a T4 Softie house/applied code value. The new select example is adjacent only. Current main contains no evidence that Scheduler route 180ms passed a physical-device feel validation; that claim remains unverified. Loading reveal has separate validation status.',
      },
      {
        id: 'REL-EMIL10-008',
        type: 'confirm',
        target: { v1MatrixId: 'MAT-08', area: 'progress_loading_indicators' },
        newEvidenceIds: ['OBS-EMIL10-SKELETON-NAME', 'OBS-EMIL10-SONNER-LOADING'],
        independentLineageGroups: [LINEAGE_ID],
        independentEvidenceCount: 1,
        effect: 'No new spinner, shimmer, toast, or loading-indicator contract is admitted for Scheduler Today.',
      },
      {
        id: 'REL-EMIL10-009',
        type: 'amend',
        target: { v1MatrixId: 'MAT-03', v1PilotId: 'PILOT-01', area: 'loading_text_visibility' },
        newEvidenceIds: ['OBS-EMIL10-TELEPORTING-STATE'],
        supportingCodeObservationIds: ['CODE-LOAD-002'],
        independentLineageGroups: [LINEAGE_ID],
        independentEvidenceCount: 1,
        effect: 'Correct the v1 wording: hideEmptyText suppresses post-load empty labels, but the SchedulerEventSection condition explicitly still renders the loading text for the first two sections. No content-entry reveal exists yet.',
      },
    ],
    summary: { confirmCount: 5, amendCount: 4, supersedeCount: 0, supersededClaims: [] },
  }
}

function durationEasingMatrix() {
  return {
    schemaVersion: 'design-reference-duration-easing-candidate-matrix-emil10-v1',
    targetRole: 'state-triggered loaded-content enter after async fetch',
    directLoadingDurationEvidence: false,
    recommendationClass: 'insufficient_to_prefer',
    decisionClasses: {
      directly_supported: { values: [], status: 'none', reason: 'No Skill assigns a duration to async loaded-content entry.' },
      range_supported_candidate: { values: ['under-300ms'], status: 'broad_only', evidenceIds: ['OBS-EMIL10-DURATION-ROLE-RANGES'], reason: 'General UI budget only; it does not select a point value or loading role.' },
      softie_empirical_candidate: { values: ['180ms'], status: 'applied_baseline_device_pass_unverified', evidenceIds: ['OBS-SOFTIE-DURATION-FAST', 'OBS-EMIL10-SELECT-180'], reason: 'Existing Softie/applied value and adjacent select example; no current-main physical-device pass evidence.' },
      insufficient_to_prefer: { selected: true, reason: 'Role mismatch or missing loading-specific validation prevents preferring a number.' },
    },
    rows: [
      {
        candidate: '150ms',
        provenance: 'T3',
        supportClass: 'adjacent_role_guidance',
        observedRole: 'dropdown/select range lower bound (150-250ms)',
        directRoleMatch: false,
        exactStandaloneValue: false,
        evidenceIds: ['OBS-EMIL10-DURATION-ROLE-RANGES'],
        disposition: 'not_preferred_for_loading',
        reason: 'A range endpoint for dropdown/select is not a loading-reveal recommendation.',
      },
      {
        candidate: '160ms',
        provenance: 'T3',
        supportClass: 'adjacent_role_guidance',
        observedRole: 'button press feedback',
        directRoleMatch: false,
        exactStandaloneValue: true,
        evidenceIds: ['OBS-EMIL10-PRESS-160'],
        disposition: 'not_preferred_for_loading',
        reason: 'Exact value, wrong interaction role.',
      },
      {
        candidate: '180ms',
        provenance: 'T4_plus_T3_adjacent',
        supportClass: 'softie_empirical_candidate',
        observedRole: 'Softie duration-fast and Scheduler route application; adjacent corpus select example',
        directRoleMatch: false,
        exactStandaloneValue: true,
        evidenceIds: ['OBS-EMIL10-SELECT-180'],
        disposition: 'bounded_pilot_candidate_only',
        reason: 'Existing applied baseline, but no loading-specific validation and no current-main evidence of physical-device pass.',
      },
      {
        candidate: '200ms',
        provenance: 'T3',
        supportClass: 'adjacent_role_guidance',
        observedRole: 'button-content/crossfade or clip-path/release recipe',
        directRoleMatch: false,
        exactStandaloneValue: true,
        evidenceIds: ['OBS-EMIL10-ADJACENT-200'],
        disposition: 'bounded_pilot_candidate_only',
        reason: 'Existing exact corpus value in adjacent roles; it is not a loading-specific preference.',
      },
      {
        candidate: '250ms',
        provenance: 'T3',
        supportClass: 'adjacent_role_guidance',
        observedRole: 'prototype picker highlight spatial feedback',
        directRoleMatch: false,
        exactStandaloneValue: true,
        evidenceIds: ['OBS-EMIL10-PICKER-HIGHLIGHT-250'],
        disposition: 'not_applicable_for_loading',
        reason: 'Picker chrome feedback with an explicit width exception; not loaded-content entry.',
      },
      {
        candidate: '4000ms',
        provenance: 'T3',
        supportClass: 'not_applicable',
        observedRole: 'Sonner toast auto-close lifetime',
        directRoleMatch: false,
        exactStandaloneValue: true,
        evidenceIds: ['OBS-EMIL10-TOAST-LIFETIME-4000'],
        disposition: 'not_applicable_for_loading',
        reason: 'Lifecycle duration for a toast, not an animation duration.',
      },
    ],
    pilotCandidates: [
      {
        duration: '180ms',
        class: 'softie_empirical_candidate',
        roleStatus: 'loading_reveal_separate_validation_required',
        whyIncluded: 'Preserves the currently applied Softie baseline as the control condition.',
      },
      {
        duration: '200ms',
        class: 'adjacent_role_guidance',
        roleStatus: 'loading_reveal_separate_validation_required',
        whyIncluded: 'Provides one existing exact adjacent-role value without inventing a number.',
      },
    ],
    fixedVariablesForPilot: {
      normalEasing: 'cubic-bezier(0.23, 1, 0.32, 1)',
      properties: ['opacity'],
      transform: 'none_for_the_Scheduler_Today_pilot_due_to_dense_reading_context',
      stagger: 'none',
      layoutProperties: 'none',
      reducedMotion: 'static_or_opacity_color_only_equivalent',
      refetches: 'no_animation',
    },
    warning: 'The pair is a controlled comparison proposal, not evidence that either duration is directly supported for loading reveal. If no feel test is authorized, do not select either value.',
  }
}

function schedulerApplicability() {
  return {
    schemaVersion: 'design-reference-scheduler-loading-applicability-emil10-v1',
    surface: 'Scheduler Today event list',
    codeObservations: [
      {
        id: 'CODE-LOAD-001',
        claim: 'Initial fetch is real and stateful',
        sourceRefs: [
          textRef('src/scheduler/TodaySchedulerPage.jsx', 265, 281, 'setIsLoading(true)'),
          textRef('src/scheduler/TodaySchedulerPage.jsx', 295, 297, 'loadEvents()'),
        ],
        observed: 'loadEvents sets isLoading, awaits listTodayWorkEvents, then commits events and clears loading for the latest request.',
      },
      {
        id: 'CODE-LOAD-002',
        claim: 'Loading and post-load empty labels use separate conditional behavior',
        sourceRefs: [
          textRef('src/scheduler/TodaySchedulerPage.jsx', 914, 938, 'emptyText={isLoading ? \'불러오는 중...\' : \'없음\'}'),
          textRef('src/scheduler/SchedulerEventSection.jsx', 36, 39, 'normalizedEmptyText === \'불러오는 중...\' || !hideEmptyText'),
        ],
        observed: 'The first two sections pass hideEmptyText, which suppresses their post-load empty labels; while loading, SchedulerEventSection explicitly renders 불러오는 중... regardless of hideEmptyText. The Today 전체 section also renders the loading message and then an empty message.',
      },
      {
        id: 'CODE-LOAD-003',
        claim: 'Refetch retains old events',
        sourceRefs: [
          textRef('src/scheduler/TodaySchedulerPage.jsx', 268, 273, 'setEvents(rows)'),
        ],
        observed: 'The request starts loading without clearing events; non-empty sections therefore keep rendering old cards while refetch is pending.',
      },
      {
        id: 'CODE-LOAD-004',
        claim: 'No content-entry motion contract exists',
        sourceRefs: [
          textRef('src/scheduler/SchedulerEventSection.jsx', 40, 49, '<div className="scheduler-event-list">'),
          textRef('src/scheduler/SchedulerEventCard.jsx', 26, 28, '<article className={cardClassName} aria-busy={isSaving}>'),
        ],
        observed: 'Loaded cards are conditionally rendered with no admitted entry/reveal state in the inspected JSX.',
      },
    ],
    opportunityGate: {
      frequency: 'initial Today fetch or date change, not a 100-plus-times-per-day keyboard action',
      purpose: ['state_indication', 'preventing_a_jarring_change'],
      function: 'Eligible only for a minimal cue/reveal because the list is dense operational data users read and act on.',
      speed: 'Under-300ms corpus budget is broad guidance; no loading-specific duration exists.',
      passesOpportunityCondition: true,
      passBoundary: 'The opportunity is the first empty-state successful fetch only; stale refetches remain excluded.',
      implementationPrecondition: 'The current code has no firstFetch/hasLoaded flag; any future pilot must add or otherwise prove this scope without animating stale refetches.',
    },
    runtimeLimitations: [
      'Static source inspection only; no browser animation feel check was run in this artifact work.',
      'No physical-device validation evidence exists in the current main worktree for the route 180ms value.',
      'Actual empty/loading semantics and layout stability must be checked before implementation.',
    ],
  }
}

function loadingRevealRecommendation() {
  return {
    schemaVersion: 'design-reference-loading-reveal-recommendation-emil10-v1',
    status: 'candidate_for_pilot',
    recommendationClass: 'insufficient_to_prefer',
    type: {
      canonical: 'state_triggered_content_enter_after_async_fetch',
      directRoleEvidence: 'teleporting_state_conditional_content_swap',
      vocabulary: [
        { term: 'Enter / Exit', classification: 'direct_role_match', use: 'primary name for loaded content being mounted' },
        { term: 'Fade in / Fade out', classification: 'adjacent_role_guidance', use: 'safest visual mechanism for a dense list pilot' },
        { term: 'Crossfade', classification: 'adjacent_role_guidance', use: 'only if loading and loaded states visibly overlap in the same spot' },
        { term: 'Reveal', classification: 'adjacent_role_guidance', use: 'only when a clip-path or mask actually uncovers content' },
        { term: 'Scroll reveal', classification: 'not_applicable', use: 'no scroll trigger in the Today fetch' },
        { term: 'Page transition / View transition', classification: 'not_applicable', use: 'not route navigation' },
        { term: 'Skeleton / Shimmer', classification: 'not_applicable', use: 'not the current textual loading contract and no new placeholder is admitted' },
      ],
    },
    purpose: ['state_indication', 'preventing_a_jarring_change'],
    duration: {
      directLoadingValue: false,
      decisionClasses: {
        directly_supported: [],
        range_supported_candidate: ['under-300ms'],
        softie_empirical_candidate: ['180ms'],
        insufficient_to_prefer: true,
      },
      observedCandidates: ['150ms', '160ms', '180ms', '200ms', '250ms', '4000ms_toast_lifetime'],
      decision: 'insufficient_to_prefer',
      matrix: 'artifacts/design-reference-audit-v1-emil10-incremental/duration-easing-candidate-matrix.json',
      pilotPair: ['180ms', '200ms'],
      pilotPairBoundary: 'At most two controlled comparison candidates; neither is externally direct-supported for loading reveal.',
    },
    easing: {
      normal: 'cubic-bezier(0.23, 1, 0.32, 1)',
      role: 'ease-out_for_entering_content',
      status: 'direct_role_match_for_easing_not_for_duration',
      doNotInherit: 'Softie 180ms ease as a loading-specific external recommendation',
    },
    properties: {
      corpusBoundary: ['transform', 'opacity'],
      schedulerPilot: ['opacity'],
      transformDecision: 'avoid_for_this_dense_reading_surface as a contextual inference; corpus does not ban transform for all normal loading entrances',
      layoutProperties: 'do_not_animate',
      stagger: 'do_not_use',
      blur: 'only_if_an_actual_crossfade_double_exposes_and_a_feel_check shows it helps; not a default',
      implementationTool: 'plain CSS transition or @starting-style; no new motion library for a simple fade',
    },
    reducedMotion: {
      status: 'required_pilot_gate',
      normalMovement: 'remove',
      preserve: ['loading_vs_empty_state_information', 'opacity_or_color_comprehension'],
      alternative: 'static state or short opacity/color-only dissolve; no transform, stagger, or overshoot',
      adoptionBoundary: 'This does not amend DESIGN.md or claim repository-wide reduced-motion adoption.',
    },
    staleRefetchBoundary: 'No animation while old events remain visible during refetch; only the first empty-state successful fetch is in scope.',
    noImplementationInThisWorkUnit: true,
  }
}

function blockers() {
  return [
    {
      id: 'BLK-EMIL10-NO-LOADING-DURATION',
      status: 'open',
      subject: 'loading_role_duration_missing',
      detail: 'The pinned corpus provides role ranges and adjacent exact values but no duration explicitly assigned to async loaded-content entry.',
      mitigation: 'Keep recommendationClass insufficient_to_prefer; use no value as an adopted rule.',
    },
    {
      id: 'BLK-EMIL10-180-ORIGIN',
      status: 'open',
      subject: '180ms_original_selection_provenance',
      detail: 'DESIGN.md and v1 identify 180ms as a T4 Softie value, but do not identify its original selection rationale.',
      mitigation: 'Do not attribute 180ms to Apple or Emil; retain it as house/applied code evidence only.',
    },
    {
      id: 'BLK-EMIL10-ROUTE-DEVICE-EVIDENCE',
      status: 'open',
      subject: 'route_180ms_physical_device_validation',
      detail: 'The current main worktree contains route CSS and structural tests but no physical-device feel log proving that 180ms passed device validation.',
      mitigation: 'Describe route 180ms as applied/observed code, not a verified empirical pass; require device evidence before promotion.',
    },
    {
      id: 'BLK-EMIL10-LOADING-FEEL',
      status: 'open',
      subject: 'loading_reveal_runtime_feel',
      detail: 'No browser or physical-device feel check was performed for a loaded-content reveal.',
      mitigation: 'If a pilot is authorized, compare only the bounded pair with easing/properties fixed and inspect dense-list scanning.',
    },
    {
      id: 'BLK-EMIL10-REDUCED-MOTION-CONFLICT',
      status: 'open',
      subject: 'house_rule_vs_corpus_reduced_motion',
      detail: 'The corpus says reduced motion is fewer/gentler rather than zero, while DESIGN.md and current CSS often collapse durations to near-zero.',
      mitigation: 'Keep this as an adoption decision and pilot gate; do not change DESIGN.md or global CSS in this audit.',
    },
    {
      id: 'BLK-EMIL10-LINEAGE-DUPLICATION',
      status: 'resolved_by_artifact_contract',
      subject: 'same_author_lineage_double_counting',
      detail: 'All ten installed skills and companions are pinned to one emilkowalski/skills revision and are counted as one independent T3 lineage.',
      mitigation: 'Use provenance-lineage.json relations and independentEvidenceCount=1 for every corpus-derived conclusion.',
    },
  ]
}

function buildPayload() {
  const baseHead = gitText(['rev-parse', 'HEAD'])
  if (!baseHead) throw new Error('git HEAD could not be resolved')
  const corpus = corpusFileInventory()
  const observations = skillObservations()
  const payload = {
    schemaVersion: 'design-reference-audit-v1-emil10-incremental',
    verdict: VERDICT,
    auditDate: AUDIT_DATE,
    title: 'Softie Design Reference Audit v1 — Emil corpus 10/10 incremental audit',
    purpose: 'Deterministically add only the evidence, relations, candidate matrix, loading recommendation, and blockers introduced by the pinned Emil corpus without rewriting v1.',
    scope: {
      repositoryOnly: true,
      artifactOnly: true,
      uiMutation: false,
      cssMutation: false,
      applicationBehaviorMutation: false,
      designMdMutation: false,
      v1Mutation: false,
      skillSourceMutation: false,
      externalAcquisition: false,
      stagingCommitPush: false,
      deployOrRemoteDbMutation: false,
    },
    repository: {
      branch: gitText(['branch', '--show-current']),
      baseHead,
      originMainHead: gitText(['rev-parse', 'origin/main']),
      sourceOfTruth: 'current_local_worktree',
      preExistingChangeBoundary: 'The pre-existing untracked -.jpg is outside this artifact input scope and is preserved.',
      productCodeChangeAssertion: 'No UI/CSS/application behavior/DESIGN.md source change is part of this artifact.',
    },
    authorityTiers: TIER_DEFINITIONS,
    upstreamCorpus: corpus,
    sourceReferenceLedger: sourceReferenceLedger(corpus),
    newSkillObservationLedger: { schemaVersion: 'design-reference-new-skill-observation-ledger-emil10-v1', observations },
    provenanceLineage: provenanceLineage(observations, corpus),
    claimRelations: claimRelations(),
    durationEasingCandidateMatrix: durationEasingMatrix(),
    loadingRevealRecommendation: loadingRevealRecommendation(),
    schedulerApplicability: schedulerApplicability(),
    blockers: blockers(),
    documentContract: {
      path: 'docs/design-reference-audit-v1-emil10-incremental.md',
      derivedFrom: ['upstreamCorpus', 'sourceReferenceLedger', 'newSkillObservationLedger', 'provenanceLineage', 'claimRelations', 'durationEasingCandidateMatrix', 'loadingRevealRecommendation', 'schedulerApplicability', 'blockers'],
      deterministic: true,
      sourceOfTruth: 'complete.json',
      predecessorPreserved: 'docs/design-reference-audit-v1.md and artifacts/design-reference-audit-v1/*',
    },
    validationContract: {
      sourceRefs: 'Every quoted Skill observation is checked against the exact installed file lines.',
      lockProvenance: 'Every lock computedHash is recomputed from the actual installed companion-file bytes.',
      lineage: 'All Emil corpus observations count as one independent upstream lineage.',
      companionIntegrity: 'complete.json.integrity.json hashes complete.json and every companion independently.',
      repeatMaterialization: 'Canonical UTF-8 JSON and companion files are byte-identical on repeat materialization.',
      noProductChange: 'The checker confirms protected source inputs and this artifact does not authorize source mutation.',
      buildTestBoundary: 'Build/npm test are not required for artifact-only source work; focused checker/test and git diff --check are required.',
    },
  }
  const uniqueInputs = [...new Set(REPO_INPUTS)]
  const inputBytesByPath = Object.fromEntries(uniqueInputs.map((path) => [path, readRepoFile(path)]))
  const identity = buildArtifactIdentity({
    root: ROOT,
    artifactId: ARTIFACT_ID,
    materializerPath: 'scripts/materialize-design-reference-audit-v1-emil10-incremental.mjs',
    materializerVersion: MATERIALIZER_VERSION,
    baseHead,
    inputs: uniqueInputs,
    inputBytesByPath,
  })
  return attachArtifactIdentity(payload, identity)
}

function markdownFromArtifact(artifact) {
  const observations = artifact.newSkillObservationLedger.observations
  const matrix = artifact.durationEasingCandidateMatrix
  const recommendation = artifact.loadingRevealRecommendation
  const relationSummary = artifact.claimRelations.summary
  const lines = [
    '# Softie Design Reference Audit v1 — Emil corpus 10/10 incremental audit',
    '',
    `- Verdict: \`${artifact.verdict}\``,
    `- Audit date: ${artifact.auditDate}`,
    '- Scope: deterministic incremental evidence artifact only. No UI/CSS/application behavior/DESIGN.md/v1/source-Skill change was made.',
    '',
    '## Authority and provenance boundary',
    '',
    '| Tier | Meaning | Decision boundary |',
    '| --- | --- | --- |',
    '| T1 | Apple official artifact | Preserved from v1; not re-opened by this increment |',
    '| T2 | Apple-derived guidance | Preserved from v1; not treated as Apple primary |',
    '| T3 | Independent design-engineering guidance | Emil corpus; one author/repository/revision lineage, not ten independent authorities |',
    '| T4 | Softie house rule | DESIGN.md/code; installation does not change it |',
    '| T5 | Proposed candidate | Pilot hypothesis only |',
    '',
    `- Upstream repository: \`${artifact.upstreamCorpus.repository}\``,
    `- Upstream ref/revision: \`${artifact.upstreamCorpus.sourceRef}\` / \`${artifact.upstreamCorpus.sourceRevision}\``,
    `- Installed corpus: ${artifact.upstreamCorpus.entries.length}/10 skills; every lock hash recomputed from local bytes: **${artifact.upstreamCorpus.entries.every((entry) => entry.lockHashMatchesLocalBytes) ? 'pass' : 'fail'}**`,
    `- Lineage: \`${artifact.provenanceLineage.lineageGroups[0].id}\`; independent authority count: **1**`,
    '',
    'The pinned revision and companion-file inventory come from `THIRD_PARTY_NOTICES.md`; `skills-lock.json` is verified against the actual installed files. Skill installation is not Softie house-rule adoption.',
    '',
    '## Investigated new seven Skills',
    '',
    '| Skill | Relatedness to loading reveal | Incremental result |',
    '| --- | --- | --- |',
    '| `animation-vocabulary` | Adjacent naming | Names Enter/Exit, Fade, Crossfade, Reveal, Skeleton/Shimmer; no duration or product prescription |',
    '| `ask-sonner` | Not applicable to Scheduler inline list | Loading-to-success toast semantics only; no loading-reveal duration |',
    '| `emil-design-eng` | Direct for enter easing; adjacent for duration/property recipes | `ease-out`, custom curve, role ranges, reduced-motion and property guidance; no loading-specific number |',
    '| `find-animation-opportunities` | Direct opportunity match | Conditional content swap/teleporting-state seam; gate requires purpose, restraint, and no decorative motion in data being read |',
    '| `improve-animations` | General audit framework | Repeats the same role ranges/property/reduced-motion rules and explicitly derives from Emil philosophy; no independent authority |',
    '| `pick-ui-library` | General tool choice | Simple fade uses plain CSS; no need for a motion library and no duration evidence |',
    '| `prototype` | Not applicable to product loading | Picker variant swap is instant; prototype chrome does not prescribe Scheduler loading |',
    '',
    `Observation count: **${observations.length}**. Exact quoted values are retained in \`new-skill-observation-ledger.json\` with path/line references and role classifications.`,
    '',
    '## Loading → loaded classification',
    '',
    `- Canonical type: \`${recommendation.type.canonical}\`` ,
    '- Primary corpus match: `teleporting state` / conditional content swap. The purpose is `state_indication` plus `preventing_a_jarring_change`.',
    '- `Enter / Exit` is the primary vocabulary. `Fade in / Fade out` is the safest visual mechanism for this dense list pilot.',
    '- `Crossfade` is conditional on actual overlap; `Reveal` is only accurate if a clip-path/mask is used. `Scroll reveal`, `Page transition`, `View transition`, and `Skeleton/Shimmer` are not automatic matches.',
    '- Current Scheduler code meets the opportunity seam: first fetch mounts list content after a loading/empty conditional state, while refetch keeps old events. Therefore the pilot remains first empty-state success only.',
    '',
    '## Scheduler applicability and v1 correction',
    '',
    '- `loadEvents()` sets loading, awaits the Today query, commits rows, and clears loading for the latest request; a refetch does not clear the old events first.',
    '- v1 wording requires an amend: `hideEmptyText` suppresses the first two sections’ post-load empty labels, but `SchedulerEventSection` explicitly renders `불러오는 중...` while loading regardless of that flag.',
    '- The current code has no `firstFetch`/`hasLoaded` distinction and no content-entry reveal. A future pilot must prove the first empty-state success boundary without animating stale refetches.',
    '- The list is operational data users read and act on, so an opacity-only minimal cue is a contextual pilot inference; it is not a corpus-wide transform prohibition.',
    '',
    '## Duration / easing evidence',
    '',
    '| Candidate | Corpus role | Direct loading support | Disposition |',
    '| --- | --- | --- | --- |',
    ...matrix.rows.map((row) => `| ${row.candidate} | ${row.observedRole} | **${row.directRoleMatch ? 'yes' : 'no'}** | ${row.disposition} |`),
    '',
    `Final duration decision: **${matrix.recommendationClass}**. No observed value is directly assigned to async loaded-content entry in the corpus; the ` + '`4000ms`' + ` value is a toast lifetime, not an animation duration.`,
    '- `directly_supported`: none. `range_supported_candidate`: the broad `under-300ms` UI budget only. `softie_empirical_candidate`: `180ms` as an applied baseline with device-pass evidence still unverified. Final selection: `insufficient_to_prefer`.',
    '- `180ms` is retained as the existing T4 Softie/applied baseline and may be the control condition only.',
    '- `200ms` is an existing exact adjacent-role value and may be the one bounded comparison condition only.',
    '- These two values are not a preference claim. If no feel pilot is authorized, select neither.',
    '',
    '### Fixed pilot variables if a comparison is later authorized',
    '',
    `- Easing: \`${recommendation.easing.normal}\` (` + '`ease-out`' + ` for entering content).`,
    '- Property: opacity only for the Scheduler Today pilot, because the list is dense data users read and act on. This is a bounded product inference; the corpus general rule permits transform plus opacity and does not universally ban transform.',
    '- Transform: avoid in this pilot; no layout properties; no stagger; no refetch animation.',
    '- Reduced motion: static state or short opacity/color-only equivalent; preserve loading versus empty information and remove movement/overshoot.',
    '- Tool: plain CSS transition or `@starting-style`; no new animation dependency.',
    '',
    '## 180ms status reclassification',
    '',
    '- **Confirmed:** `180ms` is a T4 Softie house value from `DESIGN.md`/code; its original selection provenance is not recorded.',
    '- **Confirmed as code fact:** Scheduler route View Transition CSS currently applies the shared `180ms` token with the existing custom curve.',
    '- **Not evidenced in current main:** a physical-device feel validation pass for that route value. Structural tests and code presence are not device evidence.',
    '- **Separate loading boundary:** loading reveal has no validation at 180ms; route application cannot authorize loading usage.',
    '',
    '## v1 relations',
    '',
    `- Confirm: ${relationSummary.confirmCount} v1 conclusions, including the loading pilot status, opportunity seam, reduced-motion gate, no-stagger/refetch boundary, and no new indicator contract.`,
    `- Amend: ${relationSummary.amendCount} conclusions, clarifying the loading type, lack of loading-specific duration, and the unverified physical-device claim for route 180ms.`,
    '- Supersede: none. Design Reference Audit v1 and all source Skill files remain unchanged.',
    '',
    '## Unresolved blockers',
    '',
    ...artifact.blockers.filter((blocker) => blocker.status !== 'resolved_by_artifact_contract').map((blocker) => `- **${blocker.id} — ${blocker.subject}:** ${blocker.detail} Mitigation: ${blocker.mitigation}`),
    '',
    '## Validation contract',
    '',
    '- Materializer output is canonical UTF-8 JSON with stable key ordering and final LF.',
    '- `complete.json.integrity.json` hashes `complete.json` and every companion independently.',
    '- The focused checker verifies lock hashes, source quotes, lineage deduplication, relation boundaries, companion equality, and artifact identity.',
    '- Build/npm test are intentionally skipped for this document/artifact-only work; `git diff --check` and focused checker/test are the relevant checks.',
    '- Staging, commit, push, deploy, and remote DB changes are outside scope.',
    '',
  ]
  return lines.join('\n')
}

function filesForArtifact(artifact) {
  return {
    'complete.json': canonicalIdentityJson(artifact),
    'source-reference-ledger.json': canonicalIdentityJson(artifact.sourceReferenceLedger),
    'new-skill-observation-ledger.json': canonicalIdentityJson(artifact.newSkillObservationLedger),
    'provenance-lineage.json': canonicalIdentityJson(artifact.provenanceLineage),
    'claim-relations.json': canonicalIdentityJson(artifact.claimRelations),
    'duration-easing-candidate-matrix.json': canonicalIdentityJson(artifact.durationEasingCandidateMatrix),
    'loading-reveal-recommendation.json': canonicalIdentityJson(artifact.loadingRevealRecommendation),
    'scheduler-applicability.json': canonicalIdentityJson(artifact.schedulerApplicability),
    'blockers.json': canonicalIdentityJson(artifact.blockers),
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

export function buildAuditPayload() {
  return buildPayload()
}

export async function materialize(outputDirectory = DEFAULT_OUTPUT_DIR) {
  const artifact = buildPayload()
  const files = filesForArtifact(artifact)
  const integrity = canonicalIdentityJson(integrityForFiles(files))
  mkdirSync(outputDirectory, { recursive: true })
  for (const [name, content] of Object.entries(files)) writeFileSync(join(outputDirectory, name), content)
  writeFileSync(join(outputDirectory, 'complete.json.integrity.json'), integrity)
  if (resolve(outputDirectory) === resolve(DEFAULT_OUTPUT_DIR)) {
    const documentPath = join(ROOT, 'docs', 'design-reference-audit-v1-emil10-incremental.md')
    mkdirSync(dirname(documentPath), { recursive: true })
    writeFileSync(documentPath, markdownFromArtifact(artifact))
  }
  return { artifact, files, integrity }
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(new URL(import.meta.url).pathname)) {
  const outputDirectory = process.argv[2] ? resolve(process.argv[2]) : DEFAULT_OUTPUT_DIR
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

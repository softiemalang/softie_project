import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, relative, resolve } from 'node:path'

import {
  attachArtifactIdentity,
  buildArtifactIdentity,
} from '../src/artifactIdentity.js'
import {
  SAJU_SOURCE_DERIVED_ASSET_PATH,
} from '../src/interpretationPrep/sajuSourceDerivedEvidenceAsset.js'

export const SCHEMA = 'ziwei-p0-evidence-acquisition-field-kit-v1'
export const VERDICT = 'complete_ziwei_p0_evidence_acquisition_field_kit_uncommitted'
export const MATERIALIZER_VERSION = '1.0.0'
export const ARTIFACT_DIR = `artifacts/${SCHEMA}`
export const ARTIFACT_PATH = `${ARTIFACT_DIR}/complete.json`
export const ROOT = resolve(new URL('..', import.meta.url).pathname)

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const stable = value => Array.isArray(value)
  ? value.map(stable)
  : value && typeof value === 'object'
    ? Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])]))
    : value
export const canonicalJson = value => `${JSON.stringify(stable(value), null, 2)}\n`

const git = (root, args) => execFileSync(
  'git',
  ['-c', 'core.fsmonitor=false', ...args],
  { cwd: root, encoding: 'utf8' },
).trim()

const readJson = (root, path) => JSON.parse(readFileSync(resolve(root, path), 'utf8'))
const fileSha256 = (root, path) => sha256(readFileSync(resolve(root, path)))
const asArray = value => Array.isArray(value) ? value : []
const unique = values => [...new Set(values)]

const INPUT_PATHS = [
  'artifacts/ziwei-p0-claim-source-identity-frontier-v1/complete.json',
  'artifacts/ziwei-p0-toyo-1646-extended-observation-v0/complete.json',
  'artifacts/ziwei-p0-local-frontier-reconciliation-v1/complete.json',
  'artifacts/ziwei-palace-source-acquisition-field-kit-v0/complete.json',
  'artifacts/ziwei-palace-coordinate-semantic-identity-v0/complete.json',
  'artifacts/ziwei-p0-palace-semantic-witness-acquisition-route-v1/complete.json',
  'artifacts/ziwei-nara-iiif-leafmap-semantic-witness-v1/complete.json',
  'artifacts/ziwei-tianfu-convention-provenance-v0/complete.json',
  'artifacts/ziwei-tianfu-representation-search-v1/complete.json',
  'artifacts/ziwei-twelve-major-star-placement-evidence-v0/complete.json',
  'artifacts/ziwei-major-star-source-corpus-provenance-v0/complete.json',
  'artifacts/ziwei-auxiliary-star-placement-core-evidence-v0/complete.json',
  'artifacts/ziwei-auxiliary-star-placement-core-evidence-v0/comparison.json',
  'artifacts/ziwei-four-transformations-source-evidence-v0/complete.json',
  'artifacts/ziwei-four-transformations-source-evidence-v0/comparison.json',
  'artifacts/ziwei-life-body-palace-ruler-source-evidence-v0/complete.json',
  'artifacts/ziwei-life-body-palace-ruler-source-evidence-v0/comparison.json',
  'artifacts/ziwei-fixture-reconciliation-v1/complete.json',
  'docs/ziwei-p0-claim-source-identity-frontier-v1.md',
  'docs/ziwei-p0-toyo-1646-extended-observation-v0.md',
  'docs/ziwei-p0-local-frontier-reconciliation-v1.md',
  'docs/ziwei-p0-palace-semantic-witness-acquisition-route-v1.md',
  'docs/ziwei-palace-source-acquisition-field-kit-v0.md',
  'src/artifactIdentity.js',
  SAJU_SOURCE_DERIVED_ASSET_PATH,
]

const BLOCKER_PRIORITY = Object.freeze({
  'blocker-source-identity-unresolved': 'P0',
  'blocker-palace-semantic-identity': 'P0',
  'blocker-direct-rule-absent': 'P0',
  'blocker-tianfu-raw-formula-contradiction': 'P0',
  'blocker-tianfu-rotation06-semantic-authority': 'P0',
  'blocker-auxiliary-star-source-witness': 'P1',
  'blocker-four-transform-source-witness': 'P1',
  'blocker-life-body-ruler-source-legibility': 'P1',
  'blocker-independent-external-oracle': 'P1',
  'blocker-calendar-time-source-identity': 'P1',
  'blocker-image-reuse-rights': 'P2',
})

const MAJOR_CLAIMS = [
  'claim-major-star-placement-ziwei',
  'claim-major-star-placement-tianji',
  'claim-major-star-placement-taiyang',
  'claim-major-star-placement-wugu',
  'claim-major-star-placement-tiandong',
  'claim-major-star-placement-lianzhen',
  'claim-major-star-placement-tianfu',
  'claim-major-star-placement-taiyin',
  'claim-major-star-placement-tanlang',
  'claim-major-star-placement-jumen',
  'claim-major-star-placement-tianxiang',
  'claim-major-star-placement-tianliang',
  'claim-major-star-placement-qisha',
  'claim-major-star-placement-pojun',
]
const FOUR_TRANSFORM_CLAIMS = [
  'claim-four-transformations-10x4',
  'claim-four-transform-lu',
  'claim-four-transform-quan',
  'claim-four-transform-ke',
  'claim-four-transform-ji',
]
const ALL_CLAIMS = [
  'claim-palace-name-branch-ordinal',
  'claim-ming-shen-coordinate-frame',
  'claim-12-palace-diagram-semantics',
  ...MAJOR_CLAIMS,
  'claim-tianfu-anchor-direction',
  'claim-tianfu-placement',
  'claim-tianfu-rotation06-semantic',
  'claim-auxiliary-star-placement-six-lucky',
  'claim-auxiliary-star-placement-core',
  ...FOUR_TRANSFORM_CLAIMS,
  'claim-life-body-palace-ruler',
  'claim-life-body-ruler-24-ambiguous-rows',
  'claim-ziwei-input-calendar-time',
]
const CURRENT_RELATIONS = [
  'relation-local-major-star-rule-surfaces',
  'relation-local-tianfu-rule-surfaces',
  'relation-local-auxiliary-rule-surfaces',
  'relation-local-four-transformations-nanbei-table',
  'relation-local-four-transformations-ming-partial',
  'relation-local-life-body-ruler-surfaces',
]
const ALL_BLOCKERS = Object.keys(BLOCKER_PRIORITY)

const CANDIDATE_WITNESS_CLASSES = [
  {
    id: 'distinct-physical-witness',
    use: 'preferred for palace semantic, Tianfu, and source identity gates',
    material: 'institution-identified old-book/manuscript witness with title/colophon/target leaves and actual bytes',
    independence: 'must be compared against NARA same-record pair, Nanyang derivative, Nanbei, and TOYO candidate; distinct URLs do not prove independence',
    acceptance: 'physical identity, lineage, direct visual content, and exact locators all survive review',
    rejection: 'same-record duplicate, mirror, derivative without lineage, catalog-only record',
  },
  {
    id: 'institution-supplied-native-or-rights-cleared-scan',
    use: 'alternative when a complete semantic/rule page is known but public image reuse is restricted',
    material: 'native file or holder-supplied reproduction with permission scope and byte/hash provenance',
    independence: 'rights clearance does not make a witness independent; lineage remains a separate field',
    acceptance: 'image scope, permission scope, source identity, and target page are explicit',
    rejection: 'public endpoint, catalog license, or HTTP access treated as image permission',
  },
  {
    id: 'independent-executable-oracle',
    use: 'corroboration for the same cohort after source/input identity is fixed',
    material: 'versioned implementation, ruleset, exact settings, field-level output, runner, and immutable hash',
    independence: 'must not be the production resolver or an undisclosed wrapper around the same fixtures/source',
    acceptance: 'replayable output with disclosed shared dependencies',
    rejection: 'screenshot, internal fixture, or numeric match without semantic field mapping',
  },
  {
    id: 'versioned-calendar-time-source',
    use: 'separate input-source boundary for the oracle and exact Ziwei cohort',
    material: 'versioned calendar/time data or reproducible service with leap/timezone/solar-time/子時 policy',
    independence: 'must be independent of the Ziwei production resolver and disclose shared services',
    acceptance: 'exact cohort conversion is reproducible from immutable release or hash',
    rejection: 'unversioned date result or a local conversion silently reused as authority',
  },
]

const target = (definition) => ({
  status: definition.status || 'action_required',
  ...definition,
  blockerIds: [...definition.blockerIds],
  resolvesClaimIds: [...(definition.resolvesClaimIds || [])],
  affectedClaimIds: [...(definition.affectedClaimIds || [])],
  currentRelationIds: [...(definition.currentRelationIds || [])],
  affectedRelationIds: [...(definition.affectedRelationIds || definition.currentRelationIds || [])],
  currentEvidenceRefs: [...definition.currentEvidenceRefs],
  sourceRefs: [...definition.sourceRefs],
  notDuplicateOf: [...definition.notDuplicateOf],
  search: {
    canonicalTerms: [...definition.search.canonicalTerms],
    channels: [...definition.search.channels],
    alreadyHeldNearMisses: [...definition.search.alreadyHeldNearMisses],
  },
  material: {
    minimumSet: [...definition.material.minimumSet],
    idealSet: [...definition.material.idealSet],
  },
  locator: {
    required: [...definition.locator.required],
    capture: [...definition.locator.capture],
  },
  acceptanceCriteria: [...definition.acceptanceCriteria],
  rejectionCriteria: [...definition.rejectionCriteria],
  closure: {
    automatic: false,
    ...definition.closure,
    humanReviewRequired: true,
    doesNotClose: [...definition.closure.doesNotClose],
    canCloseOnlyWhen: [...definition.closure.canCloseOnlyWhen],
  },
  licensing: { ...definition.licensing },
  verificationPlan: [...definition.verificationPlan],
})

const TARGETS = [
  target({
    id: 'acq-distinct-witness-identity-lineage',
    priority: 'P0',
    priorityRank: 2,
    title: 'source identity, physical witness, and lineage packet',
    purpose: 'Close the identity gate for a concrete candidate without turning catalog metadata into semantic authority.',
    blockerIds: ['blocker-source-identity-unresolved'],
    resolvesClaimIds: [],
    affectedClaimIds: ALL_CLAIMS,
    currentRelationIds: CURRENT_RELATIONS,
    currentEvidenceRefs: [
      'artifacts/ziwei-p0-claim-source-identity-frontier-v1/complete.json',
      'artifacts/ziwei-p0-toyo-1646-extended-observation-v0/complete.json',
      'artifacts/ziwei-p0-local-frontier-reconciliation-v1/complete.json',
      'artifacts/ziwei-p0-palace-semantic-witness-acquisition-route-v1/complete.json',
    ],
    sourceRefs: [
      'docs/ziwei-p0-claim-source-identity-frontier-v1.md',
      'docs/ziwei-p0-toyo-1646-extended-observation-v0.md',
      'docs/ziwei-p0-local-frontier-reconciliation-v1.md',
    ],
    currentGap: 'Nanbei/Nanyangtang bytes and NARA/TOYO catalog routes are held, but exact edition, colophon/date, leaf-level identity, and transmission relation are not closed.',
    material: {
      minimumSet: [
        'cover or title leaf with the raw title and attribution',
        'contents/volume or fascicle identification',
        'copyright, colophon, publication, or manuscript-identifying leaf when present',
        'every target leaf as an unedited original image/PDF plus page or folio locator',
        'institution, call number or stable item identifier, original URL or physical holding',
        'actual source bytes and SHA-256; never only a local filename',
      ],
      idealSet: [
        'institution-confirmed physical-witness description and scan provenance',
        'explicit comparison against NARA 4468520/4469314, Nanyangtang, Nanbei, and TOYO_1646',
        'written lineage statement distinguishing same-record volume pairs, derivative scans, and distinct witnesses',
      ],
    },
    locator: {
      required: ['title leaf', 'edition/colophon', 'volume/fascicle', 'target page or folio', 'line or table region'],
      capture: ['cover', 'title/attribution', 'contents', 'colophon or absence', 'target leaf full frame', 'adjacent context', 'page/folio marker'],
    },
    search: {
      canonicalTerms: ['紫微斗數全書', '新鋟希夷陳先生紫微斗數全書', 'TOYO_1646', '安天府圖', '四化速檢表', '命主', '身主'],
      channels: ['institutional catalog', 'digital archive item record', 'library physical holding', 'rights-cleared scan supplied by the holder'],
      alreadyHeldNearMisses: [
        'Nanbei 219-page local PDF: held and hash-verified, authority/lineage insufficient; do not reacquire as new evidence.',
        'Nanyangtang 528-page local PDF: held and hash-verified, same-record derivative candidate; do not count as independent.',
        'NARA 4468520 and 4469314: same catalog record volume pair; not an independent pair.',
        'TOYO_1646: distinct physical candidate with 23 reviewed cache leaves, but date/colophon/lineage/rights remain open.',
      ],
    },
    acceptanceCriteria: [
      'The institution or physical holder and item identity are independently recorded; a title string alone is insufficient.',
      'The actual witness bytes or unedited supplied capture are hash-bound, and each claim occurrence has a page/folio locator.',
      'Edition/date is stated only when directly supported by the witness or institution; an inferred date is recorded as unresolved.',
      'Lineage explicitly separates NARA same-record volumes, the Nanyang derivative, Nanbei, and TOYO; independence is not inferred from different URLs.',
      'The packet preserves raw glyphs and unresolved colophon/identity fields for later human review.',
    ],
    rejectionCriteria: [
      'catalog metadata, preview, OCR, transcription, mirror URL, or local filename without a physical-witness link',
      'NARA volume 1 and volume 2 counted as independent witnesses',
      'same text or numeric agreement used to infer edition identity or authority',
      'missing target leaf, page/folio locator, or mutable/unverifiable source bytes',
    ],
    notDuplicateOf: [
      'src-nanbei-pdf', 'src-nanyangtang-pdf', 'src-nara-4468520', 'src-nara-4469314', 'src-toyo-1646',
      'artifacts/ziwei-p0-claim-source-identity-frontier-v1/complete.json',
    ],
    closure: {
      canCloseOnlyWhen: [
        'one concrete witness passes the identity, physical-witness, byte, locator, and lineage gates',
        'the relevant semantic/rule target is also directly observed; identity alone does not close a content blocker',
      ],
      doesNotClose: ['palace semantic identity', 'Tianfu convention', 'rule completeness', 'oracle', 'calendar', 'image reuse rights'],
      futureRelationContract: 'source_identity_attachment_not_yet_created',
    },
    licensing: {
      access: 'public access, catalog access, and supplied physical copies are separate fields',
      rights: 'record image-level terms separately; do not assume catalog or endpoint terms permit repository retention',
      policyDecision: 'held material may be reviewed read-only; repository redistribution remains human review',
    },
    verificationPlan: [
      'hash actual bytes and verify page/folio locators against the visible leaf',
      'compare lineage metadata without merging same-record or derivative witnesses',
      'create an additive source-identity evidence packet; do not modify predecessor artifacts',
      'run negative checks for title-only identity, same-record independence, and invented edition/date',
    ],
    rationale: 'This is a cross-cutting P0 gate. It should be completed during the same visit as a semantic/rule target, not mistaken for a semantic result by itself.',
    licensingNote: 'Image reuse is intentionally not part of identity acceptance.',
  }),
  target({
    id: 'acq-palace-semantic-map-and-coordinate-witness',
    priority: 'P0',
    priorityRank: 1,
    title: 'complete 12-palace semantic map and coordinate frame',
    purpose: 'Resolve the missing semantic binding between palace names, branch glyphs, physical diagram slots, ordinal, and traversal direction.',
    blockerIds: ['blocker-source-identity-unresolved', 'blocker-palace-semantic-identity', 'blocker-tianfu-rotation06-semantic-authority'],
    resolvesClaimIds: ['claim-palace-name-branch-ordinal', 'claim-ming-shen-coordinate-frame', 'claim-12-palace-diagram-semantics', 'claim-tianfu-rotation06-semantic'],
    affectedClaimIds: ['claim-palace-name-branch-ordinal', 'claim-ming-shen-coordinate-frame', 'claim-12-palace-diagram-semantics', 'claim-tianfu-rotation06-semantic'],
    currentRelationIds: ['relation-local-tianfu-rule-surfaces'],
    currentEvidenceRefs: [
      'artifacts/ziwei-p0-local-frontier-reconciliation-v1/complete.json',
      'artifacts/ziwei-p0-palace-semantic-witness-acquisition-route-v1/complete.json',
      'artifacts/ziwei-nara-iiif-leafmap-semantic-witness-v1/complete.json',
      'artifacts/ziwei-palace-source-acquisition-field-kit-v0/complete.json',
    ],
    sourceRefs: [
      'docs/ziwei-p0-palace-semantic-witness-acquisition-route-v1.md',
      'docs/ziwei-palace-source-acquisition-field-kit-v0.md',
      'docs/ziwei-p0-local-frontier-reconciliation-v1.md',
    ],
    currentGap: 'The NARA concordance has 0/12 complete bindings; TOYO pages and existing diagrams show bounded surfaces but no complete admissible mapping.',
    material: {
      minimumSet: [
        'one source-identified page or adjacent page set with all 12 palace names and all 12 branch glyphs',
        'complete diagram boundary with physical slots visible',
        'the source statement, arrows, or table that names ordinal/base point and forward/reverse direction',
        'edition identity packet from acq-distinct-witness-identity-lineage',
      ],
      idealSet: [
        'palace name ↔ branch ↔ slot ↔ ordinal ↔ base direction ↔ operation subject in the same visual context',
        'a second physically distinct witness or explicit transmission relation for the semantic map',
        'a readable Tianfu coordinate label in the same frame',
      ],
    },
    locator: {
      required: ['full diagram', 'all twelve labels', 'branch ring or branch labels', 'ordinal/base point', 'direction subject', 'edition/folio'],
      capture: ['full page', 'diagram boundary', 'adjacent rule text', 'page/folio marker', 'title/identity context'],
    },
    search: {
      canonicalTerms: ['紫微斗數 十二宮 宮位 地支', '十二宮冠蓋 宮名', '命宮 身宮 十二宮 表', '定命身二宮', '命宮逆數 身宮順數', '寅起月'],
      channels: ['library scan or physical folio', 'institutional digital archive', 'catalog-linked manuscript viewer'],
      alreadyHeldNearMisses: [
        'NARA canvas 87 安天府圖 and canvas 88 table: held route, but not a complete 12-way semantic binding.',
        'Nanbei p7/p8 and Nanyang p145/p159–160: held bounded diagrams/traversal surfaces; do not request them again as new evidence.',
        'TOYO_1646 pages 0002/0009–0013/0019–0020: held visual observations without the required complete map.',
      ],
    },
    acceptanceCriteria: [
      'A human can read every palace name and branch glyph from the original image without reconstructing missing labels.',
      'The same witness states or visibly encodes which slot is the base/ordinal origin and which operation proceeds forward or reverse.',
      'The diagram’s physical orientation and all twelve cells are visible; an isolated branch ring or one chart example is insufficient.',
      'The source identity and lineage are recorded separately from the semantic observation.',
      'Any mapping to a production enum is marked as a proposed relation requiring human semantic review, not silently adopted.',
    ],
    rejectionCriteria: [
      'OCR-only, normalized redraw, cropped diagram, or chart output without source rule context',
      'partial labels, a single example, or a branch ring without palace-name/ordinal/direction binding',
      'rotation-06 numeric exact fit treated as semantic identity',
      'NARA same-record volume pair or Nanyang derivative treated as independent corroboration',
    ],
    notDuplicateOf: ['artifacts/ziwei-palace-source-acquisition-field-kit-v0/complete.json', 'artifacts/ziwei-nara-iiif-leafmap-semantic-witness-v1/complete.json', 'rotation-06'],
    closure: {
      canCloseOnlyWhen: ['all five connections are directly readable in the declared source context', 'identity/lineage and semantic review both pass'],
      doesNotClose: ['Tianfu raw formula choice unless the same witness also states its anchor/direction rule', '14-star or auxiliary completeness', 'image reuse rights'],
      futureRelationContract: 'semantic_palace_map_observation_not_yet_created',
    },
    licensing: {
      access: 'public viewer or library access proves access only',
      rights: 'image retention, crop/render reuse, and repository redistribution require separate terms',
      policyDecision: 'review page images outside Git unless rights-cleared',
    },
    verificationPlan: ['visual review by a second analyst', 'record raw glyph/layout and exact page/folio', 'compare against existing bounded observations without overwriting them', 'run negative checks for partial-map and rotation-only promotion'],
    rationale: 'Highest semantic-authority value and high fan-out: this is the first field target to prioritize, while identity capture is collected in the same visit.',
  }),
  target({
    id: 'acq-tianfu-anchor-direction-adjudicator',
    priority: 'P0',
    priorityRank: 3,
    title: 'Tianfu anchor/direction witness that distinguishes the two formulas',
    purpose: 'Adjudicate the legacy versus source-aligned Tianfu convention without using a numeric transform as a semantic decision.',
    blockerIds: ['blocker-source-identity-unresolved', 'blocker-direct-rule-absent', 'blocker-tianfu-raw-formula-contradiction', 'blocker-tianfu-rotation06-semantic-authority'],
    resolvesClaimIds: ['claim-tianfu-anchor-direction', 'claim-tianfu-placement', 'claim-major-star-placement-tianfu', 'claim-tianfu-rotation06-semantic'],
    affectedClaimIds: ['claim-tianfu-anchor-direction', 'claim-tianfu-placement', 'claim-major-star-placement-tianfu', 'claim-tianfu-rotation06-semantic'],
    currentRelationIds: ['relation-local-tianfu-rule-surfaces', 'relation-local-major-star-rule-surfaces'],
    currentEvidenceRefs: ['artifacts/ziwei-p0-local-frontier-reconciliation-v1/complete.json', 'artifacts/ziwei-tianfu-convention-provenance-v0/complete.json', 'artifacts/ziwei-tianfu-representation-search-v1/complete.json'],
    sourceRefs: ['docs/ziwei-p0-local-frontier-reconciliation-v1.md', 'docs/ziwei-p0-claim-source-identity-frontier-v1.md'],
    currentGap: 'Tianfu identity is 0/150 while rotation-06 is 150/150 as a representation relation; the source anchor, direction, and branch-token semantics do not select a convention.',
    material: {
      minimumSet: ['readable 安天府 or equivalent anchor/direction rule', 'branch-token meaning and coordinate frame', 'enough worked rows/examples to distinguish mod(4 - Z) from mod(10 - Z)', 'identity/lineage packet'],
      idealSet: ['distinct physical witness with colophon or institution-confirmed lineage', 'same page set also states palace/branch/slot semantics', 'raw rule text and diagram retained side by side'],
    },
    locator: {
      required: ['安天府 heading or rule', 'anchor branch', 'direction subject', 'formula or worked examples', 'page/folio and edition'],
      capture: ['full rule page', 'diagram/table', 'adjacent explanatory text', 'identity leaves'],
    },
    search: {
      canonicalTerms: ['安天府', '安天府圖', '天府', '紫微斗數全書'],
      channels: ['source-identified old-book scan', 'library physical folio', 'institutional archive viewer'],
      alreadyHeldNearMisses: ['Nanbei p13/printed folio 三十四 and Nanyang p148/p172 are held formula/diagram surfaces; they do not adjudicate.', 'NARA same-record pair is not an independent second witness.', 'source_aligned and legacy engine modes are comparison controls, not source evidence.'],
    },
    acceptanceCriteria: ['The rule names what the branch token denotes and which direction/anchor is applied.', 'The observed rows make the competing formulas distinguishable without reverse-engineering output.', 'The witness identity and lineage are explicit; numeric agreement is retained only as a relation.', 'A human reviewer can state exactly which semantic claim is supported and which remains open.'],
    rejectionCriteria: ['rotation-06 exact fit alone', 'formula inferred from production output or a chart with no rule subject', 'same-record NARA pair counted as independent', 'OCR or normalized formula without the image context'],
    notDuplicateOf: ['rotation-06', 'artifacts/ziwei-tianfu-convention-provenance-v0/complete.json', 'artifacts/ziwei-tianfu-representation-search-v1/complete.json'],
    closure: {
      canCloseOnlyWhen: ['a readable source rule and its semantic coordinate frame survive identity/lineage review', 'legacy/source-aligned choice is made by source semantics, not numeric fit'],
      doesNotClose: ['all 14-star rules', 'auxiliary-star rules', 'calendar/time source', 'reuse rights'],
      futureRelationContract: 'tianfu_source_rule_and_semantic_frame_not_yet_created',
    },
    licensing: { access: 'access and authority are separate', rights: 'retain source images only under explicit terms', policyDecision: 'human review required before any source image enters Git' },
    verificationPlan: ['direct visual transcription with raw glyphs', 'independent reviewer checks anchor/direction subject', 'recompute both formulas only as diagnostic comparison', 'negative-check numeric-only promotion'],
    rationale: 'High semantic value and fan-out into Tianfu, major-star placement, and rotation-06; it can be combined with the semantic-map target in one high-quality witness.',
  }),
  target({
    id: 'acq-complete-14-major-star-placement-witness',
    priority: 'P1',
    priorityRank: 6,
    title: 'complete source-identified 14-major-star placement rules',
    purpose: 'Replace bounded star-surface and numeric comparison evidence with complete input-bound source rules for the production 14-star domain.',
    blockerIds: ['blocker-source-identity-unresolved', 'blocker-direct-rule-absent'],
    resolvesClaimIds: MAJOR_CLAIMS,
    affectedClaimIds: MAJOR_CLAIMS,
    currentRelationIds: ['relation-local-major-star-rule-surfaces'],
    currentEvidenceRefs: ['artifacts/ziwei-p0-local-frontier-reconciliation-v1/complete.json', 'artifacts/ziwei-twelve-major-star-placement-evidence-v0/complete.json', 'artifacts/ziwei-major-star-source-corpus-provenance-v0/complete.json'],
    sourceRefs: ['docs/ziwei-p0-local-frontier-reconciliation-v1.md', 'docs/ziwei-p0-claim-source-identity-frontier-v1.md'],
    currentGap: '14-star surfaces and comparisons exist, but complete row-level source rule identity and semantic coordinate authority are absent.',
    material: {
      minimumSet: ['source-identified rule pages covering both 紫微系 and 天府系', 'input axes, anchor, direction, and all 14 star outputs', 'root and relative rules separated', 'page/folio and actual bytes'],
      idealSet: ['independent physical witness or explicit transmission comparison', 'worked examples covering boundary cases and Tianfu convention', 'raw rule names preserved for every star'],
    },
    locator: { required: ['rule heading', 'input/table axes', 'all 14 stars', 'coordinate frame', 'edition/page/folio'], capture: ['complete table or page set', 'adjacent prose', 'identity leaves', 'worked example'] },
    search: {
      canonicalTerms: ['紫微系', '天府系', '紫微', '天府', '安紫微', '安天府'],
      channels: ['library scan', 'catalog-linked old-book image', 'institution-supplied reproduction'],
      alreadyHeldNearMisses: ['Nanbei p11–p13 and Nanyang p148/p172 are bounded local surfaces, not a complete new witness.', 'TOYO named-star pages are locator observations only.'],
    },
    acceptanceCriteria: ['All 14 production stars have directly locatable, input-bound source rules.', 'The coordinate frame and any root/relative distinction are explicit.', 'The source is not the production resolver or a fixture derived from it.', 'The result records conflicts instead of selecting a winner during acquisition.'],
    rejectionCriteria: ['relative verse or output match without complete input rule', 'only one star series or selected rows', 'normalized aliases or inferred missing rows', 'catalog-only or OCR-only source'],
    notDuplicateOf: ['artifacts/ziwei-twelve-major-star-placement-evidence-v0/complete.json', 'artifacts/ziwei-major-star-source-corpus-provenance-v0/complete.json'],
    closure: { canCloseOnlyWhen: ['every production star rule and coordinate relation passes direct-review and identity gates'], doesNotClose: ['auxiliary stars', 'four transformations', 'readiness/activation'], futureRelationContract: 'complete_14_star_source_rule_not_yet_created' },
    licensing: { access: 'catalog/scan access recorded separately', rights: 'image reuse terms required for repository retention', policyDecision: 'source images remain external until rights review' },
    verificationPlan: ['row-by-row source observation packet', 'independent witness/lineage audit', 'negative-check missing-row fill and production-output substitution'],
    rationale: 'P1 because the semantic map and Tianfu convention are upstream; once those are resolved this target supplies broad star-rule coverage.',
  }),
  target({
    id: 'acq-complete-auxiliary-star-rule-witness',
    priority: 'P1',
    priorityRank: 8,
    title: 'complete auxiliary-star rule witness with raw-name boundaries',
    purpose: 'Resolve the incomplete auxiliary-star source surface while preserving aliases and ambiguous glyphs as separate observations.',
    blockerIds: ['blocker-source-identity-unresolved', 'blocker-auxiliary-star-source-witness'],
    resolvesClaimIds: ['claim-auxiliary-star-placement-six-lucky', 'claim-auxiliary-star-placement-core'],
    affectedClaimIds: ['claim-auxiliary-star-placement-six-lucky', 'claim-auxiliary-star-placement-core', 'claim-life-body-ruler-24-ambiguous-rows'],
    currentRelationIds: ['relation-local-auxiliary-rule-surfaces'],
    currentEvidenceRefs: ['artifacts/ziwei-p0-local-frontier-reconciliation-v1/complete.json', 'artifacts/ziwei-auxiliary-star-placement-core-evidence-v0/complete.json', 'artifacts/ziwei-auxiliary-star-placement-core-evidence-v0/comparison.json'],
    sourceRefs: ['docs/ziwei-p0-local-frontier-reconciliation-v1.md', 'docs/ziwei-p0-claim-source-identity-frontier-v1.md'],
    currentGap: '13 source surfaces and 136/136 comparable local rows are bounded; 684 rows are non-comparable and a complete independent witness is absent.',
    material: {
      minimumSet: ['complete rule pages for the production auxiliary-star set: 文昌 文曲 左輔 右弼 天魁 天鉞 祿存 擎羊 陀羅 火星 鈴星 地空 地劫', 'raw source glyphs including 天空 versus requested 地空', 'input axes, anchor, and direction for each rule', 'edition/page/folio and actual bytes'],
      idealSet: ['same-witness alias table or explicit textual relation for 天空/地空', 'explicit treatment of 火星, 鈴星, and 火鈴星 rather than normalization', 'independent transmission comparison'],
    },
    locator: { required: ['star heading', 'input axis', 'complete rows', 'raw glyph', 'page/folio'], capture: ['full rule table', 'adjacent prose', 'identity leaves', 'ambiguous glyph close-up without replacing the original'] },
    search: {
      canonicalTerms: ['文昌', '文曲', '左輔', '右弼', '天魁', '天鉞', '祿存', '擎羊', '陀羅', '火星', '鈴星', '天空', '地空', '地劫'],
      channels: ['source-identified scan', 'library physical folio', 'institutional reproduction'],
      alreadyHeldNearMisses: ['Nanbei p14–p18 and Nanyang p148–p152 are already held surfaces; do not relabel them as a complete independent witness.', 'The Nanyang full-scan negative locator for Fire/Bell is an explicit unlocated boundary, not missing data to fill.'],
    },
    acceptanceCriteria: ['Every production auxiliary rule is directly locatable with its input relation.', 'Raw names and ambiguous compounds remain exact; aliases are a separate relation, not a normalized replacement.', 'Rows not present remain null/unlocated and are not filled from the engine.', 'The source identity and independence decision are explicit.'],
    rejectionCriteria: ['six-star subset presented as complete', '136 matches treated as authority', '天空 silently rewritten as 地空', '火鈴星 reduced to 火星', 'missing rows inferred from current production output'],
    notDuplicateOf: ['artifacts/ziwei-auxiliary-star-placement-core-evidence-v0/complete.json', 'artifacts/ziwei-auxiliary-star-placement-core-evidence-v0/comparison.json'],
    closure: { canCloseOnlyWhen: ['all target production rows and name boundaries are directly reviewed', 'source identity/lineage and independence are separately accepted'], doesNotClose: ['life/body 24-row ruler blocker unless the same page directly resolves that separate surface', 'semantic palace identity'], futureRelationContract: 'complete_auxiliary_source_rules_not_yet_created' },
    licensing: { access: 'source access does not imply reuse', rights: 'raw page-image retention requires explicit terms', policyDecision: 'keep images outside Git pending human rights review' },
    verificationPlan: ['raw observation table with alias/non-alias flags', 'row-count and missing-row checks', 'negative-check glyph normalization and completeness fabrication'],
    rationale: 'P1 with lower semantic fan-out than the map/Tianfu targets; the raw-name boundaries make this target non-substitutable.',
  }),
  target({
    id: 'acq-independent-complete-four-transform-table',
    priority: 'P1',
    priorityRank: 4,
    title: 'independent or rights-cleared complete 10×4 四化 table',
    purpose: 'Obtain a complete source-identified 四化 table beyond the held Nanbei 40/40 local surface and Nanyang 4/40 direct cells.',
    blockerIds: ['blocker-source-identity-unresolved', 'blocker-four-transform-source-witness'],
    resolvesClaimIds: FOUR_TRANSFORM_CLAIMS,
    affectedClaimIds: FOUR_TRANSFORM_CLAIMS,
    currentRelationIds: ['relation-local-four-transformations-nanbei-table', 'relation-local-four-transformations-ming-partial'],
    currentEvidenceRefs: ['artifacts/ziwei-p0-local-frontier-reconciliation-v1/complete.json', 'artifacts/ziwei-four-transformations-source-evidence-v0/complete.json', 'artifacts/ziwei-four-transformations-source-evidence-v0/comparison.json'],
    sourceRefs: ['docs/ziwei-p0-local-frontier-reconciliation-v1.md', 'docs/ziwei-p0-claim-source-identity-frontier-v1.md'],
    currentGap: 'Nanbei has directly observed 40/40 cells but no authority/independent corroboration; Nanyang has 4/40 direct cells and 36 explicit unlocated cells.',
    material: {
      minimumSet: ['all ten stems 甲乙丙丁戊己庚辛壬癸', 'all four columns 化祿 化權 化科 化忌 in declared order', 'all 40 cells directly visible or source-contextually closed', 'edition/date/volume/folio and actual bytes'],
      idealSet: ['distinct physical witness not derived from Nanyang/NARA same-record lineage', 'explicit comparison against Nanbei without copying its values', 'complete surrounding heading and table boundary'],
    },
    locator: { required: ['table title', 'stem order', 'four-column order', 'all 40 cells', 'edition/page/folio'], capture: ['whole table', 'header and footer', 'adjacent rule text', 'identity leaves'] },
    search: {
      canonicalTerms: ['四化速檢表', '化祿', '化權', '化科', '化忌', '甲乙丙丁戊己庚辛壬癸'],
      channels: ['library scan', 'catalog-linked old-book image', 'rights-cleared institutional reproduction'],
      alreadyHeldNearMisses: ['Nanbei p17/printed folio 四十二 is already the complete local table; it is not an acquisition target again.', 'Nanyang p151–p152 and its 36 unlocated cells remain explicit; do not synthesize the missing rows.', 'NARA volume pair is same-record, not independent.'],
    },
    acceptanceCriteria: ['All 40 cells and both axis orders are directly reviewable.', 'The witness has source identity and lineage sufficient to assess independence from held scans.', 'Raw glyphs and table layout are preserved; normalization is a separate comparison layer.', 'A future relation can state exactly which rows are observed, corroborated, or unresolved.'],
    rejectionCriteria: ['Nanbei 40/40 merely recopied', 'Nanyang 36 missing cells filled from current engine', 'same-record NARA pair counted as independent', 'OCR/modern chart/table without physical witness', 'numeric agreement without source rule identity'],
    notDuplicateOf: ['artifacts/ziwei-four-transformations-source-evidence-v0/complete.json', 'artifacts/ziwei-four-transformations-source-evidence-v0/comparison.json', 'src-nanbei-pdf', 'src-nanyangtang-pdf'],
    closure: { canCloseOnlyWhen: ['all 40 cells and lineage/independence gates pass direct review', 'source authority is reviewed separately from exact comparison'], doesNotClose: ['calendar/time input', 'palace semantic identity', 'image reuse rights'], futureRelationContract: 'complete_four_transform_source_table_not_yet_created' },
    licensing: { access: 'source page access and table authority are separate', rights: 'written image reuse terms needed for repository storage', policyDecision: 'retain only hashes/locators until rights are clear' },
    verificationPlan: ['40-cell direct observation matrix', 'stable row/column order check', 'independence/lineage check', 'negative-check missing-cell inference and authority promotion'],
    rationale: 'High fan-out across five claims and an exact local 40/40 boundary makes this a strong early P1 after semantic/identity work.',
  }),
  target({
    id: 'acq-shen-zhu-compound-surface',
    priority: 'P1',
    priorityRank: 9,
    title: 'higher-resolution 身主 witness for the 24 火鈴星 rows',
    purpose: 'Resolve the exact unreadable/ambiguous source surface without reducing 火鈴星 to 火星 or changing the production contract.',
    blockerIds: ['blocker-source-identity-unresolved', 'blocker-life-body-ruler-source-legibility'],
    resolvesClaimIds: ['claim-life-body-palace-ruler', 'claim-life-body-ruler-24-ambiguous-rows'],
    affectedClaimIds: ['claim-life-body-palace-ruler', 'claim-life-body-ruler-24-ambiguous-rows'],
    currentRelationIds: ['relation-local-life-body-ruler-surfaces'],
    currentEvidenceRefs: ['artifacts/ziwei-p0-local-frontier-reconciliation-v1/complete.json', 'artifacts/ziwei-life-body-palace-ruler-source-evidence-v0/complete.json', 'artifacts/ziwei-life-body-palace-ruler-source-evidence-v0/comparison.json'],
    sourceRefs: ['docs/ziwei-p0-local-frontier-reconciliation-v1.md', 'docs/ziwei-p0-claim-source-identity-frontier-v1.md'],
    currentGap: 'Life/body and 命主 are exhaustive in the local comparison; 身主 is comparable for 120/144 and blocked for 24 rows where the Nanyang surface reads 火鈴星.',
    material: {
      minimumSet: ['high-resolution or institution-identified page containing the full 身主 table/rule', 'all 24 previously blocked input rows and the source surface that determines them', 'raw 火鈴星/火星 glyph distinction', 'edition/page/folio and actual bytes'],
      idealSet: ['both Nanbei and Nanyang surfaces retained side by side', 'source statement linking input to 身主 rather than only a result table', 'explicit treatment of any compound-star name'],
    },
    locator: { required: ['身主 heading', '24-row boundary', 'input axes', 'raw star surface', 'page/folio'], capture: ['full table', 'ambiguous line at native resolution', 'adjacent context', 'identity leaves'] },
    search: {
      canonicalTerms: ['命主', '身主', '火鈴星', '火星', '鈴星'],
      channels: ['higher-resolution archive scan', 'library physical folio', 'rights-cleared reproduction from holder'],
      alreadyHeldNearMisses: ['Nanbei p23–p24 and Nanyang p145/p159–p160 are already consumed; the 24-row boundary must not be erased.', 'The existing 120/144 comparable rows do not authorize the remaining 24.'],
    },
    acceptanceCriteria: ['All 24 blocked rows are directly readable or explicitly resolved by a source rule.', '火鈴星 is preserved as the source surface unless the source itself explicitly separates it.', 'The packet keeps life/body, 命主, 身主, and production-field presence as separate layers.', 'No production ruler field is added by the acquisition packet.'],
    rejectionCriteria: ['120/144 presented as complete', '火鈴星 silently normalized to 火星', 'production output used to fill source rows', 'OCR-only or cropped unreadable compound glyph'],
    notDuplicateOf: ['artifacts/ziwei-life-body-palace-ruler-source-evidence-v0/complete.json', 'artifacts/ziwei-life-body-palace-ruler-source-evidence-v0/comparison.json'],
    closure: { canCloseOnlyWhen: ['the 24-row source surface and identity/lineage pass review'], doesNotClose: ['production ruler fields', 'auxiliary-star authority in general', 'readiness/activation'], futureRelationContract: 'shen_zhu_24_row_source_observation_not_yet_created' },
    licensing: { access: 'higher resolution may require library or holder action', rights: 'permission for supplied page images is separate', policyDecision: 'human review before storage or redistribution' },
    verificationPlan: ['24-row completeness check', 'raw glyph visual review', 'negative-check alias reduction and row elision', 'keep production contract unchanged'],
    rationale: 'P1 but narrowly scoped: the blocker is actionable and non-substitutable, yet it has less fan-out than semantic identity or 四化.',
  }),
  target({
    id: 'acq-independent-ziwei-oracle',
    priority: 'P1',
    priorityRank: 5,
    title: 'independent executable Ziwei oracle or reproducible calculation',
    purpose: 'Supply independent corroboration for the same cohort while keeping it separate from source semantic authority and local regression fixtures.',
    blockerIds: ['blocker-independent-external-oracle'],
    resolvesClaimIds: ['claim-ziwei-input-calendar-time', ...MAJOR_CLAIMS, 'claim-tianfu-anchor-direction', 'claim-tianfu-placement', ...FOUR_TRANSFORM_CLAIMS],
    affectedClaimIds: ['claim-ziwei-input-calendar-time', ...MAJOR_CLAIMS, 'claim-tianfu-anchor-direction', 'claim-tianfu-placement', ...FOUR_TRANSFORM_CLAIMS],
    currentRelationIds: ['relation-local-major-star-rule-surfaces', 'relation-local-tianfu-rule-surfaces', 'relation-local-four-transformations-nanbei-table', 'relation-local-four-transformations-ming-partial'],
    currentEvidenceRefs: ['artifacts/ziwei-p0-local-frontier-reconciliation-v1/complete.json', 'artifacts/ziwei-fixture-reconciliation-v1/complete.json'],
    sourceRefs: ['docs/ziwei-p0-local-frontier-reconciliation-v1.md', 'docs/ziwei-p0-claim-source-identity-frontier-v1.md'],
    currentGap: 'Six declared fixtures remain pending; internal fixture matches are regression evidence and independent verification is 0.',
    material: {
      minimumSet: ['independent implementation and version', 'independent source/ruleset identity', 'exact input settings and same cohort', 'field-level output for palace, stars, Tianfu, and 四化 where supported', 'immutable source/output bytes or stable hashes', 'runner/environment provenance'],
      idealSet: ['reproducible command or published executable', 'license and redistribution terms', 'explicit behavior for calendar/time, leap month, timezone, 子時, and convention variants', 'independent maintainer or data lineage'],
    },
    locator: { required: ['implementation/version', 'ruleset/source', 'input fixture', 'output file/hash', 'runner/version', 'field mapping'], capture: ['source release or repository ref', 'configuration', 'raw output', 'execution log', 'license terms'] },
    search: {
      canonicalTerms: ['independent Ziwei calculator', '紫微斗數 排盤', '命宮 身宮 安紫微 安天府 四化'],
      channels: ['independent published software', 'reproducible research artifact', 'institutional calculation service with versioned output'],
      alreadyHeldNearMisses: ['internal fixtures, current resolver, and local comparison artifacts are not independent oracle evidence.', 'NARA/Nanbei/Nanyang numeric matches are source observations, not an executable oracle.'],
    },
    acceptanceCriteria: ['The evaluator does not import the production engine, its fixtures, or the same source data without disclosure.', 'The same cohort and exact settings produce field-level outputs with reproducible identity.', 'Shared source/ruleset dependencies are disclosed; agreement is labeled corroboration, not semantic authority.', 'The output can be replayed or byte/hash verified.'],
    rejectionCriteria: ['wrapper around the production resolver', 'fixture-only or screenshot-only result', 'numeric match without field semantics/configuration', 'undisclosed shared source or mutable endpoint', 'oracle used to fill missing source rows'],
    notDuplicateOf: ['artifacts/ziwei-fixture-reconciliation-v1/complete.json', 'src/ziwei/ziweiResolver.js'],
    closure: { canCloseOnlyWhen: ['independent evaluator, source lineage, settings, output, and runner are reviewed', 'corroboration is kept as a separate relation from source authority'], doesNotClose: ['source identity', 'semantic palace identity', 'readiness/activation automatically'], futureRelationContract: 'independent_oracle_corroboration_not_yet_created' },
    licensing: { access: 'public executable access is not a license for redistribution', rights: 'record source/license and output retention terms', policyDecision: 'human review required before using output as durable evidence' },
    verificationPlan: ['independent-run replay', 'field-level diff with local outputs', 'shared-dependency audit', 'negative-check fixture/production reuse and promotion'],
    rationale: 'Broad diagnostic fan-out, but intentionally below semantic witnesses because corroboration cannot manufacture source meaning.',
  }),
  target({
    id: 'acq-calendar-time-input-authority',
    priority: 'P1',
    priorityRank: 7,
    title: 'authoritative calendar/time input source',
    purpose: 'Close the input identity boundary for lunar conversion, leap-month status, timezone/solar-time policy, and 子時/hour-branch handling.',
    blockerIds: ['blocker-calendar-time-source-identity'],
    resolvesClaimIds: ['claim-ziwei-input-calendar-time'],
    affectedClaimIds: ['claim-ziwei-input-calendar-time'],
    currentRelationIds: [],
    currentEvidenceRefs: ['artifacts/ziwei-p0-local-frontier-reconciliation-v1/complete.json', 'artifacts/ziwei-fixture-reconciliation-v1/complete.json'],
    sourceRefs: ['docs/ziwei-p0-local-frontier-reconciliation-v1.md', 'docs/ziwei-p0-claim-source-identity-frontier-v1.md'],
    currentGap: 'Local input contracts and calculations exist, but no exact independent calendar/time source identity closes leap-month, timezone, solar-time, or 子時 boundary behavior.',
    material: {
      minimumSet: ['versioned calendar table or reproducible service', 'immutable release/retrieval bytes or stable hash', 'timezone and locale', 'leap-month rule', 'day and hour boundary/子時 rule', 'exact cohort conversions from Gregorian input to lunar/date/hour fields'],
      idealSet: ['institutional provenance and published method', 'independent second calendar source for boundary cases', 'explicit true-solar-time policy if used'],
    },
    locator: { required: ['release/version', 'date conversion record', 'leap status', 'timezone', 'hour boundary', 'retrieval/source bytes'], capture: ['source release', 'exact cohort output', 'configuration', 'terms/license'] },
    search: {
      canonicalTerms: ['음양력', '陰曆', '農曆', '子時', 'timezone', 'true solar time'],
      channels: ['official calendar institution', 'versioned ephemeris/calendar data', 'reproducible published service'],
      alreadyHeldNearMisses: ['Nanbei/Nanyang text and local conversion facts are not an independent calendar oracle.', 'Saju calendar artifacts cannot be silently reused as Ziwei source authority without matching the input contract.'],
    },
    acceptanceCriteria: ['The source defines or exposes every input field used by the Ziwei cohort.', 'Boundary cases are represented, especially leap month, midnight/子時, timezone, and solar-time policy.', 'Retrieval/version/bytes and exact input-output rows are reproducible.', 'The source is not the production Ziwei resolver.'],
    rejectionCriteria: ['unversioned web result', 'date-only table with no hour/timezone policy', 'local conversion output treated as independent source', 'missing leap or 子時 boundary', 'OCR/transcription substituted for actual table'],
    notDuplicateOf: ['artifacts/ziwei-fixture-reconciliation-v1/complete.json', 'artifacts/ziwei-p0-local-frontier-reconciliation-v1/complete.json'],
    closure: { canCloseOnlyWhen: ['all input fields and boundary policies are source-identified for the exact cohort'], doesNotClose: ['Ziwei rule/source authority', 'independent executable oracle unless the same target separately satisfies its runner contract'], futureRelationContract: 'calendar_time_input_provenance_not_yet_created' },
    licensing: { access: 'public service access and bulk/reuse permission are separate', rights: 'confirm terms before copying tables or service output', policyDecision: 'keep raw external data out of Git unless authorized' },
    verificationPlan: ['cohort conversion replay', 'boundary-case matrix', 'version/hash check', 'negative-check same-service circularity and missing-field acceptance'],
    rationale: 'P1 prerequisite for a meaningful oracle comparison, but it cannot resolve textual/semantic Ziwei rules.',
  }),
  target({
    id: 'review-image-level-reuse-permission',
    priority: 'P2',
    priorityRank: 10,
    status: 'human_policy_review',
    title: 'image-level reuse and retention decision',
    purpose: 'Resolve the rights boundary separately from source access, semantic usefulness, authority, and witness independence.',
    blockerIds: ['blocker-image-reuse-rights'],
    resolvesClaimIds: [],
    affectedClaimIds: ALL_CLAIMS,
    currentRelationIds: CURRENT_RELATIONS,
    currentEvidenceRefs: ['artifacts/ziwei-p0-toyo-1646-extended-observation-v0/complete.json', 'artifacts/ziwei-p0-palace-semantic-witness-acquisition-route-v1/complete.json', 'artifacts/ziwei-p0-local-frontier-reconciliation-v1/complete.json'],
    sourceRefs: ['docs/ziwei-p0-palace-semantic-witness-acquisition-route-v1.md', 'docs/ziwei-p0-toyo-1646-extended-observation-v0.md', 'docs/ziwei-p0-local-frontier-reconciliation-v1.md'],
    currentGap: 'Public viewer/catalog access and read-only review are recorded, but repository redistribution, derivative crops/renders, and retention terms are not established.',
    material: {
      minimumSet: ['written item/image-level terms or a rights-cleared scan supplied by the holder', 'scope covering repository retention, redistribution, crops/renders, and derivative artifacts', 'item IDs and exact image/file scope', 'contact/institution decision record if terms are not public'],
      idealSet: ['explicit duration, attribution, and downstream license conditions', 'separate terms for NARA, TOYO/AKS, and any library-supplied image'],
    },
    locator: { required: ['item identifier', 'terms URL or written permission', 'image scope', 'derivative scope', 'retention/redistribution condition'], capture: ['terms page or letter', 'item record', 'permission date only in human record, not deterministic artifact'] },
    search: {
      canonicalTerms: ['secondary use', 'image reuse', '館内限定閲覧', 'repository redistribution', 'derivative crop'],
      channels: ['institution rights page', 'item-level license/terms', 'written holder permission'],
      alreadyHeldNearMisses: ['NARA public endpoint/metadata and viewer access are access evidence only.', 'TOYO/AKS viewer access and local read-only JPEG review do not grant repository image rights.'],
    },
    acceptanceCriteria: ['A human rights decision identifies the exact item/image scope and permitted actions.', 'Repository retention, derivative render/crop, redistribution, and attribution conditions are explicit or explicitly denied.', 'Rights status is stored separately from source authority and semantic identity.', 'If permission is absent, the decision remains needs_human_review and images stay outside Git.'],
    rejectionCriteria: ['public URL, catalog CC0 metadata, HTTP 200, or viewer access treated as image permission', 'permission for metadata assumed to cover page images', 'rights language omitted or generalized across distinct institutions/items', 'image copied into the repository before decision'],
    notDuplicateOf: ['artifacts/ziwei-palace-source-acquisition-field-kit-v0/complete.json', 'artifacts/ziwei-p0-palace-semantic-witness-acquisition-route-v1/complete.json'],
    closure: { canCloseOnlyWhen: ['a human/policy reviewer records item-level permission or denial', 'the decision is not used to promote semantic authority or readiness'], doesNotClose: ['any semantic claim', 'source identity', 'independence', 'readiness/activation'], futureRelationContract: 'rights_decision_not_yet_created' },
    licensing: { access: 'access is not permission', rights: 'written item/image-level decision required', policyDecision: 'human/policy boundary; no automatic acquisition or Git storage' },
    verificationPlan: ['human review of terms', 'scope-match item IDs to captured bytes', 'negative-check HTTP/catalog/CC0 shortcut and repository image storage'],
    rationale: 'P2 because it does not resolve a semantic blocker, but it is a hard policy boundary for any future image retention.',
  }),
]

function sourceInventory(root, frontier, toyo, route, nara) {
  const nanbei = frontier.localEvidence.sourcePaths.nanbei
  const nanyang = frontier.localEvidence.sourcePaths.nanyangtang
  return {
    heldButAuthorityInsufficient: [
      {
        id: 'held-nanbei-pdf', sourceIds: ['src-nanbei-pdf'], kind: 'local_pdf',
        status: 'held_but_authority_insufficient', byteLength: nanbei.byteLength, byteSha256: nanbei.actualSha256, pageCount: nanbei.pageCount,
        boundary: 'direct rule/table observations; edition lineage and semantic authority unresolved',
        action: 'do_not_reacquire; use for identity/lineage comparison only',
      },
      {
        id: 'held-nanyangtang-pdf', sourceIds: ['src-nanyangtang-pdf'], kind: 'local_pdf',
        status: 'held_but_authority_insufficient', byteLength: nanyang.byteLength, byteSha256: nanyang.actualSha256, pageCount: nanyang.pageCount,
        boundary: 'same-record derivative candidate; Nanyang 四化 4/40 direct, 36 unlocated; 24 身主 rows blocked',
        action: 'do_not_reacquire_or_count_as_independent; preserve explicit unlocated rows',
      },
      {
        id: 'held-nara-volume-pair', sourceIds: ['src-nara-4468520', 'src-nara-4469314'], kind: 'official_iiif_route',
        status: 'held_but_authority_insufficient',
        boundary: 'public manifests/images and 528↔532 side concordance are access/representation evidence; same catalog record and 0/12 complete semantic binding',
        action: 'do_not_reacquire as an independent pair; seek only distinct witness or explicit rights/native-file decision',
      },
      {
        id: 'held-toyo-1646-cache', sourceIds: ['src-toyo-1646'], kind: 'public_jpeg_cache_review',
        status: 'held_but_authority_insufficient', imageCount: toyo.externalEvidence.imageCount, newImageCount: toyo.externalEvidence.newImageCount,
        boundary: '23 actual-byte visual observations; physical candidate only; date/colophon/lineage/rights unresolved',
        action: 'do_not reacquire reviewed leaves; inspect identity/semantic gaps or request holder-supplied material only when necessary',
      },
      {
        id: 'held-existing-rule-artifacts', sourceIds: ['src-nanbei-pdf', 'src-nanyangtang-pdf'], kind: 'repository_evidence_artifacts',
        status: 'held_but_authority_insufficient',
        boundary: 'major/auxiliary/Tianfu/four-transform/life-body artifacts are local observation and relation evidence, not source authority',
        action: 'do_not request the same already-materialized observations again',
      },
    ],
    locatorOnlyOrNotAdmitted: [
      { id: 'ctext-and-public-text', status: 'locator_only_or_not_admitted', boundary: 'phrase/section locator; OCR/text is not canonical visual evidence' },
      { id: 'rotation-06', status: 'representation_only', boundary: '150/150 numeric relation; semantic identity 0/150' },
      { id: 'internal-fixtures', status: 'regression_only', boundary: 'six pending; independent oracle 0' },
    ],
    missingOrHumanBoundary: [
      { id: 'distinct-complete-semantic-witness', status: 'not_admitted', targetIds: ['acq-palace-semantic-map-and-coordinate-witness'] },
      { id: 'independent-complete-rule-witnesses', status: 'not_admitted', targetIds: ['acq-tianfu-anchor-direction-adjudicator', 'acq-complete-14-major-star-placement-witness', 'acq-complete-auxiliary-star-rule-witness', 'acq-independent-complete-four-transform-table', 'acq-shen-zhu-compound-surface'] },
      { id: 'independent-oracle-and-calendar', status: 'not_admitted', targetIds: ['acq-independent-ziwei-oracle', 'acq-calendar-time-input-authority'] },
      { id: 'image-reuse-decision', status: 'needs_human_review', targetIds: ['review-image-level-reuse-permission'] },
    ],
    routeHashes: {
      naraRouteArtifactSha256: fileSha256(root, 'artifacts/ziwei-p0-palace-semantic-witness-acquisition-route-v1/complete.json'),
      naraLeafmapArtifactSha256: fileSha256(root, 'artifacts/ziwei-nara-iiif-leafmap-semantic-witness-v1/complete.json'),
      naraRouteVerdict: route.verdictToken,
      naraLeafmapVerdict: nara.verdictToken,
    },
  }
}

function buildCurrentAudit(root) {
  const original = readJson(root, 'artifacts/ziwei-p0-claim-source-identity-frontier-v1/complete.json')
  const toyo = readJson(root, 'artifacts/ziwei-p0-toyo-1646-extended-observation-v0/complete.json')
  const frontier = readJson(root, 'artifacts/ziwei-p0-local-frontier-reconciliation-v1/complete.json')
  const route = readJson(root, 'artifacts/ziwei-p0-palace-semantic-witness-acquisition-route-v1/complete.json')
  const nara = readJson(root, 'artifacts/ziwei-nara-iiif-leafmap-semantic-witness-v1/complete.json')
  if (frontier.graphImpact.successor.claimCount !== 30 || frontier.graphImpact.successor.sourceCount !== 13 || frontier.graphImpact.successor.observationCount !== 40 || frontier.graphImpact.successor.relationCount !== 130 || frontier.graphImpact.successor.blockerCount !== 11) throw new Error('unexpected_current_graph_counts')
  if (frontier.localEvidence.fourTransformations.nanbei.comparableCount !== 40 || frontier.localEvidence.fourTransformations.ming.comparableCount !== 4 || frontier.localEvidence.fourTransformations.ming.blockedCount !== 36) throw new Error('unexpected_four_transform_boundary')
  if (frontier.localEvidence.lifeBodyRulers.sourceEditionRulers.shenZhuCanonicalComparable !== 120 || frontier.localEvidence.lifeBodyRulers.sourceEditionRulers.shenZhuCanonicalBlocked !== 24) throw new Error('unexpected_shen_zhu_boundary')
  if (frontier.localEvidence.tianfu.identityMatchCount !== 0 || frontier.localEvidence.tianfu.rotation06MatchCount !== 150) throw new Error('unexpected_tianfu_boundary')
  if (nara.concordance.relationCounts.exact_same_leaf !== 0 || nara.concordance.relationCounts.same_text_different_capture !== 522 || nara.concordance.relationCounts.probable_correspondence !== 6 || nara.concordance.relationCounts.unresolved !== 4) throw new Error('unexpected_nara_concordance_boundary')
  const claimIds = unique(asArray(original.claimSourceMatrix).map(item => item.claimId))
  const relationIds = unique(asArray(frontier.relations).map(item => item.relationId))
  if (claimIds.length !== 30 || !ALL_CLAIMS.every(id => claimIds.includes(id))) throw new Error('claim_graph_boundary_mismatch')
  if (relationIds.length !== 6 || !CURRENT_RELATIONS.every(id => relationIds.includes(id))) throw new Error('relation_graph_boundary_mismatch')
  return {
    sourceOfTruth: 'current local checkout plus actual bytes recorded by predecessor artifacts; no external acquisition in this materializer',
    predecessorChain: [
      'artifacts/ziwei-p0-claim-source-identity-frontier-v1/complete.json',
      'artifacts/ziwei-p0-toyo-1646-extended-observation-v0/complete.json',
      'artifacts/ziwei-p0-local-frontier-reconciliation-v1/complete.json',
    ].map(path => ({ path, schemaVersion: readJson(root, path).schemaVersion, byteSha256: fileSha256(root, path) })),
    graph: {
      claims: frontier.graphImpact.successor.claimCount,
      sources: frontier.graphImpact.successor.sourceCount,
      observations: frontier.graphImpact.successor.observationCount,
      relations: frontier.graphImpact.successor.relationCount,
      blockers: frontier.graphImpact.successor.blockerCount,
      stableClaims: frontier.claimImpact.stableClaimCount,
      semanticAuthority: frontier.claimImpact.semanticAuthorityCount,
    },
    statuses: {
      readiness: frontier.readinessImpact.readiness,
      grounding: frontier.readinessImpact.grounding,
      activation: frontier.readinessImpact.activation,
      rotation06: frontier.readinessImpact.rotation06,
      independentWitnessesAdmitted: frontier.sourceIdentity.independentWitnessesAdmitted,
      sourceAuthorityPromoted: frontier.sourceIdentity.sourceAuthorityPromoted,
    },
    keyEvidenceBoundaries: [
      { id: 'nara-leaf-concordance', observed: '528 local pages vs 532 NARA side slots', result: '522 same_text_different_capture; 6 probable_correspondence; 4 unresolved; 0 exact_same_leaf; complete semantic binding 0/12', sourcePath: 'artifacts/ziwei-nara-iiif-leafmap-semantic-witness-v1/complete.json' },
      { id: 'toyo-1646', observed: '23 actual-byte JPEG observations including 8 additive leaves', result: 'physical candidate only; no edition/lineage/semantic authority/rights closure', sourcePath: 'artifacts/ziwei-p0-toyo-1646-extended-observation-v0/complete.json' },
      { id: 'four-transformations', observed: 'Nanbei 40/40; Nanyang 4/40 direct and 36 unlocated', result: 'local table evidence only; no source authority or independent corroboration', sourcePath: 'artifacts/ziwei-p0-local-frontier-reconciliation-v1/complete.json' },
      { id: 'life-body-rulers', observed: 'life/body 144/144; 命主 144/144; 身主 120/144 comparable and 24 blocked', result: '24-row compound surface remains blocked; production ruler fields absent', sourcePath: 'artifacts/ziwei-p0-local-frontier-reconciliation-v1/complete.json' },
      { id: 'tianfu', observed: 'identity 0/150; rotation-06 150/150', result: 'representation-only; semantic authority blocked', sourcePath: 'artifacts/ziwei-p0-local-frontier-reconciliation-v1/complete.json' },
      { id: 'source-authority', observed: '30 claims, 13 sources, 40 observations, 130 relations', result: 'stable claims 0; semantic authority 0; all 10 evidence blockers remain blocked and rights is needs_human_review', sourcePath: 'artifacts/ziwei-p0-local-frontier-reconciliation-v1/complete.json' },
    ],
    claimIds,
    relationIds,
    originalArtifact: { path: 'artifacts/ziwei-p0-claim-source-identity-frontier-v1/complete.json', byteSha256: fileSha256(root, 'artifacts/ziwei-p0-claim-source-identity-frontier-v1/complete.json') },
    toyoArtifact: { path: 'artifacts/ziwei-p0-toyo-1646-extended-observation-v0/complete.json', byteSha256: fileSha256(root, 'artifacts/ziwei-p0-toyo-1646-extended-observation-v0/complete.json') },
    frontierArtifact: { path: 'artifacts/ziwei-p0-local-frontier-reconciliation-v1/complete.json', byteSha256: fileSha256(root, 'artifacts/ziwei-p0-local-frontier-reconciliation-v1/complete.json') },
    sourceInventory: sourceInventory(root, frontier, toyo, route, nara),
  }
}

function buildBlockers(root) {
  const frontier = readJson(root, 'artifacts/ziwei-p0-local-frontier-reconciliation-v1/complete.json')
  return frontier.blockerAssessments.map(item => ({
    id: item.id,
    priority: BLOCKER_PRIORITY[item.id],
    status: item.status,
    boundaryClass: item.id === 'blocker-image-reuse-rights' ? 'human_policy_boundary' : 'acquisition_evidence_boundary',
    title: item.id,
    currentEvidenceRefs: item.evidenceRefs,
    currentObservationIds: item.newObservationIds,
    currentEvidenceBoundary: item.localResult,
    mappedTargetIds: TARGETS.filter(candidate => candidate.blockerIds.includes(item.id)).map(candidate => candidate.id),
    noAutomaticClosure: true,
    closureDecision: item.id === 'blocker-image-reuse-rights' ? 'needs_human_review' : 'requires_new_or_reclassified_evidence_and_human_review',
  }))
}

function buildArtifact(root = ROOT) {
  for (const path of INPUT_PATHS) if (!existsSync(resolve(root, path))) throw new Error(`missing_input:${path}`)
  const currentAudit = buildCurrentAudit(root)
  const blockers = buildBlockers(root)
  const currentHead = git(root, ['rev-parse', 'HEAD'])
  const originMainHead = git(root, ['rev-parse', 'origin/main'])
  if (git(root, ['branch', '--show-current']) !== 'main') throw new Error('field_kit_requires_main')
  const artifact = {
    schemaVersion: SCHEMA,
    verdictToken: VERDICT,
    scope: {
      purpose: 'read-only Ziwei P0 external-evidence acquisition planning from the reconciled local frontier',
      branch: 'main',
      currentHead,
      originMainHead,
      externalAcquisitionPerformed: false,
      networkUsedDuringMaterialization: false,
      sourceAuthorityPromoted: false,
      semanticAuthorityPromoted: false,
      independentWitnessesAdmitted: 0,
      productionChanged: false,
      readinessChanged: false,
      groundingChanged: false,
      activationChanged: false,
      remoteDatabaseChanged: false,
      deployPerformed: false,
      commitPerformed: false,
      pushPerformed: false,
      protectedUntrackedPreserved: ['-.jpg'],
      predecessorArtifacts: 'read-only inputs; never overwritten',
      existingAcquisitionKit: 'ziwei-palace-source-acquisition-field-kit-v0 remains historical single-blocker predecessor; this v1 is additive and covers all 11 current blockers',
    },
    currentAudit,
    blockers,
    targets: structuredClone(TARGETS),
    candidateWitnessClasses: CANDIDATE_WITNESS_CLASSES,
    priorityMatrix: TARGETS.map(item => ({
      priorityRank: item.priorityRank,
      targetId: item.id,
      priority: item.priority,
      blockerIds: item.blockerIds,
      highLeverageReason: item.rationale,
      canCombineWith: item.id === 'acq-distinct-witness-identity-lineage'
        ? ['acq-palace-semantic-map-and-coordinate-witness', 'acq-tianfu-anchor-direction-adjudicator', 'acq-complete-14-major-star-placement-witness', 'acq-independent-complete-four-transform-table']
        : item.id === 'acq-palace-semantic-map-and-coordinate-witness'
          ? ['acq-distinct-witness-identity-lineage', 'acq-tianfu-anchor-direction-adjudicator']
          : item.id === 'acq-tianfu-anchor-direction-adjudicator'
            ? ['acq-distinct-witness-identity-lineage', 'acq-palace-semantic-map-and-coordinate-witness']
            : [],
    })).sort((a, b) => a.priorityRank - b.priorityRank),
    highLeverageMission: {
      first: ['acq-palace-semantic-map-and-coordinate-witness', 'acq-distinct-witness-identity-lineage', 'acq-tianfu-anchor-direction-adjudicator'],
      reason: 'A distinct, identity-documented witness containing a complete palace map plus an explicit Tianfu anchor can address the semantic layer and the highest-fanout identity gate in one acquisition packet.',
      second: ['acq-independent-complete-four-transform-table', 'acq-independent-ziwei-oracle', 'acq-complete-14-major-star-placement-witness'],
      reasonSecond: 'These have broad claim fan-out, but table/oracle agreement remains subordinate to semantic identity and source lineage.',
      separate: ['acq-calendar-time-input-authority', 'acq-shen-zhu-compound-surface', 'review-image-level-reuse-permission'],
      reasonSeparate: 'Calendar, the 24-row compound surface, and rights are different layers; do not let a semantic witness silently close them.',
    },
    claimImpact: {
      currentClaimCount: currentAudit.graph.claims,
      stableClaimCount: currentAudit.graph.stableClaims,
      semanticAuthorityCount: currentAudit.graph.semanticAuthority,
      targetLinksAreConditional: true,
      noClaimPromotionByIntake: true,
      rightsTargetResolvesClaimIds: [],
      sourceIdentityTargetResolvesClaimIds: [],
      interpretationEligibleClaims: 0,
    },
    relationImpact: {
      currentRelationIds: CURRENT_RELATIONS,
      plannedRelationsAreNotCurrentEvidence: true,
      numericAgreementIsNotSemanticAuthority: true,
      sameLineageIsNotIndependent: true,
      futureRelationsRequireDirectObservationAndHumanReview: true,
    },
    separationInvariants: [
      'direct observation is not textual identity',
      'textual identity is not representation equivalence',
      'representation equivalence is not physical-witness independence',
      'physical-witness independence is not semantic identity',
      'semantic identity is not authority',
      'source presence, OCR, fixtures, and numeric agreement do not promote claims or readiness',
      'rights/access is a separate human/policy layer',
    ],
    intakeSchema: {
      oneRecordPerCandidateMaterial: true,
      required: ['intakeId', 'sourceInstitutionOrHolder', 'stableItemIdOrCallNumber', 'rawTitleAttribution', 'editionOrUnresolved', 'volumeFolioPage', 'originalFileList', 'actualByteSha256', 'captureScope', 'rawObservedGlyphs', 'currentTargetIds', 'currentBlockerIds', 'uncertainties', 'triageStatus'],
      triageStatuses: ['candidate', 'promising', 'review_ready', 'potentially_sufficient', 'rejected', 'needs_human_review'],
      forbidden: ['OCR-only submission', 'invented edition/date/page', 'normalized redraw replacing image', 'confidence score as authority', 'semantic acceptance verdict by field collector', 'production/readiness/activation mutation'],
      requiredPerObservation: ['observationId', 'targetId', 'sourceRef', 'pageOrFolio', 'directVisualStatus', 'rawTextOrGlyph', 'layoutOrDiagramNotes', 'whatItEstablishes', 'whatItDoesNotEstablish'],
      requiredPerRelation: ['currentRelationIdOrPlannedRelationLabel', 'fromObservationIds', 'claimIds', 'blockerIds', 'promotionStatus', 'independenceStatus', 'authorityStatus'],
    },
    humanReviewBoundary: {
      requiredFor: ['source identity/lineage', 'semantic identity', 'independence', 'authority', 'image reuse rights', 'any proposed claim or blocker status change'],
      imageReuseRights: 'blocker-image-reuse-rights remains needs_human_review; no source image is stored by this field kit',
      prohibitedActions: ['production activation', 'readiness/grounding promotion', 'remote DB/deploy', 'source acquisition by this materializer'],
    },
    preservation: {
      sourceImagesStoredInGit: false,
      sourcePdfsStoredInGit: false,
      externalAcquisitionPerformed: false,
      networkUsedDuringMaterialization: false,
      predecessorArtifactsRewritten: false,
      existingAcquisitionKitRewritten: false,
      protectedDashJpg: { path: '-.jpg', exists: true, byteSha256: fileSha256(root, SAJU_SOURCE_DERIVED_ASSET_PATH) },
      commitPerformed: false,
      pushPerformed: false,
      deployPerformed: false,
      remoteDatabaseChanged: false,
    },
    deterministicContract: {
      generatedAt: 'forbidden',
      timestamps: 'forbidden',
      inputBytes: 'actual repository bytes SHA-256; untracked predecessor bytes are explicit inputs',
      ordering: 'stable key order; blocker order follows current predecessor; target order is priority rank; arrays preserve declared meaning unless documented sorted',
      noImplicitSourceSearch: true,
      noExternalAcquisition: true,
      currentHeadObservation: 'diagnostic only; stable-content comparisons ignore volatile repository observation fields',
    },
    negativeContract: {
      rejects: [
        'wrong blocker-to-target mapping',
        'claim link to a target outside its declared evidence layer',
        'source authority or semantic authority promotion',
        'independent witness admission for same-record NARA pair',
        'rotation-06 semantic promotion from numeric fit',
        'Nanbei/Nanyang missing-cell or 24-row boundary erasure',
        'OCR/catalog/HTTP/CC0 shortcut',
        'image-rights target resolving semantic claims',
        'readiness/grounding/activation/production mutation',
        'source image/PDF storage or external acquisition',
        'protected -.jpg loss',
        'generated timestamp',
      ],
    },
    materializer: `scripts/materialize-${SCHEMA}.mjs`,
    checker: `scripts/check-${SCHEMA}.mjs`,
    negativeChecker: `scripts/check-${SCHEMA}-negative-v0.mjs`,
  }
  return attachArtifactIdentity(artifact, buildArtifactIdentity({
    root,
    artifactId: SCHEMA,
    materializerPath: `scripts/materialize-${SCHEMA}.mjs`,
    materializerVersion: MATERIALIZER_VERSION,
    baseHead: currentHead,
    inputs: [...INPUT_PATHS, `scripts/materialize-${SCHEMA}.mjs`],
  }))
}

export function buildBundle(root = ROOT) {
  return buildArtifact(root)
}

const companionData = artifact => ({
  blockers: artifact.blockers,
  targets: artifact.targets,
  priorityMatrix: artifact.priorityMatrix,
  quickMissionCard: {
    title: 'Ziwei P0 evidence acquisition — next field actions',
    rule: 'Read the current boundary first. Capture raw source/identity. Do not close a blocker or promote a claim in the field.',
    firstActions: artifact.priorityMatrix.slice(0, 5).map(item => {
      const full = artifact.targets.find(targetItem => targetItem.id === item.targetId)
      return {
        rank: item.priorityRank,
        targetId: full.id,
        priority: full.priority,
        find: full.material.minimumSet.slice(0, 3),
        accept: full.acceptanceCriteria.slice(0, 2),
        reject: full.rejectionCriteria.slice(0, 2),
      }
    }),
    heldDoNotReacquire: [
      'Nanbei 219p and Nanyangtang 528p local PDFs are already hash-verified inputs.',
      'NARA 4468520/4469314 are a same-record pair, not independent witnesses.',
      'TOYO_1646 reviewed 23 leaves are a physical candidate boundary, not authority.',
    ],
    rights: 'Public access, catalog metadata, HTTP 200, and CC0 metadata do not by themselves authorize image reuse.',
  },
  intakeSchema: artifact.intakeSchema,
})

async function writeJsonWithIntegrity(path, value) {
  const body = Buffer.from(canonicalJson(value))
  await writeFile(path, body)
  await writeFile(`${path}.integrity.json`, canonicalJson({
    schemaVersion: `${SCHEMA}-integrity-v0`,
    path: relative(ROOT, path),
    byteSha256: sha256(body),
    byteScope: 'UTF-8 JSON bytes including final LF',
  }))
  return sha256(body)
}

export async function materializeBundle(target = resolve(ROOT, ARTIFACT_PATH)) {
  const artifact = buildArtifact(ROOT)
  const directory = dirname(target)
  await mkdir(directory, { recursive: true })
  const companion = companionData(artifact)
  const outputs = {
    complete: target,
    blockers: resolve(directory, 'blockers.json'),
    targets: resolve(directory, 'targets.json'),
    priorityMatrix: resolve(directory, 'priorityMatrix.json'),
    quickMissionCard: resolve(directory, 'quickMissionCard.json'),
    intakeSchema: resolve(directory, 'intakeSchema.json'),
  }
  const hashes = {}
  hashes.complete = await writeJsonWithIntegrity(outputs.complete, artifact)
  for (const [key, value] of Object.entries(companion)) hashes[key] = await writeJsonWithIntegrity(outputs[key], value)
  return { artifact, outputs, hashes }
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  const targetPath = resolve(process.argv[2] || ARTIFACT_PATH)
  const result = await materializeBundle(targetPath)
  console.log(JSON.stringify({
    target: result.outputs.complete,
    schema: SCHEMA,
    verdict: VERDICT,
    counts: { blockers: result.artifact.blockers.length, targets: result.artifact.targets.length, claims: result.artifact.currentAudit.graph.claims, relations: result.artifact.currentAudit.graph.relations },
    completeByteSha256: result.hashes.complete,
  }, null, 2))
}

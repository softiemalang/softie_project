import { createHash } from 'node:crypto'

import { canonicalIdentityJson } from '../artifactIdentity.js'

export const SAJU_FIVE_CLASSICS_TYPED_READINESS_SCHEMA = 'saju-five-classics-typed-readiness-contract-v0'
export const SAJU_FIVE_CLASSICS_TYPED_READINESS_VERSION = '0.1.0'

export const GATE_KEYS = Object.freeze(['H', 'E', 'L', 'S', 'I', 'P'])
export const GATE_REQUIREMENTS = Object.freeze(['required', 'conditionally_required', 'not_applicable'])
export const GATE_STATES = Object.freeze(['satisfied', 'unresolved', 'conflicted'])
export const CLAIM_TYPES = Object.freeze([
  'historical_textual',
  'bibliographic_editorial',
  'local_source_derived',
  'cross_lineage_semantic',
  'implementation_grounding',
])
export const INDEPENDENCE_AXES = Object.freeze([
  'physical-item',
  'digital-derivation',
  'edition/textual-lineage',
  'semantic-corroboration',
])
export const PROMOTION_TARGETS = Object.freeze([
  'historical_observation_stability',
  'lineage_specific_stability',
  'cross_lineage_stability',
  'implementation_safe_grounding',
])

const OLD_GATE_KEYS = Object.freeze({
  H: 'historical_witness_observed',
  E: 'edition_collated',
  L: 'local_lineage_resolved',
  S: 'semantic_equivalence_checked',
  I: 'independence_resolved',
})

const AXIS_DESCRIPTIONS = Object.freeze({
  'physical-item': 'A distinct physical holding or institutionally identified item, not merely a second file.',
  'digital-derivation': 'A distinct digitization/bitstream derivation with a traceable capture path, not OCR or a duplicate download.',
  'edition/textual-lineage': 'A dated edition, printing, colophon, or transmission relation that distinguishes textual families.',
  'semantic-corroboration': 'Agreement on the same semantic rule from independent textual lineages; same-lineage agreement does not count.',
})

const policy = (description, gates, independenceAxes) => ({
  description,
  gates: Object.freeze({ ...gates }),
  independenceAxes: Object.freeze({ ...independenceAxes }),
})

export const CLAIM_TYPE_POLICIES = Object.freeze({
  historical_textual: policy(
    'A bounded claim that a historical witness or edition contains wording or a rule surface.',
    { H: 'required', E: 'required', L: 'conditionally_required', S: 'conditionally_required', I: 'conditionally_required', P: 'required' },
    { 'physical-item': 'conditionally_required', 'digital-derivation': 'conditionally_required', 'edition/textual-lineage': 'required', 'semantic-corroboration': 'conditionally_required' },
  ),
  bibliographic_editorial: policy(
    'A claim about author, editor, proofreader, engraver, publisher, or edition responsibility.',
    { H: 'required', E: 'required', L: 'conditionally_required', S: 'not_applicable', I: 'conditionally_required', P: 'required' },
    { 'physical-item': 'conditionally_required', 'digital-derivation': 'conditionally_required', 'edition/textual-lineage': 'required', 'semantic-corroboration': 'not_applicable' },
  ),
  local_source_derived: policy(
    'A claim whose asserted subject is the historical transmission or authority of a local PDF/text representation.',
    { H: 'required', E: 'required', L: 'required', S: 'conditionally_required', I: 'conditionally_required', P: 'required' },
    { 'physical-item': 'required', 'digital-derivation': 'required', 'edition/textual-lineage': 'required', 'semantic-corroboration': 'conditionally_required' },
  ),
  cross_lineage_semantic: policy(
    'A comparison that proposes semantic stability across more than one textual lineage.',
    { H: 'required', E: 'required', L: 'conditionally_required', S: 'required', I: 'required', P: 'required' },
    { 'physical-item': 'required', 'digital-derivation': 'required', 'edition/textual-lineage': 'required', 'semantic-corroboration': 'required' },
  ),
  implementation_grounding: policy(
    'A historical grounding claim intended to support a production calculation or rule.',
    { H: 'required', E: 'required', L: 'conditionally_required', S: 'required', I: 'required', P: 'required' },
    { 'physical-item': 'required', 'digital-derivation': 'required', 'edition/textual-lineage': 'required', 'semantic-corroboration': 'required' },
  ),
})

const sha256 = value => createHash('sha256').update(Buffer.from(canonicalIdentityJson(value))).digest('hex')

const oldEvidence = (claim, key) => {
  const evidence = claim?.readiness?.readinessEvidence?.[OLD_GATE_KEYS[key]]
  return {
    evidenceRefs: [...(evidence?.evidenceRefs || [])],
    missingEdges: [...(evidence?.missingEdges || [])],
    note: evidence?.note || 'Predecessor evidence did not close this gate.',
    oldStatus: evidence?.status || 'missing',
  }
}

const evidenceRefs = (claim, key, fallback = []) => oldEvidence(claim, key).evidenceRefs.length
  ? oldEvidence(claim, key).evidenceRefs
  : fallback

const missingEdges = (claim, key, fallback = []) => oldEvidence(claim, key).missingEdges.length
  ? oldEvidence(claim, key).missingEdges
  : fallback

const scopedProof = ({ claim, gate, reason, scopeBoundary, evidenceRefs: refs, claimType = null, promotionTarget = null }) => ({
  proofType: 'claim_scope_exclusion',
  claimId: claim.claimId,
  gate,
  claimType,
  promotionTarget,
  reason,
  scopeBoundary,
  evidenceRefs: [...refs],
})

const gateRecord = ({
  claim,
  gate,
  policyRequirement,
  requirement = policyRequirement,
  state,
  refs = [],
  missing = [],
  note,
  condition = null,
  notApplicableProof = null,
  axes = null,
}) => ({
  gate,
  policyRequirement,
  requirement,
  state,
  evidenceRefs: [...refs],
  missingEdges: [...missing],
  note,
  ...(condition ? { condition } : {}),
  ...(notApplicableProof ? { notApplicableProof } : {}),
  ...(axes ? { axes } : {}),
  ...(requirement !== policyRequirement && requirement !== 'not_applicable'
    ? { requirementOverride: { reason: note, evidenceRefs: [...refs] } }
    : {}),
})

const sameLineageAxis = (claim, requirement, note, refs = []) => ({
  requirement,
  state: 'unresolved',
  countedAsIndependent: false,
  sameLineageCandidate: true,
  evidenceRefs: refs.length ? refs : evidenceRefs(claim, 'I'),
  missingEdges: ['a distinct edition/textual lineage; same-lineage agreement is explicitly not counted as independent'],
  note,
})

const unresolvedAxis = (claim, requirement, note, refs = [], missing = []) => ({
  requirement,
  state: 'unresolved',
  countedAsIndependent: false,
  sameLineageCandidate: false,
  evidenceRefs: refs.length ? refs : evidenceRefs(claim, 'I'),
  missingEdges: missing.length ? missing : ['independence evidence for this axis'],
  note,
})

const satisfiedAxis = (requirement, note, refs) => ({
  requirement,
  state: 'satisfied',
  countedAsIndependent: false,
  sameLineageCandidate: false,
  evidenceRefs: [...refs],
  missingEdges: [],
  note,
})

const notApplicableAxis = (claim, requirement, reason, refs, claimType, promotionTarget) => ({
  requirement: 'not_applicable',
  state: 'satisfied',
  countedAsIndependent: false,
  sameLineageCandidate: false,
  evidenceRefs: [...refs],
  missingEdges: [],
  note: reason,
  notApplicableProof: scopedProof({
    claim,
    gate: 'I',
    reason,
    scopeBoundary: 'This independence axis is outside the asserted promotion target.',
    evidenceRefs: refs,
    claimType,
    promotionTarget,
  }),
})

const CLAIM_CONFIGS = Object.freeze({
  'claim.yuanhai-editorial-responsibility': {
    claimType: 'bibliographic_editorial',
    typeRationale: 'The asserted fact is a responsibility display; it does not assert the local PDF is the same physical item.',
    promotionTarget: 'historical_observation_stability',
    currentStabilityLevel: 'historical_observation_stability',
    promotionNear: true,
    stability: { historical: 'bounded_stable', lineage: 'unresolved', crossLineage: 'unresolved', implementation: 'not_established' },
    local: {
      requirement: 'not_applicable',
      reason: 'The target is limited to what the identified SSID and Tianyi scan leaves display; local S03 attribution and local-to-item identity are explicitly excluded.',
      scopeBoundary: 'No local PDF authorship, physical-item equivalence, or local transmission claim is promoted.',
      refs: ['page.commons.yuanhai.ssid-13003376.leaf-3-responsibility', 'page.tianyige.yuanhai.ming-chongzhen.scan-5007.leaf-3'],
    },
    semantic: { requirement: 'not_applicable', reason: 'This is an identity/responsibility observation, not a semantic rule claim.', refs: ['page.commons.yuanhai.ssid-13003376.leaf-3-responsibility'] },
    independence: {
      applies: true,
      axes: {
        'physical-item': unresolvedAxis(null, 'conditionally_required', 'The two scan identities are not tied to one another by a physical-item/holding crosswalk.'),
        'digital-derivation': unresolvedAxis(null, 'conditionally_required', 'The scan files are byte-identified, but their independent capture/derivation relation is not established.'),
        'edition/textual-lineage': unresolvedAxis(null, 'required', 'The responsibility display is observed, but exact edition/plate relations remain unresolved.'),
        'semantic-corroboration': null,
      },
      semanticNA: true,
    },
    falseBlockers: [
      { edge: 'L', blockerRefs: ['blocker.local-to-physical-item'], reason: 'False for this bounded institutional-scan responsibility target; it becomes real only if the claim is widened to local-to-item transmission.' },
      { edge: 'S', blockerRefs: [], reason: 'Semantic equivalence is not a prerequisite for a responsibility display claim.' },
    ],
    realBlockers: [
      { edge: 'I.physical-item/edition-textual-lineage', blockerRefs: ['blocker.yuanhai-ziping-lineage'], reason: 'A cross-scan stable responsibility claim still needs item and edition relation evidence.' },
    ],
    externalRequirementIds: ['external.yuanhai-editorial-item-crosswalk'],
  },
  'claim.yuanhai-seasonal-lichun-clause': {
    claimType: 'historical_textual',
    typeRationale: 'The bounded assertion is that a seasonal clause family is visibly present and corresponds across cited pages; it is not a generalized calendar rule.',
    promotionTarget: 'lineage_specific_stability',
    currentStabilityLevel: 'historical_observation_stability',
    promotionNear: true,
    stability: { historical: 'bounded_stable', lineage: 'unresolved', crossLineage: 'unresolved', implementation: 'not_established' },
    local: { requirement: 'conditionally_required', condition: 'The proposition includes a local p.4 to historical-page correspondence.', reason: 'Local lineage is active because the local page is part of the asserted correspondence.' },
    semantic: { requirement: 'not_applicable', reason: 'The current scope asserts a bounded raw clause correspondence and expressly excludes a general 立春/節 semantic rule.', refs: ['page.local.yuanhai.p4-seasonal-calendar', 'relation.lichun-month-command-jie-boundary'] },
    independence: {
      applies: true,
      axes: {
        'physical-item': unresolvedAxis(null, 'conditionally_required', 'The historical scans are identified, but distinct physical-item and holding relations are not closed.'),
        'digital-derivation': unresolvedAxis(null, 'conditionally_required', 'The digital captures are identified, but independent derivation is not established.'),
        'edition/textual-lineage': unresolvedAxis(null, 'required', 'NLC-99036, Tianyi, and the local export lack a closed edition/transmission crosswalk.'),
        'semantic-corroboration': null,
      },
      semanticNA: true,
    },
    falseBlockers: [
      { edge: 'S', blockerRefs: [], reason: 'Full semantic-rule equivalence is false as a blocker for this raw-clause observation because the scope excludes a general rule.' },
    ],
    realBlockers: [
      { edge: 'L', blockerRefs: ['blocker.local-to-physical-item', 'blocker.timing-page-locators'], reason: 'The local-to-historical page/plate bridge is not closed.' },
      { edge: 'I.edition/textual-lineage', blockerRefs: ['blocker.cross-edition-collation'], reason: 'The witnesses cannot yet support a lineage-specific stable claim.' },
    ],
    externalRequirementIds: ['external.yuanhai-seasonal-crosswalk'],
  },
  'claim.ziping-yongshin': {
    claimType: 'cross_lineage_semantic',
    typeRationale: 'The proposition compares 用神 wording and surrounding rule-family surfaces across multiple witness sets and seeks cross-lineage stability.',
    promotionTarget: 'cross_lineage_stability',
    currentStabilityLevel: 'lineage_specific_stability',
    promotionNear: true,
    stability: { historical: 'bounded_stable', lineage: 'bounded_candidate', crossLineage: 'unresolved', implementation: 'not_established' },
    local: { requirement: 'conditionally_required', condition: 'The proposition asserts a local PDF correspondence to historical witnesses.', reason: 'Local lineage is active for a cross-lineage claim that includes the local export.' },
    semantic: { requirement: 'required', state: 'satisfied', reason: 'The bounded character, punctuation, page-sequence, and rule-family comparison was checked; this is not semantic authority.', refsKey: 'S' },
    independence: {
      applies: true,
      axes: {
        'physical-item': unresolvedAxis(null, 'required', 'NLC 35296 physical item/edition and the scan segment identity remain unresolved.'),
        'digital-derivation': unresolvedAxis(null, 'required', 'The local export and institutional scans have no complete independent-capture derivation chain.'),
        'edition/textual-lineage': sameLineageAxis(null, 'required', 'NLC 1926 and NTL 1926 are a same-lineage candidate and cannot count as two independent textual witnesses.'),
        'semantic-corroboration': sameLineageAxis(null, 'required', 'Historical-pair wording agreement is same-lineage corroboration, not independent semantic corroboration.'),
      },
    },
    falseBlockers: [],
    realBlockers: [
      { edge: 'L', blockerRefs: ['blocker.local-to-physical-item', 'lineage.local-ziping-to-nlc-35296'], reason: 'The local source path to a historical item/edition is unresolved.' },
      { edge: 'I.edition/textual-lineage', blockerRefs: ['blocker.yuanhai-ziping-lineage', 'blocker.cross-edition-collation'], reason: 'The current pair is same-lineage and the third witness has unresolved edition identity.' },
    ],
    externalRequirementIds: ['external.ziping-yongshin-independent-edition'],
  },
  'claim.ziping-xingyun': {
    claimType: 'cross_lineage_semantic',
    typeRationale: 'The proposition compares the 行運 sequence across local, NLC 35296, NLC 1926, and NTL 1926 surfaces and distinguishes historical-pair agreement from independent lineage.',
    promotionTarget: 'cross_lineage_stability',
    currentStabilityLevel: 'lineage_specific_stability',
    promotionNear: true,
    stability: { historical: 'bounded_stable', lineage: 'bounded_candidate', crossLineage: 'unresolved', implementation: 'not_established' },
    local: { requirement: 'conditionally_required', condition: 'The proposition asserts local-to-historical correspondence.', reason: 'Local lineage is active for the selected local page and its claimed correspondence.' },
    semantic: { requirement: 'required', state: 'satisfied', reason: 'The bounded section and surrounding-page text sequence was directly compared; no authority is inferred.', refsKey: 'S' },
    independence: {
      applies: true,
      axes: {
        'physical-item': unresolvedAxis(null, 'required', 'NLC 35296 item/edition identity and the relation to the 1926 scans remain unresolved.'),
        'digital-derivation': unresolvedAxis(null, 'required', 'Multiple digital files are present, but independent digitization derivation is not established.'),
        'edition/textual-lineage': sameLineageAxis(null, 'required', 'NLC 1926 and NTL 1926 are same-lineage candidates; NLC 35296 is not resolved as a distinct edition.'),
        'semantic-corroboration': sameLineageAxis(null, 'required', 'The agreeing 1926 pair cannot be counted as independent semantic corroboration.'),
      },
    },
    falseBlockers: [
      { edge: 'blocker.continuation.dayun-exact-first-start-time', blockerRefs: ['blocker.continuation.dayun-exact-first-start-time'], reason: 'Exact first-start timestamp evidence is outside this bounded 行運 progression target.' },
    ],
    realBlockers: [
      { edge: 'L', blockerRefs: ['blocker.local-to-physical-item'], reason: 'The local source chain to the historical witness set is open.' },
      { edge: 'I.semantic-corroboration', blockerRefs: ['blocker.cross-edition-collation'], reason: 'Same-lineage agreement cannot close cross-lineage stability.' },
    ],
    externalRequirementIds: ['external.ziping-xingyun-independent-edition'],
  },
  'claim.ziping-xiangshen': {
    claimType: 'local_source_derived',
    typeRationale: 'The active assertion is a local-source variant against an identified historical pair; the cause of the local omission/addition/order difference is unresolved.',
    promotionTarget: 'cross_lineage_stability',
    currentStabilityLevel: 'lineage_specific_stability',
    promotionNear: false,
    stability: { historical: 'bounded_stable', lineage: 'conflicted', crossLineage: 'conflicted', implementation: 'not_established' },
    local: { requirement: 'required', condition: 'The asserted subject is the local PDF transmission/variant.', reason: 'Local lineage is intrinsic to the claim and cannot be treated as optional.' },
    semantic: { requirement: 'required', state: 'conflicted', reason: 'The local omission/addition/order difference is a scoped semantic conflict; locator mismatch was ruled out.', refs: ['finding.xiangshen-cause-v1', 'relation.continuation.xiangshen-conflict-cause'] },
    independence: {
      applies: true,
      axes: {
        'physical-item': unresolvedAxis(null, 'required', 'The local export and historical scans are not tied to distinct identified physical items.'),
        'digital-derivation': unresolvedAxis(null, 'required', 'The local derivation layer is not established as a scan, transcription, or rewrite.'),
        'edition/textual-lineage': sameLineageAxis(null, 'required', 'NLC and NTL 1926 agree as a historical pair but are not independent lineages.'),
        'semantic-corroboration': sameLineageAxis(null, 'required', 'The historical pair is same-lineage corroboration and cannot resolve the local conflict.'),
      },
    },
    falseBlockers: [
      { edge: 'locator_mismatch', blockerRefs: ['relation.continuation.xiangshen-conflict-cause'], reason: 'False: the exact section/folio locator mismatch hypothesis was directly ruled out.' },
      { edge: 'author_attribution', blockerRefs: [], reason: 'Author attribution is not required to preserve the observed variant conflict.' },
    ],
    realBlockers: [
      { edge: 'S', blockerRefs: ['finding.xiangshen-cause-v1', 'blocker.continuation.xiangshen-variant-cause'], reason: 'The scope-intersecting semantic conflict has no resolved edition/rewriting/editorial cause.' },
      { edge: 'L/I', blockerRefs: ['blocker.local-to-physical-item', 'blocker.cross-edition-collation'], reason: 'Local transmission and independent lineage remain unresolved.' },
    ],
    externalRequirementIds: ['external.ziping-xiangshen-conflict-cause', 'external.ziping-xiangshen-independent-witness'],
    semanticConflict: true,
  },
  'claim.qiongtong-spring-jia-wood': {
    claimType: 'cross_lineage_semantic',
    typeRationale: 'The proposition compares a seasonal-strength clause across local, Waseda, NLC 1926, and NLC 1937 witness sets.',
    promotionTarget: 'cross_lineage_stability',
    currentStabilityLevel: 'lineage_specific_stability',
    promotionNear: true,
    stability: { historical: 'bounded_stable', lineage: 'bounded_candidate', crossLineage: 'unresolved', implementation: 'not_established' },
    local: { requirement: 'conditionally_required', condition: 'The proposition includes the local p.3–p.5 source correspondence.', reason: 'Local lineage is active because the local source is part of the asserted witness set.' },
    semantic: { requirement: 'required', state: 'satisfied', reason: 'The bounded clause sequence was compared; semantic authority and authorship remain separate questions.', refsKey: 'S' },
    independence: {
      applies: true,
      axes: {
        'physical-item': unresolvedAxis(null, 'required', 'Waseda, NLC 1926, and NLC 1937 physical-item identities are not sufficient to establish independent transmission.'),
        'digital-derivation': unresolvedAxis(null, 'required', 'The scan derivation relations are not fully documented.'),
        'edition/textual-lineage': unresolvedAxis(null, 'required', 'Dated edition/colophon and transmission relations remain open.'),
        'semantic-corroboration': unresolvedAxis(null, 'required', 'Textual stability is bounded, but independent lineage corroboration is not established.'),
      },
    },
    falseBlockers: [
      { edge: 'authorship', blockerRefs: ['blocker.ditian-qiongtong-later-edited-print'], reason: 'Authorship is not required for the bounded observation that the clause is present in the cited witness sets.' },
    ],
    realBlockers: [
      { edge: 'I.edition/textual-lineage', blockerRefs: ['blocker.ditian-qiongtong-later-edited-print', 'blocker.cross-edition-collation'], reason: 'Later edited-print and transmission relations are not resolved.' },
      { edge: 'L', blockerRefs: ['blocker.local-to-physical-item'], reason: 'The local source bridge remains open.' },
    ],
    externalRequirementIds: ['external.qiongtong-dated-lineage'],
  },
})

const DAYUN_CONFIG = Object.freeze({
  'claim.sanming-dayun-year-stem-gender-direction': {
    currentStabilityLevel: 'historical_observation_stability',
    promotionNear: true,
    stability: { historical: 'bounded_stable', lineage: 'unresolved', crossLineage: 'unresolved', implementation: 'not_established' },
    externalRequirementIds: ['external.dayun-direction-independent-witness'],
  },
  'claim.sanming-dayun-term-selection': {
    currentStabilityLevel: 'historical_observation_stability',
    promotionNear: true,
    stability: { historical: 'bounded_stable', lineage: 'unresolved', crossLineage: 'unresolved', implementation: 'not_established' },
    externalRequirementIds: ['external.dayun-term-selection-independent-witness'],
  },
  'claim.sanming-dayun-term-distance': {
    currentStabilityLevel: 'historical_observation_stability',
    promotionNear: true,
    stability: { historical: 'bounded_stable', lineage: 'unresolved', crossLineage: 'unresolved', implementation: 'not_established' },
    externalRequirementIds: ['external.dayun-term-distance-worked-example'],
  },
  'claim.sanming-dayun-distance-conversion': {
    currentStabilityLevel: 'historical_observation_stability',
    promotionNear: true,
    stability: { historical: 'bounded_stable', lineage: 'unresolved', crossLineage: 'unresolved', implementation: 'not_established' },
    externalRequirementIds: ['external.dayun-conversion-worked-example'],
  },
  'claim.sanming-dayun-start-age': {
    currentStabilityLevel: 'historical_observation_stability',
    promotionNear: true,
    stability: { historical: 'bounded_stable', lineage: 'unresolved', crossLineage: 'unresolved', implementation: 'not_established' },
    externalRequirementIds: ['external.dayun-start-age-worked-example'],
  },
  'claim.sanming-dayun-first-start-time': {
    currentStabilityLevel: 'historical_observation_stability',
    promotionNear: false,
    stability: { historical: 'bounded_stable', lineage: 'unresolved', crossLineage: 'unresolved', implementation: 'not_established' },
    editionState: 'unresolved',
    semanticState: 'unresolved',
    externalRequirementIds: ['external.dayun-first-start-time-complete-rule'],
  },
  'claim.sanming-dayun-progression': {
    currentStabilityLevel: 'historical_observation_stability',
    promotionNear: true,
    stability: { historical: 'bounded_stable', lineage: 'unresolved', crossLineage: 'unresolved', implementation: 'not_established' },
    externalRequirementIds: ['external.dayun-progression-independent-witness'],
  },
})

const buildDayunConfig = (claimId) => ({
  claimType: 'implementation_grounding',
  typeRationale: 'The claim is a historical observation selected because it could otherwise be mistaken for grounding of a production 大運 timing rule; implementation-safe grounding is a separate target.',
  promotionTarget: 'implementation_safe_grounding',
  promotionNear: DAYUN_CONFIG[claimId].promotionNear,
  local: { requirement: 'conditionally_required', condition: 'The production-facing timing packet includes a local rule path.', reason: 'Local lineage is conditionally active for the current implementation-grounding boundary.' },
  semantic: { requirement: 'required', state: DAYUN_CONFIG[claimId].semanticState || 'satisfied', reason: DAYUN_CONFIG[claimId].semanticState === 'unresolved' ? 'The direct scan does not contain enough exact timestamp semantics for this claim.' : 'The bounded passage/example comparison is satisfied at the observation level, not at implementation authority.', refsKey: 'S' },
  independence: {
    applies: true,
    axes: {
      'physical-item': unresolvedAxis(null, 'required', 'The ANU scan is byte-identified, but physical-item and edition relations remain unresolved.'),
      'digital-derivation': unresolvedAxis(null, 'required', 'The ANU bitstream identity is verified, but independence from the predecessor digital witness is not established.'),
      'edition/textual-lineage': unresolvedAxis(null, 'required', 'Printed folio, edition, and transmission relation are not closed.'),
      'semantic-corroboration': unresolvedAxis(null, 'required', 'The predecessor web witness is not an independent semantic lineage.'),
    },
  },
  currentStabilityLevel: DAYUN_CONFIG[claimId].currentStabilityLevel,
  stability: DAYUN_CONFIG[claimId].stability,
  editionState: DAYUN_CONFIG[claimId].editionState || 'satisfied',
  falseBlockers: claimId === 'claim.sanming-dayun-first-start-time' ? [] : [
    { edge: 'blocker.continuation.dayun-exact-first-start-time', blockerRefs: ['blocker.continuation.dayun-exact-first-start-time'], reason: 'The exact first-start timestamp is outside this claim’s bounded direction/selection/distance/conversion/progression observation target.' },
  ],
  realBlockers: [
    ...(claimId === 'claim.sanming-dayun-first-start-time'
      ? [{ edge: 'exact-first-start/E/S/I', blockerRefs: ['blocker.continuation.dayun-exact-first-start-time', 'blocker.continuation.anu-printed-folio-crosswalk'], reason: 'The exact first-start timestamp lacks a complete witnessed rule, edition/folio identity, and independent semantic corroboration.' }]
      : [{ edge: 'L/I/E', blockerRefs: ['blocker.continuation.local-timing-lineage', 'blocker.continuation.anu-printed-folio-crosswalk'], reason: 'Implementation-safe grounding requires a closed local source path, edition/folio identity, and independent semantic corroboration.' }]),
  ],
  externalRequirementIds: DAYUN_CONFIG[claimId].externalRequirementIds,
})

const EXTERNAL_EVIDENCE_REQUIREMENTS = Object.freeze([
  {
    requirementId: 'external.yuanhai-editorial-item-crosswalk', claimId: 'claim.yuanhai-editorial-responsibility', priority: 'promotion_near',
    missingEdge: 'I.physical-item/edition-textual-lineage', evidenceKind: 'institutional item-to-scan crosswalk plus colophon',
    exactAcquisition: ['An institutional catalog or holding record that names the exact SSID-13003376 and Tianyi 5007 items and their scan relationship.', 'Direct title-page/colophon or printed-folio images for leaf 3, with stable record URL, scan leaf, file byte SHA-256, and retrieval date.', 'If the local warning remains in scope, a documented local-file provenance bridge naming the source item and any transcription/typesetting step.'],
    acceptanceCriteria: ['The record-to-file-to-leaf relation is explicit; a matching responsibility string alone is insufficient.', 'The report separates scan responsibility observation from local authorship and physical-item identity.'],
  },
  {
    requirementId: 'external.yuanhai-seasonal-crosswalk', claimId: 'claim.yuanhai-seasonal-lichun-clause', priority: 'promotion_near',
    missingEdge: 'L and I.edition/textual-lineage', evidenceKind: 'dated edition crosswalk with exact surrounding text',
    exactAcquisition: ['A dated institutional scan with exact printed folios corresponding to local p.4, NLC-99036 printed p.34–35, and Tianyi leaf 19.', 'Title-page/colophon/edition record for NLC-99036 and the Tianyi item, plus a local-PDF-to-item provenance bridge.', 'Direct visual capture of the complete surrounding seasonal paragraph, not OCR-only text.'],
    acceptanceCriteria: ['The clause order, omissions/additions, printed-folio mapping, and edition relation are recorded line by line.', 'The result remains a bounded textual observation unless the source actually states a general 立春/節 rule.'],
  },
  {
    requirementId: 'external.ziping-yongshin-independent-edition', claimId: 'claim.ziping-yongshin', priority: 'promotion_near',
    missingEdge: 'L and I.edition/textual-lineage/semantic-corroboration', evidenceKind: 'independent dated 子平真詮 witness',
    exactAcquisition: ['A dated title-page/colophon and catalog record for a witness outside the NLC-1926/NTL-1926 same-lineage pair.', 'Exact scan bytes/hash and direct visual pages corresponding to local p.6–p.7, printed folios, and the NLC-35296 segment.', 'A source-lineage note showing whether the local PDF is a scan, transcription, or later typeset derivation.'],
    acceptanceCriteria: ['The new witness is independent at the edition/textual-lineage and semantic-corroboration axes.', 'The 用神 passage and immediate continuation agree within an explicitly bounded scope; no production rule is inferred from phrase matching alone.'],
  },
  {
    requirementId: 'external.ziping-xingyun-independent-edition', claimId: 'claim.ziping-xingyun', priority: 'promotion_near',
    missingEdge: 'L and I.edition/textual-lineage/semantic-corroboration', evidenceKind: 'independent dated 行運 section witness',
    exactAcquisition: ['A dated/edition-identified witness outside the NLC-1926/NTL-1926 same-lineage pair, with title page or colophon.', 'Exact pages/folios for local p.15, NLC-35296 p.56/四十七, and the NLC/NTL 1926 pages, with byte hashes.', 'A documented local source derivation and a complete surrounding 論行運 paragraph.'],
    acceptanceCriteria: ['The new lineage is not a duplicate scan or derivative transcription of the 1926 pair.', 'Section sequence, page boundaries, and semantic rule scope are reconciled before any cross-lineage stability decision.'],
  },
  {
    requirementId: 'external.ziping-xiangshen-conflict-cause', claimId: 'claim.ziping-xiangshen', priority: 'blocked_conflict',
    missingEdge: 'S conflict cause', evidenceKind: 'editorial apparatus or dated witness resolving local variant cause',
    exactAcquisition: ['A dated physical witness or critical/editorial apparatus covering printed folios 一九–二○ and the surrounding 論相神 text.', 'Direct pages showing whether the 我用神 omission and the 财旺生官/order difference relative to the NLC/NTL 1926 bounded pair are edition text, commentary, or modern rewriting; NLC 35296 p.39 phrase presence is included, but its full role clause is not yet transcribed.', 'A provenance record for the local PDF sufficient to distinguish scan/transcription/typesetting/editorial intervention.', 'If the 耕寸集 catalog candidate is pursued, direct target folios and a narrower dating basis must be obtained; its current 清敬一堂鈔本 catalog record is identity-only and does not resolve the cause.'],
    acceptanceCriteria: ['The cause is assigned with direct evidence rather than normalized to the NLC/NTL 1926 pair.', 'NLC 35296 phrase presence alone is not accepted as a full role-clause or edition-resolution claim.', 'If the cause remains ambiguous, S stays conflicted and promotion remains rejected.'],
  },
  {
    requirementId: 'external.ziping-xiangshen-independent-witness', claimId: 'claim.ziping-xiangshen', priority: 'blocked_conflict',
    missingEdge: 'I.semantic-corroboration', evidenceKind: 'independent textual lineage',
    exactAcquisition: ['A separately dated and lineage-identified witness outside the NLC/NTL 1926 pair; the NLC 35296 [19--?] scan is not sufficient until its date/lineage boundary is resolved.', 'Exact section/folio images and a surrounding-text collation against the local pair, the NLC/NTL 1926 pair, and the NLC 35296 p.39–p.45 locator set, including a safe transcription or explicit non-transcription of the role clause.', 'Institutional record and byte-level identity for the new scan. The 耕寸集 06599 / rarecatx0441810 record currently supplies catalog-level physical identity only, with target sections and exact date unobserved, so it is not yet a textual witness.'],
    acceptanceCriteria: ['Same-lineage NLC/NTL 1926 agreement is not counted as independent corroboration.', 'NLC 35296 phrase presence and the 耕寸集 catalog record are not promoted to independent textual witnesses without resolved date/lineage and direct target-page evidence.', 'The new witness either resolves the conflict within scope or preserves it as an explicit variant.'],
  },
  {
    requirementId: 'external.qiongtong-dated-lineage', claimId: 'claim.qiongtong-spring-jia-wood', priority: 'promotion_near',
    missingEdge: 'L and I.edition/textual-lineage/semantic-corroboration', evidenceKind: 'dated colophons plus independent seasonal passage',
    exactAcquisition: ['Dated title-page/colophon and institutional holding records for Waseda, NLC 1926, and NLC 1937 scans.', 'A fourth witness from a distinct textual lineage with exact pages/folios for the 春月之木 passage and surrounding text.', 'A local-PDF provenance bridge identifying whether the local pages derive from any of the institutional witnesses.'],
    acceptanceCriteria: ['The clause stability and authorship/edition responsibility are reported as separate findings.', 'The fourth witness is independent on edition/textual-lineage and semantic-corroboration axes.'],
  },
  {
    requirementId: 'external.dayun-direction-independent-witness', claimId: 'claim.sanming-dayun-year-stem-gender-direction', priority: 'promotion_near',
    missingEdge: 'L/I/E for implementation-safe grounding', evidenceKind: 'independent dated 大運 direction witness',
    exactAcquisition: ['A dated edition/colophon and exact folio/page image for 陽男陰女順而行之 / 陰男陽女逆而行之 outside the ANU/predecessor web representation family.', 'The ANU record-to-bitstream-to-scan relation and printed-folio crosswalk.', 'A local implementation-source bridge showing which production direction rule the claim would ground.'],
    acceptanceCriteria: ['The independent witness is not a duplicate digital representation or same-lineage scan.', 'The result is limited to direction semantics and does not inherit first-start-time authority.'],
  },
  {
    requirementId: 'external.dayun-term-selection-independent-witness', claimId: 'claim.sanming-dayun-term-selection', priority: 'promotion_near',
    missingEdge: 'L/I/E for exact 節 selection semantics', evidenceKind: 'independent dated preceding/next 節 passage',
    exactAcquisition: ['An independent dated witness with the complete preceding/next 節 selection paragraph and exact folio.', 'A direct calendar/section crosswalk identifying which 節 class is selected and how direction chooses it.', 'A local rule-packet bridge that records any implementation convention separately from the historical wording.'],
    acceptanceCriteria: ['The evidence states the selected term class and direction relation explicitly; a heading-only locator is insufficient.', 'No exact timestamp or rounding claim is inferred unless directly witnessed.'],
  },
  {
    requirementId: 'external.dayun-term-distance-worked-example', claimId: 'claim.sanming-dayun-term-distance', priority: 'promotion_near',
    missingEdge: 'I.semantic-corroboration and exact procedure', evidenceKind: 'complete birth-to-節 distance worked example',
    exactAcquisition: ['A dated independent witness with a worked birth date/time, selected 節 date/time, unit convention, and resulting distance.', 'Exact page/folio and direct visual review of the surrounding calculation text.', 'A policy record for calendar, timezone/solar-time, hour granularity, and rounding order.'],
    acceptanceCriteria: ['Every input and operation is observable or explicitly marked unresolved.', 'The historical example is not silently substituted for the production calculation.'],
  },
  {
    requirementId: 'external.dayun-conversion-worked-example', claimId: 'claim.sanming-dayun-distance-conversion', priority: 'promotion_near',
    missingEdge: 'I.semantic-corroboration and rounding order', evidenceKind: 'independent 三日一歲 / 一日四月 example',
    exactAcquisition: ['An independent dated witness containing the conversion wording and a complete numerical worked example.', 'Exact folio/page images and a byte-identified scan.', 'A derivation table that distinguishes days-to-years, residual days-to-months, residual hours, and rounding/clamping policy.'],
    acceptanceCriteria: ['The conversion operation and implementation rounding order are separately evidenced.', 'No numeric output is tuned to match the source example.'],
  },
  {
    requirementId: 'external.dayun-start-age-worked-example', claimId: 'claim.sanming-dayun-start-age', priority: 'promotion_near',
    missingEdge: 'L/I/E for local equivalence of 起運 age', evidenceKind: 'complete 起運 age worked example',
    exactAcquisition: ['An independent dated witness with the full birth-to-起運 age example and exact folio/page.', 'ANU printed-folio crosswalk and local-to-institutional source bridge.', 'A calculation trace showing which historical inputs map to the current local implementation.'],
    acceptanceCriteria: ['The observed age example is separated from a generalized age algorithm.', 'Any mismatch remains an explicit blocker rather than a tolerance adjustment.'],
  },
  {
    requirementId: 'external.dayun-first-start-time-complete-rule', claimId: 'claim.sanming-dayun-first-start-time', priority: 'blocked_scope_gap',
    missingEdge: 'E/S/I exact first-start timestamp semantics', evidenceKind: 'complete historical rule plus independent numerical examples',
    exactAcquisition: ['Two independent dated witnesses with exact folio/page evidence for birth instant, preceding/next 節 selection, conversion, residual-hour treatment, and first-start timestamp.', 'Institutional record, colophon, scan byte hash, and printed-folio crosswalk for each witness.', 'An implementation policy record covering calendar system, timezone/solar-time convention, hour boundary, rounding, and date clamping.', 'A parent-verified numerical replay with independently derived expected outputs.'],
    acceptanceCriteria: ['The rule closes the exact first-start timestamp question, not only a 起運 age example.', 'Historical authority, deterministic implementation equivalence, and production activation remain separate gates.'],
  },
  {
    requirementId: 'external.dayun-progression-independent-witness', claimId: 'claim.sanming-dayun-progression', priority: 'promotion_near',
    missingEdge: 'L/I/E for later-cycle progression', evidenceKind: 'complete later 大運 progression passage',
    exactAcquisition: ['An independent dated witness containing the full surrounding progression section and exact folio/page.', 'A printed-folio crosswalk and source-lineage relation to ANU V2 and the local implementation source.', 'A worked multi-cycle example showing the progression operation without importing first-start-time assumptions.'],
    acceptanceCriteria: ['The bounded progression observation is distinguished from a complete production cycle algorithm.', 'Same-work web or duplicate scan evidence is not counted as independent.'],
  },
])

const buildAxes = (claim, config) => {
  const typePolicy = CLAIM_TYPE_POLICIES[config.claimType]
  const axes = {}
  for (const axisName of INDEPENDENCE_AXES) {
    const descriptor = config.independence.axes[axisName]
    const policyRequirement = typePolicy.independenceAxes[axisName]
    if (axisName === 'semantic-corroboration' && config.independence.semanticNA) {
      axes[axisName] = notApplicableAxis(claim, policyRequirement, 'The target is a raw identity/textual observation and does not assert independent semantic-rule corroboration.', claim.sourceFrontierEvidence?.pageObservationIds?.slice(0, 1) || [], config.claimType, config.promotionTarget)
      axes[axisName].policyRequirement = policyRequirement
      continue
    }
    if (!descriptor) throw new Error(`missing independence axis descriptor: ${claim.claimId}:${axisName}`)
    const copy = structuredClone(descriptor)
    copy.policyRequirement = policyRequirement
    if (copy.requirement !== policyRequirement) {
      copy.requirementOverride = {
        reason: 'claim-target-specific applicability',
        evidenceRefs: copy.evidenceRefs?.length ? copy.evidenceRefs : claim.sourceFrontierEvidence?.pageObservationIds?.slice(0, 1) || [],
      }
    }
    axes[axisName] = copy
  }
  return axes
}

const active = item => item.requirement !== 'not_applicable' && (item.requirement !== 'conditionally_required' || item.condition?.applies !== false)

const buildClaimGates = (claim, config, typePolicy) => {
  const gates = {}
  const H = oldEvidence(claim, 'H')
  const E = oldEvidence(claim, 'E')
  gates.H = gateRecord({ claim, gate: 'H', policyRequirement: typePolicy.gates.H, requirement: typePolicy.gates.H, state: H.oldStatus === 'proven' ? 'satisfied' : 'unresolved', refs: H.evidenceRefs, missing: H.missingEdges, note: H.note })
  const editionState = config.editionState || (E.oldStatus === 'proven' ? 'satisfied' : 'unresolved')
  gates.E = gateRecord({ claim, gate: 'E', policyRequirement: typePolicy.gates.E, requirement: typePolicy.gates.E, state: editionState, refs: E.evidenceRefs, missing: E.missingEdges, note: config.editionNote || E.note })

  if (config.local.requirement === 'not_applicable') {
    const proof = scopedProof({ claim, gate: 'L', reason: config.local.reason, scopeBoundary: config.local.scopeBoundary, evidenceRefs: config.local.refs || claim.sourceFrontierEvidence?.pageObservationIds?.slice(0, 1) || [], claimType: config.claimType, promotionTarget: config.promotionTarget })
    gates.L = gateRecord({ claim, gate: 'L', policyRequirement: typePolicy.gates.L, requirement: 'not_applicable', state: 'satisfied', refs: proof.evidenceRefs, note: config.local.reason, notApplicableProof: proof })
  } else {
    const L = oldEvidence(claim, 'L')
    gates.L = gateRecord({ claim, gate: 'L', policyRequirement: typePolicy.gates.L, requirement: config.local.requirement, state: L.oldStatus === 'proven' ? 'satisfied' : 'unresolved', refs: L.evidenceRefs, missing: L.missingEdges, note: config.local.reason, condition: config.local.condition ? { applies: true, predicate: config.local.condition, rationale: config.local.reason } : null })
  }

  if (config.semantic.requirement === 'not_applicable') {
    const proof = scopedProof({ claim, gate: 'S', reason: config.semantic.reason, scopeBoundary: 'The claim scope excludes semantic rule meaning or implementation authority.', evidenceRefs: config.semantic.refs || claim.sourceFrontierEvidence?.pageObservationIds?.slice(0, 1) || [], claimType: config.claimType, promotionTarget: config.promotionTarget })
    gates.S = gateRecord({ claim, gate: 'S', policyRequirement: typePolicy.gates.S, requirement: 'not_applicable', state: 'satisfied', refs: proof.evidenceRefs, note: config.semantic.reason, notApplicableProof: proof })
  } else {
    const S = oldEvidence(claim, 'S')
    const state = config.semantic.state || (S.oldStatus === 'proven' ? 'satisfied' : 'unresolved')
    gates.S = gateRecord({ claim, gate: 'S', policyRequirement: typePolicy.gates.S, requirement: config.semantic.requirement, state, refs: config.semantic.refs || S.evidenceRefs, missing: state === 'satisfied' ? [] : (S.missingEdges.length ? S.missingEdges : ['semantic equivalence or conflict resolution']), note: config.semantic.reason, condition: config.semantic.condition ? { applies: true, predicate: config.semantic.condition, rationale: config.semantic.reason } : null })
  }

  const axes = buildAxes(claim, config)
  const activeAxes = Object.values(axes).filter(active)
  const independenceState = activeAxes.some(axis => axis.state === 'conflicted')
    ? 'conflicted'
    : activeAxes.every(axis => axis.state === 'satisfied')
      ? 'satisfied'
      : 'unresolved'
  const IRefs = [...new Set(activeAxes.flatMap(axis => axis.evidenceRefs || []))]
  const IMissing = [...new Set(activeAxes.flatMap(axis => axis.missingEdges || []))]
  gates.I = gateRecord({
    claim,
    gate: 'I',
    policyRequirement: typePolicy.gates.I,
    requirement: config.independence.applies ? typePolicy.gates.I : 'not_applicable',
    state: independenceState,
    refs: IRefs,
    missing: IMissing,
    note: 'Independence is an axis vector; a second institution or file is not sufficient when textual lineage is shared.',
    condition: typePolicy.gates.I === 'conditionally_required' ? { applies: config.independence.applies, predicate: 'more than one witness is used for the asserted target', rationale: 'The current claim names multiple witness sets.' } : null,
    axes,
  })
  if (!config.independence.applies) {
    const proof = scopedProof({ claim, gate: 'I', reason: 'The target uses one bounded observation and does not assert corroboration.', scopeBoundary: 'No cross-witness stability is being promoted.', evidenceRefs: claim.sourceFrontierEvidence?.pageObservationIds?.slice(0, 1) || [], claimType: config.claimType, promotionTarget: config.promotionTarget })
    gates.I = gateRecord({ claim, gate: 'I', policyRequirement: typePolicy.gates.I, requirement: 'not_applicable', state: 'satisfied', refs: proof.evidenceRefs, note: proof.reason, notApplicableProof: proof, axes })
  }

  const blockingEdges = []
  for (const key of ['H', 'E', 'L', 'S', 'I']) {
    const item = gates[key]
    if (active(item) && item.state !== 'satisfied') blockingEdges.push(`${key}:${item.state}`)
  }
  if (gates.I.axes) {
    for (const [axisName, axis] of Object.entries(gates.I.axes)) if (active(axis) && axis.state !== 'satisfied') blockingEdges.push(`I.${axisName}:${axis.state}`)
  }
  const hasConflict = config.semanticConflict === true || gates.S.state === 'conflicted' || gates.I.state === 'conflicted'
  if (!blockingEdges.length) blockingEdges.push('typed_audit_no_promotion_without_parent_review')
  gates.P = gateRecord({
    claim,
    gate: 'P',
    policyRequirement: typePolicy.gates.P,
    requirement: 'required',
    state: hasConflict ? 'conflicted' : 'unresolved',
    refs: [...new Set(blockingEdges.flatMap(edge => edge.includes(':') ? [] : [edge]))],
    missing: blockingEdges,
    note: hasConflict ? 'Promotion is rejected because a scope-intersecting conflict remains.' : 'Promotion is not inferred from lower-level stability; unresolved lineage/independence or target-specific grounding remains.',
  })
  return { gates, blockingEdges, hasConflict }
}

const copyIndependenceForArtifact = gates => Object.fromEntries(INDEPENDENCE_AXES.map(axis => [axis, gates.I.axes?.[axis] || null]))

const materializeExternalPlan = (claim, config, blockingEdges) => EXTERNAL_EVIDENCE_REQUIREMENTS
  .filter(requirement => config.externalRequirementIds.includes(requirement.requirementId))
  .map(requirement => ({
    ...structuredClone(requirement),
    currentState: {
      status: 'blocked',
      claimType: config.claimType,
      currentStabilityLevel: config.currentStabilityLevel,
      missingEdges: [...new Set(blockingEdges)],
      promotionTarget: config.promotionTarget,
      promotionNear: config.promotionNear === true,
    },
  }))

const buildClaim = (claim, config) => {
  const typePolicy = CLAIM_TYPE_POLICIES[config.claimType]
  const { gates, blockingEdges, hasConflict } = buildClaimGates(claim, config, typePolicy)
  const externalEvidencePlan = materializeExternalPlan(claim, config, blockingEdges)
  const promotion = {
    status: 'blocked',
    ready: false,
    target: config.promotionTarget,
    blockingEdges,
    scopeConflict: hasConflict,
    reason: hasConflict ? 'scope_intersecting_semantic_or_independence_conflict' : 'required_or_conditional_gate_unresolved',
  }
  const typedClaim = {
    claimId: claim.claimId,
    workIds: [...claim.workIds],
    claimFamily: claim.claimFamily,
    proposition: claim.proposition,
    scope: claim.scope,
    claimType: config.claimType,
    typeRationale: config.typeRationale,
    promotionTarget: config.promotionTarget,
    currentStabilityLevel: config.currentStabilityLevel,
    predecessor: {
      adjudicationStatus: claim.adjudicationStatus,
      semanticAuthorityStatus: claim.semanticAuthorityStatus,
      sourceFrontierEvidence: structuredClone(claim.sourceFrontierEvidence),
    },
    gates,
    independence: {
      overallState: gates.I.state,
      axes: copyIndependenceForArtifact(gates),
      rule: 'same-lineage or derivative agreement is not independent semantic corroboration',
    },
    stabilityAssessment: {
      historicalObservationStability: config.stability.historical,
      lineageSpecificStability: config.stability.lineage,
      crossLineageStability: config.stability.crossLineage,
      implementationSafeGrounding: config.stability.implementation,
      currentLevel: config.currentStabilityLevel,
    },
    promotion,
    blockerAssessment: {
      falseBlockers: structuredClone(config.falseBlockers || []),
      realBlockers: structuredClone(config.realBlockers || []),
    },
    externalEvidenceRequirementIds: [...config.externalRequirementIds],
    externalEvidencePlan,
    promotionNear: config.promotionNear === true,
    semanticConflict: config.semanticConflict === true,
  }
  return typedClaim
}

const configForClaim = claim => {
  if (CLAIM_CONFIGS[claim.claimId]) return CLAIM_CONFIGS[claim.claimId]
  if (DAYUN_CONFIG[claim.claimId]) return buildDayunConfig(claim.claimId)
  throw new Error(`typed readiness config missing: ${claim.claimId}`)
}

const expectedClaimIds = Object.freeze([
  'claim.yuanhai-editorial-responsibility',
  'claim.yuanhai-seasonal-lichun-clause',
  'claim.ziping-yongshin',
  'claim.ziping-xingyun',
  'claim.ziping-xiangshen',
  'claim.qiongtong-spring-jia-wood',
  'claim.sanming-dayun-year-stem-gender-direction',
  'claim.sanming-dayun-term-selection',
  'claim.sanming-dayun-term-distance',
  'claim.sanming-dayun-distance-conversion',
  'claim.sanming-dayun-start-age',
  'claim.sanming-dayun-first-start-time',
  'claim.sanming-dayun-progression',
])

export const SAJU_FIVE_CLASSICS_TYPED_CLAIM_IDS = expectedClaimIds

const ziweiImpactAnalysis = Object.freeze({
  onlyAnalysis: true,
  productionChanged: false,
  readinessRecomputed: false,
  authorityChanged: false,
  reusableElements: [
    { element: 'physical-witness', reusable: 'Exact scan/file identity, direct visual observation, and physical-item identity are separate fields.', migrationRisk: 'A Ziwei scan or catalog record must not be treated as a historical physical witness without item/edition evidence.' },
    { element: 'representation-equivalence', reusable: 'Digital derivation and representation equivalence are checked independently from semantic binding.', migrationRisk: 'Matching PDFs, OCR, IIIF leaves, or institutional hosts may be derivative or same-lineage.' },
    { element: 'semantic-binding', reusable: 'A visible rule surface is kept separate from the semantic coordinate/rule binding it would support.', migrationRisk: 'Ziwei palace/branch/slot or star-rule surfaces can look complete while their semantic frame remains unresolved.' },
    { element: 'independence', reusable: 'The four-axis vector and same-lineage rejection can be reused as a structural vocabulary.', migrationRisk: 'Different institutions or URLs do not establish independent textual lineage.' },
    { element: 'implementation-grounding', reusable: 'Lower stability levels cannot satisfy implementation-safe grounding or activation.', migrationRisk: 'Ziwei structural readiness, semantic authority, and production ordinal must remain separately evaluated.' },
  ],
  migrationRisks: [
    'Do not copy Saju gate outcomes, blocker closures, or claim types into Ziwei.',
    'Do not alter or rejudge Ziwei readiness/blocker/authority artifacts in this contract.',
    'Require Ziwei-specific semantic binding and production-rule scope before any reuse is considered.',
  ],
})

const summarize = claims => ({
  activeClaimCount: claims.length,
  claimTypeCounts: Object.fromEntries(CLAIM_TYPES.map(type => [type, claims.filter(claim => claim.claimType === type).length])),
  gateStateCounts: Object.fromEntries(GATE_KEYS.map(gate => [gate, Object.fromEntries(GATE_STATES.map(state => [state, claims.filter(claim => claim.gates[gate]?.state === state).length]))])),
  promotionNearClaimIds: claims.filter(claim => claim.promotionNear).map(claim => claim.claimId),
  promotionReadyClaimIds: claims.filter(claim => claim.promotion.ready).map(claim => claim.claimId),
  semanticConflictClaimIds: claims.filter(claim => claim.semanticConflict).map(claim => claim.claimId),
})

export function buildSajuFiveClassicsTypedReadinessContract({ basisHead, researchContinuation } = {}) {
  const sourceClaims = researchContinuation?.claims || []
  const sourceClaimIds = sourceClaims.map(claim => claim.claimId)
  if (sourceClaimIds.length !== expectedClaimIds.length || [...sourceClaimIds].sort().join('|') !== [...expectedClaimIds].sort().join('|')) throw new Error('typed readiness requires the current 13 active claims')
  const claims = sourceClaims.map(claim => buildClaim(claim, configForClaim(claim)))
  const artifact = {
    schemaVersion: SAJU_FIVE_CLASSICS_TYPED_READINESS_SCHEMA,
    version: SAJU_FIVE_CLASSICS_TYPED_READINESS_VERSION,
    basisHead,
    predecessor: {
      artifactPath: 'artifacts/saju-five-classics-research-continuation-v1/complete.json',
      schemaVersion: researchContinuation?.schemaVersion || null,
      version: researchContinuation?.version || null,
      contentSha256: researchContinuation?.contentSha256 || null,
      artifactPayloadSha256: researchContinuation?.artifactIdentity?.artifactPayloadSha256 || null,
      activeClaimIds: [...sourceClaimIds].sort(),
    },
    taxonomy: {
      claimTypes: CLAIM_TYPES.map(type => ({ claimType: type, ...structuredClone(CLAIM_TYPE_POLICIES[type]) })),
      gateKeys: { H: 'historical witness observed', E: 'edition/editorial relation or bounded collation', L: 'local lineage/transmission', S: 'semantic equivalence or binding', I: 'independence vector', P: 'promotion decision' },
      requirementStates: { requirements: GATE_REQUIREMENTS, states: GATE_STATES },
      rule: 'not_applicable is admissible only with a claim-type/target scope proof; it is not a bypass.',
    },
    independenceContract: {
      axes: INDEPENDENCE_AXES.map(axis => ({ axis, description: AXIS_DESCRIPTIONS[axis] })),
      sameLineageRule: 'same-lineage or derivative witnesses must not be counted as independent semantic corroboration',
      requiredByClaimType: Object.fromEntries(CLAIM_TYPES.map(type => [type, CLAIM_TYPE_POLICIES[type].independenceAxes])),
    },
    claims,
    externalEvidenceRequirements: EXTERNAL_EVIDENCE_REQUIREMENTS.map(item => structuredClone(item)),
    ziweiImpactAnalysis: structuredClone(ziweiImpactAnalysis),
    readiness: {
      availableForInterpretation: false,
      productionActivation: 'blocked',
      semanticAuthority: 'not_established',
      stableClaimPromotionCount: 0,
      promotionReadyClaimIds: [],
      reason: 'Typed dry-run only; no claim is promoted and no production rule is changed.',
    },
    summary: summarize(claims),
    contentSha256: null,
  }
  artifact.contentSha256 = contentHash(artifact)
  return artifact
}

export function contentHash(artifact) {
  const copy = structuredClone(artifact)
  delete copy.contentSha256
  delete copy.artifactIdentity
  return sha256(copy)
}

const allKnownReferences = researchContinuation => new Set([
  ...(researchContinuation?.sources || []).map(item => item.sourceId),
  ...(researchContinuation?.observations || []).map(item => item.observationId),
  ...(researchContinuation?.claimRelations || []).map(item => item.relationId),
  ...(researchContinuation?.lineageRelations || []).map(item => item.lineageId),
  ...(researchContinuation?.blockers || []).map(item => item.blockerId),
  ...(researchContinuation?.claims || []).map(item => item.claimId),
  ...(researchContinuation?.claims || []).flatMap(item => [
    ...(item.sourceFrontierEvidence?.sourceIds || []),
    ...(item.sourceFrontierEvidence?.pageObservationIds || []),
    ...(item.sourceFrontierEvidence?.claimRelationIds || []),
    ...(item.sourceFrontierEvidence?.blockerIds || []),
  ]),
  ...(researchContinuation?.semanticConflictFindings || []).map(item => item.findingId),
  ...(researchContinuation?.inventory?.predecessorReferenceIds || []),
  ...(researchContinuation?.inventory?.incrementReferenceIds || []),
])

const validateReferenceList = (values, path, known, errors, { required = false } = {}) => {
  if (!Array.isArray(values)) { errors.push(`${path}:array_required`); return }
  if (required && values.length === 0) errors.push(`${path}:reference_required`)
  for (const ref of values) if (!known.has(ref)) errors.push(`${path}:unknown:${ref}`)
}

const validateNAProof = (item, path, errors, known, claimContext = null) => {
  const proof = item.notApplicableProof
  if (!proof || proof.proofType !== 'claim_scope_exclusion' || typeof proof.reason !== 'string' || typeof proof.scopeBoundary !== 'string' || typeof proof.claimType !== 'string' || typeof proof.promotionTarget !== 'string') errors.push(`${path}:na_proof_required`)
  validateReferenceList(proof?.evidenceRefs, `${path}:na_proof_evidence`, known, errors, { required: true })
  if (proof?.claimId !== item.claimId && item.claimId) errors.push(`${path}:na_proof_claim_mismatch`)
  if (proof?.gate !== item.gate) errors.push(`${path}:na_proof_gate_mismatch`)
  if (claimContext && proof?.claimType !== claimContext.claimType) errors.push(`${path}:na_proof_type_mismatch`)
  if (claimContext && proof?.promotionTarget !== claimContext.promotionTarget) errors.push(`${path}:na_proof_target_mismatch`)
}

const validateGate = (claim, gate, typePolicy, known, errors) => {
  const path = `claim:${claim.claimId}:gate:${gate}`
  const item = claim.gates?.[gate]
  if (!item || item.gate !== gate) { errors.push(`${path}:missing`); return }
  if (!GATE_REQUIREMENTS.includes(item.requirement)) errors.push(`${path}:requirement_invalid`)
  if (!GATE_STATES.includes(item.state)) errors.push(`${path}:state_invalid`)
  if (item.policyRequirement !== typePolicy.gates[gate]) errors.push(`${path}:policy_requirement_mismatch`)
  validateReferenceList(item.evidenceRefs, `${path}:evidence`, known, errors)
  if (item.requirement === 'not_applicable') {
    if (item.state !== 'satisfied') errors.push(`${path}:na_state_invalid`)
    validateNAProof(item, path, errors, known, claim)
  }
  if (item.requirement === 'conditionally_required') {
    if (!item.condition || typeof item.condition.applies !== 'boolean' || typeof item.condition.predicate !== 'string') errors.push(`${path}:condition_required`)
    if (item.condition?.applies === false) {
      if (!item.condition.proof || !item.condition.proof.reason) errors.push(`${path}:inactive_condition_proof_required`)
    }
  }
  if (item.state === 'satisfied' && item.requirement !== 'not_applicable') validateReferenceList(item.evidenceRefs, `${path}:satisfied_evidence`, known, errors, { required: true })
  if (item.state !== 'satisfied' && item.requirement !== 'not_applicable' && (!Array.isArray(item.missingEdges) || item.missingEdges.length === 0)) errors.push(`${path}:unresolved_edge_required`)
  if (item.requirement !== item.policyRequirement && !item.requirementOverride && item.requirement !== 'not_applicable') errors.push(`${path}:unproven_requirement_override`)
}

const validateAxis = (claim, axisName, axis, typePolicy, known, errors) => {
  const path = `claim:${claim.claimId}:axis:${axisName}`
  if (!axis || !GATE_REQUIREMENTS.includes(axis.requirement) || !GATE_STATES.includes(axis.state)) { errors.push(`${path}:invalid`); return }
  const policyRequirement = typePolicy.independenceAxes[axisName]
  if (axis.policyRequirement !== policyRequirement) errors.push(`${path}:policy_requirement_mismatch`)
  validateReferenceList(axis.evidenceRefs, `${path}:evidence`, known, errors)
  if (axis.requirement === 'not_applicable') validateNAProof({ ...axis, claimId: claim.claimId, gate: 'I' }, path, errors, known, claim)
  if (axis.state === 'satisfied' && !axis.evidenceRefs?.length) errors.push(`${path}:satisfied_evidence_required`)
  if (axis.state !== 'satisfied' && !axis.missingEdges?.length) errors.push(`${path}:unresolved_edge_required`)
  if (axis.sameLineageCandidate === true && axis.countedAsIndependent === true) errors.push(`${path}:same_lineage_counted_as_independent`)
  if (axis.countedAsIndependent === true && axis.state !== 'satisfied') errors.push(`${path}:unresolved_counted_as_independent`)
}

export function checkSajuFiveClassicsTypedReadinessContract(artifact, { researchContinuation } = {}) {
  const errors = []
  const fail = value => errors.push(value)
  if (!artifact || typeof artifact !== 'object' || Array.isArray(artifact)) return ['artifact_shape_invalid']
  if (artifact.schemaVersion !== SAJU_FIVE_CLASSICS_TYPED_READINESS_SCHEMA) fail('schema_version')
  if (artifact.version !== SAJU_FIVE_CLASSICS_TYPED_READINESS_VERSION) fail('version')
  if (artifact.readiness?.availableForInterpretation !== false || artifact.readiness?.productionActivation !== 'blocked' || artifact.readiness?.semanticAuthority !== 'not_established' || artifact.readiness?.stableClaimPromotionCount !== 0) fail('readiness_or_activation')
  if ((artifact.readiness?.promotionReadyClaimIds || []).length !== 0) fail('promotion_ids_nonempty')
  if (!artifact.taxonomy?.rule?.includes('not_applicable') || !artifact.independenceContract?.sameLineageRule?.includes('must not be counted')) fail('boundary_rule_missing')
  const ziwei = artifact.ziweiImpactAnalysis
  if (ziwei?.onlyAnalysis !== true || ziwei?.productionChanged !== false || ziwei?.readinessRecomputed !== false || ziwei?.authorityChanged !== false) fail('ziwei_scope')
  for (const type of CLAIM_TYPES) {
    const item = artifact.taxonomy?.claimTypes?.find(candidate => candidate.claimType === type)
    if (!item) fail(`claim_type_missing:${type}`)
  }
  const expectedIds = [...(researchContinuation?.claims || [])].map(claim => claim.claimId).sort()
  const actualIds = (artifact.claims || []).map(claim => claim.claimId).sort()
  if (expectedIds.length !== expectedClaimIds.length || actualIds.join('|') !== expectedIds.join('|')) fail('active_claim_set_not_13')
  const known = allKnownReferences(researchContinuation)
  const seen = new Set()
  for (const claim of artifact.claims || []) {
    if (seen.has(claim.claimId)) fail(`claim_duplicate:${claim.claimId}`)
    seen.add(claim.claimId)
    if (!CLAIM_TYPES.includes(claim.claimType)) fail(`claim_type_invalid:${claim.claimId}`)
    if (!PROMOTION_TARGETS.includes(claim.promotionTarget)) fail(`promotion_target_invalid:${claim.claimId}`)
    const typePolicy = CLAIM_TYPE_POLICIES[claim.claimType]
    for (const gate of GATE_KEYS) validateGate(claim, gate, typePolicy, known, errors)
    for (const axis of INDEPENDENCE_AXES) validateAxis(claim, axis, claim.independence?.axes?.[axis], typePolicy, known, errors)
    if (claim.independence?.overallState !== claim.gates?.I?.state) fail(`independence_state_mismatch:${claim.claimId}`)
    for (const blockerKind of ['falseBlockers', 'realBlockers']) {
      const blockers = claim.blockerAssessment?.[blockerKind]
      if (!Array.isArray(blockers)) {
        fail(`blocker_assessment_missing:${claim.claimId}:${blockerKind}`)
        continue
      }
      for (const [index, blocker] of blockers.entries()) {
        const path = `claim:${claim.claimId}:blocker:${blockerKind}:${index}`
        if (!blocker || typeof blocker.edge !== 'string' || !blocker.edge.trim() || typeof blocker.reason !== 'string' || !blocker.reason.trim()) fail(`${path}:metadata_required`)
        validateReferenceList(blocker?.blockerRefs, `${path}:refs`, known, errors)
      }
    }
    if (claim.promotion?.ready !== false || claim.promotion?.status !== 'blocked') fail(`claim_promoted:${claim.claimId}`)
    if (claim.stabilityAssessment?.implementationSafeGrounding === 'satisfied' && claim.currentStabilityLevel !== 'implementation_safe_grounding') fail(`lower_stability_promoted:${claim.claimId}`)
    if (claim.semanticConflict && claim.promotion?.status !== 'blocked') fail(`semantic_conflict_promoted:${claim.claimId}`)
    if (claim.semanticConflict && claim.gates?.S?.state !== 'conflicted') fail(`semantic_conflict_gate_missing:${claim.claimId}`)
    for (const ref of claim.predecessor?.sourceFrontierEvidence?.sourceIds || []) if (!known.has(ref)) fail(`claim_source_ref:${claim.claimId}:${ref}`)
    for (const ref of claim.predecessor?.sourceFrontierEvidence?.pageObservationIds || []) if (!known.has(ref)) fail(`claim_observation_ref:${claim.claimId}:${ref}`)
  }
  const externalRequirements = Array.isArray(artifact.externalEvidenceRequirements) ? artifact.externalEvidenceRequirements : []
  const externalById = new Map()
  for (const item of externalRequirements) {
    if (!item || typeof item !== 'object' || typeof item.requirementId !== 'string' || externalById.has(item.requirementId)) {
      fail('external_requirement_shape_or_duplicate')
      continue
    }
    externalById.set(item.requirementId, item)
    if (typeof item.claimId !== 'string' || typeof item.priority !== 'string' || typeof item.missingEdge !== 'string' || !item.missingEdge.trim() || typeof item.evidenceKind !== 'string' || !item.evidenceKind.trim()) fail(`external_requirement_metadata:${item.requirementId}`)
    if (!Array.isArray(item.exactAcquisition) || item.exactAcquisition.length === 0 || item.exactAcquisition.some(value => typeof value !== 'string' || !value.trim())) fail(`external_requirement_acquisition:${item.requirementId}`)
    if (!Array.isArray(item.acceptanceCriteria) || item.acceptanceCriteria.length === 0 || item.acceptanceCriteria.some(value => typeof value !== 'string' || !value.trim())) fail(`external_requirement_acceptance:${item.requirementId}`)
  }
  const claimsById = new Map((artifact.claims || []).map(claim => [claim.claimId, claim]))
  for (const claim of artifact.claims || []) {
    const requirementIds = Array.isArray(claim.externalEvidenceRequirementIds) ? claim.externalEvidenceRequirementIds : []
    if (!Array.isArray(claim.externalEvidenceRequirementIds)) fail(`external_requirement_ids_array:${claim.claimId}`)
    const plans = Array.isArray(claim.externalEvidencePlan) ? claim.externalEvidencePlan : []
    if (!Array.isArray(claim.externalEvidencePlan)) fail(`external_plan_required:${claim.claimId}`)
    const planIds = plans.map(plan => plan?.requirementId).sort()
    if (planIds.join('|') !== [...requirementIds].sort().join('|')) fail(`external_plan_mapping:${claim.claimId}`)
    if (claim.promotionNear && plans.length === 0) fail(`external_plan_required:${claim.claimId}`)
    for (const id of requirementIds) {
      const requirement = externalById.get(id)
      const plan = plans.find(item => item?.requirementId === id)
      if (!requirement) {
        fail(`external_requirement_missing:${claim.claimId}:${id}`)
        continue
      }
      if (!plan) {
        fail(`external_plan_item_missing:${claim.claimId}:${id}`)
        continue
      }
      if (plan.claimId !== claim.claimId || plan.currentState?.status !== 'blocked' || plan.currentState?.claimType !== claim.claimType || plan.currentState?.currentStabilityLevel !== claim.currentStabilityLevel || plan.currentState?.promotionTarget !== claim.promotionTarget || plan.currentState?.promotionNear !== claim.promotionNear) fail(`external_plan_state:${claim.claimId}:${id}`)
      if (canonicalIdentityJson([...(plan.currentState?.missingEdges || [])].sort()) !== canonicalIdentityJson([...(claim.promotion?.blockingEdges || [])].sort())) fail(`external_plan_edges:${claim.claimId}:${id}`)
      if (plan.missingEdge !== requirement.missingEdge || canonicalIdentityJson(plan.exactAcquisition) !== canonicalIdentityJson(requirement.exactAcquisition) || canonicalIdentityJson(plan.acceptanceCriteria) !== canonicalIdentityJson(requirement.acceptanceCriteria)) fail(`external_plan_payload:${claim.claimId}:${id}`)
    }
  }
  for (const item of externalRequirements) {
    const claim = claimsById.get(item.claimId)
    if (!claim || !(claim.externalEvidenceRequirementIds || []).includes(item.requirementId)) fail(`external_requirement_orphan:${item.requirementId}`)
  }
  const summary = summarize(artifact.claims || [])
  if (canonicalIdentityJson(summary) !== canonicalIdentityJson(artifact.summary)) fail('summary_mismatch')
  if (artifact.summary?.promotionReadyClaimIds?.length !== 0) fail('summary_promotion_ids_nonempty')
  if (artifact.contentSha256 !== contentHash(artifact)) fail('content_hash')
  const xiangshen = artifact.claims?.find(claim => claim.claimId === 'claim.ziping-xiangshen')
  if (xiangshen && xiangshen.independence.axes['edition/textual-lineage']?.sameLineageCandidate && xiangshen.independence.axes['edition/textual-lineage']?.countedAsIndependent) fail('same_lineage_independence_negative')
  return [...new Set(errors)].sort()
}

export const SAJU_FIVE_CLASSICS_TYPED_READINESS_INTERNALS = Object.freeze({
  AXIS_DESCRIPTIONS,
  CLAIM_TYPE_POLICIES,
  EXTERNAL_EVIDENCE_REQUIREMENTS,
  GATE_KEYS,
  GATE_REQUIREMENTS,
  GATE_STATES,
  INDEPENDENCE_AXES,
  PROMOTION_TARGETS,
  CLAIM_CONFIGS,
  DAYUN_CONFIG,
})

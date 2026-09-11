import { evaluateInterpretationConstitution, isDeterministicFactRef, validateDeterministicBaseForInterpretation } from '../interpretationConstitution.js'

/**
 * Ziwei interpretation-prep contracts.
 *
 * This module is intentionally an evidence transport and authorization
 * boundary. It does not calculate a chart, assign palace meanings, choose a
 * tradition, generate a hypothesis, store a user response, or mutate
 * activation. The only source material admitted here is the frozen repository
 * frontier; unresolved source identity, semantic binding, and oracle gaps are
 * represented as state rather than repaired.
 */

export const ZIWEI_EVIDENCE_SCHEMA = 'ziwei-lineage-handoff-evidence-v0'
export const ZIWEI_EVIDENCE_VERSION = '0.1.0'
export const ZIWEI_EVIDENCE_KIND = 'precomputed_ziwei_lineage_evidence'

export const ZIWEI_CONSUMPTION_SCHEMA = 'ziwei-evidence-consumption-v0'
export const ZIWEI_CONSUMPTION_VERSION = '0.1.0'
export const ZIWEI_CONSUMPTION_KIND = 'ziwei_conversational_evidence_use_contract'

export const ZIWEI_HANDOFF_SCHEMA = 'ziwei-conversational-handoff-package-v0'
export const ZIWEI_HANDOFF_VERSION = '0.1.0'
export const ZIWEI_HANDOFF_KIND = 'canonical_ziwei_conversational_handoff_package'

export const ZIWEI_HYPOTHESIS_SUBMISSION_SCHEMA = 'ziwei-hypothesis-submission-v0'
export const ZIWEI_HYPOTHESIS_SUBMISSION_VERSION = '0.1.0'
export const ZIWEI_HYPOTHESIS_SUBMISSION_KIND = 'external_ziwei_hypothesis_submission'
export const ZIWEI_HYPOTHESIS_VALIDATION_SCHEMA = 'ziwei-hypothesis-submission-validation-v0'
export const ZIWEI_HYPOTHESIS_VALIDATION_VERSION = '0.1.0'
export const ZIWEI_HYPOTHESIS_VALIDATION_KIND = 'validated_ziwei_hypothesis_submission'

export const ZIWEI_AUTHORIZATION_REQUEST_SCHEMA = 'ziwei-hypothesis-discussion-authorization-request-v0'
export const ZIWEI_AUTHORIZATION_REQUEST_VERSION = '0.1.0'
export const ZIWEI_AUTHORIZATION_REQUEST_KIND = 'external_ziwei_hypothesis_discussion_authorization_request'
export const ZIWEI_AUTHORIZATION_SCHEMA = 'ziwei-hypothesis-discussion-authorization-v0'
export const ZIWEI_AUTHORIZATION_VERSION = '0.1.0'
export const ZIWEI_AUTHORIZATION_KIND = 'validated_ziwei_hypothesis_discussion_authorization'

export const ZIWEI_CONFIRMATION_STATES = Object.freeze(['declined', 'uncertain', 'confirmed'])
export const ZIWEI_DISCUSSION_PERMISSIONS = Object.freeze(['discussion_allowed', 'explore_only', 'reject'])

const clone = value => JSON.parse(JSON.stringify(value))
const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value)
const isNonEmptyString = value => typeof value === 'string' && value.trim().length > 0
const unique = values => [...new Set(values)]
const same = (left, right) => JSON.stringify(left) === JSON.stringify(right)

function addError(errors, error) {
  if (!errors.includes(error)) errors.push(error)
}

function exactKeys(value, expected, path, errors) {
  if (!isObject(value)) {
    addError(errors, `${path}:not_object`)
    return
  }
  for (const key of expected) if (!Object.hasOwn(value, key)) addError(errors, `${path}:missing:${key}`)
  for (const key of Object.keys(value)) if (!expected.includes(key)) addError(errors, `${path}:unexpected:${key}`)
}

function stringArray(value, path, errors, { required = false } = {}) {
  if (!Array.isArray(value)) {
    addError(errors, `${path}:not_array`)
    return []
  }
  if (required && value.length === 0) addError(errors, `${path}:empty`)
  if (value.some(item => !isNonEmptyString(item))) addError(errors, `${path}:invalid_item`)
  if (new Set(value).size !== value.length) addError(errors, `${path}:duplicate`)
  return value
}

/*
 * These are source identities already present in the repository's Ziwei
 * research frontier. Hashes are recorded only where the frontier recorded
 * bytes; a null hash is deliberate and means that source bytes are not part
 * of this runtime envelope. None of these records is admitted as semantic
 * authority.
 */
export const ZIWEI_SOURCE_PROFILES = Object.freeze([
  Object.freeze({
    sourceId: 'nanbei_shanren',
    lineageId: 'ziwei.nanbei_shanren',
    work: '紫微斗數全書',
    editionIdentity: '南北山人本 · local scan candidate',
    identityStatus: 'candidate',
    independenceStatus: 'not_established',
    authorityStatus: 'unresolved',
    byteSha256: '4786a94ab454acdabf9716d7c0db4756dbcbde99a88bc45fda254863c1961023',
    sourceBytesStatus: 'observed_outside_repository',
  }),
  Object.freeze({
    sourceId: 'ming_nanyangtang',
    lineageId: 'ziwei.ming_nanyangtang',
    work: '新锓希夷陳先生紫微斗數全書',
    editionIdentity: '明代南陽堂刊本 · local scan candidate',
    identityStatus: 'candidate',
    independenceStatus: 'duplicate_or_unresolved',
    authorityStatus: 'unresolved',
    byteSha256: '04e184c4a52cb042dc885c6ccc9135d94ab25de62007506198ee979a33e66bfc',
    sourceBytesStatus: 'observed_outside_repository',
  }),
  Object.freeze({
    sourceId: 'nara_f1000000000000101426',
    lineageId: 'ziwei.nara.catalog-record-f1000000000000101426',
    work: '新锓希夷陳先生紫微斗數全書',
    editionIdentity: 'NARA catalog record F1000000000000101426; files 1078787/volume leaf frontier',
    identityStatus: 'catalog_closed_semantic_unresolved',
    independenceStatus: 'same_record_not_independent',
    authorityStatus: 'unresolved',
    byteSha256: null,
    sourceBytesStatus: 'not_embedded',
  }),
  Object.freeze({
    sourceId: 'toyo_1646',
    lineageId: 'ziwei.toyo-1646',
    work: '紫微斗數全書 witness candidate',
    editionIdentity: 'Toyo/AKS TOYO_1646 VII-3-157 candidate',
    identityStatus: 'candidate',
    independenceStatus: 'not_established',
    authorityStatus: 'unresolved',
    byteSha256: null,
    sourceBytesStatus: 'not_embedded',
  }),
])

export const ZIWEI_SOURCE_LOCATORS = Object.freeze([
  Object.freeze({ locatorId: 'nanbei-p7-twelve-cell-diagram', sourceId: 'nanbei_shanren', label: 'Nanbei p.7 twelve-cell diagram' }),
  Object.freeze({ locatorId: 'nanbei-p8-ming-shen-rule', sourceId: 'nanbei_shanren', label: 'Nanbei p.8 命宮·身宮 rule surface' }),
  Object.freeze({ locatorId: 'nanbei-p13-sanshiwu-series-rule', sourceId: 'nanbei_shanren', label: 'Nanbei p.13 三十五 star-series wording' }),
  Object.freeze({ locatorId: 'nanbei-p13-sanshisi-tianfu-root', sourceId: 'nanbei_shanren', label: 'Nanbei p.13 三十四 安天府 root' }),
  Object.freeze({ locatorId: 'nanbei-p14-printed-36-zuofu-youbi', sourceId: 'nanbei_shanren', label: 'Nanbei printed p.36 左輔·右弼 witness' }),
  Object.freeze({ locatorId: 'nanbei-p15-printed-38-wenchang-wenqu', sourceId: 'nanbei_shanren', label: 'Nanbei printed p.38 文昌·文曲 witness' }),
  Object.freeze({ locatorId: 'nanbei-p16-printed-40-tiankui-tianyue', sourceId: 'nanbei_shanren', label: 'Nanbei printed p.40 天魁·天鉞 witness' }),
  Object.freeze({ locatorId: 'nanbei-p17-printed-42-four-transformations-table', sourceId: 'nanbei_shanren', label: 'Nanbei printed p.42 four-transformations table' }),
  Object.freeze({ locatorId: 'nanyang-p148-series-rule', sourceId: 'ming_nanyangtang', label: 'Nanyang p.148 star-series witness' }),
  Object.freeze({ locatorId: 'nanyang-p151-152-tianfu-series', sourceId: 'ming_nanyangtang', label: 'Nanyang p.151–152 Tianfu-series witness' }),
  Object.freeze({ locatorId: 'nanyang-p159-160-four-transformations', sourceId: 'ming_nanyangtang', label: 'Nanyang p.159–160 transformations/chart witness' }),
  Object.freeze({ locatorId: 'nara-v2-leaves-64-80', sourceId: 'nara_f1000000000000101426', label: 'NARA volume 2 leaves 64–80 repeated chart frontier' }),
  Object.freeze({ locatorId: 'nara-v1-leaves-84-88', sourceId: 'nara_f1000000000000101426', label: 'NARA volume 1 leaves 84–88 bureau/branch/table frontier' }),
  Object.freeze({ locatorId: 'toyo-vii3-157', sourceId: 'toyo_1646', label: 'Toyo/AKS TOYO_1646 VII-3-157 candidate witness' }),
])

const PROFILE_BY_ID = new Map(ZIWEI_SOURCE_PROFILES.map(profile => [profile.sourceId, profile]))
const LOCATOR_BY_ID = new Map(ZIWEI_SOURCE_LOCATORS.map(locator => [locator.locatorId, locator]))

const ZIWEI_SOURCE_FRONTIER = Object.freeze([
  Object.freeze({
    id: 'ziwei.source-observation.ming-shen-rule',
    status: 'candidate',
    relation: 'neutral',
    evidenceRole: 'source_observation',
    lineages: ['ziwei.nanbei_shanren'],
    sourceIds: ['nanbei_shanren'],
    locatorIds: ['nanbei-p8-ming-shen-rule'],
    statement: '원전 페이지에서 명궁·신궁의 기점과 순·역수 표면은 관찰되지만, 12궁명·물리 슬롯·production ordinal의 완전한 의미 결속은 닫히지 않았다.',
  }),
  Object.freeze({
    id: 'ziwei.source-observation.major-star-series',
    status: 'candidate',
    relation: 'neutral',
    evidenceRole: 'source_observation',
    lineages: ['ziwei.nanbei_shanren'],
    sourceIds: ['nanbei_shanren'],
    locatorIds: ['nanbei-p13-sanshiwu-series-rule', 'nanbei-p13-sanshisi-tianfu-root'],
    statement: '14주성 계열 문구와 천부 기점 표면은 source-local 관찰로 전달할 수 있으나, 천부 raw formula와 semantic authority는 unresolved로 남는다.',
  }),
  Object.freeze({
    id: 'ziwei.source-observation.minor-stars',
    status: 'candidate',
    relation: 'neutral',
    evidenceRole: 'source_observation',
    lineages: ['ziwei.nanbei_shanren', 'ziwei.ming_nanyangtang'],
    sourceIds: ['nanbei_shanren', 'ming_nanyangtang'],
    locatorIds: ['nanbei-p14-printed-36-zuofu-youbi', 'nanbei-p15-printed-38-wenchang-wenqu', 'nanbei-p16-printed-40-tiankui-tianyue', 'nanyang-p148-series-rule'],
    statement: '6길성 관련 페이지 표면은 두 scan lineage의 source observation으로 보존하지만, 독립 oracle·공통 규칙·개인 의미로 승격하지 않는다.',
  }),
  Object.freeze({
    id: 'ziwei.source-observation.four-transformations',
    status: 'candidate',
    relation: 'neutral',
    evidenceRole: 'source_observation',
    lineages: ['ziwei.nanbei_shanren', 'ziwei.ming_nanyangtang'],
    sourceIds: ['nanbei_shanren', 'ming_nanyangtang'],
    locatorIds: ['nanbei-p17-printed-42-four-transformations-table', 'nanyang-p159-160-four-transformations'],
    statement: '생년 천간과 사화 표면은 locator-bound observation으로 전달하되, 표의 완전한 독립 검증이나 해석 의미는 확정하지 않는다.',
  }),
  Object.freeze({
    id: 'ziwei.source-state.palace-semantic-identity',
    status: 'unresolved',
    relation: 'neutral',
    evidenceRole: 'source_state',
    lineages: ['ziwei.nanbei_shanren', 'ziwei.nara.catalog-record-f1000000000000101426'],
    sourceIds: ['nanbei_shanren', 'nara_f1000000000000101426'],
    locatorIds: ['nanbei-p7-twelve-cell-diagram', 'nanbei-p8-ming-shen-rule', 'nara-v2-leaves-64-80'],
    statement: 'branch token ↔ palace name ↔ physical chart slot ↔ production ordinal의 12개 결속이 닫히지 않아 궁명 기반 semantic 소비를 차단한다.',
  }),
  Object.freeze({
    id: 'ziwei.source-state.nara-witness-frontier',
    status: 'unresolved',
    relation: 'neutral',
    evidenceRole: 'source_state',
    lineages: ['ziwei.nara.catalog-record-f1000000000000101426'],
    sourceIds: ['nara_f1000000000000101426'],
    locatorIds: ['nara-v1-leaves-84-88', 'nara-v2-leaves-64-80'],
    statement: 'NARA의 실제 leaf frontier와 catalog identity는 기록되었지만 같은 catalog record의 두 volume이며 완전한 semantic witness 또는 독립 명반 oracle이 아니다.',
  }),
  Object.freeze({
    id: 'ziwei.source-state.toyo-witness-frontier',
    status: 'unresolved',
    relation: 'neutral',
    evidenceRole: 'source_state',
    lineages: ['ziwei.toyo-1646'],
    sourceIds: ['toyo_1646'],
    locatorIds: ['toyo-vii3-157'],
    statement: 'Toyo/AKS candidate는 별도 source frontier로 보존하지만 edition lineage·권리·semantic binding이 닫히지 않아 authority로 사용하지 않는다.',
  }),
  Object.freeze({
    id: 'ziwei.source-conflict.tianfu-raw-placement',
    status: 'conflict',
    relation: 'conflicts',
    evidenceRole: 'source_conflict',
    lineages: ['ziwei.nanbei_shanren', 'ziwei.ming_nanyangtang'],
    sourceIds: ['nanbei_shanren', 'ming_nanyangtang'],
    locatorIds: ['nanbei-p13-sanshisi-tianfu-root', 'nanyang-p151-152-tianfu-series'],
    statement: '천부 raw anchor/전개 표면의 불일치가 보존된 conflict이다. 어느 공식을 승자로 선택하거나 회전 표현을 semantic authority로 바꾸지 않는다.',
    conflictId: 'ziwei.conflict.tianfu-raw-placement',
  }),
  Object.freeze({
    id: 'ziwei.source-state.timing',
    status: 'unsupported',
    relation: 'neutral',
    evidenceRole: 'support_scope',
    lineages: [],
    sourceIds: [],
    locatorIds: [],
    statement: '운한·시기 계산은 현재 Ziwei interpretation-prep 범위에 포함되지 않는다.',
  }),
  Object.freeze({
    id: 'ziwei.source-state.brightness',
    status: 'unsupported',
    relation: 'neutral',
    evidenceRole: 'support_scope',
    lineages: [],
    sourceIds: [],
    locatorIds: [],
    statement: '묘왕리함/brightness는 현재 source-bounded evidence와 계산 계약에서 지원되지 않는다.',
  }),
  Object.freeze({
    id: 'ziwei.source-state.extended-minor-stars',
    status: 'unsupported',
    relation: 'neutral',
    evidenceRole: 'support_scope',
    lineages: [],
    sourceIds: [],
    locatorIds: [],
    statement: '6길성 밖의 확장 성요와 잡성은 현재 공개 범위에서 지원되지 않는다.',
  }),
  Object.freeze({
    id: 'ziwei.source-state.external-oracle',
    status: 'blocked',
    relation: 'neutral',
    evidenceRole: 'readiness_state',
    lineages: [],
    sourceIds: [],
    locatorIds: [],
    statement: '독립 외부 명반 oracle과 전수 대조가 없어 deterministic calculation을 externally verified claim으로 승격하지 않는다.',
  }),
  Object.freeze({
    id: 'ziwei.source-state.calendar-time-identity',
    status: 'blocked',
    relation: 'neutral',
    evidenceRole: 'readiness_state',
    lineages: [],
    sourceIds: [],
    locatorIds: [],
    statement: '음력 변환·시각·달력 source identity가 production authority 수준으로 닫히지 않아 그 의미 범위는 현재 차단한다.',
  }),
])

const ENVELOPE_BOUNDARY = Object.freeze({
  precomputedOnly: true,
  noRecalculation: true,
  factsAndSourceEvidenceSeparate: true,
  noPalaceSemanticPromotion: true,
  noPersonalMeaning: true,
  noCrossLineageMerge: true,
  noWinnerSelection: true,
  unresolvedPreserved: true,
  conflictsPreserved: true,
  sourceAuthorityPromotion: false,
  claimPromotion: false,
  interpretationHypothesis: false,
  activationMutation: false,
})

const CONSUMPTION_BOUNDARY = Object.freeze({
  precomputedEvidenceOnly: true,
  noRecalculation: true,
  factsAndSourceEvidenceSeparate: true,
  noCrossLineageSynthesis: true,
  unresolvedPreserved: true,
  conflictsPreserved: true,
  noHypothesisGenerated: true,
  noResponseStorage: true,
  noResponseClassification: true,
  noPersonalizationEngine: true,
  noGlobalActivation: true,
})

const HYPOTHESIS_BOUNDARY = Object.freeze({
  submissionOnly: true,
  noHypothesisGeneration: true,
  noRecalculation: true,
  noMeaningAddition: true,
  noCrossLineageSynthesis: true,
  unresolvedPreserved: true,
  conflictsPreserved: true,
  userContextIsNotSourceValidation: true,
  noDefinitivePersonalization: true,
  noResponseStorage: true,
  noResponseClassification: true,
  noActivationMutation: true,
})

const AUTHORIZATION_BOUNDARY = Object.freeze({
  oneHypothesisOnly: true,
  noOtherHypotheses: true,
  noCrossHypothesisExpansion: true,
  noPersonalityTraits: true,
  noDefinitivePersonalization: true,
  noCrossLineageSynthesis: true,
  unresolvedAndConflictRemainPreserved: true,
  confirmationIsNotEvidenceValidation: true,
  noRecalculation: true,
  noResponseStorage: true,
  noResponseClassification: true,
  noPersonalizationEngine: true,
  globalInterpretationActivation: 'never_promoted_by_this_contract',
  activationMutation: 'forbidden',
})

function sourceRefs(sourceIds = [], locatorIds = []) {
  return {
    sourceIds: [...sourceIds],
    locatorIds: [...locatorIds],
    sourceByteSha256: Object.fromEntries(sourceIds.map(sourceId => [sourceId, PROFILE_BY_ID.get(sourceId)?.byteSha256 ?? null])),
  }
}

function sourceIdentityRefs(sourceIds) {
  return sourceIds.map(sourceId => clone(PROFILE_BY_ID.get(sourceId)))
}

function locatorRefs(locatorIds) {
  return locatorIds.map(locatorId => clone(LOCATOR_BY_ID.get(locatorId)))
}

function allSourceIds(records) {
  return unique(records.flatMap(record => record.sourceIds || []))
}

function allLocatorIds(records) {
  return unique(records.flatMap(record => record.locatorIds || []))
}

function makeBaseFact(factRef) {
  return {
    id: `ziwei.base-fact.${encodeURIComponent(factRef)}`,
    kind: 'base_fact',
    status: 'available',
    admission: 'base_contract',
    relation: 'neutral',
    factRefs: [factRef],
    evidenceRole: 'public_deterministic_base_fact',
    provenance: {
      schema: ZIWEI_EVIDENCE_SCHEMA,
      version: ZIWEI_EVIDENCE_VERSION,
      lane: 'fact',
      baseFactRefs: [factRef],
    },
  }
}

function makeSourceEvidence(def, baseFactRefs = []) {
  return {
    id: def.id,
    kind: 'literature_claim',
    status: def.status,
    admission: 'semantic_candidate',
    relation: def.relation,
    statement: def.statement,
    evidenceRole: def.evidenceRole,
    semanticBasisEligible: false,
    lineage: def.lineages.length === 1 ? def.lineages[0] : null,
    lineages: [...def.lineages],
    factRefs: [...(def.evidenceRole === 'source_observation' ? baseFactRefs : [])],
    sourceRefs: sourceRefs(def.sourceIds, def.locatorIds),
    provenance: {
      schema: ZIWEI_EVIDENCE_SCHEMA,
      version: ZIWEI_EVIDENCE_VERSION,
      lane: 'source',
      evidenceId: def.id,
      sourceIds: [...def.sourceIds],
      locatorIds: [...def.locatorIds],
      sourceByteSha256: sourceRefs(def.sourceIds, def.locatorIds).sourceByteSha256,
      baseFactRefs: def.evidenceRole === 'source_observation' ? [...baseFactRefs] : [],
      sourceIdentityStatus: 'unresolved_or_candidate',
      semanticAuthority: 'unresolved',
    },
    conflictId: def.conflictId || null,
  }
}

function expectedState(sourceEvidence) {
  return {
    candidateEvidenceIds: sourceEvidence.filter(item => item.status === 'candidate').map(item => item.id),
    unresolvedEvidenceIds: sourceEvidence.filter(item => item.status === 'unresolved').map(item => item.id),
    unsupportedEvidenceIds: sourceEvidence.filter(item => item.status === 'unsupported').map(item => item.id),
    blockedEvidenceIds: sourceEvidence.filter(item => item.status === 'blocked').map(item => item.id),
    conflictEvidenceIds: sourceEvidence.filter(item => item.relation === 'conflicts').map(item => item.id),
    conflictLedger: sourceEvidence.filter(item => item.relation === 'conflicts').map(item => ({
      id: item.conflictId,
      evidenceIds: [item.id],
      resolution: 'preserved_tension',
    })),
  }
}

function expectedReadiness() {
  return {
    boundedEvidenceConsumptionReady: true,
    sourceSemanticEvidenceAvailable: false,
    interpretationHypothesisReady: false,
    perHypothesisAuthorizationAvailable: true,
    userExperienceGate: 'required_before_personal_application',
    userExperienceProvided: false,
    blockers: [
      'source_semantic_authority_not_closed',
      'independent_external_oracle_missing',
      'palace_semantic_identity_unresolved',
      'unresolved_and_conflict_states_must_remain_visible',
    ],
    reason: 'Ziwei FACT and bounded source states can be consumed; semantic hypotheses remain closed until source identity, semantic binding, and independent validation are separately closed',
  }
}

function expectedBaseFactRefs(base) {
  const refs = [
    'systems.ziwei.fact.majorStarCoordinates',
    'systems.ziwei.fact.luckyStarCoordinates',
  ]
  return refs.filter(ref => isDeterministicFactRef(base, ref))
}

function blockedBuild(errors, base = null) {
  return {
    valid: false,
    errors: unique(errors).sort(),
    envelope: null,
    baseValidation: base ? validateDeterministicBaseForInterpretation(base) : null,
  }
}

function validateSourceRefs(item, errors, path) {
  const refs = item?.sourceRefs
  if (!isObject(refs)) {
    addError(errors, `${path}:source_refs_missing`)
    return
  }
  const sourceIds = stringArray(refs.sourceIds, `${path}.sourceRefs.sourceIds`, errors)
  const locatorIds = stringArray(refs.locatorIds, `${path}.sourceRefs.locatorIds`, errors)
  if (!isObject(refs.sourceByteSha256)) addError(errors, `${path}.sourceRefs.sourceByteSha256:not_object`)
  else {
    const expected = sourceRefs(sourceIds, locatorIds).sourceByteSha256
    if (!same(refs.sourceByteSha256, expected)) addError(errors, `${path}:source_hash_mismatch`)
  }
  for (const sourceId of sourceIds) if (!PROFILE_BY_ID.has(sourceId)) addError(errors, `${path}:unknown_source:${sourceId}`)
  for (const locatorId of locatorIds) {
    const locator = LOCATOR_BY_ID.get(locatorId)
    if (!locator) addError(errors, `${path}:unknown_locator:${locatorId}`)
    else if (!sourceIds.includes(locator.sourceId)) addError(errors, `${path}:locator_source_not_declared:${locatorId}`)
  }
}

function validateEnvelope(envelope, base) {
  const errors = []
  const baseValidation = validateDeterministicBaseForInterpretation(base)
  if (!baseValidation.valid) errors.push(...baseValidation.errors.map(error => `base:${error}`))
  if (!isObject(envelope)) return { valid: false, errors: ['envelope_not_object', ...errors].sort(), baseValidation }

  exactKeys(envelope, ['schemaVersion', 'version', 'kind', 'baseContract', 'evidence', 'state', 'provenance', 'boundary', 'readiness'], '$', errors)
  if (envelope.schemaVersion !== ZIWEI_EVIDENCE_SCHEMA || envelope.version !== ZIWEI_EVIDENCE_VERSION || envelope.kind !== ZIWEI_EVIDENCE_KIND) addError(errors, 'envelope_schema_mismatch')

  exactKeys(envelope.baseContract, ['schemaVersion', 'foundationVersion', 'factRefs'], 'baseContract', errors)
  if (envelope.baseContract?.schemaVersion !== base?.schemaVersion || envelope.baseContract?.foundationVersion !== base?.foundationVersion) addError(errors, 'base_contract_identity_mismatch')
  const expectedFactRefs = expectedBaseFactRefs(base)
  const factRefs = stringArray(envelope.baseContract?.factRefs, 'baseContract.factRefs', errors, { required: true })
  if (!same(factRefs, expectedFactRefs)) addError(errors, 'base_fact_refs_not_equal_to_public_ziwei_frontier')
  for (const factRef of factRefs) if (!isDeterministicFactRef(base, factRef)) addError(errors, `base_fact_ref_invalid:${factRef}`)

  exactKeys(envelope.evidence, ['baseFacts', 'sourceEvidence'], 'evidence', errors)
  const baseFacts = Array.isArray(envelope.evidence?.baseFacts) ? envelope.evidence.baseFacts : []
  const sourceEvidence = Array.isArray(envelope.evidence?.sourceEvidence) ? envelope.evidence.sourceEvidence : []
  if (baseFacts.length !== expectedFactRefs.length) addError(errors, 'base_fact_record_count_mismatch')
  const allIds = []
  for (const [index, item] of baseFacts.entries()) {
    const path = `evidence.baseFacts[${index}]`
    exactKeys(item, ['id', 'kind', 'status', 'admission', 'relation', 'factRefs', 'evidenceRole', 'provenance'], path, errors)
    if (item?.kind !== 'base_fact' || item?.status !== 'available' || item?.admission !== 'base_contract' || item?.relation !== 'neutral' || item?.evidenceRole !== 'public_deterministic_base_fact') addError(errors, `${path}:base_fact_contract_invalid`)
    const refs = stringArray(item?.factRefs, `${path}.factRefs`, errors, { required: true })
    if (refs.length !== 1 || !expectedFactRefs.includes(refs[0])) addError(errors, `${path}:fact_ref_invalid`)
    if (item?.id) allIds.push(item.id)
    validateProvenance(item?.provenance, path, errors)
  }
  for (const [index, item] of sourceEvidence.entries()) {
    const path = `evidence.sourceEvidence[${index}]`
    exactKeys(item, ['id', 'kind', 'status', 'admission', 'relation', 'statement', 'evidenceRole', 'semanticBasisEligible', 'lineage', 'lineages', 'factRefs', 'sourceRefs', 'provenance', 'conflictId'], path, errors)
    if (!isNonEmptyString(item?.id) || item.id.startsWith('ziwei.')) {
      // accepted ID namespace is deliberately fixed below by frontier lookup
    }
    const def = ZIWEI_SOURCE_FRONTIER.find(candidate => candidate.id === item?.id)
    if (!def) addError(errors, `${path}:source_frontier_item_unknown`)
    else {
      const expected = makeSourceEvidence(def, def.evidenceRole === 'source_observation' ? expectedFactRefs : [])
      if (!same(item, expected)) addError(errors, `${path}:source_frontier_item_mismatch`)
    }
    if (item?.kind !== 'literature_claim' || item?.admission !== 'semantic_candidate' || item?.semanticBasisEligible !== false) addError(errors, `${path}:source_claim_boundary_invalid`)
    if (item?.status === 'available') addError(errors, `${path}:semantic_promotion_forbidden`)
    if (item?.id) allIds.push(item.id)
    validateSourceRefs(item, errors, path)
    validateProvenance(item?.provenance, path, errors)
  }
  if (new Set(allIds).size !== allIds.length) addError(errors, 'evidence_id_duplicate')

  exactKeys(envelope.state, ['candidateEvidenceIds', 'unresolvedEvidenceIds', 'unsupportedEvidenceIds', 'blockedEvidenceIds', 'conflictEvidenceIds', 'conflictLedger'], 'state', errors)
  const expectedStateValue = expectedState(sourceEvidence)
  for (const key of ['candidateEvidenceIds', 'unresolvedEvidenceIds', 'unsupportedEvidenceIds', 'blockedEvidenceIds', 'conflictEvidenceIds']) {
    const actual = stringArray(envelope.state?.[key], `state.${key}`, errors)
    if (!same(actual, expectedStateValue[key])) addError(errors, `state_${key}_mismatch`)
  }
  if (!Array.isArray(envelope.state?.conflictLedger) || !same(envelope.state.conflictLedger, expectedStateValue.conflictLedger)) addError(errors, 'state_conflict_ledger_mismatch')

  exactKeys(envelope.provenance, ['sourceRefs', 'sources', 'locators', 'recordIds'], 'provenance', errors)
  const expectedSourceIds = allSourceIds(sourceEvidence)
  const expectedLocatorIds = allLocatorIds(sourceEvidence)
  if (!same(envelope.provenance?.sourceRefs, sourceRefs(expectedSourceIds, expectedLocatorIds))) addError(errors, 'global_provenance_refs_mismatch')
  if (!same(envelope.provenance?.sources, sourceIdentityRefs(expectedSourceIds))) addError(errors, 'global_provenance_sources_mismatch')
  if (!same(envelope.provenance?.locators, locatorRefs(expectedLocatorIds))) addError(errors, 'global_provenance_locators_mismatch')
  if (!same(envelope.provenance?.recordIds, allIds)) addError(errors, 'global_provenance_record_ids_mismatch')

  exactKeys(envelope.boundary, Object.keys(ENVELOPE_BOUNDARY), 'boundary', errors)
  if (!same(envelope.boundary, ENVELOPE_BOUNDARY)) addError(errors, 'handoff_boundary_invalid')
  exactKeys(envelope.readiness, Object.keys(expectedReadiness()), 'readiness', errors)
  if (!same(envelope.readiness, expectedReadiness())) addError(errors, 'handoff_readiness_invalid')
  return { valid: unique(errors).length === 0, errors: unique(errors).sort(), baseValidation }
}

function validateProvenance(provenance, path, errors) {
  if (!isObject(provenance)) {
    addError(errors, `${path}.provenance:not_object`)
    return
  }
  if (provenance.schema !== ZIWEI_EVIDENCE_SCHEMA || provenance.version !== ZIWEI_EVIDENCE_VERSION) addError(errors, `${path}.provenance:identity_mismatch`)
  if (!Array.isArray(provenance.baseFactRefs)) addError(errors, `${path}.provenance.baseFactRefs:not_array`)
}

export function buildZiweiEvidenceHandoffEnvelope({ base } = {}) {
  const baseValidation = validateDeterministicBaseForInterpretation(base)
  const factRefs = expectedBaseFactRefs(base)
  const errors = baseValidation.errors.map(error => `base:${error}`)
  if (factRefs.length === 0) errors.push('ziwei_public_fact_frontier_missing')
  if (errors.length > 0) return blockedBuild(errors, base)

  const baseFacts = factRefs.map(makeBaseFact)
  const sourceEvidence = ZIWEI_SOURCE_FRONTIER.map(def => makeSourceEvidence(def, factRefs))
  const sourceIds = allSourceIds(sourceEvidence)
  const locatorIds = allLocatorIds(sourceEvidence)
  const envelope = {
    schemaVersion: ZIWEI_EVIDENCE_SCHEMA,
    version: ZIWEI_EVIDENCE_VERSION,
    kind: ZIWEI_EVIDENCE_KIND,
    baseContract: {
      schemaVersion: base.schemaVersion,
      foundationVersion: base.foundationVersion,
      factRefs,
    },
    evidence: { baseFacts, sourceEvidence },
    state: expectedState(sourceEvidence),
    provenance: {
      sourceRefs: sourceRefs(sourceIds, locatorIds),
      sources: sourceIdentityRefs(sourceIds),
      locators: locatorRefs(locatorIds),
      recordIds: [...baseFacts, ...sourceEvidence].map(item => item.id),
    },
    boundary: clone(ENVELOPE_BOUNDARY),
    readiness: expectedReadiness(),
  }
  const validation = validateEnvelope(envelope, base)
  return { valid: validation.valid, errors: validation.errors, envelope: validation.valid ? envelope : null, baseValidation: validation.baseValidation }
}

export function validateZiweiEvidenceHandoffEnvelope(envelope, base) {
  return validateEnvelope(envelope, base)
}

export function exportZiweiEvidenceHandoffEnvelopeJson(envelope, indent = 2) {
  return JSON.stringify(envelope, null, indent)
}

export function consumeZiweiEvidenceHandoffEnvelope(serialized, base) {
  let envelope
  try {
    envelope = typeof serialized === 'string' ? JSON.parse(serialized) : clone(serialized)
  } catch {
    return { valid: false, errors: ['envelope_json_invalid'], envelope: null }
  }
  const validation = validateEnvelope(envelope, base)
  return { valid: validation.valid, errors: validation.errors, envelope: validation.valid ? envelope : null, baseValidation: validation.baseValidation }
}

function makeConstitutionEvidence(envelope) {
  const baseFacts = envelope.evidence.baseFacts.map(item => ({
    id: item.id,
    kind: 'base_fact',
    status: 'available',
    admission: 'base_contract',
    relation: 'neutral',
    factRefs: [...item.factRefs],
    evidenceRole: 'public_deterministic_base_fact',
  }))
  const sourceEvidence = envelope.evidence.sourceEvidence.map(item => ({
    id: item.id,
    kind: 'literature_claim',
    status: item.status,
    admission: 'semantic_candidate',
    relation: item.relation,
    statement: item.statement,
    evidenceRole: item.evidenceRole,
    semanticBasisEligible: false,
    lineage: item.lineage,
    lineages: [...item.lineages],
    factRefs: [...item.factRefs],
    sourceRefs: clone(item.sourceRefs),
    provenance: clone(item.provenance),
  }))
  const conflicts = envelope.state.conflictLedger.map(conflict => ({
    id: conflict.id,
    evidenceIds: [...conflict.evidenceIds],
    resolution: 'preserved_tension',
  }))
  return { baseFacts, sourceEvidence, conflicts, evidence: [...baseFacts, ...sourceEvidence] }
}

export function adaptZiweiEvidenceToConstitution({ base, envelope } = {}) {
  const validation = validateEnvelope(envelope, base)
  if (!validation.valid) {
    return {
      base: clone(base),
      evidence: [],
      conflicts: [],
      hypotheses: [],
      adapterValidation: validation,
      boundary: { factsAndSourceEvidenceSeparate: true, noRecalculation: true, noPersonalMeaning: true, unresolvedPreserved: true, conflictsPreserved: true, noCrossLineageMerge: true, noHypothesisGenerated: true },
      readiness: { sourceSemanticEvidenceAvailable: false, interpretationHypothesisReady: false },
    }
  }
  const constitution = makeConstitutionEvidence(envelope)
  return {
    base: clone(base),
    evidence: constitution.evidence,
    conflicts: constitution.conflicts,
    hypotheses: [],
    adapterValidation: validation,
    evidenceMapping: {
      baseFactEvidenceIds: constitution.baseFacts.map(item => item.id),
      sourceEvidenceIds: constitution.sourceEvidence.map(item => item.id),
      candidateEvidenceIds: constitution.sourceEvidence.filter(item => item.status === 'candidate').map(item => item.id),
      unresolvedEvidenceIds: constitution.sourceEvidence.filter(item => item.status === 'unresolved').map(item => item.id),
      conflictEvidenceIds: constitution.sourceEvidence.filter(item => item.relation === 'conflicts').map(item => item.id),
      semanticBasisEligibleEvidenceIds: [],
    },
    boundary: {
      factsAndSourceEvidenceSeparate: true,
      noRecalculation: true,
      noPersonalMeaning: true,
      unresolvedPreserved: true,
      conflictsPreserved: true,
      noCrossLineageMerge: true,
      noHypothesisGenerated: true,
    },
    readiness: {
      sourceSemanticEvidenceAvailable: false,
      interpretationHypothesisReady: false,
      userExperienceGate: 'required_before_personal_application',
    },
  }
}

const MODEL_POLICY = Object.freeze({
  fact: 'included public Ziwei FACT values may be reported as values only; FACT presence does not establish palace meaning or personal meaning',
  literatureEvidence: 'candidate source observation may be explained only within its source and locator; it is not a verified rule or universal semantic',
  unresolved: 'unresolved, unsupported, and blocked states must be reported without filling the gap',
  conflict: 'all conflicting source surfaces remain visible; no winner, vote, or cross-lineage synthesis is allowed',
  hypothesis: 'no hypothesis is generated; current source frontier has no eligible semantic basis',
  personalApplication: 'personality, fortune, prediction, or personal conclusion is never definitive and requires external context outside this engine',
  externalResponsibility: 'response storage, response classification, conversation flow, and personalization remain external to this contract',
})

function permissionFor(item) {
  if (item.kind === 'base_fact') return {
    confirmedFact: true,
    sourceBoundedExplanation: false,
    hypothesisProposal: 'not_allowed_from_fact',
    userContextRequirement: 'not_required_for_fact_report',
    definitivePersonalization: false,
    allowedUses: ['report_included_fact_value', 'answer_explicit_fact_lookup', 'cite_base_fact_ref'],
    forbiddenUses: ['derive_palace_meaning', 'infer_personality_or_fortune', 'recalculate', 'cross_lineage_merge', 'definitive_personalization'],
  }
  if (item.relation === 'conflicts') return {
    confirmedFact: false,
    sourceBoundedExplanation: true,
    hypothesisProposal: 'blocked_conflict_preserved',
    userContextRequirement: 'required_before_any_personal_application_without_resolving_conflict',
    definitivePersonalization: false,
    allowedUses: ['report_all_conflicting_source_surfaces', 'preserve_tension', 'defer_application'],
    forbiddenUses: ['select_conflict_winner', 'cross_lineage_vote', 'hide_conflicting_side', 'definitive_personalization'],
  }
  if (item.evidenceRole === 'source_observation') return {
    confirmedFact: false,
    sourceBoundedExplanation: true,
    hypothesisProposal: 'blocked_source_semantic_authority_not_closed',
    userContextRequirement: 'required_before_personal_application',
    definitivePersonalization: false,
    allowedUses: ['report_source_locator_bounded_observation', 'preserve_lineage_and_provenance', 'defer_semantic_application'],
    forbiddenUses: ['promote_to_verified_fact', 'derive_palace_meaning', 'cross_lineage_synthesis', 'definitive_personalization'],
  }
  return {
    confirmedFact: false,
    sourceBoundedExplanation: true,
    hypothesisProposal: 'blocked_unresolved_or_unsupported_state',
    userContextRequirement: 'required_before_personal_application_without_filling_gap',
    definitivePersonalization: false,
    allowedUses: ['report_declared_status', 'identify_missing_boundary', 'defer_application'],
    forbiddenUses: ['invent_missing_source', 'resolve_unresolved_state', 'definitive_personalization'],
  }
}

function classify(item) {
  if (item.kind === 'base_fact') return 'fact'
  if (item.relation === 'conflicts') return 'conflict'
  if (item.evidenceRole === 'source_observation') return 'literature_evidence'
  return 'unresolved'
}

function expectedConsumptionReadiness() {
  return {
    boundedEvidenceConsumptionReady: true,
    sourceSemanticEvidenceAvailable: false,
    interpretationHypothesisReady: false,
    perHypothesisAuthorizationAvailable: true,
    userExperienceGate: 'required_before_personal_application',
    userExperienceProvided: false,
    blockers: expectedReadiness().blockers,
    reason: expectedReadiness().reason,
  }
}

function expectedConsumptionContract() {
  return {
    schemaVersion: ZIWEI_CONSUMPTION_SCHEMA,
    version: ZIWEI_CONSUMPTION_VERSION,
    kind: ZIWEI_CONSUMPTION_KIND,
    evidenceClasses: ['fact', 'literature_evidence', 'unresolved', 'conflict'],
    consumptionOrder: ['locate_included_ziwei_fact', 'separate_fact_from_source_observation', 'report_unresolved_and_conflict', 'do_not_create_palace_meaning', 'ask_for_context_before_personal_application'],
    boundary: clone(CONSUMPTION_BOUNDARY),
  }
}

export function buildZiweiEvidenceConsumptionContract({ base, envelope } = {}) {
  const adapter = adaptZiweiEvidenceToConstitution({ base, envelope })
  if (!adapter.adapterValidation.valid) return { valid: false, errors: adapter.adapterValidation.errors, contract: null, adapter }
  const entries = adapter.evidence.map(item => ({
    evidenceId: item.id,
    evidenceKind: item.kind,
    evidenceClass: classify(item),
    evidenceRole: item.evidenceRole,
    status: item.status,
    relation: item.relation,
    factRefs: [...(item.factRefs || [])],
    sourceRefs: item.sourceRefs ? clone(item.sourceRefs) : null,
    semanticBasisEligible: false,
    permission: permissionFor(item),
  }))
  const contract = {
    schemaVersion: ZIWEI_CONSUMPTION_SCHEMA,
    version: ZIWEI_CONSUMPTION_VERSION,
    kind: ZIWEI_CONSUMPTION_KIND,
    handoffEvidence: clone(envelope),
    constitutionInput: { base: clone(base), evidence: clone(adapter.evidence), conflicts: clone(adapter.conflicts), hypotheses: [] },
    consumptionGuidance: { entries, modelPolicy: clone(MODEL_POLICY) },
    boundary: clone(CONSUMPTION_BOUNDARY),
    readiness: expectedConsumptionReadiness(),
  }
  const validation = validateZiweiEvidenceConsumptionContract(contract, { base })
  return { valid: validation.valid, errors: validation.errors, contract: validation.valid ? contract : null, adapter }
}

export function validateZiweiEvidenceConsumptionContract(contract, { base = null } = {}) {
  const errors = []
  if (!isObject(contract)) return { valid: false, errors: ['contract_not_object'], contract: null }
  exactKeys(contract, ['schemaVersion', 'version', 'kind', 'handoffEvidence', 'constitutionInput', 'consumptionGuidance', 'boundary', 'readiness'], '$', errors)
  if (contract.schemaVersion !== ZIWEI_CONSUMPTION_SCHEMA || contract.version !== ZIWEI_CONSUMPTION_VERSION || contract.kind !== ZIWEI_CONSUMPTION_KIND) addError(errors, 'consumption_schema_mismatch')
  const embeddedBase = contract.constitutionInput?.base
  const effectiveBase = base || embeddedBase
  const envelopeValidation = validateEnvelope(contract.handoffEvidence, effectiveBase)
  if (!envelopeValidation.valid) errors.push(...envelopeValidation.errors.map(error => `envelope:${error}`))
  const adapter = adaptZiweiEvidenceToConstitution({ base: effectiveBase, envelope: contract.handoffEvidence })
  if (!adapter.adapterValidation.valid) errors.push('adapter_invalid')
  if (!same(contract.constitutionInput, { base: clone(effectiveBase), evidence: adapter.evidence, conflicts: adapter.conflicts, hypotheses: [] })) addError(errors, 'constitution_input_not_lossless')
  exactKeys(contract.consumptionGuidance, ['entries', 'modelPolicy'], 'consumptionGuidance', errors)
  if (!same(contract.consumptionGuidance.modelPolicy, MODEL_POLICY)) addError(errors, 'model_policy_mismatch')
  const expectedEntries = adapter.evidence.map(item => ({ evidenceId: item.id, evidenceKind: item.kind, evidenceClass: classify(item), evidenceRole: item.evidenceRole, status: item.status, relation: item.relation, factRefs: [...(item.factRefs || [])], sourceRefs: item.sourceRefs ? clone(item.sourceRefs) : null, semanticBasisEligible: false, permission: permissionFor(item) }))
  if (!same(contract.consumptionGuidance.entries, expectedEntries)) addError(errors, 'guidance_not_bound_to_evidence')
  if (!same(contract.boundary, CONSUMPTION_BOUNDARY)) addError(errors, 'consumption_boundary_mismatch')
  if (!same(contract.readiness, expectedConsumptionReadiness())) addError(errors, 'consumption_readiness_mismatch')
  return { valid: unique(errors).length === 0, errors: unique(errors).sort(), contract: unique(errors).length === 0 ? contract : null, adapter }
}

export function exportZiweiEvidenceConsumptionContractJson(contract, indent = 2) {
  return JSON.stringify(contract, null, indent)
}

export function consumeZiweiEvidenceConsumptionContract(serialized, { base = null } = {}) {
  let contract
  try {
    contract = typeof serialized === 'string' ? JSON.parse(serialized) : clone(serialized)
  } catch {
    return { valid: false, errors: ['contract_json_invalid'], contract: null }
  }
  const validation = validateZiweiEvidenceConsumptionContract(contract, { base })
  return { valid: validation.valid, errors: validation.errors, contract: validation.valid ? contract : null, validation }
}

const CONVERSATIONAL_USE_CONTRACT = Object.freeze({
  schemaVersion: 'ziwei-conversational-use-contract-v0',
  version: ZIWEI_HANDOFF_VERSION,
  kind: 'ziwei_evidence_conversational_use_contract',
  fact: 'report included coordinate FACT values only; do not infer palace meaning from presence',
  sourceObservation: 'explain exact lineage/locator observation without promoting authority',
  unresolved: 'report state and missing boundary without guessing',
  conflict: 'report all sides and preserved tension without choosing a winner',
  personalQuestion: 'ask for context and separate FACT/evidence from interpretation; never assert personality, fortune, or prediction',
  externalResponsibilities: ['store_user_responses', 'classify_user_responses', 'choose_personalization', 'run_conversation_flow'],
})

const HANDOFF_READINESS = Object.freeze({
  boundedConversationalUseReady: true,
  conversationalInterpretationActivationReady: false,
  userExperienceGate: 'required_before_personal_application',
  userExperienceProvided: false,
  interpretationHypothesisReady: false,
  blockers: ['source_semantic_authority_not_closed', 'independent_external_oracle_missing', 'palace_semantic_identity_unresolved'],
  reason: 'external consumers can safely inspect facts and bounded evidence states; semantic interpretation remains closed',
})

export function buildZiweiConversationalHandoffPackage({ base, envelope } = {}) {
  const consumption = buildZiweiEvidenceConsumptionContract({ base, envelope })
  if (!consumption.valid) return { valid: false, errors: consumption.errors, package: null, consumption }
  const packageValue = {
    schemaVersion: ZIWEI_HANDOFF_SCHEMA,
    version: ZIWEI_HANDOFF_VERSION,
    kind: ZIWEI_HANDOFF_KIND,
    evidenceConsumption: clone(consumption.contract),
    conversationalUseContract: clone(CONVERSATIONAL_USE_CONTRACT),
    boundary: clone(CONSUMPTION_BOUNDARY),
    readiness: clone(HANDOFF_READINESS),
  }
  const validation = validateZiweiConversationalHandoffPackage(packageValue, { base })
  return { valid: validation.valid, errors: validation.errors, package: validation.valid ? packageValue : null, consumption }
}

export function validateZiweiConversationalHandoffPackage(packageValue, { base = null } = {}) {
  const errors = []
  if (!isObject(packageValue)) return { valid: false, errors: ['package_not_object'], package: null }
  exactKeys(packageValue, ['schemaVersion', 'version', 'kind', 'evidenceConsumption', 'conversationalUseContract', 'boundary', 'readiness'], '$', errors)
  if (packageValue.schemaVersion !== ZIWEI_HANDOFF_SCHEMA || packageValue.version !== ZIWEI_HANDOFF_VERSION || packageValue.kind !== ZIWEI_HANDOFF_KIND) addError(errors, 'package_schema_mismatch')
  const embeddedBase = packageValue.evidenceConsumption?.constitutionInput?.base
  const effectiveBase = base || embeddedBase
  const consumptionValidation = validateZiweiEvidenceConsumptionContract(packageValue.evidenceConsumption, { base: effectiveBase })
  if (!consumptionValidation.valid) errors.push(...consumptionValidation.errors.map(error => `consumption:${error}`))
  if (!same(packageValue.conversationalUseContract, CONVERSATIONAL_USE_CONTRACT)) addError(errors, 'conversational_use_contract_mismatch')
  if (!same(packageValue.boundary, CONSUMPTION_BOUNDARY)) addError(errors, 'package_boundary_mismatch')
  if (!same(packageValue.readiness, HANDOFF_READINESS)) addError(errors, 'package_readiness_mismatch')
  return { valid: unique(errors).length === 0, errors: unique(errors).sort(), package: unique(errors).length === 0 ? packageValue : null, consumptionValidation }
}

export function exportZiweiConversationalHandoffPackageJson(packageValue, indent = 2) {
  return JSON.stringify(packageValue, null, indent)
}

export function consumeZiweiConversationalHandoffPackage(serialized, { base = null } = {}) {
  let packageValue
  try {
    packageValue = typeof serialized === 'string' ? JSON.parse(serialized) : clone(serialized)
  } catch {
    return { valid: false, errors: ['package_json_invalid'], package: null }
  }
  const validation = validateZiweiConversationalHandoffPackage(packageValue, { base })
  return { valid: validation.valid, errors: validation.errors, package: validation.valid ? packageValue : null, validation }
}

const ALLOWED_CONTEXT_STATUS = new Set(['not_provided', 'reported'])
const ALLOWED_CONTEXT_RELATION = new Set(['supports', 'neutral', 'conflicts'])

function validateHypothesisSubmissionShape(submission, errors) {
  exactKeys(submission, ['schemaVersion', 'version', 'kind', 'submissionId', 'userContext', 'hypothesis'], '$', errors)
  if (submission?.schemaVersion !== ZIWEI_HYPOTHESIS_SUBMISSION_SCHEMA || submission?.version !== ZIWEI_HYPOTHESIS_SUBMISSION_VERSION || submission?.kind !== ZIWEI_HYPOTHESIS_SUBMISSION_KIND) addError(errors, 'submission_schema_mismatch')
  if (!isNonEmptyString(submission?.submissionId)) addError(errors, 'submission_id_missing')
  const hypothesis = submission?.hypothesis
  exactKeys(hypothesis, ['id', 'statement', 'claimType', 'status', 'userExperienceGate', 'factRefs', 'evidenceIds', 'semanticBasisIds', 'conflictIds', 'userContextIds', 'sourceScope', 'preservation', 'assertion'], 'hypothesis', errors)
  if (!isNonEmptyString(hypothesis?.id)) addError(errors, 'hypothesis_id_missing')
  if (!isNonEmptyString(hypothesis?.statement)) addError(errors, 'hypothesis_statement_missing')
  if (hypothesis?.claimType !== 'interpretation_hypothesis' || hypothesis?.status !== 'hypothesis' || hypothesis?.userExperienceGate !== 'required') addError(errors, 'hypothesis_header_invalid')
  const factRefs = stringArray(hypothesis?.factRefs, 'hypothesis.factRefs', errors, { required: true })
  const evidenceIds = stringArray(hypothesis?.evidenceIds, 'hypothesis.evidenceIds', errors, { required: true })
  const semanticBasisIds = stringArray(hypothesis?.semanticBasisIds, 'hypothesis.semanticBasisIds')
  const conflictIds = stringArray(hypothesis?.conflictIds, 'hypothesis.conflictIds')
  const userContextIds = stringArray(hypothesis?.userContextIds, 'hypothesis.userContextIds')
  exactKeys(hypothesis?.sourceScope, ['mode', 'lineages', 'sourceIds', 'locatorIds', 'generalization', 'crossLineage'], 'hypothesis.sourceScope', errors)
  if (hypothesis?.sourceScope?.mode !== 'exact_referenced_source_scope' || hypothesis?.sourceScope?.generalization !== 'forbidden' || hypothesis?.sourceScope?.crossLineage !== 'forbidden') addError(errors, 'hypothesis_source_scope_boundary_invalid')
  const lineages = stringArray(hypothesis?.sourceScope?.lineages, 'hypothesis.sourceScope.lineages', errors, { required: true })
  const sourceIds = stringArray(hypothesis?.sourceScope?.sourceIds, 'hypothesis.sourceScope.sourceIds', errors, { required: true })
  const locatorIds = stringArray(hypothesis?.sourceScope?.locatorIds, 'hypothesis.sourceScope.locatorIds', errors, { required: true })
  exactKeys(hypothesis?.preservation, ['unresolvedEvidenceIds', 'conflictIds'], 'hypothesis.preservation', errors)
  const unresolvedEvidenceIds = stringArray(hypothesis?.preservation?.unresolvedEvidenceIds, 'hypothesis.preservation.unresolvedEvidenceIds')
  const preservedConflictIds = stringArray(hypothesis?.preservation?.conflictIds, 'hypothesis.preservation.conflictIds')
  exactKeys(hypothesis?.assertion, ['mode', 'subjectScope', 'applicationMode', 'personalConclusion', 'unstatedPersonalAttributes'], 'hypothesis.assertion', errors)
  if (hypothesis?.assertion?.mode !== 'tentative' || hypothesis?.assertion?.subjectScope !== 'source_bounded_evidence_and_explicit_user_context' || !['source_bounded_discussion', 'user_context_comparison'].includes(hypothesis?.assertion?.applicationMode) || hypothesis?.assertion?.personalConclusion !== 'forbidden' || hypothesis?.assertion?.unstatedPersonalAttributes !== 'not_claimed') addError(errors, 'hypothesis_assertion_boundary_invalid')
  return { hypothesis, factRefs, evidenceIds, semanticBasisIds, conflictIds, userContextIds, lineages, sourceIds, locatorIds, unresolvedEvidenceIds, preservedConflictIds }
}

function validateUserContext(userContext, hypothesisId, errors) {
  exactKeys(userContext, ['status', 'entries'], 'userContext', errors)
  if (!ALLOWED_CONTEXT_STATUS.has(userContext?.status)) addError(errors, 'user_context_status_invalid')
  if (!Array.isArray(userContext?.entries)) {
    addError(errors, 'user_context_entries_not_array')
    return []
  }
  if (userContext.status === 'not_provided' && userContext.entries.length > 0) addError(errors, 'user_context_not_provided_has_entries')
  if (userContext.status === 'reported' && userContext.entries.length === 0) addError(errors, 'user_context_reported_entries_missing')
  const ids = new Set()
  for (const [index, entry] of userContext.entries.entries()) {
    const path = `userContext.entries[${index}]`
    exactKeys(entry, ['id', 'statement', 'relation', 'hypothesisIds'], path, errors)
    if (!isNonEmptyString(entry?.id) || ids.has(entry?.id)) addError(errors, `${path}:id_invalid_or_duplicate`)
    else ids.add(entry.id)
    if (!isNonEmptyString(entry?.statement)) addError(errors, `${path}:statement_missing`)
    if (!ALLOWED_CONTEXT_RELATION.has(entry?.relation)) addError(errors, `${path}:relation_invalid`)
    const hypothesisIds = stringArray(entry?.hypothesisIds, `${path}.hypothesisIds`, errors)
    if (!hypothesisIds.includes(hypothesisId)) addError(errors, `${path}:not_bound_to_hypothesis`)
  }
  return userContext.entries
}

function makeUserContextEvidence(entry) {
  return {
    id: `ziwei.user-context.${entry.id}`,
    kind: 'user_experience',
    status: 'reported',
    admission: 'user_report',
    relation: entry.relation,
    statement: entry.statement,
  }
}

function inspectHypothesisEvidence(packageValue, shape, errors) {
  const constitutionInput = packageValue.evidenceConsumption.constitutionInput
  const byId = new Map(constitutionInput.evidence.map(item => [item.id, item]))
  const referenced = shape.evidenceIds.map(id => byId.get(id)).filter(Boolean)
  for (const id of shape.evidenceIds) if (!byId.has(id)) addError(errors, `hypothesis_evidence_unknown:${id}`)
  const baseFacts = referenced.filter(item => item.kind === 'base_fact')
  const sourceEvidence = referenced.filter(item => item.kind === 'literature_claim')
  if (sourceEvidence.length === 0) addError(errors, 'hypothesis_source_evidence_missing')
  const declaredFacts = new Set(shape.factRefs)
  for (const item of baseFacts) for (const factRef of item.factRefs || []) if (!declaredFacts.has(factRef)) addError(errors, `hypothesis_fact_dependency_not_declared:${factRef}`)
  const sourceIds = unique(sourceEvidence.flatMap(item => item.sourceRefs?.sourceIds || []))
  const locatorIds = unique(sourceEvidence.flatMap(item => item.sourceRefs?.locatorIds || []))
  const lineages = unique(sourceEvidence.flatMap(item => item.lineages || []).filter(isNonEmptyString))
  if (!same(shape.sourceIds, sourceIds)) addError(errors, 'hypothesis_source_scope_sources_mismatch')
  if (!same(shape.locatorIds, locatorIds)) addError(errors, 'hypothesis_source_scope_locators_mismatch')
  if (!same(shape.lineages, lineages)) addError(errors, 'hypothesis_source_scope_lineages_mismatch')
  if (lineages.length > 1 && !sourceEvidence.some(item => item.relation === 'conflicts')) addError(errors, 'hypothesis_cross_lineage_synthesis_forbidden')
  const semanticBasisCandidates = shape.semanticBasisIds.map(id => byId.get(id)).filter(Boolean)
  const semanticBasisUnavailableIds = semanticBasisCandidates.filter(item => item.kind !== 'literature_claim' || item.status !== 'available' || item.semanticBasisEligible !== true || item.relation !== 'supports').map(item => item.id)
  const semanticBasis = semanticBasisCandidates.filter(item => item.kind === 'literature_claim' && item.status === 'available' && item.semanticBasisEligible === true && item.relation === 'supports')
  for (const id of shape.semanticBasisIds) {
    if (!shape.evidenceIds.includes(id)) addError(errors, `semantic_basis_not_referenced:${id}`)
    if (!byId.has(id)) addError(errors, `semantic_basis_unknown:${id}`)
  }
  const unsafeIds = referenced.filter(item => item.kind === 'literature_claim' && (item.status !== 'available' || item.semanticBasisEligible !== true)).map(item => item.id)
  const conflictEvidenceIds = referenced.filter(item => item.relation === 'conflicts').map(item => item.id)
  const conflictLedger = constitutionInput.conflicts.filter(conflict => conflict.evidenceIds.some(id => conflictEvidenceIds.includes(id)))
  const requiredConflictIds = conflictLedger.map(conflict => conflict.id)
  if (!same(shape.unresolvedEvidenceIds, unsafeIds)) addError(errors, 'hypothesis_unresolved_not_exactly_preserved')
  if (!same(shape.conflictIds, requiredConflictIds) || !same(shape.preservedConflictIds, requiredConflictIds)) addError(errors, 'hypothesis_conflict_not_exactly_preserved')
  return { byId, referenced, baseFacts, sourceEvidence, semanticBasis, semanticBasisUnavailableIds, unsafeIds, conflictEvidenceIds, requiredConflictIds, lineages, sourceIds, locatorIds }
}

function constitutionForSubmission(packageValue, submission, userContextEntries) {
  const input = clone(packageValue.evidenceConsumption.constitutionInput)
  const contextEvidence = userContextEntries.map(makeUserContextEvidence)
  const contextConflicts = contextEvidence.filter(item => item.relation === 'conflicts').map(item => ({ id: `ziwei.user-context-conflict.${item.id.slice('ziwei.user-context.'.length)}`, evidenceIds: [item.id], resolution: 'preserved_tension' }))
  input.evidence.push(...contextEvidence)
  input.conflicts.push(...contextConflicts)
  const hypothesis = clone(submission.hypothesis)
  hypothesis.evidenceIds = [...hypothesis.evidenceIds, ...contextEvidence.map(item => item.id)]
  hypothesis.conflictIds = [...hypothesis.conflictIds, ...contextConflicts.map(item => item.id)]
  const result = evaluateInterpretationConstitution({ ...input, hypotheses: [hypothesis] })
  return { input, result }
}

function submissionReadiness(decision, userContext) {
  return {
    submissionValidationReady: true,
    boundedHypothesisDiscussionReady: decision === 'accepted_bounded_hypothesis',
    userContextProvided: userContext.status === 'reported',
    conversationalInterpretationActivationReady: false,
    personalApplicationReady: false,
    activationMutation: 'forbidden',
    blockers: decision === 'blocked' ? ['source_semantic_basis_not_available', 'source_authority_not_closed'] : ['user_context_or_preserved_boundary_requires_confirmation'],
    reason: 'submission validation never creates a hypothesis or promotes activation; current Ziwei source frontier remains closed',
  }
}

export function buildZiweiHypothesisSubmissionValidation({ handoffPackage, submission } = {}) {
  const packageValidation = validateZiweiConversationalHandoffPackage(handoffPackage)
  if (!packageValidation.valid) return { valid: false, errors: packageValidation.errors.map(error => `handoff:${error}`), decision: 'blocked', validation: null }
  const errors = []
  const shape = validateHypothesisSubmissionShape(submission, errors)
  if (!shape.hypothesis) return { valid: false, errors: unique(errors).sort(), decision: 'blocked', validation: null }
  const contextEntries = validateUserContext(submission.userContext, shape.hypothesis.id, errors)
  if (submission.userContext?.status === 'reported' && !same(shape.userContextIds, contextEntries.map(entry => entry.id))) addError(errors, 'user_context_ids_not_lossless')
  if (submission.userContext?.status === 'not_provided' && shape.userContextIds.length > 0) addError(errors, 'user_context_ids_present_without_context')
  const inspection = inspectHypothesisEvidence(handoffPackage, shape, errors)
  const constitution = constitutionForSubmission(handoffPackage, submission, contextEntries)
  if (!constitution.result.contractValid) errors.push(...constitution.result.violations.map(error => `constitution:${error}`))
  if (errors.length > 0) return { valid: false, errors: unique(errors).sort(), decision: 'blocked', validation: null, constitution: constitution.result }

  const hasSupportingContext = contextEntries.some(entry => entry.relation === 'supports' && entry.hypothesisIds.includes(shape.hypothesis.id))
  const hasConflictingContext = contextEntries.some(entry => entry.relation === 'conflicts' && entry.hypothesisIds.includes(shape.hypothesis.id))
  const decision = inspection.semanticBasis.length === 0
    ? 'blocked'
    : inspection.unsafeIds.length > 0 || inspection.requiredConflictIds.length > 0 || hasConflictingContext || (shape.hypothesis.assertion.applicationMode === 'user_context_comparison' && (!hasSupportingContext || submission.userContext.status !== 'reported'))
      ? 'requires_user_confirmation'
      : 'accepted_bounded_hypothesis'
  const result = {
    decision,
    status: decision === 'accepted_bounded_hypothesis' ? 'bounded_hypothesis_only' : decision === 'requires_user_confirmation' ? 'user_context_required' : 'blocked',
    hypothesisId: shape.hypothesis.id,
    factRefs: [...shape.factRefs],
    factEvidenceIds: inspection.baseFacts.map(item => item.id),
    sourceEvidenceIds: inspection.sourceEvidence.map(item => item.id),
    semanticBasisIds: inspection.semanticBasis.map(item => item.id),
    semanticBasisUnavailableIds: [...inspection.semanticBasisUnavailableIds],
    sourceScope: clone(shape.hypothesis.sourceScope),
    userContextIds: [...shape.userContextIds],
    unresolvedEvidenceIds: [...inspection.unsafeIds],
    conflictIds: [...inspection.requiredConflictIds],
    conflictState: inspection.requiredConflictIds.length > 0 ? 'preserved_tension' : 'no_source_conflict_referenced',
    constitutionDecision: constitution.result.interpretationDecision,
    userContextDecision: hasConflictingContext ? 'reported_user_conflict_defer_application' : hasSupportingContext ? 'reported_context_only_not_confirmation' : 'user_context_required_before_personal_application',
    hypothesisUse: decision === 'accepted_bounded_hypothesis' ? 'bounded_source_and_context_discussion_only' : 'do_not_apply_until_boundary_is_confirmed',
    sourceGeneralization: 'forbidden',
    userUnstatedAttributes: 'not_claimed',
    definitivePersonalization: false,
    noHypothesisGenerated: true,
    noRecalculation: true,
    noCrossLineageSynthesis: true,
    noMeaningAddition: true,
  }
  const validation = {
    schemaVersion: ZIWEI_HYPOTHESIS_VALIDATION_SCHEMA,
    version: ZIWEI_HYPOTHESIS_VALIDATION_VERSION,
    kind: ZIWEI_HYPOTHESIS_VALIDATION_KIND,
    handoffPackage: { schemaVersion: handoffPackage.schemaVersion, version: handoffPackage.version, kind: handoffPackage.kind },
    submissionContract: {
      schemaVersion: ZIWEI_HYPOTHESIS_SUBMISSION_SCHEMA,
      version: ZIWEI_HYPOTHESIS_SUBMISSION_VERSION,
      kind: 'ziwei_hypothesis_submission_contract',
      sourceAuthorityGate: 'semantic_basis_must_be_available_and_source_bounded',
      crossLineageSynthesis: 'forbidden',
      personalConclusion: 'forbidden',
    },
    submission: clone(submission),
    result,
    readiness: submissionReadiness(decision, submission.userContext),
  }
  return { valid: true, errors: [], decision, blockers: decision === 'blocked' ? ['source_semantic_basis_not_available'] : [], validation, constitution: constitution.result }
}

export function exportZiweiHypothesisSubmissionJson(submission, indent = 2) {
  return JSON.stringify(submission, null, indent)
}

export function consumeZiweiHypothesisSubmission(serialized, { handoffPackage } = {}) {
  let submission
  try {
    submission = typeof serialized === 'string' ? JSON.parse(serialized) : clone(serialized)
  } catch {
    return { valid: false, errors: ['submission_json_invalid'], validation: null }
  }
  return buildZiweiHypothesisSubmissionValidation({ handoffPackage, submission })
}

function validatePriorHypothesisValidation(handoffPackage, supplied, errors) {
  if (!isObject(supplied)) {
    addError(errors, 'hypothesis_validation_missing')
    return null
  }
  const rebuilt = buildZiweiHypothesisSubmissionValidation({ handoffPackage, submission: supplied.submission })
  if (!rebuilt.valid || !rebuilt.validation) {
    addError(errors, 'hypothesis_validation_rejected')
    return null
  }
  if (!same(rebuilt.validation, supplied)) addError(errors, 'hypothesis_validation_not_current_or_tampered')
  return rebuilt.validation
}

function permissionForAuthorization(validation, state) {
  if (validation?.result?.decision === 'blocked' || validation?.readiness?.submissionValidationReady !== true) return { permission: 'reject', reason: 'hypothesis_validation_blocked' }
  if (state === 'declined') return { permission: 'reject', reason: 'user_confirmation_declined' }
  if (state === 'uncertain') return { permission: 'explore_only', reason: 'user_confirmation_uncertain' }
  if ((validation.result.unresolvedEvidenceIds || []).length > 0 || (validation.result.conflictIds || []).length > 0) return { permission: 'explore_only', reason: 'preserved_unresolved_or_conflict' }
  return { permission: 'discussion_allowed', reason: 'explicit_confirmation_for_bounded_hypothesis' }
}

function usesForAuthorization(permission) {
  const commonForbidden = ['definitive_personalization', 'infer_unstated_personality', 'infer_fortune_or_prediction', 'generalize_source_scope', 'expand_to_other_hypotheses', 'cross_lineage_synthesis', 'resolve_unresolved_or_conflict', 'recalculate_missing_values', 'promote_global_activation']
  if (permission === 'discussion_allowed') return { personalApplication: 'bounded_user_context_comparison_only', allowedUses: ['report_fact_basis', 'explain_source_bounded_evidence', 'discuss_one_hypothesis_tentatively', 'compare_with_explicit_user_context_only'], forbiddenUses: [...commonForbidden] }
  if (permission === 'explore_only') return { personalApplication: 'forbidden', allowedUses: ['report_fact_basis', 'explain_source_bounded_evidence', 'explore_one_hypothesis_without_personal_application', 'ask_for_user_context'], forbiddenUses: [...commonForbidden, 'apply_hypothesis_to_user'] }
  return { personalApplication: 'forbidden', allowedUses: ['report_rejection_reason_only'], forbiddenUses: [...commonForbidden, 'discuss_rejected_hypothesis_as_usable', 'apply_rejected_hypothesis'] }
}

function authorizationReadiness(permission) {
  return {
    safeBoundedConsumerReady: true,
    perHypothesisAuthorizationReady: true,
    permission,
    hypothesisUsable: permission !== 'reject',
    boundedDiscussionAllowed: permission === 'discussion_allowed',
    exploreOnly: permission === 'explore_only',
    personalApplicationReady: false,
    conversationalInterpretationActivationReady: false,
    globalActivationPromotion: false,
    blockers: permission === 'reject' ? ['hypothesis_validation_blocked', 'definitive_personal_application_forbidden', 'global_interpretation_activation_forbidden'] : ['definitive_personal_application_forbidden', 'global_interpretation_activation_forbidden'],
    reason: 'authorization is per hypothesis and never promotes global activation or definitive personal application',
  }
}

function validateAuthorizationRequest({ handoffPackage, request } = {}) {
  const errors = []
  exactKeys(request, ['schemaVersion', 'version', 'kind', 'authorizationId', 'hypothesisValidation', 'userConfirmation', 'requestedUse'], '$', errors)
  if (request?.schemaVersion !== ZIWEI_AUTHORIZATION_REQUEST_SCHEMA || request?.version !== ZIWEI_AUTHORIZATION_REQUEST_VERSION || request?.kind !== ZIWEI_AUTHORIZATION_REQUEST_KIND) addError(errors, 'authorization_request_schema_mismatch')
  if (!isNonEmptyString(request?.authorizationId)) addError(errors, 'authorization_id_missing')
  const validation = validatePriorHypothesisValidation(handoffPackage, request?.hypothesisValidation, errors)
  const hypothesisId = validation?.submission?.hypothesis?.id || null
  exactKeys(request?.userConfirmation, ['hypothesisId', 'state', 'scope', 'basis'], 'userConfirmation', errors)
  if (request?.userConfirmation?.hypothesisId !== hypothesisId) addError(errors, 'user_confirmation_hypothesis_mismatch')
  if (!ZIWEI_CONFIRMATION_STATES.includes(request?.userConfirmation?.state)) addError(errors, 'user_confirmation_state_invalid')
  if (request?.userConfirmation?.scope !== 'this_hypothesis_only' || request?.userConfirmation?.basis !== 'external_user_confirmation') addError(errors, 'user_confirmation_scope_invalid')
  exactKeys(request?.requestedUse, ['hypothesisId', 'action', 'scope', 'otherHypotheses', 'personalApplication', 'globalActivation'], 'requestedUse', errors)
  if (request?.requestedUse?.hypothesisId !== hypothesisId || request?.requestedUse?.action !== 'discussion' || request?.requestedUse?.scope !== 'this_hypothesis_only' || request?.requestedUse?.otherHypotheses !== 'forbidden' || request?.requestedUse?.personalApplication !== 'bounded_user_context_only' || request?.requestedUse?.globalActivation !== 'forbidden') addError(errors, 'requested_use_scope_invalid')
  return { valid: unique(errors).length === 0, errors: unique(errors).sort(), validation }
}

function buildAuthorization(request, validation) {
  const permissionDecision = permissionForAuthorization(validation, request.userConfirmation.state)
  const uses = usesForAuthorization(permissionDecision.permission)
  const hypothesis = validation.submission.hypothesis
  return {
    schemaVersion: ZIWEI_AUTHORIZATION_SCHEMA,
    version: ZIWEI_AUTHORIZATION_VERSION,
    kind: ZIWEI_AUTHORIZATION_KIND,
    authorizationId: request.authorizationId,
    request: clone(request),
    hypothesisValidation: clone(validation),
    authorizationContract: {
      schemaVersion: ZIWEI_AUTHORIZATION_SCHEMA,
      version: ZIWEI_AUTHORIZATION_VERSION,
      kind: 'ziwei_per_hypothesis_discussion_authorization_contract',
      currentSourceGate: 'blocked_when_semantic_basis_is_not_available',
      confirmationStates: { confirmed: 'bounded discussion only after validation', uncertain: 'explore only', declined: 'reject' },
      globalActivation: 'never_promoted',
    },
    decision: {
      permission: permissionDecision.permission,
      hypothesisId: hypothesis.id,
      confirmationState: request.userConfirmation.state,
      validationDecision: validation.result.decision,
      validationStatus: validation.result.status,
      personalApplication: uses.personalApplication,
      allowedUses: uses.allowedUses,
      forbiddenUses: uses.forbiddenUses,
      reason: permissionDecision.reason,
    },
    scope: {
      hypothesisId: hypothesis.id,
      hypothesisIds: [hypothesis.id],
      otherHypothesisIds: [],
      factRefs: [...hypothesis.factRefs],
      evidenceIds: [...hypothesis.evidenceIds],
      semanticBasisIds: [...hypothesis.semanticBasisIds],
      userContextIds: [...hypothesis.userContextIds],
      sourceScope: clone(hypothesis.sourceScope),
      preservation: clone(hypothesis.preservation),
    },
    preservation: {
      unresolvedEvidenceIds: [...validation.result.unresolvedEvidenceIds],
      conflictIds: [...validation.result.conflictIds],
      conflictState: validation.result.conflictState,
    },
    boundary: clone(AUTHORIZATION_BOUNDARY),
    readiness: authorizationReadiness(permissionDecision.permission),
  }
}

export function buildZiweiHypothesisDiscussionAuthorization({ handoffPackage, request } = {}) {
  const requestValidation = validateAuthorizationRequest({ handoffPackage, request })
  if (!requestValidation.valid || !requestValidation.validation) return { valid: false, errors: requestValidation.errors, permission: 'reject', authorization: null }
  const authorization = buildAuthorization(request, requestValidation.validation)
  return { valid: true, errors: [], permission: authorization.decision.permission, authorization }
}

export function validateZiweiHypothesisDiscussionAuthorization(authorization, { handoffPackage } = {}) {
  const errors = []
  if (!isObject(authorization)) return { valid: false, errors: ['authorization_not_object'], authorization: null }
  exactKeys(authorization, ['schemaVersion', 'version', 'kind', 'authorizationId', 'request', 'hypothesisValidation', 'authorizationContract', 'decision', 'scope', 'preservation', 'boundary', 'readiness'], '$', errors)
  if (authorization.schemaVersion !== ZIWEI_AUTHORIZATION_SCHEMA || authorization.version !== ZIWEI_AUTHORIZATION_VERSION || authorization.kind !== ZIWEI_AUTHORIZATION_KIND) addError(errors, 'authorization_schema_mismatch')
  const requestValidation = validateAuthorizationRequest({ handoffPackage, request: authorization.request })
  if (!requestValidation.valid || !requestValidation.validation) errors.push(...requestValidation.errors.map(error => `request:${error}`))
  else if (!same(authorization, buildAuthorization(authorization.request, requestValidation.validation))) addError(errors, 'authorization_not_bound_to_current_request')
  return { valid: unique(errors).length === 0, errors: unique(errors).sort(), authorization: unique(errors).length === 0 ? authorization : null }
}

export function exportZiweiHypothesisDiscussionAuthorizationRequestJson(request, indent = 2) {
  return JSON.stringify(request, null, indent)
}

export function consumeZiweiHypothesisDiscussionAuthorizationRequest(serialized, { handoffPackage } = {}) {
  let request
  try {
    request = typeof serialized === 'string' ? JSON.parse(serialized) : clone(serialized)
  } catch {
    return { valid: false, errors: ['authorization_request_json_invalid'], permission: 'reject', authorization: null }
  }
  return buildZiweiHypothesisDiscussionAuthorization({ handoffPackage, request })
}

export function evaluateZiweiInterpretationConstitution({ base, envelope } = {}) {
  const adapter = adaptZiweiEvidenceToConstitution({ base, envelope })
  return evaluateInterpretationConstitution(adapter)
}

export const ZIWEI_SOURCE_FRONTIER_SUMMARY = Object.freeze({
  sourceIdentity: 'candidate_or_unresolved',
  directSemanticEntries: 0,
  sourceLocalCompositions: 0,
  commonCandidates: 0,
  independentExternalOracles: 0,
  semanticHypothesisReady: false,
  discussionAuthorizationContractReady: true,
  currentMode: 'facts_and_bounded_evidence_only_fail_closed',
})

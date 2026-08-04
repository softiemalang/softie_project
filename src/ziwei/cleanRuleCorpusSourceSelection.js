import { createHash } from 'node:crypto'

export const CLEAN_RULE_CORPUS_SOURCE_ADMISSION_SCHEMA = 'ziwei-clean-rule-corpus-source-admission-v0'
export const CLEAN_RULE_CORPUS_SOURCE_ADMISSION_VERSION = '0.1.0'

export const CLEAN_SOURCE_VERDICTS = Object.freeze([
  'admissible',
  'admissible_with_limits',
  'reference_only',
  'rejected',
  'access_blocked',
  'identity_unresolved',
])

export const CLEAN_CONTENT_CLASSES = Object.freeze([
  'deterministic_calculation_rule',
  'table_mapping',
  'terminology_alias',
  'conditional_traditional_statement',
  'worked_example',
  'interpretive_prose',
])

const HEX64 = /^[0-9a-f]{64}$/
const SOURCE_ID = /^ziwei-source-[0-9a-f]{16}$/
const stable = value => Array.isArray(value)
  ? value.map(stable)
  : value && typeof value === 'object'
    ? Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])]))
    : value

export const canonicalSourceJson = value => `${JSON.stringify(stable(value), null, 2)}\n`

export function sourceIdentityKey(record) {
  return canonicalSourceJson({
    sourceKey: record.sourceKey,
    title: record.sourceIdentity?.signature,
    authorEditor: record.sourceIdentity?.authorEditor,
    edition: record.sourceIdentity?.edition,
    publisher: record.sourceIdentity?.publisher,
    year: record.sourceIdentity?.year,
    stableUrls: record.stableUrls,
  })
}

export function deterministicSourceId(record) {
  return `ziwei-source-${createHash('sha256').update(sourceIdentityKey(record)).digest('hex').slice(0, 16)}`
}

const hasText = value => typeof value === 'string' && value.trim().length > 0
const isBoolean = value => typeof value === 'boolean'
const isObject = value => value && typeof value === 'object' && !Array.isArray(value)

function requireText(errors, value, path) {
  if (!hasText(value)) errors.push(`${path}:required`)
}

function validateContentClasses(record, errors) {
  if (!isObject(record.contentClasses)) {
    errors.push('contentClasses:required')
    return
  }
  for (const contentClass of CLEAN_CONTENT_CLASSES) {
    const item = record.contentClasses[contentClass]
    if (!isObject(item) || !['not_allowed', 'limited', 'allowed'].includes(item.status)) {
      errors.push(`contentClasses.${contentClass}:invalid`)
      continue
    }
    if (!hasText(item.basis)) errors.push(`contentClasses.${contentClass}.basis:required`)
    if (contentClass === 'interpretive_prose' && item.status === 'allowed') errors.push('interpretive_prose:verified_claim_forbidden')
    if (item.status === 'allowed' && !['admissible', 'admissible_with_limits'].includes(record.verdict)) {
      errors.push(`contentClasses.${contentClass}:verdict_not_admissible`)
    }
  }
}

export function validateSourceAdmissionRecord(record) {
  const errors = []
  if (!isObject(record)) return ['record:object_required']
  if (!SOURCE_ID.test(record.candidateId || '')) errors.push('candidateId:deterministic_source_id_required')
  requireText(errors, record.sourceKey, 'sourceKey')
  requireText(errors, record.verdict, 'verdict')
  if (!CLEAN_SOURCE_VERDICTS.includes(record.verdict)) errors.push('verdict:unknown')

  const identity = record.sourceIdentity
  if (!isObject(identity)) errors.push('sourceIdentity:required')
  else {
    requireText(errors, identity.signature, 'sourceIdentity.signature')
    if (!Array.isArray(identity.authorEditor)) errors.push('sourceIdentity.authorEditor:array_required')
    if (!(hasText(identity.edition) || identity.edition === null)) errors.push('sourceIdentity.edition:required_or_null')
    if (!(hasText(identity.publisher) || identity.publisher === null)) errors.push('sourceIdentity.publisher:required_or_null')
    if (!(Number.isInteger(identity.year) || identity.year === null)) errors.push('sourceIdentity.year:integer_or_null')
    if (!['closed', 'catalog_only', 'unresolved'].includes(identity.status)) errors.push('sourceIdentity.status:invalid')
  }

  if (!Array.isArray(record.stableUrls) || record.stableUrls.length === 0) errors.push('stableUrls:required')
  else record.stableUrls.forEach((item, index) => {
    if (!isObject(item) || !hasText(item.url) || !/^https?:\/\//.test(item.url)) errors.push(`stableUrls.${index}:stable_http_url_required`)
    if (!hasText(item.role)) errors.push(`stableUrls.${index}.role:required`)
  })

  const location = record.locationIdentity
  if (!isObject(location)) errors.push('locationIdentity:required')
  else {
    if (!isBoolean(location.stable)) errors.push('locationIdentity.stable:boolean_required')
    if (!(hasText(location.editionLocation) || location.editionLocation === null)) errors.push('locationIdentity.editionLocation:required_or_null')
    if (!(hasText(location.volumeChapterSection) || location.volumeChapterSection === null)) errors.push('locationIdentity.volumeChapterSection:required_or_null')
    if (!(hasText(location.page) || location.page === null)) errors.push('locationIdentity.page:required_or_null')
  }

  const file = record.fileIdentity
  if (!isObject(file)) errors.push('fileIdentity:required')
  else {
    if (!['scan', 'pdf', 'manifest', 'web_revision', 'catalog_record', 'unknown'].includes(file.kind)) errors.push('fileIdentity.kind:invalid')
    if (!(hasText(file.url) || file.url === null)) errors.push('fileIdentity.url:required_or_null')
    if (!(Number.isInteger(file.sizeBytes) || file.sizeBytes === null)) errors.push('fileIdentity.sizeBytes:integer_or_null')
    if (!(HEX64.test(file.byteSha256 || '') || file.byteSha256 === null)) errors.push('fileIdentity.byteSha256:sha256_or_null')
    if (!['verified', 'missing_declared_limit', 'not_available', 'not_retrieved'].includes(file.hashStatus)) errors.push('fileIdentity.hashStatus:invalid')
    if (file.inferred !== false) errors.push('fileIdentity.inferred:true_forbidden')
  }

  const accessibility = record.textAccessibility
  if (!isObject(accessibility)) errors.push('textAccessibility:required')
  else {
    if (!['original_scan', 'original_pdf', 'direct_transcription', 'limited_preview', 'catalog_metadata', 'blocked', 'unknown'].includes(accessibility.mode)) errors.push('textAccessibility.mode:invalid')
    if (!isBoolean(accessibility.directlyConfirmable)) errors.push('textAccessibility.directlyConfirmable:boolean_required')
    if (!isBoolean(accessibility.originalText)) errors.push('textAccessibility.originalText:boolean_required')
    if (accessibility.bypassUsed !== false) errors.push('textAccessibility.bypass_used_forbidden')
  }

  const lineage = record.lineage
  if (!isObject(lineage)) errors.push('lineage:required')
  else {
    if (!['original', 'facsimile', 'reprint', 'mirror', 'translation', 'secondary_citation', 'transcription', 'unknown'].includes(lineage.relation)) errors.push('lineage.relation:invalid')
    if (!(hasText(lineage.groupKey) || lineage.groupKey === null)) errors.push('lineage.groupKey:required_or_null')
    if (lineage.inferred !== false) errors.push('lineage.inferred:true_forbidden')
    if (!hasText(lineage.basis)) errors.push('lineage.basis:required')
  }

  const independence = record.independence
  if (!isObject(independence)) errors.push('independence:required')
  else {
    if (!['established', 'duplicate_lineage', 'not_established', 'unresolved'].includes(independence.status)) errors.push('independence.status:invalid')
    if (!(hasText(independence.groupKey) || independence.groupKey === null)) errors.push('independence.groupKey:required_or_null')
    if (!isBoolean(independence.countsAsIndependentCandidate)) errors.push('independence.countsAsIndependentCandidate:boolean_required')
    if (independence.status !== 'established' && independence.countsAsIndependentCandidate) errors.push('independence.unresolved_or_duplicate_cannot_count')
    if (!hasText(independence.basis)) errors.push('independence.basis:required')
  }

  const legal = record.legalAccess
  if (!isObject(legal)) errors.push('legalAccess:required')
  else {
    if (!['public', 'limited', 'blocked', 'unknown'].includes(legal.status)) errors.push('legalAccess.status:invalid')
    if (!isBoolean(legal.retrievalAllowed)) errors.push('legalAccess.retrievalAllowed:boolean_required')
    if (!isBoolean(legal.fullTextStoredInRepository)) errors.push('legalAccess.fullTextStoredInRepository:boolean_required')
    if (legal.fullTextStoredInRepository) errors.push('legalAccess.full_text_storage_forbidden')
    if (legal.bypassUsed !== false) errors.push('legalAccess.bypass_used_forbidden')
    requireText(errors, legal.limitNote, 'legalAccess.limitNote')
  }

  if (!isObject(record.ruleExtractability)) errors.push('ruleExtractability:required')
  else {
    for (const key of ['deterministicRule', 'tableMapping', 'conditionalStatement', 'workedExample']) {
      if (!isBoolean(record.ruleExtractability[key])) errors.push(`ruleExtractability.${key}:boolean_required`)
    }
    requireText(errors, record.ruleExtractability.note, 'ruleExtractability.note')
  }
  if (!isObject(record.workedEvidence) || !isBoolean(record.workedEvidence.present) || !hasText(record.workedEvidence.note)) errors.push('workedEvidence:required')
  if (record.legacyOccurrenceLink !== null) errors.push('legacyOccurrenceLink:auto_link_forbidden')
  if (record.verifiedClaim === true || record.ready === true || record.grounded === true || record.activation === 'active') errors.push('promotion_flags:forbidden')
  validateContentClasses(record, errors)

  if (record.verdict === 'admissible' || record.verdict === 'admissible_with_limits') {
    const completeIdentity = identity && hasText(identity.signature) && identity.authorEditor.length > 0 && hasText(identity.edition) && hasText(identity.publisher) && Number.isInteger(identity.year)
    const exactLocation = location && location.stable === true && hasText(location.editionLocation) && hasText(location.volumeChapterSection)
    const text = accessibility && accessibility.directlyConfirmable === true && accessibility.originalText === true
    const legalAccess = legal && legal.retrievalAllowed === true && legal.bypassUsed === false
    if (!completeIdentity) errors.push('admission:source_identity_not_closed')
    if (!exactLocation) errors.push('admission:location_identity_not_closed')
    if (!text) errors.push('admission:original_text_not_directly_confirmable')
    if (!legalAccess) errors.push('admission:legal_access_not_closed')
    if (record.verdict === 'admissible' && (!file || file.hashStatus !== 'verified' || !HEX64.test(file.byteSha256 || ''))) errors.push('admission:file_hash_required')
  }
  if (record.verdict === 'reference_only' && Object.values(record.contentClasses || {}).some(item => item?.status === 'allowed')) errors.push('reference_only:content_promotion')
  return [...new Set(errors)]
}

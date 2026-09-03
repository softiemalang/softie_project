import { createHash } from 'node:crypto'

/**
 * Bounded OCR team contract.
 *
 * This module describes and validates OCR workers. It deliberately does not
 * import a model runtime, download a model, search for sources, judge a
 * historical witness, repair semantics, or activate an OCR route.
 */

export const HISTORICAL_OCR_SPECIALIST_ID = 'historical-ocr-specialist'
export const HISTORICAL_OCR_TEAM_SCHEMA = 'historical-ocr-specialist-bounded-team-v1'
export const HISTORICAL_OCR_TEAM_VERSION = '1.0.0'
export const HISTORICAL_OCR_PACKET_SCHEMA = 'historical-ocr-deterministic-packet-v1'
export const HISTORICAL_OCR_PACKET_VERSION = '1.0.0'

export const OCR_REQUIRED = 'OCR_REQUIRED'
export const BLOCK_OCR_ROUTE = true
export const OCR_PROVIDER_NAME = 'OCRProvider'
export const OCRProvider = Object.freeze({ enabled: false })
export const OCR_PROVIDER = OCRProvider

export const OCR_COMPONENTS = Object.freeze(['det', 'rec'])
export const OCR_COMPONENT_NAMES = Object.freeze({ det: 'detection', rec: 'recognition' })
export const OCR_OUTCOME_STATUSES = Object.freeze(['VERIFIED', 'CONFLICT', 'UNKNOWN'])
export const OCR_PROMOTION_STATUSES = Object.freeze(['PROMOTED', 'BLOCKED', 'CONFLICT', 'UNKNOWN'])
export const OCR_VALIDATION_RESULTS = Object.freeze(['PASSED', 'FAILED', 'UNKNOWN'])

export const CHI_KNOW_PO_CORPUS_ID = 'CHI-KNOW-PO'
export const FROZEN_GOLD_CORPUS_ID = 'frozen-gold'
export const EXISTING_FROZEN_GOLD_CORPUS_ID = 'existing-frozen-gold'
export const OCR_VALIDATION_CORPUS_IDS = Object.freeze([CHI_KNOW_PO_CORPUS_ID, FROZEN_GOLD_CORPUS_ID])

export const OCR_FORBIDDEN_OPERATIONS = Object.freeze([
  'search',
  'historical_source_judgment',
  'semantic_correction',
  'silent_fallback',
])

export const OCR_ROUTE_POLICY = Object.freeze({
  route: 'BLOCK_OCR_ROUTE',
  BLOCK_OCR_ROUTE: true,
  provider: Object.freeze({ name: OCR_PROVIDER_NAME, enabled: false }),
  OCRProvider: Object.freeze({ enabled: false }),
  searchAllowed: false,
  historicalSourceJudgmentAllowed: false,
  semanticCorrectionAllowed: false,
  silentFallbackAllowed: false,
  fallbackPolicy: 'none',
})

export const OCR_AUTHORITY_BOUNDARY = Object.freeze({
  role: 'ocr_execution_and_measurement_only',
  sourceEvidence: 'not_created',
  historicalSourceJudgment: false,
  semanticAuthority: 'not_established',
  semanticCorrection: false,
  silentFallback: false,
  claimPromotion: false,
  readinessPromotion: false,
  activation: false,
})

const HASH = /^[a-f0-9]{64}$/i
const ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/
const SAFE_PATH = /^(?!\/)(?!~)(?!.*\\)(?![A-Za-z]:)(?!.*(?:^|\/)\.\.?(?:\/|$)).+$/
const COMPONENT_SET = new Set(OCR_COMPONENTS)
const OUTCOME_SET = new Set(OCR_OUTCOME_STATUSES)

const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value)
const has = (value, key) => isObject(value) && Object.prototype.hasOwnProperty.call(value, key)
const isHash = value => typeof value === 'string' && HASH.test(value)
const isId = value => typeof value === 'string' && ID.test(value)
const hasText = value => typeof value === 'string' && value.trim().length > 0
const isFiniteNumber = value => typeof value === 'number' && Number.isFinite(value)
const clone = value => value === undefined ? undefined : structuredClone(value)

const ordered = value => {
  if (Array.isArray(value)) return value.map(ordered)
  if (!value || typeof value !== 'object') return value
  return Object.fromEntries(Object.keys(value).sort().map(key => [key, ordered(value[key])]))
}

export const canonicalHistoricalOcrJson = value => `${JSON.stringify(ordered(value))}\n`
export const canonicalHistoricalOcrPacketJson = canonicalHistoricalOcrJson
export const historicalOcrContentSha256 = value => createHash('sha256')
  .update(canonicalHistoricalOcrJson(value))
  .digest('hex')

const hashWithout = (value, field) => {
  const copy = clone(value)
  if (isObject(copy)) delete copy[field]
  return historicalOcrContentSha256(copy)
}

const add = (errors, code) => {
  if (!errors.includes(code)) errors.push(code)
}

const sortedUnique = values => [...new Set(values)].sort((a, b) => String(a).localeCompare(String(b)))

const safePath = value => typeof value === 'string' && SAFE_PATH.test(value)

function canonicalCorpusId(value) {
  if (value === EXISTING_FROZEN_GOLD_CORPUS_ID || value === 'FROZEN_GOLD' || value === 'frozen_gold') return FROZEN_GOLD_CORPUS_ID
  return value
}

function corpusPlaceholder(corpusId, role) {
  return {
    corpusId,
    role,
    required: true,
    frozen: true,
    availability: 'not_supplied',
    manifestPath: null,
    manifestSha256: null,
    caseCount: null,
    evidenceRefs: [],
    localOnly: true,
  }
}

function normalizeCorpusEntry(value, corpusId, role) {
  if (value === undefined || value === null) return corpusPlaceholder(corpusId, role)
  if (typeof value === 'string') {
    return {
      ...corpusPlaceholder(corpusId, role),
      availability: 'supplied',
      manifestPath: value,
    }
  }
  if (!isObject(value)) return { ...corpusPlaceholder(corpusId, role), availability: 'invalid' }
  return {
    ...corpusPlaceholder(corpusId, role),
    ...clone(value),
    corpusId,
    role,
    required: true,
    availability: value.availability || 'supplied',
    localOnly: value.localOnly ?? true,
  }
}

function normalizeCorpora(input) {
  const source = input?.validationCorpora ?? input?.corpora ?? input
  let chi = null
  let frozen = null
  if (Array.isArray(source)) {
    chi = source.find(item => canonicalCorpusId(item?.corpusId) === CHI_KNOW_PO_CORPUS_ID)
    frozen = source.find(item => canonicalCorpusId(item?.corpusId) === FROZEN_GOLD_CORPUS_ID)
  } else if (isObject(source)) {
    chi = source[CHI_KNOW_PO_CORPUS_ID] ?? source.chiKnowPo ?? source.chiKnowPO
    frozen = source[FROZEN_GOLD_CORPUS_ID] ?? source[EXISTING_FROZEN_GOLD_CORPUS_ID] ?? source.frozenGold ?? source.existingFrozenGold
  }
  return [
    normalizeCorpusEntry(chi, CHI_KNOW_PO_CORPUS_ID, 'chi_know_po_independent_validation'),
    normalizeCorpusEntry(frozen, FROZEN_GOLD_CORPUS_ID, 'existing_frozen_gold_independent_validation'),
  ]
}

function corpusById(corpora, corpusId) {
  return (corpora || []).find(item => canonicalCorpusId(item?.corpusId) === canonicalCorpusId(corpusId)) || null
}

function workerSpecFor(component) {
  return PP_OCRV6_WORKER_SPECS.find(item => item.component === component) || null
}

function normalizeWorkerSlot(slot, index = 0) {
  const component = slot?.component || OCR_COMPONENTS[index] || OCR_COMPONENTS[0]
  const spec = workerSpecFor(component) || PP_OCRV6_WORKER_SPECS[index] || PP_OCRV6_WORKER_SPECS[0]
  const value = isObject(slot) ? clone(slot) : {}
  return {
    ...clone(spec),
    ...value,
    slotId: value.slotId || spec.slotId,
    workerId: value.workerId || spec.workerId,
    component,
    workerFamily: value.workerFamily || spec.workerFamily,
    replaceable: true,
    selectionPolicy: 'explicit_worker_id_only',
    fallbackPolicy: 'none',
    activation: {
      enabled: false,
      active: false,
      availableForInterpretation: false,
      productionActivation: false,
      decision: 'separate_activation_decision_required',
      ...(isObject(value.activation) ? value.activation : {}),
      enabled: false,
      active: false,
      availableForInterpretation: false,
      productionActivation: false,
    },
  }
}

function normalizeSlots(slots) {
  const source = Array.isArray(slots) && slots.length > 0 ? slots : PP_OCRV6_WORKER_SPECS
  return source.map(normalizeWorkerSlot).sort((a, b) => String(a.slotId).localeCompare(String(b.slotId)))
}

function expectedWorkerForComponent(teamOrOptions, component) {
  const workers = teamOrOptions?.workers || teamOrOptions?.slots || []
  return workers.find(item => item?.component === component) || workerSpecFor(component)
}

function normalizeValidationSource(source, component, workerId) {
  if (!source) return []
  const values = Array.isArray(source) ? source : source.validations || source.results || source.runs || []
  return values.map(item => {
    const value = isObject(item) ? clone(item) : {}
    const corpusId = canonicalCorpusId(value.corpusId)
    const output = isObject(value.output) ? value.output : {}
    const accuracy = isObject(value.accuracy) ? value.accuracy : (isObject(value.metrics) ? { metrics: value.metrics } : {})
    const runtime = isObject(value.runtime) ? value.runtime : (isObject(value.environment) ? value.environment : {})
    const resources = isObject(value.resources) ? value.resources : (isObject(value.resourceUse) ? value.resourceUse : {})
    const licenseDataBoundary = isObject(value.licenseDataBoundary)
      ? value.licenseDataBoundary
      : {
          ...(isObject(value.license) ? value.license : {}),
          ...(isObject(value.dataBoundary) ? value.dataBoundary : {}),
        }
    const operationBoundary = isObject(value.operationBoundary)
      ? value.operationBoundary
      : (isObject(value.operations) ? value.operations : {})
    return {
      ...value,
      validationId: value.validationId || `${component}-${corpusId || 'unknown'}-validation`,
      component: value.component || component,
      workerId: value.workerId || workerId,
      corpusId,
      status: value.status || value.result || 'UNKNOWN',
      inputSha256: value.inputSha256 || value.input?.inputSha256 || null,
      outputSha256: value.outputSha256 || output.outputSha256 || output.sha256 || null,
      expected: isObject(value.expected) ? value.expected : {},
      accuracy: {
        ...accuracy,
        metrics: isObject(accuracy.metrics) ? accuracy.metrics : {},
      },
      reproducibility: isObject(value.reproducibility) ? value.reproducibility : {},
      runtime,
      resources,
      licenseDataBoundary,
      operationBoundary,
      evidenceRefs: Array.isArray(value.evidenceRefs) ? [...value.evidenceRefs] : [],
    }
  }).sort((a, b) => String(a.corpusId).localeCompare(String(b.corpusId)) || String(a.validationId).localeCompare(String(b.validationId)))
}

function normalizeComponentEvidence(source, component, workerId) {
  const value = isObject(source) ? clone(source) : {}
  const validations = normalizeValidationSource(source, component, workerId)
  return {
    component: value.component || component,
    workerId: value.workerId || workerId,
    verificationMode: value.verificationMode || 'independent_per_component',
    acceptance: isObject(value.acceptance) ? value.acceptance : null,
    validations,
    status: value.status || 'UNKNOWN',
    outcome: value.outcome || 'UNKNOWN',
    unknowns: Array.isArray(value.unknowns) ? clone(value.unknowns) : [],
    conflicts: Array.isArray(value.conflicts) ? clone(value.conflicts) : [],
  }
}

function defaultComponentEvidence(component, workerId) {
  return normalizeComponentEvidence(null, component, workerId)
}

function normalizeComponentEvidenceMap(input, workers) {
  const source = input?.componentEvidence ?? input?.componentValidations ?? input?.components ?? {}
  return Object.fromEntries(OCR_COMPONENTS.map(component => {
    const workerId = expectedWorkerForComponent({ workers }, component)?.workerId || workerSpecFor(component).workerId
    const raw = Array.isArray(source) ? source.find(item => item?.component === component) : source?.[component]
    return [component, raw ? normalizeComponentEvidence(raw, component, workerId) : defaultComponentEvidence(component, workerId)]
  }))
}

function isOcrRequiredHandoff(handoff) {
  if (!isObject(handoff)) return false
  return handoff.status === OCR_REQUIRED
    || handoff.type === OCR_REQUIRED
    || handoff.kind === OCR_REQUIRED
    || handoff.requirement === OCR_REQUIRED
    || handoff.ocrStatus === OCR_REQUIRED
    || handoff.ocrRequired === true
    || handoff.OCR_REQUIRED === true
}

export const isHistoricalOcrRequiredHandoff = isOcrRequiredHandoff

function extractPromotedValue(input, key) {
  const promotedKey = `promoted${key[0].toUpperCase()}${key.slice(1)}`
  if (has(input, key)) return clone(input[key])
  if (has(input, promotedKey)) return clone(input[promotedKey])
  if (isObject(input?.promoted) && has(input.promoted, key)) return clone(input.promoted[key])
  const handoff = input?.handoff
  if (has(handoff, promotedKey)) return clone(handoff[promotedKey])
  if (isObject(handoff?.promoted) && has(handoff.promoted, key)) return clone(handoff.promoted[key])
  if (has(handoff, key)) return clone(handoff[key])
  return undefined
}

function normalizeActivation(value) {
  return {
    enabled: false,
    active: false,
    availableForInterpretation: false,
    productionActivation: false,
    decision: 'separate_activation_decision_required',
    route: 'BLOCK_OCR_ROUTE',
    reason: 'component_promotion_does_not_activate_ocr',
    ...(isObject(value) ? clone(value) : {}),
    enabled: false,
    active: false,
    availableForInterpretation: false,
    productionActivation: false,
    route: 'BLOCK_OCR_ROUTE',
  }
}

function normalizeRoutePolicy(value) {
  return {
    ...clone(OCR_ROUTE_POLICY),
    ...(isObject(value) ? clone(value) : {}),
    route: 'BLOCK_OCR_ROUTE',
    BLOCK_OCR_ROUTE: true,
    provider: { name: OCR_PROVIDER_NAME, enabled: false },
    OCRProvider: { enabled: false },
    searchAllowed: false,
    historicalSourceJudgmentAllowed: false,
    semanticCorrectionAllowed: false,
    silentFallbackAllowed: false,
    fallbackPolicy: 'none',
  }
}

function normalizeAuthorityBoundary(value) {
  return { ...clone(OCR_AUTHORITY_BOUNDARY), ...(isObject(value) ? clone(value) : {}) }
}

function metricValue(accuracy, name) {
  if (isObject(accuracy?.metrics) && has(accuracy.metrics, name)) return accuracy.metrics[name]
  if (has(accuracy, name)) return accuracy[name]
  return undefined
}

function numberInRange(value, min = 0, max = Number.POSITIVE_INFINITY) {
  return isFiniteNumber(value) && value >= min && value <= max
}

function validationPolicyErrors(validation, component, corpora, acceptance, { requireEvidence = true, expectedWorkerId = null } = {}) {
  const errors = []
  if (!isObject(validation)) return ['validation_not_object']
  if (!isId(validation.validationId)) add(errors, 'validation_id_invalid')
  if (validation.component !== component) add(errors, 'validation_component_mismatch')
  if (!hasText(validation.workerId)) add(errors, 'validation_worker_id_missing')
  if (expectedWorkerId && validation.workerId !== expectedWorkerId) add(errors, 'validation_worker_id_mismatch')
  if (!OCR_VALIDATION_RESULTS.includes(validation.status)) add(errors, `validation_status_invalid:${validation.status}`)
  if (validation.status === 'UNKNOWN') add(errors, 'validation_result_unknown')
  const expectedCorpusId = canonicalCorpusId(validation.corpusId)
  if (!OCR_VALIDATION_CORPUS_IDS.includes(expectedCorpusId)) add(errors, `validation_corpus_invalid:${validation.corpusId}`)
  const corpus = corpusById(corpora, expectedCorpusId)
  if (!corpus || corpus.availability !== 'supplied') add(errors, `validation_corpus_unavailable:${expectedCorpusId}`)
  if (corpus && corpus.frozen !== true) add(errors, `validation_corpus_not_frozen:${expectedCorpusId}`)
  if (corpus && corpus.localOnly !== true) add(errors, `validation_corpus_not_local:${expectedCorpusId}`)
  if (!isHash(validation.inputSha256)) add(errors, 'validation_input_hash_missing')
  if (!isHash(validation.outputSha256)) add(errors, 'validation_output_hash_missing')

  if (!isObject(validation.expected)) add(errors, 'validation_expected_not_object')
  else {
    const expectedCaseCount = validation.expected.caseCount
    if (!Number.isInteger(expectedCaseCount) || expectedCaseCount <= 0) add(errors, 'validation_expected_case_count_invalid')
    if (corpus?.caseCount !== null && corpus?.caseCount !== undefined && expectedCaseCount !== corpus.caseCount) add(errors, 'validation_case_count_does_not_match_corpus')
    if (corpus?.availability === 'supplied' && (!isHash(validation.expected.manifestSha256) || validation.expected.manifestSha256 !== corpus.manifestSha256)) add(errors, 'validation_manifest_identity_mismatch')
  }

  const accuracy = validation.accuracy
  if (!isObject(accuracy) || !isObject(accuracy.metrics)) add(errors, 'validation_accuracy_missing')
  else {
    if (!Number.isInteger(accuracy.evaluatedCases) || accuracy.evaluatedCases <= 0) add(errors, 'validation_evaluated_case_count_invalid')
    if (!Number.isInteger(accuracy.mismatches) || accuracy.mismatches < 0 || (Number.isInteger(accuracy.evaluatedCases) && accuracy.mismatches > accuracy.evaluatedCases)) add(errors, 'validation_mismatch_count_invalid')
    const requiredMetrics = component === 'det' ? ['precision', 'recall', 'f1', 'geometryMatchRate'] : ['exactMatchRate', 'characterErrorRate', 'wordErrorRate']
    requiredMetrics.forEach(name => {
      if (!numberInRange(metricValue(accuracy, name), 0, component === 'rec' && /ErrorRate$/.test(name) ? Number.POSITIVE_INFINITY : 1)) add(errors, `validation_metric_invalid:${name}`)
    })
  }

  const reproducibility = validation.reproducibility
  if (!isObject(reproducibility)) add(errors, 'validation_reproducibility_missing')
  else {
    if (!Number.isInteger(reproducibility.repeatCount) || reproducibility.repeatCount < 2) add(errors, 'validation_reproducibility_repeat_count_invalid')
    if (!Array.isArray(reproducibility.outputSha256s) || reproducibility.outputSha256s.length < 2 || reproducibility.outputSha256s.some(hash => !isHash(hash))) add(errors, 'validation_reproducibility_hashes_invalid')
    else if (new Set(reproducibility.outputSha256s).size !== 1 || reproducibility.outputSha256s[0] !== validation.outputSha256) add(errors, 'validation_reproducibility_mismatch')
    if (reproducibility.deterministic !== true) add(errors, 'validation_not_deterministic')
  }

  const runtime = validation.runtime
  if (!isObject(runtime)) add(errors, 'validation_runtime_missing')
  else {
    if (runtime.execution !== 'local') add(errors, 'validation_runtime_not_local')
    if (runtime.os !== 'darwin') add(errors, 'validation_runtime_os_not_macos')
    if (runtime.architecture !== 'arm64') add(errors, 'validation_runtime_architecture_not_arm64')
    if (!['apple-m1', 'apple-silicon-arm64'].includes(runtime.machine)) add(errors, 'validation_runtime_not_m1_compatible')
    if (runtime.networkAccess !== false) add(errors, 'validation_runtime_network_enabled')
    if (runtime.compatible !== true || runtime.observed !== true) add(errors, 'validation_runtime_compatibility_unverified')
  }

  const resources = validation.resources
  if (!isObject(resources)) add(errors, 'validation_resources_missing')
  else {
    for (const key of ['peakRssMiB', 'wallTimeMs', 'cpuSeconds']) if (!isFiniteNumber(resources[key]) || resources[key] < 0) add(errors, `validation_resource_invalid:${key}`)
    if (!isObject(resources.limits)) add(errors, 'validation_resource_limits_missing')
    else {
      if (!isFiniteNumber(resources.limits.peakRssMiBMax) || resources.limits.peakRssMiBMax < 0 || (isFiniteNumber(resources.peakRssMiB) && resources.peakRssMiB > resources.limits.peakRssMiBMax)) add(errors, 'validation_resource_peak_rss_over_limit')
      if (!isFiniteNumber(resources.limits.wallTimeMsMax) || resources.limits.wallTimeMsMax < 0 || (isFiniteNumber(resources.wallTimeMs) && resources.wallTimeMs > resources.limits.wallTimeMsMax)) add(errors, 'validation_resource_wall_time_over_limit')
      if (!isFiniteNumber(resources.limits.cpuSecondsMax) || resources.limits.cpuSecondsMax < 0 || (isFiniteNumber(resources.cpuSeconds) && resources.cpuSeconds > resources.limits.cpuSecondsMax)) add(errors, 'validation_resource_cpu_over_limit')
    }
  }

  const boundary = validation.licenseDataBoundary
  if (!isObject(boundary)) add(errors, 'validation_license_data_boundary_missing')
  else {
    if (boundary.licenseStatus !== 'VERIFIED') add(errors, 'validation_license_not_verified')
    if (!Array.isArray(boundary.licenseEvidenceRefs) || boundary.licenseEvidenceRefs.length === 0 || boundary.licenseEvidenceRefs.some(ref => !safePath(ref))) add(errors, 'validation_license_evidence_missing_or_unsafe')
    if (boundary.dataStatus !== 'VERIFIED') add(errors, 'validation_data_boundary_not_verified')
    if (!Array.isArray(boundary.dataEvidenceRefs) || boundary.dataEvidenceRefs.length === 0 || boundary.dataEvidenceRefs.some(ref => !safePath(ref))) add(errors, 'validation_data_evidence_missing_or_unsafe')
    if (boundary.localOnly !== true) add(errors, 'validation_data_not_local_only')
    if (boundary.networkAccess !== false) add(errors, 'validation_data_network_enabled')
    if (boundary.sourceUpload !== false) add(errors, 'validation_source_upload_enabled')
    if (boundary.modelDownload !== false) add(errors, 'validation_model_download_enabled')
  }

  const operations = validation.operationBoundary
  if (!isObject(operations)) add(errors, 'validation_operation_boundary_missing')
  else {
    if (operations.search !== false) add(errors, 'search_forbidden')
    if (operations.historicalSourceJudgment !== false) add(errors, 'historical_source_judgment_forbidden')
    if (operations.semanticCorrection !== false) add(errors, 'semantic_correction_forbidden')
    if (operations.silentFallback !== false) add(errors, 'silent_fallback_forbidden')
  }

  if (requireEvidence && (!Array.isArray(validation.evidenceRefs) || validation.evidenceRefs.length === 0 || validation.evidenceRefs.some(ref => !safePath(ref)))) add(errors, 'validation_evidence_missing_or_unsafe')

  if (validation.status === 'PASSED' && errors.length > 0) add(errors, 'passed_validation_has_failed_gate')
  if (validation.status === 'FAILED' && !hasText(validation.failureReason)) add(errors, 'failed_validation_reason_missing')

  if (isObject(acceptance)) {
    const rules = Array.isArray(acceptance.rules) ? acceptance.rules : []
    if (rules.length === 0) add(errors, 'acceptance_rules_missing')
    rules.forEach(rule => {
      if (!isObject(rule) || !hasText(rule.metric)) add(errors, 'acceptance_rule_invalid')
      else {
        const value = metricValue(accuracy, rule.metric)
        if (!isFiniteNumber(value)) add(errors, `acceptance_metric_missing:${rule.metric}`)
        if (rule.minimum === undefined && rule.maximum === undefined) add(errors, `acceptance_rule_unbounded:${rule.metric}`)
        if (rule.minimum !== undefined && (!isFiniteNumber(rule.minimum) || value < rule.minimum)) add(errors, `accuracy_below_acceptance:${rule.metric}`)
        if (rule.maximum !== undefined && (!isFiniteNumber(rule.maximum) || value > rule.maximum)) add(errors, `accuracy_above_acceptance:${rule.metric}`)
      }
    })
  }
  return sortedUnique(errors)
}

export const PP_OCRV6_WORKER_SPECS = Object.freeze([
  Object.freeze({
    slotId: 'det',
    workerId: 'pp-ocrv6-det',
    workerFamily: 'PP-OCRv6',
    component: 'det',
    componentName: 'detection',
    role: 'first_worker_candidate',
    replaceable: true,
    selectionPolicy: 'explicit_worker_id_only',
    fallbackPolicy: 'none',
    entrypoint: 'local_adapter_required',
    runner: Object.freeze({ kind: 'external_local_adapter', command: null, modelRef: null }),
    localExecution: Object.freeze({ execution: 'local', os: 'darwin', architecture: 'arm64', machine: 'apple-m1', networkAccess: false }),
    licenseStatus: 'not_verified',
    dataBoundaryStatus: 'not_verified',
    activation: Object.freeze({ enabled: false, active: false, availableForInterpretation: false, productionActivation: false, decision: 'separate_activation_decision_required' }),
  }),
  Object.freeze({
    slotId: 'rec',
    workerId: 'pp-ocrv6-rec',
    workerFamily: 'PP-OCRv6',
    component: 'rec',
    componentName: 'recognition',
    role: 'first_worker_candidate',
    replaceable: true,
    selectionPolicy: 'explicit_worker_id_only',
    fallbackPolicy: 'none',
    entrypoint: 'local_adapter_required',
    runner: Object.freeze({ kind: 'external_local_adapter', command: null, modelRef: null }),
    localExecution: Object.freeze({ execution: 'local', os: 'darwin', architecture: 'arm64', machine: 'apple-m1', networkAccess: false }),
    licenseStatus: 'not_verified',
    dataBoundaryStatus: 'not_verified',
    activation: Object.freeze({ enabled: false, active: false, availableForInterpretation: false, productionActivation: false, decision: 'separate_activation_decision_required' }),
  }),
])
export const PP_OCRV6_WORKERS = PP_OCRV6_WORKER_SPECS

// Recognition variants are separate replaceable slots.  The base `rec` slot
// above remains the stable component contract; these descriptors bind actual
// local model revisions without making a model choice or enabling a route.
export const PP_OCRV6_REC_WORKER_SPECS = Object.freeze([
  Object.freeze({
    slotId: 'rec-small',
    workerId: 'pp-ocrv6-small-rec',
    workerFamily: 'PP-OCRv6',
    component: 'rec',
    componentName: 'recognition',
    modelVariant: 'small',
    modelId: 'PaddlePaddle/PP-OCRv6_small_rec_safetensors',
    modelRevision: 'fe049fb103f57443fe8840c54ed06b702f3c1de5',
    role: 'first_worker_candidate_variant',
    replaceable: true,
    selectionPolicy: 'explicit_worker_id_only',
    fallbackPolicy: 'none',
    entrypoint: 'tools/ocr/ppocrv6_rec_adapter.py',
    runner: Object.freeze({ kind: 'python_local_transformers', command: 'tools/ocr/ppocrv6_rec_adapter.py', modelRef: 'PaddlePaddle/PP-OCRv6_small_rec_safetensors' }),
    localExecution: Object.freeze({ execution: 'local', os: 'darwin', architecture: 'arm64', machine: 'apple-m1', networkAccess: false }),
    licenseStatus: 'not_verified',
    dataBoundaryStatus: 'not_verified',
    activation: Object.freeze({ enabled: false, active: false, availableForInterpretation: false, productionActivation: false, decision: 'separate_activation_decision_required' }),
  }),
  Object.freeze({
    slotId: 'rec-medium',
    workerId: 'pp-ocrv6-medium-rec',
    workerFamily: 'PP-OCRv6',
    component: 'rec',
    componentName: 'recognition',
    modelVariant: 'medium',
    modelId: 'PaddlePaddle/PP-OCRv6_medium_rec_safetensors',
    modelRevision: '024cad6a831de75c2c3c26e711ba8c4a82ccd24b',
    role: 'first_worker_candidate_variant',
    replaceable: true,
    selectionPolicy: 'explicit_worker_id_only',
    fallbackPolicy: 'none',
    entrypoint: 'tools/ocr/ppocrv6_rec_adapter.py',
    runner: Object.freeze({ kind: 'python_local_transformers', command: 'tools/ocr/ppocrv6_rec_adapter.py', modelRef: 'PaddlePaddle/PP-OCRv6_medium_rec_safetensors' }),
    localExecution: Object.freeze({ execution: 'local', os: 'darwin', architecture: 'arm64', machine: 'apple-m1', networkAccess: false }),
    licenseStatus: 'not_verified',
    dataBoundaryStatus: 'not_verified',
    activation: Object.freeze({ enabled: false, active: false, availableForInterpretation: false, productionActivation: false, decision: 'separate_activation_decision_required' }),
  }),
])

export const PP_OCRV6_REC_WORKERS = PP_OCRV6_REC_WORKER_SPECS

export function buildPpOcrV6RecognitionWorkerSlots(overrides = {}) {
  return normalizeSlots(PP_OCRV6_REC_WORKER_SPECS.map(spec => ({
    ...spec,
    ...(isObject(overrides?.[spec.modelVariant]) ? clone(overrides[spec.modelVariant]) : {}),
  })))
}

export const createPpOcrV6RecognitionWorkerSlots = buildPpOcrV6RecognitionWorkerSlots

export function buildPpOcrV6WorkerSlots(overrides = {}) {
  return normalizeSlots(PP_OCRV6_WORKER_SPECS.map(spec => ({
    ...spec,
    ...(isObject(overrides?.[spec.component]) ? clone(overrides[spec.component]) : {}),
  })))
}

export const createPpOcrV6WorkerSlots = buildPpOcrV6WorkerSlots

function validateWorkerSlot(slot, errors, path) {
  if (!isObject(slot)) {
    add(errors, `${path}_not_object`)
    return
  }
  for (const key of ['slotId', 'workerId', 'workerFamily', 'component', 'entrypoint', 'selectionPolicy', 'fallbackPolicy']) if (!hasText(slot[key])) add(errors, `${path}.${key}_missing`)
  if (!isId(slot.slotId)) add(errors, `${path}.slot_id_invalid`)
  if (!isId(slot.workerId)) add(errors, `${path}.worker_id_invalid`)
  if (!COMPONENT_SET.has(slot.component)) add(errors, `${path}.component_invalid`)
  if (slot.replaceable !== true) add(errors, `${path}.replaceable_required`)
  if (slot.selectionPolicy !== 'explicit_worker_id_only') add(errors, `${path}.selection_policy_invalid`)
  if (slot.fallbackPolicy !== 'none') add(errors, `${path}.silent_fallback_forbidden`)
  if (slot.licenseStatus === 'verified' || slot.dataBoundaryStatus === 'verified') add(errors, `${path}.unverified_promotion_metadata`)
  if (!isObject(slot.localExecution) || slot.localExecution.execution !== 'local' || slot.localExecution.os !== 'darwin' || slot.localExecution.architecture !== 'arm64' || !['apple-m1', 'apple-silicon-arm64'].includes(slot.localExecution.machine) || slot.localExecution.networkAccess !== false) add(errors, `${path}.local_m1_contract_invalid`)
  if (!isObject(slot.activation) || slot.activation.enabled !== false || slot.activation.active !== false || slot.activation.availableForInterpretation !== false || slot.activation.productionActivation !== false) add(errors, `${path}.activation_promoted`)
}

function acceptanceForComponent(input, component) {
  const source = input?.acceptanceCriteria ?? input?.acceptance ?? {}
  if (isObject(source?.[component])) return clone(source[component])
  const evidence = input?.componentEvidence?.[component]
  return isObject(evidence?.acceptance) ? clone(evidence.acceptance) : null
}

function promotionForComponent({ component, evidence, worker, corpora, acceptance }) {
  const structuralErrors = []
  if (!evidence) return { component, workerId: worker?.workerId || null, status: 'UNKNOWN', eligibleForActivation: false, reasonCodes: ['component_evidence_missing'], validationIds: [] }
  if (evidence.component !== component) add(structuralErrors, 'component_evidence_component_mismatch')
  if (evidence.workerId !== worker?.workerId) add(structuralErrors, 'component_evidence_worker_mismatch')
  if (evidence.verificationMode !== 'independent_per_component') add(structuralErrors, 'component_verification_not_independent')
  const validations = Array.isArray(evidence.validations) ? evidence.validations : []
  if (validations.length !== OCR_VALIDATION_CORPUS_IDS.length) add(structuralErrors, 'component_must_have_two_independent_validations')
  const corpusIds = validations.map(item => canonicalCorpusId(item?.corpusId))
  for (const corpusId of OCR_VALIDATION_CORPUS_IDS) {
    if (!corpusIds.includes(corpusId)) add(structuralErrors, `component_validation_missing:${corpusId}`)
  }
  if (new Set(corpusIds).size !== corpusIds.length) add(structuralErrors, 'component_validation_corpus_duplicate')
  if (!isObject(acceptance) || !Array.isArray(acceptance.rules) || acceptance.rules.length === 0) add(structuralErrors, 'component_acceptance_criteria_missing')
  else {
    if (acceptance.perCorpus !== true) add(structuralErrors, 'component_acceptance_must_be_per_corpus')
    acceptance.rules.forEach(rule => {
      if (!isObject(rule) || (rule.minimum === undefined && rule.maximum === undefined)) add(structuralErrors, 'component_acceptance_rule_unbounded')
    })
  }
  validations.forEach(validation => structuralErrors.push(...validationPolicyErrors(validation, component, corpora, acceptance, { expectedWorkerId: worker?.workerId || null })))
  const errors = sortedUnique(structuralErrors)
  const conflict = errors.some(code => code.includes('conflict')) || validations.some(item => item.status === 'CONFLICT' || item.outcome === 'CONFLICT')
  const policyViolation = errors.some(code => ['search_forbidden', 'historical_source_judgment_forbidden', 'semantic_correction_forbidden', 'silent_fallback_forbidden', 'validation_runtime_network_enabled', 'validation_data_network_enabled', 'validation_source_upload_enabled'].includes(code))
  const failed = validations.some(item => item.status === 'FAILED')
  const deterministicFailure = errors.some(code => code.startsWith('accuracy_')
    || code.startsWith('validation_metric_invalid')
    || code.startsWith('validation_resource_') && code.includes('over_limit')
    || code === 'validation_not_deterministic'
    || code === 'validation_reproducibility_mismatch'
    || code === 'validation_case_count_does_not_match_corpus'
    || code === 'validation_manifest_identity_mismatch'
    || code === 'validation_status_invalid:FAILED')
  const status = conflict ? 'CONFLICT' : policyViolation || failed || deterministicFailure ? 'BLOCKED' : errors.length > 0 ? 'UNKNOWN' : 'PROMOTED'
  return {
    component,
    workerId: worker?.workerId || evidence.workerId || null,
    status,
    eligibleForActivation: false,
    reasonCodes: errors,
    validationIds: validations.map(item => item.validationId).filter(isId).sort(),
    independentCorpora: [...new Set(corpusIds)].sort(),
  }
}

function summarizePromotion(promotions) {
  const statuses = OCR_COMPONENTS.map(component => promotions?.[component]?.status)
  if (statuses.includes('CONFLICT')) return 'CONFLICT'
  if (statuses.includes('BLOCKED')) return 'BLOCKED'
  if (statuses.includes('UNKNOWN')) return 'UNKNOWN'
  return 'PROMOTED'
}

export function evaluateHistoricalOcrComponentPromotion({ component, evidence, worker, corpora = [], acceptance } = {}) {
  if (!COMPONENT_SET.has(component)) return { component: component || null, workerId: worker?.workerId || null, status: 'UNKNOWN', eligibleForActivation: false, reasonCodes: ['component_invalid'], validationIds: [] }
  return promotionForComponent({ component, evidence, worker: worker || workerSpecFor(component), corpora, acceptance })
}

export function buildHistoricalOcrTeam({
  handoff = null,
  promoted,
  promotedGeometry,
  promotedTableGrid,
  workers,
  slots,
  validationCorpora,
  corpora,
  componentEvidence,
  componentValidations,
  acceptanceCriteria,
  acceptance,
  activation,
  routePolicy,
  authorityBoundary,
} = {}) {
  const normalizedWorkers = normalizeSlots(workers || slots)
  const normalizedCorpora = normalizeCorpora({ validationCorpora, corpora })
  const inputForValues = { handoff, promoted, promotedGeometry, promotedTableGrid }
  const geometry = extractPromotedValue(inputForValues, 'geometry')
  const tableGrid = extractPromotedValue(inputForValues, 'tableGrid')
  const evidenceMap = normalizeComponentEvidenceMap({ componentEvidence: componentEvidence || componentValidations }, normalizedWorkers)
  const criteriaSource = acceptanceCriteria || acceptance || {}
  const promotions = Object.fromEntries(OCR_COMPONENTS.map(component => [
    component,
    promotionForComponent({
      component,
      evidence: evidenceMap[component],
      worker: expectedWorkerForComponent({ workers: normalizedWorkers }, component),
      corpora: normalizedCorpora,
      acceptance: isObject(criteriaSource?.[component]) ? criteriaSource[component] : evidenceMap[component].acceptance,
    }),
  ]))
  return {
    schemaVersion: HISTORICAL_OCR_TEAM_SCHEMA,
    teamVersion: HISTORICAL_OCR_TEAM_VERSION,
    specialistId: HISTORICAL_OCR_SPECIALIST_ID,
    mode: 'bounded_ocr_team',
    handoff: clone(handoff),
    BLOCK_OCR_ROUTE: true,
    OCRProvider: { enabled: false },
    promotedGeometry: clone(geometry),
    promotedTableGrid: clone(tableGrid),
    preservation: {
      source: 'existing_handoff_and_promoted_components',
      ocrRequirement: isOcrRequiredHandoff(handoff) ? OCR_REQUIRED : null,
      handoffSha256: isObject(handoff) ? historicalOcrContentSha256(handoff) : null,
      promotedGeometrySha256: geometry === undefined ? null : historicalOcrContentSha256(geometry),
      promotedTableGridSha256: tableGrid === undefined ? null : historicalOcrContentSha256(tableGrid),
    },
    routePolicy: normalizeRoutePolicy(routePolicy),
    workers: normalizedWorkers,
    validationCorpora: normalizedCorpora,
    acceptanceCriteria: clone(criteriaSource),
    componentEvidence: evidenceMap,
    promotion: promotions,
    status: summarizePromotion(promotions),
    activation: normalizeActivation(activation),
    authorityBoundary: normalizeAuthorityBoundary(authorityBoundary),
  }
}

export const createHistoricalOcrTeam = buildHistoricalOcrTeam
export const createHistoricalOcrSpecialist = buildHistoricalOcrTeam

function validateCorpus(corpus, errors, path) {
  if (!isObject(corpus)) {
    add(errors, `${path}_not_object`)
    return
  }
  const corpusId = canonicalCorpusId(corpus.corpusId)
  if (!OCR_VALIDATION_CORPUS_IDS.includes(corpusId)) add(errors, `${path}.corpus_id_invalid`)
  if (corpus.required !== true) add(errors, `${path}.required`)
  if (corpus.frozen !== true) add(errors, `${path}.not_frozen`)
  if (corpus.localOnly !== true) add(errors, `${path}.not_local_only`)
  if (!['supplied', 'not_supplied', 'invalid'].includes(corpus.availability)) add(errors, `${path}.availability_invalid`)
  if (corpus.availability === 'supplied') {
    if (!safePath(corpus.manifestPath)) add(errors, `${path}.manifest_path_invalid`)
    if (!isHash(corpus.manifestSha256)) add(errors, `${path}.manifest_hash_invalid`)
    if (!Number.isInteger(corpus.caseCount) || corpus.caseCount <= 0) add(errors, `${path}.case_count_invalid`)
    if (!Array.isArray(corpus.evidenceRefs) || corpus.evidenceRefs.length === 0 || corpus.evidenceRefs.some(ref => !safePath(ref))) add(errors, `${path}.evidence_refs_invalid`)
  }
  if (corpus.availability === 'not_supplied' && (corpus.manifestPath !== null || corpus.manifestSha256 !== null || corpus.caseCount !== null)) add(errors, `${path}.not_supplied_identity_present`)
}

function validateComponentEvidence(evidence, component, workers, corpora, acceptanceCriteria, errors, path) {
  if (!isObject(evidence)) {
    add(errors, `${path}_not_object`)
    return
  }
  const worker = expectedWorkerForComponent({ workers }, component)
  if (evidence.component !== component) add(errors, `${path}.component_mismatch`)
  if (evidence.workerId !== worker?.workerId) add(errors, `${path}.worker_mismatch`)
  if (evidence.verificationMode !== 'independent_per_component') add(errors, `${path}.not_independent`)
  if (!Array.isArray(evidence.validations)) add(errors, `${path}.validations_not_array`)
  else {
    const seen = new Set()
    const validationIds = new Set()
    requireSorted(evidence.validations, `${path}.validations`, errors, validation => `${canonicalCorpusId(validation?.corpusId)}:${validation?.validationId}`)
    evidence.validations.forEach((validation, index) => {
      const validationErrors = validationPolicyErrors(validation, component, corpora, acceptanceCriteria?.[component] || evidence.acceptance, { expectedWorkerId: worker?.workerId || null })
      validationErrors.forEach(code => add(errors, `${path}.validations[${index}].${code}`))
      const corpusId = canonicalCorpusId(validation?.corpusId)
      if (seen.has(corpusId)) add(errors, `${path}.duplicate_corpus_validation:${corpusId}`)
      if (validationIds.has(validation?.validationId)) add(errors, `${path}.duplicate_validation_id:${validation?.validationId}`)
      seen.add(corpusId)
      validationIds.add(validation?.validationId)
    })
    const ids = [...seen].map(canonicalCorpusId)
    OCR_VALIDATION_CORPUS_IDS.forEach(corpusId => {
      if (!ids.includes(corpusId)) add(errors, `${path}.required_corpus_missing:${corpusId}`)
    })
  }
  if (!['UNKNOWN', 'VERIFIED', 'CONFLICT'].includes(evidence.status)) add(errors, `${path}.status_invalid`)
  if (!['UNKNOWN', 'VERIFIED', 'CONFLICT'].includes(evidence.outcome)) add(errors, `${path}.outcome_invalid`)
}

function checkFixedRoutePolicy(routePolicy, errors, path = 'routePolicy') {
  if (!isObject(routePolicy)) {
    add(errors, `${path}_not_object`)
    return
  }
  if (routePolicy.route !== 'BLOCK_OCR_ROUTE') add(errors, `${path}.route_not_blocked`)
  if (routePolicy.BLOCK_OCR_ROUTE !== true) add(errors, `${path}.BLOCK_OCR_ROUTE_promoted`)
  if (!isObject(routePolicy.provider) || routePolicy.provider.name !== OCR_PROVIDER_NAME || routePolicy.provider.enabled !== false) add(errors, `${path}.provider_enabled_or_changed`)
  if (!isObject(routePolicy.OCRProvider) || routePolicy.OCRProvider.enabled !== false) add(errors, `${path}.OCRProvider_enabled_or_changed`)
  for (const key of ['searchAllowed', 'historicalSourceJudgmentAllowed', 'semanticCorrectionAllowed', 'silentFallbackAllowed']) if (routePolicy[key] !== false) add(errors, `${path}.${key}_forbidden`)
  if (routePolicy.fallbackPolicy !== 'none') add(errors, `${path}.fallback_policy_invalid`)
}

function checkFixedActivation(activation, errors, path = 'activation') {
  if (!isObject(activation)) {
    add(errors, `${path}_not_object`)
    return
  }
  if (activation.enabled !== false || activation.active !== false || activation.availableForInterpretation !== false || activation.productionActivation !== false) add(errors, `${path}.promoted`)
  if (activation.route !== 'BLOCK_OCR_ROUTE') add(errors, `${path}.route_not_blocked`)
  if (activation.decision !== 'separate_activation_decision_required') add(errors, `${path}.decision_not_separate`)
}

function checkAuthorityBoundary(boundary, errors) {
  if (!isObject(boundary)) {
    add(errors, 'authority_boundary_not_object')
    return
  }
  if (canonicalHistoricalOcrJson(boundary) !== canonicalHistoricalOcrJson(OCR_AUTHORITY_BOUNDARY)) add(errors, 'authority_boundary_promoted_or_changed')
}

const TEAM_FIELDS = new Set([
  'schemaVersion', 'teamVersion', 'specialistId', 'mode', 'status', 'handoff', 'BLOCK_OCR_ROUTE', 'OCRProvider',
  'promotedGeometry', 'promotedTableGrid', 'preservation', 'routePolicy',
  'workers', 'validationCorpora', 'acceptanceCriteria', 'componentEvidence',
  'promotion', 'activation', 'authorityBoundary',
])

const PACKET_FIELDS = new Set([
  'schemaVersion', 'packetVersion', 'specialistId', 'mode', 'status', 'handoff', 'BLOCK_OCR_ROUTE', 'OCRProvider',
  'promotedGeometry', 'promotedTableGrid', 'preservation', 'routePolicy',
  'workers', 'validationCorpora', 'acceptanceCriteria', 'componentEvidence',
  'promotion', 'outcomes', 'activation', 'authorityBoundary', 'hashScopes',
  'packetContentSha256',
])

function checkRootFields(value, allowed, path, errors) {
  Object.keys(value || {}).forEach(key => {
    if (!allowed.has(key)) add(errors, `unknown_field:${path}.${key}`)
  })
}

function requireSorted(values, path, errors, key = value => value) {
  if (!Array.isArray(values)) return
  const actual = values.map(key)
  const expected = [...actual].sort((left, right) => String(left).localeCompare(String(right)))
  if (JSON.stringify(actual) !== JSON.stringify(expected)) add(errors, `${path}_not_deterministically_sorted`)
}

const forbiddenOperationKey = key => key.replace(/[_\s-]/g, '').toLowerCase()
const FORBIDDEN_OPERATION_KEYS = new Set([
  'search', 'websearch', 'searchresults', 'sourcejudgment',
  'historicalsourcejudgment', 'semanticcorrection',
  'semanticpatch', 'correctedtext', 'silentfallback', 'fallbackworkerid',
  'fallbackmodel', 'fallbackreason', 'retrievedsources', 'activeworkerid',
])

function checkForbiddenOperationFields(value, path, errors) {
  if (Array.isArray(value)) {
    value.forEach((child, index) => checkForbiddenOperationFields(child, `${path}[${index}]`, errors))
    return
  }
  if (!isObject(value)) return
  if (path === 'handoff' || path.endsWith('.handoff') || path.includes('.handoff.')) return
  for (const [key, child] of Object.entries(value)) {
    const compact = forbiddenOperationKey(key)
    const fixedFalseBoundary = (path.includes('operationBoundary') || path.includes('routePolicy') || path.includes('authorityBoundary')) && child === false
    if (FORBIDDEN_OPERATION_KEYS.has(compact) && !fixedFalseBoundary) add(errors, `forbidden_operation_field:${path}.${key}`)
    checkForbiddenOperationFields(child, `${path}.${key}`, errors)
  }
}

export function checkHistoricalOcrTeam(team, options = {}) {
  const { expectedHandoff, expectedPromotedGeometry, expectedPromotedTableGrid } = options || {}
  const errors = []
  if (!isObject(team)) return ['team_not_object']
  checkRootFields(team, TEAM_FIELDS, 'team', errors)
  checkForbiddenOperationFields(team, 'team', errors)
  if (team.schemaVersion !== HISTORICAL_OCR_TEAM_SCHEMA) add(errors, 'team_schema_version_mismatch')
  if (team.teamVersion !== HISTORICAL_OCR_TEAM_VERSION) add(errors, 'team_version_mismatch')
  if (team.specialistId !== HISTORICAL_OCR_SPECIALIST_ID) add(errors, 'specialist_id_mismatch')
  if (team.mode !== 'bounded_ocr_team') add(errors, 'team_mode_invalid')
  if (!isObject(team.acceptanceCriteria)) add(errors, 'acceptance_criteria_not_object')
  if (team.BLOCK_OCR_ROUTE !== true) add(errors, 'team.BLOCK_OCR_ROUTE_promoted')
  if (!isObject(team.OCRProvider) || canonicalHistoricalOcrJson(team.OCRProvider) !== canonicalHistoricalOcrJson(OCRProvider)) add(errors, 'team.OCRProvider_enabled_or_changed')
  if (!isOcrRequiredHandoff(team.handoff)) add(errors, 'OCR_REQUIRED_handoff_missing')
  if (expectedHandoff !== undefined && canonicalHistoricalOcrJson(team.handoff) !== canonicalHistoricalOcrJson(expectedHandoff)) add(errors, 'OCR_REQUIRED_handoff_not_preserved')
  if (!has(team, 'promotedGeometry') || team.promotedGeometry === undefined) add(errors, 'promoted_geometry_missing')
  else if (team.promotedGeometry === null || typeof team.promotedGeometry !== 'object') add(errors, 'promoted_geometry_invalid')
  if (!has(team, 'promotedTableGrid') || team.promotedTableGrid === undefined) add(errors, 'promoted_table_grid_missing')
  else if (team.promotedTableGrid === null || typeof team.promotedTableGrid !== 'object') add(errors, 'promoted_table_grid_invalid')
  if (expectedPromotedGeometry !== undefined && canonicalHistoricalOcrJson(team.promotedGeometry) !== canonicalHistoricalOcrJson(expectedPromotedGeometry)) add(errors, 'promoted_geometry_not_preserved')
  if (expectedPromotedTableGrid !== undefined && canonicalHistoricalOcrJson(team.promotedTableGrid) !== canonicalHistoricalOcrJson(expectedPromotedTableGrid)) add(errors, 'promoted_table_grid_not_preserved')
  checkFixedRoutePolicy(team.routePolicy, errors)
  checkFixedActivation(team.activation, errors)
  checkAuthorityBoundary(team.authorityBoundary, errors)

  if (!isObject(team.preservation)) add(errors, 'preservation_not_object')
  else {
    if (team.preservation.ocrRequirement !== OCR_REQUIRED) add(errors, 'preservation_ocr_requirement_missing')
    if (!isHash(team.preservation.handoffSha256) || historicalOcrContentSha256(team.handoff) !== team.preservation.handoffSha256) add(errors, 'preservation_handoff_hash_mismatch')
    if (!isHash(team.preservation.promotedGeometrySha256) || historicalOcrContentSha256(team.promotedGeometry) !== team.preservation.promotedGeometrySha256) add(errors, 'preservation_geometry_hash_mismatch')
    if (!isHash(team.preservation.promotedTableGridSha256) || historicalOcrContentSha256(team.promotedTableGrid) !== team.preservation.promotedTableGridSha256) add(errors, 'preservation_table_grid_hash_mismatch')
  }

  if (!Array.isArray(team.workers)) add(errors, 'workers_not_array')
  else {
    const slots = new Set()
    const ids = new Set()
    team.workers.forEach((worker, index) => {
      validateWorkerSlot(worker, errors, `workers[${index}]`)
      if (slots.has(worker?.slotId)) add(errors, `duplicate_worker_slot:${worker?.slotId}`)
      if (ids.has(worker?.workerId)) add(errors, `duplicate_worker_id:${worker?.workerId}`)
      slots.add(worker?.slotId); ids.add(worker?.workerId)
    })
    OCR_COMPONENTS.forEach(component => {
      if (!team.workers.some(worker => worker?.component === component)) add(errors, `worker_slot_missing:${component}`)
    })
  }

  if (!Array.isArray(team.validationCorpora)) add(errors, 'validation_corpora_not_array')
  else {
    const ids = new Set()
    team.validationCorpora.forEach((corpus, index) => {
      validateCorpus(corpus, errors, `validationCorpora[${index}]`)
      const id = canonicalCorpusId(corpus?.corpusId)
      if (ids.has(id)) add(errors, `duplicate_validation_corpus:${id}`)
      ids.add(id)
    })
    OCR_VALIDATION_CORPUS_IDS.forEach(corpusId => { if (!ids.has(corpusId)) add(errors, `required_validation_corpus_missing:${corpusId}`) })
  }

  const evidence = team.componentEvidence
  if (!isObject(evidence)) add(errors, 'component_evidence_not_object')
  else OCR_COMPONENTS.forEach(component => validateComponentEvidence(evidence[component], component, team.workers || [], team.validationCorpora || [], team.acceptanceCriteria || team.acceptance || {}, errors, `componentEvidence.${component}`))

  if (!isObject(team.promotion)) add(errors, 'promotion_not_object')
  else OCR_COMPONENTS.forEach(component => {
    const expected = evaluateHistoricalOcrComponentPromotion({
      component,
      evidence: evidence?.[component],
      worker: expectedWorkerForComponent(team, component),
      corpora: team.validationCorpora || [],
      acceptance: team.acceptanceCriteria?.[component] || team.acceptance?.[component] || evidence?.[component]?.acceptance,
    })
    if (canonicalHistoricalOcrJson(team.promotion[component]) !== canonicalHistoricalOcrJson(expected)) add(errors, `promotion_not_derived:${component}`)
    const evidenceItem = evidence?.[component]
    if (expected.status === 'PROMOTED' && (evidenceItem?.status !== 'VERIFIED' || evidenceItem?.outcome !== 'VERIFIED')) add(errors, `component_evidence_status_not_derived:${component}`)
    if (expected.status === 'CONFLICT' && (evidenceItem?.status !== 'CONFLICT' || evidenceItem?.outcome !== 'CONFLICT')) add(errors, `component_evidence_conflict_not_derived:${component}`)
    if (expected.status !== 'PROMOTED' && expected.status !== 'CONFLICT' && (evidenceItem?.status === 'VERIFIED' || evidenceItem?.outcome === 'VERIFIED')) add(errors, `component_evidence_promotion_without_gate:${component}`)
  })
  const expectedTeamStatus = summarizePromotion(team.promotion || {})
  if (team.status !== expectedTeamStatus) add(errors, 'team_status_not_derived')
  return sortedUnique(errors)
}

export function validateHistoricalOcrTeam(team, options = {}) {
  const errors = checkHistoricalOcrTeam(team, options)
  return { pass: errors.length === 0, errors }
}

export function assertHistoricalOcrTeam(team, options = {}) {
  const result = validateHistoricalOcrTeam(team, options)
  if (!result.pass) throw new Error(`historical OCR team contract invalid: ${result.errors.join(', ')}`)
  return true
}

function stableWorkerList(workers) {
  return (workers || []).map(clone).sort((a, b) => String(a.slotId).localeCompare(String(b.slotId)))
}

function stableEvidenceMap(evidence) {
  return Object.fromEntries(OCR_COMPONENTS.map(component => {
    const value = clone(evidence?.[component] || defaultComponentEvidence(component, workerSpecFor(component).workerId))
    if (Array.isArray(value.validations)) value.validations.sort((a, b) => String(a.corpusId).localeCompare(String(b.corpusId)) || String(a.validationId).localeCompare(String(b.validationId)))
    return [component, value]
  }))
}

function emptyOutcome(component) {
  return {
    component,
    status: 'UNKNOWN',
    consensusOutputSha256: null,
    workerIds: [],
    conflictingWorkerIds: [],
    unknownWorkerIds: [],
    winnerWorkerId: null,
    reasonCodes: ['no_usable_output'],
  }
}

/**
 * Adjudicate raw component outputs without choosing a confidence winner.
 * A missing/unknown peer remains UNKNOWN; differing hashes remain CONFLICT.
 */
export function adjudicateHistoricalOcrOutputs({ component, outputs = [], requiredWorkerIds = [], promotedGeometry, promotedTableGrid } = {}) {
  if (!COMPONENT_SET.has(component)) return { ...emptyOutcome(component || null), reasonCodes: ['component_invalid'] }
  const records = Array.isArray(outputs) ? outputs : []
  if (records.length === 0) return emptyOutcome(component)
  const unknownWorkerIds = []
  const valid = []
  const malformed = []
  for (const record of records) {
    if (!isObject(record) || record.component !== component || !hasText(record.workerId)) {
      malformed.push(record?.workerId || null)
      continue
    }
    const status = record.status || record.outcome || 'UNKNOWN'
    if (status === 'UNKNOWN' || status === 'NOT_RUN' || !isHash(record.outputSha256 || record.output?.outputSha256 || record.output?.sha256)) {
      unknownWorkerIds.push(record.workerId)
      continue
    }
    if (status === 'CONFLICT') {
      valid.push({ ...record, outputSha256: record.outputSha256 || record.output?.outputSha256 || record.output?.sha256 })
      continue
    }
    const recordGeometry = record.promotedGeometry ?? record.output?.promotedGeometry
    const recordTableGrid = record.promotedTableGrid ?? record.output?.promotedTableGrid
    if (promotedGeometry !== undefined && recordGeometry !== undefined && canonicalHistoricalOcrJson(recordGeometry) !== canonicalHistoricalOcrJson(promotedGeometry)) unknownWorkerIds.push(record.workerId)
    if (promotedTableGrid !== undefined && recordTableGrid !== undefined && canonicalHistoricalOcrJson(recordTableGrid) !== canonicalHistoricalOcrJson(promotedTableGrid)) unknownWorkerIds.push(record.workerId)
    valid.push({ ...record, outputSha256: record.outputSha256 || record.output?.outputSha256 || record.output?.sha256 })
  }
  const required = [...new Set(requiredWorkerIds)].filter(hasText)
  const present = new Set(records.map(record => record?.workerId).filter(hasText))
  const missingRequired = required.filter(workerId => !present.has(workerId))
  if (malformed.length > 0 || unknownWorkerIds.length > 0 || missingRequired.length > 0) {
    return {
      component,
      status: 'UNKNOWN',
      consensusOutputSha256: null,
      workerIds: sortedUnique(valid.map(item => item.workerId)),
      conflictingWorkerIds: [],
      unknownWorkerIds: sortedUnique([...unknownWorkerIds, ...missingRequired]),
      winnerWorkerId: null,
      reasonCodes: sortedUnique([
        ...(malformed.length > 0 ? ['malformed_output'] : []),
        ...(unknownWorkerIds.length > 0 ? ['unknown_output_present'] : []),
        ...(missingRequired.length > 0 ? ['required_worker_output_missing'] : []),
      ]),
    }
  }
  if (valid.some(item => item.status === 'CONFLICT')) {
    return {
      component,
      status: 'CONFLICT',
      consensusOutputSha256: null,
      workerIds: sortedUnique(valid.map(item => item.workerId)),
      conflictingWorkerIds: sortedUnique(valid.map(item => item.workerId)),
      unknownWorkerIds: [],
      winnerWorkerId: null,
      reasonCodes: ['worker_reported_conflict'],
    }
  }
  const hashes = [...new Set(valid.map(item => item.outputSha256))]
  if (hashes.length !== 1) {
    return {
      component,
      status: 'CONFLICT',
      consensusOutputSha256: null,
      workerIds: sortedUnique(valid.map(item => item.workerId)),
      conflictingWorkerIds: sortedUnique(valid.map(item => item.workerId)),
      unknownWorkerIds: [],
      winnerWorkerId: null,
      reasonCodes: ['output_hash_conflict'],
    }
  }
  return {
    component,
    status: 'VERIFIED',
    consensusOutputSha256: hashes[0],
    workerIds: sortedUnique(valid.map(item => item.workerId)),
    conflictingWorkerIds: [],
    unknownWorkerIds: [],
    winnerWorkerId: null,
    reasonCodes: ['deterministic_consensus'],
  }
}

export const resolveHistoricalOcrConflict = adjudicateHistoricalOcrOutputs
export const adjudicateOcrOutputs = adjudicateHistoricalOcrOutputs

function normalizeOutcomes(input) {
  const source = input?.outcomes || {}
  return Object.fromEntries(OCR_COMPONENTS.map(component => {
    if (source[component]) return [component, clone(source[component])]
    return [component, { ...emptyOutcome(component), reasonCodes: ['runtime_adjudication_not_supplied'] }]
  }))
}

export function buildHistoricalOcrPacket(input = {}, options = {}) {
  const team = input?.schemaVersion === HISTORICAL_OCR_TEAM_SCHEMA
    ? clone(input)
    : buildHistoricalOcrTeam(input)
  const packet = {
    schemaVersion: HISTORICAL_OCR_PACKET_SCHEMA,
    packetVersion: HISTORICAL_OCR_PACKET_VERSION,
    specialistId: HISTORICAL_OCR_SPECIALIST_ID,
    mode: 'bounded_ocr_team',
    status: summarizePromotion(team.promotion || {}),
    BLOCK_OCR_ROUTE: true,
    OCRProvider: { enabled: false },
    handoff: clone(team.handoff),
    promotedGeometry: clone(team.promotedGeometry),
    promotedTableGrid: clone(team.promotedTableGrid),
    preservation: clone(team.preservation),
    routePolicy: normalizeRoutePolicy(team.routePolicy),
    workers: stableWorkerList(team.workers),
    validationCorpora: (team.validationCorpora || []).map(clone).sort((a, b) => String(a.corpusId).localeCompare(String(b.corpusId))),
    acceptanceCriteria: clone(team.acceptanceCriteria || {}),
    componentEvidence: stableEvidenceMap(team.componentEvidence),
    promotion: clone(team.promotion),
    outcomes: normalizeOutcomes(input),
    activation: normalizeActivation(team.activation),
    authorityBoundary: normalizeAuthorityBoundary(team.authorityBoundary),
    hashScopes: {
      packetContentSha256: 'packet object excluding packetContentSha256, recursively sorted object keys, arrays preserved, JSON plus LF',
      preservedComponentSha256: 'exact canonical JSON of the existing handoff/promoted component values',
    },
  }
  return { ...packet, packetContentSha256: hashWithout(packet, 'packetContentSha256') }
}

export const createHistoricalOcrPacket = buildHistoricalOcrPacket
export const historicalOcrPacketContentSha256 = packet => hashWithout(packet, 'packetContentSha256')

function validatePacketOutcomes(outcomes, errors) {
  if (!isObject(outcomes)) {
    add(errors, 'outcomes_not_object')
    return
  }
  OCR_COMPONENTS.forEach(component => {
    const outcome = outcomes[component]
    if (!isObject(outcome)) {
      add(errors, `outcome_missing:${component}`)
      return
    }
    if (!OUTCOME_SET.has(outcome.status)) add(errors, `outcome_status_invalid:${component}`)
    if (outcome.winnerWorkerId !== null) add(errors, `outcome_winner_forbidden:${component}`)
    if (!Array.isArray(outcome.workerIds) || outcome.workerIds.some(workerId => !isId(workerId))) add(errors, `outcome_worker_ids_invalid:${component}`)
    if (!Array.isArray(outcome.conflictingWorkerIds) || outcome.conflictingWorkerIds.some(workerId => !isId(workerId))) add(errors, `outcome_conflicting_worker_ids_invalid:${component}`)
    if (!Array.isArray(outcome.unknownWorkerIds) || outcome.unknownWorkerIds.some(workerId => !isId(workerId))) add(errors, `outcome_unknown_worker_ids_invalid:${component}`)
    requireSorted(outcome.workerIds, `outcome.${component}.workerIds`, errors)
    requireSorted(outcome.conflictingWorkerIds, `outcome.${component}.conflictingWorkerIds`, errors)
    requireSorted(outcome.unknownWorkerIds, `outcome.${component}.unknownWorkerIds`, errors)
    if (!Array.isArray(outcome.reasonCodes) || outcome.reasonCodes.length === 0 || outcome.reasonCodes.some(code => !hasText(code))) add(errors, `outcome_reason_codes_invalid:${component}`)
    if (outcome.status === 'VERIFIED' && !isHash(outcome.consensusOutputSha256)) add(errors, `verified_outcome_hash_missing:${component}`)
    if (outcome.status !== 'VERIFIED' && outcome.consensusOutputSha256 !== null) add(errors, `non_verified_outcome_hash_present:${component}`)
    if ((outcome.status === 'CONFLICT' || outcome.status === 'UNKNOWN') && outcome.winnerWorkerId !== null) add(errors, `non_consensus_winner_present:${component}`)
    if (outcome.status === 'VERIFIED' && (outcome.workerIds.length === 0 || outcome.conflictingWorkerIds.length > 0 || outcome.unknownWorkerIds.length > 0)) add(errors, `verified_outcome_not_complete:${component}`)
    if (outcome.status === 'CONFLICT' && outcome.conflictingWorkerIds.length < 2) add(errors, `conflict_outcome_without_two_workers:${component}`)
  })
}

export function checkHistoricalOcrPacket(packet, options = {}) {
  const { expectedHandoff, expectedPromotedGeometry, expectedPromotedTableGrid } = options || {}
  const errors = []
  if (!isObject(packet)) return ['packet_not_object']
  checkRootFields(packet, PACKET_FIELDS, 'packet', errors)
  checkForbiddenOperationFields(packet, 'packet', errors)
  if (packet.schemaVersion !== HISTORICAL_OCR_PACKET_SCHEMA) add(errors, 'packet_schema_version_mismatch')
  if (packet.packetVersion !== HISTORICAL_OCR_PACKET_VERSION) add(errors, 'packet_version_mismatch')
  if (packet.specialistId !== HISTORICAL_OCR_SPECIALIST_ID) add(errors, 'packet_specialist_id_mismatch')
  if (packet.mode !== 'bounded_ocr_team') add(errors, 'packet_mode_invalid')
  if (!OCR_PROMOTION_STATUSES.includes(packet.status)) add(errors, 'packet_status_invalid')
  if (!isObject(packet.acceptanceCriteria)) add(errors, 'packet_acceptance_criteria_not_object')
  if (packet.BLOCK_OCR_ROUTE !== true) add(errors, 'packet.BLOCK_OCR_ROUTE_promoted')
  if (!isObject(packet.OCRProvider) || canonicalHistoricalOcrJson(packet.OCRProvider) !== canonicalHistoricalOcrJson(OCRProvider)) add(errors, 'packet.OCRProvider_enabled_or_changed')
  if (!isOcrRequiredHandoff(packet.handoff)) add(errors, 'packet_OCR_REQUIRED_handoff_missing')
  if (expectedHandoff !== undefined && canonicalHistoricalOcrJson(packet.handoff) !== canonicalHistoricalOcrJson(expectedHandoff)) add(errors, 'packet_handoff_not_preserved')
  if (expectedPromotedGeometry !== undefined && canonicalHistoricalOcrJson(packet.promotedGeometry) !== canonicalHistoricalOcrJson(expectedPromotedGeometry)) add(errors, 'packet_geometry_not_preserved')
  if (expectedPromotedTableGrid !== undefined && canonicalHistoricalOcrJson(packet.promotedTableGrid) !== canonicalHistoricalOcrJson(expectedPromotedTableGrid)) add(errors, 'packet_table_grid_not_preserved')
  if (packet.promotedGeometry === null || typeof packet.promotedGeometry !== 'object') add(errors, 'packet_geometry_invalid')
  if (packet.promotedTableGrid === null || typeof packet.promotedTableGrid !== 'object') add(errors, 'packet_table_grid_invalid')
  if (!isHash(packet.packetContentSha256) || historicalOcrPacketContentSha256(packet) !== packet.packetContentSha256) add(errors, 'packet_content_hash_mismatch')
  checkFixedRoutePolicy(packet.routePolicy, errors)
  checkFixedActivation(packet.activation, errors)
  checkAuthorityBoundary(packet.authorityBoundary, errors)

  if (!isObject(packet.preservation)) add(errors, 'packet_preservation_not_object')
  else {
    if (packet.preservation.ocrRequirement !== OCR_REQUIRED) add(errors, 'packet_preservation_ocr_requirement_missing')
    if (!isHash(packet.preservation.handoffSha256) || historicalOcrContentSha256(packet.handoff) !== packet.preservation.handoffSha256) add(errors, 'packet_preservation_handoff_hash_mismatch')
    if (!isHash(packet.preservation.promotedGeometrySha256) || historicalOcrContentSha256(packet.promotedGeometry) !== packet.preservation.promotedGeometrySha256) add(errors, 'packet_preservation_geometry_hash_mismatch')
    if (!isHash(packet.preservation.promotedTableGridSha256) || historicalOcrContentSha256(packet.promotedTableGrid) !== packet.preservation.promotedTableGridSha256) add(errors, 'packet_preservation_table_grid_hash_mismatch')
  }

  if (!Array.isArray(packet.workers)) add(errors, 'packet_workers_not_array')
  else {
    requireSorted(packet.workers, 'packet.workers', errors, worker => worker?.slotId)
    packet.workers.forEach((worker, index) => validateWorkerSlot(worker, errors, `packet.workers[${index}]`))
    OCR_COMPONENTS.forEach(component => { if (!packet.workers.some(worker => worker?.component === component)) add(errors, `packet_worker_slot_missing:${component}`) })
  }
  if (!Array.isArray(packet.validationCorpora)) add(errors, 'packet_validation_corpora_not_array')
  else {
    requireSorted(packet.validationCorpora, 'packet.validationCorpora', errors, corpus => corpus?.corpusId)
    packet.validationCorpora.forEach((corpus, index) => validateCorpus(corpus, errors, `packet.validationCorpora[${index}]`))
  }
  if (!isObject(packet.componentEvidence)) add(errors, 'packet_component_evidence_not_object')
  else OCR_COMPONENTS.forEach(component => validateComponentEvidence(packet.componentEvidence[component], component, packet.workers || [], packet.validationCorpora || [], packet.acceptanceCriteria || {}, errors, `packet.componentEvidence.${component}`))
  if (!isObject(packet.promotion)) add(errors, 'packet_promotion_not_object')
  else OCR_COMPONENTS.forEach(component => {
    const expected = evaluateHistoricalOcrComponentPromotion({
      component,
      evidence: packet.componentEvidence?.[component],
      worker: expectedWorkerForComponent(packet, component),
      corpora: packet.validationCorpora || [],
      acceptance: packet.acceptanceCriteria?.[component] || packet.componentEvidence?.[component]?.acceptance,
    })
    if (canonicalHistoricalOcrJson(packet.promotion[component]) !== canonicalHistoricalOcrJson(expected)) add(errors, `packet_promotion_not_derived:${component}`)
    const evidenceItem = packet.componentEvidence?.[component]
    if (expected.status === 'PROMOTED' && (evidenceItem?.status !== 'VERIFIED' || evidenceItem?.outcome !== 'VERIFIED')) add(errors, `packet_component_evidence_status_not_derived:${component}`)
    if (expected.status === 'CONFLICT' && (evidenceItem?.status !== 'CONFLICT' || evidenceItem?.outcome !== 'CONFLICT')) add(errors, `packet_component_evidence_conflict_not_derived:${component}`)
    if (expected.status !== 'PROMOTED' && expected.status !== 'CONFLICT' && (evidenceItem?.status === 'VERIFIED' || evidenceItem?.outcome === 'VERIFIED')) add(errors, `packet_component_evidence_promotion_without_gate:${component}`)
  })
  validatePacketOutcomes(packet.outcomes, errors)
  if (packet.status !== summarizePromotion(packet.promotion || {})) add(errors, 'packet_status_not_derived')
  return sortedUnique(errors)
}

export function validateHistoricalOcrPacket(packet, options = {}) {
  const errors = checkHistoricalOcrPacket(packet, options)
  return { pass: errors.length === 0, errors }
}

export function assertHistoricalOcrPacket(packet, options = {}) {
  const result = validateHistoricalOcrPacket(packet, options)
  if (!result.pass) throw new Error(`historical OCR packet contract invalid: ${result.errors.join(', ')}`)
  return true
}

export function checkHistoricalOcrComponent(componentEvidence, options = {}) {
  const { component, worker, corpora, acceptance } = options || {}
  const resolvedComponent = component || componentEvidence?.component
  const resolvedWorker = worker || workerSpecFor(resolvedComponent)
  const result = evaluateHistoricalOcrComponentPromotion({
    component: resolvedComponent,
    evidence: componentEvidence,
    worker: resolvedWorker,
    corpora: corpora || normalizeCorpora({}),
    acceptance: acceptance || componentEvidence?.acceptance,
  })
  const errors = [...result.reasonCodes]
  if (result.status === 'PROMOTED' && (componentEvidence?.status !== 'VERIFIED' || componentEvidence?.outcome !== 'VERIFIED')) add(errors, 'component_evidence_status_not_derived')
  if (result.status === 'CONFLICT' && (componentEvidence?.status !== 'CONFLICT' || componentEvidence?.outcome !== 'CONFLICT')) add(errors, 'component_evidence_conflict_not_derived')
  if (result.status !== 'PROMOTED' && result.status !== 'CONFLICT' && (componentEvidence?.status === 'VERIFIED' || componentEvidence?.outcome === 'VERIFIED')) add(errors, 'component_evidence_promotion_without_gate')
  return sortedUnique(errors)
}

export const validateHistoricalOcrComponent = (componentEvidence, options = {}) => {
  const errors = checkHistoricalOcrComponent(componentEvidence, options)
  return { pass: errors.length === 0, errors }
}

export const assertHistoricalOcrComponent = (componentEvidence, options = {}) => {
  const result = validateHistoricalOcrComponent(componentEvidence, options)
  if (!result.pass) throw new Error(`historical OCR component contract invalid: ${result.errors.join(', ')}`)
  return true
}

export function selectHistoricalOcrWorker({ team, component, workerId } = {}) {
  const workers = team?.workers || []
  if (!COMPONENT_SET.has(component) || !hasText(workerId)) return { status: 'UNKNOWN', worker: null, reasonCodes: ['explicit_worker_id_required'] }
  const worker = workers.find(item => item.component === component && item.workerId === workerId)
  if (!worker) return { status: 'UNKNOWN', worker: null, reasonCodes: ['worker_not_registered'] }
  if (worker.fallbackPolicy !== 'none' || worker.selectionPolicy !== 'explicit_worker_id_only') return { status: 'BLOCKED', worker: null, reasonCodes: ['worker_selection_policy_invalid'] }
  return { status: 'VERIFIED', worker: clone(worker), reasonCodes: [] }
}

export const chooseHistoricalOcrWorker = selectHistoricalOcrWorker

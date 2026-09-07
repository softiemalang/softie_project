/**
 * Minimal read-only boundary for the Saju P1 rule consumer.
 *
 * This module only projects an already-authoritative payload. It does not
 * calculate pillars, resolve candidates, load sources, create claims, or
 * change readiness/activation state.
 */

export const SAJU_P1_READ_ONLY_HANDOFF_SCHEMA = 'saju-p1-read-only-handoff-v1'
export const SAJU_P1_READ_ONLY_HANDOFF_VERSION = '1.0.0'
export const SAJU_P1_DAY_REFERENCE_PATH = '/raw/pillars/day/referenceValue'
export const SAJU_P1_READ_ONLY_HANDOFF_STATUSES = Object.freeze(['ready', 'unresolved'])

const REF_ID = /^[A-Za-z0-9][A-Za-z0-9._:/-]{0,127}$/
const RESOLVED_CANDIDATE_STATUSES = new Set(['calculated', 'resolved', 'verified'])
const EXPECTED_REF_ROLES = Object.freeze({
  input: 'calculation_input',
  result: 'calculation_result',
  policy: 'calculation_policy',
  upstream: 'upstream_status',
})

const isRecord = value => Boolean(value) && typeof value === 'object' && !Array.isArray(value)
const has = (value, key) => Object.prototype.hasOwnProperty.call(value || {}, key)
const nonEmptyString = value => typeof value === 'string' && value.trim().length > 0 && !/[\u0000-\u001f\u007f]/.test(value)
const refId = value => typeof value === 'string' && REF_ID.test(value)
const addReason = (reasons, reason) => {
  if (!reasons.includes(reason)) reasons.push(reason)
}

function firstRecord(...values) {
  return values.find(isRecord) || null
}

function emptyHandoff(reasonCodes = []) {
  return {
    schemaVersion: SAJU_P1_READ_ONLY_HANDOFF_SCHEMA,
    handoffVersion: SAJU_P1_READ_ONLY_HANDOFF_VERSION,
    status: 'unresolved',
    calculation: {
      day: {
        status: null,
        candidateId: null,
        candidateCount: null,
        candidateStatus: null,
        candidateValues: [],
        referenceValue: null,
        referencePath: SAJU_P1_DAY_REFERENCE_PATH,
      },
    },
    refs: {
      calculation: {
        inputRefIds: [],
        resultRefIds: [],
        policyRefIds: [],
      },
      upstream: {
        calculationRefIds: [],
        historicalAuthorityRefIds: [],
        upstreamBoundaryRefIds: [],
      },
    },
    gate: {
      predicateEligible: false,
      reasonCodes: [...reasonCodes],
    },
  }
}

function rawFromPayload(payload) {
  return firstRecord(
    payload?.raw,
    payload?.authoritativePayload?.raw,
    payload?.authoritative?.raw,
    payload?.natal_data?.raw,
    payload?.computed_data?.raw,
  )
}

function refRootFromPayload(payload) {
  const explicit = [
    payload?.p1ReadOnlyRefs,
    payload?.refs?.p1ReadOnly,
    payload?.authoritativeRefs,
  ].find(value => Array.isArray(value) || isRecord(value))
  if (explicit) return explicit
  return Array.isArray(payload?.refs) || isRecord(payload?.refs) ? payload.refs : null
}

function refEntryId(entry) {
  if (typeof entry === 'string') return entry
  if (!isRecord(entry)) return null
  return entry.refId || entry.id || null
}

function validateReferenceEntry(entry, expectedRole, expectedAxis) {
  if (typeof entry === 'string') return refId(entry)
  if (!isRecord(entry) || !refId(refEntryId(entry))) return false
  if (has(entry, 'resolution') && entry.resolution !== 'resolved') return false
  if (has(entry, 'role') && entry.role !== expectedRole) return false
  if (expectedAxis && has(entry, 'axis') && entry.axis !== expectedAxis) return false
  return true
}

function projectRefIds(value, reasonCode, reasons, { expectedRole, expectedAxis } = {}) {
  if (!Array.isArray(value) || value.length === 0) {
    addReason(reasons, reasonCode)
    return []
  }

  const ids = value.map(refEntryId)
  const valid = value.every(entry => validateReferenceEntry(entry, expectedRole, expectedAxis))
    && ids.every(refId)
    && new Set(ids).size === ids.length
  if (!valid) {
    addReason(reasons, `${reasonCode.replace(/_missing$/, '')}_invalid`)
    return []
  }
  return [...ids]
}

function nestedReferenceGroups(root) {
  if (!isRecord(root)) return null
  const calculation = isRecord(root.calculation) ? root.calculation : {}
  const policy = isRecord(root.policy) ? root.policy : {}
  const upstream = isRecord(root.upstream) ? root.upstream : {}
  return {
    input: calculation.inputRefIds ?? calculation.input ?? root.calculationInputRefIds,
    result: calculation.resultRefIds ?? calculation.result ?? root.calculationResultRefIds,
    policy: calculation.policyRefIds ?? policy.refIds ?? policy.policyRefIds ?? root.calculationPolicyRefIds,
    upstreamCalculation: upstream.calculationRefIds ?? upstream.calculation ?? root.upstreamCalculationRefIds,
    upstreamHistoricalAuthority: upstream.historicalAuthorityRefIds ?? upstream.historicalAuthority ?? root.upstreamHistoricalAuthorityRefIds,
    upstreamBoundary: upstream.upstreamBoundaryRefIds ?? upstream.upstreamBoundary ?? root.upstreamBoundaryRefIds,
  }
}

function listReferenceGroups(root) {
  if (!Array.isArray(root)) return null
  const groups = {
    input: [],
    result: [],
    policy: [],
    upstreamCalculation: [],
    upstreamHistoricalAuthority: [],
    upstreamBoundary: [],
  }
  root.forEach(entry => {
    if (!isRecord(entry)) return
    if (entry.role === EXPECTED_REF_ROLES.input) groups.input.push(entry)
    if (entry.role === EXPECTED_REF_ROLES.result) groups.result.push(entry)
    if (entry.role === EXPECTED_REF_ROLES.policy) groups.policy.push(entry)
    if (entry.role !== EXPECTED_REF_ROLES.upstream) return
    if (entry.axis === 'calculation') groups.upstreamCalculation.push(entry)
    if (entry.axis === 'historicalAuthority') groups.upstreamHistoricalAuthority.push(entry)
    if (entry.axis === 'upstreamBoundary') groups.upstreamBoundary.push(entry)
  })
  return groups
}

function referenceGroups(payload) {
  const root = refRootFromPayload(payload)
  return Array.isArray(root) ? listReferenceGroups(root) : nestedReferenceGroups(root)
}

function candidateSetFromRaw(raw, day) {
  if (Array.isArray(raw?.candidates)) return raw.candidates
  if (Array.isArray(raw?.candidateSet?.candidates)) return raw.candidateSet.candidates
  if (isRecord(raw?.candidate)) return [raw.candidate]
  if (isRecord(day?.candidate)) return [day.candidate]
  // Some authoritative envelopes attach identity and status to the day
  // candidate entries themselves. String-only day values remain insufficient
  // because they carry no candidate identity or resolution state.
  if (Array.isArray(day?.candidates) && day.candidates.every(isRecord)) return day.candidates
  return null
}

function candidateCountDeclarations(raw) {
  return [
    raw?.candidateCount,
    raw?.candidateSet?.count,
    raw?.candidateAnalysis?.candidateCount,
    raw?.candidateAnalysis?.statistics?.candidateCount,
  ].filter(value => value !== undefined && value !== null)
}

function candidateValue(entry) {
  if (typeof entry === 'string') return entry
  if (!isRecord(entry)) return null
  if (typeof entry.referenceValue === 'string') return entry.referenceValue
  if (typeof entry.value === 'string') return entry.value
  return null
}

function candidateIdentity(entry) {
  if (!isRecord(entry)) return null
  const value = entry.candidateId || entry.id
  return nonEmptyString(value) ? value : null
}

function candidateStatus(entry) {
  if (!isRecord(entry)) return null
  return entry.status ?? entry.resolution ?? entry.resolutionStatus ?? null
}

function candidateResolutionFieldsAreClosed(entry) {
  if (!isRecord(entry)) return true
  return ['resolution', 'resolutionStatus'].every(key => !has(entry, key) || RESOLVED_CANDIDATE_STATUSES.has(entry[key]) || entry[key] === 'resolved')
}

function candidateReferenceValue(entry) {
  if (!isRecord(entry)) return null
  return entry.pillars?.day?.referenceValue
    ?? entry.rawPillars?.day?.referenceValue
    ?? null
}

function parentStateIsResolved(payload, reasons) {
  const state = payload?.stateContract
  if (!isRecord(state)) return
  if (has(state, 'calculationStatus') && state.calculationStatus !== 'calculated') addReason(reasons, 'calculation_status_not_calculated')
  if (has(state, 'verificationStatus') && state.verificationStatus !== 'verified') addReason(reasons, 'calculation_verification_not_resolved')
}

/**
 * Project an existing authoritative Saju calculation into the P1 read-only
 * boundary. Missing or ambiguous evidence is represented as `unresolved`.
 */
export function buildSajuP1ReadOnlyHandoff(authoritativePayload, { reasonCodes = [] } = {}) {
  const reasons = Array.isArray(reasonCodes) ? [...new Set(reasonCodes.filter(nonEmptyString))] : []
  const handoff = emptyHandoff(reasons)
  let dayCandidateCount = null

  if (!isRecord(authoritativePayload)) {
    addReason(reasons, 'payload_missing')
    handoff.gate.reasonCodes = [...reasons]
    return handoff
  }

  const raw = rawFromPayload(authoritativePayload)
  if (!raw) addReason(reasons, 'raw_payload_missing')

  const day = raw?.pillars?.day
  if (!isRecord(day)) {
    addReason(reasons, 'day_pillar_missing')
  } else {
    handoff.calculation.day.status = has(day, 'status') ? day.status : null
    handoff.calculation.day.referenceValue = nonEmptyString(day.referenceValue) ? day.referenceValue : null
    if (day.status !== 'calculated') addReason(reasons, 'day_status_not_calculated')
    if (!Array.isArray(day.candidates)) {
      addReason(reasons, 'day_candidates_missing')
    } else {
      dayCandidateCount = day.candidates.length
      handoff.calculation.day.candidateCount = day.candidates.length
      handoff.calculation.day.candidateValues = day.candidates.map(candidateValue)
      if (day.candidates.length !== 1) addReason(reasons, 'day_candidate_count_not_one')
      if (day.candidates.length === 1 && !nonEmptyString(handoff.calculation.day.candidateValues[0])) addReason(reasons, 'day_candidate_value_missing')
      if (day.candidates.length === 1 && nonEmptyString(handoff.calculation.day.candidateValues[0])
        && handoff.calculation.day.candidateValues[0] !== handoff.calculation.day.referenceValue) {
        addReason(reasons, 'day_candidate_reference_mismatch')
      }
    }
    if (!handoff.calculation.day.referenceValue) addReason(reasons, 'day_reference_value_missing')
  }

  parentStateIsResolved(authoritativePayload, reasons)

  const candidateSet = candidateSetFromRaw(raw, day)
  if (!Array.isArray(candidateSet)) {
    addReason(reasons, 'candidate_set_missing')
  } else {
    // The candidate set is the authoritative identity/count source. Never
    // collapse a multi-candidate set based on a shared day value.
    handoff.calculation.day.candidateCount = candidateSet.length
    if (candidateSet.length !== 1) addReason(reasons, 'candidate_count_not_one')
    if (dayCandidateCount !== null && dayCandidateCount !== candidateSet.length) addReason(reasons, 'candidate_count_mismatch')
    const declarations = candidateCountDeclarations(raw)
    if (declarations.some(value => !Number.isSafeInteger(value) || value !== candidateSet.length)) addReason(reasons, 'candidate_count_mismatch')
    if (candidateSet.length === 1) {
      const onlyCandidate = candidateSet[0]
      handoff.calculation.day.candidateId = candidateIdentity(onlyCandidate)
      handoff.calculation.day.candidateStatus = candidateStatus(onlyCandidate)
      if (!handoff.calculation.day.candidateId) addReason(reasons, 'candidate_identity_missing')
      if (!RESOLVED_CANDIDATE_STATUSES.has(handoff.calculation.day.candidateStatus)) addReason(reasons, 'candidate_not_resolved')
      if (!candidateResolutionFieldsAreClosed(onlyCandidate)) addReason(reasons, 'candidate_not_resolved')
      if (onlyCandidate?.verificationStatus && onlyCandidate.verificationStatus !== 'verified') addReason(reasons, 'candidate_verification_not_resolved')
      if (onlyCandidate?.interpretationStatus === 'candidate_only') addReason(reasons, 'candidate_interpretation_not_resolved')
      const candidateDayValue = candidateReferenceValue(onlyCandidate)
      if (candidateDayValue !== null && candidateDayValue !== handoff.calculation.day.referenceValue) addReason(reasons, 'candidate_reference_mismatch')
    }
  }

  const groups = referenceGroups(authoritativePayload)
  if (!groups) {
    addReason(reasons, 'calculation_refs_missing')
    addReason(reasons, 'policy_refs_missing')
    addReason(reasons, 'upstream_refs_missing')
  } else {
    handoff.refs.calculation.inputRefIds = projectRefIds(groups.input, 'calculation_refs_missing', reasons, { expectedRole: EXPECTED_REF_ROLES.input })
    handoff.refs.calculation.resultRefIds = projectRefIds(groups.result, 'calculation_refs_missing', reasons, { expectedRole: EXPECTED_REF_ROLES.result })
    handoff.refs.calculation.policyRefIds = projectRefIds(groups.policy, 'policy_refs_missing', reasons, { expectedRole: EXPECTED_REF_ROLES.policy })
    handoff.refs.upstream.calculationRefIds = projectRefIds(groups.upstreamCalculation, 'upstream_refs_missing', reasons, { expectedRole: EXPECTED_REF_ROLES.upstream, expectedAxis: 'calculation' })
    handoff.refs.upstream.historicalAuthorityRefIds = projectRefIds(groups.upstreamHistoricalAuthority, 'upstream_refs_missing', reasons, { expectedRole: EXPECTED_REF_ROLES.upstream, expectedAxis: 'historicalAuthority' })
    handoff.refs.upstream.upstreamBoundaryRefIds = projectRefIds(groups.upstreamBoundary, 'upstream_refs_missing', reasons, { expectedRole: EXPECTED_REF_ROLES.upstream, expectedAxis: 'upstreamBoundary' })
  }

  handoff.status = reasons.length === 0 ? 'ready' : 'unresolved'
  handoff.gate = {
    predicateEligible: handoff.status === 'ready',
    reasonCodes: [...reasons],
  }
  return handoff
}

const TOP_LEVEL_FIELDS = Object.freeze(['schemaVersion', 'handoffVersion', 'status', 'calculation', 'refs', 'gate'])
const DAY_FIELDS = Object.freeze(['status', 'candidateId', 'candidateCount', 'candidateStatus', 'candidateValues', 'referenceValue', 'referencePath'])
const CALCULATION_REF_FIELDS = Object.freeze(['inputRefIds', 'resultRefIds', 'policyRefIds'])
const UPSTREAM_REF_FIELDS = Object.freeze(['calculationRefIds', 'historicalAuthorityRefIds', 'upstreamBoundaryRefIds'])

function unknownFields(value, allowed, path, errors) {
  if (!isRecord(value)) {
    errors.push(`${path}_not_object`)
    return
  }
  Object.keys(value).filter(key => !allowed.includes(key)).forEach(key => errors.push(`${path}.${key}_unknown`))
}

function validIdList(value, path, errors) {
  if (!Array.isArray(value) || value.some(id => !refId(id)) || new Set(value).size !== value.length) errors.push(`${path}_invalid`)
}

/**
 * Validate the closed output shape. This checker has no source or database
 * access and does not grant interpretation, claim, readiness, or activation.
 */
export function checkSajuP1ReadOnlyHandoff(handoff) {
  const errors = []
  if (!isRecord(handoff)) return ['handoff_not_object']
  unknownFields(handoff, TOP_LEVEL_FIELDS, 'handoff', errors)
  if (handoff.schemaVersion !== SAJU_P1_READ_ONLY_HANDOFF_SCHEMA) errors.push('schema_version_invalid')
  if (handoff.handoffVersion !== SAJU_P1_READ_ONLY_HANDOFF_VERSION) errors.push('handoff_version_invalid')
  if (!SAJU_P1_READ_ONLY_HANDOFF_STATUSES.includes(handoff.status)) errors.push('status_invalid')

  const day = handoff.calculation?.day
  unknownFields(handoff.calculation, ['day'], 'calculation', errors)
  unknownFields(day, DAY_FIELDS, 'calculation.day', errors)
  if (day?.status !== null && !nonEmptyString(day?.status)) errors.push('day_status_invalid')
  if (day?.candidateId !== null && !nonEmptyString(day?.candidateId)) errors.push('candidate_identity_invalid')
  if (day?.candidateStatus !== null && !nonEmptyString(day?.candidateStatus)) errors.push('candidate_status_invalid')
  if (day?.candidateCount !== null && (!Number.isSafeInteger(day?.candidateCount) || day.candidateCount < 0)) errors.push('candidate_count_invalid')
  if (!Array.isArray(day?.candidateValues) || day.candidateValues.some(value => !nonEmptyString(value))) errors.push('candidate_values_invalid')
  if (day?.referenceValue !== null && !nonEmptyString(day?.referenceValue)) errors.push('reference_value_invalid')
  if (day?.referencePath !== SAJU_P1_DAY_REFERENCE_PATH) errors.push('reference_path_invalid')

  const refs = handoff.refs
  unknownFields(refs, ['calculation', 'upstream'], 'refs', errors)
  unknownFields(refs?.calculation, CALCULATION_REF_FIELDS, 'refs.calculation', errors)
  unknownFields(refs?.upstream, UPSTREAM_REF_FIELDS, 'refs.upstream', errors)
  CALCULATION_REF_FIELDS.forEach(field => validIdList(refs?.calculation?.[field], `refs.calculation.${field}`, errors))
  UPSTREAM_REF_FIELDS.forEach(field => validIdList(refs?.upstream?.[field], `refs.upstream.${field}`, errors))

  unknownFields(handoff.gate, ['predicateEligible', 'reasonCodes'], 'gate', errors)
  if (typeof handoff.gate?.predicateEligible !== 'boolean' || !Array.isArray(handoff.gate?.reasonCodes)
    || handoff.gate.reasonCodes.some(code => !nonEmptyString(code)) || new Set(handoff.gate.reasonCodes).size !== handoff.gate.reasonCodes.length) {
    errors.push('gate_invalid')
  }

  const ready = handoff.status === 'ready'
  const hasRefs = field => Array.isArray(field) && field.length > 0
  if (ready && (handoff.gate?.predicateEligible !== true || handoff.gate?.reasonCodes?.length !== 0
    || day?.status !== 'calculated' || day?.candidateCount !== 1 || !nonEmptyString(day?.candidateId)
    || !RESOLVED_CANDIDATE_STATUSES.has(day?.candidateStatus) || day?.candidateValues?.length !== 1
    || day?.candidateValues?.[0] !== day?.referenceValue || !nonEmptyString(day?.referenceValue)
    || !hasRefs(handoff.refs?.calculation?.inputRefIds)
    || !hasRefs(handoff.refs?.calculation?.resultRefIds)
    || !hasRefs(handoff.refs?.calculation?.policyRefIds)
    || !hasRefs(handoff.refs?.upstream?.calculationRefIds)
    || !hasRefs(handoff.refs?.upstream?.historicalAuthorityRefIds)
    || !hasRefs(handoff.refs?.upstream?.upstreamBoundaryRefIds))) {
    errors.push('ready_gate_not_closed')
  }
  if (!ready && (handoff.gate?.predicateEligible === true || !handoff.gate?.reasonCodes?.length)) errors.push('unresolved_gate_not_closed')

  return [...new Set(errors)].sort()
}

export function validateSajuP1ReadOnlyHandoff(handoff) {
  const reasonCodes = checkSajuP1ReadOnlyHandoff(handoff)
  return { valid: reasonCodes.length === 0, reasonCodes }
}

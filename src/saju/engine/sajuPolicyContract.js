/**
 * Saju timing policy boundary.
 *
 * These selections describe the current implementation only. They are not
 * historical facts or a source-authority decision. An UNKNOWN contract must
 * not be used to produce a calculation result.
 */

export const SAJU_POLICY_CONTRACT_SCHEMA = 'saju-policy-contract-v1'
export const SAJU_POLICY_KEYS = Object.freeze([
  'yearBoundaryPolicy',
  'monthBoundaryPolicy',
  'dayBoundaryPolicy',
  'hourTimeBasisPolicy',
  'qiyunConversionPolicy',
])

export const SAJU_POLICY_STATUSES = Object.freeze(['SELECTED', 'UNKNOWN'])
export const SAJU_HISTORICAL_AUTHORITY_STATUS = 'insufficient_evidence'

export const SAJU_POLICY_DEFAULT_SELECTIONS = Object.freeze({
  yearBoundaryPolicy: 'li-chun-apparent-solar-315',
  monthBoundaryPolicy: 'jie-solar-longitude-30-degree',
  dayBoundaryPolicy: 'solar-midnight-split-zi',
  hourTimeBasisPolicy: 'local-apparent-solar-kst',
  qiyunConversionPolicy: 'source-ratio-rounded-360-30-calendar',
})

const POLICY_DEFINITIONS = Object.freeze({
  yearBoundaryPolicy: Object.freeze({
    values: Object.freeze(['li-chun-apparent-solar-315']),
    parameters: Object.freeze({
      boundary: 'apparent_solar_longitude',
      longitudeDegrees: 315,
    }),
  }),
  monthBoundaryPolicy: Object.freeze({
    values: Object.freeze(['jie-solar-longitude-30-degree']),
    parameters: Object.freeze({
      boundary: 'solar_longitude_month_entry',
      startLongitudeDegrees: 315,
      stepDegrees: 30,
    }),
  }),
  dayBoundaryPolicy: Object.freeze({
    values: Object.freeze(['solar-midnight-split-zi', 'zi-start']),
    parameters: Object.freeze({
      ziHourStart: '23:00',
      rollDayAtZiHour: false,
    }),
  }),
  hourTimeBasisPolicy: Object.freeze({
    values: Object.freeze(['local-apparent-solar-kst', 'local-mean-solar-kst', 'civil-kst']),
    parameters: Object.freeze({
      timezone: 'Asia/Seoul',
      standardMeridianDegrees: 135,
      longitudeDegrees: null,
      solarTimeCorrection: true,
      equationOfTimeCorrection: true,
    }),
  }),
  qiyunConversionPolicy: Object.freeze({
    values: Object.freeze(['source-ratio-rounded-360-30-calendar']),
    parameters: Object.freeze({
      symbolicDaysFormula: 'distanceMinutes / 12',
      minutesPerSymbolicDay: 12,
      rounding: 'nearest_integer',
      daysPerYear: 360,
      daysPerMonth: 30,
      calendarAddition: 'clamped_civil_date',
      displayConversion: '3일=1년 · 1일=4개월 · 2시간=10일',
    }),
  }),
})

const hasOwn = (value, key) => Object.prototype.hasOwnProperty.call(value || {}, key)
const isObject = value => Boolean(value) && typeof value === 'object' && !Array.isArray(value)

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value
  Object.values(value).forEach(deepFreeze)
  return Object.freeze(value)
}

function resolveRequestedValue(selections, key) {
  if (hasOwn(selections, key)) return selections[key]
  return undefined
}

function buildPolicyRecord(key, requestedValue, parameterOverrides = {}) {
  const definition = POLICY_DEFINITIONS[key]
  const selected = typeof requestedValue === 'string'
    && definition.values.includes(requestedValue)
  const status = selected ? 'SELECTED' : 'UNKNOWN'
  const resolution = selected
    ? 'selected'
    : requestedValue == null || requestedValue === '' ? 'unselected' : 'unsupported'
  const defaultParameterOverrides = key === 'hourTimeBasisPolicy' && selected
    ? {
        solarTimeCorrection: requestedValue !== 'civil-kst',
        equationOfTimeCorrection: requestedValue === 'local-apparent-solar-kst',
      }
    : {}

  return {
    key,
    value: selected ? requestedValue : null,
    status,
    resolution,
    historicalAuthority: SAJU_HISTORICAL_AUTHORITY_STATUS,
    historicalFact: false,
    implementationPolicy: true,
    parameters: selected
      ? { ...definition.parameters, ...defaultParameterOverrides, ...parameterOverrides }
      : null,
    ...(selected ? {} : { requestedValue: requestedValue ?? null }),
  }
}

/**
 * Build a contract from explicit selections. Missing and unsupported values
 * remain visible as UNKNOWN; callers must use requireSajuPolicyContract before
 * calculating.
 */
export function createSajuPolicyContract(selections = {}, parameterOverrides = {}) {
  const policies = Object.fromEntries(SAJU_POLICY_KEYS.map(key => [
    key,
    buildPolicyRecord(key, resolveRequestedValue(selections, key), parameterOverrides[key] || {}),
  ]))
  const unknowns = SAJU_POLICY_KEYS
    .map(key => policies[key])
    .filter(policy => policy.status === 'UNKNOWN')
    .map(policy => ({
      policyKey: policy.key,
      status: 'UNKNOWN',
      reason: policy.resolution,
      requestedValue: policy.requestedValue,
    }))

  return deepFreeze({
    schemaVersion: SAJU_POLICY_CONTRACT_SCHEMA,
    status: unknowns.length === 0 ? 'SELECTED' : 'UNKNOWN',
    historicalAuthority: SAJU_HISTORICAL_AUTHORITY_STATUS,
    historicalFact: false,
    implementationPolicy: true,
    readinessStatus: 'blocked',
    activationStatus: 'not_activated',
    policies,
    unknowns,
  })
}

function inferHourTimeBasisPolicy(options) {
  if (options.useSolarTimeCorrection === false) return 'civil-kst'
  if (options.useEquationOfTimeCorrection === false) return 'local-mean-solar-kst'
  return SAJU_POLICY_DEFAULT_SELECTIONS.hourTimeBasisPolicy
}

function selectionOrUnknown(options, key) {
  return hasOwn(options, key) ? options[key] : undefined
}

/**
 * Convert the legacy engine options into an explicit policy contract. This
 * preserves the existing calculation defaults while making each choice
 * inspectable and non-historical.
 */
export function createSajuPolicyContractFromOptions(options = {}) {
  const hasExplicitDayPolicy = hasOwn(options, 'dayBoundaryPolicy')
    && options.dayBoundaryPolicy !== SAJU_POLICY_DEFAULT_SELECTIONS.dayBoundaryPolicy
  const hasLegacyDayRule = hasOwn(options, 'dayBoundaryRule')
    && options.dayBoundaryRule !== SAJU_POLICY_DEFAULT_SELECTIONS.dayBoundaryPolicy
  const hasExplicitHourPolicy = hasOwn(options, 'hourTimeBasisPolicy')
    && options.hourTimeBasisPolicy !== SAJU_POLICY_DEFAULT_SELECTIONS.hourTimeBasisPolicy
  const hasLegacyHourBasisOptions = (hasOwn(options, 'useSolarTimeCorrection')
    || hasOwn(options, 'useEquationOfTimeCorrection')) && !hasExplicitHourPolicy
  const selections = {
    yearBoundaryPolicy: selectionOrUnknown(options, 'yearBoundaryPolicy'),
    monthBoundaryPolicy: selectionOrUnknown(options, 'monthBoundaryPolicy'),
    dayBoundaryPolicy: hasLegacyDayRule
      ? options.dayBoundaryRule
      : hasExplicitDayPolicy
        ? options.dayBoundaryPolicy
        : hasOwn(options, 'dayBoundaryRule')
          ? options.dayBoundaryRule
          : selectionOrUnknown(options, 'dayBoundaryPolicy'),
    hourTimeBasisPolicy: hasLegacyHourBasisOptions
      ? inferHourTimeBasisPolicy(options)
      : selectionOrUnknown(options, 'hourTimeBasisPolicy'),
    qiyunConversionPolicy: selectionOrUnknown(options, 'qiyunConversionPolicy'),
  }
  const parameterOverrides = {
    dayBoundaryPolicy: {
      ziHourStart: hasOwn(options, 'ziHourStart') ? options.ziHourStart : '23:00',
      rollDayAtZiHour: hasOwn(options, 'rollDayAtZiHour') ? options.rollDayAtZiHour : false,
    },
    hourTimeBasisPolicy: {
      timezone: hasOwn(options, 'timezone') ? options.timezone : 'Asia/Seoul',
      standardMeridianDegrees: hasOwn(options, 'standardMeridianDegrees')
        ? options.standardMeridianDegrees
        : 135,
      longitudeDegrees: hasOwn(options, 'longitudeDegrees') ? options.longitudeDegrees : null,
      solarTimeCorrection: selections.hourTimeBasisPolicy !== 'civil-kst',
      equationOfTimeCorrection: selections.hourTimeBasisPolicy === 'local-apparent-solar-kst',
    },
  }

  return createSajuPolicyContract(selections, parameterOverrides)
}

function policyValues(contract) {
  return Object.fromEntries(SAJU_POLICY_KEYS.map(key => [key, contract.policies[key].value]))
}

function isValidClock(value) {
  if (typeof value !== 'string') return false
  const match = /^(\d{2}):(\d{2})$/.exec(value)
  return Boolean(match) && Number(match[1]) <= 23 && Number(match[2]) <= 59
}

function validatePolicyParameters(key, policy, errors) {
  if (policy.status === 'UNKNOWN') {
    if (policy.value !== null) errors.push(`unknown_policy_value_must_be_null:${key}`)
    if (policy.parameters !== null) errors.push(`unknown_policy_parameters_must_be_null:${key}`)
    return
  }
  if (!isObject(policy.parameters)) {
    errors.push(`policy_parameters_missing:${key}`)
    return
  }

  const expected = POLICY_DEFINITIONS[key].parameters
  if (key === 'yearBoundaryPolicy' || key === 'monthBoundaryPolicy' || key === 'qiyunConversionPolicy') {
    Object.entries(expected).forEach(([parameterKey, parameterValue]) => {
      if (policy.parameters[parameterKey] !== parameterValue) {
        errors.push(`policy_parameter_invalid:${key}:${parameterKey}`)
      }
    })
    return
  }
  if (key === 'dayBoundaryPolicy') {
    if (!isValidClock(policy.parameters.ziHourStart)) errors.push(`policy_parameter_invalid:${key}:ziHourStart`)
    if (typeof policy.parameters.rollDayAtZiHour !== 'boolean') errors.push(`policy_parameter_invalid:${key}:rollDayAtZiHour`)
    return
  }
  if (key === 'hourTimeBasisPolicy') {
    const { timezone, standardMeridianDegrees, longitudeDegrees, solarTimeCorrection, equationOfTimeCorrection } = policy.parameters
    if (timezone !== 'Asia/Seoul') errors.push(`policy_parameter_invalid:${key}:timezone`)
    if (!Number.isFinite(standardMeridianDegrees) || Math.abs(standardMeridianDegrees) > 180) errors.push(`policy_parameter_invalid:${key}:standardMeridianDegrees`)
    if (longitudeDegrees !== null && (!Number.isFinite(longitudeDegrees) || Math.abs(longitudeDegrees) > 180)) errors.push(`policy_parameter_invalid:${key}:longitudeDegrees`)
    if (typeof solarTimeCorrection !== 'boolean') errors.push(`policy_parameter_invalid:${key}:solarTimeCorrection`)
    if (typeof equationOfTimeCorrection !== 'boolean') errors.push(`policy_parameter_invalid:${key}:equationOfTimeCorrection`)
    const expectedCorrections = {
      'local-apparent-solar-kst': [true, true],
      'local-mean-solar-kst': [true, false],
      'civil-kst': [false, false],
    }[policy.value]
    if (expectedCorrections && (solarTimeCorrection !== expectedCorrections[0] || equationOfTimeCorrection !== expectedCorrections[1])) {
      errors.push(`policy_parameter_invalid:${key}:correction_pair`)
    }
  }
}

export function validateSajuPolicyContract(contract) {
  const errors = []
  if (!isObject(contract)) return { valid: false, errors: ['contract_not_object'] }
  if (contract.schemaVersion !== SAJU_POLICY_CONTRACT_SCHEMA) errors.push('schema_version_invalid')
  if (contract.historicalAuthority !== SAJU_HISTORICAL_AUTHORITY_STATUS) errors.push('historical_authority_invalid')
  if (contract.historicalFact !== false) errors.push('historical_fact_must_be_false')
  if (contract.implementationPolicy !== true) errors.push('implementation_policy_must_be_true')
  if (contract.readinessStatus !== 'blocked') errors.push('readiness_must_be_blocked')
  if (contract.activationStatus !== 'not_activated') errors.push('activation_must_be_not_activated')
  if (!isObject(contract.policies)) {
    errors.push('policies_not_object')
    return { valid: false, errors }
  }

  const unknowns = []
  SAJU_POLICY_KEYS.forEach(key => {
    const policy = contract.policies[key]
    const definition = POLICY_DEFINITIONS[key]
    if (!isObject(policy)) {
      errors.push(`policy_missing:${key}`)
      return
    }
    if (policy.key !== key) errors.push(`policy_key_invalid:${key}`)
    if (!SAJU_POLICY_STATUSES.includes(policy.status)) errors.push(`policy_status_invalid:${key}`)
    if (policy.historicalAuthority !== SAJU_HISTORICAL_AUTHORITY_STATUS) errors.push(`policy_authority_invalid:${key}`)
    if (policy.historicalFact !== false) errors.push(`policy_historical_fact_must_be_false:${key}`)
    if (policy.implementationPolicy !== true) errors.push(`policy_implementation_flag_must_be_true:${key}`)
    if (policy.status === 'SELECTED' && !definition.values.includes(policy.value)) errors.push(`policy_value_invalid:${key}`)
    validatePolicyParameters(key, policy, errors)
    if (policy.status === 'UNKNOWN') unknowns.push(key)
  })

  if (!SAJU_POLICY_STATUSES.includes(contract.status)) errors.push('contract_status_invalid')
  if (contract.status === 'SELECTED' && unknowns.length > 0) errors.push('selected_contract_contains_unknown')
  if (contract.status === 'UNKNOWN' && unknowns.length === 0) errors.push('unknown_contract_missing_unknown_policy')
  if (!Array.isArray(contract.unknowns)) errors.push('unknowns_not_array')
  if (Array.isArray(contract.unknowns)) {
    const declaredUnknowns = contract.unknowns.map(item => item?.policyKey)
    if (JSON.stringify(declaredUnknowns) !== JSON.stringify(unknowns)) errors.push('unknowns_mismatch')
  }

  return {
    valid: errors.length === 0 && unknowns.length === 0,
    errors: [...errors, ...unknowns.map(key => `policy_unknown:${key}`)],
    unknownPolicyKeys: unknowns,
  }
}

/**
 * Normalize metadata at a consumer boundary without selecting a policy.
 * A structurally valid UNKNOWN contract remains UNKNOWN; missing or malformed
 * metadata is represented by the explicit all-UNKNOWN contract.
 */
export function normalizeSajuPolicyContractForConsumer(contract) {
  if (!isObject(contract)) return createSajuPolicyContract()
  const validation = validateSajuPolicyContract(contract)
  const structuralErrors = validation.errors.filter(error => !error.startsWith('policy_unknown:'))
  return structuralErrors.length === 0 ? contract : createSajuPolicyContract()
}

export function requireSajuPolicyContract(contract) {
  const validation = validateSajuPolicyContract(contract)
  if (!validation.valid) {
    const legacyAlias = validation.unknownPolicyKeys?.includes('dayBoundaryPolicy')
      ? ', dayBoundaryRule'
      : ''
    const error = new Error(`SAJU_POLICY_UNKNOWN: ${validation.errors.join(', ')}${legacyAlias}`)
    error.code = 'SAJU_POLICY_UNKNOWN'
    error.policyErrors = validation.errors
    error.unknownPolicyKeys = validation.unknownPolicyKeys || []
    throw error
  }
  return contract
}

/**
 * A supplied contract is declarative. Reject it if it does not describe the
 * legacy options that the current engine is actually about to use.
 */
export function assertSajuPolicyContractMatchesOptions(contract, options = {}) {
  requireSajuPolicyContract(contract)
  const expected = createSajuPolicyContractFromOptions(options)
  const actualValues = policyValues(contract)
  const expectedValues = policyValues(expected)
  const mismatches = SAJU_POLICY_KEYS.filter(key => actualValues[key] !== expectedValues[key])
  if (mismatches.length > 0) {
    const error = new Error(`SAJU_POLICY_MISMATCH: ${mismatches.join(', ')}`)
    error.code = 'SAJU_POLICY_MISMATCH'
    error.policyKeys = mismatches
    throw error
  }
  return contract
}

export function resolveSajuPolicyContract(options = {}) {
  const expected = createSajuPolicyContractFromOptions(options)
  if (hasOwn(options, 'policyContract')) {
    assertSajuPolicyContractMatchesOptions(options.policyContract, options)
  }
  return requireSajuPolicyContract(expected)
}

export function getSajuPolicy(contract, policyKey) {
  if (!SAJU_POLICY_KEYS.includes(policyKey)) throw new Error(`SAJU_POLICY_KEY_UNKNOWN: ${policyKey}`)
  const resolved = requireSajuPolicyContract(contract)
  return resolved.policies[policyKey]
}

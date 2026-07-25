import { getSystemCapabilities } from './engineCapabilities.js'

export const SYSTEM_STATUSES = Object.freeze([
  'complete',
  'partial',
  'needs_verification',
  'candidate_required',
  'experimental',
  'unsupported',
  'missing_input',
  'needs_profile',
])

const STATUS_SET = new Set(SYSTEM_STATUSES)

export const VALID_INPUT_STATUSES = Object.freeze(['valid', 'missing_input', 'unknown_birth_time', 'invalid'])
export const VALID_CALCULATION_STATUSES = Object.freeze(['calculated', 'partial', 'unsupported', 'failed'])
export const VALID_VERIFICATION_STATUSES = Object.freeze(['verified', 'needs_verification', 'candidate_required'])
export const VALID_INTERPRETATION_STATUSES = Object.freeze(['ready', 'experimental', 'candidate_only'])
export const VALID_CONFIDENCES = Object.freeze(['high', 'medium', 'low'])

export function isSystemStatus(value) {
  return STATUS_SET.has(value)
}

export function resolveStateContract({
  inputStatus = 'valid',
  calculationStatus = 'calculated',
  verificationStatus = 'verified',
  interpretationStatus = 'ready',
  confidence = 'medium',
} = {}) {
  return {
    inputStatus: VALID_INPUT_STATUSES.includes(inputStatus) ? inputStatus : 'valid',
    calculationStatus: VALID_CALCULATION_STATUSES.includes(calculationStatus) ? calculationStatus : 'calculated',
    verificationStatus: VALID_VERIFICATION_STATUSES.includes(verificationStatus) ? verificationStatus : 'verified',
    interpretationStatus: VALID_INTERPRETATION_STATUSES.includes(interpretationStatus) ? interpretationStatus : 'ready',
    confidence: VALID_CONFIDENCES.includes(confidence) ? confidence : 'medium',
  }
}

export function resolveSystemStatus({
  system,
  requestedStatus = null,
  hasRequiredInput = true,
  profileReady = true,
  calculationSucceeded = true,
  candidateRequired = false,
  needsVerification = false,
  experimental = false,
  partial = false,
} = {}) {
  const capabilities = getSystemCapabilities(system)

  if (!hasRequiredInput) return 'missing_input'
  if (!profileReady) return 'needs_profile'
  if (candidateRequired) return 'candidate_required'
  if (needsVerification) return 'needs_verification'
  if (experimental) return 'experimental'
  if (partial) return 'partial'
  if (isSystemStatus(requestedStatus)) return requestedStatus
  if (!capabilities.calculation || !calculationSucceeded) return 'unsupported'
  return capabilities.defaultStatus
}

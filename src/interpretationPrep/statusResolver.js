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

export function isSystemStatus(value) {
  return STATUS_SET.has(value)
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
  if (!capabilities.calculation) {
    return capabilities.defaultStatus === 'needs_profile' && profileReady
      ? 'unsupported'
      : capabilities.defaultStatus
  }
  if (!calculationSucceeded) return 'unsupported'
  if (candidateRequired) return 'candidate_required'
  if (needsVerification) return 'needs_verification'
  if (experimental) return 'experimental'
  if (partial) return 'partial'
  if (isSystemStatus(requestedStatus)) return requestedStatus
  return capabilities.defaultStatus
}

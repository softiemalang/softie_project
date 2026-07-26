/**
 * statusResolver.js — Per-Result 상태 계약(State Contract) 레이어
 *
 * [레이어 구분]
 * - Capability Layer (engineCapabilities.js): 시스템이 계산 기능에 연결되어 있는지를 나타냄.
 *   defaultStatus는 기능 가용성의 기본값이며 외부 검증 상태와 독립적입니다.
 *
 * - Per-Result State Layer (이 파일): 개별 계산 결과의 신뢰도와 검증 상태를 관리합니다.
 *   resolveStateContract()는 5개 차원의 상태 계약을 반환합니다:
 *   - inputStatus: 입력 유효성 (valid, unknown_birth_time, missing_input, invalid)
 *   - calculationStatus: 계산 완료 여부 (calculated, partial, unsupported, failed)
 *   - verificationStatus: 외부 검증 상태 (verified, needs_verification, needs_external_verification, candidate_required)
 *   - interpretationStatus: 해석 준비 상태 (ready, experimental, candidate_only)
 *   - confidence: 종합 신뢰도 (high, medium, low)
 *
 *   resolveSystemStatus()는 capability.defaultStatus를 최종 fallback으로만 사용하며,
 *   needsVerification·candidateRequired·experimental 등이 먼저 우선됩니다.
 */
import { getSystemCapabilities } from './engineCapabilities.js'

export const SYSTEM_STATUSES = Object.freeze([
  'complete',
  'partial',
  'needs_verification',
  'candidate_required',
  'experimental',
  'available',
  'unavailable',
  'simulation_only',
  'simulation_blocked',
  'adapter_required',
  'insufficient_data',
  'unsupported',
  'missing_input',
  'needs_profile',
])

const STATUS_SET = new Set(SYSTEM_STATUSES)

export const VALID_INPUT_STATUSES = Object.freeze(['valid', 'missing_input', 'unknown_birth_time', 'invalid'])
export const VALID_CALCULATION_STATUSES = Object.freeze(['calculated', 'partial', 'unsupported', 'failed'])
export const VALID_VERIFICATION_STATUSES = Object.freeze(['verified', 'needs_verification', 'needs_external_verification', 'candidate_required'])
export const VALID_INTERPRETATION_STATUSES = Object.freeze(['ready', 'experimental', 'candidate_only'])
export const VALID_CONFIDENCES = Object.freeze(['high', 'medium', 'low'])

export function isSystemStatus(value) {
  return STATUS_SET.has(value)
}

export function resolveStateContract(params = {}) {
  const {
    inputStatus = 'missing_input',
    calculationStatus = 'partial',
    verificationStatus = 'needs_verification',
    interpretationStatus = 'candidate_only',
    confidence = 'low',
  } = params

  const resolvedVerification = VALID_VERIFICATION_STATUSES.includes(verificationStatus)
    ? verificationStatus
    : 'needs_verification'

  return {
    inputStatus: VALID_INPUT_STATUSES.includes(inputStatus)
      ? inputStatus
      : 'missing_input',
    calculationStatus: VALID_CALCULATION_STATUSES.includes(calculationStatus)
      ? calculationStatus
      : 'partial',
    verificationStatus: resolvedVerification,
    interpretationStatus: VALID_INTERPRETATION_STATUSES.includes(interpretationStatus)
      ? interpretationStatus
      : 'candidate_only',
    confidence: VALID_CONFIDENCES.includes(confidence)
      ? confidence
      : 'low',
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

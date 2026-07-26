export const ENGINE_CAPABILITIES_VERSION = 'engine-capabilities-1.0.0'

/**
 * ENGINE_CAPABILITIES — 계산 기능 가용성(Capability Layer) 정의
 *
 * [중요] 이 객체의 defaultStatus는 시스템이 계산 기능에 연결되어 있는지를 나타내는
 * capability 기본값입니다. 개별 계산 결과의 상태 계약(stateContract)과 독립적입니다.
 *
 * - defaultStatus: 계산 기능 연결 여부의 기본값 (capability layer)
 * - stateContract(per-result): 개별 계산의 inputStatus·calculationStatus·verificationStatus·
 *   interpretationStatus·confidence (statusResolver.js 및 sajuAdapter.js에서 관리)
 *
 * 외부 검증 부족을 이유로 capability defaultStatus를 experimental 또는 blocked로
 * 낮추지 않습니다. 외부 검증 상태는 stateContract.verificationStatus로 관리합니다.
 */
export const ENGINE_CAPABILITIES = Object.freeze({
  saju: Object.freeze({
    system: 'saju',
    calculation: true,
    pillars: true,
    relations: true,
    timing: true,
    interpretationFeatures: true,
    defaultStatus: 'complete',
  }),
  ziwei: Object.freeze({
    system: 'ziwei',
    calculation: true,
    pillars: false,
    relations: true,
    timing: false,
    interpretationFeatures: true,
    defaultStatus: 'experimental',
  }),
  astrology: Object.freeze({
    system: 'astrology',
    calculation: false,
    pillars: false,
    relations: false,
    timing: false,
    interpretationFeatures: false,
    defaultStatus: 'unsupported',
  }),
})

export function getSystemCapabilities(system) {
  return ENGINE_CAPABILITIES[system] || Object.freeze({
    system,
    calculation: false,
    pillars: false,
    relations: false,
    timing: false,
    interpretationFeatures: false,
    defaultStatus: 'unsupported',
  })
}

export function supportsCapability(system, capability) {
  return getSystemCapabilities(system)[capability] === true
}

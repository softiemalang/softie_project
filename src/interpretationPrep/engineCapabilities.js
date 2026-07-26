export const ENGINE_CAPABILITIES_VERSION = 'engine-capabilities-1.0.0'

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

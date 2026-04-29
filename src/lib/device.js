const DEVICE_ID_STORAGE_KEY = 'scheduler:push-device-id'

function hasWindow() {
  return typeof window !== 'undefined'
}

function createFallbackUuid() {
  return `scheduler-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

let inMemoryDeviceId = ''

export function getOrCreatePushDeviceId() {
  if (!hasWindow()) return ''

  try {
    const existing = window.localStorage.getItem(DEVICE_ID_STORAGE_KEY)
    if (existing) return existing

    const nextValue =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : createFallbackUuid()

    window.localStorage.setItem(DEVICE_ID_STORAGE_KEY, nextValue)
    inMemoryDeviceId = nextValue
    return nextValue
  } catch (error) {
    console.warn('[push] localStorage device id access failed', error)

    if (inMemoryDeviceId) return inMemoryDeviceId

    inMemoryDeviceId =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : createFallbackUuid()

    return inMemoryDeviceId
  }
}

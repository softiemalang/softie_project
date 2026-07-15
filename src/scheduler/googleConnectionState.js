export const GOOGLE_CONNECTION_STORAGE_KEY = 'scheduler:google_connected'

function getBrowserStorage() {
  return typeof window === 'undefined' ? null : window.localStorage
}

export function readCachedGoogleConnection(storage = getBrowserStorage()) {
  return storage?.getItem(GOOGLE_CONNECTION_STORAGE_KEY) === 'true'
}

export function cacheGoogleConnection(connected, storage = getBrowserStorage()) {
  if (!storage) return

  if (connected) {
    storage.setItem(GOOGLE_CONNECTION_STORAGE_KEY, 'true')
  } else {
    storage.removeItem(GOOGLE_CONNECTION_STORAGE_KEY)
  }
}

export function consumeGoogleConnectedCallback({
  location = typeof window === 'undefined' ? null : window.location,
  history = typeof window === 'undefined' ? null : window.history,
} = {}) {
  if (!location || !history) return false

  const params = new URLSearchParams(location.search)
  if (params.get('google_connected') !== 'true') return false

  params.delete('google_connected')
  const nextSearch = params.toString()
  const nextUrl = `${location.pathname}${nextSearch ? `?${nextSearch}` : ''}${location.hash || ''}`
  history.replaceState(history.state, '', nextUrl)
  return true
}

export function normalizeGoogleConnectionStatus(payload) {
  if (!payload || typeof payload.connected !== 'boolean') {
    throw new Error('Google 연결 상태 응답이 올바르지 않습니다.')
  }

  return {
    connected: payload.connected,
    reason: typeof payload.reason === 'string' ? payload.reason : null,
  }
}

export async function verifyGoogleConnectionWith({ userId, requestStatus, storage = getBrowserStorage() }) {
  if (!userId) {
    cacheGoogleConnection(false, storage)
    return { connected: false, reason: 'signed_out' }
  }

  const status = normalizeGoogleConnectionStatus(await requestStatus(userId))
  cacheGoogleConnection(status.connected, storage)
  return status
}

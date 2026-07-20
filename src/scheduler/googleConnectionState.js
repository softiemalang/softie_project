export const GOOGLE_CONNECTION_STORAGE_KEY = 'scheduler:google_connected'

const GOOGLE_CONNECTION_MESSAGES = {
  missing_refresh_token: 'Google 권한 갱신 정보가 없어 계정을 다시 연결해야 해요.',
  token_expired_or_revoked: 'Google 권한이 만료되었거나 취소되어 계정을 다시 연결해야 해요.',
  missing_token: 'Google 연결 정보가 없어 계정 연결이 필요해요.',
  reconnect_required: 'Google 계정을 다시 연결해 주세요.',
  verification_failed: 'Google 연결 상태를 확인하지 못했어요. 잠시 후 다시 시도해 주세요.',
}

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

export function getGoogleConnectionMessage(reason) {
  return GOOGLE_CONNECTION_MESSAGES[reason] || '연결하면 일정 동기화와 백업을 사용할 수 있어요.'
}

export function inferGoogleDisconnectReason(error) {
  const message = error instanceof Error ? error.message.toLowerCase() : ''
  if (message.includes('invalid_grant') || message.includes('expired or revoked')) return 'token_expired_or_revoked'
  if (message.includes('no refresh token') || message.includes('refresh token')) return 'missing_refresh_token'
  if (message.includes('not connected')) return 'missing_token'
  if (message.includes('insufficient')) return 'reconnect_required'
  return null
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

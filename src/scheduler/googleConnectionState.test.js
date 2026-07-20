import assert from 'node:assert/strict'
import test from 'node:test'
import {
  GOOGLE_CONNECTION_STORAGE_KEY,
  cacheGoogleConnection,
  consumeGoogleConnectedCallback,
  getGoogleConnectionMessage,
  inferGoogleDisconnectReason,
  normalizeGoogleConnectionStatus,
  readCachedGoogleConnection,
  verifyGoogleConnectionWith,
} from './googleConnectionState.js'
import {
  getGoogleDisconnectReason,
  isDisconnectedGoogleTokenError,
} from '../../supabase/functions/_shared/googleConnectionStatus.js'

function createStorage(initial = {}) {
  const values = new Map(Object.entries(initial))
  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null
    },
    removeItem(key) {
      values.delete(key)
    },
    setItem(key, value) {
      values.set(key, String(value))
    },
  }
}

test('OAuth callback flag is removed without treating it as verified state', () => {
  let replacedUrl = null
  const consumed = consumeGoogleConnectedCallback({
    location: {
      pathname: '/scheduler',
      search: '?google_connected=true&date=2026-07-16',
      hash: '#today',
    },
    history: {
      state: { source: 'oauth' },
      replaceState(_state, _title, url) {
        replacedUrl = url
      },
    },
  })

  assert.equal(consumed, true)
  assert.equal(replacedUrl, '/scheduler?date=2026-07-16#today')
})

test('verified connection is cached only after a connected server response', async () => {
  const storage = createStorage()
  const status = await verifyGoogleConnectionWith({
    userId: 'user-1',
    requestStatus: async (userId) => ({ connected: userId === 'user-1' }),
    storage,
  })

  assert.deepEqual(status, { connected: true, reason: null })
  assert.equal(readCachedGoogleConnection(storage), true)
})

test('disconnected server response clears a stale connection cache', async () => {
  const storage = createStorage({ [GOOGLE_CONNECTION_STORAGE_KEY]: 'true' })
  const status = await verifyGoogleConnectionWith({
    userId: 'user-1',
    requestStatus: async () => ({ connected: false, reason: 'reconnect_required' }),
    storage,
  })

  assert.deepEqual(status, { connected: false, reason: 'reconnect_required' })
  assert.equal(readCachedGoogleConnection(storage), false)
})

test('signed-out verification clears cached connection without a request', async () => {
  const storage = createStorage({ [GOOGLE_CONNECTION_STORAGE_KEY]: 'true' })
  let requested = false
  const status = await verifyGoogleConnectionWith({
    userId: '',
    requestStatus: async () => {
      requested = true
      return { connected: true }
    },
    storage,
  })

  assert.deepEqual(status, { connected: false, reason: 'signed_out' })
  assert.equal(requested, false)
  assert.equal(readCachedGoogleConnection(storage), false)
})

test('invalid server payload does not overwrite the last verified cache', async () => {
  const storage = createStorage({ [GOOGLE_CONNECTION_STORAGE_KEY]: 'true' })

  await assert.rejects(
    verifyGoogleConnectionWith({
      userId: 'user-1',
      requestStatus: async () => ({ status: 'ok' }),
      storage,
    }),
    /응답이 올바르지 않습니다/,
  )

  assert.equal(readCachedGoogleConnection(storage), true)
  assert.throws(() => normalizeGoogleConnectionStatus(null), /응답이 올바르지 않습니다/)
  cacheGoogleConnection(false, storage)
  assert.equal(readCachedGoogleConnection(storage), false)
})

test('known missing or revoked Google token errors require reconnection', () => {
  assert.equal(isDisconnectedGoogleTokenError(new Error('Google Calendar not connected')), true)
  assert.equal(isDisconnectedGoogleTokenError(new Error('No refresh token available. Please reconnect.')), true)
  assert.equal(isDisconnectedGoogleTokenError(new Error('Failed to refresh token: invalid_grant')), true)
  assert.equal(isDisconnectedGoogleTokenError(new Error('Token has been expired or revoked')), true)
  assert.equal(getGoogleDisconnectReason(new Error('Google Calendar not connected')), 'missing_token')
  assert.equal(getGoogleDisconnectReason(new Error('No refresh token available. Please reconnect.')), 'missing_refresh_token')
  assert.equal(getGoogleDisconnectReason(new Error('Failed to refresh token: invalid_grant')), 'token_expired_or_revoked')
})

test('temporary infrastructure errors are not misclassified as disconnection', () => {
  assert.equal(isDisconnectedGoogleTokenError(new Error('fetch failed')), false)
  assert.equal(isDisconnectedGoogleTokenError(new Error('database timeout')), false)
  assert.equal(isDisconnectedGoogleTokenError(null), false)
  assert.equal(getGoogleDisconnectReason(new Error('fetch failed')), null)
})

test('Google disconnect reasons provide actionable user messages', () => {
  assert.match(getGoogleConnectionMessage('token_expired_or_revoked'), /만료되었거나 취소/)
  assert.match(getGoogleConnectionMessage('missing_refresh_token'), /갱신 정보/)
  assert.match(getGoogleConnectionMessage(null), /일정 동기화와 백업/)
})

test('client errors are classified before clearing the connection state', () => {
  assert.equal(inferGoogleDisconnectReason(new Error('Failed to refresh token: invalid_grant')), 'token_expired_or_revoked')
  assert.equal(inferGoogleDisconnectReason(new Error('No refresh token available')), 'missing_refresh_token')
  assert.equal(inferGoogleDisconnectReason(new Error('Google Calendar not connected')), 'missing_token')
  assert.equal(inferGoogleDisconnectReason(new Error('fetch failed')), null)
})

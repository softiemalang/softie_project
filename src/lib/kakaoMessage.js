import { initKakao } from './kakaoShare'
import { getCurrentSession } from './auth'

const KAKAO_PENDING_MEMO_STORAGE_KEY = 'softie:kakao:pending-memo'
const KAKAO_LOGIN_STATE_STORAGE_KEY = 'softie:kakao:login-state'
const KAKAO_CALENDAR_CONNECTED_STORAGE_KEY = 'softie:kakaoCalendarConnected'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
const KAKAO_MEMO_SCOPES = ['talk_message', 'talk_calendar']

function getKakaoRedirectUri() {
  if (typeof window === 'undefined') return ''
  return `${window.location.origin}/kakao/callback`
}

function encodeState(payload) {
  return encodeURIComponent(JSON.stringify(payload))
}

function decodeState(value) {
  if (!value) return {}

  try {
    return JSON.parse(decodeURIComponent(value))
  } catch (error) {
    console.warn('[kakaoMessage] Failed to parse OAuth state.', error)
    return {}
  }
}

function readPendingMemo() {
  if (typeof window === 'undefined') return null

  try {
    const raw = window.sessionStorage.getItem(KAKAO_PENDING_MEMO_STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function clearPendingMemo() {
  if (typeof window === 'undefined') return
  window.sessionStorage.removeItem(KAKAO_PENDING_MEMO_STORAGE_KEY)
}

function storePendingMemo(memo) {
  if (typeof window === 'undefined' || !memo?.text) return
  window.sessionStorage.setItem(KAKAO_PENDING_MEMO_STORAGE_KEY, JSON.stringify({
    text: memo.text,
    url: memo.url || `${window.location.origin}/scheduler`,
  }))
}

async function getFunctionHeaders() {
  const headers = {
    'Content-Type': 'application/json',
  }

  if (SUPABASE_ANON_KEY) {
    headers.apikey = SUPABASE_ANON_KEY
  }

  const session = await getCurrentSession()
  if (session?.access_token) {
    headers.Authorization = `Bearer ${session.access_token}`
  }

  return headers
}

async function callSupabaseFunction(functionName, body) {
  if (!SUPABASE_URL) {
    throw new Error('Supabase URL이 설정되어 있지 않아요.')
  }

  const response = await fetch(`${SUPABASE_URL}/functions/v1/${functionName}`, {
    method: 'POST',
    headers: await getFunctionHeaders(),
    body: JSON.stringify(body),
  })

  const payload = await response.json().catch(() => null)

  if (!response.ok) {
    const error = new Error(payload?.error || '카카오 요청에 실패했어요.')
    error.status = response.status
    error.payload = payload
    throw error
  }

  return payload
}

async function exchangeKakaoCodeForToken({ code, redirectUri }) {
  return callSupabaseFunction('kakao-oauth-token', { code, redirectUri })
}

async function sendKakaoMemoThroughBackend({ text, url }) {
  return callSupabaseFunction('send-kakao-memo', { text, url })
}

export function isKakaoCalendarConnected() {
  if (typeof window === 'undefined') return false
  return window.localStorage.getItem(KAKAO_CALENDAR_CONNECTED_STORAGE_KEY) === 'true'
}

export function markKakaoCalendarConnected() {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(KAKAO_CALENDAR_CONNECTED_STORAGE_KEY, 'true')
}

export function startKakaoMemoLogin({ returnPath = '/scheduler', pendingMemo = null } = {}) {
  if (!initKakao()) {
    return { ok: false, reason: 'sdk_not_ready' }
  }

  const nonce = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
  const statePayload = {
    nonce,
    returnPath,
    reason: 'memo',
  }

  if (typeof window !== 'undefined') {
    window.sessionStorage.setItem(KAKAO_LOGIN_STATE_STORAGE_KEY, nonce)
    storePendingMemo(pendingMemo)
  }

  window.Kakao.Auth.authorize({
    redirectUri: getKakaoRedirectUri(),
    scope: KAKAO_MEMO_SCOPES.join(','),
    state: encodeState(statePayload),
  })

  return { ok: true }
}

export async function completeKakaoMemoLoginFromCallback() {
  if (typeof window === 'undefined') {
    return { ok: false, reason: 'window_unavailable', returnPath: '/scheduler' }
  }

  const params = new URLSearchParams(window.location.search)
  const error = params.get('error')
  const errorDescription = params.get('error_description')
  const code = params.get('code')
  const state = decodeState(params.get('state'))
  const storedNonce = window.sessionStorage.getItem(KAKAO_LOGIN_STATE_STORAGE_KEY)
  const returnPath = typeof state.returnPath === 'string' ? state.returnPath : '/scheduler'

  if (error) {
    return {
      ok: false,
      reason: 'kakao_authorization_failed',
      message: errorDescription || error,
      returnPath,
    }
  }

  if (!code) {
    return { ok: false, reason: 'missing_code', returnPath }
  }

  if (state.nonce && storedNonce && state.nonce !== storedNonce) {
    return { ok: false, reason: 'invalid_state', returnPath }
  }

  const redirectUri = getKakaoRedirectUri()
  await exchangeKakaoCodeForToken({ code, redirectUri })
  window.sessionStorage.removeItem(KAKAO_LOGIN_STATE_STORAGE_KEY)

  if (returnPath.startsWith('/rehearsals')) {
    markKakaoCalendarConnected()
  }

  const pendingMemo = readPendingMemo()
  if (pendingMemo?.text) {
    const sendResult = await sendKakaoMemoText({
      text: pendingMemo.text,
      url: pendingMemo.url,
    })
    clearPendingMemo()
    return {
      ok: sendResult.ok,
      reason: sendResult.reason,
      sentPending: sendResult.ok,
      returnPath,
    }
  }

  return { ok: true, sentPending: false, returnPath }
}

export async function sendKakaoMemoText({ text, url }) {
  if (!text) return { ok: false, reason: 'empty_text' }

  try {
    await sendKakaoMemoThroughBackend({
      text,
      url: url || `${window.location.origin}/scheduler`,
    })

    return { ok: true }
  } catch (error) {
    console.error('[kakaoMessage] Failed to send memo.', error)

    if (error?.status === 401 || error?.payload?.error === 'needs_kakao_login') {
      return { ok: false, reason: 'needs_login', error }
    }

    return { ok: false, reason: 'api_failed', error }
  }
}

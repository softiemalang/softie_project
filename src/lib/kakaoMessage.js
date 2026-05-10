import { initKakao } from './kakaoShare'

const KAKAO_ACCESS_TOKEN_STORAGE_KEY = 'softie:kakao:access-token'
const KAKAO_PENDING_MEMO_STORAGE_KEY = 'softie:kakao:pending-memo'
const KAKAO_LOGIN_STATE_STORAGE_KEY = 'softie:kakao:login-state'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

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

function getStoredKakaoAccessToken() {
  if (typeof window === 'undefined') return ''
  return window.sessionStorage.getItem(KAKAO_ACCESS_TOKEN_STORAGE_KEY) || ''
}

function storeKakaoAccessToken(accessToken) {
  if (typeof window === 'undefined' || !accessToken) return
  window.sessionStorage.setItem(KAKAO_ACCESS_TOKEN_STORAGE_KEY, accessToken)
}

function clearKakaoAccessToken() {
  if (typeof window === 'undefined') return
  window.sessionStorage.removeItem(KAKAO_ACCESS_TOKEN_STORAGE_KEY)
}

function getCurrentKakaoAccessToken() {
  if (typeof window === 'undefined' || !window.Kakao?.Auth) return ''
  return window.Kakao.Auth.getAccessToken?.() || getStoredKakaoAccessToken()
}

function applyStoredKakaoAccessToken() {
  if (!initKakao()) return ''

  const accessToken = getStoredKakaoAccessToken()
  if (accessToken) {
    window.Kakao.Auth.setAccessToken(accessToken)
  }
  return getCurrentKakaoAccessToken()
}

async function exchangeKakaoCodeForToken({ code, redirectUri }) {
  if (!SUPABASE_URL) {
    throw new Error('Supabase URL이 설정되어 있지 않아요.')
  }

  const headers = {
    'Content-Type': 'application/json',
  }

  if (SUPABASE_ANON_KEY) {
    headers.apikey = SUPABASE_ANON_KEY
  }

  const response = await fetch(`${SUPABASE_URL}/functions/v1/kakao-oauth-token`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ code, redirectUri }),
  })

  const payload = await response.json().catch(() => null)

  if (!response.ok || !payload?.access_token) {
    throw new Error(payload?.error || '카카오 토큰 발급에 실패했어요.')
  }

  return payload
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
    scope: 'talk_message',
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
  const tokenPayload = await exchangeKakaoCodeForToken({ code, redirectUri })

  if (!initKakao()) {
    return { ok: false, reason: 'sdk_not_ready', returnPath }
  }

  window.Kakao.Auth.setAccessToken(tokenPayload.access_token)
  storeKakaoAccessToken(tokenPayload.access_token)
  window.sessionStorage.removeItem(KAKAO_LOGIN_STATE_STORAGE_KEY)

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
  if (!initKakao()) return { ok: false, reason: 'sdk_not_ready' }

  const accessToken = applyStoredKakaoAccessToken()
  if (!accessToken) {
    return { ok: false, reason: 'needs_login' }
  }

  const targetUrl = url || `${window.location.origin}/scheduler`

  try {
    await window.Kakao.API.request({
      url: '/v2/api/talk/memo/default/send',
      data: {
        template_object: {
          object_type: 'text',
          text,
          link: {
            web_url: targetUrl,
            mobile_web_url: targetUrl,
          },
        },
      },
    })

    return { ok: true }
  } catch (error) {
    console.error('[kakaoMessage] Failed to send memo.', error)

    const status = error?.status || error?.code
    if (status === -401 || status === 401) {
      clearKakaoAccessToken()
      return { ok: false, reason: 'needs_login', error }
    }

    return { ok: false, reason: 'api_failed', error }
  }
}

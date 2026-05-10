import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const ALLOWED_ORIGINS = new Set([
  'https://softieproject.com',
  'https://project-fp5ie.vercel.app',
  'http://localhost:5173',
  'http://localhost:4173',
])

function corsHeaders(req: Request) {
  const origin = req.headers.get('origin') || ''
  const allowOrigin = ALLOWED_ORIGINS.has(origin) ? origin : 'https://softieproject.com'
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  }
}

function jsonResponse(req: Request, body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders(req),
      'Content-Type': 'application/json',
    },
  })
}

function getRequiredEnv(name: string) {
  const value = Deno.env.get(name)
  if (!value) throw new Error(`missing_${name.toLowerCase()}`)
  return value
}

function getBearerToken(req: Request) {
  const authorization = req.headers.get('authorization') || ''
  const match = authorization.match(/^Bearer\s+(.+)$/i)
  return match?.[1]?.trim() || ''
}

function createServiceClient() {
  return createClient(
    getRequiredEnv('SUPABASE_URL'),
    getRequiredEnv('SUPABASE_SERVICE_ROLE_KEY'),
  )
}

async function getSupabaseUser(req: Request) {
  const token = getBearerToken(req)
  if (!token) throw new Error('missing_authorization')

  const authClient = createClient(
    getRequiredEnv('SUPABASE_URL'),
    getRequiredEnv('SUPABASE_ANON_KEY'),
  )

  const { data, error } = await authClient.auth.getUser(token)
  if (error || !data.user) throw new Error('invalid_authorization')
  return data.user
}

async function refreshKakaoToken(refreshToken: string) {
  const params = new URLSearchParams()
  params.set('grant_type', 'refresh_token')
  params.set('client_id', getRequiredEnv('KAKAO_REST_API_KEY'))
  params.set('refresh_token', refreshToken)

  const kakaoClientSecret = Deno.env.get('KAKAO_CLIENT_SECRET')
  if (kakaoClientSecret) {
    params.set('client_secret', kakaoClientSecret)
  }

  const response = await fetch('https://kauth.kakao.com/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
    },
    body: params,
  })

  const payload = await response.json().catch(() => null)
  if (!response.ok || !payload?.access_token) {
    console.error('[send-kakao-memo] token refresh failed', {
      status: response.status,
      error: payload?.error,
      error_description: payload?.error_description,
    })
    throw new Error('kakao_refresh_failed')
  }

  return payload
}

async function ensureFreshAccessToken(serviceClient: ReturnType<typeof createClient>, row: Record<string, any>) {
  const expiresAt = new Date(row.expires_at).getTime()
  const shouldRefresh = Number.isNaN(expiresAt) || expiresAt <= Date.now() + 60_000

  if (!shouldRefresh) {
    return row.access_token
  }

  const refreshed = await refreshKakaoToken(row.refresh_token)
  const nextExpiresAt = new Date(Date.now() + Number(refreshed.expires_in || 21600) * 1000).toISOString()
  const nextRefreshToken = refreshed.refresh_token || row.refresh_token
  const nextRefreshTokenExpiresAt = refreshed.refresh_token_expires_in
    ? new Date(Date.now() + Number(refreshed.refresh_token_expires_in) * 1000).toISOString()
    : row.refresh_token_expires_at

  const { error } = await serviceClient
    .from('kakao_memo_tokens')
    .update({
      access_token: refreshed.access_token,
      refresh_token: nextRefreshToken,
      expires_at: nextExpiresAt,
      refresh_token_expires_at: nextRefreshTokenExpiresAt,
      scope: refreshed.scope || row.scope || null,
    })
    .eq('user_id', row.user_id)

  if (error) throw error
  return refreshed.access_token
}

async function sendKakaoMemo(accessToken: string, text: string, url: string) {
  const templateObject = {
    object_type: 'text',
    text: text.slice(0, 900),
    link: {
      web_url: url,
      mobile_web_url: url,
    },
    button_title: '자세히 보기',
  }

  const body = new URLSearchParams()
  body.set('template_object', JSON.stringify(templateObject))

  const response = await fetch('https://kapi.kakao.com/v2/api/talk/memo/default/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
    },
    body,
  })

  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    console.error('[send-kakao-memo] memo send failed', {
      status: response.status,
      code: payload?.code,
      msg: payload?.msg,
    })
    throw new Error(response.status === 401 ? 'kakao_token_expired' : 'kakao_memo_send_failed')
  }

  return payload
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(req) })
  }

  if (req.method !== 'POST') {
    return jsonResponse(req, { error: 'method_not_allowed' }, 405)
  }

  try {
    const user = await getSupabaseUser(req)
    const payload = await req.json().catch(() => null)
    const text = typeof payload?.text === 'string' ? payload.text.trim() : ''
    const url = typeof payload?.url === 'string' && payload.url.startsWith('http')
      ? payload.url
      : 'https://softieproject.com/scheduler'

    if (!text) {
      return jsonResponse(req, { error: 'empty_text' }, 400)
    }

    const serviceClient = createServiceClient()
    const { data: tokenRow, error: tokenError } = await serviceClient
      .from('kakao_memo_tokens')
      .select('user_id, access_token, refresh_token, expires_at, refresh_token_expires_at, scope')
      .eq('user_id', user.id)
      .maybeSingle()

    if (tokenError) throw tokenError
    if (!tokenRow?.refresh_token) {
      return jsonResponse(req, { error: 'needs_kakao_login' }, 401)
    }

    let accessToken = await ensureFreshAccessToken(serviceClient, tokenRow)

    try {
      await sendKakaoMemo(accessToken, text, url)
    } catch (error) {
      if (error instanceof Error && error.message === 'kakao_token_expired') {
        accessToken = await ensureFreshAccessToken(serviceClient, { ...tokenRow, expires_at: '1970-01-01T00:00:00Z' })
        await sendKakaoMemo(accessToken, text, url)
      } else {
        throw error
      }
    }

    return jsonResponse(req, { sent: true })
  } catch (error) {
    console.error('[send-kakao-memo] unexpected error', error)
    const message = error instanceof Error ? error.message : 'unexpected_error'
    const status = message.includes('authorization') ? 401 : 500
    return jsonResponse(req, { error: message }, status)
  }
})

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

function isAllowedRedirectUri(value: string) {
  return value === 'https://softieproject.com/kakao/callback'
    || value === 'https://project-fp5ie.vercel.app/kakao/callback'
    || value === 'http://localhost:5173/kakao/callback'
    || value === 'http://localhost:4173/kakao/callback'
}

function getBearerToken(req: Request) {
  const authorization = req.headers.get('authorization') || ''
  const match = authorization.match(/^Bearer\s+(.+)$/i)
  return match?.[1]?.trim() || ''
}

function getRequiredEnv(name: string) {
  const value = Deno.env.get(name)
  if (!value) throw new Error(`missing_${name.toLowerCase()}`)
  return value
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

async function getKakaoUserId(accessToken: string) {
  const response = await fetch('https://kapi.kakao.com/v2/user/me', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    console.warn('[kakao-oauth-token] failed to fetch kakao user id', {
      status: response.status,
      error: payload?.code || payload?.error,
    })
    return null
  }

  return typeof payload?.id === 'number' ? payload.id : null
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
    const kakaoRestApiKey = getRequiredEnv('KAKAO_REST_API_KEY')
    const kakaoClientSecret = Deno.env.get('KAKAO_CLIENT_SECRET')

    const payload = await req.json().catch(() => null)
    const code = typeof payload?.code === 'string' ? payload.code.trim() : ''
    const redirectUri = typeof payload?.redirectUri === 'string' ? payload.redirectUri.trim() : ''

    if (!code || !redirectUri) {
      return jsonResponse(req, { error: 'missing_required_fields' }, 400)
    }

    if (!isAllowedRedirectUri(redirectUri)) {
      return jsonResponse(req, { error: 'redirect_uri_not_allowed' }, 400)
    }

    const params = new URLSearchParams()
    params.set('grant_type', 'authorization_code')
    params.set('client_id', kakaoRestApiKey)
    params.set('redirect_uri', redirectUri)
    params.set('code', code)

    if (kakaoClientSecret) {
      params.set('client_secret', kakaoClientSecret)
    }

    const kakaoResponse = await fetch('https://kauth.kakao.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
      },
      body: params,
    })

    const tokenPayload = await kakaoResponse.json().catch(() => null)

    if (!kakaoResponse.ok || !tokenPayload?.access_token) {
      console.error('[kakao-oauth-token] token exchange failed', {
        status: kakaoResponse.status,
        error: tokenPayload?.error,
        error_description: tokenPayload?.error_description,
      })
      return jsonResponse(req, { error: 'kakao_token_exchange_failed' }, 502)
    }

    const serviceClient = createClient(
      getRequiredEnv('SUPABASE_URL'),
      getRequiredEnv('SUPABASE_SERVICE_ROLE_KEY'),
    )

    const { data: existingToken, error: existingError } = await serviceClient
      .from('kakao_memo_tokens')
      .select('refresh_token, refresh_token_expires_at')
      .eq('user_id', user.id)
      .maybeSingle()

    if (existingError) throw existingError

    const now = Date.now()
    const refreshToken = tokenPayload.refresh_token || existingToken?.refresh_token
    if (!refreshToken) {
      return jsonResponse(req, { error: 'missing_kakao_refresh_token' }, 502)
    }

    const kakaoUserId = await getKakaoUserId(tokenPayload.access_token)
    const expiresAt = new Date(now + Number(tokenPayload.expires_in || 21600) * 1000).toISOString()
    const refreshTokenExpiresAt = tokenPayload.refresh_token_expires_in
      ? new Date(now + Number(tokenPayload.refresh_token_expires_in) * 1000).toISOString()
      : existingToken?.refresh_token_expires_at || null

    const { error: upsertError } = await serviceClient
      .from('kakao_memo_tokens')
      .upsert({
        user_id: user.id,
        kakao_user_id: kakaoUserId,
        access_token: tokenPayload.access_token,
        refresh_token: refreshToken,
        expires_at: expiresAt,
        refresh_token_expires_at: refreshTokenExpiresAt,
        scope: tokenPayload.scope || null,
      }, { onConflict: 'user_id' })

    if (upsertError) throw upsertError

    return jsonResponse(req, {
      connected: true,
      expires_at: expiresAt,
      scope: tokenPayload.scope,
    })
  } catch (error) {
    console.error('[kakao-oauth-token] unexpected error', error)
    const message = error instanceof Error ? error.message : 'unexpected_error'
    const status = message.includes('authorization') ? 401 : 500
    return jsonResponse(req, { error: message }, status)
  }
})

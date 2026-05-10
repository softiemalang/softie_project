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

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(req) })
  }

  if (req.method !== 'POST') {
    return jsonResponse(req, { error: 'method_not_allowed' }, 405)
  }

  try {
    const kakaoRestApiKey = Deno.env.get('KAKAO_REST_API_KEY')
    const kakaoClientSecret = Deno.env.get('KAKAO_CLIENT_SECRET')

    if (!kakaoRestApiKey) {
      return jsonResponse(req, { error: 'missing_kakao_rest_api_key' }, 500)
    }

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

    return jsonResponse(req, {
      access_token: tokenPayload.access_token,
      token_type: tokenPayload.token_type,
      expires_in: tokenPayload.expires_in,
      scope: tokenPayload.scope,
    })
  } catch (error) {
    console.error('[kakao-oauth-token] unexpected error', error)
    return jsonResponse(req, { error: 'unexpected_error' }, 500)
  }
})

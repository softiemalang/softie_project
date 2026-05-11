import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

export function getRequiredEnv(name: string) {
  const value = Deno.env.get(name)
  if (!value) throw new Error(`missing_${name.toLowerCase()}`)
  return value
}

export function createServiceClient() {
  return createClient(
    getRequiredEnv('SUPABASE_URL'),
    getRequiredEnv('SUPABASE_SERVICE_ROLE_KEY'),
  )
}

async function refreshKakaoToken(refreshToken: string, logPrefix = 'kakao-token') {
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
    console.error(`[${logPrefix}] token refresh failed`, {
      status: response.status,
      error: payload?.error,
      error_description: payload?.error_description,
    })
    throw new Error('kakao_refresh_failed')
  }

  return payload
}

export async function ensureFreshKakaoAccessToken(
  serviceClient: ReturnType<typeof createClient>,
  row: Record<string, any>,
  options: { forceRefresh?: boolean; logPrefix?: string } = {},
) {
  const expiresAt = new Date(row.expires_at).getTime()
  const shouldRefresh =
    options.forceRefresh === true ||
    Number.isNaN(expiresAt) ||
    expiresAt <= Date.now() + 60_000

  if (!shouldRefresh) {
    return row.access_token
  }

  const refreshed = await refreshKakaoToken(row.refresh_token, options.logPrefix)
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

export async function getFreshKakaoAccessTokenForUser(
  serviceClient: ReturnType<typeof createClient>,
  userId: string,
  options: { forceRefresh?: boolean; logPrefix?: string } = {},
) {
  const { data: tokenRow, error: tokenError } = await serviceClient
    .from('kakao_memo_tokens')
    .select('user_id, access_token, refresh_token, expires_at, refresh_token_expires_at, scope')
    .eq('user_id', userId)
    .maybeSingle()

  if (tokenError) throw tokenError
  if (!tokenRow?.refresh_token) {
    throw new Error('needs_kakao_login')
  }

  return ensureFreshKakaoAccessToken(serviceClient, tokenRow, options)
}

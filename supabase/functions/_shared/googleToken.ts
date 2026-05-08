const GOOGLE_RECONNECT_REQUIRED = 'GOOGLE_RECONNECT_REQUIRED'

export class GoogleTokenError extends Error {
  errorCode: string

  constructor(message: string, errorCode = 'GOOGLE_TOKEN_ERROR') {
    super(message)
    this.name = 'GoogleTokenError'
    this.errorCode = errorCode
  }
}

export function getGoogleErrorCode(error: unknown): string {
  if (error instanceof GoogleTokenError) return error.errorCode
  if (error instanceof Error && 'errorCode' in error && typeof error.errorCode === 'string') {
    return error.errorCode
  }
  return 'GOOGLE_SYNC_ERROR'
}

export function getGoogleErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

export async function getOrRefreshToken(supabase: any, userId: string): Promise<string> {
  const { data, error } = await supabase
    .from('google_calendar_tokens')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error || !data) {
    throw new GoogleTokenError('Google Calendar not connected', GOOGLE_RECONNECT_REQUIRED)
  }

  const now = new Date()
  const expiresAt = new Date(data.expires_at)

  // Buffer of 5 minutes
  if (expiresAt.getTime() - now.getTime() > 5 * 60 * 1000) {
    return data.access_token
  }

  if (!data.refresh_token) {
    throw new GoogleTokenError('No refresh token available. Please reconnect.', GOOGLE_RECONNECT_REQUIRED)
  }

  // Refresh token
  const clientId = Deno.env.get('GOOGLE_CLIENT_ID')
  const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET')

  if (!clientId || !clientSecret) {
    throw new GoogleTokenError('Google OAuth credentials are not configured', 'GOOGLE_OAUTH_CONFIG_ERROR')
  }

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: data.refresh_token,
      grant_type: 'refresh_token',
    }),
  })

  const tokens = await response.json()
  if (!response.ok || tokens.error) {
    const errorMessage = tokens.error_description || tokens.error || 'Failed to refresh token'
    const errorCode = tokens.error === 'invalid_grant'
      ? GOOGLE_RECONNECT_REQUIRED
      : 'GOOGLE_TOKEN_REFRESH_FAILED'
    throw new GoogleTokenError(`Failed to refresh token: ${errorMessage}`, errorCode)
  }

  const newAccessToken = tokens.access_token
  const newExpiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString()

  await supabase
    .from('google_calendar_tokens')
    .update({
      access_token: newAccessToken,
      expires_at: newExpiresAt,
    })
    .eq('user_id', userId)

  return newAccessToken
}

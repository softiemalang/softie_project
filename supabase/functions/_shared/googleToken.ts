export async function getOrRefreshToken(supabase: any, userId: string): Promise<string> {
  const { data, error } = await supabase
    .from('google_calendar_tokens')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error || !data) {
    throw new Error('Google Calendar not connected')
  }

  const now = new Date()
  const expiresAt = new Date(data.expires_at)

  // Buffer of 5 minutes
  if (expiresAt.getTime() - now.getTime() > 5 * 60 * 1000) {
    return data.access_token
  }

  if (!data.refresh_token) {
    throw new Error('No refresh token available. Please reconnect.')
  }

  // Refresh token
  const clientId = Deno.env.get('GOOGLE_CLIENT_ID')
  const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET')

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId!,
      client_secret: clientSecret!,
      refresh_token: data.refresh_token,
      grant_type: 'refresh_token',
    }),
  })

  const tokens = await response.json()
  if (tokens.error) {
    throw new Error(`Failed to refresh token: ${tokens.error_description || tokens.error}`)
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

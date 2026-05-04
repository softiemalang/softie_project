import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { normalizeSpotifyReturnPath } from '../_shared/spotifyOAuth.ts'

function getFrontendBaseUrl() {
  return (
    Deno.env.get('FRONTEND_URL') ||
    Deno.env.get('FRONTEND_ORIGIN') ||
    Deno.env.get('SITE_URL') ||
    'http://localhost:5173'
  )
}

function createTokenExchangeHeaders(clientId: string, clientSecret: string) {
  return {
    Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
    'Content-Type': 'application/x-www-form-urlencoded',
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const code = url.searchParams.get('code')
    const state = url.searchParams.get('state')

    if (!code || !state) {
      throw new Error('Missing code or state')
    }

    const clientId = Deno.env.get('SPOTIFY_CLIENT_ID')
    const clientSecret = Deno.env.get('SPOTIFY_CLIENT_SECRET')
    const redirectUri = Deno.env.get('SPOTIFY_REDIRECT_URI')

    if (!clientId || !clientSecret || !redirectUri) {
      throw new Error('Spotify OAuth is not configured')
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data: oauthState, error: stateError } = await supabase
      .from('spotify_oauth_states')
      .select('state_token, user_id, return_path, expires_at, used_at')
      .eq('state_token', state)
      .maybeSingle()

    if (stateError) throw stateError
    if (!oauthState) throw new Error('Invalid Spotify OAuth state')
    if (oauthState.used_at) throw new Error('Spotify OAuth state has already been used')
    if (new Date(oauthState.expires_at).getTime() <= Date.now()) {
      throw new Error('Spotify OAuth state has expired')
    }

    const { data: claimedStates, error: claimError } = await supabase
      .from('spotify_oauth_states')
      .update({ used_at: new Date().toISOString() })
      .eq('state_token', state)
      .is('used_at', null)
      .select('user_id, return_path')

    if (claimError) throw claimError
    if (!claimedStates?.length) {
      throw new Error('Spotify OAuth state is no longer valid')
    }

    const claimedState = claimedStates[0]
    const userId = claimedState.user_id
    const targetPath = normalizeSpotifyReturnPath(claimedState.return_path)

    const { data: existingTokenRow } = await supabase
      .from('spotify_tokens')
      .select('refresh_token')
      .eq('user_id', userId)
      .maybeSingle()

    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: createTokenExchangeHeaders(clientId, clientSecret),
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      }),
    })

    const tokens = await tokenResponse.json()
    if (!tokenResponse.ok || tokens.error) {
      throw new Error(tokens.error_description || tokens.error || 'Spotify token exchange failed')
    }

    const refreshToken = tokens.refresh_token || existingTokenRow?.refresh_token
    if (!refreshToken) {
      throw new Error('Spotify refresh token is missing')
    }

    const { error: upsertError } = await supabase
      .from('spotify_tokens')
      .upsert(
        {
          user_id: userId,
          access_token: tokens.access_token,
          refresh_token: refreshToken,
          expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
          scope: tokens.scope || null,
          token_type: tokens.token_type || null,
        },
        { onConflict: 'user_id' }
      )

    if (upsertError) throw upsertError

    const frontendUrl = new URL(getFrontendBaseUrl())
    frontendUrl.pathname = targetPath
    frontendUrl.searchParams.set('spotify_connected', 'true')

    return Response.redirect(frontendUrl.toString(), 303)
  } catch (error) {
    console.error('[spotify-oauth-callback]', error)

    try {
      const frontendUrl = new URL(getFrontendBaseUrl())
      frontendUrl.pathname = '/music'
      frontendUrl.searchParams.set('spotify_error', error.message || 'spotify_oauth_failed')
      return Response.redirect(frontendUrl.toString(), 303)
    } catch {
      return new Response(JSON.stringify({ error: error.message || 'Spotify OAuth callback failed' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
  }
})

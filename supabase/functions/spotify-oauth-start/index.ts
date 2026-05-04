import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { createSpotifyOauthStateToken, normalizeSpotifyReturnPath } from '../_shared/spotifyOAuth.ts'

const SPOTIFY_SCOPES = [
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-read-currently-playing',
  'playlist-read-private',
  'playlist-read-collaborative',
  'user-library-read',
  'user-library-modify',
].join(' ')

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const { userId, returnPath } = await req.json()

    if (typeof userId !== 'string' || !userId.trim()) {
      throw new Error('Missing userId')
    }

    const normalizedUserId = userId.trim()
    const normalizedReturnPath = normalizeSpotifyReturnPath(returnPath)
    const clientId = Deno.env.get('SPOTIFY_CLIENT_ID')
    const redirectUri = Deno.env.get('SPOTIFY_REDIRECT_URI')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')

    if (!clientId || !redirectUri) {
      throw new Error('Spotify OAuth is not configured')
    }

    const authHeader = req.headers.get('Authorization')
    const bearerToken = authHeader?.replace(/^Bearer\s+/i, '').trim()

    if (bearerToken && anonKey && bearerToken !== anonKey) {
      const authClient = createClient(supabaseUrl, anonKey, {
        global: {
          headers: { Authorization: `Bearer ${bearerToken}` },
        },
      })
      const {
        data: { user },
        error: authError,
      } = await authClient.auth.getUser()

      if (authError || !user) {
        throw new Error('Invalid auth session for Spotify OAuth')
      }

      if (user.id !== normalizedUserId) {
        throw new Error('Authenticated user does not match Spotify OAuth target')
      }
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey)
    const stateToken = createSpotifyOauthStateToken()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()

    const { error: insertError } = await supabase
      .from('spotify_oauth_states')
      .insert({
        state_token: stateToken,
        user_id: normalizedUserId,
        return_path: normalizedReturnPath,
        expires_at: expiresAt,
      })

    if (insertError) throw insertError

    const authUrl = new URL('https://accounts.spotify.com/authorize')
    authUrl.searchParams.set('client_id', clientId)
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('redirect_uri', redirectUri)
    authUrl.searchParams.set('scope', SPOTIFY_SCOPES)
    authUrl.searchParams.set('state', stateToken)
    authUrl.searchParams.set('show_dialog', 'false')

    return new Response(JSON.stringify({ authUrl: authUrl.toString() }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('[spotify-oauth-start]', error)
    return new Response(JSON.stringify({ error: error.message || 'Failed to start Spotify OAuth' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

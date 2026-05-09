import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import {
  normalizeGoogleReturnOrigin,
  normalizeGoogleReturnPath,
} from '../_shared/googleOAuth.ts'

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

    const clientId = Deno.env.get('GOOGLE_CLIENT_ID')
    const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET')
    const redirectUri = Deno.env.get('GOOGLE_REDIRECT_URI')
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data: oauthState, error: stateError } = await supabase
      .from('google_oauth_states')
      .select('state_token, user_id, return_path, return_origin, expires_at, used_at')
      .eq('state_token', state)
      .maybeSingle()

    if (stateError) throw stateError
    if (!oauthState) {
      throw new Error('Invalid OAuth state')
    }

    if (oauthState.used_at) {
      throw new Error('OAuth state has already been used')
    }

    if (new Date(oauthState.expires_at).getTime() <= Date.now()) {
      throw new Error('OAuth state has expired')
    }

    const { data: claimedStates, error: claimError } = await supabase
      .from('google_oauth_states')
      .update({ used_at: new Date().toISOString() })
      .eq('state_token', state)
      .is('used_at', null)
      .select('user_id, return_path, return_origin')

    if (claimError) throw claimError
    if (!claimedStates?.length) {
      throw new Error('OAuth state is no longer valid')
    }

    const claimedState = claimedStates[0]
    const userId = claimedState.user_id
    const targetPath = normalizeGoogleReturnPath(claimedState.return_path)
    const targetOrigin = normalizeGoogleReturnOrigin(claimedState.return_origin)

    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId!,
        client_secret: clientSecret!,
        redirect_uri: redirectUri!,
        grant_type: 'authorization_code',
      }),
    })

    const tokens = await tokenResponse.json()
    if (tokens.error) {
      throw new Error(`Token exchange failed: ${tokens.error_description || tokens.error}`)
    }

    // Store tokens
    const { error: upsertError } = await supabase
      .from('google_calendar_tokens')
      .upsert({
        user_id: userId,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token, // Only sent on first consent
        expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
        scope: tokens.scope,
      }, { onConflict: 'user_id' })

    if (upsertError) throw upsertError

    // Redirect back to the origin that started OAuth when it is allowlisted.
    // Fall back to FRONTEND_URL/SITE_URL for older OAuth states.
    const siteUrl = targetOrigin || Deno.env.get('FRONTEND_URL') || Deno.env.get('SITE_URL') || 'http://localhost:5173'
    const frontendUrl = new URL(siteUrl)
    frontendUrl.pathname = targetPath
    frontendUrl.searchParams.set('google_connected', 'true')

    return Response.redirect(frontendUrl.toString(), 303)
  } catch (error) {
    console.error('[google-oauth-callback]', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

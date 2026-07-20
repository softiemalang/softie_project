import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import {
  createGoogleOauthStateToken,
  normalizeGoogleReturnOrigin,
  normalizeGoogleReturnPath,
} from '../_shared/googleOAuth.ts'
import { AuthError, authErrorResponse, requireGoogleManualUser } from '../_shared/googleManualAuth.ts'

const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/spreadsheets',
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
    const { userId, returnPath, returnOrigin } = await req.json()

    if (typeof userId !== 'string' || !userId.trim()) {
      throw new Error('Missing userId')
    }

    const normalizedUserId = await requireGoogleManualUser(req, userId.trim())
    const normalizedReturnPath = normalizeGoogleReturnPath(returnPath)
    const normalizedReturnOrigin = normalizeGoogleReturnOrigin(returnOrigin)
    const clientId = Deno.env.get('GOOGLE_CLIENT_ID')
    const redirectUri = Deno.env.get('GOOGLE_REDIRECT_URI')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!clientId || !redirectUri || !supabaseUrl || !serviceRoleKey) {
      throw new Error('Google OAuth is not configured')
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey)

    const stateToken = createGoogleOauthStateToken()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()

    const { error: insertError } = await supabase
      .from('google_oauth_states')
      .insert({
        state_token: stateToken,
        user_id: normalizedUserId,
        return_path: normalizedReturnPath,
        return_origin: normalizedReturnOrigin,
        expires_at: expiresAt,
      })

    if (insertError) throw insertError

    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
    authUrl.searchParams.set('client_id', clientId)
    authUrl.searchParams.set('redirect_uri', redirectUri)
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('scope', GOOGLE_SCOPES)
    authUrl.searchParams.set('access_type', 'offline')
    authUrl.searchParams.set('include_granted_scopes', 'true')
    authUrl.searchParams.set('prompt', 'consent')
    authUrl.searchParams.set('state', stateToken)

    return new Response(JSON.stringify({ authUrl: authUrl.toString() }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    if (error instanceof AuthError) {
      return authErrorResponse(error, corsHeaders)
    }
    console.error('[google-oauth-start]', error)
    return new Response(JSON.stringify({ error: error.message || 'Failed to start Google OAuth' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

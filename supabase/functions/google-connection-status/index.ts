import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { isDisconnectedGoogleTokenError } from '../_shared/googleConnectionStatus.js'
import { getOrRefreshToken } from '../_shared/googleToken.ts'
import { AuthError, authErrorResponse, requireGoogleManualUser } from '../_shared/googleManualAuth.ts'

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  try {
    const payload = await req.json().catch(() => ({}))
    const userId = await requireGoogleManualUser(req, payload?.userId)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Missing Supabase credentials')
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey)

    try {
      await getOrRefreshToken(supabase, userId)
      return jsonResponse({ connected: true })
    } catch (error) {
      if (isDisconnectedGoogleTokenError(error)) {
        return jsonResponse({ connected: false, reason: 'reconnect_required' })
      }
      throw error
    }
  } catch (error) {
    if (error instanceof AuthError) {
      return authErrorResponse(error, corsHeaders)
    }

    console.error('[google-connection-status]', error)
    return jsonResponse({ error: 'Google 연결 상태를 확인하지 못했습니다.' }, 503)
  }
})

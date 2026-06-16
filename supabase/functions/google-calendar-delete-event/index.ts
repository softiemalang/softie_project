import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { getOrRefreshToken } from '../_shared/googleToken.ts'
import { AuthError, authErrorResponse, requireGoogleManualUser } from '../_shared/googleManualAuth.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { userId: bodyUserId, rehearsalId, reservationId, googleEventId: bodyGoogleEventId } = await req.json()
    const userId = await requireGoogleManualUser(req, bodyUserId)

    if (!rehearsalId && !reservationId) {
      throw new Error('Missing rehearsalId or reservationId')
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Lookup the rehearsal or reservation to get the google_calendar_event_id
    let googleEventId: string | null = bodyGoogleEventId || null

    if (!googleEventId) {
      if (rehearsalId) {
        const { data, error } = await supabase
          .from('rehearsal_events')
          .select('google_calendar_event_id')
          .eq('id', rehearsalId)
          .eq('owner_key', userId)
          .single()
        if (error) throw new Error(`DB Error: ${error.message}`)
        googleEventId = data?.google_calendar_event_id
      } else if (reservationId) {
        const { data, error } = await supabase
          .from('reservations')
          .select('google_event_id')
          .eq('id', reservationId)
          .eq('owner_key', userId)
          .single()
        if (error) throw new Error(`DB Error: ${error.message}`)
        googleEventId = data?.google_event_id
      }
    }

    // If no googleEventId, we consider it "already deleted" or "not synced"
    if (!googleEventId) {
      if (reservationId) {
        throw new Error(`Google Calendar Event ID not found for reservation ${reservationId}`)
      }
      return new Response(JSON.stringify({ success: true, message: 'No linked event found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const accessToken = await getOrRefreshToken(supabase, userId)

    // Delete event in Google Calendar
    const googleResponse = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${googleEventId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    })

    // 204 No Content is success for DELETE
    if (googleResponse.status === 204) {
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 404 Not Found is also treated as success for sync purposes
    if (googleResponse.status === 404) {
      return new Response(JSON.stringify({ success: true, message: 'Event already deleted in Google Calendar' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Other errors
    const result = await googleResponse.json().catch(() => ({ error: { message: `HTTP ${googleResponse.status}` } }))
    if (result.error) {
      throw new Error(`Google Calendar API error: ${result.error.message}`)
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    if (error instanceof AuthError) {
      return authErrorResponse(error, corsHeaders)
    }
    console.error('[google-calendar-delete-event]', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

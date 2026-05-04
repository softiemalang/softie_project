import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { getOrRefreshToken } from '../_shared/googleToken.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { userId, rehearsalId } = await req.json()

    if (!userId || !rehearsalId) {
      throw new Error('Missing userId or rehearsalId')
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Lookup the rehearsal to get the google_calendar_event_id
    const { data: rehData, error: rehError } = await supabase
      .from('rehearsal_events')
      .select('google_calendar_event_id')
      .eq('id', rehearsalId)
      .single()

    if (rehError) {
      throw new Error(`DB Error: ${rehError.message}`)
    }

    // If no google_calendar_event_id, we consider it "already deleted" or "not synced"
    if (!rehData?.google_calendar_event_id) {
      return new Response(JSON.stringify({ success: true, message: 'No linked event found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const googleEventId = rehData.google_calendar_event_id
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
    console.error('[google-calendar-delete-event]', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

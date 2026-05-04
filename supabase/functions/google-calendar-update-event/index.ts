import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { getOrRefreshToken } from '../_shared/googleToken.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { userId, eventData } = await req.json()

    if (!userId || !eventData || !eventData.rehearsalId) {
      throw new Error('Missing userId, eventData, or rehearsalId')
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Lookup the rehearsal to get the google_calendar_event_id
    const { data: rehData, error: rehError } = await supabase
      .from('rehearsal_events')
      .select('google_calendar_event_id')
      .eq('id', eventData.rehearsalId)
      .single()

    if (rehError || !rehData?.google_calendar_event_id) {
      throw new Error('No linked Google Calendar event found for this rehearsal')
    }

    const googleEventId = rehData.google_calendar_event_id
    const accessToken = await getOrRefreshToken(supabase, userId)

    // Update event in Google Calendar using PATCH
    const googleResponse = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${googleEventId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        summary: eventData.summary,
        location: eventData.location,
        description: eventData.description,
        start: {
          dateTime: eventData.startAt,
          timeZone: 'Asia/Seoul',
        },
        end: {
          dateTime: eventData.endAt,
          timeZone: 'Asia/Seoul',
        },
      }),
    })

    const result = await googleResponse.json()
    if (result.error) {
      throw new Error(`Google Calendar API error: ${result.error.message}`)
    }

    // Update sync timestamp in Supabase
    await supabase
      .from('rehearsal_events')
      .update({ 
        google_calendar_sync_status: 'synced',
        google_calendar_synced_at: new Date().toISOString()
      })
      .eq('id', eventData.rehearsalId)

    return new Response(JSON.stringify({ success: true, event: result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('[google-calendar-update-event]', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

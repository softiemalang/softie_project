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

    if (!userId || !eventData) {
      throw new Error('Missing userId or eventData')
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Check duplicate if reservationId is provided
    if (eventData.reservationId) {
      const { data: resData, error: resError } = await supabase
        .from('reservations')
        .select('google_event_id')
        .eq('id', eventData.reservationId)
        .single()

      if (!resError && resData?.google_event_id) {
        // Already created, return success to prevent duplicate
        return new Response(JSON.stringify({ success: true, event: { id: resData.google_event_id }, message: 'Already exists' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    } else if (eventData.rehearsalId) {
      const { data: rehData, error: rehError } = await supabase
        .from('rehearsal_events')
        .select('google_calendar_event_id')
        .eq('id', eventData.rehearsalId)
        .single()

      if (!rehError && rehData?.google_calendar_event_id) {
        return new Response(JSON.stringify({ success: true, event: { id: rehData.google_calendar_event_id }, message: 'Already exists' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    const accessToken = await getOrRefreshToken(supabase, userId)

    // Create event in Google Calendar
    const googleResponse = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
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

    // Save google_event_id if reservationId is provided
    if (eventData.reservationId) {
      await supabase
        .from('reservations')
        .update({ google_event_id: result.id })
        .eq('id', eventData.reservationId)
    } else if (eventData.rehearsalId) {
      await supabase
        .from('rehearsal_events')
        .update({ 
          google_calendar_event_id: result.id,
          google_calendar_sync_status: 'synced',
          google_calendar_synced_at: new Date().toISOString()
        })
        .eq('id', eventData.rehearsalId)
    }

    return new Response(JSON.stringify({ success: true, event: result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('[google-calendar-create-event]', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

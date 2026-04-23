import { corsHeaders } from '../_shared/cors.ts'
import {
  createServiceRoleClient,
  describePushError,
  SCHEDULER_NOTIFICATION_TYPES,
} from '../_shared/push.ts'

Deno.serve(async (request) => {
  let failedStep = 'request'

  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    failedStep = 'parse_request'
    const { deviceId } = await request.json()

    if (!deviceId || typeof deviceId !== 'string') {
      throw new Error('deviceId가 필요합니다.')
    }

    failedStep = 'create_service_client'
    const supabase = createServiceRoleClient()

    failedStep = 'lookup_subscription'
    const { data, error } = await supabase
      .from('push_subscriptions')
      .select('notifications_enabled, notification_types, work_time_enabled, work_time_start_hour, work_time_end_hour')
      .eq('device_id', deviceId)
      .eq('active', true)
      .order('last_seen_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) throw error

    return new Response(JSON.stringify({
      notificationsEnabled: data?.notifications_enabled ?? true,
      notificationTypes: data?.notification_types ?? SCHEDULER_NOTIFICATION_TYPES,
      workTimeEnabled: data?.work_time_enabled ?? false,
      workTimeStartHour: data?.work_time_start_hour ?? null,
      workTimeEndHour: data?.work_time_end_hour ?? null,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    const { message, details } = describePushError(error)

    console.error('get-push-preferences failed', {
      step: failedStep,
      message,
      details,
    })

    return new Response(JSON.stringify({
      error: message,
      step: failedStep,
      details,
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

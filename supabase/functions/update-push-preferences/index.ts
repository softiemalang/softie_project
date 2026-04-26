import { corsHeaders } from '../_shared/cors.ts'
import {
  createServiceRoleClient,
  describePushError,
  validatePushPreferencePayload,
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
    const {
      deviceId,
      notificationsEnabled,
      notificationTypes,
      workTimeEnabled,
      workTimeStartHour,
      workTimeEndHour,
      selectedDate,
    } = await request.json()

    if (!deviceId || typeof deviceId !== 'string') {
      throw new Error('deviceId가 필요합니다.')
    }

    failedStep = 'validate_preferences'
    const validated = validatePushPreferencePayload(
      notificationsEnabled,
      notificationTypes,
      workTimeEnabled,
      workTimeStartHour,
      workTimeEndHour,
      selectedDate,
    )

    failedStep = 'create_service_client'
    const supabase = createServiceRoleClient()

    failedStep = 'update_preferences'
    const { data, error } = await supabase
      .from('push_subscriptions')
      .update({
        notifications_enabled: validated.notificationsEnabled,
        notification_types: validated.notificationTypes,
        work_time_enabled: validated.workTimeEnabled,
        work_time_start_hour: validated.workTimeStartHour,
        work_time_end_hour: validated.workTimeEndHour,
        work_time_selected_date: validated.selectedDate,
      })
      .eq('device_id', deviceId)
      .eq('active', true)
      .select('id')

    if (error) throw error
    if (!data?.length) {
      return new Response(JSON.stringify({ 
        error: `활성 구독을 찾지 못했어요. (deviceId: ${deviceId})` 
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({
      ok: true,
      notificationsEnabled: validated.notificationsEnabled,
      notificationTypes: validated.notificationTypes,
      workTimeEnabled: validated.workTimeEnabled,
      workTimeStartHour: validated.workTimeStartHour,
      workTimeEndHour: validated.workTimeEndHour,
      selectedDate: validated.selectedDate,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    const { message, details } = describePushError(error)

    console.error('update-push-preferences failed', {
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

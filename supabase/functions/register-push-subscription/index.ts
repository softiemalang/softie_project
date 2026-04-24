import { corsHeaders } from '../_shared/cors.ts'
import {
  createServiceRoleClient,
  describePushError,
  hashEndpoint,
  SCHEDULER_NOTIFICATION_TYPES,
  validatePushSubscriptionPayload,
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
    const { deviceId, subscription, userAgent = '', platform = '' } = await request.json()

    failedStep = 'validate_device_id'
    if (!deviceId || typeof deviceId !== 'string') {
      throw new Error('deviceId가 필요합니다.')
    }

    failedStep = 'validate_subscription'
    const validatedSubscription = validatePushSubscriptionPayload(subscription)

    failedStep = 'create_service_client'
    const supabase = createServiceRoleClient()

    failedStep = 'load_existing_preferences'
    const { data: existingPreferences, error: existingPreferencesError } = await supabase
      .from('push_subscriptions')
      .select('notifications_enabled, notification_types, work_time_enabled, work_time_start_hour, work_time_end_hour, work_time_selected_date')
      .eq('device_id', deviceId)
      .order('last_seen_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (existingPreferencesError) throw existingPreferencesError

    failedStep = 'hash_endpoint'
    const endpointHash = await hashEndpoint(validatedSubscription.endpoint)
    const now = new Date().toISOString()

    failedStep = 'deactivate_previous_subscriptions'
    const { error: deactivateError } = await supabase
      .from('push_subscriptions')
      .update({ active: false, updated_at: now })
      .eq('device_id', deviceId)
      .neq('endpoint_hash', endpointHash)
      .eq('active', true)

    if (deactivateError) throw deactivateError

    failedStep = 'upsert_subscription'
    const { data, error } = await supabase
      .from('push_subscriptions')
      .upsert(
        {
          device_id: deviceId,
          endpoint: validatedSubscription.endpoint,
          endpoint_hash: endpointHash,
          subscription: validatedSubscription,
          user_agent: userAgent,
          platform,
          notifications_enabled: existingPreferences?.notifications_enabled ?? true,
          notification_types: existingPreferences?.notification_types ?? SCHEDULER_NOTIFICATION_TYPES,
          work_time_enabled: existingPreferences?.work_time_enabled ?? false,
          work_time_start_hour: existingPreferences?.work_time_start_hour ?? null,
          work_time_end_hour: existingPreferences?.work_time_end_hour ?? null,
          work_time_selected_date: existingPreferences?.work_time_selected_date ?? null,
          active: true,
          last_seen_at: now,
        },
        { onConflict: 'endpoint_hash' },
      )
      .select('id, device_id, active')
      .single()

    if (error) throw error

    return new Response(JSON.stringify({ ok: true, subscriptionId: data.id, deviceId: data.device_id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    const { message, details } = describePushError(error)

    console.error('register-push-subscription failed', {
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

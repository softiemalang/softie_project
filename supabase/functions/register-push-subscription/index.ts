import { corsHeaders } from '../_shared/cors.ts'
import { createServiceRoleClient, hashEndpoint } from '../_shared/push.ts'

Deno.serve(async (request) => {
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
    const { deviceId, subscription, userAgent = '', platform = '' } = await request.json()

    if (!deviceId || typeof deviceId !== 'string') {
      throw new Error('deviceId가 필요합니다.')
    }

    if (!subscription || typeof subscription !== 'object' || typeof subscription.endpoint !== 'string') {
      throw new Error('유효한 subscription payload가 필요합니다.')
    }

    const supabase = createServiceRoleClient()
    const endpointHash = await hashEndpoint(subscription.endpoint)
    const now = new Date().toISOString()

    const { error: deactivateError } = await supabase
      .from('push_subscriptions')
      .update({ active: false, updated_at: now })
      .eq('device_id', deviceId)
      .neq('endpoint_hash', endpointHash)
      .eq('active', true)

    if (deactivateError) throw deactivateError

    const { data, error } = await supabase
      .from('push_subscriptions')
      .upsert(
        {
          device_id: deviceId,
          endpoint: subscription.endpoint,
          endpoint_hash: endpointHash,
          subscription,
          user_agent: userAgent,
          platform,
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
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

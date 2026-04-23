import { corsHeaders } from '../_shared/cors.ts'
import { buildPushPayload, createServiceRoleClient, describePushError, sendWebPush } from '../_shared/push.ts'

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
      .select('id, device_id, endpoint_hash, subscription')
      .eq('device_id', deviceId)
      .eq('active', true)
      .order('last_seen_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) throw error
    if (!data) {
      return new Response(JSON.stringify({ error: '활성 구독을 찾지 못했어요.' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const payload = buildPushPayload({
      type: 'test',
      title: '스케줄러 테스트 알림',
      body: '이 브라우저에서 웹 푸시를 받을 수 있어요.',
      url: '/scheduler',
      tag: 'scheduler-test',
    })

    try {
      failedStep = 'send_web_push'
      await sendWebPush(data.subscription as Record<string, unknown>, payload)
    } catch (error) {
      const statusCode = error && typeof error === 'object' ? Reflect.get(error, 'statusCode') : undefined
      if (statusCode === 404 || statusCode === 410) {
        await supabase
          .from('push_subscriptions')
          .update({
            active: false,
            last_error_at: new Date().toISOString(),
            last_error_message: 'Subscription expired',
          })
          .eq('id', data.id)
      }

      throw error
    }

    const now = new Date().toISOString()
    failedStep = 'mark_test_sent'
    const { error: updateError } = await supabase
      .from('push_subscriptions')
      .update({
        last_test_sent_at: now,
        last_error_at: null,
        last_error_message: null,
      })
      .eq('id', data.id)

    if (updateError) throw updateError

    return new Response(JSON.stringify({ ok: true, sent: 1 }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    const { message, details: describedDetails } = describePushError(error)
    const statusCode = error && typeof error === 'object' ? Reflect.get(error, 'statusCode') : null
    const body = error && typeof error === 'object' ? Reflect.get(error, 'body') : null
    const bodyDetails =
      typeof body === 'string'
        ? body
        : body && typeof body === 'object'
          ? JSON.stringify(body)
          : null
    const details = describedDetails || bodyDetails

    console.error('send-test-push failed', {
      step: failedStep,
      message,
      statusCode,
      details,
    })

    return new Response(JSON.stringify({
      error: message,
      step: failedStep,
      statusCode,
      details,
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import {
  createServiceClient,
  getFreshKakaoAccessTokenForUser,
  getRequiredEnv,
} from '../_shared/kakaoToken.ts'

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  })
}

function getBearerToken(req: Request) {
  const authorization = req.headers.get('authorization') || ''
  const match = authorization.match(/^Bearer\s+(.+)$/i)
  return match?.[1]?.trim() || ''
}

async function getSupabaseUser(req: Request) {
  const token = getBearerToken(req)
  if (!token) throw new Error('missing_authorization')

  const authClient = createClient(
    getRequiredEnv('SUPABASE_URL'),
    getRequiredEnv('SUPABASE_ANON_KEY'),
  )

  const { data, error } = await authClient.auth.getUser(token)
  if (error || !data.user) throw new Error('invalid_authorization')
  return data.user
}

function normalizeText(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function readKakaoEventId(result: Record<string, unknown>) {
  const nestedEvent = result.event && typeof result.event === 'object'
    ? result.event as Record<string, unknown>
    : null

  return normalizeText(result.event_id) ||
    normalizeText(result.id) ||
    normalizeText(nestedEvent?.id)
}

function normalizeTime(value: unknown) {
  const text = normalizeText(value)
  const match = text.match(/^(\d{2}):(\d{2})/)
  if (!match) return ''
  return `${match[1]}:${match[2]}`
}

function buildDescription(payload: Record<string, unknown>) {
  const location = normalizeText(payload.location) || '미정'
  const startTime = normalizeTime(payload.startTime)
  const endTime = normalizeTime(payload.endTime)
  const travelMinutes = Number(payload.travelMinutes) || 0
  const memo = normalizeText(payload.description)

  return [
    `장소: ${location}`,
    `시간: ${startTime}-${endTime}`,
    `이동 시간: ${travelMinutes > 0 ? `${travelMinutes}분` : '없음'}`,
    '',
    '메모:',
    memo,
  ].join('\n')
}

function buildKakaoEvent(payload: Record<string, unknown>) {
  const title = normalizeText(payload.title)
  const eventDate = normalizeText(payload.eventDate)
  const startTime = normalizeTime(payload.startTime)
  const endTime = normalizeTime(payload.endTime)
  const location = normalizeText(payload.location) || '미정'

  if (!title || !eventDate || !startTime || !endTime) {
    throw new Error('missing_required_fields')
  }

  return {
    title,
    time: {
      start_at: `${eventDate}T${startTime}:00+09:00`,
      end_at: `${eventDate}T${endTime}:00+09:00`,
      time_zone: 'Asia/Seoul',
      all_day: false,
    },
    description: buildDescription(payload),
    location: { name: location },
    reminders: [15],
    color: 'GREEN',
  }
}

async function createKakaoCalendarEvent(accessToken: string, event: Record<string, unknown>) {
  const body = new URLSearchParams()
  body.set('event', JSON.stringify(event))

  const response = await fetch('https://kapi.kakao.com/v2/api/calendar/create/event', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
    },
    body,
  })

  const result = await response.json().catch(() => null)
  if (!response.ok) {
    console.error('[kakao-calendar-create-event] Kakao API failed', {
      status: response.status,
      code: result?.code,
      msg: result?.msg,
    })
    throw new Error(response.status === 401 ? 'kakao_token_expired' : 'kakao_calendar_create_failed')
  }

  return result || {}
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'method_not_allowed' }, 405)
  }

  try {
    const user = await getSupabaseUser(req)
    const payload = await req.json().catch(() => null)
    if (!payload || typeof payload !== 'object') {
      return jsonResponse({ error: 'invalid_payload' }, 400)
    }

    const requestedUserId = normalizeText(payload.userId)
    if (requestedUserId && requestedUserId !== user.id) {
      return jsonResponse({ error: 'user_mismatch' }, 403)
    }

    const rehearsalId = normalizeText(payload.rehearsalId)
    const ownerKey = normalizeText(payload.ownerKey) || user.id
    const serviceClient = createServiceClient()

    if (rehearsalId) {
      const { data: existing, error: existingError } = await serviceClient
        .from('rehearsal_events')
        .select('id, owner_key, kakao_calendar_event_id')
        .eq('id', rehearsalId)
        .maybeSingle()

      if (existingError) throw existingError
      if (!existing) return jsonResponse({ error: 'rehearsal_not_found' }, 404)
      if (existing.owner_key !== ownerKey && existing.owner_key !== user.id) {
        return jsonResponse({ error: 'rehearsal_owner_mismatch' }, 403)
      }
      if (existing.kakao_calendar_event_id) {
        return jsonResponse({
          success: true,
          event: { id: existing.kakao_calendar_event_id },
          message: 'Already exists',
        })
      }
    }

    const event = buildKakaoEvent(payload as Record<string, unknown>)
    let accessToken = await getFreshKakaoAccessTokenForUser(serviceClient, user.id, {
      logPrefix: 'kakao-calendar-create-event',
    })

    let kakaoResult: Record<string, unknown>
    try {
      kakaoResult = await createKakaoCalendarEvent(accessToken, event)
    } catch (error) {
      if (error instanceof Error && error.message === 'kakao_token_expired') {
        accessToken = await getFreshKakaoAccessTokenForUser(serviceClient, user.id, {
          forceRefresh: true,
          logPrefix: 'kakao-calendar-create-event',
        })
        kakaoResult = await createKakaoCalendarEvent(accessToken, event)
      } else {
        throw error
      }
    }

    const kakaoEventId = readKakaoEventId(kakaoResult)

    if (rehearsalId && kakaoEventId) {
      const { error: updateError } = await serviceClient
        .from('rehearsal_events')
        .update({
          kakao_calendar_event_id: kakaoEventId,
          kakao_calendar_sync_status: 'synced',
          kakao_calendar_synced_at: new Date().toISOString(),
        })
        .eq('id', rehearsalId)

      if (updateError) throw updateError
    }

    return jsonResponse({
      success: true,
      event: {
        ...kakaoResult,
        id: kakaoEventId || null,
      },
    })
  } catch (error) {
    console.error('[kakao-calendar-create-event] unexpected error', error)
    const message = error instanceof Error ? error.message : 'unexpected_error'
    const status =
      message.includes('authorization') ? 401 :
      message === 'needs_kakao_login' ? 401 :
      message === 'missing_required_fields' ? 400 :
      message === 'kakao_calendar_create_failed' ? 502 :
      500
    return jsonResponse({ error: message }, status)
  }
})

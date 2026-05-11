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

async function deleteKakaoCalendarEvent(accessToken: string, kakaoCalendarEventId: string) {
  const url = new URL('https://kapi.kakao.com/v2/api/calendar/delete/event')
  url.searchParams.set('event_id', kakaoCalendarEventId)

  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  const result = await response.json().catch(() => null)
  if (response.status === 404) {
    return { alreadyDeleted: true }
  }
  if (!response.ok) {
    console.error('[kakao-calendar-delete-event] Kakao API failed', {
      status: response.status,
      code: result?.code,
      msg: result?.msg,
    })
    throw new Error(response.status === 401 ? 'kakao_token_expired' : 'kakao_calendar_delete_failed')
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
    if (!rehearsalId) return jsonResponse({ error: 'missing_rehearsal_id' }, 400)

    const ownerKey = normalizeText(payload.ownerKey) || user.id
    const serviceClient = createServiceClient()
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

    const kakaoCalendarEventId = normalizeText(payload.kakaoCalendarEventId) ||
      normalizeText(existing.kakao_calendar_event_id)
    if (!kakaoCalendarEventId) {
      return jsonResponse({ success: true, skipped: true, reason: 'missing_kakao_event_id' })
    }
    if (existing.kakao_calendar_event_id && existing.kakao_calendar_event_id !== kakaoCalendarEventId) {
      return jsonResponse({ error: 'kakao_event_mismatch' }, 403)
    }

    let accessToken = await getFreshKakaoAccessTokenForUser(serviceClient, user.id, {
      logPrefix: 'kakao-calendar-delete-event',
    })

    let kakaoResult: Record<string, unknown>
    try {
      kakaoResult = await deleteKakaoCalendarEvent(accessToken, kakaoCalendarEventId)
    } catch (error) {
      if (error instanceof Error && error.message === 'kakao_token_expired') {
        accessToken = await getFreshKakaoAccessTokenForUser(serviceClient, user.id, {
          forceRefresh: true,
          logPrefix: 'kakao-calendar-delete-event',
        })
        kakaoResult = await deleteKakaoCalendarEvent(accessToken, kakaoCalendarEventId)
      } else {
        throw error
      }
    }

    return jsonResponse({
      success: true,
      event: {
        ...kakaoResult,
        id: kakaoCalendarEventId,
      },
    })
  } catch (error) {
    console.error('[kakao-calendar-delete-event] unexpected error', error)
    const message = error instanceof Error ? error.message : 'unexpected_error'
    const status =
      message.includes('authorization') ? 401 :
      message === 'needs_kakao_login' ? 401 :
      message === 'kakao_calendar_delete_failed' ? 502 :
      500
    return jsonResponse({ error: message }, status)
  }
})

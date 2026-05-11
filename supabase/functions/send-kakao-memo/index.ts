import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import {
  createServiceClient,
  getFreshKakaoAccessTokenForUser,
  getRequiredEnv,
} from '../_shared/kakaoToken.ts'

const ALLOWED_ORIGINS = new Set([
  'https://softieproject.com',
  'https://project-fp5ie.vercel.app',
  'http://localhost:5173',
  'http://localhost:4173',
])

function corsHeaders(req: Request) {
  const origin = req.headers.get('origin') || ''
  const allowOrigin = ALLOWED_ORIGINS.has(origin) ? origin : 'https://softieproject.com'
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  }
}

function jsonResponse(req: Request, body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders(req),
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

async function sendKakaoMemo(accessToken: string, text: string, url: string) {
  const templateObject = {
    object_type: 'text',
    text: text.slice(0, 900),
    link: {
      web_url: url,
      mobile_web_url: url,
    },
    button_title: '자세히 보기',
  }

  const body = new URLSearchParams()
  body.set('template_object', JSON.stringify(templateObject))

  const response = await fetch('https://kapi.kakao.com/v2/api/talk/memo/default/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
    },
    body,
  })

  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    console.error('[send-kakao-memo] memo send failed', {
      status: response.status,
      code: payload?.code,
      msg: payload?.msg,
    })
    throw new Error(response.status === 401 ? 'kakao_token_expired' : 'kakao_memo_send_failed')
  }

  return payload
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(req) })
  }

  if (req.method !== 'POST') {
    return jsonResponse(req, { error: 'method_not_allowed' }, 405)
  }

  try {
    const user = await getSupabaseUser(req)
    const payload = await req.json().catch(() => null)
    const text = typeof payload?.text === 'string' ? payload.text.trim() : ''
    const url = typeof payload?.url === 'string' && payload.url.startsWith('http')
      ? payload.url
      : 'https://softieproject.com/scheduler'

    if (!text) {
      return jsonResponse(req, { error: 'empty_text' }, 400)
    }

    const serviceClient = createServiceClient()
    let accessToken = await getFreshKakaoAccessTokenForUser(serviceClient, user.id, {
      logPrefix: 'send-kakao-memo',
    })

    try {
      await sendKakaoMemo(accessToken, text, url)
    } catch (error) {
      if (error instanceof Error && error.message === 'kakao_token_expired') {
        accessToken = await getFreshKakaoAccessTokenForUser(serviceClient, user.id, {
          forceRefresh: true,
          logPrefix: 'send-kakao-memo',
        })
        await sendKakaoMemo(accessToken, text, url)
      } else {
        throw error
      }
    }

    return jsonResponse(req, { sent: true })
  } catch (error) {
    console.error('[send-kakao-memo] unexpected error', error)
    const message = error instanceof Error ? error.message : 'unexpected_error'
    const status = message.includes('authorization') || message === 'needs_kakao_login' ? 401 : 500
    return jsonResponse(req, { error: message }, status)
  }
})

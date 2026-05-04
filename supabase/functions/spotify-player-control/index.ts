import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

type SpotifyTokenRow = {
  user_id: string
  access_token: string
  refresh_token: string
  expires_at: string
  scope?: string | null
  token_type?: string | null
}

type SpotifyAction =
  | 'getPlaybackState'
  | 'getCurrentlyPlaying'
  | 'getDevices'
  | 'transferPlayback'
  | 'play'
  | 'pause'
  | 'next'
  | 'previous'
  | 'playPlaylist'
  | 'checkSavedTrack'
  | 'saveTrack'
  | 'removeTrack'
  | 'setVolume'

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function isTokenExpiringSoon(expiresAt: string) {
  return new Date(expiresAt).getTime() <= Date.now() + 60 * 1000
}

function getSpotifyClientAuthHeader() {
  const clientId = Deno.env.get('SPOTIFY_CLIENT_ID')
  const clientSecret = Deno.env.get('SPOTIFY_CLIENT_SECRET')

  if (!clientId || !clientSecret) {
    throw new Error('Spotify client credentials are not configured')
  }

  return {
    clientId,
    clientSecret,
    header: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
  }
}

async function validateBearerSession(req: Request, normalizedUserId: string) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  const authHeader = req.headers.get('Authorization')
  const bearerToken = authHeader?.replace(/^Bearer\s+/i, '').trim()

  if (!bearerToken || !anonKey || bearerToken === anonKey) {
    return
  }

  const authClient = createClient(supabaseUrl, anonKey, {
    global: {
      headers: { Authorization: `Bearer ${bearerToken}` },
    },
  })

  const {
    data: { user },
    error,
  } = await authClient.auth.getUser()

  if (error || !user) {
    throw new Error('Invalid auth session for Spotify control')
  }

  if (user.id !== normalizedUserId) {
    throw new Error('Authenticated user does not match Spotify control target')
  }
}

async function getSpotifyTokenRow(supabase: ReturnType<typeof createClient>, userId: string) {
  const { data, error } = await supabase
    .from('spotify_tokens')
    .select('user_id, access_token, refresh_token, expires_at, scope, token_type')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw error
  return data as SpotifyTokenRow | null
}

async function refreshSpotifyAccessToken(
  supabase: ReturnType<typeof createClient>,
  tokenRow: SpotifyTokenRow
) {
  const { header } = getSpotifyClientAuthHeader()

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: header,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: tokenRow.refresh_token,
    }),
  })

  const json = await response.json()
  if (!response.ok || json.error) {
    throw new Error(json.error_description || json.error || 'Failed to refresh Spotify token')
  }

  const nextTokenRow = {
    ...tokenRow,
    access_token: json.access_token,
    refresh_token: json.refresh_token || tokenRow.refresh_token,
    expires_at: new Date(Date.now() + json.expires_in * 1000).toISOString(),
    scope: json.scope || tokenRow.scope || null,
    token_type: json.token_type || tokenRow.token_type || null,
  }

  const { error: upsertError } = await supabase
    .from('spotify_tokens')
    .upsert(nextTokenRow, { onConflict: 'user_id' })

  if (upsertError) throw upsertError

  return nextTokenRow
}

async function ensureFreshSpotifyAccessToken(
  supabase: ReturnType<typeof createClient>,
  tokenRow: SpotifyTokenRow
) {
  if (!isTokenExpiringSoon(tokenRow.expires_at)) {
    return tokenRow
  }

  return refreshSpotifyAccessToken(supabase, tokenRow)
}

function buildSpotifyRequest(action: SpotifyAction, payload: Record<string, unknown>) {
  const endpoint = new URL('https://api.spotify.com/v1/me/player')
  let method = 'GET'
  let body: string | undefined

  switch (action) {
    case 'getPlaybackState':
      break
    case 'getCurrentlyPlaying':
      endpoint.pathname = '/v1/me/player/currently-playing'
      break
    case 'getDevices':
      endpoint.pathname = '/v1/me/player/devices'
      break
    case 'transferPlayback':
      method = 'PUT'
      body = JSON.stringify({
        device_ids: [payload.deviceId],
        play: false,
      })
      break
    case 'play':
      method = 'PUT'
      endpoint.pathname = '/v1/me/player/play'
      if (payload.deviceId) {
        endpoint.searchParams.set('device_id', String(payload.deviceId))
      }
      {
        const playBody: Record<string, unknown> = {}
        if (payload.contextUri) playBody.context_uri = payload.contextUri
        if (Array.isArray(payload.uris) && payload.uris.length) playBody.uris = payload.uris
        if (typeof payload.positionMs === 'number') playBody.position_ms = payload.positionMs
        body = Object.keys(playBody).length ? JSON.stringify(playBody) : undefined
      }
      break
    case 'pause':
      method = 'PUT'
      endpoint.pathname = '/v1/me/player/pause'
      break
    case 'next':
      method = 'POST'
      endpoint.pathname = '/v1/me/player/next'
      break
    case 'previous':
      method = 'POST'
      endpoint.pathname = '/v1/me/player/previous'
      break
    case 'playPlaylist':
      method = 'PUT'
      endpoint.pathname = '/v1/me/player/play'
      body = JSON.stringify({
        context_uri: payload.contextUri,
      })
      break
    case 'checkSavedTrack':
      if (!payload.trackId) throw new Error('Missing trackId for checkSavedTrack')
      method = 'GET'
      endpoint.pathname = '/v1/me/tracks/contains'
      endpoint.searchParams.set('ids', String(payload.trackId))
      break
    case 'saveTrack':
      if (!payload.trackId) throw new Error('Missing trackId for saveTrack')
      method = 'PUT'
      endpoint.pathname = '/v1/me/tracks'
      body = JSON.stringify({
        ids: [payload.trackId],
      })
      break
    case 'removeTrack':
      if (!payload.trackId) throw new Error('Missing trackId for removeTrack')
      method = 'DELETE'
      endpoint.pathname = '/v1/me/tracks'
      body = JSON.stringify({
        ids: [payload.trackId],
      })
      break
    case 'setVolume':
      if (typeof payload.volumePercent !== 'number') throw new Error('Missing or invalid volumePercent for setVolume')
      method = 'PUT'
      endpoint.pathname = '/v1/me/player/volume'
      endpoint.searchParams.set('volume_percent', String(Math.max(0, Math.min(100, payload.volumePercent))))
      if (payload.deviceId) {
        endpoint.searchParams.set('device_id', String(payload.deviceId))
      }
      break
    default:
      throw new Error('Unsupported Spotify action')
  }

  return { endpoint: endpoint.toString(), method, body }
}

async function parseSpotifyResponse(response: Response) {
  if (response.status === 204) {
    return null
  }

  const text = await response.text()
  if (!text) return null

  try {
    return JSON.parse(text)
  } catch {
    return { text }
  }
}

function normalizeSpotifyApiError(status: number, payload: any, action: SpotifyAction) {
  const message =
    payload?.error?.message ||
    payload?.message ||
    payload?.error_description ||
    'Spotify API request failed'

  if (status === 401) {
    return { code: 'SPOTIFY_TOKEN_EXPIRED', message }
  }

  if (status === 403) {
    return { code: 'PREMIUM_REQUIRED', message: 'Spotify Premium이 필요하거나 이 작업이 허용되지 않았어요.' }
  }

  if (status === 404) {
    return { code: 'NO_ACTIVE_DEVICE', message: '활성 Spotify 기기가 없어요. 앱이나 Connect 기기를 먼저 열어 주세요.' }
  }

  if (status === 429) {
    return { code: 'RATE_LIMITED', message: 'Spotify 요청이 잠시 많아요. 잠시 후 다시 시도해 주세요.' }
  }

  return { code: `SPOTIFY_${action.toUpperCase()}_FAILED`, message }
}

async function callSpotifyApi(
  accessToken: string,
  action: SpotifyAction,
  payload: Record<string, unknown>
) {
  const request = buildSpotifyRequest(action, payload)
  const response = await fetch(request.endpoint, {
    method: request.method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: request.body,
  })

  const parsed = await parseSpotifyResponse(response)
  return { response, parsed }
}

async function executeSpotifyAction(
  supabase: ReturnType<typeof createClient>,
  tokenRow: SpotifyTokenRow,
  action: SpotifyAction,
  payload: Record<string, unknown>
) {
  let activeToken = await ensureFreshSpotifyAccessToken(supabase, tokenRow)
  let result = await callSpotifyApi(activeToken.access_token, action, payload)

  if (result.response.status === 401) {
    activeToken = await refreshSpotifyAccessToken(supabase, activeToken)
    result = await callSpotifyApi(activeToken.access_token, action, payload)
  }

  if (!result.response.ok) {
    const normalizedError = normalizeSpotifyApiError(result.response.status, result.parsed, action)
    const error = new Error(`${normalizedError.code}: ${normalizedError.message}`)
    ;(error as Error & { code?: string }).code = normalizedError.code
    throw error
  }

  return {
    tokenRow: activeToken,
    status: result.response.status,
    data: result.parsed,
  }
}

function shapeSpotifySuccess(action: SpotifyAction, status: number, data: any) {
  if (action === 'getPlaybackState' || action === 'getCurrentlyPlaying') {
    return {
      ok: true,
      action,
      status,
      playback: data,
    }
  }

  if (action === 'getDevices') {
    return {
      ok: true,
      action,
      status,
      devices: Array.isArray(data?.devices) ? data.devices : [],
    }
  }

  return {
    ok: true,
    action,
    status,
    data,
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  try {
    const body = await req.json()
    const userId = typeof body.userId === 'string' ? body.userId.trim() : ''
    const action = body.action as SpotifyAction

    if (!userId) {
      throw new Error('Missing userId')
    }

    if (!action) {
      throw new Error('Missing action')
    }

    await validateBearerSession(req, userId)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const tokenRow = await getSpotifyTokenRow(supabase, userId)
    if (!tokenRow) {
      return jsonResponse(
        {
          error: 'SPOTIFY_NOT_CONNECTED: Spotify connection not found for this user.',
          code: 'SPOTIFY_NOT_CONNECTED',
          message: 'Spotify connection not found for this user.',
        },
        404
      )
    }

    const result = await executeSpotifyAction(supabase, tokenRow, action, body)
    return jsonResponse(shapeSpotifySuccess(action, result.status, result.data))
  } catch (error) {
    console.error('[spotify-player-control]', error)
    const code = (error as Error & { code?: string }).code || 'SPOTIFY_CONTROL_FAILED'

    return jsonResponse(
      {
        error: `${code}: ${error.message || 'Spotify control failed'}`,
        code,
        message: error.message || 'Spotify control failed',
      },
      code === 'SPOTIFY_NOT_CONNECTED' ? 404 : 400
    )
  }
})

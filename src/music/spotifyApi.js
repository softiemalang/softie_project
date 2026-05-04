import { supabase } from '../lib/supabase'

const SPOTIFY_CONNECTED_KEY = 'music:spotify_connected'
const SPOTIFY_APP_URL = 'https://open.spotify.com/'

async function unwrapInvokeError(data, error) {
  if (error) {
    let message = error.message || 'Spotify 요청을 처리하지 못했습니다.'

    if (error.context) {
      try {
        if (typeof error.context.json === 'function') {
          const json = await error.context.json()
          if (json?.error) message = json.error
        } else if (typeof error.context.text === 'function') {
          const text = await error.context.text()
          try {
            const json = JSON.parse(text)
            if (json?.error) message = json.error
          } catch {
            if (text) message = text
          }
        }
      } catch (contextError) {
        console.error('[spotifyApi.unwrapInvokeError]', contextError)
      }
    }

    throw new Error(message)
  }

  if (data?.error) {
    throw new Error(data.error)
  }

  return data
}

async function invokeSpotifyControl(body) {
  if (!supabase) {
    throw new Error('Supabase client not initialized')
  }

  const { data, error } = await supabase.functions.invoke('spotify-player-control', {
    body,
  })

  return unwrapInvokeError(data, error)
}

export async function connectSpotify(userId, options = {}) {
  if (!supabase) {
    throw new Error('Supabase client not initialized')
  }

  const { data, error } = await supabase.functions.invoke('spotify-oauth-start', {
    body: {
      userId,
      returnPath: options.returnPath,
    },
  })

  const result = await unwrapInvokeError(data, error)
  if (!result?.authUrl) {
    throw new Error('Spotify OAuth URL을 생성하지 못했습니다.')
  }

  window.location.href = result.authUrl
}

export function isSpotifyConnected() {
  const params = new URLSearchParams(window.location.search)
  if (params.get('spotify_connected') === 'true') {
    localStorage.setItem(SPOTIFY_CONNECTED_KEY, 'true')
  }

  return localStorage.getItem(SPOTIFY_CONNECTED_KEY) === 'true'
}

export function disconnectSpotify() {
  localStorage.removeItem(SPOTIFY_CONNECTED_KEY)
}

export function getSpotifyAppUrl() {
  return SPOTIFY_APP_URL
}

export async function getSpotifyPlaybackState(userId) {
  return invokeSpotifyControl({
    userId,
    action: 'getPlaybackState',
    softieClient: 'music-dashboard',
  })
}

export async function getSpotifyCurrentlyPlaying(userId) {
  return invokeSpotifyControl({
    userId,
    action: 'getCurrentlyPlaying',
    softieClient: 'music-dashboard',
  })
}

export async function getSpotifyDevices(userId) {
  return invokeSpotifyControl({
    userId,
    action: 'getDevices',
    softieClient: 'music-dashboard',
  })
}

export async function transferSpotifyPlayback(userId, deviceId) {
  return invokeSpotifyControl({
    userId,
    action: 'transferPlayback',
    deviceId,
    softieClient: 'music-dashboard',
  })
}

export async function playSpotify(userId, options = {}) {
  return invokeSpotifyControl({
    userId,
    action: 'play',
    deviceId: options.deviceId,
    contextUri: options.contextUri,
    uris: options.uris,
    positionMs: options.positionMs,
    softieClient: 'music-dashboard',
  })
}

export async function pauseSpotify(userId) {
  return invokeSpotifyControl({
    userId,
    action: 'pause',
    softieClient: 'music-dashboard',
  })
}

export async function nextSpotify(userId) {
  return invokeSpotifyControl({
    userId,
    action: 'next',
    softieClient: 'music-dashboard',
  })
}

export async function previousSpotify(userId) {
  return invokeSpotifyControl({
    userId,
    action: 'previous',
    softieClient: 'music-dashboard',
  })
}

export async function playSpotifyPlaylist(userId, contextUri) {
  return invokeSpotifyControl({
    userId,
    action: 'playPlaylist',
    contextUri,
    softieClient: 'music-dashboard',
  })
}

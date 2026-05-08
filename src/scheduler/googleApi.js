import { supabase } from '../lib/supabase'
import { appendGoogleSheetsLog as sharedAppendGoogleSheetsLog } from '../lib/googleApi'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID
const GOOGLE_REDIRECT_URI = import.meta.env.VITE_GOOGLE_REDIRECT_URI
const GOOGLE_CONNECTED_STORAGE_KEY = 'scheduler:google_connected'
const GOOGLE_RECONNECT_REQUIRED = 'GOOGLE_RECONNECT_REQUIRED'

/**
 * Starts the Google OAuth flow.
 * Redirects the user to Google's consent screen.
 */
export async function connectGoogleCalendar(userId, options = {}) {
  if (!supabase) {
    alert('Supabase client not initialized')
    return
  }

  if (!GOOGLE_CLIENT_ID || !GOOGLE_REDIRECT_URI) {
    alert('Google OAuth 환경변수가 설정되지 않았습니다.')
    return
  }

  try {
    const { data, error } = await supabase.functions.invoke('google-oauth-start', {
      body: {
        userId,
        returnPath: options.returnPath,
      }
    })

    const result = await unwrapInvokeError(data, error)
    if (!result?.authUrl) {
      throw new Error('Google OAuth URL을 생성하지 못했습니다.')
    }

    window.location.href = result.authUrl
  } catch (error) {
    console.error('[connectGoogleCalendar]', error)
    alert(error.message || 'Google 계정 연결을 시작하지 못했습니다.')
  }
}

function attachErrorCode(error, errorCode) {
  if (errorCode) error.errorCode = errorCode
  return error
}

/**
 * Helper to unwrap generic Supabase FunctionsHttpError
 */
async function unwrapInvokeError(data, error) {
  if (error) {
    console.error('[unwrapInvokeError] Raw Error:', error)
    if (error.context) {
      console.error('[unwrapInvokeError] Raw Context:', error.context)
    }
    
    let msg = error.message
    let errorCode = null

    if (error.context) {
      try {
        if (typeof error.context.json === 'function') {
          const json = await error.context.json()
          if (json.error) msg = json.error
          if (json.errorCode) errorCode = json.errorCode
        } else if (typeof error.context.text === 'function') {
          const text = await error.context.text()
          console.error('[unwrapInvokeError] Raw Text Response:', text)
          const lowerText = text.trim().toLowerCase()
          if (lowerText.startsWith('<!doctype') || lowerText.startsWith('<html')) {
            msg = 'Drive 백업 함수 응답이 JSON이 아니에요. 함수 배포 또는 호출 경로를 확인해 주세요.'
          } else {
            try {
              const json = JSON.parse(text)
              if (json.error) msg = json.error
              if (json.errorCode) errorCode = json.errorCode
            } catch {
              msg = text
            }
          }
        } else if (error.context.error) {
          msg = error.context.error
        }
      } catch (e) {
        console.error('[unwrapInvokeError] Extraction Exception:', e)
      }
    }
    // Also catch cases where the error.message itself is a JSON.parse exception from Supabase client
    if (msg.includes('Unexpected token') && msg.includes('is not valid JSON')) {
      msg = `함수 응답이 JSON이 아닙니다. 서버 에러 또는 배포 상태를 확인해 주세요. (Raw: ${error.message})`
    }
    throw attachErrorCode(new Error(msg), errorCode)
  }
  if (data && data.error) throw attachErrorCode(new Error(data.error), data.errorCode || null)
  return data
}

/**
 * Calls the Edge Function to create an event in Google Calendar.
 */
export async function createGoogleCalendarEvent(userId, eventData) {
  if (!supabase) throw new Error('Supabase client not initialized')

  const { data, error } = await supabase.functions.invoke('google-calendar-create-event', {
    body: { userId, eventData }
  })

  return unwrapInvokeError(data, error)
}

/**
 * Calls the Edge Function to update an existing event in Google Calendar.
 */
export async function updateGoogleCalendarEvent(userId, eventData) {
  if (!supabase) throw new Error('Supabase client not initialized')

  const { data, error } = await supabase.functions.invoke('google-calendar-update-event', {
    body: { userId, eventData }
  })

  return unwrapInvokeError(data, error)
}

/**
 * Calls the Edge Function to delete an existing event from Google Calendar.
 */
export async function deleteGoogleCalendarEvent(userId, rehearsalId) {
  if (!supabase) throw new Error('Supabase client not initialized')

  const { data, error } = await supabase.functions.invoke('google-calendar-delete-event', {
    body: { userId, rehearsalId }
  })

  return unwrapInvokeError(data, error)
}

/**
 * Calls the Edge Function to trigger a Google Drive Backup MVP.
 */
export async function triggerGoogleDriveBackup(userId, backupType = 'full') {
  if (!supabase) throw new Error('Supabase client not initialized')

  const { data, error } = await supabase.functions.invoke('google-drive-backup', {
    body: { userId, backupType }
  })

  return unwrapInvokeError(data, error)
}

/**
 * Calls the Edge Function to append a row to Google Sheets.
 * Fire-and-forget style logging.
 */
export async function appendGoogleSheetsLog(userId, tabName, rowData) {
  if (!isGoogleConnected()) return
  try {
    await sharedAppendGoogleSheetsLog(userId, tabName, rowData)
  } catch (err) {
    if (err.errorCode === GOOGLE_RECONNECT_REQUIRED) {
      disconnectGoogleCalendar()
    }
  }
}

export function disconnectGoogleCalendar() {
  localStorage.removeItem(GOOGLE_CONNECTED_STORAGE_KEY)
}

/**
 * Check if the user is connected (persists via localStorage for MVP).
 * Note: MVP uses localStorage to avoid blocking renders.
 */
export function isGoogleConnected() {
  const params = new URLSearchParams(window.location.search)
  if (params.get('google_connected') === 'true') {
    localStorage.setItem(GOOGLE_CONNECTED_STORAGE_KEY, 'true')
  }
  return localStorage.getItem(GOOGLE_CONNECTED_STORAGE_KEY) === 'true'
}

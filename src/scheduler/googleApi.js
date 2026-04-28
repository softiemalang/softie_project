import { supabase } from '../lib/supabase'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID
const GOOGLE_REDIRECT_URI = import.meta.env.VITE_GOOGLE_REDIRECT_URI || window.location.origin + '/scheduler'

/**
 * Starts the Google OAuth flow.
 * Redirects the user to Google's consent screen.
 */
export function connectGoogleCalendar(userId) {
  // Requesting scopes for Calendar (Priority 1), Drive (Priority 2), and Sheets (Priority 3)
  const scope = 'https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/spreadsheets'
  
  // Use 'state' to pass the userId/deviceId so the callback can identify who it belongs to
  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  authUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID)
  authUrl.searchParams.set('redirect_uri', GOOGLE_REDIRECT_URI)
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('scope', scope)
  authUrl.searchParams.set('access_type', 'offline')
  authUrl.searchParams.set('prompt', 'consent') // Force consent to get refresh_token
  authUrl.searchParams.set('state', userId)

  window.location.href = authUrl.toString()
}

/**
 * Calls the Edge Function to create an event in Google Calendar.
 */
export async function createGoogleCalendarEvent(userId, eventData) {
  if (!supabase) throw new Error('Supabase client not initialized')

  const { data, error } = await supabase.functions.invoke('google-calendar-create-event', {
    body: { userId, eventData }
  })

  if (error) throw error
  if (data && data.error) throw new Error(data.error)
  return data
}

/**
 * Calls the Edge Function to trigger a Google Drive Backup MVP.
 */
export async function triggerGoogleDriveBackup(userId, backupType = 'full') {
  if (!supabase) throw new Error('Supabase client not initialized')

  const { data, error } = await supabase.functions.invoke('google-drive-backup', {
    body: { userId, backupType }
  })

  if (error) throw error
  if (data && data.error) throw new Error(data.error)
  return data
}

/**
 * Calls the Edge Function to append a row to Google Sheets.
 * Fire-and-forget style logging.
 */
export async function appendGoogleSheetsLog(userId, tabName, rowData) {
  if (!supabase || !isGoogleConnected()) return

  try {
    const { data, error } = await supabase.functions.invoke('google-sheets-append-log', {
      body: { userId, tabName, rowData }
    })

    if (error) throw error
    if (data && data.error) throw new Error(data.error)
  } catch (err) {
    console.error(`Google Sheets Logging Error (${tabName}):`, err)
    if (err.message?.includes('not connected') || err.message?.includes('refresh token')) {
      disconnectGoogleCalendar()
    }
  }
}

export function disconnectGoogleCalendar() {
  localStorage.removeItem('scheduler:google_connected')
}

/**
 * Check if the user is connected (persists via localStorage for MVP)
 */
export function isGoogleConnected() {
  const params = new URLSearchParams(window.location.search)
  if (params.get('google_connected') === 'true') {
    localStorage.setItem('scheduler:google_connected', 'true')
    // Optionally clean up URL here, but keeping it simple for MVP
  }
  return localStorage.getItem('scheduler:google_connected') === 'true'
}

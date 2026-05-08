import { supabase } from './supabase'

function attachErrorCode(error, errorCode) {
  if (errorCode) error.errorCode = errorCode
  return error
}

async function unwrapInvokeError(data, error) {
  if (error) {
    let message = error.message
    let errorCode = null

    try {
      if (error.context && typeof error.context.json === 'function') {
        const json = await error.context.json()
        message = json.error || message
        errorCode = json.errorCode || null
      }
    } catch {
      // Keep the original Supabase error when the response body cannot be parsed.
    }

    throw attachErrorCode(new Error(message), errorCode)
  }

  if (data && data.error) {
    throw attachErrorCode(new Error(data.error), data.errorCode || null)
  }

  return data
}

export async function appendGoogleSheetsLog(userId, tabName, rowData, options = {}) {
  if (!supabase) return

  try {
    const { data, error } = await supabase.functions.invoke('google-sheets-append-log', {
      body: { userId, tabName, rowData, spreadsheetType: options.spreadsheetType }
    })

    await unwrapInvokeError(data, error)
  } catch (err) {
    console.error(`Google Sheets Logging Error (${tabName}):`, err)
    throw err
  }
}

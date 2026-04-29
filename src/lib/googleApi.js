import { supabase } from './supabase'

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
    if (error.context) {
      try {
        if (typeof error.context.json === 'function') {
          const json = await error.context.json()
          if (json.error) msg = json.error
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
    if (msg.includes('Unexpected token') && msg.includes('is not valid JSON')) {
      msg = `함수 응답이 JSON이 아닙니다. 서버 에러 또는 배포 상태를 확인해 주세요. (Raw: ${error.message})`
    }
    throw new Error(msg)
  }
  if (data && data.error) throw new Error(data.error)
  return data
}

/**
 * Calls the Edge Function to append a row to Google Sheets.
 */
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

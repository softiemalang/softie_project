import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { getOrRefreshToken } from '../_shared/googleToken.ts'

async function findOrCreateSpreadsheet(accessToken: string): Promise<string> {
  const sheetName = 'softie_project_logs'
  
  // 1. Search in Drive
  const query = `mimeType='application/vnd.google-apps.spreadsheet' and name='${sheetName}' and trashed=false`
  const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&spaces=drive`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  })
  
  const searchData = await searchRes.json()
  if (searchData.error) {
    throw new Error(`Drive API search error: ${searchData.error.message}`)
  }
  
  if (searchData.files && searchData.files.length > 0) {
    return searchData.files[0].id
  }
  
  // 2. Create via Sheets API
  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      properties: { title: sheetName },
      sheets: [
        { properties: { title: 'scheduler_logs' } },
        { properties: { title: 'backup_logs' } },
        { properties: { title: 'fortune_report_logs' } }
      ]
    })
  })
  
  const createData = await createRes.json()
  if (createData.error) {
    throw new Error(`Sheets API create error: ${createData.error.message}`)
  }
  
  return createData.spreadsheetId
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { userId, tabName, rowData } = await req.json()

    if (!userId || !tabName || !Array.isArray(rowData)) {
      throw new Error('Missing userId, tabName, or invalid rowData array')
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!supabaseUrl || !supabaseKey) throw new Error('Missing Supabase credentials')

    const supabase = createClient(supabaseUrl, supabaseKey)
    const accessToken = await getOrRefreshToken(supabase, userId)

    // Check if ID is provided via env var, otherwise auto-create/reuse
    let spreadsheetId = Deno.env.get('GOOGLE_SHEETS_LOG_SPREADSHEET_ID')
    if (!spreadsheetId) {
      spreadsheetId = await findOrCreateSpreadsheet(accessToken)
    }

    // Append to Google Sheets
    // URL: https://sheets.googleapis.com/v4/spreadsheets/{spreadsheetId}/values/{range}:append
    const appendUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(tabName)}!A1:append?valueInputOption=USER_ENTERED`

    const response = await fetch(appendUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: [rowData],
      }),
    })

    const result = await response.json()
    if (result.error) {
      throw new Error(`Google Sheets API error: ${result.error.message}`)
    }

    return new Response(JSON.stringify({ success: true, result, spreadsheetId }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('[google-sheets-append-log]', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { getOrRefreshToken } from '../_shared/googleToken.ts'
import { findOrCreateSpreadsheet, findOrCreateSajuSpreadsheet, appendSheetRow } from '../_shared/googleSheets.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    let payload;
    try {
      payload = await req.json()
    } catch (parseError) {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    try {
      const { userId, tabName, rowData, spreadsheetType } = payload

      if (!userId || !tabName || !Array.isArray(rowData)) {
        throw new Error('Missing userId, tabName, or invalid rowData array')
      }

      const supabaseUrl = Deno.env.get('SUPABASE_URL')
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
      if (!supabaseUrl || !supabaseKey) throw new Error('Missing Supabase credentials')

      const supabase = createClient(supabaseUrl, supabaseKey)
      const accessToken = await getOrRefreshToken(supabase, userId)

      let spreadsheetId: string | null = null

      if (spreadsheetType === 'saju') {
        spreadsheetId = Deno.env.get('GOOGLE_SAJU_SHEETS_LOG_SPREADSHEET_ID') || null
        if (!spreadsheetId) {
          spreadsheetId = await findOrCreateSajuSpreadsheet(accessToken)
        }
      } else {
        spreadsheetId = Deno.env.get('GOOGLE_SHEETS_LOG_SPREADSHEET_ID') || null
        if (!spreadsheetId) {
          spreadsheetId = await findOrCreateSpreadsheet(accessToken)
        }
      }

      if (!spreadsheetId) throw new Error('Could not determine spreadsheet ID')

      const result = await appendSheetRow(accessToken, spreadsheetId, tabName, rowData)

      return new Response(JSON.stringify({ success: true, result, spreadsheetId }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    } catch (innerError) {
      console.error('[google-sheets-append-log] Expected Error:', innerError)
      return new Response(JSON.stringify({ error: innerError.message || String(innerError) }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
  } catch (fatalError) {
    console.error('[google-sheets-append-log] Fatal Crash:', fatalError)
    return new Response(JSON.stringify({ error: 'A fatal server error occurred.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

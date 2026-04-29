import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { getOrRefreshToken } from '../_shared/googleToken.ts'
import { gatherBackupData, uploadToDriveIfNew } from '../_shared/googleBackup.ts'
import { findOrCreateSpreadsheet, updateBackupDashboardAndSnapshots } from '../_shared/googleSheets.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    try {
      const cronSecret = Deno.env.get('BACKUP_CRON_SECRET')
      if (cronSecret) {
        const authHeader = req.headers.get('Authorization')
        if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
          return new Response(JSON.stringify({ error: 'Unauthorized: Invalid cron secret' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }
      }

      const userId = Deno.env.get('GOOGLE_BACKUP_USER_ID')
      if (!userId) {
        throw new Error('GOOGLE_BACKUP_USER_ID is not configured in Supabase secrets')
      }

      const supabaseUrl = Deno.env.get('SUPABASE_URL')
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
      if (!supabaseUrl || !supabaseKey) throw new Error('Missing Supabase credentials')

      const supabase = createClient(supabaseUrl, supabaseKey)
      const accessToken = await getOrRefreshToken(supabase, userId)

      const backupData = await gatherBackupData(supabase, 'scheduled', 'full')
      const backupResult = await uploadToDriveIfNew(accessToken, backupData.finalJson, backupData.fileName, backupData.subFolder, backupData.year, true)

      let spreadsheetId = Deno.env.get('GOOGLE_SHEETS_LOG_SPREADSHEET_ID')
      if (!spreadsheetId) {
        spreadsheetId = await findOrCreateSpreadsheet(accessToken)
      }

      try {
        await updateBackupDashboardAndSnapshots(accessToken, spreadsheetId, backupData.finalJson, backupResult)
      } catch (sheetsError) {
        console.error('[google-drive-scheduled-backup] Sheets Error:', sheetsError)
      }

      return new Response(JSON.stringify({ 
        success: true, 
        skipped: backupResult.skipped,
        fileId: backupResult.fileId, 
        fileName: backupData.fileName, 
        metadata: backupData.finalJson.metadata 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    } catch (innerError) {
      console.error('[google-drive-scheduled-backup] Expected Error:', innerError)
      return new Response(JSON.stringify({ error: innerError.message || String(innerError) }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
  } catch (fatalError) {
    console.error('[google-drive-scheduled-backup] Fatal Crash:', fatalError)
    return new Response(JSON.stringify({ error: 'A fatal server error occurred during scheduled backup.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

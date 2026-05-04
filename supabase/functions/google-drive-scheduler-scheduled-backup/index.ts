import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { getOrRefreshToken } from '../_shared/googleToken.ts'
import { gatherBackupData, uploadToDriveIfNew } from '../_shared/googleBackup.ts'

serve(async (req) => {
  console.log('[scheduler-scheduled-backup] Received request')
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const cronSecret = Deno.env.get('BACKUP_CRON_SECRET')
    if (!cronSecret) {
      console.error('[scheduler-scheduled-backup] BACKUP_CRON_SECRET is not set')
      return new Response(JSON.stringify({ error: 'Server configuration error' }), { status: 500, headers: corsHeaders })
    }

    const authHeader = req.headers.get('Authorization')
    if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
      console.warn('[scheduler-scheduled-backup] Unauthorized access attempt')
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders })
    }

    const ownerKey = Deno.env.get('SCHEDULER_BACKUP_OWNER_KEY')
    if (!ownerKey) {
      console.error('[scheduler-scheduled-backup] SCHEDULER_BACKUP_OWNER_KEY is not set')
      return new Response(JSON.stringify({ error: 'Missing owner key' }), { status: 500, headers: corsHeaders })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    console.log(`[scheduler-scheduled-backup] Starting backup for owner: ${ownerKey}`)
    
    const accessToken = await getOrRefreshToken(supabase, ownerKey)
    console.log('[scheduler-scheduled-backup] Token refreshed')

    const { finalJson, fileName, subFolder, year } = await gatherBackupData(supabase, 'scheduled', 'full')
    console.log(`[scheduler-scheduled-backup] Backup data gathered: ${fileName}`)

    const result = await uploadToDriveIfNew(accessToken, finalJson, fileName, subFolder, year, true)
    console.log(`[scheduler-scheduled-backup] Backup upload finished. Skipped: ${result.skipped}`)

    return new Response(JSON.stringify({ 
      ok: true, 
      ownerKey, 
      fileName: result.fileName, 
      fileId: result.fileId,
      skipped: result.skipped
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('[scheduler-scheduled-backup] Critical Error:', error)
    return new Response(JSON.stringify({ ok: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { backupUserRehearsalEvents } from '../_shared/rehearsalBackup.ts'

serve(async (req) => {
  console.log('[scheduled-backup] Received request')
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const cronSecret = Deno.env.get('BACKUP_CRON_SECRET')
    if (!cronSecret) {
      console.error('[scheduled-backup] BACKUP_CRON_SECRET is not set in environment')
      return new Response(JSON.stringify({ error: 'Server configuration error: missing secret' }), { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    const authHeader = req.headers.get('Authorization')
    if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
      console.warn('[scheduled-backup] Unauthorized access attempt')
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }
    console.log('[scheduled-backup] Authorization passed')

    const ownerKey = Deno.env.get('REHEARSAL_BACKUP_OWNER_KEY')
    if (!ownerKey) {
      console.error('[scheduled-backup] REHEARSAL_BACKUP_OWNER_KEY is not set')
      return new Response(JSON.stringify({ error: 'Server configuration error: missing owner key' }), { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }
    console.log('[scheduled-backup] Target owner key loaded')

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)
    console.log('[scheduled-backup] Supabase client created')

    // Get current month in Asia/Seoul (YYYY-MM)
    const now = new Date()
    const kstDate = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Seoul' }))
    const yearMonth = `${kstDate.getFullYear()}-${String(kstDate.getMonth() + 1).padStart(2, '0')}`
    console.log(`[scheduled-backup] Computed Year-Month (KST): ${yearMonth}`)

    console.log(`[scheduled-backup] Starting backup logic for ${ownerKey}`)
    const result = await backupUserRehearsalEvents(supabase, ownerKey, yearMonth)
    console.log('[scheduled-backup] Backup logic finished')

    return new Response(JSON.stringify({ 
      ok: true, 
      ownerKey, 
      yearMonth, 
      fileName: result.fileName, 
      fileId: result.fileId 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('[scheduled-backup] Critical Error:', error)
    return new Response(JSON.stringify({ 
      ok: false,
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

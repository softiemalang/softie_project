import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { getOrRefreshToken } from '../_shared/googleToken.ts'
import { getOrCreateFolder, uploadFile, updateFile } from '../_shared/googleBackup.ts'

/**
 * Computes the previous date in Asia/Seoul (KST) as YYYY-MM-DD.
 */
function getPreviousKstDateString(now = new Date()) {
  const kstOffsetMs = 9 * 60 * 60 * 1000
  const oneDayMs = 24 * 60 * 60 * 1000
  const target = new Date(now.getTime() + kstOffsetMs - oneDayMs)

  const year = target.getUTCFullYear()
  const month = String(target.getUTCMonth() + 1).padStart(2, '0')
  const day = String(target.getUTCDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Auth check
    const cronSecret = Deno.env.get('BACKUP_CRON_SECRET')
    if (!cronSecret) {
      return new Response(JSON.stringify({ error: 'BACKUP_CRON_SECRET is not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const authHeader = req.headers.get('Authorization')
    if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
      return new Response(JSON.stringify({ error: 'Unauthorized: Invalid cron secret' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 2. Initialize Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!supabaseUrl || !supabaseKey) throw new Error('Missing Supabase credentials')
    const supabase = createClient(supabaseUrl, supabaseKey)

    // 3. Determine target date (Yesterday in KST)
    const targetDate = getPreviousKstDateString()
    const year = targetDate.split('-')[0]

    // 4. Resolve Softie Profile
    const softieProfileId = Deno.env.get('SOFTIE_SAJU_PROFILE_ID')
    if (!softieProfileId) {
      throw new Error('SOFTIE_SAJU_PROFILE_ID is not configured')
    }

    // 5. Query latest report for target date
    const { data: report, error: reportError } = await supabase
      .from('saju_fortune_reports')
      .select('*')
      .eq('report_date', targetDate)
      .eq('profile_id', softieProfileId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (reportError) throw new Error(`Database error (report): ${reportError.message}`)

    if (!report) {
      return new Response(JSON.stringify({ ok: true, skipped: true, reason: 'No report found', targetDate }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 6. Query profile data
    const { data: profile, error: profileError } = await supabase
      .from('saju_profiles')
      .select('*')
      .eq('id', softieProfileId)
      .maybeSingle()

    if (profileError) throw new Error(`Database error (profile): ${profileError.message}`)

    // 7. Prepare JSON content
    const finalJson = {
      metadata: {
        app_name: 'softie_project',
        backup_type: 'saju_daily_report_archive',
        timezone: 'Asia/Seoul',
        target_date: targetDate,
        created_at: new Date().toISOString(),
        source_table: 'saju_fortune_reports'
      },
      profile: profile || {},
      report: report
    }

    // 8. Google Drive Upload/Update
    const userId = Deno.env.get('GOOGLE_BACKUP_USER_ID')
    if (!userId) throw new Error('GOOGLE_BACKUP_USER_ID is not configured')
    
    const accessToken = await getOrRefreshToken(supabase, userId)
    
    const rootId = await getOrCreateFolder(accessToken, 'softie_project')
    const sajuId = await getOrCreateFolder(accessToken, 'saju', rootId)
    const dailyReportsId = await getOrCreateFolder(accessToken, 'daily-reports', sajuId)
    const yearFolderId = await getOrCreateFolder(accessToken, year, dailyReportsId)

    const fileName = `${targetDate}.json`
    
    // Check if file already exists
    let query = `mimeType='application/json' and name='${fileName}' and '${yearFolderId}' in parents and trashed=false`
    const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&spaces=drive`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    })
    const searchData = await searchRes.json()
    
    let fileId: string
    let action: string
    
    if (searchData.files && searchData.files.length > 0) {
      fileId = searchData.files[0].id
      await updateFile(accessToken, fileId, JSON.stringify(finalJson, null, 2))
      action = 'updated'
    } else {
      fileId = await uploadFile(accessToken, yearFolderId, fileName, JSON.stringify(finalJson, null, 2))
      action = 'created'
    }

    return new Response(JSON.stringify({ 
      success: true, 
      action, 
      fileId, 
      fileName, 
      targetDate, 
      reportId: report.id 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('[saju-daily-report-backup] Error:', error)
    return new Response(JSON.stringify({ error: error.message || String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

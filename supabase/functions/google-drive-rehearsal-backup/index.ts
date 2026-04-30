import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { getOrRefreshToken } from '../_shared/googleToken.ts'
import { getOrCreateFolder, uploadFile, updateFile } from '../_shared/googleBackup.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    let payload;
    try {
      payload = await req.json()
    } catch (e) {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400, headers: corsHeaders })
    }

    const { userId, yearMonth } = payload
    if (!userId || !yearMonth) {
      throw new Error('Missing userId or yearMonth')
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Find rehearsals for the given month (e.g. '2026-05')
    const [year, month] = yearMonth.split('-').map(Number)
    const startDate = `${yearMonth}-01`
    
    // Calculate first day of next month
    const nextMonth = month === 12 ? 1 : month + 1
    const nextYear = month === 12 ? year + 1 : year
    const nextMonthStart = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`

    const { data: events, error: fetchError } = await supabase
      .from('rehearsal_events')
      .select('*')
      .eq('owner_key', userId)
      .gte('event_date', startDate)
      .lt('event_date', nextMonthStart)
      .order('event_date', { ascending: true })

    if (fetchError) throw new Error(`DB Error: ${fetchError.message}`)

    const now = new Date()
    const finalJson = {
      backupType: 'rehearsal_events_monthly',
      month: yearMonth,
      generatedAt: now.toISOString(),
      ownerKey: userId,
      events: (events || []).map(e => ({
        id: e.id,
        teamName: e.team_name,
        title: e.title,
        eventDate: e.event_date,
        startTime: e.start_time,
        endTime: e.end_time,
        studioName: e.studio_name,
        travelMinutes: e.travel_minutes,
        googleCalendarEventId: e.google_calendar_event_id
      }))
    }

    const fileName = `rehearsal-events-${yearMonth}.json`
    const content = JSON.stringify(finalJson, null, 2)

    const accessToken = await getOrRefreshToken(supabase, userId)

    // Upload to Drive: Softie Backups -> rehearsals
    const rootFolderId = await getOrCreateFolder(accessToken, 'Softie Backups')
    const rehearsalsFolderId = await getOrCreateFolder(accessToken, 'rehearsals', rootFolderId)

    // Check if the file already exists in the folder to update it instead of duplicating
    const query = `mimeType='application/json' and name='${fileName}' and '${rehearsalsFolderId}' in parents and trashed=false`
    const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&spaces=drive`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    })
    const searchData = await searchRes.json()

    let fileId;
    if (searchData.files && searchData.files.length > 0) {
      fileId = searchData.files[0].id
      await updateFile(accessToken, fileId, content)
    } else {
      fileId = await uploadFile(accessToken, rehearsalsFolderId, fileName, content)
    }

    // Update the db records to mark them backed up
    if (events && events.length > 0) {
      const eventIds = events.map(e => e.id)
      await supabase
        .from('rehearsal_events')
        .update({
          drive_backup_status: 'success',
          drive_backup_file_id: fileId,
          drive_backup_file_name: fileName,
          drive_backed_up_at: now.toISOString()
        })
        .in('id', eventIds)
    }

    return new Response(JSON.stringify({ success: true, fileId, fileName }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('[google-drive-rehearsal-backup]', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

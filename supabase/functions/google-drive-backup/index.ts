import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { getOrRefreshToken } from '../_shared/googleToken.ts'

// Google Drive API helper
async function getOrCreateFolder(accessToken: string, folderName: string, parentId?: string) {
  // Search for the folder
  let query = `mimeType='application/vnd.google-apps.folder' and name='${folderName}' and trashed=false`
  if (parentId) {
    query += ` and '${parentId}' in parents`
  }
  
  const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&spaces=drive`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  })
  
  const searchData = await searchRes.json()
  
  if (searchData.files && searchData.files.length > 0) {
    return searchData.files[0].id
  }
  
  // Create if not found
  const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: parentId ? [parentId] : undefined
    })
  })
  
  const createData = await createRes.json()
  if (createData.error) {
    throw new Error(`Failed to create folder ${folderName}: ${createData.error.message}`)
  }
  return createData.id
}

async function uploadFile(accessToken: string, folderId: string, fileName: string, content: string) {
  const boundary = '-------314159265358979323846'
  const delimiter = "\r\n--" + boundary + "\r\n"
  const close_delim = "\r\n--" + boundary + "--"

  const multipartRequestBody =
    "--" + boundary + "\r\n" +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify({ name: fileName, parents: [folderId] }) +
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    content +
    close_delim

  const uploadRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': `multipart/related; boundary=${boundary}`
    },
    body: multipartRequestBody
  })
  
  if (!uploadRes.ok) {
    const errorText = await uploadRes.text()
    console.error('[uploadFile] Google Drive API Raw Error:', errorText)
    throw new Error(`Google Drive API HTTP error: ${uploadRes.status} ${uploadRes.statusText}`)
  }

  try {
    const result = await uploadRes.json()
    if (result.error) {
      throw new Error(`Google Drive API error: ${result.error.message}`)
    }
    return result.id
  } catch (e) {
    throw new Error(`Google Drive API returned non-JSON response. Ensure Drive API is enabled in Google Cloud Console.`)
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    let payload;
    try {
      payload = await req.json()
    } catch (parseError) {
      console.error('[google-drive-backup] Request JSON Parse Error:', parseError)
      return new Response(JSON.stringify({ error: 'Invalid JSON body in request.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    try {
      const { userId, backupType } = payload

      if (!userId || !backupType) {
        throw new Error('Missing userId or backupType')
      }

      const supabaseUrl = Deno.env.get('SUPABASE_URL')
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
      if (!supabaseUrl || !supabaseKey) throw new Error('Missing Supabase credentials')

      const supabase = createClient(supabaseUrl, supabaseKey)
      const accessToken = await getOrRefreshToken(supabase, userId)

      // Collect data based on backupType
      let exportData: Record<string, any> = {}
      let tableCounts: Record<string, number> = {}

      // Helper to safely fetch table data
      async function safeFetch(tableName: string) {
        try {
          const { data, error } = await supabase.from(tableName).select('*')
          if (error) {
            console.warn(`Failed to fetch ${tableName}:`, error.message)
            return []
          }
          return data || []
        } catch (e) {
          console.warn(`Exception fetching ${tableName}:`, e)
          return []
        }
      }

      if (backupType === 'scheduler' || backupType === 'full') {
        const [res, we] = await Promise.all([
          safeFetch('reservations'),
          safeFetch('work_events')
        ])
        exportData.reservations = res
        exportData.work_events = we
        tableCounts.reservations = exportData.reservations.length
        tableCounts.work_events = exportData.work_events.length
      }

      if (backupType === 'fortune' || backupType === 'full') {
        const [prof, ns, ds, fr] = await Promise.all([
          safeFetch('saju_profiles'),
          safeFetch('saju_natal_snapshots'),
          safeFetch('saju_daily_snapshots'),
          safeFetch('saju_fortune_reports')
        ])
        exportData.saju_profiles = prof
        exportData.saju_natal_snapshots = ns
        exportData.saju_daily_snapshots = ds
        exportData.saju_fortune_reports = fr
        tableCounts.saju_profiles = exportData.saju_profiles.length
        tableCounts.saju_natal_snapshots = exportData.saju_natal_snapshots.length
        tableCounts.saju_daily_snapshots = exportData.saju_daily_snapshots.length
        tableCounts.saju_fortune_reports = exportData.saju_fortune_reports.length
      }

      if (backupType === 'settings' || backupType === 'full') {
        const subs = await safeFetch('push_subscriptions')
        exportData.push_subscriptions = subs
        tableCounts.push_subscriptions = exportData.push_subscriptions.length
      }

      // Build the final JSON structure
      const now = new Date()
      const finalJson = {
        metadata: {
          backup_type: backupType,
          created_at: now.toISOString(),
          app_name: 'softie_project',
          schema_version: 1,
          counts: tableCounts
        },
        data: exportData
      }

      // Date formatting: YYYY-MM-DD-HHmmss
      const pad = (n: number) => n.toString().padStart(2, '0')
      const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`
      const fileName = `softie-backup-${backupType}-${dateStr}.json`

      // Google Drive Folder Structure
      // root -> softie_project -> backups -> {backupType}
      const rootFolderId = await getOrCreateFolder(accessToken, 'softie_project')
      const backupsFolderId = await getOrCreateFolder(accessToken, 'backups', rootFolderId)
      const targetFolderId = await getOrCreateFolder(accessToken, backupType, backupsFolderId)

      // Upload
      const fileId = await uploadFile(accessToken, targetFolderId, fileName, JSON.stringify(finalJson, null, 2))

      return new Response(JSON.stringify({ success: true, fileId, fileName, metadata: finalJson.metadata }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    } catch (innerError) {
      console.error('[google-drive-backup] Expected Error:', innerError)
      return new Response(JSON.stringify({ error: innerError.message || String(innerError) }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
  } catch (fatalError) {
    console.error('[google-drive-backup] Fatal Crash:', fatalError)
    return new Response(JSON.stringify({ error: 'A fatal server error occurred during backup. Please try again later.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

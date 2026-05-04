import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Google Drive API helper
export async function getOrCreateFolder(accessToken: string, folderName: string, parentId?: string) {
  let query = `mimeType='application/vnd.google-apps.folder' and name='${folderName}' and trashed=false`
  if (parentId) {
    query += ` and '${parentId}' in parents`
  }
  
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

export async function uploadFile(accessToken: string, folderId: string, fileName: string, content: string) {
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

export async function updateFile(accessToken: string, fileId: string, content: string) {
  const uploadRes = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: content
  })
  
  if (!uploadRes.ok) {
    const errorText = await uploadRes.text()
    console.error('[updateFile] Google Drive API Raw Error:', errorText)
    throw new Error(`Google Drive API HTTP error: ${uploadRes.status} ${uploadRes.statusText}`)
  }

  return fileId
}

export async function gatherBackupData(supabase: any, backupMode: 'scheduled' | 'manual', backupType: string = 'full') {
  let exportData: Record<string, any> = {}
  let tableCounts: Record<string, number> = {}
  let skippedTables: string[] = []

  async function safeFetch(tableName: string) {
    try {
      const { data, error } = await supabase.from(tableName).select('*')
      if (error) {
        console.warn(`Failed to fetch ${tableName}:`, error.message)
        skippedTables.push(`${tableName} (${error.message})`)
        return null
      }
      return data || []
    } catch (e) {
      console.warn(`Exception fetching ${tableName}:`, e)
      skippedTables.push(`${tableName} (${String(e)})`)
      return null
    }
  }

  const expectedTables = [
    'reservations', 'work_events', 'scheduler_work_logs',
    'saju_profiles', 'saju_natal_snapshots', 'saju_daily_snapshots', 'saju_fortune_reports', 
    'push_subscriptions'
  ]

  for (const table of expectedTables) {
    const data = await safeFetch(table)
    if (data !== null) {
      exportData[table] = data
      tableCounts[table] = data.length
    }
  }

  const now = new Date()
  // Add 9 hours to get KST Date
  const kstOffset = 9 * 60 * 60 * 1000
  const kstDate = new Date(now.getTime() + kstOffset)

  const pad = (n: number) => n.toString().padStart(2, '0')
  const year = kstDate.getUTCFullYear().toString()
  const month = pad(kstDate.getUTCMonth() + 1)
  const day = pad(kstDate.getUTCDate())
  const hours = pad(kstDate.getUTCHours())
  const mins = pad(kstDate.getUTCMinutes())
  const secs = pad(kstDate.getUTCSeconds())
  
  const dateStr = `${year}-${month}-${day}`
  const timeStr = `${hours}${mins}${secs}`

  let fileName = ''
  let subFolder = backupMode === 'scheduled' ? 'daily' : 'manual'
  if (backupMode === 'scheduled') {
    fileName = `${dateStr}.json`
  } else {
    fileName = `${dateStr}-manual-${timeStr}.json`
  }

  const drivePath = `softie_project/backups/${subFolder}/${year}/${fileName}`

  const finalJson = {
    metadata: {
      app_name: 'softie_project',
      backup_type: backupType,
      backup_mode: backupMode,
      schema_version: 1,
      timezone: 'Asia/Seoul',
      backup_date: dateStr,
      created_at: now.toISOString(),
      drive_path: drivePath,
      row_counts: tableCounts,
      skipped_tables: skippedTables
    },
    data: exportData
  }

  return { finalJson, fileName, subFolder, year, dateStr, drivePath }
}

export async function uploadToDriveIfNew(accessToken: string, finalJson: any, fileName: string, subFolder: string, year: string, isScheduled: boolean) {
  const rootFolderId = await getOrCreateFolder(accessToken, 'softie_project')
  const backupsFolderId = await getOrCreateFolder(accessToken, 'backups', rootFolderId)
  const subFolderId = await getOrCreateFolder(accessToken, subFolder, backupsFolderId) // 'daily' or 'manual'
  const yearFolderId = await getOrCreateFolder(accessToken, year, subFolderId)

  if (isScheduled) {
    let query = `mimeType='application/json' and name='${fileName}' and '${yearFolderId}' in parents and trashed=false`
    const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&spaces=drive`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    })
    const searchData = await searchRes.json()
    if (searchData.files && searchData.files.length > 0) {
      return { skipped: true, fileId: searchData.files[0].id, fileName }
    }
  }

  const fileId = await uploadFile(accessToken, yearFolderId, fileName, JSON.stringify(finalJson, null, 2))
  return { skipped: false, fileId, fileName }
}

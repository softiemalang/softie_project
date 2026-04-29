import { getOrCreateFolder, uploadFile } from './googleBackup.ts'

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

  // Define tables to fetch
  const allTables = [
    'reservations', 'work_events', 
    'saju_profiles', 'saju_natal_snapshots', 'saju_daily_snapshots', 'saju_fortune_reports', 
    'push_subscriptions'
  ]
  
  // For 'scheduler', 'fortune', 'settings' we used to filter. Let's just fetch all if 'full' or 'scheduled'
  // Keep logic simple: fetch all expected tables
  for (const table of allTables) {
    const data = await safeFetch(table)
    if (data !== null) {
      exportData[table] = data
      tableCounts[table] = data.length
    }
  }

  // Get KST time
  const now = new Date()
  const kstOffset = 9 * 60 * 60 * 1000
  const kstDate = new Date(now.getTime() + kstOffset)
  
  const pad = (n: number) => n.toString().padStart(2, '0')
  const year = kstDate.getUTCFullYear().toString()
  const month = pad(kstDate.getUTCMonth() + 1)
  const day = pad(kstDate.getUTCDate())
  const hours = pad(kstDate.getUTCHours())
  const mins = pad(kstDate.getUTCMinutes())
  const secs = pad(kstDate.getUTCSeconds())
  
  const dateStr = `${year}-${month}-${day}` // 2026-04-29
  const timeStr = `${hours}${mins}${secs}`
  
  let fileName = ''
  let subFolder = backupMode === 'scheduled' ? 'daily' : 'manual'
  if (backupMode === 'scheduled') {
    fileName = `${dateStr}.json`
  } else {
    fileName = `${dateStr}-manual-${timeStr}.json`
  }

  const finalJson = {
    metadata: {
      app_name: 'softie_project',
      backup_type: backupType,
      backup_mode: backupMode,
      schema_version: 1,
      timezone: 'Asia/Seoul',
      backup_date: dateStr,
      created_at: now.toISOString(),
      drive_path: `softie_project/backups/${subFolder}/${year}/${fileName}`,
      counts: tableCounts,
      skipped_tables: skippedTables
    },
    data: exportData
  }

  return { finalJson, fileName, subFolder, year, dateStr }
}

export async function uploadToDriveIfNew(accessToken: string, finalJson: any, fileName: string, subFolder: string, year: string, isScheduled: boolean) {
  const rootFolderId = await getOrCreateFolder(accessToken, 'softie_project')
  const backupsFolderId = await getOrCreateFolder(accessToken, 'backups', rootFolderId)
  const subFolderId = await getOrCreateFolder(accessToken, subFolder, backupsFolderId) // 'daily' or 'manual'
  const yearFolderId = await getOrCreateFolder(accessToken, year, subFolderId)

  if (isScheduled) {
    // Check if file exists
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

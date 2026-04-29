export async function findOrCreateSpreadsheet(accessToken: string): Promise<string> {
  const sheetName = 'softie_project_logs'
  
  const query = `mimeType='application/vnd.google-apps.spreadsheet' and name='${sheetName}' and trashed=false`
  const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&spaces=drive`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  })
  
  const searchData = await searchRes.json()
  if (searchData.error) throw new Error(`Drive API search error: ${searchData.error.message}`)
  
  if (searchData.files && searchData.files.length > 0) {
    return searchData.files[0].id
  }
  
  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      properties: { title: sheetName },
      sheets: [
        { properties: { title: 'dashboard' } },
        { properties: { title: 'backup_logs' } },
        { properties: { title: 'reservations_snapshot' } },
        { properties: { title: 'work_summary' } },
        { properties: { title: 'scheduler_logs' } },
        { properties: { title: 'fortune_report_logs' } }
      ]
    })
  })
  
  const createData = await createRes.json()
  if (createData.error) throw new Error(`Sheets API create error: ${createData.error.message}`)
  
  return createData.spreadsheetId
}

export async function appendSheetRow(accessToken: string, spreadsheetId: string, tabName: string, rowData: any[]) {
  const appendUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(tabName)}!A1:append?valueInputOption=USER_ENTERED`

  const response = await fetch(appendUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ values: [rowData] }),
  })

  const result = await response.json()
  if (result.error) throw new Error(`Google Sheets API error: ${result.error.message}`)
  return result
}

export async function updateSheetValues(accessToken: string, spreadsheetId: string, tabName: string, values: any[][]) {
  // First clear the sheet
  const clearUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(tabName)}!A1:Z10000:clear`
  await fetch(clearUrl, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' }
  })

  // Then update
  const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(tabName)}!A1?valueInputOption=USER_ENTERED`
  const response = await fetch(updateUrl, {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ values }),
  })

  const result = await response.json()
  if (result.error) throw new Error(`Google Sheets Update API error: ${result.error.message}`)
  return result
}

export async function updateBackupDashboardAndSnapshots(accessToken: string, spreadsheetId: string, finalJson: any, backupResult: any) {
  // 1. Dashboard
  const md = finalJson.metadata
  const counts = md.row_counts || {}
  
  const now = new Date()
  const kstOffset = 9 * 60 * 60 * 1000
  const kstDate = new Date(now.getTime() + kstOffset)
  
  const pad = (n: number) => n.toString().padStart(2, '0')
  const y = kstDate.getUTCFullYear()
  const m = pad(kstDate.getUTCMonth() + 1)
  const d = pad(kstDate.getUTCDate())
  
  const currentWeekStart = new Date(kstDate)
  const dayOfWeek = currentWeekStart.getUTCDay()
  const diff = currentWeekStart.getUTCDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1) // Monday
  currentWeekStart.setUTCDate(diff)
  const cwStr = `${currentWeekStart.getUTCFullYear()}-${pad(currentWeekStart.getUTCMonth()+1)}-${pad(currentWeekStart.getUTCDate())}`

  const dashboardValues = [
    ['Key', 'Value'],
    ['last_backup_at', md.created_at],
    ['last_backup_date', md.backup_date],
    ['last_backup_file', backupResult.fileName],
    ['last_backup_status', backupResult.skipped ? 'skipped_existing_backup' : 'success'],
    ['last_backup_mode', md.backup_mode],
    ['latest_drive_path', md.drive_path],
    ['total_reservations', counts.reservations || 0],
    ['total_work_events', counts.work_events || 0],
    ['current_week_range_start', cwStr],
    ['skipped_tables_count', (md.skipped_tables || []).length],
    ['notes', 'Last automated dashboard update']
  ]
  await updateSheetValues(accessToken, spreadsheetId, 'dashboard', dashboardValues)

  // 2. Backup Logs Append
  const logRow = [
    md.backup_date,
    md.backup_date.split('-')[0], // year
    backupResult.fileName,
    md.drive_path,
    backupResult.fileId || '',
    backupResult.skipped ? 'skipped_existing_backup' : 'success',
    md.backup_mode,
    md.created_at,
    JSON.stringify(md.row_counts || {}),
    JSON.stringify(md.skipped_tables || []),
    ''
  ]
  await appendSheetRow(accessToken, spreadsheetId, 'backup_logs', logRow)

  // 3. reservations_snapshot
  const resData = finalJson.data.reservations || []
  if (resData.length >= 0) {
    const resHeaders = ['reservation_id', 'date', 'start_time', 'end_time', 'location', 'room', 'customer_or_title', 'status', 'google_event_id', 'note', 'updated_at']
    const resValues = [resHeaders]
    resData.forEach((r: any) => {
      resValues.push([
        r.id, r.reservation_date, r.start_at, r.end_at, r.branch, r.room, r.customer_name,
        r.status || '', r.google_event_id || '', r.notes_text || '', r.updated_at
      ])
    })
    await updateSheetValues(accessToken, spreadsheetId, 'reservations_snapshot', resValues)
  }

  // 4. work_summary
  const weData = finalJson.data.work_events || []
  if (weData.length >= 0) {
    // Simple summary: grouped by location and room
    const groups: Record<string, { total_events: number, total_duration_min: number, min_date: string, max_date: string }> = {}
    weData.forEach((we: any) => {
      const res = resData.find((r: any) => r.id === we.reservation_id)
      if (res) {
        const key = `${res.branch}_${res.room}`
        if (!groups[key]) {
          groups[key] = { total_events: 0, total_duration_min: 0, min_date: res.reservation_date, max_date: res.reservation_date }
        }
        groups[key].total_events++
        groups[key].total_duration_min += (res.duration_minutes || 0)
        if (res.reservation_date < groups[key].min_date) groups[key].min_date = res.reservation_date
        if (res.reservation_date > groups[key].max_date) groups[key].max_date = res.reservation_date
      }
    })

    const wsHeaders = ['location', 'room', 'total_events', 'total_hours', 'first_date', 'last_date']
    const wsValues = [wsHeaders]
    for (const [key, g] of Object.entries(groups)) {
      const [loc, room] = key.split('_')
      wsValues.push([loc, room, g.total_events, (g.total_duration_min / 60).toFixed(2), g.min_date, g.max_date])
    }
    // if empty
    if (wsValues.length === 1) wsValues.push(['', '', 0, 0, '', ''])
    
    await updateSheetValues(accessToken, spreadsheetId, 'work_summary', wsValues)
  }
}

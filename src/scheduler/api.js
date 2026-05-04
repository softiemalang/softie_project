import { supabase } from '../lib/supabase'
import { endOfDayIso, startOfDayIso } from './time'

function ensureSupabase() {
  if (!supabase) {
    throw new Error('Supabase 설정이 없어요. 환경변수를 확인해 주세요.')
  }
}

function normalizeReservationRow(row) {
  if (!row) return null
  return {
    ...row,
    tags: row.tags || [],
  }
}

function normalizeEventRow(row) {
  return {
    ...row,
    tags_snapshot: row.tags_snapshot || [],
    reservation: normalizeReservationRow(row.reservations),
  }
}

export async function linkUnownedReservationsToOwner(ownerKey) {
  ensureSupabase()
  if (!ownerKey) return

  // Update existing reservations where owner_key is null
  const { error } = await supabase
    .from('reservations')
    .update({ owner_key: ownerKey })
    .is('owner_key', null)

  if (error) {
    console.error('Failed to link unowned reservations:', error)
    // Don't throw, just log. This is a progressive enhancement for existing users.
  }
}

export async function listTodayWorkEvents(dateValue, ownerKey) {
  ensureSupabase()
  if (!ownerKey) return []

  const { data, error } = await supabase
    .from('work_events')
    .select(`
      id,
      reservation_id,
      event_type,
      scheduled_at,
      status,
      tags_snapshot,
      memo_snapshot,
      reservations!inner (
        id,
        reservation_date,
        branch,
        room,
        customer_name,
        start_at,
        duration_minutes,
        end_at,
        warning_offset_minutes,
        tags,
        notes_text,
        owner_key
      )
    `)
    .eq('reservations.owner_key', ownerKey)
    .gte('scheduled_at', startOfDayIso(dateValue))
    .lte('scheduled_at', endOfDayIso(dateValue))
    .order('scheduled_at', { ascending: true })

  if (error) throw new Error(error.message)
  return (data || []).map(normalizeEventRow)
}

export async function getReservationById(id, ownerKey) {
  ensureSupabase()
  if (!ownerKey) return null

  const { data, error } = await supabase
    .from('reservations')
    .select('*')
    .eq('id', id)
    .eq('owner_key', ownerKey)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return normalizeReservationRow(data)
}

export async function saveReservation(payload, reservationId, ownerKey) {
  ensureSupabase()
  if (!ownerKey) throw new Error('ownerKey is required to save a reservation')

  // Force effective ownerKey on the payload
  const safePayload = { ...payload, owner_key: ownerKey }

  if (reservationId) {
    const { data, error } = await supabase
      .from('reservations')
      .update(safePayload)
      .eq('id', reservationId)
      .eq('owner_key', ownerKey)
      .select('*')
      .single()

    if (error) throw new Error(error.message)
    return normalizeReservationRow(data)
  }

  const { data, error } = await supabase
    .from('reservations')
    .insert(safePayload)
    .select('*')
    .single()

  if (error) throw new Error(error.message)
  return normalizeReservationRow(data)
}

export async function deleteReservation(reservationId, ownerKey) {
  ensureSupabase()
  if (!ownerKey) return

  const { error } = await supabase
    .from('reservations')
    .delete()
    .eq('id', reservationId)
    .eq('owner_key', ownerKey)

  if (error) throw new Error(error.message)
}

export async function updateWorkEventStatus(eventId, status, ownerKey) {
  ensureSupabase()
  if (!ownerKey) throw new Error('ownerKey is required to update status')

  // First verify ownership of the parent reservation
  const { data: eventVerify, error: verifyError } = await supabase
    .from('work_events')
    .select('id, reservations!inner(owner_key)')
    .eq('id', eventId)
    .eq('reservations.owner_key', ownerKey)
    .maybeSingle()

  if (verifyError || !eventVerify) {
    throw new Error('You do not have permission to update this event or it does not exist.')
  }

  const { data, error } = await supabase
    .from('work_events')
    .update({ status })
    .eq('id', eventId)
    .select('id, status')
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function listSchedulerWorkLogs(ownerKey) {
  ensureSupabase()
  if (!ownerKey) return []

  const { data, error } = await supabase
    .from('scheduler_work_logs')
    .select('*')
    .eq('owner_key', ownerKey)
    .order('date', { ascending: true })

  if (error) throw new Error(error.message)
  
  // Transform camelCase for consistency with existing UI usage
  return (data || []).map(row => ({
    ...row,
    weekStartDate: row.week_start_date,
    startTime: row.start_time,
    endTime: row.end_time,
    durationMinutes: row.duration_minutes,
    syncedAt: row.synced_at
  }))
}

export async function upsertSchedulerWorkLog(ownerKey, logEntry) {
  ensureSupabase()
  if (!ownerKey) throw new Error('ownerKey is required')

  const payload = {
    id: logEntry.id,
    owner_key: ownerKey,
    week_start_date: logEntry.weekStartDate,
    date: logEntry.date,
    start_time: logEntry.startTime,
    end_time: logEntry.endTime,
    duration_minutes: logEntry.durationMinutes,
    branch: logEntry.branch,
    room: logEntry.room,
    synced_at: new Date().toISOString()
  }

  const { data, error } = await supabase
    .from('scheduler_work_logs')
    .upsert(payload)
    .select('*')
    .single()

  if (error) throw new Error(error.message)
  
  return {
    ...data,
    weekStartDate: data.week_start_date,
    startTime: data.start_time,
    endTime: data.end_time,
    durationMinutes: data.duration_minutes,
    syncedAt: data.synced_at
  }
}

export async function deleteSchedulerWorkLogs(ownerKey, ids) {
  ensureSupabase()
  if (!ownerKey || !ids || ids.length === 0) return

  const { error } = await supabase
    .from('scheduler_work_logs')
    .delete()
    .eq('owner_key', ownerKey)
    .in('id', ids)

  if (error) throw new Error(error.message)
}

export async function migrateLocalWorkLogsToSupabase(ownerKey, localLogs) {
  ensureSupabase()
  if (!ownerKey || !localLogs || localLogs.length === 0) return

  const payloads = localLogs.map(log => ({
    id: log.id,
    owner_key: ownerKey,
    week_start_date: log.weekStartDate || log.week_start_date,
    date: log.date,
    start_time: log.startTime || log.start_time,
    end_time: log.endTime || log.end_time,
    duration_minutes: log.durationMinutes || log.duration_minutes,
    branch: log.branch,
    room: log.room,
    synced_at: new Date().toISOString()
  }))

  const { error } = await supabase
    .from('scheduler_work_logs')
    .upsert(payloads)

  if (error) throw new Error(error.message)
}

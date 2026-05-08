import { supabase } from '../lib/supabase'
import { getOrCreatePushDeviceId } from '../lib/device'
import { endOfDayIso, startOfDayIso } from './time'

function ensureSupabase() {
  if (!supabase) {
    throw new Error('Supabase 설정이 없어요. 환경변수를 확인해 주세요.')
  }
}

function getOwnerKeys(ownerKey) {
  const keys = [ownerKey].filter(Boolean)
  const deviceId = getOrCreatePushDeviceId()
  if (deviceId && deviceId !== ownerKey) keys.push(deviceId)
  return [...new Set(keys)]
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

  const deviceId = getOrCreatePushDeviceId()

  const { error: nullOwnerError } = await supabase
    .from('reservations')
    .update({ owner_key: ownerKey })
    .is('owner_key', null)

  if (nullOwnerError) {
    console.error('Failed to link unowned reservations:', nullOwnerError)
  }

  if (deviceId && deviceId !== ownerKey) {
    const { error: reservationError } = await supabase
      .from('reservations')
      .update({ owner_key: ownerKey })
      .eq('owner_key', deviceId)

    if (reservationError) {
      console.error('Failed to link device reservations:', reservationError)
    }

    const { error: workLogError } = await supabase
      .from('scheduler_work_logs')
      .update({ owner_key: ownerKey })
      .eq('owner_key', deviceId)

    if (workLogError) {
      console.error('Failed to link device work logs:', workLogError)
    }
  }
}

export async function listTodayWorkEvents(dateValue, ownerKey) {
  ensureSupabase()
  const ownerKeys = getOwnerKeys(ownerKey)
  if (ownerKeys.length === 0) return []

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
    .in('reservations.owner_key', ownerKeys)
    .gte('scheduled_at', startOfDayIso(dateValue))
    .lte('scheduled_at', endOfDayIso(dateValue))
    .order('scheduled_at', { ascending: true })

  if (error) throw new Error(error.message)
  return (data || []).map(normalizeEventRow)
}

export async function getReservationById(id, ownerKey) {
  ensureSupabase()
  const ownerKeys = getOwnerKeys(ownerKey)
  if (ownerKeys.length === 0) return null

  const { data, error } = await supabase
    .from('reservations')
    .select('*')
    .eq('id', id)
    .in('owner_key', ownerKeys)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return normalizeReservationRow(data)
}

export async function saveReservation(payload, reservationId, ownerKey) {
  ensureSupabase()
  if (!ownerKey) throw new Error('ownerKey is required to save a reservation')

  const safePayload = { ...payload, owner_key: ownerKey }
  const ownerKeys = getOwnerKeys(ownerKey)

  if (reservationId) {
    const { data, error } = await supabase
      .from('reservations')
      .update(safePayload)
      .eq('id', reservationId)
      .in('owner_key', ownerKeys)
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
  const ownerKeys = getOwnerKeys(ownerKey)
  if (ownerKeys.length === 0) return

  const { error } = await supabase
    .from('reservations')
    .delete()
    .eq('id', reservationId)
    .in('owner_key', ownerKeys)

  if (error) throw new Error(error.message)
}

export async function updateWorkEventStatus(eventId, status, ownerKey) {
  ensureSupabase()
  const ownerKeys = getOwnerKeys(ownerKey)
  if (ownerKeys.length === 0) throw new Error('ownerKey is required to update status')

  const { data: eventVerify, error: verifyError } = await supabase
    .from('work_events')
    .select('id, reservations!inner(owner_key)')
    .eq('id', eventId)
    .in('reservations.owner_key', ownerKeys)
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
  const ownerKeys = getOwnerKeys(ownerKey)
  if (ownerKeys.length === 0) return []

  const { data, error } = await supabase
    .from('scheduler_work_logs')
    .select('*')
    .in('owner_key', ownerKeys)
    .order('date', { ascending: true })

  if (error) throw new Error(error.message)
  
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
  const ownerKeys = getOwnerKeys(ownerKey)
  if (ownerKeys.length === 0 || !ids || ids.length === 0) return

  const { error } = await supabase
    .from('scheduler_work_logs')
    .delete()
    .in('owner_key', ownerKeys)
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

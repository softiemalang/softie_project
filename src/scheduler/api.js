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

export async function listTodayWorkEvents(dateValue) {
  ensureSupabase()

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
      reservations (
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
        notes_text
      )
    `)
    .gte('scheduled_at', startOfDayIso(dateValue))
    .lte('scheduled_at', endOfDayIso(dateValue))
    .order('scheduled_at', { ascending: true })

  if (error) throw new Error(error.message)
  return (data || []).map(normalizeEventRow)
}

export async function getReservationById(id) {
  ensureSupabase()

  const { data, error } = await supabase
    .from('reservations')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return normalizeReservationRow(data)
}

export async function saveReservation(payload, reservationId) {
  ensureSupabase()

  if (reservationId) {
    const { data, error } = await supabase
      .from('reservations')
      .update(payload)
      .eq('id', reservationId)
      .select('*')
      .single()

    if (error) throw new Error(error.message)
    return normalizeReservationRow(data)
  }

  const { data, error } = await supabase
    .from('reservations')
    .insert(payload)
    .select('*')
    .single()

  if (error) throw new Error(error.message)
  return normalizeReservationRow(data)
}

export async function deleteReservation(reservationId) {
  ensureSupabase()

  const { error } = await supabase
    .from('reservations')
    .delete()
    .eq('id', reservationId)

  if (error) throw new Error(error.message)
}

export async function updateWorkEventStatus(eventId, status) {
  ensureSupabase()

  const { data, error } = await supabase
    .from('work_events')
    .update({ status })
    .eq('id', eventId)
    .select('id, status')
    .single()

  if (error) throw new Error(error.message)
  return data
}

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

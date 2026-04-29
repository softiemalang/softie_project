import { supabase } from '../lib/supabase'

export async function getRehearsalEvents(ownerKey) {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('rehearsal_events')
    .select('*')
    .eq('owner_key', ownerKey)
    .order('event_date', { ascending: true })
    .order('start_time', { ascending: true })

  if (error) {
    console.error('Failed to get rehearsal events', error)
    throw error
  }
  return data
}

export async function createRehearsalEvent(eventData) {
  if (!supabase) throw new Error('Supabase client not initialized')
  const { data, error } = await supabase
    .from('rehearsal_events')
    .insert([eventData])
    .select()
    .single()

  if (error) {
    console.error('Failed to create rehearsal event', error)
    throw error
  }
  return data
}

export async function deleteRehearsalEvent(id) {
  if (!supabase) return
  const { error } = await supabase
    .from('rehearsal_events')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Failed to delete rehearsal event', error)
    throw error
  }
}

export async function triggerRehearsalDriveBackup(userId, yearMonth) {
  if (!supabase) throw new Error('Supabase client not initialized')
  const { data, error } = await supabase.functions.invoke('google-drive-rehearsal-backup', {
    body: { userId, yearMonth }
  })
  if (error) throw error
  if (data && data.error) throw new Error(data.error)
  return data
}

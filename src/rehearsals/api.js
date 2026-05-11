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

export async function updateRehearsalEvent(id, eventData) {
  if (!supabase) throw new Error('Supabase client not initialized')
  const { data, error } = await supabase
    .from('rehearsal_events')
    .update(eventData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Failed to update rehearsal event', error)
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

export async function linkUnownedRehearsalsToOwner(ownerKey) {
  if (!supabase || !ownerKey) return
  const { error } = await supabase
    .from('rehearsal_events')
    .update({ owner_key: ownerKey })
    .is('owner_key', null)
  
  if (error) {
    console.error('Failed to link unowned rehearsals:', error)
  }
}

export async function linkLocalRehearsalEventsToUser(localOwnerKey, userId) {
  if (!supabase || !localOwnerKey || !userId || localOwnerKey === userId) return
  
  const { error } = await supabase
    .from('rehearsal_events')
    .update({ owner_key: userId })
    .eq('owner_key', localOwnerKey)
  
  if (error) {
    console.error('Failed to link local rehearsal events to user:', error)
  }
}

export async function triggerRehearsalDriveBackup(userId, yearMonth) {
  if (!supabase) throw new Error('Supabase client not initialized')
  const { data, error } = await supabase.functions.invoke('google-drive-rehearsal-backup', {
    body: { userId, yearMonth }
  })
  
  if (error) {
    let msg = error.message
    if (error.context && typeof error.context.json === 'function') {
      try {
        const json = await error.context.json()
        if (json.error) msg = json.error
      } catch {}
    } else if (error.context && typeof error.context.text === 'function') {
      try {
        const text = await error.context.text()
        try {
          const json = JSON.parse(text)
          if (json.error) msg = json.error
        } catch {
          msg = text
        }
      } catch {}
    }
    throw new Error(msg)
  }
  
  if (data && data.error) throw new Error(data.error)
  return data
}

export async function createKakaoCalendarEvent(payload) {
  if (!supabase) throw new Error('Supabase client not initialized')
  const { data, error } = await supabase.functions.invoke('kakao-calendar-create-event', {
    body: payload
  })

  if (error) {
    let msg = error.message
    if (error.context && typeof error.context.json === 'function') {
      try {
        const json = await error.context.json()
        if (json.error) msg = json.error
      } catch {}
    } else if (error.context && typeof error.context.text === 'function') {
      try {
        const text = await error.context.text()
        try {
          const json = JSON.parse(text)
          if (json.error) msg = json.error
        } catch {
          msg = text
        }
      } catch {}
    }
    throw new Error(msg)
  }

  if (data && data.error) throw new Error(data.error)
  return data
}

export async function updateKakaoCalendarEvent(payload) {
  if (!supabase) throw new Error('Supabase client not initialized')
  const { data, error } = await supabase.functions.invoke('kakao-calendar-update-event', {
    body: payload
  })

  if (error) {
    let msg = error.message
    if (error.context && typeof error.context.json === 'function') {
      try {
        const json = await error.context.json()
        if (json.error) msg = json.error
      } catch {}
    } else if (error.context && typeof error.context.text === 'function') {
      try {
        const text = await error.context.text()
        try {
          const json = JSON.parse(text)
          if (json.error) msg = json.error
        } catch {
          msg = text
        }
      } catch {}
    }
    throw new Error(msg)
  }

  if (data && data.error) throw new Error(data.error)
  return data
}

export async function deleteKakaoCalendarEvent(payload) {
  if (!supabase) throw new Error('Supabase client not initialized')
  const { data, error } = await supabase.functions.invoke('kakao-calendar-delete-event', {
    body: payload
  })

  if (error) {
    let msg = error.message
    if (error.context && typeof error.context.json === 'function') {
      try {
        const json = await error.context.json()
        if (json.error) msg = json.error
      } catch {}
    } else if (error.context && typeof error.context.text === 'function') {
      try {
        const text = await error.context.text()
        try {
          const json = JSON.parse(text)
          if (json.error) msg = json.error
        } catch {
          msg = text
        }
      } catch {}
    }
    throw new Error(msg)
  }

  if (data && data.error) throw new Error(data.error)
  return data
}

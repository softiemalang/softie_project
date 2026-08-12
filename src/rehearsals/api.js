import { supabase } from '../lib/supabase'

const LOCAL_REHEARSAL_EVENTS_KEY_PREFIX = 'softie:rehearsal-events:'

function getLocalStorageKey(ownerKey) {
  return `${LOCAL_REHEARSAL_EVENTS_KEY_PREFIX}${encodeURIComponent(ownerKey || 'anonymous')}`
}

function readLocalEvents(ownerKey) {
  if (typeof window === 'undefined' || !ownerKey) return []

  try {
    const raw = window.localStorage.getItem(getLocalStorageKey(ownerKey))
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeLocalEvents(ownerKey, events) {
  if (typeof window === 'undefined' || !ownerKey) return
  window.localStorage.setItem(getLocalStorageKey(ownerKey), JSON.stringify(events))
}

function sortEvents(events) {
  return [...events].sort((left, right) => {
    const dateOrder = String(left.event_date || '').localeCompare(String(right.event_date || ''))
    if (dateOrder !== 0) return dateOrder
    return String(left.start_time || '').localeCompare(String(right.start_time || ''))
  })
}

function createLocalEventId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `local-rehearsal-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

async function getAuthenticatedUserId() {
  if (!supabase) return null
  const { data, error } = await supabase.auth.getSession()
  if (error) {
    console.warn('[rehearsals] Failed to resolve auth session:', error)
    return null
  }
  return data.session?.user?.id || null
}

export async function getRehearsalEvents(ownerKey) {
  if (!ownerKey) return []
  const userId = await getAuthenticatedUserId()

  if (!userId) {
    return sortEvents(readLocalEvents(ownerKey))
  }

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
  const userId = await getAuthenticatedUserId()

  if (!userId) {
    const ownerKey = eventData?.owner_key
    if (!ownerKey) throw new Error('Anonymous rehearsal events require a local owner key')

    const now = new Date().toISOString()
    const event = {
      ...eventData,
      id: eventData.id || createLocalEventId(),
      created_at: eventData.created_at || now,
      updated_at: now,
    }
    writeLocalEvents(ownerKey, [...readLocalEvents(ownerKey), event])
    return event
  }

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
  const userId = await getAuthenticatedUserId()

  if (!userId) {
    const ownerKey = eventData?.owner_key
    const events = readLocalEvents(ownerKey)
    const index = events.findIndex((event) => event.id === id)
    if (index < 0) throw new Error('Local rehearsal event not found')

    const updated = {
      ...events[index],
      ...eventData,
      id,
      updated_at: new Date().toISOString(),
    }
    events[index] = updated
    writeLocalEvents(ownerKey, events)
    return updated
  }

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

export async function deleteRehearsalEvent(id, ownerKey) {
  const userId = await getAuthenticatedUserId()

  if (!userId) {
    const events = readLocalEvents(ownerKey)
    writeLocalEvents(ownerKey, events.filter((event) => event.id !== id))
    return
  }

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

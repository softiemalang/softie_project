import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const SLOTS = [
  '18:00',
  '18:30',
  '19:00',
  '19:30',
  '20:00',
  '20:30',
  '21:00',
  '21:30',
  '22:00',
  '22:30',
]
const MEMBER_KEY = 'band-room-member'

function makeRoomCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase()
}

function simpleHash(value) {
  let hash = 0
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i)
    hash |= 0
  }
  return String(hash)
}

function emptyAvailabilityMap() {
  const next = {}
  DAYS.forEach((_, dayIndex) => {
    SLOTS.forEach((__, slotIndex) => {
      next[`${dayIndex}-${slotIndex}`] = false
    })
  })
  return next
}

function toBestTimes(availabilities, members) {
  const totals = {}

  availabilities.forEach((row) => {
    if (!row.is_available) return

    const key = `${row.day_of_week}-${row.slot_index}`
    if (!totals[key]) {
      totals[key] = {
        day: row.day_of_week,
        slot: row.slot_index,
        count: 0,
        memberIds: [],
      }
    }

    totals[key].count += 1
    totals[key].memberIds.push(row.member_id)
  })

  return Object.values(totals)
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count
      if (a.day !== b.day) return a.day - b.day
      return a.slot - b.slot
    })
    .map((item) => ({
      ...item,
      label: `${DAYS[item.day]} ${SLOTS[item.slot]}`,
      names: members
        .filter((member) => item.memberIds.includes(member.id))
        .map((member) => member.display_name),
    }))
}

export default function App() {
  const [roomName, setRoomName] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [pin, setPin] = useState('')
  const [status, setStatus] = useState('')
  const [room, setRoom] = useState(null)
  const [member, setMember] = useState(null)
  const [members, setMembers] = useState([])
  const [availabilityMap, setAvailabilityMap] = useState(emptyAvailabilityMap)
  const [allAvailabilities, setAllAvailabilities] = useState([])
  const [isBusy, setIsBusy] = useState(false)

  const bestTimes = useMemo(
    () => toBestTimes(allAvailabilities, members).slice(0, 8),
    [allAvailabilities, members],
  )

  useEffect(() => {
    const saved = localStorage.getItem(MEMBER_KEY)
    if (!saved) return

    try {
      const parsed = JSON.parse(saved)
      if (parsed?.room && parsed?.member) {
        setRoom(parsed.room)
        setMember(parsed.member)
      }
    } catch {
      localStorage.removeItem(MEMBER_KEY)
    }
  }, [])

  useEffect(() => {
    if (!room?.id || !member?.id) return
    refreshRoomData(room.id, member.id)
  }, [room?.id, member?.id])

  async function refreshRoomData(roomId, memberId) {
    if (!supabase) return

    const [{ data: memberRows, error: membersError }, { data: availabilityRows, error: availabilityError }] =
      await Promise.all([
        supabase
          .from('members')
          .select('id, room_id, display_name, created_at')
          .eq('room_id', roomId)
          .order('created_at', { ascending: true }),
        supabase
          .from('availabilities')
          .select('member_id, day_of_week, slot_index, is_available')
          .eq('room_id', roomId),
      ])

    if (membersError || availabilityError) {
      setStatus(membersError?.message || availabilityError?.message || 'Failed to load room')
      return
    }

    setMembers(memberRows || [])
    setAllAvailabilities(availabilityRows || [])

    const nextMap = emptyAvailabilityMap()
    ;(availabilityRows || []).forEach((row) => {
      if (row.member_id === memberId) {
        nextMap[`${row.day_of_week}-${row.slot_index}`] = !!row.is_available
      }
    })
    setAvailabilityMap(nextMap)
  }

  async function createRoom() {
    if (!supabase) {
      setStatus('Missing Supabase environment variables.')
      return
    }
    if (!roomName.trim()) {
      setStatus('Enter a room name.')
      return
    }

    setIsBusy(true)
    setStatus('')

    const roomCode = makeRoomCode()
    const { data, error } = await supabase
      .from('rooms')
      .insert({
        name: roomName.trim(),
        room_code: roomCode,
      })
      .select()
      .single()

    setIsBusy(false)

    if (error) {
      setStatus(error.message)
      return
    }

    setRoom(data)
    setJoinCode(data.room_code)
    setStatus(`Room created. Share code ${data.room_code}.`)
  }

  async function joinRoom() {
    if (!supabase) {
      setStatus('Missing Supabase environment variables.')
      return
    }
    if (!joinCode.trim() || !displayName.trim() || pin.trim().length !== 4) {
      setStatus('Enter room code, display name, and a 4-digit PIN.')
      return
    }

    setIsBusy(true)
    setStatus('')

    const normalizedCode = joinCode.trim().toUpperCase()
    const normalizedName = displayName.trim()
    const pinHash = simpleHash(pin.trim())

    const { data: roomRow, error: roomError } = await supabase
      .from('rooms')
      .select('*')
      .eq('room_code', normalizedCode)
      .single()

    if (roomError || !roomRow) {
      setIsBusy(false)
      setStatus(roomError?.message || 'Room not found.')
      return
    }

    const { data: existingMember, error: memberLookupError } = await supabase
      .from('members')
      .select('*')
      .eq('room_id', roomRow.id)
      .eq('display_name', normalizedName)
      .maybeSingle()

    if (memberLookupError) {
      setIsBusy(false)
      setStatus(memberLookupError.message)
      return
    }

    let memberRow = existingMember

    if (!existingMember) {
      const { data: createdMember, error: createMemberError } = await supabase
        .from('members')
        .insert({
          room_id: roomRow.id,
          display_name: normalizedName,
          pin_hash: pinHash,
        })
        .select()
        .single()

      if (createMemberError) {
        setIsBusy(false)
        setStatus(createMemberError.message)
        return
      }

      memberRow = createdMember
    } else if (existingMember.pin_hash !== pinHash) {
      setIsBusy(false)
      setStatus('PIN does not match this member.')
      return
    }

    setRoom(roomRow)
    setMember(memberRow)
    localStorage.setItem(
      MEMBER_KEY,
      JSON.stringify({
        room: roomRow,
        member: {
          id: memberRow.id,
          display_name: memberRow.display_name,
          room_id: memberRow.room_id,
        },
      }),
    )

    await refreshRoomData(roomRow.id, memberRow.id)
    setIsBusy(false)
    setStatus(`Joined ${roomRow.name}.`)
  }

  async function saveAvailability() {
    if (!supabase || !room?.id || !member?.id) return

    setIsBusy(true)
    setStatus('')

    const rows = DAYS.flatMap((_, dayIndex) =>
      SLOTS.map((__, slotIndex) => ({
        room_id: room.id,
        member_id: member.id,
        day_of_week: dayIndex,
        slot_index: slotIndex,
        is_available: !!availabilityMap[`${dayIndex}-${slotIndex}`],
      })),
    )

    const { error: deleteError } = await supabase
      .from('availabilities')
      .delete()
      .eq('room_id', room.id)
      .eq('member_id', member.id)

    if (deleteError) {
      setIsBusy(false)
      setStatus(deleteError.message)
      return
    }

    const { error: insertError } = await supabase
      .from('availabilities')
      .insert(rows)

    if (insertError) {
      setIsBusy(false)
      setStatus(insertError.message)
      return
    }

    await refreshRoomData(room.id, member.id)
    setIsBusy(false)
    setStatus('Availability saved.')
  }

  function toggleSlot(dayIndex, slotIndex) {
    const key = `${dayIndex}-${slotIndex}`
    setAvailabilityMap((current) => ({
      ...current,
      [key]: !current[key],
    }))
  }

  return (
    <div className="app-shell">
      <header className="hero">
        <p className="eyebrow">Band Rehearsal MVP</p>
        <h1>Find rehearsal times that work for everyone.</h1>
        <p className="subtle">
          Create a room, join with a display name and 4-digit PIN, then mark evening availability.
        </p>
      </header>

      {!room && (
        <section className="card">
          <h2>Create a room</h2>
          <input
            value={roomName}
            onChange={(event) => setRoomName(event.target.value)}
            placeholder="Band room name"
          />
          <button disabled={isBusy} onClick={createRoom}>
            Create room
          </button>
        </section>
      )}

      <section className="card">
        <h2>Join a room</h2>
        <div className="field-grid">
          <input
            value={joinCode}
            onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
            placeholder="Room code"
          />
          <input
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            placeholder="Display name"
          />
          <input
            inputMode="numeric"
            maxLength={4}
            value={pin}
            onChange={(event) => setPin(event.target.value.replace(/\D/g, '').slice(0, 4))}
            placeholder="4-digit PIN"
          />
        </div>
        <button disabled={isBusy} onClick={joinRoom}>
          Join room
        </button>
      </section>

      {status && <p className="status">{status}</p>}

      {room && member && (
        <>
          <section className="card room-card">
            <div>
              <h2>{room.name}</h2>
              <p className="subtle">Room code: {room.room_code}</p>
            </div>
            <div className="pill">You are {member.display_name}</div>
          </section>

          <section className="card">
            <div className="section-head">
              <div>
                <h2>Weekly availability</h2>
                <p className="subtle">Tap slots you can make. Evening only for this MVP.</p>
              </div>
              <button disabled={isBusy} onClick={saveAvailability}>
                Save
              </button>
            </div>

            <div className="availability-grid">
              <div className="grid-top-left" />
              {DAYS.map((day) => (
                <div key={day} className="day-label">
                  {day}
                </div>
              ))}

              {SLOTS.map((slot, slotIndex) => (
                <FragmentRow
                  key={slot}
                  slot={slot}
                  slotIndex={slotIndex}
                  availabilityMap={availabilityMap}
                  onToggle={toggleSlot}
                />
              ))}
            </div>
          </section>

          <section className="card">
            <h2>Best overlaps</h2>
            {bestTimes.length === 0 ? (
              <p className="subtle">No saved overlap data yet.</p>
            ) : (
              <div className="results">
                {bestTimes.map((item) => (
                  <div key={item.label} className="result-row">
                    <div>
                      <strong>{item.label}</strong>
                      <p>{item.count} members available</p>
                    </div>
                    <span>{item.names.join(', ')}</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="card">
            <h2>Members</h2>
            <div className="member-list">
              {members.map((memberRow) => (
                <div key={memberRow.id} className="member-pill">
                  {memberRow.display_name}
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  )
}

function FragmentRow({ slot, slotIndex, availabilityMap, onToggle }) {
  return (
    <>
      <div className="time-label">{slot}</div>
      {DAYS.map((_, dayIndex) => {
        const key = `${dayIndex}-${slotIndex}`
        const isActive = availabilityMap[key]
        return (
          <button
            key={key}
            type="button"
            className={`slot-button ${isActive ? 'active' : ''}`}
            onClick={() => onToggle(dayIndex, slotIndex)}
            aria-pressed={isActive}
          >
            {isActive ? 'Yes' : ''}
          </button>
        )
      })}
    </>
  )
}

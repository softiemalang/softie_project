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

function isMemberSubmitted(memberId, availabilities) {
  return availabilities.some((row) => row.member_id === memberId)
}

function getFriendlyError(errorMessage) {
  if (!errorMessage) return 'Something went wrong. Please try again.'
  if (errorMessage.includes('JSON object requested')) {
    return 'We could not find that room. Please check the room code and try again.'
  }
  if (errorMessage.includes('duplicate key')) {
    return 'That room code or name already exists. Please try again.'
  }
  return errorMessage
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
  const [editingRoomName, setEditingRoomName] = useState('')
  const [deleteRoomName, setDeleteRoomName] = useState('')

  const submittedMembers = useMemo(
    () => members.filter((memberRow) => isMemberSubmitted(memberRow.id, allAvailabilities)),
    [allAvailabilities, members],
  )
  const missingMembers = useMemo(
    () => members.filter((memberRow) => !isMemberSubmitted(memberRow.id, allAvailabilities)),
    [allAvailabilities, members],
  )
  const bestTimes = useMemo(() => toBestTimes(allAvailabilities, members), [allAvailabilities, members])
  const fullyMatchedTimes = useMemo(
    () => bestTimes.filter((item) => members.length > 0 && item.count === members.length),
    [bestTimes, members.length],
  )
  const almostMatchedTimes = useMemo(
    () => bestTimes.filter((item) => members.length > 1 && item.count === members.length - 1),
    [bestTimes, members.length],
  )
  const recommendedTimes = useMemo(() => bestTimes.slice(0, 10), [bestTimes])

  useEffect(() => {
    const saved = localStorage.getItem(MEMBER_KEY)
    if (!saved) return

    try {
      const parsed = JSON.parse(saved)
      if (parsed?.room && parsed?.member) {
        setRoom(parsed.room)
        setMember(parsed.member)
        setEditingRoomName(parsed.room.name || '')
      }
    } catch {
      localStorage.removeItem(MEMBER_KEY)
    }
  }, [])

  useEffect(() => {
    if (!room?.id || !member?.id) return
    setEditingRoomName(room.name || '')
    refreshRoomData(room.id, member.id)
  }, [room?.id, member?.id])

  async function refreshRoomData(roomId, memberId) {
    if (!supabase) return

    const [
      { data: roomRow, error: roomError },
      { data: memberRows, error: membersError },
      { data: availabilityRows, error: availabilityError },
    ] = await Promise.all([
      supabase.from('rooms').select('*').eq('id', roomId).maybeSingle(),
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

    if (roomError || membersError || availabilityError) {
      setStatus(getFriendlyError(roomError?.message || membersError?.message || availabilityError?.message))
      return
    }

    if (!roomRow) {
      localStorage.removeItem(MEMBER_KEY)
      setRoom(null)
      setMember(null)
      setMembers([])
      setAllAvailabilities([])
      setAvailabilityMap(emptyAvailabilityMap())
      setStatus('This room no longer exists.')
      return
    }

    setRoom(roomRow)
    setMembers(memberRows || [])
    setAllAvailabilities(availabilityRows || [])

    const nextMap = emptyAvailabilityMap()
    ;(availabilityRows || []).forEach((row) => {
      if (row.member_id === memberId) {
        nextMap[`${row.day_of_week}-${row.slot_index}`] = !!row.is_available
      }
    })
    setAvailabilityMap(nextMap)
    setEditingRoomName(roomRow.name || '')

    localStorage.setItem(
      MEMBER_KEY,
      JSON.stringify({
        room: roomRow,
        member,
      }),
    )
  }

  async function createRoom() {
    if (!supabase) {
      setStatus('Supabase settings are missing. Please check your environment variables.')
      return
    }
    if (!roomName.trim()) {
      setStatus('Please enter a room name first.')
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
      setStatus(getFriendlyError(error.message))
      return
    }

    setRoom(data)
    setEditingRoomName(data.name)
    setJoinCode(data.room_code)
    setStatus(`Room created. Share code ${data.room_code} with your band.`)
  }

  async function joinRoom() {
    if (!supabase) {
      setStatus('Supabase settings are missing. Please check your environment variables.')
      return
    }
    if (!joinCode.trim()) {
      setStatus('Please enter a room code.')
      return
    }
    if (!displayName.trim()) {
      setStatus('Please enter your display name.')
      return
    }
    if (pin.trim().length !== 4) {
      setStatus('Please enter a 4-digit PIN.')
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
      .maybeSingle()

    if (roomError || !roomRow) {
      setIsBusy(false)
      setStatus('We could not find a room with that code.')
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
      setStatus(getFriendlyError(memberLookupError.message))
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
        setStatus(getFriendlyError(createMemberError.message))
        return
      }

      memberRow = createdMember
    } else if (existingMember.pin_hash !== pinHash) {
      setIsBusy(false)
      setStatus(`That name already exists in this room. Enter the matching 4-digit PIN for ${normalizedName}.`)
      return
    }

    const memberInfo = {
      id: memberRow.id,
      display_name: memberRow.display_name,
      room_id: memberRow.room_id,
    }

    setRoom(roomRow)
    setMember(memberInfo)
    setEditingRoomName(roomRow.name)
    localStorage.setItem(
      MEMBER_KEY,
      JSON.stringify({
        room: roomRow,
        member: memberInfo,
      }),
    )

    await refreshRoomData(roomRow.id, memberRow.id)
    setIsBusy(false)
    setStatus(`You joined ${roomRow.name}.`)
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
      setStatus('We could not update your previous availability. Please try again.')
      return
    }

    const { error: insertError } = await supabase.from('availabilities').insert(rows)

    if (insertError) {
      setIsBusy(false)
      setStatus('We could not save your availability. Please try again.')
      return
    }

    await refreshRoomData(room.id, member.id)
    setIsBusy(false)
    setStatus('Availability saved for this week.')
  }

  async function updateRoomName() {
    if (!supabase || !room?.id) return
    if (!editingRoomName.trim()) {
      setStatus('Please enter a room name.')
      return
    }
    if (editingRoomName.trim() === room.name) {
      setStatus('Room name is already up to date.')
      return
    }

    setIsBusy(true)
    setStatus('')

    const { data, error } = await supabase
      .from('rooms')
      .update({ name: editingRoomName.trim() })
      .eq('id', room.id)
      .select()
      .single()

    setIsBusy(false)

    if (error) {
      setStatus('We could not update the room name. Please try again.')
      return
    }

    setRoom(data)
    localStorage.setItem(
      MEMBER_KEY,
      JSON.stringify({
        room: data,
        member,
      }),
    )
    setDeleteRoomName('')
    setStatus('Room name updated.')
  }

  async function deleteRoom() {
    if (!supabase || !room?.id) return
    if (deleteRoomName !== room.name) return

    setIsBusy(true)
    setStatus('')

    const { error: availabilityError } = await supabase
      .from('availabilities')
      .delete()
      .eq('room_id', room.id)

    if (availabilityError) {
      setIsBusy(false)
      setStatus('We could not remove this room. Please try again.')
      return
    }

    const { error: memberError } = await supabase.from('members').delete().eq('room_id', room.id)

    if (memberError) {
      setIsBusy(false)
      setStatus('We could not remove this room. Please try again.')
      return
    }

    const { error: roomError } = await supabase.from('rooms').delete().eq('id', room.id)

    setIsBusy(false)

    if (roomError) {
      setStatus('We could not remove this room. Please try again.')
      return
    }

    localStorage.removeItem(MEMBER_KEY)
    setRoom(null)
    setMember(null)
    setMembers([])
    setAllAvailabilities([])
    setAvailabilityMap(emptyAvailabilityMap())
    setDeleteRoomName('')
    setEditingRoomName('')
    setStatus('Room deleted.')
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
        <p className="eyebrow">Band Rehearsal Planner</p>
        <h1>Set one room, collect availability, and find the cleanest overlap fast.</h1>
        <p className="subtle">
          Built for small bands that just need a simple weekly rehearsal decision.
        </p>
      </header>

      {!room && (
        <section className="card">
          <div className="card-header">
            <div>
              <p className="section-kicker">Start a room</p>
              <h2>Create a room</h2>
            </div>
          </div>
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
        <div className="card-header">
          <div>
            <p className="section-kicker">Join an existing room</p>
            <h2>Join with code and PIN</h2>
          </div>
        </div>
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
          <section className="card room-hero-card">
            <div className="room-hero-top">
              <div>
                <p className="section-kicker">Current room</p>
                <h2 className="room-title">{room.name}</h2>
                <p className="subtle">Room code {room.room_code}</p>
              </div>
              <div className="pill">You joined as {member.display_name}</div>
            </div>

            <div className="room-meta-grid">
              <div className="meta-card">
                <span className="meta-label">Members</span>
                <strong>{members.length}</strong>
              </div>
              <div className="meta-card">
                <span className="meta-label">Submitted</span>
                <strong>{submittedMembers.length}</strong>
              </div>
            </div>

            <div className="member-list">
              {members.map((memberRow) => (
                <div key={memberRow.id} className="member-pill">
                  {memberRow.display_name}
                </div>
              ))}
            </div>

            <p className="summary-line">
              {missingMembers.length > 0
                ? `Still not submitted: ${missingMembers.map((memberRow) => memberRow.display_name).join(', ')}`
                : 'Everyone has submitted their availability.'}
            </p>
          </section>

          <section className="card">
            <div className="card-header">
              <div>
                <p className="section-kicker">Room settings</p>
                <h2>Edit room name</h2>
              </div>
            </div>
            <div className="inline-form">
              <input
                value={editingRoomName}
                onChange={(event) => setEditingRoomName(event.target.value)}
                placeholder="Room name"
              />
              <button disabled={isBusy} onClick={updateRoomName}>
                Save name
              </button>
            </div>
          </section>

          <section className="card">
            <div className="section-head">
              <div>
                <p className="section-kicker">Weekly plan</p>
                <h2>Weekly availability</h2>
                <p className="subtle">Tap the evening slots you can make, then save once.</p>
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
                <AvailabilityRow
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
            <div className="card-header">
              <div>
                <p className="section-kicker">Recommendations</p>
                <h2>Best rehearsal times</h2>
              </div>
            </div>

            <ResultSection
              title="Everyone can make it"
              emptyText="No fully matched times yet."
              items={fullyMatchedTimes}
              totalMembers={members.length}
            />
            <ResultSection
              title="Only one member missing"
              emptyText="No near-perfect matches yet."
              items={almostMatchedTimes}
              totalMembers={members.length}
            />
            <ResultSection
              title="Overall ranking"
              emptyText="No saved overlap data yet."
              items={recommendedTimes}
              totalMembers={members.length}
            />
          </section>

          <section className="card danger-card">
            <div className="card-header">
              <div>
                <p className="section-kicker">Danger zone</p>
                <h2>Delete room</h2>
              </div>
            </div>
            <p className="warning-copy">
              Deleting this room will also remove all members and saved availability data.
            </p>
            <input
              value={deleteRoomName}
              onChange={(event) => setDeleteRoomName(event.target.value)}
              placeholder={`Type "${room.name}" to confirm`}
            />
            <button
              className="danger-button"
              disabled={isBusy || deleteRoomName !== room.name}
              onClick={deleteRoom}
            >
              Delete room
            </button>
          </section>
        </>
      )}
    </div>
  )
}

function AvailabilityRow({ slot, slotIndex, availabilityMap, onToggle }) {
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

function ResultSection({ title, emptyText, items, totalMembers }) {
  return (
    <div className="result-group">
      <h3>{title}</h3>
      {items.length === 0 ? (
        <p className="subtle">{emptyText}</p>
      ) : (
        <div className="results">
          {items.map((item) => (
            <div key={`${title}-${item.label}`} className="result-row">
              <div>
                <strong>{item.label}</strong>
                <p>{item.names.join(', ') || 'No member names yet'}</p>
              </div>
              <div className="result-count">{item.count}/{totalMembers || 0} available</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

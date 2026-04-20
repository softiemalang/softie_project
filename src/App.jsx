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
  if (!errorMessage) return '문제가 발생했어요. 다시 시도해 주세요.'
  if (errorMessage.includes('JSON object requested')) {
    return '방을 찾지 못했어요. 방 코드를 다시 확인해 주세요.'
  }
  if (errorMessage.includes('duplicate key')) {
    return '이미 사용 중인 값이 있어요. 다른 값으로 다시 시도해 주세요.'
  }
  return errorMessage
}

function mapsEqual(left, right) {
  const leftKeys = Object.keys(left)
  const rightKeys = Object.keys(right)
  if (leftKeys.length !== rightKeys.length) return false
  return leftKeys.every((key) => left[key] === right[key])
}

function getMemberAvailabilityMap(availabilities, memberId) {
  const nextMap = emptyAvailabilityMap()
  if (!memberId) return nextMap

  availabilities.forEach((row) => {
    if (row.member_id === memberId) {
      nextMap[`${row.day_of_week}-${row.slot_index}`] = !!row.is_available
    }
  })
  return nextMap
}

function makeMemberInfo(memberRow) {
  if (!memberRow) return null
  return {
    id: memberRow.id,
    room_id: memberRow.room_id,
    display_name: memberRow.display_name,
  }
}

async function findMembersByIdentity(roomId, displayName) {
  const { data, error } = await supabase
    .from('members')
    .select('id, room_id, display_name, pin_hash, created_at')
    .eq('room_id', roomId)
    .eq('display_name', displayName)
    .order('created_at', { ascending: true })

  if (error) {
    throw new Error(getFriendlyError(error.message))
  }

  return data || []
}

export default function App() {
  const [roomName, setRoomName] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [pin, setPin] = useState('')
  const [status, setStatus] = useState('')
  const [room, setRoom] = useState(null)
  const [member, setMember] = useState(null)
  const [pendingRoomSession, setPendingRoomSession] = useState(null)
  const [isReauthMode, setIsReauthMode] = useState(false)
  const [members, setMembers] = useState([])
  const [availabilityMap, setAvailabilityMap] = useState(emptyAvailabilityMap)
  const [savedAvailabilityMap, setSavedAvailabilityMap] = useState(emptyAvailabilityMap)
  const [allAvailabilities, setAllAvailabilities] = useState([])
  const [isBusy, setIsBusy] = useState(false)
  const [isLoadingRoom, setIsLoadingRoom] = useState(false)
  const [editingRoomName, setEditingRoomName] = useState('')
  const [deleteRoomName, setDeleteRoomName] = useState('')
  const [memberDisplayName, setMemberDisplayName] = useState('')
  const [currentPinInput, setCurrentPinInput] = useState('')
  const [newPinInput, setNewPinInput] = useState('')
  const [reauthName, setReauthName] = useState('')
  const [reauthPin, setReauthPin] = useState('')

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
  const hasUnsavedChanges = useMemo(
    () => !mapsEqual(availabilityMap, savedAvailabilityMap),
    [availabilityMap, savedAvailabilityMap],
  )
  const needsReauth = Boolean(isReauthMode && room && !member)

  useEffect(() => {
    const saved = localStorage.getItem(MEMBER_KEY)
    if (!saved) return

    try {
      const parsed = JSON.parse(saved)
      if (parsed?.room && parsed?.member) {
        setRoom(parsed.room)
        setEditingRoomName(parsed.room.name || '')
        setJoinCode(parsed.room.room_code || '')
        setMember(parsed.member)
        setMemberDisplayName(parsed.member.display_name || '')
        setReauthName(parsed.member.display_name || '')
        setIsReauthMode(false)
      } else if (parsed?.room) {
        setPendingRoomSession(parsed.room)
        setJoinCode(parsed.room.room_code || '')
        setIsReauthMode(false)
      }
    } catch {
      localStorage.removeItem(MEMBER_KEY)
    }
  }, [])

  useEffect(() => {
    if (!room?.id || !supabase) return
    loadRoomState({
      roomId: room.id,
      memberId: member?.id || null,
      preserveDraft: true,
    })
  }, [room?.id, member?.id])

  function persistSession(nextRoom, nextMember) {
    if (!nextRoom) {
      localStorage.removeItem(MEMBER_KEY)
      return
    }

    const payload = { room: nextRoom }
    if (nextMember) payload.member = nextMember
    localStorage.setItem(MEMBER_KEY, JSON.stringify(payload))
  }

  function clearLocalSession() {
    localStorage.removeItem(MEMBER_KEY)
    setRoom(null)
    setMember(null)
    setPendingRoomSession(null)
    setIsReauthMode(false)
    setMembers([])
    setAllAvailabilities([])
    setAvailabilityMap(emptyAvailabilityMap())
    setSavedAvailabilityMap(emptyAvailabilityMap())
    setDeleteRoomName('')
    setEditingRoomName('')
    setMemberDisplayName('')
    setCurrentPinInput('')
    setNewPinInput('')
    setReauthName('')
    setReauthPin('')
    setJoinCode('')
  }

  function clearPendingRoomSession() {
    setPendingRoomSession(null)
    setReauthName('')
    setReauthPin('')
    setIsReauthMode(false)
    if (!room) {
      localStorage.removeItem(MEMBER_KEY)
      setJoinCode('')
    }
  }

  function continueExistingRoom() {
    if (!pendingRoomSession) return
    setRoom(pendingRoomSession)
    setEditingRoomName(pendingRoomSession.name || '')
    setJoinCode(pendingRoomSession.room_code || '')
    setPendingRoomSession(null)
    setIsReauthMode(true)
    setStatus('')
  }

  function goHome() {
    setRoom(null)
    setMember(null)
    setMembers([])
    setAllAvailabilities([])
    setAvailabilityMap(emptyAvailabilityMap())
    setSavedAvailabilityMap(emptyAvailabilityMap())
    setEditingRoomName('')
    setDeleteRoomName('')
    setMemberDisplayName('')
    setCurrentPinInput('')
    setNewPinInput('')
    setReauthName('')
    setReauthPin('')
    setIsReauthMode(false)
    setStatus('')
  }

  function applyLoadedState({ roomRow, memberRows, availabilityRows, activeMember, preserveDraft }) {
    const nextMember = makeMemberInfo(activeMember)
    const nextSavedMap = getMemberAvailabilityMap(availabilityRows, nextMember?.id)

    setRoom(roomRow)
    setMembers(memberRows)
    setAllAvailabilities(availabilityRows)
    setEditingRoomName(roomRow.name || '')
    setJoinCode(roomRow.room_code || '')
    setMember(nextMember)
    setMemberDisplayName(nextMember?.display_name || '')
    setReauthName(nextMember?.display_name || '')
    setSavedAvailabilityMap(nextSavedMap)
    setAvailabilityMap((current) => {
      if (preserveDraft && nextMember?.id && !mapsEqual(current, nextSavedMap)) {
        return current
      }
      return nextSavedMap
    })
    persistSession(roomRow, nextMember)
  }

  async function fetchRoomBundle(roomId) {
    const [
      { data: roomRow, error: roomError },
      { data: memberRows, error: membersError },
      { data: availabilityRows, error: availabilityError },
    ] = await Promise.all([
      supabase.from('rooms').select('*').eq('id', roomId).maybeSingle(),
      supabase
        .from('members')
        .select('id, room_id, display_name, pin_hash, created_at')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true }),
      supabase
        .from('availabilities')
        .select('id, room_id, member_id, day_of_week, slot_index, is_available')
        .eq('room_id', roomId),
    ])

    if (roomError || membersError || availabilityError) {
      throw new Error(getFriendlyError(roomError?.message || membersError?.message || availabilityError?.message))
    }

    return {
      roomRow,
      memberRows: memberRows || [],
      availabilityRows: availabilityRows || [],
    }
  }

  async function loadRoomState({ roomId, memberId, preserveDraft = false, silent = false }) {
    if (!supabase || !roomId) return null

    if (!silent) setIsLoadingRoom(true)

    try {
      const { roomRow, memberRows, availabilityRows } = await fetchRoomBundle(roomId)

      if (!roomRow) {
        clearLocalSession()
        setStatus('This room no longer exists.')
        return null
      }

      const activeMember = memberId
        ? memberRows.find((memberRow) => memberRow.id === memberId) || null
        : null

      if (memberId && !activeMember) {
        setRoom(null)
        setMember(null)
        setPendingRoomSession(roomRow)
        setIsReauthMode(false)
        setMembers([])
        setAllAvailabilities([])
        setEditingRoomName('')
        setJoinCode(roomRow.room_code || '')
        setMemberDisplayName('')
        setCurrentPinInput('')
        setNewPinInput('')
        setSavedAvailabilityMap(emptyAvailabilityMap())
        setAvailabilityMap(emptyAvailabilityMap())
        setReauthName('')
        setReauthPin('')
        persistSession(roomRow, null)
        setStatus('Your saved member session is no longer valid. Please re-enter your name and PIN.')
        return { roomRow, memberRows, availabilityRows, activeMember: null }
      }

      applyLoadedState({
        roomRow,
        memberRows,
        availabilityRows,
        activeMember,
        preserveDraft,
      })

      return { roomRow, memberRows, availabilityRows, activeMember }
    } catch (error) {
      setStatus(error.message)
      return null
    } finally {
      if (!silent) setIsLoadingRoom(false)
    }
  }

  async function createRoom() {
    if (!supabase) {
      setStatus('Supabase 설정이 없어요. 환경변수를 확인해 주세요.')
      return
    }
    if (!roomName.trim()) {
      setStatus('방 이름을 먼저 입력해 주세요.')
      return
    }

    setIsBusy(true)
    setStatus('')
    clearPendingRoomSession()
    setRoom(null)
    setMember(null)
    setIsReauthMode(false)

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
    persistSession(data, null)
    setStatus(`방이 만들어졌어요. 밴드원에게 코드 ${data.room_code}를 공유해 주세요.`)
  }

  async function joinRoom() {
    if (!supabase) {
      setStatus('Supabase 설정이 없어요. 환경변수를 확인해 주세요.')
      return
    }
    if (!joinCode.trim()) {
      setStatus('방 코드를 입력해 주세요.')
      return
    }
    if (!displayName.trim()) {
      setStatus('표시 이름을 입력해 주세요.')
      return
    }
    if (pin.trim().length !== 4) {
      setStatus('4자리 PIN을 입력해 주세요.')
      return
    }

    setIsBusy(true)
    setStatus('')

    const normalizedCode = joinCode.trim().toUpperCase()
    const normalizedName = displayName.trim()
    const pinHash = simpleHash(pin.trim())

    const { data: roomRow, error: roomError } = await supabase
      .from('rooms')
      .select('id, name, room_code, created_at')
      .eq('room_code', normalizedCode)
      .maybeSingle()

    if (roomError || !roomRow) {
      setIsBusy(false)
      setStatus('해당 코드의 방을 찾지 못했어요.')
      return
    }

    clearPendingRoomSession()
    setRoom(null)
    setMember(null)
    setIsReauthMode(false)

    let matchingMembers = []
    try {
      matchingMembers = await findMembersByIdentity(roomRow.id, normalizedName)
    } catch (error) {
      setIsBusy(false)
      setStatus(error.message)
      return
    }

    let memberRow =
      matchingMembers.find((candidate) => candidate.pin_hash === pinHash) || null

    if (!memberRow) {
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
    }

    const memberInfo = makeMemberInfo(memberRow)
    setRoom(roomRow)
    setMember(memberInfo)
    setMemberDisplayName(memberInfo.display_name)
    setEditingRoomName(roomRow.name)
    setIsReauthMode(false)
    persistSession(roomRow, memberInfo)

    await loadRoomState({ roomId: roomRow.id, memberId: memberRow.id, preserveDraft: false, silent: true })
    setIsBusy(false)
    setStatus(`${roomRow.name} 방에 참여했어요.`)
  }

  async function reauthenticateMember() {
    if (!supabase || !room?.id) return
    if (!reauthName.trim()) {
      setStatus('계속하려면 표시 이름을 입력해 주세요.')
      return
    }
    if (reauthPin.trim().length !== 4) {
      setStatus('계속하려면 4자리 PIN을 입력해 주세요.')
      return
    }

    setIsBusy(true)
    setStatus('')

    let matchingMembers = []
    try {
      matchingMembers = await findMembersByIdentity(room.id, reauthName.trim())
    } catch (error) {
      setIsBusy(false)
      setStatus(error.message)
      return
    }

    const memberRow =
      matchingMembers.find((candidate) => candidate.pin_hash === simpleHash(reauthPin.trim())) || null

    if (!memberRow) {
      setIsBusy(false)
      setStatus('이 방에서 일치하는 이름과 PIN을 찾지 못했어요. 다시 확인해 주세요.')
      return
    }

    const memberInfo = makeMemberInfo(memberRow)
    setMember(memberInfo)
    setMemberDisplayName(memberInfo.display_name)
    setReauthPin('')
    setIsReauthMode(false)
    persistSession(room, memberInfo)
    await loadRoomState({ roomId: room.id, memberId: memberRow.id, preserveDraft: false, silent: true })
    setIsBusy(false)
    setStatus(`${memberRow.display_name}님, 다시 돌아왔어요.`)
  }

  async function saveAvailability() {
    if (!supabase || !room?.id || !member?.id) return
    if (!hasUnsavedChanges) {
      setStatus('이미 최신 가능 시간으로 저장되어 있어요.')
      return
    }

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
      setStatus('기존 가능 시간 정보를 업데이트하지 못했어요. 다시 시도해 주세요.')
      return
    }

    const { error: insertError } = await supabase.from('availabilities').insert(rows)

    if (insertError) {
      setIsBusy(false)
      setStatus('가능 시간을 저장하지 못했어요. 다시 시도해 주세요.')
      return
    }

    const loaded = await loadRoomState({
      roomId: room.id,
      memberId: member.id,
      preserveDraft: false,
      silent: true,
    })

    setIsBusy(false)
    if (!loaded) return
    setStatus('이번 주 가능 시간을 저장했어요.')
  }

  async function updateRoomName() {
    if (!supabase || !room?.id) return
    if (!editingRoomName.trim()) {
      setStatus('방 이름을 입력해 주세요.')
      return
    }
    if (editingRoomName.trim() === room.name) {
      setStatus('방 이름이 이미 최신 상태예요.')
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
      setStatus('방 이름을 수정하지 못했어요. 다시 시도해 주세요.')
      return
    }

    setRoom(data)
    persistSession(data, member)
    setDeleteRoomName('')
    setStatus('방 이름을 수정했어요.')
  }

  async function updateMemberProfile() {
    if (!supabase || !room?.id || !member?.id) return
    if (!memberDisplayName.trim()) {
      setStatus('표시 이름을 입력해 주세요.')
      return
    }

    const updates = {}
    const trimmedName = memberDisplayName.trim()

    if (trimmedName !== member.display_name) {
      updates.display_name = trimmedName
    }

    const wantsPinChange = currentPinInput || newPinInput
    if (wantsPinChange) {
      if (currentPinInput.trim().length !== 4) {
        setStatus('현재 4자리 PIN을 입력해 주세요.')
        return
      }
      if (newPinInput.trim().length !== 4) {
        setStatus('새 4자리 PIN을 입력해 주세요.')
        return
      }
      if (currentPinInput === newPinInput) {
        setStatus('현재 PIN과 다른 새 PIN을 입력해 주세요.')
        return
      }

      const { data: memberRow, error } = await supabase
        .from('members')
        .select('pin_hash')
        .eq('id', member.id)
        .eq('room_id', room.id)
        .maybeSingle()

      if (error || !memberRow) {
        setStatus('현재 PIN을 확인하지 못했어요. 다시 시도해 주세요.')
        return
      }

      if (memberRow.pin_hash !== simpleHash(currentPinInput.trim())) {
        setStatus('현재 PIN이 일치하지 않아요. 다시 확인해 주세요.')
        return
      }

      updates.pin_hash = simpleHash(newPinInput.trim())
    }

    if (Object.keys(updates).length === 0) {
      setStatus('멤버 정보가 이미 최신 상태예요.')
      return
    }

    setIsBusy(true)
    setStatus('')

    const { data, error } = await supabase
      .from('members')
      .update(updates)
      .eq('id', member.id)
      .eq('room_id', room.id)
      .select('*')
      .single()

    setIsBusy(false)

    if (error) {
      setStatus('멤버 정보를 저장하지 못했어요. 다시 시도해 주세요.')
      return
    }

    const memberInfo = makeMemberInfo(data)
    setMember(memberInfo)
    setMemberDisplayName(data.display_name)
    setCurrentPinInput('')
    setNewPinInput('')
    persistSession(room, memberInfo)
    await loadRoomState({ roomId: room.id, memberId: data.id, preserveDraft: true, silent: true })
    setStatus('멤버 정보를 수정했어요.')
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
      setStatus('방을 삭제하지 못했어요. 다시 시도해 주세요.')
      return
    }

    const { error: memberError } = await supabase.from('members').delete().eq('room_id', room.id)

    if (memberError) {
      setIsBusy(false)
      setStatus('방을 삭제하지 못했어요. 다시 시도해 주세요.')
      return
    }

    const { error: roomError } = await supabase.from('rooms').delete().eq('id', room.id)

    setIsBusy(false)

    if (roomError) {
      setStatus('방을 삭제하지 못했어요. 다시 시도해 주세요.')
      return
    }

    clearLocalSession()
    setStatus('방을 삭제했어요.')
  }

  function toggleSlot(dayIndex, slotIndex) {
    const key = `${dayIndex}-${slotIndex}`
    setAvailabilityMap((current) => ({
      ...current,
      [key]: !current[key],
    }))
  }

  function setDayAvailability(dayIndex, isAvailable) {
    setAvailabilityMap((current) => {
      const next = { ...current }
      SLOTS.forEach((_, slotIndex) => {
        next[`${dayIndex}-${slotIndex}`] = isAvailable
      })
      return next
    })
  }

  function resetMyAvailability() {
    if (!member) return
    const shouldReset = window.confirm(
      '이 방에서 내 가능 시간만 초기화할까요? 다른 멤버 정보는 바뀌지 않아요.',
    )
    if (!shouldReset) return

    const clearedMap = emptyAvailabilityMap()
    setAvailabilityMap(clearedMap)
    setStatus('내 가능 시간을 화면에서 초기화했어요. 저장하면 반영돼요.')
  }

  return (
    <div className="app-shell">
      <header className="hero">
        <p className="eyebrow">밴드 합주 일정 조율</p>
        <h1>한 방에서 가능 시간을 모으고, 겹치는 합주 시간을 빠르게 찾아보세요.</h1>
        <p className="subtle">
          작은 밴드가 주간 합주 시간을 간단하게 정할 수 있도록 만든 서비스예요.
        </p>
      </header>

      {!room && (
        <section className="card primary-home-card">
          <div className="card-header">
            <div>
              <p className="section-kicker">새 방 만들기</p>
              <h2>방 만들기</h2>
            </div>
          </div>
          <p className="subtle">
            새로운 합주 방을 만들고 코드를 공유해 멤버들을 초대해 보세요.
          </p>
          <input
            value={roomName}
            onChange={(event) => setRoomName(event.target.value)}
            placeholder="밴드 방 이름"
          />
          <button disabled={isBusy} onClick={createRoom}>
            {isBusy ? '만드는 중...' : '방 만들기'}
          </button>
        </section>
      )}

      {!room && pendingRoomSession && (
        <section className="card secondary-card">
          <div className="card-header">
            <div>
              <p className="section-kicker">이전 방 계속하기</p>
              <h2>{pendingRoomSession.name}</h2>
            </div>
          </div>
          <p className="subtle">
            이전에 보던 방 정보가 남아 있어요. 이 방으로 다시 들어가려면 계속 진행해 주세요.
          </p>
          <div className="action-row">
            <button type="button" onClick={continueExistingRoom}>
              이 방 계속하기
            </button>
            <button type="button" className="soft-button" onClick={clearPendingRoomSession}>
              새로 시작하기
            </button>
          </div>
        </section>
      )}

      <section className={`card ${!room ? 'secondary-card' : ''}`}>
        <div className="card-header">
          <div>
            <p className="section-kicker">{needsReauth ? '다시 확인하기' : '기존 방 참여하기'}</p>
            <h2>{needsReauth ? '멤버로 다시 들어가기' : '코드와 PIN으로 참여하기'}</h2>
          </div>
          {isLoadingRoom && room && <div className="save-state">방 정보 불러오는 중...</div>}
        </div>

        {needsReauth ? (
          <>
            <p className="subtle">
              방 정보는 남아 있어요. 계속하려면 멤버 이름과 PIN을 다시 입력해 주세요.
            </p>
            <div className="field-grid">
              <input value={room.room_code} readOnly />
              <input
                value={reauthName}
                onChange={(event) => setReauthName(event.target.value)}
                placeholder="표시 이름"
              />
              <input
                inputMode="numeric"
                maxLength={4}
                value={reauthPin}
                onChange={(event) => setReauthPin(event.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="4자리 PIN"
              />
            </div>
            <button disabled={isBusy} onClick={reauthenticateMember}>
              {isBusy ? '확인 중...' : '계속하기'}
            </button>
          </>
        ) : (
          <>
            <div className="field-grid">
              <input
                value={joinCode}
                onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
                placeholder="방 코드"
              />
              <input
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="표시 이름"
              />
              <input
                inputMode="numeric"
                maxLength={4}
                value={pin}
                onChange={(event) => setPin(event.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="4자리 PIN"
              />
            </div>
            <button disabled={isBusy} onClick={joinRoom}>
              {isBusy ? '참여 중...' : '방 참여하기'}
            </button>
          </>
        )}
      </section>

      {status && <p className="status">{status}</p>}

      {room && member && (
        <>
          <section className="card room-hero-card">
            <div className="top-actions">
              <button type="button" className="soft-button home-button" onClick={goHome}>
                홈으로 돌아가기
              </button>
            </div>
            <div className="room-hero-top">
              <div>
                <p className="section-kicker">현재 방</p>
                <h2 className="room-title">{room.name}</h2>
                <p className="subtle">방 코드 {room.room_code}</p>
              </div>
              <div className="pill">{member.display_name}으로 참여 중</div>
            </div>

            <div className="room-meta-grid">
              <div className="meta-card">
                <span className="meta-label">멤버</span>
                <strong>{members.length}</strong>
              </div>
              <div className="meta-card">
                <span className="meta-label">제출 완료</span>
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
                ? `아직 제출하지 않음: ${missingMembers.map((memberRow) => memberRow.display_name).join(', ')}`
                : '모든 멤버가 가능 시간을 제출했어요.'}
            </p>
          </section>

          <section className="card">
            <div className="card-header">
              <div>
                <p className="section-kicker">내 멤버 정보</p>
                <h2>이름과 PIN 수정</h2>
              </div>
            </div>
            <div className="stack-form">
              <input
                value={memberDisplayName}
                onChange={(event) => setMemberDisplayName(event.target.value)}
                placeholder="표시 이름"
              />
              <div className="field-grid">
                <input
                  inputMode="numeric"
                  maxLength={4}
                  value={currentPinInput}
                  onChange={(event) => setCurrentPinInput(event.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="현재 PIN"
                />
                <input
                  inputMode="numeric"
                  maxLength={4}
                  value={newPinInput}
                  onChange={(event) => setNewPinInput(event.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="새 PIN"
                />
              </div>
              <button disabled={isBusy} onClick={updateMemberProfile}>
                {isBusy ? '저장 중...' : '멤버 정보 저장'}
              </button>
            </div>
          </section>

          <section className="card">
            <div className="card-header">
              <div>
                <p className="section-kicker">방 설정</p>
                <h2>방 이름 수정</h2>
              </div>
            </div>
            <div className="inline-form">
              <input
                value={editingRoomName}
                onChange={(event) => setEditingRoomName(event.target.value)}
                placeholder="방 이름"
              />
              <button disabled={isBusy} onClick={updateRoomName}>
                {isBusy ? '저장 중...' : '방 이름 저장'}
              </button>
            </div>
          </section>

          <section className="card">
            <div className="section-head">
              <div>
                <p className="section-kicker">주간 일정</p>
                <h2>주간 가능 시간</h2>
                <p className="subtle">
                  칸을 직접 눌러도 되고, 빠른 버튼으로 하루 전체를 한 번에 채워도 돼요.
                </p>
              </div>
              <div className={`save-state ${hasUnsavedChanges ? 'unsaved' : ''}`}>
                {isBusy ? '저장 중...' : hasUnsavedChanges ? '저장되지 않은 변경이 있어요.' : '모든 변경이 저장되었어요.'}
              </div>
            </div>

            <div className="day-actions-grid">
              {DAYS.map((day, dayIndex) => (
                <div
                  key={day}
                  className={`day-action-card ${dayIndex >= 5 ? 'weekend' : 'weekday'}`}
                >
                  <strong>{day}</strong>
                  <div className="mini-actions">
                    <button type="button" className="ghost-button" onClick={() => setDayAvailability(dayIndex, true)}>
                      전체 선택
                    </button>
                    <button type="button" className="ghost-button" onClick={() => setDayAvailability(dayIndex, false)}>
                      전체 해제
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="weekday-weekend-guide">
              <span>평일</span>
              <span>주말</span>
            </div>

            <div className="availability-grid">
              <div className="grid-top-left" />
              {DAYS.map((day, dayIndex) => (
                <div
                  key={day}
                  className={`day-label ${dayIndex >= 5 ? 'weekend-label' : 'weekday-label'}`}
                >
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

            <div className="action-row">
              <button disabled={isBusy || !hasUnsavedChanges} onClick={saveAvailability}>
                {isBusy ? '저장 중...' : '저장'}
              </button>
              <button type="button" className="soft-button" disabled={isBusy} onClick={resetMyAvailability}>
                내 가능 시간 초기화
              </button>
            </div>
          </section>

          <section className="card">
            <div className="card-header">
              <div>
                <p className="section-kicker">추천 결과</p>
                <h2>합주 추천 시간</h2>
              </div>
            </div>

            <ResultSection
              title="모두 가능한 시간"
              emptyText="아직 모두가 가능한 시간이 없어요."
              items={fullyMatchedTimes}
              totalMembers={members.length}
            />
            <ResultSection
              title="한 명만 빠지는 시간"
              emptyText="아직 거의 맞는 시간이 없어요."
              items={almostMatchedTimes}
              totalMembers={members.length}
            />
            <ResultSection
              title="전체 추천 순서"
              emptyText="아직 저장된 겹침 데이터가 없어요."
              items={recommendedTimes}
              totalMembers={members.length}
            />
          </section>

          <section className="card danger-card">
            <div className="card-header">
              <div>
                <p className="section-kicker">주의</p>
                <h2>방 삭제</h2>
              </div>
            </div>
            <p className="warning-copy">
              이 방을 삭제하면 멤버 정보와 저장된 가능 시간도 함께 삭제돼요.
            </p>
            <input
              value={deleteRoomName}
              onChange={(event) => setDeleteRoomName(event.target.value)}
              placeholder={`확인을 위해 "${room.name}" 입력`}
            />
            <button
              className="danger-button"
              disabled={isBusy || deleteRoomName !== room.name}
              onClick={deleteRoom}
            >
              {isBusy ? '삭제 중...' : '방 삭제'}
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
            className={`slot-button ${isActive ? 'active' : ''} ${dayIndex >= 5 ? 'weekend-slot' : 'weekday-slot'}`}
            onClick={() => onToggle(dayIndex, slotIndex)}
            aria-pressed={isActive}
          >
            {isActive ? '가능' : ''}
          </button>
        )
      })}
    </>
  )
}

function ResultSection({ title, emptyText, items, totalMembers }) {
  return (
    <div className="result-group">
      <div className="result-group-head">
        <h3>{title}</h3>
      </div>
      {items.length === 0 ? (
        <p className="subtle">{emptyText}</p>
      ) : (
        <div className="results">
          {items.map((item) => (
            <div key={`${title}-${item.label}`} className="result-row">
              <div>
                <strong>{item.label}</strong>
                <p>{item.names.join(', ') || '아직 멤버 정보가 없어요'}</p>
              </div>
              <div className="result-count">{item.count}/{totalMembers || 0}명 가능</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

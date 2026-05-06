import { useEffect, useMemo, useState } from 'react'
import { navigate } from '../lib/router'
import { supabase } from '../lib/supabase'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const SLOTS = Array.from({ length: 24 }, (_, hour) => `${String(hour).padStart(2, '0')}:00`)
const DAY_GROUPS = [
  { key: 'weekday', title: '평일', days: [0, 1, 2, 3, 4] },
  { key: 'weekend', title: '주말', days: [5, 6] },
]
const DEFAULT_VISIBLE_HOUR_START = 10

function getMondayStart(date) {
  const next = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12)
  const day = next.getDay()
  const offset = day === 0 ? -6 : 1 - day
  next.setDate(next.getDate() + offset)
  return next
}

function getFirstMondayOfMonth(year, monthIndex) {
  const firstDay = new Date(year, monthIndex, 1, 12)
  const day = firstDay.getDay()
  const offset = day === 0 ? 1 : day === 1 ? 0 : 8 - day
  firstDay.setDate(firstDay.getDate() + offset)
  return firstDay
}

function addDays(date, amount) {
  const next = new Date(date)
  next.setDate(next.getDate() + amount)
  return next
}

function formatWeekRangeDate(date) {
  if (!date) return ''
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}.${month}.${day}`
}

function formatDayHeaderDate(date) {
  return `${date.getMonth() + 1}/${date.getDate()}`
}

function formatMonthLabel(monthIndex) {
  return `${monthIndex + 1}월`
}

function makeRoomCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase()
}

function getDefaultDisplayName(user) {
  return user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || '나'
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

function isMemberSubmitted(memberId, availabilities) {
  return availabilities.some((row) => row.member_id === memberId)
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

function mergeConsecutiveTimes(times, weekDates) {
  if (!times || times.length === 0) return []

  const merged = []
  let current = { ...times[0], startSlot: times[0].slot, endSlot: times[0].slot }

  for (let i = 1; i < times.length; i++) {
    const item = times[i]
    if (
      item.count === current.count &&
      item.day === current.day &&
      item.slot === current.endSlot + 1 &&
      item.names.join(',') === current.names.join(',')
    ) {
      current.endSlot = item.slot
    } else {
      merged.push(current)
      current = { ...item, startSlot: item.slot, endSlot: item.slot }
    }
  }
  merged.push(current)

  return merged.map((item) => {
    const endHour = String(item.endSlot + 1).padStart(2, '0') + ':00'
    const targetDate = weekDates && weekDates[item.day] ? weekDates[item.day].date : null
    const dateStr = targetDate ? formatWeekRangeDate(targetDate) : ''
    return {
      ...item,
      label: `${DAYS[item.day]} ${SLOTS[item.startSlot]} - ${endHour}`,
      dateLabel: dateStr,
    }
  })
}

function makeMemberInfo(memberRow) {
  if (!memberRow) return null
  return {
    id: memberRow.id,
    room_id: memberRow.room_id,
    user_id: memberRow.user_id,
    display_name: memberRow.display_name,
  }
}

function getFriendlyError(errorMessage) {
  if (!errorMessage) return '문제가 발생했어요. 다시 시도해 주세요.'
  if (errorMessage.includes('duplicate key')) return '이미 참여 중인 방이에요. 목록에서 다시 입장해 주세요.'
  if (errorMessage.includes('JSON object requested')) return '방을 찾지 못했어요. 방 코드를 다시 확인해 주세요.'
  if (errorMessage.includes('row-level security')) return '권한 확인 중 문제가 생겼어요. 다시 시도해 주세요.'
  return errorMessage
}

function ResultGroup({ title, items, emptyText }) {
  return (
    <div className="result-group compact-result-group">
      {title && (
        <div className="result-group-head">
          <h3>{title}</h3>
        </div>
      )}
      {items.length === 0 ? (
        <p className="subtle">{emptyText}</p>
      ) : (
        <div className="results">
          {items.map((item) => (
            <div className="result-row" key={`${title}-${item.day}-${item.slot}`}>
              <div>
                <strong>{item.label}</strong>
                {item.dateLabel && <p className="result-date-label">{item.dateLabel}</p>}
                <p>{item.names.join(', ')}</p>
              </div>
              <span className="result-count">{item.count}명</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ModalSheet({ title, kicker, children, onClose }) {
  return (
    <div className="band-modal-backdrop" role="presentation" onClick={onClose}>
      <section className="band-modal-sheet" role="dialog" aria-modal="true" aria-label={title} onClick={(event) => event.stopPropagation()}>
        <div className="band-modal-handle" />
        <div className="band-modal-head">
          <div>
            {kicker && <p className="section-kicker">{kicker}</p>}
            <h2>{title}</h2>
          </div>
          <button type="button" className="soft-button band-modal-close" onClick={onClose}>
            닫기
          </button>
        </div>
        {children}
      </section>
    </div>
  )
}

function TabButton({ active, children, onClick }) {
  return (
    <button type="button" className={`band-tab-button ${active ? 'active' : ''}`} onClick={onClick}>
      {children}
    </button>
  )
}

export default function BandGoogleCompactPage() {
  const [session, setSession] = useState(null)
  const [isAuthLoading, setIsAuthLoading] = useState(true)
  const [myRooms, setMyRooms] = useState([])
  const [isLoadingRooms, setIsLoadingRooms] = useState(false)
  const [roomName, setRoomName] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [status, setStatus] = useState('')
  const [room, setRoom] = useState(null)
  const [member, setMember] = useState(null)
  const [members, setMembers] = useState([])
  const [allAvailabilities, setAllAvailabilities] = useState([])
  const [availabilityMap, setAvailabilityMap] = useState(emptyAvailabilityMap)
  const [savedAvailabilityMap, setSavedAvailabilityMap] = useState(emptyAvailabilityMap)
  const [isBusy, setIsBusy] = useState(false)
  const [isLoadingRoom, setIsLoadingRoom] = useState(false)
  const [editingRoomName, setEditingRoomName] = useState('')
  const [memberDisplayName, setMemberDisplayName] = useState('')
  const [deleteRoomName, setDeleteRoomName] = useState('')
  const [activeModal, setActiveModal] = useState(null)
  const [activePanel, setActivePanel] = useState('availability')
  const [showAllHours, setShowAllHours] = useState(false)
  const [activeDayGroup, setActiveDayGroup] = useState('weekday')
  const [weekStartDate, setWeekStartDate] = useState(() => getMondayStart(new Date()))
  const [isRecommendationExpanded, setIsRecommendationExpanded] = useState(false)

  const user = session?.user || null
  const isOwner = Boolean(user?.id && room?.owner_user_id === user.id)
  const fallbackDisplayName = getDefaultDisplayName(user)

  const submittedMembers = useMemo(
    () => members.filter((memberRow) => isMemberSubmitted(memberRow.id, allAvailabilities)),
    [allAvailabilities, members],
  )
  const missingMembers = useMemo(
    () => members.filter((memberRow) => !isMemberSubmitted(memberRow.id, allAvailabilities)),
    [allAvailabilities, members],
  )
  const bestTimes = useMemo(
    () => mergeConsecutiveTimes(toBestTimes(allAvailabilities, members), weekDates),
    [allAvailabilities, members, weekDates]
  )
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
  const visibleSlotIndexes = useMemo(
    () =>
      SLOTS.map((_, slotIndex) => slotIndex).filter(
        (slotIndex) => showAllHours || slotIndex >= DEFAULT_VISIBLE_HOUR_START,
      ),
    [showAllHours],
  )
  const activeGroup = useMemo(
    () => DAY_GROUPS.find((group) => group.key === activeDayGroup) || DAY_GROUPS[0],
    [activeDayGroup],
  )
  const selectedYear = weekStartDate.getFullYear()
  const selectedMonthIndex = weekStartDate.getMonth()
  const selectableYears = useMemo(
    () => Array.from({ length: 7 }, (_, index) => selectedYear - 2 + index),
    [selectedYear],
  )
  const weekDates = useMemo(() => {
    return DAYS.map((_, index) => {
      const date = addDays(weekStartDate, index)
      return {
        date,
        headerLabel: DAYS[index],
      }
    })
  }, [weekStartDate])
  const weekRangeLabel = useMemo(() => {
    const first = weekDates[0]?.date
    const last = weekDates[weekDates.length - 1]?.date
    if (!first || !last) return ''
    return `${formatWeekRangeDate(first)} - ${formatWeekRangeDate(last)}`
  }, [weekDates])

  function moveWeek(offset) {
    setWeekStartDate((current) => addDays(current, offset * 7))
  }

  function updateWeekFromMonth(year, monthIndex) {
    setWeekStartDate(getFirstMondayOfMonth(year, monthIndex))
  }

  useEffect(() => {
    if (!supabase) {
      setIsAuthLoading(false)
      return undefined
    }

    let isMounted = true

    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) return
      setSession(data.session)
      setDisplayName(getDefaultDisplayName(data.session?.user))
      setMemberDisplayName(getDefaultDisplayName(data.session?.user))
      setIsAuthLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_, nextSession) => {
      setSession(nextSession)
      setDisplayName(getDefaultDisplayName(nextSession?.user))
      setMemberDisplayName(getDefaultDisplayName(nextSession?.user))
      setRoom(null)
      setMember(null)
      setStatus('')
    })

    return () => {
      isMounted = false
      listener?.subscription?.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!user?.id) {
      setMyRooms([])
      return
    }
    loadMyRooms(user.id)
  }, [user?.id])

  useEffect(() => {
    if (!room?.id || !member?.id) return
    loadRoomState({ roomId: room.id, memberId: member.id, preserveDraft: true })
  }, [room?.id, member?.id])

  async function signInWithGoogle() {
    if (!supabase) return
    setStatus('')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/band`,
      },
    })
    if (error) setStatus(getFriendlyError(error.message))
  }

  async function signOut() {
    if (!supabase) return
    await supabase.auth.signOut()
    setRoom(null)
    setMember(null)
    setMyRooms([])
    setStatus('로그아웃했어요.')
  }

  async function loadMyRooms(userId) {
    if (!supabase || !userId) return
    setIsLoadingRooms(true)

    try {
      const { data: memberRows, error: memberError } = await supabase
        .from('members')
        .select('id, room_id, display_name, user_id, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (memberError) throw new Error(getFriendlyError(memberError.message))

      const roomIds = [...new Set((memberRows || []).map((item) => item.room_id).filter(Boolean))]
      if (roomIds.length === 0) {
        setMyRooms([])
        return
      }

      const { data: roomRows, error: roomError } = await supabase
        .from('rooms')
        .select('id, name, room_code, owner_user_id, created_at')
        .in('id', roomIds)

      if (roomError) throw new Error(getFriendlyError(roomError.message))

      const roomMap = new Map((roomRows || []).map((roomRow) => [roomRow.id, roomRow]))
      const nextRooms = (memberRows || [])
        .map((memberRow) => ({
          member: memberRow,
          room: roomMap.get(memberRow.room_id),
        }))
        .filter((item) => item.room)
        .sort((a, b) => new Date(b.room.created_at) - new Date(a.room.created_at))

      setMyRooms(nextRooms)
    } catch (error) {
      setStatus(error.message)
    } finally {
      setIsLoadingRooms(false)
    }
  }

  async function fetchRoomBundle(roomId) {
    const [
      { data: roomRow, error: roomError },
      { data: memberRows, error: membersError },
      { data: availabilityRows, error: availabilityError },
    ] = await Promise.all([
      supabase.from('rooms').select('id, name, room_code, owner_user_id, created_at').eq('id', roomId).maybeSingle(),
      supabase
        .from('members')
        .select('id, room_id, user_id, display_name, created_at')
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

  function applyLoadedState({ roomRow, memberRows, availabilityRows, activeMember, preserveDraft }) {
    const nextMember = makeMemberInfo(activeMember)
    const nextSavedMap = getMemberAvailabilityMap(availabilityRows, nextMember?.id)

    setRoom(roomRow)
    setMembers(memberRows)
    setAllAvailabilities(availabilityRows)
    setEditingRoomName(roomRow.name || '')
    setJoinCode(roomRow.room_code || '')
    setMember(nextMember)
    setMemberDisplayName(nextMember?.display_name || fallbackDisplayName)
    setSavedAvailabilityMap(nextSavedMap)
    setAvailabilityMap((current) => {
      if (preserveDraft && nextMember?.id && !mapsEqual(current, nextSavedMap)) return current
      return nextSavedMap
    })
  }

  async function loadRoomState({ roomId, memberId, preserveDraft = false, silent = false }) {
    if (!supabase || !roomId || !user?.id) return null
    if (!silent) setIsLoadingRoom(true)

    try {
      const { roomRow, memberRows, availabilityRows } = await fetchRoomBundle(roomId)
      if (!roomRow) {
        setStatus('이 방을 찾지 못했어요.')
        setRoom(null)
        setMember(null)
        return null
      }

      const activeMember =
        memberRows.find((memberRow) => memberRow.id === memberId) ||
        memberRows.find((memberRow) => memberRow.user_id === user.id) ||
        null

      if (!activeMember) {
        setStatus('이 방의 멤버 정보를 찾지 못했어요. 방 코드로 다시 참여해 주세요.')
        setRoom(null)
        setMember(null)
        return null
      }

      applyLoadedState({ roomRow, memberRows, availabilityRows, activeMember, preserveDraft })
      return { roomRow, memberRows, availabilityRows, activeMember }
    } catch (error) {
      setStatus(error.message)
      return null
    } finally {
      if (!silent) setIsLoadingRoom(false)
    }
  }

  async function enterRoom(roomId, memberId = null) {
    setIsBusy(true)
    setStatus('')
    const loaded = await loadRoomState({ roomId, memberId, preserveDraft: false, silent: true })
    setIsBusy(false)
    if (loaded) {
      setActivePanel('availability')
      setStatus(`${loaded.roomRow.name} 방에 들어왔어요.`)
    }
  }

  async function createRoom() {
    if (!supabase || !user?.id) return
    if (!roomName.trim()) {
      setStatus('방 이름을 입력해 주세요.')
      return
    }
    if (!displayName.trim()) {
      setStatus('표시 이름을 입력해 주세요.')
      return
    }

    setIsBusy(true)
    setStatus('')

    try {
      const roomCode = makeRoomCode()
      const { data: roomRow, error: roomError } = await supabase
        .from('rooms')
        .insert({
          name: roomName.trim(),
          room_code: roomCode,
          owner_user_id: user.id,
        })
        .select('id, name, room_code, owner_user_id, created_at')
        .single()

      if (roomError) throw new Error(getFriendlyError(roomError.message))

      const { data: memberRow, error: memberError } = await supabase
        .from('members')
        .insert({
          room_id: roomRow.id,
          user_id: user.id,
          display_name: displayName.trim(),
          pin_hash: `auth:${user.id}`,
        })
        .select('id, room_id, user_id, display_name, created_at')
        .single()

      if (memberError) throw new Error(getFriendlyError(memberError.message))

      setRoomName('')
      setActiveModal(null)
      await loadMyRooms(user.id)
      await loadRoomState({ roomId: roomRow.id, memberId: memberRow.id, preserveDraft: false, silent: true })
      setActivePanel('availability')
      setStatus(`방이 만들어졌어요. 코드 ${roomRow.room_code}를 공유하면 돼요.`)
    } catch (error) {
      setStatus(error.message)
    } finally {
      setIsBusy(false)
    }
  }

  async function joinRoomByCode() {
    if (!supabase || !user?.id) return
    if (!joinCode.trim()) {
      setStatus('방 코드를 입력해 주세요.')
      return
    }
    if (!displayName.trim()) {
      setStatus('표시 이름을 입력해 주세요.')
      return
    }

    setIsBusy(true)
    setStatus('')

    try {
      const normalizedCode = joinCode.trim().toUpperCase()
      const { data: roomRow, error: roomError } = await supabase
        .from('rooms')
        .select('id, name, room_code, owner_user_id, created_at')
        .eq('room_code', normalizedCode)
        .maybeSingle()

      if (roomError || !roomRow) throw new Error('해당 코드의 방을 찾지 못했어요.')

      const { data: existingMember, error: existingError } = await supabase
        .from('members')
        .select('id, room_id, user_id, display_name, created_at')
        .eq('room_id', roomRow.id)
        .eq('user_id', user.id)
        .maybeSingle()

      if (existingError) throw new Error(getFriendlyError(existingError.message))

      let memberRow = existingMember
      if (!memberRow) {
        const { data: createdMember, error: createMemberError } = await supabase
          .from('members')
          .insert({
            room_id: roomRow.id,
            user_id: user.id,
            display_name: displayName.trim(),
            pin_hash: `auth:${user.id}`,
          })
          .select('id, room_id, user_id, display_name, created_at')
          .single()

        if (createMemberError) throw new Error(getFriendlyError(createMemberError.message))
        memberRow = createdMember
      }

      setActiveModal(null)
      await loadMyRooms(user.id)
      await loadRoomState({ roomId: roomRow.id, memberId: memberRow.id, preserveDraft: false, silent: true })
      setActivePanel('availability')
      setStatus(`${roomRow.name} 방에 참여했어요.`)
    } catch (error) {
      setStatus(error.message)
    } finally {
      setIsBusy(false)
    }
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

    const loaded = await loadRoomState({ roomId: room.id, memberId: member.id, preserveDraft: false, silent: true })
    setIsBusy(false)
    if (loaded) setStatus('이번 주 가능 시간을 저장했어요.')
  }

  async function updateRoomName() {
    if (!supabase || !room?.id || !isOwner) return
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
      .select('id, name, room_code, owner_user_id, created_at')
      .single()

    setIsBusy(false)
    if (error) {
      setStatus('방 이름을 수정하지 못했어요. 다시 시도해 주세요.')
      return
    }

    setRoom(data)
    await loadMyRooms(user.id)
    setStatus('방 이름을 수정했어요.')
  }

  async function updateMemberProfile() {
    if (!supabase || !room?.id || !member?.id) return
    if (!memberDisplayName.trim()) {
      setStatus('표시 이름을 입력해 주세요.')
      return
    }
    if (memberDisplayName.trim() === member.display_name) {
      setStatus('멤버 이름이 이미 최신 상태예요.')
      return
    }

    setIsBusy(true)
    setStatus('')

    const { data, error } = await supabase
      .from('members')
      .update({ display_name: memberDisplayName.trim() })
      .eq('id', member.id)
      .eq('user_id', user.id)
      .select('id, room_id, user_id, display_name, created_at')
      .single()

    setIsBusy(false)
    if (error) {
      setStatus('멤버 이름을 저장하지 못했어요. 다시 시도해 주세요.')
      return
    }

    setMember(makeMemberInfo(data))
    await loadRoomState({ roomId: room.id, memberId: data.id, preserveDraft: true, silent: true })
    await loadMyRooms(user.id)
    setStatus('멤버 이름을 수정했어요.')
  }

  async function deleteRoom() {
    if (!supabase || !room?.id || !isOwner) return
    if (deleteRoomName !== room.name) {
      setStatus('방 이름을 정확히 입력해야 삭제할 수 있어요.')
      return
    }

    setIsBusy(true)
    setStatus('')

    const { error: availabilityError } = await supabase.from('availabilities').delete().eq('room_id', room.id)
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

    setRoom(null)
    setMember(null)
    setDeleteRoomName('')
    setActiveModal(null)
    await loadMyRooms(user.id)
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
    setAvailabilityMap(emptyAvailabilityMap())
    setStatus('내 가능 시간을 화면에서 초기화했어요. 저장하면 반영돼요.')
  }

  function leaveRoomView() {
    setRoom(null)
    setMember(null)
    setMembers([])
    setAllAvailabilities([])
    setAvailabilityMap(emptyAvailabilityMap())
    setSavedAvailabilityMap(emptyAvailabilityMap())
    setDeleteRoomName('')
    setStatus('')
    setActivePanel('availability')
    setShowAllHours(false)
    setActiveDayGroup('weekday')
    if (user?.id) loadMyRooms(user.id)
  }

  function copyRoomCode() {
    navigator.clipboard?.writeText(room.room_code)
    setStatus(`방 코드 ${room.room_code}를 복사했어요.`)
  }

  function renderAvailabilityPanel() {
    return (
      <section className="card band-panel-card">
        <div className="section-head band-compact-section-head band-availability-toolbar">
          <div>
            <p className="section-kicker">내 가능 시간</p>
            <h2>가능한 시간을 눌러 표시해 주세요.</h2>
          </div>
          <div className="band-availability-toolbar-actions">
            <div className={`save-state ${hasUnsavedChanges ? 'unsaved' : ''}`}>
              {isLoadingRoom ? '동기화 중...' : hasUnsavedChanges ? '저장 필요' : '저장됨'}
            </div>
            
            <div className="band-toolbar-controls">
              <div className="band-toolbar-row top-row">
                <div className="band-week-selects" aria-label="년도와 월 선택">
                  <select
                    value={selectedYear}
                    onChange={(event) => updateWeekFromMonth(Number(event.target.value), selectedMonthIndex)}
                  >
                    {selectableYears.map((year) => (
                      <option key={year} value={year}>
                        {year}년
                      </option>
                    ))}
                  </select>
                  <select
                    value={selectedMonthIndex}
                    onChange={(event) => updateWeekFromMonth(selectedYear, Number(event.target.value))}
                  >
                    {Array.from({ length: 12 }, (_, monthIndex) => (
                      <option key={monthIndex} value={monthIndex}>
                        {formatMonthLabel(monthIndex)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="band-day-group-switch" role="tablist" aria-label="시간표 그룹 선택">
                  {DAY_GROUPS.map((group) => (
                    <button
                      type="button"
                      key={group.key}
                      className={`band-day-group-button ${activeDayGroup === group.key ? 'active' : ''}`}
                      onClick={() => setActiveDayGroup(group.key)}
                      aria-pressed={activeDayGroup === group.key}
                    >
                      {group.title}
                    </button>
                  ))}
                </div>
              </div>

              <div className="band-toolbar-row bottom-row">
                <div className="band-week-nav-pill" aria-label="주간 이동">
                  <button type="button" className="band-week-nav-button" onClick={() => moveWeek(-1)} aria-label="이전 주">
                    ‹
                  </button>
                  <span className="band-week-range">{weekRangeLabel}</span>
                  <button type="button" className="band-week-nav-button" onClick={() => moveWeek(1)} aria-label="다음 주">
                    ›
                  </button>
                </div>
                <button
                  type="button"
                  className={`band-hours-toggle ${showAllHours ? 'active' : ''}`}
                  onClick={() => setShowAllHours((current) => !current)}
                >
                  {showAllHours ? '기본 시간보기' : '전체 시간보기'}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="band-availability-groups">
          <section
            className={`band-availability-group ${activeGroup.days.length === 5 ? 'is-weekday-group' : 'is-weekend-group'}`}
          >
            <div className="band-availability-group-head">
              <h3>{activeGroup.title}</h3>
              <p className="subtle">
                {showAllHours ? '00:00부터 23:00까지 보여요.' : '10:00부터 23:00까지만 보여요.'}
              </p>
            </div>
            <div className="band-availability-grid-wrap">
              <div className="availability-grid band-availability-grid">
                <div className="grid-top-left">시간</div>
                {activeGroup.days.map((dayIndex) => (
                  <div
                    className={`day-label ${dayIndex >= 5 ? 'weekend-label' : 'weekday-label'}`}
                    key={`${activeGroup.key}-${DAYS[dayIndex]}`}
                  >
                    {weekDates[dayIndex]?.headerLabel || DAYS[dayIndex]}
                  </div>
                ))}
                {visibleSlotIndexes.map((slotIndex) => (
                  <div key={`${activeGroup.key}-${SLOTS[slotIndex]}`} className="time-row-fragment">
                    <div className="time-label">{SLOTS[slotIndex]}</div>
                    {activeGroup.days.map((dayIndex) => {
                      const key = `${dayIndex}-${slotIndex}`
                      return (
                        <button
                          type="button"
                          key={key}
                          className={`slot-button ${availabilityMap[key] ? 'active' : ''} ${dayIndex >= 5 ? 'weekend-slot' : 'weekday-slot'}`}
                          onClick={() => toggleSlot(dayIndex, slotIndex)}
                          aria-label={`${DAYS[dayIndex]} ${SLOTS[slotIndex]}`}
                        >
                          {availabilityMap[key] ? '✓' : ''}
                        </button>
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        <div className="band-panel-actions">
          <button type="button" disabled={isBusy || !hasUnsavedChanges} onClick={saveAvailability}>
            {isBusy ? '저장 중...' : '가능 시간 저장'}
          </button>
          <button type="button" className="soft-button" onClick={resetMyAvailability}>
            초기화
          </button>
        </div>

        <details className="band-day-actions-detail">
          <summary>요일별 빠른 선택</summary>
          <div className="day-actions-grid compact-day-actions-grid">
            {DAYS.map((day, dayIndex) => (
              <div className={`day-action-card ${dayIndex >= 5 ? 'weekend' : ''}`} key={`action-${day}`}>
                <strong>{day}</strong>
                <div className="mini-actions">
                  <button type="button" className="ghost-button" onClick={() => setDayAvailability(dayIndex, true)}>
                    전체
                  </button>
                  <button type="button" className="ghost-button" onClick={() => setDayAvailability(dayIndex, false)}>
                    비우기
                  </button>
                </div>
              </div>
            ))}
          </div>
        </details>
      </section>
    )
  }

  function renderRecommendPanel() {
    return (
      <section className="card band-panel-card">
        <p className="section-kicker recommendation-kicker">모두 가능한 시간</p>
        <ResultGroup items={fullyMatchedTimes} emptyText="아직 모두 가능한 시간이 없어요." />
        
        <div className="recommendation-toggle-container">
          <button 
            type="button" 
            className="ghost-button recommendation-toggle-button" 
            onClick={() => setIsRecommendationExpanded(!isRecommendationExpanded)}
          >
            가능 인원 기준 추천 {isRecommendationExpanded ? '▲' : '▼'}
          </button>
          {isRecommendationExpanded && (
            <div className="recommendation-expanded-content">
              <ResultGroup items={recommendedTimes} emptyText="아직 추천할 시간이 없어요." />
            </div>
          )}
        </div>
      </section>
    )
  }

  function renderMembersPanel() {
    return (
      <section className="card band-panel-card">
        <p className="section-kicker recommendation-kicker">제출 상태</p>
        <div className="member-list compact-member-list">
          {members.map((memberRow) => (
            <div className="member-pill" key={memberRow.id}>
              {memberRow.display_name}
              {isMemberSubmitted(memberRow.id, allAvailabilities) ? ' · 완료' : ' · 대기'}
            </div>
          ))}
        </div>
        {missingMembers.length > 0 && (
          <p className="summary-line">아직 {missingMembers.map((item) => item.display_name).join(', ')}님의 가능 시간이 필요해요.</p>
        )}
      </section>
    )
  }

  if (!supabase) {
    return (
      <div className="app-shell band-google-shell">
        <section className="card">
          <p className="section-kicker">설정 필요</p>
          <p className="subtle">Supabase 환경변수가 없어 밴드 방을 불러올 수 없어요.</p>
        </section>
      </div>
    )
  }

  if (isAuthLoading) {
    return (
      <div className="app-shell band-google-shell">
        <section className="card">
          <p className="section-kicker">불러오는 중</p>
          <p className="subtle">로그인 상태를 확인하고 있어요.</p>
        </section>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="app-shell band-google-shell">
        <section className="card primary-home-card">
          <p className="section-kicker">밴드 합주 일정</p>
          <h2>Google 계정으로 시작하기</h2>
          <p className="subtle">로그인하면 참여 중인 합주방을 목록에서 바로 고를 수 있어요.</p>
          <button type="button" onClick={signInWithGoogle}>
            Google로 시작하기
          </button>
        </section>
        {status && <p className="status">{status}</p>}
      </div>
    )
  }

  if (!room || !member) {
    return (
      <div className="app-shell band-google-shell band-hub-shell">
        <section className="card band-account-card compact-account-card">
          <div className="card-header">
            <div>
              <p className="section-kicker">내 합주방</p>
              <h2>{fallbackDisplayName}</h2>
              <p className="subtle">{user.email}</p>
            </div>
            <button type="button" className="soft-button home-button" onClick={signOut}>
              로그아웃
            </button>
          </div>
        </section>

        <section className="card primary-home-card band-room-list-card">
          <div className="card-header">
            <div>
              <p className="section-kicker">참여 중인 방</p>
              <h2>방 목록</h2>
            </div>
            {isLoadingRooms && <div className="save-state">불러오는 중...</div>}
          </div>

          {myRooms.length === 0 ? (
            <p className="subtle">아직 참여 중인 방이 없어요.</p>
          ) : (
            <div className="band-room-list">
              {myRooms.map(({ room: roomRow, member: memberRow }) => (
                <div className="band-room-item" key={roomRow.id}>
                  <div>
                    <strong>{roomRow.name}</strong>
                    <p>코드 {roomRow.room_code} · {memberRow.display_name}</p>
                  </div>
                  <button type="button" onClick={() => enterRoom(roomRow.id, memberRow.id)} disabled={isBusy}>
                    입장
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="band-hub-actions">
          <button type="button" onClick={() => setActiveModal('create')}>새 방 만들기</button>
          <button type="button" className="soft-button" onClick={() => setActiveModal('join')}>코드로 참여</button>
          <button type="button" className="soft-button" onClick={() => navigate('/')}>홈으로</button>
        </div>

        {status && <p className="status">{status}</p>}

        {activeModal === 'create' && (
          <ModalSheet title="새 방 만들기" kicker="방 만들기" onClose={() => setActiveModal(null)}>
            <div className="stack-form">
              <input value={roomName} onChange={(event) => setRoomName(event.target.value)} placeholder="방 이름" />
              <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="내 표시 이름" />
              <button type="button" disabled={isBusy} onClick={createRoom}>
                {isBusy ? '처리 중...' : '새 방 만들기'}
              </button>
            </div>
          </ModalSheet>
        )}

        {activeModal === 'join' && (
          <ModalSheet title="방 코드로 참여하기" kicker="참여하기" onClose={() => setActiveModal(null)}>
            <div className="stack-form">
              <input value={joinCode} onChange={(event) => setJoinCode(event.target.value.toUpperCase())} placeholder="방 코드" />
              <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="내 표시 이름" />
              <button type="button" disabled={isBusy} onClick={joinRoomByCode}>
                {isBusy ? '참여 중...' : '방 참여하기'}
              </button>
            </div>
          </ModalSheet>
        )}
      </div>
    )
  }

  return (
    <div className="app-shell band-google-shell band-room-shell">
      <section className="card room-hero-card compact-room-hero-card">
        <div className="room-hero-top compact-room-top">
          <div>
            <p className="section-kicker">현재 방</p>
            <h2 className="room-title">{room.name}</h2>
            <p className="subtle">방 코드 {room.room_code}</p>
          </div>
          <div className="pill">{member.display_name}</div>
        </div>

        <div className="room-meta-grid compact-room-meta-grid">
          <div className="meta-card">
            <span className="meta-label">멤버</span>
            <strong>{members.length}</strong>
          </div>
          <div className="meta-card">
            <span className="meta-label">제출</span>
            <strong>{submittedMembers.length}</strong>
          </div>
        </div>

        <div className="band-room-actions compact-room-actions">
          <button type="button" className="soft-button" onClick={leaveRoomView}>방 목록</button>
          <button type="button" className="soft-button" onClick={copyRoomCode}>코드 복사</button>
          <button type="button" className="soft-button" onClick={() => setActiveModal('manage')}>관리</button>
        </div>
      </section>

      {status && <p className="status">{status}</p>}

      <div className="band-tabbar" role="tablist" aria-label="방 메뉴">
        <TabButton active={activePanel === 'availability'} onClick={() => setActivePanel('availability')}>내 시간</TabButton>
        <TabButton active={activePanel === 'recommend'} onClick={() => setActivePanel('recommend')}>추천</TabButton>
        <TabButton active={activePanel === 'members'} onClick={() => setActivePanel('members')}>멤버</TabButton>
      </div>

      {activePanel === 'availability' && renderAvailabilityPanel()}
      {activePanel === 'recommend' && renderRecommendPanel()}
      {activePanel === 'members' && renderMembersPanel()}

      {activeModal === 'manage' && (
        <ModalSheet title="방 관리" kicker="관리" onClose={() => setActiveModal(null)}>
          <div className="band-manage-stack">
            <section className="band-modal-section">
              <p className="section-kicker">내 정보</p>
              <div className="stack-form">
                <input value={memberDisplayName} onChange={(event) => setMemberDisplayName(event.target.value)} placeholder="내 표시 이름" />
                <button type="button" disabled={isBusy} onClick={updateMemberProfile}>이름 저장</button>
              </div>
            </section>

            {isOwner && (
              <section className="band-modal-section">
                <p className="section-kicker">방 이름</p>
                <div className="stack-form">
                  <input value={editingRoomName} onChange={(event) => setEditingRoomName(event.target.value)} placeholder="방 이름" />
                  <button type="button" disabled={isBusy} onClick={updateRoomName}>방 이름 저장</button>
                </div>
              </section>
            )}

            {isOwner && (
              <section className="band-modal-section danger-card compact-danger-block">
                <p className="section-kicker">방 삭제</p>
                <p className="subtle">방 이름을 정확히 입력하면 방과 멤버, 가능 시간이 모두 삭제돼요.</p>
                <input value={deleteRoomName} onChange={(event) => setDeleteRoomName(event.target.value)} placeholder={room.name} />
                <button type="button" className="danger-button" disabled={isBusy || deleteRoomName !== room.name} onClick={deleteRoom}>방 삭제</button>
              </section>
            )}
          </div>
        </ModalSheet>
      )}
    </div>
  )
}

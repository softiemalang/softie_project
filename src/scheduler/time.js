export function padTime(value) {
  return String(value).padStart(2, '0')
}

export function formatTime(input) {
  const date = new Date(input)
  return `${padTime(date.getHours())}:${padTime(date.getMinutes())}`
}

export function formatDateLabel(input) {
  const date = new Date(input)
  return `${date.getMonth() + 1}월 ${date.getDate()}일`
}

export function formatSchedulerDate(value) {
  if (!value) return ''
  const [year, month, day] = value.split('-')
  if (!year || !month || !day) return value
  return `${year}. ${month}. ${day}.`
}

export function formatSchedulerTime(value) {
  if (!value) return ''
  const [rawHours, minutes] = value.split(':')
  const hours = Number(rawHours)
  if (Number.isNaN(hours) || !minutes) return value

  const meridiem = hours < 12 ? '오전' : '오후'
  const displayHours = hours % 12 === 0 ? 12 : hours % 12
  return `${meridiem} ${padTime(displayHours)}:${minutes}`
}

export function openNativePicker(input) {
  if (!input) return

  if (typeof input.showPicker === 'function') {
    input.showPicker()
    return
  }

  input.focus()
  input.click()
}

export function addMinutes(input, minutes) {
  return new Date(new Date(input).getTime() + minutes * 60 * 1000)
}

export function toLocalDateInputValue(input = new Date()) {
  const date = new Date(input)
  return `${date.getFullYear()}-${padTime(date.getMonth() + 1)}-${padTime(date.getDate())}`
}

export function toLocalTimeInputValue(input = new Date()) {
  const date = new Date(input)
  return normalizeHourTime(`${padTime(date.getHours())}:${padTime(date.getMinutes())}`)
}

export function combineLocalDateTime(dateValue, timeValue) {
  return new Date(`${dateValue}T${normalizeHourTime(timeValue)}:00`)
}

export function toIsoFromLocal(dateValue, timeValue) {
  return combineLocalDateTime(dateValue, timeValue).toISOString()
}

export function normalizeHourTime(value) {
  if (!value) return ''
  const [rawHours] = value.split(':')
  const hours = Number(rawHours)
  if (!Number.isInteger(hours) || hours < 0 || hours > 23) return value
  return `${padTime(hours)}:00`
}

export function startOfDayIso(dateValue) {
  return new Date(`${dateValue}T00:00:00`).toISOString()
}

export function endOfDayIso(dateValue) {
  return new Date(`${dateValue}T23:59:59.999`).toISOString()
}

export function isSameRoom(left, right) {
  return `${left.branch}__${left.room}` === `${right.branch}__${right.room}`
}

export function getMonday(input) {
  const date = new Date(input)
  const day = date.getDay() // 0 (Sun) to 6 (Sat)
  const diff = date.getDate() - day + (day === 0 ? -6 : 1) // adjust when day is sunday
  return new Date(date.setDate(diff))
}

export function getWeekStartDate(input) {
  const monday = getMonday(input)
  return toLocalDateInputValue(monday)
}

export function getWeekTitle(input) {
  const date = new Date(input)
  const month = date.getMonth() + 1
  
  // Calculate week of the month
  const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1)
  const firstMonday = getMonday(firstDayOfMonth)
  
  // If first Monday is after the 1st, the days before it belong to the last week of previous month
  // But per user request "4월 4주차", we'll use a simpler logic:
  const dayOfMonth = date.getDate()
  const weekNumber = Math.ceil((dayOfMonth + firstDayOfMonth.getDay() - 1) / 7)
  
  return `${month}월 ${weekNumber}주차`
}

export function getWeekRangeLabel(mondayInput) {
  const monday = new Date(mondayInput)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  
  return `${monday.getMonth() + 1}/${monday.getDate()} - ${sunday.getMonth() + 1}/${sunday.getDate()}`
}

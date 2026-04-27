/**
 * Asia/Seoul (KST) 타임존 기준으로 현재 날짜 문자열(YYYY-MM-DD)을 반환합니다.
 */
export function getKstDateString(date = new Date()) {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date)
}

/**
 * 콤팩트한 식별자 생성을 위한 헬퍼 (로컬 기기 식별용)
 */
export function getOrCreateLocalKey() {
  const STORAGE_KEY = 'saju:local-profile-key'
  const existing = localStorage.getItem(STORAGE_KEY)
  if (existing) return existing

  const newKey = `user-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
  localStorage.setItem(STORAGE_KEY, newKey)
  return newKey
}

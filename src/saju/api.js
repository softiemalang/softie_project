import { supabase } from '../lib/supabase'

/**
 * 사용자 사주 프로필 조회
 */
export async function getSajuProfile(userId) {
  if (!userId) return null
  const { data, error } = await supabase
    .from('saju_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw error
  return data
}

/**
 * 프로필 저장 또는 업데이트
 */
export async function upsertSajuProfile(profileData) {
  const { data, error } = await supabase
    .from('saju_profiles')
    .upsert(profileData)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * 원국 분석 스냅샷 조회
 */
export async function getNatalSnapshot(profileId) {
  const { data, error } = await supabase
    .from('saju_natal_snapshots')
    .select('*')
    .eq('profile_id', profileId)
    .maybeSingle()

  if (error) throw error
  return data
}

/**
 * 원국 분석 스냅샷 저장
 */
export async function createNatalSnapshot(snapshot) {
  const { data, error } = await supabase
    .from('saju_natal_snapshots')
    .insert(snapshot)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * 특정 날짜의 일일 운세 스냅샷 조회
 */
export async function getDailySnapshot(profileId, targetDate) {
  const { data, error } = await supabase
    .from('saju_daily_snapshots')
    .select('*')
    .eq('profile_id', profileId)
    .eq('target_date', targetDate)
    .maybeSingle()

  if (error) throw error
  return data
}

/**
 * 일일 운세 스냅샷 저장
 */
export async function createDailySnapshot(snapshot) {
  const { data, error } = await supabase
    .from('saju_daily_snapshots')
    .insert(snapshot)
    .select()
    .single()

  if (error) throw error
  return data
}

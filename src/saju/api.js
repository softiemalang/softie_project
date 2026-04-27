import { supabase } from '../lib/supabase'

/**
 * 사용자 사주 프로필 조회 (local_key 기준)
 */
export async function getSajuProfile(localKey) {
  if (!localKey) return null
  const { data, error } = await supabase
    .from('saju_profiles')
    .select('*')
    .eq('local_key', localKey)
    .maybeSingle()

  if (error) throw error
  return data
}

/**
 * 프로필 저장 또는 업데이트 (local_key 기준 충돌 처리)
 */
export async function upsertSajuProfile(profileData) {
  const { data, error } = await supabase
    .from('saju_profiles')
    .upsert(profileData, { onConflict: 'local_key' })
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
    .upsert(snapshot, { onConflict: 'profile_id' })
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * 일일 운세 스냅샷 조회
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
    .upsert(snapshot, { onConflict: 'profile_id, target_date' })
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * 운세 리포트 저장
 */
export async function getFortuneReport(profileId, targetDate, version = '1.0') {
  const { data, error } = await supabase
    .from('saju_fortune_reports')
    .select('*')
    .eq('profile_id', profileId)
    .eq('report_date', targetDate)
    .eq('report_version', version)
    .maybeSingle()

  if (error) throw error
  return data
}

/**
 * 운세 리포트 저장
 */
export async function saveFortuneReport(reportData) {
  const { data, error } = await supabase
    .from('saju_fortune_reports')
    .insert(reportData)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Edge Function을 통한 LLM 리포트 생성 요청
 */
export async function requestLlmReport(dailySnapshot) {
  try {
    console.log('Invoking generate-fortune-report for snapshot:', dailySnapshot.id);
    console.log('Payload keys:', Object.keys(dailySnapshot));
    
    const { data, error } = await supabase.functions.invoke('generate-fortune-report', {
      body: {
        snapshotId: dailySnapshot.id,
        computedData: dailySnapshot.computed_data,
        targetDate: dailySnapshot.target_date
      }
    })

    console.log('Invoke result - data:', data, 'error:', error);

    if (error) {
      console.error('Supabase Edge Function invoke error:', error);
      const errMsg = error.message || JSON.stringify(error);
      throw new Error(`Edge Function error: ${errMsg}`);
    }
    
    if (!data || !data.model || !data.content) {
      console.error('Invalid response shape:', data);
      throw new Error('Invalid response shape from Edge Function');
    }
    
    return data
  } catch (err) {
    console.error('Failed to request LLM report:', err)
    throw err
  }
}

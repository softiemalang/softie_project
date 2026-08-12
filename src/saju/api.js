import { supabase } from '../lib/supabase'

/**
 * 사용자 사주 프로필 조회 (userId 우선, local_key 백업)
 */
export async function getSajuProfile({ userId, localKey }) {
  if (!supabase) return null

  if (userId) {
    const { data, error } = await supabase
      .from('saju_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()
    if (!error && data) return data
  }

  if (localKey) {
    const { data, error } = await supabase
      .from('saju_profiles')
      .select('*')
      .eq('local_key', localKey)
      .maybeSingle()
    if (!error && data) return data
  }

  return null
}

/**
 * Softie 전용 사주 프로필 조회
 */
export async function getSoftieSajuProfile() {
  if (!supabase) return null

  try {
    const { data, error } = await supabase.functions.invoke('get-softie-saju-profile')

    if (error) {
      const errMsg = error.message || JSON.stringify(error)
      throw new Error(errMsg)
    }

    if (!data?.profile) {
      throw new Error(data?.error || 'Missing profile payload')
    }

    return data.profile
  } catch (err) {
    console.error('Failed to load Softie saju profile:', err)
    throw err
  }
}

/**
 * 기존 local_key 프로필을 user_id에 연결
 */
export async function linkLocalSajuProfileToUser({ localKey, userId }) {
  if (!supabase || !localKey || !userId) return

  const { data: userProfile, error: userError } = await supabase
    .from('saju_profiles')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle()

  if (userError) {
    console.warn('[linkLocalSajuProfileToUser] user_id lookup failed:', userError)
    throw userError
  }

  const { data: localProfile, error: localError } = await supabase
    .from('saju_profiles')
    .select('id')
    .eq('local_key', localKey)
    .maybeSingle()

  if (localError) {
    console.warn('[linkLocalSajuProfileToUser] local_key lookup failed:', localError)
    throw localError
  }

  if (userProfile && localProfile && userProfile.id !== localProfile.id) return
  if (userProfile) return // user_id profile already exists
  if (!localProfile) return

  await supabase
    .from('saju_profiles')
    .update({ user_id: userId })
    .eq('local_key', localKey)
    .is('user_id', null)
}

/**
 * 프로필 저장 또는 업데이트 (userId 최우선)
 */
export async function upsertSajuProfile(profileData, { userId, localKey }) {
  if (!supabase) return null

  const payload = { ...profileData }
  if (userId) payload.user_id = userId
  if (localKey) payload.local_key = localKey

  let userProfile = null
  let localProfile = null
  if (userId) {
    const { data, error } = await supabase
      .from('saju_profiles')
      .select('id, local_key')
      .eq('user_id', userId)
      .maybeSingle()

    if (error) {
      console.warn('[upsertSajuProfile] user_id lookup failed:', error)
      throw error
    }

    if (data) userProfile = data
  }

  if (localKey) {
    const { data, error } = await supabase
      .from('saju_profiles')
      .select('id, user_id')
      .eq('local_key', localKey)
      .maybeSingle()

    if (error) {
      console.warn('[upsertSajuProfile] local_key lookup failed:', error)
      throw error
    }

    if (data) localProfile = data
  }

  if (userProfile && localProfile && userProfile.id !== localProfile.id) {
    const safePayload = { ...payload }
    delete safePayload.local_key

    const { data, error } = await supabase
      .from('saju_profiles')
      .update(safePayload)
      .eq('id', userProfile.id)
      .select()
      .single()
    if (error) throw error
    return data
  }

  if (userProfile) {
    const { data, error } = await supabase
      .from('saju_profiles')
      .update(payload)
      .eq('id', userProfile.id)
      .select()
      .single()
    if (error) throw error
    return data
  }

  if (localProfile) {
    const { data, error } = await supabase
      .from('saju_profiles')
      .update(payload)
      .eq('id', localProfile.id)
      .select()
      .single()
    if (error) throw error
    return data
  }

  if (localKey) {
    const { data, error } = await supabase
      .from('saju_profiles')
      .upsert(payload, { onConflict: 'local_key' })
      .select()
      .single()
    if (error) throw error
    return data
  }

  const { data, error } = await supabase
    .from('saju_profiles')
    .insert(payload)
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
    .select('id, profile_id, year_stem, year_branch, month_stem, month_branch, day_stem, day_branch, hour_stem, hour_branch, day_master, natal_data, created_at, updated_at')
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
    .select('id, profile_id, target_date, daily_stem, daily_branch, computed_data, created_at, updated_at')
    .eq('profile_id', profileId)
    .eq('target_date', targetDate)
    .maybeSingle()

  if (error) throw error
  return data
}

export async function getPublicDailySnapshot(profileId, targetDate) {
  if (!supabase || !profileId || !targetDate) return null

  const { data, error } = await supabase
    .rpc('get_public_saju_daily_snapshot', {
      p_profile_id: profileId,
      p_target_date: targetDate,
    })
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

export async function getPublicFortuneReport(profileId, targetDate, version = '1.3') {
  if (!supabase || !profileId || !targetDate) return null

  const { data, error } = await supabase
    .rpc('get_public_saju_fortune_report', {
      p_profile_id: profileId,
      p_report_date: targetDate,
      p_report_version: version,
    })
    .maybeSingle()

  if (error) throw error
  return data
}

export async function getPublicFortuneHistory(profileId, limit = 30) {
  if (!supabase || !profileId) return []

  const { data, error } = await supabase.rpc('get_public_saju_fortune_history', {
    p_profile_id: profileId,
    p_limit: limit,
  })

  if (error) throw error
  return data || []
}

export async function getPublicFortuneReportById(reportId, profileId) {
  if (!supabase || !reportId || !profileId) return null

  const { data, error } = await supabase
    .rpc('get_public_saju_fortune_report_by_id', {
      p_profile_id: profileId,
      p_report_id: reportId,
    })
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
 * 운세 리포트 저장 또는 덮어쓰기
 */
export async function upsertFortuneReport(reportData) {
  const { data, error } = await supabase
    .from('saju_fortune_reports')
    .upsert(reportData, { onConflict: 'profile_id,report_date,report_version' })
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * 운세 히스토리 조회
 */
export async function getFortuneHistory(profileId, limit = 30) {
  const { data, error } = await supabase
    .from('saju_fortune_reports')
    .select('id, report_date, headline, summary')
    .eq('profile_id', profileId)
    .order('report_date', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data || []
}

/**
 * 운세 히스토리 상세 조회
 */
export async function getFortuneReportById(reportId, profileId) {
  if (!reportId || !profileId) return null
  const { data, error } = await supabase
    .from('saju_fortune_reports')
    .select('id, report_date, headline, summary, report_content')
    .eq('id', reportId)
    .eq('profile_id', profileId)
    .maybeSingle()

  if (error) throw error
  return data
}

/**
 * 사주 리포트 평가 로그 조회
 */
export async function getSajuReportEvaluations(limit = 20) {
  if (!supabase) return []

  const { data, error } = await supabase
    .from('saju_report_evaluations')
    .select(
      'id, report_id, report_date, overall_grade, issues, repeat_axis, codex_prompt, retrieved_chunks, warning, model_name, evaluated_at, created_at'
    )
    .order('evaluated_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data || []
}

/**
 * Edge Function을 통한 LLM 리포트 생성 요청
 */
export async function requestLlmReport(dailySnapshot, options = {}) {
  try {
    const body = {
      snapshotId: dailySnapshot.id,
      profileId: dailySnapshot.profile_id || dailySnapshot.computed_data?.profileId || null,
      computedData: dailySnapshot.computed_data,
      targetDate: dailySnapshot.target_date,
      forceGenerate: options.force === true,
    }

    if (options.softiePersonalRag === true) {
      body.softiePersonalRag = true
    }

    const { data, error } = await supabase.functions.invoke('generate-fortune-report', {
      body
    })

    if (error) {
      const errMsg = error.message || JSON.stringify(error);
      throw new Error(`Edge Function error: ${errMsg}`);
    }
    
    if (!data || !data.model || !data.content) {
      throw new Error('Invalid response shape from Edge Function');
    }
    
    return data
  } catch (err) {
    console.error('Failed to request LLM report:', err)
    throw err
  }
}

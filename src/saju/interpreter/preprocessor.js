import { derivePillars, analyzeNatalStructure, analyzeDailyInteraction } from '../engine/core.js'

/**
 * 사용자 프로필을 바탕으로 원국 스냅샷 객체를 생성합니다.
 */
export function generateNatalSnapshot(profile) {
  const pillars = derivePillars(profile.birth_date, profile.birth_time)
  const analysis = analyzeNatalStructure(pillars)

  return {
    year_stem: pillars.year.stem,
    year_branch: pillars.year.branch,
    month_stem: pillars.month.stem,
    month_branch: pillars.month.branch,
    day_stem: pillars.day.stem,
    day_branch: pillars.day.branch,
    hour_stem: pillars.hour.stem,
    hour_branch: pillars.hour.branch,
    day_master: analysis.dayMaster,
    natal_data: { ...analysis, engine_version: '1.1' }
  }
}

/**
 * 원국 데이터와 특정 날짜를 바탕으로 일일 운세 스냅샷 객체를 생성합니다.
 */
export function generateDailySnapshot(natalSnapshot, targetDate) {
  // targetDate에 대한 실제 일진(Daily Pillar) 도출
  // 하루 전체를 대표하는 일진을 구하기 위해 정오(12:00)를 기준으로 계산합니다.
  const targetPillars = derivePillars(targetDate, '12:00')
  const dailyPillar = { stem: targetPillars.day.stem, branch: targetPillars.day.branch }
  
  const natalAnalysis = natalSnapshot.natal_data
  const interaction = analyzeDailyInteraction(natalAnalysis, dailyPillar)

  return {
    target_date: targetDate,
    daily_stem: dailyPillar.stem,
    daily_branch: dailyPillar.branch,
    computed_data: {
      ...interaction,
      priority_flags: ['focus_work', 'careful_spending'], // 예시 플래그
      summary_hint: `${natalAnalysis.dayMaster}일간에게 ${interaction.signals[0].tenGod}이 들어오는 날`,
      engine_version: '1.1'
    }
  }
}

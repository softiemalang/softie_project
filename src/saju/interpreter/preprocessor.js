import { derivePillars, analyzeNatalStructure, analyzeDailyInteraction, analyzePeriodPillar, buildDayType, buildSectionPriority, buildLongerCycleContext, buildDailyBalance } from '../engine/core.js'
import { buildInterpretationProfile } from './interpretationRules.js'

function addDaysToDateString(dateString, offset) {
  const [year, month, day] = String(dateString).split('-').map(Number)
  const utcDate = new Date(Date.UTC(year, (month || 1) - 1, day || 1))
  utcDate.setUTCDate(utcDate.getUTCDate() + offset)
  return utcDate.toISOString().slice(0, 10)
}

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
    natal_data: { ...analysis, gender: profile.gender, engine_version: '2.2' }
  }
}

/**
 * 원국 데이터와 특정 날짜를 바탕으로 일일 운세 스냅샷 객체를 생성합니다.
 */
export function generateDailySnapshot(natalSnapshot, targetDate) {
  // targetDate에 대한 실제 일진(Daily Pillar) 도출
  // 하루 전체를 대표하는 일진을 구하기 위해 정오(12:00)를 기준으로 계산합니다.
  const targetPillars = derivePillars(targetDate, '12:00')
  const periodPillars = {
    year: { stem: targetPillars.year.stem, branch: targetPillars.year.branch },
    month: { stem: targetPillars.month.stem, branch: targetPillars.month.branch },
    day: { stem: targetPillars.day.stem, branch: targetPillars.day.branch }
  }
  const dailyPillar = periodPillars.day
  
  const natalAnalysis = natalSnapshot.natal_data
  const natalPillars = {
    day: { branch: natalSnapshot.day_branch },
    month: { branch: natalSnapshot.month_branch }
  };

  const interaction = analyzeDailyInteraction(natalAnalysis, dailyPillar, natalPillars)
  const dayType = buildDayType(natalAnalysis, interaction)
  const sectionPriority = buildSectionPriority(natalAnalysis, interaction, dayType)
  const periodContext = {
    year: analyzePeriodPillar(natalAnalysis, periodPillars.year, 'year'),
    month: analyzePeriodPillar(natalAnalysis, periodPillars.month, 'month'),
    day: analyzePeriodPillar(natalAnalysis, periodPillars.day, 'day')
  }
  const cycleDays = Array.from({ length: 7 }, (_, index) => {
    const offset = index - 3
    const cycleDate = addDaysToDateString(targetDate, offset)
    const cyclePillars = derivePillars(cycleDate, '12:00')
    const cycleDailyPillar = {
      stem: cyclePillars.day.stem,
      branch: cyclePillars.day.branch,
    }
    const cycleInteraction = analyzeDailyInteraction(natalAnalysis, cycleDailyPillar, natalPillars)
    const cycleDayType = buildDayType(natalAnalysis, cycleInteraction)

    return {
      offset,
      date: cycleDate,
      dailyPillar: cycleDailyPillar,
      dominantTenGods: cycleInteraction.signals.map((signal) => signal.tenGod).filter(Boolean).slice(0, 3),
      elements: cycleInteraction.signals.map((signal) => signal.element).filter(Boolean).slice(0, 3),
      dayType: {
        type: cycleDayType.type,
        label: cycleDayType.label,
        confidence: cycleDayType.confidence,
      },
      branchRelations: cycleInteraction.branchRelations.map((relation) => ({
        target: relation.target,
        relation: relation.relation,
        severity: relation.severity,
      })).slice(0, 3),
      fieldSignals: {
        work: cycleInteraction.fieldImpacts.work.signals.slice(0, 2),
        money: cycleInteraction.fieldImpacts.money.signals.slice(0, 2),
        relationships: cycleInteraction.fieldImpacts.relationships.signals.slice(0, 2),
        love: cycleInteraction.fieldImpacts.love?.signals?.slice(0, 2) ?? [],
        health: cycleInteraction.fieldImpacts.health?.signals?.slice(0, 2) ?? [],
        mind: cycleInteraction.fieldImpacts.mind.signals.slice(0, 2),
      },
    }
  })
  const longerCycleContext = buildLongerCycleContext(natalAnalysis, cycleDays, 3)

  const interactionWithPeriodContext = {
    ...interaction,
    periodContext,
    dayType,
    sectionPriority,
    longerCycleContext
  }
  const dailyBalance = buildDailyBalance(natalAnalysis, interactionWithPeriodContext)
  const interactionWithAllContext = {
    ...interactionWithPeriodContext,
    dailyBalance
  }
  
  const gender = natalAnalysis.gender || 'male'
  const signals = interactionWithPeriodContext.signals.map(s => s.tenGod)
  
  let loveScore = 70
  let loveSignals = []
  let loveTone = 'neutral'
  let loveSummary = ''

  const hasJae = signals.some(s => s.includes('재'))
  const hasGwan = signals.some(s => s.includes('관'))
  const hasSik = signals.some(s => s.includes('식') || s.includes('상'))
  const hasIn = signals.some(s => s.includes('인'))
  const hasBi = signals.some(s => s.includes('비') || s.includes('겁'))

  if (gender === 'male') {
    if (hasJae) { loveScore += 15; loveSignals.push('재성'); loveTone = 'romantic'; loveSummary = '새로운 인연이나 관계의 진전이 기대되는 날'; }
    else if (hasSik) { loveScore += 10; loveSignals.push('식상'); loveTone = 'expressive'; loveSummary = '자연스러운 매력과 표현력이 빛나는 날'; }
    else if (hasGwan) { loveScore += 5; loveSignals.push('관성'); loveTone = 'stable'; loveSummary = '관계에 대한 책임감과 신뢰가 높아지는 날'; }
    else if (hasIn) { loveScore -= 5; loveSignals.push('인성'); loveTone = 'cautious'; loveSummary = '생각이 많아지니 감정 표현에 신중해지는 날'; }
    else { loveSignals.push('비겁'); loveTone = 'independent'; loveSummary = '연애보다는 자신의 일과 편안한 관계에 집중하기 좋은 날'; }
  } else {
    if (hasGwan) { loveScore += 15; loveSignals.push('관성'); loveTone = 'romantic'; loveSummary = '안정적이고 설레는 인연의 기운이 강한 날'; }
    else if (hasJae) { loveScore += 10; loveSignals.push('재성'); loveTone = 'attractive'; loveSummary = '관계를 주도하거나 매력을 어필하기 좋은 날'; }
    else if (hasSik) { loveScore += 5; loveSignals.push('식상'); loveTone = 'expressive'; loveSummary = '자신의 감정을 솔직하게 표현하기 좋은 날'; }
    else if (hasIn) { loveScore -= 5; loveSignals.push('인성'); loveTone = 'cautious'; loveSummary = '생각이 많아지니 감정 표현에 신중해지는 날'; }
    else { loveSignals.push('비겁'); loveTone = 'independent'; loveSummary = '연애보다는 자신의 일과 편안한 관계에 집중하기 좋은 날'; }
  }

  const interpretationProfile = buildInterpretationProfile({
    natalAnalysis,
    dailyInteraction: interactionWithAllContext,
    gender
  });
  const debugSummary = {
    engineVersion: '2.2',
    generatedAt: new Date().toISOString(),
    dayType: {
      type: dayType?.type || null,
      label: dayType?.label || null,
      confidence: dayType?.confidence || null,
      reasons: dayType?.reasons?.slice(0, 3) || []
    },
    sectionPriority: {
      primary: sectionPriority?.primary || [],
      secondary: sectionPriority?.secondary || [],
      low: sectionPriority?.low || []
    },
    longerCycle: {
      todayPosition: longerCycleContext?.todayPosition || null,
      recoveryNeed: longerCycleContext?.recoveryNeed || null,
      rhythmFlags: longerCycleContext?.rhythmFlags?.slice(0, 6) || [],
      compactHints: longerCycleContext?.compactHints?.slice(0, 3) || []
    },
    dailyBalance: {
      orientation: dailyBalance?.orientation || null,
      opportunityLevel: dailyBalance?.opportunityLevel || null,
      cautionLevel: dailyBalance?.cautionLevel || null,
      recoveryLevel: dailyBalance?.recoveryLevel || null,
      balanceHint: dailyBalance?.balanceHint || null,
      actionFocus: dailyBalance?.actionFocus || null
    },
    supportiveElements: {
      confidence: natalAnalysis.supportiveElements?.confidence || null,
      likelyHelpful: natalAnalysis.supportiveElements?.likelyHelpful || [],
      likelyOverloading: natalAnalysis.supportiveElements?.likelyOverloading || [],
      reasonHints: natalAnalysis.supportiveElements?.reasonHints?.slice(0, 3) || []
    },
    natalProfile: {
      baselineTemperament: natalAnalysis.natalProfile?.baselineTemperament?.slice(0, 2) || [],
      stressTriggers: natalAnalysis.natalProfile?.stressTriggers?.slice(0, 2) || [],
      recoveryKeys: natalAnalysis.natalProfile?.recoveryKeys?.slice(0, 2) || []
    },
    periodContext: {
      year: periodContext?.year?.roleHints?.slice(0, 2) || [],
      month: periodContext?.month?.roleHints?.slice(0, 2) || [],
      day: periodContext?.day?.roleHints?.slice(0, 2) || []
    },
    topSignals: {
      tenGods: signals.slice(0, 5),
      branchRelations: interactionWithPeriodContext.branchRelations
        ?.map((relation) => `${relation.target}:${relation.relation}`)
        ?.slice(0, 5) || [],
      supplements: interactionWithPeriodContext.supplements?.slice(0, 5) || [],
      overloads: interactionWithPeriodContext.overloads?.slice(0, 5) || []
    }
  }
  const interpretationTrace = {
    primaryNarrative: {
      dayTypeLabel: dayType?.label || null,
      todayFlowPosition: interpretationProfile?.todayFlowPositionHint || null,
      basisHintPreview: interpretationProfile?.basisHint?.slice(0, 180) || '',
      dailyBalance: {
        orientation: dailyBalance?.orientation || null,
        mainOpportunity: dailyBalance?.mainOpportunity || null,
        mainCaution: dailyBalance?.mainCaution || null,
        mainRecovery: dailyBalance?.mainRecovery || null,
        balanceHint: dailyBalance?.balanceHint || null
      }
    },
    sectionDrivers: {
      work: interpretationProfile?.fieldReasonHints?.work?.slice(0, 3) || [],
      money: interpretationProfile?.fieldReasonHints?.money?.slice(0, 3) || [],
      relationships: interpretationProfile?.fieldReasonHints?.relationships?.slice(0, 3) || [],
      love: interpretationProfile?.fieldReasonHints?.love?.slice(0, 3) || [],
      health: interpretationProfile?.fieldReasonHints?.health?.slice(0, 3) || [],
      mind: interpretationProfile?.fieldReasonHints?.mind?.slice(0, 3) || []
    },
    cautionDrivers: [
      dailyBalance?.mainCaution || null,
      dayType?.cautionHint || null,
      longerCycleContext?.cautionHint || null,
      natalAnalysis.supportiveElements?.cautionHints?.[0] || null
    ].filter(Boolean).slice(0, 3),
    actionDrivers: [
      dailyBalance?.actionFocus || null,
      dayType?.actionHint || null,
      longerCycleContext?.actionHint || null
    ].filter(Boolean).slice(0, 3)
  }

  return {
    target_date: targetDate,
    daily_stem: dailyPillar.stem,
    daily_branch: dailyPillar.branch,
    computed_data: {
      ...interactionWithAllContext,
      love: {
        score: loveScore,
        keySignals: loveSignals,
        tone: loveTone,
        summary_hint: loveSummary
      },
      interpretationProfile,
      debugSummary,
      interpretationTrace,
      priority_flags: ['focus_work', 'careful_spending'], // 예시 플래그
      periodPillars,
      periodContext,
      dayType,
      sectionPriority,
      longerCycleContext,
      dailyBalance,
      summary_hint: `${natalAnalysis.dayMaster}일간에게 올해/이번 달/오늘의 흐름이 겹쳐 들어오는 날`,
      engine_version: '2.2'
    }
  }
}

import { requestLlmReport, saveFortuneReport, getFortuneReport } from '../api'

/**
 * 오늘의 운세 리포트를 가져오거나 새로 생성합니다.
 */
export async function getOrGenerateReport(profileId, dailySnapshot) {
  const targetDate = dailySnapshot.target_date
  const version = '1.1'

  // 1. 기존 리포트 확인
  try {
    const existingReport = await getFortuneReport(profileId, targetDate, version)
    if (existingReport) {
      return { ...existingReport, is_cached: true }
    }
  } catch (error) {
    console.warn('Failed to fetch existing report, will try to generate new one:', error)
  }

  // 2. LLM에게 리포트 생성 요청 (Edge Function 호출)
  let llmResult
  try {
    llmResult = await requestLlmReport(dailySnapshot)
  } catch (error) {
    console.error('LLM Report generation failed, falling back to local analysis:', error)
    // Fallback: 로컬 분석 데이터를 기반으로 간단한 리포트 생성
    llmResult = generateFallbackReport(dailySnapshot)
  }
  
  // 3. 생성된 리포트 저장
  const reportToSave = {
    profile_id: profileId,
    daily_snapshot_id: dailySnapshot.id,
    report_date: targetDate,
    report_version: version,
    model_name: llmResult.model,
    headline: llmResult.content.headline,
    summary: llmResult.content.summary,
    report_content: llmResult.content,
    generated_at: new Date().toISOString()
  }

  try {
    const savedReport = await saveFortuneReport(reportToSave)
    return { ...savedReport, is_cached: false }
  } catch (error) {
    console.error('Failed to save generated report:', error)
    // 저장에 실패하더라도 사용자에게는 생성된 결과를 보여줌
    return { ...reportToSave, id: 'temp-id', is_cached: false }
  }
}

/**
 * LLM 호출 실패 시 로컬 데이터를 기반으로 생성하는 기본 리포트
 */
function generateFallbackReport(dailySnapshot) {
  const data = dailySnapshot.computed_data
  const profile = data.interpretationProfile

  if (profile) {
    return {
      model: "local-fallback-engine",
      content: {
        headline: profile.primaryTheme,
        summary: profile.recommendedNarrative,
        sections: profile.fieldNarratives,
        cautions: ["섣부른 판단은 삼가는 것이 좋습니다.", "중요한 결정 전 한 번 더 여유를 가지세요."],
        action_tip: "오늘의 핵심 키워드는 '유연함'과 '안정'입니다."
      }
    }
  }

  const stemTenGod = data.signals?.find(s => s.type === 'stem')?.tenGod || '기운'
  
  return {
    model: "local-fallback-engine",
    content: {
      headline: "오늘의 흐름을 확인하세요",
      summary: `오늘은 ${stemTenGod}의 기운이 강하게 작용하는 날입니다. 외부 활동보다는 내면의 충실함을 기하기에 좋은 시기입니다.`,
      sections: {
        work: "기존 업무의 미비점을 점검하고 차분하게 마무리하는 것이 유리합니다.",
        money: "지출을 관리하고 장기적인 재정 계획을 세우는 데 집중하세요.",
        relationships: "주변 사람들의 조언을 경청하면 뜻밖의 통찰을 얻을 수 있습니다.",
        love: "오늘은 감정을 너무 앞세우기보다 자연스러운 대화 속에서 호감을 쌓기 좋은 흐름입니다.",
        health: "충분한 수분 섭취와 규칙적인 식사로 컨디션을 관리하세요.",
        mind: "자신을 믿고 긍정적인 마음가짐을 유지하는 것이 중요합니다."
      },
      cautions: ["섣부른 판단은 삼가는 것이 좋습니다.", "중요한 계약은 한 번 더 검토하세요."],
      action_tip: "오늘의 핵심 키워드는 '안정'과 '내실'입니다."
    }
  }
}

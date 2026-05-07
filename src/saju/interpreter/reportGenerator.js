import { requestLlmReport, saveFortuneReport, getFortuneReport, upsertFortuneReport } from '../api'

/**
 * 오늘의 운세 리포트를 가져오거나 새로 생성합니다.
 */
export async function getOrGenerateReport(profileId, dailySnapshot, options = {}) {
  const targetDate = dailySnapshot.target_date
  const version = '1.3'
  const force = options.force === true

  // 1. 기존 리포트 확인
  if (!force) {
    try {
      const existingReport = await getFortuneReport(profileId, targetDate, version)
      if (existingReport) {
        const sections = existingReport.report_content?.sections || {};
        const hasAllSections = ['work', 'money', 'relationships', 'love', 'health', 'mind'].every(k => sections[k]);
        if (hasAllSections) {
          return { ...existingReport, is_cached: true }
        }
      }
    } catch (error) {
      console.warn('Failed to fetch existing report, will try to generate new one:', error)
    }
  }

  // 2. LLM에게 리포트 생성 요청 (Edge Function 호출)
  let llmResult
  try {
    llmResult = await requestLlmReport(dailySnapshot, {
      softiePersonalRag: options.softiePersonalRag === true
    })
  } catch (error) {
    console.error('LLM Report generation failed, falling back to local analysis:', error)
    // Fallback: 로컬 분석 데이터를 기반으로 간단한 리포트 생성
    llmResult = generateFallbackReport(dailySnapshot, error)
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
    report_content: { ...llmResult.content },
    generated_at: new Date().toISOString()
  }

  // Debug 정보가 있는 경우에만 포함 (fallback 시에만 존재)
  if (llmResult.content.debug) {
    reportToSave.report_content.debug = llmResult.content.debug
  }

  try {
    const savedReport = force
      ? await upsertFortuneReport(reportToSave)
      : await saveFortuneReport(reportToSave)
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
function generateFallbackReport(dailySnapshot, error = null) {
  const data = dailySnapshot.computed_data
  const profile = data.interpretationProfile

  const debug = {
    fallback_reason: error ? "frontend-requestLlmReport-error" : "no-data-fallback",
    error_message: error?.message || String(error),
    timestamp: new Date().toISOString()
  }

  if (profile) {
    return {
      model: error ? "local-fallback-engine-request-error-v2" : "local-fallback-engine",
      content: {
        headline: profile.primaryTheme,
        basis: profile.basisHint || `${profile.secondaryTheme} 흐름이 있어 서두르기보다 완급 조절이 중요합니다.`,
        summary: profile.recommendedNarrative,
        sections: profile.fieldNarratives,
        cautions: [
          "민감한 말은 바로 보내지 말고 표현의 온도만 낮춰 다시 써보세요.",
          "계획 없는 결제는 조건을 비교한 뒤 결정하세요."
        ],
        action_tip: "오늘 끝낼 결과물 하나만 골라 마감선을 짧게 적어보세요.",
        debug
      }
    }
  }

  return {
    model: error ? "local-fallback-engine-request-error-v2" : "local-fallback-engine",
    content: {
      headline: "오늘은 한 가지씩 선명하게 보는 날",
      basis: "오늘은 해야 할 일과 관계 신호가 함께 올라와, 분야마다 다른 방식으로 다루는 편이 안정적이에요.",
      summary: "오늘은 한꺼번에 해결하려 하기보다 분야별로 행동을 나누는 쪽이 좋아요. 말은 고르고, 일은 하나로 좁히고, 돈은 조건을 비교하면 흐름이 덜 섞입니다.",
      sections: {
        work: "일은 넓게 펼치기보다 오늘 끝낼 결과물 하나를 묶는 편이 좋아요. 마감선을 작게 그으면 움직일 기준이 분명해집니다.",
        money: "돈은 기분보다 조건을 먼저 보는 쪽이 안정적이에요. 결제는 잠시 미루고 금액과 남는 책임을 비교해보세요.",
        relationships: "가까운 관계에서는 말의 온도가 크게 느껴질 수 있어요. 바로 답하기보다 문장 하나를 골라 부드럽게 낮춰보세요.",
        love: "마음은 서둘러 확인하려 할수록 기대가 커질 수 있어요. 반응을 늦추고 편안한 대화가 가능한 순간을 기다려보세요.",
        health: "몸에는 긴장이 남기 쉬운 날이에요. 알림과 자극을 줄이고 짧은 쉬는 시간을 먼저 확보해보세요.",
        mind: "생각이 한 덩어리로 뭉치면 더 크게 느껴질 수 있어요. 감정과 사실을 나눠 한 줄씩 이름 붙여보세요."
      },
      cautions: [
        "민감한 말은 바로 보내지 말고 표현의 온도만 낮춰 다시 써보세요.",
        "계획 없는 결제는 조건을 비교한 뒤 결정하세요."
      ],
      action_tip: "오늘 꼭 볼 지출 1건만 골라 금액과 이유를 1분 안에 적어보세요.",
      debug
    }
  }
}

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
          "바로 결론을 내리기보다 오늘 꼭 붙잡을 일 하나만 먼저 골라보세요.",
          "반응이 빨라질수록 문장을 한 번 더 읽고 천천히 움직이는 편이 좋아요."
        ],
        action_tip: "오늘 할 일 중 가장 중요한 것 하나만 표시하고, 나머지는 잠시 뒤로 미뤄보세요.",
        debug
      }
    }
  }

  return {
    model: error ? "local-fallback-engine-request-error-v2" : "local-fallback-engine",
    content: {
      headline: "오늘의 흐름을 천천히 확인하세요",
      basis: "오늘은 바깥으로 크게 밀어붙이기보다, 지금 붙잡을 수 있는 일을 작게 나누는 쪽이 안정적이에요.",
      summary: "생각과 해야 할 일이 함께 올라올 수 있는 날이에요. 전부 해결하려 하기보다 가장 중요한 한 가지를 먼저 고르면 흐름이 한결 차분해집니다.",
      sections: {
        work: "새 일을 더 얹기보다 이미 잡고 있는 일의 우선순위를 나누는 편이 좋아요. 작은 결과물 하나만 남겨도 흐름이 안정됩니다.",
        money: "돈은 크게 움직이기보다 예정된 지출과 남는 부담을 확인하는 쪽이 좋아요. 필요한 이유와 뒤따르는 책임을 한 번 더 살펴보세요.",
        relationships: "가까운 관계에서는 반응이 먼저 올라오기 쉬워요. 메시지는 바로 보내기보다 한 번 다시 읽고 부드럽게 다듬어보세요.",
        love: "마음을 크게 확인하려 하기보다 부담 없는 안부나 따뜻한 한마디가 더 잘 맞는 날이에요. 편안한 대화의 리듬을 먼저 살펴보세요.",
        health: "몸에 남은 긴장이나 답답함이 느껴질 수 있어요. 일정 사이에 조용한 틈을 남기고 자극을 조금 줄이면 흐름이 덜 과열됩니다.",
        mind: "생각이 안쪽에서 오래 맴돌 수 있어요. 결론을 급히 내리기보다 오늘 떠오른 생각 하나만 짧게 적어보세요."
      },
      cautions: [
        "민감한 답장은 바로 보내지 말고 한 번 읽은 뒤 천천히 보내세요.",
        "오늘 맡은 일을 혼자 다 끌어안기보다 작은 단위로 나누어 보세요."
      ],
      action_tip: "1분만 써서 오늘 꼭 끝낼 일 하나와 미뤄도 되는 일 하나를 나눠 적어보세요.",
      debug
    }
  }
}

import { requestLlmReport, saveFortuneReport, getFortuneReport } from '../api'

/**
 * 오늘의 운세 리포트를 가져오거나 새로 생성합니다.
 */
export async function getOrGenerateReport(profileId, dailySnapshot) {
  const targetDate = dailySnapshot.target_date
  const version = '1.0'

  // 1. 기존 리포트 확인
  const existingReport = await getFortuneReport(profileId, targetDate, version)
  if (existingReport) {
    return { ...existingReport, is_cached: true }
  }

  // 2. LLM에게 리포트 생성 요청 (Edge Function 호출)
  const llmResult = await requestLlmReport(dailySnapshot)
  
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

  const savedReport = await saveFortuneReport(reportToSave)
  return { ...savedReport, is_cached: false }
}

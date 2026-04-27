/**
 * 추출된 사주 분석 데이터에서 LLM에 전달할 최소한의 데이터만 추출합니다.
 */
export function buildFortuneLlmPayload(dailySnapshot) {
  const profile = dailySnapshot.computed_data?.interpretationProfile;

  if (!profile) {
    throw new Error('interpretationProfile is missing in dailySnapshot');
  }

  return {
    primaryTheme: profile.primaryTheme,
    secondaryTheme: profile.secondaryTheme,
    intensity: profile.intensity,
    recommendedNarrative: profile.recommendedNarrative,
    fieldNarratives: profile.fieldNarratives,
    avoidNarratives: profile.avoidNarratives,
    mainSupports: profile.mainSupports || [],
    mainPressures: profile.mainPressures || []
  };
}

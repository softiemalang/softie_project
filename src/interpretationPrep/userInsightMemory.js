/**
 * userInsightMemory.js
 *
 * 내담자가 대화 세션에서 제공한 자기 서사(Self-Narrative)를 정제하여
 * 개인화된 인사이트 프로필(User Insight Profile)로 축적하고 관리하는 메모리 레이어 모듈
 */

export function createEmptyUserInsightProfile(subjectName = '내담자') {
  return {
    subjectName,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    insights: {
      relationshipPattern: [], // 인연 및 대인관계 패턴
      careerPreference: [],    // 직업 및 역량 발휘 선호
      coreValues: [],          // 주요 가치관 및 내면 성찰
    },
  }
}

export function extractUserInsights(userProvidedContextList = [], existingProfile = null) {
  const profile = existingProfile || createEmptyUserInsightProfile()
  const relationshipPattern = [...profile.insights.relationshipPattern]
  const careerPreference = [...profile.insights.careerPreference]
  const coreValues = [...profile.insights.coreValues]

  userProvidedContextList.forEach((text) => {
    const trimmed = text.trim()
    if (!trimmed) return

    if (trimmed.includes('관계') || trimmed.includes('사람') || trimmed.includes('연애') || trimmed.includes('친해')) {
      if (!relationshipPattern.includes(trimmed)) {
        relationshipPattern.push(trimmed)
      }
    } else if (trimmed.includes('직업') || trimmed.includes('일') || trimmed.includes('커리어') || trimmed.includes('상담')) {
      if (!careerPreference.includes(trimmed)) {
        careerPreference.push(trimmed)
      }
    } else {
      if (!coreValues.includes(trimmed)) {
        coreValues.push(trimmed)
      }
    }
  })

  return {
    ...profile,
    updatedAt: new Date().toISOString(),
    insights: {
      relationshipPattern,
      careerPreference,
      coreValues,
    },
  }
}

export function clearUserInsightProfile(subjectName = '내담자') {
  return createEmptyUserInsightProfile(subjectName)
}

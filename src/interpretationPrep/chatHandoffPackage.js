/**
 * chatHandoffPackage.js
 *
 * 현재 지원되는 계산 데이터와 불확실성, 질문 맥락을 묶어
 * Chat 모드에 복사/전달할 패키지를 생성하는 모듈
 */

export function buildChatHandoffPackage(unifiedContext = {}, userQuestion = '', topicCategory = 'general') {
  const {
    subjectName = '내담자',
    availableSystems = [],
    unifiedConfidence = {},
    sajuContext = {},
  } = unifiedContext

  const overallConfidence = unifiedConfidence.overallConfidence || 'medium'
  const isLowConfidence = overallConfidence === 'low' || overallConfidence === 'medium'

  const sajuFactual = sajuContext.candidateSetConsensus?.factual || {}
  const availableSystemLabels = availableSystems.map((system) => ({
    saju: '사주',
    ziwei: '자미두수',
    astrology: '서양 점성학',
  }[system] || system))
  const availableSystemText = availableSystemLabels.join(', ') || '없음'
  const warnings = unifiedConfidence.warnings || []
  const warningLines = warnings.map((warning) => `- ${warning}`).join('\n')
  const pillars = [
    ['연주', sajuFactual.yearPillar],
    ['월주', sajuFactual.monthPillar],
    ['일주', sajuFactual.dayPillar],
    ['시주', sajuFactual.hourPillar],
  ].map(([label, value]) => `${label} ${value || '미확정'}`).join(' · ')

  const timestampStr = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })
  const schemaHeader = `[SCHEMA v1.0 · Generated ${timestampStr}]`

  const fullMarkdown = `
${schemaHeader}
# [사주 계산 기반 AI 해석 요청 자료 - ${subjectName}님]

## 1. 질문 및 대화 맥락
- **내담자 고민 질문**: "${userQuestion || '전반적인 내면 기질과 환경의 조화가 궁금합니다.'}"
- **주요 관심 도메인**: ${topicCategory}
- **계산 상태**: ${unifiedConfidence.overallGuidance || '표시된 계산값과 불확실성만 사용'}

## 2. 실제 계산 근거
- **계산 자료가 있는 체계**: ${availableSystemText}
- **사주 원국**: ${pillars}
- **일간**: ${sajuFactual.dayMaster || '미확정'}
- **사주 계산 신뢰도**: ${unifiedConfidence.sajuConfidence || 'medium'}

## 3. 지원 범위와 불확실성
${warningLines || '- 별도 경고 없음'}

## 4. Chat AI 해석 가드레일
- 제공된 사주 계산값을 임의로 변경하지 마십시오.
- 계산 자료가 없는 자미두수·서양 점성학 값을 추정하거나 새로 만들어내지 마십시오.
- 실험적 판정과 경계 후보는 확정 사실과 분리하고, 운명을 결정론적으로 예언하지 마십시오.
${isLowConfidence ? '- [불확실성 고지] 경계 후보 또는 검증 필요 요소를 하나로 단정하지 마십시오.' : ''}

## 5. 대화 시작 요청
"위 사주 계산 근거와 불확실성 기준 안에서, 제가 어떤 가능성을 가지고 삶의 방향을 탐색할 수 있을지 따뜻하고 현실적인 대화로 이야기를 시작해주세요."
`.trim()

  const quickMarkdown = `
${schemaHeader}
[사주 계산 기반 해석 요약 자료 - ${subjectName}님]
- 질문: "${userQuestion || '내면 기질과 환경 조화'}"
- 사주 원국: ${pillars}
- 일간: ${sajuFactual.dayMaster || '미확정'}
- 해석 요청: 제공된 사주 계산값과 불확실성만 사용하고, 미지원 체계의 값은 만들지 말아주세요.
`.trim()

  const topicFocusedMarkdown = `
${schemaHeader}
[${topicCategory.toUpperCase()} 집중 사주 해석 자료 - ${subjectName}님]
- 질문: "${userQuestion || '도메인 집중 질문'}"
- 사주 근거: ${pillars} · 일간 ${sajuFactual.dayMaster || '미확정'}
- 요청: ${topicCategory} 질문을 중심으로 보되, 계산값을 바꾸거나 실험적 판단을 확정하지 말고 성찰 질문으로 대화를 이끌어주세요.
`.trim()

  const privacyMinimalMarkdown = `
${schemaHeader}
[사주 익명 해석 요청 자료 - 개인정보 비공개 모드]
- 고민 주제: "${userQuestion || '내면 기질 및 환경 조화'}"
- 사주 근거: ${pillars} · 일간 ${sajuFactual.dayMaster || '미확정'}
- 요청: 신원과 출생 정보는 비공개입니다. 제공된 사주 계산값과 불확실성만 바탕으로 대화를 이끌어주세요.
`.trim()

  const copies = {
    full: fullMarkdown,
    quick: quickMarkdown,
    topicFocused: topicFocusedMarkdown,
    privacyMinimal: privacyMinimalMarkdown,
  }

  const characterCounts = {
    full: fullMarkdown.length,
    quick: quickMarkdown.length,
    topicFocused: topicFocusedMarkdown.length,
    privacyMinimal: privacyMinimalMarkdown.length,
  }

  return {
    subjectName,
    userQuestion,
    topicCategory,
    copies,
    characterCounts,
  }
}

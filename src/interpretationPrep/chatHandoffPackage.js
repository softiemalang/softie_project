/**
 * chatHandoffPackage.js
 *
 * 사주·자미두수·서양점성학 3대 체계 통합 데이터와 불확실성,
 * 질문 맥락을 묶어 Chat 모드에 복사/전달할 패키지를 생성하는 모듈
 */

import { createUnifiedInterpretationContext } from './unifiedInterpretationContext.js'

export function buildChatHandoffPackage(unifiedContext = {}, userQuestion = '', topicCategory = 'general') {
  const {
    subjectName = '내담자',
    systemAgreement = {},
    sharedThemes = [],
    differentPerspectives = [],
    unifiedConfidence = {},
    sajuContext = {},
    ziweiContext = {},
    astrologyContext = {},
  } = unifiedContext

  const overallConfidence = unifiedConfidence.overallConfidence || 'high'
  const isLowConfidence = overallConfidence === 'low' || overallConfidence === 'medium'

  const sajuFactual = sajuContext.candidateSetConsensus?.factual || {}
  const ziweiFactual = ziweiContext.candidateSetConsensus?.factual || {}
  const astrologyFactual = astrologyContext.astrologyContextSnapshot?.factualSigns || {}

  const timestampStr = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })
  const schemaHeader = `[SCHEMA v1.0 · Generated ${timestampStr}]`

  // 1. Full Copy (전체 복사)
  const fullMarkdown = `
${schemaHeader}
# [3대 체계 통합 AI 해석 요청 자료 - ${subjectName}님]

## 1. 질문 및 대화 맥락
- **내담자 고민 질문**: "${userQuestion || '전반적인 내면 기질과 환경의 조화가 궁금합니다.'}"
- **주요 관심 도메인**: ${topicCategory}
- **통합 신뢰도 상태**: ${unifiedConfidence.overallGuidance || '정상 데이터'}

## 2. 3대 체계별 계산 근거 (Fact & Resolvers)
- **사주 렌즈**: 일간 ${sajuFactual.dayMaster || '미상'} 중심 오행 기질 (신뢰도: ${unifiedConfidence.sajuConfidence || 'high'})
- **자미두수 렌즈**: 명궁 ${ziweiFactual.mingGongBranch || '미상'}宮 삼방사정 배치 (신뢰도: ${unifiedConfidence.ziweiConfidence || 'high'})
- **서양점성학 렌즈**: Sun in ${astrologyFactual.sunSign || '미상'}, Ascendant in ${astrologyFactual.ascendantSign || '미상'} (신뢰도: ${unifiedConfidence.astrologyConfidence || 'high'})

## 3. 다차원 관점 통합 (Synthesis)
- **체계 간 시너지**: ${systemAgreement.agreementLevel} (${systemAgreement.note})
${sharedThemes.map((t) => `- **공통 테마 [${t.label}]**: 사주(내면 동력), 자미두수(대외 환경), 점성학(심리 원형)의 층위적 보완`).join('\n')}
- **체계별 구별**: ${differentPerspectives.map((p) => p.description).join(' / ')}

## 4. Chat AI 해석 가드레일 (Strict Isolation & Safety Rules)
- 사주, 자미두수, 서양점성학의 용어(오행, 주성/궁위, 행성/하우스)를 한 문장에서 직접 인과관계로 섞지 말고 각각 자기 언어로 설명하십시오.
- 특정 체계의 결과를 우위로 단정하거나 운명을 결정론적으로 예언하지 마십시오.
${isLowConfidence ? '- [불확실성 고지] 일부 체계에 경계 후보가 포함되어 있으므로 단정적인 예측을 금하고 분리 고지하십시오.' : ''}

## 5. 대화 시작 요청
"위 3대 체계의 독립적인 관점과 불확실성 기준을 참고하여, 제가 어떤 가능성을 가지고 삶의 방향을 탐색할 수 있을지 따뜻하고 입체적인 대화로 이야기를 시작해주세요."
`.trim()

  // 2. Quick Copy (간편 복사)
  const quickMarkdown = `
${schemaHeader}
[3대 체계 통합 해석 요약 자료 - ${subjectName}님]
- 질문: "${userQuestion || '내면 기질과 환경 조화'}"
- 사주 렌즈: 일간 ${sajuFactual.dayMaster || '미상'} 중심 오행 수양
- 자미두수 렌즈: 명궁 ${ziweiFactual.mingGongBranch || '미상'}宮 삼방사정 환경
- 서양점성학 렌즈: Sun in ${astrologyFactual.sunSign || '미상'}, Asc in ${astrologyFactual.ascendantSign || '미상'}
- 해석 요청: 3개 체계 용어를 인과관계로 섞지 말고, 각각의 관점에서 질문에 대해 대화식으로 이야기해주세요.
`.trim()

  // 3. Topic Focused Copy (질문 중심 복사)
  const topicFocusedMarkdown = `
${schemaHeader}
[${topicCategory.toUpperCase()} 집중 3대 체계 해석 자료 - ${subjectName}님]
- 질문: "${userQuestion || '도메인 집중 질문'}"
- 사주 시각: ${sajuFactual.dayMaster ? `일간 ${sajuFactual.dayMaster} 오행 생극제화` : '내면 기질'}
- 자미두수 시각: ${ziweiFactual.mingGongBranch ? `명궁 ${ziweiFactual.mingGongBranch}宮 삼방사정` : '사회적 대외 무대'}
- 점성학 시각: ${astrologyFactual.sunSign ? `Sun in ${astrologyFactual.sunSign}` : '원형적 심리 상징'}
- 요청: ${topicCategory} 관점에 가장 친화적인 체계를 우선 참조하되 단정 없이 성찰 질문으로 대화를 이끌어주세요.
`.trim()

  // 4. Privacy-Preserving Anonymized Copy (개인정보 보호 복사)
  const privacyMinimalMarkdown = `
${schemaHeader}
[3대 체계 익명 해석 요청 자료 - 개인정보 비공개 모드]
- 고민 주제: "${userQuestion || '내면 기질 및 환경 조화'}"
- 사주 렌즈: 일간 ${sajuFactual.dayMaster || '미상'} 중심 오행 수양
- 자미두수 렌즈: 명궁 ${ziweiFactual.mingGongBranch || '미상'}宮 삼방사정 환경
- 서양점성학 렌즈: Sun in ${astrologyFactual.sunSign || '미상'}, Asc in ${astrologyFactual.ascendantSign || '미상'}
- 요청: 내담자의 신원 및 출생 정보는 모두 비공개로 마스킹되어 있습니다. 3개 체계의 상징 데이터를 바탕으로 입체적인 대화를 이끌어주세요.
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


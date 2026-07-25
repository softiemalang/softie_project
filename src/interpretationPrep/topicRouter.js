/**
 * topicRouter.js
 *
 * 내담자의 질문 텍스트 및 의도를 다층 분석하여
 * 질문 도메인(Topic), 의도(Intent), 3대 체계 참조 우선순위(Lens Priority)를 산출하는 모듈
 */

export const LENS_PRIORITY_MATRIX = {
  personality: {
    primary: ['saju', 'astrology'],
    secondary: ['ziwei'],
    contextual: [],
    rationale: '내면의 기질 및 오행 수양(사주)과 심리 원형·의식 발전 여정(점성학)을 최우선 참조합니다.',
  },
  career: {
    primary: ['ziwei'],
    secondary: ['saju'],
    contextual: ['astrology'],
    rationale: '사회적 환경 배치, 명궁/관록궁/재백궁 삼방사정 관계망(자미두수)을 최우선 참조합니다.',
  },
  relationship: {
    primary: ['ziwei', 'astrology'],
    secondary: ['saju'],
    contextual: [],
    rationale: '인간관계 대외 매커니즘(자미두수)과 관계/가치관의 심리적 상징(점성학)을 최우선 참조합니다.',
  },
  timing: {
    primary: ['saju', 'astrology'],
    secondary: ['ziwei'],
    contextual: [],
    rationale: '오행 대운/세운 흐름(사주)과 상징적 시간선·트랜짓(점성학)을 최우선 참조합니다.',
  },
  general: {
    primary: ['saju', 'ziwei', 'astrology'],
    secondary: [],
    contextual: [],
    rationale: '3대 체계를 균형 있게 입체적 렌즈로 참조합니다.',
  },
}

export function analyzeQuestionTopic(questionText = '') {
  const text = questionText.trim().toLowerCase()

  let primaryTopic = 'general'
  const secondaryTopics = []
  let intent = 'exploration'
  let questionType = 'open_question'

  // Keywords Analysis
  if (text.includes('직업') || text.includes('일') || text.includes('적성') || text.includes('커리어') || text.includes('이직') || text.includes('사업')) {
    primaryTopic = 'career'
    if (text.includes('나') || text.includes('성향') || text.includes('지치')) {
      secondaryTopics.push('personality')
    }
  } else if (text.includes('연애') || text.includes('결혼') || text.includes('사람') || text.includes('관계') || text.includes('인연') || text.includes('친구')) {
    primaryTopic = 'relationship'
    if (text.includes('성격') || text.includes('나')) {
      secondaryTopics.push('personality')
    }
  } else if (text.includes('시기') || text.includes('언제') || text.includes('변화') || text.includes('운') || text.includes('흐름')) {
    primaryTopic = 'timing'
    if (text.includes('직업') || text.includes('이직')) {
      secondaryTopics.push('career')
    }
  } else if (text.includes('나') || text.includes('성격') || text.includes('성향') || text.includes('지치') || text.includes('마음') || text.includes('누구')) {
    primaryTopic = 'personality'
    if (text.includes('요즘') || text.includes('지금')) {
      secondaryTopics.push('timing')
    }
  }

  // Intent classification
  if (text.includes('고민') || text.includes('지치') || text.includes('힘들')) {
    intent = 'self_reflection_and_empathy'
  } else if (text.includes('언제') || text.includes('어떻게')) {
    intent = 'actionable_guidance'
  }

  // Question Type
  if (text.endsWith('?') || text.includes('궁금')) {
    questionType = 'open_question'
  }

  const lensPriority = LENS_PRIORITY_MATRIX[primaryTopic] || LENS_PRIORITY_MATRIX.general

  return {
    originalQuestion: questionText,
    topic: {
      primary: primaryTopic,
      secondary: secondaryTopics,
    },
    intent,
    questionType,
    lensPriority,
  }
}

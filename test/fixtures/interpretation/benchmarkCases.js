/**
 * benchmarkCases.js
 *
 * Interpretation Prompt Benchmark를 위한 5대 핵심 실전 테스트 케이스 정의
 */

export const BENCHMARK_CASES = [
  {
    id: 'case_a_exact_career',
    title: 'Case A: exact + career (정확한 시간 + 커리어 탐색)',
    input: {
      subjectName: '커리어_정확',
      birthDate: '1990-05-15',
      birthTime: '14:30',
      timeAccuracy: 'exact',
      targetDate: '2026-07-25',
      gender: 'female',
      calendar: 'solar',
      referenceCity: 'seoul',
      timezone: 'Asia/Seoul',
    },
    topicId: 'career',
    question: '제게 가장 잘 맞는 직업적 강점과 업무 환경이 궁금합니다.',
  },
  {
    id: 'case_b_unknown_personality',
    title: 'Case B: unknown + personality (출생시각 모름 + 성향 기질)',
    input: {
      subjectName: '성향_시간모름',
      birthDate: '1990-05-15',
      timeAccuracy: 'unknown',
      targetDate: '2026-07-25',
      gender: 'male',
      calendar: 'solar',
      referenceCity: 'seoul',
      timezone: 'Asia/Seoul',
    },
    topicId: 'personality',
    question: '제 본질적인 기질과 성향의 공통 특징을 알고 싶어요.',
  },
  {
    id: 'case_c_dst_relationship',
    title: 'Case C: historical_dst + relationship (서머타임 구간 + 소통 대인관계)',
    input: {
      subjectName: '관계_DST',
      birthDate: '1988-05-10',
      birthTime: '01:30',
      timeAccuracy: 'exact',
      targetDate: '2026-07-25',
      gender: 'female',
      calendar: 'solar',
      referenceCity: 'seoul',
      timezone: 'Asia/Seoul',
    },
    topicId: 'relationship',
    question: '대인관계에서 소통할 때 제가 주의할 점과 갈등 해결 방식이 궁금합니다.',
  },
  {
    id: 'case_d_solar_term_timing',
    title: 'Case D: solar_term / timing + low_confidence (절기 경계 + 운의 흐름/시점)',
    input: {
      subjectName: '시점_절기경계',
      birthDate: '1990-02-04',
      birthTime: '11:10',
      timeAccuracy: 'exact',
      targetDate: '2026-07-25',
      gender: 'female',
      calendar: 'solar',
      referenceCity: 'seoul',
      timezone: 'Asia/Seoul',
    },
    topicId: 'timing',
    question: '입춘 경계에 태어났는데 2027년에 제 삶에 큰 변화가 크게 올까요?',
  },
  {
    id: 'case_e_exact_relationship',
    title: 'Case E: exact + relationship (정확한 시간 + 소통 대인관계)',
    input: {
      subjectName: '관계_정확',
      birthDate: '1990-05-15',
      birthTime: '14:30',
      timeAccuracy: 'exact',
      targetDate: '2026-07-25',
      gender: 'female',
      calendar: 'solar',
      referenceCity: 'seoul',
      timezone: 'Asia/Seoul',
    },
    topicId: 'relationship',
    question: '제 대인관계 소통 패턴과 조화로운 관계를 위한 조언을 듣고 싶어요.',
  },
]

export const QUALITY_RUBRIC = [
  { id: 'r1', criterion: '1. 후보 불확실성 / 가능성 명확 표현', scale: '0 ~ 2점' },
  { id: 'r2', criterion: '2. 공통점 중심 가독성 압축 능력', scale: '0 ~ 2점' },
  { id: 'r3', criterion: '3. 사용자 성찰 및 경험 질문 유도', scale: '0 ~ 2점' },
  { id: 'r4', criterion: '4. 현실 적용성 및 주체적 조언', scale: '0 ~ 2점' },
  { id: 'r5', criterion: '5. 단정적 / 운명론적 과장 완전 배제', scale: '0 ~ 2점' },
  { id: 'r6', criterion: '6. 4단계 Interpretation Protocol 구조 준수 (Consensus -> Variance -> Question -> Guidance)', scale: '0 ~ 2점' },
]

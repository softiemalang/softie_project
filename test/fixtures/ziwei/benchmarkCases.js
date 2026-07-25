/**
 * benchmarkCases.js
 *
 * Ziwei Interpretation Quality Benchmark용 5개 대표 픽스처
 */

export const ZIWEI_BENCHMARK_CASES = [
  {
    id: 'case_a_exact_personality',
    name: 'Case A: 정격 명반 + 성격/기질 도메인',
    input: {
      subjectName: '정격테스트',
      birthYearStem: '庚',
      lunarMonth: 5,
      hourBranch: '午',
      timeConfidence: 'exact',
    },
    domainProfile: 'personality',
    expectedFocusPalace: 'life',
  },
  {
    id: 'case_b_unknown_time_personality',
    name: 'Case B: 출생 시지 미상 (12개 후보 명반) + 성격 도메인',
    input: {
      subjectName: '시지미상테스트',
      birthYearStem: '甲',
      lunarMonth: 3,
      timeConfidence: 'unknown',
    },
    domainProfile: 'personality',
    expectedLowConfidence: true,
  },
  {
    id: 'case_c_leap_month_relationship',
    name: 'Case C: 윤달 출생 조건 + 대인관계/배우자 도메인',
    input: {
      subjectName: '윤달관계테스트',
      birthYearStem: '丙',
      lunarMonth: 4,
      isLeapMonth: true,
      hourBranch: '辰',
    },
    domainProfile: 'relationship',
    expectedFocusPalace: 'spouse',
    expectedLowConfidence: true,
  },
  {
    id: 'case_d_hua_ji_career',
    name: 'Case D: 화기(化忌) 포함 명반 + 커리어 도메인',
    input: {
      subjectName: '화기커리어테스트',
      birthYearStem: '辛', // 辛年: 文昌化忌 (문창화기)
      lunarMonth: 7,
      hourBranch: '酉',
    },
    domainProfile: 'career',
    expectedFocusPalace: 'career',
  },
  {
    id: 'case_e_timing_low_confidence',
    name: 'Case E: 시운(timing) 질문 + low confidence 조건',
    input: {
      subjectName: '시운미상테스트',
      birthYearStem: '癸',
      lunarMonth: 9,
      timeConfidence: 'range',
    },
    domainProfile: 'timing',
    expectedLowConfidence: true,
  },
]

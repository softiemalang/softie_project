/**
 * benchmarkCases.js
 *
 * Saju & Ziwei Unified Quality Benchmark용 5개 대표 복합 픽스처
 */

export const UNIFIED_BENCHMARK_CASES = [
  {
    id: 'case_1_exact_saju_exact_ziwei',
    name: 'Case 1: 양쪽 모두 정격 명반 (multi_lens_synthesis)',
    sajuInput: {
      subjectName: '양쪽정격테스트',
      birthYear: 1984,
      birthMonth: 5,
      birthDay: 15,
      birthHour: 12,
    },
    ziweiInput: {
      subjectName: '양쪽정격테스트',
      birthYearStem: '甲',
      lunarMonth: 5,
      hourBranch: '午',
    },
    domainProfile: 'career',
    expectedAgreement: 'multi_lens_synthesis',
  },
  {
    id: 'case_2_low_saju_exact_ziwei',
    name: 'Case 2: 사주 절기 경계(low) + 자미두수 정격(high) (single_system_only - 후보 사주 합성 제외)',
    sajuInput: {
      subjectName: '사주불확실테스트',
      birthYear: 1984,
      birthMonth: 2,
      birthDay: 4, // 입춘 경계
      birthHour: 6,
    },
    ziweiInput: {
      subjectName: '사주불확실테스트',
      birthYearStem: '甲',
      lunarMonth: 1,
      hourBranch: '卯',
    },
    domainProfile: 'personality',
    expectedAgreement: 'single_system_only',
    expectedOverallConfidence: 'medium',
  },
  {
    id: 'case_3_exact_saju_low_ziwei',
    name: 'Case 3: 사주 정격(high) + 자미두수 윤달/시간 미상(low) (single_system_only - 후보 자미두수 합성 제외)',
    sajuInput: {
      subjectName: '자미불확실테스트',
      birthYear: 1990,
      birthMonth: 8,
      birthDay: 10,
      birthHour: 14,
    },
    ziweiInput: {
      subjectName: '자미불확실테스트',
      birthYearStem: '庚',
      lunarMonth: 8,
      isLeapMonth: true, // 윤달 불확실성
      hourBranch: '未',
    },
    domainProfile: 'timing',
    expectedAgreement: 'single_system_only',
    expectedOverallConfidence: 'high',
  },
  {
    id: 'case_4_hua_ji_saju_conflict',
    name: 'Case 4: 사주 상충 + 자미두수 화기(化忌) 포함 복합 명반',
    sajuInput: {
      subjectName: '복합상충테스트',
      birthYear: 1991,
      birthMonth: 7,
      birthDay: 20,
    },
    ziweiInput: {
      subjectName: '복합상충테스트',
      birthYearStem: '辛', // 辛年: 文昌化忌
      lunarMonth: 7,
      hourBranch: '酉',
    },
    domainProfile: 'career',
    expectedAgreement: 'multi_lens_synthesis',
  },
  {
    id: 'case_5_both_low_confidence',
    name: 'Case 5: 양쪽 모두 불확실 (insufficient_data - 복수 후보 차단)',
    sajuInput: {
      subjectName: '양쪽불확실테스트',
      birthYear: 2000,
      birthMonth: 2,
      birthDay: 4, // 입춘 경계
      birthHour: 0, // 자시 경계
    },
    ziweiInput: {
      subjectName: '양쪽불확실테스트',
      birthYearStem: '庚',
      lunarMonth: 1,
      isLeapMonth: true,
      hourBranch: '子',
    },
    domainProfile: 'general',
    expectedAgreement: 'insufficient_data',
    expectedOverallConfidence: 'not_available',
  },
]

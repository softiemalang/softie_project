/**
 * benchmarkCases.js
 *
 * 서양 점성학(Western Astrology) 5대 대표 Quality Benchmark 피스처
 */

export const ASTROLOGY_BENCHMARK_CASES = [
  {
    id: 'case1_exact_personality',
    name: 'Case 1: 정격 출생 정보 기반 personality 해석',
    domainProfile: 'personality',
    input: {
      subjectName: '정격내담자',
      birthYear: 1990,
      birthMonth: 5,
      birthDay: 10,
      birthTime: '14:30',
      latitude: 37.56,
      longitude: 126.97,
    },
    expectedConfidence: 'high',
    requiredEvidenceKeys: ['sunSign', 'moonSign', 'ascendant'],
  },
  {
    id: 'case2_unknown_birth_time',
    name: 'Case 2: 출생시각 미상 불확실성 전파',
    domainProfile: 'personality',
    input: {
      subjectName: '시간미상내담자',
      birthYear: 1992,
      birthMonth: 8,
      birthDay: 20,
    },
    expectedConfidence: 'low',
    requiredUncertaintyField: 'ascendant_and_houses',
  },
  {
    id: 'case3_saturn_pluto_hard_aspect',
    name: 'Case 3: 토성/명왕성 하드 아스펙트 단정 방지',
    domainProfile: 'personality',
    input: {
      subjectName: '토성명왕성내담자',
      birthYear: 1988,
      birthMonth: 11,
      birthDay: 15,
      birthTime: '08:00',
    },
    expectedConfidence: 'high',
    forbiddenKeywords: ['불행', '재앙', '파괴', '절망', '시련'],
  },
  {
    id: 'case4_timing_transit_low_confidence',
    name: 'Case 4: 시기적 흐름 미래 확정 예언 방지',
    domainProfile: 'timing',
    input: {
      subjectName: '타이밍내담자',
      birthYear: 1995,
      birthMonth: 3,
      birthDay: 25,
      birthTime: '18:15',
    },
    expectedConfidence: 'high',
    forbiddenKeywords: ['반드시', '확정', '예언', '피할 수 없는'],
  },
  {
    id: 'case5_relationship_venus_mars',
    name: 'Case 5: 금성/화성 관계 성향 단정 방지',
    domainProfile: 'relationship',
    input: {
      subjectName: '관계내담자',
      birthYear: 1993,
      birthMonth: 12,
      birthDay: 5,
      birthTime: '11:00',
    },
    expectedConfidence: 'high',
    requiredEvidenceKeys: ['sunSign', 'moonSign'],
  },
]

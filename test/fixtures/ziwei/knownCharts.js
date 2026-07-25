/**
 * knownCharts.js
 *
 * 자미두수 명궁, 신궁, 오행국 산출 알고리즘 검증을 위한 표준 Fixture 데이터
 */

export const KNOWN_ZIWEI_CHARTS = [
  {
    id: 'sample_1_lunar_5_hour_wu',
    description: '음력 5월, 오시(午時) 출생',
    input: {
      lunarMonth: 5,
      hourBranch: '午', // 인덱스 6
      birthYearStem: '庚',
      isLeapMonth: false,
    },
    expected: {
      mingGongBranch: '子', // 寅(2) + (5-1) - 6 -> 0 ('子')
      shenGongBranch: '子', // 寅(2) + (5-1) + 6 -> 12 -> 0 ('子')
      fiveElementsBureau: { id: 'fire_6', name: '화육국', number: 6 },
    },
  },
  {
    id: 'sample_2_lunar_1_hour_zi',
    description: '음력 1월, 자시(子時) 출생',
    input: {
      lunarMonth: 1,
      hourBranch: '子', // 인덱스 0
      birthYearStem: '甲',
      isLeapMonth: false,
    },
    expected: {
      mingGongBranch: '寅', // 寅(2) + (1-1) - 0 -> 2 ('寅')
      shenGongBranch: '寅', // 寅(2) + (1-1) + 0 -> 2 ('寅')
      fiveElementsBureau: { id: 'fire_6', name: '화육국', number: 6 },
    },
  },
  {
    id: 'sample_3_leap_month_boundary',
    description: '윤월 5월 출생 (윤달 후보 생성 대상)',
    input: {
      lunarMonth: 5,
      hourBranch: '辰', // 인덱스 4
      birthYearStem: '丙',
      isLeapMonth: true,
    },
    expectedCandidates: [
      { mode: 'current_month', lunarMonth: 5, mingGongBranch: '寅' },
      { mode: 'next_month', lunarMonth: 6, mingGongBranch: '卯' },
    ],
  },
]

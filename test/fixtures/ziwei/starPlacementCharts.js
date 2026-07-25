/**
 * starPlacementCharts.js
 *
 * 14주성 배치 수식 검증을 위한 레퍼런스 Fixtures
 */

export const KNOWN_STAR_PLACEMENT_CHARTS = [
  {
    id: 'sample_water_2_bureau_day_1',
    description: '수이국(2국), 음력 1일 출생',
    input: { bureauNumber: 2, lunarDay: 1 },
    expected: {
      ziweiBranch: '丑',
      tianfuBranch: '酉',
    },
  },
  {
    id: 'sample_wood_3_bureau_day_15',
    description: '목삼국(3국), 음력 15일 출생',
    input: { bureauNumber: 3, lunarDay: 15 },
    expected: {
      ziweiBranch: '午',
      tianfuBranch: '辰',
    },
  },
  {
    id: 'sample_fire_6_bureau_day_22',
    description: '화육국(6국), 음력 22일 출생',
    input: { bureauNumber: 6, lunarDay: 22 },
    expected: {
      ziweiBranch: '未',
      tianfuBranch: '卯',
    },
  },
]

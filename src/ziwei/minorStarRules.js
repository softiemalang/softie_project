/**
 * minorStarRules.js
 *
 * 자미두수 육길성(六吉星) 및 육살성(六殺星) 배치 규칙 및 버전 관리
 */

export const MINOR_STAR_RULESET = {
  version: 'traditional_v1',
  description: '전통 자미두수 보조성(육길성/육살성) 포국 규칙',
}

const BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']

// 1. 좌보(左輔) / 우필(右弼) - 음력 월 기준
// 좌보: 辰宮(index 4)에서 시계방향으로 음력월 수만큼 진행
// 우필: 戌宮(index 10)에서 반시계방향으로 음력월 수만큼 진행
export function calculateZuoboBranch(lunarMonth) {
  const month = Number(lunarMonth) || 1
  return BRANCHES[(4 + (month - 1)) % 12]
}

export function calculateYoubiBranch(lunarMonth) {
  const month = Number(lunarMonth) || 1
  return BRANCHES[(10 - (month - 1) + 1200) % 12]
}

// 2. 문창(文昌) / 문곡(文曲) - 출생 시지 기준
// 문창: 戌宮(index 10)에서 반시계방향으로 시지 수만큼 진행
// 문곡: 辰宮(index 4)에서 시계방향으로 시지 수만큼 진행
export function calculateWenchangBranch(hourBranch) {
  const hourIdx = BRANCHES.indexOf(hourBranch) !== -1 ? BRANCHES.indexOf(hourBranch) : 0
  return BRANCHES[(10 - hourIdx + 1200) % 12]
}

export function calculateWenguBranch(hourBranch) {
  const hourIdx = BRANCHES.indexOf(hourBranch) !== -1 ? BRANCHES.indexOf(hourBranch) : 0
  return BRANCHES[(4 + hourIdx) % 12]
}

// 3. 천괴(天魁) / 천월(天鉞) - 출생 연간 기준
const LUOKUI_YUE_MAP = {
  甲: { kui: '丑', yue: '未' }, 戊: { kui: '丑', yue: '未' }, 庚: { kui: '丑', yue: '未' },
  乙: { kui: '子', yue: '申' }, 己: { kui: '子', yue: '申' },
  丙: { kui: '亥', yue: '酉' }, 丁: { kui: '亥', yue: '酉' },
  辛: { kui: '午', yue: '寅' },
  壬: { kui: '卯', yue: '巳' }, 癸: { kui: '卯', yue: '巳' },
}

export function calculateTiankuiYueBranch(birthYearStem) {
  return LUOKUI_YUE_MAP[birthYearStem] || LUOKUI_YUE_MAP['甲']
}

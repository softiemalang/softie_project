/**
 * starPlacementRules.js
 *
 * 자미두수 14주성(Major Stars) 포국 및 배치 규칙 명세 (RuleSet Versioning)
 *
 * [버전]: traditional_v1 (전통 자미두수 자미/천부계성 배치 알고리즘)
 */

export const STAR_PLACEMENT_RULESET = {
  version: 'traditional_v1',
  description: '전통 자미두수 오행국 및 음력일 기반 14주성 포국 규칙',
  ziweiMethod: 'bureau_lunar_day_division',
  tianfuMethod: 'opposite_yin_shen_axis',
  majorStarCycle: 'standard_14_major',
}

const BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']

export const TIANFU_MODES = Object.freeze({
  LEGACY: 'legacy',
  SOURCE_ALIGNED: 'source_aligned',
})

export const TIANFU_MODE_CONVENTIONS = Object.freeze({
  [TIANFU_MODES.LEGACY]: Object.freeze({
    tianfuMethod: 'opposite_yin_shen_axis',
    tianfuFormula: '(10-Z)%12',
  }),
  [TIANFU_MODES.SOURCE_ALIGNED]: Object.freeze({
    tianfuMethod: 'opposite_chen_xu_axis',
    tianfuFormula: '(4-Z)%12',
  }),
})

export function resolveTianfuMode(tianfuMode) {
  if (tianfuMode === undefined) return TIANFU_MODES.LEGACY
  if (!Object.values(TIANFU_MODES).includes(tianfuMode)) {
    throw new RangeError(`invalid_tianfu_mode:${String(tianfuMode)}`)
  }
  return tianfuMode
}

export function getTianfuModeConvention(tianfuMode) {
  const mode = resolveTianfuMode(tianfuMode)
  return { mode, ...TIANFU_MODE_CONVENTIONS[mode] }
}

/**
 * 오행국 수(bureauNumber: 2~6)와 음력 일(lunarDay: 1~30)을 이용해 자미성 지지를 산출
 */
export function calculateZiweiBranch(bureauNumber, lunarDay) {
  const day = Number(lunarDay) || 1
  const bureau = Number(bureauNumber) || 2

  let q = Math.floor(day / bureau)
  let r = day % bureau

  if (r !== 0) {
    const supplement = bureau - r
    q = Math.floor((day + supplement) / bureau)
    r = supplement
  }

  // 자미성 지지 인덱스: (寅宮 index 2 + q - 1 ± r) mod 12
  // 나머지가 홀수이면 역행(-), 짝수이면 순행(+)
  const direction = r % 2 === 1 ? -1 : 1
  const offset = q - 1 + direction * r
  const branchIndex = (2 + offset + 1200) % 12

  return BRANCHES[branchIndex]
}

/**
 * 자미성 지지 위치를 기준으로 선택된 Tianfu compatibility convention의
 * 대칭축에 위치한 천부성 지지를 산출한다.
 */
export function calculateTianfuBranch(ziweiBranch, options = {}) {
  if (options === null || typeof options !== 'object' || Array.isArray(options)) {
    throw new TypeError('invalid_tianfu_mode_options')
  }

  const tianfuMode = resolveTianfuMode(options.tianfuMode)
  const ziweiIndex = BRANCHES.indexOf(ziweiBranch) !== -1 ? BRANCHES.indexOf(ziweiBranch) : 2
  const anchorSum = tianfuMode === TIANFU_MODES.SOURCE_ALIGNED ? 4 : 10
  // legacy: 寅宮(2) + 申宮(8) = 10 -> (10 - ziweiIndex) mod 12
  // source_aligned: source convention uses 辰宮(4) -> (4 - ziweiIndex) mod 12
  const tianfuIndex = (anchorSum - ziweiIndex + 1200) % 12
  return BRANCHES[tianfuIndex]
}

// 자미계성 6星 오프셋 (자미성 지지 기준)
// 자미(0), 천기(-1:역1), 태양(-3:역3), 무곡(-4:역4), 천동(-5:역5), 염정(-8:역8)
export const ZIWEI_SERIES_OFFSETS = [
  { id: 'ziwei', name: '자미', offset: 0 },
  { id: 'tianji', name: '천기', offset: -1 },
  { id: 'taiyang', name: '태양', offset: -3 },
  { id: 'wugu', name: '무곡', offset: -4 },
  { id: 'tiandong', name: '천동', offset: -5 },
  { id: 'lianzhen', name: '염정', offset: -8 },
]

// 천부계성 8星 오프셋 (천부성 지지 기준)
// 천부(0), 태음(+1:순1), 탐랑(+2:순2), 거문(+3:순3), 천상(+4:순4), 천량(+5:순5), 칠살(+6:순6), 파군(+10:순10)
export const TIANFU_SERIES_OFFSETS = [
  { id: 'tianfu', name: '천부', offset: 0 },
  { id: 'taiyin', name: '태음', offset: 1 },
  { id: 'tanlang', name: '탐랑', offset: 2 },
  { id: 'jumen', name: '거문', offset: 3 },
  { id: 'tianxiang', name: '천상', offset: 4 },
  { id: 'tianliang', name: '천량', offset: 5 },
  { id: 'qisai', name: '칠살', offset: 6 },
  { id: 'pojun', name: '파군', offset: 10 },
]

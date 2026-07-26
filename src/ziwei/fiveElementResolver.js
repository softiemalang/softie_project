/**
 * fiveElementResolver.js
 *
 * 자미두수 오행국(五行局: 수이국, 목삼국, 금사국, 토오국, 화육국) 산출 전문 모듈
 *
 * [산출 원리]
 * - 연간(年干)에 따른 인두자(寅頭字: 寅宮의 천간) 도출
 * - 명궁 지지(Branch)에 위치한 명궁 천간 도출
 * - 명궁 천간/지지 오행국 매핑 테이블 적용
 */

export const BUREAU_DEFINITIONS = {
  water_2: { id: 'water_2', name: '수이국', number: 2, element: '수' },
  wood_3: { id: 'wood_3', name: '목삼국', number: 3, element: '목' },
  metal_4: { id: 'metal_4', name: '금사국', number: 4, element: '금' },
  earth_5: { id: 'earth_5', name: '토오국', number: 5, element: '토' },
  fire_6: { id: 'fire_6', name: '화육국', number: 6, element: '화' },
}

const STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']
const BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']

// 연간(Year Stem)에 따른 寅宮의 천간 시작점 (인두자)
// 갑기년 -> 丙寅, 을경년 -> 戊寅, 병신년 -> 庚寅, 정임년 -> 壬寅, 무계년 -> 甲寅
const YIN_STEM_MAP = {
  甲: '丙', 己: '丙',
  乙: '戊', 庚: '戊',
  丙: '庚', 辛: '庚',
  丁: '壬', 壬: '壬',
  戊: '甲', 癸: '甲',
}

// 천간+지지 60갑자 납음오행 기반 오행국 표
// (천간지지에 대응하는 국수)
const BUREAU_TABLE = {
  // 甲, 乙 계열
  甲子: BUREAU_DEFINITIONS.metal_4, 甲丑: BUREAU_DEFINITIONS.metal_4,
  甲寅: BUREAU_DEFINITIONS.water_2, 甲卯: BUREAU_DEFINITIONS.water_2,
  甲辰: BUREAU_DEFINITIONS.fire_6, 甲巳: BUREAU_DEFINITIONS.fire_6,
  甲午: BUREAU_DEFINITIONS.metal_4, 甲未: BUREAU_DEFINITIONS.metal_4,
  甲申: BUREAU_DEFINITIONS.water_2, 甲酉: BUREAU_DEFINITIONS.water_2,
  甲戌: BUREAU_DEFINITIONS.fire_6, 甲亥: BUREAU_DEFINITIONS.fire_6,

  // 丙, 丁 계열
  丙子: BUREAU_DEFINITIONS.water_2, 丙丑: BUREAU_DEFINITIONS.water_2,
  丙寅: BUREAU_DEFINITIONS.fire_6, 丙卯: BUREAU_DEFINITIONS.fire_6,
  丙辰: BUREAU_DEFINITIONS.earth_5, 丙巳: BUREAU_DEFINITIONS.earth_5,
  丙午: BUREAU_DEFINITIONS.water_2, 丙未: BUREAU_DEFINITIONS.water_2,
  丙申: BUREAU_DEFINITIONS.fire_6, 丙酉: BUREAU_DEFINITIONS.fire_6,
  丙戌: BUREAU_DEFINITIONS.earth_5, 丙亥: BUREAU_DEFINITIONS.earth_5,

  // 戊, 己 계열
  戊子: BUREAU_DEFINITIONS.fire_6, 戊丑: BUREAU_DEFINITIONS.fire_6,
  戊寅: BUREAU_DEFINITIONS.earth_5, 戊卯: BUREAU_DEFINITIONS.earth_5,
  戊辰: BUREAU_DEFINITIONS.wood_3, 戊巳: BUREAU_DEFINITIONS.wood_3,
  戊午: BUREAU_DEFINITIONS.fire_6, 戊未: BUREAU_DEFINITIONS.fire_6,
  戊申: BUREAU_DEFINITIONS.earth_5, 戊酉: BUREAU_DEFINITIONS.earth_5,
  戊戌: BUREAU_DEFINITIONS.wood_3, 戊亥: BUREAU_DEFINITIONS.wood_3,

  // 庚, 辛 계열
  庚子: BUREAU_DEFINITIONS.earth_5, 庚丑: BUREAU_DEFINITIONS.earth_5,
  庚寅: BUREAU_DEFINITIONS.wood_3, 庚卯: BUREAU_DEFINITIONS.wood_3,
  庚辰: BUREAU_DEFINITIONS.metal_4, 庚巳: BUREAU_DEFINITIONS.metal_4,
  庚午: BUREAU_DEFINITIONS.earth_5, 庚未: BUREAU_DEFINITIONS.earth_5,
  庚申: BUREAU_DEFINITIONS.wood_3, 庚酉: BUREAU_DEFINITIONS.wood_3,
  庚戌: BUREAU_DEFINITIONS.metal_4, 庚亥: BUREAU_DEFINITIONS.metal_4,

  // 壬, 癸 계열
  壬子: BUREAU_DEFINITIONS.wood_3, 壬丑: BUREAU_DEFINITIONS.wood_3,
  壬寅: BUREAU_DEFINITIONS.metal_4, 壬卯: BUREAU_DEFINITIONS.metal_4,
  壬辰: BUREAU_DEFINITIONS.water_2, 壬巳: BUREAU_DEFINITIONS.water_2,
  壬午: BUREAU_DEFINITIONS.wood_3, 壬未: BUREAU_DEFINITIONS.wood_3,
  壬申: BUREAU_DEFINITIONS.metal_4, 壬酉: BUREAU_DEFINITIONS.metal_4,
  壬戌: BUREAU_DEFINITIONS.water_2, 壬亥: BUREAU_DEFINITIONS.water_2,
}

const STEM_PAIR_MAP = {
  甲: '甲', 乙: '甲',
  丙: '丙', 丁: '丙',
  戊: '戊', 己: '戊',
  庚: '庚', 辛: '庚',
  壬: '壬', 癸: '壬',
}

export function resolveFiveElementBureau(birthYearStem, mingGongBranch) {
  const yinStem = YIN_STEM_MAP[birthYearStem]
  if (!yinStem) return null

  const targetBranchIndex = BRANCHES.indexOf(mingGongBranch)
  if (targetBranchIndex === -1) return null

  const yinStemIndex = STEMS.indexOf(yinStem)
  const yinBranchIndex = BRANCHES.indexOf('寅')

  // 인궁(寅)으로부터의 지지 거리
  const offset = (targetBranchIndex - yinBranchIndex + 12) % 12
  const mingGongStem = STEMS[(yinStemIndex + offset) % 10]
  const pairStem = STEM_PAIR_MAP[mingGongStem] || mingGongStem

  const key = `${pairStem}${mingGongBranch}`
  return BUREAU_TABLE[key] || null
}

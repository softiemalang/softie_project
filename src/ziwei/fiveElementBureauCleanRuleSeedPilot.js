/**
 * Source-derived 五行局 seed evaluator.
 *
 * This file is deliberately independent from the runtime evaluators. Its
 * tables are a compact glyph-preserving transcription
 * of the admitted witness, followed by an explicit normalization boundary.
 */

export const SOURCE_RULE_SCHEMA = 'ziwei-five-element-bureau-clean-rule-seed-rule-v0'
export const STEMS = Object.freeze(['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'])
export const BRANCHES = Object.freeze(['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'])
export const BUREAU_ENUMS = Object.freeze({
  水二局: 'water_2', 木三局: 'wood_3', 金四局: 'metal_4', 土五局: 'earth_5', 火六局: 'fire_6',
})

// Source rule: 甲己丙寅頭, 乙庚戊寅頭, 丙辛庚寅頭, 丁壬壬寅頭, 戊癸甲寅頭.
const YIN_STEM_BY_YEAR_STEM = Object.freeze({
  甲: '丙', 己: '丙', 乙: '戊', 庚: '戊', 丙: '庚', 辛: '庚', 丁: '壬', 壬: '壬', 戊: '甲', 癸: '甲',
})

// Glyph-preserving source transcription of the 30 paired 六十花甲納音 entries
// visible in the witness. The source presents each pair as one Nayin row.
export const SOURCE_NAYIN_PAIRS = Object.freeze([
  ['甲子乙丑', '海中金'], ['丙寅丁卯', '爐中火'], ['戊辰己巳', '大林木'], ['庚午辛未', '路旁土'], ['壬申癸酉', '劍鋒金'],
  ['甲戌乙亥', '山頭火'], ['丙子丁丑', '澗下水'], ['戊寅己卯', '城頭土'], ['庚辰辛巳', '白蠟金'], ['壬午癸未', '楊柳木'],
  ['甲申乙酉', '泉中水'], ['丙戌丁亥', '屋上土'], ['戊子己丑', '霹靂火'], ['庚寅辛卯', '松柏木'], ['壬辰癸巳', '長流水'],
  ['甲午乙未', '沙中金'], ['丙申丁酉', '山下火'], ['戊戌己亥', '平地木'], ['庚子辛丑', '壁上土'], ['壬寅癸卯', '金箔金'],
  ['甲辰乙巳', '覆燈火'], ['丙午丁未', '天河水'], ['戊申己酉', '大驛土'], ['庚戌辛亥', '釵釧金'], ['壬子癸丑', '桑柘木'],
  ['甲寅乙卯', '大溪水'], ['丙辰丁巳', '沙中土'], ['戊午己未', '天上火'], ['庚申辛酉', '石榴木'], ['壬戌癸亥', '大海水'],
])

const NAYIN_BY_GANZHI = Object.freeze(Object.fromEntries(SOURCE_NAYIN_PAIRS.flatMap(([pair, name]) => {
  const keys = [pair.slice(0, 2), pair.slice(2, 4)]
  return keys.map(key => [key, { name, element: name.slice(-1) }])
})))

const BUREAU_BY_ELEMENT = Object.freeze({ 金: { traditionalName: '金四局', element: '金', number: 4, enum: BUREAU_ENUMS.金四局 }, 木: { traditionalName: '木三局', element: '木', number: 3, enum: BUREAU_ENUMS.木三局 }, 水: { traditionalName: '水二局', element: '水', number: 2, enum: BUREAU_ENUMS.水二局 }, 火: { traditionalName: '火六局', element: '火', number: 6, enum: BUREAU_ENUMS.火六局 }, 土: { traditionalName: '土五局', element: '土', number: 5, enum: BUREAU_ENUMS.土五局 } })

const indexOf = (values, value, field) => { const index = values.indexOf(value); if (index < 0) throw new Error(`${field}:unknown_glyph`); return index }

export function evaluateSourceFiveElementBureau({ birthYearStem, lunarMonth, hourBranch }) {
  if (!Number.isInteger(lunarMonth) || lunarMonth < 1 || lunarMonth > 12) throw new Error('lunarMonth:must_be_integer_1_to_12')
  const yearStemIndex = indexOf(STEMS, birthYearStem, 'birthYearStem')
  const hourIndex = indexOf(BRANCHES, hourBranch, 'hourBranch')
  const monthPalaceIndex = (indexOf(BRANCHES, '寅', 'branch') + lunarMonth - 1) % 12
  const mingGongIndex = (monthPalaceIndex - hourIndex + 12) % 12
  const mingGongBranch = BRANCHES[mingGongIndex]
  const yinStem = YIN_STEM_BY_YEAR_STEM[birthYearStem]
  const yinStemIndex = indexOf(STEMS, yinStem, 'yinStem')
  const palaceOffset = (mingGongIndex - indexOf(BRANCHES, '寅', 'branch') + 12) % 12
  const mingGongStem = STEMS[(yinStemIndex + palaceOffset) % 10]
  const ganzhi = `${mingGongStem}${mingGongBranch}`
  const nayin = NAYIN_BY_GANZHI[ganzhi]
  if (!nayin) throw new Error(`nayin:missing:${ganzhi}`)
  const bureau = BUREAU_BY_ELEMENT[nayin.element]
  return {
    input: { birthYearStem, lunarMonth, hourBranch },
    intermediate: { monthPalaceBranch: BRANCHES[monthPalaceIndex], mingGongBranch, yinStem, mingGongStem, ganzhi, nayinName: nayin.name, nayinElement: nayin.element },
    output: { ...bureau },
  }
}

export function enumerateSourceInputs() {
  return STEMS.flatMap(birthYearStem => Array.from({ length: 12 }, (_, i) => i + 1).flatMap(lunarMonth => BRANCHES.map(hourBranch => {
    const result = evaluateSourceFiveElementBureau({ birthYearStem, lunarMonth, hourBranch })
    const orderingKey = `${STEMS.indexOf(birthYearStem).toString().padStart(2, '0')}:${String(lunarMonth).padStart(2, '0')}:${BRANCHES.indexOf(hourBranch).toString().padStart(2, '0')}`
    return { rowId: `stem-${birthYearStem}-month-${String(lunarMonth).padStart(2, '0')}-hour-${hourBranch}`, orderingKey, ...result }
  })))
}

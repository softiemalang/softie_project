/**
 * Research-only model for the twelve target major-star placement rules.
 * This module is deliberately not imported by the production resolver.
 */

export const TWELVE_MAJOR_STAR_EVIDENCE_SCHEMA = 'ziwei-twelve-major-star-placement-evidence-v0'
export const BRANCHES = Object.freeze(['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'])

export const TARGET_STARS = Object.freeze([
  { id: 'tianji', name: '天機', series: 'ziwei', anchor: 'ziwei', offset: -1, direction: 'reverse', sourceRuleRef: 'source.ziweiSeriesRule' },
  { id: 'taiyang', name: '太陽', series: 'ziwei', anchor: 'ziwei', offset: -3, direction: 'reverse', sourceRuleRef: 'source.ziweiSeriesRule' },
  { id: 'wugu', name: '武曲', series: 'ziwei', anchor: 'ziwei', offset: -4, direction: 'reverse', sourceRuleRef: 'source.ziweiSeriesRule' },
  { id: 'tiandong', name: '天同', series: 'ziwei', anchor: 'ziwei', offset: -5, direction: 'reverse', sourceRuleRef: 'source.ziweiSeriesRule' },
  { id: 'lianzhen', name: '廉貞', series: 'ziwei', anchor: 'ziwei', offset: -8, direction: 'reverse', sourceRuleRef: 'source.ziweiSeriesRule' },
  { id: 'taiyin', name: '太陰', series: 'tianfu', anchor: 'tianfu', offset: 1, direction: 'forward', sourceRuleRef: 'source.tianfuSeriesRule' },
  { id: 'tanlang', name: '貪狼', series: 'tianfu', anchor: 'tianfu', offset: 2, direction: 'forward', sourceRuleRef: 'source.tianfuSeriesRule' },
  { id: 'jumen', name: '巨門', series: 'tianfu', anchor: 'tianfu', offset: 3, direction: 'forward', sourceRuleRef: 'source.tianfuSeriesRule' },
  { id: 'tianxiang', name: '天相', series: 'tianfu', anchor: 'tianfu', offset: 4, direction: 'forward', sourceRuleRef: 'source.tianfuSeriesRule' },
  { id: 'tianliang', name: '天梁', series: 'tianfu', anchor: 'tianfu', offset: 5, direction: 'forward', sourceRuleRef: 'source.tianfuSeriesRule' },
  { id: 'qisai', name: '七殺', series: 'tianfu', anchor: 'tianfu', offset: 6, direction: 'forward', sourceRuleRef: 'source.tianfuSeriesRule' },
  { id: 'pojun', name: '破軍', series: 'tianfu', anchor: 'tianfu', offset: 10, direction: 'forward', sourceRuleRef: 'source.tianfuSeriesRule' },
])

export const SOURCE_RULES = Object.freeze({
  ziweiSeriesRule: {
    rawByEdition: {
      mingNanyang: '紫微天機逆行傍，隔一陽武天同當，又隔二位廉貞坐',
      nanbeishanren: '紫微天機星逆行傍，隔一武陽天同當，又隔二宮廉貞位',
    },
    normalized: { anchor: '紫微', direction: 'reverse', offsets: { tianji: -1, taiyang: -3, wugu: -4, tiandong: -5, lianzhen: -8 } },
    transcriptionPolicy: 'glyphs_and_order_preserved; punctuation_normalized_only; no OCR promotion',
  },
  tianfuSeriesRule: {
    rawByEdition: {
      mingNanyang: '天府太陰順貪狼，巨門天相及天梁，七殺空三破軍位',
      nanbeishanren: '天府太陰順貪狼，巨門天相與天梁，七殺空三破軍位，隔宮望見天府鄉',
    },
    normalized: { anchor: '天府', direction: 'forward', offsets: { taiyin: 1, tanlang: 2, jumen: 3, tianxiang: 4, tianliang: 5, qisai: 6, pojun: 10 } },
    transcriptionPolicy: 'glyphs_and_order_preserved; punctuation_normalized_only; no OCR promotion',
  },
})

export const SOURCE_ROOT_MODEL = Object.freeze({
  ziwei: { equation: 'source evaluator output 紫微', base: '寅', direction: 'source evaluator', status: 'reused_verified_basis_point' },
  tianfu: { equation: 'output = mod(4 - ziwei)', base: '辰', direction: 'reverse', status: 'transcription_defect_resolved_in_successor', predecessorEquation: 'legacy source table preserved in predecessor artifact' },
})

export const SOURCE_REFS = Object.freeze({
  mingNanyang: {
    scanScreen: 'source.mingNanyang.screening',
    seriesRule: 'source.mingNanyang.locators.ming-p148-series-rule',
    diagram: 'source.mingNanyang.locators.ming-p172-tianfu-diagram',
  },
  nanbeishanren: {
    ziweiRule: 'source.nanbeishanren.locators.nb-p11-ziwei-rule',
    ziweiTable: 'source.nanbeishanren.locators.nb-p12-ziwei-table',
    seriesRule: 'source.nanbeishanren.locators.nb-p13-sanshiwu-series-rule',
    tianfuRoot: 'source.nanbeishanren.locators.nb-p13-sanshisi-tianfu-root',
  },
})

export const mod = value => (value % 12 + 12) % 12
export const branchIndex = branch => BRANCHES.indexOf(branch)
export const branchAt = index => BRANCHES[mod(index)]

export function applyNormalizedRule(anchorBranch, star) {
  const anchorIndex = branchIndex(anchorBranch)
  if (anchorIndex < 0) throw new Error(`unknown anchor branch: ${anchorBranch}`)
  return branchAt(anchorIndex + star.offset)
}

export const SEARCH_AXES = Object.freeze({
  rotations: Object.freeze(Array.from({ length: 12 }, (_, index) => index)),
  traversalDirections: Object.freeze(['same', 'reverse']),
  reflections: Object.freeze(['none', 'horizontal_vertical_affine']),
  branchBaseShifts: Object.freeze(Array.from({ length: 12 }, (_, index) => index)),
  pageTableOrders: Object.freeze(['top_to_bottom', 'bottom_to_top', 'left_to_right', 'right_to_left']),
  indexConventions: Object.freeze(['zero_based', 'one_based']),
  rootConventions: Object.freeze(['production_axis_sum', 'source_base_direction', 'predecessor_transcription']),
})

export function sourceStarBranch({ ziweiBranch, tianfuBranch, star }) {
  return applyNormalizedRule(star.series === 'ziwei' ? ziweiBranch : tianfuBranch, star)
}

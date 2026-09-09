import {
  SAJU_LOCAL_SOURCE_ADMISSION_BOUNDARY,
  SAJU_LOCAL_SOURCE_DOCUMENTS,
} from './sajuLocalSourceCorpusEvidence.js'
import { validateDeterministicBaseForInterpretation } from '../interpretationConstitution.js'

/**
 * Source/lineage-bounded Saju reading grammar v0.
 *
 * This module is a research contract, not a semantic dictionary and not a
 * promotion/readiness/activation surface.  An adopted rule means only that a
 * bounded rule surface is clear enough to execute inside the named local
 * witness scope.  It does not establish historical or semantic authority.
 */
export const SAJU_LINEAGE_READING_GRAMMAR_SCHEMA = 'saju-lineage-reading-grammar-v0'
export const SAJU_LINEAGE_READING_GRAMMAR_VERSION = '0.1.0'

export const SAJU_LINEAGE_RULE_STATUSES = Object.freeze([
  'adopted_lineage_rule',
  'unresolved',
  'unsupported',
])

export const SAJU_LINEAGE_EXECUTION_STATUSES = Object.freeze([
  'executable_from_frozen_base',
  'blocked_missing_base_fact',
  'not_applicable_fixture',
  'not_executable_by_contract',
  'unsupported',
])

const WORKS = Object.freeze({
  yuanhai: '淵海子平',
  sanming: '三命通會',
  ziping: '子平真詮',
  ditian: '滴天髓',
  qiongtong: '窮通寶鑑',
})

const DOCUMENT_BY_ID = new Map(SAJU_LOCAL_SOURCE_DOCUMENTS.map(document => [document.sourceId, document]))

const sourceProfile = (sourceId, work, note) => {
  const document = DOCUMENT_BY_ID.get(sourceId)
  if (!document) throw new Error(`unknown Saju lineage source: ${sourceId}`)
  return {
    sourceId,
    work,
    fileName: document.fileName,
    sourceForm: document.sourceForm,
    pageCount: document.pageCount,
    byteSha256: document.expectedByteSha256,
    editionIdentity: document.editionIdentity,
    lineageStatus: 'UNRESOLVED',
    independenceStatus: 'UNRESOLVED',
    identityScope: SAJU_LOCAL_SOURCE_ADMISSION_BOUNDARY.sourceIdentity,
    note,
  }
}

const loc = (sourceId, observationId, pdfPage, printedPage, heading, observedScope, visibleText) => ({
  sourceId,
  observationId,
  locator: {
    pdfPage,
    printedPage,
    heading,
    pageLocatorStatus: 'direct_visual_scan_reviewed',
  },
  observedScope,
  visibleText,
  transcriptionStatus: 'direct_visual_observation_candidate_not_canonical_source_text',
})

const FACT_REFS = Object.freeze({
  dayMaster: 'systems.saju.fact.dayMasterDetails.stem',
  dayMasterDetails: 'systems.saju.fact.dayMasterDetails',
  pillars: 'systems.saju.fact.pillars',
  yearPillar: 'systems.saju.fact.pillars.year',
  monthPillar: 'systems.saju.fact.pillars.month',
  dayPillar: 'systems.saju.fact.pillars.day',
  hourPillar: 'systems.saju.fact.pillars.hour',
  monthBranch: 'systems.saju.fact.pillarFacts.month.branch',
  monthHiddenStems: 'systems.saju.fact.pillarFacts.month.hiddenStems',
  pillarFacts: 'systems.saju.fact.pillarFacts',
  elements: 'systems.saju.fact.elementsDistribution',
  visibleTenGods: 'systems.saju.fact.tenGodsVisible',
  branchRelations: 'systems.saju.fact.branchRelations',
  stemRelations: 'systems.saju.fact.stemRelations',
  timing: 'systems.saju.fact.timing',
  timeAccuracy: 'normalizedInput.timeAccuracy',
})

const FORBIDDEN_EXTENSIONS = Object.freeze([
  'personality_or_trait_claim',
  'single_symbol_personal_meaning',
  'strength_or_weakness_conclusion',
  'yongshin_or_heeshin_selection',
  'gyeokguk_conclusion',
  'good_bad_or_fortune_outcome',
  'prediction_or_life_event_claim',
  'cross_lineage_rule_merge',
  'majority_or_agreement_as_authority',
])

const commonStructuralRejection = Object.freeze([
  {
    candidateId: 'common.day-anchor-month-context',
    sourceRuleIds: [
      'rule.yuanhai.day-anchor-month-command-frame.v0',
      'rule.sanming.four-pillars-month-hour-frame.v0',
    ],
    sourceIds: ['saju-source-yuanhai-ziping', 'saju-source-sanming-tonghui'],
    status: 'not_emitted_as_common_candidate',
    reason: '두 문헌의 local representation은 별도 work이지만 edition/lineage와 독립 textual transmission이 닫히지 않았다. 구조적 유사성만으로 common rule을 만들지 않는다.',
  },
  {
    candidateId: 'common.month-before-seasonal-selection',
    sourceRuleIds: [
      'rule.yuanhai.day-anchor-month-command-frame.v0',
      'rule.sanming.human-element-month-command.v0',
      'rule.ziping.month-command-selection.v0',
    ],
    sourceIds: ['saju-source-yuanhai-ziping', 'saju-source-sanming-tonghui', 'saju-source-ziping-zhenquan'],
    status: 'not_emitted_as_common_candidate',
    reason: '월령을 언급하는 범위는 반복되지만 각 문헌의 적용 대상·우선관계·의미 층이 다르고 독립 교차검증이 없다.',
  },
])

const rule = (value) => ({
  adoptionScope: 'source_bounded_rule_surface_only',
  claimPromotion: false,
  semanticAuthority: 'not_established',
  readinessImpact: 'none',
  activationImpact: 'none',
  forbiddenExtensions: FORBIDDEN_EXTENSIONS,
  ...value,
})

export const SAJU_LINEAGE_SOURCE_PROFILES = Object.freeze([
  sourceProfile('saju-source-yuanhai-ziping', WORKS.yuanhai, 'local web-text export has an explicit source warning; exact edition and transmission remain unresolved'),
  sourceProfile('saju-source-sanming-tonghui', WORKS.sanming, 'local web-text export carries authorship/transmission caveats; exact edition and relation to institutional witnesses remain unresolved'),
  sourceProfile('saju-source-ziping-zhenquan', WORKS.ziping, 'modern typeset local export; exact edition and local-to-historical lineage remain unresolved'),
  sourceProfile('saju-source-ditian-sui', WORKS.ditian, 'derived/typeset export with linked attribution; exact edition and attribution chain remain unresolved'),
  sourceProfile('saju-source-qiongtong-baojian', WORKS.qiongtong, 'modern typeset local export; exact edition and attribution remain unresolved'),
])

export const SAJU_LINEAGE_LOCATORS = Object.freeze([
  loc('saju-source-yuanhai-ziping', 'yuanhai-p2-foundation', 2, '2', '基礎', 'stem polarity and named role-label opening; semantic outcomes remain context-bound', '五干属阳 · 喜合 · 五干属阴 · 喜冲'),
  loc('saju-source-yuanhai-ziping', 'yuanhai-p4-hidden-stems-and-ten-god-labels', 4, '4', '論天地干支暗藏總訣', 'hidden-stem/ten-god labels and adjacent seasonal-month material', '暗藏總訣 · 偏官/印綬/偏印 labels'),
  loc('saju-source-yuanhai-ziping', 'yuanhai-p5-hidden-stem-song-and-generation-control', 5, '5', '又地支藏遁歌 / 論五行生剋制化', 'hidden-stem sequence and five-phase relation vocabulary; no complete source service resolver adopted', '地支藏遁歌 · 各有所喜所害 · 生剋制化'),
  loc('saju-source-yuanhai-ziping', 'yuanhai-p6-day-as-host', 6, '6', '論日為主', 'day-as-host frame and year/month/day/hour role labels', '日为主 · 年为根 · 月为提纲 · 时为辅佐'),
  loc('saju-source-yuanhai-ziping', 'yuanhai-p7-month-command', 7, '7', '論月令', 'month-command context after the day-as-host statement', '以日为主 · 月为提纲'),
  loc('saju-source-yuanhai-ziping', 'page.local.yuanhai.p9-dayun-section', 9, '9', '論大運', 'bounded 大運 section locator; not a complete exact-timing rule', '論大運'),
  loc('saju-source-yuanhai-ziping', 'yuanhai-p9-dayun-focus-lens', 9, '9', '論大運', 'source-defined focus lens for an already supplied 大運 and 歲君 record', '大运看支 · 岁君看干 · 交运同接木'),
  loc('saju-source-yuanhai-ziping', 'yuanhai-p8-taisui-annual-judgment', 8, '8', '論太歲吉凶 / 論征太歲', 'annual-year interaction and fortune wording; outcome semantics not adopted', '太岁乃年中天子 · 日犯岁君'),
  loc('saju-source-yuanhai-ziping', 'yuanhai-p11-disease', 11, '11', '論疾病', 'body/illness correspondences and outcome claims outside the structural contract', '論疾病 · 五行生剋'),
  loc('saju-source-yuanhai-ziping', 'yuanhai-p13-temperament', 13, '13', '性情', 'temperament and single-element personal descriptions outside the public grammar', '性情者 · 木盛主仁 · 五行性情'),
  loc('saju-source-yuanhai-ziping', 'yuanhai-p14-stem-body-poems', 14, '14', '干體詩', 'stem-specific poetic descriptions and semantic outcomes; no generic predicate', '干體詩 · 甲乙丙丁'),
  loc('saju-source-yuanhai-ziping', 'yuanhai-p17-injury-officer', 17, '17', '論傷官', 'role-specific conditions and outcomes requiring pattern/use context', '論傷官 · 傷官傷盡'),
  loc('saju-source-yuanhai-ziping', 'yuanhai-p24-regular-wealth', 24, '24', '何謂正財', 'wealth-role conditions tied to strength and outcome language', '何谓正财 · 财多身弱'),
  loc('saju-source-yuanhai-ziping', 'yuanhai-p28-regular-officer', 28, '28', '正官', 'officer-role conditions, pattern state, and outcome claims', '正官 · 用提纲作正官'),
  loc('saju-source-yuanhai-ziping', 'yuanhai-p30-partial-officer', 30, '30', '論偏官', 'seven-killing role conditions and control/fortune outcomes', '论偏官 · 制伏'),
  loc('saju-source-yuanhai-ziping', 'yuanhai-p35-seal', 35, '35', '論印綬', 'seal-role conditions and parent/outcome claims', '论印绶 · 生我'),
  loc('saju-source-yuanhai-ziping', 'yuanhai-p48-six-relations', 48, '48', '六親總篇', 'six-relations and family mapping outside the public semantic boundary', '六亲总篇 · 父母兄弟妻财子孙'),
  loc('saju-source-yuanhai-ziping', 'yuanhai-p56-womens-fate', 56, '56', '女命總訣', 'gender-specific and personal-outcome clauses outside the public grammar', '女命总诀 · 取官为夫'),
  loc('saju-source-yuanhai-ziping', 'yuanhai-p67-ziping-essentials', 67, '67', '子平舉要歌', 'compressed maxims with structural order mixed with semantic outcomes', '子平举要歌 · 造化先须看日主'),
  loc('saju-source-yuanhai-ziping', 'yuanhai-p69-preferences', 69, '69', '喜忌篇', 'ordered reading language mixed with strength/use/outcome semantics', '四柱排定 · 先看月令'),
  loc('saju-source-yuanhai-ziping', 'yuanhai-p80-miscellaneous-maxims', 80, '80', '雜論口訣', 'miscellaneous condition/result maxims without a closed predicate family', '杂论口诀 · 看子平之法'),
  loc('saju-source-yuanhai-ziping', 'yuanhai-p90-late-rule-collection', 90, '90', '《寸金搜髓論》', 'later compiled rule collection with role/pattern and fortune outcomes', '造化先须看日主 · 四柱专论其财官'),
  loc('saju-source-yuanhai-ziping', 'yuanhai-p103-omens-fu', 103, '103', '妖祥賦', 'omens, body, temperament, and fortune statements without a public structural output', '命理深微 · 妖祥'),
  loc('saju-source-yuanhai-ziping', 'yuanhai-p110-omens-fu-continuation', 110, '110', '妖祥賦續', 'continuation of the compiled omen/personal-description surface; no public structural output', '偏官七杀 · 枭印 · 偏财 · 伤官 personal descriptions'),
  loc('saju-source-yuanhai-ziping', 'yuanhai-p162-wanjin-fu', 162, '162', '萬金賦', 'compiled pattern/fortune maxims with no source-complete priority resolver', '欲识五行生死诀 · 先看何格隨时节'),
  loc('saju-source-yuanhai-ziping', 'yuanhai-p164-jiechisu-miao-jue', 164, '164', '畢要捷馳玄妙訣', 'timing and role maxims with unresolved exact applicability', '以日为主 · 专论财官 · 先观节气之深浅'),
  loc('saju-source-yuanhai-ziping', 'yuanhai-p173-four-line-independent-step', 173, '173', '四言獨步', 'late compiled maxims with repeated role/order language and semantic outcomes', '先看月令 · 次看浅深 · 年根为本 · 月令为中'),
  loc('saju-source-yuanhai-ziping', 'yuanhai-p197-eight-character-summary', 197, '197', '論八字撮要法', 'summary prohibitions and role conditions; no universal semantic composition', '用之为官不可伤 · 用之为财不可劫'),
  loc('saju-source-yuanhai-ziping', 'yuanhai-p199-compilation-summary', 199, '199', '會要命書說', 'editorial/compiled summary and source-boundary notice; no new executable rule', '会要命书说 · 合成一集'),
  loc('saju-source-sanming-tonghui', 'sanming-p4-element-generation', 4, '4', '論五行生成', 'five-phase generation ordering', '五行生成'),
  loc('saju-source-sanming-tonghui', 'sanming-p5-element-generation-control', 5, '5', '論五行生克', 'five-phase generation/control and directional presentation', '五行相生相克'),
  loc('saju-source-sanming-tonghui', 'sanming-p6-stem-branch-origin', 6, '6', '論支干源流', 'stem/branch origin and generation/control framing', '論支干源流'),
  loc('saju-source-sanming-tonghui', 'sanming-p65-human-element-and-month-command', 65, '65', '論人元司事', 'human-element and month-command role', '人元 · 司事之神 · 月令'),
  loc('saju-source-sanming-tonghui', 'sanming-p66-seasonal-hidden-stem-service', 66, '66', '論四時節氣', 'one explicit hidden-stem service-day example and seasonal cycle framing', '寅中有艮土用事五日 · 丙火五日 · 甲木二十日'),
  loc('saju-source-sanming-tonghui', 'sanming-p69-month-hour-method', 69, '69', '論遁月時', 'month-from-year and hour-from-day procedure surface', '遁月从年 · 遁时从日'),
  loc('saju-source-sanming-tonghui', 'sanming-p70-year-month-day-hour', 70, '70', '論年月日時', 'four-pillar framing and day-as-host comparison', '年月日時排成四柱 · 子平以日看'),
  loc('saju-source-ziping-zhenquan', 'ziping-p3-yang-yin-root-cycle-and-tomb-exception', 3, '3', '論陰陽生死', 'source-local life-cycle vocabulary and yang-rooted versus yin/tomb qualification', '長生循環 · 得長生祿旺 · 逢庫 · 陽為有根 · 陰為無用'),
  loc('saju-source-ziping-zhenquan', 'ziping-p5-branch-relations-definition-and-examples', 5, '5', '論刑沖會合解法', 'explicit stem/branch examples, exceptions, and adjacent branch-relation definitions', '长生禄旺 · 根之重者也 · 甲逢未 · 乙逢戌 · 通根'),
  loc('saju-source-ziping-zhenquan', 'page.local.ziping.p6-yongshin', 6, '6', '論用神', 'month-command-first use-selection wording', '用神专求月令'),
  loc('saju-source-ziping-zhenquan', 'page.local.ziping.p7-yongshin-continuation', 7, '7', '論用神成敗救應 / 論用神變化', 'success/rescue/change examples including a local 透/不透 contrast; semantic precedence not normalized', '成败救应 · 用神变化 · 不透甲而透丙'),
  loc('saju-source-ziping-zhenquan', 'page.local.ziping.p10-xiangshen', 10, '10', '論相神緊要', 'assistant/use-selection role wording', '辅者是也'),
  loc('saju-source-ziping-zhenquan', 'ziping-p10-chen-exposed-stem-definition', 10, '10', '論雜氣如何取用', 'local 透干 definition and one/dual exposure examples for 甲生辰月', '何謂透干 · 甲生辰月 · 一透一用 · 兼透兼用'),
  loc('saju-source-ziping-zhenquan', 'page.local.ziping.p11-xiangshen-continuation', 11, '11', '論墓庫刑沖之說', 'continuation with interaction conditions', '刑冲会合 conditions'),
  loc('saju-source-ziping-zhenquan', 'ziping-p11-exposed-stem-and-branch-context', 11, '11', '論墓庫刑沖之說', '透干/會支 examples remain tied to use-selection and anti冲 arguments', '透干會支 · 干頭透出 · 身坐庫根'),
  loc('saju-source-ziping-zhenquan', 'page.local.ziping.p15-xingyun', 15, '15', '論行運', 'bounded natal-chart/fortune pairing statement', '论运与命无二法'),
  loc('saju-source-ziping-zhenquan', 'ziping-p16-branch-stem-root-scan', 16, '16', '論支中喜忌逢運透清', 'explicit 甲-to-branch root scan and 亥-to-visible-stem role examples', '支为干之生地 · 干为支之发用 · 有一甲字 · 寅亥卯未 · 有一亥字'),
  loc('saju-source-ziping-zhenquan', 'page.local.ziping.p25-timing', 25, '25', '取運 locator', 'timing section locator without repository exact-start contract', '取運'),
  loc('saju-source-ziping-zhenquan', 'ziping-p3-stem-combination-semantic-context', 3, '3', '論十干配合性情', 'stem-combination examples that change or qualify already named role labels', '用甲辛官 · 透丙作合 · 因合而无用'),
  loc('saju-source-ziping-zhenquan', 'ziping-p4-stem-combination-nonmerge', 4, '4', '論十干合而不合', 'distance, separation, and合而不化 examples that alter whether a combination acts', '隔有所间 · 两位太远 · 合而不化'),
  loc('saju-source-ziping-zhenquan', 'ziping-p6-yongshen-success-rescue', 6, '6', '論用神成敗救應', 'named use-role success, failure, and rescue conditions', '官逢财印 · 财逢食生 · 伤官见官'),
  loc('saju-source-ziping-zhenquan', 'ziping-p8-yongshen-pure-mixed', 8, '8', '論用神純雜', 'pure/mixed use-role conditions based on mutual support or opposition', '何谓纯 · 何谓杂 · 互用而两相得'),
  loc('saju-source-ziping-zhenquan', 'ziping-p8-yongshen-pattern-level', 8, '8', '論用神格局高低', 'pattern level examples using 有情/有力 and use-role combinations', '格局高低 · 有情有力'),
  loc('saju-source-ziping-zhenquan', 'ziping-p9-yongshen-success-failure-transition', 9, '9', '論用神因成得敗因敗得成', 'success-to-failure and failure-to-success transitions under explicit use-role cases', '因成得败 · 因败得成'),
  loc('saju-source-ziping-zhenquan', 'ziping-p9-yongshen-season-result', 9, '9', '論用神配氣候得失', 'season/condition pairing clauses tied to use-role results', '配气候而互参 · 成功不易'),
  loc('saju-source-ziping-zhenquan', 'ziping-p12-good-symbol-break-pattern', 12, '12', '論四吉神能破格', 'four named favorable role conditions that can break a pattern under further conditions', '财官印食 · 破格'),
  loc('saju-source-ziping-zhenquan', 'ziping-p12-bad-symbol-make-pattern', 12, '12', '論四凶神能成格', 'four named adverse role conditions that can make a pattern under further conditions', '伤官 · 七杀 · 枭印 · 劫财 · 成格'),
  loc('saju-source-ziping-zhenquan', 'ziping-p12-generation-control-order', 12, '12', '論生克先後分吉凶', 'ordered generation/control examples whose stated output is 吉凶', '生克先后 · 分吉凶'),
  loc('saju-source-ziping-zhenquan', 'ziping-p13-external-pattern-use', 13, '13', '論外格用舍', 'external-pattern inclusion/exclusion conditions with use-selection vocabulary', '外格 · 用舍 · 月令无用'),
  loc('saju-source-ziping-zhenquan', 'ziping-p14-six-relations-use', 14, '14', '論宮分用神配六親', 'palace and six-relation mapping claims beyond the public semantic boundary', '配六亲'),
  loc('saju-source-ziping-zhenquan', 'ziping-p14-wife-children', 14, '14', '論妻子', 'spouse/children and personal-outcome claims beyond the public semantic boundary', '论妻子 · 论子'),
  loc('saju-source-ziping-zhenquan', 'ziping-p16-yun-change-pattern', 16, '16', '論行運成格變格', 'fortune-period conditions stated to change or preserve a pattern', '成格变格'),
  loc('saju-source-ziping-zhenquan', 'ziping-p16-stem-branch-preference', 16, '16', '論喜忌干支有別', 'separate stem/branch preference wording without a closed semantic resolver', '喜忌干支有别'),
  loc('saju-source-ziping-zhenquan', 'ziping-p17-not-bind-pattern', 17, '17', '論時說拘泥格局', 'anti-rigidity statements about not forcing a pattern label', '拘泥格局'),
  loc('saju-source-ziping-zhenquan', 'ziping-p17-regular-officer', 17, '17', '論正官', 'regular-officer conditions and source outcomes', '正官 · 用官 · 伤官见官'),
  loc('saju-source-ziping-zhenquan', 'ziping-p18-seven-killings', 18, '18', '論七殺', 'seven-killing conditions and source outcomes', '七杀 · 制化'),
  loc('saju-source-ziping-zhenquan', 'ziping-p18-injury-officer', 18, '18', '論傷官', 'injury-officer conditions and source outcomes', '伤官 · 佩印 · 伤官见官'),
  loc('saju-source-ziping-zhenquan', 'ziping-p19-food-god', 19, '19', '論食神', 'food-god conditions and source outcomes', '食神 · 生财 · 枭神夺食'),
  loc('saju-source-ziping-zhenquan', 'ziping-p19-seal', 19, '19', '論印綬', 'seal conditions and source outcomes', '印绶 · 佩印 · 财印'),
  loc('saju-source-ziping-zhenquan', 'ziping-p20-wealth', 20, '20', '論財', 'wealth conditions and source outcomes', '财 · 生官 · 财印'),
  loc('saju-source-ziping-zhenquan', 'ziping-p21-partial-wealth', 21, '21', '論偏財', 'partial-wealth conditions and source outcomes', '偏财'),
  loc('saju-source-ziping-zhenquan', 'ziping-p21-rob-wealth', 21, '21', '論劫財', 'rob-wealth conditions and source outcomes', '劫财 · 月劫'),
  loc('saju-source-ziping-zhenquan', 'ziping-p22-yang-blade', 22, '22', '論陽刃', 'yang-blade conditions and source outcomes', '阳刃'),
  loc('saju-source-ziping-zhenquan', 'ziping-p22-building-wealth', 22, '22', '論建祿月劫', 'established-lu/month-rob conditions and source outcomes', '建禄月劫'),
  loc('saju-source-ziping-zhenquan', 'ziping-p23-misc-pattern', 23, '23', '論雜格', 'miscellaneous-pattern conditions and source outcomes', '杂格'),
  loc('saju-source-ziping-zhenquan', 'ziping-p23-metal-spirit', 23, '23', '論金神', 'metal-spirit conditions and source outcomes', '金神'),
  loc('saju-source-ziping-zhenquan', 'ziping-p24-injury-timing', 24, '24', '論傷官取運', 'injury-officer fortune-period conditions and source outcomes', '伤官取运'),
  loc('saju-source-ziping-zhenquan', 'ziping-p24-killing', 24, '24', '論殺', 'killing-star conditions and source outcomes', '论杀'),
  loc('saju-source-ziping-zhenquan', 'ziping-p25-officer', 25, '25', '論官', 'officer fortune-period conditions and source outcomes', '论官'),
  loc('saju-source-ziping-zhenquan', 'ziping-p25-building-wealth-timing', 25, '25', '論建祿月劫', 'established-lu/month-rob fortune-period conditions', '建禄月劫取运'),
  loc('saju-source-ziping-zhenquan', 'ziping-p26-building-wealth-timing', 26, '26', '論建祿月劫取運', '建祿月劫 fortune-period conditions and source outcomes', '建禄月劫取运'),
  loc('saju-source-ziping-zhenquan', 'ziping-p26-misc-pattern', 26, '26', '論雜格', 'miscellaneous-pattern conditions and source outcomes', '杂格'),
  loc('saju-source-ziping-zhenquan', 'ziping-p27-misc-pattern-continuation', 27, '27', '論雜格', 'continuation of miscellaneous-pattern examples and outcome language', '杂格例'),
  loc('saju-source-ditian-sui', 'ditian-p4-jia-wood-seasonal-conditions', 4, '4', '天干論 / 甲木', 'qualitative 甲木 seasonal conditions', '甲木参天 · 脱胎要火 · 春不容金 · 秋不容土'),
  loc('saju-source-qiongtong-baojian', 'qiongtong-p2-five-phase-number-and-season', 2, '2', '五行總論', 'element numbers, state labels, and explicit 生旺/死绝 multiplier wording', '其数则水一、火二、木三、金四、土五 · 生旺加倍，死绝减半'),
  loc('saju-source-qiongtong-baojian', 'qiongtong-p4-spring-jia-wood', 4, '4', '三春甲木', 'spring 甲木 conditional sequence', '春月之木 · 初春余寒 · 以火温暖'),
  loc('saju-source-qiongtong-baojian', 'qiongtong-p5-spring-jia-wood-continuation', 5, '5', '正月甲木', 'month-specific 甲木 clauses and combinations', '正月甲木'),
  loc('saju-source-qiongtong-baojian', 'qiongtong-p7-summer-jia-wood', 7, '7', '三夏甲木', 'summer 甲木 conditional sequence', '三夏甲木'),
])

const LOCATOR_BY_ID = new Map(SAJU_LINEAGE_LOCATORS.map(item => [item.observationId, item]))

// These are the three exact source-listed targets in the p.10 甲生辰月
// example.  They are deliberately not a complete 透/透干 map.
const ZIPING_P10_EXPOSURE_TARGETS = Object.freeze([
  Object.freeze({ sourceStem: '戊', inputStems: Object.freeze(['무', '戊']), sourceRole: '偏财' }),
  Object.freeze({ sourceStem: '癸', inputStems: Object.freeze(['계', '癸']), sourceRole: '正印' }),
  Object.freeze({ sourceStem: '乙', inputStems: Object.freeze(['을', '乙']), sourceRole: '月劫' }),
])

// Source-bounded research metadata only. This is not a public Base field or
// a resolver: p.2 closes the conditional arithmetic vocabulary, but not how
// 生旺/死绝 is obtained for an input chart.
export const SAJU_QIONGTONG_SHENGWANG_JUE_ANALYSIS = Object.freeze({
  sourceId: 'saju-source-qiongtong-baojian',
  locatorId: 'qiongtong-p2-five-phase-number-and-season',
  sourceByteSha256: '36d54cdc995d203fdceafcb52b2a0d4f57093ab1765c532db5418b46a96c4b19',
  observedDefinition: '五行總論 lists 生旺 and 死绝 as state labels; the adjacent color sentence distinguishes their source-local color relation, and the 其数 sentence applies a multiplier to the element numbers.',
  baseElementNumbers: Object.freeze({ 水: 1, 火: 2, 木: 3, 金: 4, 土: 5 }),
  stateOperations: Object.freeze({ 生旺: 'double', '死绝': 'half' }),
  requiredInputShape: Object.freeze([
    'element identity with the source-listed base number',
    'a source-specific 生旺 or 死绝 state label',
    'a closed rule for obtaining that state and its source locator',
  ]),
  stateResolver: Object.freeze({
    status: 'unresolved',
    reason: 'p.2 gives no state-to-calendar/branch/season mapping, no per-element state shape, and no precedence or exception procedure.',
    forbiddenSubstitutions: Object.freeze([
      'generic 十二運星 or modern stage mapping',
      'state inferred from current Base distribution or hidden-stem weights',
      'state copied from another lineage',
    ]),
  }),
  applicationScope: 'qiongtong-p2 其数 operation only; no mutation of Base distribution and no strength, balance, yongshin, gyeokguk, or personal conclusion',
  resultScope: 'lineage_derived_structural_result_only',
})

const ZIPING_EXPLICIT_STEM_BRANCH_EXAMPLES = Object.freeze([
  { stem: '갑', branch: '미', sourceStem: '甲', sourceBranch: '未', sourceClass: 'explicit_support_example', sourceCategory: '墓库' },
  { stem: '병', branch: '술', sourceStem: '丙', sourceBranch: '戌', sourceClass: 'explicit_support_example', sourceCategory: '墓库' },
  { stem: '을', branch: '술', sourceStem: '乙', sourceBranch: '戌', sourceClass: 'explicit_negative_example', sourceCategory: 'source_states_branch_lacks_wood' },
  { stem: '정', branch: '축', sourceStem: '丁', sourceBranch: '丑', sourceClass: 'explicit_negative_example', sourceCategory: 'source_states_branch_lacks_fire' },
  { stem: '을', branch: '진', sourceStem: '乙', sourceBranch: '辰', sourceClass: 'explicit_support_example', sourceCategory: '余气' },
  { stem: '정', branch: '미', sourceStem: '丁', sourceBranch: '未', sourceClass: 'explicit_support_example', sourceCategory: '余气' },
  { stem: '갑', branch: '해', sourceStem: '甲', sourceBranch: '亥', sourceClass: 'explicit_support_example', sourceCategory: '长生禄刃' },
  { stem: '갑', branch: '인', sourceStem: '甲', sourceBranch: '寅', sourceClass: 'explicit_support_example', sourceCategory: '长生禄刃' },
  { stem: '갑', branch: '묘', sourceStem: '甲', sourceBranch: '卯', sourceClass: 'explicit_support_example', sourceCategory: '长生禄刃' },
])

export const SAJU_ZIPING_EXPLICIT_STEM_BRANCH_ANALYSIS = Object.freeze({
  sourceId: 'saju-source-ziping-zhenquan',
  locatorId: 'ziping-p5-branch-relations-definition-and-examples',
  sourceByteSha256: '449336b5e35aa6811b0462093d0175c45a0add44065bf2d3845cff75981db692',
  observedDefinition: 'p.5 contrasts branch examples such as 甲逢未/丙逢戌 with 乙逢戌/丁逢丑 and names 余气 and 长生禄刃 examples.',
  adoptedSurface: 'exact source-listed stem/branch example matching with supplied hidden-stem inventory; no all-branch classification or strength ordering',
  examples: ZIPING_EXPLICIT_STEM_BRANCH_EXAMPLES,
  unresolved: Object.freeze([
    'complete 本气/中气/余气 mapping for every branch',
    'priority when multiple branch examples or categories coexist',
    'the p.5 阴长生 exception (乙逢午/丁逢酉) beyond its stated comparison',
    'interaction with month-command, other branches, 刑冲会合, and any semantic conclusion',
  ]),
  forbiddenSubstitutions: Object.freeze([
    'generic modern 通根/十二运星 tables',
    'a source rule from another lineage used to fill an unlisted pair',
    'strength, weakness, yongshin, gyeokguk, or personal meaning',
  ]),
})

export const SAJU_ZIPING_ROOT_EXPOSURE_ANALYSIS = Object.freeze({
  sourceId: 'saju-source-ziping-zhenquan',
  sourceByteSha256: '449336b5e35aa6811b0462093d0175c45a0add44065bf2d3845cff75981db692',
  directObservations: Object.freeze([
    Object.freeze({
      locatorId: 'ziping-p3-yang-yin-root-cycle-and-tomb-exception',
      classification: 'FACT',
      statement: 'p.3 defines source-local life-cycle vocabulary and states bounded qualifications for yang-rooted and yin/tomb cases; it does not print a complete stem-to-branch table.',
    }),
    Object.freeze({
      locatorId: 'ziping-p16-branch-stem-root-scan',
      classification: 'FACT',
      statement: 'p.16 directs the reader to scan all four branches for 寅亥卯未 when a visible 甲 is present, and to scan all four visible stems for 壬/甲 when 亥 is present.',
    }),
    Object.freeze({
      locatorId: 'page.local.ziping.p7-yongshin-continuation',
      classification: 'FACT',
      statement: 'p.7 places 不透甲而透丙 inside the 寅月 用神变化 discussion; the sentence directly closes only that local contrast, while it does not state a universal exposure definition or a global use-selection precedence.',
    }),
    Object.freeze({
      locatorId: 'ziping-p10-chen-exposed-stem-definition',
      classification: 'FACT',
      statement: 'p.10 asks 何谓透干 and gives the bounded 甲生辰月 examples 透戊/透癸/透乙, immediately assigning each to a 用神 role and continuing with one/dual exposure and exposure-plus-branch-meeting wording.',
    }),
    Object.freeze({
      locatorId: 'ziping-p11-exposed-stem-and-branch-context',
      classification: 'FACT',
      statement: 'p.11 defines 有情 as 顺而相成 and 無情 as 逆而相背, then combines 透干 and 會支 with 格局-preserving/change examples; it also records 有情而卒成无情 and 无情而终有情 transitions rather than closing a semantic-free composition predicate.',
    }),
  ]),
  adoptedPredicate: Object.freeze({
    predicateId: 'ziping.jia-root-branch-scan.v0',
    status: 'resolved_bounded_stem_specific_predicate',
    locatorId: 'ziping-p16-branch-stem-root-scan',
    anchor: 'any supplied visible 甲 in the four pillar frame',
    rootBranchSet: Object.freeze(['寅', '亥', '卯', '未']),
    haiVisibleStemRelations: Object.freeze({ 壬: '禄', 甲: '長生' }),
    outputScope: 'source-named structural relation inventory only',
  }),
  contextBoundRelations: Object.freeze([
    Object.freeze({
      relationId: 'ziping.p7.yin-month-jia-bing-exposure-change',
      locatorId: 'page.local.ziping.p7-yongshin-continuation',
      sourceSurface: '寅月 with 不透甲而透丙',
      requiredContext: ['寅月', '用神变化'],
      structuralSurface: 'source contrasts visible-stem conditions in a local branch/use-selection example',
      resolution: 'adopted_exact_context_clause',
      outputScope: 'exact 寅月 contrast only: no supplied visible 甲 and exactly one supplied visible 丙; no generic exposure predicate',
    }),
    Object.freeze({
      relationId: 'ziping.p10-chen-three-exposure-examples',
      locatorId: 'ziping-p10-chen-exposed-stem-definition',
      sourceSurface: '甲生辰月 with 透戊/透癸/透乙',
      requiredContext: ['day-master 甲', 'month branch 辰', '用神取用'],
      structuralSurface: 'source names visible-stem cases in the 辰月 example',
      outputScope: 'context-bound example inventory only',
    }),
    Object.freeze({
      relationId: 'ziping.p11-exposure-and-branch-meeting',
      locatorId: 'ziping-p11-exposed-stem-and-branch-context',
      sourceSurface: '透干 with 會支, multiple exposure, and 有情/無情 cases',
      requiredContext: ['用神/格局 discussion', '會支 or multiple exposed stems'],
      structuralSurface: 'source evaluates exposure together with branch meeting and interaction outcome',
      compositionStatus: 'unresolved_composition',
      unresolvedBlockers: ['source-specific 會支-to-Base relation binding', 'multiple exposure and branch-meeting precedence', '有情/無情 transition conditions', 'the source context needed to distinguish composition from 格局 outcome'],
      outputScope: 'context-bound relation; no executable composition result',
    }),
  ]),
  sourceBoundedSemanticSurface: Object.freeze({
    ruleId: 'rule.ziping.chen-exposure-use-role.v0',
    status: 'adopted_exact_context_clause',
    structuralPrerequisiteRuleId: 'rule.ziping.chen-exposure-inventory.v0',
    locatorId: 'ziping-p10-chen-exposed-stem-definition',
    exactCondition: '甲生辰月 with one or more of the source-listed visible targets 戊、癸、乙',
    sourceRoleMapping: Object.freeze({ 戊: '偏财', 癸: '正印', 乙: '月劫' }),
    outputScope: 'source role labels only; no personal meaning, strength, fortune, or cross-lineage rule',
    boundary: 'does not define a universal 透/透干 predicate; the exact p.7 local clause is a separate adopted lane and p.11 remains outside this adopted semantic lane',
  }),
  p7ExactSurface: Object.freeze({
    ruleId: 'rule.ziping.yin-month-exposure-change.v0',
    structuralPrerequisiteRuleId: 'rule.ziping.yin-month-exposure-contrast.v0',
    status: 'adopted_exact_context_clause',
    locatorId: 'page.local.ziping.p7-yongshin-continuation',
    exactCondition: '寅月 with no supplied visible 甲 and exactly one supplied visible 丙 in the four-position frame',
    sourceSelectionStatement: '同知得以作主',
    outputScope: 'source-local selection-change clause only; no global 用神 priority, generic 透/透干 rule, or personal meaning',
  }),
  exposurePredicate: Object.freeze({
    status: 'unresolved_general_predicate',
    exactLocalSurface: 'p.7 寅月 不透甲而透丙; p.10 甲生辰月 with 透戊/透癸/透乙; p.11 透干/會支 interaction cases',
    reason: 'the inspected p.7 and p.10-p.11 examples bind 透/透干 to month-command, use-selection, branch-meeting, and 格局 context and do not close a universal visible-stem-to-hidden-stem predicate, target scope, duplicate rule, or global precedence procedure; only the exact p.7 contrast is adopted as a local clause',
  }),
  unresolved: Object.freeze([
    'complete source-defined mapping for every visible stem and every branch',
    'whether the p.16 scan is intended to emit duplicate anchor positions or only stem presence when multiple 甲 values occur',
    'general 透/透干 identity and priority outside the 甲生辰月 examples',
    'whether the local 透/透干 wording is intended as visible membership in the supplied hidden-stem list outside the named examples',
    'interaction with month-command selection, 会支, 刑沖, luck periods, and semantic conclusions',
    'the p.3 yin/tomb qualification and p.5 category ordering beyond the adopted 甲 scan',
  ]),
  forbiddenSubstitutions: Object.freeze([
    'modern universal 通根 or 十二運星 tables',
    'another lineage used to complete the stem-to-branch map',
    'use-selection, strength, yongshin, gyeokguk, fortune, or personal meaning',
  ]),
})

export const SAJU_LINEAGE_RULES = Object.freeze([
  rule({
    ruleId: 'rule.yuanhai.day-anchor-month-command-frame.v0',
    work: WORKS.yuanhai,
    lineage: 'yuanhai_local_export',
    status: 'adopted_lineage_rule',
    ruleCompleteness: 'bounded_complete_structural_frame',
    executionStatus: 'executable_from_frozen_base',
    sourceIds: ['saju-source-yuanhai-ziping'],
    locatorIds: ['yuanhai-p6-day-as-host', 'yuanhai-p7-month-command'],
    observedRule: '일간을 구조적 기준으로 두고 연·월·일·시의 source role을 순서대로 확인하며 월령을 별도 맥락으로 확인한다.',
    preconditions: ['four pillars are present', 'day-master fact is present'],
    inputFacts: [FACT_REFS.dayMaster, FACT_REFS.yearPillar, FACT_REFS.monthPillar, FACT_REFS.dayPillar, FACT_REFS.hourPillar],
    orderedSteps: ['anchor on day-master', 'read year/month/day/hour role labels', 'inspect month-command context', 'do not emit the adjacent life-outcome prose'],
    structuralOutput: ['sourceRoleFrame', 'orderedFactRefs'],
    exceptions: ['missing hour or unknown time stops the complete four-role frame; no hour is inferred'],
    conflictPolicy: 'retain the source role labels without converting them to life domains or traits',
  }),
  rule({
    ruleId: 'rule.yuanhai.hidden-stem-ten-god-label-inventory.v0',
    work: WORKS.yuanhai,
    lineage: 'yuanhai_local_export',
    status: 'adopted_lineage_rule',
    ruleCompleteness: 'bounded_label_inventory_only',
    executionStatus: 'executable_from_frozen_base',
    sourceIds: ['saju-source-yuanhai-ziping'],
    locatorIds: ['yuanhai-p4-hidden-stems-and-ten-god-labels'],
    observedRule: '暗藏總訣 surface contains hidden-stem/ten-god labels beside seasonal material.',
    preconditions: ['pillarFacts are present', 'hidden-stem entries are present'],
    inputFacts: [FACT_REFS.pillarFacts, FACT_REFS.visibleTenGods],
    orderedSteps: ['enumerate the supplied hidden-stem entries by pillar', 'retain the supplied ten-god labels', 'do not infer label meaning or repeated-count priority'],
    structuralOutput: ['hiddenStemLabelInventory', 'visibleTenGodLabelInventory'],
    exceptions: ['the page uses multiple traditional labels; one label is not normalized into a single personal meaning'],
    conflictPolicy: 'preserve visible and hidden label lanes separately',
  }),
  rule({
    ruleId: 'rule.yuanhai.dayun-branch-seun-stem-lens.v0',
    work: WORKS.yuanhai,
    lineage: 'yuanhai_local_export',
    status: 'adopted_lineage_rule',
    ruleCompleteness: 'bounded_timing_lens_frame',
    executionStatus: 'executable_from_frozen_base',
    sourceIds: ['saju-source-yuanhai-ziping'],
    locatorIds: ['yuanhai-p9-dayun-focus-lens'],
    observedRule: 'p.9 states 大运看支、岁君看干; the adopted output is only this source focus lens over already supplied timing FACTs, not direction, start-age, conversion, or outcome inference.',
    preconditions: ['timeAccuracy is exact', 'the frozen Base supplies an active 大運 cycle with a branch', 'the frozen Base supplies the 歲君/seUn stem'],
    inputFacts: [FACT_REFS.timing, FACT_REFS.timeAccuracy],
    orderedSteps: ['consume the supplied active 大運 cycle and retain its branch as the source focus', 'consume the supplied seUn/歲君 stem and retain it as the source focus', 'emit the two source focus labels and fact references', 'stop before timing recalculation, pattern selection, or life-outcome semantics'],
    structuralOutput: ['dayunBranchFocus', 'seUnStemFocus', 'activeDayunBranch', 'timingFactRefs'],
    exceptions: ['missing or non-exact timing input blocks the lens', 'missing active-cycle branch or seUn stem blocks the lens', 'do not derive direction, first-start date, age conversion, or fortune meaning from this phrase'],
    conflictPolicy: 'preserve the Yuanhai focus lens as a lineage-specific structural result; do not merge it with another lineage timing rule',
  }),
  rule({
    ruleId: 'rule.sanming.four-pillars-month-hour-frame.v0',
    work: WORKS.sanming,
    lineage: 'sanming_local_export',
    status: 'adopted_lineage_rule',
    ruleCompleteness: 'bounded_complete_procedure_frame',
    executionStatus: 'executable_from_frozen_base',
    sourceIds: ['saju-source-sanming-tonghui'],
    locatorIds: ['sanming-p69-month-hour-method', 'sanming-p70-year-month-day-hour'],
    observedRule: '四柱 are explicitly framed as year/month/day/hour; the text names month-from-year and hour-from-day procedures.',
    preconditions: ['four pillar FACTs are already supplied by the Base'],
    inputFacts: [FACT_REFS.yearPillar, FACT_REFS.monthPillar, FACT_REFS.dayPillar, FACT_REFS.hourPillar],
    orderedSteps: ['accept the supplied four-pillar frame', 'record the source procedure labels', 'do not recalculate the frozen pillars in the reading grammar'],
    structuralOutput: ['fourPillarFrame', 'derivationProcedureLabels_without_recalculation'],
    exceptions: ['calendar boundary, day boundary, and solar-time policy are outside this source-bounded rule'],
    conflictPolicy: 'keep source procedure wording separate from the modern engine policy',
  }),
  rule({
    ruleId: 'rule.sanming.human-element-month-command.v0',
    work: WORKS.sanming,
    lineage: 'sanming_local_export',
    status: 'adopted_lineage_rule',
    ruleCompleteness: 'bounded_role_scope_not_service_day_table',
    executionStatus: 'executable_from_frozen_base',
    sourceIds: ['saju-source-sanming-tonghui'],
    locatorIds: ['sanming-p65-human-element-and-month-command', 'sanming-p66-seasonal-hidden-stem-service'],
    observedRule: '人元/司事 is tied to the month-command framing; the page also shows a hidden-stem service-day example.',
    preconditions: ['month branch is present', 'month hidden-stem entries are present'],
    inputFacts: [FACT_REFS.monthBranch, FACT_REFS.monthHiddenStems],
    orderedSteps: ['identify the month-command branch', 'enumerate its supplied hidden-stem entries', 'keep service-day arithmetic outside the adopted role scope'],
    structuralOutput: ['monthCommandBranch', 'monthHiddenStemInventory'],
    exceptions: ['the visible service-day example is not generalized into a complete twelve-month weight table'],
    conflictPolicy: 'do not merge Sanming service-day numbers with the local engine hidden-stem weights',
  }),
  rule({
    ruleId: 'rule.sanming.element-generation-control-v0',
    work: WORKS.sanming,
    lineage: 'sanming_local_export',
    status: 'adopted_lineage_rule',
    ruleCompleteness: 'bounded_relation_vocabulary',
    executionStatus: 'executable_from_frozen_base',
    sourceIds: ['saju-source-sanming-tonghui'],
    locatorIds: ['sanming-p4-element-generation', 'sanming-p5-element-generation-control', 'sanming-p6-stem-branch-origin'],
    observedRule: 'the source presents five-phase generation/control and stem/branch framing as relation vocabulary.',
    preconditions: ['element labels are present in the Base'],
    inputFacts: [FACT_REFS.elements, FACT_REFS.pillarFacts, FACT_REFS.stemRelations],
    orderedSteps: ['read supplied element labels', 'read supplied relation records', 'stop before deriving balance, force, or personal meaning'],
    structuralOutput: ['elementInventory', 'existingStemRelationInventory'],
    exceptions: ['source numerical or directional prose is not used to recalculate the Base'],
    conflictPolicy: 'relation vocabulary is not a precedence rule and does not resolve other lineage clauses',
  }),
  rule({
    ruleId: 'rule.ziping.branch-relation-inventory.v0',
    work: WORKS.ziping,
    lineage: 'ziping_local_export',
    status: 'adopted_lineage_rule',
    ruleCompleteness: 'bounded_relation_inventory_not_resolution',
    executionStatus: 'executable_from_frozen_base',
    sourceIds: ['saju-source-ziping-zhenquan'],
    locatorIds: ['ziping-p5-branch-relations-definition-and-examples'],
    observedRule: 'the page distinguishes 刑、沖、會、合 and gives bounded examples for each.',
    preconditions: ['branch relation FACT list is present'],
    inputFacts: [FACT_REFS.branchRelations],
    orderedSteps: ['enumerate each supplied relation', 'retain its branches and positions', 'preserve simultaneous relation labels', 'do not apply 解/化/吉凶 semantics'],
    structuralOutput: ['branchRelationInventory', 'parallelRelationLedger'],
    exceptions: ['repository 破/害/半合 labels are retained as raw FACTs but are not claimed to be established by this page'],
    conflictPolicy: 'no relation precedence; no silent cancellation or winner selection',
  }),
  rule({
    ruleId: 'rule.ziping.explicit-stem-branch-example-match.v0',
    work: WORKS.ziping,
    lineage: 'ziping_local_export',
    status: 'adopted_lineage_rule',
    ruleCompleteness: 'bounded_explicit_example_predicate',
    executionStatus: 'executable_from_frozen_base',
    sourceIds: ['saju-source-ziping-zhenquan'],
    locatorIds: ['ziping-p5-branch-relations-definition-and-examples'],
    observedRule: 'p.5 gives exact stem/branch examples for support and non-support and names the bounded categories 墓库、余气、长生禄刃; it does not provide a complete all-branch rule.',
    preconditions: ['day-master stem is present', 'all four supplied branch and hidden-stem entries are present'],
    inputFacts: [FACT_REFS.dayMaster, FACT_REFS.pillarFacts],
    orderedSteps: ['read the supplied day-master stem as the bounded anchor', 'inspect each supplied branch value with its hidden-stem inventory', 'match only the exact p.5 example pairs', 'emit all matches without weighting, ranking, or semantic expansion'],
    structuralOutput: ['explicitStemBranchExampleInventory'],
    exceptions: ['p.5 阴长生 examples 乙逢午/丁逢酉 remain outside the executable pair set because the stated comparison does not close their input relation', 'unlisted stems/branches, 本气/中气/余气 tables, month-command priority, and 刑冲会合 interactions are not inferred'],
    conflictPolicy: 'preserve every exact example match and any negative example; no merge with other lineages or source-wide root/exposure conclusions',
  }),
  rule({
    ruleId: 'rule.ziping.jia-root-branch-scan.v0',
    work: WORKS.ziping,
    lineage: 'ziping_local_export',
    status: 'adopted_lineage_rule',
    ruleCompleteness: 'bounded_stem_specific_predicate',
    executionStatus: 'executable_from_frozen_base',
    sourceIds: ['saju-source-ziping-zhenquan'],
    locatorIds: ['ziping-p3-yang-yin-root-cycle-and-tomb-exception', 'ziping-p16-branch-stem-root-scan'],
    observedRule: 'p.16 gives a bounded scan predicate: when visible 甲 is present, inspect all four branches for 寅亥卯未 as 甲木之根; when 亥 is present, inspect all four visible stems for 壬/甲 and retain the source-named 禄/長生 relations.',
    preconditions: ['exact time and all four supplied visible stem/branch entries are present'],
    inputFacts: [FACT_REFS.pillarFacts, FACT_REFS.timeAccuracy],
    orderedSteps: ['enumerate visible stem/branch entries by pillar position', 'retain every visible 甲 anchor position', 'scan all four branches for the source-listed 寅亥卯未 set', 'when a supplied branch is 亥, scan all four visible stems for 壬 and 甲 and emit their source-named relations', 'emit the bounded inventories without ranking or semantic expansion'],
    structuralOutput: ['jiaRootBranchMatches', 'haiVisibleStemRelations', 'visibleStemAnchors'],
    exceptions: ['the predicate is only for source-listed 甲/亥 relations', 'p.3 yin/tomb qualifications and p.5 category comparisons are not generalized to other stems', 'duplicate visible 甲 positions are preserved as anchors but do not create a new weighting rule', '透/透干 examples from p.10–11 remain outside this rule'],
    conflictPolicy: 'preserve every source-listed match and visible position; no merge with another lineage or with the unresolved generic root/exposure rule',
  }),
  rule({
    ruleId: 'rule.ziping.chen-exposure-inventory.v0',
    work: WORKS.ziping,
    lineage: 'ziping_local_export',
    status: 'adopted_lineage_rule',
    ruleCompleteness: 'bounded_exact_exposure_example_predicate',
    executionStatus: 'executable_from_frozen_base',
    sourceIds: ['saju-source-ziping-zhenquan'],
    locatorIds: ['ziping-p10-chen-exposed-stem-definition'],
    observedRule: 'p.10 asks 何謂透干 and names only the 甲生辰月 targets 戊、癸、乙; this contract materializes that named exposure inventory without defining 透/透干 outside the exact example.',
    preconditions: ['day-master stem is 甲', 'month branch is 辰', 'the month hidden-stem inventory contains the three source-listed targets', 'all four supplied visible stem positions are present'],
    inputFacts: [FACT_REFS.dayMaster, FACT_REFS.monthBranch, FACT_REFS.pillarFacts, FACT_REFS.timeAccuracy],
    orderedSteps: ['check the exact 甲生辰月 source window', 'read the supplied month hidden-stem inventory without rebuilding it', 'scan only the four supplied visible stem fields for 戊、癸、乙', 'retain every matching position and the source stem identity', 'stop at the named exposure inventory before applying any source role label'],
    structuralOutput: ['chenNamedExposureInventory'],
    exceptions: ['an empty match is not evidence that other stems are not 透; it only records no match among the three named targets', 'no other month branch, day-master stem, hidden-stem table, 透/透干 target, or duplicate priority is inferred', '會支, 用神变化, 有情/無情, 格局, strength, and personal meaning are outside this structural result'],
    conflictPolicy: 'preserve all named target matches and do not merge this exact inventory with the unresolved generic root/exposure rule or another lineage',
  }),
  rule({
    ruleId: 'rule.ziping.yin-month-exposure-contrast.v0',
    work: WORKS.ziping,
    lineage: 'ziping_local_export',
    status: 'adopted_lineage_rule',
    ruleCompleteness: 'bounded_exact_source_clause_predicate',
    executionStatus: 'executable_from_frozen_base',
    sourceIds: ['saju-source-ziping-zhenquan'],
    locatorIds: ['page.local.ziping.p7-yongshin-continuation'],
    observedRule: 'p.7 gives the exact local contrast 不透甲而透丙 under 寅月; this rule binds it to the supplied four-position visible-stem frame and emits only the source-local contrast inventory.',
    preconditions: ['month branch is 寅', 'exact time and all four supplied visible stem positions are present', 'no supplied visible 甲 and exactly one supplied visible 丙'],
    inputFacts: [FACT_REFS.monthBranch, FACT_REFS.pillarFacts, FACT_REFS.timeAccuracy],
    orderedSteps: ['check the supplied month branch for the exact 寅 window', 'enumerate the four supplied visible stem positions without reconstructing hidden-stem or exposure tables', 'confirm that 甲 is absent and 丙 occurs exactly once', 'emit the source-local contrast and its position inventory without selecting a global use-selection priority'],
    structuralOutput: ['yinMonthExposureContrast'],
    exceptions: ['a non-寅 month, any supplied visible 甲, or no supplied visible 丙 is outside this exact source window', 'multiple supplied visible 丙 values stop because p.7 does not close a duplicate rule', 'do not infer a generic 透/透干 predicate, hidden-stem membership, all-month mapping, use-selection ranking, or personal meaning'],
    conflictPolicy: 'preserve the exact local contrast only; do not merge it with p.10 named exposure roles, p.11 interaction cases, or another lineage',
  }),
  rule({
    ruleId: 'rule.ziping.month-command-selection.v0',
    work: WORKS.ziping,
    lineage: 'ziping_local_export',
    status: 'unresolved',
    ruleCompleteness: 'partial_semantic_selection_clause',
    executionStatus: 'not_executable_by_contract',
    sourceIds: ['saju-source-ziping-zhenquan'],
    locatorIds: ['page.local.ziping.p6-yongshin', 'page.local.ziping.p7-yongshin-continuation', 'page.local.ziping.p10-xiangshen', 'page.local.ziping.p11-xiangshen-continuation'],
    observedRule: 'month-command-first use-selection and subsequent success/rescue/change clauses are visible, but their complete precedence is not normalized.',
    preconditions: ['a source-specific use-selection target would be required'],
    inputFacts: [FACT_REFS.monthBranch, FACT_REFS.dayMaster, FACT_REFS.pillarFacts],
    orderedSteps: ['not executed'],
    structuralOutput: [],
    exceptions: ['do not infer a use-selection result from the month branch alone'],
    conflictPolicy: 'preserve the clause family as unresolved rather than choosing a priority order',
  }),
  rule({
    ruleId: 'rule.ziping.root-exposure.v0',
    work: WORKS.ziping,
    lineage: 'ziping_local_export',
    status: 'unresolved',
    ruleCompleteness: 'partial_rooting_exposure_clause',
    executionStatus: 'not_executable_by_contract',
    sourceIds: ['saju-source-ziping-zhenquan'],
    locatorIds: ['ziping-p3-yang-yin-root-cycle-and-tomb-exception', 'ziping-p5-branch-relations-definition-and-examples', 'page.local.ziping.p6-yongshin', 'page.local.ziping.p7-yongshin-continuation', 'ziping-p10-chen-exposed-stem-definition', 'ziping-p11-exposed-stem-and-branch-context', 'ziping-p16-branch-stem-root-scan'],
    observedRule: 'p.3/p.5/p.16 close a bounded 甲 root-scan surface, while p.7/p.10/p.11 show 透/透干 in local use-selection and combination examples; a complete all-stem root/exposure predicate and precedence rule is not closed.',
    preconditions: ['a complete all-stem root/exposure definition and precedence procedure would be required'],
    inputFacts: [FACT_REFS.pillarFacts, FACT_REFS.dayMaster],
    orderedSteps: ['not executed'],
    structuralOutput: [],
    exceptions: ['the adopted 甲 root-scan is emitted by its separate rule; raw stem/hidden-stem presence outside that scope is not emitted as a generic 通根/透干 conclusion'],
    conflictPolicy: 'keep the bounded 甲 rule separate and preserve the generic root/exposure frontier unresolved',
  }),
  rule({
    ruleId: 'rule.ziping.timing.v0',
    work: WORKS.ziping,
    lineage: 'ziping_local_export',
    status: 'unresolved',
    ruleCompleteness: 'section_locator_without_exact_timing_contract',
    executionStatus: 'not_executable_by_contract',
    sourceIds: ['saju-source-ziping-zhenquan'],
    locatorIds: ['page.local.ziping.p15-xingyun', 'page.local.ziping.p25-timing'],
    observedRule: 'the text pairs fortune with the natal chart, but the exact repository direction/start-age/active-cycle procedure is not established by the bounded locator set.',
    preconditions: ['a complete source timing procedure and policy bridge would be required'],
    inputFacts: [FACT_REFS.timing, FACT_REFS.timeAccuracy],
    orderedSteps: ['not executed'],
    structuralOutput: [],
    exceptions: ['provided timing dates may be displayed as Base FACTs but are not source-derived semantic outputs'],
    conflictPolicy: 'retain timing FACTs and source timing claims in separate lanes',
  }),
  rule({
    ruleId: 'rule.ditian.jia-wood-seasonal-condition.v0',
    work: WORKS.ditian,
    lineage: 'ditian_local_export',
    status: 'adopted_lineage_rule',
    ruleCompleteness: 'bounded_condition_clause_for_jia_only',
    executionStatus: 'not_applicable_fixture',
    sourceIds: ['saju-source-ditian-sui'],
    locatorIds: ['ditian-p4-jia-wood-seasonal-conditions'],
    observedRule: 'the 甲木 passage states conditional seasonal/support clauses; it is not generalized to other day stems.',
    preconditions: ['day-master stem is 甲', 'season/month context is explicitly supplied'],
    inputFacts: [FACT_REFS.dayMaster, FACT_REFS.monthBranch],
    orderedSteps: ['check the day-stem condition', 'check an explicit season condition', 'record only the matched source clause', 'do not translate it into a trait or strength score'],
    structuralOutput: ['matchedSourceConditionClause'],
    exceptions: ['春/秋 clauses remain source wording; no universal element preference is derived'],
    conflictPolicy: 'coexist with Qiongtong seasonal clauses; never merge by thematic similarity',
  }),
  rule({
    ruleId: 'rule.qiongtong.five-phase-number-season-state.v0',
    work: WORKS.qiongtong,
    lineage: 'qiongtong_local_export',
    status: 'adopted_lineage_rule',
    ruleCompleteness: 'bounded_numeric_operation_without_state_resolver',
    executionStatus: 'blocked_missing_base_fact',
    sourceIds: ['saju-source-qiongtong-baojian'],
    locatorIds: ['qiongtong-p2-five-phase-number-and-season'],
    observedRule: 'the page gives 水一、火二、木三、金四、土五 and states 生旺加倍、死绝减半; it does not define how the state is obtained, whether the input is per-element, or which precedence/exception applies.',
    preconditions: ['element identity is present', 'a source-specific state resolver and locator-bounded state input are present'],
    inputFacts: [FACT_REFS.elements],
    orderedSteps: ['identify the source-listed element number', 'obtain a closed source-specific state without generic stage substitution', 'apply only the source-scoped double/half operation', 'keep the result separate from Base distribution counts'],
    structuralOutput: ['sourceScopedElementNumberState'],
    exceptions: ['p.2 does not close state derivation or per-element input shape; do not execute until that prerequisite is separately closed', 'do not treat current Base element counts, hidden-stem weights, or generic 十二運星 labels as this source state'],
    conflictPolicy: 'no merge with Sanming generation/control or the engine weighted distribution',
  }),
  rule({
    ruleId: 'rule.qiongtong.jia-wood-seasonal-clauses.v0',
    work: WORKS.qiongtong,
    lineage: 'qiongtong_local_export',
    status: 'adopted_lineage_rule',
    ruleCompleteness: 'bounded_month_specific_condition_clauses',
    executionStatus: 'not_applicable_fixture',
    sourceIds: ['saju-source-qiongtong-baojian'],
    locatorIds: ['qiongtong-p4-spring-jia-wood', 'qiongtong-p5-spring-jia-wood-continuation', 'qiongtong-p7-summer-jia-wood'],
    observedRule: 'the text has separate spring and summer 甲木 sections with month-specific conditional clauses.',
    preconditions: ['day-master stem is 甲', 'month/season context is explicit'],
    inputFacts: [FACT_REFS.dayMaster, FACT_REFS.monthBranch],
    orderedSteps: ['select only the matching month/season section', 'retain its conditional clause sequence', 'do not transfer a clause to another day stem or season'],
    structuralOutput: ['matchedMonthSpecificClause'],
    exceptions: ['p4/p5 and p7 are separate seasonal sections; they are not one universal rule'],
    conflictPolicy: 'keep each month-specific clause as a separate lineage branch',
  }),
  rule({
    ruleId: 'rule.qiongtong.use-selection-precedence.v0',
    work: WORKS.qiongtong,
    lineage: 'qiongtong_local_export',
    status: 'unresolved',
    ruleCompleteness: 'conditional_clauses_without_normalized_precedence',
    executionStatus: 'not_executable_by_contract',
    sourceIds: ['saju-source-qiongtong-baojian'],
    locatorIds: ['qiongtong-p4-spring-jia-wood', 'qiongtong-p5-spring-jia-wood-continuation', 'qiongtong-p7-summer-jia-wood'],
    observedRule: 'seasonal paragraphs contain multiple conditional element clauses, but no cross-section priority order is adopted.',
    preconditions: ['source-specific season and day-stem conditions must be closed'],
    inputFacts: [FACT_REFS.dayMaster, FACT_REFS.monthBranch, FACT_REFS.elements],
    orderedSteps: ['not executed'],
    structuralOutput: [],
    exceptions: ['do not collapse month-specific clauses into a yongshin or strength answer'],
    conflictPolicy: 'preserve each conditional clause and any future contradiction separately',
  }),
  rule({
    ruleId: 'rule.yuanhai.dayun-exact-timing.v0',
    work: WORKS.yuanhai,
    lineage: 'yuanhai_local_export',
    status: 'unresolved',
    ruleCompleteness: 'section_locator_only',
    executionStatus: 'not_executable_by_contract',
    sourceIds: ['saju-source-yuanhai-ziping'],
    locatorIds: ['page.local.yuanhai.p9-dayun-section'],
    observedRule: 'a 大運 section is located, but the exact direction, term-distance, conversion, and first-start timestamp rule is not closed.',
    preconditions: ['complete source timing procedure and independent collation'],
    inputFacts: [FACT_REFS.timing, FACT_REFS.timeAccuracy],
    orderedSteps: ['not executed'],
    structuralOutput: [],
    exceptions: ['never reinterpret current timing FACTs as this source rule'],
    conflictPolicy: 'coexist with the separate timing-authority frontier',
  }),
  rule({
    ruleId: 'feature.shinsal-source-rule.v0',
    work: '다섯 문헌 공통 범위 밖',
    lineage: 'none',
    status: 'unsupported',
    ruleCompleteness: 'no_admitted_locator',
    executionStatus: 'unsupported',
    sourceIds: [],
    locatorIds: [],
    observedRule: '현재 허용 locator set에 정확한 신살 reference axis와 mapping을 닫는 직접 근거가 없다.',
    preconditions: [],
    inputFacts: [],
    orderedSteps: [],
    structuralOutput: [],
    exceptions: ['do not infer from engine output or common terminology'],
    conflictPolicy: 'remain unsupported until a bounded source rule is directly reviewed',
  }),
  rule({
    ruleId: 'feature.personal-meaning-and-prediction.v0',
    work: '해석 Constitution 범위 밖',
    lineage: 'none',
    status: 'unsupported',
    ruleCompleteness: 'not_a_source_rule',
    executionStatus: 'unsupported',
    sourceIds: [],
    locatorIds: [],
    observedRule: '단일 상징을 성격·개인 특성·사건 예측으로 확장하는 규칙은 이 grammar에 포함하지 않는다.',
    preconditions: [],
    inputFacts: [],
    orderedSteps: [],
    structuralOutput: [],
    exceptions: [],
    conflictPolicy: 'remain outside the source-bounded grammar',
  }),
])

export const SAJU_LINEAGE_STRUCTURAL_RESULT_CONTRACT_SCHEMA = 'saju-lineage-derived-structural-result-v0'
export const SAJU_LINEAGE_STRUCTURAL_RESULT_CONTRACT_VERSION = '0.1.0'

export const SAJU_LINEAGE_STRUCTURAL_RESULT_CLASSES = Object.freeze([
  'executable_rule',
  'prerequisite_gap',
  'unresolved_rule',
  'derived_structural_result',
  'lineage_conflict',
  'not_applicable_fixture',
  'unsupported',
])

const structuralContractSpec = (ruleId, value) => {
  const ruleItem = SAJU_LINEAGE_RULES.find(item => item.ruleId === ruleId)
  if (!ruleItem) throw new Error(`unknown adopted Saju rule contract: ${ruleId}`)
  if (ruleItem.status !== 'adopted_lineage_rule') throw new Error(`non-adopted Saju rule contract: ${ruleId}`)
  return {
    contractId: `contract.${ruleId}`,
    ruleId,
    ruleStatus: ruleItem.status,
    work: ruleItem.work,
    lineage: ruleItem.lineage,
    sourceIds: [...ruleItem.sourceIds],
    locatorIds: [...ruleItem.locatorIds],
    commonBaseFacts: ruleItem.inputFacts.map(factRef => ({
      factRef,
      origin: 'frozen_base_common_fact',
    })),
    lineagePrerequisites: [],
    applicability: [],
    procedure: [],
    stopConditions: [],
    output: {
      origin: 'lineage_derived_structural_result',
      resultKey: null,
      fields: [],
      semanticExpansion: false,
    },
    conflictGroup: null,
    conflictPolicy: 'preserve_lineage_separation_and_fail_closed_on_conflict',
    ...value,
  }
}

export const SAJU_LINEAGE_STRUCTURAL_CONTRACTS = Object.freeze([
  structuralContractSpec('rule.yuanhai.day-anchor-month-command-frame.v0', {
    commonBaseFacts: [
      { factRef: FACT_REFS.dayMaster, origin: 'frozen_base_common_fact' },
      { factRef: FACT_REFS.yearPillar, origin: 'frozen_base_common_fact' },
      { factRef: FACT_REFS.monthPillar, origin: 'frozen_base_common_fact' },
      { factRef: FACT_REFS.dayPillar, origin: 'frozen_base_common_fact' },
      { factRef: FACT_REFS.hourPillar, origin: 'frozen_base_common_fact' },
      { factRef: FACT_REFS.timeAccuracy, origin: 'frozen_normalized_input' },
    ],
    applicability: [
      'timeAccuracy must be exact',
      'the day-master stem and all four supplied pillar values must be present',
    ],
    procedure: [
      'bind the supplied day-master stem as the source anchor',
      'read the supplied year/month/day/hour values in that order',
      'label month as month-command context and hour as auxiliary context',
      'emit only the role frame and fact references; do not infer a life domain',
    ],
    stopConditions: [
      'stop when timeAccuracy is not exact',
      'stop when any four-pillar or day-master fact is missing or null',
      'never infer an hour pillar or repair an uncertain time',
    ],
    output: {
      origin: 'lineage_derived_structural_result',
      resultKey: 'yuanhai.sourceRoleFrame',
      fields: ['sourceRoleFrame', 'factRefs', 'timeAccuracy'],
      semanticExpansion: false,
    },
  }),
  structuralContractSpec('rule.yuanhai.hidden-stem-ten-god-label-inventory.v0', {
    commonBaseFacts: [
      { factRef: FACT_REFS.pillarFacts, origin: 'frozen_base_common_fact' },
      { factRef: FACT_REFS.visibleTenGods, origin: 'frozen_base_common_fact' },
      { factRef: FACT_REFS.timeAccuracy, origin: 'frozen_normalized_input' },
    ],
    applicability: [
      'timeAccuracy must be exact for a complete four-pillar inventory',
      'each year/month/day/hour pillarFacts entry must contain a hiddenStems array',
      'tenGodsVisible must be present as the already-supplied label inventory',
    ],
    procedure: [
      'enumerate hidden-stem entries by supplied pillar position',
      'retain each supplied stem and tenGod label without relabeling',
      'emit the visible label map separately from the hidden label inventory',
    ],
    stopConditions: [
      'stop when timeAccuracy is not exact or a pillar position is absent',
      'stop when a hidden-stem list or visible label map is missing',
      'do not infer label priority, repeated-count meaning, or personal meaning',
    ],
    output: {
      origin: 'lineage_derived_structural_result',
      resultKey: 'yuanhai.hiddenStemLabelInventory',
      fields: ['hiddenStemLabels', 'visibleTenGods'],
      semanticExpansion: false,
    },
  }),
  structuralContractSpec('rule.yuanhai.dayun-branch-seun-stem-lens.v0', {
    commonBaseFacts: [
      { factRef: FACT_REFS.timing, origin: 'frozen_base_common_fact' },
      { factRef: FACT_REFS.timeAccuracy, origin: 'frozen_normalized_input' },
    ],
    applicability: [
      'timeAccuracy must be exact',
      'the frozen timing FACT must contain an active 大運 cycle with a branch and a seUn/歲君 stem',
    ],
    procedure: [
      'read the already supplied active 大運 cycle and expose its branch as the source focus',
      'read the already supplied seUn/歲君 stem and expose it as the source focus',
      'emit the two focus labels, selected values, and timing fact references',
      'do not recalculate timing or attach an outcome meaning',
    ],
    stopConditions: [
      'stop when timeAccuracy is not exact',
      'stop when timing, daYun cycles, active cycle, or seUn stem is missing or malformed',
      'never infer direction, first-start date, age conversion, or fortune outcome from the focus phrase',
    ],
    output: {
      origin: 'lineage_derived_structural_result',
      resultKey: 'yuanhai.dayunFocusLens',
      fields: ['focusFrame', 'activeDayun', 'seUn', 'factRefs', 'timeAccuracy'],
      semanticExpansion: false,
    },
  }),
  structuralContractSpec('rule.sanming.four-pillars-month-hour-frame.v0', {
    commonBaseFacts: [
      { factRef: FACT_REFS.yearPillar, origin: 'frozen_base_common_fact' },
      { factRef: FACT_REFS.monthPillar, origin: 'frozen_base_common_fact' },
      { factRef: FACT_REFS.dayPillar, origin: 'frozen_base_common_fact' },
      { factRef: FACT_REFS.hourPillar, origin: 'frozen_base_common_fact' },
      { factRef: FACT_REFS.timeAccuracy, origin: 'frozen_normalized_input' },
    ],
    applicability: [
      'timeAccuracy must be exact',
      'all four supplied pillar values must be present',
    ],
    procedure: [
      'accept the frozen four-pillar frame as input',
      'record the source procedure labels month-from-year and hour-from-day',
      'emit the supplied pillar values without rerunning calendar or time policy',
    ],
    stopConditions: [
      'stop when timeAccuracy is not exact or the hour pillar is absent',
      'stop when any four-pillar value is missing',
      'do not recalculate solar-term, day-boundary, or true-solar-time policy',
    ],
    output: {
      origin: 'lineage_derived_structural_result',
      resultKey: 'sanming.fourPillarFrame',
      fields: ['fourPillars', 'procedureLabels', 'recalculation'],
      semanticExpansion: false,
    },
  }),
  structuralContractSpec('rule.sanming.human-element-month-command.v0', {
    commonBaseFacts: [
      { factRef: FACT_REFS.monthBranch, origin: 'frozen_base_common_fact' },
      { factRef: FACT_REFS.monthHiddenStems, origin: 'frozen_base_common_fact' },
    ],
    applicability: [
      'month branch and its supplied hidden-stem list must be present',
      'the result is limited to month-command and hidden-stem inventory',
    ],
    procedure: [
      'bind the supplied month branch as the month-command position',
      'enumerate its supplied hidden-stem entries',
      'record that the visible service-day example was not applied',
    ],
    stopConditions: [
      'stop when month branch or month hidden-stem facts are missing or null',
      'stop before applying service-day arithmetic or a full twelve-month table',
      'do not convert month-command inventory into strength or use selection',
    ],
    output: {
      origin: 'lineage_derived_structural_result',
      resultKey: 'sanming.monthCommandInventory',
      fields: ['monthCommandBranch', 'hiddenStems', 'serviceDayArithmetic'],
      semanticExpansion: false,
    },
  }),
  structuralContractSpec('rule.sanming.element-generation-control-v0', {
    commonBaseFacts: [
      { factRef: FACT_REFS.elements, origin: 'frozen_base_common_fact' },
      { factRef: FACT_REFS.pillarFacts, origin: 'frozen_base_common_fact' },
      { factRef: FACT_REFS.stemRelations, origin: 'frozen_base_common_fact' },
    ],
    applicability: [
      'the supplied element distribution and pillarFacts envelope must be present',
      'the supplied stem relation list may be empty and is still an observed inventory',
    ],
    procedure: [
      'read the supplied element labels and counts',
      'read the supplied stem relation records without rebuilding a relation graph',
      'emit vocabulary/inventory only',
    ],
    stopConditions: [
      'stop when element distribution, pillarFacts, or stem relation list is missing',
      'do not calculate balance, force, strength, or a preferred element',
      'do not merge this relation vocabulary with another lineage rule',
    ],
    output: {
      origin: 'lineage_derived_structural_result',
      resultKey: 'sanming.elementRelationInventory',
      fields: ['elementInventory', 'existingStemRelations', 'relationGraph'],
      semanticExpansion: false,
    },
  }),
  structuralContractSpec('rule.ziping.branch-relation-inventory.v0', {
    commonBaseFacts: [
      { factRef: FACT_REFS.branchRelations, origin: 'frozen_base_common_fact' },
    ],
    applicability: [
      'branchRelations must be an array; an empty array is a valid empty inventory',
    ],
    procedure: [
      'enumerate each supplied relation with its name, branches, and positions',
      'retain simultaneous relation records in their supplied order',
      'separate names inside and outside this locator scope',
      'set precedence to none',
    ],
    stopConditions: [
      'stop when branchRelations is absent or not an array',
      'do not cancel, rank, resolve, transform, or assign valence to relations',
      'do not treat 파/해/반합 inventory as proven by the narrower locator unless directly observed there',
    ],
    output: {
      origin: 'lineage_derived_structural_result',
      resultKey: 'ziping.branchRelationInventory',
      fields: ['relations', 'sourceListedRelationNames', 'outOfLocatorScopeRelationNames', 'precedence'],
      semanticExpansion: false,
    },
  }),
  structuralContractSpec('rule.ziping.explicit-stem-branch-example-match.v0', {
    commonBaseFacts: [
      { factRef: FACT_REFS.dayMaster, origin: 'frozen_base_common_fact' },
      { factRef: FACT_REFS.pillarFacts, origin: 'frozen_base_common_fact' },
    ],
    applicability: [
      'day-master stem, all four branch values, and all four supplied hidden-stem arrays must be present',
      'the result is limited to the exact p.5 stem/branch examples listed by the source',
    ],
    procedure: [
      'bind the supplied day-master stem as the bounded source anchor',
      'read each supplied branch together with its supplied hidden-stem inventory',
      'match only the exact source-listed stem/branch examples',
      'emit every match without weighting, ranking, or semantic expansion',
    ],
    stopConditions: [
      'stop when the day-master, a branch value, or a hidden-stem inventory is missing or malformed',
      'do not infer an unlisted stem/branch pair or complete 本氣/中氣/餘氣 mapping',
      'do not apply month-command, other-branch, or 刑沖會合 priority',
      'do not output strength, balance, use selection, or personal meaning',
    ],
    output: {
      origin: 'lineage_derived_structural_result',
      resultKey: 'ziping.explicitStemBranchExampleInventory',
      fields: ['anchorStem', 'matchedExamples', 'sourceExampleScope'],
      semanticExpansion: false,
    },
  }),
  structuralContractSpec('rule.ziping.jia-root-branch-scan.v0', {
    commonBaseFacts: [
      { factRef: FACT_REFS.pillarFacts, origin: 'frozen_base_common_fact' },
      { factRef: FACT_REFS.timeAccuracy, origin: 'frozen_normalized_input' },
    ],
    applicability: [
      'timeAccuracy must be exact',
      'all four supplied pillarFacts entries must contain a visible stem and branch',
      'the predicate is limited to source-listed 甲/寅亥卯未 and 亥/壬甲 relations',
    ],
    procedure: [
      'enumerate visible stem and branch values by pillar position',
      'record every visible 甲 anchor position',
      'scan all four branches for 寅亥卯未 and emit the source-named 甲 root matches',
      'for every supplied 亥 branch, scan visible stems for 壬 and 甲 and emit 禄/長生 relation records',
      'preserve positions and matches without weighting, ranking, or semantic expansion',
    ],
    stopConditions: [
      'stop when timeAccuracy is not exact or any visible stem/branch entry is missing or malformed',
      'do not infer a stem-to-branch mapping for stems other than 甲 or relations other than the p.16 examples',
      'do not apply p.3 yin/tomb or p.5 category ordering to unlisted stems',
      'do not convert p.10–11 透/透干 use-selection examples into this root scan',
      'do not output strength, balance, use selection, or personal meaning',
    ],
    output: {
      origin: 'lineage_derived_structural_result',
      resultKey: 'ziping.jiaRootBranchScan',
      fields: ['visibleStemAnchors', 'jiaRootBranchMatches', 'haiVisibleStemRelations', 'sourcePredicateScope'],
      semanticExpansion: false,
    },
  }),
  structuralContractSpec('rule.ziping.chen-exposure-inventory.v0', {
    commonBaseFacts: [
      { factRef: FACT_REFS.dayMaster, origin: 'frozen_base_common_fact' },
      { factRef: FACT_REFS.monthBranch, origin: 'frozen_base_common_fact' },
      { factRef: FACT_REFS.pillarFacts, origin: 'frozen_base_common_fact' },
      { factRef: FACT_REFS.timeAccuracy, origin: 'frozen_normalized_input' },
    ],
    applicability: [
      'day-master stem must be 甲',
      'month branch must be 辰',
      'the supplied 辰 hidden-stem inventory must contain the three p.10 named targets 戊、癸、乙',
      'all four supplied visible stem positions must be present',
    ],
    procedure: [
      'accept the frozen day-master and month-branch FACTs as the exact source window',
      'read the supplied month hidden-stem inventory without reconstructing a branch table',
      'scan only the four supplied visible stem fields for the p.10 named targets',
      'retain every matching position and source stem, including multiple matches',
      'emit the named exposure inventory without assigning a source role label',
    ],
    stopConditions: [
      'return not_applicable_fixture when the day-master is not 甲 or the month branch is not 辰',
      'return prerequisite_gap when exact time, the month hidden-stem inventory, or a visible stem position is missing',
      'do not infer a target outside 戊、癸、乙 or a 透/透干 rule for another month/day-master window',
      'do not apply 會支, 用神变化, 有情/無情, 格局, strength, or personal meaning here',
    ],
    output: {
      origin: 'lineage_derived_structural_result',
      resultKey: 'ziping.chenNamedExposureInventory',
      fields: ['sourceCondition', 'namedTargets', 'namedExposureMatches', 'multiplicity', 'sourcePredicateScope'],
      semanticExpansion: false,
    },
  }),
  structuralContractSpec('rule.ziping.yin-month-exposure-contrast.v0', {
    commonBaseFacts: [
      { factRef: FACT_REFS.monthBranch, origin: 'frozen_base_common_fact' },
      { factRef: FACT_REFS.pillarFacts, origin: 'frozen_base_common_fact' },
      { factRef: FACT_REFS.timeAccuracy, origin: 'frozen_normalized_input' },
    ],
    applicability: [
      'month branch must be 寅',
      'the result is limited to the four supplied visible stem positions',
      'no supplied visible 甲 and exactly one supplied visible 丙 are required for the exact local contrast',
    ],
    procedure: [
      'accept the supplied month branch and visible-stem frame without reconstructing a hidden-stem or all-stem exposure table',
      'enumerate the four visible stem positions',
      'confirm the source-local 不透甲而透丙 condition',
      'emit the contrast inventory and stop before any global use-selection priority',
    ],
    stopConditions: [
      'return not_applicable_fixture when the month is not 寅, a visible 甲 is present, or no visible 丙 is present',
      'return prerequisite_gap when exact time or a visible stem position is missing',
      'return not_executable_by_contract when more than one visible 丙 is present because p.7 does not close duplicate handling',
      'do not infer generic 透/透干 membership, another month mapping, use-selection ranking, or personal meaning',
    ],
    output: {
      origin: 'lineage_derived_structural_result',
      resultKey: 'ziping.yinMonthExposureContrast',
      fields: ['sourceCondition', 'visibleStemInventory', 'absentVisibleStem', 'exposedVisibleStem', 'exposedPositions', 'sourcePredicateScope'],
      semanticExpansion: false,
    },
  }),
  structuralContractSpec('rule.ditian.jia-wood-seasonal-condition.v0', {
    commonBaseFacts: [
      { factRef: FACT_REFS.dayMaster, origin: 'frozen_base_common_fact' },
      { factRef: FACT_REFS.monthBranch, origin: 'frozen_base_common_fact' },
    ],
    lineagePrerequisites: [
      {
        prerequisiteId: 'explicit-season-or-solar-term-context',
        factRef: 'systems.saju.fact.seasonContext',
        status: 'not_in_frozen_public_base',
        requiredWhen: 'dayMasterStem=甲',
      },
    ],
    applicability: [
      'day-master stem must be 甲',
      'an explicit season or solar-term context must be supplied as a separate prerequisite',
    ],
    procedure: [
      'check the day-master condition',
      'check the explicit season/solar-term context',
      'record only the matched source condition window',
    ],
    stopConditions: [
      'return not_applicable_fixture when the day-master stem is not 甲',
      'return prerequisite_gap when season/solar-term context is absent',
      'do not transfer a 甲木 clause to another stem or produce a strength/trait result',
    ],
    output: {
      origin: 'lineage_derived_structural_result',
      resultKey: 'ditian.jiaWoodConditionWindow',
      fields: ['matchedConditionWindow'],
      semanticExpansion: false,
    },
    conflictGroup: 'jia-wood-seasonal-condition-window',
  }),
  structuralContractSpec('rule.qiongtong.five-phase-number-season-state.v0', {
    commonBaseFacts: [
      { factRef: FACT_REFS.elements, origin: 'frozen_base_common_fact' },
    ],
    lineagePrerequisites: [
      {
        prerequisiteId: 'source-specific-shengwang-jue-state',
        factRef: 'systems.saju.fact.seasonState',
        status: 'not_in_frozen_public_base',
        requiredWhen: 'always',
      },
    ],
    applicability: [
      'element identity must be present',
      'a Qiongtong-specific 生旺/死绝 state resolver and locator-bounded input must be supplied separately',
    ],
    procedure: [
      'identify the source-listed element number',
      'obtain a closed source-specific state without generic stage substitution',
      'apply only the source-stated double/half operation',
      'keep the source-scoped state separate from Base distribution counts',
    ],
    stopConditions: [
      'return prerequisite_gap while the source-specific state resolver or its input shape is unresolved',
      'do not infer 生旺/死绝 from current Base counts, hidden-stem weights, or another lineage',
      'do not accept generic 十二運星 or modern stage labels as the Qiongtong state',
      'do not output a strength, balance, or preferred-element conclusion',
    ],
    output: {
      origin: 'lineage_derived_structural_result',
      resultKey: 'qiongtong.sourceScopedElementNumberState',
      fields: ['sourceScopedElementNumberState'],
      semanticExpansion: false,
    },
  }),
  structuralContractSpec('rule.qiongtong.jia-wood-seasonal-clauses.v0', {
    commonBaseFacts: [
      { factRef: FACT_REFS.dayMaster, origin: 'frozen_base_common_fact' },
      { factRef: FACT_REFS.monthBranch, origin: 'frozen_base_common_fact' },
    ],
    lineagePrerequisites: [
      {
        prerequisiteId: 'explicit-month-season-context',
        factRef: 'systems.saju.fact.seasonContext',
        status: 'not_in_frozen_public_base',
        requiredWhen: 'dayMasterStem=甲',
      },
    ],
    applicability: [
      'day-master stem must be 甲',
      'the month/season context must be explicit',
    ],
    procedure: [
      'select only the matching source section window',
      'retain its conditional clause sequence as a source-bounded record',
      'keep spring and summer sections as separate lineage branches',
    ],
    stopConditions: [
      'return not_applicable_fixture when the day-master stem is not 甲',
      'return prerequisite_gap when explicit month/season context is absent',
      'do not collapse sections into yongshin, strength, prediction, or a universal rule',
    ],
    output: {
      origin: 'lineage_derived_structural_result',
      resultKey: 'qiongtong.jiaWoodMonthClauseWindow',
      fields: ['matchedConditionWindow'],
      semanticExpansion: false,
    },
    conflictGroup: 'jia-wood-seasonal-condition-window',
  }),
])

export const SAJU_LINEAGE_SOURCE_SEMANTIC_RESULT_SCHEMA = 'saju-lineage-source-bounded-semantic-result-v0'
export const SAJU_LINEAGE_SOURCE_SEMANTIC_RESULT_VERSION = '0.1.0'
export const SAJU_LINEAGE_SOURCE_SEMANTIC_RESULT_REQUIRED_FIELDS = Object.freeze([
  'sourceIds',
  'lineage',
  'locatorIds',
  'requiredStructuralResult',
  'applicability',
  'semanticRoleResult',
  'conflictState',
  'forbiddenExtensions',
  'provenance',
])

export const SAJU_LINEAGE_SOURCE_SEMANTIC_RULE_STATUSES = Object.freeze([
  'adopted_lineage_semantic_rule',
  'context_bound_candidate',
  'unresolved',
])

const sourceSemanticRule = value => ({
  adoptionScope: 'source_bounded_semantic_rule_only',
  claimPromotion: false,
  semanticAuthority: 'not_established',
  readinessImpact: 'none',
  activationImpact: 'none',
  semanticBoundary: {
    sourceRoleLabelsOnly: true,
    sourceClauseOnly: false,
    personalMeaning: false,
    crossLineageMerge: false,
    commonRulePromotion: false,
  },
  forbiddenExtensions: FORBIDDEN_EXTENSIONS,
  ...value,
})

export const SAJU_ZIPING_SOURCE_SEMANTIC_RULES = Object.freeze([
  sourceSemanticRule({
    ruleId: 'rule.ziping.chen-exposure-use-role.v0',
    work: WORKS.ziping,
    lineage: 'ziping_local_export',
    status: 'adopted_lineage_semantic_rule',
    ruleCompleteness: 'bounded_exact_source_role_clause',
    sourceIds: ['saju-source-ziping-zhenquan'],
    locatorIds: ['ziping-p10-chen-exposed-stem-definition'],
    structuralPrerequisiteRuleIds: ['rule.ziping.chen-exposure-inventory.v0'],
    observedRule: 'p.10 explicitly maps the exact 甲生辰月 named exposure targets 戊、癸、乙 to the source role labels 偏财、正印、月劫 and states that one or multiple named exposures are retained separately.',
    preconditions: ['the exact p.10 甲生辰月 exposure inventory has executed', 'the source-listed target stem is visible in a supplied pillar position'],
    inputFacts: [FACT_REFS.dayMaster, FACT_REFS.monthBranch, FACT_REFS.pillarFacts, FACT_REFS.timeAccuracy],
    orderedSteps: ['consume only the derived p.10 named exposure inventory', 'map 戊、癸、乙 matches to the source labels 偏财、正印、月劫 respectively', 'preserve one-versus-multiple exposure multiplicity as stated by the source', 'stop before 會支, 用神变化, 格局, strength, fortune, personality, or personal meaning'],
    semanticOutput: ['sourceRoleLabelInventory'],
    exceptions: ['an empty named exposure inventory yields no semantic result', 'a missing or conflicting structural prerequisite blocks the semantic result', 'the mapping is not extended to other stems, month branches, day masters, or a modern meaning table'],
    conflictPolicy: 'preserve every source role label and fail closed if another lineage or an unresolved p.11 interaction would be needed',
    output: {
      origin: 'lineage_derived_source_bounded_semantic_result',
      resultKey: 'ziping.chenExposureUseRole',
      fields: ['sourceCondition', 'matchedSourceRoleLabels', 'multiplicityPolicy', 'sourceSemanticScope'],
      semanticExpansion: false,
      personalMeaning: false,
    },
  }),
  sourceSemanticRule({
    ruleId: 'rule.ziping.yin-month-exposure-change.v0',
    work: WORKS.ziping,
    lineage: 'ziping_local_export',
    status: 'adopted_lineage_semantic_rule',
    ruleCompleteness: 'bounded_exact_source_selection_clause',
    sourceIds: ['saju-source-ziping-zhenquan'],
    locatorIds: ['page.local.ziping.p7-yongshin-continuation'],
    semanticBoundary: {
      sourceRoleLabelsOnly: false,
      sourceClauseOnly: true,
      personalMeaning: false,
      crossLineageMerge: false,
      commonRulePromotion: false,
    },
    structuralPrerequisiteRuleIds: ['rule.ziping.yin-month-exposure-contrast.v0'],
    observedRule: 'p.7 closes a source-local selection-change clause for the exact 寅月 contrast 不透甲而透丙; it does not close a universal exposure predicate or a global use-selection precedence procedure.',
    preconditions: ['the exact p.7 寅月 contrast inventory has executed', 'no supplied visible 甲 and exactly one supplied visible 丙 are recorded in the four-position frame'],
    inputFacts: [FACT_REFS.monthBranch, FACT_REFS.pillarFacts, FACT_REFS.timeAccuracy],
    orderedSteps: ['consume only the derived p.7 exact contrast inventory', 'retain the source condition and visible positions', 'record the source clause 同知得以作主 without translating it into a global ranking', 'stop before another month, duplicate exposure, p.10 role mapping, p.11 composition, or personal meaning'],
    semanticOutput: ['source-local selection-change clause'],
    exceptions: ['missing or conflicting structural input blocks the semantic result', 'multiple visible 丙 values remain not executable because p.7 does not close duplicate handling', 'do not reduce the sentence to a universal visible-stem predicate, hidden-stem membership, global 用神 priority, or personal conclusion'],
    conflictPolicy: 'preserve the exact p.7 local clause and keep it separate from p.10 role mapping, p.11 interaction cases, and every other lineage',
    output: {
      origin: 'lineage_derived_source_bounded_semantic_result',
      resultKey: 'ziping.yinMonthExposureChange',
      fields: ['sourceCondition', 'absentVisibleStem', 'exposedVisibleStem', 'exposedPositions', 'sourceSelectionStatement', 'sourceSemanticScope'],
      semanticExpansion: false,
      personalMeaning: false,
    },
  }),
  sourceSemanticRule({
    ruleId: 'rule.ziping.exposure-branch-sentiment.v0',
    work: WORKS.ziping,
    lineage: 'ziping_local_export',
    status: 'unresolved',
    ruleCompleteness: 'unresolved_interaction_semantic_clause',
    sourceIds: ['saju-source-ziping-zhenquan'],
    locatorIds: ['ziping-p11-exposed-stem-and-branch-context'],
    structuralPrerequisiteRuleIds: [],
    observedRule: 'p.11 defines 有情 as 顺而相成 and 無情 as 逆而相背, then combines 透干, 會支, multiple exposure, and 格局-preserving/change cases; it also states 有情而卒成无情 and 无情而终有情, so the composition is not a single static valence predicate.',
    preconditions: ['source-defined 會支 must be bound to the supplied branch relation record', 'the p.10 exposure role inventory and any multiple-exposure rule must be explicitly connected', 'the source conditions and transitions for 有情/無情 must be closed without importing a 格局 or 吉凶 resolver'],
    inputFacts: [FACT_REFS.pillarFacts, FACT_REFS.branchRelations],
    orderedSteps: ['not executed; preserve the source interaction frontier as unresolved'],
    semanticOutput: [],
    exceptions: ['do not choose a winner among 有情/無情 examples', 'do not treat a supplied relation label as the source-defined 會支 without a closed binding', 'do not collapse transition examples into one static classification or translate them into 格局, 吉凶, or personal meaning'],
    conflictPolicy: 'preserve unresolved interaction and do not merge with p.10 or another lineage',
    output: {
      origin: 'lineage_derived_source_bounded_semantic_result',
      resultKey: 'ziping.exposureBranchSentiment',
      fields: ['sourceInteractionWindow'],
      semanticExpansion: false,
      personalMeaning: false,
    },
  }),
])

export const SAJU_ZIPING_SEMANTIC_INVENTORY_STATUSES = Object.freeze([
  'adopted_existing_executable',
  'newly_adopted_executable',
  'context_bound_candidate',
  'unresolved',
  'unsupported',
])

const zipingSemanticInventoryEntry = value => ({
  inventorySchema: 'saju-ziping-source-semantic-rule-inventory-v0',
  work: WORKS.ziping,
  lineage: 'ziping_local_export',
  sourceIds: ['saju-source-ziping-zhenquan'],
  locatorIds: [],
  applicability: [],
  requiredStructuralResult: {
    ruleIds: [],
    fields: [],
    closure: 'not_closed',
  },
  semanticRoleResult: {
    sourceDefinedRole: null,
    outputShape: [],
    scope: 'source_bounded_only',
  },
  exceptions: [],
  forbiddenExtensions: [...FORBIDDEN_EXTENSIONS],
  compositionState: 'coexistence_only_until_source_priority_is_closed',
  sourceObservation: '',
  ...value,
})

/**
 * Full local-work inventory of observed semantic surfaces.  This is a
 * research inventory, not an executable rule list.  Only the two entries
 * marked adopted_existing_executable have an existing semantic-result
 * contract.  Every other entry is deliberately kept outside execution until
 * its structural prerequisite, source-defined output, and stop conditions
 * close without importing another lineage or modern practice.
 */
export const SAJU_ZIPING_SEMANTIC_RULE_INVENTORY = Object.freeze([
  zipingSemanticInventoryEntry({
    inventoryId: 'inventory.ziping.p7-yin-month-exposure-change.v0',
    status: 'adopted_existing_executable',
    contractRuleId: 'rule.ziping.yin-month-exposure-change.v0',
    locatorIds: ['page.local.ziping.p7-yongshin-continuation'],
    applicability: ['寅月', 'four supplied visible-stem positions', 'no supplied visible 甲', 'exactly one supplied visible 丙'],
    requiredStructuralResult: {
      ruleIds: ['rule.ziping.yin-month-exposure-contrast.v0'],
      fields: ['sourceCondition', 'absentVisibleStem', 'exposedVisibleStem', 'exposedPositions'],
      closure: 'closed_in_existing_contract',
    },
    semanticRoleResult: {
      sourceDefinedRole: '同知得以作主',
      outputShape: ['source-local selection-change clause'],
      scope: '寅月 exact contrast only',
    },
    exceptions: ['duplicate visible 丙 is not closed', 'no global 用神 priority'],
    sourceObservation: 'p.7 places 不透甲而透丙 inside the local 用神变化 discussion and supplies the following source clause.',
  }),
  zipingSemanticInventoryEntry({
    inventoryId: 'inventory.ziping.p10-chen-exposure-role.v0',
    status: 'adopted_existing_executable',
    contractRuleId: 'rule.ziping.chen-exposure-use-role.v0',
    locatorIds: ['ziping-p10-chen-exposed-stem-definition'],
    applicability: ['甲日主', '辰月', 'supplied 辰 hidden-stem list contains 戊、癸、乙', 'exact four-pillar visible-stem frame'],
    requiredStructuralResult: {
      ruleIds: ['rule.ziping.chen-exposure-inventory.v0'],
      fields: ['namedExposureMatches', 'multiplicity'],
      closure: 'closed_in_existing_contract',
    },
    semanticRoleResult: {
      sourceDefinedRole: '戊→偏财、癸→正印、乙→月劫',
      outputShape: ['source role-label inventory', 'single/multiple named exposure'],
      scope: '甲生辰月 named targets only',
    },
    exceptions: ['other stems, day masters, or month branches are not included', 'no 會支/格局 extension'],
    sourceObservation: 'p.10 asks 何谓透干 and names three 甲生辰月 exposure targets with role labels, then distinguishes one and multiple named exposures.',
  }),
  zipingSemanticInventoryEntry({
    inventoryId: 'inventory.ziping.p3-root-cycle-qualification.v0',
    status: 'unresolved',
    locatorIds: ['ziping-p3-yang-yin-root-cycle-and-tomb-exception'],
    applicability: ['a supplied stem/branch frame', 'source-local life-cycle or tomb vocabulary'],
    requiredStructuralResult: {
      ruleIds: [],
      fields: ['complete source-local stem-to-branch state map', 'yin/yang exception handling'],
      closure: 'missing_complete_state_map',
    },
    semanticRoleResult: {
      sourceDefinedRole: '有根/无用 and life-cycle qualification',
      outputShape: ['bounded source qualification only'],
      scope: 'not a strength or weakness result',
    },
    exceptions: ['p.3 does not print a complete all-stem/all-branch table', '阴长生/墓例 precedence is not closed'],
    sourceObservation: 'p.3 defines life-cycle vocabulary and bounded yang/yin and tomb qualifications but does not close a complete input-to-output map.',
  }),
  zipingSemanticInventoryEntry({
    inventoryId: 'inventory.ziping.p3-stem-combination-role-change.v0',
    status: 'context_bound_candidate',
    locatorIds: ['ziping-p3-stem-combination-semantic-context'],
    applicability: ['visible stem combination is supplied', 'the source role named as 用 is already bound'],
    requiredStructuralResult: {
      ruleIds: [],
      fields: ['visible stem pair', 'source role binding', 'combination direction'],
      closure: 'missing_source_use_role_binder',
    },
    semanticRoleResult: {
      sourceDefinedRole: '合可使已命名 官/印/财/食 role cease to be the same role',
      outputShape: ['source role qualification such as 非其官/非其印/非其财'],
      scope: 'named p.3 examples only',
    },
    exceptions: ['role change is conditional on the prior 用 role', '合化 and non-use statements are not a universal stem-pair table'],
    sourceObservation: 'p.3 gives explicit combination examples in which a previously named role is changed or rendered unavailable by another visible stem.',
  }),
  zipingSemanticInventoryEntry({
    inventoryId: 'inventory.ziping.p4-stem-combination-nonmerge.v0',
    status: 'context_bound_candidate',
    locatorIds: ['ziping-p4-stem-combination-nonmerge'],
    applicability: ['a supplied stem pair', 'position/distance information', 'source-defined combination context'],
    requiredStructuralResult: {
      ruleIds: [],
      fields: ['stem positions', 'pair separation', '合/合化 state'],
      closure: 'missing_source_precedence_and_distance_contract',
    },
    semanticRoleResult: {
      sourceDefinedRole: '合而不合/合而不化/合而无伤 qualification',
      outputShape: ['combination efficacy qualification'],
      scope: 'p.4 examples only',
    },
    exceptions: ['the source gives spacing and distance examples but no complete precedence table', 'do not infer a universal distance threshold'],
    sourceObservation: 'p.4 distinguishes combinations by separation, distance, and whether they act or transform, with examples rather than a complete predicate.',
  }),
  zipingSemanticInventoryEntry({
    inventoryId: 'inventory.ziping.p5-branch-relation-resolution.v0',
    status: 'unresolved',
    locatorIds: ['ziping-p5-branch-relations-definition-and-examples'],
    applicability: ['supplied branch relation inventory', 'source-defined use/pattern context where the relation is evaluated'],
    requiredStructuralResult: {
      ruleIds: ['rule.ziping.branch-relation-inventory.v0'],
      fields: ['relation name', 'branches', 'positions', 'source relation scope'],
      closure: 'relation_inventory_exists_but_resolution_priority_is_missing',
    },
    semanticRoleResult: {
      sourceDefinedRole: '刑冲会合解法 / 可解不可解 case',
      outputShape: ['source relation-resolution qualification'],
      scope: 'no relation cancellation or valence ranking',
    },
    exceptions: ['simultaneous relations must remain present', 'p.5 examples do not define a complete precedence or cancellation rule'],
    sourceObservation: 'p.5 defines and exemplifies 刑、冲、会、合 and asks when a relation can or cannot be解; the supplied relation inventory alone does not close that judgment.',
  }),
  zipingSemanticInventoryEntry({
    inventoryId: 'inventory.ziping.p7-use-change-other-cases.v0',
    status: 'context_bound_candidate',
    locatorIds: ['page.local.ziping.p7-yongshin-continuation'],
    applicability: ['用神 is source-bound', 'one of the page-specific change conditions is supplied'],
    requiredStructuralResult: {
      ruleIds: [],
      fields: ['source use role', 'case-specific relation condition'],
      closure: 'p7_has_multiple_case_clauses_without_global_precedence',
    },
    semanticRoleResult: {
      sourceDefinedRole: '用神变化 case clause',
      outputShape: ['source-local change qualification'],
      scope: 'separate from the adopted 不透甲而透丙 lane',
    },
    exceptions: ['do not merge neighboring p.7 cases', 'only the exact single-丙 clause is currently executable'],
    sourceObservation: 'p.7 continues with multiple 用神变化 examples; the local text does not provide a global selection/change priority.',
  }),
  zipingSemanticInventoryEntry({
    inventoryId: 'inventory.ziping.p6-yongshen-selection.v0',
    status: 'unresolved',
    locatorIds: ['page.local.ziping.p6-yongshin'],
    applicability: ['month-command and day-master facts are supplied'],
    requiredStructuralResult: {
      ruleIds: [],
      fields: ['source-defined month-command role', 'selection precedence among candidates'],
      closure: 'missing_use_selection_resolver',
    },
    semanticRoleResult: {
      sourceDefinedRole: '用神专求月令',
      outputShape: ['selected source use role'],
      scope: 'not executable without a complete selection procedure',
    },
    exceptions: ['p.6 supplies a governing statement but not a complete all-case selection algorithm'],
    sourceObservation: 'p.6 makes month-command the starting point for 用神 but immediately relies on case-specific conditions.',
  }),
  zipingSemanticInventoryEntry({
    inventoryId: 'inventory.ziping.p6-use-success-rescue.v0',
    status: 'context_bound_candidate',
    locatorIds: ['ziping-p6-yongshen-success-rescue'],
    applicability: ['a selected 用神 is supplied', 'supporting/opposing visible and hidden relations are supplied'],
    requiredStructuralResult: {
      ruleIds: [],
      fields: ['selected use role', 'support/rescue relation inventory'],
      closure: 'depends_on_unresolved_use_selection',
    },
    semanticRoleResult: {
      sourceDefinedRole: '成格/败格/救应 case labels',
      outputShape: ['source case classification'],
      scope: 'case clause only; no personal outcome',
    },
    exceptions: ['source lists multiple role-specific cases', 'no cross-case precedence is supplied'],
    sourceObservation: 'p.6 enumerates 官、财、印、食 and related rescue/failure cases after the month-command statement.',
  }),
  zipingSemanticInventoryEntry({
    inventoryId: 'inventory.ziping.p8-pure-mixed-use.v0',
    status: 'context_bound_candidate',
    locatorIds: ['ziping-p8-yongshen-pure-mixed'],
    applicability: ['selected 用神 and all mutually acting roles are supplied'],
    requiredStructuralResult: {
      ruleIds: [],
      fields: ['selected use role set', 'mutual support/opposition graph'],
      closure: 'depends_on_unresolved_use_selection',
    },
    semanticRoleResult: {
      sourceDefinedRole: '纯/杂',
      outputShape: ['source purity/mixedness label'],
      scope: 'source role-set label only',
    },
    exceptions: ['互用而两相得 and 互用而两不相谋 are examples, not a complete graph resolver'],
    sourceObservation: 'p.8 defines 纯 and 杂 through mutual role support or non-cooperation after 用神变化.',
  }),
  zipingSemanticInventoryEntry({
    inventoryId: 'inventory.ziping.p8-pattern-level.v0',
    status: 'context_bound_candidate',
    locatorIds: ['ziping-p8-yongshen-pattern-level'],
    applicability: ['用神 and 格局 are already source-bound', '有情/有力 relation inputs are supplied'],
    requiredStructuralResult: {
      ruleIds: [],
      fields: ['source pattern identity', '有情/有力 relation inventory'],
      closure: 'depends_on_unresolved_pattern_and_sentiment_binding',
    },
    semanticRoleResult: {
      sourceDefinedRole: '格局高低',
      outputShape: ['source pattern-level qualification'],
      scope: 'no personal or fortune meaning',
    },
    exceptions: ['p.8 uses multiple examples and no total ordering across them'],
    sourceObservation: 'p.8 ties pattern level to 有情/有力 and named role combinations, but does not provide a closed ranking function.',
  }),
  zipingSemanticInventoryEntry({
    inventoryId: 'inventory.ziping.p9-success-failure-transition.v0',
    status: 'unresolved',
    locatorIds: ['ziping-p9-yongshen-success-failure-transition'],
    applicability: ['用神/格局 state is supplied', 'change relation and temporal/context condition are supplied'],
    requiredStructuralResult: {
      ruleIds: [],
      fields: ['prior state', 'new relation', 'transition condition'],
      closure: 'missing_transition_precedence',
    },
    semanticRoleResult: {
      sourceDefinedRole: '因成得败/因败得成',
      outputShape: ['source transition label'],
      scope: 'no general transition automaton',
    },
    exceptions: ['the page gives examples but not an exhaustive transition order'],
    sourceObservation: 'p.9 explicitly discusses success-to-failure and failure-to-success changes, so simultaneous conditions cannot be ranked by inference.',
  }),
  zipingSemanticInventoryEntry({
    inventoryId: 'inventory.ziping.p9-season-use-result.v0',
    status: 'context_bound_candidate',
    locatorIds: ['ziping-p9-yongshen-season-result'],
    applicability: ['用神 is source-bound', 'season/context and supporting roles are supplied'],
    requiredStructuralResult: {
      ruleIds: [],
      fields: ['season context', 'use role', 'support/temperature relation'],
      closure: 'missing_source_season_precedence',
    },
    semanticRoleResult: {
      sourceDefinedRole: '配气候得失',
      outputShape: ['source seasonal qualification'],
      scope: 'not a general seasonal preference table',
    },
    exceptions: ['p.9 conditions are case-specific and include multiple factors'],
    sourceObservation: 'p.9 requires 用神 and climate/season to be consulted together, but does not close a universal order among those conditions.',
  }),
  zipingSemanticInventoryEntry({
    inventoryId: 'inventory.ziping.p10-assistant-role.v0',
    status: 'context_bound_candidate',
    locatorIds: ['page.local.ziping.p10-xiangshen'],
    applicability: ['用神 is already selected', 'a supporting role is explicitly supplied'],
    requiredStructuralResult: {
      ruleIds: [],
      fields: ['selected use role', 'source support relation'],
      closure: 'depends_on_unresolved_use_selection',
    },
    semanticRoleResult: {
      sourceDefinedRole: '相神/辅者',
      outputShape: ['source assistant-role mapping'],
      scope: 'not a general support or beneficialness label',
    },
    exceptions: ['p.10 gives role examples whose use identity must already be bound'],
    sourceObservation: 'p.10 describes the assistant as the role that supports the already selected 用神.',
  }),
  zipingSemanticInventoryEntry({
    inventoryId: 'inventory.ziping.p11-exposure-branch-sentiment-composition.v0',
    status: 'unresolved',
    locatorIds: ['ziping-p11-exposed-stem-and-branch-context'],
    applicability: ['透干 and 會支 are source-bound', 'multiple exposure and pattern context are supplied'],
    requiredStructuralResult: {
      ruleIds: ['rule.ziping.chen-exposure-inventory.v0', 'rule.ziping.branch-relation-inventory.v0'],
      fields: ['exposure role inventory', 'source-defined 會支 binding', 'pattern context'],
      closure: 'missing_source_binding_priority_and_transition_rule',
    },
    semanticRoleResult: {
      sourceDefinedRole: '有情/無情 and transition examples',
      outputShape: ['coexisting source relation states'],
      scope: 'no static sentiment or pattern result',
    },
    exceptions: ['p.11 explicitly gives 有情而卒成无情 and 无情而终有情', 'do not choose a winner'],
    compositionState: 'unresolved_composition_frontier',
    sourceObservation: 'p.11 defines 有情/無情 and then composes 透干, 會支, and pattern cases with reversible transitions.',
  }),
  zipingSemanticInventoryEntry({
    inventoryId: 'inventory.ziping.p12-good-bad-pattern.v0',
    status: 'context_bound_candidate',
    locatorIds: ['ziping-p12-good-symbol-break-pattern', 'ziping-p12-bad-symbol-make-pattern'],
    applicability: ['four named role classes are source-bound', 'pattern state and relation conditions are supplied'],
    requiredStructuralResult: {
      ruleIds: [],
      fields: ['source role class', 'pattern state', 'break/make relation'],
      closure: 'depends_on_unresolved_pattern_binding',
    },
    semanticRoleResult: {
      sourceDefinedRole: '四吉神破格 / 四凶神成格',
      outputShape: ['source pattern-change qualification'],
      scope: 'no good/bad personal outcome',
    },
    exceptions: ['the two chapters are not a single universal role precedence rule'],
    sourceObservation: 'p.12 gives separate favorable/adverse role cases that affect pattern state under additional conditions.',
  }),
  zipingSemanticInventoryEntry({
    inventoryId: 'inventory.ziping.p12-generation-control-order.v0',
    status: 'unresolved',
    locatorIds: ['ziping-p12-generation-control-order'],
    applicability: ['ordered generation/control chain is supplied', 'source use/pattern context is supplied'],
    requiredStructuralResult: {
      ruleIds: [],
      fields: ['ordered relation chain', 'source context'],
      closure: 'output_is_explicitly_good_bad_and_priority_is_not_closed',
    },
    semanticRoleResult: {
      sourceDefinedRole: '先后分吉凶',
      outputShape: ['source 吉凶 classification'],
      scope: 'outside current semantic boundary',
    },
    exceptions: ['do not materialize 吉凶 from a relation inventory'],
    sourceObservation: 'p.12 states that generation/control order divides 吉凶, but the required source context and full precedence are not closed.',
  }),
  zipingSemanticInventoryEntry({
    inventoryId: 'inventory.ziping.p13-external-pattern-use.v0',
    status: 'context_bound_candidate',
    locatorIds: ['ziping-p13-external-pattern-use'],
    applicability: ['month-command and source pattern conditions are supplied'],
    requiredStructuralResult: {
      ruleIds: [],
      fields: ['month-command role', 'external-pattern condition'],
      closure: 'depends_on_unresolved_pattern_and_use_selection',
    },
    semanticRoleResult: {
      sourceDefinedRole: '外格用舍',
      outputShape: ['source inclusion/exclusion qualification'],
      scope: 'no general external-pattern resolver',
    },
    exceptions: ['p.13 distinguishes when month command has or lacks use; no complete algorithm'],
    sourceObservation: 'p.13 discusses when an external pattern may be used or abandoned in relation to month-command conditions.',
  }),
  zipingSemanticInventoryEntry({
    inventoryId: 'inventory.ziping.p14-six-relations.v0',
    status: 'unsupported',
    locatorIds: ['ziping-p14-six-relations-use'],
    applicability: ['palace and six-relation mapping would be required'],
    requiredStructuralResult: {
      ruleIds: [],
      fields: ['palace mapping', 'six-relation mapping'],
      closure: 'outside_public_semantic_boundary',
    },
    semanticRoleResult: {
      sourceDefinedRole: '宮分用神配六親',
      outputShape: ['personal relation mapping'],
      scope: 'not admitted to the public semantic grammar',
    },
    exceptions: ['do not infer personal relations from Base symbols'],
    sourceObservation: 'p.14 enters palace and six-relation claims, which are outside the current source-bounded public semantic scope.',
  }),
  zipingSemanticInventoryEntry({
    inventoryId: 'inventory.ziping.p14-wife-children.v0',
    status: 'unsupported',
    locatorIds: ['ziping-p14-wife-children'],
    applicability: ['spouse/children semantic mapping would be required'],
    requiredStructuralResult: {
      ruleIds: [],
      fields: ['personal relation inputs'],
      closure: 'outside_public_semantic_boundary',
    },
    semanticRoleResult: {
      sourceDefinedRole: '妻子/子女 claims',
      outputShape: ['personal-outcome result'],
      scope: 'not admitted to the public semantic grammar',
    },
    exceptions: ['no personal outcome or relationship claim is materialized'],
    sourceObservation: 'p.14 contains spouse/children discussion; it is deliberately excluded rather than generalized.',
  }),
  zipingSemanticInventoryEntry({
    inventoryId: 'inventory.ziping.p15-timing-pairing.v0',
    status: 'unresolved',
    locatorIds: ['page.local.ziping.p15-xingyun'],
    applicability: ['natal chart and fortune-period facts are exact', '用神/喜忌 context is source-bound'],
    requiredStructuralResult: {
      ruleIds: [],
      fields: ['natal relation frame', 'fortune-period relation', 'source use/preference context'],
      closure: 'depends_on_unresolved_timing_and_use_selection',
    },
    semanticRoleResult: {
      sourceDefinedRole: '命运配合',
      outputShape: ['source fortune-period qualification'],
      scope: 'no prediction or 吉凶 output',
    },
    exceptions: ['section statement does not close direction/start/conversion or semantic priority'],
    sourceObservation: 'p.15 states that fortune and natal chart are read together, then gives role-specific examples.',
  }),
  zipingSemanticInventoryEntry({
    inventoryId: 'inventory.ziping.p16-timing-change-pattern.v0',
    status: 'context_bound_candidate',
    locatorIds: ['ziping-p16-yun-change-pattern'],
    applicability: ['fortune-period input is exact', 'pattern/use state is source-bound'],
    requiredStructuralResult: {
      ruleIds: [],
      fields: ['fortune-period relation', 'pattern state before/after'],
      closure: 'depends_on_unresolved_timing_and_pattern_binding',
    },
    semanticRoleResult: {
      sourceDefinedRole: '成格/变格 in fortune period',
      outputShape: ['source pattern transition'],
      scope: 'no life-event or fortune result',
    },
    exceptions: ['examples do not provide a complete transition priority'],
    sourceObservation: 'p.16 discusses fortune-period changes that may preserve or change a source pattern.',
  }),
  zipingSemanticInventoryEntry({
    inventoryId: 'inventory.ziping.p16-stem-branch-preference.v0',
    status: 'unresolved',
    locatorIds: ['ziping-p16-stem-branch-preference'],
    applicability: ['stem/branch relation and source preference context are supplied'],
    requiredStructuralResult: {
      ruleIds: [],
      fields: ['stem relation inventory', 'branch relation inventory', 'source preference context'],
      closure: 'preference_output_is_not_source_closed',
    },
    semanticRoleResult: {
      sourceDefinedRole: '喜忌干支有别',
      outputShape: ['source distinction'],
      scope: 'not a universal preference classifier',
    },
    exceptions: ['do not translate 喜忌 into strength, personality, or fortune'],
    sourceObservation: 'p.16 distinguishes stem and branch roles in preference language without closing a reusable resolver.',
  }),
  zipingSemanticInventoryEntry({
    inventoryId: 'inventory.ziping.p17-anti-rigid-pattern.v0',
    status: 'unresolved',
    locatorIds: ['ziping-p17-not-bind-pattern'],
    applicability: ['a candidate pattern label and counterexample are supplied'],
    requiredStructuralResult: {
      ruleIds: [],
      fields: ['candidate pattern', 'counter-condition'],
      closure: 'source_is_cautionary_not_algorithmic',
    },
    semanticRoleResult: {
      sourceDefinedRole: 'do not force a pattern label',
      outputShape: ['stop/deferral instruction'],
      scope: 'cannot be converted into a positive classifier',
    },
    exceptions: ['preserve ambiguity rather than selecting a pattern'],
    sourceObservation: 'p.17 warns against拘泥格局 and therefore supports a fail-closed stop, not a new positive semantic rule.',
  }),
  zipingSemanticInventoryEntry({
    inventoryId: 'inventory.ziping.p17-regular-officer.v0',
    status: 'context_bound_candidate',
    locatorIds: ['ziping-p17-regular-officer'],
    applicability: ['官 role is source-bound', 'support/opposition and pattern context are supplied'],
    requiredStructuralResult: {
      ruleIds: [],
      fields: ['官 role', 'support/opposition relations', 'source pattern context'],
      closure: 'depends_on_unresolved_use_selection',
    },
    semanticRoleResult: {
      sourceDefinedRole: '正官 case qualification',
      outputShape: ['source officer-pattern condition'],
      scope: 'no personal or fortune conclusion',
    },
    exceptions: ['the chapter uses multiple conditional cases and does not state a total order'],
    sourceObservation: 'p.17 introduces regular-officer cases through role, support, and obstruction conditions.',
  }),
  zipingSemanticInventoryEntry({
    inventoryId: 'inventory.ziping.p18-seven-killings.v0',
    status: 'context_bound_candidate',
    locatorIds: ['ziping-p18-seven-killings'],
    applicability: ['七杀 role is source-bound', '制化/support and pattern context are supplied'],
    requiredStructuralResult: {
      ruleIds: [],
      fields: ['七杀 role', '制化 relation', 'source pattern context'],
      closure: 'depends_on_unresolved_use_selection',
    },
    semanticRoleResult: {
      sourceDefinedRole: '七杀 case qualification',
      outputShape: ['source killing-role condition'],
      scope: 'no 吉凶/personal result',
    },
    exceptions: ['do not import a modern 七杀 meaning table'],
    sourceObservation: 'p.18 supplies named 七杀 control/化 cases rather than a complete independent predicate.',
  }),
  zipingSemanticInventoryEntry({
    inventoryId: 'inventory.ziping.p18-injury-officer.v0',
    status: 'context_bound_candidate',
    locatorIds: ['ziping-p18-injury-officer'],
    applicability: ['伤官 role is source-bound', '印/财/官 interactions and pattern context are supplied'],
    requiredStructuralResult: {
      ruleIds: [],
      fields: ['伤官 role', 'relation inventory', 'source pattern context'],
      closure: 'depends_on_unresolved_use_selection',
    },
    semanticRoleResult: {
      sourceDefinedRole: '伤官 case qualification',
      outputShape: ['source injury-officer condition'],
      scope: 'no personal or fortune result',
    },
    exceptions: ['do not collapse multiple cases into one role meaning'],
    sourceObservation: 'p.18–19 treats 伤官 through several relation-specific cases and exceptions.',
  }),
  zipingSemanticInventoryEntry({
    inventoryId: 'inventory.ziping.p19-food-god.v0',
    status: 'context_bound_candidate',
    locatorIds: ['ziping-p19-food-god'],
    applicability: ['食神 role is source-bound', '生财/制化 and pattern context are supplied'],
    requiredStructuralResult: {
      ruleIds: [],
      fields: ['食神 role', 'relation inventory', 'source pattern context'],
      closure: 'depends_on_unresolved_use_selection',
    },
    semanticRoleResult: {
      sourceDefinedRole: '食神 case qualification',
      outputShape: ['source food-god condition'],
      scope: 'no personal or fortune result',
    },
    exceptions: ['枭神夺食 is a named case, not a general conflict resolver'],
    sourceObservation: 'p.19 lists 食神 relation cases including生财 and opposing role conditions.',
  }),
  zipingSemanticInventoryEntry({
    inventoryId: 'inventory.ziping.p19-seal.v0',
    status: 'context_bound_candidate',
    locatorIds: ['ziping-p19-seal'],
    applicability: ['印绶 role is source-bound', '财/官/support context is supplied'],
    requiredStructuralResult: {
      ruleIds: [],
      fields: ['印绶 role', 'relation inventory', 'source pattern context'],
      closure: 'depends_on_unresolved_use_selection',
    },
    semanticRoleResult: {
      sourceDefinedRole: '印绶 case qualification',
      outputShape: ['source seal condition'],
      scope: 'no personal or fortune result',
    },
    exceptions: ['named cases do not establish a universal 印 role priority'],
    sourceObservation: 'p.19–20 gives relation-specific 印绶 cases rather than a closed role-selection procedure.',
  }),
  zipingSemanticInventoryEntry({
    inventoryId: 'inventory.ziping.p20-wealth.v0',
    status: 'context_bound_candidate',
    locatorIds: ['ziping-p20-wealth'],
    applicability: ['财 role is source-bound', '生官/制化 and pattern context are supplied'],
    requiredStructuralResult: {
      ruleIds: [],
      fields: ['财 role', 'relation inventory', 'source pattern context'],
      closure: 'depends_on_unresolved_use_selection',
    },
    semanticRoleResult: {
      sourceDefinedRole: '财 case qualification',
      outputShape: ['source wealth condition'],
      scope: 'no material or personal outcome',
    },
    exceptions: ['do not translate 财 labels into financial prediction'],
    sourceObservation: 'p.20 treats 财 through source-specific relation and pattern cases.',
  }),
  zipingSemanticInventoryEntry({
    inventoryId: 'inventory.ziping.p21-partial-wealth-rob.v0',
    status: 'context_bound_candidate',
    locatorIds: ['ziping-p21-partial-wealth', 'ziping-p21-rob-wealth'],
    applicability: ['偏财 or 劫财 role is source-bound', 'relation and pattern context are supplied'],
    requiredStructuralResult: {
      ruleIds: [],
      fields: ['role-specific relation inventory', 'source pattern context'],
      closure: 'depends_on_unresolved_use_selection',
    },
    semanticRoleResult: {
      sourceDefinedRole: '偏财/劫财 case qualification',
      outputShape: ['source role-specific condition'],
      scope: 'no personal or financial outcome',
    },
    exceptions: ['separate chapters are not merged into one rule'],
    sourceObservation: 'p.21 separates 偏财 and 劫财 case discussions with distinct conditions.',
  }),
  zipingSemanticInventoryEntry({
    inventoryId: 'inventory.ziping.p22-yang-blade-building-wealth.v0',
    status: 'context_bound_candidate',
    locatorIds: ['ziping-p22-yang-blade', 'ziping-p22-building-wealth'],
    applicability: ['阳刃 or 建禄月劫 role is source-bound', 'source pattern and relation context are supplied'],
    requiredStructuralResult: {
      ruleIds: [],
      fields: ['role-specific branch/stem relations', 'source pattern context'],
      closure: 'depends_on_unresolved_pattern_binding',
    },
    semanticRoleResult: {
      sourceDefinedRole: '阳刃/建禄月劫 case qualification',
      outputShape: ['source role-specific condition'],
      scope: 'no strength, fortune, or personal result',
    },
    exceptions: ['role-specific chapters remain separate lineage-bounded surfaces'],
    sourceObservation: 'p.22 treats 阳刃 and 建禄月劫 through separate conditional examples.',
  }),
  zipingSemanticInventoryEntry({
    inventoryId: 'inventory.ziping.p23-misc-metal-spirit.v0',
    status: 'context_bound_candidate',
    locatorIds: ['ziping-p23-misc-pattern', 'ziping-p23-metal-spirit'],
    applicability: ['named miscellaneous pattern is source-bound', 'required pattern relations are supplied'],
    requiredStructuralResult: {
      ruleIds: [],
      fields: ['source pattern condition', 'relation inventory'],
      closure: 'missing_complete_misc_pattern_predicates',
    },
    semanticRoleResult: {
      sourceDefinedRole: '杂格/金神 case qualification',
      outputShape: ['source pattern condition'],
      scope: 'no general miscellaneous-pattern resolver',
    },
    exceptions: ['do not combine separate named pattern chapters'],
    sourceObservation: 'p.23 gives distinct 杂格 and 金神 examples, each with additional context.',
  }),
  zipingSemanticInventoryEntry({
    inventoryId: 'inventory.ziping.p24-injury-killing-timing.v0',
    status: 'context_bound_candidate',
    locatorIds: ['ziping-p24-injury-timing', 'ziping-p24-killing'],
    applicability: ['fortune-period frame is exact', '伤官/杀 context is source-bound'],
    requiredStructuralResult: {
      ruleIds: [],
      fields: ['fortune-period relation', 'role-specific pattern state'],
      closure: 'depends_on_unresolved_timing_and_use_selection',
    },
    semanticRoleResult: {
      sourceDefinedRole: '伤官取运/论杀 case qualification',
      outputShape: ['source timing condition'],
      scope: 'no event or fortune prediction',
    },
    exceptions: ['do not infer timing semantics from the section heading alone'],
    sourceObservation: 'p.24 applies role-specific conditions to fortune-period examples but does not close a general timing semantic.',
  }),
  zipingSemanticInventoryEntry({
    inventoryId: 'inventory.ziping.p25-officer-building-wealth-timing.v0',
    status: 'context_bound_candidate',
    locatorIds: ['ziping-p25-officer', 'ziping-p25-building-wealth-timing'],
    applicability: ['fortune-period frame is exact', '官 or 建禄月劫 context is source-bound'],
    requiredStructuralResult: {
      ruleIds: [],
      fields: ['fortune-period relation', 'role-specific pattern state'],
      closure: 'depends_on_unresolved_timing_and_pattern_binding',
    },
    semanticRoleResult: {
      sourceDefinedRole: '官/建禄月劫取运 case qualification',
      outputShape: ['source timing condition'],
      scope: 'no prediction or 吉凶 output',
    },
    exceptions: ['separate role cases must not be merged'],
    sourceObservation: 'p.25 continues role-specific fortune-period cases for 官 and 建禄月劫.',
  }),
  zipingSemanticInventoryEntry({
    inventoryId: 'inventory.ziping.p26-p27-timing-misc.v0',
    status: 'context_bound_candidate',
    locatorIds: ['ziping-p26-building-wealth-timing', 'ziping-p26-misc-pattern', 'ziping-p27-misc-pattern-continuation'],
    applicability: ['fortune-period or miscellaneous-pattern frame is exact', 'source role/pattern context is supplied'],
    requiredStructuralResult: {
      ruleIds: [],
      fields: ['fortune-period relation', 'source pattern condition'],
      closure: 'depends_on_unresolved_timing_and_pattern_binding',
    },
    semanticRoleResult: {
      sourceDefinedRole: '建禄月劫取运/杂格 case qualification',
      outputShape: ['source timing/pattern condition'],
      scope: 'no personal or predictive result',
    },
    exceptions: ['p.26–27 examples do not define a universal miscellaneous rule'],
    sourceObservation: 'p.26–27 close the local work with 建禄月劫取运 and 杂格 examples whose case context remains necessary.',
  }),
])

export const SAJU_ZIPING_CANDIDATE_CLOSABILITY = Object.freeze({
  schema: 'saju-ziping-candidate-closability-v0',
  candidateCount: SAJU_ZIPING_SEMANTIC_RULE_INVENTORY.filter(item => item.status === 'context_bound_candidate').length,
  nearCandidateIds: Object.freeze([
    'inventory.ziping.p4-stem-combination-nonmerge.v0',
  ]),
  frozenV0CandidateIds: Object.freeze(
    SAJU_ZIPING_SEMANTIC_RULE_INVENTORY
      .filter(item => item.status === 'context_bound_candidate' && item.inventoryId !== 'inventory.ziping.p4-stem-combination-nonmerge.v0')
      .map(item => item.inventoryId),
  ),
  entries: Object.freeze(
    SAJU_ZIPING_SEMANTIC_RULE_INVENTORY
      .filter(item => item.status === 'context_bound_candidate')
      .map(item => Object.freeze({
        candidateId: item.inventoryId,
        locatorIds: [...item.locatorIds],
        closability: item.inventoryId === 'inventory.ziping.p4-stem-combination-nonmerge.v0' ? 'near_candidate' : 'v0_frozen',
        requiredAdditionalCheck: item.inventoryId === 'inventory.ziping.p4-stem-combination-nonmerge.v0'
          ? '원문이 직접 규정한 해당 stem pair의 separation/distance와 合/合化 우선 조건 한 묶음'
          : null,
        reason: item.inventoryId === 'inventory.ziping.p4-stem-combination-nonmerge.v0'
          ? '현재 stemRelations가 pair/position을 공급하지만 source-defined distance/precedence 한정이 닫히기 전에는 일반 합·합화 classifier를 만들 수 없다.'
          : `v0 고정: ${item.requiredStructuralResult.closure}. 현재 Base/structural result만으로는 source use/pattern/운 문맥 또는 복합 우선관계를 대체할 수 없다.`,
        promotionBoundary: 'modern practice, another lineage, free synthesis, and personal/fortune meaning remain forbidden',
      })),
  ),
})

export const SAJU_YUANHAI_INVENTORY_STATUSES = Object.freeze([
  'adopted_structural_rule',
  'adopted_semantic_rule',
  'context_bound_candidate',
  'unresolved',
  'unsupported',
])

const yuanhaiInventoryEntry = value => ({
  inventorySchema: 'saju-yuanhai-source-rule-inventory-v0',
  work: WORKS.yuanhai,
  lineage: 'yuanhai_local_export',
  sourceIds: ['saju-source-yuanhai-ziping'],
  locatorIds: [],
  requiredStructuralResult: {
    ruleIds: [],
    fields: [],
    closure: 'not_closed',
  },
  sourceDefinedOutput: {
    kind: 'not_materialized',
    role: null,
    outputShape: [],
    scope: 'source_bounded_only',
  },
  applicability: [],
  exceptions: [],
  forbiddenExtensions: [...FORBIDDEN_EXTENSIONS],
  compositionState: 'coexistence_only_until_source_priority_is_closed',
  sourceObservation: '',
  ...value,
})

/**
 * Whole local-work inventory for 淵海子平.  The page band is reviewed as a
 * source surface, but only direct role/order frames with a closed output are
 * executable.  Outcome, family, gender, health, temperament, pattern, and
 * timing prose remains candidate, unresolved, or unsupported.
 */
export const SAJU_YUANHAI_RULE_INVENTORY = Object.freeze([
  yuanhaiInventoryEntry({
    inventoryId: 'inventory.yuanhai.p2-foundation-labels.v0',
    status: 'context_bound_candidate',
    locatorIds: ['yuanhai-p2-foundation'],
    applicability: ['visible stem and day-master context are supplied'],
    requiredStructuralResult: {
      ruleIds: [],
      fields: ['visible stem polarity', 'named role-label relation'],
      closure: 'semantic_role_context_and_exception_scope_not_closed',
    },
    sourceDefinedOutput: {
      kind: 'semantic_candidate',
      role: 'stem-to-role labels in the opening surface',
      outputShape: ['source label only'],
      scope: 'p.2 opening examples; not a universal personal-meaning table',
    },
    exceptions: ['the opening labels are adjacent to personal/family outcome prose', 'no complete role precedence is supplied'],
    sourceObservation: 'p.2 begins with polarity and named stem relations, but the following lines immediately enter outcome/family language.',
  }),
  yuanhaiInventoryEntry({
    inventoryId: 'inventory.yuanhai.p4-hidden-stem-labels.v0',
    status: 'adopted_structural_rule',
    contractRuleId: 'rule.yuanhai.hidden-stem-ten-god-label-inventory.v0',
    locatorIds: ['yuanhai-p4-hidden-stems-and-ten-god-labels'],
    applicability: ['supplied pillar hidden-stems and visible ten-god labels are complete', 'timeAccuracy is exact'],
    requiredStructuralResult: {
      ruleIds: ['rule.yuanhai.hidden-stem-ten-god-label-inventory.v0'],
      fields: ['hiddenStemLabels', 'visibleTenGods'],
      closure: 'closed_in_existing_contract',
    },
    sourceDefinedOutput: {
      kind: 'structural',
      role: 'hidden/visible label inventory',
      outputShape: ['hidden stem and supplied ten-god label by pillar'],
      scope: 'label inventory only; no priority or personal meaning',
    },
    exceptions: ['do not turn seasonal lines into a service-day table', 'do not rank repeated labels'],
    sourceObservation: 'p.4 directly presents the 暗藏總訣 surface beside seasonal material; the adopted rule retains supplied labels only.',
  }),
  yuanhaiInventoryEntry({
    inventoryId: 'inventory.yuanhai.p5-hidden-stem-service-scope.v0',
    status: 'unresolved',
    locatorIds: ['yuanhai-p5-hidden-stem-song-and-generation-control'],
    applicability: ['a complete source-defined hidden-stem/service sequence would be supplied'],
    requiredStructuralResult: {
      ruleIds: [],
      fields: ['ordered hidden-stem sequence', 'seasonal service scope', 'priority'],
      closure: 'source_service_scope_and_complete_table_not_closed',
    },
    sourceDefinedOutput: {
      kind: 'not_materialized',
      role: 'hidden-stem/service vocabulary',
      outputShape: [],
      scope: 'no public result until the source procedure is complete',
    },
    exceptions: ['do not replace the source sequence with a modern hidden-stem weight table', 'do not merge with 三命通會 service-day examples'],
    sourceObservation: 'p.5 lists branch-hidden-stem material and five-phase relation prose, but does not close a complete executable service resolver.',
  }),
  yuanhaiInventoryEntry({
    inventoryId: 'inventory.yuanhai.p6-p7-role-frame.v0',
    status: 'adopted_structural_rule',
    contractRuleId: 'rule.yuanhai.day-anchor-month-command-frame.v0',
    locatorIds: ['yuanhai-p6-day-as-host', 'yuanhai-p7-month-command'],
    applicability: ['day-master and all four supplied pillars are present', 'timeAccuracy is exact'],
    requiredStructuralResult: {
      ruleIds: ['rule.yuanhai.day-anchor-month-command-frame.v0'],
      fields: ['sourceRoleFrame', 'orderedFactRefs'],
      closure: 'closed_in_existing_contract',
    },
    sourceDefinedOutput: {
      kind: 'structural',
      role: 'day-anchor and year/month/day/hour role frame',
      outputShape: ['anchor', 'ordered positions', 'month-command', 'auxiliary hour'],
      scope: 'role frame only; no life-domain or strength result',
    },
    exceptions: ['unknown or missing hour stops the complete four-role frame'],
    sourceObservation: 'p.6–7 directly state 日为主, 年为根, 月为提纲, 时为辅佐 and then continue into outcome prose.',
  }),
  yuanhaiInventoryEntry({
    inventoryId: 'inventory.yuanhai.p8-taisui-outcome.v0',
    status: 'unsupported',
    locatorIds: ['yuanhai-p8-taisui-annual-judgment'],
    applicability: ['annual relation and source fortune context would be required'],
    requiredStructuralResult: {
      ruleIds: [],
      fields: ['year/day relation', 'annual interaction priority'],
      closure: 'fortune-outcome_surface_outside_v0',
    },
    sourceDefinedOutput: {
      kind: 'unsupported_semantic',
      role: '太歲吉凶/征太歲 outcome',
      outputShape: [],
      scope: 'not part of the executable public grammar',
    },
    exceptions: ['no annual good/bad or event result is materialized'],
    sourceObservation: 'p.8 directly frames 太歲 and annual conflict in outcome terms.',
  }),
  yuanhaiInventoryEntry({
    inventoryId: 'inventory.yuanhai.p9-dayun-focus-lens.v0',
    status: 'adopted_structural_rule',
    contractRuleId: 'rule.yuanhai.dayun-branch-seun-stem-lens.v0',
    locatorIds: ['yuanhai-p9-dayun-focus-lens'],
    applicability: ['the frozen Base supplies an active 大運 branch and seUn/歲君 stem', 'timeAccuracy is exact'],
    requiredStructuralResult: {
      ruleIds: ['rule.yuanhai.dayun-branch-seun-stem-lens.v0'],
      fields: ['focusFrame', 'activeDayun', 'seUn', 'factRefs'],
      closure: 'closed_in_existing_contract',
    },
    sourceDefinedOutput: {
      kind: 'structural',
      role: '大運看支 / 歲君看干 focus lens',
      outputShape: ['dayun branch focus', 'seUn stem focus'],
      scope: 'lens over supplied timing FACTs; no timing calculation or outcome',
    },
    exceptions: ['direction, first-start date, age conversion, and outcome remain outside this rule'],
    sourceObservation: 'p.9 directly states 大运看支、岁君看干; the source phrase is adopted only as a role/focus frame.',
  }),
  yuanhaiInventoryEntry({
    inventoryId: 'inventory.yuanhai.p9-p10-timing-composition.v0',
    status: 'unresolved',
    locatorIds: ['page.local.yuanhai.p9-dayun-section', 'yuanhai-p8-taisui-annual-judgment'],
    applicability: ['direction, start-age, term-distance, transition, and source outcome conditions are all closed'],
    requiredStructuralResult: {
      ruleIds: [],
      fields: ['direction', 'start age', 'term-distance conversion', 'transition condition'],
      closure: 'exact_timing_and_outcome_procedure_not_closed',
    },
    sourceDefinedOutput: {
      kind: 'not_materialized',
      role: '大運/歲君 transition surface',
      outputShape: [],
      scope: 'section locator only',
    },
    exceptions: ['the focus lens above must not be expanded into timing recalculation', 'do not convert annual prose into prediction'],
    sourceObservation: 'p.9–10 continue from the focus phrase into transition and outcome clauses without a complete timing contract.',
  }),
  yuanhaiInventoryEntry({
    inventoryId: 'inventory.yuanhai.p11-p14-body-temperament.v0',
    status: 'unsupported',
    locatorIds: ['yuanhai-p11-disease', 'yuanhai-p13-temperament', 'yuanhai-p14-stem-body-poems'],
    applicability: ['body/temperament context would be required'],
    requiredStructuralResult: {
      ruleIds: [],
      fields: ['body correspondence', 'temperament correspondence'],
      closure: 'personal_semantic_surface_outside_v0',
    },
    sourceDefinedOutput: {
      kind: 'unsupported_semantic',
      role: 'disease, temperament, and stem-body meaning',
      outputShape: [],
      scope: 'not materialized',
    },
    exceptions: ['do not treat element/stem labels as personal traits or health claims'],
    sourceObservation: 'p.11–14 directly move from structural vocabulary into disease, temperament, and poetic personal descriptions.',
  }),
  yuanhaiInventoryEntry({
    inventoryId: 'inventory.yuanhai.p17-p35-role-chapters.v0',
    status: 'context_bound_candidate',
    locatorIds: ['yuanhai-p17-injury-officer', 'yuanhai-p24-regular-wealth', 'yuanhai-p28-regular-officer', 'yuanhai-p30-partial-officer', 'yuanhai-p35-seal'],
    applicability: ['role identity, pattern/use context, relation conditions, and source priority are supplied'],
    requiredStructuralResult: {
      ruleIds: [],
      fields: ['role identity', 'relation inventory', 'pattern/use context', 'priority'],
      closure: 'role_case_context_and_priority_missing',
    },
    sourceDefinedOutput: {
      kind: 'semantic_candidate',
      role: '伤官/财/官/偏官/印绶 case qualification',
      outputShape: ['source-local case label'],
      scope: 'chapter-specific; no general ten-god meaning table',
    },
    exceptions: ['do not merge role chapters or infer personal outcomes', 'do not use modern strength/格局 conventions to fill gaps'],
    sourceObservation: 'p.17–35 present role-specific conditions, examples, and outcomes, but no single cross-chapter resolver.',
  }),
  yuanhaiInventoryEntry({
    inventoryId: 'inventory.yuanhai.p48-p66-family-gender.v0',
    status: 'unsupported',
    locatorIds: ['yuanhai-p48-six-relations', 'yuanhai-p56-womens-fate'],
    applicability: ['family/gender role context would be required'],
    requiredStructuralResult: {
      ruleIds: [],
      fields: ['six-relation mapping', 'gender-specific role mapping'],
      closure: 'personal_family_semantic_surface_outside_v0',
    },
    sourceDefinedOutput: {
      kind: 'unsupported_semantic',
      role: '六親/女命 outcome',
      outputShape: [],
      scope: 'not materialized',
    },
    exceptions: ['do not expose family, spouse, children, or gender conclusions'],
    sourceObservation: 'p.48–66 contain explicit 六親 and 女命 sections with personal/family outcome claims.',
  }),
  yuanhaiInventoryEntry({
    inventoryId: 'inventory.yuanhai.p67-p80-summary-maxims.v0',
    status: 'unresolved',
    locatorIds: ['yuanhai-p67-ziping-essentials', 'yuanhai-p69-preferences', 'yuanhai-p80-miscellaneous-maxims'],
    applicability: ['the compressed maxim must be expanded into a source-complete structural predicate'],
    requiredStructuralResult: {
      ruleIds: [],
      fields: ['reading order', 'condition', 'exception', 'output'],
      closure: 'compressed_maxim_lacks_complete_predicate_and_priority',
    },
    sourceDefinedOutput: {
      kind: 'not_materialized',
      role: 'summary/maxim surface',
      outputShape: [],
      scope: 'inventory only',
    },
    exceptions: ['retain order phrases as locator evidence; do not infer a universal reading algorithm'],
    sourceObservation: 'p.67–80 collect condensed songs, preferences, and miscellaneous maxims with mixed structural and outcome language.',
  }),
  yuanhaiInventoryEntry({
    inventoryId: 'inventory.yuanhai.p90-p103-compiled-rules.v0',
    status: 'unresolved',
    locatorIds: ['yuanhai-p90-late-rule-collection', 'yuanhai-p103-omens-fu'],
    applicability: ['compiled rule identity, exact condition window, and non-outcome output are separately closed'],
    requiredStructuralResult: {
      ruleIds: [],
      fields: ['condition window', 'role/pattern relation', 'stop condition'],
      closure: 'compiled_rule_scope_not_closed',
    },
    sourceDefinedOutput: {
      kind: 'not_materialized',
      role: 'compiled rule/妖祥 surface',
      outputShape: [],
      scope: 'locator inventory only',
    },
    exceptions: ['do not convert compiled outcome lines into prediction or personal meaning'],
    sourceObservation: 'p.90–103 are later compiled rule/赋 surfaces with mixed role, fortune, and personal-outcome clauses.',
  }),
  yuanhaiInventoryEntry({
    inventoryId: 'inventory.yuanhai.p104-p161-late-collections.v0',
    status: 'unresolved',
    locatorIds: ['yuanhai-p110-omens-fu-continuation'],
    applicability: ['a stable section boundary and source-complete condition/output pair are required'],
    requiredStructuralResult: {
      ruleIds: [],
      fields: ['section identity', 'condition', 'priority', 'output boundary'],
      closure: 'late_compilation_scope_and_composition_not_closed',
    },
    sourceDefinedOutput: {
      kind: 'not_materialized',
      role: 'late compiled prose/赋/诀',
      outputShape: [],
      scope: 'inventory only',
    },
    exceptions: ['page-range locator is not treated as a semantic rule', 'do not backfill missing conditions from Ziping or modern practice'],
    sourceObservation: 'the middle late-work pages continue compiled maxims and outcome prose; no independent executable predicate was closed.',
  }),
  yuanhaiInventoryEntry({
    inventoryId: 'inventory.yuanhai.p162-p164-compiled-fu.v0',
    status: 'unresolved',
    locatorIds: ['yuanhai-p162-wanjin-fu', 'yuanhai-p164-jiechisu-miao-jue'],
    applicability: ['role/pattern/timing conditions and output limits are source-complete'],
    requiredStructuralResult: {
      ruleIds: [],
      fields: ['role/pattern state', 'timing relation', 'priority'],
      closure: 'compiled_fortune_rule_scope_not_closed',
    },
    sourceDefinedOutput: {
      kind: 'not_materialized',
      role: '萬金賦/畢要捷馳玄妙訣',
      outputShape: [],
      scope: 'inventory only',
    },
    exceptions: ['do not promote first-look/month-command phrases into a common resolver'],
    sourceObservation: 'p.162–164 directly contain compiled maxims that mix structural order with fortune outcomes.',
  }),
  yuanhaiInventoryEntry({
    inventoryId: 'inventory.yuanhai.p165-p199-late-summary.v0',
    status: 'unresolved',
    locatorIds: ['yuanhai-p173-four-line-independent-step', 'yuanhai-p197-eight-character-summary', 'yuanhai-p199-compilation-summary'],
    applicability: ['late summary clause has an exact non-outcome structural output and source priority'],
    requiredStructuralResult: {
      ruleIds: [],
      fields: ['summary condition', 'priority', 'conflict handling'],
      closure: 'summary_rules_mix_outcomes_and_lack_composition_contract',
    },
    sourceDefinedOutput: {
      kind: 'not_materialized',
      role: '四言獨步/撮要/會要 summary surfaces',
      outputShape: [],
      scope: 'inventory only',
    },
    exceptions: ['retain summary prohibitions as unresolved evidence, not as a universal semantic grammar'],
    sourceObservation: 'p.173–199 contain late summary verses, timing/pattern claims, and compilation notes; no new executable rule is adopted.',
  }),
])

export const SAJU_ZIPING_SEMANTIC_COMPOSITION_FRONTIER = Object.freeze({
  status: 'unresolved_composition_frontier',
  compositionReady: false,
  simultaneousSurfaceIds: Object.freeze([
    'inventory.ziping.p3-stem-combination-role-change.v0',
    'inventory.ziping.p4-stem-combination-nonmerge.v0',
    'inventory.ziping.p8-pure-mixed-use.v0',
    'inventory.ziping.p9-success-failure-transition.v0',
    'inventory.ziping.p11-exposure-branch-sentiment-composition.v0',
    'inventory.ziping.p12-good-bad-pattern.v0',
  ]),
  sourceProvidesPriority: false,
  sourceProvidesCombinationRule: false,
  sourceProvidesTransitionRule: false,
  policy: 'preserve simultaneous source-bounded results and tension; do not select, rank, or synthesize a winner',
  forbiddenPromotion: ['common semantic rule', 'majority vote across cases', 'modern synthesis', 'personal meaning', 'good/bad or fortune result'],
})

const sourceSemanticContractSpec = (ruleId, value) => {
  const ruleItem = SAJU_ZIPING_SOURCE_SEMANTIC_RULES.find(item => item.ruleId === ruleId)
  if (!ruleItem) throw new Error(`unknown source semantic rule contract: ${ruleId}`)
  return {
    contractId: `contract.${ruleId}`,
    ruleId,
    ruleStatus: ruleItem.status,
    work: ruleItem.work,
    lineage: ruleItem.lineage,
    sourceIds: [...ruleItem.sourceIds],
    locatorIds: [...ruleItem.locatorIds],
    semanticBoundary: { ...ruleItem.semanticBoundary },
    commonBaseFacts: ruleItem.inputFacts.map(factRef => ({ factRef, origin: 'frozen_base_common_fact' })),
    structuralPrerequisites: ruleItem.structuralPrerequisiteRuleIds.map(prerequisiteRuleId => ({
      prerequisiteRuleId,
      status: 'adopted_lineage_structural_result',
      resultOrigin: 'lineage_derived_structural_result',
    })),
    requiredResultFields: [...SAJU_LINEAGE_SOURCE_SEMANTIC_RESULT_REQUIRED_FIELDS],
    applicability: [...ruleItem.preconditions],
    procedure: [...ruleItem.orderedSteps],
    stopConditions: [...ruleItem.exceptions],
    output: { ...ruleItem.output },
    conflictPolicy: ruleItem.conflictPolicy,
    forbiddenExtensions: [...ruleItem.forbiddenExtensions],
    ...value,
  }
}

export const SAJU_ZIPING_SOURCE_SEMANTIC_CONTRACTS = Object.freeze([
  sourceSemanticContractSpec('rule.ziping.chen-exposure-use-role.v0', {
    commonBaseFacts: [
      { factRef: FACT_REFS.dayMaster, origin: 'frozen_base_common_fact' },
      { factRef: FACT_REFS.monthBranch, origin: 'frozen_base_common_fact' },
      { factRef: FACT_REFS.pillarFacts, origin: 'frozen_base_common_fact' },
      { factRef: FACT_REFS.timeAccuracy, origin: 'frozen_normalized_input' },
    ],
  }),
  sourceSemanticContractSpec('rule.ziping.yin-month-exposure-change.v0'),
  sourceSemanticContractSpec('rule.ziping.exposure-branch-sentiment.v0'),
])

const ADOPTED_LINEAGE_RULE_IDS = new Set(SAJU_LINEAGE_RULES.filter(ruleItem => ruleItem.status === 'adopted_lineage_rule').map(ruleItem => ruleItem.ruleId))

export const SAJU_LINEAGE_READING_GRAMMAR = Object.freeze({
  schemaVersion: SAJU_LINEAGE_READING_GRAMMAR_SCHEMA,
  version: SAJU_LINEAGE_READING_GRAMMAR_VERSION,
  scope: {
    works: Object.values(WORKS),
    publicBaseSchema: 'tri-system-deterministic-base-v0',
    sourceSetFrozen: true,
    independentSourcePromotion: false,
    commonRulePromotion: false,
    semanticDictionary: false,
    baseMutation: false,
    constitutionMutation: false,
  },
  boundary: {
    sourceAuthorityPromoted: false,
    claimPromotion: false,
    readinessMutation: false,
    activationMutation: false,
    interpretationGenerated: false,
    recalculationPerformed: false,
  },
  sources: SAJU_LINEAGE_SOURCE_PROFILES,
  locators: SAJU_LINEAGE_LOCATORS,
  rules: SAJU_LINEAGE_RULES,
  structuralResultContract: {
    schema: SAJU_LINEAGE_STRUCTURAL_RESULT_CONTRACT_SCHEMA,
    version: SAJU_LINEAGE_STRUCTURAL_RESULT_CONTRACT_VERSION,
    contractIds: SAJU_LINEAGE_STRUCTURAL_CONTRACTS.map(contract => contract.contractId),
    baseFactOrigin: 'frozen_base_common_fact',
    derivedResultOrigin: 'lineage_derived_structural_result',
    semanticExpansion: false,
  },
  sourceBoundedSemanticGrammar: {
    schema: SAJU_LINEAGE_SOURCE_SEMANTIC_RESULT_SCHEMA,
    version: SAJU_LINEAGE_SOURCE_SEMANTIC_RESULT_VERSION,
    ruleIds: SAJU_ZIPING_SOURCE_SEMANTIC_RULES.map(ruleItem => ruleItem.ruleId),
    contractIds: SAJU_ZIPING_SOURCE_SEMANTIC_CONTRACTS.map(contract => contract.contractId),
    adoptedRuleIds: SAJU_ZIPING_SOURCE_SEMANTIC_RULES.filter(ruleItem => ruleItem.status === 'adopted_lineage_semantic_rule').map(ruleItem => ruleItem.ruleId),
    semanticRuleInventory: SAJU_ZIPING_SEMANTIC_RULE_INVENTORY,
    candidateClosability: SAJU_ZIPING_CANDIDATE_CLOSABILITY,
    lineageRuleInventories: {
      yuanhai: SAJU_YUANHAI_RULE_INVENTORY,
    },
    newlyAdoptedRuleIds: SAJU_ZIPING_SEMANTIC_RULE_INVENTORY
      .filter(item => item.status === 'newly_adopted_executable')
      .map(item => item.inventoryId),
    compositionFrontier: SAJU_ZIPING_SEMANTIC_COMPOSITION_FRONTIER,
    commonRulePromotion: false,
    personalMeaning: false,
    crossLineageMerge: false,
  },
  commonCandidates: [],
  commonCandidateReviews: commonStructuralRejection,
  frontier: {
    executableRuleIds: SAJU_LINEAGE_RULES.filter(ruleItem => ruleItem.executionStatus === 'executable_from_frozen_base').map(ruleItem => ruleItem.ruleId),
    blockedByMissingFactRuleIds: SAJU_LINEAGE_RULES.filter(ruleItem => ruleItem.executionStatus === 'blocked_missing_base_fact').map(ruleItem => ruleItem.ruleId),
    unresolvedRuleIds: SAJU_LINEAGE_RULES.filter(ruleItem => ruleItem.status === 'unresolved').map(ruleItem => ruleItem.ruleId),
    unsupportedRuleIds: SAJU_LINEAGE_RULES.filter(ruleItem => ruleItem.status === 'unsupported').map(ruleItem => ruleItem.ruleId),
    nextChecks: [
      'source-specific season/solar-term state must be added as a frozen FACT before Ditian/Qiongtong conditional clauses can execute',
      'the bounded 甲 root scan and exact p.10 甲生辰月 named exposure lane are executable, but a complete all-stem root/exposure and 透干 definition is still required before generic classification',
      'the exact p.7 寅月 不透甲而透丙 clause is executable only in its four-position, single-丙 scope; p.11 會支/有情/無情 composition and any global 用神 precedence remain unresolved',
      'exact timing rules require the existing timing authority frontier to close; do not infer them from a section heading',
      'an independent, lineage-identified witness is required before any common candidate is emitted',
    ],
  },
})

const unique = values => [...new Set(values)]
const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value)
const PILLAR_POSITIONS = Object.freeze(['year', 'month', 'day', 'hour'])
const isJiaStem = value => value === '甲' || value === '갑'
const isChenBranch = value => value === '辰' || value === '진'
const isYinBranch = value => value === '寅' || value === '인'
const isBingStem = value => value === '丙' || value === '병'

function p10ExposureTargetForStem(stem) {
  return ZIPING_P10_EXPOSURE_TARGETS.find(target => target.inputStems.includes(stem)) || null
}

function readPath(root, path) {
  let value = root
  for (const segment of path.split('.')) {
    if (!isObject(value) && !Array.isArray(value)) return { present: false, value: undefined }
    if (Array.isArray(value)) {
      if (!/^\d+$/.test(segment) || Number(segment) >= value.length) return { present: false, value: undefined }
      value = value[Number(segment)]
    } else if (Object.hasOwn(value, segment)) {
      value = value[segment]
    } else {
      return { present: false, value: undefined }
    }
  }
  return { present: value !== null && value !== undefined, value }
}

function hasAllFacts(base, refs) {
  return refs.every(ref => readPath(base, ref).present)
}

function hasExactTime(base) {
  return readPath(base, FACT_REFS.timeAccuracy).value === 'exact'
}

function hasCompletePillarValues(base) {
  return PILLAR_POSITIONS.every(position => readPath(base, `systems.saju.fact.pillars.${position}`).present)
}

function hasCompleteHiddenStemInventory(base) {
  return PILLAR_POSITIONS.every(position => {
    const result = readPath(base, `systems.saju.fact.pillarFacts.${position}.hiddenStems`)
    return result.present && Array.isArray(result.value)
  })
}

function hasCompleteZipingStemBranchExampleInput(base) {
  const dayMaster = readPath(base, FACT_REFS.dayMaster)
  if (!dayMaster.present || typeof dayMaster.value !== 'string') return false
  return PILLAR_POSITIONS.every(position => {
    const pillar = readPath(base, `systems.saju.fact.pillarFacts.${position}`).value
    return isObject(pillar)
      && typeof pillar.branch === 'string'
      && Array.isArray(pillar.hiddenStems)
      && pillar.hiddenStems.every(entry => isObject(entry) && typeof entry.stem === 'string')
  })
}

function hasCompleteZipingJiaRootScanInput(base) {
  if (!hasExactTime(base)) return false
  return PILLAR_POSITIONS.every(position => {
    const pillar = readPath(base, `systems.saju.fact.pillarFacts.${position}`).value
    return isObject(pillar) && typeof pillar.stem === 'string' && typeof pillar.branch === 'string'
  })
}

function hasCompleteZipingChenExposureInput(base) {
  if (!hasExactTime(base)) return false
  const month = readPath(base, 'systems.saju.fact.pillarFacts.month').value
  if (!isObject(month) || !isChenBranch(month.branch) || !Array.isArray(month.hiddenStems)) return false
  const monthHiddenStems = month.hiddenStems.map(entry => entry?.stem).filter(stem => typeof stem === 'string')
  if (!ZIPING_P10_EXPOSURE_TARGETS.every(target => target.inputStems.some(stem => monthHiddenStems.includes(stem)))) return false
  return PILLAR_POSITIONS.every(position => {
    const pillar = readPath(base, `systems.saju.fact.pillarFacts.${position}`).value
    return isObject(pillar) && typeof pillar.stem === 'string'
  })
}

function hasCompleteZipingYinMonthExposureInput(base) {
  if (!hasExactTime(base)) return false
  const month = readPath(base, 'systems.saju.fact.pillarFacts.month').value
  if (!isObject(month) || !isYinBranch(month.branch)) return false
  return PILLAR_POSITIONS.every(position => {
    const pillar = readPath(base, `systems.saju.fact.pillarFacts.${position}`).value
    return isObject(pillar) && typeof pillar.stem === 'string'
  })
}

function hasCompleteYuanhaiDayunFocusLensInput(base) {
  if (!hasExactTime(base)) return false
  const timing = readPath(base, FACT_REFS.timing).value
  if (!isObject(timing) || !isObject(timing.daYun) || !Array.isArray(timing.daYun.cycles) || !isObject(timing.seUn)) return false
  if (!Number.isInteger(timing.daYun.activeCycleIndex)) return false
  const activeCycle = timing.daYun.cycles.find(cycle => cycle?.index === timing.daYun.activeCycleIndex)
  return isObject(activeCycle)
    && typeof activeCycle.branch === 'string'
    && typeof timing.seUn.stem === 'string'
}

function yuanhaiDayunFocusLens(base) {
  const timing = readPath(base, FACT_REFS.timing).value
  const activeCycle = timing.daYun.cycles.find(cycle => cycle?.index === timing.daYun.activeCycleIndex)
  return {
    focusFrame: { dayun: 'branch', seUn: 'stem' },
    activeDayun: {
      index: activeCycle.index,
      branch: activeCycle.branch,
    },
    seUn: {
      stem: timing.seUn.stem,
    },
    factRefs: [FACT_REFS.timing, FACT_REFS.timeAccuracy],
    timeAccuracy: readPath(base, FACT_REFS.timeAccuracy).value,
    sourceScope: 'yuanhai-p9-大运看支-岁君看干-focus-lens-only',
  }
}

function explicitZipingStemBranchExamples(pillarFacts, dayMasterStem) {
  const matches = []
  for (const position of PILLAR_POSITIONS) {
    const pillar = pillarFacts[position]
    const candidate = ZIPING_EXPLICIT_STEM_BRANCH_EXAMPLES.find(item => item.stem === dayMasterStem && item.branch === pillar?.branch)
    if (!candidate) continue
    matches.push({
      position,
      anchorStem: dayMasterStem,
      branch: pillar.branch,
      hiddenStems: pillar.hiddenStems.map(entry => entry.stem),
      sourceExample: {
        sourceStem: candidate.sourceStem,
        sourceBranch: candidate.sourceBranch,
        sourceClass: candidate.sourceClass,
        sourceCategory: candidate.sourceCategory,
      },
    })
  }
  return matches
}

function zipingJiaRootBranchScan(pillarFacts) {
  const visibleStemAnchors = PILLAR_POSITIONS
    .filter(position => pillarFacts[position]?.stem === '갑')
    .map(position => ({ position, stem: '갑' }))
  const jiaRootBranchMatches = visibleStemAnchors.length > 0
    ? PILLAR_POSITIONS
      .filter(position => ['인', '해', '묘', '미'].includes(pillarFacts[position]?.branch))
      .map(position => ({
        position,
        branch: pillarFacts[position].branch,
        anchorStem: '갑',
        sourceRelation: '甲木之根',
      }))
    : []
  const haiVisibleStemRelations = PILLAR_POSITIONS.flatMap(branchPosition => {
    if (pillarFacts[branchPosition]?.branch !== '해') return []
    return PILLAR_POSITIONS
      .filter(stemPosition => ['임', '갑'].includes(pillarFacts[stemPosition]?.stem))
      .map(stemPosition => ({
        branchPosition,
        branch: '해',
        stemPosition,
        stem: pillarFacts[stemPosition].stem,
        sourceRelation: pillarFacts[stemPosition].stem === '임' ? '禄' : '長生',
      }))
  })
  return { visibleStemAnchors, jiaRootBranchMatches, haiVisibleStemRelations }
}

function zipingChenExposureInventory(pillarFacts) {
  const namedExposureMatches = PILLAR_POSITIONS.flatMap(position => {
    const visibleStem = pillarFacts[position]?.stem
    const target = p10ExposureTargetForStem(visibleStem)
    if (!target) return []
    return [{
      position,
      visibleStem,
      sourceStem: target.sourceStem,
      sourceScope: 'ziping-p10-甲生辰月-named-target-only',
    }]
  })
  return {
    sourceCondition: { dayMaster: '甲', monthBranch: '辰' },
    namedTargets: ZIPING_P10_EXPOSURE_TARGETS.map(target => target.sourceStem),
    namedExposureMatches,
    multiplicity: namedExposureMatches.length > 1 ? 'multiple_named_exposures' : namedExposureMatches.length === 1 ? 'single_named_exposure' : 'no_named_exposure',
  }
}

function zipingYinMonthExposureContrast(pillarFacts) {
  const visibleStemInventory = PILLAR_POSITIONS.map(position => ({
    position,
    visibleStem: pillarFacts[position].stem,
  }))
  const exposedPositions = visibleStemInventory
    .filter(item => isBingStem(item.visibleStem))
    .map(item => ({
      position: item.position,
      visibleStem: item.visibleStem,
      sourceStem: '丙',
    }))
  return {
    sourceCondition: {
      monthBranch: '寅',
      visibleStemFrame: 'four-supplied-pillar-positions',
      absentVisibleStem: '甲',
      exposedVisibleStem: '丙',
    },
    visibleStemInventory,
    absentVisibleStem: '甲',
    exposedVisibleStem: '丙',
    exposedPositions,
    sourcePredicateScope: 'ziping-p7-寅月-不透甲而透丙-exact-frame-only',
  }
}

function sourceSeasonContext(base) {
  const result = readPath(base, 'systems.saju.fact.seasonContext')
  if (!result.present || !isObject(result.value)) return null
  if (typeof result.value.season !== 'string' && typeof result.value.solarTerm !== 'string') return null
  return result.value
}

function ruleResult(ruleItem, status, output = {}, reason = null) {
  return {
    ruleId: ruleItem.ruleId,
    work: ruleItem.work,
    ruleStatus: ruleItem.status,
    executionStatus: status,
    sourceIds: [...ruleItem.sourceIds],
    locatorIds: [...ruleItem.locatorIds],
    output,
    reason,
    noRecalculation: true,
    noSemanticMeaning: true,
  }
}

function executeRule(ruleItem, base) {
  if (ruleItem.status === 'unsupported') return ruleResult(ruleItem, 'unsupported', {}, ruleItem.observedRule)
  const fact = base.systems?.saju?.fact || {}
  const pillars = fact.pillars || {}
  const pillarFacts = fact.pillarFacts || {}
  const timeAccuracy = base.normalizedInput?.timeAccuracy || null

  switch (ruleItem.ruleId) {
    case 'rule.yuanhai.day-anchor-month-command-frame.v0': {
      const refs = [FACT_REFS.dayMaster, FACT_REFS.yearPillar, FACT_REFS.monthPillar, FACT_REFS.dayPillar, FACT_REFS.hourPillar]
      if (!hasExactTime(base) || !hasAllFacts(base, refs) || !hasCompletePillarValues(base)) return ruleResult(ruleItem, 'blocked_missing_base_fact', {}, 'exact four-pillar or day-master FACT missing')
      return ruleResult(ruleItem, 'executable_from_frozen_base', {
        sourceRoleFrame: { anchor: 'dayMaster', order: ['year', 'month', 'day', 'hour'], monthRole: 'monthCommand', hourRole: 'auxiliary' },
        factRefs: refs,
        timeAccuracy,
      })
    }
    case 'rule.yuanhai.hidden-stem-ten-god-label-inventory.v0': {
      if (!hasExactTime(base) || !hasAllFacts(base, [FACT_REFS.pillarFacts, FACT_REFS.visibleTenGods]) || !hasCompleteHiddenStemInventory(base)) return ruleResult(ruleItem, 'blocked_missing_base_fact', {}, 'complete pillar hidden-stem or ten-god FACT missing')
      return ruleResult(ruleItem, 'executable_from_frozen_base', {
        hiddenStemLabels: Object.fromEntries(Object.entries(pillarFacts).map(([position, item]) => [position, (item?.hiddenStems || []).map(entry => ({ stem: entry.stem, tenGod: entry.tenGod }))])),
        visibleTenGods: { ...fact.tenGodsVisible },
      })
    }
    case 'rule.yuanhai.dayun-branch-seun-stem-lens.v0': {
      if (!hasCompleteYuanhaiDayunFocusLensInput(base)) return ruleResult(ruleItem, 'blocked_missing_base_fact', {}, 'exact timing, active 大運 branch, or seUn/歲君 stem FACT missing')
      return ruleResult(ruleItem, 'executable_from_frozen_base', yuanhaiDayunFocusLens(base))
    }
    case 'rule.sanming.four-pillars-month-hour-frame.v0': {
      const refs = [FACT_REFS.yearPillar, FACT_REFS.monthPillar, FACT_REFS.dayPillar, FACT_REFS.hourPillar]
      if (!hasExactTime(base) || !hasAllFacts(base, refs) || !hasCompletePillarValues(base)) return ruleResult(ruleItem, 'blocked_missing_base_fact', {}, 'exact four-pillar FACT missing')
      return ruleResult(ruleItem, 'executable_from_frozen_base', {
        fourPillars: { ...pillars },
        procedureLabels: { monthFrom: 'year', hourFrom: 'day' },
        recalculation: 'not_performed',
      })
    }
    case 'rule.sanming.human-element-month-command.v0': {
      if (!hasAllFacts(base, [FACT_REFS.monthBranch, FACT_REFS.monthHiddenStems]) || !Array.isArray(pillarFacts.month?.hiddenStems)) return ruleResult(ruleItem, 'blocked_missing_base_fact', {}, 'month branch or hidden-stem FACT missing')
      return ruleResult(ruleItem, 'executable_from_frozen_base', {
        monthCommandBranch: pillarFacts.month.branch,
        hiddenStems: (pillarFacts.month.hiddenStems || []).map(entry => ({ stem: entry.stem, tenGod: entry.tenGod })),
        serviceDayArithmetic: 'not_applied',
      })
    }
    case 'rule.sanming.element-generation-control-v0': {
      if (!hasAllFacts(base, [FACT_REFS.elements, FACT_REFS.pillarFacts, FACT_REFS.stemRelations])) return ruleResult(ruleItem, 'blocked_missing_base_fact', {}, 'element or relation FACT missing')
      return ruleResult(ruleItem, 'executable_from_frozen_base', {
        elementInventory: { ...fact.elementsDistribution },
        existingStemRelations: [...(fact.stemRelations || [])],
        relationGraph: 'not_recalculated',
      })
    }
    case 'rule.ziping.branch-relation-inventory.v0': {
      if (!Array.isArray(fact.branchRelations)) return ruleResult(ruleItem, 'blocked_missing_base_fact', {}, 'branch relation FACT list missing')
      const sourceListed = new Set(['형', '충', '회', '합', '삼회', '삼합', '육합'])
      const observed = fact.branchRelations.map(item => item.name).filter(Boolean)
      return ruleResult(ruleItem, 'executable_from_frozen_base', {
        relations: fact.branchRelations.map(item => ({ name: item.name, branches: [...(item.branches || [])], positions: [...(item.positions || [])] })),
        sourceListedRelationNames: observed.filter(name => sourceListed.has(name)),
        outOfLocatorScopeRelationNames: unique(observed.filter(name => !sourceListed.has(name))),
        precedence: 'none',
      })
    }
    case 'rule.ziping.explicit-stem-branch-example-match.v0': {
      if (!hasCompleteZipingStemBranchExampleInput(base)) return ruleResult(ruleItem, 'blocked_missing_base_fact', {}, 'day-master, branch, or hidden-stem FACT is missing or malformed')
      const dayMasterStem = fact.dayMaster || fact.dayMasterDetails?.stem
      return ruleResult(ruleItem, 'executable_from_frozen_base', {
        anchorStem: dayMasterStem,
        matchedExamples: explicitZipingStemBranchExamples(pillarFacts, dayMasterStem),
        sourceExampleScope: 'ziping-p5-exact-stem-branch-examples-only',
      })
    }
    case 'rule.ziping.jia-root-branch-scan.v0': {
      if (!hasCompleteZipingJiaRootScanInput(base)) return ruleResult(ruleItem, 'blocked_missing_base_fact', {}, 'exact time or visible stem/branch FACT is missing or malformed')
      return ruleResult(ruleItem, 'executable_from_frozen_base', {
        ...zipingJiaRootBranchScan(pillarFacts),
        sourcePredicateScope: 'ziping-p16-jia-and-hai-examples-only',
      })
    }
    case 'rule.ziping.chen-exposure-inventory.v0': {
      if (!isJiaStem(fact.dayMaster) && !isJiaStem(fact.dayMasterDetails?.stem)) return ruleResult(ruleItem, 'not_applicable_fixture', {}, 'fixture day-master is not 甲/갑; no transfer to another source window')
      if (!isChenBranch(pillarFacts.month?.branch)) return ruleResult(ruleItem, 'not_applicable_fixture', {}, 'fixture month branch is not 辰/진; no transfer to another source window')
      if (!hasCompleteZipingChenExposureInput(base)) return ruleResult(ruleItem, 'blocked_missing_base_fact', {}, 'exact time, month hidden-stem inventory, or visible stem FACT is missing or not the source-listed 辰 window')
      return ruleResult(ruleItem, 'executable_from_frozen_base', {
        ...zipingChenExposureInventory(pillarFacts),
        sourcePredicateScope: 'ziping-p10-甲生辰月-named-targets-only',
      })
    }
    case 'rule.ziping.yin-month-exposure-contrast.v0': {
      if (!hasCompleteZipingYinMonthExposureInput(base)) {
        const monthBranch = pillarFacts.month?.branch
        if (monthBranch !== undefined && monthBranch !== null && !isYinBranch(monthBranch)) return ruleResult(ruleItem, 'not_applicable_fixture', {}, 'fixture month branch is not 寅/인; no transfer to another source window')
        return ruleResult(ruleItem, 'blocked_missing_base_fact', {}, 'exact time, 寅 month, or visible stem FACT is missing or malformed')
      }
      const visibleStemInventory = PILLAR_POSITIONS.map(position => ({
        position,
        visibleStem: pillarFacts[position].stem,
      }))
      const jiaMatches = visibleStemInventory.filter(item => isJiaStem(item.visibleStem))
      const bingMatches = visibleStemInventory.filter(item => isBingStem(item.visibleStem))
      if (jiaMatches.length > 0) return ruleResult(ruleItem, 'not_applicable_fixture', {}, 'the exact p.7 condition 不透甲 is not satisfied in the supplied visible-stem frame')
      if (bingMatches.length === 0) return ruleResult(ruleItem, 'not_applicable_fixture', {}, 'the exact p.7 condition 透丙 is not satisfied in the supplied visible-stem frame')
      if (bingMatches.length > 1) return ruleResult(ruleItem, 'not_executable_by_contract', {}, 'p.7 does not close duplicate visible 丙 handling')
      return ruleResult(ruleItem, 'executable_from_frozen_base', zipingYinMonthExposureContrast(pillarFacts))
    }
    case 'rule.ditian.jia-wood-seasonal-condition.v0':
    case 'rule.qiongtong.jia-wood-seasonal-clauses.v0':
      if (!isJiaStem(fact.dayMaster) && !isJiaStem(fact.dayMasterDetails?.stem)) return ruleResult(ruleItem, 'not_applicable_fixture', {}, 'fixture day-master is not 甲/갑; no transfer to another stem')
      {
        const context = sourceSeasonContext(base)
        if (!context) return ruleResult(ruleItem, 'blocked_missing_base_fact', {}, 'explicit season/solar-term FACT is not in the frozen public Base')
        return ruleResult(ruleItem, 'executable_from_frozen_base', {
          matchedConditionWindow: {
            dayMasterStem: '甲',
            monthBranch: pillarFacts.month?.branch || null,
            seasonContext: { ...context },
            sourceClauseContent: 'not transcribed; locator-bounded condition window only',
          },
        })
      }
    case 'rule.qiongtong.five-phase-number-season-state.v0':
      return ruleResult(ruleItem, 'blocked_missing_base_fact', {}, 'p.2 closes only the conditional double/half operation; the source-specific 生旺/死绝 resolver and input shape remain unresolved, so no supplied label is treated as a closed prerequisite')
    default:
      return ruleResult(ruleItem, 'not_executable_by_contract', {}, ruleItem.observedRule)
  }
}

export function checkSajuLineageReadingGrammar(grammar = SAJU_LINEAGE_READING_GRAMMAR) {
  const errors = []
  const fail = message => errors.push(message)
  if (!isObject(grammar)) return ['grammar_not_object']
  if (grammar.schemaVersion !== SAJU_LINEAGE_READING_GRAMMAR_SCHEMA || grammar.version !== SAJU_LINEAGE_READING_GRAMMAR_VERSION) fail('schema_or_version')
  if (grammar.scope?.sourceSetFrozen !== true || grammar.scope?.commonRulePromotion !== false || grammar.scope?.baseMutation !== false || grammar.scope?.constitutionMutation !== false) fail('scope_boundary')
  for (const key of ['sourceAuthorityPromoted', 'claimPromotion', 'readinessMutation', 'activationMutation', 'interpretationGenerated', 'recalculationPerformed']) if (grammar.boundary?.[key] !== false) fail(`boundary:${key}`)

  const sourceIds = new Set()
  for (const source of grammar.sources || []) {
    if (sourceIds.has(source.sourceId)) fail(`duplicate_source:${source.sourceId}`)
    sourceIds.add(source.sourceId)
    if (!/^[a-f0-9]{64}$/.test(source.byteSha256 || '')) fail(`source_hash:${source.sourceId}`)
    if (source.editionIdentity !== 'unresolved_edition' || source.lineageStatus !== 'UNRESOLVED' || source.independenceStatus !== 'UNRESOLVED') fail(`source_promotion:${source.sourceId}`)
  }

  const locatorIds = new Set()
  const locatorsById = new Map()
  for (const item of grammar.locators || []) {
    if (locatorIds.has(item.observationId)) fail(`duplicate_locator:${item.observationId}`)
    locatorIds.add(item.observationId)
    locatorsById.set(item.observationId, item)
    if (!sourceIds.has(item.sourceId)) fail(`locator_source:${item.observationId}`)
    const source = grammar.sources.find(candidate => candidate.sourceId === item.sourceId)
    if (!Number.isInteger(item.locator?.pdfPage) || item.locator.pdfPage < 1 || item.locator.pdfPage > source.pageCount) fail(`locator_page:${item.observationId}`)
    if (item.locator?.pageLocatorStatus !== 'direct_visual_scan_reviewed') fail(`locator_status:${item.observationId}`)
    if (item.transcriptionStatus !== 'direct_visual_observation_candidate_not_canonical_source_text') fail(`locator_transcription:${item.observationId}`)
  }

  const ruleIds = new Set()
  for (const item of grammar.rules || []) {
    if (ruleIds.has(item.ruleId)) fail(`duplicate_rule:${item.ruleId}`)
    ruleIds.add(item.ruleId)
    if (!SAJU_LINEAGE_RULE_STATUSES.includes(item.status)) fail(`rule_status:${item.ruleId}`)
    if (!SAJU_LINEAGE_EXECUTION_STATUSES.includes(item.executionStatus)) fail(`rule_execution_status:${item.ruleId}`)
    if (item.claimPromotion !== false || item.semanticAuthority !== 'not_established' || item.adoptionScope !== 'source_bounded_rule_surface_only') fail(`rule_boundary:${item.ruleId}`)
    if (!Array.isArray(item.preconditions) || !Array.isArray(item.inputFacts) || !Array.isArray(item.orderedSteps) || !Array.isArray(item.exceptions) || !Array.isArray(item.forbiddenExtensions)) fail(`rule_shape:${item.ruleId}`)
    for (const sourceId of item.sourceIds || []) if (!sourceIds.has(sourceId)) fail(`rule_source:${item.ruleId}:${sourceId}`)
    for (const locatorId of item.locatorIds || []) {
      const locator = locatorsById.get(locatorId)
      if (!locator) fail(`rule_locator:${item.ruleId}:${locatorId}`)
      else if (!(item.sourceIds || []).includes(locator.sourceId)) fail(`rule_locator_source:${item.ruleId}:${locatorId}`)
    }
    if (item.status === 'adopted_lineage_rule' && !['bounded_complete_structural_frame', 'bounded_complete_procedure_frame', 'bounded_label_inventory_only', 'bounded_role_scope_not_service_day_table', 'bounded_relation_vocabulary', 'bounded_relation_inventory_not_resolution', 'bounded_explicit_example_predicate', 'bounded_stem_specific_predicate', 'bounded_exact_exposure_example_predicate', 'bounded_exact_source_clause_predicate', 'bounded_condition_clause_for_jia_only', 'bounded_numeric_state_clause', 'bounded_numeric_operation_without_state_resolver', 'bounded_month_specific_condition_clauses', 'bounded_timing_lens_frame'].includes(item.ruleCompleteness)) fail(`adopted_rule_incomplete:${item.ruleId}`)
    if ((item.status === 'unresolved' || item.status === 'unsupported') && (!item.observedRule || item.observedRule.length === 0)) fail(`unresolved_reason_missing:${item.ruleId}`)
  }

  const semanticInventory = grammar.sourceBoundedSemanticGrammar?.semanticRuleInventory
  if (!Array.isArray(semanticInventory) || semanticInventory.length === 0) fail('semantic_inventory_missing')
  const inventoryIds = new Set()
  const semanticRulesById = new Map(SAJU_ZIPING_SOURCE_SEMANTIC_RULES.map(item => [item.ruleId, item]))
  for (const item of semanticInventory || []) {
    if (!isObject(item)) {
      fail('semantic_inventory_item_not_object')
      continue
    }
    if (!item.inventoryId || inventoryIds.has(item.inventoryId)) fail(`semantic_inventory_id_duplicate:${item.inventoryId || 'missing'}`)
    inventoryIds.add(item.inventoryId)
    if (!SAJU_ZIPING_SEMANTIC_INVENTORY_STATUSES.includes(item.status)) fail(`semantic_inventory_status:${item.inventoryId}`)
    if (!Array.isArray(item.sourceIds) || item.sourceIds.length === 0) fail(`semantic_inventory_sources:${item.inventoryId}`)
    for (const sourceId of item.sourceIds || []) if (!sourceIds.has(sourceId)) fail(`semantic_inventory_source_unknown:${item.inventoryId}:${sourceId}`)
    if (!Array.isArray(item.locatorIds) || item.locatorIds.length === 0) fail(`semantic_inventory_locators:${item.inventoryId}`)
    for (const locatorId of item.locatorIds || []) {
      const locator = locatorsById.get(locatorId)
      if (!locator) fail(`semantic_inventory_locator_unknown:${item.inventoryId}:${locatorId}`)
      else if (!item.sourceIds.includes(locator.sourceId)) fail(`semantic_inventory_locator_source:${item.inventoryId}:${locatorId}`)
    }
    if (!Array.isArray(item.applicability) || item.applicability.length === 0) fail(`semantic_inventory_applicability:${item.inventoryId}`)
    if (!isObject(item.requiredStructuralResult) || !Array.isArray(item.requiredStructuralResult.ruleIds) || !Array.isArray(item.requiredStructuralResult.fields) || typeof item.requiredStructuralResult.closure !== 'string') fail(`semantic_inventory_structural:${item.inventoryId}`)
    if (!isObject(item.semanticRoleResult) || typeof item.semanticRoleResult.sourceDefinedRole !== 'string' || !Array.isArray(item.semanticRoleResult.outputShape) || typeof item.semanticRoleResult.scope !== 'string') fail(`semantic_inventory_role:${item.inventoryId}`)
    if (!Array.isArray(item.exceptions) || item.exceptions.length === 0 || !Array.isArray(item.forbiddenExtensions) || item.forbiddenExtensions.length === 0) fail(`semantic_inventory_boundary:${item.inventoryId}`)
    if (!['coexistence_only_until_source_priority_is_closed', 'unresolved_composition_frontier'].includes(item.compositionState)) fail(`semantic_inventory_composition_state:${item.inventoryId}`)
    if (item.status === 'adopted_existing_executable' || item.status === 'newly_adopted_executable') {
      const contractRule = semanticRulesById.get(item.contractRuleId)
      if (!contractRule || contractRule.status !== 'adopted_lineage_semantic_rule') fail(`semantic_inventory_contract:${item.inventoryId}`)
      if (item.requiredStructuralResult.closure !== 'closed_in_existing_contract' && item.status === 'adopted_existing_executable') fail(`semantic_inventory_adopted_closure:${item.inventoryId}`)
    } else if (item.contractRuleId !== undefined) {
      fail(`semantic_inventory_unadopted_contract:${item.inventoryId}`)
    }
  }
  const candidateClosability = grammar.sourceBoundedSemanticGrammar?.candidateClosability
  const contextCandidateIds = (semanticInventory || []).filter(item => item.status === 'context_bound_candidate').map(item => item.inventoryId)
  if (!isObject(candidateClosability) || candidateClosability.schema !== 'saju-ziping-candidate-closability-v0') fail('ziping_candidate_closability_missing')
  else {
    if (candidateClosability.candidateCount !== contextCandidateIds.length) fail('ziping_candidate_closability_count')
    const closabilityEntries = Array.isArray(candidateClosability.entries) ? candidateClosability.entries : []
    if (closabilityEntries.length !== contextCandidateIds.length) fail('ziping_candidate_closability_entries')
    const closabilityIds = new Set(closabilityEntries.map(entry => entry?.candidateId))
    if (closabilityIds.size !== closabilityEntries.length || contextCandidateIds.some(id => !closabilityIds.has(id))) fail('ziping_candidate_closability_ids')
    if (!Array.isArray(candidateClosability.nearCandidateIds) || candidateClosability.nearCandidateIds.length !== 1) fail('ziping_candidate_near_count')
    if (!Array.isArray(candidateClosability.frozenV0CandidateIds) || candidateClosability.frozenV0CandidateIds.length !== contextCandidateIds.length - 1) fail('ziping_candidate_frozen_count')
    for (const entry of closabilityEntries) {
      if (!isObject(entry) || !['near_candidate', 'v0_frozen'].includes(entry.closability) || !Array.isArray(entry.locatorIds) || typeof entry.reason !== 'string' || typeof entry.promotionBoundary !== 'string') fail(`ziping_candidate_closability_shape:${entry?.candidateId || 'missing'}`)
      if (entry.closability === 'near_candidate' && typeof entry.requiredAdditionalCheck !== 'string') fail(`ziping_candidate_near_check:${entry?.candidateId || 'missing'}`)
      if (entry.closability === 'v0_frozen' && entry.requiredAdditionalCheck !== null) fail(`ziping_candidate_frozen_check:${entry?.candidateId || 'missing'}`)
    }
  }
  const yuanhaiInventory = grammar.sourceBoundedSemanticGrammar?.lineageRuleInventories?.yuanhai
  if (!Array.isArray(yuanhaiInventory) || yuanhaiInventory.length === 0) fail('yuanhai_inventory_missing')
  else {
    const yuanhaiInventoryIds = new Set()
    const structuralContractsByRuleId = new Map(SAJU_LINEAGE_STRUCTURAL_CONTRACTS.map(contract => [contract.ruleId, contract]))
    const sourceSemanticRulesByRuleId = new Map(SAJU_ZIPING_SOURCE_SEMANTIC_RULES.map(ruleItem => [ruleItem.ruleId, ruleItem]))
    for (const item of yuanhaiInventory) {
      if (!isObject(item)) {
        fail('yuanhai_inventory_item_not_object')
        continue
      }
      if (!item.inventoryId || yuanhaiInventoryIds.has(item.inventoryId)) fail(`yuanhai_inventory_id_duplicate:${item.inventoryId || 'missing'}`)
      yuanhaiInventoryIds.add(item.inventoryId)
      if (!SAJU_YUANHAI_INVENTORY_STATUSES.includes(item.status)) fail(`yuanhai_inventory_status:${item.inventoryId}`)
      if (JSON.stringify(item.sourceIds) !== JSON.stringify(['saju-source-yuanhai-ziping'])) fail(`yuanhai_inventory_source:${item.inventoryId}`)
      if (!Array.isArray(item.locatorIds) || item.locatorIds.length === 0) fail(`yuanhai_inventory_locators:${item.inventoryId}`)
      for (const locatorId of item.locatorIds || []) {
        const locator = locatorsById.get(locatorId)
        if (!locator) fail(`yuanhai_inventory_locator_unknown:${item.inventoryId}:${locatorId}`)
        else if (locator.sourceId !== 'saju-source-yuanhai-ziping') fail(`yuanhai_inventory_locator_source:${item.inventoryId}:${locatorId}`)
      }
      if (!Array.isArray(item.applicability) || item.applicability.length === 0 || !Array.isArray(item.exceptions) || item.exceptions.length === 0 || !Array.isArray(item.forbiddenExtensions) || item.forbiddenExtensions.length === 0) fail(`yuanhai_inventory_boundary:${item.inventoryId}`)
      if (!isObject(item.requiredStructuralResult) || !Array.isArray(item.requiredStructuralResult.ruleIds) || !Array.isArray(item.requiredStructuralResult.fields) || typeof item.requiredStructuralResult.closure !== 'string') fail(`yuanhai_inventory_structural:${item.inventoryId}`)
      if (!isObject(item.sourceDefinedOutput) || typeof item.sourceDefinedOutput.kind !== 'string' || typeof item.sourceDefinedOutput.role !== 'string' || !Array.isArray(item.sourceDefinedOutput.outputShape) || typeof item.sourceDefinedOutput.scope !== 'string') fail(`yuanhai_inventory_output:${item.inventoryId}`)
      if (!['coexistence_only_until_source_priority_is_closed', 'unresolved_composition_frontier'].includes(item.compositionState)) fail(`yuanhai_inventory_composition:${item.inventoryId}`)
      if (item.status === 'adopted_structural_rule') {
        const contract = structuralContractsByRuleId.get(item.contractRuleId)
        if (!contract || contract.work !== WORKS.yuanhai || contract.ruleStatus !== 'adopted_lineage_rule') fail(`yuanhai_inventory_contract:${item.inventoryId}`)
        if (item.requiredStructuralResult.closure !== 'closed_in_existing_contract') fail(`yuanhai_inventory_adopted_closure:${item.inventoryId}`)
      } else if (item.status === 'adopted_semantic_rule') {
        const semanticRule = sourceSemanticRulesByRuleId.get(item.contractRuleId)
        if (!semanticRule || semanticRule.work !== WORKS.yuanhai || semanticRule.status !== 'adopted_lineage_semantic_rule') fail(`yuanhai_inventory_semantic_contract:${item.inventoryId}`)
      } else if (item.contractRuleId !== undefined) {
        fail(`yuanhai_inventory_unadopted_contract:${item.inventoryId}`)
      }
    }
  }
  const compositionFrontier = grammar.sourceBoundedSemanticGrammar?.compositionFrontier
  if (!isObject(compositionFrontier) || compositionFrontier.status !== 'unresolved_composition_frontier' || compositionFrontier.compositionReady !== false || compositionFrontier.sourceProvidesPriority !== false || compositionFrontier.sourceProvidesCombinationRule !== false || compositionFrontier.sourceProvidesTransitionRule !== false) fail('semantic_composition_frontier')
  const expectedNewlyAdopted = (semanticInventory || []).filter(item => item.status === 'newly_adopted_executable').map(item => item.inventoryId)
  if (JSON.stringify(grammar.sourceBoundedSemanticGrammar?.newlyAdoptedRuleIds || []) !== JSON.stringify(expectedNewlyAdopted)) fail('semantic_inventory_newly_adopted_mismatch')

  for (const candidate of grammar.commonCandidates || []) {
    if (candidate.adoptionStatus !== 'not_adopted') fail(`common_candidate_promoted:${candidate.candidateId}`)
    if (candidate.independenceStatus !== 'INDEPENDENT') fail(`common_candidate_independence:${candidate.candidateId}`)
    if (new Set(candidate.sourceIds || []).size < 2) fail(`common_candidate_sources:${candidate.candidateId}`)
  }

  return unique(errors).sort()
}

export function evaluateSajuLineageReadingGrammar(base, grammar = SAJU_LINEAGE_READING_GRAMMAR) {
  const baseValidation = validateDeterministicBaseForInterpretation(base)
  if (!baseValidation.valid) {
    return {
      schemaVersion: grammar.schemaVersion,
      baseValidation,
      rules: [],
      commonCandidates: [],
      boundary: { noRecalculation: true, noSemanticInterpretation: true, conflictsPreserved: true },
    }
  }

  const rules = grammar.rules.map(item => executeRule(item, base))
  const commonCandidates = (grammar.commonCandidates || []).map(candidate => ({
    candidateId: candidate.candidateId,
    status: 'not_adopted',
    reason: candidate.reason,
  }))
  return {
    schemaVersion: grammar.schemaVersion,
    grammarVersion: grammar.version,
    baseValidation,
    rules,
    commonCandidates,
    categoryIds: {
      adoptedLineageRuleIds: grammar.rules.filter(item => item.status === 'adopted_lineage_rule').map(item => item.ruleId),
      unresolvedRuleIds: grammar.rules.filter(item => item.status === 'unresolved').map(item => item.ruleId),
      unsupportedRuleIds: grammar.rules.filter(item => item.status === 'unsupported').map(item => item.ruleId),
    },
    boundary: {
      noRecalculation: rules.every(item => item.noRecalculation),
      noSemanticInterpretation: rules.every(item => item.noSemanticMeaning),
      conflictsPreserved: true,
      commonRulePromotion: false,
      sourceAuthorityPromotion: false,
    },
  }
}

const STRUCTURAL_RESULT_FORBIDDEN_TERMS = Object.freeze([
  'personality',
  'trait',
  'prediction',
  'fortune',
  'strength',
  'weakness',
  'yongshin',
  'heeshin',
  'gyeokguk',
  '길흉',
  '성격',
  '신강',
  '신약',
  '용신',
  '격국',
])

function containsForbiddenStructuralTerm(value) {
  const text = typeof value === 'string' ? value.toLowerCase() : ''
  return STRUCTURAL_RESULT_FORBIDDEN_TERMS.some(term => text.includes(term.toLowerCase()))
}

function requiredLineagePrerequisites(contract, base) {
  return contract.lineagePrerequisites.filter(prerequisite => {
    if (prerequisite.requiredWhen === 'always') return true
    if (prerequisite.requiredWhen === 'dayMasterStem=甲') return isJiaStem(readPath(base, FACT_REFS.dayMaster).value)
    return true
  })
}

function missingLineagePrerequisites(contract, base) {
  return requiredLineagePrerequisites(contract, base)
    .filter(prerequisite => {
      if (prerequisite.prerequisiteId === 'source-specific-shengwang-jue-state') return true
      return !readPath(base, prerequisite.factRef).present
    })
    .map(prerequisite => prerequisite.prerequisiteId)
}

function missingCommonFactRefs(contract, base) {
  return contract.commonBaseFacts
    .filter(binding => !readPath(base, binding.factRef).present)
    .map(binding => binding.factRef)
}

function unsatisfiedStructuralConditions(contract, base) {
  const conditions = []
  if (contract.applicability.some(condition => condition.includes('timeAccuracy must be exact')) && !hasExactTime(base)) conditions.push('timeAccuracy_not_exact')
  if (contract.applicability.some(condition => condition.includes('all four supplied pillar')) && !hasCompletePillarValues(base)) conditions.push('complete_four_pillar_frame_missing')
  if (contract.ruleId === 'rule.yuanhai.hidden-stem-ten-god-label-inventory.v0' && !hasCompleteHiddenStemInventory(base)) conditions.push('complete_hidden_stem_inventory_missing')
  if (contract.ruleId === 'rule.yuanhai.dayun-branch-seun-stem-lens.v0' && !hasCompleteYuanhaiDayunFocusLensInput(base)) conditions.push('complete_dayun_branch_seun_stem_lens_missing')
  if (contract.ruleId === 'rule.sanming.human-element-month-command.v0' && !Array.isArray(readPath(base, FACT_REFS.monthHiddenStems).value)) conditions.push('month_hidden_stem_list_missing')
  if (contract.ruleId === 'rule.ziping.branch-relation-inventory.v0' && !Array.isArray(readPath(base, FACT_REFS.branchRelations).value)) conditions.push('branch_relation_list_missing')
  if (contract.ruleId === 'rule.ziping.explicit-stem-branch-example-match.v0' && !hasCompleteZipingStemBranchExampleInput(base)) conditions.push('complete_stem_branch_example_input_missing')
  if (contract.ruleId === 'rule.ziping.jia-root-branch-scan.v0' && !hasCompleteZipingJiaRootScanInput(base)) conditions.push('complete_jia_root_scan_input_missing')
  if (contract.ruleId === 'rule.ziping.chen-exposure-inventory.v0' && !hasCompleteZipingChenExposureInput(base)) conditions.push('complete_chen_exposure_input_missing')
  if (contract.ruleId === 'rule.ziping.yin-month-exposure-contrast.v0' && !hasCompleteZipingYinMonthExposureInput(base)) conditions.push('complete_yin_month_exposure_contrast_input_missing')
  if (contract.ruleId === 'rule.ditian.jia-wood-seasonal-condition.v0' || contract.ruleId === 'rule.qiongtong.jia-wood-seasonal-clauses.v0') {
    if (isJiaStem(readPath(base, FACT_REFS.dayMaster).value) && !sourceSeasonContext(base)) conditions.push('explicit_season_or_solar_term_context_missing')
  }
  if (contract.ruleId === 'rule.qiongtong.five-phase-number-season-state.v0') {
    conditions.push('source_specific_shengwang_jue_state_resolver_unresolved')
  }
  return conditions
}

function structuralResultDescriptor(contract, ruleEvaluation, classification, extra = {}) {
  return {
    resultId: `result.${contract.ruleId}`,
    classification,
    ruleId: contract.ruleId,
    work: contract.work,
    lineage: contract.lineage,
    sourceIds: [...contract.sourceIds],
    locatorIds: [...contract.locatorIds],
    commonBaseFacts: contract.commonBaseFacts.map(binding => ({ ...binding })),
    lineagePrerequisites: contract.lineagePrerequisites.map(prerequisite => ({ ...prerequisite })),
    applicability: [...contract.applicability],
    procedure: [...contract.procedure],
    stopConditions: [...contract.stopConditions],
    outputContract: {
      origin: contract.output.origin,
      resultKey: contract.output.resultKey,
      fields: [...contract.output.fields],
      semanticExpansion: contract.output.semanticExpansion,
    },
    executionStatus: ruleEvaluation.executionStatus,
    ruleStatus: ruleEvaluation.ruleStatus,
    output: classification === 'derived_structural_result' ? ruleEvaluation.output : null,
    reason: ruleEvaluation.reason,
    deterministic: true,
    noRecalculation: true,
    noSemanticMeaning: true,
    ...extra,
  }
}

function buildLineageConflictLedger(derivedStructuralResults, contractsByRuleId) {
  const grouped = new Map()
  for (const result of derivedStructuralResults) {
    const group = contractsByRuleId.get(result.ruleId)?.conflictGroup
    if (!group) continue
    const list = grouped.get(group) || []
    list.push(result)
    grouped.set(group, list)
  }

  const conflicts = []
  const conflictedResultIds = new Set()
  for (const [conflictGroup, results] of grouped) {
    const sourceIds = unique(results.flatMap(result => result.sourceIds))
    if (results.length < 2 || sourceIds.length < 2) continue
    results.forEach(result => conflictedResultIds.add(result.resultId))
    conflicts.push({
      conflictId: `conflict.${conflictGroup}`,
      classification: 'lineage_conflict',
      conflictGroup,
      ruleIds: results.map(result => result.ruleId),
      sourceIds,
      resultIds: results.map(result => result.resultId),
      status: 'preserved_tension_fail_closed',
      reason: 'multiple lineage-specific structural windows are applicable; no cross-lineage merge or winner selection is permitted',
      deterministic: true,
      noSemanticMeaning: true,
    })
  }
  return {
    conflicts,
    conflictedResultIds,
  }
}

export function checkSajuLineageStructuralResultContract(contracts = SAJU_LINEAGE_STRUCTURAL_CONTRACTS) {
  const errors = []
  const fail = message => errors.push(message)
  if (!Array.isArray(contracts)) return ['contract_not_array']

  const contractIds = new Set()
  const ruleIds = new Set()
  for (const contract of contracts) {
    if (!isObject(contract)) {
      fail('contract_not_object')
      continue
    }
    if (!contract.contractId || contractIds.has(contract.contractId)) fail(`contract_id_duplicate:${contract.contractId || 'missing'}`)
    contractIds.add(contract.contractId)
    if (!ADOPTED_LINEAGE_RULE_IDS.has(contract.ruleId)) fail(`contract_rule_not_adopted:${contract.ruleId}`)
    if (ruleIds.has(contract.ruleId)) fail(`contract_rule_duplicate:${contract.ruleId}`)
    ruleIds.add(contract.ruleId)
    const ruleItem = SAJU_LINEAGE_RULES.find(item => item.ruleId === contract.ruleId)
    if (!ruleItem) continue
    if (contract.ruleStatus !== 'adopted_lineage_rule') fail(`contract_rule_status:${contract.ruleId}`)
    if (JSON.stringify(contract.sourceIds) !== JSON.stringify(ruleItem.sourceIds)) fail(`contract_sources:${contract.ruleId}`)
    if (JSON.stringify(contract.locatorIds) !== JSON.stringify(ruleItem.locatorIds)) fail(`contract_locators:${contract.ruleId}`)
    if (!Array.isArray(contract.commonBaseFacts) || contract.commonBaseFacts.length === 0) fail(`contract_common_facts:${contract.ruleId}`)
    for (const binding of contract.commonBaseFacts || []) {
      if (!isObject(binding) || typeof binding.factRef !== 'string' || binding.origin !== 'frozen_base_common_fact' && binding.origin !== 'frozen_normalized_input') fail(`contract_fact_origin:${contract.ruleId}`)
    }
    if (!Array.isArray(contract.lineagePrerequisites)) fail(`contract_lineage_prerequisites:${contract.ruleId}`)
    else {
      const prerequisiteIds = new Set()
      for (const prerequisite of contract.lineagePrerequisites) {
        if (!isObject(prerequisite) || typeof prerequisite.prerequisiteId !== 'string' || typeof prerequisite.factRef !== 'string' || prerequisite.status !== 'not_in_frozen_public_base') fail(`contract_lineage_prerequisite_shape:${contract.ruleId}`)
        else if (prerequisiteIds.has(prerequisite.prerequisiteId)) fail(`contract_lineage_prerequisite_duplicate:${contract.ruleId}:${prerequisite.prerequisiteId}`)
        else prerequisiteIds.add(prerequisite.prerequisiteId)
      }
    }
    for (const key of ['applicability', 'procedure', 'stopConditions']) if (!Array.isArray(contract[key]) || contract[key].length === 0) fail(`contract_${key}:${contract.ruleId}`)
    if (!isObject(contract.output) || contract.output.origin !== 'lineage_derived_structural_result' || contract.output.semanticExpansion !== false || !contract.output.resultKey || !Array.isArray(contract.output.fields) || contract.output.fields.length === 0) fail(`contract_output:${contract.ruleId}`)
    const serializedOutputSurface = JSON.stringify(contract.output)
    if (containsForbiddenStructuralTerm(serializedOutputSurface)) fail(`contract_semantic_term:${contract.ruleId}`)
    if (contract.conflictGroup !== null && typeof contract.conflictGroup !== 'string') fail(`contract_conflict_group:${contract.ruleId}`)
  }
  for (const adoptedRuleId of ADOPTED_LINEAGE_RULE_IDS) if (!ruleIds.has(adoptedRuleId)) fail(`contract_missing_adopted_rule:${adoptedRuleId}`)
  return unique(errors).sort()
}

export function deriveSajuLineageStructuralResults(base, grammar = SAJU_LINEAGE_READING_GRAMMAR, contracts = SAJU_LINEAGE_STRUCTURAL_CONTRACTS) {
  const contractErrors = checkSajuLineageStructuralResultContract(contracts)
  const baseValidation = validateDeterministicBaseForInterpretation(base)
  if (contractErrors.length > 0 || !baseValidation.valid) {
    return {
      schemaVersion: SAJU_LINEAGE_STRUCTURAL_RESULT_CONTRACT_SCHEMA,
      version: SAJU_LINEAGE_STRUCTURAL_RESULT_CONTRACT_VERSION,
      contractValidation: { valid: contractErrors.length === 0, errors: contractErrors },
      baseValidation,
      categories: {
        executableRules: [],
        prerequisiteGaps: [],
        unresolvedRules: [],
        unsupportedRules: [],
        notApplicableRules: [],
        derivedStructuralResults: [],
        lineageConflicts: [],
      },
      boundary: {
        noRecalculation: true,
        noSemanticInterpretation: true,
        baseMutation: false,
        lineageMerge: false,
      },
    }
  }

  const grammarEvaluation = evaluateSajuLineageReadingGrammar(base, grammar)
  const ruleEvaluationById = new Map(grammarEvaluation.rules.map(item => [item.ruleId, item]))
  const contractsByRuleId = new Map(contracts.map(contract => [contract.ruleId, contract]))
  const categories = {
    executableRules: [],
    prerequisiteGaps: [],
    unresolvedRules: [],
    unsupportedRules: [],
    notApplicableRules: [],
    derivedStructuralResults: [],
    lineageConflicts: [],
  }

  for (const contract of contracts) {
    const ruleEvaluation = ruleEvaluationById.get(contract.ruleId)
    if (!ruleEvaluation) {
      categories.unresolvedRules.push({
        ruleId: contract.ruleId,
        classification: 'unresolved_rule',
        reason: 'rule evaluation missing',
      })
      continue
    }
    if (ruleEvaluation.executionStatus === 'executable_from_frozen_base') {
      categories.executableRules.push(structuralResultDescriptor(contract, ruleEvaluation, 'executable_rule'))
      categories.derivedStructuralResults.push(structuralResultDescriptor(contract, ruleEvaluation, 'derived_structural_result'))
    } else if (ruleEvaluation.executionStatus === 'blocked_missing_base_fact') {
      categories.prerequisiteGaps.push(structuralResultDescriptor(contract, ruleEvaluation, 'prerequisite_gap', {
        missingCommonFactRefs: missingCommonFactRefs(contract, base),
        missingLineagePrerequisiteIds: missingLineagePrerequisites(contract, base),
        unsatisfiedConditions: unsatisfiedStructuralConditions(contract, base),
      }))
    } else if (ruleEvaluation.executionStatus === 'not_applicable_fixture') {
      categories.notApplicableRules.push(structuralResultDescriptor(contract, ruleEvaluation, 'not_applicable_fixture'))
    } else {
      categories.unresolvedRules.push(structuralResultDescriptor(contract, ruleEvaluation, 'unresolved_rule'))
    }
  }

  for (const ruleItem of grammar.rules.filter(item => item.status === 'unresolved')) {
    categories.unresolvedRules.push({
      resultId: `result.${ruleItem.ruleId}`,
      classification: 'unresolved_rule',
      ruleId: ruleItem.ruleId,
      work: ruleItem.work,
      lineage: ruleItem.lineage,
      sourceIds: [...ruleItem.sourceIds],
      locatorIds: [...ruleItem.locatorIds],
      reason: ruleItem.observedRule,
      deterministic: true,
      noRecalculation: true,
      noSemanticMeaning: true,
    })
  }
  for (const ruleItem of grammar.rules.filter(item => item.status === 'unsupported')) {
    categories.unsupportedRules.push({
      resultId: `result.${ruleItem.ruleId}`,
      classification: 'unsupported',
      ruleId: ruleItem.ruleId,
      work: ruleItem.work,
      lineage: ruleItem.lineage,
      sourceIds: [...ruleItem.sourceIds],
      locatorIds: [...ruleItem.locatorIds],
      reason: ruleItem.observedRule,
      deterministic: true,
      noRecalculation: true,
      noSemanticMeaning: true,
    })
  }

  const conflictLedger = buildLineageConflictLedger(categories.derivedStructuralResults, contractsByRuleId)
  categories.lineageConflicts = conflictLedger.conflicts
  categories.derivedStructuralResults = categories.derivedStructuralResults.filter(result => !conflictLedger.conflictedResultIds.has(result.resultId))

  return {
    schemaVersion: SAJU_LINEAGE_STRUCTURAL_RESULT_CONTRACT_SCHEMA,
    version: SAJU_LINEAGE_STRUCTURAL_RESULT_CONTRACT_VERSION,
    contractValidation: { valid: true, errors: [] },
    baseValidation,
    categories,
    boundary: {
      noRecalculation: grammarEvaluation.boundary.noRecalculation,
      noSemanticInterpretation: grammarEvaluation.boundary.noSemanticInterpretation,
      baseMutation: false,
      lineageMerge: categories.lineageConflicts.length === 0,
      conflictsPreserved: true,
    },
  }
}

function sourceSemanticRuleResult(ruleItem, status, output = {}, reason = null, extra = {}) {
  return {
    ruleId: ruleItem.ruleId,
    work: ruleItem.work,
    ruleStatus: ruleItem.status,
    executionStatus: status,
    sourceIds: [...ruleItem.sourceIds],
    locatorIds: [...ruleItem.locatorIds],
    output,
    reason,
    structuralPrerequisiteRuleIds: [...ruleItem.structuralPrerequisiteRuleIds],
    noRecalculation: true,
    noPersonalMeaning: true,
    noCrossLineageMerge: true,
    semanticExpansion: false,
    ...extra,
  }
}

function executeZipingSourceSemanticRule(ruleItem, base, structuralResults) {
  if (ruleItem.ruleId === 'rule.ziping.yin-month-exposure-change.v0') {
    const prerequisiteRuleId = 'rule.ziping.yin-month-exposure-contrast.v0'
    const structuralConflict = (structuralResults.categories.lineageConflicts || []).find(conflict => conflict.ruleIds?.includes(prerequisiteRuleId))
    if (structuralConflict) return sourceSemanticRuleResult(ruleItem, 'not_executable_by_contract', {}, 'the p.7 semantic result is blocked by a preserved structural lineage conflict', {
      structuralConflictId: structuralConflict.conflictId,
    })

    const structuralResult = structuralResults.categories.derivedStructuralResults.find(item => item.ruleId === prerequisiteRuleId)
    if (!structuralResult) {
      const structuralGap = structuralResults.categories.prerequisiteGaps.find(item => item.ruleId === prerequisiteRuleId)
      if (structuralGap) return sourceSemanticRuleResult(ruleItem, 'blocked_missing_base_fact', {}, 'the p.7 semantic rule is blocked by its missing or malformed exact contrast prerequisite', {
        missingStructuralPrerequisite: prerequisiteRuleId,
        structuralGapResultId: structuralGap.resultId,
      })
      const notApplicable = structuralResults.categories.notApplicableRules.find(item => item.ruleId === prerequisiteRuleId)
      if (notApplicable) return sourceSemanticRuleResult(ruleItem, 'not_applicable_fixture', {}, 'the fixture does not satisfy the exact p.7 寅月 contrast')
      return sourceSemanticRuleResult(ruleItem, 'not_executable_by_contract', {}, 'the p.7 semantic rule has no executed exact contrast prerequisite')
    }

    return sourceSemanticRuleResult(ruleItem, 'executable_from_frozen_base', {
      sourceCondition: structuralResult.output.sourceCondition,
      absentVisibleStem: structuralResult.output.absentVisibleStem,
      exposedVisibleStem: structuralResult.output.exposedVisibleStem,
      exposedPositions: structuralResult.output.exposedPositions,
      sourceSelectionStatement: '同知得以作主',
      sourceSemanticScope: 'ziping-p7-寅月-不透甲而透丙-source-clause-only',
    }, null, {
      structuralPrerequisiteResultIds: [structuralResult.resultId],
    })
  }

  if (ruleItem.ruleId !== 'rule.ziping.chen-exposure-use-role.v0') {
    return sourceSemanticRuleResult(ruleItem, 'not_executable_by_contract', {}, ruleItem.observedRule)
  }

  const structuralConflict = (structuralResults.categories.lineageConflicts || []).find(conflict => conflict.ruleIds?.includes('rule.ziping.chen-exposure-inventory.v0'))
  if (structuralConflict) return sourceSemanticRuleResult(ruleItem, 'not_executable_by_contract', {}, 'the p.10 semantic result is blocked by a preserved structural lineage conflict', {
    structuralConflictId: structuralConflict.conflictId,
  })

  const structuralResult = structuralResults.categories.derivedStructuralResults.find(item => item.ruleId === 'rule.ziping.chen-exposure-inventory.v0')
  if (!structuralResult) {
    const structuralGap = structuralResults.categories.prerequisiteGaps.find(item => item.ruleId === 'rule.ziping.chen-exposure-inventory.v0')
    if (structuralGap) return sourceSemanticRuleResult(ruleItem, 'blocked_missing_base_fact', {}, 'the p.10 semantic rule is blocked by its missing or malformed structural exposure prerequisite', {
      missingStructuralPrerequisite: 'rule.ziping.chen-exposure-inventory.v0',
      structuralGapResultId: structuralGap.resultId,
    })
    return sourceSemanticRuleResult(ruleItem, 'not_executable_by_contract', {}, 'the p.10 semantic rule has no executed structural exposure prerequisite')
  }

  const matches = structuralResult.output.namedExposureMatches || []
  if (matches.length === 0) return sourceSemanticRuleResult(ruleItem, 'not_applicable_fixture', {}, 'the exact 甲生辰月 window is present but none of the three source-listed exposure targets is visible')

  const matchedSourceRoleLabels = matches.map(match => {
    const target = ZIPING_P10_EXPOSURE_TARGETS.find(candidate => candidate.sourceStem === match.sourceStem)
    return {
      position: match.position,
      visibleStem: match.visibleStem,
      sourceStem: match.sourceStem,
      sourceRole: target?.sourceRole || null,
    }
  })

  return sourceSemanticRuleResult(ruleItem, 'executable_from_frozen_base', {
    sourceCondition: structuralResult.output.sourceCondition,
    matchedSourceRoleLabels,
    multiplicityPolicy: matches.length > 1 ? '兼透兼用' : '一透一用',
    sourceSemanticScope: 'ziping-p10-甲生辰月-named-source-role-labels-only',
  }, null, {
    structuralPrerequisiteResultIds: [structuralResult.resultId],
  })
}

function sourceSemanticResultDescriptor(contract, ruleEvaluation, classification, extra = {}) {
  const sourceProvenance = Object.fromEntries(contract.sourceIds.map(sourceId => {
    const source = SAJU_LINEAGE_SOURCE_PROFILES.find(item => item.sourceId === sourceId)
    return [sourceId, source?.byteSha256 || null]
  }))
  const structuralPrerequisiteRuleIds = contract.structuralPrerequisites.map(prerequisite => prerequisite.prerequisiteRuleId)
  const structuralPrerequisiteResultIds = [...(ruleEvaluation.structuralPrerequisiteResultIds || [])]
  const requiredStructuralResult = {
    ruleIds: structuralPrerequisiteRuleIds,
    resultIds: structuralPrerequisiteResultIds,
    state: ruleEvaluation.structuralConflictId
      ? 'conflict_preserved'
      : ruleEvaluation.structuralGapResultId
        ? 'blocked_missing'
        : structuralPrerequisiteRuleIds.length === 0
          ? 'not_required'
          : structuralPrerequisiteResultIds.length === structuralPrerequisiteRuleIds.length
            ? 'satisfied'
            : 'not_satisfied',
  }
  const conflictState = {
    status: ruleEvaluation.structuralConflictId ? 'preserved_tension_fail_closed' : 'not_observed',
    conflictId: ruleEvaluation.structuralConflictId || null,
    policy: contract.conflictPolicy,
    winnerSelected: false,
    failClosed: true,
  }
  const semanticRoleResult = {
    resultKey: contract.output.resultKey,
    fields: [...contract.output.fields],
    origin: contract.output.origin,
    materialized: classification === 'derived_source_bounded_semantic_result',
  }
  const provenance = {
    schema: SAJU_LINEAGE_SOURCE_SEMANTIC_RESULT_SCHEMA,
    version: SAJU_LINEAGE_SOURCE_SEMANTIC_RESULT_VERSION,
    contractId: contract.contractId,
    ruleId: contract.ruleId,
    sourceIds: [...contract.sourceIds],
    lineage: contract.lineage,
    locatorIds: [...contract.locatorIds],
    sourceByteSha256: { ...sourceProvenance },
  }
  return {
    resultId: `semantic-result.${contract.ruleId}`,
    classification,
    ruleId: contract.ruleId,
    work: contract.work,
    lineage: contract.lineage,
    sourceIds: [...contract.sourceIds],
    locatorIds: [...contract.locatorIds],
    sourceProvenance,
    provenance,
    commonBaseFacts: contract.commonBaseFacts.map(binding => ({ ...binding })),
    structuralPrerequisites: contract.structuralPrerequisites.map(prerequisite => ({ ...prerequisite })),
    requiredStructuralResult,
    applicability: [...contract.applicability],
    procedure: [...contract.procedure],
    stopConditions: [...contract.stopConditions],
    outputContract: { ...contract.output, fields: [...contract.output.fields] },
    semanticBoundary: { ...contract.semanticBoundary },
    semanticRoleResult,
    conflictState,
    forbiddenExtensions: [...contract.forbiddenExtensions],
    executionStatus: ruleEvaluation.executionStatus,
    ruleStatus: ruleEvaluation.ruleStatus,
    output: classification === 'derived_source_bounded_semantic_result' ? ruleEvaluation.output : null,
    reason: ruleEvaluation.reason,
    structuralPrerequisiteResultIds,
    structuralGapResultId: ruleEvaluation.structuralGapResultId || null,
    structuralConflictId: ruleEvaluation.structuralConflictId || null,
    deterministic: true,
    noRecalculation: true,
    noPersonalMeaning: true,
    noCrossLineageMerge: true,
    semanticExpansion: false,
    ...extra,
  }
}

export function checkSajuLineageSourceSemanticResultContract(contracts = SAJU_ZIPING_SOURCE_SEMANTIC_CONTRACTS) {
  const errors = []
  const fail = message => errors.push(message)
  if (!Array.isArray(contracts)) return ['contract_not_array']

  const sourceIds = new Set(SAJU_LINEAGE_SOURCE_PROFILES.map(source => source.sourceId))
  const locatorIds = new Set(SAJU_LINEAGE_LOCATORS.map(locator => locator.observationId))
  const semanticRuleIds = new Set(SAJU_ZIPING_SOURCE_SEMANTIC_RULES.map(ruleItem => ruleItem.ruleId))
  const structuralRuleIds = new Set(SAJU_LINEAGE_RULES.map(ruleItem => ruleItem.ruleId))
  const contractIds = new Set()
  const coveredRuleIds = new Set()

  for (const contract of contracts) {
    if (!isObject(contract)) {
      fail('contract_not_object')
      continue
    }
    if (!contract.contractId || contractIds.has(contract.contractId)) fail(`contract_id_duplicate:${contract.contractId || 'missing'}`)
    contractIds.add(contract.contractId)
    if (!semanticRuleIds.has(contract.ruleId)) fail(`contract_rule_unknown:${contract.ruleId}`)
    if (coveredRuleIds.has(contract.ruleId)) fail(`contract_rule_duplicate:${contract.ruleId}`)
    coveredRuleIds.add(contract.ruleId)
    const ruleItem = SAJU_ZIPING_SOURCE_SEMANTIC_RULES.find(item => item.ruleId === contract.ruleId)
    if (!ruleItem) continue
    if (!SAJU_LINEAGE_SOURCE_SEMANTIC_RULE_STATUSES.includes(contract.ruleStatus)) fail(`contract_rule_status:${contract.ruleId}`)
    if (contract.ruleStatus !== ruleItem.status) fail(`contract_rule_status_mismatch:${contract.ruleId}`)
    if (JSON.stringify(contract.sourceIds) !== JSON.stringify(ruleItem.sourceIds)) fail(`contract_sources:${contract.ruleId}`)
    if (JSON.stringify(contract.locatorIds) !== JSON.stringify(ruleItem.locatorIds)) fail(`contract_locators:${contract.ruleId}`)
    for (const sourceId of contract.sourceIds || []) if (!sourceIds.has(sourceId)) fail(`contract_source_unknown:${contract.ruleId}:${sourceId}`)
    for (const locatorId of contract.locatorIds || []) if (!locatorIds.has(locatorId)) fail(`contract_locator_unknown:${contract.ruleId}:${locatorId}`)
    if (!Array.isArray(contract.commonBaseFacts) || contract.commonBaseFacts.length === 0) fail(`contract_common_facts:${contract.ruleId}`)
    if (!Array.isArray(contract.structuralPrerequisites)) fail(`contract_structural_prerequisites:${contract.ruleId}`)
    for (const prerequisite of contract.structuralPrerequisites || []) {
      if (!isObject(prerequisite) || !structuralRuleIds.has(prerequisite.prerequisiteRuleId) || prerequisite.status !== 'adopted_lineage_structural_result' || prerequisite.resultOrigin !== 'lineage_derived_structural_result') fail(`contract_structural_prerequisite_shape:${contract.ruleId}`)
    }
    for (const key of ['applicability', 'procedure', 'stopConditions']) if (!Array.isArray(contract[key]) || contract[key].length === 0) fail(`contract_${key}:${contract.ruleId}`)
    if (!isObject(contract.output) || contract.output.origin !== 'lineage_derived_source_bounded_semantic_result' || contract.output.semanticExpansion !== false || contract.output.personalMeaning !== false || !contract.output.resultKey || !Array.isArray(contract.output.fields) || contract.output.fields.length === 0) fail(`contract_output:${contract.ruleId}`)
    if (!isObject(contract.semanticBoundary) || contract.semanticBoundary.personalMeaning !== false || contract.semanticBoundary.crossLineageMerge !== false || contract.semanticBoundary.commonRulePromotion !== false) fail(`contract_semantic_boundary:${contract.ruleId}`)
    if (JSON.stringify(contract.requiredResultFields) !== JSON.stringify(SAJU_LINEAGE_SOURCE_SEMANTIC_RESULT_REQUIRED_FIELDS)) fail(`contract_required_result_fields:${contract.ruleId}`)
    if (!Array.isArray(contract.forbiddenExtensions) || contract.forbiddenExtensions.length === 0) fail(`contract_forbidden_extensions:${contract.ruleId}`)
    if (typeof contract.conflictPolicy !== 'string' || contract.conflictPolicy.length === 0) fail(`contract_conflict_policy:${contract.ruleId}`)
    if (ruleItem.status === 'adopted_lineage_semantic_rule' && contract.structuralPrerequisites.length === 0) fail(`adopted_semantic_prerequisite_missing:${contract.ruleId}`)
    if (ruleItem.semanticBoundary?.personalMeaning !== false || ruleItem.semanticBoundary?.crossLineageMerge !== false || ruleItem.semanticBoundary?.commonRulePromotion !== false) fail(`semantic_boundary:${contract.ruleId}`)
  }

  for (const ruleItem of SAJU_ZIPING_SOURCE_SEMANTIC_RULES) if (!coveredRuleIds.has(ruleItem.ruleId)) fail(`contract_missing_semantic_rule:${ruleItem.ruleId}`)
  return unique(errors).sort()
}

export function deriveSajuLineageSourceSemanticResults(base, structuralResults = null, contracts = SAJU_ZIPING_SOURCE_SEMANTIC_CONTRACTS) {
  const contractErrors = checkSajuLineageSourceSemanticResultContract(contracts)
  const baseValidation = validateDeterministicBaseForInterpretation(base)
  const structural = structuralResults || deriveSajuLineageStructuralResults(base)
  const emptyCategories = {
    adoptedSemanticRules: [],
    contextBoundCandidates: [],
    unresolvedBoundaries: [],
    prerequisiteGaps: [],
    notApplicableRules: [],
    derivedSourceBoundedSemanticResults: [],
    lineageConflicts: [],
  }
  if (contractErrors.length > 0 || !baseValidation.valid || !structural.contractValidation?.valid) {
    return {
      schemaVersion: SAJU_LINEAGE_SOURCE_SEMANTIC_RESULT_SCHEMA,
      version: SAJU_LINEAGE_SOURCE_SEMANTIC_RESULT_VERSION,
      contractValidation: { valid: contractErrors.length === 0, errors: contractErrors },
      baseValidation,
      structuralResultContractValidation: structural.contractValidation,
      categories: emptyCategories,
      boundary: {
        noRecalculation: true,
        baseMutation: false,
        publicBaseMutation: false,
        sourceAuthorityPromotion: false,
        commonRulePromotion: false,
        crossLineageMerge: false,
        personalMeaning: false,
        semanticExpansion: false,
        conflictsPreserved: true,
      },
    }
  }

  const ruleEvaluationById = new Map(SAJU_ZIPING_SOURCE_SEMANTIC_RULES.map(ruleItem => [ruleItem.ruleId, executeZipingSourceSemanticRule(ruleItem, base, structural)]))
  const contractsByRuleId = new Map(contracts.map(contract => [contract.ruleId, contract]))
  const categories = { ...emptyCategories }

  for (const ruleItem of SAJU_ZIPING_SOURCE_SEMANTIC_RULES) {
    const contract = contractsByRuleId.get(ruleItem.ruleId)
    const evaluation = ruleEvaluationById.get(ruleItem.ruleId)
    if (!contract || !evaluation) continue

    if (ruleItem.status === 'adopted_lineage_semantic_rule') categories.adoptedSemanticRules.push(sourceSemanticResultDescriptor(contract, evaluation, 'executable_semantic_rule'))
    if (ruleItem.status === 'context_bound_candidate') categories.contextBoundCandidates.push(sourceSemanticResultDescriptor(contract, evaluation, 'context_bound_candidate'))
    if (ruleItem.status === 'unresolved') categories.unresolvedBoundaries.push(sourceSemanticResultDescriptor(contract, evaluation, 'unresolved_boundary'))

    if (evaluation.executionStatus === 'executable_from_frozen_base') {
      categories.derivedSourceBoundedSemanticResults.push(sourceSemanticResultDescriptor(contract, evaluation, 'derived_source_bounded_semantic_result'))
    } else if (evaluation.executionStatus === 'blocked_missing_base_fact') {
      categories.prerequisiteGaps.push(sourceSemanticResultDescriptor(contract, evaluation, 'prerequisite_gap'))
    } else if (evaluation.executionStatus === 'not_applicable_fixture') {
      categories.notApplicableRules.push(sourceSemanticResultDescriptor(contract, evaluation, 'not_applicable_fixture'))
    }
    if (evaluation.structuralConflictId) categories.lineageConflicts.push({
      conflictId: evaluation.structuralConflictId,
      classification: 'lineage_conflict',
      ruleIds: [...ruleItem.structuralPrerequisiteRuleIds],
      sourceIds: [...ruleItem.sourceIds],
      status: 'preserved_tension_fail_closed',
      reason: 'semantic result was not materialized because its structural prerequisite conflict was preserved',
      deterministic: true,
      noPersonalMeaning: true,
    })
  }

  return {
    schemaVersion: SAJU_LINEAGE_SOURCE_SEMANTIC_RESULT_SCHEMA,
    version: SAJU_LINEAGE_SOURCE_SEMANTIC_RESULT_VERSION,
    contractValidation: { valid: true, errors: [] },
    baseValidation,
    structuralResultContractValidation: structural.contractValidation,
    categories,
    boundary: {
      noRecalculation: categories.derivedSourceBoundedSemanticResults.every(result => result.noRecalculation),
      baseMutation: false,
      publicBaseMutation: false,
      sourceAuthorityPromotion: false,
      commonRulePromotion: false,
      crossLineageMerge: false,
      personalMeaning: categories.derivedSourceBoundedSemanticResults.every(result => result.noPersonalMeaning),
      semanticExpansion: categories.derivedSourceBoundedSemanticResults.some(result => result.semanticExpansion),
      conflictsPreserved: true,
    },
  }
}

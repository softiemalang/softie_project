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
  {
    candidateId: 'common.five-lineage-seasonal-structural-surface',
    sourceRuleIds: [
      'rule.yuanhai.day-anchor-month-command-frame.v0',
      'rule.sanming.seasonal-state-inventory.v0',
      'rule.ziping.month-command-selection.v0',
      'rule.ditian.shape-example-inventory.v0',
      'rule.qiongtong.day-stem-section-frame.v0',
    ],
    sourceIds: [
      'saju-source-yuanhai-ziping',
      'saju-source-sanming-tonghui',
      'saju-source-ziping-zhenquan',
      'saju-source-ditian-sui',
      'saju-source-qiongtong-baojian',
    ],
    status: 'not_emitted_as_common_candidate',
    reason: '다섯 문헌은 일간·월령·계절을 서로 다른 입력축과 출력층으로 다루며, exact example inventory와 seasonal vocabulary를 동일 predicate로 만들 수 없다. source priority·transition·독립 authority가 닫히지 않아 common candidate로 승격하지 않는다.',
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
  loc('saju-source-sanming-tonghui', 'sanming-p67-seasonal-state', 67, '67', '論五行旺相休囚死并寄生十二宮', 'seasonal five-phase state vocabulary and the source-local spring/summer/long-summer/autumn/winter windows', '春木旺 · 夏火旺 · 六月土旺 · 秋金旺 · 冬水旺'),
  loc('saju-source-sanming-tonghui', 'sanming-p68-twelve-palace-vocabulary', 68, '68', '論五行旺相休囚死并寄生十二宮', 'the twelve source stage labels and their bounded vocabulary; no modern stage resolver is imported', '長生 · 沐浴 · 冠帶 · 臨官 · 帝旺 · 衰 · 病 · 死 · 墓 · 絕 · 胎 · 養'),
  loc('saju-source-sanming-tonghui', 'sanming-p69-month-hour-method', 69, '69', '論遁月時', 'month-from-year and hour-from-day procedure surface', '遁月从年 · 遁时从日'),
  loc('saju-source-sanming-tonghui', 'sanming-p70-year-month-day-hour', 70, '70', '論年月日時', 'four-pillar framing and day-as-host comparison', '年月日時排成四柱 · 子平以日看'),
  loc('saju-source-sanming-tonghui', 'sanming-p72-fetal-and-seat', 72, '72', '論胎元 / 論坐命官', '胎元 and 坐命官 calculation surfaces without a public Base prerequisite contract', '論胎元 · 論坐命官'),
  loc('saju-source-sanming-tonghui', 'sanming-p73-dayun-procedure', 73, '73', '論大運', 'direction, section-distance, start-age and time-conversion wording; exact policy bridge remains separate', '陽男陰女 · 三日為一歲 · 一日四個月 · 一時辰十日'),
  loc('saju-source-sanming-tonghui', 'sanming-p77-timing-outcome-summary', 77, '77', '總論歲運', 'timing and outcome composition surface; source priority is not adopted', '大運 · 流年 · 吉凶'),
  loc('saju-source-sanming-tonghui', 'sanming-p78-stem-combination', 78, '78', '論十干合', 'stem-combination surface with source-local relation and transformation wording', '甲己合 · 乙庚合 · 丙辛合 · 丁壬合 · 戊癸合'),
  loc('saju-source-sanming-tonghui', 'sanming-p80-stem-transformation-general', 80, '80', '論進交退伏', 'general 化氣 prerequisite wording for day stem, month, time, and 旺氣', '大凡化氣 · 得旺氣於時 · 月中旺氣 · 全吉'),
  loc('saju-source-sanming-tonghui', 'sanming-p81-stem-transformation', 81, '81', '論十干化氣', '化氣 conditions and outcome-adjacent clauses; no complete independent priority resolver adopted', '化氣 · 得時 · 得地'),
  loc('saju-source-sanming-tonghui', 'sanming-p85-branch-combinations', 85, '85', '論支元六合 / 論支元三合', 'branch combination inventories and transformation context', '六合 · 三合'),
  loc('saju-source-sanming-tonghui', 'sanming-p90-three-punishments', 90, '90', '論三刑', 'branch punishment surface; interaction and outcome conditions remain context-bound', '三刑'),
  loc('saju-source-sanming-tonghui', 'sanming-p93-branch-conflict', 93, '93', '論沖擊', 'branch conflict surface with source-local interpretation context', '沖擊'),
  loc('saju-source-sanming-tonghui', 'sanming-p95-stem-lu', 95, '95', '論十干禄', 'stem-to-禄 mapping surface; personal/outcome extension is not adopted', '十干禄'),
  loc('saju-source-sanming-tonghui', 'sanming-p100-travel-horse', 100, '100', '論驛馬', '驛馬 mapping surface with source-local conditions', '驛馬'),
  loc('saju-source-sanming-tonghui', 'sanming-p106-shensha', 106, '106', '論天乙貴人', '神煞 inventory beginning; no public semantic result is adopted', '天乙貴人'),
  loc('saju-source-sanming-tonghui', 'sanming-p130-shensha-summary', 130, '130', '總論諸神煞', 'compiled shensha summary and outcome clauses', '總論諸神煞'),
  loc('saju-source-sanming-tonghui', 'sanming-p137-stem-branch-outcomes', 137, '137', '論十干坐支兼得月時及行運吉凶', 'stem/branch, month/hour and luck-outcome surface', '行運吉凶'),
  loc('saju-source-sanming-tonghui', 'sanming-p159-elemental-outcomes', 159, '159', '論水',  'elemental month/region outcome surface through the five-phase sections', '五行時地分野吉凶'),
  loc('saju-source-sanming-tonghui', 'sanming-p162-role-nomenclature', 162, '162', '論古人立印食官财名义', 'source-defined role nomenclature from supplied stem-role labels; family analogy and outcome prose are excluded', '印绶 · 食神 · 官煞 · 妻财'),
  loc('saju-source-sanming-tonghui', 'sanming-p164-239-role-chapters', 164, '164–239', '論正官 and role chapters', 'role-specific chapter surfaces with month-command, pattern, support/opposition and outcome conditions', '正官 · 偏官 · 正財 · 印綬 · 傷官 · 食神'),
  loc('saju-source-sanming-tonghui', 'sanming-p242-261-personal-surfaces', 242, '242–261', '論性情相貌 / 論六親', 'personality, body, gender, childhood and family surfaces outside the public grammar', '性情相貌 · 疾病 · 女命 · 六親'),
  loc('saju-source-sanming-tonghui', 'sanming-p300-370-worked-cases', 300, '300–370', '時斷 and worked cases', 'worked examples and case-bound outcome prose without a universal source predicate', '時斷'),
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
  loc('saju-source-ditian-sui', 'ditian-p2-heaven-earth-human-frame', 2, '2', '通天論', 'day stem, branch, and hidden-stem heaven/earth/human frame', '天元 · 地元 · 人元'),
  loc('saju-source-ditian-sui', 'ditian-p3-progress-retreat-shunbei', 3, '3', '通天論 / 進退', '進退 and 順悖 vocabulary with adjacent outcome language', '理承氣行 · 進兮退兮 · 順則吉 · 悖則凶'),
  loc('saju-source-ditian-sui', 'ditian-p10-branch-categories', 10, '10', '地支論', 'source-listed yin/yang, four-birth, four-storehouse, and four-defeat branch groups', '陽支 · 陰支 · 四生 · 四庫 · 四敗'),
  loc('saju-source-ditian-sui', 'ditian-p12-shape-examples', 12, '12', '形象論', 'exact 形全/形缺 examples for named day stems and seasonal branch windows', '兩氣合而成象 · 五氣聚而成形 · 形全 · 形缺'),
  loc('saju-source-ditian-sui', 'ditian-p13-fang-ju-examples', 13, '13', '方局論', 'exact 方 and 局 branch-set examples before adjacent 格局 discussion', '寅卯辰東方 · 亥卯未木局 · 方不可混局'),
  loc('saju-source-ditian-sui', 'ditian-p13-p14-geju-surface', 13, '13–14', '格局論', '格局 and 月支之神透於天干 wording with selection/outcome context', '格之真者 · 月支之神 · 透於天干'),
  loc('saju-source-ditian-sui', 'ditian-p15-p17-conghua-dayun', 15, '15–17', '從化 / 歲運', '從化 and 歲運 sections with conditional outcome prose', '從化 · 歲運'),
  loc('saju-source-ditian-sui', 'ditian-p18-p20-tiyong', 18, '18–20', '體用論', 'multiple body/use configurations and distinction from 用神之用', '道有體用 · 體用之用 · 用神之用'),
  loc('saju-source-ditian-sui', 'ditian-p24-p27-yuanliu-qingzhuo', 24, '24–27', '源流 / 清濁 / 形象', 'source-flow, clarity/turbidity, and later 形象 surfaces with mixed structural and outcome language', '源流 · 清濁 · 形象'),
  loc('saju-source-qiongtong-baojian', 'qiongtong-p2-five-phase-number-and-season', 2, '2', '五行總論', 'element numbers, state labels, and explicit 生旺/死绝 multiplier wording', '其数则水一、火二、木三、金四、土五 · 生旺加倍，死绝减半'),
  loc('saju-source-qiongtong-baojian', 'qiongtong-p3-jia-section', 3, '3', '十干分論 / 論木 / 甲木', '甲木 section heading and following month-specific clauses', '論甲木 · 三春甲木'),
  loc('saju-source-qiongtong-baojian', 'qiongtong-p4-spring-jia-wood', 4, '4', '三春甲木', 'spring 甲木 conditional sequence', '春月之木 · 初春余寒 · 以火温暖'),
  loc('saju-source-qiongtong-baojian', 'qiongtong-p5-spring-jia-wood-continuation', 5, '5', '正月甲木', 'month-specific 甲木 clauses and combinations', '正月甲木'),
  loc('saju-source-qiongtong-baojian', 'qiongtong-p7-summer-jia-wood', 7, '7', '三夏甲木', 'summer 甲木 conditional sequence', '三夏甲木'),
  loc('saju-source-qiongtong-baojian', 'qiongtong-p13-yi-section', 13, '13', '論乙木 / 三春乙木', '乙木 section heading and following month-specific clauses', '論乙木 · 三春乙木'),
  loc('saju-source-qiongtong-baojian', 'qiongtong-p21-bing-section', 21, '21', '論丙火 / 三春丙火', '丙火 section heading and following month-specific clauses', '論丙火 · 三春丙火'),
  loc('saju-source-qiongtong-baojian', 'qiongtong-p32-ding-section', 32, '32', '論丁火 / 三春丁火', '丁火 section heading and following month-specific clauses', '論丁火 · 三春丁火'),
  loc('saju-source-qiongtong-baojian', 'qiongtong-p40-wu-section', 40, '40', '論戊土 / 三春戊土', '戊土 section heading and following month-specific clauses', '論戊土 · 三春戊土'),
  loc('saju-source-qiongtong-baojian', 'qiongtong-p49-ji-section', 49, '49', '論己土 / 三春己土', '己土 section heading and following month-specific clauses', '論己土 · 三春己土'),
  loc('saju-source-qiongtong-baojian', 'qiongtong-p55-geng-section', 55, '55', '論庚金 / 三春庚金', '庚金 section heading and following month-specific clauses', '論庚金 · 三春庚金'),
  loc('saju-source-qiongtong-baojian', 'qiongtong-p64-xin-section', 64, '64', '論辛金 / 三春辛金', '辛金 section heading and following month-specific clauses', '論辛金 · 三春辛金'),
  loc('saju-source-qiongtong-baojian', 'qiongtong-p75-ren-section', 75, '75', '論壬水 / 三春壬水', '壬水 section heading and following month-specific clauses', '論壬水 · 三春壬水'),
  loc('saju-source-qiongtong-baojian', 'qiongtong-p83-gui-section', 83, '83', '論癸水 / 三春癸水', '癸水 section heading and following month-specific clauses', '論癸水 · 三春癸水'),
])

const LOCATOR_BY_ID = new Map(SAJU_LINEAGE_LOCATORS.map(item => [item.observationId, item]))

// These are the three exact source-listed targets in the p.10 甲生辰月
// example.  They are deliberately not a complete 透/透干 map.
const ZIPING_P10_EXPOSURE_TARGETS = Object.freeze([
  Object.freeze({ sourceStem: '戊', inputStems: Object.freeze(['무', '戊']), sourceRole: '偏财' }),
  Object.freeze({ sourceStem: '癸', inputStems: Object.freeze(['계', '癸']), sourceRole: '正印' }),
  Object.freeze({ sourceStem: '乙', inputStems: Object.freeze(['을', '乙']), sourceRole: '月劫' }),
])

const SANMING_SEASONAL_WINDOWS = Object.freeze([
  Object.freeze({
    seasonWindow: 'spring',
    monthBranches: Object.freeze(['寅', '인', '卯', '묘', '辰', '진']),
    elementStates: Object.freeze({ 목: '旺', 화: '相', 수: '休', 금: '囚', 토: '死' }),
  }),
  Object.freeze({
    seasonWindow: 'summer',
    monthBranches: Object.freeze(['巳', '사', '午', '오']),
    elementStates: Object.freeze({ 목: '休', 화: '旺', 토: '相', 수: '囚', 금: '死' }),
  }),
  Object.freeze({
    seasonWindow: 'long_summer',
    monthBranches: Object.freeze(['未', '미']),
    elementStates: Object.freeze({ 목: '囚', 화: '休', 토: '旺', 금: '相', 수: '死' }),
  }),
  Object.freeze({
    seasonWindow: 'autumn',
    monthBranches: Object.freeze(['申', '신', '酉', '유', '戌', '술']),
    elementStates: Object.freeze({ 목: '死', 화: '囚', 토: '休', 금: '旺', 수: '相' }),
  }),
  Object.freeze({
    seasonWindow: 'winter',
    monthBranches: Object.freeze(['亥', '해', '子', '자', '丑', '축']),
    elementStates: Object.freeze({ 목: '相', 화: '死', 토: '囚', 금: '休', 수: '旺' }),
  }),
])

const SANMING_TWELVE_PALACE_LABELS = Object.freeze([
  '長生',
  '沐浴',
  '冠帶',
  '臨官',
  '帝旺',
  '衰',
  '病',
  '死',
  '墓',
  '絕',
  '胎',
  '養',
])

const SANMING_SOURCE_ROLE_BY_SUPPLIED_LABEL = Object.freeze({
  정인: '印綬',
  편인: '枭',
  식신: '食神',
  상관: '傷官',
  정관: '正官',
  편관: '偏官',
  정재: '妻財',
  편재: '妻財',
  겁재: '劫',
})

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

const SOURCE_STEM_BY_INPUT = Object.freeze({
  갑: '甲', 甲: '甲',
  을: '乙', 乙: '乙',
  병: '丙', 丙: '丙',
  정: '丁', 丁: '丁',
  무: '戊', 戊: '戊',
  기: '己', 己: '己',
  경: '庚', 庚: '庚',
  신: '辛', 辛: '辛',
  임: '壬', 壬: '壬',
  계: '癸', 癸: '癸',
})

const SOURCE_BRANCH_BY_INPUT = Object.freeze({
  자: '子', 子: '子',
  축: '丑', 丑: '丑',
  인: '寅', 寅: '寅',
  묘: '卯', 卯: '卯',
  진: '辰', 辰: '辰',
  사: '巳', 巳: '巳',
  오: '午', 午: '午',
  미: '未', 未: '未',
  신: '申', 申: '申',
  유: '酉', 酉: '酉',
  술: '戌', 戌: '戌',
  해: '亥', 亥: '亥',
})

const DITIAN_BRANCH_GROUPS = Object.freeze({
  양지: Object.freeze(['子', '寅', '辰', '午', '申', '戌']),
  음지: Object.freeze(['丑', '卯', '巳', '未', '酉', '亥']),
  사생: Object.freeze(['寅', '申', '巳', '亥']),
  사고: Object.freeze(['辰', '戌', '丑', '未']),
  사패: Object.freeze(['子', '午', '卯', '酉']),
})

const DITIAN_SHAPE_EXAMPLES = Object.freeze([
  Object.freeze({ sourceStem: '甲', monthBranches: Object.freeze(['寅', '卯', '辰']), result: '形全', sourceExample: '甲木生於寅卯辰月' }),
  Object.freeze({ sourceStem: '丙', monthBranches: Object.freeze(['巳', '午', '未']), result: '形全', sourceExample: '丙火生於巳午未月' }),
  Object.freeze({ sourceStem: '戊', monthBranches: Object.freeze(['寅', '卯', '辰']), result: '形缺', sourceExample: '戊土生於寅卯辰月' }),
  Object.freeze({ sourceStem: '庚', monthBranches: Object.freeze(['巳', '午', '未']), result: '形缺', sourceExample: '庚金生於巳午未月' }),
])

const DITIAN_FANG_JU_EXAMPLES = Object.freeze([
  Object.freeze({ sourceBranchSet: Object.freeze(['寅', '卯', '辰']), relation: '方', label: '東方', sourceExample: '寅卯辰東方' }),
  Object.freeze({ sourceBranchSet: Object.freeze(['亥', '卯', '未']), relation: '局', label: '木局', sourceExample: '亥卯未木局' }),
])

const QIONGTONG_ELEMENT_NUMBERS = Object.freeze({ 水: 1, 火: 2, 木: 3, 金: 4, 土: 5 })

const QIONGTONG_DAY_STEM_SECTIONS = Object.freeze({
  甲: Object.freeze({ locatorId: 'qiongtong-p3-jia-section', pdfPageStart: 3, pdfPageEnd: 12 }),
  乙: Object.freeze({ locatorId: 'qiongtong-p13-yi-section', pdfPageStart: 13, pdfPageEnd: 20 }),
  丙: Object.freeze({ locatorId: 'qiongtong-p21-bing-section', pdfPageStart: 21, pdfPageEnd: 31 }),
  丁: Object.freeze({ locatorId: 'qiongtong-p32-ding-section', pdfPageStart: 32, pdfPageEnd: 39 }),
  戊: Object.freeze({ locatorId: 'qiongtong-p40-wu-section', pdfPageStart: 40, pdfPageEnd: 48 }),
  己: Object.freeze({ locatorId: 'qiongtong-p49-ji-section', pdfPageStart: 49, pdfPageEnd: 54 }),
  庚: Object.freeze({ locatorId: 'qiongtong-p55-geng-section', pdfPageStart: 55, pdfPageEnd: 64 }),
  辛: Object.freeze({ locatorId: 'qiongtong-p64-xin-section', pdfPageStart: 64, pdfPageEnd: 73 }),
  壬: Object.freeze({ locatorId: 'qiongtong-p75-ren-section', pdfPageStart: 75, pdfPageEnd: 82 }),
  癸: Object.freeze({ locatorId: 'qiongtong-p83-gui-section', pdfPageStart: 83, pdfPageEnd: 90 }),
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
    ruleId: 'rule.sanming.seasonal-state-inventory.v0',
    work: WORKS.sanming,
    lineage: 'sanming_local_export',
    status: 'adopted_lineage_rule',
    ruleCompleteness: 'bounded_seasonal_state_inventory',
    executionStatus: 'executable_from_frozen_base',
    sourceIds: ['saju-source-sanming-tonghui'],
    locatorIds: ['sanming-p67-seasonal-state', 'sanming-p68-twelve-palace-vocabulary'],
    observedRule: 'p.67 directly orders the source seasonal state vocabulary as spring 木旺, summer 火旺, sixth-month 土旺, autumn 金旺, winter 水旺; p.68 lists the twelve source stage labels. The adopted result is a vocabulary/window inventory only.',
    preconditions: ['the supplied month branch maps to one source seasonal window', 'the supplied element distribution envelope contains the five element keys'],
    inputFacts: [FACT_REFS.monthBranch, FACT_REFS.elements],
    orderedSteps: ['bind the supplied month branch to the explicitly listed source seasonal window', 'emit the p.67 旺相休囚死 vocabulary by element for that window', 'retain the p.68 twelve stage labels as an un-applied source vocabulary', 'stop before balance, force, use selection, fortune, or personal meaning'],
    structuralOutput: ['seasonalStateInventory', 'sourceTwelvePalaceVocabulary'],
    exceptions: ['未 is retained as the source sixth-month 土旺 window rather than folded into the summer window', 'no generic 十二運星 table or other lineage state resolver is used'],
    conflictPolicy: 'preserve the Sanming seasonal window as a lineage-specific classification; do not merge it with Qiongtong 生旺/死绝 or another lineage seasonal clause',
  }),
  rule({
    ruleId: 'rule.sanming.visible-stem-frame.v0',
    work: WORKS.sanming,
    lineage: 'sanming_local_export',
    status: 'adopted_lineage_rule',
    ruleCompleteness: 'bounded_visible_stem_frame',
    executionStatus: 'executable_from_frozen_base',
    sourceIds: ['saju-source-sanming-tonghui'],
    locatorIds: ['sanming-p162-role-nomenclature'],
    observedRule: 'p.162 opens its role-nomenclature explanation from the day-master and supplied visible stem relations; this structural prerequisite records that visible-stem frame without assigning a role or family meaning.',
    preconditions: ['exact time and day-master FACT are present', 'all four supplied pillarFacts entries contain a visible stem'],
    inputFacts: [FACT_REFS.dayMaster, FACT_REFS.pillarFacts, FACT_REFS.timeAccuracy],
    orderedSteps: ['bind the supplied day-master as the source anchor', 'enumerate the four supplied visible stems by pillar position', 'pass the frame to the separate p.162 role-nomenclature rule', 'stop before any role, family, outcome, or personal meaning'],
    structuralOutput: ['visibleStemFrame'],
    exceptions: ['the frame is an input inventory, not a generic ten-god calculator', 'an unavailable visible stem blocks the dependent semantic rule'],
    conflictPolicy: 'keep the visible-stem frame lineage-local and never merge its role lane with another source semantic rule',
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
    ruleId: 'rule.ditian.heaven-earth-human-frame.v0',
    work: WORKS.ditian,
    lineage: 'ditian_local_export',
    status: 'adopted_lineage_rule',
    ruleCompleteness: 'bounded_heaven_earth_human_frame',
    executionStatus: 'executable_from_frozen_base',
    sourceIds: ['saju-source-ditian-sui'],
    locatorIds: ['ditian-p2-heaven-earth-human-frame'],
    observedRule: 'p.2 names the visible day stem as 天元, each branch as 地元, and each supplied hidden-stem entry as 人元. The adopted surface records this four-pillar frame only.',
    preconditions: ['exact time is supplied', 'all four pillarFacts entries contain a visible stem, branch, and hidden-stem array'],
    inputFacts: [FACT_REFS.dayMaster, FACT_REFS.pillarFacts, FACT_REFS.timeAccuracy],
    orderedSteps: ['read each supplied pillar position in year/month/day/hour order', 'bind its visible stem to 天元, branch to 地元, and hidden-stem inventory to 人元', 'emit the supplied frame without reconstructing hidden stems or assigning a meaning'],
    structuralOutput: ['heavenEarthHumanFrame'],
    exceptions: ['stop on missing or malformed pillar input', 'do not infer a hidden-stem order, seasonal force, 進退/順悖 value, or personal meaning'],
    conflictPolicy: 'retain the Ditian frame as a lineage-specific input structure; do not merge it with another source role frame',
  }),
  rule({
    ruleId: 'rule.ditian.branch-category-inventory.v0',
    work: WORKS.ditian,
    lineage: 'ditian_local_export',
    status: 'adopted_lineage_rule',
    ruleCompleteness: 'bounded_branch_category_inventory',
    executionStatus: 'executable_from_frozen_base',
    sourceIds: ['saju-source-ditian-sui'],
    locatorIds: ['ditian-p10-branch-categories'],
    observedRule: 'p.10 lists the source branch groups 陽支/陰支, 四生, 四庫, and 四敗. The adopted result is membership inventory only; adjacent preference and outcome prose is not applied.',
    preconditions: ['exact time is supplied', 'all four supplied branch values are present and recognized by the source branch inventory'],
    inputFacts: [FACT_REFS.pillarFacts, FACT_REFS.timeAccuracy],
    orderedSteps: ['read each supplied branch by pillar position', 'normalize only Korean/Chinese branch spelling to the source token', 'record every matching source group without ranking or cancellation'],
    structuralOutput: ['ditianBranchCategoryInventory'],
    exceptions: ['stop on missing or unrecognized branch input', 'do not apply 生方怕動, 庫宜開, 沖, 合, or any adjacent outcome wording as a result'],
    conflictPolicy: 'preserve overlapping group membership and do not merge the inventory with a modern branch classification or another lineage',
  }),
  rule({
    ruleId: 'rule.ditian.shape-example-inventory.v0',
    work: WORKS.ditian,
    lineage: 'ditian_local_export',
    status: 'adopted_lineage_rule',
    ruleCompleteness: 'bounded_exact_shape_example_inventory',
    executionStatus: 'not_applicable_fixture',
    sourceIds: ['saju-source-ditian-sui'],
    locatorIds: ['ditian-p12-shape-examples'],
    observedRule: 'p.12 gives four explicit day-stem/month-window examples labelled 形全 or 形缺. The adopted surface matches only those named examples and does not create a general 形象 classifier.',
    preconditions: ['exact time, day-master stem, and month branch are supplied', 'the pair is one of the four explicitly named examples'],
    inputFacts: [FACT_REFS.dayMaster, FACT_REFS.monthBranch, FACT_REFS.timeAccuracy],
    orderedSteps: ['normalize the supplied day-master stem and month branch', 'compare the pair with the four exact p.12 example windows', 'emit every exact source example match or not_applicable_fixture'],
    structuralOutput: ['ditianShapeExampleInventory'],
    exceptions: ['a non-matching stem/month pair is outside the exact example inventory', 'do not infer 形全/形缺 for an unlisted stem or month, or expand the label into balance, strength, or personal meaning'],
    conflictPolicy: 'preserve exact example labels only; no generalized shape rule or cross-lineage merge',
  }),
  rule({
    ruleId: 'rule.ditian.fang-ju-example-inventory.v0',
    work: WORKS.ditian,
    lineage: 'ditian_local_export',
    status: 'adopted_lineage_rule',
    ruleCompleteness: 'bounded_exact_fang_ju_example_inventory',
    executionStatus: 'not_applicable_fixture',
    sourceIds: ['saju-source-ditian-sui'],
    locatorIds: ['ditian-p13-fang-ju-examples'],
    observedRule: 'p.13 names 寅卯辰 as the 東方 方 and 亥卯未 as the 木局 局. The adopted surface reports exact branch-set membership only.',
    preconditions: ['exact time and all four supplied branch values are present', 'one of the two exact source branch sets is present'],
    inputFacts: [FACT_REFS.pillarFacts, FACT_REFS.timeAccuracy],
    orderedSteps: ['normalize the four supplied branches', 'check each exact source branch set as a subset of the supplied branch positions', 'emit every matched 方/局 inventory without selecting between simultaneous matches'],
    structuralOutput: ['ditianFangJuExampleInventory'],
    exceptions: ['a set that is not one of the two named examples is not classified', 'do not apply 方/局 mixing, 行運 transitions, 格局 selection, or outcome prose'],
    conflictPolicy: 'preserve simultaneous exact memberships and keep 方 and 局 as separate source categories',
  }),
  rule({
    ruleId: 'rule.qiongtong.five-phase-number-inventory.v0',
    work: WORKS.qiongtong,
    lineage: 'qiongtong_local_export',
    status: 'adopted_lineage_rule',
    ruleCompleteness: 'bounded_element_number_inventory',
    executionStatus: 'executable_from_frozen_base',
    sourceIds: ['saju-source-qiongtong-baojian'],
    locatorIds: ['qiongtong-p2-five-phase-number-and-season'],
    observedRule: 'p.2 explicitly lists the element numbers 水一、火二、木三、金四、土五. This rule emits that source number inventory and deliberately excludes the unresolved 生旺/死绝 operation.',
    preconditions: ['the frozen element distribution contains all five element keys'],
    inputFacts: [FACT_REFS.elements],
    orderedSteps: ['verify the supplied five-element key envelope', 'emit the p.2 source element-number mapping', 'mark the 生旺/死绝 multiplier as not applied'],
    structuralOutput: ['qiongtongElementNumberInventory'],
    exceptions: ['do not apply double/half arithmetic without the unresolved source-specific state resolver', 'do not replace source numbers with Base distribution counts or a modern state table'],
    conflictPolicy: 'keep the number inventory separate from the existing blocked 生旺/死绝 rule and all other lineage state vocabularies',
  }),
  rule({
    ruleId: 'rule.qiongtong.day-stem-section-frame.v0',
    work: WORKS.qiongtong,
    lineage: 'qiongtong_local_export',
    status: 'adopted_lineage_rule',
    ruleCompleteness: 'bounded_day_stem_section_frame',
    executionStatus: 'executable_from_frozen_base',
    sourceIds: ['saju-source-qiongtong-baojian'],
    locatorIds: ['qiongtong-p3-jia-section', 'qiongtong-p13-yi-section', 'qiongtong-p21-bing-section', 'qiongtong-p32-ding-section', 'qiongtong-p40-wu-section', 'qiongtong-p49-ji-section', 'qiongtong-p55-geng-section', 'qiongtong-p64-xin-section', 'qiongtong-p75-ren-section', 'qiongtong-p83-gui-section'],
    observedRule: 'p.3–p.90 are organized into ten day-stem sections. The adopted result selects the section frame by supplied day-master stem but does not select or execute any month-specific prescription.',
    preconditions: ['exact time and a recognized day-master stem are supplied'],
    inputFacts: [FACT_REFS.dayMaster, FACT_REFS.timeAccuracy],
    orderedSteps: ['normalize the supplied day-master stem', 'bind it to the directly observed source section page band', 'emit the section frame and mark monthly clause selection as not applied'],
    structuralOutput: ['qiongtongDayStemSectionFrame'],
    exceptions: ['stop on missing or unrecognized day-master stem', 'do not infer a month clause, 用神/strength result, priority, outcome, or personal meaning from the section heading'],
    conflictPolicy: 'keep each day-stem section as a Qiongtong-only frame; do not merge its monthly clauses with Ditian or another lineage',
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
  structuralContractSpec('rule.sanming.seasonal-state-inventory.v0', {
    commonBaseFacts: [
      { factRef: FACT_REFS.monthBranch, origin: 'frozen_base_common_fact' },
      { factRef: FACT_REFS.elements, origin: 'frozen_base_common_fact' },
    ],
    applicability: [
      'month branch must map to one of the p.67 source seasonal windows',
      'the supplied element distribution must contain the five element keys',
    ],
    procedure: [
      'bind the supplied month branch to spring, summer, sixth-month, autumn, or winter as explicitly listed by the source',
      'emit the source 旺相休囚死 label by element for that window',
      'retain the p.68 twelve stage labels as vocabulary only',
      'emit no balance, force, use-selection, fortune, or personal result',
    ],
    stopConditions: [
      'stop when month branch or element distribution is missing or malformed',
      'stop when the month branch is not in the source seasonal window list',
      'do not replace the sixth-month 土旺 window with a generic summer grouping',
      'do not apply generic 十二運星 or Qiongtong 生旺/死绝 state resolution',
    ],
    output: {
      origin: 'lineage_derived_structural_result',
      resultKey: 'sanming.seasonalStateInventory',
      fields: ['monthBranch', 'seasonWindow', 'elementStateBySeason', 'twelvePalaceVocabulary', 'sourceScope'],
      semanticExpansion: false,
    },
  }),
  structuralContractSpec('rule.sanming.visible-stem-frame.v0', {
    commonBaseFacts: [
      { factRef: FACT_REFS.dayMaster, origin: 'frozen_base_common_fact' },
      { factRef: FACT_REFS.pillarFacts, origin: 'frozen_base_common_fact' },
      { factRef: FACT_REFS.timeAccuracy, origin: 'frozen_normalized_input' },
    ],
    applicability: [
      'timeAccuracy must be exact',
      'day-master stem and all four supplied visible stem positions must be present',
    ],
    procedure: [
      'bind the supplied day-master stem as the source anchor',
      'enumerate the four visible stem values by pillar position',
      'pass only this input frame to the p.162 role-nomenclature rule',
    ],
    stopConditions: [
      'stop when timeAccuracy is not exact or day-master/visible stem input is missing or malformed',
      'do not calculate ten-god labels or attach family, outcome, or personal meaning',
    ],
    output: {
      origin: 'lineage_derived_structural_result',
      resultKey: 'sanming.visibleStemFrame',
      fields: ['dayMasterStem', 'visibleStemInventory', 'sourceInputScope'],
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
  structuralContractSpec('rule.ditian.heaven-earth-human-frame.v0', {
    commonBaseFacts: [
      { factRef: FACT_REFS.dayMaster, origin: 'frozen_base_common_fact' },
      { factRef: FACT_REFS.pillarFacts, origin: 'frozen_base_common_fact' },
      { factRef: FACT_REFS.timeAccuracy, origin: 'frozen_normalized_input' },
    ],
    applicability: [
      'timeAccuracy must be exact',
      'all four pillarFacts entries must contain a visible stem, branch, and hidden-stem array',
    ],
    procedure: [
      'read the four supplied positions in year/month/day/hour order',
      'bind each visible stem to 天元, branch to 地元, and hidden-stem inventory to 人元',
      'emit the supplied frame without reconstructing or weighting its entries',
    ],
    stopConditions: [
      'stop when timeAccuracy or any pillar frame field is missing or malformed',
      'do not infer 進退, 順悖, force, or personal meaning',
    ],
    output: {
      origin: 'lineage_derived_structural_result',
      resultKey: 'ditian.heavenEarthHumanFrame',
      fields: ['positions', 'sourceLabels', 'factRefs'],
      semanticExpansion: false,
    },
  }),
  structuralContractSpec('rule.ditian.branch-category-inventory.v0', {
    commonBaseFacts: [
      { factRef: FACT_REFS.pillarFacts, origin: 'frozen_base_common_fact' },
      { factRef: FACT_REFS.timeAccuracy, origin: 'frozen_normalized_input' },
    ],
    applicability: [
      'timeAccuracy must be exact',
      'all four supplied branch values must be recognized by the Ditian source branch groups',
    ],
    procedure: [
      'normalize each supplied branch to the source token',
      'record membership in 陽支/陰支/四生/四庫/四敗',
      'preserve overlapping memberships and set precedence to none',
    ],
    stopConditions: [
      'stop when timeAccuracy or a branch value is missing or unrecognized',
      'do not apply adjacent 生方怕動, 庫宜開, 沖, 合, or outcome wording',
    ],
    output: {
      origin: 'lineage_derived_structural_result',
      resultKey: 'ditian.branchCategoryInventory',
      fields: ['branchCategoriesByPosition', 'sourceGroups', 'precedence'],
      semanticExpansion: false,
    },
  }),
  structuralContractSpec('rule.ditian.shape-example-inventory.v0', {
    commonBaseFacts: [
      { factRef: FACT_REFS.dayMaster, origin: 'frozen_base_common_fact' },
      { factRef: FACT_REFS.monthBranch, origin: 'frozen_base_common_fact' },
      { factRef: FACT_REFS.timeAccuracy, origin: 'frozen_normalized_input' },
    ],
    applicability: [
      'timeAccuracy must be exact',
      'day-master/month branch must match one of the four exact p.12 examples',
    ],
    procedure: [
      'normalize the supplied day-master stem and month branch',
      'match only the four exact source example windows',
      'emit the named 形全/形缺 example without generalizing its label',
    ],
    stopConditions: [
      'return not_applicable_fixture when the supplied pair is not one of the named examples',
      'do not infer an unlisted 形全/形缺 result or a strength/balance meaning',
    ],
    output: {
      origin: 'lineage_derived_structural_result',
      resultKey: 'ditian.shapeExampleInventory',
      fields: ['sourceCondition', 'matchedExamples', 'sourceExampleScope'],
      semanticExpansion: false,
    },
  }),
  structuralContractSpec('rule.ditian.fang-ju-example-inventory.v0', {
    commonBaseFacts: [
      { factRef: FACT_REFS.pillarFacts, origin: 'frozen_base_common_fact' },
      { factRef: FACT_REFS.timeAccuracy, origin: 'frozen_normalized_input' },
    ],
    applicability: [
      'timeAccuracy must be exact',
      'all four supplied branches are present and one of the two exact source branch sets is present',
    ],
    procedure: [
      'normalize the four supplied branch values',
      'check the exact 寅卯辰 and 亥卯未 sets independently',
      'emit all exact matches without choosing between simultaneous 方/局 labels',
    ],
    stopConditions: [
      'return not_applicable_fixture when neither exact source set is present',
      'do not apply 方/局 mixing, 格局 selection, 行運 transition, or outcome language',
    ],
    output: {
      origin: 'lineage_derived_structural_result',
      resultKey: 'ditian.fangJuExampleInventory',
      fields: ['suppliedBranches', 'matchedExamples', 'precedence'],
      semanticExpansion: false,
    },
  }),
  structuralContractSpec('rule.qiongtong.five-phase-number-inventory.v0', {
    commonBaseFacts: [
      { factRef: FACT_REFS.elements, origin: 'frozen_base_common_fact' },
    ],
    applicability: [
      'the frozen element distribution contains all five element keys',
      'only the p.2 number inventory is applied; 生旺/死绝 state is not supplied',
    ],
    procedure: [
      'verify the five-element key envelope',
      'emit 水一、火二、木三、金四、土五',
      'record that the double/half state operation was not applied',
    ],
    stopConditions: [
      'stop when an element key is missing or malformed',
      'do not substitute Base counts, hidden-stem weights, or a generic stage resolver for 生旺/死绝',
    ],
    output: {
      origin: 'lineage_derived_structural_result',
      resultKey: 'qiongtong.elementNumberInventory',
      fields: ['sourceElementNumbers', 'suppliedElementKeys', 'stateOperation'],
      semanticExpansion: false,
    },
  }),
  structuralContractSpec('rule.qiongtong.day-stem-section-frame.v0', {
    commonBaseFacts: [
      { factRef: FACT_REFS.dayMaster, origin: 'frozen_base_common_fact' },
      { factRef: FACT_REFS.timeAccuracy, origin: 'frozen_normalized_input' },
    ],
    applicability: [
      'timeAccuracy must be exact',
      'day-master stem must map to one directly reviewed Qiongtong day-stem section',
    ],
    procedure: [
      'normalize the supplied day-master stem',
      'bind it to the corresponding source section page band',
      'emit the section frame and leave month-clause selection unapplied',
    ],
    stopConditions: [
      'stop when timeAccuracy or the day-master stem is missing or unrecognized',
      'do not infer a month prescription, priority, use-selection, outcome, or personal meaning',
    ],
    output: {
      origin: 'lineage_derived_structural_result',
      resultKey: 'qiongtong.dayStemSectionFrame',
      fields: ['dayMasterStem', 'sourceSection', 'monthlyClauseSelection'],
      semanticExpansion: false,
    },
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

export const SAJU_SANMING_SOURCE_SEMANTIC_RULES = Object.freeze([
  sourceSemanticRule({
    ruleId: 'rule.sanming.role-nomenclature.v0',
    work: WORKS.sanming,
    lineage: 'sanming_local_export',
    status: 'adopted_lineage_semantic_rule',
    ruleCompleteness: 'bounded_source_role_nomenclature',
    sourceIds: ['saju-source-sanming-tonghui'],
    locatorIds: ['sanming-p162-role-nomenclature'],
    structuralPrerequisiteRuleIds: ['rule.sanming.visible-stem-frame.v0'],
    observedRule: 'p.162 explains the source role nomenclature from day-master/stem relations: 印绶, 食神, 官煞, 妻财 and the named 正/偏 role labels. The adopted output translates only the already supplied visible ten-god label inventory into those source labels; it does not emit the adjacent family analogy or any outcome.',
    preconditions: ['the Sanming visible-stem frame has executed', 'the frozen Base supplies a non-empty visible ten-god label inventory', 'every supplied label is one of the p.162 role labels retained by this narrow contract'],
    inputFacts: [FACT_REFS.dayMaster, FACT_REFS.pillarFacts, FACT_REFS.visibleTenGods, FACT_REFS.timeAccuracy],
    orderedSteps: ['consume the Sanming visible-stem frame without recalculating its stems', 'consume the supplied visible ten-god labels as FACTs', 'map only the exact supplied labels to the source role labels 印綬/枭/食神/傷官/正官/偏官/妻財/劫', 'preserve counts and stop before family analogy, use selection, pattern, outcome, fortune, or personal meaning'],
    semanticOutput: ['sourceRoleLabelInventory'],
    exceptions: ['an unknown or same-element label outside the p.162 retained vocabulary blocks the complete result rather than being filled by a modern table', 'the source role labels are not personal or family conclusions', 'do not merge this role-nomenclature lane with Ziping/Yuanhai role chapters or promote it to a common rule'],
    conflictPolicy: 'preserve the Sanming role-label result and fail closed on a structural conflict; no cross-lineage winner is selected',
    output: {
      origin: 'lineage_derived_source_bounded_semantic_result',
      resultKey: 'sanming.roleNomenclature',
      fields: ['sourceCondition', 'suppliedLabelCounts', 'sourceRoleLabelInventory', 'sourceSemanticScope'],
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

export const SAJU_SANMING_INVENTORY_STATUSES = Object.freeze([
  'adopted_structural_rule',
  'adopted_semantic_rule',
  'context_bound_candidate',
  'unresolved',
  'unsupported',
])

const sanmingInventoryEntry = value => ({
  inventorySchema: 'saju-sanming-source-rule-inventory-v0',
  work: WORKS.sanming,
  lineage: 'sanming_local_export',
  sourceIds: ['saju-source-sanming-tonghui'],
  locatorIds: [],
  requiredStructuralResult: {
    ruleIds: [],
    fields: [],
    closure: 'not_closed',
  },
  sourceDefinedOutput: {
    kind: 'not_materialized',
    role: 'source-bounded rule surface',
    outputShape: [],
    scope: 'sanming-local-only',
  },
  applicability: [],
  exceptions: [],
  forbiddenExtensions: [...FORBIDDEN_EXTENSIONS],
  compositionState: 'coexistence_only_until_source_priority_is_closed',
  sourceObservation: '',
  ...value,
})

/**
 * Whole local-work inventory for 三命通會.  The direct page bands are kept
 * separate from the Ziping/Yuanhai inventories.  Only the p.4-p.6 relation
 * vocabulary, p.65-p.70 frames, p.67 seasonal state vocabulary, and the
 * narrow p.162 role nomenclature have closed non-personal outputs here.
 */
export const SAJU_SANMING_RULE_INVENTORY = Object.freeze([
  sanmingInventoryEntry({
    inventoryId: 'inventory.sanming.p4-p6-generation-control.v0',
    status: 'adopted_structural_rule',
    contractRuleId: 'rule.sanming.element-generation-control-v0',
    locatorIds: ['sanming-p4-element-generation', 'sanming-p5-element-generation-control', 'sanming-p6-stem-branch-origin'],
    applicability: ['the frozen element distribution, pillarFacts envelope, and supplied stem-relation inventory are present'],
    requiredStructuralResult: {
      ruleIds: ['rule.sanming.element-generation-control-v0'],
      fields: ['elementInventory', 'existingStemRelations', 'relationGraph'],
      closure: 'closed_in_existing_contract',
    },
    sourceDefinedOutput: {
      kind: 'structural',
      role: 'five-phase generation/control relation vocabulary',
      outputShape: ['element inventory', 'supplied stem relation inventory'],
      scope: 'relation vocabulary only; no force or personal result',
    },
    exceptions: ['source numerical prose is not used to recalculate the frozen Base'],
    sourceObservation: 'p.4-p.6 present generation/control and stem/branch origin as relation vocabulary; the adopted rule retains the already supplied FACTs.',
  }),
  sanmingInventoryEntry({
    inventoryId: 'inventory.sanming.p65-p66-human-element.v0',
    status: 'adopted_structural_rule',
    contractRuleId: 'rule.sanming.human-element-month-command.v0',
    locatorIds: ['sanming-p65-human-element-and-month-command', 'sanming-p66-seasonal-hidden-stem-service'],
    applicability: ['month branch and supplied month hidden-stem inventory are present'],
    requiredStructuralResult: {
      ruleIds: ['rule.sanming.human-element-month-command.v0'],
      fields: ['monthCommandBranch', 'hiddenStems', 'serviceDayArithmetic'],
      closure: 'closed_in_existing_contract',
    },
    sourceDefinedOutput: {
      kind: 'structural',
      role: '人元/月令 inventory',
      outputShape: ['month branch', 'hidden stems', 'service-day arithmetic not applied'],
      scope: 'inventory only; no service-day weight table',
    },
    exceptions: ['the p.66 service-day example is not generalized to a twelve-month arithmetic table'],
    sourceObservation: 'p.65-p.66 identify 人元/司事 and show one service-day example, but the existing rule intentionally stops at the supplied hidden-stem inventory.',
  }),
  sanmingInventoryEntry({
    inventoryId: 'inventory.sanming.p67-p68-seasonal-state.v0',
    status: 'adopted_structural_rule',
    contractRuleId: 'rule.sanming.seasonal-state-inventory.v0',
    locatorIds: ['sanming-p67-seasonal-state', 'sanming-p68-twelve-palace-vocabulary'],
    applicability: ['month branch is in the source seasonal window list', 'the five element keys are supplied'],
    requiredStructuralResult: {
      ruleIds: ['rule.sanming.seasonal-state-inventory.v0'],
      fields: ['monthBranch', 'seasonWindow', 'elementStateBySeason', 'twelvePalaceVocabulary'],
      closure: 'closed_in_existing_contract',
    },
    sourceDefinedOutput: {
      kind: 'structural',
      role: 'source seasonal-state vocabulary/window',
      outputShape: ['season window', '旺相休囚死 labels by element', 'twelve source stage labels'],
      scope: 'source vocabulary/classification only; no balance or personal result',
    },
    exceptions: ['未 is retained as the source sixth-month 土旺 window', 'p.68 labels are not used as a generic twelve-stage resolver'],
    sourceObservation: 'p.67 directly states the five seasonal state windows and p.68 lists the twelve source labels; no cross-lineage state mapping is used.',
  }),
  sanmingInventoryEntry({
    inventoryId: 'inventory.sanming.p69-p70-four-pillar-frame.v0',
    status: 'adopted_structural_rule',
    contractRuleId: 'rule.sanming.four-pillars-month-hour-frame.v0',
    locatorIds: ['sanming-p69-month-hour-method', 'sanming-p70-year-month-day-hour'],
    applicability: ['four supplied pillars and exact time are present'],
    requiredStructuralResult: {
      ruleIds: ['rule.sanming.four-pillars-month-hour-frame.v0'],
      fields: ['fourPillars', 'procedureLabels', 'recalculation'],
      closure: 'closed_in_existing_contract',
    },
    sourceDefinedOutput: {
      kind: 'structural',
      role: 'four-pillar and month/hour procedure frame',
      outputShape: ['four pillars', 'month-from-year', 'hour-from-day'],
      scope: 'frozen frame only; no recalculation',
    },
    exceptions: ['calendar boundary and time policy remain in the Base engine'],
    sourceObservation: 'p.69-p.70 explicitly frame year/month/day/hour and the month/hour derivation direction.',
  }),
  sanmingInventoryEntry({
    inventoryId: 'inventory.sanming.p72-fetal-seat.v0',
    status: 'context_bound_candidate',
    locatorIds: ['sanming-p72-fetal-and-seat'],
    applicability: ['source-defined 胎元/坐命官 inputs and exact calculation procedure are supplied'],
    requiredStructuralResult: {
      ruleIds: [],
      fields: ['胎元', '坐命官', 'calculation boundary'],
      closure: 'separate_input_and_engine_policy_not_closed',
    },
    sourceDefinedOutput: {
      kind: 'structural_candidate',
      role: '胎元/坐命官 calculation surface',
      outputShape: [],
      scope: 'candidate only; no value is materialized',
    },
    exceptions: ['do not derive these values from adjacent month/hour rules or modern calculators'],
    sourceObservation: 'p.72 has direct headings but the current contract has no source-bounded input/output bridge for either calculation.',
  }),
  sanmingInventoryEntry({
    inventoryId: 'inventory.sanming.p73-p77-dayun.v0',
    status: 'context_bound_candidate',
    locatorIds: ['sanming-p73-dayun-procedure', 'sanming-p77-timing-outcome-summary'],
    applicability: ['gender, birth-to-term distance, direction, start-age conversion, and source transition conditions are bound to the same source policy'],
    requiredStructuralResult: {
      ruleIds: [],
      fields: ['direction', 'term-distance', 'start age', 'conversion', 'active cycle'],
      closure: 'source_timing_policy_bridge_not_closed',
    },
    sourceDefinedOutput: {
      kind: 'structural_candidate',
      role: '大運 direction/start-age procedure',
      outputShape: [],
      scope: 'candidate only; no timing recomputation or outcome',
    },
    exceptions: ['the direct formulas are not promoted into a new timing engine or connected to fortune outcomes'],
    sourceObservation: 'p.73 states gender-dependent direction, three-day/year conversion, and shorter unit conversions; p.77 mixes timing with outcome language, so the current timing bridge remains candidate.',
  }),
  sanmingInventoryEntry({
    inventoryId: 'inventory.sanming.p78-p93-composition.v0',
    status: 'unresolved',
    locatorIds: ['sanming-p78-stem-combination', 'sanming-p80-stem-transformation-general', 'sanming-p81-stem-transformation', 'sanming-p85-branch-combinations', 'sanming-p90-three-punishments', 'sanming-p93-branch-conflict'],
    applicability: ['source-specific combination/化氣/刑沖 definitions, precedence, and exceptions are independently closed'],
    requiredStructuralResult: {
      ruleIds: [],
      fields: ['relation inventory', 'transformation condition', 'precedence', 'exception'],
      closure: 'composition_and_priority_not_closed',
    },
    sourceDefinedOutput: {
      kind: 'not_materialized',
      role: 'stem/branch composition surface',
      outputShape: [],
      scope: 'inventory only; no relation winner or transformation result',
    },
    exceptions: ['do not merge source combinations with Ziping relation labels or modern合化 tables'],
    sourceObservation: 'p.78-p.93 provide multiple relation and transformation sections, but the current direct locators do not close a single precedence/composition grammar.',
    compositionState: 'unresolved_composition_frontier',
  }),
  sanmingInventoryEntry({
    inventoryId: 'inventory.sanming.p95-p105-lu-horse.v0',
    status: 'context_bound_candidate',
    locatorIds: ['sanming-p95-stem-lu', 'sanming-p100-travel-horse'],
    applicability: ['source-specific stem/year/branch inputs and non-outcome output scope are closed'],
    requiredStructuralResult: {
      ruleIds: [],
      fields: ['禄 mapping', '驛馬 mapping', 'source position rule'],
      closure: 'mapping_scope_and_non_outcome_boundary_not_closed',
    },
    sourceDefinedOutput: {
      kind: 'structural_candidate',
      role: '禄/驛馬 relation inventory',
      outputShape: [],
      scope: 'candidate only; no shensha meaning or outcome',
    },
    exceptions: ['do not treat a familiar name as proof of the source rule or add a modern 神煞 table'],
    sourceObservation: 'p.95 and p.100 have direct mapping headings, but the source input axis and public non-outcome output are not yet closed in the current contract.',
  }),
  sanmingInventoryEntry({
    inventoryId: 'inventory.sanming.p106-p130-shensha.v0',
    status: 'unsupported',
    locatorIds: ['sanming-p106-shensha', 'sanming-p130-shensha-summary'],
    applicability: ['a source-complete non-outcome shensha mapping would be required'],
    requiredStructuralResult: {
      ruleIds: [],
      fields: ['source axis', 'mapping', 'exception', 'output boundary'],
      closure: 'public_non_outcome_shensha_contract_not_closed',
    },
    sourceDefinedOutput: {
      kind: 'unsupported_semantic',
      role: '神煞 names and outcome clauses',
      outputShape: [],
      scope: 'not materialized in the public grammar',
    },
    exceptions: ['do not expose 貴人/驛馬/羊刃 or other shensha as personal or fortune claims'],
    sourceObservation: 'p.106-p.130 are direct shensha sections and a compiled summary, but no narrow public non-outcome rule has been closed.',
  }),
  sanmingInventoryEntry({
    inventoryId: 'inventory.sanming.p137-p159-outcome-surfaces.v0',
    status: 'unsupported',
    locatorIds: ['sanming-p137-stem-branch-outcomes', 'sanming-p159-elemental-outcomes'],
    applicability: ['source role/pattern/season and outcome context would be required'],
    requiredStructuralResult: {
      ruleIds: [],
      fields: ['month/hour/운 context', 'seasonal condition', 'outcome'],
      closure: 'fortune_and_personal_outcome_surface_outside_v0',
    },
    sourceDefinedOutput: {
      kind: 'unsupported_semantic',
      role: '吉凶/富貴/seasonal personal outcomes',
      outputShape: [],
      scope: 'not materialized',
    },
    exceptions: ['do not turn a seasonal state label into a balance, fate, or personal conclusion'],
    sourceObservation: 'p.137-p.159 repeatedly connect stem/branch and elemental regional conditions to 吉凶/outcome language.',
  }),
  sanmingInventoryEntry({
    inventoryId: 'inventory.sanming.p162-role-nomenclature.v0',
    status: 'adopted_semantic_rule',
    contractRuleId: 'rule.sanming.role-nomenclature.v0',
    locatorIds: ['sanming-p162-role-nomenclature'],
    applicability: ['the visible-stem frame has executed', 'supplied visible ten-god labels are all in the narrow retained source vocabulary'],
    requiredStructuralResult: {
      ruleIds: ['rule.sanming.visible-stem-frame.v0'],
      fields: ['dayMasterStem', 'visibleStemInventory'],
      closure: 'closed_in_existing_contract',
    },
    sourceDefinedOutput: {
      kind: 'semantic_role_label_inventory',
      role: 'source role nomenclature only',
      outputShape: ['supplied label', 'source role label', 'count'],
      scope: 'p.162 role names only; no family analogy, pattern, outcome, or personal meaning',
    },
    exceptions: ['unknown/same-element labels are fail-closed rather than completed by modern terminology'],
    sourceObservation: 'p.162 explicitly names 印绶, 食神, 官煞, 妻财 and the bounded 正/偏 role labels; the adopted result preserves only the nomenclature lane.',
  }),
  sanmingInventoryEntry({
    inventoryId: 'inventory.sanming.p162-visible-stem-frame.v0',
    status: 'adopted_structural_rule',
    contractRuleId: 'rule.sanming.visible-stem-frame.v0',
    locatorIds: ['sanming-p162-role-nomenclature'],
    applicability: ['exact time, day-master and all four visible stem positions are present'],
    requiredStructuralResult: {
      ruleIds: ['rule.sanming.visible-stem-frame.v0'],
      fields: ['dayMasterStem', 'visibleStemInventory', 'sourceInputScope'],
      closure: 'closed_in_existing_contract',
    },
    sourceDefinedOutput: {
      kind: 'structural',
      role: 'visible stem input frame for p.162 role nomenclature',
      outputShape: ['day-master anchor', 'visible stem by pillar position'],
      scope: 'input frame only; no role calculation or personal meaning',
    },
    exceptions: ['do not calculate ten-god labels or complete unlisted source role mappings from this frame'],
    sourceObservation: 'the p.162 role-nomenclature passage starts from the day-master and stem relation frame; this adopted structural result preserves only that frame.',
  }),
  sanmingInventoryEntry({
    inventoryId: 'inventory.sanming.p164-p239-role-chapters.v0',
    status: 'context_bound_candidate',
    locatorIds: ['sanming-p164-239-role-chapters'],
    applicability: ['role identity, month-command conditions, support/opposition, pattern context, and source priority are all closed'],
    requiredStructuralResult: {
      ruleIds: [],
      fields: ['role identity', 'month-command state', 'relation conditions', 'priority'],
      closure: 'chapter_context_and_priority_not_closed',
    },
    sourceDefinedOutput: {
      kind: 'semantic_candidate',
      role: '官/財/印/食 role chapter qualification',
      outputShape: ['source-local case label'],
      scope: 'chapter-specific; no general role meaning or outcome',
    },
    exceptions: ['p.164 onward includes body/strength and outcome clauses; do not use modern 格局/strength rules to complete them'],
    sourceObservation: 'p.164-p.239 contain detailed role chapters, but their applicability and priority are not one closed non-personal grammar.',
  }),
  sanmingInventoryEntry({
    inventoryId: 'inventory.sanming.p242-p261-personal-surfaces.v0',
    status: 'unsupported',
    locatorIds: ['sanming-p242-261-personal-surfaces'],
    applicability: ['personal, health, gender, childhood, or family context would be required'],
    requiredStructuralResult: {
      ruleIds: [],
      fields: ['personality', 'body', 'gender', 'family', 'outcome'],
      closure: 'personal_semantic_surface_outside_v0',
    },
    sourceDefinedOutput: {
      kind: 'unsupported_semantic',
      role: '性情/疾病/女命/六親 surface',
      outputShape: [],
      scope: 'not materialized',
    },
    exceptions: ['do not expose these chapters as personal meaning or prediction'],
    sourceObservation: 'p.242-p.261 explicitly enter personality, body, gender, childhood, and family surfaces.',
  }),
  sanmingInventoryEntry({
    inventoryId: 'inventory.sanming.p300-p370-worked-cases.v0',
    status: 'unsupported',
    locatorIds: ['sanming-p300-370-worked-cases'],
    applicability: ['a case-specific source identity and non-outcome structural extraction would be required'],
    requiredStructuralResult: {
      ruleIds: [],
      fields: ['case input', 'case condition', 'case output boundary'],
      closure: 'worked_case_not_a_universal_predicate',
    },
    sourceDefinedOutput: {
      kind: 'unsupported_semantic',
      role: 'worked-hour case outcomes',
      outputShape: [],
      scope: 'not materialized',
    },
    exceptions: ['do not generalize a worked case into a rule or prediction'],
    sourceObservation: 'p.300-p.370 collect 時斷 and worked cases whose result prose is case-bound and outcome-oriented.',
  }),
])

export const SAJU_DITIAN_INVENTORY_STATUSES = Object.freeze([
  'adopted_structural_rule',
  'context_bound_candidate',
  'unresolved',
  'unsupported',
])

const ditianInventoryEntry = value => ({
  inventorySchema: 'saju-ditian-source-rule-inventory-v0',
  work: WORKS.ditian,
  lineage: 'ditian_local_export',
  sourceIds: ['saju-source-ditian-sui'],
  locatorIds: [],
  requiredStructuralResult: { ruleIds: [], fields: [], closure: 'not_closed' },
  sourceDefinedOutput: { kind: 'not_materialized', role: 'source-bounded rule surface', outputShape: [], scope: 'ditian-local-only' },
  applicability: [],
  exceptions: [],
  forbiddenExtensions: [...FORBIDDEN_EXTENSIONS],
  compositionState: 'coexistence_only_until_source_priority_is_closed',
  sourceObservation: '',
  ...value,
})

export const SAJU_DITIAN_RULE_INVENTORY = Object.freeze([
  ditianInventoryEntry({
    inventoryId: 'inventory.ditian.p2-heaven-earth-human-frame.v0',
    status: 'adopted_structural_rule',
    contractRuleId: 'rule.ditian.heaven-earth-human-frame.v0',
    locatorIds: ['ditian-p2-heaven-earth-human-frame'],
    applicability: ['exact time and all four supplied visible stem/branch/hidden-stem entries are present'],
    requiredStructuralResult: { ruleIds: ['rule.ditian.heaven-earth-human-frame.v0'], fields: ['positions', 'sourceLabels', 'factRefs'], closure: 'closed_in_existing_contract' },
    sourceDefinedOutput: { kind: 'structural', role: '天元/地元/人元 input frame', outputShape: ['position', 'visible stem', 'branch', 'hidden stems'], scope: 'frame only; no 進退/順悖 or personal result' },
    exceptions: ['do not derive hidden-stem weights or a force judgment from the frame'],
    sourceObservation: 'p.2 explicitly names the day stem, branch, and hidden-stem layers as 天元、地元、人元.',
  }),
  ditianInventoryEntry({
    inventoryId: 'inventory.ditian.p3-progress-retreat-shunbei.v0',
    status: 'unresolved',
    locatorIds: ['ditian-p3-progress-retreat-shunbei'],
    applicability: ['source-defined 氣/勢 input, 進退 condition, and non-outcome output must be closed'],
    requiredStructuralResult: { ruleIds: [], fields: ['氣/勢 input', '進退 condition', '順悖 condition'], closure: 'semantic_condition_and_output_not_closed' },
    sourceDefinedOutput: { kind: 'not_materialized', role: '進退/順悖 condition surface', outputShape: [], scope: 'adjacent 吉凶 prose excluded' },
    exceptions: ['do not infer 進退/順悖 from Base element counts or modern strength rules'],
    sourceObservation: 'p.3 places 進退 and 順悖 beside outcome wording; the direct locator does not close a semantic-free condition procedure.',
    compositionState: 'unresolved_composition_frontier',
  }),
  ditianInventoryEntry({
    inventoryId: 'inventory.ditian.p4-p7-stem-seasonal-conditions.v0',
    status: 'context_bound_candidate',
    locatorIds: ['ditian-p4-jia-wood-seasonal-conditions'],
    applicability: ['day-stem, season/month, support condition, and exact clause scope are source-bound'],
    requiredStructuralResult: { ruleIds: [], fields: ['day-stem', 'season/month', 'condition clause', 'exception'], closure: 'condition_clause_requires_explicit_source_context' },
    sourceDefinedOutput: { kind: 'semantic_candidate', role: 'day-stem seasonal condition clause', outputShape: ['matched source clause'], scope: 'no strength, use-selection, or personal result' },
    exceptions: ['do not generalize the 甲木 clauses to other stems or turn them into an element preference table'],
    sourceObservation: 'p.4–p.7 contain stem-specific seasonal/support sentences, including 甲木, but the frozen Base has no source-specific season context and the sentences carry interpretive conditions.',
  }),
  ditianInventoryEntry({
    inventoryId: 'inventory.ditian.p10-branch-categories.v0',
    status: 'adopted_structural_rule',
    contractRuleId: 'rule.ditian.branch-category-inventory.v0',
    locatorIds: ['ditian-p10-branch-categories'],
    applicability: ['exact time and all four recognizable branch values are present'],
    requiredStructuralResult: { ruleIds: ['rule.ditian.branch-category-inventory.v0'], fields: ['branchCategoriesByPosition', 'sourceGroups', 'precedence'], closure: 'closed_in_existing_contract' },
    sourceDefinedOutput: { kind: 'structural', role: 'source branch-group membership inventory', outputShape: ['branch by position', 'overlapping category labels'], scope: 'membership only; no relation outcome' },
    exceptions: ['preserve overlap among 四生/四庫/四敗 and 陽支/陰支; do not rank groups'],
    sourceObservation: 'p.10 visibly lists 陽支/陰支 and the 四生/四庫/四敗 group names; only their membership inventory is materialized.',
  }),
  ditianInventoryEntry({
    inventoryId: 'inventory.ditian.p12-shape-examples.v0',
    status: 'adopted_structural_rule',
    contractRuleId: 'rule.ditian.shape-example-inventory.v0',
    locatorIds: ['ditian-p12-shape-examples'],
    applicability: ['exact time, day-master, and month branch are present and match a named p.12 pair'],
    requiredStructuralResult: { ruleIds: ['rule.ditian.shape-example-inventory.v0'], fields: ['sourceCondition', 'matchedExamples', 'sourceExampleScope'], closure: 'closed_in_existing_contract' },
    sourceDefinedOutput: { kind: 'structural_example_inventory', role: 'exact 形全/形缺 example label', outputShape: ['day-stem', 'month window', 'source label'], scope: 'named examples only; no general 形象 classifier' },
    exceptions: ['unlisted stem/month pairs remain not applicable'],
    sourceObservation: 'p.12 provides four exact 形全/形缺 examples; the rule preserves those examples without expanding their label.',
  }),
  ditianInventoryEntry({
    inventoryId: 'inventory.ditian.p13-fang-ju-examples.v0',
    status: 'adopted_structural_rule',
    contractRuleId: 'rule.ditian.fang-ju-example-inventory.v0',
    locatorIds: ['ditian-p13-fang-ju-examples'],
    applicability: ['exact time and all four branch values are present with 寅卯辰 or 亥卯未 membership'],
    requiredStructuralResult: { ruleIds: ['rule.ditian.fang-ju-example-inventory.v0'], fields: ['suppliedBranches', 'matchedExamples', 'precedence'], closure: 'closed_in_existing_contract' },
    sourceDefinedOutput: { kind: 'structural_relation_inventory', role: 'exact 方/局 branch-set example', outputShape: ['relation', 'label', 'required branch set', 'positions'], scope: 'example membership only; no 方/局 precedence' },
    exceptions: ['simultaneous exact memberships are preserved; no mixing or outcome rule is applied'],
    sourceObservation: 'p.13 names 寅卯辰 as 東方 and 亥卯未 as 木局 before the broader 格局 surface.',
  }),
  ditianInventoryEntry({
    inventoryId: 'inventory.ditian.p13-p14-geju.v0',
    status: 'context_bound_candidate',
    locatorIds: ['ditian-p13-p14-geju-surface'],
    applicability: ['month-branch source axis, exposed-stem condition, pattern identity, and selection priority are all explicit'],
    requiredStructuralResult: { ruleIds: [], fields: ['month branch', 'visible stem', '格局 identity', 'priority'], closure: 'pattern_selection_context_not_closed' },
    sourceDefinedOutput: { kind: 'semantic_candidate', role: '格局/透干 condition surface', outputShape: ['source-local pattern condition'], scope: 'no generalized pattern or personal result' },
    exceptions: ['do not use “月支之神透於天干” as a universal 透干 classifier'],
    sourceObservation: 'p.13–p.14 contain 格局 and 透干 wording but also selection/outcome context that is not a closed independent predicate.',
  }),
  ditianInventoryEntry({
    inventoryId: 'inventory.ditian.p15-p17-conghua-dayun.v0',
    status: 'context_bound_candidate',
    locatorIds: ['ditian-p15-p17-conghua-dayun'],
    applicability: ['從化/歲運 inputs, source priority, and output boundary are independently closed'],
    requiredStructuralResult: { ruleIds: [], fields: ['從化 condition', '歲運 input', 'transition/priority'], closure: 'timing_and_outcome_context_not_closed' },
    sourceDefinedOutput: { kind: 'semantic_candidate', role: '從化/歲運 condition surface', outputShape: ['source-local condition'], scope: 'no prediction or 吉凶 result' },
    exceptions: ['do not derive timing or outcome from section headings or modern rules'],
    sourceObservation: 'p.15–p.17 combine conditional 從化 and 歲運 language with outcome prose; no executable non-outcome composition is closed.',
  }),
  ditianInventoryEntry({
    inventoryId: 'inventory.ditian.p18-p20-tiyong.v0',
    status: 'unresolved',
    locatorIds: ['ditian-p18-p20-tiyong'],
    applicability: ['source-defined body/use axis, multiple configuration selection, and transition priority must be explicit'],
    requiredStructuralResult: { ruleIds: [], fields: ['體', '用', 'configuration axis', 'priority/transition'], closure: 'composition_and_priority_not_closed' },
    sourceDefinedOutput: { kind: 'not_materialized', role: '體用 configuration surface', outputShape: [], scope: 'no use-selection or personal result' },
    exceptions: ['do not equate 體用之用 with 用神之用 or choose a single configuration'],
    sourceObservation: 'p.18–p.20 explicitly distinguish several 體用 axes and state that one endpoint is not sufficient; the composition grammar remains unresolved.',
    compositionState: 'unresolved_composition_frontier',
  }),
  ditianInventoryEntry({
    inventoryId: 'inventory.ditian.p24-p27-yuanliu-qingzhuo.v0',
    status: 'unresolved',
    locatorIds: ['ditian-p24-p27-yuanliu-qingzhuo'],
    applicability: ['source-flow/clarity conditions and non-outcome structural outputs are closed'],
    requiredStructuralResult: { ruleIds: [], fields: ['源流', '清濁', '形象 condition', 'exception'], closure: 'source_surface_not_closed' },
    sourceDefinedOutput: { kind: 'not_materialized', role: '源流/清濁/後續形象 surface', outputShape: [], scope: 'no 吉凶 or personal result' },
    exceptions: ['do not generalize later verses or case language into a universal rule'],
    sourceObservation: 'p.24–p.27 contain later structural vocabulary mixed with semantic/outcome sentences; the current locator set does not close a reusable predicate.',
    compositionState: 'unresolved_composition_frontier',
  }),
])

export const SAJU_QIONGTONG_INVENTORY_STATUSES = Object.freeze([
  'adopted_structural_rule',
  'context_bound_candidate',
  'unresolved',
  'unsupported',
])

const qiongtongInventoryEntry = value => ({
  inventorySchema: 'saju-qiongtong-source-rule-inventory-v0',
  work: WORKS.qiongtong,
  lineage: 'qiongtong_local_export',
  sourceIds: ['saju-source-qiongtong-baojian'],
  locatorIds: [],
  requiredStructuralResult: { ruleIds: [], fields: [], closure: 'not_closed' },
  sourceDefinedOutput: { kind: 'not_materialized', role: 'source-bounded rule surface', outputShape: [], scope: 'qiongtong-local-only' },
  applicability: [],
  exceptions: [],
  forbiddenExtensions: [...FORBIDDEN_EXTENSIONS],
  compositionState: 'coexistence_only_until_source_priority_is_closed',
  sourceObservation: '',
  ...value,
})

export const SAJU_QIONGTONG_RULE_INVENTORY = Object.freeze([
  qiongtongInventoryEntry({
    inventoryId: 'inventory.qiongtong.p2-element-number.v0',
    status: 'adopted_structural_rule',
    contractRuleId: 'rule.qiongtong.five-phase-number-inventory.v0',
    locatorIds: ['qiongtong-p2-five-phase-number-and-season'],
    applicability: ['the frozen five-element key envelope is present'],
    requiredStructuralResult: { ruleIds: ['rule.qiongtong.five-phase-number-inventory.v0'], fields: ['sourceElementNumbers', 'suppliedElementKeys', 'stateOperation'], closure: 'closed_in_existing_contract' },
    sourceDefinedOutput: { kind: 'structural', role: 'source element-number inventory', outputShape: ['水/火/木/金/土 number'], scope: 'number mapping only; no state arithmetic' },
    exceptions: ['生旺/死绝 operation remains a separate unresolved prerequisite'],
    sourceObservation: 'p.2 directly lists 水一、火二、木三、金四、土五; the adjacent double/half operation is not applied here.',
  }),
  qiongtongInventoryEntry({
    inventoryId: 'inventory.qiongtong.p2-shengwang-jue-state.v0',
    status: 'unresolved',
    locatorIds: ['qiongtong-p2-five-phase-number-and-season'],
    applicability: ['source-specific 生旺/死绝 state input, resolver, precedence, and exception procedure are closed'],
    requiredStructuralResult: { ruleIds: [], fields: ['element', 'state label', 'state resolver', 'operation'], closure: 'source_specific_state_resolver_unresolved' },
    sourceDefinedOutput: { kind: 'not_materialized', role: '生旺/死绝 double/half surface', outputShape: [], scope: 'existing blocked prerequisite remains unresolved' },
    exceptions: ['do not use generic 十二運星, Base distribution, hidden-stem weights, or another lineage to fill the state'],
    sourceObservation: 'p.2 gives the operation but not the state derivation/input shape/priority; this is the previously unresolved lineage-only gap.',
    compositionState: 'unresolved_composition_frontier',
  }),
  qiongtongInventoryEntry({
    inventoryId: 'inventory.qiongtong.p3-p90-day-stem-section-frame.v0',
    status: 'adopted_structural_rule',
    contractRuleId: 'rule.qiongtong.day-stem-section-frame.v0',
    locatorIds: ['qiongtong-p3-jia-section', 'qiongtong-p13-yi-section', 'qiongtong-p21-bing-section', 'qiongtong-p32-ding-section', 'qiongtong-p40-wu-section', 'qiongtong-p49-ji-section', 'qiongtong-p55-geng-section', 'qiongtong-p64-xin-section', 'qiongtong-p75-ren-section', 'qiongtong-p83-gui-section'],
    applicability: ['exact time and recognized day-master stem are present'],
    requiredStructuralResult: { ruleIds: ['rule.qiongtong.day-stem-section-frame.v0'], fields: ['dayMasterStem', 'sourceSection', 'monthlyClauseSelection'], closure: 'closed_in_existing_contract' },
    sourceDefinedOutput: { kind: 'structural', role: 'day-stem section frame', outputShape: ['day stem', 'source page band'], scope: 'section selection only; no monthly prescription' },
    exceptions: ['a section heading does not select a month clause or semantic result'],
    sourceObservation: 'p.3–p.90 visibly organize the work by ten day-stem sections; the frame is separate from every month-specific prescription.',
  }),
  qiongtongInventoryEntry({
    inventoryId: 'inventory.qiongtong.p4-p12-jia-month-clauses.v0',
    status: 'context_bound_candidate',
    locatorIds: ['qiongtong-p3-jia-section', 'qiongtong-p4-spring-jia-wood', 'qiongtong-p5-spring-jia-wood-continuation', 'qiongtong-p7-summer-jia-wood'],
    applicability: ['甲 day stem, exact month/season, mandatory conditions, and source clause boundary are supplied'],
    requiredStructuralResult: { ruleIds: [], fields: ['甲', 'month/season', 'condition sequence', 'exception'], closure: 'month_prescription_and_priority_not_closed' },
    sourceDefinedOutput: { kind: 'semantic_candidate', role: '甲月별 condition surface', outputShape: ['source-local clause'], scope: 'no generalized prescription or personal result' },
    exceptions: ['do not collapse spring/summer clauses or extend them to another stem'],
    sourceObservation: 'p.4–p.12 contain separate 三春/三夏 and month-specific 甲 clauses with prescription/outcome language.',
  }),
  qiongtongInventoryEntry({
    inventoryId: 'inventory.qiongtong.p13-p20-yi-month-clauses.v0',
    status: 'context_bound_candidate',
    locatorIds: ['qiongtong-p13-yi-section'],
    applicability: ['乙 day stem, exact month/season, mandatory conditions, and source clause boundary are supplied'],
    requiredStructuralResult: { ruleIds: [], fields: ['乙', 'month/season', 'condition sequence', 'exception'], closure: 'month_prescription_and_priority_not_closed' },
    sourceDefinedOutput: { kind: 'semantic_candidate', role: '乙 month condition surface', outputShape: ['source-local clause'], scope: 'no generalized prescription or personal result' },
    exceptions: ['do not use 甲 clauses or modern seasonal rules to complete this section'],
    sourceObservation: 'p.13–p.20 open the 乙木 section and its month-specific condition clauses; the current Base has no source-month bridge.',
  }),
  qiongtongInventoryEntry({
    inventoryId: 'inventory.qiongtong.p21-p31-bing-month-clauses.v0',
    status: 'context_bound_candidate',
    locatorIds: ['qiongtong-p21-bing-section'],
    applicability: ['丙 day stem, exact month/season, mandatory conditions, and source clause boundary are supplied'],
    requiredStructuralResult: { ruleIds: [], fields: ['丙', 'month/season', 'condition sequence', 'exception'], closure: 'month_prescription_and_priority_not_closed' },
    sourceDefinedOutput: { kind: 'semantic_candidate', role: '丙 month condition surface', outputShape: ['source-local clause'], scope: 'no generalized prescription or personal result' },
    exceptions: ['do not generalize fire prescriptions or infer strength'],
    sourceObservation: 'p.21–p.31 provide a separate 丙火 section with seasonal/month conditions and source outcome language.',
  }),
  qiongtongInventoryEntry({
    inventoryId: 'inventory.qiongtong.p32-p39-ding-month-clauses.v0',
    status: 'context_bound_candidate',
    locatorIds: ['qiongtong-p32-ding-section'],
    applicability: ['丁 day stem, exact month/season, mandatory conditions, and source clause boundary are supplied'],
    requiredStructuralResult: { ruleIds: [], fields: ['丁', 'month/season', 'condition sequence', 'exception'], closure: 'month_prescription_and_priority_not_closed' },
    sourceDefinedOutput: { kind: 'semantic_candidate', role: '丁 month condition surface', outputShape: ['source-local clause'], scope: 'no generalized prescription or personal result' },
    exceptions: ['do not transfer 丙 or modern fire rules'],
    sourceObservation: 'p.32–p.39 provide the separate 丁火 month surface; no single cross-month priority is extracted.',
  }),
  qiongtongInventoryEntry({
    inventoryId: 'inventory.qiongtong.p40-p48-wu-month-clauses.v0',
    status: 'context_bound_candidate',
    locatorIds: ['qiongtong-p40-wu-section'],
    applicability: ['戊 day stem, exact month/season, mandatory conditions, and source clause boundary are supplied'],
    requiredStructuralResult: { ruleIds: [], fields: ['戊', 'month/season', 'condition sequence', 'exception'], closure: 'month_prescription_and_priority_not_closed' },
    sourceDefinedOutput: { kind: 'semantic_candidate', role: '戊 month condition surface', outputShape: ['source-local clause'], scope: 'no generalized prescription or personal result' },
    exceptions: ['do not translate earth clauses into strength or balance'],
    sourceObservation: 'p.40–p.48 provide the separate 戊土 section with month conditions and prescription language.',
  }),
  qiongtongInventoryEntry({
    inventoryId: 'inventory.qiongtong.p49-p54-ji-month-clauses.v0',
    status: 'context_bound_candidate',
    locatorIds: ['qiongtong-p49-ji-section'],
    applicability: ['己 day stem, exact month/season, mandatory conditions, and source clause boundary are supplied'],
    requiredStructuralResult: { ruleIds: [], fields: ['己', 'month/season', 'condition sequence', 'exception'], closure: 'month_prescription_and_priority_not_closed' },
    sourceDefinedOutput: { kind: 'semantic_candidate', role: '己 month condition surface', outputShape: ['source-local clause'], scope: 'no generalized prescription or personal result' },
    exceptions: ['do not transfer 戊 or modern earth rules'],
    sourceObservation: 'p.49–p.54 provide the separate 己土 section; conditions are not normalized into a general procedure.',
  }),
  qiongtongInventoryEntry({
    inventoryId: 'inventory.qiongtong.p55-p64-geng-month-clauses.v0',
    status: 'context_bound_candidate',
    locatorIds: ['qiongtong-p55-geng-section'],
    applicability: ['庚 day stem, exact month/season, mandatory conditions, and source clause boundary are supplied'],
    requiredStructuralResult: { ruleIds: [], fields: ['庚', 'month/season', 'condition sequence', 'exception'], closure: 'month_prescription_and_priority_not_closed' },
    sourceDefinedOutput: { kind: 'semantic_candidate', role: '庚 month condition surface', outputShape: ['source-local clause'], scope: 'no generalized prescription or personal result' },
    exceptions: ['do not infer metal strength or use selection'],
    sourceObservation: 'p.55–p.64 provide the 庚金 section with month-specific clauses; no source-complete priority is adopted.',
  }),
  qiongtongInventoryEntry({
    inventoryId: 'inventory.qiongtong.p64-p73-xin-month-clauses.v0',
    status: 'context_bound_candidate',
    locatorIds: ['qiongtong-p64-xin-section'],
    applicability: ['辛 day stem, exact month/season, mandatory conditions, and source clause boundary are supplied'],
    requiredStructuralResult: { ruleIds: [], fields: ['辛', 'month/season', 'condition sequence', 'exception'], closure: 'month_prescription_and_priority_not_closed' },
    sourceDefinedOutput: { kind: 'semantic_candidate', role: '辛 month condition surface', outputShape: ['source-local clause'], scope: 'no generalized prescription or personal result' },
    exceptions: ['do not use 庚 or modern metal prescriptions to complete this section'],
    sourceObservation: 'p.64–p.73 provide the 辛金 section; the month-specific prescriptions remain context-bound.',
  }),
  qiongtongInventoryEntry({
    inventoryId: 'inventory.qiongtong.p75-p82-ren-month-clauses.v0',
    status: 'context_bound_candidate',
    locatorIds: ['qiongtong-p75-ren-section'],
    applicability: ['壬 day stem, exact month/season, mandatory conditions, and source clause boundary are supplied'],
    requiredStructuralResult: { ruleIds: [], fields: ['壬', 'month/season', 'condition sequence', 'exception'], closure: 'month_prescription_and_priority_not_closed' },
    sourceDefinedOutput: { kind: 'semantic_candidate', role: '壬 month condition surface', outputShape: ['source-local clause'], scope: 'no generalized prescription or personal result' },
    exceptions: ['do not infer water strength or personal meaning'],
    sourceObservation: 'p.75–p.82 provide the 壬水 section; the direct locator does not close a month-selection grammar.',
  }),
  qiongtongInventoryEntry({
    inventoryId: 'inventory.qiongtong.p83-p90-gui-month-clauses.v0',
    status: 'context_bound_candidate',
    locatorIds: ['qiongtong-p83-gui-section'],
    applicability: ['癸 day stem, exact month/season, mandatory conditions, and source clause boundary are supplied'],
    requiredStructuralResult: { ruleIds: [], fields: ['癸', 'month/season', 'condition sequence', 'exception'], closure: 'month_prescription_and_priority_not_closed' },
    sourceDefinedOutput: { kind: 'semantic_candidate', role: '癸 month condition surface', outputShape: ['source-local clause'], scope: 'no generalized prescription or personal result' },
    exceptions: ['do not use 壬 or modern water prescriptions to complete this section'],
    sourceObservation: 'p.83–p.90 provide the 癸水 section; no general prescription or cross-section priority is adopted.',
  }),
  qiongtongInventoryEntry({
    inventoryId: 'inventory.qiongtong.cross-month-precedence.v0',
    status: 'unresolved',
    locatorIds: ['qiongtong-p2-five-phase-number-and-season', 'qiongtong-p3-jia-section', 'qiongtong-p13-yi-section', 'qiongtong-p21-bing-section', 'qiongtong-p32-ding-section', 'qiongtong-p40-wu-section', 'qiongtong-p49-ji-section', 'qiongtong-p55-geng-section', 'qiongtong-p64-xin-section', 'qiongtong-p75-ren-section', 'qiongtong-p83-gui-section'],
    applicability: ['a source-defined priority/transition rule across the ten day-stem sections is directly available'],
    requiredStructuralResult: { ruleIds: [], fields: ['section match', 'month match', 'condition priority', 'transition'], closure: 'cross_section_priority_not_closed' },
    sourceDefinedOutput: { kind: 'not_materialized', role: 'cross-month composition frontier', outputShape: [], scope: 'no selection, strength, or personal result' },
    exceptions: ['preserve each section and month clause separately; do not use modern practice or another lineage to rank them'],
    sourceObservation: 'the work is divided into day-stem/month paragraphs, but the inspected surface does not provide a single cross-section priority or transition grammar.',
    compositionState: 'unresolved_composition_frontier',
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

const sourceSemanticContractSpecForRules = (rules, ruleId, value) => {
  const ruleItem = rules.find(item => item.ruleId === ruleId)
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

const sourceSemanticContractSpec = (ruleId, value) => sourceSemanticContractSpecForRules(SAJU_ZIPING_SOURCE_SEMANTIC_RULES, ruleId, value)
const sanmingSourceSemanticContractSpec = (ruleId, value) => sourceSemanticContractSpecForRules(SAJU_SANMING_SOURCE_SEMANTIC_RULES, ruleId, value)

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

export const SAJU_SANMING_SOURCE_SEMANTIC_CONTRACTS = Object.freeze([
  sanmingSourceSemanticContractSpec('rule.sanming.role-nomenclature.v0'),
])

export const SAJU_SOURCE_BOUNDED_SEMANTIC_LEXICON_SCHEMA = 'saju-source-bounded-semantic-lexicon-v0'
export const SAJU_SOURCE_BOUNDED_SEMANTIC_LEXICON_VERSION = '0.1.0'
export const SAJU_SOURCE_BOUNDED_SEMANTIC_LEXICON_STATUSES = Object.freeze([
  'adopted_semantic_entry',
  'context_bound_entry',
  'unresolved',
  'unsupported',
])

const SOURCE_SEMANTIC_LEXICON_COMPOSITION_STATES = Object.freeze([
  'coexistence_only_until_source_priority_is_closed',
  'unresolved_composition_frontier',
])

const sourceByteSha256ForIds = sourceIds => Object.fromEntries(
  sourceIds.map(sourceId => [
    sourceId,
    SAJU_LINEAGE_SOURCE_PROFILES.find(source => source.sourceId === sourceId)?.byteSha256 || null,
  ]),
)

const sourceSemanticLexiconEntry = value => {
  const sourceIds = [...(value.sourceIds || [])]
  const locatorIds = [...(value.locatorIds || [])]
  return {
    inventorySchema: SAJU_SOURCE_BOUNDED_SEMANTIC_LEXICON_SCHEMA,
    version: SAJU_SOURCE_BOUNDED_SEMANTIC_LEXICON_VERSION,
    claimPromotion: false,
    semanticAuthority: 'not_established',
    sourceIds,
    locatorIds,
    requiredStructuralResult: {
      ruleIds: [],
      fields: [],
      closure: 'catalog_only_no_personal_application',
    },
    linkedStructuralRuleIds: [],
    linkedSemanticRuleIds: [],
    materializationMode: 'catalog_only_source_vocabulary',
    target: {
      symbolOrStructure: null,
      kind: 'source_term',
    },
    sourceTerm: '',
    directMeaningRange: {
      kind: 'source_wording_only',
      supportedClaims: [],
      scope: 'source-bounded wording only',
    },
    applicability: [],
    exceptions: [],
    forbiddenExtensions: [...FORBIDDEN_EXTENSIONS],
    compositionState: 'coexistence_only_until_source_priority_is_closed',
    sourceObservation: '',
    provenance: {
      schema: SAJU_SOURCE_BOUNDED_SEMANTIC_LEXICON_SCHEMA,
      version: SAJU_SOURCE_BOUNDED_SEMANTIC_LEXICON_VERSION,
      sourceIds,
      locatorIds,
      sourceByteSha256: sourceByteSha256ForIds(sourceIds),
    },
    ...value,
    sourceIds,
    locatorIds,
    provenance: value.provenance || {
      schema: SAJU_SOURCE_BOUNDED_SEMANTIC_LEXICON_SCHEMA,
      version: SAJU_SOURCE_BOUNDED_SEMANTIC_LEXICON_VERSION,
      sourceIds,
      locatorIds,
      sourceByteSha256: sourceByteSha256ForIds(sourceIds),
    },
  }
}

/**
 * Source vocabulary inventory.  This is deliberately not a modern meaning
 * table: source terms remain in their local wording, and a resolved entry is
 * only materialized when its named lineage rule/result chain is present.
 */
export const SAJU_SOURCE_BOUNDED_SEMANTIC_LEXICON = Object.freeze([
  sourceSemanticLexiconEntry({
    entryId: 'lexicon.ziping.p3-life-cycle-terms.v0',
    work: WORKS.ziping,
    lineage: 'ziping_local_export',
    sourceIds: ['saju-source-ziping-zhenquan'],
    locatorIds: ['ziping-p3-yang-yin-root-cycle-and-tomb-exception'],
    status: 'adopted_semantic_entry',
    target: { symbolOrStructure: 'stem-life-cycle-and-root-qualification', kind: 'source_state_vocabulary' },
    sourceTerm: '長生 · 沐浴 · 冠帶 · 臨官 · 帝旺 · 衰 · 病 · 死 · 墓 · 絕 · 胎 · 養',
    directMeaningRange: {
      kind: 'source_stage_definition',
      supportedClaims: ['p.3 gives local definitions for the twelve stage terms and relates the cycle to source-local stem/branch qualification'],
      scope: 'source vocabulary and stated definitions only; no complete resolver or strength conclusion',
    },
    applicability: ['the term is read only as the p.3 source vocabulary', 'the source-local yin/yang and tomb qualifications remain attached to the same locator'],
    exceptions: ['no all-stem/all-branch lookup table is inferred', 'no modern 十二運星 table is imported'],
    sourceObservation: 'p.3 directly defines the twelve stage terms and then qualifies the source-local root/tomb discussion.',
  }),
  sourceSemanticLexiconEntry({
    entryId: 'lexicon.ziping.p3-root-qualification.v0',
    work: WORKS.ziping,
    lineage: 'ziping_local_export',
    sourceIds: ['saju-source-ziping-zhenquan'],
    locatorIds: ['ziping-p3-yang-yin-root-cycle-and-tomb-exception'],
    status: 'context_bound_entry',
    target: { symbolOrStructure: 'stem-branch-root-qualification', kind: 'source_qualification' },
    sourceTerm: '有根 · 無根 · 逢庫',
    directMeaningRange: {
      kind: 'source_qualification',
      supportedClaims: ['p.3 uses 有根/無根 and 逢庫 in a local qualification passage'],
      scope: 'source-local qualification only; no strength/weakness or personal meaning',
    },
    applicability: ['source-local stem/branch and tomb context would have to be bound'],
    exceptions: ['yin/yang exception and complete state precedence are not closed'],
    sourceObservation: 'p.3 places 有根/無根 beside the life-cycle and tomb examples; it is not a complete generic predicate.',
  }),
  sourceSemanticLexiconEntry({
    entryId: 'lexicon.ziping.p5-relation-action-terms.v0',
    work: WORKS.ziping,
    lineage: 'ziping_local_export',
    sourceIds: ['saju-source-ziping-zhenquan'],
    locatorIds: ['ziping-p5-branch-relations-definition-and-examples'],
    status: 'context_bound_entry',
    linkedStructuralRuleIds: ['rule.ziping.branch-relation-inventory.v0'],
    requiredStructuralResult: {
      ruleIds: ['rule.ziping.branch-relation-inventory.v0'],
      fields: ['relations', 'sourceListedRelationNames'],
      closure: 'inventory_closed_resolution_not_closed',
    },
    materializationMode: 'linked_result_only',
    target: { symbolOrStructure: 'branch-relation-inventory', kind: 'source_action_vocabulary' },
    sourceTerm: '刑 · 沖 · 會 · 合 · 解',
    directMeaningRange: {
      kind: 'source_relation_action_vocabulary',
      supportedClaims: ['p.5 names 刑/沖/會/合 and discusses whether a relation can be 解'],
      scope: 'relation/action labels only; no cancellation, valence, or winner selection',
    },
    applicability: ['the supplied branch relation inventory is present', 'the source-local relation context remains separate from other lineages'],
    exceptions: ['simultaneous relation labels remain present', 'the source does not close a complete precedence resolver in this lane'],
    sourceObservation: 'p.5 directly presents the relation names and examples while leaving relation resolution case-bound.',
  }),
  sourceSemanticLexiconEntry({
    entryId: 'lexicon.ziping.p6-yongshen-term.v0',
    work: WORKS.ziping,
    lineage: 'ziping_local_export',
    sourceIds: ['saju-source-ziping-zhenquan'],
    locatorIds: ['page.local.ziping.p6-yongshin'],
    status: 'unresolved',
    target: { symbolOrStructure: '用神', kind: 'source_selection_term' },
    sourceTerm: '用神',
    directMeaningRange: {
      kind: 'source_selection_term',
      supportedClaims: ['p.6 states 用神 is sought from the month command'],
      scope: 'source statement only; no selection result or priority algorithm',
    },
    applicability: ['a complete source-defined selection procedure would be required'],
    exceptions: ['do not choose 用神 from a heading or from modern practice'],
    sourceObservation: 'p.6 gives the governing phrase but continues into case-specific conditions without a complete universal selector.',
    compositionState: 'unresolved_composition_frontier',
  }),
  sourceSemanticLexiconEntry({
    entryId: 'lexicon.ziping.p7-selection-clause.v0',
    work: WORKS.ziping,
    lineage: 'ziping_local_export',
    sourceIds: ['saju-source-ziping-zhenquan'],
    locatorIds: ['page.local.ziping.p7-yongshin-continuation'],
    status: 'adopted_semantic_entry',
    linkedStructuralRuleIds: ['rule.ziping.yin-month-exposure-contrast.v0'],
    linkedSemanticRuleIds: ['rule.ziping.yin-month-exposure-change.v0'],
    requiredStructuralResult: {
      ruleIds: ['rule.ziping.yin-month-exposure-contrast.v0'],
      fields: ['sourceCondition', 'absentVisibleStem', 'exposedVisibleStem', 'exposedPositions'],
      closure: 'closed_in_existing_contract',
    },
    materializationMode: 'linked_result_only',
    target: { symbolOrStructure: '寅月-不透甲而透丙', kind: 'source_clause' },
    sourceTerm: '同知得以作主',
    directMeaningRange: {
      kind: 'source_local_selection_change_clause',
      supportedClaims: ['p.7 attaches 同知得以作主 to the exact 不透甲而透丙 case'],
      scope: 'exact p.7 clause only; not a global 用神 priority or personal conclusion',
    },
    applicability: ['the p.7 structural contrast and semantic rule result are both materialized'],
    exceptions: ['duplicate visible 丙, another month, or another lineage blocks the entry'],
    sourceObservation: 'p.7 places the phrase inside the local 用神变化 discussion and the existing executable rule preserves that scope.',
  }),
  sourceSemanticLexiconEntry({
    entryId: 'lexicon.ziping.p10-role-labels.v0',
    work: WORKS.ziping,
    lineage: 'ziping_local_export',
    sourceIds: ['saju-source-ziping-zhenquan'],
    locatorIds: ['ziping-p10-chen-exposed-stem-definition'],
    status: 'adopted_semantic_entry',
    linkedStructuralRuleIds: ['rule.ziping.chen-exposure-inventory.v0'],
    linkedSemanticRuleIds: ['rule.ziping.chen-exposure-use-role.v0'],
    requiredStructuralResult: {
      ruleIds: ['rule.ziping.chen-exposure-inventory.v0'],
      fields: ['namedExposureMatches', 'multiplicity'],
      closure: 'closed_in_existing_contract',
    },
    materializationMode: 'linked_result_only',
    target: { symbolOrStructure: '甲生辰月-named-exposure', kind: 'source_role_label' },
    sourceTerm: '偏財 · 正印 · 月劫',
    directMeaningRange: {
      kind: 'source_role_label_inventory',
      supportedClaims: ['p.10 names 戊/癸/乙 exposure as 偏財/正印/月劫 in the exact 甲生辰月 passage'],
      scope: 'source role labels attached to named exposures only; no modern ten-god meaning table',
    },
    applicability: ['the exact p.10 structural and semantic results are materialized'],
    exceptions: ['other stems, month branches, or role chapters are not included'],
    sourceObservation: 'p.10 defines 透干 in the local 甲生辰月 case and names the three role labels.',
  }),
  sourceSemanticLexiconEntry({
    entryId: 'lexicon.ziping.p11-sentiment-terms.v0',
    work: WORKS.ziping,
    lineage: 'ziping_local_export',
    sourceIds: ['saju-source-ziping-zhenquan'],
    locatorIds: ['ziping-p11-exposed-stem-and-branch-context'],
    status: 'context_bound_entry',
    target: { symbolOrStructure: 'exposure-and-branch-composition', kind: 'source_composition_vocabulary' },
    sourceTerm: '有情 · 無情',
    directMeaningRange: {
      kind: 'source_composition_vocabulary',
      supportedClaims: ['p.11 defines 有情 as 順而相成 and 無情 as 逆而相背'],
      scope: 'source definitions and examples only; no static valence or personal meaning',
    },
    applicability: ['透干, 會支, and the source case conditions must be bound together'],
    exceptions: ['transition examples 有情而卒成無情 and 無情而終有情 remain separate'],
    sourceObservation: 'p.11 gives both definitions and transition examples, so the terms are not a single static classifier.',
    compositionState: 'unresolved_composition_frontier',
  }),
  sourceSemanticLexiconEntry({
    entryId: 'lexicon.ziping.p14-personal-surface.v0',
    work: WORKS.ziping,
    lineage: 'ziping_local_export',
    sourceIds: ['saju-source-ziping-zhenquan'],
    locatorIds: ['ziping-p14-six-relations-use'],
    status: 'unsupported',
    target: { symbolOrStructure: '六親/宮分', kind: 'personal_semantic_surface' },
    sourceTerm: '配六親',
    directMeaningRange: {
      kind: 'out_of_public_scope',
      supportedClaims: ['p.14 enters palace and six-relation mapping language'],
      scope: 'not materialized in the source-bounded public lexicon',
    },
    applicability: ['personal/family semantic mapping would be required'],
    exceptions: ['no family, spouse, child, or personal result is exposed'],
    sourceObservation: 'p.14 directly moves into a personal/family semantic surface outside this v0 boundary.',
  }),

  sourceSemanticLexiconEntry({
    entryId: 'lexicon.yuanhai.role-label-opening.v0',
    work: WORKS.yuanhai,
    lineage: 'yuanhai_local_export',
    sourceIds: ['saju-source-yuanhai-ziping'],
    locatorIds: ['yuanhai-p2-foundation'],
    status: 'context_bound_entry',
    target: { symbolOrStructure: 'stem-polarity-and-role-labels', kind: 'source_role_vocabulary' },
    sourceTerm: '五干屬陽 · 喜合 · 五干屬陰 · 喜沖',
    directMeaningRange: {
      kind: 'source_role_vocabulary',
      supportedClaims: ['p.2 places stem polarity and 喜合/喜沖 wording in the opening role-label surface'],
      scope: 'source wording only; no polarity-to-personality or fortune translation',
    },
    applicability: ['the local stem relation and surrounding clause context must be supplied'],
    exceptions: ['do not normalize these phrases into a universal polarity rule'],
    sourceObservation: 'p.2 directly displays the polarity/combination wording beside role-label examples.',
  }),
  sourceSemanticLexiconEntry({
    entryId: 'lexicon.yuanhai.day-anchor-role-frame.v0',
    work: WORKS.yuanhai,
    lineage: 'yuanhai_local_export',
    sourceIds: ['saju-source-yuanhai-ziping'],
    locatorIds: ['yuanhai-p6-day-as-host', 'yuanhai-p7-month-command'],
    status: 'adopted_semantic_entry',
    linkedStructuralRuleIds: ['rule.yuanhai.day-anchor-month-command-frame.v0'],
    requiredStructuralResult: {
      ruleIds: ['rule.yuanhai.day-anchor-month-command-frame.v0'],
      fields: ['sourceRoleFrame', 'factRefs'],
      closure: 'closed_in_existing_contract',
    },
    materializationMode: 'linked_result_only',
    target: { symbolOrStructure: '年/月/日/時 role frame', kind: 'source_role_frame' },
    sourceTerm: '日為主 · 年為根 · 月為提綱/苗 · 日為花 · 時為輔佐/果',
    directMeaningRange: {
      kind: 'source_role_frame',
      supportedClaims: ['p.6–p.7 assigns the supplied year/month/day/hour positions the displayed source roles'],
      scope: 'position-role frame only; no strength, pattern, or personal result',
    },
    applicability: ['the exact four-pillar Yuanhai structural frame is materialized'],
    exceptions: ['missing hour or non-exact time blocks the frame'],
    sourceObservation: 'p.6–p.7 directly state the day anchor and the year/month/day/hour role order.',
  }),
  sourceSemanticLexiconEntry({
    entryId: 'lexicon.yuanhai.dayun-seun-focus.v0',
    work: WORKS.yuanhai,
    lineage: 'yuanhai_local_export',
    sourceIds: ['saju-source-yuanhai-ziping'],
    locatorIds: ['yuanhai-p9-dayun-focus-lens'],
    status: 'adopted_semantic_entry',
    linkedStructuralRuleIds: ['rule.yuanhai.dayun-branch-seun-stem-lens.v0'],
    requiredStructuralResult: {
      ruleIds: ['rule.yuanhai.dayun-branch-seun-stem-lens.v0'],
      fields: ['focusFrame', 'activeDayun', 'seUn'],
      closure: 'closed_in_existing_contract',
    },
    materializationMode: 'linked_result_only',
    target: { symbolOrStructure: '大運/歲君 focus frame', kind: 'source_timing_lens' },
    sourceTerm: '大運看支 · 歲君看干',
    directMeaningRange: {
      kind: 'source_focus_lens',
      supportedClaims: ['p.9 assigns supplied 大運 attention to the branch and supplied 歲君 attention to the stem'],
      scope: 'focus lens only; no timing recomputation or outcome',
    },
    applicability: ['the supplied active 大運 and 歲君/stem facts are present'],
    exceptions: ['direction, start age, transition, and fortune wording remain outside the entry'],
    sourceObservation: 'p.9 directly states 大運看支、歲君看干 and the existing structural rule preserves it as a lens.',
  }),
  sourceSemanticLexiconEntry({
    entryId: 'lexicon.yuanhai-life-cycle-action-terms.v0',
    work: WORKS.yuanhai,
    lineage: 'yuanhai_local_export',
    sourceIds: ['saju-source-yuanhai-ziping'],
    locatorIds: ['yuanhai-p6-day-as-host'],
    status: 'unresolved',
    target: { symbolOrStructure: '生旺死絕休囚制化', kind: 'source_state_action_vocabulary' },
    sourceTerm: '生旺死絕休囚制化',
    directMeaningRange: {
      kind: 'source_state_action_vocabulary',
      supportedClaims: ['p.6 places 生旺死絕休囚制化 inside the day-as-host discussion'],
      scope: 'vocabulary only; no complete state resolver or priority',
    },
    applicability: ['a source-complete state/action procedure is required'],
    exceptions: ['do not import the Sanming or Qiongtong state tables'],
    sourceObservation: 'p.6 names the state/action vocabulary but does not close the full source-specific application procedure.',
    compositionState: 'unresolved_composition_frontier',
  }),
  sourceSemanticLexiconEntry({
    entryId: 'lexicon.yuanhai-personal-surfaces.v0',
    work: WORKS.yuanhai,
    lineage: 'yuanhai_local_export',
    sourceIds: ['saju-source-yuanhai-ziping'],
    locatorIds: ['yuanhai-p11-disease', 'yuanhai-p13-temperament', 'yuanhai-p14-stem-body-poems'],
    status: 'unsupported',
    target: { symbolOrStructure: '疾病/性情/干體', kind: 'personal_semantic_surface' },
    sourceTerm: '論疾病 · 性情 · 干體詩',
    directMeaningRange: {
      kind: 'out_of_public_scope',
      supportedClaims: ['p.11–p.14 contain explicit disease, temperament, and stem-body descriptions'],
      scope: 'not materialized; no trait or health translation',
    },
    applicability: ['personal or health semantic context would be required'],
    exceptions: ['do not translate element/stem terms into traits or health claims'],
    sourceObservation: 'the locators directly enter personal-description surfaces outside the v0 lexicon boundary.',
  }),
  sourceSemanticLexiconEntry({
    entryId: 'lexicon.yuanhai-family-gender-surfaces.v0',
    work: WORKS.yuanhai,
    lineage: 'yuanhai_local_export',
    sourceIds: ['saju-source-yuanhai-ziping'],
    locatorIds: ['yuanhai-p48-six-relations', 'yuanhai-p56-womens-fate'],
    status: 'unsupported',
    target: { symbolOrStructure: '六親/女命', kind: 'personal_family_surface' },
    sourceTerm: '六親總篇 · 女命總訣',
    directMeaningRange: {
      kind: 'out_of_public_scope',
      supportedClaims: ['p.48 and p.56 directly frame family/gender meanings'],
      scope: 'not materialized in the public lexicon',
    },
    applicability: ['family/gender semantic mapping would be required'],
    exceptions: ['no spouse, child, or gender conclusion is produced'],
    sourceObservation: 'the source headings and adjacent prose are explicit, but the surface is outside the requested non-personal lexicon.',
  }),

  sourceSemanticLexiconEntry({
    entryId: 'lexicon.sanming.generation-control.v0',
    work: WORKS.sanming,
    lineage: 'sanming_local_export',
    sourceIds: ['saju-source-sanming-tonghui'],
    locatorIds: ['sanming-p4-element-generation', 'sanming-p5-element-generation-control', 'sanming-p6-stem-branch-origin'],
    status: 'adopted_semantic_entry',
    linkedStructuralRuleIds: ['rule.sanming.element-generation-control-v0'],
    requiredStructuralResult: {
      ruleIds: ['rule.sanming.element-generation-control-v0'],
      fields: ['elementInventory', 'existingStemRelations'],
      closure: 'closed_in_existing_contract',
    },
    materializationMode: 'linked_result_only',
    target: { symbolOrStructure: '五行 relation graph', kind: 'source_action_vocabulary' },
    sourceTerm: '生 · 克 · 制化',
    directMeaningRange: {
      kind: 'source_relation_action_vocabulary',
      supportedClaims: ['p.4–p.6 present the source generation/control vocabulary and supplied relation frame'],
      scope: 'relation/action vocabulary only; no force, balance, or personal result',
    },
    applicability: ['the Sanming element/relation structural result is materialized'],
    exceptions: ['do not recalculate the frozen element distribution or merge another lineage relation table'],
    sourceObservation: 'p.4–p.6 directly present 五行生成/生克 and stem-branch origin language.',
  }),
  sourceSemanticLexiconEntry({
    entryId: 'lexicon.sanming.human-element-service.v0',
    work: WORKS.sanming,
    lineage: 'sanming_local_export',
    sourceIds: ['saju-source-sanming-tonghui'],
    locatorIds: ['sanming-p65-human-element-and-month-command', 'sanming-p66-seasonal-hidden-stem-service'],
    status: 'adopted_semantic_entry',
    linkedStructuralRuleIds: ['rule.sanming.human-element-month-command.v0'],
    requiredStructuralResult: {
      ruleIds: ['rule.sanming.human-element-month-command.v0'],
      fields: ['monthCommandBranch', 'hiddenStems'],
      closure: 'closed_in_existing_contract',
    },
    materializationMode: 'linked_result_only',
    target: { symbolOrStructure: '月令 hidden-stem role', kind: 'source_role_state_vocabulary' },
    sourceTerm: '人元 · 司事之神',
    directMeaningRange: {
      kind: 'source_role_state_vocabulary',
      supportedClaims: ['p.65–p.66 names 人元 and 司事之神 in the month-command/hidden-stem surface'],
      scope: 'source role and supplied hidden-stem inventory only; no service-day weight table',
    },
    applicability: ['the supplied month branch and hidden-stem inventory are present'],
    exceptions: ['the single p.66 service-day example is not generalized'],
    sourceObservation: 'p.65–p.66 directly identify the human element/service role while the existing structural rule stops at the supplied inventory.',
  }),
  sourceSemanticLexiconEntry({
    entryId: 'lexicon.sanming.season-state-vocabulary.v0',
    work: WORKS.sanming,
    lineage: 'sanming_local_export',
    sourceIds: ['saju-source-sanming-tonghui'],
    locatorIds: ['sanming-p67-seasonal-state', 'sanming-p68-twelve-palace-vocabulary'],
    status: 'adopted_semantic_entry',
    linkedStructuralRuleIds: ['rule.sanming.seasonal-state-inventory.v0'],
    requiredStructuralResult: {
      ruleIds: ['rule.sanming.seasonal-state-inventory.v0'],
      fields: ['seasonWindow', 'elementStateBySeason', 'twelvePalaceVocabulary'],
      closure: 'closed_in_existing_contract',
    },
    materializationMode: 'linked_result_only',
    target: { symbolOrStructure: 'seasonal element state', kind: 'source_state_vocabulary' },
    sourceTerm: '旺 · 相 · 休 · 囚 · 死',
    directMeaningRange: {
      kind: 'source_seasonal_state_vocabulary',
      supportedClaims: ['p.67 assigns the displayed 旺相休囚死 labels to the source seasonal windows'],
      scope: 'source seasonal state labels only; no balance or personal conclusion',
    },
    applicability: ['the supplied month branch matches the source seasonal window'],
    exceptions: ['the source sixth-month 土旺 window remains source-local', 'no state ranking beyond the supplied source output'],
    sourceObservation: 'p.67 directly displays the seasonal state vocabulary and p.68 continues with source stage labels.',
  }),
  sourceSemanticLexiconEntry({
    entryId: 'lexicon.sanming.twelve-palace-vocabulary.v0',
    work: WORKS.sanming,
    lineage: 'sanming_local_export',
    sourceIds: ['saju-source-sanming-tonghui'],
    locatorIds: ['sanming-p68-twelve-palace-vocabulary'],
    status: 'adopted_semantic_entry',
    linkedStructuralRuleIds: ['rule.sanming.seasonal-state-inventory.v0'],
    requiredStructuralResult: {
      ruleIds: ['rule.sanming.seasonal-state-inventory.v0'],
      fields: ['twelvePalaceVocabulary'],
      closure: 'closed_in_existing_contract',
    },
    materializationMode: 'linked_result_only',
    target: { symbolOrStructure: '五行寄生十二宮 labels', kind: 'source_state_vocabulary' },
    sourceTerm: '長生 · 沐浴 · 冠帶 · 臨官 · 帝旺 · 衰 · 病 · 死 · 墓 · 絕 · 胎 · 養',
    directMeaningRange: {
      kind: 'source_stage_vocabulary',
      supportedClaims: ['p.68 lists the twelve source stage labels under the titled seasonal-state discussion'],
      scope: 'label inventory only; no modern stage resolver',
    },
    applicability: ['the Sanming seasonal-state structural result is materialized'],
    exceptions: ['do not merge these labels with Ziping or Qiongtong state procedures'],
    sourceObservation: 'p.68 directly lists the stage vocabulary; the existing structural rule preserves the list without applying it.',
  }),
  sourceSemanticLexiconEntry({
    entryId: 'lexicon.sanming.role-nomenclature.v0',
    work: WORKS.sanming,
    lineage: 'sanming_local_export',
    sourceIds: ['saju-source-sanming-tonghui'],
    locatorIds: ['sanming-p162-role-nomenclature'],
    status: 'adopted_semantic_entry',
    linkedStructuralRuleIds: ['rule.sanming.visible-stem-frame.v0'],
    linkedSemanticRuleIds: ['rule.sanming.role-nomenclature.v0'],
    requiredStructuralResult: {
      ruleIds: ['rule.sanming.visible-stem-frame.v0'],
      fields: ['dayMasterStem', 'visibleStemInventory'],
      closure: 'closed_in_existing_contract',
    },
    materializationMode: 'linked_result_only',
    target: { symbolOrStructure: 'visible stem relation labels', kind: 'source_role_label' },
    sourceTerm: '印綬 · 食神 · 官煞 · 妻財 · 正/偏',
    directMeaningRange: {
      kind: 'source_role_nomenclature',
      supportedClaims: ['p.162 names the bounded 正/偏 role labels and the source nomenclature 印綬/食神/官煞/妻財'],
      scope: 'role names only; adjacent family analogy and outcomes are excluded',
    },
    applicability: ['the Sanming visible-stem and role-nomenclature results are materialized'],
    exceptions: ['unknown or same-element labels remain fail-closed', 'no family analogy is emitted'],
    sourceObservation: 'p.162 directly defines the role nomenclature and then continues into family analogy; only the nomenclature lane is retained.',
  }),
  sourceSemanticLexiconEntry({
    entryId: 'lexicon.sanming.composition-terms.v0',
    work: WORKS.sanming,
    lineage: 'sanming_local_export',
    sourceIds: ['saju-source-sanming-tonghui'],
    locatorIds: ['sanming-p78-stem-combination', 'sanming-p80-stem-transformation-general', 'sanming-p81-stem-transformation', 'sanming-p85-branch-combinations', 'sanming-p90-three-punishments', 'sanming-p93-branch-conflict'],
    status: 'unresolved',
    target: { symbolOrStructure: 'stem/branch composition', kind: 'source_composition_vocabulary' },
    sourceTerm: '合 · 化 · 刑 · 沖',
    directMeaningRange: {
      kind: 'source_composition_vocabulary',
      supportedClaims: ['p.78–p.93 contain source sections for combinations, transformation, punishment, and conflict'],
      scope: 'term inventory only; no precedence, transformation winner, or outcome',
    },
    applicability: ['source-specific composition definitions and exceptions must be closed'],
    exceptions: ['do not use Ziping or modern combination tables'],
    sourceObservation: 'the source has direct headings and examples, but the current contract does not close a single source priority grammar.',
    compositionState: 'unresolved_composition_frontier',
  }),
  sourceSemanticLexiconEntry({
    entryId: 'lexicon.sanming.shensha-surface.v0',
    work: WORKS.sanming,
    lineage: 'sanming_local_export',
    sourceIds: ['saju-source-sanming-tonghui'],
    locatorIds: ['sanming-p106-shensha', 'sanming-p130-shensha-summary'],
    status: 'unsupported',
    target: { symbolOrStructure: '神煞', kind: 'unsupported_semantic_surface' },
    sourceTerm: '天乙貴人 · 總論諸神煞',
    directMeaningRange: {
      kind: 'out_of_public_scope',
      supportedClaims: ['p.106 and p.130 directly present shensha sections and outcome clauses'],
      scope: 'not materialized as a public semantic entry',
    },
    applicability: ['a source-complete non-outcome mapping would be required'],
    exceptions: ['do not expose shensha as personal or fortune meaning'],
    sourceObservation: 'the locators are direct shensha surfaces, but their public non-outcome contract remains unsupported.',
  }),

  sourceSemanticLexiconEntry({
    entryId: 'lexicon.ditian.heaven-earth-human.v0',
    work: WORKS.ditian,
    lineage: 'ditian_local_export',
    sourceIds: ['saju-source-ditian-sui'],
    locatorIds: ['ditian-p2-heaven-earth-human-frame'],
    status: 'adopted_semantic_entry',
    linkedStructuralRuleIds: ['rule.ditian.heaven-earth-human-frame.v0'],
    requiredStructuralResult: {
      ruleIds: ['rule.ditian.heaven-earth-human-frame.v0'],
      fields: ['positions', 'sourceLabels'],
      closure: 'closed_in_existing_contract',
    },
    materializationMode: 'linked_result_only',
    target: { symbolOrStructure: 'stem/branch/hidden-stem frame', kind: 'source_role_frame' },
    sourceTerm: '天元 · 地元 · 人元',
    directMeaningRange: {
      kind: 'source_role_frame',
      supportedClaims: ['p.2 assigns the supplied visible stem, visible branch, and hidden-stem layer the displayed source labels'],
      scope: 'role frame only; no 順悖, 吉凶, or personal meaning',
    },
    applicability: ['the exact Ditian heaven/earth/human structural result is materialized'],
    exceptions: ['do not attach p.2 outcome wording to the frame'],
    sourceObservation: 'p.2 directly states 日干为天元, 地支为地元, and 支中所藏为人元.',
  }),
  sourceSemanticLexiconEntry({
    entryId: 'lexicon.ditian-branch-categories.v0',
    work: WORKS.ditian,
    lineage: 'ditian_local_export',
    sourceIds: ['saju-source-ditian-sui'],
    locatorIds: ['ditian-p10-branch-categories'],
    status: 'adopted_semantic_entry',
    linkedStructuralRuleIds: ['rule.ditian.branch-category-inventory.v0'],
    requiredStructuralResult: {
      ruleIds: ['rule.ditian.branch-category-inventory.v0'],
      fields: ['branchCategories'],
      closure: 'closed_in_existing_contract',
    },
    materializationMode: 'linked_result_only',
    target: { symbolOrStructure: 'branch category inventory', kind: 'source_category_vocabulary' },
    sourceTerm: '陽支 · 陰支 · 四生 · 四庫 · 四敗',
    directMeaningRange: {
      kind: 'source_category_vocabulary',
      supportedClaims: ['p.10 lists the five named branch groups and their member sets'],
      scope: 'category labels and memberships only; no preference/outcome rule',
    },
    applicability: ['the exact source branch-category inventory is materialized'],
    exceptions: ['p.10 preference and conflict prose is not attached to the category entry'],
    sourceObservation: 'p.10 directly lists the yang/yin, four-birth, four-storehouse, and four-defeat groups.',
  }),
  sourceSemanticLexiconEntry({
    entryId: 'lexicon.ditian-shape-labels.v0',
    work: WORKS.ditian,
    lineage: 'ditian_local_export',
    sourceIds: ['saju-source-ditian-sui'],
    locatorIds: ['ditian-p12-shape-examples'],
    status: 'adopted_semantic_entry',
    linkedStructuralRuleIds: ['rule.ditian.shape-example-inventory.v0'],
    requiredStructuralResult: {
      ruleIds: ['rule.ditian.shape-example-inventory.v0'],
      fields: ['matchedExamples'],
      closure: 'closed_in_existing_contract',
    },
    materializationMode: 'linked_result_only',
    target: { symbolOrStructure: 'exact p.12 形 examples', kind: 'source_shape_label' },
    sourceTerm: '形全 · 形缺',
    directMeaningRange: {
      kind: 'source_exact_example_label',
      supportedClaims: ['p.12 labels the four retained examples as 形全 or 形缺'],
      scope: 'exact named examples only; no generalized shape classifier or personal meaning',
    },
    applicability: ['the supplied day-master/month pair matches one of the exact p.12 examples'],
    exceptions: ['do not extend the four examples to other stems or months'],
    sourceObservation: 'p.12 gives exact 甲/丙 形全 and 戊/庚 形缺 examples in named seasonal windows.',
  }),
  sourceSemanticLexiconEntry({
    entryId: 'lexicon.ditian-fang-ju-labels.v0',
    work: WORKS.ditian,
    lineage: 'ditian_local_export',
    sourceIds: ['saju-source-ditian-sui'],
    locatorIds: ['ditian-p13-fang-ju-examples'],
    status: 'adopted_semantic_entry',
    linkedStructuralRuleIds: ['rule.ditian.fang-ju-example-inventory.v0'],
    requiredStructuralResult: {
      ruleIds: ['rule.ditian.fang-ju-example-inventory.v0'],
      fields: ['matchedExamples'],
      closure: 'closed_in_existing_contract',
    },
    materializationMode: 'linked_result_only',
    target: { symbolOrStructure: 'exact branch-set 方/局 examples', kind: 'source_relation_label' },
    sourceTerm: '方 · 局 · 東方 · 木局',
    directMeaningRange: {
      kind: 'source_exact_relation_label',
      supportedClaims: ['p.13 labels 寅卯辰 as 東方 and 亥卯未 as 木局 in the retained examples'],
      scope: 'exact branch sets and source labels only; no strength, preference, or outcome',
    },
    applicability: ['the supplied branches match one of the exact p.13 sets'],
    exceptions: ['方/局 mixture and subsequent 格局/outcome language remain outside the entry'],
    sourceObservation: 'p.13 directly distinguishes 方 and 局 with the two retained branch-set examples.',
  }),
  sourceSemanticLexiconEntry({
    entryId: 'lexicon.ditian-progress-shunbei.v0',
    work: WORKS.ditian,
    lineage: 'ditian_local_export',
    sourceIds: ['saju-source-ditian-sui'],
    locatorIds: ['ditian-p3-progress-retreat-shunbei'],
    status: 'context_bound_entry',
    target: { symbolOrStructure: '氣行 and 配合 conditions', kind: 'source_state_action_vocabulary' },
    sourceTerm: '進 · 退 · 順 · 悖',
    directMeaningRange: {
      kind: 'source_state_action_vocabulary',
      supportedClaims: ['p.3 places 進退 and 順悖 in the source discussion of 氣行 and 配合'],
      scope: 'source vocabulary only; adjacent 吉凶 wording is not materialized',
    },
    applicability: ['source氣/勢 and 配合 conditions would need to be bound'],
    exceptions: ['do not infer a generic progress/retreat classifier or fortune result'],
    sourceObservation: 'p.3 directly uses the terms beside the source sentence 順則吉/悖則凶, so the non-outcome entry remains context-bound.',
    compositionState: 'unresolved_composition_frontier',
  }),
  sourceSemanticLexiconEntry({
    entryId: 'lexicon.ditian-geju-exposure.v0',
    work: WORKS.ditian,
    lineage: 'ditian_local_export',
    sourceIds: ['saju-source-ditian-sui'],
    locatorIds: ['ditian-p13-p14-geju-surface'],
    status: 'context_bound_entry',
    target: { symbolOrStructure: '月支之神透於天干', kind: 'source_pattern_vocabulary' },
    sourceTerm: '格局 · 月支之神 · 透於天干',
    directMeaningRange: {
      kind: 'source_pattern_vocabulary',
      supportedClaims: ['p.13–p.14 use the displayed pattern/exposure terms in local selection and outcome passages'],
      scope: 'terminology only; no pattern conclusion or global exposure rule',
    },
    applicability: ['source-local pattern context and any stated selection condition must be closed'],
    exceptions: ['do not derive a generalized 格局 or personal result'],
    sourceObservation: 'the locator directly combines 格局, 月支之神, and 透於天干 with context-bound outcome prose.',
    compositionState: 'unresolved_composition_frontier',
  }),
  sourceSemanticLexiconEntry({
    entryId: 'lexicon.ditian-tiyong.v0',
    work: WORKS.ditian,
    lineage: 'ditian_local_export',
    sourceIds: ['saju-source-ditian-sui'],
    locatorIds: ['ditian-p18-p20-tiyong'],
    status: 'unresolved',
    target: { symbolOrStructure: '體用 configurations', kind: 'source_composition_vocabulary' },
    sourceTerm: '體 · 用 · 體用之用 · 用神之用',
    directMeaningRange: {
      kind: 'source_composition_vocabulary',
      supportedClaims: ['p.18–p.20 distinguishes 體用之用 from 用神之用 and gives multiple configurations'],
      scope: 'term distinction only; no single body/use priority or conclusion',
    },
    applicability: ['configuration axis, priority, and transition conditions must be source-complete'],
    exceptions: ['do not choose one configuration or equate the two uses'],
    sourceObservation: 'p.18–p.20 explicitly presents multiple 體用 configurations and warns against one-endpoint reasoning.',
    compositionState: 'unresolved_composition_frontier',
  }),
  sourceSemanticLexiconEntry({
    entryId: 'lexicon.ditian-yuanliu-qingzhuo.v0',
    work: WORKS.ditian,
    lineage: 'ditian_local_export',
    sourceIds: ['saju-source-ditian-sui'],
    locatorIds: ['ditian-p24-p27-yuanliu-qingzhuo'],
    status: 'unresolved',
    target: { symbolOrStructure: '源流/清濁 surface', kind: 'source_state_vocabulary' },
    sourceTerm: '源流 · 清 · 濁',
    directMeaningRange: {
      kind: 'source_state_vocabulary',
      supportedClaims: ['p.24–p.27 use 源流 and 清濁 vocabulary in later structural/outcome passages'],
      scope: 'term inventory only; no flow/clarity classifier',
    },
    applicability: ['source flow/clarity conditions and exceptions must be closed'],
    exceptions: ['do not generalize later verses or case language'],
    sourceObservation: 'the locator contains mixed structural and outcome prose without a reusable source-complete predicate.',
    compositionState: 'unresolved_composition_frontier',
  }),

  sourceSemanticLexiconEntry({
    entryId: 'lexicon.qiongtong-element-numbers.v0',
    work: WORKS.qiongtong,
    lineage: 'qiongtong_local_export',
    sourceIds: ['saju-source-qiongtong-baojian'],
    locatorIds: ['qiongtong-p2-five-phase-number-and-season'],
    status: 'adopted_semantic_entry',
    linkedStructuralRuleIds: ['rule.qiongtong.five-phase-number-inventory.v0'],
    requiredStructuralResult: {
      ruleIds: ['rule.qiongtong.five-phase-number-inventory.v0'],
      fields: ['sourceElementNumbers'],
      closure: 'closed_in_existing_contract',
    },
    materializationMode: 'linked_result_only',
    target: { symbolOrStructure: '五行 source numbers', kind: 'source_numeric_vocabulary' },
    sourceTerm: '水一 · 火二 · 木三 · 金四 · 土五',
    directMeaningRange: {
      kind: 'source_numeric_mapping',
      supportedClaims: ['p.2 directly assigns the displayed numbers to the five elements'],
      scope: 'number mapping only; no 生旺/死絕 arithmetic',
    },
    applicability: ['the frozen five-element key envelope is present'],
    exceptions: ['生旺加倍/死絕減半 remains a separate unresolved prerequisite'],
    sourceObservation: 'p.2 directly lists the five element numbers and separately states the conditional double/half operation.',
  }),
  sourceSemanticLexiconEntry({
    entryId: 'lexicon.qiongtong-shengwang-jue-operation.v0',
    work: WORKS.qiongtong,
    lineage: 'qiongtong_local_export',
    sourceIds: ['saju-source-qiongtong-baojian'],
    locatorIds: ['qiongtong-p2-five-phase-number-and-season'],
    status: 'unresolved',
    target: { symbolOrStructure: 'element state operation', kind: 'source_state_action_vocabulary' },
    sourceTerm: '生旺加倍 · 死絕減半',
    directMeaningRange: {
      kind: 'source_conditional_operation',
      supportedClaims: ['p.2 states that 生旺 doubles and 死絕 halves the displayed number'],
      scope: 'operation wording only; state input and resolver remain unresolved',
    },
    applicability: ['source-specific 生旺/死絕 state input, resolver, and priority must be closed'],
    exceptions: ['do not substitute generic 十二運星, Base distribution, or another lineage state'],
    sourceObservation: 'p.2 directly states the operation but does not close how the state is selected for a supplied chart.',
    compositionState: 'unresolved_composition_frontier',
  }),
  sourceSemanticLexiconEntry({
    entryId: 'lexicon.qiongtong-ten-stem-section.v0',
    work: WORKS.qiongtong,
    lineage: 'qiongtong_local_export',
    sourceIds: ['saju-source-qiongtong-baojian'],
    locatorIds: ['qiongtong-p3-jia-section', 'qiongtong-p13-yi-section', 'qiongtong-p21-bing-section', 'qiongtong-p32-ding-section', 'qiongtong-p40-wu-section', 'qiongtong-p49-ji-section', 'qiongtong-p55-geng-section', 'qiongtong-p64-xin-section', 'qiongtong-p75-ren-section', 'qiongtong-p83-gui-section'],
    status: 'context_bound_entry',
    linkedStructuralRuleIds: ['rule.qiongtong.day-stem-section-frame.v0'],
    requiredStructuralResult: {
      ruleIds: ['rule.qiongtong.day-stem-section-frame.v0'],
      fields: ['dayMasterStem', 'sourceSection'],
      closure: 'section_frame_closed_month_clause_not_closed',
    },
    materializationMode: 'linked_result_only',
    target: { symbolOrStructure: 'ten day-stem sections', kind: 'source_section_vocabulary' },
    sourceTerm: '論甲木 · 論乙木 · 論丙火 · 論丁火 · 論戊土 · 論己土 · 論庚金 · 論辛金 · 論壬水 · 論癸水',
    directMeaningRange: {
      kind: 'source_section_vocabulary',
      supportedClaims: ['p.3–p.90 organize the work into ten day-stem sections'],
      scope: 'section identity only; no month prescription or personal meaning',
    },
    applicability: ['the day-stem section frame is materialized'],
    exceptions: ['a section heading does not select a month clause'],
    sourceObservation: 'the ten section locators directly show the work organization; the existing structural rule stops before prescription selection.',
  }),
  sourceSemanticLexiconEntry({
    entryId: 'lexicon.qiongtong.jia-month-clauses.v0',
    work: WORKS.qiongtong,
    lineage: 'qiongtong_local_export',
    sourceIds: ['saju-source-qiongtong-baojian'],
    locatorIds: ['qiongtong-p3-jia-section', 'qiongtong-p4-spring-jia-wood', 'qiongtong-p5-spring-jia-wood-continuation', 'qiongtong-p7-summer-jia-wood'],
    status: 'context_bound_entry',
    target: { symbolOrStructure: '甲木 month clauses', kind: 'source_prescription_vocabulary' },
    sourceTerm: '三春甲木 · 正月甲木 · 正二月甲木 · 三夏甲木',
    directMeaningRange: {
      kind: 'source_month_condition_surface',
      supportedClaims: ['p.4–p.7 attach separate month/season clauses to 甲木'],
      scope: 'source-local clause surface only; no universal prescription or personal meaning',
    },
    applicability: ['甲 day stem, exact month/season, mandatory conditions, and clause boundary must be bound'],
    exceptions: ['do not collapse spring/summer clauses or transfer them to another stem'],
    sourceObservation: 'the 甲 section visibly separates seasonal and month-specific condition prose.',
    compositionState: 'unresolved_composition_frontier',
  }),
  sourceSemanticLexiconEntry({
    entryId: 'lexicon.qiongtong.yi-month-clauses.v0',
    work: WORKS.qiongtong,
    lineage: 'qiongtong_local_export',
    sourceIds: ['saju-source-qiongtong-baojian'],
    locatorIds: ['qiongtong-p13-yi-section'],
    status: 'context_bound_entry',
    target: { symbolOrStructure: '乙木 month clauses', kind: 'source_prescription_vocabulary' },
    sourceTerm: '論乙木 · 三春乙木',
    directMeaningRange: { kind: 'source_month_condition_surface', supportedClaims: ['p.13–p.20 open a separate 乙木 seasonal/month surface'], scope: 'source-local clause surface only' },
    applicability: ['乙 day stem, exact month/season, conditions, and clause boundary must be bound'],
    exceptions: ['do not import 甲 clauses or modern seasonal rules'],
    sourceObservation: 'p.13–p.20 directly open the separate 乙木 section.',
    compositionState: 'unresolved_composition_frontier',
  }),
  sourceSemanticLexiconEntry({
    entryId: 'lexicon.qiongtong.bing-month-clauses.v0',
    work: WORKS.qiongtong,
    lineage: 'qiongtong_local_export',
    sourceIds: ['saju-source-qiongtong-baojian'],
    locatorIds: ['qiongtong-p21-bing-section'],
    status: 'context_bound_entry',
    target: { symbolOrStructure: '丙火 month clauses', kind: 'source_prescription_vocabulary' },
    sourceTerm: '論丙火 · 三春丙火',
    directMeaningRange: { kind: 'source_month_condition_surface', supportedClaims: ['p.21–p.31 provide a separate 丙火 seasonal/month surface'], scope: 'source-local clause surface only' },
    applicability: ['丙 day stem, exact month/season, conditions, and clause boundary must be bound'],
    exceptions: ['do not generalize fire prescriptions'],
    sourceObservation: 'p.21–p.31 directly provide the separate 丙火 section.',
    compositionState: 'unresolved_composition_frontier',
  }),
  sourceSemanticLexiconEntry({
    entryId: 'lexicon.qiongtong.ding-month-clauses.v0',
    work: WORKS.qiongtong,
    lineage: 'qiongtong_local_export',
    sourceIds: ['saju-source-qiongtong-baojian'],
    locatorIds: ['qiongtong-p32-ding-section'],
    status: 'context_bound_entry',
    target: { symbolOrStructure: '丁火 month clauses', kind: 'source_prescription_vocabulary' },
    sourceTerm: '論丁火 · 三春丁火',
    directMeaningRange: { kind: 'source_month_condition_surface', supportedClaims: ['p.32–p.39 provide a separate 丁火 seasonal/month surface'], scope: 'source-local clause surface only' },
    applicability: ['丁 day stem, exact month/season, conditions, and clause boundary must be bound'],
    exceptions: ['do not transfer 丙 or modern fire rules'],
    sourceObservation: 'p.32–p.39 directly provide the separate 丁火 section.',
    compositionState: 'unresolved_composition_frontier',
  }),
  sourceSemanticLexiconEntry({
    entryId: 'lexicon.qiongtong.wu-month-clauses.v0',
    work: WORKS.qiongtong,
    lineage: 'qiongtong_local_export',
    sourceIds: ['saju-source-qiongtong-baojian'],
    locatorIds: ['qiongtong-p40-wu-section'],
    status: 'context_bound_entry',
    target: { symbolOrStructure: '戊土 month clauses', kind: 'source_prescription_vocabulary' },
    sourceTerm: '論戊土 · 三春戊土',
    directMeaningRange: { kind: 'source_month_condition_surface', supportedClaims: ['p.40–p.48 provide a separate 戊土 seasonal/month surface'], scope: 'source-local clause surface only' },
    applicability: ['戊 day stem, exact month/season, conditions, and clause boundary must be bound'],
    exceptions: ['do not translate earth clauses into strength or balance'],
    sourceObservation: 'p.40–p.48 directly provide the separate 戊土 section.',
    compositionState: 'unresolved_composition_frontier',
  }),
  sourceSemanticLexiconEntry({
    entryId: 'lexicon.qiongtong.ji-month-clauses.v0',
    work: WORKS.qiongtong,
    lineage: 'qiongtong_local_export',
    sourceIds: ['saju-source-qiongtong-baojian'],
    locatorIds: ['qiongtong-p49-ji-section'],
    status: 'context_bound_entry',
    target: { symbolOrStructure: '己土 month clauses', kind: 'source_prescription_vocabulary' },
    sourceTerm: '論己土 · 三春己土',
    directMeaningRange: { kind: 'source_month_condition_surface', supportedClaims: ['p.49–p.54 provide a separate 己土 seasonal/month surface'], scope: 'source-local clause surface only' },
    applicability: ['己 day stem, exact month/season, conditions, and clause boundary must be bound'],
    exceptions: ['do not transfer 戊 or modern earth rules'],
    sourceObservation: 'p.49–p.54 directly provide the separate 己土 section.',
    compositionState: 'unresolved_composition_frontier',
  }),
  sourceSemanticLexiconEntry({
    entryId: 'lexicon.qiongtong-geng-month-clauses.v0',
    work: WORKS.qiongtong,
    lineage: 'qiongtong_local_export',
    sourceIds: ['saju-source-qiongtong-baojian'],
    locatorIds: ['qiongtong-p55-geng-section'],
    status: 'context_bound_entry',
    target: { symbolOrStructure: '庚金 month clauses', kind: 'source_prescription_vocabulary' },
    sourceTerm: '論庚金 · 三春庚金',
    directMeaningRange: { kind: 'source_month_condition_surface', supportedClaims: ['p.55–p.64 provide a separate 庚金 seasonal/month surface'], scope: 'source-local clause surface only' },
    applicability: ['庚 day stem, exact month/season, conditions, and clause boundary must be bound'],
    exceptions: ['do not infer metal strength or use selection'],
    sourceObservation: 'p.55–p.64 directly provide the separate 庚金 section.',
    compositionState: 'unresolved_composition_frontier',
  }),
  sourceSemanticLexiconEntry({
    entryId: 'lexicon.qiongtong-xin-month-clauses.v0',
    work: WORKS.qiongtong,
    lineage: 'qiongtong_local_export',
    sourceIds: ['saju-source-qiongtong-baojian'],
    locatorIds: ['qiongtong-p64-xin-section'],
    status: 'context_bound_entry',
    target: { symbolOrStructure: '辛金 month clauses', kind: 'source_prescription_vocabulary' },
    sourceTerm: '論辛金 · 三春辛金',
    directMeaningRange: { kind: 'source_month_condition_surface', supportedClaims: ['p.64–p.73 provide a separate 辛金 seasonal/month surface'], scope: 'source-local clause surface only' },
    applicability: ['辛 day stem, exact month/season, conditions, and clause boundary must be bound'],
    exceptions: ['do not use 庚 or modern metal prescriptions'],
    sourceObservation: 'p.64–p.73 directly provide the separate 辛金 section.',
    compositionState: 'unresolved_composition_frontier',
  }),
  sourceSemanticLexiconEntry({
    entryId: 'lexicon.qiongtong-ren-month-clauses.v0',
    work: WORKS.qiongtong,
    lineage: 'qiongtong_local_export',
    sourceIds: ['saju-source-qiongtong-baojian'],
    locatorIds: ['qiongtong-p75-ren-section'],
    status: 'context_bound_entry',
    target: { symbolOrStructure: '壬水 month clauses', kind: 'source_prescription_vocabulary' },
    sourceTerm: '論壬水 · 三春壬水',
    directMeaningRange: { kind: 'source_month_condition_surface', supportedClaims: ['p.75–p.82 provide a separate 壬水 seasonal/month surface'], scope: 'source-local clause surface only' },
    applicability: ['壬 day stem, exact month/season, conditions, and clause boundary must be bound'],
    exceptions: ['do not infer water strength or personal meaning'],
    sourceObservation: 'p.75–p.82 directly provide the separate 壬水 section.',
    compositionState: 'unresolved_composition_frontier',
  }),
  sourceSemanticLexiconEntry({
    entryId: 'lexicon.qiongtong-gui-month-clauses.v0',
    work: WORKS.qiongtong,
    lineage: 'qiongtong_local_export',
    sourceIds: ['saju-source-qiongtong-baojian'],
    locatorIds: ['qiongtong-p83-gui-section'],
    status: 'context_bound_entry',
    target: { symbolOrStructure: '癸水 month clauses', kind: 'source_prescription_vocabulary' },
    sourceTerm: '論癸水 · 三春癸水',
    directMeaningRange: { kind: 'source_month_condition_surface', supportedClaims: ['p.83–p.90 provide a separate 癸水 seasonal/month surface'], scope: 'source-local clause surface only' },
    applicability: ['癸 day stem, exact month/season, conditions, and clause boundary must be bound'],
    exceptions: ['do not use 壬 or modern water prescriptions'],
    sourceObservation: 'p.83–p.90 directly provide the separate 癸水 section.',
    compositionState: 'unresolved_composition_frontier',
  }),
  sourceSemanticLexiconEntry({
    entryId: 'lexicon.qiongtong-five-phase-nature.v0',
    work: WORKS.qiongtong,
    lineage: 'qiongtong_local_export',
    sourceIds: ['saju-source-qiongtong-baojian'],
    locatorIds: ['qiongtong-p2-five-phase-number-and-season'],
    status: 'unsupported',
    target: { symbolOrStructure: '五行之性', kind: 'personal_semantic_surface' },
    sourceTerm: '水智 · 火禮 · 木仁 · 金義 · 土信',
    directMeaningRange: {
      kind: 'out_of_public_scope',
      supportedClaims: ['p.2 directly gives five-phase nature/virtue wording'],
      scope: 'not translated into personality or personal meaning',
    },
    applicability: ['personal trait interpretation would be required'],
    exceptions: ['never map a single element to a user trait'],
    sourceObservation: 'p.2 contains a direct 五行之性 passage, but the requested lexicon excludes personality translation.',
  }),
])

export const SAJU_SOURCE_LOCAL_SEMANTIC_COMPOSITION_SCHEMA = 'saju-source-local-semantic-composition-v0'
export const SAJU_SOURCE_LOCAL_SEMANTIC_COMPOSITION_VERSION = '0.1.0'
export const SAJU_SOURCE_LOCAL_SEMANTIC_COMPOSITION_STATUSES = Object.freeze([
  'adopted_composition',
  'bounded_role_use_transition',
  'unresolved',
  'unsupported',
])

export const SAJU_SOURCE_LOCAL_SEMANTIC_COMPOSITION_EXECUTION_STATUSES = Object.freeze([
  'executable_from_frozen_base',
  'blocked_missing_base_fact',
  'not_applicable_fixture',
  'ambiguous_composition',
  'not_executable_by_contract',
  'unsupported',
])

const sourceLocalSemanticCompositionRule = value => {
  const sourceIds = [...(value.sourceIds || [])]
  const locatorIds = [...(value.locatorIds || [])]
  return {
    schema: SAJU_SOURCE_LOCAL_SEMANTIC_COMPOSITION_SCHEMA,
    version: SAJU_SOURCE_LOCAL_SEMANTIC_COMPOSITION_VERSION,
    compositionId: null,
    status: 'unresolved',
    work: '',
    lineage: '',
    claimPromotion: false,
    semanticAuthority: 'not_established',
    readinessImpact: 'none',
    activationImpact: 'none',
    sourceIds,
    locatorIds,
    requiredStructuralResults: {
      ruleIds: [],
      fields: [],
      closure: 'not_closed',
    },
    requiredSemanticResults: {
      ruleIds: [],
      fields: [],
      closure: 'not_closed',
    },
    requiredSemanticLexiconEntries: {
      entryIds: [],
      fields: [],
      closure: 'not_required',
    },
    applicability: [],
    procedure: [],
    composition: {
      conditions: [],
      priority: 'not_closed',
      combination: 'not_closed',
      transition: 'not_closed',
    },
    output: {
      origin: 'lineage_derived_source_local_semantic_composition_result',
      resultKey: '',
      fields: [],
      semanticExpansion: false,
      personalMeaning: false,
    },
    conflictState: {
      status: 'preserve_and_fail_closed',
      winnerSelected: false,
      failClosed: true,
    },
    stopConditions: [],
    forbiddenExtensions: [...FORBIDDEN_EXTENSIONS],
    provenance: {
      schema: SAJU_SOURCE_LOCAL_SEMANTIC_COMPOSITION_SCHEMA,
      version: SAJU_SOURCE_LOCAL_SEMANTIC_COMPOSITION_VERSION,
      sourceIds,
      locatorIds,
      sourceByteSha256: sourceByteSha256ForIds(sourceIds),
    },
    noRecalculation: true,
    noPersonalMeaning: true,
    noCrossLineageMerge: true,
    interpretationHypothesis: false,
    ...value,
    sourceIds,
    locatorIds,
    provenance: value.provenance || {
      schema: SAJU_SOURCE_LOCAL_SEMANTIC_COMPOSITION_SCHEMA,
      version: SAJU_SOURCE_LOCAL_SEMANTIC_COMPOSITION_VERSION,
      sourceIds,
      locatorIds,
      sourceByteSha256: sourceByteSha256ForIds(sourceIds),
    },
  }
}

/**
 * A source-local composition catalog.  An adopted entry means only that the
 * named source closes this exact combination window.  It does not create a
 * cross-lineage grammar, a global priority resolver, or a person-level
 * interpretation hypothesis.
 */
export const SAJU_SOURCE_LOCAL_SEMANTIC_COMPOSITION_RULES = Object.freeze([
  sourceLocalSemanticCompositionRule({
    compositionId: 'composition.ziping.p10-chen-use-components.v0',
    status: 'adopted_composition',
    work: WORKS.ziping,
    lineage: 'ziping_local_export',
    sourceIds: ['saju-source-ziping-zhenquan'],
    locatorIds: ['ziping-p10-chen-exposed-stem-definition'],
    requiredStructuralResults: {
      ruleIds: ['rule.ziping.chen-exposure-inventory.v0', 'rule.ziping.branch-relation-inventory.v0'],
      fields: ['sourceCondition', 'namedExposureMatches', 'relations'],
      closure: 'closed_exact_甲生辰月_component_composition',
    },
    requiredSemanticResults: {
      ruleIds: ['rule.ziping.chen-exposure-use-role.v0'],
      fields: ['matchedSourceRoleLabels', 'multiplicityPolicy'],
      closure: 'conditional_named_exposure_components_only',
      requirement: 'required_when_named_exposure_is_present',
    },
    requiredSemanticLexiconEntries: {
      entryIds: ['lexicon.ziping.p10-role-labels.v0'],
      fields: ['sourceTerm', 'linkedResults'],
      closure: 'conditional_named_exposure_components_only',
      requirement: 'required_when_named_exposure_is_present',
    },
    applicability: [
      'the p.10 structural result binds day-master 甲 and month branch 辰',
      'the supplied branch-relation inventory is present; an empty relation array is a valid no-meeting inventory',
      'a meeting component requires one exact source-listed 申子辰 relation record including the 辰 month position',
    ],
    procedure: [
      'consume the p.10 named-exposure structural and source-role results without recalculating stems',
      'retain one named exposure as one source use component and retain every named exposure when multiple are present',
      'recognize only a complete supplied 申子辰 會局/三合 record as the p.10 branch-meeting component',
      'when exposure and meeting are both present, emit both component sets because the source states 透與會並用',
      'do not select a winner or continue into 有情/無情, 格局, outcome, or personal meaning',
    ],
    composition: {
      conditions: [
        '一透則一用: one named visible exposure yields one source use component',
        '兼透則兼用: multiple named visible exposures yield multiple source use components',
        '逢申與子會局: with 辰月, a complete 申子辰 meeting yields the source 水印 component',
        '透而又會則透與會並用: exposure and meeting components coexist',
      ],
      priority: 'none; p.10 closes coexistence, not ranking or winner selection',
      combination: 'retain all qualifying exposure and meeting components in source order',
      transition: 'not defined by p.10; no dynamic change is emitted',
    },
    output: {
      origin: 'lineage_derived_source_local_semantic_composition_result',
      resultKey: 'ziping.chenUseComponents',
      fields: ['sourceCondition', 'compositionMode', 'exposureComponents', 'branchMeetingComponents', 'sourceCombinationStatement', 'winnerSelected'],
      semanticExpansion: false,
      personalMeaning: false,
    },
    conflictState: {
      status: 'preserve_and_fail_closed',
      policy: 'preserve simultaneous same-source components; ambiguous duplicate meeting records or any source/lineage mismatch produce no result',
      winnerSelected: false,
      failClosed: true,
    },
    stopConditions: [
      'stop when either required structural result is missing, malformed, source-mismatched, or in preserved conflict',
      'stop when a named exposure is present but its p.10 semantic role result or lexicon link is missing or source-mismatched',
      'stop when more than one qualifying 申子辰 meeting record is supplied because duplicate-meeting precedence is not closed',
      'stop before interpreting 有情/無情, 吉凶, 格局, strength, fortune, personality, prediction, or personal meaning',
    ],
  }),
  sourceLocalSemanticCompositionRule({
    compositionId: 'transition.ziping.p7-yin-month-use-change.v0',
    status: 'bounded_role_use_transition',
    work: WORKS.ziping,
    lineage: 'ziping_local_export',
    sourceIds: ['saju-source-ziping-zhenquan'],
    locatorIds: ['page.local.ziping.p7-yongshin-continuation'],
    requiredStructuralResults: {
      ruleIds: ['rule.ziping.yin-month-exposure-contrast.v0'],
      fields: ['sourceCondition', 'absentVisibleStem', 'exposedVisibleStem', 'exposedPositions'],
      closure: 'closed_exact_寅月_contrast',
    },
    requiredSemanticResults: {
      ruleIds: ['rule.ziping.yin-month-exposure-change.v0'],
      fields: ['sourceCondition', 'sourceSelectionStatement'],
      closure: 'closed_exact_source_clause_only',
    },
    requiredSemanticLexiconEntries: {
      entryIds: ['lexicon.ziping.p7-selection-clause.v0'],
      fields: ['sourceTerm', 'linkedResults'],
      closure: 'closed_exact_source_clause_only',
    },
    applicability: [
      'the exact p.7 寅月 contrast is materialized: no supplied visible 甲 and exactly one supplied visible 丙',
      'the existing p.7 source semantic result and linked lexicon entry are both materialized',
    ],
    procedure: [
      'consume the exact p.7 structural contrast result',
      'retain the source clause 同知得以作主 as the bounded selection/use change statement',
      'keep the clause separate from p.10 components and do not infer a global 用神 priority or transition grammar',
    ],
    composition: {
      conditions: ['不透甲而透丙 under 寅月 is the sole executable condition'],
      priority: 'not closed outside this exact local contrast',
      combination: 'not a multi-result combination; retain the single source clause as a bounded transition',
      transition: 'source clause only: 同知得以作主',
    },
    output: {
      origin: 'lineage_derived_source_local_semantic_composition_result',
      resultKey: 'ziping.yinMonthUseTransition',
      fields: ['sourceCondition', 'exposedPositions', 'sourceSelectionStatement', 'winnerSelected'],
      semanticExpansion: false,
      personalMeaning: false,
    },
    conflictState: {
      status: 'preserve_and_fail_closed',
      policy: 'preserve the exact clause and stop on missing, duplicate, or cross-lineage input',
      winnerSelected: false,
      failClosed: true,
    },
    stopConditions: [
      'stop when the p.7 structural or semantic prerequisite is missing, duplicated, malformed, or conflicted',
      'stop before extending the clause to another month, another exposed stem, a global 用神 priority, or a personal result',
    ],
  }),
  sourceLocalSemanticCompositionRule({
    compositionId: 'composition.ziping.p11-exposure-branch-sentiment.v0',
    status: 'unresolved',
    work: WORKS.ziping,
    lineage: 'ziping_local_export',
    sourceIds: ['saju-source-ziping-zhenquan'],
    locatorIds: ['ziping-p11-exposed-stem-and-branch-context'],
    requiredStructuralResults: {
      ruleIds: ['rule.ziping.chen-exposure-inventory.v0', 'rule.ziping.branch-relation-inventory.v0'],
      fields: ['namedExposureMatches', 'relations'],
      closure: 'relation_binding_and_transition_not_closed',
    },
    requiredSemanticResults: {
      ruleIds: ['rule.ziping.chen-exposure-use-role.v0', 'rule.ziping.exposure-branch-sentiment.v0'],
      fields: ['sourceRoleLabelInventory', '有情/無情 transition state'],
      closure: 'source_context_and_transition_not_closed',
    },
    applicability: ['p.11 combines 透干, 會支, multiple exposure, 格局 context, and 有情/無情 wording'],
    procedure: ['preserve the p.11 interaction surface as an unresolved composition frontier'],
    composition: {
      conditions: ['有情 = 順而相成 and 無情 = 逆而相背 are source definitions, not a closed static classifier'],
      priority: 'not closed',
      combination: 'not closed across exposure, meeting, and pattern context',
      transition: '有情而卒成無情 and 無情而終有情 remain unresolved transitions',
    },
    output: {
      origin: 'lineage_derived_source_local_semantic_composition_result',
      resultKey: 'ziping.exposureBranchSentimentComposition',
      fields: [],
      semanticExpansion: false,
      personalMeaning: false,
    },
    stopConditions: ['do not emit a winner, valence, 格局, 吉凶, or personal result while source context and transition conditions remain open'],
  }),
  sourceLocalSemanticCompositionRule({
    compositionId: 'composition.ziping.p8-p12-use-pattern-composition.v0',
    status: 'unresolved',
    work: WORKS.ziping,
    lineage: 'ziping_local_export',
    sourceIds: ['saju-source-ziping-zhenquan'],
    locatorIds: ['ziping-p8-yongshen-pure-mixed', 'ziping-p8-yongshen-pattern-level', 'ziping-p9-yongshen-success-failure-transition', 'ziping-p12-good-symbol-break-pattern', 'ziping-p12-bad-symbol-make-pattern', 'ziping-p12-generation-control-order'],
    requiredStructuralResults: {
      ruleIds: [],
      fields: ['source use roles', 'relation order', 'case conditions'],
      closure: 'use_selection_and_pattern_context_not_closed',
    },
    requiredSemanticResults: {
      ruleIds: ['rule.ziping.exposure-branch-sentiment.v0'],
      fields: ['pure/mixed', 'success/failure transition', 'good/bad pattern'],
      closure: 'semantic_synthesis_not_closed',
    },
    applicability: ['p.8–p.12 describe pure/mixed, 有情/有力, success/failure, and pattern cases'],
    procedure: ['retain each case inventory independently; do not compose across pages without a source-defined priority or transition procedure'],
    composition: {
      conditions: ['multiple source use/pattern cases are visible'],
      priority: 'not closed',
      combination: 'coexistence only',
      transition: 'not closed',
    },
    output: {
      origin: 'lineage_derived_source_local_semantic_composition_result',
      resultKey: 'ziping.usePatternComposition',
      fields: [],
      semanticExpansion: false,
      personalMeaning: false,
    },
    stopConditions: ['do not emit pure/mixed, pattern, 吉凶, or personal meaning as an executable composition result'],
  }),
  sourceLocalSemanticCompositionRule({
    compositionId: 'composition.yuanhai.p197-role-prohibition.v0',
    status: 'unresolved',
    work: WORKS.yuanhai,
    lineage: 'yuanhai_local_export',
    sourceIds: ['saju-source-yuanhai-ziping'],
    locatorIds: ['yuanhai-p197-eight-character-summary'],
    requiredStructuralResults: {
      ruleIds: ['rule.yuanhai.day-anchor-month-command-frame.v0'],
      fields: ['source role frame', 'role condition'],
      closure: 'role_condition_and_precedence_not_closed',
    },
    requiredSemanticResults: {
      ruleIds: [],
      fields: ['role prohibition'],
      closure: 'not_materialized',
    },
    applicability: ['p.197 places role prohibitions inside a compiled summary of role/pattern conditions'],
    procedure: ['retain the summary clause as source-local inventory only'],
    composition: {
      conditions: ['a selected source role and its opposing relation would both be required'],
      priority: 'not closed',
      combination: 'not closed',
      transition: 'not closed',
    },
    output: {
      origin: 'lineage_derived_source_local_semantic_composition_result',
      resultKey: 'yuanhai.roleProhibitionComposition',
      fields: [],
      semanticExpansion: false,
      personalMeaning: false,
    },
    stopConditions: ['do not infer role selection, outcome, or personal meaning from the summary phrase'],
  }),
  sourceLocalSemanticCompositionRule({
    compositionId: 'composition.sanming.stem-branch-transformation.v0',
    status: 'unresolved',
    work: WORKS.sanming,
    lineage: 'sanming_local_export',
    sourceIds: ['saju-source-sanming-tonghui'],
    locatorIds: ['sanming-p78-stem-combination', 'sanming-p80-stem-transformation-general', 'sanming-p81-stem-transformation', 'sanming-p85-branch-combinations', 'sanming-p90-three-punishments', 'sanming-p93-branch-conflict'],
    requiredStructuralResults: {
      ruleIds: ['rule.sanming.element-generation-control-v0'],
      fields: ['stem relation inventory', 'branch relation inventory'],
      closure: 'transformation_and_relation_precedence_not_closed',
    },
    requiredSemanticResults: {
      ruleIds: [],
      fields: ['化氣', '六合/三合', '沖擊'],
      closure: 'not_materialized',
    },
    applicability: ['p.78–p.93 list stem/branch relations and transformation conditions with adjacent outcome language'],
    procedure: ['keep each relation family and its source condition separate'],
    composition: {
      conditions: ['multiple stem/branch relation families may coexist'],
      priority: 'not closed',
      combination: 'not closed',
      transition: 'not closed',
    },
    output: {
      origin: 'lineage_derived_source_local_semantic_composition_result',
      resultKey: 'sanming.stemBranchTransformationComposition',
      fields: [],
      semanticExpansion: false,
      personalMeaning: false,
    },
    stopConditions: ['do not import Ziping relation precedence or modern transformation tables'],
  }),
  sourceLocalSemanticCompositionRule({
    compositionId: 'composition.ditian.fang-ju-tiyong.v0',
    status: 'unresolved',
    work: WORKS.ditian,
    lineage: 'ditian_local_export',
    sourceIds: ['saju-source-ditian-sui'],
    locatorIds: ['ditian-p13-fang-ju-examples', 'ditian-p13-p14-geju-surface', 'ditian-p18-p20-tiyong'],
    requiredStructuralResults: {
      ruleIds: ['rule.ditian.fang-ju-example-inventory.v0'],
      fields: ['matchedExamples', 'branch set', '干頭 condition'],
      closure: '方局_and_體用_weighting_not_closed',
    },
    requiredSemanticResults: {
      ruleIds: [],
      fields: ['格局', '體用', '用神'],
      closure: 'not_materialized',
    },
    applicability: ['p.13 and p.18–p.20 describe 方/局 coexistence and multiple 體用 configurations'],
    procedure: ['retain exact branch-set examples; do not apply the adjacent 格局 or 體用 weighting prose'],
    composition: {
      conditions: ['方/局 and a body/use configuration would both be present'],
      priority: 'the source does not close a machine-readable most-important weighting rule',
      combination: 'coexistence only',
      transition: 'not closed',
    },
    output: {
      origin: 'lineage_derived_source_local_semantic_composition_result',
      resultKey: 'ditian.fangJuTiyongComposition',
      fields: [],
      semanticExpansion: false,
      personalMeaning: false,
    },
    stopConditions: ['do not output 格局, 體用 selection, 用神 priority, outcome, or personal meaning'],
  }),
  sourceLocalSemanticCompositionRule({
    compositionId: 'composition.qiongtong.state-month-operation.v0',
    status: 'unresolved',
    work: WORKS.qiongtong,
    lineage: 'qiongtong_local_export',
    sourceIds: ['saju-source-qiongtong-baojian'],
    locatorIds: ['qiongtong-p2-five-phase-number-and-season', 'qiongtong-p3-jia-section', 'qiongtong-p13-yi-section', 'qiongtong-p21-bing-section', 'qiongtong-p32-ding-section', 'qiongtong-p40-wu-section', 'qiongtong-p49-ji-section', 'qiongtong-p55-geng-section', 'qiongtong-p64-xin-section', 'qiongtong-p75-ren-section', 'qiongtong-p83-gui-section'],
    requiredStructuralResults: {
      ruleIds: ['rule.qiongtong.five-phase-number-inventory.v0', 'rule.qiongtong.day-stem-section-frame.v0'],
      fields: ['sourceElementNumbers', 'day-stem section', 'state label'],
      closure: 'source_specific_state_resolver_and_cross_section_priority_not_closed',
    },
    requiredSemanticResults: {
      ruleIds: [],
      fields: ['month prescription'],
      closure: 'not_materialized',
    },
    applicability: ['p.2 supplies the double/half operation and later sections supply day-stem/month clauses'],
    procedure: ['retain the numeric operation and each day-stem section independently; do not compose them without the unresolved 生旺/死绝 resolver'],
    composition: {
      conditions: ['element number, source state, day-stem section, and month clause would all be needed'],
      priority: 'cross-section priority not closed',
      combination: 'not closed',
      transition: 'not closed',
    },
    output: {
      origin: 'lineage_derived_source_local_semantic_composition_result',
      resultKey: 'qiongtong.stateMonthOperationComposition',
      fields: [],
      semanticExpansion: false,
      personalMeaning: false,
    },
    stopConditions: ['do not substitute generic 十二運星, another lineage, strength, 用神, or personal meaning'],
  }),
  sourceLocalSemanticCompositionRule({
    compositionId: 'composition.yuanhai.personal-outcome-surface.v0',
    status: 'unsupported',
    work: WORKS.yuanhai,
    lineage: 'yuanhai_local_export',
    sourceIds: ['saju-source-yuanhai-ziping'],
    locatorIds: ['yuanhai-p13-temperament', 'yuanhai-p48-six-relations'],
    applicability: ['a personal, family, or temperament conclusion would be required'],
    procedure: ['do not materialize this composition surface in the bounded grammar'],
    composition: {
      conditions: ['personal semantic mapping'],
      priority: 'unsupported',
      combination: 'unsupported',
      transition: 'unsupported',
    },
    output: {
      origin: 'lineage_derived_source_local_semantic_composition_result',
      resultKey: 'yuanhai.personalOutcomeComposition',
      fields: [],
      semanticExpansion: false,
      personalMeaning: false,
    },
    stopConditions: ['never expose family, temperament, or personal outcome claims'],
  }),
  sourceLocalSemanticCompositionRule({
    compositionId: 'composition.qiongtong.five-phase-nature-personal.v0',
    status: 'unsupported',
    work: WORKS.qiongtong,
    lineage: 'qiongtong_local_export',
    sourceIds: ['saju-source-qiongtong-baojian'],
    locatorIds: ['qiongtong-p2-five-phase-number-and-season'],
    applicability: ['a five-phase nature/virtue phrase would be translated into a personal trait'],
    procedure: ['retain the phrase as out of public semantic scope'],
    composition: {
      conditions: ['single element or phase-to-person mapping'],
      priority: 'unsupported',
      combination: 'unsupported',
      transition: 'unsupported',
    },
    output: {
      origin: 'lineage_derived_source_local_semantic_composition_result',
      resultKey: 'qiongtong.fivePhaseNaturePersonalComposition',
      fields: [],
      semanticExpansion: false,
      personalMeaning: false,
    },
    stopConditions: ['never translate 五行之性 into personality or personal meaning'],
  }),
])

const compositionIdsByStatus = status => SAJU_SOURCE_LOCAL_SEMANTIC_COMPOSITION_RULES
  .filter(ruleItem => ruleItem.status === status)
  .map(ruleItem => ruleItem.compositionId)

export const SAJU_SOURCE_LOCAL_SEMANTIC_COMPOSITION_CLOSABILITY_REVIEW_SCHEMA = 'saju-source-local-semantic-composition-closability-review-v0'
export const SAJU_SOURCE_LOCAL_SEMANTIC_COMPOSITION_CLOSABILITY_REVIEW_VERSION = '0.1.0'
export const SAJU_SOURCE_LOCAL_SEMANTIC_COMPOSITION_CLOSABILITY_STATUSES = Object.freeze([
  'near_candidate',
  'v0_frozen',
])

const sourceLocalSemanticCompositionClosabilityReview = value => {
  const sourceIds = [...(value.sourceIds || [])]
  const locatorIds = [...(value.locatorIds || [])]
  return {
    schema: SAJU_SOURCE_LOCAL_SEMANTIC_COMPOSITION_CLOSABILITY_REVIEW_SCHEMA,
    version: SAJU_SOURCE_LOCAL_SEMANTIC_COMPOSITION_CLOSABILITY_REVIEW_VERSION,
    compositionId: null,
    sourceIds,
    locatorIds,
    closability: 'v0_frozen',
    endToEndClosed: false,
    currentBaseCoverage: [],
    sourceObservation: '',
    explicitPrerequisitesRemaining: [],
    closureGap: '',
    promotionDecision: 'retain_unresolved_v0',
    requiredAdditionalCheck: null,
    provenance: {
      schema: SAJU_SOURCE_LOCAL_SEMANTIC_COMPOSITION_CLOSABILITY_REVIEW_SCHEMA,
      version: SAJU_SOURCE_LOCAL_SEMANTIC_COMPOSITION_CLOSABILITY_REVIEW_VERSION,
      sourceIds,
      locatorIds,
      sourceByteSha256: sourceByteSha256ForIds(sourceIds),
    },
    noPromotion: true,
    noRecalculation: true,
    noPersonalMeaning: true,
    noCrossLineageMerge: true,
    ...value,
    sourceIds,
    locatorIds,
    provenance: value.provenance || {
      schema: SAJU_SOURCE_LOCAL_SEMANTIC_COMPOSITION_CLOSABILITY_REVIEW_SCHEMA,
      version: SAJU_SOURCE_LOCAL_SEMANTIC_COMPOSITION_CLOSABILITY_REVIEW_VERSION,
      sourceIds,
      locatorIds,
      sourceByteSha256: sourceByteSha256ForIds(sourceIds),
    },
  }
}

/**
 * A finite review of the six unresolved composition surfaces.  `near_candidate`
 * means that a small, explicit source-local prerequisite is worth a bounded
 * follow-up; it does not mean the composition is executable.  `v0_frozen`
 * records that the remaining gap is semantic context, priority, transition,
 * or source definition rather than a safe small prerequisite.
 */
export const SAJU_SOURCE_LOCAL_SEMANTIC_COMPOSITION_CLOSABILITY_REVIEW = Object.freeze([
  sourceLocalSemanticCompositionClosabilityReview({
    compositionId: 'composition.ziping.p11-exposure-branch-sentiment.v0',
    sourceIds: ['saju-source-ziping-zhenquan'],
    locatorIds: ['ziping-p11-exposed-stem-and-branch-context'],
    closability: 'v0_frozen',
    currentBaseCoverage: ['p.10 named exposure components', 'supplied branch-relation inventory', 'source role labels'],
    sourceObservation: 'p.11 defines 有情 as 順而相成 and 無情 as 逆而相背, then gives exposure/meeting examples and records both 有情而卒成無情 and 無情而終有情 transitions.',
    explicitPrerequisitesRemaining: [
      'a source-defined mapping from each role/meeting combination to 順而相成 or 逆而相背',
      'a closed condition for both recorded transition forms',
      'source-local priority across exposure, 會支, and 格局 context',
    ],
    closureGap: 'the definitions and examples do not provide a static classifier or transition function that can consume the current structural results without semantic context',
    requiredAdditionalCheck: null,
  }),
  sourceLocalSemanticCompositionClosabilityReview({
    compositionId: 'composition.ziping.p8-p12-use-pattern-composition.v0',
    sourceIds: ['saju-source-ziping-zhenquan'],
    locatorIds: [
      'ziping-p8-yongshen-pure-mixed',
      'ziping-p8-yongshen-pattern-level',
      'ziping-p9-yongshen-success-failure-transition',
      'ziping-p12-good-symbol-break-pattern',
      'ziping-p12-bad-symbol-make-pattern',
      'ziping-p12-generation-control-order',
    ],
    closability: 'v0_frozen',
    currentBaseCoverage: ['source-local role and relation inventories'],
    sourceObservation: 'p.8–p.12 place pure/mixed, success/failure, pattern, and generation/control order cases inside 用神·格局·吉凶 discussions with case-specific conditions.',
    explicitPrerequisitesRemaining: [
      'source-defined use/pattern identity and applicability',
      'source-defined priority and transition across the cases',
      'a non-outcome output boundary independent of semantic synthesis',
    ],
    closureGap: 'the pages supply multiple case surfaces but not one source-complete composition procedure; combining them would require semantic synthesis and outcome interpretation',
    requiredAdditionalCheck: null,
  }),
  sourceLocalSemanticCompositionClosabilityReview({
    compositionId: 'composition.yuanhai.p197-role-prohibition.v0',
    sourceIds: ['saju-source-yuanhai-ziping'],
    locatorIds: ['yuanhai-p197-eight-character-summary'],
    closability: 'near_candidate',
    currentBaseCoverage: ['day-as-host/month-command frame', 'supplied role-label inventory'],
    sourceObservation: 'p.197 gives compact role-conditioned clauses: 用之为官不可伤, 用之为财不可劫, 用之为印不可破, 用之食神不可破, 用之为禄不可冲, plus a 制伏太过 exception.',
    explicitPrerequisitesRemaining: [
      'a Yuanhai-local selected-use role result for 用之为官/财/印/食神/禄',
      'a Yuanhai-local opposing-relation result for 伤/劫/破/冲 and the 制伏太过 exception',
    ],
    closureGap: 'the clauses are source-local and finite but the current Base has no selected-use result or source-complete opposing-relation contract, so no prohibition result can be emitted yet',
    requiredAdditionalCheck: 'close the selected-use plus named-opposing-relation contract in the Yuanhai lineage without emitting outcome or personal meaning',
  }),
  sourceLocalSemanticCompositionClosabilityReview({
    compositionId: 'composition.sanming.stem-branch-transformation.v0',
    sourceIds: ['saju-source-sanming-tonghui'],
    locatorIds: [
      'sanming-p78-stem-combination',
      'sanming-p80-stem-transformation-general',
      'sanming-p81-stem-transformation',
      'sanming-p85-branch-combinations',
      'sanming-p90-three-punishments',
      'sanming-p93-branch-conflict',
    ],
    closability: 'near_candidate',
    currentBaseCoverage: ['visible stem/branch frame', 'supplied relation inventory', 'month branch'],
    sourceObservation: 'p.80–p.81 give pair-specific 化氣 windows and non-化 conditions such as month windows and 妒合, while p.85–p.93 keep separate 六合/三合/刑/沖 surfaces.',
    explicitPrerequisitesRemaining: [
      'a Sanming-local supplied stem-pair relation result with the exact pair and intervening-stem condition',
      'a source-specific 旺氣/得時/得地 state result for the p.80 general condition',
      'a source-local boundary distinguishing eligibility/condition output from 化氣 or outcome meaning',
    ],
    closureGap: 'p.81 is a narrow candidate surface, but current Base does not provide the source-specific state or relation contract; the broader relation families also have no source-defined precedence or transition',
    requiredAdditionalCheck: 'test only the p.80–p.81 exact pair/month/妒合 lane after the two source-specific prerequisites are independently closed; do not merge branch relation families',
  }),
  sourceLocalSemanticCompositionClosabilityReview({
    compositionId: 'composition.ditian.fang-ju-tiyong.v0',
    sourceIds: ['saju-source-ditian-sui'],
    locatorIds: ['ditian-p13-fang-ju-examples', 'ditian-p13-p14-geju-surface', 'ditian-p18-p20-tiyong'],
    closability: 'v0_frozen',
    currentBaseCoverage: ['exact 方/局 branch-set examples', 'branch-category inventory'],
    sourceObservation: 'p.13 distinguishes 方 and 局 and warns against mixing; p.18–p.20 enumerate several 體用 configurations and state that the most important axis must be weighed.',
    explicitPrerequisitesRemaining: [
      'source-defined 體/用 axis selection',
      'source-defined weighting for 最要緊者 and 二三用神',
      'a closed relation between the p.13 方/局 examples and the p.18–p.20 configurations',
    ],
    closureGap: 'the exact branch examples are already structural, but the requested composition begins at source-defined weighting and 用神 selection, which the source does not reduce to a reproducible priority/transition function',
    requiredAdditionalCheck: null,
  }),
  sourceLocalSemanticCompositionClosabilityReview({
    compositionId: 'composition.qiongtong.state-month-operation.v0',
    sourceIds: ['saju-source-qiongtong-baojian'],
    locatorIds: [
      'qiongtong-p2-five-phase-number-and-season',
      'qiongtong-p3-jia-section',
      'qiongtong-p13-yi-section',
      'qiongtong-p21-bing-section',
      'qiongtong-p32-ding-section',
      'qiongtong-p40-wu-section',
      'qiongtong-p49-ji-section',
      'qiongtong-p55-geng-section',
      'qiongtong-p64-xin-section',
      'qiongtong-p75-ren-section',
      'qiongtong-p83-gui-section',
    ],
    closability: 'v0_frozen',
    currentBaseCoverage: ['source element-number inventory', 'day-stem section frame'],
    sourceObservation: 'p.2 closes the wording 生旺加倍·死绝减半, while p.3–p.90 provide ten day-stem sections and month clauses with condition and prescription language.',
    explicitPrerequisitesRemaining: [
      'the unresolved source-specific 生旺/死绝 resolver and input shape',
      'section/month clause selection and cross-section priority',
      'a source-local non-prescription output boundary',
    ],
    closureGap: 'the operation is known but its state is not derivable from the source locator, and the later sections do not provide a single priority/transition procedure',
    requiredAdditionalCheck: null,
  }),
])

const compositionClosabilityIdsBy = closability => SAJU_SOURCE_LOCAL_SEMANTIC_COMPOSITION_CLOSABILITY_REVIEW
  .filter(item => item.closability === closability)
  .map(item => item.compositionId)

export const SAJU_SOURCE_LOCAL_SEMANTIC_COMPOSITION_FREEZE_DECISION = Object.freeze({
  schema: 'saju-source-local-semantic-composition-freeze-decision-v0',
  version: SAJU_SOURCE_LOCAL_SEMANTIC_COMPOSITION_CLOSABILITY_REVIEW_VERSION,
  v0FreezeReady: true,
  compositionExecutionReady: false,
  endToEndClosedCompositionIds: Object.freeze([]),
  nearCandidateIds: Object.freeze(compositionClosabilityIdsBy('near_candidate')),
  frozenUnresolvedIds: Object.freeze(compositionClosabilityIdsBy('v0_frozen')),
  unsupportedCompositionIds: Object.freeze(compositionIdsByStatus('unsupported')),
  commonCompositionCandidates: Object.freeze([]),
  interpretationHypothesisLayerReady: false,
  reason: 'no unresolved candidate closed end-to-end; two finite near-candidate checks remain explicitly outside the frozen v0 contract, and all other gaps are normal unresolved boundaries',
  policy: 'freeze current executable surfaces and retain every non-closed candidate as unresolved; no source-local or cross-lineage semantic synthesis is emitted',
})

export const SAJU_SOURCE_LOCAL_SEMANTIC_COMPOSITION_READINESS = Object.freeze({
  schema: 'saju-source-local-semantic-composition-readiness-v0',
  version: SAJU_SOURCE_LOCAL_SEMANTIC_COMPOSITION_VERSION,
  localCompositionReady: true,
  compositionReady: false,
  globalCompositionReady: false,
  interpretationHypothesisReady: false,
  adoptedCompositionIds: Object.freeze(compositionIdsByStatus('adopted_composition')),
  boundedRoleUseTransitionIds: Object.freeze(compositionIdsByStatus('bounded_role_use_transition')),
  unresolvedCompositionIds: Object.freeze(compositionIdsByStatus('unresolved')),
  unsupportedCompositionIds: Object.freeze(compositionIdsByStatus('unsupported')),
  commonCompositionCandidates: Object.freeze([]),
  sourceProvidesLocalPriority: false,
  sourceProvidesLocalCombinationRule: true,
  sourceProvidesLocalTransitionRule: true,
  sourceProvidesGlobalPriority: false,
  sourceProvidesGlobalCombinationRule: false,
  sourceProvidesGlobalTransitionRule: false,
  personalMeaning: false,
  crossLineageMerge: false,
  winnerSelection: false,
  closabilityReview: SAJU_SOURCE_LOCAL_SEMANTIC_COMPOSITION_CLOSABILITY_REVIEW,
  freezeDecision: SAJU_SOURCE_LOCAL_SEMANTIC_COMPOSITION_FREEZE_DECISION,
  v0FreezeReady: SAJU_SOURCE_LOCAL_SEMANTIC_COMPOSITION_FREEZE_DECISION.v0FreezeReady,
  policy: 'adopt only exact same-source composition windows; preserve simultaneous components, lineage isolation, and unresolved transitions without synthesis',
})

export const SAJU_SOURCE_SEMANTIC_LEXICON_COMMON_CANDIDATES = Object.freeze([])

export const SAJU_SOURCE_SEMANTIC_LEXICON_COMPOSITION_READINESS = Object.freeze({
  schema: 'saju-source-semantic-lexicon-composition-readiness-v0',
  sourceProvidesPriority: false,
  sourceProvidesCombinationRule: false,
  sourceProvidesTransitionRule: false,
  compositionReady: false,
  commonSemanticCandidates: Object.freeze([]),
  policy: 'preserve source terms and lineage entries independently; do not synthesize a shared meaning',
})

const ADOPTED_LINEAGE_RULE_IDS = new Set(SAJU_LINEAGE_RULES.filter(ruleItem => ruleItem.status === 'adopted_lineage_rule').map(ruleItem => ruleItem.ruleId))

export const SAJU_FIVE_LINEAGE_COMPOSITION_READINESS = Object.freeze({
  schema: 'saju-five-lineage-composition-readiness-v0',
  lineageOrder: Object.freeze(['yuanhai', 'sanming', 'ziping', 'ditian', 'qiongtong']),
  commonCandidates: Object.freeze([]),
  compositionReady: false,
  sourceProvidesCrossLineagePriority: false,
  sourceProvidesTransitionRule: false,
  sourceProvidesCombinationRule: false,
  policy: 'preserve each lineage rule and simultaneous result separately; no cross-lineage majority, merge, or winner selection',
  reason: 'the five reviewed surfaces do not provide materially identical input/condition/output contracts with an explicit common priority or transition rule',
})

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
      sanming: SAJU_SANMING_RULE_INVENTORY,
      ditian: SAJU_DITIAN_RULE_INVENTORY,
      qiongtong: SAJU_QIONGTONG_RULE_INVENTORY,
    },
    lineageSemanticRules: {
      sanming: SAJU_SANMING_SOURCE_SEMANTIC_RULES,
      ditian: [],
      qiongtong: [],
    },
    lineageSemanticContracts: {
      sanming: SAJU_SANMING_SOURCE_SEMANTIC_CONTRACTS,
      ditian: [],
      qiongtong: [],
    },
    newlyAdoptedRuleIds: SAJU_ZIPING_SEMANTIC_RULE_INVENTORY
      .filter(item => item.status === 'newly_adopted_executable')
      .map(item => item.inventoryId),
    compositionFrontier: SAJU_ZIPING_SEMANTIC_COMPOSITION_FRONTIER,
    fiveLineageComparison: SAJU_FIVE_LINEAGE_COMPOSITION_READINESS,
    commonRulePromotion: false,
    personalMeaning: false,
    crossLineageMerge: false,
  },
  sourceBoundedSemanticLexicon: {
    schema: SAJU_SOURCE_BOUNDED_SEMANTIC_LEXICON_SCHEMA,
    version: SAJU_SOURCE_BOUNDED_SEMANTIC_LEXICON_VERSION,
    entries: SAJU_SOURCE_BOUNDED_SEMANTIC_LEXICON,
    adoptedEntryIds: SAJU_SOURCE_BOUNDED_SEMANTIC_LEXICON
      .filter(entry => entry.status === 'adopted_semantic_entry')
      .map(entry => entry.entryId),
    commonSemanticCandidates: SAJU_SOURCE_SEMANTIC_LEXICON_COMMON_CANDIDATES,
    compositionReadiness: SAJU_SOURCE_SEMANTIC_LEXICON_COMPOSITION_READINESS,
    personalMeaning: false,
    crossLineageMerge: false,
    interpretationHypothesisGenerated: false,
  },
  sourceLocalSemanticComposition: {
    schema: SAJU_SOURCE_LOCAL_SEMANTIC_COMPOSITION_SCHEMA,
    version: SAJU_SOURCE_LOCAL_SEMANTIC_COMPOSITION_VERSION,
    rules: SAJU_SOURCE_LOCAL_SEMANTIC_COMPOSITION_RULES,
    adoptedCompositionIds: SAJU_SOURCE_LOCAL_SEMANTIC_COMPOSITION_READINESS.adoptedCompositionIds,
    boundedRoleUseTransitionIds: SAJU_SOURCE_LOCAL_SEMANTIC_COMPOSITION_READINESS.boundedRoleUseTransitionIds,
    unresolvedCompositionIds: SAJU_SOURCE_LOCAL_SEMANTIC_COMPOSITION_READINESS.unresolvedCompositionIds,
    unsupportedCompositionIds: SAJU_SOURCE_LOCAL_SEMANTIC_COMPOSITION_READINESS.unsupportedCompositionIds,
    commonCompositionCandidates: SAJU_SOURCE_LOCAL_SEMANTIC_COMPOSITION_READINESS.commonCompositionCandidates,
    readiness: SAJU_SOURCE_LOCAL_SEMANTIC_COMPOSITION_READINESS,
    closabilityReview: SAJU_SOURCE_LOCAL_SEMANTIC_COMPOSITION_CLOSABILITY_REVIEW,
    freezeDecision: SAJU_SOURCE_LOCAL_SEMANTIC_COMPOSITION_FREEZE_DECISION,
    v0FreezeReady: SAJU_SOURCE_LOCAL_SEMANTIC_COMPOSITION_FREEZE_DECISION.v0FreezeReady,
    localCompositionReady: true,
    compositionReady: false,
    globalCompositionReady: false,
    interpretationHypothesisReady: false,
    personalMeaning: false,
    crossLineageMerge: false,
    winnerSelection: false,
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

function sourceStemForInput(value) {
  return typeof value === 'string' ? SOURCE_STEM_BY_INPUT[value] || null : null
}

function sourceBranchForInput(value) {
  return typeof value === 'string' ? SOURCE_BRANCH_BY_INPUT[value] || null : null
}

function hasCompleteDitianHeavenEarthHumanFrameInput(base) {
  if (!hasExactTime(base) || !hasAllFacts(base, [FACT_REFS.dayMaster, FACT_REFS.pillarFacts])) return false
  return PILLAR_POSITIONS.every(position => {
    const pillar = readPath(base, `systems.saju.fact.pillarFacts.${position}`).value
    return isObject(pillar)
      && sourceStemForInput(pillar.stem)
      && sourceBranchForInput(pillar.branch)
      && Array.isArray(pillar.hiddenStems)
      && pillar.hiddenStems.every(entry => isObject(entry) && sourceStemForInput(entry.stem))
  })
}

function ditianHeavenEarthHumanFrame(base) {
  const pillarFacts = base.systems.saju.fact.pillarFacts
  return {
    positions: PILLAR_POSITIONS.map(position => {
      const pillar = pillarFacts[position]
      return {
        position,
        sourceLabels: { visibleStem: '天元', branch: '地元', hiddenStems: '人元' },
        supplied: {
          visibleStem: sourceStemForInput(pillar.stem),
          branch: sourceBranchForInput(pillar.branch),
          hiddenStems: pillar.hiddenStems.map(entry => sourceStemForInput(entry.stem)),
        },
      }
    }),
    sourceScope: 'ditian-p2-heaven-earth-human-frame-only',
  }
}

function hasCompleteDitianBranchCategoryInput(base) {
  if (!hasExactTime(base) || !hasAllFacts(base, [FACT_REFS.pillarFacts])) return false
  return PILLAR_POSITIONS.every(position => {
    const branch = readPath(base, `systems.saju.fact.pillarFacts.${position}.branch`).value
    return Boolean(sourceBranchForInput(branch))
  })
}

function ditianBranchCategoryInventory(base) {
  const pillarFacts = base.systems.saju.fact.pillarFacts
  const sourceGroups = {
    陽支: [...DITIAN_BRANCH_GROUPS.양지],
    陰支: [...DITIAN_BRANCH_GROUPS.음지],
    四生: [...DITIAN_BRANCH_GROUPS.사생],
    四庫: [...DITIAN_BRANCH_GROUPS.사고],
    四敗: [...DITIAN_BRANCH_GROUPS.사패],
  }
  const groupEntries = Object.entries(sourceGroups)
  const branchCategoriesByPosition = PILLAR_POSITIONS.map(position => {
    const sourceBranch = sourceBranchForInput(pillarFacts[position].branch)
    return {
      position,
      sourceBranch,
      categories: groupEntries.filter(([, branches]) => branches.includes(sourceBranch)).map(([category]) => category),
    }
  })
  return {
    sourceGroups,
    branchCategoriesByPosition,
    precedence: 'none',
    sourceScope: 'ditian-p10-branch-category-membership-only',
  }
}

function hasCompleteDitianShapeExampleInput(base) {
  if (!hasExactTime(base) || !hasAllFacts(base, [FACT_REFS.dayMaster, FACT_REFS.monthBranch])) return false
  return Boolean(sourceStemForInput(readPath(base, FACT_REFS.dayMaster).value) && sourceBranchForInput(readPath(base, FACT_REFS.monthBranch).value))
}

function ditianShapeExampleInventory(base) {
  const sourceStem = sourceStemForInput(readPath(base, FACT_REFS.dayMaster).value)
  const sourceMonthBranch = sourceBranchForInput(readPath(base, FACT_REFS.monthBranch).value)
  return {
    sourceCondition: { dayMasterStem: sourceStem, monthBranch: sourceMonthBranch },
    matchedExamples: DITIAN_SHAPE_EXAMPLES
      .filter(example => example.sourceStem === sourceStem && example.monthBranches.includes(sourceMonthBranch))
      .map(example => ({ ...example, monthBranches: [...example.monthBranches] })),
    sourceExampleScope: 'ditian-p12-exact-shape-examples-only',
  }
}

function hasCompleteDitianFangJuExampleInput(base) {
  if (!hasExactTime(base) || !hasAllFacts(base, [FACT_REFS.pillarFacts])) return false
  return PILLAR_POSITIONS.every(position => Boolean(sourceBranchForInput(readPath(base, `systems.saju.fact.pillarFacts.${position}.branch`).value)))
}

function ditianFangJuExampleInventory(base) {
  const suppliedBranches = PILLAR_POSITIONS.map(position => ({
    position,
    sourceBranch: sourceBranchForInput(base.systems.saju.fact.pillarFacts[position].branch),
  }))
  const branchValues = suppliedBranches.map(item => item.sourceBranch)
  return {
    suppliedBranches,
    matchedExamples: DITIAN_FANG_JU_EXAMPLES
      .filter(example => example.sourceBranchSet.every(branch => branchValues.includes(branch)))
      .map(example => ({
        relation: example.relation,
        label: example.label,
        sourceExample: example.sourceExample,
        requiredBranchSet: [...example.sourceBranchSet],
        positions: example.sourceBranchSet.map(branch => suppliedBranches.filter(item => item.sourceBranch === branch).map(item => item.position)),
      })),
    precedence: 'none',
    sourceScope: 'ditian-p13-exact-fang-ju-examples-only',
  }
}

function hasCompleteQiongtongElementNumberInput(base) {
  const elements = readPath(base, FACT_REFS.elements).value
  return isObject(elements) && ['목', '화', '토', '금', '수'].every(element => typeof elements[element] === 'number' && Number.isFinite(elements[element]))
}

function qiongtongElementNumberInventory(base) {
  const elements = base.systems.saju.fact.elementsDistribution
  return {
    sourceElementNumbers: { ...QIONGTONG_ELEMENT_NUMBERS },
    suppliedElementKeys: ['목', '화', '토', '금', '수'].filter(element => Object.hasOwn(elements, element)),
    stateOperation: { 生旺: 'not_applied', '死绝': 'not_applied' },
    sourceScope: 'qiongtong-p2-element-number-inventory-only',
  }
}

function hasCompleteQiongtongDayStemSectionInput(base) {
  if (!hasExactTime(base) || !hasAllFacts(base, [FACT_REFS.dayMaster])) return false
  return Boolean(QIONGTONG_DAY_STEM_SECTIONS[sourceStemForInput(readPath(base, FACT_REFS.dayMaster).value)])
}

function qiongtongDayStemSectionFrame(base) {
  const dayMasterStem = sourceStemForInput(readPath(base, FACT_REFS.dayMaster).value)
  const section = QIONGTONG_DAY_STEM_SECTIONS[dayMasterStem]
  return {
    dayMasterStem,
    sourceSection: {
      locatorId: section.locatorId,
      pdfPageStart: section.pdfPageStart,
      pdfPageEnd: section.pdfPageEnd,
    },
    monthlyClauseSelection: 'not_applied',
    sourceScope: 'qiongtong-day-stem-section-frame-only',
  }
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

function sanmingSeasonalWindowForBranch(branch) {
  return SANMING_SEASONAL_WINDOWS.find(window => window.monthBranches.includes(branch)) || null
}

function hasCompleteSanmingSeasonalStateInput(base) {
  if (!hasAllFacts(base, [FACT_REFS.monthBranch, FACT_REFS.elements])) return false
  const monthBranch = readPath(base, FACT_REFS.monthBranch).value
  const elements = readPath(base, FACT_REFS.elements).value
  if (!sanmingSeasonalWindowForBranch(monthBranch) || !isObject(elements)) return false
  return ['목', '화', '토', '금', '수'].every(element => typeof elements[element] === 'number' && Number.isFinite(elements[element]))
}

function sanmingSeasonalStateInventory(base) {
  const monthBranch = readPath(base, FACT_REFS.monthBranch).value
  const window = sanmingSeasonalWindowForBranch(monthBranch)
  return {
    monthBranch,
    seasonWindow: window.seasonWindow,
    elementStateBySeason: { ...window.elementStates },
    twelvePalaceVocabulary: [...SANMING_TWELVE_PALACE_LABELS],
    sourceScope: 'sanming-p67-seasonal-state-and-p68-vocabulary-only',
  }
}

function hasCompleteSanmingVisibleStemFrameInput(base) {
  if (!hasExactTime(base) || !hasAllFacts(base, [FACT_REFS.dayMaster, FACT_REFS.pillarFacts])) return false
  if (typeof readPath(base, FACT_REFS.dayMaster).value !== 'string') return false
  return PILLAR_POSITIONS.every(position => {
    const pillar = readPath(base, `systems.saju.fact.pillarFacts.${position}`).value
    return isObject(pillar) && typeof pillar.stem === 'string'
  })
}

function sanmingVisibleStemFrame(base) {
  const fact = base.systems.saju.fact
  return {
    dayMasterStem: fact.dayMasterDetails.stem,
    visibleStemInventory: PILLAR_POSITIONS.map(position => ({
      position,
      visibleStem: fact.pillarFacts[position].stem,
    })),
    sourceInputScope: 'sanming-p162-visible-stem-role-nomenclature-input-only',
  }
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
    case 'rule.sanming.seasonal-state-inventory.v0': {
      if (!hasCompleteSanmingSeasonalStateInput(base)) return ruleResult(ruleItem, 'blocked_missing_base_fact', {}, 'month branch or five-element distribution FACT is missing or not in the source seasonal window list')
      return ruleResult(ruleItem, 'executable_from_frozen_base', sanmingSeasonalStateInventory(base))
    }
    case 'rule.sanming.visible-stem-frame.v0': {
      if (!hasCompleteSanmingVisibleStemFrameInput(base)) return ruleResult(ruleItem, 'blocked_missing_base_fact', {}, 'exact time, day-master, or visible stem FACT is missing or malformed')
      return ruleResult(ruleItem, 'executable_from_frozen_base', sanmingVisibleStemFrame(base))
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
    case 'rule.ditian.heaven-earth-human-frame.v0': {
      if (!hasCompleteDitianHeavenEarthHumanFrameInput(base)) return ruleResult(ruleItem, 'blocked_missing_base_fact', {}, 'exact time or complete heaven/earth/human pillar FACT is missing or malformed')
      return ruleResult(ruleItem, 'executable_from_frozen_base', ditianHeavenEarthHumanFrame(base))
    }
    case 'rule.ditian.branch-category-inventory.v0': {
      if (!hasCompleteDitianBranchCategoryInput(base)) return ruleResult(ruleItem, 'blocked_missing_base_fact', {}, 'exact time or recognized Ditian branch-category input is missing or malformed')
      return ruleResult(ruleItem, 'executable_from_frozen_base', ditianBranchCategoryInventory(base))
    }
    case 'rule.ditian.shape-example-inventory.v0': {
      if (!hasCompleteDitianShapeExampleInput(base)) return ruleResult(ruleItem, 'blocked_missing_base_fact', {}, 'exact time, day-master, or month-branch FACT is missing or malformed')
      const output = ditianShapeExampleInventory(base)
      if (output.matchedExamples.length === 0) return ruleResult(ruleItem, 'not_applicable_fixture', output, 'fixture is outside the four exact p.12 shape examples')
      return ruleResult(ruleItem, 'executable_from_frozen_base', output)
    }
    case 'rule.ditian.fang-ju-example-inventory.v0': {
      if (!hasCompleteDitianFangJuExampleInput(base)) return ruleResult(ruleItem, 'blocked_missing_base_fact', {}, 'exact time or complete Ditian branch-set input is missing or malformed')
      const output = ditianFangJuExampleInventory(base)
      if (output.matchedExamples.length === 0) return ruleResult(ruleItem, 'not_applicable_fixture', output, 'fixture is outside the exact p.13 方/局 example sets')
      return ruleResult(ruleItem, 'executable_from_frozen_base', output)
    }
    case 'rule.qiongtong.five-phase-number-inventory.v0': {
      if (!hasCompleteQiongtongElementNumberInput(base)) return ruleResult(ruleItem, 'blocked_missing_base_fact', {}, 'complete five-element distribution FACT is missing or malformed')
      return ruleResult(ruleItem, 'executable_from_frozen_base', qiongtongElementNumberInventory(base))
    }
    case 'rule.qiongtong.day-stem-section-frame.v0': {
      if (!hasCompleteQiongtongDayStemSectionInput(base)) return ruleResult(ruleItem, 'blocked_missing_base_fact', {}, 'exact time or recognized Qiongtong day-stem section input is missing or malformed')
      return ruleResult(ruleItem, 'executable_from_frozen_base', qiongtongDayStemSectionFrame(base))
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
    if (item.status === 'adopted_lineage_rule' && !['bounded_complete_structural_frame', 'bounded_complete_procedure_frame', 'bounded_label_inventory_only', 'bounded_role_scope_not_service_day_table', 'bounded_relation_vocabulary', 'bounded_relation_inventory_not_resolution', 'bounded_explicit_example_predicate', 'bounded_stem_specific_predicate', 'bounded_exact_exposure_example_predicate', 'bounded_exact_source_clause_predicate', 'bounded_condition_clause_for_jia_only', 'bounded_numeric_state_clause', 'bounded_numeric_operation_without_state_resolver', 'bounded_month_specific_condition_clauses', 'bounded_timing_lens_frame', 'bounded_seasonal_state_inventory', 'bounded_visible_stem_frame', 'bounded_heaven_earth_human_frame', 'bounded_branch_category_inventory', 'bounded_exact_shape_example_inventory', 'bounded_exact_fang_ju_example_inventory', 'bounded_element_number_inventory', 'bounded_day_stem_section_frame'].includes(item.ruleCompleteness)) fail(`adopted_rule_incomplete:${item.ruleId}`)
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
  const sanmingInventory = grammar.sourceBoundedSemanticGrammar?.lineageRuleInventories?.sanming
  if (!Array.isArray(sanmingInventory) || sanmingInventory.length === 0) fail('sanming_inventory_missing')
  else {
    const sanmingInventoryIds = new Set()
    const structuralContractsByRuleId = new Map(SAJU_LINEAGE_STRUCTURAL_CONTRACTS.map(contract => [contract.ruleId, contract]))
    const sourceSemanticRulesByRuleId = new Map(SAJU_SANMING_SOURCE_SEMANTIC_RULES.map(ruleItem => [ruleItem.ruleId, ruleItem]))
    const sourceSemanticContractsByRuleId = new Map(SAJU_SANMING_SOURCE_SEMANTIC_CONTRACTS.map(contract => [contract.ruleId, contract]))
    for (const item of sanmingInventory) {
      if (!isObject(item)) {
        fail('sanming_inventory_item_not_object')
        continue
      }
      if (!item.inventoryId || sanmingInventoryIds.has(item.inventoryId)) fail(`sanming_inventory_id_duplicate:${item.inventoryId || 'missing'}`)
      sanmingInventoryIds.add(item.inventoryId)
      if (!SAJU_SANMING_INVENTORY_STATUSES.includes(item.status)) fail(`sanming_inventory_status:${item.inventoryId}`)
      if (JSON.stringify(item.sourceIds) !== JSON.stringify(['saju-source-sanming-tonghui'])) fail(`sanming_inventory_source:${item.inventoryId}`)
      if (!Array.isArray(item.locatorIds) || item.locatorIds.length === 0) fail(`sanming_inventory_locators:${item.inventoryId}`)
      for (const locatorId of item.locatorIds || []) {
        const locator = locatorsById.get(locatorId)
        if (!locator) fail(`sanming_inventory_locator_unknown:${item.inventoryId}:${locatorId}`)
        else if (locator.sourceId !== 'saju-source-sanming-tonghui') fail(`sanming_inventory_locator_source:${item.inventoryId}:${locatorId}`)
      }
      if (!Array.isArray(item.applicability) || item.applicability.length === 0 || !Array.isArray(item.exceptions) || item.exceptions.length === 0 || !Array.isArray(item.forbiddenExtensions) || item.forbiddenExtensions.length === 0) fail(`sanming_inventory_boundary:${item.inventoryId}`)
      if (!isObject(item.requiredStructuralResult) || !Array.isArray(item.requiredStructuralResult.ruleIds) || !Array.isArray(item.requiredStructuralResult.fields) || typeof item.requiredStructuralResult.closure !== 'string') fail(`sanming_inventory_structural:${item.inventoryId}`)
      if (!isObject(item.sourceDefinedOutput) || typeof item.sourceDefinedOutput.kind !== 'string' || typeof item.sourceDefinedOutput.role !== 'string' || !Array.isArray(item.sourceDefinedOutput.outputShape) || typeof item.sourceDefinedOutput.scope !== 'string') fail(`sanming_inventory_output:${item.inventoryId}`)
      if (!['coexistence_only_until_source_priority_is_closed', 'unresolved_composition_frontier'].includes(item.compositionState)) fail(`sanming_inventory_composition:${item.inventoryId}`)
      if (item.status === 'adopted_structural_rule') {
        const contract = structuralContractsByRuleId.get(item.contractRuleId)
        if (!contract || contract.work !== WORKS.sanming || contract.ruleStatus !== 'adopted_lineage_rule') fail(`sanming_inventory_contract:${item.inventoryId}`)
        if (item.requiredStructuralResult.closure !== 'closed_in_existing_contract') fail(`sanming_inventory_adopted_closure:${item.inventoryId}`)
      } else if (item.status === 'adopted_semantic_rule') {
        const semanticRule = sourceSemanticRulesByRuleId.get(item.contractRuleId)
        const semanticContract = sourceSemanticContractsByRuleId.get(item.contractRuleId)
        if (!semanticRule || semanticRule.work !== WORKS.sanming || semanticRule.status !== 'adopted_lineage_semantic_rule' || !semanticContract) fail(`sanming_inventory_semantic_contract:${item.inventoryId}`)
      } else if (item.contractRuleId !== undefined) {
        fail(`sanming_inventory_unadopted_contract:${item.inventoryId}`)
      }
    }
  }
  const structuralContractsByRuleId = new Map(SAJU_LINEAGE_STRUCTURAL_CONTRACTS.map(contract => [contract.ruleId, contract]))
  for (const [lineageKey, expectedStatuses, expectedWork, expectedSourceId] of [
    ['ditian', SAJU_DITIAN_INVENTORY_STATUSES, WORKS.ditian, 'saju-source-ditian-sui'],
    ['qiongtong', SAJU_QIONGTONG_INVENTORY_STATUSES, WORKS.qiongtong, 'saju-source-qiongtong-baojian'],
  ]) {
    const inventory = grammar.sourceBoundedSemanticGrammar?.lineageRuleInventories?.[lineageKey]
    if (!Array.isArray(inventory) || inventory.length === 0) {
      fail(`${lineageKey}_inventory_missing`)
      continue
    }
    const inventoryIdsForLineage = new Set()
    for (const item of inventory) {
      if (!isObject(item)) {
        fail(`${lineageKey}_inventory_item_not_object`)
        continue
      }
      if (!item.inventoryId || inventoryIdsForLineage.has(item.inventoryId)) fail(`${lineageKey}_inventory_id_duplicate:${item.inventoryId || 'missing'}`)
      inventoryIdsForLineage.add(item.inventoryId)
      if (!expectedStatuses.includes(item.status)) fail(`${lineageKey}_inventory_status:${item.inventoryId}`)
      if (item.work !== expectedWork || item.lineage !== `${lineageKey}_local_export`) fail(`${lineageKey}_inventory_identity:${item.inventoryId}`)
      if (JSON.stringify(item.sourceIds) !== JSON.stringify([expectedSourceId])) fail(`${lineageKey}_inventory_source:${item.inventoryId}`)
      if (!Array.isArray(item.locatorIds) || item.locatorIds.length === 0) fail(`${lineageKey}_inventory_locators:${item.inventoryId}`)
      for (const locatorId of item.locatorIds || []) {
        const locator = locatorsById.get(locatorId)
        if (!locator) fail(`${lineageKey}_inventory_locator_unknown:${item.inventoryId}:${locatorId}`)
        else if (locator.sourceId !== expectedSourceId) fail(`${lineageKey}_inventory_locator_source:${item.inventoryId}:${locatorId}`)
      }
      if (!Array.isArray(item.applicability) || item.applicability.length === 0 || !Array.isArray(item.exceptions) || item.exceptions.length === 0 || !Array.isArray(item.forbiddenExtensions) || item.forbiddenExtensions.length === 0) fail(`${lineageKey}_inventory_boundary:${item.inventoryId}`)
      if (!isObject(item.requiredStructuralResult) || !Array.isArray(item.requiredStructuralResult.ruleIds) || !Array.isArray(item.requiredStructuralResult.fields) || typeof item.requiredStructuralResult.closure !== 'string') fail(`${lineageKey}_inventory_structural:${item.inventoryId}`)
      if (!isObject(item.sourceDefinedOutput) || typeof item.sourceDefinedOutput.kind !== 'string' || typeof item.sourceDefinedOutput.role !== 'string' || !Array.isArray(item.sourceDefinedOutput.outputShape) || typeof item.sourceDefinedOutput.scope !== 'string') fail(`${lineageKey}_inventory_output:${item.inventoryId}`)
      if (!['coexistence_only_until_source_priority_is_closed', 'unresolved_composition_frontier'].includes(item.compositionState)) fail(`${lineageKey}_inventory_composition:${item.inventoryId}`)
      if (item.status === 'adopted_structural_rule') {
        const contract = structuralContractsByRuleId.get(item.contractRuleId)
        if (!contract || contract.work !== expectedWork || contract.ruleStatus !== 'adopted_lineage_rule') fail(`${lineageKey}_inventory_contract:${item.inventoryId}`)
        if (item.requiredStructuralResult.closure !== 'closed_in_existing_contract') fail(`${lineageKey}_inventory_adopted_closure:${item.inventoryId}`)
      } else if (item.contractRuleId !== undefined) {
        fail(`${lineageKey}_inventory_unadopted_contract:${item.inventoryId}`)
      }
    }
  }
  const compositionFrontier = grammar.sourceBoundedSemanticGrammar?.compositionFrontier
  if (!isObject(compositionFrontier) || compositionFrontier.status !== 'unresolved_composition_frontier' || compositionFrontier.compositionReady !== false || compositionFrontier.sourceProvidesPriority !== false || compositionFrontier.sourceProvidesCombinationRule !== false || compositionFrontier.sourceProvidesTransitionRule !== false) fail('semantic_composition_frontier')
  const fiveLineageComparison = grammar.sourceBoundedSemanticGrammar?.fiveLineageComparison
  if (!isObject(fiveLineageComparison) || fiveLineageComparison.schema !== SAJU_FIVE_LINEAGE_COMPOSITION_READINESS.schema || JSON.stringify(fiveLineageComparison.lineageOrder) !== JSON.stringify(SAJU_FIVE_LINEAGE_COMPOSITION_READINESS.lineageOrder) || fiveLineageComparison.compositionReady !== false || fiveLineageComparison.sourceProvidesCrossLineagePriority !== false || fiveLineageComparison.sourceProvidesTransitionRule !== false || fiveLineageComparison.sourceProvidesCombinationRule !== false || !Array.isArray(fiveLineageComparison.commonCandidates) || fiveLineageComparison.commonCandidates.length !== 0) fail('five_lineage_composition_readiness')
  const expectedNewlyAdopted = (semanticInventory || []).filter(item => item.status === 'newly_adopted_executable').map(item => item.inventoryId)
  if (JSON.stringify(grammar.sourceBoundedSemanticGrammar?.newlyAdoptedRuleIds || []) !== JSON.stringify(expectedNewlyAdopted)) fail('semantic_inventory_newly_adopted_mismatch')

  const semanticLexicon = grammar.sourceBoundedSemanticLexicon
  if (!isObject(semanticLexicon)
    || semanticLexicon.schema !== SAJU_SOURCE_BOUNDED_SEMANTIC_LEXICON_SCHEMA
    || semanticLexicon.version !== SAJU_SOURCE_BOUNDED_SEMANTIC_LEXICON_VERSION
    || semanticLexicon.personalMeaning !== false
    || semanticLexicon.crossLineageMerge !== false
    || semanticLexicon.interpretationHypothesisGenerated !== false
    || !Array.isArray(semanticLexicon.entries)
    || !Array.isArray(semanticLexicon.commonSemanticCandidates)
    || semanticLexicon.commonSemanticCandidates.length !== 0) {
    fail('semantic_lexicon_boundary')
  } else {
    for (const error of checkSajuSourceBoundedSemanticLexicon(semanticLexicon.entries)) fail('semantic_lexicon:' + error)
    const expectedAdoptedEntryIds = semanticLexicon.entries
      .filter(entry => entry.status === 'adopted_semantic_entry')
      .map(entry => entry.entryId)
    if (JSON.stringify(semanticLexicon.adoptedEntryIds) !== JSON.stringify(expectedAdoptedEntryIds)) fail('semantic_lexicon_adopted_ids')
    if (!isObject(semanticLexicon.compositionReadiness)
      || semanticLexicon.compositionReadiness.compositionReady !== false
      || semanticLexicon.compositionReadiness.sourceProvidesPriority !== false
      || semanticLexicon.compositionReadiness.sourceProvidesCombinationRule !== false
      || semanticLexicon.compositionReadiness.sourceProvidesTransitionRule !== false
      || !Array.isArray(semanticLexicon.compositionReadiness.commonSemanticCandidates)
      || semanticLexicon.compositionReadiness.commonSemanticCandidates.length !== 0) {
      fail('semantic_lexicon_composition_readiness')
    }
  }

  const sourceLocalComposition = grammar.sourceLocalSemanticComposition
  if (!isObject(sourceLocalComposition)
    || sourceLocalComposition.schema !== SAJU_SOURCE_LOCAL_SEMANTIC_COMPOSITION_SCHEMA
    || sourceLocalComposition.version !== SAJU_SOURCE_LOCAL_SEMANTIC_COMPOSITION_VERSION
    || !Array.isArray(sourceLocalComposition.rules)
    || sourceLocalComposition.localCompositionReady !== true
    || sourceLocalComposition.compositionReady !== false
    || sourceLocalComposition.globalCompositionReady !== false
    || sourceLocalComposition.interpretationHypothesisReady !== false
    || sourceLocalComposition.personalMeaning !== false
    || sourceLocalComposition.crossLineageMerge !== false
    || sourceLocalComposition.winnerSelection !== false
    || sourceLocalComposition.v0FreezeReady !== true
    || !Array.isArray(sourceLocalComposition.commonCompositionCandidates)
    || sourceLocalComposition.commonCompositionCandidates.length !== 0) {
    fail('source_local_semantic_composition_boundary')
  } else {
    for (const error of checkSajuSourceLocalSemanticComposition(sourceLocalComposition.rules)) fail('source_local_semantic_composition:' + error)
    for (const [status, field] of [
      ['adopted_composition', 'adoptedCompositionIds'],
      ['bounded_role_use_transition', 'boundedRoleUseTransitionIds'],
      ['unresolved', 'unresolvedCompositionIds'],
      ['unsupported', 'unsupportedCompositionIds'],
    ]) {
      const expectedIds = sourceLocalComposition.rules.filter(ruleItem => ruleItem.status === status).map(ruleItem => ruleItem.compositionId)
      if (JSON.stringify(sourceLocalComposition[field] || []) !== JSON.stringify(expectedIds)) fail(`source_local_semantic_composition_ids:${field}`)
    }
    const readiness = sourceLocalComposition.readiness
    if (!isObject(readiness)
      || readiness.schema !== SAJU_SOURCE_LOCAL_SEMANTIC_COMPOSITION_READINESS.schema
      || readiness.compositionReady !== false
      || readiness.globalCompositionReady !== false
      || readiness.interpretationHypothesisReady !== false
      || !Array.isArray(readiness.commonCompositionCandidates)
      || readiness.commonCompositionCandidates.length !== 0
      || readiness.personalMeaning !== false
      || readiness.crossLineageMerge !== false
      || readiness.winnerSelection !== false
      || readiness.v0FreezeReady !== true) fail('source_local_semantic_composition_readiness')
    for (const error of checkSajuSourceLocalSemanticCompositionClosabilityReview(sourceLocalComposition.closabilityReview)) fail('source_local_semantic_composition_closability:' + error)
    if (JSON.stringify(sourceLocalComposition.closabilityReview || []) !== JSON.stringify(readiness.closabilityReview || [])) fail('source_local_semantic_composition_closability_mismatch')
    if (JSON.stringify(sourceLocalComposition.freezeDecision || {}) !== JSON.stringify(readiness.freezeDecision || {})) fail('source_local_semantic_composition_freeze_decision_mismatch')
    const freezeDecision = sourceLocalComposition.freezeDecision
    if (!isObject(freezeDecision)
      || freezeDecision.schema !== SAJU_SOURCE_LOCAL_SEMANTIC_COMPOSITION_FREEZE_DECISION.schema
      || freezeDecision.version !== SAJU_SOURCE_LOCAL_SEMANTIC_COMPOSITION_FREEZE_DECISION.version
      || freezeDecision.v0FreezeReady !== true
      || freezeDecision.compositionExecutionReady !== false
      || !Array.isArray(freezeDecision.endToEndClosedCompositionIds)
      || freezeDecision.endToEndClosedCompositionIds.length !== 0
      || JSON.stringify(freezeDecision.nearCandidateIds || []) !== JSON.stringify(SAJU_SOURCE_LOCAL_SEMANTIC_COMPOSITION_FREEZE_DECISION.nearCandidateIds)
      || JSON.stringify(freezeDecision.frozenUnresolvedIds || []) !== JSON.stringify(SAJU_SOURCE_LOCAL_SEMANTIC_COMPOSITION_FREEZE_DECISION.frozenUnresolvedIds)
      || JSON.stringify(freezeDecision.unsupportedCompositionIds || []) !== JSON.stringify(SAJU_SOURCE_LOCAL_SEMANTIC_COMPOSITION_FREEZE_DECISION.unsupportedCompositionIds)
      || !Array.isArray(freezeDecision.commonCompositionCandidates)
      || freezeDecision.commonCompositionCandidates.length !== 0
      || freezeDecision.interpretationHypothesisLayerReady !== false) fail('source_local_semantic_composition_freeze_decision')
  }

  for (const candidate of grammar.commonCandidates || []) {
    if (candidate.adoptionStatus !== 'not_adopted') fail(`common_candidate_promoted:${candidate.candidateId}`)
    if (candidate.independenceStatus !== 'INDEPENDENT') fail(`common_candidate_independence:${candidate.candidateId}`)
    if (new Set(candidate.sourceIds || []).size < 2) fail(`common_candidate_sources:${candidate.candidateId}`)
  }

  return unique(errors).sort()
}

export function checkSajuSourceBoundedSemanticLexicon(entries = SAJU_SOURCE_BOUNDED_SEMANTIC_LEXICON) {
  const errors = []
  const fail = message => errors.push(message)
  if (!Array.isArray(entries)) return ['lexicon_not_array']

  const sourceIds = new Set(SAJU_LINEAGE_SOURCE_PROFILES.map(source => source.sourceId))
  const locatorsById = new Map(SAJU_LINEAGE_LOCATORS.map(locator => [locator.observationId, locator]))
  const structuralRulesById = new Map(SAJU_LINEAGE_RULES.map(ruleItem => [ruleItem.ruleId, ruleItem]))
  const semanticRulesById = new Map([
    ...SAJU_ZIPING_SOURCE_SEMANTIC_RULES,
    ...SAJU_SANMING_SOURCE_SEMANTIC_RULES,
  ].map(ruleItem => [ruleItem.ruleId, ruleItem]))
  const entryIds = new Set()

  for (const entry of entries) {
    if (!isObject(entry)) {
      fail('lexicon_entry_not_object')
      continue
    }
    if (!entry.entryId || entryIds.has(entry.entryId)) fail('lexicon_entry_id_duplicate:' + (entry.entryId || 'missing'))
    entryIds.add(entry.entryId)
    if (!SAJU_SOURCE_BOUNDED_SEMANTIC_LEXICON_STATUSES.includes(entry.status)) fail('lexicon_entry_status:' + entry.entryId)
    if (entry.claimPromotion !== false || entry.semanticAuthority !== 'not_established') fail('lexicon_entry_boundary:' + entry.entryId)
    if (!entry.work || !entry.lineage || !Array.isArray(entry.sourceIds) || entry.sourceIds.length !== 1) fail('lexicon_entry_identity:' + entry.entryId)
    for (const sourceId of entry.sourceIds || []) if (!sourceIds.has(sourceId)) fail('lexicon_entry_source:' + entry.entryId + ':' + sourceId)
    if (!Array.isArray(entry.locatorIds) || entry.locatorIds.length === 0) fail('lexicon_entry_locators:' + entry.entryId)
    for (const locatorId of entry.locatorIds || []) {
      const locator = locatorsById.get(locatorId)
      if (!locator) fail('lexicon_entry_locator_unknown:' + entry.entryId + ':' + locatorId)
      else if (locator.sourceId !== entry.sourceIds[0]) fail('lexicon_entry_locator_source:' + entry.entryId + ':' + locatorId)
    }
    if (typeof entry.sourceTerm !== 'string' || entry.sourceTerm.length === 0) fail('lexicon_entry_term:' + entry.entryId)
    if (!isObject(entry.target) || typeof entry.target.symbolOrStructure !== 'string' || typeof entry.target.kind !== 'string') fail('lexicon_entry_target:' + entry.entryId)
    if (!isObject(entry.directMeaningRange)
      || typeof entry.directMeaningRange.kind !== 'string'
      || !Array.isArray(entry.directMeaningRange.supportedClaims)
      || entry.directMeaningRange.supportedClaims.length === 0
      || typeof entry.directMeaningRange.scope !== 'string') {
      fail('lexicon_entry_meaning_range:' + entry.entryId)
    }
    if (!Array.isArray(entry.applicability) || entry.applicability.length === 0 || !Array.isArray(entry.exceptions) || entry.exceptions.length === 0) fail('lexicon_entry_conditions:' + entry.entryId)
    if (!Array.isArray(entry.forbiddenExtensions) || entry.forbiddenExtensions.length === 0 || !entry.forbiddenExtensions.includes('single_symbol_personal_meaning') || !entry.forbiddenExtensions.includes('cross_lineage_rule_merge')) fail('lexicon_entry_forbidden_boundary:' + entry.entryId)
    if (!SOURCE_SEMANTIC_LEXICON_COMPOSITION_STATES.includes(entry.compositionState)) fail('lexicon_entry_composition:' + entry.entryId)
    if (!['catalog_only_source_vocabulary', 'linked_result_only'].includes(entry.materializationMode)) fail('lexicon_entry_materialization_mode:' + entry.entryId)
    if (!isObject(entry.requiredStructuralResult) || !Array.isArray(entry.requiredStructuralResult.ruleIds) || !Array.isArray(entry.requiredStructuralResult.fields) || typeof entry.requiredStructuralResult.closure !== 'string') fail('lexicon_entry_structural:' + entry.entryId)
    if (!Array.isArray(entry.linkedStructuralRuleIds) || !Array.isArray(entry.linkedSemanticRuleIds)) fail('lexicon_entry_links:' + entry.entryId)

    for (const ruleId of entry.linkedStructuralRuleIds || []) {
      const ruleItem = structuralRulesById.get(ruleId)
      if (!ruleItem) fail('lexicon_entry_structural_rule_unknown:' + entry.entryId + ':' + ruleId)
      else if (ruleItem.sourceIds.some(sourceId => !entry.sourceIds.includes(sourceId))) fail('lexicon_entry_structural_rule_source:' + entry.entryId + ':' + ruleId)
    }
    for (const ruleId of entry.linkedSemanticRuleIds || []) {
      const ruleItem = semanticRulesById.get(ruleId)
      if (!ruleItem) fail('lexicon_entry_semantic_rule_unknown:' + entry.entryId + ':' + ruleId)
      else if (ruleItem.sourceIds.some(sourceId => !entry.sourceIds.includes(sourceId))) fail('lexicon_entry_semantic_rule_source:' + entry.entryId + ':' + ruleId)
    }
    if (entry.status === 'adopted_semantic_entry' && entry.requiredStructuralResult.closure === 'closed_in_existing_contract') {
      if (entry.linkedStructuralRuleIds.length === 0 && entry.linkedSemanticRuleIds.length === 0) fail('lexicon_entry_adopted_unlinked:' + entry.entryId)
      if (entry.materializationMode !== 'linked_result_only') fail('lexicon_entry_adopted_materialization:' + entry.entryId)
    }
    if (entry.materializationMode === 'linked_result_only' && entry.linkedStructuralRuleIds.length === 0 && entry.linkedSemanticRuleIds.length === 0) fail('lexicon_entry_linked_without_rule:' + entry.entryId)
    if (!isObject(entry.provenance)
      || entry.provenance.schema !== SAJU_SOURCE_BOUNDED_SEMANTIC_LEXICON_SCHEMA
      || entry.provenance.version !== SAJU_SOURCE_BOUNDED_SEMANTIC_LEXICON_VERSION
      || JSON.stringify(entry.provenance.sourceIds) !== JSON.stringify(entry.sourceIds)
      || JSON.stringify(entry.provenance.locatorIds) !== JSON.stringify(entry.locatorIds)
      || !isObject(entry.provenance.sourceByteSha256)) {
      fail('lexicon_entry_provenance:' + entry.entryId)
    } else {
      const expectedHashes = sourceByteSha256ForIds(entry.sourceIds)
      if (JSON.stringify(entry.provenance.sourceByteSha256) !== JSON.stringify(expectedHashes)) fail('lexicon_entry_provenance_hash:' + entry.entryId)
      for (const sourceId of entry.sourceIds) if (!/^[a-f0-9]{64}$/.test(entry.provenance.sourceByteSha256[sourceId] || '')) fail('lexicon_entry_provenance_source_hash:' + entry.entryId + ':' + sourceId)
    }
  }
  return unique(errors).sort()
}

export function checkSajuSourceLocalSemanticComposition(rules = SAJU_SOURCE_LOCAL_SEMANTIC_COMPOSITION_RULES) {
  const errors = []
  const fail = message => errors.push(message)
  if (!Array.isArray(rules)) return ['composition_not_array']

  const sourceById = new Map(SAJU_LINEAGE_SOURCE_PROFILES.map(source => [source.sourceId, source]))
  const locatorsById = new Map(SAJU_LINEAGE_LOCATORS.map(locator => [locator.observationId, locator]))
  const structuralRulesById = new Map(SAJU_LINEAGE_RULES.map(ruleItem => [ruleItem.ruleId, ruleItem]))
  const semanticRules = [...SAJU_ZIPING_SOURCE_SEMANTIC_RULES, ...SAJU_SANMING_SOURCE_SEMANTIC_RULES]
  const semanticRulesById = new Map(semanticRules.map(ruleItem => [ruleItem.ruleId, ruleItem]))
  const lexiconById = new Map(SAJU_SOURCE_BOUNDED_SEMANTIC_LEXICON.map(entry => [entry.entryId, entry]))
  const lineageBySourceId = new Map([
    ...SAJU_LINEAGE_RULES.flatMap(ruleItem => ruleItem.sourceIds.map(sourceId => [sourceId, ruleItem.lineage])),
    ...semanticRules.flatMap(ruleItem => ruleItem.sourceIds.map(sourceId => [sourceId, ruleItem.lineage])),
    ...SAJU_SOURCE_BOUNDED_SEMANTIC_LEXICON.flatMap(entry => entry.sourceIds.map(sourceId => [sourceId, entry.lineage])),
  ])
  const compositionIds = new Set()

  const checkRequiredResults = (composition, key, idKey, knownById, label) => {
    const requirement = composition[key]
    if (!isObject(requirement)
      || !Array.isArray(requirement[idKey])
      || !Array.isArray(requirement.fields)
      || typeof requirement.closure !== 'string') {
      fail(`composition_${label}_shape:${composition.compositionId || 'missing'}`)
      return
    }
    for (const requiredId of requirement[idKey]) {
      const known = knownById.get(requiredId)
      if (!known) fail(`composition_${label}_unknown:${composition.compositionId}:${requiredId}`)
      else if ((known.sourceIds || []).some(sourceId => !(composition.sourceIds || []).includes(sourceId))) fail(`composition_${label}_source:${composition.compositionId}:${requiredId}`)
    }
  }

  for (const composition of rules) {
    if (!isObject(composition)) {
      fail('composition_item_not_object')
      continue
    }
    if (composition.schema !== SAJU_SOURCE_LOCAL_SEMANTIC_COMPOSITION_SCHEMA || composition.version !== SAJU_SOURCE_LOCAL_SEMANTIC_COMPOSITION_VERSION) fail(`composition_schema:${composition.compositionId || 'missing'}`)
    if (!composition.compositionId || compositionIds.has(composition.compositionId)) fail(`composition_id_duplicate:${composition.compositionId || 'missing'}`)
    compositionIds.add(composition.compositionId)
    if (!SAJU_SOURCE_LOCAL_SEMANTIC_COMPOSITION_STATUSES.includes(composition.status)) fail(`composition_status:${composition.compositionId}`)
    if (composition.claimPromotion !== false || composition.semanticAuthority !== 'not_established' || composition.noRecalculation !== true || composition.noPersonalMeaning !== true || composition.noCrossLineageMerge !== true || composition.interpretationHypothesis !== false) fail(`composition_boundary:${composition.compositionId}`)
    if (!composition.work || !composition.lineage || !Array.isArray(composition.sourceIds) || composition.sourceIds.length !== 1) fail(`composition_identity:${composition.compositionId}`)
    const sourceId = composition.sourceIds?.[0]
    const source = sourceById.get(sourceId)
    if (!source) fail(`composition_source_unknown:${composition.compositionId}:${sourceId}`)
    else {
      if (source.work !== composition.work) fail(`composition_work_mismatch:${composition.compositionId}`)
      if (lineageBySourceId.get(sourceId) !== composition.lineage) fail(`composition_lineage_mismatch:${composition.compositionId}`)
    }
    if (!Array.isArray(composition.locatorIds) || composition.locatorIds.length === 0) fail(`composition_locators:${composition.compositionId}`)
    for (const locatorId of composition.locatorIds || []) {
      const locator = locatorsById.get(locatorId)
      if (!locator) fail(`composition_locator_unknown:${composition.compositionId}:${locatorId}`)
      else if (locator.sourceId !== sourceId) fail(`composition_locator_source:${composition.compositionId}:${locatorId}`)
    }

    checkRequiredResults(composition, 'requiredStructuralResults', 'ruleIds', structuralRulesById, 'structural')
    checkRequiredResults(composition, 'requiredSemanticResults', 'ruleIds', semanticRulesById, 'semantic')
    checkRequiredResults(composition, 'requiredSemanticLexiconEntries', 'entryIds', lexiconById, 'lexicon')
    for (const requiredId of composition.requiredSemanticLexiconEntries?.entryIds || []) {
      const entry = lexiconById.get(requiredId)
      if (entry && (entry.sourceIds || []).some(entrySourceId => entrySourceId !== sourceId)) fail(`composition_lexicon_source:${composition.compositionId}:${requiredId}`)
    }

    for (const key of ['applicability', 'procedure', 'stopConditions', 'forbiddenExtensions']) if (!Array.isArray(composition[key]) || composition[key].length === 0) fail(`composition_${key}:${composition.compositionId}`)
    if (!isObject(composition.composition)
      || !Array.isArray(composition.composition.conditions)
      || composition.composition.conditions.length === 0
      || typeof composition.composition.priority !== 'string'
      || typeof composition.composition.combination !== 'string'
      || typeof composition.composition.transition !== 'string') fail(`composition_surface:${composition.compositionId}`)
    if (!isObject(composition.output)
      || composition.output.origin !== 'lineage_derived_source_local_semantic_composition_result'
      || composition.output.semanticExpansion !== false
      || composition.output.personalMeaning !== false
      || typeof composition.output.resultKey !== 'string'
      || !Array.isArray(composition.output.fields)) fail(`composition_output:${composition.compositionId}`)
    if (['adopted_composition', 'bounded_role_use_transition'].includes(composition.status) && composition.output.fields.length === 0) fail(`composition_adopted_output:${composition.compositionId}`)
    if (['unresolved', 'unsupported'].includes(composition.status) && composition.output.fields.length !== 0) fail(`composition_unresolved_output:${composition.compositionId}`)
    if (!isObject(composition.conflictState)
      || composition.conflictState.winnerSelected !== false
      || composition.conflictState.failClosed !== true) fail(`composition_conflict_state:${composition.compositionId}`)
    if (!isObject(composition.provenance)
      || composition.provenance.schema !== SAJU_SOURCE_LOCAL_SEMANTIC_COMPOSITION_SCHEMA
      || composition.provenance.version !== SAJU_SOURCE_LOCAL_SEMANTIC_COMPOSITION_VERSION
      || JSON.stringify(composition.provenance.sourceIds) !== JSON.stringify(composition.sourceIds)
      || JSON.stringify(composition.provenance.locatorIds) !== JSON.stringify(composition.locatorIds)
      || !isObject(composition.provenance.sourceByteSha256)) {
      fail(`composition_provenance:${composition.compositionId}`)
    } else {
      const expectedHashes = sourceByteSha256ForIds(composition.sourceIds)
      if (JSON.stringify(composition.provenance.sourceByteSha256) !== JSON.stringify(expectedHashes)) fail(`composition_provenance_hash:${composition.compositionId}`)
      for (const requiredSourceId of composition.sourceIds) if (!/^[a-f0-9]{64}$/.test(composition.provenance.sourceByteSha256[requiredSourceId] || '')) fail(`composition_provenance_source_hash:${composition.compositionId}:${requiredSourceId}`)
    }
    if (containsForbiddenStructuralTerm(JSON.stringify(composition.output))) fail(`composition_semantic_output:${composition.compositionId}`)
  }

  return unique(errors).sort()
}

export function checkSajuSourceLocalSemanticCompositionClosabilityReview(
  reviews = SAJU_SOURCE_LOCAL_SEMANTIC_COMPOSITION_CLOSABILITY_REVIEW,
) {
  const errors = []
  const fail = message => errors.push(message)
  if (!Array.isArray(reviews)) return ['closability_review_not_array']

  const sourceById = new Map(SAJU_LINEAGE_SOURCE_PROFILES.map(source => [source.sourceId, source]))
  const locatorsById = new Map(SAJU_LINEAGE_LOCATORS.map(locator => [locator.observationId, locator]))
  const compositionsById = new Map(SAJU_SOURCE_LOCAL_SEMANTIC_COMPOSITION_RULES.map(composition => [composition.compositionId, composition]))
  const expectedIds = SAJU_SOURCE_LOCAL_SEMANTIC_COMPOSITION_RULES
    .filter(composition => composition.status === 'unresolved')
    .map(composition => composition.compositionId)
  const reviewIds = []
  const reviewIdSet = new Set()

  for (const review of reviews) {
    if (!isObject(review)) {
      fail('closability_review_item_not_object')
      continue
    }
    const id = review.compositionId || 'missing'
    reviewIds.push(review.compositionId)
    if (!review.compositionId || reviewIdSet.has(review.compositionId)) fail(`closability_review_id_duplicate:${id}`)
    reviewIdSet.add(review.compositionId)
    if (review.schema !== SAJU_SOURCE_LOCAL_SEMANTIC_COMPOSITION_CLOSABILITY_REVIEW_SCHEMA || review.version !== SAJU_SOURCE_LOCAL_SEMANTIC_COMPOSITION_CLOSABILITY_REVIEW_VERSION) fail(`closability_review_schema:${id}`)
    if (!SAJU_SOURCE_LOCAL_SEMANTIC_COMPOSITION_CLOSABILITY_STATUSES.includes(review.closability)) fail(`closability_review_status:${id}`)
    const composition = compositionsById.get(review.compositionId)
    if (!composition || composition.status !== 'unresolved') fail(`closability_review_composition:${id}`)
    if (!Array.isArray(review.sourceIds) || review.sourceIds.length !== 1 || JSON.stringify(review.sourceIds) !== JSON.stringify(composition.sourceIds)) fail(`closability_review_sources:${id}`)
    if (!Array.isArray(review.locatorIds) || review.locatorIds.length === 0) fail(`closability_review_locators:${id}`)
    for (const sourceId of review.sourceIds || []) if (!sourceById.has(sourceId)) fail(`closability_review_source_unknown:${id}:${sourceId}`)
    for (const locatorId of review.locatorIds || []) {
      const locator = locatorsById.get(locatorId)
      if (!locator) fail(`closability_review_locator_unknown:${id}:${locatorId}`)
      else if (locator.sourceId !== review.sourceIds[0]) fail(`closability_review_locator_source:${id}:${locatorId}`)
    }
    if (!Array.isArray(review.currentBaseCoverage) || review.currentBaseCoverage.length === 0) fail(`closability_review_base_coverage:${id}`)
    if (typeof review.sourceObservation !== 'string' || review.sourceObservation.length === 0) fail(`closability_review_observation:${id}`)
    if (!Array.isArray(review.explicitPrerequisitesRemaining) || review.explicitPrerequisitesRemaining.length === 0) fail(`closability_review_prerequisites:${id}`)
    if (typeof review.closureGap !== 'string' || review.closureGap.length === 0) fail(`closability_review_gap:${id}`)
    if (review.endToEndClosed !== false || review.promotionDecision !== 'retain_unresolved_v0' || review.noPromotion !== true || review.noRecalculation !== true || review.noPersonalMeaning !== true || review.noCrossLineageMerge !== true) fail(`closability_review_boundary:${id}`)
    if (review.closability === 'near_candidate' && typeof review.requiredAdditionalCheck !== 'string') fail(`closability_review_near_check:${id}`)
    if (review.closability === 'v0_frozen' && review.requiredAdditionalCheck !== null) fail(`closability_review_frozen_check:${id}`)
    if (!isObject(review.provenance)
      || review.provenance.schema !== SAJU_SOURCE_LOCAL_SEMANTIC_COMPOSITION_CLOSABILITY_REVIEW_SCHEMA
      || review.provenance.version !== SAJU_SOURCE_LOCAL_SEMANTIC_COMPOSITION_CLOSABILITY_REVIEW_VERSION
      || JSON.stringify(review.provenance.sourceIds) !== JSON.stringify(review.sourceIds)
      || JSON.stringify(review.provenance.locatorIds) !== JSON.stringify(review.locatorIds)
      || !isObject(review.provenance.sourceByteSha256)) {
      fail(`closability_review_provenance:${id}`)
    } else {
      const expectedHashes = sourceByteSha256ForIds(review.sourceIds)
      if (JSON.stringify(review.provenance.sourceByteSha256) !== JSON.stringify(expectedHashes)) fail(`closability_review_provenance_hash:${id}`)
      for (const sourceId of review.sourceIds) if (!/^[a-f0-9]{64}$/.test(review.provenance.sourceByteSha256[sourceId] || '')) fail(`closability_review_provenance_source_hash:${id}:${sourceId}`)
    }
  }
  if (JSON.stringify(reviewIds) !== JSON.stringify(expectedIds)) fail('closability_review_ids')
  const expectedNear = expectedIds.filter(id => reviews.find(review => review.compositionId === id)?.closability === 'near_candidate')
  if (expectedNear.length === 0 || expectedNear.length > 2) fail('closability_review_near_candidate_count')
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
  if (contract.ruleId === 'rule.ditian.heaven-earth-human-frame.v0' && !hasCompleteDitianHeavenEarthHumanFrameInput(base)) conditions.push('complete_heaven_earth_human_frame_input_missing')
  if (contract.ruleId === 'rule.ditian.branch-category-inventory.v0' && !hasCompleteDitianBranchCategoryInput(base)) conditions.push('complete_ditian_branch_category_input_missing')
  if (contract.ruleId === 'rule.ditian.shape-example-inventory.v0' && !hasCompleteDitianShapeExampleInput(base)) conditions.push('complete_ditian_shape_example_input_missing')
  if (contract.ruleId === 'rule.ditian.fang-ju-example-inventory.v0' && !hasCompleteDitianFangJuExampleInput(base)) conditions.push('complete_ditian_fang_ju_input_missing')
  if (contract.ruleId === 'rule.qiongtong.five-phase-number-inventory.v0' && !hasCompleteQiongtongElementNumberInput(base)) conditions.push('complete_qiongtong_element_number_input_missing')
  if (contract.ruleId === 'rule.qiongtong.day-stem-section-frame.v0' && !hasCompleteQiongtongDayStemSectionInput(base)) conditions.push('complete_qiongtong_day_stem_section_input_missing')
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

function executeSanmingSourceSemanticRule(ruleItem, base, structuralResults) {
  const prerequisiteRuleId = 'rule.sanming.visible-stem-frame.v0'
  const structuralConflict = (structuralResults.categories.lineageConflicts || []).find(conflict => conflict.ruleIds?.includes(prerequisiteRuleId))
  if (structuralConflict) return sourceSemanticRuleResult(ruleItem, 'not_executable_by_contract', {}, 'the Sanming role-nomenclature result is blocked by a preserved structural lineage conflict', {
    structuralConflictId: structuralConflict.conflictId,
  })

  const structuralResult = structuralResults.categories.derivedStructuralResults.find(item => item.ruleId === prerequisiteRuleId)
  if (!structuralResult) {
    const structuralGap = structuralResults.categories.prerequisiteGaps.find(item => item.ruleId === prerequisiteRuleId)
    if (structuralGap) return sourceSemanticRuleResult(ruleItem, 'blocked_missing_base_fact', {}, 'the Sanming role-nomenclature result is blocked by its missing visible-stem frame', {
      missingStructuralPrerequisite: prerequisiteRuleId,
      structuralGapResultId: structuralGap.resultId,
    })
    return sourceSemanticRuleResult(ruleItem, 'not_executable_by_contract', {}, 'the Sanming role-nomenclature result has no executed visible-stem frame prerequisite')
  }

  const suppliedLabelCounts = readPath(base, FACT_REFS.visibleTenGods).value
  if (!isObject(suppliedLabelCounts) || Object.keys(suppliedLabelCounts).length === 0) return sourceSemanticRuleResult(ruleItem, 'blocked_missing_base_fact', {}, 'the supplied visible ten-god label inventory is missing or empty', {
    structuralPrerequisiteResultIds: [structuralResult.resultId],
  })
  const sourceRoleLabelInventory = Object.entries(suppliedLabelCounts).map(([suppliedLabel, count]) => ({
    suppliedLabel,
    count,
    sourceRoleLabel: SANMING_SOURCE_ROLE_BY_SUPPLIED_LABEL[suppliedLabel] || null,
  }))
  if (sourceRoleLabelInventory.some(item => item.sourceRoleLabel === null)) return sourceSemanticRuleResult(ruleItem, 'not_executable_by_contract', {}, 'the p.162 role-nomenclature contract does not close an unknown or same-element supplied label', {
    structuralPrerequisiteResultIds: [structuralResult.resultId],
    unsupportedSuppliedLabels: sourceRoleLabelInventory.filter(item => item.sourceRoleLabel === null).map(item => item.suppliedLabel),
  })

  return sourceSemanticRuleResult(ruleItem, 'executable_from_frozen_base', {
    sourceCondition: 'sanming-p162-supplied-visible-ten-god-labels-only',
    suppliedLabelCounts: { ...suppliedLabelCounts },
    sourceRoleLabelInventory,
    sourceSemanticScope: 'sanming-p162-role-nomenclature-without-family-or-outcome-expansion',
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
    ...(Array.isArray(ruleEvaluation.unsupportedSuppliedLabels) ? { unsupportedSuppliedLabels: [...ruleEvaluation.unsupportedSuppliedLabels] } : {}),
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

function checkSourceSemanticResultContractForRules(contracts, semanticRules) {
  const errors = []
  const fail = message => errors.push(message)
  if (!Array.isArray(contracts)) return ['contract_not_array']

  const sourceIds = new Set(SAJU_LINEAGE_SOURCE_PROFILES.map(source => source.sourceId))
  const locatorIds = new Set(SAJU_LINEAGE_LOCATORS.map(locator => locator.observationId))
  const semanticRuleIds = new Set(semanticRules.map(ruleItem => ruleItem.ruleId))
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
    const ruleItem = semanticRules.find(item => item.ruleId === contract.ruleId)
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

  for (const ruleItem of semanticRules) if (!coveredRuleIds.has(ruleItem.ruleId)) fail(`contract_missing_semantic_rule:${ruleItem.ruleId}`)
  return unique(errors).sort()
}

export function checkSajuLineageSourceSemanticResultContract(contracts = SAJU_ZIPING_SOURCE_SEMANTIC_CONTRACTS) {
  return checkSourceSemanticResultContractForRules(contracts, SAJU_ZIPING_SOURCE_SEMANTIC_RULES)
}

export function checkSajuSanmingSourceSemanticResultContract(contracts = SAJU_SANMING_SOURCE_SEMANTIC_CONTRACTS) {
  return checkSourceSemanticResultContractForRules(contracts, SAJU_SANMING_SOURCE_SEMANTIC_RULES)
}

function deriveSourceSemanticResults(base, structuralResults, contracts, semanticRules, executor) {
  const contractErrors = checkSourceSemanticResultContractForRules(contracts, semanticRules)
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

  const ruleEvaluationById = new Map(semanticRules.map(ruleItem => [ruleItem.ruleId, executor(ruleItem, base, structural)]))
  const contractsByRuleId = new Map(contracts.map(contract => [contract.ruleId, contract]))
  const categories = { ...emptyCategories }

  for (const ruleItem of semanticRules) {
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

export function deriveSajuLineageSourceSemanticResults(base, structuralResults = null, contracts = SAJU_ZIPING_SOURCE_SEMANTIC_CONTRACTS) {
  return deriveSourceSemanticResults(base, structuralResults, contracts, SAJU_ZIPING_SOURCE_SEMANTIC_RULES, executeZipingSourceSemanticRule)
}

export function deriveSajuSanmingSourceSemanticResults(base, structuralResults = null, contracts = SAJU_SANMING_SOURCE_SEMANTIC_CONTRACTS) {
  return deriveSourceSemanticResults(base, structuralResults, contracts, SAJU_SANMING_SOURCE_SEMANTIC_RULES, executeSanmingSourceSemanticRule)
}

const ZIPING_P10_MEETING_RELATION_NAMES = Object.freeze(['會', '会', '회', '삼會', '삼회', '삼合', '삼합'])
const ZIPING_P10_SOURCE_MEETING_BRANCHES = Object.freeze(['申', '子', '辰'])

function compositionSourceSemanticResults(semanticResults) {
  return [
    ...(semanticResults?.ziping?.categories?.derivedSourceBoundedSemanticResults || []),
    ...(semanticResults?.sanming?.categories?.derivedSourceBoundedSemanticResults || []),
  ]
}

function compositionSourceSemanticGaps(semanticResults) {
  return [
    ...(semanticResults?.ziping?.categories?.prerequisiteGaps || []),
    ...(semanticResults?.sanming?.categories?.prerequisiteGaps || []),
  ]
}

function compositionSourceSemanticNotApplicable(semanticResults) {
  return [
    ...(semanticResults?.ziping?.categories?.notApplicableRules || []),
    ...(semanticResults?.sanming?.categories?.notApplicableRules || []),
  ]
}

function compositionSourceSemanticConflicts(semanticResults) {
  return [
    ...(semanticResults?.ziping?.categories?.lineageConflicts || []),
    ...(semanticResults?.sanming?.categories?.lineageConflicts || []),
  ]
}

function compositionStructuralResultState(structuralResults, ruleId) {
  return {
    derived: structuralResults?.categories?.derivedStructuralResults?.find(result => result.ruleId === ruleId) || null,
    gap: structuralResults?.categories?.prerequisiteGaps?.find(result => result.ruleId === ruleId) || null,
    notApplicable: structuralResults?.categories?.notApplicableRules?.find(result => result.ruleId === ruleId) || null,
    unresolved: structuralResults?.categories?.unresolvedRules?.find(result => result.ruleId === ruleId) || null,
    conflict: (structuralResults?.categories?.lineageConflicts || []).find(conflict => (conflict.ruleIds || []).includes(ruleId)) || null,
  }
}

function compositionSourceResultState(semanticResults, ruleId) {
  return {
    derived: compositionSourceSemanticResults(semanticResults).find(result => result.ruleId === ruleId) || null,
    gap: compositionSourceSemanticGaps(semanticResults).find(result => result.ruleId === ruleId) || null,
    notApplicable: compositionSourceSemanticNotApplicable(semanticResults).find(result => result.ruleId === ruleId) || null,
    conflict: compositionSourceSemanticConflicts(semanticResults).find(conflict => (conflict.ruleIds || []).includes(ruleId)) || null,
  }
}

function compositionLexiconResultState(lexiconResults, entryId) {
  return {
    resolved: lexiconResults?.categories?.resolvedSemanticEntries?.find(entry => entry.entryId === entryId) || null,
    blocked: lexiconResults?.categories?.blockedEntries?.find(entry => entry.entryId === entryId) || null,
    notApplicable: lexiconResults?.categories?.notApplicableEntries?.find(entry => entry.entryId === entryId) || null,
    ambiguous: lexiconResults?.categories?.ambiguousEntries?.find(entry => entry.entryId === entryId) || null,
  }
}

function sameCompositionSource(result, composition) {
  return Boolean(result)
    && result.work === composition.work
    && result.lineage === composition.lineage
    && JSON.stringify(result.sourceIds || []) === JSON.stringify(composition.sourceIds)
}

function sameDeclaredRuleResult(result, ruleId) {
  const declared = [...SAJU_LINEAGE_RULES, ...SAJU_ZIPING_SOURCE_SEMANTIC_RULES, ...SAJU_SANMING_SOURCE_SEMANTIC_RULES]
    .find(ruleItem => ruleItem.ruleId === ruleId)
  return Boolean(declared)
    && sameCompositionSource(result, declared)
    && JSON.stringify(result.locatorIds || []) === JSON.stringify(declared.locatorIds)
}

function sameDeclaredLexiconResult(result, entryId) {
  const declared = SAJU_SOURCE_BOUNDED_SEMANTIC_LEXICON.find(entry => entry.entryId === entryId)
  return Boolean(declared)
    && sameCompositionSource(result, declared)
    && JSON.stringify(result.locatorIds || []) === JSON.stringify(declared.locatorIds)
}

function lexiconLinksResults(entry, resultIds) {
  const linkedResultIds = new Set((entry?.linkedResults || []).map(result => result.resultId).filter(Boolean))
  return resultIds.every(resultId => linkedResultIds.has(resultId))
}

function compositionConflictForRuleIds(structuralResults, semanticResults, ruleIds) {
  return [
    ...(structuralResults?.categories?.lineageConflicts || []),
    ...compositionSourceSemanticConflicts(semanticResults),
  ].find(conflict => (conflict.ruleIds || []).some(ruleId => ruleIds.includes(ruleId))) || null
}

function sourceBranchesForComposition(values) {
  return values.map(value => sourceBranchForInput(value)).filter(Boolean)
}

function isExactZipingP10Meeting(relation) {
  if (!isObject(relation) || !ZIPING_P10_MEETING_RELATION_NAMES.includes(relation.name)) return false
  if (!Array.isArray(relation.branches) || relation.branches.length !== ZIPING_P10_SOURCE_MEETING_BRANCHES.length) return false
  if (!Array.isArray(relation.positions) || relation.positions.length !== ZIPING_P10_SOURCE_MEETING_BRANCHES.length) return false
  const sourceBranches = sourceBranchesForComposition(relation.branches)
  const sourcePositions = unique(relation.positions)
  return sourceBranches.length === ZIPING_P10_SOURCE_MEETING_BRANCHES.length
    && unique(sourceBranches).sort().join('|') === [...ZIPING_P10_SOURCE_MEETING_BRANCHES].sort().join('|')
    && sourcePositions.length === relation.positions.length
    && sourcePositions.includes('month')
}

function compositionBaseFactRefs(structuralResults, semanticResults, lexiconResults, ruleIds, semanticRuleIds, entryIds) {
  const structural = structuralResults?.categories?.derivedStructuralResults || []
  const semantic = compositionSourceSemanticResults(semanticResults)
  const lexicon = lexiconResults?.categories?.resolvedSemanticEntries || []
  return unique([
    ...structural.filter(result => ruleIds.includes(result.ruleId)).flatMap(result => (result.commonBaseFacts || []).map(binding => binding.factRef)),
    ...semantic.filter(result => semanticRuleIds.includes(result.ruleId)).flatMap(result => (result.commonBaseFacts || []).map(binding => binding.factRef)),
    ...lexicon.filter(entry => entryIds.includes(entry.entryId)).flatMap(entry => entry.provenance?.chain?.baseFactRefs || []),
  ])
}

function compositionEvaluation(status, output = {}, reason = null, extra = {}) {
  return {
    executionStatus: status,
    output,
    reason,
    structuralResultIds: [],
    semanticResultIds: [],
    semanticLexiconResultIds: [],
    baseFactRefs: [],
    structuralState: null,
    semanticState: null,
    semanticLexiconState: null,
    ...extra,
  }
}

function executeZipingP10CompositionRule(composition, structuralResults, semanticResults, lexiconResults) {
  const structuralRuleIds = composition.requiredStructuralResults.ruleIds
  const exposureState = compositionStructuralResultState(structuralResults, 'rule.ziping.chen-exposure-inventory.v0')
  const relationState = compositionStructuralResultState(structuralResults, 'rule.ziping.branch-relation-inventory.v0')
  const structuralConflict = compositionConflictForRuleIds(structuralResults, null, structuralRuleIds)
  if (structuralConflict) return compositionEvaluation('ambiguous_composition', {}, 'p.10 composition is blocked by a preserved structural conflict', {
    conflictId: structuralConflict.conflictId,
    structuralState: 'conflict_preserved',
  })
  if (!exposureState.derived || !relationState.derived) {
    const missing = [exposureState, relationState]
    const gap = missing.find(state => state.gap)
    if (gap) return compositionEvaluation('blocked_missing_base_fact', {}, 'p.10 composition is blocked by a missing structural prerequisite', {
      structuralGapResultIds: missing.filter(state => state.gap).map(state => state.gap.resultId),
      structuralState: 'blocked_missing',
    })
    const notApplicable = missing.find(state => state.notApplicable)
    if (notApplicable) return compositionEvaluation('not_applicable_fixture', {}, 'p.10 composition is not applicable to this fixture', {
      structuralState: 'not_applicable',
    })
    return compositionEvaluation('not_executable_by_contract', {}, 'p.10 composition has no complete structural prerequisite', {
      structuralState: 'not_satisfied',
    })
  }
  if (!sameDeclaredRuleResult(exposureState.derived, 'rule.ziping.chen-exposure-inventory.v0') || !sameDeclaredRuleResult(relationState.derived, 'rule.ziping.branch-relation-inventory.v0')) return compositionEvaluation('ambiguous_composition', {}, 'p.10 structural prerequisites do not share the declared source, lineage, and locator contract', {
    sourceMismatch: true,
    structuralState: 'conflict_preserved',
  })

  const exposureOutput = exposureState.derived.output
  const relationOutput = relationState.derived.output
  if (!isObject(exposureOutput)
    || exposureOutput.sourceCondition?.dayMaster !== '甲'
    || exposureOutput.sourceCondition?.monthBranch !== '辰'
    || !Array.isArray(exposureOutput.namedExposureMatches)
    || !isObject(relationOutput)
    || !Array.isArray(relationOutput.relations)) return compositionEvaluation('ambiguous_composition', {}, 'p.10 structural prerequisite output is malformed or outside the exact 甲生辰月 window', {
    structuralState: 'conflict_preserved',
  })

  const matches = exposureOutput.namedExposureMatches
  const semanticState = compositionSourceResultState(semanticResults, 'rule.ziping.chen-exposure-use-role.v0')
  const lexiconState = compositionLexiconResultState(lexiconResults, 'lexicon.ziping.p10-role-labels.v0')
  const structuralResultIds = [exposureState.derived.resultId, relationState.derived.resultId]
  let semanticResultIds = []
  let semanticLexiconResultIds = []
  let semanticStateName = 'not_required_for_no_exposure'
  let semanticLexiconStateName = 'not_required_for_no_exposure'
  let matchedSourceRoleLabels = []
  if (matches.length > 0) {
    if (!semanticState.derived) {
      if (semanticState.gap) return compositionEvaluation('blocked_missing_base_fact', {}, 'p.10 exposure components are blocked by the missing source-role result', {
        structuralResultIds,
        structuralState: 'satisfied',
        semanticState: 'blocked_missing',
        semanticGapResultIds: [semanticState.gap.resultId],
      })
      if (semanticState.conflict) return compositionEvaluation('ambiguous_composition', {}, 'p.10 exposure components are blocked by a preserved semantic conflict', {
        structuralResultIds,
        structuralState: 'satisfied',
        semanticState: 'conflict_preserved',
        conflictId: semanticState.conflict.conflictId,
      })
      return compositionEvaluation('not_executable_by_contract', {}, 'p.10 exposure components have no executed source-role result', {
        structuralResultIds,
        structuralState: 'satisfied',
        semanticState: 'not_satisfied',
      })
    }
    if (!sameDeclaredRuleResult(semanticState.derived, 'rule.ziping.chen-exposure-use-role.v0')) return compositionEvaluation('ambiguous_composition', {}, 'p.10 source-role result does not share the declared source, lineage, and locator contract', {
      structuralResultIds,
      structuralState: 'satisfied',
      semanticState: 'conflict_preserved',
      sourceMismatch: true,
    })
    if (!isObject(semanticState.derived.output) || !Array.isArray(semanticState.derived.output.matchedSourceRoleLabels) || semanticState.derived.output.matchedSourceRoleLabels.length !== matches.length) return compositionEvaluation('ambiguous_composition', {}, 'p.10 source-role result does not match the supplied exposure inventory', {
      structuralResultIds,
      structuralState: 'satisfied',
      semanticState: 'conflict_preserved',
    })
    matchedSourceRoleLabels = semanticState.derived.output.matchedSourceRoleLabels
    if (matchedSourceRoleLabels.some(item => !isObject(item) || typeof item.position !== 'string' || typeof item.sourceStem !== 'string' || typeof item.sourceRole !== 'string' || item.sourceRole.length === 0)) return compositionEvaluation('ambiguous_composition', {}, 'p.10 source-role result contains an incomplete role label', {
      structuralResultIds,
      structuralState: 'satisfied',
      semanticState: 'conflict_preserved',
    })
    if (matchedSourceRoleLabels.some((item, index) => item.position !== matches[index].position || item.sourceStem !== matches[index].sourceStem || item.visibleStem !== matches[index].visibleStem)) return compositionEvaluation('ambiguous_composition', {}, 'p.10 source-role result does not align with the named exposure inventory', {
      structuralResultIds,
      structuralState: 'satisfied',
      semanticState: 'conflict_preserved',
    })
    semanticResultIds = [semanticState.derived.resultId]
    semanticStateName = 'satisfied'
    if (!lexiconState.resolved) {
      if (lexiconState.ambiguous) return compositionEvaluation('ambiguous_composition', {}, 'p.10 exposure lexicon link is ambiguous', {
        structuralResultIds,
        semanticResultIds,
        structuralState: 'satisfied',
        semanticState: 'satisfied',
        semanticLexiconState: 'conflict_preserved',
        conflictId: lexiconState.ambiguous.conflictState?.conflictId || 'conflict.semantic-lexicon-source-isolation',
      })
      return compositionEvaluation('blocked_missing_base_fact', {}, 'p.10 exposure lexicon link is not materialized', {
        structuralResultIds,
        semanticResultIds,
        structuralState: 'satisfied',
        semanticState: 'satisfied',
        semanticLexiconState: 'blocked_missing',
      })
    }
    if (!sameDeclaredLexiconResult(lexiconState.resolved, 'lexicon.ziping.p10-role-labels.v0') || !lexiconLinksResults(lexiconState.resolved, [exposureState.derived.resultId, ...semanticResultIds])) return compositionEvaluation('ambiguous_composition', {}, 'p.10 exposure lexicon result does not share the declared source chain', {
      structuralResultIds,
      semanticResultIds,
      structuralState: 'satisfied',
      semanticState: 'satisfied',
      semanticLexiconState: 'conflict_preserved',
      sourceMismatch: true,
    })
    semanticLexiconResultIds = (lexiconState.resolved.linkedResults || []).map(result => result.resultId).filter(Boolean)
    semanticLexiconStateName = 'satisfied'
  }

  const meetingCandidates = relationOutput.relations.filter(isExactZipingP10Meeting)
  if (meetingCandidates.length > 1) return compositionEvaluation('ambiguous_composition', {}, 'p.10 does not close duplicate 申子辰 meeting handling', {
    structuralResultIds,
    semanticResultIds,
    semanticLexiconResultIds,
    structuralState: 'satisfied',
    semanticState: semanticStateName,
    semanticLexiconState: semanticLexiconStateName,
  })
  const branchMeetingComponents = meetingCandidates.length === 1
    ? [{
      relationName: meetingCandidates[0].name,
      sourceBranches: [...ZIPING_P10_SOURCE_MEETING_BRANCHES],
      positions: [...meetingCandidates[0].positions],
      sourceUseComponent: '水印',
    }]
    : []
  const exposureComponents = matchedSourceRoleLabels.map(item => ({
    position: item.position,
    sourceStem: item.sourceStem,
    sourceRole: item.sourceRole,
  }))
  if (exposureComponents.length === 0 && branchMeetingComponents.length === 0) return compositionEvaluation('not_applicable_fixture', {}, 'p.10 exact 甲生辰月 window has neither a named exposure nor a 申子辰 meeting component', {
    structuralResultIds,
    structuralState: 'satisfied',
    semanticState: semanticStateName,
    semanticLexiconState: semanticLexiconStateName,
  })
  const compositionMode = exposureComponents.length > 0 && branchMeetingComponents.length > 0
    ? 'exposure_and_branch_meeting'
    : exposureComponents.length > 0
      ? exposureComponents.length > 1 ? 'exposure_only_multiple' : 'exposure_only_single'
      : 'branch_meeting_only'
  return compositionEvaluation('executable_from_frozen_base', {
    sourceCondition: { dayMaster: '甲', monthBranch: '辰' },
    compositionMode,
    exposureComponents,
    branchMeetingComponents,
    sourceCombinationStatement: '一透则一用；兼透则兼用；透而又会，则透与会并用',
    winnerSelected: false,
  }, null, {
    structuralResultIds,
    semanticResultIds,
    semanticLexiconResultIds,
    structuralState: 'satisfied',
    semanticState: semanticStateName,
    semanticLexiconState: semanticLexiconStateName,
    baseFactRefs: compositionBaseFactRefs(structuralResults, semanticResults, lexiconResults, structuralRuleIds, composition.requiredSemanticResults.ruleIds, composition.requiredSemanticLexiconEntries.entryIds),
  })
}

function executeZipingP7RoleUseTransition(composition, structuralResults, semanticResults, lexiconResults) {
  const structuralRuleId = 'rule.ziping.yin-month-exposure-contrast.v0'
  const semanticRuleId = 'rule.ziping.yin-month-exposure-change.v0'
  const structuralState = compositionStructuralResultState(structuralResults, structuralRuleId)
  const semanticState = compositionSourceResultState(semanticResults, semanticRuleId)
  const lexiconState = compositionLexiconResultState(lexiconResults, 'lexicon.ziping.p7-selection-clause.v0')
  const conflict = compositionConflictForRuleIds(structuralResults, semanticResults, [structuralRuleId, semanticRuleId])
  if (conflict) return compositionEvaluation('ambiguous_composition', {}, 'p.7 transition is blocked by a preserved conflict', {
    conflictId: conflict.conflictId,
    structuralState: 'conflict_preserved',
    semanticState: 'conflict_preserved',
  })
  if (!structuralState.derived) {
    if (structuralState.gap) return compositionEvaluation('blocked_missing_base_fact', {}, 'p.7 transition is blocked by its missing structural prerequisite', { structuralState: 'blocked_missing' })
    if (structuralState.notApplicable) return compositionEvaluation('not_applicable_fixture', {}, 'fixture does not satisfy the exact p.7 contrast', { structuralState: 'not_applicable' })
    return compositionEvaluation('not_executable_by_contract', {}, 'p.7 transition has no executed structural prerequisite', { structuralState: 'not_satisfied' })
  }
  if (!sameDeclaredRuleResult(structuralState.derived, structuralRuleId)) return compositionEvaluation('ambiguous_composition', {}, 'p.7 structural result does not share the declared source, lineage, and locator contract', { sourceMismatch: true, structuralState: 'conflict_preserved' })
  if (!semanticState.derived) {
    if (semanticState.gap) return compositionEvaluation('blocked_missing_base_fact', {}, 'p.7 transition is blocked by its missing source semantic result', {
      structuralResultIds: [structuralState.derived.resultId],
      structuralState: 'satisfied',
      semanticState: 'blocked_missing',
    })
    return compositionEvaluation('not_executable_by_contract', {}, 'p.7 transition has no executed source semantic result', {
      structuralResultIds: [structuralState.derived.resultId],
      structuralState: 'satisfied',
      semanticState: 'not_satisfied',
    })
  }
  if (!sameDeclaredRuleResult(semanticState.derived, semanticRuleId)) return compositionEvaluation('ambiguous_composition', {}, 'p.7 semantic result does not share the declared source, lineage, and locator contract', {
    structuralResultIds: [structuralState.derived.resultId],
    structuralState: 'satisfied',
    semanticState: 'conflict_preserved',
    sourceMismatch: true,
  })
  if (!lexiconState.resolved) {
    if (lexiconState.ambiguous) return compositionEvaluation('ambiguous_composition', {}, 'p.7 lexicon link is ambiguous', {
      structuralResultIds: [structuralState.derived.resultId],
      semanticResultIds: [semanticState.derived.resultId],
      structuralState: 'satisfied',
      semanticState: 'satisfied',
      semanticLexiconState: 'conflict_preserved',
      conflictId: lexiconState.ambiguous.conflictState?.conflictId || 'conflict.semantic-lexicon-source-isolation',
    })
    return compositionEvaluation('blocked_missing_base_fact', {}, 'p.7 lexicon link is not materialized', {
      structuralResultIds: [structuralState.derived.resultId],
      semanticResultIds: [semanticState.derived.resultId],
      structuralState: 'satisfied',
      semanticState: 'satisfied',
      semanticLexiconState: 'blocked_missing',
    })
  }
  if (!sameDeclaredLexiconResult(lexiconState.resolved, 'lexicon.ziping.p7-selection-clause.v0') || !lexiconLinksResults(lexiconState.resolved, [structuralState.derived.resultId, semanticState.derived.resultId])) return compositionEvaluation('ambiguous_composition', {}, 'p.7 lexicon result does not share the declared source chain', {
    structuralResultIds: [structuralState.derived.resultId],
    semanticResultIds: [semanticState.derived.resultId],
    structuralState: 'satisfied',
    semanticState: 'satisfied',
    semanticLexiconState: 'conflict_preserved',
    sourceMismatch: true,
  })
  const output = semanticState.derived.output
  if (!isObject(output) || !isObject(output.sourceCondition) || !Array.isArray(output.exposedPositions) || output.sourceSelectionStatement !== '同知得以作主') return compositionEvaluation('ambiguous_composition', {}, 'p.7 semantic result is outside the exact source clause contract', {
    structuralResultIds: [structuralState.derived.resultId],
    semanticResultIds: [semanticState.derived.resultId],
    structuralState: 'satisfied',
    semanticState: 'conflict_preserved',
  })
  return compositionEvaluation('executable_from_frozen_base', {
    sourceCondition: { ...output.sourceCondition },
    exposedPositions: output.exposedPositions.map(item => ({ ...item })),
    sourceSelectionStatement: output.sourceSelectionStatement,
    winnerSelected: false,
  }, null, {
    structuralResultIds: [structuralState.derived.resultId],
    semanticResultIds: [semanticState.derived.resultId],
    semanticLexiconResultIds: (lexiconState.resolved.linkedResults || []).map(result => result.resultId).filter(Boolean),
    structuralState: 'satisfied',
    semanticState: 'satisfied',
    semanticLexiconState: 'satisfied',
    baseFactRefs: compositionBaseFactRefs(structuralResults, semanticResults, lexiconResults, composition.requiredStructuralResults.ruleIds, composition.requiredSemanticResults.ruleIds, composition.requiredSemanticLexiconEntries.entryIds),
  })
}

function executeSourceLocalSemanticComposition(composition, structuralResults, semanticResults, lexiconResults) {
  if (composition.status === 'unsupported') return compositionEvaluation('unsupported', {}, 'composition surface is outside the supported bounded grammar')
  if (composition.status === 'unresolved') return compositionEvaluation('not_executable_by_contract', {}, 'source-local composition priority, combination, or transition is unresolved')
  if (composition.compositionId === 'composition.ziping.p10-chen-use-components.v0') return executeZipingP10CompositionRule(composition, structuralResults, semanticResults, lexiconResults)
  if (composition.compositionId === 'transition.ziping.p7-yin-month-use-change.v0') return executeZipingP7RoleUseTransition(composition, structuralResults, semanticResults, lexiconResults)
  return compositionEvaluation('not_executable_by_contract', {}, 'composition is not registered for execution')
}

function compositionRequirementState(requirement, resultIds, fallback = 'not_required') {
  if (!requirement?.ruleIds && !requirement?.entryIds) return fallback
  const requiredIds = requirement.ruleIds || requirement.entryIds || []
  if (requiredIds.length === 0) return fallback
  return resultIds.length === requiredIds.length ? 'satisfied' : 'not_satisfied'
}

function sourceLocalSemanticCompositionDescriptor(composition, evaluation, classification) {
  const structuralResultIds = [...(evaluation.structuralResultIds || [])]
  const semanticResultIds = [...(evaluation.semanticResultIds || [])]
  const semanticLexiconResultIds = [...(evaluation.semanticLexiconResultIds || [])]
  const structuralState = evaluation.structuralState || compositionRequirementState(composition.requiredStructuralResults, structuralResultIds)
  const semanticState = evaluation.semanticState || compositionRequirementState(composition.requiredSemanticResults, semanticResultIds)
  const semanticLexiconState = evaluation.semanticLexiconState || compositionRequirementState(composition.requiredSemanticLexiconEntries, semanticLexiconResultIds, 'not_required')
  const conflictState = evaluation.conflictId || evaluation.sourceMismatch
    ? {
      status: 'preserved_tension_fail_closed',
      conflictId: evaluation.conflictId || null,
      sourceMismatch: evaluation.sourceMismatch === true,
      policy: composition.conflictState.policy,
      winnerSelected: false,
      failClosed: true,
    }
    : {
      status: 'not_observed',
      conflictId: null,
      sourceMismatch: false,
      policy: composition.conflictState.policy,
      winnerSelected: false,
      failClosed: true,
    }
  const sourceProvenance = Object.fromEntries(composition.sourceIds.map(sourceId => [
    sourceId,
    SAJU_LINEAGE_SOURCE_PROFILES.find(source => source.sourceId === sourceId)?.byteSha256 || null,
  ]))
  const chain = {
    structuralRuleIds: [...composition.requiredStructuralResults.ruleIds],
    structuralResultIds,
    semanticRuleIds: [...composition.requiredSemanticResults.ruleIds],
    semanticResultIds,
    semanticLexiconEntryIds: [...composition.requiredSemanticLexiconEntries.entryIds],
    semanticLexiconResultIds,
    baseFactRefs: [...(evaluation.baseFactRefs || [])],
  }
  const materialized = classification === 'derived_source_local_semantic_composition_result' || classification === 'derived_bounded_role_use_transition_result'
  return {
    resultId: `composition-result.${composition.compositionId}`,
    classification,
    compositionId: composition.compositionId,
    status: composition.status,
    work: composition.work,
    lineage: composition.lineage,
    sourceIds: [...composition.sourceIds],
    locatorIds: [...composition.locatorIds],
    sourceProvenance,
    provenance: {
      schema: SAJU_SOURCE_LOCAL_SEMANTIC_COMPOSITION_SCHEMA,
      version: SAJU_SOURCE_LOCAL_SEMANTIC_COMPOSITION_VERSION,
      compositionId: composition.compositionId,
      sourceIds: [...composition.sourceIds],
      lineage: composition.lineage,
      locatorIds: [...composition.locatorIds],
      sourceByteSha256: { ...sourceProvenance },
      chain,
    },
    commonBaseFacts: chain.baseFactRefs.map(factRef => ({ factRef, origin: 'composition_prerequisite_chain' })),
    requiredStructuralResults: {
      ...composition.requiredStructuralResults,
      ruleIds: [...composition.requiredStructuralResults.ruleIds],
      fields: [...composition.requiredStructuralResults.fields],
      resultIds: structuralResultIds,
      state: structuralState,
    },
    requiredSemanticResults: {
      ...composition.requiredSemanticResults,
      ruleIds: [...composition.requiredSemanticResults.ruleIds],
      fields: [...composition.requiredSemanticResults.fields],
      resultIds: semanticResultIds,
      state: semanticState,
    },
    requiredSemanticLexiconEntries: {
      ...composition.requiredSemanticLexiconEntries,
      entryIds: [...composition.requiredSemanticLexiconEntries.entryIds],
      fields: [...composition.requiredSemanticLexiconEntries.fields],
      resultIds: semanticLexiconResultIds,
      state: semanticLexiconState,
    },
    applicability: [...composition.applicability],
    procedure: [...composition.procedure],
    composition: {
      ...composition.composition,
      conditions: [...composition.composition.conditions],
    },
    outputContract: {
      ...composition.output,
      fields: [...composition.output.fields],
    },
    semanticRoleResult: {
      resultKey: composition.output.resultKey,
      fields: [...composition.output.fields],
      origin: composition.output.origin,
      materialized,
    },
    conflictState,
    stopConditions: [...composition.stopConditions],
    forbiddenExtensions: [...composition.forbiddenExtensions],
    executionStatus: evaluation.executionStatus,
    ruleStatus: composition.status,
    output: materialized ? evaluation.output : null,
    reason: evaluation.reason,
    structuralResultIds,
    semanticResultIds,
    semanticLexiconResultIds,
    deterministic: true,
    noRecalculation: true,
    noPersonalMeaning: true,
    noCrossLineageMerge: true,
    interpretationHypothesis: false,
    winnerSelected: false,
    semanticExpansion: false,
  }
}

export function deriveSajuSourceLocalSemanticCompositions(
  base,
  structuralResults = null,
  semanticResults = null,
  lexiconResults = null,
  compositions = SAJU_SOURCE_LOCAL_SEMANTIC_COMPOSITION_RULES,
) {
  const compositionErrors = checkSajuSourceLocalSemanticComposition(compositions)
  const baseValidation = validateDeterministicBaseForInterpretation(base)
  const structural = structuralResults || deriveSajuLineageStructuralResults(base)
  const resolvedSemanticResults = semanticResults || {
    ziping: deriveSajuLineageSourceSemanticResults(base, structural),
    sanming: deriveSajuSanmingSourceSemanticResults(base, structural),
  }
  const resolvedLexiconResults = lexiconResults || deriveSajuSourceBoundedSemanticLexiconEntries(base, structural, resolvedSemanticResults)
  const emptyCategories = {
    adoptedCompositions: [],
    boundedRoleUseTransitions: [],
    unresolvedCompositions: [],
    unsupportedCompositions: [],
    blockedCompositions: [],
    notApplicableCompositions: [],
    ambiguousCompositions: [],
    derivedCompositionResults: [],
    lineageConflicts: [],
  }
  const semanticValidation = {
    ziping: resolvedSemanticResults.ziping?.contractValidation || null,
    sanming: resolvedSemanticResults.sanming?.contractValidation || null,
  }
  const prerequisitesValid = compositionErrors.length === 0
    && baseValidation.valid
    && structural.contractValidation?.valid === true
    && Object.values(semanticValidation).every(validation => validation?.valid === true)
    && resolvedLexiconResults.lexiconValidation?.valid === true
  if (!prerequisitesValid) return {
    schemaVersion: SAJU_SOURCE_LOCAL_SEMANTIC_COMPOSITION_SCHEMA,
    version: SAJU_SOURCE_LOCAL_SEMANTIC_COMPOSITION_VERSION,
    compositionValidation: { valid: compositionErrors.length === 0, errors: compositionErrors },
    baseValidation,
    structuralResultContractValidation: structural.contractValidation,
    semanticResultContractValidation: semanticValidation,
    lexiconValidation: resolvedLexiconResults.lexiconValidation || null,
    categories: emptyCategories,
    boundary: {
      noRecalculation: true,
      baseMutation: false,
      noPersonalMeaning: true,
      interpretationHypothesis: false,
      crossLineageMerge: false,
      winnerSelection: false,
      conflictsPreserved: true,
    },
  }

  const categories = { ...emptyCategories }
  for (const composition of compositions) {
    const evaluation = executeSourceLocalSemanticComposition(composition, structural, resolvedSemanticResults, resolvedLexiconResults)
    const catalogClassification = composition.status === 'adopted_composition'
      ? 'adopted_composition'
      : composition.status === 'bounded_role_use_transition'
        ? 'bounded_role_use_transition'
        : composition.status === 'unsupported'
          ? 'unsupported_composition'
          : 'unresolved_composition'
    const catalogDescriptor = sourceLocalSemanticCompositionDescriptor(composition, evaluation, catalogClassification)
    if (composition.status === 'adopted_composition') categories.adoptedCompositions.push(catalogDescriptor)
    if (composition.status === 'bounded_role_use_transition') categories.boundedRoleUseTransitions.push(catalogDescriptor)
    if (composition.status === 'unresolved') categories.unresolvedCompositions.push(catalogDescriptor)
    if (composition.status === 'unsupported') categories.unsupportedCompositions.push(catalogDescriptor)

    if (evaluation.executionStatus === 'executable_from_frozen_base') {
      const materializedClassification = composition.status === 'bounded_role_use_transition'
        ? 'derived_bounded_role_use_transition_result'
        : 'derived_source_local_semantic_composition_result'
      categories.derivedCompositionResults.push(sourceLocalSemanticCompositionDescriptor(composition, evaluation, materializedClassification))
    } else if (evaluation.executionStatus === 'blocked_missing_base_fact') {
      categories.blockedCompositions.push(sourceLocalSemanticCompositionDescriptor(composition, evaluation, 'blocked_composition'))
    } else if (evaluation.executionStatus === 'not_applicable_fixture') {
      categories.notApplicableCompositions.push(sourceLocalSemanticCompositionDescriptor(composition, evaluation, 'not_applicable_composition'))
    } else if (evaluation.executionStatus === 'ambiguous_composition' || (evaluation.executionStatus === 'not_executable_by_contract' && ['adopted_composition', 'bounded_role_use_transition'].includes(composition.status))) {
      const descriptor = sourceLocalSemanticCompositionDescriptor(composition, evaluation, 'ambiguous_composition')
      categories.ambiguousCompositions.push(descriptor)
      if (evaluation.conflictId || evaluation.sourceMismatch) categories.lineageConflicts.push({
        conflictId: evaluation.conflictId || 'conflict.source-local-composition-lineage-isolation',
        classification: 'lineage_conflict',
        compositionId: composition.compositionId,
        ruleIds: [...composition.requiredStructuralResults.ruleIds, ...composition.requiredSemanticResults.ruleIds],
        sourceIds: [...composition.sourceIds],
        status: 'preserved_tension_fail_closed',
        reason: evaluation.reason || 'source-local composition was not materialized because source/lineage conflict was preserved',
        deterministic: true,
        noPersonalMeaning: true,
      })
    }
  }

  return {
    schemaVersion: SAJU_SOURCE_LOCAL_SEMANTIC_COMPOSITION_SCHEMA,
    version: SAJU_SOURCE_LOCAL_SEMANTIC_COMPOSITION_VERSION,
    compositionValidation: { valid: true, errors: [] },
    baseValidation,
    structuralResultContractValidation: structural.contractValidation,
    semanticResultContractValidation: semanticValidation,
    lexiconValidation: resolvedLexiconResults.lexiconValidation,
    categories,
    commonCompositionCandidates: [],
    readiness: SAJU_SOURCE_LOCAL_SEMANTIC_COMPOSITION_READINESS,
    boundary: {
      noRecalculation: true,
      baseMutation: false,
      noPersonalMeaning: true,
      interpretationHypothesis: false,
      crossLineageMerge: false,
      winnerSelection: false,
      conflictsPreserved: true,
    },
  }
}

function semanticLexiconResultDescriptor(entry, lookupStatus, extra = {}) {
  return {
    entryId: entry.entryId,
    status: entry.status,
    lookupStatus,
    work: entry.work,
    lineage: entry.lineage,
    sourceIds: [...entry.sourceIds],
    locatorIds: [...entry.locatorIds],
    sourceTerm: entry.sourceTerm,
    target: { ...entry.target },
    directMeaningRange: {
      ...entry.directMeaningRange,
      supportedClaims: [...entry.directMeaningRange.supportedClaims],
    },
    applicability: [...entry.applicability],
    exceptions: [...entry.exceptions],
    forbiddenExtensions: [...entry.forbiddenExtensions],
    requiredStructuralResult: {
      ...entry.requiredStructuralResult,
      ruleIds: [...entry.requiredStructuralResult.ruleIds],
      fields: [...entry.requiredStructuralResult.fields],
    },
    linkedStructuralRuleIds: [...entry.linkedStructuralRuleIds],
    linkedSemanticRuleIds: [...entry.linkedSemanticRuleIds],
    provenance: {
      ...entry.provenance,
      sourceIds: [...entry.provenance.sourceIds],
      locatorIds: [...entry.provenance.locatorIds],
      sourceByteSha256: { ...entry.provenance.sourceByteSha256 },
    },
    deterministic: true,
    noPersonalMeaning: true,
    noCrossLineageMerge: true,
    interpretationHypothesis: false,
    ...extra,
  }
}

function sourceResultCollection(semanticResults) {
  return [
    ...(semanticResults?.ziping?.categories?.derivedSourceBoundedSemanticResults || []),
    ...(semanticResults?.sanming?.categories?.derivedSourceBoundedSemanticResults || []),
  ]
}

function sourceResultGapCollection(semanticResults) {
  return [
    ...(semanticResults?.ziping?.categories?.prerequisiteGaps || []),
    ...(semanticResults?.sanming?.categories?.prerequisiteGaps || []),
  ]
}

function sourceResultNotApplicableCollection(semanticResults) {
  return [
    ...(semanticResults?.ziping?.categories?.notApplicableRules || []),
    ...(semanticResults?.sanming?.categories?.notApplicableRules || []),
  ]
}

function sourceSemanticLexiconChain(entry, structuralResults, semanticResults) {
  const derivedStructural = structuralResults.categories.derivedStructuralResults || []
  const structuralGaps = structuralResults.categories.prerequisiteGaps || []
  const structuralNotApplicable = structuralResults.categories.notApplicableRules || []
  const structuralConflicts = structuralResults.categories.lineageConflicts || []
  const derivedSemantic = sourceResultCollection(semanticResults)
  const semanticGaps = sourceResultGapCollection(semanticResults)
  const semanticNotApplicable = sourceResultNotApplicableCollection(semanticResults)
  const semanticConflicts = [
    ...(semanticResults?.ziping?.categories?.lineageConflicts || []),
    ...(semanticResults?.sanming?.categories?.lineageConflicts || []),
  ]
  const structuralLinks = entry.linkedStructuralRuleIds.map(ruleId => ({
    ruleId,
    derived: derivedStructural.find(result => result.ruleId === ruleId) || null,
    gap: structuralGaps.find(result => result.ruleId === ruleId) || null,
    notApplicable: structuralNotApplicable.find(result => result.ruleId === ruleId) || null,
  }))
  const semanticLinks = entry.linkedSemanticRuleIds.map(ruleId => ({
    ruleId,
    derived: derivedSemantic.find(result => result.ruleId === ruleId) || null,
    gap: semanticGaps.find(result => result.ruleId === ruleId) || null,
    notApplicable: semanticNotApplicable.find(result => result.ruleId === ruleId) || null,
  }))
  const allLinks = [...structuralLinks, ...semanticLinks]
  const linkedResults = allLinks.flatMap(link => link.derived ? [link.derived] : [])
  const linkedConflicts = [...structuralConflicts, ...semanticConflicts].filter(conflict => (
    (conflict.ruleIds || []).some(ruleId => entry.linkedStructuralRuleIds.includes(ruleId) || entry.linkedSemanticRuleIds.includes(ruleId))
  ))
  const sourceMismatch = linkedResults.some(result => (
    result.lineage !== entry.lineage
      || (result.sourceIds || []).some(sourceId => !entry.sourceIds.includes(sourceId))
  ))
  const missingLinks = allLinks.filter(link => !link.derived && !link.notApplicable && !link.gap)
  const blockedLinks = allLinks.filter(link => link.gap)
  const notApplicableLinks = allLinks.filter(link => link.notApplicable)

  return {
    structuralLinks,
    semanticLinks,
    linkedResults,
    linkedConflicts,
    sourceMismatch,
    missingLinks,
    blockedLinks,
    notApplicableLinks,
  }
}

/**
 * Resolve only the source terms whose named lineage rule/result chain is
 * already present.  Catalog entries remain source vocabulary; they are never
 * converted into a person-level interpretation.
 */
export function deriveSajuSourceBoundedSemanticLexiconEntries(
  base,
  structuralResults = null,
  semanticResults = null,
  entries = SAJU_SOURCE_BOUNDED_SEMANTIC_LEXICON,
) {
  const lexiconErrors = checkSajuSourceBoundedSemanticLexicon(entries)
  const baseValidation = validateDeterministicBaseForInterpretation(base)
  const structural = structuralResults || deriveSajuLineageStructuralResults(base)
  const resolvedSemanticResults = semanticResults || {
    ziping: deriveSajuLineageSourceSemanticResults(base, structural),
    sanming: deriveSajuSanmingSourceSemanticResults(base, structural),
  }
  const emptyCategories = {
    catalogSemanticEntries: [],
    resolvedSemanticEntries: [],
    contextBoundEntries: [],
    unresolvedEntries: [],
    unsupportedEntries: [],
    blockedEntries: [],
    notApplicableEntries: [],
    ambiguousEntries: [],
    lineageConflicts: [],
    commonSemanticCandidates: [],
  }
  if (lexiconErrors.length > 0 || !baseValidation.valid || !structural.contractValidation?.valid) {
    return {
      schemaVersion: SAJU_SOURCE_BOUNDED_SEMANTIC_LEXICON_SCHEMA,
      version: SAJU_SOURCE_BOUNDED_SEMANTIC_LEXICON_VERSION,
      lexiconValidation: { valid: lexiconErrors.length === 0, errors: lexiconErrors },
      baseValidation,
      structuralResultContractValidation: structural.contractValidation,
      categories: emptyCategories,
      boundary: {
        noRecalculation: true,
        baseMutation: false,
        noPersonalMeaning: true,
        interpretationHypothesis: false,
        crossLineageMerge: false,
        conflictsPreserved: true,
      },
    }
  }

  const categories = { ...emptyCategories }
  for (const entry of entries) {
    if (entry.status === 'context_bound_entry') {
      categories.contextBoundEntries.push(semanticLexiconResultDescriptor(entry, 'not_materialized'))
      continue
    }
    if (entry.status === 'unresolved') {
      categories.unresolvedEntries.push(semanticLexiconResultDescriptor(entry, 'unresolved'))
      continue
    }
    if (entry.status === 'unsupported') {
      categories.unsupportedEntries.push(semanticLexiconResultDescriptor(entry, 'unsupported'))
      continue
    }

    if (entry.materializationMode === 'catalog_only_source_vocabulary') {
      categories.catalogSemanticEntries.push(semanticLexiconResultDescriptor(entry, 'catalog_only'))
      continue
    }

    const chain = sourceSemanticLexiconChain(entry, structural, resolvedSemanticResults)
    const resultIds = chain.linkedResults.map(result => result.resultId)
    const structuralResultIds = chain.structuralLinks.flatMap(link => link.derived ? [link.derived.resultId] : [])
    const semanticResultIds = chain.semanticLinks.flatMap(link => link.derived ? [link.derived.resultId] : [])
    const chainProvenance = {
      structuralRuleIds: [...entry.linkedStructuralRuleIds],
      structuralResultIds,
      semanticRuleIds: [...entry.linkedSemanticRuleIds],
      semanticResultIds,
      resultIds,
      baseFactRefs: [
        ...chain.linkedResults.flatMap(result => (result.commonBaseFacts || []).map(binding => binding.factRef)),
      ],
    }

    if (chain.linkedConflicts.length > 0 || chain.sourceMismatch) {
      const conflictId = chain.linkedConflicts[0]?.conflictId || null
      const descriptor = semanticLexiconResultDescriptor(entry, 'conflict_preserved', {
        conflictState: {
          status: 'preserved_tension_fail_closed',
          conflictId,
          winnerSelected: false,
          sourceMismatch: chain.sourceMismatch,
        },
        provenance: {
          ...semanticLexiconResultDescriptor(entry, 'conflict_preserved').provenance,
          chain: chainProvenance,
        },
      })
      categories.ambiguousEntries.push(descriptor)
      categories.lineageConflicts.push({
        conflictId: conflictId || 'conflict.semantic-lexicon-source-isolation',
        classification: 'lineage_conflict',
        entryId: entry.entryId,
        ruleIds: [...entry.linkedStructuralRuleIds, ...entry.linkedSemanticRuleIds],
        sourceIds: [...entry.sourceIds],
        status: 'preserved_tension_fail_closed',
        reason: chain.sourceMismatch
          ? 'lexicon entry and linked result do not share one source/lineage'
          : 'linked structural or semantic conflict was preserved; no lexicon winner was selected',
        deterministic: true,
        noPersonalMeaning: true,
      })
      continue
    }
    if (chain.blockedLinks.length > 0 || chain.missingLinks.length > 0) {
      const gap = chain.blockedLinks[0]?.gap || null
      categories.blockedEntries.push(semanticLexiconResultDescriptor(entry, 'blocked_missing_result', {
        blockedByRuleIds: [...chain.blockedLinks.map(link => link.ruleId), ...chain.missingLinks.map(link => link.ruleId)],
        structuralGapResultIds: chain.blockedLinks.map(link => link.gap?.resultId).filter(Boolean),
        provenance: {
          ...semanticLexiconResultDescriptor(entry, 'blocked_missing_result').provenance,
          chain: chainProvenance,
        },
        reason: gap?.reason || 'named lineage result is not available; lexicon entry is not materialized',
      }))
      continue
    }
    if (chain.notApplicableLinks.length > 0) {
      categories.notApplicableEntries.push(semanticLexiconResultDescriptor(entry, 'not_applicable_fixture', {
        notApplicableRuleIds: chain.notApplicableLinks.map(link => link.ruleId),
        provenance: {
          ...semanticLexiconResultDescriptor(entry, 'not_applicable_fixture').provenance,
          chain: chainProvenance,
        },
      }))
      continue
    }

    const lineages = unique(chain.linkedResults.map(result => result.lineage))
    if (lineages.length !== 1 || lineages[0] !== entry.lineage || chain.linkedResults.length !== entry.linkedStructuralRuleIds.length + entry.linkedSemanticRuleIds.length) {
      categories.ambiguousEntries.push(semanticLexiconResultDescriptor(entry, 'ambiguous_source_chain', {
        conflictState: {
          status: 'preserved_tension_fail_closed',
          conflictId: 'conflict.semantic-lexicon-source-isolation',
          winnerSelected: false,
          lineages,
        },
        provenance: {
          ...semanticLexiconResultDescriptor(entry, 'ambiguous_source_chain').provenance,
          chain: chainProvenance,
        },
      }))
      continue
    }

    categories.resolvedSemanticEntries.push(semanticLexiconResultDescriptor(entry, 'resolved_from_lineage_result', {
      linkedResults: chain.linkedResults.map(result => ({
        ruleId: result.ruleId,
        resultId: result.resultId,
        sourceIds: [...result.sourceIds],
        lineage: result.lineage,
      })),
      provenance: {
        ...semanticLexiconResultDescriptor(entry, 'resolved_from_lineage_result').provenance,
        chain: chainProvenance,
      },
    }))
  }

  return {
    schemaVersion: SAJU_SOURCE_BOUNDED_SEMANTIC_LEXICON_SCHEMA,
    version: SAJU_SOURCE_BOUNDED_SEMANTIC_LEXICON_VERSION,
    lexiconValidation: { valid: true, errors: [] },
    baseValidation,
    structuralResultContractValidation: structural.contractValidation,
    semanticResultContractValidation: {
      ziping: resolvedSemanticResults.ziping?.contractValidation || null,
      sanming: resolvedSemanticResults.sanming?.contractValidation || null,
    },
    categories,
    boundary: {
      noRecalculation: true,
      baseMutation: false,
      noPersonalMeaning: true,
      interpretationHypothesis: false,
      crossLineageMerge: false,
      conflictsPreserved: true,
    },
  }
}

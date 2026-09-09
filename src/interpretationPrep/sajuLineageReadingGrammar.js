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
  loc('saju-source-yuanhai-ziping', 'yuanhai-p4-hidden-stems-and-ten-god-labels', 4, '4', '論天地干支暗藏總訣', 'hidden-stem/ten-god labels and adjacent seasonal-month material', '暗藏總訣 · 偏官/印綬/偏印 labels'),
  loc('saju-source-yuanhai-ziping', 'yuanhai-p6-day-as-host', 6, '6', '論日為主', 'day-as-host frame and year/month/day/hour role labels', '日为主 · 年为根 · 月为提纲 · 时为辅佐'),
  loc('saju-source-yuanhai-ziping', 'yuanhai-p7-month-command', 7, '7', '論月令', 'month-command context after the day-as-host statement', '以日为主 · 月为提纲'),
  loc('saju-source-yuanhai-ziping', 'page.local.yuanhai.p9-dayun-section', 9, '9', '論大運', 'bounded 大運 section locator; not a complete exact-timing rule', '論大運'),
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
    if (item.status === 'adopted_lineage_rule' && !['bounded_complete_structural_frame', 'bounded_complete_procedure_frame', 'bounded_label_inventory_only', 'bounded_role_scope_not_service_day_table', 'bounded_relation_vocabulary', 'bounded_relation_inventory_not_resolution', 'bounded_explicit_example_predicate', 'bounded_stem_specific_predicate', 'bounded_exact_exposure_example_predicate', 'bounded_exact_source_clause_predicate', 'bounded_condition_clause_for_jia_only', 'bounded_numeric_state_clause', 'bounded_numeric_operation_without_state_resolver', 'bounded_month_specific_condition_clauses'].includes(item.ruleCompleteness)) fail(`adopted_rule_incomplete:${item.ruleId}`)
    if ((item.status === 'unresolved' || item.status === 'unsupported') && (!item.observedRule || item.observedRule.length === 0)) fail(`unresolved_reason_missing:${item.ruleId}`)
  }

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

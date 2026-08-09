import {
  SAJU_LOCAL_SOURCE_ADMISSION_BOUNDARY,
  SAJU_LOCAL_SOURCE_CORPUS_ROOT,
  SAJU_LOCAL_SOURCE_DOCUMENTS,
} from './sajuLocalSourceCorpusEvidence.js'

export const SAJU_FIVE_CLASSICS_GROUNDING_SCHEMA = 'saju-five-classics-claim-grounding-v0'
export const SAJU_FIVE_CLASSICS_GROUNDING_VERSION = '0.1.0'

const observation = (observationId, sourceId, pdfPage, printedPage, heading, visibleText) => ({
  observationId,
  sourceId,
  locator: {
    pdfPage,
    printedPage,
    heading,
    pageLocatorStatus: 'direct_visual_scan_reviewed',
  },
  observationMethod: {
    sourceByteIdentity: 'verified_by_current_local_file_sha256',
    scanFirst: true,
    directVisualReview: true,
    ocrCanonical: false,
    transcriptionStatus: 'direct_visual_observation_candidate_not_canonical_source_text',
    render: {
      renderer: 'pdftoppm',
      rendererVersion: '26.05.0',
      commandTemplate: 'pdftoppm -f <pdfPage> -l <pdfPage> -r 180 -jpeg -singlefile <source-pdf> <scratch-output-prefix>',
      outputFormat: 'jpeg',
      renderBytesRetained: false,
      renderHash: 'not_retained; reproducible from source byte hash and render command',
    },
  },
  visibleText,
  admission: {
    ...SAJU_LOCAL_SOURCE_ADMISSION_BOUNDARY,
    status: 'local_direct_observation_admitted_with_limits',
    allowedUse: 'claim-relation-and-locator-candidate_only',
    canonicalTranscription: false,
    claimVerification: 'not_promoted',
    independentAuthority: 'not_established',
  },
})

export const SAJU_FIVE_CLASSICS_RESEARCH_UNITS = Object.freeze([
  {
    researchUnitId: 'five-classics.branch-relations.ziping-p5',
    title: '子平真詮 p.5 刑沖會合 definition and example scope',
    packetIds: ['saju-source-packet-rule-branch-relations-v0'],
    observations: [observation(
      'ziping-p5-branch-relations-definition-and-examples',
      'saju-source-ziping-zhenquan',
      5,
      '5',
      '七、论刑冲会合解法',
      [
        '刑者，三刑也，子卯巳申寅之类也。',
        '冲者，六冲也，子午卯酉之类是也。',
        '会者，三会也，申子辰之类是也。',
        '合者，六合也，子与丑合之类是也。',
        '此皆以地支宫分而言，系对射之意也。三方为会，朋友之意也。并对为合，比邻之意也。',
        '八字支中，刑冲俱非美事，而三合六合，可以解之。',
      ],
    )],
    relationAssessment: {
      status: 'partial_support',
      supports: [
        'the observed page names and distinguishes 刑、冲、会、合',
        'the observed examples include 子卯/巳申寅 for 三刑, 子午/卯酉 for 六冲, 申子辰 for 三会, and 子丑 for 六合',
        'the page distinguishes three-direction 会 from opposite-pair 合 in its visible prose',
      ],
      doesNotSupport: [
        'the complete repository relation tables for all current branch-relation claim IDs',
        'the repository half-trine and 破 entries, which are not established by the observed sentences',
        'the chart-specific relation occurrences or any strength, transformation, or outcome conclusion',
      ],
      tension: 'The page discusses relation resolution in examples, while the repository claim text deliberately reports lookup existence only; no semantic resolution is imported.',
      authorityBoundary: 'edition_identity_unresolved_and_independent_authority_not_established',
    },
  },
  {
    researchUnitId: 'five-classics.day-master-and-month-command.yuanhai-p6-p7',
    title: '淵海子平 p.6–7 day-as-host and month-command framing',
    packetIds: [
      'saju-source-packet-core-four-pillars-v0',
      'saju-source-packet-rule-strength-v0',
      'saju-source-packet-rule-yongshin-v0',
    ],
    observations: [
      observation(
        'yuanhai-p6-day-as-host',
        'saju-source-yuanhai-ziping',
        6,
        '6',
        '论日为主',
        [
          '取日干为主，以年为根，以月为苗，以日为花，以时为果；以生旺死绝休囚制化，决人一生休咎。',
          '以日为主，年为本，月为提纲，时为辅佐。',
        ],
      ),
      observation(
        'yuanhai-p7-month-command',
        'saju-source-yuanhai-ziping',
        7,
        '7',
        '论月令',
        [
          '以日为主，大要看日加临于甚度，或身旺？或身弱？又看地支有何格局？',
          '月为提纲，带官星印绶，则慷慨聪明、见识高人。',
          '假令月令有用神，得父母力。',
        ],
      ),
    ],
    relationAssessment: {
      status: 'partial_support',
      supports: [
        'day stem/day pillar as the organizing subject of a chart',
        'the structural roles of year, month, and hour in the observed prose',
        'month command as a relevant framing for strength and use selection',
      ],
      doesNotSupport: [
        'the repository astronomical day-pillar calculation, solar-term solver, day-boundary policy, or hour-stem algorithm',
        'a deterministic numerical strength score or a user-specific yongshin result',
      ],
      tension: 'The observed prose includes interpretive life-outcome language; this artifact records only the structural day/month framing and creates no interpretation.',
      authorityBoundary: 'source_warning_present_and_edition_identity_unresolved',
    },
  },
  {
    researchUnitId: 'five-classics.hidden-stems-and-ten-gods.yuanhai-p4',
    title: '淵海子平 p.4 hidden-stem and ten-god label scope',
    packetIds: [
      'saju-source-packet-core-element-distribution-v0',
      'saju-source-packet-core-ten-god-distribution-v0',
    ],
    observations: [observation(
      'yuanhai-p4-hidden-stems-and-ten-god-labels',
      'saju-source-yuanhai-ziping',
      4,
      '4',
      '论天干地支暗藏总诀',
      [
        '见辛：为偏官、七杀、官鬼、媒人。',
        '见壬：为印绶、正人、君子、忌杀。',
        '见癸：为倒食、偏印、枭神、剋母。',
        '立春念三丙火用，餘日甲木旺提纲。',
      ],
    )],
    relationAssessment: {
      status: 'partial_support',
      supports: [
        'the observed source uses named ten-god labels and presents them in relation to stem material',
        'the observed page is explicitly headed as a hidden-stem summary',
        'the page includes seasonal/month framing adjacent to the hidden-stem material',
      ],
      doesNotSupport: [
        'the repository exact polarity-sensitive mapping for every ten-god label',
        'the repository visible-versus-hidden counting scope or branch-main-stem projection',
        'the chart-specific repeated-count claims',
      ],
      tension: 'The visible source uses multiple traditional labels and contextual language; label presence is not treated as a one-to-one proof of the repository count fields.',
      authorityBoundary: 'source_warning_present_and_edition_identity_unresolved',
    },
  },
  {
    researchUnitId: 'five-classics.four-pillars-and-hour-stem.sanming-p65-p70',
    title: '三命通會 p.65–70 人元、四時節氣、月時法 and 四柱 framing',
    packetIds: ['saju-source-packet-core-four-pillars-v0'],
    observations: [
      observation(
        'sanming-p65-human-element-and-month-command',
        'saju-source-sanming-tonghui',
        65,
        '65',
        '论人元司事',
        [
          '谓之人元，名为司事之神，以命术言之为月令。',
          '天元，主禄，谓之天元；重浊者为十二支，主身，谓之地元。',
        ],
      ),
      observation(
        'sanming-p66-seasonal-hidden-stem-service',
        'saju-source-sanming-tonghui',
        66,
        '66',
        '论四时节气',
        [
          '正月建寅，寅中有艮土用事五日，丙火长生五日，甲木二十日。',
          '此十二支按十二月各藏五行为人元，以配四时则春暖秋凉冬寒夏热，如环无端，终而复始，岁功毕而成一年。',
        ],
      ),
      observation(
        'sanming-p69-month-hour-method',
        'saju-source-sanming-tonghui',
        69,
        '69',
        '论造化时',
        [
          '凡论人命，年月日時排成四柱，逢月从年，逢时从日，则以年为本，逢时从日，则以日为主。',
          '时如甲子日子时生人即甲己，还加甲，便知子时乃甲子，丑时乃乙丑，顺行十二时。',
          '月时之法，取天干合数，阴阳之配也。既取合数，自生化数，月则取生，时则取克。',
        ],
      ),
      observation(
        'sanming-p70-year-month-day-hour',
        'saju-source-sanming-tonghui',
        70,
        '70',
        '论年月日時',
        [
          '凡论人命，年月日時排成四柱，逢月从年，则以年为本，逢时从日，则以日为主。古法以年看，子平以日看，本此。',
          '大率以年则统乎一岁，月则该乎三十，而时日为得之。',
        ],
      ),
    ],
    relationAssessment: {
      status: 'partial_support',
      supports: [
        'the observed source explicitly frames a chart as year/month/day/hour four pillars',
        'the observed source names 人元/司事 and gives month-specific hidden-stem service intervals',
        'the observed source gives a visible month-from-year and hour-from-day stem procedure, including 子时 and sequential hour stems',
        'the observed source explicitly states a day-as-host framing in the year/month/day/hour discussion',
      ],
      doesNotSupport: [
        'the repository astronomical solar-longitude approximation, 135-degree meridian, equation-of-time correction, or 20-minute uncertainty window',
        'the repository civil/solar-midnight day-boundary choice as a resolved authority',
        'the repository exact implementation output for any chart occurrence',
      ],
      tension: 'The observed classical convention is a direct rule witness for a bounded calendar-rule scope, but its edition identity and relationship to the repository astronomical layer remain unresolved.',
      authorityBoundary: 'web_derived_export_with_editorial_provenance_limits_and_edition_identity_unresolved',
    },
  },
  {
    researchUnitId: 'five-classics.seasonal-strength.ditian-p4',
    title: '滴天髓 p.4 qualitative seasonal strength and 甲木 conditions',
    packetIds: [
      'saju-source-packet-rule-strength-v0',
      'saju-source-packet-rule-yongshin-v0',
    ],
    observations: [observation(
      'ditian-p4-jia-wood-seasonal-conditions',
      'saju-source-ditian-sui',
      4,
      '4',
      '天干论 / 甲木',
      [
        '五阳得阳之气，即能成其阳刚，不畏财煞之势；五阴得阴之气，即能成其阴顺。',
        '甲木参天，脱胎要火，春不容金，秋不容土，火炽乘龙，水荡骑虎，地润天和，植立千古。',
        '旺木得火而愈敷荣，生於春，则助火而不能容金也。',
      ],
    )],
    relationAssessment: {
      status: 'partial_support',
      supports: [
        'qualitative seasonal and qi/勢 distinctions for a day-stem discussion',
        'the source links conditions and supporting elements to 甲木 in an observed section',
      ],
      doesNotSupport: [
        'the repository 0–100 strength score, threshold labels, or surface-only coefficient',
        'the repository choice to exclude hidden-stem roots from the quantitative score',
        'a deterministic yongshin or heeshin result for a chart occurrence',
      ],
      tension: 'Qualitative source principles and a repository numeric heuristic are different evidence layers; no coefficient is inferred from the verse.',
      authorityBoundary: 'web_derived_export_attribution_observed_and_edition_identity_unresolved',
    },
  },
  {
    researchUnitId: 'five-classics.seasonal-element-and-yongshin.qiongtong-p2-p4-p7',
    title: '窮通寶鑑 p.2, p.4, p.7 seasonal element weighting and 用神 scope',
    packetIds: [
      'saju-source-packet-core-element-distribution-v0',
      'saju-source-packet-rule-strength-v0',
      'saju-source-packet-rule-yongshin-v0',
    ],
    observations: [
      observation(
        'qiongtong-p2-five-phase-number-and-season',
        'saju-source-qiongtong-baojian',
        2,
        '2',
        '五行总论',
        [
          '五行者，本乎天地之间而不穷者也，故谓之行。',
          '其数则水一、火二、木三、金四、土五。生旺加倍，死绝减半。',
        ],
      ),
      observation(
        'qiongtong-p4-spring-jia-wood',
        'saju-source-qiongtong-baojian',
        4,
        '4',
        '论甲木 / 三春甲木',
        [
          '春月之木，渐有生长之象。初春犹有余寒，当以火温暖，则有舒畅之美，水多变枯，有损精神。',
          '重见生旺，必用庚金斵削，可成栋梁。',
        ],
      ),
      observation(
        'qiongtong-p7-summer-jia-wood',
        'saju-source-qiongtong-baojian',
        7,
        '7',
        '三夏甲木',
        [
          '五六月用丁火，虽运行北地，不致于死。',
          '凡用神太多，不宜克制，须泄之为妙。',
        ],
      ),
    ],
    relationAssessment: {
      status: 'partial_support_with_scope_tension',
      supports: [
        'the source presents element categories and a seasonal adjustment statement',
        'the source presents month-specific 甲木 conditions and named 用神-like choices',
      ],
      doesNotSupport: [
        'the repository exact seasonal coefficient table or its rounding behavior',
        'the repository separation of surface counts from weighted counts as a source-prescribed rule',
        'the repository chart-specific yongshin candidate or any personal interpretation',
      ],
      tension: 'The observed seasonal adjustment language is not the same as the repository surface-count fields; the difference is retained as a scope tension, not merged.',
      authorityBoundary: 'modern_local_export_with_wiki_source_and_edition_identity_unresolved',
    },
  },
  {
    researchUnitId: 'five-classics.element-generation-and-branch-origin.sanming-p4-p6',
    title: '三命通會 p.4–6 element generation/control and stem-branch framing',
    packetIds: [
      'saju-source-packet-core-element-distribution-v0',
      'saju-source-packet-core-four-pillars-v0',
    ],
    observations: [
      observation(
        'sanming-p4-element-generation',
        'saju-source-sanming-tonghui',
        4,
        '4',
        '论五行生成',
        [
          '一曰水，二曰火，三曰木，四曰金，五曰土者，咸有所自也。',
        ],
      ),
      observation(
        'sanming-p5-element-generation-control',
        'saju-source-sanming-tonghui',
        5,
        '5',
        '论五行生克',
        [
          '五行相生相克，其理昭然。十干十二支、五运六气、岁月日時皆自此立，更相为用。',
        ],
      ),
      observation(
        'sanming-p6-stem-branch-origin',
        'saju-source-sanming-tonghui',
        6,
        '6',
        '论支干源流',
        [
          '大干犹木之干，强而为阳；支犹木之枝，弱而为阴。',
          '首君以天地既分之后，先有天而后有地，由是气化而人生焉，故天皇氏一姓十三人，继盘古氏以治。',
        ],
      ),
    ],
    relationAssessment: {
      status: 'partial_support',
      supports: [
        'basic element naming and generation/control framing',
        'a visible connection between stems/branches and the element framework',
      ],
      doesNotSupport: [
        'the repository exact calendrical anchor, solar-term boundary, or hour-stem calculation',
        'surface/hidden count semantics or chart-specific element absence claims',
      ],
      tension: 'The page uses cosmological and numerical exposition; this is not treated as a direct specification of the repository calendar implementation.',
      authorityBoundary: 'web_derived_export_with_editorial_provenance_limits_and_edition_identity_unresolved',
    },
  },
  {
    researchUnitId: 'five-classics.yongshin-and-gyeokguk.ziping-p6-p26',
    title: '子平真詮 p.6 and p.26 用神/雜格 rule-scope comparison',
    packetIds: [
      'saju-source-packet-rule-gyeokguk-v0',
      'saju-source-packet-rule-yongshin-v0',
    ],
    observations: [
      observation(
        'ziping-p6-yongshin-month-command',
        'saju-source-ziping-zhenquan',
        6,
        '6',
        '八、论用神',
        [
          '八字用神，专求月令，以日干配月令地支，而生克不同，格局分焉。',
          '财官印食，此用神之善而顺用之者也；煞伤枭刃，此用神之不善而逆用之者也。',
        ],
      ),
      observation(
        'ziping-p26-miscellaneous-structures',
        'saju-source-ziping-zhenquan',
        26,
        '26',
        '四十七、论杂格',
        [
          '杂格者，月令无用，以外格而用之，其格甚多，故谓之杂。',
          '大约要干头无官无煞，方成格。',
          '有化气取格者，要化出之物，得时乘令，四支局全。',
        ],
      ),
    ],
    relationAssessment: {
      status: 'partial_support',
      supports: [
        '用神 is visibly tied to month command in the observed source',
        'the source distinguishes a miscellaneous/external structure from ordinary month-command use',
      ],
      doesNotSupport: [
        'the repository exact hidden-stem projection order or experimental named output',
        'the repository yongshin heuristic or a claim-level chart result',
      ],
      tension: 'The observed rule text is conditional and structure-specific; the repository experimental labels remain noncanonical and are not promoted.',
      authorityBoundary: 'modern_typeset_local_export_and_edition_identity_unresolved',
    },
  },
  {
    researchUnitId: 'five-classics.timing-exact-boundary.ziping-p25',
    title: 'timing frontier check: 子平真詮 p.25 contains 取運 material but not the required start-age contract',
    packetIds: ['saju-source-packet-rule-timing-v0'],
    observations: [observation(
      'ziping-p25-jianlu-yuejie-take-luck',
      'saju-source-ziping-zhenquan',
      25,
      '25',
      '四十五、论建禄月劫',
      [
        '建禄者，月建逢禄堂也，禄即是劫。',
        '建禄与月劫，可同一格，不必分分，皆以透天干，别取财官煞食为用。',
      ],
    )],
    relationAssessment: {
      status: 'not_supporting_exact_timing',
      supports: ['the observed page has a visible 取運-related heading and discusses structure-dependent use'],
      doesNotSupport: [
        'the repository direction rule, adjacent-term selection, 三日一歲 conversion, start-age date, or active-cycle claim',
      ],
      tension: 'A visible 取運 heading is not evidence for the repository timing algorithm; the timing packet remains source-unresolved.',
      authorityBoundary: 'edition_identity_unresolved',
    },
  },
])

export const SAJU_FIVE_CLASSICS_PROVENANCE_OBSERVATIONS = Object.freeze([
  {
    provenanceObservationId: 'yuanhai-p2-source-warning',
    sourceId: 'saju-source-yuanhai-ziping',
    locator: { pdfPage: 2, printedPage: '2', heading: 'source warning block', pageLocatorStatus: 'direct_visual_scan_reviewed' },
    visibleText: ['此作品来源不明，或因未经查证而存有疑虑处。'],
    consequence: 'source_warning_preserved; no edition authority or independent primary status',
  },
  {
    provenanceObservationId: 'qiongtong-p1-wikisource-export',
    sourceId: 'saju-source-qiongtong-baojian',
    locator: { pdfPage: 1, printedPage: '1', heading: 'cover/export note', pageLocatorStatus: 'direct_visual_scan_reviewed' },
    visibleText: ['以2026年8月4日从维基文库导出'],
    consequence: 'web_export_provenance_preserved; no edition authority or independent primary status',
  },
  {
    provenanceObservationId: 'sanming-p2-editorial-caveat',
    sourceId: 'saju-source-sanming-tonghui',
    locator: { pdfPage: 2, printedPage: '2', heading: 'editorial provenance note', pageLocatorStatus: 'direct_visual_scan_reviewed' },
    visibleText: ['不著撰人名氏。卷首但题曰青吾山人。', '外间未曾窥见，遂误信依托之本，固未足以为病也。'],
    consequence: 'authorship/transmission caveat preserved; no edition authority or independent primary status',
  },
  {
    provenanceObservationId: 'ditian-p2-web-attribution',
    sourceId: 'saju-source-ditian-sui',
    locator: { pdfPage: 2, printedPage: '2', heading: 'web attribution and linked source block', pageLocatorStatus: 'direct_visual_scan_reviewed' },
    visibleText: ['作者：刘基', '滴天髓辑要'],
    consequence: 'web-derived attribution preserved; no edition authority or independent primary status',
  },
  {
    provenanceObservationId: 'ziping-p2-modern-export-title',
    sourceId: 'saju-source-ziping-zhenquan',
    locator: { pdfPage: 2, printedPage: '2', heading: '一、论十干十二支', pageLocatorStatus: 'direct_visual_scan_reviewed' },
    visibleText: ['子平真诠-沈孝瞻原著'],
    consequence: 'modern typeset local export observed; bibliographic edition identity remains unresolved',
  },
])

export const SAJU_FIVE_CLASSICS_PACKET_BOUNDARIES = Object.freeze({
  'saju-source-packet-core-candidate-boundary-v0': {
    status: 'source_unresolved',
    unitIds: [],
    reason: 'No directly observed sentence in the reviewed pages prescribes the repository missing-time candidate policy or its day-boundary handling.',
  },
  'saju-source-packet-core-element-distribution-v0': {
    status: 'partial_support_with_scope_tension',
    unitIds: [
      'five-classics.seasonal-element-and-yongshin.qiongtong-p2-p4-p7',
      'five-classics.element-generation-and-branch-origin.sanming-p4-p6',
      'five-classics.hidden-stems-and-ten-gods.yuanhai-p4',
    ],
    reason: 'Element naming and seasonal/hidden-stem context are observed, but the exact surface-only count and absence semantics are not source-established.',
  },
  'saju-source-packet-core-four-pillars-v0': {
    status: 'partial_support',
    unitIds: [
      'five-classics.day-master-and-month-command.yuanhai-p6-p7',
      'five-classics.element-generation-and-branch-origin.sanming-p4-p6',
      'five-classics.four-pillars-and-hour-stem.sanming-p65-p70',
    ],
    reason: 'Day-as-host and stems/branches framing are observed, but the repository calendar and time-boundary algorithm is not source-established.',
  },
  'saju-source-packet-core-ten-god-distribution-v0': {
    status: 'partial_support',
    unitIds: ['five-classics.hidden-stems-and-ten-gods.yuanhai-p4'],
    reason: 'Named ten-god and hidden-stem material is observed, but exact polarity mapping and counting scope are not source-established.',
  },
  'saju-source-packet-rule-branch-relations-v0': {
    status: 'partial_support',
    unitIds: ['five-classics.branch-relations.ziping-p5'],
    reason: 'Definitions and selected examples are directly observed, but complete claim-level tables and all repository relation types are not established.',
  },
  'saju-source-packet-rule-gyeokguk-v0': {
    status: 'partial_support',
    unitIds: ['five-classics.yongshin-and-gyeokguk.ziping-p6-p26'],
    reason: '用神/month-command and 雜格 conditions are observed, but exact repository projection and experimental output are not established.',
  },
  'saju-source-packet-rule-shinsal-v0': {
    status: 'source_unresolved',
    unitIds: [],
    reason: 'No directly reviewed page in the allowed local material establishes the exact reference axis and mapping for the repository shinsal set.',
  },
  'saju-source-packet-rule-strength-v0': {
    status: 'partial_support_with_scope_tension',
    unitIds: [
      'five-classics.day-master-and-month-command.yuanhai-p6-p7',
      'five-classics.seasonal-strength.ditian-p4',
      'five-classics.seasonal-element-and-yongshin.qiongtong-p2-p4-p7',
    ],
    reason: 'Qualitative seasonal/support language is observed, while the repository numeric heuristic remains implementation policy only.',
  },
  'saju-source-packet-rule-timing-v0': {
    status: 'not_supporting_exact_timing',
    unitIds: ['five-classics.timing-exact-boundary.ziping-p25'],
    reason: '取運-related text is observed, but no reviewed sentence prescribes the repository direction/start-age/active-cycle contract.',
  },
  'saju-source-packet-rule-yongshin-v0': {
    status: 'partial_support_with_scope_tension',
    unitIds: [
      'five-classics.day-master-and-month-command.yuanhai-p6-p7',
      'five-classics.seasonal-strength.ditian-p4',
      'five-classics.seasonal-element-and-yongshin.qiongtong-p2-p4-p7',
      'five-classics.yongshin-and-gyeokguk.ziping-p6-p26',
    ],
    reason: 'Use-selection vocabulary and conditional seasonal material are observed, but the repository heuristic candidate and precedence are not source-established.',
  },
})

export const SAJU_FIVE_CLASSICS_ADMISSION_BOUNDARY = Object.freeze({
  sourceIdentity: 'local_file_bytes_verified_edition_unresolved',
  directObservation: 'admitted_with_limits',
  transcription: 'candidate_not_canonical_source_text',
  claimRelation: 'claim_level_scope_assessment_only',
  claimVerification: 'not_promoted',
  independentAuthority: 'not_established',
  semanticEquivalence: 'not_established',
  readiness: 'blocked_unchanged',
  activation: 'blocked_unchanged',
})

export { SAJU_LOCAL_SOURCE_CORPUS_ROOT, SAJU_LOCAL_SOURCE_DOCUMENTS }

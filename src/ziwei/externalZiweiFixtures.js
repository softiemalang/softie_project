/**
 * src/ziwei/externalZiweiFixtures.js
 *
 * 자미두수 독립 외부 검증 픽스처 단일 원천 (Canonical Source of Truth).
 *
 * 모든 항목은 저자/기관, 서명, 판본, 출판연도, 페이지/표/장 번호,
 * 실제 확인값, 접근일, 규칙체계가 명시된 고전 문헌 및 공식 표 자료를 기준으로 수동 기록합니다.
 */

export const ZIWEI_EXTERNAL_FIXTURES = Object.freeze([
  // 1. 자미두수 오행국 60갑자 납음 원전 표 (ruleset_table_reference)
  {
    fixtureId: 'ziwei-ext-table-bureau-lookup',
    system: 'ziwei',
    referenceType: 'ruleset_table_reference',
    scope: {
      targetFields: ['fiveElementsBureau.bureauName', 'fiveElementsBureau.bureauNumber'],
      applicablePeriod: 'all_historical',
    },
    input: {
      birthYearStem: '甲',
      mingGongBranch: '子',
    },
    expected: {
      bureauName: '수이국',
      bureauNumber: 2,
    },
    source: {
      sourceTitle: '紫微斗數全書 (Ziwei Dou Shu Quan Shu)',
      title: '紫微斗數全書 (Ziwei Dou Shu Quan Shu)',
      organizationOrAuthor: '陳摶 (attributed) / 羅洪先 (edit)',
      publisherId: 'pub-quan-shu-classic',
      referenceDocumentId: 'doc-ziwei-quan-shu',
      documentId: 'doc-ziwei-quan-shu',
      editionOrVersion: 'pending_exact_edition_review',
      edition: 'pending_exact_edition_review',
      prefaceDate: '1550',
      editionPublicationDate: 'pending',
      publicationDate: 'pending',
      volume: '卷一',
      pageOrLine: '五行局起例表 (甲己之年丙作首 丙子澗下水 水二局)',
      pageOrTableOrSection: '卷一 · 五行局起例表 (甲己之年丙作首 丙子澗下水 水二局)',
      permanentUrl: 'https://ctext.org/wiki.pl?if=gb&res=446219',
      urlOrReference: 'https://ctext.org/wiki.pl?if=gb&res=446219',
      accessedAt: '2026-07-27',
      sourceTier: 'Tier 2',
      methodDisclosure: 'classical_text_bureau_table',
    },
    independence: {
      independentFromCurrentEngine: true,
      suspectedSharedDependency: false,
      independentlyReproducible: 'pending',
    },
    rules: {
      timezone: 'Asia/Seoul',
      calendar: 'chinese_lunar',
      dayBoundary: 'midnight_00:00',
      hourBoundary: 'standard_12_branches',
      leapMonthRule: 'standard_lunar',
      schoolOrRuleSet: 'ziwei_quan_shu_classic',
    },
    sourceVerdict: 'provisional_transcription_match',
    declaredReviewStatus: 'pending_source_review',
  },

  // 2. 자미두수 자미성 포국 원전 표 (ruleset_table_reference)
  {
    fixtureId: 'ziwei-ext-table-ziwei-placement',
    system: 'ziwei',
    referenceType: 'ruleset_table_reference',
    scope: {
      targetFields: ['ziweiStarBranch'],
      applicablePeriod: 'all_historical',
    },
    input: {
      bureauNumber: 2, // 수이국
      lunarDay: 15,
    },
    expected: {
      ziweiPalaceBranch: '申', // 《紫微斗數全書》 卷一 · 定紫微星所在表: 水二局 十五日 在申 (16일이 酉)
    },
    source: {
      sourceTitle: '紫微斗數全書 (Ziwei Dou Shu Quan Shu)',
      title: '紫微斗數全書 (Ziwei Dou Shu Quan Shu)',
      organizationOrAuthor: '陳摶 (attributed) / 羅洪先 (edit)',
      publisherId: 'pub-quan-shu-classic',
      referenceDocumentId: 'doc-ziwei-quan-shu',
      documentId: 'doc-ziwei-quan-shu',
      editionOrVersion: 'pending_exact_edition_review',
      edition: 'pending_exact_edition_review',
      prefaceDate: '1550',
      editionPublicationDate: 'pending',
      publicationDate: 'pending',
      volume: '卷一',
      pageOrLine: '定紫微星所在表 (水二局十五日在申)',
      pageOrTableOrSection: '卷一 · 定紫微星所在表 (水二局十五日在申)',
      permanentUrl: 'https://ctext.org/wiki.pl?if=gb&res=446219',
      urlOrReference: 'https://ctext.org/wiki.pl?if=gb&res=446219',
      accessedAt: '2026-07-27',
      sourceTier: 'Tier 2',
      methodDisclosure: 'classical_text_placement_table',
    },
    independence: {
      independentFromCurrentEngine: true,
      suspectedSharedDependency: false,
      independentlyReproducible: 'pending',
    },
    rules: {
      timezone: 'Asia/Seoul',
      calendar: 'chinese_lunar',
      dayBoundary: 'midnight_00:00',
      hourBoundary: 'standard_12_branches',
      leapMonthRule: 'standard_lunar',
      schoolOrRuleSet: 'ziwei_quan_shu_classic',
    },
    sourceVerdict: 'provisional_transcription_match',
    declaredReviewStatus: 'pending_source_review',
  },

  // 3. 자미두수 생년십간 사화 원전 표 (ruleset_table_reference)
  {
    fixtureId: 'ziwei-ext-table-four-transformations',
    system: 'ziwei',
    referenceType: 'ruleset_table_reference',
    scope: {
      targetFields: ['transformations'],
      applicablePeriod: 'all_historical',
    },
    input: {
      birthYearStem: '甲',
    },
    expected: {
      transformations: [
        { type: '화록', starName: '염정' },
        { type: '화권', starName: '파군' },
        { type: '화과', starName: '무곡' },
        { type: '화기', starName: '태양' },
      ],
    },
    source: {
      sourceTitle: '紫微斗數全書 (Ziwei Dou Shu Quan Shu)',
      title: '紫微斗數全書 (Ziwei Dou Shu Quan Shu)',
      organizationOrAuthor: '陳摶 (attributed) / 羅洪先 (edit)',
      publisherId: 'pub-quan-shu-classic',
      referenceDocumentId: 'doc-ziwei-quan-shu',
      documentId: 'doc-ziwei-quan-shu',
      editionOrVersion: 'pending_exact_edition_review',
      edition: 'pending_exact_edition_review',
      prefaceDate: '1550',
      editionPublicationDate: 'pending',
      publicationDate: 'pending',
      volume: '卷一',
      pageOrLine: '安十干四化星訣 (甲廉破武陽)',
      pageOrTableOrSection: '卷一 · 安十干四化星訣 (甲廉破武陽)',
      permanentUrl: 'https://ctext.org/wiki.pl?if=gb&res=446219',
      urlOrReference: 'https://ctext.org/wiki.pl?if=gb&res=446219',
      accessedAt: '2026-07-27',
      sourceTier: 'Tier 2',
      methodDisclosure: 'classical_text_transformation_table',
    },
    independence: {
      independentFromCurrentEngine: true,
      suspectedSharedDependency: false,
      independentlyReproducible: 'pending',
    },
    rules: {
      timezone: 'Asia/Seoul',
      calendar: 'chinese_lunar',
      dayBoundary: 'midnight_00:00',
      hourBoundary: 'standard_12_branches',
      leapMonthRule: 'standard_lunar',
      schoolOrRuleSet: 'ziwei_quan_shu_classic',
    },
    sourceVerdict: 'provisional_transcription_match',
    declaredReviewStatus: 'pending_source_review',
  },

  // 4. 자미두수 6길성 보조성 포국 원전 표 (ruleset_table_reference)
  {
    fixtureId: 'ziwei-ext-table-minor-stars',
    system: 'ziwei',
    referenceType: 'ruleset_table_reference',
    scope: {
      targetFields: ['minorStarBranches'],
      applicablePeriod: 'all_historical',
    },
    input: {
      birthYearStem: '甲',
      lunarMonth: 5,
      hourBranch: '午',
    },
    expected: {
      minorStarBranches: {
        '좌보': '申', // 5월: 辰에서 순행 5 -> 申
        '우필': '午', // 5월: 戌에서 역행 5 -> 午
        '문창': '辰', // 午시: 戌에서 역행 7 -> 辰
        '문곡': '戌', // 午시: 辰에서 순행 7 -> 戌
        '천괴': '丑', // 甲년: 牛 -> 丑
        '천월': '未', // 甲년: 羊 -> 未
      },
    },
    source: {
      sourceTitle: '紫微斗數全書 (Ziwei Dou Shu Quan Shu)',
      title: '紫微斗數全書 (Ziwei Dou Shu Quan Shu)',
      organizationOrAuthor: '陳摶 (attributed) / 羅洪先 (edit)',
      publisherId: 'pub-quan-shu-classic',
      referenceDocumentId: 'doc-ziwei-quan-shu',
      documentId: 'doc-ziwei-quan-shu',
      editionOrVersion: 'pending_exact_edition_review',
      edition: 'pending_exact_edition_review',
      prefaceDate: '1550',
      editionPublicationDate: 'pending',
      publicationDate: 'pending',
      volume: '卷一',
      pageOrLine: '安諸吉星訣 (左輔辰順 右弼戌逆 昌戌逆 曲辰順 魁鉞丑未)',
      pageOrTableOrSection: '卷一 · 安諸吉星訣 (左輔辰順 右弼戌逆 昌戌逆 曲辰順 魁鉞丑未)',
      permanentUrl: 'https://ctext.org/wiki.pl?if=gb&res=446219',
      urlOrReference: 'https://ctext.org/wiki.pl?if=gb&res=446219',
      accessedAt: '2026-07-27',
      sourceTier: 'Tier 2',
      methodDisclosure: 'classical_text_minor_star_table',
    },
    independence: {
      independentFromCurrentEngine: true,
      suspectedSharedDependency: false,
      independentlyReproducible: 'pending',
    },
    rules: {
      timezone: 'Asia/Seoul',
      calendar: 'chinese_lunar',
      dayBoundary: 'midnight_00:00',
      hourBoundary: 'standard_12_branches',
      leapMonthRule: 'standard_lunar',
      schoolOrRuleSet: 'ziwei_quan_shu_classic',
    },
    sourceVerdict: 'provisional_transcription_match',
    declaredReviewStatus: 'pending_source_review',
  },

  // 5-A. 고전 예제 명반 - 명궁/신궁 배치 (worked_chart_ming_shen_reference - 출처 미확정으로 검증 집계 제외)
  {
    fixtureId: 'ziwei-ext-chart-sample-classic-1-mingshen',
    system: 'ziwei',
    referenceType: 'worked_chart_ming_shen_reference',
    isExcludedFromValidationCount: true,
    scope: {
      targetFields: ['mingGongBranch', 'shenGongBranch'],
      applicablePeriod: 'all_historical',
    },
    input: {
      subjectName: '고전예제1-명신궁',
      lunarMonth: 5,
      hourBranch: '午',
      isLeapMonth: false,
    },
    expected: {
      mingGongBranch: '丑',
      shenGongBranch: '未',
    },
    source: {
      sourceTitle: '紫微斗數全書 (Ziwei Dou Shu Quan Shu)',
      title: '紫微斗數全書 (Ziwei Dou Shu Quan Shu)',
      organizationOrAuthor: '陳摶 (attributed) / 羅洪先 (edit)',
      publisherId: 'pub-quan-shu-classic',
      referenceDocumentId: 'doc-ziwei-quan-shu',
      documentId: 'doc-ziwei-quan-shu',
      editionOrVersion: 'pending_exact_edition_review',
      edition: 'pending_exact_edition_review',
      prefaceDate: '1550',
      editionPublicationDate: 'pending',
      publicationDate: 'pending',
      volume: '卷二',
      pageOrLine: '諸星入命吉凶例 (五月午時安命在丑身在未例)',
      pageOrTableOrSection: '卷二 · 諸星入命吉凶例 (五月午時安命在丑身在未例)',
      permanentUrl: 'https://ctext.org/wiki.pl?if=gb&res=446219',
      urlOrReference: 'https://ctext.org/wiki.pl?if=gb&res=446219',
      accessedAt: '2026-07-27',
      sourceTier: 'Tier 2',
      methodDisclosure: 'classical_worked_chart_example',
    },
    independence: {
      independentFromCurrentEngine: true,
      suspectedSharedDependency: false,
      independentlyReproducible: 'pending',
    },
    rules: {
      timezone: 'Asia/Seoul',
      calendar: 'chinese_lunar',
      dayBoundary: 'midnight_00:00',
      hourBoundary: 'standard_12_branches',
      leapMonthRule: 'standard_lunar',
      schoolOrRuleSet: 'ziwei_quan_shu_classic',
    },
    sourceVerdict: 'source_locator_unverified',
    declaredReviewStatus: 'pending_source_review',
    auditNotes: {
      reason: 'source_locator_unverified',
      details: '《紫微斗數全書》 卷二 安身命例 수식은 5월 午시 명궁 子 / 신궁 子 산출. "五月午時安命在丑身在未例" 텍스트의 정본 스캔/위치 미확정으로 검증 집계 제외(out_of_scope)',
    },
  },

  // 5-B. 고전 예제 명반 - 오행국 산출 (worked_chart_bureau_reference_pending - 미평가 차단)
  {
    fixtureId: 'ziwei-ext-chart-sample-classic-1-bureau',
    system: 'ziwei',
    referenceType: 'worked_chart_bureau_reference_pending',
    isExcludedFromValidationCount: true,
    scope: {
      targetFields: ['bureauName', 'bureauNumber'],
      applicablePeriod: 'all_historical',
    },
    input: {
      subjectName: '고전예제1-오행국',
      birthYearStem: null, // 원문에 생년천간 누락되어 null 표기
      lunarMonth: 5,
      hourBranch: '午',
      isLeapMonth: false,
    },
    expected: {
      bureauName: '목삼국',
      bureauNumber: 3,
    },
    source: {
      sourceTitle: '紫微斗數全書 (Ziwei Dou Shu Quan Shu)',
      title: '紫微斗數全書 (Ziwei Dou Shu Quan Shu)',
      organizationOrAuthor: '陳摶 (attributed) / 羅洪先 (edit)',
      publisherId: 'pub-quan-shu-classic',
      referenceDocumentId: 'doc-ziwei-quan-shu',
      documentId: 'doc-ziwei-quan-shu',
      editionOrVersion: 'pending_exact_edition_review',
      edition: 'pending_exact_edition_review',
      prefaceDate: '1550',
      editionPublicationDate: 'pending',
      publicationDate: 'pending',
      volume: '卷二',
      pageOrLine: '諸星入命吉凶例 (五月午時安命在丑身在未例 - 생년천간 누락)',
      pageOrTableOrSection: '卷二 · 諸星入命吉凶例 (五月午時安命在丑身在未例 - 생년천간 누락)',
      permanentUrl: 'https://ctext.org/wiki.pl?if=gb&res=446219',
      urlOrReference: 'https://ctext.org/wiki.pl?if=gb&res=446219',
      accessedAt: '2026-07-27',
      sourceTier: 'Tier 2',
      methodDisclosure: 'classical_worked_chart_example',
    },
    independence: {
      independentFromCurrentEngine: true,
      suspectedSharedDependency: false,
      independentlyReproducible: 'pending',
    },
    rules: {
      timezone: 'Asia/Seoul',
      calendar: 'chinese_lunar',
      dayBoundary: 'midnight_00:00',
      hourBoundary: 'standard_12_branches',
      leapMonthRule: 'standard_lunar',
      schoolOrRuleSet: 'ziwei_quan_shu_classic',
    },
    sourceVerdict: 'insufficient_reproducible_input',
    declaredReviewStatus: 'pending_source_review',
    auditNotes: {
      reason: 'insufficient_reproducible_input',
      details: '원문에 생년천간이 표기되어 있지 않아 명궁천간 및 오행국(목삼국) 재현 불가 (out_of_scope 처리)',
    },
  },
])

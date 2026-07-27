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
      title: '紫微斗數全書 (Ziwei Dou Shu Quan Shu)',
      organizationOrAuthor: '陳摶 (attributed) / 羅洪先 (edit)',
      publisherId: 'pub-quan-shu-classic',
      referenceDocumentId: 'doc-ziwei-quan-shu',
      editionOrVersion: '明文海本 (Classic Chinese Text Project Digital Edition)',
      publicationDate: '1550',
      pageOrTableOrSection: '卷一 · 五行局起例表 (納音五行局定法)',
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
      ziweiPalaceBranch: '酉',
    },
    source: {
      title: '紫微斗數全書 (Ziwei Dou Shu Quan Shu)',
      organizationOrAuthor: '陳摶 (attributed) / 羅洪先 (edit)',
      publisherId: 'pub-quan-shu-classic',
      referenceDocumentId: 'doc-ziwei-quan-shu',
      editionOrVersion: '明文海本 (Classic Chinese Text Project Digital Edition)',
      publicationDate: '1550',
      pageOrTableOrSection: '卷一 · 定紫微星所在訣 (水二局十五日)',
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
      title: '紫微斗數全書 (Ziwei Dou Shu Quan Shu)',
      organizationOrAuthor: '陳摶 (attributed) / 羅洪先 (edit)',
      publisherId: 'pub-quan-shu-classic',
      referenceDocumentId: 'doc-ziwei-quan-shu',
      editionOrVersion: '明文海本 (Classic Chinese Text Project Digital Edition)',
      publicationDate: '1550',
      pageOrTableOrSection: '卷一 · 安十干四化星訣 (甲廉破武陽)',
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
        '좌보': '辰',
        '우필': '申',
        '문창': '戌',
        '문곡': '辰',
        '천괴': '丑',
        '천월': '未',
      },
    },
    source: {
      title: '紫微斗數全書 (Ziwei Dou Shu Quan Shu)',
      organizationOrAuthor: '陳摶 (attributed) / 羅洪先 (edit)',
      publisherId: 'pub-quan-shu-classic',
      referenceDocumentId: 'doc-ziwei-quan-shu',
      editionOrVersion: '明文海本 (Classic Chinese Text Project Digital Edition)',
      publicationDate: '1550',
      pageOrTableOrSection: '卷一 · 安諸吉星訣 (左輔右弼文昌文曲天魁天鉞訣)',
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
    declaredReviewStatus: 'pending_source_review',
  },

  // 5. 자미두수 전서 고전 예제 명반 (worked_chart_reference)
  {
    fixtureId: 'ziwei-ext-chart-sample-classic-1',
    system: 'ziwei',
    referenceType: 'worked_chart_reference',
    scope: {
      targetFields: ['mingGongBranch', 'shenGongBranch', 'bureauName', 'bureauNumber'],
      applicablePeriod: 'all_historical',
    },
    input: {
      subjectName: '고전예제1',
      birthYearStem: '甲',
      lunarMonth: 5,
      hourBranch: '午',
      isLeapMonth: false,
    },
    expected: {
      mingGongBranch: '丑',
      shenGongBranch: '未',
      bureauName: '목삼국',
      bureauNumber: 3,
    },
    source: {
      title: '紫微斗數全書 (Ziwei Dou Shu Quan Shu)',
      organizationOrAuthor: '陳摶 (attributed) / 羅洪先 (edit)',
      publisherId: 'pub-quan-shu-classic',
      referenceDocumentId: 'doc-ziwei-quan-shu',
      editionOrVersion: '明文海本 (Classic Chinese Text Project Digital Edition)',
      publicationDate: '1550',
      pageOrTableOrSection: '卷二 · 諸星入命吉凶例 (五月午時安命在丑身在未例)',
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
    declaredReviewStatus: 'pending_source_review',
  },
])

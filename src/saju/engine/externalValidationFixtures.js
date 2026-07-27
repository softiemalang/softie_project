/**
 * src/saju/engine/externalValidationFixtures.js
 *
 * 사주 독립 외부 검증 픽스처 단일 원천 (Canonical Source of Truth).
 *
 * 이 파일의 기대값은 엔진 출력을 복사한 회귀 픽스처가 아닙니다.
 * 모든 항목은 공개된 독립 외부 자료(HKO 천문대, IANA tzdb 등)를 기준으로
 * 출처 서지 정보, publisherId, referenceDocumentId, Source Tier, 독립성, 적용 규칙, 검증 범위를 수동 기록합니다.
 */

export const SAJU_EXTERNAL_FIXTURES = Object.freeze([
  // 1. HKO 2026 입춘 절입 시각 (astronomical_reference)
  {
    fixtureId: 'saju-ext-hko-2026-spring-commences',
    system: 'saju',
    referenceType: 'astronomical_reference',
    scope: {
      targetFields: ['solarTermName', 'solarTermLocalTime'],
      applicablePeriod: '2026-02',
    },
    input: {
      localDate: '2026-02-04',
      localTime: '04:02',
      timezone: 'Asia/Hong_Kong',
      longitude: 315,
    },
    expected: {
      solarTermName: '입춘',
      solarTermLocalTime: '2026-02-04 04:02',
      longitudeDegrees: 315,
      toleranceMinutes: 15,
    },
    source: {
      title: 'Hong Kong Observatory Almanac 2026 · February',
      organizationOrAuthor: 'Hong Kong Observatory',
      publisherId: 'pub-hko',
      referenceDocumentId: 'doc-hko-almanac-2026',
      editionOrVersion: '2026 Edition',
      publicationDate: '2025-09-30',
      pageOrTableOrSection: 'February 2026 Almanac Table',
      urlOrReference: 'https://www.hko.gov.hk/tc/gts/astron2026/files/2026cal02.pdf',
      accessedAt: '2026-07-27',
      sourceTier: 'Tier 1',
      methodDisclosure: 'official_astronomical_ephemeris',
    },
    independence: {
      independentFromCurrentEngine: true,
      suspectedSharedDependency: false,
      independentlyReproducible: true,
    },
    rules: {
      timezone: 'Asia/Hong_Kong',
      calendar: 'lunar_solar_combined',
      dayBoundary: 'midnight_00:00',
      hourBoundary: 'standard_12_branches',
      leapMonthRule: 'no_leap_month',
      schoolOrRuleSet: 'hko_official_almanac',
    },
    declaredReviewStatus: 'verified_reference',
  },

  // 2. HKO 2026-02-01 일진 (calendar_conversion_reference)
  {
    fixtureId: 'saju-ext-hko-2026-02-01-day-pillar',
    system: 'saju',
    referenceType: 'calendar_conversion_reference',
    scope: {
      targetFields: ['dayPillar'],
      applicablePeriod: '2026-02',
    },
    input: {
      birthDate: '2026-02-01',
      birthTime: '12:00',
    },
    expected: {
      dayPillar: '병오',
      dayStem: '병',
      dayBranch: '오',
    },
    source: {
      title: 'Hong Kong Observatory Almanac 2026 · Chinese calendar day column',
      organizationOrAuthor: 'Hong Kong Observatory',
      publisherId: 'pub-hko',
      referenceDocumentId: 'doc-hko-almanac-2026',
      editionOrVersion: '2026 Edition',
      publicationDate: '2025-09-30',
      pageOrTableOrSection: 'February 2026 Daily Pillar Table',
      urlOrReference: 'https://www.hko.gov.hk/tc/gts/astron2026/files/2026cal02.pdf',
      accessedAt: '2026-07-27',
      sourceTier: 'Tier 1',
      methodDisclosure: 'official_chinese_calendar_almanac',
    },
    independence: {
      independentFromCurrentEngine: true,
      suspectedSharedDependency: false,
      independentlyReproducible: true,
    },
    rules: {
      timezone: 'Asia/Hong_Kong',
      calendar: 'chinese_traditional_calendar',
      dayBoundary: 'midnight_00:00',
      hourBoundary: 'standard_12_branches',
      leapMonthRule: 'no_leap_month',
      schoolOrRuleSet: 'hko_official_almanac',
    },
    declaredReviewStatus: 'verified_reference',
  },

  // 3. HKO 음력 설날 (calendar_conversion_reference)
  {
    fixtureId: 'saju-ext-hko-2026-lunar-new-year',
    system: 'saju',
    referenceType: 'calendar_conversion_reference',
    scope: {
      targetFields: ['solarDate'],
      applicablePeriod: '2026-01',
    },
    input: {
      lunarYear: 2026,
      lunarMonth: 1,
      lunarDay: 1,
      isLeapMonth: false,
    },
    expected: {
      solarDate: '2026-02-17',
    },
    source: {
      title: 'Hong Kong Observatory Gregorian-Lunar Calendar Conversion Table 2026',
      organizationOrAuthor: 'Hong Kong Observatory',
      publisherId: 'pub-hko',
      referenceDocumentId: 'doc-hko-gregorian-lunar-2026',
      editionOrVersion: '2026 Edition',
      publicationDate: '2025-09-30',
      pageOrTableOrSection: '2026 Gregorian-Lunar Table',
      urlOrReference: 'https://www.hko.gov.hk/en/gts/time/calendar/pdf/files/2026e.pdf',
      accessedAt: '2026-07-27',
      sourceTier: 'Tier 1',
      methodDisclosure: 'official_gregorian_lunar_table',
    },
    independence: {
      independentFromCurrentEngine: true,
      suspectedSharedDependency: false,
      independentlyReproducible: true,
    },
    rules: {
      timezone: 'Asia/Hong_Kong',
      calendar: 'lunar_solar_combined',
      dayBoundary: 'midnight_00:00',
      hourBoundary: 'standard_12_branches',
      leapMonthRule: 'standard_leap_month_rule',
      schoolOrRuleSet: 'hko_official_almanac',
    },
    declaredReviewStatus: 'verified_reference',
  },

  // 4. HKO 음력 6월 1일 (calendar_conversion_reference)
  {
    fixtureId: 'saju-ext-hko-2026-sixth-month-start',
    system: 'saju',
    referenceType: 'calendar_conversion_reference',
    scope: {
      targetFields: ['solarDate'],
      applicablePeriod: '2026-06',
    },
    input: {
      lunarYear: 2026,
      lunarMonth: 6,
      lunarDay: 1,
      isLeapMonth: false,
    },
    expected: {
      solarDate: '2026-07-14',
    },
    source: {
      title: 'Hong Kong Observatory Gregorian-Lunar Calendar Conversion Table 2026',
      organizationOrAuthor: 'Hong Kong Observatory',
      publisherId: 'pub-hko',
      referenceDocumentId: 'doc-hko-gregorian-lunar-2026',
      editionOrVersion: '2026 Edition',
      publicationDate: '2025-09-30',
      pageOrTableOrSection: '2026 Gregorian-Lunar Table',
      urlOrReference: 'https://www.hko.gov.hk/en/gts/time/calendar/pdf/files/2026e.pdf',
      accessedAt: '2026-07-27',
      sourceTier: 'Tier 1',
      methodDisclosure: 'official_gregorian_lunar_table',
    },
    independence: {
      independentFromCurrentEngine: true,
      suspectedSharedDependency: false,
      independentlyReproducible: true,
    },
    rules: {
      timezone: 'Asia/Hong_Kong',
      calendar: 'lunar_solar_combined',
      dayBoundary: 'midnight_00:00',
      hourBoundary: 'standard_12_branches',
      leapMonthRule: 'standard_leap_month_rule',
      schoolOrRuleSet: 'hko_official_almanac',
    },
    declaredReviewStatus: 'verified_reference',
  },

  // 4.5. HKO 음력 6월 16일 (calendar_conversion_reference)
  {
    fixtureId: 'saju-ext-hko-2026-sixth-month-midpoint',
    system: 'saju',
    referenceType: 'calendar_conversion_reference',
    scope: {
      targetFields: ['solarDate'],
      applicablePeriod: '2026-06',
    },
    input: {
      lunarYear: 2026,
      lunarMonth: 6,
      lunarDay: 16,
      isLeapMonth: false,
    },
    expected: {
      solarDate: '2026-07-29',
    },
    source: {
      title: 'Hong Kong Observatory Gregorian-Lunar Calendar Conversion Table 2026',
      organizationOrAuthor: 'Hong Kong Observatory',
      publisherId: 'pub-hko',
      referenceDocumentId: 'doc-hko-gregorian-lunar-2026',
      editionOrVersion: '2026 Edition',
      publicationDate: '2025-09-30',
      pageOrTableOrSection: '2026 Gregorian-Lunar Table',
      urlOrReference: 'https://www.hko.gov.hk/en/gts/time/calendar/pdf/files/2026e.pdf',
      accessedAt: '2026-07-27',
      sourceTier: 'Tier 1',
      methodDisclosure: 'official_gregorian_lunar_table',
    },
    independence: {
      independentFromCurrentEngine: true,
      suspectedSharedDependency: false,
      independentlyReproducible: true,
    },
    rules: {
      timezone: 'Asia/Hong_Kong',
      calendar: 'lunar_solar_combined',
      dayBoundary: 'midnight_00:00',
      hourBoundary: 'standard_12_branches',
      leapMonthRule: 'standard_leap_month_rule',
      schoolOrRuleSet: 'hko_official_almanac',
    },
    declaredReviewStatus: 'verified_reference',
  },

  // 5. IANA 서울 1987 DST 중복시각 (timezone_reference)
  {
    fixtureId: 'saju-ext-iana-seoul-1987-dst-overlap',
    system: 'saju',
    referenceType: 'timezone_reference',
    scope: {
      targetFields: ['historicalTimezoneStatus'],
      applicablePeriod: '1987-10',
    },
    input: {
      localDate: '1987-10-11',
      localTime: '02:30',
      timezone: 'Asia/Seoul',
    },
    expected: {
      historicalTimezoneStatus: 'dst_ambiguous_local_time',
    },
    source: {
      title: 'IANA Asia/Seoul Historical Timezone Database Discussion',
      organizationOrAuthor: 'IANA (Internet Assigned Numbers Authority)',
      publisherId: 'pub-iana',
      referenceDocumentId: 'doc-iana-tz-discussion-2019',
      editionOrVersion: 'tz-discussion 2019',
      publicationDate: '2019-08-07',
      pageOrTableOrSection: 'Asia/Seoul 1987 DST Rule Discussion Thread',
      urlOrReference: 'https://lists.iana.org/hyperkitty/list/tz@iana.org/thread/Y6YDR3PU5PF3YXD6FMWIRYNW22VGSON6/',
      accessedAt: '2026-07-27',
      sourceTier: 'Tier 2',
      methodDisclosure: 'community_tz_discussion',
    },
    independence: {
      independentFromCurrentEngine: true,
      suspectedSharedDependency: false,
      independentlyReproducible: true,
    },
    rules: {
      timezone: 'Asia/Seoul',
      calendar: 'gregorian',
      dayBoundary: 'midnight_00:00',
      hourBoundary: 'standard_12_branches',
      leapMonthRule: 'not_applicable',
      schoolOrRuleSet: 'iana_tzdb_seoul',
    },
    declaredReviewStatus: 'verified_reference',
  },

  // 6. IANA 서울 1987 DST 불가능시각 (timezone_reference)
  {
    fixtureId: 'saju-ext-iana-seoul-1987-dst-gap',
    system: 'saju',
    referenceType: 'timezone_reference',
    scope: {
      targetFields: ['historicalTimezoneStatus'],
      applicablePeriod: '1987-05',
    },
    input: {
      localDate: '1987-05-10',
      localTime: '02:30',
      timezone: 'Asia/Seoul',
    },
    expected: {
      historicalTimezoneStatus: 'dst_nonexistent_local_time',
    },
    source: {
      title: 'IANA Asia/Seoul Historical Timezone Database Discussion',
      organizationOrAuthor: 'IANA (Internet Assigned Numbers Authority)',
      publisherId: 'pub-iana',
      referenceDocumentId: 'doc-iana-tz-discussion-2019',
      editionOrVersion: 'tz-discussion 2019',
      publicationDate: '2019-08-07',
      pageOrTableOrSection: 'Asia/Seoul 1987 DST Start Gap Discussion Thread',
      urlOrReference: 'https://lists.iana.org/hyperkitty/list/tz@iana.org/thread/Y6YDR3PU5PF3YXD6FMWIRYNW22VGSON6/',
      accessedAt: '2026-07-27',
      sourceTier: 'Tier 2',
      methodDisclosure: 'community_tz_discussion',
    },
    independence: {
      independentFromCurrentEngine: true,
      suspectedSharedDependency: false,
      independentlyReproducible: true,
    },
    rules: {
      timezone: 'Asia/Seoul',
      calendar: 'gregorian',
      dayBoundary: 'midnight_00:00',
      hourBoundary: 'standard_12_branches',
      leapMonthRule: 'not_applicable',
      schoolOrRuleSet: 'iana_tzdb_seoul',
    },
    declaredReviewStatus: 'verified_reference',
  },
])

// 호환성 유지: 기존 EXTERNAL_VALIDATION_FIXTURES 형태 수동 래퍼 export
export const EXTERNAL_VALIDATION_FIXTURES = Object.freeze({
  solarTerms: SAJU_EXTERNAL_FIXTURES
    .filter((f) => f.referenceType === 'astronomical_reference')
    .map((f) => ({
      id: f.fixtureId,
      source: f.source.title,
      sourceUrl: f.source.urlOrReference,
      localDate: f.input.localDate,
      localTime: f.input.localTime,
      timezone: f.input.timezone,
      longitude: f.input.longitude,
      toleranceMinutes: f.expected.toleranceMinutes,
    })),
  dayPillars: SAJU_EXTERNAL_FIXTURES
    .filter((f) => f.referenceType === 'calendar_conversion_reference' && f.expected.dayPillar)
    .map((f) => ({
      id: f.fixtureId,
      source: f.source.title,
      sourceUrl: f.source.urlOrReference,
      birthDate: f.input.birthDate,
      expectedDayPillar: f.expected.dayPillar,
    })),
  lunarConversions: SAJU_EXTERNAL_FIXTURES
    .filter((f) => f.referenceType === 'calendar_conversion_reference' && f.expected.solarDate)
    .map((f) => ({
      id: f.fixtureId,
      source: f.source.title,
      sourceUrl: f.source.urlOrReference,
      lunarDate: `${f.input.lunarYear}-${String(f.input.lunarMonth).padStart(2, '0')}-${String(f.input.lunarDay).padStart(2, '0')}`,
      isLeapMonth: f.input.isLeapMonth,
      expectedSolarDate: f.expected.solarDate,
    })),
  historicalTime: SAJU_EXTERNAL_FIXTURES
    .filter((f) => f.referenceType === 'timezone_reference')
    .map((f) => ({
      id: f.fixtureId,
      source: f.source.title,
      sourceUrl: f.source.urlOrReference,
      localDate: f.input.localDate,
      localTime: f.input.localTime,
      expectedStatus: f.expected.historicalTimezoneStatus,
    })),
})

// 이 파일의 기대값은 현재 엔진이 생성한 값을 복사한 회귀 fixture가 아니다.
// 각 항목은 외부 공개 자료를 기준으로 수동 기록하고, sourceUrl을 함께 보존한다.
export const EXTERNAL_VALIDATION_FIXTURES = Object.freeze({
  solarTerms: [
    {
      id: 'hko-2026-spring-commences',
      source: 'Hong Kong Observatory Almanac 2026 · February',
      sourceUrl: 'https://www.hko.gov.hk/tc/gts/astron2026/files/2026cal02.pdf',
      localDate: '2026-02-04',
      localTime: '04:02',
      timezone: 'Asia/Hong_Kong',
      longitude: 315,
      toleranceMinutes: 15,
    },
  ],
  dayPillars: [
    {
      id: 'hko-2026-02-01-day-pillar',
      source: 'Hong Kong Observatory Almanac 2026 · Chinese calendar day column',
      sourceUrl: 'https://www.hko.gov.hk/tc/gts/astron2026/files/2026cal02.pdf',
      birthDate: '2026-02-01',
      expectedDayPillar: '병오',
    },
  ],
  lunarConversions: [
    {
      id: 'hko-2026-lunar-new-year',
      source: 'Hong Kong Observatory Gregorian-Lunar Calendar Conversion Table 2026',
      sourceUrl: 'https://www.hko.gov.hk/en/gts/time/calendar/pdf/files/2026e.pdf',
      lunarDate: '2026-01-01',
      isLeapMonth: false,
      expectedSolarDate: '2026-02-17',
    },
    {
      id: 'hko-2026-sixth-month-start',
      source: 'Hong Kong Observatory Gregorian-Lunar Calendar Conversion Table 2026',
      sourceUrl: 'https://www.hko.gov.hk/en/gts/time/calendar/pdf/files/2026e.pdf',
      lunarDate: '2026-06-01',
      isLeapMonth: false,
      expectedSolarDate: '2026-07-14',
    },
    {
      id: 'hko-2026-sixth-month-midpoint',
      source: 'Hong Kong Observatory Gregorian-Lunar Calendar Conversion Table 2026',
      sourceUrl: 'https://www.hko.gov.hk/en/gts/time/calendar/pdf/files/2026e.pdf',
      lunarDate: '2026-06-16',
      isLeapMonth: false,
      expectedSolarDate: '2026-07-29',
    },
  ],
  historicalTime: [
    {
      id: 'iana-seoul-1987-dst-overlap',
      source: 'IANA Asia/Seoul historical timezone discussion',
      sourceUrl: 'https://lists.iana.org/hyperkitty/list/tz@iana.org/thread/Y6YDR3PU5PF3YXD6FMWIRYNW22VGSON6/',
      localDate: '1987-10-11',
      localTime: '02:30',
      expectedStatus: 'dst_ambiguous_local_time',
    },
    {
      id: 'iana-seoul-1987-dst-gap',
      source: 'IANA Asia/Seoul historical timezone discussion',
      sourceUrl: 'https://lists.iana.org/hyperkitty/list/tz@iana.org/thread/Y6YDR3PU5PF3YXD6FMWIRYNW22VGSON6/',
      localDate: '1987-05-10',
      localTime: '02:30',
      expectedStatus: 'dst_nonexistent_local_time',
    },
  ],
})

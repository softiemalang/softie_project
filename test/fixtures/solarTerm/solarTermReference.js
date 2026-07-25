/**
 * solarTermReference.js
 * 24절기 표준 입절 시각(UTC/KST)과 Meeus-NOAA 산출 시각 간 오차 측정 독립 픽스처 데이터셋.
 */

export const SOLAR_TERM_REFERENCE_FIXTURES = [
  {
    id: 'st-2026-ipchun',
    term: '입춘',
    description: '2026년 입춘 입절 시각 (2026-02-03 19:55 UTC / KST 04:55)',
    source: 'external_reference_dataset',
    status: 'verified',
    expectedUtcIso: '2026-02-03T19:55:55.680Z',
    input: { year: 2026, month: 2, day: 4, hour: 4, min: 55 },
  },
  {
    id: 'st-2025-ipchun',
    term: '입춘',
    description: '2025년 입춘 입절 시각 (2025-02-03 14:10 UTC / KST 23:10)',
    source: 'external_reference_dataset',
    status: 'verified',
    expectedUtcIso: '2025-02-03T14:10:00.000Z',
    input: { year: 2025, month: 2, day: 3, hour: 23, min: 10 },
  },
  {
    id: 'st-2026-cheongmyeong',
    term: '청명',
    description: '2026년 청명 입절 시각 (2026-04-04 18:28 UTC / KST 03:28)',
    source: 'external_reference_dataset',
    status: 'verified',
    expectedUtcIso: '2026-04-04T18:28:32.108Z',
    input: { year: 2026, month: 4, day: 5, hour: 3, min: 28 },
  },
  {
    id: 'st-pending-1950-ipchun',
    term: '입춘',
    description: '1950년 역사 입춘 관찰 픽스처',
    source: 'KASI_reference_pending_validation',
    status: 'pending_validation',
    expectedUtcIso: '1950-02-04T09:20:00.000Z',
    input: { year: 1950, month: 2, day: 4, hour: 18, min: 20 },
  },
]

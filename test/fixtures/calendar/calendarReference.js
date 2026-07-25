/**
 * calendarReference.js
 * 음양력 양방향(lunar2solar, solar2lunar) 변환 정밀 검증용 독립 픽스처 데이터셋.
 *
 * 원칙:
 * - status가 'verified'인 항목만 단정(assert) 기반 자동 검증을 수행합니다.
 * - status가 'pending_validation'인 항목은 대조 대기 관찰 항목으로 처리됩니다.
 */

export const CALENDAR_REFERENCE_FIXTURES = [
  // --- 1. Verified Core Cases (검증 완료 대표 기준일) ---
  {
    id: 'cal-2025-lunar-new-year',
    description: '2025년 음력 설날 (음 2025-01-01 -> 양 2025-01-29)',
    source: 'external_reference_dataset',
    status: 'verified',
    lunar: { year: 2025, month: 1, day: 1, isLeapMonth: false },
    solar: { year: 2025, month: 1, day: 29 },
  },
  {
    id: 'cal-2025-chuseok',
    description: '2025년 음력 추석 (음 2025-08-15 -> 양 2025-10-06)',
    source: 'external_reference_dataset',
    status: 'verified',
    lunar: { year: 2025, month: 8, day: 15, isLeapMonth: false },
    solar: { year: 2025, month: 10, day: 6 },
  },
  {
    id: 'cal-1984-leap-month',
    description: '1984년 윤10월 윤달 시작 케이스 (음 1984-10-01 윤달 -> 양 1984-11-23)',
    source: 'external_reference_dataset',
    status: 'verified',
    lunar: { year: 1984, month: 10, day: 1, isLeapMonth: true },
    solar: { year: 1984, month: 11, day: 23 },
  },
  {
    id: 'cal-1995-lunar-year-boundary',
    description: '1995년 설날 직전 음력 연도 경계 (음 1994-12-30 -> 양 1995-01-30)',
    source: 'external_reference_dataset',
    status: 'verified',
    lunar: { year: 1994, month: 12, day: 30, isLeapMonth: false },
    solar: { year: 1995, month: 1, day: 30 },
  },
  {
    id: 'cal-2023-leap-2nd-month',
    description: '2023년 윤2월 경계 케이스 (음 2023-02-15 윤달 -> 양 2023-04-05)',
    source: 'external_reference_dataset',
    status: 'verified',
    lunar: { year: 2023, month: 2, day: 15, isLeapMonth: true },
    solar: { year: 2023, month: 4, day: 5 },
  },

  // --- 2. Pending Validation Observation Cases (검증 대기 관찰 케이스) ---
  {
    id: 'cal-pending-2031-leap-month',
    description: '2031년 미래 윤3월 검증 대기 픽스처',
    source: 'KASI_reference_pending_validation',
    status: 'pending_validation',
    lunar: { year: 2031, month: 3, day: 1, isLeapMonth: true },
    solar: { year: 2031, month: 4, day: 22 },
  },
  {
    id: 'cal-pending-1960-leap-month',
    description: '1960년 역사 윤6월 검증 대기 픽스처',
    source: 'KASI_reference_pending_validation',
    status: 'pending_validation',
    lunar: { year: 1960, month: 6, day: 1, isLeapMonth: true },
    solar: { year: 1960, month: 7, day: 24 },
  },
]

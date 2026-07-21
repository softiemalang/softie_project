export const INTERPRETATION_PREP_SCHEMA_VERSION = '1.1.0'
export const SAJU_ADAPTER_VERSION = 'saju-adapter-1.1.0'

export const SYSTEMS = [
  { id: 'saju', label: '사주', shortLabel: '四柱' },
  { id: 'ziwei', label: '자미두수', shortLabel: '紫微' },
  { id: 'astrology', label: '서양 점성학', shortLabel: 'ASTRO' },
]

export const TOPICS = [
  { id: 'overall', label: '전체 성향', tags: [] },
  { id: 'love', label: '연애와 관계', tags: ['relationship', 'emotion'] },
  { id: 'social', label: '대인관계와 사회적 이미지', tags: ['relationship', 'social'] },
  { id: 'career', label: '직업과 적성', tags: ['career', 'social'] },
  { id: 'money', label: '재정과 가치관', tags: ['money', 'career'] },
  { id: 'emotion', label: '감정과 내면', tags: ['emotion', 'identity'] },
  { id: 'year', label: '특정 연도', tags: ['timing'] },
  { id: 'month', label: '특정 월', tags: ['timing'] },
  { id: 'day', label: '특정 날짜', tags: ['timing'] },
  { id: 'custom', label: '사용자 지정 질문', tags: [] },
]

export const DEFAULT_INPUT = {
  subjectName: '',
  birthDate: '',
  birthTime: '',
  placeName: '서울',
  timezone: 'Asia/Seoul',
  latitude: '37.5665',
  longitude: '126.9780',
  gender: 'unspecified',
  calendar: 'solar',
  source: '본인 또는 가족의 기록',
  timeAccuracy: 'exact',
}

export const DEFAULT_PROFILES = {
  saju: {
    profileVersion: 'softie-saju-kst-v2',
    calendarConversion: '양력 입력',
    solarTerms: 'NOAA·Meeus 겉보기 태양 황경 근사식 기반 절기 월',
    ipchunBoundary: '입춘 315° 경계',
    timezone: 'Asia/Seoul 고정',
    trueSolarTime: '서울 기준 고정 30분 평균태양시 보정(좌표·균시차 미반영)',
    ziHourRule: '23:30 자시 시작 및 일주 변경',
    luckDirection: '미지원',
    luckStartAge: '미지원',
    hiddenStemRules: 'softie constants v1',
    tenGodRules: 'softie core v2.2',
  },
  ziwei: {
    profileVersion: 'unconfigured',
    lunarConversion: '기준 선택 필요',
    leapMonth: '기준 선택 필요',
    palaceRules: '기준 선택 필요',
    transformations: '기준 선택 필요',
    starPlacement: '기준 선택 필요',
  },
  astrology: {
    profileVersion: 'draft-profile-v1',
    zodiac: 'tropical',
    perspective: 'geocentric',
    houseSystem: 'placidus',
    nodeType: 'true',
    ephemeris: '미선택',
    aspectRules: '미선택',
  },
}

export const STATUS_META = {
  complete: { label: '계산 완료', tone: 'success' },
  partial: { label: '부분 지원', tone: 'warning' },
  needs_verification: { label: '검증 필요', tone: 'warning' },
  unsupported: { label: '미지원', tone: 'muted' },
  missing_input: { label: '입력값 부족', tone: 'danger' },
  needs_profile: { label: '기준 선택 필요', tone: 'danger' },
}

export function createEmptySystemResult(system, status, warnings = []) {
  return {
    system,
    status,
    engine: null,
    raw: null,
    features: [],
    warnings,
    unsupported: [],
  }
}

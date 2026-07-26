import { getSystemCapabilities } from './engineCapabilities.js'
import { resolveSystemStatus, resolveStateContract } from './statusResolver.js'

export const INTERPRETATION_PREP_SCHEMA_VERSION = '1.10.0'
export const SAJU_ADAPTER_VERSION = 'saju-adapter-1.9.0'
export { resolveStateContract }


// Korea Meteorological Administration observation-station coordinates.
// correctionMinutes is a compact display value. Calculations use the exact longitude below.
export const KOREA_REFERENCE_CITIES = [
  { id: 'seoul', label: '서울', latitude: 37.57, longitude: 126.97, correctionMinutes: 32 },
  { id: 'gwangmyeong', label: '광명', latitude: 37.48, longitude: 126.87, correctionMinutes: 33 },
  { id: 'incheon', label: '인천', latitude: 37.48, longitude: 126.63, correctionMinutes: 33 },
  { id: 'daejeon', label: '대전', latitude: 36.37, longitude: 127.37, correctionMinutes: 31 },
  { id: 'gwangju', label: '광주', latitude: 35.17, longitude: 126.89, correctionMinutes: 32 },
  { id: 'daegu', label: '대구', latitude: 35.88, longitude: 128.62, correctionMinutes: 26 },
  { id: 'ulsan', label: '울산', latitude: 35.56, longitude: 129.32, correctionMinutes: 23 },
  { id: 'busan', label: '부산', latitude: 35.10, longitude: 129.03, correctionMinutes: 24 },
  { id: 'jeju', label: '제주', latitude: 33.51, longitude: 126.53, correctionMinutes: 34 },
]

export function getKoreaReferenceCity(cityId) {
  return KOREA_REFERENCE_CITIES.find((city) => city.id === cityId) || KOREA_REFERENCE_CITIES[0]
}

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
  birthTimeStart: '',
  birthTimeEnd: '',
  targetDate: '',
  placeName: '대한민국',
  referenceCity: 'seoul',
  timezone: 'Asia/Seoul',
  latitude: '37.57',
  longitude: '126.97',
  gender: 'unspecified',
  calendar: 'solar',
  isLeapMonth: false,
  timeAccuracy: 'exact',
}

export const DEFAULT_PROFILES = {
  saju: {
    profileVersion: 'softie-saju-standard-v1.4',
    calendarConversion: '양력 입력',
    solarTerms: 'NOAA·Meeus 겉보기 태양 황경 근사식 기반 절기 월',
    ipchunBoundary: '입춘 315° 경계',
    timezone: 'Asia/Seoul · 1961-08-10 이전 검증 필요 · 1987~1988 DST 조건부 검증',
    trueSolarTime: '기준 도시 정확 경도 보정 + NOAA 날짜별 균시차 · 주요 도시 후보 비교',
    ziHourRule: '진태양시 23:00~01:00 자시 · 자정 전 야자/자정 후 조자 분리 · 자정에 일주 변경',
    luckDirection: '연간 음양·성별 기준 양남음녀 순행, 음남양녀 역행',
    luckStartAge: '순행 다음 절·역행 이전 절까지 3일당 1년 환산',
    periodPillars: '기준일 세운·월운·일진, 절입 당일 후보 및 원국·기간 간 관계 계산',
    twelveStages: '일간 기준 양간 순행·음간 역행',
    hiddenStemRules: 'softie constants v1',
    tenGodRules: '천간 및 지지 본기 지장간 기준',
    branchRelationRules: 'softie natal branch relations v2 · 관계 존재와 제한된 합화 후보 계산 · 방합의 실제 오행 전환 미판정',
  },
  ziwei: {
    profileVersion: 'ziwei-fixed-ruleset-experimental-v1',
    lunarConversion: '로컬 음력 변환 테이블 · 독립 외부 대조 전',
    leapMonth: 'mid_month_split · 후보 경고 보존',
    palaceRules: 'standard_month_hour · traditional_v1',
    transformations: '고정 생년간 사화표',
    starPlacement: 'standard_ziwei_tianfu',
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
  partial: { label: '핵심 계산 지원', tone: 'warning' },
  needs_verification: { label: '검증 필요', tone: 'warning' },
  candidate_required: { label: '후보 확인 필요', tone: 'warning' },
  experimental: { label: '검토 중', tone: 'warning' },
  available: { label: '사용 가능', tone: 'success' },
  unavailable: { label: '사용 불가', tone: 'muted' },
  simulation_only: { label: '시뮬레이션 전용', tone: 'warning' },
  simulation_blocked: { label: '시뮬레이션 차단', tone: 'muted' },
  adapter_required: { label: '어댑터 필요', tone: 'muted' },
  insufficient_data: { label: '자료 부족', tone: 'warning' },
  unsupported: { label: '미지원', tone: 'muted' },
  missing_input: { label: '입력값 부족', tone: 'danger' },
  needs_profile: { label: '기준 선택 필요', tone: 'danger' },
}

export function createEmptySystemResult(system, requestedStatus, warnings = []) {
  const capabilities = getSystemCapabilities(system)
  const status = resolveSystemStatus({ system, requestedStatus })

  const isMissingInput = status === 'missing_input' || requestedStatus === 'missing_input'
  const isCandidate = status === 'candidate_required'

  let stateContract
  if (system === 'ziwei') {
    stateContract = resolveStateContract({
      inputStatus: isMissingInput ? 'missing_input' : 'valid',
      calculationStatus: status === 'unsupported' ? 'unsupported' : 'failed',
      verificationStatus: isCandidate ? 'candidate_required' : 'needs_external_verification',
      interpretationStatus: 'candidate_only',
      confidence: 'low',
    })
  } else if (system === 'saju') {
    stateContract = resolveStateContract({
      inputStatus: isMissingInput ? 'missing_input' : 'valid',
      calculationStatus: status === 'unsupported' ? 'unsupported' : (status === 'partial' ? 'partial' : 'failed'),
      verificationStatus: isCandidate ? 'candidate_required' : 'needs_verification',
      interpretationStatus: 'candidate_only',
      confidence: 'low',
    })
  } else {
    stateContract = resolveStateContract({
      inputStatus: isMissingInput ? 'missing_input' : 'valid',
      calculationStatus: status === 'unsupported' ? 'unsupported' : 'failed',
      verificationStatus: 'needs_verification',
      interpretationStatus: 'candidate_only',
      confidence: 'low',
    })
  }

  const supportScope = system === 'ziwei' ? {
    timingStatus: 'unsupported',
    brightnessStatus: 'unsupported',
    extendedMinorStarsStatus: 'unsupported',
    supported: [],
  } : null

  return {
    system,
    status,
    stateContract,
    capabilities,
    engine: null,
    raw: null,
    features: [],
    warnings,
    unsupported: [],
    supportScope,
  }
}

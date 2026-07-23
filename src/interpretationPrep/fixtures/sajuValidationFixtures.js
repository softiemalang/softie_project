/**
 * Saju Validation Fixtures - Golden & Regression Cases
 *
 * Version: saju-validation-fixtures-v0.1.0
 */

export const SAJU_VALIDATION_FIXTURE_VERSION = 'saju-validation-fixtures-v0.1.0';

/**
 * [엄격한 학술적 신뢰수준 계약 가이드]
 * 향후 특정 픽스처를 'verified' 상태로 사용하거나 승격하기 위해서는,
 * 단순 기관명 기재를 넘어 아래의 확장 속성들이 완벽하게 기재되어야 합니다.
 *
 * 필수 스키마 확장 항목:
 * - sourceTitle (예: "한국민족문화대백과사전 칠정산편")
 * - sourceOrganization (예: "한국학중앙연구원")
 * - sourceReference (예: "조선전기 성종대 일월식 계산 규격 조항")
 * - verifiedPaths (직접 대조를 수행하여 보증하는 dot path 목록)
 * - verificationNotes (대조 프로세스에 대한 검증 보고 기록)
 */

export const sajuValidationFixtures = [
  {
    id: 'val-solar-normal',
    title: '일반 양력 출생 및 고정 원국 대조',
    category: 'solar_normal',
    description: '1997년 4월 21일 14:40 양력 출생의 4주 정밀 간지 및 일간 상태 검증',
    input: {
      subjectName: '고정 테스트',
      birthDate: '1997-04-21',
      birthTime: '14:40',
      targetDate: '2026-07-21',
      placeName: '서울',
      referenceCity: 'seoul',
      timezone: 'Asia/Seoul',
      latitude: '37.5665',
      longitude: '126.9780',
      gender: 'male',
      calendar: 'solar',
      timeAccuracy: 'exact'
    },
    expectedPaths: [
      'systems.saju.raw.pillars.year.referenceValue',
      'systems.saju.raw.pillars.month.referenceValue',
      'systems.saju.raw.pillars.day.referenceValue',
      'systems.saju.raw.pillars.hour.referenceValue',
      'systems.saju.raw.dayMaster.stem',
      'systems.saju.status'
    ],
    expected: {
      'systems.saju.raw.pillars.year.referenceValue': '정축',
      'systems.saju.raw.pillars.month.referenceValue': '갑진',
      'systems.saju.raw.pillars.day.referenceValue': '계사',
      'systems.saju.raw.pillars.hour.referenceValue': '기미',
      'systems.saju.raw.dayMaster.stem': '계',
      'systems.saju.status': 'experimental'
    },
    verificationStatus: 'regression_only', // 컨텍스트 내 실증 문서 부재에 따라 regression_only로 안전 하향
    source: '현재 엔진 회귀 기준값',
    notes: '기존 테스트에서 검증용 기준 명식으로 삼은 정축 갑진 계사 기미 구조를 정밀하게 고정 대조함.',
    tags: ['solar', 'regression', 'fixed_fixture']
  },
  {
    id: 'val-lunar-normal',
    title: '일반 음력 평달 변환 및 사주 산출',
    category: 'lunar_normal',
    description: '음력 1984년 10월 22일 11:30 평달 출생이 양력 1984년 11월 14일로 정확히 변환되어 갑자시가 산출되는지 검증',
    input: {
      subjectName: '음력 평달',
      birthDate: '1984-10-22',
      birthTime: '11:30',
      targetDate: '2026-07-21',
      placeName: '서울',
      referenceCity: 'seoul',
      timezone: 'Asia/Seoul',
      latitude: '37.5665',
      longitude: '126.9780',
      gender: 'female',
      calendar: 'lunar',
      isLeapMonth: false,
      timeAccuracy: 'exact'
    },
    expectedPaths: [
      'input.lunarConversion.convertedSolarDate',
      'systems.saju.raw.pillars.year.referenceValue',
      'systems.saju.raw.pillars.month.referenceValue',
      'systems.saju.raw.pillars.day.referenceValue',
      'systems.saju.raw.pillars.hour.referenceValue'
    ],
    expected: {
      'input.lunarConversion.convertedSolarDate': '1984-11-14',
      'systems.saju.raw.pillars.year.referenceValue': '갑자',
      'systems.saju.raw.pillars.month.referenceValue': '을해',
      'systems.saju.raw.pillars.day.referenceValue': '임자',
      'systems.saju.raw.pillars.hour.referenceValue': '병오'
    },
    verificationStatus: 'regression_only', // 컨텍스트 내 실증 문서 부재에 따라 regression_only로 안전 하향
    source: '현재 엔진 회귀 기준값',
    notes: '음력 10월 평달은 양력 11월 14일 임자일이며, 진태양시 적용 시 병오시로 정상 성립.',
    tags: ['lunar', 'regression']
  },
  {
    id: 'val-lunar-leap',
    title: '음력 윤달 변환 정합성 검증',
    category: 'lunar_leap_month',
    description: '음력 1984년 윤10월 22일 출생이 양력 1984년 12월 14일 기축일로 변환되는지 대조',
    input: {
      subjectName: '음력 윤달',
      birthDate: '1984-10-22',
      birthTime: '11:30',
      targetDate: '2026-07-21',
      placeName: '서울',
      referenceCity: 'seoul',
      timezone: 'Asia/Seoul',
      latitude: '37.5665',
      longitude: '126.9780',
      gender: 'male',
      calendar: 'lunar',
      isLeapMonth: true,
      timeAccuracy: 'exact'
    },
    expectedPaths: [
      'input.lunarConversion.convertedSolarDate',
      'systems.saju.raw.pillars.day.referenceValue'
    ],
    expected: {
      'input.lunarConversion.convertedSolarDate': '1984-12-14',
      'systems.saju.raw.pillars.day.referenceValue': '임오'
    },
    verificationStatus: 'regression_only', // 컨텍스트 내 실증 문서 부재에 따라 regression_only로 안전 하향
    source: '현재 엔진 회귀 기준값',
    notes: '1984년 윤10월은 실제 존재하며, 양력 12월 14일 임오일에 대치됨.',
    tags: ['lunar', 'leap_month', 'regression']
  },
  {
    id: 'val-lunar-year-boundary',
    title: '음력 연도 설날 전후 세수(歲首) 경계',
    category: 'lunar_year_boundary',
    description: '음력 1995년 1월 1일(설날 당일)이 양력 1995년 1월 31일로 정상 치환되고 입춘 전에 따른 세수 교정 검증',
    input: {
      subjectName: '설날 경계',
      birthDate: '1995-01-01',
      birthTime: '10:30',
      targetDate: '2026-07-21',
      placeName: '서울',
      referenceCity: 'seoul',
      timezone: 'Asia/Seoul',
      latitude: '37.5665',
      longitude: '126.9780',
      gender: 'female',
      calendar: 'lunar',
      isLeapMonth: false,
      timeAccuracy: 'exact'
    },
    expectedPaths: [
      'input.lunarConversion.convertedSolarDate',
      'systems.saju.raw.pillars.year.referenceValue'
    ],
    expected: {
      'input.lunarConversion.convertedSolarDate': '1995-01-31',
      'systems.saju.raw.pillars.year.referenceValue': '갑술' // 1995년 을해년 설날 당일이지만 입춘(2/4) 전이므로 갑술년 유지됨
    },
    verificationStatus: 'regression_only', // 컨텍스트 내 실증 문서 부재에 따라 regression_only로 안전 하향
    source: '현재 엔진 회귀 기준값',
    notes: '음력 설날 당일이나 절기법 상 세수(연주)는 입춘시에 변경되므로 갑술년이 그대로 산출되는 것이 맞음.',
    tags: ['lunar', 'year_boundary', 'solar_term', 'regression']
  },
  {
    id: 'val-lunar-invalid-date',
    title: '존재하지 않는 음력 날짜 거부 검사',
    category: 'lunar_invalid_date',
    description: '윤달이 존재하지 않는 1995년 음력 윤5월 15일 입력 시의 예외적 거부 정책 검증',
    input: {
      subjectName: '가짜 윤달',
      birthDate: '1995-05-15',
      birthTime: '12:00',
      targetDate: '2026-07-21',
      placeName: '서울',
      referenceCity: 'seoul',
      timezone: 'Asia/Seoul',
      latitude: '37.5665',
      longitude: '126.9780',
      gender: 'male',
      calendar: 'lunar',
      isLeapMonth: true,
      timeAccuracy: 'exact'
    },
    expectedPaths: [],
    expected: {},
    expectedError: {
      substring: '음력 윤달이 아닙니다' // 예외 기대 부분 문자열 등록 완료
    },
    verificationStatus: 'regression_only',
    source: '현재 엔진 회귀 기준값',
    notes: '입력 유효성 검증 단(validatePrepInput)에서 가짜 윤달은 가로막혀 에러를 방지하게 됨.',
    tags: ['lunar', 'validation_error', 'regression']
  },
  {
    id: 'val-solar-term-boundary',
    title: '입춘 절입 시각 전후 경계 민감성',
    category: 'solar_term_boundary',
    description: '입춘 시각 근방 출생 시 경계 불확실성 플래그 및 후보 명식의 기록성 검증',
    input: {
      subjectName: '절입 경계',
      birthDate: '1997-02-04',
      birthTime: '04:00',
      targetDate: '2026-07-21',
      placeName: '서울',
      referenceCity: 'seoul',
      timezone: 'Asia/Seoul',
      latitude: '37.5665',
      longitude: '126.9780',
      gender: 'male',
      calendar: 'solar',
      timeAccuracy: 'exact'
    },
    expectedPaths: [
      'systems.saju.raw.calculationUncertainty.solarTermBoundary.status'
    ],
    expected: {
      'systems.saju.raw.calculationUncertainty.solarTermBoundary.status': 'candidate_required'
    },
    verificationStatus: 'regression_only',
    source: '현재 엔진 회귀 기준값',
    notes: '입춘 시간 근방의 ±20분 구간에 걸리게 되므로 자동 경계 후보 등록 대상이 됨.',
    tags: ['solar_term', 'uncertainty', 'regression']
  },
  {
    id: 'val-solar-midnight-boundary',
    title: '진태양시 자정 경계 야자시/조자시 분기',
    category: 'solar_midnight_boundary',
    description: '진태양시 자정 전(야자시)과 자정 후(조자시)에 따른 일간 및 일주 유지 여부 검증',
    input: {
      subjectName: '야자시 조자시',
      birthDate: '1997-04-20',
      birthTime: '23:45',
      targetDate: '2026-07-21',
      placeName: '서울',
      referenceCity: 'seoul',
      timezone: 'Asia/Seoul',
      latitude: '37.5665',
      longitude: '126.9780',
      gender: 'male',
      calendar: 'solar',
      timeAccuracy: 'exact'
    },
    expectedPaths: [
      'systems.saju.raw.timeBoundary.ziPeriodLabel'
    ],
    expected: {
      'systems.saju.raw.timeBoundary.ziPeriodLabel': '야자'
    },
    verificationStatus: 'regression_only',
    source: '현재 엔진 회귀 기준값',
    notes: '23:45분 출생 시 진태양시 기준 야자시가 검출되어 다음 날로 넘어가지 않고 본래 일간을 유지함.',
    tags: ['midnight', 'zi_hour', 'regression']
  },
  {
    id: 'val-birth-time-unknown',
    title: '출생시각 미상 시의 시주 제외 조치',
    category: 'birth_time_unknown',
    description: 'timeAccuracy가 unknown인 경우 시주 간지를 제거하고 일지 후보 목록을 추출하는지 대조',
    input: {
      subjectName: '시간 모름',
      birthDate: '1997-04-21',
      birthTime: '12:00',
      targetDate: '2026-07-21',
      placeName: '서울',
      referenceCity: 'seoul',
      timezone: 'Asia/Seoul',
      latitude: '37.5665',
      longitude: '126.9780',
      gender: 'male',
      calendar: 'solar',
      timeAccuracy: 'unknown'
    },
    expectedPaths: [
      'systems.saju.raw.pillars.hour.status',
      'systems.saju.raw.pillars.hour.stem',
      'systems.saju.raw.pillars.hour.branch'
    ],
    expected: {
      'systems.saju.raw.pillars.hour.status': 'unknown',
      'systems.saju.raw.pillars.hour.stem': null,
      'systems.saju.raw.pillars.hour.branch': null
    },
    verificationStatus: 'regression_only',
    source: '현재 엔진 회귀 기준값',
    notes: '시간이 unknown이면 기둥의 status는 unknown이 되고 자정 전후 변화량을 감안해 일주 후보군을 유지함.',
    tags: ['unknown_time', 'regression']
  },
  {
    id: 'val-historical-standard-time',
    title: '1961-08-10 이전 역사 표준시 제한 및 경보',
    category: 'historical_standard_time',
    description: '1955년 출생 시 자오선 변경 이력에 따른 검증 상태(requiresVerification) 및 설명구 정상 출력 대조',
    input: {
      subjectName: '역사 표준시',
      birthDate: '1955-06-15',
      birthTime: '14:30',
      targetDate: '2026-07-21',
      placeName: '서울',
      referenceCity: 'seoul',
      timezone: 'Asia/Seoul',
      latitude: '37.5665',
      longitude: '126.9780',
      gender: 'female',
      calendar: 'solar',
      timeAccuracy: 'exact'
    },
    expectedPaths: [
      'systems.saju.raw.calculationUncertainty.historicalTimezone.requiresVerification'
    ],
    expected: {
      'systems.saju.raw.calculationUncertainty.historicalTimezone.requiresVerification': true
    },
    verificationStatus: 'regression_only',
    source: '현재 엔진 회귀 기준값',
    notes: '1961-08-10 이전 출생자는 한국천문연구원 공식 검증 대상 범위 외이므로 무조건 검증필요로 분기함.',
    tags: ['historical', 'standard_time', 'regression']
  },
  {
    id: 'val-summer-time-check',
    title: '1987-1988 서머타임 차감 확인',
    category: 'summer_time_check',
    description: '서머타임이 시행 중이던 1987년 6월 15일 12:30의 한 시간 차감 분기 조건 검증',
    input: {
      subjectName: '서머타임',
      birthDate: '1987-06-15',
      birthTime: '12:30',
      targetDate: '2026-07-21',
      placeName: '서울',
      referenceCity: 'seoul',
      timezone: 'Asia/Seoul',
      latitude: '37.5665',
      longitude: '126.9780',
      gender: 'male',
      calendar: 'solar',
      timeAccuracy: 'exact'
    },
    expectedPaths: [
      'systems.saju.raw.calculationUncertainty.historicalTimezone.status'
    ],
    expected: {
      'systems.saju.raw.calculationUncertainty.historicalTimezone.status': 'dst_changes_core_pillars'
    },
    verificationStatus: 'regression_only',
    source: '현재 엔진 회귀 기준값',
    notes: '87년 및 88년 서머타임 시각에 탄력 차감이 작동해야 하므로 status가 dst_changes_core_pillars로 출력.',
    tags: ['historical', 'dst', 'regression']
  },
  {
    id: 'val-repeating-stems',
    title: '동일 천간 자가 합·충 오판 배제 검사',
    category: 'repeating_stems',
    description: '갑-갑 천간 중복 원국에서 천간합이나 천간충 관계가 오판 검출되지 않는지 확인',
    input: {
      subjectName: '갑갑 중복',
      birthDate: '1974-10-25', // 갑술월 갑인일 처럼 갑이 중복되는 생일
      birthTime: '00:30',
      targetDate: '2026-07-21',
      placeName: '서울',
      referenceCity: 'seoul',
      timezone: 'Asia/Seoul',
      latitude: '37.5665',
      longitude: '126.9780',
      gender: 'male',
      calendar: 'solar',
      timeAccuracy: 'exact'
    },
    expectedPaths: [
      'systems.saju.raw.stemRelations.items'
    ],
    expected: {
      'systems.saju.raw.stemRelations.items': [
        {
          id: 'year-day-천간합',
          relation: '천간합',
          label: '갑기합토',
          element: '토',
          stems: ['갑', '기'],
          positions: ['year', 'day'],
          positionLabels: ['연간', '일간'],
          assessment: {
            presence: true,
            establishment: false,
            transmutation: false,
            transformedElement: null,
            strengthLabel: '약함 (원격 격리)',
            description: '천간에서 갑과 기가 떨어져 있어 합(갑기합토)의 작용력을 낮게 기록함'
          }
        },
        {
          id: 'month-day-천간합',
          relation: '천간합',
          label: '갑기합토',
          element: '토',
          stems: ['갑', '기'],
          positions: ['month', 'day'],
          positionLabels: ['월간', '일간'],
          assessment: {
            presence: true,
            establishment: true,
            transmutation: true,
            transformedElement: '토',
            strengthLabel: '강함 (월지 생조)',
            description: '천간에서 갑과 기가 인접하여 합(갑기합토)을 이룸. 월지가 합화 오행을 생조하여 실제 오행 변환 개연성이 높음'
          }
        },
        {
          id: 'day-hour-천간합',
          relation: '천간합',
          label: '갑기합토',
          element: '토',
          stems: ['갑', '기'],
          positions: ['day', 'hour'],
          positionLabels: ['일간', '시간'],
          assessment: {
            presence: true,
            establishment: true,
            transmutation: true,
            transformedElement: '토',
            strengthLabel: '강함 (월지 생조)',
            description: '천간에서 기와 갑이 인접하여 합(갑기합토)을 이룸. 월지가 합화 오행을 생조하여 실제 오행 변환 개연성이 높음'
          }
        }
      ]
    },
    verificationStatus: 'regression_only',
    source: '현재 엔진 회귀 기준값',
    notes: '동일 천간 쌍 간에는 천간합/천간충 세션에서 items 리스트에 가짜 관계가 유입되지 않는지 확인.',
    tags: ['stems', 'combat_fake_relation', 'regression']
  },
  {
    id: 'val-branch-relation-basic',
    title: '지지 삼합 및 육합 검출 정합성 대조',
    category: 'branch_relation_basic',
    description: '정축 갑진 계사 기미 명조에서 축-진 파, 사-미 방합 경계 등의 지지 관계 리스트 정상 산출 확인',
    input: {
      subjectName: '지지합충',
      birthDate: '1997-04-21',
      birthTime: '14:40',
      targetDate: '2026-07-21',
      placeName: '서울',
      referenceCity: 'seoul',
      timezone: 'Asia/Seoul',
      latitude: '37.5665',
      longitude: '126.9780',
      gender: 'male',
      calendar: 'solar',
      timeAccuracy: 'exact'
    },
    expectedPaths: [
      'systems.saju.raw.branchRelations.ruleVersion'
    ],
    expected: {
      'systems.saju.raw.branchRelations.ruleVersion': 'softie-natal-branch-relations-v2'
    },
    verificationStatus: 'regression_only',
    source: '현재 엔진 회귀 기준값',
    notes: '자체 지지 짝 매핑 테이블에 따른 축진파, 사미방합 등 세부 지지 관계 원형 보존 검토용.',
    tags: ['branches', 'relations', 'regression']
  },
  {
    id: 'val-pending-external',
    title: '특수 경계 극신강 종격 검토 필요 대기 상태',
    category: 'pending_external',
    description: '화 비겁이 가득 찬 극단 명조가 종격 가능성 검토 대상(pending)으로 식별되는지 대기 상태 검증',
    input: {
      subjectName: '종격후보',
      birthDate: '1977-06-15',
      birthTime: '12:30',
      targetDate: '2026-07-21',
      placeName: '서울',
      referenceCity: 'seoul',
      timezone: 'Asia/Seoul',
      latitude: '37.5665',
      longitude: '126.9780',
      gender: 'male',
      calendar: 'solar',
      timeAccuracy: 'exact'
    },
    expectedPaths: [
      'systems.saju.raw.experimental.gyeokguk.type'
    ],
    expected: {
      'systems.saju.raw.experimental.gyeokguk.type': '정격'
    },
    verificationStatus: 'pending_external_verification',
    source: '외부 근거 또는 학술 검토 대기',
    notes: '신강 지수가 0점에 달하고 화 오행이 극도로 강한 극신강 사주가 현재 엔진의 종격 자동 판정 한계로 인해 추가 외부 검토 대상으로 올바르게 식별되는지 검증.',
    tags: ['pending_check', 'gyeokguk']
  },
];

import { getTenGod, getBranchMainStem } from '../saju/engine/core.js'

// 사주 표준 해석 프로필 연산 엔진 버전
export const SAJU_PROFILE_RULES_VERSION = 'softie-saju-profile-rules-v1.0'

export const ELEMENTS_MAP = {
  '갑': '목', '을': '목', '병': '화', '정': '화', '무': '토', '기': '토', '경': '금', '신': '금', '임': '수', '계': '수',
  '자': '수', '축': '토', '인': '목', '묘': '목', '진': '토', '사': '화', '오': '화', '미': '토', '신': '금', '유': '금', '술': '토', '해': '수'
}

export const YIN_YANG_MAP = {
  '갑': '양', '을': '음', '병': '양', '정': '음', '무': '양', '기': '음', '경': '양', '신': '음', '임': '양', '계': '음',
  '자': '양', '축': '음', '인': '양', '묘': '음', '진': '양', '사': '음', '오': '양', '미': '음', '신': '양', '유': '음', '술': '양', '해': '음'
}

export const JIJANGAN_MAP = {
  '자': { 여: '임', 중: null, 본: '계' },
  '축': { 여: '계', 중: '신', 본: '기' },
  '인': { 여: '무', 중: '병', 본: '갑' },
  '묘': { 여: '갑', 중: null, 본: '을' },
  '진': { 여: '을', 중: '계', 본: '무' },
  '사': { 여: '무', 중: '경', 본: '병' },
  '오': { 여: '병', 중: '기', 본: '정' },
  '미': { 여: '정', 중: '을', 본: '기' },
  '신': { 여: '무', 중: '임', 본: '경' },
  '유': { 여: '경', 중: null, 본: '신' },
  '술': { 여: '신', 중: '정', 본: '무' },
  '해': { 여: '무', 중: '갑', 본: '임' }
}

const GENERATES = { '목': '화', '화': '토', '토': '금', '금': '수', '수': '목' }
const CONTROLS = { '목': '토', '토': '수', '수': '화', '화': '금', '금': '목' }

// 1. 득령(得令) 판정
export function getDeungRyeong(dayMaster, monthBranch) {
  const me = ELEMENTS_MAP[dayMaster]
  const target = ELEMENTS_MAP[monthBranch]
  // 인성이거나 비겁이면 득령
  const isSelf = (me === target)
  const isResource = (GENERATES[target] === me)
  return isSelf || isResource
}

// 2. 득지(得地) 판정
export function getDeungJi(dayMaster, dayBranch) {
  const me = ELEMENTS_MAP[dayMaster]
  const target = ELEMENTS_MAP[dayBranch]
  const isSelf = (me === target)
  const isResource = (GENERATES[target] === me)
  return isSelf || isResource
}

// 3. 통근(通根) 및 투간(透干) 세부 분석
export function analyzeTongGeunAndTuGan(dayMaster, pillars) {
  const meElement = ELEMENTS_MAP[dayMaster]
  const result = {
    tongGeunPillars: [],
    tuGanStems: [],
  }

  const positions = ['year', 'month', 'day', 'hour']
  positions.forEach((pos) => {
    const pillar = pillars[pos]
    if (!pillar) return

    // 통근 확인 (지장간에 뿌리가 있는지)
    const branch = pillar.branch
    const jijangan = JIJANGAN_MAP[branch]
    if (jijangan) {
      const stemElements = [jijangan.여, jijangan.중, jijangan.본]
        .filter(Boolean)
        .map(s => ELEMENTS_MAP[s])
      
      const hasRoot = stemElements.includes(meElement) || stemElements.some(e => GENERATES[e] === meElement)
      if (hasRoot) {
        result.tongGeunPillars.push(pos)
      }
    }

    // 투간 확인 (지지 지장간의 글자가 천간에 올라왔는지)
    if (pos === 'month') {
      const monthBranch = pillar.branch
      const monthJijangan = JIJANGAN_MAP[monthBranch]
      if (monthJijangan) {
        const stemsToCheck = [monthJijangan.여, monthJijangan.중, monthJijangan.본].filter(Boolean)
        positions.forEach((otherPos) => {
          const otherPillar = pillars[otherPos]
          if (otherPillar && otherPillar.stem && stemsToCheck.includes(otherPillar.stem)) {
            result.tuGanStems.push({
              stem: otherPillar.stem,
              position: otherPos,
              jijanganType: monthJijangan.본 === otherPillar.stem ? '본기' : monthJijangan.중 === otherPillar.stem ? '중기' : '여기'
            })
          }
        })
      }
    }
  })

  return result
}

// 4. 신강·신약 점수 시스템 (100점 가중 만점)
export function calculateStrengthScore(dayMaster, pillars) {
  let score = 0
  const deungRyeong = pillars.month ? getDeungRyeong(dayMaster, pillars.month.branch) : false
  const deungJi = pillars.day ? getDeungJi(dayMaster, pillars.day.branch) : false

  // 1) 득령 가중치: 40점
  if (deungRyeong) score += 40

  // 2) 득지 가중치: 20점
  if (deungJi) score += 20

  // 3) 다른 기둥 통근 및 오행 배치 점수: 최대 40점
  const meElement = ELEMENTS_MAP[dayMaster]
  const positions = ['year', 'month', 'day', 'hour']
  
  positions.forEach((pos) => {
    const pillar = pillars[pos]
    if (!pillar) return

    // 천간 점수 (일간 제외 타 천간에 인성/비겁 배치 시 기둥당 8점)
    if (pos !== 'day' && pillar.stem) {
      const stemElement = ELEMENTS_MAP[pillar.stem]
      if (stemElement === meElement || GENERATES[stemElement] === meElement) {
        score += 8
      }
    }

    // 지지 점수 (월지/일지 제외 타 지지 통근 또는 인성/비겁 배치 시 기둥당 8점)
    if (pos !== 'month' && pos !== 'day' && pillar.branch) {
      const branchElement = ELEMENTS_MAP[pillar.branch]
      if (branchElement === meElement || GENERATES[branchElement] === meElement) {
        score += 8
      }
    }
  })

  // 점수 범위 0 ~ 100 보정
  score = Math.min(100, Math.max(0, score))

  let level = '평격 (Balanced)'
  let isStrong = false
  let isWeak = false
  let candidates = []

  if (score >= 55) {
    level = '신강 (Strong)'
    isStrong = true
    candidates = ['신강']
  } else if (score < 45) {
    level = '신약 (Weak)'
    isWeak = true
    candidates = ['신약']
  } else {
    level = '중화 경계 (Borderline)'
    candidates = ['신약', '신강']
  }

  return {
    score,
    level,
    deungRyeong,
    deungJi,
    isStrong,
    isWeak,
    candidates
  }
}

// 5. 격국(格局) 판정 알고리즘
export function determineGyeokguk(dayMaster, pillars) {
  if (!pillars.month) return { name: '불명', type: '정격', reason: '월주 데이터 없음' }

  const monthBranch = pillars.month.branch
  const jijangan = JIJANGAN_MAP[monthBranch]
  if (!jijangan) return { name: '불명', type: '정격', reason: '지장간 데이터 없음' }

  // 지장간 후보 목록: 본기, 중기, 여기 순서대로 투간 여부 판정
  const candidates = [
    { stem: jijangan.본, type: '본기', priority: 1 },
    { stem: jijangan.중, type: '중기', priority: 2 },
    { stem: jijangan.여, type: '여기', priority: 3 }
  ].filter(c => c.stem)

  const positions = ['year', 'month', 'hour'] // 일간 제외 투간 확인
  let selectedGyeok = null

  // 천간 투간 우선순위 탐색
  for (const cand of candidates) {
    const isTuGan = positions.some(pos => pillars[pos] && pillars[pos].stem === cand.stem)
    if (isTuGan) {
      const tenGod = getTenGod(dayMaster, cand.stem)
      if (tenGod) {
        selectedGyeok = {
          name: `${tenGod}격`,
          type: '정격',
          reason: `월지 ${monthBranch}의 지장간 ${cand.type}인 ${cand.stem}${subjectParticle(cand.stem)} 천간에 투출(투간)되어 격국을 형성함`,
          stem: cand.stem,
          source: cand.type
        }
        break
      }
    }
  }

  // 투간된 글자가 전혀 없다면, 월지 지장간 '본기'의 십성을 격국으로 판정
  if (!selectedGyeok) {
    const mainStem = jijangan.본
    const tenGod = getTenGod(dayMaster, mainStem)
    selectedGyeok = {
      name: `${tenGod}격`,
      type: '정격',
      reason: `천간에 투출한 지장간 글자가 없어, 월지 ${monthBranch}의 본기인 ${mainStem}의 십성을 기준으로 격국을 형성함`,
      stem: mainStem,
      source: '본기(미투출)'
    }
  }

  // 특수격(종격) 가능성 검토 (극단적 오행 쏠림 판정)
  const strength = calculateStrengthScore(dayMaster, pillars)
  if (strength.score >= 85) {
    selectedGyeok = {
      name: '종왕격 (또는 종강격)',
      type: '특수격 (종격)',
      reason: `인성과 비겁의 세력이 원국의 대부분(${strength.score}점)을 차지하여, 일간의 강한 세력에 순응하는 극신강 특수격 성립 가능성 높음`,
      candidates: ['종왕격', '종강격', selectedGyeok.name]
    }
  }

  return selectedGyeok
}

// 한글 종성 판별 헬퍼
function subjectParticle(word) {
  if (!word) return ''
  const lastCode = word.charCodeAt(word.length - 1) - 0xAC00
  const hasFinalConsonant = lastCode >= 0 && lastCode <= 0xD7A3 - 0xAC00 && lastCode % 28 !== 0
  return hasFinalConsonant ? '이' : '가'
}

// 6. 용신(用神)·희신(喜神)·기신(忌神) 판정
export function determineYongShin(dayMaster, strength, seasonalContext) {
  const meElement = ELEMENTS_MAP[dayMaster]
  const resourceElement = Object.keys(GENERATES).find(k => GENERATES[k] === meElement)
  const outputElement = GENERATES[meElement]
  const wealthElement = CONTROLS[meElement]
  const pressureElement = Object.keys(CONTROLS).find(k => CONTROLS[k] === meElement)

  let yongShin = null
  let heeShin = null
  let giShin = null
  let type = '억부용신'
  let confidence = 'high'
  let statement = ''

  // 1) 억부용신 판정
  if (strength.isStrong) {
    // 신강 사주는 극하거나 설하는 식상, 재성, 관성 중 선택
    yongShin = wealthElement // 식상 혹은 재성을 1차 억부용신 후보로 삼음
    heeShin = outputElement // 식상을 희신으로 삼음
    giShin = resourceElement // 기신은 인성
    statement = '일주가 강하므로 일간의 기운을 설기하거나 억제하는 식상과 재성을 용희신으로 삼고, 일간을 도우려 하는 인성을 기신으로 분류합니다.'
  } else if (strength.isWeak) {
    // 신약 사주는 생조하는 인성 또는 비겁 선택
    yongShin = resourceElement // 인성 용신
    heeShin = meElement // 비겁 희신
    giShin = pressureElement // 기신은 관성
    statement = '일주가 약하므로 일간을 직접 생조해주는 인성을 용신으로, 힘을 실어주는 비겁을 희신으로 삼아 균형을 맞춥니다.'
  } else {
    // 중화 사주는 세력이 약한 부위를 보조
    yongShin = wealthElement
    heeShin = outputElement
    giShin = resourceElement
    confidence = 'medium'
    statement = '원국이 비교적 중화에 가까우므로, 사주 내 오행 편향에 따라 보조 희용신을 균형 있게 운용해야 하며 불확실성이 존재합니다.'
  }

  // 2) 조후용신 판정 (월지 기후 대조)
  let chohuYongShin = null
  let chohuStatement = ''
  if (seasonalContext && seasonalContext.monthBranch) {
    const month = seasonalContext.monthBranch
    if (['사', '오', '미'].includes(month)) {
      chohuYongShin = '수'
      chohuStatement = '여름철(사오미월) 출생으로 원국이 매우 뜨겁고 건조하므로, 한 조후를 식혀줄 수(水) 오행을 조후용신으로 활용합니다.'
    } else if (['해', '자', '축'].includes(month)) {
      chohuYongShin = '화'
      chohuStatement = '겨울철(해자축월) 출생으로 원국이 매우 차갑고 얼어붙어 있으므로, 조후를 녹이고 온기를 줄 화(火) 오행을 조후용신으로 활용합니다.'
    }
  }

  return {
    ruleType: type,
    primaryYongShinElement: yongShin,
    heeShinElement: heeShin,
    giShinElement: giShin,
    confidence,
    statement,
    chohu: chohuYongShin ? {
      element: chohuYongShin,
      statement: chohuStatement
    } : null,
    version: SAJU_PROFILE_RULES_VERSION
  }
}

// 7. 6대 신살(神殺) 계산 엔진
export function calculateShinsal(dayMaster, pillars) {
  const list = []
  const positions = ['year', 'month', 'day', 'hour']
  const stems = positions.map(pos => pillars[pos]?.stem).filter(Boolean)
  const branches = positions.map(pos => pillars[pos]?.branch).filter(Boolean)

  if (!dayMaster) return list

  // 연지/일지 기준살 계산을 위한 준비
  const yearBranch = pillars.year?.branch
  const dayBranch = pillars.day?.branch

  // 1) 천을귀인 (天乙貴人): 일간 기준 지지 매핑
  // 갑/무/경 -> 축, 미 / 을/기 -> 자신 / 병/정 -> 해, 유 / 신 -> 인, 오 / 임/계 -> 사, 묘
  let guiinBranches = []
  if (['갑', '무', '경'].includes(dayMaster)) guiinBranches = ['축', '미']
  else if (['을', '기'].includes(dayMaster)) guiinBranches = ['자', '신']
  else if (['병', '정'].includes(dayMaster)) guiinBranches = ['해', '유']
  else if (dayMaster === '신') guiinBranches = ['인', '오']
  else if (['임', '계'].includes(dayMaster)) guiinBranches = ['사', '묘']

  positions.forEach((pos) => {
    const branch = pillars[pos]?.branch
    if (branch && guiinBranches.includes(branch)) {
      list.push({
        name: '천을귀인',
        basis: '일간',
        position: pos,
        branch,
        statement: `일간 ${dayMaster} 기준으로 지지 ${branch}${subjectParticle(branch)} 천을귀인(天乙貴人)에 해당하여 인생의 지혜와 귀인의 혜택을 뜻함`,
        formula: '일간 대비 특정 지지 매핑',
        version: SAJU_PROFILE_RULES_VERSION
      })
    }
  })

  // 2) 도화살 (桃花煞)
  // 삼합국(생지 다음 자) 기준 도화 공식 고전 정합성 필터:
  // 해묘미(목국) -> 자(子) / 인오술(화국) -> 묘(卯) / 사유축(금국) -> 오(午) / 신자진(수국) -> 유(酉)
  const dohwaMap = { 
    '해': '자', '묘': '자', '미': '자', 
    '인': '묘', '오': '묘', '술': '묘', 
    '사': '오', '유': '오', '축': '오', 
    '신': '유', '자': '유', '진': '유' 
  }
  const dohwaTargets = [yearBranch, dayBranch].filter(Boolean).map(b => dohwaMap[b]).filter(Boolean)

  positions.forEach((pos) => {
    const branch = pillars[pos]?.branch
    if (branch && dohwaTargets.includes(branch)) {
      list.push({
        name: '도화살',
        basis: '년지 또는 일지 삼합',
        position: pos,
        branch,
        statement: `년지/일지 기준 지지 ${branch}${subjectParticle(branch)} 도화살(桃花煞)에 해당하여 타인의 주목을 이끌고 매력을 발산하는 힘을 뜻함`,
        formula: '년지/일지 기준 삼합의 왕지 매핑',
        version: SAJU_PROFILE_RULES_VERSION
      })
    }
  })

  // 3) 역마살 (驛馬煞)
  // 해묘미 -> 사 / 인오술 -> 신 / 사유축 -> 해 / 신자진 -> 인
  const yeokmaMap = { '해': '사', '묘': '사', '미': '사', '인': '신', '오': '신', '술': '신', '사': '해', '유': '해', '축': '해', '신': '인', '자': '인', '진': '인' }
  const yeokmaTargets = [yearBranch, dayBranch].filter(Boolean).map(b => yeokmaMap[b]).filter(Boolean)

  positions.forEach((pos) => {
    const branch = pillars[pos]?.branch
    if (branch && yeokmaTargets.includes(branch)) {
      list.push({
        name: '역마살',
        basis: '년지 또는 일지 삼합',
        position: pos,
        branch,
        statement: `년지/일지 기준 지지 ${branch}${subjectParticle(branch)} 역마살(驛馬煞)에 해당하여 활동 영역의 확장, 이동, 글로벌 추진력을 뜻함`,
        formula: '년지/일지 기준 삼합의 첫 글자를 충하는 지지 매핑',
        version: SAJU_PROFILE_RULES_VERSION
      })
    }
  })

  // 4) 화개살 (華蓋煞)
  // 해묘미 -> 미 / 인오술 -> 술 / 사유축 -> 축 / 신자진 -> 진
  const hwagaeMap = { '해': '미', '묘': '미', '미': '미', '인': '술', '오': '술', '술': '술', '사': '축', '유': '축', '축': '축', '신': '진', '자': '진', '진': '진' }
  const hwagaeTargets = [yearBranch, dayBranch].filter(Boolean).map(b => hwagaeMap[b]).filter(Boolean)

  positions.forEach((pos) => {
    const branch = pillars[pos]?.branch
    if (branch && hwagaeTargets.includes(branch)) {
      list.push({
        name: '화개살',
        basis: '년지 또는 일지 삼합',
        position: pos,
        branch,
        statement: `년지/일지 기준 지지 ${branch}${subjectParticle(branch)} 화개살(華蓋煞)에 해당하여 학문, 예술, 내면의 성찰 및 정신적 회귀 본능을 뜻함`,
        formula: '년지/일지 기준 삼합의 묘지 매핑',
        version: SAJU_PROFILE_RULES_VERSION
      })
    }
  })

  // 5) 공망 (空亡): 일주 간지 기준 공망 지지 도출
  // 60갑자 중 일주의 순(旬)을 계산하여 공망 도출
  if (pillars.day && pillars.day.stem && pillars.day.branch) {
    const stemIdx = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'].indexOf(pillars.day.stem)
    const branchIdx = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'].indexOf(pillars.day.branch)

    if (stemIdx !== -1 && branchIdx !== -1) {
      // (branchIdx - stemIdx + 12) % 12 가 해당 일주가 속한 10일 주기(순)의 시작 지지의 인덱스가 됨
      const startBranchIdx = (branchIdx - stemIdx + 12) % 12
      // 공망은 시작 지지에서 10칸 뒤의 2개 지지
      const gongmang1 = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'][(startBranchIdx + 10) % 12]
      const gongmang2 = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'][(startBranchIdx + 11) % 12]

      positions.forEach((pos) => {
        const branch = pillars[pos]?.branch
        if (branch && (branch === gongmang1 || branch === gongmang2)) {
          list.push({
            name: '공망',
            basis: '일주 간지 순(旬)',
            position: pos,
            branch,
            statement: `일주 ${pillars.day.stem}${pillars.day.branch} 기준 지지 ${branch}${subjectParticle(branch)} 공망(空亡)에 해당하여 해당 자리가 비어있거나 무형의 기운으로 운용됨을 뜻함`,
            formula: '일주 60갑자의 순중(旬中) 공망 매핑',
            version: SAJU_PROFILE_RULES_VERSION
          })
        }
      })
    }
  }

  // 6) 양인살 (羊刃煞): 일간 기준 지지 매핑
  // 갑->묘 / 을->진 / 병->오 / 정->미 / 무->오 / 기->미 / 경->유 / 신->술 / 임->자 / 계->축
  const yanginMap = { '갑': '묘', '을': '진', '병': '오', '정': '미', '무': '오', '기': '미', '경': '유', '신': '술', '임': '자', '계': '축' }
  const yanginTarget = yanginMap[dayMaster]

  if (yanginTarget) {
    positions.forEach((pos) => {
      const branch = pillars[pos]?.branch
      if (branch && branch === yanginTarget) {
        list.push({
          name: '양인살',
          basis: '일간',
          position: pos,
          branch,
          statement: `일간 ${dayMaster} 기준 지지 ${branch}${subjectParticle(branch)} 양인살(羊刃煞)에 해당하여 주관의 극대화, 추진 돌파력 및 카리스마를 뜻함`,
          formula: '일간 대비 제왕/쇠지 매핑',
          version: SAJU_PROFILE_RULES_VERSION
        })
      }
    })
  }

  return list
}

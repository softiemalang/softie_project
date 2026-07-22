export const NATAL_BRANCH_RELATION_RULE_VERSION = 'softie-natal-branch-relations-v2'

const PILLAR_LABELS = {
  year: '연지',
  month: '월지',
  day: '일지',
  hour: '시지',
}

const PILLAR_STEM_LABELS = {
  year: '연간',
  month: '월간',
  day: '일간',
  hour: '시간',
}

// 지지 짝 규칙 (육합, 충, 형, 파, 해)
const PAIR_RULES = [
  {
    relation: '육합',
    pairs: [['자', '축'], ['인', '해'], ['묘', '술'], ['진', '유'], ['사', '신'], ['오', '미']],
  },
  {
    relation: '충',
    pairs: [['자', '오'], ['축', '미'], ['인', '신'], ['묘', '유'], ['진', '술'], ['사', '해']],
  },
  {
    relation: '형',
    pairs: [
      ['인', '사'], ['사', '신'], ['신', '인'],
      ['축', '술'], ['술', '미'], ['미', '축'],
      ['자', '묘'], ['진', '진'], ['오', '오'], ['유', '유'], ['해', '해'],
    ],
  },
  {
    relation: '파',
    pairs: [['자', '유'], ['축', '진'], ['인', '해'], ['묘', '오'], ['사', '신'], ['미', '술']],
  },
  {
    relation: '해',
    pairs: [['자', '미'], ['축', '오'], ['인', '사'], ['묘', '진'], ['신', '해'], ['유', '술']],
  },
]

// 삼합(三合) 규칙
const TRINE_RULES = [
  { relation: '삼합', element: '수', branches: ['신', '자', '진'], king: '자' },
  { relation: '삼합', element: '목', branches: ['해', '묘', '미'], king: '묘' },
  { relation: '삼합', element: '화', branches: ['인', '오', '술'], king: '오' },
  { relation: '삼합', element: '금', branches: ['사', '유', '축'], king: '유' },
]

// 방합(方合) 규칙
const DIRECTIONAL_RULES = [
  { relation: '방합', element: '목', branches: ['인', '묘', '진'] },
  { relation: '방합', element: '화', branches: ['사', '오', '미'] },
  { relation: '방합', element: '금', branches: ['신', '유', '술'] },
  { relation: '방합', element: '수', branches: ['해', '자', '축'] },
]

// 천간합(天干合) 규칙
export const STEM_COMBINATION_RULES = [
  { relation: '천간합', stems: ['갑', '기'], element: '토', label: '갑기합토' },
  { relation: '천간합', stems: ['을', '경'], element: '금', label: '을경합금' },
  { relation: '천간합', stems: ['병', '신'], element: '수', label: '병신합수' },
  { relation: '천간합', stems: ['정', '임'], element: '목', label: '정임합목' },
  { relation: '천간합', stems: ['무', '계'], element: '화', label: '무계합화' },
]

// 천간충(天干沖) 규칙
export const STEM_CLASH_RULES = [
  { relation: '천간충', stems: ['갑', '경'] },
  { relation: '천간충', stems: ['을', '신'] },
  { relation: '천간충', stems: ['병', '임'] },
  { relation: '천간충', stems: ['정', '계'] },
]

const GENERATES = { '목': '화', '화': '토', '토': '금', '금': '수', '수': '목' }

function normalizePair(left, right) {
  return [left, right].sort().join('-')
}

function matchesPair(left, right, pairs) {
  const target = normalizePair(left, right)
  return pairs.some(([pairLeft, pairRight]) => normalizePair(pairLeft, pairRight) === target)
}

// 1. 천간 관계 계산 함수 추가
export function calculateNatalStemRelations(pillars) {
  const stems = ['year', 'month', 'day', 'hour']
    .map((pos) => ({
      position: pos,
      positionLabel: PILLAR_STEM_LABELS[pos],
      stem: pillars[pos]?.stem || null,
    }))
    .filter((entry) => entry.stem)

  const items = []

  const positionOrder = { year: 0, month: 1, day: 2, hour: 3 }

  for (let i = 0; i < stems.length; i++) {
    for (let j = i + 1; j < stems.length; j++) {
      const left = stems[i]
      const right = stems[j]

      // 천간합 연산
      STEM_COMBINATION_RULES.forEach((rule) => {
        if (rule.stems.includes(left.stem) && rule.stems.includes(right.stem)) {
          // 합화 성립 여부 판정 (월령 득실 또는 천간 세력 기준)
          const monthBranch = pillars.month?.branch
          const monthBranchElement = monthBranch ? getBranchElement(monthBranch) : null
          const isTransmutationStable = monthBranchElement === rule.element || GENERATES[monthBranchElement] === rule.element

          // 인접성 판정: 기둥 간 인접 시(거리 1)에만 합의 성립(establishment) 및 합화(transmutation) 가능
          const isAdjacent = Math.abs(positionOrder[left.position] - positionOrder[right.position]) === 1

          const stemsSorted = [left.stem, right.stem].sort()
          const positionsSorted = [left.position, right.position].sort((a, b) => positionOrder[a] - positionOrder[b])
          const positionLabelsSorted = positionsSorted.map((pos) => pos === left.position ? left.positionLabel : right.positionLabel)

          items.push({
            id: `${positionsSorted.join('-')}-천간합`,
            relation: '천간합',
            label: rule.label,
            element: rule.element,
            stems: stemsSorted,
            positions: positionsSorted,
            positionLabels: positionLabelsSorted,
            assessment: {
              presence: true,
              establishment: isAdjacent, // 기둥이 붙어 있는 인접쌍만 실제 합이 성립됨
              transmutation: isAdjacent && isTransmutationStable, // 인접하고 월령 생조까지 완비되어야 합화
              transformedElement: isAdjacent && isTransmutationStable ? rule.element : null, // 변환 오행 필드 명시화
              strengthLabel: isAdjacent && isTransmutationStable
                ? '강함 (월지 생조)'
                : (isAdjacent ? '보통 (합반 상태)' : '약함 (원격 격리)'),
              description: isAdjacent
                ? (isTransmutationStable
                    ? `천간에서 ${left.stem}과 ${right.stem}이 인접하여 합(${rule.label})을 이룸. 월지가 합화 오행을 생조하여 실제 오행 변환 기운이 강함`
                    : `천간에서 ${left.stem}과 ${right.stem}이 인접하여 합(${rule.label})을 이룸. 월지 조력이 부족하여 고유 특성은 유지한 채 묶여있는 상태(합반)`)
                : `천간에서 ${left.stem}과 ${right.stem}이 떨어져 있어 합(${rule.label})의 작용력이 무력함`
            }
          })
        }
      })

      // 천간충 연산
      STEM_CLASH_RULES.forEach((rule) => {
        if (rule.stems.includes(left.stem) && rule.stems.includes(right.stem)) {
          const stemsSorted = [left.stem, right.stem].sort()
          const positionsSorted = [left.position, right.position].sort((a, b) => positionOrder[a] - positionOrder[b])
          const positionLabelsSorted = positionsSorted.map((pos) => pos === left.position ? left.positionLabel : right.positionLabel)

          items.push({
            id: `${positionsSorted.join('-')}-천간충`,
            relation: '천간충',
            stems: stemsSorted,
            positions: positionsSorted,
            positionLabels: positionLabelsSorted,
            assessment: {
              presence: true,
              establishment: true,
              description: `천간에서 ${left.stem}과 ${right.stem}이 충돌하여 서로의 기운을 흔들고 자극함`
            }
          })
        }
      })
    }
  }

  return {
    ruleVersion: NATAL_BRANCH_RELATION_RULE_VERSION,
    basis: 'reference_pillars',
    items,
  }
}

// 지지 오행 판정 헬퍼
function getBranchElement(branch) {
  const map = { '자': '수', '축': '토', '인': '목', '묘': '목', '진': '토', '사': '화', '오': '화', '미': '토', '신': '금', '유': '금', '술': '토', '해': '수' }
  return map[branch] || null
}

function branchEntries(pillars) {
  return ['year', 'month', 'day', 'hour']
    .map((position) => ({
      position,
      positionLabel: PILLAR_LABELS[position],
      branch: pillars[position]?.branch || null,
    }))
    .filter((entry) => entry.branch)
}

// 2. 지지 관계 정밀 계산 (방합, 반합, 합화 여부 분리)
export function calculateNatalBranchRelations(pillars) {
  const entries = branchEntries(pillars)
  const relations = []
  const monthBranch = pillars.month?.branch
  const positionOrder = { year: 0, month: 1, day: 2, hour: 3 }

  // 1) 지지 짝 관계 (육합, 충, 형, 파, 해)
  for (let leftIndex = 0; leftIndex < entries.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < entries.length; rightIndex += 1) {
      const left = entries[leftIndex]
      const right = entries[rightIndex]

      PAIR_RULES.forEach((rule) => {
        if (!matchesPair(left.branch, right.branch, rule.pairs)) return

        // 세부 상태 분석 (충/형이 방해하는지 여부 등)
        let isTransmutation = false
        let targetElement = null
        if (rule.relation === '육합') {
          // 육합은 월지가 육합화 오행과 같거나 생할 때 오행 변환 개연성 있음
          const hapElements = {
            '자-축': '토', '축-자': '토',
            '인-해': '목', '해-인': '목',
            '묘-술': '화', '술-묘': '화',
            '진-유': '금', '유-진': '금',
            '사-신': '수', '신-사': '수',
            '오-미': '화', '미-오': '화',
          }
          const pairKey = normalizePair(left.branch, right.branch)
          targetElement = hapElements[pairKey] || null
          const monthElement = monthBranch ? getBranchElement(monthBranch) : null
          isTransmutation = monthElement === targetElement || GENERATES[monthElement] === targetElement
        }

        const branchesSorted = [left.branch, right.branch].sort()
        const positionsSorted = [left.position, right.position].sort((a, b) => positionOrder[a] - positionOrder[b])
        const positionLabelsSorted = positionsSorted.map((pos) => pos === left.position ? left.positionLabel : right.positionLabel)

        relations.push({
          id: `${positionsSorted.join('-')}-${rule.relation}`,
          relation: rule.relation,
          branches: branchesSorted,
          positions: positionsSorted,
          positionLabels: positionLabelsSorted,
          ruleType: 'pair_lookup',
          assessment: {
            presence: true,
            establishment: true,
            transmutation: isTransmutation,
            transformedElement: isTransmutation ? targetElement : null, // 변환 오행 필드 명사화
            strength: rule.relation === '충' || rule.relation === '형' ? 1.0 : 0.7,
            description: rule.relation === '육합'
              ? `지지 ${left.branch}와 ${right.branch}가 만나 결합함. ${isTransmutation ? '월령의 도움을 받아 오행 변환 개연성이 높음' : '묶여서 고유 기능이 잠시 제어되는 합반 상태'}`
              : `지지 ${left.branch}와 ${right.branch}가 만나 상극의 충돌(${rule.relation})을 이룸`
          }
        })
      })
    }
  }

  // 2) 지지 삼합(三合) 분석
  TRINE_RULES.forEach((rule) => {
    const hasCompleteGroup = rule.branches.every((branch) => entries.some((entry) => entry.branch === branch))

    if (hasCompleteGroup) {
      const matchingEntries = entries.filter((entry) => rule.branches.includes(entry.branch))
      const isTransmutation = monthBranch ? (getBranchElement(monthBranch) === rule.element || monthBranch === rule.king) : false

      const branchesSorted = [...rule.branches].sort()
      const positionsSorted = matchingEntries.map((e) => e.position).sort((a, b) => positionOrder[a] - positionOrder[b])
      const positionLabelsSorted = positionsSorted.map((pos) => matchingEntries.find((e) => e.position === pos).positionLabel)

      relations.push({
        id: `trine-${rule.element}-${positionsSorted.join('-')}`,
        relation: rule.relation,
        element: rule.element,
        branches: branchesSorted,
        positions: positionsSorted,
        positionLabels: positionLabelsSorted,
        ruleType: 'complete_group_lookup',
        assessment: {
          presence: true,
          establishment: true,
          transmutation: isTransmutation,
          transformedElement: isTransmutation ? rule.element : null, // 변환 오행 필드 명사화
          strength: 1.0,
          description: `지지 세 자리에 ${rule.branches.join('·')}이 모두 모여 강력한 삼합(${rule.element}국)을 형성함`
        }
      })
    } else {
      // 3) 반합(半合) 분석: 삼합 글자 중 왕지(子, 午, 卯, 酉)를 필수로 포함하는 두 글자가 존재하는 경우
      const hasKing = entries.some(entry => entry.branch === rule.king)
      if (hasKing) {
        rule.branches.forEach((b1, idx1) => {
          rule.branches.forEach((b2, idx2) => {
            if (idx1 >= idx2) return
            // b1, b2 중 하나는 반드시 왕지여야 성립
            if (b1 !== rule.king && b2 !== rule.king) return

            const entry1 = entries.find(e => e.branch === b1)
            const entry2 = entries.find(e => e.branch === b2)

            if (entry1 && entry2) {
              const isTransmutation = monthBranch === rule.king || getBranchElement(monthBranch) === rule.element

              const branchesSorted = [b1, b2].sort()
              const positionsSorted = [entry1.position, entry2.position].sort((a, b) => positionOrder[a] - positionOrder[b])
              const positionLabelsSorted = positionsSorted.map((pos) => pos === entry1.position ? entry1.positionLabel : entry2.positionLabel)

              relations.push({
                id: `half-trine-${rule.element}-${positionsSorted.join('-')}`,
                relation: '반합',
                element: rule.element,
                branches: branchesSorted,
                positions: positionsSorted,
                positionLabels: positionLabelsSorted,
                ruleType: 'half_group_lookup',
                assessment: {
                  presence: true,
                  establishment: true,
                  transmutation: isTransmutation,
                  transformedElement: isTransmutation ? rule.element : null, // 변환 오행 필드 명사화
                  strength: 0.5,
                  description: `삼합 중 중심 왕지인 ${rule.king}을 동반한 반합(${b1}·${b2})이 성립되어 ${rule.element} 기운을 생성함`
                }
              })
            }
          })
        })
      }
    }
  })

  // 4) 방합(方合) 분석
  DIRECTIONAL_RULES.forEach((rule) => {
    const hasCompleteGroup = rule.branches.every((branch) => entries.some((entry) => entry.branch === branch))
    if (hasCompleteGroup) {
      const matchingEntries = entries.filter((entry) => rule.branches.includes(entry.branch))

      const branchesSorted = [...rule.branches].sort()
      const positionsSorted = matchingEntries.map((e) => e.position).sort((a, b) => positionOrder[a] - positionOrder[b])
      const positionLabelsSorted = positionsSorted.map((pos) => matchingEntries.find((e) => e.position === pos).positionLabel)

      relations.push({
        id: `directional-${rule.element}-${positionsSorted.join('-')}`,
        relation: rule.relation,
        element: rule.element,
        branches: branchesSorted,
        positions: positionsSorted,
        positionLabels: positionLabelsSorted,
        ruleType: 'complete_directional_lookup',
        assessment: {
          presence: true,
          establishment: true,
          transmutation: true, // 방합은 가족이자 계절의 합이므로 무조건 완벽 성립
          transformedElement: rule.element, // 변환 오행 필드 명사화
          strength: 1.2,
          description: `지지 세 자리에 계절의 세력인 ${rule.branches.join('·')}이 모두 모여 강력한 방합(${rule.element}국)을 형성함`
        }
      })
    }
  })

  return {
    ruleVersion: NATAL_BRANCH_RELATION_RULE_VERSION,
    basis: 'reference_pillars',
    interpretationScope: '합화 성립 조건·상세 관계 강도 및 오행 변환 개연성 분석 포함',
    items: relations,
  }
}

// 3. 운(대운/세운 등)과 원국 간 지지 관계 정밀 연산
export function calculatePeriodBranchRelations(natalPillars, periodPillar, periodLabel) {
  const periodBranch = periodPillar?.branch
  if (!periodBranch) return {
    ruleVersion: NATAL_BRANCH_RELATION_RULE_VERSION,
    basis: 'period_to_natal_pillars',
    interpretationScope: '합화 성립 조건·상세 관계 강도 분석 포함',
    items: [],
  }

  const natalEntries = branchEntries(natalPillars)
  const relations = []

  natalEntries.forEach((entry) => {
    PAIR_RULES.forEach((rule) => {
      if (!matchesPair(entry.branch, periodBranch, rule.pairs)) return
      relations.push({
        id: `${periodLabel}-${entry.position}-${rule.relation}`,
        relation: rule.relation,
        branches: [entry.branch, periodBranch],
        natalPosition: entry.position,
        natalPositionLabel: entry.positionLabel,
        periodLabel,
        ruleType: 'period_pair_lookup',
        assessment: {
          presence: true,
          establishment: true,
          description: `${periodLabel}의 ${periodBranch}가 원국의 ${entry.positionLabel}인 ${entry.branch}를 만나 충동(${rule.relation}) 또는 결합함`
        }
      })
    })
  })

  TRINE_RULES.forEach((rule) => {
    if (!rule.branches.includes(periodBranch)) return
    const remainingBranches = rule.branches.filter((branch) => branch !== periodBranch)
    const matchingEntries = remainingBranches.map((branch) =>
      natalEntries.find((entry) => entry.branch === branch)).filter(Boolean)

    if (matchingEntries.length === remainingBranches.length) {
      relations.push({
        id: `${periodLabel}-trine-${rule.element}`,
        relation: rule.relation,
        element: rule.element,
        branches: [...rule.branches],
        natalPositions: matchingEntries.map((entry) => entry.position),
        natalPositionLabels: matchingEntries.map((entry) => entry.positionLabel),
        periodLabel,
        ruleType: 'period_complete_group_lookup',
        assessment: {
          presence: true,
          establishment: true,
          description: `${periodLabel}의 지지 ${periodBranch}가 원국의 지지들과 온전한 삼합(${rule.element}국)을 맞추어 기운을 급변시킴`
        }
      })
    }
  })

  return {
    ruleVersion: NATAL_BRANCH_RELATION_RULE_VERSION,
    basis: 'period_to_natal_pillars',
    interpretationScope: '합화 성립 조건·상세 관계 강도 분석 포함',
    items: relations,
  }
}

// 4. 기간 간의 기본 지지 페어 관계 계산 (sajuTimingRules.js 및 prepare.test.js 호환용)
export function calculateBranchPairRelations(leftBranch, rightBranch, leftLabel, rightLabel) {
  const relations = []
  PAIR_RULES.forEach((rule) => {
    if (!matchesPair(leftBranch, rightBranch, rule.pairs)) return
    relations.push({
      relation: rule.relation,
      branches: [leftBranch, rightBranch],
      labels: [leftLabel, rightLabel],
    })
  })
  return relations
}


// 5. 기간 간의 삼합 관계 계산 (sajuTimingRules.js 및 prepare.test.js 호환용)
export function calculateBranchGroupRelations(entries) {
  const relations = []
  const branches = entries.map((e) => e.branch)
  const labels = entries.map((e) => e.label)

  TRINE_RULES.forEach((rule) => {
    const hasAll = rule.branches.every((b) => branches.includes(b))
    if (hasAll) {
      relations.push({
        id: `period-trine-${rule.element}-${labels.join('-')}`,
        relation: '삼합',
        element: rule.element,
        branches: [...rule.branches],
        labels: [...labels],
        ruleType: 'period_complete_group_lookup',
        interpretationStatus: 'presence_only',
      })
    }
  })
  return relations
}

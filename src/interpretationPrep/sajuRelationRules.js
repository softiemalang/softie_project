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

const POSITION_ORDER = { year: 0, month: 1, day: 2, hour: 3 }

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

function sortByPosition(entries) {
  return [...entries].sort((left, right) => {
    const leftOrder = POSITION_ORDER[left.position] ?? Number.MAX_SAFE_INTEGER
    const rightOrder = POSITION_ORDER[right.position] ?? Number.MAX_SAFE_INTEGER
    return leftOrder - rightOrder
  })
}

function uniqueBy(items, keyFor) {
  const seen = new Set()
  return items.filter((item) => {
    const key = keyFor(item)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function entryIdentity(entry) {
  return entry.position ?? entry.label ?? `${entry.branch}`
}

function entryCombinationsForBranches(entries, branches) {
  const groups = branches.map((branch) => entries.filter((entry) => entry.branch === branch))
  if (groups.some((group) => group.length === 0)) return []

  return groups.reduce(
    (combinations, group) => combinations.flatMap((combination) => group
      .filter((entry) => !combination.some((selected) => entryIdentity(selected) === entryIdentity(entry)))
      .map((entry) => [...combination, entry])),
    [[]],
  )
}

// 1. 천간 관계 계산
export function calculateNatalStemRelations(pillars) {
  const stems = ['year', 'month', 'day', 'hour']
    .map((position) => ({
      position,
      positionLabel: PILLAR_STEM_LABELS[position],
      stem: pillars[position]?.stem || null,
    }))
    .filter((entry) => entry.stem)

  const items = []

  for (let leftIndex = 0; leftIndex < stems.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < stems.length; rightIndex += 1) {
      const left = stems[leftIndex]
      const right = stems[rightIndex]

      STEM_COMBINATION_RULES.forEach((rule) => {
        if (left.stem === right.stem || !rule.stems.includes(left.stem) || !rule.stems.includes(right.stem)) return

        const monthBranch = pillars.month?.branch
        const monthBranchElement = monthBranch ? getBranchElement(monthBranch) : null
        const isTransmutationStable = monthBranchElement === rule.element || GENERATES[monthBranchElement] === rule.element
        const isAdjacent = Math.abs(POSITION_ORDER[left.position] - POSITION_ORDER[right.position]) === 1
        const sortedEntries = sortByPosition([left, right])

        items.push({
          id: `${sortedEntries.map((entry) => entry.position).join('-')}-천간합`,
          relation: '천간합',
          label: rule.label,
          element: rule.element,
          stems: [left.stem, right.stem].sort(),
          positions: sortedEntries.map((entry) => entry.position),
          positionLabels: sortedEntries.map((entry) => entry.positionLabel),
          assessment: {
            presence: true,
            establishment: isAdjacent,
            transmutation: isAdjacent && isTransmutationStable,
            transformedElement: isAdjacent && isTransmutationStable ? rule.element : null,
            strengthLabel: isAdjacent && isTransmutationStable
              ? '강함 (월지 생조)'
              : (isAdjacent ? '보통 (합반 상태)' : '약함 (원격 격리)'),
            description: isAdjacent
              ? (isTransmutationStable
                  ? `천간에서 ${left.stem}과 ${right.stem}이 인접하여 합(${rule.label})을 이룸. 월지가 합화 오행을 생조하여 실제 오행 변환 개연성이 높음`
                  : `천간에서 ${left.stem}과 ${right.stem}이 인접하여 합(${rule.label})을 이룸. 월지 조력이 부족하여 고유 특성을 유지한 합반 상태로 기록함`)
              : `천간에서 ${left.stem}과 ${right.stem}이 떨어져 있어 합(${rule.label})의 작용력을 낮게 기록함`,
          },
        })
      })

      STEM_CLASH_RULES.forEach((rule) => {
        if (left.stem === right.stem || !rule.stems.includes(left.stem) || !rule.stems.includes(right.stem)) return

        const sortedEntries = sortByPosition([left, right])
        items.push({
          id: `${sortedEntries.map((entry) => entry.position).join('-')}-천간충`,
          relation: '천간충',
          stems: [left.stem, right.stem].sort(),
          positions: sortedEntries.map((entry) => entry.position),
          positionLabels: sortedEntries.map((entry) => entry.positionLabel),
          assessment: {
            presence: true,
            establishment: true,
            description: `천간에서 ${left.stem}과 ${right.stem}의 충 관계가 존재함`,
          },
        })
      })
    }
  }

  return {
    ruleVersion: NATAL_BRANCH_RELATION_RULE_VERSION,
    basis: 'reference_pillars',
    items,
  }
}

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

// 2. 지지 관계 계산
export function calculateNatalBranchRelations(pillars) {
  const entries = branchEntries(pillars)
  const relations = []
  const monthBranch = pillars.month?.branch

  for (let leftIndex = 0; leftIndex < entries.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < entries.length; rightIndex += 1) {
      const left = entries[leftIndex]
      const right = entries[rightIndex]

      PAIR_RULES.forEach((rule) => {
        if (!matchesPair(left.branch, right.branch, rule.pairs)) return

        let isTransmutation = false
        let targetElement = null
        if (rule.relation === '육합') {
          const hapElements = {
            '자-축': '토',
            '인-해': '목',
            '묘-술': '화',
            '유-진': '금',
            '사-신': '수',
            '미-오': '화',
          }
          targetElement = hapElements[normalizePair(left.branch, right.branch)] || null
          const monthElement = monthBranch ? getBranchElement(monthBranch) : null
          isTransmutation = Boolean(targetElement) && (monthElement === targetElement || GENERATES[monthElement] === targetElement)
        }

        const sortedEntries = sortByPosition([left, right])
        relations.push({
          id: `${sortedEntries.map((entry) => entry.position).join('-')}-${rule.relation}`,
          relation: rule.relation,
          branches: [left.branch, right.branch].sort(),
          positions: sortedEntries.map((entry) => entry.position),
          positionLabels: sortedEntries.map((entry) => entry.positionLabel),
          ruleType: 'pair_lookup',
          assessment: {
            presence: true,
            establishment: true,
            transmutation: isTransmutation,
            transformedElement: isTransmutation ? targetElement : null,
            strength: rule.relation === '충' || rule.relation === '형' ? 1.0 : 0.7,
            description: rule.relation === '육합'
              ? `지지 ${left.branch}와 ${right.branch}의 육합 관계가 존재함. ${isTransmutation ? '월령 조건상 오행 변환 후보로 기록함' : '합화는 확정하지 않고 합반 후보로 기록함'}`
              : `지지 ${left.branch}와 ${right.branch} 사이에 ${rule.relation} 관계가 존재함`,
          },
        })
      })
    }
  }

  TRINE_RULES.forEach((rule) => {
    const completeCombinations = entryCombinationsForBranches(entries, rule.branches)

    if (completeCombinations.length > 0) {
      completeCombinations.forEach((combination) => {
        const sortedEntries = sortByPosition(combination)
        const isTransmutation = monthBranch
          ? getBranchElement(monthBranch) === rule.element || monthBranch === rule.king
          : false

        relations.push({
          id: `trine-${rule.element}-${sortedEntries.map((entry) => entry.position).join('-')}`,
          relation: rule.relation,
          element: rule.element,
          branches: [...rule.branches].sort(),
          positions: sortedEntries.map((entry) => entry.position),
          positionLabels: sortedEntries.map((entry) => entry.positionLabel),
          ruleType: 'complete_group_lookup',
          assessment: {
            presence: true,
            establishment: true,
            transmutation: isTransmutation,
            transformedElement: isTransmutation ? rule.element : null,
            strength: 1.0,
            description: `지지 ${rule.branches.join('·')}이 모두 모여 삼합(${rule.element}국) 구조가 존재함`,
          },
        })
      })
      return
    }

    const halfPairs = []
    rule.branches.forEach((leftBranch, leftIndex) => {
      rule.branches.forEach((rightBranch, rightIndex) => {
        if (leftIndex >= rightIndex) return
        if (leftBranch !== rule.king && rightBranch !== rule.king) return
        halfPairs.push([leftBranch, rightBranch])
      })
    })

    halfPairs.forEach(([leftBranch, rightBranch]) => {
      entryCombinationsForBranches(entries, [leftBranch, rightBranch]).forEach((combination) => {
        const sortedEntries = sortByPosition(combination)
        const isTransmutation = monthBranch === rule.king || getBranchElement(monthBranch) === rule.element

        relations.push({
          id: `half-trine-${rule.element}-${sortedEntries.map((entry) => entry.position).join('-')}`,
          relation: '반합',
          element: rule.element,
          branches: [leftBranch, rightBranch].sort(),
          positions: sortedEntries.map((entry) => entry.position),
          positionLabels: sortedEntries.map((entry) => entry.positionLabel),
          ruleType: 'half_group_lookup',
          assessment: {
            presence: true,
            establishment: true,
            transmutation: isTransmutation,
            transformedElement: isTransmutation ? rule.element : null,
            strength: 0.5,
            description: `삼합의 중심 왕지 ${rule.king}을 포함한 반합(${leftBranch}·${rightBranch}) 구조가 존재함`,
          },
        })
      })
    })
  })

  DIRECTIONAL_RULES.forEach((rule) => {
    entryCombinationsForBranches(entries, rule.branches).forEach((combination) => {
      const sortedEntries = sortByPosition(combination)
      relations.push({
        id: `directional-${rule.element}-${sortedEntries.map((entry) => entry.position).join('-')}`,
        relation: rule.relation,
        element: rule.element,
        branches: [...rule.branches].sort(),
        positions: sortedEntries.map((entry) => entry.position),
        positionLabels: sortedEntries.map((entry) => entry.positionLabel),
        ruleType: 'complete_directional_lookup',
        assessment: {
          presence: true,
          establishment: true,
          transmutation: false,
          transmutationStatus: 'not_evaluated',
          transformedElement: null,
          strength: 1.0,
          description: `지지 ${rule.branches.join('·')}이 모두 모여 방합(${rule.element}국) 구조가 존재함. 실제 오행 전환과 작용 강도는 별도 해석 대상으로 남김`,
        },
      })
    })
  })

  return {
    ruleVersion: NATAL_BRANCH_RELATION_RULE_VERSION,
    basis: 'reference_pillars',
    interpretationScope: '관계 존재와 제한된 합화 후보를 계산하며 방합의 실제 오행 전환·길흉은 확정하지 않음',
    items: uniqueBy(relations, (relation) => relation.id),
  }
}

// 3. 운(대운/세운 등)과 원국 간 지지 관계 계산
export function calculatePeriodBranchRelations(natalPillars, periodPillar, periodLabel) {
  const periodBranch = periodPillar?.branch
  if (!periodBranch) return {
    ruleVersion: NATAL_BRANCH_RELATION_RULE_VERSION,
    basis: 'period_to_natal_pillars',
    interpretationScope: '관계 존재 여부만 계산',
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
          description: `${periodLabel}의 ${periodBranch}와 원국 ${entry.positionLabel} ${entry.branch} 사이에 ${rule.relation} 관계가 존재함`,
        },
      })
    })
  })

  TRINE_RULES.forEach((rule) => {
    if (!rule.branches.includes(periodBranch)) return
    const remainingBranches = rule.branches.filter((branch) => branch !== periodBranch)
    entryCombinationsForBranches(natalEntries, remainingBranches).forEach((combination) => {
      const sortedEntries = sortByPosition(combination)
      relations.push({
        id: `${periodLabel}-trine-${rule.element}-${sortedEntries.map((entry) => entry.position).join('-')}`,
        relation: rule.relation,
        element: rule.element,
        branches: [...rule.branches],
        natalPositions: sortedEntries.map((entry) => entry.position),
        natalPositionLabels: sortedEntries.map((entry) => entry.positionLabel),
        periodLabel,
        ruleType: 'period_complete_group_lookup',
        assessment: {
          presence: true,
          establishment: true,
          description: `${periodLabel}의 지지 ${periodBranch}와 원국 지지들이 삼합(${rule.element}국) 구조를 이룸`,
        },
      })
    })
  })

  return {
    ruleVersion: NATAL_BRANCH_RELATION_RULE_VERSION,
    basis: 'period_to_natal_pillars',
    interpretationScope: '관계 존재 여부를 계산하며 강약·길흉은 확정하지 않음',
    items: uniqueBy(relations, (relation) => relation.id),
  }
}

// 4. 기간 간의 기본 지지 페어 관계 계산
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

// 5. 기간 간의 삼합 관계 계산
export function calculateBranchGroupRelations(entries) {
  const relations = []

  TRINE_RULES.forEach((rule) => {
    entryCombinationsForBranches(entries, rule.branches).forEach((combination) => {
      const labels = combination.map((entry) => entry.label)
      relations.push({
        id: `period-trine-${rule.element}-${labels.join('-')}`,
        relation: '삼합',
        element: rule.element,
        branches: [...rule.branches],
        labels,
        ruleType: 'period_complete_group_lookup',
        interpretationStatus: 'presence_only',
      })
    })
  })

  return uniqueBy(relations, (relation) => relation.id)
}

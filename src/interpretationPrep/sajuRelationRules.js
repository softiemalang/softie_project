export const NATAL_BRANCH_RELATION_RULE_VERSION = 'softie-natal-branch-relations-v1'

const PILLAR_LABELS = {
  year: '연지',
  month: '월지',
  day: '일지',
  hour: '시지',
}

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

const TRINE_RULES = [
  { relation: '삼합', element: '수', branches: ['신', '자', '진'] },
  { relation: '삼합', element: '목', branches: ['해', '묘', '미'] },
  { relation: '삼합', element: '화', branches: ['인', '오', '술'] },
  { relation: '삼합', element: '금', branches: ['사', '유', '축'] },
]

function normalizePair(left, right) {
  return [left, right].sort().join('-')
}

function matchesPair(left, right, pairs) {
  const target = normalizePair(left, right)
  return pairs.some(([pairLeft, pairRight]) => normalizePair(pairLeft, pairRight) === target)
}

export function calculateBranchPairRelations(left, right, leftLabel, rightLabel) {
  if (!left || !right) return []
  return PAIR_RULES
    .filter((rule) => matchesPair(left, right, rule.pairs))
    .map((rule) => ({
      id: `${leftLabel}-${rightLabel}-${rule.relation}`,
      relation: rule.relation,
      branches: [left, right],
      labels: [leftLabel, rightLabel],
      ruleType: 'period_pair_lookup',
      interpretationStatus: 'presence_only',
    }))
}

export function calculateBranchGroupRelations(entries) {
  return TRINE_RULES.flatMap((rule) => {
    const matchingEntries = rule.branches.map((branch) => entries.find((entry) => entry.branch === branch))
    if (matchingEntries.some((entry) => !entry)) return []
    return [{
      id: `period-trine-${rule.element}-${matchingEntries.map((entry) => entry.label).join('-')}`,
      relation: rule.relation,
      element: rule.element,
      branches: [...rule.branches],
      labels: matchingEntries.map((entry) => entry.label),
      ruleType: 'period_complete_group_lookup',
      interpretationStatus: 'presence_only',
    }]
  })
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

export function calculateNatalBranchRelations(pillars) {
  const entries = branchEntries(pillars)
  const relations = []

  for (let leftIndex = 0; leftIndex < entries.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < entries.length; rightIndex += 1) {
      const left = entries[leftIndex]
      const right = entries[rightIndex]

      PAIR_RULES.forEach((rule) => {
        if (!matchesPair(left.branch, right.branch, rule.pairs)) return
        relations.push({
          id: `${left.position}-${right.position}-${rule.relation}`,
          relation: rule.relation,
          branches: [left.branch, right.branch],
          positions: [left.position, right.position],
          positionLabels: [left.positionLabel, right.positionLabel],
          ruleType: 'pair_lookup',
          interpretationStatus: 'presence_only',
        })
      })
    }
  }

  TRINE_RULES.forEach((rule) => {
    const hasCompleteGroup = rule.branches.every((branch) => entries.some((entry) => entry.branch === branch))
    if (!hasCompleteGroup) return

    const matchingEntries = entries.filter((entry) => rule.branches.includes(entry.branch))
    relations.push({
      id: `trine-${rule.element}-${matchingEntries.map((entry) => entry.position).join('-')}`,
      relation: rule.relation,
      element: rule.element,
      branches: [...rule.branches],
      positions: matchingEntries.map((entry) => entry.position),
      positionLabels: matchingEntries.map((entry) => entry.positionLabel),
      ruleType: 'complete_group_lookup',
      interpretationStatus: 'presence_only',
    })
  })

  return {
    ruleVersion: NATAL_BRANCH_RELATION_RULE_VERSION,
    basis: 'reference_pillars',
    interpretationScope: '관계 존재 여부만 계산·합화 성립·강약·길흉은 판정하지 않음',
    items: relations,
  }
}

export function calculatePeriodBranchRelations(natalPillars, periodPillar, periodLabel) {
  const periodBranch = periodPillar?.branch
  if (!periodBranch) return {
    ruleVersion: NATAL_BRANCH_RELATION_RULE_VERSION,
    basis: 'period_to_natal_pillars',
    interpretationScope: '관계 존재 여부만 계산·합화 성립·강약·길흉은 판정하지 않음',
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
        interpretationStatus: 'presence_only',
      })
    })
  })

  TRINE_RULES.forEach((rule) => {
    if (!rule.branches.includes(periodBranch)) return
    const remainingBranches = rule.branches.filter((branch) => branch !== periodBranch)
    const matchingEntries = remainingBranches.map((branch) =>
      natalEntries.find((entry) => entry.branch === branch)).filter(Boolean)
    if (matchingEntries.length !== remainingBranches.length) return

    relations.push({
      id: `${periodLabel}-trine-${rule.element}`,
      relation: rule.relation,
      element: rule.element,
      branches: [...rule.branches],
      natalPositions: matchingEntries.map((entry) => entry.position),
      natalPositionLabels: matchingEntries.map((entry) => entry.positionLabel),
      periodLabel,
      ruleType: 'period_complete_group_lookup',
      interpretationStatus: 'presence_only',
    })
  })

  return {
    ruleVersion: NATAL_BRANCH_RELATION_RULE_VERSION,
    basis: 'period_to_natal_pillars',
    interpretationScope: '관계 존재 여부만 계산·합화 성립·강약·길흉은 판정하지 않음',
    items: relations,
  }
}

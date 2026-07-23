import test from 'node:test'
import assert from 'node:assert/strict'

import {
  calculateBranchGroupRelations,
  calculateNatalBranchRelations,
  calculatePeriodBranchRelations,
} from '../src/interpretationPrep/sajuRelationRules.js'

function pillar(branch, stem = '갑') {
  return { stem, branch }
}

test('repeated natal branches produce every distinct half-trine combination once', () => {
  const result = calculateNatalBranchRelations({
    year: pillar('자'),
    month: pillar('자'),
    day: pillar('신'),
    hour: pillar('술'),
  })

  const waterHalfTrines = result.items.filter(
    (item) => item.relation === '반합' && item.element === '수',
  )

  assert.deepEqual(
    waterHalfTrines.map((item) => item.positions).sort(),
    [['month', 'day'], ['year', 'day']].sort(),
  )
  assert.equal(new Set(waterHalfTrines.map((item) => item.id)).size, 2)
})

test('directional combination records presence without claiming transmutation', () => {
  const result = calculateNatalBranchRelations({
    year: pillar('인'),
    month: pillar('묘'),
    day: pillar('진'),
    hour: pillar('술'),
  })

  const directional = result.items.find(
    (item) => item.relation === '방합' && item.element === '목',
  )

  assert.ok(directional)
  assert.equal(directional.assessment.establishment, true)
  assert.equal(directional.assessment.transmutation, false)
  assert.equal(directional.assessment.transmutationStatus, 'not_evaluated')
  assert.equal(directional.assessment.transformedElement, null)
})

test('진유 육합 uses the normalized pair key and resolves the metal candidate', () => {
  const result = calculateNatalBranchRelations({
    year: pillar('진'),
    month: pillar('유'),
    day: pillar('자'),
    hour: pillar('오'),
  })

  const combination = result.items.find(
    (item) => item.relation === '육합' && item.positions.includes('year') && item.positions.includes('month'),
  )

  assert.ok(combination)
  assert.equal(combination.assessment.transmutation, true)
  assert.equal(combination.assessment.transformedElement, '금')
})

test('period trine relations contain natal identities only in natal position fields', () => {
  const result = calculatePeriodBranchRelations(
    {
      year: pillar('신'),
      month: pillar('진'),
      day: pillar('술'),
      hour: pillar('해'),
    },
    pillar('자'),
    '세운',
  )

  const trine = result.items.find(
    (item) => item.relation === '삼합' && item.element === '수',
  )

  assert.ok(trine)
  assert.deepEqual(trine.natalPositions, ['year', 'month'])
  assert.deepEqual(trine.natalPositionLabels, ['연지', '월지'])
  assert.equal(trine.periodLabel, '세운')
  assert.equal(trine.natalPositions.includes(undefined), false)
})

test('period group relations use labels as identities and remove exact duplicates', () => {
  const result = calculateBranchGroupRelations([
    { label: '대운', branch: '신' },
    { label: '세운', branch: '자' },
    { label: '월운', branch: '진' },
    { label: '월운', branch: '진' },
  ])

  assert.equal(result.length, 1)
  assert.deepEqual(result[0].labels, ['대운', '세운', '월운'])
  assert.equal(result[0].interpretationStatus, 'presence_only')
})

import test from 'node:test'
import assert from 'node:assert/strict'

import {
  attachJosa,
  hasBatchim,
  calculateBranchGroupRelations,
  calculateNatalBranchRelations,
  calculateNatalStemRelations,
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

test('hasBatchim and attachJosa attach correct Korean josa based on batchim', () => {
  assert.equal(hasBatchim('갑'), true)
  assert.equal(hasBatchim('기'), false)

  // 받침 있는 천간
  assert.equal(attachJosa('갑', '과/와'), '갑과')
  assert.equal(attachJosa('갑', '이/가'), '갑이')

  // 받침 없는 천간
  assert.equal(attachJosa('기', '과/와'), '기와')
  assert.equal(attachJosa('기', '이/가'), '기가')
})

test('calculateNatalStemRelations generates natural Korean descriptions', () => {
  const result = calculateNatalStemRelations({
    year: pillar('술', '갑'),
    month: pillar('술', '임'),
    day: pillar('인', '기'),
    hour: pillar('자', '갑'),
  })

  // 연간(갑) - 일간(기) / 일간(기) - 시간(갑)
  const yearDayHap = result.items.find(
    (item) => item.positions.includes('year') && item.positions.includes('day'),
  )
  const dayHourHap = result.items.find(
    (item) => item.positions.includes('day') && item.positions.includes('hour'),
  )

  assert.ok(yearDayHap)
  assert.ok(dayHourHap)

  // 받침 있는 갑 + 받침 없는 기
  assert.ok(yearDayHap.assessment.description.includes('갑과 기가 떨어져 있어'))
  assert.ok(dayHourHap.assessment.description.includes('기와 갑이 인접하여'))
})

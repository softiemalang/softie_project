import test from 'node:test'
import assert from 'node:assert/strict'
import { SOLAR_TERM_REFERENCE_FIXTURES } from './fixtures/solarTerm/solarTermReference.js'
import { getBaziYearAndMonth, getAdjacentBaziMonthBoundary } from '../src/saju/engine/solarTerms.js'

test('solar term validation: measures error statistics including maxErrorMinutes and per-term distribution', () => {
  const verifiedFixtures = SOLAR_TERM_REFERENCE_FIXTURES.filter((f) => f.status === 'verified')
  assert.ok(verifiedFixtures.length > 0)

  let totalErrorMinutes = 0
  let maxErrorMinutes = 0
  let withinToleranceCount = 0
  const byTermErrorSummary = {}

  verifiedFixtures.forEach((fixture) => {
    const { year, month, day, hour, min } = fixture.input
    const bForward = getAdjacentBaziMonthBoundary(year, month, day, hour, min, 'forward')
    const bBackward = getAdjacentBaziMonthBoundary(year, month, day, hour, min, 'backward')

    const expectedMs = new Date(fixture.expectedUtcIso).getTime()
    const diffForwardMs = Math.abs(new Date(bForward.utcIso).getTime() - expectedMs)
    const diffBackwardMs = Math.abs(new Date(bBackward.utcIso).getTime() - expectedMs)
    const diffMinutes = Math.min(diffForwardMs, diffBackwardMs) / 60000

    totalErrorMinutes += diffMinutes
    if (diffMinutes > maxErrorMinutes) {
      maxErrorMinutes = diffMinutes
    }
    if (diffMinutes <= 20) {
      withinToleranceCount += 1
    }

    if (!byTermErrorSummary[fixture.term]) {
      byTermErrorSummary[fixture.term] = { sampleCount: 0, maxErrorMinutes: 0 }
    }
    byTermErrorSummary[fixture.term].sampleCount += 1
    byTermErrorSummary[fixture.term].maxErrorMinutes = Math.max(
      byTermErrorSummary[fixture.term].maxErrorMinutes,
      diffMinutes
    )

    // Verify each verified fixture is within uncertainty threshold
    assert.ok(
      diffMinutes <= 20,
      `${fixture.id} (${fixture.term}) error ${diffMinutes}m exceeded 20m threshold`
    )
  })

  const sampleCount = verifiedFixtures.length
  const averageErrorMinutes = totalErrorMinutes / sampleCount
  const withinToleranceRate = withinToleranceCount / sampleCount

  assert.equal(sampleCount, verifiedFixtures.length)
  assert.ok(averageErrorMinutes >= 0)
  assert.ok(maxErrorMinutes <= 20, `maxErrorMinutes ${maxErrorMinutes} should be <= 20`)
  assert.equal(withinToleranceRate, 1.0)
  assert.ok(byTermErrorSummary['입춘'])
})

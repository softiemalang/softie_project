import test from 'node:test'
import assert from 'node:assert/strict'
import { CALENDAR_REFERENCE_FIXTURES } from './fixtures/calendar/calendarReference.js'
import { lunar2solar, solar2lunar } from '../src/interpretationPrep/lunarConverter.js'

test('calendar validation: verified fixtures pass bi-directional lunar2solar and solar2lunar conversions', () => {
  const verifiedFixtures = CALENDAR_REFERENCE_FIXTURES.filter((f) => f.status === 'verified')
  assert.ok(verifiedFixtures.length > 0, 'verified fixtures should exist')

  verifiedFixtures.forEach((fixture) => {
    // 1. Forward Conversion: Lunar -> Solar
    const solarRes = lunar2solar(
      fixture.lunar.year,
      fixture.lunar.month,
      fixture.lunar.day,
      fixture.lunar.isLeapMonth
    )

    assert.ok(solarRes, `solarRes should be valid for ${fixture.id}`)
    assert.equal(solarRes.solarYear, fixture.solar.year, `${fixture.id}: solarYear mismatch`)
    assert.equal(solarRes.solarMonth, fixture.solar.month, `${fixture.id}: solarMonth mismatch`)
    assert.equal(solarRes.solarDay, fixture.solar.day, `${fixture.id}: solarDay mismatch`)

    // 2. Reverse Conversion: Solar -> Lunar
    const lunarRes = solar2lunar(fixture.solar.year, fixture.solar.month, fixture.solar.day)

    assert.ok(lunarRes, `lunarRes should be valid for ${fixture.id}`)
    assert.equal(lunarRes.lYear, fixture.lunar.year, `${fixture.id}: lYear reverse mismatch`)
    assert.equal(lunarRes.lMonth, fixture.lunar.month, `${fixture.id}: lMonth reverse mismatch`)
    assert.equal(lunarRes.lDay, fixture.lunar.day, `${fixture.id}: lDay reverse mismatch`)
    assert.equal(Boolean(lunarRes.isLeap), fixture.lunar.isLeapMonth, `${fixture.id}: isLeap reverse mismatch`)
  })
})

test('calendar validation: pending_validation fixtures are logged separately without claiming verification', () => {
  const pendingFixtures = CALENDAR_REFERENCE_FIXTURES.filter((f) => f.status === 'pending_validation')

  pendingFixtures.forEach((fixture) => {
    assert.equal(fixture.status, 'pending_validation')
    assert.ok(fixture.source.includes('pending') || fixture.source.includes('external'))
  })
})

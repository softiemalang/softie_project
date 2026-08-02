import assert from 'node:assert/strict'
import test from 'node:test'
import { transformDe405State } from '../src/astrology/astrologyEphemerisCore.js'

test('moving-date-frame speed includes Rdot*r and exposes frozen-frame diagnostic separately', () => {
  const result = transformDe405State([26499034.228862327, -132757417.66468561, -57556717.447906621, 29.794260048366745, 5.0180524604150447, 2.1753937286070539], 2451545.0007428704)
  assert.ok(Math.abs(result.speed - 1.0194320604125293) < 1e-12)
  assert.ok(Math.abs(result.frozenFrameSpeedDegreesPerDay - 1.0193938157081457) < 1e-12)
  assert.ok(Math.abs(result.speed - result.frozenFrameSpeedDegreesPerDay) > 1e-5)
})

test('longitude wrap oracle uses an unwrapped local angle sequence', () => {
  const values = [359.9, 0.1, 0.3]
  const reference = values[1]
  const unwrapped = values.map((value) => value + 360 * Math.round((reference - value) / 360))
  assert.ok(Math.abs(unwrapped[0] + 0.1) < 1e-12)
  assert.deepEqual(unwrapped.slice(1), [0.1, 0.3])
})

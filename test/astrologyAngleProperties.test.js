import test from 'node:test'
import assert from 'node:assert/strict'
import fc from 'fast-check'

import { normalizeDegrees360 } from '../src/astrology/astrologyAngles.js'

const PERIOD = 360
const DEFAULT_SEED = 20260801
const DEFAULT_RUNS = 1000

function readIntegerEnv(name, fallback) {
  const raw = process.env[name]
  if (raw === undefined) return fallback
  if (!/^-?\d+$/.test(raw)) throw new Error(`${name} must be a valid integer: ${raw}`)
  const value = Number(raw)
  if (!Number.isSafeInteger(value)) throw new Error(`${name} must be a safe integer: ${raw}`)
  return value
}

const propertyParameters = {
  seed: readIntegerEnv('FAST_CHECK_SEED', DEFAULT_SEED),
  numRuns: readIntegerEnv('FAST_CHECK_RUNS', DEFAULT_RUNS),
}

const finitePilotDegrees = fc.double({ min: -1_000_000, max: 1_000_000, noNaN: true, noDefaultInfinity: true })
const safeIntegerDegrees = fc.integer({ min: -100_000, max: 100_000 })
const safeRotationCount = fc.integer({ min: -1_000, max: 1_000 })

test('normalizeDegrees360 property pilot: finite pilot inputs stay in [0, 360)', () => {
  fc.assert(
    fc.property(finitePilotDegrees, degrees => {
      const normalized = normalizeDegrees360(degrees)
      assert.equal(Number.isFinite(normalized), true)
      assert.equal(normalized >= 0, true)
      assert.equal(normalized < PERIOD, true)
    }),
    propertyParameters,
  )
})

test('normalizeDegrees360 property pilot: normalization is idempotent for safe integers', () => {
  fc.assert(
    fc.property(safeIntegerDegrees, degrees => {
      const normalized = normalizeDegrees360(degrees)
      assert.equal(normalizeDegrees360(normalized), normalized)
      assert.equal(Object.is(normalized, -0), false)
    }),
    propertyParameters,
  )
})

test('normalizeDegrees360 property pilot: integer full rotations preserve the result', () => {
  fc.assert(
    fc.property(safeIntegerDegrees, safeRotationCount, (degrees, rotations) => {
      assert.equal(
        normalizeDegrees360(degrees + PERIOD * rotations),
        normalizeDegrees360(degrees),
      )
    }),
    propertyParameters,
  )
})

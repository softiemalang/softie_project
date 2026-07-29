import test from 'node:test'
import assert from 'node:assert/strict'
import {
  JPL_READER_SOURCE_SHA256,
  JPL_BINARY_SIZE_BYTES,
  JPL_BINARY_SHA256,
  JPL_TARGET_MAP,
  etSecondsToTwoPartJed
} from '../scripts/lib/de405-jpl-reader-contract.mjs'

test('JPL reader contract constants match official provenance', () => {
  assert.equal(JPL_READER_SOURCE_SHA256, '18f32f073c1a345850d9deebc8b53b06c83a386c066b566f65001b51adeb7120')
  assert.equal(JPL_BINARY_SIZE_BYTES, 55900416)
  assert.equal(JPL_BINARY_SHA256, '7ec77287b6fddd3d7adabb87709ee5e926e3d1123fbae5d1485a42913cf175e7')
})

test('JPL target mapping correctly maps canonical IDs to JPL NTARG codes with NCENT=3', () => {
  assert.equal(JPL_TARGET_MAP.length, 10)
  
  const sun = JPL_TARGET_MAP.find(t => t.targetId === 10)
  assert.ok(sun)
  assert.equal(sun.target, 'SUN')
  assert.equal(sun.targetType, 'body')
  assert.equal(sun.jplNtarg, 11)
  assert.equal(sun.jplNcent, 3)

  const moon = JPL_TARGET_MAP.find(t => t.targetId === 301)
  assert.ok(moon)
  assert.equal(moon.target, 'MOON')
  assert.equal(moon.targetType, 'body')
  assert.equal(moon.jplNtarg, 10)
  assert.equal(moon.jplNcent, 3)

  const merc = JPL_TARGET_MAP.find(t => t.targetId === 1)
  assert.ok(merc)
  assert.equal(merc.jplNtarg, 1)
  assert.equal(merc.jplNcent, 3)
})

test('etSecondsToTwoPartJed correctly converts ET seconds past J2000 to two-part JED', () => {
  const zero = etSecondsToTwoPartJed(0)
  assert.equal(zero.jed1, 2451545.0)
  assert.equal(zero.jed2, 0.0)

  const start = etSecondsToTwoPartJed('-3.1557168000000000e+09')
  assert.equal(start.jed1, 2451545.0)
  assert.equal(start.jed2, -3155716800 / 86400)
  assert.equal(start.jed1 + start.jed2, 2415020.5)
})

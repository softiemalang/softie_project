import assert from 'node:assert/strict'
import test from 'node:test'
import {
  CANONICAL_PERIMETER_PATH,
  ORIENTATIONS,
  RESERVED_INNER_COORDINATES,
  ROTATION_OFFSETS,
  SLOT_COUNT,
  ZIWEI_CANONICAL_SLOT_ORIENTATION_POLICY,
  buildCanonicalCoordinateMap,
  coordinateToLogicalSlot,
  coordinateToPathIndex,
  displayNumberForSlotOrdinal,
  enumeratePolicyVariants,
  logicalSlotToCoordinate,
  logicalSlotToPathIndex,
  pathIndexToLogicalSlot,
  slotOrdinalFromDisplayNumber,
} from '../src/ziwei/canonicalSlotOrientationPolicy.js'

const mod = value => (value % SLOT_COUNT + SLOT_COUNT) % SLOT_COUNT

test('policy is explicit, non-historical, and unactivated', () => {
  assert.equal(ZIWEI_CANONICAL_SLOT_ORIENTATION_POLICY.schemaVersion, 'ziwei-canonical-slot-orientation-policy-v0')
  assert.equal(ZIWEI_CANONICAL_SLOT_ORIENTATION_POLICY.status, 'proposal_only')
  assert.equal(ZIWEI_CANONICAL_SLOT_ORIENTATION_POLICY.activationStatus, 'not_activated')
  assert.equal(ZIWEI_CANONICAL_SLOT_ORIENTATION_POLICY.historicalFact, false)
  for (const key of ['slotNumbering', 'orientation', 'rotation', 'coordinateMapping']) {
    assert.equal(ZIWEI_CANONICAL_SLOT_ORIENTATION_POLICY[key].historicalFact, false, `${key} must not be historical FACT`)
  }
  assert.equal(ZIWEI_CANONICAL_SLOT_ORIENTATION_POLICY.historicalFrontier.status, 'locked_insufficient_evidence')
  assert.equal(Object.isFrozen(ZIWEI_CANONICAL_SLOT_ORIENTATION_POLICY), true)
  assert.equal(Object.isFrozen(ZIWEI_CANONICAL_SLOT_ORIENTATION_POLICY.coordinateMapping), true)
})

test('canonical four-by-four perimeter has exactly twelve unique slots', () => {
  assert.equal(CANONICAL_PERIMETER_PATH.length, SLOT_COUNT)
  assert.equal(new Set(CANONICAL_PERIMETER_PATH.map(({ row, column }) => `${row}:${column}`)).size, SLOT_COUNT)
  for (const coordinate of CANONICAL_PERIMETER_PATH) {
    assert.equal(RESERVED_INNER_COORDINATES.some(inner => inner.row === coordinate.row && inner.column === coordinate.column), false)
    assert.equal(coordinateToPathIndex(coordinate), CANONICAL_PERIMETER_PATH.indexOf(coordinate))
  }
})

test('zero-based logical ordinals and one-based display numbers are reversible', () => {
  for (let slotOrdinal = 0; slotOrdinal < SLOT_COUNT; slotOrdinal += 1) {
    assert.equal(slotOrdinalFromDisplayNumber(displayNumberForSlotOrdinal(slotOrdinal)), slotOrdinal)
  }
})

test('every rotation and orientation is a bijective reversible mapping', () => {
  for (const orientation of ORIENTATIONS) {
    for (const rotationOffset of ROTATION_OFFSETS) {
      const map = buildCanonicalCoordinateMap({ orientation, rotationOffset })
      assert.equal(map.length, SLOT_COUNT)
      assert.equal(new Set(map.map(entry => entry.pathIndex)).size, SLOT_COUNT)
      assert.equal(new Set(map.map(entry => `${entry.coordinate.row}:${entry.coordinate.column}`)).size, SLOT_COUNT)
      for (let slotOrdinal = 0; slotOrdinal < SLOT_COUNT; slotOrdinal += 1) {
        const coordinate = logicalSlotToCoordinate(slotOrdinal, { orientation, rotationOffset })
        assert.equal(pathIndexToLogicalSlot(logicalSlotToPathIndex(slotOrdinal, { orientation, rotationOffset }), { orientation, rotationOffset }), slotOrdinal)
        assert.equal(coordinateToLogicalSlot(coordinate, { orientation, rotationOffset }), slotOrdinal)
      }
    }
  }
})

test('rotation offsets compose modulo twelve and orientation is an explicit ambiguity', () => {
  for (let slotOrdinal = 0; slotOrdinal < SLOT_COUNT; slotOrdinal += 1) {
    for (let offset = 0; offset < SLOT_COUNT; offset += 1) {
      assert.equal(
        logicalSlotToPathIndex(slotOrdinal, { orientation: 'clockwise', rotationOffset: offset }),
        mod(slotOrdinal + offset),
      )
      assert.equal(
        logicalSlotToPathIndex(slotOrdinal, { orientation: 'counterclockwise', rotationOffset: offset }),
        mod(-slotOrdinal + offset),
      )
    }
  }
  assert.notDeepEqual(logicalSlotToCoordinate(1, { orientation: 'clockwise' }), logicalSlotToCoordinate(1, { orientation: 'counterclockwise' }))
  assert.equal(enumeratePolicyVariants().length, SLOT_COUNT * ORIENTATIONS.length)
  assert.equal(enumeratePolicyVariants().every(variant => variant.historicalFact === false), true)
})

test('mapping is UI-coordinate independent and rejects ambiguous invalid inputs', () => {
  const first = buildCanonicalCoordinateMap({ orientation: 'clockwise', rotationOffset: 3 })
  const second = buildCanonicalCoordinateMap({ orientation: 'clockwise', rotationOffset: 3 })
  assert.deepEqual(first, second)
  assert.equal(Object.isFrozen(first), true)
  assert.equal(Object.isFrozen(first[0]), true)
  assert.throws(() => { first[0].logicalSlotOrdinal = 99 }, TypeError)
  assert.throws(() => logicalSlotToPathIndex(-1), RangeError)
  assert.throws(() => logicalSlotToPathIndex(SLOT_COUNT), RangeError)
  assert.throws(() => logicalSlotToPathIndex(0, { rotationOffset: 12 }), RangeError)
  assert.throws(() => logicalSlotToPathIndex(0, { orientation: 'historical-clockwise' }), RangeError)
  assert.throws(() => coordinateToLogicalSlot({ row: 1, column: 1 }), RangeError)
  assert.throws(() => coordinateToPathIndex({ row: 9, column: 9 }), RangeError)
  assert.throws(() => slotOrdinalFromDisplayNumber(0), RangeError)
  assert.throws(() => slotOrdinalFromDisplayNumber(13), RangeError)
})

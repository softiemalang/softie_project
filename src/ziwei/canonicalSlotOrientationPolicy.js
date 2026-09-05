/**
 * Ziwei canonical slot/orientation policy proposal.
 *
 * This module is deliberately not imported by the production resolver or UI.
 * Its values are implementation policy only; none is historical authority.
 */

export const ZIWEI_CANONICAL_SLOT_ORIENTATION_POLICY_SCHEMA = 'ziwei-canonical-slot-orientation-policy-v0'
export const SLOT_COUNT = 12
export const SLOT_ORDINALS = Object.freeze(Array.from({ length: SLOT_COUNT }, (_, index) => index))
export const ROTATION_OFFSETS = Object.freeze([...SLOT_ORDINALS])
export const ORIENTATIONS = Object.freeze(['clockwise', 'counterclockwise'])

const perimeterPoints = [
  [0, 0], [0, 1], [0, 2], [0, 3],
  [1, 3], [2, 3], [3, 3], [3, 2],
  [3, 1], [3, 0], [2, 0], [1, 0],
]

const point = ([row, column]) => Object.freeze({ row, column })
export const CANONICAL_PERIMETER_PATH = Object.freeze(perimeterPoints.map(point))
export const RESERVED_INNER_COORDINATES = Object.freeze([
  point([1, 1]), point([1, 2]), point([2, 1]), point([2, 2]),
])

const mod = value => (value % SLOT_COUNT + SLOT_COUNT) % SLOT_COUNT
const isInteger = value => Number.isInteger(value)
const deepFreeze = value => {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value
  Object.values(value).forEach(deepFreeze)
  return Object.freeze(value)
}

export function assertSlotOrdinal(value, label = 'slotOrdinal') {
  if (!isInteger(value) || value < 0 || value >= SLOT_COUNT) {
    throw new RangeError(`${label} must be an integer in 0..${SLOT_COUNT - 1}`)
  }
  return value
}

export function assertRotationOffset(value) {
  return assertSlotOrdinal(value, 'rotationOffset')
}

export function assertOrientation(value) {
  if (!ORIENTATIONS.includes(value)) throw new RangeError(`orientation must be one of: ${ORIENTATIONS.join(', ')}`)
  return value
}

function resolveMappingOptions(options = {}) {
  const { rotationOffset = 0, orientation = 'clockwise' } = options || {}
  return {
    rotationOffset: assertRotationOffset(rotationOffset),
    orientation: assertOrientation(orientation),
  }
}

/**
 * Convert a logical slot ordinal to a canonical perimeter path index.
 * rotationOffset identifies the path index occupied by logical slot 0.
 */
export function logicalSlotToPathIndex(slotOrdinal, options = {}) {
  const slot = assertSlotOrdinal(slotOrdinal)
  const { rotationOffset, orientation } = resolveMappingOptions(options)
  const orientedSlot = orientation === 'clockwise' ? slot : mod(-slot)
  return mod(rotationOffset + orientedSlot)
}

export function pathIndexToLogicalSlot(pathIndex, options = {}) {
  const path = assertSlotOrdinal(pathIndex, 'pathIndex')
  const { rotationOffset, orientation } = resolveMappingOptions(options)
  const unrotatedPath = mod(path - rotationOffset)
  return orientation === 'clockwise' ? unrotatedPath : mod(-unrotatedPath)
}

export function logicalSlotToCoordinate(slotOrdinal, options = {}) {
  return CANONICAL_PERIMETER_PATH[logicalSlotToPathIndex(slotOrdinal, options)]
}

export function coordinateToPathIndex(coordinate) {
  if (!coordinate || !isInteger(coordinate.row) || !isInteger(coordinate.column)) {
    throw new RangeError('coordinate must contain integer row and column')
  }
  const pathIndex = CANONICAL_PERIMETER_PATH.findIndex(pointValue => (
    pointValue.row === coordinate.row && pointValue.column === coordinate.column
  ))
  if (pathIndex < 0) throw new RangeError('coordinate is not on the canonical perimeter path')
  return pathIndex
}

export function coordinateToLogicalSlot(coordinate, options = {}) {
  return pathIndexToLogicalSlot(coordinateToPathIndex(coordinate), options)
}

export function displayNumberForSlotOrdinal(slotOrdinal) {
  return assertSlotOrdinal(slotOrdinal) + 1
}

export function slotOrdinalFromDisplayNumber(displayNumber) {
  if (!isInteger(displayNumber) || displayNumber < 1 || displayNumber > SLOT_COUNT) {
    throw new RangeError(`displayNumber must be an integer in 1..${SLOT_COUNT}`)
  }
  return displayNumber - 1
}

export function buildCanonicalCoordinateMap(options = {}) {
  const resolved = resolveMappingOptions(options)
  return Object.freeze(SLOT_ORDINALS.map(logicalSlotOrdinal => Object.freeze({
    logicalSlotOrdinal,
    displayNumber: displayNumberForSlotOrdinal(logicalSlotOrdinal),
    pathIndex: logicalSlotToPathIndex(logicalSlotOrdinal, resolved),
    coordinate: logicalSlotToCoordinate(logicalSlotOrdinal, resolved),
    orientation: resolved.orientation,
    rotationOffset: resolved.rotationOffset,
    mappingBasis: 'implementation_policy_only',
  })))
}

export function enumeratePolicyVariants() {
  return ORIENTATIONS.flatMap(orientation => ROTATION_OFFSETS.map(rotationOffset => Object.freeze({
    orientation,
    rotationOffset,
    historicalFact: false,
  })))
}

export const ZIWEI_CANONICAL_SLOT_ORIENTATION_POLICY = deepFreeze({
  schemaVersion: ZIWEI_CANONICAL_SLOT_ORIENTATION_POLICY_SCHEMA,
  status: 'proposal_only',
  activationStatus: 'not_activated',
  historicalFact: false,
  historicalFrontier: {
    status: 'locked_insufficient_evidence',
    adjacentPageExpansion: 'stopped',
    directPhysicalSlotAuthority: 'not_established',
  },
  preservedHistoricalFacts: Object.freeze([
    'palace_order',
    'selected_palace_branch_mapping',
    'textual_reverse_traversal',
    'branch_to_physical_perimeter_geometry',
  ]),
  slotNumbering: Object.freeze({
    basis: 'zero_based_logical_ordinal',
    range: Object.freeze([0, SLOT_COUNT - 1]),
    displayNumber: 'logical_ordinal_plus_one_presentation_only',
    anchor: 'logical_slot_0',
    historicalFact: false,
  }),
  orientation: Object.freeze({
    default: 'clockwise',
    allowed: ORIENTATIONS,
    meaning: 'canonical_perimeter_path_traversal_only',
    separateFromHistoricalTraversalText: true,
    historicalFact: false,
  }),
  rotation: Object.freeze({
    defaultOffset: 0,
    allowedOffsets: ROTATION_OFFSETS,
    meaning: 'physical_path_index_for_logical_slot_0',
    historicalFact: false,
  }),
  coordinateMapping: Object.freeze({
    frame: 'abstract_four_by_four_perimeter',
    rows: 4,
    columns: 4,
    origin: point([0, 0]),
    path: 'canonical_perimeter_path',
    innerCoordinatesReserved: true,
    uiCoordinateIndependent: true,
    historicalFact: false,
  }),
  gates: Object.freeze({
    policyApproval: 'explicit_owner_approval_required',
    regressionGate: 'reversible_12_slot_matrix_and_invalid_input_tests_required',
    uiAdapterGate: 'adapter_must_consume_logical_coordinates_without_reinterpreting_them',
    historicalClaimGate: 'blocked_until_lineage_locator_closed_same_frame_direct_witness',
    activationGate: 'explicit_activation_approval_required; not_requested',
  }),
})

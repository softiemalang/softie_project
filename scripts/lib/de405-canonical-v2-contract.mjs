export const TARGETS = Object.freeze([
  { targetId: 1, target: 'MERCURY BARYCENTER', targetType: 'barycenter' },
  { targetId: 2, target: 'VENUS BARYCENTER', targetType: 'barycenter' },
  { targetId: 4, target: 'MARS BARYCENTER', targetType: 'barycenter' },
  { targetId: 5, target: 'JUPITER BARYCENTER', targetType: 'barycenter' },
  { targetId: 6, target: 'SATURN BARYCENTER', targetType: 'barycenter' },
  { targetId: 7, target: 'URANUS BARYCENTER', targetType: 'barycenter' },
  { targetId: 8, target: 'NEPTUNE BARYCENTER', targetType: 'barycenter' },
  { targetId: 9, target: 'PLUTO BARYCENTER', targetType: 'barycenter' },
  { targetId: 10, target: 'SUN', targetType: 'body' },
  { targetId: 301, target: 'MOON', targetType: 'body' },
])
export const START_ET = '-3.1557168000000000e+09'
export const END_ET = '3.1872528000000000e+09'
export const STEP_SECONDS = 864000
export const TIMESTAMP_COUNT = 7342
export const EXPECTED_ROW_COUNT = 73420
export const TOTAL_RANGE_SECONDS = 6342969600
export const LAST_SAMPLE_GAP_SECONDS = 345600
export const ROW_KEYS = ['schemaVersion','etSeconds','targetId','target','targetType','observerId','observer','frame','aberrationCorrection','positionKm','velocityKmPerSecond']
export const VECTOR_KEYS = ['x','y','z']
export const DECIMAL_RE = /^-?(?:0|[1-9]\d*)\.\d{16}e[+-]\d{2,}$/
export const REQUIRED_MANIFEST_FIELDS = ['manifestSchemaVersion','canonicalId','canonical','status','provenanceStatus','contractDocument','primarySource','upstreamReferenceSource','sourceFiles','reader','runner','requiredKernels','timeAxis','regularGrid','targets','observer','frame','aberrationCorrection','units','serialization','jsonlSchemaVersion','ordering','determinism','output','generationCommand','createdByCommit']

export function expectedEt(index) {
  return Number(START_ET) + index * STEP_SECONDS
}

export function formatDecimal(value) {
  if (!Number.isFinite(value)) throw new Error('non-finite numeric value')
  if (Object.is(value, -0)) value = 0
  return value.toExponential(16).replace(/e([+-])(\d+)$/, (_, sign, exponent) => `e${sign}${exponent.padStart(2, '0')}`)
}

export function assertGridManifest(manifest) {
  const grid = manifest.regularGrid ?? manifest.timeContract
  if (!grid || grid.regularGridStartEt !== START_ET || grid.regularGridEndExclusiveEt !== END_ET || Number(grid.regularGridStepSeconds) !== STEP_SECONDS || Number(grid.regularGridTimestampCount) !== TIMESTAMP_COUNT || Number(manifest.targetCount ?? grid.targetCount) !== TARGETS.length || Number(manifest.expectedRowCount ?? grid.expectedRowCount) !== EXPECTED_ROW_COUNT) throw new Error('canonical v2 grid invariant mismatch')
}

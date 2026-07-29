export const JPL_READER_SOURCE_SHA256 = '18f32f073c1a345850d9deebc8b53b06c83a386c066b566f65001b51adeb7120'
export const JPL_BINARY_SIZE_BYTES = 55900416
export const JPL_BINARY_SHA256 = '7ec77287b6fddd3d7adabb87709ee5e926e3d1123fbae5d1485a42913cf175e7'

export const JPL_TARGET_MAP = Object.freeze([
  { targetId: 1, target: 'MERCURY BARYCENTER', targetType: 'barycenter', jplNtarg: 1, jplNcent: 3 },
  { targetId: 2, target: 'VENUS BARYCENTER', targetType: 'barycenter', jplNtarg: 2, jplNcent: 3 },
  { targetId: 4, target: 'MARS BARYCENTER', targetType: 'barycenter', jplNtarg: 4, jplNcent: 3 },
  { targetId: 5, target: 'JUPITER BARYCENTER', targetType: 'barycenter', jplNtarg: 5, jplNcent: 3 },
  { targetId: 6, target: 'SATURN BARYCENTER', targetType: 'barycenter', jplNtarg: 6, jplNcent: 3 },
  { targetId: 7, target: 'URANUS BARYCENTER', targetType: 'barycenter', jplNtarg: 7, jplNcent: 3 },
  { targetId: 8, target: 'NEPTUNE BARYCENTER', targetType: 'barycenter', jplNtarg: 8, jplNcent: 3 },
  { targetId: 9, target: 'PLUTO BARYCENTER', targetType: 'barycenter', jplNtarg: 9, jplNcent: 3 },
  { targetId: 10, target: 'SUN', targetType: 'body', jplNtarg: 11, jplNcent: 3 },
  { targetId: 301, target: 'MOON', targetType: 'body', jplNtarg: 10, jplNcent: 3 },
])

export function etSecondsToTwoPartJed(etSeconds) {
  const etNum = typeof etSeconds === 'string' ? Number(etSeconds) : etSeconds
  if (!Number.isFinite(etNum)) throw new Error('Invalid ET seconds')
  return {
    jed1: 2451545.0,
    jed2: etNum / 86400.0
  }
}

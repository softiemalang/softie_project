#!/usr/bin/env node
import { writeFile } from 'node:fs/promises'

const mode = process.env.FAKE_DE405_MODE || ''
const outputIndex = process.argv.indexOf('--output')
const out = outputIndex >= 0 ? process.argv[outputIndex + 1] : null

if (!out && !process.argv.includes('--version') && !process.argv.includes('--metadata') && !process.argv.includes('--probe')) {
  process.exit(0)
}

if (process.argv.includes('--version')) {
  console.log(JSON.stringify({ runnerVersion: 'de405-jpl-canonical-v2-runner', jplReaderVersion: 'testeph.f', testOnly: true }))
  process.exit(0)
}

if (process.argv.includes('--metadata')) {
  console.log(JSON.stringify({
    runnerVersion: 'de405-jpl-canonical-v2-runner',
    readerSourceSha256: '18f32f073c1a345850d9deebc8b53b06c83a386c066b566f65001b51adeb7120',
    jplBinarySize: 55900416,
    jplBinarySha256: '7ec77287b6fddd3d7adabb87709ee5e926e3d1123fbae5d1485a42913cf175e7',
    KSIZE: 2036,
    NRECL: 4,
    KM: true,
    observer: 'EARTH',
    observerId: 399,
    frame: 'J2000'
  }))
  process.exit(0)
}

if (process.argv.includes('--probe')) {
  const ids = [1, 2, 4, 5, 6, 7, 8, 9, 10, 301]
  const items = ids.map(id => ({
    targetId: id,
    x: 0.0, y: 0.0, z: 0.0,
    vx: 0.0, vy: 0.0, vz: 0.0
  }))
  console.log(JSON.stringify(items))
  process.exit(0)
}

if (mode === 'exit-nonzero') {
  console.error('intentional fake failure')
  process.exit(3)
}

if (!out) {
  console.error('missing --output argument')
  process.exit(1)
}

const ids = [1, 2, 4, 5, 6, 7, 8, 9, 10, 301]
const names = ['MERCURY BARYCENTER', 'VENUS BARYCENTER', 'MARS BARYCENTER', 'JUPITER BARYCENTER', 'SATURN BARYCENTER', 'URANUS BARYCENTER', 'NEPTUNE BARYCENTER', 'PLUTO BARYCENTER', 'SUN', 'MOON']
const types = ids.map(id => id < 10 ? 'barycenter' : 'body')

const fmt = n => n.toExponential(16).replace(/e([+-])(\d+)$/, (_, s, e) => `e${s}${e.padStart(2, '0')}`)

const startEtIdx = process.argv.indexOf('--start-et')
const start = startEtIdx >= 0 ? Number(process.argv[startEtIdx + 1]) : -3155716800.0

const countIdx = process.argv.indexOf('--count')
const count = countIdx >= 0 ? Number(process.argv[countIdx + 1]) : 1

const rows = []
const n = '0.0000000000000000e+00'

for (let i = 0; i < count; i++) {
  for (let j = 0; j < 10; j++) {
    const k = mode === 'wrong-target-order' ? 9 - j : j
    const et = start + i * 864000
    rows.push(`{"schemaVersion":"de405-canonical-v2","etSeconds":"${fmt(et)}","targetId":${ids[k]},"target":"${names[k]}","targetType":"${types[k]}","observerId":399,"observer":"EARTH","frame":"J2000","aberrationCorrection":"NONE","positionKm":{"x":"${n}","y":"${n}","z":"${n}"},"velocityKmPerSecond":{"x":"${n}","y":"${n}","z":"${n}"}}`)
  }
}

if (mode === 'wrong-row-count') rows.pop()
if (mode === 'duplicate-row') rows[rows.length - 1] = rows[rows.length - 2]
if (mode === 'negative-zero') rows[0] = rows[0].replaceAll('0.0000000000000000e+00', '-0.0000000000000000e+00')

await writeFile(out, rows.join('\n') + (mode === 'missing-final-newline' ? '' : '\n'))
process.exit(0)

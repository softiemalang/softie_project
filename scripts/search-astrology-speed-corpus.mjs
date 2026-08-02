import { writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { homedir } from 'node:os'
import { DE405_BODY_MAPPING, transformDe405State } from '../src/astrology/astrologyEphemerisCore.js'
import { createDe405CanonicalV2EphemerisEvaluator } from '../tools/de405-canonical-v2-ephemeris-adapter.mjs'

const kernelPath = process.env.DE405_BSP_PATH || resolve(homedir(), '.local/share/softie-de405/kernels/spk/de405.bsp')
const runnerPath = process.env.DE405_RUNNER || resolve(new URL('../tools/de405-cspice-runner/build/de405-canonical-v2-runner', import.meta.url).pathname)
const output = process.env.ASTROLOGY_SPEED_CORPUS_OUTPUT || resolve(new URL('../test/fixtures/astrology/golden/astrology-speed-corpus-search-v1.json', import.meta.url).pathname)
const mapping = DE405_BODY_MAPPING.filter((row) => row.id === 'mercury' || row.id === 'mars')
const evaluator = createDe405CanonicalV2EphemerisEvaluator({ runnerPath, kernelPath, requireVerifiedSelection: true })
if (evaluator.availability !== 'available') throw new Error(`DE405 evaluator unavailable: ${evaluator.reason}`)
const J2000 = 2451545; const day = 86400
const tdb = (jd) => 0.001657 * Math.sin((357.53 + 0.9856003 * (jd - J2000)) * Math.PI / 180)
const speedAt = (jd) => {
  const result = evaluator.evaluateStates({ etSeconds: (jd - J2000) * day + tdb(jd), bodyMapping: mapping, observerId: 399, frame: 'J2000' })
  if (result.availability !== 'available') throw new Error(`evaluation failed at ${jd}: ${result.reason}`)
  return Object.fromEntries(mapping.map((row) => [row.id, transformDe405State(result.states[row.id].stateKmKmPerSec, jd).speed]))
}
const startJd = 2451545; const endJd = 2462502.5; const coarseStepDays = 10; const refineStepDays = 0.1
const coarse = { mercury: [], mars: [] }
for (let jd = startJd; jd <= endJd; jd += coarseStepDays) {
  const speeds = speedAt(jd)
  for (const id of Object.keys(coarse)) coarse[id].push({ jd, speed: speeds[id] })
}
const result = { schemaVersion: 'astrology-speed-corpus-search-v1', search: { startJd, endJd, coarseStepDays, refinement: { halfWidthDays: coarseStepDays, stepDays: refineStepDays }, selection: 'first coarse retrograde sign-change bracket; stationary minimum absolute speed after local refinement', tdbMinusTt: 'explicit deterministic periodic fixture at every query epoch' }, cases: {} }
for (const id of Object.keys(coarse)) {
  const rows = coarse[id]; const bracket = rows.find((row, index) => index > 0 && row.speed < 0 && rows[index - 1].speed >= 0)
  const center = bracket?.jd || rows.reduce((a, b) => Math.abs(b.speed) < Math.abs(a.speed) ? b : a).jd
  const refined = []
  for (let jd = center - coarseStepDays; jd <= center + coarseStepDays + 1e-9; jd += refineStepDays) refined.push({ jd, speed: speedAt(jd)[id] })
  const stationary = refined.reduce((a, b) => Math.abs(b.speed) < Math.abs(a.speed) ? b : a)
  const retrograde = refined.find((row) => row.speed < 0)
  result.cases[id] = { coarseBracket: bracket || null, selectedStationary: stationary, selectedRetrograde: retrograde || null, refinedSampleCount: refined.length }
}
await writeFile(output, JSON.stringify(result, null, 2) + '\n'); console.log(JSON.stringify({ output, cases: result.cases }, null, 2))

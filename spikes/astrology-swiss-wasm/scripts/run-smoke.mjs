import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { pathToFileURL } from 'node:url'

const spikeDir = path.resolve(import.meta.dirname, '..')
const buildName = process.env.BUILD_NAME || 'build-a'
const buildDir = path.resolve(spikeDir, 'generated', buildName)
const modulePath = path.resolve(buildDir, 'swiss-spike.mjs')
const reportPath = path.resolve(spikeDir, 'reports', `${buildName}-smoke.json`)

if (!fs.existsSync(modulePath)) {
  throw new Error(`Missing build: ${modulePath}`)
}

const { default: createSwissSpike } = await import(pathToFileURL(modulePath))
const module = await createSwissSpike({
  locateFile(fileName) {
    return path.resolve(buildDir, fileName)
  },
})

const call = (name, returnType, argumentTypes = [], args = []) => (
  module.ccall(name, returnType, argumentTypes, args)
)
const parse = (value) => JSON.parse(value)
const flags = {
  swisseph: 2,
  moshier: 4,
  speed: 256,
}
const bodies = {
  sun: 0,
  moon: 1,
  mercury: 2,
  trueNode: 11,
}

call('astro_spike_init', null, ['string'], ['/ephe'])
const julianDayUt = call(
  'astro_spike_julday',
  'number',
  ['number', 'number', 'number', 'number'],
  [2000, 1, 1, 12],
)
const bodyResults = Object.fromEntries(
  Object.entries(bodies).map(([name, body]) => [
    name,
    parse(call(
      'astro_spike_calculate_body',
      'string',
      ['number', 'number', 'number'],
      [julianDayUt, body, flags.swisseph | flags.speed],
    )),
  ]),
)

const normalPlacidus = parse(call(
  'astro_spike_calculate_houses',
  'string',
  ['number', 'number', 'number', 'number'],
  [julianDayUt, 37.5665, 126.978, 'P'.charCodeAt(0)],
))
const northHighPlacidus = parse(call(
  'astro_spike_calculate_houses',
  'string',
  ['number', 'number', 'number', 'number'],
  [julianDayUt, 80, 20, 'P'.charCodeAt(0)],
))
const northHighPorphyry = parse(call(
  'astro_spike_calculate_houses',
  'string',
  ['number', 'number', 'number', 'number'],
  [julianDayUt, 80, 20, 'O'.charCodeAt(0)],
))
const southHighPlacidus = parse(call(
  'astro_spike_calculate_houses',
  'string',
  ['number', 'number', 'number', 'number'],
  [julianDayUt, -80, 20, 'P'.charCodeAt(0)],
))
const southHighPorphyry = parse(call(
  'astro_spike_calculate_houses',
  'string',
  ['number', 'number', 'number', 'number'],
  [julianDayUt, -80, 20, 'O'.charCodeAt(0)],
))

call('astro_spike_init', null, ['string'], ['/missing'])
const missingData = parse(call(
  'astro_spike_calculate_body',
  'string',
  ['number', 'number', 'number'],
  [julianDayUt, bodies.mercury, flags.swisseph | flags.speed],
))

const sameCusps = (left, right) => (
  left.cusps.every((value, index) => Math.abs(value - right.cusps[index]) < 1e-12)
)
const artifactFiles = fs.readdirSync(buildDir)
  .filter((fileName) => fileName.startsWith('swiss-spike.'))
  .sort()

const report = {
  fixture: {
    description: 'Synthetic J2000 transport and API smoke fixture',
    utc: '2000-01-01T12:00:00Z',
    julianDayUt,
  },
  engineVersion: call('astro_spike_version', 'string'),
  requestedFlags: flags.swisseph | flags.speed,
  bodyResults,
  fallback: {
    missingData,
    detected: (
      (missingData.effectiveFlags & flags.moshier) === flags.moshier
      && (missingData.effectiveFlags & flags.swisseph) === 0
    ),
  },
  houses: {
    normalPlacidus,
    northHigh: {
      placidus: northHighPlacidus,
      porphyry: northHighPorphyry,
      fallbackMatchesPorphyry: sameCusps(northHighPlacidus, northHighPorphyry),
    },
    southHigh: {
      placidus: southHighPlacidus,
      porphyry: southHighPorphyry,
      fallbackMatchesPorphyry: sameCusps(southHighPlacidus, southHighPorphyry),
    },
  },
  artifacts: artifactFiles.map((fileName) => ({
    fileName,
    bytes: fs.statSync(path.resolve(buildDir, fileName)).size,
  })),
}

fs.mkdirSync(path.dirname(reportPath), { recursive: true })
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`)
console.log(JSON.stringify(report, null, 2))

if (!report.fallback.detected) process.exitCode = 1
if (normalPlacidus.returnCode !== 0) process.exitCode = 1
if (
  !report.houses.northHigh.fallbackMatchesPorphyry
  || !report.houses.southHigh.fallbackMatchesPorphyry
) {
  process.exitCode = 1
}

import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { homedir } from 'node:os'
import { composeAstrologyRawChart, transformDe405State } from '../src/astrology/astrologyEphemerisCore.js'
import { deriveAstrologyRuleChart } from '../src/astrology/astrologyRuleCore.js'
import { createDe405CanonicalV2EphemerisEvaluator } from '../tools/de405-canonical-v2-ephemeris-adapter.mjs'

const root = resolve(new URL('..', import.meta.url).pathname)
const kernelPath = process.env.DE405_BSP_PATH || resolve(homedir(), '.local/share/softie-de405/kernels/spk/de405.bsp')
const runnerPath = process.env.DE405_RUNNER || resolve(root, 'tools/de405-cspice-runner/build/de405-canonical-v2-runner')
const outputPath = process.env.ASTROLOGY_GOLDEN_OUTPUT || resolve(root, 'test/fixtures/astrology/golden/astrology-ephemeris-golden-v1.json')
const baseInput = {
  schemaVersion: 'astrology-time-angle-input-v0', calendar: 'proleptic_gregorian',
  candidateId: 'synthetic-de405-golden-2000-01-01T12:00:00Z', inputStatus: 'synthetic_validation_fixture', verificationStatus: 'verified',
  utc: { year: 2000, month: 1, day: 1, hour: 12, minute: 0, second: 0 },
  location: { longitudeDegreesEast: 0, geographicLatitudeDegrees: 0 },
  timeScaleOffsets: { ut1MinusUtcSeconds: 0, ttMinusUtcSeconds: 64.184, sourceStatus: 'explicit_deterministic_fixture' },
}
const DAY_SECONDS = 86400
const J2000 = 2451545
const tdbMinusTtSecondsAt = (jdTt) => 0.001657 * Math.sin((357.53 + 0.9856003 * (jdTt - J2000)) * Math.PI / 180)
const hash = (value) => createHash('sha256').update(JSON.stringify(value) + '\n').digest('hex')
const unwrapNear = (value, reference) => value + 360 * Math.round((reference - value) / 360)
const jdTt = J2000 + 64.184 / DAY_SECONDS
const evaluator = createDe405CanonicalV2EphemerisEvaluator({ runnerPath, kernelPath, requireVerifiedSelection: true })
if (evaluator.availability !== 'available') throw new Error(`DE405 evaluator unavailable: ${evaluator.reason}`)
const coverage = evaluator.provenance.coverage
const etAt = (jd) => (jd - J2000) * DAY_SECONDS + tdbMinusTtSecondsAt(jd)
const evaluateAt = (jd) => {
  const evaluated = evaluator.evaluateStates({ etSeconds: etAt(jd), bodyMapping: mapping, observerId: 399, frame: 'J2000' })
  if (evaluated.availability !== 'available') throw new Error(`DE405 evaluation failed at JD ${jd}: ${evaluated.reason}`)
  return evaluated.states
}
// The adapter requires the canonical mapping; obtain it through a composed chart for the base row.
const baseEvaluator = createDe405CanonicalV2EphemerisEvaluator({ runnerPath, kernelPath, requireVerifiedSelection: true })
const baseRaw = composeAstrologyRawChart({ timeAngleInput: baseInput, tdbMinusTtSeconds: tdbMinusTtSecondsAt(jdTt), evaluateStates: baseEvaluator.evaluateStates, kernelProvenance: { source: 'actual_de405_spk', kernelSha256: evaluator.provenance.kernelSha256, coverage } })
if (baseRaw.availability !== 'available') throw new Error(`base raw chart failed: ${baseRaw.reason}`)
const mapping = baseRaw.provenance.de405.bodyMapping
const evalMappedAt = (jd) => {
  const evaluated = evaluator.evaluateStates({ etSeconds: etAt(jd), bodyMapping: mapping, observerId: 399, frame: 'J2000' })
  if (evaluated.availability !== 'available') throw new Error(`DE405 evaluation failed at JD ${jd}: ${evaluated.reason}`)
  return evaluated.states
}
const oracle = {}
const stepSizesSeconds = [86400, 3600, 600, 60, 10, 1]
for (const body of baseRaw.bodies) {
  const errors = []; const converged = []
  for (const h of stepSizesSeconds) {
    const longitudes = {}
    for (const multiplier of [-2, -1, 0, 1, 2]) {
      const jd = jdTt + multiplier * h / DAY_SECONDS
      const row = evalMappedAt(jd)[body.id]
      const state = row.stateKmKmPerSec
      longitudes[multiplier] = transformDe405State(state, jd).longitude
    }
    const center = longitudes[0]
    const f = (n) => unwrapNear(longitudes[n], center)
    const derivative = (-f(2) + 8 * f(1) - 8 * f(-1) + f(-2)) / (12 * h) * DAY_SECONDS
    const error = derivative - body.longitudeSpeedDegreesPerDay
    errors.push({ hSeconds: h, oracleSpeedDegreesPerDay: derivative, errorDegreesPerDay: error, absoluteErrorDegreesPerDay: Math.abs(error) })
    converged.push(derivative)
  }
  const worst = errors.reduce((a, b) => b.absoluteErrorDegreesPerDay > a.absoluteErrorDegreesPerDay ? b : a)
  const selected = errors.find((row) => row.hSeconds === 3600)
  oracle[body.id] = { stepSizesSeconds, errors, selectedStep: selected, worstCaseAcrossStepSweep: worst, convergedAtSmallestStep: converged.at(-1) }
}
const ruleCore = deriveAstrologyRuleChart(baseRaw)
const rawChart = { ...baseRaw, audit: { speedMeaning: 'd/dt of mean ecliptic-and-equinox-of-date longitude', movingFrameTerm: 'Rdot_r_included', frozenFrameDiagnosticPresent: true, tdbMinusTtModel: 'explicit_epoch_function_not_zero', oracleFormula: 'five_point_central_difference_with_unwrap' } }
const evidence = {
  schemaVersion: 'astrology-ephemeris-golden-evidence-v1', availability: 'available', availableForInterpretation: false, integrationStatus: 'not_connected',
  fixture: { id: baseInput.candidateId, selectionRule: 'fixed synthetic J2000-adjacent UTC case; no personal birth data', input: baseInput, tdbMinusTt: { seconds: tdbMinusTtSecondsAt(jdTt), model: 'deterministic_periodic_fixture', status: 'explicit_supplied_at_each_oracle_epoch' } },
  kernel: { source: 'NAIF DE405 SPK via CSPICE N0067 canonical-v2 runner', sha256: evaluator.provenance.kernelSha256, coverage: { startEt: coverage.coverageStartEt, endEt: coverage.coverageEndEt }, pathsOmitted: true },
  mapping: { observerId: 399, observer: 'EARTH', frame: 'J2000/ICRF geometric', output: 'mean_ecliptic_and_equinox_of_date', bodyOrder: rawChart.bodies.map((b) => b.id), bodyMapping: mapping },
  rawChart: { value: rawChart, sha256: hash(rawChart) }, ruleCore: { value: ruleCore, sha256: hash(ruleCore) }, oracle, generatedBy: 'scripts/materialize-astrology-ephemeris-golden.mjs', generatorSchema: 'v1',
}
await mkdir(dirname(outputPath), { recursive: true }); await writeFile(outputPath, JSON.stringify(evidence, null, 2) + '\n')
console.log(JSON.stringify({ outputPath, rawChartSha256: evidence.rawChart.sha256, ruleCoreSha256: evidence.ruleCore.sha256, bodyCount: rawChart.bodies.length }, null, 2))

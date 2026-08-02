import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
const path = process.argv[2] || resolve(new URL('../test/fixtures/astrology/golden/astrology-ephemeris-golden-v1.json', import.meta.url).pathname)
const doc = JSON.parse(await readFile(path, 'utf8'))
const hash = (value) => createHash('sha256').update(JSON.stringify(value) + '\n').digest('hex')
const fail = (message) => { throw new Error(message) }
if (doc.schemaVersion !== 'astrology-ephemeris-golden-evidence-v1' || doc.availability !== 'available') fail('evidence status/schema invalid')
if (doc.availableForInterpretation !== false || doc.integrationStatus !== 'not_connected') fail('integration shield invalid')
if (doc.rawChart.sha256 !== hash(doc.rawChart.value) || doc.ruleCore.sha256 !== hash(doc.ruleCore.value)) fail('embedded hash mismatch')
if (doc.rawChart.value.schemaVersion !== 'astrology-raw-chart-v1' || doc.rawChart.value.bodies.length !== 10) fail('raw chart contract incomplete')
for (const body of doc.rawChart.value.bodies) if (!Number.isFinite(body.longitudeDegrees) || !Number.isFinite(body.longitudeSpeedDegreesPerDay)) fail(`invalid body ${body.id}`)
if (!Number.isFinite(doc.rawChart.value.angles.ascendant.longitudeDegrees) || !Number.isFinite(doc.rawChart.value.angles.midheaven.longitudeDegrees)) fail('ASC/MC unavailable')
for (const [id, row] of Object.entries(doc.oracle)) if (!row.selectedStep || !row.worstCaseAcrossStepSweep || row.errors.length !== 6) fail(`oracle incomplete for ${id}`)
const serialized = JSON.stringify(doc)
if (serialized.includes('/Users/') || serialized.includes('/private/tmp') || serialized.includes('native binary') || serialized.includes('spkBytes')) fail('forbidden local path/native bytes present')
console.log(JSON.stringify({ status: 'pass', path, rawChartSha256: doc.rawChart.sha256, ruleCoreSha256: doc.ruleCore.sha256, maxSelectedStepError: Math.max(...Object.values(doc.oracle).map((r) => r.selectedStep.absoluteErrorDegreesPerDay)), maxSweepError: Math.max(...Object.values(doc.oracle).map((r) => r.worstCaseAcrossStepSweep.absoluteErrorDegreesPerDay)) }, null, 2))

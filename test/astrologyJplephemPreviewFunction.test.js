import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import { mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { tmpdir } from 'node:os'
import test from 'node:test'
import { deriveAstrologyRuleChart } from '../src/astrology/astrologyRuleCore.js'
import { deriveAstrologyTimeAngle } from '../src/astrology/astrologyTimeAngleCore.js'

const ROOT = resolve('.')
const API = resolve('api/astrology.py')
const REQUEST = resolve('test/fixtures/astrology/jplephem-preview-request-v1.json')
const REQUEST_VALUE = JSON.parse(await readFile(REQUEST, 'utf8'))
const FIXTURE = JSON.parse(await readFile('api/provider/provider-equivalence-v1.json', 'utf8'))
const GOLDEN = JSON.parse(await readFile('test/fixtures/astrology/golden/astrology-ephemeris-golden-v1.json', 'utf8'))
const PYTHON = process.env.ASTROLOGY_PYTHON || 'python3'
const PYTHON_READY = spawnSync(PYTHON, ['-c', 'import jplephem, numpy'], { encoding: 'utf8' }).status === 0

function runPython(args) {
  return spawnSync(PYTHON, args, { cwd: ROOT, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 })
}

function semanticProjection(rule) {
  return {
    bodies: rule.bodies.map(({ id, signId, signIndex, boundaryStatus, motionState, retrograde, availability }) => ({ id, signId, signIndex, boundaryStatus, motionState, retrograde, availability })),
    angles: ['ascendant', 'midheaven'].map(id => ({ id, signId: rule.angles[id].signId, signIndex: rule.angles[id].signIndex, boundaryStatus: rule.angles[id].boundaryStatus, availability: rule.angles[id].availability })),
    houses: { availability: rule.houses.availability, houseSystem: rule.houses.houseSystem, ascendantSignId: rule.houses.ascendantSignId, ascendantSignIndex: rule.houses.ascendantSignIndex, placements: rule.houses.placements.map(({ id, house, availability }) => ({ id, house, availability })) },
    chartRulers: { availability: rule.chartRulers.availability, ascendantSignId: rule.chartRulers.ascendantSignId, traditionalChartRuler: rule.chartRulers.traditionalChartRuler, modernChartRuler: rule.chartRulers.modernChartRuler },
    aspects: rule.aspects.map(({ id, pointA, pointB, aspectId, orbBoundaryStatus, phase, phaseReason }) => ({ id, pointA, pointB, aspectId, orbBoundaryStatus, phase, phaseReason })),
    distribution: { overall: rule.distribution.overall, personal: rule.distribution.personal },
  }
}

function runRequest(requestPath) {
  const result = runPython([API, requestPath])
  assert.equal(result.status, 0, result.stderr)
  return { bytes: result.stdout, value: JSON.parse(result.stdout) }
}

function assertApprox(actual, expected, limit, label) {
  assert.ok(Math.abs(actual - expected) <= limit, `${label}: ${actual} vs ${expected}`)
}

test('preview route is explicitly Python 3.14, fixture-bound, and separate from frozen CSPICE packet', async () => {
  const source = await readFile(API, 'utf8')
  const producer = await readFile('api/provider/astrology-jplephem-producer.py', 'utf8')
  const config = await readFile('vercel.json', 'utf8')
  assert.match(source, /class handler\(BaseHTTPRequestHandler\)/)
  assert.match(source, /REQUEST_SCHEMA = "astrology-jplephem-preview-request-v1"/)
  assert.match(source, /BSP_PATH = ROOT \/ "api" \/ "provider" \/ "de405\.bsp"/)
  assert.match(producer, /EXPECTED_PYTHON_ABI = "cpython-314"/)
  assert.match(producer, /sys\.implementation\.cache_tag/)
  assert.doesNotMatch(config, /"runtime":\s*"python3\.14"/)
  assert.equal(await readFile('.python-version', 'utf8'), '3.14.7\n')
  assert.match(config, /api\/provider\/de405\.bsp/)
  assert.match(config, /api\/provider\/de405-only-release-contract-v1\.json/)
  assert.match(config, /api\/provider\/NOTICE\.md/)
  assert.match(config, /api\/provider\/astrology-jplephem-producer\.py/)
  assert.match(config, /\.env/)
  assert.match(config, /\.agents\/\*\*/)
  assert.doesNotMatch(source, /interpretationPacket|localVerifiedOrchestration|spawn|subprocess/)
})

test('fresh jplephem process creates raw and existing Rule Core-compatible FACTs', { skip: !PYTHON_READY }, () => {
  const { value } = runRequest(REQUEST)
  const packet = value.packet
  assert.equal(value.schemaVersion, 'astrology-jplephem-fact-handoff-v1')
  assert.equal(value.status, 'complete')
  assert.equal(packet.provider.id, 'jplephem')
  assert.equal(packet.provider.version, '2.24')
  assert.equal(packet.provider.pythonImplementation, 'cpython')
  assert.equal(packet.provider.pythonAbi, 'cpython-314')
  assert.match(packet.provider.pythonVersion, /^3\.14\.\d+$/)
  assert.equal(packet.provider.sourceSha256, '30a7113793ee5b6bf1e5546c6dfc21d9682d9ffabfe9b17b4bab27ba2ac75c89')
  assert.equal(packet.activation.availableForInterpretation, false)
  assert.equal(packet.activation.integrationStatus, 'not_connected')
  assert.equal(packet.packetStatus, 'complete')
  assert.equal(packet.usableForFactConsumption, true)
  assert.equal(packet.rawChart.bodies.length, 10)
  assert.equal(packet.ruleChart.bodies.length, 10)
  assert.equal(packet.ruleChart.metadata.houseSystem, 'whole_sign')
  assert.equal(value.factOnlyHandoff.schemaVersion, 'astrology-jplephem-fact-handoff-v1')
})

test('Python port and existing JavaScript Rule Core agree on all discrete FACTs', { skip: !PYTHON_READY }, () => {
  const { value } = runRequest(REQUEST)
  const packet = value.packet
  const expected = deriveAstrologyRuleChart(packet.rawChart)
  assert.deepEqual(semanticProjection(packet.ruleChart), semanticProjection(expected))
  const item = FIXTURE.fixtures.find(candidate => candidate.id === 'golden_2000')
  const location = FIXTURE.locations.find(candidate => candidate.id === 'seoul')
  const time = deriveAstrologyTimeAngle({
    schemaVersion: 'astrology-time-angle-input-v0',
    calendar: 'proleptic_gregorian',
    candidateId: 'golden_2000:seoul',
    inputStatus: 'fixture_validated_preview',
    verificationStatus: 'verified',
    utc: item.utc,
    location: { longitudeDegreesEast: location.longitudeDegreesEast, geographicLatitudeDegrees: location.latitudeDegrees },
    timeScaleOffsets: { ut1MinusUtcSeconds: FIXTURE.time.ut1MinusUtcSeconds, ttMinusUtcSeconds: FIXTURE.time.ttMinusUtcSeconds, sourceStatus: 'explicit_deterministic_fixture' },
  })
  assertApprox(packet.input.location.longitudeDegreesEast, location.longitudeDegreesEast, 0, 'longitude input')
  assertApprox(packet.rawChart.angles.ascendant.longitudeDegrees, time.rawAngles.ascendant.longitudeDegrees, 1e-9, 'ascendant')
  assertApprox(packet.rawChart.angles.midheaven.longitudeDegrees, time.rawAngles.midheaven.longitudeDegrees, 1e-9, 'midheaven')
  for (const [actual, expectedBody] of packet.rawChart.bodies.map((body, index) => [body, GOLDEN.rawChart.value.bodies[index]])) {
    assertApprox(actual.longitudeDegrees, expectedBody.longitudeDegrees, 0.01, `${actual.id} longitude`)
    assertApprox(actual.longitudeSpeedDegreesPerDay, expectedBody.longitudeSpeedDegreesPerDay, 1e-7, `${actual.id} speed`)
  }
})

test('repeated fresh processes and multiple declared locations stay deterministic', { skip: !PYTHON_READY }, async () => {
  const first = runRequest(REQUEST)
  const second = runRequest(REQUEST)
  assert.equal(first.bytes, second.bytes)
  const work = await mkdtemp(join(tmpdir(), 'astrology-jplephem-preview-'))
  for (const locationId of ['seoul', 'busan', 'jeju', 'incheon']) {
    const request = JSON.parse(await readFile(REQUEST, 'utf8'))
    request.locationId = locationId
    const path = join(work, `${locationId}.json`)
    await writeFile(path, JSON.stringify(request) + '\n')
    const { value } = runRequest(path)
    assert.equal(value.packet.input.locationId, locationId)
    assert.equal(value.packet.input.location.latitudeDegrees, FIXTURE.locations.find(location => location.id === locationId).latitudeDegrees)
    assert.equal(value.packet.rawChart.bodies[0].id, 'sun')
    assert.equal(value.packet.ruleChart.houses.availability, 'available')
  }
})

test('fresh-file checker accepts an intact handoff and rejects provider tampering and missing handoff', { skip: !PYTHON_READY }, async () => {
  const { bytes } = runRequest(REQUEST)
  const work = await mkdtemp(join(tmpdir(), 'astrology-jplephem-preview-check-'))
  const intact = join(work, 'intact.json')
  await writeFile(intact, bytes)
  const checker = resolve('scripts/check-astrology-jplephem-preview-v1.mjs')
  assert.doesNotThrow(() => execFileSync(process.execPath, [checker, intact], { cwd: ROOT, encoding: 'utf8' }))

  const wrongProvider = join(work, 'wrong-provider.json')
  await writeFile(wrongProvider, bytes.replace('"id":"jplephem"', '"id":"cspice"'))
  const wrongProviderCheck = spawnSync(process.execPath, [checker, wrongProvider], { cwd: ROOT, encoding: 'utf8' })
  assert.notEqual(wrongProviderCheck.status, 0)
  assert.match(`${wrongProviderCheck.stdout}${wrongProviderCheck.stderr}`, /provider_id_mismatch|response_content_hash_mismatch/)

  const missingHandoff = join(work, 'missing-handoff.json')
  const missingHandoffValue = JSON.parse(bytes)
  missingHandoffValue.factOnlyHandoff = null
  await writeFile(missingHandoff, JSON.stringify(missingHandoffValue))
  const missingHandoffCheck = spawnSync(process.execPath, [checker, missingHandoff], { cwd: ROOT, encoding: 'utf8' })
  assert.notEqual(missingHandoffCheck.status, 0)
  assert.match(`${missingHandoffCheck.stdout}${missingHandoffCheck.stderr}`, /handoff_missing|response_content_hash_mismatch/)
})

test('missing or invalid request/provider asset fails closed before a FACT packet', { skip: !PYTHON_READY }, () => {
  const invalid = runPython(['-c', `import importlib.util; s=importlib.util.spec_from_file_location("a", "api/astrology.py"); m=importlib.util.module_from_spec(s); s.loader.exec_module(m); m.build_preview({})`])
  assert.notEqual(invalid.status, 0)
  assert.match(invalid.stderr, /PreviewError|request_fields_mismatch/)
  const requestJson = JSON.stringify(JSON.stringify(REQUEST_VALUE))
  const missingAsset = runPython(['-c', `import importlib.util,json; from pathlib import Path; s=importlib.util.spec_from_file_location("a", "api/astrology.py"); m=importlib.util.module_from_spec(s); s.loader.exec_module(m); m.BSP_PATH=Path("/tmp/astrology-missing-de405.bsp"); m.build_preview(json.loads(${requestJson}))`])
  assert.notEqual(missingAsset.status, 0)
})

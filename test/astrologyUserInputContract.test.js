import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import { mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { tmpdir } from 'node:os'
import test from 'node:test'
import { deriveAstrologyRuleChart } from '../src/astrology/astrologyRuleCore.js'

const ROOT = resolve('.')
const API = resolve('api/astrology.py')
const CHECKER = resolve('scripts/check-astrology-user-input-v1.mjs')
const REQUEST = resolve('test/fixtures/astrology/jplephem-user-input-request-v1.json')
const REQUEST_VALUE = JSON.parse(await readFile(REQUEST, 'utf8'))
const GOLDEN = JSON.parse(await readFile('test/fixtures/astrology/golden/astrology-ephemeris-golden-v1.json', 'utf8'))
const PYTHON = process.env.ASTROLOGY_PYTHON || 'python3'
const PYTHON_READY = spawnSync(PYTHON, ['-c', 'import jplephem, numpy'], { encoding: 'utf8' }).status === 0

function runPython(args) {
  return spawnSync(PYTHON, args, { cwd: ROOT, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 })
}

function runPath(path) {
  const result = runPython([API, path])
  assert.equal(result.status, 0, result.stderr)
  return { bytes: result.stdout, value: JSON.parse(result.stdout) }
}

async function runValue(value, directory) {
  const path = join(directory, 'request.json')
  await writeFile(path, `${JSON.stringify(value)}\n`)
  return runPath(path)
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

test('user input normalization produces a verified canonical input and the existing FACT-only handoff', { skip: !PYTHON_READY }, () => {
  const { value } = runPath(REQUEST)
  const canonical = value.canonicalInput
  const packet = value.verifiedResponse.packet
  assert.equal(value.schemaVersion, 'astrology-jplephem-user-input-handoff-v1')
  assert.equal(value.status, 'complete')
  assert.equal(value.normalizationStatus, 'verified_fixture')
  assert.equal(canonical.status, 'verified_fixture')
  assert.equal(canonical.userInput.locationId, 'sgg:41210')
  assert.equal(canonical.civilTime.status, 'exact')
  assert.deepEqual(canonical.civilTime.utc, { year: 2000, month: 1, day: 1, hour: 12, minute: 0, second: 0 })
  assert.equal(canonical.civilTime.resolver.ianaZone, 'Asia/Seoul')
  assert.equal(canonical.civilTime.resolver.assetSha256, '2c8f4bb15dd77090b497e2a841ff3323ecbbae4f9dbb9edead2f8dd8fb5d8bb4')
  assert.equal(canonical.location.id, 'sgg:41210')
  assert.equal(canonical.location.label, '경기도 광명시')
  assert.equal(canonical.location.resolution, 'administrative_area_representative_point')
  assert.equal(canonical.location.latitudeDegrees, 37.447293)
  assert.equal(canonical.location.longitudeDegreesEast, 126.866995)
  assert.equal(canonical.location.coordinateProvenance.sourceSha256, 'e612605e957e71ea2770876331eb20965820590bc57e5a98a91bc9307a678ec9')
  assert.equal(canonical.timeScale.status, 'verified_fixture')
  assert.equal(canonical.timeScale.outputScale, 'TDB')
  assert.equal(canonical.ephemeris.status, 'verified')
  assert.equal(canonical.ephemeris.sourceSha256, packet.provider.sourceSha256)
  assert.equal(packet.input.locationId, 'sgg:41210')
  assert.deepEqual(packet.input.utc, canonical.civilTime.utc)
  assert.equal(packet.input.location.latitudeDegrees, canonical.location.latitudeDegrees)
  assert.equal(packet.input.location.longitudeDegreesEast, canonical.location.longitudeDegreesEast)
  assert.equal(packet.input.fixtureCaseId, 'golden_2000')
  assert.equal(packet.rawChart.inputStatus, 'user_input_normalized_fixture_verified')
  assert.deepEqual(semanticProjection(packet.ruleChart), semanticProjection(deriveAstrologyRuleChart(packet.rawChart)))
  for (const [actual, expected] of packet.rawChart.bodies.map((body, index) => [body, GOLDEN.rawChart.value.bodies[index]])) {
    assert.ok(Math.abs(actual.longitudeDegrees - expected.longitudeDegrees) <= 0.01, `${actual.id} longitude`)
    assert.ok(Math.abs(actual.longitudeSpeedDegreesPerDay - expected.longitudeSpeedDegreesPerDay) <= 1e-7, `${actual.id} speed`)
  }
  assert.equal(packet.activation.availableForInterpretation, false)
  assert.equal(packet.factOnlyHandoff, undefined)
  assert.equal(value.verifiedResponse.factOnlyHandoff.usable, true)
})

test('user input supports the verified Korean location snapshot without treating representative points as exact addresses', { skip: !PYTHON_READY }, async () => {
  const directory = await mkdtemp(join(tmpdir(), 'astrology-user-input-locations-'))
  for (const [locationId, label, latitude, longitude] of [
    ['sgg:11110', '서울특별시 종로구', 37.598991, 126.967598],
    ['sgg:26350', '부산광역시 해운대구', 35.199396, 129.146297],
    ['sgg:50110', '제주특별자치도 제주시', 33.420094, 126.482291],
  ]) {
    const request = structuredClone(REQUEST_VALUE)
    request.userInput.locationId = locationId
    const { value } = await runValue(request, directory)
    assert.equal(value.status, 'complete')
    assert.equal(value.canonicalInput.location.label, label)
    assert.equal(value.canonicalInput.location.latitudeDegrees, latitude)
    assert.equal(value.canonicalInput.location.longitudeDegreesEast, longitude)
    assert.equal(value.canonicalInput.location.resolution, 'administrative_area_representative_point')
    assert.equal(value.verifiedResponse.packet.input.locationId, locationId)
    assert.equal(value.verifiedResponse.packet.input.location.latitudeDegrees, latitude)
    assert.equal(value.verifiedResponse.packet.input.location.longitudeDegreesEast, longitude)
  }
})

test('normalization rejects DST gaps, unresolved folds, and direct timezone/coordinate/UTC injection', { skip: !PYTHON_READY }, async () => {
  const directory = await mkdtemp(join(tmpdir(), 'astrology-user-input-boundaries-'))
  const gap = structuredClone(REQUEST_VALUE)
  gap.userInput.localDateTime = { year: 1988, month: 5, day: 8, hour: 2, minute: 30, second: 0 }
  let result = await runValue(gap, directory)
  assert.equal(result.value.status, 'blocked')
  assert.equal(result.value.reason, 'civil_time_nonexistent')
  assert.equal(result.value.canonicalInput.civilTime.status, 'gap')
  assert.equal('verifiedResponse' in result.value, false)

  const overlap = structuredClone(REQUEST_VALUE)
  overlap.userInput.localDateTime = { year: 1987, month: 10, day: 11, hour: 2, minute: 30, second: 0 }
  result = await runValue(overlap, directory)
  assert.equal(result.value.status, 'blocked')
  assert.equal(result.value.reason, 'civil_time_ambiguous')
  assert.equal(result.value.canonicalInput.civilTime.status, 'overlap')
  assert.equal(result.value.canonicalInput.civilTime.candidates.length, 2)

  const fold0 = structuredClone(overlap)
  fold0.userInput.fold = 0
  const fold1 = structuredClone(overlap)
  fold1.userInput.fold = 1
  const first = await runValue(fold0, directory)
  const second = await runValue(fold1, directory)
  assert.equal(first.value.canonicalInput.civilTime.status, 'overlap_resolved')
  assert.equal(second.value.canonicalInput.civilTime.status, 'overlap_resolved')
  assert.notDeepEqual(first.value.canonicalInput.civilTime.utc, second.value.canonicalInput.civilTime.utc)
  assert.equal(first.value.reason, 'time_scale_evidence_unavailable')
  assert.equal(second.value.reason, 'time_scale_evidence_unavailable')

  const injected = structuredClone(REQUEST_VALUE)
  injected.userInput.utc = injected.userInput.localDateTime
  result = await runValue(injected, directory)
  assert.equal(result.value.status, 'blocked')
  assert.equal(result.value.reason, 'request_fields_mismatch')

  const timezoneInjected = structuredClone(REQUEST_VALUE)
  timezoneInjected.userInput.timeZone = 'UTC'
  result = await runValue(timezoneInjected, directory)
  assert.equal(result.value.status, 'blocked')
  assert.equal(result.value.reason, 'request_fields_mismatch')
})

test('valid civil/location input stops at missing time-scale evidence instead of estimating or extrapolating', { skip: !PYTHON_READY }, async () => {
  const directory = await mkdtemp(join(tmpdir(), 'astrology-user-input-timescale-'))
  const request = structuredClone(REQUEST_VALUE)
  request.userInput.localDateTime = { year: 2024, month: 1, day: 1, hour: 12, minute: 0, second: 0 }
  const { value } = await runValue(request, directory)
  assert.equal(value.status, 'blocked')
  assert.equal(value.reason, 'time_scale_evidence_unavailable')
  assert.equal(value.canonicalInput.civilTime.status, 'exact')
  assert.equal(value.canonicalInput.timeScale.status, 'blocked')
  assert.equal(value.canonicalInput.timeScale.fallbackPolicy, 'none')
  assert.equal(value.canonicalInput.ephemeris.status, 'not_evaluated')
  assert.equal('verifiedResponse' in value, false)
})

test('fresh-file user handoff checker rejects canonical, provider, missing, and asset-tampered artifacts', { skip: !PYTHON_READY }, async () => {
  const directory = await mkdtemp(join(tmpdir(), 'astrology-user-input-check-'))
  const { bytes, value } = runPath(REQUEST)
  const intact = join(directory, 'intact.json')
  await writeFile(intact, bytes)
  assert.doesNotThrow(() => execFileSync(process.execPath, [CHECKER, intact], { cwd: ROOT, encoding: 'utf8' }))

  const canonicalTamper = structuredClone(value)
  canonicalTamper.canonicalInput.location.latitudeDegrees = 35.0
  const canonicalTamperPath = join(directory, 'canonical-tamper.json')
  await writeFile(canonicalTamperPath, `${JSON.stringify(canonicalTamper)}\n`)
  const canonicalCheck = spawnSync(process.execPath, [CHECKER, canonicalTamperPath], { cwd: ROOT, encoding: 'utf8' })
  assert.notEqual(canonicalCheck.status, 0)
  assert.match(`${canonicalCheck.stdout}${canonicalCheck.stderr}`, /canonical_input_content_hash_mismatch|response_content_hash_mismatch/u)

  const providerTamper = structuredClone(value)
  providerTamper.verifiedResponse.packet.provider.id = 'cspice'
  const providerTamperPath = join(directory, 'provider-tamper.json')
  await writeFile(providerTamperPath, `${JSON.stringify(providerTamper)}\n`)
  const providerCheck = spawnSync(process.execPath, [CHECKER, providerTamperPath], { cwd: ROOT, encoding: 'utf8' })
  assert.notEqual(providerCheck.status, 0)
  assert.match(`${providerCheck.stdout}${providerCheck.stderr}`, /verified_response_content_hash_mismatch|verified_provider_id_mismatch|response_content_hash_mismatch/u)

  const missing = structuredClone(value)
  delete missing.verifiedResponse
  const missingPath = join(directory, 'missing-verified-response.json')
  await writeFile(missingPath, `${JSON.stringify(missing)}\n`)
  const missingCheck = spawnSync(process.execPath, [CHECKER, missingPath], { cwd: ROOT, encoding: 'utf8' })
  assert.notEqual(missingCheck.status, 0)
  assert.match(`${missingCheck.stdout}${missingCheck.stderr}`, /response_content_hash_mismatch|verified_response_missing/u)

  const expression = `import importlib.util,json; from pathlib import Path; s=importlib.util.spec_from_file_location("a", "api/astrology.py"); m=importlib.util.module_from_spec(s); s.loader.exec_module(m); m.TIMEZONE_ASSET_PATH=Path(${JSON.stringify(join(directory, 'missing.tzif'))}); print(json.dumps(m.build_user_input_preview(json.loads(${JSON.stringify(JSON.stringify(REQUEST_VALUE))})), ensure_ascii=False, sort_keys=True))`
  const missingAsset = runPython(['-c', expression])
  assert.equal(missingAsset.status, 0, missingAsset.stderr)
  const missingAssetValue = JSON.parse(missingAsset.stdout)
  assert.equal(missingAssetValue.reason, 'timezone_asset_missing')
  const blockedPath = join(directory, 'blocked.json')
  await writeFile(blockedPath, `${JSON.stringify(missingAssetValue)}\n`)
  assert.doesNotThrow(() => execFileSync(process.execPath, [CHECKER, blockedPath], { cwd: ROOT, encoding: 'utf8' }))

  const timezoneAsset = await readFile('api/provider/asia-seoul.tzif')
  const tamperedAsset = Buffer.from(timezoneAsset)
  tamperedAsset[0] ^= 1
  const tamperedAssetPath = join(directory, 'tampered.tzif')
  await writeFile(tamperedAssetPath, tamperedAsset)
  const tamperedExpression = `import importlib.util,json; from pathlib import Path; s=importlib.util.spec_from_file_location("a", "api/astrology.py"); m=importlib.util.module_from_spec(s); s.loader.exec_module(m); m.TIMEZONE_ASSET_PATH=Path(${JSON.stringify(tamperedAssetPath)}); print(json.dumps(m.build_user_input_preview(json.loads(${JSON.stringify(JSON.stringify(REQUEST_VALUE))})), ensure_ascii=False, sort_keys=True))`
  const tamperedAssetResult = runPython(['-c', tamperedExpression])
  assert.equal(tamperedAssetResult.status, 0, tamperedAssetResult.stderr)
  assert.equal(JSON.parse(tamperedAssetResult.stdout).reason, 'timezone_asset_sha_mismatch')
})

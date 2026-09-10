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
const REQUEST_VALUE = JSON.parse(await readFile('test/fixtures/astrology/jplephem-user-input-request-v1.json', 'utf8'))
const PYTHON = process.env.ASTROLOGY_PYTHON || 'python3'
const PYTHON_READY = spawnSync(PYTHON, ['-c', 'import jplephem, numpy'], { encoding: 'utf8' }).status === 0

function runPython(args) {
  return spawnSync(PYTHON, args, { cwd: ROOT, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 })
}

async function runRequest(request, directory, name) {
  const requestPath = join(directory, `${name}-request.json`)
  const outputPath = join(directory, `${name}-response.json`)
  await writeFile(requestPath, `${JSON.stringify(request)}\n`)
  const result = runPython([API, requestPath])
  assert.equal(result.status, 0, result.stderr)
  await writeFile(outputPath, result.stdout)
  return { bytes: result.stdout, value: JSON.parse(result.stdout), outputPath }
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

test('arbitrary-date route produces source-relative FACT packets across the supported interval', { skip: !PYTHON_READY }, async () => {
  const directory = await mkdtemp(join(tmpdir(), 'astrology-arbitrary-date-'))
  const cases = [
    ['interval-start', { year: 1962, month: 1, day: 1, hour: 9, minute: 0, second: 0 }],
    ['historical', { year: 1987, month: 10, day: 11, hour: 2, minute: 30, second: 0 }, 0],
    ['modern', { year: 2024, month: 1, day: 1, hour: 12, minute: 0, second: 0 }],
    ['interval-end', { year: 2026, month: 8, day: 10, hour: 9, minute: 0, second: 0 }],
  ]
  let repeated
  for (const [name, localDateTime, fold = null] of cases) {
    const request = structuredClone(REQUEST_VALUE)
    request.userInput.localDateTime = localDateTime
    request.userInput.fold = fold
    const result = await runRequest(request, directory, name)
    assert.equal(result.value.status, 'complete', `${name}: ${result.value.reason || ''}`)
    assert.equal(result.value.normalizationStatus, 'verified_source_relative')
    assert.equal(result.value.canonicalInput.timeScale.status, 'verified_source_relative')
    assert.equal(result.value.verifiedResponse.packet.factFrame.mode, 'source_relative_deterministic')
    assert.equal(result.value.verifiedResponse.packet.boundaryAssessment.status, 'indeterminate')
    assert.equal(result.value.verifiedResponse.packet.boundaryAssessment.intervalBacked.status, 'blocked')
    assert.deepEqual(semanticProjection(result.value.verifiedResponse.packet.ruleChart), semanticProjection(deriveAstrologyRuleChart(result.value.verifiedResponse.packet.rawChart)))
    assert.doesNotThrow(() => execFileSync(process.execPath, [CHECKER, result.outputPath], { cwd: ROOT, encoding: 'utf8' }))
    if (name === 'modern') repeated = result
  }

  const repeatRequest = structuredClone(REQUEST_VALUE)
  repeatRequest.userInput.localDateTime = { year: 2024, month: 1, day: 1, hour: 12, minute: 0, second: 0 }
  const second = await runRequest(repeatRequest, directory, 'modern-repeat')
  assert.equal(second.bytes, repeated.bytes)
  const packet = repeated.value.verifiedResponse.packet
  assert.equal(packet.provider.sourceIdentity, 'unmodified_official_naif_de405_bsp')
  assert.equal(packet.provider.sourceSha256, '30a7113793ee5b6bf1e5546c6dfc21d9682d9ffabfe9b17b4bab27ba2ac75c89')
  assert.equal(packet.provenance.timeScaleBundle.canonicalSha256, 'eec8801b2c7b4a0c002a3bf24a76714f60c2c334c5ea63113c37a24ef6f6cf2b')
  assert.equal(packet.provenance.boundaryContractCanonicalSha256, 'a8451af3e48b2183c21d90ded20e2dcde6fd968f4e5fc6a45fce4ba353bae014')
  assert.equal(packet.availableForInterpretation, false)
  assert.equal(packet.blockedFeatures.length, 1)
  assert.equal(packet.blockedFeatures[0].feature, 'interpretation_service_activation')
  assert.equal(packet.unsupportedFeatures.some(item => item.feature === 'true_node'), true)
})

test('arbitrary-date route preserves selected representative coordinates and rejects discrete boundary cases', { skip: !PYTHON_READY }, async () => {
  const directory = await mkdtemp(join(tmpdir(), 'astrology-arbitrary-location-'))
  const locations = [
    ['sgg:11110', 37.598991, 126.967598],
    ['sgg:26350', 35.199396, 129.146297],
    ['sgg:50110', 33.420094, 126.482291],
  ]
  const ascendants = []
  for (const [locationId, latitude, longitude] of locations) {
    const request = structuredClone(REQUEST_VALUE)
    request.userInput.locationId = locationId
    const result = await runRequest(request, directory, locationId.replace(':', '-'))
    assert.equal(result.value.status, 'complete')
    const location = result.value.canonicalInput.location
    assert.equal(location.latitudeDegrees, latitude)
    assert.equal(location.longitudeDegreesEast, longitude)
    assert.equal(location.resolution, 'administrative_area_representative_point')
    assert.deepEqual(result.value.verifiedResponse.packet.input.location, location)
    ascendants.push(result.value.verifiedResponse.packet.ruleChart.angles.ascendant.longitudeDegrees)
  }
  assert.equal(new Set(ascendants).size, locations.length)

  const outside = structuredClone(REQUEST_VALUE)
  outside.userInput.localDateTime = { year: 1962, month: 1, day: 1, hour: 8, minute: 59, second: 59 }
  const outsideResult = (await runRequest(outside, directory, 'outside-c04')).value
  assert.equal(outsideResult.status, 'blocked')
  assert.equal(outsideResult.reason, 'outside_C04_snapshot_coverage')
  assert.equal(outsideResult.canonicalInput.timeScale.status, 'blocked')

  const interpolationBoundary = structuredClone(REQUEST_VALUE)
  interpolationBoundary.userInput.localDateTime = { year: 1972, month: 1, day: 1, hour: 21, minute: 0, second: 0 }
  const boundaryResult = (await runRequest(interpolationBoundary, directory, 'c04-segment-boundary')).value
  assert.equal(boundaryResult.status, 'blocked')
  assert.equal(boundaryResult.reason, 'interpolation_window_crosses_UTC_TAI_segment_boundary')
})

test('arbitrary-date packet and time-scale assets fail closed when tampered or missing', { skip: !PYTHON_READY }, async () => {
  const directory = await mkdtemp(join(tmpdir(), 'astrology-arbitrary-tamper-'))
  const intact = await runRequest(REQUEST_VALUE, directory, 'intact')

  const missingBoundary = structuredClone(intact.value)
  delete missingBoundary.verifiedResponse.packet.boundaryAssessment
  const missingBoundaryPath = join(directory, 'missing-boundary.json')
  await writeFile(missingBoundaryPath, `${JSON.stringify(missingBoundary)}\n`)
  const missingBoundaryCheck = spawnSync(process.execPath, [CHECKER, missingBoundaryPath], { cwd: ROOT, encoding: 'utf8' })
  assert.notEqual(missingBoundaryCheck.status, 0)
  assert.match(`${missingBoundaryCheck.stdout}${missingBoundaryCheck.stderr}`, /response_content_hash_mismatch|boundary_assessment_missing/u)

  const missingBspExpression = `import importlib.util,json; from pathlib import Path; s=importlib.util.spec_from_file_location("a", "api/astrology.py"); m=importlib.util.module_from_spec(s); s.loader.exec_module(m); m.BSP_PATH=Path(${JSON.stringify(join(directory, 'missing-de405.bsp'))}); print(json.dumps(m.build_user_input_preview(json.loads(${JSON.stringify(JSON.stringify(REQUEST_VALUE))})), ensure_ascii=False, sort_keys=True))`
  const missingBsp = runPython(['-c', missingBspExpression])
  assert.equal(missingBsp.status, 0, missingBsp.stderr)
  const missingBspValue = JSON.parse(missingBsp.stdout)
  assert.equal(missingBspValue.status, 'blocked')
  assert.equal(missingBspValue.reason, 'de405_bsp_missing')

  const missingBundleExpression = `import importlib.util; from pathlib import Path; s=importlib.util.spec_from_file_location("a", "api/astrology.py"); m=importlib.util.module_from_spec(s); s.loader.exec_module(m); p=m._load_time_scale_provider(); p.BUNDLE_PATH=Path(${JSON.stringify(join(directory, 'missing-time-scale-bundle.json'))});\ntry: p.verify_bundle()\nexcept Exception as e: print(getattr(e, "reason", str(e)))`
  const missingBundle = runPython(['-c', missingBundleExpression])
  assert.equal(missingBundle.status, 0, missingBundle.stderr)
  assert.equal(missingBundle.stdout.trim(), 'time_scale_bundle_missing')

  const bundleValue = JSON.parse(await readFile('api/provider/astrology-time-scale-bundle-v1.json', 'utf8'))
  bundleValue.status = 'tampered'
  const bundleBytes = Buffer.from(`${JSON.stringify(bundleValue)}\n`)
  const tamperedBundlePath = join(directory, 'tampered-time-scale-bundle.json')
  await writeFile(tamperedBundlePath, bundleBytes)
  const tamperedBundleExpression = `import importlib.util; from pathlib import Path; s=importlib.util.spec_from_file_location("a", "api/astrology.py"); m=importlib.util.module_from_spec(s); s.loader.exec_module(m); p=m._load_time_scale_provider(); p.BUNDLE_PATH=Path(${JSON.stringify(tamperedBundlePath)});\ntry: p.verify_bundle()\nexcept Exception as e: print(getattr(e, "reason", str(e)))`
  const tamperedBundle = runPython(['-c', tamperedBundleExpression])
  assert.equal(tamperedBundle.status, 0, tamperedBundle.stderr)
  assert.equal(tamperedBundle.stdout.trim(), 'time_scale_bundle_hash_mismatch')
})

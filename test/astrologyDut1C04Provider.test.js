import assert from 'node:assert/strict'
import { mkdtemp, mkdir, readFile, rm, writeFile, cp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { test } from 'node:test'

const ROOT = resolve('.')
const PROVIDER = resolve('api/provider/astrology_dut1_c04_provider.py')
const CONTRACT = resolve('api/provider/dut1-c04-contract-v1.json')
const BUNDLE = resolve('api/provider/astrology-time-scale-bundle-v1.json')
const PYTHON = process.env.ASTROLOGY_PYTHON || 'python3'

function runProvider(args, options = {}) {
  return spawnSync(PYTHON, [PROVIDER, ...args], { encoding: 'utf8', ...options })
}

function runChecker(path = BUNDLE) {
  return spawnSync(process.execPath, ['scripts/check-astrology-time-scale-bundle-v1.mjs', path], { encoding: 'utf8' })
}

test('DUT1 C04 bundle checker verifies all immutable assets and preserves release gate', () => {
  const result = runChecker()
  assert.equal(result.status, 0, result.stderr)
  const report = JSON.parse(result.stdout)
  assert.equal(report.status, 'valid')
  assert.equal(report.c04.rows, 23598)
  assert.equal(report.c04.firstMjdUtc, 37665)
  assert.equal(report.c04.lastMjdUtc, 61262)
  assert.equal(report.publicReleaseAllowed, false)
  assert.equal(report.arbitraryDateProducerReadiness, 'blocked_until_bundle_and_redistribution_gate_close')
})

test('DUT1 C04 provider is byte-deterministic and carries interpolation, corrections, uncertainty, and provenance', () => {
  const first = runProvider(['--utc', '2000-01-01T12:34:56Z'])
  const second = runProvider(['--utc', '2000-01-01T12:34:56Z'])
  assert.equal(first.status, 0, first.stderr)
  assert.equal(second.status, 0, second.stderr)
  assert.equal(first.stdout, second.stdout)
  const result = JSON.parse(first.stdout)
  assert.equal(result.schemaVersion, 'astrology-dut1-c04-output-v1')
  assert.equal(result.status, 'ready_source_bounded_with_uncertainty')
  assert.equal(result.input.utcIso, '2000-01-01T12:34:56Z')
  assert.equal(result.interpolation.status, 'four_point_lagrange')
  assert.equal(result.interpolation.sourceNodes.length, 4)
  assert.equal(result.interpolation.weights.length, 4)
  assert.equal(result.interpolation.utcTaiSegment, '1999-01-01')
  assert.ok(Number.isFinite(result.value.seconds))
  assert.ok(Number.isFinite(result.value.oceanTideCorrectionSeconds))
  assert.ok(Number.isFinite(result.value.axialLibrationCorrectionSeconds))
  assert.equal(result.uncertainty.sourceFormalErrorSeconds.length, 4)
  assert.equal(result.uncertainty.boundarySafety, 'not_proven_by_C04_formal_error_alone')
  assert.equal(result.provenance.observedProvider.assetSha256, '24db7a8042c65fa9a94fcd4ac98b0872d775e94134061f8508289cea9d9f95b5')
  assert.equal(result.provenance.observedProvider.documentationAssets.length, 2)
  assert.equal(result.provenance.interpolation.sourceSha256, '9ff5f893ac06c8d4123ec45cecde4df99f18cb2f3b19518bcd7494b6aa35b4e6')
  assert.equal(result.provenance.interpolation.documentationAssets.length, 1)
  assert.equal(result.provenance.corrections.libration.terms, 11)
  assert.equal(result.provenance.corrections.ocean.terms, 71)
})

test('DUT1 C04 provider supports interior arbitrary epochs without extrapolation', () => {
  for (const utc of [
    '1962-02-15T06:00:00Z',
    '1988-05-12T03:14:15Z',
    '2020-06-30T23:59:59Z',
    '2026-08-08T18:00:00Z',
  ]) {
    const result = runProvider(['--utc', utc])
    assert.equal(result.status, 0, `${utc}: ${result.stderr}`)
    const output = JSON.parse(result.stdout)
    assert.equal(output.interpolation.status, 'four_point_lagrange', utc)
    assert.equal(output.interpolation.sourceNodes.length, 4, utc)
    assert.ok(Number.isFinite(output.value.seconds), utc)
  }
})

test('DUT1 C04 provider writes a fresh JSON file that can be re-consumed byte-for-byte', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'astrology-dut1-fresh-file-'))
  const firstPath = join(directory, 'first.json')
  const secondPath = join(directory, 'second.json')
  try {
    for (const outputPath of [firstPath, secondPath]) {
      const result = runProvider(['--utc', '2000-01-01T12:34:56Z', '--output', outputPath])
      assert.equal(result.status, 0, result.stderr)
      assert.equal(result.stdout, '')
    }
    const first = await readFile(firstPath)
    const second = await readFile(secondPath)
    assert.deepEqual(first, second)
    const consumed = JSON.parse(first)
    assert.equal(consumed.schemaVersion, 'astrology-dut1-c04-output-v1')
    assert.equal(consumed.provenance.contract.sha256, 'a2ef999f0fb18fe5f19ff7b87b7b9c6e97b940401b66ac945201ed4afac4d025')
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

test('DUT1 C04 provider accepts exact endpoints but rejects nonexact endpoint extrapolation and UTC-TAI boundary windows', () => {
  for (const utc of ['1962-01-01T00:00:00Z', '2026-08-10T00:00:00Z']) {
    const result = runProvider(['--utc', utc])
    assert.equal(result.status, 0, `${utc}: ${result.stderr}`)
    assert.equal(JSON.parse(result.stdout).interpolation.status, 'exact_source_sample')
  }
  const endpoint = runProvider(['--utc', '1962-01-01T12:00:00Z'])
  assert.notEqual(endpoint.status, 0)
  assert.match(endpoint.stderr, /endpoint_neighbour_window_unavailable/)
  const boundary = runProvider(['--utc', '1972-01-01T12:00:00Z'])
  assert.notEqual(boundary.status, 0)
  assert.match(boundary.stderr, /interpolation_window_crosses_UTC_TAI_segment_boundary/)
})

test('DUT1 C04 provider rejects missing, tampered, out-of-coverage, invalid, and fallback inputs', async () => {
  const missing = runProvider(['--utc', '2000-01-01T00:00:00Z', '--asset-root', '/private/tmp/astrology-dut1-no-such-root'])
  assert.notEqual(missing.status, 0)
  assert.match(missing.stderr, /asset_missing/)

  const directory = await mkdtemp(join(tmpdir(), 'astrology-dut1-c04-'))
  try {
    const assetDirectory = join(directory, 'api/provider/iers')
    await mkdir(assetDirectory, { recursive: true })
    for (const name of ['eopc04_20u24.dPsi_dEps.1962-now.txt', 'eopc04-20u24-README.txt', 'eopc04-updateC04.txt', 'UTC-TAI.history', 'INTERP.F', 'INTERP-README.txt', 'UTLIBR.F', 'FUNDARG.F']) {
      await cp(resolve('api/provider/iers', name), join(assetDirectory, name))
    }
    const c04Path = join(assetDirectory, 'eopc04_20u24.dPsi_dEps.1962-now.txt')
    const c04 = await readFile(c04Path)
    c04[0] ^= 1
    await writeFile(c04Path, c04)
    const tampered = runProvider(['--utc', '2000-01-01T00:00:00Z', '--asset-root', directory])
    assert.notEqual(tampered.status, 0)
    assert.match(tampered.stderr, /asset_sha_mismatch/)

    for (const name of ['INTERP.F', 'UTLIBR.F', 'FUNDARG.F']) {
      const correctionDirectory = await mkdtemp(join(tmpdir(), 'astrology-dut1-correction-'))
      try {
        const correctionAssets = join(correctionDirectory, 'api/provider/iers')
        await mkdir(correctionAssets, { recursive: true })
        for (const assetName of ['eopc04_20u24.dPsi_dEps.1962-now.txt', 'eopc04-20u24-README.txt', 'eopc04-updateC04.txt', 'UTC-TAI.history', 'INTERP.F', 'INTERP-README.txt', 'UTLIBR.F', 'FUNDARG.F']) {
          await cp(resolve('api/provider/iers', assetName), join(correctionAssets, assetName))
        }
        const correctionPath = join(correctionAssets, name)
        const correction = await readFile(correctionPath)
        correction[0] ^= 1
        await writeFile(correctionPath, correction)
        const correctionResult = runProvider(['--utc', '2000-01-01T00:00:00Z', '--asset-root', correctionDirectory])
        assert.notEqual(correctionResult.status, 0, name)
        assert.match(correctionResult.stderr, /asset_sha_mismatch/, name)

        await cp(resolve('api/provider/iers', name), correctionPath)
        await rm(correctionPath)
        const missingCorrection = runProvider(['--utc', '2000-01-01T00:00:00Z', '--asset-root', correctionDirectory])
        assert.notEqual(missingCorrection.status, 0, name)
        assert.match(missingCorrection.stderr, /asset_missing/, name)
      } finally {
        await rm(correctionDirectory, { recursive: true, force: true })
      }
    }
  } finally {
    await rm(directory, { recursive: true, force: true })
  }

  for (const [utc, reason] of [
    ['1961-12-31T23:59:59Z', 'outside_C04_snapshot_coverage'],
    ['2026-08-10T00:00:01Z', 'outside_C04_snapshot_coverage'],
    ['2024-01-01T00:00:60Z', 'leap_second_second_60_unsupported'],
    ['2024-02-30T00:00:00Z', 'invalid_utc'],
  ]) {
    const result = runProvider(['--utc', utc])
    assert.notEqual(result.status, 0, utc)
    assert.match(result.stderr, new RegExp(reason), utc)
  }
})

test('DUT1 C04 provider rejects a negative formal uncertainty before producing a value', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'astrology-dut1-uncertainty-'))
  const path = join(directory, 'invalid-c04.txt')
  const row = ['1962', '1', '1', '0', '37665.00', '0', '0', '0.1', '0', '0', '0', '0', '0', '0', '0', '-0.001', '0', '0', '0', '0', '0'].join(' ')
  const source = ['C04 20 C04', 'daily 0h UTC', 'columns UT1-UTC', 'error UT1-UTC Er', 'header', 'header', 'header', 'header', row].join('\n') + '\n'
  const driver = String.raw`
import importlib.util, sys
spec = importlib.util.spec_from_file_location('dut1_provider', sys.argv[1])
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
try:
  module.parse_c04_rows(module.Path(sys.argv[2]), {'firstMjdUtc': 37665.0, 'lastMjdUtc': 37665.0, 'rowCount': 1})
except module.ProviderError as exc:
  print(exc.reason)
  raise SystemExit(0)
raise SystemExit(1)
`
  try {
    await writeFile(path, source, 'ascii')
    const result = spawnSync(PYTHON, ['-c', driver, PROVIDER, path], { encoding: 'utf8', env: { ...process.env, PYTHONDONTWRITEBYTECODE: '1' } })
    assert.equal(result.status, 0, result.stderr)
    assert.equal(result.stdout.trim(), 'formal_uncertainty_missing_or_nonfinite_or_negative')
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

test('IERS UTLIBR source vectors are reproduced by the derived correction path without substituting a local fixture', () => {
  const driver = String.raw`
import importlib.util, json, sys
spec = importlib.util.spec_from_file_location('dut1_provider', sys.argv[1])
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
contract, contract_sha, rows, segments, ocean_terms, libration_terms = module.verify_and_load(module.DEFAULT_CONTRACT_PATH, module.REPOSITORY_ROOT)
print(json.dumps({
  'a': module.libration_ut1_seconds(44239.1, libration_terms) * 1e6,
  'b': module.libration_ut1_seconds(55227.4, libration_terms) * 1e6,
  'oceanTerms': len(ocean_terms),
  'librationTerms': len(libration_terms),
  'contractSha': contract_sha,
}))
`
  const result = spawnSync(PYTHON, ['-c', driver, PROVIDER], { encoding: 'utf8' })
  assert.equal(result.status, 0, result.stderr)
  const values = JSON.parse(result.stdout)
  assert.ok(Math.abs(values.a - 2.441143834386761746) <= 2e-8)
  assert.ok(Math.abs(values.b - (-2.655705844335680244)) <= 2e-8)
  assert.equal(values.oceanTerms, 71)
  assert.equal(values.librationTerms, 11)
  assert.equal(values.contractSha, 'a2ef999f0fb18fe5f19ff7b87b7b9c6e97b940401b66ac945201ed4afac4d025')
})

test('DUT1 C04 bundle checker rejects a tampered bundle instead of changing expected values', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'astrology-time-scale-bundle-'))
  const path = join(directory, 'bundle.json')
  try {
    const bundle = JSON.parse(await readFile(BUNDLE, 'utf8'))
    bundle.redistribution.publicReleaseAllowed = true
    await writeFile(path, JSON.stringify(bundle, null, 2) + '\n')
    const result = runChecker(path)
    assert.notEqual(result.status, 0)
    assert.match(result.stderr, /bundleCanonicalSha256 mismatch/)
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

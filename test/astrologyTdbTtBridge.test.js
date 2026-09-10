import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import test from 'node:test'

const ROOT = resolve('.')
const PYTHON = process.env.ASTROLOGY_PYTHON || 'python3'
const BRIDGE_PATH = resolve('api/provider/astrology_time_scale_bridge.py')
const SOURCE_PATH = resolve('api/provider/iers/HF2002_IERS.F')
const CONTRACT_PATH = resolve('api/provider/tdb-tt-bridge-contract-v1.json')
const VECTOR_PATH = resolve('api/provider/hf2002-iers-test-vectors-v1.json')

const PYTHON_DRIVER = [
  'import importlib.util',
  'import json',
  'import math',
  'from pathlib import Path',
  'import sys',
  'bridge_path = Path(sys.argv[1])',
  'spec = importlib.util.spec_from_file_location("astrology_time_scale_bridge_test", bridge_path)',
  'if spec is None or spec.loader is None: raise RuntimeError("bridge module cannot be loaded")',
  'module = importlib.util.module_from_spec(spec)',
  'spec.loader.exec_module(module)',
  'vectors = json.loads(Path(sys.argv[2]).read_text(encoding="utf-8"))["vectors"]',
  'fixture = json.loads(Path(sys.argv[3]).read_text(encoding="utf-8"))',
  'results = []',
  'for vector in vectors:',
  '    results.append({"label": vector["label"], "hf": module.hf2002_tcb_minus_tcg(vector["jdTt"], 0.0), "tdbMinusTt": module.tdb_minus_tt_seconds(vector["jdTt"], 0.0)})',
  'et_values = [float(item["et"]) for item in fixture["fixtures"]]',
  'et_values.extend([(module.MODEL_START_JD - module.J2000) * module.DAY_SECONDS, (module.MODEL_END_JD - module.J2000) * module.DAY_SECONDS])',
  'bounds = [module.two_part_representation_error_bound_seconds(value) for value in et_values]',
  'start_et = (module.MODEL_START_JD - module.J2000) * module.DAY_SECONDS',
  'end_et = (module.MODEL_END_JD - module.J2000) * module.DAY_SECONDS',
  'secondary_upper = math.nextafter(1.0, 0.0)',
  'analytic_bound = 0.5 * math.ulp(max(abs(start_et), abs(end_et))) + 0.5 * math.ulp(secondary_upper) * module.DAY_SECONDS',
  'print(json.dumps({"results": results, "maxBound": max(bounds), "analyticBound": analytic_bound, "pairs": [module.et_seconds_to_two_part_jd(value) for value in et_values]}, sort_keys=True, allow_nan=False))',
].join('\n')

function python(args) {
  return spawnSync(PYTHON, args, {
    cwd: ROOT,
    encoding: 'utf8',
    env: { ...process.env, PYTHONDONTWRITEBYTECODE: '1' },
    maxBuffer: 8 * 1024 * 1024,
  })
}

function runDriver() {
  const result = python(['-c', PYTHON_DRIVER, BRIDGE_PATH, VECTOR_PATH, resolve('api/provider/provider-equivalence-v1.json')])
  assert.equal(result.status, 0, result.stderr)
  return { text: result.stdout, value: JSON.parse(result.stdout) }
}

function runFailure(sourcePath, expression) {
  const script = [
    'import importlib.util, sys',
    'from pathlib import Path',
    'path = Path(sys.argv[1])',
    'spec = importlib.util.spec_from_file_location("bridge_failure", ' + JSON.stringify(BRIDGE_PATH) + ')',
    'module = importlib.util.module_from_spec(spec)',
    'spec.loader.exec_module(module)',
    'module.SOURCE_PATH = path',
    expression,
  ].join('; ')
  return python(['-c', script, sourcePath])
}

test('TDB-TT contract pins source, equations, constants, units, epoch, and binary64 ABI', async () => {
  const contract = JSON.parse(await readFile(CONTRACT_PATH, 'utf8'))
  const source = await readFile(SOURCE_PATH)
  assert.equal(createHash('sha256').update(source).digest('hex'), contract.model.hf2002.sourceSha256)
  assert.equal(source.length, contract.model.hf2002.sourceBytes)
  assert.equal(contract.model.bridgeId, 'HF2002_IERS_TN36_10_5_IAU2006_B3_TDB_MINUS_TT')
  assert.equal(contract.model.equations.tcgMinusTt, 'IERS TN36 Eq. 10.1')
  assert.equal(contract.model.equations.tcbMinusTcg, 'IERS TN36 Eq. 10.5 at geocenter')
  assert.equal(contract.model.equations.tdbFromTcb, 'IAU 2006 Resolution B3 / IERS TN36 Eq. 10.3')
  assert.deepEqual(contract.constants, {
    LG: 6.969290134e-10,
    LC: 1.48082686741e-8,
    LB: 1.550519768e-8,
    TDB0Seconds: -6.55e-5,
    T0Jd: 2443144.5003725,
    c4Terms: 1.15e-16,
    daySeconds: 86400,
    j2000Jd: 2451545,
  })
  assert.equal(contract.input.representation, 'two_part_julian_date')
  assert.equal(contract.input.onePartFallback, false)
  assert.equal(contract.output.quantity, 'TDB_minus_TT')
  assert.equal(contract.output.unit, 'SI_seconds')
  assert.equal(contract.numeric.format, 'IEEE-754 binary64 / CPython float')
  assert.equal(contract.numeric.ttInputCollapse, false)
  assert.equal(contract.accuracy.twoPartRepresentationBudgetSeconds, 1.770977e-6)
})

test('official HF2002 vectors and the derived TN36/B3 bridge reproduce deterministically', async () => {
  const vectors = JSON.parse(await readFile(VECTOR_PATH, 'utf8'))
  assert.equal(vectors.source.sha256, '41a1aec5fabd3f4bdd57c0ac77dc5ba86665f48abc9f18743bfb00f3f5ee1cbf')
  assert.equal(vectors.vectors.length, 7)
  const first = runDriver()
  const second = runDriver()
  assert.equal(first.text, second.text, 'fresh Python processes must be byte-stable')
  for (const [index, expected] of vectors.vectors.entries()) {
    const actual = first.value.results[index]
    assert.equal(actual.label, expected.label)
    assert.ok(Math.abs(actual.hf - expected.expectedTcbMinusTcgSeconds) <= 1e-12, expected.label + ' HF2002 vector')
    assert.ok(Math.abs(actual.tdbMinusTt - expected.derivedTdbMinusTtSeconds) <= 5e-9, expected.label + ' bridge vector')
  }
})

test('two-part ET representation stays below the fixed 1.770977 microsecond budget', () => {
  const result = runDriver().value
  assert.ok(result.maxBound <= 1.770977e-6, 'max two-part bound ' + result.maxBound)
  assert.ok(result.analyticBound <= 1.770977e-6, 'analytic interval bound ' + result.analyticBound)
  for (const pair of result.pairs) {
    assert.equal(pair[0], Math.floor(pair[0]))
    assert.ok(pair[1] >= 0 && pair[1] < 1)
  }
})

test('producer and preview use the mandatory two-part jplephem ABI with no one-part call', async () => {
  const producer = await readFile('api/provider/astrology-jplephem-producer.py', 'utf8')
  const preview = await readFile('api/astrology.py', 'utf8')
  assert.match(producer, /compute_and_differentiate\(tdb1, tdb2\)/)
  assert.match(producer, /et_seconds_to_two_part_jd\(item\["et"\]\)/)
  assert.doesNotMatch(producer, /compute_and_differentiate\(jd_tdb\)/)
  assert.doesNotMatch(preview, /relative_to_earth\([^\n]*float\(item\["jdTdb"\]\)/)
  assert.match(preview, /producer\.et_seconds_to_two_part_jd\(item\["et"\]\)/)
})

test('missing, tampered, non-normalized, nonfinite, and out-of-coverage bridge inputs fail closed', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'astrology-tdb-tt-'))
  const tamperedPath = join(directory, 'HF2002_IERS.tampered.F')
  const source = Buffer.from(await readFile(SOURCE_PATH))
  source[0] ^= 1
  await writeFile(tamperedPath, source)
  const missing = runFailure(join(directory, 'missing.F'), 'module.tdb_minus_tt_seconds(2451545.0, 0.0); raise SystemExit("unexpected success")')
  assert.notEqual(missing.status, 0)
  assert.match(missing.stderr, /hf2002_source_missing/)
  const tampered = runFailure(tamperedPath, 'module.tdb_minus_tt_seconds(2451545.0, 0.0); raise SystemExit("unexpected success")')
  assert.notEqual(tampered.status, 0)
  assert.match(tampered.stderr, /hf2002_source_sha_mismatch/)
  for (const expression of [
    'module.tdb_minus_tt_seconds(2451545.5, -0.5); raise SystemExit("unexpected success")',
    'module.tdb_minus_tt_seconds(float("nan"), 0.0); raise SystemExit("unexpected success")',
    'module.tdb_minus_tt_seconds(2305444.0, 0.0); raise SystemExit("unexpected success")',
    'module.tdb_minus_tt_seconds(2305445.0, -5e-324); raise SystemExit("unexpected success")',
    'module.tdb_minus_tt_seconds(2524595.0, 5e-324); raise SystemExit("unexpected success")',
    'module.tdb_minus_tt_seconds(2451545.0); raise SystemExit("unexpected success")',
  ]) {
    const result = runFailure(SOURCE_PATH, expression)
    assert.notEqual(result.status, 0)
    assert.doesNotMatch(result.stdout, /unexpected success/)
  }
})

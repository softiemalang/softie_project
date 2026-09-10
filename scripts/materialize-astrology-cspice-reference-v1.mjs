#!/usr/bin/env node

import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(new URL('..', import.meta.url).pathname)
const EXPECTED_KERNEL_URL = 'https://naif.jpl.nasa.gov/pub/naif/generic_kernels/spk/planets/a_old_versions/de405.bsp'
const EXPECTED_KERNEL_SHA256 = '30a7113793ee5b6bf1e5546c6dfc21d9682d9ffabfe9b17b4bab27ba2ac75c89'
const EXPECTED_KERNEL_BYTES = 10898432
const EXPECTED_FIXTURE_SHA256 = '8cb64320ebfe24bc2654b920da27af370cc78b4c0f7c663898933aea67a2355d'

const args = Object.fromEntries(process.argv.slice(2).map((value, index, all) => value.startsWith('--') ? [value.slice(2), all[index + 1]] : []).filter(Boolean))
const fixturePath = resolve(args.fixture || 'api/provider/provider-equivalence-v1.json')
const bspPath = resolve(args.bsp || '')
const runnerPath = resolve(args.runner || '')
const outputPath = resolve(args.output || '')

function fail(message) {
  throw new Error(message)
}

function sha256Bytes(value) {
  return createHash('sha256').update(value).digest('hex')
}

async function sha256File(path) {
  return sha256Bytes(await readFile(path))
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`
}

function bitsHex(value) {
  const buffer = new ArrayBuffer(8)
  const view = new DataView(buffer)
  view.setFloat64(0, value, false)
  return `0x${view.getBigUint64(0, false).toString(16).padStart(16, '0')}`
}

function runJson(command, commandArgs) {
  try {
    return JSON.parse(execFileSync(command, commandArgs, { encoding: 'utf8' }).trim())
  } catch (error) {
    const detail = `${error.stdout || ''}${error.stderr || ''}`.trim()
    throw new Error(`${command} ${commandArgs.join(' ')} failed${detail ? `: ${detail}` : ''}`)
  }
}

function expectedRows(fixture) {
  return fixture.fixtures.flatMap((item) => fixture.bodies.map((body) => ({
    sampleId: `${item.id}:${body.id}`,
    fixtureId: item.id,
    body: body.id,
    targetId: body.targetId,
    targetType: body.targetType,
    queryEt: item.et,
    queryEtHex: bitsHex(item.et),
    centerId: fixture.time.observerId,
    frameId: 1,
  })))
}

function parseReferenceRows(path, expected) {
  const rows = readFileSync(path, 'utf8').split('\n').filter(Boolean).map((line) => JSON.parse(line))
  if (rows.length !== expected.length) fail(`CSPICE reference row count mismatch: ${rows.length}`)
  const expectedById = new Map(expected.map((row) => [row.sampleId, row]))
  const seen = new Set()
  return rows.map((row) => {
    const wanted = expectedById.get(row.sampleId)
    if (!wanted || seen.has(row.sampleId)) fail(`CSPICE reference sample identity mismatch: ${row.sampleId}`)
    seen.add(row.sampleId)
    if (row.targetId !== wanted.targetId || row.centerId !== wanted.centerId || row.frameId !== wanted.frameId || row.queryEtHex !== wanted.queryEtHex || row.selectionEvidenceStatus !== 'verified') fail(`CSPICE reference metadata mismatch: ${row.sampleId}`)
    if (!Array.isArray(row.stateKmKmPerSec) || row.stateKmKmPerSec.length !== 6 || row.stateKmKmPerSec.some((value) => typeof value !== 'number' || !Number.isFinite(value))) fail(`CSPICE reference state invalid: ${row.sampleId}`)
    return {
      sampleId: row.sampleId,
      fixtureId: wanted.fixtureId,
      body: wanted.body,
      targetId: row.targetId,
      targetType: wanted.targetType,
      observerId: row.centerId,
      frame: 'J2000/ICRF',
      queryEtHex: row.queryEtHex,
      positionKm: row.stateKmKmPerSec.slice(0, 3),
      velocityKmPerSecond: row.stateKmKmPerSec.slice(3, 6),
      selectionEvidenceStatus: row.selectionEvidenceStatus,
    }
  })
}

async function main() {
  if (!args.fixture || !args.bsp || !args.runner || !args.output) fail('usage: --fixture FILE --bsp FILE --runner FILE --output FILE')
  const fixtureBytes = await readFile(fixturePath)
  const fixture = JSON.parse(fixtureBytes)
  if (fixture.schemaVersion !== 'astrology-provider-equivalence-fixture-v1' || fixture.fixtureId !== 'jplephem-de405-equivalence-suite-v1') fail('unsupported equivalence fixture')
  if (sha256Bytes(fixtureBytes) !== EXPECTED_FIXTURE_SHA256) fail('equivalence fixture SHA mismatch')
  if (!bspPath || !runnerPath) fail('reference BSP and runner are required')
  const bspBytes = await readFile(bspPath)
  if (bspBytes.length !== EXPECTED_KERNEL_BYTES || sha256Bytes(bspBytes) !== EXPECTED_KERNEL_SHA256) fail('reference DE405 BSP identity mismatch')
  const version = runJson(runnerPath, ['--version'])
  if (version.runnerVersion !== 'de405-canonical-v2-runner' || version.cspiceToolkitVersion !== 'N0067' || version.testOnly !== false) fail('reference runner ABI/version mismatch')
  const coverage = runJson(runnerPath, ['--coverage', '--spk', bspPath])
  if (coverage.coverageStartEt !== fixture.kernel.coverage.startEt || coverage.coverageEndEt !== fixture.kernel.coverage.endEt || coverage.objectCount !== 15 || coverage.coverageTool !== 'spkobj_c+spkcov_c' || coverage.coverageToolVersion !== 'N0067') fail('reference DE405 coverage mismatch')

  const expected = expectedRows(fixture)
  const work = mkdtempSync(join('/tmp', 'astrology-cspice-reference-'))
  try {
    const inputPath = join(work, 'input.jsonl')
    const rawOutputPath = join(work, 'output.jsonl')
    writeFileSync(inputPath, `${expected.map((row) => JSON.stringify({ sampleId: row.sampleId, queryEt: row.queryEt, queryEtHex: row.queryEtHex, targetId: row.targetId, centerId: row.centerId, frameId: row.frameId })).join('\n')}\n`)
    execFileSync(runnerPath, ['--evaluate-spk-type2-batch', '--spk', bspPath, '--input-jsonl', inputPath, '--output-jsonl', rawOutputPath], { stdio: 'ignore' })
    const rows = parseReferenceRows(rawOutputPath, expected)
    const result = {
      schemaVersion: 'astrology-cspice-reference-output-v1',
      availability: 'available',
      provider: {
        id: 'cspice-n0067-canonical-v2',
        toolkitVersion: 'N0067',
        runnerVersion: version.runnerVersion,
        role: 'offline_reference_oracle_only',
      },
      source: {
        sourceUrl: EXPECTED_KERNEL_URL,
        sha256: EXPECTED_KERNEL_SHA256,
        bytes: EXPECTED_KERNEL_BYTES,
        identity: fixture.kernel.identity,
        coverage,
      },
      semantics: {
        timeScale: 'TDB',
        observerId: fixture.time.observerId,
        observer: 'EARTH',
        frame: 'J2000/ICRF',
        aberrationCorrection: fixture.time.aberrationCorrection,
        positionUnit: 'km',
        velocityUnit: 'km/s',
      },
      fixture: {
        fixtureId: fixture.fixtureId,
        sha256: EXPECTED_FIXTURE_SHA256,
        dateCount: fixture.fixtures.length,
        bodyCount: fixture.bodies.length,
        rowCount: rows.length,
      },
      rows,
    }
    await writeFile(outputPath, stableJson(result), 'utf8')
    console.log(JSON.stringify({ status: 'pass', output: outputPath, rowCount: rows.length }, null, 2))
  } finally {
    rmSync(work, { recursive: true, force: true })
  }
}

try {
  await main()
} catch (error) {
  console.error(`CSPICE reference materialization failed: ${error.message}`)
  process.exitCode = 1
}

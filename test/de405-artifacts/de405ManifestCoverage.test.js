import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { resolveArtifactRoot } from '../../scripts/lib/de405-artifact-contract.mjs'

const artifactRoot = resolveArtifactRoot()
const manifestPath = `${artifactRoot}/de405-jpl-cspice-residual-sweep.manifest.jsonl`
const coverageStartEt = -1577879958.8160586
const coverageEndEt = 1577880064.1839132

const readJsonLines = async path => (await readFile(path, 'utf8')).trim().split('\n').filter(Boolean).map(JSON.parse)

test('residual sweep manifest does not emit record probes outside SPK directory coverage', async () => {
  const rows = await readJsonLines(manifestPath)
  const recordProbes = rows.filter(row => row.recordIndex !== null && row.epochKind.startsWith('record_'))
  assert.ok(recordProbes.length > 0)
  assert.ok(recordProbes.every(row => row.queryEt >= coverageStartEt && row.queryEt <= coverageEndEt))
  assert.equal(rows.some(row => row.sampleId === 'segment-0-record-0-record_quarter'), false)
  assert.equal(rows.some(row => row.sampleId === 'segment-3-record-0-record_midpoint'), false)
})

test('manifest keeps explicit coverage boundary samples under the existing boundary contract', async () => {
  const rows = await readJsonLines(manifestPath)
  const starts = rows.filter(row => row.epochKind === 'segment_coverage_start')
  const ends = rows.filter(row => row.epochKind === 'segment_coverage_end')
  assert.equal(starts.length, 10)
  assert.equal(ends.length, 10)
  assert.ok(starts.every(row => row.queryEt === coverageStartEt))
  assert.ok(ends.every(row => row.queryEt === coverageEndEt))
})

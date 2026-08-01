import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const parseJsonl = text => text.trim().split('\n').filter(Boolean).map(JSON.parse)
const summary = JSON.parse(await readFile(resolve(root, 'artifacts/de405-cspice-route-summary.json'), 'utf8'))
const neutrality = JSON.parse(await readFile(resolve(root, 'artifacts/de405-cspice-route-neutrality.json'), 'utf8'))
const routeMap = JSON.parse(await readFile(resolve(root, 'artifacts/de405-cspice-route-map.json'), 'utf8'))
const cspiceEvents = parseJsonl(await readFile(resolve(root, 'artifacts/de405-cspice-route-events.jsonl'), 'utf8'))
const projectEvents = parseJsonl(await readFile(resolve(root, 'artifacts/de405-project-route-events.jsonl'), 'utf8'))
const divergences = parseJsonl(await readFile(resolve(root, 'artifacts/de405-cspice-route-first-divergence.jsonl'), 'utf8'))
const inventory = parseJsonl(await readFile(resolve(root, 'artifacts/de405-cspice-route-inventory.jsonl'), 'utf8'))

test('DE405 CSPICE route evidence reconciles exactly to the authoritative 1,701 cases', () => {
  assert.equal(summary.inputCount, 1701)
  assert.equal(summary.cspiceEvaluations, 1701)
  assert.equal(summary.projectRouteEvaluations, 1701)
  assert.equal(summary.missingCases, 0)
  assert.equal(summary.executionErrors, 0)
  assert.equal(neutrality.finalStateBitwiseParity, 1701)
  assert.equal(neutrality.missingUninstrumentedCases, 0)
  assert.equal(divergences.length, 1701)
  assert.equal(Object.values(summary.primaryFirstDivergence).reduce((sum, count) => sum + count, 0), 1701)
  assert.equal(summary.exactFinalStateMatches, 1222)
  assert.equal(summary.observableRouteIdentityExact, 1583)
})

test('DE405 route event streams have stable request boundaries and required route stages', () => {
  const cspiceByCase = new Map()
  let current = null
  for (const event of cspiceEvents) {
    if (event.eventType === 'request_start') { current = event.caseId; cspiceByCase.set(current, [event]) }
    else cspiceByCase.get(current).push(event)
  }
  const projectByCase = new Map()
  for (const event of projectEvents) { if (!projectByCase.has(event.caseId)) projectByCase.set(event.caseId, []); projectByCase.get(event.caseId).push(event) }
  assert.equal(cspiceByCase.size, 1701)
  assert.equal(projectByCase.size, 1701)
  for (const [caseId, events] of cspiceByCase) {
    assert.equal(events[0].eventType, 'request_start')
    assert.equal(events.filter(event => event.eventType === 'segment_selected').length, 3)
    assert.equal(events.filter(event => event.eventType === 'record_selected').length, 3)
    assert.equal(events.filter(event => event.eventType === 'evaluator_output').length, 3)
    assert.equal(events.filter(event => event.eventType === 'accumulator_subtract').length, 1)
    assert.ok(projectByCase.get(caseId).some(event => event.eventType === 'request_final'))
  }
})

test('DE405 route inventory is deterministic and every case has one primary classification', () => {
  assert.equal(inventory.length, summary.uniqueRouteCount)
  assert.equal(inventory.reduce((sum, route) => sum + route.sourceCaseCount, 0), 1701)
  assert.equal(new Set(divergences.map(row => row.caseId)).size, 1701)
  for (const row of divergences) assert.equal(typeof row.primaryFirstDivergence, 'string')
})

test('DE405 accumulator and orientation events carry bitwise operands and outputs', () => {
  let previous = 0
  for (const event of cspiceEvents) {
    assert.equal(event.eventSequence, previous + 1)
    previous = event.eventSequence
    if (event.eventType === 'accumulator_add') {
      assert.equal(event.accumulatorBeforeBits.length, 6)
      assert.equal(event.leftOperandBits.length, 6)
      assert.equal(event.rightOperandBits.length, 6)
      assert.equal(event.accumulatorAfterBits.length, 6)
    }
    if (event.eventType === 'accumulator_subtract') {
      assert.equal(event.leftOperandBits.length, 6)
      assert.equal(event.rightOperandBits.length, 6)
      assert.equal(event.accumulatorAfterBits.length, 6)
      assert.equal(Object.hasOwn(event, 'accumulatorBeforeBits'), false)
    }
    if (event.eventType.startsWith('orientation_')) assert.equal(event.orientationEvidence, 'observed_operation')
  }
})

test('diagnostic route instrumentation is isolated from default production runner', async () => {
  const packageJson = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'))
  assert.ok(packageJson.scripts['build:de405:cspice-route-diagnostic'])
  const productionRunner = await readFile(resolve(root, 'tools/de405-cspice-runner/src/de405_canonical_v2.c'), 'utf8')
  assert.equal(productionRunner.includes('de405_diag_'), false)
  assert.equal(productionRunner.includes('route-diagnostic'), false)
  assert.equal(routeMap.functions.length, 7)
  assert.ok(routeMap.functions.every(entry => entry.sourceSha256))
})

import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const rawPath = 'artifacts/de405-type2-evaluator-first-divergence-evidence.jsonl'
const rows = (await readFile(rawPath, 'utf8')).trim().split('\n').filter(Boolean).map(line => JSON.parse(line))

test('Type-2 first-divergence evidence covers the exact 154-sample cohort', () => {
  assert.equal(rows.length, 154)
  assert.equal(new Set(rows.map(row => row.sampleId)).size, 154)
  assert.ok(rows.every((row, index) => index === 0 || rows[index - 1].sampleId.localeCompare(row.sampleId) <= 0))
  assert.ok(rows.every(row => row.recordType === 'de405_type2_evaluator_first_divergence_evidence'))
  assert.ok(rows.every(row => row.recordPayloadIdentity.exact && row.queryEtIdentity.exact))
})

test('instrumented official and project trace final parity gates hold', () => {
  assert.equal(rows.filter(row => row.instrumentedOfficialVsLinkedOfficial.allComponentsBitwiseEqual).length, 154)
  assert.equal(rows.filter(row => row.projectTraceVsExistingProject.allComponentsBitwiseEqual).length, 154)
  assert.ok(rows.every(row => row.officialTrace.components.length === 3 && row.projectTrace.components.length === 3))
  assert.ok(rows.every(row => row.officialTrace.components.every(component => component.operations.length > 0)))
  assert.ok(rows.every(row => row.projectTrace.components.every(component => component.operations.length > 0)))
})

test('82/72 final ULP groups and contract state remain unchanged', () => {
  const within = rows.filter(row => row.existingProjectVsOfficial.componentUlpDistances.every(value => value <= 1))
  assert.equal(within.length, 82)
  assert.equal(rows.length - within.length, 72)
  assert.ok(rows.every(row => row.contractState.selectionUnresolved === 1701))
  assert.ok(rows.every(row => row.contractState.toleranceChanged === false && row.contractState.canonicalSelectionChanged === false && row.contractState.activeTransition === false && row.contractState.scientificApproval === false && row.contractState.productionIntegration === false))
})

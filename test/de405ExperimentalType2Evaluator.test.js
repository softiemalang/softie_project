import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const root = resolve(new URL('..', import.meta.url).pathname)
const source = await readFile(resolve(root, 'tools/de405-type2-experimental-evaluator/src/de405_type2_experimental_evaluator.c'), 'utf8')

test('experimental evaluator preserves official CHBINT derivative operation order', () => {
  assert.match(source, /dw0 = w1 \* 2\.0 \+ dw1 \* s2 - dw2/)
  assert.doesNotMatch(source, /dw0 = w1 \* 2\.0 \+ \(dw1 \* s2 - dw2\)/)
})

test('experimental evaluator is isolated from production routing', () => {
  assert.doesNotMatch(source, /spkez|spke02|canonical|tolerance|selector/i)
})

test('154-case parity and 1701-case shadow artifacts reconcile exactly', async () => {
  const parity = JSON.parse(await readFile(resolve(root, 'artifacts/de405-type2-experimental-evaluator-parity.jsonl.summary.json'), 'utf8'))
  const unique = JSON.parse(await readFile(resolve(root, 'artifacts/de405-type2-experimental-unique-instance-parity.jsonl.summary.json'), 'utf8'))
  const shadow = JSON.parse(await readFile(resolve(root, 'artifacts/de405-type2-experimental-shadow-impact.jsonl.summary.json'), 'utf8'))
  assert.deepEqual({ source: parity.sourceObservations, records: parity.uniqueRecordInstances, inputs: parity.distinctEvaluatorInputs, exact: parity.exactParityCount, mismatches: parity.mismatchCount, position: parity.positionPolynomialCount, velocity: parity.velocityDerivativeCount }, { source: 154, records: 139, inputs: 143, exact: 154, mismatches: 0, position: 93, velocity: 61 })
  assert.deepEqual({ source: unique.sourceObservations, records: unique.uniqueRecordInstances, inputs: unique.distinctEvaluatorInputs, duplicates: unique.duplicateCollapseCount, exact: unique.exactParityCount, mismatches: unique.mismatchCount, missing: unique.missingReferenceCount }, { source: 5221, records: 3968, inputs: 4779, duplicates: 442, exact: 4779, mismatches: 0, missing: 0 })
  assert.equal(shadow.inputCount, 1701)
  assert.equal(shadow.evaluatedCount + shadow.missingCount + shadow.executionErrorCount, 1701)
  assert.equal(shadow.outcomeCounts.selection_ambiguous_unaffected_non_evaluator_root_cause + shadow.outcomeCounts.selection_ambiguous_shadow_type2_chain_reproduced_official, 1701)
  assert.equal(shadow.shadowStillAmbiguousCount, 1701)
  assert.equal(shadow.unexpectedChangeCount, 0)
})

test('shadow runner is DAF-only and cannot route production evaluation', async () => {
  const shadowSource = await readFile(resolve(root, 'tools/de405-type2-experimental-shadow/src/de405_type2_experimental_shadow.c'), 'utf8')
  assert.match(shadowSource, /dafgda_c/)
  assert.doesNotMatch(shadowSource, /spkez|spke02|spkgeo|spkpvn/)
})

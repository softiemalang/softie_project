import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { deriveAstrologyRuleChart } from '../src/astrology/astrologyRuleCore.js'

const evidence = JSON.parse(readFileSync('test/fixtures/astrology/golden/astrology-ephemeris-golden-v1.json', 'utf8'))
const hash = (value) => createHash('sha256').update(JSON.stringify(value) + '\n').digest('hex')

test('actual-kernel golden evidence is complete, hashed, and Rule Core-integrated', () => {
  assert.equal(evidence.schemaVersion, 'astrology-ephemeris-golden-evidence-v1')
  assert.equal(evidence.availableForInterpretation, false)
  assert.equal(evidence.integrationStatus, 'not_connected')
  assert.equal(evidence.rawChart.value.bodies.length, 10)
  assert.equal(hash(evidence.rawChart.value), evidence.rawChart.sha256)
  assert.equal(hash(evidence.ruleCore.value), evidence.ruleCore.sha256)
  assert.equal(evidence.rawChart.value.angles.ascendant.longitudeDegrees >= 0, true)
  assert.equal(evidence.rawChart.value.angles.midheaven.longitudeDegrees >= 0, true)
  assert.deepEqual(deriveAstrologyRuleChart(evidence.rawChart.value), evidence.ruleCore.value)
})

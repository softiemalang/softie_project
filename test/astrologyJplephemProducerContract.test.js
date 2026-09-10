import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const fixturePath = 'test/fixtures/astrology/provider-equivalence-v1.json'
const fixtureBytes = readFileSync(fixturePath)
const fixture = JSON.parse(fixtureBytes)
const workflow = readFileSync('.github/workflows/astrology-jplephem-equivalence-v1.yml', 'utf8')
const producer = readFileSync('scripts/astrology-jplephem-producer.py', 'utf8')

test('jplephem candidate fixture pins source, runtime, mappings, and boundary suite', () => {
  assert.equal(createHash('sha256').update(fixtureBytes).digest('hex'), '8cb64320ebfe24bc2654b920da27af370cc78b4c0f7c663898933aea67a2355d')
  assert.equal(fixture.schemaVersion, 'astrology-provider-equivalence-fixture-v1')
  assert.equal(fixture.fixtures.length, 19)
  assert.equal(fixture.locations.length, 4)
  assert.equal(fixture.bodies.length, 10)
  assert.equal(fixture.kernel.sha256, '30a7113793ee5b6bf1e5546c6dfc21d9682d9ffabfe9b17b4bab27ba2ac75c89')
  assert.equal(fixture.fixtures.filter((item) => item.id.includes('retrograde')).length, 8)
  assert.ok(fixture.fixtures.some((item) => item.id === 'coverage_start_margin'))
  assert.ok(fixture.fixtures.some((item) => item.id === 'date_2049'))
})

test('candidate producer is offline and workflow fixes fresh install/process/platform checks', () => {
  assert.match(producer, /from jplephem\.spk import SPK/)
  assert.match(producer, /EXPECTED_JPLEPHEM_VERSION = "2\.24"/)
  assert.match(producer, /EXPECTED_NUMPY_VERSION = "2\.5\.3"/)
  assert.doesNotMatch(producer, /requests|urllib|httpx|fetch\(/i)
  assert.match(workflow, /actions\/setup-python@42375524e23c412d93fb67b49958b491fce71c38/)
  assert.match(workflow, /python-version: 3\.14\.7/)
  assert.match(workflow, /ubuntu-22\.04, ubuntu-24\.04/)
  assert.match(workflow, /candidate-1\.json.*candidate-2\.json/s)
  assert.match(workflow, /actions\/download-artifact@d3f86a106a0bac45b974a628896c90dbdf5c8093[\s\S]*name: astrology-cspice-reference-v1[\s\S]*path: \$\{\{ runner\.temp \}\}\/astrology-cspice-reference-v1/)
  assert.doesNotMatch(workflow, /cache:\s*pip/)
  assert.match(workflow, /wrong-provider|missing-bsp|tampered\.json|missing-row\.json/)
})

test('candidate path does not change the frozen production activation boundary', () => {
  const docs = readFileSync('docs/astrology/jplephem-provider-candidate-v1.md', 'utf8')
  assert.match(docs, /evaluation path only/)
  assert.match(docs, /does not select a runtime\s+provider/)
  assert.match(docs, /candidate_only_not_production/)
  assert.match(docs, /offline\s+comparison oracle only/)
})

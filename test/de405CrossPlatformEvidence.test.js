import test from 'node:test'
import assert from 'node:assert/strict'
import { createReadStream } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { createInterface } from 'node:readline'

const dir = 'artifacts/de405-cross-platform-evidence'
const readJson = async name => JSON.parse(await readFile(`${dir}/${name}`, 'utf8'))

test('DE405 cross-platform bundle preserves full corpus and non-exact conservation', async () => {
  const manifest = await readJson('manifest.json')
  const breakdown = await readJson('breakdown.json')
  const sentinels = await readJson('sentinels.json')
  const artifactHashes = await readJson('artifact-hashes.json')
  assert.deepEqual({ total: manifest.corpus.sampleCount, nonExact: manifest.corpus.nonExactCount }, { total: 150671, nonExact: 17279 })
  assert.deepEqual({ total: breakdown.conservation.total, exactPlusNonExact: breakdown.conservation.exactPlusNonExact }, { total: 150671, exactPlusNonExact: 150671 })
  assert.equal(breakdown.counts.candidateExact, 150671)
  assert.equal(breakdown.counts.candidateRegressed, 0)
  assert.equal(breakdown.unresolved.count, 17279)
  assert.ok(sentinels.count >= 1)
  assert.deepEqual(Object.keys(artifactHashes.files).sort(), ['breakdown.json', 'check.mjs', 'environment.json', 'manifest.json', 'non-exact-cases.jsonl', 'sentinels.json'])
  assert.equal((await readFile(`${dir}/check.mjs`, 'utf8')), "import '../../scripts/check-de405-cross-platform-evidence.mjs'\n")
})

test('DE405 cross-platform non-exact artifact is exactly-once', async () => {
  const ids = new Set(); let rows = 0
  const input = createInterface({ input: createReadStream(`${dir}/non-exact-cases.jsonl`), crlfDelay: Infinity })
  for await (const line of input) { if (!line) continue; const row = JSON.parse(line); rows++; assert.equal(row.classification.causeStatus, 'unresolved'); assert.equal(ids.has(row.sampleId), false); ids.add(row.sampleId) }
  assert.equal(rows, 17279)
})

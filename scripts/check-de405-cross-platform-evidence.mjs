import { createHash } from 'node:crypto'
import { createReadStream } from 'node:fs'
import { readFile, stat } from 'node:fs/promises'
import { createInterface } from 'node:readline'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..'); const dir = resolve(root, process.env.DE405_EVIDENCE_OUTPUT_DIR || 'artifacts/de405-cross-platform-evidence')
const json = async name => JSON.parse(await readFile(resolve(dir, name), 'utf8'))
const hash = async path => { const h = createHash('sha256'); for await (const chunk of createReadStream(path)) h.update(chunk); return h.digest('hex') }
const manifest = await json('manifest.json'); const breakdown = await json('breakdown.json'); const sentinels = await json('sentinels.json')
const artifactHashes = await json('artifact-hashes.json')
let rows = 0; const ids = new Set(); const input = createInterface({ input: createReadStream(resolve(dir, 'non-exact-cases.jsonl')), crlfDelay: Infinity })
for await (const line of input) { if (!line) continue; const row = JSON.parse(line); rows++; if (ids.has(row.sampleId)) throw new Error(`duplicate sampleId: ${row.sampleId}`); ids.add(row.sampleId); if (row.classification?.causeStatus !== 'unresolved') throw new Error(`non-unresolved cause: ${row.sampleId}`) }
const expected = manifest.corpus.sampleCount; const checks = { corpus: expected === 150671 && manifest.corpus.nonExactCount === 17279, conservation: breakdown.conservation.total === expected && breakdown.conservation.exactPlusNonExact === expected, exactlyOnce: rows === 17279 && breakdown.conservation.nonExactExactlyOnce, candidate: breakdown.counts.candidateExact === expected && breakdown.counts.candidateRegressed === 0, sentinels: sentinels.count > 0 }
for (const [name, expectedIdentity] of Object.entries(artifactHashes.files)) { const path = resolve(dir, name); if (expectedIdentity.sha256 !== await hash(path) || expectedIdentity.sizeBytes !== (await stat(path)).size) throw new Error(`artifact hash mismatch: ${name}`) }
checks.artifactHashes = true
if (Object.values(checks).some(value => !value)) throw new Error(JSON.stringify(checks))
console.log(JSON.stringify({ status: 'passed', checks, nonExactRows: rows, nonExactArtifactSha256: await hash(resolve(dir, 'non-exact-cases.jsonl')) }, null, 2))

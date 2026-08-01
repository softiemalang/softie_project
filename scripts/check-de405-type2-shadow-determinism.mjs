import { createHash } from 'node:crypto'
import { createReadStream } from 'node:fs'
import { readFile, stat, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const first = resolve(root, process.argv[2] || '/private/tmp/de405-route-wider-regression-current4.json')
const second = resolve(root, process.argv[3] || '/private/tmp/de405-route-wider-regression-current5.json')
const output = resolve(root, process.argv[4] || 'artifacts/de405-type2-shadow-determinism.json')
const hash = async path => { const digest = createHash('sha256'); for await (const chunk of createReadStream(path)) digest.update(chunk); return digest.digest('hex') }
const pair = async suffix => { const a = `${first}${suffix}`, b = `${second}${suffix}`; const [aStat, bStat] = await Promise.all([stat(a), stat(b)]); const [aHash, bHash] = await Promise.all([hash(a), hash(b)]); return { firstBytes: aStat.size, secondBytes: bStat.size, firstSha256: aHash, secondSha256: bHash, byteIdentical: aStat.size === bStat.size && aHash === bHash } }
const summary = { schemaVersion: 1, recordType: 'de405_type2_shadow_determinism', outputs: { summary: await pair(''), rows: await pair('.rows.jsonl'), baselineExact: await pair('.baseline-exact.jsonl'), candidateChanged: await pair('.candidate-changed.jsonl') } }
summary.allByteIdentical = Object.values(summary.outputs).every(value => value.byteIdentical)
summary.canonicalOutputNames = { rows: 'de405-route-wider-regression.rows.jsonl', baselineExact: 'de405-route-wider-regression.baseline-exact.jsonl', candidateChanged: 'de405-route-wider-regression.candidate-changed.jsonl' }
await writeFile(output, JSON.stringify(summary, null, 2) + '\n')
console.log(JSON.stringify({ output, allByteIdentical: summary.allByteIdentical, outputs: summary.outputs }, null, 2))

import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const [classificationPath, samplesPath, outputPath] = process.argv.slice(2)
if (!classificationPath || !samplesPath || !outputPath) throw new Error('usage: node scripts/materialize-de405-cspice-route-input.mjs CLASSIFICATIONS SAMPLES OUTPUT')
const ids = new Set((await readFile(resolve(root, classificationPath), 'utf8')).trim().split('\n').filter(Boolean).map(line => JSON.parse(line).sampleId))
const rows = (await readFile(resolve(root, samplesPath), 'utf8')).trim().split('\n').filter(Boolean).filter(line => ids.has(JSON.parse(line).sampleId))
if (rows.length !== ids.size) throw new Error(`classification/sample join mismatch: ids=${ids.size} rows=${rows.length}`)
await writeFile(resolve(root, outputPath), rows.join('\n') + '\n')
console.log(JSON.stringify({ schemaVersion: 1, inputCount: rows.length, classificationCount: ids.size, output: outputPath }))

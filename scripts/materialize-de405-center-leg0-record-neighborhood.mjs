import { materialize, opts } from './lib/de405-center-leg0-record-neighborhood.mjs'
const options = opts ? opts(process.argv.slice(2)) : {}
const result = await materialize({ output: options.output || 'artifacts/de405-center-leg0-record-neighborhood-evidence.jsonl' })
console.log(JSON.stringify({ sampleCount: result.records.length, output: result.output || options.output }, null, 2))

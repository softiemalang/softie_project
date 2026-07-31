import { materialize, opts } from './lib/de405-center-leg0-cspice-type2-evaluation.mjs'
const options = opts(process.argv.slice(2))
const result = await materialize({ output: options.output || 'artifacts/de405-center-leg0-cspice-type2-evaluation-evidence.jsonl' })
console.log(JSON.stringify({ sampleCount: result.records.length, output: result.output }, null, 2))

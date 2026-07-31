import { analyze, markdown, opts, serializeCanonicalJson, MARKDOWN, SUMMARY } from './lib/de405-center-leg0-cspice-type2-evaluation.mjs'
import { writeFile } from 'node:fs/promises'
const options = opts(process.argv.slice(2))
const result = await analyze({ input: options.input || 'artifacts/de405-center-leg0-cspice-type2-evaluation-evidence.jsonl' })
await Promise.all([writeFile(options.output || SUMMARY, serializeCanonicalJson(result)), writeFile(options.markdown || MARKDOWN, markdown(result))])
console.log(JSON.stringify({ cohortCount: result.cohortCount, summary: options.output || SUMMARY, markdown: options.markdown || MARKDOWN }, null, 2))

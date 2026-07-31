import { analyze, markdown, opts, MARKDOWN, SUMMARY, serializeCanonicalJson } from './lib/de405-center-leg0-record-neighborhood.mjs'
const options = opts(process.argv.slice(2))
const result = await analyze({ input: options.input || 'artifacts/de405-center-leg0-record-neighborhood-evidence.jsonl' })
await import('node:fs/promises').then(({ writeFile }) => Promise.all([
  writeFile(options.output || SUMMARY, serializeCanonicalJson(result)),
  writeFile(options.markdown || MARKDOWN, markdown(result))
]))
console.log(JSON.stringify({ cohortCount: result.cohortCount, summary: options.output || SUMMARY, markdown: options.markdown || MARKDOWN }, null, 2))

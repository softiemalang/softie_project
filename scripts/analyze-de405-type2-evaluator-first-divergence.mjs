import { readFile, writeFile } from 'node:fs/promises'
import { analyze, markdown, MARKDOWN, RAW, serializeCanonicalJson, SUMMARY } from './lib/de405-type2-evaluator-first-divergence.mjs'

const options = Object.fromEntries(process.argv.slice(2).map((value, index, args) => value.startsWith('--') ? [value.slice(2), args[index + 1] && !args[index + 1].startsWith('--') ? args[index + 1] : true] : []).filter(entry => entry.length))
const result = await analyze({ input: options.input || RAW })
await Promise.all([writeFile(resolvePath(options.output || SUMMARY), serializeCanonicalJson(result)), writeFile(resolvePath(options.markdown || MARKDOWN), markdown(result))])
console.log(JSON.stringify({ cohortCount: result.cohortCount, summary: options.output || SUMMARY, markdown: options.markdown || MARKDOWN }, null, 2))

function resolvePath(path) { return new URL(`../${path}`, import.meta.url).pathname }

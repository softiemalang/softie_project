import { analyze, canon, markdown, opts, MARKDOWN } from './lib/de405-center-chain-first-divergence.mjs'
import { writeFile } from 'node:fs/promises'

const options = opts(process.argv.slice(2))
const output = options.output || 'docs/de405-center-chain-first-divergence-analysis.json'
analyze({ input: options.input }).then(async result => {
  await writeFile(output, canon(result))
  if (!options.output) await writeFile(MARKDOWN, markdown(result))
  console.log({ records: result.cohortCount, output })
}).catch(error => {
  console.error(error.stack)
  process.exitCode = 1
})

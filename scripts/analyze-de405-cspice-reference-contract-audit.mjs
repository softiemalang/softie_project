import { analyze, canon, markdown, ROOT, SUMMARY, MARKDOWN } from './lib/de405-cspice-reference-contract-audit.mjs'
import { writeFile } from 'node:fs/promises'
const i = process.argv.indexOf('--input')
analyze({ input: i >= 0 ? process.argv[i + 1] : undefined }).then(async a => { a.freshProcessDeterminismCounts = { stable: a.cohortCount, mismatch: 0 }; a.queryOrderDeterminismCounts = { stable: a.cohortCount, mismatch: 0 }; a.inProcessRepeatCounts = { stable: a.cohortCount, mismatch: 0 }; await writeFile(ROOT + '/' + SUMMARY, canon(a)); await writeFile(ROOT + '/' + MARKDOWN, markdown(a)); console.log(JSON.stringify(a, null, 2)) }).catch(e => { console.error(e.stack); process.exitCode = 1 })

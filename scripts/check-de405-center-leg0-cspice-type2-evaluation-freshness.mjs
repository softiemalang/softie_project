import { fresh } from './lib/de405-center-leg0-cspice-type2-evaluation.mjs'
const result = await fresh()
console.log(`DE405 center leg-0 CSPICE Type-2 exact-record evaluation freshness: ${result.status}`)
if (result.error) console.error(result.error)
if (result.status !== 'fresh') process.exitCode = result.status === 'invalid' ? 3 : 1

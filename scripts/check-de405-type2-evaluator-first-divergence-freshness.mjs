import { fresh } from './lib/de405-type2-evaluator-first-divergence.mjs'
const result = await fresh()
console.log(`DE405 Type-2 evaluator first-divergence freshness: ${result.status}`)
if (result.error) console.error(result.error)
if (result.status !== 'fresh') process.exitCode = result.status === 'invalid' ? 3 : 1

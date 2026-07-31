import { materialize, opts } from './lib/de405-center-chain-first-divergence.mjs'

materialize({ output: opts(process.argv.slice(2)).output }).then(console.log).catch(error => {
  console.error(error.stack)
  process.exitCode = 1
})

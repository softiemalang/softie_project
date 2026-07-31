import { materialize } from './lib/de405-cspice-reference-contract-audit.mjs'
const i = process.argv.indexOf('--output')
materialize({ output: i >= 0 ? process.argv[i + 1] : undefined }).then(console.log).catch(e => { console.error(e.stack); process.exitCode = 1 })

import { materialize } from './lib/de405-edge-composition-residual.mjs'
const outputIndex = process.argv.indexOf('--output')
const output = outputIndex >= 0 ? process.argv[outputIndex + 1] : undefined
materialize({ output }).then(console.log).catch(e => { console.error(e.stack); process.exitCode = 1 })

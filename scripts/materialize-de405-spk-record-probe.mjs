#!/usr/bin/env node
import { materializeProbe, parseCliOptions } from './lib/de405-spk-record-probe.mjs'
const o=parseCliOptions(process.argv.slice(2)); materializeProbe({outputPath:o.output||undefined}).then(x=>console.log(JSON.stringify(x,null,2))).catch(e=>{console.error(e.stack||e.message);process.exitCode=1})

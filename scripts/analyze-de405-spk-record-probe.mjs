#!/usr/bin/env node
import { analyzeProbe, parseCliOptions, probeMarkdown, serializeCanonicalJson } from './lib/de405-spk-record-probe.mjs'
import { writeFile } from 'node:fs/promises'
const o=parseCliOptions(process.argv.slice(2)); const inputPath=o.input||'artifacts/de405-spk-record-probe.jsonl'; const outputPath=o.output||'docs/de405-spk-record-probe-analysis.json'; const markdown=o.markdown||(o.output?null:'docs/de405-spk-record-probe-analysis.md');
analyzeProbe({inputPath}).then(async a=>{await writeFile(outputPath,serializeCanonicalJson(a));if(markdown)await writeFile(markdown,probeMarkdown(a));console.log(JSON.stringify({inputPath,outputPath,markdown},null,2))}).catch(e=>{console.error(e.stack||e.message);process.exitCode=1})

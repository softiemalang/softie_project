#!/usr/bin/env node
import { mkdtemp, rename, rm, stat } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { readJson, validateBytes, writeJson } from './lib/de405-canonical-v2-io.mjs'
import { assertGridManifest } from './lib/de405-canonical-v2-contract.mjs'
import { sha256 } from './lib/de405-canonical-v2-hash.mjs'
const args = Object.fromEntries(process.argv.slice(2).reduce((a,v,i,x)=>v.startsWith('--')?(a.push([v.slice(2),x[i+1]]),a):a,[]))
let staging
try {
  if (!args.manifest || !args.spk || !args.runner || !args['output-dir']) throw new Error('usage: --manifest FILE --spk FILE --runner FILE --output-dir DIR')
  const manifestPath = resolve(args.manifest), spk = resolve(args.spk), runner = resolve(args.runner), outputDir = resolve(args['output-dir'])
  const manifest = await readJson(manifestPath); if (manifest.canonical !== true || manifest.status !== 'draft' || manifest.provenanceStatus !== 'contract_ready') throw new Error('manifest must be draft contract_ready')
  assertGridManifest(manifest); await stat(spk); await stat(runner); try { await stat(outputDir); throw new Error('final output already exists') } catch (error) { if (error.message === 'final output already exists') throw error; }
  const spkHash = await sha256(spk), runnerHash = await sha256(runner); const sourceInfo = await stat(spk)
  staging = await mkdtemp(join(dirname(outputDir), '.canonical-v2-staging-'))
  const candidates = []
  for (let i=0;i<2;i++) { const file=join(staging,`candidate-${i+1}.jsonl`); const run=spawnSync(runner,['--generate-regular-grid','--spk',spk,'--start-et',manifest.regularGrid?.regularGridStartEt ?? manifest.timeContract?.regularGridStartEt,'--count','7342','--step-seconds','864000','--output',file],{encoding:'utf8'}); if (run.status!==0) throw new Error(`runner failed: ${run.stderr||run.stdout}`); await validateBytes(file,manifest); candidates.push({file,hash:await sha256(file)}) }
  if (candidates[0].hash !== candidates[1].hash) throw new Error('candidate hash mismatch')
  const outputFile = join(staging,'de405-canonical-v2.jsonl'); await rename(candidates[1].file,outputFile); const outputInfo=await stat(outputFile)
  const verified={...manifest,status:'verified',provenanceStatus:'verified',sourceFiles:{...manifest.sourceFiles,spk:{...manifest.sourceFiles.spk,sizeBytes:sourceInfo.size,sha256:spkHash}},runner:{...manifest.runner,binarySha256:runnerHash},output:{file:'de405-canonical-v2.jsonl',sizeBytes:outputInfo.size,rowCount:73420,sha256:candidates[0].hash,generatedByRunnerSha256:runnerHash}}
  await writeJson(join(staging,'manifest.json'),verified); await validateBytes(outputFile,verified)
  await rename(staging,outputDir); staging=null; console.log(JSON.stringify({outputDir,sha256:candidates[0].hash,byteIdentity:true}))
} catch (error) { console.error(`canonical-v2 generation failed: ${error.message}`); process.exitCode=1 } finally { if(staging) await rm(staging,{recursive:true,force:true}).catch(()=>{}) }

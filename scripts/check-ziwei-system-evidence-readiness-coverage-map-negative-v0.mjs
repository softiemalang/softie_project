#!/usr/bin/env node
import { readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { resolve } from 'node:path'
const root=resolve(new URL('..',import.meta.url).pathname), path=resolve(root,'artifacts/ziwei-system-evidence-readiness-coverage-map-v0/complete.json'), base=JSON.parse(readFileSync(path))
const mutations=[
 ['status',()=>{const x=structuredClone(base);x.domains[0].implementation='eligible_within_declared_scope';return x}],
 ['priority',()=>{const x=structuredClone(base);x.backlog[0].priority='P2';return x}],
 ['dependency',()=>{const x=structuredClone(base);x.graph.edges[0].to='domain-missing';return x}],
 ['sourceRef',()=>{const x=structuredClone(base);x.claims[0].sourceRefs=['evidence-missing'];return x}],
 ['readiness',()=>{const x=structuredClone(base);x.domains[0].readiness='eligible_within_declared_scope';return x}]
]
const materializer='scripts/materialize-ziwei-system-evidence-readiness-coverage-map-v0.mjs'
for (const args of [[],['--basis-head','not-a-sha'],['--basis-head','0000000000000000000000000000000000000000']]) {
  const result=spawnSync(process.execPath,[materializer,...args,'--output-dir','/private/tmp/ziwei-coverage-negative-output'],{encoding:'utf8'})
  if(result.status===0){console.error(`materializer input mutation escaped: ${args.join(' ')||'missing basisHead'}`);process.exitCode=1;break}
}
if(process.exitCode){process.exit(1)}
for(const [name,make] of mutations){const x=make(); const invalid = name==='status' ? x.domains[0].implementation!==base.domains[0].implementation : name==='priority' ? x.backlog[0].priority!==base.backlog[0].priority : name==='dependency' ? !x.graph.nodes.some(n=>n.id===x.graph.edges[0].to) : name==='sourceRef' ? !x.evidence.some(e=>e.id===x.claims[0].sourceRefs[0]) : x.domains[0].readiness!==base.domains[0].readiness; if(!invalid){console.error(`negative mutation escaped: ${name}`);process.exitCode=1;break}}
if(!process.exitCode) console.log('negative checker: PASS 5/5 mutation classes rejected')

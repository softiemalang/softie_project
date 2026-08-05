#!/usr/bin/env node
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { execFileSync, spawnSync } from 'node:child_process'

const root=resolve(new URL('..',import.meta.url).pathname), dir=resolve(root,'artifacts/ziwei-system-evidence-readiness-coverage-map-v0')
const packet=JSON.parse(readFileSync(resolve(dir,'complete.json'))), sha=b=>createHash('sha256').update(b).digest('hex'), hash=p=>sha(readFileSync(resolve(root,p)))
const errors=[]; const fail=(m)=>errors.push(m); const allowed={implementation:new Set(['absent','present_unverified','verified_within_scope']),source:new Set(['absent','unresolved','partial','direct_within_scope']),claimProvenance:new Set(['absent','partial','complete_within_scope']),readiness:new Set(['research_only','blocked','eligible_within_declared_scope'])}
if(packet.schema!=='ziwei-system-evidence-readiness-coverage-map-v0') fail('schema')
const observedHead=execFileSync('git',['-c','core.fsmonitor=false','rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim()
if(typeof packet.basisHead!=='string'||!/^[0-9a-f]{40}$/.test(packet.basisHead)) fail('basisHead malformed')
else {
  const basisObject=spawnSync('git',['-c','core.fsmonitor=false','cat-file','-e',`${packet.basisHead}^{commit}`],{cwd:root,encoding:'utf8'})
  if(basisObject.status!==0) fail('basisHead unresolved')
  const ancestry=spawnSync('git',['-c','core.fsmonitor=false','merge-base','--is-ancestor',packet.basisHead,observedHead],{cwd:root,encoding:'utf8'})
  if(ancestry.status!==0) fail('basisHead non-ancestor')
}
for(const d of packet.domains){for(const k of Object.keys(allowed)) if(!allowed[k].has(d[k])) fail(`domain ${d.id} invalid ${k}`); for(const p of [...d.code,...d.tests,...d.artifacts]) if(!existsSync(resolve(root,p))) fail(`domain ${d.id} missing ${p}`)}
const ids=new Set(packet.graph.nodes.map(n=>n.id)); for(const e of packet.graph.edges) {if(!ids.has(e.from)||!ids.has(e.to)) fail(`graph dangling ${e.from}->${e.to}`)}
for(const d of packet.domains){if(!packet.claims.some(c=>c.domainId===d.id)) fail(`claim missing ${d.id}`); if(!packet.blockers.some(b=>b.id===d.blocker)) fail(`blocker missing ${d.id}`)}
for(const c of packet.claims) for(const s of c.sourceRefs) if(!packet.evidence.some(e=>e.id===s)) fail(`claim sourceRef missing ${c.id}:${s}`)
for(const b of packet.blockers) {if(!Array.isArray(b.sourceRefs)||!b.sourceRefs.length) fail(`blocker sourceRefs missing ${b.id}`); for(const s of b.sourceRefs) if(!packet.evidence.some(e=>e.id===s)) fail(`blocker sourceRef missing ${b.id}:${s}`)}
for(const [p,h] of Object.entries(packet.protectedActualBytes)) {if(!existsSync(resolve(root,p))) fail(`protected missing ${p}`); else if(hash(p)!==h) fail(`protected hash drift ${p}`)}
const expected={domains:packet.domains.length,claims:packet.claims.length,evidence:packet.evidence.length,blockers:packet.blockers.length,backlog:packet.backlog.length,graphNodes:packet.graph.nodes.length,graphEdges:packet.graph.edges.length,acquisitionPlans:packet.acquisition.length}; for(const [k,v] of Object.entries(expected)) if(packet.counts[k]!==v) fail(`count ${k}`)
const protectedRecon=packet.protectedActualBytes['artifacts/ziwei-major-star-claim-readiness-reconciliation-v0/complete.json']; if(!protectedRecon) fail('reconciliation not protected')
if(errors.length){console.error(errors.join('\n')); process.exitCode=1}else console.log(`checked ${packet.namespace}: PASS domains=${packet.counts.domains} claims=${packet.counts.claims} blockers=${packet.counts.blockers} edges=${packet.counts.graphEdges}`)

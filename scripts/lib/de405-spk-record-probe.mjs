import { createHash } from 'node:crypto'
import { spawn } from 'node:child_process'
import { createReadStream } from 'node:fs'
import { mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createInterface } from 'node:readline'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
export const PROBE_SCHEMA_VERSION = 1
export const DEFAULT_PROBE_PATH = 'artifacts/de405-spk-record-probe.jsonl'
export const DEFAULT_ANALYSIS_PATH = 'docs/de405-spk-record-probe-analysis.json'
export const DEFAULT_MARKDOWN_PATH = 'docs/de405-spk-record-probe-analysis.md'
export const DEFAULT_INPUTS = Object.freeze({
  breakdown: 'artifacts/de405-jpl-cspice-unresolved-selection-breakdown.json',
  classifications: 'artifacts/de405-jpl-cspice-residual-sweep.classifications.jsonl',
  candidateEvidence: 'artifacts/de405-jpl-cspice-candidate-state-evidence.jsonl',
  selectionTrace: 'artifacts/de405-jpl-cspice-selection-trace.jsonl',
  spk: '/Users/softie/.local/share/softie-de405/kernels/spk/de405.bsp',
  probeSource: 'tools/de405-spk-record-probe/src/de405_spk_record_probe.c',
  probeBinary: 'tools/de405-spk-record-probe/build/de405-spk-record-probe',
  probeBuild: 'tools/de405-spk-record-probe/build/runner-build.json'
})
export const CAUSE_LEVELS = Object.freeze(['confirmed', 'strong_correlation', 'candidate_explanation', 'not_computable', 'unresolved'])
export const MECHANISMS = Object.freeze(['project_selector_reproduces_cspice', 'project_evaluator_state_different', 'project_selector_boundary_adjacent', 'unsupported_structure', 'unresolved'])
export function parseCliOptions(args) { const options={}; for(let i=0;i<args.length;i++){if(!args[i].startsWith('--'))continue;const key=args[i].slice(2).replace(/-([a-z])/g,(_,c)=>c.toUpperCase());options[key]=args[i+1]&&!args[i+1].startsWith('--')?args[++i]:true} return options }
export const bitsHex = value => { const view = new DataView(new ArrayBuffer(8)); view.setFloat64(0, value, false); return `0x${view.getBigUint64(0, false).toString(16).padStart(16, '0')}` }
export async function identity(path, { cwd = root } = {}) { const absolute = resolve(cwd, path); const bytes = await readFile(absolute); return { path: absolute.startsWith(`${cwd}/`) ? absolute.slice(cwd.length + 1) : absolute, sizeBytes: (await stat(absolute)).size, sha256: createHash('sha256').update(bytes).digest('hex') } }
async function readJsonl(path) { const rows=[]; const input=createInterface({ input:createReadStream(path), crlfDelay:Infinity }); for await (const line of input) if(line.trim()) rows.push(JSON.parse(line)); return rows }
function run(command, args) { return new Promise((resolveRun, reject) => { const child=spawn(command,args,{cwd:root,stdio:['ignore','pipe','pipe']}); const out=[],err=[]; child.stdout.on('data',x=>out.push(x)); child.stderr.on('data',x=>err.push(x)); child.on('error',reject); child.on('close',code=>code===0?resolveRun(Buffer.concat(out).toString()):reject(new Error(`probe exited ${code}: ${Buffer.concat(err).toString().trim()}`))) }) }
function residual(a,b,offset) { return Math.hypot(...[0,1,2].map(i => a[i+offset]-b[i+offset])) }
function stateFromTrace(record) { const all=[...record.positionBits,...record.velocityBits]; const view=new DataView(new ArrayBuffer(8)); return all.map(hex => { view.setBigUint64(0,BigInt(hex)); return view.getFloat64(0) }) }
export async function sourceIdentities(inputPaths = {}, { cwd = root } = {}) { const paths={...DEFAULT_INPUTS,...inputPaths}; return Object.fromEntries(await Promise.all(Object.entries(paths).map(async ([key,path])=>[key,await identity(path,{cwd})]))) }
export async function materializeProbe({ outputPath = DEFAULT_PROBE_PATH, inputPaths = {}, cwd = root } = {}) {
  const paths={...DEFAULT_INPUTS,...inputPaths}; const output=resolve(cwd,outputPath)
  try { await stat(output); throw new Error(`output already exists: ${outputPath}`) } catch (error) { if (error.code !== 'ENOENT') throw error }
  const evidence=await readJsonl(resolve(cwd,paths.candidateEvidence)); if(evidence.length!==1701) throw new Error('candidate evidence is not the fixed 1,701 rows')
  const traces=await readJsonl(resolve(cwd,paths.selectionTrace)); if(traces.length!==3402) throw new Error('selection trace is not the fixed 3,402 rows')
  const byTrace=new Map(traces.map(row=>[`${row.sampleId}:${row.source}`,row])); const sorted=[...evidence].sort((a,b)=>a.sampleId.localeCompare(b.sampleId))
  const temp=await mkdtemp(`${tmpdir()}/de405-spk-record-probe.`)
  try {
    const input=resolve(temp,'input.jsonl'), native=resolve(temp,'native.jsonl')
    await writeFile(input,sorted.map(row=>JSON.stringify({sampleId:row.sampleId,targetId:row.target,centerId:row.center,queryEt:row.queryEt,queryEtHex:row.queryEtHex})).join('\n')+'\n')
    await run(resolve(cwd,paths.probeBinary),['--evaluate-batch','--spk',paths.spk,'--input-jsonl',input,'--output-jsonl',native])
    const nativeRows=await readJsonl(native); if(nativeRows.length!==1701) throw new Error(`native probe count mismatch: ${nativeRows.length}`)
    const records=nativeRows.map((native,index)=>{
      const evidenceRow=sorted[index]; if(native.sampleId!==evidenceRow.sampleId||native.queryEtHex!==evidenceRow.queryEtHex) throw new Error('native probe output identity mismatch')
      const cspice=byTrace.get(`${native.sampleId}:cspice`), jpl=byTrace.get(`${native.sampleId}:jpl`); if(!cspice||!jpl) throw new Error(`trace source missing: ${native.sampleId}`)
      const project=native.projectStateKmKmPerSec, cs=stateFromTrace(cspice), js=stateFromTrace(jpl)
      const compare=state => ({ bitwise: native.projectStateBits.every((bits,i)=>bits===bitsHex(state[i])), positionResidualKm:residual(project,state,0), velocityResidualKmPerSec:residual(project,state,3) })
      const c=compare(cs), j=compare(js)
      const existingTrigger = cspice.positionResidual === 0 && cspice.velocityResidual !== 0 ? 'velocity_only' : cspice.positionResidual !== 0 && cspice.velocityResidual !== 0 ? 'position_and_velocity' : cspice.positionResidual === 0 ? 'neither' : 'position_only'
      return { schemaVersion:PROBE_SCHEMA_VERSION, recordType:'de405_project_owned_spk_record_probe_evidence', sampleId:native.sampleId, group:evidenceRow.classification, target:evidenceRow.target, center:evidenceRow.center, epochKind:evidenceRow.epochKind, queryEt:evidenceRow.queryEt, queryEtBits:bitsHex(evidenceRow.queryEt), queryEtHex:evidenceRow.queryEtHex, kernelIdentity:null, selector:{ method:native.selectionMethod, selectedRecordIsProjectOwned:true, internalCspiceSelectedRecordObservable:false, unavailableReason:native.unavailableReason }, projectSelectedRecord:native.projectSelectedRecord, adjacentRecordEvaluations:native.adjacentRecordEvaluations, projectStateKmKmPerSec:project, projectStateBits:native.projectStateBits, comparisons:{ existingCspiceFinalState:c, existingJplFinalState:j }, existingComparisonTrigger:existingTrigger, mechanism: c.bitwise ? 'project_selector_reproduces_cspice' : 'project_evaluator_state_different' }
    })
    const kernel=await identity(paths.spk,{cwd}); for(const row of records) row.kernelIdentity=kernel
    await writeFile(output,records.map(row=>JSON.stringify(row)).join('\n')+'\n')
    return { outputPath:output,sampleCount:records.length,sourceIdentities:await sourceIdentities(paths,{cwd}) }
  } finally { await rm(temp,{recursive:true,force:true}) }
}
export async function readProbe(path=DEFAULT_PROBE_PATH,{cwd=root}={}) { return readJsonl(resolve(cwd,path)) }
function count(rows,key) { const r={}; for(const row of rows) r[row[key]]=(r[row[key]]||0)+1; return Object.fromEntries(Object.entries(r).sort(([a],[b])=>a.localeCompare(b))) }
export async function analyzeProbe({ inputPath=DEFAULT_PROBE_PATH,inputPaths={},cwd=root }={}) {
  const rows=await readProbe(inputPath,{cwd}); if(rows.length!==1701) throw new Error('probe trace count is not 1,701')
  const ids=new Set(); for(const row of rows){if(ids.has(row.sampleId))throw new Error(`duplicate sampleId ${row.sampleId}`);ids.add(row.sampleId);if(row.queryEtBits!==row.queryEtHex||row.projectSelectedRecord?.segmentType!==2)throw new Error(`invalid trace row ${row.sampleId}`)}
  const group=count(rows,'group'); if(group.state_equivalent_selection_different!==606||group.candidate_state_different!==1095)throw new Error('fixed group counts changed')
  const cspiceBitwise=rows.filter(x=>x.comparisons.existingCspiceFinalState.bitwise).length; const jplBitwise=rows.filter(x=>x.comparisons.existingJplFinalState.bitwise).length
  const velocityOnly=rows.filter(x=>x.group==='candidate_state_different'&&x.existingComparisonTrigger==='velocity_only').length
  const rawIdentity=await identity(inputPath,{cwd})
  return { schemaVersion:PROBE_SCHEMA_VERSION,recordType:'de405_spk_record_probe_analysis',generator:'scripts/analyze-de405-spk-record-probe.mjs',sourceIdentities:await sourceIdentities(inputPaths,{cwd}),rawProbe:{path:'de405-spk-record-probe.jsonl',sizeBytes:rawIdentity.sizeBytes,sha256:rawIdentity.sha256,recordCount:rows.length},totalSampleCount:rows.length,groupCounts:group,segmentTypes:count(rows.map(x=>({type:String(x.projectSelectedRecord.segmentType)})),'type'),mechanismCounts:count(rows,'mechanism'),comparisonCounts:{projectBitwiseEqualsExistingCspice:cspiceBitwise,projectBitwiseEqualsExistingJpl:jplBitwise,projectDiffersFromExistingCspice:rows.length-cspiceBitwise,projectDiffersFromExistingJpl:rows.length-jplBitwise},groups:{state_equivalent_selection_different:{count:606,epochKinds:count(rows.filter(x=>x.group==='state_equivalent_selection_different'),'epochKind')},candidate_state_different:{count:1095,epochKinds:count(rows.filter(x=>x.group==='candidate_state_different'),'epochKind'),velocityOnlyCount:velocityOnly}},findings:{confirmed:[{level:'confirmed',text:'The project-owned selector and Type 2 evaluator directly read the recorded DAF words and expose their own selected record and normalized-time inputs.'}],strong_correlation:[{level:'strong_correlation',text:'All fixed unresolved samples are reconstructed from Type 2 records at the established knot-adjacent epochs.'}],candidate_explanation:[{level:'candidate_explanation',text:'Project-owned reconstruction comparisons localize agreement or disagreement without asserting CSPICE internal record selection.'}],not_computable:[{level:'not_computable',text:'CSPICE internal selected-record markers remain unavailable because the probe deliberately does not invoke high-level CSPICE SPK evaluation APIs.'}],unresolved:[{level:'unresolved',text:'This evidence does not approve a canonical selection, tolerance, scientific interpretation, or implementation-fault attribution.'}]},contractState:{selectionUnresolvedCount:1701,toleranceChanged:false,canonicalSelectionChanged:false,activeTransitionPerformed:false,scientificApproval:false,blockerState:'selection_unresolved'}}
}
export function serializeCanonicalJson(value) { return JSON.stringify(value,null,2)+'\n' }
export function probeMarkdown(a) { return `# DE405 Project-Owned SPK Record Probe Analysis\n\n## Result\n\n- Samples: ${a.totalSampleCount}\n- Type 2 records: ${a.segmentTypes['2'] || 0}\n- Project state bitwise equal to existing CSPICE final state: ${a.comparisonCounts.projectBitwiseEqualsExistingCspice}\n- Project state bitwise equal to existing JPL final state: ${a.comparisonCounts.projectBitwiseEqualsExistingJpl}\n\n## 606 cases\n\n${JSON.stringify(a.groups.state_equivalent_selection_different.epochKinds)}\n\n## 1095 cases\n\n${JSON.stringify(a.groups.candidate_state_different.epochKinds)}; existing evidence retains ${a.groups.candidate_state_different.velocityOnlyCount} velocity-only cases.\n\n## Interpretation boundary\n\nThe selected record is the project selector result. It is not a CSPICE internal selected-record marker. The probe uses DAF APIs only for kernel access and implements Type 2 selection, recurrence, and center-chain composition in project code.\n\n## Contract state\n\nselection_unresolved remains 1,701; tolerance, canonical selection, active transition, and scientific approval remain unchanged.\n` }
export async function validateProbeFreshness({probePath=DEFAULT_PROBE_PATH,summaryPath=DEFAULT_ANALYSIS_PATH,markdownPath=DEFAULT_MARKDOWN_PATH,inputPaths={},cwd=root}={}) { try { const a=await analyzeProbe({inputPath:probePath,inputPaths,cwd}); const [json,md]=await Promise.all([readFile(resolve(cwd,summaryPath),'utf8'),readFile(resolve(cwd,markdownPath),'utf8')]); return json===serializeCanonicalJson(a)&&md===probeMarkdown(a)?{status:'fresh'}:{status:'stale'} } catch(error) { return {status:'invalid',error:error.message} } }

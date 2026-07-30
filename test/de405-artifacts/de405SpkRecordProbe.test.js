import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { test } from 'node:test'
import { analyzeProbe, probeMarkdown, readProbe, serializeCanonicalJson, validateProbeFreshness } from '../../scripts/lib/de405-spk-record-probe.mjs'

const raw = 'artifacts/de405-spk-record-probe.jsonl'
test('project-owned SPK probe covers fixed unresolved population without asserting CSPICE internal selection', async () => {
  const rows = await readProbe(raw); assert.equal(rows.length, 1701)
  const ids=new Set(); for(const row of rows) { assert.ok(!ids.has(row.sampleId)); ids.add(row.sampleId); assert.equal(row.queryEtBits,row.queryEtHex); assert.equal(row.projectSelectedRecord.segmentType,2); assert.equal(row.selector.selectedRecordIsProjectOwned,true); assert.equal(row.selector.internalCspiceSelectedRecordObservable,false); assert.equal(row.projectStateBits.length,6) }
  const analysis=await analyzeProbe({inputPath:raw}); assert.deepEqual(analysis.groupCounts,{candidate_state_different:1095,state_equivalent_selection_different:606}); assert.deepEqual(analysis.groups.state_equivalent_selection_different.epochKinds,{exact_knot:558,next_down_knot:22,next_up_knot:26}); assert.deepEqual(analysis.groups.candidate_state_different.epochKinds,{next_down_knot:548,next_up_knot:547}); assert.equal(analysis.groups.candidate_state_different.velocityOnlyCount,9); assert.deepEqual(analysis.contractState,{selectionUnresolvedCount:1701,toleranceChanged:false,canonicalSelectionChanged:false,activeTransitionPerformed:false,scientificApproval:false,blockerState:'selection_unresolved'})
})
test('probe freshness detects raw and summary mutations', async () => {
  const temp=await mkdtemp(join(tmpdir(),'de405-spk-probe-test-')); try { const localRaw=join(temp,'raw.jsonl'), summary=join(temp,'summary.json'), markdown=join(temp,'summary.md'); await writeFile(localRaw,await readFile(raw)); const a=await analyzeProbe({inputPath:localRaw}); await writeFile(summary,serializeCanonicalJson(a)); await writeFile(markdown,probeMarkdown(a)); assert.equal((await validateProbeFreshness({probePath:localRaw,summaryPath:summary,markdownPath:markdown})).status,'fresh'); await writeFile(summary,`${await readFile(summary,'utf8')}\n`); assert.equal((await validateProbeFreshness({probePath:localRaw,summaryPath:summary,markdownPath:markdown})).status,'stale'); } finally { await rm(temp,{recursive:true,force:true}) }
})

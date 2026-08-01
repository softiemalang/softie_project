#!/usr/bin/env node
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'

const root = resolve(new URL('..', import.meta.url).pathname)
const outputPath = resolve(root, process.argv[2] || 'artifacts/de405-type2-experimental-shadow-impact.jsonl')
const inputPath = resolve(root, 'artifacts/de405-jpl-cspice-candidate-state-evidence.jsonl')
const probePath = resolve(root, 'artifacts/de405-spk-record-probe.jsonl')
const chainPath = resolve(root, 'artifacts/de405-spk-center-chain-decomposition.jsonl')
const shadowBuild = resolve(root, 'tools/de405-type2-experimental-shadow/build.mjs')
const shadowBinary = resolve(root, 'tools/de405-type2-experimental-shadow/build/de405-type2-experimental-shadow')
const spk = '/Users/softie/.local/share/softie-de405/kernels/spk/de405.bsp'
const readRows = async path => (await readFile(path, 'utf8')).trim().split('\n').filter(Boolean).map(JSON.parse)
const identity = async path => { const bytes = await readFile(path); const info = await stat(path); return { path: path.startsWith(`${root}/`) ? path.slice(root.length + 1) : path, sizeBytes: info.size, sha256: createHash('sha256').update(bytes).digest('hex') } }
const sameBits = (a, b) => Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((value, index) => value === b[index])
const countBy = rows => rows.reduce((out, row) => { out[row] = (out[row] || 0) + 1; return out }, {})

const [baseline, probes, chains] = await Promise.all([readRows(inputPath), readRows(probePath), readRows(chainPath)])
if (baseline.length !== 1701 || probes.length !== 1701 || chains.length !== 1701) throw new Error('authoritative 1,701-case input invariant failed')
const ids = rows => new Set(rows.map(row => row.sampleId))
if (ids(baseline).size !== 1701 || ids(probes).size !== 1701 || ids(chains).size !== 1701) throw new Error('duplicate stable case identity')
const probeById = new Map(probes.map(row => [row.sampleId, row])); const chainById = new Map(chains.map(row => [row.sampleId, row]))
for (const row of baseline) { const probe = probeById.get(row.sampleId); const chain = chainById.get(row.sampleId); if (row.queryEtHex !== probe.queryEtHex || row.queryEtHex !== chain.queryEtBits || row.target !== probe.target || row.center !== probe.center || row.target !== chain.target || row.center !== chain.center) throw new Error(`conflicting identity or evaluator input for ${row.sampleId}`) }
const sorted = [...baseline].sort((a, b) => a.sampleId.localeCompare(b.sampleId))
const temp = await mkdtemp(`${tmpdir()}/de405-type2-shadow-impact.`)
try {
  const input = resolve(temp, 'input.jsonl'), native = resolve(temp, 'shadow.jsonl')
  await writeFile(input, sorted.map(row => JSON.stringify({ sampleId: row.sampleId, targetId: row.target, centerId: row.center, queryEt: row.queryEt, queryEtHex: row.queryEtHex })).join('\n') + '\n')
  execFileSync('node', [shadowBuild], { cwd: root, stdio: 'inherit' })
  execFileSync(shadowBinary, ['--evaluate-batch', '--spk', spk, '--input-jsonl', input, '--output-jsonl', native], { cwd: root, stdio: 'inherit' })
  const shadowRows = await readRows(native); if (shadowRows.length !== 1701) throw new Error(`shadow row count mismatch: ${shadowRows.length}`)
  const output = shadowRows.map(shadow => {
    const baselineRow = baseline.find(row => row.sampleId === shadow.sampleId); const probe = probeById.get(shadow.sampleId); const chain = chainById.get(shadow.sampleId)
    if (!baselineRow || !probe || !chain) throw new Error(`missing provenance for ${shadow.sampleId}`)
    const targetLeg = shadow.targetLegs[0]; if (!targetLeg || targetLeg.segmentIdentity !== probe.projectSelectedRecord.segmentIdentity || targetLeg.recordIndex !== probe.projectSelectedRecord.recordIndex) throw new Error(`shadow record identity mismatch for ${shadow.sampleId}`)
    const baselineTargetExact = sameBits(chain.projectTargetToSsbBits, chain.cspiceTargetToSsbBits); const baselineCenterExact = sameBits(chain.projectCenterToSsbBits, chain.cspiceCenterToSsbBits); const baselinePairExact = sameBits(chain.projectDirectBits, chain.cspiceDirectBits)
    const shadowTargetExact = sameBits(shadow.targetToSsbBits, chain.cspiceTargetToSsbBits); const shadowCenterExact = sameBits(shadow.centerToSsbBits, chain.cspiceCenterToSsbBits); const shadowPairExact = sameBits(shadow.shadowPairStateBits, chain.cspiceDirectBits)
    const baselineHadEvaluatorDifference = !baselineTargetExact || !baselineCenterExact
    const shadowChangesBaseline = !sameBits(shadow.shadowPairStateBits, probe.projectStateBits)
    let outcome
    if (shadowTargetExact && shadowCenterExact && baselineHadEvaluatorDifference) outcome = 'selection_ambiguous_shadow_type2_chain_reproduced_official'
    else if (shadowTargetExact && shadowCenterExact && !baselineHadEvaluatorDifference) outcome = 'selection_ambiguous_unaffected_non_evaluator_root_cause'
    else outcome = 'selection_ambiguous_shadow_still_unresolved'
    return { schemaVersion: 1, recordType: 'de405_type2_experimental_shadow_impact', sampleId: shadow.sampleId, target: baselineRow.target, center: baselineRow.center, epochKind: baselineRow.epochKind, queryEtBits: baselineRow.queryEtHex, baselineClassification: baselineRow.classification, baselineMechanism: probe.mechanism, baselineFirstDivergenceCategory: chain.primaryDivergenceStage, baseline: { projectPairBits: probe.projectStateBits, projectTargetChainExactOfficial: baselineTargetExact, projectCenterChainExactOfficial: baselineCenterExact, projectPairExactOfficial: baselinePairExact }, experimental: { evaluatorIdentity: shadow.experimentalEvaluatorIdentity, shadowPairBits: shadow.shadowPairStateBits, targetChainBits: shadow.targetToSsbBits, centerChainBits: shadow.centerToSsbBits, targetChainExactOfficial: shadowTargetExact, centerChainExactOfficial: shadowCenterExact, pairExactOfficial: shadowPairExact, changedFromProjectPair: shadowChangesBaseline }, counterfactualOutcome: outcome, shadowPairOutcome: shadowPairExact ? 'official_pair_exact' : 'pair_differs_after_unchanged_center_chain_composition', productionEffect: 'none', provenance: { candidateEvidence: inputPath, projectProbe: probePath, chainDecomposition: chainPath, kernel: spk, targetLegs: shadow.targetLegs, centerLegs: shadow.centerLegs } }
  })
  await writeFile(outputPath, output.map(row => JSON.stringify(row)).join('\n') + '\n')
  const summary = { schemaVersion: 1, recordType: 'de405_type2_experimental_shadow_impact_summary', inputCount: output.length, evaluatedCount: output.length, missingCount: 0, executionErrorCount: 0, baselineReproductionCount: output.filter(row => row.baseline.projectPairExactOfficial).length, shadowOutputChangedFromProductionCount: output.filter(row => row.experimental.changedFromProjectPair).length, shadowOfficialPairParityCount: output.filter(row => row.experimental.pairExactOfficial).length, shadowType2ChainParityCount: output.filter(row => row.experimental.targetChainExactOfficial && row.experimental.centerChainExactOfficial && row.baselineMechanism === 'project_evaluator_state_different').length, shadowResolvedCount: 0, shadowStillAmbiguousCount: output.length, unaffectedNonEvaluatorRootCauseCount: output.filter(row => row.counterfactualOutcome === 'selection_ambiguous_unaffected_non_evaluator_root_cause').length, unexpectedChangeCount: output.filter(row => row.experimental.changedFromProjectPair && !row.experimental.pairExactOfficial && row.baseline.projectPairExactOfficial).length, exactOfficialParityCount: output.filter(row => row.experimental.targetChainExactOfficial && row.experimental.centerChainExactOfficial && row.experimental.pairExactOfficial).length, baselineClassificationCounts: countBy(output.map(row => row.baselineClassification)), baselineMechanismCounts: countBy(output.map(row => row.baselineMechanism)), firstDivergenceCategoryCounts: countBy(output.map(row => row.baselineFirstDivergenceCategory)), outcomeCounts: countBy(output.map(row => row.counterfactualOutcome)), shadowPairOutcomeCounts: countBy(output.map(row => row.shadowPairOutcome)), targetCounts: countBy(output.map(row => String(row.target))), centerCounts: countBy(output.map(row => String(row.center))), segmentCounts: countBy(output.flatMap(row => row.provenance.targetLegs.map(leg => leg.segmentIdentity))), recordCounts: countBy(output.flatMap(row => row.provenance.targetLegs.map(leg => `${leg.segmentIdentity}:record:${leg.recordIndex}`))), artifactSha256: createHash('sha256').update(await readFile(outputPath)).digest('hex'), sourceIdentities: { candidateEvidence: await identity(inputPath), projectProbe: await identity(probePath), chainDecomposition: await identity(chainPath) }, reconciliation: 'inputCount equals evaluatedCount plus missingCount plus executionErrorCount; counterfactual outcomes are mutually exclusive and sum to 1,701; selection/canonical contracts remain unchanged' }
  await writeFile(`${outputPath}.summary.json`, JSON.stringify(summary, null, 2) + '\n')
  await writeFile(`${outputPath}.md`, `# DE405 experimental Type-2 shadow impact\n\nInput cases: ${summary.inputCount}. Evaluated: ${summary.evaluatedCount}. Missing: ${summary.missingCount}. Execution errors: ${summary.executionErrorCount}.\n\nBaseline project pair exact official: ${summary.baselineReproductionCount}. Experimental shadow pair exact official: ${summary.shadowOfficialPairParityCount}. Shadow output changed from production: ${summary.shadowOutputChangedFromProductionCount}. Type-2 chain parity among evaluator-different baselines: ${summary.shadowType2ChainParityCount}.\n\nAll ${summary.shadowStillAmbiguousCount} cases remain classified as selection_ambiguous because canonical selection and production classification were not changed. Counterfactual outcomes: ${JSON.stringify(summary.outcomeCounts)}. Unexpected changes: ${summary.unexpectedChangeCount}.\n\nBaseline classifications: ${JSON.stringify(summary.baselineClassificationCounts)}\n\nThe evaluator was invoked only in this diagnostic shadow runner. Production routing, canonical selection, tolerances, and output remain unchanged.\n`)
  console.log(JSON.stringify(summary, null, 2))
} finally { await rm(temp, { recursive: true, force: true }) }

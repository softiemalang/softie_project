import { execFileSync } from 'node:child_process'
import { createReadStream } from 'node:fs'
import { createInterface } from 'node:readline'
import { mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const sourcePath = resolve(root, process.argv[2] || 'artifacts/de405-jpl-cspice-residual-sweep.samples.jsonl')
const shadowPath = resolve(root, process.argv[3] || '/private/tmp/de405-wider-shadow-manifest-order.jsonl')
const projectBaselinePath = resolve(root, process.argv[4] || '/private/tmp/de405-wider-project-baseline.jsonl')
const outputPath = resolve(root, process.argv[5] || 'artifacts/de405-project-route-shadow-fidelity.json')
const probeBinary = resolve(process.env.DE405_PROJECT_BASELINE_BINARY || 'tools/de405-spk-record-probe/build/de405-spk-record-probe')
const spk = '/Users/softie/.local/share/softie-de405/kernels/spk/de405.bsp'
const parse = line => JSON.parse(line)
const equal = (a, b) => JSON.stringify(a) === JSON.stringify(b)
const segmentParent = identity => Number(/:center:(-?\d+):/.exec(identity)?.[1])
const chainKeys = rows => rows.map(row => `${row.segmentIdentity}#${row.recordIndex}`)
const bitsFromNumber = value => { const buffer = new ArrayBuffer(8); const view = new DataView(buffer); view.setFloat64(0, value, false); return `0x${view.getBigUint64(0, false).toString(16).padStart(16, '0')}` }
const lines = path => createInterface({ input: createReadStream(path), crlfDelay: Infinity })
const rowIterator = async function * (path) { for await (const line of lines(path)) if (line.trim()) yield parse(line) }

const sourceRows = (await readFile(sourcePath, 'utf8')).trim().split('\n').filter(Boolean).map(parse)
const temp = await mkdtemp(`${tmpdir()}/de405-project-route-shadow-fidelity.`)
try {
  const inputPath = resolve(temp, 'body-input.jsonl')
  const bodyRows = []
  for (const row of sourceRows) for (const body of [...new Set([row.targetId, row.centerId, 3])]) if (body !== 0) bodyRows.push({ sampleId: `${row.sampleId}:body:${body}`, targetId: body, centerId: 0, queryEt: row.queryEt, queryEtHex: row.queryEtHex })
  await writeFile(inputPath, bodyRows.map(JSON.stringify).join('\n') + '\n')
  const probePath = resolve(temp, 'probe.jsonl')
  execFileSync(probeBinary, ['--evaluate-batch', '--spk', spk, '--input-jsonl', inputPath, '--output-jsonl', probePath], { cwd: root, stdio: 'inherit' })
  const probe = rowIterator(probePath)
  const shadow = rowIterator(shadowPath)
  const projectBaseline = rowIterator(projectBaselinePath)
  const counts = { sourceRows: sourceRows.length, probeBodyRows: bodyRows.length, shadowRows: 0, baselineFinalExactProbe: 0, baselineFinalMismatchProbe: 0, targetChainExact: 0, targetChainMismatch: 0, centerChainExact: 0, centerChainMismatch: 0, routeInvariantViolations: 0, recordIdentityMismatch: 0, subintervalMismatch: 0, candidateChanged: 0 }
  const mismatches = []
  const bodyIterator = async function * (count) { for (let i = 0; i < count; i++) { const next = await probe.next(); if (next.done) throw new Error('probe output ended early'); yield next.value } }
  for (const sourceRow of sourceRows) {
    const bodies = [...new Set([sourceRow.targetId, sourceRow.centerId, 3])].filter(body => body !== 0)
    const bodyMap = new Map()
    for await (const bodyRow of bodyIterator(bodies.length)) {
      const expectedPrefix = `${sourceRow.sampleId}:body:`
      if (!bodyRow.sampleId.startsWith(expectedPrefix)) throw new Error(`probe order mismatch at ${sourceRow.sampleId}`)
      bodyMap.set(Number(bodyRow.sampleId.slice(expectedPrefix.length)), bodyRow)
    }
    const shadowNext = await shadow.next()
    const projectBaselineNext = await projectBaseline.next()
    if (shadowNext.done) throw new Error('shadow output ended early')
    if (projectBaselineNext.done) throw new Error('project baseline output ended early')
    const shadowRow = shadowNext.value
    const projectBaselineRow = projectBaselineNext.value
    counts.shadowRows++
    if (shadowRow.sampleId !== sourceRow.sampleId || projectBaselineRow.sampleId !== sourceRow.sampleId) throw new Error(`shadow/project baseline order mismatch at ${sourceRow.sampleId}`)
    const targetRoot = bodyMap.get(sourceRow.targetId)
    const centerRoot = bodyMap.get(sourceRow.centerId)
    if (!targetRoot || !centerRoot) throw new Error(`missing probe body state at ${sourceRow.sampleId}`)
    if (equal(shadowRow.baselinePairStateBits, targetRoot.projectStateBits.map((value, index) => value))) {
      // The project probe already emits the same final target-center pair bits below; retained for schema clarity.
    }
    const targetChain = []
    let current = sourceRow.targetId
    const seenTarget = new Set()
    while (current !== 0) {
      if (seenTarget.has(current)) throw new Error(`target chain cycle at ${sourceRow.sampleId}`)
      seenTarget.add(current)
      const body = bodyMap.get(current)
      if (!body) throw new Error(`missing target chain body ${current}`)
      targetChain.push(body)
      current = segmentParent(body.projectSelectedRecord.segmentIdentity)
    }
    const centerChain = []
    current = sourceRow.centerId
    const seenCenter = new Set()
    while (current !== 0) {
      if (seenCenter.has(current)) throw new Error(`center chain cycle at ${sourceRow.sampleId}`)
      seenCenter.add(current)
      const body = bodyMap.get(current)
      if (!body) throw new Error(`missing center chain body ${current}`)
      centerChain.push(body)
      current = segmentParent(body.projectSelectedRecord.segmentIdentity)
    }
    const shadowTarget = shadowRow.targetLegs || []
    const shadowCenter = shadowRow.centerLegs || []
    const targetExact = chainKeys(shadowTarget).join('|') === targetChain.map(body => `${body.projectSelectedRecord.segmentIdentity}#${body.projectSelectedRecord.recordIndex}`).join('|')
    const centerExact = chainKeys(shadowCenter).join('|') === centerChain.map(body => `${body.projectSelectedRecord.segmentIdentity}#${body.projectSelectedRecord.recordIndex}`).join('|')
    if (targetExact) counts.targetChainExact++
    else counts.targetChainMismatch++
    if (centerExact) counts.centerChainExact++
    else counts.centerChainMismatch++
    if (!targetExact || !centerExact) { counts.routeInvariantViolations++; if (mismatches.length < 20) mismatches.push({ sampleId: sourceRow.sampleId, targetExpected: targetChain.map(body => body.projectSelectedRecord.segmentIdentity), targetActual: shadowTarget.map(leg => leg.segmentIdentity), centerExpected: centerChain.map(body => body.projectSelectedRecord.segmentIdentity), centerActual: shadowCenter.map(leg => leg.segmentIdentity) }) }
    for (const [body, leg] of [...targetChain.map((body, index) => [body, shadowTarget[index]]), ...centerChain.map((body, index) => [body, shadowCenter[index]])]) {
      if (!leg) continue
      const startEt = Number(body.projectSelectedRecord.recordStartEt)
      const endEt = Number(body.projectSelectedRecord.recordEndEt)
      if (leg.recordBits?.[0] !== bitsFromNumber((startEt + endEt) / 2) || leg.recordBits?.[1] !== bitsFromNumber((endEt - startEt) / 2)) counts.subintervalMismatch++
      if (leg.recordIndex !== body.projectSelectedRecord.recordIndex || leg.segmentIdentity !== body.projectSelectedRecord.segmentIdentity) counts.recordIdentityMismatch++
    }
    const baselineMatchesReference = equal(shadowRow.baselinePairStateBits, projectBaselineRow.projectStateBits)
    if (baselineMatchesReference) counts.baselineFinalExactProbe++
    else counts.baselineFinalMismatchProbe++
    const changed = !equal(shadowRow.baselinePairStateBits, shadowRow.candidatePairStateBits)
    if (changed) counts.candidateChanged++
  }
  const remainingProbe = await probe.next(); const remainingShadow = await shadow.next(); const remainingProjectBaseline = await projectBaseline.next()
  if (!remainingProbe.done || !remainingShadow.done || !remainingProjectBaseline.done) throw new Error('probe, shadow, or project baseline output has extra rows')
  const summary = { schemaVersion: 1, recordType: 'de405_project_route_shadow_fidelity', sourceCorpus: { path: 'artifacts/de405-jpl-cspice-residual-sweep.samples.jsonl', rowCount: sourceRows.length }, baselineIdentity: 'project_owned_type2_chbint_recurrence_v1', shadowIdentity: 'de405_type2_experimental_shadow_shared_route_v1', counts, routeInvariant: { targetChainMismatches: counts.targetChainMismatch, centerChainMismatches: counts.centerChainMismatch, recordIdentityMismatches: counts.recordIdentityMismatch, subintervalMismatches: counts.subintervalMismatch, violations: counts.routeInvariantViolations }, firstMismatches: mismatches, claims: { baselineFinalComparedToProjectProbe: true, cspiceReferenceUsedOnlyForCandidateResolutionProjection: true, productionContractsChanged: false } }
  await writeFile(outputPath, JSON.stringify(summary, null, 2) + '\n')
  console.log(JSON.stringify({ output: outputPath, counts, routeInvariant: summary.routeInvariant }, null, 2))
} finally { await rm(temp, { recursive: true, force: true }) }

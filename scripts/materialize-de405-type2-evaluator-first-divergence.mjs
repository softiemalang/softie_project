import { execFileSync } from 'node:child_process'
import { mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { compareTraces, fileIdentity, INPUTS, RAW, readRows, sourceContract } from './lib/de405-type2-evaluator-first-divergence.mjs'

const root = resolve(new URL('..', import.meta.url).pathname)
const output = process.argv.includes('--output') ? process.argv[process.argv.indexOf('--output') + 1] : RAW
const outputPath = resolve(root, output)
const replace = process.argv.includes('--replace')
try { await stat(outputPath); if (!replace) throw new Error(`output exists: ${output}`) } catch (error) { if (error.message === `output exists: ${output}`) throw error; if (error.code !== 'ENOENT') throw error }

const sourceRows = await readRows(INPUTS.existingEvaluation)
if (sourceRows.length !== 154 || new Set(sourceRows.map(row => row.sampleId)).size !== 154 || sourceRows.some((row, index) => index > 0 && sourceRows[index - 1].sampleId.localeCompare(row.sampleId) > 0)) throw new Error('existing Type-2 source is not exactly 154 sorted unique samples')
const selected = sourceRows.map(row => row.selectedCandidate)
if (selected.some(candidate => candidate.status !== 'computed' || !candidate.recordPayloadComparison?.exact || candidate.officialEvaluation?.status !== 'computed')) throw new Error('existing Type-2 source has an invalid selected candidate')
if (!selected.every(candidate => candidate.officialEvaluation?.status === 'computed' && candidate.recordPayloadComparison?.status === 'record_payload_exact_match' && candidate.officialVsHighLevel?.allComponentsBitwiseEqual && !candidate.projectVsOfficial?.allComponentsBitwiseEqual)) throw new Error('154 cohort prerequisite failed')
const withinOne = sourceRows.filter(row => row.selectedCandidate.projectVsOfficial.componentUlpDistances.every(value => value <= 1)).length
const overOne = sourceRows.length - withinOne
if (withinOne !== 82 || overOne !== 72) throw new Error(`unexpected P0/O0 distribution: ${withinOne}/${overOne}`)

const buildScript = resolve(root, 'tools/de405-type2-evaluator-trace-probe/build.mjs')
execFileSync('node', [buildScript], { cwd: root, stdio: 'inherit', env: { ...process.env, CSPICE_DIR: process.env.CSPICE_DIR || INPUTS.cspiceRoot } })
const build = JSON.parse(await readFile(resolve(root, INPUTS.traceBuildIdentity), 'utf8'))
const temp = await mkdtemp(`${tmpdir()}/de405-type2-evaluator-trace.`)
try {
  const input = resolve(temp, 'input.jsonl'), nativeOutput = resolve(temp, 'trace.jsonl')
  const requests = sourceRows.map(row => {
    const candidate = row.selectedCandidate
    const recordBits = candidate.officialRecordIdentity.officialRecordBits
    if (JSON.stringify(recordBits) !== JSON.stringify(candidate.projectRecordIdentity.coefficientBits)) throw new Error(`input record payload mismatch: ${row.sampleId}`)
    return { sampleId: row.sampleId, queryEtBits: row.queryEtBits, recordCount: recordBits.length, recordBits }
  })
  await writeFile(input, requests.map(request => JSON.stringify(request)).join('\n') + '\n')
  execFileSync(resolve(root, INPUTS.traceBinary), ['--evaluate-batch', '--input-jsonl', input, '--output-jsonl', nativeOutput], { cwd: root, stdio: 'inherit' })
  const traceRows = await readRows(nativeOutput), traceMap = new Map(traceRows.map(row => [row.sampleId, row]))
  if (traceRows.length !== 154 || traceMap.size !== 154) throw new Error(`trace output is not exactly 154 unique samples: ${traceRows.length}`)
  const existingIdentity = await fileIdentity(INPUTS.existingEvaluation)
  const neighborhoodIdentity = await fileIdentity(INPUTS.neighborhood)
  const centerLegIdentity = await fileIdentity(INPUTS.centerLeg)
  const referenceIdentity = await fileIdentity(INPUTS.cspiceReference)
  const kernelIdentity = await fileIdentity(INPUTS.kernel)
  const officialSpke02 = await fileIdentity(INPUTS.officialSpke02)
  const officialChbint = await fileIdentity(INPUTS.officialChbint)
  const officialHeader = await fileIdentity(INPUTS.officialHeader)
  const officialLibrary = await fileIdentity(INPUTS.officialLibrary)
  const supportLibrary = await fileIdentity(INPUTS.supportLibrary)
  const projectSource = await fileIdentity(INPUTS.projectSource)
  const projectBuild = await fileIdentity(INPUTS.projectBuild)
  const tracePatcher = await fileIdentity(INPUTS.tracePatcher)
  const traceBuild = await fileIdentity(INPUTS.traceBuild)
  const records = sourceRows.map(row => {
    const candidate = row.selectedCandidate, trace = traceMap.get(row.sampleId)
    if (!trace || trace.queryEtBits !== row.queryEtBits) throw new Error(`missing or mismatched trace input: ${row.sampleId}`)
    const officialExpected = candidate.officialEvaluation.bits, projectExpected = candidate.projectEvaluation.bits
    const officialLinkedParity = JSON.stringify(trace.linkedOfficialStateBits) === JSON.stringify(officialExpected)
    const instrumentedParity = JSON.stringify(trace.instrumentedOfficialStateBits) === JSON.stringify(trace.linkedOfficialStateBits)
    const projectParity = JSON.stringify(trace.projectStateBits) === JSON.stringify(projectExpected)
    if (!officialLinkedParity || !instrumentedParity || !projectParity) throw new Error(`trace final parity failed: ${row.sampleId}`)
    const stage = compareTraces(trace.officialTrace, trace.projectTrace, trace.linkedOfficialStateBits, trace.instrumentedOfficialStateBits, trace.projectStateBits, projectExpected)
    return {
      schemaVersion: 1,
      recordType: 'de405_type2_evaluator_first_divergence_evidence',
      sampleId: row.sampleId,
      group: row.group,
      target: row.target,
      center: row.center,
      epochKind: row.epochKind,
      queryEtBits: row.queryEtBits,
      sourceOfficialEvaluationIdentity: existingIdentity,
      sourceRecordNeighborhoodIdentity: row.sourceRecordNeighborhoodIdentity,
      sourceCenterLegIdentity: row.sourceCenterLegIdentity,
      segmentIdentity: { value: row.segmentIdentity, selectedRecord: row.selectedRecordIdentity },
      recordIdentity: { project: candidate.projectRecordIdentity, official: candidate.officialRecordIdentity },
      recordPayloadIdentity: { projectBitsSha256: candidate.projectRecordIdentity.projectRecordBitsSha256, officialBitsSha256: candidate.officialRecordIdentity.officialRecordBitsSha256, projectPayloadSha256: candidate.projectRecordIdentity.projectRecordPayloadSha256, officialPayloadSha256: candidate.officialRecordIdentity.officialRecordPayloadSha256, exact: candidate.recordPayloadComparison.exact, count: candidate.recordPayloadIdentity?.officialRecordDoubleCount || candidate.officialRecordIdentity.officialRecordDoubleCount },
      queryEtIdentity: { bits: row.queryEtBits, officialInputBits: trace.queryEtBits, exact: row.queryEtBits === trace.queryEtBits },
      coefficientLayoutIdentity: trace.officialTrace.components.map(component => ({ start: component.coefficientStart, count: component.coefficientCount, fingerprintFNV1a64: component.coefficientFingerprintFNV1a64, firstCoefficientBits: component.firstCoefficientBits, lastCoefficientBits: component.lastCoefficientBits })),
      linkedOfficialEvaluatorIdentity: { routine: 'spke02_', source: officialSpke02, header: officialHeader, library: officialLibrary, supportLibrary, toolkitVersion: 'N0067' },
      instrumentedOfficialEvaluatorIdentity: { routine: 'de405_spke02_trace_', source: { spke02: build.sourceIdentity.instrumentedPaths.spke02, chbint: build.sourceIdentity.instrumentedPaths.chbint }, finalParityContract: 'instrumented official final state must equal linked official state bitwise' },
      projectEvaluatorIdentity: { routine: 'project_owned_type2_chbint_recurrence_v1', source: projectSource, buildScript: projectBuild },
      instrumentationIdentity: { patcher: tracePatcher, buildScript: traceBuild, build },
      instrumentedOfficialVsLinkedOfficial: { componentBits: trace.linkedOfficialStateBits.map((value, index) => value === trace.instrumentedOfficialStateBits[index]), allComponentsBitwiseEqual: instrumentedParity },
      projectTraceVsExistingProject: { componentBits: trace.projectStateBits.map((value, index) => value === projectExpected[index]), allComponentsBitwiseEqual: projectParity },
      officialTrace: trace.officialTrace,
      projectTrace: trace.projectTrace,
      stageComparisons: stage.componentComparisons,
      componentComparisons: stage.componentComparisons,
      linkedOfficialStateBits: trace.linkedOfficialStateBits,
      instrumentedOfficialStateBits: trace.instrumentedOfficialStateBits,
      projectTraceStateBits: trace.projectStateBits,
      existingProjectStateBits: projectExpected,
      existingProjectVsOfficial: candidate.projectVsOfficial,
      firstDivergentStage: stage.firstDivergentStage,
      firstDivergentSubstage: stage.firstDivergentSubstage,
      firstDivergentComponent: stage.firstDivergentComponent,
      firstDivergentOperationOrdinal: stage.firstDivergentOperationOrdinal,
      primaryClassification: stage.primaryClassification,
      positionDivergence: stage.positionDivergence,
      velocityDivergence: stage.velocityDivergence,
      sourceContractComparison: sourceContract,
      supportingFindings: ['The linked and instrumented official final state is bitwise identical.', 'The project trace final state reproduces the existing project evaluator output bitwise.', 'Both traces consume the same record payload and query ET Binary64 bits.'],
      evidenceLevel: 'confirmed',
      notComputableReasons: ['This diagnostic does not observe high-level CSPICE selected segment, selected record, route, or accumulator order.', 'The trace captures only operations exposed by the parity-validated temporary source instrumentation.'],
      contractState: { selectionUnresolved: 1701, toleranceChanged: false, canonicalSelectionChanged: false, activeTransition: false, scientificApproval: false, productionIntegration: false }
    }
  })
  await writeFile(outputPath, records.map(record => JSON.stringify(record)).join('\n') + '\n')
  console.log(JSON.stringify({ recordCount: records.length, output }, null, 2))
} finally { await rm(temp, { recursive: true, force: true }) }

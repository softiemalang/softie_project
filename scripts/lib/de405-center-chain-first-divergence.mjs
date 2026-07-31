import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { createReadStream } from 'node:fs'
import { readFile, stat, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { createInterface } from 'node:readline'
import { buildPairBatch, currentSourceIdentities, runPairReference } from './de405-center-chain-pair-reference.mjs'

export const ROOT = resolve(new URL('../..', import.meta.url).pathname)
export const RAW = 'artifacts/de405-center-chain-first-divergence-evidence.jsonl'
export const SUMMARY = 'docs/de405-center-chain-first-divergence-analysis.json'
export const MARKDOWN = 'docs/de405-center-chain-first-divergence-analysis.md'
export const INPUTS = {
  centerChainRaw: 'artifacts/de405-spk-center-chain-decomposition.jsonl',
  centerChainSummary: 'docs/de405-spk-center-chain-decomposition.json',
  centerChainSource: 'scripts/lib/de405-spk-center-chain-decomposition.mjs',
  nativeHelperSource: 'tools/de405-binary64-composition-probe/src/de405_binary64_composition_probe.c',
  nativeHelperBinary: 'tools/de405-binary64-composition-probe/build/de405-binary64-composition-probe',
  nativeHelperBuild: 'tools/de405-binary64-composition-probe/build/runner-build.json'
}
export const CENTER_INPUTS = {
  centerChainRaw: INPUTS.centerChainRaw,
  centerChainSummary: INPUTS.centerChainSummary,
  centerChainSource: INPUTS.centerChainSource
}
export const NATIVE_INPUTS = {
  nativeHelperSource: INPUTS.nativeHelperSource,
  nativeHelperBinary: INPUTS.nativeHelperBinary,
  nativeHelperBuild: INPUTS.nativeHelperBuild
}
export const COMPONENT_NAMES = ['positionX', 'positionY', 'positionZ', 'velocityX', 'velocityY', 'velocityZ']
export const CENTER_STAGE = 'center_chain_diverges'

const sha256 = value => createHash('sha256').update(value).digest('hex')
export const canon = value => JSON.stringify(value, null, 2) + '\n'
const rawCanonical = value => JSON.stringify(value)
const bits = value => {
  const view = new DataView(new ArrayBuffer(8))
  view.setFloat64(0, value, false)
  return `0x${view.getBigUint64(0, false).toString(16).padStart(16, '0')}`
}
const stateBits = state => state.map(bits)
const stateEqualBits = (a, b) => Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((value, index) => value === b[index])
const stateValues = leg => [...leg.legPosition, ...leg.legVelocity]
const identity = async path => {
  const content = await readFile(resolve(ROOT, path))
  const info = await stat(resolve(ROOT, path))
  return { path, sizeBytes: info.size, sha256: sha256(content) }
}
const readJsonl = async path => {
  const rows = []
  const input = createInterface({ input: createReadStream(resolve(ROOT, path)), crlfDelay: Infinity })
  for await (const line of input) if (line.trim()) rows.push(JSON.parse(line))
  return rows
}
const countBy = values => {
  const counts = {}
  for (const value of values) counts[String(value)] = (counts[String(value)] || 0) + 1
  return Object.fromEntries(Object.entries(counts).sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true })))
}
const add = (a, b) => a.map((value, index) => value + b[index])

function orderedBits(value) {
  const raw = BigInt(bits(value))
  return raw >> 63n ? ~raw + 1n : raw | 0x8000000000000000n
}

function ulpDistance(a, b) {
  const distance = orderedBits(a) > orderedBits(b) ? orderedBits(a) - orderedBits(b) : orderedBits(b) - orderedBits(a)
  return distance <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(distance) : distance.toString()
}

function compareStates(left, right, leftLabel = 'project', rightLabel = 'cspice') {
  const leftBits = stateBits(left)
  const rightBits = stateBits(right)
  const differences = leftBits.map((value, index) => value !== rightBits[index])
  const first = differences.findIndex(Boolean)
  const signedZeroEqual = left.every((value, index) => !(Object.is(value, 0) && Object.is(right[index], 0)) || leftBits[index] === rightBits[index])
  return {
    [`${leftLabel}StateValues`]: left,
    [`${leftLabel}StateBits`]: leftBits,
    [`${rightLabel}StateValues`]: right,
    [`${rightLabel}StateBits`]: rightBits,
    allComponentsBitwiseEqual: first === -1,
    positionBitwiseEqual: differences.slice(0, 3).every(value => !value),
    velocityBitwiseEqual: differences.slice(3).every(value => !value),
    signedZeroEqual,
    firstDifferentComponentIndex: first === -1 ? null : first,
    firstDifferentComponentName: first === -1 ? null : COMPONENT_NAMES[first],
    firstDifferentProjectBits: first === -1 ? null : leftBits[first],
    firstDifferentCspiceBits: first === -1 ? null : rightBits[first],
    firstDifferentUlpDistance: first === -1 ? null : ulpDistance(left[first], right[first]),
    componentUlpDistances: left.map((value, index) => ulpDistance(value, right[index])),
    numericResiduals: left.map((value, index) => value - right[index])
  }
}

function validateSourceCohort(rows) {
  if (rows.length !== 1701 || new Set(rows.map(row => row.sampleId)).size !== 1701) throw new Error('center-chain source coverage is not exactly 1,701 unique samples')
  const cohort = rows.filter(row => row.primaryDivergenceStage === CENTER_STAGE).sort((a, b) => a.sampleId.localeCompare(b.sampleId))
  if (cohort.length !== 243 || new Set(cohort.map(row => row.sampleId)).size !== 243) throw new Error('center-chain first-divergence cohort is not exactly 243 unique samples')
  for (const row of cohort) {
    if (!stateEqualBits(row.projectTargetToSsbBits, row.cspiceTargetToSsbBits)) throw new Error(`target component equality prerequisite failed: ${row.sampleId}`)
    if (stateEqualBits(row.projectCenterToSsbBits, row.cspiceCenterToSsbBits)) throw new Error(`center component inequality prerequisite failed: ${row.sampleId}`)
    if (!Array.isArray(row.centerChainLegs) || row.centerChainLegs.length !== 2) throw new Error(`center chain length failed: ${row.sampleId}`)
    const [leg0, leg1] = row.centerChainLegs
    if (leg0.legOrdinal !== 0 || leg1.legOrdinal !== 1 || leg0.body !== row.center || leg0.parentBody !== leg1.body || leg1.parentBody !== 0) throw new Error(`center chain graph failed: ${row.sampleId}`)
    if (!Array.isArray(leg0.legPositionBits) || !Array.isArray(leg0.legVelocityBits) || !Array.isArray(leg1.legPositionBits) || !Array.isArray(leg1.legVelocityBits)) throw new Error(`project leg bits missing: ${row.sampleId}`)
  }
  return cohort
}

async function projectSourceIdentities() {
  return Object.fromEntries(await Promise.all(Object.entries(CENTER_INPUTS).map(async ([key, path]) => [key, await identity(path)])))
}

async function nativeSourceIdentities() {
  return Object.fromEntries(await Promise.all(Object.entries(NATIVE_INPUTS).map(async ([key, path]) => [key, await identity(path)])))
}

function addCommands(plans) {
  const commands = []
  for (const plan of plans) {
    for (const [compositionKind, composition] of [['projectLegComposition', plan.project], ['cspicePairLegComposition', plan.cspice]]) {
      composition.values = add(composition.left, composition.right)
      composition.bits = stateBits(composition.values)
      for (let index = 0; index < 6; index++) {
        const operationId = `${plan.sample.sampleId}:${compositionKind}:${index}`
        composition.operations.push({ operationId, sampleId: plan.sample.sampleId, compositionKind, componentIndex: index, leftOperandBits: bits(composition.left[index]), rightOperandBits: bits(composition.right[index]), jsResultBits: composition.bits[index] })
        commands.push(`${operationId} add ${bits(composition.left[index])} ${bits(composition.right[index])}`)
      }
    }
  }
  return commands
}

function runNative(commands) {
  const output = execFileSync(resolve(ROOT, INPUTS.nativeHelperBinary), [], { cwd: ROOT, input: commands.join('\n') + '\n', encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 })
  const results = new Map(output.trim().split('\n').filter(Boolean).map(line => {
    const [operationId, resultBits] = line.trim().split(/\s+/)
    return [operationId, resultBits]
  }))
  let mismatchCount = 0
  let failureCount = 0
  for (const command of commands) {
    const operationId = command.split(' ', 1)[0]
    if (!results.has(operationId)) failureCount++
  }
  return { results, expectedOperationCount: commands.length, nativeInputCount: commands.length, nativeOutputCount: results.size, executedOperationCount: results.size, mismatchCount, failureCount, jsFallback: false }
}

function pairState(reference, label) {
  if (!reference || !reference.responseState || !reference.responseBits) throw new Error(`missing CSPICE pair state: ${label}`)
  return reference.responseState
}

function legRecord(leg, reference, label) {
  const project = stateValues(leg)
  const cspice = pairState(reference, label)
  return {
    legOrdinal: leg.legOrdinal,
    childBody: leg.body,
    parentBody: leg.parentBody,
    orientation: 'child_body_relative_to_parent_body',
    operationSign: 1,
    projectSegmentIdentity: leg.segmentIdentity,
    projectSegmentType: leg.segmentType,
    projectRecordIdentity: { recordIndex: leg.recordIndex, recordStartEt: leg.recordStartEt, recordEndEt: leg.recordEndEt },
    segmentIdentity: leg.segmentIdentity,
    segmentType: leg.segmentType,
    recordIndex: leg.recordIndex,
    recordPayloadHash: leg.recordPayloadHash,
    normalizedTimeBits: leg.normalizedTimeBits,
    projectLegState: { values: project, bits: stateBits(project) },
    cspiceRequestEnvelope: reference.requestEnvelope,
    cspicePairState: { values: cspice, bits: reference.responseBits, repeatCount: reference.repeatCount, stable: reference.stable },
    bitwiseComparison: compareStates(project, cspice),
    firstDifferentComponent: compareStates(project, cspice).firstDifferentComponentName
  }
}

function shape(leg0, leg1, unavailable = false) {
  if (unavailable) return 'pair_reference_unavailable'
  if (leg0.bitwiseComparison.allComponentsBitwiseEqual && leg1.bitwiseComparison.allComponentsBitwiseEqual) return 'neither_leg_differs'
  if (!leg0.bitwiseComparison.allComponentsBitwiseEqual && leg1.bitwiseComparison.allComponentsBitwiseEqual) return 'leg0_only_differs'
  if (leg0.bitwiseComparison.allComponentsBitwiseEqual && !leg1.bitwiseComparison.allComponentsBitwiseEqual) return 'leg1_only_differs'
  return 'both_legs_differ'
}

function firstDivergentLeg(leg0, leg1) {
  if (!leg0.bitwiseComparison.allComponentsBitwiseEqual) return { ordinal: 0, child: leg0.childBody, parent: leg0.parentBody, comparison: leg0.bitwiseComparison }
  if (!leg1.bitwiseComparison.allComponentsBitwiseEqual) return { ordinal: 1, child: leg1.childBody, parent: leg1.parentBody, comparison: leg1.bitwiseComparison }
  return null
}

function classification({ leg0, leg1, c1c3, c2c4, c1c2, c3c4 }) {
  const l0 = !leg0.bitwiseComparison.allComponentsBitwiseEqual
  const l1 = !leg1.bitwiseComparison.allComponentsBitwiseEqual
  if (c1c3.allComponentsBitwiseEqual && c2c4.allComponentsBitwiseEqual && c1c2.allComponentsBitwiseEqual && !c3c4.allComponentsBitwiseEqual) {
    return { primary: 'both_legs_match_but_aggregate_difference_is_not_leg_localized', evidenceLevel: 'confirmed' }
  }
  if (c1c3.allComponentsBitwiseEqual && c2c4.allComponentsBitwiseEqual && !c1c2.allComponentsBitwiseEqual) {
    if (l0 && !l1) return { primary: 'leg0_difference_explains_center_residual', evidenceLevel: 'confirmed' }
    if (!l0 && l1) return { primary: 'leg1_difference_explains_center_residual', evidenceLevel: 'confirmed' }
    if (l0 && l1) return { primary: 'both_leg_differences_explain_center_residual', evidenceLevel: 'confirmed' }
  }
  if ((l0 || l1) && !c2c4.allComponentsBitwiseEqual) return { primary: 'leg_differences_present_but_pair_composition_not_direct', evidenceLevel: 'confirmed' }
  if (!l0 && !l1 && !c1c3.allComponentsBitwiseEqual) return { primary: 'both_legs_match_but_project_aggregate_differs', evidenceLevel: 'confirmed' }
  if (!c1c2.allComponentsBitwiseEqual && !c3c4.allComponentsBitwiseEqual) return { primary: 'pair_and_project_aggregates_differ_without_leg_localization', evidenceLevel: 'confirmed' }
  return { primary: 'unresolved', evidenceLevel: 'unresolved' }
}

function composition(values, bitsValue, cspiceValue, operationStats) {
  return { values, bits: bitsValue, cspiceComparison: compareStates(values, cspiceValue, 'composition', 'reference'), operations: operationStats }
}

function makePlan(sample, references) {
  const [projectLeg0, projectLeg1] = sample.centerChainLegs
  const leg0Reference = references.get(`${sample.sampleId}:leg0`)
  const leg1Reference = references.get(`${sample.sampleId}:leg1`)
  const centerReference = references.get(`${sample.sampleId}:center-to-ssb`)
  const leg0 = legRecord(projectLeg0, leg0Reference, `${sample.sampleId}:leg0`)
  const leg1 = legRecord(projectLeg1, leg1Reference, `${sample.sampleId}:leg1`)
  const cspiceCenter = pairState(centerReference, `${sample.sampleId}:center-to-ssb`)
  const plan = {
    sample,
    leg0,
    leg1,
    project: { left: stateValues(projectLeg0), right: stateValues(projectLeg1), values: null, bits: null, operations: [] },
    cspice: { left: leg0.cspicePairState.values, right: leg1.cspicePairState.values, values: null, bits: null, operations: [] },
    cspiceCenter,
    centerReference,
    projectCenter: sample.projectCenterToSsb
  }
  return plan
}

function recordFromPlan(plan, native) {
  const { sample, leg0, leg1 } = plan
  const first = firstDivergentLeg(leg0, leg1)
  const c1 = plan.project.values
  const c2 = plan.cspice.values
  const c3 = plan.projectCenter
  const c4 = plan.cspiceCenter
  const c1c3 = compareStates(c1, c3, 'projectLegComposition', 'existingProjectCenterToSsb')
  const c2c4 = compareStates(c2, c4, 'cspicePairLegComposition', 'cspiceCenterToSsbDirect')
  const c1c2 = compareStates(c1, c2, 'projectLegComposition', 'cspicePairLegComposition')
  const c3c4 = compareStates(c3, c4, 'existingProjectCenterToSsb', 'cspiceCenterToSsbDirect')
  const classificationResult = classification({ leg0, leg1, c1c3, c2c4, c1c2, c3c4 })
  const nativeOperations = [...plan.project.operations, ...plan.cspice.operations].map(operation => {
    const nativeBits = native.results.get(operation.operationId) || null
    const equal = nativeBits === operation.jsResultBits
    if (!equal) native.mismatchCount++
    return { ...operation, nativeResultBits: nativeBits, bitwiseEqual: equal }
  })
  const projectOperations = nativeOperations.filter(operation => operation.compositionKind === 'projectLegComposition')
  const cspiceOperations = nativeOperations.filter(operation => operation.compositionKind === 'cspicePairLegComposition')
  return {
    schemaVersion: 1,
    recordType: 'de405_center_chain_first_divergence',
    sampleId: sample.sampleId,
    group: sample.group,
    target: sample.target,
    center: sample.center,
    epochKind: sample.epochKind,
    queryEtBits: sample.queryEtBits,
    sourceCenterChainIdentity: plan.sourceCenterChainIdentity,
    sourceReferenceAuditIdentity: plan.sourceReferenceAuditIdentity,
    nativeHelperIdentity: plan.nativeHelperIdentity,
    chain: { centerBody: sample.center, intermediateParent: sample.centerChainLegs[0].parentBody, ssbBody: 0, centerChainLength: 2, leg0, leg1 },
    projectLegComposition: composition(c1, stateBits(c1), c2, projectOperations),
    cspicePairLegComposition: composition(c2, stateBits(c2), c2, cspiceOperations),
    existingProjectCenterToSsb: { values: c3, bits: stateBits(c3) },
    cspiceCenterToSsbDirect: { values: c4, bits: stateBits(c4), requestEnvelope: plan.centerReference.requestEnvelope, repeatCount: plan.centerReference.repeatCount, stable: plan.centerReference.stable },
    compositionComparisons: { c1VsC3: c1c3, c2VsC4: c2c4, c1VsC2: c1c2, c3VsC4: c3c4 },
    jsNativeParity: { expectedOperationCount: nativeOperations.length, nativeInputCount: nativeOperations.length, nativeOutputCount: nativeOperations.filter(operation => operation.nativeResultBits !== null).length, executedOperationCount: nativeOperations.filter(operation => operation.nativeResultBits !== null).length, parityMatchCount: nativeOperations.filter(operation => operation.bitwiseEqual).length, parityMismatchCount: nativeOperations.filter(operation => !operation.bitwiseEqual).length, nativeFailureCount: nativeOperations.filter(operation => operation.nativeResultBits === null).length, jsFallback: native.jsFallback },
    firstDivergentLegOrdinal: first?.ordinal ?? null,
    firstDivergentLegChild: first?.child ?? null,
    firstDivergentLegParent: first?.parent ?? null,
    firstDivergentComponent: first?.comparison.firstDifferentComponentName ?? null,
    firstDivergentProjectBits: first?.comparison.firstDifferentProjectBits ?? null,
    firstDivergentCspiceBits: first?.comparison.firstDifferentCspiceBits ?? null,
    firstDivergentUlpDistance: first?.comparison.firstDifferentUlpDistance ?? null,
    legDifferenceShape: shape(leg0, leg1),
    primaryClassification: classificationResult.primary,
    supportingFindings: [
      'Leg states are compared as project-owned values versus CSPICE spkez_c pair-state API values.',
      'The fixed composition comparison uses leg 0 + leg 1 in source order.',
      'No CSPICE internal route, selected segment, selected record, or accumulator order is asserted.'
    ],
    evidenceLevel: classificationResult.evidenceLevel,
    notComputableReasons: ['CSPICE internal route, selected segment, selected record, and accumulator order are not exposed by the API.']
  }
}

async function materializeNativeAndRecords(cohort, pair) {
  const plans = cohort.map(sample => makePlan(sample, pair.references))
  const commands = addCommands(plans)
  const native = runNative(commands)
  const nativeIdentity = await nativeSourceIdentities()
  const centerIdentity = await projectSourceIdentities()
  for (const plan of plans) {
    plan.sourceCenterChainIdentity = centerIdentity
    plan.sourceReferenceAuditIdentity = { sourceIdentities: pair.sourceIdentities, pairQueryBatch: pair.pairQueryBatch, pairOutputBatch: pair.pairOutputBatch, requestEnvelope: pair.requestEnvelopeIdentity, responseBits: pair.responseBitIdentity }
    plan.nativeHelperIdentity = nativeIdentity
  }
  const records = plans.map(plan => recordFromPlan(plan, native))
  if (native.failureCount !== 0 || native.mismatchCount !== 0 || native.nativeOutputCount !== native.expectedOperationCount) throw new Error('binary64 native parity prerequisite failed')
  return { records, native }
}

export async function materialize({ output = RAW } = {}) {
  const absoluteOutput = resolve(ROOT, output)
  try { await stat(absoluteOutput); throw new Error(`output exists: ${output}`) } catch (error) { if (error.message === `output exists: ${output}`) throw error; if (error.code !== 'ENOENT') throw error }
  const sourceRows = await readJsonl(INPUTS.centerChainRaw)
  const cohort = validateSourceCohort(sourceRows)
  const pair = await runPairReference(cohort)
  if (pair.unavailableCount !== 0 || pair.findings.length !== 0) throw new Error(`CSPICE pair reference validation failed: ${pair.findings.join(',')}`)
  const { records, native } = await materializeNativeAndRecords(cohort, pair)
  await writeFile(absoluteOutput, records.map(rawCanonical).join('\n') + '\n')
  return { sampleCount: records.length, output: absoluteOutput, pairReferenceCount: pair.uniqueQueryCount, pairReferenceUnavailableCount: pair.unavailableCount, native: { expectedOperationCount: native.expectedOperationCount, nativeInputCount: native.nativeInputCount, nativeOutputCount: native.nativeOutputCount, executedOperationCount: native.executedOperationCount, mismatchCount: native.mismatchCount, failureCount: native.failureCount, jsFallback: native.jsFallback } }
}

function validateRawRecords(records) {
  if (records.length !== 243 || new Set(records.map(record => record.sampleId)).size !== 243) throw new Error('raw evidence coverage is not exactly 243 unique samples')
  if (records.some((record, index) => index > 0 && records[index - 1].sampleId.localeCompare(record.sampleId) > 0)) throw new Error('raw evidence is not sampleId sorted')
  for (const record of records) {
    if (record.schemaVersion !== 1 || record.recordType !== 'de405_center_chain_first_divergence') throw new Error(`invalid raw evidence schema: ${record.sampleId}`)
    if (record.chain.centerChainLength !== 2 || record.chain.leg0.childBody !== record.center || record.chain.leg0.parentBody !== record.chain.leg1.childBody || record.chain.leg1.parentBody !== record.chain.ssbBody) throw new Error(`invalid raw chain: ${record.sampleId}`)
    if (record.jsNativeParity.parityMismatchCount !== 0 || record.jsNativeParity.nativeFailureCount !== 0 || record.jsNativeParity.jsFallback !== false) throw new Error(`invalid native parity: ${record.sampleId}`)
  }
}

async function validateFreshSourceIdentities(records, cohort) {
  const currentProject = await projectSourceIdentities()
  const currentPair = await currentSourceIdentities()
  const currentNative = await nativeSourceIdentities()
  const first = records[0]
  if (JSON.stringify(first.sourceCenterChainIdentity) !== JSON.stringify(currentProject)) throw new Error('center-chain source identity is stale')
  if (JSON.stringify(first.sourceReferenceAuditIdentity.sourceIdentities) !== JSON.stringify(currentPair)) throw new Error('CSPICE reference source identity is stale')
  if (JSON.stringify(first.nativeHelperIdentity) !== JSON.stringify(currentNative)) throw new Error('native helper source identity is stale')
  const batch = buildPairBatch(cohort)
  const expectedInput = { path: 'generated:center-chain-pair-query-batch.txt', sizeBytes: Buffer.byteLength(batch.inputText), sha256: sha256(batch.inputText) }
  if (JSON.stringify(first.sourceReferenceAuditIdentity.pairQueryBatch) !== JSON.stringify(expectedInput)) throw new Error('pair query batch identity is stale')
}

function distributions(records) {
  const legs = records.flatMap(record => [record.chain.leg0, record.chain.leg1])
  return {
    firstDifferentComponent: countBy(records.map(record => record.firstDivergentComponent).filter(Boolean)),
    ulpDistance: countBy(records.map(record => record.firstDivergentUlpDistance).filter(value => value !== null)),
    intermediateParent: countBy(records.map(record => record.chain.intermediateParent)),
    center: countBy(records.map(record => record.center)),
    targetCenter: countBy(records.map(record => `${record.target}:${record.center}`)),
    group: countBy(records.map(record => record.group)),
    epochKind: countBy(records.map(record => record.epochKind)),
    segment: countBy(legs.map(leg => leg.segmentIdentity)),
    recordIndex: countBy(legs.map(leg => leg.recordIndex)),
    boundaryProximity: countBy(records.map(record => record.epochKind))
  }
}

export async function analyze({ input = RAW } = {}) {
  const records = await readJsonl(input)
  validateRawRecords(records)
  const sourceRows = await readJsonl(INPUTS.centerChainRaw)
  const cohort = validateSourceCohort(sourceRows)
  const sourceIds = new Set(cohort.map(row => row.sampleId))
  if (records.some(record => !sourceIds.has(record.sampleId))) throw new Error('raw evidence contains a sample outside the source cohort')
  await validateFreshSourceIdentities(records, cohort)
  const rawInfo = await identity(input)
  const leg0 = records.map(record => record.chain.leg0)
  const leg1 = records.map(record => record.chain.leg1)
  const firstCounts = countBy(records.map(record => record.firstDivergentLegOrdinal === null ? 'both_legs_match' : `leg${record.firstDivergentLegOrdinal}_first`))
  const parity = records[0].jsNativeParity
  const result = {
    schemaVersion: 1,
    recordType: 'de405_center_chain_first_divergence_analysis',
    generator: 'scripts/analyze-de405-center-chain-first-divergence.mjs',
    runtimeIdentity: { node: process.version },
    nativeHelperIdentity: await nativeSourceIdentities(),
    cspiceRunnerIdentity: records[0].sourceReferenceAuditIdentity.sourceIdentities.auditRunnerBinary,
    kernelIdentity: records[0].sourceReferenceAuditIdentity.sourceIdentities.kernel,
    sourceIdentities: { centerChain: records[0].sourceCenterChainIdentity, referenceAudit: records[0].sourceReferenceAuditIdentity.sourceIdentities, nativeHelper: await nativeSourceIdentities() },
    rawArtifact: { path: RAW, sizeBytes: rawInfo.sizeBytes, sha256: rawInfo.sha256, recordCount: records.length },
    cohortCount: records.length,
    cohortSelection: { primaryDivergenceStage: CENTER_STAGE, sourceSampleCount: 1701, selectedSamples: 243, targetComponentEqualityCount: records.length, centerComponentInequalityCount: records.length, duplicateCount: 0, extraSampleCount: 0 },
    chainContract: { centerBody: 'sample.center', intermediateParent: 'leg0.parentBody = leg1.childBody', ssbBody: 0, centerChainLength: 2, validGraphCount: records.filter(record => record.chain.centerChainLength === 2).length },
    uniqueLegPairQueryCount: records.length * 2,
    pairReferenceCount: records.reduce((sum, record) => sum + (record.chain.leg0.cspicePairState.stable ? 1 : 0) + (record.chain.leg1.cspicePairState.stable ? 1 : 0) + (record.cspiceCenterToSsbDirect.requestEnvelope ? 1 : 0), 0),
    pairReferenceUnavailableCount: records.filter(record => !record.chain.leg0.cspicePairState.stable || !record.chain.leg1.cspicePairState.stable || !record.cspiceCenterToSsbDirect.stable).length,
    pairReferenceProcessRunCount: 2,
    pairReferenceCallCount: records.length * 3 * 2 * 3,
    pairReferenceBatchIdentity: records[0].sourceReferenceAuditIdentity.pairQueryBatch,
    pairReferenceOutputIdentity: records[0].sourceReferenceAuditIdentity.pairOutputBatch,
    requestEnvelopeIdentity: records[0].sourceReferenceAuditIdentity.requestEnvelope,
    responseBitIdentity: records[0].sourceReferenceAuditIdentity.responseBits,
    leg0Counts: { match: leg0.filter(leg => leg.bitwiseComparison.allComponentsBitwiseEqual).length, different: leg0.filter(leg => !leg.bitwiseComparison.allComponentsBitwiseEqual).length, positionOnly: leg0.filter(leg => !leg.bitwiseComparison.positionBitwiseEqual && leg.bitwiseComparison.velocityBitwiseEqual).length, velocityOnly: leg0.filter(leg => leg.bitwiseComparison.positionBitwiseEqual && !leg.bitwiseComparison.velocityBitwiseEqual).length, positionAndVelocity: leg0.filter(leg => !leg.bitwiseComparison.positionBitwiseEqual && !leg.bitwiseComparison.velocityBitwiseEqual).length },
    leg1Counts: { match: leg1.filter(leg => leg.bitwiseComparison.allComponentsBitwiseEqual).length, different: leg1.filter(leg => !leg.bitwiseComparison.allComponentsBitwiseEqual).length, positionOnly: leg1.filter(leg => !leg.bitwiseComparison.positionBitwiseEqual && leg.bitwiseComparison.velocityBitwiseEqual).length, velocityOnly: leg1.filter(leg => leg.bitwiseComparison.positionBitwiseEqual && !leg.bitwiseComparison.velocityBitwiseEqual).length, positionAndVelocity: leg1.filter(leg => !leg.bitwiseComparison.positionBitwiseEqual && !leg.bitwiseComparison.velocityBitwiseEqual).length },
    firstDivergentLegCounts: firstCounts,
    legDifferenceShapeCounts: countBy(records.map(record => record.legDifferenceShape)),
    compositionCounts: { c1VsC3Equal: records.filter(record => record.compositionComparisons.c1VsC3.allComponentsBitwiseEqual).length, c2VsC4Equal: records.filter(record => record.compositionComparisons.c2VsC4.allComponentsBitwiseEqual).length, c1VsC2Equal: records.filter(record => record.compositionComparisons.c1VsC2.allComponentsBitwiseEqual).length, c3VsC4Different: records.filter(record => !record.compositionComparisons.c3VsC4.allComponentsBitwiseEqual).length, c2NotDirect: records.filter(record => !record.compositionComparisons.c2VsC4.allComponentsBitwiseEqual).length },
    primaryClassificationCounts: countBy(records.map(record => record.primaryClassification)),
    distributions: distributions(records),
    crossAnalysis6061095: { state_equivalent_selection_different: { count: records.filter(record => record.group === 'state_equivalent_selection_different').length, firstDivergentLeg: countBy(records.filter(record => record.group === 'state_equivalent_selection_different').map(record => record.firstDivergentLegOrdinal === null ? 'both_legs_match' : `leg${record.firstDivergentLegOrdinal}_first`)), firstComponent: countBy(records.filter(record => record.group === 'state_equivalent_selection_different').map(record => record.firstDivergentComponent).filter(Boolean)), ulpDirection: countBy(records.filter(record => record.group === 'state_equivalent_selection_different').map(record => record.epochKind)) }, candidate_state_different: { count: records.filter(record => record.group === 'candidate_state_different').length, firstDivergentLeg: countBy(records.filter(record => record.group === 'candidate_state_different').map(record => record.firstDivergentLegOrdinal === null ? 'both_legs_match' : `leg${record.firstDivergentLegOrdinal}_first`)), firstComponent: countBy(records.filter(record => record.group === 'candidate_state_different').map(record => record.firstDivergentComponent).filter(Boolean)), ulpDirection: countBy(records.filter(record => record.group === 'candidate_state_different').map(record => record.epochKind)) } },
    nativeExpectedOperationCount: records.length * 12,
    nativeExecutedOperationCount: records.reduce((sum, record) => sum + record.jsNativeParity.executedOperationCount, 0),
    parityMatchCount: records.reduce((sum, record) => sum + record.jsNativeParity.parityMatchCount, 0),
    parityMismatchCount: records.reduce((sum, record) => sum + record.jsNativeParity.parityMismatchCount, 0),
    nativeFailureCount: records.reduce((sum, record) => sum + record.jsNativeParity.nativeFailureCount, 0),
    jsFallback: parity.jsFallback,
    confirmedFindings: ['The 243-row center-chain cohort has an explicit two-leg project chain.', 'Each leg is compared bitwise with a CSPICE spkez_c pair-state request using the existing J2000/NONE/km contract.', 'The fixed C1 and C2 additions were executed by JavaScript and the existing native IEEE-754 binary64 helper with zero parity mismatches.'],
    strongCorrelations: ['First-divergent-leg, component, boundary, segment, record, and ULP distributions describe the observed cohort only; they do not expose CSPICE internal selection.'],
    candidateExplanations: ['A leg-local difference can explain a center aggregate difference only within the fixed project-leg/CSPICE-pair composition comparison.'],
    notComputableItems: ['CSPICE internal route, selected segment, selected record, and accumulator order are not observable from the used API.'],
    unresolvedItems: ['selection_unresolved remains 1,701; no canonical selection, tolerance, scientific approval, or production integration decision is made.'],
    contractState: { selectionUnresolved: 1701, toleranceChanged: false, canonicalSelectionChanged: false, activeTransition: false, scientificApproval: false, productionIntegration: false }
  }
  return result
}

export const markdown = analysis => [
  '# DE405 Center-Chain First-Divergence Analysis', '',
  '## 조사 목적', '', 'center-chain 최초 관측 가능 분기 단계인 243건에서 project-owned center 2-leg state와 CSPICE pair-state API를 비교했다. CSPICE 내부 route나 selected record는 관측하지 않는다.', '',
  '## 243건 선정 기준', '', `primaryDivergenceStage=${CENTER_STAGE}; cohort=${analysis.cohortCount}; target component equality=${analysis.cohortSelection.targetComponentEqualityCount}; center component inequality=${analysis.cohortSelection.centerComponentInequalityCount}.`, '',
  '## Center 2-leg chain 계약', '', 'leg 0은 center body relative to intermediate parent, leg 1은 intermediate parent relative to SSB이며 source order의 +1 addition만 사용했다.', '',
  '## CSPICE pair-state reference 계약', '', `기존 CSPICE reference audit runner의 spkez_c, J2000(frameId=1), NONE, ET bits, km/km/s 계약을 재사용했다. unique leg pair query=${analysis.uniqueLegPairQueryCount}; reference=${analysis.pairReferenceCount}; unavailable=${analysis.pairReferenceUnavailableCount}.`, '',
  '## Leg 0 비교', '', JSON.stringify(analysis.leg0Counts), '',
  '## Leg 1 비교', '', JSON.stringify(analysis.leg1Counts), '',
  '## 최초 divergent leg', '', JSON.stringify(analysis.firstDivergentLegCounts), '',
  '## Project leg composition', '', `C1 vs C3 equal=${analysis.compositionCounts.c1VsC3Equal}.`, '',
  '## CSPICE pair leg composition', '', `C2 vs C4 equal=${analysis.compositionCounts.c2VsC4Equal}; C2 not direct=${analysis.compositionCounts.c2NotDirect}.`, '',
  '## CSPICE center→SSB direct 비교', '', `C1 vs C2 equal=${analysis.compositionCounts.c1VsC2Equal}; C3 vs C4 different=${analysis.compositionCounts.c3VsC4Different}.`, '',
  '## JS/native parity', '', `expected=${analysis.nativeExpectedOperationCount}; executed=${analysis.nativeExecutedOperationCount}; match=${analysis.parityMatchCount}; mismatch=${analysis.parityMismatchCount}; native failure=${analysis.nativeFailureCount}; JS fallback=${analysis.jsFallback}.`, '',
  '## Intermediate parent별 분포', '', JSON.stringify(analysis.distributions.intermediateParent), '',
  '## Segment/record/boundary 분포', '', `segment=${JSON.stringify(analysis.distributions.segment)}; record=${JSON.stringify(analysis.distributions.recordIndex)}; boundary=${JSON.stringify(analysis.distributions.boundaryProximity)}.`, '',
  '## 606/1095 교차 분석', '', JSON.stringify(analysis.crossAnalysis6061095), '',
  '## 확정 가능한 사항', '', analysis.confirmedFindings.map(value => `- ${value}`).join('\n'), '',
  '## 상관관계와 후보 설명', '', analysis.strongCorrelations.map(value => `- ${value}`).join('\n'), '', analysis.candidateExplanations.map(value => `- ${value}`).join('\n'), '',
  '## 확정할 수 없는 CSPICE 내부 경로', '', analysis.notComputableItems.map(value => `- ${value}`).join('\n'), '',
  '## 다음 단계 진입 조건', '', 'CSPICE 내부 route 또는 selected record를 주장하려면 계산 의미를 바꾸지 않는 instrumented API/build가 별도로 필요하다. 이번 결과만으로 tolerance, canonical selection, active transition, scientific approval, production integration을 변경하지 않는다.', '',
  '## 계약 상태', '', JSON.stringify(analysis.contractState), ''
].join('\n')

export const opts = args => {
  const options = {}
  for (let index = 0; index < args.length; index++) if (args[index].startsWith('--')) options[args[index].slice(2)] = args[index + 1] && !args[index + 1].startsWith('--') ? args[++index] : true
  return options
}

export async function fresh() {
  try {
    const analysis = await analyze()
    const summary = await readFile(resolve(ROOT, SUMMARY), 'utf8')
    const document = await readFile(resolve(ROOT, MARKDOWN), 'utf8')
    return summary === canon(analysis) && document === markdown(analysis) ? { status: 'fresh' } : { status: 'stale' }
  } catch (error) {
    return { status: 'invalid', error: error.message }
  }
}

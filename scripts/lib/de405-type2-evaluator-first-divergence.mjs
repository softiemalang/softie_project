import { createHash } from 'node:crypto'
import { createReadStream } from 'node:fs'
import { readFile, stat } from 'node:fs/promises'
import { resolve } from 'node:path'
import { createInterface } from 'node:readline'

export const ROOT = resolve(new URL('../..', import.meta.url).pathname)
export const RAW = 'artifacts/de405-type2-evaluator-first-divergence-evidence.jsonl'
export const SUMMARY = 'docs/de405-type2-evaluator-first-divergence-analysis.json'
export const MARKDOWN = 'docs/de405-type2-evaluator-first-divergence-analysis.md'
export const INPUTS = Object.freeze({
  existingEvaluation: 'artifacts/de405-center-leg0-cspice-type2-evaluation-evidence.jsonl',
  neighborhood: 'artifacts/de405-center-leg0-record-neighborhood-evidence.jsonl',
  centerLeg: 'artifacts/de405-center-chain-first-divergence-evidence.jsonl',
  cspiceReference: 'docs/de405-cspice-reference-contract-audit.json',
  kernel: '/Users/softie/.local/share/softie-de405/kernels/spk/de405.bsp',
  cspiceRoot: '/Users/softie/.local/share/softie-de405/cspice/N0067',
  officialSpke02: '/Users/softie/.local/share/softie-de405/cspice/N0067/src/cspice/spke02.c',
  officialChbint: '/Users/softie/.local/share/softie-de405/cspice/N0067/src/cspice/chbint.c',
  officialHeader: '/Users/softie/.local/share/softie-de405/cspice/N0067/include/SpiceUsr.h',
  officialLibrary: '/Users/softie/.local/share/softie-de405/cspice/N0067/lib/cspice.a',
  supportLibrary: '/Users/softie/.local/share/softie-de405/cspice/N0067/lib/csupport.a',
  projectSource: 'tools/de405-type2-record-neighborhood/src/de405_type2_record_neighborhood.c',
  projectBuild: 'tools/de405-type2-record-neighborhood/build.mjs',
  tracePatcher: 'tools/de405-type2-evaluator-trace-probe/scripts/instrument-spke02.mjs',
  traceBuild: 'tools/de405-type2-evaluator-trace-probe/build.mjs',
  traceBinary: 'tools/de405-type2-evaluator-trace-probe/build/de405-type2-evaluator-trace-probe',
  traceBuildIdentity: 'tools/de405-type2-evaluator-trace-probe/build/runner-build.json'
})
export const COMPONENTS = ['positionX', 'positionY', 'positionZ', 'velocityX', 'velocityY', 'velocityZ']
export const POSITIONS = ['positionX', 'positionY', 'positionZ']
export const VELOCITIES = ['velocityX', 'velocityY', 'velocityZ']
const readJsonl = async path => { const rows = []; const input = createInterface({ input: createReadStream(resolve(ROOT, path)), crlfDelay: Infinity }); for await (const line of input) if (line.trim()) rows.push(JSON.parse(line)); return rows }
export const readRows = readJsonl
export const sha256 = value => createHash('sha256').update(value).digest('hex')
export const fileIdentity = async path => { const content = await readFile(resolve(ROOT, path)); const info = await stat(resolve(ROOT, path)); return { path, sizeBytes: info.size, sha256: sha256(content) } }
export const serializeCanonicalJson = value => JSON.stringify(value, null, 2) + '\n'
export const bits = value => { const view = new DataView(new ArrayBuffer(8)); view.setFloat64(0, value, false); return `0x${view.getBigUint64(0, false).toString(16).padStart(16, '0')}` }
const ordered = value => { const raw = BigInt(value); return raw >> 63n ? ~raw + 1n : raw | 0x8000000000000000n }
export const ulpDistance = (left, right) => { if (left === right) return 0; const a = ordered(left), b = ordered(right); const distance = a > b ? a - b : b - a; return distance <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(distance) : distance.toString() }
export const compareBits = (left, right) => left === right ? { equal: true, ulpDistance: 0, projectBits: left, officialBits: right } : { equal: false, ulpDistance: ulpDistance(left, right), projectBits: left, officialBits: right }
export const arrayEqual = (left, right) => JSON.stringify(left) === JSON.stringify(right)
const firstMismatch = (left, right, keys) => keys.find(key => left[key] !== right[key]) || null

function componentComparison(official, project, component) {
  const metadata = { midpoint: compareBits(official.recordMetadata.midpointBits, project.recordMetadata.midpointBits), radius: compareBits(official.recordMetadata.radiusBits, project.recordMetadata.radiusBits) }
  const o = official.components[component], p = project.components[component]
  const coefficientLayout = { start: o.coefficientStart === p.coefficientStart, count: o.coefficientCount === p.coefficientCount, fingerprint: compareBits(o.coefficientFingerprintFNV1a64, p.coefficientFingerprintFNV1a64), first: compareBits(o.firstCoefficientBits, p.firstCoefficientBits), last: compareBits(o.lastCoefficientBits, p.lastCoefficientBits) }
  const normalizedTime = { normalized: compareBits(o.normalizedTimeBits, p.normalizedTimeBits), twice: compareBits(o.twiceNormalizedTimeBits, p.twiceNormalizedTimeBits) }
  const operations = []
  const max = Math.max(o.operations.length, p.operations.length)
  for (let index = 0; index < max; index++) {
    const left = o.operations[index], right = p.operations[index]
    if (!left || !right) { operations.push({ ordinal: left?.ordinal ?? right?.ordinal ?? null, equal: false, comparisonLevel: 'stage' }); continue }
    const fields = ['coefficientBits', 'twiceNormalizedTimeBits', 'w0Bits', 'w1Bits', 'w2Bits', 'd0Bits', 'd1Bits', 'd2Bits']
    const differences = fields.filter(key => left[key] !== right[key])
    operations.push({ ordinal: left.ordinal, equal: differences.length === 0, differences, positionRecurrenceEqual: ['w0Bits', 'w1Bits', 'w2Bits'].every(key => left[key] === right[key]), derivativeRecurrenceEqual: ['d0Bits', 'd1Bits', 'd2Bits'].every(key => left[key] === right[key]), official: left, project: right })
  }
  const polynomial = compareBits(o.positionPolynomialBits, p.positionPolynomialBits)
  const derivative = compareBits(o.derivativeBeforeScaleBits, p.derivativeBeforeScaleBits)
  const scaling = { operand: compareBits(o.scaleBits, p.scaleBits), result: compareBits(o.velocityBits, p.velocityBits) }
  let firstDivergence = null
  if (!metadata.midpoint.equal || !metadata.radius.equal) firstDivergence = { stage: 'record_metadata', substage: firstMismatch(metadata, metadata, []) || 'midpoint_or_radius', ordinal: null }
  else if (!normalizedTime.normalized.equal || !normalizedTime.twice.equal) firstDivergence = { stage: 'normalized_time', substage: normalizedTime.normalized.equal ? 'twice_normalized_time' : 'normalized_time', ordinal: null }
  else if (!coefficientLayout.start || !coefficientLayout.count || !coefficientLayout.fingerprint.equal || !coefficientLayout.first.equal || !coefficientLayout.last.equal) firstDivergence = { stage: 'coefficient_layout', substage: 'coefficient_identity', ordinal: null }
  else {
    const op = operations.find(value => !value.equal)
    if (op && !op.positionRecurrenceEqual) firstDivergence = { stage: 'position_polynomial', substage: 'recurrence', ordinal: op.ordinal }
    else if (op && !op.derivativeRecurrenceEqual) firstDivergence = { stage: 'velocity_derivative', substage: 'derivative_recurrence', ordinal: op.ordinal }
    else if (!polynomial.equal) firstDivergence = { stage: 'position_polynomial', substage: 'polynomial_output', ordinal: null }
    else if (!derivative.equal) firstDivergence = { stage: 'velocity_derivative', substage: 'unscaled_derivative_output', ordinal: null }
    else if (!scaling.operand.equal || !scaling.result.equal) firstDivergence = { stage: 'velocity_scaling', substage: scaling.result.equal ? 'scale_operand' : 'scaled_velocity', ordinal: null }
  }
  const commonDivergence = !metadata.midpoint.equal || !metadata.radius.equal ? { stage: 'record_metadata', substage: 'midpoint_or_radius', ordinal: null } : !normalizedTime.normalized.equal || !normalizedTime.twice.equal ? { stage: 'normalized_time', substage: normalizedTime.normalized.equal ? 'twice_normalized_time' : 'normalized_time', ordinal: null } : !coefficientLayout.start || !coefficientLayout.count || !coefficientLayout.fingerprint.equal || !coefficientLayout.first.equal || !coefficientLayout.last.equal ? { stage: 'coefficient_layout', substage: 'coefficient_identity', ordinal: null } : null
  const positionOperation = operations.find(value => !value.positionRecurrenceEqual)
  const velocityOperation = operations.find(value => !value.derivativeRecurrenceEqual)
  const positionFirstDivergence = commonDivergence || (positionOperation ? { stage: 'position_polynomial', substage: 'recurrence', ordinal: positionOperation.ordinal } : !polynomial.equal ? { stage: 'position_polynomial', substage: 'polynomial_output', ordinal: null } : null)
  const velocityFirstDivergence = commonDivergence || (velocityOperation ? { stage: 'velocity_derivative', substage: 'derivative_recurrence', ordinal: velocityOperation.ordinal } : !derivative.equal ? { stage: 'velocity_derivative', substage: 'unscaled_derivative_output', ordinal: null } : !scaling.operand.equal || !scaling.result.equal ? { stage: 'velocity_scaling', substage: scaling.result.equal ? 'scale_operand' : 'scaled_velocity', ordinal: null } : null)
  return { component, metadata, normalizedTime, coefficientLayout, operations, polynomial, derivative, scaling, firstDivergence, positionFirstDivergence, velocityFirstDivergence }
}

export function compareTraces(official, project, linkedBits, instrumentedBits, projectBits, projectExpectedBits) {
  const components = [0, 1, 2].map(index => componentComparison(official, project, index))
  const stateComparison = { officialLinkedVsInstrumented: linkedBits.map((value, index) => compareBits(value, instrumentedBits[index])), projectTraceVsExistingProject: projectBits.map((value, index) => compareBits(value, projectExpectedBits[index])) }
  const divergences = components.map(value => value.firstDivergence).filter(Boolean)
  const order = ['record_metadata', 'normalized_time', 'coefficient_layout', 'position_polynomial', 'velocity_derivative', 'velocity_scaling', 'final_state_assembly']
  divergences.sort((a, b) => order.indexOf(a.stage) - order.indexOf(b.stage) || (a.ordinal ?? 999) - (b.ordinal ?? 999))
  const first = divergences[0] || null
  const position = components.map(value => value.positionFirstDivergence).filter(Boolean).sort((a, b) => order.indexOf(a.stage) - order.indexOf(b.stage) || (a.ordinal ?? 999) - (b.ordinal ?? 999))[0] || null
  const velocity = components.map(value => value.velocityFirstDivergence).filter(Boolean).sort((a, b) => order.indexOf(a.stage) - order.indexOf(b.stage) || (a.ordinal ?? 999) - (b.ordinal ?? 999))[0] || null
  const finalDifferent = linkedBits.some((value, index) => value !== instrumentedBits[index]) || projectBits.some((value, index) => value !== projectExpectedBits[index])
  const primary = first?.stage === 'record_metadata' ? 'record_metadata_interpretation_divergence' : first?.stage === 'normalized_time' ? 'normalized_time_divergence' : first?.stage === 'coefficient_layout' ? 'coefficient_layout_divergence' : first?.stage === 'position_polynomial' ? 'position_recurrence_divergence' : first?.stage === 'velocity_derivative' ? 'velocity_derivative_divergence' : first?.stage === 'velocity_scaling' ? 'velocity_scaling_divergence' : finalDifferent ? 'final_state_assembly_divergence' : 'different_algorithm_same_stage_output_until_final'
  const firstIndex = first ? components.findIndex(value => value.firstDivergence === first) : -1
  const firstComponent = firstIndex < 0 ? null : first.stage === 'velocity_derivative' || first.stage === 'velocity_scaling' ? VELOCITIES[firstIndex] : POSITIONS[firstIndex]
  return { componentComparisons: components, firstDivergentStage: first?.stage || null, firstDivergentSubstage: first?.substage || null, firstDivergentComponent: firstComponent, firstDivergentOperationOrdinal: first?.ordinal ?? null, primaryClassification: primary, stateComparison, positionDivergence: position, velocityDivergence: velocity }
}

export const crossGroup = rows => Object.fromEntries([...new Set(rows.map(row => row.group))].sort().map(group => {
  const subset = rows.filter(row => row.group === group)
  return [group, { count: subset.length, firstDivergentStage: countBy(subset.map(row => row.firstDivergentStage)), firstDivergentComponent: countBy(subset.map(row => row.firstDivergentComponent)), primaryClassification: countBy(subset.map(row => row.primaryClassification)) }]
}))
export const countBy = values => Object.fromEntries(Object.entries(values.reduce((out, value) => { const key = String(value); out[key] = (out[key] || 0) + 1; return out }, {})).sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true })))
export const sourceContract = Object.freeze({ status: 'source_contract_structurally_different', official: { routine: 'spke02_ -> chbint_', normalizedTime: 's=(et-record[1])/record[2]; s2=s*2', recurrence: 'w0=cp[j-1]+(s2*w1-w2); d0=(w1*2 + d1*s2) - d2', derivativeScaling: 'dpdx=(w0+s*dw0-dw1)/record[2]' }, project: { routine: 'project-owned cheby', normalizedTime: 'normalized=(et-midpoint)/radius; twice=2*normalized', recurrence: 'w0=cp[j-1]+(twice*w1-w2); d0=w1*2 + (d1*twice-d2)', derivativeScaling: 'velocity=(w0+normalized*d0-d1)/radius' }, qualification: 'The source structure difference is confirmed from the inspected sources; it is not by itself a causal attribution.' })

function floatFromBits(value) { const view = new DataView(new ArrayBuffer(8)); view.setBigUint64(0, BigInt(value), false); return view.getFloat64(0, false) }
function firstDivergenceCategory(row) { const p = row.positionDivergence, v = row.velocityDivergence; if (!p && !v) return 'neither_diverges'; if (!p) return 'velocity_diverges_first'; if (!v) return 'position_diverges_first'; const order = ['record_metadata', 'normalized_time', 'coefficient_layout', 'position_polynomial', 'velocity_derivative', 'velocity_scaling', 'final_state_assembly']; return order.indexOf(p.stage) <= order.indexOf(v.stage) ? 'position_diverges_first_or_same_stage' : 'velocity_diverges_first' }
function ulpGroup(row) { const distances = row.existingProjectVsOfficial?.componentUlpDistances || []; return distances.length && distances.every(value => value <= 1) ? 'within_one_ulp' : 'over_one_ulp' }
function direction(row) { const comparison = row.existingProjectVsOfficial; if (!comparison) return 'unavailable'; const index = comparison.componentUlpDistances.findIndex(value => value !== 0); if (index < 0) return 'equal'; const project = BigInt(comparison.candidateStateBits[index]), official = BigInt(comparison.referenceStateBits[index]); return ordered(project) < ordered(official) ? 'project_below_official' : 'project_above_official' }
function operationKind(row) { if (!row.firstDivergentSubstage) return 'none'; if (row.firstDivergentSubstage.includes('recurrence')) return row.firstDivergentStage === 'position_polynomial' ? 'position_recurrence' : 'velocity_derivative_recurrence'; if (row.firstDivergentSubstage.includes('scal')) return 'velocity_scaling'; return row.firstDivergentSubstage }
function distribution(rows, field) { return countBy(rows.map(field)) }
function groupAnalysis(rows) { return { count: rows.length, firstDivergentStage: distribution(rows, row => row.firstDivergentStage), firstDivergentComponent: distribution(rows, row => row.firstDivergentComponent), firstDivergentOperationKind: distribution(rows, operationKind), recurrenceDepth: distribution(rows, row => { const degree = row.officialTrace.components[0].coefficientCount - 1; return row.firstDivergentOperationOrdinal === null ? 'none' : degree + 1 - row.firstDivergentOperationOrdinal }), positionVelocityOrder: distribution(rows, firstDivergenceCategory), normalizedTimeRegion: distribution(rows, row => { const value = floatFromBits(row.officialTrace.components[0].normalizedTimeBits); return value === -1 ? 'minus_one' : value === 1 ? 'plus_one' : value > -1 && value < 1 ? 'interior' : 'outside_domain' }), ulpDirection: distribution(rows, direction), primaryClassification: distribution(rows, row => row.primaryClassification) } }

export async function analyze({ input = RAW } = {}) {
  const rows = (await readJsonl(input)).sort((a, b) => a.sampleId.localeCompare(b.sampleId))
  if (rows.length !== 154 || new Set(rows.map(row => row.sampleId)).size !== 154) throw new Error('raw trace is not exactly 154 unique samples')
  if (rows.some((row, index) => index > 0 && rows[index - 1].sampleId.localeCompare(row.sampleId) > 0)) throw new Error('raw trace is not sorted')
  const source = (await readJsonl(INPUTS.existingEvaluation)).sort((a, b) => a.sampleId.localeCompare(b.sampleId))
  if (!source.every((row, index) => row.sampleId === rows[index].sampleId)) throw new Error('raw trace sample identity does not match existing 154 cohort')
  if (!rows.every(row => row.instrumentedOfficialVsLinkedOfficial.allComponentsBitwiseEqual && row.projectTraceVsExistingProject.allComponentsBitwiseEqual && row.queryEtIdentity.exact && row.recordPayloadIdentity.exact)) throw new Error('final or input parity gate failed in raw trace')
  const build = JSON.parse(await readFile(resolve(ROOT, INPUTS.traceBuildIdentity), 'utf8'))
  const rawIdentity = await fileIdentity(input)
  const sourceIdentity = await fileIdentity(INPUTS.existingEvaluation)
  const sourceRows = new Map(source.map(row => [row.sampleId, row]))
  const within = rows.filter(row => ulpGroup(row) === 'within_one_ulp'), over = rows.filter(row => ulpGroup(row) === 'over_one_ulp')
  if (within.length !== 82 || over.length !== 72) throw new Error(`unexpected 82/72 cross-analysis groups: ${within.length}/${over.length}`)
  const neighborhood = new Map((await readJsonl(INPUTS.neighborhood)).map(row => [row.sampleId, row]))
  const currentIdentities = { existingEvaluation: sourceIdentity, neighborhood: await fileIdentity(INPUTS.neighborhood), centerLeg: await fileIdentity(INPUTS.centerLeg), cspiceReference: await fileIdentity(INPUTS.cspiceReference), kernel: await fileIdentity(INPUTS.kernel), officialSpke02: await fileIdentity(INPUTS.officialSpke02), officialChbint: await fileIdentity(INPUTS.officialChbint), officialHeader: await fileIdentity(INPUTS.officialHeader), linkedCspiceLibrary: await fileIdentity(INPUTS.officialLibrary), linkedCsupportLibrary: await fileIdentity(INPUTS.supportLibrary), projectSource: await fileIdentity(INPUTS.projectSource), projectBuild: await fileIdentity(INPUTS.projectBuild), tracePatcher: await fileIdentity(INPUTS.tracePatcher), traceBuild: await fileIdentity(INPUTS.traceBuild), traceBinary: await fileIdentity(INPUTS.traceBinary), traceBuildIdentity: await fileIdentity(INPUTS.traceBuildIdentity) }
  const segmentDistribution = distribution(rows, row => row.segmentIdentity.value)
  const recordIndexDistribution = distribution(rows, row => row.recordIdentity.project.recordIndex)
  const boundaryDistribution = distribution(rows, row => neighborhood.get(row.sampleId)?.selectedCandidate?.recordBoundary?.relation || 'not_recorded')
  const normalizedDistribution = distribution(rows, row => { const value = floatFromBits(row.officialTrace.components[0].normalizedTimeBits); return value === -1 ? 'minus_one' : value === 1 ? 'plus_one' : value > -1 && value < 1 ? 'interior' : 'outside_domain' })
  const positionDistribution = distribution(rows, row => row.positionDivergence?.stage || 'no_position_divergence')
  const velocityDistribution = distribution(rows, row => row.velocityDivergence?.stage || 'no_velocity_divergence')
  return {
    schemaVersion: 1,
    recordType: 'de405_type2_evaluator_first_divergence_analysis',
    generator: 'scripts/analyze-de405-type2-evaluator-first-divergence.mjs',
    cspiceSourceIdentities: { spke02: currentIdentities.officialSpke02, chbint: currentIdentities.officialChbint, header: currentIdentities.officialHeader },
    linkedCspiceLibraryIdentity: { cspice: currentIdentities.linkedCspiceLibrary, csupport: currentIdentities.linkedCsupportLibrary },
    instrumentationIdentity: { build, patcher: currentIdentities.tracePatcher, buildScript: currentIdentities.traceBuild, binary: currentIdentities.traceBinary },
    projectEvaluatorIdentity: { source: currentIdentities.projectSource, buildScript: currentIdentities.projectBuild, routine: 'project_owned_type2_chbint_recurrence_v1' },
    kernelIdentity: currentIdentities.kernel,
    sourceEvidenceIdentities: { existingEvaluation: currentIdentities.existingEvaluation, neighborhood: currentIdentities.neighborhood, centerLeg: currentIdentities.centerLeg, cspiceReference: currentIdentities.cspiceReference },
    rawArtifact: { path: input, sizeBytes: rawIdentity.sizeBytes, sha256: rawIdentity.sha256, recordCount: rows.length },
    cohortCount: rows.length,
    officialFinalParityCount: rows.filter(row => row.instrumentedOfficialVsLinkedOfficial.allComponentsBitwiseEqual).length,
    projectFinalReproductionCount: rows.filter(row => row.projectTraceVsExistingProject.allComponentsBitwiseEqual).length,
    inputIdentityCount: rows.filter(row => row.queryEtIdentity.exact && row.recordPayloadIdentity.exact).length,
    notComputableCount: rows.filter(row => row.primaryClassification === 'not_computable').length,
    primaryClassificationCounts: countBy(rows.map(row => row.primaryClassification)),
    firstDivergentStageDistribution: countBy(rows.map(row => row.firstDivergentStage)),
    firstDivergentComponentDistribution: countBy(rows.map(row => row.firstDivergentComponent)),
    positionVelocityDivergenceDistribution: countBy(rows.map(firstDivergenceCategory)),
    positionDivergenceStageDistribution: positionDistribution,
    velocityDivergenceStageDistribution: velocityDistribution,
    operationKindDistribution: countBy(rows.map(operationKind)),
    degreeCoefficientCountDistribution: countBy(rows.map(row => row.officialTrace.components[0].coefficientCount)),
    segmentDistribution,
    recordIndexDistribution,
    boundaryDistribution,
    normalizedTimeDistribution: normalizedDistribution,
    normalizedTimeRegionDistribution: normalizedDistribution,
    oneUlpGroupCrossAnalysis: groupAnalysis(within),
    overOneUlpGroupCrossAnalysis: groupAnalysis(over),
    confirmedFindings: ['All 154 source samples have identical record payload bits and query ET bits for linked official, instrumented official, and project evaluation.', `The temporary instrumented official evaluator reproduces linked CSPICE output bitwise for ${rows.length}/154 samples.`, `The project trace reproduces existing P0 bitwise for ${rows.length}/154 samples.`, 'The first differing captured stage is an observation of the two diagnostic evaluators under the stated source and compiler contract.'],
    strongCorrelations: ['The source contract has a confirmed structural recurrence-order difference: official CHBINT uses left-associated derivative accumulation while the project evaluator groups the final subtraction inside the right operand.', 'The 82/72 final ULP groups can be cross-tabulated against trace stages without upgrading the cross-tabulation to causal proof.'],
    candidateExplanations: ['The observed velocity-derivative divergence is consistent with the confirmed source recurrence-order difference; the trace does not establish that this is the only cause of every residual.', 'A final position or velocity ULP distribution may correlate with normalized-time region, degree, or record identity, but those correlations remain candidate explanations.'],
    notComputableItems: ['High-level CSPICE selected segment, selected record, route, and accumulator order are not observed.', 'Unexposed official library temporaries outside the parity-validated temporary source instrumentation are not available.', 'JPL internal evaluator behavior is not measured by this trace.'],
    unresolvedItems: ['selection_unresolved remains 1,701.', 'No tolerance, canonical selection, active transition, scientific approval, or production integration decision is changed by this evidence.'],
    selectionUnresolved: 1701,
    toleranceChanged: false,
    canonicalSelectionChanged: false,
    activeTransition: false,
    scientificApproval: false,
    productionIntegration: false,
    sourceContractComparison: sourceContract,
    evidenceLevel: 'confirmed',
    sourceRowsUsed: sourceRows.size
  }
}

export const markdown = analysis => ['# DE405 Type-2 Evaluator First-Divergence Trace Evidence', '', '## 조사 목적', '', '동일한 Type-2 record bits와 ET bits를 입력해 project-owned evaluator와 공식 CSPICE SPKE02 evaluator의 parity-validated intermediate trace를 비교한다.', '', '## 154건 선정 기준', '', `cohort=${analysis.cohortCount}; linked/instrumented parity=${analysis.officialFinalParityCount}; project reproduction=${analysis.projectFinalReproductionCount}; input identity=${analysis.inputIdentityCount}. 기존 P0/O0 분포는 one-ULP 82건, over-one-ULP 72건이다.`, '', '## 공식 CSPICE source 및 dependency', '', `spke02=${JSON.stringify(analysis.cspiceSourceIdentities.spke02)}; chbint=${JSON.stringify(analysis.cspiceSourceIdentities.chbint)}; linked libraries=${JSON.stringify(analysis.linkedCspiceLibraryIdentity)}.`, '', '## 계측 방법과 원본 보존', '', '설치된 CSPICE source는 수정하지 않고 SHA-256과 anchor를 검사한 임시 복사본에 diagnostic symbol과 callback을 삽입했다. instrumented source와 binary는 build output에만 보관한다.', '', '## Instrumented/linked official final parity', '', `${analysis.officialFinalParityCount}/154 sample의 6개 state component가 bitwise 동일하다.`, '', '## Project trace final reproduction', '', `${analysis.projectFinalReproductionCount}/154 sample의 project trace final이 기존 P0와 bitwise 동일하다.`, '', '## 공통 input identity', '', `${analysis.inputIdentityCount}/154 sample에서 record payload와 query ET bits가 일치한다.`, '', '## Record layout 대조', '', 'record midpoint/radius, coefficient block start/count/fingerprint, first/last coefficient bits를 비교했다.', '', '## Normalized time 대조', '', '공식 CHBINT의 `s`, `2*s`와 project evaluator의 normalized-time 결과를 Binary64 bits로 비교했다.', '', '## Coefficient layout 대조', '', '각 component의 coefficient slice와 payload identity를 비교했다.', '', '## Position recurrence 대조', '', '각 operation의 coefficient, Chebyshev recurrence temporaries, position polynomial output bits를 기록했다.', '', '## Velocity derivative 대조', '', '각 operation의 derivative recurrence temporaries와 unscaled derivative output bits를 기록했다.', '', '## Velocity scaling 대조', '', 'time/radius operand와 scaled velocity result bits를 기록했다.', '', '## First-divergence 결과', '', `primary=${JSON.stringify(analysis.primaryClassificationCounts)}; stage=${JSON.stringify(analysis.firstDivergentStageDistribution)}; component=${JSON.stringify(analysis.firstDivergentComponentDistribution)}.`, '', '## 82/72 교차 분석', '', `within-one-ULP=${JSON.stringify(analysis.oneUlpGroupCrossAnalysis)}; over-one-ULP=${JSON.stringify(analysis.overOneUlpGroupCrossAnalysis)}.`, '', '## Source-contract 구조 차이', '', JSON.stringify(analysis.sourceContractComparison), '', '## 확정 가능한 사항', '', analysis.confirmedFindings.map(value => `- ${value}`).join('\n'), '', '## 상관관계와 후보 설명', '', analysis.strongCorrelations.concat(analysis.candidateExplanations).map(value => `- ${value}`).join('\n'), '', '## 확정할 수 없는 high-level CSPICE 내부 경로', '', analysis.notComputableItems.map(value => `- ${value}`).join('\n'), '', '## 다음 단계 진입 조건', '', '공식 source capability, instrumented/linked final parity, project final reproduction, common input identity, raw artifact identity, and deterministic freshness checks가 모두 유지되어야 한다. high-level route/selection 관측 주장은 허용하지 않는다.', '', '## Contract state', '', JSON.stringify({ selectionUnresolved: analysis.selectionUnresolved, toleranceChanged: analysis.toleranceChanged, canonicalSelectionChanged: analysis.canonicalSelectionChanged, activeTransition: analysis.activeTransition, scientificApproval: analysis.scientificApproval, productionIntegration: analysis.productionIntegration }), ''].join('\n')

export async function fresh() { try { const analysis = await analyze(); const summary = await readFile(resolve(ROOT, SUMMARY), 'utf8'); const document = await readFile(resolve(ROOT, MARKDOWN), 'utf8'); return summary === serializeCanonicalJson(analysis) && document === markdown(analysis) ? { status: 'fresh' } : { status: 'stale' } } catch (error) { return { status: 'invalid', error: error.message } } }

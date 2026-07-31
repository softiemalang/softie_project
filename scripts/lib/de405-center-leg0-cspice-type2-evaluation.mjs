import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { createReadStream } from 'node:fs'
import { mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { createInterface } from 'node:readline'

export const ROOT = resolve(new URL('../..', import.meta.url).pathname)
export const RAW = 'artifacts/de405-center-leg0-cspice-type2-evaluation-evidence.jsonl'
export const SUMMARY = 'docs/de405-center-leg0-cspice-type2-evaluation-analysis.json'
export const MARKDOWN = 'docs/de405-center-leg0-cspice-type2-evaluation-analysis.md'
export const INPUTS = {
  neighborhood: 'artifacts/de405-center-leg0-record-neighborhood-evidence.jsonl',
  neighborhoodSummary: 'docs/de405-center-leg0-record-neighborhood-analysis.json',
  centerLeg: 'artifacts/de405-center-chain-first-divergence-evidence.jsonl',
  cspiceReference: 'docs/de405-cspice-reference-contract-audit.json',
  kernel: '/Users/softie/.local/share/softie-de405/kernels/spk/de405.bsp',
  cspiceRoot: '/Users/softie/.local/share/softie-de405/cspice/N0067',
  probeSource: 'tools/de405-cspice-type2-exact-record-probe/src/de405_cspice_type2_exact_record_probe.c',
  probeBuild: 'tools/de405-cspice-type2-exact-record-probe/build.mjs',
  probeBinary: 'tools/de405-cspice-type2-exact-record-probe/build/de405-cspice-type2-exact-record-probe',
  probeBuildIdentity: 'tools/de405-cspice-type2-exact-record-probe/build/runner-build.json',
  header: '/Users/softie/.local/share/softie-de405/cspice/N0067/include/SpiceUsr.h',
  docs: '/Users/softie/.local/share/softie-de405/cspice/N0067/doc/spk.req',
  readerSource: '/Users/softie/.local/share/softie-de405/cspice/N0067/src/cspice/spkr02.c',
  evaluatorSource: '/Users/softie/.local/share/softie-de405/cspice/N0067/src/cspice/spke02.c'
}
export const COMPONENT_NAMES = ['positionX', 'positionY', 'positionZ', 'velocityX', 'velocityY', 'velocityZ']
const readJsonl = async path => { const rows = []; const input = createInterface({ input: createReadStream(resolve(ROOT, path)), crlfDelay: Infinity }); for await (const line of input) if (line.trim()) rows.push(JSON.parse(line)); return rows }
const sha256 = value => createHash('sha256').update(value).digest('hex')
const fileIdentity = async path => { const content = await readFile(resolve(ROOT, path)); const info = await stat(resolve(ROOT, path)); return { path, sizeBytes: info.size, sha256: sha256(content) } }
const canonical = value => JSON.stringify(value)
export const serializeCanonicalJson = value => JSON.stringify(value, null, 2) + '\n'
const bits = value => { const view = new DataView(new ArrayBuffer(8)); view.setFloat64(0, value, false); return `0x${view.getBigUint64(0, false).toString(16).padStart(16, '0')}` }
const valueFromBits = value => { const view = new DataView(new ArrayBuffer(8)); view.setBigUint64(0, BigInt(value), false); return view.getFloat64(0, false) }
const valuesFromBits = values => values.map(valueFromBits)
const stateBits = values => values.map(bits)
const countBy = values => Object.fromEntries(Object.entries(values.reduce((out, value) => { const key = String(value); out[key] = (out[key] || 0) + 1; return out }, {})).sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true })))
const ordered = value => { const raw = BigInt(value); return raw >> 63n ? ~raw + 1n : raw | 0x8000000000000000n }
const ulpDistance = (left, right) => { if (!Number.isFinite(left) || !Number.isFinite(right)) return null; const a = ordered(bits(left)); const b = ordered(bits(right)); const distance = a > b ? a - b : b - a; return distance <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(distance) : distance.toString() }
const withinOneUlp = comparison => Boolean(comparison?.componentUlpDistances?.length) && comparison.componentUlpDistances.every(value => value !== null && (typeof value === 'number' ? value <= 1 : BigInt(value) <= 1n))
const exact = comparison => comparison?.allComponentsBitwiseEqual === true
const compare = (left, right) => {
  const leftBits = stateBits(left), rightBits = stateBits(right), differences = leftBits.map((value, index) => value !== rightBits[index])
  return { allComponentsBitwiseEqual: differences.every(value => !value), positionBitwiseEqual: differences.slice(0, 3).every(value => !value), velocityBitwiseEqual: differences.slice(3).every(value => !value), signedZeroEqual: leftBits.every((value, index) => !(Object.is(left[index], 0) && Object.is(right[index], 0)) || value === rightBits[index]), firstDifferentComponent: differences.findIndex(Boolean) < 0 ? null : COMPONENT_NAMES[differences.findIndex(Boolean)], componentUlpDistances: left.map((value, index) => ulpDistance(value, right[index])), numericResiduals: left.map((value, index) => value - right[index]), candidateStateBits: leftBits, referenceStateBits: rightBits }
}
const payloadSha256 = coefficientBits => sha256(Buffer.concat(coefficientBits.map(value => { const buffer = Buffer.alloc(8); buffer.writeBigUInt64BE(BigInt(value)); return buffer })))
const payloadBitsSha256 = coefficientBits => sha256(coefficientBits.join(','))
const candidatePayload = candidate => candidate?.coefficientBits || []
const candidateProjectState = candidate => candidate?.state?.values || []
const officialSignedZeroFlags = state => state.map(value => value === 0 ? bits(value) === '0x8000000000000000' : false)
const sorted = rows => rows.sort((a, b) => a.sampleId.localeCompare(b.sampleId))
const identity = async path => fileIdentity(path)

function projectTrace(candidate, queryEtBits) {
  const coefficients = valuesFromBits(candidate.coefficientBits), midpoint = coefficients[0], radius = coefficients[1], queryEt = valueFromBits(queryEtBits), normalized = (queryEt - midpoint) / radius, degree = (coefficients.length - 2) / 3 - 1
  const axes = []
  for (let axis = 0; axis < 3; axis++) {
    const values = coefficients.slice(2 + axis * (degree + 1), 2 + (axis + 1) * (degree + 1)); const twice = 2 * normalized
    let w0 = 0, w1 = 0, w2, d0 = 0, d1 = 0, d2
    for (let j = degree + 1; j > 1; j--) { w2 = w1; w1 = w0; w0 = values[j - 1] + (twice * w1 - w2); d2 = d1; d1 = d0; d0 = w1 * 2 + (d1 * twice - d2) }
    const position = values[0] + (normalized * w0 - w1), derivativeNumerator = w0 + normalized * d0 - d1, velocity = derivativeNumerator / radius
    axes.push({ positionPolynomialOutputBits: bits(position), velocityDerivativePolynomialOutputBits: bits(derivativeNumerator), finalScaleBits: bits(radius), velocityOutputBits: bits(velocity) })
  }
  return { recordMidpointBits: bits(midpoint), recordRadiusBits: bits(radius), normalizedTimeBits: bits(normalized), axes }
}

function sourceDescriptor(candidate) {
  const details = candidate.segmentIdentityDetails
  return { target: details.target, center: details.center, frame: details.frame, segmentType: details.segmentType, segmentStartEt: details.segmentStartEt, segmentEndEt: details.segmentEndEt, segmentBeginAddress: details.segmentBeginDafAddress, segmentEndAddress: details.segmentEndDafAddress, segmentOrdinal: details.segmentOrdinal }
}

function requestFor(row, candidate, kernelSha256) {
  if (candidate.status !== 'computed') return null
  const details = candidate.segmentIdentityDetails
  return { requestId: `${row.sampleId}:${candidate.candidateKind}`, sampleId: row.sampleId, candidateKind: candidate.candidateKind, kernelPath: INPUTS.kernel, kernelSha256, segmentIdentity: candidate.segmentIdentity, segmentBeginAddress: details.segmentBeginDafAddress, segmentEndAddress: details.segmentEndDafAddress, segmentDescriptor: sourceDescriptor(candidate), segmentOrdinal: details.segmentOrdinal, target: details.target, center: details.center, frame: details.frame, segmentType: details.segmentType, recordIndex: candidate.recordIdentity.recordIndex, queryEtBits: row.queryEtBits, expectedChildBody: row.centerBody, expectedParentBody: row.intermediateParent, recordNumberConvention: 'project_zero_based_to_spkr02_one_based' }
}

async function identities() {
  const reference = await fileIdentity(INPUTS.cspiceReference)
  return { kernel: await identity(INPUTS.kernel), header: await identity(INPUTS.header), documentation: await identity(INPUTS.docs), readerSource: await identity(INPUTS.readerSource), evaluatorSource: await identity(INPUTS.evaluatorSource), cspiceReference: reference }
}

async function officialIdentity(build) {
  const source = await identity(INPUTS.probeSource), buildScript = await identity(INPUTS.probeBuild), binary = await identity(INPUTS.probeBinary)
  return { readerFunctionName: 'spkr02_', readerDeclaration: 'int spkr02_(integer *handle, doublereal *descr, doublereal *et, doublereal *record)', evaluatorFunctionName: 'spke02_', evaluatorDeclaration: 'int spke02_(doublereal *et, doublereal *record, doublereal *xyzdot)', headerPath: INPUTS.header, headerIdentity: await identity(INPUTS.header), documentationPath: INPUTS.docs, documentationIdentity: await identity(INPUTS.docs), sourceIdentityAvailable: true, readerSource: await identity(INPUTS.readerSource), evaluatorSource: await identity(INPUTS.evaluatorSource), readerRecordContract: 'SPKR02 selects recno=((ET-INIT)/INTLEN)+1 and returns RECORD[0]=record size followed by the selected raw record words', evaluatorContract: 'SPKE02 consumes ET and the raw Type-2 record and returns XYZDOT=[X,Y,Z,Xprime,Yprime,Zprime]', stateComponentOrder: COMPONENT_NAMES, stateUnits: ['km', 'km', 'km', 'km/sec', 'km/sec', 'km/sec'], recordNumberConvention: 'project zero-based index i is requested through official SPKR02 with an interior reader ET for record number i+1', build: { ...build, binaryPath: INPUTS.probeBinary }, nativeProbe: { source, buildScript, binary } }
}

function candidateOutput(row, candidate, native) {
  if (candidate.status !== 'computed') return { status: candidate.status === 'not_computable' ? 'not_applicable' : 'not_computable', candidateKind: candidate.candidateKind, reason: candidate.reason || 'candidate_not_present_in_source_neighborhood' }
  const officialBits = native.officialRecordBits || [], projectBits = candidatePayload(candidate), payloadExact = canonical(projectBits) === canonical(officialBits)
  const projectState = candidateProjectState(candidate), officialState = native.officialStateValues || [], highLevelState = row.cspicePairState.values
  const projectVsOfficial = payloadExact ? compare(projectState, officialState) : null
  const officialVsHighLevel = payloadExact ? compare(officialState, highLevelState) : null
  const projectVsHighLevel = compare(projectState, highLevelState)
  const projectOfficialClass = !payloadExact ? 'record_payload_mismatch' : exact(projectVsOfficial) ? 'official_matches_project_exact' : withinOneUlp(projectVsOfficial) ? 'official_within_one_ulp_of_project' : 'official_differs_from_project'
  const officialHighClass = !payloadExact ? 'not_computable' : exact(officialVsHighLevel) ? 'official_matches_high_level_pair_exact' : withinOneUlp(officialVsHighLevel) ? 'official_within_one_ulp_of_high_level_pair' : 'official_differs_from_high_level_pair'
  const trace = payloadExact && !exact(projectVsOfficial) ? projectTrace(candidate, row.queryEtBits) : null
  return { status: 'computed', candidateKind: candidate.candidateKind, recordNumberConvention: native.recordNumberConvention, projectRecordIdentity: { ...candidate.recordIdentity, coefficientBits: projectBits, projectRecordDoubleCount: projectBits.length, projectRecordBitsSha256: payloadBitsSha256(projectBits), projectRecordPayloadSha256: payloadSha256(projectBits) }, officialRecordIdentity: { projectRecordIndex: native.projectRecordIndex, cspiceReaderRecordNumber: native.cspiceReaderRecordNumber, readerEtBits: native.readerEtBits, officialRecordDoubleCount: native.officialRecordDoubleCount, officialRecordBits: officialBits, officialRecordBitsSha256: payloadBitsSha256(officialBits), officialRecordPayloadSha256: payloadSha256(officialBits), segmentDescriptor: native.segmentDescriptor }, recordPayloadComparison: { status: payloadExact ? 'record_payload_exact_match' : 'record_payload_mismatch', exact: payloadExact, projectRecordDoubleCount: projectBits.length, officialRecordDoubleCount: officialBits.length, projectRecordBitsSha256: payloadBitsSha256(projectBits), officialRecordBitsSha256: payloadBitsSha256(officialBits), projectRecordPayloadSha256: payloadSha256(projectBits), officialRecordPayloadSha256: payloadSha256(officialBits) }, projectEvaluation: { values: projectState, bits: candidate.state.bits, evaluationRoutineIdentity: candidate.recordIdentity.evaluationRoutineIdentity }, officialEvaluation: { values: officialState, bits: native.officialStateBits, signedZeroFlags: officialSignedZeroFlags(officialState), status: native.officialEvaluatorStatus, cspiceErrorState: native.officialCspiceErrorState, readerEtBits: native.readerEtBits, evidenceQueryEtBits: row.queryEtBits, nativeInputEtBits: native.nativeInputEtBits, nativeEtBitsBeforeEvaluation: native.nativeEtBitsBeforeEvaluation, nativeEtBitsAfterEvaluation: native.nativeEtBitsAfterEvaluation, etMutated: native.etMutated }, projectVsOfficial, officialVsHighLevel: payloadExact ? officialVsHighLevel : null, projectVsHighLevel, projectOfficialClassification: projectOfficialClass, officialHighLevelClassification: officialHighClass, projectEvaluationTrace: trace }
}

function primaryClassification(candidates) {
  const selected = candidates.find(candidate => candidate.candidateKind === 'selected'), previous = candidates.find(candidate => candidate.candidateKind === 'previous'), next = candidates.find(candidate => candidate.candidateKind === 'next')
  if (candidates.some(candidate => candidate.projectOfficialClassification === 'record_payload_mismatch')) return 'record_payload_identity_mismatch'
  const officialPair = candidates.filter(candidate => exact(candidate.officialVsHighLevel))
  const selectedOfficialPair = exact(selected?.officialVsHighLevel), selectedProjectDiff = selected?.projectVsOfficial && !exact(selected.projectVsOfficial), selectedProjectPair = exact(selected?.projectVsOfficial) && !exact(selected?.officialVsHighLevel)
  if (selectedOfficialPair && selectedProjectDiff) return 'official_selected_matches_pair_project_differs'
  if (selectedProjectPair) return 'official_selected_matches_project_pair_differs'
  if (officialPair.length > 1) return 'multiple_official_candidates_match_pair'
  if (exact(previous?.officialVsHighLevel)) return 'official_previous_matches_pair'
  if (exact(next?.officialVsHighLevel)) return 'official_next_matches_pair'
  if (selected?.projectVsOfficial && !exact(selected.projectVsOfficial)) return 'project_official_evaluator_difference'
  const computed = candidates.filter(candidate => candidate.status === 'computed')
  if (computed.length && computed.every(candidate => exact(candidate.projectVsOfficial)) && computed.every(candidate => !exact(candidate.officialVsHighLevel))) return 'official_and_project_candidates_all_agree_pair_differs'
  if (computed.length && officialPair.length === 0) return 'official_candidate_set_no_pair_match'
  return 'unresolved'
}

function materialRecord(row, nativeRows, common, official) {
  const sourceCandidates = [row.selectedCandidate, row.previousCandidate, row.nextCandidate]
  const candidates = sourceCandidates.map(candidate => candidateOutput(row, candidate, nativeRows.get(`${row.sampleId}:${candidate.candidateKind}`) || {}))
  const computed = candidates.filter(candidate => candidate.status === 'computed')
  const matching = computed.filter(candidate => exact(candidate.officialVsHighLevel)).map(candidate => candidate.candidateKind)
  const primary = primaryClassification(candidates)
  return { schemaVersion: 1, recordType: 'de405_center_leg0_cspice_type2_evaluation_evidence', sampleId: row.sampleId, group: row.group, target: row.target, center: row.center, epochKind: row.epochKind, queryEtBits: row.queryEtBits, sourceRecordNeighborhoodIdentity: common.neighborhood, sourceCenterLegIdentity: common.centerLeg, sourceCspiceReferenceIdentity: common.cspiceReference, officialReaderIdentity: official, officialEvaluatorIdentity: official, nativeProbeIdentity: official.nativeProbe, kernelIdentity: common.kernel, centerBody: row.centerBody, intermediateParent: row.intermediateParent, segmentIdentity: row.projectSegmentIdentity, selectedRecordIdentity: row.projectSelectedRecordIdentity, sourceRecordNeighborhoodClassification: row.recordNeighborhoodClassification, highLevelPairRequestEnvelope: row.cspicePairRequestEnvelope, highLevelPairState: row.cspicePairState, selectedCandidate: candidates[0], previousCandidate: candidates[1], nextCandidate: candidates[2], officialMatchingCandidates: matching, projectOfficialDifferenceShape: { selected: candidates[0].projectVsOfficial?.firstDifferentComponent || null, selectedClassification: candidates[0].projectOfficialClassification, allCandidatesComputed: computed.length, projectOfficialDifferenceCount: computed.filter(candidate => !exact(candidate.projectVsOfficial)).length }, primaryClassification: primary, supportingFindings: primary === 'official_previous_matches_pair' || primary === 'official_next_matches_pair' ? ['The official low-level evaluation of a bounded adjacent record reproduces the audited CSPICE high-level pair-state.'] : [], evidenceLevel: 'confirmed', notComputableReasons: ['CSPICE high-level internal selected segment, record, route, and accumulator order are not directly observed.'] }
}

export async function validateSource() {
  const rows = sorted(await readJsonl(INPUTS.neighborhood)); if (rows.length !== 154 || new Set(rows.map(row => row.sampleId)).size !== 154) throw new Error('source record-neighborhood evidence is not exactly 154 unique samples')
  for (const row of rows) {
    if (row.legOrdinal !== 0 || row.selectedCandidate?.status !== 'computed' || row.selectedCandidate.segmentIdentityDetails.segmentType !== 2 || !row.cspicePairState?.bits || row.selectedCandidate.recordIdentity?.recordIndex === undefined) throw new Error(`invalid Type-2 source row: ${row.sampleId}`)
    if (row.overlappingSegmentCandidates.length !== 0) throw new Error(`unexpected overlapping segment candidate: ${row.sampleId}`)
  }
  return rows
}

export async function materialize({ output = RAW } = {}) {
  const outputPath = resolve(ROOT, output); try { await stat(outputPath); throw new Error(`output exists: ${output}`) } catch (error) { if (error.message === `output exists: ${output}`) throw error; if (error.code !== 'ENOENT') throw error }
  const source = await validateSource(), common = { neighborhood: await identity(INPUTS.neighborhood), centerLeg: await identity(INPUTS.centerLeg), cspiceReference: await identity(INPUTS.cspiceReference), kernel: await identity(INPUTS.kernel) }
  execFileSync('node', [resolve(ROOT, 'tools/de405-cspice-type2-exact-record-probe/build.mjs')], { cwd: ROOT, stdio: 'inherit', env: { ...process.env, CSPICE_DIR: process.env.CSPICE_DIR || INPUTS.cspiceRoot } })
  const official = await officialIdentity(JSON.parse(await readFile(resolve(ROOT, INPUTS.probeBuildIdentity), 'utf8')))
  const temp = await mkdtemp(`${tmpdir()}/de405-cspice-type2-evaluation.`)
  try {
    const projectInput = resolve(temp, 'project-input.jsonl'), projectOutput = resolve(temp, 'project.jsonl')
    await writeFile(projectInput, source.map(row => JSON.stringify({ sampleId: row.sampleId, targetId: row.centerBody, centerId: row.intermediateParent, queryEt: valueFromBits(row.queryEtBits), queryEtHex: row.queryEtBits, projectSegmentIdentity: row.projectSegmentIdentity })).join('\n') + '\n')
    const projectBinary = resolve(temp, 'de405-type2-record-neighborhood')
    execFileSync('node', [resolve(ROOT, 'tools/de405-type2-record-neighborhood/build.mjs'), '--output', projectBinary], { cwd: ROOT, stdio: 'inherit', env: { ...process.env, CSPICE_DIR: process.env.CSPICE_DIR || INPUTS.cspiceRoot } })
    execFileSync(projectBinary, ['--evaluate-neighborhood', '--spk', INPUTS.kernel, '--input-jsonl', projectInput, '--output-jsonl', projectOutput], { cwd: ROOT, stdio: 'inherit' })
    const projectRows = await readJsonl(projectOutput), projectMap = new Map(projectRows.map(row => [row.sampleId, row]))
    if (projectRows.length !== source.length) throw new Error(`project payload extraction count mismatch: ${projectRows.length}/${source.length}`)
    const enrichedSource = source.map(row => {
      const projectRow = projectMap.get(row.sampleId); if (!projectRow) throw new Error(`missing project payload row: ${row.sampleId}`)
      const enrich = candidate => { const native = projectRow.projectCandidates.find(value => value.candidateKind === candidate.candidateKind); if (!native) return candidate; return { ...candidate, coefficientBits: native.coefficientBits, projectNativeStateBits: native.nativeStateBits } }
      return { ...row, selectedCandidate: enrich(row.selectedCandidate), previousCandidate: enrich(row.previousCandidate), nextCandidate: enrich(row.nextCandidate) }
    })
    const requests = enrichedSource.flatMap(row => [row.selectedCandidate, row.previousCandidate, row.nextCandidate].map(candidate => requestFor(row, candidate, common.kernel.sha256)).filter(Boolean))
    const input = resolve(temp, 'input.jsonl'), nativeOutput = resolve(temp, 'native.jsonl')
    await writeFile(input, requests.map(request => JSON.stringify(request)).join('\n') + '\n')
    execFileSync(resolve(ROOT, INPUTS.probeBinary), ['--evaluate-batch', '--spk', INPUTS.kernel, '--input-jsonl', input, '--output-jsonl', nativeOutput], { cwd: ROOT, stdio: 'inherit' })
    const nativeRows = await readJsonl(nativeOutput), nativeMap = new Map(nativeRows.map(row => [`${row.sampleId}:${row.candidateKind}`, row]))
    if (nativeRows.length !== requests.length) throw new Error(`official native evaluation count mismatch: ${nativeRows.length}/${requests.length}`)
    const records = enrichedSource.map(row => materialRecord(row, nativeMap, common, official))
    if (records.length !== 154 || new Set(records.map(row => row.sampleId)).size !== 154) throw new Error('materialized output is not exactly 154 unique samples')
    await writeFile(outputPath, records.map(record => JSON.stringify(record)).join('\n') + '\n')
    return { records, output }
  } finally { await rm(temp, { recursive: true, force: true }) }
}

function validateRaw(records) { if (records.length !== 154 || new Set(records.map(row => row.sampleId)).size !== 154 || records.some((row, index) => index > 0 && records[index - 1].sampleId.localeCompare(row.sampleId) > 0)) throw new Error('raw output is not exactly 154 sorted unique samples'); for (const row of records) if (row.selectedCandidate.status !== 'computed' || row.selectedCandidate.recordPayloadComparison.status === 'record_payload_mismatch') throw new Error(`selected candidate invalid: ${row.sampleId}`) }
const candidateList = row => [row.selectedCandidate, row.previousCandidate, row.nextCandidate]

export async function analyze({ input = RAW } = {}) {
  const records = sorted(await readJsonl(input)); validateRaw(records); const source = await validateSource(); const sourceIds = new Set(source.map(row => row.sampleId)); if (records.some(row => !sourceIds.has(row.sampleId))) throw new Error('raw output contains a sample outside the canonical 154 cohort'); const sourceById = new Map(source.map(row => [row.sampleId, row])); records.forEach(row => { if (!row.sourceRecordNeighborhoodClassification) row.sourceRecordNeighborhoodClassification = sourceById.get(row.sampleId)?.recordNeighborhoodClassification })
  const currentSources = { neighborhood: await identity(INPUTS.neighborhood), centerLeg: await identity(INPUTS.centerLeg), cspiceReference: await identity(INPUTS.cspiceReference), kernel: await identity(INPUTS.kernel) }, currentOfficial = await officialIdentity(JSON.parse(await readFile(resolve(ROOT, INPUTS.probeBuildIdentity), 'utf8'))), first = records[0]
  const same = (left, right) => left?.path === right?.path && left?.sizeBytes === right?.sizeBytes && left?.sha256 === right?.sha256
  if (!same(first.sourceRecordNeighborhoodIdentity, currentSources.neighborhood) || !same(first.sourceCenterLegIdentity, currentSources.centerLeg) || !same(first.sourceCspiceReferenceIdentity, currentSources.cspiceReference) || !same(first.kernelIdentity, currentSources.kernel)) throw new Error('source or kernel identity is stale')
  if (first.officialReaderIdentity.readerFunctionName !== currentOfficial.readerFunctionName || first.officialReaderIdentity.evaluatorFunctionName !== currentOfficial.evaluatorFunctionName || !same(first.officialReaderIdentity.readerSource, currentOfficial.readerSource) || !same(first.officialReaderIdentity.evaluatorSource, currentOfficial.evaluatorSource) || !same(first.nativeProbeIdentity.source, currentOfficial.nativeProbe.source) || !same(first.nativeProbeIdentity.buildScript, currentOfficial.nativeProbe.buildScript) || !same(first.nativeProbeIdentity.binary, currentOfficial.nativeProbe.binary)) throw new Error('official reader/evaluator or native probe identity is stale')
  const rawIdentity = await identity(input), all = records.flatMap(candidateList), computed = all.filter(candidate => candidate.status === 'computed'), payloadExactCount = computed.filter(candidate => candidate.recordPayloadComparison.exact).length
  const primaryCounts = countBy(records.map(row => row.primaryClassification)), projectOfficial = computed.map(candidate => candidate.projectVsOfficial).filter(Boolean), officialHigh = computed.map(candidate => candidate.officialVsHighLevel).filter(Boolean)
  const distribution = comparisons => countBy(comparisons.flatMap(comparison => comparison.componentUlpDistances).filter(value => value !== null))
  const crossAnalysis = key => Object.fromEntries(Object.entries(countBy(records.map(row => row[key]))).map(([group]) => {
    const rows = records.filter(row => row[key] === group), cs = rows.flatMap(candidateList)
    return [group, { count: rows.length, selectedProjectOfficialExact: rows.filter(row => exact(row.selectedCandidate.projectVsOfficial)).length, selectedOfficialHighLevelExact: rows.filter(row => exact(row.selectedCandidate.officialVsHighLevel)).length, previousOfficialHighLevelExact: rows.filter(row => exact(row.previousCandidate.officialVsHighLevel)).length, nextOfficialHighLevelExact: rows.filter(row => exact(row.nextCandidate.officialVsHighLevel)).length, officialProjectOneUlp: cs.filter(candidate => withinOneUlp(candidate.projectVsOfficial)).length, officialHighLevelOneUlp: cs.filter(candidate => withinOneUlp(candidate.officialVsHighLevel)).length, payloadMismatch: cs.filter(candidate => candidate.recordPayloadComparison?.status === 'record_payload_mismatch').length, noPairMatch: rows.filter(row => row.officialMatchingCandidates.length === 0).length, primaryClassification: countBy(rows.map(row => row.primaryClassification)) }]
  }))
  const officialEvalFailures = all.filter(candidate => candidate.status === 'computed' && candidate.officialEvaluation.status !== 'computed').length
  return { schemaVersion: 1, recordType: 'de405_center_leg0_cspice_type2_evaluation_analysis', generator: 'scripts/analyze-de405-center-leg0-cspice-type2-evaluation.mjs', runtimeIdentity: { node: process.version }, nativeProbeIdentity: currentOfficial.nativeProbe, cspiceReaderEvaluatorIdentity: currentOfficial, kernelIdentity: currentSources.kernel, sourceIdentities: { neighborhood: currentSources.neighborhood, centerLeg: currentSources.centerLeg, cspiceReference: currentSources.cspiceReference, officialHeader: currentOfficial.headerIdentity, officialDocumentation: currentOfficial.documentationIdentity, readerSource: currentOfficial.readerSource, evaluatorSource: currentOfficial.evaluatorSource }, rawArtifact: { path: RAW, sizeBytes: rawIdentity.sizeBytes, sha256: rawIdentity.sha256, recordCount: records.length }, cohortCount: records.length, candidateCount: all.length, officialEvaluationCount: computed.length, notComputableCount: all.length - computed.length, recordPayloadExactMatchCount: payloadExactCount, recordPayloadMismatchCount: computed.length - payloadExactCount, selectedProjectOfficialExactCount: records.filter(row => exact(row.selectedCandidate.projectVsOfficial)).length, selectedProjectOfficialOneUlpCount: records.filter(row => withinOneUlp(row.selectedCandidate.projectVsOfficial)).length, selectedProjectOfficialOverOneUlpCount: records.filter(row => row.selectedCandidate.projectVsOfficial && !withinOneUlp(row.selectedCandidate.projectVsOfficial)).length, officialSelectedHighLevelExactCount: records.filter(row => exact(row.selectedCandidate.officialVsHighLevel)).length, officialPreviousHighLevelExactCount: records.filter(row => exact(row.previousCandidate.officialVsHighLevel)).length, officialNextHighLevelExactCount: records.filter(row => exact(row.nextCandidate.officialVsHighLevel)).length, multipleOfficialCandidateMatchCount: records.filter(row => row.officialMatchingCandidates.length > 1).length, officialCandidateNoMatchCount: records.filter(row => row.officialMatchingCandidates.length === 0).length, primaryClassificationCounts: primaryCounts, firstDifferentComponentDistribution: countBy(projectOfficial.map(comparison => comparison.firstDifferentComponent).filter(Boolean)), projectOfficialUlpDistribution: distribution(projectOfficial), officialHighLevelUlpDistribution: distribution(officialHigh), recordNeighborhoodGroupCrossAnalysis: { byExistingGroup: crossAnalysis('group'), byRecordNeighborhoodClassification: crossAnalysis('sourceRecordNeighborhoodClassification') }, segmentDistribution: countBy(records.map(row => row.segmentIdentity)), recordIndexDistribution: countBy(records.map(row => row.selectedRecordIdentity.recordIndex)), boundaryRelationDistribution: countBy(records.map(row => row.selectedCandidate.projectRecordIdentity.recordIndex === row.selectedRecordIdentity.recordIndex ? row.selectedCandidate.recordNumberConvention : 'unexpected')), epochKindDistribution: countBy(records.map(row => row.epochKind)), targetCenterDistribution: countBy(records.map(row => `${row.target}:${row.center}`)), confirmedFindings: ['Official N0067 SPKR02/ SPKE02 low-level evaluation outputs and exact Binary64 bits were recorded for the bounded selected/previous/next candidates.', 'Official record payload identity is compared against the existing project extractor before evaluator conclusions are classified.', 'The official low-level evaluation of a candidate is compared with the audited CSPICE high-level pair-state without observing high-level internal selection.'], strongCorrelations: records.filter(row => ['official_previous_matches_pair', 'official_next_matches_pair'].includes(row.primaryClassification)).map(row => `A bounded official adjacent-record evaluation reproduces the high-level pair-state for ${row.sampleId}.`), candidateExplanations: ['A matching official adjacent candidate is consistent with that candidate evaluation reproducing the high-level pair-state; it does not expose the high-level query selected record.'], notComputableItems: ['High-level CSPICE selected segment, selected record, body route, and accumulator order remain unobserved.', 'Official internal CHBINT accumulator intermediates are not exposed by SPKE02.'], unresolvedItems: ['selection_unresolved remains 1,701; this bounded evidence does not change tolerance, canonical selection, active transition, scientific approval, or production integration.'], officialEvaluatorFailures: officialEvalFailures, contractState: { selectionUnresolved: 1701, toleranceChanged: false, canonicalSelectionChanged: false, activeTransition: false, scientificApproval: false, productionIntegration: false }, selectionUnresolved: 1701, toleranceChanged: false, canonicalSelectionChanged: false, activeTransition: false, scientificApproval: false, productionIntegration: false, evidenceLevel: 'confirmed' }
}

export const markdown = analysis => ['# DE405 Center Leg-0 CSPICE Type-2 Exact-Record Evaluation Evidence', '', '## 조사 목적', '', '기존 center leg-0 record-neighborhood의 154건에 대해 동일 segment·record를 CSPICE N0067 공식 low-level SPKR02/ SPKE02로 읽고 평가했다.', '', '## 154건 선정 기준', '', `cohort=${analysis.cohortCount}; candidates=${analysis.candidateCount}; official evaluations=${analysis.officialEvaluationCount}. first divergent leg 0, center chain length 2, Type-2, project selected-record reproduction 및 audited high-level pair-state 전건을 요구했다.`, '', '## CSPICE low-level Type-2 capability', '', `reader=${analysis.cspiceReaderEvaluatorIdentity.readerFunctionName}; evaluator=${analysis.cspiceReaderEvaluatorIdentity.evaluatorFunctionName}; source identity available=${analysis.cspiceReaderEvaluatorIdentity.sourceIdentityAvailable}.`, '', '## Official record reader 계약', '', analysis.cspiceReaderEvaluatorIdentity.readerDeclaration, '', analysis.cspiceReaderEvaluatorIdentity.readerRecordContract, '', '## Official Type-2 evaluator 계약', '', analysis.cspiceReaderEvaluatorIdentity.evaluatorDeclaration, '', `${analysis.cspiceReaderEvaluatorIdentity.evaluatorContract}; state order=${analysis.cspiceReaderEvaluatorIdentity.stateComponentOrder.join(', ')}; units=${analysis.cspiceReaderEvaluatorIdentity.stateUnits.join(', ')}.`, '', '## Record number convention', '', analysis.cspiceReaderEvaluatorIdentity.recordNumberConvention, '', '## Record payload identity', '', `exact=${analysis.recordPayloadExactMatchCount}; mismatch=${analysis.recordPayloadMismatchCount}; official reader bits와 project record bits를 Binary64 전건 비교했다.`, '', '## Exact ET identity', '', 'evidence query ET bits를 native evaluator 입력에 그대로 전달했고 reader용 candidate-selecting ET와 evaluator query ET를 분리 기록했다.', '', '## Selected record project/official 비교', '', `P0 vs O0 exact=${analysis.selectedProjectOfficialExactCount}; one-ULP=${analysis.selectedProjectOfficialOneUlpCount}; over-one-ULP=${analysis.selectedProjectOfficialOverOneUlpCount}.`, '', '## Selected official/high-level 비교', '', `O0 vs H exact=${analysis.officialSelectedHighLevelExactCount}.`, '', '## Previous/next official candidate 비교', '', `O-1 vs H exact=${analysis.officialPreviousHighLevelExactCount}; O+1 vs H exact=${analysis.officialNextHighLevelExactCount}; multiple=${analysis.multipleOfficialCandidateMatchCount}; no-match=${analysis.officialCandidateNoMatchCount}.`, '', '## 기존 82/66 및 기타 분류 교차', '', JSON.stringify(analysis.recordNeighborhoodGroupCrossAnalysis), '', '## Project evaluation trace', '', 'payload exact이고 P0와 O0가 다른 경우에만 project polynomial output/derivative/scale bits를 기록했다. CSPICE 내부 accumulator divergence로 해석하지 않는다.', '', '## 확정 가능한 사항', '', analysis.confirmedFindings.map(value => `- ${value}`).join('\n'), '', '## High-level 선택과 일관되는 후보 설명', '', analysis.candidateExplanations.map(value => `- ${value}`).join('\n'), '', '## 확정할 수 없는 CSPICE 내부 선택', '', analysis.notComputableItems.map(value => `- ${value}`).join('\n'), '', '## 다음 단계 진입 조건', '', 'bounded official low-level evidence가 완성되었으며, high-level 내부 selected segment/record/route/order를 관측했다는 표현은 사용하지 않는다.', '', '## Primary classification', '', JSON.stringify(analysis.primaryClassificationCounts), '', '## Contract state', '', JSON.stringify(analysis.contractState), ''].join('\n')

export async function fresh() { try { const analysis = await analyze(); const summary = await readFile(resolve(ROOT, SUMMARY), 'utf8'); const document = await readFile(resolve(ROOT, MARKDOWN), 'utf8'); return summary === serializeCanonicalJson(analysis) && document === markdown(analysis) ? { status: 'fresh' } : { status: 'stale' } } catch (error) { return { status: 'invalid', error: error.message } } }
export const opts = args => { const options = {}; for (let index = 0; index < args.length; index++) if (args[index].startsWith('--')) options[args[index].slice(2)] = args[index + 1] && !args[index + 1].startsWith('--') ? args[++index] : true; return options }

import { createHash } from 'node:crypto'
import { readFile, stat, writeFile } from 'node:fs/promises'
import { isAbsolute, relative, resolve, sep } from 'node:path'

const toPosix = value => value.split(sep).join('/')

export const DEFAULT_PROPOSAL_INPUTS = {
  candidateSource: 'docs/de405-active-tolerance-candidate.json',
  summary: 'artifacts/de405-jpl-cspice-residual-sweep.summary.json',
  manifest: 'artifacts/de405-jpl-cspice-residual-sweep.manifest.jsonl',
  samples: 'artifacts/de405-jpl-cspice-residual-sweep.samples.jsonl',
  classifications: 'artifacts/de405-jpl-cspice-residual-sweep.classifications.jsonl',
  classificationSummary: 'artifacts/de405-jpl-cspice-residual-sweep.classification-summary.json',
  candidateEvidence: 'artifacts/de405-jpl-cspice-candidate-state-evidence.jsonl',
  investigation: 'artifacts/de405-jpl-cspice-out-of-coverage-investigation.json',
  phaseSummary: 'artifacts/de405-jpl-cspice-phase-c-summary.json',
  worstCase: 'artifacts/de405-jpl-cspice-residual-sweep.worst-case-reproduction.json'
}

export function parseCliOptions(args = []) {
  const options = { ...DEFAULT_PROPOSAL_INPUTS }
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i]
    if (arg.startsWith('--')) {
      const key = arg.slice(2)
      const camelKey = key.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())
      if (key === 'json' || key === 'force') {
        options[camelKey] = true
      } else {
        const val = args[i + 1]
        if (!val || val.startsWith('--')) {
          throw new Error(`${arg} requires a value`)
        }
        options[camelKey] = val
        i += 1
      }
    }
  }
  return options
}

export function sortObjectKeys(obj) {
  if (obj === null || typeof obj !== 'object') return obj
  if (Array.isArray(obj)) return obj.map(sortObjectKeys)
  const sorted = {}
  for (const key of Object.keys(obj).sort()) {
    sorted[key] = sortObjectKeys(obj[key])
  }
  return sorted
}

export function serializeProposalCanonical(proposalObj) {
  const sorted = sortObjectKeys(proposalObj)
  return JSON.stringify(sorted, null, 2) + '\n'
}

export async function inspectFileIdentity(filePath, { cwd = process.cwd() } = {}) {
  const resolvedPath = isAbsolute(filePath) ? filePath : resolve(cwd, filePath)
  const info = await stat(resolvedPath)
  if (!info.isFile()) throw new Error(`Not a regular file: ${filePath}`)
  if (info.size === 0) throw new Error(`File is empty: ${filePath}`)

  const rawBytes = await readFile(resolvedPath)
  const sha256 = createHash('sha256').update(rawBytes).digest('hex')
  const contentText = rawBytes.toString('utf8')

  const isJsonl = filePath.endsWith('.jsonl')
  let recordCount = 0
  let parsedContent = null

  if (isJsonl) {
    if (contentText.length > 0 && !contentText.endsWith('\n')) {
      throw new Error(`JSONL file does not end with newline: ${filePath}`)
    }
    const lines = contentText.split('\n').filter(line => line.trim().length > 0)
    const records = []
    for (let index = 0; index < lines.length; index += 1) {
      try {
        records.push(JSON.parse(lines[index]))
      } catch (err) {
        throw new Error(`Failed to parse JSONL line ${index + 1} in ${filePath}: ${err.message}`)
      }
    }
    recordCount = records.length
    parsedContent = records
  } else {
    try {
      parsedContent = JSON.parse(contentText)
    } catch (err) {
      throw new Error(`Failed to parse JSON in ${filePath}: ${err.message}`)
    }
    if (Array.isArray(parsedContent)) {
      recordCount = parsedContent.length
    } else if (parsedContent && typeof parsedContent === 'object') {
      if (Array.isArray(parsedContent.cases)) {
        recordCount = parsedContent.cases.length
      } else {
        recordCount = 1
      }
    }
  }

  const relativePath = toPosix(relative(cwd, resolvedPath))

  return {
    path: relativePath,
    absolutePath: resolvedPath,
    sizeBytes: info.size,
    sha256,
    recordCount,
    isJsonl,
    parsedContent
  }
}

export function extractCandidateAllowlist(candidateSourceJson) {
  if (!candidateSourceJson || typeof candidateSourceJson !== 'object') {
    throw new Error('blocked_candidate_schema_ambiguous: Candidate source is not a valid JSON object')
  }

  const candidatePayload = {}
  if ('proposals' in candidateSourceJson) candidatePayload.proposals = candidateSourceJson.proposals
  if ('platformScope' in candidateSourceJson) candidatePayload.platformScope = candidateSourceJson.platformScope

  if (Object.keys(candidatePayload).length === 0) {
    throw new Error('blocked_candidate_schema_ambiguous: Candidate source does not contain recognized candidate allowlist fields (proposals, platformScope)')
  }

  return sortObjectKeys(candidatePayload)
}

export async function runProposalPreflight(inputPaths, { cwd = process.cwd() } = {}) {
  const resolvedPaths = {}
  for (const [role, path] of Object.entries(inputPaths)) {
    if (role === 'output' || role === 'force' || role === 'json') continue
    if (!path) throw new Error(`Missing path for input role: ${role}`)
    resolvedPaths[role] = await inspectFileIdentity(path, { cwd })
  }

  const candidateSource = resolvedPaths.candidateSource
  if (inputPaths.output) {
    const normOutput = isAbsolute(inputPaths.output) ? inputPaths.output : resolve(cwd, inputPaths.output)
    if (candidateSource.absolutePath === normOutput) {
      throw new Error(`candidate_source_equals_output: Candidate source path cannot be identical to output path (${normOutput})`)
    }
  }
  const summary = resolvedPaths.summary
  const manifest = resolvedPaths.manifest
  const samples = resolvedPaths.samples
  const classifications = resolvedPaths.classifications
  const classificationSummary = resolvedPaths.classificationSummary
  const candidateEvidence = resolvedPaths.candidateEvidence
  const investigation = resolvedPaths.investigation
  const phaseSummary = resolvedPaths.phaseSummary
  const worstCase = resolvedPaths.worstCase

  // B. Residual Evidence Count
  const manifestCount = manifest.recordCount
  const samplesCount = samples.recordCount
  const summarySampleCount = summary.parsedContent?.summary?.sourceSampleCount ?? summary.parsedContent?.sourceSampleCount ?? summary.parsedContent?.evaluatedSampleCount

  if (manifestCount !== samplesCount) {
    throw new Error(`Preflight count mismatch: manifest count (${manifestCount}) != samples count (${samplesCount})`)
  }
  if (summarySampleCount !== undefined && summarySampleCount !== manifestCount) {
    throw new Error(`Preflight count mismatch: summary sample count (${summarySampleCount}) != manifest count (${manifestCount})`)
  }

  // C. Classification Count & Totals
  const classificationRows = classifications.parsedContent
  const classificationCounts = {}
  const classificationSampleIds = new Set()
  let duplicateCount = 0

  for (const row of classificationRows) {
    const kind = row.classification || row.kind || 'unknown'
    classificationCounts[kind] = (classificationCounts[kind] || 0) + 1
    if (row.sampleId) {
      if (classificationSampleIds.has(row.sampleId)) {
        duplicateCount += 1
      }
      classificationSampleIds.add(row.sampleId)
    }
  }

  const unresolvedCount = (classificationCounts.candidate_state_different || 0) +
                          (classificationCounts.state_equivalent_selection_different || 0) +
                          (classificationCounts.selection_unresolved || 0)

  const outOfCoverageCount = classificationCounts.unexpected_out_of_coverage || 0

  // D. Classification Summary Freshness
  const summaryInputs = classificationSummary.parsedContent?.inputs
  if (summaryInputs) {
    if (summaryInputs.manifestSha256 && summaryInputs.manifestSha256 !== manifest.sha256) {
      throw new Error(`Preflight error: classification summary manifest SHA-256 mismatch (recorded: ${summaryInputs.manifestSha256}, actual: ${manifest.sha256})`)
    }
    if (summaryInputs.samplesSha256 && summaryInputs.samplesSha256 !== samples.sha256) {
      throw new Error(`Preflight error: classification summary samples SHA-256 mismatch (recorded: ${summaryInputs.samplesSha256}, actual: ${samples.sha256})`)
    }
    if (summaryInputs.classificationSha256 && summaryInputs.classificationSha256 !== classifications.sha256) {
      throw new Error(`Preflight error: classification summary classification SHA-256 mismatch (recorded: ${summaryInputs.classificationSha256}, actual: ${classifications.sha256})`)
    }
  }

  // E. Candidate Evidence Match
  const evidenceRows = candidateEvidence.parsedContent
  if (evidenceRows.length !== unresolvedCount) {
    throw new Error(`Preflight error: candidate evidence record count (${evidenceRows.length}) != unresolved count (${unresolvedCount})`)
  }

  const evidenceSampleIds = new Set()
  for (const row of evidenceRows) {
    if (!row.sampleId) throw new Error('Candidate evidence row missing sampleId')
    if (evidenceSampleIds.has(row.sampleId)) {
      throw new Error(`Duplicate sampleId in candidate evidence: ${row.sampleId}`)
    }
    evidenceSampleIds.add(row.sampleId)
  }

  const unresolvedClassificationIds = new Set(
    classificationRows
      .filter(r => r.classification === 'candidate_state_different' || r.classification === 'state_equivalent_selection_different' || r.classification === 'selection_unresolved')
      .map(r => r.sampleId)
  )

  for (const id of unresolvedClassificationIds) {
    if (!evidenceSampleIds.has(id)) {
      throw new Error(`Unresolved classification sampleId missing from candidate evidence: ${id}`)
    }
  }

  // F. Investigation Check
  const investigationCases = investigation.parsedContent?.cases || []
  if (investigationCases.length !== outOfCoverageCount) {
    throw new Error(`Preflight error: investigation case count (${investigationCases.length}) != out-of-coverage count (${outOfCoverageCount})`)
  }

  // G. Phase Summary Check
  const phaseStatus = phaseSummary.parsedContent?.analysisStatus || phaseSummary.parsedContent?.status || 'complete'
  if (phaseStatus !== 'complete') {
    throw new Error(`Preflight error: phase summary status is not complete (${phaseStatus})`)
  }
  const phaseUnresolved = phaseSummary.parsedContent?.selectionUnresolvedCount
  if (phaseUnresolved !== undefined && phaseUnresolved !== unresolvedCount) {
    throw new Error(`Preflight error: phase summary unresolved count (${phaseUnresolved}) != actual unresolved count (${unresolvedCount})`)
  }

  // H. Worst-Case Reproduction Check
  const worstCaseStatus = worstCase.parsedContent?.worstCaseReproduction?.status || worstCase.parsedContent?.reproductionStatus || worstCase.parsedContent?.status
  if (worstCaseStatus !== 'verified') {
    throw new Error(`Preflight error: worst-case reproduction status is not verified (${worstCaseStatus})`)
  }

  // I. Candidate Allowlist Extraction
  const candidatePayload = extractCandidateAllowlist(candidateSource.parsedContent)
  const canonicalPayloadSha256 = createHash('sha256').update(serializeProposalCanonical(candidatePayload)).digest('hex')

  return {
    sources: resolvedPaths,
    counts: {
      sampleCount: manifestCount,
      classificationCount: classifications.recordCount,
      candidateEvidenceCount: candidateEvidence.recordCount,
      unresolvedCount,
      outOfCoverageCount
    },
    classifications: {
      ...classificationCounts,
      total: classifications.recordCount,
      uniqueIdentities: classificationSampleIds.size,
      duplicateIdentities: duplicateCount
    },
    candidate: {
      candidateSourcePath: candidateSource.path,
      candidateSourceSha256: candidateSource.sha256,
      canonicalCandidatePayloadSha256: canonicalPayloadSha256,
      payload: candidatePayload,
      approved: false
    },
    evidenceStatus: {
      phaseStatus: 'complete',
      investigationStatus: 'complete',
      worstCaseVerificationStatus: 'verified',
      scientificApproval: false,
      canonicalSelectionChanged: false
    }
  }
}

export async function generateActiveToleranceProposal(inputPaths, { cwd = process.cwd() } = {}) {
  const preflight = await runProposalPreflight(inputPaths, { cwd })

  const blockers = []
  if (preflight.counts.unresolvedCount > 0) {
    blockers.push(`selection_unresolved=${preflight.counts.unresolvedCount}`)
  }
  if (preflight.counts.outOfCoverageCount > 0) {
    blockers.push(`unexpected_out_of_coverage=${preflight.counts.outOfCoverageCount}`)
  }
  blockers.sort()

  let status = 'pending_scientific_approval'
  if (preflight.counts.unresolvedCount > 0 || preflight.counts.outOfCoverageCount > 0) {
    status = 'blocked_by_unresolved_evidence'
  }

  const sourcesTable = {}
  for (const [role, info] of Object.entries(preflight.sources)) {
    sourcesTable[role] = {
      role,
      path: info.path,
      sizeBytes: info.sizeBytes,
      sha256: info.sha256,
      recordCount: info.recordCount
    }
  }

  const proposalObj = {
    schemaVersion: 2,
    kind: 'de405-active-tolerance-proposal',
    generator: {
      name: 'de405-active-tolerance-proposal-generator',
      version: '1.0.0',
      script: 'scripts/generate-de405-active-tolerance-proposal.mjs',
      outputSchemaVersion: 2
    },
    candidate: preflight.candidate,
    sources: sortObjectKeys(sourcesTable),
    counts: sortObjectKeys(preflight.counts),
    classifications: sortObjectKeys(preflight.classifications),
    evidenceStatus: sortObjectKeys(preflight.evidenceStatus),
    blockers,
    status,
    activeTransition: false,
    contractModified: false
  }

  return sortObjectKeys(proposalObj)
}

export async function validateProposalFreshness(proposalPath, inputPaths = DEFAULT_PROPOSAL_INPUTS, { cwd = process.cwd() } = {}) {
  let proposalRaw = null
  let proposal = null
  const resolvedProposalPath = isAbsolute(proposalPath) ? proposalPath : resolve(cwd, proposalPath)

  try {
    proposalRaw = await readFile(resolvedProposalPath, 'utf8')
    proposal = JSON.parse(proposalRaw)
  } catch (err) {
    return {
      status: 'invalid',
      fresh: false,
      schemaVersion: null,
      error: `Failed to read or parse proposal JSON: ${err.message}`,
      mismatches: []
    }
  }

  if (!proposal || typeof proposal !== 'object' || Array.isArray(proposal)) {
    return {
      status: 'invalid',
      fresh: false,
      schemaVersion: null,
      error: 'Proposal is not a valid JSON object',
      mismatches: []
    }
  }

  const schemaVersion = proposal.schemaVersion
  if (schemaVersion !== 1 && schemaVersion !== 2) {
    return {
      status: 'invalid',
      fresh: false,
      schemaVersion: schemaVersion ?? null,
      error: `Unsupported proposal schema version: ${schemaVersion}`,
      mismatches: []
    }
  }

  const mismatches = []

  if (schemaVersion === 1) {
    // Check v1 recorded sourceSummary
    const sourceSummary = proposal.sourceSummary || {}
    const targets = [
      { key: 'summary', path: inputPaths.summary },
      { key: 'manifest', path: inputPaths.manifest },
      { key: 'samples', path: inputPaths.samples }
    ]

    for (const target of targets) {
      const rec = sourceSummary[target.key]
      if (!rec) {
        mismatches.push({ source: target.key, field: 'sourceSummary', recorded: null, actual: 'missing_v1_record' })
        continue
      }
      try {
        const actual = await inspectFileIdentity(target.path, { cwd })
        if (rec.size !== undefined && rec.size !== actual.sizeBytes) {
          mismatches.push({ source: target.key, field: 'sizeBytes', recorded: rec.size, actual: actual.sizeBytes })
        }
        if (rec.sha256 && rec.sha256 !== actual.sha256) {
          mismatches.push({ source: target.key, field: 'sha256', recorded: rec.sha256, actual: actual.sha256 })
        }
        if (rec.lineCount !== null && rec.lineCount !== undefined && rec.lineCount !== actual.recordCount) {
          mismatches.push({ source: target.key, field: 'recordCount', recorded: rec.lineCount, actual: actual.recordCount })
        }
      } catch (err) {
        mismatches.push({ source: target.key, field: 'file', recorded: target.path, actual: `error: ${err.message}` })
      }
    }

    // Schema v1 lacks provenance for downstream evidence and generator identity
    mismatches.push({
      source: 'provenance',
      field: 'provenanceFields',
      recorded: null,
      actual: 'missing_v1_provenance'
    })

    mismatches.sort((a, b) => a.source.localeCompare(b.source) || a.field.localeCompare(b.field))

    return {
      status: 'stale',
      fresh: false,
      schemaVersion: 1,
      mismatches
    }
  }

  // Schema Version 2 Freshness Check
  const recordedSources = proposal.sources || {}
  const candRec = recordedSources.candidateSource
  if (candRec && (candRec.path === relative(cwd, resolvedProposalPath) || candRec.path.endsWith(proposalPath.split('/').pop()))) {
    mismatches.push({ source: 'candidateSource', field: 'self_reference', recorded: candRec.path, actual: 'candidate_source_equals_proposal_output' })
  }

  for (const [role, inputPath] of Object.entries(inputPaths)) {
    if (role === 'proposal' || role === 'output' || role === 'force' || role === 'json') continue
    const rec = recordedSources[role]
    if (!rec) {
      mismatches.push({ source: role, field: 'provenance', recorded: null, actual: 'missing_source_record' })
      continue
    }
    try {
      const actual = await inspectFileIdentity(inputPath, { cwd })
      if (rec.sizeBytes !== undefined && rec.sizeBytes !== actual.sizeBytes) {
        mismatches.push({ source: role, field: 'sizeBytes', recorded: rec.sizeBytes, actual: actual.sizeBytes })
      }
      if (rec.sha256 && rec.sha256 !== actual.sha256) {
        mismatches.push({ source: role, field: 'sha256', recorded: rec.sha256, actual: actual.sha256 })
      }
      if (rec.recordCount !== undefined && rec.recordCount !== actual.recordCount) {
        mismatches.push({ source: role, field: 'recordCount', recorded: rec.recordCount, actual: actual.recordCount })
      }
    } catch (err) {
      mismatches.push({ source: role, field: 'file', recorded: inputPath, actual: `error: ${err.message}` })
    }
  }

  // Verify counts & blockers against current evidence
  try {
    const actualClassifications = await inspectFileIdentity(inputPaths.classifications, { cwd })
    const rows = actualClassifications.parsedContent || []
    const actualUnresolved = rows.filter(r => r.classification === 'candidate_state_different' || r.classification === 'state_equivalent_selection_different' || r.classification === 'selection_unresolved').length
    const actualOutOfCoverage = rows.filter(r => r.classification === 'unexpected_out_of_coverage').length

    if (proposal.counts?.unresolvedCount !== undefined && proposal.counts.unresolvedCount !== actualUnresolved) {
      mismatches.push({ source: 'counts', field: 'unresolvedCount', recorded: proposal.counts.unresolvedCount, actual: actualUnresolved })
    }
    if (proposal.counts?.outOfCoverageCount !== undefined && proposal.counts.outOfCoverageCount !== actualOutOfCoverage) {
      mismatches.push({ source: 'counts', field: 'outOfCoverageCount', recorded: proposal.counts.outOfCoverageCount, actual: actualOutOfCoverage })
    }

    const expectedBlockers = []
    if (actualUnresolved > 0) expectedBlockers.push(`selection_unresolved=${actualUnresolved}`)
    if (actualOutOfCoverage > 0) expectedBlockers.push(`unexpected_out_of_coverage=${actualOutOfCoverage}`)
    expectedBlockers.sort()

    if (JSON.stringify(proposal.blockers || []) !== JSON.stringify(expectedBlockers)) {
      mismatches.push({ source: 'blockers', field: 'blockers', recorded: proposal.blockers, actual: expectedBlockers })
    }
  } catch (err) {
    mismatches.push({ source: 'classifications', field: 'validation', recorded: 'valid', actual: `error: ${err.message}` })
  }

  mismatches.sort((a, b) => a.source.localeCompare(b.source) || a.field.localeCompare(b.field))

  const isFresh = mismatches.length === 0
  return {
    status: isFresh ? 'fresh' : 'stale',
    fresh: isFresh,
    schemaVersion: 2,
    mismatches
  }
}

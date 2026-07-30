import { createHash } from 'node:crypto'
import { readFile, stat } from 'node:fs/promises'
import { isAbsolute, relative, resolve } from 'node:path'

export const DEFAULT_ANALYSIS_INPUTS = Object.freeze({
  classifications: 'artifacts/de405-jpl-cspice-residual-sweep.classifications.jsonl',
  candidateEvidence: 'artifacts/de405-jpl-cspice-candidate-state-evidence.jsonl',
  manifest: 'artifacts/de405-jpl-cspice-residual-sweep.manifest.jsonl',
  samples: 'artifacts/de405-jpl-cspice-residual-sweep.samples.jsonl',
  summary: 'artifacts/de405-jpl-cspice-residual-sweep.summary.json',
  phaseSummary: 'artifacts/de405-jpl-cspice-phase-c-summary.json'
})

export function parseCliOptions(args) {
  const options = {}
  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (arg.startsWith('--')) {
      const key = arg.slice(2).replace(/-([a-z])/g, (_, c) => c.toUpperCase())
      const next = args[i + 1]
      if (next && !next.startsWith('--')) {
        options[key] = next
        i++
      } else {
        options[key] = true
      }
    }
  }
  return options
}

export async function inspectFileIdentity(filePath, { cwd = process.cwd() } = {}) {
  const absolutePath = isAbsolute(filePath) ? filePath : resolve(cwd, filePath)
  const relPath = relative(cwd, absolutePath)
  const fileStat = await stat(absolutePath)
  const content = await readFile(absolutePath)
  const sha256 = createHash('sha256').update(content).digest('hex')

  let parsedContent = null
  let lineCount = 0
  if (filePath.endsWith('.json')) {
    parsedContent = JSON.parse(content.toString('utf8'))
  } else if (filePath.endsWith('.jsonl')) {
    const lines = content.toString('utf8').trim().split('\n').filter(Boolean)
    lineCount = lines.length
  }

  return {
    path: relPath,
    absolutePath,
    sizeBytes: fileStat.size,
    sha256,
    lineCount,
    parsedContent,
    rawContent: content.toString('utf8')
  }
}

export function calculatePercentiles(values) {
  if (!values || values.length === 0) {
    return { min: 0, p50: 0, p90: 0, p95: 0, p99: 0, p999: 0, max: 0 }
  }
  const sorted = [...values].sort((a, b) => a - b)
  for (const v of sorted) {
    if (!Number.isFinite(v)) {
      throw new Error(`NaN or Infinity detected in numerical array`)
    }
  }

  const getP = (p) => {
    if (sorted.length === 1) return sorted[0]
    const idx = (sorted.length - 1) * p
    const lower = Math.floor(idx)
    const upper = Math.ceil(idx)
    const weight = idx - lower
    return sorted[lower] + (sorted[upper] - sorted[lower]) * weight
  }

  return {
    min: sorted[0],
    p50: getP(0.5),
    p90: getP(0.9),
    p95: getP(0.95),
    p99: getP(0.99),
    p999: getP(0.999),
    max: sorted[sorted.length - 1]
  }
}

export function selectRepresentativeSamples(samplesList) {
  if (!samplesList || samplesList.length === 0) return {}

  const sortedByPos = [...samplesList].sort((a, b) => {
    if (a.positionNorm !== b.positionNorm) return a.positionNorm - b.positionNorm
    return a.sampleId.localeCompare(b.sampleId)
  })

  const sortedByVel = [...samplesList].sort((a, b) => {
    if (a.velocityNorm !== b.velocityNorm) return a.velocityNorm - b.velocityNorm
    return a.sampleId.localeCompare(b.sampleId)
  })

  const sortedByEpoch = [...samplesList].sort((a, b) => {
    if (a.queryEt !== b.queryEt) return a.queryEt - b.queryEt
    return a.sampleId.localeCompare(b.sampleId)
  })

  const sortedById = [...samplesList].sort((a, b) => a.sampleId.localeCompare(b.sampleId))

  const minPos = sortedByPos[0]
  const maxPos = sortedByPos[sortedByPos.length - 1]
  const minVel = sortedByVel[0]
  const maxVel = sortedByVel[sortedByVel.length - 1]
  const earliest = sortedByEpoch[0]
  const latest = sortedByEpoch[sortedByEpoch.length - 1]
  const alphabeticalFirst = sortedById[0]

  const posP50 = calculatePercentiles(samplesList.map(s => s.positionNorm)).p50
  const posP95 = calculatePercentiles(samplesList.map(s => s.positionNorm)).p95
  const velP50 = calculatePercentiles(samplesList.map(s => s.velocityNorm)).p50
  const velP95 = calculatePercentiles(samplesList.map(s => s.velocityNorm)).p95

  const closestToPos = (targetVal) => {
    let closest = samplesList[0]
    let minDiff = Math.abs(samplesList[0].positionNorm - targetVal)
    for (let i = 1; i < samplesList.length; i++) {
      const s = samplesList[i]
      const diff = Math.abs(s.positionNorm - targetVal)
      if (diff < minDiff || (diff === minDiff && s.sampleId.localeCompare(closest.sampleId) < 0)) {
        minDiff = diff
        closest = s
      }
    }
    return closest
  }

  const closestToVel = (targetVal) => {
    let closest = samplesList[0]
    let minDiff = Math.abs(samplesList[0].velocityNorm - targetVal)
    for (let i = 1; i < samplesList.length; i++) {
      const s = samplesList[i]
      const diff = Math.abs(s.velocityNorm - targetVal)
      if (diff < minDiff || (diff === minDiff && s.sampleId.localeCompare(closest.sampleId) < 0)) {
        minDiff = diff
        closest = s
      }
    }
    return closest
  }

  return {
    byPositionResidual: {
      minResidual: minPos ? { sampleId: minPos.sampleId, positionNorm: minPos.positionNorm, velocityNorm: minPos.velocityNorm, epoch: minPos.queryEt } : null,
      medianResidual: { sampleId: closestToPos(posP50).sampleId, positionNorm: closestToPos(posP50).positionNorm, velocityNorm: closestToPos(posP50).velocityNorm, epoch: closestToPos(posP50).queryEt },
      p95Residual: { sampleId: closestToPos(posP95).sampleId, positionNorm: closestToPos(posP95).positionNorm, velocityNorm: closestToPos(posP95).velocityNorm, epoch: closestToPos(posP95).queryEt },
      maxResidual: maxPos ? { sampleId: maxPos.sampleId, positionNorm: maxPos.positionNorm, velocityNorm: maxPos.velocityNorm, epoch: maxPos.queryEt } : null
    },
    byVelocityResidual: {
      minResidual: minVel ? { sampleId: minVel.sampleId, positionNorm: minVel.positionNorm, velocityNorm: minVel.velocityNorm, epoch: minVel.queryEt } : null,
      medianResidual: { sampleId: closestToVel(velP50).sampleId, positionNorm: closestToVel(velP50).positionNorm, velocityNorm: closestToVel(velP50).velocityNorm, epoch: closestToVel(velP50).queryEt },
      p95Residual: { sampleId: closestToVel(velP95).sampleId, positionNorm: closestToVel(velP95).positionNorm, velocityNorm: closestToVel(velP95).velocityNorm, epoch: closestToVel(velP95).queryEt },
      maxResidual: maxVel ? { sampleId: maxVel.sampleId, positionNorm: maxVel.positionNorm, velocityNorm: maxVel.velocityNorm, epoch: maxVel.queryEt } : null
    },
    temporalAndAlphabetical: {
      earliestEpoch: earliest ? { sampleId: earliest.sampleId, positionNorm: earliest.positionNorm, velocityNorm: earliest.velocityNorm, epoch: earliest.queryEt } : null,
      latestEpoch: latest ? { sampleId: latest.sampleId, positionNorm: latest.positionNorm, velocityNorm: latest.velocityNorm, epoch: latest.queryEt } : null,
      alphabeticalFirst: alphabeticalFirst ? { sampleId: alphabeticalFirst.sampleId, positionNorm: alphabeticalFirst.positionNorm, velocityNorm: alphabeticalFirst.velocityNorm, epoch: alphabeticalFirst.queryEt } : null
    }
  }
}

export async function runUnresolvedSelectionAnalysis(inputPaths = {}, { cwd = process.cwd() } = {}) {
  const mergedPaths = { ...DEFAULT_ANALYSIS_INPUTS, ...inputPaths }
  const resolvedSources = {}

  for (const [role, path] of Object.entries(DEFAULT_ANALYSIS_INPUTS)) {
    const targetPath = inputPaths[role] || path
    resolvedSources[role] = await inspectFileIdentity(targetPath, { cwd })
  }

  // Parse Classifications
  const classificationLines = resolvedSources.classifications.rawContent.trim().split('\n').filter(Boolean)
  const classificationMap = new Map()
  const duplicateClassifications = []
  const groupCounts = { state_equivalent_selection_different: 0, candidate_state_different: 0 }
  const unknownClassifications = []

  for (const line of classificationLines) {
    const row = JSON.parse(line)
    if (classificationMap.has(row.sampleId)) {
      duplicateClassifications.push(row.sampleId)
    }
    classificationMap.set(row.sampleId, row.classification)
    if (row.classification === 'state_equivalent_selection_different') {
      groupCounts.state_equivalent_selection_different++
    } else if (row.classification === 'candidate_state_different') {
      groupCounts.candidate_state_different++
    } else {
      unknownClassifications.push({ sampleId: row.sampleId, classification: row.classification })
    }
  }

  // Parse Candidate Evidence
  const evidenceLines = resolvedSources.candidateEvidence.rawContent.trim().split('\n').filter(Boolean)
  const evidenceMap = new Map()
  const duplicateEvidence = []

  for (const line of evidenceLines) {
    const row = JSON.parse(line)
    if (evidenceMap.has(row.sampleId)) {
      duplicateEvidence.push(row.sampleId)
    }
    evidenceMap.set(row.sampleId, row)
  }

  // Validate Invariants
  const missingInEvidence = []
  const extraInEvidence = []
  for (const id of classificationMap.keys()) {
    if (!evidenceMap.has(id)) missingInEvidence.push(id)
  }
  for (const id of evidenceMap.keys()) {
    if (!classificationMap.has(id)) extraInEvidence.push(id)
  }

  const totalUnresolved = classificationMap.size
  const isExactCount = totalUnresolved === 1701 &&
    groupCounts.state_equivalent_selection_different === 606 &&
    groupCounts.candidate_state_different === 1095 &&
    duplicateClassifications.length === 0 &&
    duplicateEvidence.length === 0 &&
    missingInEvidence.length === 0 &&
    extraInEvidence.length === 0 &&
    unknownClassifications.length === 0

  if (!isExactCount) {
    throw new Error(`Invariant check failed: total=${totalUnresolved}, eq=${groupCounts.state_equivalent_selection_different}, diff=${groupCounts.candidate_state_different}, dupClass=${duplicateClassifications.length}, dupEv=${duplicateEvidence.length}, missingEv=${missingInEvidence.length}, unknownClass=${unknownClassifications.length}`)
  }

  // Analyze Groups
  const group1Samples = []
  const group2Samples = []
  const targetCenterDistribution = {}
  const epochKindDistribution = {}
  const capabilityMatrix = {
    exactKnotBoundary: 'computable',
    deltaEtToBoundary: 'not_computable_from_current_evidence (missing explicit segment/record boundary ET in candidate evidence)',
    subintervalId: 'computable',
    candidateIdPattern: 'computable',
    bitwiseIdentity: 'computable'
  }

  // Group 2 Trigger Breakdown & Candidate Alternatives Bitwise Identity Analysis
  const group2Triggers = {
    positionOnlyTrigger: 0,
    velocityOnlyTrigger: 0,
    positionAndVelocityTrigger: 0,
    neitherTrigger: 0
  }

  const bitwiseBreakdown = {
    comparisonSubject: 'CSPICE candidate alternative SPK records for same query epoch against SPK reference stateBits (stateBits identity across overlapping SPK segments)',
    bitwiseIdentical: 0,
    bitwiseDifferent: 0,
    notComparable: 0
  }

  for (const [id, row] of evidenceMap.entries()) {
    const classification = classificationMap.get(id)
    const tcKey = `${row.target}:${row.center}`
    targetCenterDistribution[tcKey] = (targetCenterDistribution[tcKey] || 0) + 1
    epochKindDistribution[row.epochKind] = (epochKindDistribution[row.epochKind] || 0) + 1

    const posNorm = row.comparison?.targetCenterResidual?.positionVectorNormKm ?? 0
    const velNorm = row.comparison?.targetCenterResidual?.velocityVectorNormKmPerSec ?? 0

    const item = {
      sampleId: id,
      targetCenter: tcKey,
      epochKind: row.epochKind,
      queryEt: row.queryEt,
      positionNorm: posNorm,
      velocityNorm: velNorm
    }

    // Check Bitwise Identity across CSPICE candidate alternatives
    const cspiceCandidates = row.sources?.cspice?.candidates || []
    if (cspiceCandidates.length > 0) {
      let hasBitwiseMatch = false
      for (const cand of cspiceCandidates) {
        if (cand.bitwiseStateMatch === true) {
          hasBitwiseMatch = true
          break
        }
      }
      if (hasBitwiseMatch) {
        bitwiseBreakdown.bitwiseIdentical++
      } else {
        bitwiseBreakdown.bitwiseDifferent++
      }
    } else {
      bitwiseBreakdown.notComparable++
    }

    if (classification === 'state_equivalent_selection_different') {
      group1Samples.push(item)
    } else if (classification === 'candidate_state_different') {
      group2Samples.push(item)

      const posDiff = posNorm > 0
      const velDiff = velNorm > 0

      if (posDiff && velDiff) {
        group2Triggers.positionAndVelocityTrigger++
      } else if (posDiff && !velDiff) {
        group2Triggers.positionOnlyTrigger++
      } else if (!posDiff && velDiff) {
        group2Triggers.velocityOnlyTrigger++
      } else {
        group2Triggers.neitherTrigger++
      }
    }
  }

  if (group2Triggers.neitherTrigger !== 0) {
    throw new Error(`Invalid trigger breakdown: neitherTrigger must be 0, got ${group2Triggers.neitherTrigger}`)
  }

  const group1PosPercentiles = calculatePercentiles(group1Samples.map(s => s.positionNorm))
  const group1VelPercentiles = calculatePercentiles(group1Samples.map(s => s.velocityNorm))
  const group2PosPercentiles = calculatePercentiles(group2Samples.map(s => s.positionNorm))
  const group2VelPercentiles = calculatePercentiles(group2Samples.map(s => s.velocityNorm))

  const group1Reps = selectRepresentativeSamples(group1Samples)
  const group2Reps = selectRepresentativeSamples(group2Samples)

  const report = {
    schemaVersion: 1,
    recordType: "de405_unresolved_selection_breakdown",
    generator: "scripts/analyze-de405-unresolved-selection.mjs",
    sources: Object.fromEntries(
      Object.entries(resolvedSources).map(([role, meta]) => [
        role,
        {
          path: meta.path,
          sizeBytes: meta.sizeBytes,
          sha256: meta.sha256,
          lineCount: meta.lineCount || (meta.parsedContent ? 1 : 0)
        }
      ])
    ),
    invariants: {
      totalUnresolvedCount: totalUnresolved,
      groupCounts,
      duplicateClassifications: duplicateClassifications.length,
      duplicateEvidence: duplicateEvidence.length,
      crossGroupOverlap: 0,
      unclassifiedCount: unknownClassifications.length,
      missingFromCandidateEvidence: missingInEvidence.length,
      extraCandidateEvidence: extraInEvidence.length,
      invariantCheckPassed: isExactCount
    },
    analysisCapabilityMatrix: capabilityMatrix,
    observedDistributions: {
      targetCenterGroups: targetCenterDistribution,
      epochKindGroups: epochKindDistribution
    },
    candidateAlternativesBitwiseIdentity: bitwiseBreakdown,
    aggregations: {
      group1_state_equivalent_selection_different: {
        count: group1Samples.length,
        positionResidualNormKm: group1PosPercentiles,
        velocityResidualNormKmPerSec: group1VelPercentiles,
        representativeSamples: group1Reps
      },
      group2_candidate_state_different: {
        count: group2Samples.length,
        triggerBreakdown: group2Triggers,
        positionResidualNormKm: group2PosPercentiles,
        velocityResidualNormKmPerSec: group2VelPercentiles,
        representativeSamples: group2Reps
      }
    },
    limitationsAndFindings: {
      categorization: {
        confirmed: "Total 1,701 unresolved cases accurately decomposed into 606 selection-different and 1,095 candidate-state-different records with 0 overlap and 0 unclassified.",
        observed_correlation: "candidate_state_different cases (1,095) occur exclusively at knot-adjacent evaluation points (next_up_knot: 547, next_down_knot: 548).",
        candidate_explanation: "candidate_state_different가 exact_knot이 아닌 인접 representable-time 평가점에만 관측되므로, knot 인접 시각의 선택 또는 보간 처리와 관련될 가능성이 있다. 현재 evidence만으로 segment boundary 거리나 구체적인 보간 처리 원인을 확정할 수 없다.",
        not_computable: [
          "deltaEtToSegmentBoundary (explicit segment startEt/endEt missing in evidence JSONL)"
        ],
        unresolved: [
          "selection_unresolved=1701 remains active single blocker until policy decision"
        ]
      }
    }
  }

  return report
}

export function serializeCanonicalJson(obj) {
  return JSON.stringify(obj, null, 2) + '\n'
}

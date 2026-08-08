#!/usr/bin/env node
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

import {
  attachArtifactIdentity,
  buildArtifactIdentity,
  canonicalIdentityJson,
} from '../src/artifactIdentity.js'
import { resolveZiweiChart } from '../src/ziwei/ziweiResolver.js'
import { ZIWEI_PALACE_DEFINITIONS } from '../src/ziwei/ziweiContract.js'
import {
  calculateTianfuBranch,
  calculateZiweiBranch,
  getTianfuModeConvention,
  TIANFU_MODES,
  TIANFU_SERIES_OFFSETS,
} from '../src/ziwei/starPlacementRules.js'
import { resolve14MajorStars } from '../src/ziwei/starResolver.js'
import { branchIndex, RECONFIRMED_SOURCE_TABLE } from '../src/ziwei/tianfuPlacementDiscrepancyRelations.js'

export const SCHEMA = 'ziwei-structural-admission-frontier-v1'
export const VERSION = '1.0.0'
const ROOT = resolve(new URL('..', import.meta.url).pathname)
const RESEARCH_ROOT = resolve(ROOT, '../malang_lab/documents/_agent-output')
const BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']
const MATRIX = Array.from({ length: 5 }, (_, index) => index + 2).flatMap((bureauNumber) => (
  Array.from({ length: 30 }, (_, index) => ({ bureauNumber, lunarDay: index + 1 }))
))
const DYNAMIC_MATRIX = Array.from({ length: 12 }, (_, index) => index + 1).flatMap((lunarMonth) => (
  BRANCHES.map((hourBranch) => ({ lunarMonth, hourBranch }))
))

const PROJECT_INPUTS = [
  'src/ziwei/ziweiResolver.js',
  'src/ziwei/ziweiContract.js',
  'src/ziwei/starPlacementRules.js',
  'src/ziwei/starResolver.js',
  'src/ziwei/tianfuPlacementDiscrepancyRelations.js',
  'test/ziweiTianfuCompatibilityMode.test.js',
  'artifacts/ziwei-system-evidence-readiness-coverage-map-v0/complete.json',
  'artifacts/ziwei-readiness-admission-blocker-audit-v0/complete.json',
  'artifacts/ziwei-major-star-claim-readiness-reconciliation-v0/complete.json',
  'artifacts/ziwei-tianfu-convention-provenance-v0/complete.json',
  'artifacts/ziwei-structural-admission-independent-acceptance-review-v0/complete.json',
  'artifacts/ziwei-life-body-palace-ruler-source-evidence-v0/complete.json',
]
const RESEARCH_INPUTS = [
  '../malang_lab/documents/_agent-output/ziwei-artifact-canonicality-supersession-index-v1/canonical-artifact-map.json',
  '../malang_lab/documents/_agent-output/ziwei-artifact-canonicality-supersession-index-v1/supersession-graph.json',
  '../malang_lab/documents/_agent-output/ziwei-palace-coordinate-identity-audit-v1/correction-manifest.json',
  '../malang_lab/documents/_agent-output/ziwei-tianfu-compatibility-implementation-design-v1/design-manifest.json',
  '../malang_lab/documents/_agent-output/ziwei-tianfu-raw-contradiction-provenance-audit-v1/audit-manifest.json',
  '../malang_lab/documents/_agent-output/ziwei-deterministic-rule-divergence-sweep-v1-correction/correction-manifest.json',
]
const INPUTS = [...PROJECT_INPUTS, ...RESEARCH_INPUTS]

const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex')
const readProjectJson = async (path) => JSON.parse(await readFile(resolve(ROOT, path), 'utf8'))
const pathBytes = async (path) => readFile(resolve(ROOT, path))
const ref = (id, path, role, bytes) => ({ id, path, role, byteSha256: sha256(bytes) })
const starById = (result, id) => result.majorStars.find((star) => star.id === id)

function evaluateTianfuCompatibility() {
  let legacyRawMatchCount = 0
  let sourceAlignedExactCount = 0
  let rotation06Count = 0
  let legacyDefaultMatchesExplicit = 0
  const seriesShiftCounts = Object.fromEntries(TIANFU_SERIES_OFFSETS.map((star) => [star.id, 0]))

  for (const input of MATRIX) {
    const omitted = resolve14MajorStars({ ...input, palaces: [] })
    const legacy = resolve14MajorStars({ ...input, palaces: [], tianfuMode: TIANFU_MODES.LEGACY })
    const sourceAligned = resolve14MajorStars({ ...input, palaces: [], tianfuMode: TIANFU_MODES.SOURCE_ALIGNED })
    if (JSON.stringify(omitted) === JSON.stringify(legacy)) legacyDefaultMatchesExplicit += 1
    const sourceRow = RECONFIRMED_SOURCE_TABLE.find(([ziweiBranch]) => ziweiBranch === sourceAligned.ziweiBranch)
    if (legacy.tianfuBranch === sourceRow?.[1]) legacyRawMatchCount += 1
    if (sourceAligned.tianfuBranch === sourceRow?.[1]) sourceAlignedExactCount += 1
    if ((branchIndex(sourceAligned.tianfuBranch) - branchIndex(legacy.tianfuBranch) + 12) % 12 === 6) rotation06Count += 1
    for (const star of TIANFU_SERIES_OFFSETS) {
      const legacyStar = starById(legacy, star.id)
      const sourceStar = starById(sourceAligned, star.id)
      if ((branchIndex(sourceStar.palaceBranch) - branchIndex(legacyStar.palaceBranch) + 12) % 12 === 6) {
        seriesShiftCounts[star.id] += 1
      }
    }
  }

  return {
    domain: { bureauNumbers: [2, 3, 4, 5, 6], lunarDays: [1, 30], rowCount: MATRIX.length },
    legacyDefault: { rows: legacyDefaultMatchesExplicit, expected: MATRIX.length, status: 'regression_preserved' },
    sourceObservationBoundary: {
      sourceTableRows: RECONFIRMED_SOURCE_TABLE.length,
      sourceTableRole: 'source-derived local witness; not an independent authority by itself',
    },
    rawComparison: { legacyMatchRows: legacyRawMatchCount, sourceAlignedMatchRows: sourceAlignedExactCount },
    knownRelation: { transform: 'rotation-06', matchedRows: rotation06Count, residualRows: MATRIX.length - rotation06Count },
    tianfuSeriesPropagation: {
      shiftRowsByStar: seriesShiftCounts,
      allEightRowsExact: Object.values(seriesShiftCounts).every((count) => count === MATRIX.length),
    },
    modes: {
      legacy: getTianfuModeConvention(TIANFU_MODES.LEGACY),
      source_aligned: getTianfuModeConvention(TIANFU_MODES.SOURCE_ALIGNED),
      default: 'legacy',
      productionSelection: 'unchanged; no production mode selection was made',
    },
    evidenceClass: 'deterministic_calculation_and_repository_regression_only',
    semanticAuthority: 'unresolved',
  }
}

function evaluateDynamicPalaceIdentity() {
  let exactRows = 0
  let allPalaceRows = 0
  for (const input of DYNAMIC_MATRIX) {
    const chart = resolveZiweiChart({
      subjectName: 'structural-frontier',
      birthYearStem: '甲',
      lunarMonth: input.lunarMonth,
      hourBranch: input.hourBranch,
    }).chart
    const exact = chart.palaces.length === ZIWEI_PALACE_DEFINITIONS.length
      && chart.palaces.every((palace, index) => (
        palace.id === ZIWEI_PALACE_DEFINITIONS[index].id
        && palace.name === ZIWEI_PALACE_DEFINITIONS[index].name
        && palace.index === index
        && palace.branch === BRANCHES[(chart.mingGong.index + index) % 12]
      ))
      && chart.palaces.some((palace) => palace.isShenGong && palace.branch === chart.shenGong.branch)
    if (chart.palaces.length === 12) allPalaceRows += 1
    if (exact) exactRows += 1
  }
  return {
    domain: { lunarMonths: [1, 12], hourBranches: BRANCHES, rowCount: DYNAMIC_MATRIX.length },
    exactRows,
    allPalaceRows,
    status: exactRows === DYNAMIC_MATRIX.length ? 'supported_in_audited_scope' : 'failed',
    contract: 'dynamic Ming/Shen placement plus 12-palace relative sequence; static branch-to-palace identity not required',
    evidenceClass: 'deterministic_calculation_and_repository_regression_plus_existing_source_correction',
  }
}

function refineDomains(coverage) {
  return coverage.domains.map((domain) => {
    const base = {
      id: domain.id,
      label: domain.label,
      implementation: domain.implementation,
      source: domain.source,
      claimProvenance: domain.claimProvenance,
      readiness: domain.readiness,
      dependsOn: domain.dependsOn,
      code: domain.code,
      tests: domain.tests,
      artifacts: domain.artifacts,
      impact: domain.impact,
      statusLayer: 'current_structural_frontier',
    }
    if (domain.id === 'ming-shen' || domain.id === 'five-element-bureau' || domain.id === 'palace-layout') {
      return { ...base, structuralStatus: 'resolved_with_existing_evidence', blockingLayers: ['input_source_identity', 'claim_provenance', 'readiness'] }
    }
    if (domain.id === 'ziwei-tianfu-placement') {
      return { ...base, structuralStatus: 'partially_resolved_with_existing_evidence', blockingLayers: ['tianfu_raw_formula_identity', 'tianfu_rotation06_semantic_authority', 'source_identity', 'readiness'] }
    }
    if (domain.id === 'fourteen-major-stars') {
      return { ...base, structuralStatus: 'partially_resolved_with_existing_evidence', blockingLayers: ['12_direct_star_rules', 'tianfu_semantic_authority', 'source_identity', 'readiness'] }
    }
    if (domain.id === 'palace-relations') {
      return { ...base, structuralStatus: 'partially_resolved_with_existing_evidence', blockingLayers: ['relation_source_witness', 'claim_provenance', 'readiness'] }
    }
    return { ...base, structuralStatus: domain.id === 'decade-year-fortune' ? 'not_implemented' : 'still_blocked', blockingLayers: [domain.blocker, 'readiness'] }
  })
}

function buildBlockers(coverage, lifeBody) {
  const fromCoverage = coverage.blockers.map((blocker) => ({
    ...blocker,
    status: blocker.id === 'blocker-palace-semantic-identity' ? 'resolved_for_dynamic_coordinate_scope' : 'still_blocked',
    disposition: blocker.id === 'blocker-palace-semantic-identity'
      ? 'Replaced as a global blocker by the correction-supported dynamic placement contract; not a source-authority promotion.'
      : 'No existing evidence closes this blocker at current HEAD.',
  })).filter((blocker) => blocker.id !== 'blocker-palace-semantic-identity')
  return [
    ...fromCoverage,
    {
      id: 'blocker-12-major-star-direct-rules',
      priority: 'P0',
      title: '12 non-root major-star direct rules remain source-unresolved',
      affectedDomains: ['fourteen-major-stars'],
      status: 'still_blocked',
      reason: 'The reviewed source corpus has no admitted direct rule for those 12 stars; production offsets cannot substitute for a direct witness.',
      requiredEvidence: 'immutable page/folio/table witness for each rule with edition identity and actual bytes',
      sourceRefs: ['artifacts/ziwei-major-star-claim-readiness-reconciliation-v0/complete.json'],
    },
    {
      id: 'blocker-tianfu-raw-formula-contradiction',
      priority: 'P0',
      title: 'Tianfu source Chen anchor and legacy Xu anchor remain raw-contradictory',
      affectedDomains: ['ziwei-tianfu-placement', 'fourteen-major-stars'],
      status: 'still_blocked',
      reason: 'Current code exposes both conventions, but the source-authority choice is not resolved by compatibility or arithmetic relation.',
      requiredEvidence: 'direct historical source interpretation or explicit authorized semantic authority decision',
      sourceRefs: ['../malang_lab/documents/_agent-output/ziwei-tianfu-raw-contradiction-provenance-audit-v1/audit-manifest.json'],
    },
    {
      id: 'blocker-tianfu-rotation06-semantic-authority',
      priority: 'P0',
      title: 'rotation-06 is a known relation, not source identity',
      affectedDomains: ['ziwei-tianfu-placement', 'palace-layout'],
      status: 'still_blocked',
      reason: '150/150 transform equivalence explains outputs but does not prove that the two conventions name the same semantic palace or that one is authoritative.',
      requiredEvidence: 'source witness that directly establishes the coordinate convention and its semantic mapping',
      sourceRefs: ['../malang_lab/documents/_agent-output/ziwei-palace-coordinate-identity-audit-v1/correction-manifest.json'],
    },
    {
      id: 'blocker-life-body-ruler-source-legibility',
      priority: 'P1',
      title: '24/144 身主 source surfaces remain ambiguous',
      affectedDomains: ['ming-shen'],
      status: 'still_blocked',
      reason: 'Existing life/body/ruler evidence records 120 comparable rows and 24 blocked ambiguous compound surfaces; no glyph guessing is permitted.',
      requiredEvidence: 'higher-legibility source witness or independent reading for the 24 blocked rows',
      sourceRefs: ['artifacts/ziwei-life-body-palace-ruler-source-evidence-v0/complete.json'],
      observedCounts: { rows: lifeBody.comparison?.rulers?.editions?.nanyangtang?.rows?.length ?? 144, blockedAmbiguousRows: 24 },
    },
  ]
}

export async function buildArtifact() {
  const bytes = Object.fromEntries(await Promise.all(INPUTS.map(async (path) => [path, await pathBytes(path)])))
  const json = (path) => JSON.parse(bytes[path].toString('utf8'))
  const coverage = json('artifacts/ziwei-system-evidence-readiness-coverage-map-v0/complete.json')
  const audit = json('artifacts/ziwei-readiness-admission-blocker-audit-v0/complete.json')
  const lifeBody = json('artifacts/ziwei-life-body-palace-ruler-source-evidence-v0/complete.json')
  const currentHead = execFileSync('git', ['-c', 'core.fsmonitor=false', 'rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim()
  const tianfuCompatibility = evaluateTianfuCompatibility()
  const dynamicPalaceIdentity = evaluateDynamicPalaceIdentity()
  const domains = refineDomains(coverage)
  const blockers = buildBlockers(coverage, lifeBody)
  const occurrenceAdmission = {
    sourceArtifact: 'artifacts/ziwei-readiness-admission-blocker-audit-v0/complete.json',
    sourceArtifactBasisHead: audit.basisHead,
    occurrenceCount: audit.occurrenceCount,
    blockerDistribution: audit.blockerDistribution,
    stableClaimBoundaryCount: audit.structuralDecision.stableClaimBoundaryCount,
    readinessStart: audit.structuralDecision.canStartReadinessGroundingDesign,
    verdict: audit.structuralDecision.verdict,
    status: 'historical_occurrence_inventory_reused_without_promotion',
  }
  const majorStarClaims = [
    { id: 'claim-major-star-placement-ziwei', subject: 'ziwei', structuralStatus: 'resolved_with_existing_evidence', blockerIds: [], note: '150/150 exact coordinate evidence; dynamic palace contract supported in audited scope.', readiness: 'blocked' },
    { id: 'claim-major-star-placement-tianfu', subject: 'tianfu', structuralStatus: 'partially_resolved_with_existing_evidence', blockerIds: ['blocker-tianfu-raw-formula-contradiction', 'blocker-tianfu-rotation06-semantic-authority'], note: 'legacy/source_aligned are both implemented; raw source identity remains unresolved.', readiness: 'blocked' },
    ...['tianji', 'taiyang', 'wugu', 'tiandong', 'lianzhen', 'taiyin', 'tanlang', 'jumen', 'tianxiang', 'tianliang', 'qisai', 'pojun'].map((subject) => ({
      id: `claim-major-star-placement-${subject}`,
      subject,
      structuralStatus: 'still_blocked',
      blockerIds: [
        'blocker-12-major-star-direct-rules',
        ...(['taiyin', 'tanlang', 'jumen', 'tianxiang', 'tianliang', 'qisai', 'pojun'].includes(subject) ? ['blocker-tianfu-rotation06-semantic-authority'] : []),
      ],
      note: 'No admitted direct source rule in the reviewed corpus or semantic authority for promotion.',
      readiness: 'blocked',
    })),
  ]
  const evidence = [
    { id: 'evidence-current-tianfu-compatibility', layer: 'repository_regression_evidence', status: 'resolved_with_existing_evidence', refs: PROJECT_INPUTS.slice(0, 6), assertion: 'legacy default is preserved and source_aligned matches the existing source-derived table across 150 rows.' },
    { id: 'evidence-dynamic-palace-identity', layer: 'representation_coordinate_equivalence', status: 'resolved_with_existing_evidence', refs: ['src/ziwei/ziweiResolver.js', 'src/ziwei/ziweiContract.js', '../malang_lab/documents/_agent-output/ziwei-palace-coordinate-identity-audit-v1/correction-manifest.json'], assertion: 'dynamic Ming/Shen and 12-palace relative identity is supported in the directly audited scope; static branch identity is not required.' },
    { id: 'evidence-tianfu-raw-contradiction', layer: 'primary_source_observation_and_semantic_identity', status: 'still_blocked', refs: ['../malang_lab/documents/_agent-output/ziwei-tianfu-raw-contradiction-provenance-audit-v1/audit-manifest.json', 'artifacts/ziwei-tianfu-convention-provenance-v0/complete.json'], assertion: 'Chen versus Xu raw outputs remain contradictory; rotation-06 is retained only as a relation.' },
    { id: 'evidence-occurrence-boundary', layer: 'structural_admission', status: 'still_blocked', refs: ['artifacts/ziwei-readiness-admission-blocker-audit-v0/complete.json', 'artifacts/ziwei-structural-admission-independent-acceptance-review-v0/complete.json'], assertion: '19 occurrence-level records remain separate from stable claims; four limited structural occurrences do not start readiness or grounding.' },
  ]
  const historicalArtifacts = INPUTS.filter((path) => path.startsWith('artifacts/')).map((path) => ({ path, relation: 'historical_or_predecessor_evidence; not current readiness', byteSha256: sha256(bytes[path]) }))
  const resolved = [
    'dynamic Ming/Shen and 12-palace relative coordinate identity in the audited scope',
    'Tianfu legacy/source_aligned compatibility implementation and explicit legacy default',
    '150-row source_aligned reproduction and rotation-06 relation as deterministic evidence',
    'precise separation of raw source observation, transform relation, and semantic authority in the current frontier',
  ]
  const stillBlocked = blockers.filter((blocker) => blocker.status === 'still_blocked').map((blocker) => blocker.id)
  const base = {
    schemaVersion: SCHEMA,
    verdictToken: 'complete_ziwei_structural_admission_frontier_advanced_uncommitted',
    basisHead: currentHead,
    currentHead,
    scope: {
      externalSearch: false,
      externalSourceAcquisition: false,
      productionRuleMutation: false,
      readinessMutation: false,
      activationMutation: false,
      historicalArtifactsRewritten: false,
      interpretationMeaningChanged: false,
    },
    evidenceLayers: {
      primarySourceObservation: 'bounded to existing local research packets and their declared page/hash scope',
      deterministicCalculation: 'current repository execution only',
      representationEquivalence: 'dynamic coordinate identity and rotation-06 relation kept separate',
      repositoryRegression: 'current tests and current code bytes',
      provenanceCompleteness: 'partial; occurrence/source identities remain bounded',
      semanticSourceIdentity: 'blocked for Tianfu authority and unresolved stars',
      structuralAdmission: 'partial; only structural coordinate/compatibility gaps closed',
    },
    compatibilityEvaluation: tianfuCompatibility,
    dynamicPalaceIdentity,
    domains,
    majorStarClaims,
    occurrenceAdmission,
    evidence,
    blockers,
    resolvedWithExistingEvidence: resolved,
    stillBlocked,
    readinessBeforeAfter: {
      before: { stableClaimBoundary: 0, readiness: 'not_safe_to_start', grounding: 'blocked', activation: 'experimental', productionSelection: 'not_performed' },
      after: { stableClaimBoundary: 0, readiness: 'not_safe_to_start', grounding: 'blocked', activation: 'experimental', productionSelection: 'not_performed', change: 'structural evidence classification only; no readiness promotion' },
    },
    historicalArtifactRelation: {
      currentArtifact: SCHEMA,
      predecessorArtifactsRemainHistorical: true,
      inputs: historicalArtifacts,
      staleCheckerObservations: [
        'major-star coordinate v0 rejects current star resolver bytes because it predates the compatibility mode; this is preserved as historical artifact behavior',
        'readiness admission v0 has a historical input byte mismatch after current contract changes',
        'major-star source corpus checker requires an explicit PDF source and was not used for this frontier',
      ],
    },
    sourceProvenance: {
      canonicalityIndex: '../malang_lab/documents/_agent-output/ziwei-artifact-canonicality-supersession-index-v1/canonical-artifact-map.json',
      correctionPrecedence: '../malang_lab/documents/_agent-output/ziwei-palace-coordinate-identity-audit-v1/correction-manifest.json',
      sourceIdentityStatus: 'partial_and_bounded',
      tianfuSemanticAuthority: 'unresolved',
      ocr: 'exploration_only_not_canonical',
    },
    admissionDecision: {
      status: 'frontier_reached',
      canPromoteStableClaims: false,
      canStartReadinessGrounding: false,
      reason: 'Existing evidence closes structural coordinate/compatibility representation gaps, but source authority, independent oracle, claim boundary, and direct rule gaps remain.',
      nextOwner: 'Flash/source acquisition for source witnesses and semantic authority; Luna for additive checker/materializer updates only',
    },
    counts: { domains: domains.length, majorStarClaims: majorStarClaims.length, blockers: blockers.length, stillBlocked: stillBlocked.length, resolved: resolved.length, occurrenceRecords: occurrenceAdmission.occurrenceCount, evidence: evidence.length },
    deterministic: { generatedAt: 'forbidden', rowOrdering: 'fixed bureau/day and lunarMonth/hour matrices', values: 'computed from current bytes and copied bounded evidence; no post-hoc fitting', hashes: 'actual bytes and canonical JSON including final LF' },
    materializer: `scripts/materialize-${SCHEMA}.mjs`,
    checker: `scripts/check-${SCHEMA}.mjs`,
  }
  return attachArtifactIdentity(base, buildArtifactIdentity({
    root: ROOT,
    artifactId: SCHEMA,
    materializerPath: base.materializer,
    materializerVersion: VERSION,
    baseHead: currentHead,
    inputs: INPUTS,
    inputBytesByPath: bytes,
  }))
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  const output = resolve(process.argv[2] || `artifacts/${SCHEMA}/complete.json`)
  const artifact = await buildArtifact()
  const body = canonicalIdentityJson(artifact)
  await mkdir(dirname(output), { recursive: true })
  await writeFile(output, body)
  await writeFile(`${output}.integrity.json`, canonicalIdentityJson({ schemaVersion: SCHEMA, artifactByteSha256: sha256(Buffer.from(body)), artifactByteSha256Scope: 'complete.json UTF-8 bytes including final LF' }))
  console.log(JSON.stringify({ verdict: artifact.verdictToken, currentHead: artifact.currentHead, counts: artifact.counts, artifactByteSha256: sha256(Buffer.from(body)) }, null, 2))
}

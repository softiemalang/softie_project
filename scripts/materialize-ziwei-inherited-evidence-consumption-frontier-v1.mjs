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
import { buildArtifact as buildPredecessorFrontier } from './materialize-ziwei-structural-admission-frontier-v1.mjs'

export const SCHEMA = 'ziwei-inherited-evidence-consumption-frontier-v1'
export const VERSION = '1.0.0'

const ROOT = resolve(new URL('..', import.meta.url).pathname)
const HANDOFF = '../malang_lab/documents/_agent-output/ziwei-frontier-source-acquisition-v1'
const HANDOFF_FILES = [
  `${HANDOFF}/manifest.json`,
  `${HANDOFF}/source-witness-packets.jsonl`,
  `${HANDOFF}/direct-observation-ledger.jsonl`,
  `${HANDOFF}/blocker-source-status-map.jsonl`,
  `${HANDOFF}/blocker-evidence-crosswalk.json`,
]
const PROJECT_INPUTS = [
  'artifacts/ziwei-structural-admission-frontier-v1/complete.json',
  'artifacts/ziwei-auxiliary-star-placement-core-evidence-v0/complete.json',
  'artifacts/ziwei-auxiliary-star-placement-core-evidence-v0/comparison.json',
  'artifacts/ziwei-auxiliary-star-placement-core-evidence-v0/occurrences.json',
  'artifacts/ziwei-auxiliary-star-placement-core-evidence-v0/production-trace.json',
  'artifacts/ziwei-twelve-major-star-placement-evidence-v0/complete.json',
  'artifacts/ziwei-tianfu-convention-provenance-v0/complete.json',
  'artifacts/ziwei-readiness-admission-blocker-audit-v0/complete.json',
  'src/ziwei/minorStarRules.js',
  'src/ziwei/minorStarResolver.js',
  'src/ziwei/starPlacementRules.js',
  'src/ziwei/starResolver.js',
  'src/interpretationPrep/threeSystemPrepPipeline.js',
  'scripts/materialize-ziwei-auxiliary-star-placement-core-evidence-v0.mjs',
  'scripts/check-ziwei-auxiliary-star-placement-core-evidence-v0.mjs',
  'scripts/materialize-ziwei-twelve-major-star-placement-evidence-v0.mjs',
  'scripts/check-ziwei-twelve-major-star-placement-evidence-v0.mjs',
  'scripts/materialize-ziwei-tianfu-convention-provenance-v0.mjs',
  'scripts/check-ziwei-tianfu-convention-provenance-v0.mjs',
]
const INPUTS = [...PROJECT_INPUTS, ...HANDOFF_FILES]

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const readText = async path => readFile(resolve(ROOT, path), 'utf8')
const readJson = async path => JSON.parse(await readText(path))
const currentHead = () => execFileSync('git', ['-c', 'core.fsmonitor=false', 'rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim()

const MINOR_STARS = [
  { id: 'wenchang', label: '文昌', packetId: 'PKT-MINOR-STARS-V1', codeRefs: ['src/ziwei/minorStarRules.js:26-33', 'src/ziwei/minorStarResolver.js:39-47'] },
  { id: 'wenqu', label: '文曲', packetId: 'PKT-MINOR-STARS-V1', codeRefs: ['src/ziwei/minorStarRules.js:35-40', 'src/ziwei/minorStarResolver.js:39-47'] },
  { id: 'zuofu', label: '左輔', packetId: 'PKT-MINOR-STARS-V1', codeRefs: ['src/ziwei/minorStarRules.js:15-21', 'src/ziwei/minorStarResolver.js:34-38'] },
  { id: 'youbi', label: '右弼', packetId: 'PKT-MINOR-STARS-V1', codeRefs: ['src/ziwei/minorStarRules.js:22-24', 'src/ziwei/minorStarResolver.js:34-38'] },
  { id: 'tiankui', label: '天魁', packetId: 'PKT-MINOR-STARS-V1', codeRefs: ['src/ziwei/minorStarRules.js:44-57', 'src/ziwei/minorStarResolver.js:50-56'] },
  { id: 'tianyue', label: '天鉞', packetId: 'PKT-MINOR-STARS-V1', codeRefs: ['src/ziwei/minorStarRules.js:44-57', 'src/ziwei/minorStarResolver.js:50-56'] },
]
const MAJOR_STARS = [
  { id: 'tianji', series: 'ziwei', packetId: 'PKT-12-MAJOR-STARS-V1' },
  { id: 'taiyang', series: 'ziwei', packetId: 'PKT-12-MAJOR-STARS-V1' },
  { id: 'wugu', series: 'ziwei', packetId: 'PKT-12-MAJOR-STARS-V1' },
  { id: 'tiandong', series: 'ziwei', packetId: 'PKT-12-MAJOR-STARS-V1' },
  { id: 'lianzhen', series: 'ziwei', packetId: 'PKT-12-MAJOR-STARS-V1' },
  { id: 'taiyin', series: 'tianfu', packetId: 'PKT-12-MAJOR-STARS-V1' },
  { id: 'tanlang', series: 'tianfu', packetId: 'PKT-12-MAJOR-STARS-V1' },
  { id: 'jumen', series: 'tianfu', packetId: 'PKT-12-MAJOR-STARS-V1' },
  { id: 'tianxiang', series: 'tianfu', packetId: 'PKT-12-MAJOR-STARS-V1' },
  { id: 'tianliang', series: 'tianfu', packetId: 'PKT-12-MAJOR-STARS-V1' },
  { id: 'qisai', series: 'tianfu', packetId: 'PKT-12-MAJOR-STARS-V1' },
  { id: 'pojun', series: 'tianfu', packetId: 'PKT-12-MAJOR-STARS-V1' },
]

function observationMatches(witness, blockerId, ledger) {
  return ledger.filter(observation => (
    observation.sourceFile === witness.sourceFile
    && observation.sourceFileSha256 === witness.sha256
    && observation.pdfPage === witness.pdfPage
    && observation.relatedBlockers?.includes(blockerId)
  ))
}

function buildPacketEvidence({ manifest, packets, ledger }) {
  const required = ['PKT-MINOR-STARS-V1', 'PKT-12-MAJOR-STARS-V1', 'PKT-TIANFU-RAW-CONTRADICTION-V1']
  const sourceByFile = new Map(manifest.primaryPdfSources.map(source => [source.fileName, source]))
  return required.map(packetId => {
    const packet = packets.find(item => item.packetId === packetId)
    if (!packet) throw new Error(`missing inherited packet:${packetId}`)
    const witnesses = packet.witnesses.map(witness => {
      const source = sourceByFile.get(witness.sourceFile)
      if (!source || source.sha256 !== witness.sha256) throw new Error(`packet source identity mismatch:${packetId}:${witness.sourceFile}`)
      const observations = observationMatches(witness, packet.targetBlockerId, ledger)
      const exactTranscriptionMatches = observations.filter(item => item.exactTranscription === witness.transcription).map(item => item.observationId)
      if (!exactTranscriptionMatches.length) throw new Error(`packet witness has no exact inherited observation:${packetId}:${witness.pdfPage}`)
      return {
        sourceLocator: {
          sourceFile: witness.sourceFile,
          sourceSha256: witness.sha256,
          pdfPage: witness.pdfPage,
          heading: witness.heading,
          transcription: witness.transcription,
        },
        inheritedObservationProvenance: {
          observationIds: observations.map(item => item.observationId),
          exactTranscriptionMatches,
          observationClass: [...new Set(observations.map(item => item.observationClass))],
          observedVsInherited: [...new Set(observations.map(item => item.observedVsInherited))],
          provenance: witness.provenance,
          newlyObservedThisTask: false,
        },
      }
    })
    return {
      packetId: packet.packetId,
      targetBlockerId: packet.targetBlockerId,
      status: packet.status,
      provenanceClass: packet.provenanceClass,
      groundingStatus: packet.groundingStatus,
      unresolvedBoundary: packet.unresolvedBoundary,
      safeActionForLuna: packet.safeActionForLuna,
      witnesses,
    }
  })
}

function packetRefs(packetEvidence, packetId) {
  return packetEvidence.find(packet => packet.packetId === packetId)?.witnesses.flatMap(witness => witness.inheritedObservationProvenance.observationIds) ?? []
}

function buildMinorCoverage({ packetEvidence, auxiliaryComparison, auxiliaryOccurrences, auxiliaryTrace }) {
  const byStar = MINOR_STARS.map(star => {
    const editions = auxiliaryComparison.editionVerdicts.filter(row => row.star === star.id)
    const sourceCells = auxiliaryOccurrences.sourceOccurrences.filter(row => row.sourceStar === star.id && row.status === 'complete')
    const productionRows = auxiliaryOccurrences.productionOccurrences.filter(row => row.star === star.id && row.status === 'implemented')
    return {
      starId: star.id,
      label: star.label,
      sourceObservation: {
        sourceCellCount: sourceCells.length,
        sourceRefs: [...new Set(sourceCells.flatMap(row => row.sourceRefs.map(ref => ref.sourceRef)))].sort(),
        status: 'primary_source_direct_observation; inherited_only',
      },
      productionImplementation: {
        codeRefs: star.codeRefs,
        consumerRefs: ['src/interpretationPrep/threeSystemPrepPipeline.js:181-186', 'src/ziwei/minorStarResolver.js:19-83'],
        productionRowCount: productionRows.length,
        currentRuleSet: 'traditional_v1',
      },
      productionMatch: {
        editionVerdicts: editions.map(row => ({ edition: row.edition, productionOccurrences: row.productionOccurrences, sourceOccurrences: row.sourceOccurrences, verdict: row.verdict, sourceRefs: row.sourceRefs.map(ref => ref.sourceRef) })),
        exactMatch: editions.length === 2 && editions.every(row => row.verdict === 'exact_match'),
        evidenceClass: 'implementation_regression_against_source_cells; not semantic_authority',
      },
      inheritedObservationRefs: packetRefs(packetEvidence, star.packetId),
    }
  })
  return {
    claimScope: 'six implemented lucky stars only',
    byStar,
    allSixExact: byStar.every(row => row.sourceObservation.sourceCellCount > 0 && row.productionMatch.exactMatch),
    uncoveredProductionStars: auxiliaryTrace.missingStars,
    uncoveredBoundary: 'unimplemented auxiliary stars and calendar/time input identity remain outside this resolved claim scope',
    materializer: 'scripts/materialize-ziwei-auxiliary-star-placement-core-evidence-v0.mjs',
    checker: 'scripts/check-ziwei-auxiliary-star-placement-core-evidence-v0.mjs',
  }
}

function buildMajorCoverage({ packetEvidence, majorEvidence }) {
  const byStar = MAJOR_STARS.map(star => {
    const comparison = majorEvidence.comparison.byStar.find(row => row.starId === star.id)
    const normalizedRule = majorEvidence.normalizedRuleTable.find(row => row.id === star.id)
    const sourceRefs = normalizedRule?.sourceRefs ?? []
    return {
      starId: star.id,
      series: star.series,
      sourceObservation: {
        directRuleStatus: 'direct_witness_acquired',
        sourceRefs,
        inheritedObservationRefs: packetRefs(packetEvidence, star.packetId),
        sourceRuleEvidence: star.series === 'ziwei' ? 'p14 紫微星系順逆例' : 'p15 天府星系順逆例',
      },
      productionImplementation: {
        codeRefs: star.series === 'ziwei'
          ? ['src/ziwei/starPlacementRules.js:56-63', 'src/ziwei/starResolver.js:50-67']
          : ['src/ziwei/starPlacementRules.js:67-75', 'src/ziwei/starResolver.js:70-87'],
        consumerRefs: ['src/ziwei/starResolver.js:17-100'],
      },
      relativeRuleMatch: {
        rawMatchCount: comparison.rawMatchCount,
        normalizedMatchCount: comparison.normalizedMatchCount,
        testedOccurrences: comparison.testedOccurrences,
        verdict: comparison.verdict,
        sourceRelationship: comparison.sourceRelationship,
      },
      semanticBoundary: star.series === 'tianfu' ? 'tianfu raw anchor and semantic authority remain unresolved' : 'coordinate-relative rule only; palace semantics and readiness remain blocked',
    }
  })
  return {
    claimScope: '12 non-root relative placement rules; root/semantic identity kept separate',
    byStar,
    allTwelveDirectWitnesses: byStar.every(row => row.sourceObservation.directRuleStatus === 'direct_witness_acquired'),
    ziweiSeries: { starCount: 5, rawExactRows: 750, status: 'direct_relative_rule_match' },
    tianfuSeries: { starCount: 7, normalizedRows: 1050, rawRows: 0, status: 'relative_rule_match_with_semantic_authority_blocked' },
    sourceVsImplementationBoundary: 'source observation, deterministic rule match, coordinate relation, semantic authority, and readiness are distinct fields',
    materializer: 'scripts/materialize-ziwei-twelve-major-star-placement-evidence-v0.mjs',
    checker: 'scripts/check-ziwei-twelve-major-star-placement-evidence-v0.mjs',
  }
}

export async function buildArtifact() {
  const bytes = Object.fromEntries(await Promise.all(INPUTS.map(async path => [path, Buffer.from(await readText(path))])))
  const json = path => JSON.parse(bytes[path].toString('utf8'))
  const manifest = json(`${HANDOFF}/manifest.json`)
  const packets = bytes[`${HANDOFF}/source-witness-packets.jsonl`].toString('utf8').split('\n').filter(Boolean).map(line => JSON.parse(line))
  const ledger = bytes[`${HANDOFF}/direct-observation-ledger.jsonl`].toString('utf8').split('\n').filter(Boolean).map(line => JSON.parse(line))
  const predecessor = json('artifacts/ziwei-structural-admission-frontier-v1/complete.json')
  const previousCurrent = await buildPredecessorFrontier()
  const auxiliary = json('artifacts/ziwei-auxiliary-star-placement-core-evidence-v0/complete.json')
  const auxiliaryComparison = json('artifacts/ziwei-auxiliary-star-placement-core-evidence-v0/comparison.json')
  const auxiliaryOccurrences = json('artifacts/ziwei-auxiliary-star-placement-core-evidence-v0/occurrences.json')
  const auxiliaryTrace = json('artifacts/ziwei-auxiliary-star-placement-core-evidence-v0/production-trace.json')
  const majorEvidence = json('artifacts/ziwei-twelve-major-star-placement-evidence-v0/complete.json')
  const readinessAudit = json('artifacts/ziwei-readiness-admission-blocker-audit-v0/complete.json')
  const packetEvidence = buildPacketEvidence({ manifest, packets, ledger })
  const minorCoverage = buildMinorCoverage({ packetEvidence, auxiliaryComparison, auxiliaryOccurrences, auxiliaryTrace })
  const majorCoverage = buildMajorCoverage({ packetEvidence, majorEvidence })
  const tianfu = previousCurrent.compatibilityEvaluation
  const resolvedBlockerIds = ['blocker-minor-star-source-witness', 'blocker-12-major-star-direct-rules']
  const blockers = predecessor.blockers.map(blocker => {
    if (!resolvedBlockerIds.includes(blocker.id)) return { ...blocker, startingStatus: blocker.status, status: 'still_blocked', currentDisposition: 'Inherited evidence was reviewed but does not close this blocker.' }
    const evidence = blocker.id === 'blocker-minor-star-source-witness'
      ? 'Resolved for the six production-implemented lucky-star rules only; seven unimplemented auxiliary-star rules remain outside scope.'
      : 'Resolved for direct relative rules of all 12 non-root stars; Tianfu raw anchor and semantic authority remain separate blockers.'
    return { ...blocker, startingStatus: blocker.status, status: 'resolved_with_existing_evidence', currentDisposition: evidence, resolvedClaimScope: blocker.id === 'blocker-minor-star-source-witness' ? minorCoverage.claimScope : majorCoverage.claimScope }
  })
  const stillBlocked = blockers.filter(blocker => blocker.status === 'still_blocked').map(blocker => blocker.id)
  const majorStarClaims = [
    { id: 'claim-major-star-placement-ziwei', subject: 'ziwei', series: 'root', status: 'structural_baseline_preserved', blockerIds: [], note: 'Root and dynamic coordinate evidence remain bounded; no readiness promotion.' },
    ...majorCoverage.byStar.map(row => ({
      id: `claim-major-star-placement-${row.starId}`,
      subject: row.starId,
      series: row.series,
      status: row.series === 'ziwei' ? 'resolved_with_existing_evidence' : 'partially_resolved_with_existing_evidence',
      blockerIds: row.series === 'tianfu' ? ['blocker-tianfu-raw-formula-contradiction', 'blocker-tianfu-rotation06-semantic-authority'] : [],
      sourceVsImplementation: row.relativeRuleMatch.verdict,
      readiness: 'blocked',
    })),
    { id: 'claim-major-star-placement-tianfu', subject: 'tianfu', series: 'root', status: 'partially_resolved_with_existing_evidence', blockerIds: ['blocker-tianfu-raw-formula-contradiction', 'blocker-tianfu-rotation06-semantic-authority'], note: 'Legacy/source_aligned modes are preserved; raw source identity remains unresolved.' },
  ]
  const artifactBase = {
    schemaVersion: SCHEMA,
    verdictToken: 'complete_ziwei_inherited_evidence_consumed_frontier_advanced_uncommitted',
    basisHead: currentHead(),
    currentHead: currentHead(),
    predecessor: {
      artifact: 'artifacts/ziwei-structural-admission-frontier-v1/complete.json',
      predecessorBasisHead: predecessor.basisHead,
      predecessorCurrentHead: predecessor.currentHead,
      predecessorWasHistoricalAtThisCheckout: predecessor.currentHead !== currentHead(),
      historicalArtifactRewritten: false,
    },
    scope: {
      networkOrSourceAcquisition: false,
      inheritedObservationPagesNewlyObserved: manifest.pageAccounting.newlyObservedThisTask,
      productionRuleMutation: false,
      readinessMutation: false,
      activationMutation: false,
      historicalArtifactsRewritten: false,
      semanticAuthorityDecision: false,
    },
    packetEvidence,
    sourceIdentity: {
      handoffManifest: `${HANDOFF}/manifest.json`,
      inheritedPrimarySources: manifest.primaryPdfSources.map(source => ({ fileName: source.fileName, sha256: source.sha256, pdfPageCount: source.pdfPageCount, inheritedDirectPagesCount: source.inheritedDirectPagesCount })),
      currentCanonicalEvidence: [
        { artifact: 'artifacts/ziwei-auxiliary-star-placement-core-evidence-v0/complete.json', identities: auxiliary.sourceEvidence.sourceIdentity },
        { artifact: 'artifacts/ziwei-twelve-major-star-placement-evidence-v0/complete.json', identities: { mingNanyang: majorEvidence.source.editions.mingNanyang, nanbeishanren: majorEvidence.source.editions.nanbeishanren } },
      ],
      sourceByteIdentityRole: 'declared SHA-256 identity is preserved; source bytes are not copied or promoted by this artifact',
    },
    sourceVsImplementation: {
      primarySourceDirectObservation: 'packet witness locators and inherited ledger observations',
      deterministicRuleMatch: 'current production resolver outputs against canonical evidence artifacts',
      implementationRegression: 'existing source-evidence checkers/materializers and current code call paths',
      coordinateRepresentationRelation: 'Tianfu rotation-06 only',
      semanticAuthority: 'unresolved where source convention and semantic palace identity are not established',
      readinessAdmission: 'blocked; stable claim boundary remains zero',
    },
    minorStarCoverage: minorCoverage,
    majorStarCoverage: majorCoverage,
    tianfuRawContradiction: {
      packetRefs: packetRefs(packetEvidence, 'PKT-TIANFU-RAW-CONTRADICTION-V1'),
      sourceConvention: { anchor: '辰', formula: '(4-Z)%12', status: 'inherited_direct_observation' },
      legacyConvention: { anchor: '戌', formula: '(10-Z)%12', status: 'production_default_legacy' },
      compatibility: tianfu,
      rawContradictionPreserved: tianfu.rawComparison.legacyMatchRows === 0 && tianfu.rawComparison.sourceAlignedMatchRows === 150,
      semanticAuthority: 'unresolved',
      allowedUse: ['raw contradiction evidence', 'source_aligned opt-in regression', 'rotation-06 coordinate relation'],
      forbiddenUse: ['semantic authority promotion', 'production default change', 'readiness promotion'],
      implementationRefs: ['src/ziwei/starPlacementRules.js:11-75', 'src/ziwei/starResolver.js:17-100', 'test/ziweiTianfuCompatibilityMode.test.js', 'scripts/materialize-ziwei-tianfu-convention-provenance-v0.mjs', 'scripts/check-ziwei-tianfu-convention-provenance-v0.mjs'],
    },
    claims: majorStarClaims,
    blockers,
    resolvedWithExistingEvidence: [
      'six implemented lucky-star direct witnesses and exact source/production regression within the declared scope',
      '12 non-root major-star direct relative rules, with Tianfu semantic authority kept separate',
      'inherited packet-to-ledger-to-canonical-source-artifact cross-reference for all three packets',
    ],
    stillBlocked,
    readinessBeforeAfter: {
      before: { stableClaimBoundary: readinessAudit.structuralDecision.stableClaimBoundaryCount, readiness: 'not_safe_to_start', grounding: 'blocked', activation: 'experimental', productionSelection: 'not_performed' },
      after: { stableClaimBoundary: readinessAudit.structuralDecision.stableClaimBoundaryCount, readiness: 'not_safe_to_start', grounding: 'blocked', activation: 'experimental', productionSelection: 'not_performed', change: 'evidence classification and blocker cross-reference only; no readiness promotion' },
    },
    admissionDecision: {
      status: 'frontier_reached',
      canPromoteStableClaims: false,
      canStartReadinessGrounding: false,
      nextOwner: 'Flash/user source hunt for calendar/time identity, independent oracle, timing domain, remaining life/body legibility, and Tianfu semantic authority; Luna for additive evidence maintenance only',
      reason: 'Two direct-rule blockers are consumed at bounded claim scope. Remaining blockers require new source identity, independent oracle, semantic authority, implementation, or higher-legibility evidence.',
    },
    counts: { startingBlockers: predecessor.blockers.length, endingBlockers: stillBlocked.length, trackedBlockers: blockers.length, resolvedBlockers: blockers.filter(blocker => blocker.status === 'resolved_with_existing_evidence').length, stillBlocked: stillBlocked.length, packets: packetEvidence.length, minorClaims: minorCoverage.byStar.length, majorNonRootClaims: majorCoverage.byStar.length },
    readinessSource: { artifact: 'artifacts/ziwei-readiness-admission-blocker-audit-v0/complete.json', verdict: readinessAudit.structuralDecision.verdict, stableClaimBoundary: readinessAudit.structuralDecision.stableClaimBoundaryCount },
    deterministic: { generatedAt: 'forbidden', packetOrdering: 'fixed packet declaration order', blockerOrdering: 'predecessor frontier order', sourceAndProductionSeparate: true, hashes: 'artifact identity uses actual input bytes' },
    materializer: `scripts/materialize-${SCHEMA}.mjs`,
    checker: `scripts/check-${SCHEMA}.mjs`,
  }
  return attachArtifactIdentity(artifactBase, buildArtifactIdentity({ root: ROOT, artifactId: SCHEMA, materializerPath: artifactBase.materializer, materializerVersion: VERSION, baseHead: artifactBase.basisHead, inputs: INPUTS, inputBytesByPath: bytes }))
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

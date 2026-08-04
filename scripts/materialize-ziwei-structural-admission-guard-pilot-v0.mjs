import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { attachArtifactIdentity, buildArtifactIdentity } from '../src/artifactIdentity.js'
import { buildOccurrenceProvenance } from './materialize-ziwei-occurrence-provenance-v0.mjs'
import { GUARD_SCHEMA, PILOT_RESULTS } from './lib/ziwei-structural-admission-guard.mjs'

export const SCHEMA = 'ziwei-structural-admission-guard-pilot-v0'
export const VERDICT = 'ziwei_structural_admission_guard_pilot_partial_unverified'
export const MATERIALIZER_VERSION = '1.0.0'
export const AUDIT_SCHEMA = 'ziwei-readiness-admission-blocker-audit-v0'
export const AUDIT_PATH = 'artifacts/ziwei-readiness-admission-blocker-audit-v0/complete.json'
export const PROVENANCE_SCHEMA = 'ziwei-occurrence-level-provenance-v0'
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const canonicalJson = value => {
  const sort = v => Array.isArray(v) ? v.map(sort) : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort().map(k => [k, sort(v[k])])) : v
  return `${JSON.stringify(sort(value), null, 2)}\n`
}
const rootOf = () => resolve(new URL('..', import.meta.url).pathname)

function buildRecord(audit, auditOccurrence, provenanceOccurrence) {
  const rawText = provenanceOccurrence.rawText.text
  const admission = auditOccurrence.admission
  return {
    schemaVersion: GUARD_SCHEMA,
    occurrence: {
      occurrenceId: provenanceOccurrence.occurrenceId,
      rawText: { text: rawText, isVerifiedFact: false, epistemicBoundary: 'raw_meaning_candidate_only' },
      provenanceReference: {
        artifact: PROVENANCE_SCHEMA,
        occurrenceId: provenanceOccurrence.occurrenceId,
        source: structuredClone(provenanceOccurrence.source),
        sourceIdentity: structuredClone(provenanceOccurrence.sourceIdentity),
        fixtureReferences: [...provenanceOccurrence.fixtureReferences],
        evidenceReferences: [...provenanceOccurrence.evidenceReferences],
      },
    },
    guard: {
      isStableClaim: false,
      sourceIdentity: { status: 'unresolved_source_identity', independentVerification: false, immutableExternalIdentity: null },
      mustNotAssume: [...admission.mustNotAssume],
      userContextDependency: admission.userContextDependency,
      conflationProhibition: { prohibited: true, occurrenceMerge: false, representativeSentence: false, reason: 'occurrence remains independent; no stable claim or representative sentence' },
      rawTextConsumptionRestriction: admission.rawTextConsumptionRestriction,
      standaloneConsumptionAllowed: false,
      admissionScope: 'pilot_only_literal_occurrence_reference',
      status: 'pilot_only_not_readiness_or_grounding',
      blockedFallbackReason: 'reblock if guard, provenance, source identity, user context, or literal-only boundary cannot be demonstrated',
    },
    assessment: {
      result: 'limited_admission_possible',
      auditState: admission.state,
      blockerBasis: { primary: admission.primaryBlocker, supporting: [...admission.supportingLimitations] },
      additionalStructuralRestrictionRequired: false,
      pilotFailureFallback: 'pilot_reblocked',
    },
    consumerContract: {
      referencePath: 'guard_and_occurrence_envelope_only',
      standaloneConsumptionAllowed: false,
      rawTextOnlyPathAllowed: false,
      interpretationQuestionAdviceRankingPromptAllowed: false,
      wholeReadinessExpansionAllowed: false,
    },
    auditReference: { artifact: AUDIT_SCHEMA, path: AUDIT_PATH, occurrenceId: auditOccurrence.occurrenceId, auditBasisHead: audit.basisHead, selectedBy: 'categoryLists.structuralGuardPossible' },
  }
}

export async function buildStructuralAdmissionGuardPilot() {
  const root = rootOf()
  const audit = JSON.parse(await readFile(resolve(root, AUDIT_PATH), 'utf8'))
  if (audit.schemaVersion !== AUDIT_SCHEMA) throw new Error('audit_schema_mismatch')
  const provenance = await buildOccurrenceProvenance()
  const selectedIds = [...audit.categoryLists.structuralGuardPossible].sort()
  const auditById = new Map(audit.occurrences.map(item => [item.occurrenceId, item]))
  const provenanceById = new Map(provenance.occurrences.map(item => [item.occurrenceId, item]))
  const records = selectedIds.map(id => {
    const auditOccurrence = auditById.get(id); const provenanceOccurrence = provenanceById.get(id)
    if (!auditOccurrence || !provenanceOccurrence) throw new Error(`selected_occurrence_missing:${id}`)
    if (auditOccurrence.admission.state !== 'eligible_after_structural_guard') throw new Error(`selected_occurrence_not_eligible:${id}`)
    return buildRecord(audit, auditOccurrence, provenanceOccurrence)
  })
  return attachArtifactIdentity({
    schemaVersion: SCHEMA, pilotVersion: '1.0.0', verdictToken: VERDICT,
    basisHead: execFileSync('git', ['-c', 'core.fsmonitor=false', 'rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(),
    scope: 'isolated structural admission pilot; not readiness, grounding, interpretation, delivery, or activation',
    sourceAudit: { schemaVersion: audit.schemaVersion, path: AUDIT_PATH, basisHead: audit.basisHead, occurrenceCount: audit.occurrenceCount, selectedPath: 'categoryLists.structuralGuardPossible' },
    sourceProvenance: { schemaVersion: provenance.schemaVersion, occurrenceCount: provenance.occurrences.length, stableClaimBoundary: provenance.stableClaimBoundary.count, sourceIdentity: provenance.sourceIdentityInventorySummary },
    occurrenceCount: records.length, records,
    resultDistribution: Object.fromEntries(PILOT_RESULTS.map(result => [result, records.filter(x => x.assessment.result === result).length])),
    globalBoundary: { stableClaimBoundary: 0, readiness: 'not_safe_to_start', grounding: 'not_safe_to_start', activation: 'experimental', wholeReadinessExpansionAllowed: false, reason: 'pilot-only occurrence references do not close source identity, independent verification, or claim boundaries' },
    invariants: ['candidate IDs come only from audit categoryLists.structuralGuardPossible', 'records remain separate occurrences', 'raw text is never a verified fact', 'unresolved source identity is never hidden', 'frequency does not affect admission', 'no question, interpretation, advice, ranking, or prompt is generated'],
    deterministicContract: { recordOrder: 'lexicographic occurrenceId', occurrenceId: 'preserved from audit/provenance', rawText: 'exact provenance raw text; no normalization', timestamps: 'forbidden', hashScopes: ['canonical artifact payload', 'complete.json UTF-8 bytes including final LF'] },
    consumer: 'scripts/lib/ziwei-structural-admission-guard.mjs',
    materializer: 'scripts/materialize-ziwei-structural-admission-guard-pilot-v0.mjs',
    checker: 'scripts/check-ziwei-structural-admission-guard-pilot-v0.mjs',
    negativeFixture: 'test/fixtures/ziwei/structural-admission-guard-pilot-negative-v0.json',
  }, buildArtifactIdentity({ root, artifactId: SCHEMA, materializerPath: 'scripts/materialize-ziwei-structural-admission-guard-pilot-v0.mjs', materializerVersion: MATERIALIZER_VERSION, baseHead: execFileSync('git', ['-c', 'core.fsmonitor=false', 'rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(), inputs: [AUDIT_PATH, 'scripts/materialize-ziwei-occurrence-provenance-v0.mjs', 'scripts/lib/ziwei-structural-admission-guard.mjs'] }))
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  const target = resolve(process.argv[2] || 'artifacts/ziwei-structural-admission-guard-pilot-v0/complete.json')
  const artifact = await buildStructuralAdmissionGuardPilot(); const body = canonicalJson(artifact)
  await mkdir(dirname(target), { recursive: true }); await writeFile(target, body)
  await writeFile(`${target}.integrity.json`, `${JSON.stringify({ schemaVersion: SCHEMA, artifactByteSha256: sha256(Buffer.from(body)), artifactByteSha256Scope: 'complete.json UTF-8 bytes including final LF' }, null, 2)}\n`)
  console.log(JSON.stringify({ target, basisHead: artifact.basisHead, occurrenceCount: artifact.occurrenceCount, resultDistribution: artifact.resultDistribution, artifactPayloadSha256: artifact.artifactIdentity.artifactPayloadSha256, artifactByteSha256: sha256(Buffer.from(body)) }, null, 2))
}

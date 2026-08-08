import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import {
  TRI_SYSTEM_BOUNDARIES,
  TRI_SYSTEM_READINESS_SCHEMA,
  TRI_SYSTEM_READINESS_VERSION,
  canonicalTriSystemReadinessJson,
  triSystemReadinessContentSha256,
} from '../src/interpretationPrep/triSystemReadinessContract.js'
import { attachArtifactIdentity, buildArtifactIdentity } from '../src/artifactIdentity.js'

export const ARTIFACT_PATH = 'artifacts/astrology-v1-local-integration-milestone-v1/complete.json'
export const MATERIALIZER_VERSION = '1.0.0'
export const INPUT_PATHS = [
  'src/interpretationPrep/evidenceBoundary.js',
  'src/interpretationPrep/triSystemReadinessContract.js',
  'src/interpretationPrep/threeSystemPrepPipeline.js',
  'src/interpretationPrep/unifiedInterpretationContext.js',
  'src/interpretationPrep/handoffFormatters.js',
  'scripts/materialize-astrology-v1-local-integration-milestone-v1.mjs',
  'artifacts/saju-v1-local-frontier-v0/complete.json',
  'artifacts/saju-readiness-grounding-v0.json',
  'artifacts/saju-claim-provenance-v0.json',
  'artifacts/saju-local-source-corpus-observation-v1/complete.json',
  'artifacts/ziwei-readiness-baseline-v1/complete.json',
  'artifacts/ziwei-major-star-claim-readiness-reconciliation-v0/complete.json',
  'artifacts/ziwei-inherited-evidence-consumption-frontier-v1/complete.json',
  'artifacts/astrology-interpretation-handoff-v1/complete.json',
  'artifacts/astrology-interpretation-readiness-v1/complete.json',
  'artifacts/astrology-true-node-independent-v0/complete.json',
]

const root = resolve(new URL('../', import.meta.url).pathname)
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const currentHead = () => execFileSync('git', ['-c', 'core.fsmonitor=false', 'rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim()

async function evidenceRef(path, expectedSchema) {
  const bytes = await readFile(resolve(root, path))
  const artifact = JSON.parse(bytes)
  return {
    path,
    byteSha256: sha256(bytes),
    artifact: {
      schemaVersion: artifact.schemaVersion || null,
      verdictToken: artifact.verdictToken || null,
      generationBaseHead: artifact.artifactIdentity?.generation?.baseHead || artifact.artifactIdentity?.baseHead || artifact.basisHead || null,
      expectedSchema,
    },
    reconciliation: {
      status: (artifact.artifactIdentity?.generation?.baseHead || artifact.artifactIdentity?.baseHead || artifact.basisHead) === currentHead() ? 'current_snapshot' : 'historical_snapshot_preserved',
      historicalArtifactRewritten: false,
    },
  }
}

const blockers = (id, title, requirement, sourceRefs = []) => [{ id, status: 'blocked', title, requirement, sourceRefs }]

export async function buildArtifact() {
  const head = currentHead()
  const refs = {
    saju: await Promise.all([
      evidenceRef('artifacts/saju-v1-local-frontier-v0/complete.json', 'saju-v1-local-frontier-v0'),
      evidenceRef('artifacts/saju-readiness-grounding-v0.json', 'saju-readiness-grounding-evidence-v0'),
      evidenceRef('artifacts/saju-claim-provenance-v0.json', 'saju-claim-provenance-v0'),
      evidenceRef('artifacts/saju-local-source-corpus-observation-v1/complete.json', 'saju-local-source-corpus-observation-v1'),
    ]),
    ziwei: await Promise.all([
      evidenceRef('artifacts/ziwei-readiness-baseline-v1/complete.json', 'ziwei-readiness-baseline-v1'),
      evidenceRef('artifacts/ziwei-major-star-claim-readiness-reconciliation-v0/complete.json', 'ziwei-major-star-claim-readiness-reconciliation-v0'),
      evidenceRef('artifacts/ziwei-inherited-evidence-consumption-frontier-v1/complete.json', 'ziwei-inherited-evidence-consumption-frontier-v1'),
    ]),
    astrology: await Promise.all([
      evidenceRef('artifacts/astrology-interpretation-handoff-v1/complete.json', 'astrology-interpretation-handoff-evidence-v1'),
      evidenceRef('artifacts/astrology-interpretation-readiness-v1/complete.json', 'astrology-interpretation-readiness-evidence-v1'),
      evidenceRef('artifacts/astrology-true-node-independent-v0/complete.json', 'astrology-true-node-independent-frontier-v0'),
    ]),
  }

  const artifact = {
    schemaVersion: TRI_SYSTEM_READINESS_SCHEMA,
    version: TRI_SYSTEM_READINESS_VERSION,
    verdictToken: 'partial_astrology_v1_local_integration_milestone_advanced_uncommitted',
    basisHead: head,
    scope: {
      repositoryOnly: true,
      networkOrSourceAcquisition: false,
      interpretationCreated: false,
      promptOrLlmConnected: false,
      activationMutation: false,
      historicalArtifactsRewritten: false,
    },
    boundaries: TRI_SYSTEM_BOUNDARIES,
    domains: [
      {
        id: 'saju',
        status: 'partial',
        calculation: { status: 'implemented_local_calculation', claim: 'calculation_fact_only' },
        evidence: { status: 'local_observation_with_limits', sourceIdentity: 'local_file_bytes_verified_edition_unresolved', fixtureAuthority: 'regression_or_scoped_match_only' },
        claimInventory: { status: 'complete_scoped_inventory', claimCount: 43, occurrenceCount: 126, stableClaimCount: 0 },
        readiness: { native: 'unchanged_blocked', status: 'blocked', grounding: 'unchanged_unverified', localResearch: 'not_eligible_for_common_envelope', availableForInterpretation: false, userDelivery: 'blocked', productionActivation: 'blocked' },
        blockers: blockers('saju-classical-source-identity', 'local source locators are observed but edition identity and claim-level support remain unresolved', 'identified primary source edition, claim-level support, and independent oracle', ['artifacts/saju-v1-local-frontier-v0/complete.json', 'artifacts/saju-local-source-corpus-observation-v1/complete.json']),
        evidenceRefs: refs.saju,
        propagation: { readinessInheritedFromOtherDomain: false, blockersInheritedFromOtherDomain: false },
      },
      {
        id: 'ziwei',
        status: 'partial',
        calculation: { status: 'implemented_local_calculation', claim: 'coordinate_or_rule_relation_only' },
        evidence: { status: 'partial_unverified', sourceIdentity: 'partial_or_unresolved', fixtureAuthority: 'regression_or_observed_match_not_independent_authority' },
        claimInventory: { status: 'scoped_major_star_packet', claimCount: 14, occurrenceCount: null, stableClaimCount: 0 },
        readiness: { native: 'not_safe_to_start', status: 'blocked', grounding: 'blocked', localResearch: 'allowed_only_within_scoped_evidence', availableForInterpretation: false, userDelivery: 'blocked', productionActivation: 'blocked' },
        blockers: blockers('ziwei-source-semantic-authority', 'source identity, independent oracle, and semantic coordinate authority remain unresolved', 'external source/oracle/semantic authority evidence', ['artifacts/ziwei-inherited-evidence-consumption-frontier-v1/complete.json']),
        evidenceRefs: refs.ziwei,
        propagation: { readinessInheritedFromOtherDomain: false, blockersInheritedFromOtherDomain: false },
      },
      {
        id: 'astrology',
        status: 'complete',
        calculation: { status: 'locally_verified_contract', claim: 'domain_local_evidence_only' },
        evidence: { status: 'complete_for_local_contract', sourceIdentity: 'component_and_runtime_hash_linked', fixtureAuthority: 'independent_candidate_evidence_not_universal_authority' },
        claimInventory: { status: 'complete_domain_packet', claimCount: 53, occurrenceCount: null, stableClaimCount: 0 },
        readiness: { native: 'complete', status: 'complete_local_research_only', grounding: 'complete_local_research_only', localResearch: 'eligible_for_local_interpretation_research', availableForInterpretation: false, userDelivery: 'blocked', productionActivation: 'blocked' },
        blockers: [
          { id: 'astrology-true-node-authority', status: 'blocked', title: 'True Node independent authority and licensing remain unresolved', requirement: 'external authority and licensing decision', sourceRefs: ['artifacts/astrology-true-node-independent-v0/complete.json'] },
          { id: 'astrology-human-review', status: 'blocked', title: 'human review and explicit activation are required', requirement: 'user or authorized product decision', sourceRefs: ['artifacts/astrology-interpretation-readiness-v1/complete.json'] },
        ],
        evidenceRefs: refs.astrology,
        propagation: { readinessInheritedFromOtherDomain: false, blockersInheritedFromOtherDomain: false },
      },
    ],
    propagation: {
      domainReadinessIndependent: true,
      aggregateReadiness: 'not_computed',
      blockedDomains: ['saju', 'ziwei'],
      reason: 'No domain readiness is promoted or copied across domains; the common envelope is blocked until an explicit all-domain gate exists.',
    },
    envelope: {
      status: 'blocked',
      availableForInterpretation: false,
      integrationStatus: 'not_connected',
      domainGate: 'independent_domain_readiness_required',
      allowed: ['calculation facts', 'source/evidence references', 'deterministic relation references', 'epistemic and readiness status'],
      forbidden: ['claim synthesis', 'conflict winner or meaning weight', 'natural-language interpretation', 'prompt or LLM call', 'user delivery', 'production activation'],
      reasonCodes: ['saju_domain_blocked', 'ziwei_domain_blocked', 'common_envelope_not_activated', 'user_delivery_not_authorized', 'production_activation_not_authorized'],
    },
    localEvidence: {
      exhausted: true,
      prioritizedLocalSajuCorpusObserved: true,
      disposition: 'remaining_advancement_requires_edition_identity_independent_oracle_licensing_or_user_decision',
      noNewAuthorityClaim: true,
    },
    contentSha256: null,
  }
  artifact.contentSha256 = triSystemReadinessContentSha256(artifact)
  return artifact
}

export async function writeArtifact(outputPath = ARTIFACT_PATH) {
  const target = resolve(root, outputPath)
  const base = await buildArtifact()
  const identity = buildArtifactIdentity({ root, artifactId: TRI_SYSTEM_READINESS_SCHEMA, materializerPath: 'scripts/materialize-astrology-v1-local-integration-milestone-v1.mjs', materializerVersion: MATERIALIZER_VERSION, baseHead: base.basisHead, inputs: INPUT_PATHS })
  const artifact = attachArtifactIdentity(base, identity)
  const bytes = Buffer.from(canonicalTriSystemReadinessJson(artifact))
  const integrity = { schemaVersion: `${TRI_SYSTEM_READINESS_SCHEMA}-integrity-v1`, artifactPath: outputPath, artifactByteSha256: sha256(bytes), byteLength: bytes.length, hashScope: 'exact UTF-8 bytes of complete.json including final LF' }
  await mkdir(dirname(target), { recursive: true })
  await writeFile(target, bytes)
  await writeFile(`${target}.integrity.json`, canonicalTriSystemReadinessJson(integrity))
  return { output: outputPath, artifactByteSha256: integrity.artifactByteSha256, contentSha256: artifact.contentSha256, blockedDomains: artifact.propagation.blockedDomains }
}

if (process.argv[1] === new URL(import.meta.url).pathname) console.log(JSON.stringify(await writeArtifact(process.argv[2] || ARTIFACT_PATH), null, 2))

import { createHash } from 'node:crypto'

import { canonicalIdentityJson } from '../artifactIdentity.js'

export const SAJU_FIVE_CLASSICS_CLAIM_PROVENANCE_CLOSURE_SCHEMA = 'saju-five-classics-claim-provenance-closure-v0'
export const SAJU_FIVE_CLASSICS_CLAIM_PROVENANCE_CLOSURE_VERSION = '0.1.0'

export const CLAIM_ADJUDICATION_ARTIFACT_PATH = 'artifacts/saju-five-classics-claim-adjudication-v0/complete.json'
export const CLAIM_ADJUDICATION_INTEGRITY_PATH = `${CLAIM_ADJUDICATION_ARTIFACT_PATH}.integrity.json`
export const SOURCE_FRONTIER_ARTIFACT_PATH = 'artifacts/saju-five-classics-source-identity-frontier-v0/complete.json'
export const SOURCE_FRONTIER_INTEGRITY_PATH = `${SOURCE_FRONTIER_ARTIFACT_PATH}.integrity.json`
export const TIMING_AUTHORITY_ARTIFACT_PATH = 'artifacts/saju-timing-authority-frontier-v0/complete.json'
export const TIMING_AUTHORITY_INTEGRITY_PATH = `${TIMING_AUTHORITY_ARTIFACT_PATH}.integrity.json`

export const CLAIM_MATERIALIZER_PATH = 'scripts/materialize-saju-five-classics-claim-adjudication-v0.mjs'
export const CLAIM_MODULE_PATH = 'src/interpretationPrep/sajuFiveClassicsClaimAdjudication.js'
export const TIMING_AUTHORITY_TOKEN_PATH = 'saju-timing-authority-frontier-v0'

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')

export function buildProvenanceSnapshot({
  artifactPath,
  integrityPath,
  artifact,
  artifactBytes,
  integrity,
  integrityBytes,
}) {
  return {
    artifactPath,
    integrityPath,
    artifactByteSha256: sha256(artifactBytes),
    artifactByteLength: artifactBytes.length,
    sidecarByteSha256: sha256(integrityBytes),
    sidecarByteLength: integrityBytes.length,
    integrity: structuredClone(integrity),
    schemaVersion: artifact.schemaVersion || null,
    version: artifact.version || null,
    basisHead: artifact.basisHead || null,
    contentSha256: artifact.contentSha256 || null,
    artifactIdentity: structuredClone(artifact.artifactIdentity || null),
  }
}

export function buildTimingAuthorityRelation({
  claimMaterializerInputPaths = [],
  claimMaterializerSource = '',
  claimModuleSource = '',
  sourceMaterializerSource = '',
  sourceModuleSource = '',
  timingAuthoritySnapshot,
}) {
  const inputPathDependency = claimMaterializerInputPaths.some(path => path.includes(TIMING_AUTHORITY_TOKEN_PATH))
  const claimCodeDependency = [claimMaterializerSource, claimModuleSource]
    .some(source => source.includes(TIMING_AUTHORITY_TOKEN_PATH) || source.includes('sajuTimingAuthority'))
  const sourceCodeDependency = [sourceMaterializerSource, sourceModuleSource]
    .some(source => source.includes(TIMING_AUTHORITY_TOKEN_PATH) || source.includes('sajuTimingAuthority'))
  const generationDependency = inputPathDependency || claimCodeDependency || sourceCodeDependency
  return {
    generationDependency,
    relation: generationDependency ? 'declared_generation_dependency' : 'not_a_generation_dependency',
    scopedClaimIds: ['claim.yuanhai-dayun-start-age'],
    claimMaterializerPath: CLAIM_MATERIALIZER_PATH,
    claimModulePath: CLAIM_MODULE_PATH,
    claimMaterializerInputPaths: [...claimMaterializerInputPaths].sort((left, right) => left.localeCompare(right)),
    evidence: {
      claimMaterializerDeclaresTimingAuthorityInput: inputPathDependency,
      claimMaterializerOrModuleReferencesTimingAuthority: claimCodeDependency,
      sourceFrontierMaterializerOrModuleReferencesTimingAuthority: sourceCodeDependency,
      claimScope: 'section and timing-conversion locator only',
      reason: generationDependency
        ? 'The claim materialization path declares or imports the timing authority frontier.'
        : 'The claim materializer calls the source frontier materializer, and both claim/source code paths contain no timing-authority artifact or module reference; timing authority is an adjacent implementation-mapped frontier, not a claim-generation input.',
    },
    adjacentTimingAuthority: structuredClone(timingAuthoritySnapshot),
  }
}

export function buildSajuFiveClassicsClaimProvenanceClosure({
  basisHead,
  claimAdjudicationSnapshot,
  sourceFrontierSnapshot,
  timingAuthorityRelation,
}) {
  const artifact = {
    schemaVersion: SAJU_FIVE_CLASSICS_CLAIM_PROVENANCE_CLOSURE_SCHEMA,
    version: SAJU_FIVE_CLASSICS_CLAIM_PROVENANCE_CLOSURE_VERSION,
    basisHead,
    publication: {
      kind: 'immutable_historical_identity_closure',
      sourceRevalidationProfile: 'source',
      historicalReplayProfile: 'historical',
      existingV0ArtifactBytesPreserved: true,
      semanticPayloadChanged: false,
      readinessChanged: false,
      promotionChanged: false,
    },
    claimAdjudication: structuredClone(claimAdjudicationSnapshot),
    sourceFrontierPredecessor: structuredClone(sourceFrontierSnapshot),
    timingAuthorityRelation: structuredClone(timingAuthorityRelation),
    readiness: {
      status: 'blocked',
      availableForInterpretation: false,
      productionActivation: 'blocked',
      semanticAuthority: 'not_established',
      stableClaimPromotionCount: 0,
      promotionReadyClaimIds: [],
      reason: 'This closure records immutable provenance only; the claim payload remains historical, bounded, and unpromoted.',
    },
    contentSha256: null,
  }
  artifact.contentSha256 = contentHash(artifact)
  return artifact
}

export function contentHash(artifact) {
  const copy = structuredClone(artifact)
  delete copy.contentSha256
  delete copy.artifactIdentity
  return sha256(Buffer.from(canonicalIdentityJson(copy)))
}

export function checkSajuFiveClassicsClaimProvenanceClosure(artifact, {
  claimAdjudicationSnapshot,
  sourceFrontierSnapshot,
  timingAuthorityRelation,
} = {}) {
  const errors = []
  const fail = message => errors.push(message)
  if (!artifact || typeof artifact !== 'object' || Array.isArray(artifact)) return ['artifact_shape_invalid']
  if (artifact.schemaVersion !== SAJU_FIVE_CLASSICS_CLAIM_PROVENANCE_CLOSURE_SCHEMA) fail('schema_version')
  if (artifact.version !== SAJU_FIVE_CLASSICS_CLAIM_PROVENANCE_CLOSURE_VERSION) fail('version')
  if (artifact.publication?.kind !== 'immutable_historical_identity_closure') fail('publication_kind')
  if (artifact.publication?.sourceRevalidationProfile !== 'source' || artifact.publication?.historicalReplayProfile !== 'historical') fail('profile_boundary')
  if (artifact.publication?.existingV0ArtifactBytesPreserved !== true || artifact.publication?.semanticPayloadChanged !== false || artifact.publication?.readinessChanged !== false || artifact.publication?.promotionChanged !== false) fail('v0_preservation_boundary')
  if (artifact.readiness?.status !== 'blocked' || artifact.readiness?.availableForInterpretation !== false || artifact.readiness?.productionActivation !== 'blocked' || artifact.readiness?.semanticAuthority !== 'not_established' || artifact.readiness?.stableClaimPromotionCount !== 0 || artifact.readiness?.promotionReadyClaimIds?.length !== 0) fail('readiness_or_promotion')
  if (artifact.contentSha256 !== contentHash(artifact)) fail('content_hash')

  if (canonicalIdentityJson(artifact.claimAdjudication) !== canonicalIdentityJson(claimAdjudicationSnapshot)) fail('claim_predecessor_identity')
  if (canonicalIdentityJson(artifact.sourceFrontierPredecessor) !== canonicalIdentityJson(sourceFrontierSnapshot)) fail('source_predecessor_identity')
  if (canonicalIdentityJson(artifact.timingAuthorityRelation) !== canonicalIdentityJson(timingAuthorityRelation)) fail('timing_relation_identity')

  const relation = artifact.timingAuthorityRelation
  if (relation?.generationDependency !== false || relation?.relation !== 'not_a_generation_dependency') fail('timing_generation_dependency_boundary')
  if (relation?.evidence?.claimMaterializerDeclaresTimingAuthorityInput !== false || relation?.evidence?.claimMaterializerOrModuleReferencesTimingAuthority !== false || relation?.evidence?.sourceFrontierMaterializerOrModuleReferencesTimingAuthority !== false) fail('timing_code_path_boundary')
  if (!Array.isArray(relation?.claimMaterializerInputPaths) || relation.claimMaterializerInputPaths.some(path => path.includes(TIMING_AUTHORITY_TOKEN_PATH))) fail('timing_input_path_boundary')

  return [...new Set(errors)].sort()
}

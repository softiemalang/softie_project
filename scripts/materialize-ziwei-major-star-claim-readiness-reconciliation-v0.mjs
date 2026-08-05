import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { attachArtifactIdentity, buildArtifactIdentity } from '../src/artifactIdentity.js'

export const SCHEMA = 'ziwei-major-star-claim-readiness-reconciliation-v0'
export const BASIS_HEAD = '77a17e7b25b330da7b339a1d92338bb53077218f'
export const MATERIALIZER_VERSION = '0.1.0'
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const stable = value => Array.isArray(value) ? value.map(stable) : value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort().map(k => [k, stable(value[k])])) : value
export const canonicalJson = value => `${JSON.stringify(stable(value), null, 2)}\n`
const rootOf = () => resolve(new URL('..', import.meta.url).pathname)
const readJson = async (root, path) => JSON.parse(await readFile(resolve(root, path), 'utf8'))
const git = (root, args) => execFileSync('git', ['-c', 'core.fsmonitor=false', ...args], { cwd: root, encoding: 'utf8' }).trim()
const ref = (id, path, bytes, locator = null) => ({ id, path, byteSha256: sha256(bytes), locator })

const INPUTS = {
  baseline: 'artifacts/ziwei-readiness-baseline-v1/complete.json',
  corpus: 'artifacts/ziwei-major-star-source-corpus-provenance-v0/complete.json',
  coordinate: 'artifacts/ziwei-major-star-coordinate-provenance-v0/complete.json',
  discrepancy: 'artifacts/ziwei-tianfu-placement-discrepancy-analysis-v0/complete.json',
  chain: 'artifacts/ziwei-zixing-tianfu-source-chain-v0/complete.json',
  convention: 'artifacts/ziwei-tianfu-convention-provenance-v0/complete.json',
  production: 'src/ziwei/starPlacementRules.js',
  resolver: 'src/ziwei/starResolver.js',
  palaceContract: 'src/ziwei/ziweiContract.js'
}
const PDF_SHA256 = '4786a94ab454acdabf9716d7c0db4756dbcbde99a88bc45fda254863c1961023'

export async function buildArtifact() {
  const root = rootOf()
  const bytes = Object.fromEntries(await Promise.all(Object.values(INPUTS).map(async path => [path, await readFile(resolve(root, path))])))
  const [baseline, corpus] = await Promise.all([readJson(root, INPUTS.baseline), readJson(root, INPUTS.corpus)])
  const evidenceInventory = [
    { id: 'ev-readiness-baseline', evidenceClass: 'readiness_assertion', artifactRef: ref('artifact-readiness-baseline', INPUTS.baseline, bytes[INPUTS.baseline]), assertion: baseline.verdictToken, scope: 'baseline only; not star truth' },
    { id: 'ev-source-corpus-219-pages', evidenceClass: 'source_corpus_provenance', artifactRef: ref('artifact-source-corpus', INPUTS.corpus, bytes[INPUTS.corpus]), assertion: '219/219 direct review; gap 0', source: { pdfSha256: PDF_SHA256, pageCount: 219, reviewedPages: 219, gap: 0, ocr: 'exploration_only_not_canonical' } },
    { id: 'ev-coordinate-provenance', evidenceClass: 'coordinate_provenance', artifactRef: ref('artifact-coordinate-provenance', INPUTS.coordinate, bytes[INPUTS.coordinate]), assertion: '紫微 150/150 raw; 天府 0/150 raw and 150/150 rotation-06 residual 0' },
    { id: 'ev-tianfu-discrepancy', evidenceClass: 'discrepancy_analysis', artifactRef: ref('artifact-tianfu-discrepancy', INPUTS.discrepancy, bytes[INPUTS.discrepancy]), assertion: 'existing baseline 25 match / 125 mismatch; first divergence integrated-bureau-2-day-01' },
    { id: 'ev-source-chain', evidenceClass: 'source_chain', artifactRef: ref('artifact-source-chain', INPUTS.chain, bytes[INPUTS.chain]), assertion: '150-row 紫微→天府 chain; exact Ziwei and transform-equivalent Tianfu' },
    { id: 'ev-convention', evidenceClass: 'convention_provenance', artifactRef: ref('artifact-tianfu-convention', INPUTS.convention, bytes[INPUTS.convention]), assertion: 'rotation-06 and source-base-direction each 150/150; semantic identity unresolved' },
    { id: 'ev-production-rule', evidenceClass: 'calculation_git_provenance', artifactRef: ref('production-star-placement-rules', INPUTS.production, bytes[INPUTS.production], 'calculateZiweiBranch; calculateTianfuBranch; star offsets') },
    { id: 'ev-production-resolver', evidenceClass: 'calculation_git_provenance', artifactRef: ref('production-star-resolver', INPUTS.resolver, bytes[INPUTS.resolver], 'resolve14MajorStars; palace lookup by branch') },
    { id: 'ev-palace-contract', evidenceClass: 'semantic_coordinate_boundary', artifactRef: ref('production-palace-contract', INPUTS.palaceContract, bytes[INPUTS.palaceContract], 'ZIWEI_PALACE_DEFINITIONS') }
  ]
  const sourceReferences = [
    { id: 'source-corpus-219-pages', kind: 'source_witness', pdfSha256: PDF_SHA256, pageCount: 219, scope: '219/219 direct review; gap 0' },
    { id: 'source-pdf-pages-11-12', kind: 'source_locator', pages: [11, 12], locator: 'PDF p11 三十一 起紫微五訣; p12 三十三 起紫微簡索表', canonicalText: false },
    { id: 'source-pdf-pages-13', kind: 'source_locator', pages: [13], locator: 'PDF p13 三十四 甲六、安天府, right scanned leaf', canonicalText: false }
  ]
  const claims = corpus.inventory.map(item => {
    const status = item.starId === 'ziwei' ? 'evidence_sufficient_within_scope' : item.starId === 'tianfu' ? 'transform_verified_semantics_unresolved' : 'source_scope_exhausted_unresolved'
    const evidenceIds = item.starId === 'ziwei' ? ['ev-source-corpus-219-pages', 'ev-coordinate-provenance', 'ev-production-rule', 'ev-production-resolver'] : item.starId === 'tianfu' ? ['ev-source-corpus-219-pages', 'ev-coordinate-provenance', 'ev-tianfu-discrepancy', 'ev-source-chain', 'ev-convention', 'ev-production-rule', 'ev-production-resolver'] : ['ev-source-corpus-219-pages', 'ev-coordinate-provenance', 'ev-production-rule', 'ev-production-resolver']
    return {
      id: `claim-major-star-placement-${item.starId}`,
      subject: { starId: item.starId, traditionalName: item.traditionalName },
      predicate: 'has_placement_rule_evidence',
      valueDomain: { kind: 'earthly_branch_coordinate', enum: '子=0..亥=11', semantics: 'coordinate token only; palace identity not implied' },
      contextKey: 'ziwei-major-star-placement-150-row-coordinate-v0',
      sourceRefs: item.sourcePages?.length ? [`source-pdf-pages-${item.sourcePages.join('-')}`] : ['source-corpus-219-pages'],
      artifactRefs: evidenceIds,
      calculationGitProvenance: ['ev-production-rule', 'ev-production-resolver'],
      evidenceClass: item.sourceStatus === 'direct_rule' ? 'direct_coordinate_or_transform_relation' : 'source_scope_inventory_negative',
      evidenceStatus: status,
      blockers: item.starId === 'ziwei' || item.starId === 'tianfu' ? ['blocker-palace-semantic-identity'] : ['blocker-direct-rule-absent', 'blocker-palace-semantic-identity'],
      readinessImpact: 'not_eligible_for_interpretation',
      boundedAssertion: item.starId === 'ziwei' ? '150/150 exact raw branch comparison within recorded coordinate context.' : item.starId === 'tianfu' ? '150/150 transform relation with residual 0; raw identity and palace semantics remain unresolved.' : 'No admitted direct source rule in the reviewed 219-page corpus; no placement claim is promoted.'
    }
  })
  const contextRegistry = [
    { key: 'integrated-baseline-v0', denominator: 150, count: { match: 25, mismatch: 125 }, definition: 'existing production comparison; preserved independently', firstDivergence: 'integrated-bureau-2-day-01' },
    { key: 'tianfu-neutral-raw-v0', denominator: 150, count: { exact: 0, mismatch: 150 }, definition: 'source and integrated branch ordinals without transform' },
    { key: 'tianfu-rotation-06-v0', denominator: 150, count: { transformEquivalent: 150, residual: 0 }, definition: 'source Tianfu ordinal = integrated Tianfu ordinal + 6 mod 12' },
    { key: 'source-corpus-direct-review-v0', denominator: 219, count: { reviewed: 219, gap: 0 }, definition: 'all PDF pages reviewed; no page silently omitted' },
    { key: 'major-star-coordinate-domain-v0', denominator: 150, count: { rows: 150 }, definition: 'bureau 2..6 x lunar day 1..30, bureau then day' }
  ]
  const relations = [
    ['relation-baseline-supported-by', 'ev-readiness-baseline', 'context-integrated-baseline-v0', 'supported_by'],
    ['relation-corpus-supported-by', 'ev-source-corpus-219-pages', 'context-source-corpus-direct-review-v0', 'supported_by'],
    ['relation-ziwei-exact', 'claim-major-star-placement-ziwei', 'ev-coordinate-provenance', 'exact_match'],
    ['relation-ziwei-derived', 'claim-major-star-placement-ziwei', 'ev-source-corpus-219-pages', 'derived_from'],
    ['relation-tianfu-transform', 'claim-major-star-placement-tianfu', 'ev-convention', 'transform_equivalent'],
    ['relation-tianfu-context', 'claim-major-star-placement-tianfu', 'context-integrated-baseline-v0', 'context_differs'],
    ['relation-tianfu-derived', 'claim-major-star-placement-tianfu', 'ev-source-chain', 'derived_from'],
    ...claims.filter(c => !['ziwei', 'tianfu'].includes(c.subject.starId)).map(c => [`relation-${c.id}-unresolved`, c.id, 'blocker-direct-rule-absent', 'unresolved_source']),
    ...claims.map(c => [`relation-${c.id}-semantic-block`, c.id, 'blocker-palace-semantic-identity', 'blocked_by'])
  ].map(([id, from, to, type]) => ({ id, from, to, type }))
  const blockers = [
    { id: 'blocker-direct-rule-absent', category: 'source_rule', title: '12 major stars lack an admitted direct original-text rule', affectedClaims: claims.filter(c => !['ziwei', 'tianfu'].includes(c.subject.starId)).map(c => c.id), requiredEvidence: 'immutable source witness for each star rule with page/folio/table locator and actual-byte identity', resolutionCondition: 'independent review confirms exact rule shape, inputs, outputs, and boundaries', whyNoBypass: 'production offsets and indirect dependencies cannot substitute for direct source rule evidence' },
    { id: 'blocker-palace-semantic-identity', category: 'semantic_coordinate', title: 'palace label/ordinal identity evidence is absent', affectedClaims: claims.map(c => c.id), requiredEvidence: 'authoritative shared mapping between source branch tokens, palace labels, and repository ordinal/branch coordinates', resolutionCondition: 'same mapping independently evidenced for source and production contexts', whyNoBypass: 'numeric exactness or a transform does not establish that tokens name the same palace' }
  ]
  const readiness = { calculation: 'implemented_unverified', source: 'partial_unverified', relation: 'implemented_unverified', semantic: 'blocked_semantic_identity_insufficient', claim: 'claim_level_packet_only; no stable truth claim promotion', grounding: 'blocked', activation: 'experimental', localResearchAudit: 'allowed_within_coordinate_and_provenance_scope', userInterpretation: 'forbidden', productionSelection: 'not_performed', mutationBoundary: { productionRule: false, apiSchema: false, enum: false, tolerance: false, baseline: false, existingReadiness: false } }
  const handoff = { verdictToken: 'complete_ziwei_major_star_claim_readiness_reconciliation_evidence_uncommitted', conclusions: ['14 placement claims are normalized at coordinate-evidence level only.', '紫微 is exact within scope; 天府 has a verified transform with unresolved semantics; 12 stars remain source-unresolved.', '219/219 corpus review has gap 0 and does not create direct rules for the 12 unresolved stars.'], blockers: blockers.map(x => x.id), requiredBeforeProductionChoice: ['direct rules for 12 unresolved stars', 'shared palace label/ordinal correspondence', 'independent semantic review', 'explicit authorized production decision'], mustNotDo: ['interpretation', 'ranking or weighting', 'production rule change', 'API/schema/readiness/grounding/activation change'] }
  const sourceAcquisitionSpec = { externalSearch: 'not performed', requiredDocumentTypes: ['immutable scan/page-image witness', 'edition/title/author/editor/lineage record', 'page/folio/section locator', 'independent reviewer record'], requiredRuleForms: ['explicit star-to-branch table', 'algorithmic progression with base/direction', 'input/output domain and boundary cases', 'relationship rule only when explicitly stated'], palaceCorrespondence: ['source branch label to palace label', 'palace label to repository ordinal', 'branch token to production palace branch', 'direction/base conventions'], editionComparison: ['same input domain and row ordering', 'page/folio alignment', 'glyph and table orientation review', 'actual retrieved bytes and hash', 'preserve disagreement by edition/context'] }
  const base = { schemaVersion: SCHEMA, verdictToken: handoff.verdictToken, basisHead: BASIS_HEAD, sourceReferences, evidenceInventory, contextRegistry, claims, evidenceSufficiencyReview: claims.map(c => ({ claimId: c.id, status: c.evidenceStatus, sufficientWithinScope: c.evidenceStatus === 'evidence_sufficient_within_scope', notEligibleForInterpretation: true, reviewNote: c.boundedAssertion })), relationGraph: { nodeIds: [...sourceReferences.map(x => x.id), ...evidenceInventory.map(x => x.id), ...contextRegistry.map(x => `context-${x.key}`), ...claims.map(x => x.id), ...blockers.map(x => x.id)], relations }, blockerRegistry: blockers, layeredReadiness: readiness, humanReviewHandoff: handoff, sourceAcquisitionSpec, protectedInputs: Object.values(INPUTS).map(path => ({ path, byteSha256: sha256(bytes[path]) })), gitProvenance: { basisHead: BASIS_HEAD, observedHead: git(root, ['rev-parse', 'HEAD']), productionRuleOrigin: '7d2fb8fccc65ab34efea93ea2d16f94fb526417c', sourceAuthority: false }, deterministic: { generatedAt: 'forbidden', canonicalBytes: 'UTF-8 JSON with final LF and recursively sorted object keys', claimOrder: 'corpus inventory order', values: 'copied or bounded from input artifacts; no post-hoc fitting' }, materializer: `scripts/materialize-${SCHEMA}.mjs`, checker: `scripts/check-${SCHEMA}.mjs` }
  return attachArtifactIdentity(base, buildArtifactIdentity({ root, artifactId: SCHEMA, materializerPath: base.materializer, materializerVersion: MATERIALIZER_VERSION, baseHead: BASIS_HEAD, inputs: Object.values(INPUTS) }))
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  const root = rootOf(); const dir = resolve(process.argv[2] || `artifacts/${SCHEMA}`); const artifact = await buildArtifact(); await mkdir(dir, { recursive: true })
  const outputs = { complete: artifact, evidenceInventory: artifact.evidenceInventory, contextRegistry: artifact.contextRegistry, claimLedger: artifact.claims, evidenceSufficiencyReview: artifact.evidenceSufficiencyReview, relationGraph: artifact.relationGraph, blockerRegistry: artifact.blockerRegistry, layeredReadiness: artifact.layeredReadiness, humanReviewHandoff: artifact.humanReviewHandoff, sourceAcquisitionSpec: artifact.sourceAcquisitionSpec }
  for (const [name, value] of Object.entries(outputs)) { const out = Buffer.from(canonicalJson(value)); const path = resolve(dir, `${name}.json`); await writeFile(path, out); await writeFile(`${path}.integrity.json`, canonicalJson({ schemaVersion: SCHEMA, artifactByteSha256: sha256(out), artifactByteSha256Scope: 'UTF-8 bytes including final LF' })) }
  console.log(JSON.stringify({ verdict: artifact.verdictToken, inventory: artifact.evidenceInventory.length, claims: artifact.claims.length, statuses: Object.fromEntries([...new Set(artifact.claims.map(x => x.evidenceStatus))].map(status => [status, artifact.claims.filter(x => x.evidenceStatus === status).length])), relations: artifact.relationGraph.relations.length, blockers: artifact.blockerRegistry.length }, null, 2))
}

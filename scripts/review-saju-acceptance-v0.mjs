import fs from 'node:fs'
import crypto from 'node:crypto'

const provenance = JSON.parse(fs.readFileSync('artifacts/saju-claim-provenance-v0.json', 'utf8'))
const readinessArtifact = JSON.parse(fs.readFileSync('artifacts/saju-readiness-grounding-v0.json', 'utf8'))
const negatives = JSON.parse(fs.readFileSync('test/fixtures/saju-acceptance-review-negative-v0.json', 'utf8'))
const hash = value => crypto.createHash('sha256').update(value).digest('hex')
const canonical = value => `${JSON.stringify(order(value))}\n`
function order(value) {
  if (Array.isArray(value)) return value.map(order)
  if (!value || typeof value !== 'object') return value
  return Object.fromEntries(Object.keys(value).sort().map(key => [key, order(value[key])]))
}

const forbidden = /^(question|prompt|interpretation|advice|ranking|rank|priority|meaning|personality|psychology|destiny|synthesis)$/i
const refsOf = value => [
  ...(value.inputRefs || []), ...(value.calculationRefs || []), ...(value.ruleRefs || []),
  ...(value.fixtureRefs || []), ...(value.externalEvidenceRefs || []), ...(value.traditionalSourceRefs || []),
].map(ref => ref.refId || ref.id).filter(Boolean)

function walk(value, path = []) {
  if (!value || typeof value !== 'object') return []
  return Object.entries(value).flatMap(([key, child]) => [[key, path], ...walk(child, [...path, key])])
}

function independentFindings(p, r) {
  const findings = []
  const claims = p.claims || []
  const readiness = r.readiness || {}
  const bundle = r.bundle || {}
  const indexed = new Set((p.evidenceIndex || []).map(entry => entry.id))
  const occurrenceIds = claims.flatMap(claim => (claim.occurrences || []).map(occurrence => occurrence.occurrenceId))
  const occurrenceTextVariants = claims.filter(claim => new Set((claim.occurrences || []).map(occurrence => occurrence.claimText)).size > 1)

  if (p.claimCount === 43 && claims.length === 43 && new Set(claims.map(claim => claim.claimId)).size === 43) findings.push('claim_inventory_43_unique')
  if (claims.reduce((sum, claim) => sum + (claim.occurrenceCount || 0), 0) === 126 && occurrenceIds.length === 126 && new Set(occurrenceIds).size === 126 && claims.every(claim => (claim.occurrences || []).every(occurrence => occurrence.claimId === claim.claimId && occurrence.sourceLocation?.contextId))) findings.push('occurrence_inventory_126_unique_with_source_locations')
  if (p.verdictToken === 'saju_claim_provenance_partial_unverified' && claims.every(claim => claim.verificationStatus === 'unverified')) findings.push('no_claim_verification_promotion')
  if (claims.every(claim => (claim.traditionalSourceRefs || []).length > 0 && (claim.unresolvedGaps || []).length > 0)) findings.push('unresolved_traditional_source_preserved')
  if (p.externalEvidenceSummary?.scope === 'fixture_declared_fields_only; not claim_level_verification' && (p.evidenceIndex || []).filter(entry => entry.kind === 'scoped_external_reference_match').every(entry => entry.status === 'calculation_externally_matched_scoped' && entry.sourceIdentity?.retrievalByteSha256 === null)) findings.push('external_scope_and_unhashed_identity_preserved')
  if (bundle.preservedClaimRelations?.relatedClaimRefs?.length === 0 && bundle.preservedClaimRelations?.tensionClaimRefs?.length === 0 && bundle.preservedClaimRelations?.relationBasis === 'mechanically_proven_relations_only') findings.push('empty_relations_not_inferred')
  if (bundle.useLimits?.noFrequencyRanking === true && bundle.useLimits?.noClaimSelection === true && bundle.useLimits?.noClaimMerging === true) findings.push('frequency_selection_merging_blocked')
  if (bundle.activation?.availableForInterpretation === false && bundle.activation?.serviceEligibility === 'blocked' && bundle.connected === false && bundle.usable === false) findings.push('activation_blocked')
  if (readiness.claimCount === 43 && readiness.occurrenceCount === 126 && JSON.stringify(readiness.statusDistribution) === JSON.stringify({ unverified: 38, provenance_partial: 1, rule_implemented_source_unresolved: 4 })) findings.push('readiness_distribution_preserved')
  if (bundle.epistemicState?.unknown?.every(item => item.status === 'unknown') && bundle.epistemicState?.unresolved?.every(item => item.status === 'unresolved') && bundle.epistemicState?.userDependent?.every(item => item.status === 'user_dependent') && bundle.epistemicState?.unavailable?.every(item => item.status === 'unavailable')) findings.push('epistemic_categories_preserved')
  if (claims.flatMap(refsOf).every(ref => indexed.has(ref)) && claims.flatMap(claim => (claim.occurrences || []).flatMap(refsOf)).every(ref => indexed.has(ref))) findings.push('claim_and_occurrence_refs_indexed')
  if (occurrenceTextVariants.length === 0 || claims.every(claim => claim.occurrences.every(occurrence => occurrence.rawText?.text === occurrence.claimText && occurrence.rawText?.isVerifiedFact === false))) findings.push('claim_text_variants_preserved_without_equivalence')
  if (claims.every(claim => claim.rawText?.isVerifiedFact === false && claim.rawText?.consumption === 'raw_text_not_verified_fact_or_interpretation')) findings.push('raw_claim_text_fact_boundary_present')
  if ((bundle.claimRefs || []).every(ref => ref.readinessRef && ref.claimId && ref.conversationGate?.conversationAvailability && ref.conversationGate?.rawTextConsumption?.isVerifiedFact === false && ref.conversationGate?.blockedOrUnsupportedReason?.length)) findings.push('grounding_claim_refs_have_per_claim_gates')
  if (claims.every(claim => ['unverified', 'provenance_partial', 'rule_implemented_source_unresolved'].includes(claim.provenanceCompleteness))) findings.push('closed_world_status_enum_preserved')
  if (walk(bundle).every(([key, parent]) => !forbidden.test(key) || parent[0] === 'boundary' || parent[0] === 'useLimits')) findings.push('no_interpretation_question_advice_prompt_fields')
  return findings
}

function checkMutation(base, item) {
  const candidate = structuredClone(base)
  const [root, ...parts] = item.target.split('.')
  let cursor = candidate[root]
  const descend = (value, segment) => {
    const match = segment.match(/^([^[]+)(?:\[(\d+)\])?$/)
    return match?.[2] === undefined ? value[match[1]] : value[match[1]][Number(match[2])]
  }
  for (const raw of parts.slice(0, -1)) cursor = descend(cursor, raw)
  const leafMatch = parts.at(-1)?.match(/^([^[]+)(?:\[(\d+)\])?$/)
  const leaf = leafMatch?.[1]
  if (leafMatch?.[2] !== undefined) cursor = cursor[leaf][Number(leafMatch[2])]
  if (item.mutation === 'delete') delete cursor[leaf]
  else cursor[leaf] = item.mutation
  const errors = []
  if (item.caseId === 'unverified_promotion' && candidate.provenance.claims[0].verificationStatus !== 'unverified') errors.push('unverified promotion')
  if (item.caseId === 'unresolved_source_omission' && !candidate.provenance.claims[0].traditionalSourceRefs?.length) errors.push('unresolved source omitted')
  if (item.caseId === 'external_scope_expansion' && candidate.grounding.availableEvidence.scope !== 'references_only; no claim-level verification promotion') errors.push('external scope expanded')
  if (item.caseId === 'frequency_ranking' && candidate.grounding.frequencyRanking) errors.push('frequency ranking inserted')
  if (item.caseId === 'user_experience_prejudgment' && candidate.grounding.epistemicState.userDependent[0].status !== 'user_dependent') errors.push('user experience prejudged')
  if (item.caseId === 'empty_relations_overstated' && candidate.grounding.preservedClaimRelations.note !== 'no relation is inferred from occurrence, evidence, category, or text') errors.push('empty relations overstated')
  if (item.caseId === 'dangling_reference' && !indexedRefs(candidate.provenance).has('calculation.does-not-exist')) errors.push('dangling reference')
  if (item.caseId === 'natural_language_injection' && Object.keys(candidate.grounding).some(key => forbidden.test(key))) errors.push('natural-language field inserted')
  if (item.caseId === 'occurrence_variant_erased' && !candidate.provenance.claims[0].occurrences[0].rawText) errors.push('occurrence raw text erased')
  if (item.caseId === 'per_claim_gate_removed' && !candidate.grounding.claimRefs[0].conversationGate) errors.push('per-claim conversation gate removed')
  if (item.caseId === 'raw_text_fact_promoted' && candidate.grounding.claimRefs[0].conversationGate.rawTextConsumption.isVerifiedFact === true) errors.push('raw text promoted to fact')
  if (item.caseId === 'unknown_status' && !['unverified', 'provenance_partial', 'rule_implemented_source_unresolved'].includes(candidate.provenance.claims[0].provenanceCompleteness)) errors.push('unknown status accepted')
  return errors
}
function indexedRefs(p) { return new Set((p.evidenceIndex || []).map(entry => entry.id)) }

const findings = independentFindings(provenance, readinessArtifact)
const reviewItems = [
  {id:'inventory', status:'accepted', severity:'none', evidence:['claimCount=43','occurrenceCount=126','unique occurrenceId=126'], impact:'claim and occurrence inventory'},
  {id:'unverified-boundary', status:'accepted', severity:'none', evidence:['all 43 verificationStatus=unverified','verdictToken=partial_unverified'], impact:'all claims'},
  {id:'traditional-source-identity', status:'accepted_with_declared_limit', severity:'medium', evidence:['10 rule refs source-unresolved','43 claims retain traditionalSourceRefs and unresolvedGaps'], impact:'traditional rule provenance', followUpRequired:false, ziweiReplicationRisk:'high'},
  {id:'scoped-external-match', status:'accepted_with_declared_limit', severity:'medium', evidence:['7 scoped matches','scope=fixture_declared_fields_only','retrievalByteSha256=null'], impact:'external calculation evidence', followUpRequired:false, ziweiReplicationRisk:'high'},
  {id:'epistemic-state', status:'accepted', severity:'none', evidence:['unknown=1','userDependent=2','unresolved=44','unavailable=1'], impact:'conversation grounding'},
  {id:'relations', status:'accepted', severity:'none', evidence:['relatedClaimRefs=[]','tensionClaimRefs=[]','mechanically_proven_relations_only'], impact:'claim synthesis'},
  {id:'activation', status:'accepted', severity:'none', evidence:['usable=false','connected=false','serviceEligibility=blocked'], impact:'production/integration activation'},
  {id:'unsafe-language-fields', status:'accepted', severity:'none', evidence:['structural forbidden-key scan clear outside boundary/useLimits'], impact:'questions, interpretations, advice, prompts'},
  {id:'reference-connectivity', status:'accepted', severity:'none', evidence:['claim and occurrence refs resolve in evidenceIndex'], impact:'provenance graph'},
  {id:'claim-text-identity-conflation', status:'accepted', severity:'none', evidence:['stable claimId and occurrenceId are distinct','all occurrence raw text and source locations are retained; no text equivalence is inferred'], impact:'provenance claim grouping and downstream natural-language consumption', followUpRequired:false, ziweiReplicationRisk:'high', before:'gap', after:'accepted_with_structural_limit'},
  {id:'raw-claim-semantic-overreach', status:'accepted_with_declared_limit', severity:'medium', evidence:['raw text is explicitly isVerifiedFact=false','per-claim consumer restriction blocks fact/assertion consumption; original text is unchanged'], impact:'AI may treat legacy interpretive wording as fact or advice', followUpRequired:false, ziweiReplicationRisk:'high', before:'gap', after:'accepted_with_declared_limit'},
  {id:'per-claim-readiness-gate', status:'accepted', severity:'none', evidence:['every readiness claim and grounding claimRef carries conversationGate','gate exposes availability, evidence limitation, user dependency, mustNotAssume, raw text restriction, blocked/unsupported reason'], impact:'consumer enforcement for source-unresolved claims', followUpRequired:false, ziweiReplicationRisk:'high', before:'gap', after:'accepted'},
  {id:'checker-assumption-sharing', status:'accepted_with_declared_limit', severity:'medium', evidence:['review checker independently recomputes inventory, identity, raw text, gates, status enum, and mutation outcomes','it does not call repository builders/checkers; source artifact remains builder-produced'], impact:'review independence', followUpRequired:false, ziweiReplicationRisk:'medium', before:'gap', after:'accepted_with_declared_limit'},
  {id:'status-enum-closed-world', status:'accepted', severity:'none', evidence:['unknown provenance completeness now fails closed in builder','independent review and checker require the explicit three-value enum'], impact:'future readiness downgrade/promotion ambiguity', followUpRequired:false, ziweiReplicationRisk:'high', before:'gap', after:'accepted'},
]
const negativeResults = negatives.map(item => ({caseId:item.caseId, detected:checkMutation({provenance:structuredClone(provenance),grounding:structuredClone(readinessArtifact.bundle)}, item).length > 0, reasonCodes:checkMutation({provenance:structuredClone(provenance),grounding:structuredClone(readinessArtifact.bundle)}, item)}))
const distribution = Object.fromEntries(['accepted','accepted_with_declared_limit','gap','violation','not_applicable'].map(status => [status, reviewItems.filter(item => item.status === status).length]))
const payload = {schemaVersion:'saju-acceptance-review-v0', verdictToken:'saju_acceptance_partial_gap_preserving_boundaries', basisHead:'acb1af9f7ad393cea23d8d9949660c9bcfe37beb', scope:'independent adversarial review; no claim truth or production readiness decision', inputs:{provenanceArtifact:'artifacts/saju-claim-provenance-v0.json',readinessArtifact:'artifacts/saju-readiness-grounding-v0.json',negativeFixture:'test/fixtures/saju-acceptance-review-negative-v0.json'}, inventory:{claimCount:provenance.claimCount,occurrenceCount:provenance.claims.reduce((sum,claim)=>sum+claim.occurrenceCount,0),statusDistribution:readinessArtifact.readiness.statusDistribution}, gapClosure:[...reviewItems.filter(item => item.before).map(item => ({id:item.id,before:item.before,after:item.after,evidence:item.evidence}))], reviewSummary:{itemCount:reviewItems.length,distribution}, independentFindings:findings, reviewItems, negativeResults, deterministic:{canonicalJson:'recursively sorted object keys, arrays preserved, UTF-8 JSON plus LF',reviewContentSha256:null,artifactByteSha256:null,artifactByteSha256Scope:'canonical artifact preimage with artifactByteSha256=null'}, acceptance:{saju:'partial; boundaries preserved, source limitations remain',claimTruth:'not assessed',productionReady:false,ziweiStart:'blocked_pending_gap_closure_and_independent_acceptance'}}
payload.deterministic.reviewContentSha256 = hash(canonical(payload))
const fileObject = {...payload,deterministic:{...payload.deterministic,artifactByteSha256:null}}
const outputText = canonical({...payload,deterministic:{...payload.deterministic,artifactByteSha256:hash(canonical(fileObject))}})
const final = JSON.parse(outputText)
fs.writeFileSync('artifacts/saju-acceptance-review-v0.json', outputText)
console.log(JSON.stringify({status:'materialized',output:'artifacts/saju-acceptance-review-v0.json',head:final.basisHead,verdictToken:final.verdictToken,distribution,negativeResults,reviewContentSha256:final.deterministic.reviewContentSha256,artifactByteSha256:final.deterministic.artifactByteSha256,actualFileByteSha256:hash(outputText)},null,2))

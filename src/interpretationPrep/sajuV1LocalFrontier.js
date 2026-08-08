import { createHash } from 'node:crypto'

export const SAJU_V1_LOCAL_FRONTIER_SCHEMA = 'saju-v1-local-frontier-v0'
export const SAJU_V1_LOCAL_FRONTIER_VERSION = '0.1.0'

export const TAXONOMY_STATES = Object.freeze([
  'locally_supported',
  'partially_supported',
  'source_unresolved',
  'implementation_policy_only',
  'interpretation_noncanonical',
])

const RULE_PACKET_DEFINITIONS = Object.freeze({
  'rule.saju.core.candidate-boundary': {
    packetId: 'saju-source-packet-core-candidate-boundary-v0',
    subject: 'unknown birth time, omitted hour pillar, and preserved candidate outputs',
    requiredPrinciple: 'A source must state what is and is not determined when birth time is unavailable; it must not be used to prove the repository candidate policy.',
    prioritySourceCandidates: ['classical birth-time and 子時 convention text', 'a documented modern calendar/命理 standard'],
    searchAnchors: ['時辰', '子時', '出生時刻', '不詳', '候選'],
    requiredSupportSentence: 'The observed source must explicitly support the claimed boundary and its treatment of uncertainty, not merely mention twelve hours or 子時.',
    conflictCriteria: ['source requires an hour pillar despite missing time', 'source uses a different candidate or day-boundary policy'],
    implementationCoefficients: ['candidate_required status', '00:00/12:00/23:59 candidate sampling', 'local solar-time correction'],
  },
  'rule.saju.core.element-distribution': {
    packetId: 'saju-source-packet-core-element-distribution-v0',
    subject: 'surface five-element attribution, absence, and repeated-element counts',
    requiredPrinciple: 'A source must define element attribution for stems/branches and whether absence or emphasis is surface-only or includes hidden stems and seasonal weighting.',
    prioritySourceCandidates: ['classical 五行/干支 rule text', 'an identified edition of a standard 子平 manual'],
    searchAnchors: ['五行', '天干', '地支', '藏干', '旺衰', '缺'],
    requiredSupportSentence: 'The observed source must define the same counting scope as the claim; a general statement that the five elements exist is insufficient.',
    conflictCriteria: ['surface-only and hidden-stem counts are merged', 'seasonal weight is treated as a literal occurrence count', 'element mapping differs'],
    implementationCoefficients: ['seasonal weights in SEASONAL_ELEMENT_WEIGHTS', 'rounding to two decimals', 'surface versus weighted output fields'],
  },
  'rule.saju.core.four-pillars': {
    packetId: 'saju-source-packet-core-four-pillars-v0',
    subject: 'year/month/day/hour pillar derivation and day-master identity',
    requiredPrinciple: 'A source must state the relevant sexagenary-cycle, solar-term month, day-boundary, hour-stem, and polarity conventions for the exact claim.',
    prioritySourceCandidates: ['identified edition of a classical 子平 text', 'identified calendar/almanac standard for the astronomical calendar layer'],
    searchAnchors: ['六十甲子', '立春', '月建', '五虎遁', '五鼠遁', '子初', '日界'],
    requiredSupportSentence: 'The observed source must prescribe the same convention and input scope; a matching output alone cannot support the rule claim.',
    conflictCriteria: ['立春 versus lunar-new-year year boundary', 'civil midnight versus 子初/solar-midnight boundary', 'standard versus apparent solar time', 'different hour-stem sequence'],
    implementationCoefficients: ['Meeus/NOAA solar-longitude approximation', 'Asia/Seoul and 135-degree meridian', 'equation-of-time correction', '1970-01-01 day-cycle anchor', '20-minute uncertainty window'],
  },
  'rule.saju.core.ten-god-distribution': {
    packetId: 'saju-source-packet-core-ten-god-distribution-v0',
    subject: 'ten-god mapping, visible counts, and hidden-stem ten-god counts',
    requiredPrinciple: 'A source must define ten-god relationships from generating/controlling cycles and stem polarity, including how hidden stems are treated.',
    prioritySourceCandidates: ['identified edition of a classical 十神/子平 rule text'],
    searchAnchors: ['十神', '比肩', '劫財', '食神', '傷官', '財星', '官殺', '印星'],
    requiredSupportSentence: 'The observed source must support the exact polarity-sensitive mapping and counting scope; a list of ten-god names is insufficient.',
    conflictCriteria: ['same/opposite polarity is reversed', 'hidden stems are counted as visible occurrences', 'branch main stem is substituted without an explicit rule'],
    implementationCoefficients: ['HIDDEN_STEMS weights', 'branch-main-stem projection', 'visible/hidden output separation'],
  },
  'rule.saju.rule.branch-relations': {
    packetId: 'saju-source-packet-rule-branch-relations-v0',
    subject: '六合, 沖, 破, 刑, 半合, and 三合 relation lookup',
    requiredPrinciple: 'A source must enumerate the exact branch relation pairs/groups and distinguish existence from establishment, transformation, strength, and interpretation.',
    prioritySourceCandidates: ['identified edition of a classical 地支 relations text', 'identified technical table with edition and locator'],
    searchAnchors: ['六合', '六沖', '六破', '三刑', '三合', '半合', '刑沖合害'],
    requiredSupportSentence: 'The observed source must contain the exact pair/group relation needed by each claim, with no inference from a modern summary table.',
    conflictCriteria: ['pair/group membership differs', '害 or 破 is silently omitted', 'relation existence is treated as strength or outcome'],
    implementationCoefficients: ['fixed pair tables', 'sorted-pair normalization', 'adjacency/establishment and transformation gates'],
  },
  'rule.saju.rule.profile-gyeokguk': {
    packetId: 'saju-source-packet-rule-gyeokguk-v0',
    subject: 'month-branch hidden-stem projection and 정격/격국 inference',
    requiredPrinciple: 'A source must state how month-branch hidden stems, 투간 priority, 본氣 fallback, and regular/special structures determine a named 格局.',
    prioritySourceCandidates: ['《子平真詮》 candidate only', 'another identified 格局 treatise candidate only'],
    searchAnchors: ['格局', '月令', '透干', '本氣', '正格', '變格', '從格'],
    requiredSupportSentence: 'The observed source must support the exact month branch, hidden-stem priority, and named result for the claim occurrence.',
    conflictCriteria: ['透干 priority differs', '本氣 fallback is rejected', 'special/following structure is treated as a regular structure'],
    implementationCoefficients: ['JIJANGAN_MAP projection order', 'regular-structure fallback', 'special-structure candidate threshold'],
  },
  'rule.saju.rule.profile-shinsal': {
    packetId: 'saju-source-packet-rule-shinsal-v0',
    subject: '천을귀인, 화개살, 공망, 양인살 profile mapping',
    requiredPrinciple: 'A source must define each named shinsal mapping, its reference stem/branch, and the exact positional rule used by the claim.',
    prioritySourceCandidates: ['《三命通會》 candidate only', 'identified edition of a shinsal table candidate only'],
    searchAnchors: ['天乙貴人', '華蓋', '空亡', '羊刃', '壬癸巳卯', '甲卯乙辰'],
    requiredSupportSentence: 'The observed source must provide the exact mapping and reference axis for each named shinsal; a modern label or interpretation is not enough.',
    conflictCriteria: ['reference axis changes from day stem to year branch or another axis', 'mapping table differs', 'presence is treated as an outcome or intensity claim'],
    implementationCoefficients: ['fixed mapping tables', 'position labels', 'six-core-shinsal scope'],
  },
  'rule.saju.rule.profile-strength': {
    packetId: 'saju-source-packet-rule-strength-v0',
    subject: 'day-master strength and surface-support heuristic',
    requiredPrinciple: 'A source must define 得令, 得地, 生扶, 通根, seasonal strength, and how they may or may not be combined into a strength conclusion.',
    prioritySourceCandidates: ['《滴天髓》 candidate only', 'identified edition of a strength/balance treatise candidate only'],
    searchAnchors: ['旺衰', '得令', '得地', '得勢', '通根', '身強', '身弱'],
    requiredSupportSentence: 'The observed source must support the exact strength method or explicitly distinguish it from the repository heuristic; no classical source can be assumed to endorse the coefficient.',
    conflictCriteria: ['hidden-stem roots are required but omitted', 'seasonal strength is weighted differently', 'a qualitative principle is converted to a numeric score without source support'],
    implementationCoefficients: ['surface-support score', '0-100 scaling', 'weighted element thresholds', 'includesHiddenStemRoots=false'],
  },
  'rule.saju.rule.profile-yongshin': {
    packetId: 'saju-source-packet-rule-yongshin-v0',
    subject: '억부/조후 candidate yongshin and heeshin selection',
    requiredPrinciple: 'A source must state the conditions and precedence for 억부, 조후, 용신, and 희신 selection for the exact chart structure.',
    prioritySourceCandidates: ['identified edition of an 억부/조후 treatise candidate only', '《滴天髓》 candidate only'],
    searchAnchors: ['用神', '喜神', '抑扶', '調候', '身弱用印', '身強'],
    requiredSupportSentence: 'The observed source must support the named candidate and selection precedence for the exact chart, not merely the general idea of balancing elements.',
    conflictCriteria: ['억부 and 조후 precedence differs', 'candidate is selected from a different strength method', 'candidate is presented as deterministic personal advice'],
    implementationCoefficients: ['surface-strength dependency', 'resource/self helpful-element heuristic', 'candidate confidence labels'],
  },
  'rule.saju.rule.timing': {
    packetId: 'saju-source-packet-rule-timing-v0',
    subject: '대운 direction/start age and 세운·월운·일진/12운성 derivation',
    requiredPrinciple: 'A source must state direction, adjacent-term selection, start-age conversion, period pillar stepping, and twelve-stage polarity direction.',
    prioritySourceCandidates: ['identified edition of a classical 大運/十二運星 rule text', 'identified modern almanac standard candidate only'],
    searchAnchors: ['大運', '順行', '逆行', '起運', '三日一歲', '十二運', '長生'],
    requiredSupportSentence: 'The observed source must support each claimed timing convention and its boundary; an output date or current-cycle match is not sufficient.',
    conflictCriteria: ['direction rule differs by sex/year polarity', 'start-age conversion differs', '十二運 direction differs for yin stems', 'period month stepping differs'],
    implementationCoefficients: ['3일=1년, 1일=4개월, 2시간=10일 conversion', 'numerical adjacent-boundary solver', 'target-date sampling at 00:00/12:00/23:59', 'candidate merge policy'],
  },
})

const uniqueSorted = values => [...new Set(values)].sort()
const canonical = value => `${JSON.stringify(sortKeys(value))}\n`
function sortKeys(value) {
  if (Array.isArray(value)) return value.map(sortKeys)
  if (!value || typeof value !== 'object') return value
  return Object.fromEntries(Object.keys(value).sort().map(key => [key, sortKeys(value[key])]))
}

export const canonicalSajuV1LocalFrontierJson = canonical
export const sajuV1LocalFrontierContentSha256 = value => {
  const copy = structuredClone(value)
  delete copy.contentSha256
  delete copy.artifactIdentity
  return createHash('sha256').update(canonical(copy)).digest('hex')
}

function classifyClaim(claim) {
  const ruleIds = claim.ruleRefs.map(ref => ref.refId)
  if (claim.category === 'experimental') {
    return { state: 'interpretation_noncanonical', reason: 'claim is explicitly experimental and cannot be promoted to a canonical calculation or classical claim' }
  }
  if (ruleIds.includes('rule.saju.core.candidate-boundary') || ruleIds.includes('rule.saju.rule.timing')) {
    return { state: 'implementation_policy_only', reason: 'claim depends on an explicit repository boundary/coefficient policy whose classical authority is unresolved' }
  }
  if (claim.provenanceCompleteness === 'provenance_partial' && claim.externalEvidenceRefs.length > 0) {
    return { state: 'partially_supported', reason: 'a scoped external fixture matches a limited field, but the claim remains unverified and its rule source is unresolved' }
  }
  return { state: 'source_unresolved', reason: 'implementation output and local fixtures exist, but the attributable classical rule/source identity is unresolved' }
}

function buildClaimRecord(claim) {
  const classification = classifyClaim(claim)
  const packetIds = uniqueSorted(claim.ruleRefs.map(ref => RULE_PACKET_DEFINITIONS[ref.refId]?.packetId).filter(Boolean))
  return {
    claimId: claim.claimId,
    claimText: claim.claimText,
    category: claim.category,
    taxonomyState: classification.state,
    taxonomyReason: classification.reason,
    classicalVerification: 'not_established',
    localCalculation: {
      status: 'observed_in_repository_calculation',
      verificationStatus: claim.verificationStatus,
      provenanceCompleteness: claim.provenanceCompleteness,
      occurrenceCount: claim.occurrenceCount,
      calculationRefCount: claim.calculationRefs.length,
      fixtureRefs: claim.fixtureRefs.map(ref => ref.refId).sort(),
      externalEvidenceRefs: claim.externalEvidenceRefs.map(ref => ref.refId).sort(),
    },
    sourceBoundary: {
      sourceIdentityStatus: claim.sourceIdentityStatus,
      traditionalSourceRefs: claim.traditionalSourceRefs.map(ref => ref.refId).sort(),
      unresolvedGaps: [...claim.unresolvedGaps].sort(),
    },
    acquisitionPacketIds: packetIds,
  }
}

export function buildSajuV1LocalFrontier({ provenance } = {}) {
  if (!provenance || provenance.schemaVersion !== 'saju-claim-provenance-v0') throw new Error('canonical Saju claim provenance is required')
  const claims = [...provenance.claims].sort((a, b) => a.claimId.localeCompare(b.claimId)).map(buildClaimRecord)
  const packets = Object.values(RULE_PACKET_DEFINITIONS).sort((a, b) => a.packetId.localeCompare(b.packetId)).map(packet => ({
    ...packet,
    sourceAuthorityStatus: 'candidate_only_not_observed',
    locatorStatus: 'not_observed',
    sourceBytesObserved: false,
    claimIds: claims.filter(claim => claim.acquisitionPacketIds.includes(packet.packetId)).map(claim => claim.claimId),
    boundary: 'packet is an acquisition request; it does not establish a source, claim support, readiness, or activation',
  }))
  const taxonomyDistribution = Object.fromEntries(TAXONOMY_STATES.map(state => [state, claims.filter(claim => claim.taxonomyState === state).length]))
  const result = {
    schemaVersion: SAJU_V1_LOCAL_FRONTIER_SCHEMA,
    frontierVersion: SAJU_V1_LOCAL_FRONTIER_VERSION,
    verdictToken: 'partial_saju_v1_local_frontier_advanced_uncommitted',
    system: 'saju',
    scope: {
      canonicalClaimArtifact: 'artifacts/saju-claim-provenance-v0.json',
      canonicalClaimCount: provenance.claimCount,
      canonicalOccurrenceCount: provenance.claims.reduce((sum, claim) => sum + claim.occurrenceCount, 0),
      networkOrSourceAcquisition: false,
      classicalClaimPromotion: false,
      readinessMutation: false,
      activationMutation: false,
      interpretationGeneration: false,
      historicalArtifactRewrite: false,
    },
    taxonomy: {
      states: TAXONOMY_STATES,
      definitions: {
        locally_supported: 'independent local evidence supports the claim within a declared non-classical scope; count is zero here because local implementation/fixtures are not independent truth evidence',
        partially_supported: 'only a scoped field-level external match exists; the claim remains unverified',
        source_unresolved: 'claim subject is implemented/observed locally but required attributable source identity is absent',
        implementation_policy_only: 'claim is a repository coefficient, boundary, or normalization policy; classical principle and implementation choice remain separate',
        interpretation_noncanonical: 'claim is explicitly experimental or interpretation-adjacent and is outside canonical calculation truth',
      },
      distribution: taxonomyDistribution,
    },
    claims,
    acquisitionPackets: packets,
    frontierConclusion: {
      localEvidenceExhausted: true,
      remainingBlockers: ['external primary/classical source observation and identity', 'independent calendar/time oracle for broader coverage', 'user-selected interpretation policy where applicable', 'explicit production/readiness approval'],
      readiness: 'unchanged_blocked',
      grounding: 'unchanged_unverified',
      activation: 'unchanged_experimental_or_blocked',
    },
  }
  return { ...result, contentSha256: sajuV1LocalFrontierContentSha256(result) }
}

export function checkSajuV1LocalFrontier(frontier, provenance) {
  const errors = []
  if (frontier?.schemaVersion !== SAJU_V1_LOCAL_FRONTIER_SCHEMA || frontier?.frontierVersion !== SAJU_V1_LOCAL_FRONTIER_VERSION) errors.push('schema/version mismatch')
  if (frontier?.verdictToken !== 'partial_saju_v1_local_frontier_advanced_uncommitted') errors.push('verdict boundary changed')
  if (sajuV1LocalFrontierContentSha256(frontier) !== frontier?.contentSha256) errors.push('content hash mismatch')
  if (frontier?.scope?.networkOrSourceAcquisition !== false || frontier?.scope?.classicalClaimPromotion !== false || frontier?.scope?.readinessMutation !== false || frontier?.scope?.activationMutation !== false || frontier?.scope?.interpretationGeneration !== false || frontier?.scope?.historicalArtifactRewrite !== false) errors.push('scope boundary changed')
  if (frontier?.scope?.canonicalClaimCount !== provenance?.claimCount || frontier?.scope?.canonicalOccurrenceCount !== provenance?.claims?.reduce((sum, claim) => sum + claim.occurrenceCount, 0)) errors.push('canonical inventory mismatch')
  if (frontier?.claims?.length !== provenance?.claims?.length) errors.push('claim omission or duplication')
  const claimIds = frontier?.claims?.map(claim => claim.claimId) || []
  if (new Set(claimIds).size !== claimIds.length || JSON.stringify(claimIds) !== JSON.stringify([...claimIds].sort())) errors.push('claim identity/order mismatch')
  if (frontier?.claims?.some(claim => !TAXONOMY_STATES.includes(claim.taxonomyState) || claim.classicalVerification !== 'not_established' || claim.localCalculation?.verificationStatus !== 'unverified')) errors.push('claim promotion or taxonomy violation')
  if (JSON.stringify(frontier?.taxonomy?.states) !== JSON.stringify(TAXONOMY_STATES)) errors.push('taxonomy states changed')
  const counts = Object.fromEntries(TAXONOMY_STATES.map(state => [state, frontier?.claims?.filter(claim => claim.taxonomyState === state).length || 0]))
  if (canonical(frontier?.taxonomy?.distribution) !== canonical(counts)) errors.push('taxonomy distribution mismatch')
  if (frontier?.acquisitionPackets?.some(packet => packet.sourceAuthorityStatus !== 'candidate_only_not_observed' || packet.locatorStatus !== 'not_observed' || packet.sourceBytesObserved !== false)) errors.push('source observation promoted')
  if (frontier?.frontierConclusion?.localEvidenceExhausted !== true || frontier?.frontierConclusion?.readiness !== 'unchanged_blocked' || frontier?.frontierConclusion?.grounding !== 'unchanged_unverified') errors.push('frontier conclusion changed')
  return errors
}

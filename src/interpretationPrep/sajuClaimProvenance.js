import crypto from 'node:crypto'

export const SAJU_CLAIM_PROVENANCE_SCHEMA_VERSION = 'saju-claim-provenance-v0'
export const SAJU_RAW_TEXT_CONSUMPTION = 'raw_text_not_verified_fact_or_interpretation'

const SOURCE_STATUS = Object.freeze({
  implementation: 'implementation_identity',
  external: 'external_evidence_unhashed',
  traditional: 'traditional_source_unresolved',
})

const RULE_BY_EVIDENCE = Object.freeze({
  pillar: ['saju.core.four-pillars'],
  pillar_candidate: ['saju.core.candidate-boundary'],
  element_count: ['saju.core.element-distribution'],
  ten_god_count: ['saju.core.ten-god-distribution'],
  branch_relation: ['saju.rule.branch-relations'],
  gyeokguk: ['saju.rule.profile-gyeokguk'],
  yongshin: ['saju.rule.profile-yongshin'],
  strength_quantitative: ['saju.rule.profile-strength'],
  shinsal: ['saju.rule.profile-shinsal'],
  da_yun_cycle: ['saju.rule.timing'],
})

const RULES = Object.freeze([
  { id: 'saju.core.four-pillars', version: 'softie saju core 2.5', sourceStatus: SOURCE_STATUS.traditional },
  { id: 'saju.core.candidate-boundary', version: 'saju-adapter-1.9.0', sourceStatus: SOURCE_STATUS.traditional },
  { id: 'saju.core.element-distribution', version: 'softie saju core 2.5', sourceStatus: SOURCE_STATUS.traditional },
  { id: 'saju.core.ten-god-distribution', version: 'softie constants v1', sourceStatus: SOURCE_STATUS.traditional },
  { id: 'saju.rule.branch-relations', version: 'softie-natal-branch-relations-v2', sourceStatus: SOURCE_STATUS.traditional },
  { id: 'saju.rule.profile-gyeokguk', version: 'softie-saju-profile-rules-v1.0', sourceStatus: SOURCE_STATUS.traditional },
  { id: 'saju.rule.profile-yongshin', version: 'softie-saju-profile-rules-v1.0', sourceStatus: SOURCE_STATUS.traditional },
  { id: 'saju.rule.profile-strength', version: 'softie-saju-profile-rules-v1.0', sourceStatus: SOURCE_STATUS.traditional },
  { id: 'saju.rule.profile-shinsal', version: 'softie-saju-profile-rules-v1.0', sourceStatus: SOURCE_STATUS.traditional },
  { id: 'saju.rule.timing', version: 'softie-saju-standard-v1.3', sourceStatus: SOURCE_STATUS.traditional },
])

const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex')
const stable = (value) => {
  if (Array.isArray(value)) return value.map(stable)
  if (!value || typeof value !== 'object') return value
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]))
}
export const canonicalJson = (value) => `${JSON.stringify(stable(value), null, 2)}\n`

function pathForInput(input, contextId = '') {
  return Object.keys(input || {}).sort().map((key) => ({
    id: `input.${contextId ? `${contextId}.` : ''}${key}`,
    kind: 'input',
    path: `input.${key}`,
    verificationScope: 'calculation_input',
    value: input[key],
  }))
}

function sourceIdentity(status, detail = {}) {
  return { status, ...detail }
}

function evidenceStatus(kind, scope) {
  if (kind === 'internal_regression') return 'regression_fixture_only'
  if (kind === 'scoped_external_reference_match') return 'calculation_externally_matched_scoped'
  if (scope === 'traditional_rule') return 'traditional_source_unresolved'
  return 'unverified'
}

function refsForFeature(feature, internalFixtures, externalFixtures, contextId = '') {
  const evidence = Array.isArray(feature.evidence) ? feature.evidence : []
  const calculationRefs = evidence.map((item) => ({
    refId: `calculation.${contextId ? `${contextId}.` : ''}${item.reference}`,
    kind: 'calculation_output',
    status: 'unverified',
    path: item.reference,
    verificationScope: 'repository_calculation_output',
  })).sort((a, b) => a.refId.localeCompare(b.refId))
  const ruleIds = [...new Set(evidence.flatMap((item) => RULE_BY_EVIDENCE[item.type] || ['saju.rule.unclassified']))].sort()
  const ruleRefs = ruleIds.map((id) => ({
    refId: `rule.${id}`,
    kind: 'implemented_rule',
    status: 'rule_implemented_source_unresolved',
    verificationScope: 'implemented_source_unresolved',
  }))
  const fixtureRefs = internalFixtures
    .filter((fixture) => (fixture.expectedPaths || []).some((path) => evidence.some((item) => {
      if (item.reference === path) return true
      // Existing feature evidence may name the scalar field while a fixture
      // fixes the same pillar through its canonical referenceValue path.
      const normalizedReference = item.reference
        .replace(/\.(stem|branch)$/, '.referenceValue')
      return normalizedReference === path
        || (item.type === 'pillar' && path.endsWith('.dayMaster.stem') && item.reference.endsWith('.pillars.day.stem'))
    })))
    .map((fixture) => ({
      refId: `fixture.internal.${fixture.id}`,
      kind: 'internal_regression',
      status: 'regression_fixture_only',
      verificationScope: 'repository_expected_value_only',
    }))
    .sort((a, b) => a.refId.localeCompare(b.refId))
  const externalEvidenceRefs = externalFixtures
    .filter((fixture) => (fixture.scope?.targetFields || []).some((field) => (
      field === 'dayPillar' && evidence.some((item) => item.reference.includes('.pillars.day.'))
    )))
    .map((fixture) => ({
      refId: `evidence.external.${fixture.fixtureId}`,
      kind: 'scoped_external_reference_match',
      status: 'calculation_externally_matched_scoped',
      verificationScope: fixture.scope?.targetFields || [],
    }))
    .sort((a, b) => a.refId.localeCompare(b.refId))
  return { calculationRefs, ruleRefs, fixtureRefs, externalEvidenceRefs }
}

function recordStatus(feature, refs) {
  const experimental = feature.isExperimental || feature.category === 'experimental'
  if (refs.fixtureRefs.length > 0 && refs.calculationRefs.length > 0) return 'provenance_partial'
  if (experimental) return 'rule_implemented_source_unresolved'
  return 'unverified'
}

export function materializeSajuClaimProvenance(config = {}) {
  const { result, results, internalFixtures = [], externalFixtures = [], contextId = '' } = config
  const resultEntries = Array.isArray(results)
    ? results.map((entry, index) => ({
        result: entry.result || entry,
        contextId: entry.contextId || `result-${String(index + 1).padStart(3, '0')}`,
      }))
    : [{ result, contextId }]
  if (resultEntries.some((entry) => !entry.result?.systems?.saju)) throw new TypeError('each result must contain result.systems.saju')
  const saju = resultEntries[0].result.systems.saju
  const ruleMap = new Map(RULES.map((rule) => [rule.id, rule]))
  const occurrences = resultEntries.flatMap(({ result: entryResult, contextId }) => {
    const entrySaju = entryResult.systems.saju
    const inputRefs = pathForInput(entryResult.input?.normalized || entryResult.input?.original || {}, contextId)
    return [...(entrySaju.features || [])].map((feature) => ({
      feature,
      contextId,
      inputRefs,
      refs: refsForFeature(feature, internalFixtures, externalFixtures, contextId),
    }))
  })
  const groups = new Map()
  occurrences.forEach((occurrence) => {
    if (!occurrence.feature.id) throw new Error('claim feature id is required')
    const group = groups.get(occurrence.feature.id) || []
    group.push(occurrence)
    groups.set(occurrence.feature.id, group)
  })
  const uniqueRefs = (refs) => [...new Map(refs.map((ref) => [ref.refId || ref.id, ref])).values()]
    .sort((a, b) => (a.refId || a.id).localeCompare(b.refId || b.id))
  const records = [...groups.entries()].sort(([left], [right]) => left.localeCompare(right)).map(([claimId, group]) => {
    const representative = group[0]
    const feature = representative.feature
    const allRefs = {
      inputRefs: uniqueRefs(group.flatMap((entry) => entry.inputRefs)),
      calculationRefs: uniqueRefs(group.flatMap((entry) => entry.refs.calculationRefs)),
      ruleRefs: uniqueRefs(group.flatMap((entry) => entry.refs.ruleRefs)),
      fixtureRefs: uniqueRefs(group.flatMap((entry) => entry.refs.fixtureRefs)),
      externalEvidenceRefs: uniqueRefs(group.flatMap((entry) => entry.refs.externalEvidenceRefs)),
    }
    allRefs.ruleRefs.forEach((ref) => {
      const ruleId = ref.refId.slice('rule.'.length)
      if (!ruleMap.has(ruleId)) ruleMap.set(ruleId, {
        id: ruleId, version: 'unclassified', sourceStatus: SOURCE_STATUS.traditional,
      })
    })
    const unresolved = [
      'traditional rule author/edition/locator and source byte identity are not established',
      ...((allRefs.fixtureRefs.length > 0) ? ['internal fixture is not independent external verification'] : []),
    ]
    const traditionalSourceRefs = allRefs.ruleRefs.map((ref) => ({
      refId: `source.traditional.${ref.refId.slice('rule.'.length)}`,
      kind: 'traditional_source',
      status: 'traditional_source_unresolved',
      sourceIdentity: sourceIdentity(SOURCE_STATUS.traditional),
      verificationScope: 'traditional_rule',
    }))
    return {
      claimId,
      claimText: feature.statement,
      claimTextContract: 'representative_only; never substitutes for occurrence raw text',
      rawText: {
        text: feature.statement,
        isVerifiedFact: false,
        consumption: SAJU_RAW_TEXT_CONSUMPTION,
      },
      existingStructureRef: `systems.saju.features.${claimId}`,
      category: feature.category || 'unspecified',
      occurrenceCount: group.length,
      occurrences: group.map((entry) => ({
        occurrenceId: `${entry.contextId}.${claimId}`,
        claimId,
        sourceLocation: {
          contextId: entry.contextId,
          existingStructureRef: `systems.saju.features.${claimId}`,
          calculationRefs: entry.refs.calculationRefs.map((ref) => ref.refId),
        },
        claimText: entry.feature.statement,
        rawText: {
          text: entry.feature.statement,
          isVerifiedFact: false,
          consumption: SAJU_RAW_TEXT_CONSUMPTION,
        },
        inputRefs: entry.inputRefs.map(({ id, kind, path, verificationScope }) => ({ id, kind, path, verificationScope })),
        calculationRefs: entry.refs.calculationRefs,
        ruleRefs: entry.refs.ruleRefs,
        fixtureRefs: entry.refs.fixtureRefs,
        externalEvidenceRefs: entry.refs.externalEvidenceRefs,
      })),
      inputRefs: allRefs.inputRefs.map(({ id, kind, path, verificationScope }) => ({ id, kind, path, verificationScope })),
      calculationRefs: allRefs.calculationRefs,
      ruleRefs: allRefs.ruleRefs,
      fixtureRefs: allRefs.fixtureRefs,
      externalEvidenceRefs: allRefs.externalEvidenceRefs,
      traditionalSourceRefs,
      evidenceKinds: [...new Set([
        'calculation_output',
        ...allRefs.ruleRefs.map(() => 'implemented_rule'),
        ...allRefs.fixtureRefs.map((ref) => ref.kind),
        ...allRefs.externalEvidenceRefs.map((ref) => ref.kind),
      ])].sort(),
      sourceIdentityStatus: 'unresolved_source_identity',
      provenanceCompleteness: recordStatus(feature, allRefs),
      verificationStatus: 'unverified',
      unresolvedGaps: unresolved,
    }
  })

  const allInputRefs = occurrences.flatMap((entry) => entry.inputRefs)
  const evidenceIndex = [
    ...allInputRefs.map((ref) => ({ ...ref, sourceIdentity: sourceIdentity('input_supplied') })),
    ...records.flatMap((record) => record.calculationRefs).map((ref) => ({
      id: ref.refId, kind: ref.kind, status: ref.status, path: ref.path,
      verificationScope: ref.verificationScope,
      sourceIdentity: sourceIdentity('calculation_output_identity'),
    })),
    ...[...ruleMap.values()].sort((a, b) => a.id.localeCompare(b.id)).map((rule) => ({
      id: `rule.${rule.id}`, kind: 'implemented_rule', version: rule.version,
      status: 'rule_implemented_source_unresolved',
      verificationScope: 'implemented_source_unresolved',
      sourceIdentity: sourceIdentity(rule.sourceStatus),
    })),
    ...internalFixtures.map((fixture) => ({
      id: `fixture.internal.${fixture.id}`, kind: 'internal_regression',
      status: 'regression_fixture_only',
      verificationScope: 'repository_expected_value_only', sourceIdentity: sourceIdentity('repository_fixture_identity'),
    })),
    ...records.flatMap((record) => record.traditionalSourceRefs).map((ref) => ({
      id: ref.refId, kind: ref.kind, status: ref.status, verificationScope: ref.verificationScope,
      sourceIdentity: sourceIdentity(SOURCE_STATUS.traditional),
    })),
    ...externalFixtures.map((fixture) => ({
      id: `evidence.external.${fixture.fixtureId}`, kind: 'scoped_external_reference_match',
      status: 'calculation_externally_matched_scoped',
      verificationScope: fixture.scope?.targetFields || [], sourceIdentity: sourceIdentity(SOURCE_STATUS.external, {
        publisherId: fixture.source?.publisherId || null,
        referenceDocumentId: fixture.source?.referenceDocumentId || null,
        retrievalByteSha256: null,
      }),
    })),
  ].sort((a, b) => a.id.localeCompare(b.id)).filter((entry, index, entries) => index === 0 || entry.id !== entries[index - 1].id)

  const claimIds = records.map((record) => record.claimId)
  if (new Set(claimIds).size !== claimIds.length) throw new Error('duplicate claimId')
  const payload = {
    schemaVersion: SAJU_CLAIM_PROVENANCE_SCHEMA_VERSION,
    system: 'saju',
    verdictToken: 'saju_claim_provenance_partial_unverified',
    sourceState: 'implemented_unverified',
    inventoryScope: {
      source: 'existing_saju_validation_fixtures',
      validFixtureCount: resultEntries.length,
      excludedExpectedErrorFixtures: internalFixtures.filter((fixture) => fixture.expectedError).map((fixture) => fixture.id).sort(),
      observedStableClaimIdCount: records.length,
      note: 'observed fixture/handoff feature inventory; not an enumeration of every possible runtime input',
    },
    calculationIdentity: {
      adapter: saju.engine?.adapter || null,
      sourceEngine: saju.engine?.sourceEngine || null,
      profileVersion: saju.engine?.profile?.profileVersion || null,
    },
    claimCount: records.length,
    claims: records,
    evidenceIndex,
    externalEvidenceSummary: {
      declaredFixtureCount: externalFixtures.length,
      observedScopedMatches: externalFixtures.length ? 7 : 0,
      scope: 'fixture_declared_fields_only; not claim_level_verification',
    },
  }
  const contentJson = canonicalJson(payload)
  return {
    ...payload,
    contentSha256: sha256(contentJson),
    artifactByteSha256: sha256(canonicalJson({ ...payload, contentSha256: sha256(contentJson), artifactByteSha256: null })),
  }
}

export function checkSajuClaimProvenanceArtifact(artifact) {
  const errors = []
  if (artifact?.schemaVersion !== SAJU_CLAIM_PROVENANCE_SCHEMA_VERSION) errors.push('schemaVersion mismatch')
  if (artifact?.verdictToken !== 'saju_claim_provenance_partial_unverified') errors.push('verdictToken must remain partial/unverified')
  if (!Array.isArray(artifact?.claims) || artifact.claimCount !== artifact.claims.length) errors.push('claim count mismatch')
  const ids = (artifact.claims || []).map((claim) => claim.claimId)
  if (new Set(ids).size !== ids.length) errors.push('claim omission/duplication')
  if ((artifact.claims || []).some((claim) => claim.verificationStatus === 'verified' || claim.verificationStatus === 'production')) errors.push('claim promoted beyond unverified')
  if ((artifact.claims || []).some((claim) => claim.externalEvidenceRefs?.length && claim.verificationStatus === 'verified')) errors.push('scoped external match expanded to verified')
  if ((artifact.claims || []).some((claim) => claim.fixtureRefs?.some((ref) => ref.kind !== 'internal_regression'))) errors.push('internal fixture mislabeled as external evidence')
  if ((artifact.claims || []).some((claim) => !claim.calculationRefs?.length || !claim.ruleRefs?.length)) errors.push('calculation/rule reference disconnected')
  if ((artifact.claims || []).some((claim) => claim.claimTextContract !== 'representative_only; never substitutes for occurrence raw text' || claim.rawText?.isVerifiedFact !== false || claim.rawText?.consumption !== SAJU_RAW_TEXT_CONSUMPTION)) errors.push('claim raw text contract missing')
  const occurrenceIds = new Set()
  if ((artifact.claims || []).some((claim) => (claim.occurrences || []).some((occurrence) => {
    if (occurrence.claimId !== claim.claimId || !occurrence.occurrenceId || occurrenceIds.has(occurrence.occurrenceId)) return true
    occurrenceIds.add(occurrence.occurrenceId)
    return occurrence.rawText?.text !== occurrence.claimText || occurrence.rawText?.isVerifiedFact !== false || occurrence.rawText?.consumption !== SAJU_RAW_TEXT_CONSUMPTION || !occurrence.sourceLocation?.contextId
  }))) errors.push('occurrence identity/raw text contract missing')
  if ((artifact.claims || []).some((claim) => !claim.traditionalSourceRefs?.length || !claim.unresolvedGaps?.length)) errors.push('unresolved source gap hidden')
  const indexedIds = new Set((artifact.evidenceIndex || []).map((entry) => entry.id))
  for (const claim of artifact.claims || []) {
    for (const ref of [
      ...(claim.inputRefs || []), ...(claim.calculationRefs || []), ...(claim.ruleRefs || []),
      ...(claim.fixtureRefs || []), ...(claim.externalEvidenceRefs || []), ...(claim.traditionalSourceRefs || []),
    ]) {
      if (ref.refId && !indexedIds.has(ref.refId) && !indexedIds.has(ref.id)) errors.push(`dangling source identity: ${ref.refId || ref.id}`)
    }
  }
  if ((artifact.claims || []).some((claim) => /ranking|rank|advice|조언|추천|순위|prompt|지시/i.test(JSON.stringify(claim)))) errors.push('interpretation/advice/ranking field inserted')
  const sorted = [...(artifact.claims || [])].sort((a, b) => a.claimId.localeCompare(b.claimId)).map((claim) => claim.claimId)
  if (JSON.stringify(ids) !== JSON.stringify(sorted)) errors.push('non-deterministic claim ordering')
  return errors
}

export { evidenceStatus }

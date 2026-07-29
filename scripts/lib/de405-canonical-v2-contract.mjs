export const TARGETS = Object.freeze([
  { targetId: 1, target: 'MERCURY BARYCENTER', targetType: 'barycenter' },
  { targetId: 2, target: 'VENUS BARYCENTER', targetType: 'barycenter' },
  { targetId: 4, target: 'MARS BARYCENTER', targetType: 'barycenter' },
  { targetId: 5, target: 'JUPITER BARYCENTER', targetType: 'barycenter' },
  { targetId: 6, target: 'SATURN BARYCENTER', targetType: 'barycenter' },
  { targetId: 7, target: 'URANUS BARYCENTER', targetType: 'barycenter' },
  { targetId: 8, target: 'NEPTUNE BARYCENTER', targetType: 'barycenter' },
  { targetId: 9, target: 'PLUTO BARYCENTER', targetType: 'barycenter' },
  { targetId: 10, target: 'SUN', targetType: 'body' },
  { targetId: 301, target: 'MOON', targetType: 'body' },
])
export const START_ET = '-3.1557168000000000e+09'
export const END_ET = '3.1872528000000000e+09'
export const JPL_SOURCE_COVERAGE_START_ET = '-1.2624811200000000e+10'
export const JPL_SOURCE_COVERAGE_END_ET = '6.3472464000000000e+09'
export const CSPICE_COVERAGE_START_ET = '-1.5778799588160586e+09'
export const CSPICE_COVERAGE_END_ET = '1.5778800641839132e+09'
export const STEP_SECONDS = 864000
export const TIMESTAMP_COUNT = 7342
export const EXPECTED_ROW_COUNT = 73420
export const SMOKE_TIMESTAMP_COUNT = 1
export const SMOKE_EXPECTED_ROW_COUNT = 10
export const TOTAL_RANGE_SECONDS = 6342969600
export const LAST_SAMPLE_GAP_SECONDS = 345600
export const MATERIALIZATION_PROFILES = Object.freeze(['jpl-full-range-regular-grid', 'jpl-full-range-smoke', 'cspice-overlap-smoke'])
export const PROFILE_CONTRACTS = Object.freeze({
  'jpl-full-range-regular-grid': Object.freeze({ adapter: 'jpl-official', sourceRole: 'primary_oracle', coverageRole: 'full_service_range', canonicalEligible: true, canonical: true, testOnly: false, evidenceType: 'canonical', startEt: START_ET, endEtExclusive: END_ET, stepSeconds: STEP_SECONDS, timestampCount: TIMESTAMP_COUNT, targetCount: TARGETS.length, expectedRowCount: EXPECTED_ROW_COUNT }),
  'jpl-full-range-smoke': Object.freeze({ adapter: 'jpl-official', sourceRole: 'primary_oracle', coverageRole: 'full_service_range', canonicalEligible: true, canonical: false, testOnly: true, evidenceType: 'full_range_smoke', startEt: START_ET, endEtExclusive: START_ET, stepSeconds: STEP_SECONDS, timestampCount: SMOKE_TIMESTAMP_COUNT, targetCount: TARGETS.length, expectedRowCount: SMOKE_EXPECTED_ROW_COUNT }),
  'cspice-overlap-smoke': Object.freeze({ adapter: 'cspice-overlap', sourceRole: 'independent_cross_reference', coverageRole: 'overlap_only', canonicalEligible: false, canonical: false, testOnly: true, evidenceType: 'overlap_smoke', startEt: '0.0000000000000000e+00', endEtExclusive: '0.0000000000000000e+00', stepSeconds: STEP_SECONDS, timestampCount: SMOKE_TIMESTAMP_COUNT, targetCount: TARGETS.length, expectedRowCount: SMOKE_EXPECTED_ROW_COUNT }),
})
export const ROW_KEYS = ['schemaVersion','etSeconds','targetId','target','targetType','observerId','observer','frame','aberrationCorrection','positionKm','velocityKmPerSecond']
export const VECTOR_KEYS = ['x','y','z']
export const DECIMAL_RE = /^-?(?:0|[1-9]\d*)\.\d{16}e[+-]\d{2,}$/
export const REQUIRED_MANIFEST_FIELDS = ['manifestSchemaVersion','canonicalId','materializationProfile','canonical','status','provenanceStatus','contractDocument','primarySource','upstreamReferenceSource','sourceFiles','reader','runner','requiredKernels','timeAxis','targets','observer','frame','aberrationCorrection','units','serialization','jsonlSchemaVersion','ordering','determinism','output','generationCommand','createdByCommit']
export const REQUIRED_ROLE_FIELDS = ['sourceRole','coverageRole','canonicalEligible','evidenceType','sourceCoverageStartEt','sourceCoverageEndEt','coverageStartReadable','coverageEndReadable','requestedStartEt','requestedEndExclusiveEt','coverageVerified','coverageTool','coverageToolVersion','coverageCommand','coverageOutputSha256','fallbackAllowed','testOnly']

export function expectedEt(index) {
  return Number(START_ET) + index * STEP_SECONDS
}

export function formatDecimal(value) {
  if (!Number.isFinite(value)) throw new Error('non-finite numeric value')
  if (Object.is(value, -0)) value = 0
  return value.toExponential(16).replace(/e([+-])(\d+)$/, (_, sign, exponent) => `e${sign}${exponent.padStart(2, '0')}`)
}

export function getMaterializationProfile(manifest) {
  if (!MATERIALIZATION_PROFILES.includes(manifest.materializationProfile)) throw new Error('unsupported DE405 materialization profile')
  return manifest.materializationProfile
}

export function assertMaterializationProfile(manifest) {
  const profile = getMaterializationProfile(manifest)
  const expected = PROFILE_CONTRACTS[profile]
  for (const field of REQUIRED_ROLE_FIELDS) if (!(field in manifest)) throw new Error(`missing source-role field: ${field}`)
  if (manifest.synthetic === true) {
    if (manifest.canonical === true || manifest.canonicalEligible === true || manifest.testOnly !== true || manifest.provenanceStatus !== 'synthetic_contract_evidence' || ['verified', 'production'].includes(manifest.status)) {
      throw new Error('synthetic artifact cannot claim canonical, eligible, or verified production status')
    }
  }
  const expectedTestOnly = manifest.synthetic ? true : expected.testOnly
  const expectedCanonical = manifest.synthetic ? false : expected.canonical
  if (manifest.sourceRole !== expected.sourceRole || manifest.coverageRole !== expected.coverageRole || manifest.testOnly !== expectedTestOnly || manifest.canonical !== expectedCanonical || manifest.fallbackAllowed !== false) throw new Error('source-role contract mismatch')
  if (manifest.synthetic !== true && manifest.canonicalEligible !== expected.canonicalEligible) throw new Error('canonicalEligible contract mismatch')
  if (manifest.requestedStartEt !== expected.startEt || manifest.requestedEndExclusiveEt !== expected.endEtExclusive) throw new Error('requested ET range mismatch')
  if (manifest.coverageVerified !== true || typeof manifest.sourceCoverageStartEt !== 'string' || typeof manifest.sourceCoverageEndEt !== 'string' || !Number.isFinite(Number(manifest.sourceCoverageStartEt)) || !Number.isFinite(Number(manifest.sourceCoverageEndEt)) || Number(manifest.sourceCoverageStartEt) > Number(manifest.sourceCoverageEndEt) || typeof manifest.coverageStartReadable !== 'string' || typeof manifest.coverageEndReadable !== 'string' || typeof manifest.coverageTool !== 'string' || typeof manifest.coverageToolVersion !== 'string' || typeof manifest.coverageCommand !== 'string' || !/^[0-9a-f]{64}$/.test(manifest.coverageOutputSha256)) throw new Error('coverage metadata missing or invalid')
  if (profile === 'jpl-full-range-regular-grid' || profile === 'jpl-full-range-smoke') {
    if (manifest.sourceCoverageStartEt !== JPL_SOURCE_COVERAGE_START_ET || manifest.sourceCoverageEndEt !== JPL_SOURCE_COVERAGE_END_ET) throw new Error('JPL source coverage mismatch')
    if (manifest.reader?.name !== 'JPL official testeph.f reader' || !['unresolved', 'confirmed'].includes(manifest.reader?.targetContractStatus)) throw new Error('JPL reader identity or target contract mismatch')
  } else if (manifest.sourceCoverageStartEt !== CSPICE_COVERAGE_START_ET || manifest.sourceCoverageEndEt !== CSPICE_COVERAGE_END_ET) throw new Error('CSPICE source coverage mismatch')
  else if (manifest.reader?.name !== 'CSPICE' || manifest.reader?.version !== 'N0067') throw new Error('CSPICE reader identity mismatch')
  if (profile === 'jpl-full-range-regular-grid') {
    const grid = manifest.regularGrid ?? manifest.timeContract
    if (!grid || grid.regularGridStartEt !== expected.startEt || grid.regularGridEndExclusiveEt !== expected.endEtExclusive || Number(grid.regularGridStepSeconds) !== expected.stepSeconds || Number(grid.regularGridTimestampCount) !== expected.timestampCount || Number(manifest.targetCount ?? grid.targetCount) !== expected.targetCount || Number(manifest.expectedRowCount ?? grid.expectedRowCount) !== expected.expectedRowCount) throw new Error('canonical v2 JPL regular-grid invariant mismatch')
    if (manifest.synthetic === true) {
      if (manifest.canonical !== false || !['draft', 'smoke_draft'].includes(manifest.status) || manifest.provenanceStatus !== 'synthetic_contract_evidence') throw new Error('synthetic regular-grid manifest state mismatch')
    } else {
      if (manifest.canonical !== true || !['draft', 'verified'].includes(manifest.status) || !['contract_ready', 'verified'].includes(manifest.provenanceStatus)) throw new Error('regular-grid manifest state mismatch')
    }
  } else if (profile === 'jpl-full-range-smoke' || profile === 'cspice-overlap-smoke') {
    const smoke = manifest.smoke
    if (!smoke || smoke.startEt !== expected.startEt || Number(smoke.stepSeconds) !== expected.stepSeconds || Number(smoke.timestampCount) !== expected.timestampCount || Number(smoke.targetCount) !== expected.targetCount || Number(smoke.expectedRowCount) !== expected.expectedRowCount || manifest.canonical !== false || !['smoke_draft', 'smoke_verified'].includes(manifest.status) || !['test_only', 'synthetic_contract_evidence'].includes(manifest.provenanceStatus)) throw new Error('canonical v2 smoke invariant mismatch')
  }
  if (JSON.stringify(manifest.targets?.map(t => t.targetId)) !== JSON.stringify(TARGETS.map(t => t.targetId))) throw new Error('target list mismatch')
  return expected
}

export function assertRequestedEtCoverage(manifest) {
  const profile = assertMaterializationProfile(manifest)
  if (profile.adapter !== 'cspice-overlap') return profile
  const start = Number(manifest.requestedStartEt)
  const coverageStart = Number(manifest.sourceCoverageStartEt)
  const coverageEnd = Number(manifest.sourceCoverageEndEt)
  if (!Number.isFinite(start) || start < coverageStart || start > coverageEnd) throw new Error('requested ET is outside verified CSPICE coverage')
  if (manifest.requestedEndExclusiveEt !== manifest.requestedStartEt) throw new Error('overlap smoke must have a single requested ET')
  return profile
}

export function assertGridManifest(manifest) {
  if (getMaterializationProfile(manifest) !== 'jpl-full-range-regular-grid') throw new Error('JPL full-range regular-grid profile required')
  return assertMaterializationProfile(manifest)
}

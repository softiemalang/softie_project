#!/usr/bin/env node
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const outputPath = resolve(process.env.TRUE_NODE_FRONTIER_V4_OUTPUT || join(root, 'artifacts/astrology-true-node-independent-frontier-v4/complete.json'))
const expectedHead = 'a7dc1cd384516cffc14eace29b5f10defdf67c24'
const externalInspectionAt = '2026-08-09T06:26:47Z'

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex')
}

function sha256File(path) {
  return sha256(readFileSync(path))
}

function canonicalSha256(value) {
  return sha256(Buffer.from(`${JSON.stringify(value)}\n`))
}

function readJson(path) {
  return JSON.parse(readFileSync(resolve(root, path), 'utf8'))
}

function git(args) {
  return execFileSync('git', ['-C', root, ...args], { encoding: 'utf8' }).trim()
}

function isAncestor(ancestor, descendant) {
  try {
    execFileSync('git', ['-C', root, 'merge-base', '--is-ancestor', ancestor, descendant])
    return true
  } catch {
    return false
  }
}

const independent = readJson('artifacts/astrology-true-node-independent-v0/complete.json')
const horizons = readJson('artifacts/astrology-true-node-horizons-erfa-v2/complete.json')
const frame = readJson('artifacts/astrology-true-node-frame-diagnostic-v1/complete.json')
const lightTime = readJson('artifacts/astrology-true-node-light-time-diagnostic-v1/complete.json')
const astrologManifest = readJson('spikes/astrology-independent-reference/fixtures/manifest.json')
const productionRuleSource = readFileSync(resolve(root, 'src/astrology/astrologyRuleCore.js'), 'utf8')
const productionResolverSource = readFileSync(resolve(root, 'src/astrology/planetResolver.js'), 'utf8')

const sourcePaths = [
  'src/astrology/astrologyContract.js',
  'src/astrology/astrologyRuleCore.js',
  'src/astrology/astrologyTimeScales.js',
  'src/astrology/planetResolver.js',
  'spikes/astrology-true-node-independent/README.md',
  'spikes/astrology-independent-reference/README.md',
  'spikes/astrology-independent-reference/fixtures/manifest.json',
  'docs/astrology-true-node-reference.md',
  'docs/astrology-true-node-independent-frontier-v3.md',
  'artifacts/astrology-true-node-independent-v0/complete.json',
  'artifacts/astrology-true-node-horizons-erfa-v2/complete.json',
  'artifacts/astrology-true-node-frame-diagnostic-v1/complete.json',
  'artifacts/astrology-true-node-light-time-diagnostic-v1/complete.json',
  'test/astrologyTrueNodeIndependent.test.js',
]

const sourceFiles = sourcePaths.map((path) => {
  const absolute = resolve(root, path)
  if (!existsSync(absolute)) throw new Error(`source file missing: ${path}`)
  return { path, sizeBytes: statSync(absolute).size, sha256: sha256File(absolute) }
})

const branch = git(['branch', '--show-current'])
const currentHead = git(['rev-parse', 'HEAD'])
const originMainHead = git(['rev-parse', 'origin/main'])
if (branch !== 'main' || !isAncestor(expectedHead, currentHead) || !isAncestor(expectedHead, originMainHead)) {
  throw new Error(`unexpected repository basis: ${JSON.stringify({ branch, currentHead, originMainHead, expectedHead })}`)
}

const payload = {
  schemaVersion: 'astrology-true-node-independent-frontier-v4',
  verdictToken: 'complete_western_true_node_independent_oracle_frontier_exhausted_uncommitted',
  availability: 'research_only',
  access: {
    branch,
    currentHead: expectedHead,
    originMainHead: expectedHead,
    expectedBaselineHead: expectedHead,
    externalInspectionAt,
    externalAccess: 'read_only',
  },
  scope: {
    productionSemanticPromotion: false,
    productionProviderChanged: false,
    toleranceChanged: false,
    readinessChanged: false,
    activationChanged: false,
    deployOrRemoteMutation: false,
    historicalArtifactsRewritten: false,
    unrelatedUntrackedPreserved: ['-.jpg'],
  },
  productionContractAudit: {
    status: 'not_defined_for_true_node',
    finding: 'The repository has no production True Node provider. true_node and mean_node are explicit unsupported bodies; the legacy resolver is a date-seed simulation and is not an astronomical source.',
    fields: {
      ascendingNode: { status: 'name_only', observed: 'lunar ascending / north node by identifier and research docs', authority: 'unresolved' },
      nodeType: { status: 'name_only', observed: 'true_node is separate from mean_node in the unsupported list', authority: 'unresolved' },
      center: { status: 'repository_default_only', observed: 'geocentric chart default', authority: 'unresolved_for_true_node' },
      zodiac: { status: 'repository_default_only', observed: 'tropical chart default', authority: 'unresolved_for_true_node' },
      referencePlaneFrameEquinox: { status: 'research_only', observed: 'candidate uses mean ecliptic/equinox of date; Swiss and Horizons expose additional frame choices', authority: 'unresolved_for_production' },
      timeScaleEpoch: { status: 'general_contract_only', observed: 'TT requires explicit TT-UTC and UT1 requires explicit DUT1; research corpus uses TDB with paired synthetic TT', authority: 'unresolved_for_true_node' },
      apparentGeometricCorrections: { status: 'research_only', observed: 'Swiss flags and Horizons geometric VEC_CORR=NONE were compared; no production choice exists', authority: 'unresolved_for_production' },
      longitudeNormalization: { status: 'candidate_only', observed: '[0,360) normalization exists in the isolated candidate', authority: 'unresolved_for_production' },
      tolerance: { status: 'none_declared', observed: 'all True Node comparisons remain diagnostic-only', authority: 'no_acceptance_tolerance_authorized' },
    },
    evidenceRefs: [
      'src/astrology/astrologyRuleCore.js:31-40',
      'src/astrology/astrologyContract.js:7-14',
      'src/astrology/astrologyTimeScales.js:18-123',
      'src/astrology/planetResolver.js:42-73',
      'docs/astrology-true-node-reference.md:6-20',
    ],
  },
  oracleFrontier: [
    {
      candidate: 'Swiss SE_TRUE_NODE',
      independence: 'comparison_reference_only',
      sameQuantity: 'observed Swiss target, but it is the quantity under explanation',
      authority: 'not_independent',
      blocker: 'No independent semantic bridge to a production contract; source/license boundary remains separate.',
    },
    {
      candidate: 'local DE405 state-derived osculating node',
      independence: 'independent_algorithm_path_but_shared_candidate_data',
      sameQuantity: 'explicit geometric geocentric osculating construction',
      authority: 'not_established',
      blocker: 'The derivation is a repository candidate, not proof that production True Node means this exact state/frame/correction combination.',
    },
    {
      candidate: 'CSPICE DE405 overlap',
      independence: 'same_kernel_control',
      sameQuantity: 'same state-derived candidate quantity',
      authority: 'not_independent',
      blocker: 'The SPK contains the same DE405 family/input lineage; wrapper diversity does not create independent data authority.',
    },
    {
      candidate: 'NASA/JPL Horizons DE441 vectors and OM',
      independence: 'same_family_corroboration',
      sameQuantity: 'geometric geocentric state and osculating OM, not direct tropical/date True Node',
      authority: 'raw_physical_quantity_only',
      blocker: 'DE441 is JPL-family corroboration, and OM reference-plane/equinox semantics do not by themselves bridge to the product contract.',
    },
    {
      candidate: 'ERFA/SOFA eraMoon98',
      independence: 'independent_analytic_negative_control',
      sameQuantity: 'geocentric Moon position/velocity from Meeus model; node is a repository derivation',
      authority: 'not_precision_authority',
      blocker: 'Official source documents RMS 2.9 arcsec and worst 18.3 arcsec geocentric direction error versus ELP/MPP02; it has no canonical True Node output.',
    },
    {
      candidate: 'Astrolog 8.00 Matrix-only',
      independence: 'independent_build_path_when_features_disabled',
      sameQuantity: 'own true-node-labelled approximation',
      authority: 'not_established',
      blocker: 'ComputeLunar uses a short perturbation series; it is not a documented high-precision semantic authority and the GPL-2.0-or-later source is not a production dependency.',
    },
    {
      candidate: 'local Skyfield 1.53 with DE440',
      independence: 'same_family_wrapper_corroboration',
      sameQuantity: 'DE440 geocentric state only; no direct True Node API',
      authority: 'not_independent_authority',
      blocker: 'The 134-row state comparison to Horizons DE441 is a JPL-family/data corroboration; Skyfield/jplephem wrapper diversity does not establish semantic identity.',
      observedComparison: { rowCount: 134, horizonsDe441PositionNormMaxKm: 0.011970024595391352, horizonsDe441VelocityNormMaxKmPerSecond: 3.325526311864916e-8 },
      source: { pathOutsideRepository: '/Users/softie/Documents/spotify_server/fortune/database/astronomy/de440.bsp', sha256: 'a4ce9bf9b3282becc9f4b2ac3cebe03a2ae7599981aabd7265fd8482fff7c4b5', wrapper: 'Skyfield 1.53 / jplephem 2.23', observationCommand: 'read-only Skyfield DE440 state versus preserved Horizons DE441 vectors' },
    },
    {
      candidate: 'Astronomy Engine',
      independence: 'independent_library',
      sameQuantity: 'Moon node event time, not instantaneous longitude',
      authority: 'not_applicable',
      blocker: 'Official API exposes ascending/descending Moon ecliptic-plane crossing events but no instantaneous tropical/date True Node longitude.',
    },
    {
      candidate: 'USNO NOVAS',
      independence: 'independent_astrometry_library',
      sameQuantity: 'general positions/velocities and transformations, no direct True Node field found',
      authority: 'not_applicable_as_direct_oracle',
      blocker: 'Using NOVAS to derive a node would create another derived implementation and still require the unresolved semantic bridge.',
    },
  ],
  corpus: {
    inheritedDe405Swiss: {
      rowCount: independent.comparison.summary.rowCount,
      maxAbsoluteDifferenceArcseconds: independent.comparison.summary.maxAbsoluteDifferenceArcseconds,
      p50AbsoluteDifferenceArcseconds: independent.comparison.summary.p50AbsoluteDifferenceArcseconds,
      p95AbsoluteDifferenceArcseconds: independent.comparison.summary.p95AbsoluteDifferenceArcseconds,
      p99AbsoluteDifferenceArcseconds: independent.comparison.summary.p99AbsoluteDifferenceArcseconds,
      coverage: independent.corpus.timeAxis,
      boundaryRows: independent.corpus.boundaryRows.length,
      result: 'diagnostic_only_no_tolerance_pass',
    },
    horizonsErfa: {
      rowCount: horizons.corpus.rowCount,
      horizonsDateVsSwissMeanFrameMaxArcseconds: horizons.comparison.summaries.horizonsDateVsSwiss.maxAbsoluteDifferenceArcseconds,
      horizonsDateVsLocalDe405MaxArcseconds: horizons.comparison.summaries.horizonsDateVsLocalDe405.maxAbsoluteDifferenceArcseconds,
      horizonsElementVectorConsistencyMaxArcseconds: horizons.comparison.summaries.horizonsElementVectorConsistency.maxAbsoluteDifferenceArcseconds,
      erfaMoon98VsSwissMaxArcseconds: horizons.comparison.summaries.erfaMoon98VsSwiss.maxAbsoluteDifferenceArcseconds,
      coverage: horizons.corpus.coverage,
      result: 'diagnostic_only_no_tolerance_pass',
    },
    boundedDiagnostics: {
      frameMeanEquinoxMaxArcseconds: frame.inference.observedMeanEquinoxMaxArcseconds,
      frameDefaultMaxArcseconds: frame.inference.observedDefaultMaxArcseconds,
      lightTimeEffectMaxArcseconds: lightTime.inference.maxLightTimeEffectArcseconds,
      result: 'hypothesis_evidence_only',
    },
    Astrolog: {
      rows: astrologManifest.outputs ? 3 : 0,
      repeatBuildSha256Matched: astrologManifest.build.repeatBuildSha256Matched,
      trueNodeReferenceAccepted: false,
      result: 'raw_observation_only',
    },
  },
  externalSources: [
    { title: 'Swiss Ephemeris: Lunar and Planetary Nodes and Apsides', url: 'https://www.astro.com/swisseph-download/doc/swisseph.pdf', accessedAt: externalInspectionAt, role: 'true-node definition corroboration only' },
    { title: 'Swiss Ephemeris Programmer\'s Manual', url: 'https://www.astro.com/swisseph/swephprg.pdf', accessedAt: externalInspectionAt, role: 'flags/body metadata and convention corroboration only' },
    { title: 'NASA/JPL Horizons Manual', url: 'https://ssd.jpl.nasa.gov/horizons/manual.html', accessedAt: externalInspectionAt, role: 'official state/oscillating-element quantity and frame provenance' },
    { title: 'ERFA eraMoon98 source', url: 'https://raw.githubusercontent.com/liberfa/erfa/master/src/moon98.c', accessedAt: externalInspectionAt, role: 'independent analytic accuracy boundary' },
    { title: 'Astronomy Engine public C API', url: 'https://raw.githubusercontent.com/cosinekitty/astronomy/master/source/c/astronomy.h', accessedAt: externalInspectionAt, role: 'official API surface audit; event node only' },
    { title: 'USNO NOVAS information', url: 'https://aa.usno.navy.mil/software/novas_info', accessedAt: externalInspectionAt, role: 'official general astrometry API audit; no direct True Node field' },
    { title: 'Astrolog pinned source', url: 'https://github.com/CruiserOne/Astrolog/tree/5bf172ea231c4b6ea3d7e09ca307571354a41e8a', accessedAt: externalInspectionAt, role: 'source/build audit; GPL Matrix approximation' },
  ],
  readinessBoundary: {
    independentTrueNodeReference: 'pending',
    authorityFrontier: 'exhausted_under_current_permissions',
    qualification: 'blocked_semantic_identity_insufficient',
    productionProviderChanged: false,
    activationChanged: false,
    toleranceChanged: false,
    interpretationEligibility: 'unchanged_blocked_by_existing_contracts',
    remainingBlockers: [
      'production True Node semantic is not implemented or contractually defined',
      'no independent high-precision implementation or dataset directly exposes the same complete quantity',
      'frame/equinox/time-scale/correction equivalence is unresolved',
      'a production dependency decision would require licensing and policy review',
    ],
    requiredNextEvidence: 'A source-backed, license-usable independent implementation or dataset must directly define and emit the same geocentric tropical instantaneous True Node, or an independent adjudication must formally bridge the JPL osculating OM/state construction to that contract.',
  },
  provenance: {
    materializerPath: 'scripts/materialize-astrology-true-node-independent-frontier-v4.mjs',
    sourceFiles,
    generatedWithoutNetwork: true,
    externalSourcesReadOnly: true,
    historicalInputArtifactHashes: {
      independentV0: sha256File(resolve(root, 'artifacts/astrology-true-node-independent-v0/complete.json')),
      horizonsErfaV2: sha256File(resolve(root, 'artifacts/astrology-true-node-horizons-erfa-v2/complete.json')),
      frameDiagnosticV1: sha256File(resolve(root, 'artifacts/astrology-true-node-frame-diagnostic-v1/complete.json')),
      lightTimeDiagnosticV1: sha256File(resolve(root, 'artifacts/astrology-true-node-light-time-diagnostic-v1/complete.json')),
    },
    productionUnsupportedEvidence: {
      trueNodeListed: productionRuleSource.includes("'true_node'"),
      meanNodeListed: productionRuleSource.includes("'mean_node'"),
      legacySimulationMarked: productionResolverSource.includes('simulation_only'),
    },
  },
}

const output = { ...payload, payloadCanonicalSha256: canonicalSha256(payload) }
mkdirSync(dirname(outputPath), { recursive: true })
writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`)
console.log(JSON.stringify({ outputPath: relative(root, outputPath), payloadCanonicalSha256: output.payloadCanonicalSha256, verdictToken: output.verdictToken }, null, 2))

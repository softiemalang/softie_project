import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, relative, resolve } from 'node:path'

import {
  attachArtifactIdentity,
  buildArtifactIdentity,
  canonicalStableArtifactJson,
  checkHistoricalRepositoryBasis,
} from '../src/artifactIdentity.js'
import { evaluateBoundedContinuation } from '../src/boundedContinuationGate.js'
import * as v14 from './materialize-ziwei-p0-palace-branch-slot-composition-v14.mjs'

export const SCHEMA = 'ziwei-p0-palace-branch-slot-composition-v15'
export const VERDICT = 'complete_ziwei_palace_branch_slot_composition_with_reported_suzhou_chart_lead_graph_neutral_derived_not_authoritative'
export const MATERIALIZER_VERSION = '15.0.0'
export const BASIS_HEAD = v14.BASIS_HEAD
export const MATERIALIZER_PATH = 'scripts/materialize-' + SCHEMA + '.mjs'
export const ARTIFACT_DIR = 'artifacts/' + SCHEMA
export const ARTIFACT_PATH = ARTIFACT_DIR + '/complete.json'
export const DOCUMENTATION_PATH = 'docs/ziwei-p0-palace-branch-slot-composition-v15.md'
export const CHECKER_PATH = 'scripts/check-' + SCHEMA + '.mjs'
export const NEGATIVE_CHECKER_PATH = 'scripts/check-' + SCHEMA + '-negative-v0.mjs'
export const ROOT = resolve(new URL('..', import.meta.url).pathname)
export const PREDECESSOR_COMPOSITION = v14.ARTIFACT_PATH
export const PREDECESSOR_COMPOSITION_EVIDENCE = v14.ARTIFACT_DIR + '/evidence.json'
export const PROTECTED_ASSET_PATH = v14.PROTECTED_ASSET_PATH

export const CANDIDATE_JIELAN = v14.CANDIDATE_JIELAN
export const CANDIDATE_ERXIANAN = v14.CANDIDATE_ERXIANAN
export const CANDIDATE_JIELAN_PREVIEW = v14.CANDIDATE_JIELAN_PREVIEW
export const CANDIDATE_SUZHOU = 'candidate-jielan-suzhou-museum-reported-chart-lead-v15'
export const OBSERVATION_SUZHOU = 'frontier-obs-jielan-suzhou-reported-chart-image-boundary-v15'

export const SUZHOU_REPORT_URL = 'https://superskylightfy.blogspot.com/2017/04/blog-post_18.html'
export const SUZHOU_REPORT_IMAGE_URL = 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjNl-BVTukzfu42scKdjSHYydkPIMUA7ZLL8MHp7qqNjbp6t_YNaQVBwND7tIHq3XYaIm-Es_bInYwDernNHNgKaTmrq_jZO-EjjVsxmirN9Hulle_6ITWujd1hvPz2RNB1w1U36LA9m58/s1600/%25E6%258D%25B7%E8%A6%BD%257E%E7%B8%BD%E5%88%B6.JPG'
export const SUZHOU_REPORT_HTML_SHA256 = '4c26693bf3752ef08d6d438cadf60caad06699322f443ed969b6cc6587ba0742'
export const SUZHOU_REPORT_IMAGE_SHA256 = '9805777863bf5925bf025f5d6144f817af53cc8352cc128c7c60e2b4300ce9c7'
export const SUZHOU_REPORT_HTML_BYTES = 123108
export const SUZHOU_REPORT_IMAGE_BYTES = 269045

export const INPUT_PATHS = [...new Set([
  ...v14.INPUT_PATHS,
  PREDECESSOR_COMPOSITION,
  PREDECESSOR_COMPOSITION_EVIDENCE,
  DOCUMENTATION_PATH,
  MATERIALIZER_PATH,
  CHECKER_PATH,
  NEGATIVE_CHECKER_PATH,
])]

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const clone = value => structuredClone(value)
const unique = values => [...new Set(values)]
const readJson = (root, path) => JSON.parse(readFileSync(resolve(root, path), 'utf8'))
const fileSha256 = (root, path) => sha256(readFileSync(resolve(root, path)))
const requireValue = (condition, message) => { if (!condition) throw new Error(message) }
const git = (root, args) => execFileSync('git', ['-c', 'core.fsmonitor=false', ...args], { cwd: root, encoding: 'utf8' }).trim()
export const canonicalJson = v14.canonicalJson
const direct = detail => ({ status: 'direct', detail })
const reported = detail => ({ status: 'reported', detail })
const unresolved = detail => ({ status: 'unresolved', detail })

function repository(root) {
  return {
    branch: git(root, ['branch', '--show-current']),
    currentHead: git(root, ['rev-parse', 'HEAD']),
    originMainHead: git(root, ['rev-parse', 'origin/main']),
  }
}

function predecessorInput(root) {
  const generated = v14.buildBundle(root, { mode: 'historical_reference' })
  const stored = readJson(root, PREDECESSOR_COMPOSITION)
  const storedEvidence = readJson(root, PREDECESSOR_COMPOSITION_EVIDENCE)
  requireValue(canonicalStableArtifactJson(stored) === canonicalStableArtifactJson(generated.artifact), 'v14_predecessor_complete_drift')
  requireValue(canonicalStableArtifactJson(storedEvidence) === canonicalStableArtifactJson(generated.files['evidence.json']), 'v14_predecessor_evidence_drift')
  requireValue(generated.artifact.schemaVersion === v14.SCHEMA, 'unexpected_v14_schema')
  requireValue(JSON.stringify(generated.artifact.graphImpact.successor) === JSON.stringify({ claimCount: 30, sourceCount: 21, observationCount: 58, relationCount: 148, blockerCount: 11 }), 'unexpected_v14_graph_counts')
  return { generated, storedEvidence }
}

function bindingBoundary(reason) {
  return {
    branchToken: unresolved(reason),
    palaceName: unresolved(reason),
    physicalChartSlot: unresolved(reason),
    ordinalBase: unresolved(reason),
    direction: unresolved(reason),
    fullBinding: false,
    directSingleWitnessFullBinding: false,
    productionOrdinal: false,
    semanticAuthority: false,
  }
}

function suzhouSourceRecord() {
  return {
    sourceId: CANDIDATE_SUZHOU,
    sourceKind: 'secondary_blog_report_with_embedded_chart_image',
    role: 'secondary_reported_holdership_and_direct_image_observation_only',
    url: SUZHOU_REPORT_URL,
    imageUrl: SUZHOU_REPORT_IMAGE_URL,
    reportPublicationDate: '2017-04-18',
    reportHtmlByteSha256: SUZHOU_REPORT_HTML_SHA256,
    reportImageByteSha256: SUZHOU_REPORT_IMAGE_SHA256,
    independentPhysicalWitness: false,
    sourceAuthority: 'not_established',
    semanticAuthority: 'not_established',
    sourceIdentityStatus: 'unresolved',
    sameCopyStatus: 'unresolved',
    graphAdmission: false,
  }
}

function suzhouDossier() {
  return {
    unitId: 'quaternary-jielan-suzhou-museum-chart-lead',
    candidateId: CANDIDATE_SUZHOU,
    role: 'secondary reported holding lead with a directly reviewed chart-like image; original leaf provenance unresolved',
    evidenceGrade: 'D_secondary_reported_holding_C_direct_chart_image_without_leaf_provenance',
    sourceIdentity: {
      reportUrl: direct(SUZHOU_REPORT_URL),
      reportPublicationDate: direct('2017-04-18'),
      reportPageTitle: direct('評論《新刻纂集紫微斗數捷覽》(一)'),
      reportedTitle: reported('新刻纂集紫微斗數捷覽'),
      reportedExtent: reported('木刻本四卷'),
      reportedEdition: reported('金陵書坊王氏洛川刊本'),
      reportedHolding: reported('曾在蘇州博物館內'),
      reportedHoldingStatus: 'secondary_report_only; current institutional custody not established',
      catalogComparison: unresolved('the report says 王氏洛川; 子4051 metadata says 王洛川; no original leaf or institutional record resolves the name/copy relation'),
      itemIdentifier: unresolved('no Suzhou Museum item or call number exposed'),
      sourceAuthority: unresolved('no institutional item-level provenance or authorized surrogate'),
      sameCopyAsAnhuiZi4051: unresolved('edition-label similarity is insufficient; seals, strokes, annotations, and damage cannot be compared without the 安徽 leaf'),
    },
    sourceBytes: {
      reportHtml: {
        url: SUZHOU_REPORT_URL,
        byteSha256: SUZHOU_REPORT_HTML_SHA256,
        byteLength: SUZHOU_REPORT_HTML_BYTES,
        parentVerified: true,
        role: 'retrieved secondary report bytes; not historical source bytes',
      },
      embeddedImage: {
        url: SUZHOU_REPORT_IMAGE_URL,
        byteSha256: SUZHOU_REPORT_IMAGE_SHA256,
        byteLength: SUZHOU_REPORT_IMAGE_BYTES,
        width: 470,
        height: 784,
        components: 1,
        parentVerified: true,
        role: 'retrieved image bytes; physical page identity unresolved',
      },
    },
    directImageReview: {
      retrievedBytesVisuallyReviewed: true,
      reportedCaption: reported('胡梅林總制命例'),
      visibleLabels: [direct('命'), direct('身'), direct('土立局')],
      chartLikeGrid: direct('rectilinear grid-like layout with arrows/annotations is visible'),
      sourceLeafMarkers: unresolved('no reliable 卷/葉/版心/牌記/簽跋 or item locator is visible in the reviewed image'),
      imageInterpretationBoundary: 'visible labels and geometry are observations of an unproven derivative image; they do not bind a branch token to a palace name, physical slot, ordinal, or direction',
    },
    acquisitionDossier: {
      institutionLead: '蘇州博物館',
      institutionLeadStatus: 'reported_past_or_unspecified_holding',
      exactRequest: 'Ask 蘇州博物館 to identify the reported copy, current or historical call number, and authorized high-resolution scans of the title/簽跋 or title/序/跋 leaves, the chart/worked-example leaf, and adjacent continuous leaves with 卷/葉/版心.',
      provenanceRequest: 'Request provenance, seals, annotations, damage markers, rights, and permission to compare the supplied image with 安徽省博物館 子4051 and the 2016 preview.',
      stopBoundary: 'institutional response or authorized surrogate is required; do not infer current custody or same-copy identity from the blog report',
    },
    fiveFieldBinding: bindingBoundary('direct image observation lacks a historical leaf and provenance-bearing physical slot'),
    graphAdmission: {
      sourceAdded: false,
      observationAdded: false,
      relationAdded: false,
      independentPhysicalWitnessAdmitted: false,
      reason: 'secondary report and embedded image are held outside the semantic graph until an institution-level item and leaf provenance are directly verified',
    },
    parentVerifiedObservations: [
      'The retrieved report bytes state that a four-volume woodblock 新刻纂集紫微斗數捷覽 was reported as a 金陵書坊王氏洛川 edition and had been in 蘇州博物館; this remains a secondary assertion.',
      'The embedded image bytes were directly reviewed at 470×784 and visibly contain a chart-like grid with 命, 身, and 土立局 labels; no OCR or semantic normalization is promoted.',
      'No institutional item identifier, 卷/葉/版心, title/colophon, continuous-leaf context, or five-field binding was observed, and same-copy relation to 安徽 子4051 remains unresolved.',
    ],
  }
}

function continuationDecision(root, previous) {
  const identity = value => sha256(Buffer.from(value))
  const attempt = {
    action: {
      actionId: 'acquire-suzhou-institutional-leaf',
      kind: 'source_resolution',
      command: 'institution request or authorized surrogate acquisition',
      args: ['蘇州博物館', '子4051-comparison', 'title-signature-chart-adjacent-leaves'],
      toolVersion: 'ziwei-p0-v15-acquisition-boundary-v0',
    },
    inputs: [
      { refId: 'v14-complete', identity: fileSha256(root, PREDECESSOR_COMPOSITION), resolution: 'resolved' },
      { refId: 'v14-evidence', identity: fileSha256(root, PREDECESSOR_COMPOSITION_EVIDENCE), resolution: 'resolved' },
      { refId: 'report-html', identity: SUZHOU_REPORT_HTML_SHA256, resolution: 'resolved' },
      { refId: 'report-image', identity: SUZHOU_REPORT_IMAGE_SHA256, resolution: 'resolved' },
    ],
    basis: {
      branch: 'main',
      basisHead: BASIS_HEAD,
      scopedWorktreeState: 'dirty',
      scopedWorktreeDigest: identity('main-v15-parent-verified-preexisting-dirty-worktree-preserved'),
      observedHeadRelevant: true,
      observedHead: BASIS_HEAD,
    },
    environment: {
      runtime: 'node-v15-local-runtime',
      platform: 'darwin-local',
      dependencyIdentity: identity('softie-project-dependencies-v15-local'),
      sourceIdentity: SUZHOU_REPORT_HTML_SHA256 + ':' + SUZHOU_REPORT_IMAGE_SHA256,
      networkCondition: 'local',
    },
    failure: { class: 'none', stage: 'none', code: 'none', signature: 'none', exitCode: 0, signal: null },
  }
  const workUnit = {
    progress: {
      newEvidence: [{ id: OBSERVATION_SUZHOU, verified: true }],
      newArtifacts: [],
      validatedFacts: [
        { id: 'fact-suzhou-report-html-byte-identity-v15', verified: true },
        { id: 'fact-suzhou-report-image-byte-identity-v15', verified: true },
      ],
      blockerReductions: [],
      nextFrontier: { id: 'frontier-suzhou-institution-request-v15', actionId: 'acquire-suzhou-institutional-leaf', checkable: false, authorized: false },
    },
    unknowns: [{ id: 'unknown-suzhou-item-level-provenance-v15', blocksParent: true }],
    blockers: previous.graphImpact.blockersStillOpen.map(id => ({ id, status: 'open', blocksParent: true })),
    scope: { acceptanceComplete: false, objectiveUnmet: true },
  }
  return evaluateBoundedContinuation({
    attempt,
    workUnit,
    parentVerification: { status: 'verified', mode: 'direct_recheck', recheckedValidationIds: ['check-report-html-sha256-v15', 'check-report-image-sha256-v15', 'visual-review-report-image-v15'] },
  })
}

function buildResearchDossier(root, previous) {
  const prior = previous.v14ResearchDossier
  const quaternary = suzhouDossier()
  const gate = continuationDecision(root, previous)
  const remainingAcquisitionTargets = [
    {
      priority: 1,
      holder: '蘇州博物館',
      holdingStatus: 'reported_past_or_unspecified_holding',
      reportUrl: SUZHOU_REPORT_URL,
      imageUrl: SUZHOU_REPORT_IMAGE_URL,
      required: 'institutional item/call number and authorized high-resolution title/簽跋, chart/worked-example, and adjacent continuous leaves with 卷/葉/版心 plus provenance and rights',
    },
    ...prior.remainingAcquisitionTargets.map(item => ({ ...clone(item), priority: (item.priority || 0) + 1 })),
  ]
  return {
    schemaVersion: SCHEMA + '-research-dossier-v0',
    researchDate: '2026-08-14',
    status: 'derived_not_authoritative_graph_neutral',
    predecessorDossierSchema: prior.schemaVersion,
    units: {
      primary: clone(prior.units.primary),
      secondary: clone(prior.units.secondary),
      tertiary: clone(prior.units.tertiary),
      quaternary,
    },
    candidates: [clone(prior.units.primary), clone(prior.units.secondary), clone(prior.units.tertiary), quaternary],
    fiveFieldSummary: {
      fieldNames: ['branchToken', 'palaceName', 'physicalChartSlot', 'ordinalBase', 'direction'],
      primaryAllUnresolved: true,
      secondaryAllUnresolved: true,
      tertiaryAllUnresolved: true,
      quaternaryAllUnresolved: true,
      directSingleWitnessFullBindingCount: 0,
      productionOrdinalBindingCount: 0,
      semanticAuthorityCount: 0,
    },
    blockers: clone(prior.blockers),
    graphBoundary: {
      claimsAdded: 0,
      sourcesAdded: 0,
      observationsAdded: 0,
      relationsAdded: 0,
      blockersClosed: [],
      independentPhysicalWitnessesAdmitted: 0,
      heldOutCandidateIds: [CANDIDATE_SUZHOU],
      heldOutObservationIds: [OBSERVATION_SUZHOU],
      reason: 'new direct image observation and secondary acquisition lead are recorded outside the canonical graph because physical leaf identity and source authority are absent',
      topLevelGraphCountsUnchanged: { claimCount: 30, sourceCount: 21, observationCount: 58, relationCount: 148, blockerCount: 11 },
    },
    readinessBoundary: clone(prior.readinessBoundary),
    exhaustedPaths: [
      ...prior.exhaustedPaths,
      'The 2017 secondary report and its embedded chart-like image were fetched and byte-verified, but no institution item, raw historical leaf, continuous-leaf context, or provenance-bearing surrogate was exposed; the route now stops at acquisition.',
    ],
    remainingAcquisitionTargets,
    continuationDecisions: {
      suzhouFrontier: gate,
      authorityBoundary: gate.authorityBoundary,
      interpretation: 'The bounded gate stops at the institution/authorized-surrogate boundary; the new image is progress, not semantic readiness or activation.',
    },
  }
}

function buildResearchFrontier(previous, dossier) {
  const source = suzhouSourceRecord()
  const observation = {
    observationId: OBSERVATION_SUZHOU,
    candidateId: CANDIDATE_SUZHOU,
    sourceRole: 'secondary_reported_holding_with_direct_embedded_image_review',
    directByteFindings: {
      reportHtml: { byteSha256: SUZHOU_REPORT_HTML_SHA256, byteLength: SUZHOU_REPORT_HTML_BYTES },
      embeddedImage: { byteSha256: SUZHOU_REPORT_IMAGE_SHA256, byteLength: SUZHOU_REPORT_IMAGE_BYTES, width: 470, height: 784 },
    },
    directVisualFindings: ['chart-like grid geometry is visible', '命, 身, and 土立局 labels are visible', 'no reliable 卷/葉/版心/牌記/簽跋 marker is visible'],
    fiveFieldBinding: { branchToken: 'not_bound', palaceName: 'not_bound', physicalSlot: 'not_bound', ordinalDirection: 'not_bound', fullBindingObserved: false },
    graphAdmission: false,
    sourceAdmission: false,
    independentPhysicalWitness: false,
    semanticAuthority: false,
    sameCopyAsAnhuiZi4051: 'unresolved',
    readinessImpact: 'none; existing readiness remains not_safe_to_start',
  }
  const lead = {
    leadId: 'lead-suzhou-museum-jielan-reported-chart-v15',
    sourceId: CANDIDATE_SUZHOU,
    observationId: OBSERVATION_SUZHOU,
    url: SUZHOU_REPORT_URL,
    imageUrl: SUZHOU_REPORT_IMAGE_URL,
    reportDate: '2017-04-18',
    result: 'secondary report and direct image bytes verified; no institutional item or historical leaf provenance located',
    doesNotEnterGraph: true,
    pageBytesAcquired: true,
    historicalLeafBytesAcquired: false,
    institutionalItemResolved: false,
    exactNextAction: 'request the reported copy, item/call number, and authorized title/簽跋/chart/adjacent leaves from 蘇州博物館',
  }
  return {
    ...clone(previous.researchFrontier),
    status: 'v15_suzhou_report_and_chart_image_held_outside_graph_acquisition_only',
    frontierOnlySources: unique([...(previous.researchFrontier.frontierOnlySources || []), CANDIDATE_SUZHOU]),
    frontierOnlyObservations: [...(previous.researchFrontier.frontierOnlyObservations || []), observation],
    acquisitionLeads: [...(previous.researchFrontier.acquisitionLeads || []), lead],
    v15SourceRecord: source,
    v15ObservationRecord: observation,
    graphImpact: { ...clone(previous.researchFrontier.graphImpact), sourcesAdded: [], observationsAdded: [], relationsAdded: [], blockersClosed: [], claimsAdded: 0, independentPhysicalWitnessesAdmitted: 0 },
    v15ResearchBoundary: dossier.graphBoundary,
  }
}

function buildArtifact(root = ROOT, { mode = 'exact' } = {}) {
  for (const path of INPUT_PATHS) requireValue(existsSync(resolve(root, path)), 'missing_input:' + path)
  const repo = repository(root)
  requireValue(repo.branch === 'main', 'composition_requires_main')
  if (mode === 'exact') {
    requireValue(repo.currentHead === BASIS_HEAD, 'composition_basis_must_be_current_head')
    requireValue(repo.originMainHead === BASIS_HEAD, 'composition_origin_must_match_basis_head')
  } else if (mode === 'historical_reference') {
    const historical = checkHistoricalRepositoryBasis(root, BASIS_HEAD, { expectedBranch: 'main' })
    requireValue(historical.errors.length === 0, 'historical_reference_basis_invalid:' + historical.errors.join(','))
  } else {
    requireValue(false, 'unsupported_materialization_mode:' + mode)
  }

  const predecessor = predecessorInput(root)
  const previous = predecessor.generated.artifact
  const dossier = buildResearchDossier(root, previous)
  const researchFrontier = buildResearchFrontier(previous, dossier)
  const evidence = {
    ...clone(previous.evidence),
    schemaVersion: SCHEMA + '-evidence-v0',
    authorityBoundary: 'v15 adds one parent-verified secondary report and embedded chart-image observation as a graph-neutral acquisition lead. It does not establish an original leaf, source authority, physical-copy identity, five-field binding, readiness, or activation.',
    v15ResearchDossier: dossier,
    reportedNonObservations: unique([
      ...(previous.evidence.reportedNonObservations || []),
      'The Suzhou report is a secondary holding assertion; it does not establish current institutional custody, an item identifier, or same-copy identity with 安徽 子4051.',
      'The retrieved chart-like image has no verified 卷/葉/版心/牌記/簽跋 or continuous-leaf context; visible 命/身/土立局 labels are not a five-field semantic binding.',
      'The catalog facsimile and 2016 commercial preview remain locators or derivative evidence only; no exact historical raw leaf was acquired in this successor.',
    ]),
  }
  const bindingMatrix = { ...clone(previous.bindingMatrix), schemaVersion: SCHEMA + '-binding-matrix-v0', v15ResearchDossier: dossier.fiveFieldSummary }
  const lineageAssessment = {
    ...clone(previous.lineageAssessment),
    schemaVersion: SCHEMA + '-lineage-v0',
    sourceIdentityStatus: previous.lineageAssessment.sourceIdentityStatus + '; v15 records a secondary 蘇州博物館 holding report and fixed image bytes, but item-level provenance and relation to 安徽 子4051 remain unresolved',
    independenceStatus: previous.lineageAssessment.independenceStatus + ' v15 does not admit the reported Suzhou image as an independent physical witness or same-copy evidence.',
    v15ResearchDossier: dossier,
  }
  const fieldKitImpact = {
    ...clone(previous.fieldKitImpact),
    schemaVersion: SCHEMA + '-field-kit-v0',
    heldEvidenceUpdate: 'v15 records the parent-verified Suzhou secondary report and 470×784 embedded chart-like image as a held-out acquisition lead. No source, observation, relation, physical witness, five-field binding, readiness, or activation promotion is made.',
    v15ResearchDossier: dossier,
    v15ResearchBoundary: { openBlockerIds: dossier.blockers.map(item => item.id), nextAcquisitionTargets: dossier.remainingAcquisitionTargets, graphAdmission: 'none', exactInstitutionTarget: '蘇州博物館' },
  }
  const previousGraph = previous.graphImpact.successor
  const graphImpact = {
    ...clone(previous.graphImpact),
    predecessor: clone(previousGraph),
    additive: { claimCount: 0, sourceCount: 0, physicalWitnessCount: 0, observationCount: 0, relationCount: 0, blockerCount: 0 },
    successor: clone(previousGraph),
    claimsAdded: 0,
    sourcesAdded: [],
    physicalWitnessesAdded: [],
    independentPhysicalWitnessesAdmitted: 0,
    addedObservationIds: [],
    addedRelationIds: [],
    blockersClosed: [],
    blockersStillOpen: clone(previous.graphImpact.blockersStillOpen),
    blockerStatusCounts: clone(previous.graphImpact.blockerStatusCounts),
    researchFrontier: { ...clone(previous.graphImpact.researchFrontier), sourcesAdded: [], observationsAdded: [], relationsAdded: [], blockersClosed: [], claimsAdded: 0, independentPhysicalWitnessesAdmitted: 0 },
    v15ResearchBoundary: dossier.graphBoundary,
  }
  const claimImpact = {
    ...clone(previous.claimImpact),
    claimsAdded: 0,
    claimsPromoted: 0,
    directSemanticClaimSupportAdded: [],
    researchFrontierClaimsAdded: 0,
    researchFrontierSemanticSupportAdded: 0,
    semanticAuthorityCount: 0,
    boundary: previous.claimImpact.boundary + '; v15 records a reported Suzhou chart-image lead outside the graph; no semantic binding or source-authority promotion',
  }
  const blockerImpact = {
    ...clone(previous.blockerImpact),
    blockersClosed: [],
    blockerStatusChanges: [],
    v15ResearchBoundary: { topLevelGraphBlockersClosed: [], openResearchBlockerIds: dossier.blockers.map(item => item.id), topLevelBlockerCountUnchanged: true, acquisitionOnlyFrontier: true },
  }
  const completeBase = {
    ...clone(previous),
    schemaVersion: SCHEMA,
    verdictToken: VERDICT,
    observedHead: repo.currentHead,
    originMainHead: repo.originMainHead,
    basisHead: BASIS_HEAD,
    branch: repo.branch,
    scope: {
      ...clone(previous.scope),
      purpose: 'additive graph-neutral research dossier for the reported Suzhou chart lead and exact institutional acquisition boundary',
      v15ResearchUnitsCompleted: [...(previous.scope.v14ResearchUnitsCompleted || []), 'quaternary-jielan-suzhou-museum-chart-lead'],
      v15GraphAdmission: 'none',
      v15DirectChartObservationRecorded: true,
      v15InstitutionalItemResolved: false,
      v15SameCopyEstablished: false,
      directSingleWitnessFullBindingEstablished: false,
      independentWitnessesAdmitted: 0,
      sourceAuthorityPromoted: false,
      semanticAuthorityPromoted: false,
    },
    predecessorChain: [
      ...clone(previous.predecessorChain),
      { path: PREDECESSOR_COMPOSITION, schemaVersion: previous.schemaVersion, byteSha256: fileSha256(root, PREDECESSOR_COMPOSITION) },
      { path: PREDECESSOR_COMPOSITION_EVIDENCE, schemaVersion: predecessor.storedEvidence.schemaVersion, byteSha256: fileSha256(root, PREDECESSOR_COMPOSITION_EVIDENCE) },
    ],
    sourceLineage: {
      ...clone(previous.sourceLineage),
      sourceAuthority: 'not_established',
      semanticAuthority: 'not_established',
      independentPhysicalWitnessesAdmitted: 0,
      sourceIdentityStatus: previous.sourceLineage.sourceIdentityStatus + '; v15 adds a fixed-byte secondary report/image lead without institutional item provenance',
      researchFrontierOnlySources: unique([...(previous.sourceLineage.researchFrontierOnlySources || []), CANDIDATE_SUZHOU]),
      researchFrontierOnlySourceRecords: [
        ...(previous.sourceLineage.researchFrontierOnlySourceRecords || []),
        suzhouSourceRecord(),
      ],
    },
    researchFrontier,
    evidence,
    observations: clone(previous.observations),
    relations: clone(previous.relations),
    claimReconciliation: clone(previous.claimReconciliation),
    blockerReassessment: clone(previous.blockerReassessment),
    bindingMatrix,
    lineageAssessment,
    fieldKitImpact,
    graphImpact,
    claimImpact,
    blockerImpact,
    v15ResearchDossier: dossier,
    readinessImpact: { ...clone(previous.readinessImpact), readiness: 'not_safe_to_start', grounding: 'blocked', activation: 'experimental_only', rotation06: 'representation_only', sourceAuthorityPromoted: false, semanticAuthorityPromoted: false, independentWitnessesAdmitted: 0, productionModified: false, readinessModified: false },
    preservation: { ...clone(previous.preservation), predecessorArtifactsRewritten: false, historicalPredecessorBytesRewritten: false, existingFieldKitRewritten: false, sourceImagesStoredInGit: false, sourcePdfsStoredInGit: false, sourceBytesAcquiredOutsideRepo: true, externalWebSourceBytesStoredInGit: false, materializerNetworkUsed: false, productionChanged: false, remoteDatabaseChanged: false, deploymentPerformed: false, commitPerformed: false, pushPerformed: false, v15ReportBytesStoredInRepo: false },
    deterministicContract: { ...clone(previous.deterministicContract), sourceBytes: 'v15 records fixed parent-verified hashes for the secondary report and embedded image; external web acquisition is forbidden during materialization and no external raw source bytes are stored in the repository', network: 'forbidden_during_materialization', ocr: 'locator-only; visible labels are direct image observations, not canonical OCR or semantic authority', noAutomaticPromotion: true },
    negativeContract: {
      ...clone(previous.negativeContract),
      rejects: unique([
        ...previous.negativeContract.rejects,
        'promoting the reported Suzhou holding into current institutional custody, item identity, source authority, or same-copy identity without an institutional record and raw leaf',
        'treating the embedded chart-like image or visible 命/身/土立局 labels as a branch-token, palace-name, physical-slot, ordinal, or direction binding',
        'admitting the secondary report/image as an independent physical witness or canonical graph source',
        'turning the acquisition-only Suzhou frontier into a continue, readiness, semantic-authority, or activation decision',
      ]),
    },
    materializer: MATERIALIZER_PATH,
    checker: CHECKER_PATH,
    negativeChecker: NEGATIVE_CHECKER_PATH,
  }
  delete completeBase.artifactIdentity
  const artifact = attachArtifactIdentity(completeBase, buildArtifactIdentity({ root, artifactId: SCHEMA, materializerPath: MATERIALIZER_PATH, materializerVersion: MATERIALIZER_VERSION, baseHead: BASIS_HEAD, inputs: INPUT_PATHS }))
  const files = {
    'evidence.json': evidence,
    'binding-matrix.json': bindingMatrix,
    'lineage-assessment.json': lineageAssessment,
    'graph-reconciliation.json': {
      schemaVersion: SCHEMA + '-graph-v0',
      predecessorChain: artifact.predecessorChain,
      sourceLineage: artifact.sourceLineage,
      observations: artifact.observations,
      relations: artifact.relations,
      claimReconciliation: artifact.claimReconciliation,
      blockerReassessment: artifact.blockerReassessment,
      graphImpact: artifact.graphImpact,
      claimImpact: artifact.claimImpact,
      blockerImpact: artifact.blockerImpact,
      uncertainty: artifact.lineageAssessment,
      v15ResearchDossier: dossier,
    },
    'field-kit-impact.json': {
      schemaVersion: SCHEMA + '-field-kit-v0',
      ...fieldKitImpact,
      closureBoundary: { sourceIdentityTarget: 'action_required', palaceSemanticTarget: 'action_required', productionOrdinalTarget: 'not_established', imageReuseTarget: 'human_policy_review', researchFrontierAdmission: 'held_outside_graph_v15_suzhou_reported_holding_chart_image' },
    },
  }
  return { artifact, files }
}

export function buildBundle(root = ROOT, options = {}) { return buildArtifact(root, options) }

export async function materializeBundle(target = resolve(ROOT, ARTIFACT_PATH), options = {}) {
  const { artifact, files } = buildArtifact(ROOT, options)
  const targetPath = resolve(target)
  const directory = dirname(targetPath)
  await mkdir(directory, { recursive: true })
  const outputs = { complete: targetPath }
  const writeJson = async (path, value) => {
    const body = Buffer.from(canonicalJson(value))
    await writeFile(path, body)
    await writeFile(path + '.integrity.json', canonicalJson({ schemaVersion: SCHEMA + '-integrity-v0', path: relative(ROOT, path), byteSha256: sha256(body), byteScope: 'UTF-8 JSON bytes including final LF' }))
    return sha256(body)
  }
  const completeSha256 = await writeJson(targetPath, artifact)
  for (const [name, value] of Object.entries(files)) {
    const path = resolve(directory, name)
    outputs[name] = path
    await writeJson(path, value)
  }
  return { artifact, files, outputs, targetPath, completeSha256 }
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  const result = await materializeBundle(resolve(process.argv[2] || ARTIFACT_PATH))
  console.log(JSON.stringify({ target: result.targetPath, schema: SCHEMA, verdict: VERDICT, basisHead: BASIS_HEAD, predecessorSchema: v14.SCHEMA, counts: result.artifact.graphImpact.successor, graphAdditive: result.artifact.graphImpact.additive, candidates: result.artifact.v15ResearchDossier.candidates.map(item => item.candidateId), continuationDecision: result.artifact.v15ResearchDossier.continuationDecisions.suzhouFrontier.decision, continuationReasons: result.artifact.v15ResearchDossier.continuationDecisions.suzhouFrontier.reasonCodes, directSingleWitnessFullBindingCount: result.artifact.v15ResearchDossier.fiveFieldSummary.directSingleWitnessFullBindingCount, productionOrdinalBindingCount: result.artifact.v15ResearchDossier.fiveFieldSummary.productionOrdinalBindingCount, independentPhysicalWitnessesAdmitted: result.artifact.graphImpact.independentPhysicalWitnessesAdmitted, blockersClosed: result.artifact.graphImpact.blockersClosed, completeByteSha256: result.completeSha256 }, null, 2))
}

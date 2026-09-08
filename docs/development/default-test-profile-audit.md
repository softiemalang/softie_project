# Default test profile audit

Date: 2026-09-09. Scope: the current checkout and the current test
contracts. No test file or assertion was deleted, weakened, or replaced.

The default profile keeps the current runtime and current-contract regression
surface. A suite was moved to `all-only` only when both conditions held:

1. its primary assertion is historical/versioned, research/evidence,
   external-fixture, or benchmark record keeping; and
2. a current test still covers the relevant runtime/status/safety invariant.

`all-only` is a profile boundary, not a removal. The exact 78-file list is
`ALL_ONLY_TEST_FILES` in `scripts/lib/test-suite-discovery.mjs`; every one is
still executed by `npm run test:all`. The following is the coverage audit for
that list.

## Moved candidates

### Astrology — 5 files

Moved: `astrologyQualityBenchmark.test.js`,
`astrologyReadinessArtifact.test.js`, `astrologyTrueNodeIndependent.test.js`,
`astrologyV1LocalIntegrationMilestone.test.js`,
`astrologyV1LocalIntegrationSuccessor.test.js`.

Current coverage retained by `astrologyContract.test.js`,
`astrologyEphemerisCore.test.js`, `astrologyProviderPreflight.test.js`,
`verifiedAstrologyReadiness.test.js`, `threeSystemPrepPipeline.test.js`,
`triSystemEvidenceBoundary.test.js`, and `unifiedQualityBenchmark.test.js`.
The moved assertions are benchmark scores, experimental true-node evidence, or
versioned readiness artifacts; they do not define a distinct current
production invariant.

### CHI-KNOW-PO/OCR research — 4 files

Moved: `chiKnowPoFineTuningTrial.test.js`,
`chiKnowPoMediumRecPreflight.test.js`, `chiKnowPoMediumRecRecipe.test.js`,
`chiKnowPoSpecialization.test.js`.

The current route/provider and activation boundary remains covered by
`historicalOcrTeam.test.js`. These four suites validate inactive training
designs, corpus splits, disposable job specifications, and evidence gates;
they are not an active OCR production contract.

### DE405 research, legacy, and cross-platform evidence — 8 files

Moved: `de405CrossPlatformEvidence.test.js`,
`de405ExperimentalType2Evaluator.test.js`, `de405LegacyNativeEvidence.test.js`,
`de405LegacyNativeMatrix.test.js`, `de405LinuxArchitectureEvidence.test.js`,
`de405RouteRootCauseAnalysis.test.js`, `de405StrategyCBoundaryEvidence.test.js`,
`de405UnresolvedSelectionAnalysis.test.js`.

Current artifact, runner, provenance, route, shadow, and validation
boundaries remain covered by `de405ArtifactReadiness.test.js`,
`de405CanonicalV2Contract.test.js`, `de405CanonicalV2RunnerContract.test.js`,
`de405CspiceRouteDiagnostic.test.js`, `de405RuntimeProvenance.test.js`,
`de405Type2ShadowContracts.test.js`, and
`de405ValidationHierarchy.test.js`. The moved files consume persisted
cross-platform/legacy/experimental or root-cause evidence and do not establish
the current canonical production result.

### Design reference and historical audit batches — 6 files

Moved: `designReferenceAccessibilityLegacyInteractionCleanupBatch.test.js`,
`designReferenceAsyncContentEnterPromotion.test.js`,
`designReferenceAudit.test.js`, `designReferenceAuditEmil10Incremental.test.js`,
`designReferenceFormModalAsyncStateTouchFoundationBatch.test.js`,
`designReferenceLowRiskInteractionFoundationBatch.test.js`.

Current UI behavior remains covered by
`accessibilityLegacyInteractionCleanup.test.js`,
`formModalAsyncStateTouchFoundation.test.js`,
`lowRiskInteractionFoundation.test.js`, and the scheduler interaction/style
tests. The moved suites preserve reference-source chains and historical audit
materialization rather than adding a separate current UI invariant.

### Saju source/evidence and adjudication — 25 files

Moved: `sajuAcceptanceReview.test.js`, `sajuAnuV6V12DirectInspection.test.js`,
`sajuClaimProvenance.test.js`, `sajuFiveClassicsClaimAdjudication.test.js`,
`sajuFiveClassicsResearchContinuation.test.js`,
`sajuFiveClassicsTypedReadinessContract.test.js`,
`sajuGeminiV6ParentAdjudication.test.js`,
`sajuGeminiV7ParentAdjudication.test.js`,
`sajuGeminiWitnessDossierAdjudication.test.js`,
`sajuGeminiWitnessDossierAdjudicationV2.test.js`,
`sajuGeminiWitnessDossierAdjudicationV3.test.js`,
`sajuLunaDeepCollationAdjudicationV4.test.js`,
`sajuLunaP0EvidenceAcquisitionV2.test.js`,
`sajuMingliYueyanDirectWitnessAdjudicationV1.test.js`,
`sajuMingliYueyanFirstPartyInspection.test.js`, `sajuP0CalendarOracle.test.js`,
`sajuReadinessGrounding.test.js`,
`sajuSanming1578OfficialViewerAdjudicationV1.test.js`,
`sajuShenfengNlcWitnessAdjudication.test.js`,
`sajuShenfengNlcWitnessBackMatterAdjudicationV1.test.js`,
`sajuSourceClaimObservation.test.js`, `sajuSourceDerivedEvidenceAsset.test.js`,
`sajuTimingAuthorityFrontier.test.js`, `sajuV1LocalFrontier.test.js`,
`sajuVerificationReconciliation.test.js`.

Current calculation, policy, boundary, external-runner, and readiness
invariants remain covered by `sajuCoreContract.test.js`,
`sajuPolicyContract.test.js`, `calendarValidation.test.js`,
the runtime/boundary portions of `sajuLunar2solarKasiMismatchFix.test.js`,
`externalValidationRunner.test.js`, `interpretationReadiness.test.js`, and
`threeSystemPrepPipeline.test.js`. Its frozen successor-materialization
assertion is isolated in the all-only
`sajuLunar2solarKasiMaterialization.test.js`; it retains the exact fixture and
28-case checks while accepting the checker’s explicit descendant-snapshot
boundary instead of requiring current materializer equality.
The moved suites preserve first-party/source identity, historical version,
adjudication, and materialized-evidence checks. Their missing or held source
assets therefore remain visible in `test:all` without making them a daily
current-code gate.

### Tri-system acquisition evidence — 2 files

Moved: `triSystemEvidenceAcquisitionFieldKit.test.js`,
`triSystemP0AcquisitionPriorityAndDossier.test.js`.

The current handoff and readiness contracts remain covered by
`triSystemEvidenceBoundary.test.js`, `threeSystemPrepPipeline.test.js`, and
`triSystemReadiness.test.js`. The moved files are acquisition/dossier records,
not current calculation or handoff behavior.

### Ziwei source/evidence, fixtures, and version-adjacent research — 27 files

Moved: `ziweiCleanRuleCorpusSourceAcquisitionFeasibility.test.js`,
`ziweiCleanRuleCorpusSourceSelection.test.js`, `ziweiFixtureReconciliation.test.js`,
`ziweiGuardedOccurrenceExactSourceIdentityPilot.test.js`,
`ziweiGuardedOccurrenceSourceEvidenceHardening.test.js`,
`ziweiInheritedEvidenceConsumptionFrontier.test.js`,
`ziweiMajorStarClaimReadinessReconciliation.test.js`,
`ziweiMajorStarCoordinateProvenance.test.js`, `ziweiOccurrenceProvenance.test.js`,
`ziweiP0ClaimSourceIdentityFrontier.test.js`,
`ziweiP0EvidenceAcquisitionFieldKit.test.js`,
`ziweiP0PalaceBranchSlotComposition.test.js`,
`ziweiP0PalaceBranchSlotCompositionSmoke.test.js`,
`ziweiP0PalaceSemanticWitnessAcquisitionRoute.test.js`,
`ziweiP0ToyoVii3157InstitutionalEvidence.test.js`,
`ziweiP0YouyiLuCadalSemanticWitness.test.js`,
`ziweiPalaceSourceAcquisitionFieldKit.test.js`, `ziweiQualityBenchmark.test.js`,
`ziweiReadinessAdmissionBlockerAudit.test.js`, `ziweiReadinessBaseline.test.js`,
`ziweiSelectedOccurrencePublicScanEditionLinkageFollowUp.test.js`,
`ziweiSourceIdentityClaimBoundaryAudit.test.js`,
`ziweiStructuralAdmissionFrontier.test.js`,
`ziweiStructuralAdmissionGuardPilot.test.js`,
`ziweiStructuralAdmissionIndependentAcceptanceReview.test.js`,
`ziweiSystemEvidenceReadinessCoverageMap.test.js`,
`ziweiTianfuConventionProvenance.test.js`.

Current chart, resolver, relation, prompt-safety, and compatibility invariants
remain covered by `ziweiContract.test.js`, `ziweiCoreContract.test.js`,
`ziweiPipeline.test.js`, `ziweiPromptSafetyContract.test.js`,
`ziweiResolver.test.js`, `starResolver.test.js`,
`transformationAndMinor.test.js`, `ziweiCanonicalSlotOrientationPolicy.test.js`,
and `ziweiTianfuCompatibilityMode.test.js`. The explicit v3–v15 suites remain
in the historical profile and in `test:all`; the moved files retain source,
fixture, frontier, and predecessor evidence without enlarging the current
runtime regression set.

## Re-evaluation of other candidates

- `유지`: current runtime/contract tests, current user-facing scenario tests,
  and unique external-oracle bridges remain in default. This includes the
  astrology external-validation/golden tests, the current interpretation and
  packet/readiness contracts, and the DE405 CSPICE/source-equivalence,
  JPL-overlap, official-input, residual, and provenance checks.
- `구조 통합 가능`: the Saju provenance and grounding artifact checks and
  several artifact/reference batches have overlapping counts or setup, but
  they exercise different evidence gates. No merge was made because that
  would change ownership or reduce independent negative coverage.
- `비용 최적화 가능`: the large external/artifact checks can be scheduled or
  cached in a future profile-specific optimization, but no cheaper equivalent
  current invariant was proven here. They were kept at their existing strength
  and location unless they are in the explicit `all-only` list above.
- `profile 경계 조정 필요`: all 78 listed suites. Their assertions remain
  unchanged and are now reachable through `test:all`.
- `실제 불필요 후보`: none established. The static duplicate audit found no
  exact duplicate test groups; low-confidence unused/manual reports were not
  treated as deletion evidence.

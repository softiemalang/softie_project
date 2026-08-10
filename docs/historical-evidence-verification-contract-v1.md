# Historical Evidence Verification Contract v1

Status: maintenance contract only; no readiness, claim, production, public, deployment, or activation decision is changed by this document.

## Audit scope

The audit ran on `main` with the verified local PDF environment and expected current `HEAD`/`origin/main` snapshot `7f080367e37f10b3ded0ab67ba1d8a6f43d77e7f`. It inspected all 49 JSON artifacts carrying `artifactIdentity`, all 49 checkers importing `checkArtifactIdentity`, plus the materializers and tests reachable from the historical evidence frontiers. The pre-existing untracked `-.jpg` was preserved.

The inventory found two kinds of repository-head checks:

- Ten migration-target checkers and five corresponding materializer/protected-byte paths treated a historical basis or observed checkout head as if it had to equal the current checkout. The target set is the Saju lunar successor and calendar oracle, tri-system P0 dossier and field kit, Western True Node v4 frontier, Ziwei fixture/source identity audits, and the NARA, Ziwei P0, and palace-source frontiers.
- Eight already ancestry-aware checkers use a current-snapshot branch only to decide whether to replay current materializer output. They remain excluded from migration because descendant snapshots already take the historical path and still enforce artifact identity/content hashes. The two remaining `artifact.observedHead === BASIS_HEAD` checks validate the frozen field inside the artifact; they do not compare it with the live checkout and remain intentional historical identity checks.

## Failure reconstruction and taxonomy

The first verified-PDF `npm test` run reconstructed 19 historical failures before the suite entered an unrelated long-running final source-chain test and was safely interrupted. The failures were:

| Class | Count | Evidence |
| --- | ---: | --- |
| historical HEAD identity drift | 6 | tri-system P0 (3) and Ziwei P0 acquisition (3) required live/current/origin heads to equal their old expected head |
| basis/observedHead descendant drift | 9 | NARA leaf-map (5) and palace semantic source (4) rejected a normal descendant checkout |
| immutable-output drift caused by intentional later production change | 4 | Saju lunar successor (2) and P0 calendar oracle (2); the latter records `src/interpretationPrep/lunarConverter.js` current hash `641047f5593d9ceab81b33cc23f7df1fa221a2ab2d6da96223fe8fefbd2e9ffd` versus historical/declared hash `466c7774c3dc8ef89fb99345561db4bf5c1ec9fd786b5279fabcfa507e2bb224` |
| genuine artifact corruption | 0 | no frozen artifact bytes were changed, and all identity/payload checks remained valid |
| genuine regression | 0 | no production/readiness/claim behavior was changed by this migration |
| source/env-dependent failure | 0 in verified-PDF focused runs | the two configured PDFs were hash-verified before the focused runs |

The broader checker audit also found two source-byte failures not reached by the interrupted full suite: Ziwei fixture reconciliation (`starPlacementRules.js`) and source-identity claim boundary (five source files). In each case the current bytes differed, while the historical basis commit contained the declared bytes. They were historical basis-input drift, not corruption; enabling the historical basis path closed them without changing the artifacts.

## Verification invariant

`generation.baseHead`, historical `basisHead`, recorded source paths, declared hashes, payload hashes, and historical observations remain frozen artifact data. They are never rewritten to make a replay green.

For a live checkout, a historical artifact is accepted only when:

1. the declared basis commit exists and is an ancestor of both current `HEAD` and `origin/main` on `main`;
2. each protected evidence/source input either matches current bytes or matches the bytes at the declared historical basis commit;
3. the artifact identity and payload hash remain valid;
4. deterministic replay is compared only where the current inputs are the same; otherwise the frozen artifact is checked against itself and the dependency drift is reported explicitly;
5. stable content comparison removes only volatile repository observations (`observedHead`, `currentHead`, `originMainHead`, `currentCheckoutHead`) and never removes evidence payload, source identity, production bytes, readiness, claim, or activation fields.

An ancestor is therefore necessary but not sufficient: unrelated history, missing basis objects, protected-byte mismatch at both current and basis, payload mutation, source mutation, or production dependency mutation still fails. A successor is not asserted to be identical to frozen v1 merely because it is a descendant. The Saju P0 result explicitly reports `historicalSnapshotAccepted: true`, `currentMaterializerMatches: false`, and the `lunarConverter.js` protected-byte drift.

## Migration and negative coverage

The shared contract is implemented in `src/artifactIdentity.js` through `checkHistoricalRepositoryBasis`, `inspectFileByteIdentity`, and stable-content helpers. The migrated checkers use ancestry plus byte identity; materializers stop treating current HEAD equality as a protected-byte invariant. Opt-in verifier-source drift is limited to historical checker/materializer identity inputs and does not bypass ordinary production/source input checks.

Focused positive and negative coverage includes:

- a descendant basis is accepted while the historical basis and artifact identity remain unchanged;
- repository diagnostics may change without changing stable evidence content;
- payload, production/readiness, delta, source hash, verdict, and artifact-identity mutations fail closed;
- the actual later `lunarConverter.js` production dependency change is detected and is not relabeled as current-v1 equivalence;
- NARA and palace-source materializations remain byte-identical across repeated runs;
- verified source PDF identity and page counts remain unchanged.

No frozen historical artifact JSON, integrity sidecar, PDF, source capture, or `-.jpg` was rewritten. This report is a versioned maintenance record, not successor evidence and not an authorization to promote any blocked domain.

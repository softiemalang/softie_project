# Saju Five Classics typed readiness contract v0

Status: `dry_run_only_no_promotion`

This contract re-evaluates the current 13 active Five Classics claims from the
existing source identity, claim adjudication, timing authority, and research
continuation artifacts. It does not promote a claim, change a production rule,
or alter any Ziwei artifact.

Machine-readable source: [`complete.json`](../artifacts/saju-five-classics-typed-readiness-contract-v0/complete.json)

## Boundary

The contract preserves these terminal values:

```json
{
  "availableForInterpretation": false,
  "productionActivation": "blocked",
  "semanticAuthority": "not_established",
  "stableClaimPromotionCount": 0
}
```

`H/E/L/S/I/P` are typed gates, not a universal boolean checklist.

| Gate | Meaning | Requirement forms | State forms |
| --- | --- | --- | --- |
| H | historical witness observed | required / conditional / N/A | satisfied / unresolved / conflicted |
| E | edition/editorial relation or bounded collation | required / conditional / N/A | satisfied / unresolved / conflicted |
| L | local lineage or local transmission | required / conditional / N/A | satisfied / unresolved / conflicted |
| S | semantic equivalence/binding at the asserted scope | required / conditional / N/A | satisfied / unresolved / conflicted |
| I | independence vector | required / conditional / N/A | satisfied / unresolved / conflicted |
| P | target-specific promotion decision | required / conditional / N/A | satisfied / unresolved / conflicted |

`not_applicable` requires a claim-type and promotion-target scope proof with
evidence references. It cannot be used merely to remove a blocker.

## Claim taxonomy and gate policy

| Type | Meaning | L policy | S policy | Independence baseline |
| --- | --- | --- | --- | --- |
| `historical_textual` | Historical witness/edition wording or rule surface | conditional | conditional | edition/textual-lineage required; other axes conditional |
| `bibliographic_editorial` | Author/editor/proofreader/engraver/edition responsibility | conditional | N/A for identity-only target | physical-item and edition/textual-lineage conditional/required |
| `local_source_derived` | Historical transmission of a local PDF/text representation | required | conditional | physical, digital, and edition/textual lineage required |
| `cross_lineage_semantic` | Semantic rule comparison across textual lineages | conditional when local source is asserted | required | all four axes required |
| `implementation_grounding` | Historical grounding of a production calculation/rule | conditional when local implementation path is asserted | required | all four axes required |

L is therefore not universally required for every historical claim. It is N/A
for the narrowly scoped Yuanhai responsibility-display observation because that
target explicitly excludes local-to-item transmission. It is active for the
Yuanhai seasonal local-to-historical correspondence, all local Ziping claims,
and the implementation-facing ANU claims.

The four I axes are independent fields:

- `physical-item`: distinct physical holding/item, not a second file;
- `digital-derivation`: distinct capture/bitstream derivation, not OCR or a duplicate download;
- `edition/textual-lineage`: dated edition, printing, colophon, or transmission relation;
- `semantic-corroboration`: agreement from independent textual lineages.

NLC 1926 and NTL 1926 are retained as a same-lineage candidate. Their agreement
is not counted as independent semantic corroboration.

## 13-claim dry-run matrix

Cell format is `requirement/state`. `N/A/satisfied` is only valid where the
artifact carries a scope proof. `bounded_stable` is an observation-level result,
not semantic authority.

| Claim | Type | Target | H | E | L | S | I | P | Current stability | Promotion-near |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `claim.yuanhai-editorial-responsibility` | bibliographic_editorial | historical observation | req/sat | req/sat | N/A/sat | N/A/sat | cond/unresolved | req/unresolved | historical observation | yes |
| `claim.yuanhai-seasonal-lichun-clause` | historical_textual | lineage-specific | req/sat | req/sat | cond/unresolved | N/A/sat | cond/unresolved | req/unresolved | historical observation | yes |
| `claim.ziping-yongshin` | cross_lineage_semantic | cross-lineage | req/sat | req/sat | cond/unresolved | req/sat | req/unresolved | req/unresolved | lineage-specific candidate | yes |
| `claim.ziping-xingyun` | cross_lineage_semantic | cross-lineage | req/sat | req/sat | cond/unresolved | req/sat | req/unresolved | req/unresolved | lineage-specific candidate | yes |
| `claim.ziping-xiangshen` | local_source_derived | cross-lineage | req/sat | req/sat | req/unresolved | req/conflicted | cond/unresolved | req/conflicted | lineage-specific conflicted | no |
| `claim.qiongtong-spring-jia-wood` | cross_lineage_semantic | cross-lineage | req/sat | req/sat | cond/unresolved | req/sat | req/unresolved | req/unresolved | lineage-specific candidate | yes |
| `claim.sanming-dayun-year-stem-gender-direction` | implementation_grounding | implementation-safe | req/sat | req/sat | cond/unresolved | req/sat | req/unresolved | req/unresolved | historical observation | yes |
| `claim.sanming-dayun-term-selection` | implementation_grounding | implementation-safe | req/sat | req/sat | cond/unresolved | req/sat | req/unresolved | req/unresolved | historical observation | yes |
| `claim.sanming-dayun-term-distance` | implementation_grounding | implementation-safe | req/sat | req/sat | cond/unresolved | req/sat | req/unresolved | req/unresolved | historical observation | yes |
| `claim.sanming-dayun-distance-conversion` | implementation_grounding | implementation-safe | req/sat | req/sat | cond/unresolved | req/sat | req/unresolved | req/unresolved | historical observation | yes |
| `claim.sanming-dayun-start-age` | implementation_grounding | implementation-safe | req/sat | req/sat | cond/unresolved | req/sat | req/unresolved | req/unresolved | historical observation | yes |
| `claim.sanming-dayun-first-start-time` | implementation_grounding | implementation-safe | req/sat | req/unresolved | cond/unresolved | req/unresolved | req/unresolved | req/unresolved | historical observation only | no |
| `claim.sanming-dayun-progression` | implementation_grounding | implementation-safe | req/sat | req/sat | cond/unresolved | req/sat | req/unresolved | req/unresolved | historical observation | yes |

The current summary is 13 claims, 11 promotion-near claims, and 0 promotion-
ready claims. “Promotion-near” means that the bounded observation/semantic
surface is sufficiently closed to name the exact next evidence; it does not
mean that the target is ready.

### False blockers versus real blockers

False is target-scoped: it means the edge is not required for the bounded
proposition currently being evaluated. It does not mean that the evidence is
available for a wider proposition.

| Claim scope | False blocker | Real blocker |
| --- | --- | --- |
| Yuanhai responsibility display | L local-to-item and S semantic equivalence | I physical-item / edition-textual-lineage cross-scan relation |
| Yuanhai seasonal raw clause | general semantic-rule equivalence | L local page/plate bridge and I edition/textual-lineage |
| Ziping 用神 | none of the current broad lineage edges | L local source path; I distinct edition/semantic corroboration |
| Ziping 行運 | exact first-start timestamp | L local source chain; I independent lineage/corroboration |
| Ziping 相神 | locator mismatch; author attribution | S conflict cause; L local transmission; I independent lineage |
| Qiongtong spring 甲木 | authorship for bounded clause presence | dated edition/transmission, local bridge, and I semantic corroboration |
| ANU direction/selection/distance/conversion/start-age/progression | aggregate exact first-start-time blocker for the narrower observation | L/I/E for implementation-safe grounding |
| ANU exact first-start time | none for the exact-start target | complete exact-start rule, E, S, and I |

The 相神 finding stays `semantic_conflict`: locator mismatch was ruled out, the
NLC/NTL 1926 pair agrees within the bounded comparison, and the local
omission/addition/order cause is still unresolved. NLC416 PDF pages 39–40/45
also directly show `輔我用神者是也` and `財旺生官`, but the full role clause
after `財旺生官` was not safely transcribed. This phrase-level observation
does not settle date, edition, lineage, or semantic authority. A lower
stability result never satisfies implementation-safe grounding.

## Exact external evidence acquisition list

The full machine-readable list is under `externalEvidenceRequirements`. Each
entry has a missing edge, exact acquisition, and acceptance criteria. Each claim
also carries an `externalEvidencePlan` that binds the requirement to its current
blocked state, current stability level, promotion target, and exact blocking
edges. The required next evidence is:

1. `external.yuanhai-editorial-item-crosswalk`: item-to-scan catalog/holding relation, leaf-3 title/colophon images, byte hashes, and a local provenance bridge only if the local warning remains in scope.
2. `external.yuanhai-seasonal-crosswalk`: dated scan and printed-folio crosswalk for local p.4, NLC-99036 p.34–35, Tianyi leaf 19; complete surrounding paragraph and local bridge.
3. `external.ziping-yongshin-independent-edition`: dated witness outside the NLC/NTL 1926 pair, exact p.6–p.7/folio images, byte identity, and local derivation record.
4. `external.ziping-xingyun-independent-edition`: dated witness outside the 1926 pair, exact local p.15/NLC-35296/1926 folios, complete surrounding section, and derivation record.
5. `external.ziping-xiangshen-conflict-cause`: dated witness or editorial apparatus resolving the local 我用神 omission and the 财旺生官/order difference relative to the NLC/NTL 1926 pair as edition/commentary/rewriting; NLC416 phrase presence alone is insufficient, and the conflict must be preserved if unresolved.
6. `external.ziping-xiangshen-independent-witness`: a separately dated, lineage-identified witness outside NLC/NTL 1926 with exact surrounding pages and byte identity. The NLC416 [19--?] scan and the 耕寸集 06599 catalog record do not yet satisfy this edge: the former lacks resolved date/lineage and full role context, while the latter has no target section pages.
7. `external.qiongtong-dated-lineage`: dated title/colophon records for current witnesses plus a fourth distinct lineage and a local-PDF bridge.
8. `external.dayun-direction-independent-witness`: independent dated direction passage, ANU record/bitstream/folio crosswalk, and local implementation-source bridge.
9. `external.dayun-term-selection-independent-witness`: independent complete preceding/next 節 paragraph, exact term class/direction crosswalk, and local convention record.
10. `external.dayun-term-distance-worked-example`: complete birth-to-節 worked example with units, calendar/time convention, and rounding policy.
11. `external.dayun-conversion-worked-example`: independent 三日一歲 / 一日四月 numerical example with residual-unit and rounding derivation.
12. `external.dayun-start-age-worked-example`: independent complete 起運 example, ANU printed-folio crosswalk, local bridge, and calculation trace.
13. `external.dayun-first-start-time-complete-rule`: two independent dated witnesses with birth instant, 節 selection, conversion, residual-hour, timestamp, calendar/time policy, and parent-verified replay.
14. `external.dayun-progression-independent-witness`: independent complete later-cycle passage, folio/source-lineage relation, and multi-cycle worked example.

## Ziwei reuse analysis

Only the contract vocabulary is reusable; no Ziwei result is migrated or
rejudged.

| Reusable element | Reuse | Migration risk |
| --- | --- | --- |
| physical witness | exact scan/file identity, direct visual review, and physical-item identity remain separate | Ziwei catalog/scan evidence may still lack physical-item/edition proof |
| representation equivalence | digital derivation is separate from semantic binding | same PDF, OCR, IIIF leaf, or host may be derivative/same-lineage |
| semantic binding | visible rule surface is separate from the rule/coordinate meaning | palace/branch/slot/star surfaces can appear complete without semantic binding |
| independence | four-axis vector and same-lineage rejection | different institutions/URLs do not prove textual independence |
| implementation grounding | lower stability cannot authorize production rule/activation | Ziwei readiness, semantic authority, and production ordinal remain separate |

The contract records `onlyAnalysis: true`, `productionChanged: false`,
`readinessRecomputed: false`, and `authorityChanged: false` for Ziwei.

## Validation contract

The repository checker rejects:

- missing H/E/L/S/I/P entries;
- N/A without scope proof and evidence references;
- same-lineage evidence marked independent;
- full role-clause text asserted where the NLC416 crop is explicitly untranscribed;
- 耕寸集 exact dating narrowed below the catalog’s 清 category or its unobserved target sections marked observed;
- lower-level stability marked as implementation-safe grounding; and
- promotion across the scoped 相神 semantic conflict;
- missing or mismatched claim-level external evidence plans; and
- any Ziwei artifact mutation beyond analysis-only flags.

No production calculation, interpretation rule, remote database, deployment,
commit, or push is part of this artifact.

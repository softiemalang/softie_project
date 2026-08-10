# Ziwei P0 local frontier reconciliation v1

## Decision

The preceding TOYO_1646 extended-observation packet reached a physical-candidate boundary, but its conclusion could not be treated as global local-frontier exhaustion. The repository already contained hash-verified Nanbei/Nanyang rule artifacts and two explicitly configured local original PDFs that had not yet been consumed into the P0 evidence graph.

This successor packet consumes those existing artifacts and the actual bytes of the two local PDFs in read-only mode. It records a bounded local advance and then closes the currently supportable local research frontier. No source identity, semantic authority, independent oracle, readiness, or activation boundary is promoted.

The deterministic artifact is [complete.json](../artifacts/ziwei-p0-local-frontier-reconciliation-v1/complete.json), with its byte sidecar at [complete.json.integrity.json](../artifacts/ziwei-p0-local-frontier-reconciliation-v1/complete.json.integrity.json).

## Inputs and visual boundary

The materializer accepts only explicit `PDF_SOURCE_NANBEI_PATH` and `PDF_SOURCE_NANYANGTANG_PATH` values. In the recorded run they resolved to:

| source | bytes | SHA-256 | pages | role |
| --- | ---: | --- | ---: | --- |
| `命-南北山人_紫微斗数全书.pdf` | 35,515,645 | `4786a94ab454acdabf9716d7c0db4756dbcbde99a88bc45fda254863c1961023` | 219 | local rule-surface witness candidate |
| `新锓希夷陈先生紫微斗数全书.七卷.宋.陈抟撰.明.潘希尹补.明代南阳堂刊本.黑白版.pdf` | 36,201,526 | `04e184c4a52cb042dc885c6ccc9135d94ab25de62007506198ee979a33e66bfc` | 528 | same-record/derivative candidate; not independent by default |

These PDFs remain outside Git. The Nanbei pages p17 (printed folio 四十二), p23–p24 (printed folios 五十五–五十六), and the selected Nanyang pages p151–p152 and p159–p160 were directly rendered and visually reviewed. Existing hash-verified rule artifacts carry the bounded major-star, Tianfu, auxiliary-star, and additional life/body observations. OCR/transcription remains locator-only.

The Nanbei p17 page visibly provides a complete 甲–癸 × 化祿/化權/化科/化忌 table. The Nanyang pages directly close only the 甲 example; its other 36 cells remain explicit `source_rule_not_located` values. The life/body source comparison remains 144/144 for branch placement, 144/144 for 命主, and 120/144 comparable for 身主, with 24 rows blocked by the `火鈴星` surface. No production ruler fields are added.

## Graph and claim boundary

| packet | claims | sources | observations | relations | blockers |
| --- | ---: | ---: | ---: | ---: | ---: |
| original P0 source-identity packet | 30 | 13 | 26 | 116 | 11 |
| TOYO_1646 predecessor after 8 added leaves | 30 | 13 | 34 | 124 | 11 |
| this successor | 30 | 13 | 40 | 130 | 11 |

The successor adds six observations and six relations, but zero claims and zero sources. All 11 blockers remain open: ten are `blocked`, and image reuse is `needs_human_review`. Stable claims remain `0`, semantic-authority claims remain `0`, independent witnesses admitted remain `0`, readiness is `not_safe_to_start`, grounding is `blocked`, activation is `experimental_only`, and rotation-06 remains `representation_only`.

## Research-unit transitions

1. TOYO_1646 physical-candidate surface → Nanbei/Nanyang local rule evidence.
2. Local rule evidence → complete Nanbei 10×4 四化 table surface.
3. Complete Nanbei table → life/body ruler legibility boundary.
4. Life/body boundary → existing major-star, auxiliary-star, and Tianfu artifact reconciliation.
5. Reconciled local surfaces → external identity, lineage, authority, oracle, calendar, and rights boundary.

The strongest local result is evidence, not authorization: the Nanbei 40/40 四化 cells are directly observed and exactly compare within their declared coordinate boundary, but they do not establish edition authority or independent corroboration. Likewise, 150/150 rotation-06 numeric fit does not establish semantic identity; identity remains 0/150.

## All 11 blocker assessments and concrete next acquisition

| blocker | current local result | next evidence required |
| --- | --- | --- |
| source identity unresolved | Local PDF bytes, catalog/image candidates, and lineage distinctions are recorded; exact edition authority remains open. | Institution-supplied or rights-cleared original scan/leaf set with title, date, volume, folio, colophon, immutable bytes, SHA-256, and an explicit lineage comparison separating NARA same-record volumes, Nanyang derivative, Nanbei, and TOYO. |
| palace semantic identity | Partial diagrams, traversal prose, NARA charts, and TOYO pages do not bind all 12 palace names to branch, physical slot, ordinal, direction, and production enum. | One readable, source-identified 12-way semantic map or adjacent rule context containing all of those bindings; a branch ring or isolated chart example is insufficient. |
| direct rule absent | Existing 14-star surfaces and deterministic comparisons do not provide complete row-level source rule identity. | Source-identified 14-major-star witness with immutable pages and complete input-bound 紫微系/天府系 rules plus coordinate frame; evaluator must remain separate from production resolver. |
| Tianfu raw formula contradiction | Nanbei root table and Nanyang series/diagram surfaces preserve the competing convention question; none adjudicates it. | Independent edition with readable 安天府 anchor/direction rule, colophon/folio, branch-token meaning, and enough examples to distinguish `mod(4 - Z)` from legacy `mod(10 - Z)`. |
| Tianfu rotation-06 semantic authority | Identity is 0/150; rotation-06 is 150/150 as a numeric relation only. | A source page explicitly naming the coordinate frame and Tianfu placement, with readable palace/branch/slot semantics and an independent or documented transmission lineage. Numeric fit alone cannot close it. |
| auxiliary-star source witness | 13 surfaces and 136/136 comparable matches are reconciled, but 684 rows remain non-comparable and a complete independent rule witness is absent. | Source-identified complete auxiliary rules for all production stars, including aliases and ambiguous glyphs such as `天空/地空` and `火鈴`, with independent lineage. |
| four-transform source witness | Nanbei supplies a directly observed 40/40 table; Nanyang supplies 4/40 comparable cells and 36 explicit unlocated cells. | Independent or rights-cleared complete 10×4 table with edition/date/volume/folio, immutable bytes, exact stem/column order, and lineage assessment against Nanbei/Nanyang/NARA/current engine. |
| life/body ruler source legibility | Life/body and 命主 are complete within the local comparison; 24 身主 rows remain blocked by the Nanyang `火鈴星` surface. | Higher-resolution or independently identified 身主 witness resolving all 24 rows and preserving both edition surfaces. Do not collapse `火鈴星` to `火星` or add production ruler fields without a separate contract. |
| independent external oracle | Six declared fixtures remain pending; internal fixtures are regression-only; independent verification is `0`. | Independent executable oracle or reproducible published calculation with implementation/version, source/ruleset, exact settings, immutable output/source bytes or stable hash, runner provenance, and field-level output for the same cohort. |
| calendar/time source identity | Local calculations and input contract exist, but leap-month, timezone, solar-time, and 子時 boundary source identity is not closed. | Authoritative calendar/time table or reproducible service with version, immutable release/retrieval bytes, timezone/locale, leap rules, day/hour boundary rules, and exact cohort conversions. |
| image reuse rights | Public access and read-only local review are recorded; repository redistribution and derivative-image permission are absent. | Written item/image-level terms covering repository redistribution, crops/renders, and retention, or a rights-cleared scan supplied by the holder. Public access, catalog metadata, source authority, and reuse rights remain separate judgments. |

## Preservation and activation boundary

- No source PDF or image was copied into the repository.
- No external acquisition or network access occurred during materialization.
- The historical TOYO artifact and its actual predecessor bytes were not rewritten.
- `?? -.jpg` was byte-preserved and remains outside the research artifact’s authority boundary.
- No production source, public contract, readiness state, interpretation output, database, deployment, commit, or push was changed.
- The artifact rejects source-hash mutation, authority/independence promotion, blocker closure, 24-row elision, rotation-06 semantic promotion, readiness promotion, source storage, protected-file loss, and timestamps.

## Reproduction

Use explicit paths; the materializer does not search for or acquire sources:

```sh
PDF_SOURCE_NANBEI_PATH='/Users/softie/Documents/malang_lab/documents/命-南北山人_紫微斗数全书.pdf' \
PDF_SOURCE_NANYANGTANG_PATH='/Users/softie/Documents/malang_lab/documents/新锓希夷陈先生紫微斗数全书.七卷.宋.陈抟撰.明.潘希尹补.明代南阳堂刊本.黑白版.pdf' \
node scripts/materialize-ziwei-p0-local-frontier-reconciliation-v1.mjs
```

The checker, negative checker, and focused test use the same explicit source configuration. A missing path or SHA-256 mismatch fails closed.

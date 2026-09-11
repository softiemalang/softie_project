# Western Astrology source-bounded semantic grammar v0

This is an additive research and evidence lane beside the frozen, source-relative Astrology FACT v0. It does not change calculation provenance, Rule Core output, FACT support scope, activation, or the existing technical interpretation handoff.

The lane is deliberately source-local. A result is executable only when the named source, locator, required Rule Core FACT, and source condition are present. A similar term in another tradition is not a substitute. No entry is a personality claim, prediction, personal validity claim, or conversational interpretation.

## Source identity and admission

| source ID | lineage and era | inspected identity | admission |
| --- | --- | --- | --- |
| `western-source-ptolemy-tetrabiblos` | Hellenistic; 2nd century CE | *Tetrabiblos*, Robbins editor/translator, Loeb 435 (1940), catalog-linked transcription and direct section/page locator | bounded source text only; partial lineage; no local byte witness or source-byte SHA |
| `western-source-lilly-christian-astrology` | Early modern; 1647 | Wellcome catalog record and digitized whole-item boundary for *Christian Astrology* | identity candidate only; no adopted page-level rule |

The Ptolemy catalog identity is recorded by [Perseus](https://catalog.perseus.org/catalog/urn%3Acts%3AgreekLit%3Atlg0363.tlg007.opp-eng1). The inspected English text is the [LacusCurtius / University of Chicago transcription](https://penelope.uchicago.edu/Thayer/E/Roman/Texts/Ptolemy/Tetrabiblos/1b%2A.html). The Lilly identity is recorded by [Wellcome Collection s7z7c46y](https://wellcomecollection.org/works/s7z7c46y), which identifies the 1647 edition and digitized whole item. The [Wellcome item view](https://wellcomecollection.org/works/s7z7c46y/items) exposes the image/canvas boundary, but this checkpoint does not treat catalog identity or a digitized container as a page-level semantic witness. These links establish source identity and locator access for this lane; they do not promote a complete edition lineage or a publication-wide authority claim.

No Valens, Lilly, modern psychological, or other Western lineage is merged into the Ptolemaic lane. Outer-planet meanings for Uranus, Neptune, and Pluto are unsupported in the selected classical scope.

## Adopted Ptolemaic rule surface

The implementation is `src/astrology/astrologySourceBoundedGrammar.js`. Each result retains `sourceId`, `lineageId`, `ruleId`, `sourceRefs`, required technical FACT references, execution status, and forbidden extensions.

| rule | locator | required input | output boundary |
| --- | --- | --- | --- |
| sign quadruplicity | Tetrabiblos I.11, Robbins/Loeb pp. 65–69 | tropical sign ID | `solstitial`, `equinoctial`, `solid`, or `bicorporeal`; no cardinal/fixed/mutable synonym |
| alternating sign gender | I.12, pp. 69–71 | tropical sign ID | masculine/feminine under the explicitly named Aries-start alternating method only |
| domicile relation | I.17, pp. 79–83 | tropical sign ID | the seven-classical-body domicile mapping only; no exaltation, triplicity, terms, or face inference |
| planet class label | I.5, pp. 39–41 | classical body ID | `beneficent`, `maleficent`, or `common`; Sun/Mercury association-dependent modification remains unresolved |
| planet gender label | I.6, pp. 41–43 | classical body ID | masculine, feminine, or common; morning/evening, oriental/occidental, and horizon variants remain unresolved |
| exact aspect harmony | I.13, pp. 73–75 | exact Rule Core angular relation and source sign-kind results | opposition 180°, trine 120°, quartile 90°, sextile 60°; harmonious/disharmonious source label only |

The current Rule Core calls the 90° result `square`; this lane emits the source term `quartile` only when the angle is exact. A modern orb match is `unresolved`, not an exact source relation. Conjunction is not admitted by this I.13 locator. A sign-kind contradiction is emitted as `conflict` and is not repaired by a modern convention.

## Lexicon and composition boundary

The source lexicon currently contains only Ptolemaic labels whose source range is directly inspected: `beneficent`, `maleficent`, `common`, `harmonious`, and `disharmonious`. The lexicon records the source term, target scope, locator, and forbidden extensions; it does not translate a label into personality, fortune, psychology, or prediction.

I.23 (face/chariot/throne/rejoicing and related familiarity composition) remains unresolved because its required dignity set and source priority are not complete in this lane. I.24 (application/separation) remains unresolved because the current FACT contract does not supply the source-complete motion, latitude, bodily-passage, and near-interval conditions. Rule Core phase values are not relabeled as Ptolemaic application or separation.

The following remain candidates or unsupported rather than silently promoted:

- Ptolemaic morning/evening and horizon/sect modifications, because the text presents conditional methods and the source-selected prerequisite set is not fixed.
- Ptolemaic commanding/obeying and related sign relations, because the additional method and astronomical conditions are outside the adopted v0 surface.
- Lilly and any other early-modern or Hellenistic lineage not backed by a directly inspected, stable page witness.
- Modern psychological astrology, outer-planet semantics, cross-lineage synthesis, and source voting.

The machine-readable candidate inventory records Ptolemy I.23 and I.24 separately, and records Lilly as `candidate.lilly.primary-text-lineage.v0`. Those entries preserve the missing witness, prerequisite, and precedence boundaries; they are not executable rules and are not included as Ptolemaic evidence.

## Evidence handoff

`src/interpretationPrep/astrologyWesternEvidenceHandoff.js` creates `astrology-western-source-evidence-envelope-v0`. It carries the already materialized technical packet identity, the Ptolemy grammar result, lexicon entries, result-level source evidence, candidates, unresolved/unsupported/conflict state, and a Constitution adapter lane. It does not copy the public Base into the envelope, recalculate the chart, or embed interpretation text.

The adapter preserves two different kinds of evidence:

1. `base_fact`: caller-supplied deterministic Base references, if a valid Base is attached.
2. `literature_claim`: source-bounded structural result, source semantic result, source-local composition result, lexicon entry, unresolved state, unsupported state, or preserved conflict.

The envelope is valid only when its canonical content hash, grammar-derived evidence, source/locator scope, activation boundary, and unresolved/conflict ledger all agree. Fresh-file reconsumption, packet identity mismatch, tamper, missing grammar, and activation promotion fail closed. The Constitution adapter emits no hypothesis and keeps source evidence out of the FACT lane.

## Conversational consumption and submitted-hypothesis gates

`src/interpretationPrep/astrologyWesternEvidenceConsumptionContract.js` materializes `astrology-western-evidence-consumption-v0`. It classifies the attached lanes as `fact`, `literature_evidence`, `source_local_composition`, `unresolved`, `unsupported`, or `conflict` and binds each item to explicit allowed and forbidden uses. A FACT can be reported as a FACT only. A source result or source term can be explained only with its source/lineage/locator. Unresolved, unsupported, and conflict items remain status evidence and cannot become a semantic basis.

`src/interpretationPrep/astrologyWesternConversationalHandoffPackage.js` wraps that contract in `astrology-western-conversational-handoff-package-v0`. The package is self-contained for a fresh consumer, keeps the technical FACT lane beside literature evidence, and states that response storage, response classification, personalization, and conversation flow belong outside the engine.

`src/interpretationPrep/astrologyWesternHypothesisSubmissionContract.js` validates an externally submitted hypothesis without generating one. It requires present Base fact references, available same-lineage semantic or source-local evidence, exact source/locator scope, and explicit preservation of unresolved and conflict IDs. A user report is context, not source validation. Missing context or preserved boundaries return a deferred state; unsupported evidence, cross-lineage scope, missing provenance, and semantic basis errors fail closed.

`src/interpretationPrep/astrologyWesternHypothesisDiscussionAuthorizationContract.js` maps one validated hypothesis plus one external confirmation state to `discussion_allowed`, `explore_only`, or `reject`. `confirmed` cannot resolve a source boundary or open global activation; `uncertain` is exploration only; `declined` rejects that hypothesis. The authorization scope contains exactly one hypothesis and no other hypothesis IDs. The engine does not store or classify the user's response.

## Readiness decision

The source-bounded evidence handoff and internal conversational consumption package are ready for bounded evidence transport. Hypothesis validation and per-hypothesis authorization are available as closed contracts, but the interpretation runtime is not activated: personal application remains gated by the submitted hypothesis and user-context state, global activation remains blocked, and user delivery is not eligible.

The next frontier is source acquisition and source-local closure, not a generic meaning dictionary. It requires a page-witnessed, independently identified lineage or a source-complete Ptolemaic prerequisite set for the unresolved rules. Nothing in this document authorizes personal interpretation, cross-system voting, conversational LLM integration, public activation, or a main-branch push.

# Astrology interpretation-prep v0 closure audit

Audit basis: local `main` at `1026933141af539aed0ec8151783d748c9bd8cda`.
This checkpoint audits the current Astrology chain only; it does not change the
FACT producer, source grammar, activation state, public release policy, UI, or
remote branch.

## Decision

**Internal contract freeze: GO.**

The bounded internal chain is closed at the contract boundary:

```text
verified FACT lane
  -> source-bounded evidence envelope
  -> Constitution evidence adapter
  -> consumption guidance
  -> externally submitted hypothesis validation
  -> per-hypothesis discussion authorization
```

This is not a user-facing interpretation or activation decision. The following
remain closed by design:

- `availableForInterpretation: false`
- `integrationStatus: not_connected`
- `serviceEligibility: blocked`
- global interpretation activation
- public release and production deployment
- actual conversational LLM calls
- engine-side response storage, response classification, and conversation flow

Accordingly, the result is **GO for an internal, source-bounded evidence
contract freeze** and **NO-GO for public/user-facing interpretation
activation**.

## Canonical chain audit

| Lane | Canonical surface | Audit result | Boundary retained |
| --- | --- | --- | --- |
| FACT | `src/astrology/interpretationPacket.js`, `src/interpretationPrep/conversationFoundation.js` | PASS | Technical packet/Base values only; source evidence is not inserted into the FACT lane |
| Source evidence | `src/astrology/astrologySourceBoundedGrammar.js` → `src/interpretationPrep/astrologyWesternEvidenceHandoff.js` | PASS | Ptolemy is the selected lineage; Lilly remains a candidate profile; no implicit merge |
| Constitution adapter | `adaptAstrologyWesternEvidenceToConstitution` | PASS | `base_fact` and `literature_claim` remain different evidence kinds; no hypothesis is emitted |
| Consumption | `astrologyWesternEvidenceConsumptionContract.js` | PASS | FACT, literature evidence, source-local composition, unresolved, unsupported, and conflict have separate permissions |
| Hypothesis validation | `astrologyWesternHypothesisSubmissionContract.js` | PASS | Only an explicit external submission, present FACT refs, available same-lineage evidence, exact locator scope, and preserved boundaries can pass |
| Discussion authorization | `astrologyWesternHypothesisDiscussionAuthorizationContract.js` | PASS | One hypothesis only; `confirmed` → bounded discussion, `uncertain` → explore-only, `declined`/invalid → reject |

The chain does not recalculate a chart, choose a source winner, turn FACT
presence into meaning, resolve a conflict, create a hypothesis, or mutate
activation. The authorization result cannot authorize another hypothesis,
cross-lineage synthesis, definitive personality/fate/prediction claims, or
global activation.

## Legacy and bypass audit

### Active route surfaces

The `/interpretation-prep` page still uses the older three-system preparation
route. Its Astrology descriptor is explicitly:

- `status: simulation_blocked`
- `verificationStatus: unsupported_for_interpretation`
- `availableForChat: false`
- `calculationResult: null`

The page's `ChatHandoffCard` calls the Deterministic Base projection, not the
new source-evidence package. Therefore this route cannot silently turn a
simulation or legacy result into source-bounded evidence. It is a deliberate
technical/user-delivery block, not a bypass into the new chain.

The older technical packet/context/readiness/handoff path under
`src/astrology/astrologyInterpretation*.js` is also a separate FACT-only lane.
Its validators reject simulation/Placidus/frozen-speed/legacy-Prep
contamination, require provenance, and keep activation blocked. It does not
carry source-local literature evidence and therefore cannot perform an
implicit source merge.

### Isolated legacy surfaces

`astrologyContract.js`, `astrologyPatternContext.js`,
`astrologyPromptAdapter.js`, and the `LAB ONLY` `InterpretationSessionView`
remain in the repository for earlier experiments/tests. Static import review
found no import from the production `/interpretation-prep` page into those
semantic/prompt/session helpers. They are not admitted to the v0 canonical
chain and are not used as evidence producers.

This is a known non-production legacy surface, not an active route escape. Any
future route integration, direct use for user delivery, or use as a source
grammar must reopen this freeze and first place the call behind the current
envelope/consumption/validation contracts. The audit does not remove or
rewrite those legacy files in this checkpoint.

### Cross-lineage and activation escape checks

- Envelope source refs are restricted to the selected Ptolemy source/lineage.
- Lilly appears only as an explicitly unreviewed candidate source profile; it is
  not emitted as Ptolemaic evidence.
- Hypothesis source scope must equal the exact referenced source, lineage, and
  locator set; cross-lineage mutations fail closed.
- Unresolved and conflict IDs must be preserved; user confirmation cannot
  resolve either state.
- Authorization scope contains exactly one hypothesis and an empty list of
  other hypotheses.
- Every conversational package and authorization readiness result keeps
  activation blocked.

## Ptolemy I.23/I.24 and Lilly disposition

These are **follow-up research frontiers, not mandatory blockers for the v0
contract freeze**.

- Ptolemy I.23 remains an unresolved source-local composition candidate because
  the complete dignity/familiarity prerequisite and priority relation are not
  closed in the admitted input surface.
- Ptolemy I.24 remains unresolved because the source-complete application /
  separation conditions are not supplied by the current FACT contract.
- Lilly remains `candidate.lilly.primary-text-lineage.v0`: the current record
  establishes a whole-item identity/container boundary, not a stable
  page-level semantic witness with a closed prerequisite/exception inventory.

They are carried as candidate/unresolved state and cannot be used as a
semantic basis by the current consumer or hypothesis contracts. Closing any of
them is a new source-research unit and requires a reopen, not a silent v0
promotion.

## Synthetic external-consumer and fail-closed evidence

The current fixture suite covers the complete external-consumer shape without
calling an LLM or storing a user response:

- fresh JSON materialization and re-consumption of the evidence envelope;
- fresh JSON re-consumption of the consumption contract and canonical
  conversational package;
- fresh hypothesis submission consumption;
- available same-lineage bounded hypothesis acceptance;
- missing user context → `requires_user_confirmation`;
- unresolved/conflict preservation → deferred bounded use;
- unsupported evidence, cross-lineage scope, missing locator, tampered package,
  and readiness/activation promotion → fail closed;
- confirmation matrix: `confirmed` → `discussion_allowed`, `uncertain` →
  `explore_only`, `declined` → `reject`;
- authorization tamper and scope expansion → fail closed;
- Ptolemy/Lilly separation and outer-planet/personal-synthesis blocking.

The relevant tests are `test/astrologyWesternSourceBoundedGrammar.test.js`
and `test/astrologyWesternConversationalContracts.test.js`. The selected
technical handoff/readiness/Base and legacy-route boundary tests also pass.

## External responsibilities

The engine's contract ends at a validated, bounded authorization result. A
conversational model outside this repository is responsible for consuming that
result, asking for context, and producing any response. Response persistence,
response classification, personalization strategy, and multi-turn flow are
outside the engine and are not v0 blockers. If such a consumer is later
connected, it must consume the package as supplied and remain subject to the
same per-hypothesis authorization; it must not be treated as a new source or
as an activation signal.

## Freeze and reopen conditions

Freeze conditions satisfied by this checkpoint:

1. FACT and literature evidence remain separate and losslessly linked.
2. Every admitted source result has source/lineage/locator provenance.
3. Unresolved, unsupported, and conflict states are preserved end to end.
4. Missing, tampered, cross-lineage, and activation-promoting inputs fail
   closed.
5. The current contracts generate no hypothesis and store no user response.
6. The package remains deterministic under fresh-file re-consumption.

Reopen the v0 boundary before any of the following:

- admitting a new lineage or a Lilly page-level witness;
- closing Ptolemy I.23/I.24 or changing their prerequisite contract;
- changing FACT/provenance schemas, consumer permissions, or conflict policy;
- wiring the package into a user-facing UI, an LLM, a database, or production;
- enabling global interpretation activation or public release;
- routing any isolated legacy semantic/prompt/session helper into production;
- any regression in the fail-closed or exact source-scope checks.

## Validation profile and known all-profile limitation

The scoped closure suite passed 52/52 tests, including 11 Astrology
source/consumer-contract tests, and the default repository test/build checks
remain the required local gate. The historical `npm run test:all` profile is a
long-running legacy/source validation profile and was not completed in this
checkpoint; that is recorded as a **validation-profile limitation**, not a
failure of this Astrology v0 contract. It must not be reported as a full-suite
PASS without a separate completed run.

External-source authority expansion, public redistribution, user-facing
Astrology activation, and the isolated legacy surface are separate gates. None
is silently promoted by this audit.

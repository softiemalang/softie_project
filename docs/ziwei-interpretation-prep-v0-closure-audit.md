# Ziwei interpretation-prep v0 closure audit

## Decision

`Ziwei interpretation-prep v0 = CLOSED IN FAIL-CLOSED EVIDENCE MODE`.

The transport and consumer chain is now deterministic and independently
checkable:

```text
public Deterministic Base
  -> Ziwei evidence envelope
  -> Constitution adapter
  -> evidence-consumption contract
  -> canonical conversational handoff package
  -> external hypothesis validation
  -> per-hypothesis discussion authorization
```

This is not a semantic-interpretation activation. The current source frontier
contains no eligible semantic basis, so a submitted hypothesis is structurally
validated but receives `blocked`, and every discussion authorization currently
returns `reject`. No user response is stored or classified by the engine.

## What can be consumed

The public Base is the only FACT authority in this package. The current public
Ziwei frontier contains only the already-projected coordinate fields:

- `systems.ziwei.fact.majorStarCoordinates`
- `systems.ziwei.fact.luckyStarCoordinates`

These are reportable as included values. Their presence does not establish a
palace name, palace role, star symbolism, personality, fortune, prediction, or
any other personal meaning.

The evidence envelope preserves, without promotion:

- source-locator-bounded observations for 命宮/身宮, the major-star series,
  six lucky stars, and four transformations;
- the unresolved branch → palace name → physical slot → production ordinal
  binding;
- NARA's same-catalog-record leaf frontier and the Toyo candidate frontier;
- the unresolved independent external-chart oracle and calendar/time source
  identity gaps;
- unsupported timing, brightness, and extended-minor-star scope;
- the Tianfu raw-placement conflict as preserved tension.

Each item retains source IDs, locator IDs, lineage, source-byte hash where an
existing frontier recorded one, and an explicit unresolved/candidate/blocked/
unsupported/conflict state. A candidate observation is explainable only as an
observation within its declared source scope; it is not an available semantic
basis.

## Consumer permissions

| Lane | Permitted use | Not permitted |
|---|---|---|
| FACT | Report the included coordinate value and cite its Base path | Derive palace meaning or personal meaning from FACT presence |
| Source observation | Explain the named source and locator as an observation | Promote it to a verified rule, universal meaning, or cross-lineage result |
| Unresolved/unsupported/blocked | Report the state and the missing boundary | Guess, recalculate, or fill the gap |
| Conflict | Report all sides and preserve tension | Select a winner, majority-vote, or silently reconcile |

The handoff explicitly leaves response storage, response classification,
conversation flow, and personalization to the external conversational
consumer. A personal question can therefore proceed only as a bounded report
of included FACT/evidence followed by a context request; it cannot become an
engine-generated definitive personality, fortune, or prediction statement.

## Hypothesis and authorization result

The submission contract requires exact fact references, exact source/locator
scope, preservation of unsafe and conflict evidence, a tentative assertion,
and an explicit user-context gate. Current source records have
`semanticBasisEligible: false`, so the following is intentional:

- validation result: `blocked` with `source_semantic_basis_not_available`;
- `confirmed`, `uncertain`, and `declined` user states cannot reopen a blocked
  source gate;
- per-hypothesis authorization: `reject`;
- global interpretation activation remains unchanged and cannot be promoted by
  this contract.

The contract also rejects a submission that combines the Nanbei and Nanyang or
other independent-looking lineages as a synthetic consensus. Different
lineages remain separate unless a future source explicitly closes a
composition rule.

## Evidence and historical-source frontier

The repository's current direct witness work is sufficient to carry source
identity and locator-bounded observations, but not to establish semantic
authority. In particular, the following remain blockers rather than hidden
defaults:

1. complete 12-field palace semantic binding;
2. an authoritative and reproducible Tianfu convention;
3. independent external natal-chart oracle parity;
4. authoritative calendar/time source identity;
5. source/edition independence and redistribution review where needed.

The NARA volume-2 leaves 64–80 frontier and the Toyo/AKS candidate remain
research inputs, not semantic promotion evidence. Same catalog-record volume
agreement is not independent cross-validation.

## Verification performed

`test/ziweiInterpretationPrepContracts.test.js` covers:

- real Base fixture → envelope → Constitution adapter → consumption contract →
  handoff package;
- fresh JSON file re-consumption and byte-stable package materialization;
- preserved conflict and unresolved state;
- missing FACT, source-hash tamper, and attempted semantic promotion
  fail-closed;
- external hypothesis validation at the source-authority blocker;
- all three user confirmation states remaining unable to authorize a blocked
  hypothesis;
- cross-lineage synthesis rejection.

No Ziwei calculation rule, public Base FACT, existing activation state, source
authority, or conversational LLM integration was changed by this checkpoint.

## Reopen conditions

Reopen only when a future bounded research unit supplies, and independently
checks, the exact source/edition identity, stable locator, applicable input
FACT, deterministic output, exceptions, lineage scope, and provenance needed
for one claim. A source item may become a semantic basis only through an
explicit contract change and new fresh-file/tamper/conflict tests. A new
source cannot silently alter the public Base, merge with another lineage, or
promote interpretation activation.

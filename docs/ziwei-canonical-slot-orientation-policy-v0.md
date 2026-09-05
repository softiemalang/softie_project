# Ziwei canonical slot/orientation policy proposal v0

## Status and boundary

The historical physical-slot frontier is locked at the provisional status
`historical direct authority for physical-slot binding = insufficient_evidence`.
Adjacent-page expansion is stopped until a new same-frame witness has both a
closed lineage/locator and a direct physical binding.

This document proposes an implementation policy only. It does not promote any
historical source, alter the existing historical FACTs, change the resolver,
or activate a production route. The preserved source facts remain separate:

- palace order;
- selected palace-to-branch mappings;
- textual `逆行` traversal wording; and
- branch labels observed against physical perimeter geometry.

None of those facts selects the policy's slot origin, orientation, or screen
coordinates. Every policy choice below is explicitly non-historical.

## Proposed logical model

| Policy field | Proposed value | Historical status |
| --- | --- | --- |
| logical slot numbering | zero-based `0..11` | `historicalFact: false` |
| presentation number | `logicalSlotOrdinal + 1`, presentation-only | `historicalFact: false` |
| logical anchor | slot `0` | `historicalFact: false` |
| canonical perimeter | twelve cells on a `4 × 4` abstract perimeter | `historicalFact: false` |
| default orientation | clockwise along the declared path | `historicalFact: false` |
| orientation alternatives | clockwise and counterclockwise | `historicalFact: false` |
| rotation | explicit offset `0..11`; offset identifies the path cell for logical slot `0` | `historicalFact: false` |
| UI coordinate basis | pure `{row, column}` data; no DOM/CSS assumptions | `historicalFact: false` |

The default clockwise value is an implementation compatibility choice for the
current array progression. It is not a claim that historical diagrams used
that orientation. `orientation` here means perimeter presentation traversal;
it must not be read as the historical textual `逆行`/`順行` rule.

The canonical path is:

```text
(0,0) → (0,1) → (0,2) → (0,3) → (1,3) → (2,3)
      → (3,3) → (3,2) → (3,1) → (3,0) → (2,0) → (1,0)
```

The four inner coordinates `(1,1)`, `(1,2)`, `(2,1)`, and `(2,2)` are reserved
and are not slots. A UI adapter may render this data in another layout, but it
must not recompute ordinal, orientation, rotation, or branch semantics.

## Reversible mapping contract

For `s ∈ 0..11`, rotation `r ∈ 0..11`, and orientation `o`:

```text
clockwise:        pathIndex = (r + s) mod 12
counterclockwise: pathIndex = (r - s) mod 12
```

`pathIndexToLogicalSlot` and `coordinateToLogicalSlot` are the required
inverses. Invalid ordinals, offsets, orientations, and inner-grid coordinates
fail closed. The module is pure and has no UI/runtime dependency.

## Tests fixed by this proposal

`test/ziweiCanonicalSlotOrientationPolicy.test.js` fixes:

1. twelve unique perimeter coordinates and reserved inner cells;
2. zero-based ordinal ↔ one-based display-number reversibility;
3. forward/inverse round trips for all `12 × 12 × 2` variants;
4. rotation composition modulo twelve;
5. explicit clockwise/counterclockwise ambiguity rather than silent choice;
6. deterministic, immutable, UI-independent mapping output; and
7. fail-closed validation for invalid inputs.

## Approval and activation gates

This proposal may be reviewed without historical promotion. Before adoption,
the owner must approve the schema and default values, and the full reversible
matrix and UI-adapter checks must pass. If a product requirement calls the
mapping historically correct, a separate historical gate remains blocked until
the required lineage/locator-closed same-frame direct witness arrives.

Activation requires a separate explicit approval, a reviewed adapter/e2e UI
check, a declared policy version, and a rollback path. None of those gates is
opened here; the module remains unintegrated and `not_activated`.

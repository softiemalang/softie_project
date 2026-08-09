# Western True Node independent-oracle frontier v4

Access timestamp: 2026-08-09T06:26:47Z (2026-08-09 15:26:47 Asia/Seoul). This
is a read-only research ledger. It does not define, activate, deploy, or license
a production True Node provider.

Status: `complete_western_true_node_independent_oracle_frontier_exhausted_uncommitted`

## Current production boundary

The current checkout has no production True Node calculation. `true_node` and
`mean_node` are explicit unsupported bodies in `src/astrology/astrologyRuleCore.js`;
the older `src/astrology/planetResolver.js` is marked `simulation_only` and is not
an astronomical provider. The chart defaults (`tropical`, `geocentric`) and the
general explicit time-scale contract are not a True Node semantic contract.

The nine requested fields therefore remain separated:

| Field | Current evidence | Contract conclusion |
|---|---|---|
| ascending node | lunar/north-node names in isolated research | observed label only |
| true vs mean/osculating | `true_node` and `mean_node` are separate unsupported IDs; Swiss documentation describes its true node as an osculating node | production identity unresolved |
| center | repository chart default is geocentric | not proven for a production node provider |
| tropical/sidereal | repository chart default is tropical | not proven for a production node provider |
| plane/frame/equinox | candidate and Swiss/Horizons comparisons use different explicit frame choices | unresolved |
| time scale/epoch | general code requires explicit TT-UTC/DUT1; research corpus uses TDB plus paired synthetic TT | unresolved |
| apparent/geometric/light-time/aberration | only research flag comparisons exist | unresolved |
| normalization | isolated candidate normalizes to `[0,360)` | no production contract |
| tolerance | no acceptance tolerance is declared | no tolerance authorization |

This is deliberately not a semantic guess. The artifact records the declared
generation baseline, exact source hashes, and unsupported production boundary.
The checker accepts a later `main`/`origin/main` checkout only when it is a
descendant of the declared baseline and all recorded source bytes still match;
this keeps the immutable artifact reproducible after its commit is created:

```sh
node scripts/materialize-astrology-true-node-independent-frontier-v4.mjs
node scripts/check-astrology-true-node-independent-frontier-v4.mjs
```

## Investigated candidates

| Candidate | Independence finding | Result |
|---|---|---|
| Swiss `SE_TRUE_NODE` | the comparison target, not an independent oracle | comparison reference only |
| DE405 state-derived candidate | distinct cross-product algorithm, but candidate semantics are not production authority | not established |
| CSPICE DE405 | same DE405 input lineage | control, not independent |
| NASA/JPL Horizons DE441 | official raw state/`OM`, but same JPL DE family and no direct tropical/date True Node field | same-family corroboration |
| ERFA/SOFA `eraMoon98` | independent analytic Moon state/velocity; no True Node API; documented accuracy is insufficient for precision authority | negative control |
| Astrolog Matrix-only | Swiss/Placalc-disabled build is computationally separate; `ComputeLunar()` is a short perturbation approximation | raw observation only; GPL source not production dependency |
| Skyfield 1.53 + DE440 | read-only local 134-row state comparison; wrapper and DE kernel are another JPL-family path | same-family corroboration |
| Astronomy Engine | official API exposes Moon ascending/descending node event times, not instantaneous node longitude | not applicable |
| USNO NOVAS | general astrometry and transformations, no direct True Node field | derived implementation would still lack semantic bridge |

The local Skyfield/DE440 check produced 134 rows against the preserved Horizons
DE441 vectors: maximum position-norm difference `0.011970024595391352 km` and
maximum velocity-norm difference `3.325526311864916e-8 km/s`. This is useful
family corroboration, not a second authority: changing the wrapper and DE
solution does not define the product's exact node semantics.

## Deterministic evidence already closed

- DE405 candidate vs Swiss: 7,342 ten-day samples over the 1900–2101 service
  interval plus four boundary probes; maximum `18.635712528976 arcsec`, median
  `11.664927884066856 arcsec`, p95 `17.304343789919585 arcsec`.
- Horizons/ERFA successor: 134 deterministic samples including the historical
  eight; Horizons date-frame vs Swiss mean-frame maximum `1.6422761457306478
  arcsec`, Horizons vs local DE405 maximum `0.11627137882896932 arcsec`, ERFA
  `moon98` vs Swiss maximum `72.20445804505289 arcsec`, and Horizons
  `OM`/vector internal consistency below `1e-9 arcsec`.
- Frame diagnostic: default-vs-mean-equinox comparison reduced the maximum from
  `18.635712528976` to `1.8031521231023362 arcsec`; this is a convention
  hypothesis, not a tolerance pass.
- Light-time diagnostic: same-engine flag effect maximum
  `0.014527895200444618 arcsec`; insufficient to establish identity.

All comparisons remain `diagnostic_only_no_tolerance_pass`. Existing artifacts
are inputs to the v4 successor and are byte-hash checked; they are not rewritten.

## Authority conclusion and real blocker

The safe frontier is exhausted under the current repository, local resources,
and read-only external access. No candidate both (1) independently implements
or directly publishes the same complete quantity and (2) supplies a reviewable
bridge to a production contract. Accordingly:

```json
{
  "independentTrueNodeReference": "pending",
  "authorityFrontier": "exhausted_under_current_permissions",
  "qualification": "blocked_semantic_identity_insufficient",
  "productionProviderChanged": false,
  "activationChanged": false,
  "toleranceChanged": false
}
```

The next meaningful frontier requires a source-backed, license-usable
independent implementation/dataset that directly emits the same geocentric
tropical instantaneous True Node, or an independent adjudication formally
bridging the JPL osculating state/`OM` quantity to that contract. More samples
from DE405/DE440/DE441, another Swiss wrapper, or a post-hoc tolerance change
would not close that blocker.

External source URLs and access timestamp, local input hashes, corpus summaries,
and candidate classifications are sealed in
`artifacts/astrology-true-node-independent-frontier-v4/complete.json`.

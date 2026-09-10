# Astrology Discrete FACT Boundary Contract v1

## Decision

The production FACT contract is source-relative, not a claim of absolute
physical truth. A FACT means that the declared authority, model, provider
identity, time-scale bundle, input, and Rule Core deterministically produced a
value or classification. This is the same epistemic lane already used by the
Astrology packet and consumer contracts: raw provider output is
`observed_or_calculated`, Rule Core output is `deterministically_derived`, and
neither lane silently becomes personal meaning, prediction, or universal
truth.

No universal absolute physical-error bound is therefore required for internal
source-relative arbitrary-date FACT readiness. The required safeguards are
identity, coverage, deterministic execution, explicit status, and the existing
discrete decision guards. Public redistribution remains a separate external
review gate and is unchanged.

The machine-readable contract is
`api/provider/astrology-discrete-fact-boundary-contract-v1.json`. The
fail-closed assessor is
`src/astrology/astrologyDiscreteFactBoundary.js`. It does not recalculate a
chart, change a numerical FACT, relax an existing tolerance, add semantic
meaning, or activate interpretation.

## Three separate uncertainty lanes

These lanes must not be merged:

| Lane | What is retained | What it does not prove |
| --- | --- | --- |
| Numerical/computational uncertainty | Finite binary64/provider output, declared final-observable interval when one is available, and the existing acceptance ceilings | Absolute physical truth or an unobserved error bound |
| Source/model uncertainty | C04 formal-error fields, correction/model identity, HF2002/IERS/TN36/IAU 2006 B3 model metadata, coverage, and limitations | A universal worst-case error bound obtained by inference |
| Decision guard | The frozen `1/60°` sign/orb guard and `1e-7°/day` motion/phase epsilon | A measurement-accuracy statement or a source-authority upgrade |

The C04 guide describes daily C04 values and the need to account for diurnal
and sub-diurnal effects. It also distinguishes formal internal precision from
realistic accuracy. The implementation retains those fields and correction
provenance; it does not turn them into an absolute DUT1 bound. See the
official [C04 guide](https://hpiers.obspm.fr/eoppc/eop/eopc04_05/C04.guide.pdf).

The existing fixed provider-equivalence ceilings remain unchanged:

```text
longitude absolute error          <= 0.01°
longitude-speed absolute error    <= 1e-7°/day
aspect-distance absolute error    <= 0.02°
aspect-orb absolute error         <= 0.02°
```

Those values are acceptance ceilings for the existing provider comparison;
they are not absolute truth bounds. The `1.770977 μs` two-part-JD value is a
time-representation budget, and the HF2002 model figure is model information.
Neither is converted into an angular or discrete-truth guarantee.

## Source-relative FACT and interval-backed stability

There are two intentionally separate decisions:

1. **Source-relative FACT readiness.** A fixed, verified provider/model and
   Rule Core may expose the central result in the declared source-relative
   lane. The result carries source identity, applicable coverage, rule identity,
   and the Rule Core's existing boundary status. No universal absolute bound
   is required for this lane.
2. **Interval-backed boundary stability.** When a producer supplies a finite,
   non-negative, source-referenced final-observable interval, this assessor
   checks that the interval clears the existing guard. This is stronger
   stability evidence, not a physical-truth claim. Missing, rejected, or
   over-tolerance intervals remain `indeterminate` or `blocked`.

`source_relative_model_interval` is an accepted interval basis only when it is
an explicitly materialized final-observable interval under the declared fixed
source/model. The assessor never derives it from C04 formal error, provider
agreement, the two-part-JD budget, fixture agreement, or an unbounded model
claim. A conservative sum is allowed only from independently accepted
component bounds and remains source-relative.

## Discrete boundary rules

The central Rule Core output is checked against the same source implementation
before any interval-backed confirmation. A central-output mismatch is
`blocked`; it is never repaired by the assessor.

| Result | Source-relative central use | Interval-backed confirmation |
| --- | --- | --- |
| Sign | Use the existing sign and `boundaryStatus` under the fixed Rule Core; a near-boundary result is not a stable single-sign claim | The complete longitude interval must stay in one half-open 30° interval and clear the frozen `1/60°` guard |
| Aspect geometry | Use the existing selected aspect/orb under the fixed Rule Core; preserve `near_orb_boundary` | The complete angular-distance interval must have one guarded match or guarded absence for every candidate region |
| Aspect phase | Preserve the existing phase, including `unavailable`/`indeterminate` | Signed-offset and relative-speed intervals must preserve one existing phase classification; angle phase remains unavailable |
| Motion | Use the existing direct/retrograde/stationary result under the fixed Rule Core | The complete speed interval must remain strictly outside or wholly inside the frozen epsilon bands |
| Whole Sign house | Use only the existing composition of declared ASC/body signs and `whole_sign` mapping | Required ASC/body sign dependencies must be interval-confirmed and the mapping must match |
| Chart ruler | Use only the existing mapping of a declared ASC sign | ASC sign must be interval-confirmed and both existing mappings must match |
| Distribution | Use existing counts and tie state without a tie-break | All required body signs must be interval-confirmed and counts/leaders/ties must match |

Near or crossing boundaries remain visible and are not promoted by numerical
closeness, provider agreement, or a source-relative label. `confirmed` from the
assessor means stable under the supplied interval and the declared contract;
it does not mean physically exact.

## Provenance and fail-closed behavior

Every source-relative or interval-backed result retains the immutable time-scale
bundle schema/SHA, Rule Core version, provider identity, source references, and
the identities of DUT1, TT−UTC, and TDB−TT. Every supplied final-observable
interval retains its own basis and source references.

The following remain fail-closed: missing or changed contract/bundle identity,
missing provider/source references, missing or invalid coverage, missing or
rejected intervals when interval-backed confirmation is requested, central Rule
Core tampering, sign/aspect/motion boundary ambiguity, missing dependencies,
unresolved components, and any activation or semantic-promotion attempt.

## Readiness decision at this checkpoint

```text
internal arbitrary-date FACT readiness: ready_source_relative
interval-backed boundary assessment: available, fail-closed when an interval is supplied
public redistribution: blocked by the existing external_review_required gate
interpretation activation: unchanged and blocked
```

This is a technical source-relative readiness decision only. It does not
promote public deployment, interpretation, semantic source rules, True Node,
personalization, or activation. The existing offline time-scale bundle still
retains its C04 snapshot coverage, no-prediction policy, source hashes, and
redistribution blocker. The [IERS Chapter 5 materials](https://iers-conventions.obspm.fr/chapter5.php)
and [IERS TN36 Chapter 10](https://iers-conventions.obspm.fr/content/chapter10/tn36_c10.pdf)
remain the governing technical references.

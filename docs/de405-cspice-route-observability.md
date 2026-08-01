# DE405 CSPICE route observability diagnostic

This diagnostic path is isolated from the production DE405 runner. It copies
four N0067 f2c-translated CSPICE sources into its ignored build directory and
links the instrumented objects before the read-only N0067 static libraries.
The production `spkez_c` request and arithmetic are retained; event emission
occurs only after route metadata, record selection, or evaluator output has
been produced.

The observed call path is:

`spkez_c → spkez_ → spkgeo_ → spksfs_ → spkpvn_ → spkr02_ → spke02_ → chbint_`

Observed directly: selected segment descriptor identity, Type 2 record number
and address, Type 2 evaluator dispatch, evaluator state bits, and ordered leg
events. The diagnostic wraps `SPKGEO`'s `VADDG`, `VSUBG`, `MOVED`, `MXV`, and
`MXVG` calls, preserving the original operations while recording accumulator
before/after bits, subtraction, and orientation-operation events.

The full 1,701-case run produced 17,010 CSPICE events. Instrumented versus
uninstrumented final states were bitwise identical for 1,701/1,701 cases, with
zero missing cases and zero errors. The observable segment/record route joined
the existing project chain decomposition exactly for 1,583 cases; 118 cases
showed a project four-leg versus CSPICE three-leg chain-length divergence.

Build and materialization:

```text
CSPICE_DIR=/Users/softie/.local/share/softie-de405/cspice/N0067 npm run build:de405:cspice-route-diagnostic
node scripts/materialize-de405-cspice-route-input.mjs artifacts/de405-jpl-cspice-residual-sweep.classifications.jsonl artifacts/de405-jpl-cspice-residual-sweep.samples.jsonl tools/de405-cspice-route-diagnostic/build/ambiguous-input.jsonl
node scripts/materialize-de405-project-route-events.mjs tools/de405-cspice-route-diagnostic/build/ambiguous-input.jsonl tools/de405-cspice-route-diagnostic/build/project-route-events.jsonl
node scripts/materialize-de405-cspice-route-summary.mjs
```

Generated large JSONL evidence remains untracked under `artifacts/`, consistent
with the existing DE405 artifact policy. No production route, contract,
tolerance, external CSPICE source, or default command was changed.

The current aggregate has 1,222 exact final-state matches, 1,583 exact
observable segment/record route identities, 1,590 unique CSPICE route
identities, and one primary classification for every case. Primary first
divergences are recorded from the required precedence order; chain-length
divergence is also retained as a secondary difference for 118 cases.

# DE405 experimental Type-2 official-order parity

The experimental evaluator is isolated at
`tools/de405-type2-experimental-evaluator/`. It evaluates an existing decoded
Type-2 record only; it does not select records, compose center chains, or route
production output. Its C statements preserve the official `CHBINT` recurrence,
including left-associative derivative evaluation. The build uses `-O0` and
`-ffp-contract=off` locally because the accepted instrumented official trace
was compiled without contraction; no repository-wide compiler policy changed.

The materialized 154-case evidence compares normalized time, every recurrence
temporary, derivative scaling, and final state bits. Results are 154/154 exact,
with 139 unique record instances, 143 distinct record/ET inputs, 93 retained
position-polynomial classifications, and 61 retained velocity-derivative
classifications. Two materializations are byte-identical.

The complete shadow replay uses the existing project-owned DAF record identity
and the local DE405 kernel. All 1,701 cases evaluated successfully with no
missing or execution-error rows. The shadow changed 371 project pair outputs;
1,583 shadow pair outputs exactly matched the existing CSPICE reference, and
1,146 cases were unaffected because their target/center chains already matched
the official chain. The counterfactual categories reconcile as 555 cases where
the experimental Type-2 chain reproduced the official chain and 1,146
unaffected cases. All 1,701 remain `selection_ambiguous` because selection and
canonical classification were not changed.

The expanded unique corpus contains 3,968 unique Type-2 record instances and
4,779 distinct record/ET evaluator inputs from 5,221 source leg observations.
All 4,779 have bitwise parity with the instrumented official evaluator, with
0 missing references and 0 mismatches.

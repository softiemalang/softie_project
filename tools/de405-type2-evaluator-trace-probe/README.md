# DE405 Type-2 evaluator trace probe

This diagnostic tool compares the project-owned Type-2 evaluator with a temporary, source-instrumented copy of CSPICE N0067 `spke02_` and its direct `chbint_` dependency.

The build refuses an unexpected official-source SHA-256 or an ambiguous patch anchor. It copies official sources into `build/instrumented-source/`, applies diagnostic-only callbacks, compiles those translation units with `-ffp-contract=off`, and requires the instrumented final state to reproduce the linked CSPICE library bitwise before the materializer accepts any intermediate trace.

The wrapper consumes the exact record payload and query ET Binary64 bits from the existing 154-sample evidence. It emits all captured recurrence operation result bits, coefficient identity, normalized-time bits, derivative output, scaling operand, and final state bits for both evaluators.

The probe is diagnostic-only. It does not expose or claim high-level CSPICE segment selection, record selection, route, or accumulator order, and it is not connected to production calculation paths.

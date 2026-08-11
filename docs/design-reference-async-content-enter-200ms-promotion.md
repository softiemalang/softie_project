# Softie async content enter 200ms promotion evidence

- Verdict: `complete_softie_async_content_enter_200ms_house_rule_promoted_uncommitted`
- Role: `async content enter / conditional content swap`
- Decision: promoted as a role-scoped Softie house rule after post-fix iPhone product-context validation.

## Rule boundary

- Recipe: `opacity`, `200ms`, `cubic-bezier(0.23, 1, 0.32, 1)`.
- Render actual content immediately; add no artificial delay, transform, layout motion, stagger, or intentional crossfade.
- Animate only entering content. Keep glass/backdrop-filter surfaces and ancestors static.
- Do not replay on refetch or later same-surface updates; empty success has no reveal; error waits for successful retry.
- Reduced motion is static/non-movement.
- The value is not a universal 200ms rule for other interaction roles.

## Provenance chain

| Stage | Evidence | Boundary |
| --- | --- | --- |
| External | Emil10 corpus revision `78761e1b57f97dce65b983d640c70a68f39e8163` | 200ms is adjacent-role guidance, not loading-specific direct provenance; easing has entering-role support. |
| Audit | Frozen v1 and Emil10 incremental artifacts | Emil duration verdict remains `insufficient_to_prefer`; 200ms remains a bounded candidate. |
| Pilot | `a49a626bf64d37c81be0b6f2f10cb52cd577f03e` | Scheduler Today first-success runtime contract. |
| Scope fix | `0a267d071fd44901471cfd8dfcaeb7937d37c22a` | Glass section shells remain static; only stable event content animates. |
| Device observation | User iPhone observation | Product-context validation, not an objective external oracle or general device matrix. |
| Promotion | This artifact and DESIGN.md | Role-scoped house rule with explicit non-generalization boundary. |

## Historical mismatch resolution

- Frozen predecessor artifacts and integrity sidecars are not rewritten.
- The Emil checker now separates stable semantic replay from descendant source-input observations and verifies protected input bytes at the historical generation base.
- A non-descendant basis, altered historical bytes, altered complete payload, or altered companion remains a failure.

## Validation boundary

- Automated checks prove source/commit/artifact contracts, deterministic materialization, and tamper rejection.
- The iPhone observations remain human product-context evidence; they do not prove all Safari devices or all motion roles.

# Diff-aware daily testing

`npm test` is the current-code/current-contract regression command. The daily
diff-aware path is:

```bash
npm run test:changed
```

The command compares the working tree with `HEAD`, includes untracked files,
and uses the current `dependency-cruiser` graph for `src/`, `scripts/`,
`tools/`, and `test/`. A changed JavaScript module selects the transitive
`test/*.test.js` and explicit source-local test dependents; a changed test file
is selected directly. Static local paths used by tests to read source text are
also considered.

Use `--base <revision>` for another local git base, `--list` to inspect the
selected paths, and `--full` to force the unchanged default-profile regression
set. A clean tree is a no-op for the daily command.

The runner promotes to the same default-profile set used by `npm test` when
the graph or path identity is not trustworthy, including package/repository
configuration, shared test fixtures and helpers, source-text or external-input
surfaces, shared test infrastructure under `scripts/lib/`,
unsupported/deleted/renamed files, and a changed module with no safe test
frontier. A graph-resolved production module, even when shared by multiple
production consumers, is instead reduced to its transitive test closure after
the complete-graph and static-reference checks pass. `test:source`,
`test:historical`, and artifact-specific commands retain their existing
profiles. `test:all` is the exhaustive local test command: it includes every
`test/**/*.test.js`, including artifact, historical, source/evidence, and
explicit `all-only` suites, plus the six colocated source-owned suites under
`src/**/*.test.js`. The latter remain available on their own through
`npm run test:source-local` and are part of the diff-aware dependency frontier
when a related source change is made.

The default profile deliberately excludes only suites whose current runtime
invariant is already covered by current contract tests and whose own purpose
is historical/versioned, research/evidence, external-fixture, or benchmark
record keeping. They are not deleted: `all-only` membership keeps them in
`test:all`, while a direct change to one still runs that file through
`test:changed`. The partition is explicit in
`scripts/lib/test-suite-discovery.mjs` and checked by
`test/testSuitePartition.test.js`. The candidate-by-candidate coverage audit
is recorded in `docs/development/default-test-profile-audit.md`.

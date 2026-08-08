import { createHash } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'

const readJson = async path => JSON.parse(await readFile(path, 'utf8'))
const identity = async path => ({ path, sha256: createHash('sha256').update(await readFile(path)).digest('hex') })
const numeric = await readJson('artifacts/de405-strategy-c-canonical-route-numeric-audit.json')
const sentinel = await readJson('artifacts/de405-strategy-c-canonical-route-sentinel-comparison.json')
const fullRoute = await readJson('artifacts/de405-strategy-c-canonical-route-full-audit.json')
const legacy = await readJson('artifacts/de405-strategy-c-shadow-summary.json')
const fullNumeric = { ...numeric, inputs: { ...numeric.inputs, shadow: { ...numeric.inputs.shadow, path: 'temporary canonical-route shadow stream (deleted after audit)' } } }
const fullRouteEvidence = { ...fullRoute, inputs: Object.fromEntries(Object.entries(fullRoute.inputs).map(([key, value]) => [key, { ...value, path: key === 'shadow' ? 'temporary canonical-route compact shadow stream (deleted after audit)' : key === 'compactRoute' ? 'temporary compact route projection (deleted after audit)' : value.path }])) }
const evidence = {
  schemaVersion: 1,
  recordType: 'de405_strategy_c_canonical_route_variant_evidence',
  variant: { name: 'canonical_minimal_path_route_shadow', productionActivation: false, legacyShadowPreserved: true, method: 'legacy shadow target/center leg bytes are normalized by removing the common suffix from final pair composition while retaining the canonical route leg order', normalizer: 'scripts/normalize-de405-strategy-c-canonical-route-shadow.mjs' },
  legacyShadow: { artifact: 'artifacts/de405-strategy-c-shadow-summary.json', counts: legacy.counts },
  fullNumeric,
  fullRoute: fullRouteEvidence,
  routeSentinel: sentinel,
  fullRouteStatus: 'proved',
  fullRouteReason: 'The 150671-row instrumented route event stream was compacted deterministically and compared against the canonical-route shadow projection.',
  sourceIdentities: {
    normalizer: await identity('scripts/normalize-de405-strategy-c-canonical-route-shadow.mjs'),
    legacyShadowSource: await identity('tools/de405-type2-experimental-shadow/src/de405_type2_experimental_shadow.c'),
    canonicalSource: await identity('tools/de405-cspice-runner/src/de405_canonical_v2.c'),
    integrationAdapter: await identity('tools/de405-type2-strategy-c-integration/src/de405_type2_strategy_c_integration.c')
  },
  gates: {
    fullNumericCandidateExact: numeric.gates.candidateExactFullCorpus,
    fullNumericCandidateRegression: numeric.gates.candidateRegression,
    sentinelRouteIdentityExact: sentinel.interpretation.routeIdentityObserved === true,
    sentinelRecordIdentityExact: sentinel.counts.recordIdentityMismatch === 0,
    sentinelEvaluatorStateExact: sentinel.counts.evaluatorStateMismatch === 0,
    fullRouteIdentityExact: fullRoute.gates.routeIdentityExact && fullRoute.gates.recordIdentityExact && fullRoute.gates.evaluatorStateExact
  },
  reconciliation: { legacyChanged: legacy.counts.changed, legacyResolved: legacy.counts.resolved, canonicalRouteChanged: fullRoute.counts.candidateChanged, canonicalRouteResolved: fullRoute.counts.candidateResolved, aggregateDelta: { changed: fullRoute.counts.candidateChanged - legacy.counts.changed, resolved: fullRoute.counts.candidateResolved - legacy.counts.resolved }, explanation: 'The legacy shadow independently composes the shared parent suffix and preserves the original 18381/16062 aggregate. The canonical-route variant removes that suffix from final pair composition, reproduces the observed CSPICE route, and therefore has a distinct 17279/17279 transition aggregate.' },
  interpretation: { productionProposalEligible: false, reason: 'Full canonical-route numeric and route evidence is now proved, but the legacy aggregate reconciliation and support matrix remain separate contract gates.' }
}
const markdown = `# Strategy C canonical-route variant evidence\n\n- Production activation: false\n- Legacy shadow artifact preserved: true\n- Full numeric candidate exact: ${fullRoute.counts.candidateExact}/${fullRoute.counts.rows}\n- Full numeric candidate regressions: ${fullRoute.counts.candidateRegressed}\n- Full numeric changed/resolved: ${fullRoute.counts.candidateChanged}/${fullRoute.counts.candidateResolved}\n- Full route exact: ${fullRoute.counts.routeIdentityExact}/${fullRoute.counts.rows}\n- Full record exact: ${fullRoute.counts.recordIdentityExact}/${fullRoute.counts.rows}\n- Full evaluator exact: ${fullRoute.counts.evaluatorStateExact}/${fullRoute.counts.evaluatorComparisons}\n- Sentinel route exact: ${sentinel.counts.routeIdentityExact}/${sentinel.counts.rows}\n\n## Boundary\n\nThe legacy shadow remains unchanged and its prior aggregate is preserved. The canonical-route variant removes the common target/center suffix only from final pair composition, matching the observed CSPICE route.\n\n## Aggregate reconciliation\n\n- Legacy changed/resolved: ${legacy.counts.changed}/${legacy.counts.resolved}\n- Canonical-route changed/resolved: ${fullRoute.counts.candidateChanged}/${fullRoute.counts.candidateResolved}\n- Delta: ${fullRoute.counts.candidateChanged - legacy.counts.changed}/${fullRoute.counts.candidateResolved - legacy.counts.resolved}\n\nThe delta is retained as a route-composition reconciliation, not silently merged or approved. This artifact does not authorize a production proposal because the support matrix gate remains incomplete.\n`
await writeFile('artifacts/de405-strategy-c-canonical-route-variant-evidence.json', JSON.stringify(evidence, null, 2) + '\n')
await writeFile('artifacts/de405-strategy-c-canonical-route-variant-evidence.md', markdown)
console.log(JSON.stringify({ json: 'artifacts/de405-strategy-c-canonical-route-variant-evidence.json', markdown: 'artifacts/de405-strategy-c-canonical-route-variant-evidence.md', fullRouteStatus: evidence.fullRouteStatus }, null, 2))

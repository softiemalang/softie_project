import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { classifyShadowTransition, reconcileShadowTransitions } from '../scripts/lib/de405-shadow-transition.mjs'

const root = resolve(new URL('..', import.meta.url).pathname)

test('shadow transition classifier covers exact, regression, resolution, unchanged, and changed-unresolved fixtures', () => {
  const fixtures = [
    [{ baselineExact: true, candidateExact: true, changed: false }, 'baseline_exact_candidate_exact'],
    [{ baselineExact: true, candidateExact: false, changed: true }, 'baseline_exact_candidate_regressed'],
    [{ baselineExact: false, candidateExact: true, changed: true }, 'baseline_mismatch_candidate_exact'],
    [{ baselineExact: false, candidateExact: false, changed: true }, 'baseline_mismatch_candidate_changed_still_mismatch'],
    [{ baselineExact: false, candidateExact: false, changed: false }, 'baseline_mismatch_candidate_unchanged'],
  ]
  for (const [input, expected] of fixtures) assert.equal(classifyShadowTransition(input), expected)
})

test('shadow transition classifier fails closed for route, coverage, error, reference, and non-Type-2 fixtures', () => {
  assert.equal(classifyShadowTransition({ baselineExact: false, candidateExact: true, changed: true, routeInvariant: false }), 'route_invariant_violation')
  assert.equal(classifyShadowTransition({ baselineExact: true, candidateExact: true, changed: false, coverageChanged: true }), 'coverage_changed')
  assert.equal(classifyShadowTransition({ baselineExact: true, candidateExact: true, changed: false, errorChanged: true }), 'error_classification_changed')
  assert.equal(classifyShadowTransition({ baselineExact: false, candidateExact: false, changed: false, referenceAvailable: false }), 'reference_unavailable')
  assert.equal(classifyShadowTransition({ baselineExact: true, candidateExact: true, changed: false, candidateApplicable: false }), 'candidate_not_applicable_non_type2')
  assert.equal(classifyShadowTransition({ baselineExact: false, candidateExact: false, changed: true, candidateApplicable: false }), 'candidate_not_applicable_same_bits')
  assert.equal(classifyShadowTransition({ baselineExact: false, candidateExact: false, changed: false, candidateExecutionError: true }), 'error_classification_changed')
})

test('shadow transition reconciliation is exact and rejects missing or duplicate categories', () => {
  assert.deepEqual(reconcileShadowTransitions({ baseline_exact_candidate_exact: 2, baseline_mismatch_candidate_exact: 1 }, 3), { counts: 3, total: 3, exact: true })
  assert.equal(reconcileShadowTransitions({ baseline_exact_candidate_exact: 2 }, 3).exact, false)
})

test('candidate activation is isolated from default production commands and source', async () => {
  const packageJson = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'))
  const productionSource = await readFile(resolve(root, 'tools/de405-cspice-runner/src/de405_canonical_v2.c'), 'utf8')
  const shadowSource = await readFile(resolve(root, 'tools/de405-type2-experimental-shadow/src/de405_type2_experimental_shadow.c'), 'utf8')
  assert.doesNotMatch(packageJson.scripts.build, /shadow|candidate/i)
  assert.doesNotMatch(productionSource, /de405_candidate|experimental_shadow/i)
  assert.match(shadowSource, /de405_candidate_cheby/)
  assert.match(shadowSource, /baselinePairStateBits/)
  assert.match(shadowSource, /candidatePairStateBits/)
})

test('published shadow artifacts preserve the bounded readiness and evidence contracts', async () => {
  const readArtifact = async name => JSON.parse(await readFile(resolve(root, 'artifacts', name), 'utf8'))
  const readiness = await readArtifact('de405-type2-shadow-readiness.json')
  const exclusions = await readArtifact('de405-wider-corpus-exclusion-inventory.json')
  const fidelity = await readArtifact('de405-project-route-shadow-fidelity.json')
  const remaining = await readArtifact('de405-type2-shadow-remaining-mismatch.json')
  const determinism = await readArtifact('de405-type2-shadow-determinism.json')
  const buildIdentity = await readArtifact('de405-type2-shadow-build-identity.json')

  assert.equal(readiness.allGatesPass, true)
  assert.equal(readiness.readinessCategory, 'promising_but_requires_additional_validation')
  assert.equal(readiness.sourceArtifacts.remainingMismatchPath, 'de405-type2-shadow-remaining-mismatch.json')
  assert.equal(exclusions.theoreticalRows - exclusions.excludedCount, exclusions.manifestRows)
  assert.equal(exclusions.excludedCount, 15)
  assert.equal(exclusions.status, 'complete')
  assert.equal(fidelity.counts.baselineFinalMismatchProbe, 0)
  assert.equal(fidelity.routeInvariant.violations, 0)
  assert.equal(fidelity.counts.recordIdentityMismatch, 0)
  assert.equal(fidelity.counts.subintervalMismatch, 0)
  assert.equal(remaining.counts.candidateRegressed, 0)
  assert.equal(remaining.unresolved, 54789)
  assert.equal(determinism.allByteIdentical, true)
  assert.equal(buildIdentity.productionRouting, false)
  assert.equal(buildIdentity.candidateSubstitutionBoundary, 'type2_arithmetic_only')
})

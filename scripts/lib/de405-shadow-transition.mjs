export function classifyShadowTransition({ baselineExact, candidateExact, changed, routeInvariant = true, coverageChanged = false, errorChanged = false, referenceAvailable = true, candidateApplicable = true, candidateExecutionError = false }) {
  if (!referenceAvailable) return 'reference_unavailable'
  if (coverageChanged) return 'coverage_changed'
  if (errorChanged || candidateExecutionError) return 'error_classification_changed'
  if (!routeInvariant) return 'route_invariant_violation'
  if (!candidateApplicable) return changed ? 'candidate_not_applicable_same_bits' : 'candidate_not_applicable_non_type2'
  if (baselineExact && candidateExact) return 'baseline_exact_candidate_exact'
  if (baselineExact && !candidateExact) return 'baseline_exact_candidate_regressed'
  if (!baselineExact && candidateExact) return 'baseline_mismatch_candidate_exact'
  if (changed) return 'baseline_mismatch_candidate_changed_still_mismatch'
  return 'baseline_mismatch_candidate_unchanged'
}

export function reconcileShadowTransitions(transitions, total) {
  const counts = Object.values(transitions).reduce((sum, value) => sum + value, 0)
  return { counts, total, exact: counts === total }
}

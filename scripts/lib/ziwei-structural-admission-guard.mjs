export const GUARD_SCHEMA = 'ziwei-structural-admission-guard-pilot-v0'

export const PILOT_RESULTS = [
  'limited_admission_possible',
  'additional_structural_restriction_required',
  'pilot_reblocked',
]

// Reference-only consumer boundary: callers receive the guard and its linked
// occurrence together. There is intentionally no raw-text-only accessor.
export function consumeGuardedOccurrence(record) {
  if (!record || record.schemaVersion !== GUARD_SCHEMA) throw new Error('guard_record_required')
  if (record.consumerContract?.standaloneConsumptionAllowed !== false) throw new Error('standalone_consumption_forbidden')
  if (record.consumerContract?.rawTextOnlyPathAllowed !== false) throw new Error('raw_text_only_consumption_forbidden')
  return { guard: record.guard, occurrence: record.occurrence }
}

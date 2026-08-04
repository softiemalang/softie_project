import { createHash } from 'node:crypto'

export const GUARD_SCHEMA = 'ziwei-structural-admission-guard-pilot-v0'
export const ADMISSION_UNIT_SCHEMA = 'ziwei-structural-admission-unit-v1'

export const PILOT_RESULTS = [
  'limited_admission_possible',
  'additional_structural_restriction_required',
  'pilot_reblocked',
]

const stable = value => Array.isArray(value)
  ? value.map(stable)
  : value && typeof value === 'object'
    ? Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])]))
    : value
const digest = value => createHash('sha256').update(JSON.stringify(stable(value)) ?? 'undefined').digest('hex')

export function buildAdmissionUnit({ occurrence, guard }) {
  if (!occurrence?.occurrenceId || !guard?.sourceIdentity) throw new Error('admission_unit_parts_required')
  const occurrenceReference = {
    occurrenceId: occurrence.occurrenceId,
    provenanceReference: occurrence.provenanceReference,
    rawText: occurrence.rawText,
  }
  const unit = {
    schemaVersion: ADMISSION_UNIT_SCHEMA,
    unitVersion: '1.0.0',
    occurrence: occurrenceReference,
    guard,
    binding: {
      occurrenceId: occurrence.occurrenceId,
      provenanceOccurrenceId: occurrence.provenanceReference?.occurrenceId,
      occurrenceSha256: digest(occurrenceReference),
      guardSha256: digest(guard),
    },
    consumerContract: {
      atomicUnitOnly: true,
      standaloneConsumptionAllowed: false,
      rawTextOnlyPathAllowed: false,
      partialSerializationAllowed: false,
      occurrenceGuardConflationAllowed: false,
    },
  }
  unit.binding.unitSha256 = digest({ ...unit, binding: { ...unit.binding, unitSha256: undefined } })
  return unit
}

export function validateAdmissionUnit(unit) {
  const failures = []
  if (unit?.schemaVersion !== ADMISSION_UNIT_SCHEMA || unit?.unitVersion !== '1.0.0') failures.push('admission_unit_schema')
  if (!unit?.occurrence?.occurrenceId || unit?.binding?.occurrenceId !== unit?.occurrence?.occurrenceId) failures.push('occurrence_id_binding')
  if (unit?.binding?.provenanceOccurrenceId !== unit?.occurrence?.provenanceReference?.occurrenceId) failures.push('provenance_id_binding')
  if (unit?.binding?.occurrenceSha256 !== digest(unit?.occurrence)) failures.push('occurrence_binding')
  if (unit?.binding?.guardSha256 !== digest(unit?.guard)) failures.push('guard_binding')
  const expectedUnitHash = digest({ ...unit, binding: { ...unit?.binding, unitSha256: undefined } })
  if (unit?.binding?.unitSha256 !== expectedUnitHash) failures.push('unit_binding')
  if (unit?.consumerContract?.atomicUnitOnly !== true || unit?.consumerContract?.standaloneConsumptionAllowed !== false || unit?.consumerContract?.rawTextOnlyPathAllowed !== false || unit?.consumerContract?.partialSerializationAllowed !== false || unit?.consumerContract?.occurrenceGuardConflationAllowed !== false) failures.push('consumer_contract')
  if (unit?.occurrence?.rawText?.isVerifiedFact !== false || unit?.guard?.isStableClaim !== false) failures.push('epistemic_boundary')
  if (unit?.guard?.sourceIdentity?.status !== 'unresolved_source_identity' || unit?.guard?.sourceIdentity?.independentVerification !== false) failures.push('source_boundary')
  return [...new Set(failures)]
}

// Reference-only consumer boundary: callers receive one versioned admission
// unit. There is intentionally no raw-text-only accessor or split return.
export function consumeAdmissionUnit(record) {
  if (!record || record.schemaVersion !== GUARD_SCHEMA) throw new Error('guard_record_required')
  if (Object.hasOwn(record, 'occurrence') || Object.hasOwn(record, 'guard')) throw new Error('split_record_forbidden')
  const failures = validateAdmissionUnit(record.admissionUnit)
  if (failures.length) throw new Error(`admission_unit_invalid:${failures.join(',')}`)
  return record.admissionUnit
}

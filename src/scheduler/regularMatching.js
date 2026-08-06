export const REGULAR_TAG_VALUE = 'other'

// This is the single application-side name-key contract. The SQL migration
// defines the equivalent database function for direct data entry.
export function normalizeRegularName(value) {
  if (value === null || value === undefined) return ''

  return String(value)
    .normalize('NFKC')
    .trim()
    .replace(/\s+/gu, ' ')
    .replace(/[A-Z]/g, (letter) => letter.toLowerCase())
}

export function normalizeRegularPhoneLast4(value) {
  if (value === null || value === undefined) return ''
  return String(value).replace(/[^0-9]/g, '').slice(0, 4)
}

export function isValidRegularPhoneLast4(value) {
  return value === '' || /^[0-9]{4}$/.test(String(value))
}

export function findRegularMatch(regulars, customerName, phoneLast4) {
  const nameKey = normalizeRegularName(customerName)
  const normalizedPhone = String(phoneLast4 || '')
  if (!nameKey || !/^[0-9]{4}$/.test(normalizedPhone)) return null

  const matches = (regulars || []).filter((regular) =>
    regular
    && regular.is_active !== false
    && regular.name_key === nameKey
    && regular.phone_last4 === normalizedPhone
  )

  // The database has an active uniqueness constraint. Fail closed if a
  // malformed response nevertheless contains duplicate candidates.
  return matches.length === 1 ? matches[0] : null
}

export function applyAutomaticRegularMatch(formValues, regulars) {
  const regularTagRemoved = (formValues.tags || []).filter((tag) => tag !== REGULAR_TAG_VALUE)
  const match = findRegularMatch(regulars, formValues.customerName, formValues.phoneLast4)

  return {
    ...formValues,
    regularId: match?.id || null,
    tags: match ? [...regularTagRemoved, REGULAR_TAG_VALUE] : regularTagRemoved,
  }
}

export function reconcileRegularSelection(formValues, {
  activeRegulars,
  lookupStatus,
  identityChanged,
  manualOverride,
}) {
  if (!identityChanged || manualOverride) {
    return manualOverride ? { ...formValues, regularId: null } : formValues
  }

  // A failed or pending lookup must not erase an existing tag. The link is
  // cleared after an identity edit so an old match cannot silently survive.
  if (lookupStatus !== 'ready') return { ...formValues, regularId: null }
  return applyAutomaticRegularMatch(formValues, activeRegulars)
}

export function toggleRegularTag(formValues) {
  const tags = formValues.tags || []
  const isActive = tags.includes(REGULAR_TAG_VALUE)

  return {
    ...formValues,
    regularId: null,
    tags: isActive
      ? tags.filter((tag) => tag !== REGULAR_TAG_VALUE)
      : [...tags, REGULAR_TAG_VALUE],
  }
}

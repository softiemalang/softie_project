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

export function findRebookingMatch(reservations, customerName, phoneLast4, excludedReservationId = null) {
  const nameKey = normalizeRegularName(customerName)
  const normalizedPhone = String(phoneLast4 || '')
  if (!nameKey || !/^[0-9]{4}$/.test(normalizedPhone)) return null

  return (reservations || [])
    .filter((reservation) =>
      reservation
      && reservation.id !== excludedReservationId
      && reservation.regular_phone_last4 === normalizedPhone
      && normalizeRegularName(reservation.customer_name) === nameKey
    )
    .sort((left, right) => {
      const createdAtOrder = String(left.created_at || '').localeCompare(String(right.created_at || ''))
      return createdAtOrder || String(left.id || '').localeCompare(String(right.id || ''))
    })[0] || null
}

export function findAutomaticRegularMatch(activeRegulars, savedReservations, customerName, phoneLast4, excludedReservationId = null) {
  const regular = findRegularMatch(activeRegulars, customerName, phoneLast4)
  if (regular) return { source: 'regular', regularId: regular.id, match: regular }

  const rebooking = findRebookingMatch(savedReservations, customerName, phoneLast4, excludedReservationId)
  if (rebooking) return { source: 'rebooking', regularId: null, match: rebooking }

  return null
}

export function applyAutomaticRegularMatch(formValues, regulars, savedReservations = [], excludedReservationId = null) {
  const regularTagRemoved = (formValues.tags || []).filter((tag) => tag !== REGULAR_TAG_VALUE)
  const automaticMatch = findAutomaticRegularMatch(
    regulars,
    savedReservations,
    formValues.customerName,
    formValues.phoneLast4,
    excludedReservationId,
  )

  return {
    ...formValues,
    regularId: automaticMatch?.regularId || null,
    tags: automaticMatch ? [...regularTagRemoved, REGULAR_TAG_VALUE] : regularTagRemoved,
  }
}

export function reconcileRegularSelection(formValues, {
  activeRegulars,
  savedReservations = [],
  currentReservationId = null,
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
  return applyAutomaticRegularMatch(formValues, activeRegulars, savedReservations, currentReservationId)
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

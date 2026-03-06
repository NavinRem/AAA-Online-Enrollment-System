/**
 * Standardizes date and time formatting throughout the application.
 * Format: Full Day Month Year at Time AM/PM (e.g. 15 February 2026 at 02:30 PM)
 *
 * @param {string|object|number} dateValue - Date string, Firestore Timestamp, or number
 * @returns {string} Formatted date string or 'N/A'
 */
export const formatDate = (dateValue) => {
  if (!dateValue) return 'N/A'

  let date

  // Handle Firestore Timestamp object (with seconds and nanoseconds)
  if (dateValue && typeof dateValue === 'object' && 'seconds' in dateValue) {
    date = new Date(dateValue.seconds * 1000)
  } else {
    // Standard JS Date initialization (handles ISO strings, numbers, etc.)
    date = new Date(dateValue)
  }

  // Final check for valid date
  if (isNaN(date.getTime())) return 'N/A'

  // Format using native Internationalization API
  const datePart = date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const timePart = date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })

  return `${datePart} at ${timePart}`
}

/**
 * Standardizes date formatting throughout the application (Date only, no time).
 * Use for DOB, etc.
 * Format: Full Day Month Year (e.g. 15 February 2026)
 *
 * @param {string|object|number} dateValue - Date string, Firestore Timestamp, or number
 * @returns {string} Formatted date string or 'N/A'
 */
export const formatDateOnly = (dateValue) => {
  if (!dateValue) return 'N/A'

  let date

  // Handle Firestore Timestamp object (with seconds and nanoseconds)
  if (dateValue && typeof dateValue === 'object' && 'seconds' in dateValue) {
    date = new Date(dateValue.seconds * 1000)
  } else {
    // Standard JS Date initialization (handles ISO strings, numbers, etc.)
    date = new Date(dateValue)
  }

  // Final check for valid date
  if (isNaN(date.getTime())) return 'N/A'

  // Format using native Internationalization API
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/**
 * Calculates age from a date string, Timestamp, or number
 *
 * @param {string|object|number} dateValue - Date of birth
 * @returns {number|string} Age in years or 'N/A'
 */
export const calculateAge = (dateValue) => {
  if (!dateValue) return 'N/A'

  let date
  if (dateValue && typeof dateValue === 'object' && 'seconds' in dateValue) {
    date = new Date(dateValue.seconds * 1000)
  } else {
    date = new Date(dateValue)
  }

  if (isNaN(date.getTime())) return 'N/A'

  const today = new Date()
  let age = today.getFullYear() - date.getFullYear()
  const m = today.getMonth() - date.getMonth()

  if (m < 0 || (m === 0 && today.getDate() < date.getDate())) {
    age--
  }

  return age
}

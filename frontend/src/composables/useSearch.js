import { ref, computed } from 'vue'

/**
 * A reusable composable for handling search filtering across lists
 * @param {Ref<Array>} listRef - The reactive list (or computed list) you want to filter
 * @param {Function} customMapper - Optional function that takes an item and returns a string of all text to search against
 */
export function useSearch(listRef, customMapper = null) {
  const searchQuery = ref('')

  const searchResults = computed(() => {
    if (!searchQuery.value) return listRef.value

    const query = searchQuery.value.toLowerCase().trim()
    // Split search query into multiple keywords for more flexible "AND" matching
    const queryWords = query.split(/\s+/)

    return listRef.value.filter((item) => {
      // Helper to cleanly extract all textual values from the object recursively
      const extractValues = (obj) => {
        if (!obj) return ''
        if (typeof obj !== 'object') return String(obj)
        return Object.values(obj)
          .map((val) => {
            if (val && typeof val === 'object') return extractValues(val)
            if (val !== null && val !== undefined) return String(val)
            return ''
          })
          .join(' ')
      }

      // Collect all deeply nested text inside the row attributes
      let searchableText = extractValues(item)

      // Include the explicitly mapped data just in case
      if (customMapper) {
        searchableText += ' ' + customMapper(item)
      }

      const text = searchableText.toLowerCase()

      // Ensure the row matches at least one keyword (AND/OR logic) as requested
      return queryWords.some((word) => text.includes(word))
    })
  })

  return {
    searchQuery,
    searchResults,
  }
}

// Pre-defined Custom Mappers for specific entities

// Helper to add formatted dates to search text
const getFormattedDateString = (dateString) => {
  if (!dateString) return ''
  try {
    const d = new Date(dateString)
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  } catch {
    return dateString
  }
}

export const enrollmentSearchMapper = (r) => {
  const parent = r.parentName || r.parent_name || ''
  const student = r.studentName || r.student_name || ''
  const course = r.courseTitle || r.course_title || ''
  const session = r.sessionSchedule || ''
  const id = r.id || ''
  const paymentProof = r.paymentProof || ''
  const remark = r.remark || ''
  const status = r.status || ''
  const payStatus = r.paymentStatus || ''
  const amount = (r.amount || r.totalAmount || 0).toString()
  const dateObjStr = getFormattedDateString(r.createdAt || r.created_at)

  return `${id} ${parent} ${student} ${course} ${session} ${paymentProof} ${remark} ${status} ${payStatus} ${amount} ${dateObjStr}`
}

export const studentSearchMapper = (s) => {
  const dateObjStr = getFormattedDateString(s.createdAt || s.created_at)
  return `${s.name || s.fullName || ''} ${s.parentName || ''} ${s.studentId || ''} ${s.gender || ''} ${s.status || 'Studying'} ${dateObjStr}`
}

export const parentSearchMapper = (p) => {
  const dateObjStr = getFormattedDateString(p.createdAt || p.created_at)
  return `${p.name || ''} ${p.email || ''} ${p.phone || ''} ${p.address || ''} ${p.status || 'Active'} ${dateObjStr}`
}

export const programSearchMapper = (p) => {
  return `${p.title || p.name || ''} ${p.code || ''} ${p.category || ''} ${p.description || ''}`
}

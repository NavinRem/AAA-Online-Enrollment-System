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

    return listRef.value.filter((item) => {
      let searchableText = ''

      if (customMapper) {
        searchableText = customMapper(item)
      } else {
        // Fallback: Combine all object values into a single string
        searchableText = Object.values(item)
          .map((val) => (val !== null && val !== undefined ? String(val) : ''))
          .join(' ')
      }

      return searchableText.toLowerCase().includes(query)
    })
  })

  return {
    searchQuery,
    searchResults,
  }
}

// Pre-defined Custom Mappers for specific entities

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

  return `${id} ${parent} ${student} ${course} ${session} ${paymentProof} ${remark} ${status} ${payStatus} ${amount}`
}

export const studentSearchMapper = (s) => {
  return `${s.name || s.fullName || ''} ${s.parentName || ''} ${s.studentId || ''} ${s.gender || ''}`
}

export const parentSearchMapper = (p) => {
  return `${p.name || ''} ${p.email || ''} ${p.phone || ''} ${p.address || ''}`
}

export const programSearchMapper = (p) => {
  return `${p.title || p.name || ''} ${p.code || ''} ${p.category || ''} ${p.description || ''}`
}

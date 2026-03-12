import { ref, computed } from 'vue'

/**
 * A reusable composable for handling search filtering across lists
 * @param {Ref<Array>} listRef - The reactive list (or computed list) you want to filter
 * @param {Function} customMapper - Optional function that takes an item and returns a string of all text to search against
 */
export function useSearch(listRef, customMapper = null) {
  const searchQuery = ref('')

  const searchResults = computed(() => {
    const list = listRef.value
    if (!list) return []
    const q = searchQuery.value.toLowerCase().trim()
    if (!q) return list

    return list.filter((item) => {
      const extract = (obj) => {
        if (!obj || typeof obj !== 'object') return String(obj || '').toLowerCase()
        return Object.values(obj).map(v => typeof v === 'object' ? extract(v) : String(v || '').toLowerCase()).join(' ')
      }

      const text = `${extract(item)} ${customMapper ? customMapper(item).toLowerCase() : ''}`
      return text.includes(q)
    })
  })

  return { searchQuery, searchResults }
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

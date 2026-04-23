import { ref, computed } from 'vue'
import { formatDateOnly } from '@/utils/formatUtils'

/**
 * A reusable composable for handling search filtering across lists.
 * Optimized to use a customMapper if provided, or otherwise fallback to top-level property matching.
 */
export function useSearch(listRef, customMapper = null) {
  const searchQuery = ref('')

  const searchResults = computed(() => {
    const list = listRef.value
    if (!list || !Array.isArray(list)) return []

    const q = searchQuery.value.toLowerCase().trim()
    if (!q) return list

    return list.filter((item) => {
      // If mapper is provided, use it as the highly optimized source of search text
      if (customMapper) {
        return customMapper(item).toLowerCase().includes(q)
      }

      // Fallback: search all top-level string/number values (less efficient)
      return Object.values(item).some((v) =>
        String(v || '')
          .toLowerCase()
          .includes(q),
      )
    })
  })

  return { searchQuery, searchResults }
}

/**
 * Entity-specific Search Mappers
 */

export const enrollmentSearchMapper = (r) =>
  [
    r.id,
    r.parentName || r.parent?.name,
    r.studentName || r.student?.name,
    r.program?.name,
    r.class?.schedule,
    r.status,
    r.paymentStatus,
    r.paymentMethod,
    r.remark,
    r.amount,
    formatDateOnly(r.createdAt || r.enrollAt),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

export const studentSearchMapper = (s) =>
  [
    s.name,
    s.fullName,
    s.parentName || s.parentInfo?.name,
    s.studentId,
    s.gender,
    s.status || 'Studying',
    formatDateOnly(s.createdAt),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

export const parentSearchMapper = (p) =>
  [p.name, p.email, p.phone, p.address, p.status, formatDateOnly(p.createdAt)]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

export const programSearchMapper = (p) =>
  [
    p.title,
    p.category,
    p.description,
    p.schedule ? `${p.schedule.day} ${p.schedule.timeslot}` : '',
    p.termName || p.term,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

export const teacherSearchMapper = (t) =>
  [t.name, t.email, t.phone, t.id, t.uid].filter(Boolean).join(' ').toLowerCase()

export const branchSearchMapper = (b) =>
  [b.name, b.abbr, b.location].filter(Boolean).join(' ').toLowerCase()

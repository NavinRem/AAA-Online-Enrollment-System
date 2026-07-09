import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { formatDateOnly, formatDate } from '@/utils/formatUtils'

/**
 * A reusable composable for handling search filtering across lists.
 * Optimized to use a customMapper if provided, or otherwise fallback to top-level property matching.
 */
export function useSearch(listRef, customMapper = null) {
  const searchQuery = ref('')
  let route = null
  try {
    route = useRoute()
  } catch (e) {
    // Fallback if used outside router context
  }

  if (route) {
    watch(
      () => route.query,
      (newQuery) => {
        if (newQuery && (newQuery.search !== undefined || newQuery.q !== undefined || newQuery.id !== undefined)) {
          searchQuery.value = String(newQuery.search || newQuery.q || newQuery.id || '')
        }
      },
      { immediate: true, deep: true }
    )
  }

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
    r.parent?.name,
    r.student?.name,
    r.program?.name,
    r.program?.category,
    r.class?.branch?.abbr || r.branchAbbr,
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

export const paymentSearchMapper = (p) =>
  [
    p.id,
    p.receiptId,
    p.transactionId,
    p.parent,
    p.student,
    p.program,
    p.method,
    p.status,
    p.amount,
    formatDate(p.date),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

export const trialSearchMapper = (t) =>
  [
    t.id,
    t.student?.name,
    t.guestStudentName,
    t.guestParentName,
    t.guestParentPhone,
    t.program?.name,
    t.branch?.name,
    t.branch?.abbr,
    t.status,
    formatDate(t.trialDate),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

export const studentSearchMapper = (s) => {
  const programText = (s.enrollments || [])
    .map((r) => `${r.program?.name || ''} ${r.program?.category || ''}`)
    .join(' ')

  return [s.id, s.name, s.parentInfo?.name, s.status, programText, formatDateOnly(s.createdAt)]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

export const parentSearchMapper = (p) =>
  [p.id, p.name, p.email, p.phone, p.location, p.status, formatDateOnly(p.createdAt)]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

export const programSearchMapper = (p) =>
  [p.id, p.name, p.category, p.level, p.description, p.type].filter(Boolean).join(' ').toLowerCase()

export const teacherSearchMapper = (t) =>
  [t.name, t.email, t.phone, t.id].filter(Boolean).join(' ').toLowerCase()

export const classSearchMapper = (c) => {
  const catName =
    typeof c.program?.category === 'object' ? c.program.category.name : c.program?.category || ''
  const scheduleText = (c.schedules || [])
    .map((schedule) => `${schedule.day} ${schedule.time}`)
    .join(' ')

  return [c.id, c.program?.name, catName, c.schedule?.day, c.schedule?.time, scheduleText, c.status]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

export const branchSearchMapper = (b) =>
  [b.id, b.name, b.abbr, b.location].filter(Boolean).join(' ').toLowerCase()

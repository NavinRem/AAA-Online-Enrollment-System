<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useDataStore } from '@/stores/dataStore'
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import DataPageLayout from '@/components/layout/DataPageLayout.vue'
import DataTable from '@/components/common/data/DataTable.vue'
import DataMetricCard from '@/components/common/data/DataMetricCard.vue'
import AppBadge from '@/components/common/ui/AppBadge.vue'
import AppButton from '@/components/common/ui/AppButton.vue'
import ClassActionModal from '@/components/classes/ClassActionModal.vue'
import { classService } from '@/services/classService'
import { termService } from '@/services/termService'
import { getImageUrl, getActionIcon, getProgramProfileURL } from '@/utils/assetHelper'
import { calculateClassProgress, DEFAULT_CAPACITY } from '@/utils/formatUtils'
import { useSearch } from '@/composables/useSearch'

const router = useRouter()
const dataStore = useDataStore()
const loading = ref(true)

// Filters
const termFilter = ref('all')
const branchFilter = ref('all')
const dropdowns = ref({
  term: false,
  branch: false,
})
const filterMenuStyles = ref({})

const termOptions = computed(() => {
  return dataStore.terms
    .filter((t) => !t.isDeleted)
    .map((t) => ({
      label: t.name,
      value: t.id,
      isCurrent: t.isCurrent,
    }))
    .sort((a, b) => {
      if (a.isCurrent) return -1
      if (b.isCurrent) return 1
      return a.label.localeCompare(b.label)
    })
})

const branchOptions = computed(() => {
  return dataStore.branches
    .filter((b) => !b.isDeleted)
    .map((b) => ({
      label: b.name,
      value: b.id,
      color: b.color,
      abbr: b.abbr,
    }))
    .sort((a, b) => a.label.localeCompare(b.label))
})

const toggleDropdown = (type, event) => {
  event.stopPropagation()
  const isOpening = !dropdowns.value[type]
  // Reset all other dropdowns
  Object.keys(dropdowns.value).forEach((key) => {
    dropdowns.value[key] = false
  })
  dropdowns.value[type] = isOpening

  if (isOpening) {
    const rect = event.currentTarget.getBoundingClientRect()
    filterMenuStyles.value = {
      top: `${rect.bottom + window.scrollY + 8}px`,
      left: `${Math.min(rect.left + window.scrollX, window.innerWidth - 250)}px`,
      minWidth: '240px',
    }
  }
}

const selectFilter = (type, value) => {
  if (type === 'term') termFilter.value = value
  else if (type === 'branch') branchFilter.value = value
  dropdowns.value[type] = false
}

const getActiveLabel = (type) => {
  if (type === 'term') {
    const opt = termOptions.value.find((o) => String(o.value) === String(termFilter.value))
    return { label: opt ? opt.label : 'Select Term' }
  } else if (type === 'branch') {
    if (branchFilter.value === 'all') return { label: 'All Branches', color: 'purple' }
    const opt = branchOptions.value.find((o) => String(o.value) === String(branchFilter.value))
    return {
      label: opt ? opt.label : 'Select Branch',
      color: opt?.color || 'purple',
    }
  }
  return { label: '' }
}

const handleClickOutside = (event) => {
  if (dropdowns.value.term) {
    const btn = document.getElementById('term-filter-btn')
    if (btn && !btn.contains(event.target)) {
      dropdowns.value.term = false
    }
  }
}

onMounted(() => {
  window.addEventListener('mousedown', handleClickOutside)
  fetchClasses()
})

onUnmounted(() => {
  window.removeEventListener('mousedown', handleClickOutside)
})

const classHeaders = [
  { label: 'No', width: '50px', align: 'center' },
  { label: 'Class Identity', width: '200px' },
  { label: 'Branch', width: '150px', align: 'center' },
  { label: 'Schedule', width: '180px', align: 'center' },
  { label: 'Teachers', width: '120px', align: 'center' },
  { label: 'Enrolled', width: '100px', align: 'center' },
  { label: 'Status', width: '110px', align: 'center' },
  { label: 'Action', width: '80px', align: 'center' },
]

const fetchClasses = async () => {
  loading.value = true
  try {
    await dataStore.fetchAllCommonData(true, [
      'classes',
      'programs',
      'categories',
      'schedules',
      'terms',
      'branches',
    ])

    // Set intelligent defaults: First current term and its first branch
    if (dataStore.terms.length > 0) {
      const activeTerm = dataStore.terms.find((t) => t.isCurrent) || dataStore.terms[0]
      if (activeTerm) {
        termFilter.value = activeTerm.id
        // Set branch default if term has branches
        const termBranches = activeTerm.branchIds || []
        if (termBranches.length > 0) {
          branchFilter.value = termBranches[0]
        }
      }
    }
  } finally {
    loading.value = false
  }
}

const activeOfferings = computed(() => {
  const products = dataStore.classes || []
  const terms = dataStore.terms || []
  const results = []

  products.forEach((product) => {
    // Enrich program with latest category data for accurate profile URLs
    const liveProgram = dataStore.programs.find(
      (p) => p.id === product.programId || p.id === product.program?.id,
    )
    const category = dataStore.categories.find((c) => c.id === liveProgram?.categoryId)

    const program = liveProgram
      ? {
          ...liveProgram,
          category: {
            name: category?.name,
            profileURL: category?.profileURL,
          },
        }
      : product.program

    const termGroups = new Map()

    // Determine which terms to process based on filter
    const termsToProcess =
      termFilter.value === 'all'
        ? terms.filter((t) => t.isCurrent && !t.isDeleted)
        : terms.filter((t) => String(t.id) === String(termFilter.value) && !t.isDeleted)

    // Fallback: If 'all' (Auto) yields no terms, show the most recent available term
    if (termFilter.value === 'all' && termsToProcess.length === 0 && terms.length > 0) {
      const fallback = terms.find((t) => !t.isDeleted)
      if (fallback) termsToProcess.push(fallback)
    }

    termsToProcess.forEach((term) => {
      let termOfferings = (term.offerings || []).filter(
        (o) => String(o.classId) === String(product.id),
      )

      // Apply Branch Filter if not 'all'
      if (branchFilter.value !== 'all') {
        termOfferings = termOfferings.filter(
          (o) => String(o.branchId) === String(branchFilter.value),
        )
      }

      if (termOfferings.length > 0) {
        const branchesMap = new Map()
        const schedulesMap = new Map()
        let totalEnrolled = 0

        termOfferings.forEach((off) => {
          if (off.branch) {
            branchesMap.set(off.branch.id || off.branchId, off.branch)
          } else if (off.branchId) {
            const b = dataStore.branches.find((x) => String(x.id) === String(off.branchId))
            if (b) branchesMap.set(b.id, b)
          }

          const schedId = off.schedule?.id || off.scheduleId
          if (schedId) {
            const productSchedule = (product.schedules || []).find(
              (ps) => String(ps.id) === String(schedId),
            )
            const globalSchedule = dataStore.schedules.find((x) => String(x.id) === String(schedId))

            const capacity =
              Number(productSchedule?.capacity) ||
              Number(off.capacity) ||
              Number(off.schedule?.capacity) ||
              Number(program?.capacity) ||
              DEFAULT_CAPACITY

            const existing = schedulesMap.get(schedId)
            const newTeachers = off.teachers || []

            // Merge teachers correctly: Add only if not already present
            const mergedTeachers = existing
              ? [
                  ...existing.teachers,
                  ...newTeachers.filter((nt) => !existing.teachers.some((et) => et.id === nt.id)),
                ]
              : [...newTeachers]

            const schedData = {
              ...(off.schedule || globalSchedule || existing || {}),
              status:
                existing?.status === 'active' || getOfferingStatus(off) === 'active'
                  ? 'active'
                  : getOfferingStatus(off),
              currentCount: (existing?.currentCount || 0) + (off.currentCount || 0),
              capacity: existing ? existing.capacity : capacity,
              teachers: mergedTeachers,
            }

            // If merging all branches, we sum the capacity for the global overview
            if (existing && branchFilter.value === 'all') {
              schedData.capacity = existing.capacity + capacity
            }

            schedulesMap.set(schedId, schedData)
          }
          totalEnrolled += off.currentCount || 0
        })

        if (branchesMap.size === 0 && term.branchIds) {
          term.branchIds.forEach((bid) => {
            const b = dataStore.branches.find((x) => String(x.id) === String(bid))
            if (b) branchesMap.set(b.id, b)
          })
        }

        const schedules = Array.from(schedulesMap.values()).sort((a, b) => {
          const dayOrder = {
            Monday: 1,
            Tuesday: 2,
            Wednesday: 3,
            Thursday: 4,
            Friday: 5,
            Saturday: 6,
            Sunday: 7,
          }
          const dayA = dayOrder[a.day] || 99
          const dayB = dayOrder[b.day] || 99
          if (dayA !== dayB) return dayA - dayB
          return (a.time || '').localeCompare(b.time || '')
        })

        const totalCapacity = schedules.reduce((sum, s) => sum + (s.capacity || 0), 0)

        const branches = Array.from(branchesMap.values())
        const branchesText = branches.map((b) => `${b.abbr} ${b.name}`).join(' ')
        const schedulesText = schedules.map((s) => `${s.day} ${s.time}`).join(' ')

        termGroups.set(term.id, {
          id: `group-${product.id}-${term.id}`,
          classProduct: product,
          program,
          branches,
          schedules,
          currentCount: totalEnrolled,
          capacity: totalCapacity,
          termStartDate: term.startDate,
          termEndDate: term.endDate,
          termName: term.name,
          termId: term.id,
          offeringId: termOfferings[0]?.offeringId,
          offeringIds: termOfferings.map((o) => o.offeringId),
          status: getOfferingStatus({
            termStartDate: term.startDate,
            termEndDate: term.endDate,
            currentCount: totalEnrolled,
            capacity: totalCapacity || program?.capacity || DEFAULT_CAPACITY,
          }),
          // Pre-calculate search text for performance
          searchText: [product.program?.name, branchesText, schedulesText, term.name]
            .filter(Boolean)
            .join(' ')
            .toLowerCase(),
        })
      }
    })

    if (termGroups.size === 0) {
      results.push({
        id: `catalog-${product.id}`,
        classProduct: product,
        program, // Use enriched program
        scheduleIds: product.scheduleIds,
        branches: [],
        currentCount: 0,
        status: 'upcoming',
        termName: 'In Catalog',
      })
    } else {
      results.push(...Array.from(termGroups.values()))
    }
  })

  return results.sort((a, b) => {
    // Primary sort: Newest created/updated first
    const dateA = new Date(a.classProduct?.createdAt || a.termStartDate || 0)
    const dateB = new Date(b.classProduct?.createdAt || b.termStartDate || 0)
    if (dateB - dateA !== 0) return dateB - dateA

    // Secondary sort: Status
    if (a.status === 'upcoming' && b.status !== 'upcoming') return 1
    if (a.status !== 'upcoming' && b.status === 'upcoming') return -1

    return 0
  })
})

const getSchedules = (item) => {
  let list = []
  if (item.schedules) list = item.schedules
  else if (item.schedule) list = [item.schedule]
  else if (item.scheduleIds) {
    list = (item.scheduleIds || [])
      .map((id) => dataStore.schedules.find((s) => s.id === id))
      .filter(Boolean)
  }

  // Calculate status for each schedule and sort
  const dayOrder = {
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
    Saturday: 6,
    Sunday: 7,
  }
  const capacity = item.capacity || item.program?.capacity || DEFAULT_CAPACITY
  const isFull = (item.currentCount || 0) >= capacity

  return [...list]
    .map((s) => {
      // Create a shallow copy to prevent mutation of store objects
      const sched = { ...s }

      // Ensure we have the latest capacity from the product definition if it's missing (common for catalog items)
      const schedId = sched.id
      const productSchedule = (item.classProduct?.schedules || []).find(
        (ps) => String(ps.id) === String(schedId),
      )
      const finalCapacity =
        sched.capacity || productSchedule?.capacity || item.program?.capacity || DEFAULT_CAPACITY

      // Save status back to the cloned schedule object (context-aware)
      if (isFull || (sched.currentCount || 0) >= finalCapacity) {
        sched.status = 'full'
      } else if (!sched.status) {
        const progress = calculateClassProgress(
          item.termStartDate,
          item.termEndDate,
          sched.day,
          sched.time,
        )
        sched.status = progress.status
      }

      return {
        ...sched,
        capacity: finalCapacity,
      }
    })
    .sort((a, b) => {
      const dayA = dayOrder[a.day] || 99
      const dayB = dayOrder[b.day] || 99
      if (dayA !== dayB) return dayA - dayB
      return (a.time || '').localeCompare(b.time || '')
    })
}

const getScheduleStatus = (sched, item) => {
  if (!item.termStartDate) return 'upcoming'
  return sched.status || 'active'
}

const { searchQuery, searchResults } = useSearch(activeOfferings, (o) => {
  return o.searchText || ''
})

const currentPage = ref(1)
const pageSize = 10

const totalItems = computed(() => searchResults.value.length)
const paginatedResults = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  const end = start + pageSize
  return searchResults.value.slice(start, end)
})

watch(searchQuery, () => {
  currentPage.value = 1
})

const getOfferingStatus = (offering) => {
  if (offering.status === 'upcoming') return 'upcoming'
  const capacity = offering.capacity || offering.program?.capacity || DEFAULT_CAPACITY
  if ((offering.currentCount || 0) >= capacity) return 'full'

  const now = new Date()
  const start = new Date(offering.termStartDate)
  const end = new Date(offering.termEndDate)
  if (now >= start && now <= end) return 'ongoing'

  return 'active'
}

const statsCards = computed(() => {
  const activeTerms =
    termFilter.value === 'all'
      ? dataStore.terms.filter((t) => t.isCurrent)
      : dataStore.terms.filter((t) => String(t.id) === String(termFilter.value))

  let activeOfferingsList = activeOfferings.value.filter((o) => !o.id.startsWith('catalog-'))

  // Scoped stats by branch if filter active
  if (branchFilter.value !== 'all') {
    // activeOfferings already filtered by branch, so we just use it
  }

  const totalEnrolled = activeOfferingsList.reduce((sum, o) => sum + (o.currentCount || 0), 0)

  return [
    {
      label: 'Active Classes',
      value: activeOfferingsList.length,
      image: getImageUrl('programs/active-program'),
    },
    {
      label: 'Active Enrollments',
      value: totalEnrolled,
      image: getImageUrl('enrollment/total-enrollment'),
    },
    {
      label: 'Catalog Items',
      value: activeOfferings.value.length - activeOfferingsList.length,
      image: getImageUrl('programs/total-program'),
    },
    {
      label: 'Current Term',
      value: activeTerms.length > 0 ? activeTerms.map((t) => t.name).join(', ') : 'None',
      image: getImageUrl('programs/active-program'),
    },
  ]
})

const modal = ref({
  isOpen: false,
  type: 'add',
  classItem: null,
  context: null, // { termId, offeringId, scheduleId, etc }
  loading: false,
  error: '',
  success: '',
})

const openAddModal = () => {
  modal.value = {
    isOpen: true,
    type: 'add',
    classItem: null,
    context: null,
    loading: false,
    error: '',
    success: '',
  }
}

const closeModal = () => {
  modal.value.isOpen = false
  modal.value.error = ''
  modal.value.success = ''
}

const handleAction = (type, item, context = null) => {
  modal.value = {
    isOpen: true,
    type,
    classItem: item,
    context,
    loading: false,
    error: '',
    success: '',
  }
}

const handleModalSubmit = async (payload) => {
  modal.value.loading = true
  modal.value.error = ''
  try {
    if (modal.value.type === 'add') {
      await classService.createClass(payload)
    } else if (modal.value.type === 'edit') {
      if (modal.value.context?.termId && modal.value.context?.offeringId) {
        // Mode: Update specific offering within a term
        await termService.updateTermOffering(
          modal.value.context.termId,
          modal.value.context.offeringId,
          payload,
        )
      } else {
        // Mode: Update global class product
        await classService.updateClass(modal.value.classItem.id, payload)
      }
    } else if (modal.value.type === 'delete') {
      await classService.deleteClass(modal.value.classItem.id)
    }

    modal.value.success = 'Operation successful'
    await fetchClasses()
    setTimeout(closeModal, 1000)
  } catch (error) {
    modal.value.error = error.message || 'Class action failed'
  } finally {
    modal.value.loading = false
  }
}

const navigateToDetail = (item) => {
  const classId = item.classProduct?.id || item.classId
  if (classId) router.push(`/classes/${classId}`)
}
</script>

<template>
  <DashboardLayout>
    <DataPageLayout overviewTitle="Class Overview">
      <template #overview>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <DataMetricCard
            v-for="stat in statsCards"
            :key="stat.label"
            v-bind="stat"
            :loading="loading"
          />
        </div>
      </template>

      <template #table>
        <DataTable
          title="Class List"
          :headers="classHeaders"
          :items="paginatedResults"
          :loading="loading"
          entityName="class"
          :flexible="true"
          v-model:searchQuery="searchQuery"
          searchPlaceholder="Search class..."
          :hasPagination="true"
          :currentPage="currentPage"
          :pageSize="pageSize"
          :totalItems="totalItems"
          @update:currentPage="currentPage = $event"
          @row-click="navigateToDetail"
        >
          <template #toolbar-actions>
            <div class="flex items-center gap-3">
              <!-- Term Filter -->
              <div class="relative" id="term-filter-btn">
                <AppButton
                  variant="secondary"
                  size="md"
                  @click="toggleDropdown('term', $event)"
                  class="!bg-magenta"
                >
                  <img
                    :src="getActionIcon('filter')"
                    class="w-4 h-4 brightness-0 invert opacity-80 group-hover:opacity-100"
                  />
                  <span class="text-white font-bold tracking-tight">{{
                    getActiveLabel('term').label
                  }}</span>
                  <span class="text-white ml-2 text-xs opacity-60 group-hover:opacity-100">▼</span>
                </AppButton>
                <Teleport to="body">
                  <transition
                    enter-active-class="transition duration-200 ease-out"
                    enter-from-class="transform scale-95 opacity-0"
                    enter-to-class="transform scale-100 opacity-100"
                    leave-active-class="transition duration-150 ease-in"
                    leave-from-class="opacity-100"
                    leave-to-class="opacity-0"
                  >
                    <div
                      v-if="dropdowns.term"
                      class="toolbar-filter-menu"
                      :style="filterMenuStyles"
                      @mousedown.stop
                    >
                      <div
                        v-for="opt in termOptions"
                        :key="opt.value"
                        class="toolbar-filter-option"
                        :class="{ 'active-filter-item': String(termFilter) === String(opt.value) }"
                        @click="selectFilter('term', opt.value)"
                      >
                        {{ opt.label }}
                      </div>
                    </div>
                  </transition>
                </Teleport>
              </div>

              <!-- Branch Filter -->
              <div class="relative" id="branch-filter-btn">
                <AppButton
                  :variant="branchFilter === 'all' ? 'secondary' : 'ghost'"
                  size="md"
                  @click="toggleDropdown('branch', $event)"
                  class="rounded-xl transition-all duration-300 group"
                  :class="{
                    '!text-white shadow-md': branchFilter !== 'all',
                    '!text-content-dark bg-primary-light shadow-sm': branchFilter === 'all',
                  }"
                  :style="
                    branchFilter !== 'all'
                      ? { backgroundColor: `var(--color-${getActiveLabel('branch').color})` }
                      : {}
                  "
                >
                  <img
                    :src="getActionIcon('branch')"
                    class="w-4 h-4 brightness-0 transition-all opacity-80 group-hover:opacity-100"
                    :class="{ invert: branchFilter !== 'all' }"
                  />
                  <span
                    class="font-bold tracking-tight"
                    :class="{ 'text-white': branchFilter !== 'all' }"
                    >{{ getActiveLabel('branch').label }}</span
                  >
                  <span
                    class="ml-2 text-xs opacity-60 group-hover:opacity-100"
                    :class="{ 'text-white': branchFilter !== 'all' }"
                    >▼</span
                  >
                </AppButton>
                <Teleport to="body">
                  <transition
                    enter-active-class="transition duration-200 ease-out"
                    enter-from-class="transform scale-95 opacity-0"
                    enter-to-class="transform scale-100 opacity-100"
                    leave-active-class="transition duration-150 ease-in"
                    leave-from-class="opacity-100"
                    leave-to-class="opacity-0"
                  >
                    <div
                      v-if="dropdowns.branch"
                      class="toolbar-filter-menu"
                      :style="filterMenuStyles"
                      @mousedown.stop
                    >
                      <div
                        class="toolbar-filter-option flex items-center justify-between gap-4"
                        :class="{ 'active-filter-item': branchFilter === 'all' }"
                        @click="selectFilter('branch', 'all')"
                      >
                        <div class="flex items-center gap-3">
                          <AppBadge status="ALL" type="gray" size="sm" class="w-12 text-center" />
                          <span>All Branches</span>
                        </div>
                      </div>
                      <div
                        v-for="opt in branchOptions"
                        :key="opt.value"
                        class="toolbar-filter-option flex items-center justify-between gap-4"
                        :class="{
                          'active-filter-item': String(branchFilter) === String(opt.value),
                        }"
                        @click="selectFilter('branch', opt.value)"
                      >
                        <div class="flex items-center gap-3">
                          <AppBadge
                            :status="opt.abbr"
                            :type="opt.color"
                            size="sm"
                            class="w-12 text-center"
                          />
                          <span class="truncate">{{ opt.label }}</span>
                        </div>
                        <span v-if="String(branchFilter) === String(opt.value)" class="text-xs"
                          >✓</span
                        >
                      </div>
                    </div>
                  </transition>
                </Teleport>
              </div>

              <AppButton
                variant="primary"
                size="md"
                class="rounded-xl shadow-lg shadow-primary/20"
                @click="openAddModal"
              >
                <img :src="getActionIcon('plus')" class="w-4 h-4 brightness-0 invert" />
                <span class="font-bold tracking-tight">Add Class</span>
              </AppButton>
            </div>
          </template>

          <template
            #row="{
              item,
              index,
              headers,
              toggleMenu,
              activeMenuId,
              isMenuAbove,
              menuStyles,
              closeMenu,
            }"
          >
            <td class="ui-cell text-center" :style="{ width: headers[0].width }">
              {{ index + 1 }}
            </td>

            <td class="ui-cell" :style="{ width: headers[1].width }">
              <div class="flex items-center gap-4">
                <div
                  class="w-9 h-9 rounded-full overflow-hidden ring-2 ring-white/80 shadow-sm bg-surface-subtle p-1.5"
                >
                  <img
                    :src="
                      getProgramProfileURL(
                        item.program?.profileURL,
                        item.program?.category?.name || item.program?.category,
                        item.program?.category?.profileURL,
                      )
                    "
                    class="w-full h-full object-contain"
                  />
                </div>
                <div class="flex flex-col">
                  <span class="leading-tight">{{ item.program?.name }}</span>
                  <span class="mt-0.5 text-xs font-semibold text-content-muted">
                    {{ item.termName }}
                  </span>
                </div>
              </div>
            </td>

            <td class="ui-cell text-center" :style="{ width: headers[2].width }">
              <div class="flex flex-col items-center justify-center py-6">
                <div
                  v-if="item.branches && item.branches.length > 0"
                  class="flex flex-wrap gap-lg justify-center items-center"
                >
                  <AppBadge
                    v-for="b in item.branches"
                    :key="b.id || b.abbr"
                    :status="b.abbr"
                    :type="b.color || 'neutral'"
                  />
                </div>
                <div v-else class="flex flex-col items-center justify-center h-8">
                  <span class="text-content-muted text-xs font-bold italic">Empty</span>
                </div>
              </div>
            </td>

            <td class="ui-cell text-center" :style="{ width: headers[3].width }">
              <div class="flex flex-col items-center justify-center gap-4 py-6">
                <div
                  v-for="sched in getSchedules(item)"
                  :key="sched.id || `${sched.day}-${sched.time}`"
                  class="flex flex-col items-center justify-center h-10 bg-primary-light group-hover:bg-primary/30 p-lg rounded-sm"
                >
                  <div class="flex flex-col items-center">
                    <span class="text-xs font-bold leading-none">{{ sched.day }}</span>
                    <span
                      class="text-3xs font-semibold text-content-muted mt-1 leading-none tabular-nums"
                      >{{ sched.time }}</span
                    >
                  </div>
                </div>
              </div>
            </td>

            <td class="ui-cell text-center" :style="{ width: headers[4].width }">
              <div class="flex flex-col items-center justify-center gap-4 py-6">
                <div
                  v-for="sched in getSchedules(item)"
                  :key="sched.id || `${sched.day}-${sched.time}`"
                  class="h-10 flex items-center justify-center"
                >
                  <!-- Teacher Avatar Stack -->
                  <div v-if="sched.teachers && sched.teachers.length > 0" class="flex -space-x-2">
                    <div
                      v-for="teacher in sched.teachers.slice(0, 3)"
                      :key="teacher.id"
                      class="w-8 h-8 rounded-full border-2 border-white overflow-hidden shadow-sm bg-surface-subtle group-hover:scale-110 transition-transform"
                      :title="teacher.name"
                    >
                      <img
                        :src="teacher.profileURL || getImageUrl('profiles/avatar-teacher-man')"
                        class="w-full h-full object-cover"
                      />
                    </div>
                    <div
                      v-if="sched.teachers.length > 3"
                      class="w-8 h-8 rounded-full border-2 border-white bg-primary-soft flex items-center justify-center text-4xs font-black text-primary shadow-sm"
                    >
                      +{{ sched.teachers.length - 3 }}
                    </div>
                  </div>
                  <span v-else class="text-4xs font-bold text-content-muted/30 italic"
                    >No teacher</span
                  >
                </div>
              </div>
            </td>

            <td class="ui-cell text-center" :style="{ width: headers[5].width }">
              <div class="flex flex-col items-center justify-center gap-4 py-6">
                <div
                  v-for="sched in getSchedules(item)"
                  :key="sched.id || `${sched.day}-${sched.time}`"
                  class="flex flex-col items-center justify-center h-10"
                >
                  <AppBadge
                    :status="`${sched.currentCount || 0} / ${sched.capacity}`"
                    type="blue"
                  />
                </div>
              </div>
            </td>

            <td class="ui-cell text-center" :style="{ width: headers[6].width }">
              <div class="flex flex-col items-center justify-center gap-4 py-6">
                <div
                  v-for="sched in getSchedules(item)"
                  :key="sched.id || `${sched.day}-${sched.time}`"
                  class="flex items-center justify-center h-10"
                >
                  <AppBadge :status="sched.status || 'upcoming'" />
                </div>
              </div>
            </td>

            <td class="ui-cell text-center" :style="{ width: headers[7].width }">
              <div class="ui-action-menu">
                <button
                  class="w-8 h-8 flex items-center justify-center hover:bg-surface-subtle rounded-lg transition-all text-content-muted hover:text-content-dark"
                  @click.stop="toggleMenu($event, item.id)"
                >
                  <span class="font-bold text-lg leading-none mb-1">⋮</span>
                </button>

                <Teleport to="body">
                  <transition
                    enter-active-class="transition duration-200 ease-out"
                    enter-from-class="transform scale-95 opacity-0"
                    enter-to-class="transform scale-100 opacity-100"
                    leave-active-class="transition duration-150 ease-in"
                    leave-from-class="opacity-100"
                    leave-to-class="opacity-0"
                  >
                    <div
                      v-if="activeMenuId === item.id"
                      class="ui-dropdown-menu"
                      :class="{ 'origin-bottom': isMenuAbove, 'origin-top': !isMenuAbove }"
                      :style="menuStyles"
                      @click.stop
                    >
                      <button
                        class="ui-dropdown-item ui-dropdown-item-info group"
                        @click="
                          () => {
                            handleAction('edit', item.classProduct, {
                              termId: item.termId,
                              offeringId: item.offeringId,
                              termName: item.termName,
                              offeringIds: item.offeringIds,
                            })
                            closeMenu()
                          }
                        "
                      >
                        <img
                          :src="getActionIcon('edit')"
                          class="w-4 h-4 opacity-40 group-hover:opacity-100"
                        />
                        <span>Edit Current Term</span>
                      </button>
                      <button
                        class="ui-dropdown-item ui-dropdown-item-info group"
                        @click="
                          () => {
                            handleAction('edit', item.classProduct)
                            closeMenu()
                          }
                        "
                      >
                        <img
                          :src="getActionIcon('edit')"
                          class="w-4 h-4 opacity-40 group-hover:opacity-100"
                        />
                        <span>Edit Master Settings</span>
                      </button>
                      <div class="h-px bg-surface-light mx-1 my-1"></div>
                      <button
                        class="ui-dropdown-item ui-dropdown-item-danger group font-bold tracking-tighter"
                        @click="
                          () => {
                            handleAction('delete', item.classProduct)
                            closeMenu()
                          }
                        "
                      >
                        <img
                          :src="getActionIcon('delete')"
                          class="w-4 h-4 opacity-40 group-hover:opacity-100"
                        />
                        Delete
                      </button>
                    </div>
                  </transition>
                </Teleport>
              </div>
            </td>
          </template>
        </DataTable>
      </template>
    </DataPageLayout>
  </DashboardLayout>

  <ClassActionModal
    v-if="modal.isOpen"
    :isOpen="modal.isOpen"
    :type="modal.type"
    :classInstance="modal.classItem"
    :loading="modal.loading"
    :error="modal.error"
    :success="modal.success"
    @close="closeModal"
    @submit="handleModalSubmit"
    @clear-error="modal.error = ''"
    @clear-success="modal.success = ''"
  />
</template>

<style scoped>
.toolbar-filter-menu,
.ui-dropdown-menu {
  @apply fixed bg-white rounded-md shadow-2xl border border-outline-std z-dropdown p-xs min-w-60 max-h-80 overflow-y-auto;
}

.toolbar-filter-option,
.ui-dropdown-item {
  @apply px-md py-sm text-sm font-semibold cursor-pointer transition-all rounded-sm select-none flex items-center gap-2;
}

.toolbar-filter-option:hover,
.ui-dropdown-item:hover {
  @apply bg-surface-subtle text-primary;
}

.active-filter-item {
  @apply bg-primary text-white hover:bg-primary hover:text-white !important;
}

.ui-dropdown-item-danger:hover {
  @apply bg-error-soft text-error !important;
}
</style>

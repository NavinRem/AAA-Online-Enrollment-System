<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDataStore } from '@/stores/dataStore'
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import DetailPageLayout from '@/components/layout/DetailPageLayout.vue'
import AppBadge from '@/components/common/ui/AppBadge.vue'
import DataTable from '@/components/common/data/DataTable.vue'
import DetailMetricCard from '@/components/common/data/DetailMetricCard.vue'
import { termService } from '@/services/termService'
import { getImageUrl, getActionIcon, getProgramProfileURL } from '@/utils/assetHelper'
import { formatPrice, formatShortDate, calculateClassProgress } from '@/utils/formatUtils'
import TermActionModal from '@/components/terms/TermActionModal.vue'
import TermOfferingActionModal from '@/components/terms/TermOfferingActionModal.vue'
import AppButton from '@/components/common/ui/AppButton.vue'
import { useSearch, classSearchMapper, studentSearchMapper } from '@/composables/useSearch'

const route = useRoute()
const router = useRouter()
const dataStore = useDataStore()

const loading = ref(true)
const errorMessage = ref('')
const term = ref(null)
const branches = ref([])
const activeBranchId = ref(null)
const activeSubTab = ref('classes') // 'classes' or 'students'

const initData = async () => {
  const id = route.params.id
  loading.value = true
  errorMessage.value = ''

  try {
    const [tData] = await Promise.all([
      termService.getTerm(id),
      dataStore.fetchBranches(),
      dataStore.fetchTrials(),
      dataStore.fetchEnrollments(),
      dataStore.fetchStudents(),
      dataStore.fetchPrograms()
    ])

    term.value = tData.data || tData
    branches.value = dataStore.branches

    if (term.value.branchIds && term.value.branchIds.length > 0) {
      activeBranchId.value = term.value.branchIds[0]
    }
  } catch (err) {
    console.error('Error fetching term details:', err)
    errorMessage.value = 'Failed to load term details'
  } finally {
    loading.value = false
  }
}

onMounted(initData)

const termBranches = computed(() => {
  if (!term.value || !branches.value.length) return []
  return term.value.branchIds.map(id => branches.value.find(b => b.id === id)).filter(Boolean)
})

const activeBranch = computed(() => {
  return branches.value.find(b => b.id === activeBranchId.value)
})

const activeBranchSetting = computed(() => {
  if (!term.value || !activeBranchId.value || !term.value.branchSettings) return null
  return term.value.branchSettings.find(s => s.branchId === activeBranchId.value)
})

const rawBranchOfferings = computed(() => {
  if (!term.value || !activeBranchId.value) return []

  // Filter offerings belonging to the active branch
  const rawOfferings = (term.value.offerings || []).filter(o =>
    String(o.branchId) === String(activeBranchId.value)
  )

  return rawOfferings.map(off => {
    // Enrich with latest program data from store if available
    const liveProgram = dataStore.programs.find(p => p.id === off.program?.id || p.id === off.classId)
    const program = liveProgram || off.program

    // Map student IDs to student objects from store
    const students = (off.studentIds || []).map(sid => {
      const student = dataStore.students.find(s => String(s.id) === String(sid))
      if (!student) return null

      // Find the specific enrollment for metadata (payment status, etc.)
      const enrollment = dataStore.enrollments.find(e =>
        String(e.studentId) === String(sid) &&
        String(e.termId) === String(term.value.id) &&
        (String(e.termOfferingId) === String(off.offeringId) || String(e.classId) === String(off.classId))
      )

      return {
        ...student,
        paymentStatus: enrollment?.paymentStatus || 'unpaid',
        status: enrollment?.status || 'active',
        enrollmentId: enrollment?.id,
        revenue: enrollment?.finalPrice || enrollment?.totalPrice || 0
      }
    }).filter(Boolean)

    return {
      ...off,
      program,
      students,
      currentCount: students.length,
      revenue: students.reduce((sum, s) => sum + (s.revenue || 0), 0)
    }
  })
})

const groupedBranchOfferings = computed(() => {
  const map = new Map()
  rawBranchOfferings.value.forEach(off => {
    const classId = off.classId || off.program?.id
    if (!map.has(classId)) {
      map.set(classId, {
        id: `group-${classId}`,
        classId: classId,
        program: off.program,
        schedules: [],
        totalRevenue: 0,
        status: off.status || 'active'
      })
    }
    const group = map.get(classId)
    group.schedules.push({
      ...off.schedule,
      currentCount: off.currentCount,
      status: off.status || 'active',
      offeringId: off.offeringId,
      revenue: off.revenue || 0
    })
    group.totalRevenue += (off.revenue || 0)
  })

  const dayOrder = { 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6, 'Sunday': 7 }

  const groups = Array.from(map.values())
  groups.forEach(g => {
    g.schedules.sort((a, b) => {
      const dayA = dayOrder[a.day] || 99
      const dayB = dayOrder[b.day] || 99
      if (dayA !== dayB) return dayA - dayB
      return (a.time || '').localeCompare(b.time || '')
    })
  })

  return groups.sort((a, b) => (a.program?.name || '').localeCompare(b.program?.name || ''))
})

const branchStudents = computed(() => {
  const studentMap = new Map()
  rawBranchOfferings.value.forEach(offering => {
    ; (offering.students || []).forEach(s => {
      if (!studentMap.has(s.id || s.studentId)) {
        studentMap.set(s.id || s.studentId, {
          ...s,
          offeringName: `${offering.program?.name || 'Program'} - ${offering.schedule?.day || ''} ${offering.schedule?.time || ''}`
        })
      }
    })
  })
  return Array.from(studentMap.values())
})



const branchTrials = computed(() => {
  if (!term.value || !activeBranchId.value) return []

  const setting = activeBranchSetting.value || term.value
  const startDate = new Date(setting.startDate)
  const endDate = new Date(setting.endDate)

  // Trials that belong to this branch and fall within the term's date range
  return dataStore.trials.filter(t => {
    const isSameBranch = t.branchId === activeBranchId.value
    const trialDate = new Date(t.trialDate)
    return isSameBranch && trialDate >= startDate && trialDate <= endDate
  })
})

const branchDisplayData = computed(() => {
  if (!term.value) return null
  const setting = activeBranchSetting.value || term.value
  const progress = calculateClassProgress(setting.startDate, setting.endDate)
  return {
    status: progress.status,
    startDate: setting.startDate,
    endDate: setting.endDate
  }
})

// Search & Filtering for Classes
const classCurrentPage = ref(1)
const classPageSize = ref(10)
const classFilter = ref('all')
const { searchQuery: classSearchQuery, searchResults: classSearchResults } = useSearch(groupedBranchOfferings, classSearchMapper)

const classFilterOptions = computed(() => {
  const options = [{ label: 'All Programs', value: 'all', image: getActionIcon('filter') }]
  const programsInBranch = new Map()
  groupedBranchOfferings.value.forEach(g => {
    if (g.program?.name && !programsInBranch.has(g.program.name)) {
      programsInBranch.set(g.program.name, g.program)
    }
  })
  Array.from(programsInBranch.keys()).sort().forEach(name => {
    const p = programsInBranch.get(name)
    options.push({
      label: name,
      value: name,
      image: getProgramProfileURL(p.profileURL, p.category?.name || p.category, p.category?.profileURL)
    })
  })

  // Days Section
  options.push({ isDivider: true })
  options.push({ isHeader: true, label: 'Filter by Day' })
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  const dayColors = {
    'Monday': 'blue',
    'Tuesday': 'magenta',
    'Wednesday': 'green',
    'Thursday': 'orange',
    'Friday': 'purple',
    'Saturday': 'blue',
    'Sunday': 'red'
  }
  const daysInBranch = new Set()
  groupedBranchOfferings.value.forEach(g => {
    (g.schedules || []).forEach(s => {
      if (s.day) daysInBranch.add(s.day)
    })
  })

  days.forEach(day => {
    if (daysInBranch.has(day)) {
      options.push({
        label: `${day} Classes`,
        value: `day-${day}`,
        color: dayColors[day] || 'blue',
        image: getActionIcon('calendar')
      })
    }
  })

  return options
})

const filteredClasses = computed(() => {
  let list = classSearchResults.value
  if (classFilter.value !== 'all') {
    if (classFilter.value.startsWith('day-')) {
      const targetDay = classFilter.value.replace('day-', '')
      // Show only programs with schedules on that day
      list = list.filter(c => (c.schedules || []).some(s => s.day === targetDay))
      // Filter the schedules within each program to only show the selected day
      list = list.map(item => {
        const daySchedules = item.schedules.filter(s => s.day === targetDay)
        return {
          ...item,
          schedules: daySchedules,
          totalRevenue: daySchedules.reduce((sum, s) => sum + (s.revenue || 0), 0)
        }
      })
    } else {
      list = list.filter(c => c.program?.name === classFilter.value)
    }
  }
  return list
})

const paginatedClasses = computed(() => {
  const start = (classCurrentPage.value - 1) * classPageSize.value
  return filteredClasses.value.slice(start, start + classPageSize.value)
})

// Search & Filtering for Students
const studentCurrentPage = ref(1)
const studentPageSize = ref(10)
const studentFilter = ref('all')
const { searchQuery: studentSearchQuery, searchResults: studentSearchResults } = useSearch(branchStudents, studentSearchMapper)

const studentFilterOptions = [
  { label: 'All Students', value: 'all' },
  { label: 'Active', value: 'active', color: 'green' },
  { label: 'Inactive', value: 'inactive', color: 'red' },
  { label: 'Paid', value: 'paid', color: 'blue' },
  { label: 'Unpaid', value: 'unpaid', color: 'yellow' }
]

const filteredStudents = computed(() => {
  let list = studentSearchResults.value
  if (studentFilter.value !== 'all') {
    if (studentFilter.value === 'paid' || studentFilter.value === 'unpaid') {
      list = list.filter(s => s.paymentStatus === studentFilter.value)
    } else {
      list = list.filter(s => s.status === studentFilter.value)
    }
  }
  return list
})

const paginatedStudents = computed(() => {
  const start = (studentCurrentPage.value - 1) * studentPageSize.value
  return filteredStudents.value.slice(start, start + studentPageSize.value)
})

const statsCards = computed(() => {
  if (!term.value) return []

  const offerings = rawBranchOfferings.value
  const students = branchStudents.value
  const revenue = offerings.reduce((sum, o) => sum + (o.revenue || 0), 0)

  return [
    {
      label: 'Total Classes',
      value: offerings.length,
      image: getImageUrl('data-metric-card/total-enrolled'),
    },
    {
      label: 'Enrolled Students',
      value: students.length,
      image: getImageUrl('data-metric-card/total-enrolled'),
    },
    {
      label: 'Term Revenue',
      value: `$${formatPrice(revenue)}`,
      image: getImageUrl('data-metric-card/program-revenue'),
    },
    {
      label: 'Total Trials',
      value: branchTrials.value.length,
      image: getImageUrl('enrollment/total-enrollment'),
    }
  ]
})

const classHeaders = [
  { label: 'No', width: '50px', align: 'center' },
  { label: 'Class Identity' },
  { label: 'Schedule', width: '200px', align: 'center' },
  { label: 'Enrolled', align: 'center', width: '100px' },
  { label: 'Revenue', align: 'center', width: '130px' },
  { label: 'Status', align: 'center', width: '110px' },
  { label: 'Action', align: 'center', width: '80px' }
]

const studentHeaders = [
  { label: 'No', width: '50px', align: 'center' },
  { label: 'Student Identity' },
  { label: 'Enrolled Class' },
  { label: 'Payment', align: 'center', width: '120px' },
  { label: 'Status', align: 'center', width: '120px' },
]

const modal = ref({
  isOpen: false,
  type: 'edit',
  loading: false,
  error: '',
  success: '',
})

const openModal = (type) => {
  modal.value.type = type
  modal.value.isOpen = true
}

const addClassModal = ref({
  isOpen: false,
  loading: false,
  error: '',
  success: ''
})

const handleAddClass = async (payload) => {
  addClassModal.value.loading = true
  addClassModal.value.error = ''
  try {
    await termService.updateTerm(term.value.id, { newOfferingsRequest: payload })
    addClassModal.value.success = 'Classes added successfully'
    // Force global store to sync with new term offerings so Classes.vue is up-to-date
    await dataStore.fetchTerms(true)
    setTimeout(() => {
      addClassModal.value.isOpen = false
      addClassModal.value.success = ''
      initData()
    }, 1500)
  } catch (err) {
    addClassModal.value.error = err.message || 'Failed to add classes'
  } finally {
    addClassModal.value.loading = false
  }
}

const handleRemoveClass = async (classGroup) => {
  if (!confirm(`Are you sure you want to remove ${classGroup.program?.name} from this branch?`)) return

  modal.value.loading = true
  modal.value.error = ''
  try {
    const payload = {
      deleteOfferingsRequest: {
        branchId: activeBranchId.value,
        programId: classGroup.classId
      }
    }
    await termService.updateTerm(term.value.id, payload)
    modal.value.success = 'Class removed from branch'
    setTimeout(() => {
      modal.value.isOpen = false
      modal.value.success = ''
      initData()
    }, 1500)
  } catch (err) {
    modal.value.error = err.message || 'Failed to remove class'
  } finally {
    modal.value.loading = false
  }
}



const handleActionSubmit = async (payload) => {
  modal.value.loading = true
  modal.value.error = ''
  try {
    if (modal.value.type === 'delete') {
      await termService.deleteTerm(term.value.id)
      modal.value.success = 'Term deleted successfully'
      setTimeout(() => router.push('/terms'), 1500)
    } else {
      await termService.updateTerm(term.value.id, payload)
      modal.value.success = 'Term updated successfully'
      setTimeout(() => {
        modal.value.isOpen = false
        initData()
      }, 1500)
    }
  } catch (err) {
    modal.value.error = err.message || 'Action failed'
  } finally {
    modal.value.loading = false
  }
}
</script>

<template>
  <DashboardLayout>
    <DetailPageLayout :loading="loading" :errorMessage="errorMessage" backRoute="/terms" title="Term Analytics"
      sidebarWidth="sm">
      <template #header-actions v-if="term">
        <div class="flex items-center">
          <button
            class="w-11 h-11 flex items-center justify-center rounded-full border border-outline-std bg-primary-soft transition-all duration-300 hover:bg-primary hover:border-primary group"
            title="Edit Term" @click="openModal('edit')">
            <img :src="getActionIcon('edit')" class="w-5 h-5 group-hover:opacity-100 transition-opacity" />
          </button>
          <div class="w-px h-6 bg-outline-std/50 mx-1"></div>
          <button
            class="w-11 h-11 flex items-center justify-center rounded-full border border-outline-std bg-error-soft transition-all duration-300 hover:bg-error hover:border-error group"
            title="Delete Term" @click="openModal('delete')">
            <img :src="getActionIcon('delete')"
              class="w-5 h-5 icon-danger group-hover:opacity-100 transition-opacity" />
          </button>
        </div>
      </template>

      <template #left-content v-if="term">
        <!-- Metrics Grid for Branch -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <DetailMetricCard v-for="stat in statsCards" :key="stat.label" v-bind="stat" />
        </div>

        <!-- Branch Selector & Sub Tabs -->
        <div class="flex flex-col gap-6">
          <div class="flex flex-wrap items-center gap-2 p-2 bg-white rounded-2xl border border-outline-std w-fit">
            <button v-for="branch in termBranches" :key="branch.id"
              class="px-5 py-2 rounded-xl text-xs font-bold transition-all duration-300 border border-transparent"
              :class="activeBranchId === branch.id
                ? 'shadow-md ring-1 ring-black/5'
                : 'text-content-muted hover:text-content-dark hover:bg-surface-subtle/50'" :style="activeBranchId === branch.id ? {
                  backgroundColor: `var(--color-${branch.color || 'blue'})`,
                  color: 'white'
                } : {}" @click="activeBranchId = branch.id">
              {{ branch.name }}
            </button>
          </div>

          <div class="flex items-center gap-1 p-1 bg-white rounded-xl border border-outline-std w-fit">
            <button v-for="tab in ['classes', 'students']" :key="tab"
              class="px-8 py-2.5 rounded-lg text-xs font-bold  transition-all duration-300"
              :class="activeSubTab === tab ? 'bg-primary text-white shadow-md' : 'text-content-muted hover:text-content-dark'"
              @click="activeSubTab = tab">
              {{ tab }}
            </button>
          </div>
        </div>

        <section
          class="overflow-hidden animate-fade-in h-[650px] border border-outline-std rounded-[2rem] bg-white shadow-sm flex flex-col">
          <DataTable v-if="activeSubTab === 'classes'" title="Branch Classes" :headers="classHeaders"
            :items="paginatedClasses" entityName="class" :flexible="false" :hasSearch="true"
            v-model:searchQuery="classSearchQuery" v-model:currentFilter="classFilter"
            :filterOptions="classFilterOptions" :hasFilter="true" :hasPagination="true"
            v-model:currentPage="classCurrentPage" :pageSize="classPageSize" :totalItems="filteredClasses.length">
            <template #toolbar-actions>
              <AppButton v-if="branchDisplayData?.status === 'upcoming'" variant="primary" size="md"
                class="rounded-xl shadow-lg shadow-primary/20" @click="addClassModal.isOpen = true">
                <img :src="getActionIcon('plus')" class="w-4 h-4 brightness-0 invert" />
                <span class="font-bold tracking-tight">Add Class</span>
              </AppButton>
            </template>
            <template #row="{ item, index, headers }">
              <td class="ui-cell text-center" :style="{ width: headers[0].width }">
                {{ (classCurrentPage - 1) * classPageSize + index + 1 }}
              </td>
              <td class="ui-cell" :style="{ width: headers[1].width }">
                <div class="flex items-center gap-4">
                  <div
                    class="w-9 h-9 rounded-full overflow-hidden ring-2 ring-white/80 shadow-sm bg-surface-subtle p-1.5">
                    <img
                      :src="getProgramProfileURL(item.program?.profileURL, item.program?.category?.name || item.program?.category, item.program?.category?.profileURL)"
                      class="w-full h-full object-contain" />
                  </div>
                  <div class="flex flex-col">
                    <span class="leading-tight">{{ item.program?.name || 'Program' }}</span>
                    <span class="mt-0.5 text-xs font-semibold text-content-muted">{{ item.program?.category?.name ||
                      item.program?.category || 'Uncategorized' }}</span>
                  </div>
                </div>
              </td>
              <td class="ui-cell text-center" :style="{ width: headers[2].width }">
                <div class="flex flex-col items-center justify-center gap-4 py-6">
                  <div v-for="(sched, idx) in item.schedules" :key="idx"
                    class="flex flex-col items-center justify-center h-10 bg-primary-light group-hover:bg-primary/30 p-lg rounded-sm min-w-[120px]">
                    <span class="text-xs font-bold leading-none">{{ sched.day }}</span>
                    <span class="text-3xs font-semibold text-content-muted mt-1 leading-none tabular-nums">{{
                      sched.time }}</span>
                  </div>
                </div>
              </td>
              <td class="ui-cell text-center" :style="{ width: headers[3].width }">
                <div class="flex flex-col items-center justify-center gap-4 py-6">
                  <div v-for="(sched, idx) in item.schedules" :key="idx" class="flex items-center justify-center h-10">
                    <AppBadge :status="sched.currentCount || 0" type="blue" />
                  </div>
                </div>
              </td>
              <td class="ui-cell text-center" :style="{ width: headers[4].width }">
                <span class="text-sm font-bold text-primary tabular-nums">${{ formatPrice(item.totalRevenue) }}</span>
              </td>
              <td class="ui-cell text-center" :style="{ width: headers[5].width }">
                <div class="flex flex-col items-center justify-center gap-4 py-6">
                  <div v-for="(sched, idx) in item.schedules" :key="idx" class="flex items-center justify-center h-10">
                    <AppBadge :status="sched.status || 'Active'" />
                  </div>
                </div>
              </td>
              <td class="ui-cell text-center" :style="{ width: headers[6].width }">
                <div class="flex items-center justify-center py-6 h-full">
                  <button
                    class="w-10 h-10 flex items-center justify-center rounded-full hover:bg-error-soft text-error transition-all group"
                    title="Remove Class from Branch" @click="handleRemoveClass(item)">
                    <img :src="getActionIcon('delete')"
                      class="w-5 h-5 icon-danger group-hover:scale-110 transition-transform" />
                  </button>
                </div>
              </td>
            </template>
          </DataTable>


          <DataTable v-else-if="activeSubTab === 'students'" title="Enrolled Students" :headers="studentHeaders"
            :items="paginatedStudents" entityName="student" :flexible="false" :hasSearch="true"
            v-model:searchQuery="studentSearchQuery" v-model:currentFilter="studentFilter"
            :filterOptions="studentFilterOptions" :hasFilter="true" :hasPagination="true"
            v-model:currentPage="studentCurrentPage" :pageSize="studentPageSize" :totalItems="filteredStudents.length">
            <template #row="{ item, index, headers }">
              <td class="ui-cell text-center" :style="{ width: headers[0].width }">
                {{ (studentCurrentPage - 1) * studentPageSize + index + 1 }}
              </td>
              <td class="ui-cell" :style="{ width: headers[1].width }">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-full overflow-hidden bg-surface-subtle border border-outline-std">
                    <img :src="item.profileURL || getImageUrl('common/default-avatar')"
                      class="w-full h-full object-cover" />
                  </div>
                  <div class="flex flex-col">
                    <span class="font-bold text-content-dark text-sm">{{ item.name }}</span>
                    <span class="text-3xs text-content-muted font-bold tracking-tighter">{{ item.studentId
                    }}</span>
                  </div>
                </div>
              </td>
              <td class="ui-cell" :style="{ width: headers[2].width }">
                <span class="text-xs font-bold text-content-dark">{{ item.offeringName }}</span>
              </td>
              <td class="ui-cell text-center" :style="{ width: headers[3].width }">
                <AppBadge :status="item.paymentStatus || 'unpaid'" />
              </td>
              <td class="ui-cell text-center" :style="{ width: headers[4].width }">
                <AppBadge :status="item.status || 'active'" />
              </td>
            </template>
          </DataTable>
        </section>
      </template>

      <template #right-content v-if="term">
        <div class="flex flex-col gap-md">
          <!-- Identity Card -->
          <section class="ui-detail-card flex flex-col items-center gap-4 py-6">
            <h2 class="w-full font-bold text-content-dark text-center">
              Basic Information</h2>
            <div class="relative group">
              <div
                class="w-32 h-32 rounded-full overflow-hidden ring-4 ring-white shadow-2xl transition-transform duration-500 group-hover:scale-105 border-2 border-gray-100 bg-surface-subtle flex items-center justify-center p-6">
                <img :src="getImageUrl('enrollment/total-enrollment')" alt="Term Icon"
                  class="w-full h-full object-contain" />
              </div>
            </div>
            <div class="text-center">
              <h3 class="text-lg text-content-dark font-extrabold mt-md">{{ term.name }}</h3>
              <span class="text-sm font-bold text-content-muted  mt-1">{{ term.totalSessions }}
                Weekly Sessions</span>
            </div>
          </section>

          <!-- Parameters Card -->
          <section class="ui-detail-card !py-8">
            <div class="flex flex-col items-center gap-6">
              <div v-if="activeBranch"
                class="flex flex-col items-center gap-2 w-full pb-6 border-b border-outline-std/50">
                <span class="text-sm font-bold text-content-muted ">Selected Branch</span>
                <AppBadge :status="activeBranch.name" :type="activeBranch.color" class="px-6 py-1.5 text-sm" />
              </div>

              <div class="grid grid-cols-2 gap-x-12 gap-y-8 w-full" v-if="branchDisplayData">
                <div class="flex flex-col items-center gap-2">
                  <span class="text-sm font-bold text-content-muted ">Status</span>
                  <AppBadge :status="branchDisplayData.status" />
                </div>
                <div class="flex flex-col items-center gap-2">
                  <span class="text-sm font-bold text-content-muted ">Locations</span>
                  <span class="text-lg font-bold text-content-dark">{{ term.branchIds.length }} Branches</span>
                </div>
                <div class="flex flex-col items-center gap-2">
                  <span class="text-sm font-bold text-content-muted ">Duration</span>
                  <span class="text-lg font-bold text-content-dark">{{ term.totalSessions }} Weeks</span>
                </div>
                <div class="flex flex-col items-center gap-2">
                  <span class="text-sm font-bold text-content-muted ">Sessions</span>
                  <span class="text-lg font-bold text-content-dark">{{ term.totalSessions }} Total</span>
                </div>
                <div class="flex flex-col items-center gap-2">
                  <span class="text-sm font-bold text-content-muted ">Start Date</span>
                  <AppBadge :status="formatShortDate(branchDisplayData.startDate)" type="green" />
                </div>
                <div class="flex flex-col items-center gap-2">
                  <span class="text-sm font-bold text-content-muted ">End Date</span>
                  <AppBadge :status="formatShortDate(branchDisplayData.endDate)" type="red" />
                </div>
              </div>
            </div>
          </section>
        </div>
      </template>
    </DetailPageLayout>

    <TermActionModal :isOpen="modal.isOpen" :type="modal.type" :term="term" :branches="branches"
      :loading="modal.loading" :error="modal.error" :success="modal.success" @close="modal.isOpen = false"
      @submit="handleActionSubmit" />

    <TermOfferingActionModal :isOpen="addClassModal.isOpen" :term="term" :initialBranchId="activeBranchId"
      :loading="addClassModal.loading" :error="addClassModal.error" :success="addClassModal.success"
      @close="addClassModal.isOpen = false" @submit="handleAddClass" />
  </DashboardLayout>
</template>

<style scoped>
.ui-detail-card {
  @apply bg-white rounded-[2rem] p-8 border border-outline-std shadow-sm transition-all duration-500 hover:shadow-xl hover:shadow-primary/5;
}
</style>

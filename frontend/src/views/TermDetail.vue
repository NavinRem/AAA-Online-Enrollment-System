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
import AppSelect from '@/components/common/ui/AppSelect.vue'
import AppModal from '@/components/common/ui/AppModal.vue'
import { teacherService } from '@/services/teacherService'
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
      dataStore.fetchPrograms(),
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
  return term.value.branchIds.map((id) => branches.value.find((b) => b.id === id)).filter(Boolean)
})

const activeBranch = computed(() => {
  return branches.value.find((b) => b.id === activeBranchId.value)
})

const activeBranchSetting = computed(() => {
  if (!term.value || !activeBranchId.value || !term.value.branchSettings) return null
  return term.value.branchSettings.find((s) => s.branchId === activeBranchId.value)
})

const rawBranchOfferings = computed(() => {
  if (!term.value || !activeBranchId.value) return []

  // Filter offerings belonging to the active branch
  const rawOfferings = (term.value.offerings || []).filter(
    (o) => String(o.branchId) === String(activeBranchId.value),
  )

  return rawOfferings.map((off) => {
    // Enrich with latest program data from store if available
    const liveProgram = dataStore.programs.find(
      (p) => p.id === off.program?.id || p.id === off.classId,
    )
    const program = liveProgram || off.program

    // Map student IDs to student objects from store
    const students = (off.studentIds || [])
      .map((sid) => {
        const student = dataStore.students.find((s) => String(s.id) === String(sid))
        if (!student) return null

        // Find the specific enrollment for metadata (payment status, etc.)
        const enrollment = dataStore.enrollments.find(
          (e) =>
            String(e.studentId) === String(sid) &&
            String(e.termId) === String(term.value.id) &&
            (String(e.termOfferingId) === String(off.offeringId) ||
              String(e.classId) === String(off.classId)),
        )

        return {
          ...student,
          paymentStatus: enrollment?.paymentStatus || 'unpaid',
          status: enrollment?.status || 'active',
          enrollmentId: enrollment?.id,
          revenue: enrollment?.finalPrice || enrollment?.totalPrice || 0,
        }
      })
      .filter(Boolean)

    return {
      ...off,
      program,
      students,
      currentCount: students.length,
      revenue: students.reduce((sum, s) => sum + (s.revenue || 0), 0),
    }
  })
})

const groupedBranchOfferings = computed(() => {
  const map = new Map()
  rawBranchOfferings.value.forEach((off) => {
    const classId = off.classId || off.program?.id
    if (!map.has(classId)) {
      map.set(classId, {
        id: `group-${classId}`,
        classId: classId,
        program: off.program,
        schedules: [],
        totalRevenue: 0,
        status: off.status || 'active',
      })
    }
    const group = map.get(classId)
    group.schedules.push({
      ...off.schedule,
      currentCount: off.currentCount,
      status: off.status || 'active',
      offeringId: off.offeringId,
      revenue: off.revenue || 0,
    })
    group.totalRevenue += off.revenue || 0
  })

  const dayOrder = {
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
    Saturday: 6,
    Sunday: 7,
  }

  const groups = Array.from(map.values())
  groups.forEach((g) => {
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
  rawBranchOfferings.value.forEach((offering) => {
    ; (offering.students || []).forEach((s) => {
      if (!studentMap.has(s.id || s.studentId)) {
        studentMap.set(s.id || s.studentId, {
          ...s,
          offeringName: `${offering.program?.name || 'Program'} - ${offering.schedule?.day || ''} ${offering.schedule?.time || ''}`,
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
  return dataStore.trials.filter((t) => {
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
    endDate: setting.endDate,
  }
})

// Search & Filtering for Classes
const classCurrentPage = ref(1)
const classPageSize = ref(10)
const classFilter = ref('all')
const { searchQuery: classSearchQuery, searchResults: classSearchResults } = useSearch(
  groupedBranchOfferings,
  classSearchMapper,
)

const classFilterOptions = computed(() => {
  const options = [{ label: 'All Programs', value: 'all', image: getActionIcon('filter') }]
  const programsInBranch = new Map()
  groupedBranchOfferings.value.forEach((g) => {
    if (g.program?.name && !programsInBranch.has(g.program.name)) {
      programsInBranch.set(g.program.name, g.program)
    }
  })
  Array.from(programsInBranch.keys())
    .sort()
    .forEach((name) => {
      const p = programsInBranch.get(name)
      options.push({
        label: name,
        value: name,
        image: getProgramProfileURL(
          p.profileURL,
          p.category?.name || p.category,
          p.category?.profileURL,
        ),
      })
    })

  // Days Section
  options.push({ isDivider: true })
  options.push({ isHeader: true, label: 'Filter by Day' })
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  const dayColors = {
    Monday: 'blue',
    Tuesday: 'magenta',
    Wednesday: 'green',
    Thursday: 'orange',
    Friday: 'purple',
    Saturday: 'blue',
    Sunday: 'red',
  }
  const daysInBranch = new Set()
  groupedBranchOfferings.value.forEach((g) => {
    ; (g.schedules || []).forEach((s) => {
      if (s.day) daysInBranch.add(s.day)
    })
  })

  days.forEach((day) => {
    if (daysInBranch.has(day)) {
      options.push({
        label: `${day} Classes`,
        value: `day-${day}`,
        color: dayColors[day] || 'blue',
        image: getActionIcon('calendar'),
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
      list = list.filter((c) => (c.schedules || []).some((s) => s.day === targetDay))
      // Filter the schedules within each program to only show the selected day
      list = list.map((item) => {
        const daySchedules = item.schedules.filter((s) => s.day === targetDay)
        return {
          ...item,
          schedules: daySchedules,
          totalRevenue: daySchedules.reduce((sum, s) => sum + (s.revenue || 0), 0),
        }
      })
    } else {
      list = list.filter((c) => c.program?.name === classFilter.value)
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
const { searchQuery: studentSearchQuery, searchResults: studentSearchResults } = useSearch(
  branchStudents,
  studentSearchMapper,
)

const studentFilterOptions = [
  { label: 'All Students', value: 'all' },
  { label: 'Active', value: 'active', color: 'green' },
  { label: 'Inactive', value: 'inactive', color: 'red' },
  { label: 'Paid', value: 'paid', color: 'blue' },
  { label: 'Unpaid', value: 'unpaid', color: 'yellow' },
]

const filteredStudents = computed(() => {
  let list = studentSearchResults.value
  if (studentFilter.value !== 'all') {
    if (studentFilter.value === 'paid' || studentFilter.value === 'unpaid') {
      list = list.filter((s) => s.paymentStatus === studentFilter.value)
    } else {
      list = list.filter((s) => s.status === studentFilter.value)
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
    },
  ]
})

const classHeaders = [
  { label: 'No', width: '50px', align: 'center' },
  { label: 'Class Identity' },
  { label: 'Schedule', width: '200px', align: 'center' },
  { label: 'Enrolled', align: 'center', width: '100px' },
  { label: 'Weekly Schedule', align: 'center', width: '180px' }, // New Column
  { label: 'Revenue', align: 'center', width: '130px' },
  { label: 'Status', align: 'center', width: '110px' },
  { label: 'Action', align: 'center', width: '80px' },
]

const sessionModal = ref({
  isOpen: false,
  offeringId: null,
  programId: null,
  programName: '',
  schedule: null,
})

const openSessionModal = (sched, item) => {
  sessionModal.value = {
    isOpen: true,
    offeringId: sched.offeringId,
    programId: item.program?.id,
    programName: item.program?.name || 'Class',
    schedule: sched,
  }
}

const teachers = ref([])
const filteredTeachers = computed(() => {
  if (!sessionModal.value.isOpen || !sessionModal.value.programId) return teachers.value
  
  // Filter teachers who have this programId in their programIds array
  return teachers.value.filter(t => 
    (t.programIds || []).some(pid => String(pid) === String(sessionModal.value.programId))
  )
})

const loadTeachers = async () => {
  try {
    const data = await teacherService.getAllTeachers()
    teachers.value = data.data || data
  } catch (err) {
    console.error('Failed to load teachers', err)
  }
}

onMounted(() => {
  initData()
  loadTeachers()
})

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

const updateSessionTeacher = async (offeringId, weekIndex, teacherId) => {
  try {
    const offering = (term.value.offerings || []).find(o => o.offeringId === offeringId)
    if (!offering) return

    const sessionTeachers = [...(offering.sessionTeachers || [])]
    // Ensure array is padded to totalSessions
    while (sessionTeachers.length < term.value.totalSessions) {
      sessionTeachers.push(null)
    }

    const teacher = teachers.value.find(t => t.id === teacherId)
    sessionTeachers[weekIndex] = teacher ? {
      id: teacher.id,
      name: teacher.name,
      profileURL: teacher.profileURL
    } : null

    await termService.updateTermOffering(term.value.id, offeringId, { sessionTeachers })
    // Update local state
    offering.sessionTeachers = sessionTeachers
  } catch (err) {
    console.error('Failed to update session teacher', err)
    errorMessage.value = 'Failed to update session teacher'
  }
}

const addClassModal = ref({
  isOpen: false,
  loading: false,
  error: '',
  success: '',
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
  if (!confirm(`Are you sure you want to remove ${classGroup.program?.name} from this branch?`))
    return

  modal.value.loading = true
  modal.value.error = ''
  try {
    const payload = {
      deleteOfferingsRequest: {
        branchId: activeBranchId.value,
        programId: classGroup.classId,
      },
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
        <div class="flex items-center gap-3">
          <button
            class="w-11 h-11 flex items-center justify-center rounded-full border border-outline-std bg-primary-soft transition-all duration-300 hover:bg-primary hover:border-primary group"
            title="Edit Term" @click="openModal('edit')">
            <img :src="getActionIcon('edit')" class="w-5 h-5 brightness-0 transition-all" />
          </button>
          <button
            class="w-11 h-11 flex items-center justify-center rounded-full border border-outline-std bg-error-soft transition-all duration-300 hover:bg-error hover:border-error group"
            title="Delete Term" @click="openModal('delete')">
            <img :src="getActionIcon('delete')" class="w-5 h-5 brightness-0 transition-all" />
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
                : 'text-content-muted hover:text-content-dark hover:bg-surface-subtle/50'
                " :style="activeBranchId === branch.id
                  ? {
                    backgroundColor: `var(--color-${branch.color || 'blue'})`,
                    color: 'white',
                  }
                  : {}
                  " @click="activeBranchId = branch.id">
              {{ branch.name }}
            </button>
          </div>

          <div class="flex items-center gap-1 p-1 bg-white rounded-xl border border-outline-std w-fit">
            <button v-for="tab in ['classes', 'students']" :key="tab"
              class="px-8 py-2.5 rounded-lg text-xs font-bold transition-all duration-300" :class="activeSubTab === tab
                ? 'bg-primary text-white shadow-md'
                : 'text-content-muted hover:text-content-dark'
                " @click="activeSubTab = tab">
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
                    <img :src="getProgramProfileURL(
                      item.program?.profileURL,
                      item.program?.category?.name || item.program?.category,
                      item.program?.category?.profileURL,
                    )
                      " class="w-full h-full object-contain" />
                  </div>
                  <div class="flex flex-col">
                    <span class="leading-tight">{{ item.program?.name || 'Program' }}</span>
                    <span class="mt-0.5 text-xs font-semibold text-content-muted">{{
                      item.program?.category?.name || item.program?.category || 'Uncategorized'
                      }}</span>
                  </div>
                </div>
              </td>
              <td class="ui-cell text-center" :style="{ width: headers[2].width }">
                <div class="flex flex-col items-center justify-center gap-4 py-6">
                  <div v-for="(sched, idx) in item.schedules" :key="idx"
                    class="flex flex-col items-center justify-center h-10 bg-primary-light group-hover:bg-primary/30 p-lg rounded-sm min-w-[120px]">
                    <span class="text-xs font-bold leading-none">{{ sched.day }}</span>
                    <span class="text-3xs font-semibold text-content-muted mt-1 leading-none tabular-nums">{{ sched.time
                      }}</span>
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
                <div class="flex flex-col items-center justify-center gap-4 py-6">
                  <div v-for="(sched, idx) in item.schedules" :key="idx" class="flex items-center justify-center h-10">
                    <button
                      class="px-3 py-1.5 rounded-lg border border-outline-std bg-surface-subtle hover:bg-white transition-all text-[10px] font-bold text-primary flex items-center gap-2 shadow-sm"
                      @click="openSessionModal(sched, item)">
                      <span class="opacity-70">📋</span>
                      Manage Sessions
                    </button>
                  </div>
                </div>
              </td>
              <td class="ui-cell text-center" :style="{ width: headers[5].width }">
                <span class="text-sm font-bold text-primary tabular-nums">${{ formatPrice(item.totalRevenue) }}</span>
              </td>
              <td class="ui-cell text-center" :style="{ width: headers[6].width }">
                <div class="flex flex-col items-center justify-center gap-4 py-6">
                  <div v-for="(sched, idx) in item.schedules" :key="idx" class="flex items-center justify-center h-10">
                    <AppBadge :status="sched.status || 'Active'" />
                  </div>
                </div>
              </td>
              <td class="ui-cell text-center" :style="{ width: headers[7].width }">
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
                    <span class="text-3xs text-content-muted font-bold tracking-tighter">{{
                      item.studentId
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
            <h2 class="w-full font-bold text-content-dark text-center">Basic Information</h2>
            <div class="relative group">
              <div
                class="w-32 h-32 rounded-full overflow-hidden ring-4 ring-white shadow-2xl transition-transform duration-500 group-hover:scale-105 border-2 border-gray-100 bg-surface-subtle flex items-center justify-center p-6">
                <img :src="getImageUrl('enrollment/total-enrollment')" alt="Term Icon"
                  class="w-full h-full object-contain" />
              </div>
            </div>
            <div class="text-center">
              <h3 class="text-lg text-content-dark font-extrabold mt-md">{{ term.name }}</h3>
              <span class="text-sm font-bold text-content-muted mt-1">{{ term.totalSessions }} Weekly Sessions</span>
            </div>
          </section>

          <!-- Parameters Card -->
          <section class="ui-detail-card !py-8">
            <div class="flex flex-col items-center gap-6">
              <div v-if="activeBranch"
                class="flex flex-col items-center gap-2 w-full pb-6 border-b border-outline-std/50">
                <span class="text-sm font-bold text-content-muted">Selected Branch</span>
                <AppBadge :status="activeBranch.name" :type="activeBranch.color" class="px-6 py-1.5 text-sm" />
              </div>

              <div class="grid grid-cols-2 gap-x-12 gap-y-8 w-full" v-if="branchDisplayData">
                <div class="flex flex-col items-center gap-2">
                  <span class="text-sm font-bold text-content-muted">Status</span>
                  <AppBadge :status="branchDisplayData.status" />
                </div>
                <div class="flex flex-col items-center gap-2">
                  <span class="text-sm font-bold text-content-muted">Locations</span>
                  <span class="text-lg font-bold text-content-dark">{{ term.branchIds.length }} Branches</span>
                </div>
                <div class="flex flex-col items-center gap-2">
                  <span class="text-sm font-bold text-content-muted">Duration</span>
                  <span class="text-lg font-bold text-content-dark">{{ term.totalSessions }} Weeks</span>
                </div>
                <div class="flex flex-col items-center gap-2">
                  <span class="text-sm font-bold text-content-muted">Sessions</span>
                  <span class="text-lg font-bold text-content-dark">{{ term.totalSessions }} Total</span>
                </div>
                <div class="flex flex-col items-center gap-2">
                  <span class="text-sm font-bold text-content-muted">Start Date</span>
                  <AppBadge :status="formatShortDate(branchDisplayData.startDate)" type="green" />
                </div>
                <div class="flex flex-col items-center gap-2">
                  <span class="text-sm font-bold text-content-muted">End Date</span>
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

    <ClassActionModal :isOpen="addClassModal.isOpen" @close="addClassModal.isOpen = false" @submit="handleAddClass"
      :loading="addClassModal.loading" :error="addClassModal.error" :success="addClassModal.success" />

    <!-- Weekly Session Management Modal -->
    <AppModal :show="sessionModal.isOpen" :title="`Session Management: ${sessionModal.programName}`" maxWidth="1000px"
      @close="sessionModal.isOpen = false">
      <template #header>
        <div class="flex flex-col">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-2xl bg-primary-soft flex items-center justify-center text-primary shadow-sm border border-primary/10">
              <span class="text-2xl">📅</span>
            </div>
            <div class="flex flex-col">
              <h3 class="text-xl font-black text-content-dark leading-tight uppercase tracking-tight">
                Weekly Faculty Assignment
              </h3>
              <div class="flex items-center gap-2 mt-1">
                <span class="text-sm font-bold text-primary">{{ sessionModal.programName }}</span>
                <span class="text-xs font-bold text-content-muted/40">•</span>
                <span class="text-xs font-bold text-content-muted">
                  {{ sessionModal.schedule?.day }} {{ sessionModal.schedule?.time }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </template>

      <div class="flex flex-col gap-10 py-6">
        <!-- Info Banner -->
        <div class="flex items-center justify-between p-8 bg-surface-subtle/40 rounded-[2rem] border border-outline-std shadow-sm">
          <div class="flex items-center gap-6">
            <div class="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-inner border border-outline-std">
               <img :src="getActionIcon('info')" class="w-8 h-8 opacity-40" />
            </div>
            <div class="flex flex-col">
              <span class="text-xs font-black text-primary uppercase tracking-[0.2em] mb-1">Assignment Controls</span>
              <h4 class="text-lg font-bold text-content-dark">Fine-tune the instructors for every session.</h4>
              <p class="text-sm font-bold text-content-muted/70 mt-1 max-w-[500px]">
                Showing only teachers specialized in <span class="text-primary">{{ sessionModal.programName }}</span>. 
                Changes are saved automatically to the master schedule.
              </p>
            </div>
          </div>
          <div class="flex items-center gap-6 pr-4">
            <div class="flex flex-col items-end">
              <span class="text-[10px] font-black text-content-muted/50 uppercase tracking-widest mb-2">Term Progress</span>
              <div class="flex gap-1.5">
                <div v-for="i in term.totalSessions" :key="i" class="w-4 h-2 rounded-full transition-all duration-500"
                  :class="i <= 3 ? 'bg-primary shadow-[0_0_8px_rgba(var(--color-primary-rgb),0.4)]' : 'bg-outline-std/60'"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Sessions Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div v-for="i in term.totalSessions" :key="i"
            class="flex flex-col gap-4 p-6 bg-white rounded-[1.5rem] border border-outline-std shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group/session relative overflow-hidden">
            
            <!-- Subtle background week number -->
            <div class="absolute -top-2 -right-2 text-6xl font-black text-surface-subtle/5 select-none transition-all group-hover/session:text-primary/5">
               {{ i }}
            </div>

            <div class="flex items-center justify-between relative z-10">
              <div class="flex items-center gap-2.5">
                <span class="w-2 h-2 rounded-full bg-primary animate-pulse" v-if="i === 1"></span>
                <span class="text-[11px] font-black text-primary bg-primary-soft px-3.5 py-1.5 rounded-lg uppercase tracking-wider shadow-sm">
                  Week {{ i }}
                </span>
              </div>
              <span class="text-[10px] font-black text-content-muted/40 uppercase tracking-widest">
                Session {{ i }}
              </span>
            </div>

            <div class="flex flex-col gap-3 mt-2 relative z-10">
              <div class="flex items-center justify-between ml-1">
                <span class="text-[10px] font-black text-content-muted uppercase tracking-[0.15em]">Assign Faculty</span>
                <span v-if="(term.offerings.find(o => o.offeringId === sessionModal.offeringId)?.sessionTeachers || [])[i - 1]" 
                      class="text-[9px] font-black text-green-500 uppercase">Assigned</span>
              </div>
              
              <AppSelect
                :modelValue="(term.offerings.find(o => o.offeringId === sessionModal.offeringId)?.sessionTeachers || [])[i - 1]?.id"
                :items="filteredTeachers" placeholder="Select Specialist..." size="lg" class="!bg-surface-subtle/30 !rounded-xl border-outline-std group-hover/session:border-primary/30 transition-colors"
                @change="(val) => updateSessionTeacher(sessionModal.offeringId, i - 1, val)">
                <template #selected="{ item: t }">
                  <div v-if="t" class="flex items-center gap-3 py-1">
                    <div class="relative">
                      <img :src="t.profileURL || getImageUrl('profiles/avatar-teacher-man')" class="w-7 h-7 rounded-full border-2 border-white shadow-sm" />
                      <div class="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></div>
                    </div>
                    <div class="flex flex-col">
                      <span class="text-xs font-black text-content-dark truncate max-w-[140px] leading-tight">{{ t.name }}</span>
                      <span class="text-[9px] font-bold text-primary uppercase tracking-tighter">{{ t.branchAbbr || 'HQ' }} Specialist</span>
                    </div>
                  </div>
                  <div v-else class="flex items-center gap-2 py-1 opacity-60 italic">
                    <span class="text-xs font-bold text-content-muted">No instructor assigned</span>
                  </div>
                </template>
                <template #item="{ item: t }">
                  <div class="flex items-center gap-4 py-1">
                    <div class="relative">
                      <img :src="t.profileURL || getImageUrl('profiles/avatar-teacher-man')" class="w-10 h-10 rounded-xl shadow-sm" />
                      <div class="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></div>
                    </div>
                    <div class="flex flex-col">
                      <span class="text-sm font-black text-content-dark">{{ t.name }}</span>
                      <div class="flex items-center gap-1.5 mt-0.5">
                         <span class="text-[10px] font-bold text-content-muted uppercase tracking-wider bg-surface-subtle px-2 py-0.5 rounded">{{ t.branchAbbr || 'HQ' }}</span>
                         <span class="text-[10px] font-bold text-primary italic">Expert</span>
                      </div>
                    </div>
                  </div>
                </template>
              </AppSelect>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flex items-center justify-between w-full px-2">
          <div class="flex items-center gap-2 text-content-muted">
             <span class="text-xs font-bold italic">Note: Only specialists for {{ sessionModal.programName }} are shown above.</span>
          </div>
          <div class="flex items-center gap-3">
            <AppButton variant="ghost" size="md" class="font-bold" @click="sessionModal.isOpen = false">
              Cancel
            </AppButton>
            <AppButton variant="primary" size="md" class="px-8 font-black shadow-lg shadow-primary/20" @click="sessionModal.isOpen = false">
              Finish Assignment
            </AppButton>
          </div>
        </div>
      </template>
    </AppModal>
  </DashboardLayout>
</template>

<style scoped>
.ui-detail-card {
  @apply bg-white rounded-[2rem] p-8 border border-outline-std shadow-sm transition-all duration-500 hover:shadow-xl hover:shadow-primary/5;
}
</style>

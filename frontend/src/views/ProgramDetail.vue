<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import DetailPageLayout from '@/components/layout/DetailPageLayout.vue'
import AppBadge from '@/components/common/ui/AppBadge.vue'
import AppButton from '@/components/common/ui/AppButton.vue'
import { programService } from '@/services/programService'
import { classService } from '@/services/classService'
import { enrollmentService } from '@/services/enrollmentService'
import { studentService } from '@/services/studentService'
import { getProgramProfileURL, getImageUrl, getActionIcon } from '@/utils/assetHelper'
import { getProgramDisplayStatus, isSessionInProgress } from '@/utils/programHelper'
import { enrichEnrollments } from '@/utils/enrollmentHelper'
import { getStatusTheme, getStatusFilter, getStatusUI } from '@/utils/badgeUtils'
import ProgramActionModal from '@/components/programs/ProgramActionModal.vue'
import DataMetricCard from '@/components/common/data/DataMetricCard.vue'

const route = useRoute()
const router = useRouter()

const program = ref(null)
const classes = ref([])
const enrollments = ref([])
const students = ref([])
const loading = ref(true)
const errorMessage = ref('')
const now = ref(new Date())

const activeTab = ref('overview')
const searchQuery = ref('')

// Filter State
const studentFilter = ref('all')
const sessionFilter = ref('all')
const infoFilter = ref('all')
const isFilterOpen = ref(false)
const filterMenuStyles = ref({})
const hoveredOption = ref(null)

const currentFilter = computed({
  get: () => {
    if (activeTab.value === 'students') return studentFilter.value
    if (activeTab.value === 'classes') return sessionFilter.value
    return infoFilter.value
  },
  set: (val) => {
    if (activeTab.value === 'students') studentFilter.value = val
    else if (activeTab.value === 'classes') sessionFilter.value = val
    else infoFilter.value = val
  }
})

const filterOptions = computed(() => {
  if (activeTab.value === 'students') {
    return [
      { label: 'All Students', value: 'all' },
      { label: 'Confirmed', value: 'confirmed' },
      { label: 'Pending', value: 'pending' },
      { label: 'Cancelled', value: 'cancelled' },
    ]
  }
  if (activeTab.value === 'classes') {
    return [
      { label: 'All Sessions', value: 'all' },
      { label: 'Scheduled', value: 'Scheduled' },
      { label: 'Past', value: 'Past' },
      { label: 'In Progress', value: 'In Progress' },
    ]
  }
  return [
    { label: 'All Details', value: 'all' },
    { label: 'Syllabus Only', value: 'syllabs' },
    { label: 'Specs Only', value: 'specs' },
  ]
})

const toggleFilter = (event) => {
  isFilterOpen.value = !isFilterOpen.value
  if (isFilterOpen.value) {
    const rect = event.currentTarget.getBoundingClientRect()
    filterMenuStyles.value = {
      top: `${rect.bottom + window.scrollY + 8}px`,
      right: `${window.innerWidth - rect.right - window.scrollX}px`,
      minWidth: '180px',
    }
  }
}

const selectFilter = (val) => {
  currentFilter.value = val
  isFilterOpen.value = false
}

const isFilterActive = computed(() => currentFilter.value !== 'all')

const filterThemeStyles = computed(() => {
  if (!isFilterActive.value) return {}
  const theme = getStatusTheme(currentFilter.value)
  return {
    backgroundColor: theme.backgroundColor || 'var(--color-primary-soft)',
    color: theme.color || 'var(--color-primary)'
  }
})

const getFilterLabel = () => {
  const opt = filterOptions.value.find(o => o.value === currentFilter.value)
  return opt ? opt.label : 'Filter'
}

const initData = async () => {
  const id = route.params.id
  loading.value = true
  errorMessage.value = ''

  try {
    const [pData, cData, eData, stdData] = await Promise.all([
      programService.getProgram(id),
      classService.getAvailableClasses(id),
      enrollmentService.getAllEnrollments(),
      studentService.getAllStudents(),
    ])

    program.value = pData
    classes.value = Array.isArray(cData) ? cData : []

    const allEnrollments = Array.isArray(eData) ? eData : []
    enrollments.value = allEnrollments.filter((e) => String(e.programId || '') === String(id))

    students.value = Array.isArray(stdData) ? stdData : []
  } catch (err) {
    console.error('Error fetching program details:', err)
    errorMessage.value = 'Failed to load program details'
  } finally {
    loading.value = false
  }
}

const handleClickOutside = (event) => {
  if (!isFilterOpen.value) return
  // If we clicked the button itself, toggleFilter handles it
  const btn = document.querySelector('.filter-trigger-btn')
  const menu = document.querySelector('.shared-filter-menu')
  if (btn?.contains(event.target) || menu?.contains(event.target)) return
  isFilterOpen.value = false
}

onMounted(() => {
  initData()
  window.addEventListener('mousedown', handleClickOutside)
  const interval = setInterval(() => {
    now.value = new Date()
  }, 60000)
  return () => {
    window.removeEventListener('mousedown', handleClickOutside)
    clearInterval(interval)
  }
})

const statsCards = computed(() => {
  if (!program.value) return []

  const paidEnrollmentsCount = enrollments.value.filter((e) =>
    ['paid', 'confirmed'].includes(String(e.status || e.paymentStatus).toLowerCase()),
  ).length
  const totalRevenue = enrollments.value
    .filter((e) => ['paid', 'confirmed'].includes(String(e.status || e.paymentStatus).toLowerCase()))
    .reduce((sum, e) => sum + Number(e.amount || program.value.basePrice || 0), 0)

  const scheduledCount = classInstances.value.filter((i) => i.status === 'Scheduled').length
  const maxCapacity = Number(program.value.maxCapacity || 5)
  const remainingCapacity = Math.max(0, maxCapacity - paidEnrollmentsCount)

  return [
    {
      label: 'Live Enrollment',
      value: paidEnrollmentsCount,
      image: getImageUrl('data-metric-card/total-enrolled'),
      color: 'var(--color-primary-light)',
    },
    {
      label: 'Financial Yield',
      value: `$${totalRevenue.toLocaleString()}`,
      image: getImageUrl('data-metric-card/program-revenue'),
      color: 'var(--color-primary-light)',
    },
    {
      label: 'Open Sessions',
      value: scheduledCount,
      image: getImageUrl('data-metric-card/remaining-sessions'),
      color: 'var(--color-primary-light)',
    },
    {
      label: 'Available Slots',
      value: remainingCapacity,
      image: getImageUrl('data-metric-card/enrollment-capacity'),
      color: 'var(--color-primary-light)',
    },
  ]
})

const enrolledStudents = computed(() => {
  if (!enrollments.value.length) return []

  const enriched = enrichEnrollments(
    enrollments.value,
    [],
    students.value,
    [program.value].filter(Boolean),
  )

  return enriched.filter((e) => {
    // Search
    const studentName = e.studentName || 'Unknown Student'
    const matchesSearch = !searchQuery.value || studentName.toLowerCase().includes(searchQuery.value.toLowerCase())

    // Filter
    const matchesFilter = studentFilter.value === 'all' || String(e.status || '').toLowerCase() === studentFilter.value.toLowerCase()

    return matchesSearch && matchesFilter
  })
})

const classInstances = computed(() => {
  if (!program.value || classes.value.length === 0) return []

  const instances = []
  const start = new Date(program.value.startDate)
  const end = new Date(program.value.endDate)
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

  classes.value.forEach((cls) => {
    const dayName = cls.day
    if (!dayName) return

    const targetDayIndex = days.indexOf(dayName)
    let current = new Date(start)

    while (current.getDay() !== targetDayIndex) {
      current.setDate(current.getDate() + 1)
    }

    while (current <= end) {
      const dateStr = current.toISOString().split('T')[0]
      const isToday = dateStr === now.value.toISOString().split('T')[0]
      const isPastDay =
        current < new Date(now.value.getFullYear(), now.value.getMonth(), now.value.getDate())

      let status = 'Scheduled'
      if (isToday) {
        if (isSessionInProgress(cls)) {
          status = 'In Progress'
        } else {
          const times = (cls.timeslot || '').split('-').map((t) => t.trim())
          if (times.length === 2) {
            const [hours, minutes] = times[1].split(':').map(Number)
            const endMinutes = hours * 60 + minutes
            const currentMinutes = now.value.getHours() * 60 + now.value.getMinutes()
            if (currentMinutes > endMinutes) status = 'Past'
          }
        }
      } else if (isPastDay) {
        status = 'Past'
      }

      instances.push({
        id: `${cls.id}-${dateStr}`,
        date: dateStr,
        day: dayName,
        timeslot: cls.timeslot,
        status: status,
      })

      current.setDate(current.getDate() + 7)
    }
  })

  const filtered = instances.filter(i => {
    return sessionFilter.value === 'all' || i.status === sessionFilter.value
  })

  return filtered.sort((a, b) => a.date.localeCompare(b.date))
})

const actionModal = ref({
  isOpen: false,
  type: 'edit',
  program: null,
  loading: false,
  error: '',
  success: '',
})

const openActionModal = (type) => {
  actionModal.value = {
    isOpen: true,
    type,
    program: program.value,
    loading: false,
    error: '',
    success: '',
  }
}

const closeModal = () => {
  actionModal.value.isOpen = false
  actionModal.value.error = ''
  actionModal.value.success = ''
}

const handleActionSubmit = async (formData) => {
  actionModal.value.loading = true
  actionModal.value.error = ''
  try {
    if (actionModal.value.type === 'edit') {
      await programService.updateProgram(program.value.id, formData)
      actionModal.value.success = 'Program updated successfully!'
    } else if (actionModal.value.type === 'delete') {
      await programService.deleteProgram(program.value.id)
      actionModal.value.success = 'Program deleted successfully!'
      setTimeout(() => {
        router.push('/programs')
      }, 1500)
      return
    }

    setTimeout(() => {
      closeModal()
      initData()
    }, 1500)
  } catch (error) {
    actionModal.value.error = error.message || 'Action failed'
  } finally {
    actionModal.value.loading = false
  }
}
</script>

<template>
  <DashboardLayout>
    <DetailPageLayout :loading="loading" :errorMessage="errorMessage" backRoute="/programs" title="Program Analytics" sidebarWidth="sm">
      <template #header-actions v-if="program">
        <div class="flex items-center gap-3">
          <button
            class="w-11 h-11 flex items-center justify-center rounded-full border border-outline-std bg-primary-light transition-all duration-300 hover:bg-primary hover:border-primary group"
            title="Edit Program" @click="openActionModal('edit')">
            <img :src="getActionIcon('edit')" class="w-5 h-5 group-hover:opacity-100 transition-opacity" />
          </button>
          <div class="w-px h-6 bg-outline-std/50 mx-1"></div>
          <button
            class="w-11 h-11 flex items-center justify-center rounded-full border border-outline-std bg-error-soft transition-all duration-300 hover:bg-error hover:border-error group"
            title="Delete Program" @click="openActionModal('delete')">
            <img :src="getActionIcon('delete')" class="w-5 h-5 icon-danger group-hover:opacity-100 transition-opacity" />
          </button>
        </div>
      </template>

      <template #left-content v-if="program">
        <!-- Metrics Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div v-for="stat in statsCards" :key="stat.label"
            class="bg-white rounded-md p-6 border border-outline-std shadow-sm hover:shadow-md transition-all duration-300 group">
            <div class="flex items-center gap-4">
              <div
                class="rounded-xl flex items-center justify-center bg-surface-subtle group-hover:bg-primary/5 transition-colors">
                <img :src="stat.image" class="w-10 h-10 opacity-60 group-hover:opacity-100 transition-opacity" />
              </div>
              <div class="flex flex-col">
                <span class="text-[10px] font-black text-content-muted uppercase tracking-widest leading-none mb-1">{{
                  stat.label }}</span>
                <span class="text-xl font-black text-content-dark tracking-tight">{{ stat.value }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Tab Navigation -->
        <div class="flex items-center gap-2 p-2 bg-white rounded-full border border-outline-std w-fit mb-8">
          <button v-for="tab in ['overview', 'students', 'classes']" :key="tab"
            class="px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all duration-300"
            :class="activeTab === tab ? 'bg-primary text-white shadow-md ring-1 ring-black/5 scale-[1.02]' : 'text-content-muted hover:text-content-dark hover:bg-white/50'"
            @click="activeTab = tab">
            {{ tab === 'overview' ? 'Syllabus' : tab === 'students' ? 'Roster' : 'Schedule' }}
          </button>
        </div>

        <section class="ui-detail-card overflow-hidden animate-fade-in min-h-[500px]">
          <div class="flex items-center gap-4 mb-6">
            <h3 class="text-lg font-black text-content-dark whitespace-nowrap capitalize">{{ activeTab }} Repository
            </h3>
            <div class="h-px flex-1 bg-gray-100"></div>
            <button class="px-4 py-2 text-xs font-black uppercase rounded-lg transition-all flex items-center gap-2"
              :class="!isFilterActive ? 'bg-primary-light hover:bg-primary' : ''" :style="isFilterActive ? filterThemeStyles : {}"
              @click="toggleFilter">
              <img :src="getActionIcon('filter')" class="w-3 h-3"
                :style="{ filter: getStatusUI(isFilterActive ? currentFilter : 'filter').filter }" />
              {{ isFilterActive ? getFilterLabel() : 'Filter' }}
            </button>
          </div>

          <div class="p-8">
            <!-- Overview -->
            <div v-if="activeTab === 'overview'" class="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div v-if="infoFilter === 'all' || infoFilter === 'syllabs'" class="space-y-6">
                <div class="p-6 rounded-2xl bg-surface-subtle/50 border border-outline-std/50">
                  <span class="text-[10px] font-black uppercase tracking-widest text-content-muted block mb-3">Program
                    Synopsis</span>
                  <p class="text-sm font-medium leading-relaxed text-content-dark italic">
                    {{ program.description || 'Detailed administrative synopsis pending for this academic program.' }}
                  </p>
                </div>

                <div class="grid grid-cols-2 gap-4">
                  <div class="p-6 rounded-2xl bg-white border border-outline-std shadow-sm">
                    <span
                      class="text-[9px] font-black uppercase tracking-widest text-content-muted block mb-1">Difficulty
                      Level</span>
                    <span class="text-base font-black text-content-dark">{{ program.levelName || 'Standard' }}</span>
                  </div>
                  <div class="p-6 rounded-2xl bg-white border border-outline-std shadow-sm">
                    <span class="text-[9px] font-black uppercase tracking-widest text-content-muted block mb-1">Max
                      Capacity</span>
                    <span class="text-base font-black text-content-dark uppercase">{{ program.maxCapacity || 'Unlimited'
                      }}</span>
                  </div>
                </div>
              </div>

              <div v-if="infoFilter === 'all' || infoFilter === 'specs'" class="space-y-4">
                <div
                  class="p-6 rounded-2xl bg-white border border-outline-std shadow-sm flex items-center justify-between">
                  <div class="flex flex-col">
                    <span class="text-[9px] font-black uppercase tracking-widest text-content-muted block mb-1">Active
                      Schedule</span>
                    <span class="text-lg font-black text-content-dark tracking-tight">{{ program.schedule?.day || 'TBA' }}</span>
                    <span class="text-[10px] font-black text-primary uppercase tracking-widest">{{
                      program.schedule?.timeslot || 'No Time' }}</span>
                  </div>
                  <div class="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center">
                    <img :src="getActionIcon('calendar')" class="w-6 h-6 opacity-30" />
                  </div>
                </div>

                <div
                  class="p-6 rounded-2xl bg-white border border-outline-std shadow-sm flex items-center justify-between">
                  <div class="flex flex-col">
                    <span class="text-[9px] font-black uppercase tracking-widest text-content-muted block mb-1">Total
                      Unit Quota</span>
                    <span class="text-lg font-black text-content-dark tracking-tight">{{ program.totalSessions || 0 }}
                      Sessions</span>
                    <span class="text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                      ${{ (Number(program.basePrice || 0) / (Number(program.totalSessions) || 1)).toFixed(2) }} / unit
                    </span>
                  </div>
                  <div class="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center">
                    <img :src="getActionIcon('payment')" class="w-6 h-6 opacity-30" />
                  </div>
                </div>
              </div>
            </div>

            <!-- Roster -->
            <div v-if="activeTab === 'students'">
              <div class="flex items-center justify-between mb-8">
                <h3 class="text-lg font-black text-content-dark tracking-tight">Student Enrollment Registry</h3>
                <div class="relative group">
                  <input type="text" v-model="searchQuery" placeholder="Filter by name..."
                    class="w-64 pl-10 pr-4 py-2.5 rounded-xl border border-outline-std text-xs font-bold focus:ring-4 focus:ring-primary/5 outline-none transition-all placeholder:text-content-muted/40" />
                  <img :src="getActionIcon('search')" class="absolute left-3.5 top-3 w-4 h-4 opacity-20" />
                </div>
              </div>

              <div v-if="enrolledStudents.length > 0" class="overflow-x-auto rounded-md border border-gray-100 bg-white">
                <table class="w-full text-left border-collapse">
                  <thead>
                    <tr class="bg-gray-50/50">
                      <th class=" p-md text-xs font-black text-content-muted uppercase tracking-widest">No</th>
                      <th class=" p-md text-xs font-black text-content-muted uppercase tracking-widest">Student</th>
                      <th class=" p-md text-xs font-black text-content-muted uppercase tracking-widest text-center">Enrollment Date</th>
                      <th class=" p-md text-xs font-black text-content-muted uppercase tracking-widest text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-50">
                    <tr v-for="(item, idx) in enrolledStudents" :key="item.id"
                      class="hover:bg-gray-50/50 cursor-pointer transition-all"
                      @click="router.push(`/students/${item.studentId}`)">
                      <td class=" p-md text-xs font-bold text-content-muted">{{ idx + 1 }}</td>
                      <td class=" p-md">
                        <div class="flex items-center gap-3">
                          <div class="w-8 h-8 rounded-full overflow-hidden border-2 border-white shadow-sm">
                            <img :src="item.student?.profileURL" class="w-full h-full object-cover" />
                          </div>
                          <span class="text-sm font-bold text-content-dark">{{ item.student?.name }}</span>
                        </div>
                      </td>
                      <td class=" p-md text-xs font-bold text-content-muted text-center tabular-nums">{{ item.enrollAt }}</td>
                      <td class=" p-md text-center">
                        <AppBadge :status="item.displayStatus" />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div v-else class="flex flex-col items-center justify-center py-20 opacity-30">
                <img :src="getImageUrl('common/no-data')" class="w-20 mb-4 grayscale" />
                <span class="text-sm font-black uppercase tracking-widest">No Registered Students</span>
              </div>
            </div>

            <!-- Attendance -->
            <div v-if="activeTab === 'classes'">
              <div v-if="classInstances.length > 0" class="overflow-x-auto rounded-md border border-gray-100 bg-white">
                <table class="w-full text-left border-collapse">
                  <thead>
                    <tr class="bg-gray-50/50">
                      <th class=" p-md text-xs font-black text-content-muted uppercase tracking-widest">No</th>
                      <th class=" p-md text-xs font-black text-content-muted uppercase tracking-widest">Session Date</th>
                      <th class=" p-md text-xs font-black text-content-muted uppercase tracking-widest text-center">Live Status</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-50">
                    <tr v-for="(item, idx) in classInstances" :key="item.id"
                      class="hover:bg-gray-50/50 transition-colors">
                      <td class=" p-md text-xs font-bold text-content-muted">{{ idx + 1 }}</td>
                      <td class=" p-md">
                        <div class="flex flex-col">
                          <span class="text-sm font-bold text-content-dark tabular-nums tracking-tight">{{ item.date }}</span>
                          <span class="text-[10px] font-black text-content-muted uppercase tracking-widest">{{ item.day }} | {{ item.timeslot }}</span>
                        </div>
                      </td>
                      <td class=" p-md text-center">
                        <AppBadge :status="item.status" />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div v-else class="flex flex-col items-center justify-center py-20 opacity-30">
                <img :src="getImageUrl('common/no-data')" class="w-20 mb-4 grayscale" />
                <span class="text-sm font-black uppercase tracking-widest">No Class Records Available</span>
              </div>
            </div>
          </div>
        </section>
      </template>

      <template #right-content v-if="program">
        <div class="flex flex-col gap-8">
          <!-- Basic Info Card -->
          <section class="ui-detail-card flex flex-col items-center gap-6">
            <h2 class="w-full font-black text-content-dark text-center">Basic Information</h2>
            <div class="relative group">
              <div
                class="w-40 h-40 rounded-full overflow-hidden ring-4 ring-white shadow-2xl transition-transform duration-500 group-hover:scale-105 border-2 border-gray-100 bg-surface-subtle p-6">
                <img :src="getProgramProfileURL(program.profileURL, program.category)" alt="Program Logo"
                  class="w-full h-full object-contain" />
              </div>
            </div>
          </section>

          <!-- Program Details Card -->
          <section class="ui-detail-card bg-primary-soft/30 border-primary/10">
            <h6 class="font-black uppercase tracking-widest text-content-muted">Program Information</h6>

            <div class="space-y-5">
              <div class="flex justify-between gap-1">
                <span class="text-lg font-black text-content-dark">Program Name:</span>
                <span class="text-md font-bold text-content-muted">{{ program.name }}</span>
              </div>
              <div class="flex justify-between gap-1">
                <span class="text-lg font-black text-content-dark">Category:</span>
                <span class="text-md font-bold text-content-muted">{{ program.category || 'Standard' }}</span>
              </div>
              <div class="flex justify-between gap-1">
                <span class="text-lg font-black text-content-dark">Skill Level:</span>
                <span class="text-md font-bold text-content-muted">{{ program.levelName || 'Standard' }}</span>
              </div>
              <div class="flex justify-between gap-1">
                <span class="text-lg font-black text-content-dark">Academic Term:</span>
                <span class="text-sm font-bold text-content-muted">{{ program.termName || 'Open Enrollment' }}</span>
              </div>
              <div class="flex justify-between gap-1">
                <span class="text-lg font-black text-content-dark">Base Rate:</span>
                <AppBadge :status="'$' + (program.basePrice || 0)" type="blue" />
              </div>
              <div class="flex justify-between gap-1">
                <span class="text-lg font-black text-content-dark">Capacity:</span>
                <span class="text-md font-bold text-content-muted">{{ program.maxCapacity || 'Unlimited' }}
                  Students</span>
              </div>
              <div class="flex justify-between gap-1">
                <span class="text-lg font-black text-content-dark">Status:</span>
                <div>
                  <AppBadge :status="getProgramDisplayStatus(program)" />
                </div>
              </div>
            </div>
          </section>

          <!-- Assigned Faculty Card -->
          <section class="ui-detail-card bg-primary-soft/30 border-primary/10 mt-6">
            <h6 class="font-black uppercase tracking-widest text-content-muted mb-6">Assigned Faculty</h6>
            <div class="space-y-4">
              <template v-if="program.teachers?.length">
                <div v-for="t in program.teachers" :key="t.id"
                  class="flex items-center gap-3 p-3 rounded-xl bg-white border border-outline-std/50 hover:border-primary/30 transition-all cursor-pointer group shadow-sm">
                  <div class="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-sm">
                    <img :src="t.profileURL" class="w-full h-full object-cover" />
                  </div>
                  <div class="flex flex-col">
                    <span class="text-sm font-black text-content-dark group-hover:text-primary transition-colors">{{ t.name
                      }}</span>
                    <span class="text-[10px] text-content-muted uppercase font-black tracking-widest">{{ t.role ||
                      'Instructor' }}</span>
                  </div>
                </div>
              </template>
              <div v-else
                class="p-6 text-center border-2 border-dashed border-outline-std rounded-2xl opacity-50 text-[10px] font-black uppercase tracking-widest text-content-muted">
                {{ program.teacherName || 'No Faculty Assigned' }}
              </div>
            </div>
          </section>

          <!-- Operational Timestamps -->
          <section class="ui-detail-card bg-surface-subtle/50 mt-6">
            <h6 class="font-black uppercase tracking-widest text-content-muted mb-6">Operational Lifecycle</h6>
            <div class="space-y-4">
              <div class="flex justify-between gap-1">
                <span class="text-lg font-black text-content-dark">Initialized:</span>
                <span class="text-md font-bold text-content-muted tabular-nums">
                  {{ program.createdAt ? new Date(program.createdAt).toLocaleDateString() : 'N/A' }}
                </span>
              </div>
              <div class="flex justify-between gap-1">
                <span class="text-lg font-black text-content-dark">Last Sync:</span>
                <span class="text-md font-bold text-content-muted tabular-nums">
                  {{ program.updatedAt ? new Date(program.updatedAt).toLocaleDateString() : 'Active' }}
                </span>
              </div>
            </div>
          </section>
        </div>
      </template>
    </DetailPageLayout>

    <!-- Shared Filter Menu -->
    <Teleport to="body">
      <transition enter-active-class="transition duration-200 ease-out" enter-from-class="transform scale-95 opacity-0"
        enter-to-class="transform scale-100 opacity-100" leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100" leave-to-class="opacity-0">
        <div v-if="isFilterOpen" class="fixed bg-white rounded-xl shadow-2xl border border-outline-std z-[9999] p-2 min-w-[180px] overflow-hidden"
          :style="filterMenuStyles">
          <div v-for="option in filterOptions" :key="option.value"
            class="px-4 py-2.5 text-sm font-bold cursor-pointer transition-all rounded-lg flex items-center justify-between group"
            :class="[
              currentFilter === option.value ? 'shadow-sm' : '',
              currentFilter === option.value ? '' : 'text-content-muted'
            ]" :style="currentFilter === option.value || hoveredOption === option.value ? {
              backgroundColor: getStatusTheme(option.value).backgroundColor,
              color: getStatusTheme(option.value).color,
              transform: hoveredOption === option.value ? 'translateX(4px)' : ''
            } : {}" @click="selectFilter(option.value)" @mouseenter="hoveredOption = option.value"
            @mouseleave="hoveredOption = null">
            <span>{{ option.label }}</span>
            <div v-if="option.value !== 'all'" class="w-2 h-2 rounded-full transition-transform group-hover:scale-125"
              :style="{ backgroundColor: getStatusTheme(option.value).color }"></div>
          </div>
        </div>
      </transition>
    </Teleport>

    <ProgramActionModal :isOpen="actionModal.isOpen" :type="actionModal.type" :program="actionModal.program"
      :loading="actionModal.loading" v-model:error="actionModal.error" v-model:success="actionModal.success"
      @close="closeModal" @submit="handleActionSubmit" />
  </DashboardLayout>
</template>

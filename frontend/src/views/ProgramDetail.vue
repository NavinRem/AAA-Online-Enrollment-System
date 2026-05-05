<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import DetailPageLayout from '@/components/layout/DetailPageLayout.vue'
import AppBadge from '@/components/common/ui/AppBadge.vue'
import DataTable from '@/components/common/data/DataTable.vue'
import { programService } from '@/services/programService'
import { classService } from '@/services/classService'
import { enrollmentService } from '@/services/enrollmentService'
import { studentService } from '@/services/studentService'
import { trialService } from '@/services/trialService'
import { categoryService } from '@/services/categoryService'
import { getProgramProfileURL, getImageUrl, getActionIcon } from '@/utils/assetHelper'
import { getProgramDisplayStatus } from '@/utils/programHelper'
import { enrichEnrollments } from '@/utils/enrollmentHelper'
import ProgramActionModal from '@/components/programs/ProgramActionModal.vue'
import DetailMetricCard from '@/components/common/data/DetailMetricCard.vue'
import { calculateClassProgress } from '@/utils/formatUtils'

const route = useRoute()
const router = useRouter()

const activeTab = ref('schedule')

const program = ref(null)
const classes = ref([])
const enrollments = ref([])
const students = ref([])
const trials = ref([])
const categories = ref([])
const loading = ref(true)
const errorMessage = ref('')
const now = ref(new Date())

const initData = async () => {
  const id = route.params.id
  loading.value = true
  errorMessage.value = ''

  try {
    const [pData, cData, eData, stdData, tData, catData] = await Promise.all([
      programService.getProgram(id),
      classService.getAllClasses({ programId: id }),
      enrollmentService.getAllEnrollments(),
      studentService.getAllStudents(),
      trialService.getAllTrials(),
      categoryService.getAllCategories(),
    ])

    program.value = pData?.data || pData
    classes.value = Array.isArray(cData) ? cData : (cData?.data || [])

    const allEnrollments = Array.isArray(eData) ? eData : (eData?.data || [])
    enrollments.value = allEnrollments.filter((e) => String(e.programId || '') === String(id))

    students.value = Array.isArray(stdData) ? stdData : (stdData?.data || [])

    const allTrials = Array.isArray(tData) ? tData : (tData?.data || [])
    trials.value = allTrials.filter(t => String(t.programId || '') === String(id))

    categories.value = Array.isArray(catData) ? catData : (catData?.data || [])
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

const resolvedCategory = computed(() => {
  if (!program.value?.categoryId || !categories.value.length) return null
  return categories.value.find(c => c.id === program.value.categoryId)
})

const totalClassCapacity = computed(() => {
  return classes.value.reduce((sum, c) => sum + (c.capacity || c.maxCapacity || 20), 0)
})

const programTeachers = computed(() => {
  if (!classes.value.length) return []
  const teacherMap = new Map()
  classes.value.forEach(c => {
    if (c.teacher && c.teacher.id) {
      if (!teacherMap.has(c.teacher.id)) {
        teacherMap.set(c.teacher.id, { ...c.teacher, branch: c.branch?.name || 'Multiple' })
      }
    }
    if (c.teachers && Array.isArray(c.teachers)) {
      c.teachers.forEach(t => {
        if (t && t.id && !teacherMap.has(t.id)) {
          teacherMap.set(t.id, { ...t, branch: c.branch?.name || 'Multiple' })
        }
      })
    }
  })
  return Array.from(teacherMap.values())
})

const statsCards = computed(() => {
  if (!program.value) return []

  const totalRevenue = enrollments.value
    .filter((e) => ['paid', 'confirmed'].includes(String(e.status || e.paymentStatus).toLowerCase()))
    .reduce((sum, e) => sum + Number(e.amount || program.value.basePrice || 0), 0)

  const scheduledCount = classes.value.length
  const uniqueTeachersCount = programTeachers.value.length
  const uniqueStudentsCount = new Set(enrollments.value.map(e => e.studentId).filter(Boolean)).size

  // Trial Trend Calculation
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const sixtyDaysAgo = new Date()
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)

  const currentPeriodTrials = trials.value.filter(t => new Date(t.trialDate) >= thirtyDaysAgo).length
  const previousPeriodTrials = trials.value.filter(t => {
    const d = new Date(t.trialDate)
    return d >= sixtyDaysAgo && d < thirtyDaysAgo
  }).length

  const trialDiff = currentPeriodTrials - previousPeriodTrials

  return [
    {
      label: 'Total Students',
      value: uniqueStudentsCount,
      image: getImageUrl('data-metric-card/total-enrolled'),
      color: 'var(--color-primary-light)',
    },
    {
      label: 'Total Revenue',
      value: `$${totalRevenue.toLocaleString()}`,
      image: getImageUrl('data-metric-card/program-revenue'),
      color: 'var(--color-primary-light)',
    },
    {
      label: 'Total Trials',
      value: trials.value.length,
      image: getImageUrl('data-metric-card/trial'),
      color: 'var(--color-primary-light)',
    },
    {
      label: 'Assigned Teachers',
      value: uniqueTeachersCount,
      image: getImageUrl('data-metric-card/enrollment-capacity'),
      color: 'var(--color-primary-light)',
    }
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

  // Sort active to top
  return enriched.sort((a, b) => {
    const isAActive = ['active', 'paid', 'confirmed'].includes(String(a.status || a.paymentStatus).toLowerCase())
    const isBActive = ['active', 'paid', 'confirmed'].includes(String(b.status || b.paymentStatus).toLowerCase())
    if (isAActive && !isBActive) return -1
    if (!isAActive && isBActive) return 1
    return 0
  })
})

const studentHeaders = [
  { label: 'No', width: '50px', align: 'center' },
  { label: 'Name' },
  { label: 'Parent' },
  { label: 'Age', align: 'center', width: '80px' },
  { label: 'Status', align: 'center', width: '120px' },
]

const teacherHeaders = [
  { label: 'No', width: '50px', align: 'center' },
  { label: 'Name' },
  { label: 'Branch Teaching', align: 'center', width: '150px' },
  { label: 'Contact', width: '200px' },
]

const scheduleHeaders = [
  { label: 'No', width: '50px', align: 'center' },
  { label: 'Day & Time' },
  { label: 'Branch', align: 'center', width: '100px' },
  { label: 'Term' },
  { label: 'Capacity', align: 'center', width: '150px' },
  { label: 'Status', align: 'center', width: '120px' },
]

const trialHeaders = [
  { label: 'No', width: '50px', align: 'center' },
  { label: 'Student' },
  { label: 'Parent' },
  { label: 'Branch', align: 'center', width: '100px' },
  { label: 'Time of Trial', align: 'center', width: '180px' },
  { label: 'Status', align: 'center', width: '150px' },
]

const currentHeaders = computed(() => {
  if (activeTab.value === 'schedule') return scheduleHeaders
  if (activeTab.value === 'teachers') return teacherHeaders
  if (activeTab.value === 'trials') return trialHeaders
  return studentHeaders
})

const currentItems = computed(() => {
  if (activeTab.value === 'schedule') return classes.value.map(c => ({
    ...c,
    // Ensure schedule object exists for template safety
    schedule: c.schedule || { day: 'TBA', time: 'N/A' },
    maxCapacity: c.maxCapacity || 20,
    enrolledCount: c.enrolledCount || 0
  }))
  if (activeTab.value === 'teachers') return programTeachers.value
  if (activeTab.value === 'trials') return trials.value.sort((a, b) => new Date(b.trialDate) - new Date(a.trialDate))
  return enrolledStudents.value
})



const currentEntityName = computed(() => {
  if (activeTab.value === 'schedule') return 'schedule'
  if (activeTab.value === 'teachers') return 'teacher'
  if (activeTab.value === 'trials') return 'trial'
  return 'student'
})

const currentTableTitle = computed(() => {
  if (activeTab.value === 'schedule') return 'Program Schedule'
  if (activeTab.value === 'teachers') return 'Faculty Registry'
  if (activeTab.value === 'trials') return 'Trial Records'
  return 'Student Roster'
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
    <DetailPageLayout :loading="loading" :errorMessage="errorMessage" backRoute="/programs" title="Program Analytics"
      sidebarWidth="sm">
      <template #header-actions v-if="program">
        <div class="flex items-center">
          <button
            class="w-11 h-11 flex items-center justify-center rounded-full border border-outline-std bg-primary-light transition-all duration-300 hover:bg-primary hover:border-primary group"
            title="Edit Program" @click="openActionModal('edit')">
            <img :src="getActionIcon('edit')" class="w-5 h-5 group-hover:opacity-100 transition-opacity" />
          </button>
          <div class="w-px h-6 bg-outline-std/50 mx-1"></div>
          <button
            class="w-11 h-11 flex items-center justify-center rounded-full border border-outline-std bg-error-soft transition-all duration-300 hover:bg-error hover:border-error group"
            title="Delete Program" @click="openActionModal('delete')">
            <img :src="getActionIcon('delete')"
              class="w-5 h-5 icon-danger group-hover:opacity-100 transition-opacity" />
          </button>
        </div>
      </template>

      <template #left-content v-if="program">
        <!-- Metrics Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <DetailMetricCard v-for="stat in statsCards" :key="stat.label" v-bind="stat" />
        </div>

        <!-- Tab Navigation -->
        <div class="flex items-center gap-2 p-xs bg-white rounded-full border border-outline-std w-fit">
          <button v-for="tab in ['schedule', 'teachers', 'students', 'trials']" :key="tab"
            class="px-8 py-3 rounded-2xl text-xs font-semibold uppercase tracking-widest transition-all duration-300"
            :class="activeTab === tab ? 'bg-primary text-white shadow-md ring-1 ring-black/5 scale-[1.02]' : 'text-content-muted hover:text-content-dark hover:bg-white/50'"
            @click="activeTab = tab">
            {{ tab === 'schedule' ? 'Schedule' : tab === 'teachers' ? 'Teachers' : tab === 'students' ? 'Students' :
              'Trials' }}
          </button>
        </div>

        <section class="overflow-hidden animate-fade-in min-h-[500px]">
          <DataTable :title="currentTableTitle" :headers="currentHeaders" :items="currentItems" :loading="loading"
            :entityName="currentEntityName" :flexible="true" :hasSearch="false" :hasFilter="false">

            <template #row="{ item, index, headers }">
              <!-- Schedule Row -->
              <template v-if="activeTab === 'schedule'">
                <td class="ui-cell text-center font-bold text-content-muted/20" :style="{ width: headers[0].width }">
                  {{ index + 1 }}
                </td>
                <td class="ui-cell">
                  <div class="flex flex-col gap-1 items-start">
                    <AppBadge :status="item.schedule.day" :type="['Saturday', 'Sunday'].includes(item.schedule.day) ? 'blue' : 'gray'"
                      size="sm" />
                    <span class="text-sm font-semibold text-content-dark tracking-tight leading-none">{{ item.schedule.time
                    }}</span>
                  </div>
                </td>
                <td class="ui-cell text-center" :style="{ width: headers[2].width }">
                  <AppBadge :status="item.branch?.abbr || 'TBA'" :type="item.branch?.color || 'blue'" />
                </td>
                <td class="ui-cell">
                  <span class="text-sm font-semibold text-content-dark tracking-tight">{{ item.term?.name || 'Active Term'
                  }}</span>
                </td>
                <td class="ui-cell" :style="{ width: headers[4].width }">
                  <div class="flex flex-col items-center gap-2 w-full px-4">
                    <div
                      class="w-full h-1.5 bg-surface-subtle rounded-full overflow-hidden shadow-inner ring-1 ring-black/5">
                      <div class="h-full transition-all duration-700 ease-out rounded-full"
                        :style="{ width: (item.enrolledCount / item.maxCapacity) * 100 + '%' }"
                        :class="(item.enrolledCount / item.maxCapacity) >= 1 ? 'bg-error' : (item.enrolledCount / item.maxCapacity) >= 0.8 ? 'bg-warning' : 'bg-emerald-500'">
                      </div>
                    </div>
                    <span class="text-[10px] font-semibold text-content-muted tabular-nums tracking-widest uppercase">{{
                      item.enrolledCount || 0 }}/{{ item.maxCapacity || 20 }}</span>
                  </div>
                </td>
                <td class="ui-cell text-center" :style="{ width: headers[5].width }">
                  <AppBadge
                    :status="calculateClassProgress(item.term?.startDate, item.term?.endDate, item.schedule.day, item.schedule.time).status"
                    :type="{
                      'upcoming': 'blue',
                      'archived': 'neutral',
                      'ongoing': 'success',
                      'active': 'success'
                    }[calculateClassProgress(item.term?.startDate, item.term?.endDate, item.schedule.day, item.schedule.time).status] || 'success'" />
                </td>
              </template>

              <!-- Teachers Row -->
              <template v-else-if="activeTab === 'teachers'">
                <td class="ui-cell text-center font-bold text-content-muted/20" :style="{ width: headers[0].width }">
                  {{ index + 1 }}
                </td>
                <td class="ui-cell">
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-full overflow-hidden border-2 border-white shadow-sm shrink-0">
                      <img :src="item.profileURL || getImageUrl('common/default-avatar')"
                        class="w-full h-full object-cover" />
                    </div>
                    <div class="flex flex-col">
                      <span class="text-sm font-semibold text-content-dark">{{ item.name }}</span>
                      <span class="text-[10px] font-semibold text-content-muted uppercase tracking-widest">{{
                        item.role || 'Instructor' }}</span>
                    </div>
                  </div>
                </td>
                <td class="ui-cell text-center" :style="{ width: headers[2].width }">
                  <AppBadge :status="item.branch || 'Multiple'" type="blue" />
                </td>
                <td class="ui-cell text-xs font-semibold text-content-muted">
                  {{ item.email || 'N/A' }}
                </td>
              </template>

              <!-- Students Row -->
              <template v-else-if="activeTab === 'students'">
                <td class="ui-cell text-center font-bold text-content-muted/20" :style="{ width: headers[0].width }">
                  {{ index + 1 }}
                </td>
                <td class="ui-cell">
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-full overflow-hidden border-2 border-white shadow-sm shrink-0">
                      <img :src="item.student?.profileURL || getImageUrl('common/default-avatar')"
                        class="w-full h-full object-cover" />
                    </div>
                    <div class="flex flex-col">
                      <span class="text-sm font-semibold text-content-dark">{{ item.student?.name || 'Unknown Student'
                        }}</span>
                      <span class="text-[10px] font-semibold text-primary uppercase tracking-widest">{{ item.programName ||
                        'Program' }}</span>
                    </div>
                  </div>
                </td>
                <td class="ui-cell">
                  <span class="text-xs font-semibold text-content-muted">{{ item.student?.parentName || 'N/A' }}</span>
                </td>
                <td class="ui-cell text-center text-xs font-semibold text-content-muted tabular-nums">
                  {{ item.student?.age || 'N/A' }}
                </td>
                <td class="ui-cell text-center">
                  <AppBadge :status="item.status || item.paymentStatus || 'Enrolled'"
                    :type="['paid', 'active', 'confirmed'].includes(String(item.status || item.paymentStatus).toLowerCase()) ? 'success' : 'warning'" />
                </td>
              </template>

              <!-- Trials Row -->
              <template v-else-if="activeTab === 'trials'">
                <td class="ui-cell text-center font-bold text-content-muted/20" :style="{ width: headers[0].width }">
                  {{ index + 1 }}
                </td>
                <td class="ui-cell">
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-full overflow-hidden border-2 border-white shadow-sm shrink-0">
                      <img :src="item.student?.profileURL || getImageUrl('common/default-avatar')"
                        class="w-full h-full object-cover" />
                    </div>
                    <div class="flex flex-col">
                      <span class="text-sm font-semibold text-content-dark">{{ item.student?.name || item.guestStudentName
                      }}</span>
                      <span class="text-[10px] font-semibold text-primary uppercase tracking-widest">{{ item.isGuest ?
                        'Guest Prospect' : 'Registered Student' }}</span>
                    </div>
                  </div>
                </td>
                <td class="ui-cell">
                  <span class="text-xs font-semibold text-content-muted">{{ item.parent?.name || item.guestParentName ||
                    'Guest Parent' }}</span>
                </td>
                <td class="ui-cell text-center" :style="{ width: headers[3].width }">
                  <AppBadge :status="item.branch?.abbr || 'HQ'" type="blue" />
                </td>
                <td class="ui-cell text-center" :style="{ width: headers[4].width }">
                  <div class="flex flex-col items-center">
                    <span class="text-[11px] font-semibold text-content-dark tabular-nums tracking-tight">{{
                      item.trialDate ? new Date(item.trialDate).toLocaleDateString() : 'N/A' }}</span>
                    <span class="text-[10px] font-semibold text-content-muted">{{ item.trialTime || '' }}</span>
                  </div>
                </td>
                <td class="ui-cell text-center" :style="{ width: headers[5].width }">
                  <div class="flex flex-col items-center gap-1">
                    <AppBadge :status="item.trialType || (item.isGuest ? 'walk-in' : 'booked')" />
                    <AppBadge v-if="item.isSuccessful" status="Successful" type="success" />
                  </div>
                </td>
              </template>
            </template>
          </DataTable>


        </section>
      </template>

      <template #right-content v-if="program">
        <div class="flex flex-col gap-md">
          <!-- Basic Info Card -->
          <section class="ui-detail-card flex flex-col items-center gap-6">
            <h2 class="w-full font-bold text-content-dark text-center">Basic Information</h2>
            <div class="relative group">
              <div
                class="w-40 h-40 rounded-full overflow-hidden ring-4 ring-white shadow-2xl 
                transition-transform duration-500 group-hover:scale-105 border-2 border-gray-100 bg-surface-subtle p-6">
                <img
                  :src="getProgramProfileURL(program.profileURL, program.category, resolvedCategory?.profileURL || program.categorySnapshot?.profileURL)"
                  alt="Program Logo" class="w-full h-full object-contain" />
              </div>
            </div>
          </section>

          <!-- Program Details Card -->
          <section class="ui-detail-card">
            <div class="space-y-5">
              <div class="flex justify-between gap-1">
                <span class="text-lg font-bold text-content-dark">Program Name:</span>
                <span class="text-md font-bold text-content-muted">{{ program.name }}</span>
              </div>
              <div class="flex justify-between gap-1">
                <span class="text-lg font-bold text-content-dark">Category:</span>
                <span class="text-md font-bold text-content-muted">{{ program.category || 'Standard' }}</span>
              </div>
              <div class="flex justify-between gap-1">
                <span class="text-lg font-bold text-content-dark">Level:</span>
                <span class="text-md font-bold text-content-muted">{{ program.level || 'Standard' }}</span>
              </div>
              <div class="flex justify-between gap-1">
                <span class="text-lg font-bold text-content-dark">Type:</span>
                <AppBadge :status="program.type || 'Group'" type="tag" />
              </div>
              <div class="flex justify-between gap-1">
                <span class="text-lg font-bold text-content-dark">Base Price:</span>
                <AppBadge :status="'$' + (program.basePrice || 0)" type="blue" />
              </div>
              <div class="flex justify-between gap-1">
                <span class="text-lg font-bold text-content-dark">Sessions:</span>
                <span class="text-md font-bold text-content-muted tabular-nums">{{ program.totalSessions || 0 }}</span>
              </div>
              <div class="flex justify-between gap-1">
                <span class="text-lg font-bold text-content-dark">Age Range:</span>
                <span class="text-md font-bold text-content-muted">{{ program.minAge }} - {{ program.maxAge }}
                  years</span>
              </div>
              <div class="flex justify-between gap-1">
                <span class="text-lg font-bold text-content-dark">Capacity:</span>
                <div class="flex items-center gap-2">
                  <span class="text-md font-bold text-content-muted">{{ program.maxCapacity || 'Unlimited' }}</span>
                  <span v-if="!program.maxCapacity"
                    class="text-[10px] font-semibold text-primary uppercase tracking-widest">(Active: {{ totalClassCapacity
                    }})</span>
                </div>
              </div>
              <div class="flex justify-between gap-1">
                <span class="text-lg font-bold text-content-dark">Status:</span>
                <div>
                  <AppBadge :status="getProgramDisplayStatus(program)" />
                </div>
              </div>
              <div v-if="program.description">
                <span class="text-lg font-bold text-content-dark">Description:</span>
                <p class="text-xs font-medium text-content-muted leading-relaxed italic">{{ program.description }}</p>
              </div>
            </div>
          </section>




        </div>
      </template>
    </DetailPageLayout>



    <ProgramActionModal :isOpen="actionModal.isOpen" :type="actionModal.type" :program="actionModal.program"
      :loading="actionModal.loading" v-model:error="actionModal.error" v-model:success="actionModal.success"
      @close="closeModal" @submit="handleActionSubmit" />
  </DashboardLayout>
</template>

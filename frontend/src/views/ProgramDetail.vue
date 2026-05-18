<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { branchService } from '@/services/branchService'
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
const branches = ref([])
const terms = ref([])
const loading = ref(true)
const errorMessage = ref('')
const now = ref(new Date())

const initData = async () => {
  const id = route.params.id
  loading.value = true
  errorMessage.value = ''

  try {
    const [pData, cData, eData, stdData, tData, catData, bData, termData] = await Promise.all([
      programService.getProgram(id),
      classService.getAllClasses({ programId: id }),
      enrollmentService.getAllEnrollments({ limit: 2000 }),
      studentService.getAllStudents(),
      trialService.getAllTrials(),
      categoryService.getAllCategories(),
      branchService.getAllBranches(),
      import('@/services/termService').then((m) => m.termService.getAllTerms()),
    ])

    program.value = pData?.data || pData
    classes.value = Array.isArray(cData) ? cData : cData?.data || []

    const allEnrollments = Array.isArray(eData) ? eData : eData?.data || []
    enrollments.value = allEnrollments.filter((e) => String(e.programId || '') === String(id))

    students.value = Array.isArray(stdData) ? stdData : stdData?.data || []

    const allTrials = Array.isArray(tData) ? tData : tData?.data || []
    trials.value = allTrials.filter((t) => String(t.programId || '') === String(id))

    categories.value = Array.isArray(catData) ? catData : catData?.data || []
    branches.value = Array.isArray(bData) ? bData : bData?.data || []
    terms.value = Array.isArray(termData) ? termData : []
  } catch (err) {
    console.error('Error fetching program details:', err)
    errorMessage.value = 'Failed to load program details'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  initData()
  const interval = setInterval(() => {
    now.value = new Date()
  }, 60000)

  onUnmounted(() => {
    clearInterval(interval)
  })
})

const resolvedCategory = computed(() => {
  if (!program.value?.categoryId || !categories.value.length) return null
  return categories.value.find((c) => String(c.id) === String(program.value.categoryId))
})

const programTeachers = computed(() => {
  if (!classes.value.length) return []
  const teacherMap = new Map()
  classes.value.forEach((c) => {
    if (c.teacher && c.teacher.id) {
      if (!teacherMap.has(c.teacher.id)) {
        teacherMap.set(c.teacher.id, { ...c.teacher, branch: c.branch?.name || 'Multiple' })
      }
    }
    if (c.teachers && Array.isArray(c.teachers)) {
      c.teachers.forEach((t) => {
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
    .filter((e) =>
      ['paid', 'confirmed'].includes(String(e.status || e.paymentStatus).toLowerCase()),
    )
    .reduce((sum, e) => sum + Number(e.amount || program.value.basePrice || 0), 0)

  const uniqueTeachersCount = programTeachers.value.length
  const uniqueStudentsCount = new Set(enrollments.value.map((e) => e.studentId).filter(Boolean))
    .size

  return [
    {
      label: 'Total Students',
      value: uniqueStudentsCount,
      image: getImageUrl('data-metric-card/total-enrolled'),
    },
    {
      label: 'Total Revenue',
      value: `$${totalRevenue.toLocaleString()}`,
      image: getImageUrl('data-metric-card/program-revenue'),
    },
    {
      label: 'Total Trials',
      value: trials.value.length,
      image: getImageUrl('dashboard/card-trial'),
    },
    {
      label: 'Assigned Teachers',
      value: uniqueTeachersCount,
      image: getImageUrl('data-metric-card/enrollment-capacity'),
    },
  ]
})

const branchDistribution = computed(() => {
  if (!branches.value.length || !terms.value.length) return []

  const distribution = []

  branches.value.forEach((branch) => {
    terms.value.forEach((term) => {
      // Filter enrollments for THIS program, THIS branch, and THIS term
      const branchTermEnrollments = enrollments.value.filter((e) => {
        const eBranchId = e.branchId || e.class?.branchId || e.class?.branch?.id
        const eTermId = e.termId || e.class?.termId || e.class?.term?.id
        return String(eBranchId) === String(branch.id) && String(eTermId) === String(term.id)
      })

      // Filter classes for THIS program in THIS branch and THIS term
      const branchTermClasses = classes.value.filter((c) => {
        const cBranchId = c.branchId || c.branch?.id
        const cTermId = c.termId || c.term?.id
        return String(cBranchId) === String(branch.id) && String(cTermId) === String(term.id)
      })

      if (branchTermEnrollments.length > 0 || branchTermClasses.length > 0) {
        const studentCount = new Set(branchTermEnrollments.map((e) => e.studentId)).size
        const revenue = branchTermEnrollments
          .filter((e) =>
            ['paid', 'confirmed', 'active'].includes(
              String(e.paymentStatus || e.status).toLowerCase(),
            ),
          )
          .reduce((sum, e) => sum + Number(e.amount || 0), 0)

        distribution.push({
          branch,
          term,
          studentCount,
          classCount: branchTermClasses.length,
          revenue,
        })
      }
    })
  })

  // Sort by term end date (newest first), then by branch name
  return distribution.sort((a, b) => {
    const dateA = new Date(a.term.endDate).getTime()
    const dateB = new Date(b.term.endDate).getTime()
    if (dateB !== dateA) return dateB - dateA
    return a.branch.name.localeCompare(b.branch.name)
  })
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
    const isAActive = ['active', 'paid', 'confirmed'].includes(
      String(a.status || a.paymentStatus).toLowerCase(),
    )
    const isBActive = ['active', 'paid', 'confirmed'].includes(
      String(b.status || b.paymentStatus).toLowerCase(),
    )
    if (isAActive && !isBActive) return -1
    if (!isAActive && isBActive) return 1
    return 0
  })
})

const studentHeaders = [
  { label: 'No', width: '50px', align: 'center' },
  { label: 'Student Identity' },
  { label: 'Parent Name' },
  { label: 'Age', align: 'center', width: '80px' },
  { label: 'Status', align: 'center', width: '120px' },
]

const teacherHeaders = [
  { label: 'No', width: '50px', align: 'center' },
  { label: 'Teacher Name' },
  { label: 'Branch Teaching', align: 'center', width: '150px' },
  { label: 'Contact', width: '200px' },
]

const scheduleHeaders = [
  { label: 'No', width: '50px', align: 'center' },
  { label: 'Schedule Identity' },
  { label: 'Branch', align: 'center', width: '100px' },
  { label: 'Term' },
  { label: 'Capacity', align: 'center', width: '200px' },
  { label: 'Status', align: 'center', width: '120px' },
]

const trialHeaders = [
  { label: 'No', width: '50px', align: 'center' },
  { label: 'Student Identity' },
  { label: 'Parent Name' },
  { label: 'Branch', align: 'center', width: '100px' },
  { label: 'Time of Trial', align: 'center', width: '180px' },
  { label: 'Status', align: 'center', width: '150px' },
]

const distributionHeaders = [
  { label: 'No', width: '50px', align: 'center' },
  { label: 'Branch', width: '180px' },
  { label: 'Term', width: '180px' },
  { label: 'Students', align: 'center', width: '100px' },
  { label: 'Classes', align: 'center', width: '100px' },
  { label: 'Revenue', align: 'center', width: '120px' },
]

const currentHeaders = computed(() => {
  if (activeTab.value === 'schedule') return scheduleHeaders
  if (activeTab.value === 'teachers') return teacherHeaders
  if (activeTab.value === 'trials') return trialHeaders
  if (activeTab.value === 'distribution') return distributionHeaders
  return studentHeaders
})

const currentItems = computed(() => {
  if (activeTab.value === 'schedule')
    return classes.value.map((c) => ({
      ...c,
      // Ensure schedule object exists for template safety
      schedule: c.schedule || { day: 'TBA', time: 'N/A' },
      maxCapacity: c.maxCapacity || 20,
      enrolledCount: c.enrolledCount || 0,
    }))
  if (activeTab.value === 'teachers') return programTeachers.value
  if (activeTab.value === 'trials')
    return [...trials.value].sort((a, b) => new Date(b.trialDate) - new Date(a.trialDate))
  if (activeTab.value === 'distribution') return branchDistribution.value
  return enrolledStudents.value
})

const currentEntityName = computed(() => {
  if (activeTab.value === 'schedule') return 'schedule'
  if (activeTab.value === 'teachers') return 'teacher'
  if (activeTab.value === 'trials') return 'trial'
  if (activeTab.value === 'distribution') return 'branch distribution'
  return 'student'
})

const currentTableTitle = computed(() => {
  if (activeTab.value === 'schedule') return 'Program Schedule'
  if (activeTab.value === 'teachers') return 'Faculty Registry'
  if (activeTab.value === 'trials') return 'Trial Records'
  if (activeTab.value === 'distribution') return 'Branch-Wise Performance'
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
    <DetailPageLayout
      :loading="loading"
      :errorMessage="errorMessage"
      backRoute="/programs"
      title="Program Analytics"
      sidebarWidth="sm"
    >
      <template #header-actions v-if="program">
        <div class="flex items-center gap-3">
          <button
            class="w-11 h-11 flex items-center justify-center rounded-full border border-outline-std bg-primary-soft transition-all duration-300 hover:bg-primary hover:border-primary group"
            title="Edit Program"
            @click="openActionModal('edit')"
          >
            <img :src="getActionIcon('edit')" class="w-5 h-5 brightness-0 transition-all" />
          </button>
          <button
            class="w-11 h-11 flex items-center justify-center rounded-full border border-outline-std bg-error-soft transition-all duration-300 hover:bg-error hover:border-error group"
            title="Delete Program"
            @click="openActionModal('delete')"
          >
            <img :src="getActionIcon('delete')" class="w-5 h-5 brightness-0 transition-all" />
          </button>
        </div>
      </template>

      <template #left-content v-if="program">
        <!-- Metrics Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <DetailMetricCard v-for="stat in statsCards" :key="stat.label" v-bind="stat" />
        </div>

        <!-- Tab Navigation -->
        <div
          class="flex items-center gap-2 p-xs bg-white rounded-full border border-outline-std w-fit"
        >
          <button
            v-for="tab in ['schedule', 'teachers', 'students', 'trials', 'distribution']"
            :key="tab"
            class="px-8 py-3 rounded-2xl text-xs font-semibold transition-all duration-300"
            :class="
              activeTab === tab
                ? 'bg-primary text-white shadow-md ring-1 ring-black/5 scale-[1.02]'
                : 'text-content-muted hover:text-content-dark hover:bg-white/50'
            "
            @click="activeTab = tab"
          >
            {{
              tab === 'schedule'
                ? 'Schedule'
                : tab === 'teachers'
                  ? 'Teachers'
                  : tab === 'students'
                    ? 'Students'
                    : tab === 'trials'
                      ? 'Trials'
                      : 'Distribution'
            }}
          </button>
        </div>

        <section class="overflow-hidden animate-fade-in min-h-[500px]">
          <DataTable
            :title="currentTableTitle"
            :headers="currentHeaders"
            :items="currentItems"
            :loading="loading"
            :entityName="currentEntityName"
            :flexible="true"
            :hasSearch="false"
            :hasFilter="false"
          >
            <template #row="{ item, index, headers }">
              <!-- Schedule Row -->
              <template v-if="activeTab === 'schedule'">
                <td class="ui-cell text-center" :style="{ width: headers[0].width }">
                  <span class="font-bold text-content-dark text-sm">{{ index + 1 }}</span>
                </td>
                <td class="ui-cell">
                  <div class="flex flex-col gap-1 items-start">
                    <AppBadge
                      :status="item.schedule.day"
                      :type="['Saturday', 'Sunday'].includes(item.schedule.day) ? 'blue' : 'gray'"
                    />
                    <span class="text-xs font-bold text-content-dark leading-none tabular-nums">{{
                      item.schedule.time
                    }}</span>
                  </div>
                </td>
                <td class="ui-cell text-center" :style="{ width: headers[2].width }">
                  <AppBadge
                    :status="item.branch?.abbr || 'TBA'"
                    :type="item.branch?.color || 'blue'"
                  />
                </td>
                <td class="ui-cell">
                  <span class="text-xs font-bold text-content-muted tabular-nums">{{
                    item.term?.name
                  }}</span>
                </td>
                <td class="ui-cell text-center" :style="{ width: headers[4].width }">
                  <div class="flex flex-col items-center gap-2 w-full px-4">
                    <div
                      class="w-full h-1.5 bg-surface-subtle rounded-full overflow-hidden shadow-inner ring-1 ring-black/5"
                    >
                      <div
                        class="h-full transition-all duration-700 ease-out rounded-full"
                        :style="{
                          width:
                            (item.capacity || item.maxCapacity
                              ? ((item.currentCount || item.enrolledCount) /
                                  (item.capacity || item.maxCapacity)) *
                                100
                              : 0) + '%',
                        }"
                        :class="
                          (item.capacity || item.maxCapacity) &&
                          (item.currentCount || item.enrolledCount) /
                            (item.capacity || item.maxCapacity) >=
                            1
                            ? 'bg-error'
                            : (item.capacity || item.maxCapacity) &&
                                (item.currentCount || item.enrolledCount) /
                                  (item.capacity || item.maxCapacity) >=
                                  0.8
                              ? 'bg-warning'
                              : 'bg-emerald-500'
                        "
                      ></div>
                    </div>
                    <span class="tabular-nums text-xs font-bold text-content-dark">
                      {{ item.currentCount || item.enrolledCount || 0 }}/{{
                        item.capacity || item.maxCapacity || '∞'
                      }}
                    </span>
                  </div>
                </td>
                <td class="ui-cell text-center" :style="{ width: headers[5].width }">
                  <AppBadge
                    :status="
                      calculateClassProgress(
                        item.term?.startDate,
                        item.term?.endDate,
                        item.schedule.day,
                        item.schedule.time,
                      ).status
                    "
                    :type="
                      {
                        upcoming: 'blue',
                        archived: 'neutral',
                        ongoing: 'success',
                        active: 'success',
                      }[
                        calculateClassProgress(
                          item.term?.startDate,
                          item.term?.endDate,
                          item.schedule.day,
                          item.schedule.time,
                        ).status
                      ] || 'success'
                    "
                  />
                </td>
              </template>

              <!-- Teachers Row -->
              <template v-else-if="activeTab === 'teachers'">
                <td class="ui-cell text-center" :style="{ width: headers[0].width }">
                  <span class="font-bold text-content-dark text-sm">{{ index + 1 }}</span>
                </td>
                <td class="ui-cell">
                  <div class="flex items-center gap-3">
                    <div
                      class="w-8 h-8 rounded-full overflow-hidden border-2 border-white shadow-sm shrink-0"
                    >
                      <img
                        :src="item.profileURL || getImageUrl('common/default-avatar')"
                        class="w-full h-full object-cover"
                      />
                    </div>
                    <div class="flex flex-col">
                      <span class="font-bold text-content-dark text-sm">{{ item.name }}</span>
                      <span class="text-3xs font-bold text-content-muted">{{
                        item.role || 'Instructor'
                      }}</span>
                    </div>
                  </div>
                </td>
                <td class="ui-cell text-center" :style="{ width: headers[2].width }">
                  <AppBadge :status="item.branch || 'Multiple'" type="blue" />
                </td>
                <td class="ui-cell">
                  <span class="text-xs font-bold text-content-muted">{{
                    item.email || 'N/A'
                  }}</span>
                </td>
              </template>

              <!-- Students Row -->
              <template v-else-if="activeTab === 'students'">
                <td class="ui-cell text-center" :style="{ width: headers[0].width }">
                  <span class="font-bold text-content-dark text-sm">{{ index + 1 }}</span>
                </td>
                <td class="ui-cell">
                  <div class="flex items-center gap-3">
                    <div
                      class="w-8 h-8 rounded-full overflow-hidden border-2 border-white shadow-sm shrink-0"
                    >
                      <img
                        :src="item.student?.profileURL || getImageUrl('common/default-avatar')"
                        class="w-full h-full object-cover"
                      />
                    </div>
                    <div class="flex flex-col">
                      <span class="font-bold text-content-dark text-sm">{{
                        item.student?.name || 'Unknown Student'
                      }}</span>
                      <span
                        class="text-3xs font-bold text-content-muted uppercase tracking-tighter"
                        >{{ item.programName || 'Program' }}</span
                      >
                    </div>
                  </div>
                </td>
                <td class="ui-cell">
                  <span class="text-xs font-bold text-content-dark">{{
                    item.student?.parentName || 'N/A'
                  }}</span>
                </td>
                <td class="ui-cell text-center tabular-nums text-sm font-bold text-content-dark">
                  {{ item.student?.age || 'N/A' }}
                </td>
                <td class="ui-cell text-center">
                  <AppBadge
                    :status="item.status || item.paymentStatus || 'Enrolled'"
                    :type="
                      ['paid', 'active', 'confirmed'].includes(
                        String(item.status || item.paymentStatus).toLowerCase(),
                      )
                        ? 'success'
                        : 'warning'
                    "
                  />
                </td>
              </template>

              <!-- Trials Row -->
              <template v-else-if="activeTab === 'trials'">
                <td class="ui-cell text-center" :style="{ width: headers[0].width }">
                  <span class="font-bold text-content-dark text-sm">{{ index + 1 }}</span>
                </td>
                <td class="ui-cell">
                  <div class="flex items-center gap-3">
                    <div
                      class="w-8 h-8 rounded-full overflow-hidden border-2 border-white shadow-sm shrink-0"
                    >
                      <img
                        :src="item.student?.profileURL || getImageUrl('common/default-avatar')"
                        class="w-full h-full object-cover"
                      />
                    </div>
                    <div class="flex flex-col">
                      <span class="font-bold text-content-dark text-sm">{{
                        item.student?.name || item.guestStudentName
                      }}</span>
                      <span class="text-3xs font-bold text-content-muted">{{
                        item.isGuest ? 'Guest Prospect' : 'Registered Student'
                      }}</span>
                    </div>
                  </div>
                </td>
                <td class="ui-cell">
                  <span class="text-xs font-bold text-content-dark">{{
                    item.parent?.name || item.guestParentName || 'Guest Parent'
                  }}</span>
                </td>
                <td class="ui-cell text-center" :style="{ width: headers[3].width }">
                  <AppBadge :status="item.branch?.abbr || 'HQ'" type="blue" />
                </td>
                <td class="ui-cell text-center" :style="{ width: headers[4].width }">
                  <div class="flex flex-col items-center">
                    <span class="tabular-nums text-xs font-bold text-content-dark">{{
                      item.trialDate ? new Date(item.trialDate).toLocaleDateString() : 'N/A'
                    }}</span>
                    <span class="text-3xs font-bold text-content-muted tabular-nums">{{
                      item.trialTime || ''
                    }}</span>
                  </div>
                </td>
                <td class="ui-cell text-center" :style="{ width: headers[5].width }">
                  <div class="flex flex-col items-center gap-1">
                    <AppBadge :status="item.trialType || (item.isGuest ? 'walk-in' : 'booked')" />
                    <AppBadge v-if="item.isSuccessful" status="Successful" type="success" />
                  </div>
                </td>
              </template>

              <!-- Distribution Row -->
              <template v-else-if="activeTab === 'distribution'">
                <td class="ui-cell text-center" :style="{ width: headers[0].width }">
                  <span class="font-bold text-content-dark text-sm">{{ index + 1 }}</span>
                </td>
                <td class="ui-cell">
                  <div class="flex items-center gap-2">
                    <span class="text-sm font-bold text-content-dark tracking-tighter">{{
                      item.branch?.name
                    }}</span>
                    <AppBadge :status="item.branch?.abbr" :type="item.branch?.color || 'blue'" />
                  </div>
                </td>
                <td class="ui-cell">
                  <span class="text-xs font-bold text-content-muted tabular-nums">{{
                    item.term?.name
                  }}</span>
                </td>
                <td class="ui-cell text-center font-bold text-content-dark text-sm">
                  <span class="tabular-nums">{{ item.studentCount }}</span>
                </td>
                <td class="ui-cell text-center font-bold text-content-dark text-sm">
                  <span class="tabular-nums">{{ item.classCount }}</span>
                </td>
                <td class="ui-cell text-center">
                  <AppBadge :status="'$' + item.revenue.toLocaleString()" type="green" />
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
                class="w-40 h-40 rounded-full overflow-hidden ring-4 ring-white shadow-2xl transition-transform duration-500 group-hover:scale-105 border-2 border-gray-100 bg-surface-subtle p-6"
              >
                <img
                  :src="
                    getProgramProfileURL(
                      program.profileURL,
                      program.category,
                      resolvedCategory?.profileURL || program.categorySnapshot?.profileURL,
                    )
                  "
                  alt="Program Logo"
                  class="w-full h-full object-contain"
                />
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
                <span class="text-md font-bold text-content-muted">{{
                  program.category || 'Standard'
                }}</span>
              </div>
              <div class="flex justify-between gap-1">
                <span class="text-lg font-bold text-content-dark">Level:</span>
                <span class="text-md font-bold text-content-muted">{{
                  program.level || 'Standard'
                }}</span>
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
                <span class="text-md font-bold text-content-muted tabular-nums">{{
                  program.totalSessions || 0
                }}</span>
              </div>
              <div class="flex justify-between gap-1">
                <span class="text-lg font-bold text-content-dark">Age Range:</span>
                <span class="text-md font-bold text-content-muted"
                  >{{ program.minAge }} - {{ program.maxAge }} years</span
                >
              </div>
              <div class="flex justify-between gap-1">
                <span class="text-lg font-bold text-content-dark">Duration:</span>
                <span class="text-md font-bold text-content-muted tabular-nums"
                  >{{ program.duration || 0 }} minutes</span
                >
              </div>
              <div class="flex justify-between gap-1">
                <span class="text-lg font-bold text-content-dark">Status:</span>
                <div>
                  <AppBadge :status="getProgramDisplayStatus(program)" />
                </div>
              </div>
              <div v-if="program.description">
                <span class="text-lg font-bold text-content-dark">Description:</span>
                <p class="text-xs font-medium text-content-muted leading-relaxed italic">
                  {{ program.description }}
                </p>
              </div>
            </div>
          </section>
        </div>
      </template>
    </DetailPageLayout>
    <ProgramActionModal
      :isOpen="actionModal.isOpen"
      :type="actionModal.type"
      :program="actionModal.program"
      :loading="actionModal.loading"
      v-model:error="actionModal.error"
      v-model:success="actionModal.success"
      @close="closeModal"
      @submit="handleActionSubmit"
    />
  </DashboardLayout>
</template>

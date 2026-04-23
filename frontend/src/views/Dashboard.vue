<script setup>
import { authService } from '../services/authService'
import { parentService } from '../services/parentService'
import { studentService } from '../services/studentService'
import { programService } from '../services/programService'
import { classService } from '../services/classService'
import { enrollmentService } from '../services/enrollmentService'
import { trialService } from '../services/trialService'
import { ref, onMounted, computed } from 'vue'
import { getImageUrl } from '@/utils/assetHelper'
import { parseDate, formatPrice } from '@/utils/formatUtils'
import { calculateDashboardStats } from '@/utils/statsHelper'
import { getAvatarUrl } from '@/utils/profileHelper'
import { branchService } from '../services/branchService'

import DashboardLayout from '../components/layout/DashboardLayout.vue'
import DataMetrics from '../components/common/data/DataMetrics.vue'
import MiniCard from '../components/common/cards/MiniCard.vue'
import RecentEnrollmentTable from '../components/enrollments/RecentEnrollmentTable.vue'

const userProfile = ref({
  name: 'Loading...',
  role: '...',
  profileURL: null,
})
const students = ref([])
const programs = ref([])
const enrollments = ref([])
const classes = ref([])
const branches = ref([])
const users = ref([])
const loading = ref(true)
const trials = ref([])

const stats = ref({
  today: { reg: 0, enroll: 0, pay: 0, trial: 0 },
  week: { reg: 0, enroll: 0, pay: 0, trial: 0 },
  totals: {
    parents: 0,
    students: 0,
    programs: 0,
    branches: 0,
    enrollments: 0,
    trials: 0,
    revenue: 0,
  },
})

onMounted(() => {
  authService.onAuthStateChanged(async (currentUser) => {
    if (!currentUser) {
      userProfile.value = {
        name: 'Guest',
        role: 'Guest',
        profileURL: getImageUrl('profiles', 'avatar-guest'),
      }
      loading.value = false
      return
    }

    try {
      const profile = await authService.getUserProfile(currentUser.uid)
      userProfile.value = profile

      const [pData, rData, prData, sData, clsData, bData, tData] = await Promise.all([
        parentService.getAllParents(),
        enrollmentService.getAllEnrollments(),
        programService.getAllPrograms(),
        studentService.getAllStudents(),
        classService.getAllClasses(),
        branchService.getAllBranches(),
        trialService.getAllTrials(),
      ])

      users.value = Array.isArray(pData) ? pData : []
      enrollments.value = Array.isArray(rData) ? rData : []
      programs.value = Array.isArray(prData) ? prData : []
      students.value = Array.isArray(sData) ? sData : []
      classes.value = Array.isArray(clsData) ? clsData : []
      branches.value = Array.isArray(bData) ? bData : []
      trials.value = Array.isArray(tData) ? tData : []

      stats.value = calculateDashboardStats(
        users.value,
        enrollments.value,
        programs.value,
        students.value,
        classes.value,
        branches.value,
        trials.value,
      )
    } catch (err) {
      console.error('Dashboard error:', err)
      userProfile.value = {
        name: 'User',
        role: 'Unknown',
        profileURL: getImageUrl('profiles', 'avatar-guest'),
      }
    } finally {
      loading.value = false
    }
  })
})

const profileImageUrl = computed(() => getAvatarUrl(userProfile.value))

const todayStats = computed(() => [
  {
    label: 'Today Registrations',
    value: stats.value.today.reg,
    image: getImageUrl('dashboard/registration'),
    color: 'var(--color-primary-light)',
  },
  {
    label: 'Today Enrollments',
    value: stats.value.today.enroll,
    image: getImageUrl('dashboard/enrollment'),
    color: 'var(--color-primary-light)',
  },
  {
    label: 'Today Trial Class',
    value: stats.value.today.trial,
    image: getImageUrl('dashboard/trial'),
    color: 'var(--color-primary-light)',
  },
  {
    label: "Today Payments",
    value: `$${formatPrice(stats.value.today.pay)}`,
    image: getImageUrl('dashboard/payment'),
    color: 'var(--color-primary-light)',
  },
])

const thisWeekStats = computed(() => [
  {
    label: 'This Week Registrations',
    value: stats.value.week.reg,
    image: getImageUrl('dashboard/registration'),
    color: 'var(--color-primary-light)',
  },
  {
    label: 'This Week Enrollments',
    value: stats.value.week.enroll,
    image: getImageUrl('dashboard/enrollment'),
    color: 'var(--color-primary-light)',
  },
  {
    label: 'This Week Trial Classes',
    value: stats.value.week.trial,
    image: getImageUrl('dashboard/trial'),
    color: 'var(--color-primary-light)',
  },
  {
    label: 'This Week Payments',
    value: `$${formatPrice(stats.value.week.pay)}`,
    image: getImageUrl('dashboard/payment'),
    color: 'var(--color-primary-light)',
  },
])

const totalStats = computed(() => [
  {
    title: 'Total Enrollments',
    value: stats.value.totals.enrollments,
    image: getImageUrl('dashboard/card-top-program'),
    color: 'var(--color-primary-light)',
  },
  {
    title: 'Total Parents',
    value: stats.value.totals.parents,
    image: getImageUrl('parent/total-parent'),
    color: 'var(--color-primary-light)',
  },
  {
    title: 'Total Students',
    value: stats.value.totals.students,
    image: getImageUrl('student/total-student'),
    color: 'var(--color-primary-light)',
  },
  {
    title: 'Total Branches',
    value: stats.value.totals.branches,
    image: getImageUrl('dashboard/card-branch'),
    color: 'var(--color-primary-light)',
  },
  {
    title: 'Total Programs',
    value: stats.value.totals.programs,
    image: getImageUrl('dashboard/card-available-program'),
    color: 'var(--color-primary-light)',
  },
  {
    title: 'Total Trial',
    value: stats.value.totals.trials,
    image: getImageUrl('dashboard/card-trial'),
    color: 'var(--color-primary-light)',
  },
  {
    title: 'Total Revenue',
    value: `$${formatPrice(stats.value.totals.revenue)}`,
    image: getImageUrl('dashboard/card-revenue'),
    color: 'var(--color-primary-light)',
  },
])

import { enrichEnrollments } from '@/utils/enrollmentHelper'

const mappedEnrollments = computed(() => {
  const raw = [...enrollments.value]
    .sort((a, b) => {
      const timeB = parseDate(b.enrollAt || b.createdAt).getTime()
      const timeA = parseDate(a.enrollAt || a.createdAt).getTime()
      return timeB - timeA
    })
    .slice(0, 5)

  return enrichEnrollments(raw, users.value, students.value, programs.value, classes.value)
})
</script>

<template>
  <DashboardLayout>
    <div v-if="loading" class="flex flex-col items-center justify-center h-[60vh] gap-lg text-content-muted">
      <div class="w-12 h-12 border-4 border-surface-light border-r-primary rounded-full animate-spin"></div>
      <p class="font-bold text-sm tracking-widest uppercase opacity-70">
        Loading Dashboard Data...
      </p>
    </div>
    <div v-else class="flex flex-col lg:flex-row gap-xl px-xl w-full h-[calc(100vh-100px)] overflow-hidden">
      <div class="flex flex-col flex-1 min-w-0 h-full gap-lg overflow-y-auto pr-md scrollable-v">
        <section class="ui-detail-card">
          <div class="ui-section-header border-none flex items-center gap-md">
            <h2 class="ui-section-title whitespace-nowrap">Today Summary</h2>
            <div class="ui-section-divider"></div>
          </div>
          <DataMetrics :stats="todayStats" />
        </section>

        <section class="ui-detail-card">
          <div class="ui-section-header border-none flex items-center gap-md">
            <h2 class="ui-section-title whitespace-nowrap">This Week</h2>
            <div class="ui-section-divider"></div>
          </div>
          <DataMetrics :stats="thisWeekStats" />
        </section>

        <RecentEnrollmentTable :enrollments="mappedEnrollments" />
      </div>

      <div class="hidden lg:block lg:min-w-[300px] h-full min-h-0 max-w-[320px] flex-shrink-0">
        <div class="ui-detail-card h-full flex flex-col min-h-0 gap-md !p-lg">
          <div class="border-b-[1px] border-gray-200 pb-lg flex flex-col items-center text-center gap-2">
            <div class="w-24 h-24 rounded-2xl overflow-hidden bg-surface-light ring-4 ring-white shadow-md mb-2">
              <img class="w-full h-full object-cover" :src="profileImageUrl" alt="User" />
            </div>
            <div class="flex flex-col items-center">
              <p class="text-xs font-black text-content-muted uppercase tracking-[0.14em] mb-1 opacity-70">
                {{ userProfile?.role }}
              </p>
              <h3 class="text-xl font-black text-content-dark tracking-tighter leading-tight">
                {{ userProfile?.name }}
              </h3>
            </div>
          </div>
          <div class="flex flex-1 flex-col min-h-0 gap-md">
            <h3 class="flex-shrink-0 text-xs font-black uppercase tracking-widest text-content-dark text-center">
              Basic Information
            </h3>
            <div class="flex flex-1 flex-col min-h-0 gap-3 scrollable-v">
              <MiniCard v-for="stat in totalStats" :key="stat.title" v-bind="stat" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </DashboardLayout>
</template>

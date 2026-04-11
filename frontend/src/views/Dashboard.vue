<script setup>
import { authService } from '../services/authService'
import { userService } from '../services/userService'
import { programService } from '../services/programService'
import { enrollmentService } from '../services/enrollmentService'
import { trialService } from '../services/trialService'
import { ref, onMounted, computed } from 'vue'
import {
  getImageUrl,
  getProgramProfileURL,
  getParentProfileURL,
  getStudentProfileURL,
} from '@/utils/assetHelper'
import { parseDate, formatPrice } from '@/utils/formatUtils'
import { calculateDashboardStats } from '@/utils/statsHelper'
import { getAvatarUrl } from '@/utils/profileHelper'
import branchService from '../services/branchService'

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
const sessions = ref([])
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
    totalRevenue: 0,
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
      const profile = await userService.getProfile(currentUser.uid)
      userProfile.value = profile

      const [uData, rData, pData, sData, sessData, bData, tData] = await Promise.all([
        userService.getAllUsers(),
        enrollmentService.getAllEnrollments(),
        programService.getAllPrograms(),
        userService.getAllStudents(),
        programService.getAllClasses(),
        branchService.getAllBranches(),
        trialService.getAllTrials(),
      ])

      users.value = Array.isArray(uData) ? uData : []
      enrollments.value = Array.isArray(rData) ? rData : []
      programs.value = Array.isArray(pData) ? pData : []
      students.value = Array.isArray(sData) ? sData : []
      sessions.value = Array.isArray(sessData) ? sessData : []
      branches.value = Array.isArray(bData) ? bData : []
      trials.value = Array.isArray(tData) ? tData : []

      stats.value = calculateDashboardStats(
        users.value,
        enrollments.value,
        programs.value,
        students.value,
        sessions.value,
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
    label: 'New Registrations Today',
    value: stats.value.today.reg,
    image: getImageUrl('dashboard/registration'),
    color: 'var(--accent-light)',
  },
  {
    label: 'New Enrollments Today',
    value: stats.value.today.enroll,
    image: getImageUrl('dashboard/enrollment'),
    color: 'var(--accent-light)',
  },
  {
    label: 'Trial Class Today',
    value: stats.value.today.trial,
    image: getImageUrl('dashboard/trial'),
    color: 'var(--accent-light)',
  },
  {
    label: "Today's Payments",
    value: `$${formatPrice(stats.value.today.pay)}`,
    image: getImageUrl('dashboard/payment'),
    color: 'var(--accent-light)',
  },
])

const thisWeekStats = computed(() => [
  {
    label: 'Total Registrations',
    value: stats.value.week.reg,
    image: getImageUrl('dashboard/registration'),
    color: 'var(--accent-light)',
  },
  {
    label: 'Total Enrollments',
    value: stats.value.week.enroll,
    image: getImageUrl('dashboard/enrollment'),
    color: 'var(--accent-light)',
  },
  {
    label: 'Total Trial Classes',
    value: stats.value.week.trial,
    image: getImageUrl('dashboard/trial'),
    color: 'var(--accent-light)',
  },
  {
    label: 'Total Payments',
    value: `$${formatPrice(stats.value.week.pay)}`,
    image: getImageUrl('dashboard/payment'),
    color: 'var(--accent-light)',
  },
])

const mappedEnrollments = computed(() => {
  return [...enrollments.value]
    .sort((a, b) => {
      const timeB = parseDate(b.enrollAt || b.createdAt).getTime()
      const timeA = parseDate(a.enrollAt || a.createdAt).getTime()
      return timeB - timeA
    })
    .slice(0, 5)
    .map((r, index) => {
      const p = users.value.find((u) => u.uid === r.parentId)
      const s = students.value.find((s) => s.id === r.studentId)
      const c = programs.value.find((prog) => prog.id === (r.programId || r.courseId))

      return {
        id: r.id,
        no: index + 1,
        parent:
          r.parent ||
          (p
            ? { id: p.uid, name: p.name || p.fullName, profile: p.profile || p.profileURL }
            : null),
        student:
          r.student ||
          (s
            ? { id: s.id || s.uid, name: s.name || s.fullName, profile: s.profile || s.profileURL }
            : null),
        program:
          r.program ||
          (c ? { id: c.id, title: c.title || c.name, profile: c.profile || c.profileURL } : null),

        parentName: r.parent?.name || r.parentName || p?.name || 'N/A',
        parentProfileURL: getParentProfileURL(r.parentProfileURL || p?.profileURL),
        studentName: r.student?.name || r.studentName || s?.name || 'N/A',
        studentProfileURL: getStudentProfileURL(r.studentProfileURL || s?.profileURL),
        programTitle: r.program?.title || r.programTitle || c?.title || 'N/A',
        programProfileURL: getProgramProfileURL(
          r.programProfileURL || c?.profileURL,
          r.programCategory || c?.category,
        ),

        status: r.displayStatus || r.status,
        mode: r.enrollmentType || (r.isProrated ? 'Partial' : 'Full'),
        amount: r.amount || 0,
        date: r.enrollAt || r.createdAt,
      }
    })
})
</script>

<template>
  <DashboardLayout>
    <div v-if="loading" class="dashboard-loading">
      <div class="loader"></div>
      <p>Loading Dashboard Data...</p>
    </div>
    <div v-else class="dashboard-grid">
      <div class="main-column scrollable-v">
        <section class="ui-detail-card !p-lg">
          <div class="ui-section-header !mb-md !pb-xs border-none">
            <h2 class="ui-section-title !text-base">Today Summary</h2>
          </div>
          <DataMetrics :stats="todayStats" />
        </section>

        <section class="ui-detail-card !p-lg">
          <div class="ui-section-header !mb-md !pb-xs border-none">
            <h2 class="ui-section-title !text-base">This Week</h2>
          </div>
          <DataMetrics :stats="thisWeekStats" />
        </section>

        <RecentEnrollmentTable :enrollments="mappedEnrollments" />
      </div>

      <div class="right-column">
        <div class="ui-detail-card h-full flex flex-col gap-md !p-lg overflow-y-auto scrollable-v">
          <div class="profile-card border-b border-surface-light pb-lg flex flex-col items-center text-center gap-2">
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
          <div class="flex flex-col gap-md scrollable-v">
            <h3 class="text-xs font-black uppercase tracking-widest text-content-dark text-center">
              Basic Information
            </h3>
            <div class="mini-cards-stack flex flex-col gap-3">
              <MiniCard title="All-time Enrollments" :value="stats.totals.enrollments"
                :image="getImageUrl('dashboard/card-top-program')" />
              <MiniCard title="Total Parents" :value="stats.totals.parents"
                :image="getImageUrl('parent/total-parent')" />
              <MiniCard title="Total Students" :value="stats.totals.students"
                :image="getImageUrl('student/total-student')" />
              <MiniCard title="Total Branches" :value="stats.totals.branches"
                :image="getImageUrl('dashboard/card-branch')" />
              <MiniCard title="Total Programs" :value="stats.totals.programs"
                :image="getImageUrl('dashboard/card-available-program')" />
              <MiniCard title="Total Trial" :value="stats.totals.trials" :image="getImageUrl('dashboard/card-trial')" />
              <MiniCard title="Total Revenue" :value="`$${formatPrice(stats.totals.totalRevenue)}`"
                :image="getImageUrl('dashboard/card-revenue')" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </DashboardLayout>
</template>

<style scoped>
.dashboard-grid {
  @apply grid gap-xl px-xl pb-xl h-[calc(100vh-100px)] overflow-hidden;
  grid-template-columns: 1fr 340px;
}

.main-column {
  @apply flex flex-col gap-xl overflow-y-auto pr-md min-h-0;
}

@media (max-width: 1024px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
    height: auto;
    overflow: visible;
    padding: 0 15px 30px 15px;
  }

  .main-column {
    overflow-y: visible;
    padding-right: 0;
  }
}

.dashboard-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 60vh;
  gap: var(--space-lg);
  color: var(--text-muted);
}

.loader {
  width: 50px;
  aspect-ratio: 1;
  border-radius: var(--border-radius-round);
  border: 4px solid var(--border-color);
  border-right-color: var(--primary-color);
  animation: l2 1s infinite linear;
}

@keyframes l2 {
  to {
    transform: rotate(1turn);
  }
}
</style>

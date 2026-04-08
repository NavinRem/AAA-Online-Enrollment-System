<script setup>
import { authService } from '../services/authService'
import { userService } from '../services/userService'
import { programService } from '../services/programService'
import { enrollmentService } from '../services/enrollmentService'
import { ref, onMounted, computed } from 'vue'
import {
  getImageUrl,
  getProgramProfileURL,
  getParentProfileURL,
  getStudentProfileURL
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
  profileURL: null
})
const students = ref([])
const programs = ref([])
const enrollments = ref([])
const sessions = ref([])
const branches = ref([])
const users = ref([])
const loading = ref(true)

const stats = ref({
  today: { reg: 0, enroll: 0, pay: 0 },
  week: { reg: 0, enroll: 0, pay: 0 },
  totals: {
    parents: 0,
    students: 0,
    programs: 0,
    branches: 0,
    enrollments: 0,
    totalRevenue: 0,
  }
})

onMounted(() => {
  authService.onAuthStateChanged(async (currentUser) => {
    if (!currentUser) {
      userProfile.value = {
        name: 'Guest',
        role: 'Guest',
        profileURL: getImageUrl('profiles', 'avatar-guest')
      }
      loading.value = false
      return
    }

    try {
      const profile = await userService.getProfile(currentUser.uid)
      userProfile.value = profile

      const [uData, rData, pData, sData, sessData, bData] = await Promise.all([
        userService.getAllUsers(),
        enrollmentService.getAllEnrollments(),
        programService.getAllPrograms(),
        userService.getAllStudents(),
        programService.getAllSessions(),
        branchService.getAllBranches()
      ])

      users.value = Array.isArray(uData) ? uData : []
      enrollments.value = Array.isArray(rData) ? rData : []
      programs.value = Array.isArray(pData) ? pData : []
      students.value = Array.isArray(sData) ? sData : []
      sessions.value = Array.isArray(sessData) ? sessData : []
      branches.value = Array.isArray(bData) ? bData : []

      stats.value = calculateDashboardStats(
        users.value,
        enrollments.value,
        programs.value,
        students.value,
        sessions.value,
        branches.value
      )
    } catch (err) {
      console.error('Dashboard error:', err)
      userProfile.value = {
        name: 'User',
        role: 'Unknown',
        profileURL: getImageUrl('profiles', 'avatar-guest')
      }
    } finally {
      loading.value = false
    }
  })
})

const profileImageUrl = computed(() => getAvatarUrl(userProfile.value))

const todayStats = computed(() => [
  { label: 'New Registrations Today', value: stats.value.today.reg, image: getImageUrl('dashboard/registration'), color: 'var(--accent-light)' },
  { label: 'New Enrollments Today', value: stats.value.today.enroll, image: getImageUrl('dashboard/enrollment'), color: 'var(--accent-light)' },
  { label: "Today's Payments", value: `$${formatPrice(stats.value.today.pay)}`, image: getImageUrl('dashboard/payment'), color: 'var(--accent-light)' }
])

const thisWeekStats = computed(() => [
  { label: 'Total Registrations', value: stats.value.week.reg, image: getImageUrl('dashboard/registration'), color: 'var(--accent-light)' },
  { label: 'Total Enrollments', value: stats.value.week.enroll, image: getImageUrl('dashboard/enrollment'), color: 'var(--accent-light)' },
  { label: 'Total Payments', value: `$${formatPrice(stats.value.week.pay)}`, image: getImageUrl('dashboard/payment'), color: 'var(--accent-light)' }
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
      const p = users.value.find(u => u.uid === r.parentId)
      const s = students.value.find(s => s.id === r.studentId)
      const c = programs.value.find(prog => prog.id === (r.programId || r.courseId))

      return {
        id: r.id,
        no: index + 1,
        parent: r.parent || (p ? { id: p.uid, name: p.name || p.fullName, profile: p.profile || p.profileURL } : null),
        student: r.student || (s ? { id: s.id || s.uid, name: s.name || s.fullName, profile: s.profile || s.profileURL } : null),
        program: r.program || (c ? { id: c.id, title: c.title || c.name, profile: c.profile || c.profileURL } : null),

        parentName: r.parent?.name || r.parentName || p?.name || 'N/A',
        parentProfileURL: getParentProfileURL(r.parent?.profile || r.parentProfileURL || p?.profileURL),
        studentName: r.student?.name || r.studentName || s?.name || 'N/A',
        studentProfileURL: getStudentProfileURL(r.student?.profile || r.studentProfileURL || s?.profileURL),
        programTitle: r.program?.title || r.programTitle || c?.title || 'N/A',
        programProfileURL: getProgramProfileURL(r.program?.profile || r.programProfileURL || c?.profileURL, r.programCategory || c?.category),

        status: r.displayStatus || r.status || 'Pending',
        mode: r.enrollmentType || (r.isProrated ? 'Partial' : 'Full'),
        amount: r.amount || 0,
        date: r.enrollAt || r.createdAt
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
      <div class="main-column">
        <section class="summary-section">
          <h2 class="section-title">Today Summary</h2>
          <DataMetrics :stats="todayStats" />
        </section>

        <section class="summary-section">
          <h2 class="section-title">This Week</h2>
          <DataMetrics :stats="thisWeekStats" />
        </section>

        <RecentEnrollmentTable :enrollments="mappedEnrollments" />
      </div>

      <div class="right-column">
        <div class="profile-overview">
          <div class="profile-card">
            <div class="profile-image-wrapper">
              <div class="profile-image-large">
                <img :src="profileImageUrl" alt="User" />
              </div>
            </div>
            <div class="profile-info-content">
              <h3 class="welcome-name">{{ userProfile?.name }}</h3>
              <p class="status-text">{{ userProfile?.role }}</p>
            </div>
          </div>
          <div class="basic-info">
            <h3 class="info-title">
              Basic Information
            </h3>
            <div class="mini-cards-stack">
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
              <MiniCard title="All-time Total Revenue" :value="`$${formatPrice(stats.totals.totalRevenue)}`"
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
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 30px;
  padding: 0 30px 30px 30px;
  height: calc(100vh - 90px);
  overflow: hidden;
}

.main-column {
  display: flex;
  flex-direction: column;
  gap: 30px;
  overflow-y: auto;
  padding-right: 15px;
  min-height: 0;
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

.summary-section {
  background: white;
  border-radius: 20px;
  padding: 25px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.02);
}

.section-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text-dark);
  margin-bottom: 20px;
  display: flex;
  align-items: center;
}

.section-title::after {
  content: '';
  flex: 1;
  margin-left: 20px;
  height: 1px;
  background-color: #eee;
}

.profile-overview {
  background: white;
  border-radius: 20px;
  padding: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.02);
  display: flex;
  flex-direction: column;
  gap: 10px;
  position: sticky;
  top: 90px;
  height: 100%;
}

.profile-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 20px 0;
  border-radius: 20px;
  box-shadow: none;
  transition: transform 0.3s ease;
}

.profile-image-wrapper {
  margin-bottom: 20px;
}

.profile-image-large {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border: 2px solid var(--primary-color);
  background-color: var(--accent-light);
}

.profile-image-large img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.profile-info-content {
  display: flex;
  flex-direction: column;
}

.welcome-name {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--text-dark);
  margin: 0;
}

.status-text {
  font-size: 0.9rem;
  color: #a0a0a0;
  font-weight: 500;
}

.basic-info {
  display: flex;
  flex-direction: column;
  gap: 15px;
  height: 100%;
}

.info-title {
  text-align: center;
}



.mini-cards-stack {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.dashboard-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 60vh;
  gap: 20px;
  color: #666;
}

.loader {
  width: 50px;
  aspect-ratio: 1;
  border-radius: 50%;
  border: 4px solid #f3f3f3;
  border-right-color: #00aeef;
  animation: l2 1s infinite linear;
}

@keyframes l2 {
  to {
    transform: rotate(1turn);
  }
}
</style>

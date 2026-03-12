<script setup>
import { authService } from '../services/authService'
import { userService } from '../services/userService'
import { courseService } from '../services/courseService'
import { enrollmentService } from '../services/enrollmentService'
import { useRouter } from 'vue-router'
import { ref, onMounted, computed } from 'vue'
import { getImageUrl, getIconUrl } from '@/utils/assetHelper'
import { parseDate } from '../utils/dateFormatter'
import { calculateDashboardStats } from '../utils/statsHelper'

// UI Components
import DashboardLayout from '../components/layout/DashboardLayout.vue'
import DataMetrics from '../components/common/data/DataMetrics.vue'
import MiniCard from '../components/cards/MiniCard.vue'
import RecentEnrollmentTable from '../components/common/data/RecentEnrollmentTable.vue'

const router = useRouter()
const userProfile = ref(null)
const students = ref([])
const courses = ref([])
const enrollments = ref([])
const allUsers = ref([])
const loading = ref(true)

const stats = ref({
  today: { reg: 0, enroll: 0, pay: 0 },
  week: { reg: 0, enroll: 0, pay: 0 },
  totals: { accounts: 0, parents: 0, guardians: 0, students: 0, programs: 0 }
})

onMounted(() => {
  authService.onAuthStateChanged(async (currentUser) => {
    if (!currentUser) return router.push('/')
    
    try {
      const profile = await userService.getProfile(currentUser.uid)
      userProfile.value = profile
      
      const [uData, rData, cData, sData] = await Promise.all([
        userService.getAllUsers(),
        enrollmentService.getAll(),
        courseService.getAllCourses(),
        userService.getAllStudents()
      ])

      allUsers.value = Array.isArray(uData) ? uData : []
      enrollments.value = Array.isArray(rData) ? rData : []
      courses.value = Array.isArray(cData) ? cData : []
      students.value = Array.isArray(sData) ? sData : []
      
      stats.value = calculateDashboardStats(allUsers.value, enrollments.value, courses.value, students.value)
    } catch (err) {
      console.error('Dashboard error:', err)
    } finally {
      loading.value = false
    }
  })
})

const todayStats = computed(() => [
  { label: 'New Enrollments Today', value: stats.value.today.enroll, image: getIconUrl('enroll'), color: '#e1f5fe' },
  { label: "Today's Payments", value: `$${stats.value.today.pay}`, image: getIconUrl('pay'), color: '#e1f5fe' }
])

const totalStats = computed(() => [
  { label: 'Total Parent Accounts', value: stats.value.totals.accounts, image: getIconUrl('register'), color: '#e1f5fe' },
  { label: 'Total Course Enrollments', value: stats.value.totals.programs, image: getIconUrl('enroll'), color: '#e1f5fe' },
  { label: 'Total Weekly Payments', value: `$${stats.value.week.pay}`, image: getIconUrl('pay'), color: '#e1f5fe' }
])

const mappedEnrollments = computed(() => {
  return [...enrollments.value]
    .sort((a, b) => parseDate(b.enrollAt || b.createdAt).getTime() - parseDate(a.enrollAt || a.createdAt).getTime())
    .slice(0, 5)
    .map((r, index) => {
      const p = allUsers.value.find(u => u.uid === r.parentId)
      const s = students.value.find(s => s.id === r.studentId)
      const c = courses.value.find(c => c.id === r.courseId)
      const isPaid = ['paid', 'confirmed'].includes((r.paymentStatus || r.status || '').toLowerCase())

      return {
        id: r.id,
        no: index + 1,
        parent: p?.name || r.parentName || 'Parent',
        child: s?.fullName || r.studentName || 'Student',
        course: c?.title || r.courseTitle || 'Course',
        status: isPaid ? 'Paid' : ((r.status || '').toLowerCase() === 'cancelled' ? 'Canceled' : 'Unpaid'),
        amount: `$${r.amount || c?.price || 0}`,
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
          <h2 class="section-title">Total Summary</h2>
          <DataMetrics :stats="totalStats" />
        </section>

        <RecentEnrollmentTable :enrollments="mappedEnrollments" />
      </div>

      <div class="right-column">
        <div class="profile-overview">
          <div class="profile-card">
            <div class="profile-image-large">
              <img :src="userProfile?.profileURL || getImageUrl('profiles', 'profile-admin.png')" alt="User" />
            </div>
            <h3 class="welcome-text">Welcome Back!<br />{{ userProfile?.name || 'User' }}</h3>
            <p class="sub-text">Here is the overview</p>
          </div>

          <div class="basic-info">
            <h3 class="info-title">Basic Information</h3>
            <div class="mini-cards-stack">
              <MiniCard title="Total Accounts" :value="stats.totals.accounts" :image="getIconUrl('user-online')" />
              <MiniCard title="Total Parents" :value="stats.totals.parents" :image="getImageUrl('parent')" />
              <MiniCard title="Total Guardians" :value="stats.totals.guardians" :image="getIconUrl('guardian')" />
              <MiniCard title="Total Students" :value="stats.totals.students" :image="getImageUrl('profiles', 'student2.png')" />
              <MiniCard title="Total Programs" :value="stats.totals.programs" :image="getImageUrl('program')" />
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
  color: #333;
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
  padding: 30px 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.02);
  display: flex;
  flex-direction: column;
  gap: 30px;
  position: sticky;
  top: 90px;
}

.profile-card {
  text-align: center;
}

.profile-image-large {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  margin: 0 auto 20px;
}

.profile-image-large img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.welcome-text {
  font-size: 1.3rem;
  font-weight: 800;
  color: #1a1a1a;
  line-height: 1.2;
}

.sub-text {
  font-size: 0.85rem;
  color: #999;
  margin-top: 5px;
}

.info-title {
  font-size: 1rem;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 20px;
  text-align: center;
}

.mini-cards-stack {
  display: flex;
  flex-direction: column;
  gap: 15px;
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
  to { transform: rotate(1turn); }
}
</style>

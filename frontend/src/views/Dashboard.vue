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
const user = ref(null)
const userProfile = ref(null)
const students = ref([])
const courses = ref([])
const enrollments = ref([])
const allUsers = ref([])
const loading = ref(true)

// Stats
const stats = ref({
  today: { reg: 0, enroll: 0, pay: 0 },
  week: { reg: 0, enroll: 0, pay: 0 },
  totals: {
    accounts: 0,
    parents: 0,
    guardians: 0,
    students: 0,
    programs: 0,
    enrollments: 0,
    pay: 0,
  },
})

onMounted(() => {
  authService.onAuthStateChanged(async (currentUser) => {
    if (currentUser) {
      user.value = currentUser
      try {
        await fetchUserProfile(currentUser.uid)
        await Promise.all([fetchStudents(), fetchCourses(), fetchEnrollments(), fetchAllUsers()])
        calculateStats()
      } catch (err) {
        console.error('Dashboard [error] loading data:', err)
      } finally {
        loading.value = false
      }
    } else {
      router.push('/')
      // ensure we stop loading if we redirect
      loading.value = false
    }
  })
})

const fetchUserProfile = async (uid) => {
  try {
    const profile = await userService.getProfile(uid)
    userProfile.value = profile
  } catch (error) {
    console.error('Failed to fetch user profile', error)
  }
}

const fetchStudents = async () => {
  try {
    let data
    if (userProfile.value?.role === 'admin') {
      data = await userService.getAllStudents()
    } else {
      data = await userService.getStudents(user.value.uid)
    }
    students.value = Array.isArray(data) ? data : []
  } catch (error) {
    console.error('Failed to fetch students', error)
  }
}

const fetchCourses = async () => {
  try {
    const data = await courseService.getAllCourses()
    courses.value = Array.isArray(data) ? data : []
  } catch (error) {
    console.error('Failed to fetch courses', error)
  }
}

const fetchEnrollments = async () => {
  try {
    const data = await enrollmentService.getAll()
    enrollments.value = Array.isArray(data) ? data : []
  } catch (error) {
    console.error('Failed to fetch enrollments', error)
  }
}

const fetchAllUsers = async () => {
  try {
    const data = await userService.getAllUsers()
    allUsers.value = Array.isArray(data) ? data : []
  } catch (error) {
    console.error('Failed to fetch users', error)
  }
}

const todayStats = computed(() => [
  { label: 'New Accounts Today', value: stats.value.today.reg, image: getIconUrl('register'), color: '#e1f5fe' },
  { label: 'New Enrollments Today', value: stats.value.today.enroll, image: getIconUrl('enroll'), color: '#e1f5fe' },
  { label: "Today's Payments", value: `$${stats.value.today.pay}`, image: getIconUrl('pay'), color: '#e1f5fe' }
])

const totalStats = computed(() => [
  { label: 'Total Parent Accounts', value: stats.value.week.reg, image: getIconUrl('register'), color: '#e1f5fe' },
  { label: 'Total Course Enrollments', value: stats.value.week.enroll, image: getIconUrl('enroll'), color: '#e1f5fe' },
  { label: 'Total Payments', value: `$${stats.value.week.pay}`, image: getIconUrl('pay'), color: '#e1f5fe' }
])

const calculateStats = () => {
  stats.value = calculateDashboardStats(allUsers.value, enrollments.value, courses.value, students.value)
}

const mappedEnrollments = computed(() => {
  return [...enrollments.value]
    .sort((a, b) => {
      const timeA = parseDate(a.enrollAt || a.createdAt || a.updatedAt).getTime()
      const timeB = parseDate(b.enrollAt || b.createdAt || b.updatedAt).getTime()
      if (isNaN(timeA) && isNaN(timeB)) return 0
      if (isNaN(timeA)) return 1
      if (isNaN(timeB)) return -1
      return timeB - timeA
    })
    .slice(0, 5)
    .map((r, index) => {
      const parent = allUsers.value.find((u) => u.uid === r.parentId)
      const parentName = parent ? parent.name : (r.parentName || 'Parent')

      const student = students.value.find((s) => s.id === r.studentId)
      const studentName = student ? student.fullName : (r.studentName || 'Student')

      const course = courses.value.find((c) => c.id === r.courseId)
      const courseName = course ? course.title : (r.courseTitle || 'Course')

      const isCanceled = (r.status || '').toLowerCase() === 'cancelled'
      const isPaid = (r.paymentStatus || r.status || '').toLowerCase() === 'paid' || (r.paymentStatus || r.status || '').toLowerCase() === 'confirmed'

      let finalStatus = 'Unpaid'
      if (isCanceled) finalStatus = 'Canceled'
      else if (isPaid) finalStatus = 'Paid'

      const amt = r.amount || (course ? course.price : 0) || 0
      return {
        id: r.id,
        no: index + 1,
        parent: parentName,
        child: studentName,
        course: courseName,
        status: finalStatus,
        amount: typeof amt === 'string' && amt.startsWith('$') ? amt : `$${amt}`,
        date: r.enrollAt || r.createdAt || r.updatedAt,
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
      <!-- Main Content Column -->
      <div class="main-column">
        <!-- Today Summary -->
        <section class="summary-section">
          <h2 class="section-title">Today Summary</h2>
          <DataMetrics :stats="todayStats" />
        </section>

        <!-- Total Summary -->
        <section class="summary-section">
          <h2 class="section-title">Total Summary</h2>
          <DataMetrics :stats="totalStats" />
        </section>

        <!-- Recent Enrollment Table -->
        <RecentEnrollmentTable :enrollments="mappedEnrollments" />
      </div>

      <!-- Right Overview Column -->
      <div class="right-column">
        <div class="profile-overview">
          <div class="profile-card">
            <div class="profile-image-large">
              <img :src="userProfile?.profileURL || getImageUrl('profiles', 'profile-admin.png')" alt="User" />
            </div>
            <h3 class="welcome-text">
              Welcome Back!<br />{{ userProfile?.name || 'User' }}
            </h3>
            <p class="sub-text">Here is the overview</p>
          </div>

          <div class="basic-info">
            <h3 class="info-title">Basic Information</h3>
            <div class="mini-cards-stack">
              <MiniCard
                title="Total Accounts"
                :value="stats.totals.accounts"
                :image="getIconUrl('user-online')"
              />
              <MiniCard title="Total Parents" :value="stats.totals.parents" :image="getImageUrl('parent')" />
              <MiniCard
                title="Total Guardians"
                :value="stats.totals.guardians"
                :image="getIconUrl('guardian')"
              />
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
  height: calc(100vh - 90px); /* Subtract Topbar height */
  overflow: hidden; /* Prevent grid expansion */
}

.main-column {
  display: flex;
  flex-direction: column;
  gap: 30px;
  overflow-y: auto;
  padding-right: 15px; /* Space for scrollbar */
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

.right-column {
  display: flex;
  flex-direction: column;
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
  to {
    transform: rotate(1turn);
  }
}

</style>

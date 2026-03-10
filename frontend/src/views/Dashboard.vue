<script setup>
import { authService } from '../services/authService'
import { userService } from '../services/userService'
import { courseService } from '../services/courseService'
import { registrationService } from '../services/registrationService'
import { useRouter } from 'vue-router'
import { ref, onMounted, computed } from 'vue'
import { getImageUrl, getIconUrl } from '@/utils/assetHelper'

// UI Components
import DashboardLayout from '../components/layout/DashboardLayout.vue'
import DataMetrics from '../components/common/data/DataMetrics/DataMetrics.vue'
import MiniCard from '../components/cards/MiniCard.vue'
import RecentEnrollmentTable from '../components/common/data/RecentEnrollmentTable/RecentEnrollmentTable.vue'

const router = useRouter()
const user = ref(null)
const userProfile = ref(null)
const students = ref([])
const courses = ref([])
const registrations = ref([])
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
    registrations: 0,
    pay: 0,
  },
})

onMounted(() => {
  console.log('Dashboard [onMounted] starting...')
  authService.onAuthStateChanged(async (currentUser) => {
    if (currentUser) {
      console.log('Dashboard [auth] user confirmed:', currentUser.uid)
      user.value = currentUser
      try {
        await fetchUserProfile(currentUser.uid)
        await Promise.all([fetchStudents(), fetchCourses(), fetchRegistrations(), fetchAllUsers()])
        calculateStats()
        console.log('Dashboard [data] load complete')
      } catch (err) {
        console.error('Dashboard [error] loading data:', err)
      } finally {
        loading.value = false
      }
    } else {
      console.log('Dashboard [auth] no user, redirecting...')
      router.push('/')
      // ensure we stop loading if we redirect
      loading.value = false
    }
  })
})

const fetchUserProfile = async (uid) => {
  try {
    console.log('Dashboard [fetch] profile for:', uid)
    const profile = await userService.getProfile(uid)
    userProfile.value = profile
    console.log('Dashboard [fetch] profile success:', profile?.name)
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

const fetchRegistrations = async () => {
  try {
    const data = await registrationService.getAll()
    registrations.value = Array.isArray(data) ? data : []
  } catch (error) {
    console.error('Failed to fetch registrations', error)
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
const parseDate = (dateValue) => {
  if (!dateValue) return new Date(0)
  if (typeof dateValue === 'object' && 'seconds' in dateValue) {
    return new Date(dateValue.seconds * 1000)
  }
  return new Date(dateValue)
}

const calculateStats = () => {
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const endOfToday = startOfToday + 24 * 60 * 60 * 1000 - 1

  const getExpectedAmount = (r) => {
    let amt = 0
    if (r.amount) amt = parseFloat(String(r.amount).replace(/[^0-9.]/g, ''))
    else if (r.totalAmount) amt = parseFloat(String(r.totalAmount).replace(/[^0-9.]/g, ''))
    else {
      const course = courses.value.find((c) => c.id === r.courseId)
      amt = course ? parseFloat(String(course.price || 0).replace(/[^0-9.]/g, '')) : 0
    }
    return isNaN(amt) ? 0 : amt
  }

  const isPaid = (r) => {
    const s = (r.paymentStatus || r.status || '').toLowerCase()
    return s === 'paid' || s === 'confirmed'
  }

  const todayRegistrationsList = allUsers.value.filter((u) => {
    if (u.role !== 'parent' && u.role !== 'guardian') return false
    const time = parseDate(u.createdAt || u.updatedAt).getTime()
    return time >= startOfToday && time <= endOfToday
  })

  const todayEnrollmentsList = registrations.value.filter((r) => {
    const time = parseDate(r.enrollAt || r.createdAt || r.updatedAt).getTime()
    return time >= startOfToday && time <= endOfToday
  })

  stats.value.today.reg = todayRegistrationsList.length
  stats.value.today.enroll = todayEnrollmentsList.length
  stats.value.today.pay = todayEnrollmentsList
    .filter(isPaid)
    .reduce((sum, r) => sum + getExpectedAmount(r), 0)

  const parents = allUsers.value.filter((u) => u.role === 'parent')
  const guardians = allUsers.value.filter((u) => u.role === 'guardian')

  const totalEnrollmentsList = registrations.value
  stats.value.week.reg = parents.length + guardians.length
  stats.value.week.enroll = totalEnrollmentsList.length
  stats.value.week.pay = totalEnrollmentsList
    .filter(isPaid)
    .reduce((sum, r) => sum + getExpectedAmount(r), 0)

  stats.value.totals.accounts = parents.length + guardians.length
  stats.value.totals.parents = parents.length
  stats.value.totals.guardians = guardians.length
  stats.value.totals.students = students.value.length
  stats.value.totals.programs = courses.value.length
}

const mappedRegistrations = computed(() => {
  return [...registrations.value]
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
        <RecentEnrollmentTable :registrations="mappedRegistrations" />
      </div>

      <!-- Right Overview Column -->
      <div class="right-column">
        <div class="profile-overview">
          <div class="profile-card">
            <div class="profile-image-large">
              <img :src="userProfile?.profileURL || getImageUrl('profiles', 'profile-admin.png')" alt="User" />
            </div>
            <h3 class="welcome-text">
              Welcome Back!<br />{{ userProfile?.name || 'Sonavin Rem' }}
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

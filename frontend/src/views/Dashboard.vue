<script setup>
import { authService } from '../services/authService'
import { userService } from '../services/userService'
import { courseService } from '../services/courseService'
import { registrationService } from '../services/registrationService'
import { useRouter } from 'vue-router'
import { ref, onMounted, computed } from 'vue'
import defaultProfileImg from '@/assets/images/profile-admin.png'
// UI Components
import DashboardLayout from '../components/DashboardLayout.vue'
import SummaryCard from '../components/SummaryCard.vue'
import MiniCard from '../components/MiniCard.vue'
import RecentRegistrationTable from '../components/RecentRegistrationTable.vue'

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

onMounted(async () => {
  const currentUser = authService.getCurrentUser()
  if (currentUser) {
    user.value = currentUser
    await fetchUserProfile(currentUser.uid)
    await Promise.all([fetchStudents(), fetchCourses(), fetchRegistrations(), fetchAllUsers()])
    calculateStats()
  } else {
    router.push('/')
  }
  loading.value = false
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

const calculateStats = () => {
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const endOfToday = startOfToday + 24 * 60 * 60 * 1000 - 1

  const dayOfWeek = now.getDay()
  const daysSinceMonday = (dayOfWeek + 6) % 7 // Monday = 0, Sunday = 6
  const startOfWeek = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - daysSinceMonday,
  ).getTime()

  // Helper to determine cost
  const getExpectedAmount = (r) => {
    if (r.amount) return parseFloat(r.amount)
    if (r.totalAmount) return parseFloat(r.totalAmount)
    const course = courses.value.find((c) => c.id === r.course_id)
    return course ? parseFloat(course.price || 0) : 0
  }

  const isPaid = (r) => r.paymentStatus === 'paid' || r.status === 'confirmed'

  // Today Summary
  const todayRegistrationsList = allUsers.value.filter((u) => {
    if (u.role !== 'parent' && u.role !== 'guardian') return false
    const time = new Date(u.createdAt || u.created_at || u.updatedAt).getTime()
    return time >= startOfToday && time <= endOfToday
  })

  const todayEnrollmentsList = registrations.value.filter((r) => {
    const time = new Date(
      r.enrollAt || r.createdAt || r.created_at || r.registrationDate || r.timestamp,
    ).getTime()
    return time >= startOfToday && time <= endOfToday
  })

  stats.value.today.reg = todayRegistrationsList.length
  stats.value.today.enroll = todayEnrollmentsList.length
  stats.value.today.pay = todayEnrollmentsList
    .filter(isPaid)
    .reduce((sum, r) => sum + getExpectedAmount(r), 0)

  // Overall Summary (Total)
  const totalRegistrationsList = allUsers.value.filter(
    (u) => u.role === 'parent' || u.role === 'guardian',
  )

  const totalEnrollmentsList = registrations.value

  stats.value.week.reg = totalRegistrationsList.length
  stats.value.week.enroll = totalEnrollmentsList.length
  stats.value.week.pay = totalEnrollmentsList
    .filter(isPaid)
    .reduce((sum, r) => sum + getExpectedAmount(r), 0)

  // Mini Card Totals (Keep existing for sidebar)
  const parents = allUsers.value.filter((u) => u.role === 'parent')
  const guardians = allUsers.value.filter((u) => u.role === 'guardian')

  stats.value.totals.accounts = parents.length + guardians.length
  stats.value.totals.parents = parents.length
  stats.value.totals.guardians = guardians.length
  stats.value.totals.students = students.value.length
  stats.value.totals.programs = courses.value.length
  stats.value.totals.registrations = parents.length + guardians.length
}

const mappedRegistrations = computed(() => {
  return [...registrations.value]
    .sort((a, b) => {
      const timeA = new Date(
        a.enrollAt || a.createdAt || a.created_at || a.registrationDate || a.timestamp,
      ).getTime()
      const timeB = new Date(
        b.enrollAt || b.createdAt || b.created_at || b.registrationDate || b.timestamp,
      ).getTime()
      return timeB - timeA // Descending (newest first)
    })
    .slice(0, 5)
    .map((r, index) => {
      const parent = allUsers.value.find((u) => u.uid === r.parent_id)
      const parentName = parent
        ? parent.name || parent.email
        : r.parentName || r.parent_name || 'Parent'

      const student = students.value.find((s) => s.id === r.student_id)
      const studentName = student
        ? student.fullname || student.name
        : r.studentName || r.student_name || 'Student'

      const course = courses.value.find((c) => c.id === r.course_id)
      const courseName = course
        ? course.title || course.name
        : r.courseTitle || r.course_title || 'Course'

      return {
        id: r.id,
        no: index + 1,
        parent: parentName,
        child: studentName,
        course: courseName,
        status: r.status || 'Pending',
        amount: `$${r.amount || r.totalAmount || (course ? course.price : 0) || 0}`,
        date: r.enrollAt || r.createdAt || r.created_at || r.registrationDate || r.timestamp,
      }
    })
})
</script>

<template>
  <DashboardLayout>
    <div class="dashboard-grid">
      <!-- Main Content Column -->
      <div class="main-column">
        <!-- Today Summary -->
        <section class="summary-section">
          <h2 class="section-title">Today Summary</h2>
          <div class="cards-row">
            <SummaryCard
              title="New Accounts Today"
              :value="stats.today.reg"
              image="register.png"
              color="#e1f5fe"
            />
            <SummaryCard
              title="New Enrollments Today"
              :value="stats.today.enroll"
              image="enrollment.png"
              color="#e1f5fe"
            />
            <SummaryCard
              title="Today's Payments"
              :value="`$${stats.today.pay}`"
              image="payment.png"
              color="#e1f5fe"
            />
          </div>
        </section>

        <!-- Total Summary -->
        <section class="summary-section">
          <h2 class="section-title">Total Summary</h2>
          <div class="cards-row">
            <SummaryCard
              title="Total Parent Accounts"
              :value="stats.week.reg"
              image="register.png"
              color="#e1f5fe"
            />
            <SummaryCard
              title="Total Course Enrollments"
              :value="stats.week.enroll"
              image="enrollment.png"
              color="#e1f5fe"
            />
            <SummaryCard
              title="Total Payments"
              :value="`$${stats.week.pay}`"
              image="payment.png"
              color="#e1f5fe"
            />
          </div>
        </section>

        <!-- Recent Enrollment Table -->
        <RecentRegistrationTable :registrations="mappedRegistrations" />
      </div>

      <!-- Right Overview Column -->
      <div class="right-column">
        <div class="profile-overview">
          <div class="profile-card">
            <div class="profile-image-large">
              <img :src="userProfile?.profileURL || defaultProfileImg" alt="User" />
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
                image="user-online.png"
              />
              <MiniCard title="Total Parents" :value="stats.totals.parents" image="parent.png" />
              <MiniCard
                title="Total Guardians"
                :value="stats.totals.guardians"
                image="guardian.png"
              />
              <MiniCard title="Total Students" :value="stats.totals.students" image="student.png" />
              <MiniCard title="Total Programs" :value="stats.totals.programs" image="program.png" />
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
}

.main-column {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.page-title {
  font-size: 1.8rem;
  font-weight: 800;
  color: #1a1a1a;
  margin-bottom: -10px;
  margin-top: 0;
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

.cards-row {
  display: flex;
  gap: 20px;
  width: 100%;
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

@media (max-width: 1200px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
}
</style>

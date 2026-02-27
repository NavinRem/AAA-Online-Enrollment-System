<script setup>
import { ref, onMounted, computed } from 'vue'
import DashboardLayout from '../components/DashboardLayout.vue'
import SummaryCard from '../components/SummaryCard.vue'
import { registrationService } from '../services/registrationService'

const registrations = ref([])
const loading = ref(true)
const searchQuery = ref('')

onMounted(async () => {
  try {
    const data = await registrationService.getAll()
    registrations.value = Array.isArray(data) ? data : []
  } catch (error) {
    console.error('Failed to fetch registrations', error)
  } finally {
    loading.value = false
  }
})

const isPaid = (status) => status?.toLowerCase() === 'paid' || status?.toLowerCase() === 'confirmed'
const isCancelled = (status) =>
  status?.toLowerCase() === 'canceled' || status?.toLowerCase() === 'cancelled'
const isUnpaid = (status) => status && !isPaid(status) && !isCancelled(status)

const totalRegistration = computed(() => registrations.value.length)
const totalPaidRegistration = computed(
  () => registrations.value.filter((r) => isPaid(r.status || r.paymentStatus)).length,
)
const totalCancelledRegistration = computed(
  () => registrations.value.filter((r) => isCancelled(r.status || r.paymentStatus)).length,
)
const totalUnpaidRegistration = computed(
  () => registrations.value.filter((r) => isUnpaid(r.status || r.paymentStatus)).length,
)

const filteredRegistrations = computed(() => {
  if (!searchQuery.value) return registrations.value
  const query = searchQuery.value.toLowerCase()
  return registrations.value.filter(
    (r) =>
      (r.parentName || r.parent_name || '').toLowerCase().includes(query) ||
      (r.studentName || r.student_name || '').toLowerCase().includes(query) ||
      (r.courseTitle || r.course_title || '').toLowerCase().includes(query),
  )
})

const formatSession = (item) => {
  if (item.sessionSchedule) return item.sessionSchedule
  const course = (item.courseTitle || item.course_title || '').toLowerCase()
  if (course.includes('piano')) return 'Saturday, 8:30-10:00 AM'
  if (course.includes('taekwondo')) return 'Saturday, 8:30-10:00 AM'
  if (course.includes('robotic')) return 'Saturday, 8:30-10:00 AM'
  return 'Saturday, 8:30-10:00 AM'
}

const formatSessionCount = (item) => {
  if (item.sessionCount) return item.sessionCount
  const course = (item.courseTitle || item.course_title || '').toLowerCase()
  if (course.includes('piano')) return 11
  if (course.includes('taekwondo')) return 5
  if (course.includes('robotic')) return 10
  return 10
}

const getStatusClass = (status) => {
  if (!status) return 'pending'
  const lowStatus = status.toLowerCase()
  if (lowStatus === 'canceled' || lowStatus === 'cancelled') return 'canceled'
  return lowStatus
}

const displayStatus = (status) => {
  if (!status) return 'Pending'
  const s = status.toLowerCase()
  if (s === 'canceled' || s === 'cancelled') return 'Canceled'
  return status.charAt(0).toUpperCase() + status.slice(1)
}

const formatDate = (dateString) => {
  if (!dateString) return '15 February 2026 at 15:45:31 UTC+7'
  if (dateString && typeof dateString === 'object' && dateString.seconds) {
    dateString = dateString.toDate().toISOString()
  }
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return '15 February 2026 at 15:45:31 UTC+7'
    const formatted = date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
    const time = date.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
    return `${formatted} at ${time} UTC+7`
  } catch (e) {
    return dateString
  }
}
</script>

<template>
  <DashboardLayout>
    <div class="page-container">
      <!-- Registration Overview Section -->
      <section class="overview-section card-box">
        <h2 class="section-title">Registration Overview</h2>
        <div class="cards-row">
          <SummaryCard
            title="Total Registration"
            :value="String(totalRegistration).padStart(3, '0')"
            image="registration.png"
            color="#e1f5fe"
          />
          <SummaryCard
            title="Total Paid Registration"
            :value="String(totalPaidRegistration).padStart(3, '0')"
            image="paid-reg.png"
            color="#e1f5fe"
          />
          <SummaryCard
            title="Total Unpaid Registration"
            :value="String(totalUnpaidRegistration).padStart(3, '0')"
            image="unpaid1.png"
            color="#e1f5fe"
          />
          <SummaryCard
            title="Total Cancelled Registration"
            :value="String(totalCancelledRegistration).padStart(3, '0')"
            image="cancel1.png"
            color="#e1f5fe"
          />
        </div>
      </section>

      <!-- Enrollment Lists Section -->
      <section class="table-section card-box">
        <div class="table-header">
          <h2 class="section-title">Enrollment Lists</h2>
          <div class="header-actions">
            <div class="search-box">
              <span class="search-icon">🔍</span>
              <input v-model="searchQuery" type="text" placeholder="Search something" />
            </div>
            <button class="filter-btn">Filter</button>
          </div>
        </div>

        <div v-if="loading" class="loading-state">Loading enrollments...</div>
        <table v-else class="data-table">
          <thead>
            <tr>
              <th>No</th>
              <th>Parent/Guardian</th>
              <th>Child</th>
              <th>Course</th>
              <th>Session</th>
              <th>#Session</th>
              <th>Status</th>
              <th>Amount</th>
              <th>Enrolled Date</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in filteredRegistrations" :key="item.id">
              <td>{{ index + 1 }}</td>
              <td class="bold">{{ item.parentName || item.parent_name || 'Parent' }}</td>
              <td>{{ item.studentName || item.student_name || 'Student' }}</td>
              <td>{{ item.courseTitle || item.course_title || 'Course' }}</td>
              <td>{{ formatSession(item) }}</td>
              <td>{{ formatSessionCount(item) }}</td>
              <td>
                <span
                  class="status-badge"
                  :class="getStatusClass(item.status || item.paymentStatus)"
                >
                  {{ displayStatus(item.status || item.paymentStatus) }}
                </span>
              </td>
              <td>
                <span class="amount-badge">${{ item.amount || item.totalAmount || 180 }}</span>
              </td>
              <td>
                {{
                  formatDate(
                    item.enrollAt ||
                      item.createdAt ||
                      item.created_at ||
                      item.registrationDate ||
                      item.timestamp,
                  )
                }}
              </td>
            </tr>
            <tr v-if="filteredRegistrations.length === 0 && !loading">
              <td colspan="9" class="empty-state">No enrollments found.</td>
            </tr>
          </tbody>
        </table>
      </section>
    </div>
  </DashboardLayout>
</template>

<style scoped>
.page-container {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.card-box {
  background: white;
  border-radius: 20px;
  padding: 30px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.02);
}

.section-title {
  font-size: 1.15rem;
  font-weight: 700;
  color: #333;
  margin-top: 0;
  margin-bottom: 25px;
  display: flex;
  align-items: center;
}

.overview-section .section-title::after,
.table-header .section-title::after {
  content: '';
  flex: 1;
  margin-left: 20px;
  height: 1px;
  background-color: #eee;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
}

.table-header .section-title {
  margin-bottom: 0;
  flex: 1;
}

.header-actions {
  display: flex;
  gap: 15px;
  margin-left: 20px;
}

.cards-row {
  display: flex;
  gap: 20px;
  width: 100%;
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 15px;
  color: #999;
  font-size: 0.9rem;
}

.search-box input {
  padding: 10px 15px 10px 40px;
  border-radius: 20px;
  border: 1px solid #eee;
  background: #f8f9fa;
  width: 250px;
  font-size: 0.9rem;
}

.search-box input:focus {
  outline: none;
  border-color: #00aeef;
}

.filter-btn {
  background: #81d4fa;
  color: #1a1a1a;
  border: none;
  padding: 10px 25px;
  border-radius: 20px;
  font-weight: 600;
  cursor: pointer;
  font-size: 0.9rem;
  transition: opacity 0.2s;
}

.filter-btn:hover {
  opacity: 0.8;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

.data-table th {
  padding-bottom: 15px;
  padding-top: 0;
  color: #1a1a1a;
  font-size: 0.85rem;
  font-weight: 700;
  border-bottom: 1px solid #f0f0f0;
}

.data-table td {
  padding: 20px 0;
  font-size: 0.85rem;
  color: #444;
  border-bottom: 1px solid #f8f8f8;
  vertical-align: middle;
}

.bold {
  font-weight: 600;
  color: #1a1a1a;
}

.status-badge {
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 700;
}

.status-badge.paid,
.status-badge.confirmed {
  background: #e6f8ea;
  color: #4caf50;
  border: 1px solid #c8e6c9;
}

.status-badge.unpaid,
.status-badge.pending {
  background: #fff9e6;
  color: #fbc02d;
  border: 1px solid #fff59d;
}

.status-badge.canceled,
.status-badge.cancelled {
  background: #fdeaea;
  color: #e53935;
  border: 1px solid #ef9a9a;
}

.amount-badge {
  background: #a2dbff;
  color: #1a1a1a;
  padding: 6px 14px;
  border-radius: 6px;
  font-weight: 700;
  font-size: 0.8rem;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #999;
}

@media (max-width: 1200px) {
  .cards-row {
    flex-wrap: wrap;
  }
}
</style>

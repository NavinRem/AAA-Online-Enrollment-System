<script setup>
import { ref, onMounted, computed } from 'vue'
import DashboardLayout from '../components/DashboardLayout.vue'
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

const filteredRegistrations = computed(() => {
  if (!searchQuery.value) return registrations.value
  const query = searchQuery.value.toLowerCase()
  return registrations.value.filter(
    (r) =>
      (r.parentName || '').toLowerCase().includes(query) ||
      (r.studentName || '').toLowerCase().includes(query) ||
      (r.courseTitle || '').toLowerCase().includes(query),
  )
})

const getStatusClass = (status) => {
  if (!status) return 'pending'
  return status.toLowerCase()
}

const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  // Handle Firestore Timestamp objects if they leaked through
  if (dateString && typeof dateString === 'object' && dateString.seconds) {
    dateString = dateString.toDate().toISOString()
  }
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch (e) {
    return dateString
  }
}
</script>

<template>
  <DashboardLayout>
    <div class="page-container">
      <div class="page-header">
        <div class="header-actions">
          <div class="search-box">
            <input v-model="searchQuery" type="text" placeholder="Search enrollments..." />
          </div>
          <button class="add-btn">+ New Enrollment</button>
        </div>
      </div>

      <div class="table-card">
        <div v-if="loading" class="loading-state">Loading enrollments...</div>
        <table v-else class="data-table">
          <thead>
            <tr>
              <th>No</th>
              <th>Parent Name</th>
              <th>Student Name</th>
              <th>Course</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in filteredRegistrations" :key="item.id">
              <td>{{ index + 1 }}</td>
              <td class="bold">{{ item.parentName || item.parent_name || 'Parent' }}</td>
              <td>{{ item.studentName || item.student_name || 'Student' }}</td>
              <td>{{ item.courseTitle || item.course_title || 'Course' }}</td>
              <td class="amount">${{ item.amount || 0 }}</td>
              <td>
                <span class="status-badge" :class="getStatusClass(item.status)">
                  {{ item.status || 'Pending' }}
                </span>
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
              <td>
                <button class="view-btn">View</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </DashboardLayout>
</template>

<style scoped>
.page-container {
  display: flex;
  flex-direction: column;
  gap: 25px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: 15px;
}

.search-box input {
  padding: 10px 15px;
  border-radius: 10px;
  border: 1px solid #eee;
  width: 280px;
  background: white;
}

.add-btn {
  background: #00aeef;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
}

.table-card {
  background: white;
  border-radius: 20px;
  padding: 25px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.02);
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

.data-table th {
  padding-bottom: 15px;
  color: #999;
  font-size: 0.85rem;
  border-bottom: 1px solid #f0f0f0;
}

.data-table td {
  padding: 15px 0;
  font-size: 0.9rem;
  color: #444;
  border-bottom: 1px solid #f8f8f8;
}

.bold {
  font-weight: 600;
  color: #1a1a1a;
}

.status-badge {
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: capitalize;
}

.status-badge.paid,
.status-badge.confirmed {
  background: #e1f5fe;
  color: #4caf50;
}

.status-badge.pending,
.status-badge.unpaid {
  background: #fffde7;
  color: #fbc02d;
}

.amount {
  font-weight: 700;
  color: #00aeef;
}

.view-btn {
  background: #f8f9fa;
  border: 1px solid #eee;
  padding: 5px 12px;
  border-radius: 6px;
  font-size: 0.8rem;
  cursor: pointer;
}

.loading-state {
  text-align: center;
  padding: 40px;
  color: #999;
}
</style>

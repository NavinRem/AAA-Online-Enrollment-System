<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import DashboardLayout from '../components/DashboardLayout.vue'
import { userService } from '../services/userService'
import { authService } from '../services/authService'

const router = useRouter()
const students = ref([])
const loading = ref(true)
const searchQuery = ref('')

onMounted(async () => {
  const currentUser = authService.getCurrentUser()
  if (!currentUser) {
    router.push('/')
    return
  }

  try {
    const profile = await userService.getProfile(currentUser.uid)
    let data = []

    if (profile && profile.role === 'admin') {
      data = await userService.getAllStudents()
    } else {
      data = await userService.getStudents(currentUser.uid)
    }

    students.value = Array.isArray(data) ? data : []
  } catch (error) {
    console.error('Failed to fetch students', error)
  } finally {
    loading.value = false
  }
})

const filteredStudents = computed(() => {
  if (!searchQuery.value) return students.value
  const query = searchQuery.value.toLowerCase()
  return students.value.filter(
    (s) =>
      (s.name || s.fullName || '').toLowerCase().includes(query) ||
      (s.parentName || '').toLowerCase().includes(query) ||
      (s.studentId || '').toLowerCase().includes(query),
  )
})

const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  } catch (e) {
    return dateString
  }
}

const calculateAge = (dateString) => {
  if (!dateString) return 'N/A'
  const dob = new Date(dateString)
  if (isNaN(dob.getTime())) return 'N/A'
  const diffMs = Date.now() - dob.getTime()
  const ageDate = new Date(diffMs)
  return Math.abs(ageDate.getUTCFullYear() - 1970)
}
</script>

<template>
  <DashboardLayout>
    <div class="page-container">
      <div class="page-header">
        <div class="header-actions">
          <div class="search-box">
            <input v-model="searchQuery" type="text" placeholder="Search students..." />
          </div>
          <button class="add-btn">+ Add Student</button>
        </div>
      </div>

      <div class="table-card">
        <div v-if="loading" class="loading-state">Loading students...</div>
        <table v-else class="data-table">
          <thead>
            <tr>
              <th>No</th>
              <th>Student Name</th>
              <th>Parent/Guardian</th>
              <th>Gender</th>
              <th>Age</th>
              <th>Enrolled Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in filteredStudents" :key="item.id">
              <td>{{ index + 1 }}</td>
              <td class="bold">
                <div class="user-info">
                  <div class="avatar-mini">
                    <img
                      :src="item.profileURL || '/src/assets/images/child-profile.png'"
                      alt="avatar"
                    />
                  </div>
                  {{ item.name || item.fullName || item.fullname || 'Student' }}
                </div>
              </td>
              <td>{{ item.parentName || 'Parent' }}</td>
              <td>{{ item.gender || 'N/A' }}</td>
              <td>{{ calculateAge(item.DoB || item.dob || item.dateOfBirth) }}</td>
              <td>{{ formatDate(item.created_at || item.createdAt) }}</td>
              <td>
                <button class="view-btn">Edit</button>
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

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.avatar-mini {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  overflow: hidden;
  background: #f0f0f0;
}

.avatar-mini img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.bold {
  font-weight: 600;
  color: #1a1a1a;
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

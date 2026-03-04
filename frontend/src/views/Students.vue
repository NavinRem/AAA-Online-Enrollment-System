<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import DashboardLayout from '../components/DashboardLayout.vue'
import AppButton from '../components/common/AppButton/AppButton.vue'
import AppTable from '../components/common/AppTable/AppTable.vue'
import { userService } from '../services/userService'
import { authService } from '../services/authService'
import SearchBox from '../components/common/SearchBox/SearchBox.vue'
import { useSearch, studentSearchMapper } from '../composables/useSearch'

const router = useRouter()
const students = ref([])
const loading = ref(true)

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

const { searchQuery, searchResults: filteredStudents } = useSearch(students, studentSearchMapper)

const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  } catch {
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
          <SearchBox v-model="searchQuery" placeholder="Search students..." />
          <AppButton variant="primary">+ Add Student</AppButton>
        </div>
      </div>

      <div class="table-card">
        <AppTable
          :headers="[
            'No',
            'Student Name',
            'Parent/Guardian',
            'Gender',
            'Age',
            'Enrolled Date',
            'Actions',
          ]"
          :loading="loading"
          :empty="filteredStudents.length === 0"
        >
          <template #loading>Loading students...</template>
          <template #empty>No students found.</template>

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
              <AppButton variant="outline" size="sm">Edit</AppButton>
            </td>
          </tr>
        </AppTable>
      </div>
    </div>
  </DashboardLayout>
</template>
<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: 15px;
}

.table-card {
  background: white;
  border-radius: 20px;
  padding: 25px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.02);
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
</style>

<script setup>
import { ref, onMounted, computed } from 'vue'
import DashboardLayout from '../components/DashboardLayout.vue'
import { userService } from '../services/userService'

const parents = ref([])
const loading = ref(true)
const searchQuery = ref('')

onMounted(async () => {
  try {
    const data = await userService.getAllUsers()
    parents.value = Array.isArray(data) ? data.filter((u) => u.role === 'parent') : []
  } catch (error) {
    console.error('Failed to fetch parents', error)
  } finally {
    loading.value = false
  }
})

const filteredParents = computed(() => {
  if (!searchQuery.value) return parents.value
  const query = searchQuery.value.toLowerCase()
  return parents.value.filter(
    (p) =>
      (p.name || '').toLowerCase().includes(query) || (p.email || '').toLowerCase().includes(query),
  )
})
</script>

<template>
  <DashboardLayout>
    <div class="page-container">
      <div class="page-header">
        <div class="header-actions">
          <div class="search-box">
            <input v-model="searchQuery" type="text" placeholder="Search parents..." />
          </div>
          <button class="add-btn">+ Add Parent</button>
        </div>
      </div>

      <div class="table-card">
        <div v-if="loading" class="loading-state">Loading parents...</div>
        <table v-else class="data-table">
          <thead>
            <tr>
              <th>No</th>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Address</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in filteredParents" :key="item.id">
              <td>{{ index + 1 }}</td>
              <td class="bold">{{ item.name || 'Anonymous' }}</td>
              <td>{{ item.email }}</td>
              <td>{{ item.phone || 'N/A' }}</td>
              <td>{{ item.address || 'N/A' }}</td>
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

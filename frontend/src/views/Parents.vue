<script setup>
import { ref, onMounted } from 'vue'
import DashboardLayout from '../components/DashboardLayout.vue'
import DataPageLayout from '../components/common/DataPageLayout.vue'
import AppButton from '../components/common/AppButton/AppButton.vue'
import SummaryCard from '../components/SummaryCard.vue'
import StatusBadge from '../components/common/StatusBadge/StatusBadge.vue'
import SearchBox from '../components/common/SearchBox/SearchBox.vue'
import { useSearch, parentSearchMapper } from '../composables/useSearch'
import { userService } from '../services/userService'

const parents = ref([])
const guardians = ref([])
const recentlyRegistered = ref([])
const allUsers = ref([])
const loading = ref(true)

onMounted(async () => {
  try {
    const data = await userService.getAllUsers()
    if (Array.isArray(data)) {
      allUsers.value = data.filter((u) => u.role === 'parent' || u.role === 'guardian')
      parents.value = allUsers.value.filter((u) => u.role === 'parent')
      guardians.value = allUsers.value.filter((u) => u.role === 'guardian')

      const oneWeekAgo = new Date()
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
      recentlyRegistered.value = allUsers.value.filter((u) => {
        const time = new Date(u.createdAt || u.created_at || u.updatedAt).getTime()
        return time >= oneWeekAgo.getTime()
      })
    }
  } catch (error) {
    console.error('Failed to fetch parents', error)
  } finally {
    loading.value = false
  }
})

const { searchQuery, searchResults: filteredParents } = useSearch(allUsers, parentSearchMapper)
</script>

<template>
  <DashboardLayout>
    <DataPageLayout overviewTitle="Parent / Guardian Overview" listTitle="Parents/Guardians List">
      <template #overview>
        <SummaryCard
          title="Total Parents"
          :value="parents.length"
          image="register.png"
          color="#e1f5fe"
        />
        <SummaryCard
          title="Total Guardians"
          :value="guardians.length"
          image="register.png"
          color="#e1f5fe"
        />
        <SummaryCard
          title="Recently Registered"
          :value="recentlyRegistered.length"
          image="register.png"
          color="#e1f5fe"
        />
        <SummaryCard
          title="Active Now"
          :value="
            allUsers.filter((u) => u.status !== 'inactive' && u.status !== 'deactivated').length
          "
          image="register.png"
          color="#e1f5fe"
        />
      </template>

      <template #actions>
        <SearchBox v-model="searchQuery" placeholder="Search parameters..." />
        <AppButton variant="secondary" icon="tune" @click="console.log('filter')">Filter</AppButton>
      </template>

      <template #table>
        <div v-if="loading" class="loading-state">Loading parents...</div>
        <table v-else class="data-table">
          <thead>
            <tr>
              <th>No</th>
              <th>Fullname</th>
              <th>Child</th>
              <th>Phone Number</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in filteredParents" :key="item.uid || item.id">
              <td>{{ index + 1 }}</td>
              <td class="bold">{{ item.name || 'Anonymous' }}</td>
              <td>
                <span v-if="!item.children || item.children.length === 0">N/A</span>
                <span v-else>👦👧</span>
              </td>
              <td>{{ item.phone || 'N/A' }}</td>
              <td>{{ item.email }}</td>
              <td>
                <StatusBadge :status="item.role === 'parent' ? 'Parent' : 'Guardian'" />
              </td>
              <td>
                <StatusBadge :status="item.status || 'Active'" />
              </td>
              <td>
                <div class="actions-wrapper">
                  <button class="btn-icon check">🚫</button>
                  <button class="btn-icon delete">🗑️</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </template>
    </DataPageLayout>
  </DashboardLayout>
</template>

<style scoped>
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

.actions-wrapper {
  display: flex;
  gap: 6px;
}

.loading-state {
  text-align: center;
  padding: 40px;
  color: #999;
}
</style>

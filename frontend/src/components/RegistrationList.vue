<script setup>
import { ref, onMounted, watch } from 'vue'
import { registrationService } from '../services/registrationService'

const props = defineProps({
  refreshTrigger: {
    type: Number,
    default: 0,
  },
})

const registrations = ref([])
const loading = ref(true)
const error = ref(null)

const fetchRegistrations = async () => {
  loading.value = true
  error.value = null
  try {
    registrations.value = await registrationService.getAll()
  } catch (err) {
    error.value = 'Failed to load registrations: ' + err.message
  } finally {
    loading.value = false
  }
}

onMounted(fetchRegistrations)

// Watch for specific trigger to reload list
watch(
  () => props.refreshTrigger,
  () => {
    fetchRegistrations()
  },
)
</script>

<template>
  <div class="registration-list">
    <h2>Registered Users</h2>

    <div v-if="loading" class="loading">Loading...</div>
    <div v-if="error" class="error">{{ error }}</div>

    <div v-if="!loading && !error && registrations.length === 0" class="empty">
      No registrations yet.
    </div>

    <table v-if="!loading && registrations.length > 0">
      <thead>
        <tr>
          <th>Name</th>
          <th>Email</th>
          <th>ID</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="user in registrations" :key="user.id">
          <td>{{ user.name }}</td>
          <td>{{ user.email }}</td>
          <td class="id-col">{{ user.id }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.registration-list {
  margin-top: 30px;
  padding: 20px;
  border-top: 2px solid #eee;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 15px;
}

th,
td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #ddd;
}

th {
  background-color: #f8f9fa;
  font-weight: bold;
}

.id-col {
  color: #888;
  font-family: monospace;
  font-size: 0.9em;
}

.error {
  color: red;
  padding: 10px;
  background: #fff0f0;
}

.empty {
  color: #666;
  font-style: italic;
  text-align: center;
  padding: 20px;
}
</style>

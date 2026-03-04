<script setup>
import { ref, onMounted } from 'vue'
import DashboardLayout from '../components/DashboardLayout.vue'
import DataPageLayout from '../components/common/DataPageLayout.vue'
import AppButton from '../components/common/AppButton/AppButton.vue'
import TableToolbar from '../components/common/TableToolbar/TableToolbar.vue'
import { courseService } from '../services/courseService'
import { useSearch, programSearchMapper } from '../composables/useSearch'

const programs = ref([])
const loading = ref(true)

onMounted(async () => {
  try {
    const data = await courseService.getAllCourses()
    programs.value = Array.isArray(data) ? data : []
  } catch (error) {
    console.error('Failed to fetch programs', error)
  } finally {
    loading.value = false
  }
})

const { searchQuery, searchResults: filteredPrograms } = useSearch(programs, programSearchMapper)
</script>

<template>
  <DashboardLayout>
    <DataPageLayout listTitle="Programs">
      <template #actions>
        <TableToolbar
          :hasSearch="true"
          :searchQuery="searchQuery"
          @update:searchQuery="searchQuery = $event"
          searchPlaceholder="Search programs..."
          :hasFilter="false"
        >
          <template #actions>
            <AppButton variant="primary">+ Add Program</AppButton>
          </template>
        </TableToolbar>
      </template>

      <template #table>
        <div class="grid-container">
          <div v-if="loading" class="loading-state">Loading programs...</div>
          <div v-else v-for="program in filteredPrograms" :key="program.id" class="program-card">
            <div class="card-image">
              <img :src="program.imageURL || '/src/assets/images/program.png'" alt="Program" />
              <span class="program-type">{{ program.category || 'General' }}</span>
            </div>
            <div class="card-body">
              <h3 class="program-name">{{ program.title || program.name }}</h3>
              <p class="program-desc">{{ program.description || 'No description provided.' }}</p>
              <div class="card-footer">
                <span class="price">${{ program.price || '0' }}</span>
                <AppButton variant="outline" size="sm">Manage</AppButton>
              </div>
            </div>
          </div>
        </div>
      </template>
    </DataPageLayout>
  </DashboardLayout>
</template>

<style scoped>
.grid-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 25px;
}

.program-card {
  background: white;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.02);
  transition: transform 0.2s;
}

.program-card:hover {
  transform: translateY(-5px);
}

.card-image {
  position: relative;
  height: 180px;
}

.card-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.program-type {
  position: absolute;
  top: 15px;
  left: 15px;
  background: rgba(255, 255, 255, 0.9);
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 700;
  color: #00aeef;
}

.card-body {
  padding: 20px;
}

.program-name {
  font-size: 1.1rem;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 10px;
}

.program-desc {
  font-size: 0.85rem;
  color: #666;
  margin-bottom: 20px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.price {
  font-size: 1.2rem;
  font-weight: 800;
  color: #00aeef;
}

.loading-state {
  grid-column: 1 / -1;
  text-align: center;
  padding: 40px;
  color: #999;
}
</style>

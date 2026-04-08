<template>
  <DataPageLayout title="Class Management" :stats="statsCards" :headers="classHeaders" :items="filteredClasses"
    :loading="loading" searchPlaceholder="Search classes by program, teacher, or branch..." @add="openAddModal">

    <template #table-row="{ item, index }">
      <tr class="table-row">
        <td class="hide-on-mobile text-center">{{ index + 1 }}</td>
        <td>
          <div class="info-cell">
            <div class="program-icon-mini">
              <img :src="getProgramProfileURL(item.program?.profileURL, item.program?.category)" alt="program" />
            </div>
            <div class="text-group">
              <span class="bold">{{ item.program?.name || 'Unknown Program' }}</span>
              <span class="subtext">{{ item.program?.category }}</span>
            </div>
          </div>
        </td>
        <td class="bold">{{ item.term?.name }}</td>
        <td>
          <StatusBadge :status="item.branch?.name || item.branch?.abbr" type="blue" />
        </td>
        <td>
          <div v-if="item.teacher" class="info-cell">
            <div class="avatar-mini">
              <img :src="item.teacher.profileURL || getImageUrl('profiles/avatar-parent')" alt="teacher" />
            </div>
            <span>{{ item.teacher.name }}</span>
          </div>
          <span v-else class="help-text">Not assigned</span>
        </td>
        <td>
          <div class="schedule-cell">
            <span class="day">{{ item.day }}</span>
            <span class="time">{{ item.timeslot }}</span>
          </div>
        </td>
        <td class="text-center">
          <div class="capacity-cell">
            <div class="capacity-bar">
              <div class="bar-fill" :style="{ width: (item.numStudent / item.capacity * 100) + '%' }"
                :class="getCapacityClass(item)"></div>
            </div>
            <span class="count">{{ item.numStudent }}/{{ item.capacity }}</span>
          </div>
        </td>
        <td class="text-center">
          <StatusBadge :status="item.status" :type="item.status === 'open' ? 'success' : 'neutral'" />
        </td>
        <td class="action-cell text-center">
          <button class="btn-icon" @click.stop="openEditModal(item)" title="Edit Class">
            <img :src="getActionIcon('edit')" />
          </button>
        </td>
      </tr>
    </template>

    <template #extra-actions>
      <AppButton variant="outline" size="small" @click="openDuplicateModal">
        <img :src="getActionIcon('calendar')" class="btn-icon-img" />
        Bulk Duplicate
      </AppButton>
    </template>
  </DataPageLayout>

  <ClassActionModal :isOpen="modal.isOpen" :type="modal.type" :classItem="modal.classItem" :loading="modal.loading"
    @close="closeModal" @submit="handleModalSubmit" />
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import DataPageLayout from '@/components/layout/DataPageLayout.vue'
import StatusBadge from '@/components/common/ui/StatusBadge.vue'
import AppButton from '@/components/common/ui/AppButton.vue'
import ClassActionModal from '@/components/classes/ClassActionModal.vue'
import { programService } from '@/services/programService'
import { getImageUrl, getActionIcon } from '@/utils/assetHelper'

const loading = ref(false)
const classes = ref([])

const classHeaders = [
  { label: 'No', width: '50px', class: 'hide-on-mobile', align: 'center' },
  { label: 'Program Model', width: '250px' },
  { label: 'Term', width: '120px' },
  { label: 'Branch', width: '100px' },
  { label: 'Teacher', width: '150px' },
  { label: 'Schedule', width: '150px' },
  { label: 'Enrollment', width: '120px', align: 'center' },
  { label: 'Status', width: '100px', align: 'center' },
  { label: 'Action', width: '80px', align: 'center' },
]

const statsCards = computed(() => [
  { label: 'Live Classes', value: classes.value.length, image: getImageUrl('programs/total-program'), color: 'var(--accent-light)' },
  { label: 'Open Classes', value: classes.value.filter(c => c.status === 'open').length, image: getImageUrl('programs/active-program'), color: 'var(--accent-light)' },
  { label: 'Full Capacity', value: classes.value.filter(c => c.numStudent >= c.capacity).length, image: getImageUrl('programs/archived-program'), color: 'var(--danger-light)' },
])

const fetchClasses = async () => {
  loading.value = true
  try {
    classes.value = await programService.getAllClasses()
  } catch (err) {
    console.error('Failed to fetch classes:', err)
  } finally {
    loading.value = false
  }
}

const filteredClasses = computed(() => classes.value)

const getCapacityClass = (item) => {
  const percent = (item.numStudent / item.capacity) * 100
  if (percent >= 100) return 'full'
  if (percent >= 80) return 'near-full'
  return ''
}

const getProgramProfileURL = (url) => url || getImageUrl('programs/piano')

// Modal State
const modal = ref({
  isOpen: false,
  type: 'add',
  classItem: null,
  loading: false
})

const openAddModal = () => {
  modal.value = { isOpen: true, type: 'add', classItem: null, loading: false }
}

const openEditModal = (item) => {
  modal.value = { isOpen: true, type: 'edit', classItem: item, loading: false }
}

const openDuplicateModal = () => {
  modal.value = { isOpen: true, type: 'duplicate', classItem: null, loading: false }
}

const closeModal = () => {
  modal.value.isOpen = false
}

const handleModalSubmit = async (formData) => {
  modal.value.loading = true
  try {
    if (modal.value.type === 'add') {
      await programService.createClass(formData)
    } else if (modal.value.type === 'edit') {
      await programService.updateProgram(modal.value.classItem.id, formData) // Need to add updateClass to service
    } else if (modal.value.type === 'duplicate') {
      await programService.duplicateClasses(formData)
    }
    await fetchClasses()
    closeModal()
  } catch (err) {
    alert(err.message)
  } finally {
    modal.value.loading = false
  }
}

onMounted(fetchClasses)
</script>

<style scoped>
.info-cell {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.program-icon-mini {
  width: 36px;
  height: 36px;
  border-radius: var(--border-radius-sm);
  overflow: hidden;
  background: var(--bg-light);
}

.program-icon-mini img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.text-group {
  display: flex;
  flex-direction: column;
}

.subtext {
  font-size: var(--text-xs);
  color: var(--text-muted);
}

.avatar-mini {
  width: 24px;
  height: 24px;
  border-radius: var(--border-radius-round);
  overflow: hidden;
}

.avatar-mini img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.schedule-cell {
  display: flex;
  flex-direction: column;
}

.day {
  font-weight: 600;
  font-size: var(--text-sm);
}

.time {
  font-size: var(--text-xs);
  color: var(--text-muted);
}

.capacity-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3xs);
}

.capacity-bar {
  width: 60px;
  height: 6px;
  background: var(--border-color);
  border-radius: 3px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  background: var(--accent-color);
  border-radius: 3px;
}

.bar-fill.near-full {
  background: var(--warning-color);
}

.bar-fill.full {
  background: var(--error-color);
}

.count {
  font-size: var(--text-xs);
  font-weight: 600;
  color: var(--text-muted);
}

.btn-icon-img {
  width: 14px;
  height: 14px;
  margin-right: 6px;
  filter: brightness(0) saturate(100%) invert(43%) sepia(94%) saturate(1637%) hue-rotate(170deg) brightness(101%) contrast(101%);
}
</style>

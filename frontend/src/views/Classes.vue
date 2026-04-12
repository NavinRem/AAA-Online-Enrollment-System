<template>
  <DataPageLayout
    title="Class Management"
    :stats="statsCards"
    :headers="classHeaders"
    :items="filteredClasses"
    :loading="loading"
    searchPlaceholder="Search classes by program, teacher, or branch..."
    @add="openAddModal"
  >
    <template #table-row="{ item, index, headers }">
      <tr class="ui-row">
        <td
          class="ui-cell text-center font-bold text-content-muted/40 hide-on-mobile"
          :style="{ width: headers[0].width }"
        >
          {{ index + 1 }}
        </td>
        <td class="ui-cell" :style="{ width: headers[1].width }">
          <div class="ui-identity-cell">
            <div class="ui-avatar-sm ring-1 ring-border bg-white">
              <img
                :src="getProgramProfileURL(item.program?.profileURL, item.program?.category)"
                alt="program"
              />
            </div>
            <div class="ui-identity-info">
              <span class="font-bold text-content-dark">{{
                item.program?.name || 'Unknown Program'
              }}</span>
              <span class="text-3xs text-content-muted uppercase font-bold tracking-tight">{{
                item.program?.category
              }}</span>
            </div>
          </div>
        </td>
        <td class="ui-cell font-bold text-content-dark" :style="{ width: headers[2].width }">
          {{ item.term?.name }}
        </td>
        <td class="ui-cell text-center" :style="{ width: headers[3].width }">
          <StatusBadge :status="item.branch?.name || item.branch?.abbr" type="blue" />
        </td>
        <td class="ui-cell" :style="{ width: headers[4].width }">
          <div v-if="item.teacher" class="ui-identity-cell">
            <div class="ui-avatar-sm">
              <img
                :src="item.teacher.profileURL || getImageUrl('profiles/avatar-parent')"
                alt="teacher"
              />
            </div>
            <span class="font-bold text-xs text-content-dark">{{ item.teacher.name }}</span>
          </div>
          <span v-else class="text-content-muted/40 italic text-xs">Not assigned</span>
        </td>
        <td class="ui-cell" :style="{ width: headers[5].width }">
          <div class="flex flex-col gap-0.5">
            <span class="text-xs font-black text-content-dark uppercase tracking-tighter">{{
              item.day
            }}</span>
            <span class="text-3xs text-content-muted font-bold uppercase">{{ item.timeslot }}</span>
          </div>
        </td>
        <td class="ui-cell text-center" :style="{ width: headers[6].width }">
          <div class="flex flex-col items-center gap-1 w-full">
            <div class="w-16 h-1.5 bg-surface-light rounded-full overflow-hidden">
              <div
                class="h-full transition-all duration-500 rounded-full"
                :style="{ width: (item.numStudent / item.capacity) * 100 + '%' }"
                :class="getCapacityClass(item)"
              ></div>
            </div>
            <span class="text-3xs font-black text-content-muted uppercase tracking-widest"
              >{{ item.numStudent }}/{{ item.capacity }}</span
            >
          </div>
        </td>
        <td class="ui-cell text-center" :style="{ width: headers[7].width }">
          <StatusBadge
            :status="item.status"
            :type="item.status === 'open' ? 'success' : 'neutral'"
          />
        </td>
        <td class="ui-cell text-center" :style="{ width: headers[8].width }">
          <div class="ui-action-menu">
            <button class="ui-btn-dots" @click.stop="openEditModal(item)">
              <img :src="getActionIcon('edit')" class="w-4 h-4 opacity-70" />
            </button>
          </div>
        </td>
      </tr>
    </template>

    <template #extra-actions>
      <AppButton variant="secondary" @click="openDuplicateModal">
        <img :src="getActionIcon('calendar')" class="w-4 h-4 brightness-0 invert opacity-70 mr-2" />
        Bulk Duplicate
      </AppButton>
    </template>
  </DataPageLayout>

  <ClassActionModal
    :isOpen="modal.isOpen"
    :type="modal.type"
    :classItem="modal.classItem"
    :loading="modal.loading"
    @close="closeModal"
    @submit="handleModalSubmit"
  />
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
  {
    label: 'Live Classes',
    value: classes.value.length,
    image: getImageUrl('programs/total-program'),
    color: 'var(--accent-light)',
  },
  {
    label: 'Open Classes',
    value: classes.value.filter((c) => c.status === 'open').length,
    image: getImageUrl('programs/active-program'),
    color: 'var(--accent-light)',
  },
  {
    label: 'Full Capacity',
    value: classes.value.filter((c) => c.numStudent >= c.capacity).length,
    image: getImageUrl('programs/archived-program'),
    color: 'var(--danger-light)',
  },
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
  loading: false,
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

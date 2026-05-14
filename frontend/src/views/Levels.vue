<script setup>
import { ref, onMounted, computed } from 'vue'
import DashboardLayout from '../components/layout/DashboardLayout.vue'
import DataPageLayout from '../components/layout/DataPageLayout.vue'
import AppButton from '../components/common/ui/AppButton.vue'
import DataTable from '../components/common/data/DataTable.vue'
import AppBadge from '../components/common/ui/AppBadge.vue'
import LevelActionModal from '../components/levels/LevelActionModal.vue'
import DataMetricCard from '@/components/common/data/DataMetricCard.vue'
import { levelService } from '../services/levelService'
import { programService } from '../services/programService'
import { useSearch } from '../composables/useSearch'
import { getImageUrl, getActionIcon } from '@/utils/assetHelper'

const levels = ref([])
const programs = ref([])
const loading = ref(true)
const newlyCreatedId = ref(null)

const actionModal = ref({
  isOpen: false,
  type: 'add',
  level: null,
  loading: false,
  error: '',
  success: '',
})

const fetchLevels = async () => {
  loading.value = true
  try {
    const [levelsData, programsData] = await Promise.all([
      levelService.getAllLevels(),
      programService.getAllPrograms(),
    ])
    levels.value = Array.isArray(levelsData) ? levelsData : []
    programs.value = Array.isArray(programsData) ? programsData : []
  } catch (error) {
    console.error('Failed to fetch levels', error)
  } finally {
    loading.value = false
  }
}

onMounted(fetchLevels)

const levelHeaders = [
  { label: 'No', width: '80px', align: 'center' },
  { label: 'Level Name' },
  { label: 'Description', class: 'hidden md:table-cell' },
  { label: 'Programs Count', align: 'center', width: '150px' },
  { label: 'Action', width: '100px', align: 'center' },
]

const { searchQuery, searchResults } = useSearch(levels, (l) => {
  return `${l.name} ${l.description}`
})

const filteredLevels = computed(() => {
  return [...searchResults.value].sort(
    (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
  )
})

const statsCards = computed(() => {
  return [
    {
      label: 'Total Difficulty Levels',
      value: levels.value.length,
      image: getImageUrl('programs/total-program'),
    },
    {
      label: 'Most Common Level',
      value: getMostCommonLevel().name,
      subValue: `${getMostCommonLevel().count} Programs`,
      image: getImageUrl('programs/active-program'),
    },
  ]
})

function getMostCommonLevel() {
  if (!levels.value.length || !programs.value.length) return { name: 'None', count: 0 }
  const counts = {}
  programs.value.forEach((p) => {
    if (p.levelId) counts[p.levelId] = (counts[p.levelId] || 0) + 1
  })
  let max = 0,
    maxId = null
  for (const id in counts) {
    if (counts[id] > max) {
      max = counts[id]
      maxId = id
    }
  }
  const level = levels.value.find((l) => l.id === maxId)
  return { name: level?.name || 'Unassigned', count: max }
}

const handleAction = (type, level) => {
  actionModal.value = {
    isOpen: true,
    type,
    level,
    loading: false,
    error: '',
    success: '',
  }
}

const closeModal = () => {
  actionModal.value.isOpen = false
}

const handleActionSubmit = async (formData) => {
  actionModal.value.loading = true
  actionModal.value.error = ''
  try {
    if (actionModal.value.type === 'add') {
      const result = await levelService.createLevel(formData)
      newlyCreatedId.value = result.id
      actionModal.value.success = 'Level created successfully!'
    } else if (actionModal.value.type === 'edit') {
      await levelService.updateLevel(actionModal.value.level.id, formData)
      actionModal.value.success = 'Level updated successfully!'
    } else if (actionModal.value.type === 'delete') {
      await levelService.deleteLevel(actionModal.value.level.id)
      actionModal.value.success = 'Level deleted successfully!'
    }

    setTimeout(async () => {
      await fetchLevels()
      closeModal()
    }, 1500)
  } catch (error) {
    actionModal.value.error = error.message || 'Failed to process request'
  } finally {
    actionModal.value.loading = false
  }
}

const getProgramCount = (levelId) => {
  return programs.value.filter((p) => p.levelId === levelId).length
}
</script>

<template>
  <DashboardLayout>
    <DataPageLayout overviewTitle="Level Management">
      <template #overview>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <DataMetricCard v-for="stat in statsCards" :key="stat.label" v-bind="stat" />
        </div>
      </template>

      <template #table>
        <DataTable
          title="Level Configuration"
          :headers="levelHeaders"
          :items="filteredLevels"
          :loading="loading"
          v-model:searchQuery="searchQuery"
          searchPlaceholder="Search levels..."
          @action="({ type, item }) => handleAction(type, item)"
        >
          <template #toolbar-actions>
            <AppButton variant="primary" @click="handleAction('add')">
              <img :src="getActionIcon('plus')" class="w-4 h-4 brightness-0 invert" />
              <span>New Level</span>
            </AppButton>
          </template>

          <template #row="{ item, index, headers }">
            <td class="ui-cell text-center" style="width: 80px">
              {{ index + 1 }}
            </td>
            <td class="ui-cell">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <span class="text-xs font-bold text-primary">{{ item.name.charAt(0) }}</span>
                </div>
                <span class="">{{ item.name }}</span>
              </div>
            </td>
            <td class="ui-cell hidden md:table-cell">
              <span class="line-clamp-1">{{ item.description || 'No description' }}</span>
            </td>
            <td class="ui-cell text-center">
              <AppBadge :status="getProgramCount(item.id) + ' Programs'" type="blue" />
            </td>
            <td class="ui-cell text-center">
              <div class="flex justify-center gap-2">
                <button
                  @click="handleAction('edit', item)"
                  class="p-2 hover:bg-surface-subtle rounded-lg transition-colors"
                >
                  <img :src="getActionIcon('edit')" class="w-4 h-4 opacity-60" />
                </button>
                <button
                  @click="handleAction('delete', item)"
                  class="p-2 hover:bg-error-soft rounded-lg transition-colors"
                >
                  <img :src="getActionIcon('delete')" class="w-4 h-4 opacity-60" />
                </button>
              </div>
            </td>
          </template>
        </DataTable>
      </template>
    </DataPageLayout>

    <LevelActionModal
      :isOpen="actionModal.isOpen"
      :type="actionModal.type"
      :level="actionModal.level"
      :loading="actionModal.loading"
      :error="actionModal.error"
      :success="actionModal.success"
      @close="closeModal"
      @submit="handleActionSubmit"
    />
  </DashboardLayout>
</template>

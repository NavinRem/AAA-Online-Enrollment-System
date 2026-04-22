<script setup>
import { ref, onMounted, computed } from 'vue'
import DashboardLayout from '../components/layout/DashboardLayout.vue'
import DataPageLayout from '../components/layout/DataPageLayout.vue'
import DataTable from '../components/common/data/DataTable.vue'
import AppButton from '../components/common/ui/AppButton.vue'
import AppBadge from '../components/common/ui/AppBadge.vue'
import AppModal from '../components/common/ui/AppModal.vue'
import AppInput from '../components/common/ui/AppInput.vue'
import AppSelect from '../components/common/ui/AppSelect.vue'

import { termService } from '@/services/termService'
import { levelService } from '@/services/levelService'
import { categoryService } from '@/services/categoryService'
import { getActionIcon } from '@/utils/assetHelper'
import { formatDate } from '@/utils/formatUtils'

const activeTab = ref('terms')
const loading = ref(false)
const items = ref([])

const tabs = [
  { id: 'terms', label: 'Academic Terms', icon: 'navigation/program.svg' },
  { id: 'levels', label: 'Curriculum Levels', icon: 'navigation/student.svg' },
  { id: 'categories', label: 'Program Categories', icon: 'navigation/enrollment.svg' },
]

const headersMap = {
  terms: [
    { label: 'Term Identity', width: '200px' },
    { label: 'Timeline', width: '250px' },
    { label: 'Status', width: '120px', align: 'center' },
    { label: 'Action', width: '100px', align: 'center' },
  ],
  levels: [
    { label: 'Level Identity' },
    { label: 'Sequence', width: '100px', align: 'center' },
    { label: 'Status', width: '120px', align: 'center' },
    { label: 'Action', width: '100px', align: 'center' },
  ],
  categories: [
    { label: 'Category Name' },
    { label: 'Logical Code', width: '150px' },
    { label: 'Status', width: '120px', align: 'center' },
    { label: 'Action', width: '100px', align: 'center' },
  ],
}

const fetchData = async () => {
  loading.value = true
  try {
    if (activeTab.value === 'terms') items.value = await termService.getAllTerms()
    else if (activeTab.value === 'levels') items.value = await levelService.getAllLevels()
    else if (activeTab.value === 'categories') items.value = await categoryService.getAllCategories()
  } catch (err) {
    console.error('Failed to fetch lookup data', err)
  } finally {
    loading.value = false
  }
}

onMounted(fetchData)

const handleTabChange = (tabId) => {
  activeTab.value = tabId
  fetchData()
}

// Modal Logic
const isModalOpen = ref(false)
const modalType = ref('add')
const selectedItem = ref(null)
const submitting = ref(false)
const form = ref({
  name: '',
  startDate: '',
  endDate: '',
  status: 'active',
  order: 0,
  code: '',
})

const openModal = (type, item = null) => {
  modalType.value = type
  selectedItem.value = item
  if (item) {
    form.value = { ...item }
  } else {
    form.value = {
      name: '',
      startDate: '',
      endDate: '',
      status: 'active',
      order: 0,
      code: '',
    }
  }
  isModalOpen.value = true
}

const handleSubmit = async () => {
  submitting.value = true
  try {
    const payload = { ...form.value }
    if (modalType.value === 'add') {
      if (activeTab.value === 'terms') await termService.createTerm(payload)
      else if (activeTab.value === 'levels') await levelService.createLevel(payload)
      else if (activeTab.value === 'categories') await categoryService.createCategory(payload)
    } else {
      if (activeTab.value === 'terms') await termService.updateTerm(selectedItem.value.id, payload)
      else if (activeTab.value === 'levels') await levelService.updateLevel(selectedItem.value.id, payload)
      else if (activeTab.value === 'categories') await categoryService.updateCategory(selectedItem.value.id, payload)
    }
    fetchData()
    isModalOpen.value = false
  } catch (err) {
    console.error('Failed to save lookup', err)
  } finally {
    submitting.value = false
  }
}

const handleDelete = async (item) => {
  if (!confirm(`Are you sure you want to purge this ${activeTab.value.slice(0, -1)}?`)) return
  try {
    if (activeTab.value === 'terms') await termService.deleteTerm(item.id)
    else if (activeTab.value === 'levels') await levelService.deleteLevel(item.id)
    else if (activeTab.value === 'categories') await categoryService.deleteCategory(item.id)
    fetchData()
  } catch (err) {
    console.error('Failed to delete lookup', err)
  }
}
</script>

<template>
  <DashboardLayout>
    <DataPageLayout overviewTitle="Global System Configuration">
      <template #overview>
        <div class="flex items-center gap-4 mb-8 bg-surface-subtle p-1.5 rounded-2xl border border-black/5 w-fit">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            @click="handleTabChange(tab.id)"
            class="px-6 py-2.5 rounded-xl text-sm font-black transition-all duration-300 flex items-center gap-2"
            :class="activeTab === tab.id 
              ? 'bg-white text-primary shadow-sm shadow-primary/10 border border-primary/10' 
              : 'text-content-muted hover:text-content-dark'"
          >
            <span class="tracking-tighter">{{ tab.label }}</span>
          </button>
        </div>
      </template>

      <template #table>
        <DataTable
          :title="tabs.find(t => t.id === activeTab).label + ' Registry'"
          :headers="headersMap[activeTab]"
          :items="items"
          :loading="loading"
          :entityName="activeTab"
        >
          <template #toolbar-actions>
            <AppButton variant="primary" size="md" class="rounded-xl shadow-lg shadow-primary/20" @click="openModal('add')">
              <img :src="getActionIcon('plus')" class="w-4 h-4 brightness-0 invert" />
              <span class="font-black tracking-tight">Add {{ activeTab.slice(0, -1) }}</span>
            </AppButton>
          </template>

          <template #row="{ item, headers }">
            <!-- TERMS ROW -->
            <template v-if="activeTab === 'terms'">
              <td class="ui-cell">
                <div class="flex flex-col">
                  <span class="font-black text-content-dark tracking-tighter text-base leading-tight">{{ item.name }}</span>
                  <span class="text-[9px] font-black text-content-muted uppercase tracking-widest mt-1">Academic Session</span>
                </div>
              </td>
              <td class="ui-cell">
                <div class="flex items-center gap-3">
                   <div class="flex flex-col items-center px-2 py-1 bg-surface-subtle rounded-lg border border-black/5">
                      <span class="text-[9px] font-black text-content-muted uppercase leading-none mb-1">Start</span>
                      <span class="text-[11px] font-bold text-content-dark">{{ formatDate(item.startDate) }}</span>
                   </div>
                   <div class="w-2 h-px bg-content-muted/20"></div>
                   <div class="flex flex-col items-center px-2 py-1 bg-surface-subtle rounded-lg border border-black/5">
                      <span class="text-[9px] font-black text-content-muted uppercase leading-none mb-1">End</span>
                      <span class="text-[11px] font-bold text-content-dark">{{ formatDate(item.endDate) }}</span>
                   </div>
                </div>
              </td>
            </template>

            <!-- LEVELS ROW -->
            <template v-else-if="activeTab === 'levels'">
              <td class="ui-cell">
                <div class="flex flex-col">
                  <span class="font-black text-content-dark tracking-tighter text-base leading-tight">{{ item.name }}</span>
                  <span class="text-[9px] font-black text-content-muted uppercase tracking-widest mt-1">Curriculum Grade</span>
                </div>
              </td>
              <td class="ui-cell text-center">
                 <span class="inline-flex w-8 h-8 items-center justify-center rounded-lg bg-primary/5 text-primary font-black text-xs border border-primary/10">
                    {{ item.order || 0 }}
                 </span>
              </td>
            </template>

            <!-- CATEGORIES ROW -->
            <template v-else-if="activeTab === 'categories'">
              <td class="ui-cell">
                <div class="flex flex-col">
                  <span class="font-black text-content-dark tracking-tighter text-base leading-tight">{{ item.name }}</span>
                  <span class="text-[9px] font-black text-content-muted uppercase tracking-widest mt-1">Subject Domain</span>
                </div>
              </td>
              <td class="ui-cell">
                 <span class="px-2 py-1 rounded-md bg-surface-subtle border border-black/5 text-[10px] font-black text-content-muted uppercase tracking-widest">
                    {{ item.code || 'N/A' }}
                 </span>
              </td>
            </template>

            <td class="ui-cell text-center">
              <AppBadge :status="item.status || 'Active'" />
            </td>

            <td class="ui-cell text-center">
              <div class="flex items-center justify-center gap-2">
                <button @click="openModal('edit', item)" class="p-2 hover:bg-surface-subtle rounded-xl transition-all group">
                   <img :src="getActionIcon('edit')" class="w-4 h-4 opacity-40 group-hover:opacity-100 transition-opacity" />
                </button>
                <button @click="handleDelete(item)" class="p-2 hover:bg-red-50 rounded-xl transition-all group">
                   <img :src="getActionIcon('delete')" class="w-4 h-4 opacity-40 group-hover:opacity-100 transition-opacity filter-red" />
                </button>
              </div>
            </td>
          </template>
        </DataTable>
      </template>
    </DataPageLayout>

    <!-- Generic Modal for Lookups -->
    <AppModal
      :show="isModalOpen"
      :title="(modalType === 'add' ? 'Initialize ' : 'Engineer ') + activeTab.slice(0, -1).toUpperCase()"
      @close="isModalOpen = false"
    >
      <form @submit.prevent="handleSubmit" class="flex flex-col gap-6">
        <AppInput v-model="form.name" label="Identity Name" placeholder="Enter display name..." required />
        
        <template v-if="activeTab === 'terms'">
           <div class="grid grid-cols-2 gap-4">
              <AppInput v-model="form.startDate" type="date" label="Commencement Date" required />
              <AppInput v-model="form.endDate" type="date" label="Conclusion Date" required />
           </div>
        </template>

        <template v-if="activeTab === 'levels'">
           <AppInput v-model="form.order" type="number" label="Hierarchy Sequence" placeholder="0" />
        </template>

        <template v-if="activeTab === 'categories'">
           <AppInput v-model="form.code" label="Logical Reference Code" placeholder="e.g. ART, STEM" />
        </template>

        <AppSelect
          v-model="form.status"
          label="Operational Status"
          :items="[
            { id: 'active', name: 'Active / Visible' },
            { id: 'inactive', name: 'Inactive / Hidden' },
          ]"
        />

        <div class="flex items-center justify-end gap-3 mt-4">
          <AppButton variant="cancel" @click="isModalOpen = false">Abort</AppButton>
          <AppButton type="submit" variant="primary" :loading="submitting" class="px-8 font-black">
             {{ modalType === 'add' ? 'Authorize' : 'Update' }}
          </AppButton>
        </div>
      </form>
    </AppModal>
  </DashboardLayout>
</template>

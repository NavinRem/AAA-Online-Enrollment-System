<script setup>
import { ref, onMounted } from 'vue'
import DashboardLayout from '../components/layout/DashboardLayout.vue'
import DataPageLayout from '../components/layout/DataPageLayout.vue'
import DataTable from '../components/common/data/DataTable.vue'
import AppButton from '../components/common/ui/AppButton.vue'
import AppBadge from '../components/common/ui/AppBadge.vue'
import AppModal from '../components/common/ui/AppModal.vue'
import AppInput from '../components/common/ui/AppInput.vue'
import AppSelect from '../components/common/ui/AppSelect.vue'

import { termService } from '@/services/termService'
import { getActionIcon } from '@/utils/assetHelper'
import { formatDate } from '@/utils/formatUtils'

const loading = ref(false)
const items = ref([])

const headers = [
  { label: 'NO', width: '50px', align: 'center' },
  { label: 'ACADEMIC TERM', width: '250px' },
  { label: 'TIMELINE', width: '300px' },
  { label: 'STATUS', width: '120px', align: 'center' },
  { label: 'ACTION', width: '100px', align: 'center' },
]

const fetchData = async () => {
  loading.value = true
  try {
    const data = await termService.getAllTerms()
    items.value = Array.isArray(data) ? data : []
  } catch (err) {
    console.error('Failed to fetch terms', err)
  } finally {
    loading.value = false
  }
}

onMounted(fetchData)

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
    }
  }
  isModalOpen.value = true
}

const handleSubmit = async () => {
  submitting.value = true
  try {
    const payload = { ...form.value }
    if (modalType.value === 'add') {
      await termService.createTerm(payload)
    } else {
      await termService.updateTerm(selectedItem.value.id, payload)
    }
    fetchData()
    isModalOpen.value = false
  } catch (err) {
    console.error('Failed to save term', err)
  } finally {
    submitting.value = false
  }
}

const handleDelete = async (item) => {
  if (!confirm(`Are you sure you want to purge this academic term?`)) return
  try {
    await termService.deleteTerm(item.id)
    fetchData()
  } catch (err) {
    console.error('Failed to delete term', err)
  }
}
</script>

<template>
  <DashboardLayout>
    <DataPageLayout overviewTitle="Term Overview">
      <template #table>
        <DataTable title="Term Lists" :headers="headers" :items="items" :loading="loading" entityName="term">
          <template #toolbar-actions>
            <AppButton variant="primary" size="md" class="rounded-xl shadow-lg shadow-primary/20"
              @click="openModal('add')">
              <img :src="getActionIcon('plus')" class="w-4 h-4 brightness-0 invert" />
              <span class="font-black tracking-tight">New Term</span>
            </AppButton>
          </template>

          <template #row="{ item, index, headers, toggleMenu, activeMenuId, isMenuAbove, menuStyles, closeMenu }">
            <td class="ui-cell text-center font-bold text-content-muted/30" :style="{ width: headers[0].width }">
              {{ index + 1 }}
            </td>

            <td class="ui-cell" :style="{ width: headers[1].width }">
              <div class="flex items-center gap-4 group">
                <div
                  class="w-10 h-10 rounded-xl bg-surface-subtle border border-outline-std overflow-hidden flex items-center justify-center">
                  <span class="text-lg font-black text-primary opacity-40">📅</span>
                </div>
                <div class="flex flex-col">
                  <span class="font-black text-content-dark tracking-tighter text-base leading-tight">{{ item.name
                    }}</span>
                  <span class="text-[9px] font-black text-content-muted uppercase tracking-widest mt-1">Academic
                    Session</span>
                </div>
              </div>
            </td>

            <td class="ui-cell" :style="{ width: headers[2].width }">
              <div class="flex items-center gap-3">
                <div class="flex flex-col items-center px-3 py-1.5 bg-surface-subtle rounded-lg border border-black/5">
                  <span class="text-[9px] font-black text-content-muted uppercase leading-none mb-1">Commencement</span>
                  <span class="text-[11px] font-bold text-content-dark tabular-nums">{{ formatDate(item.startDate)
                    }}</span>
                </div>
                <div class="w-4 h-px bg-content-muted/20"></div>
                <div class="flex flex-col items-center px-3 py-1.5 bg-surface-subtle rounded-lg border border-black/5">
                  <span class="text-[9px] font-black text-content-muted uppercase leading-none mb-1">Conclusion</span>
                  <span class="text-[11px] font-bold text-content-dark tabular-nums">{{ formatDate(item.endDate)
                    }}</span>
                </div>
              </div>
            </td>

            <td class="ui-cell text-center" :style="{ width: headers[3].width }">
              <AppBadge :status="item.status || 'Active'" />
            </td>

            <td class="ui-cell text-center" :style="{ width: headers[4].width }">
              <div class="ui-action-menu">
                <button
                  class="w-8 h-8 flex items-center justify-center hover:bg-surface-subtle rounded-lg transition-all text-content-muted hover:text-content-dark"
                  @click.stop="toggleMenu($event, item.id)">
                  <span class="font-black text-lg leading-none mb-1">⋮</span>
                </button>
                <Teleport to="body">
                  <transition enter-active-class="transition duration-200 ease-out"
                    enter-from-class="transform scale-95 opacity-0" enter-to-class="transform scale-100 opacity-100"
                    leave-active-class="transition duration-150 ease-in" leave-from-class="opacity-100"
                    leave-to-class="opacity-0">
                    <div v-if="activeMenuId === item.id" class="ui-dropdown-menu"
                      :class="{ 'origin-bottom': isMenuAbove, 'origin-top': !isMenuAbove }" :style="menuStyles"
                      @click.stop>
                      <button class="ui-dropdown-item ui-dropdown-item-info group"
                        @click="openModal('edit', item); closeMenu()">
                        <img :src="getActionIcon('edit')"
                          class="w-4 h-4 opacity-40 group-hover:opacity-100 transition-opacity" />
                        <span class="font-bold text-sm">Edit Term</span>
                      </button>

                      <div class="h-px bg-surface-light mx-1 my-1"></div>

                      <button class="ui-dropdown-item ui-dropdown-item-danger group font-black tracking-tighter"
                        @click="handleDelete(item); closeMenu()">
                        <img :src="getActionIcon('delete')"
                          class="w-4 h-4 opacity-40 group-hover:opacity-100 transition-opacity" />
                        Delete Term
                      </button>
                    </div>
                  </transition>
                </Teleport>
              </div>
            </td>
          </template>
        </DataTable>
      </template>
    </DataPageLayout>

    <AppModal :show="isModalOpen" :title="modalType === 'add' ? 'Add Term' : 'Update Term'"
      @close="isModalOpen = false">
      <form @submit.prevent="handleSubmit" class="flex flex-col gap-6">
        <AppInput v-model="form.name" label="Term Identity" placeholder="e.g. Fall 2026" required />

        <div class="grid grid-cols-2 gap-4">
          <AppInput v-model="form.startDate" type="date" label="Commencement Date" required />
          <AppInput v-model="form.endDate" type="date" label="Conclusion Date" required />
        </div>

        <AppSelect v-model="form.status" label="Operational Status" :items="[
          { id: 'active', name: 'Active' },
          { id: 'inactive', name: 'Inactive' },
        ]" />

        <div class="flex items-center justify-end gap-3 mt-4">
          <AppButton variant="cancel" @click="isModalOpen = false">Cancel</AppButton>
          <AppButton type="submit" variant="primary" :loading="submitting" class="px-8 font-black">
            {{ modalType === 'add' ? 'Add Term' : 'Update' }}
          </AppButton>
        </div>
      </form>
    </AppModal>
  </DashboardLayout>
</template>

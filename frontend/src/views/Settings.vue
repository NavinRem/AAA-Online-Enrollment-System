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

import { levelService } from '@/services/levelService'
import { categoryService } from '@/services/categoryService'
import { getActionIcon } from '@/utils/assetHelper'

const activeTab = ref('levels')
const loading = ref(false)
const items = ref([])

const tabs = [
  { id: 'levels', label: 'Curriculum Levels', icon: 'navigation/student.svg' },
  { id: 'categories', label: 'Program Categories', icon: 'navigation/enrollment.svg' },
  { id: 'general', label: 'General & Theme Settings', icon: 'navigation/setting.svg' },
]

const headersMap = {
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

// General System & Theme Settings State
const generalSettings = ref({
  academyName: 'Authentic Advanced Academy',
  supportEmail: 'support@aaa.edu.kh',
  supportPhone: '+855 23 888 999',
  currency: '$',
  allowParentRegistration: true,
  defaultTrialStatus: 'pending',
  maxWeeklySessions: 12,
  themeAccent: 'sky',
})

const themePresets = [
  {
    id: 'sky',
    name: 'Sky Blue (Classic)',
    primary: '#38bdf8',
    dark: '#0ea5e9',
    light: '#e0f2fe',
    deep: '#0284c7',
  },
  {
    id: 'emerald',
    name: 'Emerald Green (Fresh)',
    primary: '#10b981',
    dark: '#059669',
    light: '#d1fae5',
    deep: '#047857',
  },
  {
    id: 'indigo',
    name: 'Indigo Purple (Premium)',
    primary: '#6366f1',
    dark: '#4f46e5',
    light: '#e0e7ff',
    deep: '#4338ca',
  },
  {
    id: 'rose',
    name: 'Rose Pink (Vibrant)',
    primary: '#f43f5e',
    dark: '#e11d48',
    light: '#ffe4e6',
    deep: '#be123c',
  },
  {
    id: 'amber',
    name: 'Amber Gold (Prestige)',
    primary: '#f59e0b',
    dark: '#d97706',
    light: '#fef3c7',
    deep: '#b45309',
  },
]

const loadGeneralSettings = () => {
  const savedName = localStorage.getItem('aaa-academy-name')
  if (savedName) generalSettings.value.academyName = savedName

  const savedSettings = localStorage.getItem('aaa-general-settings')
  if (savedSettings) {
    try {
      generalSettings.value = { ...generalSettings.value, ...JSON.parse(savedSettings) }
    } catch (e) {
      console.error('Failed to parse general settings', e)
    }
  }
}

const saveSuccess = ref(false)
const saveGeneralSettings = () => {
  localStorage.setItem('aaa-academy-name', generalSettings.value.academyName)
  localStorage.setItem('aaa-general-settings', JSON.stringify(generalSettings.value))

  // Dispatch custom same-page event for instantaneous Sidebar brand update
  window.dispatchEvent(new Event('academy-name-changed'))

  // Dynamically apply selected Accent Preset colors to :root CSS properties
  const theme = themePresets.find((t) => t.id === generalSettings.value.themeAccent)
  if (theme) {
    localStorage.setItem('aaa-app-theme', JSON.stringify(theme))
    const root = document.documentElement
    root.style.setProperty('--color-primary', theme.primary)
    root.style.setProperty('--color-primary-dark', theme.dark)
    root.style.setProperty('--color-primary-light', theme.light)
    root.style.setProperty('--color-primary-soft', theme.light)
    root.style.setProperty('--color-primary-deep', theme.deep)
  }

  saveSuccess.value = true
  setTimeout(() => {
    saveSuccess.value = false
  }, 3000)
}

const fetchData = async () => {
  if (activeTab.value === 'general') {
    items.value = []
    return
  }
  loading.value = true
  try {
    if (activeTab.value === 'levels') items.value = await levelService.getAllLevels()
    else if (activeTab.value === 'categories')
      items.value = await categoryService.getAllCategories()
  } catch (err) {
    console.error('Failed to fetch lookup data', err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchData()
  loadGeneralSettings()
})

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
      if (activeTab.value === 'levels') await levelService.createLevel(payload)
      else if (activeTab.value === 'categories') await categoryService.createCategory(payload)
    } else {
      if (activeTab.value === 'levels')
        await levelService.updateLevel(selectedItem.value.id, payload)
      else if (activeTab.value === 'categories')
        await categoryService.updateCategory(selectedItem.value.id, payload)
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
  if (!confirm(`Are you sure you want to delete this ${activeTab.value.slice(0, -1)}?`)) return
  try {
    if (activeTab.value === 'levels') await levelService.deleteLevel(item.id)
    else if (activeTab.value === 'categories') await categoryService.deleteCategory(item.id)
    fetchData()
  } catch (err) {
    console.error('Failed to delete lookup', err)
  }
}
</script>

<template>
  <DashboardLayout>
    <DataPageLayout overviewTitle="System Settings">
      <template #overview>
        <div
          class="flex items-center gap-4 mb-8 bg-surface-subtle p-1.5 rounded-2xl border border-black/5 w-fit"
        >
          <button
            v-for="tab in tabs"
            :key="tab.id"
            @click="handleTabChange(tab.id)"
            class="px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center gap-2"
            :class="
              activeTab === tab.id
                ? 'bg-white text-primary shadow-sm shadow-primary/10 border border-primary/10'
                : 'text-content-muted hover:text-content-dark'
            "
          >
            <span class="tracking-tighter">{{ tab.label }}</span>
          </button>
        </div>
      </template>

      <template #table>
        <!-- GENERAL SYSTEM & THEME SETTINGS -->
        <div v-if="activeTab === 'general'" class="p-xl flex flex-col gap-xl">
          <div class="flex flex-col gap-xs border-b border-surface-light pb-md">
            <h3 class="text-xl font-bold text-content-dark">
              General Customization & Theme Adjustments
            </h3>
            <p class="text-sm text-content-muted">
              Fine-tune the brand identity, default operational settings, and system-wide appearance
              presets.
            </p>
          </div>

          <form @submit.prevent="saveGeneralSettings" class="flex flex-col gap-xl">
            <!-- 2 Column Grid -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-xl">
              <!-- Left Column: Academy Brand Profile -->
              <div
                class="flex flex-col gap-md bg-surface-subtle p-xl rounded-2xl border border-black/5"
              >
                <h4 class="text-md font-bold text-content-dark flex items-center gap-sm">
                  <span class="w-2 h-5 rounded bg-primary"></span>
                  Academy Brand Profile
                </h4>
                <div class="flex flex-col gap-sm mt-xs">
                  <AppInput
                    v-model="generalSettings.academyName"
                    label="Academy Display Name"
                    placeholder="Enter brand name..."
                    required
                  />
                  <AppInput
                    v-model="generalSettings.supportEmail"
                    type="email"
                    label="Support / Contact Email"
                    placeholder="support@academy.com"
                    required
                  />
                  <AppInput
                    v-model="generalSettings.supportPhone"
                    label="Contact Telephone Number"
                    placeholder="+855 23 888 999"
                  />
                  <AppSelect
                    v-model="generalSettings.currency"
                    label="System Currency Symbol"
                    :items="[
                      { id: '$', name: 'US Dollar ($)' },
                      { id: '៛', name: 'Cambodian Riel (៛)' },
                      { id: '€', name: 'Euro (€)' },
                      { id: '£', name: 'British Pound (£)' },
                    ]"
                  />
                </div>
              </div>

              <!-- Right Column: Operational Parameters -->
              <div
                class="flex flex-col gap-md bg-surface-subtle p-xl rounded-2xl border border-black/5"
              >
                <h4 class="text-md font-bold text-content-dark flex items-center gap-sm">
                  <span class="w-2 h-5 rounded bg-primary"></span>
                  Operational Parameters
                </h4>
                <div class="flex flex-col gap-sm mt-xs">
                  <AppSelect
                    v-model="generalSettings.defaultTrialStatus"
                    label="Default Status for New Trials"
                    :items="[
                      { id: 'pending', name: 'Pending / Unscheduled' },
                      { id: 'scheduled', name: 'Scheduled / Upcoming' },
                      { id: 'completed', name: 'Completed / Handled' },
                    ]"
                  />

                  <AppInput
                    v-model.number="generalSettings.maxWeeklySessions"
                    type="number"
                    label="Maximum Weekly Course Sessions"
                    placeholder="12"
                    required
                  />

                  <!-- Switch Toggle -->
                  <div
                    class="flex items-center justify-between p-4 rounded-xl bg-white border border-outline-std shadow-sm mt-sm"
                  >
                    <div class="flex flex-col gap-0.5">
                      <span class="text-sm font-semibold text-content-dark"
                        >Parent Self-Registration</span
                      >
                      <span class="text-xs text-content-muted"
                        >Allow parents to create accounts and enroll students online.</span
                      >
                    </div>
                    <label class="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        v-model="generalSettings.allowParentRegistration"
                        class="sr-only peer"
                      />
                      <div
                        class="w-11 h-6 bg-content-light peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-outline-std after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"
                      ></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <!-- Theme Accent Palette Picker -->
            <div
              class="flex flex-col gap-md bg-surface-subtle p-xl rounded-2xl border border-black/5"
            >
              <h4 class="text-md font-bold text-content-dark flex items-center gap-sm">
                <span class="w-2 h-5 rounded bg-primary"></span>
                System Accent Color & Theme Customization
              </h4>
              <p class="text-xs text-content-muted -mt-xs">
                Select your preferred highlight color to customize the entire administrative
                interface dynamically.
              </p>

              <div class="grid grid-cols-2 sm:grid-cols-5 gap-sm mt-xs">
                <button
                  v-for="preset in themePresets"
                  :key="preset.id"
                  type="button"
                  @click="generalSettings.themeAccent = preset.id"
                  class="p-md rounded-xl border-2 text-left transition-all duration-300 hover:scale-[1.03] flex flex-col gap-2 relative group"
                  :style="
                    generalSettings.themeAccent === preset.id
                      ? { borderColor: preset.primary, backgroundColor: preset.primary + '10' }
                      : {}
                  "
                  :class="
                    generalSettings.themeAccent === preset.id
                      ? 'shadow-md shadow-primary/10'
                      : 'border-outline-std bg-white hover:border-content-light'
                  "
                >
                  <div class="flex items-center justify-between">
                    <div
                      class="w-6 h-6 rounded-full border border-black/10 shadow-sm"
                      :style="{ backgroundColor: preset.primary }"
                    ></div>
                    <span
                      v-if="generalSettings.themeAccent === preset.id"
                      class="text-2xs font-bold text-primary animate-in zoom-in-50"
                      >Active</span
                    >
                  </div>
                  <span class="text-xs font-bold text-content-dark mt-1 leading-tight">{{
                    preset.name
                  }}</span>
                </button>
              </div>
            </div>

            <!-- Form Action Footer -->
            <div
              class="flex items-center justify-between border-t border-surface-light pt-lg mt-md"
            >
              <div>
                <transition
                  enter-active-class="transition duration-300 ease-out"
                  enter-from-class="opacity-0 translate-y-2"
                  enter-to-class="opacity-100 translate-y-0"
                  leave-active-class="transition duration-200 ease-in"
                  leave-from-class="opacity-100"
                  leave-to-class="opacity-0"
                >
                  <div
                    v-if="saveSuccess"
                    class="flex items-center gap-2 text-success font-bold text-sm"
                  >
                    <span
                      class="inline-flex w-5 h-5 items-center justify-center rounded-full bg-success-soft text-success text-xs"
                      >✓</span
                    >
                    System settings saved and applied successfully!
                  </div>
                </transition>
              </div>
              <AppButton
                type="submit"
                variant="primary"
               
              >
                <img :src="getActionIcon('save')" class="w-4 h-4 brightness-0 invert" />
                Save Preferences
              </AppButton>
            </div>
          </form>
        </div>

        <!-- ORIGINAL DATATABLE REGISTRIES (LEVELS & CATEGORIES) -->
        <DataTable
          v-else
          :title="tabs.find((t) => t.id === activeTab).label + ' Registry'"
          :headers="headersMap[activeTab]"
          :items="items"
          :loading="loading"
          :entityName="activeTab"
        >
          <template #toolbar-actions>
            <AppButton
              variant="primary"
              size="md"
             
              @click="openModal('add')"
            >
              <img :src="getActionIcon('plus')" class="w-4 h-4 brightness-0 invert" />
              <span class="font-bold tracking-tight">Add</span>
            </AppButton>
          </template>

          <template
            #row="{
              item,
              headers: _headers,
              toggleMenu,
              activeMenuId,
              isMenuAbove,
              menuStyles,
              closeMenu,
            }"
          >
            <!-- Identity Column -->
            <td class="ui-cell">
              <div class="flex flex-col">
                <span class="tracking-tighter leading-tight">{{ item.name }}</span>
                <span class="mt-1">
                  {{ activeTab === 'levels' ? 'Curriculum Grade' : 'Subject Domain' }}
                </span>
              </div>
            </td>

            <!-- Sequence / Code Column -->
            <td v-if="activeTab === 'levels'" class="ui-cell text-center">
              <span
                class="inline-flex w-8 h-8 items-center justify-center rounded-lg bg-primary/5 text-primary border border-primary/10"
              >
                {{ item.order || 0 }}
              </span>
            </td>
            <td v-else-if="activeTab === 'categories'" class="ui-cell">
              <span class="px-2 py-1 rounded-md bg-surface-subtle border border-black/5">
                {{ item.code || 'N/A' }}
              </span>
            </td>

            <td class="ui-cell text-center">
              <AppBadge :status="item.status || 'Active'" />
            </td>

            <td class="ui-cell text-center">
              <div class="ui-action-menu">
                <button
                  class="w-8 h-8 flex items-center justify-center hover:bg-surface-subtle rounded-lg transition-all text-content-muted hover:text-content-dark"
                  @click.stop="toggleMenu($event, item.id)"
                >
                  <span class="font-bold text-lg leading-none mb-1">⋮</span>
                </button>
                <Teleport to="body">
                  <transition
                    enter-active-class="transition duration-200 ease-out"
                    enter-from-class="transform scale-95 opacity-0"
                    enter-to-class="transform scale-100 opacity-100"
                    leave-active-class="transition duration-150 ease-in"
                    leave-from-class="opacity-100"
                    leave-to-class="opacity-0"
                  >
                    <div
                      v-if="activeMenuId === item.id"
                      class="ui-dropdown-menu"
                      :class="{ 'origin-bottom': isMenuAbove, 'origin-top': !isMenuAbove }"
                      :style="menuStyles"
                      @click.stop
                    >
                      <button
                        class="ui-dropdown-item ui-dropdown-item-info group"
                        @click="
                          openModal('edit', item);
                          closeMenu();
                        "
                      >
                        <img
                          :src="getActionIcon('edit')"
                          class="w-4 h-4 opacity-40 group-hover:opacity-100 transition-opacity"
                        />
                        <span class="font-semibold text-sm">Edit</span>
                      </button>

                      <div class="h-px bg-surface-light mx-1 my-1"></div>

                      <button
                        class="ui-dropdown-item ui-dropdown-item-danger group font-bold tracking-tighter"
                        @click="
                          handleDelete(item);
                          closeMenu();
                        "
                      >
                        <img
                          :src="getActionIcon('delete')"
                          class="w-4 h-4 opacity-40 group-hover:opacity-100 transition-opacity"
                        />
                        Delete
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

    <!-- Generic Modal for Lookups -->
    <AppModal
      :show="isModalOpen"
      :title="(modalType === 'add' ? 'Add ' : 'Update ') + activeTab.slice(0, -1)"
      @close="isModalOpen = false"
    >
      <form @submit.prevent="handleSubmit" class="flex flex-col gap-6">
        <AppInput
          v-model="form.name"
          label="Identity Name"
          placeholder="Enter display name..."
          required
        />

        <template v-if="activeTab === 'levels'">
          <AppInput v-model="form.order" type="number" label="Hierarchy Sequence" placeholder="0" />
        </template>

        <template v-if="activeTab === 'categories'">
          <AppInput
            v-model="form.code"
            label="Logical Reference Code"
            placeholder="e.g. ART, STEM"
          />
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
          <AppButton variant="cancel" @click="isModalOpen = false">Cancel</AppButton>
          <AppButton type="submit" variant="primary" :loading="submitting">
            {{ modalType === 'add' ? 'Add' : 'Update' }}
          </AppButton>
        </div>
      </form>
    </AppModal>
  </DashboardLayout>
</template>

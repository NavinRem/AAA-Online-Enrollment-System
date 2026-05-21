<script setup>
import { ref, computed, watch } from 'vue'
import AppModal from '@/components/common/ui/AppModal.vue'
import AppAlert from '@/components/common/ui/AppAlert.vue'
import AppButton from '@/components/common/ui/AppButton.vue'
import AppSelect from '@/components/common/ui/AppSelect.vue'
import AppInput from '@/components/common/ui/AppInput.vue'
import AppBadge from '@/components/common/ui/AppBadge.vue'
import AppConfirmOverlay from '@/components/common/ui/AppConfirmOverlay.vue'
import { getActionIcon, getImageUrl } from '@/utils/assetHelper'
import { categoryService } from '@/services/categoryService'
import { levelService } from '@/services/levelService'
import { programService } from '@/services/programService'
import { storageService } from '@/services/storageService'
import { useActionModal } from '@/composables/useActionModal'

const props = defineProps({
  isOpen: Boolean,
  type: String,
  program: Object,
  loading: Boolean,
  error: String,
  success: String,
})

const emit = defineEmits(['close', 'submit', 'update:error', 'update:success', 'lookup-deleted'])

const getInitialData = () => ({
  name: '',
  categoryId: '',
  levelId: '',
  type: 'Group',
  basePrice: 180,
  totalSessions: 11,
  duration: 60,
  minAge: 5,
  maxAge: 15,
  profileURL: '',
  deleteConfirm: '',
})

const mapSourceToForm = () => {
  if ((props.type === 'edit' || props.type === 'delete') && props.program) {
    return { ...props.program, deleteConfirm: '' }
  }
  return getInitialData()
}
const { localData, originalData, isDirty, errors, shaking, validate, clearError, triggerShake } =
  useActionModal(props, emit, {
    getInitialData,
    mapSourceToForm,
    sourceKey: 'program',
    autoClear: 3000,
  })

// Lookup Management State
const lookupType = ref(null) // 'category' | 'level'
const lookupLoading = ref(false)
const newLookupName = ref('')
const newLookupURL = ref('')

const toggleLookupManage = (type) => {
  if (lookupType.value === type) {
    lookupType.value = null
  } else {
    lookupType.value = type
    newLookupName.value = ''
    newLookupURL.value = ''
  }
}

const currentLookupItems = computed(() => {
  if (lookupType.value === 'category') return categories.value
  if (lookupType.value === 'level') return levels.value
  if (lookupType.value === 'type') return programTypes.value
  return []
})

const addLookup = async () => {
  if (!newLookupName.value.trim()) return
  lookupLoading.value = true
  try {
    if (lookupType.value === 'category') {
      await categoryService.createCategory({
        name: newLookupName.value.trim(),
        profileURL: newLookupURL.value.trim() || null,
      })
      await fetchCategories()
    } else if (lookupType.value === 'level') {
      await levelService.createLevel({ name: newLookupName.value.trim() })
      await fetchLevels()
    } else if (lookupType.value === 'type') {
      const name = newLookupName.value.trim()
      if (!programTypes.value.find((t) => t.name.toLowerCase() === name.toLowerCase())) {
        programTypes.value.push({ id: name, name })
      }
    }
    newLookupName.value = ''
    newLookupURL.value = ''
  } catch (err) {
    emit('update:error', err.message || 'Failed to add item')
  } finally {
    lookupLoading.value = false
  }
}

const deleteLookup = async (id) => {
  lookupLoading.value = true
  try {
    if (lookupType.value === 'category') {
      await categoryService.deleteCategory(id)
      if (String(localData.categoryId) === String(id)) localData.categoryId = ''
      await fetchCategories()
    } else if (lookupType.value === 'level') {
      await levelService.deleteLevel(id)
      if (String(localData.levelId) === String(id)) localData.levelId = ''
      await fetchLevels()
    }
    emit('lookup-deleted')
  } catch (err) {
    emit('update:error', err.message || 'Failed to delete item')
  } finally {
    lookupLoading.value = false
  }
}

const categories = ref([])
const levels = ref([])
const isUploading = ref(false)
const showConfirm = ref(false)

const sortedCategories = computed(() =>
  [...categories.value].sort((a, b) => (a?.name || '').localeCompare(b?.name || '')),
)

const sortedLevels = computed(() => {
  const list = [...levels.value].sort((a, b) => (a?.name || '').localeCompare(b?.name || ''))
  return list.map((l) => ({
    ...l,
    profileURL: selectedCategory.value?.profileURL || getImageUrl('common/logo-main'),
  }))
})

const modalTitle = computed(() => {
  if (props.type === 'edit') return 'Edit Program'
  if (props.type === 'delete') return 'Delete Program'
  return 'Add Program'
})

const modalIcon = computed(() => {
  if (props.type === 'delete') return getActionIcon('delete')
  return (
    selectedCategory.value?.profileURL ||
    (props.type === 'add' ? getActionIcon('plus') : getActionIcon('edit'))
  )
})

const submitLabel = computed(() => {
  if (props.type === 'edit') return 'Edit'
  if (props.type === 'delete') return 'Delete'
  return 'Add'
})

const fetchCategories = async () => {
  try {
    const rawData = await categoryService.getAllCategories()
    const rawCategories = Array.isArray(rawData) ? rawData : rawData?.data || []
    categories.value = rawCategories
      .filter((c) => c)
      .map((c) => ({
        ...c,
        id: c.id,
        profileURL: c.profileURL || '',
      }))
  } catch (err) {
    console.error('Failed to fetch categories:', err)
  }
}

const fetchLevels = async () => {
  try {
    const rawData = await levelService.getAllLevels()
    const rawLevels = Array.isArray(rawData) ? rawData : rawData?.data || []
    levels.value = rawLevels
      .filter((l) => l)
      .map((l) => ({
        ...l,
        id: l.id,
      }))
  } catch (err) {
    console.error('Failed to fetch levels:', err)
  }
}

const programTypes = ref([])

const fetchProgramTypes = async () => {
  try {
    const rawPrograms = await programService.getAllPrograms()
    const allPrograms = Array.isArray(rawPrograms) ? rawPrograms : rawPrograms?.data || []
    const uniqueTypes = [...new Set(allPrograms.map((p) => p.type).filter(Boolean))]

    // Default presets
    const presets = ['Group', 'Private']
    const combined = [...new Set([...presets, ...uniqueTypes])]

    programTypes.value = combined.map((t) => ({ id: t, name: t }))
  } catch (err) {
    console.error('Failed to fetch program types:', err)
  }
}

const programTypesWithCategoryImage = computed(() =>
  programTypes.value.map((t) => ({
    ...t,
    profileURL: selectedCategory.value?.profileURL || getImageUrl('common/logo-main'),
  })),
)

const onCategoryChange = (val) => {
  localData.categoryId = val
  clearError('categoryId')
}

const selectedCategory = computed(() =>
  categories.value.find((c) => String(c.id) === String(localData.categoryId)),
)

const getLookupImage = (item) => {
  if (lookupType.value === 'category') {
    return item.profileURL || getImageUrl('common/logo-main')
  }
  // For levels and types, we show the image of the currently selected category for context
  return selectedCategory.value?.profileURL || getImageUrl('common/logo-main')
}

const onLevelChange = (val) => {
  localData.levelId = val
  clearError('levelId')
}

const handleCategoryFileUpload = async (event) => {
  const file = event.target.files[0]
  if (!file) return
  isUploading.value = true
  try {
    const timestamp = Date.now()
    const path = `categories/${newLookupName.value || 'temp'}_${timestamp}`
    const url = await storageService.uploadFile(file, path)
    newLookupURL.value = url
  } catch (err) {
    emit('update:error', 'Upload failed. Try again.')
  } finally {
    isUploading.value = false
  }
}

const requestConfirm = () => {
  if (props.type === 'edit' && !isDirty.value) return

  const rules = {
    required: props.type === 'delete' ? [] : ['name', 'categoryId', 'levelId'],
    custom: {},
  }

  if (props.type === 'delete') {
    rules.custom.deleteConfirm = (val) => val === 'DELETE' || 'Type DELETE to confirm.'
  }

  // Perform validation
  const isValid = validate(rules)

  if (!isValid) {
    if (props.type !== 'delete') {
      emit('update:error', 'Please fill in all required fields accurately.')
      triggerShake('name') // Generic shake to grab attention
    }
    return
  }

  showConfirm.value = true
}

const handleActionSubmit = () => {
  showConfirm.value = false

  const selectedCategory = categories.value.find(
    (c) => String(c.id) === String(localData.categoryId),
  )
  const selectedLevel = levels.value.find((l) => String(l.id) === String(localData.levelId))

  const payload = {
    ...localData,
    category: selectedCategory?.name || '',
    categorySnapshot: selectedCategory || null,
    level: selectedLevel?.name || '',
  }

  emit('submit', payload)
}

const confirmOverlaySubtitle = computed(() => {
  if (props.type === 'delete')
    return 'This action will permanently erase this program and its historical data.'
  return 'Please verify the program details and parameters before proceeding.'
})

const confirmRows = computed(() => {
  const rows = [
    { key: 'Program', value: localData.name, valueClass: 'font-bold text-content-dark' },
    {
      key: 'Category',
      value: categories.value.find((c) => String(c.id) === String(localData.categoryId))?.name,
      badge: true,
      type: 'blue',
    },
    {
      key: 'Level',
      value: levels.value.find((l) => String(l.id) === String(localData.levelId))?.name,
      badge: true,
      type: 'magenta',
    },
    { key: 'Type', value: localData.type, badge: true, type: 'tag' },
    {
      key: 'Base Price',
      value: `$${localData.basePrice}`,
      valueClass: 'font-bold text-primary text-base',
      badge: true,
      type: 'blue',
    },
    { key: 'Total Sessions', value: localData.totalSessions, valueClass: 'font-bold tabular-nums' },
    { key: 'Duration', value: `${localData.duration} mins`, valueClass: 'font-bold tabular-nums' },
    {
      key: 'Age Range',
      value: `${localData.minAge} - ${localData.maxAge} years`,
      valueClass: 'font-bold text-content-dark',
    },
  ]
  if (props.type === 'delete') {
    rows.push({
      key: 'Security Check',
      value: localData.deleteConfirm,
      valueClass: 'text-error font-bold',
    })
  }
  return rows
})

watch(
  () => props.isOpen,
  async (isOpen) => {
    if (isOpen) {
      await Promise.all([fetchCategories(), fetchLevels(), fetchProgramTypes()])
    }
  },
  { immediate: true },
)
</script>

<template>
  <AppModal
    :show="isOpen"
    :title="modalTitle"
    :icon="modalIcon"
    :error="error"
    :success="success"
    maxWidth="650px"
    @close="$emit('close')"
  >
    <!-- Body Content -->
    <div>
      <form
        v-if="type === 'add' || type === 'edit'"
        id="programActionForm"
        class="grid grid-cols-2 gap-x-6 gap-y-5"
        @submit.prevent="requestConfirm"
        novalidate
      >
        <AppInput
          v-model="localData.name"
          label="Name"
          placeholder="e.g. Master Class: Piano"
          class="col-span-2"
          required
          :error="errors.name"
          :shake="shaking.name"
          @input="clearError('name')"
        >
          <template #label-extra v-if="type === 'edit' && originalData.name">
            <span class="text-3xs font-semibold text-primary ml-sm lowercase italic opacity-60">
              Record: {{ originalData.name }}
            </span>
          </template>
        </AppInput>

        <div class="col-span-1">
          <div class="flex justify-between items-center mb-1">
            <label class="text-sm font-semibold text-content-dark flex items-center gap-1">
              Category <span class="text-error font-bold leading-none">*</span>
            </label>
            <button
              type="button"
              @click="toggleLookupManage('category')"
              class="text-sm font-semibold text-primary hover:underline"
            >
              Manage
            </button>
          </div>
          <AppSelect
            v-model="localData.categoryId"
            :items="sortedCategories"
            placeholder="Select Catalog..."
            required
            :error="errors.categoryId"
            :shake="shaking.categoryId"
            @change="onCategoryChange"
          />
        </div>

        <div class="col-span-1">
          <div class="flex justify-between items-center mb-1">
            <label class="text-sm font-semibold text-content-dark flex items-center gap-1">
              Level <span class="text-error font-bold leading-none">*</span>
            </label>
            <button
              type="button"
              @click="toggleLookupManage('level')"
              class="text-sm font-semibold text-primary hover:underline"
            >
              Manage
            </button>
          </div>
          <AppSelect
            v-model="localData.levelId"
            :items="sortedLevels"
            placeholder="Select Level..."
            required
            :error="errors.levelId"
            :shake="shaking.levelId"
            @change="onLevelChange"
          >
            <template #selected="{ item }">
              <div v-if="item" class="flex items-center gap-2 flex-1 overflow-hidden">
                <div
                  class="w-7 h-7 rounded-lg border border-outline-std overflow-hidden bg-white shrink-0"
                >
                  <img :src="item.profileURL" class="w-full h-full object-cover" />
                </div>
                <span class="text-sm font-semibold text-content-dark truncate flex-1">{{
                  item.name
                }}</span>
              </div>
            </template>
            <template #item="{ item }">
              <div class="flex items-center gap-3 w-full">
                <div
                  class="w-8 h-8 rounded-lg border border-outline-std overflow-hidden bg-white shrink-0 shadow-sm"
                >
                  <img :src="item.profileURL" class="w-full h-full object-cover" />
                </div>
                <span class="text-sm font-semibold text-content-dark flex-1">{{ item.name }}</span>
              </div>
            </template>
          </AppSelect>
        </div>

        <!-- Inline Lookup Manager -->
        <div
          v-if="lookupType"
          class="col-span-2 p-md bg-primary-soft/30 rounded-std border-2 border-dashed border-primary/20 flex flex-col gap-sm animate-in fade-in slide-in-from-top-2 duration-300"
        >
          <div class="flex justify-between items-center">
            <span class="text-sm font-semibold text-primary flex items-center gap-xs">
              <span class="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
              Manage {{ lookupType }}s
            </span>
            <button
              type="button"
              @click="lookupType = null"
              class="text-3xs font-semibold text-content-muted hover:text-error"
            >
              Close
            </button>
          </div>
          <div class="flex flex-col gap-sm">
            <div class="flex gap-sm">
              <input
                v-model="newLookupName"
                :placeholder="'Enter new ' + lookupType + ' name...'"
                class="flex-1 px-md py-2 text-sm bg-white border border-outline-std rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                @keyup.enter="addLookup"
              />
              <AppButton size="sm" type="button" @click="addLookup" :loading="lookupLoading"
                >Add</AppButton
              >
            </div>

            <!-- Lookup Identity Helper (Category Only) -->
            <div
              v-if="lookupType === 'category'"
              class="flex items-center gap-sm p-2 bg-white/40 rounded-xl border border-outline-std/50 shadow-inner"
            >
              <div v-if="lookupType === 'category'" class="relative flex-1">
                <input
                  v-model="newLookupURL"
                  placeholder="Category Asset URL (optional)..."
                  class="w-full pl-9 pr-md py-2 text-3xs bg-white/80 border border-outline-std rounded-lg focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
                <span class="absolute left-3 top-1/2 -translate-y-1/2 opacity-40 text-xs">🔗</span>
              </div>

              <div class="shrink-0 flex items-center gap-sm">
                <template v-if="lookupType === 'category'">
                  <input
                    type="file"
                    @change="handleCategoryFileUpload"
                    accept="image/*"
                    id="lookup-file-upload"
                    class="hidden"
                  />
                  <label
                    for="lookup-file-upload"
                    class="w-8 h-8 rounded-lg border border-outline-std flex items-center justify-center bg-white hover:bg-primary-soft hover:border-primary cursor-pointer transition-all shadow-xs"
                  >
                    <span class="text-xs">{{ isUploading ? '⏳' : '🖼️' }}</span>
                  </label>
                </template>
                <div
                  class="w-8 h-8 rounded-lg overflow-hidden border border-white shadow-xs bg-white"
                >
                  <img
                    :src="
                      lookupType === 'category'
                        ? newLookupURL || getImageUrl('common/logo-main')
                        : selectedCategory?.profileURL || getImageUrl('common/logo-main')
                    "
                    class="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
          <div class="flex flex-wrap gap-xs max-h-[100px] overflow-y-auto py-sm scrollable-v">
            <div
              v-for="item in currentLookupItems"
              :key="item.id"
              class="px-3 py-1.5 bg-primary-light border border-primary/10 rounded-xl flex items-center gap-sm group hover:border-primary/30 transition-all shadow-sm cursor-default"
            >
              <div
                class="w-5 h-5 rounded-lg overflow-hidden border border-white shadow-xs bg-white shrink-0"
              >
                <img :src="getLookupImage(item)" class="w-full h-full object-cover opacity-80" />
              </div>
              <span class="text-3xs font-semibold tracking-tight">{{ item.name }}</span>
              <button
                type="button"
                @click="deleteLookup(item.id)"
                class="w-4 h-4 rounded-full flex items-center justify-center hover:bg-error/10 hover:text-error transition-all ml-xs"
              >
                ×
              </button>
            </div>
            <div v-if="!currentLookupItems.length" class="text-3xs text-content-muted italic py-2">
              No items found in this catalog.
            </div>
          </div>
        </div>

        <div class="col-span-1">
          <div class="flex justify-between items-center mb-1">
            <label class="text-sm font-semibold text-content-dark flex items-center gap-1">
              Type <span class="text-error font-bold leading-none">*</span>
            </label>
          </div>
          <AppSelect
            v-model="localData.type"
            :items="programTypesWithCategoryImage"
            placeholder="Select Type..."
            required
            class="col-span-1"
            :searchable="false"
          >
            <template #selected="{ item }">
              <div v-if="item" class="flex items-center gap-2 flex-1 overflow-hidden">
                <div
                  class="w-7 h-7 rounded-lg border border-outline-std overflow-hidden bg-white shrink-0"
                >
                  <img :src="item.profileURL" class="w-full h-full object-cover" />
                </div>
                <span class="text-sm font-semibold text-content-dark truncate flex-1">{{
                  item.name
                }}</span>
              </div>
            </template>
            <template #item="{ item }">
              <div class="flex items-center gap-3 w-full">
                <div
                  class="w-8 h-8 rounded-lg border border-outline-std overflow-hidden bg-white shrink-0 shadow-sm"
                >
                  <img :src="item.profileURL" class="w-full h-full object-cover" />
                </div>
                <span class="text-sm font-semibold text-content-dark flex-1">{{ item.name }}</span>
              </div>
            </template>
          </AppSelect>
        </div>

        <AppInput
          v-model="localData.basePrice"
          type="number"
          label="Base Price ($)"
          placeholder="0.00"
          step="0.01"
          required
          :error="errors.basePrice"
          :shake="shaking.basePrice"
          @input="clearError('basePrice')"
        />

        <AppInput
          v-model="localData.totalSessions"
          type="number"
          label="Total Sessions"
          placeholder="24"
          required
          :error="errors.totalSessions"
          :shake="shaking.totalSessions"
          @input="clearError('totalSessions')"
        />

        <AppInput
          v-model="localData.duration"
          type="number"
          label="Duration (Minutes)"
          placeholder="60"
          required
          :error="errors.duration"
          :shake="shaking.duration"
          @input="clearError('duration')"
        />

        <AppInput
          v-model="localData.minAge"
          type="number"
          label="Minimum Age"
          placeholder="5"
          required
        />
        <AppInput
          v-model="localData.maxAge"
          type="number"
          label="Maximum Age"
          placeholder="12"
          required
        />

        <!-- Program image section removed per user request (moved to category) -->

        <AppInput
          v-model="localData.description"
          type="textarea"
          label="Description"
          placeholder="A brief overview for administrative reference..."
          class="col-span-2"
          :error="errors.description"
          :shake="shaking.description"
          @input="clearError('description')"
        />
      </form>

      <!-- Content for Delete Action -->
      <div v-if="type === 'delete'" class="flex flex-col gap-lg">
        <!-- Identity Summary -->
        <div
          class="bg-white border border-outline-std rounded-std p-lg flex flex-col gap-lg shadow-sm"
          v-if="props.program"
        >
          <div class="grid grid-cols-2 gap-x-lg gap-y-md">
            <div class="flex flex-col gap-xs">
              <span class="text-2xs font-bold text-content-muted tracking-wider opacity-60"
                >Program Name</span
              >
              <div class="flex items-center gap-sm">
                <span class="text-sm font-semibold text-content-dark tracking-tight">{{
                  props.program.name
                }}</span>
              </div>
            </div>
            <div class="flex flex-col gap-xs">
              <span class="text-2xs font-bold text-content-muted tracking-wider opacity-60"
                >Category</span
              >
              <div class="flex items-center gap-sm">
                <AppBadge
                  :status="
                    categories.find((c) => String(c.id) === String(props.program.categoryId))?.name
                  "
                  type="blue"
                />
              </div>
            </div>
            <div class="flex flex-col gap-xs">
              <span class="text-2xs font-bold text-content-muted tracking-wider opacity-60"
                >Level</span
              >
              <div class="flex items-center gap-sm">
                <AppBadge
                  :status="levels.find((l) => String(l.id) === String(props.program.levelId))?.name"
                  class="bg-surface-subtle text-content-dark border-outline-std"
                />
              </div>
            </div>
            <div class="flex flex-col gap-xs">
              <span class="text-2xs font-bold text-content-muted tracking-wider opacity-60"
                >Price</span
              >
              <span class="text-sm font-semibold text-primary tracking-tighter"
                >${{ props.program.basePrice }}</span
              >
            </div>
          </div>
        </div>

        <AppAlert type="error">
          <div class="flex flex-col gap-0.5">
            <strong class="text-sm font-semibold tracking-tight">⚠ Permanent Data Deletion</strong>
            <span class="text-xs opacity-90 font-medium"
              >This will erase all linked class records and enrollment history for this program.
              This action is irreversible.</span
            >
          </div>
        </AppAlert>

        <AppInput
          v-model="localData.deleteConfirm"
          label="Security Confirmation"
          placeholder='Type "DELETE" to confirm'
          required
          :error="errors.deleteConfirm"
          :shake="shaking.deleteConfirm"
          @input="clearError('deleteConfirm')"
        >
          <template #label-extra>
            <span class="block text-3xs font-bold text-content-muted/40 mt-1">
              Type <span class="text-error px-1 font-bold">DELETE</span> to authorize this permanent
              action
            </span>
          </template>
        </AppInput>
      </div>

      <!-- ── Confirmation Overlay ── -->
      <AppConfirmOverlay
        :show="showConfirm"
        :title="modalTitle"
        :subtitle="confirmOverlaySubtitle"
        :icon="modalIcon"
        :rows="confirmRows"
        :confirmLabel="submitLabel"
        :loading="loading"
        @back="showConfirm = false"
        @confirm="handleActionSubmit"
      />
    </div>

    <template #footer>
      <div class="flex flex-col justify-end w-full gap-md">
        <AppAlert v-if="type === 'edit' && !isDirty" type="info" class="w-full">
          No modifications detected. Please update at least one field to enable saving.
        </AppAlert>

        <div class="flex items-center justify-end w-full gap-md">
          <AppButton variant="cancel" @click="$emit('close')">Cancel</AppButton>
          <AppButton
            :variant="type === 'delete' ? 'danger' : 'primary'"
            type="button"
            @click="requestConfirm"
            :loading="loading"
            :disabled="loading || (type === 'edit' && !isDirty)"
            :class="{ 'opacity-50 pointer-events-none': type === 'edit' && !isDirty }"
          >
            {{ submitLabel }}
          </AppButton>
        </div>
      </div>
    </template>
  </AppModal>
</template>

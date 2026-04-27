<script setup>
import { ref, computed, watch } from 'vue'
import AppModal from '@/components/common/ui/AppModal.vue'
import AppAlert from '@/components/common/ui/AppAlert.vue'
import AppButton from '@/components/common/ui/AppButton.vue'
import AppSelect from '@/components/common/ui/AppSelect.vue'
import AppInput from '@/components/common/ui/AppInput.vue'
import { getActionIcon } from '@/utils/assetHelper'
import { programService } from '@/services/programService'
import { categoryService } from '@/services/categoryService'
import { levelService } from '@/services/levelService'
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

const emit = defineEmits(['close', 'submit', 'update:error', 'update:success'])

const getInitialData = () => ({
  name: '',
  categoryId: '',
  levelId: '',
  type: 'group',
  basePrice: 0.0,
  totalClasses: 1,
  weeksNumber: 1,
  maxCapacity: 10,
  description: '',
  profileURL: '',
  deleteConfirm: '',
})

const mapSourceToForm = () => {
  if (props.type === 'edit' && props.program) {
    return { ...props.program, deleteConfirm: '' }
  }
  return getInitialData()
}

const { localData, originalData, isDirty, errors, shaking, clearError, triggerShake, submitForm } =
  useActionModal(props, emit, {
    getInitialData,
    mapSourceToForm,
  })

const categories = ref([])
const levels = ref([])
const schedules = ref([])
const newSchedule = ref({ day: 'Monday', timeslot: '' })
const isUploading = ref(false)

const sortedCategories = computed(() =>
  [...categories.value].sort((a, b) => a.name.localeCompare(b.name)),
)
const sortedLevels = computed(() => [...levels.value].sort((a, b) => a.name.localeCompare(b.name)))

const modalTitle = computed(() => {
  if (props.type === 'edit') return 'Engineer Program Model'
  if (props.type === 'delete') return 'Deconstruct Program Entry'
  return 'Initialize Program Entry'
})

const modalIcon = computed(() => {
  if (props.type === 'delete') return getActionIcon('delete')
  return getActionIcon('edit')
})

const submitLabel = computed(() => {
  if (props.type === 'edit') return 'Commit Profile'
  if (props.type === 'delete') return 'Execute Deconstruction'
  return 'Initialize Entry'
})

const fetchCategories = async () => {
  try {
    const rawCategories = await categoryService.getAllCategories()
    categories.value = rawCategories.map((c) => ({
      ...c,
      profileURL: c.profileURL || '',
    }))
  } catch (err) {
    console.error(err)
  }
}

const fetchLevels = async () => {
  if (!localData.categoryId) return
  try {
    levels.value = await levelService.getAllLevels({ categoryId: localData.categoryId })
  } catch (err) {
    console.error(err)
  }
}

const fetchSchedules = async () => {
  if (props.type !== 'edit' || !props.program?.id) return
  try {
    schedules.value = await programService.getProgramSchedules(props.program.id)
  } catch (err) {
    console.error(err)
  }
}

const onCategoryChange = (val) => {
  localData.categoryId = val
  localData.levelId = ''
  clearError('categoryId')
  fetchLevels()
}

const handleFileUpload = async (event) => {
  const file = event.target.files[0]
  if (!file) return
  isUploading.value = true
  try {
    const timestamp = Date.now()
    const path = `programs/${localData.name}_${timestamp}`
    const url = await storageService.uploadFile(file, path)
    localData.profileURL = url
  } catch (err) {
    emit('update:error', 'Upload failed. Try again.')
  } finally {
    isUploading.value = false
  }
}

const handleAddSchedule = async () => {
  if (!newSchedule.value.day || !newSchedule.value.timeslot) return
  try {
    const id = await programService.addProgramSchedule(props.program.id, newSchedule.value)
    schedules.value.unshift({ id, ...newSchedule.value })
    newSchedule.value.timeslot = ''
  } catch (err) {
    console.error(err)
  }
}

const handleRemoveSchedule = async (scheduleId) => {
  try {
    await programService.deleteProgramSchedule(props.program.id, scheduleId)
    schedules.value = schedules.value.filter((s) => s.id !== scheduleId)
  } catch (err) {
    console.error(err)
  }
}

const handleDisabledClick = (field) => {
  if (field === 'levelId' && !localData.categoryId) {
    errors.categoryId = 'PLEASE SELECT A CATEGORY FIRST'
    triggerShake('categoryId')
  }
}

const handleActionSubmit = () => {
  if (props.type === 'edit' && !isDirty.value) return

  const rules = {
    required: props.type === 'delete' ? [] : ['name', 'categoryId'],
    custom: {},
  }

  if (props.type === 'delete') {
    rules.custom.deleteConfirm = (val) => val === 'DELETE' || 'Invalid confirmation string'
  } else {
    rules.custom.basePrice = (val) => val >= 0 || 'Negative price'
    rules.custom.totalClasses = (val) => val >= 1 || 'Min 1 unit'
    rules.custom.weeksNumber = (val) => val >= 1 || 'Min 1 duration'
    rules.custom.maxCapacity = (val) => val >= 1 || 'Capacity error'
  }

  submitForm(rules)
}

watch(
  () => props.isOpen,
  async (isOpen) => {
    if (isOpen) {
      await fetchCategories()
      if (localData.categoryId) fetchLevels()
      if (props.type === 'edit') fetchSchedules()
    }
  },
)
</script>

<template>
  <AppModal :show="isOpen" :title="modalTitle" :icon="modalIcon" maxWidth="650px" @close="$emit('close')">
    <!-- Body Content -->
    <div class="px-xl py-6">
      <!-- Feedback Alerts -->
      <div v-if="error || success" class="mb-4">
        <AppAlert v-if="error" type="error" :title="error" @close="$emit('update:error', '')" />
        <AppAlert v-if="success" type="success" :title="success" @close="$emit('update:success', '')" />
      </div>

      <form v-if="type === 'add' || type === 'edit'" id="programActionForm" class="grid grid-cols-2 gap-x-6 gap-y-5"
        @submit.prevent="handleActionSubmit" novalidate>
        
        <AppInput v-model="localData.name" label="Program Identity / Model" placeholder="e.g. Master Class: Piano"
          class="col-span-2" required :error="errors.name" :shake="shaking.name" @input="clearError('name')">
          <template #label-extra v-if="type === 'edit' && originalData.name">
            <span class="text-3xs font-bold text-primary ml-sm lowercase italic opacity-60">
              Record: {{ originalData.name }}
            </span>
          </template>
        </AppInput>

        <AppSelect v-model="localData.categoryId" :items="sortedCategories" label="Category" placeholder="Catalog..."
          required :error="errors.categoryId" :shake="shaking.categoryId" @change="onCategoryChange" />

        <AppSelect v-model="localData.levelId" :items="sortedLevels" label="Skill Level" placeholder="Difficulty..."
          :disabled="!localData.categoryId" @click-disabled="handleDisabledClick('levelId')" />

        <AppSelect v-model="localData.type" label="Course Type" :items="[
          { id: 'group', name: 'Group / Ensemble' },
          { id: 'private', name: 'Private Session' },
        ]" :searchable="false" required />

        <AppInput v-model="localData.basePrice" type="number" label="Catalog Price ($)" placeholder="0.00" step="0.01"
          required :error="errors.basePrice" :shake="shaking.basePrice" @input="clearError('basePrice')" />

        <AppInput v-model="localData.totalClasses" type="number" label="Total Classes" placeholder="1" required
          :error="errors.totalClasses" :shake="shaking.totalClasses" @input="clearError('totalClasses')" />

        <AppInput v-model="localData.weeksNumber" type="number" label="Term Duration" placeholder="1" required
          :error="errors.weeksNumber" :shake="shaking.weeksNumber" @input="clearError('weeksNumber')">
          <template #right-icon>
            <span class="text-2xs font-black uppercase text-content-muted/40 mr-md">Weeks</span>
          </template>
        </AppInput>

        <AppInput v-model="localData.maxCapacity" type="number" label="Registry Limit" placeholder="10"
          required :error="errors.maxCapacity" :shake="shaking.maxCapacity"
          @input="clearError('maxCapacity')" />

        <div class="flex flex-col gap-xs mt-0">
          <label class="text-xs font-black uppercase text-content-muted tracking-widest">Program Creative</label>
          <div class="relative">
            <div v-if="localData.profileURL"
              class="flex items-center gap-md bg-surface-light p-1.5 rounded-xl border border-outline-std/30">
              <div class="w-10 h-10 rounded-xl border-2 border-white shadow-sm overflow-hidden bg-white">
                <img :src="localData.profileURL" alt="Preview" class="w-full h-full object-cover" />
              </div>
              <button type="button"
                class="text-2xs text-error font-black uppercase tracking-widest cursor-pointer bg-white border border-error/20 px-3 py-1 rounded-xl transition-all hover:bg-error hover:text-white"
                @click="localData.profileURL = ''">
                Remove
              </button>
            </div>
            <div v-else>
              <input type="file" @change="handleFileUpload" accept="image/*" id="program-file-upload" class="hidden" />
              <label for="program-file-upload"
                class="group flex items-center gap-md p-2 border-2 border-dashed border-outline-std rounded-xl cursor-pointer transition-all hover:bg-primary-soft hover:border-primary">
                <span class="text-xl">🖼️</span>
                <span class="text-xs font-black text-content-dark uppercase tracking-widest">{{
                    isUploading ? 'Uploading...' : 'Asset'
                  }}</span>
              </label>
            </div>
          </div>
        </div>

        <div class="flex flex-col gap-xs col-span-2 mt-0">
          <label class="text-xs font-black uppercase text-content-muted tracking-widest">Description / Synopsis</label>
          <textarea v-model="localData.description"
            placeholder="A brief overview for administrative reference..." rows="2" class="ui-remark-textarea !text-xs !py-2"
            :class="{
              'border-error bg-error-soft ring-error/10': errors.description,
              'animate-shake': shaking.description,
            }"></textarea>
        </div>

        <!-- Schedule Templates -->
        <template v-if="type === 'edit'">
          <div class="col-span-2 bg-surface-subtle border border-outline-std rounded-xl p-3 flex flex-col gap-3 shadow-inner">
            <div class="flex flex-wrap gap-2">
              <div v-for="s in schedules" :key="s.id"
                class="group flex items-center gap-2 bg-white p-1 px-3 rounded-lg border border-outline-std/50 shadow-sm transition-all hover:border-primary/30">
                <span class="text-[10px] font-black text-primary uppercase tracking-tighter">{{ s.day }}</span>
                <span class="text-xs text-content-dark font-black tracking-tight">{{ s.timeslot }}</span>
                <button type="button"
                  class="w-4 h-4 flex items-center justify-center rounded-full bg-surface-light text-content-muted hover:bg-error hover:text-white transition-colors cursor-pointer"
                  @click="handleRemoveSchedule(s.id)">
                  &times;
                </button>
              </div>
              <div v-if="schedules.length === 0" class="text-xs text-content-muted/40 font-bold italic py-1">
                No master schedule nodes initialized.
              </div>
            </div>

            <div class="flex gap-2 items-center pt-2 border-t border-outline-std/20">
              <AppSelect v-model="newSchedule.day" :items="['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((d) => ({ id: d, name: d }))" :searchable="false" class="w-32" />
              <AppSelect v-model="newSchedule.timeslot" :items="['08:30 - 10:00', '10:30 - 12:00', '13:30 - 15:00', '15:30 - 17:00'].map((s) => ({ id: s, name: s }))" :searchable="false" class="flex-1" />
              <AppButton variant="primary" @click="handleAddSchedule" :disabled="!newSchedule.timeslot" size="sm" class="px-4 rounded-lg">Register</AppButton>
            </div>
          </div>
        </template>
      </form>

      <div v-if="type === 'delete'" class="flex flex-col gap-xl">
        <div class="flex items-center gap-xl p-xl bg-error/5 border-2 border-dashed border-error/20 rounded-2xl">
          <div class="text-4xl">☢️</div>
          <div class="flex flex-col">
            <strong class="text-lg font-black text-error uppercase leading-none mb-2">Catalog Deconstruction</strong>
            <p class="text-xs text-content-muted font-bold leading-relaxed">
              This action will purge the program from catalogs. Active classes will persist but model synchronization will be severed.
            </p>
          </div>
        </div>
        <AppInput v-model="localData.deleteConfirm" label="Security Confirmation" placeholder="CONFIRM CATALOG DELETE"
          required :error="errors.deleteConfirm" :shake="shaking.deleteConfirm" class="text-center"
          @input="clearError('deleteConfirm')">
          <template #label-extra>
            <span class="block text-3xs font-black uppercase text-content-muted/40 text-center mt-2">
              Type <span class="text-error px-1">DELETE</span> to authorize purge
            </span>
          </template>
        </AppInput>
      </div>
    </div>

    <template #footer>
      <div class="flex items-center justify-end w-full gap-md px-xl py-4 bg-surface-subtle/30 border-t border-outline-std">
        <AppButton variant="cancel" size="lg" class="px-8" @click="$emit('close')">Abort Action</AppButton>
        <AppButton :variant="type === 'delete' ? 'danger' : 'primary'" size="lg" class="px-8"
          :form="type === 'add' || type === 'edit' ? 'programActionForm' : null" type="submit"
          @click="type === 'delete' ? handleActionSubmit() : null" :loading="loading" :disabled="loading"
          :class="{ 'opacity-50 pointer-events-none': type === 'edit' && !isDirty }">
          {{ submitLabel }}
        </AppButton>
      </div>
    </template>
  </AppModal>
</template>

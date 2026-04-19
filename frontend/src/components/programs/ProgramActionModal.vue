<template>
  <AppModal :show="isOpen" :title="modalTitle" :icon="modalIcon" maxWidth="600px" @close="$emit('close')">
    <form v-if="type === 'add' || type === 'edit'" id="programActionForm" class="ui-form-grid"
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

      <div class="col-span-2 flex items-center gap-md py-2 opacity-50">
        <div class="h-px bg-border flex-1"></div>
        <span class="text-3xs font-black uppercase tracking-widest text-content-muted select-none">Economic & Operational
          Logic</span>
        <div class="h-px bg-border flex-1"></div>
      </div>

      <AppSelect v-model="localData.type" label="Course Type" :items="[
        { id: 'group', name: 'Group / Ensemble' },
        { id: 'private', name: 'Private Session' },
      ]" :searchable="false" required />

      <AppInput v-model="localData.basePrice" type="number" label="Catalog Price ($)" placeholder="0.00" step="0.01"
        required :error="errors.basePrice" :shake="shaking.basePrice" @input="clearError('basePrice')" />

      <AppInput v-model="localData.totalSessions" type="number" label="Total Units" placeholder="1" required
        :error="errors.totalSessions" :shake="shaking.totalSessions" @input="clearError('totalSessions')" />

      <AppInput v-model="localData.weeksNumber" type="number" label="Term Duration" placeholder="1" required
        :error="errors.weeksNumber" :shake="shaking.weeksNumber" @input="clearError('weeksNumber')">
        <template #right-icon>
          <span class="text-2xs font-black uppercase text-content-muted/40 mr-md">Weeks</span>
        </template>
      </AppInput>

      <AppInput v-model="localData.maxCapacity" type="number" label="Registry Limit (Defaults)" placeholder="10"
        class="col-span-2" required :error="errors.maxCapacity" :shake="shaking.maxCapacity"
        @input="clearError('maxCapacity')" />

      <div class="flex flex-col gap-xs col-span-2 mt-sm">
        <label class="text-xs font-black uppercase text-content-muted tracking-widest">Description / Synopsis</label>
        <textarea v-model="localData.description"
          placeholder="A brief overview for administrative and parent reference..." rows="2"
          class="ui-remark-textarea"
          :class="{
            'border-error bg-error-soft ring-error/10': errors.description,
            'animate-shake': shaking.description,
          }"></textarea>
        <div v-if="errors.description" class="text-error text-3xs font-black px-1 mt-0.5 uppercase tracking-widest">
          {{ errors.description }}
        </div>
      </div>

      <div class="flex flex-col gap-xs col-span-2">
        <label class="text-xs font-black uppercase text-content-muted tracking-widest">Program Creative</label>
        <div class="relative">
          <div v-if="localData.profileURL"
            class="flex items-center gap-md bg-surface-light p-2 rounded-sm border border-outline-std/30">
            <div class="w-12 h-12 rounded-sm border-2 border-white shadow-sm overflow-hidden bg-white">
              <img :src="localData.profileURL" alt="Preview" class="w-full h-full object-cover" />
            </div>
            <button type="button"
              class="text-2xs text-error font-black uppercase tracking-widest cursor-pointer bg-white border border-error/20 px-3 py-1.5 rounded-sm transition-all hover:bg-error hover:text-white"
              @click="localData.profileURL = ''">
              Remove File
            </button>
          </div>
          <div v-else>
            <input type="file" @change="handleFileUpload" accept="image/*" id="program-file-upload" class="hidden" />
            <label for="program-file-upload"
              class="group flex items-center gap-md p-md border-2 border-dashed border-outline-std rounded-sm cursor-pointer transition-all hover:bg-primary-soft hover:border-primary">
              <span class="text-2xl transition-transform group-hover:scale-110">🖼️</span>
              <div class="flex flex-col">
                <span class="text-xs font-black text-content-dark uppercase tracking-widest">{{
                  isUploading ? 'Uploading Image...' : 'Select Program Asset'
                  }}</span>
                <span class="text-3xs font-bold text-content-muted italic">Recommended aspect ratio 16:9</span>
              </div>
            </label>
          </div>
        </div>
      </div>

      <!-- Schedule Templates -->
      <template v-if="type === 'edit'">
        <div class="col-span-2 flex items-center gap-md py-2 opacity-50 mt-sm">
          <div class="h-px bg-border flex-1"></div>
          <span class="text-3xs font-black uppercase tracking-widest text-content-muted">Master Schedule Nodes</span>
          <div class="h-px bg-border flex-1"></div>
        </div>

        <div
          class="col-span-2 bg-surface-subtle border-2 border-outline-std rounded-sm p-md flex flex-col gap-md shadow-inner">
          <div class="flex flex-wrap gap-sm">
            <div v-for="s in schedules" :key="s.id"
              class="group flex items-center gap-sm bg-white p-1 px-3 rounded-sm border-2 border-outline-std/50 shadow-sm transition-all hover:border-primary/30">
              <span class="text-2xs font-black text-primary uppercase tracking-tighter">{{
                s.day
                }}</span>
              <span class="text-xs text-content-dark font-black tracking-tight">{{
                s.timeslot
                }}</span>
              <button type="button"
                class="w-5 h-5 flex items-center justify-center rounded-full bg-surface-light text-content-muted hover:bg-error hover:text-white transition-colors cursor-pointer"
                @click="handleRemoveSchedule(s.id)">
                &times;
              </button>
            </div>
            <div v-if="schedules.length === 0" class="text-xs text-content-muted/40 font-bold italic py-2">
              No master schedule nodes initialized for this model.
            </div>
          </div>

          <div class="flex gap-sm items-center pt-md border-t border-outline-std/20">
            <AppSelect v-model="newSchedule.day" :items="['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(
              (d) => ({ id: d, name: d }),
            )
              " :searchable="false" class="w-36" />
            <AppSelect v-model="newSchedule.timeslot" :items="['08:30 - 10:00', '10:30 - 12:00', '13:30 - 15:00', '15:30 - 17:00'].map((s) => ({
              id: s,
              name: s,
            }))
              " :searchable="false" class="flex-1" />
            <AppButton variant="primary" @click="handleAddSchedule" :disabled="!newSchedule.timeslot" size="md"
              class="px-6">Register Slot</AppButton>
          </div>
        </div>
      </template>
    </form>

    <div v-if="type === 'delete'" class="flex flex-col gap-xl mt-lg">
      <div class="flex items-center gap-xl p-xl bg-error-deep/5 border-2 border-dashed border-error/30 rounded-std">
        <div class="text-4xl filter grayscale brightness-125">☢️</div>
        <div class="flex flex-col gap-1">
          <strong class="text-lg font-black text-error-deep tracking-tight uppercase leading-none">Catalog Model
            Deletion</strong>
          <p class="text-xs text-error-deep/70 font-semibold leading-relaxed">
            This will remove the program from selection catalogs. Active classes will remain but may
            lose model synchronization.
          </p>
        </div>
      </div>
      <AppInput v-model="localData.deleteConfirm" label="Master Purge Confirmation" placeholder="CONFIRM CATALOG DELETE"
        required :error="errors.deleteConfirm" :shake="shaking.deleteConfirm" class="text-center"
        @input="clearError('deleteConfirm')">
        <template #label-extra>
          <span class="block text-2xs font-black uppercase text-content-muted/40 text-center mt-1">
            Type <span class="text-error px-1">DELETE</span> to confirm purge
          </span>
        </template>
      </AppInput>
    </div>

    <template #footer>
      <div class="flex items-center justify-end w-full gap-md">
        <AppButton variant="cancel" @click="$emit('close')">Cancel Entry</AppButton>
        <AppButton :variant="type === 'delete' ? 'danger' : 'primary'"
          :form="type === 'add' || type === 'edit' ? 'programActionForm' : null" type="submit"
          @click="type === 'delete' ? handleActionSubmit() : null" :loading="loading" :disabled="loading"
          :class="{ 'button-disabled-visual': type === 'edit' && !isDirty }">
          {{ submitLabel }}
        </AppButton>
      </div>
    </template>
  </AppModal>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import AppModal from '@/components/common/ui/AppModal.vue'
import AppAlert from '@/components/common/ui/AppAlert.vue'
import AppButton from '@/components/common/ui/AppButton.vue'
import AppSelect from '@/components/common/ui/AppSelect.vue'
import AppInput from '@/components/common/ui/AppInput.vue'
import { getActionIcon } from '@/utils/assetHelper'
import { programService } from '@/services/programService'
import { storageService } from '@/services/storageService'
import { useActionModal } from '@/composables/useActionModal'

const props = defineProps({
  isOpen: Boolean,
  type: String,
  program: Object,
  loading: Boolean,
  error: String,
})

const emit = defineEmits(['close', 'submit', 'update:error'])

const getInitialData = () => ({
  name: '',
  categoryId: '',
  levelId: '',
  type: 'group',
  basePrice: 0.0,
  totalSessions: 1,
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
    const rawCategories = await programService.getAllCategories()
    categories.value = rawCategories.map((c) => ({
      ...c,
      profileURL: c.profileURL || '',
    }))
  } catch (err) {
    console.error(err)
  }
}

const fetchLevels = async () => {
  if (!localData.value.categoryId) return
  try {
    levels.value = await programService.getLevelsByCategory(localData.value.categoryId)
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
  localData.value.categoryId = val
  localData.value.levelId = ''
  clearError('categoryId')
  fetchLevels()
}

const handleFileUpload = async (event) => {
  const file = event.target.files[0]
  if (!file) return
  isUploading.value = true
  try {
    const timestamp = Date.now()
    const path = `programs/${localData.value.name}_${timestamp}`
    const url = await storageService.uploadFile(file, path)
    localData.value.profileURL = url
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
    rules.custom.totalSessions = (val) => val >= 1 || 'Min 1 unit'
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
      if (localData.value.categoryId) fetchLevels()
      if (props.type === 'edit') fetchSchedules()
    }
  },
)
</script>

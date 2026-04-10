<template>
  <AppModal :show="isOpen" maxWidth="600px" @close="$emit('close')">
    <template #header>
      <div class="modal-header-main">
        <div class="modal-title-wrapper">
          <img v-if="modalIcon" :src="modalIcon" class="modal-title-icon" />
          <h3>{{ modalTitle }}</h3>
        </div>
        <AppAlert :show="!!error" type="error" closable @close="$emit('update:error', '')">
          {{ error }}
        </AppAlert>
      </div>
    </template>

    <form v-if="type === 'add' || type === 'edit'" id="programActionForm" class="form-grid"
      @submit.prevent="handleSubmit">
      <div class="form-group full-width" :class="{ 'field-error': isSubmittingAttempted && errors.name }">
        <label>Program Name (Model) <span class="required">*</span>
          <span class="original-value" v-if="type === 'edit' && originalData.name">Original: {{ originalData.name }}</span>
        </label>
        <input type="text" v-model="localData.name" placeholder="e.g. Piano for kids" class="standard-input" />
        <div v-if="isSubmittingAttempted && errors.name" class="field-error-msg">{{ errors.name }}</div>
      </div>

      <div class="form-group" :class="{ 'field-error': isSubmittingAttempted && errors.categoryId }">
        <label>Category <span class="required">*</span>
          <span class="original-value" v-if="type === 'edit' && originalData.categoryId">Saved ID: {{ originalData.categoryId }}</span>
        </label>
        <AppSelect v-model="localData.categoryId" :items="sortedCategories" placeholder="-- Select Category --"
          @change="onCategoryChange" />
        <div v-if="isSubmittingAttempted && errors.categoryId" class="field-error-msg">{{ errors.categoryId }}</div>
      </div>

      <div class="form-group">
        <label>Level (Optional)
          <span class="original-value" v-if="type === 'edit' && originalData.levelId">Saved ID: {{ originalData.levelId }}</span>
        </label>
        <AppSelect v-model="localData.levelId" :items="sortedLevels" placeholder="-- Select Level --" />
      </div>

      <div class="divider full-width">Product Details</div>

      <div class="form-group">
        <label>Type <span class="required">*</span>
          <span class="original-value" v-if="type === 'edit' && originalData.type">Original: {{ originalData.type }}</span>
        </label>
        <AppSelect v-model="localData.type" :items="[ { id: 'group', name: 'Group Class' }, { id: 'private', name: 'Private Class' } ]" :searchable="false" />
      </div>

      <div class="form-group" :class="{ 'field-error': isSubmittingAttempted && errors.basePrice }">
        <label>Base Price ($) <span class="required">*</span>
          <span class="original-value" v-if="type === 'edit' && originalData.basePrice">Original: ${{ originalData.basePrice }}</span>
        </label>
        <input type="number" v-model="localData.basePrice" min="0" step="0.01" class="standard-input" />
        <div v-if="isSubmittingAttempted && errors.basePrice" class="field-error-msg">{{ errors.basePrice }}</div>
      </div>

      <div class="form-group" :class="{ 'field-error': isSubmittingAttempted && errors.sessionNumber }">
        <label>Sessions <span class="required">*</span>
          <span class="original-value" v-if="type === 'edit' && originalData.sessionNumber">Original: {{ originalData.sessionNumber }}</span>
        </label>
        <input type="number" v-model="localData.sessionNumber" min="1" class="standard-input" />
        <div v-if="isSubmittingAttempted && errors.sessionNumber" class="field-error-msg">{{ errors.sessionNumber }}</div>
      </div>

      <div class="form-group" :class="{ 'field-error': isSubmittingAttempted && errors.weeksNumber }">
        <label>Weeks <span class="required">*</span>
          <span class="original-value" v-if="type === 'edit' && originalData.weeksNumber">Original: {{ originalData.weeksNumber }}</span>
        </label>
        <input type="number" v-model="localData.weeksNumber" min="1" class="standard-input" />
        <div v-if="isSubmittingAttempted && errors.weeksNumber" class="field-error-msg">{{ errors.weeksNumber }}</div>
      </div>

      <div class="form-group" :class="{ 'field-error': isSubmittingAttempted && errors.maxCapacity }">
        <label>Default Max Capacity <span class="required">*</span>
          <span class="original-value" v-if="type === 'edit' && originalData.maxCapacity">Original: {{ originalData.maxCapacity }}</span>
        </label>
        <input type="number" v-model="localData.maxCapacity" min="1" class="standard-input" />
        <div v-if="isSubmittingAttempted && errors.maxCapacity" class="field-error-msg">{{ errors.maxCapacity }}</div>
      </div>

      <div class="form-group full-width">
        <label>Description (Optional)</label>
        <textarea v-model="localData.description" placeholder="Description of this program model..." rows="2" class="standard-input"></textarea>
      </div>

      <div class="form-group full-width">
        <label>Program Photo (Optional)</label>
        <div class="image-upload-modern">
          <div v-if="localData.profileURL" class="image-preview-mini">
            <img :src="localData.profileURL" alt="Preview" />
            <button type="button" class="btn-remove-photo" @click="localData.profileURL = ''">Remove Photo</button>
          </div>
          <div v-else class="upload-zone-standard">
            <input type="file" @change="handleFileUpload" accept="image/*" id="program-file-upload" hidden />
            <label for="program-file-upload" class="upload-trigger">
              <span class="icon">📷</span>
              <span class="label-text">{{ isUploading ? 'Uploading Image...' : 'Click to add Photo' }}</span>
            </label>
          </div>
        </div>
      </div>

      <!-- Schedule Templates -->
      <div v-if="type === 'edit'" class="divider full-width">Common Schedule Template Slots</div>
      <div v-if="type === 'edit'" class="form-group full-width">
        <div class="schedule-template-manager">
          <div class="template-list">
            <div v-for="s in schedules" :key="s.id" class="template-chip">
              <span class="day-val">{{ s.day }}</span>
              <span class="time-val">{{ s.timeslot }}</span>
              <button type="button" class="btn-clear-mini" @click="handleRemoveSchedule(s.id)">&times;</button>
            </div>
            <div v-if="schedules.length === 0" class="empty-hint">No schedule templates defined yet.</div>
          </div>
          <div class="template-add-controls mt-sm">
            <AppSelect v-model="newSchedule.day"
              :items="['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => ({ id: d, name: d }))"
              :searchable="false" class="day-selector" />
            <AppSelect v-model="newSchedule.timeslot"
              :items="['08:30 - 10:00', '10:30 - 12:00', '13:30 - 15:00', '15:30 - 17:00'].map(s => ({ id: s, name: s }))"
              :searchable="false" class="time-selector flex-1" />
            <button type="button" class="btn-add-standard" @click="handleAddSchedule" :disabled="!newSchedule.timeslot">Register Slot</button>
          </div>
        </div>
      </div>
    </form>

    <div v-if="type === 'delete'" class="action-delete-panel">
      <!-- Delete confirmation panel logic ... -->
      <div class="danger-box-standard">
        <div class="danger-icon-large">☢️</div>
        <div class="danger-content">
          <strong>Program Deletion</strong>
          <p>This will remove the program catalog entry. Active classes will refer to a potentially missing model.</p>
        </div>
      </div>
      <div class="form-group" :class="{ 'field-error': isSubmittingAttempted && errors.deleteConfirm }">
         <p class="confirm-label-standard">Type <strong class="danger-text">DELETE</strong> to confirm</p>
         <input type="text" v-model="localData.deleteConfirm" placeholder="DELETE" class="confirm-input-standard" />
         <div v-if="isSubmittingAttempted && errors.deleteConfirm" class="field-error-msg">{{ errors.deleteConfirm }}</div>
      </div>
    </div>

    <template #footer>
      <div class="flex-align-center flex-end w-full gap-sm">
        <AppButton variant="cancel" @click="$emit('close')">Cancel</AppButton>
        <AppButton :variant="type === 'delete' ? 'danger' : 'primary'" form="programActionForm"
          type="submit" @click="type === 'delete' ? handleSubmit() : null"
          :loading="loading" :disabled="isFormInvalid || (type === 'edit' && !isChanged)"
          :class="{ 'button-disabled-visual': isFormInvalid || (type === 'edit' && !isChanged) }">
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
import { getActionIcon } from '@/utils/assetHelper'
import { programService } from '@/services/programService'
import { storageService } from '@/services/storageService'

const props = defineProps({
  isOpen: Boolean,
  type: String, // 'add', 'edit', 'delete'
  program: Object,
  loading: Boolean,
  error: String,
})

const emit = defineEmits(['close', 'submit', 'update:error'])

const localData = ref({
  name: '',
  categoryId: '',
  levelId: '',
  type: 'group',
  basePrice: 0.0,
  sessionNumber: 1,
  weeksNumber: 1,
  maxCapacity: 10,
  description: '',
  profileURL: '',
  deleteConfirm: '',
})

const originalData = ref({})
const initialDataString = ref('')
const isSubmittingAttempted = ref(false)

const syncData = () => {
  if (props.type === 'edit' && props.program) {
    const data = { ...props.program, deleteConfirm: '' }
    localData.value = data
    originalData.value = { ...data }
    initialDataString.value = JSON.stringify(data)
  } else {
    localData.value = {
      name: '', categoryId: '', levelId: '', type: 'group',
      basePrice: 0.0, sessionNumber: 1, weeksNumber: 1, maxCapacity: 10,
      description: '', profileURL: '', deleteConfirm: ''
    }
    initialDataString.value = JSON.stringify(localData.value)
  }
}

watch(() => props.isOpen, (val) => {
  if (val) {
    syncData()
    isSubmittingAttempted.value = false
  }
})

const errors = computed(() => {
  const d = localData.value
  const errs = {}
  if (props.type === 'delete') {
    if (d.deleteConfirm !== 'DELETE') errs.deleteConfirm = 'Type DELETE to confirm.'
  } else {
    if (!d.name?.trim()) errs.name = 'Program name is required.'
    if (!d.categoryId) errs.categoryId = 'Category is required.'
    if (d.basePrice < 0) errs.basePrice = 'Price cannot be negative.'
    if (d.sessionNumber < 1) errs.sessionNumber = 'Min 1 session.'
    if (d.weeksNumber < 1) errs.weeksNumber = 'Min 1 week.'
    if (d.maxCapacity < 1) errs.maxCapacity = 'Capacity must be at least 1.'
  }
  return errs
})

const isFormInvalid = computed(() => Object.keys(errors.value).length > 0)
const isChanged = computed(() => JSON.stringify(localData.value) !== initialDataString.value)

const categories = ref([])
const levels = ref([])
const schedules = ref([])
const newSchedule = ref({ day: 'Monday', timeslot: '' })
const isUploading = ref(false)

const sortedCategories = computed(() => [...categories.value].sort((a,b) => a.name.localeCompare(b.name)))
const sortedLevels = computed(() => [...levels.value].sort((a,b) => a.name.localeCompare(b.name)))

const modalTitle = computed(() => {
  if (props.type === 'edit') return 'Edit Program Model'
  if (props.type === 'delete') return 'Destructive Action: Delete'
  return 'Register New Program Entry'
})

const modalIcon = computed(() => {
  if (props.type === 'delete') return getActionIcon('delete')
  return getActionIcon('edit')
})

const submitLabel = computed(() => {
  if (props.type === 'edit') return 'Save Profile'
  if (props.type === 'delete') return 'Permanently Delete'
  return 'Create Program'
})

const fetchCategories = async () => {
  try {
    categories.value = await programService.getAllCategories()
  } catch (err) { console.error(err) }
}

const fetchLevels = async () => {
  if (!localData.value.categoryId) return
  try {
    levels.value = await programService.getLevelsByCategory(localData.value.categoryId)
  } catch (err) { console.error(err) }
}

const fetchSchedules = async () => {
  if (props.type !== 'edit' || !props.program?.id) return
  try {
    schedules.value = await programService.getProgramSchedules(props.program.id)
  } catch (err) { console.error(err) }
}

const onCategoryChange = () => {
  localData.value.levelId = ''
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
  } catch (err) { console.error(err) }
}

const handleRemoveSchedule = async (scheduleId) => {
  try {
    await programService.deleteProgramSchedule(props.program.id, scheduleId)
    schedules.value = schedules.value.filter(s => s.id !== scheduleId)
  } catch (err) { console.error(err) }
}

const handleSubmit = () => {
  isSubmittingAttempted.value = true
  if (isFormInvalid.value) return
  emit('submit', { ...localData.value })
}

watch(() => props.isOpen, async (isOpen) => {
  if (isOpen) {
    await fetchCategories()
    if (localData.value.categoryId) fetchLevels()
    if (props.type === 'edit') fetchSchedules()
  }
})
</script>

<style scoped>
@import "@/assets/styles/components/ActionModalShared.css";

.image-preview-mini { display: flex; align-items: center; gap: var(--space-md); }
.image-preview-mini img { width: 56px; height: 56px; border-radius: var(--border-radius-sm); object-fit: cover; border: 1px solid var(--border-color); }
.btn-remove-photo { font-size: 10px; color: var(--error-color); font-weight: 700; cursor: pointer; background: var(--error-soft); border: none; padding: 4px 8px; border-radius: 4px; }

.upload-zone-standard { position: relative; width: 100%; }
.upload-trigger { display: flex; align-items: center; gap: var(--space-sm); padding: var(--space-md); border: 1.5px dashed var(--border-color); border-radius: var(--border-radius-sm); cursor: pointer; transition: all 0.2s; }
.upload-trigger:hover { background: var(--bg-subtle); border-color: var(--primary-light); }
.upload-trigger .label-text { font-size: var(--text-xs); color: var(--text-muted); font-weight: 600; }

.schedule-template-manager { background: var(--bg-subtle); border: 1.5px solid var(--border-color); border-radius: var(--border-radius-sm); padding: var(--space-md); }
.template-list { display: flex; flex-wrap: wrap; gap: var(--space-xs); }
.template-chip { display: flex; align-items: center; gap: 6px; background: var(--white); padding: 4px 10px; border-radius: 6px; border: 1px solid var(--border-color); box-shadow: var(--shadow-xs); }
.day-val { font-size: 10px; font-weight: 850; color: var(--primary-color); text-transform: uppercase; }
.time-val { font-size: var(--text-xs); color: var(--text-dark); font-weight: 600; }
.btn-clear-mini { width: 14px; height: 14px; line-height: 1; border-radius: 50%; background: var(--bg-subtle); border: none; font-size: 10px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
.btn-clear-mini:hover { background: var(--error-soft); color: var(--error-color); }
.empty-hint { font-size: var(--text-xs); color: var(--text-light); font-style: italic; }

.template-add-controls { display: flex; gap: var(--space-xs); }
.btn-add-standard { background: var(--primary-color); color: white; border: none; border-radius: var(--border-radius-sm); padding: 0 var(--space-md); font-size: var(--text-xs); font-weight: 700; cursor: pointer; transition: all 0.2s; }
.btn-add-standard:hover { background: var(--primary-dark); }
.btn-add-standard:disabled { opacity: 0.5; cursor: not-allowed; }

.day-selector { width: 120px; }
</style>

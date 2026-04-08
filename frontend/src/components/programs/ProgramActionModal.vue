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

    <form v-if="type === 'add' || type === 'edit'" class="form-grid" @submit.prevent="handleSubmit">
      <div class="form-group full-width">
        <label>Program Name (Model) <span class="required">*</span></label>
        <input type="text" v-model="localData.name" placeholder="e.g. Piano - Grade 1" required />
      </div>

      <div class="form-group">
        <label>Category <span class="required">*</span></label>
        <AppSelect v-model="localData.categoryId" :items="sortedCategories" placeholder="-- Select Category --"
          @change="onCategoryChange" />
      </div>

      <div class="form-group">
        <label>Level (Optional)</label>
        <AppSelect v-model="localData.levelId" :items="sortedLevels" placeholder="-- Select Level --" />
      </div>

      <div class="divider full-width">Product Details</div>

      <div class="form-group">
        <label>Type <span class="required">*</span></label>
        <AppSelect v-model="localData.type" :items="[
          { id: 'group', name: 'Group Class' },
          { id: 'private', name: 'Private Class' }
        ]" :searchable="false" />
      </div>

      <div class="form-group">
        <label>Base Price ($) <span class="required">*</span></label>
        <input type="number" v-model="localData.basePrice" min="0" step="0.01" required />
      </div>

      <div class="form-group">
        <label>Sessions <span class="required">*</span></label>
        <input type="number" v-model="localData.sessionNumber" min="1" required />
      </div>

      <div class="form-group">
        <label>Weeks <span class="required">*</span></label>
        <input type="number" v-model="localData.weeksNumber" min="1" required />
      </div>

      <div class="form-group">
        <label>Default Max Capacity <span class="required">*</span></label>
        <input type="number" v-model="localData.maxCapacity" min="1" required />
      </div>

      <div class="form-group full-width">
        <label>Description (Optional)</label>
        <textarea v-model="localData.description" placeholder="Description of this program model..."
          rows="2"></textarea>
      </div>

      <div class="form-group full-width">
        <label>Program Photo (Optional)</label>
        <div class="upload-container">
          <div v-if="localData.profileURL" class="image-preview">
            <img :src="localData.profileURL" alt="Preview" />
            <div class="remove-img" @click="localData.profileURL = ''">Remove</div>
          </div>
          <div v-else class="upload-placeholder">
            <input type="file" @change="handleFileUpload" accept="image/*" id="file-upload" hidden />
            <label for="file-upload" class="upload-label">
              <span class="icon">📷</span>
              {{ isUploading ? 'Uploading...' : 'Click to upload' }}
            </label>
          </div>
        </div>
      </div>

      <!-- Schedule Templates Section (Subcollection) -->
      <div v-if="type === 'edit'" class="divider full-width">Bone Structure: Common Schedules</div>
      <div v-if="type === 'edit'" class="form-group full-width">
        <div class="schedule-manager">
          <div class="schedule-list">
            <div v-for="s in schedules" :key="s.id" class="schedule-item">
              <span class="day">{{ s.day }}</span>
              <span class="time">{{ s.timeslot }}</span>
              <button type="button" class="btn-remove" @click="handleRemoveSchedule(s.id)">&times;</button>
            </div>
            <div v-if="schedules.length === 0" class="empty-text">No schedule templates defined yet.</div>
          </div>
          <div class="schedule-add">
            <AppSelect v-model="newSchedule.day"
              :items="['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => ({ id: d, name: d }))"
              :searchable="false" class="w-140" />
            <AppSelect v-model="newSchedule.timeslot"
              :items="['08:30 - 10:00', '10:30 - 12:00', '13:30 - 15:00', '15:30 - 17:00'].map(s => ({ id: s, name: s }))"
              :searchable="false" class="flex-1" />
            <button type="button" class="btn-add" @click="handleAddSchedule"
              :disabled="!newSchedule.timeslot">Add</button>
          </div>
        </div>
      </div>
    </form>

    <div v-if="type === 'delete'" class="delete-confirm">
      <div class="danger-box-standard">
        <strong>Delete Program Model?</strong>
        <p>This will remove the product catalog entry. Active classes using this model will remain but will lose their
          product reference.</p>
      </div>
      <div class="confirm-input">
        <label>Type <strong>DELETE</strong> to confirm:</label>
        <input type="text" v-model="localData.deleteConfirm" placeholder="DELETE" />
      </div>
    </div>

    <template #footer>
      <div class="flex-align-center flex-end w-full gap-sm">
        <AppButton variant="cancel" @click="$emit('close')">Cancel</AppButton>
        <AppButton :variant="type === 'delete' ? 'danger' : 'primary'" @click="handleSubmit" :loading="loading"
          :disabled="!isFormValid">
          {{ type === 'delete' ? 'Delete' : 'Save Program Model' }}
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
import { programService } from '@/services/programService'
import { useActionModal } from '@/composables/useActionModal'
import { getActionIcon } from '@/utils/assetHelper'

const props = defineProps({
  isOpen: Boolean,
  type: String,
  program: Object,
  loading: Boolean,
  error: String
})

const emit = defineEmits(['close', 'submit'])

const categories = ref([])
const levels = ref([])
const schedules = ref([])
const isUploading = ref(false)
const newSchedule = ref({ day: 'Monday', timeslot: '' })

const getInitialData = () => ({
  name: '',
  categoryId: '',
  category: '',
  levelId: '',
  type: 'group',
  basePrice: 0,
  sessionNumber: 12,
  weeksNumber: 12,
  maxCapacity: 15,
  description: '',
  profileURL: '',
  deleteConfirm: ''
})

const mapSourceToForm = () => {
  if (props.type === 'add') return getInitialData()
  const p = props.program || {}
  return {
    ...getInitialData(),
    ...p,
    name: p.name || p.title || '',
    deleteConfirm: ''
  }
}

const { localData, submitForm } = useActionModal(props, emit, {
  getInitialData,
  mapSourceToForm
})

const sortedCategories = computed(() => {
  return [...categories.value].sort((a, b) => (a.name || '').localeCompare(b.name || ''))
})

const sortedLevels = computed(() => {
  return [...levels.value].sort((a, b) => (a.name || '').localeCompare(b.name || ''))
})

const isFormValid = computed(() => {
  if (props.type === 'delete') return localData.value.deleteConfirm === 'DELETE'
  return (
    localData.value.name?.trim() &&
    localData.value.categoryId &&
    localData.value.sessionNumber > 0 &&
    localData.value.weeksNumber > 0
  )
})

const modalTitle = computed(() => {
  const titles = { add: 'New Program Model', edit: 'Edit Program Model', delete: 'Delete Program Model' }
  return titles[props.type] || 'Action'
})

const modalIcon = computed(() => {
  if (props.type === 'add') return getActionIcon('plus')
  if (props.type === 'edit') return getActionIcon('edit')
  if (props.type === 'delete') return getActionIcon('delete')
  return null
})

const onCategoryChange = () => {
  const cat = categories.value.find(c => c.id === localData.value.categoryId)
  if (cat) {
    localData.value.category = cat.name
    fetchLevels()
  }
}

const fetchCategories = async () => {
  try {
    const data = await programService.getAllCategories()
    categories.value = data || []
  } catch (err) { console.error(err) }
}

const fetchLevels = async () => {
  if (!localData.value.categoryId) return
  try {
    const data = await programService.getAllLevels(localData.value.categoryId)
    levels.value = data || []
  } catch (err) { console.error(err) }
}

const fetchSchedules = async () => {
  if (!props.program?.id) return
  try {
    schedules.value = await programService.getSchedules(props.program.id)
  } catch (err) { console.error(err) }
}

const handleAddSchedule = async () => {
  if (!newSchedule.value.timeslot) return
  try {
    await programService.addSchedule(props.program.id, newSchedule.value)
    newSchedule.value.timeslot = ''
    fetchSchedules()
  } catch (err) { alert(err.message) }
}

const handleRemoveSchedule = async (sid) => {
  try {
    await programService.removeSchedule(props.program.id, sid)
    fetchSchedules()
  } catch (err) { alert(err.message) }
}

const handleFileUpload = async (event) => {
  const file = event.target.files[0]
  if (!file) return
  isUploading.value = true
  try {
    const result = await programService.uploadImage(file)
    localData.value.profileURL = result.profileURL
  } catch (err) { alert('Upload failed: ' + err.message) }
  finally { isUploading.value = false }
}

const handleSubmit = () => submitForm(isFormValid.value)

watch(() => props.isOpen, async (isOpen) => {
  if (isOpen) {
    await fetchCategories()
    if (localData.value.categoryId) fetchLevels()
    if (props.type === 'edit') fetchSchedules()
  }
})
</script>

<style scoped>
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-sm);
}

.full-width {
  grid-column: span 2;
}

.divider {
  margin: var(--space-sm) 0 var(--space-3xs);
  font-weight: 700;
  font-size: var(--text-xs);
  color: var(--text-muted);
  text-transform: uppercase;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 4px;
}

.form-group label {
  display: block;
  font-size: var(--text-xs);
  font-weight: 600;
  margin-bottom: 4px;
  color: var(--text-dark);
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: var(--space-sm) var(--space-md);
  border: 1.5px solid var(--border-color);
  border-radius: var(--border-radius-sm);
  font-size: var(--text-sm);
}

.schedule-manager {
  background: var(--bg-subtle);
  border: 1.5px solid var(--border-color);
  border-radius: var(--border-radius-sm);
  padding: var(--space-sm);
}

.schedule-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xs);
  margin-bottom: var(--space-sm);
}

.schedule-item {
  background: var(--white);
  border: 1px solid var(--text-light);
  border-radius: var(--border-radius-xs);
  padding: 4px 8px;
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  font-size: var(--text-xs);
}

.btn-remove {
  background: var(--error-soft);
  color: var(--error-color);
  border: none;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  line-height: 1;
  cursor: pointer;
}

.schedule-add {
  display: flex;
  gap: 8px;
}

.btn-add {
  background: var(--accent-color);
  color: white;
  border: none;
  border-radius: 6px;
  padding: 0 12px;
  cursor: pointer;
}

.upload-container {
  display: flex;
  align-items: center;
  gap: 15px;
}

.image-preview img {
  width: 50px;
  height: 50px;
  border-radius: var(--border-radius-sm);
  object-fit: cover;
}

.remove-img {
  font-size: 0.7rem;
  color: var(--error-color);
  cursor: pointer;
}

.upload-label {
  border: 1.5px dashed var(--text-light);
  padding: var(--space-sm) var(--space-xl);
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  font-size: var(--text-xs);
  color: var(--text-muted);
}

.delete-confirm {
  padding: var(--space-sm) 0;
}

.danger-box-standard {
  background: var(--error-soft);
  border: 1px solid var(--error-soft);
  padding: var(--space-md);
  border-radius: var(--border-radius-sm);
  margin-bottom: var(--space-md);
}

.danger-box strong {
  display: block;
  color: var(--error-deep);
  margin-bottom: 4px;
}

.danger-box p {
  font-size: var(--text-sm);
  color: var(--error-deep);
}

.confirm-input label {
  display: block;
  font-size: var(--text-xs);
  margin-bottom: var(--space-xs);
}

.confirm-input input {
  width: 100%;
  padding: var(--space-sm);
  border: 1.5px solid var(--border-color);
  border-radius: var(--border-radius-sm);
  text-align: center;
  font-weight: 700;
  letter-spacing: 2px;
}
</style>

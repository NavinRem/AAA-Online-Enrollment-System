<template>
  <AppModal :show="isOpen" :title="modalTitle" variant="action" @close="$emit('close')">
    <div v-if="error" class="error-banner">{{ error }}</div>
    <div v-if="success" class="success-banner">{{ success }}</div>

    <div v-if="type === 'add' || type === 'edit'" class="form-grid">
      <div class="form-group full-width">
        <label>Program Title <span class="required">*</span></label>
        <span class="original-value" v-if="type === 'edit' && originalData.title">
          Original: {{ originalData.title }}
        </span>
        <input type="text" v-model="localData.title" :placeholder="titlePlaceholder" required />
      </div>

      <div class="form-group">
        <label>Category <span class="required">*</span></label>
        <span class="original-value" v-if="type === 'edit' && originalData.category">
          Original: {{ originalData.category }}
        </span>
        <div class="category-field">
          <select v-model="localData.categoryId" class="form-select" required @change="onCategoryChange">
            <option disabled value="">-- Select Category --</option>
            <option v-for="cat in categories" :key="cat.id" :value="cat.id">
              {{ cat.name }}
            </option>
          </select>
          <div class="quick-add-category">
            <input 
              type="text" 
              v-model="newCategoryName" 
              placeholder="New category..." 
              @keyup.enter="handleCreateCategory"
            />
            <button type="button" @click="handleCreateCategory" :disabled="!newCategoryName.trim()">
              Add
            </button>
          </div>
        </div>
      </div>

      <div class="form-group">
        <label>Level <span class="required">*</span></label>
        <span class="original-value" v-if="type === 'edit' && originalData.level">
          Original: {{ originalData.level }}
        </span>
        <div class="dynamic-field">
          <select v-model="localData.levelId" class="form-select" required>
            <option disabled value="">-- Select Level --</option>
            <option v-for="lvl in levels" :key="lvl.id" :value="lvl.id">
              {{ lvl.name }}
            </option>
          </select>
          <div class="quick-add">
            <input 
              type="text" 
              v-model="newLevelName" 
              placeholder="New level..." 
              @keyup.enter="handleCreateLevel"
            />
            <button type="button" @click="handleCreateLevel" :disabled="!newLevelName.trim()">
              Add
            </button>
          </div>
        </div>
      </div>

      <div class="form-group">
        <label>Academic Term <span class="required">*</span></label>
        <span class="original-value" v-if="type === 'edit' && originalData.term">
          Original: {{ originalData.term }}
        </span>
        <div class="dynamic-field">
          <select v-model="localData.termId" class="form-select" required>
            <option disabled value="">-- Select Term --</option>
            <option v-for="term in terms" :key="term.id" :value="term.id">
              {{ term.name }}
            </option>
          </select>
          <div class="quick-add">
            <input 
              type="text" 
              v-model="newTermName" 
              placeholder="e.g. T1-2026..." 
              @keyup.enter="handleCreateTerm"
            />
            <button type="button" @click="handleCreateTerm" :disabled="!newTermName.trim()">
              Add
            </button>
          </div>
        </div>
      </div>

      <div class="form-group">
        <label>Price ($) <span class="required">*</span></label>
        <span class="original-value" v-if="type === 'edit' && originalData.price">
          Original: ${{ originalData.price }}
        </span>
        <input type="number" v-model="localData.price" min="0" step="0.01" required />
        <p class="help-text-small" v-if="localData.number_session">
          Avg. ${{ (localData.price / localData.number_session).toFixed(2) }} per session
        </p>
      </div>

      <div class="form-group">
        <label>Total Sessions <span class="required">*</span></label>
        <span class="original-value" v-if="type === 'edit' && originalData.number_session">
          Original: {{ originalData.number_session }}
        </span>
        <input type="number" v-model="localData.number_session" min="1" required />
      </div>

      <div class="form-group">
        <label>Status <span class="required">*</span></label>
        <span class="original-value" v-if="type === 'edit' && originalData.status">
          Original: {{ originalData.status }}
        </span>
        <select v-model="localData.status" class="form-select" required>
          <option value="Active">Active</option>
          <option value="Upcoming">Upcoming</option>
          <option v-if="type === 'edit'" value="Closed">Closed</option>
        </select>
      </div>

      <div class="form-group full-width">
        <label>Description</label>
        <textarea
          v-model="localData.description"
          placeholder="What is this program about?"
          rows="3"
        ></textarea>
      </div>

      <div class="form-group full-width">
        <label>Program Photo</label>
        <div class="upload-container">
          <div v-if="localData.imageURL" class="image-preview">
            <img :src="localData.imageURL" alt="Preview" />
            <button type="button" class="remove-img" @click="localData.imageURL = ''">×</button>
          </div>
          <div v-else class="upload-placeholder">
            <input type="file" @change="handleFileUpload" accept="image/*" id="file-upload" hidden />
            <label for="file-upload" class="upload-label">
              <span class="icon">📷</span>
              <span v-if="isUploading">Uploading...</span>
              <span v-else>Click to upload photo</span>
            </label>
          </div>
        </div>
      </div>
    </div>

    <div v-if="type === 'delete'" class="form-group full-width">
      <div class="info-block danger">
        <div class="icon">🛑</div>
        <div class="text">
          <strong>Delete Program</strong>
          <p>
            You are about to delete <strong>{{ program?.title }}</strong>. This action is permanent and might affect existing enrollments linked to this program.
          </p>
        </div>
      </div>
      <label>To confirm, type <strong class="danger-text">DELETE</strong> below</label>
      <input type="text" v-model="localData.deleteConfirm" placeholder="Type DELETE" />
    </div>

    <template #footer>
      <AppButton variant="cancel" @click="$emit('close')">Cancel</AppButton>
      <AppButton
        :variant="type === 'delete' ? 'danger' : 'primary'"
        @click="handleSubmit"
        :loading="loading"
        :disabled="loading || !isFormValid"
      >
        {{ type === 'delete' ? 'Delete' : 'Save Program' }}
      </AppButton>
    </template>
  </AppModal>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import AppModal from '@/components/common/ui/AppModal.vue'
import AppButton from '@/components/common/ui/AppButton.vue'
import { courseService } from '@/services/courseService'
import { useActionModal } from '@/composables/useActionModal'
import { 
  calculateEndTime, 
  calculateDuration, 
} from '@/utils/timeHelper'

const props = defineProps({
  isOpen: Boolean,
  type: String, // 'add', 'edit', 'delete'
  program: Object,
  loading: Boolean,
  error: String,
  success: String,
})

const emit = defineEmits(['close', 'submit'])

const categories = ref([])
const levels = ref([])
const terms = ref([])
const newCategoryName = ref('')
const newLevelName = ref('')
const newTermName = ref('')
const isUploading = ref(false)
const endTime = ref('10:00')

const getInitialData = () => ({
  title: '',
  categoryId: '',
  category: '',
  description: '',
  price: 0,
  number_session: 11,
  levelId: '',
  termId: '',
  status: 'Active',
  schedule: { day: 'Monday', time: '09:00', duration: 60 },
  imageURL: '',
  deleteConfirm: '',
})

const mapSourceToForm = () => {
  if (props.type === 'add') return getInitialData()
  const s = props.program || {}
  return {
    title: s.title || s.name || '',
    categoryId: s.categoryId || '',
    category: s.category || '',
    description: s.description || '',
    price: s.price || 0,
    number_session: s.number_session || 1,
    levelId: s.levelId || '',
    termId: s.termId || '',
    status: s.status || 'Active',
    schedule: s.schedule || { day: 'Monday', time: '09:00', duration: 60 },
    imageURL: s.imageURL || '',
    deleteConfirm: '',
  }
}

const { localData, submitForm } = useActionModal(props, emit, {
  getInitialData,
  mapSourceToForm
})

// Original Data kept for UI cues (some fields in template use it)
const originalData = computed(() => props.program || {})

// Lifecycle and Fetches
watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    fetchCategories()
    fetchTerms()
    if (localData.value.categoryId) fetchLevels()
    else levels.value = []
  }
})

const onCategoryChange = () => {
  localData.value.levelId = ''
  levels.value = []
  const selectedCat = categories.value.find(c => c.id === localData.value.categoryId)
  if (selectedCat) {
    localData.value.category = selectedCat.name
    fetchLevels()
  }
}

const fetchCategories = async () => {
  try {
    const data = await courseService.getAllCategories()
    categories.value = Array.isArray(data) ? data : []
  } catch (err) { console.error('Failed to fetch categories', err) }
}

const fetchLevels = async () => {
  if (!localData.value.categoryId) return
  try {
    const data = await courseService.getAllLevels(localData.value.categoryId)
    levels.value = Array.isArray(data) ? data : []
  } catch (err) { console.error('Failed to fetch levels', err) }
}

const fetchTerms = async () => {
  try {
    const data = await courseService.getAllTerms()
    terms.value = Array.isArray(data) ? data : []
  } catch (err) { console.error('Failed to fetch terms', err) }
}

const handleCreateCategory = async () => {
  if (!newCategoryName.value.trim()) return
  try {
    const result = await courseService.createCategory({ name: newCategoryName.value.trim() })
    await fetchCategories()
    localData.value.categoryId = result.id
    localData.value.category = result.name
    newCategoryName.value = ''
    fetchLevels()
  } catch (err) { alert(err.message || 'Failed to create category') }
}

const handleCreateLevel = async () => {
  if (!newLevelName.value.trim() || !localData.value.categoryId) return
  try {
    const result = await courseService.createLevel(localData.value.categoryId, { name: newLevelName.value.trim() })
    await fetchLevels()
    localData.value.levelId = result.id
    newLevelName.value = ''
  } catch (err) { alert(err.message || 'Failed to create level') }
}

const handleCreateTerm = async () => {
  if (!newTermName.value.trim()) return
  try {
    const result = await courseService.createTerm({ name: newTermName.value.trim() })
    await fetchTerms()
    localData.value.termId = result.id
    newTermName.value = ''
  } catch (err) { alert(err.message || 'Failed to create term') }
}

const handleFileUpload = async (event) => {
  const file = event.target.files[0]
  if (!file) return
  isUploading.value = true
  try {
    const result = await courseService.uploadImage(file)
    localData.value.imageURL = result.imageURL
  } catch (err) { alert('Upload failed: ' + err.message) }
  finally { isUploading.value = false }
}

const modalTitle = computed(() => {
  const titles = { add: 'Create New Program', edit: 'Edit Program', delete: 'Delete Program' }
  return titles[props.type] || 'Program Action'
})

const isFormValid = computed(() => {
  if (props.type === 'delete') return localData.value.deleteConfirm === 'DELETE'
  return (
    localData.value.title.trim() && 
    localData.value.categoryId && 
    localData.value.levelId && 
    localData.value.termId && 
    localData.value.price >= 0 && 
    localData.value.number_session > 0
  )
})

const titlePlaceholder = computed(() => {
  const cat = categories.value.find(c => c.id === localData.value.categoryId)
  const lvl = levels.value.find(l => l.id === localData.value.levelId)
  if (cat && lvl) return `e.g. ${cat.name} Level ${lvl.name}`
  if (cat) return `e.g. ${cat.name} Level 1`
  return 'e.g. Ballet Level 1'
})

// Time Helpers
const onStartTimeChange = () => {
  endTime.value = calculateEndTime(localData.value.schedule.time, localData.value.schedule.duration)
}

const onEndTimeChange = () => {
  localData.value.schedule.duration = calculateDuration(localData.value.schedule.time, endTime.value)
}

const onDurationChange = () => {
  endTime.value = calculateEndTime(localData.value.schedule.time, localData.value.schedule.duration)
}

watch(() => localData.value.schedule, () => {
  endTime.value = calculateEndTime(localData.value.schedule.time, localData.value.schedule.duration)
}, { immediate: true, deep: true })

const handleSubmit = () => submitForm(isFormValid.value)
</script>

<style scoped>
.original-value {
  display: block;
  font-size: 0.75rem;
  color: #94a3b8;
  margin-top: -4px;
  margin-bottom: 4px;
  font-style: italic;
}

.help-text {
  font-size: 0.85rem;
  color: #64748b;
  margin-bottom: 8px;
}

.image-presets {
  margin-top: 10px;
}

.preset-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.preset-chip {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 100px;
  padding: 6px 14px;
  cursor: pointer;
  font-size: 0.85rem;
  color: #64748b;
  transition: all 0.2s;
}

.preset-chip:hover {
  background: #f1f5f9;
}

.info-block {
  display: flex;
  gap: 12px;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.info-block.danger {
  background: #fef2f2;
  border: 1px solid #fecaca;
}

.icon {
  font-size: 1.5rem;
}

.danger-text {
  color: #ef4444;
}

.form-select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.95rem;
  background-color: #f8fafc;
  outline: none;
}

.category-field,
.dynamic-field {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.quick-add-category,
.quick-add {
  display: flex;
  gap: 8px;
}

.quick-add-category input,
.quick-add input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 0.85rem;
  background: #ffffff;
}

.quick-add-category button,
.quick-add button {
  padding: 8px 16px;
  background: #00aeef;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
}

.quick-add-category button:disabled,
.quick-add button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.help-text-small {
  font-size: 0.75rem;
  color: #64748b;
  margin-top: 4px;
}

.schedule-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.schedule-header {
  background: #f8fafc;
  padding: 8px 16px;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.8rem;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.schedule-grid {
  display: grid;
  grid-template-columns: 1.5fr 1.2fr 1.2fr 1fr;
  gap: 16px;
  padding: 16px;
}

.schedule-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.label-small {
  font-size: 0.75rem;
  font-weight: 600;
  color: #475569;
}

.input-with-icon {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 10px;
  font-size: 0.9rem;
  pointer-events: none;
  opacity: 0.6;
}

.input-with-icon input {
  padding-left: 32px !important;
}

.duration-input {
  display: flex;
  align-items: center;
  gap: 0;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
  transition: border-color 0.2s;
}

.duration-input:focus-within {
  border-color: #00aeef;
  box-shadow: 0 0 0 3px rgba(0, 174, 239, 0.1);
}

.duration-input input {
  border: none !important;
  background: transparent !important;
  padding: 10px 8px !important;
  width: 100%;
  text-align: center;
  font-size: 0.95rem;
}

.mins-label {
  padding: 0 12px;
  font-size: 0.75rem;
  font-weight: 600;
  color: #94a3b8;
  background: #f8fafc;
  align-self: stretch;
  display: flex;
  align-items: center;
  border-left: 1px solid #e2e8f0;
}

.upload-container {
  border: 2px dashed #e2e8f0;
  border-radius: 12px;
  padding: 24px;
  text-align: center;
  background: #f8fafc;
  transition: all 0.2s;
}

.upload-container:hover {
  border-color: #00aeef;
  background: #f0f9ff;
}

.upload-label {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  color: #64748b;
  font-weight: 500;
}

.upload-label .icon {
  font-size: 2rem;
}

.image-preview {
  position: relative;
  display: inline-block;
}

.image-preview img {
  max-width: 100%;
  max-height: 200px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.remove-img {
  position: absolute;
  top: -10px;
  right: -10px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #ef4444;
  color: white;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}
</style>

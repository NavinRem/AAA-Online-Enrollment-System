<template>
  <AppModal :show="isOpen" :title="modalTitle" maxWidth="640px" @close="$emit('close')">
    <div v-if="error" class="alert-box error">{{ error }}</div>
    <div v-if="success" class="alert-box success">{{ success }}</div>

    <div v-if="type === 'add' || type === 'edit'" class="form-grid">
      <div class="form-group full-width">
        <label>Program Title <span class="required">*</span></label>
        <input type="text" v-model="localData.title" :placeholder="titlePlaceholder" required />
      </div>

      <div class="form-group">
        <label>Category <span class="required">*</span></label>
        <div class="category-field">
          <select v-model="localData.categoryId" class="form-select" required @change="onCategoryChange">
            <option disabled value="">-- Select Category --</option>
            <option v-for="cat in categories" :key="cat.id" :value="cat.id">
              {{ cat.name }}
            </option>
          </select>
          <div class="quick-add">
            <input type="text" v-model="newCategoryName" placeholder="New cat..." @keyup.enter="handleCreateCategory" />
            <button type="button" @click="handleCreateCategory" :disabled="!newCategoryName.trim()">Add</button>
          </div>
        </div>
      </div>

      <div class="form-group">
        <label>Level <span class="required">*</span></label>
        <div class="dynamic-field">
          <select v-model="localData.levelId" class="form-select" required>
            <option disabled value="">-- Select Level --</option>
            <option v-for="lvl in levels" :key="lvl.id" :value="lvl.id">
              {{ lvl.name }}
            </option>
          </select>
          <div class="quick-add">
            <input type="text" v-model="newLevelName" placeholder="New level..." @keyup.enter="handleCreateLevel" />
            <button type="button" @click="handleCreateLevel" :disabled="!newLevelName.trim()">Add</button>
          </div>
        </div>
      </div>

      <div class="form-group">
        <label>Academic Term <span class="required">*</span></label>
        <div class="dynamic-field">
          <select v-model="localData.termId" class="form-select" required>
            <option disabled value="">-- Select Term --</option>
            <option v-for="term in terms" :key="term.id" :value="term.id">
              {{ term.name }}
            </option>
          </select>
          <div class="quick-add">
            <input type="text" v-model="newTermName" placeholder="New term..." @keyup.enter="handleCreateTerm" />
            <button type="button" @click="handleCreateTerm" :disabled="!newTermName.trim()">Add</button>
          </div>
        </div>
      </div>

      <div class="form-group">
        <label>Program Price ($) <span class="required">*</span></label>
        <input type="number" v-model="localData.price" min="0" step="0.01" required placeholder="0.00" />
      </div>

      <div class="form-group">
        <label>Total Sessions <span class="required">*</span></label>
        <input type="number" v-model="localData.numberSessions" min="1" required />
        <p class="help-text-small" v-if="localData.numberSessions > 0">
          Avg. ${{ (localData.price / localData.numberSessions).toFixed(2) }} / session
        </p>
      </div>

      <div class="form-group">
        <label>Status <span class="required">*</span></label>
        <select v-model="localData.status" class="form-select">
          <option value="Active">Active</option>
          <option value="Upcoming">Upcoming</option>
          <option v-if="type === 'edit'" value="Closed">Closed</option>
        </select>
      </div>

      <div class="form-group full-width">
        <label>Weekly Schedule <span class="required">*</span></label>
        <div class="row-inputs">
          <select v-model="localData.schedule.day" class="form-select" style="width: 140px;">
            <option v-for="day in ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']" :key="day" :value="day">
              {{ day }}
            </option>
          </select>
          <select v-model="localData.schedule.timeslot" class="form-select" style="flex: 1;">
            <option disabled value="">-- Select Time Slot --</option>
            <option v-for="slot in ['08:30 - 10:00', '10:30 - 12:00', '13:30 - 15:00', '15:30 - 17:00', '17:30 - 19:00']" :key="slot" :value="slot">
              {{ slot }}
            </option>
          </select>
        </div>
      </div>

      <div class="form-group full-width">
        <label>Teacher (Responsible for this Program) <span class="required">*</span></label>
        <div class="custom-dropdown-container">
          <div class="custom-dropdown" :class="{ open: isTeacherDropdownOpen }">
            <div class="dropdown-header" @click="isTeacherDropdownOpen = !isTeacherDropdownOpen">
              <template v-if="selectedTeacher">
                <div class="selected-teacher">
                  <img
                    :src="selectedTeacher.profileURL || getImageUrl('profiles/avatar-parent')"
                    class="avatar-mini-circle"
                  />
                  <span>{{ selectedTeacher.name || selectedTeacher.email }}</span>
                </div>
              </template>
              <template v-else>
                <span class="placeholder">-- Choose a teacher --</span>
              </template>
              <span class="chevron" :class="{ up: isTeacherDropdownOpen }"></span>
            </div>
            
            <div class="dropdown-menu" v-if="isTeacherDropdownOpen">
              <div class="dropdown-search">
                <input
                  type="text"
                  v-model="teacherSearchQuery"
                  placeholder="Search name or email..."
                  @click.stop
                  autofocus
                />
              </div>
              <ul class="dropdown-list">
                <li
                  v-for="t in filteredTeachers"
                  :key="t.uid || t.id"
                  class="dropdown-item"
                  :class="{ active: localData.teacherId === (t.uid || t.id) }"
                  @click="selectTeacher(t)"
                >
                  <img
                    :src="t.profileURL || getImageUrl('profiles/avatar-parent')"
                    class="avatar-mini-circle"
                  />
                  <div class="item-info">
                    <span class="item-name">{{ t.name || t.email }}</span>
                  </div>
                </li>
                <li v-if="filteredTeachers.length === 0" class="dropdown-item no-results">
                  No matches found.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div class="form-group full-width">
        <label>Description (Optional)</label>
        <textarea v-model="localData.description" placeholder="What is this program about?" rows="2"></textarea>
      </div>

      <div class="form-group full-width" style="margin-bottom: 0;">
        <label>Program Photo</label>
        <div class="upload-container">
          <div v-if="localData.imageURL" class="image-preview">
            <img :src="localData.imageURL" alt="Preview" />
            <div class="remove-img" @click="localData.imageURL = ''">Remove image</div>
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
          <p>You are about to delete <strong>{{ program?.title }}</strong>. This action is permanent.</p>
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
import { userService } from '@/services/userService'
import { useActionModal } from '@/composables/useActionModal'
import { useSearch, teacherSearchMapper } from '@/composables/useSearch'
import { getImageUrl } from '@/utils/assetHelper'

const props = defineProps({
  isOpen: Boolean,
  type: String,
  program: Object,
  loading: Boolean,
  error: String,
  success: String,
})

const emit = defineEmits(['close', 'submit'])

const terms = ref([])
const teachers = ref([])
const newCategoryName = ref('')
const newLevelName = ref('')
const newTermName = ref('')
const isUploading = ref(false)

// Teacher Search Logic
const isTeacherDropdownOpen = ref(false)
const { searchQuery: teacherSearchQuery, searchResults: filteredTeachers } = useSearch(
  teachers,
  teacherSearchMapper,
)

const getInitialData = () => ({
  title: '',
  categoryId: '',
  category: '',
  description: '',
  price: 0,
  numberSessions: 11,
  levelId: '',
  termId: '',
  status: 'Active',
  schedule: { day: 'Monday', timeslot: '10:30 - 12:00' },
  imageURL: '',
  teacherName: '',
  teacherId: '',
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
    numberSessions: s.numberSessions || s.number_session || 1,
    levelId: s.levelId || '',
    termId: s.termId || '',
    status: s.status || 'Active',
    schedule: s.schedule || { day: 'Monday', timeslot: '10:30 - 12:00' },
    imageURL: s.imageURL || '',
    teacherName: s.teacherName || '',
    teacherId: s.teacherId || '',
    deleteConfirm: '',
  }
}

const { localData, submitForm } = useActionModal(props, emit, {
  getInitialData,
  mapSourceToForm
})

watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    fetchCategories()
    fetchTerms()
    fetchTeachers()
    if (localData.value.categoryId) fetchLevels()
    else levels.value = []
  }
})

const selectedTeacher = computed(() => {
  if (!localData.value.teacherId) return null
  return teachers.value.find((t) => (t.uid || t.id) === localData.value.teacherId)
})

const selectTeacher = (teacher) => {
  localData.value.teacherId = teacher.uid || teacher.id
  localData.value.teacherName = teacher.name || teacher.email || ''
  isTeacherDropdownOpen.value = false
  teacherSearchQuery.value = ''
}

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
  } catch (err) { console.error(err) }
}

const fetchLevels = async () => {
  if (!localData.value.categoryId) return
  try {
    const data = await courseService.getAllLevels(localData.value.categoryId)
    levels.value = Array.isArray(data) ? data : []
  } catch (err) { console.error(err) }
}

const fetchTerms = async () => {
  try {
    const data = await courseService.getAllTerms()
    terms.value = Array.isArray(data) ? data : []
  } catch (err) { console.error(err) }
}

const fetchTeachers = async () => {
  try {
    const data = await userService.getAllUsers()
    // Filter by role 'instructor' as per UserAuth setup
    teachers.value = Array.isArray(data) ? data.filter(u => u.role === 'instructor') : []
  } catch (err) { console.error(err) }
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
  } catch (err) { alert(err.message) }
}

const handleCreateLevel = async () => {
  if (!newLevelName.value.trim() || !localData.value.categoryId) return
  try {
    const result = await courseService.createLevel(localData.value.categoryId, { name: newLevelName.value.trim() })
    await fetchLevels()
    localData.value.levelId = result.id
    newLevelName.value = ''
  } catch (err) { alert(err.message) }
}

const handleCreateTerm = async () => {
  if (!newTermName.value.trim()) return
  try {
    const result = await courseService.createTerm({ name: newTermName.value.trim() })
    await fetchTerms()
    localData.value.termId = result.id
    newTermName.value = ''
  } catch (err) { alert(err.message) }
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
    localData.value.teacherId &&
    localData.value.schedule.timeslot
  )
})

const titlePlaceholder = computed(() => {
  const cat = categories.value.find(c => c.id === localData.value.categoryId)
  if (cat) return `e.g. ${cat.name} Level 1`
  return 'e.g. Ballet Level 1'
})

const handleSubmit = () => submitForm(isFormValid.value)
</script>

<style scoped>
@import '@/assets/styles/components/CustomDropdown.css';

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  padding: 4px 0;
}

.selected-teacher {
  display: flex;
  align-items: center;
  gap: 10px;
}

.form-group {
  margin-bottom: 12px;
}

.form-group label {
  display: block;
  font-size: 0.8rem;
  font-weight: 700;
  color: #64748b;
  margin-bottom: 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1.5px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.9rem;
  background: #f8fafc;
  outline: none;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  border-color: #00aeef;
  background: #fff;
  box-shadow: 0 0 0 3px rgba(0, 174, 239, 0.1);
}

.row-inputs {
  display: flex;
  gap: 10px;
}

.duration-input {
  display: flex;
  flex: 1;
  background: #f8fafc;
  border: 1.5px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
}

.duration-input input {
  border: none !important;
  background: transparent !important;
  padding: 8px !important;
  flex: 1;
}

.mins-label {
  padding: 0 10px;
  font-size: 0.7rem;
  font-weight: 600;
  color: #94a3b8;
  background: #f1f5f9;
  display: flex;
  align-items: center;
  border-left: 1.5px solid #e2e8f0;
}

.upload-container {
  padding: 12px;
  border: 1.5px dashed #e2e8f0;
  border-radius: 8px;
  background: #f8fafc;
  text-align: center;
}

.image-preview img {
  max-width: 100%;
  max-height: 100px;
  border-radius: 6px;
}

.remove-img {
  margin-top: 4px;
  font-size: 0.75rem;
  color: #ef4444;
  cursor: pointer;
  text-decoration: underline;
}

.category-field,
.dynamic-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.quick-add {
  display: flex;
  gap: 6px;
  margin-top: 2px;
}

.quick-add input {
  padding: 4px 8px !important;
  font-size: 0.8rem !important;
}

.quick-add button {
  padding: 4px 10px;
  background: #00aeef;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
}

.help-text-small {
  font-size: 0.7rem;
  color: #94a3b8;
  margin-top: 2px;
}

.alert-box {
  padding: 8px 12px;
  border-radius: 8px;
  margin-bottom: 12px;
  font-size: 0.85rem;
}

.alert-box.error {
  background: #fef2f2;
  color: #ef4444;
  border: 1px solid #fecaca;
}

.alert-box.success {
  background: #f0fdf4;
  color: #22c55e;
  border: 1px solid #bbf7d0;
}

.info-block {
  padding: 12px;
  border-radius: 8px;
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.info-block.danger {
  background: #fef2f2;
  border: 1px solid #fecaca;
}

.danger-text {
  color: #ef4444;
  font-weight: 700;
}
</style>

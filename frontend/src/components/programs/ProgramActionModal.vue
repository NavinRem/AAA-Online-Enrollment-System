<template>
  <AppModal :show="isOpen" maxWidth="640px" @close="$emit('close')">
    <template #header>
      <div class="modal-header-main">
        <h3>{{ modalTitle }}</h3>
        <div v-if="error" class="alert-box error stationary-alert">{{ error }}</div>
        <div v-if="success" class="alert-box success stationary-alert">{{ success }}</div>
      </div>
    </template>

    <form v-if="type === 'add' || type === 'edit'" class="form-grid" @submit.prevent="handleSubmit">
      <div class="form-group full-width">
        <label>Program Title <span class="required">*</span></label>
        <input type="text" v-model="localData.title" :placeholder="titlePlaceholder" required :disabled="isReadOnly" />
        <div v-if="titleValidation.warning" class="input-warning">
          {{ titleValidation.warning }}
        </div>
      </div>

      <div class="form-group">
        <label>Category <span class="required">*</span></label>
        <div class="category-field">
          <AppSelect
            v-model="localData.categoryId"
            :items="sortedCategories"
            placeholder="-- Select Category --"
            searchPlaceholder="Search category..."
            :disabled="isReadOnly"
            @change="onCategoryChange"
          />
          <div v-if="!isReadOnly" class="quick-add">
            <div class="inline-add-group">
              <input type="text" v-model="newCategoryName" placeholder="New category..." @keyup.enter="handleCreateCategory" />
              <button type="button" @click="handleCreateCategory" :disabled="!newCategoryName.trim()" class="btn-add-inline">Add</button>
            </div>
          </div>
        </div>
      </div>

      <div class="form-group">
        <label>Level <span class="required">*</span></label>
        <div class="dynamic-field">
          <AppSelect
            v-model="localData.levelId"
            :items="sortedLevels"
            placeholder="-- Select Level --"
            searchPlaceholder="Search level..."
            :disabled="isReadOnly"
          />
          <div v-if="!isReadOnly" class="quick-add">
            <div class="inline-add-group">
              <input type="text" v-model="newLevelName" placeholder="New level..." @keyup.enter="handleCreateLevel" />
              <button type="button" @click="handleCreateLevel" :disabled="!newLevelName.trim()" class="btn-add-inline">Add</button>
            </div>
          </div>
        </div>
      </div>

      <div class="form-group">
        <label>Academic Term <span class="required">*</span></label>
        <div class="dynamic-field">
          <AppSelect
            v-model="localData.termId"
            :items="sortedTerms"
            placeholder="-- Select Term --"
            searchPlaceholder="Search term..."
            :disabled="isReadOnly"
            @change="onTermChange"
          />
          <div v-if="!isReadOnly" class="quick-add-term">
            <div class="inline-add-group">
              <input type="text" v-model="newTermName" placeholder="New term..." @keyup.enter="handleCreateTerm" />
              <button type="button" @click="handleCreateTerm" :disabled="!newTermName.trim()" class="btn-add-inline">Add Term</button>
            </div>
          </div>
        </div>
      </div>

      <div class="form-group">
        <label>Program Price ($) <span class="required">*</span></label>
        <input type="number" v-model="localData.price" min="0" step="0.01" required placeholder="0.00" :disabled="isReadOnly" />
      </div>

      <div class="form-group">
        <label>Total Sessions <span class="required">*</span></label>
        <input type="number" v-model="localData.numberSessions" min="1" required :disabled="isReadOnly" />
        <p class="help-text-small" v-if="localData.numberSessions > 0">
          Avg. ${{ (localData.price / localData.numberSessions).toFixed(2) }} / session
        </p>
      </div>

      <div class="form-group full-width">
        <label>Program Period (Start - End) <span class="required">*</span></label>
        <div class="row-inputs">
          <input type="date" v-model="localData.startDate" required :disabled="isReadOnly" />
          <input type="date" v-model="localData.endDate" required :disabled="isReadOnly" />
        </div>
        <div v-if="dateValidation.warning" class="date-warning">
          <span class="icon">⚠️</span> {{ dateValidation.warning }}
        </div>
      </div>

      <div class="form-group">
        <label>Status <span class="required">*</span></label>
        <AppSelect
          v-model="localData.status"
          :items="[
            { id: 'Active', name: 'Active' },
            { id: 'Upcoming', name: 'Upcoming' },
            ...(type === 'edit' ? [{ id: 'Closed', name: 'Closed' }, { id: 'Archived', name: 'Archived' }] : [])
          ]"
          :searchable="false"
        />
        <p v-if="isReadOnly" class="archive-warning">Archived programs are read-only (except status).</p>
      </div>

      <div class="form-group full-width">
        <label>Weekly Schedule <span class="required">*</span></label>
        <div class="row-inputs">
          <AppSelect
            v-model="localData.schedule.day"
            :items="['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => ({ id: d, name: d }))"
            :searchable="false"
            :disabled="isReadOnly"
            style="width: 140px;"
          />
          <AppSelect
            v-model="localData.schedule.timeslot"
            :items="['08:30 - 10:00', '10:30 - 12:00', '13:30 - 15:00', '15:30 - 17:00', '17:30 - 19:00'].map(s => ({ id: s, name: s }))"
            placeholder="-- Select Time Slot --"
            :searchable="false"
            :disabled="isReadOnly"
            style="flex: 1;"
          />
        </div>
      </div>

      <div class="form-group full-width">
        <label>Teachers (Responsible for this Program) <span class="required">*</span></label>
        
        <!-- Display Selected Teachers as Tags -->
        <div v-if="localData.teachers && localData.teachers.length > 0" class="teacher-tags">
          <div v-for="t in localData.teachers" :key="t.id" class="teacher-tag">
            <img :src="t.profileURL || getImageUrl('profiles/avatar-parent')" />
            <span>{{ t.name }}</span>
            <button v-if="!isReadOnly" type="button" class="remove-btn" @click="removeTeacher(t.id)">&times;</button>
          </div>
        </div>

        <div v-if="!isReadOnly" class="custom-dropdown-container">
          <div class="custom-dropdown" :class="{ open: isTeacherDropdownOpen }">
            <div class="dropdown-header" @click="isTeacherDropdownOpen = !isTeacherDropdownOpen">
              <span class="placeholder">-- Add a teacher --</span>
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
                    v-for="t in unselectedTeachers"
                    :key="t.uid || t.id"
                    class="dropdown-item"
                    @click="addTeacher(t)"
                  >
                    <img
                      :src="t.profileURL || getImageUrl('profiles/avatar-parent')"
                      class="avatar-mini-circle"
                    />
                    <div class="item-info">
                      <span class="item-name">{{ t.name || t.email }}</span>
                    </div>
                    <button 
                      type="button" 
                      class="item-delete-btn" 
                      @click.stop="handleDeleteTeacher(t)"
                      title="Delete Teacher Account"
                    >
                      &times;
                    </button>
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
        <textarea v-model="localData.description" placeholder="What is this program about?" rows="2" :disabled="isReadOnly"></textarea>
      </div>

      <div class="form-group full-width" style="margin-bottom: 0;">
        <label>Program Photo (Optional)</label>
        <div class="upload-container">
          <div v-if="localData.imageURL" class="image-preview">
            <img :src="localData.imageURL" alt="Preview" />
            <div class="remove-img" @click="localData.imageURL = ''">Remove image</div>
          </div>
          <div v-if="!isReadOnly" class="upload-placeholder">
            <input type="file" @change="handleFileUpload" accept="image/*" id="file-upload" hidden />
            <label for="file-upload" class="upload-label">
              <span class="icon">📷</span>
              <span v-if="isUploading">Uploading...</span>
              <span v-else>Click to upload photo</span>
            </label>
          </div>
          <div v-else-if="!localData.imageURL" class="upload-placeholder disabled">
            No photo uploaded
          </div>
        </div>
      </div>
      <!-- Hidden submit for Enter key functionality -->
      <button type="submit" style="display: none;"></button>
    </form>

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
        type="submit"
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
import AppSelect from '@/components/common/ui/AppSelect.vue'
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

const categories = ref([])
const levels = ref([])
const terms = ref([])
const teachers = ref([])
const newCategoryName = ref('')
const newLevelName = ref('')
const newTermName = ref('')
const isUploading = ref(false)

const sortedCategories = computed(() => {
  return [...categories.value].sort((a, b) => (a.name || '').localeCompare(b.name || ''))
})

const sortedLevels = computed(() => {
  return [...levels.value].sort((a, b) => (a.name || '').localeCompare(b.name || ''))
})

const sortedTerms = computed(() => {
  return [...terms.value].sort((a, b) => (a.name || '').localeCompare(b.name || ''))
})

// Teacher Search Logic
const isTeacherDropdownOpen = ref(false)
const { searchQuery: teacherSearchQuery, searchResults: filteredTeachers } = useSearch(
  teachers,
  teacherSearchMapper,
)

const sortedTeachers = computed(() => {
  return [...filteredTeachers.value].sort((a, b) => (a.name || a.email || '').localeCompare(b.name || b.email || ''))
})

const getInitialData = () => ({
  title: '',
  categoryId: '',
  category: '',
  description: '',
  price: 180,
  numberSessions: 11,
  levelId: '',
  termId: '',
  status: 'Active',
  startDate: '',
  endDate: '', 
  schedule: { day: 'Monday', timeslot: '10:30 - 12:00' },
  imageURL: '',
  teachers: [],
  deleteConfirm: '',
})

const isReadOnly = computed(() => {
  return props.type === 'edit' && localData.value.status === 'Archived'
})

const mapSourceToForm = () => {
  if (props.type === 'add') return getInitialData()
  const s = props.program || {}
  
  // Find matched term for fallback dates
  const term = (terms.value || []).find(t => t.id === s.termId)

  return {
    title: s.title || s.name || '',
    categoryId: s.categoryId || '',
    category: s.category || '',
    description: s.description || '',
    price: s.price ?? 180,
    numberSessions: s.numberSessions || s.number_session || 11,
    levelId: s.levelId || '',
    termId: s.termId || '',
    status: s.status || 'Active',
    startDate: s.startDate || term?.startDate || '',
    endDate: s.endDate || term?.endDate || '',
    schedule: s.schedule || { day: 'Monday', timeslot: '10:30 - 12:00' },
    imageURL: s.imageURL || '',
    teachers: s.teachers || (s.teacherId ? [{ id: s.teacherId, name: s.teacherName }] : []),
    deleteConfirm: '',
  }
}

const { localData, submitForm } = useActionModal(props, emit, {
  getInitialData,
  mapSourceToForm
})

watch(
  [() => props.isOpen, () => props.program],
  async ([isOpen, program]) => {
    if (isOpen) {
      // 1. Initial sync from props
      localData.value = mapSourceToForm()
      
      // 2. Fetch all required options in parallel
      await Promise.all([
        fetchCategories(),
        fetchTerms(),
        fetchTeachers()
      ])
      
      // 3. Dependent fetches and fallback logic
      if (localData.value.categoryId) fetchLevels()
      else levels.value = []

      // If dates were missing, they might find a fallback now that terms are fetched
      if (!localData.value.startDate || !localData.value.endDate) {
        const reMapped = mapSourceToForm()
        if (!localData.value.startDate) localData.value.startDate = reMapped.startDate
        if (!localData.value.endDate) localData.value.endDate = reMapped.endDate
      }
    }
  },
  { immediate: true }
)

// Automatic Date Alignment & Suggestion
watch(
  [
    () => localData.value.startDate,
    () => localData.value.numberSessions,
    () => localData.value.schedule.day
  ],
  ([newStart, newSessions, newDay]) => {
    if (newStart && newSessions && newDay && !isReadOnly.value) {
      const startDateObj = new Date(newStart)
      const year = startDateObj.getFullYear()

      // Only proceed if the year is fully entered (avoiding partial inputs like "0026")
      if (isNaN(year) || year < 1000) return

      // 1. Align Start Date with the Schedule Day
      const alignedStart = findNextOccurrence(startDateObj, newDay)
      if (alignedStart !== newStart) {
        localData.value.startDate = alignedStart
        return // Next watcher tick will handle the rest
      }

      // 2. Proactively update end date to match the suggested date
      const suggested = calculateMinEndDate(new Date(alignedStart), newDay, newSessions)
      localData.value.endDate = suggested
    }
  }
)

const findNextOccurrence = (date, dayName) => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const targetDay = days.indexOf(dayName)
  const current = new Date(date)
  
  // Keep moving forward until we hit the target day
  while (current.getDay() !== targetDay) {
    current.setDate(current.getDate() + 1)
  }
  
  return current.toISOString().split('T')[0]
}

const unselectedTeachers = computed(() => {
  const selectedIds = (localData.value.teachers || []).map(t => t.id)
  return sortedTeachers.value.filter(t => !selectedIds.includes(t.uid || t.id))
})

const addTeacher = (t) => {
  if (!localData.value.teachers) localData.value.teachers = []
  localData.value.teachers.push({
    id: t.uid || t.id,
    name: t.name || t.email,
    profileURL: t.profileURL || ''
  })
  isTeacherDropdownOpen.value = false
  teacherSearchQuery.value = ''
}

const removeTeacher = (id) => {
  localData.value.teachers = localData.value.teachers.filter(t => t.id !== id)
}

const handleDeleteTeacher = async (teacher) => {
  const name = teacher.name || teacher.email
  if (!confirm(`Are you sure you want to PERMANENTLY delete the account for ${name}? This cannot be undone.`)) return
  
  try {
    // We don't use the component-level 'loading' for this minor action 
    // to avoid locking the whole modal, but we can if preferred.
    await userService.deleteUser(teacher.uid || teacher.id)
    await fetchTeachers() // Refresh the list
  } catch (err) {
    alert('Failed to delete teacher: ' + err.message)
  }
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

const onTermChange = () => {
  const term = terms.value.find(t => t.id === localData.value.termId)
  if (term && term.startDate && term.endDate) {
    localData.value.startDate = term.startDate
    localData.value.endDate = term.endDate
  }
}

const fetchTeachers = async () => {
  try {
    const data = await userService.getAllUsers()
    teachers.value = Array.isArray(data) 
      ? data.filter(u => ['teacher'].includes(u.role)) 
      : []
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
  if (!newTermName.value.trim() || !localData.value.startDate || !localData.value.endDate) {
    if (!localData.value.startDate || !localData.value.endDate) {
      alert('Please set program start and end dates first.')
    }
    return
  }
  try {
    const result = await courseService.createTerm({ 
      name: newTermName.value.trim(),
      startDate: localData.value.startDate,
      endDate: localData.value.endDate
    })
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
    localData.value.teachers?.length > 0 &&
    localData.value.startDate &&
    localData.value.endDate &&
    dateValidation.value.isValid &&
    titleValidation.value.isValid &&
    localData.value.schedule.timeslot
  )
})

const titlePlaceholder = computed(() => {
  const cat = categories.value.find(c => c.id === localData.value.categoryId)
  if (cat) return `e.g. ${cat.name} Level 1`
  return 'e.g. Ballet Level 1'
})

const dateValidation = computed(() => {
  if (!localData.value.startDate || !localData.value.endDate || !localData.value.schedule.day || !localData.value.numberSessions) {
    return { isValid: true, warning: '' }
  }

  const start = new Date(localData.value.startDate)
  const end = new Date(localData.value.endDate)
  const dayName = localData.value.schedule.day
  const sessions = localData.value.numberSessions

  const count = countOccurrences(start, end, dayName)
  if (count < sessions) {
    const minEnd = calculateMinEndDate(start, dayName, sessions)
    return { 
      isValid: false, 
      warning: `Need ${sessions} ${dayName}s, but current period only has ${count}. Suggested end date: ${minEnd}.`,
      suggestedEndDate: minEnd
    }
  }
  return { isValid: true, warning: '' }
})

const countOccurrences = (start, end, dayName) => {
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) return 0
  
  // Safety check: Don't process ranges larger than 2 years to prevent UI freezes
  const diffTime = Math.abs(end - start)
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  if (diffDays > 730) return 0 // Too large for a single program

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const targetDay = days.indexOf(dayName)
  let count = 0
  let current = new Date(start)
  while (current <= end) {
    if (current.getDay() === targetDay) count++
    current.setDate(current.getDate() + 1)
  }
  return count
}

const calculateMinEndDate = (start, dayName, sessions) => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const targetDay = days.indexOf(dayName)
  let current = new Date(start)
  let count = 0
  
  // Find first occurrence
  while (current.getDay() !== targetDay) {
    current.setDate(current.getDate() + 1)
  }
  
  // Add weeks for remaining sessions
  const remainingSessions = sessions - 1
  current.setDate(current.getDate() + (remainingSessions * 7))
  
  return current.toISOString().split('T')[0]
}

const titleValidation = computed(() => {
  if (!localData.value.title || !localData.value.categoryId) return { isValid: true, warning: '' }
  
  const category = categories.value.find(c => c.id === localData.value.categoryId)
  if (!category) return { isValid: true, warning: '' }

  const catName = category.name.toLowerCase()
  if (!localData.value.title.toLowerCase().includes(catName)) {
    return { 
      isValid: false, 
      warning: `The title should include the category name "${category.name}".` 
    }
  }
  return { isValid: true, warning: '' }
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
  margin-top: 4px;
}

.inline-add-group {
  display: flex;
  gap: 8px;
  background: white;
  padding: 4px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.02);
}

.inline-add-group input {
  border: none !important;
  background: transparent !important;
  padding: 6px 10px !important;
  font-size: 0.85rem !important;
  box-shadow: none !important;
  flex: 1;
}

.btn-add-inline {
  padding: 6px 16px;
  background: #00aeef;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.btn-add-inline:hover:not(:disabled) {
  background: #0096ce;
}

.item-delete-btn {
  margin-left: auto;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: none;
  background: transparent;
  color: #94a3b8;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  cursor: pointer;
  transition: all 0.2s;
  visibility: hidden;
  opacity: 0;
}

.dropdown-item:hover .item-delete-btn {
  visibility: visible;
  opacity: 1;
}

.item-delete-btn:hover {
  background: #fee2e2;
  color: #ef4444;
}

.dropdown-item:hover {
  background: #f1f5f9;
}

.btn-add-inline:disabled {
  background: #cbd5e1;
  cursor: not-allowed;
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
.teacher-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.teacher-tag {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #f1f5f9;
  padding: 4px 8px;
  border-radius: 20px;
  border: 1px solid #e2e8f0;
}

.teacher-tag img {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: cover;
}

.teacher-tag span {
  font-size: 0.85rem;
  color: #334155;
  font-weight: 500;
}

.remove-btn {
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  font-size: 1.2rem;
  line-height: 1;
  padding: 0 2px;
}

.remove-btn:hover {
  color: #ef4444;
}

.quick-add-term {
  margin-top: 4px;
}

.archive-warning {
  font-size: 0.75rem;
  color: #ef4444;
  font-weight: 600;
  margin-top: 4px;
}

.date-warning {
  margin-top: 8px;
  padding: 8px 12px;
  background: #fff7ed;
  border: 1px solid #ffedd5;
  border-radius: 6px;
  font-size: 0.8rem;
  color: #9a3412;
  display: flex;
  align-items: center;
  gap: 8px;
  line-height: 1.4;
}

.date-warning .icon {
  font-size: 1rem;
}

.btn-fix {
  margin-left: auto;
  padding: 4px 10px;
  background: #f97316;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}

.btn-fix:hover {
  background: #ea580c;
}

.stationary-alert {
  margin: 12px 0 0 0;
  width: 100%;
}

.input-warning {
  font-size: 0.75rem;
  color: #f59e0b;
  font-weight: 500;
  margin-top: 4px;
}

.modal-header-main {
  width: 100%;
}
</style>

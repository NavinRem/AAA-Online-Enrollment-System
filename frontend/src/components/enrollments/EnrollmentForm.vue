<script setup>
import { ref, computed, toRef } from 'vue'
import AppButton from '@/components/common/ui/AppButton.vue'
import { useSearch, parentSearchMapper, studentSearchMapper } from '@/composables/useSearch'
import { getImageUrl } from '@/utils/assetHelper'

const props = defineProps({
  isOpen: { type: Boolean, required: true },
  loading: { type: Boolean, default: false },
  parents: { type: Array, default: () => [] },
  students: { type: Array, default: () => [] },
  courses: { type: Array, default: () => [] },
  sessions: { type: Array, default: () => [] },
  error: { type: String, default: '' },
  success: { type: String, default: '' },
})

const emit = defineEmits(['close', 'submit', 'course-change'])

const formData = ref({
  parentId: '',
  studentId: '',
  courseId: '',
  sessionId: '',
})

const isParentDropdownOpen = ref(false)
const { searchQuery: parentSearchQuery, searchResults: filteredParents } = useSearch(
  toRef(props, 'parents'),
  parentSearchMapper,
)

const availableStudents = computed(() => {
  if (!formData.value.parentId) return []
  return props.students.filter(
    (s) => s.parentId === formData.value.parentId || s.parent_id === formData.value.parentId,
  )
})

const isStudentDropdownOpen = ref(false)
const { searchQuery: studentSearchQuery, searchResults: filteredStudentsList } = useSearch(
  availableStudents,
  studentSearchMapper,
)

const selectedParent = computed(() => {
  if (!formData.value.parentId) return null
  return props.parents.find((p) => (p.uid || p.id) === formData.value.parentId)
})

const selectParent = (uid) => {
  formData.value.parentId = uid
  formData.value.studentId = ''
  isParentDropdownOpen.value = false
}

const selectStudent = (student) => {
  formData.value.studentId = student.id || student.uid
  isStudentDropdownOpen.value = false
}

const selectedStudent = computed(() => {
  if (!formData.value.studentId) return null
  return props.students.find((s) => (s.id || s.uid) === formData.value.studentId)
})

const selectedCoursePrice = computed(() => {
  const c = props.courses.find((c) => c.id === formData.value.courseId)
  return c ? c.price || 180 : 0
})

const handleCourseChange = () => {
  formData.value.sessionId = ''
  emit('course-change', formData.value.courseId)
}

const handleSubmit = () => {
  emit('submit', { ...formData.value, amount: selectedCoursePrice.value })
}
</script>

<template>
  <transition name="modal-fade">
    <div v-if="isOpen" class="modal-overlay" @click.self="$emit('close')">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Create New Enrollment</h3>
          <button class="close-btn" @click="$emit('close')">×</button>
        </div>
        <div class="modal-body">
          <transition name="toast-fade">
            <div v-if="error" class="alert-box error">
              {{ error }}
            </div>
          </transition>
          <transition name="toast-fade">
            <div v-if="success" class="alert-box success">
              {{ success }}
            </div>
          </transition>

          <div class="form-grid">
            <div class="form-group custom-dropdown-container">
              <label>Select Parent / Guardian</label>
              <div class="custom-dropdown" :class="{ open: isParentDropdownOpen }">
                <div class="dropdown-header" @click="isParentDropdownOpen = !isParentDropdownOpen">
                  <template v-if="selectedParent">
                    <div class="selected-parent">
                      <img
                        :src="selectedParent.profileURL || getImageUrl('profiles/avatar-parent')"
                        class="avatar-mini-circle"
                      />
                      <span>{{ selectedParent.name || selectedParent.email }}</span>
                    </div>
                  </template>
                  <template v-else>
                    <span class="placeholder">Choose a parent</span>
                  </template>
                  <span class="chevron" :class="{ up: isParentDropdownOpen }"></span>
                </div>
                <div class="dropdown-menu" v-if="isParentDropdownOpen">
                  <div class="dropdown-search">
                    <input
                      type="text"
                      v-model="parentSearchQuery"
                      placeholder="Search name or email..."
                      autofocus
                    />
                  </div>
                  <ul class="dropdown-list">
                    <li
                      v-for="p in filteredParents"
                      :key="p.uid || p.id"
                      class="dropdown-item"
                      :class="{ active: formData.parentId === (p.uid || p.id) }"
                      @click="selectParent(p.uid || p.id)"
                    >
                      <img
                        :src="p.profileURL || getImageUrl('profiles/avatar-parent')"
                        class="avatar-mini-circle"
                      />
                      <span class="item-name">{{ p.name || p.email }}</span>
                    </li>
                    <li v-if="filteredParents.length === 0" class="dropdown-item no-results">
                      No matches found.
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div class="form-group custom-dropdown-container">
              <label>Select Student</label>
              <div class="custom-dropdown" :class="{ open: isStudentDropdownOpen, disabled: !formData.parentId }">
                <div class="dropdown-header" @click="formData.parentId && (isStudentDropdownOpen = !isStudentDropdownOpen)">
                  <template v-if="selectedStudent">
                    <div class="selected-item">
                      <img
                        :src="selectedStudent.profileURL || getImageUrl('profiles/avatar-student')"
                        class="avatar-mini-circle"
                      />
                      <span>{{ selectedStudent.fullName || selectedStudent.name }}</span>
                    </div>
                  </template>
                  <template v-else>
                    <span class="placeholder">{{ !formData.parentId ? 'Select parent first' : 'Choose a student' }}</span>
                  </template>
                  <span class="chevron" :class="{ up: isStudentDropdownOpen }"></span>
                </div>
                
                <div class="dropdown-menu" v-if="isStudentDropdownOpen">
                  <div class="dropdown-search">
                    <input
                      type="text"
                      v-model="studentSearchQuery"
                      placeholder="Search student name..."
                      @click.stop
                      autofocus
                    />
                  </div>
                  <ul class="dropdown-list">
                    <li
                      v-for="s in filteredStudentsList"
                      :key="s.id || s.uid"
                      class="dropdown-item"
                      :class="{ active: formData.studentId === (s.id || s.uid) }"
                      @click="selectStudent(s)"
                    >
                      <img
                        :src="s.profileURL || getImageUrl('profiles/avatar-student')"
                        class="avatar-mini-circle"
                      />
                      <span class="item-name">{{ s.fullName || s.name }}</span>
                    </li>
                    <li v-if="filteredStudentsList.length === 0" class="dropdown-item no-results">
                      No students found.
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div class="form-group">
              <label>Select Course</label>
              <select v-model="formData.courseId" @change="handleCourseChange">
                <option value="" disabled>Choose a course</option>
                <option v-for="c in courses" :key="c.id" :value="c.id">
                  {{ c.title || c.name }}
                </option>
              </select>
            </div>

            <div class="form-group">
              <label>Select Session</label>
              <select v-model="formData.sessionId" :disabled="!formData.courseId || sessions.length === 0">
                <option value="" disabled>Choose a session time</option>
                <option v-for="s in sessions" :key="s.id" :value="s.id">
                  {{ s.schedule?.day || 'TBD' }} @ {{ s.schedule?.timeslot || 'TBD' }} 
                  ({{ s.numStudent || 0 }}/{{ s.capacity || 20 }} enrolled)
                </option>
              </select>
            </div>
          </div>

          <div v-if="selectedCoursePrice && formData.courseId" class="price-preview">
            <span class="price-label">Amount to be paid</span>
            <strong class="price-value">${{ selectedCoursePrice }}</strong>
          </div>
        </div>
        <div class="modal-footer">
          <AppButton variant="cancel" @click="$emit('close')">Cancel</AppButton>
          <AppButton
            variant="primary"
            @click="handleSubmit"
            :disabled="!formData.parentId || !formData.studentId || !formData.courseId || !formData.sessionId || loading"
            :loading="loading"
          >
            Confirm Enrollment
          </AppButton>
        </div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
/* Inherit styles or add common ones */
.modal-overlay {
  position: fixed;
  top: 0; left: 0;
  width: 100%; height: 100%;
  background: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
}
.modal-content {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 600px;
  padding: 24px;
}
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #475569;
}

.form-group select,
.form-group input {
  padding: 10px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.95rem;
  background-color: #f8fafc;
  outline: none;
  transition: all 0.2s;
}

.form-group select:focus,
.form-group input:focus {
  border-color: #00aeef;
  background-color: #ffffff;
  box-shadow: 0 0 0 3px rgba(0, 174, 239, 0.1);
}

.price-preview {
  margin-top: 20px;
  padding: 16px;
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.price-label {
  color: #0369a1;
  font-weight: 600;
}

.price-value {
  font-size: 1.25rem;
  color: #0c4a6e;
}


/* Animations */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-active .modal-content {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.modal-fade-enter-from .modal-content {
  transform: scale(0.9) translateY(20px);
}
</style>

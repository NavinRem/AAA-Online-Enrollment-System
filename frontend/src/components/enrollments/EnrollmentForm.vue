<script setup>
import { ref, computed } from 'vue'
import AppButton from '@/components/common/ui/AppButton.vue'

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

const parentSearchQuery = ref('')
const isParentDropdownOpen = ref(false)

const filteredParents = computed(() => {
  if (!parentSearchQuery.value) return props.parents
  const q = parentSearchQuery.value.toLowerCase()
  return props.parents.filter(
    (p) => (p.name || '').toLowerCase().includes(q) || (p.email || '').toLowerCase().includes(q),
  )
})

const selectedParentLabel = computed(() => {
  if (!formData.value.parentId) return 'Choose a parent'
  const p = props.parents.find((p) => (p.uid || p.id) === formData.value.parentId)
  return p ? p.name || p.email : 'Choose a parent'
})

const selectParent = (uid) => {
  formData.value.parentId = uid
  formData.value.studentId = ''
  isParentDropdownOpen.value = false
}

const availableStudents = computed(() => {
  if (!formData.value.parentId) return []
  return props.students.filter(
    (s) => s.parentId === formData.value.parentId || s.parent_id === formData.value.parentId,
  )
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
              <span class="icon">⚠️</span> {{ error }}
            </div>
          </transition>
          <transition name="toast-fade">
            <div v-if="success" class="alert-box success">
              <span class="icon">✅</span> {{ success }}
            </div>
          </transition>

          <div class="form-grid">
            <div class="form-group custom-dropdown-container">
              <label>Select Parent / Guardian</label>
              <div class="custom-dropdown" :class="{ open: isParentDropdownOpen }">
                <div class="dropdown-header" @click="isParentDropdownOpen = !isParentDropdownOpen">
                  {{ selectedParentLabel }}
                  <span class="chevron"></span>
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
                      {{ p.name || p.email }}
                    </li>
                    <li v-if="filteredParents.length === 0" class="dropdown-item no-results">
                      No matches found.
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div class="form-group">
              <label>Select Student</label>
              <select v-model="formData.studentId" :disabled="!formData.parentId">
                <option value="" disabled>Choose a student</option>
                <option v-for="s in availableStudents" :key="s.id" :value="s.id">
                  {{ s.fullName || s.fullname || s.name }}
                </option>
              </select>
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
.price-preview {
  margin-top: 20px;
  padding: 16px;
  background: #f8fafc;
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
/* ... etc */
</style>

<template>
  <AppModal :show="isOpen" :title="modalTitle" variant="action" @close="$emit('close')">
    <div v-if="error" class="alert-box error">{{ error }}</div>
    <div v-if="success" class="alert-box success">{{ success }}</div>

    <div class="identity-card" v-if="student || enrollment">
      <span class="label">{{ type === 'enrollment-override' || type === 'enrollment-delete' ? 'enrollment' : 'student' }}</span>
      <strong class="name">{{
        enrollment
          ? enrollment.courseTitle
          : student?.name || student?.fullName || student?.fullname || student?.email || 'Unknown'
      }}</strong>
    </div>

    <form v-if="type === 'edit' || type === 'override' || type === 'enrollment-override'" @submit.prevent="handleSubmit">
      <div v-if="type === 'edit'" class="form-grid">
        <div class="form-group full-width" v-if="selectableParents && selectableParents.length > 0">
          <label>Update Parent / Guardian <span class="required">*</span></label>
          <div class="custom-dropdown-container">
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
                  <span class="placeholder">-- Choose a parent/guardian --</span>
                </template>
                <span class="chevron" :class="{ up: isParentDropdownOpen }"></span>
              </div>
              
              <div class="dropdown-menu" v-if="isParentDropdownOpen">
                <div class="dropdown-search">
                  <input
                    type="text"
                    v-model="parentSearchQuery"
                    placeholder="Search name or email..."
                    @click.stop
                    autofocus
                  />
                </div>
                <ul class="dropdown-list">
                  <li
                    v-for="p in filteredParents"
                    :key="p.uid || p.id"
                    class="dropdown-item"
                    :class="{ active: localData.parentId === (p.uid || p.id) }"
                    @click="selectParent(p)"
                  >
                    <img
                      :src="p.profileURL || getImageUrl('profiles/avatar-parent')"
                      class="avatar-mini-circle"
                    />
                    <div class="item-info">
                      <span class="item-name">{{ p.name || p.email }}</span>
                    </div>
                  </li>
                  <li v-if="filteredParents.length === 0" class="dropdown-item no-results">
                    No matches found.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div class="form-group">
          <label>Full Name</label>
          <span class="original-value" v-if="originalData.name">Original: {{ originalData.name }}</span>
          <input type="text" v-model="localData.name" placeholder="Enter student full name" />
        </div>

        <div class="form-group">
          <label>Date of Birth</label>
          <span class="original-value" v-if="originalData.dob">Original: {{ originalData.dob }}</span>
          <input type="date" v-model="localData.dob" />
        </div>

        <div class="form-group full-width">
          <label>Medical Notes / Allergies</label>
          <span class="original-value" v-if="originalData.medical_note">Original: {{ originalData.medical_note }}</span>
          <textarea
            v-model="localData.medical_note"
            placeholder="e.g. Nut allergy, Asthma, or 'None'"
            rows="3"
          ></textarea>
          <!-- Adding preset chips for admin convenience -->
          <div class="preset-chips">
            <button
              type="button"
              class="preset-chip"
              :class="{ active: isPresetActive('medical_note', 'None') }"
              @click="togglePreset('medical_note', 'None')"
            >
              None
            </button>
            <button
              type="button"
              class="preset-chip"
              :class="{ active: isPresetActive('medical_note', 'G6PD Deficiency') }"
              @click="togglePreset('medical_note', 'G6PD Deficiency')"
            >
              G6PD
            </button>
            <button
              type="button"
              class="preset-chip"
              :class="{ active: isPresetActive('medical_note', 'ADHD') }"
              @click="togglePreset('medical_note', 'ADHD')"
            >
              ADHD
            </button>
            <button
              type="button"
              class="preset-chip"
              :class="{ active: isPresetActive('medical_note', 'Dyslexia') }"
              @click="togglePreset('medical_note', 'Dyslexia')"
            >
              Dyslexia
            </button>
            <button
              type="button"
              class="preset-chip"
              :class="{ active: isPresetActive('medical_note', 'Asthma') }"
              @click="togglePreset('medical_note', 'Asthma')"
            >
              Asthma
            </button>
          </div>
        </div>

        <div class="form-group full-width">
          <label>Update Status</label>
          <span class="original-value" v-if="originalData.status">Original: {{ originalData.status }}</span>
          <select v-model="localData.status" class="form-select">
            <option value="Studying">Studying (Active)</option>
            <option value="Suspended">Suspended (Paused)</option>
            <option value="Graduated">Graduated (Finished)</option>
            <option value="Stopped">Stopped (Dropped Out)</option>
          </select>
          <p class="help-text">
            Ensure you have parent/guardian authorization before suspending or stopping a child's
            academic progress.
          </p>
        </div>

        <div class="form-group full-width">
          <AvatarSelector v-model="localData.profileURL" type="student" :uid="student?.id || enrollment?.student_id" />
        </div>
      </div>

      <!-- Manual Status Override Form (Student or Enrollment) -->
      <div v-if="type === 'override' || type === 'enrollment-override'" class="form-grid">
        <div class="form-group full-width">
          <div class="info-block warning">
            <div class="icon">⚠️</div>
            <div class="text">
              <strong
                >Manual
                {{ type === 'enrollment-override' ? 'Enrollment' : 'Status' }} Override</strong
              >
              <p>
                This will manually force a status that ignores the automatic system calculations.
                Useful for specific parent requests or administrative pauses.
              </p>
            </div>
          </div>
        </div>

        <div class="form-group full-width">
          <label>Set Manual Status <span class="required">*</span></label>
          <span class="original-value" v-if="originalData.status">Current: {{ originalData.status }}</span>
          <select v-model="localData.status" class="form-select" required>
            <option disabled value="">-- Select Status --</option>
            <option value="Suspended">Suspended (Paused)</option>
            <option value="Stopped">Stopped (Dropped Out)</option>
          </select>
        </div>

        <div class="form-group full-width">
          <label>Reason Category <span class="required">*</span></label>
          <span class="original-value" v-if="originalData.overrideReason">Current: {{ originalData.overrideReason }}</span>
          <select v-model="localData.overrideReason" class="form-select" required>
            <option disabled value="">-- Select Reason --</option>
            <option value="Parent Request">Parent Request</option>
            <option value="Health Issue">Health Issue</option>
            <option value="Moving House">Relocation / Moving</option>
            <option value="Financial">Financial Reasons</option>
            <option value="Schedule Conflict">Schedule Conflict</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div class="form-group full-width">
          <label>Administrative Remarks <span class="required">*</span></label>
          <span class="original-value" v-if="originalData.overrideRemark">Current: {{ originalData.overrideRemark }}</span>
          <textarea
            v-model="localData.overrideRemark"
            placeholder="Enter detailed reason for record keeping... (Required)"
            rows="4"
            required
          ></textarea>
        </div>
      </div>
      <!-- Hidden submit for Enter key functionality -->
      <button type="submit" style="display: none;"></button>
    </form>

    <template #footer>
      <AppButton variant="cancel" @click="$emit('close')">Cancel</AppButton>
      <AppButton
        :variant="type === 'delete' || type === 'enrollment-delete' ? 'danger' : 'primary'"
        type="submit"
        @click="handleSubmit"
        :loading="loading"
        :disabled="loading || !isFormValid"
      >
        Confirm Action
      </AppButton>
    </template>
  </AppModal>
</template>

<script setup>
import { computed, ref, toRef } from 'vue'
import AppModal from '@/components/common/ui/AppModal.vue'
import AppButton from '@/components/common/ui/AppButton.vue'
import { useActionModal } from '@/composables/useActionModal'
import { useSearch, parentSearchMapper } from '@/composables/useSearch'
import AvatarSelector from '@/components/common/ui/AvatarSelector.vue'
import { getImageUrl } from '@/utils/assetHelper'

const props = defineProps({
  isOpen: Boolean,
  type: String, // 'edit', 'delete', 'override', 'enrollment-override'
  student: Object,
  enrollment: Object,
  selectableParents: { type: Array, default: () => [] },
  loading: Boolean,
  error: String,
  success: String,
})

const emit = defineEmits(['close', 'submit'])

const getInitialData = () => ({
  parentId: '',
  name: '',
  dob: '',
  profileURL: '',
  medical_note: 'None',
  status: '',
  deleteConfirm: '',
  overrideReason: '',
  overrideRemark: '',
})

const mapSourceToForm = () => {
  const source = props.enrollment || props.student || {}
  return {
    parentId: source.parentId || source.parent_id || '',
    name: source.name || source.fullName || source.fullname || '',
    dob: source.dob || '',
    profileURL: source.profileURL || '',
    medical_note: source.medical_note || (source.medicalNotes || source.medical_note || 'None'),
    status:
      source.status ||
      (props.type === 'enrollment-override'
        ? props.enrollment?.displayStatus || 'Studying'
        : 'Studying'),
    deleteConfirm: '',
    overrideReason:
      source.overrideReason ||
      (props.type === 'enrollment-override' ? props.enrollment?.overrideReason || '' : ''),
    overrideRemark:
      source.overrideRemark ||
      (props.type === 'enrollment-override' ? props.enrollment?.overrideRemark || '' : ''),
  }
}

const { localData, originalData, submitForm } = useActionModal(props, emit, {
  getInitialData,
  mapSourceToForm,
})

// Parent Search Logic
const isParentDropdownOpen = ref(false)
const { searchQuery: parentSearchQuery, searchResults: filteredParents } = useSearch(
  toRef(props, 'selectableParents'),
  parentSearchMapper,
)

const selectedParent = computed(() => {
  if (!localData.value.parentId) return null
  return props.selectableParents.find((p) => (p.uid || p.id) === localData.value.parentId)
})

const selectParent = (parent) => {
  localData.value.parentId = parent.uid || parent.id
  isParentDropdownOpen.value = false
  parentSearchQuery.value = ''
}

const modalTitle = computed(() => {
  const titles = {
    edit: 'Edit Student Profile',
    delete: 'Delete Student Record',
    override: 'Manual Status Override',
    'enrollment-override': 'Manual Enrollment Override',
    'enrollment-delete': 'Delete Enrollment Record',
  }
  return titles[props.type] || 'Student Action'
})

const isFormValid = computed(() => {
  if (props.type === 'edit') {
    return localData.value.name.trim() && localData.value.dob && localData.value.parentId
  }
  if (props.type === 'override' || props.type === 'enrollment-override') {
    return (
      localData.value.status &&
      localData.value.overrideReason &&
      localData.value.overrideRemark.trim().length > 0
    )
  }
  if (props.type === 'delete' || props.type === 'enrollment-delete') {
    return localData.value.deleteConfirm === 'DELETE'
  }
  return true
})

const handleSubmit = () => submitForm(isFormValid.value)

// Preset Management
const togglePreset = (field, chipValue) => {
  const currentText = localData.value[field] || ''
  let values = currentText
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean)

  if (values.includes(chipValue)) {
    values = values.filter((v) => v !== chipValue)
  } else {
    if (chipValue === 'None') {
      values = ['None']
    } else {
      values = values.filter((v) => v !== 'None')
      values.push(chipValue)
    }
  }
  localData.value[field] = values.join(', ')
}

const isPresetActive = (field, chipValue) => {
  const currentText = localData.value[field] || ''
  const values = currentText
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean)
  return values.includes(chipValue)
}
</script>

<style scoped>
.help-text {
  font-size: 0.85rem;
  color: #64748b;
  margin-top: 8px;
  line-height: 1.4;
}

.original-value {
  display: block;
  font-size: 0.75rem;
  color: #94a3b8;
  margin-top: -4px;
  margin-bottom: 4px;
  font-style: italic;
}

.original-value.changed {
  color: #00aeef;
  font-weight: 600;
}

.danger-text {
  color: #ef4444;
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

.info-block.warning {
  background: #fffbeb;
  border: 1px solid #fef3c7;
}

.info-block .icon {
  font-size: 1.5rem;
}

.info-block .text strong {
  display: block;
  margin-bottom: 4px;
  color: #1a1a1a;
}

.info-block .text p {
  margin: 0;
  font-size: 0.9rem;
  color: #64748b;
  line-height: 1.5;
}


.form-select {
  display: none;
}

/* Preset Chips */
.preset-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
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
  border-color: #cbd5e1;
}

.preset-chip.active {
  background: #eff6ff;
  border-color: #00aeef;
  color: #00aeef;
  font-weight: 600;
}
</style>

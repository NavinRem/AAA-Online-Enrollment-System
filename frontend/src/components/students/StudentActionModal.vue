<template>
  <AppModal :show="isOpen" :title="modalTitle" variant="action" @close="$emit('close')">
    <div v-if="error" class="error-banner">{{ error }}</div>
    <div v-if="success" class="success-banner">{{ success }}</div>

    <div class="target-summary" v-if="student || enrollment">
      Executing action on {{ type === 'enrollment-override' ? 'enrollment' : 'student' }}:
      <strong>{{
        enrollment
          ? enrollment.courseTitle
          : student?.name || student?.fullName || student?.fullname || student?.email || 'Unknown'
      }}</strong>
    </div>

    <div v-if="type === 'edit'" class="form-grid">
      <div class="form-group full-width" v-if="selectableParents && selectableParents.length > 0">
        <label>Update Parent / Guardian <span class="required">*</span></label>
        <select v-model="localData.parentId" required class="form-select">
          <option disabled value="">-- Choose a parent/guardian --</option>
          <option v-for="p in selectableParents" :key="p.uid || p.id" :value="p.uid || p.id">
            {{ p.name || p.email }} ({{ p.phone || 'No phone' }})
          </option>
        </select>
      </div>

      <div class="form-group full-width">
        <label>Full Name</label>
        <span class="original-value" v-if="originalData.name">Original: {{ originalData.name }}</span>
        <input type="text" v-model="localData.name" placeholder="Enter student full name" />
      </div>

      <div class="form-group full-width">
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
    </div>

    <!-- Delete Form (Student or Enrollment) -->
    <div v-if="type === 'delete' || type === 'enrollment-delete'" class="form-group full-width">
      <div class="info-block danger">
        <div class="icon">🛑</div>
        <div class="text">
          <strong v-if="type === 'delete'">Critical Permanent Action</strong>
          <strong v-else>Caution: Destructive Action</strong>
          <p v-if="type === 'delete'">
            Deleting a student's profile removes their record and all historical class progression
            entirely. It can never be recovered. This should only be used for accidental duplicate
            registrations or data cleanups.
          </p>
          <p v-else>
            Deleting an academic record is a destructive action. It can affect the student's future
            academic history and progress tracking. This action cannot be undone.
          </p>
        </div>
      </div>
      <label>To confirm, type <strong class="danger-text">DELETE</strong> below</label>
      <input type="text" v-model="localData.deleteConfirm" placeholder="Type DELETE" />
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

    <template #footer>
      <AppButton variant="cancel" @click="$emit('close')">Cancel</AppButton>
      <AppButton
        :variant="type === 'delete' || type === 'enrollment-delete' ? 'danger' : 'primary'"
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
import { ref, watch, computed } from 'vue'
import AppModal from '@/components/common/ui/AppModal/AppModal.vue'
import AppButton from '@/components/common/ui/AppButton/AppButton.vue'

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

const localData = ref({
  parentId: '',
  name: '',
  dob: '',
  medical_note: 'None',
  status: '',
  deleteConfirm: '',
  overrideReason: '',
  overrideRemark: '',
})

const originalData = ref({
  parentId: '',
  name: '',
  dob: '',
  medical_note: '',
  status: '',
  overrideReason: '',
  overrideRemark: '',
})

// Sync local data with prop when modal opens
watch(
  () => props.isOpen,
  (newVal) => {
    if (newVal) {
      const source = props.enrollment || props.student || {}
      const initial = {
        parentId: source.parentId || source.parent_id || '',
        name: source.name || source.fullName || source.fullname || '',
        dob: source.dob || '',
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
      localData.value = { ...initial }
      originalData.value = { ...initial }
    }
  },
)

const modalTitle = computed(() => {
  if (props.type === 'edit') return 'Edit Student Profile'
  if (props.type === 'delete') return 'Delete Student Record'
  if (props.type === 'override') return 'Manual Status Override'
  if (props.type === 'enrollment-override') return 'Manual Enrollment Override'
  if (props.type === 'enrollment-delete') return 'Delete Enrollment Record'
  return 'Student Action'
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

const handleSubmit = () => {
  if (!isFormValid.value) return
  emit('submit', { ...localData.value })
}

const togglePreset = (field, chipValue) => {
  const currentText = localData.value[field] || ''
  let values = currentText
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean)

  if (values.includes(chipValue)) {
    values = values.filter((v) => v !== chipValue)
  } else {
    // If 'None' is picked, clear others. If others picked, remove 'None'.
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
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.95rem;
  background-color: #f8fafc;
  outline: none;
  transition: all 0.2s;
}

.form-select:focus {
  border-color: #00aeef;
  background-color: #ffffff;
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

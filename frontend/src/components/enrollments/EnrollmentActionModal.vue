<template>
  <AppModal :show="isOpen" :title="(type ? type.charAt(0).toUpperCase() + type.slice(1) : '') + ' Enrollment'"
    variant="action" @close="$emit('close')" :icon="getActionIcon(type)">

    <!-- Content for Pay Action -->
    <div v-if="type === 'pay'" class="action-pay-container">
      <div class="enrollment-brief-card" v-if="enrollmentSummary">
        <div class="brief-grid">
          <div class="brief-column">
            <span class="brief-label">Parent / Guardian</span>
            <div class="brief-user">
              <img :src="enrollmentSummary.parentAvatar" class="avatar-mini-enrollment" />
              <span class="brief-value">{{ enrollmentSummary.parentName }}</span>
            </div>
          </div>
          <div class="brief-column">
            <span class="brief-label">Student</span>
            <div class="brief-user">
              <img :src="enrollmentSummary.studentAvatar" class="avatar-mini-enrollment" />
              <span class="brief-value">{{ enrollmentSummary.studentName }}</span>
            </div>
          </div>
          <div class="brief-column">
            <span class="brief-label">Program</span>
            <div class="brief-user">
              <img :src="enrollmentSummary.programAvatar" class="avatar-mini-enrollment" />
              <span class="brief-value">{{ enrollmentSummary.programTitle }}</span>
            </div>
          </div>
          <div class="brief-column">
            <span class="brief-label">Session</span>
            <div class="brief-session">
              <div class="session-display-row">
                <div class="session-day-text"><strong>{{ enrollmentSummary.sessionDay }}</strong></div>
                <div class="session-time-text">{{ enrollmentSummary.sessionTime }}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="tuition-panel-modern">
          <div class="price-info-enrollment">
            <div class="price-header-row">
              <span class="price-label-enrollment">Tuition Amount</span>
            </div>
            <div class="price-status-row">
              <StatusBadge :status="enrollmentSummary.mode" />
              <StatusBadge :status="enrollmentSummary.status" />
              <span v-if="enrollmentSummary.hasDiscount" class="discount-note-mini">{{ enrollmentSummary.discountText
              }}</span>
            </div>
          </div>
          <div class="price-amount-large">${{ formatPrice(enrollmentSummary.amount) }}</div>
        </div>
      </div>

      <AppAlert type="warning" :customStyle="{ marginTop: '10px', marginBottom: '0px' }">
        <div style="display: flex; flex-direction: column; gap: 4px;">
          <strong style="font-size: 0.95rem;">No-Refund Policy</strong>
          <span style="font-size: 0.85rem; opacity: 0.9; line-height: 1.2;">
            Once payment is confirmed, enrollments are non-refundable. Please verify all details before proceeding.
          </span>
        </div>
      </AppAlert>

      <div class="form-group" style="margin-top: 20px;">
        <label>Payment Method</label>
        <div class="method-selector">
          <button type="button" class="method-btn" :class="{ active: localData.paymentMethod === 'online' }"
            @click="localData.paymentMethod = 'online'">
            <div class="method-icon-box">
              <img :src="getActionIcon('pay')" />
            </div>
            <span>Online / Transfer</span>
          </button>
          <button type="button" class="method-btn" :class="{ active: localData.paymentMethod === 'cash' }"
            @click="localData.paymentMethod = 'cash'">
            <div class="method-icon-box">
              <img :src="getIconUrl('navigation/dollar-minimal')" />
            </div>
            <span>Cash Payment</span>
          </button>
        </div>
      </div>

      <div class="form-group" style="margin-top: 16px;">
        <label>Payment Remark (Internal Note)</label>
        <textarea v-model="localData.remark" placeholder="Add any notes about this payment..." class="standard-input"
          style="height: 80px; resize: none;"></textarea>
      </div>

      <div v-if="localData.paymentMethod === 'online'" class="online-payment-details">
        <div class="form-grid-mini">
          <div class="form-group">
            <label>Bank Name</label>
            <select v-model="localData.bankName" class="standard-input">
              <option value="">Select Bank</option>
              <option value="ABA">ABA Bank</option>
              <option value="Wing">Wing Bank</option>
              <option value="ACLEDA">ACLEDA Bank</option>
              <option value="Sathapana">Sathapana Bank</option>
              <option value="Canadia">Canadia Bank</option>
              <option value="Other">Other Bank / Transfer</option>
            </select>
          </div>
          <div class="form-group">
            <label>Transaction ID</label>
            <input type="text" v-model="localData.proof" placeholder="e.g. 123456789" class="standard-input" />
          </div>
        </div>

        <div class="form-group" style="margin-top: 16px;">
          <label>Payment Proof (Screenshot / Photo) <span
              style="font-weight: normal; opacity: 0.7; font-size: 0.8rem;">(Optional)</span></label>
          <div class="upload-zone-mini" :class="{ 'has-file': localData.selectedFile }">
            <input type="file" @change="handleFileChange" accept="image/*" class="file-input-hidden"
              id="proof-upload" />
            <label for="proof-upload" class="upload-label-mini">
              <div v-if="!localData.proofPreview" class="upload-placeholder">
                <span class="icon">📷</span>
                <span>Upload Proof</span>
              </div>
              <div v-else class="upload-preview-container">
                <img :src="localData.proofPreview" class="upload-preview" />
                <div class="upload-overlay">
                  <span>Change Photo</span>
                </div>
              </div>
            </label>
          </div>
        </div>
      </div>

      <div v-else class="cash-payment-details">
        <div class="form-group">
          <label>Receipt Number</label>
          <input type="text" v-model="localData.proof" placeholder="e.g. REC-001" class="standard-input" />
        </div>
        <div class="cash-notice" style="margin-top: 12px;">
          <span class="icon">ℹ️</span>
          <p>Please record the physical receipt number for internal tracking.</p>
        </div>
      </div>


    </div>

    <!-- Content for Cancel Action -->
    <div v-if="type === 'cancel'" class="action-cancel-container">
      <div class="enrollment-brief-card" v-if="enrollmentSummary">
        <div class="brief-grid">
          <div class="brief-column">
            <span class="brief-label">Parent / Guardian</span>
            <div class="brief-user">
              <img :src="enrollmentSummary.parentAvatar" class="avatar-mini-enrollment" />
              <span class="brief-value">{{ enrollmentSummary.parentName }}</span>
            </div>
          </div>
          <div class="brief-column">
            <span class="brief-label">Student</span>
            <div class="brief-user">
              <img :src="enrollmentSummary.studentAvatar" class="avatar-mini-enrollment" />
              <span class="brief-value">{{ enrollmentSummary.studentName }}</span>
            </div>
          </div>
          <div class="brief-column">
            <span class="brief-label">Program</span>
            <div class="brief-user">
              <img :src="enrollmentSummary.programAvatar" class="avatar-mini-enrollment" />
              <span class="brief-value">{{ enrollmentSummary.programTitle }}</span>
            </div>
          </div>
          <div class="brief-column">
            <span class="brief-label">Session Slot</span>
            <div class="brief-session">
              <div class="session-display-row">
                <div class="session-day-text"><strong>{{ enrollmentSummary.sessionDay }}</strong></div>
                <div class="session-time-text">{{ enrollmentSummary.sessionTime }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AppAlert type="warning" :customStyle="{ marginTop: '20px', marginBottom: '0px' }">
        <div style="display: flex; flex-direction: column; gap: 4px;">
          <strong style="font-size: 0.95rem;">Security Notice</strong>
          <span style="font-size: 0.85rem; opacity: 0.9; line-height: 1.2;">
            This will permanently remove the student and release their session slot.
          </span>
        </div>
      </AppAlert>

      <AppAlert v-if="isPaid(enrollment?.status || enrollment?.paymentStatus)" type="warning"
        :customStyle="{ marginTop: '10px', marginBottom: '0px' }">
        <div style="display: flex; flex-direction: column; gap: 4px;">
          <strong style="font-size: 0.95rem;">No-Refund Policy</strong>
          <span style="font-size: 0.85rem; opacity: 0.9; line-height: 1.2;">
            This enrollment is already paid. Please note that enrollments are non-refundable upon cancellation.
          </span>
        </div>
      </AppAlert>

      <div class="form-group" style="margin-top: 20px;">
        <label>Reason for Cancellation</label>
        <div class="preset-chips chips-div-enrollment" style="margin: 8px 0 12px 0;">
          <span v-for="preset in ['Schedule Conflict', 'Medical Reason', 'Moved Away', 'Duplicate']" :key="preset"
            class="preset-chip" @click="localData.reason = preset" :class="{ active: localData.reason === preset }">
            {{ preset }}
          </span>
        </div>
        <textarea v-model="localData.reason" class="standard-input"
          placeholder="Provide more details about why this is being cancelled..." style="min-height: 100px;"></textarea>
      </div>
    </div>

    <!-- Content for Delete Action -->
    <div v-if="type === 'delete'" class="form-group">
      <div class="info-block danger"
        style="background: #fef2f2; padding: 12px; border-radius: 8px; margin-bottom: 12px; border: 1px solid #fecaca;">
        <p style="color: #991b1b; font-size: 0.9rem;">
          <strong>Warning:</strong> This action is permanent and cannot be undone.
        </p>
      </div>
      <label>Type <strong class="danger-text">DELETE</strong> to confirm</label>
      <input type="text" v-model="localData.deleteConfirm" placeholder="DELETE" />
    </div>

    <template #footer>
      <div style="display: flex; flex-direction: column; align-items: flex-end; width: 100%; gap: 12px;">
        <transition name="alert-fade">
          <AppAlert v-if="error" :show="!!error" type="error" closable @close="$emit('update:error', '')"
            style="width: 100%; margin-bottom: 0;">
            {{ error }}
          </AppAlert>
        </transition>

        <transition name="alert-fade">
          <AppAlert v-if="success" :show="!!success" type="success" closable @close="$emit('update:success', '')"
            style="width: 100%; margin-bottom: 0;">
            {{ success }}
          </AppAlert>
        </transition>

        <transition name="toast-fade">
          <div v-if="showHint && validationHint"
            style="font-size: 0.8rem; color: #ef4444; background: #fef2f2; padding: 6px 12px; border-radius: 6px; border: 1px solid #fee2e2; max-width: fit-content;">
            ⚠️ {{ validationHint }}
          </div>
        </transition>
        <div style="display: flex; gap: 12px; justify-content: flex-end; width: 100%;">
          <AppButton variant="cancel" @click="$emit('close')">Cancel</AppButton>
          <AppButton :variant="type === 'delete' ? 'danger' : 'primary'" @click="handleSubmitTrigger" :loading="loading"
            :class="{ 'button-disabled-visual': !!validationHint }">
            {{ submitLabel }}
          </AppButton>
        </div>
      </div>
    </template>
  </AppModal>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import AppModal from '@/components/common/ui/AppModal.vue'
import AppAlert from '@/components/common/ui/AppAlert.vue'
import AppButton from '@/components/common/ui/AppButton.vue'
import StatusBadge from '@/components/common/ui/StatusBadge.vue'
import { getParentProfileURL, getStudentProfileURL, getProgramProfileURL, getActionIcon, getIconUrl } from '@/utils/assetHelper'
import { getSessionDay, getSessionTime } from '@/utils/sessionHelper'
import { getEnrollmentDisplayStatus, getEnrollmentDisplayMode } from '@/utils/enrollmentHelper'
import { storageService } from '@/services/storageService'
import { isPaid } from '@/utils/statusUtils'


const props = defineProps({
  isOpen: Boolean,
  type: String,
  enrollment: Object,
  loading: Boolean,
  error: String,
  success: String,
})

const emit = defineEmits(['close', 'submit', 'update:error', 'update:success'])

const localData = ref({
  proof: '',
  bankName: '',
  remark: '',
  reason: '',
  deleteConfirm: '',
  paymentMethod: 'online',
  selectedFile: null,
  proofPreview: null,
})

const showHint = ref(false)
let hintTimeout = null

// Reset local data when modal opens
watch(
  () => props.isOpen,
  (newVal) => {
    if (newVal) {
      localData.value = {
        proof: '',
        bankName: '',
        remark: '',
        reason: '',
        deleteConfirm: '',
        paymentMethod: 'online',
        selectedFile: null,
        proofPreview: null,
      }
      showHint.value = false
    }
  },
)

const enrollmentSummary = computed(() => {
  const e = props.enrollment
  if (!e) return null

  return {
    ...e,
    parentName: e.parent?.name || e.parentName || 'Parent',
    studentName: e.student?.name || e.studentName || 'Student',
    programTitle: e.program?.title || e.programTitle || 'Program',
    parentAvatar: getParentProfileURL(e.parent?.profile || e.parentProfileURL),
    studentAvatar: getStudentProfileURL(e.student?.profile || e.studentProfileURL),
    programAvatar: getProgramProfileURL(e.program?.profile || e.programProfileURL, e.category || e.program?.category),
    sessionDay: getSessionDay(e.sessionSchedule || (e.session?.schedule?.day + ' ' + e.session?.schedule?.timeslot)),
    sessionTime: getSessionTime(e.sessionSchedule || (e.session?.schedule?.day + ' ' + e.session?.schedule?.timeslot)),
    status: getEnrollmentDisplayStatus(e),
    mode: getEnrollmentDisplayMode(e),
    hasDiscount: (e.discountAmount || 0) > 0,
    discountText: `($${formatPrice(e.discountAmount || 0)} Disc.)`,
  }
})

const validationHint = computed(() => {
  const { proof, reason, deleteConfirm, paymentMethod, bankName } = localData.value
  if (props.type === 'delete' && deleteConfirm !== 'DELETE') return 'Type DELETE to confirm.'
  if (props.type === 'cancel' && !reason?.trim()) return 'Reason for cancellation is required.'
  if (props.type === 'pay') {
    if (paymentMethod === 'online') {
      if (!bankName) return 'Please select a Bank Name.'
      if (!proof?.trim()) return 'Transaction ID is required for online payments.'
    }
  }
  return ''
})

const submitLabel = computed(() => {
  if (props.type === 'pay') return 'Confirm Payment'
  if (props.type === 'cancel') return 'Confirm Cancellation'
  return 'Confirm Action'
})

const handleFileChange = (e) => {
  const file = e.target.files[0]
  if (file) {
    localData.value.selectedFile = file
    const reader = new FileReader()
    reader.onload = (event) => {
      localData.value.proofPreview = event.target.result
    }
    reader.readAsDataURL(file)
  }
}

const handleSubmitTrigger = async () => {
  if (validationHint.value) {
    showHint.value = true
    if (hintTimeout) clearTimeout(hintTimeout)
    hintTimeout = setTimeout(() => {
      showHint.value = false
    }, 3000)
  } else {
    try {
      let finalProofURL = ''
      if (localData.value.selectedFile && props.enrollment?.id) {
        // Upload proof to storage if file selected
        const timestamp = new Date().getTime()
        const path = `enrollments/proofs/${props.enrollment.id}_${timestamp}`
        finalProofURL = await storageService.uploadFile(localData.value.selectedFile, path)
      }

      emit('submit', {
        ...localData.value,
        proofURL: finalProofURL
      })
    } catch (err) {
      emit('update:error', 'Failed to upload payment proof. Please try again.')
    }
  }
}

const formatPrice = (val) => {
  if (val === undefined || val === null) return '0'
  return Number.isInteger(val) ? val.toString() : val.toFixed(2)
}
</script>

<style scoped>
@import "@/assets/styles/components/EnrollmentActionModal.css";
</style>

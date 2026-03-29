<template>
  <AppModal :show="isOpen" :title="(type ? type.charAt(0).toUpperCase() + type.slice(1) : '') + ' Enrollment'"
    variant="action" @close="$emit('close')">
    <AppAlert :show="!!error" type="error" closable @close="$emit('update:error', '')">
      {{ error }}
    </AppAlert>
    <AppAlert :show="!!success" type="success" closable @close="$emit('update:success', '')">
      {{ success }}
    </AppAlert>

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
              <StatusBadge :status="enrollmentSummary.mode === 'Full' ? 'Full Enrollment' : 'Partial Enrollment'"
                :type="enrollmentSummary.mode === 'Full' ? 'green' : 'blue'" />
              <StatusBadge :status="enrollmentSummary.status" />
              <span v-if="enrollmentSummary.hasDiscount" class="discount-note-mini">{{ enrollmentSummary.discountText
                }}</span>
            </div>
          </div>
          <div class="price-amount-large">${{ formatPrice(enrollmentSummary.amount) }}</div>
        </div>
      </div>

      <div class="form-group" style="margin-top: 20px;">
        <label>Payment Method</label>
        <div class="method-selector">
          <button type="button" class="method-btn" :class="{ active: localData.paymentMethod === 'online' }"
            @click="localData.paymentMethod = 'online'">
            <span class="icon">💳</span>
            <span>Online / Transfer</span>
          </button>
          <button type="button" class="method-btn" :class="{ active: localData.paymentMethod === 'cash' }"
            @click="localData.paymentMethod = 'cash'">
            <span class="icon">💵</span>
            <span>Cash Payment</span>
          </button>
        </div>
      </div>

      <div v-if="localData.paymentMethod === 'online'" class="form-group" style="margin-top: 16px;">
        <label>Transaction Reference / Proof</label>
        <input type="text" v-model="localData.proof" placeholder="e.g. ABA Transaction ID or Receipt #"
          class="standard-input" />
      </div>
      <div v-else class="cash-notice">
        <span class="icon">ℹ️</span>
        <p>This will mark the enrollment as paid by cash. No reference ID is required.</p>
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

      <div class="form-group" style="margin-top: 20px;">
        <label>Reason for Cancellation</label>
        <div class="preset-chips" style="margin: 8px 0 12px 0;">
          <span v-for="preset in ['Schedule Conflict', 'Medical Reason', 'Moved Away', 'Refund Issued', 'Duplicate']"
            :key="preset" class="chip" @click="localData.reason = preset"
            :class="{ active: localData.reason === preset }">
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
import { getParentProfileURL, getStudentProfileURL, getProgramProfileURL } from '@/utils/assetHelper'
import { getSessionDay, getSessionTime } from '@/utils/sessionHelper'
import { getEnrollmentDisplayStatus, getEnrollmentDisplayMode } from '@/utils/enrollmentHelper'

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
  reason: '',
  deleteConfirm: '',
  paymentMethod: 'online',
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
        reason: '',
        deleteConfirm: '',
        paymentMethod: 'online',
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
    parentAvatar: getParentProfileURL(e.parentProfileURL),
    studentAvatar: getStudentProfileURL(e.studentProfileURL),
    programAvatar: getProgramProfileURL(e.programProfileURL, e.category),
    sessionDay: getSessionDay(e.sessionSchedule),
    sessionTime: getSessionTime(e.sessionSchedule),
    status: getEnrollmentDisplayStatus(e),
    mode: getEnrollmentDisplayMode(e),
    hasDiscount: e.discountAmount > 0,
    discountText: `($${formatPrice(e.discountAmount)} Disc.)`,
  }
})

const validationHint = computed(() => {
  const { proof, reason, deleteConfirm, paymentMethod } = localData.value
  if (props.type === 'delete' && deleteConfirm !== 'DELETE') return 'Type DELETE to confirm.'
  if (props.type === 'cancel' && !reason?.trim()) return 'Reason for cancellation is required.'
  if (props.type === 'pay' && paymentMethod === 'online' && !proof?.trim())
    return 'Transaction reference is required for online payments.'
  return ''
})

const submitLabel = computed(() => {
  if (props.type === 'pay') return 'Confirm Payment'
  if (props.type === 'cancel') return 'Confirm Cancellation'
  return 'Confirm Action'
})

const handleSubmitTrigger = () => {
  if (validationHint.value) {
    showHint.value = true
    if (hintTimeout) clearTimeout(hintTimeout)
    hintTimeout = setTimeout(() => {
      showHint.value = false
    }, 3000)
  } else {
    emit('submit', { ...localData.value })
  }
}

const formatPrice = (val) => {
  if (val === undefined || val === null) return '0'
  return Number.isInteger(val) ? val.toString() : val.toFixed(2)
}
</script>

<style scoped>
.action-pay-container,
.action-cancel-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.price-status-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.discount-note-mini {
  font-size: 0.75rem;
  color: #94a3b8;
  font-weight: 500;
  font-style: italic;
}

.method-selector {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-top: 8px;
}

.method-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.method-btn .icon {
  font-size: 1.5rem;
}

.method-btn span:last-child {
  font-size: 0.85rem;
  font-weight: 600;
  color: #64748b;
}

.method-btn:hover {
  border-color: #cbd5e1;
  background: #f8fafc;
}

.method-btn.active {
  border-color: #0ea5e9;
  background: #f0f9ff;
}

.method-btn.active span:last-child {
  color: #0369a1;
}

.cash-notice {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  background: #f1f5f9;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.cash-notice .icon {
  font-size: 1.1rem;
}

.cash-notice p {
  font-size: 0.85rem;
  color: #475569;
  margin: 0;
  line-height: 1.4;
}

.danger-text {
  color: #ef4444;
}
</style>

<template>
  <AppModal :show="isOpen" :title="modalTitle" variant="action" @close="$emit('close')" :icon="modalIcon">

    <form id="enrollmentActionForm" @submit.prevent="handleSubmitTrigger">
      <!-- Content for Pay Action -->
      <div v-if="type === 'pay'" class="action-pay-panel">
        <div class="enrollment-brief-card-modern" v-if="enrollmentSummary">
          <div class="brief-grid-standard">
            <div class="brief-col">
              <span class="brief-label">Parent</span>
              <div class="brief-val-user">
                <img :src="enrollmentSummary.parentAvatar" class="avatar-mini-enrollment" />
                <span>{{ enrollmentSummary.parentName }}</span>
              </div>
            </div>
            <div class="brief-col">
              <span class="brief-label">Student</span>
              <div class="brief-val-user">
                <img :src="enrollmentSummary.studentAvatar" class="avatar-mini-enrollment" />
                <span>{{ enrollmentSummary.studentName }}</span>
              </div>
            </div>
            <div class="brief-col">
              <span class="brief-label">Program</span>
              <div class="brief-val-user">
                <img :src="enrollmentSummary.programAvatar" class="avatar-mini-enrollment" />
                <span>{{ enrollmentSummary.programTitle }}</span>
              </div>
            </div>
          </div>

          <div class="tuition-panel-standard">
            <div class="tuition-details-row">
              <div class="tuition-meta">
                <span class="tuition-label">Tuition Amount</span>
                <div class="tuition-badges">
                  <StatusBadge :status="enrollmentSummary.mode" />
                  <StatusBadge :status="enrollmentSummary.status" />
                </div>
              </div>
              <div class="tuition-amount-focus">${{ formatPrice(enrollmentSummary.amount) }}</div>
            </div>
          </div>
        </div>

        <AppAlert type="warning" class="mt-md">
          <div class="flex-column gap-3xs">
            <strong class="text-sm">Payment Finalization</strong>
            <span class="text-xs opacity-90">Please verify the amount and enrollment details. Payments are non-refundable once confirmed.</span>
          </div>
        </AppAlert>

        <div class="form-group mt-lg">
          <label>Select Payment Method</label>
          <div class="method-selector-modern">
            <button type="button" class="method-chip" :class="{ active: localData.paymentMethod === 'online' }"
              @click="localData.paymentMethod = 'online'">
              <div class="chip-icon">💳</div>
              <span>Online / Transfer</span>
            </button>
            <button type="button" class="method-chip" :class="{ active: localData.paymentMethod === 'cash' }"
              @click="localData.paymentMethod = 'cash'">
              <div class="chip-icon">💵</div>
              <span>Cash Payment</span>
            </button>
          </div>
        </div>

        <div class="form-grid mt-md">
          <div v-if="localData.paymentMethod === 'online'" class="form-group" :class="{ 'field-error': isSubmittingAttempted && errors.bankName }">
            <label>Bank Name <span class="required">*</span></label>
            <select v-model="localData.bankName" class="standard-input">
              <option value="">Select Bank</option>
              <option value="ABA">ABA Bank</option>
              <option value="Wing">Wing Bank</option>
              <option value="ACLEDA">ACLEDA Bank</option>
              <option value="Canadia">Canadia Bank</option>
              <option value="Other">Other Bank / Transfer</option>
            </select>
            <div v-if="isSubmittingAttempted && errors.bankName" class="field-error-msg">{{ errors.bankName }}</div>
          </div>
          <div class="form-group" :class="{ 'field-error': isSubmittingAttempted && errors.proof }">
            <label>{{ localData.paymentMethod === 'online' ? 'Transaction ID' : 'Receipt Number' }} <span class="required">*</span></label>
            <input type="text" v-model="localData.proof" :placeholder="localData.paymentMethod === 'online' ? 'e.g. 123456' : 'e.g. REC-001'" class="standard-input" />
            <div v-if="isSubmittingAttempted && errors.proof" class="field-error-msg">{{ errors.proof }}</div>
          </div>
        </div>

        <div class="form-group mt-md">
          <label>Internal Transaction Remark</label>
          <textarea v-model="localData.remark" placeholder="Add any internal processing notes..." rows="2" class="standard-input"></textarea>
        </div>
      </div>

      <!-- Content for Cancel Action -->
      <div v-if="type === 'cancel'" class="action-cancel-panel">
        <AppAlert type="warning" class="mb-lg">
          <div class="flex-column gap-3xs">
            <strong class="text-sm">Cancellation Warning</strong>
            <span class="text-xs opacity-90">This will release the class slot and mark the student as stopped for this program.</span>
          </div>
        </AppAlert>

        <div class="form-group" :class="{ 'field-error': isSubmittingAttempted && errors.reason }">
          <label>Reason for Cancellation <span class="required">*</span></label>
          <div class="preset-chips mb-sm">
            <button v-for="preset in ['Schedule Conflict', 'Medical', 'Moved Away', 'Duplicate']" :key="preset"
              type="button" class="preset-chip" @click="localData.reason = preset" :class="{ active: localData.reason === preset }">
              {{ preset }}
            </button>
          </div>
          <textarea v-model="localData.reason" class="standard-input" rows="3" placeholder="Provide details..."></textarea>
          <div v-if="isSubmittingAttempted && errors.reason" class="field-error-msg">{{ errors.reason }}</div>
        </div>
      </div>

      <!-- Content for Delete Action -->
      <div v-if="type === 'delete'" class="action-delete-panel">
        <div class="danger-box-standard">
          <div class="danger-icon-large">🚨</div>
          <div class="danger-content">
            <strong>Permanent Record Destruction</strong>
            <p>This will erase all financial and attendance history for this enrollment. This cannot be recovered.</p>
          </div>
        </div>
        <div class="form-group" :class="{ 'field-error': isSubmittingAttempted && errors.deleteConfirm }">
          <p class="confirm-label-standard">Type <strong class="danger-text">DELETE</strong> to confirm</p>
          <input type="text" v-model="localData.deleteConfirm" placeholder="DELETE" class="confirm-input-standard" />
          <div v-if="isSubmittingAttempted && errors.deleteConfirm" class="field-error-msg">{{ errors.deleteConfirm }}</div>
        </div>
      </div>
    </form>

    <template #footer>
      <div class="flex-column flex-end w-full gap-sm">
        <transition name="alert-fade">
          <AppAlert v-if="error" type="error" closable @close="$emit('update:error', '')" class="w-full">
            {{ error }}
          </AppAlert>
        </transition>

        <div class="flex-align-center flex-end w-full gap-sm">
          <AppButton variant="cancel" @click="$emit('close')">Cancel</AppButton>
          <AppButton :variant="type === 'delete' ? 'danger' : 'primary'" form="enrollmentActionForm" type="submit"
            :loading="loading" :disabled="loading"
            :class="{ 'button-disabled-visual': isFormInvalid || (type === 'edit' && !isChanged) }">
            {{ submitLabel }}
          </AppButton>
        </div>
      </div>
    </template>
  </AppModal>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useActionModal } from '@/composables/useActionModal'
import AppModal from '@/components/common/ui/AppModal.vue'
import AppAlert from '@/components/common/ui/AppAlert.vue'
import AppButton from '@/components/common/ui/AppButton.vue'
import StatusBadge from '@/components/common/ui/StatusBadge.vue'
import { formatPrice } from '@/utils/formatUtils'
import { getActionIcon } from '@/utils/assetHelper'

const props = defineProps({
  isOpen: Boolean,
  type: String, // 'pay', 'cancel', 'delete', 'edit'
  enrollment: Object,
  enrollmentSummary: Object,
  loading: Boolean,
  error: String,
})

const emit = defineEmits(['close', 'submit', 'update:error'])

const getInitialData = () => ({
  proof: '',
  bankName: '',
  remark: '',
  reason: '',
  deleteConfirm: '',
  paymentMethod: 'online',
})

const { localData } = useActionModal(props, emit, {
  getInitialData,
  sourceKey: 'enrollment'
})

const initialDataString = ref('')
const isSubmittingAttempted = ref(false)

watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    initialDataString.value = JSON.stringify(localData.value)
    isSubmittingAttempted.value = false
  }
})

const isChanged = computed(() => {
  if (props.type !== 'edit') return true
  return JSON.stringify(localData.value) !== initialDataString.value
})

const errors = computed(() => {
  const { proof, reason, deleteConfirm, paymentMethod, bankName } = localData.value
  const errs = {}

  if (props.type === 'delete') {
    if (deleteConfirm !== 'DELETE') errs.deleteConfirm = 'Type DELETE to confirm.'
  } else if (props.type === 'cancel') {
    if (!reason?.trim()) errs.reason = 'Reason for cancellation is required.'
  } else if (props.type === 'pay') {
    if (paymentMethod === 'online' && !bankName) errs.bankName = 'Bank name is required.'
    if (!proof?.trim()) errs.proof = 'Proof identifier is required.'
  }
  return errs
})

const isFormInvalid = computed(() => Object.keys(errors.value).length > 0)

const modalTitle = computed(() => {
  const titles = {
    pay: 'Process Payment',
    cancel: 'Cancel Enrollment',
    delete: 'Critical Action: Delete',
    edit: 'Edit Enrollment'
  }
  return titles[props.type] || 'Enrollment Action'
})

const submitLabel = computed(() => {
  if (props.type === 'pay') return 'Confirm Payment'
  if (props.type === 'cancel') return 'Process Cancellation'
  if (props.type === 'delete') return 'Permanently Delete'
  return 'Save Changes'
})

const modalIcon = computed(() => {
  if (props.type === 'delete') return getActionIcon('delete')
  if (props.type === 'pay') return getActionIcon('pay')
  return getActionIcon('edit')
})

const handleSubmitTrigger = () => {
  isSubmittingAttempted.value = true
  if (isFormInvalid.value || (props.type === 'edit' && !isChanged.value)) return
  emit('submit', { ...localData.value })
}
</script>

<style scoped>
@import "@/assets/styles/components/ActionModalShared.css";

.enrollment-brief-card-modern {
  background: var(--bg-subtle);
  border-radius: var(--border-radius);
  border: 1px solid var(--border-color);
  overflow: hidden;
  margin-bottom: var(--space-md);
}

.brief-grid-standard {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  padding: var(--space-lg);
  gap: var(--space-lg);
  border-bottom: 1px dashed var(--border-color);
}

.brief-col { display: flex; flex-direction: column; gap: 4px; }
.brief-label { font-size: 10px; font-weight: 700; color: var(--text-light); text-transform: uppercase; }
.brief-val-user { display: flex; align-items: center; gap: 8px; font-size: var(--text-sm); font-weight: 600; }
.avatar-mini-enrollment { width: 24px; height: 24px; border-radius: 50%; object-fit: cover; border: 1px solid var(--border-color); }

.tuition-panel-standard { padding: var(--space-lg); background: var(--white); }
.tuition-details-row { display: flex; align-items: center; justify-content: space-between; }
.tuition-meta { display: flex; flex-direction: column; gap: 4px; }
.tuition-label { font-size: var(--text-xs); color: var(--text-muted); font-weight: 500; }
.tuition-badges { display: flex; gap: 4px; }
.tuition-amount-focus { font-size: 1.5rem; font-weight: 850; color: var(--primary-color); letter-spacing: -1px; }

.method-selector-modern { display: flex; gap: var(--space-sm); margin-top: 4px; }
.method-chip {
  flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: var(--space-lg); gap: var(--space-sm); border: 2px solid var(--border-color);
  border-radius: var(--border-radius); background: var(--white); cursor: pointer; transition: all 0.2s;
}
.method-chip:hover { border-color: var(--primary-light); background: var(--bg-subtle); }
.method-chip.active { border-color: var(--primary-color); background: var(--info-soft); color: var(--primary-color); }
.chip-icon { font-size: 1.5rem; }
.method-chip span { font-size: var(--text-xs); font-weight: 700; text-transform: uppercase; }

</style>

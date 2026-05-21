<script setup>
import { ref, computed } from 'vue'
import { useActionModal } from '@/composables/useActionModal'
import AppModal from '@/components/common/ui/AppModal.vue'
import AppAlert from '@/components/common/ui/AppAlert.vue'
import AppButton from '@/components/common/ui/AppButton.vue'
import AppSelect from '@/components/common/ui/AppSelect.vue'
import AppInput from '@/components/common/ui/AppInput.vue'
import AppBadge from '@/components/common/ui/AppBadge.vue'
import AppConfirmOverlay from '@/components/common/ui/AppConfirmOverlay.vue'
import { formatPrice } from '@/utils/formatUtils'
import { getActionIcon, getImageUrl } from '@/utils/assetHelper'
import { getSessionDay, getSessionTime } from '@/utils/sessionHelper'

const props = defineProps({
  isOpen: Boolean,
  type: String,
  enrollment: Object,
  resolvedSummary: Object,
  loading: Boolean,
  error: String,
  success: String,
})

const emit = defineEmits(['close', 'submit', 'update:error'])

const cancelPresets = ['Schedule Conflict', 'Relocation', 'Financial Issue', 'Duplicated']
const activePreset = ref('')

const getInitialData = () => ({
  proof: '',
  bankName: '',
  remark: '',
  reason: '',
  deleteConfirm: '',
  paymentMethod: 'online',
  paymentStatus: 'paid',
})

const { localData, isDirty, errors, shaking, clearError, validate, submitForm } = useActionModal(
  props,
  emit,
  {
    getInitialData,
    sourceKey: 'enrollment',
    autoClear: 3000,
  },
)

const selectPreset = (preset) => {
  if (activePreset.value === preset) {
    activePreset.value = ''
    localData.reason = ''
  } else {
    activePreset.value = preset
    localData.reason = preset
  }
}

const showConfirm = ref(false)

const getValidationRules = () => {
  const rules = { required: [], custom: {} }
  if (props.type === 'delete') {
    rules.custom.deleteConfirm = (val) => val === 'DELETE' || 'Type DELETE to confirm'
  } else if (props.type === 'cancel') {
    rules.required = ['reason']
  } else if (props.type === 'pay') {
    if (localData.paymentMethod === 'online') rules.required.push('bankName')
    rules.required.push('proof')
  }
  return rules
}

const isSubmittable = computed(() => {
  if (props.type === 'pay') {
    const hasProof = !!localData.proof?.trim()
    const hasBank =
      props.type === 'pay' && localData.paymentMethod === 'online' ? !!localData.bankName : true
    return hasProof && hasBank
  }
  if (props.type === 'cancel') return !!localData.reason?.trim()
  if (props.type === 'delete') return localData.deleteConfirm === 'DELETE'
  return isDirty.value
})

const requestConfirm = () => {
  const rules = getValidationRules()
  const requiresValidation = rules.required.length > 0 || Object.keys(rules.custom).length > 0
  if (requiresValidation && !validate(rules)) return
  showConfirm.value = true
}

const handleActionSubmit = () => {
  showConfirm.value = false
  emit('submit', { ...localData })
}

const confirmOverlayTitle = computed(() => {
  const titles = {
    pay: 'Confirm Payment',
    cancel: 'Confirm Cancellation',
    delete: 'Confirm Deletion',
  }
  return titles[props.type] || 'Confirm Action'
})

const confirmOverlaySubtitle = computed(() => {
  if (props.type === 'delete')
    return 'This action is irreversible. All data will be permanently erased.'
  if (props.type === 'cancel')
    return 'This seat will be permanently released from the session schedule.'
  return 'Please verify the details before completing this action.'
})

const displaySummary = computed(() => {
  if (props.resolvedSummary) return props.resolvedSummary
  const e = props.enrollment
  if (!e) return null

  const classObj = e.class || {}
  const branchObj = classObj.branch || e.branch || {}
  const scheduleSource = classObj.schedule || e.classSchedule

  return {
    studentName: e.student?.name,
    programName: e.program?.name,
    amount: e.finalPrice || e.totalPrice || e.amount || 0,
    status: e.status || 'Pending',
    studentAvatar: e.student?.profileURL || null,
    parentAvatar: e.parent?.profileURL || null,
    programAvatar: e.program?.profileURL || null,
    parentName: e.parent?.name || 'Parent',
    className: classObj.name || 'N/A',
    scheduleDay: getSessionDay(scheduleSource),
    scheduleTime: getSessionTime(scheduleSource),
    branchName: branchObj.name || branchObj.abbr || 'HQ',
    branchAbbr: branchObj.abbr || 'HQ',
    branchColor: branchObj.color || 'blue',
    classAvatar: getActionIcon('calendar'),
  }
})

const confirmOverlayIcon = computed(() => {
  if (props.type === 'pay') return getImageUrl('enrollment/total-paid-enrollment')
  if (props.type === 'cancel') return getImageUrl('enrollment/total-canceled-enrollment')
  return getActionIcon('delete')
})

const confirmRows = computed(() => {
  const summary = displaySummary.value
  const base = [
    { key: 'Student', value: summary?.studentName },
    { key: 'Program', value: summary?.programName },
    { key: 'Amount', value: `$${formatPrice(summary?.amount || 0)}` },
  ]
  if (props.type === 'pay') {
    return [
      ...base,
      {
        key: 'Payment Channel',
        value: localData.paymentMethod === 'online' ? 'Online / Bank' : 'Cash',
      },
      ...(localData.bankName ? [{ key: 'Bank', value: localData.bankName }] : []),
      { key: 'Reference', value: localData.proof },
      ...(localData.remark
        ? [{ key: 'Remark', value: localData.remark, valueClass: 'italic' }]
        : []),
    ]
  }
  if (props.type === 'cancel') {
    return [...base, { key: 'Reason', value: localData.reason, valueClass: 'italic' }]
  }
  if (props.type === 'delete') {
    return [
      ...base,
      { key: 'Status', value: summary?.status },
      { key: 'Authorization', value: localData.deleteConfirm },
    ]
  }
  return base
})

// ── Labels / Titles ──
const modalTitle = computed(() => {
  const titles = {
    pay: 'Pay Enrollment',
    cancel: 'Cancel Enrollment',
    delete: 'Delete Enrollment',
    edit: 'Edit Enrollment',
  }
  return titles[props.type] || 'Enrollment Action'
})

const submitLabel = computed(() => {
  if (props.type === 'pay') return 'Pay'
  if (props.type === 'cancel') return 'Cancel'
  if (props.type === 'delete') return 'Delete'
  return 'Edit'
})

const modalIcon = computed(() => {
  if (props.type === 'delete') return getActionIcon('delete')
  if (props.type === 'pay') return getActionIcon('pay')
  return getActionIcon('edit')
})
</script>

<template>
  <AppModal
    :show="isOpen"
    :title="modalTitle"
    variant="action"
    @close="$emit('close')"
    :icon="modalIcon"
    :error="error"
    :success="success"
  >
    <form id="enrollmentActionForm" @submit.prevent="requestConfirm" novalidate>
      <!-- Content for Pay Action -->
      <div v-if="type === 'pay'" class="flex flex-col gap-lg">
        <div
          class="bg-white border border-outline-std rounded-std p-lg flex flex-col gap-lg shadow-sm"
          v-if="displaySummary"
        >
          <div class="grid grid-cols-2 gap-x-lg gap-y-md">
            <!-- Parent -->
            <div class="flex flex-col gap-xs">
              <span class="text-2xs font-semibold text-content-muted tracking-wider opacity-60"
                >Parent Registry</span
              >
              <div class="enroll-identity-row bg-primary-soft/40 border-primary/10">
                <img
                  :src="displaySummary.parentAvatar"
                  class="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                />
                <span class="text-sm font-bold text-content-dark tracking-tight">{{
                  displaySummary.parentName
                }}</span>
              </div>
            </div>
            <!-- Student -->
            <div class="flex flex-col gap-xs">
              <span class="text-2xs font-semibold text-content-muted tracking-wider opacity-60"
                >Student Name</span
              >
              <div class="enroll-identity-row bg-primary-soft/40 border-primary/10">
                <img
                  :src="displaySummary.studentAvatar"
                  class="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                />
                <span class="text-sm font-bold text-content-dark tracking-tight">{{
                  displaySummary.studentName
                }}</span>
              </div>
            </div>
            <!-- Program -->
            <div class="flex flex-col gap-xs">
              <span class="text-2xs font-semibold text-content-muted tracking-wider opacity-60"
                >Program Selection</span
              >
              <div class="enroll-identity-row bg-surface-subtle/30 border-outline-std/20">
                <img
                  :src="displaySummary.programAvatar"
                  class="w-8 h-8 rounded-full text-content-dark border-2 border-white shadow-sm"
                />
                <span class="text-sm font-semibold text-content-dark tracking-tighter">{{
                  displaySummary.programName
                }}</span>
              </div>
            </div>
            <!-- Class & Branch -->
            <div class="flex flex-col gap-xs">
              <span class="text-2xs font-semibold text-content-muted tracking-wider opacity-60"
                >Class and Branch</span
              >
              <div
                class="enroll-identity-row bg-surface-subtle/30 border-outline-std/20 flex-col !items-start gap-1 p-3"
              >
                <div class="flex items-center justify-between w-full">
                  <span class="text-xs font-semibold"
                    >{{ displaySummary.scheduleDay }} ({{ displaySummary.scheduleTime }})</span
                  >
                  <AppBadge
                    :status="displaySummary.branchAbbr"
                    :type="displaySummary.branchColor"
                  />
                </div>
              </div>
            </div>
          </div>

          <div
            class="flex items-center justify-between bg-gradient-to-br from-primary to-primary-dark p-xl rounded-std shadow-xl shadow-primary/20 mt-lg border border-primary-dark/30"
          >
            <div class="flex flex-col gap-1">
              <span class="text-xs font-bold text-white/70 uppercase tracking-widest"
                >Calculated Tuition Fee</span
              >
              <div class="flex gap-xs">
                <AppBadge
                  :status="displaySummary.mode || displaySummary.status"
                  class="bg-white/20 text-white border-none"
                />
              </div>
            </div>
            <div class="text-white text-right">
              <span class="text-3xl font-black tracking-tighter"
                >${{ formatPrice(displaySummary.amount) }}</span
              >
            </div>
          </div>
        </div>

        <AppAlert type="warning" class="mt-md">
          <div class="flex flex-col gap-0.5">
            <strong class="text-sm font-semibold tracking-tight"
              >Final Verification Required</strong
            >
            <span class="text-xs opacity-90 font-medium"
              >By confirming, you verify that the payment proof matches the tuition amount. This
              action is irreversible.</span
            >
          </div>
        </AppAlert>

        <div class="flex flex-col gap-xs mt-lg">
          <label class="text-xs font-semibold text-content-muted">Payment Channel Selection</label>
          <div class="grid grid-cols-2 gap-sm mt-1">
            <button
              type="button"
              class="enroll-channel-btn"
              :class="
                localData.paymentMethod === 'online'
                  ? 'enroll-channel-btn--online'
                  : 'enroll-channel-btn--inactive'
              "
              @click="localData.paymentMethod = 'online'"
            >
              <span class="text-xl">💳</span>
              <span>Online / Bank</span>
            </button>
            <button
              type="button"
              class="enroll-channel-btn"
              :class="
                localData.paymentMethod === 'cash'
                  ? 'enroll-channel-btn--cash'
                  : 'enroll-channel-btn--inactive'
              "
              @click="localData.paymentMethod = 'cash'"
            >
              <span class="text-xl">💵</span>
              <span>Cash Payment</span>
            </button>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-lg mt-md">
          <AppSelect
            v-if="localData.paymentMethod === 'online'"
            v-model="localData.bankName"
            :items="
              ['ABA', 'Wing', 'ACLEDA', 'Canadia', 'Sathapana', 'Other'].map((b) => ({
                id: b,
                name: b,
              }))
            "
            label="Issuing Bank"
            placeholder="Select Bank..."
            required
            :error="errors.bankName"
            :shake="shaking.bankName"
            :searchable="false"
            @change="clearError('bankName')"
          />

          <AppInput
            v-model="localData.proof"
            :label="localData.paymentMethod === 'online' ? 'Transaction Code' : 'Receipt ID'"
            :placeholder="localData.paymentMethod === 'online' ? 'e.g. 123456' : 'e.g. REC-001'"
            required
            :error="errors.proof"
            :shake="shaking.proof"
            class="col-span-2"
            @input="clearError('proof')"
          />
        </div>

        <AppInput
          v-model="localData.remark"
          type="textarea"
          label="Internal Processing Remarks"
          placeholder="Add any specific notes for audit trailing..."
          :error="errors.remark"
          :shake="shaking.remark"
          @input="clearError('remark')"
        />
      </div>

      <!-- Content for Cancel Action -->
      <div v-if="type === 'cancel'" class="flex flex-col gap-lg">
        <AppAlert type="warning">
          <div class="flex flex-col gap-0.5">
            <strong class="text-sm font-semibold tracking-tight"
              >Program Termination Warning</strong
            >
            <span class="text-xs opacity-90 font-medium"
              >Marking this enrollment as cancelled will permanently release the reserved seat in
              the session schedule.</span
            >
          </div>
        </AppAlert>

        <div class="flex flex-col gap-xs">
          <div class="flex flex-wrap gap-xs mb-sm mt-1">
            <button
              v-for="preset in cancelPresets"
              :key="preset"
              type="button"
              class="px-md py-1.5 border-2 rounded-sm text-2xs cursor-pointer font-semibold transition-all"
              :class="
                activePreset === preset
                  ? 'bg-primary text-white border-primary shadow-md scale-105'
                  : 'bg-surface-light border-outline-std/50 hover:bg-primary-soft hover:text-primary hover:border-primary/20'
              "
              @click="selectPreset(preset)"
            >
              {{ preset }}
            </button>
          </div>
          <AppInput
            v-model="localData.reason"
            type="textarea"
            label="Cancellation Logic / Reason"
            required
            :error="errors.reason"
            :shake="shaking.reason"
            placeholder="Provide a detailed cancel reason..."
            @input="
              activePreset = ''
              clearError('reason')
            "
          />
        </div>
      </div>

      <!-- Content for Delete Action -->
      <div v-if="type === 'delete'" class="flex flex-col gap-lg">
        <!-- Identity Summary (consistent with pay modal) -->
        <div
          class="bg-white border border-outline-std rounded-std p-lg flex flex-col gap-lg shadow-sm"
          v-if="displaySummary"
        >
          <div class="grid grid-cols-2 gap-x-lg gap-y-md">
            <!-- Parent -->
            <div class="flex flex-col gap-xs">
              <span class="text-2xs font-semibold text-content-muted tracking-wider opacity-60"
                >Parent Name</span
              >
              <div class="enroll-identity-row">
                <img
                  :src="displaySummary.parentAvatar"
                  class="w-8 h-8 rounded-full border border-white shadow-sm"
                />
                <span class="text-sm font-semibold text-content-dark tracking-tight">{{
                  displaySummary.parentName
                }}</span>
              </div>
            </div>
            <!-- Student -->
            <div class="flex flex-col gap-xs">
              <span class="text-2xs font-semibold text-content-muted tracking-wider opacity-60"
                >Student Name</span
              >
              <div class="enroll-identity-row">
                <img
                  :src="displaySummary.studentAvatar"
                  class="w-8 h-8 rounded-full border border-white shadow-sm"
                />
                <span class="text-sm font-semibold text-content-dark tracking-tight">{{
                  displaySummary.studentName
                }}</span>
              </div>
            </div>
            <!-- Program -->
            <div class="flex flex-col gap-xs">
              <span class="text-2xs font-semibold text-content-muted tracking-wider opacity-60"
                >Program</span
              >
              <div class="enroll-identity-row bg-surface-subtle/30 border-outline-std/20">
                <img
                  :src="displaySummary.programAvatar"
                  class="w-8 h-8 rounded-full text-content-dark border-2 border-white shadow-sm"
                />
                <span class="text-sm font-semibold text-content-dark tracking-tighter">{{
                  displaySummary.programName
                }}</span>
              </div>
            </div>
            <!-- Class & Branch -->
            <div class="flex flex-col gap-xs">
              <span class="text-2xs font-semibold text-content-muted tracking-wider opacity-60"
                >Class and Branch</span
              >
              <div
                class="enroll-identity-row bg-surface-subtle/30 border-outline-std/20 flex-col !items-start gap-1 p-3"
              >
                <div class="flex items-center justify-between w-full">
                  <span class="text-sm font-bold text-content-dark">{{
                    displaySummary.className
                  }}</span>
                  <AppBadge
                    :status="displaySummary.branchAbbr"
                    :type="displaySummary.branchColor"
                  />
                </div>
                <div class="flex items-center justify-between w-full opacity-70">
                  <span class="text-xs font-semibold"
                    >{{ displaySummary.scheduleDay }} ({{ displaySummary.scheduleTime }})</span
                  >
                </div>
              </div>
            </div>
          </div>
        </div>

        <AppAlert type="error">
          <div class="flex flex-col gap-0.5">
            <strong class="text-sm font-semibold tracking-tight">⚠ Permanent Data Deletion</strong>
            <span class="text-xs opacity-90 font-medium"
              >This will erase all linked financial logs and attendance records. This action is
              irreversible and cannot be undone.</span
            >
          </div>
        </AppAlert>

        <AppInput
          v-model="localData.deleteConfirm"
          label="Authorization Confirmation"
          placeholder='Type "DELETE" to confirm'
          required
          :error="errors.deleteConfirm"
          :shake="shaking.deleteConfirm"
          @input="clearError('deleteConfirm')"
        >
          <template #label-extra>
            <span class="block text-2xs font-semibold mt-0.5">
              Type <span class="text-error px-1 font-semibold">DELETE</span> to authorize this
              permanent action
            </span>
          </template>
        </AppInput>
      </div>

      <!-- ── Reusable Confirmation Overlay ── -->
      <AppConfirmOverlay
        :show="showConfirm"
        :title="confirmOverlayTitle"
        :subtitle="confirmOverlaySubtitle"
        :icon="confirmOverlayIcon"
        :rows="confirmRows"
        :confirmLabel="submitLabel"
        :loading="loading"
        @back="showConfirm = false"
        @confirm="handleActionSubmit"
      />
    </form>

    <template #footer>
      <div class="flex flex-col justify-end w-full gap-md">
        <AppAlert
          v-if="error"
          type="error"
          closable
          @close="$emit('update:error', '')"
          class="w-full"
        >
          {{ error }}
        </AppAlert>
        <AppAlert v-if="type === 'edit' && !isDirty" type="info" class="w-full">
          No modifications detected. Please update at least one field to enable saving.
        </AppAlert>
        <div class="flex items-center justify-end w-full gap-md">
          <AppButton variant="cancel" @click="$emit('close')">Cancel</AppButton>
          <AppButton
            :variant="type === 'delete' ? 'danger' : 'primary'"
            type="button"
            @click="requestConfirm"
            :loading="loading"
            :disabled="loading || (type === 'edit' && !isDirty)"
            :class="{ 'button-disabled-visual': type === 'edit' && !isDirty }"
          >
            {{ submitLabel }}
          </AppButton>
        </div>
      </div>
    </template>
  </AppModal>
</template>

<style scoped>
.enroll-identity-row {
  @apply flex items-center gap-sm bg-surface-subtle/50 p-2 rounded-sm border border-outline-std;
}

.enroll-channel-btn {
  @apply flex items-center justify-center gap-md p-xl rounded-sm border-2 font-semibold text-xs transition-all;
}

.enroll-channel-btn--inactive {
  @apply bg-surface-subtle text-content-muted border-outline-std hover:bg-white;
}

.enroll-channel-btn--online {
  @apply bg-primary text-white border-primary shadow-lg scale-105;
}

.enroll-channel-btn--cash {
  @apply bg-success text-white border-success shadow-lg scale-105;
}
</style>

<template>
  <AppModal
    :show="isOpen"
    :title="modalTitle"
    variant="action"
    @close="$emit('close')"
    :icon="modalIcon"
  >
    <form id="enrollmentActionForm" @submit.prevent="handleActionSubmit" novalidate>
      <!-- Content for Pay Action -->
      <div v-if="type === 'pay'" class="flex flex-col gap-lg">
        <div
          class="bg-white border border-outline-std rounded-std p-lg flex flex-col gap-lg shadow-sm"
          v-if="enrollmentSummary"
        >
          <div class="grid grid-cols-2 gap-x-lg gap-y-md">
            <div class="flex flex-col gap-xs">
              <span
                class="text-2xs font-black text-content-muted uppercase tracking-wider opacity-60"
                >Parent Registry</span
              >
              <div
                class="flex items-center gap-sm bg-surface-subtle/50 p-2 rounded-sm border border-outline-std/30"
              >
                <img
                  :src="enrollmentSummary.parentAvatar"
                  class="w-8 h-8 rounded-full border border-white shadow-sm"
                />
                <span class="text-sm font-bold text-content-dark tracking-tight">{{
                  enrollmentSummary.parentName
                }}</span>
              </div>
            </div>
            <div class="flex flex-col gap-xs">
              <span
                class="text-2xs font-black text-content-muted uppercase tracking-wider opacity-60"
                >Student Name</span
              >
              <div
                class="flex items-center gap-sm bg-surface-subtle/50 p-2 rounded-sm border border-outline-std/30"
              >
                <img
                  :src="enrollmentSummary.studentAvatar"
                  class="w-8 h-8 rounded-full border border-white shadow-sm"
                />
                <span class="text-sm font-bold text-content-dark tracking-tight">{{
                  enrollmentSummary.studentName
                }}</span>
              </div>
            </div>
            <div class="flex flex-col gap-xs col-span-2">
              <span
                class="text-2xs font-black text-content-muted uppercase tracking-wider opacity-60"
                >Program Selection</span
              >
              <div
                class="flex items-center gap-sm bg-surface-subtle/30 p-2 rounded-sm border border-outline-std/20"
              >
                <img
                  :src="enrollmentSummary.programAvatar"
                  class="w-8 h-8 rounded-full text-content-dark border-2 border-white shadow-sm"
                />
                <span class="text-sm font-black text-content-dark tracking-tighter">{{
                  enrollmentSummary.programTitle
                }}</span>
              </div>
            </div>
          </div>

          <div
            class="flex items-center justify-between bg-primary p-xl rounded-std shadow-lg shadow-primary/10 mt-lg border border-primary-dark"
          >
            <div class="flex flex-col gap-1">
              <span class="text-2xs font-black text-white/80 uppercase tracking-widest"
                >Calculated Tuition Fee</span
              >
              <div class="flex gap-xs">
                <StatusBadge
                  :status="enrollmentSummary.mode"
                  class="bg-white/20 text-white border-transparent"
                />
                <StatusBadge
                  :status="enrollmentSummary.status"
                  class="bg-white/20 text-white border-transparent"
                />
              </div>
            </div>
            <div class="text-white">
              <span class="text-3xl font-black tracking-tighter"
                >${{ formatPrice(enrollmentSummary.amount) }}</span
              >
            </div>
          </div>
        </div>

        <AppAlert type="warning" class="mt-md">
          <div class="flex flex-col gap-0.5">
            <strong class="text-sm font-black tracking-tight">Final Verification Required</strong>
            <span class="text-xs opacity-90 font-medium"
              >By confirming, you verify that the payment proof matches the tuition amount. This
              action is irreversible.</span
            >
          </div>
        </AppAlert>

        <div class="flex flex-col gap-xs mt-lg">
          <label class="text-xs font-black uppercase text-content-muted tracking-widest"
            >Payment Channel Selection</label
          >
          <div class="grid grid-cols-2 gap-sm mt-1">
            <button
              type="button"
              class="flex items-center justify-center gap-md p-xl rounded-sm border-2 font-black text-xs uppercase tracking-widest transition-all"
              :class="
                localData.paymentMethod === 'online'
                  ? 'bg-primary text-white border-primary shadow-lg scale-[1.02]'
                  : 'bg-surface-subtle text-content-muted border-outline-std hover:bg-white hover:border-text-muted hover:text-content-dark'
              "
              @click="localData.paymentMethod = 'online'"
            >
              <span class="text-xl">💳</span>
              <span>Online / Bank</span>
            </button>
            <button
              type="button"
              class="flex items-center justify-center gap-md p-xl rounded-sm border-2 font-black text-xs uppercase tracking-widest transition-all"
              :class="
                localData.paymentMethod === 'cash'
                  ? 'bg-success text-white border-success shadow-lg scale-[1.02]'
                  : 'bg-surface-subtle text-content-muted border-outline-std hover:bg-white hover:border-text-muted hover:text-content-dark'
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
            :class="localData.paymentMethod === 'cash' ? 'col-span-2' : ''"
            @input="clearError('proof')"
          />
        </div>

        <div class="flex flex-col gap-xs mt-md">
          <label class="text-xs font-black uppercase text-content-muted tracking-widest"
            >Internal Processing Remarks</label
          >
          <textarea
            v-model="localData.remark"
            placeholder="Add any specific notes for audit trailing..."
            rows="2"
            class="w-full px-md p-sm border-2 border-outline-std rounded-sm bg-white text-sm font-semibold outline-none transition-all focus:border-primary focus:ring-[3px] focus:ring-info-soft"
          ></textarea>
        </div>
      </div>

      <!-- Content for Cancel Action -->
      <div v-if="type === 'cancel'" class="flex flex-col gap-lg">
        <AppAlert type="warning">
          <div class="flex flex-col gap-0.5">
            <strong class="text-sm font-black tracking-tight uppercase"
              >Program Termination Warning</strong
            >
            <span class="text-xs opacity-90 font-medium"
              >Marking this enrollment as cancelled will permanently release the reserved seat in
              the session schedule.</span
            >
          </div>
        </AppAlert>

        <div class="flex flex-col gap-xs">
          <label class="text-xs font-black uppercase text-content-muted tracking-widest"
            >Cancellation Logic / Reason <span class="text-error">*</span></label
          >
          <div class="flex flex-wrap gap-xs mb-sm mt-1">
            <button
              v-for="preset in [
                'Schedule Conflict',
                'Relocation',
                'Financial',
                'Duplicate Registry',
              ]"
              :key="preset"
              type="button"
              class="px-md py-1.5 bg-surface-light border-2 border-outline-std/50 rounded-sm text-2xs cursor-pointer font-black uppercase tracking-widest transition-all hover:bg-primary-soft hover:text-primary hover:border-primary/20"
              :class="{
                'bg-primary text-white border-primary-dark shadow-md scale-105':
                  localData.reason === preset,
              }"
              @click="localData.reason = preset"
            >
              {{ preset }}
            </button>
          </div>
          <textarea
            v-model="localData.reason"
            class="w-full px-md py-sm border-2 border-outline-std rounded-sm bg-white text-sm font-semibold outline-none transition-all focus:border-primary focus:ring-[3px] focus:ring-info-soft"
            :class="{
              'border-error bg-error-soft ring-error/10': errors.reason,
              'animate-shake': shaking.reason,
            }"
            rows="3"
            placeholder="Provide a detailed audit reason..."
          ></textarea>
          <div v-if="errors.reason" class="text-error text-3xs font-black px-1 mt-0.5 uppercase tracking-widest">
            {{ errors.reason }}
          </div>
        </div>
      </div>

      <!-- Content for Delete Action -->
      <div v-if="type === 'delete'" class="flex flex-col gap-xl">
        <div
          class="flex items-center gap-xl p-xl bg-error-deep/5 border-2 border-dashed border-error/30 rounded-std"
        >
          <div class="text-4xl filter grayscale brightness-125">🚨</div>
          <div class="flex flex-col gap-1">
            <strong class="text-lg font-black text-error-deep tracking-tight uppercase leading-none"
              >Database Purge Required</strong
            >
            <p class="text-xs text-error-deep/70 font-semibold leading-relaxed">
              This action will erase all linked financial logs and attendance data. This operation
              is non-recoverable.
            </p>
          </div>
        </div>

        <AppInput
          v-model="localData.deleteConfirm"
          label="Authorization Confirmation"
          placeholder="CONFIRM AUTHORIZATION"
          required
          class="text-center"
          :error="errors.deleteConfirm"
          :shake="shaking.deleteConfirm"
          @input="clearError('deleteConfirm')"
        >
          <template #label-extra>
            <span
              class="block text-2xs font-black uppercase text-content-muted/40 text-center mt-1"
            >
              Type <span class="text-error px-1">DELETE</span> to authorize purge
            </span>
          </template>
        </AppInput>
      </div>
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
        <div class="flex items-center justify-end w-full gap-md">
          <AppButton variant="cancel" @click="$emit('close')">Cancel Action</AppButton>
          <AppButton
            :variant="type === 'delete' ? 'danger' : 'primary'"
            form="enrollmentActionForm"
            type="submit"
            @click="type === 'delete' ? handleActionSubmit() : null"
            :loading="loading"
            :disabled="loading"
            :class="{ 'button-disabled-visual': type === 'edit' && !isDirty }"
          >
            {{ submitLabel }}
          </AppButton>
        </div>
      </div>
    </template>
  </AppModal>
</template>

<script setup>
import { computed } from 'vue'
import { useActionModal } from '@/composables/useActionModal'
import AppModal from '@/components/common/ui/AppModal.vue'
import AppAlert from '@/components/common/ui/AppAlert.vue'
import AppButton from '@/components/common/ui/AppButton.vue'
import AppSelect from '@/components/common/ui/AppSelect.vue'
import AppInput from '@/components/common/ui/AppInput.vue'
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

const { localData, isDirty, errors, shaking, clearError, submitForm } = useActionModal(
  props,
  emit,
  {
    getInitialData,
    sourceKey: 'enrollment',
  },
)

const handleActionSubmit = () => {
  const rules = {
    required: [],
    custom: {},
  }

  if (props.type === 'delete') {
    rules.custom.deleteConfirm = (val) => val === 'DELETE' || 'Invalid confirmation string'
  } else if (props.type === 'cancel') {
    rules.required = ['reason']
  } else if (props.type === 'pay') {
    if (localData.value.paymentMethod === 'online') {
      rules.required.push('bankName')
    }
    rules.required.push('proof')
  }

  submitForm(rules)
}

const modalTitle = computed(() => {
  const titles = {
    pay: 'Process Enrollment Revenue',
    cancel: 'Terminate Active Enrollment',
    delete: 'Critical: Database Purge',
    edit: 'Modify Enrollment Record',
  }
  return titles[props.type] || 'Enrollment Administration'
})

const submitLabel = computed(() => {
  if (props.type === 'pay') return 'Authorize Payment'
  if (props.type === 'cancel') return 'Execute Termination'
  if (props.type === 'delete') return 'Force Delete Record'
  return 'Update Record'
})

const modalIcon = computed(() => {
  if (props.type === 'delete') return getActionIcon('delete')
  if (props.type === 'pay') return getActionIcon('pay')
  return getActionIcon('edit')
})
</script>

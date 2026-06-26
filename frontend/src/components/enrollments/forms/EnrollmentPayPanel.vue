<script setup>
import AppInput from '@/components/common/ui/AppInput.vue'
import AppSelect from '@/components/common/ui/AppSelect.vue'
import AppAlert from '@/components/common/ui/AppAlert.vue'
import AppBadge from '@/components/common/ui/AppBadge.vue'
import { getActionIcon } from '@/utils/assetHelper'
import { formatPrice } from '@/utils/formatUtils'

const props = defineProps({
  form: { type: Object, required: true },
  displaySummary: { type: Object, default: null },
  errors: { type: Object, default: () => ({}) },
  shaking: { type: Object, default: () => ({}) },
})

const emit = defineEmits(['update:form', 'clear-error'])

const updateForm = (field, value) => {
  emit('update:form', { ...props.form, [field]: value })
}
</script>

<template>
  <div class="flex flex-col gap-lg">
    <div v-if="displaySummary" class="flex flex-col gap-lg">
      <div class="enroll-twin-card">
        <span class="enroll-section-label">Enrollment Details</span>
        <div class="enroll-info-grid">
          <div class="enroll-info-item">
            <span class="enroll-info-key">Student</span>
            <div class="flex items-center gap-2">
              <img :src="displaySummary.studentAvatar" class="w-6 h-6 rounded-full" />
              <span class="enroll-info-val">{{ displaySummary.studentName }}</span>
            </div>
          </div>
          <div class="enroll-info-item">
            <span class="enroll-info-key">Parent</span>
            <div class="flex items-center gap-2">
              <img :src="displaySummary.parentAvatar" class="w-6 h-6 rounded-full" />
              <span class="enroll-info-val">{{ displaySummary.parentName }}</span>
            </div>
          </div>
          <div class="enroll-info-item">
            <span class="enroll-info-key">Program</span>
            <div class="flex items-center gap-2">
              <img :src="displaySummary.programAvatar" class="w-6 h-6 rounded-full" />
              <span class="enroll-info-val">{{ displaySummary.programName }}</span>
            </div>
          </div>
          <div class="enroll-info-item">
            <span class="enroll-info-key">Schedule</span>
            <span class="enroll-info-val text-primary font-bold">
              {{ displaySummary.scheduleDay }} ({{ displaySummary.scheduleTime }})
            </span>
          </div>
          <div class="enroll-info-item col-span-2">
            <span class="enroll-info-key">Branch</span>
            <AppBadge :status="displaySummary.branchAbbr" :type="displaySummary.branchColor" />
          </div>
        </div>
      </div>

      <div class="enroll-twin-card">
        <span class="enroll-section-label">Payment Summary</span>
        <div class="enroll-info-grid">
          <div class="enroll-info-item col-span-2 mt-2">
            <div class="ui-summary-card">
              <div class="ui-summary-content">
                <span class="ui-summary-label text-white font-bold text-lg"
                  >Total Amount Due</span
                >
                <div class="enroll-tuition-savings flex gap-2 mt-1">
                  <AppBadge :status="displaySummary.mode || displaySummary.status" />
                </div>
              </div>
              <span class="ui-summary-amount"> ${{ formatPrice(displaySummary.amount) }} </span>
            </div>
          </div>
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
      <div
        class="flex items-center gap-2 p-2 bg-white rounded-2xl border border-outline-std mt-1 w-fit"
      >
        <button
          type="button"
          @click="updateForm('paymentMethod', 'online')"
          class="py-2 px-5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all duration-300 border border-transparent"
          :class="
            form.paymentMethod === 'online'
              ? 'bg-primary text-white shadow-md ring-1 ring-black/5'
              : 'text-content-muted hover:text-content-dark hover:bg-surface-subtle/50'
          "
        >
          <img
            :src="getActionIcon('pay')"
            class="w-4 h-4"
            :class="{ 'brightness-200': form.paymentMethod === 'online' }"
          />
          Online / Bank
        </button>
        <button
          type="button"
          @click="updateForm('paymentMethod', 'cash')"
          class="py-2 px-5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all duration-300 border border-transparent"
          :class="
            form.paymentMethod === 'cash'
              ? 'bg-primary text-white shadow-md ring-1 ring-black/5'
              : 'text-content-muted hover:text-content-dark hover:bg-surface-subtle/50'
          "
        >
          <img
            :src="getActionIcon('cash')"
            class="w-4 h-4"
            :class="{ 'brightness-200': form.paymentMethod === 'cash' }"
          />
          Cash Payment
        </button>
      </div>
    </div>

    <div class="ui-form-grid mt-md">
      <AppSelect
        v-if="form.paymentMethod === 'online'"
        :modelValue="form.bankName"
        @update:modelValue="updateForm('bankName', $event)"
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
        @change="$emit('clear-error', 'bankName')"
      />

      <AppInput
        :modelValue="form.receiptId"
        @update:modelValue="updateForm('receiptId', $event)"
        label="Receipt ID"
        placeholder="e.g. REC-001"
        required
        :error="errors.receiptId"
        :shake="shaking.receiptId"
        :class="form.paymentMethod === 'online' ? '' : 'col-span-2'"
        @input="$emit('clear-error', 'receiptId')"
      />

      <AppInput
        v-if="form.paymentMethod === 'online'"
        :modelValue="form.transactionId"
        @update:modelValue="updateForm('transactionId', $event)"
        label="Transaction Code"
        placeholder="e.g. 123456"
        required
        :error="errors.transactionId"
        :shake="shaking.transactionId"
        @input="$emit('clear-error', 'transactionId')"
      />
    </div>

    <AppInput
      :modelValue="form.remark"
      @update:modelValue="updateForm('remark', $event)"
      type="textarea"
      label="Internal Processing Remarks"
      placeholder="Add any specific notes for audit trailing..."
      :error="errors.remark"
      :shake="shaking.remark"
      @input="$emit('clear-error', 'remark')"
    />
  </div>
</template>

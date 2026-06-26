<script setup>
import AppInput from '@/components/common/ui/AppInput.vue'
import AppBadge from '@/components/common/ui/AppBadge.vue'
import { formatPrice } from '@/utils/formatUtils'

const props = defineProps({
  form: { type: Object, required: true },
  errors: { type: Object, default: () => ({}) },
  shaking: { type: Object, default: () => ({}) },
  isEditMode: { type: Boolean, default: false },
  finalAmount: { type: Number, default: 0 }
})

const emit = defineEmits(['update:form', 'clear-error'])

const updateForm = (field, value) => {
  emit('update:form', { ...props.form, [field]: value })
}
</script>

<template>
  <div class="enroll-twin-card">
    <span class="enroll-section-label">Pricing</span>
    <div class="enroll-info-grid">
      <div class="enroll-info-item">
        <span class="enroll-info-key">Billing Mode</span>
        <div
          class="ui-box-toggle"
          :class="{ 'ui-box-toggle--active': form.isProrated }"
          @click="updateForm('isProrated', !form.isProrated)"
        >
          <AppBadge :status="form.isProrated ? 'Partial' : 'Full'" />
        </div>
      </div>
      <div class="enroll-info-item">
        <span class="enroll-info-key">Sponsorship</span>
        <div
          class="ui-box-toggle"
          :class="{ 'ui-box-toggle--active': form.isSponsorship }"
          @click="updateForm('isSponsorship', !form.isSponsorship)"
        >
          <AppBadge :status="form.isSponsorship ? 'Sponsored' : 'Parent Paid'" />
        </div>
      </div>
      <div v-if="isEditMode" class="enroll-info-item col-span-2">
        <AppInput
          :modelValue="form.transferredSessions"
          @update:modelValue="updateForm('transferredSessions', $event)"
          type="number"
          label="Prior Paid Sessions Credit"
          placeholder="0"
          :error="errors.transferredSessions"
          :shake="shaking.transferredSessions"
        />
      </div>
      <div v-if="form.isSponsorship" class="enroll-info-item col-span-2">
        <AppInput
          :modelValue="form.sponsorName"
          @update:modelValue="updateForm('sponsorName', $event)"
          label="Sponsor Name"
          placeholder="e.g. Corporate Partner"
          :error="errors.sponsorName"
          :shake="shaking.sponsorName"
        />
      </div>
      <div class="enroll-info-item">
        <AppInput
          :modelValue="form.discountAmount"
          @update:modelValue="updateForm('discountAmount', $event)"
          type="number"
          label="Discount"
          placeholder="0"
          :error="errors.discountAmount"
          :shake="shaking.discountAmount"
        />
      </div>
      <div class="enroll-info-item">
        <div class="flex flex-col gap-2">
          <span class="enroll-info-key">Discount Type</span>
          <div class="flex bg-surface-subtle border border-outline-std rounded-sm p-0.5">
            <button
              type="button"
              @click="updateForm('discountType', 'dollar')"
              class="px-2 py-1 rounded-xs text-xs font-semibold transition-all"
              :class="
                form.discountType === 'dollar'
                  ? 'bg-primary text-white shadow-sm rounded-sm'
                  : 'text-content-muted hover:text-content-dark'
              "
            >
              $
            </button>
            <button
              type="button"
              @click="updateForm('discountType', 'percent')"
              class="px-2 py-1 rounded-xs text-xs font-semibold transition-all"
              :class="
                form.discountType === 'percent'
                  ? 'bg-primary text-white shadow-sm rounded-sm'
                  : 'text-content-muted hover:text-content-dark'
              "
            >
              %
            </button>
          </div>
        </div>
      </div>
      <div class="enroll-info-item">
        <span class="enroll-info-key">Custom Price</span>
        <div
          class="ui-box-toggle"
          :class="{ 'ui-box-toggle--danger': form.isCustomPrice }"
          @click="updateForm('isCustomPrice', !form.isCustomPrice)"
        >
          <span class="text-sm font-semibold" :class="{ 'text-error': form.isCustomPrice }">
            {{ form.isCustomPrice ? 'Override' : 'Locked' }}
          </span>
        </div>
      </div>
      <div v-if="form.isCustomPrice" class="enroll-info-item">
        <AppInput
          :modelValue="form.customPrice"
          @update:modelValue="updateForm('customPrice', $event)"
          type="number"
          label="Override Price"
          placeholder="0"
          :error="errors.customPrice"
          :shake="shaking.customPrice"
        />
      </div>
      <div class="enroll-info-item col-span-2">
        <AppInput
          :modelValue="form.remark"
          @update:modelValue="updateForm('remark', $event)"
          type="textarea"
          label="Administrative Remark"
          placeholder="Optional note"
          :error="errors.remark"
          :shake="shaking.remark"
          @input="$emit('clear-error', 'remark')"
        />
      </div>
      <div class="enroll-info-item col-span-2 mt-2">
        <div class="ui-summary-card">
          <div class="ui-summary-content">
            <span class="ui-summary-label">Total Price to Pay</span>
            <div class="text-lg font-bold">
              Billed Sessions: {{ form.enrolledSessions || 0 }}
            </div>
          </div>
          <span class="ui-summary-amount">
            {{ form.isSponsorship ? '$0.00' : '$' + formatPrice(finalAmount) }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

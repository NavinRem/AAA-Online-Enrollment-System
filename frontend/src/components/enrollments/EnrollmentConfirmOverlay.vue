<script setup>
import AppButton from '@/components/common/ui/AppButton.vue'
import AppBadge from '@/components/common/ui/AppBadge.vue'
import { formatPrice } from '@/utils/formatUtils'

defineProps({
  show: { type: Boolean, default: false },
  title: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  icon: { type: String, default: '' },
  rows: { type: Array, default: () => [] },
  totalAmount: { type: Number, default: undefined },
  totalLabel: { type: String, default: 'Total' },
  confirmLabel: { type: String, default: 'Confirm & Submit' },
  loading: { type: Boolean, default: false },
})

defineEmits(['confirm', 'back'])
</script>

<template>
  <transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0 scale-95"
    enter-to-class="opacity-100 scale-100" leave-active-class="transition duration-150 ease-in"
    leave-from-class="opacity-100" leave-to-class="opacity-0">
    <div v-if="show" class="enroll-confirm-overlay" @click.self="$emit('back')">
      <div class="enroll-confirm-card">
        <div class="enroll-confirm-header">
          <img v-if="icon" :src="icon" class="enroll-confirm-icon" alt="" />
          <h3 class="enroll-confirm-title">{{ title || 'Confirm Details' }}</h3>
          <p class="enroll-confirm-sub">{{ subtitle || 'Please review carefully before submitting.' }}</p>
        </div>

        <div class="enroll-confirm-body">
          <div v-for="row in rows" :key="row.key" class="enroll-confirm-row" :class="row.class">
            <span class="enroll-confirm-key">{{ row.key }}</span>
            <!-- Slot-based custom rendering per row -->
            <slot :name="`row-${row.key}`" :row="row">
              <AppBadge v-if="row.badge" :status="row.value" size="sm" />
              <span v-else class="enroll-confirm-val" :class="row.valueClass">{{ row.value ?? '—' }}</span>
            </slot>
          </div>

          <!-- Total Amount Row -->
          <div v-if="totalAmount !== undefined" class="enroll-confirm-row enroll-confirm-row--total">
            <span class="enroll-confirm-key">{{ totalLabel || 'Total' }}</span>
            <span class="enroll-confirm-total">${{ formatPrice(totalAmount) }}</span>
          </div>
        </div>

        <div class="enroll-confirm-actions">
          <button type="button" class="ui-btn-cancel" @click="$emit('back')">Go Back</button>
          <AppButton type="button" variant="primary" :loading="loading" class="ui-btn-premium"
            @click="$emit('confirm')">
            {{ confirmLabel || 'Confirm & Submit' }}
          </AppButton>
        </div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.enroll-confirm-overlay {
  @apply fixed inset-0 z-[1000] bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-lg;
}

.enroll-confirm-card {
  @apply w-full max-w-lg bg-white rounded-lg shadow-2xl border border-white/10 overflow-hidden flex flex-col;
}

.enroll-confirm-header {
  @apply p-xl bg-surface-light border-b-2 border-outline-std text-center flex flex-col items-center;
}

.enroll-confirm-icon {
  @apply w-20 h-20;
}

.enroll-confirm-title {
  @apply text-lg font-black text-content-dark;
}

.enroll-confirm-sub {
  @apply text-xs text-content-muted mt-1;
}

.enroll-confirm-body {
  @apply p-xl flex flex-col gap-md;
}

.enroll-confirm-row {
  @apply flex justify-between items-baseline gap-md pb-xs border-b border-outline-std/50 last:border-0;
}

.enroll-confirm-key {
  @apply text-3xs font-black text-content-muted/60 uppercase tracking-widest flex-shrink-0;
}

.enroll-confirm-val {
  @apply text-sm font-bold text-content-dark text-right;
}

.enroll-confirm-row--total {
  @apply mt-sm p-md bg-primary-soft rounded-sm border border-dashed border-primary items-center flex justify-between;
}

.enroll-confirm-total {
  @apply text-xl font-black text-primary-deep;
}

.enroll-confirm-actions {
  @apply p-xl bg-surface-light border-t-2 border-outline-std flex justify-end gap-md;
}

</style>

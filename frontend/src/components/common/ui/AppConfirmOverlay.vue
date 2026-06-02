<script setup>
import { computed } from 'vue'
import AppButton from '@/components/common/ui/AppButton.vue'
import AppBadge from '@/components/common/ui/AppBadge.vue'
import { formatPrice } from '@/utils/formatUtils'

defineProps({
  show: { type: Boolean, default: false },
  title: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  icon: { type: String, default: '' },
  image: { type: String, default: '' }, // For person modules profileURL or other context images
  rows: { type: Array, default: () => [] },
  totalAmount: { type: Number, default: undefined },
  totalLabel: { type: String, default: 'Total' },
  confirmLabel: { type: String, default: 'Confirm & Submit' },
  loading: { type: Boolean, default: false },
})

defineEmits(['confirm', 'back'])

const getBadgeConfig = (row) => {
  // If explicitly overridden locally, respect it
  if (row.badge) return { isBadge: true, type: row.type }

  // Central rule definitions
  const k = (row.key || '').toLowerCase()
  
  if (k === 'status') return { isBadge: true, type: undefined }
  if (k === 'type' || k === 'category') return { isBadge: true, type: 'blue' }
  if (k === 'level') return { isBadge: true, type: 'magenta' }
  if (k === 'converted') return { isBadge: true, type: 'green' }
  if (k === 'amount') return { isBadge: true, type: 'primary' }
  
  if (k.includes('date')) {
    if (k.includes('start')) return { isBadge: true, type: 'green' }
    if (k.includes('end')) return { isBadge: true, type: 'red' }
    return { isBadge: true, type: 'blue' }
  }
  
  if (k === 'issponsorship' || k === 'isprorated') {
    return { isBadge: true, type: row.value === 'Yes' ? 'blue' : 'gray' }
  }
  
  return { isBadge: false }
}
</script>

<template>
  <transition
    enter-active-class="transition duration-200 ease-out"
    enter-from-class="opacity-0 scale-95"
    enter-to-class="opacity-100 scale-100"
    leave-active-class="transition duration-150 ease-in"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div v-if="show" class="app-confirm-overlay" @click.self="$emit('back')">
      <div class="app-confirm-card">
        <div class="app-confirm-header">
          <img
            v-if="image"
            :src="image"
            class="w-24 h-24 mb-md object-cover rounded-2xl border-4 border-white shadow-sm"
            alt="Context Image"
          />
          <img v-else-if="icon" :src="icon" class="app-confirm-icon" alt="Icon" />
          <h3 class="app-confirm-title">{{ title || 'Confirm Details' }}</h3>
          <p class="app-confirm-sub">
            {{ subtitle || 'Please review carefully before submitting.' }}
          </p>
        </div>

        <div class="app-confirm-body">
          <div v-for="row in rows" :key="row.key" class="app-confirm-row" :class="row.class">
            <span class="app-confirm-key">{{ row.key }}</span>
            <!-- Slot-based custom rendering per row -->
            <slot :name="`row-${row.key}`" :row="row">
              <AppBadge v-if="getBadgeConfig(row).isBadge" :status="row.value" :type="getBadgeConfig(row).type" />
              <span v-else class="app-confirm-val" :class="row.valueClass">{{
                row.value ?? '—'
              }}</span>
            </slot>
          </div>

          <!-- Total Amount Row (Optional) -->
          <div v-if="totalAmount !== undefined" class="app-confirm-row app-confirm-row--total">
            <span class="app-confirm-key">{{ totalLabel || 'Total' }}</span>
            <span class="app-confirm-total">${{ formatPrice(totalAmount) }}</span>
          </div>
        </div>

        <div class="app-confirm-actions">
          <button type="button" class="ui-btn-cancel" @click="$emit('back')">Go back</button>
          <AppButton type="button" variant="primary" :loading="loading" @click="$emit('confirm')">
            {{ confirmLabel || 'Confirm & Submit' }}
          </AppButton>
        </div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.app-confirm-overlay {
  @apply fixed inset-0 z-dropdown bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-6;
}

.app-confirm-card {
  @apply w-full max-w-lg bg-white rounded-lg shadow-2xl border border-white/10 overflow-hidden flex flex-col;
}

.app-confirm-header {
  @apply p-8 bg-surface-subtle border-b-2 border-outline-std text-center flex flex-col items-center;
}

.app-confirm-icon {
  @apply w-20 h-20 mb-md;
}

.app-confirm-title {
  @apply text-xl font-bold text-content-dark;
}

.app-confirm-sub {
  @apply text-sm text-content-muted mt-1;
}

.app-confirm-body {
  @apply p-8 flex flex-col gap-4 overflow-y-auto scrollable-v max-h-[55vh];
}

.app-confirm-row {
  @apply flex justify-between items-baseline gap-4 pb-2 border-b border-outline-std/50 last:border-0;
}

.app-confirm-key {
  @apply text-xs font-semibold text-content-muted/60 flex-shrink-0;
}

.app-confirm-val {
  @apply text-base font-semibold text-content-dark text-right;
}

.app-confirm-row--total {
  @apply mt-2 p-4 bg-primary-soft rounded-sm border border-dashed border-primary items-center flex justify-between;
}

.app-confirm-total {
  @apply text-xl font-bold text-primary-deep;
}

.app-confirm-actions {
  @apply p-8 bg-surface-subtle border-t-2 border-outline-std flex justify-end gap-4;
}
</style>

<script setup>
import AppBadge from '@/components/common/ui/AppBadge.vue'
import { formatDate, formatPrice } from '@/utils/formatUtils'
import { getImageUrl } from '@/utils/assetHelper'

defineProps({
  items: { type: Array, default: () => [] },
  emptyMessage: { type: String, default: 'No payment records found.' }
})
</script>

<template>
  <div class="ui-table-scroll-wrapper">
    <table class="ui-premium-table">
      <thead>
        <tr>
          <th class="text-2xs font-bold text-content-muted">No</th>
          <th class="text-2xs font-bold text-content-muted">Transaction</th>
          <th class="text-2xs font-bold text-content-muted">Child</th>
          <th class="text-2xs font-bold text-content-muted">Program</th>
          <th class="text-2xs font-bold text-content-muted text-center">Amount</th>
          <th class="text-2xs font-bold text-content-muted">Method</th>
          <th class="text-2xs font-bold text-content-muted">Date</th>
          <th class="text-2xs font-bold text-content-muted text-center">Status</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(item, idx) in items" :key="item.id || idx">
          <td class="ui-data-label !text-content-dark font-bold">{{ idx + 1 }}</td>
          <td class="text-3xs font-bold text-content-muted tracking-tight">
            {{ item.transactionId || item.id.slice(0, 8) }}
          </td>
          <td class="font-bold text-content-dark tracking-tight text-sm">{{ item.studentName }}</td>
          <td class="font-bold text-content-dark tracking-tighter text-sm">{{ item.programName }}</td>
          <td class="text-center">
            <AppBadge :status="'$' + formatPrice(item.amount)" type="finance" :colorValue="item.paymentModeType" />
          </td>
          <td class="text-2xs font-bold text-content-muted ">{{ item.paymentMethod || 'N/A' }}</td>
          <td class="text-2xs font-bold text-content-muted tabular-nums">
            {{ formatDate(item.paidAt || item.enrollAt) }}
          </td>
          <td class="text-center">
            <AppBadge :status="item.paymentStatus" />
          </td>
        </tr>
        <tr v-if="items.length === 0">
          <td colspan="8" class="p-10 text-center text-content-muted italic text-sm">
            <div class="flex flex-col items-center justify-center opacity-30">
              <img :src="getImageUrl('common/no-data')" class="w-16 mb-4 grayscale" />
              <span>{{ emptyMessage }}</span>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
/* Hide scrollbar for Chrome, Safari and Opera */
.overflow-x-auto::-webkit-scrollbar {
  display: none;
}

/* Hide scrollbar for IE, Edge and Firefox */
.overflow-x-auto {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>

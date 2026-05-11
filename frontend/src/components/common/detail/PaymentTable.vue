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
          <th>No</th>
          <th>Transaction</th>
          <th>Child</th>
          <th>Program</th>
          <th class="text-center">Amount</th>
          <th>Method</th>
          <th>Date</th>
          <th class="text-center">Status</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(item, idx) in items" :key="item.id || idx">
          <td class="ui-data-label !text-content-dark">{{ idx + 1 }}</td>
          <td class="text-3xs font-semibold text-content-muted tracking-tight">
            {{ item.transactionId || item.id.slice(0, 8) }}
          </td>
          <td class="font-bold text-content-dark tracking-tight">{{ item.studentName }}</td>
          <td class="font-semibold text-content-dark tracking-tighter">{{ item.programName }}</td>
          <td class="text-center">
            <AppBadge :status="'$' + formatPrice(item.amount)" type="finance" :colorValue="item.paymentModeType" />
          </td>
          <td class="text-2xs font-bold text-content-muted ">{{ item.paymentMethod || 'N/A' }}</td>
          <td class="text-2xs font-semibold text-content-muted tabular-nums">
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

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
  <div class="overflow-x-auto rounded-md border border-gray-100 bg-white">
    <table class="w-full text-left border-collapse">
      <thead>
        <tr class="bg-gray-50/50">
          <th class=" p-md text-xs font-semibold text-content-muted uppercase tracking-widest">No</th>
          <th class=" p-md text-xs font-semibold text-content-muted uppercase tracking-widest">Transaction</th>
          <th class=" p-md text-xs font-semibold text-content-muted uppercase tracking-widest">Child</th>
          <th class=" p-md text-xs font-semibold text-content-muted uppercase tracking-widest">Program</th>
          <th class=" p-md text-xs font-semibold text-content-muted uppercase tracking-widest text-center">Amount</th>
          <th class=" p-md text-xs font-semibold text-content-muted uppercase tracking-widest">Method</th>
          <th class=" p-md text-xs font-semibold text-content-muted uppercase tracking-widest">Date</th>
          <th class=" p-md text-xs font-semibold text-content-muted uppercase tracking-widest text-center">Payment Status</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-gray-50">
        <tr v-for="(item, idx) in items" :key="item.id || idx" class="hover:bg-gray-50/50 transition-colors">
          <td class=" p-md text-xs font-semibold text-black">{{ idx + 1 }}</td>
          <td class=" p-md text-xs font-mono text-black uppercase">
            {{ item.transactionId || item.id.slice(0, 8).toUpperCase() }}
          </td>
          <td class=" p-md text-sm font-semibold text-black">{{ item.studentName }}</td>
          <td class=" p-md text-sm font-semibold text-black">{{ item.programName }}</td>
          <td class=" p-md text-sm font-semibold text-black text-center">
            <AppBadge :status="'$' + formatPrice(item.amount)" type="finance" :colorValue="item.paymentModeType" />
          </td>
          <td class=" p-md text-xs font-bold text-black uppercase">{{ item.paymentMethod || 'N/A' }}</td>
          <td class=" p-md text-xs font-semibold text-black tabular-nums">
            {{ formatDate(item.paidAt || item.enrollAt) }}
          </td>
          <td class=" p-md text-center">
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

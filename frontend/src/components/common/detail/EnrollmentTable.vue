<script setup>
import AppBadge from '@/components/common/ui/AppBadge.vue'
import { formatDate, formatPrice, calculateClassProgress } from '@/utils/formatUtils'
import { getImageUrl } from '@/utils/assetHelper'

const props = defineProps({
  items: { type: Array, default: () => [] },
  showChild: { type: Boolean, default: false },
  showSchedule: { type: Boolean, default: false },
  showDate: { type: Boolean, default: false },
  statusMode: { type: String, default: 'enrollment' }, // 'enrollment' | 'class'
  emptyMessage: { type: String, default: 'No records found.' }
})

const getClassStatus = (enroll) => {
  const cl = enroll.class
  if (!cl) return 'active'
  const progress = calculateClassProgress(
    cl.term?.startDate,
    cl.term?.endDate,
    cl.schedule?.day,
    cl.schedule?.time,
    cl.currentCount || cl.enrolledCount || 0,
    cl.capacity || cl.maxCapacity || 0
  )
  return progress.status
}
</script>

<template>
  <div class="overflow-x-auto rounded-md border border-gray-100 bg-white">
    <table class="w-full text-left border-collapse">
      <thead>
        <tr class="bg-gray-50/50">
          <th class=" p-md text-2xs font-semibold text-content-muted ">No</th>
          <th v-if="showChild" class=" p-md text-2xs font-semibold text-content-muted ">Child</th>
          <th class=" p-md text-2xs font-semibold text-content-muted ">Program</th>
          <th class=" p-md text-2xs font-semibold text-content-muted ">Branch</th>
          <th class=" p-md text-2xs font-semibold text-content-muted ">Term</th>
          <th v-if="showSchedule" class=" p-md text-2xs font-semibold text-content-muted ">Schedule</th>
          <th v-if="showDate" class=" p-md text-2xs font-semibold text-content-muted ">Date</th>
          <th class=" p-md text-2xs font-semibold text-content-muted  text-center">
            {{ statusMode === 'class' ? 'Class Status' : 'Enrollment Status' }}
          </th>
        </tr>
      </thead>
      <tbody class="divide-y divide-gray-50">
        <tr v-for="(item, idx) in items" :key="item.id || idx" class="hover:bg-gray-50/50 transition-colors">
          <td class=" p-md">{{ idx + 1 }}</td>
          <td v-if="showChild" class=" p-md">{{ item.studentName }}</td>
          <td class=" p-md">{{ item.programName }}</td>
          <td class=" p-md">
            <AppBadge :status="item.branchAbbr" :type="item.branchColor" />
          </td>
          <td class=" p-md tabular-nums">{{ item.termName }}</td>
          <td v-if="showSchedule" class=" p-md leading-tight">{{ item.classSchedule }}
          </td>
          <td v-if="showDate" class=" p-md tabular-nums">{{ formatDate(item.enrollAt)
          }}</td>
          <td class=" p-md text-center">
            <AppBadge :status="statusMode === 'class' ? getClassStatus(item) : item.enrollmentStatus" />
          </td>
        </tr>
        <tr v-if="items.length === 0">
          <td :colspan="10" class="p-10 text-center text-content-muted italic text-sm">
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

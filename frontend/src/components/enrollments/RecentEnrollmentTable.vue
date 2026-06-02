<script setup>
import AppBadge from '@/components/common/ui/AppBadge.vue'
import AppTable from '@/components/common/data/AppTable.vue'
import { formatDate, formatPrice } from '@/utils/formatUtils'
import {
  getProgramProfileURL,
  getParentProfileURL,
  getStudentProfileURL,
} from '@/utils/assetHelper'

defineProps({
  enrollments: {
    type: Array,
    default: () => [],
  },
})


const enrollmentHeaders = [
  { label: 'No', width: '40px', align: 'center' },
  { label: 'Parent' },
  { label: 'Child' },
  { label: 'Program' },
  { label: 'Status', width: '90px', align: 'center' },
  { label: 'Amount', width: '90px', align: 'center' },
  { label: 'Enrolled Date', align: 'center' },
]

</script>

<template>
  <div class="w-full h-full">
    <AppTable :headers="enrollmentHeaders" :empty="enrollments.length === 0">
      <template #toolbar>
        <div class="ui-section-header border-none flex items-center gap-md mb-4">
          <h3 class="ui-section-title whitespace-nowrap">Recent Enrollment</h3>
          <div class="ui-section-divider"></div>
        </div>
      </template>
      <tr
        v-for="(item, index) in enrollments.slice(0, 5)"
        :key="item.id || index"
        class="ui-row"
      >
        <td
          class="ui-cell !py-4 text-center"
          :style="{
            width: enrollmentHeaders[0].width,
            flex: '0 0 auto',
            minWidth: enrollmentHeaders[0].width,
          }"
        >
          <span class="font-bold text-content-dark text-sm">{{ index + 1 }}</span>
        </td>
        <td class="ui-cell !py-4 overflow-hidden" :style="{ flex: '1 1 0%', minWidth: 0 }">
          <div class="ui-identity-cell min-w-0 w-full">
            <div class="ui-avatar">
              <img :src="getParentProfileURL(item.parent?.profileURL)" alt="parent" />
            </div>
            <div class="ui-identity-info min-w-0">
              <span
                class="truncate block font-bold text-content-dark text-sm"
                :title="item.parent?.name"
                >{{ item.parent?.name }}</span
              >
            </div>
          </div>
        </td>
        <td class="ui-cell !py-4 overflow-hidden" :style="{ flex: '1 1 0%', minWidth: 0 }">
          <div class="ui-identity-cell min-w-0 w-full">
            <div class="ui-avatar">
              <img :src="getStudentProfileURL(item.student?.profileURL)" alt="child" />
            </div>
            <div class="ui-identity-info min-w-0">
              <span
                class="truncate block font-bold text-content-dark text-sm"
                :title="item.student?.name"
                >{{ item.student?.name }}</span
              >
            </div>
          </div>
        </td>
        <td class="ui-cell !py-4 overflow-hidden" :style="{ flex: '1 1 0%', minWidth: 0 }">
          <div class="ui-identity-cell min-w-0 w-full">
            <div class="ui-avatar">
              <img
                :src="
                  getProgramProfileURL(
                    item.program?.profileURL,
                    item.program?.category?.name || item.program?.category,
                    item.program?.category?.profileURL,
                  )
                "
                :alt="item.programName"
              />
            </div>
            <span class="truncate block font-bold text-content-dark text-sm">{{
              item.programName
            }}</span>
          </div>
        </td>
        <td
          class="ui-cell !py-4 text-center"
          :style="{
            width: enrollmentHeaders[4].width,
            flex: '0 0 auto',
            minWidth: enrollmentHeaders[4].width,
          }"
        >
          <AppBadge :status="item.status" />
        </td>
        <td
          class="ui-cell !py-4 text-center"
          :style="{
            width: enrollmentHeaders[5].width,
            flex: '0 0 auto',
            minWidth: enrollmentHeaders[5].width,
          }"
        >
          <AppBadge
            :status="'$' + formatPrice(item.amount || 0)"
            :colorValue="item.paymentModeType"
            type="finance"
          />
        </td>
        <td
          class="ui-cell !py-4 text-center overflow-hidden"
          :style="{ flex: '1 1 0%', minWidth: 0 }"
        >
          <span class="truncate block font-bold text-content-muted text-xs tabular-nums">{{
            formatDate(item.enrollAt)
          }}</span>
        </td>
      </tr>
    </AppTable>
  </div>
</template>

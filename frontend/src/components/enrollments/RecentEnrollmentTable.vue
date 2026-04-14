<script setup>
import { useRouter } from 'vue-router'
import StatusBadge from '@/components/common/ui/StatusBadge.vue'
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

const router = useRouter()

const enrollmentHeaders = [
  { label: 'No', width: '40px', align: 'center' },
  { label: 'Parent' },
  { label: 'Child' },
  { label: 'Program' },
  { label: 'Status', width: '90px', align: 'center' },
  { label: 'Amount', width: '90px', align: 'center' },
  { label: 'Enrolled Date', align: 'center' },
]

const navigateToDetail = (item) => {
  if (item.id) {
    router.push(`/enrollments/${item.id}`)
  }
}
</script>

<template>
  <div class="ui-detail-card !p-lg">
    <div class="ui-section-header border-none gap-md">
      <h3 class="ui-section-title">Recent Enrollment</h3>
      <div class="ui-section-divider"></div>
    </div>

    <AppTable :headers="enrollmentHeaders" :empty="enrollments.length === 0">
      <tr v-for="item in enrollments" :key="item.id || item.no" class="ui-row" @click="navigateToDetail(item)">
        <td class="ui-cell !py-4 text-center"
          :style="{ width: enrollmentHeaders[0].width, flex: '0 0 auto', minWidth: enrollmentHeaders[0].width }">
          {{ item.no }}
        </td>
        <td class="ui-cell !py-4 overflow-hidden" :style="{ flex: '1 1 0%', minWidth: 0 }">
          <div class="ui-identity-cell min-w-0 w-full">
            <div class="ui-avatar">
              <img :src="getParentProfileURL(item.parent?.profileURL)" alt="parent" />
            </div>
            <div class="ui-identity-info min-w-0">
              <span class="text-sm font-bold text-content-dark truncate block" :title="item.parent?.name">{{
                item.parent?.name }}</span>
            </div>
          </div>
        </td>
        <td class="ui-cell !py-4 overflow-hidden" :style="{ flex: '1 1 0%', minWidth: 0 }">
          <div class="ui-identity-cell min-w-0 w-full">
            <div class="ui-avatar">
              <img :src="getStudentProfileURL(item.student?.profileURL)" alt="child" />
            </div>
            <div class="ui-identity-info min-w-0">
              <span class="text-sm font-bold text-content-dark truncate block" :title="item.student?.name">{{
                item.student?.name }}</span>
            </div>
          </div>
        </td>
        <td class="ui-cell !py-4 overflow-hidden" :style="{ flex: '1 1 0%', minWidth: 0 }">
          <div class="ui-identity-cell min-w-0 w-full">
            <div class="ui-avatar">
              <img :src="getProgramProfileURL(item.program?.profileURL)" :alt="item.program?.title" />
            </div>
            <span class="text-sm font-bold text-content-dark truncate block" :title="item.program?.title">{{
              item.program?.title
            }}</span>
          </div>
        </td>
        <td class="ui-cell !py-4 text-center"
          :style="{ width: enrollmentHeaders[4].width, flex: '0 0 auto', minWidth: enrollmentHeaders[4].width }">
          <StatusBadge :status="item.status" />
        </td>
        <td class="ui-cell !py-4 text-center"
          :style="{ width: enrollmentHeaders[5].width, flex: '0 0 auto', minWidth: enrollmentHeaders[5].width }">
          <StatusBadge :status="'$' + formatPrice(item.amount)"
            :type="(item.mode || 'Full').toLowerCase() === 'partial' ? 'purple' : 'magenta'" />
        </td>
        <td class="ui-cell !py-4 text-center text-xs text-content-muted font-bold overflow-hidden"
          :style="{ flex: '1 1 0%', minWidth: 0 }">
          <span class="truncate block" :title="formatDate(item.date)">{{ formatDate(item.date) }}</span>
        </td>
      </tr>
    </AppTable>
  </div>
</template>

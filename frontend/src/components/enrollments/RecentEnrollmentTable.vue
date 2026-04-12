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
  { label: 'No', width: '30px', align: 'center' },
  { label: 'Parent', width: '250px' },
  { label: 'Child', width: '250px' },
  { label: 'Program', width: '200px' },
  { label: 'Status', width: '100px', align: 'center' },
  { label: 'Amount', width: '100px', align: 'center' },
  { label: 'Enrolled Date', width: '200px', align: 'center' },
]

const navigateToDetail = (item) => {
  if (item.id) {
    router.push(`/enrollments/${item.id}`)
  }
}
</script>

<template>
  <div class="ui-detail-card !p-lg">
    <div class="ui-section-header !mb-md !pb-xs border-none">
      <h3 class="ui-section-title !text-base">Recent Enrollment</h3>
    </div>

    <AppTable :headers="enrollmentHeaders" :empty="enrollments.length === 0">
      <tr v-for="item in enrollments" :key="item.id || item.no" class="ui-row" @click="navigateToDetail(item)">
        <td class="ui-cell !py-4 text-center" :style="{ width: enrollmentHeaders[0].width }">
          {{ item.no }}
        </td>
        <td class="ui-cell !py-4" :style="{ width: enrollmentHeaders[1].width }">
          <div class="ui-identity-cell">
            <div class="ui-avatar">
              <img :src="getParentProfileURL(item.parent?.profileURL)" alt="parent" />
            </div>
            <div class="ui-identity-info">
              <span class="text-sm font-bold text-content-dark">{{ item.parent?.name }}</span>
            </div>
          </div>
        </td>
        <td class="ui-cell !py-4" :style="{ width: enrollmentHeaders[2].width }">
          <div class="ui-identity-cell">
            <div class="ui-avatar">
              <img :src="getStudentProfileURL(item.student?.profileURL)" alt="child" />
            </div>
            <div class="ui-identity-info">
              <span class="text-sm font-bold text-content-dark">{{ item.student?.name }}</span>
            </div>
          </div>
        </td>
        <td class="ui-cell !py-4" :style="{ width: enrollmentHeaders[3].width }">
          <div class="ui-identity-cell">
            <div class="ui-avatar">
              <img :src="getProgramProfileURL(item.program?.profileURL)" :alt="item.program?.title" />
            </div>
            <span class="text-sm font-bold text-content-dark truncate">{{
              item.program?.title
            }}</span>
          </div>
        </td>
        <td class="ui-cell !py-4 text-center" :style="{ width: enrollmentHeaders[4].width }">
          <StatusBadge :status="item.status" />
        </td>
        <td class="ui-cell !py-4 text-center" :style="{ width: enrollmentHeaders[5].width }">
          <StatusBadge :status="'$' + formatPrice(item.amount)"
            :type="(item.mode || 'Full').toLowerCase() === 'partial' ? 'purple' : 'magenta'" />
        </td>
        <td class="ui-cell !py-4 text-center text-xs text-content-muted font-bold"
          :style="{ width: enrollmentHeaders[6].width }">
          {{ formatDate(item.date) }}
        </td>
      </tr>
    </AppTable>
  </div>
</template>

<script setup>
import AppBadge from '@/components/common/ui/AppBadge.vue'
import { formatPrice, formatDateOnly } from '@/utils/formatUtils'

defineProps({
  selectedProgram: { type: Object, default: null },
  selectedOffering: { type: Object, required: true },
  sessionInfo: { type: Object, default: null }
})
</script>

<template>
  <div class="enroll-twin-card">
    <span class="enroll-section-label">Offering Overview</span>
    <div class="enroll-info-grid">
      <div class="enroll-info-item">
        <span class="enroll-info-key">Program</span>
        <span class="enroll-info-val">{{ selectedProgram?.name || '—' }}</span>
      </div>
      <div class="enroll-info-item">
        <span class="enroll-info-key">Term</span>
        <span class="enroll-info-val">{{ selectedOffering.termName }}</span>
      </div>
      <div class="enroll-info-item col-span-2">
        <span class="enroll-info-key">Schedule</span>
        <span class="enroll-info-val text-primary font-bold">
          {{ selectedOffering.schedule?.day }} ({{ selectedOffering.schedule?.time }})
        </span>
      </div>
      <div class="enroll-info-item">
        <span class="enroll-info-key">Branch</span>
        <AppBadge
          :status="selectedOffering.branch?.abbr || selectedOffering.branch?.name"
          :type="selectedOffering.branch?.color || 'blue'"
        />
      </div>
      <div class="enroll-info-item">
        <span class="enroll-info-key">Students</span>
        <span class="enroll-info-val">{{ selectedOffering.studentCount }}</span>
      </div>
      <div class="enroll-info-item">
        <span class="enroll-info-key">Start Date</span>
        <AppBadge :status="formatDateOnly(selectedOffering.startDate)" type="green" />
      </div>
      <div class="enroll-info-item">
        <span class="enroll-info-key">End Date</span>
        <AppBadge :status="formatDateOnly(selectedOffering.endDate)" type="red" />
      </div>
      <div class="enroll-info-item">
        <span class="enroll-info-key">Remaining</span>
        <span class="enroll-info-val">{{ sessionInfo?.remaining ?? '—' }}</span>
      </div>
      <div class="enroll-info-item">
        <span class="enroll-info-key">Base Price</span>
        <AppBadge
          :status="'$' + formatPrice(selectedProgram?.basePrice || 0)"
          type="blue"
        />
      </div>
    </div>
  </div>
</template>

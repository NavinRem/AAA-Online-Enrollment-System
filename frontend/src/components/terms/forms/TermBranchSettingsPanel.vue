<script setup>
import AppInput from '@/components/common/ui/AppInput.vue'
import AppButton from '@/components/common/ui/AppButton.vue'
import AppBadge from '@/components/common/ui/AppBadge.vue'

const props = defineProps({
  localData: { type: Object, required: true },
  errors: { type: Object, default: () => ({}) },
  branches: { type: Array, default: () => [] },
})

const emit = defineEmits([
  'clear-error',
  'apply-master-date',
  'update-branch-start-date',
  'update:localData',
])

const updateField = (field, value) => {
  const newData = { ...props.localData, [field]: value }
  emit('update:localData', newData)
}

const calculateBranchEndDate = (branchId) => {
  const setting = props.localData.branchSettings?.find(
    (s) => String(s.branchId) === String(branchId),
  )
  return setting?.endDate || ''
}

const getBranchSetting = (branchId) => {
  let setting = props.localData.branchSettings?.find((s) => String(s.branchId) === String(branchId))
  return setting || { startDate: '' }
}

const handleUpdateBranchStartDate = (branchId, val) => {
  emit('update-branch-start-date', branchId, val)
}
</script>

<template>
  <div
    v-if="localData.branchIds.length > 0"
    class="flex flex-col gap-4 mt-2 border-t border-outline-std pt-4"
  >
    <div class="flex items-center justify-between">
      <label class="text-xs font-bold text-content-muted">Branch-Specific Scheduling</label>
      <span class="text-xs font-medium text-primary italic"
        >Different dates per branch? Edit below</span
      >
    </div>

    <!-- Master Date Applier -->
    <div class="flex items-end gap-3 p-3 bg-primary/5 rounded-md border border-primary/20">
      <div class="flex-1">
        <AppInput
          :modelValue="localData.startDate"
          @update:modelValue="(val) => updateField('startDate', val)"
          type="date"
          label="Master Start Date"
          size="sm"
          @input="$emit('clear-error', 'startDate')"
        />
      </div>
      <AppButton
        type="button"
        variant="primary"
        size="sm"
        class="mb-1"
        @click="$emit('apply-master-date')"
      >
        Apply to All
      </AppButton>
    </div>
    <p v-if="errors.startDate" class="text-xs font-semibold text-error pl-1 mt-0.5">
      {{ errors.startDate }}
    </p>

    <div class="grid grid-cols-1 gap-3 mt-2">
      <div
        v-for="branchId in localData.branchIds"
        :key="branchId"
        class="p-4 bg-surface-subtle/50 rounded-md border border-outline-std hover:border-primary/30 transition-all"
      >
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-2">
            <AppBadge
              :status="branches.find((b) => String(b.id) === String(branchId))?.abbr"
              :type="branches.find((b) => String(b.id) === String(branchId))?.color || 'blue'"
            />
            <span class="text-sm font-bold text-content-dark tracking-tight">{{
              branches.find((b) => String(b.id) === String(branchId))?.name
            }}</span>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <AppInput
            :modelValue="getBranchSetting(branchId).startDate"
            type="date"
            label="Start Date"
            size="sm"
            @update:modelValue="(val) => handleUpdateBranchStartDate(branchId, val)"
          />
          <AppInput
            :modelValue="calculateBranchEndDate(branchId)"
            type="date"
            label="End Date"
            size="sm"
            readonly
            disabled
          />
        </div>
      </div>
    </div>
  </div>
</template>

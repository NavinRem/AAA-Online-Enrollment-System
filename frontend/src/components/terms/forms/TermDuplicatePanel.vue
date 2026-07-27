<script setup>
import AppSelect from '@/components/common/ui/AppSelect.vue'
import AppBadge from '@/components/common/ui/AppBadge.vue'
import { formatDateOnly } from '@/utils/formatUtils'

const props = defineProps({
  localData: { type: Object, required: true },
  duplicateTermOptions: { type: Array, default: () => [] },
})

const emit = defineEmits(['update:localData'])

const updateField = (field, value) => {
  const newData = { ...props.localData, [field]: value }
  emit('update:localData', newData)
}
</script>

<template>
  <AppSelect
    :modelValue="localData.duplicateFromTermId"
    @update:modelValue="(val) => updateField('duplicateFromTermId', val)"
    :items="duplicateTermOptions"
    label="Duplicate Offerings From"
    placeholder="Select a recent term to clone..."
  >
    <template #selected="{ item }">
      <div v-if="item" class="flex items-center justify-between w-full gap-4">
        <span class="font-bold text-content-dark truncate flex-1">{{ item.name }}</span>
        <div class="flex items-center gap-2 shrink-0">
          <AppBadge :status="formatDateOnly(item.startDate)" type="green" />
          <span class="text-content-muted text-xs">→</span>
          <AppBadge :status="formatDateOnly(item.endDate)" type="red" />
        </div>
      </div>
      <span v-else class="text-content-light text-sm italic opacity-70"
        >Select a recent term to clone...</span
      >
    </template>
    <template #item="{ item }">
      <div class="flex items-center justify-between w-full gap-4">
        <span class="font-bold text-content-dark truncate flex-1">{{ item.name }}</span>
        <div class="flex items-center gap-2 shrink-0">
          <AppBadge :status="formatDateOnly(item.startDate)" type="green" />
          <span class="text-content-muted text-xs">→</span>
          <AppBadge :status="formatDateOnly(item.endDate)" type="red" />
        </div>
      </div>
    </template>
  </AppSelect>
</template>

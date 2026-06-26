<script setup>
import AppInput from '@/components/common/ui/AppInput.vue'
import AppAlert from '@/components/common/ui/AppAlert.vue'
import { getActionIcon } from '@/utils/assetHelper'

const props = defineProps({
  form: { type: Object, required: true },
  displaySummary: { type: Object, default: null },
  errors: { type: Object, default: () => ({}) },
  shaking: { type: Object, default: () => ({}) },
})

const emit = defineEmits(['update:form', 'clear-error'])

const updateForm = (field, value) => {
  emit('update:form', { ...props.form, [field]: value })
}
</script>

<template>
  <div class="flex flex-col gap-lg">
    <!-- Identity Summary (consistent with pay modal) -->
    <div class="enroll-twin-card" v-if="displaySummary">
      <div class="enroll-info-grid">
        <div class="flex flex-col gap-xs">
          <span class="text-2xs font-semibold text-content-muted uppercase tracking-wider"
            >Parent</span
          >
          <div class="flex items-center gap-sm">
            <img :src="displaySummary.parentAvatar" class="w-8 h-8 rounded-full" />
            <span class="text-sm font-semibold">{{ displaySummary.parentName }}</span>
          </div>
        </div>
        <div class="flex flex-col gap-xs">
          <span class="text-2xs font-semibold text-content-muted uppercase tracking-wider"
            >Student</span
          >
          <div class="flex items-center gap-sm">
            <img :src="displaySummary.studentAvatar" class="w-8 h-8 rounded-full" />
            <span class="text-sm font-semibold">{{ displaySummary.studentName }}</span>
          </div>
        </div>
        <div class="flex flex-col gap-xs col-span-2">
          <span class="text-2xs font-semibold text-content-muted uppercase tracking-wider"
            >Program</span
          >
          <div class="flex items-center gap-sm">
            <img :src="displaySummary.programAvatar" class="w-8 h-8 rounded-full" />
            <span class="text-sm font-semibold">{{ displaySummary.programName }}</span>
          </div>
        </div>
      </div>
    </div>

    <AppAlert type="error" class="mb-lg">
      <div class="flex gap-3">
        <img :src="getActionIcon('delete')" class="w-5 h-5 mt-0.5" />
        <div class="flex flex-col gap-0.5">
          <strong class="text-sm font-semibold tracking-tight">Permanent Data Deletion</strong>
          <p class="text-xs opacity-90 mt-1">
            This action will completely remove this enrollment from the system. Type
            <strong>DELETE</strong> below to confirm.
          </p>
        </div>
      </div>
    </AppAlert>

    <AppInput
      :modelValue="form.deleteConfirm"
      @update:modelValue="updateForm('deleteConfirm', $event)"
      label="Authorization Confirmation"
      placeholder='Type "DELETE" to confirm'
      required
      :error="errors.deleteConfirm"
      :shake="shaking.deleteConfirm"
      @input="$emit('clear-error', 'deleteConfirm')"
    >
      <template #label-extra>
        <span class="block text-2xs font-semibold mt-0.5">
          Type <span class="text-error px-1 font-semibold">DELETE</span> to authorize this
          permanent action
        </span>
      </template>
    </AppInput>
  </div>
</template>

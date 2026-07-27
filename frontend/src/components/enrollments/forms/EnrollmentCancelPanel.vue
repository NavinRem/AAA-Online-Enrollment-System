<script setup>
import AppInput from '@/components/common/ui/AppInput.vue'
import AppAlert from '@/components/common/ui/AppAlert.vue'

const props = defineProps({
  form: { type: Object, required: true },
  errors: { type: Object, default: () => ({}) },
  shaking: { type: Object, default: () => ({}) },
})

const emit = defineEmits(['update:form', 'clear-error'])

const updateForm = (field, value) => {
  emit('update:form', { ...props.form, [field]: value })
}

const cancelPresets = ['Schedule Conflict', 'Relocation', 'Financial Issue', 'Duplicated']
const selectPreset = (preset) => {
  if (props.form.reason === preset) {
    updateForm('reason', '')
  } else {
    updateForm('reason', preset)
  }
}
</script>

<template>
  <div class="flex flex-col gap-lg">
    <AppAlert type="warning">
      <div class="flex flex-col gap-0.5">
        <strong class="text-sm font-semibold tracking-tight">Program Termination Warning</strong>
        <span class="text-xs opacity-90 font-medium"
          >Marking this enrollment as cancelled will release the reserved seat. Cancellation can be
          undone later. Paid enrollments will remain in historical records but will no longer be
          marked for future attendance.</span
        >
      </div>
    </AppAlert>

    <div class="flex flex-col gap-xs">
      <div class="flex flex-wrap gap-xs mb-sm mt-1">
        <button
          v-for="preset in cancelPresets"
          :key="preset"
          type="button"
          class="px-md py-1.5 border-2 rounded-sm text-2xs cursor-pointer font-semibold transition-all"
          :class="
            form.reason === preset
              ? 'bg-primary text-white border-primary shadow-md scale-105'
              : 'bg-surface-light border-outline-std/50 hover:bg-primary-soft hover:text-primary hover:border-primary/20'
          "
          @click="selectPreset(preset)"
        >
          {{ preset }}
        </button>
      </div>
      <AppInput
        :modelValue="form.reason"
        @update:modelValue="updateForm('reason', $event)"
        type="textarea"
        label="Cancellation Logic / Reason"
        required
        :error="errors.reason"
        :shake="shaking.reason"
        placeholder="Provide a detailed cancel reason..."
        @input="$emit('clear-error', 'reason')"
      />
    </div>
  </div>
</template>

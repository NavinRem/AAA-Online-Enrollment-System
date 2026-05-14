<script setup>
import { computed, watch } from 'vue'
import AppModal from '../common/ui/AppModal.vue'
import AppButton from '../common/ui/AppButton.vue'
import AppInput from '../common/ui/AppInput.vue'
import AppAlert from '../common/ui/AppAlert.vue'
import AppConfirmOverlay from '../common/ui/AppConfirmOverlay.vue'
import { getActionIcon } from '@/utils/assetHelper'
import { useForm } from '@/composables/useForm'

const props = defineProps({
  isOpen: Boolean,
  type: {
    type: String,
    default: 'add',
  },
  level: Object,
  loading: Boolean,
  error: String,
  success: String,
})

const emit = defineEmits(['close', 'submit'])

const { form, errors, shaking, validate, clearError, triggerShake, resetForm } = useForm({
  name: '',
  description: '',
}, { autoClear: 3000 })

watch(
  () => props.isOpen,
  (val) => {
    if (val) {
      resetForm({
        name: props.level?.name || '',
        description: props.level?.description || '',
      })
    }
  },
)

const handleSubmit = () => {
  if (props.type === 'delete') {
    emit('submit', { id: props.level?.id })
    return
  }

  const isValid = validate({
    required: ['name'],
  })

  if (!isValid) {
    if (errors.name) triggerShake('name')
    return
  }

  emit('submit', { ...form })
}

const modalTitle = computed(() => {
  if (props.type === 'edit') return 'Edit Difficulty Level'
  if (props.type === 'delete') return 'Delete Level'
  return 'New Difficulty Level'
})
</script>

<template>
  <AppModal
    :show="isOpen"
    :title="modalTitle"
    :icon="getActionIcon(type === 'delete' ? 'delete' : 'plus')"
    :error="error"
    :success="success"
    maxWidth="500px"
    @close="emit('close')"
  >
    <div v-if="type === 'delete'" class="p-2">
      <AppAlert type="error" class="mb-6">
        <div class="flex flex-col gap-1">
          <strong class="text-sm font-bold">Confirm Deletion</strong>
          <p class="text-xs opacity-90">
            Are you sure you want to delete the level '{{ level?.name }}'? This will disconnect all programs currently using this level.
          </p>
        </div>
      </AppAlert>

      <div class="flex justify-end gap-3">
        <AppButton variant="cancel" @click="emit('close')">Cancel</AppButton>
        <AppButton variant="danger" :loading="loading" @click="handleSubmit">
          Delete Level
        </AppButton>
      </div>
    </div>

    <form v-else @submit.prevent="handleSubmit" class="flex flex-col gap-lg animate-in fade-in slide-in-from-bottom-4 duration-500">
      <AppInput
        v-model="form.name"
        label="Level Name"
        placeholder="e.g. Beginner, Advanced"
        required
        :error="errors.name"
        :shake="shaking.name"
        @input="clearError('name')"
      />
      <AppInput
        v-model="form.description"
        label="Description"
        placeholder="Briefly describe this level..."
        @input="clearError('description')"
      />

      <div class="flex justify-end gap-3 pt-4">
        <AppButton variant="cancel" @click="emit('close')">Cancel</AppButton>
        <AppButton variant="primary" type="submit" :loading="loading">
          {{ type === 'add' ? 'Create Level' : 'Save Changes' }}
        </AppButton>
      </div>
    </form>
  </AppModal>
</template>

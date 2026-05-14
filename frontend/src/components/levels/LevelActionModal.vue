<script setup>
import { ref, watch } from 'vue'
import AppModal from '../common/ui/AppModal.vue'
import AppButton from '../common/ui/AppButton.vue'
import AppInput from '../common/ui/AppInput.vue'
import AppConfirmOverlay from '../common/ui/AppConfirmOverlay.vue'

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

const formData = ref({
  name: '',
  description: '',
})

watch(
  () => props.level,
  (newLvl) => {
    if (newLvl) {
      formData.value = {
        name: newLvl.name || '',
        description: newLvl.description || '',
      }
    } else {
      formData.value = {
        name: '',
        description: '',
      }
    }
  },
  { immediate: true },
)

const handleSubmit = () => {
  emit('submit', formData.value)
}
</script>

<template>
  <AppModal
    :isOpen="isOpen"
    :title="
      type === 'add' ? 'New Difficulty Level' : type === 'edit' ? 'Edit Level' : 'Delete Level'
    "
    @close="emit('close')"
  >
    <div v-if="type === 'delete'" class="p-6">
      <AppConfirmOverlay
        :isOpen="true"
        title="Confirm Deletion"
        :message="`Are you sure you want to delete the level '${level?.name}'? This will disconnect all programs currently using this level.`"
        :confirmText="`Delete ${level?.name}`"
        :loading="loading"
        :error="error"
        :success="success"
        @close="emit('close')"
        @confirm="handleSubmit"
      />
    </div>

    <form v-else @submit.prevent="handleSubmit" class="p-6 space-y-4">
      <AppInput
        label="Level Name"
        v-model="formData.name"
        placeholder="e.g. Beginner, Advanced"
        required
      />
      <AppInput
        label="Description"
        v-model="formData.description"
        placeholder="Briefly describe this level..."
      />

      <div
        v-if="error"
        class="p-3 bg-error-soft text-error text-xs font-semibold rounded-lg border border-error/10"
      >
        {{ error }}
      </div>

      <div
        v-if="success"
        class="p-3 bg-success-soft text-success text-xs font-semibold rounded-lg border border-success/10"
      >
        {{ success }}
      </div>

      <div class="flex justify-end gap-3 pt-4">
        <AppButton variant="ghost" type="button" @click="emit('close')">Cancel</AppButton>
        <AppButton variant="primary" type="submit" :loading="loading">
          {{ type === 'add' ? 'Create Level' : 'Save Changes' }}
        </AppButton>
      </div>
    </form>
  </AppModal>
</template>

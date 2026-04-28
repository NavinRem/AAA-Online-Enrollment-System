<script setup>
import { ref, watch } from 'vue'
import AppModal from '@/components/common/ui/AppModal.vue'
import AppButton from '@/components/common/ui/AppButton.vue'
import AppInput from '@/components/common/ui/AppInput.vue'
import AppSelect from '@/components/common/ui/AppSelect.vue'
import { getActionIcon } from '@/utils/assetHelper'

const props = defineProps({
  isOpen: Boolean,
  type: {
    type: String,
    default: 'add' // 'add', 'edit'
  },
  teacher: Object,
  loading: Boolean
})

const emit = defineEmits(['close', 'submit'])

const form = ref({
  name: '',
  email: '',
  status: 'active'
})

watch(
  () => props.teacher,
  (newVal) => {
    if (newVal) {
      form.value = {
        name: newVal.name || '',
        email: newVal.email || '',
        status: newVal.status || 'active',
        profileURL: newVal.profileURL || '',
      }
    } else {
      form.value = {
        name: '',
        email: '',
        status: 'active',
        profileURL: '',
      }
    }
  },
  { immediate: true },
)

const handleSubmit = () => {
  const payload = { ...form.value }

  // Strip system-managed fields that would fail strict backend validation
  const forbidden = ['id', '_id', 'createdAt', 'updatedAt']
  forbidden.forEach((key) => delete payload[key])

  emit('submit', payload)
}
</script>

<template>
  <AppModal :show="isOpen" :title="type === 'edit' ? 'Update Teacher' : 'Add Teacher'" maxWidth="500px"
    @close="$emit('close')">
    <form @submit.prevent="handleSubmit" class="flex flex-col gap-6">
      <AppInput v-model="form.name" label="Full Professional Name" placeholder="e.g. Dr. John Doe" required />

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <AppInput v-model="form.email" type="email" label="Contact Email" placeholder="teacher@aaa.edu" required />
      </div>

      <AppSelect v-model="form.status" label="Deployment Status" :items="[
        { id: 'active', name: 'Active Duty' },
        { id: 'inactive', name: 'On Leave / Inactive' },
      ]" />

      <div class="flex items-center justify-end gap-3 mt-4">
        <AppButton variant="cancel" @click="$emit('close')">Cancel</AppButton>
        <AppButton type="submit" variant="primary" :loading="loading" class="px-8 font-black">
          {{ type === 'add' ? 'Add' : 'Update' }}
        </AppButton>
      </div>
    </form>
  </AppModal>
</template>

<script setup>
import { reactive, watch, computed } from 'vue'
import AppModal from '@/components/common/ui/AppModal.vue'
import AppButton from '@/components/common/ui/AppButton.vue'
import AppInput from '@/components/common/ui/AppInput.vue'
import AppSelect from '@/components/common/ui/AppSelect.vue'
import AppAlert from '@/components/common/ui/AppAlert.vue'
import { getActionIcon } from '@/utils/assetHelper'

const props = defineProps({
  isOpen: Boolean,
  type: { type: String, default: 'add' },
  schedule: Object,
  loading: Boolean,
  error: String,
  success: String,
})

const emit = defineEmits(['close', 'submit'])

const form = reactive({
  day: 'Saturday',
  time: '',
  status: 'active',
})

const dayOptions = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  .map((day) => ({ id: day, name: day }))

const title = computed(() => {
  if (props.type === 'delete') return 'Delete Schedule'
  if (props.type === 'edit') return 'Edit Schedule'
  return 'New Schedule'
})

watch(
  () => [props.isOpen, props.schedule],
  () => {
    form.day = props.schedule?.day || 'Saturday'
    form.time = props.schedule?.time || ''
    form.status = props.schedule?.status || 'active'
  },
  { immediate: true },
)

const handleSubmit = () => {
  if (props.type === 'delete') {
    emit('submit', { id: props.schedule?.id })
    return
  }
  emit('submit', { day: form.day, time: form.time, status: form.status })
}
</script>

<template>
  <AppModal :show="isOpen" :title="title" :icon="getActionIcon(type === 'delete' ? 'delete' : 'plus')"
    :error="error" :success="success" maxWidth="520px" @close="emit('close')">
    <form class="flex flex-col gap-4" @submit.prevent="handleSubmit">
      <template v-if="type !== 'delete'">
        <AppSelect v-model="form.day" :items="dayOptions" label="Day" required :searchable="false" />
        <AppInput v-model="form.time" label="Time" placeholder="e.g. 9:00 AM - 10:30 AM" required />
      </template>

      <AppAlert v-else type="error">
        Delete {{ schedule?.day }} {{ schedule?.time }}? Existing class and term snapshots keep their historical copy.
      </AppAlert>

      <div class="flex justify-end gap-3 pt-2">
        <button type="button" class="ui-btn-cancel" @click="emit('close')">Cancel</button>
        <AppButton type="submit" :variant="type === 'delete' ? 'danger' : 'primary'" :loading="loading">
          {{ type === 'delete' ? 'Delete' : 'Save' }}
        </AppButton>
      </div>
    </form>
  </AppModal>
</template>

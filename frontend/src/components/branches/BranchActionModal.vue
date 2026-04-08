<template>
  <AppModal :show="isOpen" :title="modalTitle" variant="action" @close="$emit('close')" :icon="modalIcon">
    <AppAlert :show="!!error" type="error" closable @close="$emit('update:error', '')">
      {{ error }}
    </AppAlert>
    <AppAlert :show="!!success" type="success" closable @close="$emit('update:success', '')">
      {{ success }}
    </AppAlert>

    <div class="identity-card" v-if="branch">
      <span class="label">Branch</span>
      <strong class="name">{{ branch.name || 'New Branch' }}</strong>
    </div>

    <form v-if="type === 'edit' || type === 'add'" @submit.prevent="handleSubmit">
      <div class="form-grid">
        <div class="form-group">
          <label>Branch Name <span class="required">*</span></label>
          <input type="text" v-model="localData.name" placeholder="e.g. Funmall" required />
        </div>

        <div class="form-group">
          <label>Abbreviation <span class="required">*</span></label>
          <input type="text" v-model="localData.abbr" placeholder="e.g. FM" :disabled="type === 'edit'" required />
          <p class="help-text" v-if="type === 'add'">Used as unique ID. Cannot be changed later.</p>
        </div>

        <div class="form-group full-width">
          <label>Location / Address <span class="required">*</span></label>
          <textarea v-model="localData.location" placeholder="Full address..." rows="3" required></textarea>
        </div>
      </div>
      <!-- Hidden submit for Enter key functionality -->
      <button type="submit" style="display: none;"></button>
    </form>

    <!-- Delete Form -->
    <div v-if="type === 'delete'" class="form-group full-width">
      <div class="warning-icon-centered">⚠️</div>

      <div class="danger-box-standard">
        <strong>Permanent Branch Deletion</strong>
        <p>
          You are about to permanently delete <strong>{{ branch?.name }}</strong>.
          This will NOT delete students or enrollments, but they will lose their branch association.
        </p>
      </div>

      <div class="confirm-label-standard">To confirm, type <strong>DELETE</strong> below:</div>
      <input type="text" v-model="localData.deleteConfirm" class="confirm-input-standard"
        placeholder="TYPE DELETE HERE" />
    </div>

    <template #footer>
      <AppButton variant="cancel" @click="$emit('close')">Cancel</AppButton>
      <AppButton :variant="type === 'delete' ? 'danger' : 'primary'" type="submit" @click="handleSubmit"
        :loading="loading" :disabled="loading || !isFormValid">
        {{ type === 'add' ? 'Create Branch' : type === 'delete' ? 'Confirm Delete' : 'Save Changes' }}
      </AppButton>
    </template>
  </AppModal>
</template>

<script setup>
import { computed } from 'vue'
import AppModal from '@/components/common/ui/AppModal.vue'
import AppAlert from '@/components/common/ui/AppAlert.vue'
import AppButton from '@/components/common/ui/AppButton.vue'
import { useActionModal } from '@/composables/useActionModal'
import { getActionIcon } from '@/utils/assetHelper'

const props = defineProps({
  isOpen: Boolean,
  type: String,
  branch: Object,
  loading: Boolean,
  error: String,
  success: String,
})

const emit = defineEmits(['close', 'submit', 'update:error', 'update:success'])

const getInitialData = () => ({
  name: '',
  abbr: '',
  location: '',
  deleteConfirm: '',
})

const mapSourceToForm = () => {
  const source = props.branch || {}
  return {
    name: source.name || '',
    abbr: source.abbr || '',
    location: source.location || '',
    deleteConfirm: '',
  }
}

const { localData, submitForm } = useActionModal(props, emit, {
  getInitialData,
  mapSourceToForm,
})

const modalTitle = computed(() => {
  const titles = {
    add: 'Add New Branch',
    edit: 'Edit Branch Details',
    delete: 'Delete Branch Record',
  }
  return titles[props.type] || 'Branch Action'
})

const modalIcon = computed(() => {
  if (props.type === 'delete') return getActionIcon('delete')
  if (props.type === 'edit') return getActionIcon('edit')
  return getActionIcon('plus')
})

const isFormValid = computed(() => {
  if (props.type === 'delete') {
    return localData.value.deleteConfirm === 'DELETE'
  }
  return localData.value.name.trim() && localData.value.abbr.trim() && localData.value.location.trim()
})

const handleSubmit = () => submitForm(isFormValid.value)
</script>

<style scoped>
.help-text {
  font-size: 0.8rem;
  color: #64748b;
  margin-top: 4px;
}
</style>

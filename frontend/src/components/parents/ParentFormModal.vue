<template>
    <AppModal :show="isOpen" @close="$emit('close')" title="Register New Parent" :icon="getActionIcon('plus')">
        <form id="newParentForm" @submit.prevent="handleFormSubmit" class="form-standard">
            <div class="form-grid">
                <div class="form-group" :class="{ 'field-error': isSubmittingAttempted && errors.name }">
                    <label>Full Name <span class="required">*</span></label>
                    <input type="text" v-model="formData.name" placeholder="Enter full name" class="standard-input" />
                    <div v-if="isSubmittingAttempted && errors.name" class="field-error-msg">{{ errors.name }}</div>
                </div>

                <div class="form-group" :class="{ 'field-error': isSubmittingAttempted && errors.email }">
                    <label>Email Address <span class="required">*</span></label>
                    <input type="email" v-model="formData.email" placeholder="example@email.com" class="standard-input" />
                    <div v-if="isSubmittingAttempted && errors.email" class="field-error-msg">{{ errors.email }}</div>
                </div>

                <div class="form-group" :class="{ 'field-error': isSubmittingAttempted && errors.phone }">
                    <label>Phone Number <span class="required">*</span></label>
                    <input type="tel" v-model="formData.phone" placeholder="012 345 678" class="standard-input" />
                    <div v-if="isSubmittingAttempted && errors.phone" class="field-error-msg">{{ errors.phone }}</div>
                </div>

                <div class="form-group" :class="{ 'field-error': isSubmittingAttempted && errors.profile }">
                    <label>Select Profile Avatar <span class="required">*</span></label>
                    <AvatarSelector v-model="formData.profileURL" role="parent" :customFileName="`${formData.name}_parent`" />
                    <div v-if="isSubmittingAttempted && errors.profile" class="field-error-msg">{{ errors.profile }}</div>
                </div>
            </div>
        </form>

        <template #footer>
            <div class="flex-align-center flex-end w-full gap-sm">
                <AppButton variant="cancel" @click="$emit('close')">Cancel</AppButton>
                <AppButton variant="primary" form="newParentForm" type="submit" :loading="loading"
                    :class="{ 'button-disabled-visual': isFormInvalid }">
                    Register Parent
                </AppButton>
            </div>
        </template>
    </AppModal>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import AppModal from '@/components/common/ui/AppModal.vue'
import AppButton from '@/components/common/ui/AppButton.vue'
import AvatarSelector from '@/components/common/ui/AvatarSelector.vue'
import { getActionIcon } from '@/utils/assetHelper'

const props = defineProps({
    isOpen: Boolean,
    loading: Boolean,
    error: String,
    success: String,
})

const emit = defineEmits(['close', 'submit', 'update:error', 'update:success'])

const isSubmittingAttempted = ref(false)
const formData = ref({
    name: '',
    email: '',
    phone: '',
    profileURL: '',
})

watch(() => props.isOpen, (newVal) => {
    if (newVal) {
        formData.value = { name: '', email: '', phone: '', profileURL: '' }
        isSubmittingAttempted.value = false
    }
})

const errors = computed(() => {
    const data = formData.value
    const errs = {}
    if (!data.name?.trim()) errs.name = 'Full name is required.'
    if (!data.email?.trim() || !data.email.includes('@')) errs.email = 'Valid email is required.'
    if (!data.phone?.trim()) errs.phone = 'Phone number is required.'
    if (!data.profileURL) errs.profile = 'Please select a profile avatar.'
    return errs
})

const isFormInvalid = computed(() => Object.keys(errors.value).length > 0)

const handleFormSubmit = () => {
    isSubmittingAttempted.value = true
    if (isFormInvalid.value) return
    emit('submit', { ...formData.value, role: 'parent' })
}
</script>

<style scoped>
@import "@/assets/styles/components/ActionModalShared.css";
</style>

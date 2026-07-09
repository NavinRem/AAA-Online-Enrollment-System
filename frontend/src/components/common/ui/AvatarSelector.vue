<script setup>
import { ref, computed, watch } from 'vue'
import { storage } from '@/firebase'
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { getImageUrl, isSameProfileAsset } from '@/utils/assetHelper'

const props = defineProps({
  modelValue: String,
  label: String,
  required: Boolean,
  role: {
    type: String,
    default: '',
  },
  uid: String,
  customFileName: String,
  error: String,
  shake: Boolean,
})

const emit = defineEmits(['update:modelValue'])

const uploading = ref(false)
const success = ref(false)
const uploadError = ref('')
const fileInput = ref(null)

const customAvatar = ref(null)

const STUDENT_AVATARS = [
  { id: 'boy', name: 'Boy', key: 'profiles/avatar-boy' },
  { id: 'girl', name: 'Girl', key: 'profiles/avatar-girl' },
]

const TEACHER_AVATARS = [
  { id: 'teacher-man', name: 'Teacher (M)', key: 'profiles/avatar-teacher-man' },
  { id: 'teacher-woman', name: 'Teacher (F)', key: 'profiles/avatar-teacher-woman' },
]

const ADMIN_AVATARS = [
  { id: 'admin-female', name: 'Admin (F)', key: 'profiles/avatar-admin-female' },
  { id: 'admin-male', name: 'Admin (M)', key: 'profiles/avatar-admin-male' },
]

const DEFAULT_AVATARS = [
  { id: 'man', name: 'Man', key: 'profiles/avatar-man' },
  { id: 'woman', name: 'Woman', key: 'profiles/avatar-woman' },
]

const availableAvatars = computed(() => {
  const role = props.role?.toLowerCase()

  let base = DEFAULT_AVATARS
  if (role === 'student') base = STUDENT_AVATARS
  else if (role === 'teacher') base = TEACHER_AVATARS
  else if (role === 'admin') base = ADMIN_AVATARS

  return base.map((a) => ({
    ...a,
    url: getImageUrl(a.key),
  }))
})

watch([() => props.modelValue, () => availableAvatars.value], ([newVal, currentGallery]) => {
  if (newVal) {
    const isInGallery = currentGallery.some((a) => isSameProfileAsset(newVal, a.url))

    if (!isInGallery) {
      const resolved = getImageUrl(newVal)
      if (resolved) {
        customAvatar.value = resolved
      } else {
        customAvatar.value = null
      }
    } else {
      customAvatar.value = null
    }
  }
})

const isSelected = (url) => {
  if (!props.modelValue || !url) return false
  return isSameProfileAsset(props.modelValue, url)
}

const selectAvatar = (url) => {
  emit('update:modelValue', url)
  uploadError.value = ''
  success.value = false
}

const removeCustomAvatar = async () => {
  if (!customAvatar.value) return

  const urlToDelete = customAvatar.value
  const wasSelected = isSelected(urlToDelete)

  try {
    if (wasSelected) {
      const firstDefault = availableAvatars.value[0]?.url || ''
      emit('update:modelValue', firstDefault)
    }

    if (urlToDelete.includes('firebasestorage.googleapis.com')) {
      const decodedUrl = decodeURIComponent(urlToDelete)
      const pathParts = decodedUrl.split('/o/')[1]?.split('?')[0]
      if (pathParts) {
        const fileRef = storageRef(storage, pathParts)
        await deleteObject(fileRef)
      }
    }

    customAvatar.value = null
    success.value = false
  } catch (err) {
    console.error('Failed to delete avatar:', err)
    customAvatar.value = null
  }
}

const handleFileUpload = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  if (file.size > 2 * 1024 * 1024) {
    uploadError.value = 'Max 2MB allowed'
    return
  }

  uploading.value = true
  uploadError.value = ''
  success.value = false

  try {
    const extension = file.name.split('.').pop()

    let fileName = Date.now().toString()
    if (props.customFileName) {
      fileName = props.customFileName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '')
    }

    const path = `profiles/${props.uid || 'temp'}/${fileName}.${extension}`
    const fileRef = storageRef(storage, path)

    const snapshot = await uploadBytes(fileRef, file)
    const downloadURL = await getDownloadURL(snapshot.ref)

    customAvatar.value = downloadURL
    emit('update:modelValue', downloadURL)
    success.value = true
  } catch (err) {
    console.error('Upload error:', err)
    uploadError.value = 'Upload failed'
  } finally {
    uploading.value = false
    if (fileInput.value) fileInput.value.value = ''
  }
}
</script>

<template>
  <div
    class="avatar-selector-root flex flex-col gap-xs text-left"
    :class="{ 'animate-shake': shake }"
  >
    <label v-if="label" class="text-sm font-semibold text-content-mute flex items-center gap-1">
      {{ label }}
      <span v-if="required" class="text-error font-bold leading-none">*</span>
    </label>

    <div
      class="avatar-selector-container"
      :class="uploadError || props.error ? 'border-error bg-error-soft' : 'border-outline-std'"
    >
      <div class="avatar-gallery flex gap-2 sm:gap-3">
        <div
          v-for="avatar in availableAvatars"
          :key="avatar.id + avatar.url"
          class="avatar-item"
          :class="isSelected(avatar.url) ? 'avatar-item--active' : 'avatar-item--inactive'"
          @click="selectAvatar(avatar.url)"
        >
          <img
            :src="avatar.url"
            :alt="avatar.name"
            class="w-full h-full rounded-full object-cover"
          />
          <div
            class="check-badge absolute -top-1 -right-1 bg-primary text-white w-5 h-5 rounded-full flex items-center justify-center text-3xs border-2 border-white shadow-sm"
            v-if="isSelected(avatar.url)"
          >
            <i class="fas fa-check"></i>
          </div>
        </div>

        <!-- Custom Slot -->
        <div
          v-if="customAvatar"
          class="avatar-item avatar-item--custom"
          :class="{
            'opacity-100': isSelected(customAvatar),
            'opacity-60': !isSelected(customAvatar),
          }"
          @click="selectAvatar(customAvatar)"
        >
          <img :src="customAvatar" alt="Custom" class="w-full h-full rounded-full object-cover" />
          <div
            class="check-badge absolute -top-1 -right-1 bg-primary text-white w-5 h-5 rounded-full flex items-center justify-center text-3xs border-2 border-white shadow-sm"
            v-if="isSelected(customAvatar)"
          >
            <i class="fas fa-check"></i>
          </div>
          <button class="avatar-remove-btn" @click.stop="removeCustomAvatar">
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>

      <div class="vertical-divider w-px h-10 bg-outline-std mx-2"></div>

      <div class="upload-area">
        <input
          type="file"
          ref="fileInput"
          accept="image/*"
          class="hidden"
          @change="handleFileUpload"
        />
        <div class="avatar-upload-btn" @click="fileInput?.click()">
          <div
            v-if="uploading"
            class="w-4 h-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin"
          ></div>
          <template v-else>
            <i class="fas fa-plus text-sm mb-0.5"></i>
            <span class="text-3xs font-semibold tracking-tighter">Upload</span>
          </template>
        </div>
      </div>
    </div>

    <!-- Feedback States -->
    <transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 -translate-y-1"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-1"
    >
      <div v-if="uploadError || props.error" class="avatar-feedback-err">
        {{ uploadError || props.error }}
      </div>
      <div v-else-if="success" class="avatar-feedback-success">
        <i class="fas fa-check-circle"></i> Profile upload acknowledged
      </div>
    </transition>
  </div>
</template>

<style scoped>
.avatar-selector-root {
  @apply w-full flex flex-col gap-xs;
}

.avatar-selector-container {
  @apply flex items-center justify-between bg-surface-subtle p-2 px-3 sm:px-4 rounded-std border-2 transition-all;
}

.avatar-item {
  @apply relative w-11 h-11 shrink-0 rounded-full cursor-pointer border-2 transition-all p-0.5 bg-white;
}

.avatar-item--active {
  @apply border-primary ring-4 ring-primary/5;
}

.avatar-item--inactive {
  @apply border-transparent;
}

.avatar-item--custom {
  @apply border-primary ring-4 ring-primary/5;
}

.avatar-remove-btn {
  @apply absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-error text-white border-2 border-white flex items-center justify-center text-3xs opacity-0 hover:scale-110 transition-all z-10 shadow-md group-hover:opacity-100;
}

.avatar-upload-btn {
  @apply w-11 h-11 shrink-0 rounded-full border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all bg-white text-content-light/50 hover:border-primary hover:text-primary hover:bg-primary-soft;
}

.avatar-feedback-err {
  @apply text-sm font-semibold text-error pl-1;
}

.avatar-feedback-success {
  @apply text-sm font-semibold text-success pl-1 flex items-center gap-1;
}
</style>

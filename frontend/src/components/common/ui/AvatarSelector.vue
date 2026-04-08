<template>
  <div class="avatar-selector">
    <div class="selector-container">
      <div class="avatar-gallery">
        <div v-for="avatar in availableAvatars" :key="avatar.id + avatar.url" class="avatar-option"
          :class="{ active: isSelected(avatar.url) }" @click="selectAvatar(avatar.url)">
          <img :src="avatar.url" :alt="avatar.name" />
          <div class="check-badge" v-if="isSelected(avatar.url)">
            <i class="fas fa-check"></i>
          </div>
        </div>

        <div v-if="customAvatar" class="avatar-option custom-slot" :class="{ active: isSelected(customAvatar) }"
          @click="selectAvatar(customAvatar)">
          <img :src="customAvatar" alt="Custom" />
          <div class="check-badge" v-if="isSelected(customAvatar)">
            <i class="fas fa-check"></i>
          </div>
          <button class="remove-avatar-btn" @click.stop="removeCustomAvatar" title="Delete Uploaded Profile">
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>

      <div class="vertical-divider"></div>

      <div class="upload-area">
        <input type="file" ref="fileInput" accept="image/*" class="hidden-input" @change="handleFileUpload" />
        <div class="upload-btn" @click="fileInput?.click()">
          <div v-if="uploading" class="spinner-mini"></div>
          <i v-else class="fas fa-plus"></i>
          <span>{{ uploading ? 'Wait...' : 'Upload' }}</span>
        </div>
      </div>
    </div>
    <div v-if="error" class="error-text">{{ error }}</div>
    <div v-if="success" class="success-text">
      <i class="fas fa-check-circle"></i> Upload successful!
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { storage } from '@/firebase'
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { getImageUrl, ALL_BUILTIN_AVATARS, isSameProfileAsset } from '@/utils/assetHelper'

const props = defineProps({
  modelValue: String,
  role: {
    type: String,
    default: ''
  },
  uid: String,
  customFileName: String
})

const emit = defineEmits(['update:modelValue'])

const uploading = ref(false)
const success = ref(false)
const error = ref('')
const fileInput = ref(null)

const customAvatar = ref(null)

const STUDENT_AVATARS = [
  { id: 'boy', name: 'Boy', key: 'profiles/avatar-boy' },
  { id: 'girl', name: 'Girl', key: 'profiles/avatar-girl' }
]

const TEACHER_AVATARS = [
  { id: 'teacher-man', name: 'Teacher (M)', key: 'profiles/avatar-teacher-man' },
  { id: 'teacher-woman', name: 'Teacher (F)', key: 'profiles/avatar-teacher-woman' }
]

const DEFAULT_AVATARS = [
  { id: 'man', name: 'Man', key: 'profiles/avatar-man' },
  { id: 'woman', name: 'Woman', key: 'profiles/avatar-woman' }
]

const availableAvatars = computed(() => {
  const role = props.role?.toLowerCase()

  let base = DEFAULT_AVATARS
  if (role === 'student') base = STUDENT_AVATARS
  else if (role === 'teacher') base = TEACHER_AVATARS

  return base.map(a => ({
    ...a,
    url: getImageUrl(a.key)
  }))
})

watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    const isBuiltin = ALL_BUILTIN_AVATARS.some(builtin =>
      isSameProfileAsset(newVal, builtin)
    )
    if (!isBuiltin && (newVal.startsWith('http') || newVal.includes('firebasestorage') || newVal.includes('/'))) {
      customAvatar.value = newVal
    }
  }
}, { immediate: true })

const isSelected = (url) => {
  if (!props.modelValue || !url) return false
  return isSameProfileAsset(props.modelValue, url)
}

const selectAvatar = (url) => {
  emit('update:modelValue', url)
  error.value = ''
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
    error.value = 'Max 2MB allowed'
    return
  }

  uploading.value = true
  error.value = ''
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
    error.value = 'Upload failed'
  } finally {
    uploading.value = false
    if (fileInput.value) fileInput.value.value = ''
  }
}
</script>

<style scoped>
.avatar-selector {
  margin-bottom: var(--space-md);
  width: 100%;
}

.section-label {
  display: block;
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--text-muted);
  margin-bottom: var(--space-xs);
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.selector-container {
  width: 100%;
  display: flex;
  justify-content: space-around;
  align-items: center;
  background: var(--bg-subtle);
  padding: var(--space-md) var(--space-xl);
  border-radius: var(--border-radius);
  border: 1px solid var(--border-color);
}

.avatar-gallery {
  display: flex;
  gap: 16px;
}

.avatar-option {
  position: relative;
  width: 54px;
  height: 54px;
  border-radius: var(--border-radius-round);
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.2s;
  background: var(--white);
  padding: 2px;
}

.avatar-option:hover {
  transform: translateY(-2px);
  border-color: var(--text-light);
}

.avatar-option.active {
  border-color: var(--primary-color);
  box-shadow: 0 0 10px rgba(0, 174, 239, 0.2);
}

.avatar-option img {
  width: 100%;
  height: 100%;
  border-radius: var(--border-radius-round);
  object-fit: cover;
}

.check-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  background: var(--primary-color);
  color: var(--white);
  width: 18px;
  height: 18px;
  border-radius: var(--border-radius-round);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--text-3xs);
  border: 2px solid var(--white);
}

.vertical-divider {
  width: 1px;
  height: 48px;
  background: var(--border-color);
  margin: 0 var(--space-xs);
}

.hidden-input {
  display: none;
}

.upload-btn {
  width: 54px;
  height: 54px;
  border-radius: var(--border-radius-round);
  border: 2px dashed var(--text-light);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  background: var(--white);
  color: var(--text-light);
}

.upload-btn:hover {
  border-color: var(--primary-color);
  background: var(--bg-light);
  color: var(--primary-color);
}

.upload-btn i {
  font-size: var(--text-sm);
  margin-bottom: 2px;
}

.upload-btn span {
  font-size: var(--text-3xs);
  font-weight: 600;
}

.custom-slot {
  border-color: var(--primary-color);
  border-style: solid;
}

.remove-avatar-btn {
  position: absolute;
  top: -6px;
  right: -6px;
  width: 18px;
  height: 18px;
  border-radius: var(--border-radius-round);
  background: var(--error-color);
  color: var(--white);
  border: 1px solid var(--white);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  cursor: pointer;
  opacity: 0;
  transition: all 0.2s;
  z-index: 2;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.avatar-option:hover .remove-avatar-btn {
  opacity: 1;
}

.remove-avatar-btn:hover {
  background: var(--error-deep);
  transform: scale(1.1);
}

.error-text {
  color: var(--error-color);
  font-size: var(--text-xs);
  margin-top: var(--space-2xs);
  display: none;
}

.error-text.show {
  display: block;
}

.success-text {
  color: var(--success-color);
  font-size: var(--text-xs);
  margin-top: var(--space-2xs);
}

.spinner-mini {
  width: 12px;
  height: 12px;
  border: 2px solid var(--text-light);
  border-top-color: var(--primary-color);
  border-radius: var(--border-radius-round);
  animation: spin 0.8s linear infinite;
  margin-bottom: 2px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>

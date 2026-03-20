<template>
  <div class="avatar-selector">
    <label class="section-label">Profile Avatar</label>
    
    <div class="selector-container">
      <!-- Built-in Gallery -->
      <div class="avatar-gallery">
        <div 
          v-for="avatar in availableAvatars" 
          :key="avatar.id"
          class="avatar-option"
          :class="{ active: modelValue === avatar.url }"
          @click="selectAvatar(avatar.url)"
        >
          <img :src="avatar.url" :alt="avatar.name" />
          <div class="check-badge" v-if="modelValue === avatar.url">
            <i class="fas fa-check"></i>
          </div>
        </div>
      </div>

      <div class="vertical-divider"></div>

      <!-- Custom Upload -->
      <div class="upload-area">
        <input 
          type="file" 
          ref="fileInput" 
          accept="image/*" 
          class="hidden-input" 
          @change="handleFileUpload" 
        />
        <div 
          class="custom-preview" 
          :class="{ 'is-custom': isCustomUrl }"
          @click="$refs.fileInput.click()"
        >
          <img v-if="isCustomUrl" :src="modelValue" class="preview-img" />
          <div v-else class="upload-placeholder">
            <i class="fas fa-plus" v-if="!uploading"></i>
            <div v-else class="spinner-mini"></div>
            <span>{{ uploading ? 'Uploading...' : 'Upload' }}</span>
          </div>
        </div>
      </div>
    </div>
    <div v-if="error" class="error-text">{{ error }}</div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { storage } from '@/firebase'
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'
import { getImageUrl } from '@/utils/assetHelper'

const props = defineProps({
  modelValue: String,
  type: {
    type: String,
    default: 'parent' // 'parent' or 'student'
  },
  uid: String // Optional, for custom upload path
})

const emit = defineEmits(['update:modelValue'])

const uploading = ref(false)
const error = ref('')

const availableAvatars = computed(() => {
  if (props.type === 'student') {
    return [
      { id: 'boy', name: 'Boy', url: getImageUrl('profiles/avatar-boy') },
      { id: 'girl', name: 'Girl', url: getImageUrl('profiles/avatar-girl') },
    ]
  }
  return [
    { id: 'man', name: 'Man', url: getImageUrl('profiles/avatar-man') },
    { id: 'woman', name: 'Woman', url: getImageUrl('profiles/avatar-woman') },
  ]
})

const isCustomUrl = computed(() => {
  if (!props.modelValue) return false
  // If URL starts with blob or firebasestorage, it's custom
  return props.modelValue.startsWith('blob:') || 
         props.modelValue.includes('firebasestorage.googleapis.com') ||
         props.modelValue.startsWith('data:')
})

const selectAvatar = (url) => {
  emit('update:modelValue', url)
  error.value = ''
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

  try {
    const timestamp = Date.now()
    const extension = file.name.split('.').pop()
    const path = `profiles/${props.uid || 'temp'}/${timestamp}.${extension}`
    const fileRef = storageRef(storage, path)

    const snapshot = await uploadBytes(fileRef, file)
    const downloadURL = await getDownloadURL(snapshot.ref)

    emit('update:modelValue', downloadURL)
  } catch (err) {
    console.error('Upload error:', err)
    error.value = 'Upload failed'
  } finally {
    uploading.value = false
  }
}
</script>

<style scoped>
.avatar-selector {
  margin-bottom: 15px;
  width: 100%;
}

.section-label {
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
  color: #64748b;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.selector-container {
  width: 100%;
  display: flex;
  justify-content: space-around;
  align-items: center;
  background: #f8fafc;
  padding: 16px 24px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

.avatar-gallery {
  display: flex;
  gap: 16px;
}

.avatar-option {
  position: relative;
  width: 54px;
  height: 54px;
  border-radius: 50%;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.2s;
  background: white;
  padding: 2px;
}

.avatar-option:hover {
  transform: translateY(-2px);
  border-color: #cbd5e1;
}

.avatar-option.active {
  border-color: #00aeef;
  box-shadow: 0 0 10px rgba(0, 174, 239, 0.2);
}

.avatar-option img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.check-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  background: #00aeef;
  color: white;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.65rem;
  border: 2px solid white;
}

.vertical-divider {
  width: 1px;
  height: 48px;
  background: #e2e8f0;
  margin: 0 8px;
}

.hidden-input {
  display: none;
}

.custom-preview {
  width: 54px;
  height: 54px;
  border-radius: 50%;
  border: 2px dashed #cbd5e1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  overflow: hidden;
  background: white;
}

.custom-preview:hover {
  border-color: #00aeef;
  background: #f1f5f9;
}

.custom-preview.is-custom {
  border-style: solid;
  border-color: #00aeef;
}

.preview-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #94a3b8;
}

.upload-placeholder i {
  font-size: 0.9rem;
  margin-bottom: 2px;
}

.upload-placeholder span {
  font-size: 0.65rem;
  font-weight: 600;
}

.error-text {
  color: #ef4444;
  font-size: 0.75rem;
  margin-top: 4px;
}

.spinner-mini {
  width: 12px;
  height: 12px;
  border: 2px solid #cbd5e1;
  border-top-color: #00aeef;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 2px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>

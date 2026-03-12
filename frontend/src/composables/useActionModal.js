import { ref, watch } from 'vue'

/**
 * A generic composable for managing Action Modal state and synchronization
 * @param {Object} props - Component props (must include isOpen)
 * @param {Function} emit - Component emit function
 * @param {Object} options - Configuration options
 * @param {Function} options.getInitialData - Function to return the default form state
 * @param {Function} options.mapSourceToForm - Function to map props (student, enrollment, user, etc.) to form state
 */
export function useActionModal(props, emit, options = {}) {
  const localData = ref(options.getInitialData ? options.getInitialData() : {})
  const originalData = ref(options.getInitialData ? options.getInitialData() : {})

  // Sync logic when modal opens
  watch(
    () => props.isOpen,
    (isOpen) => {
      if (isOpen) {
        const data = options.mapSourceToForm ? options.mapSourceToForm() : (options.getInitialData ? options.getInitialData() : {})
        localData.value = { ...data }
        originalData.value = { ...data }
      }
    }
  )

  /**
   * Standardized submit handler
   * @param {Boolean} isValid - Result of form validation
   */
  const submitForm = (isValid) => {
    if (!isValid) return
    emit('submit', { ...localData.value })
  }

  return {
    localData,
    originalData,
    submitForm,
  }
}

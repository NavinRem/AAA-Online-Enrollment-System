import { ref, watch, computed } from 'vue'

/**
 * A generic composable for managing Action Modal state and synchronization
 * @param {Object} props - Modal component props (requires isOpen)
 * @param {Function} emit - Modal component emit function
 * @param {Object} options - Configuration options
 * @param {Function} options.getInitialData - Returns empty state template
 * @param {Function} options.mapSourceToForm - Maps props source to form data
 * @param {String} options.sourceKey - The prop name to watch for internal changes (e.g. 'enrollment')
 */
export function useActionModal(props, emit, options = {}) {
  const getInitial = () => (options.getInitialData ? options.getInitialData() : {})

  const localData = ref(getInitial())
  const originalData = ref(getInitial())

  // Detect unsaved changes for UI feedback (simple JSON comparison for flat-ish objects)
  const isDirty = computed(() => {
    return JSON.stringify(localData.value) !== JSON.stringify(originalData.value)
  })

  // Deep clone utility to prevent reference mutations
  const clone = (data) => (data ? JSON.parse(JSON.stringify(data)) : getInitial())

  const sync = () => {
    const data = options.mapSourceToForm ? options.mapSourceToForm() : getInitial()
    localData.value = clone(data)
    originalData.value = clone(data)
  }

  // Handle Modal Open/Close
  watch(
    () => props.isOpen,
    (isOpen) => {
      if (isOpen) {
        sync()
      } else {
        localData.value = getInitial()
        originalData.value = getInitial()
      }
    },
    { immediate: true }
  )

  // Optional: Watch for source changes if the source prop is provided
  if (options.sourceKey) {
    watch(
      () => props[options.sourceKey],
      (newSource) => {
        if (props.isOpen && newSource) {
          sync()
        }
      },
      { deep: true }
    )
  }

  const submitForm = (isValid = true) => {
    if (!isValid) return
    emit('submit', clone(localData.value))
  }

  return {
    localData,
    originalData,
    isDirty,
    submitForm,
    sync
  }
}

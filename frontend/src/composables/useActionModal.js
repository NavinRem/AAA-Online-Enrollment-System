import { watch, computed } from 'vue'
import { useForm } from '@/composables/useForm'

/**
 * A generic composable for managing Action Modal state, synchronization, and validation
 * @param {Object} props - Modal component props (requires isOpen)
 * @param {Function} emit - Modal component emit function
 * @param {Object} options - Configuration options
 * @param {Function} options.getInitialData - Returns empty state template
 * @param {Function} options.mapSourceToForm - Maps props source to form data
 * @param {String} options.sourceKey - The prop name to watch for internal changes (e.g. 'enrollment')
 * @param {Object} options.validationRules - Custom validation rules for useForm
 * @param {Number} options.autoClear - Override default error clearing timeout
 */
export function useActionModal(props, emit, options = {}) {
  const getInitial = () => (options.getInitialData ? options.getInitialData() : {})

  // Initialize unified form and validation state
  // We use the useForm composable to handle errors, shaking, and automated cleanup
  const {
    form: localData,
    errors,
    shaking,
    validate,
    clearError,
    triggerShake,
    resetForm,
    getPayload,
  } = useForm(getInitial(), {
    autoClear: options.autoClear || 2000,
  })

  // We maintain originalData to detect dirty state (unsaved changes)
  const { form: originalData, resetForm: resetOriginal } = useForm(getInitial())

  // Detect unsaved changes for UI feedback (simple JSON comparison for flat-ish objects)
  const isDirty = computed(() => {
    return JSON.stringify(localData) !== JSON.stringify(originalData)
  })

  // Deep clone utility to prevent reference mutations
  const clone = (data) => (data ? JSON.parse(JSON.stringify(data)) : getInitial())

  const sync = () => {
    const data = options.mapSourceToForm ? options.mapSourceToForm() : getInitial()
    Object.assign(localData, clone(data))
    Object.assign(originalData, clone(data))
  }

  // Handle Modal Open/Close lifecycle
  watch(
    () => props.isOpen,
    (isOpen) => {
      if (isOpen) {
        sync()
      } else {
        resetForm()
        resetOriginal()
      }
    },
    { immediate: true },
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
      { deep: true },
    )
  }

  /**
   * Enhanced submit that performs validation before emitting
   * @param {Object} validationOptions - Validation rules { required: [], custom: {} }
   */
  const executeSubmit = (validationOptions = null) => {
    if (validationOptions) {
      if (!validate(validationOptions)) return false
    }
    emit('submit', getPayload())
    return true
  }

  return {
    localData,
    originalData,
    isDirty,
    errors,
    shaking,
    validate,
    clearError,
    triggerShake,
    resetForm,
    submitForm: executeSubmit,
    sync,
    getPayload,
  }
}

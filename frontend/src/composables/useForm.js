import { reactive } from 'vue'

export function useForm(initialValues = {}, options = {}) {
  const form = reactive({ ...initialValues })
  const errors = reactive({})
  const shaking = reactive({})
  const timeouts = {}

  const { autoClear = 2000 } = options

  const clearError = (field) => {
    if (field) {
      errors[field] = null
      shaking[field] = false
      if (timeouts[field]) {
        clearTimeout(timeouts[field])
        delete timeouts[field]
      }
    } else {
      Object.keys(errors).forEach((key) => {
        errors[key] = null
        shaking[key] = false
      })
      Object.keys(timeouts).forEach((key) => {
        clearTimeout(timeouts[key])
        delete timeouts[key]
      })
    }
  }

  /**
   * Triggers the shake animation and schedules automatic clearing of errors
   */
  const triggerFeedback = (field) => {
    // 1. Shake animation
    shaking[field] = false
    setTimeout(() => {
      shaking[field] = true
      setTimeout(() => {
        shaking[field] = false
      }, 400)
    }, 10)

    // 2. Schedule error clearing
    if (autoClear > 0) {
      if (timeouts[field]) clearTimeout(timeouts[field])
      timeouts[field] = setTimeout(() => {
        errors[field] = null
        delete timeouts[field]
      }, autoClear)
    }
  }

  /**
   * Resets the entire form and validation state
   */
  const resetForm = (newValues = initialValues) => {
    clearError()
    Object.keys(form).forEach((key) => {
      form[key] = newValues[key] !== undefined ? newValues[key] : initialValues[key]
    })
  }

  /**
   * Universal Validate Function
   */
  const validate = (options = {}) => {
    let isValid = true
    const { required = [], custom = {} } = options

    required.forEach((field) => {
      const val = form[field]
      if (
        val === undefined ||
        val === null ||
        val === '' ||
        (Array.isArray(val) && val.length === 0)
      ) {
        errors[field] = 'This field is required'
        triggerFeedback(field)
        isValid = false
      }
    })

    Object.entries(custom).forEach(([field, validator]) => {
      const result = validator(form[field])
      // If result is a string, it's an error message
      if (typeof result === 'string') {
        errors[field] = result
        triggerFeedback(field)
        isValid = false
      }
    })

    return isValid
  }

  return {
    form,
    errors,
    shaking,
    validate,
    clearError,
    triggerShake: triggerFeedback, // maintain backward compatibility but rename internally
    resetForm,
  }
}

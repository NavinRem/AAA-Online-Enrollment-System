import { computed, isRef } from 'vue'
import { getActionIcon } from '@/utils/assetHelper'

/**
 * Standardizes modal title, submit label, and icon across all modals based on type and entity name.
 *
 * Accepts `type` as any of:
 *   - A plain string:               useModalText('edit', 'Class')
 *   - A Vue Ref<string>:             useModalText(typeRef, 'Class')
 *   - A getter function () => string: useModalText(() => props.type, 'Class')
 *
 * @param {Ref<String> | (() => String) | String} type - The action type ('add', 'edit', 'delete', etc.)
 * @param {String} entityName - The name of the entity being operated on (e.g., 'Student', 'Class')
 * @param {Object} options - Optional overrides
 * @param {Ref<String> | (() => String)} options.customTitle - A fully custom title to override the default logic
 * @param {Ref<String> | (() => String)} options.customSubmit - A fully custom submit label to override the default logic
 */
export function useModalText(type, entityName, options = {}) {
  // Helper: resolves a Ref, getter function, or plain value to its current value
  const resolve = (val) => {
    if (isRef(val)) return val.value
    if (typeof val === 'function') return val()
    return val
  }

  const resolvedType = computed(() => resolve(type))

  const modalTitle = computed(() => {
    const customTitle = resolve(options.customTitle)
    if (customTitle) return customTitle

    const t = resolvedType.value
    const titles = {
      edit: `Edit ${entityName}`,
      delete: `Delete ${entityName}`,
      add: `Add ${entityName}`,
      plus: `Add ${entityName}`,
      reactivate: `Reactivate ${entityName}`,
      activate: `Reactivate ${entityName}`,
      deactivate: `Suspend ${entityName}`,
      remove: `Remove ${entityName}`,
      pay: `Pay ${entityName}`,
      cancel: `Cancel ${entityName}`,
      'reset-password': 'Reset Password',
      'manage-class': `Manage Class`,
    }
    return titles[t] || `${entityName} Action`
  })

  const submitLabel = computed(() => {
    const customSubmit = resolve(options.customSubmit)
    if (customSubmit) return customSubmit

    const t = resolvedType.value
    const labels = {
      edit: 'Update',
      delete: 'Delete',
      add: 'Add',
      plus: 'Add',
      reactivate: 'Update',
      activate: 'Update',
      deactivate: 'Update',
      remove: 'Delete',
      pay: 'Pay',
      cancel: 'Cancel',
      'reset-password': 'Reset',
      'manage-class': 'Save Changes',
    }
    return labels[t] || 'Confirm'
  })

  const modalIcon = computed(() => {
    const t = resolvedType.value
    return getActionIcon(t)
  })

  return {
    modalTitle,
    submitLabel,
    modalIcon,
  }
}

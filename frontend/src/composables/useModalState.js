import { ref } from 'vue'

export function useModalState(defaultType = 'edit') {
  const actionModal = ref({
    isOpen: false,
    type: defaultType,
    loading: false,
    error: '',
    success: '',
  })

  const openActionModal = (type = defaultType) => {
    actionModal.value = {
      isOpen: true,
      type,
      loading: false,
      error: '',
      success: '',
    }
  }

  const closeActionModal = () => {
    actionModal.value.isOpen = false
  }

  const setModalLoading = (isLoading) => {
    actionModal.value.loading = isLoading
  }

  const setModalError = (message) => {
    actionModal.value.error = message
  }

  const setModalSuccess = (message) => {
    actionModal.value.success = message
  }

  return {
    actionModal,
    openActionModal,
    closeActionModal,
    setModalLoading,
    setModalError,
    setModalSuccess,
  }
}

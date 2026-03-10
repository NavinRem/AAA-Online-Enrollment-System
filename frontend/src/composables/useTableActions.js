import { ref } from 'vue'

export function useTableActions() {
  const activeMenuId = ref(null)
  const isMenuAbove = ref(false)
  const menuStyles = ref({})

  const toggleMenu = (event, id) => {
    if (activeMenuId.value === id) {
      activeMenuId.value = null
      return
    }

    const rect = event.currentTarget.getBoundingClientRect()
    const spaceBelow = window.innerHeight - rect.bottom
    isMenuAbove.value = spaceBelow < 280

    if (isMenuAbove.value) {
      menuStyles.value = {
        bottom: `${window.innerHeight - rect.top + 8}px`,
        right: `${window.innerWidth - rect.right}px`,
      }
    } else {
      menuStyles.value = {
        top: `${rect.bottom + 8}px`,
        right: `${window.innerWidth - rect.right}px`,
      }
    }

    activeMenuId.value = id
  }

  const closeMenu = () => {
    activeMenuId.value = null
  }

  const handleGlobalClick = (event) => {
    if (activeMenuId.value) {
      const isTrigger = event.target.closest('.btn-dots')
      const isMenu = event.target.closest('.action-dropdown')
      if (!isTrigger && !isMenu) {
        closeMenu()
      }
    }
  }

  return {
    activeMenuId,
    isMenuAbove,
    menuStyles,
    toggleMenu,
    closeMenu,
    handleGlobalClick,
  }
}

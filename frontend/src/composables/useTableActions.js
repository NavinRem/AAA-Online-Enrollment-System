import { ref, onMounted, onUnmounted } from 'vue'

/**
 * Manages action dropdown state and dynamic positioning for data tables.
 */
export function useTableActions() {
  const activeMenuId = ref(null)
  const isMenuAbove = ref(false)
  const menuStyles = ref({})

  /**
   * Toggles the menu for a specific row item.
   * Calculates if it should open upwards based on available viewport space.
   */
  const toggleMenu = (event, id) => {
    if (activeMenuId.value === id) {
      activeMenuId.value = null
      return
    }

    const rect = event.currentTarget.getBoundingClientRect()
    const spaceBelow = window.innerHeight - rect.bottom

    // Threshold (280px) to determine if menu flips up
    isMenuAbove.value = spaceBelow < 280

    const styles = {
      right: `${window.innerWidth - rect.right}px`,
    }

    if (isMenuAbove.value) {
      styles.bottom = `${window.innerHeight - rect.top + 8}px`
    } else {
      styles.top = `${rect.bottom + 8}px`
    }

    menuStyles.value = styles
    activeMenuId.value = id
  }

  const closeMenu = () => {
    activeMenuId.value = null
  }

  const handleEventClose = (event) => {
    if (!activeMenuId.value) return

    if (event.type === 'mousedown') {
      const target = event.target
      if (
        !target.closest('.btn-dots') &&
        !target.closest('.action-dropdown') &&
        !target.closest('.ui-btn-dots') &&
        !target.closest('.ui-dropdown-menu')
      ) {
        closeMenu()
      }
    } else {
      closeMenu()
    }
  }

  onMounted(() => {
    document.addEventListener('mousedown', handleEventClose)
    window.addEventListener('resize', handleEventClose)
    window.addEventListener('scroll', handleEventClose, true) // Capture scroll
  })

  onUnmounted(() => {
    document.removeEventListener('mousedown', handleEventClose)
    window.removeEventListener('resize', handleEventClose)
    window.removeEventListener('scroll', handleEventClose, true)
  })

  return {
    activeMenuId,
    isMenuAbove,
    menuStyles,
    toggleMenu,
    closeMenu,
  }
}

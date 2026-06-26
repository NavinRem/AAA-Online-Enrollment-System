import { ref, onMounted, onUnmounted } from 'vue'

/**
 * Manages multiple dropdown states and global click-outside listeners.
 * @param {Array<string>} dropdownKeys List of keys like ['term', 'branch', 'schedule']
 * @param {Array<string>} ignoreSelectors CSS selectors to ignore when clicking outside
 */
export function useDropdowns(dropdownKeys = [], ignoreSelectors = [], onOutsideClick = null) {
  const defaultState = dropdownKeys.reduce((acc, key) => {
    acc[key] = false
    return acc
  }, {})

  const dropdowns = ref({ ...defaultState })
  const filterMenuStyles = ref({})

  const toggleDropdown = (type, event) => {
    const isOpening = !dropdowns.value[type]
    
    // Close all
    Object.keys(dropdowns.value).forEach((key) => {
      dropdowns.value[key] = false
    })

    dropdowns.value[type] = isOpening

    if (isOpening && event) {
      const rect = event.currentTarget.getBoundingClientRect()
      filterMenuStyles.value = {
        top: `${rect.bottom + window.scrollY + 8}px`,
        left: `${Math.min(rect.left + window.scrollX, window.innerWidth - 250)}px`,
        minWidth: '240px',
      }
    }
  }

  const closeAllDropdowns = () => {
    Object.keys(dropdowns.value).forEach((key) => {
      dropdowns.value[key] = false
    })
  }

  const handleClickOutside = (e) => {
    if (ignoreSelectors.length === 0 && !onOutsideClick) return
    const isIgnored = ignoreSelectors.some(selector => e.target.closest(selector))
    if (!isIgnored) {
      closeAllDropdowns()
      if (onOutsideClick) onOutsideClick(e)
    }
  }

  onMounted(() => {
    if (ignoreSelectors.length > 0 || onOutsideClick) {
      window.addEventListener('mousedown', handleClickOutside)
    }
  })

  onUnmounted(() => {
    if (ignoreSelectors.length > 0 || onOutsideClick) {
      window.removeEventListener('mousedown', handleClickOutside)
    }
  })

  return {
    dropdowns,
    filterMenuStyles,
    toggleDropdown,
    closeAllDropdowns
  }
}

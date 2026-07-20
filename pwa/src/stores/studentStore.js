import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { parentPortalService } from '@/services/parentAuthService'

export const useStudentStore = defineStore('student', () => {
  const children = ref([])
  const selectedStudentId = ref('')
  const loading = ref(false)
  const error = ref(null)

  const selectedStudent = computed(() => {
    if (!selectedStudentId.value && children.value.length > 0) {
      return children.value[0]
    }
    return children.value.find((c) => c.id === selectedStudentId.value) || children.value[0] || null
  })

  async function fetchChildren(force = false) {
    if (children.value.length > 0 && !force) return children.value
    loading.value = true
    error.value = null
    try {
      const list = await parentPortalService.getMyChildren()
      children.value = Array.isArray(list) ? list : []
      if (!selectedStudentId.value && children.value.length > 0) {
        selectedStudentId.value = children.value[0].id
      }
    } catch (err) {
      console.error('Failed to load children:', err)
      error.value = err.message || 'Could not load your children.'
    } finally {
      loading.value = false
    }
    return children.value
  }

  function selectStudent(studentId) {
    selectedStudentId.value = studentId
  }

  return {
    children,
    selectedStudentId,
    selectedStudent,
    loading,
    error,
    fetchChildren,
    selectStudent,
  }
})

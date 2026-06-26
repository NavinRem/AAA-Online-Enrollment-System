import { onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'

/**
 * Automates fetching entity data when a detail page mounts or the route ID changes.
 * @param {Function} fetchCallback The function to call with the ID (e.g. fetchData)
 * @param {String} paramKey The route param key to watch (default: 'id')
 */
export function useDetailFetch(fetchCallback, paramKey = 'id') {
  const route = useRoute()

  onMounted(() => {
    if (route.params[paramKey]) {
      fetchCallback(route.params[paramKey])
    }
  })

  watch(
    () => route.params[paramKey],
    (newId) => {
      if (newId) {
        fetchCallback(newId)
      }
    }
  )
}

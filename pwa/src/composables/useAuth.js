import { ref } from 'vue'
import { parentAuthService } from '@/services/parentAuthService'

const currentUser = ref(null)
const authReady = ref(false)

parentAuthService.onAuthStateChanged((user) => {
  currentUser.value = user
  authReady.value = true
})

export function useAuth() {
  return { currentUser, authReady }
}

import '../frontend/src/assets/styles/main.css'
import { beforeMount } from '@playwright/experimental-ct-vue/hooks'
import { createPinia } from 'pinia'

beforeMount(async ({ app }) => {
  const pinia = createPinia()
  app.use(pinia)
})

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { authService } from './services/authService'

import App from './App.vue'
import router from './router'
import './assets/main.css'

let app

authService.onAuthStateChanged(() => {
  if (!app) {
    app = createApp(App)
    app.use(createPinia())
    app.use(router)
    app.mount('#app')
  }
})

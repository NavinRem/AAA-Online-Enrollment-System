// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

const routes = [
  { path: '/login', name: 'Login', component: () => import('@/views/LoginView.vue') },
  { path: '/register', name: 'Register', component: () => import('@/views/RegisterView.vue') },
  {
    path: '/',
    name: 'Dashboard',
    component: () => import('@/views/DashboardView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/enroll',
    name: 'SelfEnroll',
    component: () => import('@/views/SelfEnrollView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/enrollments',
    name: 'MyEnrollments',
    component: () => import('@/views/MyEnrollmentsView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/attendance/:studentId?',
    name: 'Attendance',
    component: () => import('@/views/AttendanceView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/performance/:studentId?',
    name: 'Performance',
    component: () => import('@/views/PerformanceView.vue'),
    meta: { requiresAuth: true },
  },
]

const router = createRouter({ history: createWebHistory(), routes })

router.beforeEach(async (to) => {
  const { currentUser, authReady } = useAuth()

  // Wait for Firebase to resolve auth state on first load
  if (!authReady.value) {
    await new Promise((resolve) => {
      const unwatch = setInterval(() => {
        if (authReady.value) {
          clearInterval(unwatch)
          resolve()
        }
      }, 50)
    })
  }

  if (to.meta.requiresAuth && !currentUser.value) {
    return { name: 'Login' }
  }
  if ((to.name === 'Login' || to.name === 'Register') && currentUser.value) {
    return { name: 'Dashboard' }
  }
})

export default router
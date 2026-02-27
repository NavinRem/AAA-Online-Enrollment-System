import { createRouter, createWebHistory } from 'vue-router'
import UserAuth from '../components/UserAuth.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: UserAuth,
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('../views/Dashboard.vue'),
      meta: { title: 'Dashboard' },
    },
    {
      path: '/registrations',
      name: 'registrations',
      component: () => import('../views/Registrations.vue'),
      meta: { title: 'Registrations' },
    },
    {
      path: '/parents',
      name: 'parents',
      component: () => import('../views/Parents.vue'),
      meta: { title: 'Parent / Guardian' },
    },
    {
      path: '/students',
      name: 'students',
      component: () => import('../views/Students.vue'),
      meta: { title: 'Students' },
    },
    {
      path: '/programs',
      name: 'programs',
      component: () => import('../views/Programs.vue'),
      meta: { title: 'Programs' },
    },
    {
      path: '/payment',
      name: 'payment',
      component: () => import('../views/Payments.vue'),
      meta: { title: 'Payment' },
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('../views/Settings.vue'),
      meta: { title: 'Settings' },
    },
  ],
})

export default router

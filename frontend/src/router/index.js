import { createRouter, createWebHistory } from 'vue-router'
import UserAuth from '../components/UserAuth.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: UserAuth,
      meta: { title: 'Login' },
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('../views/Dashboard.vue'),
      meta: { title: 'Dashboard' },
    },
    {
      path: '/enrollments',
      name: 'enrollments',
      component: () => import('../views/Enrollments.vue'),
      meta: { title: 'Enrollment' },
    },
    {
      path: '/enrollment/:id',
      name: 'enrollment-detail',
      component: () => import('../views/EnrollmentDetail.vue'),
      meta: { title: 'Enrollment Detail' },
    },
    {
      path: '/parents',
      name: 'parents',
      component: () => import('../views/Parents.vue'),
      meta: { title: 'Parent / Guardian' },
    },
    {
      path: '/parents/:id',
      name: 'parent-detail',
      component: () => import('../views/ParentDetail.vue'),
      meta: { title: 'Parent Detail' },
    },
    {
      path: '/students',
      name: 'students',
      component: () => import('../views/Students.vue'),
      meta: { title: 'Students' },
    },
    {
      path: '/students/:id',
      name: 'student-detail',
      component: () => import('../views/StudentDetail.vue'),
      meta: { title: 'Student Detail' },
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

router.beforeEach((to) => {
  const pageTitle = to.meta.title || 'AAA'
  document.title = `${pageTitle} - AAA Online Registration`
})

export default router

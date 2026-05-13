import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import UserAuth from '../components/auth/UserAuth.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: UserAuth,
      meta: { title: 'Login', public: true },
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('../views/Dashboard.vue'),
      meta: { title: 'Dashboard', requiresAuth: true },
    },
    {
      path: '/enrollments',
      name: 'enrollments',
      component: () => import('../views/Enrollments.vue'),
      meta: { title: 'Enrollment', requiresAuth: true, requiresAdmin: true },
    },
    {
      path: '/trials',
      name: 'trials',
      component: () => import('../views/Trials.vue'),
      meta: { title: 'Trials', requiresAuth: true, requiresAdmin: true },
    },
    {
      path: '/enrollments/:id',
      name: 'enrollment-detail',
      component: () => import('../views/EnrollmentDetail.vue'),
      meta: { title: 'Enrollment Detail', requiresAuth: true },
    },
    {
      path: '/branches',
      name: 'branches',
      component: () => import('../views/Branches.vue'),
      meta: { title: 'Branches', requiresAuth: true, requiresAdmin: true },
    },
    {
      path: '/parents',
      name: 'parents',
      component: () => import('../views/Parents.vue'),
      meta: { title: 'Parents', requiresAuth: true, requiresAdmin: true },
    },
    {
      path: '/parents/:id',
      name: 'parent-detail',
      component: () => import('../views/ParentDetail.vue'),
      meta: { title: 'Parent Detail', requiresAuth: true, requiresAdmin: true },
    },
    {
      path: '/students',
      name: 'students',
      component: () => import('../views/Students.vue'),
      meta: { title: 'Students', requiresAuth: true },
    },
    {
      path: '/teachers',
      name: 'teachers',
      component: () => import('../views/Teachers.vue'),
      meta: { title: 'Teachers', requiresAuth: true, requiresAdmin: true },
    },
    {
      path: '/students/:id',
      name: 'student-detail',
      component: () => import('../views/StudentDetail.vue'),
      meta: { title: 'Student Detail', requiresAuth: true },
    },
    {
      path: '/programs',
      name: 'programs',
      component: () => import('../views/Programs.vue'),
      meta: { title: 'Programs', requiresAuth: true },
    },
    {
      path: '/classes',
      name: 'classes',
      component: () => import('../views/Classes.vue'),
      meta: { title: 'Classes', requiresAuth: true, requiresAdmin: true },
    },
    {
      path: '/classes/:id',
      name: 'class-detail',
      component: () => import('../views/ClassDetail.vue'),
      meta: { title: 'Class Detail', requiresAuth: true, requiresAdmin: true },
    },
    {
      path: '/programs/:id',
      name: 'program-detail',
      component: () => import('../views/ProgramDetail.vue'),
      meta: { title: 'Program Detail', requiresAuth: true },
    },
    {
      path: '/payment',
      name: 'payment',
      component: () => import('../views/Payments.vue'),
      meta: { title: 'Payment', requiresAuth: true },
    },
    {
      path: '/terms',
      name: 'terms',
      component: () => import('../views/Terms.vue'),
      meta: { title: 'Terms', requiresAuth: true, requiresAdmin: true },
    },
    {
      path: '/terms/:id',
      name: 'term-detail',
      component: () => import('../views/TermDetail.vue'),
      meta: { title: 'Term Detail', requiresAuth: true, requiresAdmin: true },
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('../views/Settings.vue'),
      meta: { title: 'Settings', requiresAuth: true },
    },
  ],
})

router.beforeEach(async (to) => {
  const authStore = useAuthStore()

  if (!authStore.initialized) {
    await authStore.init()
  }

  const pageTitle = to.meta.title || 'AAA'
  document.title = `${pageTitle} - AAA Online Enrollment`

  if (to.meta.public) {
    if (authStore.isAuthenticated) {
      return '/dashboard'
    }
    return
  }

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return '/'
  }

  if (to.meta.requiresAdmin && !authStore.isAdmin) {
    return '/dashboard'
  }
})

export default router

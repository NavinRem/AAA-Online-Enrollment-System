import { defineStore } from 'pinia'
import { parentService } from '../services/parentService'
import { studentService } from '../services/studentService'
import { programService } from '../services/programService'
import { classService } from '../services/classService'
import { categoryService } from '../services/categoryService'
import { termService } from '../services/termService'
import { trialService } from '../services/trialService'
import { enrollmentService } from '../services/enrollmentService'
import { branchService } from '../services/branchService'
import { scheduleService } from '../services/scheduleService'

export const useDataStore = defineStore('data', {
  state: () => ({
    parents: [],
    students: [],
    programs: [],
    classes: [],
    categories: [],
    terms: [],
    trials: [],
    enrollments: [],
    branches: [],
    schedules: [],
    loading: {
      parents: false,
      students: false,
      programs: false,
      classes: false,
      categories: false,
      terms: false,
      trials: false,
      enrollments: false,
      branches: false,
      schedules: false,
    },
    lastFetched: {
      parents: null,
      students: null,
      programs: null,
      classes: null,
      categories: null,
      terms: null,
      trials: null,
      enrollments: null,
      branches: null,
      schedules: null,
    },
    // Track active promises to prevent race conditions
    activePromises: {},
  }),

  actions: {
    /**
     * Centralized fetcher for all administrative data.
     * Supports granular refreshing of specific modules or a full force-refresh.
     */
    async fetchAllCommonData(force = false, modules = null) {
      const allModules = [
        'parents',
        'students',
        'programs',
        'classes',
        'categories',
        'terms',
        'trials',
        'enrollments',
        'branches',
        'schedules',
      ]

      const targetModules = Array.isArray(modules) ? modules : allModules

      const fetchMap = {
        parents: () => this.fetchParents(force),
        students: () => this.fetchStudents(force),
        programs: () => this.fetchPrograms(force),
        classes: () => this.fetchClasses(force),
        categories: () => this.fetchCategories(force),
        terms: () => this.fetchTerms(force),
        trials: () => this.fetchTrials(force),
        enrollments: () => this.fetchEnrollments(force),
        branches: () => this.fetchBranches(force),
        schedules: () => this.fetchSchedules(force),
      }

      const promises = targetModules.filter((m) => fetchMap[m]).map((m) => fetchMap[m]())

      return Promise.all(promises)
    },

    async fetchParents(force = false) {
      if (this.activePromises.parents) return this.activePromises.parents
      if (!force && this.parents.length > 0 && this.isFresh('parents')) return

      this.loading.parents = true
      this.activePromises.parents = (async () => {
        try {
          const data = await parentService.getAllParents()
          this.parents = Array.isArray(data) ? data : []
          this.lastFetched.parents = Date.now()
        } finally {
          this.loading.parents = false
          delete this.activePromises.parents
        }
      })()
      return this.activePromises.parents
    },

    async fetchStudents(force = false) {
      if (this.activePromises.students) return this.activePromises.students
      if (!force && this.students.length > 0 && this.isFresh('students')) return

      this.loading.students = true
      this.activePromises.students = (async () => {
        try {
          const data = await studentService.getAllStudents()
          this.students = Array.isArray(data) ? data : []
          this.lastFetched.students = Date.now()
        } finally {
          this.loading.students = false
          delete this.activePromises.students
        }
      })()
      return this.activePromises.students
    },

    async fetchPrograms(force = false) {
      if (this.activePromises.programs) return this.activePromises.programs
      if (!force && this.programs.length > 0 && this.isFresh('programs')) return

      this.loading.programs = true
      this.activePromises.programs = (async () => {
        try {
          const data = await programService.getAllPrograms()
          this.programs = Array.isArray(data) ? data : []
          this.lastFetched.programs = Date.now()
        } finally {
          this.loading.programs = false
          delete this.activePromises.programs
        }
      })()
      return this.activePromises.programs
    },

    async fetchClasses(force = false) {
      if (this.activePromises.classes) return this.activePromises.classes
      if (!force && this.classes.length > 0 && this.isFresh('classes')) return

      this.loading.classes = true
      this.activePromises.classes = (async () => {
        try {
          const data = await classService.getAllClasses()
          this.classes = Array.isArray(data) ? data : []
          this.lastFetched.classes = Date.now()
        } finally {
          this.loading.classes = false
          delete this.activePromises.classes
        }
      })()
      return this.activePromises.classes
    },

    async fetchCategories(force = false) {
      if (this.activePromises.categories) return this.activePromises.categories
      if (!force && this.categories.length > 0 && this.isFresh('categories')) return

      this.loading.categories = true
      this.activePromises.categories = (async () => {
        try {
          const data = await categoryService.getAllCategories()
          this.categories = Array.isArray(data) ? data : data?.data || []
          this.lastFetched.categories = Date.now()
        } finally {
          this.loading.categories = false
          delete this.activePromises.categories
        }
      })()
      return this.activePromises.categories
    },

    async fetchTerms(force = false) {
      if (this.activePromises.terms) return this.activePromises.terms
      if (!force && this.terms.length > 0 && this.isFresh('terms')) return

      this.loading.terms = true
      this.activePromises.terms = (async () => {
        try {
          const data = await termService.getAllTerms()
          this.terms = Array.isArray(data) ? data : []
          this.lastFetched.terms = Date.now()
        } finally {
          this.loading.terms = false
          delete this.activePromises.terms
        }
      })()
      return this.activePromises.terms
    },

    async fetchTrials(force = false) {
      if (this.activePromises.trials) return this.activePromises.trials
      if (!force && this.trials.length > 0 && this.isFresh('trials')) return

      this.loading.trials = true
      this.activePromises.trials = (async () => {
        try {
          const data = await trialService.getAllTrials()
          this.trials = Array.isArray(data) ? data : []
          this.lastFetched.trials = Date.now()
        } finally {
          this.loading.trials = false
          delete this.activePromises.trials
        }
      })()
      return this.activePromises.trials
    },

    async fetchEnrollments(force = false) {
      if (this.activePromises.enrollments) return this.activePromises.enrollments
      if (!force && this.enrollments.length > 0 && this.isFresh('enrollments')) return

      this.loading.enrollments = true
      this.activePromises.enrollments = (async () => {
        try {
          // Increase limit to 100000 to ensure analytics (TermDetail, ProgramDetail) 
          // do not truncate data as the database scales past 5000.
          const response = await enrollmentService.getAllEnrollments({ limit: 100000 })
          this.enrollments = response.data || (Array.isArray(response) ? response : [])
          this.lastFetched.enrollments = Date.now()
        } finally {
          this.loading.enrollments = false
          delete this.activePromises.enrollments
        }
      })()
      return this.activePromises.enrollments
    },

    async fetchBranches(force = false) {
      if (this.activePromises.branches) return this.activePromises.branches
      if (!force && this.branches.length > 0 && this.isFresh('branches')) return

      this.loading.branches = true
      this.activePromises.branches = (async () => {
        try {
          const data = await branchService.getAllBranches()
          this.branches = Array.isArray(data) ? data : []
          this.lastFetched.branches = Date.now()
        } finally {
          this.loading.branches = false
          delete this.activePromises.branches
        }
      })()
      return this.activePromises.branches
    },

    async fetchSchedules(force = false) {
      if (this.activePromises.schedules) return this.activePromises.schedules
      if (!force && this.schedules.length > 0 && this.isFresh('schedules')) return

      this.loading.schedules = true
      this.activePromises.schedules = (async () => {
        try {
          const data = await scheduleService.getAllSchedules()
          this.schedules = Array.isArray(data) ? data : []
          this.lastFetched.schedules = Date.now()
        } finally {
          this.loading.schedules = false
          delete this.activePromises.schedules
        }
      })()
      return this.activePromises.schedules
    },

    isFresh(key) {
      const last = this.lastFetched[key]
      if (!last) return false
      const CACHE_TIME = 5 * 60 * 1000 // 5 minutes
      return Date.now() - last < CACHE_TIME
    },
  },

  getters: {
    getProgramWithCategory: (state) => {
      return state.programs.map((p) => {
        const cat = state.categories.find((c) => String(c.id) === String(p.categoryId) || c.name === p.category)
        return {
          ...p,
          categoryProfileURL: cat?.profileURL || '',
        }
      })
    },
  },
})

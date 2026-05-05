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
    loading: {
      parents: false,
      students: false,
      programs: false,
      classes: false,
      categories: false,
      terms: false,
      trials: false,
      enrollments: false,
      branches: false
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
      branches: null
    }
  }),

  actions: {
    /**
     * Centralized fetcher for all administrative data.
     * Supports granular refreshing of specific modules or a full force-refresh.
     */
    async fetchAllCommonData(force = false, modules = null) {
      const allModules = [
        'parents', 'students', 'programs', 'classes', 
        'categories', 'terms', 'trials', 'enrollments', 'branches'
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
        branches: () => this.fetchBranches(force)
      }

      const promises = targetModules
        .filter(m => fetchMap[m])
        .map(m => fetchMap[m]())

      return Promise.all(promises)
    },

    async fetchParents(force = false) {
      if (this.loading.parents) return
      if (!force && this.parents.length > 0 && this.isFresh('parents')) return
      this.loading.parents = true
      try {
        const data = await parentService.getAllParents()
        this.parents = Array.isArray(data) ? data : []
        this.lastFetched.parents = Date.now()
      } finally {
        this.loading.parents = false
      }
    },

    async fetchStudents(force = false) {
      if (this.loading.students) return
      if (!force && this.students.length > 0 && this.isFresh('students')) return
      this.loading.students = true
      try {
        const data = await studentService.getAllStudents()
        this.students = Array.isArray(data) ? data : []
        this.lastFetched.students = Date.now()
      } finally {
        this.loading.students = false
      }
    },

    async fetchPrograms(force = false) {
      if (this.loading.programs) return
      if (!force && this.programs.length > 0 && this.isFresh('programs')) return
      this.loading.programs = true
      try {
        const data = await programService.getAllPrograms()
        this.programs = Array.isArray(data) ? data : []
        this.lastFetched.programs = Date.now()
      } finally {
        this.loading.programs = false
      }
    },

    async fetchClasses(force = false) {
      if (this.loading.classes) return
      if (!force && this.classes.length > 0 && this.isFresh('classes')) return
      this.loading.classes = true
      try {
        const data = await classService.getAllClasses()
        this.classes = Array.isArray(data) ? data : []
        this.lastFetched.classes = Date.now()
      } finally {
        this.loading.classes = false
      }
    },

    async fetchCategories(force = false) {
      if (this.loading.categories) return
      if (!force && this.categories.length > 0 && this.isFresh('categories')) return
      this.loading.categories = true
      try {
        const data = await categoryService.getAllCategories()
        this.categories = Array.isArray(data) ? data : (data?.data || [])
        this.lastFetched.categories = Date.now()
      } finally {
        this.loading.categories = false
      }
    },

    async fetchTerms(force = false) {
      if (this.loading.terms) return
      if (!force && this.terms.length > 0 && this.isFresh('terms')) return
      this.loading.terms = true
      try {
        const data = await termService.getAllTerms()
        this.terms = Array.isArray(data) ? data : []
        this.lastFetched.terms = Date.now()
      } finally {
        this.loading.terms = false
      }
    },

    async fetchTrials(force = false) {
      if (this.loading.trials) return
      if (!force && this.trials.length > 0 && this.isFresh('trials')) return
      this.loading.trials = true
      try {
        const data = await trialService.getAllTrials()
        this.trials = Array.isArray(data) ? data : []
        this.lastFetched.trials = Date.now()
      } finally {
        this.loading.trials = false
      }
    },

    async fetchEnrollments(force = false) {
      if (this.loading.enrollments) return
      // NOTE: For very large datasets, we should only fetch a summary or recent items here.
      // But for small/medium schools, fetching active enrollments is manageable.
      if (!force && this.enrollments.length > 0 && this.isFresh('enrollments')) return
      this.loading.enrollments = true
      try {
        const response = await enrollmentService.getAllEnrollments()
        this.enrollments = response.data || (Array.isArray(response) ? response : [])
        this.lastFetched.enrollments = Date.now()
      } finally {
        this.loading.enrollments = false
      }
    },

    async fetchBranches(force = false) {
      if (this.loading.branches) return
      if (!force && this.branches.length > 0 && this.isFresh('branches')) return
      this.loading.branches = true
      try {
        const data = await branchService.getAllBranches()
        this.branches = Array.isArray(data) ? data : []
        this.lastFetched.branches = Date.now()
      } finally {
        this.loading.branches = false
      }
    },

    isFresh(key) {
      const last = this.lastFetched[key]
      if (!last) return false
      const CACHE_TIME = 5 * 60 * 1000 // 5 minutes
      return (Date.now() - last) < CACHE_TIME
    }
  },

  getters: {
    getProgramWithCategory: (state) => {
      return state.programs.map(p => {
        const cat = state.categories.find(c => c.id === p.categoryId || c.name === p.category)
        return {
          ...p,
          categoryProfileURL: cat?.profileURL || ''
        }
      })
    }
  }
})

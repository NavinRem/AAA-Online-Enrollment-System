<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import DetailPageLayout from '@/components/layout/DetailPageLayout.vue'
import AppBadge from '@/components/common/ui/AppBadge.vue'
import { parentService } from '@/services/parentService'
import { studentService } from '@/services/studentService'
import { authService } from '@/services/authService'
import { enrollmentService } from '@/services/enrollmentService'
import { formatDate, formatPrice } from '@/utils/formatUtils'
import { enrichEnrollments } from '@/utils/enrollmentHelper'
import { enrichStudents } from '@/utils/studentHelper'
import { getStatusTheme, getStatusUI } from '@/utils/badgeUtils'
import { programService } from '@/services/programService'
import { classService } from '@/services/classService'
import {
  processParentProfileImage,
  prepareParentPayload,
} from '../utils/parentHelper'
import { processStudentProfileImage, prepareStudentPayload } from '../utils/studentHelper'
import { getActionIcon } from '@/utils/assetHelper'
import ParentActionModal from '../components/parents/ParentActionModal.vue'

const route = useRoute()
const router = useRouter()

const parent = ref(null)
const students = ref([])
const enrollments = ref([])
const selectedChildId = ref('all')
const activeTab = ref('children')
const currentFilter = ref('all')
const isFilterOpen = ref(false)
const filterToggleRef = ref(null)
const filterMenuRef = ref(null)
const filterMenuStyles = ref({})
const hoveredOption = ref(null)

watch(activeTab, () => {
  currentFilter.value = 'all'
  isFilterOpen.value = false
})

const filterOptions = computed(() => {
  if (activeTab.value === 'children' || activeTab.value === 'history') {
    return [
      { label: activeTab.value === 'children' ? 'All Programs' : 'All History', value: 'all' },
      { label: 'Confirmed', value: 'confirmed' },
      { label: 'Pending', value: 'pending' },
      { label: 'Cancelled', value: 'cancelled' },
    ]
  }
  if (activeTab.value === 'payments') {
    return [
      { label: 'All Payments', value: 'all' },
      { label: 'Paid', value: 'paid' },
      { label: 'Partial', value: 'partial' },
      { label: 'Unpaid', value: 'unpaid' },
    ]
  }
  return []
})

const toggleFilter = (event) => {
  isFilterOpen.value = !isFilterOpen.value
  if (isFilterOpen.value) {
    const rect = event.currentTarget.getBoundingClientRect()
    filterMenuStyles.value = {
      top: `${rect.bottom + window.scrollY + 8}px`,
      right: `${window.innerWidth - rect.right - window.scrollX}px`,
      minWidth: '160px'
    }
  }
}

const selectFilter = (val) => {
  currentFilter.value = val
  isFilterOpen.value = false
}

const handleClickOutside = (event) => {
  if (!isFilterOpen.value) return
  const toggleBtn = filterToggleRef.value?.$el || filterToggleRef.value
  const menuEl = filterMenuRef.value

  if (toggleBtn && !toggleBtn.contains(event.target) && menuEl && !menuEl.contains(event.target)) {
    isFilterOpen.value = false
  }
}

onMounted(() => {
  window.addEventListener('mousedown', handleClickOutside)
})

onUnmounted(() => {
  window.removeEventListener('mousedown', handleClickOutside)
})

const loading = ref(true)
const errorMessage = ref('')
const submitting = ref(false)
const globalSuccess = ref('')
const globalError = ref('')

const currentChildEnrollments = computed(() => {
  let list = enrollments.value
  if (selectedChildId.value && selectedChildId.value !== 'all') {
    list = list.filter((e) => String(e.studentId) === String(selectedChildId.value))
  }
  if (currentFilter.value !== 'all') {
    list = list.filter(e => (e.status || '').toLowerCase() === currentFilter.value.toLowerCase())
  }
  return list
})

const enrollmentHistory = computed(() => {
  let list = [...enrollments.value]
  if (currentFilter.value !== 'all') {
    list = list.filter(e => (e.status || '').toLowerCase() === currentFilter.value.toLowerCase())
  }
  return list.sort((a, b) => new Date(b.enrollAt || 0) - new Date(a.enrollAt || 0))
})

const paymentHistory = computed(() => {
  let list = [...enrollments.value]
  if (currentFilter.value !== 'all') {
    list = list.filter(e => (e.paymentStatus || e.status || '').toLowerCase() === currentFilter.value.toLowerCase())
  }
  return list.sort((a, b) => new Date(b.paidAt || b.enrollAt || 0) - new Date(a.paidAt || a.enrollAt || 0))
})

const isInactive = computed(() => {
  return (parent.value?.status || 'Active').toLowerCase() === 'inactive'
})

const fetchData = async (id) => {
  try {
    loading.value = true
    errorMessage.value = ''

    const parentData = await parentService.getParent(id)
    if (!parentData) throw new Error('Parent not found')

    parent.value = parentData
    const [studentsData, allEnrollments, allPrograms, allClasses] = await Promise.all([
      studentService.getStudentsByParent(id),
      enrollmentService.getAllEnrollments(),
      programService.getAllPrograms(),
      classService.getAllClasses(),
    ])

    students.value = enrichStudents(studentsData || [], [], [])

    if (
      students.value.length > 0 &&
      (selectedChildId.value === 'all' || !selectedChildId.value)
    ) {
      selectedChildId.value = students.value[0].id
    }

    const pId = parent.value.id
    const rawEnrollments = (allEnrollments || []).filter((r) => String(r.parentId) === String(pId))

    enrollments.value = enrichEnrollments(
      rawEnrollments,
      [parent.value],
      students.value,
      allPrograms,
      allClasses,
    )
  } catch (error) {
    console.error('Failed to load parent details', error)
    errorMessage.value = error.message || 'Failed to load details'
  } finally {
    loading.value = false
  }
}

const actionModal = ref({
  isOpen: false,
  type: '',
  user: null,
})

const openActionModal = (type) => {
  globalError.value = ''
  globalSuccess.value = ''
  actionModal.value = {
    isOpen: true,
    type,
    user: parent.value,
  }
}

const openAddChildModal = () => {
  globalError.value = ''
  globalSuccess.value = ''
  actionModal.value = {
    isOpen: true,
    type: 'plus',
    user: parent.value,
  }
}

const submitActionModal = async (formData) => {
  const { type, user } = actionModal.value
  const id = user.id
  submitting.value = true
  globalError.value = ''

  try {
    if (type === 'edit') {
      const finalProfile = await processParentProfileImage(
        formData.profile,
        formData.name,
        user.profileURL,
      )
      const payload = prepareParentPayload({ ...formData, profileURL: finalProfile })
      await parentService.updateParent(id, payload)
      globalSuccess.value = 'Profile updated successfully!'
    } else if (type === 'deactivate') {
      await parentService.updateParent(id, { status: 'inactive' })
      globalSuccess.value = 'Account deactivated successfully!'
    } else if (type === 'activate') {
      await parentService.updateParent(id, { status: 'active' })
      globalSuccess.value = 'Account reactivated successfully!'
    } else if (type === 'delete') {
      await parentService.deleteParent(id)
      router.push('/parents')
      return
    } else if (type === 'plus') {
      const finalProfile = await processStudentProfileImage(formData.profileURL, formData.name)
      const payload = prepareStudentPayload({ ...formData, profileURL: finalProfile, parentId: id })
      await studentService.createStudent(payload)
      globalSuccess.value = 'Child registered successfully!'
    } else if (type === 'reset-password') {
      const result = await authService.adminResetPassword(id)
      globalSuccess.value = `Temporary password generated: ${result.tempPassword}`
    }

    setTimeout(() => {
      actionModal.value.isOpen = false
      globalSuccess.value = ''
    }, type === 'reset-password' ? 5000 : 1500)

    await fetchData(id)
  } catch (err) {
    console.error('Action failed:', err)
    globalError.value = err.message || 'Action failed'
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  if (route.params.id) fetchData(route.params.id)
})
</script>

<template>
  <DashboardLayout>
    <DetailPageLayout :loading="loading" :errorMessage="errorMessage" backRoute="/parents" sidebarWidth="sm">
      <template #header-actions v-if="parent">
        <div class="flex items-center gap-3">
          <button v-if="!isInactive"
            class="w-11 h-11 flex items-center justify-center rounded-full border transition-all duration-300 bg-primary-light hover:bg-purple hover:border-purple group"
            title="Register Child" @click="openAddChildModal">
            <img :src="getActionIcon('plus')" class="w-5 h-5  group-hover:opacity-100" />
          </button>
          <button v-if="!isInactive"
            class="w-11 h-11 flex items-center justify-center rounded-full border transition-all duration-300 bg-primary-light hover:bg-primary hover:border-primary group"
            title="Edit Profile" @click="openActionModal('edit')">
            <img :src="getActionIcon('edit')" class="w-5 h-5 group-hover:opacity-100" />
          </button>
          <button v-if="!isInactive"
            class="w-11 h-11 flex items-center justify-center rounded-full border transition-all duration-300 bg-primary-light hover:bg-warning hover:border-warning group"
            title="Deactivate Account" @click="openActionModal('deactivate')">
            <img :src="getActionIcon('cancel')" class="w-5 h-5 group-hover:opacity-100" />
          </button>
          <button v-if="isInactive"
            class="w-11 h-11 flex items-center justify-center rounded-full border bg-success-soft transition-all duration-300 hover:bg-success hover:border-success group"
            title="Activate Account" @click="openActionModal('activate')">
            <img :src="getActionIcon('reactivate')" class="w-5 h-5 group-hover:opacity-100" />
          </button>
          <div class="w-px h-6 bg-outline-std mx-1"></div>
          <button
            class="w-11 h-11 flex items-center justify-center rounded-full border bg-error-soft transition-all duration-300 hover:bg-error hover:border-error group"
            title="Delete Account" @click="openActionModal('delete')">
            <img :src="getActionIcon('delete')" class="w-5 h-5 icon-danger group-hover:opacity-100" />
          </button>
        </div>
      </template>

      <template #left-content v-if="parent">
        <!-- Tab Navigation -->
        <div class="flex items-center gap-2 p-2 bg-surface-subtle rounded-[1.5rem] border border-outline-std w-fit">
          <button v-for="tab in [
            { id: 'children', label: 'Children List' },
            { id: 'history', label: 'Enrollment History' },
            { id: 'payments', label: 'Payment History' }
          ]" :key="tab.id" @click="activeTab = tab.id"
            class="px-8 py-3 rounded-2xl text-xs font-semibold uppercase tracking-widest transition-all duration-300"
            :class="activeTab === tab.id ? 'bg-primary text-white shadow-md ring-1 ring-black/5 scale-[1.02]' : 'text-content-muted hover:text-content-dark hover:bg-white/50'">
            {{ tab.label }}
          </button>
        </div>

        <!-- Children List Card -->
        <section v-if="activeTab === 'children'" class="ui-detail-card overflow-hidden animate-fade-in">
          <div class="flex items-center gap-4">
            <h3 class="text-lg font-bold text-content-dark whitespace-nowrap">Children List</h3>
            <div class="h-px flex-1 bg-gray-100"></div>
            <button ref="filterToggleRef"
              class="px-4 py-2 text-xs font-semibold uppercase rounded-lg transition-all flex items-center gap-2"
              :class="currentFilter !== 'all' ? '' : 'bg-primary-light hover:bg-primary'"
              :style="currentFilter !== 'all' ? { backgroundColor: getStatusTheme(currentFilter).backgroundColor, color: getStatusTheme(currentFilter).color } : {}"
              @click="toggleFilter">
              <img :src="getActionIcon('filter')" class="w-3 h-3"
                :style="{ filter: getStatusUI(currentFilter === 'all' ? 'filter' : currentFilter).filter }" />
              {{ currentFilter === 'all' ? 'Filter' : currentFilter }}
            </button>
          </div>

          <div class="flex flex-col lg:flex-row gap-8">
            <!-- Left: Child Selector -->
            <div class="w-full lg:w-48 flex flex-col gap-2">
              <div
                class="bg-surface-subtle rounded-xl text-xs p-md font-bold uppercase tracking-widest text-content-muted text-center mb-1">
                Children List
              </div>
              <button v-for="s in students" :key="s.id" @click="selectedChildId = s.id"
                class="p-3 rounded-xl text-sm font-semibold transition-all text-center border-2"
                :class="selectedChildId === s.id ? 'bg-primary text-white shadow-md scale-[1.02]' : 'bg-white border-transparent hover:bg-gray-50 text-content-muted'">
                {{ s.name }}
              </button>
            </div>

            <!-- Right: Table -->
            <div class="flex-1 overflow-x-auto rounded-md border border-gray-100 bg-white">
              <table class="w-full text-left border-collapse">
                <thead>
                  <tr class="bg-gray-50/50">
                    <th class=" p-md text-xs font-semibold text-content-muted uppercase tracking-widest">No</th>
                    <th class=" p-md text-xs font-semibold text-content-muted uppercase tracking-widest">Program</th>
                    <th class=" p-md text-xs font-semibold text-content-muted uppercase tracking-widest">Branch</th>
                    <th class=" p-md text-xs font-semibold text-content-muted uppercase tracking-widest">Session</th>
                    <th class=" p-md text-xs font-semibold text-content-muted uppercase tracking-widest text-center">Status
                    </th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-50">
                  <tr v-for="(enroll, idx) in currentChildEnrollments" :key="enroll.id"
                    class="hover:bg-gray-50/50 transition-colors">
                    <td class=" p-md text-xs font-semibold text-content-muted">{{ idx + 1 }}</td>
                    <td class=" p-md text-sm font-semibold text-content-dark">{{ enroll.programName }}</td>
                    <td class=" p-md text-xs font-semibold text-content-muted uppercase tracking-widest">{{
                      enroll.branchAbbr }} Branch</td>
                    <td class=" p-md text-xs font-semibold text-content-dark leading-tight">{{ enroll.classSchedule }}</td>
                    <td class=" p-md text-center">
                      <AppBadge :status="enroll.status" />
                    </td>
                  </tr>
                  <tr v-if="currentChildEnrollments.length === 0">
                    <td colspan="5" class="p-10 text-center text-content-muted italic text-sm">No active programs found
                      for this child.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <!-- enrollment History Card -->
        <section v-else-if="activeTab === 'history'" class="ui-detail-card overflow-hidden animate-fade-in">
          <div class="flex items-center gap-4">
            <h3 class="text-lg font-bold text-content-dark whitespace-nowrap">Enrollment History</h3>
            <div class="h-px flex-1 bg-gray-100"></div>
            <button ref="filterToggleRef"
              class="px-4 py-2 text-xs font-semibold uppercase rounded-lg transition-all flex items-center gap-2"
              :class="currentFilter !== 'all' ? '' : 'bg-primary-light hover:bg-primary'"
              :style="currentFilter !== 'all' ? { backgroundColor: getStatusTheme(currentFilter).backgroundColor, color: getStatusTheme(currentFilter).color } : {}"
              @click="toggleFilter">
              <img :src="getActionIcon('filter')" class="w-3 h-3"
                :style="{ filter: getStatusUI(currentFilter === 'all' ? 'filter' : currentFilter).filter }" />
              {{ currentFilter === 'all' ? 'Filter' : currentFilter }}
            </button>
          </div>

          <div class="p-0">
            <div class="overflow-x-auto rounded-md border border-gray-100 bg-white">
              <table class="w-full text-left border-collapse">
                <thead>
                  <tr class="bg-gray-50/50">
                    <th class=" p-md text-xs font-semibold text-content-muted uppercase tracking-widest">No</th>
                    <th class=" p-md text-xs font-semibold text-content-muted uppercase tracking-widest">
                      Enrollment ID
                    </th>
                    <th class=" p-md text-xs font-semibold text-content-muted uppercase tracking-widest">Program</th>
                    <th class=" p-md text-xs font-semibold text-content-muted uppercase tracking-widest">Child</th>
                    <th class=" p-md text-xs font-semibold text-content-muted uppercase tracking-widest">Registered
                      Date
                    </th>
                    <th class=" p-md text-xs font-semibold text-content-muted uppercase tracking-widest text-center">
                      Status</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-50">
                  <tr v-for="(enroll, idx) in enrollmentHistory" :key="enroll.id"
                    class="hover:bg-gray-50/50 transition-colors">
                    <td class=" p-md text-xs font-semibold text-content-muted">{{ idx + 1 }}</td>
                    <td class=" p-md text-xs font-mono text-content-dark">{{ enroll.id.slice(0, 12) }}...</td>
                    <td class=" p-md text-sm font-semibold text-content-dark">{{ enroll.programName }}</td>
                    <td class=" p-md text-sm font-semibold text-primary">{{ enroll.studentName }}</td>
                    <td class=" p-md text-xs font-semibold text-content-muted tabular-nums">{{ formatDate(enroll.enrollAt)
                    }}</td>
                    <td class=" p-md text-center">
                      <AppBadge :status="enroll.status" />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <!-- Payment History Card -->
        <section v-else-if="activeTab === 'payments'" class="ui-detail-card overflow-hidden animate-fade-in">
          <div class="flex items-center gap-4">
            <h3 class="text-lg font-bold text-content-dark whitespace-nowrap">Payment History</h3>
            <div class="h-px flex-1 bg-gray-100"></div>
            <button class="px-4 py-2 text-xs font-semibold uppercase rounded-lg transition-all flex items-center gap-2"
              :class="currentFilter !== 'all' ? '' : 'bg-primary-light hover:bg-primary'"
              :style="currentFilter !== 'all' ? { backgroundColor: getStatusTheme(currentFilter).backgroundColor, color: getStatusTheme(currentFilter).color } : {}"
              @click="toggleFilter">
              <img :src="getActionIcon('filter')" class="w-3 h-3"
                :style="{ filter: getStatusUI(currentFilter === 'all' ? 'filter' : currentFilter).filter }" />
              {{ currentFilter === 'all' ? 'Filter' : currentFilter }}
            </button>
          </div>

          <div class="p-0">
            <div class="overflow-x-auto rounded-md border border-gray-100 bg-white">
              <table class="w-full text-left border-collapse">
                <thead>
                  <tr class="bg-gray-50/50">
                    <th class=" p-md text-xs font-semibold text-content-muted uppercase tracking-widest">No</th>
                    <th class=" p-md text-xs font-semibold text-content-muted uppercase tracking-widest">Transaction
                      ID
                    </th>
                    <th class=" p-md text-xs font-semibold text-content-muted uppercase tracking-widest">
                      Enrollment ID
                    </th>
                    <th class=" p-md text-xs font-semibold text-content-muted uppercase tracking-widest text-center">
                      Amount</th>
                    <th class=" p-md text-xs font-semibold text-content-muted uppercase tracking-widest">Paid Date
                    </th>
                    <th class=" p-md text-xs font-semibold text-content-muted uppercase tracking-widest text-center">
                      Status</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-50">
                  <tr v-for="(enroll, idx) in paymentHistory" :key="enroll.id"
                    class="hover:bg-gray-50/50 transition-colors">
                    <td class=" p-md text-xs font-semibold text-content-muted">{{ idx + 1 }}</td>
                    <td class=" p-md text-xs font-mono text-content-dark">{{ enroll.transactionId || enroll.id.slice(0,
                      12).toUpperCase() }}</td>
                    <td class=" p-md text-xs font-mono text-content-muted">{{ enroll.id.slice(0, 12) }}...</td>
                    <td class=" p-md text-sm font-semibold text-content-dark text-center">${{ formatPrice(enroll.amount) }}
                    </td>
                    <td class=" p-md text-xs font-semibold text-content-muted tabular-nums">{{ formatDate(enroll.paidAt ||
                      enroll.enrollAt) }}</td>
                    <td class=" p-md text-center">
                      <AppBadge :status="enroll.paymentStatus || enroll.status" />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </template>

      <template #right-content v-if="parent">
        <div class="flex flex-col gap-8">
          <!-- Basic Info Card -->
          <section class="ui-detail-card flex flex-col items-center gap-6">
            <h2 class="w-full font-bold text-content-dark text-center">Basic Information</h2>
            <div class="relative group">
              <div
                class="w-40 h-40 rounded-full overflow-hidden ring-4 ring-white shadow-2xl transition-transform duration-500 group-hover:scale-105 border-2 border-gray-100">
                <img :src="parent.profileURL" class="w-full h-full object-cover" />
              </div>
            </div>
          </section>

          <!-- Parent Information Card -->
          <section class="ui-detail-card bg-primary-soft/30 border-primary/10">
            <h6 class="font-bold uppercase tracking-widest text-content-muted">Parent Information</h6>

            <div class="space-y-5">
              <div class="flex justify-between gap-1">
                <span class="text-lg font-bold text-content-dark">Parent Name:</span>
                <span class="text-md font-bold text-content-muted">{{ parent.name }}</span>
              </div>
              <div class="flex justify-between gap-1">
                <span class="text-lg font-bold text-content-dark">Phone Number:</span>
                <span class="text-md font-bold text-content-muted tabular-nums">{{ parent.phone }}</span>
              </div>
              <div class="flex justify-between gap-1">
                <span class="text-lg font-bold text-content-dark">Email:</span>
                <span class="text-md font-bold text-content-muted lowercase">{{ parent.email }}</span>
              </div>
              <div class="flex justify-between gap-1">
                <span class="text-lg font-bold text-content-dark">Status:</span>
                <div>
                  <AppBadge :status="parent.status" />
                </div>
              </div>
            </div>
          </section>

          <!-- Relationships Card -->
          <section class="ui-detail-card bg-primary-soft/30 border-primary/10">
            <h6 class="font-bold uppercase tracking-widest text-content-muted">Children</h6>
            <div class="space-y-4">
              <div v-for="s in students" :key="s.id" @click="router.push(`/students/${s.id}`)"
                class="flex items-center gap-3 p-2 rounded-xl hover:bg-surface-subtle transition-all cursor-pointer group">
                <div class="w-8 h-8 rounded-full overflow-hidden border-2 border-white shadow-sm">
                  <img :src="s.profileURL" class="w-full h-full object-cover" />
                </div>
                <span class="text-md font-bold text-content-dark group-hover:text-primary transition-colors">{{ s.name
                }}</span>
                <AppBadge type="blue" class="ml-auto text-xs px-2 py-0.5">
                  {{ s.age }} years old
                </AppBadge>
              </div>
            </div>
          </section>

          <!-- Account Timestamps Card -->
          <section class="ui-detail-card bg-surface-subtle/50">
            <h6 class="font-bold uppercase tracking-widest text-content-muted">Account Timestamp</h6>
            <div class="space-y-6">
              <div class="flex items-center gap-3">
                <AppBadge type="green" class="text-md px-2 py-xs">
                  Created At
                </AppBadge>
                <div class="text-sm font-semibold text-content-muted leading-tight tabular-nums">
                  {{ formatDate(parent.createdAt) }}
                </div>
              </div>

              <div class="flex items-center gap-3">
                <AppBadge type="blue" class="text-md px-2 py-xs">
                  Updated At
                </AppBadge>
                <div class="text-sm font-semibold text-content-muted leading-tight tabular-nums">
                  {{ formatDate(parent.updatedAt || parent.createdAt) }}
                </div>
              </div>
            </div>
          </section>
        </div>
      </template>
    </DetailPageLayout>

    <!-- Shared Filter Menu -->
    <Teleport to="body">
      <transition enter-active-class="transition duration-200 ease-out" enter-from-class="transform scale-95 opacity-0"
        enter-to-class="transform scale-100 opacity-100" leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100" leave-to-class="opacity-0">
        <div v-if="isFilterOpen" ref="filterMenuRef"
          class="fixed bg-white rounded-xl shadow-2xl border border-outline-std z-[9999] p-2 min-w-[180px] overflow-hidden"
          :style="filterMenuStyles">
          <div v-for="option in filterOptions" :key="option.value"
            class="px-4 py-2.5 text-sm font-semibold cursor-pointer transition-all rounded-lg flex items-center justify-between group"
            :class="[
              currentFilter === option.value ? 'shadow-sm' : '',
              currentFilter === option.value ? '' : 'text-content-muted'
            ]" :style="currentFilter === option.value || hoveredOption === option.value ? {
              backgroundColor: getStatusTheme(option.value).backgroundColor,
              color: getStatusTheme(option.value).color,
              transform: hoveredOption === option.value ? 'translateX(4px)' : ''
            } : {}" @click="selectFilter(option.value)" @mouseenter="hoveredOption = option.value"
            @mouseleave="hoveredOption = null">
            <span>{{ option.label }}</span>
            <div v-if="option.value !== 'all'" class="w-2 h-2 rounded-full transition-transform group-hover:scale-125"
              :style="{ backgroundColor: getStatusTheme(option.value).color }"></div>
          </div>
        </div>
      </transition>
    </Teleport>

    <ParentActionModal :isOpen="actionModal.isOpen" :type="actionModal.type" :user="actionModal.user"
      :loading="submitting" v-model:error="globalError" v-model:success="globalSuccess"
      @close="actionModal.isOpen = false" @submit="submitActionModal" />
  </DashboardLayout>
</template>

<style scoped>
.ui-detail-card {
  @apply bg-white border border-outline-std shadow-sm p-8 rounded-md;
}

.ui-detail-card-title {
  @apply text-lg font-bold text-content-dark tracking-tight;
}

.filter-btn {
  @apply px-4 py-2 bg-primary-soft text-primary text-xs font-semibold uppercase rounded-lg transition-all hover:bg-primary-light;
}

/* Hide scrollbar for Chrome, Safari and Opera */
.overflow-x-auto::-webkit-scrollbar {
  display: none;
}

/* Hide scrollbar for IE, Edge and Firefox */
.overflow-x-auto {
  -ms-overflow-style: none;
  /* IE and Edge */
  scrollbar-width: none;
  /* Firefox */
}
</style>

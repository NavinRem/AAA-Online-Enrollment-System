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
import { formatDate, formatPrice, calculateClassProgress } from '@/utils/formatUtils'
import { enrichEnrollments } from '@/utils/enrollmentHelper'
import { enrichStudents } from '@/utils/studentHelper'
import { getStatusTheme } from '@/utils/badgeUtils'
import { programService } from '@/services/programService'
import { classService } from '@/services/classService'
import {
  processParentProfileImage,
  prepareParentPayload,
} from '../utils/parentHelper'
import { processStudentProfileImage, prepareStudentPayload } from '../utils/studentHelper'
import { getActionIcon } from '@/utils/assetHelper'
import ParentActionModal from '../components/parents/ParentActionModal.vue'
import EntityProfileCard from '@/components/common/detail/EntityProfileCard.vue'
import EntityInfoCard from '@/components/common/detail/EntityInfoCard.vue'
import RelationshipsCard from '@/components/common/detail/RelationshipsCard.vue'
import TimestampCard from '@/components/common/detail/TimestampCard.vue'
import EnrollmentTable from '@/components/common/detail/EnrollmentTable.vue'
import PaymentTable from '@/components/common/detail/PaymentTable.vue'

const route = useRoute()
const router = useRouter()

const parent = ref(null)
const students = ref([])
const enrollments = ref([])
const selectedChildId = ref('all')
const activeTab = ref('children')

// No local filters needed as per request

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
  return list
})

const enrollmentHistory = computed(() => {
  return [...enrollments.value].sort((a, b) => new Date(b.enrollAt || 0) - new Date(a.enrollAt || 0))
})

const paymentHistory = computed(() => {
  return [...enrollments.value].sort((a, b) => new Date(b.paidAt || b.enrollAt || 0) - new Date(a.paidAt || a.enrollAt || 0))
})

const isInactive = computed(() => {
  return (parent.value?.status || 'Active').toLowerCase() === 'inactive'
})

const parentInfoFields = computed(() => [
  { label: 'Parent Name', value: parent.value?.name },
  { label: 'Phone Number', value: parent.value?.phone },
  { label: 'Email', value: parent.value?.email },
  { label: 'Status', value: parent.value?.status, isBadge: true }
])

const childrenItems = computed(() => students.value.map(s => ({
  id: s.id,
  name: s.name,
  profileURL: s.profileURL,
  badgeText: `${s.age} years old`,
  route: `/students/${s.id}`
})))

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
    const enrollmentData = allEnrollments?.data || (Array.isArray(allEnrollments) ? allEnrollments : [])
    const rawEnrollments = enrollmentData.filter((r) => String(r.parentId) === String(pId))

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
            class="w-11 h-11 flex items-center justify-center rounded-full border transition-all duration-300 bg-primary-soft hover:bg-purple hover:border-purple group"
            title="Register Child" @click="openAddChildModal">
            <img :src="getActionIcon('plus')" class="w-5 h-5  group-hover:opacity-100" />
          </button>
          <button v-if="!isInactive"
            class="w-11 h-11 flex items-center justify-center rounded-full border transition-all duration-300 bg-primary-soft hover:bg-primary hover:border-primary group"
            title="Edit Profile" @click="openActionModal('edit')">
            <img :src="getActionIcon('edit')" class="w-5 h-5 group-hover:opacity-100" />
          </button>
          <button v-if="!isInactive"
            class="w-11 h-11 flex items-center justify-center rounded-full border transition-all duration-300 bg-primary-soft hover:bg-warning hover:border-warning group"
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
            class="px-8 py-3 rounded-2xl text-xs font-semibold  transition-all duration-300"
            :class="activeTab === tab.id ? 'bg-primary text-white shadow-md ring-1 ring-black/5 scale-[1.02]' : 'text-content-muted hover:text-content-dark hover:bg-white/50'">
            {{ tab.label }}
          </button>
        </div>

        <!-- Children List Card -->
        <section v-if="activeTab === 'children'" class="ui-detail-card overflow-hidden animate-fade-in">
          <div class="flex items-center gap-4">
            <h3 class="text-lg font-bold text-content-dark whitespace-nowrap">Active Programs</h3>
            <div class="h-px flex-1 bg-gray-100"></div>
          </div>

          <div class="flex flex-col lg:flex-row gap-8">
            <!-- Left: Child Selector -->
            <div class="w-full lg:w-48 flex flex-col gap-2">
              <div class="bg-surface-subtle rounded-xl text-xs p-md font-bold  text-content-muted text-center mb-1">
                Children List
              </div>
              <button v-for="s in students" :key="s.id" @click="selectedChildId = s.id"
                class="p-3 rounded-xl text-sm font-semibold transition-all text-center border-2"
                :class="selectedChildId === s.id ? 'bg-primary text-white shadow-md scale-[1.02]' : 'bg-white border-transparent hover:bg-gray-50 text-content-muted'">
                {{ s.name }}
              </button>
            </div>

            <!-- Right: Table -->
            <div class="flex-1">
              <EnrollmentTable :items="currentChildEnrollments" showSchedule statusMode="class"
                emptyMessage="No active programs found for this child." />
            </div>
          </div>
        </section>

        <!-- enrollment History Card -->
        <section v-else-if="activeTab === 'history'" class="ui-detail-card overflow-hidden animate-fade-in">
          <div class="flex items-center gap-4">
            <h3 class="text-lg font-bold text-content-dark whitespace-nowrap">Enrollment History</h3>
            <div class="h-px flex-1 bg-gray-100"></div>
          </div>

          <div class="p-0">
            <EnrollmentTable :items="enrollmentHistory" showChild showDate
              emptyMessage="No enrollment history found for this family." />
          </div>
        </section>

        <!-- Payment History Card -->
        <section v-else-if="activeTab === 'payments'" class="ui-detail-card overflow-hidden animate-fade-in">
          <div class="flex items-center gap-4">
            <h3 class="text-lg font-bold text-content-dark whitespace-nowrap">Payment History</h3>
            <div class="h-px flex-1 bg-gray-100"></div>
          </div>

          <div class="p-0">
            <PaymentTable :items="paymentHistory" emptyMessage="No payment history found for this family." />
          </div>
        </section>
      </template>

      <template #right-content v-if="parent">
        <div class="flex flex-col gap-8">
          <EntityProfileCard :profileURL="parent.profileURL" title="Basic Information"
            fallbackImage="profiles/avatar-parent" />
          <EntityInfoCard title="Parent Information" :fields="parentInfoFields" />
          <RelationshipsCard title="Children" :items="childrenItems" />
          <TimestampCard :createdAt="parent.createdAt" :updatedAt="parent.updatedAt" />
        </div>
      </template>
    </DetailPageLayout>

    <!-- Shared Filter Menu -->
    <!-- Removed Filter Teleport as per request -->

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
  @apply px-4 py-2 bg-primary-soft text-primary text-xs font-semibold rounded-lg transition-all hover:bg-primary-soft;
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

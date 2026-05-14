<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import DetailPageLayout from '@/components/layout/DetailPageLayout.vue'
import AppBadge from '@/components/common/ui/AppBadge.vue'
import EnrollmentActionModal from '@/components/enrollments/EnrollmentActionModal.vue'
import EnrollmentFormModal from '@/components/enrollments/EnrollmentFormModal.vue'
import AppButton from '@/components/common/ui/AppButton.vue'
import { enrollmentService } from '@/services/enrollmentService'
import { parentService } from '@/services/parentService'
import { studentService } from '@/services/studentService'
import { programService } from '@/services/programService'
import { formatDate, formatDateOnly, formatPrice, calculateAge } from '@/utils/formatUtils'
import { getSessionDay, getSessionTime } from '@/utils/sessionHelper'
import EntityProfileCard from '@/components/common/detail/EntityProfileCard.vue'
import EntityInfoCard from '@/components/common/detail/EntityInfoCard.vue'
import RelationshipsCard from '@/components/common/detail/RelationshipsCard.vue'
import TimestampCard from '@/components/common/detail/TimestampCard.vue'

import {
  getActionIcon,
} from '@/utils/assetHelper'
import { getAvatarUrl } from '@/utils/profileHelper'

const route = useRoute()
const router = useRouter()

const enrollment = ref(null)

// For EnrollmentFormModal
const parents = ref([])
const students = ref([])
const programs = ref([])
const classes = ref([])
const enrollments = ref([])
const activeTab = ref('overview')

const formLoading = ref(false)
const loading = ref(true)
const errorMessage = ref('')

const submitting = ref(false)
const modalError = ref('')
const modalSuccess = ref('')

const actionModal = ref({
  isOpen: false,
  type: '',
  enrollment: null,
})

const showFormModal = ref(false)

const enrollmentInfoFields = computed(() => [
  { label: 'Registration ID', value: enrollment.value?.id },
  {
    label: 'Status',
    value:
      enrollment.value?.status === 'cancelled'
        ? 'Canceled'
        : enrollment.value?.paymentStatus?.toLowerCase() === 'paid'
          ? 'Paid'
          : 'Unpaid',
    isBadge: true,
  },
  { label: 'Registration Date', value: formatDate(enrollment.value?.enrollAt || enrollment.value?.createdAt) },
])

const paymentSummaryFields = computed(() => [
  {
    label: 'Total Amount',
    value: enrollment.value?.amount ? `$${formatPrice(enrollment.value.amount)}` : '$0',
    isBadge: true,
    badgeColor: enrollment.value?.isProrated ? 'partial' : 'full',
  },
  { label: 'Transaction ID', value: enrollment.value?.transactionId || 'N/A' },
  { label: 'Payment Date', value: enrollment.value?.paidAt ? formatDate(enrollment.value.paidAt) : 'N/A' },
])

const programSummaryFields = computed(() => [
  { label: 'Course', value: enrollment.value?.class?.program?.name || enrollment.value?.program?.name },
  {
    label: 'Schedule',
    value: `${getSessionDay(enrollment.value?.class?.schedule || enrollment.value?.classSchedule)}, ${getSessionTime(enrollment.value?.class?.schedule || enrollment.value?.classSchedule)}`,
  },
  { label: 'Start Date', value: formatDate(enrollment.value?.class?.startDate || enrollment.value?.enrollAt) },
])

const familyItems = computed(() => {
  if (!enrollment.value) return []
  return [
    {
      id: enrollment.value.parent?.id,
      name: enrollment.value.parent?.name,
      profileURL: enrollment.value.parent?.profileURL,
      badgeText: 'Parent',
      description: enrollment.value.parent?.email,
      route: `/parents/${enrollment.value.parent?.id}`,
    },
    {
      id: enrollment.value.student?.id,
      name: enrollment.value.student?.name,
      profileURL: enrollment.value.student?.profileURL,
      badgeText: 'Student',
      description: `${calculateAge(enrollment.value.student?.dob)} yrs`,
      route: `/students/${enrollment.value.student?.id}`,
    },
  ]
})

const openActionModal = (type) => {
  modalError.value = ''
  modalSuccess.value = ''

  if (type === 'edit') {
    showFormModal.value = true
    return
  }

  actionModal.value = {
    isOpen: true,
    type,
    enrollment: enrollment.value,
  }
}

const closeActionModal = () => {
  actionModal.value.isOpen = false
}

const handleActionSubmit = async (payload) => {
  const { type } = actionModal.value
  const { amount, remark, proof, reason, paymentMethod, deleteConfirm } = payload
  submitting.value = true
  modalError.value = ''

  try {
    if (type === 'pay') {
      const { bankName, paymentMethod: methodType, proof, remark, paymentStatus } = payload

      const paymentData = {
        paymentStatus: paymentStatus || 'paid',
        paymentMethod: methodType,
        bankName: methodType === 'online' ? bankName : null,
        transactionId: proof,
        remark: remark?.trim() || '',
        amount: enrollment.value.amount,
      }

      await enrollmentService.processPayment(enrollment.value.id, paymentData)

      // Refresh enrollment data
      const updated = await enrollmentService.getEnrollment(enrollment.value.id)
      enrollment.value = updated
    } else if (type === 'cancel') {
      await enrollmentService.cancelEnrollment(enrollment.value.id)
      await enrollmentService.updateEnrollment(enrollment.value.id, { cancelReason: reason })
      enrollment.value.status = 'cancelled'
      enrollment.value.cancelReason = reason
    } else if (type === 'delete') {
      if (deleteConfirm !== 'DELETE') throw new Error('You must type DELETE to confirm.')
      await enrollmentService.deleteEnrollment(enrollment.value.id)
      modalSuccess.value = 'Enrollment deleted. Redirecting...'
      setTimeout(() => router.push('/enrollments'), 1500)
      return
    } else if (type === 'edit') {
      await enrollmentService.updateEnrollment(enrollment.value.id, {
        amount: Number(amount),
        remark: remark?.trim(),
      })
      enrollment.value.amount = Number(amount)
      enrollment.value.remark = remark?.trim()
    }

    modalSuccess.value = 'Action completed successfully.'
    setTimeout(() => {
      closeActionModal()
    }, 1500)
  } catch (err) {
    modalError.value = err.message || 'Action failed.'
  } finally {
    submitting.value = false
  }
}

const fetchDependencyData = async () => {
  try {
    formLoading.value = true
    const [parentsRes, programsRes, studentsRes, enrollmentsRes] = await Promise.all([
      parentService.getAllParents(),
      programService.getAllPrograms(),
      studentService.getAllStudents(),
      enrollmentService.getAllEnrollments(),
    ])
    parents.value = Array.isArray(parentsRes) ? parentsRes : []
    programs.value = Array.isArray(programsRes) ? programsRes : []
    students.value = Array.isArray(studentsRes) ? studentsRes : []
    enrollments.value = enrollmentsRes?.data || (Array.isArray(enrollmentsRes) ? enrollmentsRes : [])
  } catch (err) {
    console.error('Failed to load dependency data for form', err)
  } finally {
    formLoading.value = false
  }
}

const handleProgramChange = async (programId) => {
  if (!programId) {
    classes.value = []
    return
  }
  try {
    const data = await programService.getClasses(programId)
    classes.value = Array.isArray(data) ? data : []
  } catch (err) {
    console.error('Failed to load classes', err)
  }
}

const handleEditSubmit = async (formData) => {
  submitting.value = true
  modalError.value = ''
  try {
    const payload = {
      ...formData,
      amount: Number(formData.amount),
      discountAmount: Number(formData.discountAmount || 0),
      basePrice: Number(formData.basePrice || 0),
      passedSessions: Number(formData.passedSessions || 0),
      prorateSavings: Number(formData.prorateSavings || 0),
    }

    await enrollmentService.updateEnrollment(enrollment.value.id, payload)
    modalSuccess.value = 'Enrollment updated successfully!'

    const updated = await enrollmentService.getEnrollment(enrollment.value.id)
    enrollment.value = updated

    setTimeout(() => {
      showFormModal.value = false
      modalSuccess.value = ''
    }, 1500)
  } catch (err) {
    modalError.value = err.message || 'Failed to update enrollment.'
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  try {
    const id = route.params.id
    if (!id) throw new Error('No Enrollment ID provided')

    loading.value = true
    const [data] = await Promise.all([enrollmentService.getEnrollment(id), fetchDependencyData()])

    if (!data) throw new Error('Enrollment not found')

    enrollment.value = data
  } catch (error) {
    errorMessage.value = error.message || 'Failed to load details'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <DashboardLayout>
    <DetailPageLayout
      :loading="loading"
      :errorMessage="errorMessage"
      backRoute="/enrollments"
      sidebarWidth="sm"
    >
      <template #header-actions v-if="enrollment">
        <div class="flex items-center gap-3">
          <button
            v-if="enrollment.status !== 'cancelled'"
            class="w-11 h-11 flex items-center justify-center rounded-full border border-outline-std bg-primary-soft transition-all duration-300 hover:bg-primary hover:border-primary group"
            title="Edit Enrollment"
            @click="openActionModal('edit')"
          >
            <img :src="getActionIcon('edit')" class="w-5 h-5 brightness-0 transition-all" />
          </button>
          <button
            v-if="
              enrollment.status !== 'confirmed' &&
              enrollment.paymentStatus !== 'paid' &&
              enrollment.status !== 'cancelled'
            "
            class="w-11 h-11 flex items-center justify-center rounded-full border border-outline-std bg-success-soft transition-all duration-300 hover:bg-success hover:border-success group"
            title="Pay Enrollment"
            @click="openActionModal('pay')"
          >
            <img :src="getActionIcon('pay')" class="w-5 h-5 brightness-0 transition-all" />
          </button>
          <button
            v-if="enrollment.status !== 'cancelled'"
            class="w-11 h-11 flex items-center justify-center rounded-full border border-outline-std bg-warning-soft transition-all duration-300 hover:bg-warning hover:border-warning group"
            title="Cancel Enrollment"
            @click="openActionModal('cancel')"
          >
            <img :src="getActionIcon('cancel')" class="w-5 h-5 brightness-0 transition-all" />
          </button>
          <button
            class="w-11 h-11 flex items-center justify-center rounded-full border border-outline-std bg-error-soft transition-all duration-300 hover:bg-error hover:border-error group"
            title="Delete Enrollment"
            @click="openActionModal('delete')"
          >
            <img :src="getActionIcon('delete')" class="w-5 h-5 brightness-0 transition-all" />
          </button>
        </div>
      </template>

      <template #left-content v-if="enrollment">
        <!-- Tab Navigation -->
        <div class="flex items-center gap-1 p-1 bg-white rounded-xl border border-outline-std w-fit mb-6">
          <button
            v-for="tab in [
              { id: 'overview', label: 'Enrollment Overview' },
              { id: 'session', label: 'Session & Teacher' },
            ]"
            :key="tab.id"
            @click="activeTab = tab.id"
            class="px-8 py-2.5 rounded-lg text-xs font-bold transition-all duration-300"
            :class="
              activeTab === tab.id
                ? 'bg-primary text-white shadow-md'
                : 'text-content-muted hover:text-content-dark'
            "
          >
            {{ tab.label }}
          </button>
        </div>

        <div v-if="activeTab === 'overview'" class="grid grid-cols-1 lg:grid-cols-2 gap-lg pb-10 animate-fade-in">
          <section class="ui-detail-card">
            <h3 class="ui-detail-card-title">Course Information</h3>
            <div class="flex justify-center">
              <div class="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-md">
                <img
                  :src="enrollment.class?.program?.profileURL"
                  class="w-full h-full object-cover bg-white"
                />
              </div>
            </div>
            <div class="bg-primary-soft/30 rounded-xl p-6 flex flex-col gap-3">
              <p class="text-sm">
                <strong>Course title:</strong>
                <span class="">{{
                  enrollment.class?.program?.name || enrollment.program?.name
                }}</span>
              </p>
              <p class="text-sm">
                <strong>Session:</strong>
                <span class=""
                  >{{ getSessionDay(enrollment.class?.schedule || enrollment.classSchedule) }},
                  {{ getSessionTime(enrollment.class?.schedule || enrollment.classSchedule) }}</span
                >
              </p>
              <p class="text-sm">
                <strong>Number Session Enrolled:</strong>
                <span class="">{{
                  enrollment.remainingSessions !== undefined
                    ? enrollment.remainingSessions
                    : enrollment.totalSessions ||
                      enrollment.class?.program?.totalSessions ||
                      enrollment.program?.totalSessions ||
                      '10'
                }}</span>
              </p>
              <p class="text-sm">
                <strong>Date:</strong>
                <span class="tabular-nums">{{
                  formatDate(enrollment.enrollAt || enrollment.createdAt)
                }}</span>
              </p>
            </div>
          </section>

          <section class="ui-detail-card">
            <h3 class="ui-detail-card-title">Student Profile</h3>
            <div class="flex justify-center">
              <div class="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-md">
                <img
                  :src="getAvatarUrl(enrollment.student?.profileURL)"
                  class="w-full h-full object-cover"
                />
              </div>
            </div>
            <div class="bg-primary-soft/30 rounded-xl p-6 flex flex-col gap-3">
              <p class="text-sm">
                <strong>Fullname:</strong>
                <span class="">{{ enrollment.student?.name || 'N/A' }}</span>
              </p>
              <p class="text-sm">
                <strong>Date of birth:</strong>
                <span class="">{{ formatDateOnly(enrollment.student?.dob) }}</span>
              </p>
              <p class="text-sm">
                <strong>Age:</strong>
                <span class="">{{ calculateAge(enrollment.student?.dob) }}</span>
              </p>
              <p class="text-sm">
                <strong>Medical Note:</strong>
                <span class="">{{ enrollment.student?.medicalNote || 'None' }}</span>
              </p>
            </div>
          </section>
        </div>

        <div v-else-if="activeTab === 'session'" class="grid grid-cols-1 lg:grid-cols-2 gap-lg pb-10 animate-fade-in">
          <section class="ui-detail-card">
            <h3 class="ui-detail-card-title">Teacher Assignment</h3>
            <div class="flex justify-center">
              <div class="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-md">
                <img
                  :src="
                    getAvatarUrl(
                      enrollment.class?.teacher?.profileURL ||
                        enrollment.class?.teachers?.[0]?.profileURL ||
                        enrollment.program?.teachers?.[0]?.profileURL,
                    )
                  "
                  class="w-full h-full object-cover bg-white"
                />
              </div>
            </div>
            <div class="bg-primary-soft/30 rounded-xl p-6 flex flex-col gap-3">
              <p class="text-sm">
                <strong>Teacher Name:</strong>
                <span class="">{{
                  enrollment.teacher?.name ||
                  enrollment.class?.teachers?.map((t) => t.name).join(', ') ||
                  enrollment.program?.teachers?.[0]?.name ||
                  'N/A'
                }}</span>
              </p>
              <p class="text-sm">
                <strong>Contact Email:</strong>
                <span class="">{{ enrollment.teacher?.email || 'N/A' }}</span>
              </p>
            </div>
          </section>

          <section class="ui-detail-card">
            <h3 class="ui-detail-card-title">Class Capacity</h3>
            <div class="bg-primary-soft/30 rounded-xl p-6 flex flex-col gap-3 h-full justify-center">
              <div class="flex flex-col items-center gap-2">
                <span class="text-4xl font-bold text-primary">{{ enrollment.studentCountAtEnrollment ?? enrollment.class?.currentCount ?? 0 }}</span>
                <span class="text-xs font-semibold text-content-muted uppercase tracking-widest">Active Students</span>
              </div>
              <div class="border-t border-primary/10 mt-4 pt-4">
                <p class="text-xs text-center text-content-muted italic">
                  * Live count at time of enrollment
                </p>
              </div>
            </div>
          </section>
        </div>
      </template>

      <template #right-content v-if="enrollment">
        <div class="flex flex-col gap-8">
          <EntityProfileCard
            :profileURL="enrollment.student?.profileURL"
            title="Enrollment Profile"
            fallbackImage="profiles/avatar-student"
          />
          <EntityInfoCard title="Enrollment Context" :fields="enrollmentInfoFields" />
          <EntityInfoCard title="Payment Summary" :fields="paymentSummaryFields" />
          <EntityInfoCard title="Program Details" :fields="programSummaryFields" />
          <RelationshipsCard title="Family Context" :items="familyItems" />
          <TimestampCard :createdAt="enrollment.createdAt" :updatedAt="enrollment.updatedAt" />
        </div>
      </template>
    </DetailPageLayout>

    <EnrollmentFormModal
      :isOpen="showFormModal"
      :loading="submitting"
      :parents="parents"
      :students="students"
      :programs="programs"
      :classes="classes"
      :enrollments="enrollments"
      :enrollment="enrollment"
      :error="modalError"
      :success="modalSuccess"
      @close="
        showFormModal = false;
        modalError = '';
        modalSuccess = '';
      "
      @program-change="handleProgramChange"
      @submit="handleEditSubmit"
    />

    <EnrollmentActionModal
      v-bind="actionModal"
      :loading="submitting"
      v-model:error="modalError"
      v-model:success="modalSuccess"
      @close="closeActionModal"
      @submit="handleActionSubmit"
    />
  </DashboardLayout>
</template>

<style scoped>
.ui-detail-card {
  @apply bg-white border border-outline-std shadow-sm p-8 rounded-xl flex flex-col gap-6;
}

.ui-detail-card-title {
  @apply text-lg font-semibold text-content-dark tracking-tight text-center;
}
</style>

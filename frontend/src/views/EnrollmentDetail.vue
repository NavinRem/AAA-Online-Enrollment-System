<script setup>
import { ref, onMounted, computed } from 'vue'
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
import EntityInfoCard from '@/components/common/detail/EntityInfoCard.vue'
import TimestampCard from '@/components/common/detail/TimestampCard.vue'

import { getActionIcon } from '@/utils/assetHelper'
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
const loading = ref(true)
const formLoading = ref(false)
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

const enrollmentProfileFields = computed(() => [
  { label: 'ID', value: enrollment.value?.id?.slice(-8).toUpperCase() },
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
  {
    label: 'Enrolled',
    value: formatDate(enrollment.value?.enrollAt || enrollment.value?.createdAt),
  },
])

const paymentSummaryFields = computed(() => [
  {
    label: 'Tuition',
    value: '$' + formatPrice(enrollment.value?.finalPrice || enrollment.value?.totalPrice || 0),
  },
  { label: 'Settled', value: '$' + formatPrice(enrollment.value?.paidAmount || 0) },
  {
    label: 'Balance',
    value: (enrollment.value?.paymentStatus || 'Unpaid').toUpperCase(),
    isBadge: true,
  },
])

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
    enrollments.value =
      enrollmentsRes?.data || (Array.isArray(enrollmentsRes) ? enrollmentsRes : [])
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
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-lg pb-10 animate-fade-in">
          <!-- 1. Guardian Information -->
          <section class="ui-detail-card">
            <h3 class="ui-detail-card-title">Guardian Profile</h3>
            <div class="flex justify-center mb-6">
              <div class="w-20 h-20 rounded-full overflow-hidden border-4 border-white shadow-md">
                <img
                  :src="getAvatarUrl(enrollment.parent?.profileURL)"
                  class="w-full h-full object-cover"
                />
              </div>
            </div>
            <div class="bg-primary-soft/30 rounded-xl p-6 flex flex-col gap-3">
              <div class="flex items-center justify-between border-b border-outline-std/50 pb-2">
                <span class="text-xs font-semibold text-content-muted">Full Name</span>
                <span class="text-sm font-bold text-content-dark">{{
                  enrollment.parent?.name || 'N/A'
                }}</span>
              </div>
              <div class="flex items-center justify-between border-b border-outline-std/50 pb-2">
                <span class="text-xs font-semibold text-content-muted">Email</span>
                <span class="text-sm font-bold text-content-dark">{{
                  enrollment.parent?.email || 'N/A'
                }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-xs font-semibold text-content-muted">Phone</span>
                <span class="text-sm font-bold text-content-dark tabular-nums">{{
                  enrollment.parent?.phone || 'N/A'
                }}</span>
              </div>
            </div>
          </section>

          <!-- 2. Student Information -->
          <section class="ui-detail-card">
            <h3 class="ui-detail-card-title">Student Profile</h3>
            <div class="flex justify-center mb-6">
              <div class="w-20 h-20 rounded-full overflow-hidden border-4 border-white shadow-md">
                <img
                  :src="getAvatarUrl(enrollment.student?.profileURL)"
                  class="w-full h-full object-cover"
                />
              </div>
            </div>
            <div class="bg-primary-soft/30 rounded-xl p-6 flex flex-col gap-3">
              <div class="flex items-center justify-between border-b border-outline-std/50 pb-2">
                <span class="text-xs font-semibold text-content-muted">Full Name</span>
                <span class="text-sm font-bold text-content-dark">{{
                  enrollment.student?.name || 'N/A'
                }}</span>
              </div>
              <div class="flex items-center justify-between border-b border-outline-std/50 pb-2">
                <span class="text-xs font-semibold text-content-muted">Birth Date</span>
                <span class="text-sm font-bold text-content-dark tabular-nums">{{
                  formatDateOnly(enrollment.student?.dob)
                }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-xs font-semibold text-content-muted">Current Age</span>
                <span class="text-sm font-bold text-content-dark tabular-nums"
                  >{{ calculateAge(enrollment.student?.dob) }} yrs</span
                >
              </div>
            </div>
          </section>

          <!-- 3. Program Information -->
          <section class="ui-detail-card">
            <h3 class="ui-detail-card-title">Program Selection</h3>
            <div class="flex justify-center mb-6">
              <div class="w-20 h-20 rounded-full overflow-hidden border-4 border-white shadow-md">
                <img
                  :src="enrollment.class?.program?.profileURL || enrollment.program?.profileURL"
                  class="w-full h-full object-cover bg-white"
                />
              </div>
            </div>
            <div class="bg-primary-soft/30 rounded-xl p-6 flex flex-col gap-3">
              <div class="flex items-center justify-between border-b border-outline-std/50 pb-2">
                <span class="text-xs font-semibold text-content-muted">Course</span>
                <span class="text-sm font-bold text-content-dark">{{
                  enrollment.class?.program?.name || enrollment.program?.name
                }}</span>
              </div>
              <div class="flex items-center justify-between border-b border-outline-std/50 pb-2">
                <span class="text-xs font-semibold text-content-muted">Category</span>
                <span class="text-sm font-bold text-content-dark">{{
                  typeof (enrollment.class?.program?.category || enrollment.program?.category) ===
                  'object'
                    ? enrollment.class?.program?.category?.name ||
                      enrollment.program?.category?.name ||
                      'N/A'
                    : enrollment.class?.program?.category || enrollment.program?.category || 'N/A'
                }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-xs font-semibold text-content-muted">Type</span>
                <span class="text-sm font-bold text-content-dark capitalize">{{
                  enrollment.class?.program?.type || enrollment.program?.type || 'N/A'
                }}</span>
              </div>
            </div>
          </section>

          <!-- 4. Class & Teacher Information -->
          <section class="ui-detail-card">
            <h3 class="ui-detail-card-title">Academic Assignment</h3>
            <div class="flex justify-center mb-6">
              <div class="w-20 h-20 rounded-full overflow-hidden border-4 border-white shadow-md">
                <img
                  :src="
                    getAvatarUrl(
                      enrollment.class?.teachers?.[0]?.profileURL ||
                        enrollment.class?.teacher?.profileURL ||
                        enrollment.teacher?.profileURL,
                    )
                  "
                  class="w-full h-full object-cover bg-white"
                />
              </div>
            </div>
            <div class="bg-primary-soft/30 rounded-xl p-6 flex flex-col gap-3">
              <div class="flex items-center justify-between border-b border-outline-std/50 pb-2">
                <span class="text-xs font-semibold text-content-muted">Faculty</span>
                <span class="text-sm font-bold text-content-dark">
                  {{
                    enrollment.class?.teachers?.length > 1
                      ? enrollment.class?.teachers?.map((t) => t.name).join(', ')
                      : enrollment.class?.teacher?.name ||
                        enrollment.class?.teachers?.[0]?.name ||
                        enrollment.teacher?.name ||
                        'N/A'
                  }}
                </span>
              </div>
              <div class="flex items-center justify-between border-b border-outline-std/50 pb-2">
                <span class="text-xs font-semibold text-content-muted">Schedule</span>
                <span class="text-sm font-bold text-content-dark tabular-nums">
                  {{ getSessionDay(enrollment.class?.schedule || enrollment.classSchedule) }},
                  {{ getSessionTime(enrollment.class?.schedule || enrollment.classSchedule) }}
                </span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-xs font-semibold text-content-muted">Branch</span>
                <span class="text-sm font-bold text-content-dark capitalize">{{
                  enrollment.class?.branch?.name || enrollment.branch?.name || 'N/A'
                }}</span>
              </div>
            </div>
          </section>
        </div>
      </template>

      <template #right-content v-if="enrollment">
        <div class="flex flex-col gap-8">
          <EntityInfoCard title="Enrollment Context" :fields="enrollmentProfileFields" />
          <EntityInfoCard title="Financial Summary" :fields="paymentSummaryFields" />
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
        showFormModal = false
        modalError = ''
        modalSuccess = ''
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

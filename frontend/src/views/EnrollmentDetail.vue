<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import DetailPageLayout from '@/components/layout/DetailPageLayout.vue'
import AppBadge from '@/components/common/ui/AppBadge.vue'
import DetailCard from '../components/common/cards/DetailCard.vue'
import DetailedSummaryCard from '../components/common/cards/DetailedSummaryCard.vue'
import EnrollmentActionModal from '@/components/enrollments/EnrollmentActionModal.vue'
import EnrollmentFormModal from '@/components/enrollments/EnrollmentFormModal.vue'
import AppButton from '@/components/common/ui/AppButton.vue'
import { enrollmentService } from '@/services/enrollmentService'
import { parentService } from '@/services/parentService'
import { studentService } from '@/services/studentService'
import { programService } from '@/services/programService'
import { formatDate, formatDateOnly, formatPrice, calculateAge } from '@/utils/formatUtils'
import { getSessionDay, getSessionTime } from '@/utils/sessionHelper'

import {
  getProgramProfileURL,
  getParentProfileURL,
  getStudentProfileURL,
  getTeacherProfileURL,
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
const validationHint = ref('')

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
      const { bankName, paymentMethod: methodType, proof, proofURL, remark } = payload

      const updateData = {
        paymentStatus: 'paid',
        status: 'confirmed',
        paymentMethod: methodType === 'cash' ? 'Cash' : bankName || 'Online',
        transactionId: proof,
        paymentProofURL: proofURL || '',
        paidAt: new Date().toISOString(),
        remark: remark?.trim() || '',
      }

      await enrollmentService.updateEnrollment(enrollment.value.id, updateData)

      enrollment.value = { ...enrollment.value, ...updateData }
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
    <DetailPageLayout :loading="loading" :errorMessage="errorMessage" backRoute="/enrollments" sidebarWidth="sm">
      <template #header-actions v-if="enrollment">
        <div class="flex items-center gap-3">
          <button
            v-if="enrollment.status !== 'confirmed' && enrollment.paymentStatus !== 'paid' && enrollment.status !== 'cancelled'"
            class="w-11 h-11 flex items-center justify-center rounded-full border transition-all duration-300 bg-primary-light hover:bg-primary hover:border-primary group"
            title="Edit Enrollment" @click="openActionModal('edit')">
            <img :src="getActionIcon('edit')" class="w-5 h-5 group-hover:opacity-100" />
          </button>
          <button
            v-if="enrollment.status !== 'confirmed' && enrollment.paymentStatus !== 'paid' && enrollment.status !== 'cancelled'"
            class="w-11 h-11 flex items-center justify-center rounded-full border transition-all duration-300 bg-primary-light hover:bg-success hover:border-success group"
            title="Pay Enrollment" @click="openActionModal('pay')">
            <img :src="getActionIcon('pay')" class="w-5 h-5 group-hover:opacity-100" />
          </button>
          <button v-if="enrollment.status !== 'cancelled'"
            class="w-11 h-11 flex items-center justify-center rounded-full border transition-all duration-300 bg-primary-light hover:bg-warning hover:border-warning group"
            title="Cancel Enrollment" @click="openActionModal('cancel')">
            <img :src="getActionIcon('cancel')" class="w-5 h-5 group-hover:opacity-100" />
          </button>
          <div class="w-px h-6 bg-outline-std mx-1"></div>
          <button
            class="w-11 h-11 flex items-center justify-center rounded-full border bg-error-soft transition-all duration-300 hover:bg-error hover:border-error group"
            title="Delete Enrollment" @click="openActionModal('delete')">
            <img :src="getActionIcon('delete')" class="w-5 h-5 icon-danger group-hover:opacity-100" />
          </button>
        </div>
      </template>

      <template #left-content v-if="enrollment">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-lg pb-10">
          <section class="ui-detail-card">
            <h3 class="ui-detail-card-title">Parent Information</h3>
            <div class="flex justify-center">
              <div class="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-md">
                <img :src="getAvatarUrl(enrollment.parent?.profileURL)" class="w-full h-full object-cover" />
              </div>
            </div>
            <div class="bg-primary-soft/30 rounded-xl p-6 flex flex-col gap-3">
              <p class="text-sm"><strong class="font-bold text-content-dark">Fullname:</strong> <span
                  class="font-bold text-content-muted">{{ enrollment.parent?.name || 'N/A' }}</span></p>
              <p class="text-sm"><strong class="font-bold text-content-dark">Email:</strong> <span
                  class="font-bold text-content-muted">{{ enrollment.parent?.email || 'N/A' }}</span></p>
              <p class="text-sm"><strong class="font-bold text-content-dark">Phone Number:</strong> <span
                  class="font-bold text-content-muted tabular-nums">{{ enrollment.parent?.phone || 'N/A' }}</span></p>
              <p class="text-sm flex items-center gap-2"><strong class="font-bold text-content-dark">Role:</strong> <AppBadge status="Parent" /></p>
            </div>
          </section>

          <section class="ui-detail-card">
            <h3 class="ui-detail-card-title">Student Information</h3>
            <div class="flex justify-center">
              <div class="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-md">
                <img :src="getAvatarUrl(enrollment.student?.profileURL)" class="w-full h-full object-cover" />
              </div>
            </div>
            <div class="bg-primary-soft/30 rounded-xl p-6 flex flex-col gap-3">
              <p class="text-sm"><strong class="font-bold text-content-dark">Fullname:</strong> <span
                  class="font-bold text-content-muted">{{ enrollment.student?.name || 'N/A' }}</span></p>
              <p class="text-sm"><strong class="font-bold text-content-dark">Date of birth:</strong> <span
                  class="font-bold text-content-muted">{{ formatDateOnly(enrollment.student?.dob) }}</span></p>
              <p class="text-sm"><strong class="font-bold text-content-dark">Age:</strong> <span
                  class="font-bold text-content-muted">{{ calculateAge(enrollment.student?.dob) }}</span></p>
              <p class="text-sm"><strong class="font-bold text-content-dark">Medical Note:</strong> <span
                  class="font-bold text-content-muted">{{ enrollment.student?.medicalNote || 'None' }}</span></p>
            </div>
          </section>

          <section class="ui-detail-card">
            <h3 class="ui-detail-card-title">Enrollment Information</h3>
            <div class="flex justify-center">
              <div class="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-md">
                <img :src="enrollment.class?.program?.profileURL" class="w-full h-full object-cover bg-white" />
              </div>
            </div>
            <div class="bg-primary-soft/30 rounded-xl p-6 flex flex-col gap-3">
              <p class="text-sm"><strong class="font-bold text-content-dark">Course title:</strong> <span
                  class="font-bold text-content-muted">{{ enrollment.class?.program?.name || enrollment.program?.name
                  }}</span></p>
              <p class="text-sm"><strong class="font-bold text-content-dark">Session:</strong> <span
                  class="font-bold text-content-muted">{{ getSessionDay(enrollment.class?.schedule ||
                    enrollment.classSchedule) }}, {{ getSessionTime(enrollment.class?.schedule ||
                    enrollment.classSchedule) }}</span></p>
              <p class="text-sm"><strong class="font-bold text-content-dark">Number Session Enrolled:</strong> <span
                  class="font-bold text-content-muted">{{ enrollment.remainingSessions !== undefined ?
                    enrollment.remainingSessions : (enrollment.totalSessions || enrollment.class?.program?.totalSessions
                      || enrollment.program?.totalSessions || '10') }}</span></p>
              <p class="text-sm"><strong class="font-bold text-content-dark">Date:</strong> <span
                  class="font-bold text-content-muted tabular-nums">{{ formatDate(enrollment.enrollAt ||
                    enrollment.createdAt) }}</span></p>
            </div>
          </section>

          <section class="ui-detail-card">
            <h3 class="ui-detail-card-title">Session Information</h3>
            <div class="flex justify-center">
              <div class="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-md">
                <img
                  :src="getAvatarUrl(enrollment.class?.teacher?.profileURL || enrollment.class?.teachers?.[0]?.profileURL || enrollment.program?.teachers?.[0]?.profileURL)"
                  class="w-full h-full object-cover bg-white" />
              </div>
            </div>
            <div class="bg-primary-soft/30 rounded-xl p-6 flex flex-col gap-3">
              <p class="text-sm"><strong class="font-bold text-content-dark">Course:</strong> <span
                  class="font-bold text-content-muted">{{ enrollment.class?.program?.name || enrollment.program?.name ||
                    'N/A' }}</span></p>
              <p class="text-sm"><strong class="font-bold text-content-dark">Teacher Name:</strong> <span
                  class="font-bold text-content-muted">{{ enrollment.teacher?.name ||
                    (enrollment.class?.teachers?.map(t => t.name).join(', ') || enrollment.program?.teachers?.[0]?.name || 'N/A')
                  }}</span></p>
              <p class="text-sm"><strong class="font-bold text-content-dark">Total Student:</strong> <span
                  class="font-bold text-content-muted">{{ enrollment.studentCountAtEnrollment ??
                    enrollment.class?.currentCount ?? 0 }}</span></p>
              <p class="text-sm"><strong class="font-bold text-content-dark">Time Slot:</strong> <span
                  class="font-bold text-content-muted">{{ getSessionDay(enrollment.class?.schedule ||
                    enrollment.classSchedule) }}, {{ getSessionTime(enrollment.class?.schedule ||
                    enrollment.classSchedule) }}</span></p>
            </div>
          </section>
        </div>
      </template>

      <template #right-content v-if="enrollment">
        <div class="flex flex-col gap-8">
          <section class="ui-detail-card bg-primary-soft/30 border-primary/10">
            <h6 class="font-bold uppercase tracking-widest text-content-muted">Basic Information</h6>
            <div class="space-y-5 mt-2">
              <div class="flex justify-between gap-1">
                <span class="text-lg font-bold text-content-dark">Registration Status</span>
                <div>
                  <AppBadge
                    :status="enrollment.status === 'cancelled' ? 'Canceled' : enrollment.paymentStatus?.toLowerCase() === 'paid' ? 'Paid' : 'Unpaid'" />
                </div>
              </div>
              <div class="flex flex-col gap-1">
                <span class="text-lg font-bold text-content-dark">Registration ID</span>
                <span class="text-md font-bold text-content-muted break-all">{{ enrollment.id }}</span>
              </div>
              <div class="flex flex-col gap-1">
                <span class="text-lg font-bold text-content-dark">Registration Date</span>
                <span class="text-md font-bold text-content-muted">{{ formatDate(enrollment.enrollAt ||
                  enrollment.createdAt) }}</span>
              </div>
            </div>
          </section>

          <section class="ui-detail-card bg-primary-soft/30 border-primary/10">
            <h6 class="font-bold uppercase tracking-widest text-content-muted">Payment Summary</h6>
            <div class="space-y-5 mt-2">
              <div class="flex justify-between gap-1">
                <span class="text-lg font-bold text-content-dark">Total Amount</span>
                <div>
                  <AppBadge :status="'$' + formatPrice(enrollment?.amount || 0)" :colorValue="enrollment?.isProrated ? 'partial' : 'full'" type="finance"
                    class="text-md px-2 py-0.5" />
                </div>
              </div>
              <div class="flex flex-col gap-1">
                <span class="text-lg font-bold text-content-dark">Transaction ID</span>
                <span class="text-md font-bold text-content-muted break-all">{{ enrollment.transactionId || 'N/A'
                  }}</span>
              </div>
              <div class="flex flex-col gap-1">
                <span class="text-lg font-bold text-content-dark">Payment Date</span>
                <span class="text-md font-bold text-content-muted">{{ enrollment.paidAt ? formatDate(enrollment.paidAt)
                  : 'N/A' }}</span>
              </div>
            </div>
          </section>

          <section class="ui-detail-card bg-primary-soft/30 border-primary/10">
            <h6 class="font-bold uppercase tracking-widest text-content-muted">Program Summary</h6>
            <div class="space-y-5 mt-2">
              <div class="flex flex-col gap-1">
                <span class="text-lg font-bold text-content-dark">Course</span>
                <span class="text-md font-bold text-content-muted">{{ enrollment.class?.program?.name ||
                  enrollment.program?.name }}</span>
              </div>
              <div class="flex flex-col gap-1">
                <span class="text-lg font-bold text-content-dark">Schedule</span>
                <span class="text-md font-bold text-content-muted">{{ getSessionDay(enrollment.class?.schedule ||
                  enrollment.classSchedule) }}, {{ getSessionTime(enrollment.class?.schedule ||
                    enrollment.classSchedule) }}</span>
              </div>
              <div class="flex flex-col gap-1">
                <AppBadge type="green" class="w-fit text-sm px-2 py-0.5">Start Date</AppBadge>
                <span class="text-md font-bold text-content-muted">{{ formatDate(enrollment.class?.startDate ||
                  enrollment.enrollAt) }}</span>
              </div>
              <div class="flex flex-col gap-1">
                <AppBadge type="red" class="w-fit text-sm px-2 py-0.5">End Date</AppBadge>
                <span class="text-md font-bold text-content-muted">{{ formatDate(enrollment.class?.endDate || new
                  Date(new Date(enrollment.enrollAt).setMonth(new Date(enrollment.enrollAt).getMonth() +
                    1)).toISOString()) }}</span>
              </div>
            </div>
          </section>
        </div>
      </template>
    </DetailPageLayout>

    <EnrollmentFormModal :isOpen="showFormModal" :loading="submitting" :parents="parents" :students="students"
      :programs="programs" :classes="classes" :enrollments="enrollments" :enrollment="enrollment" :error="modalError"
      :success="modalSuccess" :hint="validationHint" @close="
        () => {
          showFormModal = false
          modalError = ''
          modalSuccess = ''
          validationHint = ''
        }
      " @program-change="handleProgramChange" @submit="handleEditSubmit" />

    <EnrollmentActionModal v-bind="actionModal" :loading="submitting" v-model:error="modalError"
      v-model:success="modalSuccess" @close="closeActionModal" @submit="handleActionSubmit" />
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

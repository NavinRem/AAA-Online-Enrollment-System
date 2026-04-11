<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import DetailPageLayout from '@/components/layout/DetailPageLayout.vue'
import StatusBadge from '@/components/common/ui/StatusBadge.vue'
import DetailCard from '../components/common/cards/DetailCard.vue'
import DetailedSummaryCard from '../components/common/cards/DetailedSummaryCard.vue'
import EnrollmentActionModal from '@/components/enrollments/EnrollmentActionModal.vue'
import EnrollmentFormModal from '@/components/enrollments/EnrollmentFormModal.vue'
import AppButton from '@/components/common/ui/AppButton.vue'
import { enrollmentService } from '@/services/enrollmentService'
import { userService } from '@/services/userService'
import { programService } from '@/services/programService'
import { formatDate, formatDateOnly, formatPrice, calculateAge } from '@/utils/formatUtils'
import { getSessionDay, getSessionTime } from '@/utils/sessionHelper'
import { isPaid, isCancelled } from '@/utils/statusUtils'

import {
  getProgramProfileURL,
  getParentProfileURL,
  getStudentProfileURL,
  getTeacherProfileURL,
  getActionIcon,
} from '@/utils/assetHelper'

const route = useRoute()
const router = useRouter()

const enrollment = ref(null)
const parent = ref(null)
const student = ref(null)
const program = ref(null)
const classSlot = ref(null)
const teacher = ref(null)

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
    const [usersRes, programsRes, studentsRes, enrollmentsRes] = await Promise.all([
      userService.getAllUsers(),
      programService.getAllPrograms(),
      userService.getAllStudents(),
      enrollmentService.getAllEnrollments(),
    ])
    parents.value = Array.isArray(usersRes)
      ? usersRes.filter(
          (u) => u.role === 'parent' && (u.status || 'Active').toLowerCase() === 'active',
        )
      : []
    programs.value = Array.isArray(programsRes) ? programsRes : []
    students.value = Array.isArray(studentsRes) ? studentsRes : []
    enrollments.value = Array.isArray(enrollmentsRes) ? enrollmentsRes : []
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
    const pRecord = parents.value.find((p) => (p.uid || p.id) === formData.parentId)
    const sRecord = students.value.find((s) => s.id === formData.studentId)
    const progRecord = programs.value.find((c) => c.id === formData.programId)
    const classRecord = classes.value.find((c) => c.id === formData.classId)

    const payload = {
      parentId: pRecord.uid || pRecord.id,
      studentId: sRecord.id,
      programId: progRecord.id,
      classId: classRecord.id,

      parent: {
        id: pRecord.uid || pRecord.id,
        name: pRecord.name || pRecord.email || 'Parent',
        profile: pRecord.profile || null,
      },
      student: {
        id: sRecord.id,
        name: sRecord.fullname || sRecord.fullName || sRecord.name || 'Student',
        profile: sRecord.profile || sRecord.profileURL || sRecord.childProfileURL || null,
      },
      program: {
        id: progRecord.id,
        title: progRecord.title || progRecord.name || 'Program',
        profile: progRecord.profile || null,
      },
      class: {
        id: classRecord.id,
        schedule: classRecord.day + ' ' + classRecord.timeslot,
      },
      classSchedule: classRecord.day + ' ' + classRecord.timeslot,

      amount: formData.amount,
      discountAmount: formData.discountAmount || 0,
      isSponsorship: formData.isSponsorship || false,
      sponsorName: formData.sponsorName || '',
      isProrated: formData.isProrated,
      enrollmentType: formData.enrollmentType || 'Full',
      remark: formData.remark || '',
      basePrice: formData.basePrice || 0,
      passedSessions: formData.passedSessions || 0,
      prorateSavings: formData.prorateSavings || 0,
      studentCountAtEnrollment: classRecord.numStudent || 0,
      updatedAt: new Date().toISOString(),
    }

    await enrollmentService.updateEnrollment(enrollment.value.id, payload)
    modalSuccess.value = 'Enrollment updated successfully!'

    const updated = await enrollmentService.getEnrollment(enrollment.value.id)
    enrollment.value = updated
    parent.value = updated.parent
    student.value = updated.student
    program.value = updated.program
    classSlot.value = updated.class
    teacher.value = updated.teacher

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
    parent.value = data.parent
    student.value = data.student
    program.value = data.program
    classSlot.value = data.class
    teacher.value = data.teacher
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
      title="Enrollment Details"
    >
      <template #header-actions v-if="enrollment">
        <div class="flex items-center gap-md">
          <AppButton
            v-if="
              !isPaid(enrollment.status) &&
              !isPaid(enrollment.paymentStatus) &&
              !isCancelled(enrollment.status)
            "
            variant="secondary"
            title="Edit Enrollment"
            @click="openActionModal('edit')"
          >
            <img :src="getActionIcon('edit')" class="w-4 h-4" /> Edit
          </AppButton>
          <AppButton
            v-if="
              !isPaid(enrollment.status) &&
              !isPaid(enrollment.paymentStatus) &&
              !isCancelled(enrollment.status)
            "
            variant="primary"
            title="Pay Enrollment"
            @click="openActionModal('pay')"
          >
            <img :src="getActionIcon('pay')" class="w-4 h-4 brightness-0 invert" /> Pay Now
          </AppButton>
          <AppButton
            v-if="!isCancelled(enrollment.status)"
            variant="danger"
            title="Cancel Enrollment"
            @click="openActionModal('cancel')"
          >
            <img :src="getActionIcon('cancel')" class="w-4 h-4 invert" /> Cancel
          </AppButton>
          <AppButton variant="danger" title="Delete Enrollment" @click="openActionModal('delete')">
            <img :src="getActionIcon('delete')" class="w-4 h-4 invert" /> Delete
          </AppButton>
        </div>
      </template>

      <template #left-content v-if="enrollment">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-lg pb-10">
          <DetailCard
            title="Parent Profile"
            :avatarUrl="getParentProfileURL(enrollment.parent?.profileURL)"
          >
            <p><strong>Full Name</strong> {{ enrollment.parent?.name || 'N/A' }}</p>
            <p><strong>Primary Email</strong> {{ enrollment.parent?.email || 'N/A' }}</p>
            <p><strong>Contact Number</strong> {{ enrollment.parent?.phone || 'N/A' }}</p>
          </DetailCard>

          <DetailCard
            title="Student Profile"
            :avatarUrl="getStudentProfileURL(enrollment.student?.profileURL)"
          >
            <p><strong>Full Name</strong> {{ enrollment.student?.name || 'N/A' }}</p>
            <p><strong>Birth Date</strong> {{ formatDateOnly(enrollment.student?.dob) }}</p>
            <p>
              <strong>Current Age</strong>
              <StatusBadge :status="'Age: ' + calculateAge(enrollment.student?.dob)" type="blue" />
            </p>
          </DetailCard>

          <DetailCard
            title="Program Details"
            :avatarUrl="
              getProgramProfileURL(enrollment.program?.profileURL, enrollment.program?.category)
            "
          >
            <p><strong>Program</strong> {{ enrollment.program?.title }}</p>
            <div class="flex flex-col gap-1 mb-md">
              <strong class="text-3xs uppercase font-black tracking-widest text-content-light"
                >Schedule</strong
              >
              <div class="flex items-center gap-2">
                <StatusBadge :status="'purple:' + getSessionDay(enrollment.classSchedule)" />
                <span class="text-xs font-bold text-content-muted">{{
                  getSessionTime(enrollment.classSchedule)
                }}</span>
              </div>
            </div>
            <div class="flex flex-col gap-1 mb-md">
              <strong class="text-3xs uppercase font-black tracking-widest text-content-light"
                >Intensity</strong
              >
              <template v-if="enrollment.remainingSessions !== undefined">
                <span class="text-sm font-bold text-content-dark">
                  {{ enrollment.remainingSessions }} Sessions (Prorated)
                  <StatusBadge
                    v-if="enrollment.totalSessions > 0"
                    :status="'of ' + enrollment.totalSessions"
                    type="blue"
                  />
                </span>
              </template>
              <template v-else>
                <span class="text-sm font-bold text-content-dark">
                  {{
                    enrollment.numberSessions || enrollment.program?.numberSessions || '10'
                  }}
                  Sessions
                </span>
              </template>
            </div>
            <p>
              <strong>Registry Date</strong>
              {{ formatDate(enrollment.enrollAt || enrollment.createdAt) }}
            </p>
          </DetailCard>

          <DetailCard
            title="Class Environment"
            :avatarUrl="getTeacherProfileURL(enrollment.teacher?.profileURL)"
          >
            <p><strong>Curriculum</strong> {{ enrollment.program?.title || 'N/A' }}</p>
            <div class="flex flex-col gap-1 mb-md">
              <strong class="text-3xs uppercase font-black tracking-widest text-content-light"
                >Assigned Staff</strong
              >
              <div
                v-if="enrollment.program?.teachers?.length > 0"
                class="flex -space-x-2 overflow-hidden ring-1 ring-white rounded-full p-0.5 mt-1"
              >
                <img
                  v-for="t in enrollment.program.teachers"
                  :key="t.id"
                  :src="getTeacherProfileURL(t.profileURL)"
                  class="inline-block h-6 w-6 rounded-full ring-2 ring-white object-cover"
                  :title="t.name"
                />
              </div>
              <span v-else class="text-content-muted/40 italic text-xs">Not Assigned</span>
            </div>
            <p>
              <strong>Current Enrollment</strong>
              <span class="font-black text-content-dark"
                >{{
                  enrollment.studentCountAtEnrollment ?? enrollment.class?.numStudent ?? 0
                }}
                Students</span
              >
            </p>
            <p>
              <strong>Max Capacity</strong>
              <span class="font-bold text-content-muted"
                >{{ enrollment.class?.capacity || enrollment.class?.maxCapacity || 20 }} Slots</span
              >
            </p>
          </DetailCard>
        </div>
      </template>

      <template #right-content v-if="enrollment">
        <DetailedSummaryCard title="Transaction Summary" subtitle="Enrollment Status">
          <div class="detail-row align-center">
            <span class="summary-label">Registry Status</span>
            <StatusBadge
              :status="
                enrollment.status === 'cancelled'
                  ? 'Canceled'
                  : enrollment.paymentStatus?.toLowerCase() === 'paid'
                    ? 'Paid'
                    : 'Unpaid'
              "
            />
          </div>

          <div class="detail-row align-center">
            <span class="summary-label">Admission Mode</span>
            <StatusBadge :status="enrollment.enrollmentType" />
          </div>

          <div
            v-if="
              enrollment.status === 'cancelled' && (enrollment.cancelReason || enrollment.reason)
            "
            class="detail-row"
          >
            <span class="summary-label text-error">Termination Reason</span>
            <span
              class="summary-value opacity-100 font-bold text-error bg-error/5 p-2 rounded-sm border border-error/10 w-full text-xs"
            >
              {{ enrollment.cancelReason || enrollment.reason }}
            </span>
          </div>

          <div class="detail-row">
            <span class="summary-label">Internal Remark</span>
            <span class="summary-value italic text-xs">{{
              enrollment.remark || 'No administrative notes'
            }}</span>
          </div>
        </DetailedSummaryCard>

        <DetailedSummaryCard subtitle="Financial Ledger" class="mt-lg">
          <div class="detail-row align-center">
            <span class="summary-label">Course Price</span>
            <span class="font-black text-content-dark text-lg tracking-tighter"
              >${{ formatPrice(enrollment?.basePrice || enrollment?.amount || 0) }}</span
            >
          </div>

          <div v-if="enrollment?.prorateSavings" class="detail-row align-center">
            <span class="summary-label text-magenta">Prorate Discount</span>
            <span class="font-bold text-magenta"
              >- ${{ formatPrice(enrollment.prorateSavings) }}</span
            >
          </div>

          <div v-if="enrollment?.discountAmount" class="detail-row align-center">
            <span class="summary-label text-magenta">Manual Adjust</span>
            <span class="font-bold text-magenta"
              >- ${{ formatPrice(enrollment.discountAmount) }}</span
            >
          </div>

          <div class="w-full h-px bg-surface-light my-2"></div>

          <div class="detail-row align-center">
            <span class="summary-label">Total Payable</span>
            <span class="font-black text-primary text-xl tracking-tighter"
              >${{ formatPrice(enrollment?.amount || 0) }}</span
            >
          </div>

          <div class="detail-row align-center">
            <span class="summary-label">Payment Status</span>
            <StatusBadge
              :status="
                enrollment?.displayStatus ||
                enrollment?.status ||
                enrollment?.paymentStatus ||
                'Unpaid'
              "
            />
          </div>

          <div class="detail-row align-center">
            <span class="summary-label">Channel</span>
            <StatusBadge
              :status="
                enrollment?.paymentMethod ||
                (isPaid(enrollment?.status || enrollment?.paymentStatus) ? 'Paid' : '—')
              "
            />
          </div>

          <div v-if="enrollment?.transactionId" class="detail-row">
            <span class="summary-label">{{
              enrollment?.paymentMethod === 'Cash' ? 'Receipt No' : 'Transaction ID'
            }}</span>
            <span
              class="summary-value font-mono text-[11px] bg-surface-light p-1 px-2 rounded-sm select-all tracking-wider text-content-dark"
            >
              {{ enrollment.transactionId }}
            </span>
          </div>

          <div v-if="enrollment?.paidAt" class="detail-row">
            <span class="summary-label">Value Date</span>
            <span class="summary-value text-xs font-bold">{{ formatDate(enrollment.paidAt) }}</span>
          </div>

          <div v-if="enrollment?.paymentProofURL" class="detail-row mt-2">
            <span class="summary-label">Attachment Proof</span>
            <a
              :href="enrollment.paymentProofURL"
              target="_blank"
              class="group relative block w-full aspect-video rounded-sm overflow-hidden border border-outline-std shadow-sm hover:shadow-md transition-shadow"
            >
              <img
                :src="enrollment.paymentProofURL"
                alt="Payment Proof"
                class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div
                class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
              >
                <span class="text-white text-3xs font-black uppercase tracking-widest"
                  >Open Full Size</span
                >
              </div>
            </a>
          </div>

          <div
            v-if="enrollment?.isSponsorship"
            class="mt-4 p-3 bg-primary-soft/20 rounded-sm border border-primary/10"
          >
            <span class="text-3xs font-black uppercase text-primary tracking-widest block mb-1"
              >Corporate Sponsorship</span
            >
            <span class="text-xs font-bold text-content-dark">{{
              enrollment?.sponsorName || 'Third-party Entity'
            }}</span>
          </div>
        </DetailedSummaryCard>
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
      :hint="validationHint"
      @close="
        () => {
          showFormModal = false
          modalError = ''
          modalSuccess = ''
          validationHint = ''
        }
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
/* Scoped styles entirely removed in favor of centralized UI pattern classes in main.css and Tailwind utilities. */
</style>

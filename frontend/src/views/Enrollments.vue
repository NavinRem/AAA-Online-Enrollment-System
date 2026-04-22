<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import DashboardLayout from '../components/layout/DashboardLayout.vue'
import DataPageLayout from '../components/layout/DataPageLayout.vue'
import AppButton from '../components/common/ui/AppButton.vue'
import DataMetricCard from '../components/common/data/DataMetricCard.vue'
import DataTable from '../components/common/data/DataTable.vue'
import AppBadge from '../components/common/ui/AppBadge.vue'
import EnrollmentFormModal from '../components/enrollments/EnrollmentFormModal.vue'
import EnrollmentActionModal from '../components/enrollments/EnrollmentActionModal.vue'
import ParentActionModal from '../components/parents/ParentActionModal.vue'

import { enrollmentService } from '@/services/enrollmentService'
import { parentService } from '../services/parentService'
import { studentService } from '../services/studentService'
import { programService } from '../services/programService'
import { classService } from '../services/classService'
import { storageService } from '@/services/storageService'

import { useSearch, enrollmentSearchMapper } from '../composables/useSearch'
import { calculateTotalEnrollment, enrichEnrollments } from '../utils/enrollmentHelper'
import { getSessionDay, getSessionTime } from '@/utils/sessionHelper'
import { getImageUrl, getActionIcon } from '@/utils/assetHelper'
import { formatPrice, formatDate } from '@/utils/formatUtils'

const enrollments = ref([])
const parents = ref([])
const students = ref([])
const programs = ref([])
const classes = ref([])

const loading = ref(true)
const showModal = ref(false)
const submitting = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const validationHint = ref('')
const newlyCreatedId = ref(null)
const selectedEnrollment = ref(null)
const enrollmentForm = ref(null)

const childRegistrationModal = ref({
  isOpen: false,
  parent: null,
  loading: false,
  error: '',
  success: '',
})

const getRowClass = (item) => {
  return newlyCreatedId.value === item.id ? 'ui-row-new' : ''
}

onMounted(async () => {
  try {
    loading.value = true
    await Promise.all([fetchEnrollments(), loadFormData()])
  } catch (error) {
    console.error('Initial data load failed', error)
  } finally {
    loading.value = false
  }
})

const fetchEnrollments = async () => {
  try {
    const data = await enrollmentService.getAllEnrollments()
    enrollments.value = Array.isArray(data) ? data : []
  } catch (error) {
    console.error('Failed to fetch enrollments', error)
  }
}

const loadFormData = async () => {
  try {
    const [parentsRes, programsRes, studentsRes, classesRes] = await Promise.all([
      parentService.getAllParents(),
      programService.getAllPrograms(),
      studentService.getAllStudents(),
      classService.getAllClasses(),
    ])
    parents.value = Array.isArray(parentsRes) ? parentsRes : []
    programs.value = Array.isArray(programsRes) ? programsRes : []
    students.value = Array.isArray(studentsRes) ? studentsRes : []
    classes.value = Array.isArray(classesRes) ? classesRes : []
  } catch (err) {
    console.error('Failed to load form data', err)
  }
}

const handleProgramChange = async (programId) => {
  if (!programId) {
    classes.value = []
    return
  }
  try {
    const data = await classService.getAvailableClasses(programId)
    classes.value = Array.isArray(data) ? data : []
  } catch (err) {
    console.error('Failed to load classes', err)
  }
}

let hintTimeout = null
const setValidationHint = (msg) => {
  validationHint.value = msg
  if (hintTimeout) clearTimeout(hintTimeout)
  hintTimeout = setTimeout(() => {
    validationHint.value = ''
  }, 4000)
}

const handleSaveEnrollment = async (formData) => {
  submitting.value = true
  errorMessage.value = ''
  try {
    const parent = parents.value.find((p) => (p.uid || p.id) === formData.parentId)
    const student = students.value.find((s) => s.id === formData.studentId)
    const program = programs.value.find((c) => c.id === formData.programId)
    const classInstance = classes.value.find((c) => c.id === formData.classId)

    const payload = {
      parentId: parent.uid || parent.id,
      studentId: student.id || student.uid,
      programId: program.id,
      classId: classInstance.id,
      parent: { id: parent.uid || parent.id, name: parent.name, profileURL: parent.profileURL },
      student: { id: student.id || student.uid, name: student.name, profileURL: student.profileURL },
      program: {
        id: program.id,
        name: program.name,
        type: program.type || 'Group',
        profileURL: program.profileURL,
        basePrice: program.basePrice || 0,
        totalSessions: program.totalSessions || 0,
      },
      class: {
        id: classInstance.id,
        day: classInstance.day,
        timeslot: classInstance.timeslot,
        branchAbbr: classInstance.branch?.abbr || 'N/A',
        schedule: `${classInstance.day} (${classInstance.timeslot})`,
      },
      amount: formData.amount,
      discountAmount: formData.discountAmount || 0,
      isSponsorship: formData.isSponsorship || false,
      sponsorName: formData.sponsorName || '',
      isProrated: formData.isProrated,
      enrollmentType: formData.enrollmentType || '',
      remark: formData.remark || '',
      totalSessions: formData.totalSessions || 0,
      remainingSessions: formData.remainingSessions || 0,
      passedSessions: formData.passedSessions || 0,
      prorateSavings: formData.prorateSavings || 0,
      ...(!formData.id
        ? {
          status: 'unpaid',
          paymentStatus: 'unpaid',
          enrollAt: new Date().toISOString(),
        }
        : {}),
    }

    if (formData.id) {
      await enrollmentService.updateEnrollment(formData.id, payload)
      successMessage.value = 'Successfully updated enrollment!'
    } else {
      const result = await enrollmentService.createEnrollment(payload)
      successMessage.value = 'Successfully created enrollment!'
      newlyCreatedId.value = result.id || result.UID
    }

    await fetchEnrollments()
    setTimeout(() => {
      showModal.value = false
      selectedEnrollment.value = null
      successMessage.value = ''
    }, 1500)
  } catch (err) {
    errorMessage.value = err.message || 'Failed to save enrollment.'
  } finally {
    submitting.value = false
  }
}

const enrollmentStats = computed(() => {
  const s = calculateTotalEnrollment(enrollments.value)
  return [
    {
      label: 'Gross Enrollments',
      value: s.total,
      image: getImageUrl('enrollment/total-enrollment'),
      color: 'var(--accent-light)',
    },
    {
      label: 'Authorized Assets',
      value: s.paidCount,
      image: getImageUrl('enrollment/total-paid-enrollment'),
      color: 'var(--accent-light)',
    },
    {
      label: 'Pending Accounts',
      value: s.unpaidCount,
      image: getImageUrl('enrollment/total-unpaid-enrollment'),
      color: 'var(--accent-light)',
    },
    {
      label: 'Voided Files',
      value: s.cancelledCount,
      image: getImageUrl('enrollment/total-canceled-enrollment'),
      color: 'var(--danger-light)',
    },
  ]
})

const enrollmentHeaders = [
  { label: 'No', width: '50px', align: 'center', class: 'hidden md:table-cell' },
  { label: 'Participant Registry' },
  { label: 'Program Model' },
  { label: 'Logistics', width: '150px', class: 'hidden sm:table-cell' },
  { label: 'Value', width: '100px', align: 'center' },
  { label: 'Status', width: '120px', align: 'center' },
  { label: 'Timeline', width: '150px', align: 'center', class: 'hidden lg:table-cell' },
  { label: 'Action', width: '80px', align: 'center' },
]

const currentFilter = ref('all')

const statusFilteredEnrollments = computed(() => {
  const enriched = enrichEnrollments(
    enrollments.value,
    parents.value,
    students.value,
    programs.value,
    classes.value,
  )

  let filtered = enriched
  if (currentFilter.value !== 'all') {
    filtered = enriched.filter((r) => {
      const s = String(r.status || '').toLowerCase()
      const p = String(r.paymentStatus || '').toLowerCase()

      if (currentFilter.value === 'paid') return (p === 'paid' || p === 'confirmed') && s !== 'cancelled'
      if (currentFilter.value === 'unpaid') return p === 'unpaid' && s !== 'cancelled'
      if (currentFilter.value === 'cancelled') return s === 'cancelled'
      return true
    })
  }

  return filtered.sort((a, b) => new Date(b.enrollAt || 0) - new Date(a.enrollAt || 0))
})

const { searchQuery, searchResults: filteredEnrollments } = useSearch(
  statusFilteredEnrollments,
  enrollmentSearchMapper,
)

const currentPage = ref(1)
const pageSize = 10
const totalItems = computed(() => filteredEnrollments.value.length)

const paginatedEnrollments = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  const end = start + pageSize
  return filteredEnrollments.value.slice(start, end)
})

watch([currentFilter, searchQuery], () => {
  currentPage.value = 1
})

const actionState = ref({
  isOpen: false,
  type: '',
  enrollment: null,
})

const handleTableAction = ({ type, item }) => {
  errorMessage.value = ''
  successMessage.value = ''

  if (type === 'edit') {
    selectedEnrollment.value = item
    showModal.value = true
    return
  }

  actionState.value = { isOpen: true, type, enrollment: item }
}

const submitActionModal = async (payload) => {
  const { type, enrollment } = actionState.value
  submitting.value = true
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
      await enrollmentService.updateEnrollment(enrollment.id, updateData)
    } else if (type === 'cancel') {
      await enrollmentService.updateEnrollment(enrollment.id, {
        status: 'cancelled',
        cancelReason: payload.reason,
      })
    } else if (type === 'delete') {
      await enrollmentService.deleteEnrollment(enrollment.id)
    }
    successMessage.value = 'Action completed successfully.'
    await fetchEnrollments()
    setTimeout(() => closeActionModal(), 2000)
  } catch (err) {
    errorMessage.value = err.message
  } finally {
    submitting.value = false
  }
}

const closeActionModal = () => {
  actionState.value.isOpen = false
  errorMessage.value = ''
  successMessage.value = ''
}

const handleOpenRegisterStudent = (parentId) => {
  const parent = parents.value.find((p) => (p.uid || p.id) === parentId)
  if (!parent) return
  childRegistrationModal.value = { isOpen: true, parent, loading: false, error: '', success: '' }
}

const handleRegisterStudent = async (formData) => {
  childRegistrationModal.value.loading = true
  try {
    const { parentId, name, dob, profile, medicalNote } = formData
    let finalProfile = profile
    if (profile && profile.includes('/profiles/temp/')) {
      const extension = profile.split('?')[0].split('.').pop()
      const sanitizedName = name.toLowerCase().replace(/[^a-z0-9]/g, '_')
      const newPath = `profiles/temp_student/${sanitizedName}_student.${extension}`
      finalProfile = await storageService.moveProfileImage(profile, newPath)
    }
    const result = await studentService.registerStudent(parentId, {
      name,
      dob,
      profile: finalProfile,
      medicalNote,
      status: 'Inactive',
    })
    childRegistrationModal.value.success = 'Student registered successfully!'
    const studentsRes = await studentService.getAllStudents()
    students.value = Array.isArray(studentsRes) ? studentsRes : []
    if (result && result.id && enrollmentForm.value) enrollmentForm.value.setStudent(result.id)
    setTimeout(() => { childRegistrationModal.value.isOpen = false }, 1500)
  } catch (err) {
    childRegistrationModal.value.error = err.message || 'Error registering student.'
  } finally {
    childRegistrationModal.value.loading = false
  }
}
</script>

<template>
  <DashboardLayout>
    <DataPageLayout overviewTitle="Enrollment Registry Portal">
      <template #overview>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <DataMetricCard v-for="stat in enrollmentStats" :key="stat.label" v-bind="stat" />
        </div>
      </template>

      <template #table>
        <DataTable 
          title="Active Enrollments" 
          :headers="enrollmentHeaders" 
          :items="paginatedEnrollments"
          entityName="enrollment" 
          :loading="loading" 
          :hasPagination="true" 
          :flexible="true"
          :pageSize="pageSize" 
          :totalItems="totalItems" 
          v-model:currentPage="currentPage"
          v-model:searchQuery="searchQuery" 
          searchPlaceholder="Search by student, parent, or program model..." 
          :hasFilter="true"
          v-model:currentFilter="currentFilter" 
          :filterOptions="[
            { label: 'All Files', value: 'all' },
            { label: 'Authorized', value: 'paid' },
            { label: 'Pending', value: 'unpaid' },
            { label: 'Voided', value: 'cancelled' },
          ]" 
          :rowClass="getRowClass" 
          @action="handleTableAction" 
          @row-click="(item) => $router.push(`/enrollments/${item.id}`)"
        >
          <template #toolbar-actions>
            <AppButton variant="primary" size="md" class="rounded-xl shadow-lg shadow-primary/20" @click="showModal = true">
              <img :src="getActionIcon('plus')" class="w-4 h-4 brightness-0 invert" />
              <span class="font-black tracking-tight">New Enrollment</span>
            </AppButton>
          </template>

          <template #row="{ item, index, toggleMenu, activeMenuId, isMenuAbove, menuStyles, handleAction, closeMenu, headers }">
            <td class="ui-cell text-center font-bold text-content-muted/20 hidden md:table-cell" :style="{ width: headers[0].width }">
              {{ (currentPage - 1) * pageSize + index + 1 }}
            </td>

            <td class="ui-cell min-w-[240px]" :style="{ flex: '1 1 0%' }">
               <div class="flex flex-col gap-3">
                  <div class="flex items-center gap-3 group/student cursor-pointer">
                    <div class="w-10 h-10 rounded-xl overflow-hidden ring-2 ring-primary/5 group-hover/student:ring-primary/20 transition-all duration-500">
                      <img :src="item.student?.profileURL" class="w-full h-full object-cover" />
                    </div>
                    <div class="flex flex-col">
                      <span class="font-black text-content-dark group-hover/student:text-primary transition-colors tracking-tighter leading-tight">{{ item.student?.name }}</span>
                      <span class="text-[9px] font-black text-content-muted uppercase tracking-widest mt-0.5">Primary Learner</span>
                    </div>
                  </div>
                  <div class="flex items-center gap-2 pl-2 opacity-60">
                    <div class="w-5 h-5 rounded-lg overflow-hidden ring-1 ring-border">
                      <img :src="item.parent?.profileURL" class="w-full h-full object-cover" />
                    </div>
                    <span class="text-[10px] font-bold text-content-muted leading-none">{{ item.parent?.name }}</span>
                  </div>
               </div>
            </td>

            <td class="ui-cell" :style="{ flex: '1 1 0%' }">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-white ring-1 ring-border p-1.5 shadow-sm overflow-hidden">
                  <img :src="item.program?.profileURL" class="w-full h-full object-contain" />
                </div>
                <div class="flex flex-col overflow-hidden">
                  <span class="font-black text-content-dark tracking-tighter truncate max-w-[140px] leading-tight">{{ item.class?.program?.name }}</span>
                  <span class="text-[9px] font-black text-primary uppercase tracking-widest mt-0.5">{{ item.enrollmentType || 'Standard' }} Term</span>
                </div>
              </div>
            </td>

            <td class="ui-cell hidden sm:table-cell" :style="{ width: headers[3].width }">
              <div v-if="getSessionDay(item.classSchedule) !== 'N/A'" class="flex flex-col">
                <span class="text-xs font-black text-content-dark uppercase tracking-tighter leading-none">{{ getSessionDay(item.classSchedule, true) }}</span>
                <span class="text-[10px] font-black text-content-muted uppercase tracking-widest mt-1">{{ getSessionTime(item.classSchedule) }}</span>
                <div class="flex items-center gap-1 mt-1.5">
                   <div class="w-1 h-1 rounded-full bg-blue-400"></div>
                   <span class="text-[8px] font-black text-blue-500 uppercase tracking-widest">{{ item.branchAbbr || 'HQ' }} Campus</span>
                </div>
              </div>
              <span v-else class="text-[10px] font-black uppercase text-content-muted/30 tracking-widest italic">Pending</span>
            </td>

            <td class="ui-cell text-center" :style="{ width: headers[4].width }">
               <div class="inline-flex flex-col items-center px-3 py-1.5 rounded-xl bg-surface-subtle border border-black/5">
                  <span class="text-sm font-black text-content-dark tabular-nums tracking-tighter">${{ formatPrice(item.amount || 0) }}</span>
                  <span class="text-[8px] font-black text-content-muted/60 uppercase tracking-widest">Fee Payload</span>
               </div>
            </td>

            <td class="ui-cell text-center" :style="{ width: headers[5].width }">
              <AppBadge :status="item.status || item.paymentStatus || 'Unpaid'" />
            </td>

            <td class="ui-cell text-center hidden lg:table-cell" :style="{ width: headers[6].width }">
              <div class="flex flex-col items-center">
                 <span class="text-[11px] font-black text-content-dark tabular-nums tracking-tight">{{ formatDate(item.enrollAt) }}</span>
                 <span class="text-[8px] font-black text-content-muted uppercase tracking-widest mt-1">Registry Stamp</span>
              </div>
            </td>

            <td class="ui-cell text-center" :style="{ width: headers[7].width }">
              <div class="ui-action-menu">
                <button class="w-8 h-8 flex items-center justify-center hover:bg-surface-subtle rounded-lg transition-all text-content-muted hover:text-content-dark" @click.stop="toggleMenu($event, item.id)">
                  <span class="font-black text-lg leading-none mb-1">⋮</span>
                </button>
                <Teleport to="body">
                  <transition enter-active-class="transition duration-200 ease-out"
                    enter-from-class="transform scale-95 opacity-0" enter-to-class="transform scale-100 opacity-100"
                    leave-active-class="transition duration-150 ease-in" leave-from-class="opacity-100"
                    leave-to-class="opacity-0">
                    <div v-if="activeMenuId === item.id" class="ui-dropdown-menu"
                      :class="{ 'origin-bottom': isMenuAbove, 'origin-top': !isMenuAbove }" :style="menuStyles"
                      @click.stop>
                      <button v-if="item.status !== 'confirmed' && item.paymentStatus !== 'paid' && item.status !== 'cancelled'" class="ui-dropdown-item ui-dropdown-item-info group" @click="() => { handleAction('edit', item); closeMenu(); }">
                        <img :src="getActionIcon('edit')" class="w-4 h-4 opacity-40 group-hover:opacity-100" />
                        <span class="font-bold">Edit Details</span>
                      </button>
                      <button v-if="item.status !== 'confirmed' && item.paymentStatus !== 'paid' && item.status !== 'cancelled'" class="ui-dropdown-item ui-dropdown-item-success group" @click="() => { handleAction('pay', item); closeMenu(); }">
                        <img :src="getActionIcon('pay')" class="w-4 h-4 opacity-40 group-hover:opacity-100" />
                        <span class="font-bold">Process Payment</span>
                      </button>
                      <button v-if="item.status !== 'cancelled'" class="ui-dropdown-item ui-dropdown-item-danger group" @click="() => { handleAction('cancel', item); closeMenu(); }">
                        <img :src="getActionIcon('cancel')" class="w-4 h-4 opacity-40 group-hover:opacity-100" />
                        <span class="font-bold">Void Enrollment</span>
                      </button>
                      <div class="h-px bg-surface-light mx-1 my-1"></div>
                      <button class="ui-dropdown-item ui-dropdown-item-danger group font-black uppercase tracking-tighter" @click="() => { handleAction('delete', item); closeMenu(); }">
                        <img :src="getActionIcon('delete')" class="w-4 h-4 opacity-40 group-hover:opacity-100" />
                        Purge Record
                      </button>
                    </div>
                  </transition>
                </Teleport>
              </div>
            </td>
          </template>
        </DataTable>
      </template>
    </DataPageLayout>

    <EnrollmentFormModal 
      ref="enrollmentForm" 
      :isOpen="showModal" 
      :loading="submitting" 
      :parents="parents"
      :students="students" 
      :programs="programs" 
      :classes="classes" 
      :enrollments="enrollments"
      :enrollment="selectedEnrollment" 
      :error="errorMessage" 
      :success="successMessage" 
      :hint="validationHint" 
      @close="() => { showModal = false; selectedEnrollment = null; errorMessage = ''; successMessage = ''; validationHint = ''; }" 
      @program-change="handleProgramChange" 
      @submit="handleSaveEnrollment" 
      @hint="setValidationHint"
      @register-student="handleOpenRegisterStudent" 
    />

    <ParentActionModal 
      :isOpen="childRegistrationModal.isOpen" 
      type="plus" 
      :user="childRegistrationModal.parent"
      :selectableParents="parents" 
      :loading="childRegistrationModal.loading" 
      :error="childRegistrationModal.error"
      :success="childRegistrationModal.success" 
      @close="() => { childRegistrationModal.isOpen = false; childRegistrationModal.error = ''; childRegistrationModal.success = ''; }" 
      @submit="handleRegisterStudent" 
    />

    <EnrollmentActionModal 
      v-bind="actionState" 
      :loading="submitting" 
      v-model:error="errorMessage"
      v-model:success="successMessage" 
      @close="closeActionModal" 
      @submit="submitActionModal" 
    />
  </DashboardLayout>
</template>

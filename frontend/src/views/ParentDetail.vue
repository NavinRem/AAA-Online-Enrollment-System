<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import DetailPageLayout from '@/components/layout/DetailPageLayout.vue'
import AppBadge from '@/components/common/ui/AppBadge.vue'
import AppButton from '@/components/common/ui/AppButton.vue'
import { parentService } from '@/services/parentService'
import { studentService } from '@/services/studentService'
import { authService } from '@/services/authService'
import { enrollmentService } from '@/services/enrollmentService'
import { formatDate, formatPrice } from '@/utils/formatUtils'
import { filterDetailEnrollments, enrichEnrollments } from '@/utils/enrollmentHelper'
import { enrichStudents } from '@/utils/studentHelper'
import { programService } from '@/services/programService'
import { classService } from '@/services/classService'
import {
  processParentProfileImage,
  prepareParentPayload,
} from '../utils/parentHelper'
import { processStudentProfileImage, prepareStudentPayload } from '../utils/studentHelper'
import { getImageUrl, getActionIcon } from '@/utils/assetHelper'
import ParentActionModal from '../components/parents/ParentActionModal.vue'

const route = useRoute()
const router = useRouter()

const parent = ref(null)
const students = ref([])
const enrollments = ref([])
const selectedChildId = ref('all')
const activeTab = ref('children')
const currentFilter = ref('all')

watch(activeTab, () => {
  currentFilter.value = 'all'
})

const loading = ref(true)
const errorMessage = ref('')
const submitting = ref(false)
const globalSuccess = ref('')
const globalError = ref('')

const studentEnrollments = computed(() => {
  return filterDetailEnrollments(enrollments.value, {
    studentId: selectedChildId.value,
    academicStatus: 'studying',
  })
})

const filteredPayments = computed(() =>
  filterDetailEnrollments(enrollments.value, {
    paymentStatus: currentFilter.value,
  }),
)

const filteredHistory = computed(() =>
  filterDetailEnrollments(enrollments.value, {
    academicStatus: currentFilter.value,
  }),
)

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
    type: 'register-child',
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
    } else if (type === 'register-child') {
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
    <DetailPageLayout :loading="loading" :errorMessage="errorMessage" backRoute="/parents" title="Parent Dashboard">
      <template #header-actions v-if="parent">
        <div class="flex items-center gap-3">
          <AppButton v-if="!isInactive" variant="secondary" class="rounded-xl border-outline-std" @click="openAddChildModal">
            <img :src="getActionIcon('plus')" class="w-4 h-4 opacity-70" /> 
            <span class="font-bold">Register Child</span>
          </AppButton>
          <AppButton v-if="!isInactive" variant="secondary" class="rounded-xl border-outline-std" @click="openActionModal('edit')">
            <img :src="getActionIcon('edit')" class="w-4 h-4 opacity-70" />
            <span class="font-bold">Edit</span>
          </AppButton>
          <div class="w-px h-6 bg-outline-std mx-1"></div>
          <AppButton v-if="!isInactive" variant="danger" class="rounded-xl shadow-lg shadow-error/10" @click="openActionModal('delete')">
            <img :src="getActionIcon('delete')" class="w-4 h-4 invert" />
            <span class="font-black">Delete</span>
          </AppButton>
          <AppButton v-if="isInactive" variant="primary" class="rounded-xl shadow-lg shadow-primary/20" @click="openActionModal('activate')">
            <img :src="getActionIcon('reactivate')" class="w-4 h-4 brightness-0 invert" />
            <span class="font-black">Reactivate</span>
          </AppButton>
        </div>
      </template>

      <template #left-content v-if="parent">
        <!-- Identity Section -->
        <div class="mb-10 p-8 rounded-[2rem] bg-white border border-outline-std shadow-sm flex flex-col md:flex-row items-center gap-10">
          <div class="relative group">
            <div class="w-40 h-40 rounded-[2.5rem] overflow-hidden ring-4 ring-primary/5 shadow-2xl transition-transform duration-500 group-hover:scale-105">
              <img :src="parent.profileURL" class="w-full h-full object-cover" />
            </div>
            <div class="absolute -bottom-2 -right-2">
              <AppBadge :status="parent.status" :showLabel="false" />
            </div>
          </div>
          
          <div class="flex flex-col items-center md:items-start text-center md:text-left flex-1">
            <div class="flex items-center gap-3 mb-2">
               <h1 class="text-4xl font-black text-content-dark tracking-tighter">{{ parent.name }}</h1>
               <AppBadge :status="parent.status" />
            </div>
            <div class="flex flex-wrap items-center justify-center md:justify-start gap-6 text-content-muted">
               <div class="flex flex-col">
                  <span class="text-[10px] font-black uppercase tracking-widest leading-none mb-1 opacity-50">Primary Phone</span>
                  <span class="text-lg font-black text-content-dark tracking-tight">{{ parent.phone }}</span>
               </div>
               <div class="w-px h-8 bg-outline-std"></div>
               <div class="flex flex-col">
                  <span class="text-[10px] font-black uppercase tracking-widest leading-none mb-1 opacity-50">Email Access</span>
                  <span class="text-sm font-bold text-primary lowercase">{{ parent.email }}</span>
               </div>
            </div>
          </div>
          
          <div class="flex flex-col gap-2">
            <button @click="openActionModal('reset-password')" class="px-6 py-3 rounded-2xl bg-surface-subtle hover:bg-primary/5 text-primary text-xs font-black uppercase tracking-widest transition-all ring-1 ring-black/5">
               Security Reset
            </button>
            <button v-if="!isInactive" @click="openActionModal('deactivate')" class="px-6 py-3 rounded-2xl bg-error-soft/30 hover:bg-error-soft text-error text-xs font-black uppercase tracking-widest transition-all ring-1 ring-error/10">
               Freeze Account
            </button>
          </div>
        </div>

        <!-- Linked Children Discovery -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          <div 
            v-for="s in students" :key="s.id" 
            class="group p-6 rounded-3xl bg-white border border-outline-std hover:border-primary/20 hover:shadow-md transition-all cursor-pointer"
            @click="router.push(`/students/${s.id}`)"
          >
            <div class="flex items-center gap-4">
              <div class="w-14 h-14 rounded-2xl overflow-hidden ring-2 ring-primary/5 group-hover:ring-primary/20 transition-all">
                <img :src="s.profileURL" class="w-full h-full object-cover" />
              </div>
              <div class="flex flex-col overflow-hidden">
                <span class="text-base font-black text-content-dark group-hover:text-primary transition-colors truncate">{{ s.name }}</span>
                <span class="text-[10px] font-black text-content-muted uppercase tracking-widest">Active Student</span>
              </div>
            </div>
          </div>
          <button @click="openAddChildModal" class="p-6 rounded-3xl border-2 border-dashed border-outline-std hover:border-primary/30 hover:bg-primary/5 transition-all flex items-center justify-center gap-3 group">
             <div class="w-10 h-10 rounded-full bg-surface-subtle flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                <span class="text-xl font-bold">+</span>
             </div>
             <span class="text-sm font-black text-content-muted group-hover:text-primary uppercase tracking-widest">Link New Child</span>
          </button>
        </div>

        <!-- Academic Repository -->
        <div class="bg-white rounded-[2.5rem] border border-outline-std shadow-sm overflow-hidden min-h-[500px]">
          <div class="flex items-center gap-2 p-3 bg-surface-subtle/30 border-b border-outline-std">
            <button
              v-for="tab in ['children', 'payments', 'history']"
              :key="tab"
              class="px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all duration-300"
              :class="activeTab === tab ? 'bg-white text-primary shadow-sm ring-1 ring-black/5' : 'text-content-muted hover:text-content-dark hover:bg-white/50'"
              @click="activeTab = tab"
            >
              {{ tab === 'children' ? 'Current Programs' : tab === 'payments' ? 'Finance Logs' : 'Archive' }}
            </button>
          </div>

          <div class="p-8">
             <div v-if="activeTab === 'children'">
                <div v-if="students.length > 0" class="flex flex-wrap gap-2 mb-8">
                  <button 
                    v-for="s in students" :key="s.id"
                    class="px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
                    :class="selectedChildId === s.id ? 'bg-primary text-white shadow-lg' : 'bg-surface-subtle text-content-muted hover:bg-outline-std'"
                    @click="selectedChildId = s.id"
                  >
                    <div class="w-5 h-5 rounded-full overflow-hidden border border-white/20">
                      <img :src="s.profileURL" class="w-full h-full object-cover" />
                    </div>
                    {{ s.name }}
                  </button>
                </div>
                
                <div v-if="studentEnrollments.length > 0" class="grid gap-4">
                  <div v-for="reg in studentEnrollments" :key="reg.id" class="p-6 rounded-3xl border border-outline-std bg-white hover:border-primary/10 transition-all flex items-center group">
                    <div class="flex-1 flex flex-col">
                      <span class="text-base font-black text-content-dark group-hover:text-primary transition-colors tracking-tight">{{ reg.program?.name }}</span>
                      <span class="text-[10px] font-black text-content-muted uppercase tracking-widest">{{ reg.class?.day }} • {{ reg.class?.timeslot }}</span>
                    </div>
                    <div class="flex-1 text-center font-black text-xl text-emerald-600">
                      ${{ formatPrice(reg.amount || 0) }}
                    </div>
                    <div class="w-32 flex justify-center">
                       <AppBadge :status="reg.displayStatus || reg.status || 'Unpaid'" />
                    </div>
                  </div>
                </div>
                <div v-else class="flex flex-col items-center justify-center py-20 opacity-30">
                  <img :src="getImageUrl('common/no-data')" class="w-20 mb-4 grayscale" />
                  <span class="text-sm font-black uppercase tracking-widest">No Active Enrollments</span>
                </div>
             </div>
             
             <!-- Finance Logs -->
             <div v-if="activeTab === 'payments'">
                <div v-if="filteredPayments.length > 0" class="overflow-hidden rounded-3xl border border-outline-std">
                  <table class="w-full text-left">
                    <thead class="bg-surface-subtle/50">
                      <tr>
                        <th class="px-6 py-4 text-[10px] font-black text-content-muted uppercase tracking-widest">Log No</th>
                        <th class="px-6 py-4 text-[10px] font-black text-content-muted uppercase tracking-widest">Evidence</th>
                        <th class="px-6 py-4 text-[10px] font-black text-content-muted uppercase tracking-widest text-center">Amount</th>
                        <th class="px-6 py-4 text-[10px] font-black text-content-muted uppercase tracking-widest text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-outline-std">
                      <tr v-for="(reg, idx) in filteredPayments" :key="reg.id" class="hover:bg-surface-subtle/20 transition-colors">
                        <td class="px-6 py-5 text-xs font-black text-content-muted/30 tabular-nums">{{ idx + 1 }}</td>
                        <td class="px-6 py-5">
                          <div class="flex flex-col">
                            <span class="text-xs font-mono text-content-dark">{{ reg.paymentProof || 'Internal Receipt' }}</span>
                            <span class="text-[10px] font-bold text-content-muted uppercase tabular-nums opacity-60">{{ formatDate(reg.updatedAt || reg.createdAt) }}</span>
                          </div>
                        </td>
                        <td class="px-6 py-5 text-center font-black text-content-dark">
                          ${{ formatPrice(reg.amount || 0) }}
                        </td>
                        <td class="px-6 py-5 text-center">
                          <AppBadge :status="reg.paymentStatus || 'Pending'" />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
             </div>
          </div>
        </div>
      </template>
    </DetailPageLayout>

    <ParentActionModal :isOpen="actionModal.isOpen" :type="actionModal.type" :user="actionModal.user"
      :loading="submitting" v-model:error="globalError" v-model:success="globalSuccess"
      @close="actionModal.isOpen = false" @submit="submitActionModal" />
  </DashboardLayout>
</template>

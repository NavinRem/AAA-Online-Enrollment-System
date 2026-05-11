<script setup>
import { ref, computed, watch } from 'vue'
import AppModal from '@/components/common/ui/AppModal.vue'
import AppButton from '@/components/common/ui/AppButton.vue'
import AppSelect from '@/components/common/ui/AppSelect.vue'
import AppInput from '@/components/common/ui/AppInput.vue'
import AppAlert from '@/components/common/ui/AppAlert.vue'
import AppBadge from '@/components/common/ui/AppBadge.vue'
import { getActionIcon, getProgramProfileURL } from '@/utils/assetHelper'
import { useDataStore } from '@/stores/dataStore'

const props = defineProps({
  isOpen: Boolean,
  term: Object,
  initialBranchId: [String, Number],
  loading: Boolean,
  error: String,
  success: String,
})

const emit = defineEmits(['close', 'submit'])

const dataStore = useDataStore()

const form = ref({
  branchId: '',
  programId: '',
  scheduleId: '',
  capacity: 20
})

const errors = ref({})

const programs = computed(() => dataStore.programs)
const branches = computed(() => {
  if (!props.term || !dataStore.branches.length) return []
  // Only show branches assigned to this term
  const termBranchIds = props.term.branchIds || []
  return dataStore.branches.filter(b => termBranchIds.includes(b.id))
})

const selectedProgram = computed(() => 
  programs.value.find(p => p.id === form.value.programId)
)

const availableSchedules = computed(() => {
  if (!form.value.programId) return []
  const product = dataStore.classes.find(c => c.programId === form.value.programId)
  if (!product) return []
  
  return (product.scheduleIds || []).map(id => 
    dataStore.schedules.find(s => s.id === id)
  ).filter(Boolean)
})

watch(() => props.isOpen, (val) => {
  if (val) {
    form.value = {
      branchId: props.initialBranchId || (props.term?.branchIds?.[0] || ''),
      programId: '',
      scheduleId: '',
      capacity: 20
    }
    errors.value = {}
  }
})

watch(() => form.value.programId, () => {
  form.value.scheduleId = ''
  if (selectedProgram.value) {
    form.value.capacity = selectedProgram.value.capacity || 20
  }
})

const validate = () => {
  const newErrors = {}
  if (!form.value.branchId) newErrors.branchId = 'Branch is required'
  if (!form.value.programId) newErrors.programId = 'Program is required'
  if (!form.value.scheduleId) newErrors.scheduleId = 'Schedule is required'
  if (!form.value.capacity || form.value.capacity < 1) newErrors.capacity = 'Valid capacity required'
  
  errors.value = newErrors
  return Object.keys(newErrors).length === 0
}

const handleSubmit = () => {
  if (!validate()) return
  
  const schedule = availableSchedules.value.find(s => s.id === form.value.scheduleId)
  const branch = branches.value.find(b => b.id === form.value.branchId)
  
  const payload = {
    offeringId: `off-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    classId: dataStore.classes.find(c => c.programId === form.value.programId)?.id,
    program: selectedProgram.value,
    branchId: form.value.branchId,
    branch: {
      id: branch.id,
      name: branch.name,
      abbr: branch.abbr,
      color: branch.color
    },
    scheduleId: form.value.scheduleId,
    schedule: {
      id: schedule.id,
      day: schedule.day,
      time: schedule.time
    },
    capacity: form.value.capacity,
    currentCount: 0,
    students: [],
    status: 'active'
  }
  
  emit('submit', payload)
}
</script>

<template>
  <AppModal :show="isOpen" title="Add Class to Term" :icon="getActionIcon('plus')" :error="error" :success="success"
    maxWidth="500px" @close="$emit('close')">
    <div class="flex flex-col gap-lg py-2">
      <div class="bg-surface-subtle/50 p-4 rounded-2xl border border-outline-std flex items-center gap-4 mb-2">
        <div class="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-sm border border-outline-std">
          <span class="text-2xl">📅</span>
        </div>
        <div class="flex flex-col">
          <span class="text-xs font-bold text-content-muted uppercase tracking-widest leading-none mb-1">Target Term</span>
          <h3 class="text-md font-black text-content-dark tracking-tight">{{ term?.name }}</h3>
        </div>
      </div>

      <AppSelect v-model="form.branchId" :items="branches" label="Select Branch" placeholder="Choose branch..." required
        :error="errors.branchId">
        <template #selected="{ item }">
          <div v-if="item" class="flex items-center gap-2">
            <AppBadge :status="item.abbr" :type="item.color || 'blue'" />
            <span class="font-bold text-content-dark">{{ item.name }}</span>
          </div>
        </template>
      </AppSelect>

      <AppSelect v-model="form.programId" :items="programs" label="Select Class Product" placeholder="Select from catalog..."
        required :error="errors.programId">
        <template #selected="{ item }">
          <div v-if="item" class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-lg border border-outline-std overflow-hidden bg-white p-1">
              <img :src="getProgramProfileURL(item.profileURL, item.category)" class="w-full h-full object-contain" />
            </div>
            <span class="font-bold text-content-dark">{{ item.name }}</span>
          </div>
        </template>
        <template #item="{ item }">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-lg border border-outline-std overflow-hidden bg-white p-1">
              <img :src="getProgramProfileURL(item.profileURL, item.category)" class="w-full h-full object-contain" />
            </div>
            <div class="flex flex-col">
              <span class="font-bold text-content-dark text-sm">{{ item.name }}</span>
              <span class="text-3xs text-content-muted font-bold">{{ item.category }}</span>
            </div>
          </div>
        </template>
      </AppSelect>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-lg">
        <AppSelect v-model="form.scheduleId" :items="availableSchedules" label="Select Schedule"
          placeholder="Pick a session..." required :disabled="!form.programId" :error="errors.scheduleId">
          <template #selected="{ item }">
            <div v-if="item" class="flex flex-col">
              <span class="text-sm font-bold text-content-dark leading-none">{{ item.day }}</span>
              <span class="text-3xs font-bold text-primary mt-1">{{ item.time }}</span>
            </div>
          </template>
          <template #item="{ item }">
            <div class="flex justify-between items-center w-full">
              <span class="font-bold text-content-dark text-sm">{{ item.day }}</span>
              <span class="text-xs font-bold text-primary">{{ item.time }}</span>
            </div>
          </template>
        </AppSelect>

        <AppInput v-model="form.capacity" type="number" label="Class Capacity" required :error="errors.capacity" />
      </div>
    </div>

    <template #footer>
      <div class="flex items-center justify-end gap-3 w-full">
        <AppButton variant="cancel" @click="$emit('close')">Cancel</AppButton>
        <AppButton variant="primary" :loading="loading" @click="handleSubmit">
          Add Class to Term
        </AppButton>
      </div>
    </template>
  </AppModal>
</template>

<script setup>
import { ref, computed } from 'vue'
import AppSelect from '@/components/common/ui/AppSelect.vue'
import AppBadge from '@/components/common/ui/AppBadge.vue'
import { getActionIcon } from '@/utils/assetHelper'

const props = defineProps({
  form: { type: Object, required: true },
  errors: { type: Object, default: () => ({}) },
  shaking: { type: Object, default: () => ({}) },
  loading: { type: Boolean, default: false },
  isEditMode: { type: Boolean, default: false },
  isTransferMode: { type: Boolean, default: false },
  parentSelectItems: { type: Array, default: () => [] },
  studentSelectItems: { type: Array, default: () => [] },
  programSelectItems: { type: Array, default: () => [] },
  offeringSelectItems: { type: Array, default: () => [] },
  availableStudents: { type: Array, default: () => [] },
  availableOfferings: { type: Array, default: () => [] },
})

const emit = defineEmits([
  'update:form',
  'click-disabled',
  'parent-change',
  'student-change',
  'program-change',
  'offering-change'
])

const updateForm = (field, value) => {
  emit('update:form', { ...props.form, [field]: value })
}

const fullClassAlert = ref('')

const offeringErrorLabel = computed(() => {
  if (props.errors.termOfferingId) return props.errors.termOfferingId
  if (!fullClassAlert.value) return ''
  const lower = fullClassAlert.value.toLowerCase()
  if (lower.includes('full')) return 'Class Full'
  if (lower.includes('branch')) return 'Branch Conflict'
  if (lower.includes('schedule')) return 'Schedule Conflict'
  return 'Selection Conflict'
})

const handleOfferingUpdate = (val) => {
  updateForm('termOfferingId', val)
}

const handleOfferingSelection = (val) => {
  fullClassAlert.value = ''
  emit('offering-change', val)
}
</script>

<template>
  <div class="ui-form-grid">
    <AppSelect
      :modelValue="form.parentId"
      @update:modelValue="updateForm('parentId', $event)"
      :items="parentSelectItems"
      label="Parent"
      placeholder="Select Parent"
      required
      :disabled="isEditMode"
      :error="errors.parentId"
      :shake="shaking.parentId"
      :loading="loading"
      searchPlaceholder="Search parent name..."
      @click-disabled="$emit('click-disabled', 'parentId')"
      @change="$emit('parent-change', $event)"
    >
      <template #item="{ item }">
        <div class="flex items-center gap-3 w-full">
          <div
            class="w-8 h-8 rounded-md border border-outline-std overflow-hidden bg-white shrink-0 shadow-sm"
          >
            <img
              :src="item.profileURL || getActionIcon('edit')"
              class="w-full h-full object-cover"
            />
          </div>
          <div class="flex flex-col flex-1">
            <span class="text-sm font-semibold text-content-dark">{{ item.name }}</span>
          </div>
          <div v-if="item.children?.length" class="flex -space-x-2 ml-auto">
            <div
              v-for="child in item.children"
              :key="child.id"
              class="w-6 h-6 rounded-full border-2 border-white overflow-hidden bg-surface-subtle shadow-sm"
              :title="child.name"
            >
              <img
                :src="child.profileURL || getActionIcon('student')"
                class="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </template>
    </AppSelect>

    <AppSelect
      :modelValue="form.studentId"
      @update:modelValue="updateForm('studentId', $event)"
      :items="studentSelectItems"
      label="Student"
      placeholder="Select Student"
      required
      :disabled="!form.parentId || isEditMode"
      :error="errors.studentId"
      :shake="shaking.studentId"
      :loading="loading"
      searchPlaceholder="Search student name..."
      @click-disabled="$emit('click-disabled', 'studentId')"
      @change="$emit('student-change', $event)"
    >
      <template #selected="{ item }">
        <div v-if="item" class="flex items-center gap-2 flex-1 overflow-hidden">
          <div
            class="w-7 h-7 rounded-full border border-outline-std overflow-hidden bg-white shrink-0"
          >
            <img
              :src="item.profileURL || getActionIcon('student')"
              class="w-full h-full object-cover"
            />
          </div>
          <span class="text-sm font-semibold text-content-dark truncate flex-1">{{
            item.name
          }}</span>
          <AppBadge v-if="item.age" status="student">{{ item.age }} years old</AppBadge>
        </div>
        <span v-else class="text-content-light text-sm italic opacity-70">Select Student</span>
      </template>
      <template #item="{ item }">
        <div class="flex items-center gap-3 w-full">
          <div
            class="w-8 h-8 rounded-md border border-outline-std overflow-hidden bg-white shrink-0 shadow-sm"
          >
            <img
              :src="item.profileURL || getActionIcon('student')"
              class="w-full h-full object-cover"
            />
          </div>
          <div class="flex flex-col flex-1">
            <span class="text-sm font-semibold text-content-dark">{{ item.name }}</span>
          </div>
          <div class="ml-auto flex items-center">
            <AppBadge v-if="item.age" status="student">{{ item.age }} years old</AppBadge>
          </div>
        </div>
      </template>
    </AppSelect>

    <div
      v-if="form.parentId && availableStudents.length === 0"
      class="col-span-2 p-4 bg-warning-soft border border-warning/20 rounded-xl flex items-center gap-3 animate-fade-in"
    >
      <img :src="getActionIcon('cancel')" class="w-5 h-5 brightness-0 grayscale opacity-60" />
      <span class="text-xs font-bold text-content-dark opacity-70"
        >This parent has no children registered. Add a child in the Students module first.</span
      >
    </div>

    <AppSelect
      :modelValue="form.programId"
      @update:modelValue="updateForm('programId', $event)"
      :items="programSelectItems"
      label="Program"
      placeholder="Select Program"
      required
      :disabled="!form.studentId"
      :error="errors.programId"
      :shake="shaking.programId"
      :loading="loading"
      @click-disabled="$emit('click-disabled', 'programId')"
      @change="$emit('program-change', $event)"
    >
      <template #selected="{ item }">
        <div v-if="item" class="flex items-center gap-2 flex-1 overflow-hidden">
          <span class="text-sm font-semibold text-content-dark truncate flex-1"
            >{{ item.name }}
          </span>
          <AppBadge :status="item.type" :type="item.type" />
        </div>
      </template>
      <template #item-badge="{ item }">
        <AppBadge :status="item.type" />
      </template>
    </AppSelect>

    <AppSelect
      :modelValue="form.termOfferingId"
      @update:modelValue="handleOfferingUpdate($event)"
      :items="offeringSelectItems"
      label="Available Classes"
      :placeholder="isTransferMode ? 'Select new class to transfer into' : 'Select a class to enroll'"
      required
      :disabled="!form.programId && !isTransferMode"
      :error="offeringErrorLabel"
      :shake="shaking.termOfferingId || !!fullClassAlert"
      :loading="loading"
      @click-disabled="$emit('click-disabled', 'termOfferingId')"
      @change="handleOfferingSelection($event)"
    >
      <template #selected="{ item }">
        <div v-if="item" class="flex items-center gap-2 flex-1 overflow-hidden">
          <AppBadge :status="item.termName" type="purple" />
          <AppBadge :status="item.scheduleDay" type="day" />
          <span class="text-sm font-semibold text-content-dark truncate flex-1">{{
            item.scheduleTime
          }}</span>
          <AppBadge v-if="item.capacity - item.studentCount <= 0" status="Full" type="red" />
          <span
            v-else
            class="text-xs font-bold"
            :class="item.capacity - item.studentCount <= 3 ? 'text-error' : 'text-success'"
          >
            {{ item.capacity - item.studentCount }} slots left
          </span>
          <AppBadge :status="item.branchName" :type="item.branchColor" />
        </div>
      </template>
      <template #item="{ item }">
        <div class="flex flex-col w-full gap-0.5">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="text-sm font-bold text-content-dark">{{ item.className }}</span>
              <AppBadge :status="item.termName" type="blue" />
            </div>
            <AppBadge :status="item.branchName" :type="item.branchColor" />
          </div>
          <div class="flex items-center justify-between mt-1">
            <div class="flex items-center gap-1.5">
              <AppBadge :status="item.scheduleDay" type="day" size="xs" />
              <span class="text-xs font-semibold text-content-dark">{{ item.scheduleTime }}</span>
            </div>
            <AppBadge v-if="item.capacity - item.studentCount <= 0" status="Full" type="red" />
            <span
              v-else
              class="text-xs font-bold"
              :class="item.capacity - item.studentCount <= 3 ? 'text-error' : 'text-success'"
            >
              {{ item.capacity - item.studentCount }} slots left
            </span>
          </div>
        </div>
      </template>
    </AppSelect>

    <transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 -translate-y-1"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-1"
    >
      <div
        v-if="fullClassAlert"
        class="col-span-2 p-3 bg-error-soft border border-error/20 rounded-xl flex items-start gap-2.5 shadow-sm mt-1 animate-bounce"
      >
        <img :src="getActionIcon('cancel')" class="w-5 h-5 shrink-0 mt-0.5" />
        <span class="text-xs font-bold text-error leading-relaxed">{{ fullClassAlert }}</span>
      </div>
    </transition>

    <div
      v-if="form.classId && availableOfferings.length === 0"
      class="col-span-2 p-4 bg-error-soft border border-error/10 rounded-xl flex items-center gap-3 animate-fade-in"
    >
      <img :src="getActionIcon('cancel')" class="w-5 h-5" />
      <span class="text-xs font-bold text-error"
        >No active or upcoming terms offer this class yet.</span
      >
    </div>
  </div>
</template>

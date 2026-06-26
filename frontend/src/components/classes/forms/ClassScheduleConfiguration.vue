<script setup>
import AppSelect from '@/components/common/ui/AppSelect.vue'
import { getImageUrl, getActionIcon } from '@/utils/assetHelper'

const props = defineProps({
  form: { type: Object, required: true },
  previewSchedules: { type: Array, default: () => [] },
  teachers: { type: Array, default: () => [] },
  scheduleCapacities: { type: Object, default: () => {} },
})

const emit = defineEmits(['update:form', 'deselect-schedule', 'remove-class'])

const updateTeacher = (schedId, val) => {
  const newForm = { ...props.form }
  newForm.scheduleTeachers = { ...newForm.scheduleTeachers, [schedId]: val }
  emit('update:form', newForm)
}

const updateCapacity = (schedId, val) => {
  const newForm = { ...props.form }
  newForm.scheduleCapacities = { ...newForm.scheduleCapacities, [schedId]: val }
  emit('update:form', newForm)
}

const getScheduleDuration = (timeRange) => {
  const range = (timeRange || '').split(' - ')
  if (range.length !== 2) return ''
  
  // local parser for duration
  const parse12hToMinutesLocal = (time12h) => {
    const [time, period] = time12h.split(' ')
    let [hours, minutes] = time.split(':').map(Number)
    if (period === 'PM' && hours < 12) hours += 12
    if (period === 'AM' && hours === 12) hours = 0
    return hours * 60 + minutes
  }

  const start = parse12hToMinutesLocal(range[0])
  const end = parse12hToMinutesLocal(range[1])
  let diff = end - start
  if (diff < 0) diff += 1440
  return `${diff}mn`
}
</script>

<template>
  <div
    v-if="previewSchedules.length > 0"
    class="flex flex-col gap-4 mt-2 animate-in slide-in-from-top-2 duration-500"
  >
    <div class="flex items-center justify-between px-1">
      <span class="text-sm font-semibold text-content-muted"
        >Selected Sessions Configuration</span
      >
      <span class="text-sm font-bold text-content-muted"
        >{{ previewSchedules.length }} session{{
          previewSchedules.length === 1 ? '' : 's'
        }}</span
      >
    </div>
    <div class="grid grid-cols-1 gap-4 max-h-72 overflow-y-auto pr-2 custom-scrollbar">
      <div
        v-for="sched in previewSchedules"
        :key="sched.id"
        class="flex items-center justify-between bg-white border border-outline-std rounded-sm p-5 shadow-sm"
      >
        <div class="flex items-center gap-4 flex-1">
          <div class="flex flex-col gap-1">
            <template v-if="sched.day">
              <span class="text-base font-bold text-content-dark flex items-center gap-2">
                {{ sched.day }}
                <span class="text-sm font-bold text-content-muted/60 tracking-tighter"
                  >({{ getScheduleDuration(sched.time) }})</span
                >
              </span>
              <div class="flex items-center gap-2">
                <span
                  class="text-sm font-bold text-primary tracking-tight bg-primary-soft/50 px-2 py-0.5 rounded-md border border-primary/10"
                  >{{ sched.time }}</span
                >
              </div>
            </template>
            <template v-else>
              <span class="text-sm font-bold italic text-content-muted">No schedule</span>
            </template>
          </div>
        </div>

        <div class="flex items-center gap-6 ml-4">
          <template v-if="!sched.isClassId">
            <div class="flex flex-col gap-1.5 min-w-52">
              <label class="text-xs font-bold text-content-muted"> Responsible Teacher </label>
              <AppSelect
                :modelValue="form.scheduleTeachers[sched.id]"
                @update:modelValue="(val) => updateTeacher(sched.id, val)"
                :items="teachers"
                placeholder="Assign Teacher..."
                size="sm"
                :searchable="true"
                class="!bg-surface-subtle/50"
              >
                <template #selected="{ item }">
                  <div v-if="item" class="flex items-center gap-2">
                    <img
                      :src="item.profileURL || getImageUrl('profiles/avatar-teacher-man')"
                      class="w-5 h-5 rounded-full border border-outline-std"
                    />
                    <span class="text-xs font-bold truncate max-w-24">{{ item.name }}</span>
                  </div>
                </template>
                <template #item="{ item }">
                  <div class="flex items-center gap-2 w-full">
                    <img
                      :src="item.profileURL || getImageUrl('profiles/avatar-teacher-man')"
                      class="w-6 h-6 rounded-lg border border-outline-std"
                    />
                    <div class="flex flex-col overflow-hidden">
                      <span class="text-xs font-bold text-content-dark truncate">{{
                        item.name
                      }}</span>
                      <span class="text-xs text-content-muted font-semibold">{{
                        item.branchAbbr || 'Cross-Branch'
                      }}</span>
                    </div>
                  </div>
                </template>
              </AppSelect>
            </div>

            <div class="flex flex-col items-center gap-1.5">
              <label class="text-xs font-bold text-content-muted"> Capacity </label>
              <div
                class="flex items-center gap-3 bg-surface-subtle p-sm rounded-sm border border-outline-std"
              >
                <input
                  type="number"
                  :value="form.scheduleCapacities[sched.id]"
                  @input="(e) => updateCapacity(sched.id, parseInt(e.target.value) || 0)"
                  class="w-14 h-6 text-base font-black text-center bg-transparent text-content-dark outline-none focus:text-primary transition-colors"
                  min="1"
                  required
                />
                <span class="text-xs font-bold text-content-muted">Seats</span>
              </div>
            </div>
          </template>

          <button
            type="button"
            @click="sched.isClassId ? $emit('remove-class', sched.id) : $emit('deselect-schedule', sched.id)"
            class="w-12 h-12 flex items-center justify-center hover:bg-error-soft text-content-muted hover:text-error rounded-xl transition-all border border-transparent hover:border-error/20 group/btn"
          >
            <img
              :src="getActionIcon('delete')"
              class="w-5 h-5 group-hover/btn:opacity-100 transition-opacity"
            />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<template>
  <AppModal
    :show="isOpen"
    :title="modalTitle"
    :icon="modalIcon"
    maxWidth="600px"
    @close="$emit('close')"
  >
    <template #header-extra v-if="error">
      <AppAlert :show="!!error" type="error" closable @close="$emit('update:error', '')">
        {{ error }}
      </AppAlert>
    </template>

    <form
      v-if="type === 'add' || type === 'edit'"
      id="programActionForm"
      class="grid grid-cols-2 gap-x-lg gap-y-md"
      @submit.prevent="handleSubmit"
    >
      <div
        class="flex flex-col gap-xs mb-sm col-span-2"
        :class="{ 'group is-error': isSubmittingAttempted && errors.name }"
      >
        <label class="text-xs font-black uppercase text-content-muted tracking-widest"
          >Program Identity / Model <span class="text-error">*</span>
          <span
            class="text-3xs font-bold text-primary ml-sm lowercase italic opacity-60"
            v-if="type === 'edit' && originalData.name"
            >Record: {{ originalData.name }}</span
          >
        </label>
        <input
          type="text"
          v-model="localData.name"
          placeholder="e.g. Master Class: Piano"
          class="w-full px-md py-sm border-2 border-outline-std rounded-sm bg-white text-sm font-bold outline-none transition-all focus:border-primary focus:ring-[3px] focus:ring-info-soft group-[.is-error]:border-error group-[.is-error]:bg-error-soft group-[.is-error]:ring-error/10"
        />
        <div
          v-if="isSubmittingAttempted && errors.name"
          class="text-error text-3xs font-black px-1 mt-1 uppercase"
        >
          {{ errors.name }}
        </div>
      </div>

      <div
        class="flex flex-col gap-xs"
        :class="{ 'group is-error': isSubmittingAttempted && errors.categoryId }"
      >
        <label class="text-xs font-black uppercase text-content-muted tracking-widest"
          >Category <span class="text-error">*</span></label
        >
        <AppSelect
          v-model="localData.categoryId"
          :items="sortedCategories"
          placeholder="Catalog..."
          @change="onCategoryChange"
        />
        <div
          v-if="isSubmittingAttempted && errors.categoryId"
          class="text-error text-3xs font-black px-1 mt-1 uppercase"
        >
          {{ errors.categoryId }}
        </div>
      </div>

      <div class="flex flex-col gap-xs">
        <label class="text-xs font-black uppercase text-content-muted tracking-widest"
          >Skill Level</label
        >
        <AppSelect v-model="localData.levelId" :items="sortedLevels" placeholder="Difficulty..." />
      </div>

      <div class="col-span-2 flex items-center gap-md py-2 opacity-50">
        <div class="h-px bg-border flex-1"></div>
        <span class="text-3xs font-black uppercase tracking-[2px] text-content-muted select-none"
          >Economic & Operational Logic</span
        >
        <div class="h-px bg-border flex-1"></div>
      </div>

      <div class="flex flex-col gap-xs mr-md">
        <label class="text-xs font-black uppercase text-content-muted tracking-widest"
          >Course Type <span class="text-error">*</span></label
        >
        <AppSelect
          v-model="localData.type"
          :items="[
            { id: 'group', name: 'Group / Ensemble' },
            { id: 'private', name: 'Private Session' },
          ]"
          :searchable="false"
        />
      </div>

      <div
        class="flex flex-col gap-xs"
        :class="{ 'group is-error': isSubmittingAttempted && errors.basePrice }"
      >
        <label class="text-xs font-black uppercase text-content-muted tracking-widest"
          >Catalog Price ($) <span class="text-error">*</span></label
        >
        <div class="relative">
          <span class="absolute left-4 top-1/2 -translate-y-1/2 text-content-muted font-bold"
            >$</span
          >
          <input
            type="number"
            v-model="localData.basePrice"
            min="0"
            step="0.01"
            class="w-full pl-9 pr-md py-sm border-2 border-outline-std rounded-sm bg-white text-sm font-black outline-none transition-all focus:border-primary focus:ring-[3px] focus:ring-info-soft group-[.is-error]:border-error group-[.is-error]:bg-error-soft"
          />
        </div>
        <div
          v-if="isSubmittingAttempted && errors.basePrice"
          class="text-error text-3xs font-black px-1 mt-1 uppercase"
        >
          {{ errors.basePrice }}
        </div>
      </div>

      <div
        class="flex flex-col gap-xs"
        :class="{ 'group is-error': isSubmittingAttempted && errors.sessionNumber }"
      >
        <label class="text-xs font-black uppercase text-content-muted tracking-widest"
          >Total Units <span class="text-error">*</span></label
        >
        <input
          type="number"
          v-model="localData.sessionNumber"
          min="1"
          class="w-full px-md py-sm border-2 border-outline-std rounded-sm bg-white text-sm font-black outline-none transition-all focus:border-primary focus:ring-[3px] focus:ring-info-soft group-[.is-error]:border-error group-[.is-error]:bg-error-soft"
        />
        <div
          v-if="isSubmittingAttempted && errors.sessionNumber"
          class="text-error text-3xs font-black px-1 mt-1 uppercase"
        >
          {{ errors.sessionNumber }}
        </div>
      </div>

      <div
        class="flex flex-col gap-xs"
        :class="{ 'group is-error': isSubmittingAttempted && errors.weeksNumber }"
      >
        <label class="text-xs font-black uppercase text-content-muted tracking-widest"
          >Term Duration <span class="text-error">*</span></label
        >
        <div class="relative">
          <input
            type="number"
            v-model="localData.weeksNumber"
            min="1"
            class="w-full px-md py-sm border-2 border-outline-std rounded-sm bg-white text-sm font-black outline-none transition-all focus:border-primary focus:ring-[3px] focus:ring-info-soft group-[.is-error]:border-error group-[.is-error]:bg-error-soft"
          />
          <span
            class="absolute right-4 top-1/2 -translate-y-1/2 text-2xs font-black uppercase text-content-muted/40"
            >Weeks</span
          >
        </div>
        <div
          v-if="isSubmittingAttempted && errors.weeksNumber"
          class="text-error text-3xs font-black px-1 mt-1 uppercase"
        >
          {{ errors.weeksNumber }}
        </div>
      </div>

      <div
        class="flex flex-col gap-xs col-span-2"
        :class="{ 'group is-error': isSubmittingAttempted && errors.maxCapacity }"
      >
        <label class="text-xs font-black uppercase text-content-muted tracking-widest"
          >Registry Limit (Defaults) <span class="text-error">*</span></label
        >
        <input
          type="number"
          v-model="localData.maxCapacity"
          min="1"
          class="w-full px-md py-sm border-2 border-outline-std rounded-sm bg-white text-sm font-black outline-none transition-all focus:border-primary focus:ring-[3px] focus:ring-info-soft group-[.is-error]:border-error group-[.is-error]:bg-error-soft"
        />
        <div
          v-if="isSubmittingAttempted && errors.maxCapacity"
          class="text-error text-3xs font-black px-1 mt-1 uppercase"
        >
          {{ errors.maxCapacity }}
        </div>
      </div>

      <div class="flex flex-col gap-xs col-span-2 mt-sm">
        <label class="text-xs font-black uppercase text-content-muted tracking-widest"
          >Description / Synopsis</label
        >
        <textarea
          v-model="localData.description"
          placeholder="A brief overview for administrative and parent reference..."
          rows="2"
          class="w-full px-md py-sm border-2 border-outline-std rounded-sm bg-white text-sm font-semibold outline-none transition-all focus:border-primary focus:ring-[3px] focus:ring-info-soft"
        ></textarea>
      </div>

      <div class="flex flex-col gap-xs col-span-2">
        <label class="text-xs font-black uppercase text-content-muted tracking-widest"
          >Program Creative</label
        >
        <div class="relative">
          <div
            v-if="localData.profileURL"
            class="flex items-center gap-md bg-surface-light p-2 rounded-sm border border-outline-std/30"
          >
            <div
              class="w-12 h-12 rounded-sm border-2 border-white shadow-sm overflow-hidden bg-white"
            >
              <img :src="localData.profileURL" alt="Preview" class="w-full h-full object-cover" />
            </div>
            <button
              type="button"
              class="text-2xs text-error font-black uppercase tracking-widest cursor-pointer bg-white border border-error/20 px-3 py-1.5 rounded-sm transition-all hover:bg-error hover:text-white"
              @click="localData.profileURL = ''"
            >
              Remove File
            </button>
          </div>
          <div v-else>
            <input
              type="file"
              @change="handleFileUpload"
              accept="image/*"
              id="program-file-upload"
              class="hidden"
            />
            <label
              for="program-file-upload"
              class="group flex items-center gap-md p-md border-2 border-dashed border-outline-std rounded-sm cursor-pointer transition-all hover:bg-primary-soft hover:border-primary"
            >
              <span class="text-2xl transition-transform group-hover:scale-110">🖼️</span>
              <div class="flex flex-col">
                <span class="text-xs font-black text-content-dark uppercase tracking-widest">{{
                  isUploading ? 'Uploading Image...' : 'Select Program Asset'
                }}</span>
                <span class="text-3xs font-bold text-content-muted italic"
                  >Recommended aspect ratio 16:9</span
                >
              </div>
            </label>
          </div>
        </div>
      </div>

      <!-- Schedule Templates -->
      <template v-if="type === 'edit'">
        <div class="col-span-2 flex items-center gap-md py-2 opacity-50 mt-sm">
          <div class="h-px bg-border flex-1"></div>
          <span class="text-3xs font-black uppercase tracking-[2px] text-content-muted"
            >Master Schedule Nodes</span
          >
          <div class="h-px bg-border flex-1"></div>
        </div>

        <div
          class="col-span-2 bg-surface-subtle border-2 border-outline-std rounded-sm p-md flex flex-col gap-md shadow-inner"
        >
          <div class="flex flex-wrap gap-sm">
            <div
              v-for="s in schedules"
              :key="s.id"
              class="group flex items-center gap-sm bg-white p-1 px-3 rounded-sm border-2 border-outline-std/50 shadow-sm transition-all hover:border-primary/30"
            >
              <span class="text-2xs font-black text-primary uppercase tracking-tighter">{{
                s.day
              }}</span>
              <span class="text-xs text-content-dark font-black tracking-tight">{{
                s.timeslot
              }}</span>
              <button
                type="button"
                class="w-5 h-5 flex items-center justify-center rounded-full bg-surface-light text-content-muted hover:bg-error hover:text-white transition-colors cursor-pointer"
                @click="handleRemoveSchedule(s.id)"
              >
                &times;
              </button>
            </div>
            <div
              v-if="schedules.length === 0"
              class="text-xs text-content-muted/40 font-bold italic py-2"
            >
              No master schedule nodes initialized for this model.
            </div>
          </div>

          <div class="flex gap-sm items-center pt-md border-t border-outline-std/20">
            <AppSelect
              v-model="newSchedule.day"
              :items="
                ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(
                  (d) => ({ id: d, name: d }),
                )
              "
              :searchable="false"
              class="w-[140px]"
            />
            <AppSelect
              v-model="newSchedule.timeslot"
              :items="
                ['08:30 - 10:00', '10:30 - 12:00', '13:30 - 15:00', '15:30 - 17:00'].map((s) => ({
                  id: s,
                  name: s,
                }))
              "
              :searchable="false"
              class="flex-1"
            />
            <AppButton
              variant="primary"
              @click="handleAddSchedule"
              :disabled="!newSchedule.timeslot"
              size="md"
              class="px-6"
              >Register Slot</AppButton
            >
          </div>
        </div>
      </template>
    </form>

    <div v-if="type === 'delete'" class="flex flex-col gap-xl mt-lg">
      <div
        class="flex items-center gap-xl p-xl bg-error-deep/5 border-2 border-dashed border-error/30 rounded-std"
      >
        <div class="text-4xl filter grayscale brightness-125">☢️</div>
        <div class="flex flex-col gap-1">
          <strong class="text-lg font-black text-error-deep tracking-tight uppercase leading-none"
            >Catalog Model Deletion</strong
          >
          <p class="text-xs text-error-deep/70 font-semibold leading-relaxed">
            This will remove the program from selection catalogs. Active classes will remain but may
            lose model synchronization.
          </p>
        </div>
      </div>
      <div class="flex flex-col gap-sm">
        <label class="text-xs font-black uppercase text-content-muted tracking-widest text-center"
          >Master Purge Confirmation</label
        >
        <div class="flex flex-col gap-xs">
          <label class="text-2xs font-black uppercase text-content-muted/40 text-center"
            >Type <span class="text-error px-1">DELETE</span> to confirm purge</label
          >
          <input
            type="text"
            v-model="localData.deleteConfirm"
            placeholder="CONFIRM CATALOG DELETE"
            class="w-full py-xl px-md border-[3px] border-outline-std rounded-std text-center font-black tracking-[4px] bg-surface-subtle text-xl outline-none transition-all focus:border-error focus:bg-white focus:ring-[8px] focus:ring-error/5 placeholder:opacity-30 placeholder:tracking-normal placeholder:font-bold"
          />
          <div
            v-if="isSubmittingAttempted && errors.deleteConfirm"
            class="text-error text-3xs font-black text-center mt-2 uppercase"
          >
            {{ errors.deleteConfirm }}
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex items-center justify-end w-full gap-md">
        <AppButton variant="cancel" @click="$emit('close')">Cancel Entry</AppButton>
        <AppButton
          :variant="type === 'delete' ? 'danger' : 'primary'"
          form="programActionForm"
          type="submit"
          @click="type === 'delete' ? handleSubmit() : null"
          :loading="loading"
          :disabled="loading"
          :class="{ 'button-disabled-visual': isFormInvalid || (type === 'edit' && !isChanged) }"
        >
          {{ submitLabel }}
        </AppButton>
      </div>
    </template>
  </AppModal>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import AppModal from '@/components/common/ui/AppModal.vue'
import AppAlert from '@/components/common/ui/AppAlert.vue'
import AppButton from '@/components/common/ui/AppButton.vue'
import AppSelect from '@/components/common/ui/AppSelect.vue'
import { getActionIcon } from '@/utils/assetHelper'
import { programService } from '@/services/programService'
import { storageService } from '@/services/storageService'

const props = defineProps({
  isOpen: Boolean,
  type: String, // 'add', 'edit', 'delete'
  program: Object,
  loading: Boolean,
  error: String,
})

const emit = defineEmits(['close', 'submit', 'update:error'])

const localData = ref({
  name: '',
  categoryId: '',
  levelId: '',
  type: 'group',
  basePrice: 0.0,
  sessionNumber: 1,
  weeksNumber: 1,
  maxCapacity: 10,
  description: '',
  profileURL: '',
  deleteConfirm: '',
})

const originalData = ref({})
const initialDataString = ref('')
const isSubmittingAttempted = ref(false)

const syncData = () => {
  if (props.type === 'edit' && props.program) {
    const data = { ...props.program, deleteConfirm: '' }
    localData.value = data
    originalData.value = { ...data }
    initialDataString.value = JSON.stringify(data)
  } else {
    localData.value = {
      name: '',
      categoryId: '',
      levelId: '',
      type: 'group',
      basePrice: 0.0,
      sessionNumber: 1,
      weeksNumber: 1,
      maxCapacity: 10,
      description: '',
      profileURL: '',
      deleteConfirm: '',
    }
    initialDataString.value = JSON.stringify(localData.value)
  }
}

watch(
  () => props.isOpen,
  (val) => {
    if (val) {
      syncData()
      isSubmittingAttempted.value = false
    }
  },
)

const errors = computed(() => {
  const d = localData.value
  const errs = {}
  if (props.type === 'delete') {
    if (d.deleteConfirm !== 'DELETE') errs.deleteConfirm = 'Invalid confirmation string'
  } else {
    if (!d.name?.trim()) errs.name = 'Label required'
    if (!d.categoryId) errs.categoryId = 'Catalog required'
    if (d.basePrice < 0) errs.basePrice = 'Negative price'
    if (d.sessionNumber < 1) errs.sessionNumber = 'Min 1 unit'
    if (d.weeksNumber < 1) errs.weeksNumber = 'Min 1 duration'
    if (d.maxCapacity < 1) errs.maxCapacity = 'Capacity error'
  }
  return errs
})

const isFormInvalid = computed(() => Object.keys(errors.value).length > 0)
const isChanged = computed(() => JSON.stringify(localData.value) !== initialDataString.value)

const categories = ref([])
const levels = ref([])
const schedules = ref([])
const newSchedule = ref({ day: 'Monday', timeslot: '' })
const isUploading = ref(false)

const sortedCategories = computed(() =>
  [...categories.value].sort((a, b) => a.name.localeCompare(b.name)),
)
const sortedLevels = computed(() => [...levels.value].sort((a, b) => a.name.localeCompare(b.name)))

const modalTitle = computed(() => {
  if (props.type === 'edit') return 'Engineer Program Model'
  if (props.type === 'delete') return 'Deconstruct Program Entry'
  return 'Initialize Program Entry'
})

const modalIcon = computed(() => {
  if (props.type === 'delete') return getActionIcon('delete')
  return getActionIcon('edit')
})

const submitLabel = computed(() => {
  if (props.type === 'edit') return 'Commit Profile'
  if (props.type === 'delete') return 'Execute Deconstruction'
  return 'Initialize Entry'
})

const fetchCategories = async () => {
  try {
    categories.value = await programService.getAllCategories()
  } catch (err) {
    console.error(err)
  }
}

const fetchLevels = async () => {
  if (!localData.value.categoryId) return
  try {
    levels.value = await programService.getLevelsByCategory(localData.value.categoryId)
  } catch (err) {
    console.error(err)
  }
}

const fetchSchedules = async () => {
  if (props.type !== 'edit' || !props.program?.id) return
  try {
    schedules.value = await programService.getProgramSchedules(props.program.id)
  } catch (err) {
    console.error(err)
  }
}

const onCategoryChange = () => {
  localData.value.levelId = ''
  fetchLevels()
}

const handleFileUpload = async (event) => {
  const file = event.target.files[0]
  if (!file) return
  isUploading.value = true
  try {
    const timestamp = Date.now()
    const path = `programs/${localData.value.name}_${timestamp}`
    const url = await storageService.uploadFile(file, path)
    localData.value.profileURL = url
  } catch (err) {
    emit('update:error', 'Upload failed. Try again.')
  } finally {
    isUploading.value = false
  }
}

const handleAddSchedule = async () => {
  if (!newSchedule.value.day || !newSchedule.value.timeslot) return
  try {
    const id = await programService.addProgramSchedule(props.program.id, newSchedule.value)
    schedules.value.unshift({ id, ...newSchedule.value })
    newSchedule.value.timeslot = ''
  } catch (err) {
    console.error(err)
  }
}

const handleRemoveSchedule = async (scheduleId) => {
  try {
    await programService.deleteProgramSchedule(props.program.id, scheduleId)
    schedules.value = schedules.value.filter((s) => s.id !== scheduleId)
  } catch (err) {
    console.error(err)
  }
}

const handleSubmit = () => {
  isSubmittingAttempted.value = true
  if (isFormInvalid.value || (props.type === 'edit' && !isChanged.value)) return
  emit('submit', { ...localData.value })
}

watch(
  () => props.isOpen,
  async (isOpen) => {
    if (isOpen) {
      await fetchCategories()
      if (localData.value.categoryId) fetchLevels()
      if (props.type === 'edit') fetchSchedules()
    }
  },
)
</script>

<style scoped>
/* Scoped styles entirely removed. Logic migrated to Tailwind utility-first naming conventions. */
</style>

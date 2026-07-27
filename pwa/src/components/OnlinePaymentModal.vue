<script setup>
import { ref, computed, watch } from 'vue'
import { parentPortalService } from '@/services/parentAuthService'
import AppBadge from '@/components/common/AppBadge.vue'
import {
  getProgramProfileURL,
  getStudentProfileURL,
  getParentProfileURL,
} from '@/utils/assetHelper'
import { formatPrice } from '@/utils/formatUtils'

const props = defineProps({
  show: { type: Boolean, default: false },
  enrollment: { type: Object, default: null },
})

const emit = defineEmits(['close', 'paid'])

const activeMethod = ref('khqr') // 'khqr', 'card', 'proof'
const enrollmentMode = ref('full') // 'full' or 'partial'
const partialSessions = ref(6)
const processing = ref(false)
const successState = ref(false)
const errorMessage = ref('')

// Card Form
const cardForm = ref({
  number: '4242 •••• •••• 4242',
  expiry: '12/28',
  cvc: '888',
  name: 'Parent Cardholder',
})

// Proof Form
const proofForm = ref({
  proofURL: 'https://placehold.co/600x800/1e293b/38bdf8?text=Bank+Transfer+Receipt',
  transactionId: '',
  remark: 'Paid via ABA Instant Transfer',
})

const totalSessions = computed(() => {
  return Number(props.enrollment?.totalSessions || 12)
})

const amountDue = computed(() => {
  const baseAmount = Number(props.enrollment?.amount || props.enrollment?.fee || 150)
  if (enrollmentMode.value === 'partial' && totalSessions.value > 0) {
    const rate = baseAmount / totalSessions.value
    return Math.max(10, Math.round(rate * partialSessions.value))
  }
  return baseAmount
})

const parentAvatarUrl = computed(() =>
  getParentProfileURL(props.enrollment?.parent?.profileURL || props.enrollment?.parentProfileURL),
)
const studentAvatarUrl = computed(() =>
  getStudentProfileURL(
    props.enrollment?.student?.profileURL || props.enrollment?.studentProfileURL,
  ),
)
const programImageUrl = computed(() =>
  getProgramProfileURL(
    props.enrollment?.profileURL || props.enrollment?.program?.profileURL,
    props.enrollment?.programName || props.enrollment?.program?.name,
  ),
)

watch(
  () => props.show,
  (newVal) => {
    if (newVal) {
      activeMethod.value = 'khqr'
      enrollmentMode.value =
        props.enrollment?.isProrated || props.enrollment?.enrolledSessions ? 'partial' : 'full'
      partialSessions.value =
        props.enrollment?.enrolledSessions || Math.max(1, Math.round(totalSessions.value / 2))
      processing.value = false
      successState.value = false
      errorMessage.value = ''
    }
  },
)

const handleInstantOnlinePay = async (methodName) => {
  if (!props.enrollment) return
  processing.value = true
  errorMessage.value = ''
  try {
    // 1. Initiate payment record with customized amount and session mode
    const initRes = await parentPortalService.initiatePayment({
      enrollmentId: props.enrollment.id,
      amount: amountDue.value,
      paymentMethod: methodName,
      enrollmentMode: enrollmentMode.value,
      enrolledSessions:
        enrollmentMode.value === 'partial' ? partialSessions.value : totalSessions.value,
      studentId: props.enrollment.studentId || props.enrollment.student?.id || '',
      classId: props.enrollment.classId || props.enrollment.class?.id || '',
    })

    const txId = initRes.transactionId || 'demo_tx_' + Date.now()

    // Simulate 1 second payment gateway processing / QR scan verification
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // 2. Verify payment & auto sync enrollment status
    await parentPortalService.verifyPayment(txId)

    successState.value = true
    setTimeout(() => {
      emit('paid', props.enrollment.id)
      emit('close')
    }, 1600)
  } catch (err) {
    console.error('Payment error:', err)
    errorMessage.value = err.message || 'Payment processing failed. Please try again.'
  } finally {
    processing.value = false
  }
}

const handleProofSubmit = async () => {
  if (!props.enrollment) return
  if (!proofForm.value.proofURL) {
    errorMessage.value = 'Please provide a receipt image or reference.'
    return
  }
  processing.value = true
  errorMessage.value = ''
  try {
    await parentPortalService.uploadPaymentProof(props.enrollment.id, {
      proofURL: proofForm.value.proofURL,
      transactionId: proofForm.value.transactionId || 'MANUAL_' + Date.now(),
      remark: proofForm.value.remark,
      amount: amountDue.value,
      enrollmentMode: enrollmentMode.value,
      enrolledSessions:
        enrollmentMode.value === 'partial' ? partialSessions.value : totalSessions.value,
    })
    successState.value = true
    setTimeout(() => {
      emit('paid', props.enrollment.id)
      emit('close')
    }, 1600)
  } catch (err) {
    console.error('Proof upload error:', err)
    errorMessage.value = err.message || 'Failed to submit proof.'
  } finally {
    processing.value = false
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="show"
        class="fixed inset-0 z-50 overflow-y-auto bg-content-deep/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      >
        <!-- Modal / Bottom Sheet Card -->
        <div
          class="w-full sm:max-w-xl bg-surface border-t sm:border border-outline-std rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh] text-content-dark animate-slide-up sm:animate-zoom-in"
        >
          <!-- Header Bar -->
          <div
            class="p-5 border-b border-outline-std flex items-center justify-between bg-surface flex-shrink-0"
          >
            <div class="flex items-center gap-3">
              <div
                class="w-10 h-10 rounded-2xl bg-success-soft flex items-center justify-center text-success-deep border border-success/20"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <h3 class="text-base font-extrabold text-content-deep">
                  Online Tuition Payment & Confirmation
                </h3>
                <p class="text-xs text-content-muted">
                  Verify enrollment configuration before final fee settlement
                </p>
              </div>
            </div>
            <button
              @click="$emit('close')"
              class="p-2 rounded-xl text-content-muted hover:text-content-deep hover:bg-surface-subtle transition-colors"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div class="p-5 overflow-y-auto space-y-5 flex-1">
            <!-- Success state -->
            <div v-if="successState" class="py-8 text-center space-y-3 animate-fade-in">
              <div
                class="w-16 h-16 bg-success-soft rounded-full flex items-center justify-center mx-auto text-success-deep border border-success/30"
              >
                <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2.5"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h4 class="text-lg font-extrabold text-content-deep">Payment Received & Verified!</h4>
              <p class="text-xs text-content-muted max-w-xs mx-auto">
                Thank you. Your transaction reference has been recorded and the seat is officially
                confirmed.
              </p>
            </div>

            <div v-else class="space-y-5">
              <!-- Full Enrollment Data Verification Card (Admin Portal Parity) -->
              <div
                class="bg-surface-subtle border border-outline-std rounded-2xl p-4 space-y-3 shadow-2xs"
              >
                <div class="flex items-center justify-between border-b border-outline-std pb-3">
                  <div class="flex items-center gap-3 min-w-0">
                    <div
                      class="w-11 h-11 rounded-2xl overflow-hidden bg-white ring-2 ring-primary/20 flex items-center justify-center flex-shrink-0"
                    >
                      <img
                        v-if="programImageUrl"
                        :src="programImageUrl"
                        alt="Program"
                        class="w-full h-full object-cover"
                        @error="$event.target.style.display = 'none'"
                      />
                      <span v-else class="text-base font-black text-primary">{{
                        (enrollment?.programName || enrollment?.program?.name || 'C')
                          .charAt(0)
                          .toUpperCase()
                      }}</span>
                    </div>
                    <div class="min-w-0">
                      <h4 class="text-sm font-extrabold text-content-deep truncate">
                        {{
                          enrollment?.programName || enrollment?.program?.name || 'Enrolled Class'
                        }}
                      </h4>
                      <p
                        class="text-[11px] font-bold text-content-muted flex items-center gap-1.5 mt-0.5"
                      >
                        <span>🗓️ {{ enrollment?.schedule || 'Regular Schedule' }}</span>
                      </p>
                    </div>
                  </div>
                  <AppBadge :branch="enrollment?.branchObj || enrollment?.branchId || 'AEON'" />
                </div>

                <!-- Student and Parent Avatars Bar -->
                <div class="flex items-center justify-between text-xs pt-1 flex-wrap gap-2">
                  <div class="flex items-center gap-2">
                    <div
                      class="w-7 h-7 rounded-full overflow-hidden bg-white ring-1 ring-emerald-500 flex-shrink-0"
                    >
                      <img
                        :src="studentAvatarUrl"
                        alt="Student"
                        class="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <span class="text-[10px] font-bold text-content-muted block leading-none"
                        >Student</span
                      >
                      <strong class="text-content-deep">{{
                        enrollment?.student?.name || enrollment?.studentName || 'Student'
                      }}</strong>
                    </div>
                  </div>
                  <div class="flex items-center gap-2">
                    <div
                      class="w-7 h-7 rounded-full overflow-hidden bg-white ring-1 ring-blue-500 flex-shrink-0"
                    >
                      <img :src="parentAvatarUrl" alt="Parent" class="w-full h-full object-cover" />
                    </div>
                    <div>
                      <span class="text-[10px] font-bold text-content-muted block leading-none"
                        >Parent</span
                      >
                      <strong class="text-content-deep">{{
                        enrollment?.parent?.name || enrollment?.parentName || 'Parent'
                      }}</strong>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Full / Partial Enrollment Option Toggle (Admin Portal Parity) -->
              <div
                class="bg-surface border border-outline-std rounded-2xl p-4 space-y-3.5 shadow-2xs"
              >
                <div class="flex items-center justify-between">
                  <span class="text-xs font-bold text-content-deep uppercase tracking-wider"
                    >Enrollment Type</span
                  >
                  <span
                    class="text-[11px] font-bold text-primary bg-primary-soft px-2.5 py-0.5 rounded-full"
                    >Adjust sessions or prorate</span
                  >
                </div>

                <div class="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    @click="enrollmentMode = 'full'"
                    :class="[
                      'py-2.5 px-3 rounded-xl text-xs font-bold border transition-all text-center flex flex-col items-center gap-0.5 cursor-pointer',
                      enrollmentMode === 'full'
                        ? 'bg-primary-soft border-primary text-primary-deep ring-2 ring-primary/20 shadow-2xs'
                        : 'bg-surface-subtle border-outline-std text-content-muted hover:text-content-dark',
                    ]"
                  >
                    <span>Full Term Enrollment</span>
                    <span class="text-[10px] font-normal opacity-80"
                      >{{ totalSessions }} Sessions (${{
                        formatPrice(enrollment?.amount || 150)
                      }})</span
                    >
                  </button>
                  <button
                    type="button"
                    @click="enrollmentMode = 'partial'"
                    :class="[
                      'py-2.5 px-3 rounded-xl text-xs font-bold border transition-all text-center flex flex-col items-center gap-0.5 cursor-pointer',
                      enrollmentMode === 'partial'
                        ? 'bg-purple-soft border-purple text-purple-deep ring-2 ring-purple/20 shadow-2xs'
                        : 'bg-surface-subtle border-outline-std text-content-muted hover:text-content-dark',
                    ]"
                  >
                    <span>Partial / Prorated</span>
                    <span class="text-[10px] font-normal opacity-80">Custom session range</span>
                  </button>
                </div>

                <!-- Partial Session Selector -->
                <div
                  v-if="enrollmentMode === 'partial'"
                  class="pt-2 border-t border-outline-std space-y-2 animate-fade-in"
                >
                  <div class="flex items-center justify-between text-xs">
                    <span class="font-bold text-content-muted">Number of Sessions to Enroll:</span>
                    <span class="font-extrabold text-purple-deep"
                      >{{ partialSessions }} of {{ totalSessions }} sessions</span
                    >
                  </div>
                  <input
                    type="range"
                    v-model.number="partialSessions"
                    min="1"
                    :max="totalSessions"
                    class="w-full accent-purple h-2 bg-surface-subtle rounded-lg cursor-pointer"
                  />
                  <div class="flex justify-between text-[10px] font-bold text-content-muted">
                    <span>1 session</span>
                    <span>Half Term ({{ Math.round(totalSessions / 2) }})</span>
                    <span>Full ({{ totalSessions }})</span>
                  </div>
                </div>
              </div>

              <!-- Amount Banner -->
              <div class="p-4 bg-surface-subtle rounded-2xl border border-outline-std text-center">
                <span class="text-xs text-content-muted font-bold block uppercase tracking-wider"
                  >Total Amount Due</span
                >
                <span class="text-3xl font-black text-success-deep"
                  >${{ formatPrice(amountDue) }}</span
                >
                <span class="text-[11px] text-content-muted block mt-0.5">
                  {{
                    enrollmentMode === 'partial'
                      ? `Prorated fee for ${partialSessions} verified sessions`
                      : 'Includes books & digital course materials'
                  }}
                </span>
              </div>

              <!-- Tabs -->
              <div class="grid grid-cols-3 gap-2">
                <button
                  @click="activeMethod = 'khqr'"
                  :class="[
                    'py-2.5 px-3 rounded-xl text-xs font-bold border transition-all flex flex-col items-center justify-center gap-1 cursor-pointer',
                    activeMethod === 'khqr'
                      ? 'bg-primary-soft border-primary text-primary-deep shadow-2xs'
                      : 'bg-surface border-outline-std text-content-muted hover:text-content-dark',
                  ]"
                >
                  <span>KHQR / Bakong</span>
                </button>
                <button
                  @click="activeMethod = 'card'"
                  :class="[
                    'py-2.5 px-3 rounded-xl text-xs font-bold border transition-all flex flex-col items-center justify-center gap-1 cursor-pointer',
                    activeMethod === 'card'
                      ? 'bg-primary-soft border-primary text-primary-deep shadow-2xs'
                      : 'bg-surface border-outline-std text-content-muted hover:text-content-dark',
                  ]"
                >
                  <span>Credit / Debit Card</span>
                </button>
                <button
                  @click="activeMethod = 'proof'"
                  :class="[
                    'py-2.5 px-3 rounded-xl text-xs font-bold border transition-all flex flex-col items-center justify-center gap-1 cursor-pointer',
                    activeMethod === 'proof'
                      ? 'bg-primary-soft border-primary text-primary-deep shadow-2xs'
                      : 'bg-surface border-outline-std text-content-muted hover:text-content-dark',
                  ]"
                >
                  <span>Upload Receipt</span>
                </button>
              </div>

              <!-- KHQR TAB -->
              <div
                v-if="activeMethod === 'khqr'"
                class="text-center p-5 bg-surface border border-outline-std rounded-2xl shadow-inner space-y-4"
              >
                <div
                  class="w-48 h-48 bg-surface border border-outline-std rounded-2xl mx-auto flex flex-col items-center justify-center p-3 shadow-sm relative overflow-hidden"
                >
                  <div class="absolute inset-0 bg-gradient-to-tr from-error/5 to-primary/5"></div>
                  <svg
                    class="w-32 h-32 text-content-deep relative z-10"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M3 3h8v8H3V3zm2 2v4h4V5H5zm8-2h8v8h-8V3zm2 2v4h4V5h-4zM3 13h8v8H3v-8zm2 2v4h4v-4H5zm13-2h3v2h-3v-2zm-3 0h2v3h-2v-3zm3 3h3v5h-2v-3h-1v-2zm-3 3h2v2h-2v-2z"
                    />
                  </svg>
                  <span
                    class="text-[10px] font-black tracking-widest text-error-deep mt-1 relative z-10 uppercase"
                    >KHQR / Bakong</span
                  >
                </div>
                <p class="text-xs text-content-muted">
                  Open any banking app (ABA, ACLEDA, Wing) and scan QR to settle fee instantly.
                </p>
                <button
                  @click="handleInstantOnlinePay('khqr')"
                  :disabled="processing"
                  class="w-full py-3.5 px-4 bg-gradient-to-r from-success to-teal hover:from-success-deep hover:to-teal-deep text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <svg
                    v-if="processing"
                    class="animate-spin h-5 w-5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      class="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      stroke-width="4"
                    ></circle>
                    <path
                      class="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  <span>{{
                    processing
                      ? 'Confirming Transfer...'
                      : `Verify KHQR Payment ($${formatPrice(amountDue)}) →`
                  }}</span>
                </button>
              </div>

              <!-- CARD TAB -->
              <form
                v-else-if="activeMethod === 'card'"
                @submit.prevent="handleInstantOnlinePay('card')"
                class="space-y-4"
              >
                <div>
                  <label
                    class="block text-xs font-bold text-content-deep uppercase tracking-wider mb-1"
                    >Card Number</label
                  >
                  <input
                    v-model="cardForm.number"
                    type="text"
                    placeholder="4532 •••• •••• 8899"
                    class="w-full px-3.5 py-2.5 bg-surface-subtle border border-outline-std rounded-xl text-content-deep text-sm focus:outline-none focus:ring-2 focus:ring-primary font-mono"
                    required
                  />
                </div>
                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label
                      class="block text-xs font-bold text-content-deep uppercase tracking-wider mb-1"
                      >Expiry Date</label
                    >
                    <input
                      v-model="cardForm.expiry"
                      type="text"
                      placeholder="MM / YY"
                      class="w-full px-3.5 py-2.5 bg-surface-subtle border border-outline-std rounded-xl text-content-deep text-sm focus:outline-none focus:ring-2 focus:ring-primary font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label
                      class="block text-xs font-bold text-content-deep uppercase tracking-wider mb-1"
                      >CVV / CVC</label
                    >
                    <input
                      v-model="cardForm.cvc"
                      type="password"
                      placeholder="•••"
                      maxlength="4"
                      class="w-full px-3.5 py-2.5 bg-surface-subtle border border-outline-std rounded-xl text-content-deep text-sm focus:outline-none focus:ring-2 focus:ring-primary font-mono"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label
                    class="block text-xs font-bold text-content-deep uppercase tracking-wider mb-1"
                    >Cardholder Name</label
                  >
                  <input
                    v-model="cardForm.name"
                    type="text"
                    placeholder="Parent Cardholder"
                    class="w-full px-3.5 py-2.5 bg-surface-subtle border border-outline-std rounded-xl text-content-deep text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>
                <button
                  type="submit"
                  :disabled="processing"
                  class="w-full py-3.5 px-4 bg-gradient-to-r from-primary to-primary-deep text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <svg
                    v-if="processing"
                    class="animate-spin h-5 w-5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      class="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      stroke-width="4"
                    ></circle>
                    <path
                      class="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  <span>{{
                    processing ? 'Charging Card...' : `Pay $${formatPrice(amountDue)} Now`
                  }}</span>
                </button>
              </form>

              <!-- PROOF TAB -->
              <form
                v-else-if="activeMethod === 'proof'"
                @submit.prevent="handleProofSubmit"
                class="space-y-4"
              >
                <div
                  class="p-3.5 bg-surface-subtle rounded-xl border border-outline-std text-xs space-y-1.5"
                >
                  <div class="flex justify-between items-center font-bold">
                    <span class="text-content-muted">ABA Bank USD Account:</span>
                    <span class="text-primary-deep font-mono text-sm select-all">001 234 567</span>
                  </div>
                  <div class="flex justify-between items-center">
                    <span class="text-content-muted">Account Name:</span>
                    <span class="text-content-deep font-bold">AAA ACADEMY CO LTD</span>
                  </div>
                </div>

                <div class="space-y-3">
                  <div>
                    <label
                      class="block text-xs font-bold text-content-deep uppercase tracking-wider mb-1"
                      >Receipt Image URL / File Link</label
                    >
                    <input
                      v-model="proofForm.proofURL"
                      type="text"
                      placeholder="https://storage.../receipt.jpg"
                      class="w-full px-3.5 py-2.5 bg-surface-subtle border border-outline-std rounded-xl text-content-deep text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>
                  <div>
                    <label
                      class="block text-xs font-bold text-content-deep uppercase tracking-wider mb-1"
                      >Bank Transaction Ref #</label
                    >
                    <input
                      v-model="proofForm.transactionId"
                      type="text"
                      placeholder="e.g. ABA-99887766"
                      class="w-full px-3.5 py-2.5 bg-surface-subtle border border-outline-std rounded-xl text-content-deep font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label
                      class="block text-xs font-bold text-content-deep uppercase tracking-wider mb-1"
                      >Note / Remark</label
                    >
                    <input
                      v-model="proofForm.remark"
                      type="text"
                      placeholder="Transfer for term fee"
                      class="w-full px-3.5 py-2.5 bg-surface-subtle border border-outline-std rounded-xl text-content-deep text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  :disabled="processing"
                  class="w-full py-3.5 px-4 bg-gradient-to-r from-success to-teal text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <svg
                    v-if="processing"
                    class="animate-spin h-5 w-5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      class="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      stroke-width="4"
                    ></circle>
                    <path
                      class="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  <span>{{
                    processing
                      ? 'Submitting Proof...'
                      : `Submit Receipt ($${formatPrice(amountDue)})`
                  }}</span>
                </button>
              </form>

              <!-- Error feedback -->
              <div
                v-if="errorMessage"
                class="p-3 bg-error-soft border border-error/30 rounded-xl text-xs font-bold text-error-deep"
              >
                {{ errorMessage }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

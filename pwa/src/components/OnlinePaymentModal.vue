<script setup>
import { ref, watch } from 'vue'
import { parentPortalService } from '@/services/parentAuthService'

const props = defineProps({
  show: { type: Boolean, default: false },
  enrollment: { type: Object, default: null },
})

const emit = defineEmits(['close', 'paid'])

const activeMethod = ref('khqr') // 'khqr', 'card', 'proof'
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

watch(() => props.show, (newVal) => {
  if (newVal) {
    activeMethod.value = 'khqr'
    processing.value = false
    successState.value = false
    errorMessage.value = ''
  }
})

const handleInstantOnlinePay = async (methodName) => {
  if (!props.enrollment) return
  processing.value = true
  errorMessage.value = ''
  try {
    // 1. Initiate payment record
    const initRes = await parentPortalService.initiatePayment({
      enrollmentId: props.enrollment.id,
      amount: props.enrollment.amount || 150,
      paymentMethod: methodName,
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
      <div v-if="show" class="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
        <!-- Modal / Bottom Sheet Card -->
        <div class="w-full sm:max-w-lg bg-slate-900 border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-slate-100 animate-slide-up sm:animate-zoom-in">
          
          <!-- Header Bar -->
          <div class="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 class="text-base font-extrabold text-white">Online Fee Payment</h3>
                <p class="text-xs text-slate-400">Secure instant checkout for your enrollment</p>
              </div>
            </div>
            <button
              @click="emit('close')"
              class="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Enrollment Summary Box -->
          <div v-if="enrollment" class="mx-5 mt-4 p-4 rounded-2xl bg-slate-800/70 border border-slate-700/60 flex items-center justify-between">
            <div>
              <span class="text-[10px] font-bold text-sky-400 uppercase tracking-wider block mb-0.5">Enrollment Summary</span>
              <p class="text-sm font-bold text-white leading-tight">
                {{ enrollment.program?.name || enrollment.programName || 'Class Enrollment' }}
              </p>
              <p class="text-xs text-slate-400 mt-0.5">
                Student: <strong class="text-slate-200">{{ enrollment.student?.name || enrollment.studentName || 'Your Child' }}</strong>
              </p>
            </div>
            <div class="text-right">
              <span class="text-[10px] font-bold text-slate-400 uppercase block">Total Due</span>
              <span class="text-xl font-black text-emerald-400">${{ enrollment.amount || 150 }}</span>
            </div>
          </div>

          <!-- Success Animation Overlay -->
          <div v-if="successState" class="p-12 text-center flex flex-col items-center justify-center flex-1 animate-fade-in">
            <div class="w-20 h-20 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mb-4 border border-emerald-500/40 shadow-lg shadow-emerald-500/20">
              <svg class="w-10 h-10 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h4 class="text-xl font-extrabold text-white">Payment Verified!</h4>
            <p class="text-sm text-slate-300 mt-1">Your child's class seat has been officially confirmed and updated.</p>
          </div>

          <!-- Payment Methods Tabs & Content -->
          <div v-else class="p-5 overflow-y-auto flex-1 space-y-5">
            <!-- Tabs Switcher -->
            <div class="grid grid-cols-3 p-1 bg-slate-800 rounded-xl border border-slate-700/80 text-xs font-bold">
              <button
                @click="activeMethod = 'khqr'; errorMessage = ''"
                :class="[
                  'py-2 rounded-lg transition-all flex items-center justify-center gap-1.5',
                  activeMethod === 'khqr' ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
                ]"
              >
                <span class="font-extrabold tracking-tight">KHQR</span>
                <span class="hidden xs:inline">Instant</span>
              </button>

              <button
                @click="activeMethod = 'card'; errorMessage = ''"
                :class="[
                  'py-2 rounded-lg transition-all flex items-center justify-center gap-1.5',
                  activeMethod === 'card' ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
                ]"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                <span>Card</span>
              </button>

              <button
                @click="activeMethod = 'proof'; errorMessage = ''"
                :class="[
                  'py-2 rounded-lg transition-all flex items-center justify-center gap-1.5',
                  activeMethod === 'proof' ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
                ]"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                <span>Transfer</span>
              </button>
            </div>

            <!-- TAB 1: KHQR Bakong Scan -->
            <div v-if="activeMethod === 'khqr'" class="flex flex-col items-center text-center space-y-4 pt-1">
              <div class="relative p-4 bg-white rounded-3xl shadow-xl border-4 border-red-500/80">
                <!-- Bakong Logo Badge -->
                <div class="absolute -top-3 left-1/2 -translate-x-1/2 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest px-3 py-0.5 rounded-full shadow">
                  Bakong KHQR
                </div>
                <!-- Dynamic QR Simulation -->
                <div class="w-48 h-48 bg-slate-100 rounded-2xl flex flex-col items-center justify-center border-2 border-dashed border-slate-300 relative overflow-hidden">
                  <!-- QR Grid pattern -->
                  <div class="grid grid-cols-5 gap-1.5 w-36 h-36 opacity-90">
                    <div class="bg-slate-900 col-span-2 row-span-2 rounded-lg border-2 border-white"></div>
                    <div class="bg-red-600 rounded"></div>
                    <div class="bg-slate-900 col-span-2 row-span-2 rounded-lg border-2 border-white"></div>
                    <div class="bg-slate-900 rounded"></div>
                    <div class="bg-slate-900 col-span-3 rounded"></div>
                    <div class="bg-slate-900 col-span-2 row-span-2 rounded-lg border-2 border-white"></div>
                    <div class="bg-red-600 col-span-2 rounded"></div>
                    <div class="bg-slate-900 rounded"></div>
                  </div>
                  <!-- Animated Scan Line -->
                  <div class="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent shadow-md shadow-red-500/50 animate-pulse top-1/2"></div>
                </div>
                <div class="mt-2.5 text-center">
                  <span class="text-xs font-black text-slate-800">AAA ACADEMY CO., LTD</span>
                  <p class="text-[11px] font-bold text-red-600 mt-0.5">USD ${{ enrollment ? enrollment.amount || 150 : 150 }}.00</p>
                </div>
              </div>

              <!-- Live Status Check Indicator -->
              <div class="flex items-center gap-2 text-xs font-bold text-slate-300 bg-slate-800/80 px-4 py-2 rounded-full border border-slate-700">
                <span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span>Waiting for mobile banking QR scan...</span>
              </div>

              <p class="text-xs text-slate-400 max-w-xs leading-relaxed">
                Open your <strong class="text-white">ABA Mobile</strong>, <strong class="text-white">Bakong</strong>, or any banking app to scan and pay instantly.
              </p>

              <!-- Simulation button -->
              <button
                @click="handleInstantOnlinePay('khqr')"
                :disabled="processing"
                class="w-full py-3.5 px-4 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold rounded-2xl shadow-lg shadow-red-500/25 transition-all transform active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <svg v-if="processing" class="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>{{ processing ? 'Verifying KHQR Scan...' : '⚡ Simulate Successful KHQR Scan' }}</span>
              </button>
            </div>

            <!-- TAB 2: Credit / Debit Card -->
            <form v-else-if="activeMethod === 'card'" @submit.prevent="handleInstantOnlinePay('card')" class="space-y-4">
              <div class="p-4 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/80 shadow-inner space-y-3">
                <div>
                  <label class="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Cardholder Name</label>
                  <input
                    v-model="cardForm.name"
                    type="text"
                    class="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                    required
                  />
                </div>
                <div>
                  <label class="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Card Number</label>
                  <div class="relative">
                    <input
                      v-model="cardForm.number"
                      type="text"
                      class="w-full pl-3.5 pr-12 py-2.5 bg-slate-950/80 border border-slate-700 rounded-xl text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                      required
                    />
                    <div class="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
                      <span class="w-6 h-4 bg-blue-600 rounded text-[9px] font-black text-white flex items-center justify-center">VISA</span>
                    </div>
                  </div>
                </div>
                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Expiry Date</label>
                    <input
                      v-model="cardForm.expiry"
                      type="text"
                      class="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-700 rounded-xl text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                      required
                    />
                  </div>
                  <div>
                    <label class="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">CVC / Security</label>
                    <input
                      v-model="cardForm.cvc"
                      type="text"
                      class="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-700 rounded-xl text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                      required
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                :disabled="processing"
                class="w-full py-3.5 px-4 bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold rounded-2xl shadow-lg shadow-sky-500/25 transition-all transform active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <svg v-if="processing" class="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>{{ processing ? 'Charging Card & Verifying...' : `Pay $${enrollment ? enrollment.amount || 150 : 150}.00 Now` }}</span>
              </button>
            </form>

            <!-- TAB 3: Upload Receipt / Transfer Proof -->
            <form v-else-if="activeMethod === 'proof'" @submit.prevent="handleProofSubmit" class="space-y-4">
              <!-- Bank details box -->
              <div class="p-3.5 bg-slate-800 rounded-xl border border-slate-700 text-xs space-y-1.5">
                <div class="flex justify-between items-center font-bold">
                  <span class="text-slate-400">ABA Bank USD Account:</span>
                  <span class="text-sky-400 font-mono text-sm select-all">001 234 567</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-slate-400">Account Name:</span>
                  <span class="text-white font-bold">AAA ACADEMY CO LTD</span>
                </div>
              </div>

              <div class="space-y-3">
                <div>
                  <label class="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Receipt Image URL / File Link</label>
                  <input
                    v-model="proofForm.proofURL"
                    type="text"
                    placeholder="https://storage.../receipt.jpg"
                    class="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                  <p class="text-[11px] text-slate-400 mt-1">Simulated Cloud Storage link for uploaded transfer receipt.</p>
                </div>
                <div>
                  <label class="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Bank Transaction Ref # (Optional)</label>
                  <input
                    v-model="proofForm.transactionId"
                    type="text"
                    placeholder="e.g. ABA-99887766"
                    class="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label class="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Note / Remark</label>
                  <input
                    v-model="proofForm.remark"
                    type="text"
                    placeholder="Transfer for term fee"
                    class="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                :disabled="processing"
                class="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-2xl shadow-lg shadow-emerald-500/25 transition-all transform active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <svg v-if="processing" class="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>{{ processing ? 'Submitting Proof...' : 'Submit Receipt for Verification' }}</span>
              </button>
            </form>

            <!-- Error message feedback -->
            <div v-if="errorMessage" class="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs font-medium text-red-400">
              {{ errorMessage }}
            </div>
          </div>

        </div>
      </div>
    </Transition>
  </Teleport>
</template>

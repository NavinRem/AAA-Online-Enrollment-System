<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import AppInput from '@/components/common/ui/AppInput.vue'
import AppAlert from '@/components/common/ui/AppAlert.vue'
import AppBadge from '@/components/common/ui/AppBadge.vue'
import { getActionIcon } from '@/utils/assetHelper'
import { formatPrice } from '@/utils/formatUtils'

const props = defineProps({
  form: { type: Object, required: true },
  displaySummary: { type: Object, default: null },
  errors: { type: Object, default: () => ({}) },
  shaking: { type: Object, default: () => ({}) },
})

const emit = defineEmits(['update:form', 'clear-error'])

const updateForm = (field, value) => {
  emit('update:form', { ...props.form, [field]: value })
}

// KHQR Live Checkout Timer
const timeLeft = ref(900) // 15 minutes
const timerInterval = ref(null)

const formattedTimer = computed(() => {
  const m = Math.floor(timeLeft.value / 60)
    .toString()
    .padStart(2, '0')
  const s = (timeLeft.value % 60).toString().padStart(2, '0')
  return `${m}:${s}`
})

// Live Test & Custom KHQR Override
const customQrUrl = ref(localStorage.getItem('custom_khqr_demo_img') || '')
const isOneDollarDemo = ref(localStorage.getItem('custom_khqr_one_dollar') === 'true')
const qrFileInputRef = ref(null)

const activeQrImage = computed(() => {
  return customQrUrl.value || '/images/khqr-demo.svg'
})

const activeDisplayAmount = computed(() => {
  if (isOneDollarDemo.value) return 1.0
  return props.displaySummary?.amount || 0
})

const handleQrFileUpload = (e) => {
  const file = e.target.files?.[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (event) => {
      customQrUrl.value = event.target.result
      try {
        localStorage.setItem('custom_khqr_demo_img', event.target.result)
      } catch (err) {
        console.warn('Could not save custom QR to localStorage', err)
      }
    }
    reader.readAsDataURL(file)
  }
}

const toggleOneDollarDemo = () => {
  isOneDollarDemo.value = !isOneDollarDemo.value
  localStorage.setItem('custom_khqr_one_dollar', String(isOneDollarDemo.value))
}

const clearCustomQr = () => {
  customQrUrl.value = ''
  localStorage.removeItem('custom_khqr_demo_img')
}

// Secret Presentation Shortcut: Ctrl+Shift+B or double click QR to silently simulate bank webhook!
const triggerBankVerificationDemo = () => {
  const realTransId = Math.floor(10000000000 + Math.random() * 90000000000).toString()
  const realReceiptId =
    'KHQR-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000)
  updateForm('transactionId', realTransId)
  updateForm('receiptId', realReceiptId)
  updateForm('isBankVerified', true)
  emit('clear-error', 'transactionId')
  emit('clear-error', 'receiptId')
}

const handleSecretShortcut = (e) => {
  if (e.ctrlKey && e.shiftKey && (e.key === 'B' || e.key === 'b')) {
    e.preventDefault()
    triggerBankVerificationDemo()
  }
}

onMounted(() => {
  timerInterval.value = setInterval(() => {
    if (timeLeft.value > 0) timeLeft.value--
  }, 1000)
  window.addEventListener('keydown', handleSecretShortcut)
})

onUnmounted(() => {
  if (timerInterval.value) clearInterval(timerInterval.value)
  window.removeEventListener('keydown', handleSecretShortcut)
})
</script>

<template>
  <div class="flex flex-col gap-lg">
    <div v-if="displaySummary" class="flex flex-col gap-lg">
      <div class="enroll-twin-card">
        <span class="enroll-section-label">Enrollment Details</span>
        <div class="enroll-info-grid">
          <div class="enroll-info-item">
            <span class="enroll-info-key">Student</span>
            <div class="flex items-center gap-2">
              <img :src="displaySummary.studentAvatar" class="w-6 h-6 rounded-full" />
              <span class="enroll-info-val">{{ displaySummary.studentName }}</span>
            </div>
          </div>
          <div class="enroll-info-item">
            <span class="enroll-info-key">Parent</span>
            <div class="flex items-center gap-2">
              <img :src="displaySummary.parentAvatar" class="w-6 h-6 rounded-full" />
              <span class="enroll-info-val">{{ displaySummary.parentName }}</span>
            </div>
          </div>
          <div class="enroll-info-item">
            <span class="enroll-info-key">Program</span>
            <div class="flex items-center gap-2">
              <img :src="displaySummary.programAvatar" class="w-6 h-6 rounded-full" />
              <span class="enroll-info-val">{{ displaySummary.programName }}</span>
            </div>
          </div>
          <div class="enroll-info-item">
            <span class="enroll-info-key">Schedule</span>
            <span class="enroll-info-val text-primary font-bold">
              {{ displaySummary.scheduleDay }} ({{ displaySummary.scheduleTime }})
            </span>
          </div>
          <div class="enroll-info-item col-span-2">
            <span class="enroll-info-key">Branch</span>
            <AppBadge :status="displaySummary.branchAbbr" :type="displaySummary.branchColor" />
          </div>
        </div>
      </div>

      <div class="enroll-twin-card">
        <span class="enroll-section-label">Payment Summary</span>
        <div class="enroll-info-grid">
          <div class="enroll-info-item col-span-2 mt-2">
            <div class="ui-summary-card">
              <div class="ui-summary-content">
                <span class="ui-summary-label text-white font-bold text-lg">Total Amount Due</span>
                <div class="enroll-tuition-savings flex gap-2 mt-1">
                  <AppBadge :status="displaySummary.mode || displaySummary.status" />
                </div>
              </div>
              <span class="ui-summary-amount"> ${{ formatPrice(displaySummary.amount) }} </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <AppAlert type="warning" class="mt-md">
      <div class="flex flex-col gap-0.5">
        <strong class="text-sm font-bold tracking-tight">Final Verification Required</strong>
        <span class="text-sm opacity-90 font-medium"
          >By confirming, you verify that the payment proof matches the tuition amount. This action
          is irreversible.</span
        >
      </div>
    </AppAlert>

    <div class="flex flex-col gap-xs mt-lg">
      <label class="text-sm font-bold text-content-muted">Payment Channel Selection</label>
      <div
        class="flex items-center gap-2 p-2 bg-white rounded-2xl border border-outline-std mt-1 w-fit"
      >
        <button
          type="button"
          @click="updateForm('paymentMethod', 'online')"
          class="py-2 px-5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all duration-300 border border-transparent"
          :class="
            form.paymentMethod === 'online'
              ? 'bg-primary text-white shadow-md ring-1 ring-black/5'
              : 'text-content-muted hover:text-content-dark hover:bg-surface-subtle/50'
          "
        >
          <img
            :src="getActionIcon('pay')"
            class="w-4 h-4"
            :class="{ 'brightness-200': form.paymentMethod === 'online' }"
          />
          Online / Bank
        </button>
        <button
          type="button"
          @click="updateForm('paymentMethod', 'cash')"
          class="py-2 px-5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all duration-300 border border-transparent"
          :class="
            form.paymentMethod === 'cash'
              ? 'bg-primary text-white shadow-md ring-1 ring-black/5'
              : 'text-content-muted hover:text-content-dark hover:bg-surface-subtle/50'
          "
        >
          <img
            :src="getActionIcon('cash')"
            class="w-4 h-4"
            :class="{ 'brightness-200': form.paymentMethod === 'cash' }"
          />
          Cash Payment
        </button>
      </div>
    </div>

    <!-- PRODUCTION BAKONG KHQR CHECKOUT CARD -->
    <div
      v-if="form.paymentMethod === 'online' && !form.isBankVerified"
      class="flex flex-col items-center justify-center p-6 bg-white border border-outline-std rounded-3xl shadow-md my-2 gap-4 relative overflow-hidden transition-all"
    >
      <!-- Bakong Header Bar -->
      <div class="w-full flex items-center justify-between border-b border-outline-std/50 pb-3">
        <div class="flex items-center gap-2">
          <span
            class="px-3 py-1 bg-rose-600 text-white font-extrabold text-xs rounded-full tracking-wider uppercase shadow-xs"
            >Bakong KHQR</span
          >
          <span class="text-sm font-bold text-content-dark">Universal Bank Scan</span>
        </div>
        <!-- Live 15-Minute Countdown Timer -->
        <div
          class="flex items-center gap-1.5 bg-rose-50 text-rose-700 px-3 py-1 rounded-full text-xs font-mono font-bold"
        >
          <span>⏱️ Expire in:</span>
          <span>{{ formattedTimer }}</span>
        </div>
      </div>

      <!-- Real KHQR Upload & $1 Test Toggle Toolbar -->
      <div
        class="w-full flex flex-wrap items-center justify-between gap-2 p-2.5 bg-surface-subtle/80 rounded-xl border border-outline-std/40 text-xs"
      >
        <div class="flex items-center gap-1.5">
          <input
            type="file"
            ref="qrFileInputRef"
            @change="handleQrFileUpload"
            accept="image/*"
            class="hidden"
          />
          <button
            type="button"
            @click="qrFileInputRef?.click()"
            class="px-2.5 py-1 bg-white border border-outline-std rounded-lg font-bold text-content-dark hover:bg-primary/5 transition-all flex items-center gap-1 shadow-2xs"
            title="Upload your real ABA or Bakong KHQR screenshot"
          >
            <span>📁 Use My Real KHQR</span>
          </button>
          <button
            v-if="customQrUrl"
            type="button"
            @click="clearCustomQr"
            class="text-2xs text-rose-600 font-bold hover:underline px-1"
          >
            [Reset]
          </button>
        </div>
        <button
          type="button"
          @click="toggleOneDollarDemo"
          class="px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 shadow-2xs border"
          :class="
            isOneDollarDemo
              ? 'bg-emerald-600 text-white border-emerald-700'
              : 'bg-white text-content-dark border-outline-std hover:bg-surface-subtle'
          "
          title="Switch between actual tuition fee and $1.00 test payment"
        >
          <span
            >💵 $1.00 Test Mode: <strong>{{ isOneDollarDemo ? 'ON' : 'OFF' }}</strong></span
          >
        </button>
      </div>

      <!-- QR Code Image & Scannable Area -->
      <div
        @dblclick="triggerBankVerificationDemo"
        class="p-4 bg-white rounded-2xl shadow-inner border-2 border-primary/20 relative group my-1 cursor-pointer transition-transform hover:scale-102"
        title="Double-click or press Ctrl+Shift+B to simulate Bank Webhook confirmation during demo"
      >
        <img :src="activeQrImage" alt="Bakong KHQR" class="w-48 h-48 object-contain" />
        <div
          class="absolute inset-0 flex items-center justify-center bg-white/90 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-xl"
        >
          <span
            class="text-xs font-bold text-primary px-3 py-1.5 bg-surface-subtle rounded-full shadow-sm text-center"
            >Scan with ABA / ACLEDA / Wing<br /><span
              class="text-2xs text-content-muted font-normal block mt-0.5"
              >(Double-click to simulate Bank API)</span
            ></span
          >
        </div>
      </div>

      <!-- Amount Display -->
      <div class="text-center w-full bg-surface-subtle p-3 rounded-2xl">
        <span class="text-xs font-bold text-content-muted block uppercase tracking-wider"
          >Total Tuition Payable</span
        >
        <div class="flex items-center justify-center gap-2">
          <span class="text-3xl font-black text-primary"
            >${{ formatPrice(activeDisplayAmount) }}</span
          >
          <span
            v-if="isOneDollarDemo"
            class="text-2xs font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse"
          >
            Live $1 Demo
          </span>
        </div>
      </div>

      <!-- Live Status Polling & Demo Webhook Trigger -->
      <div
        class="w-full flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-outline-std/50"
      >
        <div
          class="flex items-center gap-2 text-xs font-bold text-amber-700 bg-amber-50 px-3.5 py-1.5 rounded-full border border-amber-200 animate-pulse"
        >
          <span class="w-2 h-2 rounded-full bg-amber-500"></span>
          <span>Waiting for Bank Webhook...</span>
        </div>

        <button
          type="button"
          @click="triggerBankVerificationDemo"
          class="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-black rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 transform active:scale-95"
          title="Click to simulate real-time bank API webhook arriving from Bakong / ABA Bank"
        >
          <span>⚡ Simulate Bank Webhook Verification</span>
        </button>
      </div>
    </div>

    <!-- VERIFIED SUCCESS STATE (Appears automatically when Bank Webhook triggers!) -->
    <div
      v-else-if="form.paymentMethod === 'online' && form.isBankVerified"
      class="w-full p-5 bg-emerald-50/80 border-2 border-emerald-400/80 rounded-3xl flex items-center justify-between shadow-md my-2 transition-all animate-fade-in"
    >
      <div class="flex items-center gap-3.5">
        <div
          class="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black text-lg shadow-sm"
        >
          ✓
        </div>
        <div class="flex flex-col">
          <span class="text-sm font-black text-emerald-950 tracking-tight"
            >Payment Verified by Bank Webhook!</span
          >
          <span class="text-xs text-emerald-700 font-medium"
            >KHQR Online Transfer • Trans Ref:
            <strong class="font-mono font-bold">{{ form.transactionId }}</strong></span
          >
        </div>
      </div>
      <AppBadge status="VERIFIED PAID" type="success" />
    </div>

    <div class="ui-form-grid mt-md">
      <AppInput
        :modelValue="form.receiptId"
        @update:modelValue="updateForm('receiptId', $event)"
        :label="form.paymentMethod === 'online' ? 'KHQR Receipt ID' : 'Cash Receipt ID'"
        :placeholder="form.paymentMethod === 'online' ? 'e.g. KHQR-2026-8192' : 'e.g. REC-001'"
        required
        :error="errors.receiptId"
        :shake="shaking.receiptId"
        :class="form.paymentMethod === 'online' ? '' : 'col-span-2'"
        @input="$emit('clear-error', 'receiptId')"
      />

      <AppInput
        v-if="form.paymentMethod === 'online'"
        :modelValue="form.transactionId"
        @update:modelValue="updateForm('transactionId', $event)"
        label="Bank Transaction Ref"
        placeholder="e.g. 82910391823 (11 digits)"
        required
        :error="errors.transactionId"
        :shake="shaking.transactionId"
        @input="$emit('clear-error', 'transactionId')"
      />
    </div>

    <AppInput
      :modelValue="form.remark"
      @update:modelValue="updateForm('remark', $event)"
      type="textarea"
      label="Internal Processing Remarks"
      placeholder="Add any specific notes for audit trailing..."
      :error="errors.remark"
      :shake="shaking.remark"
      @input="$emit('clear-error', 'remark')"
    />
  </div>
</template>

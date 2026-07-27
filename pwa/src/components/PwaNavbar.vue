<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { parentAuthService, parentPortalService } from '@/services/parentAuthService'
import { useStudentStore } from '@/stores/studentStore'

const router = useRouter()
const route = useRoute()
const { currentUser } = useAuth()
const studentStore = useStudentStore()
const showProfileMenu = ref(false)
const showProfileModal = ref(false)
const parentProfile = ref(null)

onMounted(async () => {
  try {
    const p = await parentPortalService.getMyProfile()
    if (p) parentProfile.value = p
  } catch (err) {
    console.warn('Could not fetch parent profile details:', err)
  }
})

const handleLogout = async () => {
  try {
    await parentAuthService.logout()
    showProfileMenu.value = false
    router.push({ name: 'Login' })
  } catch (err) {
    console.error('Logout error:', err)
  }
}

const getPerformancePath = () => {
  const sId = studentStore.selectedStudentId || studentStore.selectedStudent?.id
  return sId ? `/performance/${sId}` : '/performance'
}

const getAttendancePath = () => {
  const sId = studentStore.selectedStudentId || studentStore.selectedStudent?.id
  return sId ? `/attendance/${sId}` : '/attendance'
}
</script>

<template>
  <!-- Top Mobile App Header -->
  <header
    class="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#e2e8f0] px-4 py-3 flex items-center justify-between shadow-sm"
  >
    <RouterLink to="/" class="flex items-center gap-2.5 group">
      <div
        class="w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center p-0.5 bg-[#f0f9ff] border border-[#0ea5e9]/20 shadow-sm group-hover:scale-105 transition-transform"
      >
        <img
          src="/src/assets/images/common/logo-main.png"
          alt="AAA Academy Logo"
          class="w-full h-full object-contain"
        />
      </div>
      <div>
        <div class="flex items-center gap-1.5">
          <span class="text-base font-extrabold tracking-tight text-[#0f172a]">AAA Academy</span>
          <span
            class="text-[9px] uppercase tracking-wider font-extrabold text-[#0284c7] bg-[#f0f9ff] px-1.5 py-0.5 rounded border border-[#0ea5e9]/30"
            >Portal</span
          >
        </div>
        <p class="text-[10px] font-bold text-[#64748b] -mt-0.5">Parent Mobile Dashboard</p>
      </div>
    </RouterLink>

    <!-- User Profile Pill & Trigger -->
    <div class="relative">
      <button
        @click="showProfileMenu = !showProfileMenu"
        class="flex items-center gap-2 px-3 py-1.5 bg-[#f8fafc] hover:bg-[#f1f5f9] border border-[#e2e8f0] rounded-full transition-colors text-xs font-bold text-[#334155] shadow-sm active:scale-95"
      >
        <div
          class="w-5 h-5 rounded-full bg-gradient-to-tr from-[#0ea5e9] to-[#0284c7] flex items-center justify-center text-[10px] font-extrabold text-white uppercase shadow-inner"
        >
          {{
            parentProfile?.name
              ? parentProfile.name.charAt(0)
              : currentUser?.email
                ? currentUser.email.charAt(0)
                : 'P'
          }}
        </div>
        <span class="max-w-[100px] truncate font-extrabold text-[#0f172a]">
          {{
            parentProfile?.name || (currentUser?.email ? currentUser.email.split('@')[0] : 'Parent')
          }}
        </span>
        <svg
          class="w-3.5 h-3.5 text-[#64748b]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2.5"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      <!-- Profile Dropdown Menu -->
      <div
        v-if="showProfileMenu"
        class="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-[#e2e8f0] p-2.5 z-50 animate-fade-in"
      >
        <div class="px-3 py-2 border-b border-[#e2e8f0] mb-1.5">
          <p class="text-[10px] uppercase tracking-wider text-[#64748b] font-bold">
            Authorized Account
          </p>
          <p class="text-xs font-extrabold text-[#0f172a] truncate mt-0.5">
            {{ parentProfile?.email || currentUser?.email || 'Registered Parent' }}
          </p>
          <span
            class="inline-block mt-1 text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md"
          >
            ● Parent Access Verified
          </span>
        </div>

        <button
          @click="
            showProfileMenu = false
            showProfileModal = true
          "
          class="w-full flex items-center gap-2 px-3 py-2 text-xs font-extrabold text-[#0f172a] hover:bg-[#f8fafc] rounded-xl transition-colors text-left"
        >
          <svg class="w-4 h-4 text-[#0ea5e9]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
          <span>View Parent Profile</span>
        </button>

        <RouterLink
          to="/enroll"
          @click="showProfileMenu = false"
          class="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-[#334155] hover:bg-[#f8fafc] rounded-xl transition-colors text-left"
        >
          <svg class="w-4 h-4 text-[#0ea5e9]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
          <span>Self-Enroll Child</span>
        </RouterLink>

        <button
          @click="handleLogout"
          class="w-full flex items-center gap-2 px-3 py-2 text-xs font-extrabold text-red-600 hover:bg-red-50 rounded-xl transition-colors text-left mt-1"
        >
          <svg class="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2.5"
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
          Sign Out of Portal
        </button>
      </div>
    </div>
  </header>

  <!-- Parent Profile Modal -->
  <div
    v-if="showProfileModal"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in"
  >
    <div
      class="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-[#e2e8f0] overflow-hidden flex flex-col max-h-[90vh]"
    >
      <!-- Header -->
      <div
        class="px-6 py-4 bg-gradient-to-r from-[#0f172a] to-[#1e293b] text-white flex items-center justify-between"
      >
        <div class="flex items-center gap-3">
          <div
            class="w-10 h-10 rounded-full bg-[#0ea5e9] flex items-center justify-center font-black text-sm text-white shadow-md"
          >
            {{
              parentProfile?.name
                ? parentProfile.name.charAt(0)
                : currentUser?.email
                  ? currentUser.email.charAt(0)
                  : 'P'
            }}
          </div>
          <div>
            <h3 class="text-base font-extrabold leading-tight">
              {{ parentProfile?.name || 'Authorized Parent' }}
            </h3>
            <p class="text-[11px] text-[#94a3b8] font-bold">AAA Academy Mobile Profile</p>
          </div>
        </div>
        <button
          @click="showProfileModal = false"
          class="p-1.5 rounded-xl hover:bg-white/10 text-white transition-colors"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2.5"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <!-- Body content -->
      <div class="p-6 overflow-y-auto space-y-5">
        <div class="bg-[#f8fafc] border border-[#e2e8f0] rounded-2xl p-4 space-y-3">
          <div class="flex justify-between items-center pb-2 border-b border-[#e2e8f0]">
            <span class="text-xs font-bold text-[#64748b]">Account Verification</span>
            <span
              class="text-[11px] font-extrabold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full"
              >✓ Verified Status</span
            >
          </div>
          <div>
            <span class="text-[10px] font-bold text-[#64748b] uppercase block"
              >Registered Email</span
            >
            <span class="text-xs font-extrabold text-[#0f172a]">{{
              parentProfile?.email || currentUser?.email || 'N/A'
            }}</span>
          </div>
          <div>
            <span class="text-[10px] font-bold text-[#64748b] uppercase block"
              >Primary Phone Number</span
            >
            <span class="text-xs font-extrabold text-[#0f172a]">{{
              parentProfile?.phone || parentProfile?.telegramHandle || 'Contact Admin to add phone'
            }}</span>
          </div>
        </div>

        <div>
          <h4
            class="text-xs font-extrabold uppercase tracking-wider text-[#64748b] mb-2.5 flex items-center justify-between"
          >
            <span>Linked Student Profiles</span>
            <span
              class="text-[#0284c7] font-black bg-[#f0f9ff] px-2 py-0.5 rounded border border-[#0ea5e9]/20"
              >{{ studentStore.children.length }}</span
            >
          </h4>
          <div
            v-if="studentStore.children.length === 0"
            class="text-center py-4 bg-[#f8fafc] rounded-xl border border-[#e2e8f0] text-xs text-[#64748b] font-bold"
          >
            No children linked yet. You can self-enroll your child anytime!
          </div>
          <div v-else class="space-y-2">
            <div
              v-for="child in studentStore.children"
              :key="child.id"
              class="flex items-center justify-between p-3 bg-white rounded-xl border border-[#e2e8f0] shadow-2xs"
            >
              <div class="flex items-center gap-2.5">
                <div
                  class="w-8 h-8 rounded-lg bg-[#f0f9ff] text-[#0284c7] border border-[#0ea5e9]/30 flex items-center justify-center font-extrabold text-xs"
                >
                  {{ child.name ? child.name.charAt(0) : 'S' }}
                </div>
                <div>
                  <div class="text-xs font-extrabold text-[#0f172a]">{{ child.name }}</div>
                  <div class="text-[10px] text-[#64748b] font-bold">
                    {{ child.programName || child.level || 'Student' }}
                  </div>
                </div>
              </div>
              <span
                class="text-[10px] font-extrabold bg-[#f8fafc] border border-[#e2e8f0] px-2 py-0.5 rounded text-[#334155] uppercase"
                >{{ child.branchId || 'Studio' }}</span
              >
            </div>
          </div>
        </div>

        <div
          class="p-3.5 bg-[#f0f9ff] border border-[#0ea5e9]/20 rounded-2xl text-xs text-[#0369a1] space-y-1"
        >
          <div class="font-extrabold flex items-center gap-1.5">
            <svg
              class="w-4 h-4 text-[#0ea5e9]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>Admin Data Governance</span>
          </div>
          <p class="text-[11px] leading-relaxed">
            While you can initiate class enrollments and upload payment proofs online, all account
            updates, child profile links, and payment verifications are validated and secured under
            administration governance.
          </p>
        </div>
      </div>

      <!-- Footer -->
      <div class="px-6 py-3.5 bg-[#f8fafc] border-t border-[#e2e8f0] flex justify-end">
        <button
          @click="showProfileModal = false"
          class="px-5 py-2 bg-[#0ea5e9] hover:bg-[#0284c7] text-white font-extrabold text-xs rounded-xl transition-all shadow-sm active:scale-95"
        >
          Close Profile
        </button>
      </div>
    </div>
  </div>

  <!-- Bottom Fixed Mobile Navigation Bar -->
  <nav
    class="fixed bottom-0 z-50 w-full max-w-lg bg-white/95 backdrop-blur-xl border-t border-[#e2e8f0] flex justify-around items-center py-2 px-1 text-xs pb-safe shadow-lg"
  >
    <RouterLink
      to="/"
      :class="[
        'flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all',
        route.path === '/'
          ? 'text-[#0284c7] font-extrabold scale-105'
          : 'text-[#64748b] hover:text-[#0f172a] font-bold',
      ]"
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2.2"
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
        />
      </svg>
      <span class="text-[10px]">Dashboard</span>
    </RouterLink>

    <RouterLink
      :to="getPerformancePath()"
      :class="[
        'flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all',
        route.path.startsWith('/performance')
          ? 'text-[#0284c7] font-extrabold scale-105'
          : 'text-[#64748b] hover:text-[#0f172a] font-bold',
      ]"
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2.2"
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        />
      </svg>
      <span class="text-[10px]">Performance</span>
    </RouterLink>

    <RouterLink
      :to="getAttendancePath()"
      :class="[
        'flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all',
        route.path.startsWith('/attendance')
          ? 'text-[#0284c7] font-extrabold scale-105'
          : 'text-[#64748b] hover:text-[#0f172a] font-bold',
      ]"
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2.2"
          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
      <span class="text-[10px]">Attendance</span>
    </RouterLink>

    <RouterLink
      to="/enrollments"
      :class="[
        'flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all',
        route.path === '/enrollments'
          ? 'text-[#0284c7] font-extrabold scale-105'
          : 'text-[#64748b] hover:text-[#0f172a] font-bold',
      ]"
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2.2"
          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
        />
      </svg>
      <span class="text-[10px]">Classes</span>
    </RouterLink>
  </nav>
</template>

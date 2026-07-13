<script setup>
import { ref, watch, computed } from 'vue'
import AppModal from '@/components/common/ui/AppModal.vue'
import AppInput from '@/components/common/ui/AppInput.vue'
import AppSelect from '@/components/common/ui/AppSelect.vue'
import AppButton from '@/components/common/ui/AppButton.vue'
import AppBadge from '@/components/common/ui/AppBadge.vue'
import AvatarSelector from '@/components/common/ui/AvatarSelector.vue'
import AppConfirmOverlay from '@/components/common/ui/AppConfirmOverlay.vue'

import {
  getAdminProfile,
  saveAdminProfile,
  syncAdminProfileWithDatabase,
} from '@/utils/adminBranchHelper'
import { adminService } from '@/services/adminService'
import { useDataStore } from '@/stores/dataStore'
import { getAvatarUrl } from '@/utils/profileHelper'
import { formatDate } from '@/utils/formatUtils'
import { resolveBranchBadgeProps } from '@/utils/badgeUtils'
import { auth } from '@/firebase'

const props = defineProps({
  isOpen: { type: Boolean, default: false },
})

const emit = defineEmits(['close', 'saved'])

const dataStore = useDataStore()

const activeMode = ref('profile') // 'profile' | 'add_admin'

const form = ref({
  id: '',
  name: '',
  email: '',
  phone: '',
  role: '',
  branch: '',
  profileURL: '',
})

const newAdminForm = ref({
  id: '',
  name: '',
  email: '',
  phone: '',
  branch: '',
  role: 'Admin',
  identityProvider: 'Google Workspace Verified',
  status: 'Active',
  profileURL: '',
  password: '',
  confirmPassword: '',
})

const creationError = ref('')

// Admin account creation (Firebase Auth + Firestore) is handled by the backend
// via POST /api/admins which uses Firebase Admin SDK to set custom claims.

const authorizedAdmins = ref([])
const loadingAdmins = ref(false)

const loadAuthorizedAdmins = async () => {
  loadingAdmins.value = true
  try {
    const list = await adminService.getAllAdmins()
    if (list && list.length > 0) {
      authorizedAdmins.value = list
    } else {
      const stored = localStorage.getItem('aaa-authorized-admins')
      if (stored) {
        authorizedAdmins.value = JSON.parse(stored)
      }
    }
  } catch (e) {
    console.warn('Failed to load admins list:', e)
  } finally {
    loadingAdmins.value = false
  }
}

const successMsg = ref('')

const isCurrentLoggedInAdmin = (adm) => {
  if (!adm) return false
  const currentUser = auth?.currentUser
  const currentId = currentUser?.uid || form.value.id
  const currentEmail = currentUser?.email || form.value.email
  if (adm.id && currentId && String(adm.id) === String(currentId)) return true
  if (adm.email && currentEmail && adm.email.toLowerCase() === currentEmail.toLowerCase())
    return true
  return false
}

// Consistent branch badge props centralized in badgeUtils
const getBranchBadgeProps = (branchIdentifier) =>
  resolveBranchBadgeProps(branchIdentifier, dataStore.branches)

// Confirmation dialog state before making changes
const confirmState = ref({
  isOpen: false,
  title: '',
  message: '',
  actionType: '',
  targetData: null,
})

const openConfirm = (actionType, title, message, targetData = null) => {
  confirmState.value = {
    isOpen: true,
    title,
    message,
    actionType,
    targetData,
  }
}

const closeConfirm = () => {
  confirmState.value.isOpen = false
}

const executeConfirmedAction = async () => {
  const { actionType, targetData } = confirmState.value
  closeConfirm()

  if (actionType === 'save_profile') {
    const saved = saveAdminProfile(form.value)
    try {
      await adminService.updateAdmin(saved.id || 'default_admin', saved)
    } catch (e) {
      console.warn('Remote Firestore update fallback:', e)
    }
    successMsg.value = 'Profile and branch updated successfully!'
    emit('saved', saved)
    setTimeout(() => {
      successMsg.value = ''
      emit('close')
    }, 1200)
  } else if (actionType === 'create_admin') {
    creationError.value = ''
    try {
      const result = await adminService.createAdmin({
        name: newAdminForm.value.name,
        email: newAdminForm.value.email,
        password: newAdminForm.value.password,
        branch: newAdminForm.value.branch,
        phone: newAdminForm.value.phone || '',
        profileURL: newAdminForm.value.profileURL || '',
        status: (newAdminForm.value.status || 'Active').toLowerCase(),
      })

      const newAdmin = {
        id: result.id,
        name: newAdminForm.value.name,
        email: newAdminForm.value.email,
        phone: newAdminForm.value.phone || '',
        branch: newAdminForm.value.branch,
        role: newAdminForm.value.role,
        identityProvider: newAdminForm.value.identityProvider,
        profileURL: newAdminForm.value.profileURL || '',
        addedAt: new Date().toISOString(),
        status: newAdminForm.value.status || 'Active',
      }

      const updatedList = [newAdmin, ...authorizedAdmins.value.filter((a) => a.id !== result.id)]
      authorizedAdmins.value = updatedList
      localStorage.setItem('aaa-authorized-admins', JSON.stringify(updatedList))

      newAdminForm.value = {
        id: '',
        name: '',
        email: '',
        phone: '',
        branch: '',
        role: 'Admin',
        identityProvider: 'Google Workspace Verified',
        status: 'Active',
        profileURL: '',
        password: '',
        confirmPassword: '',
      }

      successMsg.value = 'New administrator authorized and can now log in!'
      emit('saved', newAdmin)
      setTimeout(() => {
        successMsg.value = ''
        emit('close')
      }, 1500)
    } catch (err) {
      console.error('Failed to create admin account:', err)
      creationError.value =
        err.message?.includes('email-already-exists') ||
        err.message?.includes('email-already-in-use')
          ? 'An account with this email already exists.'
          : err.message || 'Failed to create admin account.'
    }
  } else if (actionType === 'update_admin') {
    try {
      await adminService.updateAdmin(targetData.id, targetData)
      const idx = authorizedAdmins.value.findIndex((a) => a.id === targetData.id)
      if (idx !== -1) {
        authorizedAdmins.value[idx] = { ...targetData }
      }
      localStorage.setItem('aaa-authorized-admins', JSON.stringify(authorizedAdmins.value))
      successMsg.value = 'Administrator record updated successfully!'
      setTimeout(() => {
        successMsg.value = ''
      }, 1500)
    } catch (err) {
      console.warn('Failed to update admin:', err)
    }
  } else if (actionType === 'delete_admin') {
    try {
      await adminService.deleteAdmin(targetData.id)
    } catch (err) {
      console.warn('Remote delete failed, removing locally:', err)
    }
    authorizedAdmins.value = authorizedAdmins.value.filter((adm) => adm.id !== targetData.id)
    localStorage.setItem('aaa-authorized-admins', JSON.stringify(authorizedAdmins.value))
    successMsg.value = 'Administrator account removed.'
    setTimeout(() => {
      successMsg.value = ''
    }, 1500)
  }
}

const promptSaveProfile = () => {
  openConfirm(
    'save_profile',
    'Confirm Profile Changes',
    `Are you sure you want to update your administrator profile and assigned branch to "${form.value.branch || 'None'}"?`,
  )
}

const promptCreateAdmin = () => {
  creationError.value = ''
  if (!newAdminForm.value.name || !newAdminForm.value.email || !newAdminForm.value.branch) {
    creationError.value = 'Please fill in name, email, and branch.'
    return
  }
  if (!newAdminForm.value.password || newAdminForm.value.password.length < 6) {
    creationError.value = 'Password must be at least 6 characters.'
    return
  }
  if (newAdminForm.value.password !== newAdminForm.value.confirmPassword) {
    creationError.value = 'Passwords do not match.'
    return
  }
  openConfirm(
    'create_admin',
    'Confirm Admin Authorization',
    `Are you sure you want to authorize "${newAdminForm.value.name}" (${newAdminForm.value.email}) as "${newAdminForm.value.role}" for branch "${newAdminForm.value.branch}"? A login account will be created for them.`,
  )
}

const promptDeleteAdmin = (adm) => {
  openConfirm(
    'delete_admin',
    'Confirm Removal',
    `Are you sure you want to remove administrator access for "${adm.name}" (${adm.email})?`,
    adm,
  )
}

const confirmRows = computed(() => {
  if (!confirmState.value.isOpen) return []

  if (confirmState.value.actionType === 'save_profile') {
    const branchBadge = getBranchBadgeProps(form.value.branch)
    return [
      { key: 'Name', value: form.value.name || 'N/A' },
      { key: 'Email', value: form.value.email || 'N/A' },
      { key: 'Role', value: form.value.role || 'Admin' },
      {
        key: 'Branch',
        value: branchBadge ? branchBadge.status : form.value.branch || 'None',
        badge: true,
        type: branchBadge?.type || 'blue',
      },
      { key: 'Phone', value: form.value.phone || 'N/A' },
    ]
  }

  if (confirmState.value.actionType === 'create_admin') {
    const branchBadge = getBranchBadgeProps(newAdminForm.value.branch)
    return [
      { key: 'Name', value: newAdminForm.value.name || 'N/A' },
      { key: 'Email', value: newAdminForm.value.email || 'N/A' },
      { key: 'Role', value: newAdminForm.value.role || 'Admin' },
      {
        key: 'Branch',
        value: branchBadge ? branchBadge.status : newAdminForm.value.branch || 'None',
        badge: true,
        type: branchBadge?.type || 'blue',
      },
      {
        key: 'Identity',
        value: newAdminForm.value.identityProvider || 'Verified Google Workspace',
      },
    ]
  }

  if (confirmState.value.actionType === 'delete_admin') {
    const target = confirmState.value.targetData || {}
    const branchBadge = getBranchBadgeProps(target.branch)
    return [
      { key: 'Name', value: target.name || 'N/A' },
      { key: 'Email', value: target.email || 'N/A' },
      { key: 'Role', value: target.role || 'Admin' },
      {
        key: 'Branch',
        value: branchBadge ? branchBadge.status : target.branch || 'None',
        badge: true,
        type: branchBadge?.type || 'blue',
      },
      { key: 'Action', value: 'Remove Access', valueClass: 'text-error font-bold' },
    ]
  }

  return []
})

const confirmOverlaySubmitLabel = computed(() => {
  if (confirmState.value.actionType === 'create_admin') return 'Add'
  if (confirmState.value.actionType === 'delete_admin') return 'Remove'
  return 'Save'
})

const allBranchesList = computed(() => {
  const branches = dataStore.branches || []
  return branches
    .map((b) => {
      const label = b.name || b.abbr
      return label
        ? {
            id: label,
            name: b.name || b.abbr,
            badgeStatus: b.abbr || b.name,
            type: b.color || b.badgeColor || 'blue',
          }
        : null
    })
    .filter(Boolean)
})

const accountStatusList = [
  { id: 'Active', name: 'Active', badgeStatus: 'Active', type: 'success' },
  { id: 'Inactive', name: 'Inactive', badgeStatus: 'Inactive', type: 'error' },
]

watch(
  () => props.isOpen,
  async (val) => {
    if (val) {
      activeMode.value = 'profile'
      loadAuthorizedAdmins()
      await syncAdminProfileWithDatabase()
      const current = getAdminProfile()
      const user = auth?.currentUser
      form.value = {
        id: current?.id || user?.uid || '',
        name: current?.name || user?.displayName || '',
        email: current?.email || user?.email || '',
        phone: current?.phone || '+855 12 345 678',
        role: current?.role || 'Admin',
        branch: current?.branch || '',
        profileURL: current?.profileURL || user?.photoURL || '',
      }
      successMsg.value = ''
      if (dataStore.branches.length === 0) {
        dataStore.fetchBranches()
      }
    }
  },
  { immediate: true },
)
</script>

<template>
  <AppModal
    :show="isOpen"
    title="Administrator Profile & Branch Scope"
    :success="successMsg"
    @clear-success="successMsg = ''"
    @close="emit('close')"
  >
    <div class="flex flex-col gap-6 text-sm text-content-dark">
      <!-- Top banner: Profile info on left, Switcher buttons on right (rounded-md by default) -->
      <div
        class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-md bg-surface-subtle border border-outline-std/60"
      >
        <!-- LEFT: Admin Profile Info with Active Now Green Dot on Top of Avatar -->
        <div class="flex items-center gap-3.5 min-w-0">
          <div class="relative flex-shrink-0">
            <div
              class="w-14 h-14 rounded-full overflow-hidden border-2 border-primary/20 bg-white shadow-xs"
            >
              <img :src="getAvatarUrl(form)" alt="Admin" class="w-full h-full object-cover" />
            </div>
            <!-- Green Dot indicator on top of admin avatar -->
            <span
              v-if="isCurrentLoggedInAdmin(form)"
              class="absolute top-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white shadow-xs"
              title="Online Now"
            ></span>
          </div>
          <div class="flex flex-col min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="font-bold text-sm text-content-dark truncate">{{
                form.name || 'Logged-in Admin'
              }}</span>
              <!-- Branch Badge rendered with database assigned color and abbr -->
              <AppBadge
                v-if="getBranchBadgeProps(form.branch)"
                v-bind="getBranchBadgeProps(form.branch)"
              />
              <!-- Active Now badge on profile of admin -->
              <AppBadge
                :status="isCurrentLoggedInAdmin(form) ? 'Active Now' : 'Active'"
                type="success"
              />
            </div>
            <span class="text-sm text-content-muted truncate">{{ form.email }}</span>
            <span class="text-xs text-content-muted truncate">{{ form.phone }}</span>
          </div>
        </div>

        <!-- RIGHT: Mode Switcher Button Tabs -->
        <div class="flex items-center gap-2 shrink-0 self-end sm:self-center">
          <AppButton
            type="button"
            :variant="activeMode === 'profile' ? 'primary' : 'outline'"
            size="sm"
            @click="activeMode = 'profile'"
          >
            My Profile
          </AppButton>
          <AppButton
            type="button"
            :variant="activeMode === 'add_admin' ? 'primary' : 'outline'"
            size="sm"
            @click="activeMode = 'add_admin'"
          >
            + Authorize Admin
          </AppButton>
        </div>
      </div>

      <!-- TAB 1: Logged In Admin Profile -->
      <div v-if="activeMode === 'profile'" class="flex flex-col gap-5 text-sm">
        <form @submit.prevent="promptSaveProfile" class="flex flex-col gap-5">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <!-- Admin Avatars Gallery (role='admin') -->
            <AvatarSelector
              v-model="form.profileURL"
              label="Avatar Profile"
              role="Admin"
              :uid="form.id"
            />

            <AppInput
              v-model="form.role"
              label="Role"
              placeholder="e.g. Academic Director"
              required
            />

            <AppInput
              v-model="form.name"
              label="Display Name"
              placeholder="Full Name..."
              required
            />

            <AppInput
              v-model="form.email"
              type="email"
              label="Email Account (Google Identity)"
              placeholder="admin@school.edu.kh"
              disabled
              title="Email is managed by Google Workspace / Firebase Authentication and cannot be edited directly here to preserve login integrity."
            />

            <AppSelect
              v-model="form.branch"
              label="Branch Scope"
              :items="allBranchesList"
              placeholder="Select Branch..."
              required
            />

            <AppInput v-model="form.phone" label="Phone Contact" placeholder="+855 12 345 678" />
          </div>

          <div class="flex items-center justify-end gap-3 pt-2 border-t border-outline-std/50">
            <AppButton type="button" variant="cancel" @click="emit('close')">Cancel</AppButton>
            <AppButton type="submit" variant="primary">Save Changes</AppButton>
          </div>
        </form>
      </div>

      <!-- TAB 2: Authorize New Admin with Proved Identity -->
      <div v-else class="flex flex-col gap-5 text-sm">
        <div
          class="p-3.5 rounded-md bg-blue-50/70 border border-blue-200 text-blue-900 text-sm flex flex-col gap-1"
        >
          <span class="font-bold flex items-center gap-1.5">
            <span>🛡️</span> Secure Firestore Identity Authorization
          </span>
          <span class="opacity-90">
            Authorized administrators are stored in Firestore with verified identities and scoped
            directly to their assigned branch.
          </span>
        </div>

        <form @submit.prevent="promptCreateAdmin" class="flex flex-col gap-5">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <!-- Admin Avatars Gallery (role='admin') -->
            <AvatarSelector
              v-model="newAdminForm.profileURL"
              label="Avatar Profile"
              role="Admin"
              uid="new_admin"
            />

            <AppInput
              v-model="newAdminForm.role"
              label="Permission Role"
              placeholder="e.g. Campus Admin"
              required
            />

            <AppInput
              v-model="newAdminForm.name"
              label="Admin Username"
              placeholder="Administrator User Name..."
              required
            />

            <AppInput
              v-model="newAdminForm.email"
              type="email"
              label="Verified Email"
              placeholder="staff@school.edu.kh"
              required
            />

            <AppInput
              v-model="newAdminForm.password"
              type="password"
              label="Login Password"
              placeholder="Min 6 characters"
              required
            />

            <AppInput
              v-model="newAdminForm.confirmPassword"
              type="password"
              label="Confirm Password"
              placeholder="Re-enter password"
              required
            />

            <AppSelect
              v-model="newAdminForm.branch"
              label="Assigned Branch"
              :items="allBranchesList"
              placeholder="Select Branch..."
              required
            />

            <AppInput
              v-model="newAdminForm.phone"
              label="Phone Contact"
              placeholder="+855 12 345 678"
            />

            <AppSelect
              v-model="newAdminForm.identityProvider"
              label="Identity Proof"
              :items="[
                { id: 'Google Workspace Verified', name: 'Google Workspace Verified' },
                { id: 'School SSO Identity', name: 'School SSO Identity' },
                { id: 'Official ID Proved', name: 'Official ID Proved' },
              ]"
            />

            <!-- Status dropdown with AppBadge rendering -->
            <AppSelect
              v-model="newAdminForm.status"
              label="Account Status"
              :items="accountStatusList"
            />
          </div>

          <div
            v-if="successMsg"
            class="flex items-center gap-2 p-2.5 rounded-md bg-emerald-50 text-emerald-700 text-sm font-bold"
          >
            <span>✓</span> {{ successMsg }}
          </div>

          <div
            v-if="creationError"
            class="flex items-center gap-2 p-2.5 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm font-semibold"
          >
            <span>⚠</span> {{ creationError }}
          </div>

          <div class="flex items-center justify-end gap-3 pt-2 border-t border-outline-std/50">
            <AppButton type="button" variant="cancel" @click="activeMode = 'profile'"
              >Back</AppButton
            >
            <AppButton type="submit" variant="primary">Authorize Admin</AppButton>
          </div>
        </form>

        <!-- Showing ALL admin accounts with text-sm, green dot on top of avatar for online admin, and database colored branch badge -->
        <div
          v-if="authorizedAdmins.length > 0"
          class="flex flex-col gap-3 pt-3 border-t border-outline-std/50"
        >
          <span class="text-sm font-bold text-content-dark tracking-wide"
            >All Authorized Administrators</span
          >
          <div class="max-h-60 overflow-y-auto flex flex-col gap-3 pr-1">
            <div
              v-for="adm in authorizedAdmins"
              :key="adm.id"
              class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 rounded-md bg-surface-subtle border border-outline-std/60 text-sm"
            >
              <div class="flex items-center gap-3 min-w-0">
                <div class="relative shrink-0">
                  <div
                    class="w-10 h-10 rounded-full overflow-hidden border border-outline-std bg-white shadow-2xs"
                  >
                    <img :src="getAvatarUrl(adm)" alt="adm" class="w-full h-full object-cover" />
                  </div>
                  <!-- Green dot on top of avatar for Active Now admin -->
                  <span
                    v-if="isCurrentLoggedInAdmin(adm)"
                    class="absolute top-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white shadow-xs"
                    title="Online Now"
                  ></span>
                </div>
                <div class="flex flex-col min-w-0 gap-0.5">
                  <div class="flex items-center gap-2 flex-wrap">
                    <span class="font-bold text-sm text-content-dark truncate">{{ adm.name }}</span>
                    <!-- Branch Badge rendered with database assigned color and abbr -->
                    <AppBadge
                      v-if="getBranchBadgeProps(adm.branch)"
                      v-bind="getBranchBadgeProps(adm.branch)"
                    />
                    <!-- Active Now badge on profile of admin -->
                    <AppBadge
                      :status="isCurrentLoggedInAdmin(adm) ? 'Active Now' : adm.status || 'Active'"
                      :type="
                        adm.status === 'Inactive' && !isCurrentLoggedInAdmin(adm)
                          ? 'error'
                          : 'success'
                      "
                    />
                  </div>
                  <span class="text-sm text-content-muted truncate"
                    >{{ adm.email }} • {{ adm.phone || '+855 12 345 678' }}</span
                  >
                  <div class="flex items-center gap-2 text-xs text-content-muted flex-wrap">
                    <span class="font-semibold text-primary">{{ adm.role || 'Admin' }}</span>
                    <span>•</span>
                    <span>{{ adm.identityProvider || 'Verified Identity' }}</span>
                    <span v-if="adm.addedAt">• {{ formatDate(adm.addedAt) }}</span>
                  </div>
                </div>
              </div>
              <div class="flex items-center gap-2 shrink-0 self-end sm:self-center">
                <AppButton type="button" variant="danger" size="sm" @click="promptDeleteAdmin(adm)">
                  Remove
                </AppButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <AppConfirmOverlay
      :show="confirmState.isOpen"
      :title="confirmState.title || 'Save Profile'"
      subtitle="Please verify details before proceeding."
      :image="
        activeMode === 'profile'
          ? form.profileURL || getAvatarUrl('profiles/avatar-admin-female')
          : newAdminForm.profileURL || getAvatarUrl('profiles/avatar-admin-female')
      "
      :rows="confirmRows"
      :confirmLabel="confirmOverlaySubmitLabel"
      @back="closeConfirm"
      @confirm="executeConfirmedAction"
    />
  </AppModal>
</template>

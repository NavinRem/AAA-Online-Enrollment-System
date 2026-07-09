import { getCachedData, setCachedData, clearAllCache } from './cache'
import { auth } from '../firebase'
import { config } from '../config'
import { getAdminProfile, getAdminBranch } from '@/utils/adminBranchHelper'

const API_URL = config.api.baseUrl

// Helper to safely trigger notification
function triggerSystemNotification(endpoint, method, responseData, options) {
  if (options.skipNotification) return
  try {
    import('@/stores/notificationStore').then(({ useNotificationStore }) => {
      const store = useNotificationStore()
      let module = 'system'
      let title = 'Record Updated'
      let message = 'Operation completed successfully.'
      let type = 'success'
      let link = null

      const cleanEndpoint = endpoint.split('?')[0].toLowerCase()

      if (cleanEndpoint.includes('/enrollments')) {
        module = 'Enrollments'
        link = '/enrollments'
        if (method === 'POST') {
          title = 'New Enrollment Created'
          message = responseData?.studentName
            ? `Enrolled ${responseData.studentName}`
            : 'Student enrollment record added.'
        } else if (method === 'PUT' || method === 'PATCH') {
          if (cleanEndpoint.includes('/transfer')) {
            title = 'Enrollment Transferred'
            message = 'Student class session transfer completed.'
          } else if (cleanEndpoint.includes('/payment')) {
            module = 'Payments'
            title = 'Payment Processed'
            message = 'Enrollment fee payment confirmed & verified.'
          } else {
            title = 'Enrollment Updated'
            message = 'Enrollment status or details modified.'
          }
        } else if (method === 'DELETE') {
          title = 'Enrollment Cancelled'
          message = 'Enrollment record has been removed or cancelled.'
          type = 'warning'
        }
      } else if (cleanEndpoint.includes('/payments') || cleanEndpoint.includes('/khqr')) {
        module = 'Payments'
        link = '/payment'
        if (method === 'POST') {
          title = 'Payment Confirmed'
          message = responseData?.amount
            ? `$${responseData.amount} payment received & verified.`
            : 'New payment transaction verified.'
        } else if (method === 'PUT' || method === 'PATCH') {
          title = 'Payment Status Updated'
          message = 'Transaction record verification status modified.'
        }
      } else if (cleanEndpoint.includes('/students') || cleanEndpoint.includes('/parents')) {
        module = cleanEndpoint.includes('/parents') ? 'Parents' : 'Students'
        link = cleanEndpoint.includes('/parents') ? '/parents' : '/students'
        if (method === 'POST') {
          title = cleanEndpoint.includes('/parents')
            ? 'New Parent Registered'
            : 'New Student Registered'
          message = responseData?.name
            ? `Created profile for ${responseData.name}`
            : 'New profile created successfully.'
        } else if (method === 'DELETE') {
          title = cleanEndpoint.includes('/parents') ? 'Parent Removed' : 'Student Removed'
          message = 'Profile record removed from database.'
          type = 'warning'
        } else {
          title = 'Profile Updated'
          message = 'Student or parent information updated.'
        }
      } else if (
        cleanEndpoint.includes('/programs') ||
        cleanEndpoint.includes('/classes') ||
        cleanEndpoint.includes('/branches') ||
        cleanEndpoint.includes('/teachers') ||
        cleanEndpoint.includes('/terms') ||
        cleanEndpoint.includes('/trials')
      ) {
        if (cleanEndpoint.includes('/programs')) {
          module = 'Programs'
          link = '/programs'
        } else if (cleanEndpoint.includes('/classes')) {
          module = 'Classes'
          link = '/classes'
        } else if (cleanEndpoint.includes('/branches')) {
          module = 'Branches'
          link = '/branches'
        } else if (cleanEndpoint.includes('/teachers')) {
          module = 'Teachers'
          link = '/teachers'
        } else if (cleanEndpoint.includes('/terms')) {
          module = 'Terms'
          link = '/terms'
        } else if (cleanEndpoint.includes('/trials')) {
          module = 'Trials'
          link = '/trials'
        }

        const entityName = cleanEndpoint.includes('/programs')
          ? 'Program'
          : cleanEndpoint.includes('/classes')
            ? 'Class Offering'
            : cleanEndpoint.includes('/branches')
              ? 'Branch'
              : cleanEndpoint.includes('/teachers')
                ? 'Teacher'
                : cleanEndpoint.includes('/terms')
                  ? 'Term'
                  : 'Trial Session'

        if (method === 'POST') {
          title = `New ${entityName} Created`
          message =
            responseData?.name || responseData?.title
              ? `Added "${responseData.name || responseData.title}"`
              : `New ${entityName.toLowerCase()} record added.`
        } else if (method === 'DELETE') {
          title = `${entityName} Deleted`
          message = `${entityName} record removed from catalog.`
          type = 'warning'
        } else {
          title = `${entityName} Updated`
          message = `${entityName} configuration details saved.`
        }
      } else {
        if (method === 'POST') {
          title = 'New Record Created'
          message = 'System data record added successfully.'
        } else if (method === 'DELETE') {
          title = 'Record Deleted'
          message = 'System record deleted.'
          type = 'warning'
        }
      }

      const currentUser = auth.currentUser
      const profile = getAdminProfile()
      const adminName =
        profile?.name ||
        (currentUser
          ? currentUser.displayName || (currentUser.email ? currentUser.email.split('@')[0] : 'Admin')
          : 'Sona Navin')
      const adminBranch = getAdminBranch()

      let activityType
      if (method === 'POST') {
        activityType = 'Created Record'
      } else if (method === 'DELETE') {
        activityType = 'Deleted Record'
      } else if (cleanEndpoint.includes('/transfer')) {
        activityType = 'Transferred Class Session'
      } else if (responseData && responseData.status) {
        const sLower = String(responseData.status).toLowerCase()
        if (sLower.includes('cancel') || sLower.includes('drop')) {
          activityType = 'Cancelled Enrollment'
        } else {
          activityType = `Updated Status: ${responseData.status}`
        }
      } else if (responseData && responseData.paymentStatus) {
        activityType = `Updated Payment: ${responseData.paymentStatus}`
      } else {
        activityType = 'Updated Record Details'
      }

      const details = [{ label: 'Activity Type', value: activityType }]
      if (responseData && typeof responseData === 'object' && !Array.isArray(responseData)) {
        const branchVal = responseData.branchName || (typeof responseData.branch === 'object' ? responseData.branch?.name : responseData.branch) || responseData.location || adminBranch
        if (branchVal) details.push({ label: 'Branch', value: String(branchVal) })

        const nameVal = responseData.studentName || responseData.name || responseData.title || responseData.parentName || responseData.guestStudentName
        if (nameVal) details.push({ label: 'Name / Subject', value: String(nameVal) })

        const progVal = responseData.programName || responseData.className || (typeof responseData.program === 'object' ? responseData.program?.name : responseData.program) || (typeof responseData.category === 'object' ? responseData.category?.name : responseData.category) || responseData.subject
        if (progVal && String(progVal) !== String(nameVal)) details.push({ label: 'Program / Class', value: String(progVal) })

        const termOrSched = responseData.termName || (typeof responseData.term === 'object' ? responseData.term?.name : responseData.term) || responseData.schedule || responseData.teacherName
        if (termOrSched && String(termOrSched) !== String(progVal)) details.push({ label: 'Term / Schedule', value: String(termOrSched) })

        if (responseData.amount !== undefined && responseData.amount !== null && responseData.amount !== '') {
          const amtNum = Number(responseData.amount)
          const modeType =
            responseData.paymentModeType ||
            (responseData.isProrated !== undefined
              ? responseData.isProrated
                ? 'partial'
                : 'full'
              : cleanEndpoint.includes('/enrollments')
                ? 'full'
                : null)
          details.push({
            label: 'Amount',
            value: !isNaN(amtNum) ? `$${amtNum.toFixed(2)}` : String(responseData.amount),
            ...(modeType ? { colorValue: modeType } : {}),
          })
        }

        const statVal = responseData.status || responseData.paymentStatus || responseData.level || responseData.method || responseData.paymentMethod
        if (statVal && String(statVal) !== '200' && String(statVal) !== '201') details.push({ label: 'Status', value: String(statVal) })
      }

      if (link) {
        const pathParts = cleanEndpoint.split('/').filter(Boolean)
        const lastPart = pathParts[pathParts.length - 1]
        const isIdInUrl = lastPart && !['enrollments', 'students', 'parents', 'teachers', 'classes', 'programs', 'branches', 'terms', 'trials', 'payments', 'khqr'].includes(lastPart)
        const searchTarget = responseData?.id || responseData?.code || responseData?.receiptId || responseData?.enrollmentId || responseData?.studentId || (isIdInUrl ? lastPart : null) || responseData?.studentName || responseData?.name
        if (searchTarget) {
          link = `${link}?search=${encodeURIComponent(String(searchTarget))}`
        }
      }

      store.notify({
        title,
        message,
        type,
        module,
        link,
        admin: adminName,
        adminBranch: adminBranch,
        details: details.length > 0 ? details : null,
      })
    })
  } catch (e) {
    console.warn('Could not trigger system notification', e)
  }
}

export async function request(endpoint, options = {}) {
  let url = `${API_URL}${endpoint}`
  const method = options.method || 'GET'
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  }
  // Global Parameter Sanitization for GET requests
  if (method === 'GET' && endpoint.includes('?')) {
    const [path, query] = endpoint.split('?')
    const params = new URLSearchParams(query)
    const cleanParams = new URLSearchParams()

    for (const [key, value] of params.entries()) {
      if (
        value !== 'undefined' &&
        value !== 'null' &&
        value !== '' &&
        value !== null &&
        value !== undefined
      ) {
        cleanParams.append(key, value)
      }
    }

    const newQuery = cleanParams.toString()
    url = newQuery ? `${API_URL}${path}?${newQuery}` : `${API_URL}${path}`
  }

  const cacheKey = url
  const skipCache =
    options.skipCache || (typeof globalThis !== 'undefined' && globalThis.__playwright_mock_auth__)
  if (method === 'GET' && !skipCache) {
    const cached = getCachedData(cacheKey)
    if (cached) return cached
  }

  // Ensure auth is ready before checking currentUser
  let currentUser = auth.currentUser
  if (!currentUser) {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      currentUser = user
    })
    // Small delay to allow Firebase to initialize if it hasn't yet
    await new Promise((resolve) => setTimeout(resolve, 50))
    unsubscribe()
  }

  if (currentUser) {
    try {
      const token = await currentUser.getIdToken()
      headers['Authorization'] = `Bearer ${token}`
    } catch (err) {
      console.warn('Failed to get auth token:', err)
    }
  }

  if (headers['Content-Type'] === undefined) {
    delete headers['Content-Type']
  }

  const fetchOptions = {
    ...options,
    headers,
    ...(skipCache ? { cache: 'no-store' } : {}),
  }

  const response = await fetch(url, fetchOptions)
  const contentType = response.headers.get('content-type')

  let responseData
  if (contentType && contentType.includes('application/json')) {
    responseData = await response.json()
  } else {
    const text = await response.text()
    responseData = { message: text || response.statusText }
  }

  if (!response.ok) {
    const error = new Error(
      responseData.message ||
        responseData.error ||
        `API Error: ${response.status} ${response.statusText}`,
    )
    error.status = response.status
    throw error
  }

  if (responseData.error) {
    const errorMsg = responseData.error.message || responseData.error || 'Unknown API Error'
    const error = new Error(errorMsg)
    error.status = response.status
    throw error
  }

  if (method === 'GET' && !skipCache) {
    setCachedData(cacheKey, responseData)
  } else if (method !== 'GET') {
    // Clear the entire API cache on any mutation to ensure cross-resource staleness doesn't happen
    // (e.g. Trials creating Parents, Enrollments updating Student statuses)
    clearAllCache()
    triggerSystemNotification(endpoint, method, responseData, options)
  }

  return responseData
}

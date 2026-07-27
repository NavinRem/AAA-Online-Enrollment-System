import { auth } from '../firebase'
import { getAdminProfile, getAdminBranch } from '@/utils/adminBranchHelper'

export function triggerSystemNotification(endpoint, method, responseData, options = {}) {
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
        if (cleanEndpoint.includes('/process-payment') || cleanEndpoint.includes('/payment')) {
          module = 'Payments'
          title = 'Payment Processed'
          message = responseData?.amount
            ? `$${responseData.amount} enrollment fee payment confirmed & verified.`
            : 'Enrollment fee payment confirmed & verified.'
        } else if (cleanEndpoint.includes('/transfer')) {
          title = 'Enrollment Transferred'
          message = 'Student class session transfer completed.'
        } else if (cleanEndpoint.includes('/cancel')) {
          title = 'Enrollment Cancelled'
          message = 'Enrollment record has been cancelled.'
          type = 'warning'
        } else if (method === 'POST') {
          title = 'New Enrollment Created'
          message = responseData?.studentName
            ? `Enrolled ${responseData.studentName}`
            : 'Student enrollment record added.'
        } else if (method === 'DELETE') {
          title = 'Enrollment Deleted'
          message = 'Enrollment record has been removed.'
          type = 'warning'
        } else {
          title = 'Enrollment Updated'
          message = 'Enrollment status or details modified.'
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
        if (
          cleanEndpoint.includes('/assign') ||
          cleanEndpoint.includes('/unassign') ||
          (cleanEndpoint.includes('/offerings') &&
            responseData &&
            (responseData.sessionTeachers || responseData.teachers))
        ) {
          module = 'Teachers'
          link = '/teachers'
        } else if (cleanEndpoint.includes('/programs')) {
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
              : cleanEndpoint.includes('/teachers') ||
                  cleanEndpoint.includes('/assign') ||
                  cleanEndpoint.includes('/unassign') ||
                  (cleanEndpoint.includes('/offerings') &&
                    responseData &&
                    (responseData.sessionTeachers || responseData.teachers))
                ? 'Teacher'
                : cleanEndpoint.includes('/terms')
                  ? 'Term'
                  : 'Trial Session'

        if (
          cleanEndpoint.includes('/assign') ||
          cleanEndpoint.includes('/unassign') ||
          (cleanEndpoint.includes('/offerings') &&
            responseData &&
            (responseData.sessionTeachers || responseData.teachers))
        ) {
          if (responseData?.actionLabel) {
            title = responseData.actionType || 'Teacher Class Schedule Updated'
            message = responseData.actionLabel
            if (responseData.actionLabel.includes('Removed')) type = 'warning'
          } else {
            title = cleanEndpoint.includes('/unassign')
              ? 'Teacher Class Unassigned'
              : 'Teacher Class Assigned'
            const progName =
              responseData?.program?.name || responseData?.programName || responseData?.name
            message = progName
              ? `Assigned teacher schedule for ${progName}`
              : 'Teacher class sessions assigned successfully.'
          }
        } else if (method === 'POST') {
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
          ? currentUser.displayName ||
            (currentUser.email ? currentUser.email.split('@')[0] : 'Admin')
          : 'Sona Navin')
      const adminBranch = getAdminBranch()

      let activityType
      if (
        cleanEndpoint.includes('/assign') ||
        cleanEndpoint.includes('/unassign') ||
        (cleanEndpoint.includes('/offerings') &&
          responseData &&
          (responseData.sessionTeachers || responseData.teachers))
      ) {
        activityType =
          responseData?.actionLabel ||
          (cleanEndpoint.includes('/unassign')
            ? 'Unassigned Teacher from Class'
            : 'Assigned Teacher to Class')
      } else if (method === 'POST') {
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

      const formatSafeDetail = (val) => {
        if (val === null || val === undefined) return null
        if (typeof val === 'object') {
          if (val.day || val.time) return [val.day, val.time].filter(Boolean).join(' ')
          if (val.name) return String(val.name)
          if (val.title) return String(val.title)
          if (val.abbr) return String(val.abbr)
          return null
        }
        return String(val)
      }

      const details = [{ label: 'Activity Type', value: activityType }]
      if (responseData && typeof responseData === 'object' && !Array.isArray(responseData)) {
        const branchVal = formatSafeDetail(
          responseData.branchName || responseData.branch || responseData.location || adminBranch,
        )
        if (branchVal) details.push({ label: 'Branch', value: branchVal })

        const nameVal = formatSafeDetail(
          responseData.studentName ||
            responseData.name ||
            responseData.title ||
            responseData.parentName ||
            responseData.guestStudentName,
        )
        if (nameVal) details.push({ label: 'Name / Subject', value: nameVal })

        const progVal = formatSafeDetail(
          responseData.programName ||
            responseData.className ||
            responseData.program ||
            responseData.category ||
            responseData.subject,
        )
        if (progVal && progVal !== nameVal)
          details.push({ label: 'Program / Class', value: progVal })

        const termOrSched = formatSafeDetail(
          responseData.termName ||
            responseData.term ||
            responseData.schedule ||
            responseData.teacherName,
        )
        if (termOrSched && termOrSched !== progVal)
          details.push({ label: 'Term / Schedule', value: termOrSched })

        if (
          responseData.amount !== undefined &&
          responseData.amount !== null &&
          responseData.amount !== ''
        ) {
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

        const statVal =
          responseData.status ||
          responseData.paymentStatus ||
          responseData.level ||
          responseData.method ||
          responseData.paymentMethod
        if (statVal && String(statVal) !== '200' && String(statVal) !== '201')
          details.push({ label: 'Status', value: String(statVal) })
      }

      if (link) {
        const pathParts = cleanEndpoint.split('/').filter(Boolean)
        const lastPart = pathParts[pathParts.length - 1]
        const isIdInUrl =
          lastPart &&
          ![
            'enrollments',
            'students',
            'parents',
            'teachers',
            'classes',
            'programs',
            'branches',
            'terms',
            'trials',
            'payments',
            'khqr',
          ].includes(lastPart)
        const searchTarget =
          responseData?.id ||
          responseData?.code ||
          responseData?.receiptId ||
          responseData?.enrollmentId ||
          responseData?.studentId ||
          (isIdInUrl ? lastPart : null) ||
          responseData?.studentName ||
          responseData?.name
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

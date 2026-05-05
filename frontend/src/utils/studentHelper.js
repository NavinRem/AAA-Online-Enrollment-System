import { storageService } from '@/services/storageService'
import { isSameProfileAsset } from './assetHelper'

/**
 * Enriches student data for the list view.
 */
export const enrichStudents = (
  students = [],
  enrollments = [],
  users = [],
  currentTermId = null,
  classes = [],
  programs = [],
) => {
  return students.map((s) => {
    const id = s.id || ''
    let regs = enrollments.filter((r) => String(r.studentId) === String(id))
    
    // Filter by Current Term if provided
    if (currentTermId) {
      regs = regs.filter((r) => {
        let eTermId = r.termId || r.class?.termId || r.class?.term?.id || r.classSnapshot?.termId
        
        // Fallback: If no termId in enrollment, look up via classId in the classes array
        if (!eTermId && r.classId && classes.length) {
          const cls = classes.find(c => c.id === r.classId)
          if (cls) eTermId = cls.termId || cls.term?.id
        }
        
        return String(eTermId) === String(currentTermId)
      })
    }

    // Strict Status Filter: Only show "real" studies (Paid, Confirmed, Active)
    regs = regs.filter((r) => {
      const status = String(r.paymentStatus || r.status || '').toLowerCase()
      return ['paid', 'confirmed', 'active'].includes(status)
    })

    // Program Joining: Ensure each enrollment has its full program metadata
    regs = regs.map((r) => {
      const prog = r.program || r.programSnapshot || programs.find(p => p.id === (r.programId || r.program?.id))
      return { ...r, program: prog }
    })

    const p = s.parentInfo || users.find((u) => u.uid === (s.parentId || ''))

    return {
      ...s,
      id,
      archived: !!(s.archived || (s.status || '').toLowerCase() === 'stopped'),
      parentInfo: p
        ? {
            id: p.uid || p.id,
            name: p.name || 'N/A',
            profileURL: p.profileURL,
            status: p.status || 'Active',
          }
        : s.parentInfo,
      status: s.status || 'Inactive',
      enrollments: regs,
    }
  })
}

/**
 * Calculates student statistics.
 */
export const calculateTotalStudent = (students) => ({
  total: students.length,
  studying: students.filter((s) => s.status === 'Studying').length,
  inactive: students.filter((s) => s.status === 'Inactive').length,
  graduated: students.filter((s) => s.status === 'Graduated').length,
})

/**
 * Handles profile image stabilization for students.
 */
export const processStudentProfileImage = async (profile, name, currentProfile = '') => {
  if (!profile || !profile.includes('/profiles/temp/')) {
    return profile
  }
  if (currentProfile && isSameProfileAsset(profile, currentProfile)) {
    return currentProfile
  }

  try {
    const extension = profile.split('?')[0].split('.').pop() || 'jpg'
    const sanitizedName = (name || 'student')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
    const newPath = `profiles/student/${sanitizedName}_student.${extension}`

    return await storageService.moveProfileImage(profile, newPath)
  } catch (err) {
    console.warn('Failed to process student profile image, fallback to temp:', err)
    return profile
  }
}

/**
 * Prepares a clean payload for student registration/updates.
 */
export const prepareStudentPayload = (data) => {
  const payload = {
    name: data.name?.trim(),
    dob: data.dob,
    profileURL: data.profileURL,
    status: data.status || 'Studying',
  }
  if (data.parentId) payload.parentId = data.parentId
  return payload
}

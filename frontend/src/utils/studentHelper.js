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
) => {
  return students.map((s) => {
    const id = s.id || ''
    let regs = enrollments.filter((r) => r.studentId === id)
    if (currentTermId) {
      regs = regs.filter((r) => r.termId === String(currentTermId))
    }

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
  return {
    name: data.name?.trim(),
    dob: data.dob,
    profileURL: data.profileURL,
    medicalNote: data.medicalNote?.trim() || 'None',
    branch: data.branch || null,
    status: data.status || 'Studying',
  }
}

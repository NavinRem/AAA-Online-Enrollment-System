/**
 * Dynamic Image Loader
 * Fetches larger assets like profiles, classes, programs, and backgrounds.
 */
export const getImageUrl = (param1, param2) => {
  if (!param1) return ''
  
  let category = param1
  let name = param2
  
  if (!param2) {
    const kw = param1.toLowerCase().trim()
    if (kw.includes('student') || kw.includes('parent') || kw.includes('guardian') || kw.includes('profile') || kw.includes('admin') || kw.includes('avatar')) {
      category = 'profiles'
    } else if (kw.includes('piano') || kw.includes('robotic') || kw.includes('ballet') || kw.includes('class')) {
      category = 'classes'
    } else if (kw.includes('program') || kw.includes('course')) {
      category = 'programs'
    } else if (kw.includes('bg') || kw.includes('background') || kw.includes('school') || kw.includes('auth')) {
      category = 'backgrounds'
    } else {
      category = 'common'
    }
    name = kw
  }

  const cleanName = name.toLowerCase().trim().replace(/\s+/g, '-').replace(/_/g, '-')
  let fileName = cleanName
  
  if (fileName === 'student' || fileName === 'student-profile') fileName = 'student.png'
  else if (fileName === 'parent' || fileName === 'parent-profile') fileName = 'parent.png'
  else if (fileName === 'guardian' || fileName === 'guardian-profile') fileName = 'guardian.png'
  else if (fileName === 'admin' || fileName === 'profile-admin') fileName = 'profile-admin.png'
  else if (fileName === 'child-profile') fileName = 'child-profile.png'
  else if (fileName.includes('piano')) fileName = 'piano-class.png'
  else if (fileName.includes('robotic')) fileName = 'robotic-class.png'
  else if (fileName.includes('ballet')) fileName = 'ballet-class.png'
  else if (fileName === 'program' || fileName === 'course') fileName = 'program.png'
  else if (fileName === 'logo' || fileName === 'aaa-logo') fileName = 'AAA-Logo.png'
  else if (fileName.includes('blue-bg')) fileName = 'blue-bg-school.jpg'
  else if (fileName.includes('auth-bg')) fileName = 'auth-bg.jpg'

  if (!fileName.includes('.')) fileName = `${fileName}.png`
  
  try {
    return new URL(`../assets/images/${category}/${fileName}`, import.meta.url).href
  } catch (error) {
    console.warn(`Image not found in ${category}: ${fileName}`, error)
    try {
       return new URL(`../assets/images/common/${fileName}`, import.meta.url).href
    } catch(e) {
       return ''
    }
  }
}

/**
 * Dynamic Icon Loader
 * Fetches UI icons from:
 * 1. src/assets/images/icons/ (PNG/JPG dashboard/status)
 * 2. src/assets/icons/ (SVG sidebar/topbar)
 */
export const getIconUrl = (param1, param2) => {
  if (!param1) return ''
  
  // Case A: SVG Icons in src/assets/icons/
  if (param1.includes('.svg') || (param2 && param2.includes('.svg')) || param1.includes('svgrepo') || param1.includes('dollar-minimal')) {
     let cat = 'action' // default for SVG
     let name = param1
     
     if (param2) {
        cat = param1
        name = param2
     } else if (param1.includes('/')) {
        const parts = param1.split('/')
        cat = parts[0]
        name = parts[1]
     } else {
        // Auto-categorize based on common usage if no category provided
        const kw = param1.toLowerCase()
        if (kw.includes('dashboard') || kw.includes('registration') || kw.includes('guardian') || kw.includes('student') || kw.includes('program') || kw.includes('dollar') || kw.includes('setting') || kw.includes('enrollment')) {
          cat = 'navigation'
        } else if (kw.includes('absent') || kw.includes('present') || kw.includes('attendance') || kw.includes('calendar') || kw.includes('arrow')) {
          cat = 'status'
        } else if (kw.includes('child') || kw.includes('family') || kw.includes('profile') || kw.includes('user')) {
          cat = 'user'
        }
     }

     try {
       // Vite requires the base path to be as specific as possible
       return new URL(`../assets/icons/${cat}/${name}`, import.meta.url).href
     } catch (e) {
       console.warn(`SVG Icon not found in ${cat}: ${name}`, e)
       // Fallback to top level? (No, they are all in folders now)
       try {
         return new URL(`../assets/icons/other/${name}`, import.meta.url).href
       } catch (e2) {
         return ''
       }
     }
  }

  let category = param1
  let name = param2
  
  if (!param2) {
    const kw = param1.toLowerCase().trim()
    if (kw.includes('paid') || kw.includes('unpaid') || kw.includes('pending')) {
      category = 'status'
    } else {
      category = 'dashboard'
    }
    name = kw
  }

  const cleanName = name.toLowerCase().trim().replace(/\s+/g, '-').replace(/_/g, '-')
  let fileName = cleanName
  
  if (fileName === 'paid') fileName = 'paid.png'
  else if (fileName === 'unpaid') fileName = 'unpaid.png'
  else if (fileName === 'pending') fileName = 'pending.png'
  else if (fileName === 'on-time' || fileName === 'active') fileName = 'on-time.png'
  else if (fileName === 'register' || fileName === 'registration') fileName = 'register.png'
  else if (fileName === 'enrollment' || fileName === 'enroll') fileName = 'enrollment.png'
  else if (fileName === 'payment' || fileName === 'pay' || fileName === 'revenue' || fileName === 'total-payment') fileName = 'payment.png'
  else if (fileName === 'pending-payment') fileName = 'pending_payment.png'
  else if (fileName === 'user-online' || fileName === 'online') fileName = 'user-online.png'
  else if (fileName === 'cancel') fileName = 'cancel.png'
  else if (fileName === 'refund') fileName = 'refund.png'
  else if (fileName === 'transaction') fileName = 'transaction.png'

  if (!fileName.includes('.')) fileName = `${fileName}.png`
  
  try {
    return new URL(`../assets/images/${category}/${fileName}`, import.meta.url).href
  } catch (error) {
    console.warn(`Icon not found in ${category}: ${fileName}`, error)
    // Fallback to common images
    try {
       return new URL(`../assets/images/common/${fileName}`, import.meta.url).href
    } catch(e) {
       return ''
    }
  }
}

/**
 * Generic Asset Loader (Legacy/Fallback)
 */
export const getAssetUrl = (param1, param2) => {
  const kw = (param2 || param1).toLowerCase().trim()
  if (kw.includes('.svg') || kw.includes('paid') || kw.includes('unpaid') || kw.includes('pending') || 
      kw.includes('enroll') || kw.includes('register') || kw.includes('pay') || 
      kw.includes('on-time') || kw.includes('cancel') || kw.includes('refund')) {
    return getIconUrl(param1, param2)
  }
  return getImageUrl(param1, param2)
}

/**
 * Convenience helpers
 */
export const getProfileAsset = (name) => getImageUrl('profiles', name)
export const getDashboardAsset = (name) => getIconUrl('dashboard', name)
export const getClassAsset = (name) => getImageUrl('classes', name)
export const getProgramAsset = (name) => getImageUrl('programs', name)
export const getStatusAsset = (name) => getIconUrl('status', name)
export const getBackgroundAsset = (name) => getImageUrl('backgrounds', name)
export const getCommonAsset = (name) => getImageUrl('common', name)

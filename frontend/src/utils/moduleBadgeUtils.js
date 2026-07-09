/**
 * Specific Color Themes for Each Application Module
 */
export const MODULE_THEMES = {
  Enrollments: {
    type: 'warning',
    classes: 'bg-amber-100 text-amber-800 border-amber-300',
    color: 'amber',
  },
  Payments: {
    type: 'green',
    classes: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    color: 'emerald',
  },
  KHQR: {
    type: 'green',
    classes: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    color: 'emerald',
  },
  Students: {
    type: 'blue',
    classes: 'bg-blue-100 text-blue-800 border-blue-300',
    color: 'blue',
  },
  Parents: {
    type: 'cyan',
    classes: 'bg-cyan-100 text-cyan-800 border-cyan-300',
    color: 'cyan',
  },
  Programs: {
    type: 'purple',
    classes: 'bg-purple-100 text-purple-800 border-purple-300',
    color: 'purple',
  },
  Classes: {
    type: 'indigo',
    classes: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    color: 'indigo',
  },
  Branches: {
    type: 'rose',
    classes: 'bg-rose-100 text-rose-800 border-rose-300',
    color: 'rose',
  },
  Teachers: {
    type: 'fuchsia',
    classes: 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-300',
    color: 'fuchsia',
  },
  Terms: {
    type: 'orange',
    classes: 'bg-orange-100 text-orange-800 border-orange-300',
    color: 'orange',
  },
  Trials: {
    type: 'lime',
    classes: 'bg-lime-100 text-lime-800 border-lime-300',
    color: 'lime',
  },
  System: {
    type: 'default',
    classes: 'bg-slate-100 text-slate-800 border-slate-300',
    color: 'slate',
  },
}

export function getModuleBadgeTheme(moduleName) {
  const norm = String(moduleName || 'System').trim()
  return (
    MODULE_THEMES[norm] ||
    Object.values(MODULE_THEMES).find(
      (t, idx) => Object.keys(MODULE_THEMES)[idx].toLowerCase() === norm.toLowerCase(),
    ) ||
    MODULE_THEMES.System
  )
}

export function getModuleBadgeClass(moduleName) {
  return getModuleBadgeTheme(moduleName).classes
}

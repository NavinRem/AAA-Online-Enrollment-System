<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import DetailPageLayout from '@/components/layout/DetailPageLayout.vue'
import AppBadge from '@/components/common/ui/AppBadge.vue'
import AppButton from '@/components/common/ui/AppButton.vue'
import DataTable from '@/components/common/data/DataTable.vue'
import { programService } from '@/services/programService'
import { getProgramProfileURL, getImageUrl, getActionIcon } from '@/utils/assetHelper'
import { getProgramDisplayStatus } from '@/utils/programHelper'
import ProgramActionModal from '@/components/programs/ProgramActionModal.vue'
import DetailMetricCard from '@/components/common/data/DetailMetricCard.vue'
import { calculateClassProgress, formatPrice, formatDateOnly } from '@/utils/formatUtils'
import { getTermColor } from '@/utils/badgeUtils'

import { useDataStore } from '@/stores/dataStore'
import TimestampCard from '@/components/common/detail/TimestampCard.vue'

const dataStore = useDataStore()

const route = useRoute()
const router = useRouter()

const activeTab = ref('schedule')

const program = ref(null)
const classes = ref([])
const enrollments = ref([])
const students = ref([])
const trials = ref([])
const categories = ref([])
const branches = ref([])
const terms = ref([])
const loading = ref(true)
const errorMessage = ref('')
const now = ref(new Date())
const teachers = ref([])

const initData = async () => {
  const id = route.params.id
  loading.value = true
  errorMessage.value = ''

  try {
    await dataStore.fetchAllCommonData(true, [
      'programs',
      'classes',
      'enrollments',
      'students',
      'parents',
      'trials',
      'categories',
      'branches',
      'terms',
      'schedules',
      'teachers',
    ])

    const p = dataStore.programs.find((p) => String(p.id) === String(id))
    if (p) {
      program.value = p
    } else {
      const fetched = await programService.getProgram(id)
      program.value = fetched?.data || fetched
    }

    classes.value = dataStore.classes.filter(
      (c) => String(c.programId || c.program?.id || '') === String(id),
    )
    enrollments.value = dataStore.enrollments || []
    students.value = dataStore.students || []
    trials.value = dataStore.trials || []
    categories.value = dataStore.categories || []
    branches.value = dataStore.branches || []
    terms.value = dataStore.terms || []
    teachers.value = dataStore.teachers || []
  } catch (err) {
    console.error('Error fetching program details:', err)
    errorMessage.value = 'Failed to load program details'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  initData()
  window.addEventListener('mousedown', handleTableFilterClickOutside)
  const interval = setInterval(() => {
    now.value = new Date()
  }, 60000)

  onUnmounted(() => {
    clearInterval(interval)
    window.removeEventListener('mousedown', handleTableFilterClickOutside)
  })
})

const resolvedCategory = computed(() => {
  if (!program.value?.categoryId && !program.value?.category) return null
  return categories.value.find(
    (c) => String(c.id) === String(program.value.categoryId) || c.name === program.value.category,
  )
})

const isProgramMatch = (item) => {
  if (!item || !program.value) return false
  const id = String(program.value.id)
  if (String(item.programId || item.program?.id || '') === id) return true
  if (String(item.class?.programId || item.class?.program?.id || '') === id) return true
  if (classes.value.some((c) => String(c.id) === String(item.classId))) return true
  if (
    item.programName &&
    String(item.programName).trim().toLowerCase() ===
      String(program.value.name || '')
        .trim()
        .toLowerCase()
  )
    return true
  return false
}

const programSchedules = computed(() => {
  if (!program.value) return []
  const list = []
  const seenKey = new Set()

  // Only show schedules that belong to the program in an academic term
  terms.value.forEach((term) => {
    const offerings = term.offerings || []
    offerings.forEach((off) => {
      if (!isProgramMatch(off)) return
      const branchObj =
        branches.value.find((b) => String(b.id) === String(off.branchId || off.branch?.id)) ||
        off.branch
      const schedObj = off.schedule ||
        dataStore.schedules.find((s) => String(s.id) === String(off.scheduleId)) || {
          day: 'TBA',
          time: 'N/A',
        }

      const matchingEnrolls = enrollments.value.filter((e) => {
        if (!isProgramMatch(e)) return false
        const isActive =
          (['paid', 'success', 'active', 'confirmed'].includes(
            String(e.status || '').toLowerCase(),
          ) ||
            ['paid', 'success'].includes(String(e.paymentStatus || '').toLowerCase())) &&
          !['transferred', 'cancelled', 'suspended'].includes(String(e.status || '').toLowerCase())
        if (!isActive) return false

        const eTermId = e.termId || e.class?.termId || e.class?.term?.id
        const eBranchId = e.branchId || e.class?.branchId || e.class?.branch?.id
        if (String(eTermId) !== String(term.id)) return false
        if (branchObj?.id && eBranchId && String(eBranchId) !== String(branchObj.id)) return false

        const offId = e.termOfferingId || e.term?.offeringId || e.offeringId
        if (offId && off.offeringId && String(offId) === String(off.offeringId)) return true

        const eSchedId =
          e.scheduleId ||
          e.class?.schedule?.id ||
          e.schedule?.id ||
          (Array.isArray(e.class?.scheduleIds) ? e.class.scheduleIds[0] : null)
        const offSchedId = off.scheduleId || off.schedule?.id || schedObj?.id
        if (eSchedId && offSchedId && String(eSchedId) === String(offSchedId)) return true

        const eDay = e.class?.schedule?.day || e.schedule?.day || e.scheduleDay
        const eTime = e.class?.schedule?.time || e.schedule?.time || e.scheduleTime
        const offDay = off.schedule?.day || schedObj?.day || off.scheduleDay
        const offTime = off.schedule?.time || schedObj?.time || off.scheduleTime
        if (eDay && offDay && String(eDay).toLowerCase() === String(offDay).toLowerCase()) {
          if (eTime && offTime) {
            return String(eTime).toLowerCase() === String(offTime).toLowerCase()
          }
          return true
        }

        return false
      })

      const cap = Number(
        off.capacity ||
          schedObj.capacity ||
          program.value?.capacity ||
          program.value?.maxCapacity ||
          20,
      )
      const currentCount = Math.max(
        matchingEnrolls.length,
        Number(off.currentCount || off.enrolledCount || off.students?.length || 0),
      )
      const key = `${term.id}-${branchObj?.id || 'ALL'}-${schedObj.day}-${schedObj.time}`
      if (!seenKey.has(key)) {
        seenKey.add(key)
        const prog = calculateClassProgress(
          term.startDate,
          term.endDate,
          schedObj.day,
          schedObj.time,
        )

        const assignedTeachers = []
        if (Array.isArray(off.teacherIds)) {
          off.teacherIds.forEach((tid) => {
            const tea = teachers.value.find((t) => String(t.id) === String(tid))
            if (tea && !assignedTeachers.some((x) => x.id === tea.id)) assignedTeachers.push(tea)
          })
        }
        if (Array.isArray(off.sessionTeachers)) {
          off.sessionTeachers.forEach((st) => {
            if (!st) return
            const teaArr = Array.isArray(st.teachers) ? st.teachers : Array.isArray(st) ? st : [st]
            teaArr.forEach((t) => {
              const found = teachers.value.find((tea) => String(tea.id) === String(t?.id || t)) || t
              if (found && found.name && !assignedTeachers.some((x) => x.id === found.id)) {
                assignedTeachers.push(found)
              }
            })
          })
        }

        let dynamicStatus
        if (['cancelled', 'closed'].includes(String(off.status || '').toLowerCase())) {
          dynamicStatus = off.status
        } else if (currentCount >= cap) {
          dynamicStatus = 'Full'
        } else if (term.startDate && term.endDate) {
          if (prog.status === 'ongoing') dynamicStatus = 'Ongoing'
          else if (prog.status === 'archived' || prog.status === 'completed')
            dynamicStatus = 'Completed'
          else dynamicStatus = 'Available'
        } else {
          dynamicStatus = off.status || 'Available'
        }

        list.push({
          id: off.offeringId || key,
          schedule: schedObj,
          branch: branchObj || { name: 'HQ', abbr: 'HQ' },
          term: term,
          capacity: cap,
          currentCount,
          status: dynamicStatus,
          computedStatus: dynamicStatus,
          assignedTeachers,
        })
      }
    })

    // Include class products that explicitly belong to this academic term
    classes.value.forEach((c) => {
      if (!isProgramMatch(c)) return
      const cTermId = c.termId || c.term?.id
      if (String(cTermId) !== String(term.id)) return

      let scheds = c.schedules || []
      if (scheds.length === 0 && c.scheduleIds) {
        scheds = c.scheduleIds
          .map((sid) => dataStore.schedules.find((s) => String(s.id) === String(sid)))
          .filter(Boolean)
      }
      let brs = c.branches || []
      if (brs.length === 0 && c.branchIds) {
        brs = c.branchIds
          .map((bid) => branches.value.find((b) => String(b.id) === String(bid)))
          .filter(Boolean)
      }
      if (brs.length === 0) brs = [{ name: 'HQ', abbr: 'HQ' }]

      const assignedTeachers = []
      if (c.teacher) assignedTeachers.push(c.teacher)
      if (Array.isArray(c.teachers)) {
        c.teachers.forEach((t) => {
          if (!assignedTeachers.some((x) => x.id === t.id)) assignedTeachers.push(t)
        })
      }

      scheds.forEach((schedObj) => {
        brs.forEach((branchObj) => {
          const key = `${term.id}-${branchObj.id || 'ALL'}-${schedObj.day}-${schedObj.time}`
          if (!seenKey.has(key)) {
            seenKey.add(key)
            const matchingEnrolls = enrollments.value.filter((e) => {
              if (!isProgramMatch(e)) return false
              const isActive =
                (['paid', 'success', 'active', 'confirmed'].includes(
                  String(e.status || '').toLowerCase(),
                ) ||
                  ['paid', 'success'].includes(String(e.paymentStatus || '').toLowerCase())) &&
                !['transferred', 'cancelled', 'suspended'].includes(
                  String(e.status || '').toLowerCase(),
                )
              if (!isActive) return false

              const eTermId = e.termId || e.class?.termId || e.class?.term?.id
              if (String(eTermId) !== String(term.id)) return false
              const eBranchId = e.branchId || e.class?.branchId || e.class?.branch?.id
              if (branchObj?.id && eBranchId && String(eBranchId) !== String(branchObj.id))
                return false

              const eSchedId =
                e.scheduleId ||
                e.class?.schedule?.id ||
                e.schedule?.id ||
                (Array.isArray(e.class?.scheduleIds) ? e.class.scheduleIds[0] : null)
              if (eSchedId && schedObj?.id && String(eSchedId) === String(schedObj.id)) return true

              const eDay = e.class?.schedule?.day || e.schedule?.day || e.scheduleDay
              const eTime = e.class?.schedule?.time || e.schedule?.time || e.scheduleTime
              if (
                eDay &&
                schedObj?.day &&
                String(eDay).toLowerCase() === String(schedObj.day).toLowerCase()
              ) {
                if (eTime && schedObj?.time) {
                  return String(eTime).toLowerCase() === String(schedObj.time).toLowerCase()
                }
                return true
              }

              return false
            })
            const capacity = Number(
              schedObj.capacity ||
                c.capacity ||
                c.maxCapacity ||
                program.value?.capacity ||
                program.value?.maxCapacity ||
                20,
            )
            const currentCount = matchingEnrolls.length
            let dynamicStatus
            if (['cancelled', 'closed'].includes(String(c.status || '').toLowerCase())) {
              dynamicStatus = c.status
            } else if (currentCount >= capacity) {
              dynamicStatus = 'Full'
            } else if (term.startDate && term.endDate) {
              const progress = calculateClassProgress(
                term.startDate,
                term.endDate,
                schedObj.day,
                schedObj.time,
              )
              if (progress.status === 'ongoing') dynamicStatus = 'Ongoing'
              else if (progress.status === 'archived' || progress.status === 'completed')
                dynamicStatus = 'Completed'
              else dynamicStatus = 'Available'
            } else {
              dynamicStatus = c.status === 'active' ? 'Available' : c.status || 'Available'
            }
            list.push({
              id: key,
              schedule: schedObj,
              branch: branchObj,
              term: term,
              capacity,
              currentCount,
              status: dynamicStatus,
              computedStatus: dynamicStatus,
              assignedTeachers,
            })
          }
        })
      })
    })
  })

  return list
})

const programTeachers = computed(() => {
  if (!program.value) return []
  const teacherMap = new Map()
  const targetId = String(program.value.id)

  const registerTeacher = (teacherObj, branchName, scheds = []) => {
    if (!teacherObj || !teacherObj.id) return
    const id = String(teacherObj.id)
    const existing = teacherMap.get(id) || {
      ...teacherObj,
      branchesTeaching: [],
      teachingSchedules: [],
    }
    const currentBranches = [...existing.branchesTeaching]
    if (branchName && branchName !== 'No Branch' && !currentBranches.includes(branchName)) {
      currentBranches.push(branchName)
    }
    const currentSchedules = [...existing.teachingSchedules]
    scheds.forEach((sc) => {
      if (sc && sc.day && !currentSchedules.some((x) => x.day === sc.day && x.time === sc.time)) {
        currentSchedules.push(sc)
      }
    })
    teacherMap.set(id, {
      ...existing,
      ...teacherObj,
      branchesTeaching: currentBranches,
      teachingSchedules: currentSchedules,
    })
  }

  // Teachers who explicitly list this program ID
  teachers.value.forEach((t) => {
    if (Array.isArray(t.programIds) && t.programIds.some((id) => String(id) === targetId)) {
      const bName = t.branch?.name || t.branchName
      registerTeacher(t, bName || 'No Branch', t.schedules || [])
    }
  })

  // Teachers teaching classes of this program
  classes.value.forEach((c) => {
    if (!isProgramMatch(c)) return
    const branchName = c.branch?.name || c.branches?.[0]?.name
    let scheds = c.schedules || []
    if (c.teacher) registerTeacher(c.teacher, branchName, scheds)
    if (Array.isArray(c.teachers)) {
      c.teachers.forEach((t) => registerTeacher(t, branchName, scheds))
    }
  })

  // Teachers teaching term offerings of this program
  terms.value.forEach((term) => {
    ;(term.offerings || []).forEach((off) => {
      if (!isProgramMatch(off)) return
      const branchName = off.branch?.name
      const schedObj =
        off.schedule || dataStore.schedules.find((s) => String(s.id) === String(off.scheduleId))
      const scheds = schedObj ? [schedObj] : []
      if (Array.isArray(off.teacherIds)) {
        off.teacherIds.forEach((tid) => {
          const t = teachers.value.find((teacher) => String(teacher.id) === String(tid))
          if (t) registerTeacher(t, branchName, scheds)
        })
      }
      if (Array.isArray(off.sessionTeachers)) {
        off.sessionTeachers.forEach((st) => {
          if (!st) return
          const teaArr = Array.isArray(st.teachers) ? st.teachers : Array.isArray(st) ? st : [st]
          teaArr.forEach((t) => {
            if (t && t.id) {
              const fullTeacher = teachers.value.find((tea) => String(tea.id) === String(t.id)) || t
              registerTeacher(fullTeacher, branchName, scheds)
            }
          })
        })
      }
    })
  })

  return Array.from(teacherMap.values()).map((t) => {
    let ts = t.teachingSchedules || []
    if (ts.length === 0 && Array.isArray(t.schedules)) ts = t.schedules
    return {
      ...t,
      teachingSchedules: ts,
      branchesTeaching:
        t.branchesTeaching && t.branchesTeaching.length > 0 ? t.branchesTeaching : ['No Branch'],
    }
  })
})

const enrolledStudents = computed(() => {
  if (!program.value || !enrollments.value.length) return []

  const matching = enrollments.value.filter((e) => isProgramMatch(e))

  const enriched = matching.map((e) => {
    const student =
      students.value.find((s) => String(s.id) === String(e.studentId)) || e.student || {}
    const targetPId = String(
      student.parentId ||
        student.parent?.id ||
        student.parent?.uid ||
        student.parentInfo?.id ||
        student.parentInfo?.uid ||
        e.parentId ||
        e.parent?.id ||
        e.parent?.uid ||
        e.parentInfo?.id ||
        e.parentInfo?.uid ||
        '',
    )
    const parentFromStore = targetPId
      ? dataStore.parents?.find(
          (p) =>
            String(p.id || '') === targetPId ||
            String(p.uid || '') === targetPId ||
            String(p.docId || '') === targetPId,
        )
      : null
    const parentObj =
      parentFromStore || student.parentInfo || student.parent || e.parentInfo || e.parent || {}
    const term =
      terms.value.find((t) => String(t.id) === String(e.termId || e.class?.termId)) || e.term
    const branch =
      branches.value.find(
        (b) => String(b.id) === String(e.branchId || e.class?.branchId || e.class?.branch?.id),
      ) || e.branch

    return {
      ...e,
      student,
      parentName:
        parentObj.name ||
        parentObj.displayName ||
        student.parentName ||
        student.parent?.name ||
        e.parentName ||
        e.parent?.name ||
        'N/A',
      parentPhone:
        parentObj.phone ||
        parentObj.phoneNumber ||
        student.parentPhone ||
        student.parent?.phone ||
        student.parent?.phoneNumber ||
        e.parentPhone ||
        e.parent?.phone ||
        e.parent?.phoneNumber ||
        'N/A',
      parentEmail:
        parentObj.email ||
        student.parentEmail ||
        student.parent?.email ||
        e.parentEmail ||
        e.parent?.email ||
        'N/A',
      programName: program.value.name,
      termName: term?.name || 'All Terms',
      termId: term?.id || e.termId || e.class?.termId,
      branchName: branch?.name || 'HQ',
      branchObj: branch,
      status: e.status || e.paymentStatus || 'enrolled',
    }
  })

  return enriched.sort((a, b) => {
    const isAActive = ['active', 'paid', 'confirmed'].includes(
      String(a.status || a.paymentStatus).toLowerCase(),
    )
    const isBActive = ['active', 'paid', 'confirmed'].includes(
      String(b.status || b.paymentStatus).toLowerCase(),
    )
    if (isAActive && !isBActive) return -1
    if (!isAActive && isBActive) return 1
    return (a.student?.name || '').localeCompare(b.student?.name || '')
  })
})

const programTrials = computed(() => {
  if (!program.value || !trials.value.length) return []

  const matching = trials.value.filter((t) => isProgramMatch(t))

  return matching
    .map((t) => {
      const student =
        students.value.find((s) => String(s.id) === String(t.studentId)) || t.student || {}
      const parentObj =
        dataStore.parents?.find((p) => String(p.id) === String(t.parentId || student.parentId)) ||
        t.parent ||
        {}
      const branch = branches.value.find(
        (b) => String(b.id) === String(t.branchId || t.branch?.id),
      ) ||
        t.branch || { name: 'HQ', abbr: 'HQ' }

      return {
        ...t,
        student: {
          name: student.name || t.guestStudentName || 'Prospect Student',
          profileURL: student.profileURL,
        },
        parent: {
          name:
            parentObj.name ||
            t.guestParentName ||
            t.parent?.name ||
            student.parentName ||
            'Guest Parent',
          profileURL: parentObj.profileURL,
          phone: parentObj.phone || parentObj.phoneNumber || t.guestParentPhone || '',
        },
        branch: branch,
      }
    })
    .sort((a, b) => new Date(b.trialDate || 0) - new Date(a.trialDate || 0))
})

const branchDistribution = computed(() => {
  if (!program.value || !branches.value.length || !terms.value.length) return []

  const distribution = []
  const now = new Date()
  const localTodayStr = now.toLocaleDateString('en-CA')
  const weekAgoTimestamp = now.getTime() - 7 * 86400000

  branches.value.forEach((branch) => {
    terms.value.forEach((term) => {
      const branchTermEnrollments = enrolledStudents.value.filter((e) => {
        const eBranchId = e.branchId || e.branchObj?.id || e.class?.branchId
        const eTermId = e.termId || e.class?.termId
        return String(eBranchId) === String(branch.id) && String(eTermId) === String(term.id)
      })

      const branchTermOfferings = (term.offerings || []).filter((off) => {
        if (!isProgramMatch(off)) return false
        return String(off.branchId || off.branch?.id) === String(branch.id)
      })

      const branchTermTrials = programTrials.value.filter((t) => {
        const tBranchId = t.branchId || t.branch?.id
        return String(tBranchId) === String(branch.id)
      })

      if (
        branchTermEnrollments.length > 0 ||
        branchTermOfferings.length > 0 ||
        branchTermTrials.length > 0
      ) {
        const uniqueStudents = new Set(branchTermEnrollments.map((e) => e.studentId || e.id)).size

        const paidEnrolls = branchTermEnrollments.filter((e) =>
          ['paid', 'confirmed', 'success'].includes(
            String(e.paymentStatus || e.status).toLowerCase(),
          ),
        )

        const pendingEnrolls = branchTermEnrollments.filter((e) =>
          ['pending', 'unpaid'].includes(String(e.paymentStatus || e.status).toLowerCase()),
        )

        // Today metrics
        const todayEnroll = branchTermEnrollments.filter((e) => {
          const enrollDate = (e.enrollAt || e.createdAt || '').split('T')[0]
          return enrollDate === localTodayStr
        })
        const todayTrials = branchTermTrials.filter((t) => {
          const trialDate = (t.trialDate || t.createdAt || '').split('T')[0]
          return trialDate === localTodayStr
        })
        const todayRev = todayEnroll
          .filter((e) =>
            ['paid', 'confirmed', 'success'].includes(
              String(e.paymentStatus || e.status).toLowerCase(),
            ),
          )
          .reduce((sum, e) => sum + Number(e.amount || program.value.basePrice || 0), 0)

        // Week metrics
        const weekEnroll = branchTermEnrollments.filter((e) => {
          const timestamp = new Date(e.enrollAt || e.createdAt || 0).getTime()
          return timestamp >= weekAgoTimestamp
        })
        const weekTrials = branchTermTrials.filter((tr) => {
          const timestamp = new Date(tr.trialDate || tr.createdAt || 0).getTime()
          return timestamp >= weekAgoTimestamp
        })
        const weekRev = weekEnroll
          .filter((e) =>
            ['paid', 'confirmed', 'success'].includes(
              String(e.paymentStatus || e.status).toLowerCase(),
            ),
          )
          .reduce((sum, e) => sum + Number(e.amount || program.value.basePrice || 0), 0)

        // Lifetime total rev & pending rev
        const totalRev = paidEnrolls.reduce(
          (sum, e) => sum + Number(e.amount || program.value.basePrice || 0),
          0,
        )
        const pendingRev = pendingEnrolls.reduce(
          (sum, e) => sum + Number(e.amount || program.value.basePrice || 0),
          0,
        )

        // Gather schedules & capacity
        const scheduleList = []
        let totalCap = 0
        branchTermOfferings.forEach((off) => {
          if (off.schedule) {
            scheduleList.push({ day: off.schedule.day, time: off.schedule.time })
            totalCap += Number(off.capacity || off.schedule.capacity || 20)
          }
        })
        if (totalCap === 0 && branchTermOfferings.length > 0) {
          totalCap = branchTermOfferings.length * 20
        }

        // Gather faculty teaching this program at this branch + term
        const teacherIdsSet = new Set()
        branchTermOfferings.forEach((off) => {
          ;(off.teacherIds || []).forEach((id) => teacherIdsSet.add(String(id)))
        })
        const facultyList = Array.from(teacherIdsSet)
          .map((id) => teachers.value.find((t) => String(t.id) === id))
          .filter(Boolean)

        distribution.push({
          branch,
          term,
          studentCount: uniqueStudents,
          classCount: branchTermOfferings.length,
          schedules: scheduleList,
          faculty: facultyList,
          capacity: totalCap,
          trialsCount: branchTermTrials.length,
          revenue: totalRev,
          todayNew: new Set(todayEnroll.map((e) => e.studentId || e.id)).size,
          todayTrial: todayTrials.length,
          todayRev,
          weekNew: new Set(weekEnroll.map((e) => e.studentId || e.id)).size,
          weekTrial: weekTrials.length,
          weekRev,
          totalRev,
          pendingRev,
        })
      }
    })
  })

  return distribution.sort((a, b) => {
    const dateA = new Date(a.term.endDate || 0).getTime()
    const dateB = new Date(b.term.endDate || 0).getTime()
    if (dateB !== dateA) return dateB - dateA
    return a.branch.name.localeCompare(b.branch.name)
  })
})

const statsCards = computed(() => {
  if (!program.value) return []

  const totalRevenue = enrolledStudents.value
    .filter((e) =>
      ['paid', 'confirmed', 'active'].includes(String(e.status || e.paymentStatus).toLowerCase()),
    )
    .reduce((sum, e) => sum + Number(e.amount || program.value.basePrice || 0), 0)

  const uniqueTeachersCount = programTeachers.value.length
  const activePaidEnrolledStudents = enrolledStudents.value.filter((e) => {
    const status = String(e.status || e.paymentStatus || '').toLowerCase()
    const isPaid =
      ['paid', 'confirmed', 'success', 'active'].includes(status) || Number(e.amount || 0) === 0
    const termObj = terms.value.find((t) => String(t.id) === String(e.termId || e.class?.termId))
    const isTermActive = termObj
      ? String(termObj.status || '').toLowerCase() === 'active' || termObj.isCurrentTerm
      : String(e.termName || '')
          .toLowerCase()
          .includes('active') || true
    return isPaid && isTermActive
  })
  const uniqueStudentsCount = new Set(activePaidEnrolledStudents.map((e) => e.studentId || e.id))
    .size
  const formattedRevenue = `$${totalRevenue.toLocaleString()}`
  const totalTrialsCount = programTrials.value.length

  return [
    {
      label: 'Total Students',
      value: uniqueStudentsCount,
      image: getImageUrl('data-metric-card/total-enrolled'),
    },
    {
      label: 'Total Revenue',
      value: formattedRevenue,
      image: getImageUrl('data-metric-card/program-revenue'),
    },
    {
      label: 'Total Trials',
      value: totalTrialsCount,
      image: getImageUrl('dashboard/card-trial'),
    },
    {
      label: 'Assigned Teachers',
      value: uniqueTeachersCount,
      image: getImageUrl('data-metric-card/enrollment-capacity'),
    },
  ]
})

const studentHeaders = [
  { label: 'No', width: '50px', align: 'center' },
  { label: 'Student Name', width: '210px' },
  { label: 'Parent Name', width: '170px' },
  { label: 'Parent Phone Number', width: '160px' },
  { label: 'Parent Email', width: '210px' },
  { label: 'Term', width: '130px', align: 'center' },
  { label: 'Branch', align: 'center', width: '130px' },
  { label: 'Age', align: 'center', width: '80px' },
  { label: 'Status', align: 'center', width: '130px' },
]

const teacherHeaders = [
  { label: 'No', width: '50px', align: 'center' },
  { label: 'Teacher Name', width: '210px' },
  { label: 'Teaching Schedules', width: '280px' },
  { label: 'Branch', align: 'center', width: '140px' },
  { label: 'Email', width: '210px' },
  { label: 'Phone Number', width: '160px' },
]

const scheduleHeaders = [
  { label: 'No', width: '50px', align: 'center' },
  { label: 'Day', width: '110px', align: 'center' },
  { label: 'Time', width: '170px' },
  { label: 'Branch', align: 'center', width: '130px' },
  { label: 'Term', width: '130px', align: 'center' },
  { label: 'Teachers Assigned', width: '180px' },
  { label: 'Capacity', align: 'center', width: '200px' },
  { label: 'Status', align: 'center', width: '130px' },
]

const trialHeaders = [
  { label: 'No', width: '50px', align: 'center' },
  { label: 'Student Name', width: '210px' },
  { label: 'Parent Name', width: '190px' },
  { label: 'Parent Contact', width: '160px' },
  { label: 'Branch of Trial', align: 'center', width: '140px' },
  { label: 'Date of Trial', align: 'center', width: '180px' },
  { label: 'Status', align: 'center', width: '140px' },
]

const distributionHeaders = [
  { label: 'No', width: '50px', align: 'center' },
  { label: 'Branch', width: '150px' },
  { label: 'Term', width: '130px' },
  { label: 'Abbr', width: '80px', align: 'center' },
  { label: 'New (T)', width: '80px', align: 'center' },
  { label: 'Trial (T)', width: '80px', align: 'center' },
  { label: 'Rev (T)', width: '95px', align: 'center' },
  { label: 'New (W)', width: '80px', align: 'center' },
  { label: 'Trial (W)', width: '80px', align: 'center' },
  { label: 'Rev (W)', width: '95px', align: 'center' },
  { label: 'Classes', width: '75px', align: 'center' },
  { label: 'Studying', width: '85px', align: 'center' },
  { label: 'Total Rev', width: '110px', align: 'center' },
  { label: 'Pending', width: '110px', align: 'center' },
]

const currentHeaders = computed(() => {
  if (activeTab.value === 'schedule') return scheduleHeaders
  if (activeTab.value === 'teachers') return teacherHeaders
  if (activeTab.value === 'trials') return trialHeaders
  if (activeTab.value === 'distribution') return distributionHeaders
  return studentHeaders
})

const tableSearchQuery = ref('')
const selectedTermFilter = ref('all')
const currentPage = ref(1)
const pageSize = ref(10)

// Additional toolbar filters for ProgramDetail tables
const filterBranch = ref('all')
const filterStatus = ref('all')
const filterShift = ref('all')
const filterDays = ref('all')
const activeFilterDropdown = ref(null)
const filterDropdownStyles = ref({})

const activeFilterCount = computed(() => {
  let count = 0
  if (filterBranch.value !== 'all') count++
  if (filterStatus.value !== 'all') count++
  if (filterShift.value !== 'all') count++
  if (filterDays.value !== 'all') count++
  return count
})

const resetAllTableFilters = () => {
  filterBranch.value = 'all'
  filterStatus.value = 'all'
  filterShift.value = 'all'
  filterDays.value = 'all'
  currentPage.value = 1
}

const toggleTableFilterDropdown = (type, event) => {
  event.stopPropagation()
  if (activeFilterDropdown.value === type) {
    activeFilterDropdown.value = null
  } else {
    activeFilterDropdown.value = type
    const rect = event.currentTarget.getBoundingClientRect()
    const spaceBelow = window.innerHeight - rect.bottom - 16
    const exactMaxHeight = Math.min(520, Math.max(260, spaceBelow))
    filterDropdownStyles.value = {
      top: `${rect.bottom + window.scrollY + 8}px`,
      right: `${Math.max(16, window.innerWidth - rect.right)}px`,
      width: '320px',
      maxHeight: `${exactMaxHeight}px`,
    }
  }
}

const selectTableFilter = (type, value) => {
  if (type === 'branch') filterBranch.value = value
  if (type === 'status') filterStatus.value = value
  if (type === 'shift') filterShift.value = value
  if (type === 'days') filterDays.value = value
  currentPage.value = 1
}

const handleTableFilterClickOutside = (event) => {
  const container = document.getElementById('program-detail-table-filters')
  if (container && !container.contains(event.target)) {
    activeFilterDropdown.value = null
  }
}

watch(activeTab, () => {
  filterBranch.value = 'all'
  filterStatus.value = 'all'
  filterShift.value = 'all'
  filterDays.value = 'all'
  activeFilterDropdown.value = null
  currentPage.value = 1
})

const branchFilterOptions = computed(() => {
  const list = [{ label: 'All Branches', value: 'all', abbr: 'ALL', color: 'gray' }]
  branches.value.forEach((b) => {
    list.push({
      label: b.name,
      value: String(b.id),
      abbr: b.abbr || 'HQ',
      color: b.color || 'purple',
    })
  })
  return list
})

const statusFilterOptions = computed(() => {
  if (activeTab.value === 'schedule') {
    return [
      { label: 'All Statuses', value: 'all', type: 'gray' },
      { label: 'Available', value: 'available', type: 'green' },
      { label: 'Full', value: 'full', type: 'red' },
      { label: 'Ongoing', value: 'ongoing', type: 'blue' },
      { label: 'Completed', value: 'completed', type: 'green' },
      { label: 'Cancelled', value: 'cancelled', type: 'orange' },
    ]
  }
  if (activeTab.value === 'teachers') {
    return [
      { label: 'All Statuses', value: 'all', type: 'gray' },
      { label: 'Active', value: 'active', type: 'green' },
      { label: 'Inactive', value: 'inactive', type: 'red' },
    ]
  }
  if (activeTab.value === 'students') {
    return [
      { label: 'All Statuses', value: 'all', type: 'gray' },
      { label: 'Active / Studying', value: 'active', type: 'green' },
      { label: 'Paid', value: 'paid', type: 'green' },
      { label: 'Unpaid / Pending', value: 'unpaid', type: 'yellow' },
      { label: 'Inactive / Stopped', value: 'inactive', type: 'red' },
    ]
  }
  if (activeTab.value === 'trials') {
    return [
      { label: 'All Statuses', value: 'all', type: 'gray' },
      { label: 'Pending', value: 'pending', type: 'yellow' },
      { label: 'Success', value: 'success', type: 'green' },
      { label: 'Confirmed', value: 'confirmed', type: 'blue' },
      { label: 'Cancelled', value: 'cancelled', type: 'red' },
    ]
  }
  return []
})

const shiftFilterOptions = [
  { label: 'All Shifts', value: 'all', type: 'gray' },
  { label: 'Morning Schedule', value: 'morning', type: 'yellow' },
  { label: 'Afternoon Schedule', value: 'afternoon', type: 'orange' },
]

const daysFilterOptions = computed(() => {
  const set = new Set()
  programSchedules.value.forEach((s) => {
    if (s.schedule?.day) set.add(s.schedule.day)
    if (s.day) set.add(s.day)
  })
  const list = [{ label: 'All Days', value: 'all', type: 'gray' }]
  Array.from(set).forEach((day) => {
    list.push({ label: day, value: day, type: 'green' })
  })
  return list
})

const termFilterOptions = computed(() => {
  const opts = [{ label: 'All Terms', value: 'all' }]
  terms.value.forEach((t) => {
    const termColor = getTermColor(t)
    opts.push({
      label: t.name || `Term ${t.id}`,
      value: String(t.id),
      badgeStatus: t.name || `Term ${t.id}`,
      type: termColor,
      color: termColor,
    })
  })
  return opts
})

const currentItems = computed(() => {
  if (activeTab.value === 'schedule') return programSchedules.value
  if (activeTab.value === 'teachers') return programTeachers.value
  if (activeTab.value === 'trials') return programTrials.value
  if (activeTab.value === 'distribution') return branchDistribution.value
  return enrolledStudents.value
})

const filteredCurrentItems = computed(() => {
  let list = currentItems.value

  if (selectedTermFilter.value && selectedTermFilter.value !== 'all') {
    const termId = String(selectedTermFilter.value)
    list = list.filter((item) => {
      if (activeTab.value === 'schedule') {
        return String(item.term?.id || item.termId) === termId
      }
      if (activeTab.value === 'teachers') {
        if (Array.isArray(item.termIds) && item.termIds.some((id) => String(id) === termId))
          return true
        return (
          (item.teachingSchedules || []).some((s) => String(s.termId || s.term?.id) === termId) ||
          true
        )
      }
      if (activeTab.value === 'students') {
        return String(item.termId || item.term?.id || item.class?.termId) === termId
      }
      if (activeTab.value === 'trials') {
        const tTermId = item.termId || item.class?.termId || item.term?.id
        if (tTermId) return String(tTermId) === termId
        const selTerm = terms.value.find((t) => String(t.id) === termId)
        if (selTerm && item.trialDate) {
          const d = new Date(item.trialDate)
          return (
            d >= new Date(selTerm.startDate || 0) && d <= new Date(selTerm.endDate || '2099-12-31')
          )
        }
        return false
      }
      if (activeTab.value === 'distribution') {
        return String(item.term?.id || item.termId) === termId
      }
      return true
    })
  }

  // Branch Filter
  if (filterBranch.value !== 'all') {
    const bTarget = String(filterBranch.value)
    list = list.filter((item) => {
      if (activeTab.value === 'schedule') {
        return String(item.branch?.id || item.branchId || '') === bTarget
      }
      if (activeTab.value === 'teachers') {
        return (item.branches || []).some((b) => String(b.id) === bTarget)
      }
      if (activeTab.value === 'students' || activeTab.value === 'trials') {
        return String(item.branchId || item.branch?.id || item.branchObj?.id || '') === bTarget
      }
      return true
    })
  }

  // Status Filter
  if (filterStatus.value !== 'all') {
    const sTarget = filterStatus.value.toLowerCase()
    list = list.filter((item) => {
      const statusStr = String(
        item.status || item.computedStatus || item.paymentStatus || '',
      ).toLowerCase()
      if (sTarget === 'active' && ['paid', 'confirmed', 'enrolled', 'active'].includes(statusStr))
        return true
      return statusStr === sTarget
    })
  }

  // Shift Filter (Schedule tab only)
  if (activeTab.value === 'schedule' && filterShift.value !== 'all') {
    list = list.filter((item) => {
      const timeStr = String(item.schedule?.time || item.time || '')
      const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)?/i)
      if (!match) return true
      let hour = Number(match[1])
      const period = match[3] ? match[3].toUpperCase() : null
      if (period === 'PM' && hour < 12) hour += 12
      if (period === 'AM' && hour === 12) hour = 0
      if (filterShift.value === 'morning') return hour < 12
      if (filterShift.value === 'afternoon') return hour >= 12
      return true
    })
  }

  // Days Filter (Schedule tab only)
  if (activeTab.value === 'schedule' && filterDays.value !== 'all') {
    const dTarget = filterDays.value.toLowerCase()
    list = list.filter((item) => {
      const dayStr = String(item.schedule?.day || item.day || '').toLowerCase()
      return dayStr === dTarget || dayStr.includes(dTarget)
    })
  }

  if (tableSearchQuery.value && tableSearchQuery.value.trim()) {
    const q = tableSearchQuery.value.trim().toLowerCase()
    list = list.filter((item) => {
      return JSON.stringify(item).toLowerCase().includes(q)
    })
  }

  return list
})

const paginatedCurrentItems = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredCurrentItems.value.slice(start, start + pageSize.value)
})

const currentEntityName = computed(() => {
  if (activeTab.value === 'schedule') return 'schedule'
  if (activeTab.value === 'teachers') return 'teacher'
  if (activeTab.value === 'trials') return 'trial'
  if (activeTab.value === 'distribution') return 'branch distribution'
  return 'student'
})

const currentTableTitle = computed(() => {
  if (activeTab.value === 'schedule') return 'Class Schedule'
  if (activeTab.value === 'teachers') return 'Teachers List'
  if (activeTab.value === 'trials') return 'Trials List'
  if (activeTab.value === 'distribution') return 'Program Distribution'
  return 'Students List'
})

const actionModal = ref({
  isOpen: false,
  type: 'edit',
  program: null,
  loading: false,
  error: '',
  success: '',
})

const openActionModal = (type) => {
  actionModal.value = {
    isOpen: true,
    type,
    program: program.value,
    loading: false,
    error: '',
    success: '',
  }
}

const closeModal = () => {
  actionModal.value.isOpen = false
  actionModal.value.error = ''
  actionModal.value.success = ''
}

const handleActionSubmit = async (formData) => {
  actionModal.value.loading = true
  actionModal.value.error = ''
  try {
    if (actionModal.value.type === 'edit') {
      await programService.updateProgram(program.value.id, formData)
      actionModal.value.success = 'Program updated successfully!'
    } else if (actionModal.value.type === 'delete') {
      await programService.deleteProgram(program.value.id)
      actionModal.value.success = 'Program deleted successfully!'
      await dataStore.fetchAllCommonData(true, ['programs'])
      setTimeout(() => {
        router.push('/programs')
      }, 1500)
      return
    }
    await dataStore.fetchAllCommonData(true, ['programs'])
    setTimeout(() => {
      closeModal()
      initData()
    }, 1500)
  } catch (error) {
    actionModal.value.error = error.message || 'Action failed'
  } finally {
    actionModal.value.loading = false
  }
}
</script>

<template>
  <DashboardLayout>
    <DetailPageLayout
      :loading="loading"
      :errorMessage="errorMessage"
      backRoute="/programs"
      title="Program Analytics"
      sidebarWidth="lg"
    >
      <template #header-actions v-if="program">
        <div class="flex items-center gap-3">
          <button
            class="w-11 h-11 flex items-center justify-center rounded-full border border-outline-std bg-primary-soft transition-all duration-300 hover:bg-primary hover:border-primary group"
            title="Edit Program"
            @click="openActionModal('edit')"
          >
            <img :src="getActionIcon('edit')" class="w-5 h-5 brightness-0 transition-all" />
          </button>
          <button
            class="w-11 h-11 flex items-center justify-center rounded-full border border-outline-std bg-error-soft transition-all duration-300 hover:bg-error hover:border-error group"
            title="Delete Program"
            @click="openActionModal('delete')"
          >
            <img :src="getActionIcon('delete')" class="w-5 h-5 brightness-0 transition-all" />
          </button>
        </div>
      </template>

      <template #left-content v-if="program">
        <!-- Metrics Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <DetailMetricCard v-for="stat in statsCards" :key="stat.label" v-bind="stat" />
        </div>

        <!-- Tab Navigation -->
        <div
          class="flex items-center gap-2 p-xs bg-white rounded-full border border-outline-std w-fit"
        >
          <button
            v-for="tab in ['schedule', 'teachers', 'students', 'trials', 'distribution']"
            :key="tab"
            class="px-8 py-3 rounded-2xl text-sm font-semibold transition-all duration-300"
            :class="
              activeTab === tab
                ? 'bg-primary text-white shadow-md ring-1 ring-black/5'
                : 'text-content-muted hover:text-content-dark hover:bg-white/50'
            "
            @click="activeTab = tab"
          >
            {{
              tab === 'schedule'
                ? 'Schedule'
                : tab === 'teachers'
                  ? 'Teachers'
                  : tab === 'students'
                    ? 'Students'
                    : tab === 'trials'
                      ? 'Trials'
                      : 'Distribution'
            }}
          </button>
        </div>

        <section
          class="overflow-hidden animate-fade-in border border-outline-std rounded-md bg-white shadow-sm flex flex-col"
        >
          <DataTable
            :title="currentTableTitle"
            :headers="currentHeaders"
            :items="paginatedCurrentItems"
            :loading="loading"
            :entityName="currentEntityName"
            :flexible="false"
            :hasSearch="true"
            v-model:searchQuery="tableSearchQuery"
            :hasFilter="true"
            filterLabel="Term"
            v-model:currentFilter="selectedTermFilter"
            :filterOptions="termFilterOptions"
            :hasPagination="true"
            v-model:currentPage="currentPage"
            :pageSize="pageSize"
            :totalItems="filteredCurrentItems.length"
          >
            <template #toolbar-actions>
              <div
                v-if="['schedule', 'teachers', 'students', 'trials'].includes(activeTab)"
                id="program-detail-table-filters"
                class="flex items-center gap-2 relative"
              >
                <!-- Centralized Unified Filter Button -->
                <AppButton
                  :variant="activeFilterCount > 0 ? 'ghost' : 'secondary'"
                  size="md"
                  @click="toggleTableFilterDropdown('unified', $event)"
                  :class="{
                    '!text-white shadow-md': activeFilterCount > 0,
                    'shadow-sm': activeFilterCount === 0,
                  }"
                  :style="activeFilterCount > 0 ? { backgroundColor: 'var(--color-blue)' } : {}"
                >
                  <img
                    :src="getActionIcon('filter')"
                    class="w-4 h-4 brightness-0 transition-all opacity-80 group-hover:opacity-100"
                    :class="{ invert: activeFilterCount > 0 }"
                  />
                  <span
                    class="font-bold tracking-tight"
                    :class="{ 'text-white': activeFilterCount > 0 }"
                    >Filters</span
                  >
                  <span
                    v-if="activeFilterCount > 0"
                    class="ml-1 px-1.5 py-0.5 text-3xs font-extrabold rounded-full bg-white text-blue-700 shadow-sm"
                  >
                    {{ activeFilterCount }}
                  </span>
                  <span
                    class="ml-1 text-xs opacity-60 group-hover:opacity-100"
                    :class="{ 'text-white': activeFilterCount > 0 }"
                    >▼</span
                  >
                </AppButton>

                <!-- Centralized Unified Filter Popover Panel -->
                <Teleport to="body">
                  <transition
                    enter-active-class="transition duration-200 ease-out"
                    enter-from-class="transform scale-95 opacity-0"
                    enter-to-class="transform scale-100 opacity-100"
                    leave-active-class="transition duration-150 ease-in"
                    leave-from-class="opacity-100"
                    leave-to-class="opacity-0"
                  >
                    <div
                      v-if="activeFilterDropdown === 'unified'"
                      class="toolbar-filter-menu !p-0 !w-80 shadow-2xl border border-outline-std/80 rounded-sm bg-white z-50 flex flex-col overflow-hidden"
                      :style="filterDropdownStyles"
                      @mousedown.stop
                    >
                      <!-- Sticky Popover Header -->
                      <div
                        class="flex items-center justify-between border-b border-outline-std px-4 py-3 bg-white shrink-0"
                      >
                        <span class="text-sm font-bold text-content-dark">Table Filters</span>
                        <button
                          v-if="activeFilterCount > 0"
                          @click="resetAllTableFilters"
                          class="text-xs font-bold text-error hover:text-blue-800 transition-colors"
                        >
                          Reset all
                        </button>
                      </div>

                      <!-- Scrollable Filter Content Below Header -->
                      <div class="flex-1 overflow-y-auto p-4 flex flex-col">
                        <!-- 1. Branch Filter -->
                        <div class="flex flex-col gap-1.5 mb-5">
                          <label class="text-xs font-semibold text-content-muted">Branch</label>
                          <div class="flex flex-wrap gap-1.5">
                            <button
                              v-for="opt in branchFilterOptions"
                              :key="opt.value"
                              @click="selectTableFilter('branch', opt.value)"
                              class="px-2.5 py-1.5 border rounded-md text-sm font-semibold transition-all flex items-center gap-2"
                              :class="
                                String(filterBranch) === String(opt.value)
                                  ? 'bg-primary border-primary text-white shadow-sm font-bold'
                                  : 'bg-white border-outline-std/60 text-content-dark hover:bg-surface-subtle'
                              "
                            >
                              <AppBadge
                                v-if="opt.value !== 'all'"
                                :status="opt.label"
                                :type="opt.color"
                                size="sm"
                              />
                              <span v-else>{{ opt.label }}</span>
                            </button>
                          </div>
                        </div>

                        <!-- 2. Shift Filter (Schedule Tab Only) -->
                        <div v-if="activeTab === 'schedule'" class="flex flex-col gap-1.5 mb-5">
                          <label class="text-xs font-semibold text-content-muted">Time Shift</label>
                          <div class="flex flex-wrap gap-1.5">
                            <button
                              v-for="opt in shiftFilterOptions"
                              :key="opt.value"
                              @click="selectTableFilter('shift', opt.value)"
                              class="px-2.5 py-1.5 border rounded-md text-sm font-semibold transition-all"
                              :class="
                                filterShift === opt.value
                                  ? 'bg-primary border-primary text-white shadow-sm font-bold'
                                  : 'bg-white border-outline-std/60 text-content-dark hover:bg-surface-subtle'
                              "
                            >
                              {{ opt.label }}
                            </button>
                          </div>
                        </div>

                        <!-- 3. Days Filter (Schedule Tab Only) -->
                        <div v-if="activeTab === 'schedule'" class="flex flex-col gap-1.5 mb-5">
                          <label class="text-xs font-semibold text-content-muted"
                            >Day of Week</label
                          >
                          <div class="flex flex-wrap gap-1.5">
                            <button
                              v-for="opt in daysFilterOptions"
                              :key="opt.value"
                              @click="selectTableFilter('days', opt.value)"
                              class="px-2.5 py-1.5 border rounded-md text-sm font-semibold transition-all"
                              :class="
                                filterDays === opt.value
                                  ? 'bg-primary border-primary text-white shadow-sm font-bold'
                                  : 'bg-white border-outline-std/60 text-content-dark hover:bg-surface-subtle'
                              "
                            >
                              {{ opt.label }}
                            </button>
                          </div>
                        </div>

                        <!-- 4. Status Filter -->
                        <div class="flex flex-col gap-1.5 mb-2">
                          <label class="text-xs font-semibold text-content-muted">Status</label>
                          <div class="flex flex-wrap gap-1.5">
                            <button
                              v-for="opt in statusFilterOptions"
                              :key="opt.value"
                              @click="selectTableFilter('status', opt.value)"
                              class="px-2.5 py-1.5 border rounded-md text-sm font-semibold transition-all flex items-center gap-1.5"
                              :class="
                                filterStatus === opt.value
                                  ? 'bg-primary border-primary text-white shadow-sm font-bold'
                                  : 'bg-white border-outline-std/60 text-content-dark hover:bg-surface-subtle'
                              "
                            >
                              <AppBadge
                                v-if="opt.value !== 'all'"
                                :status="opt.label"
                                :type="opt.type"
                                size="sm"
                              />
                              <span v-else>{{ opt.label }}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </transition>
                </Teleport>
              </div>
            </template>
            <template #row="{ item, index, headers }">
              <!-- Schedule Row -->
              <template v-if="activeTab === 'schedule'">
                <td class="ui-cell text-center" :style="{ width: headers[0].width }">
                  <span class="font-bold text-content-dark text-sm">{{
                    (currentPage - 1) * pageSize + index + 1
                  }}</span>
                </td>
                <td class="ui-cell text-center" :style="{ width: headers[1].width }">
                  <AppBadge :status="item.schedule.day" type="day" size="sm" />
                </td>
                <td class="ui-cell" :style="{ width: headers[2].width }">
                  <span class="text-sm font-semibold text-content-dark leading-none tabular-nums">{{
                    item.schedule.time
                  }}</span>
                </td>
                <td class="ui-cell text-center" :style="{ width: headers[3].width }">
                  <AppBadge :branch="item.branch || 'HQ'" size="sm" />
                </td>
                <td class="ui-cell text-center" :style="{ width: headers[4].width }">
                  <AppBadge :term="item.term || item.term?.name" />
                </td>
                <td class="ui-cell" :style="{ width: headers[5].width }">
                  <div class="flex items-center -space-x-2 overflow-hidden py-1">
                    <div
                      v-for="tea in (item.assignedTeachers || []).slice(0, 4)"
                      :key="tea.id"
                      class="inline-block h-8 w-8 rounded-full ring-2 ring-white overflow-hidden bg-surface-subtle shadow-sm"
                      :title="tea.name"
                    >
                      <img
                        :src="tea.profileURL || getImageUrl('common/default-avatar')"
                        class="h-full w-full object-cover"
                      />
                    </div>
                    <span
                      v-if="!(item.assignedTeachers && item.assignedTeachers.length)"
                      class="text-xs font-bold text-content-muted italic"
                    >
                      Unassigned
                    </span>
                  </div>
                </td>
                <td class="ui-cell text-center" :style="{ width: headers[6].width }">
                  <div class="flex items-center justify-center py-3 px-3">
                    <div class="w-full max-w-44 flex items-center gap-2.5 h-8 justify-center">
                      <span class="text-sm font-bold text-content-dark tabular-nums shrink-0"
                        >{{ item.currentCount || item.enrolledCount || 0 }}/{{
                          item.capacity || item.maxCapacity
                        }}</span
                      >
                      <div
                        class="flex-1 h-1.5 rounded-full overflow-hidden flex border border-outline-std/5 bg-surface-dark/20"
                      >
                        <div
                          class="h-full bg-primary transition-all duration-700"
                          :style="{
                            width:
                              Math.min(
                                100,
                                item.capacity || item.maxCapacity
                                  ? ((item.currentCount || item.enrolledCount) /
                                      (item.capacity || item.maxCapacity)) *
                                      100
                                  : 0,
                              ) + '%',
                          }"
                        ></div>
                        <div
                          class="h-full bg-surface-dark/10 transition-all duration-700"
                          :style="{
                            width:
                              Math.max(
                                0,
                                100 -
                                  Math.min(
                                    100,
                                    item.capacity || item.maxCapacity
                                      ? ((item.currentCount || item.enrolledCount) /
                                          (item.capacity || item.maxCapacity)) *
                                          100
                                      : 0,
                                  ),
                              ) + '%',
                          }"
                        ></div>
                      </div>
                    </div>
                  </div>
                </td>
                <td class="ui-cell text-center" :style="{ width: headers[7].width }">
                  <AppBadge
                    :status="item.status || item.computedStatus || 'available'"
                    type="academic"
                  />
                </td>
              </template>

              <!-- Teachers Row -->
              <template v-else-if="activeTab === 'teachers'">
                <td class="ui-cell text-center" :style="{ width: headers[0].width }">
                  <span class="font-bold text-content-dark text-sm">{{
                    (currentPage - 1) * pageSize + index + 1
                  }}</span>
                </td>
                <td class="ui-cell" :style="{ width: headers[1].width }">
                  <div class="flex items-center gap-3">
                    <div
                      class="w-8 h-8 rounded-full overflow-hidden border-2 border-white shadow-sm shrink-0"
                    >
                      <img
                        :src="item.profileURL || getImageUrl('common/default-avatar')"
                        class="w-full h-full object-cover"
                      />
                    </div>
                    <div class="flex flex-col">
                      <span class="font-bold text-content-dark text-sm">{{ item.name }}</span>
                    </div>
                  </div>
                </td>
                <td class="ui-cell" :style="{ width: headers[2].width }">
                  <div class="flex flex-wrap gap-1.5 py-1">
                    <template v-if="item.teachingSchedules && item.teachingSchedules.length > 0">
                      <div
                        v-for="(sched, idx) in item.teachingSchedules"
                        :key="idx"
                        class="flex items-center gap-2 px-2 py-1 rounded-sm bg-primary-soft border border-primary/10"
                      >
                        <AppBadge :status="sched.day" type="day" />
                        <span
                          class="text-sm font-semibold text-content-dark leading-none tabular-nums"
                        >
                          {{ sched.time }}
                        </span>
                      </div>
                    </template>
                    <span v-else class="text-sm font-bold text-content-muted/60 italic">
                      No Active Classes
                    </span>
                  </div>
                </td>
                <td class="ui-cell text-center" :style="{ width: headers[3].width }">
                  <div class="flex flex-wrap gap-1 justify-center">
                    <AppBadge
                      v-for="bName in Array.isArray(item.branchesTeaching) &&
                      item.branchesTeaching.length
                        ? item.branchesTeaching
                        : [item.branch]"
                      :key="bName"
                      :branch="bName"
                    />
                  </div>
                </td>
                <td class="ui-cell" :style="{ width: headers[4].width }">
                  <span class="text-sm text-content-muted">{{ item.email }}</span>
                </td>
                <td class="ui-cell" :style="{ width: headers[5].width }">
                  <span class="text-sm text-content-muted tabular-nums">{{
                    item.phone || item.phoneNumber
                  }}</span>
                </td>
              </template>

              <!-- Students Row -->
              <template v-else-if="activeTab === 'students'">
                <td class="ui-cell text-center" :style="{ width: headers[0].width }">
                  <span class="font-bold text-content-dark text-sm">{{
                    (currentPage - 1) * pageSize + index + 1
                  }}</span>
                </td>
                <td class="ui-cell" :style="{ width: headers[1].width }">
                  <div class="flex items-center gap-3">
                    <div
                      class="w-8 h-8 rounded-full overflow-hidden border-2 border-white shadow-sm shrink-0"
                    >
                      <img
                        :src="item.student?.profileURL || getImageUrl('common/default-avatar')"
                        class="w-full h-full object-cover"
                      />
                    </div>
                    <div class="flex flex-col">
                      <span class="font-bold text-content-dark text-sm">{{
                        item.student?.name || 'Unknown Student'
                      }}</span>
                    </div>
                  </div>
                </td>
                <td class="ui-cell" :style="{ width: headers[2].width }">
                  <span class="text-sm font-bold text-content-dark">{{ item.parentName }}</span>
                </td>
                <td class="ui-cell" :style="{ width: headers[3].width }">
                  <span class="text-sm font-semibold text-content-dark tabular-nums">{{
                    item.parentPhone
                  }}</span>
                </td>
                <td class="ui-cell" :style="{ width: headers[4].width }">
                  <span class="text-sm text-content-muted truncate block max-w-[170px]">{{
                    item.parentEmail
                  }}</span>
                </td>
                <td class="ui-cell text-center" :style="{ width: headers[5].width }">
                  <AppBadge :term="item.termName" />
                </td>
                <td class="ui-cell text-center" :style="{ width: headers[6].width }">
                  <AppBadge :branch="item.branchName" />
                </td>
                <td
                  class="ui-cell text-center tabular-nums text-sm font-bold text-content-dark"
                  :style="{ width: headers[7].width }"
                >
                  {{ item.student?.age ? item.student.age : 'N/A' }}
                </td>
                <td class="ui-cell text-center" :style="{ width: headers[8].width }">
                  <AppBadge
                    :status="item.status || item.paymentStatus || 'Enrolled'"
                    :type="
                      ['paid', 'active', 'confirmed'].includes(
                        String(item.status || item.paymentStatus).toLowerCase(),
                      )
                        ? 'success'
                        : 'warning'
                    "
                  />
                </td>
              </template>

              <!-- Trials Row -->
              <template v-else-if="activeTab === 'trials'">
                <td class="ui-cell text-center" :style="{ width: headers[0].width }">
                  <span class="font-bold text-content-dark text-sm">{{
                    (currentPage - 1) * pageSize + index + 1
                  }}</span>
                </td>
                <td class="ui-cell" :style="{ width: headers[1].width }">
                  <div class="flex items-center gap-3">
                    <div
                      class="w-8 h-8 rounded-full overflow-hidden border-2 border-white shadow-sm shrink-0"
                    >
                      <img
                        :src="item.student?.profileURL || getImageUrl('common/default-avatar')"
                        class="w-full h-full object-cover"
                      />
                    </div>
                    <div class="flex items-center">
                      <span class="font-bold text-content-dark text-sm">{{
                        item.student?.name || item.guestStudentName || 'Prospect Student'
                      }}</span>
                    </div>
                  </div>
                </td>
                <td class="ui-cell" :style="{ width: headers[2].width }">
                  <div class="flex items-center gap-3">
                    <div
                      class="w-8 h-8 rounded-full overflow-hidden border-2 border-white shadow-sm shrink-0"
                    >
                      <img
                        :src="item.parent?.profileURL || getImageUrl('avatar-admin-female')"
                        class="w-full h-full object-cover"
                      />
                    </div>
                    <div class="flex items-center">
                      <span class="font-bold text-content-dark text-sm">{{
                        item.parent?.name || item.guestParentName || 'Guest Parent'
                      }}</span>
                    </div>
                  </div>
                </td>
                <td class="ui-cell" :style="{ width: headers[3].width }">
                  <span class="text-sm font-semibold text-content-dark tabular-nums">{{
                    item.parent?.phone || item.guestParentPhone || item.parent?.email || 'N/A'
                  }}</span>
                </td>
                <td class="ui-cell text-center" :style="{ width: headers[4].width }">
                  <AppBadge :branch="item.branch?.name || item.branch?.abbr || 'HQ'" />
                </td>
                <td class="ui-cell text-center" :style="{ width: headers[5].width }">
                  <div class="flex flex-col items-center">
                    <span class="ui-cell-muted">
                      {{ formatDateOnly(item.trialDate) }}
                      <span v-if="item.trialTime">at {{ item.trialTime }}</span>
                    </span>
                  </div>
                </td>
                <td class="ui-cell text-center" :style="{ width: headers[6].width }">
                  <div class="flex flex-col items-center gap-1">
                    <AppBadge
                      :status="item.isSuccessful ? 'Successful' : item.status || 'confirmed'"
                      type="trial"
                    />
                  </div>
                </td>
              </template>

              <!-- Distribution Row (Branch-Wise Financial & Performance Analysis) -->
              <template v-else-if="activeTab === 'distribution'">
                <td class="ui-cell text-center" :style="{ width: headers[0].width }">
                  <span class="font-bold text-content-dark text-sm">{{
                    (currentPage - 1) * pageSize + index + 1
                  }}</span>
                </td>
                <td class="ui-cell" :style="{ width: headers[1].width }">
                  <span class="font-bold text-content-dark text-sm tracking-tight">{{
                    item.branch?.name
                  }}</span>
                </td>
                <td class="ui-cell" :style="{ width: headers[2].width }">
                  <span class="text-sm font-bold text-content-muted tabular-nums">{{
                    item.term?.name
                  }}</span>
                </td>
                <td class="ui-cell text-center" :style="{ width: headers[3].width }">
                  <AppBadge
                    :status="item.branch?.abbr || 'N/A'"
                    :type="item.branch?.color || 'blue'"
                  />
                </td>

                <!-- Today Section -->
                <td class="ui-cell text-center" :style="{ width: headers[4].width }">
                  <AppBadge :status="item.todayNew > 0 ? '+' + item.todayNew : '0'" type="green" />
                </td>
                <td class="ui-cell text-center" :style="{ width: headers[5].width }">
                  <AppBadge
                    :status="item.todayTrial > 0 ? '+' + item.todayTrial : '0'"
                    type="blue"
                  />
                </td>
                <td class="ui-cell text-center" :style="{ width: headers[6].width }">
                  <AppBadge :status="'$' + formatPrice(item.todayRev)" type="magenta" />
                </td>

                <!-- Week Section -->
                <td class="ui-cell text-center" :style="{ width: headers[7].width }">
                  <span class="tabular-nums font-bold text-sm">{{ item.weekNew }}</span>
                </td>
                <td class="ui-cell text-center" :style="{ width: headers[8].width }">
                  <span class="tabular-nums font-bold text-sm">{{ item.weekTrial }}</span>
                </td>
                <td class="ui-cell text-center" :style="{ width: headers[9].width }">
                  <AppBadge :status="'$' + formatPrice(item.weekRev)" type="purple" />
                </td>

                <!-- Lifetime Section -->
                <td class="ui-cell text-center" :style="{ width: headers[10].width }">
                  <span class="tabular-nums font-bold text-sm">{{ item.classCount }}</span>
                </td>
                <td class="ui-cell text-center" :style="{ width: headers[11].width }">
                  <span class="tabular-nums font-bold text-sm">{{ item.studentCount }}</span>
                </td>
                <td class="ui-cell text-center" :style="{ width: headers[12].width }">
                  <AppBadge :status="'$' + formatPrice(item.totalRev)" type="green" />
                </td>
                <td class="ui-cell text-center" :style="{ width: headers[13].width }">
                  <AppBadge :status="'$' + formatPrice(item.pendingRev)" type="orange" />
                </td>
              </template>
            </template>
          </DataTable>
        </section>
      </template>

      <template #right-content v-if="program">
        <div class="flex flex-col gap-md">
          <!-- Basic Info Card -->
          <section class="ui-detail-card flex flex-col items-center gap-6">
            <h2 class="w-full font-bold text-content-dark text-center">Basic Information</h2>
            <div class="relative group">
              <div
                class="w-40 h-40 rounded-full overflow-hidden ring-4 ring-white shadow-2xl transition-transform duration-500 group-hover:scale-105 border-2 border-gray-100 bg-surface-subtle p-6"
              >
                <img
                  :src="
                    getProgramProfileURL(
                      program.profileURL,
                      program.category,
                      resolvedCategory?.profileURL || program.categorySnapshot?.profileURL,
                    )
                  "
                  alt="Program Logo"
                  class="w-full h-full object-contain"
                />
              </div>
            </div>
          </section>

          <!-- Program Details Card -->
          <section class="ui-detail-card">
            <div class="space-y-5">
              <div class="flex justify-between gap-1">
                <span class="text-lg font-bold text-content-dark">Program Name:</span>
                <span class="text-md font-bold text-content-muted">{{ program.name }}</span>
              </div>
              <div class="flex justify-between gap-1">
                <span class="text-lg font-bold text-content-dark">Category:</span>
                <span class="text-md font-bold text-content-muted">{{
                  program.category || 'Standard'
                }}</span>
              </div>
              <div class="flex justify-between gap-1">
                <span class="text-lg font-bold text-content-dark">Level:</span>
                <span class="text-md font-bold text-content-muted">{{
                  program.level || 'Standard'
                }}</span>
              </div>
              <div class="flex justify-between gap-1">
                <span class="text-lg font-bold text-content-dark">Type:</span>
                <AppBadge :status="program.type || 'Group'" type="tag" />
              </div>
              <div class="flex justify-between gap-1">
                <span class="text-lg font-bold text-content-dark">Base Price:</span>
                <AppBadge :status="'$' + (program.basePrice || 0)" type="blue" />
              </div>
              <div class="flex justify-between gap-1">
                <span class="text-lg font-bold text-content-dark">Sessions:</span>
                <span class="text-md font-bold text-content-muted tabular-nums">{{
                  program.totalSessions || 0
                }}</span>
              </div>
              <div class="flex justify-between gap-1">
                <span class="text-lg font-bold text-content-dark">Age Range:</span>
                <span class="text-md font-bold text-content-muted"
                  >{{ program.minAge }} - {{ program.maxAge }} years</span
                >
              </div>
              <div class="flex justify-between gap-1">
                <span class="text-lg font-bold text-content-dark">Duration:</span>
                <span class="text-md font-bold text-content-muted tabular-nums"
                  >{{ program.duration || 0 }} minutes</span
                >
              </div>
              <div class="flex justify-between gap-1">
                <span class="text-lg font-bold text-content-dark">Status:</span>
                <div>
                  <AppBadge :status="getProgramDisplayStatus(program)" type="academic" />
                </div>
              </div>
              <div v-if="program.description">
                <span class="text-lg font-bold text-content-dark">Description:</span>
                <p class="text-sm font-medium text-content-muted leading-relaxed italic">
                  {{ program.description }}
                </p>
              </div>
            </div>
          </section>
          <TimestampCard
            :createdAt="program.createdAt"
            :updatedAt="program.updatedAt"
            :createdBy="program.createdBy"
            :modifiedBy="program.modifiedBy"
            :item="program"
          />
        </div>
      </template>
    </DetailPageLayout>
    <ProgramActionModal
      :isOpen="actionModal.isOpen"
      :type="actionModal.type"
      :program="actionModal.program"
      :loading="actionModal.loading"
      v-model:error="actionModal.error"
      v-model:success="actionModal.success"
      @close="closeModal"
      @submit="handleActionSubmit"
    />
  </DashboardLayout>
</template>

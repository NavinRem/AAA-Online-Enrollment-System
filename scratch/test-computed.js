/* eslint-disable no-undef */
const branches = [
  {
    id: 'branch-main',
    name: 'Main Campus',
    code: 'MC',
    color: '#8B5CF6',
    abbr: 'MC',
  },
  {
    id: 'branch-west',
    name: 'West Campus',
    code: 'WC',
    color: '#10B981',
    abbr: 'WC',
  },
]

const termData = [
  {
    id: 'term-global-active',
    name: 'Global Active Term',
    status: 'active',
    startDate: '2026-05-01',
    endDate: '2026-08-31',
    branchIds: [],
    totalSessions: 12,
  },
]

const getGroupedSettings = (item) => {
  if (!item.branchSettings?.length) return []
  return [] // mocked
}

const todayStr = '2026-05-19'

const candidates = termData.filter(
  (t) =>
    t.status === 'active' || (t.startDate <= todayStr && t.endDate >= todayStr),
)

const activeTerms = candidates
  .map((t) => {
    const allGroups = getGroupedSettings(t)
    const activeGroups = allGroups.filter((g) => g.status === 'active')

    const branchIds = t.branchIds || (t.branchId ? [t.branchId] : [])
    const enrichedBranches = branchIds
      .map((bId) => {
        const branch = branches.find((b) => String(b.id) === String(bId))
        return branch ? { abbr: branch.abbr, color: branch.color } : null
      })
      .filter(Boolean)

    return {
      ...t,
      branches: enrichedBranches,
      groupedSettings: activeGroups,
    }
  })
  .filter((t) => !t.branchSettings?.length || t.groupedSettings.length > 0)

const fs = require('fs');
fs.writeFileSync('scratch/output.txt', JSON.stringify(activeTerms, null, 2));

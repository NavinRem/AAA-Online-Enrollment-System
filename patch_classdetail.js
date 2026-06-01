const fs = require('fs')
const path = require('path')

const file = path.join(__dirname, 'frontend/src/views/ClassDetail.vue')
let content = fs.readFileSync(file, 'utf8')

// 1. Replace attendanceHeaders base
content = content.replace(
  /const base = \[\s*{\s*label: 'No'.*?},\s*{\s*label: 'Name'.*?},\s*{\s*label: 'Level'.*?},\s*{\s*label: 'Timeslot'.*?},\s*\]/s,
  `const base = [
    { label: 'No', width: '50px', align: 'center' },
    { label: 'Name', width: '220px' },
    { label: 'Start Date', width: '120px', align: 'center' },
    { label: 'Sessions Enrolled', width: '140px', align: 'center' },
  ]`
)

// 2. Replace row rendering for the first 4 columns
content = content.replace(
  /<td class="ui-cell text-center" :style="{ width: headers\[0\]\.width }">.*?<td class="ui-cell text-center font-bold text-content-muted text-xs tabular-nums">\s*{{ primarySchedule\.time }}\s*<\/td>/s,
  `<td class="ui-cell text-center" :style="{ width: headers[0].width }">
                <span class="font-bold text-content-dark text-sm">{{
                  (currentPage - 1) * pageSize + index + 1
                }}</span>
              </td>
              <td class="ui-cell">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-full overflow-hidden bg-surface-subtle border border-outline-std flex-shrink-0">
                    <img v-if="item.student?.profileURL" :src="item.student.profileURL" class="w-full h-full object-cover" />
                    <User v-else class="w-6 h-6 m-2 text-content-muted" />
                  </div>
                  <div class="flex flex-col">
                    <span class="font-bold text-content-dark text-sm leading-tight">{{
                      item.student?.name || 'Unknown'
                    }}</span>
                    <span class="text-3xs font-bold text-content-muted tracking-tighter">{{
                      item.student?.nickname || 'No Nick'
                    }}</span>
                  </div>
                </div>
              </td>
              <td class="ui-cell text-center font-bold text-content-dark text-xs">
                {{ formatDateOnly(item.enrollAt) || 'N/A' }}
              </td>
              <td class="ui-cell text-center font-bold text-content-dark text-xs">
                {{ item.enrolledSessions || 0 }} sessions
              </td>`
)

fs.writeFileSync(file, content)

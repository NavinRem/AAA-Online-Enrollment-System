const fs = require('fs')
const path = require('path')

const file = path.join(__dirname, 'frontend/src/views/ClassDetail.vue')
let content = fs.readFileSync(file, 'utf8')

// Remove v-if/v-else for profileURL and just use getStudentProfileURL
content = content.replace(
  /<img v-if="item.student\?\.profileURL" :src="item\.student\.profileURL" class="w-full h-full object-cover" \/>\s*<User v-else class="w-6 h-6 m-2 text-content-muted" \/>/s,
  `<img :src="getStudentProfileURL(item.student?.profileURL)" class="w-full h-full object-cover" />`
)

// Replace CheckCircle2 with simple svg icon
const checkSvg = `<svg v-if="item.hasPassedExam" xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`

content = content.replace(
  /<CheckCircle2 v-if="item\.hasPassedExam" class="w-4 h-4" \/>/s,
  checkSvg
)

const checkSvgRC = `<svg v-if="item.hasReceivedReportCard" xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`

content = content.replace(
  /<CheckCircle2 v-if="item\.hasReceivedReportCard" class="w-4 h-4" \/>/s,
  checkSvgRC
)

const checkSvgCert = `<svg v-if="item.hasReceivedCertificate" xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`

content = content.replace(
  /<CheckCircle2 v-if="item\.hasReceivedCertificate" class="w-4 h-4" \/>/s,
  checkSvgCert
)

fs.writeFileSync(file, content)

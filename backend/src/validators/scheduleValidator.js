const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

function normalizeTime(time) {
  return String(time || '').trim()
}

function validateSchedule(scheduleData) {
  const fields = ['day', 'time']
  Object.keys(scheduleData).forEach((key) => {
    if (!fields.includes(key)) throw new Error(`Invalid field: ${key}`)
  })

  if (!scheduleData.day) throw new Error('Schedule day is required')
  if (!scheduleData.time) throw new Error('Schedule time is required')
  if (!DAYS.includes(scheduleData.day)) throw new Error('Invalid schedule day')

  return {
    day: scheduleData.day,
    time: normalizeTime(scheduleData.time),
    isDeleted: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

function validateUpdateSchedule(updateData) {
  const allowedFields = ['day', 'time']
  const cleanData = {}

  Object.keys(updateData).forEach((key) => {
    if (allowedFields.includes(key)) cleanData[key] = updateData[key]
  })

  if (cleanData.day && !DAYS.includes(cleanData.day)) {
    throw new Error('Invalid schedule day')
  }
  if (cleanData.time !== undefined) cleanData.time = normalizeTime(cleanData.time)

  cleanData.updatedAt = new Date().toISOString()
  return cleanData
}

module.exports = { validateSchedule, validateUpdateSchedule }

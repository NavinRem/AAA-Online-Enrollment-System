class DateHelper {
  validateAndParseDate(
    dateStr,
    fieldName = 'Date',
    options = { allowFuture: false },
  ) {
    if (!dateStr) throw new Error(`${fieldName} is required`)

    const dateRegex = /^(\d{4})-(\d{2})-(\d{2})$/
    const match = dateStr.match(dateRegex)

    if (!match) {
      throw new Error(
        `Invalid ${fieldName} format: "${dateStr}". Please use YYYY-MM-DD.`,
      )
    }

    const year = parseInt(match[1], 10)
    const month = parseInt(match[2], 10)
    const day = parseInt(match[3], 10)

    if (month < 1 || month > 12) {
      throw new Error(
        `Invalid Month in ${fieldName}: "${month}". Must be between 01 and 12.`,
      )
    }

    const daysInMonth = new Date(year, month, 0).getDate()
    if (day < 1 || day > daysInMonth) {
      throw new Error(
        `Invalid Day in ${fieldName}: "${day}". Day must be between 01 and ${daysInMonth} for the selected month.`,
      )
    }

    const dateObj = new Date(year, month - 1, day)

    if (!options.allowFuture && dateObj > new Date()) {
      throw new Error(`${fieldName} "${dateStr}" cannot be in the future.`)
    }

    return dateObj
  }

  formatDate(date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  getTodayString() {
    return this.formatDate(new Date())
  }

  calculateEndDate(startDateStr, sessionCount) {
    const start = this.validateAndParseDate(startDateStr, 'Start Date', { allowFuture: true })
    const end = new Date(start)
    // 11 sessions = 10 weeks after start date
    end.setDate(start.getDate() + (sessionCount - 1) * 7)
    return this.formatDate(end)
  }

  calculateSessionCount(startDateStr, endDateStr) {
    const start = this.validateAndParseDate(startDateStr, 'Start Date', { allowFuture: true })
    const end = this.validateAndParseDate(endDateStr, 'End Date', { allowFuture: true })
    const diffMs = end - start
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
    // 70 days = 10 weeks = 11 sessions
    return Math.floor(diffDays / 7) + 1
  }

  calculateStatus(startDateStr, endDateStr) {
    const today = this.getTodayString()
    if (today > endDateStr) return 'archived'
    if (today < startDateStr) return 'upcoming'
    return 'active'
  }
}

module.exports = new DateHelper()

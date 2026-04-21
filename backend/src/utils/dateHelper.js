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

  getTodayString() {
    return new Date().toISOString().split('T')[0]
  }
}

module.exports = new DateHelper()

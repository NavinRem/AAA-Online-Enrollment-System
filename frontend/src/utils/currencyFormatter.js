/**
 * Formats a numeric value into a standard currency string (2 decimal places if needed).
 * 
 * @param {number|string} val - The numeric value to format
 * @returns {string} - The formatted price string (e.g., "130.91")
 */
export const formatPrice = (val) => {
  if (val === undefined || val === null || val === '') return '0'
  
  const num = Number(val)
  if (isNaN(num)) return '0'
  
  // If it's an integer, return as is. Otherwise, 2 decimal places.
  return Number.isInteger(num) ? num.toString() : num.toFixed(2)
}
